# Map Containers & Tile Layers

## Map Containers

| Component | Engine | Use Case |
|-----------|--------|----------|
| `MapContainer` | OpenLayers | Direct OL usage with full control |
| `Map` | OL / Baidu (switchable) | Engine-agnostic via `mapType` prop; use `BaseLayer` for Baidu |

### MapOptions

```typescript
interface MapOptions {
    id?: string;
    mapType?: string;        // 'baidu' = Baidu Maps, omit/other = OpenLayers
    view: ViewOptions;       // { projection, center, zoom, minZoom, maxZoom, imageUrl }
    height?: string | number;  // default '100%'
    width?: string | number;   // default '100%'
    style?: CSSProperties;
    children?: any;
    showRoom?: boolean;      // show zoom buttons
    showRotate?: boolean;    // show rotate buttons
    interactions?: object;   // e.g. { doubleClickZoom: false }
    limitDblClick?: boolean; // disable double-click zoom (MapContainer only)
    ak?: string;             // Baidu Maps API key (Baidu only)
    onLoad?: (map) => void;  // map ready callback, receives map instance
}
```

**view.imageUrl** — Template for point icons: `${IMAGE_PATH}/map/{0}/{1}.png`
- `{0}` = `neType` (resource type, see imgType enum in gisfunc-api.md)
- `{1}` = `alarmLevel` (0-4, see colorType enum in gisfunc-api.md)

### Usage

```tsx
import { MapContainer } from 'fedx-gis';

<MapContainer
    view={{
        projection: 'EPSG:4326',
        center: [116.41667, 39.91667],
        zoom: 5,
        minZoom: 0,
        maxZoom: 17,
    }}
    limitDblClick={true}
    onLoad={(map) => console.log('map ready', map)}
>
    {/* layers and controls as children */}
</MapContainer>
```

### Baidu Maps

```tsx
import { Map, BaseLayer } from 'fedx-gis';

<Map mapType="baidu" ak="your-baidu-ak"
    view={{ center: [116.41667, 39.91667], zoom: 5, minZoom: 0, maxZoom: 17 }}
    onLoad={(map) => console.log('map ready', map)}
>
    <BaseLayer source={pointSource} pointStyleType="IMG" onClick={(e) => console.log(e)} />
</Map>
```

`BaseLayer` is a proxy component — same props as `VectorLayer`, auto-detects engine and renders `BLayer` (Baidu) or `VectorLayer` (OL).

---

## Tile Layers (Background Maps)

| Component | source Format | Description |
|-----------|---------------|-------------|
| `TileLayer` | OL source object | Base tile layer, defaults to OSM |
| `WmtsTileLayer` | `{ url, layer, projection?, tileGrid? }` | WMTS service tiles |
| `XYZTileLayer` | `{ url, ... }` | XYZ tile format (OSM, Google, etc.) |
| `TileArcgisRestLayer` | `{ url, ... }` | ArcGIS REST tiles |
| `BaiDuTileLayer` | source object | Baidu tile layer (within OL) |
| `GaodeLayer` | source object | Gaode (AMap) tiles |
| `BaseImageLayer` | source object | Static image layer |
| `OverlayLayer` | `{ url, token? }` | ArcGIS Image layer |

### Examples

```tsx
import { WmtsTileLayer, GeoJsonLayer, OverlayLayer } from 'fedx-gis';

<WmtsTileLayer
    source={{
        url: 'http://xxx/wmts?access_token=xxx',
        layer: 'bigemap.google-earth',
    }}
    opacity={1}
    zIndex={0}
/>

<GeoJsonLayer
    source={{
        url: '/data/map/boundary.json',
        style: {
            stroke: { color: 'gray', width: 2 },
            fill: { color: 'rgba(0,0,0,0)' },
        },
    }}
/>

<OverlayLayer source={{ url: 'http://arcgis/rest/services/layer/MapServer', token: 'xxx' }} />
```
