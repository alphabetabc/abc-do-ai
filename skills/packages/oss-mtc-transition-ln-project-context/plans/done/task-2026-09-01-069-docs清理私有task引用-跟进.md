# Task · 2026-09-01-069-docs清理私有task引用-跟进

> 状态：⚪ 待启动
> 类型：仅 docs 维护
> 创建：2026-09-01
> 前置：AGENTS.md §8 新规则 `R-AGENTS-DOCS-NO-TASK-REF`（2026-09-01 task-068 触发）
> 关联依据：仓库根 `AGENTS.md` §8 L132；`.trae/rules/docs-no-private-refs.md`；`done/task-2026-08-17-047-docs清理私有task引用.md`（2026-08-17 系统性清理 16 文件 36 条 A 类违规，本 task 是 2026-08-27/28 新一轮落地的跟进版）；roadmap-2026-08-11-big-screen.md §4 L3 提案登记簿

---

## 0. 任务信息

| 项 | 值 |
| --- | --- |
| 编号-slug | 2026-09-01-069-docs清理私有task引用-跟进 |
| 任务类型 | 仅 docs 维护（不动 backend / frontend 代码） |
| 影响范围 | 详见 §1 全量盘点（10 文件 40+ 处引用清理） |
| 验收标准 | a) `Grep -E 'task-(0[0-9]{2}\|2026-0[0-9]-[0-9]{3})' docs/` 0 命中；<br>b) 04 大屏五件套（038/039/040/041）`docs/specs/NNN-*/{spec,plan,tasks,data-model-extensions,acceptance-tests}.md` 0 私有 task 引用；<br>c) `docs/design/api-contracts.md` / `docs/design/system-overview.md` / `docs/design/data-models.md` 0 私有 task 引用；<br>d) 替换策略=优先用对应 `R-XXX` L3 提案名（roadmap §4 登记的命名约定）回填，无 R-XXX 可对应时改用「§X.Y 修订」/「N 项用例 passed」等公开语义；<br>e) `roadmap-2026-08-11-big-screen.md` §4 追加本 task L3 提案 `R-DOCS-CLEAN-TASK-REFS-2` 登记并勾选 [x] |

---

## 1. 全量盘点（2026-09-01 Grep 结果）

> `Grep -E 'task-(0[0-9]{2}\|2026-0[0-9]-[0-9]{3})' docs/` 命中 10 文件 43 处（不含 task-069 自身 + task-047 已清理过的 16 文件 36 条）

### 1.1 `docs/design/api-contracts.md`（3 处）

| 行 | 现状（私有引用） | 建议替换 |
| --- | --- | --- |
| 1648 | `task-061 会签通过` | `R-DOCS-API-CONTRACTS-041-* 批量会签通过` |
| 1754 | `task-066 修订` | `R-DOCS-API-CONTRACTS-041-RANK-ORDER 修订（2026-08-28）` |
| 1755 | `task-066 修订` | 同上 |

### 1.2 `docs/specs/040-bigdata-beijing-petition-display/`（7 处）

| 文件 | 行 | 现状 | 建议替换 |
| --- | --- | --- | --- |
| tasks.md | 32 | `task-050 L3 提案` | `R-DOCS-040-SPEC L3 提案` |
| tasks.md | 33 | `task-050 L3 提案` | 同上 |
| tasks.md | 34 | `task-050 L3 提案` | 同上 |
| spec.md | 487 | `[Omitted long line]`（需 Read） | 待核 |
| spec.md | 592 | `[Omitted long line]`（需 Read） | 待核 |
| data-model-extensions.md | 272, 327, 329 | `task-051 L3 提案` | `R-DOCS-DATA-MODELS-S7-LAYOUT` 或类似 |
| data-model-extensions.md | 550 | `task-051 方向反转` | 同上 |
| plan.md | 37, 38, 39 | `task-050 L3 提案` | `R-DOCS-040-SPEC` |
| plan.md | 69 | `[Omitted long line]`（需 Read） | 待核 |
| plan.md | 106 | `task-050 落行` | `R-DOCS-040-SPEC` |

### 1.3 `docs/specs/039-bigdata-petition-display/`（4 处）

