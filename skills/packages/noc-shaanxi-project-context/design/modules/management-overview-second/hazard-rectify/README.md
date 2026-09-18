---
name: 'noc-shaanxi-second-hazard-rectify'
version: '2.1'
updated: '2026-09-18'
description: '隐患整改计划模块（hazard-rectify）：本月安排 / 近三个月安排 / 整体计划安排三页 Carousel，前两页双折线面积图（计划 vs 已完成）、第三页横向柱图；三分类均支持点击下钻弹窗（risk-plan-detail）。'
---

# 隐患整改计划（hazard-rectify）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v2.1       |
| 最后更新 | 2026-09-18 |

## 一、基本信息

| 项                       | 值                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 源码位置                 | `web/pages/management-overview-second/modules/hazard-rectify/`                                                                                                  |
| widget 注册名            | 隐患整改计划-（近期安排）                                                                                                                                       |
| 布局（4800×1200 设计稿） | left: 840, top: 470, 690×350（左列第二排右侧）                                                                                                                  |
| 订阅字段                 | `zoneSelect`（payload `{ zoneId, zoneLevel }`）                                                                                                                 |
| 数据接口                 | `getRiskResolvePlanDataApi`（本月/近三个月，share/index.ts）                                                                                                    |
| 整体计划接口             | `getRiskWholePlanDataApi`（share/index.ts）                                                                                                                     |
| 详情接口                 | `getHazardRectifyDetailDataApi`（share/index.ts）                                                                                                               |
| 视图映射                 | risk-resolve-plan（requestId 8833）/ risk-whole-plan（requestId 待登记）/ risk-plan-detail（requestId 待登记），viewPageId 均为 `noc-module-oriented-left-page` |
| 轮询周期                 | 30 分钟（`TIME_RANGE.MINUTE * 30`，两个数据请求各自独立 useRequest）                                                                                            |
| 请求前置                 | `zoneId` 与 `zoneLevel` 均已定义（`isDefined` 守卫）                                                                                                            |

## 二、文件结构

```
hazard-rectify/
├── index.tsx           # 组件入口（Panel + 三页 Carousel + 两个数据 useRequest + DetailModal）
├── option.ts           # chartOption 图表配置模板（双折线面积图，本月/近三个月两页共用）
├── index.less          # 样式（.hazard-rectify-root / tab 栏绝对置顶 / .bar-chart-wrapper 290px）
├── detail-modal/
    ├── index.tsx       # 隐患详情弹窗（Modal + antd Table，11 列，无分页滚动，mergeDetailColumns 列配置驱动）
    └── index.less      # 弹窗样式（rootClassName hazard-rectify-detail-modal）
```

## 三、数据流

1. **本月/近三个月**：`getRiskResolvePlanDataApi(props.zoneSelect)`，converter 按 `moduleId` 拆分：'4' → `data3`（近三个月）、其余 → `data1`（本月）；返回 `{ data1, data3 }`。整体计划安排已从该视图剥离（原 moduleId '6' 占位已移除）。
2. **整体计划安排**：`getRiskWholePlanDataApi(props.zoneSelect)`（独立视图 risk-whole-plan）——契约（接口2）：`indicatorName` = 横轴时间、`indicatorValue` = 全量未解决统计值、`indicatorUnit` = 单位。
3. 组件内三个 useMemo：
    - `option1` / `option3`：data1 / data3 按 `indicatorGroup === '1'`（计划）/ else（已完成）拆两系列，value 埋 `__rawItem`，`cloneDeep(chartOption)` + `set()` 填充。
    - `wholePlanBarData`：wholePlanData 转 BarChart 入参 `{ nameList（indicatorName 时间）, valueList（Number(indicatorValue)，埋 __rawItem）, unit }`。
4. **下钻链路（2026-09-15 接入，契约接口3）**：本月/近三个月页 `onChartPointClick`（ReactECharts onEvents.click，取 `params.data.__rawItem`）→ 打开 `HazardRectifyDetailModal`；整体计划页 `onWholePlanBarClick`（BarChart props.onClick）→ rawItem 打 `__planType: 'whole'` 标记后开弹窗。

> 服务端响应结构、rows 字段表详见 [data-format.md](./data-format.md)。

## 四、图表配置

