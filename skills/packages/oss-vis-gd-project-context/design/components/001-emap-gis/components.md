# emap-gis · 组件与 Props

## 文件与导出清单

| 文件 | 导出 | 职责 |
| --- | --- | --- |
| `index.tsx` | 统一出口 | 见下 |
| `MapContext.tsx` | `MapContext` / `useMapContext` | 地图容器 + React Context（map 实例、EMap 库） |
| `MapView.tsx` | `EMapView` | 常用组合入口：MapContext + 工具栏 + 事件 + 区域轮廓 |
| `MapWidgets.tsx` | （内部） | 工具栏（aoi-place 搜索）+ 点击/悬浮/双击事件 + popup |
| `MapWidgetPoints.tsx` | `MapWidgetPoints` | 批量打点 |
| `MapWidgetWFSLayer.tsx` | `MapWidgetWFSLayer` | WFS 行政区划边界图层 |
| `MapWidgetRegionOutline.tsx` | `MapWidgetRegionOutline` | 区域轮廓（按 URL `?area=adcode-xxx`） |
| `MapWidgetFocusPosition.tsx` | `MapWidgetFocusPosition` | 飞行定位到经纬度 |
| `MapInstanceRef.tsx` | `MapInstanceRef` | ref 转发获取 map 实例 |

`index.tsx` 对外导出：`EMapView`、`useMapContext`、`useEMapUtil`、`MapWidgetPoints`、`MapWidgetFocusPosition`、`MapInstanceRef`、`MapWidgetWFSLayer`、`setTileFilterColor`、`refreshTileFilterLayer`、`EMapFormatter`、`EMapGlobalRequest`、`EMapLib`（即 `deps`）。注意 `MapContext`、`MapWidgetRegionOutline` 不在出口里，需按文件路径引用。

## EMapView

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `className` | string | 透传容器 |
| `showToolbar` | boolean（默认 true） | aoi-place 搜索工具栏 |
| `toolbarTypes` | Array<'aoi-place' \| 'district-search'> | 工具栏类型 |
| `showRegionOutline` | boolean | true 时按 URL `?area=adcode-xxx` 画轮廓 |
| `onClick` / `onDoubleClick` | `({ feature, lonLat }) => void` | 地图事件（feature 为空时不触发） |

## 子 Widget

### MapWidgetPoints（批量打点）

```tsx
<MapWidgetPoints
  layerId="emergency"
  points={[{ id: '1', longitude: 113.26, latitude: 23.13, name: '应急仓' }]} // 经纬度字段，不是 position 数组
  getIcon={(p) => `/static/images/map/${p.type}.png`}
  getPointItem={(raw) => ({ ...raw, id: raw.intId })} // 可选：转换原始数据
/>
// points 变化时自动 remove 旧点重画；点击交互由 createPopup/MapWidgets 的 onClick 承接
```

### MapWidgetWFSLayer（行政区划边界）

```tsx
<MapWidgetWFSLayer layerCode={zoneLevel === '2' ? 'PROVINCE' : 'CITY'} keyCode={zoneName} />
// keyCode 按图层级别填行政区名（如 '广东省'/'广州市'）；layerId 默认 'district_city'
```

### MapWidgetRegionOutline（区域轮廓 + 自动聚焦）

不接收 props；从 URL search `?area=adcode-440100` 取 adcode，请求行政区 geojson 画轮廓并 `focusPositionExtent`（padding 100）。**无 URL 参数时不生效**。

### MapWidgetFocusPosition（飞行定位）

```tsx
<MapWidgetFocusPosition
  longitude={lng} latitude={lat}
  duration={500}
  onFocusFinished={() => { /* 可返回清理函数 */ }}
/>
// 经纬度变化触发；连续变化内部按 count 去抖，过期回调不执行
```

### MapInstanceRef（ref 取实例）

```tsx
const ref = useRef(null);
<MapInstanceRef ref={ref} /> // ref.current.map
```
