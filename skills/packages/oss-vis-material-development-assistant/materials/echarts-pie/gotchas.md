---
title: 踩坑记录
description: echarts-pie 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-15
---

# 踩坑记录

本文档记录 `echarts-pie` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 数据排序：`data.sort` 修改原数组

**症状**：多次渲染时数据顺序可能异常。

**原因**：`options.ts` 中直接 `data.sort(...)` 会修改原数组（`dataSource` 引用），导致后续渲染时数据可能已排过序。

**修复**：使用 `[...data].sort(...)` 创建副本：

```typescript
data: _.isArray(data) && data.length > 0
    ? [...data].sort((a, b) => a.value - b.value)
    : []
```

## 2. 数据状态判断：空数组 vs 无数据

**症状**：空数据源 `[]` 显示为正常图表而非错误提示。

**原因**：`isSuccess` 判断逻辑中 `lodash.isArray(data) && data.length === 0` 返回 `true`，导致空数组被视为 `SUCCESS` 状态。

**影响**：空数据时显示空白图表区域而非错误提示，用户可能无法感知数据缺失。

## 3. `textStyle` 覆盖 `rich.name`

**症状**：设置了标签文本样式后，分类名称样式不生效。

**原因**：`options.ts` 中 `{ ...defaultLabel, ...textStyle, ...others }` 的展开顺序导致 `textStyle` 覆盖了 `defaultLabel.rich.name`。

**影响**：`VisualTextStyle` 组件配置的样式会覆盖 `rich.name` 的默认样式（`fontSize: 16, color: '#999'`），但不会覆盖 `rich` 结构本身。

## 4. 默认值中 `label.textStyle` 为空对象

**症状**：标签文本样式配置面板打开后，所有字段为空。

**原因**：`defaultValue.config.label.textStyle: {}` 为空对象，`VisualTextStyle` 组件读取到空对象时显示空白。

**影响**：首次拖入物料时，标签文本样式面板无默认值展示，但不影响渲染（options.ts 中有 `defaultLabel` 兜底）。

## 5. 交互面板：下钻与派发参数互斥

**症状**：同时配置下钻和派发参数时，派发参数面板被禁用。

**原因**：schema 中 `$collapsePanel-click` 的 `x-reactions` 依赖 `configurableEvent.drilldownEvent.show`，当下钻开关开启时，派发参数面板 `x-disabled: true`。

**影响**：下钻和派发参数只能二选一，不能同时使用。

## 6. 调试小技巧

### 6.1 查看完整 props

```jsx
// 在 index.jsx 中取消注释
// console.log('EchartsPie8888888888888', props);
```

### 6.2 查看 ECharts 实例

```jsx
// 在 ReactECharts 组件上添加 ref
<ReactECharts
    ref={(el) => console.log('chart instance:', el)}
    ...
/>
```

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-15 | 创建文档 | 首次记录 |
