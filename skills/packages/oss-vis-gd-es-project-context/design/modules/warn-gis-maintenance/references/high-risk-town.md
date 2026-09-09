# HighRiskTown 高风险乡镇组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/index.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/InfoCard.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/presets.tsx`

## 职责

HighRiskTown 负责展示高风险乡镇退服预测打点数量、点位详情表格，以及省级统计信息卡片。

## Presets

**文件位置**：`high-risk-town/presets.tsx`

**核心导出**：

| 导出                         | 类型                                                   | 说明                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `HighRiskTownLegendType`     | `string`                                               | 常量 `"highRiskTown"`，用于图例判断                                                                                                    |
| `showHighRiskTownLegendType` | `(legendSelected: any) => boolean`                     | 判断图例列表中高风险乡镇图例是否被选中                                                                                                 |
| `getInfo`                    | `(rows: any) => { time: string, count: number }        | null`                                                                                                                                  | 从 API 返回的 rows 中提取摘要信息，取第一条的 `forecastDataTime` 和数组长度 |
| `getTableDataSource`         | `(rows: any) => { columns: Array, dataSource: Array }` | 将 API 原始 rows 转换为表格列定义和数据源，支持 `regionName` 和 `areaName` 的 rowspan 合并，生成 `riskDesc` 和 `suggestion` 格式化文本  |

**表格列定义**：

| 列名         | 数据字段     | 宽度  | 说明              |
| ------------ | ------------ | ----- | ----------------- |
| 地市         | `regionName` | 100px | 支持 rowspan 合并 |
| 区县         | `areaName`   | 100px | 支持 rowspan 合并 |
| 乡镇         | `townName`   | 100px | -                 |
| 风险描述     | `riskDesc`   | 190px | 格式化文本        |
| 物资预置建议 | `suggestion` | 250px | 格式化文本        |

**数据转换说明**：

```typescript
riskDesc = `预计245G基站退服比例达到${row.btsOutRate}%，退服数为${row.btsOutNbr}，请及时关注。`;
suggestion = `该区县物资储备有${row.satellitePhones}台卫星电话，${row.mobileOilEngine}台油机，建议高风险乡镇至少配置1套卫星便携包，2-3台卫星电话，1台油机。`;
```

> 字段兼容说明：`getTableDataSource` 中使用 `row.bagNum ?? row.satellitePhones` 和 `row.oilEngineNum ?? row.mobileOilEngine` 做向后兼容，同时支持新旧 API 的字段名。

## 子模块交互说明

### 1. high-risk-town/index.tsx（打点详情）

#### 交互

1. **数量展示**：橙色背景（rgb(243, 102, 8)）44x38px 卡片，显示当前点位的高风险乡镇数量（`props.data?.count`）。
2. **点击展开**：点击数量卡片，如果 `count > 0`，手动调用 `getHighRiskTownMapDetailApi` 获取详情表格数据。
3. **表格弹窗**：通过 `overlayPointCtx.createPortal` 渲染 800px 宽度的详情表格弹窗，标题为"`{点位名称}退服预测详情`"。
4. **关闭弹窗**：弹窗右上角关闭按钮可收起表格。

#### 请求说明

**API**：`getHighRiskTownMapDetailApi`

| 项目         | 说明                                                 |
| ------------ | ---------------------------------------------------- |
| 触发时机     | 点击数量卡片且 `count > 0`                           |
| 请求参数     | `{ zoneName: string, zoneLevel: string }`            |
| 请求方式     | `ahooks useRequest`，`manual: true`                  |
| 响应数据处理 | 调用 `getTableDataSource(rows)` 转换为表格列和数据源 |

**参数说明**：

| 参数        | 来源                    | 说明         |
| ----------- | ----------------------- | ------------ |
| `zoneName`  | `props.data?.name`      | 点位名称     |
| `zoneLevel` | `props.data?.zoneLevel` | 点位区域级别 |

**后端接口**：

| 字段           | 值                        |
| -------------- | ------------------------- |
| `viewPageId`   | `guarantee-middle-page`   |
| `viewItemId`   | `high-risk-city-detail`   |
| `viewPageArgs` | `{ zoneName, zoneLevel }` |

**响应数据**（`rows` 每条记录）：

| 字段           | 类型               | 使用                                                   |
| -------------- | ------------------ | ------------------------------------------------------ |
| `id`           | `any`              | 表格 row key（`dataSource.key`）                       |
| `regionName`   | `string`           | 地市名称（支持 rowspan 合并）                          |
| `areaName`     | `string`           | 区县名称（支持 rowspan 合并）                          |
| `townName`     | `string`           | 乡镇名称                                               |
| `btsOutRate`   | `string \| number` | 用于 `riskDesc` 格式化                                 |
| `btsOutNbr`    | `string \| number` | 用于 `riskDesc` 格式化                                 |
| `bagNum`       | `string \| number` | 用于 `suggestion` 格式化（向后兼容 `satellitePhones`） |
| `oilEngineNum` | `string \| number` | 用于 `suggestion` 格式化（向后兼容 `mobileOilEngine`） |

