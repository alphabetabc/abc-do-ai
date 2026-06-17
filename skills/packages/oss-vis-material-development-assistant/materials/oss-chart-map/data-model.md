---
title: 数据契约
description: oss-chart-map dataModel.json + types.ts + map-config.json + 转换规则
version: 1.0.0
last_updated: 2026-06-17
---

# 数据契约

`oss-chart-map` 涉及 3 套数据契约：

1. **`dataModel.json`** — 物料侧 `dataConfig.fields` 字段定义（9 个核心字段，运行时可被用户配置映射）
2. **`types.ts`** — TS 类型（`ResponseMapDataType` / `ViewMapDataType` / `MapconfigType`）
3. **`map-config.json`** — **外部静态资源**（区域字典，含 `adcode / level / cp / parent / id / name / alias`），不通过 `dataConfig` 流入，需独立部署

## 1. 顶层结构（`dataModel.json`）

```json
{
    "dataModelDefinition": {
        "name": "oss-chart-map",
        "title": "基础平面地图",
        "icon": "",
        "description": "power by @oss-chart/map",
        "author": "",
        "header": {
            "dimensions": [],
            "indicators": [/* 14 个 */]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": false
        }
    }
}
```

> 注：物料 `name` 字段为 `oss-chart-map`（与 `oss-material.json.name = "oss-chart-ec-map"` 不一致，此处为 dataModel 的独立标识）。

## 2. 字段说明

### 2.1 dimensions（维度）

**`[]`（空数组）**——地图物料不适用维度概念，所有数据均为指标。

### 2.2 indicators（指标，14 个）

| fieldName | fieldLabel | dataType | list | rowProperties | 必读场景 | 说明 |
|-----------|-----------|----------|------|---------------|----------|------|
| `id` | id | `string` | `true` | `['format']` | 全部 | 区域 ID（与 `map-config.json` 中 `id` 对应） |
| `name` | name | `string` | `true` | `['format']` | 全部 | 区域名称 |
| `value` | value | `string` | `true` | `['format']` | 全部 | 业务值（板块地图用于 visualMap 染色；散点用于气泡大小/颜色） |
| `lon` | lon | `string` | `true` | `['format']` | 散点 / 飞线 | 经度（缺省时回退 `map-config.json` 中 `cp[0]`） |
| `lat` | lat | `string` | `true` | `['format']` | 散点 / 飞线 | 纬度（缺省时回退 `map-config.json` 中 `cp[1]`） |
| `unit` | 单位 | `string` | `true` | `['format']` | 备用 | 单位（组件**未读取**，预留字段） |
| `level` | 级别 | `string` | `true` | `['format']` | 飞线 / colormap | 告警级别或区域等级；`layer.path.colormap.colors` 按此字段染色 |
| `targetId` | targetId | `string` | `true` | `['format']` | 飞线 | 飞线对端 ID（**支持逗号分隔**多端） |
| `isCenter` | isCenter | `string` | `true` | `['format']` | 飞线 | 是否为中心点（`'1'` / `true` / `1`），决定是否用 `toCenterColor` |
| `type` | 类型 | `string` | `true` | `['format']` | 派发 | 派发参数中的 `type` 字段映射 |
| `item_label_xx` | 指标_名称_xx | `string` | `true` | `['format']` | 板块 tooltip / 分组散点 | 指标名称（`xx` = 任意后缀，如 `total` / `5G`） |
| `item_value_xx` | 指标_值_xx | `string` | `true` | `['format']` | 板块 tooltip / 分组散点 | 指标值 |
| `item_id_xx` | 指标_id_xx | `string` | `true` | `['format']` | 分组散点派发 | 指标 ID（用于 `groupItemId` 派发映射） |
| `item_level_xx` | 指标_level_xx | `string` | `true` | `['format']` | 分组散点 | 指标等级 |

> ⚠️ **`item_*` 字段为"开放式"字段**——后缀 `xx` 由用户自定义（如 `5G` / `total` / `4G_ot`）。组件通过正则 `/^(item_((label)|(value)|(id)|(level)){1}_)/` 匹配。
>
> ⚠️ **`_format` 后缀字段会被忽略**——`DynamicData` 自动生成的 `format` 副本不进入散点/板块 tooltip 逻辑。

## 3. `dataConfig.fields` vs `dataModel.json.indicators`

**两者不完全一致**：

