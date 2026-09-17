# Designer Canvas 历史 Bug 索引

> 配套 [00-overview.md](./00-overview.md) | 关注点：**修复前先查这里，避免重复排查**
>
> 分类：🔴 待修 / 🟡 部分修复待 follow-up / 🟢 已修
>
> ⚠️ **task-001/002/003（2026-07-28）单源重构后**：多个历史 bug 已从根本上消除。本文档已同步更新修复状态。

---

## 0. 速查表

| # | bug | 状态 | 来源 | 修复 |
| --- | --- | --- | --- | --- |
| 1 | setComponents 路径改名丢失 | 🟢 已修 | task-012-1 §3.4 | task-012-1（fieldPreserve）+ [task-012-3](../../plans/done/task-2026-07-24-012-3-verify-rename-preserve.md) 验证；**task-002 单源架构根本解决**（components 唯一真相，无 mergeByIdIntoTree 覆盖） |
| 2 | handleAlign 多选对齐 pre-existing | 🟢 已修 | task-011-2 P-3 | task-012-d；**task-002 改回方案 B（1 次 setComponents）+ 单源闭包永远 fresh** |
| 3 | setLevelPath 丢弃返回值 | 🟢 已修 | task-012 §3.2 | task-012-c |
| 4 | drag2layoutBlock updateFieldConfig 不同步 | 🟢 已修 | task-008 | task-008；**task-002 单源后 updateFieldConfig 改树 + buildIndex，components 永远 fresh** |
| 5 | useDesignerSettingChange 高频 path 不走 React | 🟢 已删 | task-007 | task-007 |
| 6 | runtimeComponentsTrigger EventBus | 🟢 已删 | task-007 | task-007 |
| 7 | useDebounceMergeConfig 30ms 防抖 | 🟢 已删 | task-008 | task-008 |
| 8 | useSyncDesignerUpdate 全局通知 | 🟢 已删 | task-007 | task-007 |
| 9 | layer-manager mutation（splice/push） | 🟢 已修 | task-010 | task-010 |
| 10 | configuration-panel/page render 内 mutation | 🟢 已修 | task-011-fix | task-011-fix |
| 11 | designer-field parents.children mutation | 🟢 已修 | task-010 | task-010 |
| 12 | getFieldConf / getParent cloneDeep 滥用 | 🟢 已删 | task-009 | task-009 |
| 13 | handleAlign 闭包覆盖 | 🟢 已修 | task-012-d | task-012-d；**task-002 单源后闭包 components 永远 fresh，从根本上消除** |
| 14 | setState 丢弃字段 | 🟢 已修 | task-012-d | task-012-d |
| 15 | splitGroup / generatorGroup byId 不含 children | 🟢 已修 | task-012-c | task-012-c |
| 16 | 组点击不到 | 🟢 已修 | task-012-d | task-012-d |
| 17 | 改名丢失 | 🟢 已修 | task-012-d 图层树从 byId 读 | task-012-1（fieldPreserve）+ task-012-3 验证；**task-002 单源架构根本解决** |
| 18 | 组内成组爆栈 | 🟢 已修 | task-012-d | task-012-d |
| 19 | 组内对齐跳变 | 🟢 已修 | task-012-d | task-012-d |
| 20 | **保存丢失（拖拽/配置面板改属性）** | 🟢 已修 | task-012-1 | task-012-1；**task-002/003 单源后 components 永远 fresh + 直接序列化，从根本上消除** |
| 21 | **拖拽组内子组件组尺寸不更新** | 🟢 已修 | task-012-1 | task-012-1；**task-002 单源后 components 永远 fresh，recalcGroupBounds 直接读 parents.children，从根本上消除** |
| 22 | mutation 残留 + cloneDeep 滥用（原 8 处已修 6 处，剩 2 行） | 🟢 已修 | useDesigner 迁移审计 §2/§9 | **task-2026-07-28-001 承接 task-016 完成**：清理剩余 2 行 mutation（useOnDrop L28/L61）+ syncLayoutBlockSize2Children 3 处 `_.set` + 3 处 `child.children =` + drag2layoutBlock 1 处 mutation，全部改为不可变操作；cloneDeep 审计零改动 |
| 23 | stale tree 防御性读取未统一封装 | 🟢 已修 | task-012-1 §2b | **task-002 单源架构根本消除**：updateFieldConfig 改树 + buildIndex，components 永远 fresh，无 stale tree 问题。task-015 的 `safeRead*` 工具函数不再需要 |
| 24 | **layout-block onResize 子组件不级联缩放** | 🟢 已修 | task-2026-07-28-006 | **task-2026-07-28-006 修复**：`getResizedComponents` 改用 `getFieldNodeById(state.components, id)` 取带 children 的完整节点传给 `syncGroupSize2Children`（详见 §3.1） |
| 25 | **tree 拖拽节点入组/出组后组尺寸不更新** | 🟢 已修 | task-012-d recalcGroupBounds subscribe 机制 | **task-2026-07-28-007 修复**：`useOnDrop` trigger 回调追加 `dispatch({ type: 'component/selected', data: 被拖节点.uniqueId })`，使 recalcGroupBounds 能处理目标/源组（详见 §3.2） |

