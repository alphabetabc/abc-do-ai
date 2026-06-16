---
title: textarea-label 数据契约
description: 文本域物料（textarea-label）的 dataModel.json 字段定义、数据契约、数据流向
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label 数据契约

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "textarea-label",
        "title": "文本域",
        "icon": "",
        "description": "",
        "author": "",
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "文本域",
                    "fieldName": "labelText",
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
| `labelText` | 文本域 | String | true | 文本内容 |

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
dataSource?.[0]?.labelText
    ↓
Input.TextArea 渲染
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "labelText": "文本内容" }
]
```

## 5. 扩展建议

### 5.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在组件中通过 `dataSource?.[0]?.fieldName` 读取
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 5.2 限制

- 数据源必须是数组格式
- 仅读取第一条数据（dataSource[0]）
