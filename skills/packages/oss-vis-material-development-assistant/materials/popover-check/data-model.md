---
title: 数据契约
description: popover-check dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/popover-check/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "popover-check",
        "title": "下拉组件",
        "description": "下拉选择框，支持单选、多选",
        "header": {
            "dimensions": [],
            "indicators": [
                { "fieldName": "label", "fieldLabel": "显示名",   "dataType": "STRING",  "rowProperties": ["format"] },
                { "fieldName": "id",    "fieldLabel": "数据key", "dataType": "INTEGER", "rowProperties": ["format"] }
            ]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": "false"
        }
    }
}
```

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | 说明 |
| --- | --- | --- | --- |
| — | — | — | **本物料无维度字段**（`dimensions: []`） |

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
| --- | --- | --- | --- | --- | --- |
| `label` | 显示名 | STRING | — | `["format"]` | 选项显示文本，传给 `<Checkbox>{item.label}</Checkbox>` |
| `id` | 数据 key | INTEGER | — | `["format"]` | 选项唯一标识，传给 `<Checkbox id={item.id}>`，**实际接受字符串**（代码中无强类型校验） |

> **数据格式注意**：
> - `id` 字段类型声明为 `INTEGER`，但默认数据是字符串（`'id-01'`）
> - `rowProperties: ['format']` 表示该字段支持格式化（在数据面板可见格式化配置）
> - `dataType` 与实际值可能不一致，下游消费者需做容错

### 2.3 title 不一致问题

- `dataModel.json` 中 `title: "下拉组件"`
- `oss-material.json` 中 `title: "下拉选择框"`
- `doc/README.md` 中标题为 `"下拉选择框"`

> 详见 [gotchas.md § 4](./gotchas.md#4-datamodel-title-与-oss-materialjson-title-不一致)

## 3. 数据流向

```
外部数据源 / json 默认值
    ↓
dataConfig.json (dataSource: [{ id, label }, ...])
    ↓
index.jsx (props.dataSource = data)
    ↓
data.find((d) => d.id === id)              // 查找选中项
data.filter((d) => checkedItemId.includes(d.id))  // 过滤已选
data.map((d) => d.label)                   // 渲染 Checkbox 列表
    ↓
render: <Checkbox>{item.label}</Checkbox>
派发: select (id 数组) + selectLabel (label 数组)
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "id": "id-01", "label": "广东" },
    { "id": "id-02", "label": "广西" },
    { "id": "id-03", "label": "海南" },
    { "id": "id-04", "label": "河南" },
    { "id": "id-05", "label": "湖南" },
    { "id": "id-06", "label": "湖北" }
]
```

## 5. 字段使用情况

| dataModel 字段 | 组件读取位置 | 用途 |
| --- | --- | --- |
| `label` | `index.jsx` 第 145 行（`formatCheckedList`）、第 219 行（`<Checkbox>{item.label}</Checkbox>`） | 显示文本 |
| `id` | `index.jsx` 第 68 行（`data.find`）、第 215 行（`<Checkbox id={item.id}>`） | 唯一标识 + 派发 |

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在 `index.jsx` 的 `data.map((item) => <Checkbox>...)` 中读取新字段
3. （如需派发）在 `onChange` 中追加派发参数

### 6.2 限制

- 当前不支持嵌套选项（树形结构）
- 当前不支持分组（`<optgroup>`）
- 当前不支持搜索过滤

### 6.3 修复建议

> ⚠️ 仅记录在文档中，不在当前 PR 范围

**1. 修正 dataModel 字段类型一致性**
- `id` 字段类型 `INTEGER` 与实际字符串值不一致，建议改为 `STRING` 或在数据源做转换

**2. 同步 title 字段**
- 统一 `dataModel.title` 与 `oss-material.json.title` 为 `"下拉选择框"`
