---
title: 数据契约
description: digital-card dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-15
---

# 数据契约

源文件：`packages/digital-card/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "digital-card",
        "header": {
            "dimensions": [],
            "indicators": []
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": false
        }
    }
}
```

## 2. 字段说明

digital-card 的 `dataModel.json` 中 **dimensions 和 indicators 均为空数组**。

### 2.1 数据约定

组件实际使用的字段为硬编码约定，不通过 dataModel 映射：

| 字段 | 类型 | 说明 | 组件读取方式 |
|------|------|------|-------------|
| `label` | String | 标题文本 | `dataSource[0].label` |
| `value` | Number/String | 数值内容 | `dataSource[0].value` |

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource[] (props.dataSource)
    ↓
index.jsx (dataSource[0].label / dataSource[0].value)
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    {
        "label": "严重",
        "value": 0
    }
]
```

## 5. 数据匹配规则

### 5.1 字段映射

由于 dataModel 为空，数据面板 `DATA_CONFIG` 不提供字段拖拽映射功能。用户需手动输入符合 `{ label, value }` 格式的 JSON 数据。

### 5.2 单条数据

组件仅读取 `dataSource[0]`，多余数据被忽略。

### 5.3 空值风险

组件直接访问 `dataSource[0].label` 和 `dataSource[0].value`，**无空值保护**。如果 `dataSource` 为空数组或 `undefined`，会触发运行时错误。

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加新字段（如 `unit` 单位字段）
2. 在 `index.jsx` 中通过 `dataSource[0].xxx` 读取
3. 如需在 schema 面板中映射，需将 `DATA_CONFIG` 替换为 `DynamicData` 并展开 fields

### 6.2 限制

- 不支持多数据项（仅读取第一条）
- 不支持维度/指标映射（dataModel 为空）
- 无空数据保护
