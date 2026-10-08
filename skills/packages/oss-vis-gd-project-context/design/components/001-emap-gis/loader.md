# emap-gis · EMap 库加载与配置

## 动态加载机制（emap-loader.ts）

- 库地址来自 `getEnvironment('EMapConfig.lib')`（`{ js: [], css: [] }`），动态注入 `<script>` / `<link>`；同 src 去重（`loaderMap`）
- 加载成功后挂到 `window.EMap`；`getEMapLib()` 每 200ms 轮询直到 `window.EMap.Map` 可用
- `deps.EMap` 是 `window.EMap` 的 getter 引用（`index.tsx` 导出为 `EMapLib`）

## EMapConfig 配置项（emap.ts initMap 消费）

| 配置 | 说明 |
| --- | --- |
| `lib` | `{ js: [], css: [] }` 外部库地址 |
| `baseUrl` | 瓦片底图地址 |
| `center` | 初始中心点（默认广州 `[113.25589468929, 23.132514601495]`） |
| `zoom` / `minZoom` / `maxZoom` | 层级（默认 13 / 1 / 20） |
| `ak` / `sk` | 接口签名（toolbar / WFS 用） |
| `WFS` | `{ url, projection }`（默认 EPSG:4326） |
| `enableELayer` + `tileImageFilter` | 开启 XYZTile 电子底图 + 滤镜 |
| `mapFilter` | 透传 map |
