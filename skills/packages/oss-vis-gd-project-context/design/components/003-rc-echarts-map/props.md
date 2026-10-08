# EChartsMap Props

> 依据 `web/components/ui/rc-echarts/map/index.tsx`（TProps 定义）与 `option.tsx` 整理。

## Props 表

| Prop                  | 类型                            | 默认值          | 说明                                                                                                  |
| --------------------- | ------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `adcode`              | `string`                        | —               | 行政区划码；变化时重新加载注册 geojson 并重建 option                                                  |
| `dataSource`          | `any[]`                         | —               | 点位数据；默认 series 取每项 `longitude` / `latitude` 渲染 scatter（经 `seriesBuilder` 可完全自定义） |
| `seriesBuilder`       | `(config) => series[]`          | —               | 自定义 series 构建；返回空数组则不渲染数据层，见 [builders.md](./builders.md)                         |
| `geoBuilder`          | `(config) => { geoIndex, geo }` | —               | 自定义 geo 构建；不传用默认三层 geo（描边层 / 纹理层 / 交互层），见 [builders.md](./builders.md)      |
| `geoSilent`           | `boolean`                       | `false`         | 默认 geo 交互层是否静默                                                                               |
| `geoItemColor`        | `string`                        | `'transparent'` | 默认 geo 交互层区域填充色                                                                             |
| `showGeoLabel`        | `boolean`                       | `false`         | 默认 geo 交互层是否显示区域名 label                                                                   |
| `tooltip`             | `object`                        | —               | 透传 ECharts tooltip 配置                                                                             |
| `onClick`             | `(info, instance) => void`      | —               | 地图点击回调，行为见下                                                                                |
| `useRawEvent`         | `boolean`                       | `false`         | `true` 时 onClick 直接收 ECharts 原始 params（scatter / geo 各类点击都回调），不做翻译                |
| `ecRef`               | `RefObject`                     | —               | 句柄 ref：`ecRef.current.instance()` 返回 ECharts 实例（用于 dispatchAction 等）                      |
| `context`             | `any`                           | —               | 透传给两个 builder 的额外上下文；**变更不触发 option 重建**（builder 内部经 useLatest 拿最新值）      |
| `getOverlayContainer` | `() => RefObject<HTMLElement>`  | —               | Overlay Portal 挂载容器（默认地图根节点内的 overlay root），用于把覆盖层渲染到地图之外的 DOM 上       |
| `className`           | `string`                        | —               | 追加到根节点 class（`ec-map---root full-width full-height` 之上）                                     |
| `children`            | `ReactNode`                     | —               | 渲染进 Overlay 上下文，典型为 `OverlayItem`                                                           |

## onClick 行为

- `useRawEvent: true`：`onClick(params, ecInstance)`，params 为 ECharts 原始点击参数（可区分 `componentSubType === 'scatter'`、`componentType === 'geo'`）
- 默认（翻译模式）：仅处理 `componentType === 'geo'` 的点击，按区域名（先 `name` 后 `alias`）从 `web/common/map-config` 的 `getMapConfig()` 查配置，回调 `onClick({ data, type: 'geo', rawParams }, ecInstance)`；查不到则不回调

## 实例句柄（ecRef）

```tsx
const ecRef = useRef(null);

<EChartsMap ecRef={ecRef} ... />;

// 需要 dispatchAction 时：
ecRef.current.instance().dispatchAction({ type: 'geoSelect', name: '韶关' });
```

## 内部行为

- 内部 `ReactECharts` 使用 `replaceMerge={['geo', 'series']}`（组件机制见 [../002-react-echarts/update-behavior.md](../002-react-echarts/update-behavior.md)）
- geojson 加载状态经 `FedxDataStatus`（`web/components/ui/data-status`）展示 loading / error
- geojson 缓存：`ec.getMap('map-<adcode>')` 已注册则直接复用，不发请求
