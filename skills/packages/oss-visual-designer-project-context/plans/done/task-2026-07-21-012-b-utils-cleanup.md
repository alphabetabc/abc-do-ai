# 工具函数清理 - 子任务 B：工具函数路径调用方迁移

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-012-b`
> 上游任务：
> - [task-2026-07-21-009-cleanup](./done/task-2026-07-21-009-cleanup.md)
> - [task-2026-07-21-010-layer-manager-utils-immutable](./task-2026-07-21-010-layer-manager-utils-immutable.md)
> - [task-2026-07-21-012-a-utils-cleanup](./task-2026-07-21-012-a-utils-cleanup.md)
> 后续任务：
> - task-2026-07-21-012-c：渲染路径迁移 + onValueChange 修复 + AGENTS.md
> 状态：`done`
> 类型：`refactor`
>
> **风险等级：中（layer-manager 函数内部访问方式变化）**

---

## 1. 背景

承接 task-012-a，新增的 `getFieldNodeById` 工具函数已经可用于"已知 id 找完整节点（含 children）"的场景。本任务将所有**工具函数路径**调用方从 `getFieldConf(components, id)` / `getParent(components, id, rootParent)` 迁移到 `byId` + `parentMap` + `getFieldNodeById`。

---

## 2. 目标

迁移以下 8 个文件的调用方：

| # | 文件 | 改动要点 |
| --- | --- | --- |
| 1 | `src/designer/layer-manager/lock/index.ts` | `getFieldConf(state.components, selected)` → `byId[selected]`（用 `store.getState()`） |
| 2 | `src/designer/layer-manager/visible/index.ts` | 同上 |
| 3 | `src/designer/layer-manager/move/index.ts` | `getParent(state.components, selected, rootParent)` → `byId[parentMap[selected]] ?? rootParent`（用 `store.getState()`），`parents.children` 保留（rootParent 本身是虚拟根，含 children） |
| 4 | `src/designer/layer-manager/copy/index.tsx` | 同 move |
| 5 | `src/designer/layer-manager/delete/index.tsx` | 同 move |
| 6 | `src/designer/common/draggable/drag2layoutBlock.ts` | `getParent(...)` → `byId[parentMap[...]]` + `getFieldNodeById`；`getFieldConf(...)` → `byId[...]` |
| 7 | `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` | 同 drag2layoutBlock |
| 8 | `src/designer/common/field/layout-block/helper/element.tsx` | `getFieldConf(stateComponents, layoutBlockUniqueId)` → `byId[layoutBlockUniqueId]`（`syncLayoutBlockSize2Children` 接收 `byId` 参数） |

`DesignerState` 类型扩展 `byId` + `parentMap` 字段（`[prop: string]: any` 已支持，无需类型变更）。

---

## 3. 关键设计决策

### 3.1 layer-manager 函数签名不变

**不强制**改 `(state, selected, handle?)` → `(ctx, selected, handle?)`。原因：

- 调用方（`canvas-graph`、`DesignerContextMenu`）只需传 `state`，不关心 `byId`/`parentMap`
- 函数内部用 `store.getState().designerCanvas.byId` / `.parentMap` 访问
- 保持调用方零改动

```ts
// 旧（layer-manager/lock/index.ts L7）
const fieldConf = getFieldConf(state.components, selected);

// 新
const fieldConf = store.getState().designerCanvas.byId[selected];
```

> 注：原 plan §3.1.1 推荐"函数签名变更 + useLayerManagerContext() hook"——本任务**不采用**，避免连带调用方 5 处改动。

### 3.2 move/copy/delete 的 parent 访问

```ts
// 旧（layer-manager/move/index.ts L18）
const rootParent = getRootParent(state);   // { uniqueId: ROOT_UNIQUE_ID, children: state.components }
const parents = getParent(state.components, selected, rootParent);
if (!parents) return;
const { index, components } = getFieldOrderBy(parents.children, selected);

// 新（保留 rootParent，因为 rootParent 自身就是带 children 的虚拟节点）
const rootParent = getRootParent(state);
const parentMap = store.getState().designerCanvas.parentMap;
const parentNode = parentMap[selected] === ROOT_UNIQUE_ID
    ? rootParent
    : getFieldNodeById(state.components, parentMap[selected]);
