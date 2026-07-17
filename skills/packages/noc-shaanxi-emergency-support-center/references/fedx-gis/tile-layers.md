# TileArcgisRestLayer / XYZTileLayer

地图底图层。实际只用到这俩，根据 `emergencySupportGisConfig.type` 二选一。

- 类型：[TileArcgisRestLayer.d.ts](node_modules/fedx-gis/dist/components/layers/TileArcgisRestLayer.d.ts)
- 类型：[XYZTileLayer.d.ts](node_modules/fedx-gis/dist/components/layers/XYZTileLayer.d.ts)

## 选择规则

```tsx
{emergencySupportGisConfig.type === 'TileArcgisRestLayer' && (
    <TileArcgisRestLayer id="arcgisRestLayer1" source={{ params, url }} />
)}
{emergencySupportGisConfig.type === 'XYZTileLayer' && (
    <XYZTileLayer id="xyzLayer1" source={{ params, tileGrid, projection, url }} />
)}
```

## TileArcgisRestLayer

```ts
type TileArcgisRestLayerOptions = Omit<BaseTileOptions, 'source'> & {
    source: TileArcGISRestOptions;
};
```

### 中屏典型用法

```tsx
<TileArcgisRestLayer
    id="arcgisRestLayer1"
    source={{
        params: { ...emergencySupportGisConfig.tileArcgisRestLayerParams },
        url: emergencySupportGisConfig.arcgisRestLayerUrl,
    }}
/>
```

### props 说明

- `id`: 唯一 id
- `source.params`: 透传给 ArcGIS REST tile 接口的查询参数（`{ L, FORMAT, etc. }`）
- `source.url`: ArcGIS REST 服务 URL，例如 `https://server/arcgis/rest/services/xxx/MapServer`

## XYZTileLayer

```ts
type XYZTileLayerOptions = Omit<BaseTileOptions, 'source'>;
// 但我们的 source 有这些额外字段
```

### 中屏典型用法

```tsx
<XYZTileLayer
    id="xyzLayer1"
    source={{
        params: { ...emergencySupportGisConfig.tileArcgisRestLayerParams },
        tileGrid: emergencySupportGisConfig.tileGrid ? { ...emergencySupportGisConfig.tileGrid } : '',
        projection: emergencySupportGisConfig.projection || 'EPSG:4326',
        url: emergencySupportGisConfig.arcgisRestLayerUrl,
    }}
/>
```

### props 说明

- `id`: 唯一 id
- `source.params`: 同上
- `source.tileGrid`: 瓦片网格配置；空字符串或对象，对应 OL `tileGrid`
- `source.projection`: 坐标系
- `source.url`: XYZ tile URL 模板（`{z}/{x}/{y}.png`），或 `{0}/{1}` 占位（取决于服务）

## 易踩坑

- 类型二选一由 `emergencySupportGisConfig.type` 决定，不要写死。**配置变更时同步检查 MapContainer.view.imageUrl**
- `id="arcgisRestLayer1"` / `id="xyzLayer1"` 在 tab1 / tab2 都用同一 id（因为不会同时可见），**不能改**，否则会和 `gisFunc.getLayerById` 冲突
- 这两个图层是 OL `BaseTileLayer` 子类，需要 `MapContainer.view.imageUrl` 配合（参考 [map-container.md](map-container.md)）
- 修改 `params` 时注意 `...emergencySupportGisConfig.tileArcgisRestLayerParams` 展开——配置改名会同步崩溃

> 版本：v1.0 · 创建日期：2026-07-13
