---
title: 踩坑记录
description: digital-card 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-15
---

# 踩坑记录

本文档记录 `digital-card` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. `borderLeftColor` 配置项未使用

**症状**：用户在 schema 面板中配置了"左边框颜色"，但渲染时左边框颜色始终是背景渐变结束色。

**原因**：`index.jsx` 中左边框颜色硬编码为 `this.fnGetStyle('containerStyle')?.bgColorEnd`，未读取 `listItemLabel.borderLeftColor`。

**影响**：`borderLeftColor` 字段存在于 schema 但组件中未使用，属于**无效配置项**。

**修复**：参考 [common-tasks.md § 任务 4](./common-tasks.md#任务-4修复-borderleftcolor-未使用的问题)。

## 2. `dataSource[0]` 无空值保护

**症状**：当数据源为空数组 `[]` 时，组件渲染报错 `Cannot read properties of undefined (reading 'label')`。

**原因**：`index.jsx` 直接访问 `this.props.dataSource[0].label`，未做空值判断。

**影响**：空数据时组件崩溃，显示白屏或错误边界。

**修复**：参考 [common-tasks.md § 任务 5](./common-tasks.md#任务-5添加空数据保护)。

## 3. 标题颜色回退逻辑

**症状**：标题文字颜色配置为空时，显示为背景渐变结束色。

**原因**：`index.jsx` 中判断 `color?.length`，空字符串 `''` 的 `length` 为 0，触发回退逻辑。

**影响**：用户清空标题颜色输入框后，标题颜色变为背景渐变结束色，可能不符合预期。

## 4. 渐变方向固定

**症状**：用户无法配置渐变方向。

**原因**：`index.jsx` 中固定使用 `linear-gradient(bgColorStart, bgColorEnd)`，方向为默认的从上到下（to bottom）。

**影响**：无法实现水平渐变或对角渐变。

## 5. Class 组件 vs 函数组件

**症状**：与其他物料（大多使用函数组件 + hooks）代码风格不一致。

**原因**：digital-card 使用 React Class 组件而非函数组件。

**影响**：维护时需注意 Class 组件的 `this` 绑定和生命周期特性。

## 6. 调试小技巧

### 6.1 查看当前配置

```jsx
// 在 render 中临时添加
console.log('config:', this.props.config);
console.log('dataSource:', this.props.dataSource);
```

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-15 | 创建文档 | 首次记录 |
