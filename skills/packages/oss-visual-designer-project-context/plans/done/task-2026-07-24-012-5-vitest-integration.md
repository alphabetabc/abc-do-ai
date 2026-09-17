# task-2026-07-24-012-5：vitest 集成不变量测试

> 覆盖 task-012-1/012-2/012-3 修复的核心数据流不变量，端到端防回归
>
> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-012-5`
> 上游任务：
> - [task-2026-07-24-012-4-vitest-unit-reducer](./task-2026-07-24-012-4-vitest-unit-reducer.md)（planning，纯函数 + reducer 测试基础设施）
>
> 状态：`done`（2026-07-28）
> 类型：`test`
>
> **⚠️ 本任务已被新任务替代**：原 plan 基于 `mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve` / `getSaveableComponents` / skip 机制等单源前架构（已被 task-2026-07-28-002/003 删除），实际不可执行。**测试目标由 [task-2026-07-29-001-vitest-unit-reducer-single-source](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接**（基于单源架构重写）。本任务状态标记为 `done` 以表达"目标已实现"，实际工作在新 task 中执行。
>
> **风险等级：低（仅新增测试文件，不改源码）**
>
> **设计依据**：`.trae/documents/design/designer-canvas/04-edge-cases.md`、`05-known-bugs.md`

---

## 1. 背景

### 1.1 为什么需要集成测试

task-012-4 覆盖了纯函数 + reducer 的单元测试，但连环 bug 的很多场景是**多步操作组合**才触发的：

- task-012-2 的 bug：拖动 a → recalcGroupBounds → 选中变化 → recalcGroupBounds 再次触发（读 stale 树）
- task-012-1 的 bug：ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状（dirtyConfigKeys 跨 setComponents 保留）
- task-012-3 的 bug：改名 → 对齐 → 保存 → title 丢失

这些场景单靠单元测试抓不到，需要模拟完整的多步 dispatch 序列。

### 1.2 与 task-012-4 的关系

task-012-4 建立的 `createTestState()` 工厂函数和 reducer 测试基础设施，本 task 直接复用。本 task 的测试是**多步 reducer dispatch + 断言最终 state**，不涉及 React 渲染。

---

## 2. 目标

1. 覆盖 task-012-1/012-2/012-3 修复的核心不变量
2. 每个测试用例模拟完整的多步操作序列（dispatch 链）
3. 所有测试 `pnpm vitest run` 通过

---

## 3. 详细测试用例

### 3.1 组尺寸重算不变量（task-012-2 修复）

**场景：拖动子组件后组 bbox 正确 + 绝对位置不变**

- [ ] 组内 abcd，拖 a 向右 → 组 width 扩展，a 的绝对位置 = 拖动后位置
- [ ] 组内 abcd，拖 a 向左成为最左 → 组 left 补偿，a 的绝对位置不变
- [ ] 组内 abcd，拖 a 向上成为最上 → 组 top 补偿，a 的绝对位置不变
- [ ] 组内 abcd，拖 a 向下 → 组 height 扩展，a 的绝对位置不变

**场景：选中变化不改位置（task-012-2 v1 引入的 bug）**

- [ ] 拖 a 后，dispatch 选中变化 → recalcGroupBounds 触发 → 组位置不跳回旧值
- [ ] 拖 a 后，dispatch 选中 a → recalcGroupBounds 触发 → 组位置不跳回旧值
- [ ] 拖 a 后，dispatch 选中组 → recalcGroupBounds 触发 → 组位置不跳回旧值

**场景：skip 路径不受影响（task-012-d）**

- [ ] beginSkipGroupRecalc → 拖 a → endSkipGroupRecalc → 组尺寸更新但位置不变

### 3.2 字段级更新保留不变量（task-012-1 修复）

**场景：ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状**

- [ ] ab 对齐（setComponents，a.top 改为 b.top）→ 拖 b（updateFieldConfig b.top）→ cd 对齐（setComponents）→ a.top 仍为对齐后的值（未被 b 的拖动覆盖）
- [ ] ab 对齐 → 拖 b → ab 再次对齐 → b.top 为拖动后的值（未被第一次对齐覆盖）

**场景：改名后 setComponents 不丢 title（task-012-3 验证）**

- [ ] 改名（updateFieldConfig title='new'）→ 对齐（setComponents）→ byId.title='new' + tree.title='new'
- [ ] 改名 → 成组（setComponents）→ title 保留
- [ ] 改名 → 拖动（updateFieldConfig left）→ 对齐（setComponents）→ title + left 都保留

### 3.3 保存序列化不变量

- [ ] 拖动 + 改名后 `getSaveableComponents` → JSON 中 left/top/title 都正确
- [ ] 多次 setComponents + updateFieldConfig 交替后 → 保存结果与 byId 一致

---

## 4. 实施步骤

### 步骤 1：复用 task-012-4 的测试基础设施

- [ ] 确认 `createTestState()` 工厂函数可用
- [ ] 确认 reducer 测试的 dispatch 模式可用

### 步骤 2：创建测试文件

```
src/designer/__tests__/recalcGroupBounds.spec.ts  # 组尺寸重算不变量
src/store/modules/__tests__/designer-canvas-integration.spec.ts  # 字段级更新 + 保存不变量
```

### 步骤 3：实现测试用例

按 §3 的用例列表逐个实现。每个用例模拟完整 dispatch 链。

### 步骤 4：跑测试

- [ ] `pnpm vitest run` 全部通过
- [ ] task-012-4 的测试也仍通过（无回归）

---

## 5. 验证清单

- [ ] `pnpm vitest run` 全部通过（含 task-012-4）
- [ ] task-012-2 的 3 类场景全覆盖（组 bbox + 选中不跳回 + skip 路径）
- [ ] task-012-1 的 2 类场景全覆盖（ab 对齐恢复 + 改名保留）
- [ ] 保存序列化不变量覆盖

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| recalcGroupBounds 在 DesignerContent.tsx 中，依赖组件闭包 | 中 | 测试难以直接调用 | 抽取核心逻辑为纯函数测试，或 mock 组件上下文 |
| 多步 dispatch 序列构造复杂 | 中 | 测试代码冗长 | 抽 `dispatchSequence()` 工具函数 |

### 回退

- 测试文件独立，删除即可回退
- 不改任何源码

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建。task-012-4 覆盖单元测试后，本 task 覆盖集成不变量——模拟完整多步 dispatch 序列，端到端验证 task-012-1/012-2/012-3 修复的正确性。
- **2026-07-28：状态变更 `planning` → `done`（被新任务替代）**。原因：原 plan 基于 `mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve` / `getSaveableComponents` / skip 机制等单源前架构，已被 task-2026-07-28-002/003 删除，无法按原计划执行。**测试目标由 [task-2026-07-29-001-vitest-unit-reducer-single-source](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接**（基于单源架构重写）。原计划文件保留作为历史参考。
