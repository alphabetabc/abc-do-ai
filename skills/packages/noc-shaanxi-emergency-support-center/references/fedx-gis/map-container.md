# MapContainer + getMap

中屏保障中心的地图容器；只用到 `MapContainer` 和 `getMap()`。

- 类型：[MapContainer.d.ts](node_modules/fedx-gis/dist/components/map/MapContainer.d.ts)
- 接口：[interfaces/index.d.ts](node_modules/fedx-gis/dist/interfaces/index.d.ts)（`MapOptions`）

## MapContainer Props

```ts
interface MapOptions {
    id?: string;
    mapType?: string;
    eventHandlers?: Record<string, any>;
    view: ViewOptions;                   // ← OL View 配置
    height?: string | number;
    width?: string | number;
    style?: CSSProperties;
    children?: any;
    showRoom?: boolean;
    showRotate?: boolean;
    interactions?: object;
    ak?: string;
    styleId?: string;
    styleUrl?: string;
    onLoad?: any;
}
```

### 中屏实际使用

```tsx
<MapContainer
    view={{
        projection: emergencySupportGisConfig.projection || 'EPSG:4326',
        center: emergencySupportGisConfig.center,
        zoom: emergencySupportGisConfig.cityZoom || emergencySupportGisConfig.zoom,
        minZoom: emergencySupportGisConfig.minZoom,
        maxZoom: emergencySupportGisConfig.maxZoom,
        imageUrl: `${constants.IMAGE_PATH}/emergency-support/map/{0}/{1}.png`,  // ← OL tile url 模板
    }}
    showRoom={false}
    interactions={{
        doubleClickZoom: false,           // ← 关键：禁用原 OL 双击缩放，让我们自己接管 dblclick
    }}
>
    {/* TileArcgisRestLayer / XYZTileLayer */}
    {/* VectorLayer × 多 */}
    {/* CircleView */}
    {/* OpticalCableGis */}
</MapContainer>
```

## Props 详解

### `view`（必填）

透传给 OpenLayers `View`：

| 字段 | 说明 |
|---|---|
| `projection` | `'EPSG:4326'` (默认)，或自定义坐标系字符串 |
| `center` | `[longitude, latitude]` |
| `zoom` | 初始缩放级别 |
| `minZoom` / `maxZoom` | 缩放范围 |
| `imageUrl` | OL tile url 模板（使用 `{0}` `{1}` 占位） |

> 修改 `imageUrl` 时同步检查 `emergencySupportGisConfig`，是否有覆盖。

### `showRoom`

布尔。我们**固定传 `false`**，关闭楼层地图。

### `interactions`

对象，传入 `interactions={{ doubleClickZoom: false }}` 关闭 OL 自带双击缩放。这是为了让 `VectorLayer.onDoubleClick` 接管双击事件做地图下钻。

> ⚠️ 如果忘了这一项，`VectorLayer` 上 `dblclick` 事件会和 OL 默认 zoom 冲突，导致下钻行为不可靠。

### `id`

可选。我们手动在容器 div 上加（`id="emergency-gis-map1"` / `emergency-gis-map2`），但 `MapContainer` 自身也会需要 id 来区别实例。

> 同一页面只挂一个可见 MapContainer 时 id 可省略；但 tab1 和 tab2 不会同时可见，所以一般不会冲突。

### `children`

任意 React 节点组合，我们会传 `TileArcgisRestLayer` / `XYZTileLayer` / `VectorLayer` / `CircleView` / `OpticalCableGis`。

### `onLoad`

回调，在地图实例 ready 后触发。我们**没有用**。

## getMap()

```ts
declare function getMap(): any;
```

返回 OL Map 实例。全局单例（基于 MapContainer 渲染完成），所以同一时刻只有一个有效实例。

### 使用

```ts
import { getMap, gisFunc } from 'fedx-gis/dist/gis-2d';

const map = getMap();
gisFunc.setMapCenter(map, [longitude, latitude]);
gisFunc.setMapZoom(map, zoom);
gisFunc.showLayer(map, layerParam);
```

### 易踩坑

- **`getMap()` 调用时机**必须在 MapContainer 渲染之后，否则 `map` 是 `undefined`。一般在 `useEffect` 或事件回调里调用，首次组件挂载时立刻调用可能拿到 `undefined`
- fedx-gis **没有 dispose 接口暴露**；Tab 切换靠 styled-components 的 `visibility` 来隐，而不是 unmount。如果 `getMap()` 在 Tab1 时被调用，Tab1 切换到不可见但仍挂载，map 还是同一个。如果同时挂两个 MapContainer，`getMap()` 可能返回任意一个

## fedx-gis CSS

```ts
import 'fedx-gis/dist/gis-2d.css';
```

必须导入，提供 OL 容器、缩放控件等基础样式。

> 如果忘了导入，地图容器可能没有正确的 `position: relative` 和最小尺寸。

> 版本：v1.0 · 创建日期：2026-07-13
