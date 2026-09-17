# task-2026-08-05-005：designer-core `useTree` equalityFn 文档修正

> 创建日期：2026-08-05
> 完成日期：2026-08-06
> 状态：`done`
> 类型：`docs`
> 前置文档：[research/tango-cross-review报告.md](../research/tango-cross-review报告.md) §3.2

---

## 1. 背景与目标

### 1.1 背景

Tango 交叉印证报告发现 `useTree` 的 `shallowEqual` 对 `components` 数组的比较语义不精确。`updateNode` 沿路径浅拷贝**总是生成新数组引用**，即使只有 1 个节点变了，`shallowEqual` 也会判定为"已变化"。

经过分析，这**不是 bug**——树确实变了，`useTree` 返回新数组是正确行为。但文档没有说明这个行为，消费者可能误以为 `useTree` 在 `updateNode` 场景下不会 re-render。

### 1.2 目标

补充文档说明 `useTree` equalityFn 在不同写路径下的行为，指导消费者正确使用 `useMemo` / `useFlatTree`。

### 1.3 不做什么

- **不改代码逻辑**：`shallowEqual` 保持不变
- 不改 `useNode` / `useFlatTree` / `useExtra` 的 equalityFn
- 不改测试

---

## 2. 详细步骤

### 2.1 `03-read-path.md`：§3.2 补充行为说明

**文件**：[`design/03-read-path.md`](../design/designer-core/03-read-path.md) §3.2

**补充内容**：

在 §3.2 `useTree` 章节补充行为说明表：

| 场景 | components 引用 | shallowEqual 结果 | useTree 是否 re-render |
|---|---|---|---|
| `setTree`（整树替换） | 变 | true（变化） | 是（正确） |
| `updateNode`（字段级） | 变（沿路径浅拷贝） | true（变化） | 是（正确，但消费者应 useMemo） |
| `setPartialState`（不含 components） | 不变 | false（无变化） | 否（正确） |

并补充消费者使用建议：

> **消费者使用建议**：
> - `useTree` 返回的 `components` 数组在 `updateNode` 场景下每次都会变化，直接 `.map()` 会触发不必要的重算
> - 需要扁平化时用 `useFlatTree`（内建 `useMemo`）
> - 需要派生计算时用 `useMemo(() => derive(tree), [tree])`
> - 只需单个节点时用 `useNode(id)`（字段级订阅，不受 `updateNode` 其他节点影响）

### 2.2 `hooks.ts`：注释更新

**文件**：[`packages-next/designer-core/src/react/hooks.ts`](../../../packages-next/designer-core/src/react/hooks.ts) L59-73

**改动**：更新 `useTree` 的 JSDoc 注释

在现有注释中补充：

```ts
/**
 * useTree：整树订阅 hook
 *
 * ...
 * 契约：
 * - 订阅 state.components（整树）
 * - 框架强制 shallowEqual（默认 true，不可关闭，防止 byId 变化触发整树 reconcile）
 * - ⚠️ updateNode 场景下 components 引用总是变化（沿路径浅拷贝），useTree 会 re-render
 *   消费者应使用 useMemo 或 useFlatTree 避免不必要的重算
 * - 业务如需扁平化，自行 useMemo(() => flatList(tree), [tree])
 */
```

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| 文档行为说明表已补充 | Read 03-read-path.md §3.2 |
| hooks.ts 注释已更新 | Read hooks.ts L59-73 |
| 无代码逻辑改动 | git diff 确认只有注释和文档变更 |

---

## 4. 风险与回退

纯文档 + 注释改动，无风险，无回退需求。

---

## 5. 实施记录

### 5.1 实施步骤

1. **更新任务状态**：`planning` → `in-progress`（roadmap.md + task plan 顶部状态行）
2. **修改 `hooks.ts` JSDoc**（`packages-next/designer-core/src/react/hooks.ts` L45-60 `useTree` 注释）：
   - 在"契约"小节追加第 3 条：`⚠️ updateNode 场景下 components 引用总是变化（沿路径浅拷贝），useTree 会 re-render，消费者应使用 useMemo 或 useFlatTree 避免不必要的重算`
3. **修改 `03-read-path.md` §3.2**（`packages-next/designer-core/src/react/hooks.ts` 对应框架读路径设计文档）：
   - 在原 §3.4 之后新增 **§3.5 不同写路径下的 shallowEqual 行为**，三个子节：
     - §3.5.1 行为说明表（setTree / updateNode / setPartialState 三场景对比）
     - §3.5.2 消费者使用建议（4 条决策指引）
     - §3.5.3 与 Tango 对照（解释 Zustand vs MobX 模型差异）
   - **未改动原 §3.2 契约条款**（避免破坏现有 review 结论）

### 5.2 验证结果

| 验证项 | 结果 | 证据 |
| --- | --- | --- |
| `03-read-path.md` 行为说明表已补充 | ✅ | Read §3.5.1 L174-181 |
| `03-read-path.md` 消费者使用建议已补充 | ✅ | Read §3.5.2 L185-192 |
| `hooks.ts` 注释已更新 | ✅ | Read L45-60 + git diff 仅 +2 行注释 |
| 无代码逻辑改动 | ✅ | `git diff HEAD -- packages-next/designer-core/src/react/hooks.ts` 仅显示 JSDoc 追加；`useTree` 实现 L61-76 未触碰 |
| `useFlatTree` / `useNode` / `useExtra` 的 equalityFn 未改 | ✅ | Read hooks.ts 全文（174 行），仅 L54-55 新增 2 行注释 |

### 5.3 实施过程中的发现

- **`.trae/` 目录不在 git 跟踪范围**：`git status` 不显示 `03-read-path.md`、`roadmap.md`、`task-*.md` 的改动。这符合 AI 协作区不入版本控制的设计（AGENTS.md §8）。
- **仓库其他 8 个文件改动非本任务引入**：`git status` 显示 `designer.test.tsx` / `parity-with-current.test.ts` / `plugins.test.ts` / `write-paths.test.ts` / `createTreeStore.ts` / `write-paths.ts` / `types.ts` / `plugins/types.ts` 均有未提交改动，应是先前 task 遗留。**本任务未触碰这些文件**，归档前已确认。
- **行为表行 4（byId 引用复用）增加 `—` 占位**：原计划表格 3 列（场景 / components 引用 / shallowEqual 结果 / 是否 re-render），新增第 4 列"原因"。第 4 行"其他节点 byId 引用复用"与"components 顶层数组"语义不同（前者是 byId 条目复用，后者是顶层数组引用），因此该行 shallowEqual / re-render 列填 `—`，仅作为概念补充说明，避免误导读者以为 byId 复用机制能改变 useTree 的 re-render 行为。

### 5.4 决策记录

- **未采用方案 A（改 `useTree` 默认用 `Object.is`）**：tango-cross-review §3.2 建议的方案 A 会让 `setPartialState({ extra })` 触发 `useTree` 重新 reconcile（byId 变化），与 §3.2 第 2 条契约（"防止 byId 变化触发整树 reconcile"）冲突。**方案 B（文档说明）保留下沉语义的同时不破坏现有契约**，且改动风险最低（纯文档）。
- **新增 §3.5 而非改写 §3.2**：原 §3.2 是 review 通过的契约条款（task-2026-07-30-001 / task-2026-07-31-001 已 review 通过），本次新增内容是对契约的**外部行为细化**（"消费者实际感受"），不属于契约变更。新增章节避免破坏历史 review 结论。
- **§3.5.1 第 4 行偏离主表语义**：刻意保留（见 5.3 第 3 条），作为"byId 引用复用与 components 浅拷贝是不同维度"的提示。

