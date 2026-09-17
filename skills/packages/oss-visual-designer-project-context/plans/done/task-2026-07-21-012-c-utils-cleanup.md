# 工具函数清理 - 子任务 C：渲染路径迁移 + onValueChange 修复 + AGENTS.md

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-012-c`
> 上游任务：
> - [task-2026-07-21-012-a-utils-cleanup](./task-2026-07-21-012-a-utils-cleanup.md)
> - [task-2026-07-21-012-b-utils-cleanup](./task-2026-07-21-012-b-utils-cleanup.md)
> 状态：`done`
> 类型：`refactor` + `chore`
>
> **风险等级：中（删除函数 + 文档同步）**

---

## 1. 背景

承接 task-012-a/b。本任务完成最后一步：

1. 渲染路径调用方迁移到 `useFieldConf` hook（字段级订阅）
2. 删除 `getFieldConf` / `getParent` 函数定义（活跃调用方已全部迁移）
3. 修正 `DesignerContent.onValueChange` 的 `setLevelPath` 丢弃返回值问题
4. AGENTS.md 文档同步

---

## 2. 目标

迁移以下 9 个文件 + 删除 2 个函数 + 修 1 个文件 + 更新 1 个文档：

### 2.1 渲染路径迁移（9 文件）

| # | 文件 | 替换方案 |
| --- | --- | --- |
| 1 | `src/designer/canvas-graph/index.tsx` | L232/L316 `getFieldConf(components, selected/item)` → `useFieldConf(selected/item)` |
| 2 | `src/designer/configuration-panel/index.js` | L32 `getFieldConf(components, selected)` → `useFieldConf(selected)` |
| 3 | `src/designer/configuration-panel/group/index.js` | 同上 |
| 4 | `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` | 同上 |
| 5 | `src/designer/aside-panel/layers-tree/index.jsx` | L49 `getFieldConf(state.components, selected)` → `useFieldConf(selected)` |
| 6 | `src/designer/context-menu/hooks/useConvertMenuState.tsx` | L31 `getFieldConf(latestCache.current.designerState.components, node.uniqueId)` → `latestCache.current.byId[node.uniqueId]` |
| 7 | `src/designer/renderer/designer-field/index.tsx` | L227 `getParent(...)` → `useFieldConf(parentMap[selectedIds[0]])`；L233 `getFieldConf(state.components, item)` → `useFieldConf(item)` |
| 8 | `src/designer/DesignerContent.tsx` | L245 `getParent(state.components, selectedIds[0], ...)` → `useFieldConf(parentMap[selectedIds[0]])` |
| 9 | `src/designer/renderer/designer-field/utils.ts` | L141 `getSelectedKeys(state.components, ...)` → 改造为接收 byId + parentMap（与 utils.ts 同步） |

### 2.2 删除函数定义

文件：`src/designer/renderer/utils.ts`

- 删除 `getFieldConf` 函数（L153-168）
- 删除 `getParent` 函数（L100-117）

### 2.3 修复 `onValueChange`

文件：`src/designer/DesignerContent.tsx`（L248-279）

按原 plan §3.2 方案 A：删除无效 `setLevelPath` 调用 + 简化注释 + 移除顶部不再使用的 `setLevelPath` import。

### 2.4 AGENTS.md 同步

文件：`AGENTS.md`

按原 plan §3.3 改写 §3.2 / §5.1。

---

## 3. 关键设计决策

### 3.1 渲染路径统一为 `useFieldConf` hook

所有"读组件配置"场景改为：

```ts
// 旧（render path）
const currentField = getFieldConf(components, selected);