### 4.1 本月 / 近三个月（option.ts chartOption，ReactECharts）

-   tooltip：axis 触发；grid：left/right 1%、top 15%、bottom 5%、containLabel。
-   legend：右上角「计划」「已完成」，白字 16px。
-   xAxis：category，interval 0，类目（专业名）支持 `xAxisLabelFormatter` 映射折行（2026-09-18 接入，见 §4.3）；yAxis：value，`minInterval: 1`（2026-09-18 新增，隐患数量为计数值，避免 1.5 / 3.5 小数刻度），隐藏分割线与刻度。
-   series 两条折线（均带 label 顶部数值 + 面积渐变 + 白描边圆点 symbolSize 7）：

| series                     | 折线色  | 面积渐变                                  |
| -------------------------- | ------- | ----------------------------------------- |
| 计划（indicatorGroup '1'） | #24FF6C | rgba(10,106,42,0.9) → rgba(0,255,84,0.1)  |
| 已完成（'2'）              | #56E4FF | rgba(0,118,176,0.9) → rgba(0,118,176,0.1) |

### 4.2 整体计划安排（第三页，BarChart 复用形态）

-   复用 `modules/components/bar-chart`（与隐患分类统计「专业/原因」tab 完全同款：横向柱、斜纹填充、渐变底色、右侧数值标签）。
-   BarChart 组件已改造（2026-09-15）：背景柱最大值计算兼容对象元素（`curr?.value ?? curr`）、支持 `props.onClick`（initChart 后 `on('click')`，卸载 `off`）。
-   容器 `.bar-chart-wrapper` 高度 290px。

### 4.3 x 轴专业名折行（2026-09-18 接入）

-   `index.tsx` 通过 `useEnvironment()` 读取 `shaanxiCustomSettings.screen2.左屏-隐患整改计划.xAxisLabelFormatter`（映射：原专业名 → 折行文案，如 `"无线接入网": "无线\n接入网"`），在 option1 / option3 组装后 `set(option, 'xAxis[0].axisLabel.formatter', fn)` 注入；未命中映射的类目原样展示（兜底）。
-   实验配置在 `public/environment-local.json`（`start:local-env` 加载），最终落点 `public/environment.json` + 现场服务器 environment.json。

## 五、下钻弹窗（detail-modal，2026-09-15）

-   **样式**：仿 cutover-process-manager Modal 模式——rootClassName `hazard-rectify-detail-modal` / width 1545 / centered / maskClosable false / title null / footer null；antd 5 用 `styles={{ body, mask }}`。
-   **请求参数组装**（契约接口3，viewItemId `risk-plan-detail` / riskPlanDetail-Group）：

| 参数           | month（本月）                  | 3month（近三个月）       | whole（整体计划）            |
| -------------- | ------------------------------ | ------------------------ | ---------------------------- |
| riskStatus     | 计划 '1' → 计划 / '2' → 已完成 | 同左                     | 固定 `全部`                  |
| planType       | `month`                        | `3month`（moduleId '4'） | `whole`（`__planType` 标记） |
| major          | indicatorName（x 轴专业）      | 同左                     | 不传                         |
| indicatorGroup | 不传                           | 不传                     | rawItem.indicatorGroup       |

-   rawItem 打 `__planType: 'whole'` 标记由 `onWholePlanBarClick` 注入，detail-modal 据此分支。
-   **表格 11 列**（真实 dataIndex，同 risk-detail 契约字段）：序号 + hiddenDangerSerialNo / hiddenDangerType / hiddenDangerSubType / hiddenDangerName / major / hiddenDangerLevel / handleDept / resourceName / solveSchedule / rectifyPlanClassify / hiddenDangerCount（隐患数量，2026-09-18 新增）。
-   **列配置驱动（2026-09-18 预埋）**：columns 经公共工具 `mergeDetailColumns`（`modules/components/detail-columns.ts`）组装，读取 `shaanxiCustomSettings.screen2.左屏-隐患整改计划.detailColumns` 配置（`[{ dataIndex, label?, width? }]`）——配置存在时顺序/表头/宽度以配置为准，未列出的列隐藏，render 等内置逻辑按 dataIndex 从代码列合入；配置缺失或空（`isEmpty`）整体回退代码默认列；序号列不受配置控制始终最前；配置了代码里没有的 dataIndex 直接丢弃。当前未下发配置，逻辑为预埋。
-   **接口层**：`getHazardRectifyDetailDataApi`（share/index.ts）——requestId 占位（`@ts-expect-error`）保留不登记（见 overview.md §2.2 交付口径）；localMockUrl 指向独立 mock `risk-detail-rectify.json`（长期保留；共用文件 risk-detail.json 勿动）。
-   **mock 局限**：mock 不区分点击维度（三分类、不同专业/系列弹同数据）。

