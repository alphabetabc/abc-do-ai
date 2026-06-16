---
title: progress-list-bar 踩坑记录
description: 水平进度图物料（progress-list-bar）实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar 踩坑记录

本文档记录 `progress-list-bar` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ 使用 transient props 避免 DOM 透传

**症状**：styled-components 的 props 被透传到 DOM，导致 HTML 属性污染。

**原因**：

```typescript
export const ProgressDot = styled.div<{ $size: number; $color: string; $enableAnimation: boolean }>`
    width: ${(props) => props.$size}px;
    height: ${(props) => props.$size}px;
    background-color: ${(props) => props.$color};
    animation: ${(props) => props.$enableAnimation && 'pulse 1.5s infinite'};
`;
```

> 使用 `$` 前缀的 transient props 可以避免 DOM 透传，防止 HTML 属性污染。

**修复**：
- 使用 `$size`、`$color`、`$enableAnimation` 替代 `size`、`color`、`enableAnimation`
- 确保所有 styled-components 的 props 都使用 `$` 前缀

## 2. ⚠️ 进度点动画使用 keyframes 实现

**症状**：进度点动画效果不流畅或性能差。

**原因**：

```typescript
@keyframes pulse {
    0% {
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }
    50% {
        transform: translateY(-50%) scale(1.2);
        opacity: 0.5;
    }
    100% {
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }
}
```

> 使用 `keyframes` 实现动画效果，避免频繁重绘，提升性能。

**修复**：
- 使用 `transform` 和 `opacity` 实现动画，避免使用 `width`、`height` 等会触发重绘的属性
- 使用 `will-change` 属性优化动画性能

## 3. ⚠️ 渐变色使用 linear-gradient 实现

**症状**：进度条颜色不渐变或渐变效果不自然。

**原因**：

```typescript
const progressStyle = {
    background: `linear-gradient(to right, #1890ff, #52c41a)`,
};
```

> 使用 `linear-gradient` 实现渐变色，支持多种渐变方向和颜色。

**修复**：
- 使用 `linear-gradient` 实现渐变色
- 支持多种渐变方向（`to right`、`to left`、`to top`、`to bottom`）

## 4. ⚠️ 数据源必须是数组格式

**症状**：数据源不是数组格式，导致渲染失败。

**原因**：

```typescript
const data = dataSource || [];
```

> 数据源必须是数组格式，每个数据项包含 `label`、`value`、`unit` 字段。

**修复**：
- 确保数据源是数组格式
- 使用 `dataSource || []` 提供默认值

## 5. ⚠️ 进度条宽度来自数据项的 value 字段

**症状**：进度条宽度不正确。

**原因**：

```typescript
const progressStyle = {
    width: `${item.value}%`,
};
```

> 进度条宽度来自数据项的 `value` 字段，必须是百分比（0-100）。

**修复**：
- 确保 `value` 字段是百分比（0-100）
- 如果 `value` 不是百分比，需要转换为百分比

## 6. ⚠️ 进度点动画在进度条内部渲染

**症状**：进度点动画位置不正确。

**原因**：

```typescript
<div className="progress" style={progressStyle}>
    {enableAnimation && (
        <ProgressDot
            $size={height}
            $color="#1890ff"
            $enableAnimation={enableAnimation}
        />
    )}
</div>
```

> 进度点动画在进度条内部渲染，使用 `position: absolute` 定位在进度条右侧。

**修复**：
- 确保进度点动画在进度条内部渲染
- 使用 `position: absolute` 和 `right: 0` 定位在进度条右侧

## 7. ⚠️ 使用 flex 布局

**症状**：进度条布局不正确。

**原因**：

```less
.row-item {
    display: flex;
    align-items: center;
    position: relative;

    .progress {
        position: relative;
        flex: 1;
    }

    .label {
        margin-right: 10px;
    }

    .value {
        margin-left: 10px;
    }
}
```

> 使用 flex 布局实现进度条、标签、值的水平排列。

**修复**：
- 使用 `display: flex` 和 `align-items: center` 实现水平排列
- 使用 `flex: 1` 让进度条占据剩余空间

## 8. 调试技巧

### 8.1 查看数据

```typescript
console.log('dataSource:', dataSource);
console.log('data:', data);
```

### 8.2 查看样式

```typescript
console.log('progressBarStyle:', progressBarStyle);
console.log('progressStyle:', progressStyle);
```

## 9. ✅ 最佳实践

1. **修改进度条样式**时同步更新 `progressBarStyle` 和 `progressStyle`
2. **修改进度点动画**时注意使用 `transform` 和 `opacity` 避免重绘
3. **新增数据字段**时确保在 `dataModel.json` 和组件中同步更新
4. **修改进度条方向**时注意调整样式
5. **修改进度点动画开关**时确保 `enableAnimation` 正确传递

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
