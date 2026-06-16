---
title: pagination-display 配置面板 Schema
description: 基础分页组件的配置面板字段定义与交互配置
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 配置面板 Schema

> 🟦 **配置维度**：本文档描述物料在搭建平台中的配置面板结构。

## 源码位置

- **文件路径**：`packages/pagination-display/schema.ts`

## Schema 结构概览

```typescript
export const schema = {
  materials: 'pagination-display',
  fields: [
    { name: '配置', key: 'config', schema: {...} },      // 配置面板
    { name: '数据', key: 'dataConfig', schema: {...} },   // 数据面板
    defineInteractionSchema({...})                        // 交互面板
  ]
}
```

## 配置面板（config）

### FormCollapse 结构

配置面板使用 `FormCollapse` 组件组织，包含以下折叠面板：

#### 1. 样式面板（style）

| 字段名 | 标题 | 组件类型 | 配置项 | 默认值 |
|--------|------|----------|--------|--------|
| `pageSize` | 每页条数 | `NumberPicker` | `min: 1`, `step: 1` | `10` |

**Schema 定义**：
```typescript
pageSize: {
  type: 'number',
  title: '每页条数',
  'x-decorator': 'FormItem',
  'x-component': 'NumberPicker',
  'x-component-props': {
    min: 1,
    step: 1,
  },
}
```

### 基础布局字段

通过 `BASE_LAYOUT` 继承的基础字段（参考 → [component-logic.md](./component-logic.md) 🟨）：
- `title`: 组件标题
- `width`: 宽度
- `height`: 高度
- `left`: 左边距
- `top`: 上边距
- `isLock`: 是否锁定
- `isHidden`: 是否隐藏

## 数据面板（dataConfig）

使用 `DynamicData` 组件配置数据源，支持：
- JSON 静态数据
- API 接口数据
- 数据集（dataSet）映射

**字段配置**（参考 → [data-model.md](./data-model.md) 🟩）：
```typescript
fields: [
  ...dataModel.dataModelDefinition.header.dimensions,  // 维度字段（空数组）
  ...dataModel.dataModelDefinition.header.indicators   // 指标字段
]
```

## 交互面板（interaction）

### 分页栏单击事件

交互面板通过 `defineInteractionSchema` 定义，结构如下：

```
分页栏单击事件
└── 派发参数
    ├── changePaginationPage（当前页码）
    └── changePaginationPageSize（每页条数）
```

### 派发参数定义

| 参数名 | 标题 | 类型 | 组件 | 说明 |
|--------|------|------|------|------|
| `changePaginationPage` | 当前页码 | `string` | `Input` | 页码变化时派发的当前页码 |
| `changePaginationPageSize` | 每页条数 | `string` | `Input` | 页码变化时派发的每页条数 |

**注意**：虽然 schema 中类型为 `string`，但实际派发时会转换为 `Number` 类型（参考 → [component-logic.md](./component-logic.md) 🟨）。

## 默认值（defaultValue）

```typescript
export const defaultValue = {
  dataConfig: {
    dataType: 'json',
    sql: {},
    dataSet: { current: {}, params: {} },
    api: { mode: 'get', url: '', headers: {}, params: {} },
    fieldMapping: { x: 'f1', y: 'f2' },
    json: [{ total: '55' }],
    isRefresh: false,
    refreshTime: 5 * 60,  // 5分钟
  },
  config: {
    title: '基础分页组件',
    width: 250,
    height: 50,
    left: 15,
    top: 15,
    isLock: false,
    isHidden: false,
    style: { pageSize: 10 },
  },
};
```

## 相关文档

- **组件如何使用这些配置**：→ [component-logic.md](./component-logic.md) 🟨
- **数据字段详细说明**：→ [data-model.md](./data-model.md) 🟩
- **常见配置修改任务**：→ [common-tasks.md](./common-tasks.md)
