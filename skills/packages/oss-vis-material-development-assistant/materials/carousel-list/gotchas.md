---
title: carousel-list 踩坑记录
description: 轮播列表(垂直)物料（carousel-list）实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# carousel-list 踩坑记录

本文档记录 `carousel-list` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ 轮播时间间隔小于 1 时不生效

**症状**：设置 `swiperTimer < 1` 时，轮播不启动。

**原因**：

```typescript
// index.jsx:83
if (swiperTimer < 1) {
    return;
}
```

> 组件代码检查 `swiperTimer < 1`，如果为 true 则不启动轮播。

**修复**：
- 确保 `swiperTimer >= 1`
- 如需支持更小的时间间隔，修改判断条件

## 2. ⚠️ 多色配置使用 ColorGroup 组件

**症状**：多色配置不生效。

**原因**：

```typescript
// schema.ts:248
customColors: {
    title: '自定义填充色',
    component: 'colorGroup',
    type: 'array',
    'x-decorator': 'FormItem',
    'x-component': 'ColorGroup',
    description: '可增加多个配色项，依次映射从上到下的颜色',
    'x-reactions': {
        dependencies: ['.isCustomColors'],
        when: '{{ $deps[0] === true }}',
        fulfill: {
            state: { visible: true },
        },
        otherwise: {
            state: { visible: false },
        },
    },
},
```

> 多色配置使用 `ColorGroup` 组件，需要 `isCustomColors` 为 true 才显示。

**修复**：
- 确保 `isCustomColors` 为 true
- 确保 `customColors` 数组有值

## 3. ⚠️ 分割线使用 backgroundImage 实现虚线效果

**症状**：分割线样式不正确。

**原因**：

```typescript
// index.jsx:53
const divider = {
    width: dividerStyle?.width,
    height: 5,
    backgroundImage: `linear-gradient(to right, ${dividerStyle?.color} ${dividerStyle?.density}%, transparent ${dividerStyle?.density}%)`,
    backgroundSize: `${dividerStyle?.dashedwidth}px 1px`,
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'center',
};
```

> 分割线使用 `backgroundImage` 和 `backgroundSize` 实现虚线效果。

**修复**：
- 确保 `dividerStyle` 配置正确
- 确保 `density` 和 `dashedwidth` 配合使用

## 4. ⚠️ 选中状态使用 name 字段判断

**症状**：选中状态判断不正确。

**原因**：

```typescript
// index.jsx:115
style={current === item?.name ? selected : { width: style?.width, height: style?.height }}
```

> 选中状态使用 `current === item?.name` 判断，而非 `currentIndex === index`。

**影响**：
- 如果 `name` 字段有重复，可能导致多个项同时选中
- 建议使用 `currentIndex === index` 判断

**建议**：
- 修改为使用索引判断：`currentIndex === index`

## 5. ⚠️ 图标颜色使用 DEFAULT_COLORS 作为默认值

**症状**：图标颜色不正确。

**原因**：

```typescript
// index.jsx:43
const colors = style.customColors && style.customColors.length > 0 
    ? style.customColors.map((item) => item.color) 
    : DEFAULT_COLORS;
```

> 如果 `customColors` 为空，使用 `DEFAULT_COLORS` 作为默认值。

**修复**：
- 确保 `DEFAULT_COLORS` 数组有值
- 或在 schema 中配置 `customColors` 默认值

## 6. ⚠️ 轮播索引使用 useRef 存储

**症状**：轮播索引不正确。

**原因**：

```typescript
// index.jsx:80
const carouselIndex = useRef(0); // 轮播索引
```

> 使用 `useRef` 存储轮播索引，避免重渲染。

**影响**：
- `carouselIndex.current` 不会触发重渲染
- 需要使用 `setCurrentIndex` 触发重渲染

## 7. ⚠️ 定时器清理

**症状**：组件卸载后定时器仍在运行。

**原因**：

```typescript
// index.jsx:93
return () => {
    clearInterval(timer);
};
```

> 使用 `clearInterval` 清理定时器。

**修复**：
- 确保 `useEffect` 返回清理函数
- 确保 `swiperTimer` 变化时重新创建定时器

## 8. ⚠️ 样式构建未使用 useMemo

**症状**：每次渲染都重新构建样式。

**原因**：

> 样式构建未使用 `useMemo` 缓存，可能导致性能问题。

**建议**：
- 使用 `useMemo` 缓存样式构建结果

## 9. 调试技巧

### 9.1 查看轮播状态

```typescript
console.log('currentIndex:', currentIndex);
console.log('current:', current);
```

### 9.2 查看样式

```typescript
console.log('selected:', selected);
console.log('divider:', divider);
```

## 10. ✅ 最佳实践

1. **修改轮播时间**时确保 `swiperTimer >= 1`
2. **修改选中样式**时同步更新 `selectedStyle` 默认值
3. **修改分割线样式**时注意 `density` 和 `dashedwidth` 配合
4. **修改字体样式**时注意 `isCustomColors` 开关
5. **新增数据字段**时确保在 `dataModel.json` 和组件中同步更新

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
