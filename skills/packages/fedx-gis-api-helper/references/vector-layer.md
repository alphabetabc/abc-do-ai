# VectorLayer, ClusterLayer & CircleView

## VectorLayer — Core Business Layer

Renders points, lines, circles from business data. The most important component for business development.

### VectorLayerProps

```typescript
interface VectorLayerProps {
    id?: string;
    zIndex?: number;
    pointStyleType?: 'IMG' | 'POINT';      // icon or dot style, default 'IMG'
    pointStyle?: PointStyle;
    source?: VectorLayerSource[];           // business data (see format below)
    // Events
    onClick?: (point: PointData) => void;
    onRightClick?: (point: PointData) => void;
    onDoubleClick?: (point: PointData) => void;
    onMove?: (point: PointData) => void;         // mouse hover
    onMoveEnd?: (zoom: number) => void;           // zoom end
    onShowCircle?: (points: PointData[]) => void; // overlapping points detected
    onClickOther?: (type: string) => void;        // clicked empty area
    onSetLocation?: (centerX: number, centerY: number, zoom: number) => void;
    // Display
    isShowTitle?: boolean;                 // show point labels
    isShowSelStatus?: boolean;             // show selected state
    isShowSamePoint?: boolean;             // show overlapping points directly (no bubble)
    isShowAnimation?: boolean;             // enable ripple animation
    isGongZhanByType?: boolean;            // show co-site icon by neType
    isHideLineTip?: boolean;               // hide line tooltip
    isShowInCommon?: boolean;              // render everything in one layer
    misplacement?: number;                 // offset distance for overlapping points (e.g. 0.001)
    csFixedNum?: number;                   // decimal precision for overlap detection
    // Animation
    AnimationParam?: {
        duration?: number;                 // ms, default 3000
        radius?: number;                   // max radius, default 25
        level?: number;                    // alarm threshold, default 1
        fillColor?: string;
        style?: any;                       // OL Style override
    };
    // Popups
    singlPopupParam?: PopupParam;          // click popup config
    popupParam?: PopupParam;               // hover tooltip config
    singlePopupVisible?: boolean;
    // Interaction
    isSetLocation?: boolean;               // enable click-to-locate on map
    isDrawing?: boolean;
    // Mass data
    isMassData?: boolean;                  // enable mass data rendering
    massPointStyle?: {
        symbolType: 'circle';
        size: number;
        color: string;
    };
}
```

### PointStyle

```typescript
interface PointStyle {
    fontSize?: number;           // default 14
    fontWeight?: string;         // default 'normal'
    fontFamily?: string;         // default '微软雅黑'
    offset?: [number, number];   // [x, y] title offset
    fontColor?: string;          // default 'white'
    fontBackColor?: string;      // title background
    scale?: number;              // icon scale
    lineDash?: number[];
    textAlign?: string;
}
```

### PopupParam

```typescript
interface PopupParam {
    containerName: string;       // DOM element id for popup content (REQUIRED)
    offset?: number[];           // [x, y] offset, default [-80, -80]
    duration?: number;           // pan animation duration when popup overflows, default 250
    position?: string;           // 'bottom-left' | 'bottom-center' | 'bottom-right'
                                 // | 'center-left' | 'center-center' | 'center-right'
                                 // | 'top-left' | 'top-center' | 'top-right'
                                 // default 'top-left'
}
```

### source Data Format (CRITICAL)

`source` is an array where each element represents a layer group. The `type` field determines the data structure:

```typescript
type VectorLayerSource = PointLayer | LineLayer | CircleLayer;

// --- Point Layer ---
interface PointLayer {
    neType: number;              // resource type (icon folder {0}), e.g. 201
    name: string;                // layer name
    type: 'point';
    isShowTitle?: boolean;
    isShowAnimation?: boolean;
    points: PointData[];
}

interface PointData {
    siteName: string;            // point name (for label)
    alarmLevel: number;          // 0=green, 1=red, 2=orange, 3=yellow, 4=blue
    neType: number;              // resource type
    siteCode: number | string;   // unique id
    longitude: number;           // longitude
    latitude: number;            // latitude
    region?: string;             // region name
    district?: string;           // district name
    isShowTitle?: boolean;       // per-point label visibility
    scale?: number;              // icon scale override
    isShowAnimation?: boolean;   // per-point animation
    speed?: number;              // animation rotation speed (ms), default 100
    imgPath?: string;            // custom icon path (overrides default)
    imgSize?: [number, number];
    imgOffset?: [number, number];
    titleOffset?: [number, number];
    // Rose chart (wind rose) fields — when isRoseCircle=true
    isRoseCircle?: boolean;
    radius7Quad?: { ne: number; se: number; sw: number; nw: number };
    rose7FillColor?: string;
    radius10Quad?: { ne: number; se: number; sw: number; nw: number };
    rose10FillColor?: string;
    radius12Quad?: { ne: number; se: number; sw: number; nw: number };
    rose12FillColor?: string;
}

// --- Line Layer ---
interface LineLayer {
    neType: number;
    id?: number;                 // line id (for updateLineStyle)
    name: string;                // line name
    type: 'line';
    style: LineStyle;
    points: PointData[];         // stations along the line (ordered)
}

interface LineStyle {
    color: string;               // line color, e.g. '#2EA0F7'
    width: number;               // line width, e.g. 4
    lineDash?: number[];         // dash pattern
    showTitle?: boolean;         // show line title
    showImg?: boolean;           // show start/end point icons
    showDire?: boolean;          // show direction arrows
    offset?: [number, number];   // title offset
    fontColor?: string;          // default 'white'
    fontBackColor?: string;      // title background
    fontSize?: number;           // default 14
    fontFamily?: string;         // default '微软雅黑'
    fontWeight?: string;         // default 'normal'
    imgSize?: [number, number];
    imgOffset?: [number, number];
}

// --- Circle Layer ---
interface CircleLayer {
    neType: number;
    name: string;
    type: 'circle';
    points: CircleData[];
}

interface CircleData {
    center: [number, number];    // [longitude, latitude]
    radius: number;              // radius in meters, default 1000
    name?: string;               // circle label
    fill?: string;               // fill color, default 'rgba(255, 255, 255, 1)'
    stroke?: string;             // border color, default 'green'
    width?: number;              // border width, default 2
    lineDash?: number[];
    fontSize?: number;           // label font size, default 12
}
```

