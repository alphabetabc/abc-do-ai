---
title: 常见修改任务
description: echarts-pie 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-15
---

# 常见修改任务

本文档列出针对 `echarts-pie` 最常见的修改需求及对应的代码定位。

## 任务 1：新增配置项（如图形描边、动画）

**场景描述**：需要为饼图扇区添加描边效果或自定义动画。

**涉及文件**：
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-图形-chart)
- 🟨 组件逻辑：[component-logic.md § 3.2](./component-logic.md#322-图形配置)

**步骤**：

1. 在 `schema.ts` 的 `chart` 分组中添加字段：

```typescript
stroke: {
    type: 'object',
    title: '描边',
    'x-decorator': 'FormItem',
    properties: {
        color: {
            type: 'string', title: '颜色',
            'x-decorator': 'FormItem', 'x-component': 'ColorPicker',
        },
        width: {
            type: 'number', title: '线条粗细',
            'x-decorator': 'FormItem', 'x-component': 'NumberPicker',
        },
    },
},
```

> 注：schema.ts 中已有被注释掉的 `stroke` 代码块（L147-L165），可直接取消注释使用。

2. 在 `options.ts` 的 `getOption` 中读取并应用到 `series[0].itemStyle`：

```typescript
if (chart.stroke) {
    option.series[0].itemStyle = {
        ...option.series[0].itemStyle,
        borderColor: chart.stroke.color,
        borderWidth: chart.stroke.width,
    };
}
```

3. 在 `defaultValue.config.chart` 中添加默认值。

## 任务 2：调整默认颜色

**场景描述**：需要修改饼图的默认渐变颜色方案。

**涉及文件**：
- 🟦 Schema：`schema.ts` 末尾 `defaultValue.config.chart.color`
- 🟨 组件逻辑：`options.ts` 中 `DEFAULT_COLORS` 回退

**步骤**：

1. 修改 `schema.ts` 中 `defaultValue.config.chart.color` 数组（4 组线性渐变）
2. 如需修改非自定义颜色模式下的回退色，修改 `@Common/constants` 的 `DEFAULT_COLORS`

## 任务 3：修改排序逻辑

**场景描述**：需要改为降序排列或按名称排序。

**涉及文件**：
- 🟨 组件逻辑：[component-logic.md § 3.2.2](./component-logic.md#322-数据排序)

**步骤**：

在 `options.ts` 中修改排序函数：

```typescript
// 降序
data.sort((a, b) => b.value - a.value)
// 按名称排序
data.sort((a, b) => a.name.localeCompare(b.name))
```

## 任务 4：修改标签格式化

**场景描述**：需要自定义标签显示内容（如只显示百分比、不显示名称）。

**涉及文件**：
- 🟨 组件逻辑：[component-logic.md § 3.2.4](./component-logic.md#324-标签配置)

**步骤**：

在 `options.ts` 中修改 `defaultLabel.formatter`：

```typescript
// 只显示百分比
formatter: '{d}%'
// 显示名称 + 数值
formatter: '{b}\n{c}'
// 自定义函数
formatter: (params) => `${params.name}: ${params.value} (${params.percent}%)`
```

## 任务 5：调整默认尺寸

**涉及文件**：`schema.ts` 末尾 `defaultValue.config`

修改 `width` / `height` / `left` / `top` 的默认值。

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。
