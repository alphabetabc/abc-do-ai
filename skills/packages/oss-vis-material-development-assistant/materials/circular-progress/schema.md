---
title: Schema 结构
description: circular-progress schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/circular-progress/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'circular-progress',
    fields: [
        defineConfigSchema({...}),       // 配置面板（图形 / 翻牌器 / 标题）
        defineDataConfigSchema({...}),   // 数据面板
        // 当前未启用交互面板
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 基础配置（继承自 BASE_LAYOUT 与 getCompTitle）

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| --- | --- | --- | --- | --- |
| `title` | string | 标题 | `Input` | `config.title`（→ component-logic.md § 2.2） |
| `width` | number | 宽度 | `NumberPicker` | `config.width` |
| `height` | number | 高度 | `NumberPicker` | `config.height` |
| `left` | number | 左边距 | `NumberPicker` | `config.left` |
| `top` | number | 顶边距 | `NumberPicker` | `config.top` |
| `background` | string | 背景色 | `ColorPicker` | `config.background` |

### 2.2 图形（chartProps）

| 字段 | 类型 | 标题 | x-component | x-component-props | 说明 |
| --- | --- | --- | --- | --- | --- |
| `isGradient` | number | 渐变 | `Switch` | — | 启用后前景环使用 SVG `linearGradient` 渐变 |
| `circular` | number | 起点标识 | `Switch` | — | 启用后在前景环末端绘制实心圆点 |
| `radius` | number | 外半径 | `NumberPicker` | `{ min: 0, max: 1, step: 0.1 }` | 圆环外半径相对容器短边的比例 |
| `ringWidth` | number | 圆环宽度 | `NumberPicker` | `{ min: 0, max: 1, step: 0.1 }` | 圆环宽度相对外半径的比例 |
| `startPosition` | string | 起点位置 | `Select` | enum: top / bottom / left / right | 控制前景环起点方向 |
| `padding` | number | 内边距 | `NumberPicker` | — | 圆环相对 SVG 边缘的内边距（像素） |
| `backgroundColor` | string | 背景色 | `ColorPicker` | `{ allowClear: true }` | 背景环填充色 |
| `foregroundColor` | string | 前景色 | `ColorPicker` | `{ allowClear: true }` | 前景环填充色（非渐变模式） |
| `fillOpacity` | number | 填充色透明度 | `SliderWithNumber` | `{ min: 0, max: 1, step: 0.1 }` | 整体圆环透明度 |

### 2.3 翻牌器属性（digitalProps）

> 复用 `digital-flop` 物料的字段结构，并通过 `DigitalFlop` 组件渲染。详见 [digital-flop 文档](../digital-flop/schema.md)。

#### 2.3.1 数字（number）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `textStyle` | object | 文本 | `VisualTextStyle` | 字体 / 字号 / 颜色 / 字重，`disableLineHeight: true` |
| `flopType` | string | 翻牌器 | `Radio.Group` | enum: `normal`（普通）/ `classics`（经典） |
| `backgroundColor` | string | 背景颜色 | `ColorPicker` | 仅当 `flopType === 'classics'` 时显示（`x-reactions` 控制） |
| `backgroundRadius` | number | 背景圆角 | `NumberPicker` | 仅当 `flopType === 'classics'` 时显示 |
| `groupSeparator.show` | string | 开关 | `Switch` | `x-hidden: true`（内部字段，对用户隐藏） |
| `groupSeparator.separator` | string | 分隔符设置 | `Input` | 千分位分隔符 |
| `precision` | number | 默认位数 | `NumberPicker` | 小数位数 |
| `animation.show` | string | 开关 | `Switch` | `x-hidden: true`（内部字段） |
| `animation.duration` | string | 动画时长 | `NumberPicker` | 翻牌动画时长（毫秒） |

#### 2.3.2 趋势（trend）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `show` | string | 开关 | `Switch` | `x-hidden: true`（内部字段） |
| `threshold` | number | 临界值 | `NumberPicker` | 趋势判断临界值 |
| `iconSelect` | string | 趋势图标 | `Select` | 过滤掉 `custom`，使用 `ICON_SELECT` 预置图标 |
| `iconColorSettings.up` | string | 上升趋势 | `ColorPicker` | 上升趋势图标颜色 |
| `iconColorSettings.down` | string | 下降趋势 | `ColorPicker` | 下降趋势图标颜色 |
| `iconColorSettings.syncToNumber` | boolean | 影响数值颜色 | `Switch` | 同步影响数值颜色 |

#### 2.3.3 前缀（prefix）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `text` | string | 内容 | `Input` | 前缀文本 |
| `textStyle` | object | 文本 | `VisualTextStyle` | `disableLineHeight: true` / `disableTextAlign: true` |

#### 2.3.4 后缀（suffix）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `text` | string | 内容 | `Input` | 后缀文本（通常为单位） |
| `textStyle` | object | 文本 | `VisualTextStyle` | `disableLineHeight: true` / `disableTextAlign: true` |

> 注意：`suffix.text` 会被 `index.jsx` 中的 `digitalFlopResolve` **运行时覆盖**为 `data.unit`（详见 component-logic.md § 2.2）。

### 2.4 标题（titleProps）

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `visible` | boolean | 显示/隐藏 | `Switch` | 默认 `true` |
| `textStyle` | object | 文本样式 | `VisualTextStyle` | `disableLineHeight: true` / `disableTextAlign: true`；依赖 `visible`（`x-reactions` 控制） |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `VisualTextStyle` | 文本样式聚合（字体 / 字号 / 颜色 / 字重 / 对齐） | 通过 `x-component-props.disableLineHeight/disableTextAlign` 控制字段裁剪 |
| `SliderWithNumber` | 滑块 + 数字输入组合 | 用于 `fillOpacity` 这类 0~1 区间数值 |
| `FormCollapse` / `FormCollapse.CollapsePanel` | 折叠面板 | 多层嵌套：`config → chartProps/digitalProps/titleProps → 子面板` |
| `CustomCollapse` | 自定义折叠（用于 `groupSeparator` / `animation` 这类组合字段） | 标题由 `x-component-props.title` 指定 |
| `Switch` | 开关 | 数字类型（`type: 'number'`）承载布尔语义，框架会自动转 bool |
| `ColorPicker` | 颜色选择 | 多个色值字段统一使用 |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue` 关键项：

- **数据**：`dataConfig.json: { percent: 98, unit: '%', title: 'vEPC附着成功率' }`
- **尺寸**：`width: 400, height: 250, left: 15, top: 15`
- **图形**：
    - `isGradient: true, circular: true`
    - `radius: 1, ringWidth: 0.2, fillOpacity: 1`
    - `startPosition: 'right'`
    - `backgroundColor: 'rgba(0, 152, 206, 0.39)'`
    - `foregroundColor: 'rgba(2, 222, 255, 1)'`
- **翻牌器数字**：`textStyle.fontSize: 40, color: '#09C5E1', fontWeight: '500', backgroundColor: '#104193'`，`flopType: 'normal'`，`fontFamily: 'DIN'`
- **翻牌器千分位**：`show: true, separator: ''`
- **翻牌器动画**：`show: true, duration: 1000`
- **标题**：`visible: true, fontFamily: 'Source Han Sans CN', fontSize: 22, fontWeight: '300', color: 'rgba(255, 255, 255, 1)'`

## 5. 数据面板与交互面板

- **数据面板**：`DynamicData`，`fields` 由 `dataModel.dataModelDefinition.header.dimensions + indicators` 展开（`→ data-model.md`）
- **交互面板**：**当前未启用**（本物料为纯展示组件，无下钻 / 派发事件）
