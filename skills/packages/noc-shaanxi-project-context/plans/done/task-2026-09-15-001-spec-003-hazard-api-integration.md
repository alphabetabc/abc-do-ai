# task-2026-09-15-001-spec-003-hazard-api-integration

## 背景与动机

后端已交付《backend-api-docs/陕西-NOC-202609需求接口文档.md》，为 spec 003（docs/specs/003-noc-second-hazard/）提供三个 viewItem 契约，M0 契约冻结条件基本达成：

| 接口                 | viewItemId         | viewItemGroupId      | 用途                                                                                                                                                                                                             | 关键 viewPageArgs                                                                                                                                                  |
| -------------------- | ------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 隐患详情           | `risk-detail`      | riskDetail-Group     | hazard-solve / hazard-rectify 下钻弹窗明细（10 列）                                                                                                                                                              | zoneId / zoneLevel / riskStatus（全部\|已完成\|未完成）                                                                                                            |
| 2 整体计划类型柱状图 | `risk-whole-plan`  | riskWholePlan-Group  | **承载方已变更（2026-09-15）**：整体计划安排不再由 hazard-rectify 第三页 Carousel 线图承载，改为 hazard-statistics 模块「专业 / 原因」tab 柱图的数据源（返回 indicatorName/indicatorValue 通用行结构，横轴时间） | zoneId / zoneLevel                                                                                                                                                 |
| 3 整改计划下钻详情   | `risk-plan-detail` | riskPlanDetail-Group | hazard-rectify 三分类下钻弹窗明细（10 列，同 risk-detail 列）                                                                                                                                                    | zoneId / zoneLevel / riskStatus（全部\|已完成\|计划）/ planType（month\|3month\|whole）/ major（month、3month 时传）/ indicatorGroup（whole 时传，取接口2 返回值） |

隐患详情 10 字段英文名（两处详情接口一致）：hiddenDangerSerialNo、hiddenDangerType、hiddenDangerSubType、hiddenDangerName、major、hiddenDangerLevel、handleDept、resourceName、solveSchedule、rectifyPlanClassify。接口 2 返回 indicatorName / indicatorValue / indicatorUnit / indicatorGroup 四字段，**已确认（2026-09-15）：indicatorName 即横轴（时间维度）、indicatorValue 为统计值**。

task-2026-09-11-001（下钻弹窗，审批状态仍为待审批）、task-2026-09-11-002（整体计划安排分类，已批准）均已完成 mock 先行实现，本 task 承接两 task 留下的全部未完事项（真实契约回填与联调）。**本 task 完成（含联调通过）即视为上述两个 task 一并完成，随本 task 归档；两个 task 的遗留事项不得再独立开工。**

### 关联的前序 task 未完事项清单

**来自 task-2026-09-11-001（下钻弹窗）：**

-   「待办（依赖 M0 契约定稿）」全部三项：回填 viewItemId / requestId（risk-detail 占位转正）、回填弹窗 10 列 dataIndex（占位 hazardSerialNo 等转正）、去掉 localMockUrl 联调真实链路
-   「后续步骤（task 完成后）」skill design 文档更新：`design/modules/management-overview-second/hazard-solve/` 与 `hazard-rectify/` 的 README.md、data-format.md —— 补充下钻弹窗交互、`__rawData` / `__rawItem` 埋点、detail-modal 组件、share/index.ts 详情 API 真实契约（本 task 收尾时随真实字段一并写入）
-   审批收尾：该 task 状态仍为「待审批」（编码先行、补记），随本 task 完成归档时一并闭环

**来自 task-2026-09-11-002（整体计划安排分类）：**

-   「实施备注」遗留：真实数据视图定稿后校正 data2 的 indicatorGroup 语义（mock 阶段为「未解决」占位）——由本 task 的 risk-whole-plan 契约回填闭环
-   「实施备注」遗留：metaHuman goTo「整体计划安排」label 语音指令是否实际下发待验证（M2 验证项）——随本 task 联调验证
-   「前置依赖」遗留：整体计划安排数据视图的 viewItemId / 数据结构定稿（即 risk-whole-plan）——本 task 落地

