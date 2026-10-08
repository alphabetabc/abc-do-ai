# emap-gis · 工具集（emap.ts / hooks.ts）

## useEMapUtil（核心 hook）

在 `MapContext` 内调用 `EMapUtils` 的方法，自动注入 `map` / `EMap`（实例未就绪时 throw）：

```tsx
const addPoints = useEMapUtil('addPoints');
const { remove } = addPoints({ layerId: 'foo', points, getIcon: (p) => p.icon });
```

## EMapUtils 方法一览

| 方法 | 签名要点 | 说明 |
| --- | --- | --- |
| `initMap(container, {callback})` | 内部由 MapContext 调 | 建图（默认加 cityRange Vector 层）、挂 `window.__fedx_EMap__`、建 TaskScheduler |
| `createPopup` | `{getTipContainer, onMove?, onClick?, onDoubleClick?, onClickAway?}` | 悬浮 popup + singleclick/dblclick/pointermove 事件（hitTolerance 5） |
| `createToolbar` | `{type: ['aoi-place','district-search'], onAoiPlaceItemClick}` | aoi 搜索工具栏（ak/sk 签名） |
| `createDrawSelect` | `{callback({center, ...geojson})}` | 框选绘制（Polygon） |
| `addPoints` | `{layerId, points, getIcon, getPointItem?, isShowTitle?}` | 批量打点；point 需含 `id/longitude/latitude`（`name` 可选），rawData 挂 feature；返回 `{remove, layer}` |
| `addPoint` | `{layer, point, data?}` | 单点（复用已有 layer） |
| `addLayer` / `addPointLayer` | `{id}` | 建/取 Vector 图层，返回 `{layer, remove}` |
| `addWFSLayer` | `{layerCode, keyCode, layerId?, layerName?}` | WFS 行政区划；layerCode ∈ AOI/CITY/DISTRICT/TOWN/PROVINCE（内映射 layerCode 服务编码 + cql_filter 字段）；加载后自动 focusPosition |
| `addWKTFeature` | `{layer, id, wktString}` | WKT → BD09→WGS84 → feature |
| `setLayerStatus` | `{filter: string[]}` | 按 layerId 显隐控制（legend 切换用） |
| `clearLayer` / `clearAllLayer` | — | 清 feature |
| `setCenter` / `focusPositionPoint` / `focusPositionExtent` | `{center/extent/layerId, duration?}` | 视角控制（duration 默认 500ms） |
| `findFeatureByPoint` / `pickFeatureByPoint` / `pickFeatureByPointId` | `{point}` | 命中查找 |
| `updateSize` / `zoomToExtent` / `getScheduler` / `addDestroy` | — | 其他 |

## 独立导出

- `setTileFilterColor(map, filter)` / `refreshTileFilterLayer(map)`：底图滤镜重建
- `EMapFormatter`：`wktToGeoJson`、`getPolygonCenterAndExtent`、坐标系批量转换 BD09→WGS84
- `EMapGlobalRequest.getEMapDistrictJson({keyword})`：行政区 geojson；生产走 `window.EMapVisExpandHelpers`，本地走 mock（`STATIC_PATH`/mock-data/view-province）
