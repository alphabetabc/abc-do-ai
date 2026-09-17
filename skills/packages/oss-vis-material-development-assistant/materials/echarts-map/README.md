---
title: echarts-map
description: echarts 平面地图（echarts-map）— 省级下钻到地市级 + 区域气泡指标 + 引线 / 连线 / 涟漪特效 + 权限地图 + 参数订阅 + 数据源切换 + Modal/Drawer 下钻
version: 1.0.0
last_updated: 2026-09-17
---

# echarts-map

## 1. 概述

**名称**：echarts 平面地图

**用途**：基于 ECharts 的**中国行政区划平面地图**（`geo` + `series.map`），核心能力是 **省级地图下钻到地市级**（可选继续下钻到区县）。支持**区域气泡（指标 + 子指标）**、**引线 / 连线 / 涟漪特效**、**地图外轮廓**、**权限地图**（按登录用户所属区域自动选区）、**数据源切换按钮**（0 演示 / 1 真实）、**参数订阅**（接收 `regionName` 切换图层）、**派发参数**（`id/name/level`）、**下钻交互**（Modal / Drawer）。

**所属分类**：地图

**复杂度**：**高**（schema 1700+ 行，9 个 FormCollapse 分组、1 个 ArrayCollapse 指引线配置 + 1 个 ArrayCollapse 背景图、ECharts 多 series + 自定义数据获取 + 权限 + 数据源切换）

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.jsx` | **主入口**（`oss-material.json.main: "./index.jsx"`）— 加载 `map-config.json` + `geoHelper`（含 `turf`）→ 注入 `<Map />` |
| `map.jsx` | **核心渲染组件**（含 geoJson 加载、订阅参数、数据获取、点击下钻） |
| `options.ts` | ECharts option 构造器（含 `getOption` / `registerMapOutline` / `getBottomRegionGeoJson` / `ZoneLevelEnum` / `ORIGINAL_DATA_KEY`） |
| `schema.ts` | 配置面板 / 数据面板（CustomDataSource）/ 交互面板 |
| `dataModel.json` | 数据契约（0 dimensions + 16 indicators） |
| `oss-material.json` | 物料元信息（`main: "./index.jsx"`、`dataModel: ""`） |
| `index.less` | 容器样式（`.echarts-map-container` / `.back` / `.echarts-map-wrapper / .data-source-switch`） |
| `schema/share.ts` | 子值装饰枚举 `SubValueDecoration` + `subValueDecorationFormatter` |
| `schema/defaultValues.ts` | 默认 `mapOutlineStyle` + `areaLevelColor` |
| `doc/README.md` | 用户向文档（设计器侧边栏渲染，含 16 张截图） |
| `doc/CHANGELOG.md` | 仅 0.0.1（2023-07-17 创建物料） |

### 1.2 核心能力

-   **省份下钻**：省（level=2）→ 地市（level=3），可选继续下钻到区县（level=4，需开启 `enableDrilldownBottomZone`）
-   **权限地图**：`config.geo.permission = true` 时使用 `designer.permissions.zoneId/zoneName` 自动定位区域
-   **区域气泡**：每个区域最多 4 个指标 + 子指标，富文本拼接、颜色级别控制、垂直/水平排列、垂直气泡背景、引线（`labelLine`）
-   **连线特效**：从起点（涟漪气泡）到区域（带箭头）的动画连线
-   **地图外轮廓**：独立 `geo` 图层，模拟发光边框
-   **数据源切换按钮**：通过 `geo.dataSourceSwitch` 开启后，hover 容器右上角出现按钮，点击派发 `0/1` 给接口
-   **参数订阅**：通过 `interactions.regionName` 接收外部组件传的 `regionName` 自动切换图层
-   **派发参数**：切换图层 / 点击时派发 `id/name/level`（级别为 `ZoneLevelEnum[level]`，值 2/3/4）
-   **下钻交互**：单击 → 弹出 Modal / Drawer（iframe URL + drilldownItemFields 字段映射）
-   **背景图**：`ArrayCollapse` 数组，按 `currentId` 自动匹配
-   **地图旋转**：`config.geo.rotateAngle`（通过 `geoHelper.turf.transformRotate` 旋转 geojson）

### 1.3 适用场景

-   大屏可视化：省级 / 市级 / 区县三级地图，下钻展示下级统计指标
-   区域气泡展示：每个区域多个 KPI（4 个以内）+ 子指标
-   跨区域连线：飞线展示中心点 ↔ 区域
-   权限敏感场景：根据用户所属区域自动聚焦该省/市

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 9 个 FormCollapse 分组（基础配置 / 数据源切换 / 返回按钮 / 边距设置 / 图层设置 / 地图样式 / 外轮廓 / 文本标签 / 指标 / 背景图片 / 指引线 / 连线样式 / 连线起始点气泡 / 参数订阅 / 单击事件）+ 3 个 FormLayout 子布局（点位 + 尺寸 + 位置 + 关闭图标）+ 5+ 个 `x-reactions` 显隐控制 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.jsx`（加载 map-config + geoHelper）→ `map.jsx`（订阅 + 数据获取 + geojson 加载 + 事件）→ `options.ts`（`getOption` 多 series + `convertColorMapOption` 级别色 + `getBottomRegionGeoJson` 子级底图） |
| **数据格式** | [data-model.md](./data-model.md) | 0 dimensions + 16 indicators（name1~4 / value1~4 / subValue1~4 / level1~4 / id / name / parent / num）；数据源切换的 `SYMBOL_DATA_SOURCE_SWITCH` 机制；与 `map-config.json` 配套使用 |

