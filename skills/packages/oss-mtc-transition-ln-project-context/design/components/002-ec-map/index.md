# 002 · EChartsMap 地图组件

> 性质：组件设计文档（概述）
> 日期：2026-08-11
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 用途

大屏可视化场景下的 **ECharts 地图 + HTML Overlay** 组件。

基于 `echarts` + `echarts-for-react`，在 ECharts 地图之上叠加 HTML 自定义内容（标记、弹窗等），通过地理坐标 → 像素坐标转换实现同步定位。

### 1.1 适用场景

- 4 个大屏页面中的地图区域（人员分布、信访来源地、进京信访分布等）
- 需要在地图上叠加自定义 HTML 标记（非 ECharts 原生 series）
- 需要点击地图区域获取行政区划信息
- 需要多层 geo 叠加（底图 + 纹理 + 可交互层）

### 1.2 不适用

- 非 ECharts 地图（如 Mapbox / Leaflet）
- 不需要 HTML overlay 的纯 ECharts 图表（直接用 `ReactECharts` 即可）

---

## 2. 文件结构

| 类型        | 路径                                | 说明                                                       |
| ----------- | ----------------------------------- | ---------------------------------------------------------- |
| 组件入口    | `ec-map/index.tsx`                  | `EChartsMap` 状态守卫：mapConfig 未加载 → Spin；已加载 → `<Map>` |
| 地图渲染    | `ec-map/map.tsx`                    | `Map` 组件：ECharts + Overlay + 事件绑定 + ref 暴露        |
| Option 构建 | `ec-map/option.tsx`                 | 地图注册、geo/series option、overlay 渲染 hook             |
| Overlay 层  | `ec-map/overlay/index.tsx`          | `Overlay` + `OverlayItem` + Context                        |
| 地图配置    | `ec-map/map-config.ts`              | `getMapConfig` + `useMapConfig`（加载区域配置，返回 loading 状态） |
| 纹理图片    | `ec-map/images/texture-map-1-2.png` | 地图纹理贴图                                               |

> 遵循项目约定：kebab-case 目录名，组件名 PascalCase（`EChartsMap`）。
> `index.tsx` 只做状态守卫和分发，地图渲染逻辑在 `map.tsx` 中。

---

## 3. Props 设计

```tsx
interface EChartsMapProps {
    /** 行政区划代码（如 "210000" 辽宁省），用于注册 ECharts 地图 */
    adcode?: string;
    /** 散点数据源，默认渲染为 scatter series */
    dataSource?: Array<{
        longitude: number;
        latitude: number;
        [key: string]: any;
    }>;
    /** geo 层是否静默（不可交互），默认 false */
    geoSilent?: boolean;
    /** geo 区域填充色，默认 'transparent' */
    geoItemColor?: string;
    /** 是否显示 geo 区域名称标签，默认 false */
    showGeoLabel?: boolean;
    /** ECharts tooltip 配置 */
    tooltip?: any;
    /** 自定义 series 构建函数，覆盖默认 scatter 逻辑 */
    seriesBuilder?: (config: any) => any[];
    /** 自定义 geo 构建函数，覆盖默认三层 geo 逻辑 */
    geoBuilder?: (config: any) => { geoIndex: number; geo: any };
    /** 通过 ref 获取 ECharts 实例 */
    ecRef?: React.RefObject<any>;
    /** 地图点击回调 */
    onClick?: (info: { data: MapConfigItem; type: "geo"; rawParams: any }, instance: any) => void;
    /** 是否透传原始 ECharts 事件参数（跳过 mapConfig 匹配），默认 false */
    useRawEvent?: boolean;
    /** 外层容器 className */
    className?: string;
    /** Overlay 子节点（OverlayItem 等） */
    children?: React.ReactNode;
    /** 上下文数据，传递给 seriesBuilder / geoBuilder，不触发 option 重算 */
    context?: any;
    /** 自定义 overlay 挂载容器（默认用组件内部 ref） */
    getOverlayContainer?: () => React.RefObject<HTMLElement | null> | undefined;
}
```

### 3.1 核心 Props 语义

| Prop            | 类型      | 默认值          | 说明                                                                  |
| --------------- | --------- | --------------- | --------------------------------------------------------------------- |
| `adcode`        | `string`  | -               | 行政区划代码，决定加载哪个 geojson                                    |
| `dataSource`    | `array`   | `[]`            | 散点数据，每项需含 `longitude` / `latitude`                           |
| `geoSilent`     | `boolean` | `false`         | 可交互层是否禁用鼠标事件                                              |
| `geoItemColor`  | `string`  | `'transparent'` | 可交互层填充色                                                        |
| `showGeoLabel`  | `boolean` | `false`         | 是否显示区域名称                                                      |
| `useRawEvent`   | `boolean` | `false`         | `true` 时 `onClick` 收到原始 ECharts params；`false` 时匹配 mapConfig |
| `seriesBuilder` | `fn`      | -               | 覆盖默认 scatter，自定义 series 配置                                  |
| `geoBuilder`    | `fn`      | -               | 覆盖默认三层 geo，自定义 geo 配置                                     |

---

## 4. 使用示例

### 4.1 基本用法

```tsx
import { EChartsMap, OverlayItem } from "@/components/large-screen/ec-map";

function PersonnelMap() {
    return (
        <EChartsMap
            adcode="210000"
            dataSource={[
                { longitude: 123.43, latitude: 41.8, name: "沈阳" },
                { longitude: 121.61, latitude: 38.91, name: "大连" },
            ]}
            showGeoLabel
            onClick={(info, instance) => {
                console.log("点击区域:", info.data.name);
            }}
        />
    );
}
```

### 4.2 带 HTML 标记

```tsx
import { EChartsMap, OverlayItem } from "@/components/large-screen/ec-map";

function PetitionMap() {
    return (
        <EChartsMap adcode="210000" showGeoLabel>
            <OverlayItem longitude={123.43} latitude={41.8} contentStyle={{ bottom: 20 }}>
                <div className="custom-marker">
                    <span className="marker-count">128</span>
                </div>
            </OverlayItem>
        </EChartsMap>
    );
}
```

### 4.3 自定义 series

```tsx
import { EChartsMap } from "@/components/large-screen/ec-map";

function CustomSeriesMap({ data }) {
    return (
        <EChartsMap
            adcode="210000"
            dataSource={data}
            seriesBuilder={(config) => [
                {
                    type: "effectScatter",
                    coordinateSystem: "geo",
                    geoIndex: config.geoIndex,
                    symbolSize: (val, params) => params.data.value[2] / 10,
                    rippleEffect: { period: 4, scale: 4 },
                    data: data.map((d) => ({
                        name: d.name,
                        value: [d.longitude, d.latitude, d.count],
                    })),
                },
            ]}
        />
    );
}
```

### 4.4 通过 ref 获取 ECharts 实例

```tsx
const ecRef = useRef(null);

useEffect(() => {
    const instance = ecRef.current?.instance();
    if (instance) {
        // 手动触发 resize / dispatchAction 等
        instance.dispatchAction({ type: 'showTip', ... });
    }
}, []);

return <EChartsMap adcode="210000" ecRef={ecRef} />;
```

---

## 5. 相关文档

- [技术实现与边界情况](./reference.md)
