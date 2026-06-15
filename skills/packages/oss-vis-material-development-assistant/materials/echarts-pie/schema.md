---
title: Schema 结构
description: echarts-pie schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-15
---

# Schema 结构

源文件：`packages/echarts-pie/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'echarts-pie',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        defineDataConfigSchema({...}),   // 数据面板
        defineInteractionSchema({...}),  // 交互面板
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 图形 `chart`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `roseType` | boolean | 玫瑰图 | `Switch` | 开启后 `roseType: 'radius'` |
| `centerX` | string | 中心坐标-X | `Input` | 百分比字符串，如 `'50%'` |
| `centerY` | string | 中心坐标-Y | `Input` | 百分比字符串，如 `'50%'` |
| `innerRadius` | string | 内半径 | `Input` | 百分比字符串，如 `'25%'` |
| `outerRadius` | string | 外半径 | `Input` | 百分比字符串，如 `'80%'` |
| `startAngle` | number | 起始角度 | `NumberPicker` | 范围 [0, 360] |
| `minAngle` | number | 最小角度 | `NumberPicker` | 范围 [0, 360]，防止小扇区过小 |
| `customColors` | boolean | 自定义填充色 | `Switch` | 控制 `color` 字段显隐 |
| `color` | array | 填充色 | `BackgroundColorGroup2EC` | 渐变颜色数组，依赖 `customColors === true` |

> 注：`centerX/centerY` 和 `innerRadius/outerRadius` 使用 `Space` 组件水平排列，各占一行。

### 2.2 图例 `legend`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `show` | boolean | 显示/隐藏 | `Switch` | 控制整个图例区域显隐 |
| `type` | string | 类型 | `Radio.Group` | `plain`（普通）/ `scroll`（滚动） |
| `icon` | string | 图标 | `Select` | 8 种 ECharts 图标（circle/rect/roundRect/triangle/diamond/pin/arrow/none） |
| `orient` | string | 布局 | `Radio.Group` | `horizontal`（水平）/ `vertical`（垂直） |
| `left` | string | 左边距 | `Input` | 像素值或百分比或 `left/center/right` |
| `top` | string | 上边距 | `Input` | 同上 |
| `right` | string | 右边距 | `Input` | 像素值或百分比 |
| `bottom` | string | 下边距 | `Input` | 像素值或百分比 |
| `textStyle` | object | 图例文本 | `VisualTextStyle` | 文本样式子面板 |

> `type/icon/orient/left/top/right/bottom/textStyle` 全部依赖 `show === true` 才显示。

### 2.3 标签 `label`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `show` | boolean | 显示/隐藏 | `Switch` | 控制标签区域显隐 |
| `position` | string | 标签位置 | `Radio.Group` | `outside`（外部）/ `inside`（内部）/ `center`（中心） |
| `alignTo` | string | 对齐方式 | `Radio.Group` | `none`（默认）/ `labelLine`（引线对齐）/ `edge`（文字对齐），仅 `position === 'outside'` 时显示 |
| `textStyle` | object | 数值及单位 | `VisualTextStyle` | 标签文本样式 |
| `rich.name` | object | 分类名称 | `VisualTextStyle` | 分类名称文本样式 |

> `position/alignTo/textStyle/rich.name` 全部依赖 `show === true` 才显示。

### 2.4 标签引导线 `labelLine`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `show` | boolean | 显示/隐藏 | `Switch` | 控制引导线显隐 |
| `smooth` | boolean | 平滑 | `Switch` | 是否平滑曲线 |
| `length` | string | 第一段 | `NumberPicker` | 第一段引导线长度 |
| `length2` | string | 第二段 | `NumberPicker` | 第二段引导线长度 |

> `smooth/length/length2` 依赖 `show === true` 才显示。

### 2.5 悬浮提示 `tooltip`

| 字段 | 类型 | 标题 | x-component | 说明 |
|------|------|------|-------------|------|
| `show` | boolean | 显示/隐藏 | `Switch` | 控制悬浮提示显隐 |
| `name` | string | 标题 | `Input` | 悬浮提示标题文本 |
| `backgroundColor` | string | 背景色 | `ColorPicker` | 提示框背景色 |
| `borderColor` | string | 边框色 | `ColorPicker` | 提示框边框色 |
| `borderWidth` | number | 边框粗细 | `NumberPicker` | 提示框边框宽度 |
| `textStyle` | object | 标签文本 | `VisualTextStyle` | 提示框内文本样式 |

> `name/backgroundColor/borderColor/borderWidth/textStyle` 依赖 `show === true` 才显示。

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `BackgroundColorGroup2EC` | 自定义填充色（渐变颜色数组） | 仅 ECharts 图表类物料使用 |
| `VisualTextStyle` | 文本样式子面板（字号/颜色/粗细等） | 通用文本样式组件 |
| `DynamicData` | 数据面板（字段映射） | 通用数据配置组件 |
| `Space` | 水平排列多个输入框 | 用于 center/radius 成对输入 |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

- `width: 498, height: 401, left: 476, top: 354.5`
- `chart.roseType: true`（默认开启玫瑰图）
- `chart.centerX: '50%', chart.centerY: '50%'`
- `chart.innerRadius: '25%', chart.outerRadius: '80%'`
- `chart.customColors: true`（默认开启自定义填充色）
- `chart.color`：4 组线性渐变颜色
- `label.show: true, label.position: 'outside', label.alignTo: 'labelLine'`
- `labelLine.show: true`
- `tooltip.show: true, tooltip.name: '故障判断'`

## 5. 数据面板与交互面板

- **数据面板**：`DynamicData` 组件，`options.fields` 展开 `dataModel.json` 的 `header.dimensions + header.indicators`
- **交互面板**：已启用。包含"图形单击事件"（下钻配置 Modal/Drawer + 派发参数 `onClickId/Name/Value`），下钻开关与派发参数互斥（`x-disabled`）