if (!parentNode) return;
const { index, components } = getFieldOrderBy(parentNode.children, selected);
```

> 与原 plan §3.1.2 的实现一致。

### 3.3 drag2layoutBlock / useOnDrop

两个文件已经在 React 组件 hook 内部，可以直接用 `useSelector` 读 `byId`/`parentMap`，不必走 `store.getState()`：

```ts
// drag2layoutBlock.ts 当前是非 hook 的工具函数，被 React 组件调用
// 方案 A：在工具函数内 store.getState()（保持工具函数形态）
// 方案 B：传入 byId/parentMap 参数（签名变更）
// 本任务采用 A，保持调用方零改动
```

---

## 4. 详细步骤

### 步骤 1：迁移 layer-manager/lock/index.ts

- 删除 `import { getFieldConf, mergeFieldConfig, setLevelPath } from utils`
- 内部 `getFieldConf(state.components, selected)` → `store.getState().designerCanvas.byId[selected]`
- 保留 `setLevelPath` 调用（task-012-c 统一评估）

### 步骤 2：迁移 layer-manager/visible/index.ts

同步骤 1。

### 步骤 3：迁移 layer-manager/move/index.ts

- 删除 `import { getParent, ... } from utils`
- 内部 `getParent(state.components, selected, rootParent)` → 用 `parentMap[selected]` + `getFieldNodeById`（参见 §3.2）
- 引入 `store` from `@Src/store`

### 步骤 4：迁移 layer-manager/copy/index.tsx

同步骤 3。

### 步骤 5：迁移 layer-manager/delete/index.tsx

同步骤 3。

### 步骤 6：迁移 drag2layoutBlock.ts

- 删除 `import { getParent, getFieldConf, ... }`
- 内部用 `store.getState()` 读 byId/parentMap，递归查找用 `getFieldNodeById`

### 步骤 7：迁移 useOnDrop.ts

同步骤 6。

### 步骤 8：迁移 element.tsx

- `syncLayoutBlockSize2Children(stateComponents, layoutBlockUniqueId, ...)` → 加 `byId` 参数
- 调用方（`renderCanvasTree` 等）传入 `byId`

### 步骤 9：grep + tsc 校验

```bash
grep -n "getFieldConf\b\|getParent\b" src/designer/layer-manager/ src/designer/common/draggable/ src/designer/common/field/layout-block/helper/element.tsx src/designer/aside-panel/layers-tree/tree/useOnDrop.ts
# 应返回 0 命中（活跃代码）

pnpm tsc --noEmit
# 零新增错误
```

### 步骤 10：人工冒烟（子集）

- [ ] 图层"锁定/隐藏"按钮
- [ ] 图层"置顶/置底/上移/下移"
- [ ] 图层"复制/删除"
- [ ] 拖拽组件入布局组件
- [ ] layers-tree 拖拽

---

## 5. 验证清单

- [ ] 8 个文件全部完成 `getFieldConf` / `getParent` 替换
- [ ] grep 在 `src/designer/layer-manager/`、`src/designer/common/draggable/`、`element.tsx`、`useOnDrop.ts` 中 0 命中
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 冒烟子集通过
- [ ] 任务文件移到 `plans/done/`
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `store.getState()` 在 reducer 外部使用导致 stale read | 低 | 拿到过期数据 | layer-manager 函数都在 dispatch 流程外调用，dispatch 后 store 已更新 |
| `parentMap[selected]` 返回 undefined（selected 是根） | 低 | NPE | 检查 `parentMap[selected] === ROOT_UNIQUE_ID` 走 rootParent 路径 |
| `getFieldNodeById` 浅引用被 mutation | 中 | Immer 报错 | 调用方仅用于读 children；mutation 走 dispatch |

### 回退方案

- 改造前一次 commit：`refactor(layer-manager): replace getFieldConf/getParent with byId/parentMap`
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

- 2026-07-21：任务创建（task-012-b），承接 task-012-a 的 `getFieldNodeById`，为 task-012-c 的"删除函数定义"铺平