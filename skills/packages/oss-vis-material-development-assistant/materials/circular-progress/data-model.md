---
title: 数据契约
description: circular-progress dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/circular-progress/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "visual-circular-progress",
        "title": "可视化大屏环形进度图",
        "description": "可视化大屏环形进度图数据，仅支持一组数据",
        "header": {
            "dimensions": [],
            "indicators": [
                { "fieldName": "id",      "fieldLabel": "指标ID",   "dataType": "String" },
                { "fieldName": "title",   "fieldLabel": "指标名称", "dataType": "String" },
                { "fieldName": "percent", "fieldLabel": "指标值",   "dataType": "String" },
                { "fieldName": "unit",    "fieldLabel": "单位",     "dataType": "String" }
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
| `id` | 指标ID | String | `true` | — | 指标唯一标识（当前未在组件中使用，保留供未来扩展） |
| `title` | 指标名称 | String | `true` | — | 标题文本，传给 `Label` 子组件 |
| `percent` | 指标值 | String | `true` | — | 百分比数值（0~100），驱动圆环角度与翻牌器数值 |
| `unit` | 单位 | String | `true` | — | 单位文本，会被注入到 `digitalProps.suffix.text` |

> **数据格式注意**：
> - `percent` 字段类型声明为 `String`，但实际应是 `Number`（0~100）
> - `id` 字段当前组件未消费

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource (object | array)
    ↓
index.jsx (props.dataSource)
    ↓ (data 形态适配)
data = { percent, unit, title }
    ↓
circularResolve(data)        → 圆环几何（半径 / 旋转角）
digitalFlopResolve(data)     → 翻牌器 props（value / suffix.text）
    ↓
SVG 圆环 + 中心 DigitalFlop + 标题
```

### 3.1 形态适配

`index.jsx` 第 104-114 行的数据形态判断逻辑：

| 入参 `dataSource` 形态 | 处理 | 结果 |
| --- | --- | --- |
| **对象** `{ percent, unit, title }` | `data = propsData` | 直接复用 |
| **数组** `[{...}]` | 取 `propsData[0]`，按字段映射为 `{ percent: obj.value, unit: obj.unit, title: obj.name }` | 字段名映射（⚠️ 与 dataModel 不一致，见 gotchas § 1） |

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
{
    "percent": 98,
    "unit": "%",
    "title": "vEPC附着成功率"
}
```

> **注意**：默认数据是**对象形态**，不是数组。这是该物料最常用的"单组数据"形式。

### 4.1 数组形态示例（来自 `doc/README.md`）

```json
[
    {
        "id": "1",
        "title": "vEPC附着成功率",
        "percent": 98,
        "unit": "%"
    }
]
```

> ⚠️ 数组形态下，由于 gotchas § 1 的字段名不匹配问题，`percent` 和 `title` 会变为 `undefined`，**仅 `unit` 字段生效**。这意味着数据驱动的角度和标题在数组模式下无效，仅单位后缀正常。

## 5. 字段使用情况

| dataModel 字段 | 组件读取位置 | 实际生效字段（对象模式） | 实际生效字段（数组模式） |
| --- | --- | --- | --- |
| `id` | 无 | ❌ 不使用 | ❌ 不使用 |
| `title` | `Label` 子组件 | ✅ `data.title` | ❌ 读 `obj.name`（不存在） |
| `percent` | `circularResolve.rotateAngle` / `digitalFlopResolve.dataSource.value` | ✅ `data.percent` | ❌ 读 `obj.value`（不存在） |
| `unit` | `digitalFlopResolve.suffix.text` | ✅ `data.unit` | ✅ `obj.unit` |

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在 `index.jsx` 的数据适配逻辑中添加映射
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 6.2 限制

- 当前**不支持多组数据**自动渲染多个环形图（`TODO` 注释在 `index.jsx` 第 98 行）
- 数组模式下字段映射有 bug（详见 gotchas.md § 1），不建议使用
- 仅支持单维度（无 `dimensions`）

### 6.3 修复建议

> ⚠️ 仅记录在文档中，不在当前 PR 范围内修改

将 `index.jsx` 第 107-111 行的字段映射修正为：

```javascript
data = {
    percent: obj.percent,   // 原: obj.value
    unit: obj.unit,
    title: obj.title,        // 原: obj.name
};
```

或者反向修改 `dataModel.json`，将字段名改为 `value / name / unit` 以匹配代码。
