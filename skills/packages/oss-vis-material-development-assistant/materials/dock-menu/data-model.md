---
title: 数据契约
description: dock-menu dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-06-16
---

# 数据契约

源文件：`packages/dock-menu/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "dock-menu",
        "title": "dock-menu",
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

> ⚠️ `dimensions: []` — **无维度**。

## 2. 字段说明

### 2.1 dimensions（维度）

**空数组**。该物料不依赖维度数据。

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
| --- | --- | --- | --- | --- | --- |
| `key` | 菜单key | String | true | format | **必填**，与 `commonStyle.activeKey` 匹配 |
| `url` | URl | String | true | format | 点击跳转的目标 URL |
| `title` | 名称 | String | true | format | 菜单项显示文本 |

> 三个字段均为 `dataType: 'String'`、`list: 'true'`、`rowProperties: ['format']`。

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.{api, sql, json, dataSet}
    ↓
dataSource[] (数组)
    ↓
index.tsx (props.dataSource)
    ↓
data.map((item, index) => {
    isActive = commonStyle.activeKey.toString() === item.key;
    itemBgStyle = isActive ? formateItemBgStyle(activeStyle) : formateItemBgStyle(baseStyle);
    // 渲染 .icon-block
    ├── item.title → ItemTitle (标题文本)
    └── item.url   → onItemClick (跳转目标)
})
```

## 4. 匹配规则

### 4.1 选中匹配

```typescript
// index.tsx:110
const isActive = commonStyle.activeKey.toString() === item.key;
```

**严格匹配**：`activeKey.toString() === item.key`（字符串比较，兼容数字/字符串类型）。

**找不到匹配项时**：所有菜单项均为非选中状态（使用 `baseStyle`）。

### 4.2 跳转匹配

```typescript
// index.tsx:33
const onItemClick = (url, isActive) => {
    !!!(mode === 'development') && !!!isActive && url && window.location.assign(url);
};
```

**跳转条件**：非开发模式 + 非选中项 + url 存在。

## 5. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    {
        "key": "1",
        "url": "/workspace/preview?sceneId=128",
        "title": "地市保障场景"
    },
    {
        "key": "2",
        "url": "/workspace/preview?sceneId=156",
        "title": "区域保障场景"
    }
]
```

> 默认 2 条数据，`activeKey` 默认值为 `'1'`，因此第一条默认选中。

## 6. 扩展建议

### 6.1 新增字段

1. **声明字段**（dataModel.json）：在 `indicators` 数组添加
   ```json
   {
       "dataType": "String",
       "fieldLabel": "新字段",
       "fieldName": "newField",
       "fieldUnit": "",
       "list": "true",
       "rowProperties": ["format"]
   }
   ```
2. **数据中填充**（dataConfig.json）：每行添加
3. **组件读取**（index.tsx）：通过 `item.newField`

### 6.2 限制

- **不支持多维度**：无 dimensions，数据为纯列表
- **无维度参数**：`rowConfig.isUseDimensionParams: false`
- **数据项必须包含 `key` 字段**：否则选中匹配失效

## 7. 跨文档引用

- 选中匹配逻辑 → [component-logic.md § 2.2.3](./component-logic.md#223-菜单项渲染与选中逻辑)
- 数据面板配置 → [schema.md § 5](./schema.md#5-数据面板与交互面板)
