---
title: 数据契约
description: echarts-map dataModel.json 字段定义、数据契约、自管数据源匹配规则
version: 1.0.0
last_updated: 2026-09-17
---

# 数据契约

源文件：`packages/echarts-map/dataModel.json`

> ⚠️ **`oss-material.json.dataModel` 字段是空字符串 `""`！** 但 `dataModel.json` 仍会被 webpack 加载并在 `schema.ts` 顶部被 `import`。详见 [gotchas.md § 1](./gotchas.md)。

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "echarts-map",
        "title": "echarts-map",
        "icon": "",
        "description": "echarts平面地图",
        "author": "孙寰哲",
        "header": {
            "dimensions": [],
            "indicators": [ ... 16 个字段 ... ]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": false
        }
    }
}
```

| 顶层字段 | 值 | 说明 |
|---------|------|------|
| `name` / `title` | `echarts-map` | 物料唯一标识 |
| `icon` | `""` | 空（用 thumbnail `oss-chart-ec-map.png`） |
| `description` | `echarts平面地图` | 描述 |
| `author` | `孙寰哲` | 维护者 |
| `header.dimensions` | `[]` | **无维度**（地图不需要维度） |
| `header.indicators` | `[16 项]` | 详见 § 3 |
| `rowConfig.dimensionCount` | `"unknown"` | 维度数量未知 |
| `rowConfig.isUseDimensionParams` | `false` | 不支持维度参数 |

## 2. ⚠️ 重要：自管数据源（不走 props.dataSource）

与 `echarts-bar` 等物料**不同**，echarts-map 的数据**不通过 `props.dataSource` 注入**：

```jsx
// map.jsx:50
const [dataSource, setDataSource] = useState([]);
// ...
api.customDataSourceApi(dataType, { config, cancel }).then((res) => {
    setDataSource(_.get(res, 'data.data') || _.get(res, 'data.viewItemData.rows'));
});
```

数据流向：

```
用户配置 customDataSourceApiConfig.dataType + ${dataType}.params
    ↓
api.buildCustomApiParams（合并 receivedPropsParams + customDataSourceApiParams + innerApiParams）
    ↓
api.customDataSourceApi（实际请求）
    ↓
setDataSource → convertData → getOption
```

**`dataModel.json` 的字段仅作为字段说明**，真正下发时通过 `customDataSourceApiConfig` 在数据面板自行配置（详见 [schema.md § 3](./schema.md#3-数据面板)）。

## 3. 字段说明

### 3.1 dimensions（维度）

**无维度**（`[]`），地图不需要维度。

### 3.2 indicators（指标）

#### 3.2.1 指标值相关（4 组 × 3 个 = 12 个字段）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `name1` | name1 | String | true | format | 第 1 个指标名称 |
| `value1` | 数值1 | String | true | format | 第 1 个指标主值 |
| `subValue1` | 子数值1 | String | true | format | 第 1 个指标副值（用 `subValueDecoration` 装饰） |
| `name2` | name2 | String | true | format | 第 2 个指标名称 |
| `value2` | 数值2 | String | true | format | 第 2 个指标主值 |
| `subValue2` | 子数值2 | String | true | format | 第 2 个指标副值 |
| `name3` | name3 | String | true | format | 第 3 个指标名称 |
| `value3` | 数值3 | String | true | format | 第 3 个指标主值 |
| `subValue3` | 子数值3 | String | true | format | 第 3 个指标副值 |
| `name4` | name4 | String | true | format | 第 4 个指标名称 |
| `value4` | 数值4 | String | true | format | 第 4 个指标主值 |
| `subValue4` | 子数值4 | String | true | format | 第 4 个指标副值 |

**说明**：
- **每组指标由 3 个字段组成**：`nameN` / `valueN` / `subValueN`。
- **默认最多显示 3 组**（`indicatorStyle.showValueNumber ?? 3`），最多 4 组。
- 每行数据可通过 `num` 字段覆盖显示数量（见 § 3.2.3）。
- `enableValueFieldExchange` 可把 `valueN` 和 `subValueN` 互换显示。

#### 3.2.2 级别色字段（4 个：`level1` ~ `level4`）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `level1` | 级别1 | String | true | format | 区域填色级别（与 `areaLevelColor` 匹配） |
| `level2` | 级别2 | String | true | format | 区域填色级别 |
| `level3` | 级别3 | String | true | format | 区域填色级别 |
| `level4` | 级别4 | String | true | format | 区域填色级别 |

**说明**：
- 仅在 `mapStyle.enableAreaColorLevelControl = true` 时启用。
- `getHighestLevel(d)` 取 `level1~4` 中**最小**的非零数字（值越小等级越高）。
- 匹配 `areaLevelColor.colorField`（同样要 `_.toString` 比较）。

#### 3.2.3 区域定位字段（4 个）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `id` | 地市或区县id | String | true | format | 区域的 mapConfig.id（**必需**，用于 `convertData` 过滤） |
| `name` | 地市或区县名称 | String | true | format | 区域名称（**必需**，点击事件回查） |
| `parent` | 父级id,省id或地市id | String | true | format | 父级 id（**必需**，用于过滤当前层级的子区域） |
| `num` | 气泡数值显示个数 | String | true | format | **覆盖** `indicatorStyle.showValueNumber`（每行可独立控制显示几组指标） |

### 3.3 字段总览

| 分类 | 字段数 | 字段名 |
|------|--------|--------|
| 指标值 | 12 | `name1/2/3/4`, `value1/2/3/4`, `subValue1/2/3/4` |
| 级别色 | 4 | `level1/2/3/4` |
| 区域定位 | 4 | `id`, `name`, `parent`, `num` |
| **合计** | **20** | （共 20 个 indicators，0 个 dimensions） |

> ⚠️ **dataModel 注释里写的是 16 个指标**，实际数下来是 **20 个**（其中 4 个是 `level1~4`）。如果对账时按 16 数会出错。

## 4. 数据流向

```
外部数据源（API / JSON / SQL）
    ↓
