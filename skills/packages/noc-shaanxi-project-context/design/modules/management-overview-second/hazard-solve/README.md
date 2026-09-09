---
name: 'noc-shaanxi-second-hazard-solve'
version: '1.0'
updated: '2026-09-09'
description: '隐患解决情况模块（hazard-solve）：堆叠柱 + 折线组合图，展示各地市已解决/未解决隐患数量与解决及时率。'
---

# 隐患解决情况（hazard-solve）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 最后更新 | 2026-09-09 |

## 一、基本信息

| 项 | 值 |
| --- | --- |
| 源码位置 | `web/pages/management-overview-second/modules/hazard-solve/` |
| widget 注册名 | 隐患解决情况 |
| 布局（4800×1200 设计稿） | left: 90, top: 470, 690×379（左列第二排左侧） |
| 订阅字段 | `zoneSelect`（payload `{ zoneId, zoneLevel }`） |
| 数据接口 | `getHazardSolveDataApi`（`web/services/management-overview-second/left/hazardSolve.ts`） |
| 图表组件 | `Bar3dLineChart`，详见 `design/frontend-ui/rc-bar3d-line/overview.md` |
| 视图映射 | viewPageId `noc-module-oriented-left-page` / viewItemId `risk-resolve`，requestId 8830 |
| 轮询周期 | 30 分钟（`TIME_RANGE.MINUTE * 30`） |
| 请求前置 | `zoneId` 与 `zoneLevel` 均已定义（`isDefined` 守卫，ready 控制） |

## 二、文件结构

```
hazard-solve/
├── index.tsx    # 组件入口（Panel + Bar3dLineChart）
├── presets.ts   # y 轴与 series 配置（已解决/未解决/解决及时率/全省及时率 markLine）
└── index.less   # 样式（.hazard-solve-root）
```

## 三、数据流

1. `props.zoneSelect` 经 `pick` 提取 `zoneId` / `zoneLevel` 作为 `refreshDeps`。
2. `getHazardSolveDataApi(currentZone)` POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），`viewPageArgs: { zoneId, zoneLevel }`。
3. 返回 `data.viewItemData.rows` **不做任何转换**，直接作为 `dataSource` 传入 `Bar3dLineChart`；出错时返回 `[]`。
4. rows 中每行的 `indicatorGroup` 字段对应 presets.ts 中 `seriesSettings` 的 `id`，由公共组件 `createSeries`（`rc-echarts/bar3d-line/utils.ts`）匹配后组装 series。

> 服务端响应结构、rows 字段表与 `createSeries` 加工逻辑详见 [data-format.md](./data-format.md)；图表组件的用法与实现原理详见 `design/frontend-ui/rc-bar3d-line/overview.md`。

## 四、图表配置（presets.ts）

- `yAxisLeft`：名称 `( 条 )`，隐藏分割线。
- `yAxisRight`：名称 `( % )`，隐藏分割线，max 100。
- `seriesSettings` 4 个 series（均通过 `id` 与数据行匹配）：

| id | 类型 | 图例名 | 说明 |
| --- | --- | --- | --- |
| '2' | `SeriesType.Bar3D` | 已解决 | 绿系渐变（left: #00DA14→#00BE6C，right: #05D100→#52AE00，top: #81DB00→#00FFCC），`stack: 'bar'` |
| '1' | `SeriesType.Bar3D` | 未解决 | 黄系渐变（left: #DAAE00→#BE6C00，right: #AE5E00→#D1AC00，top: #DBAF00→#FFD800），`stack: 'bar'`，与已解决堆叠为同一柱 |
| '3' | `SeriesType.Line` | 解决及时率 | 折线 #00AE58，圆点 #00F65F（白描边），symbolSize 10 |
| '4' | `SeriesType.MarkerLine` | 全省隐患解决及时率 | 青色虚线 markLine（#00FCFF，type [10,2]），`silent: true`；数值来自 rows 中 indicatorGroup '4' 行的 indicatorValue（空值时整组从图例移除） |

- Bar3D 的 `itemStyle` 采用 left/right/top 三面渐变结构（组件自定义格式，非原生 echarts 配置），并附带 `as any` 类型断言。
- id '3' 的 seriesItem 中有一段被注释的 `areaStyle` 渐变配置（历史保留）。

## 五、交互现状

- **无业务点击 / 下钻交互**：未向 `Bar3dLineChart` 传 `onHandleBarClick`。注意公共组件已绑定 echarts `click` 事件且回调内直接调用该 prop（无空值保护），**图表被点击时会抛 TypeError**——接下钻需求时传入回调即可顺带修复。
- 数字人：本模块暂无 `useMetaHumanEffect` 接入（`metaHumanPresets.ts` 无对应预设）。

## 六、与进行中需求的差距（隐患下钻 docs/specs/003-noc-second-hazard）

需求 C.1：点击堆叠柱某块（已解决/未解决 × x 轴）弹窗展示隐患详情（10 列表格，无分页滚动展示）。差距：

1. 需启用柱子点击回调——公共组件 `onEvents.click` 已绑定且每个数据点携带 `__rawData`（完整行数据，含 indicatorGroup/indicatorName），点击 params 中 `seriesName`（图例名）可区分已解决/未解决、`name`（indicatorName）为 x 轴类目，**下钻定位所需信息已具备，仅需传入 `onHandleBarClick` 实现**（已读 bar3d-line 源码确认）。
2. 需新增隐患详情 Modal + 表格组件（可参考右屏 `cutover-detail` 与中屏 `alarm-detail`：antd Table + react-resizable + 序号列）。
3. 需新增 10 列详情数据的视图服务接口（具体视图/字段映射待产品确认，见需求文档 §I 开放问题 4）。
4. 后台可配置下钻呈现范围（只呈现未解决 / 未解决+已解决）——配置项内容未定，可参考 `shaanxiCustomSettings.screen2` 环境配置体系承载。

## 七、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：基于源码梳理建立模块文档 |
| v1.1 | 新增 §三.1 服务端数据格式（基于 bar3d-line 源码确认）；修正 series 匹配字段为 indicatorGroup；确认 markLine 数值来源；发现点击无空值保护问题 |
