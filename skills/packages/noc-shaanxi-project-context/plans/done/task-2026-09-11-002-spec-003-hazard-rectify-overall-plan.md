# task-2026-09-11-002-spec-003-hazard-rectify-overall-plan

## 背景与动机

spec 003（docs/specs/003-noc-second-hazard/）M2：管理总览第二屏「隐患整改计划」模块新增「整体计划安排」分类。task-2026-09-11-001 已完成两处下钻弹窗基本逻辑（hazard-rectify/detail-modal 可复用），本 task 承接整体计划安排的分类页与图表实现。

需求来源：docs/specs/003-noc-second-hazard/pm-inputs/assets/【用户需求说明书】NOC大屏隐患模块新增下钻呈现隐患详情信息20260803.md §整体计划安排「半年快读呈现全量未解决隐患统计值」。

## 需求要点

1. **Carousel 双页扩三页**：hazard-rectify 由「本月安排 / 近三个月安排」扩为「本月安排 / 近三个月安排 / 整体计划安排」，翻页节奏沿用 10 秒 + 悬停暂停（onMouseEnter/onMouseLeave 已有逻辑）。
2. **整体计划安排页**：**线图，横轴为时间（半年维度）**，快速呈现**全量未解决隐患统计值**（新增数据视图 + 图表）。
3. **下钻弹窗**：三个分类均支持点击图表每个点（包括整体计划安排线图上的数据点）弹出隐患详情弹窗（序号 + 10 列，无分页滚动）——复用 task-001 已建 hazard-rectify/detail-modal；过滤维度按新分类数据结构调整（线图横轴为时间，过滤维度预计为时间点而非专业类目，待数据视图定稿后细化）。
4. **样式**：线图配置沿用本模块既有线图形态（line + 渐变面积），但**只有一个系列**，颜色采用「计划」系列的颜色（线色 `#24FF6C`，面积渐变 rgba(10,106,42,0.9) → rgba(0,255,84,0.1)，见 option.ts series[0]）；无需 UI 再确认配色。

## 前置依赖（开工前须闭环）

-   数据视图定义：整体计划安排（半年全量未解决统计，**线图、横轴为时间**）的 viewItemId / 数据结构 / moduleId 划分，待研发 + 后端定稿（spec §7）
-   ~~线图样式待 UI 确认~~ **已定**：沿用本模块线图配置，单系列，颜色取「计划」系列（#24FF6C + 渐变面积，option.ts series[0]），无需 UI 确认
-   task-2026-09-11-001（弹窗基本逻辑）完成并审批归档

## 实际改动（2026-09-11 已完成，mock 先行）

-   改 web/pages/management-overview-second/modules/hazard-rectify/index.tsx —— Carousel 扩三页（每页 tab 含三个分类，非选中 tab 点击沿用 onClick=next()）、新增 option2（整体计划安排，data2 组装 + __rawItem 埋点）、三页图表共用 onChartPointClick 下钻、metaHuman goTo 改为 indexMap 三分类映射
-   改 web/pages/management-overview-second/modules/hazard-rectify/option.ts —— 新增 singleLineChartOption（单系列线图，计划配色 #24FF6C + 绿色渐变面积）
-   改 web/services/management-overview-second/share/index.ts —— getRiskResolvePlanDataApi converter 扩展 data2（moduleId '6' 分支；**注意**：现网 mock 中 moduleId '5' 已被「本月整改计划」占用，故整体计划安排占位用 '6'，待 M0 定稿）
-   改 public/static/mock/management-overview-second/risk-resolve-plan.json —— 追加 6 行 moduleId '6' 数据（2026-04 ~ 2026-09，indicatorGroup '1'/未解决）
-   index.less 无需改动（三 tab 复用既有 .month 样式）
-   request-api.ts 未动（requestIdMapping 脚本生成，viewItemId 待 M0 定稿后登记）
-   docs/specs/003-noc-second-hazard/ 五个文档已同步修改（spec.md §2.2/§7、plan.md M0-5 关闭、tasks.md M0-5/M2、acceptance-tests.md、data-model-extensions.md）

