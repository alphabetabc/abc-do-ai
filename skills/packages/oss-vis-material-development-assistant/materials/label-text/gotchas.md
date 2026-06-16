---
title: label-text 踩坑记录
description: 标题物料（label-text）实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# label-text 踩坑记录

本文档记录 `label-text` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ dataConfig 默认数据是对象，但组件兼容数组格式

**症状**：`dataConfig.json` 默认数据是对象 `{ content: '', iconType: '' }`，但组件代码中同时兼容了对象和数组两种格式。

**原因**：

```typescript
// index.jsx:140
let realText = dataSource?.content || dataSource?.[0]?.content || textContainer.content;
```

> 组件代码尝试从 `dataSource?.content`（对象格式）和 `dataSource?.[0]?.content`（数组格式）中读取文本，兼容两种格式。

**影响**：
- 如果数据源返回数组格式，需要使用 `dataSource[0].content`
- 如果数据源返回对象格式，需要使用 `dataSource.content`
- 当前代码通过 `||` 运算符兼容两种格式，但可能导致混淆

**建议**：
- 在文档中明确说明数据源格式
- 如果可能，统一数据源格式为数组

## 2. ⚠️ 渐变文本需要使用 CSS 裁剪

**症状**：设置渐变文本后，文本显示为纯色而非渐变。

**原因**：

```less
// index.less
.label-text-gradient {
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

> 渐变文本需要添加 `label-text-gradient` 类名，使用 `background-clip: text` 和 `-webkit-text-fill-color: transparent` 实现文本渐变效果。

**修复**：
- 确保在渲染文本时添加了 `className={classNames({ 'label-text-gradient': textSetting.textStyle.isGradient })}`
- 确保 `index.less` 中包含 `.label-text-gradient` 样式

## 3. ⚠️ 倒影使用 transform 会反转内容

**症状**：倒影中的文本和图标被垂直翻转。

**原因**：

```typescript
// index.jsx:225
transform: 'scale(1,-1)',
```

> 倒影使用 `transform: scale(1,-1)` 垂直翻转，这会同时翻转内容（文本和图标）。

**影响**：
- 倒影中的文本是倒置的
- 倒影中的图标也是倒置的

**建议**：
- 这是预期行为，倒影本身就是倒置的
- 如果不需要倒置效果，需要移除倒影功能

## 4. ⚠️ 气泡内容支持 <br/> 换行，需要手动分割

**症状**：气泡内容中的 `<br/>` 标签未被解析为换行。

**原因**：

```typescript
// index.jsx:196
setMsgNode(convertTips(_.split(toolTips, '<br/>')));
```

> 气泡内容使用 `_.split(toolTips, '<br/>')` 分割，将字符串按 `<br/>` 分割为数组，然后渲染为多个 `<div>`。

**修复**：
- 在 schema 的 `title` 字段中添加提示：`'气泡内容默认为标题内容，文字换行示例：第一行<br/>第二行<br/>第三行'`
- 确保用户输入的内容使用 `<br/>` 作为换行符

## 5. ⚠️ iconType 字段在 dataModel 中定义，但组件未使用

**症状**：在 dataModel 中定义了 `iconType` 字段，但在组件代码中未使用。

**原因**：

```json
// dataModel.json
{
    "dataType": "String",
    "fieldLabel": "标题Icon",
    "fieldName": "iconType",
    "fieldUnit": "",
    "list": "true",
    "rowProperties": ["format"]
}
```

> `iconType` 字段在 dataModel 中定义，但组件代码中**未使用**。前缀图标来自 schema 的 `prefix` 配置，而非数据驱动。

**影响**：
- 数据源中的 `iconType` 字段不会被渲染
- 前缀图标只能通过 schema 配置

**建议**：
- 如果需要数据驱动图标，需要修改组件代码
- 如果不需要，可以从 dataModel 中移除 `iconType` 字段

## 6. ⚠️ 垂直文本使用 transform 旋转，可能影响布局

**症状**：设置垂直文本后，标题的布局发生变化。

**原因**：

```typescript
// index.jsx:122
if (textSetting.textStyle.textDirection === 'vertical') {
    Object.assign(innerContainerStyle, {
        transform: 'rotate(90deg)',
    });
}
```

> 垂直文本使用 `transform: rotate(90deg)` 旋转 90 度，这会改变元素的视觉位置，但不改变文档流。

**影响**：
- 旋转后的元素可能超出容器边界
- 旋转后的元素可能与其他元素重叠

**建议**：
- 调整容器的 `width` 和 `height` 以适应旋转后的元素
- 使用 `transform-origin` 调整旋转中心点

## 7. ⚠️ 倒影中移除了边框样式

**症状**：倒影中没有边框。

**原因**：

```typescript
// index.jsx:235
..._.omit(innerContainerStyle, ['borderColor', 'borderWidth', 'borderStyle']),
```

> 倒影中使用 `_.omit` 移除了边框样式（`borderColor`、`borderWidth`、`borderStyle`），避免倒影中出现边框。

**影响**：
- 倒影中没有边框
- 这是预期行为

## 8. ⚠️ 下钻交互中 Modal/Drawer 使用 interaction.dispatch

**症状**：点击标题后，Modal/Drawer 未弹出。

**原因**：

```typescript
// index.jsx:166
interaction.dispatch({
    data: [
        {
            fieldName: 'clickEvent',
            state: {
                visible: true,
                param: realText,
            },
        },
    ],
});
```

> Modal/Drawer 使用 `interaction.dispatch` 触发，需要确保 `interaction` 对象存在且 `dispatch` 方法可用。

**修复**：
- 确保在 schema 中配置了下钻交互
- 确保 `interaction` 对象存在
- 检查 `interaction.dispatch` 是否正确调用

## 9. 调试技巧

### 9.1 查看文本来源

```typescript
console.log('realText:', realText);
console.log('interactionProps:', props.interactionProps);
console.log('receivedPropsParams:', props.receivedPropsParams);
console.log('dataSource:', dataSource);
```

### 9.2 查看文本样式

```typescript
console.log('labelTextStyle:', labelTextStyle);
console.log('innerContainerStyle:', innerContainerStyle);
```

### 9.3 查看气泡内容

```typescript
console.log('toolTips:', toolTips);
console.log('msgNode:', msgNode);
```

## 10. ✅ 最佳实践

1. **修改文本效果**时同步更新 `labelTextStyle` 和 CSS 样式
2. **新增背景效果**时注意与文本效果的兼容性
3. **修改前缀图标**时注意 `prefixiIConType` 的类型判断
4. **调整下钻交互**时确保 `interaction.dispatch` 正确调用
5. **修改气泡内容**时注意 `<br/>` 换行符的处理

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
