# information-hub-center · map-geo presets

> 源码：`web/pages/five-major-center/information-hub-center/modules/center/map-view/map-geo/presets.tsx`（含 JSX Icon，故为 .tsx）

## legendCategories

枚举 `LegendCategoryEnum`：`network-incident` / `hazard-identification` / `complaint-response` / `device-operation` / `machine-room-safe`。

结构：`[{ label, value, children: [{ label, value, Icon: 组件 }] }]`，通过 `getCacheValue('info-hub-center-map-legend-categories', ...)` 缓存。

枚举值即数据请求的 `viewItemUnitId` 参数（见 [information-hub-center-data-model.md](./information-hub-center-data-model.md)）。

## infoCardTemplate

`mapDefaults.infoCardTemplate`：优先取 `envInformationHubCenter.center.infoCardTemplate`（环境配置），否则用 `getCacheValue` 缓存的内置模板。按 viewItemUnitId 配置弹窗展示行：`[{ title?, list: [{ name, nameField, valueField, unitField }] }]`，`nameField` 在 `traffType`（事件/投诉/隐患类）与 `kpiName`（设备/机房类）间切换。渲染逻辑见 [information-hub-center-interactions.md](./information-hub-center-interactions.md)。

## geoBuilder

四层 geo（描边层 / 底色层 / 粗边层 / 可交互层）：

- 可交互层 `selectedMode: true`，选中色 `rgba(21,135,196,1)`，label 字号 13.5
- 底色 `rgba(41,50,57,1)`

## seriesBuilder

- 对 mapConfig 中每个地市生成 scatter 隐形点位，命中数据时按 `items` 里的 `traffType` + `kpiValue > 0` 选图标（事件/隐患分级），原始数据挂在 `__rawData`（注意：此中心字段名无尾下划线，与 comprehensive 的 `__rawData__` 不同）
- `dataSource.size === 0` 时点位透明（opacity 0）仅显示地名 label（position 切为 center）
