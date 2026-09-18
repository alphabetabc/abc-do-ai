---
name: 'noc-shaanxi-second-hazard-solve'
version: '2.1'
updated: '2026-09-18'
description: '隐患解决情况模块（hazard-solve）：堆叠柱 + 折线组合图，展示各地市已解决/未解决隐患数量与解决及时率；点击柱块弹窗展示隐患详情（risk-detail）。'
---

# 隐患解决情况（hazard-solve）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v2.1      |
| 最后更新 | 2026-09-18 |

## 一、基本信息

| 项                       | 值                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| 源码位置                 | `web/pages/management-overview-second/modules/hazard-solve/`                                           |
| widget 注册名            | 隐患解决情况                                                                                           |
| 布局（4800×1200 设计稿） | left: 90, top: 470, 690×379（左列第二排左侧）                                                          |
| 订阅字段                 | `zoneSelect`（payload `{ zoneId, zoneLevel }`）                                                        |
| 数据接口                 | `getHazardSolveDataApi`（`web/services/management-overview-second/left/hazardSolve.ts`）               |
| 详情接口                 | `getHazardSolveDetailDataApi`（`web/services/management-overview-second/share/index.ts`）              |
| 图表组件                 | `Bar3dLineChart`，详见 `design/frontend-ui/rc-bar3d-line/overview.md`                                  |
| 视图映射                 | viewPageId `noc-module-oriented-left-page` / viewItemId `risk-resolve`，requestId 8830                 |
| 详情视图映射             | viewItemId `risk-detail`（riskDetail-Group），requestId 占位保留不登记（见 overview.md §2.2 交付口径） |
| 轮询周期                 | 30 分钟（`TIME_RANGE.MINUTE * 30`）                                                                    |
| 请求前置                 | `zoneId` 与 `zoneLevel` 均已定义（`isDefined` 守卫，ready 控制）                                       |

## 二、文件结构

```
hazard-solve/
├── index.tsx           # 组件入口（Panel + Bar3dLineChart + DetailModal）
├── presets.ts          # y 轴与 series 配置（已解决/未解决/解决及时率/全省及时率 markLine）
├── index.less          # 样式（.hazard-solve-root）
└── detail-modal/
    ├── index.tsx       # 隐患详情弹窗（Modal + antd Table，10 列，无分页滚动）
    └── index.less      # 弹窗样式（rootClassName hazard-solve-detail-modal）
```

## 三、数据流

1. `props.zoneSelect` 经 `pick` 提取 `zoneId` / `zoneLevel` 作为 `refreshDeps`。
2. `getHazardSolveDataApi(currentZone)` POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），`viewPageArgs: { zoneId, zoneLevel }`。
3. 返回 `data.viewItemData.rows` **不做任何转换**，直接作为 `dataSource` 传入 `Bar3dLineChart`；出错时返回 `[]`。
4. rows 中每行的 `indicatorGroup` 字段对应 presets.ts 中 `seriesSettings` 的 `id`，由公共组件 `createSeries`（`rc-echarts/bar3d-line/utils.ts`）匹配后组装 series。
5. **下钻链路（2026-09-15 接入，契约见 backend-api-docs/陕西-NOC-202609需求接口文档.md 接口1）**：点击柱块 → `onHandleBarClick` 取 `params.data.__rawData` → 仅柱系列（indicatorGroup '1' 未解决 / '2' 已解决）触发，打开 `HazardSolveDetailModal` → 弹窗内 `getHazardSolveDetailDataApi({ zoneId, zoneLevel, riskStatus, indicatorName })` 拉取 11 列详情 → antd Table 滚动展示（无分页）。
6. **x 轴标签折行（2026-09-18 接入）**：`useEnvironment()` 读取 `shaanxiCustomSettings.screen2.左屏-隐患解决.xAxisLabelFormatter`（映射：原类目名 → 折行文案，如 `"无线接入网": "无线\n接入网"`），通过 `optionBuilder`（Bar3dLineChart 组件提供的 option 二次组装扩展点）注入 `xAxis.axisLabel.formatter`；未命中映射的类目原样展示。实验配置在 `public/environment-local.json`（`start:local-env` 加载），最终落点 `public/environment.json` + 现场服务器。

> 服务端响应结构、rows 字段表与 `createSeries` 加工逻辑详见 [data-format.md](./data-format.md)；图表组件的用法与实现原理详见 `design/frontend-ui/rc-bar3d-line/overview.md`。

## 四、图表配置（presets.ts）

-   `yAxisLeft`：名称 `( 条 )`，隐藏分割线。
-   `yAxisRight`：名称 `( % )`，隐藏分割线，max 100。
-   `seriesSettings` 4 个 series（均通过 `id` 与数据行匹配）：

