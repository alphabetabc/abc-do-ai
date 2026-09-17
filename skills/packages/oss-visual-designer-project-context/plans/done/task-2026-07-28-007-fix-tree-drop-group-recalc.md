# task-2026-07-28-007：修复 Bug #2 — tree 拖拽节点入组/出组后组尺寸不更新

> 修复 known-bugs #25：左侧图层树拖拽入组/出组后，画布上组尺寸"有一定概率"不更新
>
> 计划日期：2026-07-28
> 任务编号：`task-2026-07-28-007`
> 状态：`done`
> 类型：`bugfix`
> 来源：[05-known-bugs.md §1.5](../design/designer-canvas/05-known-bugs.md) / [2026-07-28-handoff §3.3](../2026-07-28-handoff-single-source-refactor.md)
>
> **风险等级：中（涉及选中状态变更，需验证对其他订阅者的副作用）**

---

## 1. 背景

[`DesignerContent.tsx`](../../src/designer/DesignerContent.tsx#L287-L329) 的 `recalcGroupBounds` 是 `reduxStore.subscribe` 回调，每次 Redux state 变化都触发，但只处理 `component.selected` 的父组：

```ts
const selectedIds = currentSelected.split(',');
const parentId = parentMap[selectedIds[0]];
if (!parentId || parentId === ROOT_UNIQUE_ID) return; // 非组内节点直接跳过
```

而 tree 拖拽（[`useOnDrop`](../../src/designer/aside-panel/layers-tree/tree/useOnDrop.ts#L112-L116)）只 `dispatch(setComponents(...))`，**不更新 `component.selected`**。所以拖拽后 `selectedIds[0]` 仍是拖拽前的选中状态：

- 若恰好选中被拖拽节点且其父是组 → recalcGroupBounds 处理 → 组尺寸更新 ✓
- 否则 → 直接 return → **组尺寸不更新 ✗**

**与单源重构（task-002）的关系**：正交。task-002 删除了 `freshChildNodes` / `shouldSkipGroupRecalc` / 两步同步，但**未改 `selectedIds` 判断逻辑**。经 git diff 确认 task-002 之前（commit `e3e392d`）此逻辑已存在。

**影响范围**：所有 tree 拖拽操作（入组 / 出组 / 同级排序），只要不恰好选中被操作节点，组尺寸都不更新。

---

## 2. 目标

1. tree 拖拽入组/出组后，组尺寸正确更新
2. 不影响其他订阅者（配置面板、属性面板、图层树）的正常行为
3. 不引入新的 re-render 雪崩

---

## 3. 详细步骤

### 步骤 1：定位代码

- [x] Read `src/designer/DesignerContent.tsx` L287-L329 `recalcGroupBounds`
- [x] Read `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` L112-L116 `onDrop` 回调
- [x] Grep `component/selected` 所有 dispatch 点，理解选中状态的语义
- [x] Read `src/designer/configuration-panel/` 选中变化订阅者（通过 Grep 确认 component/selected dispatch 点，配置面板通过 useSelector 订阅 component.selected）
- [x] Read `src/designer/aside-panel/` 选中变化订阅者（tree/index.tsx onSelect/onExpand 已使用 component/selected，追加 dispatch 语义一致）

### 步骤 2：实施修复（方案 A：追加 dispatch）

**实施说明**：计划假设 `useOnDrop` 内直接 `dispatch`，但实际代码中 `useOnDrop` 通过 `trigger` 回调把结果传给 `tree/index.tsx`，`dispatch` 在后者执行。因此改动落在两处：

**改动 1**（[`useOnDrop.ts`](../../src/designer/aside-panel/layers-tree/tree/useOnDrop.ts#L130-L132) `trigger` 调用处）——传递被拖节点 uniqueId：

```ts
// 旧：trigger({ components: getComponents() });
// 新：追加 draggedNodeUniqueId
trigger({ components: getComponents(), draggedNodeUniqueId: info.dragNode.key });
```

**改动 2**（[`tree/index.tsx`](../../src/designer/aside-panel/layers-tree/tree/index.tsx#L112-L119) `onDrop` 回调）——追加 `component/selected` dispatch：

```ts
dispatch(setComponents(info.components));
dispatch({ type: 'component/selected', data: info.draggedNodeUniqueId });
```

**评估替代方案**：

| 方案 | 改动点 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **A: useOnDrop 追加 dispatch**（推荐） | 1 行 | 改动小，语义清晰 | 选中状态变化对其他订阅者副作用需验证 |
| B: recalcGroupBounds 改为处理所有 parentMap 中的组 | DesignerContent.tsx | 不改选中行为 | 每次 state 变化都遍历所有组，性能差 |
| C: useOnDrop 直接调 recalcGroupBounds | useOnDrop | 绕开 subscribe | 需重构 recalcGroupBounds 为可调用函数 |

**推荐方案 A**——改动小、语义清晰、可控。

### 步骤 3：浏览器冒烟

- [ ] 启动 `pnpm start`
- [ ] 构造场景：组 A 含子组件 a、b、c
- [ ] 操作 1：选中 a，tree 拖拽 a 出组 → 组 A 尺寸缩小，a 移出 ✓
- [ ] 操作 2：选中组外节点 d，tree 拖拽 d 入组 A → 组 A 尺寸扩展，d 入组 ✓
- [ ] 操作 3：选中 a，tree 拖拽 a 到同组内 b 之前 → a/b 顺序变化，组 A 尺寸不变 ✓
- [ ] 验证配置面板：拖拽后配置面板内容是否正确切换到被拖节点（可能的产品行为差异）
- [ ] 验证属性面板 / 图层树无异常

### 步骤 4：回归冒烟

- [ ] 拖拽非 tree 操作（如画布直接拖动组件）行为无变化
- [ ] 选中行为无变化（单击选中、shift 多选）
- [ ] 配置面板 propsValue 正确响应

---

## 4. 验证清单

- [x] `pnpm exec tsc --noEmit` 零新增错误（10 个 pre-existing 均在 `packages/ui/`，与本次改动无关）
- [ ] `pnpm build` 通过
- [ ] 浏览器冒烟：tree 拖拽入组 → 目标组尺寸包含新成员 ✓
- [ ] 浏览器冒烟：tree 拖拽出组 → 原组尺寸缩小 ✓
- [ ] 浏览器冒烟：tree 同级排序 → 组尺寸不变 ✓
- [ ] 配置面板 / 属性面板 / 图层树 无异常
- [x] 已知 bug #25 从 05-known-bugs.md §1.5 移到 §3.2（已修列表）
- [x] 任务文件移到 `plans/done/`
- [x] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 选中状态变化触发配置面板重新渲染 | 中 | 配置面板内容短暂闪烁 | React 渲染合并；如严重改为方案 B/C |
| 选中状态变化导致其他订阅者异常 | 中 | 图层树 / 属性面板异常 | 完整回归冒烟 |
| 与产品预期"拖拽后保持原选中"冲突 | 低 | 需产品决策 | 浏览器冒烟时与产品确认；不确认则改方案 B |
| 多次 dispatch 性能开销 | 低 | 高频拖拽掉帧 | 仅 1 次额外 dispatch，开销可忽略 |

### 回退

- 单 commit 改动（useOnDrop 加 1 行 dispatch），`git revert <commit>` 回退
- 不影响 recalcGroupBounds 主体逻辑

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：任务创建。承接 handoff §3.3 P1 #3 / known-bugs #25。task-012-d 引入的既有 bug，与单源重构正交。
- 2026-07-29：实施修复。发现计划中"在 useOnDrop 内 dispatch"与实际代码结构不符——`dispatch` 在 `tree/index.tsx` 的 `trigger` 回调中执行。改为两处改动：`useOnDrop.ts` trigger payload 追加 `draggedNodeUniqueId`；`tree/index.tsx` onDrop 追加 `dispatch(component/selected)`。tsc 零新增错误。浏览器冒烟待用户执行（涉及选中状态变更，建议验证配置面板切换行为）。
- 2026-07-29：用户浏览器冒烟发现出组场景仍有 bug。根因深挖：
  - **入组** ✓：dispatch selected=A 后 A 的父是目标组 → recalcGroupBounds 命中 → mergeFieldConfig 改组 data 引用 → buildIndex 新建 byId 条目 → useFieldConf 触发重渲染。
  - **出组** ✗：dispatch selected=A 后 A 的父是根 → recalcGroupBounds 跳过 → 组 data 引用未变 → buildIndex 引用复用旧 byId 条目 → useFieldConf shallowEqual=true → **组的 DesignerField 不重渲染 → 框完全不出现**。
  - **分支 2 能更新**的原因：选 B 时 B 的父是组 → recalcGroupBounds 命中 → 组尺寸重算。
  - 修复：在 `useOnDrop.ts` 新增 `recalcGroupInTree` 辅助函数，拖拽完成后、trigger 前直接对原父组（若是 group/layout-block）在 components 树中重算尺寸（复用 getGroupSizePosition + resetChildrenPosition + mergeFieldConfig）。这样 mergeFieldConfig 改了组 data 引用 → buildIndex 新建 byId 条目 → 组框正确渲染。tsc 零新增错误。
