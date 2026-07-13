# HeatMapLayer, GeoJsonLayer, RipplesLayer, MoveLineLayer, OverlayLayer

## HeatMapLayer

```typescript
interface HeatmapLayerProps {
    id: string;
    zIndex?: number;
    source: {
        data: {
            type: 'FeatureCollection';
            features: Array<{
                type: 'Feature';
                properties: Record<string, any>;    // e.g. { flow: 112.5 }
                geometry: {
                    type: 'Point';
                    coordinates: [number, number];   // [longitude, latitude]
                };
            }>;
        };
    };
    gradient?: string[];     // color array
    radius?: number;         // heatmap radius
    blur?: number;           // blur size
}
```

```tsx
import { HeatMapLayer } from 'fedx-gis';

<HeatMapLayer
    id="heatMapLayer"
    zIndex={998}
    source={{
        data: {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { flow: 112.5 },
                  geometry: { type: 'Point', coordinates: [116.204883, 31.840285] } },
                { type: 'Feature', properties: { flow: 85.3 },
                  geometry: { type: 'Point', coordinates: [117.204883, 32.840285] } },
            ],
        },
    }}
    gradient={['#00f', '#00f', '#00f', '#00f', '#f00']}
    radius={35}
    blur={15}
/>
```

---

## GeoJsonLayer

```typescript
interface GeoJsonOptions {
    source?: {
        url: string;                // GeoJSON file URL
        style?: {
            stroke?: { color: string; width: number };  // default { color: 'gray', width: 1 }
            fill?: { color: string };                    // default { color: 'white' }
        };
    };
}
```

```tsx
import { GeoJsonLayer } from 'fedx-gis';

<GeoJsonLayer
    source={{
        url: '/data/map/boundary.json',
        style: {
            stroke: { color: 'gray', width: 2 },
            fill: { color: 'rgba(0,0,0,0)' },
        },
    }}
/>
```

---

## RipplesLayer (Ripple Animation)

**IMPORTANT**: Uses `lon: [lng, lat]` array format, NOT `longitude`/`latitude` separate fields like other layers.

```typescript
interface RipplesLayerProps {
    id?: string;                       // default 'chartLayer'
    source?: RipplesPoint[];
    PointStyle?: {
        scale: number;                 // point size = value / scale, default 20
        color: number[];               // RGB array, e.g. [78, 238, 148]
    };
    popupParam?: PopupParam;           // see vector-layer.md for PopupParam
    onMove?: (point: RipplesPoint) => void;
    onMoveEnd?: (zoomLevel: number) => void;
}

interface RipplesPoint {
    name: string;                      // point name
    value: number;                     // value (size = value / scale)
    lon: [number, number];             // [longitude, latitude] — NOTE: uses 'lon' not 'longitude'!
}
```

```tsx
import { RipplesLayer } from 'fedx-gis';

const ripplesSource = [
    { name: '合肥', value: 29, lon: [117.283042, 31.86119] },
    { name: '武汉', value: 173, lon: [114.298572, 30.584355] },
    { name: '大庆', value: 279, lon: [125.11272, 46.590734] },
];

<RipplesLayer
    id="chartLayer"
    source={ripplesSource}
    PointStyle={{ scale: 30, color: [78, 238, 148] }}
    popupParam={{ containerName: 'ripplesPopup', offset: [-1, -1], duration: 250, position: 'top-right' }}
    onMove={(point) => console.log(point)}
/>
```

---

## MoveLineLayer (Migration Line Animation)

**IMPORTANT**: `from`/`to` objects must have `showImg: true` AND valid longitude/latitude for points to render.

```typescript
interface MoveLineLayerProps {
    id?: string;                       // default 'moveLineLayer'
    source?: MoveLineItem[];
    zIndex?: number;
    visible?: boolean;
    LineStyle?: {
        markerRadius?: number;         // endpoint marker radius
        markerColor?: string;          // endpoint marker color (null = use line color)
        lineType?: string;             // 'solid' | 'dashed' | 'dotted'
        lineWidth?: number;            // line width
        colors?: string[];             // line colors array (per line)
        moveRadius?: number;           // moving dot radius
        fillColor?: string;            // moving dot color
        shadowColor?: string;          // moving dot shadow color
        shadowBlur?: number;           // shadow blur size
        fontColor?: string;            // title font color
        fontBackColor?: string;        // title background
        offset?: [number, number];     // title offset [x, y]
        isShowAnimation?: boolean;     // show animation
    };
}

interface MoveLineItem {
    from: MoveLineEndpoint;            // origin
    to: MoveLineEndpoint;              // destination
}

interface MoveLineEndpoint {
    siteName: string;
    alarmLevel: number;
    neType: number;
    siteCode: number | string;
    longitude: number;
    latitude: number;
    showTitle?: boolean;               // show label
    showImg?: boolean;                 // show icon (MUST be true to render point)
    city?: string;
}
```

```tsx
import { MoveLineLayer } from 'fedx-gis';

const moveLineSource = [
    {
        from: {
            siteName: '西安', alarmLevel: 0, neType: 10043, siteCode: '10005',
            longitude: 108.95, latitude: 34.26667,
            showTitle: true, showImg: true,
        },
        to: {
            siteName: '北京', alarmLevel: 0, neType: 10043, siteCode: '10005',
            longitude: 116.231734, latitude: 39.542784,
            showTitle: true, showImg: true,
        },
    },
];

<MoveLineLayer
    id="MoveLineLayer"
    source={moveLineSource}
    zIndex={1}
    visible={true}
    LineStyle={{
        markerRadius: 2,
        lineType: 'dashed',
        lineWidth: 2,
        colors: ['#F9815C', '#F8AB60', '#EDCC72', '#E2F194', '#94E08A', '#4ECDA5'],
        moveRadius: 3,
        fillColor: '#fff',
        shadowColor: '#fff',
        shadowBlur: 6,
        offset: [8, 0],
        fontColor: 'black',
        fontBackColor: 'lightBlue',
        isShowAnimation: true,
    }}
/>
```

---

## OverlayLayer (ArcGIS Image)

```typescript
interface OverlayLayerProps {
    source: {
        token?: string;                // ArcGIS REST auth token
        url: string;                   // ArcGIS REST service URL
    };
    eventHandlers?: Record<string, (event: any) => void>;
    // Also accepts standard OL BaseTileOptions: opacity, zIndex, extent, etc.
}
```

```tsx
import { OverlayLayer } from 'fedx-gis';

<OverlayLayer
    source={{
        url: 'http://arcgis/rest/services/layer/MapServer',
        token: 'xxx',
    }}
/>
```