### 实施备注

> **本 task 全部遗留事项已移交 task-2026-09-15-001-spec-003-hazard-api-integration**（2026-09-15）：真实数据视图契约为 risk-whole-plan，data2 的 indicatorGroup 语义校正与 metaHuman label 验证均由该 task 承接；该 task 完成（含联调通过）即视为本 task 一并完成归档。

-   翻页交互：~~非选中 tab 点击仍调 ref.current.next()~~ **已重构（评审意见）**：tab 栏从各轮播页中抽出，绝对定位置顶（index.less），由 Carousel afterChange 同步 activeIndex 驱动选中态，tab 点击 goTo(index) 直达对应页
-   metaHuman goTo：indexMap 覆盖「整体计划安排」label；语音指令是否实际下发该 label 待验证（M2 验证项）
-   mock 阶段 data2 的 indicatorGroup 语义为「未解决」（单系列），真实数据视图定稿后校正

## 改动文件（原预估，已被上节取代）

-   （原预估清单，保留供对照；request-api.ts 与新 mock 文件两项未发生：requestId 待定稿登记、mock 并入既有 risk-resolve-plan.json）

-   改 web/pages/management-overview-second/modules/hazard-rectify/index.tsx —— Carousel 扩三页、整体计划安排页 UI 与图表、点击下钻接 detail-modal、翻页按钮交互适配
-   改 web/pages/management-overview-second/modules/hazard-rectify/option.ts（或新增 option 变体）—— 半年统计图表 series
-   改 web/pages/management-overview-second/modules/hazard-rectify/index.less —— 新分类页样式
-   改 web/services/management-overview-second/share/index.ts —— 新数据视图 API（或扩展 getRiskResolvePlanDataApi converter，视后端是否同视图返回而定）
-   改 web/services/management-overview-second/request-api.ts —— 登记新 viewItemId 的 requestId（脚本生成，重新生成或与后端确认后补充）
-   新增 public/static/mock/management-overview-second/\*.json —— 整体计划安排 mock 数据
-   metaHuman 联动适配：useMetaHumanEffect 中 goTo 分支（'整体计划安排' label）待确认语音指令是否覆盖
-   **docs/specs/003-noc-second-hazard/ 对应文档同步修改**（按 AGENTS.md docs 审批机制，以本 task 为提案载体，随本 task 一并审批）：
    -   spec.md §2.2 —— 图表形态由「半年的柱子」修正为「线图、横轴为时间、单系列、计划系列配色（#24FF6C）」
    -   spec.md §7 —— 开放问题 5（半年柱子样式待 UI 确认）关闭；开放问题 2（数据视图定义）待 M0 定稿后回填
    -   data-model-extensions.md —— 整体计划安排数据视图字段定义（M0 契约定稿后回填）
    -   tasks.md —— M2 任务条目补充实现细节（线图形态、单系列、复用 detail-modal）
    -   acceptance-tests.md —— M2 验收标准同步（线图呈现、三分类下钻、弹窗过滤维度）

## 不做清单

-   不定稿数据视图契约（M0，前置依赖闭环后开工）
-   不改 hazard-solve 模块
-   不做下钻呈现范围集中配置消费（spec M3）

## 审批记录

-   状态：**已关闭（归档）**
-   日期：2026-09-11（批准）→ 2026-09-15（归档）
-   批准人：用户（2026-09-11，对话中批准执行）
-   备注：依赖 task-2026-09-11-001 完成及数据视图定义闭环后方可开工。**本 task 审批同时覆盖改动文件清单中 docs/specs/003-noc-second-hazard/ 下 5 个文档的修改授权**（批准本 task 即批准这些 docs 变更）。
-   归档说明（2026-09-15）：真实数据视图契约为 risk-whole-plan，图表形态由线图改为横向柱图（复用隐患分类统计柱图形态），`__planType: 'whole'` 下钻标记与 metaHuman label 验证均由 `task-2026-09-15-001-spec-003-hazard-api-integration` 承接并完成编码与文档同步（commit f905ea5）。本 task 随之关闭，归档至 `plans/done/`。
