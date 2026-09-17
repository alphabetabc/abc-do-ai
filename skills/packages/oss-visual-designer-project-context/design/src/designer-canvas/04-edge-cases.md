# Designer Canvas 边界场景

> 配套 [00-overview.md](./00-overview.md) | 关注点：需要"tree + byId 同步"的复杂操作
>
> ⚠️ **task-002/003（2026-07-28）单源 reducer 改造后**：`updateFieldConfig` 改为"改树 + buildIndex"，`components` 树永远 fresh，`byId` 变为纯派生（只读）。历史双源时代的 stale 防护（`freshChildNodes` / `fieldPreserve` / `dirtyConfigKeys` / `mergeByIdIntoTree` / `getSaveableComponents`）**已全部从代码库删除**。本文保留"历史背景"小节作为决策溯源，但当前实现仅关注单源下的剩余边界场景。详见 [task-2026-07-28-002](../../plans/task-2026-07-28-002-single-source-refactor-reducer.md) 与 [task-2026-07-28-003](../../plans/task-2026-07-28-003-single-source-refactor-cleanup-save.md)。

---

## 0. 三类需要同步的边界场景（单源后）

| # | 场景 | 操作 | tree 状态 | byId 状态 | 防护 |
| --- | --- | --- | --- | --- | --- |
| 1 | recalcGroupBounds | 拖组内子组件 / 组内对齐 | **fresh（单源后）** | fresh（派生） | 无需 stale 防护（components 永远 fresh）；保留 `isRecalcRef` 防重入 |
| 2 | save 序列化 | handleSave / saveAsTemp / postMessage | **fresh（单源后）** | fresh（派生） | **直接序列化 `designerState.components`**（task-003 删除 `getSaveableComponents`） |
| 3 | setComponents 输入计算 | 结构性变更操作（拖入/删除/成组/拆组/移动/复制） | **fresh（单源后）** | fresh（派生） | 无需 stale 防护（闭包 `components` 永远 fresh，详见 §3.2） |

---

## 1. recalcGroupBounds（拖组内子组件 + 组内对齐）

### 1.1 触发条件

