---
title: pagination-display 注意事项
description: 基础分页组件的陷阱、注意事项与最佳实践
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 注意事项

本文档记录使用该物料时容易遇到的陷阱、注意事项与最佳实践。

## 陷阱与坑

### 1. total 为 0 时分页组件不渲染

**问题描述**：  
当 `total` 值为 `0`、`"0"`、`null`、`undefined` 时，分页组件不会渲染。

**原因分析**：  
```jsx
{paginationPage && (
  <Pagination total={Number(paginationPage)} ... />
)}
```
条件渲染使用 `&&` 运算符，当 `paginationPage` 为 falsy 值时，不会渲染 `Pagination` 组件。

**影响**：  
- 数据为空时，用户看不到分页组件
- 无法区分"无数据"和"加载中"状态

**解决方案**：  
如果需要始终显示分页组件（即使 total 为 0），修改条件判断：

```jsx
// 方案 1：始终渲染
<Pagination total={Number(paginationPage) || 0} ... />

// 方案 2：明确判断 null/undefined
{paginationPage !== null && paginationPage !== undefined && (
  <Pagination total={Number(paginationPage)} ... />
)}
```

**参考**：→ [component-logic.md](./component-logic.md) 🟨

---

### 2. 数据类型不一致

**问题描述**：  
- `dataModel.json` 中 `total` 定义为 `String` 类型
- 实际使用时需要 `Number` 类型
- Schema 中交互参数定义为 `string`，但派发时转换为 `Number`

**原因分析**：  
```typescript
// dataModel.json
{
  "dataType": "String",  // 定义为 String
  "fieldName": "total"
}

// index.jsx
total={Number(paginationPage)}  // 转换为 Number
state: Number(page)  // 转换为 Number
```

**影响**：  
- 类型转换可能导致精度问题（如大数丢失精度）
- 类型不一致可能导致下游组件处理异常

**最佳实践**：  
- 确保数据源返回的 `total` 为数字或可转换为数字的字符串
- 在数据源端做好类型校验，避免返回 `NaN`

**参考**：→ [data-model.md](./data-model.md) 🟩

---

### 3. useEffect 依赖项缺失

**问题描述**：  
`useEffect` 中使用了 `onChange` 函数，但未将其加入依赖项。

**代码位置**：  
```typescript
useEffect(() => {
  // ...
  onChange(1, style.pageSize || 10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

**原因分析**：  
- `onChange` 函数在每次渲染时都会重新创建
- 如果加入依赖项，会导致无限循环
- 代码中使用了 `eslint-disable` 注释禁用警告

**影响**：  
- `onChange` 可能引用过时的 `interaction` 对象
- 在某些边缘情况下可能派发错误的参数

**最佳实践**：  
- 使用 `useCallback` 缓存 `onChange` 函数
- 或将 `interaction` 加入 `useEffect` 依赖项

**示例修复**：  
```typescript
const onChange = useCallback((page, pageSize) => {
  // ...
}, [interaction]);

