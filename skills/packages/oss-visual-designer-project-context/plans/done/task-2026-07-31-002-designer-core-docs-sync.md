# task-2026-07-31-002 — designer-core 设计文档与代码注释同步

> 状态：`done`
> 类型：`docs`
> 优先级：**中**
> 创建日期：2026-07-31
> 完成日期：2026-07-31
> 前置：task-2026-07-31-001（已完成）

---

## 1. 背景

task-2026-07-31-001 修复了 B1-B8 代码问题并做了 field→node 命名同步，但 review 报告（r1/r2/r4）指出的若干**文档与代码不一致**项未覆盖。本 task 专门处理文档同步，不涉及代码逻辑改动。

---

## 2. 需修复的问题

| # | 问题 | 位置 | 来源 |
|---|---|---|---|
| D1 | `Plugin`/`PluginContext` 接口文档缺 `TExtra` 泛型 | `04-plugin-system.md §2.1` L52/L68 | r1 §2.5 |
| D2 | `PluginContext.subscribe` 文档是单参数，代码是双参数 `(state, prevState)` | `04-plugin-system.md §2.1` L72 | r1 §2.6 |
| D3 | `getInitialState` 文档零覆盖 | `00-overview.md` / `02-write-path.md` | r1 §3.4 |
| D4 | `index.ts` L10 注释仍写 `setState`，应为 `setPartialState` | `packages-next/designer-core/src/index.ts` L10 | task-001 遗漏 |
| D5 | `useFlatTree` 的 `flatten` 引用稳定性未在文档/注释说明 | `hooks.ts` L87-93 + `03-read-path.md` | r4 §3.2 建议 5 |
| D6 | README 缺少泛型简化用法示例 | `packages-next/designer-core/README.md` | r4 §5.3 |

---

## 3. 实施步骤

### 步骤 1：修复 04-plugin-system.md 的 Plugin/PluginContext 接口（D1 + D2）

**问题**：文档 L52 `Plugin<TNode, TFlat>` 缺 TExtra；L68 `PluginContext<TNode, TFlat>` 缺 TExtra；L72 `subscribe` 单参数。

**修复**：对齐代码 `packages-next/designer-core/src/plugins/types.ts` L26-67：
- `Plugin<TNode, TFlat, TExtra>` 加 TExtra 泛型（含默认值）
- `PluginContext<TNode, TFlat, TExtra>` 加 TExtra 泛型
- `subscribe` 改为双参数 `(state, prevState) => void`

### 步骤 2：补充 getInitialState 文档（D3）

**问题**：`TreeStoreApi` 含 `getInitialState`（zustand v4.5+ ReadonlyStoreApi 要求），文档未描述。

**修复**：在 `00-overview.md §5` API 契约章节补充 `getInitialState` 说明（位置在 `getState` 之后），说明用途（zustand v4.5+ 要求，主要供测试/调试）。

### 步骤 3：修复 index.ts 注释（D4）

**问题**：`index.ts` L10 注释 `setTree / setState / getNodeById` 仍写 setState。

**修复**：改为 `setTree / setPartialState / getNodeById`。

### 步骤 4：补充 useFlatTree flatten 引用稳定性说明（D5）

**问题**：`flatten` 引用变化会导致 `useMemo` 重算，业务需 `useCallback` 包裹，但未说明。

**修复**：
- `hooks.ts` L87-93 `useFlatTree` 注释补充"flatten 需用 useCallback 包裹以保持引用稳定"
- `03-read-path.md` 对应章节补充同样说明

### 步骤 5：README 补充泛型简化用法示例（D6）

**问题**：4 个泛型参数对业务复杂，缺少极简示例。

**修复**：在 README 补充 1-2 个泛型的极简用法示例（如只指定 TData，其余靠默认推断）。

---

## 4. 验证

- [x] 文档与代码一致（04-plugin-system 的 Plugin/PluginContext 签名与 types.ts 一致：TExtra 泛型 + subscribe 双参数）
- [x] `index.ts` 注释正确（setState → setPartialState）
- [x] `pnpm typecheck`：0 错误

---

## 7. 实施记录

| 步骤 | 文件 | 改动 |
|---|---|---|
| D1+D2 | `04-plugin-system.md §2.1` | `Plugin`/`PluginContext` 加 `TExtra` 泛型（含默认值）；`subscribe` 改双参数 `(state, prevState)`；`getState`/`setPartialState` 的 `any` 改 `TExtra` |
| D3 | `00-overview.md §5.1` | 补充 `TreeStoreApi` 基础方法说明（subscribe 双参数 / getState / getInitialState） |
| D4 | `index.ts` L10 | 注释 `setState` → `setPartialState` |
| D5 | `hooks.ts` L85-86 + `03-read-path.md §3.4` | useFlatTree 的 flatten 参数补充 `useCallback` 引用稳定性说明 |
| D6 | `README.md` | 新增"泛型"章节：极简用法（只指定 TData）+ 完整用法 + 泛型参数表 |

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 文档改动遗漏某些位置 | 低 | 低 | Grep 验证 |
| README 示例代码有误 | 低 | 低 | 示例需通过 typecheck |

---

## 6. 不做的事

- 不改代码逻辑（除 D4 注释外）
- 不改 04-plugin-system §2.1 之外的其他章节（已在 task-001 同步过 setState→setPartialState）
