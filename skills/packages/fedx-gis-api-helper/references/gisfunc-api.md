# Imperative API (gisFunc) & Enums

For operations outside the React component tree (button clicks, timers, external triggers).

## Getting Map Instance

```typescript
import { getMap, getMainMap } from 'fedx-gis';

const map = getMap();         // OpenLayers Map instance
const mainMap = getMainMap(); // works with both OL and Baidu
```

## gisFunc Methods

### Layer Management

```typescript
gisFunc.createLayerById(layerId: string)
// Returns: OL VectorLayer (also adds to map)

gisFunc.getLayerById(map, layerId: string)
// Returns: OL Layer | undefined

gisFunc.getLayerSourceById(map, layerId: string)
// Returns: OL Source | undefined

gisFunc.clearAll(map)
// Clears all features from all layers

gisFunc.showLayer(map, layerStates: LayerState[])
// Toggles layer visibility
interface LayerState { neType: number | string; isShow: boolean; }
```

### Map Control

```typescript
gisFunc.setMapZoom(map, zoom: number)
gisFunc.setMapCenter(map, centerLonLat: [number, number])  // [longitude, latitude]
gisFunc.registerEvent(map, eventName: string, callback: (event) => void)
// eventName: 'singleclick', 'pointermove', 'dblclick', 'moveend', etc.

gisFunc.extendToolbars(map, nameArr: string[])
```

### Location

```typescript
gisFunc.setLocation(layer, coordinate: [number, number], imageUrl: string)
// Adds a location marker to the layer at [longitude, latitude]
```

### Popups

```typescript
gisFunc.createPopup(param: PopupParam)    // Returns: OL Overlay
gisFunc.removePopup(map, popup: Overlay)

interface PopupParam {
    containerName: string;       // DOM element id (REQUIRED)
    offset?: number[];           // [x, y], default [-80, -80]
    duration?: number;           // pan animation duration, default 250
    position?: string;           // default 'top-left'
}
```

### Animation

```typescript
gisFunc.initAnimation(map, tileLayer, layerSource, param: AnimationParam)

interface AnimationParam {
    duration?: number;     // ms, default 3000
    level?: number;        // alarm threshold, default 1
    radius?: number;       // max radius, default 25
    fillColor?: string;
    style?: any;
}
```

### Status Updates

**IMPORTANT: field names differ between the two methods!**

```typescript
// updateAlarmStatus — uses intId + level
gisFunc.updateAlarmStatus(map, alarmList: AlarmItem[], baseUrl: string, pointStyle?: any)
interface AlarmItem { intId: number | string; level: number; }

// updateStatus — uses siteCode + alarmLevel
gisFunc.updateStatus(map, source: StatusItem[], baseUrl: string, pointStyle?: any)
interface StatusItem { siteCode: number | string; alarmLevel: number; }

gisFunc.updatePointStyle(map, pointType: string, isShowTitle?: boolean, pointStyle?: any, baseUrl: string)
gisFunc.updateLineStyle(map, lineId: any, color: string)
```

---

## Usage Examples

```tsx
import { getMap, gisFunc } from 'fedx-gis';

// Set center and zoom
const onFocusLocation = () => {
    const map = getMap();
    gisFunc.setMapCenter(map, [116.11667, 37.91667]);
    gisFunc.setMapZoom(map, 8);
};

// Toggle layer visibility
const onToggleLayer = (neType, isShow) => {
    const map = getMap();
    gisFunc.showLayer(map, [{ neType, isShow }]);
};

// Clear all features
const onClearAll = () => {
    const map = getMap();
    gisFunc.clearAll(map);
};

// Register map click event
gisFunc.registerEvent(getMap(), 'singleclick', (event) => {
    console.log('clicked at', event.coordinate);
});

// Update alarm status — uses intId + level
gisFunc.updateAlarmStatus(getMap(), [
    { intId: 10001, level: 1 },  // siteCode 10001 -> alarm level 1 (red)
    { intId: 10002, level: 0 },  // siteCode 10002 -> alarm level 0 (green)
], '/images');

// Update resource status — uses siteCode + alarmLevel
gisFunc.updateStatus(getMap(), [
    { siteCode: 10001, alarmLevel: 2 },
    { siteCode: 10002, alarmLevel: 0 },
], '/images');

// Update line color
gisFunc.updateLineStyle(getMap(), lineId, '#FF0000');

// Create and remove popup
const popup = gisFunc.createPopup({
    containerName: 'myPopup',
    offset: [0, -40],
    duration: 250,
    position: 'top-center',
});
// ... later
gisFunc.removePopup(getMap(), popup);
```

---

## Enums

### imgType — Resource Types (icon folder `{0}`)

| id | key | name |
|----|-----|------|
| 201 | site2g | 2G基站 |
| 300 | cell2g | 2G小区 |
| 9201 | site3g | 3G基站 |
| 9300 | cell3g | 3G小区 |
| 8104 | site4g | 4G基站 |
| 8105 | cell4g | 4G小区 |
| 3201 | site5g | 5G基站 |
| 3300 | cell5g | 5G小区 |
| 2011 | olt | 退服基站 |
| 10020 | ECV | 应急通信车 |
| 10027 | emergGeneratorCar | 应急发电车 |
| 10029 | emergCrew | 应急保障人员 |
| 907 | Venue | 场馆 |
| 905 | scenicSpot | 景区 |
| 903 | highSpeed | 高速 |
| 901 | metro | 地铁 |
| 908 | airport | 机场 |
| 906 | hotel | 宾馆 |
| 10050 | circle | 圆点 |

### colorType — Alarm Levels (icon `{1}`)

| level | color | meaning |
|-------|-------|---------|
| 0 | #32CD32 | 正常 (green) |
| 1 | #FF0000 | 严重 (red) |
| 2 | #FFA500 | 重要 (orange) |
| 3 | #FFFF00 | 次要 (yellow) |
| 4 | #0000FF | 提示 (blue) |

Alarm level also supports Chinese strings: "较差"=1, "中等"=2, "良好"=3, "优良"=4
