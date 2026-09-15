# task-2026-09-11-001-spec-003-hazard-drilldown-modal

## 背景与动机

spec 003（docs/specs/003-noc-second-hazard/）已定稿，进入 M1 编码阶段。第一步骤：仿照割接过程管控（cutover-process-manager）的 Modal + 详情表格模式，在隐患解决情况（hazard-solve）与隐患整改计划（hazard-rectify）两处完成下钻模态框的基本逻辑。viewItemId / 字段映射未定稿（spec §7 问题 1），先用 localMockUrl mock 开发。

## 需求要点

1. 弹窗样式与 Modal 逻辑仿 web/pages/management-overview-second/modules/cutover-process-manager/CutoverProcessManagement.tsx（rootClassName / width 1545 / centered / maskClosable false / title null / footer null / onCancel 关闭并清空状态）。
2. 点击图表数据点时，取出埋入的原始 indicator 行，传入弹窗 children 表格，由表格发起详情请求：
    - hazard-solve：Bar3dLineChart 的 createSeries 已在每个 data 项埋 `__rawData`（web/components/ui/rc-echarts/bar3d-line/utils.ts），点击取 `params.data.__rawData`；仅柱系列（indicatorGroup '1' 未解决 / '2' 已解决）下钻，线系列不弹窗。
    - hazard-rectify：option 组装时埋 `__rawItem`（modules/hazard-rectify/index.tsx，计划/已完成两系列均埋），点击取 `params.data.__rawItem`；已与产品确认弹窗按系列区分（如「核心网 - 计划」与「核心网 - 已完成」分别弹窗，2026-09-11）。
3. 弹窗表格：序号 + 10 列（隐患流水号、隐患类型、隐患细分分类、隐患名称、专业、隐患级别、隐患处理单位、资源名称、解决排期、整改方案分类），无分页，滚动展示。

## 改动文件

-   新增 web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.tsx —— 隐患解决情况专属弹窗（Modal + 详情表格，样式仿 cutover-detail；10 列定义内联在 useMemo 中）
-   新增 web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.less —— 表格样式（沿用 cutover-detail 的表头/行背景/边框风格）
-   新增 web/pages/management-overview-second/modules/hazard-rectify/detail-modal/index.tsx —— 隐患整改计划专属弹窗（Modal + 详情表格，样式仿 cutover-detail；10 列定义内联在 useMemo 中）
-   新增 web/pages/management-overview-second/modules/hazard-rectify/detail-modal/index.less —— 同上
-   改 web/services/management-overview-second/share/index.ts —— 新增 `getHazardSolveDetailDataApi`（隐患解决情况详情）与 `getHazardRectifyDetailDataApi`（隐患整改计划详情），以及 `THazardDetailRawItem` 类型；均占位 viewItemId 'risk-detail'，viewPageArgs 风格（zoneId / zoneLevel + indicatorName / indicatorGroup / indicatorId）
-   新增 public/static/mock/management-overview-second/risk-detail.json —— mock 数据（两处共用）
-   改 web/pages/management-overview-second/modules/hazard-rectify/index.tsx —— 数据点统一埋 `__rawItem`；点击打开本模块弹窗；修正两处 onEvents.click 回调名对调问题
-   改 web/pages/management-overview-second/modules/hazard-solve/index.tsx —— 点击柱块打开本模块弹窗（\_\_rawData，仅柱系列）
-   删除首版误建的公共目录 web/pages/management-overview-second/modules/hazard-detail-modal/（改为各模块目录下独立维护）
-   删除两处 detail-modal/columns.ts（评审意见：10 列定义内联到各自 index.tsx 的 useMemo 中，无需单独文件）
-   删除首版共用的 web/services/management-overview-second/left/hazardDetail.ts（评审意见：请求方法按模块拆分为 hazardSolveDetail.ts / hazardRectifyDetail.ts）
-   删除 web/services/management-overview-second/left/hazardSolveDetail.ts 与 hazardRectifyDetail.ts（评审意见：请求方法并入 share/index.ts，与 getRiskResolvePlanDataApi 等现有左屏 service 保持一处维护）

## 编码过程中的调整记录（评审意见落地）

