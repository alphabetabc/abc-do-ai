---
title: oss-chart-map
description: 基于 @oss-chart/map 的高复杂度地图物料（板块 / 飞线 / 散点 × ECharts + 自定义 DOM 图层），含权限地图、下钻交互、参数派发
version: 1.0.0
last_updated: 2026-06-17
---

# oss-chart-map

## 1. 概述

**名称**：基础平面地图（`oss-chart-ec-map` 为 `oss-material.json.name` 内部名，目录与对外文档均使用 `oss-chart-map`）

**用途**：基于 `@oss-chart/map`（`MapContainer` + `layerRenderer`）的高复杂度地图物料，支持 **3 种主图层**（板块地图 / 飞线图 / 散点图）、**6 种散点样式**（echarts 气泡 + 普通 01/02 + 分组 01/02/03）、**权限地图**、**板块下钻**（Modal / Drawer）、**参数派发**（区域 / 打点独立配置）与**自动触发**。底层通过 `opt builder` 模式 + DOM 自定义图层扩展。

**所属分类**：地图

**复杂度**：**高**（schema ~2100 行，3 大图层 + 6 个散点变体 + 大量 `x-reactions` + ECharts + 自定义 DOM）

### 1.1 文件入口

| 文件 | 作用 |
|------|------|
| `oss-material.json` | 物料元信息（`name: "oss-chart-ec-map"`、`title: "基础平面地图"`、`main: "./index.tsx"`） |
| `index.tsx` | **顶层入口**（`oss-material.json.main`），加载 `map-config.json` + 权限筛选 → 注入 `<Map />` |
| `map.tsx` | **主渲染组件**（`React.memo`），注册 `geo`、3 种 layer、`MapContainer` 包裹 |
| `schema.ts` | 配置 / 数据 / 交互三大面板（含 `defaultValue`） |
| `dataModel.json` | 数据契约（14 个 indicators，0 个 dimensions） |
| `types.ts` | TS 接口：`ResponseMapDataType` / `ViewMapDataType` / `MapconfigType` |
| `common/constants.ts` | 枚举：`REGION_TYPE_ENUMS` / `MAP_LAYER_ENUMS` / `MAP_SCATTER_TYPE` / `EC_MAP_LAYER_ENUMS` / `LAYER_DOM_ENUMS` / `LAYER_NAME_CN` |
| `common/utils.ts` | `mapUtils`（`findMapCfg` / `assignOriginData` / `currentLayer` / `stringCfgToArr`）+ `resetInteractionObject` |
| `custom-layer/` | DOM 自定义图层（散点）：`single-scatter/` + `group-scatter/` + `group-scatter2/`（含 `CommonScatter` / `MultiRowsScatter`） |
| `custom-layer/layer-dom-container.tsx` | DOM 图层注册表（`registerLayerDom` / `isLayerDom` / `LayerDom`） |
| `options/useGeo.ts` | 底图 `geo` option 构造 hook |
| `options/useLayerOpt.ts` | 图层 `opt builder` 路由 hook（path / lines / scatter） |
| `options/useOptionPicker.tsx` | `useMemo` 化的 `option picker` 通用工具 |
| `options/layer-opts/` | 3 个 opt builder：`layer-opt-path` / `layer-opt-lines` / `layer-opt-scatter` |
| `schema-parts/map-lines.ts` | 飞线图的 `linesNormal` schema 片段 |
| `schema-parts/map-scatter.ts` | 散点图的 `SCATTER_NORMAL` + `SINGLE_SCATTER01/02` + `GROUP_SCATTER01/02/03` schema 片段 |
| `schema-parts/label-line.ts` | 指标指引线 `LABEL_LINE` schema 片段 |
| `doc/README.md` | 用户向文档（含 21 张截图、6 种散点 JSON 示例） |
| `doc/CHANGELOG.md` | 更新日志（仅 0.0.1 2022-11-14） |
| `icons/scatter-01~05.png` | 配置面板气泡预览图（5 个） |

