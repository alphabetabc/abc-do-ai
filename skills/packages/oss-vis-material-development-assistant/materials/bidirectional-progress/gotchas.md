---
title: 踩坑记录
description: 横向柱形图实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `bidirectional-progress` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 反向显示：CSS transform 的副作用

**症状**：左侧进度条使用 `transform: scale(-1, 1)` 反向显示后，内部的斜线背景和文本也被反转了。

**原因**：`scale(-1, 1)` 会反转所有子元素的水平方向。

**修复**：
- 斜线角度在反向时取反：`reverse ? -obliqueLineDeg : obliqueLineDeg`（见 `Progress/index.tsx` 第 48 行）
- 文本通过额外的 `transform: scale(-1, 1)` 再反转回来（见 `progress/index.less` 第 17-19 行）

## 2. 百分比超过 100% 的边界处理

**症状**：当 `leftData > leftMax` 时，进度条可能溢出容器。

**原因**：oss-ui Progress 的 `percent` 属性可以超过 100，但视觉上会超出容器。

**修复**：在 `Progress` 子组件中，当 `percent > 100` 时，标签定位使用完整宽度 + `labelMargin` 而非按比例计算：

```typescript
if (percent > 100) {
    barWidth = width + labelMargin;
} else {
    barWidth = (width * percent) / 100 + labelMargin;
}
```

但进度条本身仍会超出容器宽度，建议在 schema 层面限制 `dataMax` 不小于实际数据值。

## 3. 斜线背景的浏览器兼容性

**症状**：某些旧版浏览器上斜线背景显示异常。

**原因**：`ContainerStyle.ts` 中使用 `linear-gradient` 生成斜线，`background-size: 7px 7px` 的渲染效果在不同浏览器上有细微差异。

**修复**：保持 `background-size` 为整数像素值（7px），避免使用小数。如需跨浏览器一致，可考虑使用 SVG 背景图替代。

## 4. styled-components ContainerStyle 的 props 传递

**症状**：斜线背景或边框样式不生效。

**原因**：`ContainerStyle` 是一个 styled-components 包裹层，其 props 必须显式传递。在 `Progress/index.tsx` 中：

```tsx
<ContainerStyle border={border} obliqueLineDeg={...} obliqueLineColor={obliqueLineColor}>
```

如果漏传 `border` 或 `obliqueLineColor`，会导致边框/斜线颜色不显示（`undefined` 值会使 CSS 属性无效）。

## 5. 数据字段类型为 String 的数值计算

**症状**：百分比计算结果为 `NaN`。

**原因**：`dataModel.json` 中所有字段的 `dataType` 均为 `String`，但组件直接进行数值运算：

```typescript
const leftPercent = (leftData / (leftMax || leftMaxConfig || 100)) * 100;
```

如果 `leftData` 或 `leftMax` 为字符串（如 `"230"`），JavaScript 的除法运算会自动转换，但如果包含非数字字符（如 `"230GB"`）则结果为 `NaN`。

**建议**：在计算前使用 `Number()` 显式转换，或确保数据源传入纯数字字符串。

## 6. 中间标题的尺寸设置

**症状**：中间标题区域宽度不够，导致文本截断或换行。

**原因**：`labelConfig.labelSize` 使用 `Size` 组件配置，但默认值中 `height` 被注释掉了：

```typescript
labelSize: {
    width: 100,
    // height: 50,
},
```

**建议**：根据实际文本长度调整 `labelSize.width`，或设置合适的 `height` 值。

## 7. 调试小技巧

### 7.1 查看完整配置和数据结构

```typescript
// 在 index.tsx 中
console.log('Full config:', JSON.stringify(config, null, 2));
console.log('Data source:', JSON.stringify(dataSource, null, 2));
```

### 7.2 检查斜线背景是否生效

```typescript
// 在浏览器控制台中
document.querySelector('.oblique-line-bg .oss-ui-progress-bg')?.computedStyleMap()?.get('background-image');
```

## 维护历史

| 日期 | 问题 | 修复 |
| ---- | ---- | ---- |
| 2026-06-16 | 初始文档创建 | 物料文档体系建设 |