// 新
const currentField = useFieldConf(selected);
```

`useFieldConf` 是字段级订阅（task-007 引入），仅在该组件 FlatField 引用变化时触发 re-render，性能优于原 `getFieldConf` + `useSelector(state => state.designerCanvas.components)`。

### 3.2 parent.children 访问

`designer-field/index.tsx` L227 与 `DesignerContent.tsx` L245 用 `getParent` 的目的是取 `parent.uniqueId`（不取 children），可用 `useFieldConf(parentMap[selectedIds[0]])` 替代。

若需 `parent.children`，用 task-012-a 新增的 `getFieldNodeById`。

### 3.3 `useConvertMenuState` 的 latestCache

`useConvertMenuState` 内部用 `latestCache.current.designerState.components` —— 这是从 `DataProvider` 兼容壳删除前遗留的"读 state 快照"模式。task-011-fix 已部分清理。

本任务把 `getFieldConf(latestCache.current.designerState.components, ...)` 改为 `latestCache.current.byId[...]` —— 需要在 `latestCache` 写入时同步存 byId（详见调用方 DesignerContextMenu）。

### 3.4 `designer-field/utils.ts` 的 `getSelectedKeys` 改造

`utils.ts` 的 `getSelectedKeys(fields, keys, parent)` 内部调用 `getParent`。task-012-a 阶段未改签名（避免影响外部调用方），本任务改为：

```ts
// utils.ts
export function getSelectedKeys(byId: Record<string, FlatField>, parentMap: Record<string, string>, keys: string[]): string {
    const allParentKeys = keys
        .map((item) => byId[parentMap[item]]?.uniqueId)
        .filter(Boolean);
    const parentsKeys = [...new Set(allParentKeys)];
    if (parentsKeys.length > 1 || keys.includes(ROOT_UNIQUE_ID)) {
        return keys[keys.length - 1];
    } else {
        return keys.join(',');
    }
}
```

调用方 `designer-field/utils.ts` 与 `aside-panel/layers-tree/tree/index.tsx` 传入 `byId` + `parentMap`。

### 3.5 `onValueChange` 修复

按原 plan §3.2 方案 A：

```ts
const onValueChange = usePersistFn((uniqueId: any, value: any, _level = 0) => {
    // task-012-c（2026-07-21）：删除 setLevelPath 调用（drillDownLevel 重置已永久放弃）
    // - 旧实现 setLevelPath 不可变版返回新数组但丢弃，浪费 CPU 且语义不清晰
    // - 字段级 patch（submitFieldConfig）不依赖 drillDownLevel
    if (_level > 0) {
        console.warn('[DesignerContent.onValueChange] drillDown level > 0 is not supported. uniqueId:', uniqueId, 'level:', _level);
        return;
    }
    submitFieldConfig(uniqueId, value);
});
```

同时移除文件顶部 `setLevelPath` 的 import（如果仅 onValueChange 用过）。

### 3.6 AGENTS.md 改写

按原 plan §3.3：

**§3.2 当前警告**：
```md
- ⚠️ `designerCanvas` slice 迁入 Redux 后，`state.components` 已是 Immer frozen 对象，**任何地方都不允许直接 mutation**
- ⚠️ `getFieldConf` / `getParent` 函数已删除（task-012-c），**必须**通过 `useFieldConf(uniqueId)` / `byId[id]` 读
- ✅ `setLevelPath` 不可变版——当前无活跃调用方。**如需修改请走 `dispatch(updateFieldConfig(id, patch))` + 字段级 patch**
```

**§5.1 slice 表**：`designerCanvas` 行精简（移除 task 编号罗列）。

---

## 4. 详细步骤

### 步骤 1：迁移 canvas-graph/index.tsx

按 §2.1 #1。

### 步骤 2：迁移 configuration-panel 三个文件

按 §2.1 #2-4。

### 步骤 3：迁移 layers-tree/index.jsx

按 §2.1 #5。

### 步骤 4：迁移 useConvertMenuState.tsx

按 §2.1 #6。注意 latestCache.byId 来源（需要回查 DesignerContextMenu 写入 latestCache 的代码）。

### 步骤 5：迁移 designer-field/utils.ts

按 §2.1 #9（getSelectedKeys 签名变更）。

### 步骤 6：迁移 designer-field/index.tsx

按 §2.1 #7。

### 步骤 7：迁移 DesignerContent.tsx

按 §2.1 #8 + §3.5（onValueChange 修复）。

### 步骤 8：删除 utils.ts 中的 `getFieldConf` / `getParent` 函数定义

按 §2.2。

### 步骤 9：迁移 aside-panel/layers-tree/tree/index.tsx

getSelectedKeys 调用方同步更新（步骤 5 已改签名）。

### 步骤 10：AGENTS.md 同步

按 §3.6。

### 步骤 11：grep + tsc 校验

```bash
grep -n "getFieldConf\b\|getParent\b" src/designer/ src/formily/
# 应返回 0 命中（活跃代码）

grep -n "setLevelPath" src/designer/
# 应返回 0 命中（活跃代码），除 setLevelPath 函数自身定义 + utils.ts 注释

pnpm tsc --noEmit
# 零新增错误
```

### 步骤 12：人工冒烟

```bash
pnpm start
```

- [ ] 配置面板 onChange
- [ ] 图层所有操作（置顶/置底/上移/下移/锁定/隐藏/复制/删除）
- [ ] 成组 / 拆组
- [ ] 多选拖拽
- [ ] 拖拽组件入布局组件
- [ ] layers-tree 拖拽
- [ ] context menu 切换子组件（useConvertMenuState 路径）

---

## 5. 验证清单

- [ ] 9 个文件全部完成 `getFieldConf` / `getParent` / `getSelectedKeys` 替换
- [ ] `src/designer/renderer/utils.ts` 删除 `getFieldConf` / `getParent` 函数定义
- [ ] `DesignerContent.tsx` `onValueChange` 删除无效 `setLevelPath` 调用
- [ ] `AGENTS.md` §3.2 / §5.1 同步更新
- [ ] grep `getFieldConf\b\|getParent\b` 在 `src/designer/` 与 `src/formily/` 0 命中（活跃代码）
- [ ] grep `setLevelPath` 在 `src/designer/` 仅命中函数定义 + 注释
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 冒烟清单全部通过
- [ ] 任务文件移到 `plans/done/`
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [ ] 同步更新 AGENTS.md 中相关引用

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `useFieldConf` 返回 `undefined`（组件已删除）时调用方漏判空 | 中 | NPE | 调用方全部加 `?.` 可选链 |
| `latestCache.byId` 来源缺失（useConvertMenuState） | 中 | 运行时 NPE | 同步回查 DesignerContextMenu 写入 latestCache 代码，补 byId 字段 |
| `getSelectedKeys` 签名变更漏改调用方 | 中 | tsc 错误 | grep 校验 + tsc |
| `onValueChange` 删除 `setLevelPath` 后未来真有 drillDown 需求 | 低 | 需要重新实现 | task 文件留有方案 B 的备选实现 |

### 回退方案

- 改造前一次 commit：`refactor(canvas+docs): useFieldConf migration + onValueChange setLevelPath + AGENTS.md sync`
- `getFieldConf` / `getParent` 函数定义可作为 `@deprecated` 兼容壳保留（返回 `byId[id]` / `byId[parentMap[id]]`），下个版本再删
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

- 2026-07-21：任务创建（task-012-c），承接 task-012-a/b 的迁移结果，最终删除函数定义 + 文档同步