### 1.2 核心能力

- **3 种主图层互斥切换**：`config.layer.type = 'path' | 'lines' | 'scatter'`（Radio.Group 单选，`x-reactions` 控制三组子面板显隐）
- **板块地图（path）**：基础 ECharts path 序列 + `visualMap`（minColor/maxColor）+ tooltip（4 种形式，含 `item_*` 指标汇总）+ colormap（按 `level` 字段染色）
- **飞线图（lines）**：双层 ECharts（`lines` + `effectScatter`），通过 `targetId`（支持 `,` 分隔多端）建立连边，区分 `isCenter` 中心点染色
- **散点图（scatter）6 种样式**：
    - `echarts 气泡`（`normal`）：基础 `effectScatter` + ripple
    - `普通气泡 01`（`single_scatter01`）：值/文本/箭头富文本
    - `普通气泡 02`（`single_scatter02`）：图片背景（normal/active 切换）
    - `分组气泡 01`（`group_scatter01`）：中心圆 + valueGroup 面板
    - `分组气泡 02`（`group_scatter02`）：多行指标 + 分隔符 + 引线 `LABEL_LINE`
    - `分组气泡 03`（`group_scatter03`）：列宽 + 行字段映射（多列多行指标）
- **底图（geo）**：4 段边距 + 6 段样式（border/area/emphasis）+ 文本标签 + 选中样式 + 背景图（`backgroundImage` ArrayCollapse，按 `id` 匹配）
- **权限地图**：`config.geo.permission = true` 时使用 `designer.permissions.zoneId/zoneName` 自动选区
- **3 级行政下钻**：`regionType`（`10004` 区 / `10003` 市 / `10000` 省）+ `zoneLevel`（4/3/2）由 `mapUtils.findMapCfg` 自动计算
- **下钻交互（drilldownEvent）**：`Modal` / `Drawer` 两态，支持 `url参数` + `drilldownItemFields`（逗号分隔字段映射）
- **参数派发（dispatch）**：区域（`regionName/regionId/regionType/zoneLevel/lower/upper`）+ 散点（`type/groupItemId`），可单独配置每个参数名
- **自动触发（autoTrigger）**：轮播组场景下首次进入派发一次
- **opt builder 模式**：3 个独立 builder 通过 `registerLayerOptsBuilder` 注入 `Map<MAP_LAYER_ENUMS, OptBuilderType>`，每种 builder 拆为 `label/style/data/build` 4 段

### 1.3 适用场景

