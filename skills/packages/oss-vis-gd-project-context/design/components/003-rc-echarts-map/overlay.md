# Overlay · HTML 覆盖层体系

> 依据 `web/components/ui/rc-echarts/map/overlay/index.tsx` 整理。作用：把经纬度定位的 React DOM 叠在 ECharts 地图之上，随地图渲染同步重算像素位置。

## 体系一览

| 导出                      | 角色                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| `Overlay`                 | Portal 容器 + Context Provider，由 EChartsMap 内部渲染，业务一般不直接用   |
| `OverlayItem`             | 经纬度定位的单个 DOM 锚点，业务主要使用的组件                              |
| `useOverlayContext`       | 从任意 Overlay 子树取 `{ convertor, ecInstance, overlayRoot, render }`     |
| `useOverlayItemContext`   | OverlayItem 子树内取 `{ pos, container, overlayRoot }`                     |
| `useCreateOverlayContext` | EChartsMap 内部组装 context 用                                             |

`Overlay` / `OverlayItem` 从 `~/web/components/ui/rc-echarts/map` 与 EChartsMap 同入口导出。

## OverlayItem

```tsx
import { OverlayItem } from '~/web/components/ui/rc-echarts/map';

<OverlayItem
    longitude={113.27}
    latitude={23.13}
    mutableLngLat                 // 经纬度 props 变化后立即重算位置
    onPositionChange={(pos) => {}} // pos: [x, y] 像素坐标，供业务做边界翻转等
    rootStyle={{}}                // 锚点根节点（0x0 定位点）样式
    contentStyle={{ bottom: 10 }} // 内容层样式，默认在锚点上方 10px、水平居中
>
    <YourCard />
</OverlayItem>
```

Props：`longitude` / `latitude`（必传）、`rootStyle` / `rootClassName`（锚点 div）、`contentStyle` / `contentClassName`（内容 div）、`children`、`rawData`、`mutableLngLat`、`onPositionChange`。

机制：

- 经 `convertToPixel({ geoIndex }, [lng, lat])` 把经纬度转容器像素，绝对定位锚点（`left/top`），内容层 `translate(-50%, 0)` 水平居中置于锚点上方
- 监听 ECharts 实例 `rendered` 事件，每次地图重绘后重算像素（地图缩放/平移/roam 时跟随）
- convertor 返回 null（实例未就绪 / 坐标为空 / geo 未注册）时不渲染；注意 OverlayItem 的 convertor **不裁剪出界点**（出界仍渲染），`useRenderHtmlOverlay` 的才裁剪
- `mutableLngLat: true` 时经纬度 props 变化触发一次手动重算

## useOverlayContext

在 Overlay 子树内任意组件使用：

```tsx
const { convertor, ecInstance, overlayRoot } = useOverlayContext();

// convertor: (coord: [number, number]) => [x, y] | null
```

## useRenderHtmlOverlay（imperative 渲染通道）

定义在 `option.tsx`，与声明式的 OverlayItem 相对，适合全量自绘（如大量点位、canvas 混排）：

```tsx
const { render } = useRenderHtmlOverlay({
    ecInstance,     // ECharts 实例
    overlayRoot,    // 覆盖层容器 ref
    geoIndex,
    render: (ctx) => {
        // 每次 ECharts rendered 后调用
        // ctx.convertor: (coord) => [x, y] | null，坐标超出容器返回 null（出界裁剪）
    },
});

render(); // 也可手动触发（内部 rendering 锁防重入）
```

与 OverlayItem 的 convertor 差异：这里的 convertor 会做容器 `getBoundingClientRect()` 边界裁剪，出界返回 null。

## getOverlayContainer

EChartsMap 的 Prop `getOverlayContainer: () => RefObject<HTMLElement>` 可把 Overlay Portal 重定向到地图 DOM 之外的容器（如独立 z-index 层），OverlayItem 的 `ctx.render` 内部自动选择该容器。
