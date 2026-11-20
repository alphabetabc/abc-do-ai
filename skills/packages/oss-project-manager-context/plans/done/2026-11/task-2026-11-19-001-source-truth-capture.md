# Task · 2026-11-19-001-source-truth-capture

> **使用方式**：复制本文件为 `task-YYYY-MM-DD-NNN-<slug>.md`，填入实际内容，同时在 `current-sprint.md` 追加索引。
>
> **繁简**：默认只填「元信息 + 目标 + 步骤 + 归档清单」。复杂任务再展开下方「可选强化」块；用不上就整段删掉。
>
> **工作流**：两阶段硬门槛见 `env/rules/03-task-workflow.md`。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-19-001-source-truth-capture` |
| Status | 已完成（待硬门槛②验收） |
| 类型 | docs（真源沉淀） |
| 影响范围 | `design/architecture.md`、`design/modules/001~008/overview.md`、`references/source-truth-map.md`、`references/api-catalog.md`、`references/enum-and-dictionary.md`、`references/reusable-capabilities.md`、`references/scope-classification-rules.md`、`SKILL.md`（Pointer Map 更新） |
| Roadmap | `plans/roadmap.md` — R1「真源沉淀」 |
| 验收标准 | 一套真源文档落地：AI 仅读 skill 即可回答「本仓有什么 / 怎么扩展 / 边界在哪」，无需自行翻代码 |
| 前置依赖 | 无 |

---

## 目标（Goal）

把本仓 `e:\oss-fe-git\phoenix\oss-project-manager` 的**真实结构、接口面、枚举面、可复用能力**沉淀为治理 skill 的权威文档（真源），消除「design 文档不足以支撑决策、必须反复翻代码」的问题，为后续需求评估提供可靠基线。

---

## 步骤（执行计划）

### 步骤 1：定义真源文档集与落位

- **动作**：确定要沉淀哪些真源主题、每条落在 design（结构/决策）还是 references（低频清单），确定统一文档模板与真源标记规范
- **输出**：本任务卡「功能列表」+ 待产出文件清单
- **等待用户**：否

### 步骤 2：仓库结构真源（architecture.md）

- **动作**：按 `design/README.md` 约束（结构写在 architecture.md，不另建 codebase-map.md），补全 `design/architecture.md`：完整目录树与文件分布、路由真源、构建链真源、依赖版本真源、状态管理分布真源
- **输出**：`design/architecture.md`
- **等待用户**：否

### 步骤 3：模块真源补齐（design/modules/001~008）

- **动作**：按统一「真源模板」复核并补齐 8 份模块文档，每份必须含：路由与入口、组件树、状态管理方案、接口清单、可复用点、已知坑、与其他模块的耦合
- **输出**：`design/modules/00N-*/overview.md`
- **等待用户**：否

### 步骤 4：横切真源（references/）

- **动作**：新增 5 份 references 真源文档，每条结论必须可回溯到真实文件路径
  - `references/source-truth-map.md`：真源索引 + 主题→权威文件映射 + 核查用 grep 关键词表
  - `references/api-catalog.md`：后端接口端点全量清单（按模块分组、含 base URL 策略）
  - `references/enum-and-dictionary.md`：枚举/字典/常量真实取值清单
  - `references/reusable-capabilities.md`：可复用能力清单（表格/搜索/上传/审批/网元选择/区域级联/导出/权限）+ 使用方式
  - `references/scope-classification-rules.md`：需求条目归属判定规则（前端做 / 后端做 / 跨系统联调）
- **输出**：5 份 references 文件
- **等待用户**：否

### 步骤 5：Pointer Map 与索引回写

- **动作**：更新 `SKILL.md` Pointer Map 指向新增真源；更新 `references/README.md`；更新 `design/README.md` 模块清单
- **输出**：SKILL.md / references/README.md / design/README.md
- **等待用户**：否

### 步骤 6：自检与交付

- **动作**：核对每份真源文档中引用的文件路径真实存在（逐条 Read 或 Glob 验证）；确认无编造 API / 路径 / 行号
- **输出**：任务卡「验收 checklist」勾选 + 进度日志
- **等待用户**：否（交付后等硬门槛②）

---

## 背景与动机

`design/` 层目前只有 8 份模块概览 + 意图层，粒度停在「这个页面大概干什么」。实际接手需求评估时，以下问题**必须翻代码才能答**：

- 某个能力在本仓到底有没有？叫什么名字、在哪个文件？
- 已有 API 的端点是什么？新需求该加在哪个 service？
- 某个枚举/字典的真实取值有哪些？
- 有没有可复用的表格 / 上传 / 审批 / 网元选择 / 导出组件？
- 某个需求条目该前端做、后端做，还是跨系统联调？

这直接导致：评估一个需求时反复读同一批代码、结论还可能不准确。本任务把「反复翻代码」换成「读一次真源」。

---

## 用户故事

- As a 接手该需求的 AI / 前端维护者，I want 一套覆盖结构、接口、枚举、可复用能力、边界规则的真源文档，so that 我能仅凭 skill 上下文完成需求评估与技术方案设计，不必重复逆向代码。
- As a 需求评估者，I want 每条真源结论都能回溯到真实文件路径，so that 结论可被评审、可被后续会话复用，且不会因记忆偏差失真。

---

## 功能列表

- F1：真源主题清单与落位规则（design 承载结构与决策，references 承载低频清单与规则）
- F2：`design/architecture.md` 补全为仓库结构真源（目录树 / 路由 / 构建链 / 依赖 / 状态管理分布）
- F3：`design/modules/001~008` 按统一模板补齐为模块真源
- F4：`references/source-truth-map.md` 真源索引 + 核查关键词表
- F5：`references/api-catalog.md` 接口端点全量清单
- F6：`references/enum-and-dictionary.md` 枚举 / 字典 / 常量清单
- F7：`references/reusable-capabilities.md` 可复用能力清单
- F8：`references/scope-classification-rules.md` 需求条目归属判定规则
- F9：`SKILL.md` Pointer Map 与各级 README 索引回写

---

## 不做清单

- 不修改 `src/`、`config/`、`scripts/` 下任何代码文件（本任务纯文档）
- 不修改 `sql/` 下 XML
- 不做 PRD、不做原型、不做后端表设计
- 不做接口实现、不做联调、不做单元测试
- 不重构现有模块文档的既有结论（仅补充缺失真源与纠错）

---

## 非功能需求

- **可回溯**：每条真源结论附真实文件路径；关键项附行号区间
- **不编造**：未验证的路径 / API / 签名一律不写；确实读不到时明写「未验证」
- **可消费**：文档写成「结论先行 + 表格/清单」形态，AI 单次读取即可用，不需二次检索
- **低重叠**：`architecture.md` 只放结构与决策；`modules/*` 只放单模块；`references/*` 只放横切清单与规则，不三处重复同一事实
- **链接规范**：遵循 `env/rules/01-link-format.md`（skill 内同域用相对路径）

---

## 前置 / 必读

- [x] 已读：`design/README.md`、`design/architecture.md`、`design/vision.md`、`design/user-story-map.md`
- [x] 已读：`design/modules/001~008/overview.md`
- [x] 已读：`plans/templates/task-template.md`、`plans/current-sprint.md`、`plans/backlog.md`、`plans/roadmap.md`
- [x] 已读：`references/README.md`、`env/AGENTS.md`、`env/rules/01~03`
- [x] 已读：`pm/001-2026-03-27-network-appointment-optimization/inputs/overview.md`
- [ ] 依赖已就绪：无

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | `sql/` 下的后端表结构是否纳入真源（作为接口契约佐证） | 前端 | 开放 | 建议只做表名级索引，不逐字段展开，避免与后端产生双份维护 |
| 2 | 真源文档的更新触发方式：随任务驱动手动更新，还是加脚本校验路径有效性 | 前端 | 开放 | 倾向手动更新 + 任务卡归档时校验 |
| 3 | 环境配置（environment 开关）清单是否单列一份真源 | 前端 | 开放 | 倾向并入 `references/reusable-capabilities.md` 的「配置开关」节 |

---

## 验收 checklist

- [x] A1：`design/architecture.md` 含完整目录树与文件分布，且不含与 `modules/*` 重复的页面细节
- [x] A2：`design/modules/001~008` 每份均含「路由与入口 / 组件树 / 状态管理 / 接口清单 / 可复用点 / 已知坑」六要素
- [x] A3：`references/api-catalog.md` 覆盖本仓全部对外调用端点，且每个端点标注所属模块与 service 文件
- [x] A4：`references/enum-and-dictionary.md` 枚举取值与源码一致（逐条核对）
- [x] A5：`references/reusable-capabilities.md` 每条能力标注真实文件路径与使用方式
- [x] A6：`references/scope-classification-rules.md` 给出可判定的三分类规则（含判定依据与例外）
- [x] A7：`SKILL.md` Pointer Map 已指向全部新增真源文件；`references/README.md`、`design/README.md` 索引已同步
- [x] A8：全部文件路径引用真实存在（逐条验证），无编造 API / 行号
- [x] A9：影响架构的决策已回写 `design/`（本任务即为此）
- [x] A10：`env/AGENTS.md` 声明的质量门槛命令已通过（本任务纯文档 → N/A）

---

## 技术设计（可选 · 阶段二回填）

### 产出文件清单

| 路径 | 类型 | 承载 |
| --- | --- | --- |
| `design/architecture.md` | 改写 | 仓库结构真源 / 技术栈真源 / 构建链 / 关键决策 |
| `design/modules/001-home-page/overview.md` | 补齐 | 首页总览真源 |
| `design/modules/002-home-executing/overview.md` | 补齐 | 正在执行列表真源 |
| `design/modules/003-new-project/overview.md` | 补齐 | 建项页真源 |
| `design/modules/004-quick-project/overview.md` | 补齐 | 快速预约真源 |
| `design/modules/005-resource-search/overview.md` | 补齐 | 资源检索真源 |
| `design/modules/006-system-options/overview.md` | 补齐 | 系统配置真源 |
| `design/modules/007-demo-debug-pages/overview.md` | 补齐 | 调试页真源 |
| `design/modules/008-common-export/overview.md` | 补齐 | 导出工具真源 |
| `references/source-truth-map.md` | 新增 | 真源索引 + 核查关键词表 |
| `references/api-catalog.md` | 新增 | 接口端点清单 |
| `references/enum-and-dictionary.md` | 新增 | 枚举 / 字典清单 |
| `references/reusable-capabilities.md` | 新增 | 可复用能力清单 |
| `references/scope-classification-rules.md` | 新增 | 需求归属判定规则 |
| `SKILL.md` | 改写 | Pointer Map |
| `references/README.md`、`design/README.md` | 改写 | 索引 |

### 模块真源模板（六要素）

1. 路由与入口（path、菜单归属、默认跳转）
2. 组件树（目录 → 组件 → 职责）
3. 状态管理（redux/saga / hox / unstated-next / 组件内 state，注明文件位置）
4. 接口清单（端点 + 所属 service 文件 + 触发时机）
5. 可复用点（可被新模块直接借用的组件 / 方法 / 配置开关）
6. 已知坑（重复定义、复制分叉、模块级变量副作用等）

### 依赖顺序

步骤 1 → 2 → 3 → 4 → 5 → 6（结构先行，模块次之，横切清单依赖两者结论）

### 风险标注

- `design/architecture.md` 改写风险：原文件含「关键决策」等意图层内容，改写时**保留不删**，只做补全
- `modules/*` 补齐风险：既有文档中可能存在与代码不符的历史结论；发现不符应**纠正并标注**，不得保留错误信息
- 重复定义风险：`new-project/service/api.js` 与 `home-page/service/api.js` 存在 `deleteTmpArProStatusImp` 重复定义（见 modules/001、003 文档），真源中需明确标注

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-19 | 立项为「真源沉淀」任务 | 用户明确：本仓 design 真源不足，需先做真源沉淀，再做需求技术分析 | 是（用户已明示直接执行） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-19 | 用户（指令：task001 就是完成真源沉淀） |
| ② 实现验收 | 待验收 |  |  |

---

## 进度日志（按需追加）

### 2026-11-19

> - 读完 design 意图层、modules 8 份、plans 层、references README、env/AGENTS 与三条规则
> - 结论：现有 design 层是「意图 + 粗粒度概览」，缺结构真源、接口真源、枚举真源、可复用能力真源、边界规则
> - 立项本任务（真源沉淀），产出物落 design/architecture.md + design/modules/* + references/5 份

---

## 决策记录（按需追加）

### 2026-11-19

> - **决策**：真源分两层落位——结构/决策进 `design/architecture.md`（遵守 design/README.md「结构写在 architecture.md、禁止另建 codebase-map.md」），横切清单与规则进 `references/`
> - **理由**：design 定位意图层但明确承载仓库结构；references 定位低频稳定资料，正是接口/枚举/规则清单的归宿
> - **影响**：不新增 `design/codebase-map.md`；references/ 从「空目录」变为有实质内容的真源区
> - **已回写**：否（随本任务执行回写）

### 2026-11-19

> - **决策**：模块文档统一到「六要素」模板
> - **理由**：现有 8 份文档体例不一（有接口域、有结构、无状态管理），不利于 AI 稳定消费
> - **影响**：8 份文档需补齐而非新建
> - **已回写**：否

---

## 引用一致性（归档前必走）

完成时**先**同步更新所有引用，**再**移动文件到 `done/<YYYY-MM>/`：

- [ ] `current-sprint.md` —— 移除该任务索引行
- [ ] `backlog.md` —— 若曾登记，迁移到 `[REJECTED]` 或相应位置
- [ ] `roadmap.md` —— 按需更新进度

> 禁止：未完成引用更新前移动文件。

---

## 关联

> - 相关 task：`task-2026-11-19-002-network-appointment-optimization-tech-analysis`（下游，依赖本任务产出）
> - 相关 backlog 项：无
> - 相关 pm 输入：`.trae/skills/oss-project-manager-context/pm/001-2026-03-27-network-appointment-optimization/inputs/`

---

## 执行记录（2026-11-19 · 阶段二）

产出：
- design/architecture.md：补全路由真源（15 条，以 src/routes/index.js 为准）、构建链别名与环境注入、状态管理实际使用情况（仅 hox 实际使用）
- design/modules/001~008/overview.md：各追加「六要素补齐」节（路由与入口/组件树/状态管理/接口清单/可复用点/已知坑）
- eferences/：新增 source-truth-map.md、api-catalog.md、enum-and-dictionary.md、reusable-capabilities.md、scope-classification-rules.md；重写 README.md
- SKILL.md：Pointer Map 增加五个 references 真源入口
- design/README.md：architecture.md 承载范围与六要素模板说明同步

自检（A8）：全部文档引用路径经 Test-Path 批量验证（68 项，含模块目录）；发现并纠正一处草稿期错误路由表（初稿误写 /queryProject 系列路由，已按 src/routes/index.js 实际 15 条路由重写，并同步修正 001/002/003/004/007 模块文档与 005 组件树描述）。

待验收：硬门槛②（用户确认 A1~A10 后归档至 done/2026-11/）。

### 2026-11-19 · 追加（用户复核）

- modules/001/003/004 组件树从一行概括细化为「目录 → 组件 → 职责」粒度（001 补 8 个子组件并纠正「无 control/ 目录」误述；003 展开 13 专题 + control 12 弹窗 + upload/model/service；004 明确裁剪范围）。002/005/006/007/008 粒度已足够（模块本身只有 1~3 个文件）。