> 加粗的 3 个是 task-012-1 / task-015 / task-016 重点关注的（均已完成或根本消除）。

### 0.1 测试覆盖情况（task-2026-07-29-001 落地）

| 测试目标 | 优先级 | 测试文件 | 用例数 | 说明 |
| --- | --- | --- | --- | --- |
| buildIndex 引用复用 | P0 | `src/designer/renderer/__tests__/utils-buildIndex.spec.ts` | 7 | 回归 task-002 步骤 2（buildIndex 移到 produce 外） |
| updateFieldConfig 边界 | P0 | `src/store/modules/__tests__/designer-canvas-updateFieldConfig.spec.ts` | 10 | reducer 契约：不存在 uniqueId / 空 patch / ROOT 防护 / 浅合并 |
| setState byId 防护 | P0 | `src/store/modules/__tests__/designer-canvas-setState.spec.ts` | 7 | 单源原则：byId/parentMap 不允许直接赋值 |
| Bug #1：syncGroupSize2Children 对 FlatField | P1 | `src/designer/renderer/designer-field/__tests__/getResizedComponents.spec.ts` | 8 | 回归 task-2026-07-28-006（取带 children 节点） |
| Bug #2：recalcGroupInTree 纯函数组合 | P1 | `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts` | 10 | 回归 task-2026-07-28-007（拖拽后组尺寸重算） |
| Bug #3：propsValue useMemo 依赖 | P1 | `src/designer/renderer/designer-field/__tests__/useFieldConf-propsValue.spec.ts` | 6 | 回归 task-2026-07-28-008（补充 children 依赖） |
| setComponents 直接赋值 | P2 | `src/store/modules/__tests__/designer-canvas-setComponents.spec.ts` | 12 | 单源验证 + fieldPreserve/mergeByIdIntoTree 已删除（源码扫描） |
| recalcGroupBounds 简化 | P2 | `src/designer/__tests__/recalcGroupBounds.spec.ts` | 10 | 无 freshChildNodes / beginSkipGroupRecalc（源码扫描） |

**运行命令**：`pnpm test`（等价 `vitest run`），共 72 个测试用例全部通过。

---

## 1. 🔴 待修 bug 详情

### 1.1 setComponents 路径改名丢失（🟢 已修，task-012-1 fieldPreserve + task-012-3 验证 + task-002 单源根本解决）

**现象**：用户改组件名（title）→ `updateFieldConfig` → `byId.title = 'new'`，tree.title 仍是 'old'。之后任意 setComponents 操作（对齐 / 成组 / 拖入图层组），mergeByIdIntoTree 合并后 title 被 tree 旧值覆盖。

**原根因**：`mergeByIdIntoTree` 原 `nodeWins` 方向让 node（tree）全赢，byId 中字段级更新（如改名 title）被 tree 旧值覆盖。

**修复演进**：
- task-012-1（2026-07-24）：`setComponents` / `setState` reducer 合并方向从 `nodeWins` 改为 `fieldPreserve`。`updateFieldConfig` 把 `patch.config` 的 keys 记入 `dirtyConfigKeys`，`fieldPreserve` 合并时对 `dirtyConfigKeys` 中的字段取 byId 值。
- task-012-3：验证改名丢失已修。
- **task-002（2026-07-28）根本解决**：单源架构下 `updateFieldConfig` 改树 + buildIndex，components 唯一真相，无 `mergeByIdIntoTree` 覆盖问题。`fieldPreserve` / `dirtyConfigKeys` 机制随之删除（task-003）。

task-014 原方案（改 `nodeWins` 分支）已被取代。详见 [task-012-3](../../plans/done/task-2026-07-24-012-3-verify-rename-preserve.md)。

---

