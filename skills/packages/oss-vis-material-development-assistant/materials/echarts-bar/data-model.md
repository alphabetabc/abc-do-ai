---
title: 数据契约
description: echarts-bar dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-15
---

# 数据契约

源文件：`packages/echarts-bar/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "echarts-bar",
        "title": "echarts-bar",
        "icon": "",
        "description": "",
        "author": "hyy",
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

> ⚠️ `oss-material.json.dataModel` 字段是**空字符串** `""`！`dataModel.json` 仍会被 webpack 加载并在 schema.ts 顶部被 `import`，但物料元信息未声明 dataModel 路径。

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `dimensionName` | 维度名称(Y轴) | String | true | format | Y 轴类目，**会 `_.uniq` 去重** |
| `compareType` | 对比维度(分类数据) | String | true | format | 多系列分组键，**可选**；存在时按此分组生成 series |

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `indicatorId` | 指标Id(联动参数) | String | true | format | 联动 ID（点击事件 `onClickId` 派发来源） |
| `indicatorValue` | 指标值(Y轴数据) | String | true | format | Y 轴数据值，**ECharts 数值** |
| `indicatorUnit` | 指标单位 | String | true | format | 单位（当前组件**未使用**此字段） |

> 💡 `dataType: 'String'` 是 dataModel 描述约定，实际数据可以是 number（如默认值的 `indicatorValue: 15`）。

## 3. 数据流向

```
外部数据源（API / JSON / SQL）
    ↓
dataConfig.dataSet / dataConfig.json / dataConfig.api
    ↓
dataSource[] (数组)
    ↓
index.tsx (props.dataSource)
    ↓
isSuccess 判断 → DataStatus
    ↓
options.ts → getOption(config, data)
    ↓
多系列：_.groupBy(data, 'compareType')
单系列：直接使用
    ↓
series.data = [{ value: item.indicatorValue, __rawData__: item }]
    ↓
ReactECharts → ECharts 实例
```

### 3.1 关键转换

```typescript
// options.ts:149
data: convertData.map((item) => ({ value: item.indicatorValue, __rawData__: item })),
```

`__rawData__` 是 ECharts 不识别的"私有字段"，**会被 ECharts 自动忽略**但保留在数据对象上，用于点击事件读取原始数据。

### 3.2 点击事件可访问的字段

```typescript
// index.tsx:15
const { data } = chartObj; // { value, __rawData__: { dimensionName, compareType, indicatorId, indicatorValue, ... } }

// 所以:
data.id    // ❌ undefined（__rawData__ 上没有 id 字段！）
data.name  // dimensionName（ECharts 默认）
data.value // indicatorValue
```

⚠️ **当前 dataModel 没有 `id` 字段**，所以 `onClickId` 派发实际为 `undefined`！如需启用 ID 联动，需要在 dataModel.indicators 中加 `id` 字段并在数据中填充。

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "dimensionName": "2G", "compareType": "小区数(万)", "indicatorId": 1, "indicatorValue": 15, "unit": "万" },
    { "dimensionName": "4G", "compareType": "小区数(万)", "indicatorId": 1, "indicatorValue": 13, "unit": "万" },
    { "dimensionName": "5G", "compareType": "小区数(万)", "indicatorId": 1, "indicatorValue": 18, "unit": "万" },
    { "dimensionName": "2G", "compareType": "基站数(万)", "indicatorId": 1, "indicatorValue": 8,  "unit": "万" },
    { "dimensionName": "4G", "compareType": "基站数(万)", "indicatorId": 1, "indicatorValue": 10, "unit": "万" },
    { "dimensionName": "5G", "compareType": "基站数(万)", "indicatorId": 1, "indicatorValue": 16, "unit": "万" }
]
```

数据特征：
- **6 行** → 3 个 Y 轴类目（2G/4G/5G）× 2 个系列（小区数/基站数）
- `compareType` 存在 → 走多系列分支
- `unit` 字段在默认数据中（手写）但**未在 dataModel 中声明**

## 5. 扩展建议

### 5.1 新增字段

1. **声明字段**（dataModel.json）：在 `indicators` / `dimensions` 数组添加
   ```json
   {
       "dataType": "String",
       "fieldLabel": "指标ID",
       "fieldName": "id",
       "fieldUnit": "",
       "list": "true",
       "rowProperties": ["format"]
   }
   ```
2. **数据中填充**（dataConfig.json）：每行添加 `id` 字段
3. **组件读取**（options.ts / index.tsx）：通过 `__rawData__.id` 访问

### 5.2 限制

- **不支持多维度**：Y 轴只用一个 `dimensionName`，无多维度联动
- **不支持维度参数**：`rowConfig.isUseDimensionParams: false`
- **`indicatorUnit` 字段当前未使用**：建议从 dataModel 中移除或扩展渲染
- **多系列判断只看第一行**：`data[0].compareType`，混合数据可能误判

## 6. 跨文档引用

- 字段展开（`...header.dimensions + ...header.indicators`）→ [schema.md § 5（数据面板）](./schema.md#5-默认值参考)
- 组件读取 → [component-logic.md § 3.2.6](./component-logic.md#326-多系列-vs-单系列)
- 点击事件字段映射 → [component-logic.md § 2.2.1](./component-logic.md#221-点击事件-onitemclick)
