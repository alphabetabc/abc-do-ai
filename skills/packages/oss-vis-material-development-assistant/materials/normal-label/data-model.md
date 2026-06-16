---
title: 数据契约
description: 基础标签 dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/normal-label/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "normal-label",
        "title": "normal-label",
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "文本",
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

无 dimensions 定义。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
| --------- | ---------- | -------- | ---- | ------------- | ---- |
| `labelText` | 文本 | String | true | `["format"]` | 标签显示的文本内容 |

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
dataSource[0].labelText → 渲染为 <span> 文本内容
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

1. 在 `dataModel.json` 的 `indicators` 数组添加新字段
2. 在 `index.tsx` 中通过 `dataSource[0].xxx` 读取
3. 如需在 schema 面板中引用，通过 `...header.indicators` 展开

### 5.2 限制

- 当前仅支持 1 个 indicator 字段（`labelText`），组件仅读取 `dataSource[0]`
- 不支持 dimensions（维度），无法按维度分组展示
- 不支持多行数据展示（仅取数组第 0 项）
- `dimensionCount` 为 `"unknown"`，`isUseDimensionParams` 为 `false`
