# Task · 2026-11-20-004-fujian-baseline-recheck

## 任务元信息

| 项 | 值 |
|---|---|
| 编号 | `task-2026-11-20-004-fujian-baseline-recheck` |
| Status | 已完成 |
| 类型 | docs |
| 目标分支 | develop-fujian |
| 影响范围 | `pm/001-2026-03-27-network-appointment-optimization/technical-analysis.md`（修订）、`pm/001.../work/*.md`（按需修订）、`branches/fujian/`（新增差异文档） |
| Roadmap | R2（已完成项的 fujian 复核）、R3 前置 |
| 验收标准 | pm/001 技术分析的全部读码结论在 fujian 分支上重新验证并修订，fujian 差异认知落入 `branches/fujian/` |
| 前置依赖 | 用户切到 develop-fujian 分支（本地工作区就绪） |

---

## 目标（Goal）

pm/001《网络操作预约模块优化需求 V4.1 前端技术分析》及其子任务产物（002-01~002-04）均以 **develop** 代码为基线完成，而该需求实际服务于 **develop-fujian** 分支（相对主干独立进化约 126 提交，网络预约相关模块已被改版）。本任务在 fujian 分支代码上**复核并修订**技术分析结论，确保后续编码实施（建议的新模块 cutover-order、复用点、路由落点、App.js 增强点）在正确分支上成立。

---

## 背景与动机

- 2026-11-19 完成的 task-001（真源沉淀）与 task-002（技术分析）均在 develop 分支工作区进行。
- 2026-11-20 用户确认：pm/001 需求目标分支为 develop-fujian，已在 technical-analysis.md 顶部加警示块。
- fujian 已知改版涉及：通用预约周期预约调整、工程预约日志调整（feature-228888）等，具体影响面未盘点。
- 若直接按 develop 结论在 fujian 上实施，路由清单、可复用能力、割接领域代码是否已存在等判定可能失真。

---

## 功能列表

- F1：**差异盘点** —— 生成 fujian 相对 develop 的变更文件清单（`git diff --stat develop...origin/develop-fujian` 或本地分支），按模块归类，判断影响的技术分析章节。
- F2：**路由真源复核** —— 在 fujian 分支上重新核对 `src/routes/index.js` 路由清单（原结论：15 条无割接路由），确认割接域是否仍不存在。
- F3：**复用能力复核** —— 核对 technical-analysis §4.2 复用点表格中每个文件（search-gcss / search-fgss / upload 流程 / 审批交互 / VirtualTable / 区域级联）在 fujian 分支上是否仍存在且形态一致。
- F4：**增强点复核** —— 核对 `src/App.js` 免密跳转通道（L40~L145）在 fujian 分支的实际行号与逻辑是否漂移。
- F5：**建项页现状复核** —— new-project/quick-project 在 fujian 上的分化程度（原文档基于 develop 的「复制分叉、1200+ 行巨型组件」结论是否仍适用）。
- F6：**结论修订** —— 按复核结果修订 technical-analysis.md 及 work/ 中间产物（仅改读码依赖的结论；条目拆解 002-01、归属分类规则不依赖分支，预计不动）。
- F7：**差异沉淀** —— fujian 分支的结构性差异写入 `branches/fujian/`（升级 README 或建差异文档），供后续任务直接消费。

---

## 不做清单

- 不重做 002-01 需求条目拆解（需求文本与分支无关）。
- 不重做归属分类规则本身（scope-classification-rules.md 是方法论）。
- 不在本任务中编写任何业务代码（cutover-order 实施是后续任务）。
- 不盘点 cdtl / unicom 分支差异（未涉及）。
- 不做 Pixso 原型提取（那是 task-003，且是否继续待定——见开放问题 2）。

---

## 步骤（执行计划）

### 步骤 1：差异盘点（F1）

- **动作**：用户确认本地已切换到 develop-fujian 后，生成相对 develop 的变更文件清单，按模块归类并标注与 pm/001 结论的关联章节
- **输出**：`pm/001.../work/fujian-diff-inventory.md`（或并入 branches/fujian/，审批时定）
- **等待用户**：是（硬门槛①在本任务卡审批时已含，此步仅确认分支就绪）

