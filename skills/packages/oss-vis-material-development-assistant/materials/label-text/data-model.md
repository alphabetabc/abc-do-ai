---
title: label-text 数据契约
description: 标题物料（label-text）的 dataModel.json 字段定义、数据契约、文本来源优先级
version: 1.0.0
last_updated: 2026-06-16
---

# label-text 数据契约

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "label-text",
        "title": "label-text",
        "icon": "",
        "description": "label-text",
        "author": "谢名伟",
        "page": false,
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "标题文本",
                    "fieldName": "content",
                    "fieldUnit": "",
                    "list": "true",
                    "rowProperties": ["format"]
                },
                {
                    "dataType": "String",
                    "fieldLabel": "标题Icon",
                    "fieldName": "iconType",
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
| `content` | 标题文本 | String | true | 标题文本内容 |
| `iconType` | 标题 Icon | String | true | 标题图标类型（当前未使用） |

**注意**：
- `iconType` 字段在 dataModel 中定义，但组件代码中**未使用**
- 前缀图标来自 schema 的 `prefix` 配置，而非数据驱动

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource（对象或数组）
    ↓
index.jsx (props.dataSource)
    ↓
文本来源判断（优先级）
    ↓
1. interactionProps.labelText（交互参数）
2. receivedPropsParams（下钻参数）
3. dataSource?.content 或 dataSource?.[0]?.content（数据源）
4. text.textContainer.content（静态配置）
    ↓
渲染文本
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
{
    "content": "",
    "iconType": ""
}
```

**注意**：
- 默认数据是**对象**格式，而非数组
- 组件代码兼容了对象和数组两种格式：
  ```typescript
  let realText = dataSource?.content || dataSource?.[0]?.content || textContainer.content;
  ```

## 5. 文本来源优先级

组件代码中，文本来源的优先级如下：

| 优先级 | 来源 | 字段路径 | 说明 |
| --- | --- | --- | --- |
| 1 | 交互参数 | `interactionProps.labelText` | 来自其他组件传递的标题文本 |
| 2 | 下钻参数 | `receivedPropsParams[subscribeKey]` | 来自下钻参数 |
| 3 | 数据源 | `dataSource?.content` 或 `dataSource?.[0]?.content` | 来自 dataConfig |
| 4 | 静态配置 | `text.textContainer.content` | 来自 schema 配置 |

## 6. 扩展建议

### 6.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
2. 在组件中通过 `dataSource?.fieldName` 读取
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 6.2 限制

- `iconType` 字段当前未使用，如需数据驱动图标，需要修改组件代码
- 数据源格式不统一（对象/数组），建议统一为数组格式
