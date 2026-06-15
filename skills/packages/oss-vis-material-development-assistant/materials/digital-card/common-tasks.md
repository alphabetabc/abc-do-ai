---
title: 常见修改任务
description: digital-card 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-15
---

# 常见修改任务

本文档列出针对 `digital-card` 最常见的修改需求及对应的代码定位。

## 任务 1：新增配置项（如圆角、阴影）

**场景描述**：需要为数字牌添加圆角或阴影效果。

**涉及文件**：
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-背景-containerstyle)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-背景渐变)

**步骤**：

1. 在 `schema.ts` 的 `containerStyle` 分组中添加字段：

```typescript
borderRadius: {
    title: '圆角',
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
},
boxShadow: {
    title: '阴影',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
},
```

2. 在 `index.jsx` 的 `render` 中读取并应用到外层 div：

```jsx
style={{
    ...,
    borderRadius: this.fnGetStyle('containerStyle')?.borderRadius,
    boxShadow: this.fnGetStyle('containerStyle')?.boxShadow,
}}
```

3. 在 `defaultValue.config.containerStyle` 中添加默认值。

## 任务 2：修改默认颜色 / 默认尺寸

**场景描述**：需要调整数字牌的默认背景色、标题颜色或默认宽高。

**涉及文件**：`schema.ts` 末尾 `defaultValue.config`

**步骤**：

修改 `containerStyle.bgColorStart` / `containerStyle.bgColorEnd` 或 `width` / `height` 等默认值。

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

## 任务 3：调整标题与数值的布局比例

**场景描述**：需要将标题和数值的高度比例从 30%:70% 改为其他比例。

**涉及文件**：
- 🟨 组件逻辑：[component-logic.md § 3.1](./component-logic.md#31-布局比例)

**步骤**：

在 `index.less` 中修改：

```less
.item-label {
    height: 40%;  // 改为 40%
}
.item-value {
    height: 60%;  // 改为 60%
}
```

## 任务 4：修复 `borderLeftColor` 未使用的问题

**场景描述**：schema 中有 `borderLeftColor` 配置项，但组件实际使用 `bgColorEnd` 作为左边框颜色。

**涉及文件**：
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-左边框处理)

**步骤**：

在 `index.jsx` 中将左边框颜色改为读取 `borderLeftColor`：

```jsx
borderLeft: !this.fnGetStyle('listItemLabel')?.showLeftBorder
    ? ''
    : `solid ${this.fnGetStyle('listItemLabel')?.borderLeftWidth}px ${
        this.fnGetStyle('listItemLabel')?.borderLeftColor || this.fnGetStyle('containerStyle')?.bgColorEnd
    }`,
```

## 任务 5：添加空数据保护

**场景描述**：`dataSource` 为空数组时组件报错。

**涉及文件**：
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-数据读取)

**步骤**：

在 `render` 中添加空值判断：

```jsx
const data = this.props.dataSource?.[0];
if (!data) return null;
// 然后使用 data.label / data.value
```
