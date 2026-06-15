---
title: 数据契约
description: free-layout-indicators-viewer dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-15
---

# 数据契约

源文件：`packages/free-layout-indicators-viewer/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "free-layout-indicators-viewer",
        "title": "free-layout-indicators-viewer",
        "icon": "",
        "description": "",
        "author": "",
        "header": {
            "dimensions": [],
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
>
> ⚠️ `dimensions: []` — **无维度**。

## 2. 字段说明

### 2.1 dimensions（维度）

**空数组**。该物料不依赖维度数据。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `indicatorId` | 指标id | String | true | format | **必填**，与 `points[].id` 匹配 |
| `indicatorName` | 指标名称 | String | true | format | 名称文本 |
| `indicatorValue` | 指标值 | String | true | format | 数字文本 |
| `indicatorUnit` | 单位 | String | true | format | 单位文本 |
| `indicatorType` | 类型（数据中可以没有字段） | String | true | format | ⚠️ 组件**未使用**，仅声明 |

> 💡 `dataType: 'String'` 是 dataModel 描述约定，`indicatorValue` 实际应是 number。

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.{api, sql, json, dataSet}
    ↓
dataSource[] (数组)
    ↓
index.tsx
    ↓
points = config.layout.points.map((point) => {
    dataItem = dataSource.find(item => item.indicatorId === point.id);
    if (!dataItem) return null;  // ← 找不到的点不渲染
    bgSetting = config.indicatorItemSetting.find(...);
    return { left, top, id, dataItem, bgSetting };
})
    ↓
IndItem (per point)
    ├─ dataItem.indicatorValue → StyledValueLinearGradient → DigitalNumber
    ├─ dataItem.indicatorUnit  → StyledUnitLinearGradient (作为 suffix)
    └─ dataItem.indicatorName  → StyledNameLinearGradient
```

## 4. 匹配规则

### 4.1 主匹配：点 ↔ 数据项

```typescript
// index.tsx:25
const dataItem = dataSource.find((item) => item.indicatorId === point.id);
if (!dataItem) return null;  // ⚠️ 不渲染
```

**严格匹配**：`point.id === dataItem.indicatorId`（字符串比较）。

**找不到数据时**：

- 该点**不渲染**（不抛错）
- 表现：背景图上少一个点

### 4.2 副匹配：点 ↔ 个性化背景

```typescript
// index.tsx:29
bgSetting = config.indicatorItemSetting.find((item) => {
    if (_.isNil(item.filterKey) || item.filterKey === '') return false;
    return (item.filterKey || '').split(',').includes(dataItem.indicatorId);
});
```

**`filterKey` 格式**：
- 多个 `indicatorId` 用**英文逗号**分隔
- 例：`"id-1,id-2,id-3"`

**找不到配置时**：

- `bgSetting = null`
- 该点**没有**独立背景图（仅用 layout 背景图）

## 5. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`（9 条）：

```json
[
    { "indicatorId": "id-1", "indicatorName": "应急人员", "indicatorValue": 115, "indicatorUnit": "个", "indicatorType": "" },
    { "indicatorId": "id-2", "indicatorName": "应急队伍出动数", "indicatorValue": 5, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-3", "indicatorName": "应急站点启用数", "indicatorValue": 11, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-4", "indicatorName": "应急通信车总数", "indicatorValue": 4, "indicatorUnit": "辆", "indicatorType": "" },
    { "indicatorId": "id-5", "indicatorName": "应急通信车再用数", "indicatorValue": 2, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-6", "indicatorName": "应急通信车闲置数", "indicatorValue": 2, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-7", "indicatorName": "油机总数", "indicatorValue": 999, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-8", "indicatorName": "油机再用数", "indicatorValue": 888, "indicatorUnit": "", "indicatorType": "" },
    { "indicatorId": "id-9", "indicatorName": "油机闲置数", "indicatorValue": 2, "indicatorUnit": "", "indicatorType": "" }
]
```

> 数据特征：
> - 9 行与默认 `points` 数组 9 项**一一对应**
> - `indicatorType` 字段**全部为空字符串**（说明组件确实不读这个字段）
> - `indicatorUnit` 部分为空（指标无单位）

## 6. 扩展建议

### 6.1 新增字段

1. **声明字段**（dataModel.json）：在 `indicators` 数组添加
   ```json
   {
       "dataType": "String",
       "fieldLabel": "新字段",
       "fieldName": "newField",
       "fieldUnit": "",
       "list": "true",
       "rowProperties": ["format"]
   }
   ```
2. **数据中填充**（dataConfig.json）：每行添加
3. **组件读取**（IndItem.tsx）：通过 `dataItem.newField`

### 6.2 限制

- **不支持多维度**：每个点只对应一个数据项
- **`indicatorType` 字段当前未使用**：建议从 dataModel 中移除，或扩展为"类型化样式"（如不同类型用不同颜色）
- **数据项必须包含所有 `points[].id`**：否则部分点不渲染
- **`filterKey` 解析用 `split(',')`**：注意前后空格、大小写

## 7. 跨文档引用

- 字段展开（`...header.dimensions + ...header.indicators`）→ [schema.md § 3](./schema.md#3-数据面板)
- 主匹配逻辑 → [component-logic.md § 2.2.2](./component-logic.md#222-坐标点匹配-points)
- 副匹配逻辑（filterKey）→ [component-logic.md § 2.2.2](./component-logic.md#222-坐标点匹配-points)
- 单指标渲染 → [component-logic.md § 3](./component-logic.md#3-单指标渲染器-inditemtsx)