### 1.2 stale tree 防御性读取未统一封装（🟢 已修，task-002 单源根本消除）

**现象**（双源时代）：任何"读 `state.components` 拿 children"的代码都可能拿到 stale data，导致：
- 拖拽组内子组件 → 组尺寸不更新（task-012-1 已修 recalcGroupBounds）
- 其他类似场景可能仍有 bug（saveAsTemp、designer-scene-monitor 已用 getSaveableComponents）
- 但 layer-manager / drag2layoutBlock / useOnDrop / element.tsx 等工具函数路径**还没审计**

**根因**（双源时代）：updateFieldConfig 只改 byId 不改 components；任何读 components 树的操作都可能拿到 stale。

**彻底修复**（task-002，2026-07-28）：单源架构根本消除。`updateFieldConfig` 改为"改树 + buildIndex"，`components` 引用每次都变，`useSelector` 的 `shallowEqual` 触发 re-render，闭包 `components` 永远 fresh。task-015 原计划的 `safeRead*` 工具函数不再需要（task-002 已从根本上解决）。

> 🗑️ **task-015 状态**：原计划的 `safeRead*` 工具函数已不再需要。task-002 单源架构从根本上消除了 stale tree 问题。task-015 可标记为 `cancelled` 或 `done`（由单源架构替代实现）。

---

### 1.3 mutation 残留 + cloneDeep 滥用（🟢 已修，task-2026-07-28-001 承接 task-016 完成）

**来源**（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计 §2 + §9](../../research/useDesigner迁移可行性审计.md)

> **2026-07-28 完成结论**（task-2026-07-28-001 步骤 1a.1/1a.2/1a.3）：原 task-006 审计的 8 处 mutation **已全部修复**。task-016 的 mutation 清理工作由 task-2026-07-28-001 承接完成。

**已修复的 mutation**（全部）：

| 文件 | 原写法 | 修复 task |
| --- | --- | --- |
| `designer/layer-manager/lock/index.ts` | `config.isLock = true/false` | task-009 |
| `designer/layer-manager/visible/index.ts` | `config.isHidden = true/false` | task-009 |
| `designer/layer-manager/move/index.ts` | `components.splice/push/unshift` | task-010 |
| `designer/renderer/designer-field/index.tsx` | `parents.children = ...filter(...)` | task-010 |
| `designer/configuration-panel/page/index.jsx` | render 内 `Object.assign(state.page, ...)` | task-011-fix |
| `designer/scene-monitor` / `saveAsTemp` 路径 | stale tree 读取 | task-012-1（task-002/003 单源后根本消除） |
| `designer/aside-panel/layers-tree/tree/useOnDrop.ts` L28 | `targetFieldConfig.children.unshift(dropFieldConfig)` | **task-2026-07-28-001**（改为不可变操作） |
| `designer/aside-panel/layers-tree/tree/useOnDrop.ts` L61 | `targetParentChildren.splice(...)` | **task-2026-07-28-001**（改为不可变操作） |
| `designer/renderer/designer-field/element.tsx` syncLayoutBlockSize2Children | 3 处 `_.set` + 3 处 `child.children =` | **task-2026-07-28-001**（改为浅展开 / spread + slice） |
| `designer/common/dnd/drag2layoutBlock.ts` L49 | `layoutBlockNode.children =` | **task-2026-07-28-001**（改为不可变操作） |

**cloneDeep 现状**（task-001 审计，零改动）：

| 文件 | 行 | 函数 / 上下文 | 状态 |
| --- | --- | --- | --- |
| `src/designer/common/dnd/helper.ts` | L60 | `cloneDeep({...})` 创建临时对象，传给 fetchMaterialSchema | 🟢 已审计（task-001），合理使用，保留 |
| `src/designer/toolbar/comp/dataset/DataSetList.tsx` | L120 | `_.cloneDeep(rawDataSetList)` 读 rawDataSetList 转临时数据 | 🟢 已审计（task-001），合理使用，保留 |

> **已澄清**：
> - ❌ `getParent` / `getFieldConf` 内部 cloneDeep —— **实际已删**（task-009），不在本任务范围
> - ❌ `utils.ts` 的 `flatDesignerList` / `getFieldOrderBy` —— **审计后未发现滥用**（task-009/010 已删）
> - ✅ 合理 cloneDeep 使用（白名单）：`resetUniqueId` / `generatorField` / `fetchMaterialSchema` / `resetObjectSealed` —— `utils.ts` L27 / L74 / L199 等位置

