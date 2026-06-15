---
title: 数据契约
description: digital-flop dataModel.json 字段定义、数据契约、隐式字段
version: 1.0.0
last_updated: 2026-06-15
---

# 数据契约

源文件：`packages/digital-flop/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "digital-flop",
        "title": "digital-flop",
        "icon": "",
        "description": "digital-flop",
        "author": "谢名伟",
        "page": false,
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
> ⚠️ `dimensions: []` — **无维度**，单指标物料。

## 2. 字段说明

### 2.1 dimensions（维度）

**空数组**。digital-flop 是单指标物料，不需要维度。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
|-----------|------------|----------|------|---------------|------|
| `value` | 指标值 | String | true | format | **核心字段**，TWEEN 动画的数值 |
| `render` | 级别,支持分级呈现颜色 | String | true | format | **级别值**，与 `isLevel.itemsSet[].level` 匹配 |
| `suffix` | 后缀显示内容 | String | true | format | **动态后缀**，覆盖 schema 中的 `suffix.text` |

> 💡 `dataType: 'String'` 是 dataModel 描述约定，`value` 实际应是 number（如 `123`）。

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.{api, sql, json, dataSet}
    ↓
dataSource (单对象 或 数组第一项)
    ↓
index.tsx
    ├─ data = dataSource.value          ← 核心
    ├─ dataLevel = Number(dataSource.render)  ← 级别
    └─ dataSource.id (⚠️ 未在 dataModel 声明)
    ↓
components/ValueRenderer (TWEEN 动画)
    ↓
DOM (.wrapper-number span × N)
```

### 3.1 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { "id": 1, "value": 123, "render": 1, "suffix": "" }
]
```

> ⚠️ **默认数据中包含 `id: 1`，但 `dataModel.json` 中未声明 `id` 字段**！
>
> 这是已知的不一致：默认数据演示了"派发 id"的能力，但 dataModel 没有正式声明该字段。

### 3.2 字段访问关系

| 字段 | 组件读取位置 | 用途 |
|------|--------------|------|
| `value` | `dataSource.value` | TWEEN 动画 + 显示 |
| `render` | `Number(dataSource.render)` | 匹配 `isLevel.itemsSet[].level` |
| `suffix` | `dataSource?.suffix` | 动态后缀（覆盖 schema 配置） |
| `id` | `dataSource.id` | 点击事件派发 |

## 4. 隐式字段清单

下列字段**被组件使用但未在 schema 声明**，需特别注意：

| 字段 | 位置 | 来源 | 备注 |
|------|------|------|------|
| `enableRemoveEndZero` | `numberSetting.enableRemoveEndZero` | 传给 `useValueRenderer` | 是否移除小数末位 0 |
| `fontSkew` | `config.number.fontSkew` | 传给 `RootStyled` 的 `numberSkew` | 字体倾斜角度 |
| `id` | `dataSource.id` | 点击事件派发 | dataModel 未声明 |

详见 [gotchas.md § 3](./gotchas.md#3-️-隐式字段-enableremoveendzero)。

## 5. 扩展建议

### 5.1 显式声明 `id` 字段

1. 在 `dataModel.json` 的 `indicators` 数组添加：
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
2. 在 `defaultValue.dataConfig.json` 的数据中保留 `id: 1`
3. 用户在 dataConfig 配置时填入真实 ID

### 5.2 新增字段

1. **声明字段**（dataModel.json）：在 `indicators` 数组添加
2. **数据中填充**（dataConfig.json）：在对象中加字段
3. **组件读取**（index.tsx）：通过 `dataSource.xxx` 访问

> 💡 如需新增配置面板字段（如"显示数字千分位 margin"），需在 schema.ts 添加并通过 `getCompTitle` 工厂。

## 6. 限制

- **单指标**：无 dimensions，不能做多指标对比
- **不支持多维度**：每个翻牌器只显示一个数字
- **不支持维度参数**：`rowConfig.isUseDimensionParams: false`
- **`dataSource` 必须是单对象**（或单元素数组），多元素数组**只取第一项**

## 7. 跨文档引用

- 字段展开（`...header.dimensions + ...header.indicators`）→ [schema.md § 3](./schema.md#3-数据面板)
- `dataSource` 单对象转换 → [component-logic.md § 3.2](./component-logic.md#32-datasource-转换)
- TWEEN 渲染 `value` → [component-logic.md § 4.2.1](./component-logic.md#421-tween-触发逻辑)
- 后缀动态覆盖 → [component-logic.md § 6.2](./component-logic.md#62-compsuffixtpltsx)