- 大屏可视化：省级 / 市级 / 区县三级地图，下钻展示下级统计
- 网络拓扑 / 飞线：基站到中心、跨省专线等 `source → target` 关系展示
- 多指标散点：基站状态（5G/4G/3G 数量、占比、等级）多列多行展示
- 权限敏感场景：根据用户所属区域自动聚焦该省/市
- 需要"区域 + 打点"同时交互派发的复合大屏

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
|------|------|----------|
| **Schema 维护** | [schema.md](./schema.md) | 3 大 FormCollapse（geo / layer / interactions）+ 默认值 `defaultValue`（含 3 个图层 6 个散点全配置） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.tsx`（mapConfig 加载 + 权限筛选）→ `map.tsx`（geoJson loader + 事件 + autoTrigger）→ `useGeo/useLayerOpt` → 3 个 opt builder → DOM 自定义图层 |
| **数据格式** | [data-model.md](./data-model.md) | `dataModel.json`（0 dimensions + 14 indicators）、`map-config.json`（外部区域字典）、`MapconfigType`、`ResponseMapDataType` 与 `ViewMapDataType` 转换 |

## 3. Schema 结构（摘要）

- **配置面板**（`config`）：`getCompTitle` + `BASE_LAYOUT` + 2 级嵌套 FormCollapse（geo 底图 / layer 图层）
    - **geo**：`$baseConfig`（show / permission） + `$mapsettings`（GeoJsonSelect，受 permission 隐藏） + `padding` + `style` + `selectStyle`（含 itemStyle + label） + `label` + `$backgroundImage`（ArrayCollapse）
    - **layer**：type Radio + 3 个条件子面板（`path` / `lines` / `scatter`）；`scatter` 内嵌 `optionalType` Select（6 选 1）+ `$preview` Preview + 6 个条件子面板 + `colormap`
- **数据面板**（`dataConfig`）：`DynamicData` 组件 + 9 个 fields（无 dimensions）
- **交互面板**（`interactions`）：单击事件 → 下钻（drilldownEvent 含 Modal/Drawer 弹窗配置） + 派发参数（区域 / 单击区域 / 单击散点）

## 4. 组件逻辑（摘要）

- **`index.tsx`**：缓存加载 `map-config.json`（`designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL)`），按 `selectedOutline` + `outlineType` 过滤，注入 `<Map mapConfig={...} />`
- **`map.tsx`**：缓存 `geoJson` promise（按路径去重）→ `<MapContainer>` 包裹 `<LayerDom>` 与 `layerRenderer(type, option)`；点击事件统一经 `triggerMapClick` → `drilldown` 或 `dispatchInteraction`
- **`useGeo`**：`useOptionPicker` 提取 label/padding/selectStyle → 计算 `regionType` / `lower/upperRegionType` / `zoneLevel`
- **`useLayerOpt`**：按 `config.layer.type` 从 `layerOptsContainer` 路由到对应 builder
- **3 个 opt builder**：`label` → `style` → `data` → `build`，由 `MAP_LAYER_ENUMS` 决定
- **DOM 自定义图层**：`LayerSingleDomScatter` / `LayerGroupDomScatter`（含 `group_scatter2` 的 `CommonScatter` / `MultiRowsScatter`）

## 5. 数据格式（摘要）

- **dimensions**：无（地图物料不适用维度）
- **indicators**（14 个）：`id` / `name` / `value` / `lon` / `lat` / `unit` / `level` / `targetId` / `isCenter` / `type` / `item_label_xx` / `item_value_xx` / `item_id_xx` / `item_level_xx`
- **外部数据**：`map-config.json`（`MapconfigType[]`）含每个区域的 `adcode / level / cp / parent / id` 字段
- **数据流向**：`dataSource[]` → `scatterDataBuilder` / `linesDataBuilder` / `pathDataBuilder` → `ViewMapDataType`（带 `coords/source/target`）或 `path.data[]`（带 `name/value/regionName`）→ ECharts series / DOM 渲染

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 任务 1：新增一个散点样式（如气泡 04）
- 任务 2：调整板块地图 tooltip 的 4 种展示形式
- 任务 3：新增一个派发参数
- 任务 4：调整默认值（颜色 / 尺寸 / 边距）
- 任务 5：调整底图背景图匹配逻辑（如按 level 匹配）

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

⚠️ **最关键的 3 条**：

1. **schema 内部名与目录名不一致**：`oss-material.json.name = "oss-chart-ec-map"`，但目录是 `oss-chart-map`，对外文档标题是 `oss-chart-map`（设计器侧边栏依赖 `material.title`）。
2. **散点 6 选 1 走 `opt builder` 模式**：`scatter` 字段下挂 6 个 `optionalType` 子配置，仅当前选中的会被读取；修改时**只动选中的子 schema**，避免误改其他 5 个。
3. **DOM 自定义图层依赖 `MAP_LAYER_ENUMS`**：`single_scatter01/02` 走 `LAYER_DOM_ENUMS.SINGLE_SCATTER`（`LayerSingleDomScatter`），`group_scatter01/02/03` 走 `LAYER_DOM_ENUMS.GROUP_SCATTER`（`LayerGroupDomScatter`），与 ECharts layer 不在同一条渲染链。