## 承载方变更记录（2026-09-15，产品口径）

整体计划安排的 UI 承载由「hazard-rectify Carousel 第三页（单系列线图）」改为「hazard-statistics 模块『专业 / 原因』tab 的柱图」。涉及回退与重做：

-   **回退**：hazard-rectify/index.tsx 中 getRiskWholePlanDataApi 接入、option2（singleLineChartOption 数据源切换）等 2026-09-15 上午的改动需要回退；Carousel 是否回退为双页（本月 / 近三个月）待确认（tab 栏与 indexMap 改动是否保留）
-   **重做**：hazard-statistics/ContentList.tsx 中「专业 / 原因」tab 柱图的数据源由 getHazardStatisticsIndicatorApi（indicatorGroup '2'/'3'）切换为 getRiskWholePlanDataApi（risk-whole-plan，横轴为时间维度）
-   **已可复用**：share/index.ts 的 getRiskWholePlanDataApi 与 mock（risk-whole-plan.json）不动，仅消费方变化
-   **连带影响**：spec.md §2.2（图表形态与承载位置）、tasks.md M2、acceptance-tests.md 验收项需按新口径同步；metaHuman「整体计划安排」label goTo 映射需改到 hazard-statistics tab 或移除

### 变更记录勘误与最终口径（2026-09-15，用户澄清）

-   **最终口径**：整体计划安排仍保留在 hazard-rectify Carousel 第三页（三页结构 / tab 栏 / indexMap 不回退），仅图表形态由单系列线图改为**复用 hazard-statistics「专业 / 原因」tab 的横向柱图**（modules/components/bar-chart 的 BarChart 组件），数据源为 getRiskWholePlanDataApi（risk-whole-plan）
-   **不迁移到 hazard-statistics 模块**：上一节「重做」条目作废，hazard-statistics 现有「来源/专业/原因/类型」tab 及其数据通道不动
-   **已删**：option.ts 中 singleLineChartOption 已删除（用户明确不回退，2026-09-15），hazard-rectify/index.tsx 第三页渲染改为 `<BarChart data={wholePlanBarData} />`
-   **BarChart 点击下钻（已实现，2026-09-15）**：BarChart 组件本身已支持 `props.onClick`（echarts click 透传，此前勘误小节记录有误）；整体计划安排柱条点击 → `onWholePlanBarClick` 取 `__rawItem` 并打 `__planType: 'whole'` 标记；detail-modal 按标记分支组装参数：whole 时 riskStatus=全部、planType=whole、传 indicatorGroup（不传 major），month/3month 逻辑不变
-   **spec 同步要求（用户指示）**：上述变更须全部同步到 docs/specs/003-noc-second-hazard/spec.md（§2.2 图表形态：由「单系列线图、计划配色」改为「横向柱图、复用隐患分类统计专业/原因 tab 柱图形态」）及 tasks.md、acceptance-tests.md 对应条目——随本 task 审批一并执行

## 需求要点

1. **真实接口替换 mock**：
    - hazard-solve / hazard-rectify 下钻弹窗：`risk-detail`（hazard-solve）/ `risk-plan-detail`（hazard-rectify 三分类）替换 localMockUrl + risk-detail.json mock。
    - 整体计划安排图表：`risk-whole-plan` 替换现网 getRiskResolvePlanDataApi 中 moduleId '6' 占位分支与 mock 数据。
2. **弹窗 10 列 dataIndex 回填**：两处 detail-modal 的 columns 由占位字段名（hazardSerialNo 等）改为后端真实字段名。
3. **下钻过滤参数组装**：
    - hazard-solve：点击柱块按系列（未解决/已解决）映射 riskStatus（未完成/已完成）。
    - hazard-rectify 本月 / 近三个月：planType = month / 3month，按点击系列（计划/已完成）映射 riskStatus（计划/已完成），并传 major（x 轴类目）。
    - hazard-rectify 整体计划安排：planType = whole，点击数据点传 indicatorGroup（取自 risk-whole-plan 返回行的 indicatorGroup）+ riskStatus。
