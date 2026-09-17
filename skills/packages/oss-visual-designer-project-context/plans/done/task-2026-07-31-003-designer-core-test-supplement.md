# task-2026-07-31-003 — designer-core 测试补充

> 状态：`done`
> 类型：`test`
> 优先级：**中**
> 创建日期：2026-07-31
> 完成日期：2026-07-31
> 前置：task-2026-07-31-001（已完成）

---

## 1. 背景

task-2026-07-31-001 新增了性能基线测试（69 测试全绿），但 review 报告（r2/r4）指出读路径 hooks 和写路径边界场景的测试覆盖仍有缺口。本 task 专门补充测试，不改代码逻辑。

---

## 2. 需修复的问题

| # | 问题 | 来源 |
|---|---|---|
| T1 | 缺少 `useTree`/`useFlatTree` 独立 hook 单元测试（只在 designer.test.tsx 有集成测试） | r2 §5.2 |
| T2 | `setPartialState` 含 components 时不可变引用验证缺失 | r4 §4.3 缺失 3 |
| T3 | 缺少与当前项目的行为对齐集成测试（task-2026-07-30-001 §4.2 要求移植 8 个 reducer/纯函数测试） | r4 §4.3 缺失 2 |

---

## 3. 实施步骤

### 步骤 1：新增 useTree/useFlatTree 独立单元测试（T1）

**问题**：`useTree`/`useFlatTree` 只在 `designer.test.tsx` 集成测试中覆盖，无独立单元测试验证 re-render 粒度。

**修复**：新增 `src/__tests__/hooks.test.tsx`：
- `useTree`：修改节点 A 时，`useTree` 订阅者 re-render（components 引用变了）；shallowEqual 模式下未改树结构时不 re-render
- `useFlatTree`：flatten 函数稳定时，树未变不重算；树变时重算
- `useNode` 字段级订阅粒度：修改节点 A 时，节点 B 的 `useNode` 不 re-render（引用复用）

**验证**：新测试通过，现有 69 测试不回归。

### 步骤 2：补充 setPartialState 含 components 时的不可变引用验证（T2）

**问题**：当前测试只验证不含 components 时 byId/parentMap 保持原引用，未验证含 components 时树不可变更新行为。

**修复**：在 `write-paths.test.ts` 或新文件补充：
- `setPartialState({ components: newTree })` 后，未改节点的 byId 条目引用保持不变
- `setPartialState({ components: newTree })` 后，parentMap 正确重建

**验证**：新测试通过。

### 步骤 3：评估并移植当前项目 reducer/纯函数测试（T3）

**问题**：task-2026-07-30-001 §4.2 要求移植当前项目 8 个 reducer/纯函数测试作为契约对照，未实现。

**修复**：
1. 先评估当前项目 `src/__tests__/` 下的 reducer/纯函数测试（buildIndex / updateFieldConfig / setState 防护等）哪些适用于框架
2. 移植适用的测试，调整为框架 API（createTreeStore + setTree/updateNode/setPartialState）
3. 跳过不适用的（如 redux-persist / middleware 相关）

**验证**：移植测试通过，不回归。

---

## 4. 验证

- [x] `pnpm test`：82 测试全绿（69 原有 + 6 hooks + 2 setPartialState + 5 parity）
- [x] `pnpm typecheck`：0 错误

---

## 7. 实施记录

| 步骤 | 文件 | 新增测试数 | 覆盖内容 |
|---|---|---|---|
| T1 | `src/__tests__/hooks.test.tsx` | 6 | useNode 字段级订阅粒度（改 A 不影响 B）/ useTree re-render / useFlatTree flatten 引用稳定性 |
| T2 | `src/__tests__/write-paths.test.ts` | 2 | setPartialState 含 components 时未改节点 byId 引用复用 + parentMap 重建 |
| T3 | `src/__tests__/parity-with-current.test.ts` | 5 | 行为对齐：patch 顶层非 config 字段 / 嵌套对象浅合并 / 组内子节点 group byId 复用 / null patch no-op / setTree 直接赋值 |

### T3 移植决策

移植了当前项目 `designer-canvas-updateFieldConfig.spec.ts` 和 `designer-canvas-setComponents.spec.ts` 中框架测试未覆盖的边界场景：
- patch 顶层非 config 字段进 data（框架测试只测了 config 字段）
- patch.config 含嵌套对象的浅合并（框架测试只测了简单字段）
- 组内子节点更新时 group byId 引用复用（框架测试有嵌套树但没断言 group byId 复用）
- null/undefined patch no-op

**不移植的部分**：
- redux-persist / middleware 相关（框架是独立包）
- recalcGroupBounds（依赖业务函数 getGroupSizePosition/resetChildrenPosition 等，不适用框架）
- 当前项目测试中与框架测试重复的断言（setTree 直接赋值、updateNode 边界 no-op 等已有覆盖）

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| hook 单元测试的 re-render 粒度断言不稳定（vitest jsdom 环境） | 中 | 中 | 用 renderHook + act 验证，参考现有 designer.test.tsx 模式 |
| T3 移植测试与框架 API 不匹配 | 中 | 低 | 逐个评估，不适用的跳过 |

---

## 6. 不做的事

- 不改框架代码逻辑（只加测试）
- 不移植 redux-persist / middleware 相关测试（框架是独立包）
