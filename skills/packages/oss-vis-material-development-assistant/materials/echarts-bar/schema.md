---
title: Schema 结构
description: echarts-bar schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-15
---

# Schema 结构

源文件：`packages/echarts-bar/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'echarts-bar',
    fields: [
        { name: '配置', key: 'config', schema: {...} },           // 6 个 FormCollapse 分组
        { name: '数据', key: 'dataConfig', schema: {...} },       // DynamicData
        { name: '交互', key: 'interactions', schema: {...} },     // 单击事件 + 下钻
    ]
}
```

| 面板 | 通用工厂 | 说明 |
|------|----------|------|
| 配置 | `getCompTitle` + `BASE_LAYOUT` | 标题 + 基础布局 |
| 数据 | `DynamicData` (内联) | 展开 `dataModel.json` 字段 |
| 交互 | 内联 | 仅下钻配置 + 派发参数 |

## 2. FormCollapse 分组详情（config）

### 2.1 图形样式 `chart`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `barMaxWidth` | number | NumberPicker | 图形最大宽度 |
| `customColors` | boolean | Switch | 自定义填充色开关 |
| `color` | array | `BackgroundColorGroup2EC` | 渐变填充色，依赖 `customColors` |
| `borderRadius` | object | Space+NumberPicker | 4 向圆角（top/right/bottom/left） |
| `showBackground` | boolean | Switch | 显示图形背景 |
| `backgroundColor` | string | ColorPicker | 图形背景颜色 |
| `showBarDecal` | boolean | Switch | 显示图案填充 |
| `barDecalSetting` | object | Input/NumberPicker | `dashArrayX/Y`（字符串逗号分隔）+ `rotation`（-180~180，默认 -45） |

### 2.2 图形文本标签 `label`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 显示/隐藏（**false 时整个 `$collapse` 内字段隐藏**） |
| `textStyle` | object | `VisualTextStyle` | 文本样式 |
| `colorInherit` | boolean | Switch | 标签文字与图形同色 |
| `position` | string | Select | 13 种 ECharts 位置（outside/top/left/.../insideBottomRight） |
| `width` | number | NumberPicker | 标签宽度（仅 `position === 'outside'` 时显示） |
| `padding` | array | `ArrayCards` | 标签文本与图形间距（每项含 left/top/right/bottom） |

### 2.3 X轴 `xAxis`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `showAxisLine` | boolean | Switch | 显示轴线 |
| `axisLineSetting` | object | ColorPicker+NumberPicker+Input | 颜色/宽度/线型（solid\|dashed\|dotted） |
| `showAxisLabel` | boolean | Switch | 显示轴标签（默认 true） |
| `axisLabel` | object | `VisualTextStyle` | 轴标签样式 |
| `max` | number | NumberPicker | X轴最大值 |

### 2.4 Y轴 `yAxis`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `showAxisLine` | boolean | Switch | 显示轴线 |
| `axisLineSetting` | object | 同 X 轴 | 颜色/宽度/线型 |
| `axisLabel` | object | `VisualTextStyle` | 轴标签样式 |

> ⚠️ 注意：Y 轴**没有 `max`**，因为它是类目轴。

### 2.5 网格 `grid`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 显示/隐藏 |
| `containLabel` | boolean | Switch | 包含刻度标签（详见 ECharts 文档） |
| `left/top/right/bottom` | string | Input | 支持像素值、`'20%'`、`'left/center/right'` |

### 2.6 图例 `legend`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 显示/隐藏（**false 时整个 `$empty` 内字段隐藏**） |
| `type` | string | Radio.Group | `plain`（普通）/ `scroll`（滚动） |
| `icon` | string | Select | 8 种 ECharts icon（circle/rect/roundRect/triangle/diamond/pin/arrow/none） |
| `orient` | string | Radio.Group | `horizontal` / `vertical` |
| `left/top/right/bottom` | string | Input | 同 grid 定位规则 |
| `textStyle` | object | `VisualTextStyle` | 图例文本 |

### 2.7 悬浮提示 `tooltip`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 显示/隐藏 |
| `backgroundColor` | string | ColorPicker | 背景色 |
| `borderColor` | string | ColorPicker | 边框色 |
| `borderWidth` | number | NumberPicker | 边框粗细 |
| `textStyle` | object | `VisualTextStyle` | 标签文本 |

## 3. 交互面板（interactions）

### 3.1 单击事件 `$onClickAction`