### 2. InfoCard.tsx（省级统计卡片 + 退服趋势图）

#### 交互

1. **全局显示**：省级统计卡片固定定位在地图右上角（right: 60px, top: 30px），1200px 宽度，受高风险乡镇图例控制显示/隐藏。通过 `usePageStore` 读取 `state.center.attachmentRootGetter`，调用 `attachmentRootGetter()` 获取 Portal 挂载根节点。
2. **信息摘要**：展示截至时间（`forecastDataTime`）和全省高风险乡镇总数（rows 长度）。
3. **展开/收起**：点击标题栏的展开/收起按钮，切换展示明细表格和退服趋势图。
4. **行点击联动**：点击表格中的任意乡镇行，联动更新退服趋势图，选中行高亮。
5. **趋势图**：选中乡镇后自动请求 `getEmergencyRiskPredictionTrendChartApi` 绘制退服率趋势折线图，展示"实际退服率"（绿色）和"预测退服率"（青色）两条曲线。
6. **默认选中**：表格数据加载完成后默认选中第一行并自动请求趋势图。

#### 请求说明

**API 1：getEmergencyRiskTownshipsInfoApi**（替换自 `getHighRiskTownInfoCardApi`）

| 项目         | 说明                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| 触发时机     | 组件挂载，依赖 `dataTime` 就绪                                                                                 |
| 请求参数     | `{ dataTime?: string }`（可选）                                                                                |
| 响应数据处理 | 从 `res.rows` 取数据，调用 `getInfo(rows)` 提取摘要、`getTableDataSource(rows, true)` 转换表格，默认选中第一行 |
| 刷新机制     | 通过 `useSubscribe` 订阅 `sectionLeft:riskForward`，随左屏预警感知轮询联动刷新                                 |

**dataTime 来源**：

通过 `useSubscribe` 订阅左屏 `RiskForward` 组件通过 `dispatch` 推送的 `sectionLeft:riskForward` 数据（预警感知 rows 数组），取最后一条的 `forecastDataTime` 作为 `dataTime` 参数。

```typescript
const { leftSectionRiskForward } = useSubscribe({
    leftSectionRiskForward: widgetFields.getField("sectionLeft:riskForward"),
});
const dataTime = useMemo(() => {
    const list = leftSectionRiskForward ?? [];
    return list[list.length - 1]?.forecastDataTime ?? null;
}, [leftSectionRiskForward]);
```

**后端接口**：

| 字段           | 值                              |
| -------------- | ------------------------------- |
| `viewPageId`   | `guarantee-middle-page`         |
| `viewItemId`   | `emergency-risk-townships-info` |
| `viewPageArgs` | `{ dataTime }`                  |

**响应数据**：

```typescript
Promise<{ rows: any[]; columns: any[] }>;
```

- `rows`：从 `data.viewItemData.rows` 提取
- `columns`：合并 `data.viewItemData.header.dimFieldList` + `data.viewItemData.header.counterFieldList`

**rows 每条记录字段**：

| 字段                | 类型               | 使用                          |
| ------------------- | ------------------ | ----------------------------- |
| `id`                | `any`              | 表格 row key                  |
| `regionName`        | `string`           | 地市名称（支持 rowspan 合并） |
| `areaName`          | `string`           | 区县名称（支持 rowspan 合并） |
| `townName`          | `string`           | 乡镇名称                      |
| `btsOutRate`        | `string \| number` | 用于 `riskDesc` 格式化        |
| `btsOutNbr`         | `string \| number` | 用于 `riskDesc` 格式化        |
| `forecastDataTime`  | `string`           | 预报时间，用于摘要展示        |
| `satellitePackages` | `string \| number` | 卫星包数量（新字段）          |
| `satellitePhones`   | `string \| number` | 卫星电话数量（新字段）        |
| `mobileOilEngine`   | `string \| number` | 移动式油发电机数量（新字段）  |

**API 2：getEmergencyRiskPredictionTrendChartApi**

| 项目         | 说明                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 调用位置     | `high-risk-town/InfoCard.tsx`                                                  |
| 触发时机     | `showTable === true` 且 `selectedRow` 和 `infoContent.time` 不为空             |
| 请求参数     | `{ dataTime: string, regionName: string, cityName: string, townName: string }` |
| 请求方式     | `ahooks useRequest`，自动触发                                                  |
| 依赖追踪     | `refreshDeps: [showTable, selectedRow, infoContent.time]`                      |
| 响应数据处理 | 转换为 ECharts option 的 series 和 xAxis 数据                                  |

**参数说明**：

| 参数         | 来源                                                | 说明             |
| ------------ | --------------------------------------------------- | ---------------- |
| `dataTime`   | `infoContent.time`（即 `rows[0].forecastDataTime`） | 预测时间         |
| `regionName` | `selectedRow.regionName`                            | 选中行的地市名称 |
| `cityName`   | `selectedRow.areaName`                              | 选中行的区县名称 |
| `townName`   | `selectedRow.townName`                              | 选中行的乡镇名称 |

**后端接口**：

