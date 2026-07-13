# Controls & Toolbar

## Toolbar

Container for tool buttons (DrawFeature, DrawSelect, MeasureControl, DrawClear, etc.)

```typescript
interface ToolbarProps {
    id?: string;                       // default 'toolBars'
    className?: string;
    alignment: 'horizontal' | 'vertical';
    style?: object;                    // e.g. { top: 35 }
}
```

---

## DrawFeature (Drawing Tool)

```typescript
interface DrawFeatureProps {
    title?: string;                    // tool name, default '绘制点'
    iconType?: string;                 // Ant Design icon name
    src?: string;                      // custom icon URL
    style?: CSSProperties;
    drawType?: 'POINT' | 'CIRCLE' | 'LINE' | 'POLYGON';  // default 'POINT' — UPPERCASE
    fillColor?: string;                // default '#1890ff55'
    strokeColor?: string;              // default '#1890ff'
    drawstart?: () => void;
    drawend?: (isDrawing: boolean, polygon: any) => void;
    isSingleDrawing?: boolean;         // draw once then deactivate
}
```

---

## DrawSelect (Selection Tool)

Selects points within a drawn shape (circle or polygon).

```typescript
interface DrawSelectProps {
    title?: string;                    // default '多边形框选'
    iconType?: string;                 // default 'iconfuzhi'
    src?: string;
    style?: CSSProperties;
    digitalLayerName?: string;         // default 'fedx-gis-select'
    drawType?: 'CIRCLE' | 'POLYGON';   // default 'POLYGON' — UPPERCASE
    fillColor?: string;                // default '#1890ff55'
    strokeColor?: string;              // default '#1890ff'
    eventHandlers?: (points: PointData[], drawPol: DrawPolResult) => void;
}

interface DrawPolResult {
    geometry: any;                     // OL geometry object
    center?: [number, number];         // circle center (CIRCLE only)
    drawType: string;                  // 'Circle' or 'Polygon'
    radius?: number;                   // circle radius (CIRCLE only)
}
```

`eventHandlers` callback receives:
- `points`: array of PointData (see vector-layer.md) that fall within the selection
- `drawPol`: geometry info of the drawn shape

---

## MeasureControl (Measurement Tool)

**NOTE**: `drawType` is **lowercase** here, unlike DrawFeature which uses uppercase.

```typescript
interface MeasureControlProps {
    title?: string;
    iconType?: string;
    src?: string;
    style?: CSSProperties;
    drawType?: 'line' | 'polygon';     // 'line'=distance, 'polygon'=area — LOWERCASE!
    fillColor?: string;
    strokeColor?: string;
    projection?: string;               // default 'EPSG:4326'
}
```

---

## DrawClear

Clears all drawn features and overlays. No callbacks — just add it to Toolbar.

```typescript
interface DrawClearProps {
    title?: string;                    // default '清除绘制元素'
    iconType?: string;
    src?: string;
    style?: CSSProperties;
}
```

---

## FullScreen

No props. Just add inside MapContainer.

```tsx
<FullScreen />
```

---

## Controls Usage Example

```tsx
import { Toolbar, DrawFeature, DrawSelect, MeasureControl, DrawClear, FullScreen } from 'fedx-gis';

const onDrawEnd = (isDrawing, polygon) => {
    console.log('drawn feature', polygon);
};

const onSelected = (points, drawPol) => {
    // points: array of PointData that fall within the selection
    // drawPol: { geometry, center?, drawType, radius? }
    console.log(`Selected ${points.length} points`, drawPol);
};

<MapContainer view={{...}}>
    <FullScreen />

    <Toolbar alignment="vertical" style={{ top: 35 }}>
        <DrawFeature title="绘制点" drawType="POINT" src="/icons/point.png" />
        <DrawFeature title="绘制线" drawType="LINE" src="/icons/line.png" />
        <DrawFeature title="绘制圆" drawType="CIRCLE" src="/icons/circle.png" drawend={onDrawEnd} />
        <DrawFeature title="绘制多边形" drawType="POLYGON" isSingleDrawing={true} />
        <DrawSelect title="圆形框选" drawType="CIRCLE" src="/icons/circle.png" eventHandlers={onSelected} />
        <DrawSelect title="多边形框选" drawType="POLYGON" src="/icons/polygon.png" eventHandlers={onSelected} />
        <MeasureControl title="测距" drawType="line" src="/icons/ruler.png"
            fillColor="rgba(238, 44, 44, 0.5)" strokeColor="lightBlue" />
        <MeasureControl title="测面" drawType="polygon" src="/icons/area.png"
            fillColor="rgba(238, 44, 44, 0.5)" strokeColor="lightBlue" />
        <DrawClear title="清除" src="/icons/clear.png" />
    </Toolbar>
</MapContainer>
```

### Gotcha: drawType Case Sensitivity

| Component | drawType Values | Case |
|-----------|----------------|------|
| `DrawFeature` | `'POINT'` `'CIRCLE'` `'LINE'` `'POLYGON'` | UPPERCASE |
| `DrawSelect` | `'CIRCLE'` `'POLYGON'` | UPPERCASE |
| `MeasureControl` | `'line'` `'polygon'` | **lowercase** |