| 来源 | 字段数 | 差异 |
|------|--------|------|
| `dataModel.json.indicators` | 14 | 包含 `item_*` 4 个 |
| `schema.ts` 的 `dataConfig.fields` | 9 | **不包含** `item_*` |

`dataConfig.fields` 列出的是用户在数据源映射面板中**实际可选的字段**；`item_*` 字段由物料通过正则自动识别，无需用户手动映射。

> 修改字段时**两边都要同步**（如新增 `xxx` 字段）。

## 4. TS 类型（`types.ts`）

### 4.1 服务端数据 `ResponseMapDataType`

```typescript
interface IResponseMapDataItem {
    id: string;
    name: string;
    value: string;
    lon: string | number;  // 经度
    lat: string | number;  // 纬度
    level: string | number;  // 级别
    unit?: string;
    targetId?: string | number;  // 飞线对端
    isCenter?: '0' | '1' | boolean;  // 是否中心点
    type?: string | number;  // 类型
    [extraProp: string]: any;  // 开放字段（含 item_*）
}
type ResponseMapDataType = IResponseMapDataItem[];
```

### 4.2 视图渲染数据 `ViewMapDataType`

```typescript
interface IViewMapDataItem {
    source: string;
    target: string;
    coords: Array<[number, number]>;  // [[sourceLon, sourceLat], [targetLon, targetLat]]
    toCenter: boolean;  // 业务字段
    [extraProp: string]: any;
}
type ViewMapDataType = IViewMapDataItem[];
```

> **飞线图专用**：`layer-opt-lines.ts` 的 `linesDataBuilder` 把 `ResponseMapDataType` 转换为 `ViewMapDataType`。

### 4.3 区域配置 `MapconfigType`

```typescript
type MapconfigItemType = {
    name: string;  // 名称
    alias: string;  // 别名（findMapCfg 备选匹配）
    adcode: string | number;  // 行政区划代码
    level: 'country' | 'district' | 'city';  // 所属图层等级
    cp: number[] | string[];  // 中心点
    parent: string | number;  // 父级区域 adcode
    id: string | number;  // 服务端映射的 id（与 dataSource.id 对应）
};
type MapconfigType = MapconfigItemType[];
```

> 来自外部静态资源 `map-config.json`（不通过 `dataConfig` 流入）。

## 5. 数据流向

```
┌─────────────────────────────────────────────┐
│ 外部数据源（用户配置 / API / 静态 JSON）        │
└─────────────────────────────────────────────┘
    ↓ dataConfig（DynamicData 映射）
dataSource: IResponseMapDataItem[]   ← 来自 props.dataSource
    ↓ mapUtils.findMapCfg(mapConfig, d)
    ↓ （补全 regionName/regionId/regionType/zoneLevel 等）
    ↓ scatterDataBuilder / linesDataBuilder / pathDataBuilder
ViewMapDataType[] | path.data[] | scatter.data[]
    ↓
┌─────────────────────────────────────────────┐
│ ECharts series（layerRenderer）                │
│  + DOM 自定义图层（LayerSingleDomScatter /   │
│                    LayerGroupDomScatter）      │
└─────────────────────────────────────────────┘
```

**关键工具**：

- `mapUtils.findMapCfg(mapConfig, { id, name })`：根据 `id`（优先）或 `name` / `alias`（备选）从 `map-config.json` 中找到区域配置，并计算 `regionType` / `lowerRegionType` / `upperRegionType` / `zoneLevel` / `lowerZoneLevel` / `upperZoneLevel`
- `mapUtils.assignOriginData(data, origin)`：通过 `Symbol` 注入原始数据，便于 tooltip / 点击时回查
- `mapUtils.getOriginData(item)`：取回 `assignOriginData` 注入的原始数据
- `mapUtils.isTrue(v)`：宽松布尔判定 `['1', true, 1]`
- `mapUtils.stringCfgToArr(v, formatter)`：逗号分隔字符串转数组（用于 `lineSymbolSize` 等 `'30,30'` 形式）

