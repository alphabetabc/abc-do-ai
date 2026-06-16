---
title: 数据契约
description: top-rank dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/top-rank/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "top-rank",
        "title": "top-rank",
        "header": {
            "dimensions": [],
            "indicators": [
                { "fieldName": "id",    "fieldLabel": "id",    "dataType": "string", "rowProperties": ["format"] },
                { "fieldName": "name",  "fieldLabel": "name",  "dataType": "string", "rowProperties": ["format"] },
                { "fieldName": "value", "fieldLabel": "value", "dataType": "string", "rowProperties": ["format"] },
                { "fieldName": "unit",  "fieldLabel": "unit",  "dataType": "string", "rowProperties": ["format"] }
            ]
        }
    }
}
```

> **注意**：`description` / `author` 为空字符串。

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | 说明 |
| --- | --- | --- | --- |
| — | — | — | **本物料无维度字段**（`dimensions: []`） |

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
| --- | --- | --- | --- | --- | --- |
| `id` | id | string | `true` | `["format"]` | 唯一标识（**当前组件未使用**，仅 dataModel 声明） |
| `name` | name | string | `true` | `["format"]` | 名称，传给 `<div>{item.name}</div>` |
| `value` | value | string | `true` | `["format"]` | 数值（**类型声明 string，但语义上应为 number**） |
| `unit` | unit | string | `true` | `["format"]` | 单位 |

> **数据格式注意**：
> - `value` 字段类型声明为 `string`，默认值也是字符串（`'543'`）
> - `id` 字段在组件代码中**未读取**（代码只用 `index + 1` 作为序号）
> - `rowProperties: ['format']` 表示该字段支持格式化（在数据面板可见格式化配置）

## 3. 数据流向

```
外部数据源 / json 默认值
    ↓
dataConfig.json (dataSource: [{ id?, name, value, unit }, ...])
    ↓
index.jsx (props.dataSource)
    ↓
dataSource.map((item, index) => render)
    ↓
序号 = index + 1
name = item.name
value = item.value
unit = item.unit
前三名样式查找：itemsSet[index] (i < 3)
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "name": "机房1", "value": "543", "unit": "次" },
    { "name": "机房2", "value": "322", "unit": "次" },
    { "name": "机房3", "value": "311", "unit": "次" },
    { "name": "机房4", "value": "267", "unit": "次" },
    { "name": "机房5", "value": "211", "unit": "次" },
    { "name": "机房6", "value": "123", "unit": "次" },
    { "name": "机房7", "value": "111", "unit": "次" },
    { "name": "机房8", "value": "100", "unit": "次" },
    { "name": "机房9", "value": "76",  "unit": "次" },
    { "name": "机房10", "value": "32", "unit": "次" }
]
```

> **注意**：默认数据**不包含 `id` 字段**，但 dataModel 声明了 `id`（详见 gotchas § 1 / § 3）。

### 4.1 doc/README.md 中的错误示例

`doc/README.md` 给出的示例：

```json
[
    { "id": "1", "rank": 1, "name": "项目A", "value": 1000 },
    { "id": "2", "rank": 2, "name": "项目B", "value": 800 },
    { "id": "3", "rank": 3, "name": "项目C", "value": 600 }
]
```

**问题**：
1. `rank` 字段**不在 dataModel 中**，组件不读取，会被忽略
2. `value` 类型是 `Number`（1000），但 dataModel 声明是 `string`，类型不一致
3. 缺少 `unit` 字段

> 详见 [gotchas.md § 1](./gotchas.md#1-docreadmemd-示例数据与-datamodel-不一致)

## 5. 字段使用情况

| dataModel 字段 | 组件读取位置 | 实际生效 |
| --- | --- | --- |
| `id` | 无 | ❌ 不使用（序号用 `index + 1`） |
| `name` | `index.jsx` 第 64 行（`{item?.name}`） | ✅ |
| `value` | `index.jsx` 第 71 行（`{item?.value}`） | ✅（字符串原样显示） |
| `unit` | `index.jsx` 第 74 行（`{item?.unit}`） | ✅ |

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在 `index.jsx` 的 `dataSource.map((item, index) => ...)` 中读取新字段
3. （如需样式可配）在 `schema.ts` 添加 `*FontStyle` 面板

### 6.2 限制

- 当前**无排序逻辑**，依赖外部数据已排好序
- `value` 是字符串，**不支持 number 运算**（如需排序 / 求和需在数据源处理）
- 前三名样式**硬编码**只能配 3 个（`itemsSet` 数组）

### 6.3 修复建议

> ⚠️ 仅记录在文档中，不在当前 PR 范围

**1. 修正 `value` 字段类型**
- 改为 `dataType: "number"`（或 `double`），符合实际语义
- 默认数据同步改为数字：`value: 543`（不是 `"543"`）

**2. 移除 `id` 字段或实际使用**
- 选项 A：移除 `id` 字段（组件未使用）
- 选项 B：在组件中读取 `id`，作为 `key` 使用（当前用 `index` 作 key，有性能隐患）

**3. 修正 doc/README.md 示例**
- 改为符合 dataModel 的字段（`{ name, value, unit }`）
- 删除虚构的 `rank` 字段