customDataSourceApiConfig.dataType + ${dataType}.params
    ↓
api.buildCustomApiParams（合并 receivedPropsParams / customDataSourceApiParams / innerApiParams）
    ↓ SYMBOL_DATA_SOURCE_SWITCH 占位符替换为 dataSourceSwitch.status
api.customDataSourceApi(dataType, { config, cancel })
    ↓
setDataSource([{ id, name, parent, num, name1~4, value1~4, subValue1~4, level1~4, ... }])
    ↓
convertData(dataSource, currentId)（过滤 parent === currentId 并补经纬度）
    ↓
getOption(config.geo, data, mapName, { mapConfig })
    ↓
    ├─ convertColorMapOption（level 着色 + ORIGINAL_DATA_KEY 注入）
    ├─ 引线模式：拆 data/points/lines
    └─ 气泡 series.formatter（组装 1~4 组 name/value/subValue）
    ↓
ReactECharts → ECharts 实例
```

### 4.1 关键转换

#### 4.1.1 `convertData`（map.jsx:133）

```jsx
const convertData = (data, currentId) => {
    const filter = _.filter(data, (item) => [currentId, `${currentId}`, Number(currentId)].includes(item.parent));
    const res = _.map(filter, (item) => {
        if (item.lon && item.lat) {
            return { ...item, value: [item.lon, item.lat] };
        } else {
            const geoCoord = _.find(mapConfig, { id: String(item.id) });
            if (!geoCoord) console.log('下钻地图 mapConfig 数据缺失', String(item.id));
            return { ...item, value: geoCoord?.cp || [0, 0] };
        }
    });
    return res;
};
```

**关键点**：
- 用 `parent` 过滤当前层级的子区域（同时支持 number/string 类型）。
- 优先用数据中的 `lon/lat`，否则从 `map-config.json` 的 `cp`（经纬度中心点）查。

#### 4.1.2 `ORIGINAL_DATA_KEY` 注入（options.ts）

```typescript
[ORIGINAL_DATA_KEY]: d,
```

`ORIGINAL_DATA_KEY = '[$$$_###__ORIGINAL_DATA_###_$$$$$$$]'`，注入到 `colorMapOption.data[i]` 上，**点击时通过 `item.data[ORIGINAL_DATA_KEY]` 还原原始数据**。

### 4.2 点击事件可访问的字段

```jsx
// map.jsx onItemClick
let dataItem = item.data?.[ORIGINAL_DATA_KEY] ?? item.data;
if (!dataItem && _.isArray(dataSource)) {
    dataItem = dataSource.find((d) => d.name === item.name);
}
drilldown(props, dataItem || {}, 'clickEvent');
```

- **优先**从 `item.data[ORIGINAL_DATA_KEY]` 取（colorMapOption series）
- **其次**从 `item.data` 取（气泡 series 直接穿透原始数据）
- **最后**从 `dataSource.find(d => d.name === item.name)` 反查

| 字段 | 来源 | 派发到 |
|------|------|--------|
| `id` | `mapCfg.id`（dispatchParams）或 `dataItem.id`（drilldown） | `interaction.defined.onClickId` |
| `name` | `mapCfg.name` 或 `dataItem.name` | `interaction.defined.onClickName` |
| `level` | `mapCfg.level` → `ZoneLevelEnum[...]` | `interaction.defined.onClickLevel` |

## 5. 默认数据示例

`customDataSourceApiConfig` 中没有硬编码的默认数据，**真正的默认 demo 数据由 schema.ts 的 `interactions.configurableEvent.clickEvent.dataConfig` 控制**（如果有）。

物料本身**没有静态默认数据**，首次拖入时地图可能为空（需要先配置 `mapsettings.mapName`）。

## 6. map-config.json（区域字典）

虽然不在 dataModel.json 里，但地图渲染**强依赖** `${STATIC_PATH}/map/map-config.json`：

```json
[
    {
        "id": "110000",
        "adcode": 110000,
        "name": "北京市",
        "alias": "北京",
        "level": "province",
        "parent": "100000_JD",
        "cp": [116.405285, 39.904989]
    },
    // ...
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 与 `dataModel.parent` 配对的父级 id |
| `adcode` | number | 国家行政区划编码 |
| `name` | string | 区域名称（用于 `currentName`） |
| `alias` | string | 区域别名 |
| `level` | string | `province` / `city` / `district` |
| `parent` | string | 父级 adcode（区县下钻时用） |
| `cp` | [lon, lat] | 经纬度中心点（无 lon/lat 时兜底） |

底图文件 `${STATIC_PATH}/map/${level}/${adcode}.json` 也是必需的。

## 7. 扩展建议

### 7.1 新增指标值字段（5/6/...）

物料硬编码最多 4 组指标（`name1~4`、`value1~4`、`subValue1~4`、`level1~4`），新增第 5 组需要：

1. **dataModel.json**：在 `indicators` 数组添加 `name5/value5/subValue5/level5`
2. **options.ts `formatter`**：添加 `if (showValueNumber > 4) ...` 分支
3. **schema.ts 选项 ③ 区域气泡**：放开 `showValueNumber` 最大值限制

### 7.2 新增其他字段

- **声明字段**（dataModel.json）：在 `indicators` 数组添加
- **数据中填充**（customDataSourceApi 接口返回）：添加新字段
- **组件读取**（options.ts / map.jsx）：通过 `data[i].xxx` 访问

### 7.3 限制

- **无维度**：地图没有维度概念，所有字段都在 indicators
- **最多 4 组指标**：formatter 写死 4 个分支
- **每行可独立控制指标数量**：`num` 字段优先于 `showValueNumber` 配置
- **dataModel 未在 oss-material.json 声明路径**：`dataModel: ""` 是空字符串

## 8. 跨文档引用

- 字段展开（`...header.indicators`）→ [schema.md § 3（数据面板）](./schema.md#3-数据面板)
- 组件读取（`convertData` / `getOption` / `formatter`）→ [component-logic.md § 3.3.4 / § 4.2](./component-logic.md)
- 点击事件字段映射（`ORIGINAL_DATA_KEY`）→ [component-logic.md § 3.3.6](./component-logic.md#336-点击事件-onitemclick)
- 数据源切换占位符 → [component-logic.md § 3.3.1](./component-logic.md#331-自管数据-getdatasource)