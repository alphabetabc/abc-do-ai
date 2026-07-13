---
name: 'fedx-gis-api-helper'
description: 'Helps business developers use the fedx-gis npm package to build map features. Invoke when user asks to create maps, add layers, draw points/lines, heatmaps, clusters, measure tools, or any GIS functionality in a business project using fedx-gis.'
---

# fedx-gis API Helper

Helps business developers use the **fedx-gis** npm package to build map features in business projects. fedx-gis is a React-based GIS component library wrapping OpenLayers (2D), Baidu Maps (2D), and Cesium (3D).

## Installation

```bash
npm install fedx-gis --save
```

## Architecture

React Context + Imperative Map Instance:

1. `MapContainer` (or `Map`) creates the map engine and provides it via React Context
2. Child components (layers, controls) obtain the map via `useContext(MapContext)`
3. Layers/controls are declarative — `return null`, manage themselves in `useEffect`
4. For imperative operations outside React, use `getMap()` / `getMainMap()` + `gisFunc`

## Component Quick Reference

| Component                                                                                                                   | Category        | Purpose                                      |
| --------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------- |
| `MapContainer` / `Map`                                                                                                      | Container       | Map engine (OL / Baidu switchable)           |
| `WmtsTileLayer` / `XYZTileLayer` / `TileArcgisRestLayer` / `BaiDuTileLayer` / `GaodeLayer` / `BaseImageLayer` / `TileLayer` | Tile Layer      | Background map tiles                         |
| `GeoJsonLayer` / `OverlayLayer`                                                                                             | Data Layer      | GeoJSON boundaries / ArcGIS Image            |
| `VectorLayer`                                                                                                               | Business Layer  | Points, lines, circles from business data    |
| `ClusterLayer`                                                                                                              | Business Layer  | Clustered points for large datasets          |
| `HeatMapLayer`                                                                                                              | Data Layer      | Heatmap visualization                        |
| `RipplesLayer`                                                                                                              | Animation Layer | Ripple animation at points                   |
| `MoveLineLayer`                                                                                                             | Animation Layer | Migration line animation                     |
| `CircleView`                                                                                                                | UI Component    | Overlapping points circular display          |
| `Toolbar` / `DrawFeature` / `DrawSelect` / `MeasureControl` / `DrawClear` / `FullScreen`                                    | Control         | Drawing, selection, measurement tools        |
| `BaseLayer`                                                                                                                 | Business Layer  | Engine-agnostic layer (OL/Baidu auto-switch) |
| `getMap` / `getMainMap` / `gisFunc`                                                                                         | API             | Imperative map operations                    |

## Reference Documents

Read the relevant reference file based on what the user needs:

| User Request                                                                               | Reference File                |
| ------------------------------------------------------------------------------------------ | ----------------------------- |
| Map setup, MapContainer, Map, tile layers, Baidu Maps, base maps                           | `references/map-and-tiles.md` |
| VectorLayer, ClusterLayer, CircleView, business data format (points/lines/circles), popups | `references/vector-layer.md`  |
| HeatMapLayer, GeoJsonLayer, RipplesLayer, MoveLineLayer, OverlayLayer                      | `references/data-layers.md`   |
| Toolbar, DrawFeature, DrawSelect, MeasureControl, DrawClear, FullScreen                    | `references/controls.md`      |
| gisFunc API, getMap, layer management, status updates, enums (imgType, colorType)          | `references/gisfunc-api.md`   |

## Key Patterns & Gotchas

1. **Always wrap layers/controls inside `MapContainer` or `Map`** — they need the map context
2. **Use business data format** — `source` array with `neType`, `alarmLevel`, `longitude`, `latitude`. Don't construct OL Features manually
3. **Popups need DOM containers** — create `<div id="popupName">` elements and reference them by `containerName` in PopupParam
4. **Imperative operations** — use `getMap()` + `gisFunc` for operations triggered outside the component tree
5. **Icon paths** — `view.imageUrl` template: `{0}` = neType, `{1}` = alarmLevel (0-4)
6. **Field name differences**:
    - `updateAlarmStatus` uses `intId` + `level`
    - `updateStatus` uses `siteCode` + `alarmLevel`
    - RipplesLayer uses `lon: [lng, lat]` array (not `longitude`/`latitude`)
    - DrawFeature `drawType` is uppercase (`'POINT'`), MeasureControl `drawType` is lowercase (`'line'`)
7. **MoveLineLayer** — `from`/`to` must have `showImg: true` AND valid coordinates to render endpoint markers
8. **CircleView** — works with VectorLayer's `csFixedNum` (decimal precision) and `onShowCircle` callback
9. **ClusterLayer** — prefer `clusterZoom` over `distance` for controlling when clustering stops
10. **BaseLayer** — proxy component with same props as VectorLayer, auto-detects OL/Baidu engine

## Quick Start Template

```tsx
import React, { useState } from 'react';
import { MapContainer, WmtsTileLayer, VectorLayer, Toolbar, DrawFeature, MeasureControl, DrawClear, CircleView, FullScreen } from 'fedx-gis';

const pointSource = [
    {
        neType: 201,
        name: '2G基站',
        type: 'point',
        isShowTitle: true,
        points: [{ siteName: '基站1', alarmLevel: 1, neType: 201, siteCode: 10001, longitude: 118.104883, latitude: 32.840285 }],
    },
];

export default () => {
    const [circleVisible, setCircleVisible] = useState(false);
    const [circlePoints, setCirclePoints] = useState([]);

    return (
        <div style={{ width: '100%', height: 500 }}>
            <MapContainer
                view={{
                    projection: 'EPSG:4326',
                    center: [116.41667, 39.91667],
                    zoom: 5,
                    minZoom: 0,
                    maxZoom: 17,
                }}
                limitDblClick={true}
                onLoad={(map) => console.log('map loaded', map)}
            >
                {/* Base map */}
                <WmtsTileLayer source={{ url: 'http://xxx/wmts', layer: 'base' }} zIndex={0} />

                {/* Business points */}
                <VectorLayer
                    id="pointLayer"
                    source={pointSource}
                    pointStyleType="IMG"
                    isShowTitle={true}
                    singlPopupParam={{ containerName: 'popup', offset: [-1, -1], duration: 0, position: 'top-right' }}
                    onClick={(point) => console.log('clicked', point)}
                    onShowCircle={(points) => {
                        setCirclePoints(points);
                        setCircleVisible(true);
                    }}
                />

                {/* Fullscreen */}
                <FullScreen />

                {/* Toolbar */}
                <Toolbar alignment="vertical" style={{ top: 35 }}>
                    <DrawFeature title="绘制点" drawType="POINT" />
                    <MeasureControl title="测距" drawType="line" />
                    <MeasureControl title="测面" drawType="polygon" />
                    <DrawClear title="清除" />
                </Toolbar>

                {/* Popup DOM container — MUST exist */}
                <div id="popup">
                    <span>Popup content</span>
                </div>

                {/* Overlapping points */}
                <CircleView visible={circleVisible} source={circlePoints} onClick={(p) => console.log(p)} />
            </MapContainer>
        </div>
    );
};
```
