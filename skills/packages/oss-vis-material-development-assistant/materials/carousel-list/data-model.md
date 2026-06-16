---
title: carousel-list 数据契约
description: 轮播列表(垂直)物料（carousel-list）的 dataModel.json 字段定义、数据契约、数据流向
version: 1.0.0
last_updated: 2026-06-16
---

# carousel-list 数据契约

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "carousel-list",
        "title": "轮播列表(垂直)",
        "icon": "",
        "description": "",
        "author": "",
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "ID",
                    "fieldName": "id",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                },
                {
                    "dataType": "String",
                    "fieldLabel": "名称",
                    "fieldName": "name",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                },
                {
                    "dataType": "String",
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
| `id` | ID | String | true | 行数据 ID |
| `name` | 名称 | String | true | 行数据名称 |
| `value` | 值 | String | true | 行数据值 |
| `unit` | 单位 | String | true | 行数据单位 |

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource（数组）
    ↓
index.jsx (props.dataSource)
    ↓
渲染列表
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "id": "1", "name": "语音专线", "value": 99.99, "unit": "%" },
    { "id": "2", "name": "物联网专线", "value": 18, "unit": "%" },
    { "id": "3", "name": "数据专线", "value": 32, "unit": "%" },
    { "id": "4", "name": "互联网专线", "value": 15, "unit": "%" },
    { "id": "5", "name": "短彩信专线", "value": 15, "unit": "%" }
]
```

## 5. 扩展建议

### 5.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在组件中通过 `item.fieldName` 读取
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 5.2 限制

- 数据源必须是数组格式
- `id` 和 `name` 字段用于交互派发
