# DesignerField 性能优化文档

## 问题现象

1. 交互发生时触发全量更新，所有组件重渲染
2. 选中图层时，物料数量多的情况下高亮延迟明显

## 根因分析

### 问题 1：交互触发全量更新

**文件**：`src/plugins/interaction/component/hooks.ts`

`useInteractionsPreprocessor` 中第 35 行订阅了全局 `interactions` 数组：

```typescript
const interactionList = useSelector((state: any) => state.component.interactions);
```

每次交互派发时，reducer（`reducer.ts`）通过 immer `produce` 返回新的数组引用，导致所有使用该 hook 的组件都感知到变化并重新计算，即使交互内容跟当前组件无关。

对比同文件中 `useCreateInteractionApi`（第 216-225 行）的 `subscribeState`，它在 selector 内部按 `uniqueId` 过滤，只返回当前组件相关的交互项，是正确的做法。

### 问题 2：选中图层高亮延迟

**文件**：`src/designer/renderer/DesignerField.jsx`（已重构为 `designer-field/index.tsx`）

`DesignerField` 的 selector 订阅了完整的 `selected` 字符串：

```javascript
const { selected, modalVisible, designerType } = useSelector(
    (fullState) => ({
        selected: fullState.component.selected,
        // ...
    }),
    shallowEqual,
);
```

`selected` 是一个字符串（如 `"aaa,bbb,ccc"`），选中任何组件变化时，所有 `DesignerField` 都会收到新的 `selected` 值并重渲染。

`selected` 在 `DesignerField` 中的使用分为两类：

| 分类 | 使用点 | 需要的数据 |
|------|--------|-----------|
| 渲染期间 | `hasSelected`、`selectedFieldInGroup`、`classNames`、`overwriteStyleBorder`、`grid-line` 样式、`AlignLine` | 两个布尔值 |
| 事件回调 | `handleClick`（多选处理）、`onDragStopHandle`（同步位置）、`onResizeHandle`（判断多选） | 完整 `selected` 字符串 |

渲染期间只需要"自己是否被选中"和"组内是否有子元素被选中"两个布尔值，但订阅了完整字符串导致全量重渲染。

### 其他存在类似问题的文件

| 文件 | 行 | 问题 |
|------|-----|------|
| `src/designer/canvas-graph/index.js` | 70-72 | `useSelector` 返回新对象无 equality 函数 |
| `src/designer/DesignerContent.tsx` | 119 | 订阅了整个 `component` 对象，无 equality 函数 |
| `src/plugins/data-fetcher/GlobalDataFetcher.ts` | 48-51 | 订阅 `interactions` 返回新对象无 equality 函数 |
| `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` | 13-15 | `useSelector` 返回新对象无 equality 函数 |

## 修复方案

### DesignerField selector 优化

**核心思路**：selector 内部按 `uniqueId` 过滤，只返回当前组件渲染需要的布尔值；事件回调中需要完整 `selected` 时，通过 `store.getState()` 惰性获取。

**改动点**：

1. **selector 改造**：不再订阅完整 `selected` 字符串，在 selector 内部计算 `hasSelected`（布尔）和 `selectedFieldInGroup`（布尔）

2. **`useSelectedFieldInGroup` hook → `checkSelectedFieldInGroup` 纯函数**：从 hook 改为纯函数，在 selector 中调用

3. **新增 `useStore` + `getSelected()`**：事件回调中通过 `store.getState().component.selected` 同步获取，不触发订阅

4. **`isGroup` 声明位置提前**：因 selector 中需要用到，提前到 selector 之前

**优化效果**：

选中从 `aaa` 变为 `bbb` 时：
- `aaa` 组件：`hasSelected` 从 `true` → `false`，重渲染（取消高亮）
- `bbb` 组件：`hasSelected` 从 `false` → `true`，重渲染（高亮）
- 其他所有组件：`hasSelected` 和 `selectedFieldInGroup` 都不变，`shallowEqual` 判等，不重渲染

### 文件拆分

将 `DesignerField.jsx` 拆分到 `designer-field/` 目录：

```
designer-field/
├── index.tsx      — 主组件（DesignerField）
├── types.ts       — 类型定义（DataSource、DesignerFieldProps、Rnd回调类型等）
├── utils.ts       — 纯函数工具（样式计算、位置计算、选中逻辑、resize等）
└── AlignLine.tsx  — 对齐线 UI 组件
```

## 文件变更清单

| 操作 | 文件 |
|------|------|
| 备份 | `src/designer/renderer/DesignerField.bak.jsx` |
| 删除 | `src/designer/renderer/DesignerField.jsx`（原文件） |
| 新建 | `src/designer/renderer/designer-field/index.tsx` |
| 新建 | `src/designer/renderer/designer-field/types.ts` |
| 新建 | `src/designer/renderer/designer-field/utils.ts` |
| 新建 | `src/designer/renderer/designer-field/AlignLine.tsx` |
| 修改 | `src/designer/renderer/index.js` — 导入路径改为 `./designer-field` |

## 待办

以下文件存在类似的 selector 订阅粒度过粗问题，后续可按相同思路优化：

- `src/designer/canvas-graph/index.js` 第 70 行
- `src/designer/DesignerContent.tsx` 第 119 行
- `src/plugins/data-fetcher/GlobalDataFetcher.ts` 第 48 行
- `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` 第 13 行
- `src/plugins/interaction/component/hooks.ts` 第 35 行（`useInteractionsPreprocessor`）