| 文件 | 行 | 现状 | 建议替换 |
| --- | --- | --- | --- |
| tasks.md | 143 | `task-051 L3 落地` | `R-DOCS-DATA-MODELS-S7-LAYOUT` |
| spec.md | 653, 776 | `[Omitted long line]`（需 Read） | 待核 |
| data-model-extensions.md | 343, 352 | `task-051 方向反转` / `task-051 步骤 6` | 同上 |

### 1.4 `docs/specs/041-bigdata-petition-comparison-display/`（30 处，最大头）

| 文件 | 行 | 涉及 task | 建议替换提案 |
| --- | --- | --- | --- |
| acceptance-tests.md | 108, 109, 229, 230 | task-056 / task-059 | `R-DOCS-API-CONTRACTS-041-RANK` / `R-DOCS-API-CONTRACTS-041-IDENTITY` |
| data-model-extensions.md | 280, 304 | task-058 / task-066 | `R-DOCS-API-CONTRACTS-041-LB-EXT` / `R-DOCS-API-CONTRACTS-041-RANK-ORDER` |
| tasks.md | 67-115 | task-055/056/057/058/059/060 多次 | 多提案 |
| spec.md | 106, 342, 356, 357, 378, 391, 560, 567, 569, 583, 593, 596, 702, 705, 730, 757, 768 | task-053/054/057/058/061/066 多次 | 多提案 |

> 具体行内容在执行步骤 1 时 `Read` 复核 + `SearchReplace` 替换；本节仅提供盘点索引。

### 1.5 替换策略对照表（roadmap §4 L3 提案登记簿）

| 私有 task | 对应 R-XXX 提案（roadmap §4） | 用于回填哪些 docs/ 引用 |
| --- | --- | --- |
| task-050 | `R-DOCS-040-SPEC` / `R-DOCS-040-IMPL` | 040 tasks.md / plan.md |
| task-051 | `R-DOCS-DATA-MODELS-S7-LAYOUT`（task-051 提案登记名，需核实 roadmap 是否使用同名） | 039 / 040 data-model-extensions.md + spec.md |
| task-053 | `R-DOCS-042-012-RADAR-CHART` | 041 spec.md（`RadarChart` 落地引用） |
| task-054 | `R-DOCS-API-CONTRACTS-041-APPEAL` | 041 spec.md（SERIES_META 沿用 task-054 落定值） |
| task-055 | `R-DOCS-API-CONTRACTS-041-TREND` | 041 tasks.md（` Trend ✅ task-055 `） |
| task-056 | `R-DOCS-API-CONTRACTS-041-RANK` | 041 tasks.md / acceptance-tests.md |
| task-057 | `R-DOCS-API-CONTRACTS-041-MAP` / `R-DOCS-API-CONTRACTS-041-SUMMARY` / `R-DOCS-API-CONTRACTS-041-CHANNELS` | 041 tasks.md / spec.md |
| task-058 | `R-DOCS-API-CONTRACTS-041-LB-EXT`（同步 SummaryCards + ChannelCards 子任务落地） | 041 spec.md / data-model-extensions.md |
| task-059 | `R-DOCS-API-CONTRACTS-041-IDENTITY` + `R-DOCS-API-CONTRACTS-041-IDENTITY-SIMPLIFY` | 041 tasks.md / acceptance-tests.md |
| task-060 | （无独立 L3 提案；041 InteractionStore 联动 task；建议改 `§4.5.x 模块联动` 或 `interaction-store` 组件说明） | 041 tasks.md（organId 联动、返回按钮、loading 编排等描述） |
| task-061 | `R-DOCS-API-CONTRACTS-041-*` 批量会签（tren/rank/map/summary/channels/identity 共 6 提案合集） | 041 spec.md §10 / api-contracts §7.44 |
| task-066 | `R-DOCS-API-CONTRACTS-041-RANK-ORDER` | 041 spec.md / data-model-extensions.md / api-contracts.md |

> **执行步骤 1 时必须 `Read` roadmap §4 实际行，逐条核对上表，确保替换名 100% 对得上已登记的 `R-XXX`**。

---

## 2. 步骤（用户 review 后 AI 执行）

### 步骤 1：L3 提案登记 + 替换名核对

