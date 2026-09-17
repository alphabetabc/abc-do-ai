# 工具函数清理 + DesignerContent.onValueChange setLevelPath 修正 + 文档一致性收尾

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-012`
> 状态：**`done`** —— 已拆分到 3 个子任务执行（task-012 影响面 ~15 文件，3 类路径，单 task 风险过高），3 个子任务均已完成
> 拆分时间：2026-07-21
> 完成时间：2026-07-21
>
> 拆分原因：
> - 涉及 15+ 文件、3 类路径（渲染 / 工具 / 异步）
> - utils.ts 删函数后中间状态不可编译，需分批 commit
> - 每步独立可回滚，便于风险隔离
>
> 子任务（均已 done）：
> - [task-2026-07-21-012-a-utils-cleanup](./done/task-2026-07-21-012-a-utils-cleanup.md) —— utils.ts 自身闭包（新增 `getFieldNodeById`）
> - [task-2026-07-21-012-b-utils-cleanup](./done/task-2026-07-21-012-b-utils-cleanup.md) —— 工具函数路径调用方迁移（layer-manager + drag2layoutBlock + useOnDrop + element 等 8 文件）
> - [task-2026-07-21-012-c-utils-cleanup](./done/task-2026-07-21-012-c-utils-cleanup.md) —— 渲染路径迁移 + 删除函数定义 + onValueChange 修复 + AGENTS.md 同步（9 文件 + 文档）
>
> 原始内容保留作为设计参考（§1-§7），子任务的实施细节见各自 task 文件。
> 类型：`refactor` + `chore`
>
> **风险等级：中（涉及函数删除与行为对齐文档）**

---

## 1. 背景

`designerCanvas` 迁入 Redux + `byId`/`parentMap` 索引后，几个**历史兼容产物**残留：

1. **`getFieldConf(components, id)` / `getParent(components, id, parent)` 仍以函数形式存在**。task-009 只删了函数内部的 `_.cloneDeep`，但函数本身仍是 O(n) 递归查找，与 `byId[id]` / `parentMap[id]` 的 O(1) 索引访问完全重复。AGENTS.md §3.2 警告"返回浅引用，禁止 mutation"——但函数本身可以删，调用方直接走 `useFieldConf(id)` / `parentMap[id] + byId[parentMap[id]]`。

2. **`DesignerContent.onValueChange` 的 `setLevelPath` 返回值被显式丢弃**（[DesignerContent.tsx#L261](src/designer/DesignerContent.tsx#L261)）：

   ```ts
   (setLevelPath as any)(state.components, null);   // ← 返回值丢弃
   submitFieldConfig(uniqueId, value);
   ```

   注释自承"drillDownLevel 重置语义 task-009 评估"，但语义上 `drillDownLevel` 永远不会更新到 store。当前无活跃 `drillDown level > 0` 调用方，所以不爆雷——但实现与"不可变 `setLevelPath` 返回新树"的语义不一致。

3. **`AGENTS.md` §3.2 关于"禁止 mutation 返回对象"的警告与实际代码矛盾**：警告说"调用方禁止 mutation"，但 `designer-field/index.tsx` L223 与 `move/index.ts` L19-44 仍在 mutation（task-010 已修）。文档要么配合 task-010 修复后调整为"已修，下游约束解除"，要么单独降级。

4. **`AGENTS.md` §3.2 关于 `setLevelPath` 的描述与 `task-009` plan §3.3 的设计文档不完全对齐**：plan 要求"`setLevelPath` 改为遍历 byId"，实际实现是"遍历 components 树（drillDown 子节点不在 byId 里）"。当前实现正确（task-009 §7 实施记录已说明），但文档表述需要同步。

5. **`task-006/007/008/009` 的 plan 与实际 plan/roadmap/index 引用关系**：task-009 的 §5 验证清单中部分项未做但勾选，roadmap.md 标 `done`——本任务不重审这些历史任务（已经归档到 `done/`），只保证新增任务的 plan 文档自洽。

**本任务目标**：

1. 删除 `utils.ts` 中 `getFieldConf` / `getParent` 函数本身（20 处调用方改写为 `byId[id]` / `parentMap[id]`）
2. 修正 `DesignerContent.onValueChange` 的 `setLevelPath` 丢弃返回值问题——决策为"删除 `setLevelPath` 调用"（因为后续接 `submitFieldConfig` 是字段级 patch，不依赖 `drillDownLevel` 重置）
3. AGENTS.md §3.2 / §3.3 / §5.1 与代码实际状态对齐
4. `pnpm tsc --noEmit` 零新增错误

---

## 2. 目标

1. `src/designer/renderer/utils.ts` 删除 `getFieldConf` / `getParent` 函数定义
2. 全部 20 处调用方改写：
   - `getFieldConf(components, id)` → 渲染路径用 `useFieldConf(id)`；工具函数路径用 `byId[id]`（参数传入）或 `store.getState().designerCanvas.byId[id]`
   - `getParent(components, id, rootParent)` → `byId[parentMap[id]]`；需要 parent.children 的场景用 `getFieldNodeById(components, id)`（新增工具函数，task-009 §3.1.2 已设计，本任务落地）
3. `src/designer/DesignerContent.tsx` 的 `onValueChange` 修正：删除无效 `setLevelPath` 调用（或注释清楚"drillDownLevel 更新已永久放弃"）
4. `AGENTS.md` §3.2 / §3.3 / §5.1 同步更新：
   - §3.2 移除 `getFieldConf` / `getParent` 的警告（已删函数）
   - §3.2 / §3.3 同步 `setLevelPath` 决策
   - §5.1 移除 `task-006/007/008/009` 的依赖描述（已归档到 `done/`，引用关系简化）
5. `pnpm tsc --noEmit` 零新增错误

---

## 3. 关键设计决策

### 3.1 `getFieldConf` / `getParent` 调用方分类

按"渲染路径 / 工具函数路径 / 异步回调路径"分类，每类选不同替代方案。

#### 3.1.1 `getFieldConf` 调用方（13 处）

| # | 文件 | 行（大致） | 路径类型 | 替代方案 |
| --- | --- | --- | --- | --- |
| 1 | `src/designer/renderer/utils.ts` | L443（`generatorGroup` 内） | 工具函数 | 接收 `byId` 参数：`byId[item]` |
| 2 | `src/designer/renderer/utils.ts` | L483（`splitGroup` 内） | 工具函数 | 同上 |
| 3 | `src/designer/DataProvider.tsx` | 已删（task-009 删 `useDesignerSettingChange` 路径） | — | — |
| 4 | `src/designer/configuration-panel/index.js` | L31 | 渲染路径 | `useFieldConf(selected)` |
| 5 | `src/designer/configuration-panel/group/index.js` | L27 | 渲染路径 | `useFieldConf(selected)` |
| 6 | `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` | L27 | 渲染路径 | `useFieldConf(selected)` |
| 7 | `src/designer/aside-panel/layers-tree/index.jsx` | L44 | 渲染路径 | `useFieldConf(selected)` |
| 8 | `src/designer/canvas-graph/index.tsx` | L228, L312 | 渲染 + 回调 | 渲染：`useFieldConf(item)`；回调：`store.getState().designerCanvas.byId[item]` |
| 9 | `src/designer/common/field/layout-block/helper/element.tsx` | L129 | 工具函数 | `byId[layoutBlockUniqueId]`（`syncLayoutBlockSize2Children` 签名加 `byId` 参数，或从调用方传入） |
| 10 | `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` | L35, L73 | 工具函数 | `useOnDrop` 接收 `byId` 参数；调用方传入 |
| 11 | `src/designer/layer-manager/lock/index.ts` | L7, L21 | 工具函数 | 接收 `byId` 参数 |
| 12 | `src/designer/layer-manager/visible/index.ts` | L7, L21 | 工具函数 | 同上 |
| 13 | `src/designer/layer-manager/copy/index.tsx` | L18 | 工具函数 | 同上 |
| 14 | `src/designer/renderer/designer-field/index.tsx` | L221, L224 | 渲染 + 回调 | 渲染：`useFieldConf(item)`；回调：`store.getState().designerCanvas.byId[item]` |

> 注：上面计数 13 + 内部 2 处共 15 行命中，其中部分行号仅大致。grep `getFieldConf(` 在 `src/designer/` 排除 `.bak` 实际约 20+ 命中（含 utils.ts 内部 2 处调用）。本任务以 grep 实时结果为准。

**layer-manager 函数签名变化**：

旧（[lock/index.ts](src/designer/layer-manager/lock/index.ts#L6)）：
```ts
const lock = (state: DesignerState, selected: string, handle?: ...) => { ... }
```

新：
```ts
// 接收 byId + parentMap（task-010 改造时一并改，本任务承接）
type LayerManagerCtx = { state: DesignerState; byId: Record<string, FlatField>; parentMap: Record<string, string> };
const lock = (ctx: LayerManagerCtx, selected: string, handle?: ...) => {
    const fieldConf = ctx.byId[selected];   // 不再走 getFieldConf
    if (!fieldConf?.data?.config) return { components: ctx.state.components };
    // ...
};
```

> **决策**：本任务**不**强制要求 layer-manager 函数签名变更。task-010 已包含 `getFieldOrderBy` 去 cloneDeep + `deleteFieldByUniqueId` 重构，本任务只补"删除 `getFieldConf` / `getParent` 函数定义"+"调用方替换"。layer-manager 函数内部仍可保留 `const fieldConf = getFieldConf(state.components, selected)` —— 但此时 `getFieldConf` 已删，需改为 inline O(n) 查找或接收 `byId` 参数。
>
> **推荐方案**：layer-manager 函数签名变更为 `(state, selected, handle?)` → `(state, byId, parentMap, selected, handle?)`，统一在 `src/designer/layer-manager/common.ts` 提供一个 `useLayerManagerContext()` hook 封装。

#### 3.1.2 `getParent` 调用方（9 处）

| # | 文件 | 行（大致） | 路径类型 | 替代方案 |
| --- | --- | --- | --- | --- |
| 1 | `src/designer/renderer/utils.ts` | L297（`getSelectedKeys` 内） | 工具函数 | `byId[parentMap[id]]` |
| 2 | `src/designer/renderer/utils.ts` | L441（`generatorGroup` 内） | 工具函数 | 同上 |
| 3 | `src/designer/renderer/utils.ts` | L482（`splitGroup` 内） | 工具函数 | 同上 |
| 4 | `src/designer/layer-manager/move/index.ts` | L13, L36, L59, L80 | 工具函数 | 接收 `byId` + `parentMap` 参数 |
| 5 | `src/designer/layer-manager/copy/index.tsx` | L12 | 工具函数 | 同上 |
| 6 | `src/designer/layer-manager/delete/index.tsx` | L21 | 工具函数 | 同上 |
| 7 | `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` | L44, L78 | 工具函数 | 接收 `byId` + `parentMap` 参数 |
| 8 | `src/designer/common/draggable/drag2layoutBlock.ts` | L38 | 工具函数 | 同上 |
| 9 | `src/designer/DesignerContent.tsx` | L221 | 渲染路径 | `useFieldConf(parentMap[selectedIds[0]])` 或 `byId[parentMap[selectedIds[0]]]` |
| 10 | `src/designer/renderer/designer-field/index.tsx` | L218 | 渲染路径 | 同上 |

**特殊场景：需要 parent.children 的访问**

`layer-manager/move` 等需要操作父节点 `children` 数组的场景，不能直接用 `byId[parentMap[id]]`（FlatField 不含 children）。

解决方案：**新增 `getFieldNodeById` 工具函数**（task-009 §3.1.2 已设计）：

```ts
/**
 * 从 components 树递归查找指定 uniqueId 的节点（不 cloneDeep）
 * 仅用于"需要 parent.children"的少数场景
 *
 * 与 getParent 的区别：
 * - getParent：返回 parent 节点（含 children）
 * - getFieldNodeById：返回目标节点本身
 *
 * 注意：返回浅引用，禁止 mutation；如需修改走 dispatch。
 */
export function getFieldNodeById(components: any[], uniqueId: string): any | null {
    for (const node of components) {
        if (node.uniqueId === uniqueId) return node;
        if (node.children) {
            const found = getFieldNodeById(node.children, uniqueId);
            if (found) return found;
        }
    }
    return null;
}
```

调用方 `layer-manager/move` 改造：
```ts
// 旧
const parents = getParent(state.components, selected, rootParent);
if (!parents) return;
const { index, components } = getFieldOrderBy(parents.children, selected);

// 新
const parentId = parentMap[selected];
const parentNode = parentId === ROOT_UNIQUE_ID
    ? { uniqueId: ROOT_UNIQUE_ID, children: state.components }   // 虚拟根节点
    : getFieldNodeById(state.components, parentId);
if (!parentNode) return;
const { index, components } = getFieldOrderBy(parentNode.children, selected);
```

> 备选：把 `parentNode.children` 的访问也走 `byId` 扩展——但 `byId` 当前定义为 FlatField（不含 children），扩展需要重设计索引结构或新增 `byChildrenId: Record<parentId, childId[]>` 索引。**本任务保守做法**：保留 `getFieldNodeById`（不 cloneDeep，纯递归）。

### 3.2 `DesignerContent.onValueChange` 修正

#### 当前实现（[DesignerContent.tsx#L248-264](src/designer/DesignerContent.tsx#L248)）：
```ts
const onValueChange = usePersistFn((uniqueId: any, value: any, _level = 0) => {
    if (_level > 0) {
        console.warn('[DesignerContent.onValueChange] drillDown level > 0 is not supported in task-008. uniqueId:', uniqueId, 'level:', _level);
        return;
    }
    // 对整树先做不可变 setLevelPath 计算（用于重置 drillDownLevel）
    // 不可变版 setLevelPath（produce）返回新数组但不需要写回 store
    // （drillDownLevel 重置语义 task-009 评估），直接丢弃返回值即可
    (setLevelPath as any)(state.components, null);   // ← 返回值丢弃，无副作用
    // value 顶层 keys 合并到 byId[uniqueId].data
    submitFieldConfig(uniqueId, value);
});
```

#### 问题分析

1. `setLevelPath(state.components, null)` 的不可变版（task-009 改造后）返回新数组，但调用方丢弃——纯浪费 CPU
2. 注释自承"drillDownLevel 重置语义 task-009 评估"，但评估结论是"放弃"
3. `submitFieldConfig`（`useUpdateFieldConfig`）是字段级 patch，**不依赖** `drillDownLevel` 重置
4. 当前 `_level > 0` 路径直接 return（不调用 `submitFieldConfig`），意味着"drillDown 子节点的 onValueChange"被静默吞掉

#### 修正方案

**方案 A（推荐）：删除无效 `setLevelPath` 调用，简化 onValueChange**

```ts
const onValueChange = usePersistFn((uniqueId: any, value: any, _level = 0) => {
    // task-012（2026-07-21）：删除 setLevelPath 调用（task-009 评估后判定 drillDownLevel 重置已永久放弃）
    // - 旧实现 setLevelPath 不可变版返回新数组但丢弃，浪费 CPU 且语义不清晰
    // - 字段级 patch（submitFieldConfig）不依赖 drillDownLevel
    // - drillDown level > 0 路径（task-008 注释保留 warn）继续 throw
    if (_level > 0) {
        console.warn('[DesignerContent.onValueChange] drillDown level > 0 is not supported. uniqueId:', uniqueId, 'level:', _level);
        return;
    }
    submitFieldConfig(uniqueId, value);
});
```

> 同时移除文件顶部 `setLevelPath` 的 import（如果仅 onValueChange 用过）。

**方案 B（备选）：实现 `drillDownLevel` 重置语义**

如果将来业务确实需要 `drillDownLevel` 重置（例如轮播组件子树 level 计算），按 task-009 §3.3 严格实现：

```ts
const onValueChange = usePersistFn((uniqueId, value, _level = 0) => {
    if (_level > 0) {
        console.warn('...');
        return;
    }
    // 整树 setLevelPath（重置 drillDownLevel），dispatch 替换树（reducer 内 buildIndex 重建 byId）
    const leveledComponents = setLevelPath(state.components, null);
    dispatch(setComponents(leveledComponents));
    // 字段级 patch byId[uniqueId]
    submitFieldConfig(uniqueId, value);
});
```

> 但这会导致 `onValueChange` 期间触发两次 dispatch（一次 setComponents + 一次 updateFieldConfig），需要 `batch()` 包裹：
> ```ts
> import { batch } from 'react-redux';
> batch(() => {
>     dispatch(setComponents(leveledComponents));
>     submitFieldConfig(uniqueId, value);
> });
> ```
>
> **本任务决策**：采用方案 A。`drillDownLevel` 留作未来 task（如真有人提需求时再做评估）。

### 3.3 AGENTS.md 同步

#### §3.2 当前警告（task-009 阶段写入）

```md
- ⚠️ `designerCanvas` slice 迁入 Redux 后（task-006），`state.components` 已是 Immer frozen 对象，**任何地方都不允许直接 mutation**（render 内 / 工具函数内都不行），违反会抛 `TypeError: Cannot assign to read only property`
- ⚠️ `getFieldConf` / `getParent` 已删 `_.cloneDeep`（task-009），返回浅引用。**禁止 mutation 返回对象**。如需改走 `dispatch(updateFieldConfig(id, patch))` 或 `dispatch(setComponents(newTree))`。
- ⚠️ `setLevelPath` 已统一为不可变版（task-009），返回新数组，调用方需接收返回值：`results = setLevelPath(results, null)`。
```

#### §3.2 修正后（task-012 阶段）

```md
- ⚠️ `designerCanvas` slice 迁入 Redux 后，`state.components` 已是 Immer frozen 对象，**任何地方都不允许直接 mutation**（render 内 / 工具函数内都不行），违反会抛 `TypeError: Cannot assign to read only property`
- ⚠️ `getFieldConf` / `getParent` 函数已删除（task-012），**必须**通过 `useFieldConf(uniqueId)` / `byId[id]` 读；通过 `parentMap[id]` + `byId[parentMap[id]]` 读 parent。需要 parent.children 的少数场景用 `getFieldNodeById(components, id)`（不 cloneDeep，调用方禁止 mutation）。
- ✅ `setLevelPath` 不可变版（task-009 改造，task-012 评估后判定 `drillDownLevel` 重置语义已永久放弃）——当前无活跃调用方。**如需修改请走 `dispatch(updateFieldConfig(id, patch))` + 字段级 patch**，不要重新引入 `setLevelPath` 整树替换。
```

#### §3.3 数据流图（task-007/008/009 落地后）

保持不变。

#### §5.1 slice 表（task-012 阶段）

`designerCanvas` slice 行的描述从 "task-006 引入、task-007 增加索引、task-008 增加字段级 action、task-009 完成 layer-manager 不可变改造" 精简为：

```
| `designerCanvas` | `src/store/modules/designer-canvas.ts` | 画布运行时大对象 + 派生索引：components 树 / `byId` / `parentMap` / page / realtimeDataFlow / customFieldsListMapping / undo / redo / meta |
```

（移除冗余的 task 编号罗列，引用 `.trae/documents/plans/done/` 即可。）

#### §3.2 末尾"详见 `.trae/documents/plans/task-2026-07-21-006/007/008/009-*.md`" 引用

保留即可，task-009 已归档到 `done/`。

---

## 4. 详细步骤

### 步骤 1：新增 `getFieldNodeById` 工具函数

文件：`src/designer/renderer/utils.ts`

按 §3.1.2 末尾的实现新增函数。

### 步骤 2：删除 `getFieldConf` / `getParent` 函数定义

文件：`src/designer/renderer/utils.ts`

直接删除 L99-116（`getParent`）与 L152-167（`getFieldConf`）函数定义。

### 步骤 3：替换 utils.ts 内部 3 处调用

文件：`src/designer/renderer/utils.ts`

- `generatorGroup`（L441）：`getFieldConf(fields, item)` → 用入参接收的 `byId[item]`
- `splitGroup`（L482）：`getFieldConf(fields, selected)` → 同上
- `getSelectedKeys`（L297）：`getParent(fields, id, parent)` → 用入参接收的 `byId[parentMap[id]]`

> 注：`generatorGroup` / `splitGroup` / `getSelectedKeys` 函数签名需要扩展，接收 `byId` + `parentMap` 参数。调用方 layer-manager / drag2layoutBlock 同步改。

### 步骤 4：替换 layer-manager 4 个文件的调用

文件：
- `src/designer/layer-manager/lock/index.ts`
- `src/designer/layer-manager/visible/index.ts`
- `src/designer/layer-manager/move/index.ts`
- `src/designer/layer-manager/copy/index.tsx`
- `src/designer/layer-manager/delete/index.tsx`

统一改写：函数签名加 `byId` / `parentMap` 参数；内部 `getFieldConf(state.components, selected)` → `byId[selected]`；`getParent(state.components, selected, rootParent)` → `byId[parentMap[selected]]`（rootParent 场景用 `getFieldNodeById` 或虚拟根节点）。

> 配套 `src/designer/layer-manager/common.ts` 新增 `useLayerManagerContext()` hook（封装 useSelector 取 byId/parentMap），统一调用方写法。

### 步骤 5：替换 designer-field 渲染路径调用

文件：`src/designer/renderer/designer-field/index.tsx`

- L218（`getParent`）：`useFieldConf(parentMap[selectedIds[0]])` 或 `store.getState().designerCanvas.byId[parentMap[selectedIds[0]]]`
- L224（`getFieldConf`）：同上

### 步骤 6：替换 DesignerContent.tsx L221

文件：`src/designer/DesignerContent.tsx`

```ts
// 旧
const parents = getParent(state.components, selectedIds[0], { uniqueId: ROOT_UNIQUE_ID, children: [] });

// 新
const parentMap = useSelector((s: RootReducerState) => s.designerCanvas.parentMap, shallowEqual);
const parents = useFieldConf(parentMap[selectedIds[0]]);
// 注意：useFieldConf 返回的是 FlatField（不含 children），如果需要 children 用 getFieldNodeById
```

> 此处需要根据实际代码上下文确认是否需要 children。如果只是用来 `parents.uniqueId`，`useFieldConf` 即可。

### 步骤 7：替换 drag2layoutBlock.ts / useOnDrop.ts

文件：
- `src/designer/common/draggable/drag2layoutBlock.ts`
- `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts`

`getParent(stateComponents, ...)` → `byId[parentMap[...]]` 或 `getFieldNodeById(stateComponents, ...)`；`getFieldConf(stateComponents, ...)` → `byId[...]`。

### 步骤 8：替换 element.tsx L129

文件：`src/designer/common/field/layout-block/helper/element.tsx`

`getFieldConf(stateComponents, layoutBlockUniqueId)` → `byId[layoutBlockUniqueId]`（`syncLayoutBlockSize2Children` 接收 `byId` 参数）。

### 步骤 9：修正 DesignerContent.onValueChange

文件：`src/designer/DesignerContent.tsx`

按 §3.2 方案 A 删除 `setLevelPath` 调用 + 简化注释。同时清理文件顶部不再使用的 `setLevelPath` import。

### 步骤 10：AGENTS.md 同步

文件：`AGENTS.md`

按 §3.3 改写 §3.2 / §5.1。

### 步骤 11：grep + tsc 校验

```bash
grep -n "getFieldConf\b\|getParent\b" src/designer/ src/formily/
# 应返回 0 命中（活跃代码）

grep -n "setLevelPath" src/designer/
# 应返回 0 命中（活跃代码），除 setLevelPath 函数自身定义

pnpm tsc --noEmit
# 零新增错误
```

### 步骤 12：人工冒烟

```bash
pnpm start
```

冒烟清单：
- [ ] 配置面板 onChange（验证 `useFieldConf` 替换路径）
- [ ] 图层"置顶/置底/上移/下移/锁定/隐藏/复制/删除"（验证 layer-manager 改造）
- [ ] "成组 / 拆组"（验证 utils.ts `generatorGroup` / `splitGroup` 改造）
- [ ] 多选拖拽（验证 designer-field 改造）
- [ ] 拖拽组件入布局组件（验证 drag2layoutBlock 改造）
- [ ] layers-tree 拖拽（验证 useOnDrop 改造）

---

## 5. 验证清单

- [ ] `src/designer/renderer/utils.ts` 删除 `getFieldConf` 函数定义
- [ ] `src/designer/renderer/utils.ts` 删除 `getParent` 函数定义
- [ ] `src/designer/renderer/utils.ts` 新增 `getFieldNodeById` 工具函数
- [ ] `src/designer/renderer/utils.ts` `generatorGroup` / `splitGroup` / `getSelectedKeys` 内部 `getFieldConf` / `getParent` 替换为 `byId[id]` / `byId[parentMap[id]]`
- [ ] `src/designer/layer-manager/{lock,visible,move,copy,delete}` 5 个文件调用方替换
- [ ] `src/designer/renderer/designer-field/index.tsx` L218/L224 替换为 `useFieldConf`
- [ ] `src/designer/DesignerContent.tsx` L221 替换
- [ ] `src/designer/common/draggable/drag2layoutBlock.ts` 替换
- [ ] `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` 替换
- [ ] `src/designer/common/field/layout-block/helper/element.tsx` L129 替换
- [ ] `src/designer/DesignerContent.tsx` `onValueChange` 删除无效 `setLevelPath` 调用
- [ ] `AGENTS.md` §3.2 警告更新（移除 `getFieldConf` / `getParent` 警告，补充 `getFieldNodeById` 约束）
- [ ] `AGENTS.md` §5.1 `designerCanvas` slice 行精简
- [ ] grep `getFieldConf\b\|getParent\b` 在 `src/designer/` 与 `src/formily/` 0 命中（活跃代码）
- [ ] grep `setLevelPath` 在 `src/designer/` 仅命中函数定义本身
- [ ] `pnpm tsc --noEmit` 零新增错误（pre-existing 14 个错误数不变）
- [ ] 冒烟清单全部通过
- [ ] 任务文件移到 `plans/done/`
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `getFieldNodeById` 浅引用被某个调用方 mutation | 中 | 在 Immer frozen 树上报错 | 调用方仅用于读 `children`；如果需要 mutation 走 `dispatch(setChildren(...))` |
| layer-manager 函数签名变化导致调用方漏传 `byId` / `parentMap` | 中 | tsc 错误 + 运行时 NPE | 用 `useLayerManagerContext()` hook 统一封装；分批切换 |
| `useFieldConf` 返回 `undefined`（组件已删除）时调用方漏判空 | 中 | NPE | 单测覆盖；调用方全部加 `?.` 可选链 |
| `onValueChange` 删除 `setLevelPath` 后未来真的有 drillDown 需求 | 低 | 需要重新实现 | task 文件留有方案 B 的备选实现，可作为未来 task 的起点 |
| AGENTS.md 文档与代码再次脱节 | 低 | 误导后续维护者 | 每次 task 完成必须 grep + Read 校验；本任务结束前最后过一遍 §3.2 / §5.1 |

### 回退方案

- 改造前一次 commit：`refactor(designer): delete getFieldConf/getParent, fix onValueChange setLevelPath, sync AGENTS.md`
- `getFieldConf` / `getParent` 函数定义可作为 `@deprecated` 兼容壳保留 1 个版本（仅返回 `byId[id]` / `byId[parentMap[id]]`），下个版本再删
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-21：任务创建（task-012），状态 `planning`，承接 task-006/007/008/009 + task-010 的不可变契约收尾（删除 O(n) 工具函数）+ 修正 onValueChange setLevelPath 语义不一致 + 文档对齐