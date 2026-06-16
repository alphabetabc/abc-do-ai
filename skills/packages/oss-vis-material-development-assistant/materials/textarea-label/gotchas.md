---
title: textarea-label 踩坑记录
description: 文本域物料（textarea-label）实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label 踩坑记录

本文档记录 `textarea-label` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ VisualTextStyle 的 disableTextAlign 设置为 true

**症状**：无法配置文本对齐方式。

**原因**：

```typescript
// schema.ts:46
'x-component-props': {
    disableLineHeight: false,
    disableTextAlign: true,  // 禁用了文本对齐方式
},
```

> VisualTextStyle 组件的 `disableTextAlign` 设置为 true，导致无法配置文本对齐方式。

**修复**：
- 如需启用文本对齐方式，将 `disableTextAlign` 改为 `false`
- 参考 [common-tasks.md § 任务 2](./common-tasks.md#任务-2启用文本对齐方式配置)

## 2. ⚠️ 仅读取 dataSource[0]，不支持多条数据

**症状**：数据源有多条数据时，只显示第一条。

**原因**：

```typescript
// index.tsx:13
value={dataSource?.[0]?.labelText}
```

> 组件仅读取 `dataSource[0].labelText`，不支持多条数据。

**修复**：
- 如需支持多条数据，需要修改组件逻辑
- 可以使用 `map` 遍历 dataSource，渲染多个 TextArea

## 3. ⚠️ style 直接传递 textStyle 对象

**症状**：textStyle 中的某些属性可能不生效。

**原因**：

```typescript
// index.tsx:9
style={config.common.textStyle}
```

> `style` 直接传递 textStyle 对象，Input.TextArea 可能不支持所有 CSS 属性。

**修复**：
- 确保 textStyle 中的属性是 Input.TextArea 支持的
- 可以使用 `className` 配合 CSS 实现更复杂的样式

## 4. ⚠️ 无 index.less 样式文件

**症状**：无法自定义组件样式。

**原因**：

> 组件目录下没有 `index.less` 文件，无法添加自定义样式。

**修复**：
- 如需自定义样式，创建 `index.less` 文件
- 在 `index.tsx` 中引入样式文件

## 5. ✅ 最佳实践

1. **修改文本样式**时同步更新 `textStyle` 默认值
2. **启用文本对齐**时修改 `disableTextAlign` 配置
3. **修改自适应高度**时更新 `autoSize` 默认值
4. **新增数据字段**时确保在 `dataModel.json` 和组件中同步更新

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
