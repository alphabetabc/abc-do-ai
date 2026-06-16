---
title: pagination-display 组件逻辑
description: 基础分页组件的渲染逻辑、状态管理与交互行为
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 组件逻辑

> 🟨 **交互维度**：本文档描述组件的运行时行为、状态管理与交互逻辑。

## 源码位置

- **主文件**：`packages/pagination-display/index.jsx`
- **样式文件**：`packages/pagination-display/index.less`

## 组件结构

```jsx
const PaginationDisplay = (props) => {
  const { dataSource, config, interaction, extraResponse } = props;
  const { style } = config;
  const [paginationPage, setPaginationPage] = useState(10);
  
  // ... 逻辑代码
  
  return (
    <ConfigProvider prefixCls="oss-ui">
      <div className="pagination-display-container">
        {paginationPage && (
          <Pagination {...props} />
        )}
      </div>
    </ConfigProvider>
  );
};
```

## Props 接口

| 属性 | 类型 | 说明 | 来源 |
|------|------|------|------|
| `dataSource` | `Array` | 数据源，包含 total 字段 | 平台注入 |
| `config` | `Object` | 配置对象 | 🟦 → [schema.md](./schema.md) |
| `config.style` | `Object` | 样式配置 | 🟦 → [schema.md](./schema.md) |
| `config.style.pageSize` | `number` | 每页条数 | 🟦 → [schema.md](./schema.md) |
| `interaction` | `Object` | 交互配置 | 平台注入 |
| `interaction.defined` | `Object` | 已定义的交互参数 | 平台注入 |
| `interaction.dispatch` | `Function` | 派发函数 | 平台注入 |
| `extraResponse` | `Object` | 额外响应数据 | 平台注入 |

## 状态管理

### 内部状态

```typescript
const [paginationPage, setPaginationPage] = useState(10);
```

- **初始值**：`10`
- **含义**：分页总数（total）
- **更新时机**：`useEffect` 中根据数据源更新

## 核心逻辑

### 1. 数据源优先级（total 来源）

```typescript
useEffect(() => {
  const page = extraResponse?.data?.viewItemData?.page?.total;
  if (page) {
    setPaginationPage(page);
  } else {
    setPaginationPage(dataSource?.[0]?.total);
  }
  onChange(1, style.pageSize || 10);
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

**优先级**：
1. **最高**：`extraResponse.data.viewItemData.page.total`
2. **降级**：`dataSource[0].total`
3. **默认**：`10`（useState 初始值）

**依赖项**：
- `props.dataSource`
- `props.extraResponse`
- `style.pageSize`

**注意**：当依赖项变化时，会重新计算 total 并触发 `onChange(1, style.pageSize || 10)`。

### 2. 页码变化处理（onChange）

```typescript
const onChange = (page, pageSize) => {
  const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
  if (actionsParams.length > 0 && interaction?.dispatch) {
    interaction.dispatch({
      data: [
        { fieldName: interaction.defined?.changePaginationPage, state: Number(page) },
        { fieldName: interaction.defined?.changePaginationPageSize, state: Number(pageSize) },
      ],
    });
  }
};
```

**执行条件**：
- `interaction.defined` 中存在至少一个参数
- `interaction.dispatch` 函数存在

**派发数据**：
| 字段名 | 值 | 类型 | 说明 |
|--------|-----|------|------|
| `changePaginationPage` | `page` | `Number` | 当前页码 |
| `changePaginationPageSize` | `pageSize` | `Number` | 每页条数 |

**注意**：虽然 schema 中定义为 `string` 类型，但实际派发时转换为 `Number`。

### 3. 条件渲染

```jsx
{paginationPage && (
  <Pagination
    total={Number(paginationPage)}
    showTotal={(total) => `共 ${total} 条`}
    showSizeChanger={false}
    showQuickJumper={false}
    pageSize={style.pageSize || 10}
    size={'small'}
    onChange={onChange}
  />
)}
```

**渲染条件**：`paginationPage` 为 truthy 值（非 0、非 null、非 undefined）

**Pagination 组件配置**：
| 属性 | 值 | 说明 |
|------|-----|------|
| `total` | `Number(paginationPage)` | 总条数 |
| `showTotal` | `(total) => \`共 ${total} 条\`` | 显示总条数格式化函数 |
| `showSizeChanger` | `false` | 不显示每页条数切换器 |
| `showQuickJumper` | `false` | 不显示快速跳转 |
| `pageSize` | `style.pageSize \|\| 10` | 每页条数 |
| `size` | `'small'` | 小尺寸模式 |
| `onChange` | `onChange` | 页码变化回调 |

## 样式说明

### index.less

```less
.pagination-display-container {
  width: 100%;
  height: 100%;
}
```

容器占满父元素宽高。

### ConfigProvider

```jsx
<ConfigProvider prefixCls="oss-ui">
```

使用 `oss-ui` 组件库的样式前缀。

## 生命周期流程

```
1. 组件挂载
   ↓
2. useState 初始化 paginationPage = 10
   ↓
3. useEffect 执行
   ├─ 计算 total（extraResponse > dataSource > 默认值）
   ├─ setPaginationPage(total)
   └─ 调用 onChange(1, style.pageSize || 10)
      └─ 如果配置了交互参数，派发 changePaginationPage 和 changePaginationPageSize
   ↓
4. 渲染 Pagination 组件（如果 paginationPage 为 truthy）
   ↓
5. 用户点击页码
   └─ 触发 onChange(page, pageSize)
      └─ 派发交互参数
```

## 相关文档

- **配置字段定义**：→ [schema.md](./schema.md) 🟦
- **数据模型说明**：→ [data-model.md](./data-model.md) 🟩
- **常见逻辑修改任务**：→ [common-tasks.md](./common-tasks.md)
- **注意事项**：→ [gotchas.md](./gotchas.md)