4. **整体计划安排图表数据结构适配**：indicatorName / indicatorValue / indicatorUnit / indicatorGroup 四字段结构接入 singleLineChartOption 组装逻辑（替换 mock data2 结构），横轴时间维度以后端实际返回为准核对。
5. **requestId 登记**：`web/services/management-overview-second/request-api.ts`（脚本生成文件）补充 risk-detail / risk-whole-plan / risk-plan-detail 三个 viewItemId 的条目，需与后端确认 requestId 生成方式后回填。

## 改动文件（预估）

-   改 `web/services/management-overview-second/share/index.ts` —— getHazardSolveDetailDataApi / getHazardRectifyDetailDataApi 回填真实 viewItemId、viewPageArgs 契约（riskStatus / planType / major / indicatorGroup）；getRiskResolvePlanDataApi 整体计划安排分支改为消费 risk-whole-plan 结构
-   改 `web/services/management-overview-second/request-api.ts` —— requestIdMapping 登记三个新 viewItemId（脚本生成文件，确认生成方式后补充）
-   改 `web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.tsx` —— columns dataIndex 回填 10 个真实字段名
-   改 `web/pages/management-overview-second/modules/hazard-rectify/detail-modal/index.tsx` —— 同上；弹窗请求参数按三分类组装（planType / major / indicatorGroup / riskStatus）
-   改 `web/pages/management-overview-second/modules/hazard-rectify/index.tsx` —— 整体计划安排页数据组装适配 risk-whole-plan 结构；点击下钻传参适配
-   改 `web/pages/management-overview-second/modules/hazard-solve/index.tsx` —— 点击柱块的 riskStatus 组装
-   删/改 `public/static/mock/management-overview-second/risk-detail.json` —— 联调通过后视情况移除 localMockUrl 与 mock 文件
-   **docs/specs/003-noc-second-hazard/ 同步修改**（按 AGENTS.md docs 审批机制，以本 task 为提案载体）：
    -   spec.md §4 —— 回填三个 viewItemId / 消费方 / 状态
    -   spec.md §7 —— 开放问题 1、2 关闭（契约已定）；如 riskStatus 枚举与前端「未解决/已解决」映射有出入则记录确认结论
    -   data-model-extensions.md —— 回填三个 viewItem 的字段映射与 viewPageArgs 契约
    -   plan.md —— M0 标记完成
    -   tasks.md / acceptance-tests.md —— M0/联调任务与验收项同步

## 实施进度（2026-09-15）

**编码任务已全部完成（mock 先行，真实联调待后端环境）**。全部改动已由用户提交至 feature-241194 分支 commit `f905ea5`（feat(noc): 第二屏新增能力开发-隐患整改,隐患解决情况）。

### 已完成：整体计划安排（风险整体计划）

-   `getRiskWholePlanDataApi`（share/index.ts）：viewItemId `risk-whole-plan` / viewPageId `noc-module-oriented-left-page`，converter 返回 rows 原始行；requestId 占位（`@ts-expect-error`，待登记）；localMockUrl → risk-whole-plan.json
-   hazard-rectify/index.tsx：独立 useRequest（30 分钟轮询 / 区域联动），`wholePlanBarData`（nameList/valueList/unit，valueList 埋 `__rawItem`）转 BarChart 入参，第三页 `<BarChart>`
-   BarChart 组件（modules/components/bar-chart）：用户改造——背景柱最大值计算兼容对象元素（`curr?.value ?? curr`）、补 `props.onClick` 事件绑定（initChart 后 `barChart.current.on('click', props.onClick)`，卸载时 off）
-   mock：risk-whole-plan.json 按接口 2 真实结构（riskWholePlan-Group、四字段 header、4 条）；risk-resolve-plan.json 移除 moduleId '6' 占位数据；getRiskResolvePlanDataApi 收窄回 data1/data3
-   option.ts 的 singleLineChartOption 已删；`.bar-chart-wrapper` 高度 290px（用户手调）

