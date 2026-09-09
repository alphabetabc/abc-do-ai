# task-2026-09-09-002-spec-003-hazard-drilldown-five-docs

## 背景与动机

spec 003（docs/specs/003-noc-second-hazard/）已完成现状蒸馏（as-is.md），pm-input（pm-inputs/pm-requirements-input.md）已由产品确认定稿：隐患解决情况 / 隐患整改计划支持下钻弹窗呈现隐患详情，隐患整改计划新增「整体计划安排」分类。现需基于 pm-input 生成五件套（spec.md / plan.md / tasks.md / data-model-extensions.md / acceptance-tests.md），使 003 进入可实现状态。

## 需求要点（来自 pm-input，已定稿）

1. 隐患解决情况：堆叠柱图点击某一块，弹窗呈现隐患详情（10 列，加序号，无分页滚动）。
2. 隐患整改计划：新增「整体计划安排」分类（与本月安排、近三个月安排并列），本月/近三月/整体计划均支持点击下钻弹窗；整体计划半年快速呈现全量未解决隐患统计值。
3. 详情字段：隐患流水号、隐患类型、隐患细分分类、隐患名称、专业、隐患级别、隐患处理单位、资源名称、解决排期、整改方案分类。
4. 数据来源：fedx 视图服务（viewItem）。

## 目标文件（待审批后写入 docs/）

-   `docs/specs/003-noc-second-hazard/spec.md` —— 填写 §0 差距、§1–§7（背景、界面交互、数据与领域、API、成功标准、边界、开放问题）
-   `docs/specs/003-noc-second-hazard/data-model-extensions.md` —— 隐患详情 10 字段与视图服务字段映射对照（映射未定则列开放问题）
-   `docs/specs/003-noc-second-hazard/acceptance-tests.md` —— 基于 pm-input §E 验收标准的 Gherkin 场景 + Checklist
-   `docs/specs/003-noc-second-hazard/plan.md` —— 里程碑、前置条件（含 pm-input §I 开放问题迁入）、风险
-   `docs/specs/003-noc-second-hazard/tasks.md` —— 可勾选的后端/前端/测试/文档任务
-   `docs/specs/index.md` —— 003 状态由「盘点中」更新为「spec 编制中/已定稿」
-   `docs/specs/003-noc-second-hazard/as-is.md` —— §4 差距表第 1 行同步为「已有 pm-input，五件套编制中/完成」

## 执行方式（生成时约束）

-   以 pm-input 为唯一需求主输入；assets 仅在 spec 附录保留引用路径，不参与正文拆分。
-   通读 design 四件套；技术事实（字段、API、路由）以 design 为准，不臆造。
-   as-is.md §3 冻结项（路由、viewItemId/requestId 契约、区域联动、轮播节奏、数字人 presets）须在 spec 边界中显式保持。
-   pm-input §I 开放问题（5 项：后台配置项内容、数据量级、半年柱子样式、视图服务映射、截图人工核对）迁入 plan.md 前置，未关闭项不得阻塞清单外任务。
-   不改代码、不更新 docs/design/（无新表/新端点契约变更时）。

## 不做清单

-   不实现任何功能代码
-   不修改 pm-input 定稿内容
-   不在五件套中擅自统一「其它安排/整体计划安排」叫法（以 pm-input 的「整体计划安排」为准）

## 审批记录

-   状态：**已批准**
-   日期：2026-09-09
-   备注：用户于 2026-09-09 批准执行五件套生成。
