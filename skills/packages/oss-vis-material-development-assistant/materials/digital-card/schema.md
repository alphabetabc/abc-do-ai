---
title: Schema 结构
description: digital-card schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-15
---

# Schema 结构

源文件：`packages/digital-card/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'digital-card',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        DATA_CONFIG,                     // 数据面板（通用）
    ]
}
```

> 注意：digital-card **没有交互面板**（纯展示组件）。

## 2. FormCollapse 分组详情

### 2.1 背景 `containerStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `bgColorStart` | string | 背景色渐变开始颜色 | `ColorPicker` | 渐变起始色，`allowClear` |
| `bgColorEnd` | string | 背景色渐变结束颜色 | `ColorPicker` | 渐变终止色，`allowClear` |

### 2.2 标题 `listItemLabel`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `showLeftBorder` | boolean | 显示/隐藏左边框 | `Switch` | 控制左边框装饰线显隐 |
| `borderLeftColor` | string | 左边框颜色 | `ColorPicker` | 边框线条颜色，`allowClear` |
| `borderLeftWidth` | number | 左边框宽度 | `NumberPicker` | 边框线条宽度（像素） |
| `paddingLeft` | number | 左内边距 | `NumberPicker` | 标题区域左侧内边距 |
| `justifyContent` | string | 文字对齐方式 | `Select` | `start`（左）/ `center`（中）/ `end`（右） |
| `color` | string | 文字颜色 | `ColorPicker` | 标题文字颜色，`allowClear` |
| `fontSize` | number | 文字大小 | `NumberPicker` | 字体大小 |
| `fontWeight` | string | 文字粗细 | `Select` | 从 `FONT_WEIGHT` 常量映射 |

### 2.3 数值 `listItemValue`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `alignItems` | string | 对齐方式 | `Select` | `flex-start`（左）/ `center`（中）/ `flex-end`（右） |
| `color` | string | 字体颜色 | `ColorPicker` | 数值文字颜色，`allowClear` |
| `fontSize` | number | 字体字号 | `NumberPicker` | 数值字体大小 |
| `fontWeight` | string | 字体粗细 | `Select` | 从 `FONT_WEIGHT` 常量映射 |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `ColorPicker` | 颜色选择器 | 背景色、边框色、文字色 |
| `NumberPicker` | 数字输入 | 边框宽度、内边距、字号 |
| `Select` | 下拉选择 | 对齐方式、字重 |
| `Switch` | 开关 | 左边框显示/隐藏 |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

- `width: 150, height: 150, left: 15, top: 15`
- `containerStyle.bgColorStart: '#436570', containerStyle.bgColorEnd: '#059183'`
- `listItemLabel.showLeftBorder: true`
- `listItemLabel.borderLeftColor: '#1CAB88'`
- `listItemLabel.borderLeftWidth: 4`
- `listItemLabel.paddingLeft: 15`
- `listItemLabel.justifyContent: 'start'`
- `listItemLabel.fontSize: 25`
- `listItemLabel.fontWeight: 'bold'`
- `listItemLabel.color: ''`（空字符串，组件中回退到 `bgColorEnd`）
- `listItemValue.fontSize: 40`
- `listItemValue.color: '#ffffff'`
- `listItemValue.alignItems: 'center'`
- `listItemValue.fontWeight: 'normal'`

## 5. 数据面板与交互面板

- **数据面板**：使用通用 `DATA_CONFIG`，默认 JSON 数据为 `[{ label: '严重', value: 0 }]`
- **交互面板**：**未启用**（纯展示组件，无交互事件）
