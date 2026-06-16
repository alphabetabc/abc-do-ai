---
title: 踩坑记录
description: 基础标签实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `normal-label` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 数据：dataSource 为空时的处理

**症状**：当 `dataSource` 为 `undefined`、`null` 或空数组时，页面渲染空白，不报错。

**原因**：组件使用可选链 `dataSource?.[0]?.labelText`，任何环节为 `undefined` 时表达式返回 `undefined`，`<span>` 内容为空。

**修复**：这是预期行为，无需修复。如需展示占位文本，可添加 fallback：

```typescript
<span>{dataSource?.[0]?.labelText || '暂无数据'}</span>
```

## 2. VisualTextStyle：disableTextAlign 的影响

**症状**：用户期望在配置面板中调整文本对齐方式，但 VisualTextStyle 未显示对齐选项。

**原因**：`schema.ts` 中 `VisualTextStyle` 的 `disableTextAlign: true`，禁用了文本对齐配置。

**修复**：如需启用文本对齐，将 `disableTextAlign` 改为 `false`：

```typescript
'x-component-props': {
    disableLineHeight: false,
    disableTextAlign: false,  // 改为 false 以显示对齐选项
},
```

## 3. 行高：lineHeight 默认值为 null

**症状**：默认行高为 `null`，在某些浏览器或上下文中可能导致文本行高表现不一致。

**原因**：`defaultValue.config.common.textStyle.lineHeight: null`，VisualTextStyle 允许行高为空。

**修复**：如需固定行高，设置具体数值：

```typescript
lineHeight: 1.5,  // 或 '24px'
```

## 4. 样式：index.less 为空文件

**症状**：组件无 class 样式，完全依赖内联 `style`。

**原因**：`index.less` 为空文件，组件 `<section>` 和 `<span>` 无 class 绑定。

**修复**：如需添加 class 样式，在 `index.less` 中定义样式并在 `index.tsx` 中添加 className：

```less
.normal-label {
    display: inline-flex;
    align-items: center;
    // ...
}
```

```typescript
<section className="normal-label" style={config.common.textStyle}>
```

## 5. 数据：仅读取 dataSource[0]

**症状**：数据源传入多条数据时，组件仅展示第 1 条，其余被忽略。

**原因**：组件硬编码 `dataSource[0]`，不遍历数组。

**修复**：这是当前设计，非 bug。如需展示多条数据，需修改组件逻辑。

## 6. 调试小技巧

### 6.1 快速验证配置变更

修改 `schema.ts` 中的 `defaultValue` 后，需要**重新拖入**物料才能看到效果。已存在的物料不会自动更新默认值。

### 6.2 检查 dataSource 结构

在浏览器开发者工具中，选中组件 DOM 节点，在 React DevTools 中查看 `props.dataSource` 的内容，确认数据字段名是否为 `labelText`。

## 维护历史

| 日期 | 问题 | 修复 |
| ---- | ---- | ---- |
| 2026-06-16 | 初始文档创建 | 物料文档体系建设 |
