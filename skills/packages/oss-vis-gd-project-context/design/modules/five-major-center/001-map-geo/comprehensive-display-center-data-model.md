# comprehensive-display-center · map-geo 数据模型

> 源码：`web/pages/five-major-center/comprehensive-display-center/modules/center/map-view/map-geo/index.tsx`；接口层 `web/services/comprehensive-display-center/section-center.ts`，mock 位于 `public/static/mock/comprehensive-display-center/`。分类与 series 配置见 [comprehensive-display-center-presets.md](./comprehensive-display-center-presets.md)。

## 地图基础点位数据（index.tsx 主数据）

来源：`getGuangdongProvincePointsApi()`。

**注意：该函数不发请求**，直接由 `getMapConfig()`（`web/common/map-config`）中 `parent === 440000` 的地市配置派生；坐标取 `offsetCP ?? cp`，偏移连线开关取 `envComprehensiveDisplayCenter.centerGeoMapConfig.offsetCPLines`。

字段（数组元素）：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `zoneId` | string | 地市 id（对应 mapConfig.id） |
| `zoneName` | string | 地市名称 |
| `zoneLevel` | number | 行政级别（mapConfig.level） |
| `longitude` / `latitude` | number | 点位坐标（优先 offsetCP） |
| `offsetLines` | object \| null | 偏移连线（coords / lineStyle / symbol 等），offsetCP 存在且 show 开启时生成，否则 null |

## InfoCard 指标数据

来源：`getCenterMapDataApi({ viewItemId, indicatorGroup })`，`viewPageId: 'comprehensive-exhibition-center-middle-page'`，mock 为 `comprehensive-exhibition-center-middle-page-{viewItemId}.json`（现存 personal / home / network 三份）。

接口返回按 `zoneId` 分组，组元素字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `zoneId` / `zoneName` / `zoneLevel` | string / string / number | 地市信息 |
| `longitude` / `latitude` | number | 点位坐标（offsetCP ?? cp） |
| `offsetLines` | object \| null | 同上 |
| `children` | array | 明细项，含 `indicatorGroup` / `indicatorGroupName` / `indicatorId` / `indicatorName` / `indicatorValue` / `indicatorUnit` |

## InfoCard 趋势图数据

- `getPersonalBusinessLineChartDataApi({ regionName, viewItemId })`：viewItemId 支持 `showCenter-02`（用户数）/ `showCenter-07`（流量）/ `showCenter-12`（话务量），并行请求 MONTH/DAY 两次，返回 `{ month, day }`，每个为 `{ xData: string[], yData: [{ name, data: [{ value, raw }] }] }`；series 排序受 `envComprehensiveDisplayCenter.personalBusinessIndicatorSort` 控制。mock 为 `showCenter-page-{viewItemId}-{MONTH|DAY}.json`。
- `getFamilyBusinessLineChartDataApi({ regionName, businessType })`：viewItemId 固定 `showCenter-14`，按 `counter`（开户数/在线数）分组，返回 `{ xData, yData }`。mock 为 `showCenter-page-showCenter-14.json`。
