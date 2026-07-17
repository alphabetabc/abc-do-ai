# fedx-gis 使用到的能力（中屏 GIS）

> 我们只用 `fedx-gis/dist/gis-2d` 导出的部分 API；其它（HeatmapLayer、ClusterLayer、GeoJsonLayer、FullScreen、DrawFeature、Toolbar、GaodeLayer、MeasureControl、RipplesLayer、MoveLineLayer、Map、BaseImageLayer、BaseLayer、MapContext 等）当前**不需要关心**。

- 入口：[gis-2d.d.ts](node_modules/fedx-gis/dist/gis-2d.d.ts)
- 包版本：见 [`package.json`](node_modules/fedx-gis/package.json)

## 用到的导入

```ts
import {
    MapContainer,
    TileArcgisRestLayer,
    VectorLayer,
    getMap,
    gisFunc,
    CircleView,
    XYZTileLayer,
} from 'fedx-gis/dist/gis-2d';
import 'fedx-gis/dist/gis-2d.css';
```

## 文档拆分

- [map-container.md](map-container.md) — `MapContainer` / `getMap`
- [vector-layer.md](vector-layer.md) — `VectorLayer` props 详解
- [tile-layers.md](tile-layers.md) — `TileArcgisRestLayer` / `XYZTileLayer`（地图底图）
- [circle-view.md](circle-view.md) — `CircleView` 圆圈 Tooltip
- [gis-func.md](gis-func.md) — `gisFunc` 工具集 + 我们怎么用 `setMapCenter / setMapZoom / showLayer / createPopup`

## 易踩坑

- `MapContainer` 自身持有 OL Map 实例；同一页面挂多个 MapContainer 会冲突——日常保障（`emergency-gis-map1`）和突发保障（`emergency-gis-map2`）用 `id` 区分（`MapContainer` 不强制要求 id，但**不能同时挂载两份可见 MapContainer**，否则 `getMap()` 取到的不一定是预期的）
- 不要在 `MapContainer` 外层使用 `display: none`；用 `visibility: collapse` 或把整段父组件 unmount
- fedx-gis 是 OpenLayers 5 包装，`view` 参数透传给 OL `View`；projection `'EPSG:4326'`（默认）或自定义
- 修改 fedx-gis 版本前**优先在本 skill 改文档**，不要直接改业务代码

> 版本：v1.0 · 创建日期：2026-07-13