## 6. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```typescript
[
    { id: '-1139861561', name: '北京', value: '100', lon: '116.405285', lat: '39.904989', targetId: '354339340', isCenter: '1', level: '1' },
    { id: '354339340', name: '上海', value: 100, lon: '121.472644', lat: '31.231706', targetId: '-1139861561', level: '3' },
    { id: '-1308712042', name: '浙江', value: 100, lon: '120.153576', lat: '29', targetId: '-1139861561', level: '2' },
    { id: '1059902420', name: '四川', value: 10, lon: '103', lat: '30.659462', targetId: '-1139861561', level: '4' },
]
```

**4 条数据覆盖 3 种场景**：

- 北京：`isCenter = '1'`（飞线中心点）
- 上海：`targetId = '-1139861561'`（飞线对端 → 北京）
- 浙江 / 四川：作为 `source` 端

**`map-config.json` 默认（需确保部署）**：

需包含至少以下 4 个区域的记录（`id` 与默认数据一致）：

```json
[
    { "name": "北京", "alias": "北京", "adcode": "110000", "level": "city", "cp": [116.405285, 39.904989], "parent": "100000", "id": "-1139861561" },
    { "name": "上海", "alias": "上海", "adcode": "310000", "level": "city", "cp": [121.472644, 31.231706], "parent": "100000", "id": "354339340" },
    { "name": "浙江", "alias": "浙江", "adcode": "330000", "level": "province", "cp": [120.153576, 30.287459], "parent": "100000", "id": "-1308712042" },
    { "name": "四川", "alias": "四川", "adcode": "510000", "level": "province", "cp": [102.692301, 30.674401], "parent": "100000", "id": "1059902420" }
]
```

## 7. 外部静态资源 `map-config.json`

### 7.1 加载方式

`index.tsx` 通过 `designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL, () => loadJSON(...))` 加载：

- **路径**：`{STATIC_PATH}/map/map-config.json`（通常为 `https://your-cdn.com/static/map/map-config.json`）
- **缓存 key**：`CACHE_KEY.EC_MAP_CONFIG_SYMBOL`（来自 `@Src/common/constants`）
- **缓存策略**：跨实例共享 promise，**不会重复请求**

### 7.2 字段必填项

| 字段 | 必填 | 用途 |
|------|------|------|
| `id` | ✅ | 与 `dataSource.id` 对应 |
| `name` | ✅ | 地区名称 |
| `alias` | 推荐 | 备选匹配（重名地区） |
| `adcode` | ✅ | 行政区划代码 |
| `level` | ✅ | `country` / `province` / `city` / `district` |
| `cp` | ✅ | 中心点（散点缺 `lon/lat` 时回退） |
| `parent` | ✅ | 父级 `adcode`（用于下钻关系） |

### 7.3 `regionType` / `zoneLevel` 映射（自动计算）

由 `mapUtils.findMapCfg` 内部计算，**不需要**在 `map-config.json` 中写：

| level | regionType | zoneLevel |
|-------|------------|-----------|
| `country` | `'10004'` | `4` |
| `district` | `'10004'` | `4` |
| `city` | `'10003'` | `3` |
| `province` | `'10000'` | `2` |

> ⚠️ 看起来 `country` 与 `district` 都映射到 `10004/4`——这是当前实现，请勿修改。修改需同步修改 `common/constants.ts` 的 `REGION_TYPE_ENUMS` / `ZoneLevelEnum`。

## 8. 扩展建议

### 8.1 新增字段

1. **静态字段**（如新增 `desc` 描述）：
    - 在 `dataModel.json.indicators` 添加 `desc`
    - 在 `schema.ts` 的 `dataConfig.fields` 添加 `desc`（9 个核心字段之一）
    - 组件中通过 `dataItem.desc` 读取
2. **`item_*` 后缀动态字段**（如新增 `item_color_xx`）：
    - 无需修改 `dataModel.json` / schema
    - 修改 `custom-layer/layer-dom/group-scatter/index.tsx` 的 `reg` 正则，添加 `(color)` 分支
    - 修改 `options/layer-opts/layer-opt-path.ts` 的 `style.tooltip.formatter` 识别新前缀

### 8.2 限制

- **不支持维度**：所有数据均为平铺数组，**多维度 / 钻取型数据**需在数据源侧预处理
- **不支持维度参数**：`rowConfig.isUseDimensionParams = false`
- **`item_*` 字段不参与数据源映射面板**：用户需在数据源侧保证字段名以 `item_` 开头

## 9. 维护历史

| 日期 | 变更 | 原因 |
|------|------|------|
| 2022-11-14 | 0.0.1 创建 dataModel | 初始化 |
| 2026-06-17 | 文档化 | 5+1 文档补全 |
