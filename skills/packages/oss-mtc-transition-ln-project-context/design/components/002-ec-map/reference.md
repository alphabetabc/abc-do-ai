# 002 · EChartsMap 技术实现与边界

> 性质：组件设计文档（参考）
> 日期：2026-08-11
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 技术实现

### 1.1 整体架构

```
EChartsMap (index.tsx)        → 状态守卫
├── useMapConfig()            → 异步加载 map-config.json，返回 mapConfigLoading
├── mapConfigLoading? → Spin  → 未加载完显示 loading
└── <Map> (map.tsx)           → mapConfig 就绪后渲染
    ├── useECMapOption()      → 地图注册 + geo/series option 构建
    │   ├── useRegisterMap()  → 按 adcode 加载 geojson，echarts.registerMap()
    │   ├── useGeoOption()    → 构建三层 geo（底图描边 / 纹理填充 / 可交互）
    │   └── useSeriesOption() → 构建 scatter series（或自定义）
    ├── useCreateOverlayContext() → 创建 overlay 上下文（坐标转换器等）
    ├── ReactECharts          → echarts-for-react 渲染
    └── <Overlay>             → HTML overlay 层
        └── <OverlayItem>     → 单个 HTML 标记（经纬度 → 像素定位）
```

### 1.2 地图注册（useRegisterMap）

```ts
// 伪代码
const registeredMap = ec.getMap(`map-${adcode}`);
if (registeredMap) {
    return registeredMap.geoJson; // 已注册，直接用
}
const res = await axios.get(`/static/map/geojson/${adcode}.geojson`);
ec.registerMap(`map-${adcode}`, res.data); // 注册到 ECharts
```

| 要素     | 说明                                                           |
| -------- | -------------------------------------------------------------- |
| 注册 key | `map-${adcode}`（如 `map-210000`）                             |
| geojson  | 从 `/static/map/geojson/{adcode}.geojson` 加载（Vite public/） |
| 缓存     | ECharts 内部 `ec.getMap()` 缓存，同一 adcode 只请求一次        |
| 状态     | `loading` → `success` / `error`，驱动 loading/error UI         |

### 1.3 三层 Geo 叠加

默认（无 `geoBuilder` 时）构建三层 geo，实现大屏地图的立体视觉效果：

| 层级 | geoIndex | 用途              | 关键样式                                           |
| ---- | -------- | ----------------- | -------------------------------------------------- |
| 0    | 2        | 底层描边 + 外发光 | `borderColor: rgb(32,139,233)`, `shadowBlur: 10`   |
| 1    | 2        | 中层纹理填充      | `color: { image: textureImage, repeat: 'repeat' }` |
| 2    | 2        | 顶层可交互 + 标签 | `silent: geoSilent`, `label.show: showGeoLabel`    |

三层 geo 共享同一 `map-${adcode}`，通过 `top`/`bottom` 微调实现层叠偏移效果。

### 1.4 坐标转换（Overlay 核心机制）

ECharts 地图基于经纬度坐标，而 HTML overlay 基于像素坐标。通过 `ecInstance.convertToPixel` 转换：

```ts
const [x, y] = ecInstance.convertToPixel(
    { geoIndex: config.geoIndex },
    [longitude, latitude], // 经纬度
);
// [x, y] 即为 overlay 容器内的像素坐标
```

**渲染同步**：监听 ECharts 的 `rendered` 事件，每次 ECharts 重绘后重新计算所有 OverlayItem 的像素位置。

### 1.5 Overlay 体系

```
OverlayContext
├── container        → overlay DOM 挂载点
├── overlayRootRef   → 外层 ref（与 ECharts 同坐标系）
├── render()         → createPortal 到挂载点
├── convertor()      → 经纬度 → 像素坐标
└── ecInstance       → ECharts 实例

OverlayItem
├── 监听 ecInstance 'rendered' 事件
├── 每次 render 时调用 convertor([lng, lat]) 获取像素坐标
├── 位置变化时 setState({ pos })
└── 通过 createPortal 渲染到 overlay 挂载点
```

| 组件                | 职责                                               |
| ------------------- | -------------------------------------------------- |
| `Overlay`           | 提供 Context，管理挂载点 DOM                       |
| `OverlayItem`       | 单个 HTML 标记，经纬度→像素定位，跟随地图缩放/平移 |
| `useOverlayContext` | 子组件获取 overlay 上下文（ecInstance、convertor） |

### 1.6 点击事件处理

两种模式：

**`useRawEvent = true`**：直接透传 ECharts 原始 params

```ts
onClick(params, ecInstance); // params 是 ECharts 原始事件对象
```

**`useRawEvent = false`（默认）**：通过 mapConfig 匹配区域信息

```ts
// 1. 从 mapConfig 中查找 name 或 alias 匹配的区域
const item = mapConfig.find((it) => it.name === params.name || it.name === params.alias);
// 2. 传递结构化数据
onClick({ data: item, type: "geo", rawParams: params }, ecInstance);
```

### 1.7 Loading / Error 状态

| 状态      | UI                 | 触发条件                        | 守卫位置        |
| --------- | ------------------ | ------------------------------- | --------------- |
| `loading` | antd `Spin` 居中   | mapConfig 加载中                | `index.tsx`     |
| `loading` | antd `Spin` 居中   | geojson 请求中                  | `map.tsx`（option status） |
| `error`   | antd `Result` 警告 | geojson 请求失败                | `map.tsx`（option status） |
| `success` | 正常渲染地图       | mapConfig + geojson 均就绪      | -               |

