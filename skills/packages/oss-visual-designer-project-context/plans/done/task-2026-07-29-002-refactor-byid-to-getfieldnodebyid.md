# task-2026-07-29-002：工具函数 store.getState().byId 改为 getFieldNodeById

> 单源后 byId 不应再作为独立读路径，重构隐式 store 依赖为显式 state 参数
>
> 计划日期：2026-07-29
> 任务编号：`task-2026-07-29-002`
> 状态：`cancelled`
> 类型：`refactor`
> 来源：[2026-07-28-handoff §4.2 #2](../2026-07-28-handoff-single-source-refactor.md) / 原 task-002 §7.1 已知架构债务
>
> **风险等级：中（涉及函数签名变更与调用方迁移）**
>
> ---
>
> ## ⚠️ 取消说明（2026-07-29 review）
>
> **本 task 经 review 后取消，立论与权威设计文档冲突，不应执行。**
>
> ### 立论误判
>
> task 原立论："byId 不应再作为独立读路径 → 破坏单源不变量"。
>
> 事实：单源契约（[`06-principles.md §4`](../design/designer-canvas/06-principles.md)）约束的是**写路径**——byId 不能被外部直接赋值，只能由 `buildIndex` 从 components 派生。**读路径层面 byId 是合法的 O(1) 派生索引**，[`06-principles.md §1.2`](../design/designer-canvas/06-principles.md) 与 [`§7.4`](../design/designer-canvas/06-principles.md) 明确把 `store.getState().byId[id]` 列为**正确写法**。
>
> [`03-read-path.md §8 决策树`](../design/designer-canvas/03-read-path.md) 进一步明确：异步回调读最新时，**不需要 children 用 `.byId[id]`（O(1)），需要 children 才用 `getFieldNodeById(components, id)`（O(n) 递归）**。二者是按需选择，不是互相替代。
>
> ### 目标函数已重构
>
> task 点名的两个"待重构函数"实际已由前置 task 重构完成：
>
> - `recalcGroupBounds`（`src/designer/DesignerContent.tsx:296`）已用 `getFieldNodeById(designerCanvas.components, parentId)`——因为它需要 `parents.children`
> - `setChildren2LayoutBlock`（`src/designer/common/field/layout-block/helper/element.tsx:160`）已用 `getFieldNodeById(stateComponents, ...)`，仅残留一行 byId 兜底
>
> ### 残留调用 5/7 合规
>
> grep 真实残留的 7 处 `store.getState().designerCanvas.byId[...]`：
>
> - 5 处合规（layer-manager visible/lock/copy + canvas-graph handleAlign + designer-field onDrag）：不需要 children，byId 是推荐读法；强改 getFieldNodeById 反而 N×O(1) → N×O(depth) 性能回退
> - 2 处冗余兜底（`drag2layoutBlock.ts:46` / `element.tsx:158`）：下一行 `getFieldNodeById(...) || byId兜底` 命中时用不到 byId，属代码整洁度问题，非架构债务
>
> ### 结论
>
> 立论错误 + 目标已达成 + 残留大部分合规。强行推进会违背 `03-read-path.md` 决策树并引入性能回退。如未来要清理 2 处冗余兜底，按整洁度问题处理即可，无需单独立 task。

---

## 1. 背景

单源架构下（task-002/003）byId 变为**纯派生（只读）**，仅由 `buildIndex` 从 components 树派生。

但部分工具函数仍有**隐式 store 依赖**——直接用 `store.getState().byId` 取数据，绕过单源架构的"读 components 树"原则：

- `setChildren2LayoutBlock` —— 通过 store 隐式取 byId
- `recalcGroupBounds` 内部辅助函数 —— 通过 store 隐式取 byId

**架构债务（handoff §4.2 #2）**：
- byId 不应作为独立读路径 → 破坏单源不变量（开发者可能误以为 byId 是真相源）
- 隐式 store 依赖 → 函数难以测试（需要 mock store）
- 与 task-007 引入的 `getFieldNodeById` 设计原则不一致

**前置依赖**：[task-2026-07-28-006（Bug #1 修复）](./task-2026-07-28-006-fix-onresize-cascade.md) — Bug #1 修复会先把 `getResizedComponents` 改为走 `getFieldNodeById(state, id)`，本 task 可复用其模式。

---

## 2. 目标

1. 把工具函数中对 `store.getState().byId` 的直接访问改为 `getFieldNodeById(state, id)` 形式
2. 函数签名显式接收 `state` 参数（不再隐式依赖 store）
3. 调用方迁移到新签名
4. 440 组件场景性能无回归（函数纯化后调用开销应下降）

---

## 3. 详细步骤

### 步骤 1：枚举重构目标

- [ ] Grep `store.getState().byId` 所有调用点
- [ ] 列出每个工具函数 + 调用方
- [ ] 重点关注：renderer/utils.ts + common/dnd/* + aside-panel/layers-tree/*

### 步骤 2：评估重构方案

对每个工具函数，按下表评估：

| 维度 | 旧 | 新 |
| --- | --- | --- |
| 函数签名 | `foo(uniqueId)` | `foo(state, uniqueId)` |
| 数据来源 | `store.getState().byId[id]` | `getFieldNodeById(state.components, id)` |
| 可测试性 | 需 mock store | 直接传 state 对象 |
| 闭包风险 | 无（每次 getState 取最新） | 需调用方保证 state 新鲜 |

### 步骤 3：实施重构

- [ ] 按步骤 2 方案逐个修改
- [ ] 每个函数独立 commit
- [ ] 调用方同步迁移
- [ ] commit message 标明重构函数 + 调用方

### 步骤 4：回归验证

- [ ] 完整冒烟：拖拽 / 选中 / 配置面板 / 图层树 / onResize / 对齐 / 成组 / 拆组
- [ ] `pnpm exec tsc --noEmit` 零新增错误
- [ ] `pnpm build` 通过
- [ ] 440 组件场景性能无回归

---

## 4. 验证清单

- [ ] 工具函数签名统一为 `(state, uniqueId)` 形式
- [ ] 调用方全部迁移
- [ ] `store.getState().byId` 引用数降为 0（Grep 验证）
- [ ] 浏览器冒烟全部通过
- [ ] `pnpm exec tsc --noEmit` 零新增错误
- [ ] `pnpm build` 通过
- [ ] 440 组件场景性能无回归（对比修复前）
- [ ] 任务文件移到 `plans/done/`
- [ ] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 调用方多（10+） | 中 | review 工作量大 | 按文件分组独立 commit |
| 闭包陷阱（state 不新鲜） | 中 | 渲染异常 | 调用方用 `useStore().getState()` 或 selector |
| 改错函数语义 | 中 | 行为回归 | 完整冒烟 |
| 性能开销（getFieldNodeById O(depth)） | 低 | 高频调用掉帧 | 性能验证；必要时缓存 |

### 回退

- 每个函数独立 commit，可单独 `git revert <commit>`
- 旧签名（隐式 store）兼容代码可作为过渡

---

## 6. 实施记录

> 实施过程中按时间顺序追加。
>
> **重构清单**（逐步填入）：

| 文件 | 函数 | 当前签名 | 新签名 | 调用方数 | 状态 |
| --- | --- | --- | --- | --- | --- |
| （待 grep 填充） | | | | | |

- 2026-07-29：任务创建。承接 handoff §4.2 #2 架构债务。原 task-002 §7.1 已识别，未实施。
- 2026-07-29：review 后取消。发现立论与 `06-principles.md` / `03-read-path.md` 冲突——单源契约约束写路径而非读路径，byId 是合规 O(1) 读法；且点名的两个函数已由前置 task 重构完成，残留 7 处 byId 调用 5 处合规、2 处冗余兜底。详见文首"取消说明"。未改动任何代码。
