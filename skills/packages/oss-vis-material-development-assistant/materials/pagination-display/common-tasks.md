---
title: pagination-display 常见任务
description: 基础分页组件的常见修改任务与实现指南
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 常见任务

本文档提供常见修改任务的具体实现步骤和代码示例。

## 任务索引

| 任务 | 涉及文件 | 难度 | 维度 |
|------|----------|------|------|
| [修改默认每页条数](#修改默认每页条数) | schema.ts | ⭐ | 🟦 |
| [添加新的样式配置项](#添加新的样式配置项) | schema.ts, index.jsx | ⭐⭐ | 🟦🟨 |
| [修改 total 数据源优先级](#修改-total-数据源优先级) | index.jsx | ⭐⭐ | 🟨🟩 |
| [启用每页条数切换器](#启用每页条数切换器) | index.jsx | ⭐ | 🟨 |
| [启用快速跳转](#启用快速跳转) | index.jsx | ⭐ | 🟨 |
| [添加新的交互参数](#添加新的交互参数) | schema.ts, index.jsx | ⭐⭐⭐ | 🟦🟨 |
| [修改分页组件尺寸](#修改分页组件尺寸) | index.jsx | ⭐ | 🟨 |
| [自定义总条数显示格式](#自定义总条数显示格式) | index.jsx | ⭐ | 🟨 |

---

## 修改默认每页条数

**目标**：将默认的每页条数从 10 改为 20

**涉及文件**：
- `packages/pagination-display/schema.ts`

**步骤**：

1. 修改 `defaultValue` 中的 `pageSize`：

```typescript
export const defaultValue = {
  // ...
  config: {
    // ...
    style: { pageSize: 20 },  // 改为 20
  },
};
```

2. （可选）修改 `pageSize` 字段的默认值提示：

```typescript
pageSize: {
  type: 'number',
  title: '每页条数',
  'x-decorator': 'FormItem',
  'x-component': 'NumberPicker',
  'x-component-props': {
    min: 1,
    step: 1,
    // 可以添加 default: 20
  },
},
```

**验证**：新建物料实例，检查每页条数是否为 20。

---

## 添加新的样式配置项

**目标**：添加"是否显示总条数"的配置项

**涉及文件**：
- `packages/pagination-display/schema.ts`（🟦）
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

### 1. 在 schema.ts 中添加配置项

```typescript
style: {
  type: 'object',
  'x-component': 'FormCollapse.CollapsePanel',
  'x-component-props': {
    header: '样式',
  },
  properties: {
    pageSize: {
      type: 'number',
      title: '每页条数',
      'x-decorator': 'FormItem',
      'x-component': 'NumberPicker',
      'x-component-props': {
        min: 1,
        step: 1,
      },
    },
    // 新增配置项
    showTotal: {
      type: 'boolean',
      title: '显示总条数',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      default: true,
    },
  },
},
```

### 2. 在 defaultValue 中添加默认值

```typescript
export const defaultValue = {
  // ...
  config: {
    // ...
    style: { 
      pageSize: 10,
      showTotal: true,  // 新增默认值
    },
  },
};
```

### 3. 在 index.jsx 中使用配置

```jsx
<Pagination
  total={Number(paginationPage)}
  showTotal={style.showTotal !== false ? (total) => `共 ${total} 条` : null}
  // ... 其他配置
/>
```

**验证**：在搭建平台中切换"显示总条数"开关，检查效果。

---

## 修改 total 数据源优先级

**目标**：优先使用 `dataSource` 而非 `extraResponse`

**涉及文件**：
- `packages/pagination-display/index.jsx`（🟨🟩）

**步骤**：

修改 `useEffect` 中的优先级判断：

```typescript
useEffect(() => {
  // 修改优先级：先检查 dataSource
  const page = dataSource?.[0]?.total;
  if (page) {
    setPaginationPage(page);
  } else {
    // 降级到 extraResponse
    setPaginationPage(extraResponse?.data?.viewItemData?.page?.total);
  }
  onChange(1, style.pageSize || 10);
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

**验证**：同时提供两种数据源，检查使用的是 `dataSource` 的值。

---

## 启用每页条数切换器

**目标**：允许用户切换每页条数

**涉及文件**：
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

修改 `Pagination` 组件配置：

```jsx
<Pagination
  total={Number(paginationPage)}
  showTotal={(total) => `共 ${total} 条`}
  showSizeChanger={true}        // 改为 true
  showQuickJumper={false}
  pageSize={style.pageSize || 10}
  size={'small'}
  onChange={onChange}
/>
```

**注意**：启用后，用户切换每页条数时也会触发 `onChange` 回调，派发 `changePaginationPageSize` 参数。

**验证**：在预览模式中检查是否显示每页条数切换器。

---

## 启用快速跳转

**目标**：添加页码快速跳转功能

**涉及文件**：
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

修改 `Pagination` 组件配置：

```jsx
<Pagination
  total={Number(paginationPage)}
  showTotal={(total) => `共 ${total} 条`}
  showSizeChanger={false}
  showQuickJumper={true}        // 改为 true
  pageSize={style.pageSize || 10}
  size={'small'}
  onChange={onChange}
/>
```

**验证**：在预览模式中检查是否显示快速跳转输入框。

---

## 添加新的交互参数

**目标**：添加"当前页起始位置"的交互参数

**涉及文件**：
- `packages/pagination-display/schema.ts`（🟦）
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

### 1. 在 schema.ts 中定义交互参数

```typescript
properties: {
  changePaginationPage: {
    title: '当前页码',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  changePaginationPageSize: {
    title: '每页条数',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // 新增参数
  changePaginationStart: {
    title: '当前页起始位置',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
},
```

### 2. 在 index.jsx 中派发参数

```typescript
const onChange = (page, pageSize) => {
  const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
  if (actionsParams.length > 0 && interaction?.dispatch) {
    interaction.dispatch({
      data: [
        {
          fieldName: interaction.defined?.changePaginationPage,
          state: Number(page),
        },
        {
          fieldName: interaction.defined?.changePaginationPageSize,
          state: Number(pageSize),
        },
        // 新增参数
        {
          fieldName: interaction.defined?.changePaginationStart,
          state: Number((page - 1) * pageSize + 1),
        },
      ],
    });
  }
};
```

**验证**：配置交互参数后，检查派发的数据中是否包含 `changePaginationStart`。

---

## 修改分页组件尺寸

**目标**：将分页组件改为默认尺寸（非 small）

**涉及文件**：
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

修改 `Pagination` 组件的 `size` 属性：

```jsx
<Pagination
  total={Number(paginationPage)}
  showTotal={(total) => `共 ${total} 条`}
  showSizeChanger={false}
  showQuickJumper={false}
  pageSize={style.pageSize || 10}
  size={'default'}        // 改为 'default' 或删除该属性
  onChange={onChange}
/>
```

**验证**：检查分页组件的尺寸是否变大。

---

## 自定义总条数显示格式

**目标**：将"共 X 条"改为"总计：X 条数据"

**涉及文件**：
- `packages/pagination-display/index.jsx`（🟨）

**步骤**：

修改 `showTotal` 函数：

```jsx
<Pagination
  total={Number(paginationPage)}
  showTotal={(total) => `总计：${total} 条数据`}  // 修改格式
  showSizeChanger={false}
  showQuickJumper={false}
  pageSize={style.pageSize || 10}
  size={'small'}
  onChange={onChange}
/>
```

**验证**：检查总条数显示格式是否更新。

---

## 相关文档

- **配置面板结构**：→ [schema.md](./schema.md) 🟦
- **组件逻辑说明**：→ [component-logic.md](./component-logic.md) 🟨
- **数据模型说明**：→ [data-model.md](./data-model.md) 🟩
- **注意事项**：→ [gotchas.md](./gotchas.md)