### 已完成：隐患解决情况弹窗接口接入（risk-detail）

-   `getHazardSolveDetailDataApi`（share/index.ts）：viewItemId `risk-detail`（真实值），viewPageArgs = zoneId / zoneLevel / riskStatus；requestId 占位待登记；**localMockUrl 指向独立 mock `risk-detail-solve.json`**（原 risk-detail.json 被多接口共用，已 git 还原勿动）
-   hazard-solve/detail-modal/index.tsx：
    -   请求参数：占位 indicatorName/indicatorGroup/indicatorId 替换为 `riskStatus`，系列映射：未解决 indicatorGroup '1' → 未完成、已解决 '2' → 已完成（onHandleBarClick 已限定仅这两组触发）
    -   10 列 dataIndex 回填真实字段：hiddenDangerSerialNo / hiddenDangerType / hiddenDangerSubType / hiddenDangerName / major / hiddenDangerLevel / handleDept / resourceName / solveSchedule / rectifyPlanClassify
-   mock：risk-detail-solve.json 按接口 1 真实结构（riskDetail-Group、10 字段 counterFieldList、`_format` 对字段、10 行数据）——注意 mock 不分 riskStatus，点击已解决/未解决柱块显示同样数据，为 mock 局限

### 已完成：隐患整改计划弹窗接口接入（risk-plan-detail）

-   `getHazardRectifyDetailDataApi`（share/index.ts）：viewItemId 由占位 'risk-detail' 改为真实值 `risk-plan-detail`；契约注释回填（riskStatus 全部|已完成|计划 / planType month|3month|whole / major（month、3month）/ indicatorGroup（whole））；localMockUrl 指向独立 mock `risk-detail-rectify.json`（risk-detail.json 共用文件勿动）
-   hazard-rectify/detail-modal/index.tsx：
    -   请求参数：占位 indicatorName / indicatorGroup / indicatorId 替换为契约三参数——`riskStatus`（计划 indicatorGroup '1' → 计划、已完成 '2' → 已完成；whole 时全部）、`planType`（moduleId '4' → 3month、其余 → month；whole 标记优先）、`major`（rawItem.indicatorName，x 轴专业类目；whole 时改传 indicatorGroup）
    -   10 列 dataIndex 回填真实字段（同 risk-detail）
    -   整体计划安排（planType=whole + indicatorGroup）**已接入（2026-09-15）**：onWholePlanBarClick + `__planType: 'whole'` 标记分支（见勘误小节）
-   mock：risk-detail-rectify.json 按接口 3 真实结构（riskPlanDetail-Group、viewItemId risk-plan-detail、10 行数据）——同样不区分点击维度，mock 局限

### 已完成：弹窗开合与轮播联动（2026-09-15，用户指示）

-   两处 detail-modal（hazard-solve / hazard-rectify）组件 props 与内部 Modal 均透传 `afterOpenChange`（antd 5 原生 API）
-   hazard-rectify/index.tsx：`afterOpenChange={(open) => setAutoplay(!open)}`——弹窗打开暂停轮播、关闭恢复，与既有悬停暂停（onMouseEnter/Leave）及 metaHuman 禁播逻辑共存；Carousel 补 `pauseOnHover`
-   hazard-solve 模块无轮播，仅组件层预留 afterOpenChange 能力未消费

## 剩余工作（编码外）