### 步骤 2：逐项复核（F2~F5）

- **动作**：按 F2~F5 清单逐条在 fujian 代码上 Read 验证，每条记录「成立 / 漂移 / 失效」及证据（文件+行号）
- **输出**：复核记录（并入步骤 1 的产物文档）
- **等待用户**：否

### 步骤 3：结论修订（F6）

- **动作**：将「漂移 / 失效」项回写 technical-analysis.md 与 work/ 产物，移除顶部警示块中「须重做」的待办状态
- **输出**：修订后的 technical-analysis.md
- **等待用户**：是（硬门槛②：修订结论需用户评审）

### 步骤 4：差异沉淀与归档（F7）

- **动作**：fujian 结构性差异落入 `branches/fujian/`；更新 current-sprint / roadmap；归档本任务卡
- **输出**：branches/fujian/ 差异文档
- **等待用户**：否

---

## 前置 / 必读

- [ ] 用户已确认本地工作区切换到 develop-fujian
- [ ] 已读：`pm/001.../technical-analysis.md`（全文）
- [ ] 已读：`branches/develop/design/modules/001~008/overview.md`（对照基线）
- [ ] 已读：`branches/fujian/README.md`

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | fujian 分支的「最新」以 origin/develop-fujian 为准还是本地可能有未推送提交？ | 用户 | 开放 |  |
| 2 | task-003（Pixso 原型提取）是否也需要标注/等待 fujian 基线复核后再执行？ | 用户 | 开放 |  |
| 3 | fujian 是否存在主干没有的独立模块（新页面族），需要为其建 `branches/fujian/design/modules/` 差异调研？ | 待盘点 | 开放 |  |

---

## 验收 checklist

- [x] A1：technical-analysis.md 中所有引用 develop 代码的结论（路由数、复用文件、行号、模块现状）均在 fujian 上重新验证，失效项已修订
- [x] A2：`branches/fujian/` 含成体系的差异记录（原 diff-vs-develop.md，后经 task-005 升级为自包含 design/ + references/ 域，diff 文件已按用户指示移除）
- [x] A3：修订后的技术分析顶部警示块更新为「已按 fujian 复核」
- [x] A4：roadmap R2 条目更新复核状态（2026-11-20 已更新）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-20 | 用户（「我现在已经切换到福建分支，你来进行task004」） |
| ② 实现验收 | 已验收 | 2026-11-20 | 用户（「task 004 005 是不是可以归档了」） |

---

## 进度日志

### 2026-11-20 10:20

> - 立项：基于 2026-11-20 分支管理重组（文档按分支分域）与用户确认 pm/001 目标分支为 develop-fujian

### 2026-11-20（执行）

> - 步骤 1~3 完成：差异盘点（35 文件，本地 develop-fujian 与 origin 同步，开放问题 1 自答关闭）→ F2~F5 逐项复核 → technical-analysis.md 修订（警示块改为已复核、路由 15→18、column.js L130、复用表加 fujian 复核列、巨型组件行数更新）
> - 产物：`branches/fujian/` 差异记录（task-005 重建为自包含域后，diff-vs-develop.md 已按用户指示移除，差异信息并入 README 与各真源文档）、`branches/fujian/README.md`（升级）
> - 复核结论：核心判定（新建 cutover-order + 复用 + App.js 增强）在 fujian 上成立；extractFun.js 与 new-project/index.jsx 形态漂移，复用时须重读
> - 开放问题 2/3 已有答案：3 = 是（wireless-person-manager、professional-home-page 两个独立新模块族，已记入差异文档）；2 待用户决定

---

## 关联

> - 相关 task：task-2026-11-19-002-*（本任务复核其产出）、task-2026-11-19-003（Pixso 提取，受开放问题 2 影响）
> - 相关文档：`pm/001-2026-03-27-network-appointment-optimization/technical-analysis.md`、`branches/fujian/README.md`