每次 Redux 状态变化都触发（`reduxStore.subscribe(recalcGroupBounds)`），由 [DesignerContent.tsx L286-L328](src/designer/DesignerContent.tsx#L286-L328) 注册。

### 1.2 目的

当选中组件是组的子组件时，重新计算**组的尺寸和位置**（组的 bounds 跟随子组件的 bbox）。

### 1.3 算法（单源后简化版）

```
读 byId[selected] → 确认 selected 是某个组的子组件（通过 parentMap）
读 parents.children → 计算 bbox（max top/left/right/bottom）
判断 bbox 与组当前 bounds 是否一致：
├─ 一致 → return
└─ 不一致 → 计算 newGroupConfig + newChildren
         → setComponents({...})（reducer 直接赋值 + buildIndex）
```

### 1.4 stale 风险（已消除，task-002 单源后）

> ✅ **已消除（task-002，2026-07-28）**：单源 reducer 改造后 `updateFieldConfig` 改为"改 components 树 + buildIndex 重建派生索引"，`components` 树永远 fresh，`parents.children` 已是最新值，无需 `freshChildNodes` 包装。

**历史背景**（task-012-1 §2b，双源时代，已废弃）：

- onDragStop → updateFieldConfig → 只改 byId，不改 components
- recalcGroupBounds 读 `parents.children`（来自 stale tree）
- 被拖子组件的新位置不在 `parents.children` 里（tree 还是旧的）
- bbox 计算用旧位置 → 组的尺寸不更新

**历史修复**（task-012-1 §3.3，已废弃并删除）：用 `freshChildNodes` 包装（byId 重算子组件 data）。task-002 后该函数已不再被调用，task-003 已从代码库删除。

**当前实现**（task-002 后，[DesignerContent.tsx L300-L303](src/designer/DesignerContent.tsx#L300-L303)）：

```ts
// task-002（2026-07-28）：单源后 components 树永远 fresh，无需 freshChildNodes 包装
// - 旧（双源）：updateFieldConfig 只改 byId 不改树，需用 byId 重算子组件 data 防 stale
// - 新（单源）：updateFieldConfig 改树 + buildIndex，parents.children 已是最新值
const { top, left, width, height } = getGroupSizePosition(parents.children);
```

直接读 `parents.children`，不再包装。

### 1.5 skip 标志（已删除，task-003）

> 🗑️ **已删除（task-003，2026-07-28）**：`beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` / `_skipGroupRecalc` 已从 `src/designer/renderer/utils.ts` 删除。单源后 `setComponents` 直接赋值 + buildIndex，`recalcGroupBounds` 读 `parents.children` 即 fresh，skip 路径不再需要。

**历史用途**（已废弃）：handleAlign 走 `setComponents` 时，跳过 recalcGroupBounds 的"min top/left 归零 + 组位置补偿移动"路径，只更新组的尺寸。task-012-1 改走 `updateFieldConfig` 后不再使用；task-002 又改回方案 B（1 次 `setComponents`），但单源后无需 skip。

### 1.6 决策树（单源后简化）

> ✅ **task-002（2026-07-28）简化**：删除 `shouldSkipGroupRecalc` 分支（永远 false 死代码），删除两步同步（单源后 `setComponents` 直接赋值，无 `fieldPreserve` 覆盖风险）。

```
selected 是 ROOT_UNIQUE_ID 或 顶层组件？
└─ 是 → return（无需 recalc）

（task-002 已删除 shouldSkipGroupRecalc 分支）

正常路径（task-002 简化后，单次 setComponents）：
- 直接读 parents.children（fresh，无需 freshChildNodes 包装）
- min top/left → 计算 group.config.{top,left,width,height}
- resetChildrenPosition 把 children 的 min 归零
- setChildren + mergeFieldConfig 构造 results
- 单次 setState({ components: results })（setComponents reducer 直接赋值 + buildIndex）
```

### 1.6.1 正常路径为何先同步 byId 再 setComponents（已废弃，task-002 单源后）

> 🗑️ **已废弃（task-002，2026-07-28）**：单源后 `setComponents` reducer 改为直接赋值 + buildIndex，**不再调用 `mergeByIdIntoTree(fieldPreserve)`**（task-003 已删除该函数），因此不存在 `fieldPreserve` 用 byId 旧值覆盖归一化新值的问题。正常路径已回归单次 `setComponents`，无需先 `updateFieldConfig` 同步 byId。以下为双源时代的历史记录。

**历史问题**（双源时代）：正常路径原走 `setChildren + mergeFieldConfig + setState({components})` → `setComponents` reducer → `mergeByIdIntoTree(results, byId, 'fieldPreserve')`。

拖动组内子组件 a 后，`byId[a].dirtyConfigKeys` 含 `left`/`top`（`updateFieldConfig` 记录）。`fieldPreserve` 合并时，**用 byId 中 a 的拖动后绝对值覆盖 results 中归一化后的相对值** → 归一化失效 + 组位置漂移 → a 二次位移。

**历史修复（v2，已废弃）**：正常路径在 `setState` 前，先用 `updateFieldConfig` 把归一化后的组位置 + 每个子组件位置写入 byId，使 byId 的 left/top 与 results 一致，fieldPreserve 覆盖无害；再走 `setComponents` 同步树。

详见 [task-2026-07-24-012-2-manual-fix](../../plans/task-2026-07-24-012-2-manual-fix.md)。

### 1.7 isRecalcRef 防重入（单源下仍需保留）

> ⚠️ **单源后仍需防重入**：虽然 `mergeByIdIntoTree` 已删除，但 `recalcGroupBounds` 内调用 `setState({components})` → `setComponents` → Redux subscribe → `recalcGroupBounds` 的链路仍在。若不防护，计算条件持续为 true 时会无限循环 → 爆栈。`isRecalcRef.current` 重入防护覆盖多 dispatch 序列，单源下保留。

代码位置：[DesignerContent.tsx L284](src/designer/DesignerContent.tsx#L284) `const isRecalcRef = useRef(false);`

### 1.8 易错点

> ✅ **task-002/003（2026-07-28）后**：`freshChildNodes` / `fieldPreserve` / `dirtyConfigKeys` / skip 标志均已删除；单源后 `components` 永远 fresh，`setComponents` 直接赋值无覆盖风险。

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| ~~不用 freshChildNodes 直接读 `parents.children`~~ | ~~拖拽后组尺寸不更新~~ | ~~已废弃：单源后 components 永远 fresh，直接读 `parents.children` 即可~~ |
| ~~beginSkipGroupRecalc 不配套 endSkipGroupRecalc~~ | ~~标志卡住~~ | ~~已删除：skip 标志机制整体移除~~ |
| ~~正常路径走 setComponents（两步同步）~~ | ~~fieldPreserve 用 byId 拖动后绝对值覆盖归一化相对值 → 二次位移~~ | ~~已废弃：单源后 setComponents 直接赋值，无 fieldPreserve 覆盖风险~~ |
| setComponents/dispatch 时 recalcGroupBounds 同步触发 | 爆栈 | `isRecalcRef.current` 重入防护（单源下仍需保留，覆盖多 dispatch 序列） |

---

## 2. save 序列化（直接序列化 designerState.components）

### 2.1 场景

3 个保存路径（task-012-1 列出）：

| 路径 | 文件 | 触发 |
| --- | --- | --- |
| 主保存 | `DesignerContent.tsx` handleSave | 点保存按钮 / Ctrl+S / 自动保存 |
| 存为模板 | `saveAsTemp-modal/index.tsx` | "生成模板"按钮 |
| 微应用嵌入 | `designer-scene-monitor/index.tsx` onSave | 微应用嵌入保存 |

### 2.2 stale 风险（已消除，task-002/003 单源后）

> ✅ **已消除（task-002/003，2026-07-28）**：单源后 `updateFieldConfig` 改树 + buildIndex，`components` 树永远 fresh；task-003 删除 `getSaveableComponents` 函数，3 个保存路径全部改为直接序列化 `designerState.components`。

**历史背景**（task-012-1 问题 1，双源时代，已废弃）：

- onDragStop → updateFieldConfig → 只改 byId，不改 components
- save 时读 `designerState.components`（旧位置）→ 后端存旧值

**历史修复**（task-012-1 §3.1，已废弃并删除）：引入 `getSaveableComponents(state)` 调用 `mergeByIdIntoTree(state.components, state.byId, 'byIdWins')` 合并。task-003 后该函数已删除。

### 2.3 当前实现（task-003 后）

**主保存**（[DesignerContent.tsx handleSave L357-L363](src/designer/DesignerContent.tsx#L357-L363)）：

```ts
config: JSON.stringify({
    page: designerState.page,
    // task-003（2026-07-28）：单源后 components 树永远 fresh，直接序列化即可
    components: designerState.components,
    realtimeDataFlow: designerState.realtimeDataFlow ?? [],
    customFieldsListMapping: {},
}),
```

**存为模板 / 微应用嵌入**：同样直接读 `designerState.components` 序列化（详见 task-003 §3）。

### 2.4 调用方对照

| 文件 | 改后 |
| --- | --- |
| `DesignerContent.tsx` handleSave | `designerState.components`（直接序列化） |
| `designer-scene-monitor/index.tsx` onSave | `designerState.components`（直接序列化） |
| `saveAsTemp-modal/index.tsx` | `designerState.components`（直接序列化） |

### 2.5 useImperativeHandle.getState

`DesignerContent.tsx` L375-L384 的 `getState()` 返回 `reduxStore.getState().designerCanvas`（原样）。

**调用方序列化责任**：如果外部通过 `designerRef.current.getState()` 拿到 state 后要序列化，**直接读 `.components` 即可**（单源后永远 fresh）。历史时代需要调 `getSaveableComponents`，task-003 后该函数已删除。

---

## 3. setComponents 输入计算（闭包 stale 风险已消除）

### 3.1 场景

`handleAlign` / `mergeFieldConfig` / `setChildren` 等 setComponents 操作，**输入的 components 可能是 stale**（双源时代）。

> ✅ **task-002（2026-07-28）后**：`updateFieldConfig` 改为"改树 + buildIndex"，`components` 引用每次都变，`useSelector` 的 `shallowEqual` 会触发 re-render，闭包 `components` 永远 fresh，**无 stale 闭包问题**。以下各节为双源时代的历史记录与防护演进。

### 3.2 stale 来源（闭包，已消除）

> ✅ **已消除（task-002，2026-07-28）**：`updateFieldConfig` 改为"改树 + buildIndex"，`components` 引用每次都变（`produce` 生成新引用 + `buildIndex` 返回新 state 对象），`useSelector` 的 `shallowEqual` 判断引用变化 → 触发 re-render → 闭包 `components` 更新。**无 stale 闭包问题。**

**闭包变量**：[`canvas-graph/index.tsx L115`](src/designer/canvas-graph/index.tsx#L115)

```ts
const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual);
```

这个 `components` 是 React 组件 render 时的快照。单源后因 `updateFieldConfig` 改树导致引用变化，每次都触发 re-render，闭包永远 fresh。

**为什么 stale**（双源时代，已消除）：

- `updateFieldConfig`（拖拽走的路径）只改 `byId`，**不改 `components` 数组引用**
- `useSelector` 的 `shallowEqual` 判断 `components` 引用没变 → 不触发 re-render
- 走 `setComponents` 的操作若用 React 闭包 `components`，拿到的是旧树

### 3.3 原问题复现（ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状，已从根本上消除）

> 🗑️ **历史记录（task-002 已从根本上消除）**：单源后 `updateFieldConfig` 改树导致 `components` 引用变化 → re-render → 闭包更新，下列步骤 2 的"不 re-render → 闭包 components 还是步骤 1 的树"不再成立。

**历史问题**（task-012-1 修复，task-002 根本消除）：

```
1. 选中 ab 对齐 → setComponents(mergedTree) → components 引用变 → re-render → 闭包更新 ✓
2. 拖 b → updateFieldConfig(bId, {config:{left,top}}) → 只改 byId[b].data，components 引用不变
   → useSelector shallowEqual 判断没变 → 不 re-render → 闭包 components 还是步骤 1 的树（b 旧位置）
3. 选中 cd 对齐 → handleAlign 执行（旧方案）
   → 读 byId（同步读，cd 位置是新的 ✓）
   → let results = components（闭包读，b 位置是旧的 ✗）
   → mergeFieldConfig(results, ...) 基于 stale 树改 cd
   → dispatch(setComponents(results))
   → reducer mergeByIdIntoTree(results, byId, direction)
```

### 3.4 修复演进

> ✅ **task-002/003（2026-07-28）已从根本上消除 stale 问题**：单源 reducer 改造后 `updateFieldConfig` 改树 + buildIndex，`components` 引用每次都变，闭包永远 fresh。`setComponents` reducer 改为直接赋值 + buildIndex，**删除 `mergeByIdIntoTree`**（task-003），`fieldPreserve` / `dirtyConfigKeys` 安全网随之移除。`handleAlign` 改回方案 B（1 次 `setComponents`），无需 skip 标志。

**第一层修复**（已删除）：`fieldPreserve` + `dirtyConfigKeys`（task-012-1 §3.4）

`setComponents` / `setState` reducer 从 `nodeWins` 改为 `fieldPreserve`，对 `dirtyConfigKeys` 中的字段取 byId 值，保留字段级更新。

> task-002 后 `mergeByIdIntoTree` 已从 `setComponents` / `setState` reducer 中删除，task-003 从代码库整体删除。`fieldPreserve` 方向不再使用，`dirtyConfigKeys` 生命周期随之失效（`patchFieldConf` 已删除）。

**第二层修复**（已演进）：`handleAlign` 改走 `updateFieldConfig`（task-012-1 续）

`fieldPreserve` 的局限性：当 setComponents 的 operation 也修改了 `dirtyConfigKeys` 中的字段时，byId 旧值覆盖 operation 新值（详见 [02-write-path.md §4.2.2](./02-write-path.md)）。

**根因场景**：拖组内组件 a（`dirtyConfigKeys` 加入 `left`）→ 选中 ab 左对齐（`mergeFieldConfig` 改 a.left=0 → `setComponents`）→ `fieldPreserve` 用 byId 的旧 left 覆盖对齐新值 → 对齐不生效。

**历史修复**（task-012-1 续，已演进）：`handleAlign` 从 `setComponents` + `mergeFieldConfig` 改为 `updateFieldConfig`，后 task-002 又改回方案 B。

**第三层修复**（task-002，当前实现）：`handleAlign` 改回方案 B（1 次 `setComponents`）

单源后 `updateFieldConfig` 每次 `buildIndex` O(n)，task-012-1 的"串行 N 次 `updateFieldConfig`"方案在 N=440 组件场景下性能灾难（约 75 秒）。task-002 将 `handleAlign` 改回方案 B：

- 在闭包树上 `mergeFieldConfig` 累积改动 → 1 次 `setComponents`
- 单源后闭包 `components` 永远 fresh（无 stale 问题）
- `setComponents` reducer 直接赋值 + buildIndex（无 `mergeByIdIntoTree`，无 `fieldPreserve` 覆盖风险）
- 不再需要 skip 标志（`recalcGroupBounds` 读 `parents.children` 即 fresh）

详见 [canvas-graph/index.tsx handleAlign L312-L361](src/designer/canvas-graph/index.tsx#L312-L361)。

### 3.5 覆盖范围

> ✅ **task-002/003（2026-07-28）后所有路径 components 均 fresh**：`fieldPreserve` 安全网已随 `mergeByIdIntoTree` 删除而移除。下表为双源时代的历史对照（"闭包变量来源"列说明各调用点如何取 components）。

| 调用点 | 文件 | 闭包变量来源 |
| --- | --- | --- |
| ~~handleAlign~~ | ~~`canvas-graph/index.tsx`~~ | ~~`useSelector` L115~~ **（task-002 改回方案 B：1 次 setComponents，闭包 components 永远 fresh）** |
| recalcGroupBounds | `DesignerContent.tsx` | `reduxStore.getState()` L289（同步读，单源后 components 永远 fresh） |
| layer-manager lock/visible | `layer-manager/lock`、`visible` | `state.components`（参数传入） |
| resize | `designer-field/utils.ts` | `getDesignerState()` 同步读 |
| 成组/拆组 | `layer-manager/group` | `state.components` |

### 3.6 相关文档

- 写路径：[02-write-path.md §4](./02-write-path.md)（`mergeByIdIntoTree` 已删除，仅历史参考）
- 读路径：[03-read-path.md §6](./03-read-path.md)（保存序列化直接读 components）
- task 文档：[task-012-1 §3.4-fix](../../plans/task-2026-07-24-012-1-manual-fix.md)

---

## 4. 整体防护 checklist

> ✅ **task-002/003（2026-07-28）单源后**：stale 防护已全部废弃并删除，checklist 大幅简化。

在写涉及"tree + byId 同步"的代码时，按下面 checklist 过一遍：

- [ ] ~~读 children 的位置/尺寸 → 用 freshChildNodes（byId 重算）包装~~ **（单源后 components 永远 fresh，`freshChildNodes` 已删除）**
- [ ] 保存序列化 → 直接读 `designerState.components`（task-003 删除 `getSaveableComponents`）
- [ ] setComponents 前算 bbox → 从 `state.components` 读（单源后永远 fresh）或 `byId` 读（派生，同样 fresh）
- [ ] setComponents 后取最新 byId → `useStore().getState()` 同步读
- [ ] 只改 config 字段的操作（如对齐）→ 可走 `updateFieldConfig` 或方案 B（1 次 `setComponents`），单源后两者均无覆盖风险
- [ ] recalcGroupBounds 内的二次 setState → `isRecalcRef.current` 防重入（单源下仍需保留）
- [ ] ~~setComponents reducer 用 `fieldPreserve` 方向~~ **（单源后 setComponents reducer 直接赋值 + buildIndex，`mergeByIdIntoTree` 已删除）**

---

## 5. 相关文件

| 文件 | 关注点 |
| --- | --- |
| `src/designer/DesignerContent.tsx` L286-L328 | `recalcGroupBounds` 实现（task-002 简化：删除 freshChildNodes + skip 分支 + 两步同步，单次 setComponents） |
| `src/designer/DesignerContent.tsx` L357-L363 | `handleSave` 保存序列化（task-003：直接读 `designerState.components`） |
| `src/designer/canvas-graph/index.tsx` L115 | `components` 闭包来源（`useSelector` + `shallowEqual`，单源后永远 fresh） |
| `src/designer/canvas-graph/index.tsx` L312-L361 | `handleAlign`（task-002 方案 B：1 次 setComponents，闭包树 mergeFieldConfig 累积改动） |
| `src/designer/renderer/utils.ts` | `buildIndex`（单源后 setComponents/setState/updateFieldConfig 均调用，重建 byId/parentMap，引用复用保持订阅粒度） |
| `src/store/modules/designer-canvas.ts` L74-L184 | `setComponents` / `setState` reducer（直接赋值 + buildIndex）+ `updateFieldConfig` reducer（改树 + buildIndex） |

---

## 6. 后续 task 引用

| 待修问题 | 见 |
| --- | --- |
| stale tree 防御性读取统一封装 | [task-015](../../plans/task-2026-07-24-015-stale-tree-defensive-reading.md) |
| mutation 残留（原 8 处已修 6 处，剩 2 行）+ cloneDeep 滥用 | [task-016](../../plans/task-2026-07-24-016-audit-cloneDeep-mutations.md) |