| id  | 类型                    | 图例名             | 说明                                                                                                                                       |
| --- | ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| '2' | `SeriesType.Bar3D`      | 已解决             | 绿系渐变（left: #00DA14→#00BE6C，right: #05D100→#52AE00，top: #81DB00→#00FFCC），`stack: 'bar'`                                            |
| '1' | `SeriesType.Bar3D`      | 未解决             | 黄系渐变（left: #DAAE00→#BE6C00，right: #AE5E00→#D1AC00，top: #DBAF00→#FFD800），`stack: 'bar'`，与已解决堆叠为同一柱                      |
| '3' | `SeriesType.Line`       | 解决及时率         | 折线 #00AE58，圆点 #00F65F（白描边），symbolSize 10                                                                                        |
| '4' | `SeriesType.MarkerLine` | 全省隐患解决及时率 | 青色虚线 markLine（#00FCFF，type [10,2]），`silent: true`；数值来自 rows 中 indicatorGroup '4' 行的 indicatorValue（空值时整组从图例移除） |

-   Bar3D 的 `itemStyle` 采用 left/right/top 三面渐变结构（组件自定义格式，非原生 echarts 配置），并附带 `as any` 类型断言。
-   id '3' 的 seriesItem 中有一段被注释的 `areaStyle` 渐变配置（历史保留）。

## 五、下钻弹窗（detail-modal，2026-09-15）

-   **样式**：仿 `cutover-process-manager` 的 Modal 模式——rootClassName `hazard-solve-detail-modal` / width 1545 / centered / maskClosable false / title null / footer null / `getContainer={() => root.current}`；antd 5 弃用 API 用 `styles={{ body, mask }}` 替代 maskStyle/bodyStyle。
-   **请求参数组装**（契约接口1）：

| 参数               | 来源                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| zoneId / zoneLevel | 区域联动（props.zoneSelect）                                                                                                        |
| riskStatus         | 点击柱块系列：未解决 indicatorGroup '1' → `未完成`、已解决 '2' → `已完成`；未传兜底 `未完成`（onHandleBarClick 已限定仅这两组触发） |
| indicatorName      | 点击柱块的类目名（rawItem.indicatorName，x 轴地市名，2026-09-18 契约新增）                                                          |

-   **表格 11 列**（真实 dataIndex，契约字段）：序号 + hiddenDangerSerialNo（隐患流水号）/ hiddenDangerType（隐患类型）/ hiddenDangerSubType（隐患细分分类）/ hiddenDangerName（隐患名称）/ major（专业）/ hiddenDangerLevel（隐患级别）/ handleDept（隐患处理单位）/ resourceName（资源名称）/ solveSchedule（解决排期）/ rectifyPlanClassify（整改方案分类）/ hiddenDangerCount（隐患数量，2026-09-18 新增）。
-   **列配置驱动（2026-09-18 预埋）**：columns 经公共工具 `mergeDetailColumns`（`modules/components/detail-columns.ts`）组装，读取 `shaanxiCustomSettings.screen2.左屏-隐患解决.detailColumns` 配置（`[{ dataIndex, label?, width? }]`）——配置存在时顺序/表头/宽度以配置为准，未列出的列隐藏，render 等内置逻辑按 dataIndex 从代码列合入；配置缺失或空（`isEmpty`）整体回退代码默认列；序号列不受配置控制始终最前；配置了代码里没有的 dataIndex 直接丢弃。当前未下发配置，逻辑为预埋。
-   **接口层**：`getHazardSolveDetailDataApi`（share/index.ts）——viewItemId `risk-detail`、viewPageId `noc-module-oriented-left-page`；requestId 占位（`@ts-expect-error`，待登记）；**localMockUrl 指向独立 mock `risk-detail-solve.json`（长期保留，不随联调移除；原 risk-detail.json 被多接口共用勿动）**。
-   **mock 局限**：mock 返回不分 riskStatus，点击已解决/未解决柱块显示同样数据。
-   弹窗组件 props 透传 `afterOpenChange`（当前模块无轮播未消费，能力预留）。

## 六、交互现状

-   **柱块点击下钻**：`onHandleBarClick` 已传入 Bar3dLineChart，点击柱系列弹详情窗；线系列 / markLine 不触发。
-   数字人：本模块暂无 `useMetaHumanEffect` 接入（`metaHumanPresets.ts` 无对应预设）。
-   下钻呈现范围：不做集中配置项（2026-09-15 决策），未解决 / 已解决两组柱块均可下钻（点击系列直接映射传已完成/未完成），spec 003 §7-3 已按此关闭。
-   弹窗排序：服务端负责，前端按接口返回顺序直接展示，不做排序相关能力（2026-09-15 决策，spec 003 §7-6 已关闭）。

## 七、版本演进说明

| 版本 | 关键变更                                                                                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1.0 | 初始版本：基于源码梳理建立模块文档                                                                                                                                                  |
| v1.1 | 新增 §三.1 服务端数据格式（基于 bar3d-line 源码确认）；修正 series 匹配字段为 indicatorGroup；确认 markLine 数值来源；发现点击无空值保护问题                                        |
| v2.0 | 下钻弹窗接入 risk-detail 契约：新增 detail-modal 组件（§五）、下钻链路（§三.5）、riskStatus 参数组装、10 列真实 dataIndex、独立 mock risk-detail-solve.json；修复点击无空值保护问题 |
| v2.1 | task-2026-09-18-001：详情表格新增 hiddenDangerCount 列（11 列）、接口1 入参透传 indicatorName；x 轴 xAxisLabelFormatter 折行映射（optionBuilder 注入）；detailColumns 列配置驱动预埋（mergeDetailColumns） |