## 六、交互现状

-   **Carousel 三页轮播**：antd Carousel，`dots={false}`、`autoplaySpeed={10000}`、`speed={10000}`、`effect="fade"`、`pauseOnHover`；`afterChange` 同步 `activeIndex` 驱动 tab 选中态。
-   **tab 栏**：三个分类标题绝对定位置顶（独立于轮播页，index.less `.month-content`），点击 `goTo(index)` 直达对应页；数字人 indexMap：`{ 本月安排: 0, 近三个月安排: 1, 整体计划安排: 2 }`。
-   **hover 暂停**：每页 content 挂 `onMouseEnter/onMouseLeave` 切换 autoplay（三页均已覆盖）。
-   **弹窗开合与轮播联动**：`afterOpenChange={(open) => setAutoplay(!open)}`——弹窗打开暂停轮播、关闭恢复；与 hover 暂停、metaHuman 禁播（`autoplay={!metaHumanEnable && autoplay}`）共存。
-   **图表点击下钻**：三分类数据点均可点击弹详情窗（见 §三.4 / §五）。
-   **数字人语音切页（SWITCH_OPERATE，逻辑已 review 2026-09-15）**：链路为 preset 命中（`metaHumanPresets['隐患整改计划']['management-overview-second-left-screen-隐患整改计划-近期']` → `labelGetter: 'data.params.label'`）→ label 经 indexMap 映射页索引 → `ref.current.goTo(index)` 直达页 → `afterChange` 同步 activeIndex 驱动 tab 选中态。`metaHumanEnable` 期间 Carousel autoplay 已禁（`!metaHumanEnable && autoplay`），goTo 后不会被轮播翻走，逻辑自洽。**风险点**：label 需与语音下发文案逐字匹配——preset 注释示例为「近3个月安排」（数字 3），而 indexMap / TAB_LIST 键为「近三个月安排」（汉字三），若下发带数字写法则不命中映射，`?? 0` 兜底静默跳到「本月安排」；label 未识别时无日志反馈，排查需注意。

## 七、已知问题 / 待办

-   `index.tsx` 残留 `console.log('测试日志 隐患整改计划 ...')` 调试输出。
-   requestId 待后端下发登记（risk-whole-plan / risk-plan-detail）。
-   whole 下钻的 indicatorGroup：**按服务端接口文档原样透传**（接口2 返回行的 indicatorGroup 直接作为接口3 planType=whole 的过滤参数）。服务端未提供该字段的明确取值说明与测试数据，前端不做语义假设；若现场联调发现过滤结果与预期不符，再与后端确认取值并调整（2026-09-15 决策，风险仅记录于此）。
-   数字人「整体计划安排」label 语音指令是否实际下发待验证；切页逻辑已 review 通过（见 §六），风险点为 label 文案逐字匹配（「近3个月」vs「近三个月」）。

## 八、版本演进说明

| 版本 | 关键变更                                                                                                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 初始版本：基于源码梳理建立模块文档（双页 Carousel）                                                                                                                                                     |
| v1.1 | 新增 §三.1 服务端数据格式（基于 mock 与 header 元信息确认）                                                                                                                                             |
| v2.0 | 三页 Carousel + 整体计划安排（risk-whole-plan 横向柱图、独立视图）；三分类下钻弹窗接入 risk-plan-detail 契约（参数组装矩阵 §五）；tab 栏绝对置顶 + goTo 直达；弹窗开合联动轮播；BarChart 组件补 onClick |
| v2.1 | task-2026-09-18-001：详情表格新增 hiddenDangerCount 列（11 列）；yAxis minInterval: 1 整数刻度；x 轴 xAxisLabelFormatter 折行映射（§4.3）；detailColumns 列配置驱动预埋（mergeDetailColumns）           |