- **动作**：
    - `roadmap-2026-08-11-big-screen.md` §4 新增 1 行 L3 提案 `R-DOCS-CLEAN-TASK-REFS-2`（state `[ ]`），目标文件覆盖 §1 全部 10 文件
    - 同步在 §3 任务索引追加本 task 行（状态 ⚪）
    - 用 `Read` 工具逐个核对 §1.5 替换名表，确保每个 `R-XXX` 在 roadmap §4 实际存在；不存在的命名替换为「§X.Y 修订」/「N 项用例 passed」等公开语义
- **输出**：roadmap §4 + §3 索引 + §1.5 替换名表定稿
- **🛑 等待用户**：是（用户 review 替换名表 + L3 提案命名）

### 步骤 2：api-contracts.md 清理（3 处）

- **动作**：按 §1.1 表逐行 `SearchReplace` 替换
- **输出**：`docs/design/api-contracts.md` 0 私有 task 引用
- **🛑 等待用户**：否（用户已 review §1.5 替换名，本步骤机械执行；如有反例再问）

### 步骤 3：040 五件套清理（7 处）

- **动作**：按 §1.2 表逐行 `SearchReplace` 替换
- **输出**：`docs/specs/040-bigdata-beijing-petition-display/{spec,tasks,data-model-extensions,plan}.md` 0 私有 task 引用
- **🛑 等待用户**：否

### 步骤 4：039 五件套清理（4 处）

- **动作**：按 §1.3 表逐行 `SearchReplace` 替换
- **输出**：`docs/specs/039-bigdata-petition-display/{spec,tasks,data-model-extensions}.md` 0 私有 task 引用
- **🛑 等待用户**：否

### 步骤 5：041 五件套清理（30 处，最大工作量）

- **动作**：按 §1.4 表 + Read 复核 long-line 内容，逐行 `SearchReplace` 替换
- **输出**：`docs/specs/041-bigdata-petition-comparison-display/{spec,tasks,data-model-extensions,acceptance-tests}.md` 0 私有 task 引用
- **🛑 等待用户**：是（30 处全量改完后做一次总 review 给你拍板）

### 步骤 6：自检 + 提案勾选 + task 归档

- **动作**：
    - 全量 `Grep -E 'task-(0[0-9]{2}\|2026-0[0-9]-[0-9]{3})' docs/` 验证 0 命中
    - `roadmap §4 R-DOCS-CLEAN-TASK-REFS-2` 提案勾选 [x]
    - `roadmap §3` 任务索引本 task 行状态更新 ✅ 完成 → `done/`
    - 本 task 文件**移动**到 `done/`（AGENTS.md §10.1 生命周期）；roadmap §3 索引同步
- **输出**：roadmap 索引 + task 移至 `done/`
- **🛑 等待用户**：是（自检通过后给最终汇报 + 决定归档时机）

---

## 3. 依据（任务来源）

| 来源类型 | 路径 | 引用章节 |
| --- | --- | --- |
| 新规则 | 仓库根 `AGENTS.md` | §8 L132（2026-09-01 新增 R-AGENTS-DOCS-NO-TASK-REF） |
| 既有规则 | `.trae/rules/docs-no-private-refs.md` | 全文（docs/ 禁止引用 `.trae/` / `agents.md` / `.local-*`） |
| 同类先例 | `done/task-2026-08-17-047-docs清理私有task引用.md` | 全部（task-047 2026-08-17 系统性清理 16 文件 36 条，本 task 是 2026-08-27/28 新一轮落地跟进版） |
| L3 提案登记簿 | `roadmap-2026-08-11-big-screen.md` | §4 L3 提案列表（用于替换名 R-XXX 核对） |
| 文档修改门禁 | 仓库根 `AGENTS.md` | §10 L1/L2/L3 + §10.1 task 生命周期 |
| 用户拍板 | 2026-09-01 会话 | "创建 task 069"（指 task-069，清理 docs/ 历史私有 task 引用） |

---

## 4. 状态记录

| 日期 | 变更 |
| --- | --- |
| 2026-09-01 | task 创建（用户 2026-09-01 会话授权："创建 task 069"；范围=docs/ 下 10 文件 43 处历史私有 task 引用清理；本 task 是 task-047 2026-08-17 系统清理之后的 2026-08-27/28 新一轮落地跟进版） |