> 🗑️ **task-016 状态**：mutation 清理 + cloneDeep 审计工作已由 task-2026-07-28-001 承接完成。task-016 可标记为 `done`。

---

### 1.4 layout-block onResize 子组件不级联缩放（🟢 已修，task-2026-07-28-006）

**现象**：调整 layout-block 尺寸时，内部子组件不跟着调整（正式版正常）。

**根因**：task-007（2026-07-21）引入 `useFieldConf` 字段级订阅 byId：
- [`designer-field/index.tsx:59`](../../src/designer/renderer/designer-field/index.tsx#L59) `dataSource = fieldById || propsDataSource`
- byId 是 FlatField **不含 children**（[hooks.ts](../../src/store/designer/hooks.ts) `useFieldConf` 订阅 `byId[id]`）
- onResize 路径 [`getResizedComponents`](../../src/designer/renderer/designer-field/utils.ts#L151) → `syncGroupSize2Children(dataSource, newConfig)`
- `dataSource` 无 children → [`utils.ts:630`](../../src/designer/renderer/utils.ts#L630) `if (_.isArray(group.children))` 为 false → `resizeField` 不执行 → 子组件不缩放

**影响范围**：layout-block 和 group 的 onResize 都受影响（`syncGroupSize2Children` 不区分类型）。

**修复**（task-2026-07-28-006）：`getResizedComponents` 中改用 `getFieldNodeById(state.components, dataSource.uniqueId)` 取带 children 的完整节点，再传给 `syncGroupSize2Children`。单源后 components 永远 fresh，`getFieldNodeById` 取到的节点即最新。兜底用 `|| dataSource` 防止节点未找到。

**与单源重构的关系**：正交。单源后 byId 仍是 FlatField（不含 children），此 bug 不会被自动修复，但修复更简单（components 永远 fresh）。

**来源**：task-2026-07-28-001 浏览器冒烟发现（[实施记录](../../plans/done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md#7-实施记录) 2026-07-28 条目）。

---

### 1.5 ~~tree 拖拽节点入组/出组后组尺寸不更新~~（🟢 已修，task-2026-07-28-007）

**现象**：在左侧图层树中把节点拖入/拖出组后，tree 呈现正确，但画布上组尺寸"有一定概率"不更新。概率取决于操作前 `component.selected` 是否恰好指向被操作节点且其父是组。

**根因**：[`DesignerContent.tsx`](../../src/designer/DesignerContent.tsx#L287-L329) 的 `recalcGroupBounds` 是 `reduxStore.subscribe` 回调，每次 Redux state 变化都触发，但只处理 `component.selected` 的父组：

```ts
const selectedIds = currentSelected.split(',');
const parentId = parentMap[selectedIds[0]];
if (!parentId || parentId === ROOT_UNIQUE_ID) return; // 非组内节点直接跳过
```

而 tree 拖拽（[`useOnDrop`](../../src/designer/aside-panel/layers-tree/tree/useOnDrop.ts#L112-L116)）只 `dispatch(setComponents(...))`，**不更新 `component.selected`**。所以拖拽后 `selectedIds[0]` 仍是拖拽前的选中状态：
- 若恰好选中被拖拽节点且其父是组 → recalcGroupBounds 处理 → 组尺寸更新 ✓
- 否则 → 直接 return → 组尺寸不更新 ✗

**影响范围**：所有 tree 拖拽操作（入组 / 出组 / 同级排序），只要不恰好选中被操作节点，组尺寸都不更新。

**与单源重构（task-002）的关系**：正交。task-002 删除了 `freshChildNodes` / `shouldSkipGroupRecalc` / 两步同步，但未改 `selectedIds` 判断逻辑，不引入也不修复此 bug。经 git diff 确认 task-002 之前此逻辑已存在（单源重构 squash 前的 `e3e392d` commit）。

**修复**：`useOnDrop` 的 `trigger` 回调中，`dispatch(setComponents(...))` 后追加 `dispatch({ type: 'component/selected', data: 被拖拽节点.uniqueId })`，使 `recalcGroupBounds` 能处理目标组。详见 [task-2026-07-28-007](../../plans/done/task-2026-07-28-007-fix-tree-drop-group-recalc.md)。

**来源**：task-2026-07-28-002 浏览器冒烟发现（2026-07-28）。

---

## 2. 🟡 部分修复待 follow-up

### 2.1 ~~改名丢失（task-012-d 部分绕过）~~（🟢 已修，task-012-1 fieldPreserve + task-002 单源根本解决）

~~绕过方案：图层树从 byId 读 title 替代 tree。~~

**已彻底修复**：
- task-012-1（2026-07-24）：`fieldPreserve` + `dirtyConfigKeys` 机制保留字段级更新。保存走 `getSaveableComponents`（byIdWins）也保留。
- **task-002（2026-07-28）根本解决**：单源架构下 `updateFieldConfig` 改树，components 唯一真相，无 `mergeByIdIntoTree` 覆盖问题。`fieldPreserve` / `dirtyConfigKeys` / `getSaveableComponents` 机制随之删除（task-003）。

详见 [task-012-3](../../plans/done/task-2026-07-24-012-3-verify-rename-preserve.md)。

---

## 3. 🟢 已修 bug 索引（按时间倒序）

### 3.1 task-2026-07-28-001/002/003 单源重构修复（2026-07-28）

| bug | 修复 |
| --- | --- |
| layout-block/group onResize 子组件不级联缩放 | task-2026-07-28-006：`getResizedComponents` 改用 `getFieldNodeById(state.components, id)` 取带 children 节点传给 `syncGroupSize2Children`（byId FlatField 无 children 导致命中失败） |
| mutation 残留（useOnDrop L28/L61 + syncLayoutBlockSize2Children + drag2layoutBlock） | task-2026-07-28-001：全部改为不可变操作 |
| cloneDeep 滥用 | task-2026-07-28-001：审计完成，零改动（2 处均合理使用） |
| 改名丢失 | task-2026-07-28-002：单源架构根本解决（components 唯一真相，无 mergeByIdIntoTree 覆盖） |
| 保存丢失（拖拽/配置面板改属性） | task-2026-07-28-002/003：单源后 components 永远 fresh + 直接序列化，删除 getSaveableComponents |
| 拖拽组内子组件组尺寸不更新 | task-2026-07-28-002：单源后 components 永远 fresh，recalcGroupBounds 直接读 parents.children |
| handleAlign 闭包覆盖 | task-2026-07-28-002：单源后闭包 components 永远 fresh，改回方案 B（1 次 setComponents） |
| stale tree 防御性读取 | task-2026-07-28-002：单源架构根本消除（updateFieldConfig 改树 + buildIndex） |

### 3.2 task-2026-07-28-007 修复（2026-07-29）

| bug | 修复 |
| --- | --- |
| tree 拖拽节点入组/出组后组尺寸不更新 | 两处改动：(1) `useOnDrop.ts` trigger payload 追加 `draggedNodeUniqueId` + `tree/index.tsx` onDrop 追加 `dispatch(component/selected)` 处理入组；(2) `useOnDrop.ts` 新增 `recalcGroupInTree` 在拖拽后直接对原父组重算尺寸（处理出组——recalcGroupBounds 因 selected 父是根而跳过，组 data 引用未变导致 byId 引用复用、组框不渲染） |

### 3.3 task-012-1 修复（2026-07-24）

| bug | 修复 |
| --- | --- |
| 保存丢失（拖拽/配置面板改属性） | `getSaveableComponents` + 3 个保存路径替换 + mergeByIdIntoTree 加 byIdWins 方向（**task-003 已删除，改为直接序列化**） |
| 拖拽组内子组件组尺寸不更新 | `recalcGroupBounds` 用 freshChildNodes（byId 重算）（**task-002 已删除，单源后直接读 parents.children**） |
| handleAlign skip 标志异常卡住 | try/finally 保护（**task-003 已删除 skip 标志机制**） |

### 3.3 task-012-d 修复（2026-07-23/24）

| bug | 修复 |
| --- | --- |
| setState 丢弃字段 | 拆 setState 为 setComponents + setDesignerCanvasState |
| splitGroup / generatorGroup byId 不含 children | 签名扩展：接收 byId + parentMap 参数 |
| handleAlign 闭包覆盖 | 累计 results 链式传递（**task-002 改回方案 B**） |
| updateFieldConfig 不同步 components | 彻底删 needsTreeSync / syncInTree（P6 优化）（**task-002 进一步改为改树 + buildIndex**） |
| 渲染性能 P0-P8 | 多组件拆字段级订阅 + shallowEqual |
| 组点击不到 | 修复 group 选中事件 |
| 改名丢失 | **部分修复**（图层树从 byId 读）（**task-002 单源根本解决**） |
| 组内成组爆栈 | 修复 splitGroup 递归 |
| 组内对齐跳变 | beginSkipGroupRecalc / endSkipGroupRecalc（**task-003 已删除 skip 标志**） |

### 3.4 task-011 系列修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| `useDesigner` / `DesignerContext` / `DataProvider` 兼容壳残留 | 删除，统一用 useSelector / useDispatch / useFieldConf |
| `runtimeComponentsTrigger` EventBus 残留 | 删除，用 useSelector 字段级订阅 |
| `useSyncDesignerUpdate` 全局通知 | 删除 |
| `useDebounceMergeConfig` 30ms 防抖 | 删除（防抖不再需要） |
| `useRealtimeDataFlow` / `useCustomFieldsList` 边缘行为差异 | 注释说明 |
| toolbar `designerState={state}` 崩溃 | useMemo 构造 |
| toolbar useSelector 未配 shallowEqual | 补齐 |

### 3.5 task-010 修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| layer-manager mutation（splice/push） | 不可变改造 |
| designer-field `parents.children = parents.children.filter(...)` mutation | 不可变改造 |
| getFieldOrderBy 双重 cloneDeep | 部分清理 |

### 3.6 task-009 修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| `getFieldConf` / `getParent` 内部 cloneDeep | 删 cloneDeep |
| `setLevelPath` mutation | 改为不可变版（produce） |

### 3.7 task-008 修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| 配置面板 onChange 60+ 次/秒 → 全树重建 | 新增 `updateFieldConfig` action，O(1) 字段级更新（**task-002 改为改树 + buildIndex O(n) + 引用复用**） |
| drag2layoutBlock 不响应 byId | 改用 useSelector(s => byId[id]) |
| onDragStop 走 setState 整树 | 改用 updateFieldConfig |

### 3.8 task-007 修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| Context 订阅粒度粗（全量 setState） | 引入 byId / parentMap 索引 + useFieldConf |
| EventBus 反模式（runtimeComponentsTrigger） | 用 useSelector 字段级订阅 |
| useDesignerSettingChange 高频路径（不触发 React） | 删除 |

### 3.9 task-006 修复（2026-07-21）

| bug | 修复 |
| --- | --- |
| 画布 state 走 Context + useState + Immer | designerCanvas slice 迁入 Redux + Immer |
| useDesigner 消费方 17 个文件 | 兼容壳 + 逐步迁移 |
| 8 处直接 mutation | 留 task-010 修（**task-2026-07-28-001 全部完成**） |

### 3.10 task-005 修复（2026-07-20）

| bug | 修复 |
| --- | --- |
| 私有 store 切断主 store component / app slice | viewCanvas / viewUI 合并到主 store |

---

## 4. 排查 checklist（新增 bug 时）

新增 bug 时按以下 checklist 排查，看是否是已知问题：

- [ ] 是 "读不到最新值" 类？看 [03-read-path.md §9](./03-read-path.md) 易错点
- [ ] 是 "保存后字段丢失" 类？看 §1.1（🟢 已修，task-002 单源根本解决）
- [ ] 是 "组操作异常" 类？看 [04-edge-cases.md §1](./04-edge-cases.md)（recalcGroupBounds）
- [ ] 是 "拖拽异常" 类？看 [04-edge-cases.md §3](./04-edge-cases.md)（单源后闭包永远 fresh，stale 风险已消除）
- [ ] 是 "性能问题" 类？看 [06-principles.md §3](./06-principles.md)（mutation / cloneDeep）
- [ ] 是 "render 内 mutation" 类？看 §1.3（🟢 已修，task-2026-07-28-001）

---

## 5. 相关文档

- 设计 spec：[00-overview.md](./00-overview.md)（本目录索引）
- 审计（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计](../../research/useDesigner迁移可行性审计.md)
- 任务归档：`.trae/skills/oss-visual-designer-project-context/plans/done/task-2026-07-21-006~012*`
- 待办任务：
  - [task-012-3 验证改名丢失已修](../../plans/done/task-2026-07-24-012-3-verify-rename-preserve.md)
  - ~~[task-015 stale tree 防御](../../plans/task-2026-07-24-015-stale-tree-defensive-reading.md)~~ **（task-002 单源架构根本消除，可标记 done/cancelled）**
  - ~~[task-016 mutation + cloneDeep 清理](../../plans/task-2026-07-24-016-audit-cloneDeep-mutations.md)~~ **（task-2026-07-28-001 承接完成，可标记 done）**
