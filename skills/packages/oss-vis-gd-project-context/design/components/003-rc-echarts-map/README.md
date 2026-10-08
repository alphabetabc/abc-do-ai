# 003-rc-echarts-map · EChartsMap 地图底层组件

> 源码：`web/components/ui/rc-echarts/map`。技术底座：ECharts（geo + scatter / lines series）。

## 快速上手

```tsx
import { EChartsMap, OverlayItem } from '~/web/components/ui/rc-echarts/map';

<EChartsMap
    adcode="440000"
    dataSource={points} // 默认渲染 scatter，需含 longitude / latitude
    onClick={(info, instance) => {}} // geo 点击翻译为 { data, type: 'geo', rawParams }
>
    <OverlayItem longitude={113.27} latitude={23.13}>
        <YourHtmlCard />
    </OverlayItem>
</EChartsMap>;
```

核心心智模型：

1. **geo 注册**：组件按 `${STATIC_PATH}/map/geojson/${adcode}.geojson` 加载并 `ec.registerMap`，加载态由内部 `FedxDataStatus` 呈现
2. **builder 注入**：样式层与数据层分别由 `geoBuilder` / `seriesBuilder` 定制（见 [builders.md](./builders.md)），不传用默认三层 geo + scatter
3. **HTML 覆盖层**：`OverlayItem` 把经纬度定位的任意 React DOM 叠在地图上（见 [overlay.md](./overlay.md)）

## 文档索引

| 文档                         | 内容                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| [props.md](./props.md)       | EChartsMap 全量 Props 表、onClick 行为、ecRef 实例句柄          |
| [builders.md](./builders.md) | geoBuilder / seriesBuilder 契约、config 内容、真实示例          |
| [overlay.md](./overlay.md)   | Overlay / OverlayItem / useOverlayContext、useRenderHtmlOverlay |
