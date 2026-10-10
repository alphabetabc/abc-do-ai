# Task · 2026-10-09-002-shenzhen-communication-guarantee-docs

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-09-002-shenzhen-communication-guarantee-docs` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/specs/shenzhen-communication-guarantee/`（五件套 + pm-inputs + as-is-architecture） |
| Roadmap | N/A |
| 验收标准 | 基于 PM 素材完成模块文档，不夹带猜测、不写代码 |
| 前置依赖 | task-2026-10-09-001-init-shenzhen-communication-guarantee |

---

## 目标（Goal）

依据 `docs/ai-prompts-guide.md` 提示词流程，以 `pm-inputs/assets/2026年深圳重要通信保障屏建设_202610.md` 为业务输入，完成 `docs/specs/shenzhen-communication-guarantee/` 下的文档（pm-input 整理 + As-Is（绿地说明）+ To-Be 五件套）。**只写文档，不动任何业务代码。**

## 路径说明（与 brownfield 指南的差异）

该模块在 `web/pages/` 下**无既有代码**（绿地），故阶段 1 As-Is 无代码可扫，改为「可复用资产盘点」（emap-gis / ReactECharts / EChartsMap / 大屏引擎 / gd-emergency-support 布局范式）；阶段 2 五件套按模板 + PM 素材生成。

---

## 步骤（执行计划）

### 步骤 1：整理 pm-input
- **动作**：把 assets 需求文档内容结构化填入 `pm-requirements-input.md` §A–I（只整理不新增）
- **输出**：pm-requirements-input.md

### 步骤 2：As-Is（绿地说明）
- **动作**：新建 `as-is-architecture.md`：声明无既有代码、盘点可复用组件与既有同类大屏（gd-emergency-support / info-management-bureau）、§9 拆分建议、§10 开放问题
- **输出**：as-is-architecture.md

### 步骤 3：To-Be 五件套
- **动作**：按 §4.2 提示词生成 spec.md（含 §8 差异、§10 开放问题）、acceptance-tests.md、data-model-extensions.md、plan.md（R 切片）、tasks.md
- **输出**：五件套

### 步骤 4：登记与归档
- **动作**：更新 `docs/specs/index.md` 状态；任务卡回填；验收后归档 `done/2026-10/`
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不修改任何业务代码（`web/`、`public/` 等）
- 不编造 API/字段/接口路径——未知一律写开放问题
- 不做「指标集」（PM 标注「待补充」）的内容填充

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（用户「继续」） | 2026-10-09 | 用户 |
| ② 实现验收 | 已通过 | 2026-10-09 | 用户 |

---

## 进度日志

### 2026-10-09

- 步骤 1 完成：pm-requirements-input.md 按 §A–I 结构化整理（来源 assets 需求稿，未新增业务内容）
- 步骤 2 完成：as-is-architecture.md（绿地说明 + 可复用资产盘点：emap-gis / ReactECharts / 大屏引擎 / 同类大屏范式；§9 建议不拆分子 spec）
- 步骤 3 完成：五件套（spec 含 §8 绿地 Gap 与 §10 七项开放问题；acceptance-tests S1–S9 Gherkin；data-model 八实体草稿、字段留待契约；plan R1–R5 切片；tasks 按 R 切片到文件路径级）
- 步骤 4 完成：index.md 状态更新为「五件套草稿（待评审，接口待定）」
- 全程未改任何业务代码