useEffect(() => {
  // ...
  onChange(1, style.pageSize || 10);
}, [props.dataSource, props.extraResponse, style.pageSize, onChange]);
```

**参考**：→ [component-logic.md](./component-logic.md) 🟨

---

### 4. 交互参数未配置时 onChange 不执行

**问题描述**：  
如果在搭建平台中未配置交互参数，`onChange` 函数不会执行任何操作。

**原因分析**：  
```typescript
const onChange = (page, pageSize) => {
  const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
  if (actionsParams.length > 0 && interaction?.dispatch) {
    // 只有配置了交互参数才执行
    interaction.dispatch({...});
  }
};
```

**影响**：  
- 用户点击页码时，如果没有配置交互参数，不会有任何反应
- 可能被误认为是 bug

**最佳实践**：  
- 在搭建平台中务必配置至少一个交互参数
- 如果只需要展示分页，不需要交互，考虑使用其他组件

**参考**：→ [schema.md](./schema.md) 🟦

---

### 5. pageSize 变化会重置页码为 1

**问题描述**：  
当 `style.pageSize` 变化时，页码会被重置为 1。

**原因分析**：  
```typescript
useEffect(() => {
  // ...
  onChange(1, style.pageSize || 10);  // 固定传入页码 1
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

**影响**：  
- 用户在第 5 页时，如果修改了每页条数，会跳回第 1 页
- 可能不符合用户预期

**解决方案**：  
如果需要保持当前页码，修改 `onChange` 调用：

```typescript
useEffect(() => {
  // ...
  // 计算当前页码是否有效
  const newTotalPages = Math.ceil(paginationPage / (style.pageSize || 10));
  const currentPage = Math.min(currentPageRef.current, newTotalPages);
  onChange(currentPage, style.pageSize || 10);
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

**参考**：→ [component-logic.md](./component-logic.md) 🟨

---

### 6. extraResponse 数据结构要求严格

**问题描述**：  
`extraResponse` 的数据结构必须严格匹配 `extraResponse.data.viewItemData.page.total`。

**原因分析**：  
```typescript
const page = extraResponse?.data?.viewItemData?.page?.total;
```

**影响**：  
- 如果数据结构不匹配，会降级到 `dataSource`
- 可能导致使用了错误的数据源

**最佳实践**：  
- 确保后端返回的数据结构正确
- 在数据源配置中做好数据映射

**参考**：→ [data-model.md](./data-model.md) 🟩

---

## 最佳实践

### 1. 数据源选择

**推荐**：  
- 如果数据来自接口分页，使用 `extraResponse`
- 如果数据来自静态配置，使用 `dataSource`

**原因**：  
- `extraResponse` 优先级更高，适合动态数据
- `dataSource` 适合静态配置或测试数据

---

### 2. 交互参数配置

**推荐**：  
- 至少配置 `changePaginationPage` 参数
- 如果需要联动表格/列表，同时配置 `changePaginationPageSize`

**原因**：  
- 单独配置 `changePaginationPageSize` 没有实际意义
- 两个参数配合使用才能实现完整的分页联动

---

### 3. 样式配置

**推荐**：  
- 默认 `pageSize: 10` 适合大多数场景
- 数据量大时可以考虑 `pageSize: 20` 或 `pageSize: 50`

**原因**：  
- 每页条数过多会影响渲染性能
- 每页条数过少会增加翻页次数

---

### 4. 尺寸配置

**推荐**：  
- 默认尺寸 `width: 250, height: 50` 适合大多数场景
- 如果需要更大的分页组件，调整 `size` 属性为 `'default'`

**原因**：  
- `size: 'small'` 适合紧凑布局
- `size: 'default'` 适合标准布局

---

## 性能考虑

### 1. 避免频繁触发 onChange

**问题**：  
`useEffect` 在依赖项变化时会触发 `onChange`，可能导致频繁派发。

**优化建议**：  
- 使用防抖（debounce）处理 `onChange`
- 或在 `onChange` 中添加节流逻辑

**示例**：  
```typescript
const onChange = useMemo(() => debounce((page, pageSize) => {
  // ...
}, 300), [interaction]);
```

---

### 2. 大数据量分页

**问题**：  
当 `total` 非常大时（如百万级），分页组件可能渲染缓慢。

**优化建议**：  
- 在后端做好分页，避免返回过大的 `total`
- 考虑使用虚拟滚动替代分页

---

## 兼容性说明

### 1. oss-ui 版本

**要求**：  
- 需要 `oss-ui` 组件库支持 `Pagination` 组件
- `ConfigProvider` 的 `prefixCls` 属性需要正确配置

**检查方法**：  
```bash
# 检查 oss-ui 版本
pnpm list oss-ui
```

---

### 2. React 版本

**要求**：  
- React 16.8+（支持 Hooks）
- 使用了 `useState`、`useEffect` 等 Hooks

---

## 调试技巧

### 1. 查看当前 total 值

在 `useEffect` 中添加日志：

```typescript
useEffect(() => {
  const page = extraResponse?.data?.viewItemData?.page?.total;
  console.log('extraResponse total:', page);
  console.log('dataSource total:', dataSource?.[0]?.total);
  // ...
}, [props.dataSource, props.extraResponse, style.pageSize]);
```

---

### 2. 查看派发的交互参数

在 `onChange` 中添加日志：

```typescript
const onChange = (page, pageSize) => {
  console.log('onChange called:', { page, pageSize });
  console.log('interaction.defined:', interaction.defined);
  // ...
};
```

---

## 相关文档

- **组件逻辑详解**：→ [component-logic.md](./component-logic.md) 🟨
- **配置面板说明**：→ [schema.md](./schema.md) 🟦
- **数据模型说明**：→ [data-model.md](./data-model.md) 🟩
- **常见任务指南**：→ [common-tasks.md](./common-tasks.md)
