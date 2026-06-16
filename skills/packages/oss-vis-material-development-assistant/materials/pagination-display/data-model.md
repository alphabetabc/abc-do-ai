---
title: pagination-display 数据模型
description: 基础分页组件的数据模型定义与字段映射
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 数据模型

> 🟩 **数据维度**：本文档描述物料的数据结构、字段定义与数据流转。

## 源码位置

- **数据模型文件**：`packages/pagination-display/dataModel.json`

## 数据模型定义

```json
{
  "dataModelDefinition": {
    "name": "visual-material-pagination-display",
    "title": "可视化大屏分页组件",
    "icon": "",
    "description": "可视化大屏分页组件",
    "author": "孙寰哲",
    "header": {
      "dimensions": [],
      "indicators": [
        {
          "dataType": "String",
          "fieldLabel": "总数",
          "fieldName": "total",
          "fieldUnit": "",
          "list": "true"
        }
      ]
    },
    "rowConfig": {
      "dimensionCount": "unknown",
      "isUseDimensionParams": "false"
    }
  }
}
```

## 字段说明

### 维度字段（dimensions）

**无维度字段**

该物料不使用维度字段，仅使用指标字段。

### 指标字段（indicators）

| 字段名 | 字段标签 | 数据类型 | 单位 | 是否列表 | 说明 |
|--------|----------|----------|------|----------|------|
| `total` | 总数 | `String` | - | `true` | 分页总条数 |

**注意**：
- 虽然 `dataType` 定义为 `String`，但在组件中会转换为 `Number` 类型使用
- `list: "true"` 表示该字段为列表类型数据

## 数据结构示例

### 默认数据（dataConfig.json）

```json
[
  { "total": "55" }
]
```

### 实际使用时的数据格式

```json
[
  { "total": 100 }
]
```

或从 `extraResponse` 获取：

```json
{
  "data": {
    "viewItemData": {
      "page": {
        "total": 100
      }
    }
  }
}
```

## 数据流转

### 1. 数据输入

```
数据源（dataSource 或 extraResponse）
  ↓
提取 total 字段
  ↓
转换为 Number 类型
  ↓
设置为 paginationPage 状态
  ↓
传递给 Pagination 组件的 total 属性
```

### 2. 数据优先级

```typescript
// 优先级从高到低
1. extraResponse.data.viewItemData.page.total
2. dataSource[0].total
3. 默认值 10
```

### 3. 数据输出（交互派发）

当页码变化时，派发以下数据（参考 → [component-logic.md](./component-logic.md) 🟨）：

```typescript
{
  data: [
    {
      fieldName: interaction.defined?.changePaginationPage,
      state: Number(page)        // 当前页码
    },
    {
      fieldName: interaction.defined?.changePaginationPageSize,
      state: Number(pageSize)    // 每页条数
    }
  ]
}
```

## 字段映射配置

在 schema.ts 中，数据字段通过 `DynamicData` 组件配置：

```typescript
fields: [
  ...dataModel.dataModelDefinition.header.dimensions,  // []
  ...dataModel.dataModelDefinition.header.indicators   // [total]
]
```

用户可以在搭建平台中将实际数据字段映射到 `total`。

## 数据类型转换

| 场景 | 原始类型 | 转换后类型 | 转换方式 |
|------|----------|------------|----------|
| total 字段 | `String` | `Number` | `Number(paginationPage)` |
| page（页码） | `any` | `Number` | `Number(page)` |
| pageSize（每页条数） | `any` | `Number` | `Number(pageSize)` |

## 数据验证

组件中对数据的处理：

```typescript
// 1. 检查 paginationPage 是否为 truthy
{paginationPage && <Pagination total={Number(paginationPage)} />}

// 2. 使用 Number() 转换确保类型正确
total={Number(paginationPage)}
```

**注意**：如果 `total` 为 `"0"` 或 `0`，`paginationPage` 会被设置为 falsy 值，导致 Pagination 组件不渲染。

## 相关文档

- **配置面板如何引用数据字段**：→ [schema.md](./schema.md) 🟦
- **组件如何使用数据**：→ [component-logic.md](./component-logic.md) 🟨
- **数据相关常见问题**：→ [gotchas.md](./gotchas.md)
