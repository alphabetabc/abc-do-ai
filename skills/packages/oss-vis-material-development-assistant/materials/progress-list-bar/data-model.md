---
title: progress-list-bar 数据契约
description: 水平进度图物料（progress-list-bar）的 dataModel.json 字段定义、数据契约、数据流向
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar 数据契约

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "progress-list-bar",
        "title": "progress-list-bar",
        "icon": "",
        "description": "progress-list-bar",
        "author": "",
        "page": false,
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "标签",
                    "fieldName": "label",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                },
                {
                    "dataType": "Number",
                    "fieldLabel": "值",
                    "fieldName": "value",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                },
                {
                    "dataType": "String",
                    "fieldLabel": "单位",
                    "fieldName": "unit",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                }
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

无维度字段。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | 说明 |
| --- | --- | --- | --- | --- |
| `label` | 标签 | String | true | 进度条标签 |
| `value` | 值 | Number | true | 进度条值（百分比） |
| `unit` | 单位 | String | true | 进度条单位 |

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource（数组）
    ↓
index.tsx (props.dataSource)
    ↓
RowItem.tsx (item)
    ↓
渲染
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "label": "标签1", "value": 50, "unit": "%" },
    { "label": "标签2", "value": 70, "unit": "%" },
    { "label": "标签3", "value": 30, "unit": "%" }
]
```

## 5. 扩展建议

### 5.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在组件中通过 `item.fieldName` 读取
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 5.2 限制

- 数据源必须是数组格式
- `value` 字段必须是数字类型（百分比）
