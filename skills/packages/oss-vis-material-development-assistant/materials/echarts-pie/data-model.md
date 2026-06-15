---
title: 数据契约
description: echarts-pie dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-15
---

# 数据契约

源文件：`packages/echarts-pie/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "echarts-pie",
        "header": {
            "dimensions": [...],
            "indicators": [...]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": false
        }
    }
}
```

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `dimension_name` | 维度名称 | String | true | `["format"]` | 饼图扇区的分类名称，对应 ECharts `series.data[].name` |

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `value` | 指标值 | String | true | `["format"]` | 饼图扇区的数值，对应 ECharts `series.data[].value` |
| `unit` | 指标单位 | String | true | `["format"]` | 数值单位（如"个"），组件中未直接使用 |
| `name` | 指标标题 | String | true | `["format"]` | 指标标题，组件中未直接使用 |
| `id` | 指标id | String | true | `["format"]` | 指标 ID，主要用于点击事件派发参数 |

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource[] (props.dataSource)
    ↓
options.ts (getOption)
    ↓
ECharts series.data[]
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "name": "传输原因", "value": 400, "unit": "个", "id": "" },
    { "name": "设备原因", "value": 300, "unit": "个", "id": "" },
    { "name": "停电原因", "value": 200, "unit": "个", "id": "" },
    { "name": "其他原因", "value": 100, "unit": "个", "id": "" }
]
```

## 5. 数据匹配规则

### 5.1 字段映射

数据面板 `DynamicData` 展开 `dimension_name`（维度）和 `value/unit/name/id`（指标），用户可拖拽字段映射：

| 数据源字段 | 映射到 | 用途 |
|------------|--------|------|
| `dimension_name` | `name` | 扇区名称 |
| `value` | `value` | 扇区数值 |
| `unit` | `unit` | 单位（组件未使用） |
| `name` | `name` | 标题（组件未使用） |
| `id` | `id` | 交互派发 |

### 5.2 排序规则

组件内部按 `value` 升序排列：

```javascript
data.sort((a, b) => a.value - b.value)
```

### 5.3 数据状态判断

```javascript
// 空数组视为成功（渲染空图表）
lodash.isArray(data) && data.length === 0 → true
// 首条有 value 视为有数据
Boolean(data?.[0]?.value) → true
```

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加新字段
2. 在 `options.ts` 中通过 `dataItem.xxx` 读取
3. 如需在 schema 面板中映射，`DynamicData` 的 `options.fields` 会自动展开

### 6.2 限制

- 仅支持**单维度**（`dimensionCount: "unknown"`），不支持多维度分组
- 不支持维度参数（`isUseDimensionParams: false`）
- `unit` 和 `name` 字段在组件代码中未实际使用，仅保留在 dataModel 中供数据映射