### Usage Example

```tsx
import { VectorLayer } from 'fedx-gis';

const pointSource = [
    // Points
    {
        neType: 201, name: '2G基站', type: 'point', isShowTitle: true,
        points: [
            { siteName: '基站1', alarmLevel: 1, neType: 201, siteCode: 10001,
              longitude: 118.104883, latitude: 32.840285, region: '西山分局' },
            { siteName: '基站2', alarmLevel: 0, neType: 201, siteCode: 10002,
              longitude: 119.104883, latitude: 33.840285 },
        ],
    },
    // Line
    {
        neType: 10043, id: 1, name: '地铁1号线', type: 'line',
        style: { color: '#2EA0F7', width: 4, showImg: true, showDire: true },
        points: [
            { siteName: '站A', alarmLevel: 0, neType: 10043, siteCode: 1,
              longitude: 118.104883, latitude: 32.840285 },
            { siteName: '站B', alarmLevel: 0, neType: 10043, siteCode: 2,
              longitude: 108.8382, latitude: 34.3322 },
        ],
    },
    // Circle
    {
        neType: 907, name: '场馆覆盖', type: 'circle',
        points: [
            { center: [118.504883, 32.840285], radius: 10000,
              fill: 'rgba(255, 0, 0, 0.3)', stroke: 'blue', width: 2 },
        ],
    },
];

<VectorLayer
    id="pointLayer"
    source={pointSource}
    pointStyleType="IMG"
    isShowTitle={true}
    isShowSelStatus={true}
    singlPopupParam={{ containerName: 'popup', offset: [-1, -1], duration: 0, position: 'top-right' }}
    popupParam={{ containerName: 'tooltip', offset: [-1, -1], duration: 0, position: 'top-right' }}
    onClick={(point) => console.log('clicked', point)}
    onMove={(point) => console.log('hover', point)}
    onShowCircle={(points) => { setCirclePoints(points); setCircleVisible(true); }}
/>

{/* Popup DOM containers — MUST exist in the DOM */}
<div id="popup"><span>Click popup content</span></div>
<div id="tooltip"><span>Hover tooltip content</span></div>
```

---

## ClusterLayer

Same props as VectorLayer, plus clustering:

```typescript
interface ClusterLayerProps extends VectorLayerProps {
    distance?: number;      // cluster distance in pixels
    clusterZoom?: number;   // don't cluster above this zoom level (preferred over distance)
}
```

```tsx
import { ClusterLayer } from 'fedx-gis';

<ClusterLayer
    id="clusterLayer"
    source={pointSource}
    clusterZoom={8}
    pointStyleType="IMG"
    isShowTitle={true}
    onClick={(point) => console.log(point)}
/>
```

---

## CircleView (Overlapping Points Display)

Displays overlapping points in a circular layout. Works with VectorLayer's `csFixedNum` and `onShowCircle` callback.

```typescript
interface CircleViewProps {
    visible?: boolean;
    source?: PointData[];              // overlapping points array
    toolPupWindowId?: string;          // popup DOM container id
    overlayClassName?: string;
    overlayStyle?: object;
    tooltipProperty?: object;
    onMouseMove?: (point: PointData) => void;
    onClick?: (point: PointData) => void;
}
```

```tsx
import { VectorLayer, CircleView } from 'fedx-gis';

<VectorLayer
    source={pointSource}
    csFixedNum={4}                     // 4 decimal places for overlap detection
    onShowCircle={(points) => {
        setCirclePoints(points);
        setCircleVisible(true);
    }}
/>
<CircleView
    visible={circleVisible}
    source={circlePoints}
    toolPupWindowId="circlePopup"
    onClick={(point) => console.log(point)}
/>
<div id="circlePopup"><span>Circle popup content</span></div>
```