```
$onClickAction (FormCollapse.CollapsePanel "图形单击事件")
  └── $collapse (FormCollapse)
      ├── configurableEvent (FormCollapse.CollapsePanel "下钻配置")
      │   └── drilldownEvent
      │       ├── show: Switch "下钻开关"
      │       ├── effect: Select "事件效果" → Modal | Drawer  ⚠️ 仅此 2 种
      │       ├── modalSet: Show when effect === 'Modal' (params/drilldownItemFields/position/size/closeIconPosition/closeIconFont/mask/closable)
      │       └── drawerSet: Show when effect === 'Drawer' (params/drilldownItemFields/title/placement/width/height/mask/closable)
      └── '$collapsePanel-click' (FormCollapse.CollapsePanel "派发参数")
          └── onClickId / onClickName / onClickValue (Input, 字段名映射)
```

#### 3.1.1 Modal / Drawer 差异

| 维度 | Modal | Drawer |
|------|-------|--------|
| 位置 | left / top (NumberPicker) | placement: top/bottom/left/right (Select) |
| 尺寸 | width + height | width（仅 left/right）/ height（仅 top/bottom） |
| 关闭 | closeIconPosition + closeIconFont | closable Switch（默认左上角） |
| 标题 | ❌ 无 | ✅ title |
| 遮罩 / 关闭 | mask + closable | mask + closable |

#### 3.1.2 派发参数

```typescript
// 派发参数在 schema 里的字段名（如 'indicatorId'），实际值从 data.__rawData__ 读
'onClickId': interaction.defined?.onClickId,    // data.id
'onClickName': interaction.defined?.onClickName, // data.name ?? chartObj.name
'onClickValue': interaction.defined?.onClickValue, // data.value
```

> 派发参数面板在下钻开关打开时**自动 disabled**（`'x-disabled': true`）。

## 4. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `FormCollapse` / `FormCollapse.CollapsePanel` | 分组手风琴 | 全局标配 |
| `BackgroundColorGroup2EC` | 多组渐变填充色编辑 | 仅 `chart.color` |
| `VisualTextStyle` | 通用文本样式 | `label.textStyle` / `axisLabel` / `legend.textStyle` / `tooltip.textStyle` |
| `ArrayCards` | 数组卡片（标签 padding） | 详见 [references/schema-reference.md § ArrayCards](../references/schema-reference.md) |
| `DynamicData` | 数据映射面板 | 接收 `dataModel.json` 的 `header.dimensions + indicators` |
| `Space` | 行内排版 | 圆角 4 向、Modal 位置、Modal 尺寸 |
| `Radio.Group` | 单选 | `optionType: 'button'` |

## 5. 默认值参考

`schema.ts` 末尾 `defaultValue` 的关键项：

### 5.1 config

```typescript
{
    width: 498, height: 401, left: 424, top: 317.5,
    chart: {
        barMaxWidth: 16,
        showBackground: true,
        backgroundColor: 'rgba(82, 168, 255, 0.1)',
        customColors: true,
        color: [/* 2 个线性渐变 */],
        borderRadius: { top: 0, right: 8, bottom: 8, left: 0 },
    },
    legend: { show: true, type: 'plain', orient: 'horizontal' },
    label: { show: true, position: 'outside', colorInherit: true },
    grid: { show: false, left: '30', top: '0', right: '60', bottom: '0' },
    tooltip: { show: true, name: '业务质量' },
    xAxis: { max: 20 },
}
```

### 5.2 dataConfig

```json
{
    "dataType": "json",
    "json": [
        { "dimensionName": "2G", "compareType": "小区数(万)", "indicatorId": 1, "indicatorValue": 15, "unit": "万" },
        // ... 6 条数据
    ],
    "isRefresh": false,
    "refreshTime": 300
}
```

## 6. 跨文档引用

- `chart.color` / `barDecalSetting` / `borderRadius` 等渲染细节 → [component-logic.md § 2.2](./component-logic.md#22-关键逻辑) / [options.ts 源码](file:///e:/oss-fe-git/phoenix/oss-visual-material/src/packages/echarts-bar/options.ts)
- `interaction.defined.onClickId/Name/Value` 字段映射 → [component-logic.md § 2.2.1](./component-logic.md#221-点击事件-onitemclick)
- `DynamicData` 展开的字段（`dimensionName` / `compareType` / `indicatorValue`）→ [data-model.md § 2](./data-model.md#2-字段说明)
