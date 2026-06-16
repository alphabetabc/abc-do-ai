---
title: 数据契约
description: 横向柱形图 dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/bidirectional-progress/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "bidirectional-progress",
        "title": "bidirectional-progress",
        "header": {
            "dimensions": [],
            "indicators": [
                { "fieldName": "label", "fieldLabel": "中间标题", ... },
                { "fieldName": "leftData", "fieldLabel": "左侧数据", ... },
                { "fieldName": "leftUnit", "fieldLabel": "左侧单位", ... },
                { "fieldName": "leftMax", "fieldLabel": "左侧最大值", ... },
                { "fieldName": "rightData", "fieldLabel": "右侧数据", ... },
                { "fieldName": "rightUnit", "fieldLabel": "右侧单位", ... },
                { "fieldName": "rightMax", "fieldLabel": "右侧最大值", ... }
            ]
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

当前无 dimensions 定义。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | 说明 |
| --------- | ---------- | -------- | ---- | ---- |
| `label` | 中间标题 | String | true | 显示在左右进度条中间的标题文本 |
| `leftData` | 左侧数据 | String | true | 左侧进度条的数据值（用于计算百分比） |
| `leftUnit` | 左侧单位 | String | true | 左侧数据值的单位文本 |
| `leftMax` | 左侧最大值 | String | true | 左侧进度条的基准最大值（用于百分比计算） |
| `rightData` | 右侧数据 | String | true | 右侧进度条的数据值 |
| `rightUnit` | 右侧单位 | String | true | 右侧数据值的单位文本 |
| `rightMax` | 右侧最大值 | String | true | 右侧进度条的基准最大值 |

> 所有字段的 `dataType` 均为 `String`，组件内部在计算百分比时会进行数值转换。

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource[]
    ↓
index.tsx (props.dataSource)
    ↓
从 dataSource[0] 解构 7 个字段
    ├── label → 中间标题渲染（→ component-logic.md § 2.2.3）
    ├── leftData / leftUnit / leftMax → 左侧 Progress（→ component-logic.md § 2.2.2）
    └── rightData / rightUnit / rightMax → 右侧 Progress（→ component-logic.md § 2.2.2）
```

**关键说明**：组件仅使用 `dataSource[0]`（第一条数据），不支持多条数据渲染。

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    {
        "label": "数据1",
        "leftData": 230,
        "leftUnit": "GB",
        "leftMax": 500,
        "rightData": 400,
        "rightUnit": "MB",
        "rightMax": 500
    }
]
```

## 5. 扩展建议

### 5.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加新字段
2. 在 `index.tsx` 中从 `dataSource[0]` 解构新字段
3. （如需 schema 面板）通过 `...header.indicators` 展开到数据面板

### 5.2 限制

- 不支持多维度（`dimensions` 为空数组）
- 仅使用 `dataSource[0]`，不支持多条数据渲染
- 所有字段 `dataType` 为 `String`，数值计算需组件内部转换
- `rowConfig.dimensionCount` 为 `"unknown"`，`isUseDimensionParams` 为 `false`