1. **弹窗组件不做成公共组件**：首版建的 modules/hazard-detail-modal/ 公共目录，经用户评审改为各模块目录下独立维护（hazard-solve/detail-modal/、hazard-rectify/detail-modal/），便于后续两处分化。
2. **antd 5 弃用 API 修正**：`maskStyle` / `bodyStyle` 弃用，统一改为 `styles={{ body: { height: 400 }, mask: { backgroundColor: 'transparent' } }}`。
3. **columns 收敛**：10 列定义原单独放 columns.ts，经用户评审内联回各自 index.tsx，并用 `useMemo(() => [...], [])` 包住，避免 render 期间每次重建数组。
4. **rootClassName 各自命名**：`hazard-solve-detail-modal` / `hazard-rectify-detail-modal`；表格内容样式类同为 `mos-hazard-detail-root`（less 各自持有）。
5. **service 请求方法并入 share/index.ts**：先拆为 left/hazardSolveDetail.ts 与 left/hazardRectifyDetail.ts，经用户评审最终并入 `web/services/management-overview-second/share/index.ts`（`getHazardSolveDetailDataApi` / `getHazardRectifyDetailDataApi` / `THazardDetailRawItem`），与 getRiskResolvePlanDataApi 等现有左屏 service 保持一处维护；viewPageArgs 风格，组件侧组装过滤参数；mock 数据（risk-detail.json）共用。

## 待办（依赖 M0 契约定稿，spec 003 §7 问题 1）

> **已全部移交 task-2026-09-15-001-spec-003-hazard-api-integration**（2026-09-15）：M0 契约已由后端接口文档定稿，下列三项及 skill design 文档更新均由该 task 承接；该 task 完成（含联调通过）即视为本 task 一并完成归档。

-   回填 viewItemId / requestId：`risk-detail` 为占位名，定稿后在 `web/services/management-overview-second/request-api.ts` 的 requestIdMapping 中登记真实条目（该文件为脚本生成，需重新生成或与后端确认 id 后补充），并同步修改 share/index.ts 两处 API 的 viewItemId / requestId
-   回填弹窗 10 列字段英文名（dataIndex），当前为占位（hazardSerialNo 等），定稿后同步调整两处 detail-modal 的 columns 定义
-   M0 定稿后与后端联调，去掉 localMockUrl，验证真实数据链路

## 本 task 范围内的后续编码项（spec 003 M2：隐患整改计划新增「整体计划安排」分类）

-   **已拆出独立 task**：见 `plans/task-2026-09-11-002-spec-003-hazard-rectify-overall-plan.md`（待审批），内容要点：
    -   hazard-rectify Carousel 由双页扩为三页：新增「整体计划安排」分类，翻页节奏沿用 10 秒 + 悬停暂停
    -   整体计划安排：**线图、横轴为时间（半年维度）**，快速呈现**全量未解决隐患统计值**（新增数据视图与图表，viewItemId 待定，spec §7）
    -   三个分类均支持点击下钻弹窗：复用本 task 已建 hazard-rectify/detail-modal
    -   线图样式：原 pm-inputs §C.4 原型（image_003）为柱形，最终定义为线图，待 UI 确认（spec §7）
    -   前置依赖：数据视图定义（研发 + 后端）与 UI 样式两个开放问题闭环

## 后续步骤（task 完成后）

-   更新 skill design 文档：`noc-shaanxi-project-context/design/modules/management-overview-second/hazard-solve/`（README.md、data-format.md）——补充下钻弹窗交互、`__rawData` 埋点、detail-modal 组件、share/index.ts 中 getHazardSolveDetailDataApi 契约（占位 viewItemId 'risk-detail'）
-   更新 skill design 文档：`noc-shaanxi-project-context/design/modules/management-overview-second/hazard-rectify/`（README.md、data-format.md）——补充 `__rawItem` 埋点、按系列区分下钻（产品已确认 2026-09-11）、detail-modal 组件

## 不做清单

-   不实现隐患整改计划「整体计划安排」新分类（M2）
-   不做下钻呈现范围集中配置消费
-   不处理大数据量虚拟滚动
-   不定稿 viewItemId / 字段英文名（M0 契约，mock 占位）

## 审批记录

-   状态：**已关闭（归档）**
-   日期：2026-09-11（创建）→ 2026-09-15（归档）
-   备注：编码已在用户指示下先行开展，本 task 补记。
-   归档说明（2026-09-15）：全部遗留事项（viewItemId / requestId 登记、字段英文名回填、联调去 mock、skill design 文档更新）已由 `task-2026-09-15-001-spec-003-hazard-api-integration` 承接并完成编码与文档同步（commit f905ea5，联调遗留项仍由该 task 跟踪）。本 task 随之关闭，归档至 `plans/done/`。