| 字段           | 值                                             |
| -------------- | ---------------------------------------------- |
| `viewPageId`   | `guarantee-middle-page`                        |
| `viewItemId`   | `emergency-risk-prediction-trend-chart`        |
| `viewPageArgs` | `{ dataTime, regionName, cityName, townName }` |

**响应数据结构**：

```typescript
{
    xData: string[];           // 时间轴（forecastTime）
    realRateData: Array<{
        value: number | null;  // 实际退服率（空字符串时为 null）
        raw: any;              // 原始 row
    }>;
    forecastRateData: Array<{
        value: number | null;  // 预测退服率（空字符串时为 null）
        raw: any;              // 原始 row
    }>;
}
```

**原始 rows 字段**：`forecastTime`（预报时间）、`forecastRate`（预测退服率）、`realRate`（实际退服率）。

**图表配置**：

- ECharts 折线图，两条系列：绿色实际退服率、青色预测退服率。
- 平滑曲线（`smooth: true`），显示所有数据点，hover 时显示强调样式。
- 时间轴格式化 `MM/DD HH:mm`，Y 轴最小间隔为 1。

**错误处理**：图表数据为空或请求中时，`option` 返回空对象，`DataStatus` 展示加载状态或空状态。

## 维护要点

- 图例控制使用 `showHighRiskTownLegendType`。
- 表格数据转换统一维护在 `getTableDataSource`。
- 如果调整省级统计卡片挂载位置，需要检查 `attachmentRootGetter`。
- 退服趋势图依赖 `dataTime`、`regionName`、`areaName/cityName`、`townName` 参数。
- 卡片展开高度设置为 630px，容纳表格（300px）和趋势图（285px）加间距。

## 已知问题与待办

### Bug：详情弹窗标题显示 `undefined`

**状态**：⚠️ 待修复

**位置**：`high-risk-town/index.tsx` L146（弹窗标题渲染处）

**现象**：点位详情表格弹窗标题显示为 `undefined退服预测详情`。

**根因**：代码使用了 `props.item?.name`，但父组件 `OverlayPoint` 实际传递的 prop 名是 `data`（即 `<HighRiskTown data={...} />`），从未传递 `item`。

**修复方案**：

```typescript
// 修改前
<span>{props.item?.name}退服预测详情</span>

// 修改后
<span>{props.data?.name}退服预测详情</span>
```

**注意**：`OverlayPoint` 调用 `<HighRiskTown data={props.highRiskTown ?? EmptyObject.Object} legendSelected={...} />`，点位 `name` 来源于父组件 `RiskPredictionPoints` 的 `point.name`（labelPoints 中的点位名称），而 API 返回的 `props.data.name` 才是当前打点对应的接口 `name` 字段，需要根据业务确认使用哪个值。

### API 替换计划：getHighRiskTownInfoCardApi → getEmergencyRiskTownshipsInfoApi

**状态**：✅ 已完成（2026-06-16）

**变更内容**：

1. **InfoCard.tsx**：
    - import 从 `getHighRiskTownInfoCardApi` 替换为 `getEmergencyRiskTownshipsInfoApi`
    - `onSuccess` 中从 `res.rows` 取数据
    - 新增 `useSubscribe` 订阅 `sectionLeft:riskForward` 获取 `dataTime`
    - 新增 `ready: isDefined(dataTime)` 和 `refreshDeps: [dataTime]`，与左屏预警感知轮询联动

2. **presets.tsx**（`getTableDataSource` 中）：
    - `row.bagNum` → `row.bagNum ?? row.satellitePhones`（向后兼容）
    - `row.oilEngineNum` → `row.oilEngineNum ?? row.mobileOilEngine`（向后兼容）

**dataTime 来源**：通过 `useSubscribe` 订阅左屏 `RiskForward` 组件推送的 `sectionLeft:riskForward` 数据，取最后一条的 `forecastDataTime`。

## 更新日志

| 版本  | 日期       | 变更说明                                                                                                                  |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1.5.0 | 2026-06-17 | 修正 InfoCard 宽度 800px → 1200px；补充 `props.item` → `props.data` 已知 bug；响应数据表增加 `id` 字段与 `bagNum/oilEngineNum` 兼容说明 |
| 1.4.0 | 2026-06-16 | API 替换完成：getHighRiskTownInfoCardApi → getEmergencyRiskTownshipsInfoApi，更新请求说明、响应字段、dataTime 来源文档    |
| 1.3.0 | 2026-06-16 | 增加"已知问题与待办"章节，记录 getHighRiskTownInfoCardApi 替换方案分析                                                    |
| 1.2.0 | 2026-06-09 | 主文档增加 Presets 总体说明；各子模块 reference 文档增加交互、请求、响应、presets 详细说明                                |
| 1.1.0 | 2026-06-09 | 增加 `references/` 目录，将 Weather、WeatherWarning、WaterWarning、HighRiskTown 四个业务组件拆分描述                   |
| 1.0.0 | 2026-05-19 | 初始版本，包含天气、气象预警、水情预警、高风险乡镇功能                                                                 |