> mapConfig loading 在 `index.tsx` 守卫，geojson loading/error 在 `map.tsx` 内由 `useECMapOption` 返回的 `status` 驱动。

### 1.8 map-config 加载

```ts
// map-config.ts
let mapConfigCache: MapConfigItem[] | null = null;

export const getMapConfig = () => mapConfigCache;

export const useMapConfig = () => {
    const { loading } = useRequest(
        async () => {
            const res = await axios.get("/static/map/map-config.json");
            return res.data.data;
        },
        {
            cacheKey: "map-config",
            onSuccess: (data) => {
                mapConfigCache = data;
            },
        },
    );

    return { mapConfigLoading: loading };
};
```

- 数据源：`frontend/public/static/map/map-config.json`
- 结构：`{ title, desc, data: MapConfigItem[] }`
- 组件挂载时 `useMapConfig()` 触发加载，`ahooks` `cacheKey` 保证全局只请求一次
- 返回 `mapConfigLoading` 供 `index.tsx` 守卫：未加载完时显示 Spin，不渲染 `<Map>`
- `getMapConfig()` 同步读取缓存，供点击事件回调使用

**MapConfigItem 结构**：

| 字段     | 类型               | 说明                                   |
| -------- | ------------------ | -------------------------------------- |
| `name`   | `string`           | 区域名称（如 "辽宁"）                  |
| `alias`  | `string`           | 别名（如 "辽宁省"）                    |
| `adcode` | `number`           | 行政区划代码                           |
| `level`  | `string`           | 层级（country/province/city/district） |
| `cp`     | `[number, number]` | 中心点经纬度                           |
| `parent` | `number \| null`   | 父级 adcode                            |
| `id`     | `string \| null`   | 服务端映射 ID                          |

---

## 2. 依赖

| 包                  | 版本      | 用途                                                   |
| ------------------- | --------- | ------------------------------------------------------ |
| `echarts`           | `^6.1.0`  | ECharts 核心（地图注册、渲染）                         |
| `echarts-for-react` | `^3.0.6`  | React 封装                                             |
| `ahooks`            | `^3.9.7`  | `useRequest`/`useSetState`/`useLatest`/`useMemoizedFn` |
| `antd`              | `^6.3.7`  | `Spin`/`Result`（loading/error 态）                    |
| `axios`             | `^1.16.0` | 请求 geojson / map-config                              |

---

## 3. 静态资源

| 资源            | 路径                                                  | 说明                       |
| --------------- | ----------------------------------------------------- | -------------------------- |
| map-config.json | `frontend/public/static/map/map-config.json`          | 行政区划配置（840KB）      |
| geojson         | `frontend/public/static/map/geojson/{adcode}.geojson` | 地图边界数据（**待补充**） |
| 纹理图片        | `ec-map/images/texture-map-1-2.png`                   | geo 中层纹理贴图           |

> ⚠️ geojson 文件目前不存在，需后续补充。辽宁 adcode = `210000`。

---

## 4. 边界情况

| 场景                               | 处理                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- |
| `adcode` 未传或为空                | `useRequest` `ready: adcode != null`，不发起请求，保持 loading 态     |
| geojson 请求失败                   | 显示 `Result` 警告态                                                  |
| mapConfig 未加载完成时点击         | 不会发生：`index.tsx` 守卫，mapConfig 未加载完不渲染 `<Map>`，点击回调不触发 |
| OverlayItem 经纬度超出地图可视区域 | `convertor` 返回 null，OverlayItem 不渲染                             |
| 同一 adcode 多次渲染               | ECharts `ec.getMap()` 缓存命中，不重复请求 geojson                    |
| ECharts 实例未就绪                 | overlay 不挂载（`ctx.container` 为 null 时 OverlayItem 返回 null）    |
| 容器尺寸变化                       | ECharts 自身不监听 resize；由外层 `ScalerContainer` 的 scale 机制处理 |

---

## 5. 已确认决策

- [x] **echarts-for-react 而非 react-echarts**：与原代码 `ReactECharts` 导出风格一致
- [x] **ahooks 替换 @fedx-web-common/react-hooks**：API 兼容，仓库已有依赖
- [x] **antd Spin/Result 替换 FedxDataStatus**：本仓库无 DataStatus 组件
- [x] **map-config 独立文件**：`map-config.ts`，不污染组件入口
- [x] **index.tsx / map.tsx 拆分**：`index.tsx` 只做状态守卫（mapConfig loading → Spin），`map.tsx` 负责地图渲染主体
- [x] **mapConfig loading 守卫**：`useMapConfig` 返回 `mapConfigLoading`，未加载完时不渲染 `<Map>`，避免点击无响应
- [x] **STATIC_PATH = '/static'**：Vite public/ 映射到根路径
- [x] **三层 geo 默认配置**：底图描边 + 纹理填充 + 可交互层
- [x] **overlay 跟随 ECharts rendered 事件**：每次重绘后重新计算像素坐标
- [ ] geojson 文件补充（辽宁 210000 等）
- [ ] 是否需要 `onDblClick` / `onMouseOver` 等更多事件
- [ ] 是否需要 `resize` 自动监听（当前依赖外层 ScalerContainer）

---

## 6. 相关文档

- [概述与使用示例](./index.md)