1. ~~requestId 登记（待后端下发）~~ **责任移交现场（2026-09-15 决策）**：requestId 真实值不由前端登记——现场如需启用数据方案，直接把 design 文档 `management-overview-second/overview.md §2.2` 的第二屏环境配置模板（含三条 mapping 占位）发给现场，id 由现场自行查找填写；request-api.ts 代码层登记随之取消（数据方案启用走环境配置 mapping 兜底即可，share/index.ts 的 `@ts-expect-error` 占位保留不影响现网请求）
2. 真实环境联调（待后端就绪）→ 验证 riskStatus / planType / major / indicatorGroup 组装正确性（indicatorGroup 按「原样透传、不假设语义」处理，风险记录见 hazard-rectify design 文档，现场有问题再改）
3. ~~去掉 localMockUrl（联调通过后）~~ **不做**（用户指示 2026-09-15：localMockUrl 保留，三个独立 mock 文件长期维护）
4. ~~docs/specs/003-noc-second-hazard/ 六文档同步~~ **已完成（2026-09-15）**：spec.md（§0 差距表、§2.2、§3、§4、§7，状态改已定稿）、data-model-extensions.md（三 viewItem 字段映射 + 枚举回填）、plan.md（M0/M1/M2 完成标注、前置条件 1/2/5 关闭）、tasks.md（M0/M1/M2 打勾 + 进度快照）、acceptance-tests.md（线图→横向柱图、三分类下钻场景、弹窗轮播联动、Checklist 打勾）；as-is.md 按约定不动
5. ~~skill design 文档更新~~ **已完成（2026-09-15）**：hazard-solve / hazard-rectify 的 README.md + data-format.md 均升至 v2.0（下钻链路、契约参数表、三视图数据格式、独立 mock 说明、弹窗轮播联动）
6. ~~metaHuman「整体计划安排」label 语音指令验证（继承 task-09-11-002）~~ **逻辑层面已关闭（2026-09-15）**：切页逻辑（indexMap + goTo + afterChange 闭环）已 review 通过，结论与风险点（label 文案逐字匹配：「近3个月」vs「近三个月」不命中时静默兜底到本月安排）沉淀至 hazard-rectify design 文档 §六；现场是否实际下发该 label 随联调观察，不单列验证项
7. ~~两个前序 task（09-11-001 / 002）随本 task 归档收尾~~ **已归档（2026-09-15）**：两 task 已随本 task 编码与文档同步完成先行关闭，审批记录置「已关闭（归档）」并移入 `plans/done/`；本 task 联调通过后再最终归档

## 待确认项（开工前与后端/产品闭环）

1. ~~risk-detail 的 riskStatus 枚举为「全部/已完成/未完成」，hazard-solve 下钻点击块是否直接传「已完成/未完成」~~ **已关闭（2026-09-15 决策）**：不做集中配置项，维持「未解决/已解决」两系列均可下钻的现状（点击系列直接映射传已完成/未完成），spec §7-3 下钻呈现范围配置项不再体现；现场有问题再说
2. ~~risk-whole-plan 返回行中 indicatorGroup / indicatorName 的具体取值语义~~ **已关闭（2026-09-15）**：indicatorName 即横轴（时间）、indicatorValue 为统计值；indicatorGroup 按服务端文档「原样透传、不假设语义」处理（服务端无明确文档与测试数据），现场联调如有问题再与后端确认调整——风险记录仅在 hazard-rectify design 文档，不在 docs/specs 体现
3. ~~三个 viewItem 的 requestId 数值（request-api.ts 登记用）~~ **已关闭（2026-09-15）**：requestId 真实值由现场自行查找——现场启用数据方案时直接交付 overview.md §2.2 配置模板，id 现场填写；前端不做 request-api.ts 代码层登记
4. ~~弹窗默认排序（spec §7-6）~~ **已关闭（2026-09-15 决策）**：排序由服务端自行调整，前端不做排序相关能力，按接口返回顺序直接展示

## 不做清单

-   不改既有「本月安排 / 近三个月安排」现网数据通道（moduleId '4'/'5' 分支）契约，仅整体计划安排分支切换 risk-whole-plan
-   不做大数据量虚拟滚动（量级未评估，spec §7-4 维持待评估）
-   不处理 risk-dict / risk-type 废弃问题（spec §7-7）
-   不动数字人 preset 与冻结项

## 审批记录

-   状态：**已批准（归档，2026-09-15）**
-   日期：2026-09-15
-   备注：本 task 审批同时覆盖「改动文件」中 docs/specs/003-noc-second-hazard/ 下 6 个文档的修改授权（已批准并执行完毕）。编码、文档同步、决策沉淀全部完成；唯一遗留为第 2 项真实环境联调（待后端就绪，届时按 design 文档口径现场验证）。
