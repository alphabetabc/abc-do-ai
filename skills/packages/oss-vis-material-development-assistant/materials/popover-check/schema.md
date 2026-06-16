---
title: Schema 结构
description: popover-check schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/popover-check/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'popover-check',
    fields: [
        defineConfigSchema({...}),                    // 配置面板
        renderDataConfig({...}),                       // 数据面板
        defineInteractionSchema({...}),                // 交互面板
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 基础配置（继承自 BASE_LAYOUT 与 getCompTitle）

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| --- | --- | --- | --- | --- |
| `title` | string | 标题 | `Input` | `config.title` |
| `width` | number | 宽度 | `NumberPicker` | `config.width` |
| `height` | number | 高度 | `NumberPicker` | `config.height` / `compHeight`（兜底 maxHeight） |
| `left` | number | 左边距 | `NumberPicker` | `config.left` |
| `top` | number | 顶边距 | `NumberPicker` | `config.top` |
| `background` | string | 背景色 | `ColorPicker` | `config.background` |
| `isLock` | boolean | 锁定 | `Switch` | `config.isLock` |
| `isHidden` | boolean | 隐藏 | `Switch` | `config.isHidden` |

### 2.2 功能设置（funcSettings）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `autoInit` | boolean | 自动初始化 | `Switch` | 启用后首次加载自动选中第一项；默认 `true` |
| `placeholder` | string | 选择框占位符 | `Input` | 无选中项时显示的占位文本；默认 `'请选择'` |

### 2.3 选择框样式（selectedStyle）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `prefixText` | string | 前缀 | `Input` | 选中项前的标签文本（如 `'前缀 :'`） |
| `checkMode` | string | 选中模式 | `Select` | enum: `multi`（多选）/ `single`（单选） |
| `width` | number | 宽度 | `NumberPicker` | 选择框宽度（像素） |
| `height` | number | 高度 | `NumberPicker` | 选择框高度（像素） |
| `borderColor` | string | 边框颜色 | `ColorPicker` | 边框 2px 描边色 |
| `textStyle` | object | 文本样式 | `VisualTextStyle` | `disableLineHeight: true` / `disableTextAlign: true` |

### 2.4 弹窗样式（popoverStyle）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `borderWidth` | number | 线宽 | `NumberPicker` | SVG path 描边宽度 |
| `borderColor` | string | 线条颜色 | `ColorPicker` | SVG path 描边色 |
| `backgroundColor` | string | 背景颜色 | `ColorPicker` | SVG path 填充色 |
| `maxHeight` | number | 最大高度 | `NumberPicker` | 弹窗列表最大高度，超出滚动 |
| `popoverTop` | number | 弹窗距离顶部位置 | `NumberPicker` | 弹窗相对选择框的 top 偏移（像素） |
| `popoverBorderRotate` | number | 弹窗旋转角度 | `NumberPicker` | 整个 SVG 边框的旋转角度（度） |

### 2.5 箭头样式（arrowStyle）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `size` | number | 大小 | `NumberPicker` | 三角形箭头边长（像素） |
| `rotate` | number | 旋转角度 | `NumberPicker` | 三角形旋转角度（度） |
| `color` | string | 颜色 | `ColorPicker` | 三角形颜色 |
| `marginLeft` | number | 左边距 | `NumberPicker` | — |
| `marginTop` | number | 上边距 | `NumberPicker` | 默认值 `selectedStyle.height - 20`（代码 fallback） |
| `marginRight` | number | 右边距 | `NumberPicker` | — |
| `marginBottom` | number | 下边距 | `NumberPicker` | — |

## 3. 数据面板与交互面板

### 3.1 数据面板

`renderDataConfig({...})` 渲染的数据配置面板：

| 配置 | 值 | 说明 |
| --- | --- | --- |
| `fields` | `[...dimensions, ...indicators]` | dataModel 字段全展开（→ data-model.md） |
| `showDataStatusSwitch` | `true` | 显示数据状态开关 |

### 3.2 交互面板 `defineInteractionSchema`

> 派发参数逻辑见 component-logic.md § 2.2。

#### 3.2.1 下拉框选中事件

| 派发参数 | 标题 | 类型 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `select` | 选中项 id | string | `Input` | 派发当前选中项的 id 数组（多选用数组，单选也为数组形式） |
| `selectLabel` | 选中项 name | string | `Input` | 派发当前选中项的 label 数组（注意：标题写"name"实际是"label"） |

## 4. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `VisualTextStyle` | 文本样式聚合 | `disableLineHeight: true` / `disableTextAlign: true` |
| `FormCollapse` / `FormCollapse.CollapsePanel` | 折叠面板 | 多层嵌套（配置 / 数据 / 交互三层） |
| `Switch` | 开关 | — |
| `ColorPicker` | 颜色选择 | — |
| `Input` | 文本输入 | 派发参数 fieldName |
| `Select` | 下拉选择 | checkMode、iconSelect 等枚举值用 |
| `NumberPicker` | 数字输入 | — |
| `DynamicData`（来自 `renderDataConfig`） | 动态数据源配置 | — |

## 5. 默认值参考

`schema.ts` 末尾 `defaultValue` 关键项：

- **数据**：
    ```json
    [
        { "id": "id-01", "label": "广东" },
        { "id": "id-02", "label": "广西" },
        { "id": "id-03", "label": "海南" },
        { "id": "id-04", "label": "河南" },
        { "id": "id-05", "label": "湖南" },
        { "id": "id-06", "label": "湖北" }
    ]
    ```
- **尺寸**：`width: 500, height: 500, left: 15, top: 15`
- **功能**：`autoInit: true, placeholder: '请选择'`
- **选择框**：`prefixText: '前缀 :'`, `checkMode: 'multi'`, `width: 252, height: 44, borderColor: '#214C80'`
- **选择框文本**：`fontSize: 24, color: '#3ABBE8', fontWeight: '500'`
- **弹窗**：`borderWidth: 1, borderColor: '#3ABBE8', backgroundColor: 'rgba(3, 19, 40, 0.8)'`
- **箭头**：`size: 12, color: '#44b0f9', rotate: 44, marginTop: 10`

## 6. 隐式字段（schema 中未声明但代码读取）

| 字段 | 位置 | 说明 |
| --- | --- | --- |
| `defaultCheckedValue` | `index.jsx` 第 21 行 | 默认已选中的 id 列表，schema 中未暴露 |

> 详见 [gotchas.md § 1](./gotchas.md#1-隐式字段-defaultcheckedvalue)。