## 3. Schema 结构（摘要）

-   **配置面板**（`config`）：2 层 FormCollapse，外层为 `geo`，下含 `基础配置` / `数据源切换按钮` / `返回按钮` / `边距设置` / `图层设置+地图样式+外轮廓+文本标签+指标+背景图片+指引线配置+连线样式+连线起始点气泡样式`（13 个子面板）
-   **数据面板**（`customDataSourceApiConfig`）：`CustomDataSource` 组件（**物料自管数据**，平台不接管）
-   **交互面板**（`interactions`）：参数订阅（`regionName`）+ 单击事件（派发参数 `id/name/level`）+ 统一下钻配置（Modal / Drawer）

## 4. 组件逻辑（摘要）

-   **`index.jsx`**：顶层入口，调用 `designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL, ...)` 加载 `map-config.json` + `designer.utils.remoteModuleFetcher(...)` 加载 `geo-helper`（含 `turf`），包 `<DataStatus>` 错误态
-   **`map.jsx`**：核心组件
    -   `props.mapConfig`：区域字典（来自 `map-config.json`）
    -   `props.customDataSourceApiConfig`：物料自管数据源（`api.customDataSourceApi` + `dataSourceSwitch` 0/1）
    -   `useSetState({ currentName, currentId, currentLevel, parentName })`：地图状态
    -   `mapPath = useMemo(...)`：根据 `currentName` 查 `mapConfig` → 加载对应 adcode 的 geojson（缓存 `MAP_CONFIG_SYMBOL_${adcode}`）
    -   启用"下钻到最底层"时，区县级底图从省级 geojson 中过滤子区域（`getBottomRegionGeoJson`）
    -   `props.geoHelper.turf.transformRotate(res, rotateAngle)`：地图旋转
    -   `echarts.registerMap(mapInfo.currentName, geoJson)` + `registerMapOutline(..., -outline)`：注册主图 + 轮廓图
    -   点击事件：`mapInfo.currentLevel === 'province'` 或 `'city'` → 下钻；其他 → `drilldown(props, dataItem, 'clickEvent')`
    -   派发参数：`interaction.dispatch({ data: [{ fieldName, state }, ...] })`，派发 `id/name/level`（level 经过 `ZoneLevelEnum` 反向映射）
    -   参数订阅：`useEffect([regionNameInteraction, regionNameInDrillDown, receivedPropsParams])` → 切换 `mapInfo.currentName`
-   **`options.ts`**：
    -   `convertColorMapOption`：按 `getHighestLevel(d)` 计算每个区域最高级别 → 从 `areaLevelColor` 取色，生成 `series.map`
    -   `getOption`：组装 `geo[basicGeoConfig, outlineGeoConfig]` + `series[colorMapOption?, lines, effectScatter, scatter, scatter-name]`
    -   `getBottomRegionGeoJson`：从父级 geojson 过滤出当前区域 features（区县级别底图）
    -   `ZoneLevelEnum`：`district=4 / city=3 / province=2`

## 5. 数据格式（摘要）

-   **dimensions**：空（**0 个**）
-   **indicators**（16 个）：`name1~4` / `value1~4` / `subValue1~4` / `level1~4` / `id` / `name` / `parent` / `num`
-   **`num` 字段**：控制单区域显示几个指标（1~4），未配置时使用 `indicatorStyle.showValueNumber`
-   **`levelX` 字段**：每行 `valueX` 对应的"等级"（0=高，1=中，2=低），值越小等级越高，配合 `areaLevelColor` 染色
-   **配套数据**：`map-config.json`（静态资源，含所有省/市/区县的 `adcode / id / name / level / parent / cp`）

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

-   任务 1：新增一个区域染色级别（如"非常严重 = 红色"）
-   任务 2：新增一种指标显示效果（如"第 5 个指标"）
-   任务 3：调整默认下钻地图（默认黑龙江）
-   任务 4：新增一种下钻交互（Window / WindowSelf）

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

⚠ **最重要的两条**：

1. `dataModel: ""` 是空字符串！`dataModel.json` 仍被 webpack 加载并 `import`，但物料元信息未声明 dataModel 路径。详见 [gotchas.md § 1](./gotchas.md)。
2. `index.jsx` 才是主入口，`map.jsx` 是子组件（虽然 `index.jsx` 看起来像个 wrapper）。详见 [gotchas.md § 2](./gotchas.md)。
