# cmd-dispatcher-center · map-geo 交互

> 源码：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/map-view/map-geo/index.tsx` 与 `Points*.tsx`。
> **此份未接线**：该中心 map-view 实际使用 `map-gis/`，不引用 map-geo。以下仅描述代码现状。

## 区域点击

`onMapClick`：仅把点击区域的 `{ zoneId, zoneName, zoneLevel }` 通过 `props.onRegionChange` 上抛，**无弹窗、无 geoSelect 逻辑**。

## Legend 分组切换

`legendGroupTypes` tab 切换：`setState({ legendGroup })` 条件渲染三个子组件：

- `PointsGuaranteeTask`（保障任务）
- `PointsNetworkDevice`（网络设备）
- `PointsEmergencyResource`（应急物资）

各子组件独立请求（见 [cmd-dispatcher-center-data-model.md](./cmd-dispatcher-center-data-model.md)）并渲染 OverlayItem 点位（图钉 + 分类色块计数 + 地名）。

## 点位表现

- 点位子组件 `loading` 时 return null。
- children 中分类值未命中 legendCategories 的项被过滤。
