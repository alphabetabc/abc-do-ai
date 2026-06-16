---
title: Schema 结构
description: 横向柱形图 schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/bidirectional-progress/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'bidirectional-progress',
    fields: [
        {
            name: '配置',
            key: 'config',
            schema: {
                type: 'object',
                properties: {
                    config: {
                        type: 'object',
                        properties: {
                            ...getCompTitle(metaInfo, dataModel),  // 组件标题
                            ...BASE_LAYOUT,                         // 基础布局（宽高、位置）
                            $collapse: { /* FormCollapse 嵌套 */ },
                        },
                    },
                },
            },
        },
        renderDataConfig({ fields: [...] }),  // 数据面板
    ],
}
```

## 2. FormCollapse 分组详情

### 2.1 标题设置 `$collapse.labelConfig`

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| ---- | ---- | ---- | ----------- | ------------ |
| `labelSize` | - | 尺寸 | `Size` | `config.labelConfig.labelSize`（→ component-logic.md § 2.2.1） |
| `labelFontStyle` | - | 文本 | `VisualTextStyle` | `config.labelConfig.labelFontStyle`（→ component-logic.md § 2.2.1） |

### 2.2 左侧设置 `$collapse.leftConfig`

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| ---- | ---- | ---- | ----------- | ------------ |
| `dataMax` | `number` | 数据最大值 | `NumberPicker` | `config.leftConfig.dataMax`（→ component-logic.md § 2.2.2） |
| `color1` | `string` | 开始颜色 | `ColorPicker` | `config.leftConfig.color1`（→ component-logic.md § 3.2） |
| `color2` | `string` | 结束颜色 | `ColorPicker` | `config.leftConfig.color2`（→ component-logic.md § 3.2） |
| `width` | `number` | 柱子长度 | `NumberPicker` | `config.leftConfig.width`（→ component-logic.md § 3.2） |
| `strokeWidth` | `number` | 柱子宽度 | `NumberPicker` | `config.leftConfig.strokeWidth`（→ component-logic.md § 3.2） |
| `valueFontStyle` | - | 值文本设置 | `VisualTextStyle` | `config.leftConfig.valueFontStyle`（→ component-logic.md § 3.2） |
| `unitFontStyle` | - | 单位文本设置 | `VisualTextStyle` | `config.leftConfig.unitFontStyle`（→ component-logic.md § 3.2） |
| `labelMargin` | `number` | 文字与柱子间距 | `NumberPicker` | `config.leftConfig.labelMargin`（→ component-logic.md § 3.2） |
| `border` | - | 边框 | `Border` | `config.leftConfig.border`（→ component-logic.md § 3.2） |
| `showObliqueLineBg` | `boolean` | 显示背景斜线 | `Switch` | `config.leftConfig.showObliqueLineBg`（→ component-logic.md § 3.2） |
| `obliqueLineDirection` | `string\|number` | 斜线方向 | `Radio.Group` | `config.leftConfig.obliqueLineDirection`（→ component-logic.md § 3.2） |
| `obliqueLineColor` | `string` | 斜线颜色 | `ColorPicker` | `config.leftConfig.obliqueLineColor`（→ component-logic.md § 3.2） |
| `active` | `boolean` | 开启激活动效 | `Switch` | `config.leftConfig.active`（→ component-logic.md § 3.2） |

> 值文本设置和单位文本设置内部嵌套了子 FormCollapse（`abu3c516057`），分别包含 `valueFontStyle` 和 `unitFontStyle` 两个 VisualTextStyle 字段。

### 2.3 右侧设置 `$collapse.rightConfig`

与左侧设置结构完全一致，字段名相同，组件读取方式为 `config.rightConfig.*`。

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| ---- | ---- | ---- | ----------- | ------------ |
| `dataMax` | `number` | 数据最大值 | `NumberPicker` | `config.rightConfig.dataMax` |
| `color1` | `string` | 开始颜色 | `ColorPicker` | `config.rightConfig.color1` |
| `color2` | `string` | 结束颜色 | `ColorPicker` | `config.rightConfig.color2` |
| `width` | `number` | 柱子长度 | `NumberPicker` | `config.rightConfig.width` |
| `strokeWidth` | `number` | 柱子宽度 | `NumberPicker` | `config.rightConfig.strokeWidth` |
| `valueFontStyle` | - | 值文本设置 | `VisualTextStyle` | `config.rightConfig.valueFontStyle` |
| `unitFontStyle` | - | 单位文本设置 | `VisualTextStyle` | `config.rightConfig.unitFontStyle` |
| `labelMargin` | `number` | 文字与柱子间距 | `NumberPicker` | `config.rightConfig.labelMargin` |
| `border` | - | 边框 | `Border` | `config.rightConfig.border` |
| `showObliqueLineBg` | `boolean` | 显示背景斜线 | `Switch` | `config.rightConfig.showObliqueLineBg` |
| `obliqueLineDirection` | `string\|number` | 斜线方向 | `Radio.Group` | `config.rightConfig.obliqueLineDirection` |
| `obliqueLineColor` | `string` | 斜线颜色 | `ColorPicker` | `config.rightConfig.obliqueLineColor` |
| `active` | `boolean` | 开启激活动效 | `Switch` | `config.rightConfig.active` |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| ---- | ---- | ---- |
| `Size` | 尺寸（宽高） | 用于标题区域的尺寸设置 |
| `VisualTextStyle` | 文本样式（颜色、字号、行高、对齐、字间距） | 用于标题文本、值文本、单位文本；`enableLetterSpacing: true` 开启字间距 |
| `ColorPicker` | 颜色选择器 | `showInput: true` 支持输入 |
| `NumberPicker` | 数字输入 | 用于数据最大值、柱子长度/宽度、间距 |
| `Border` | 边框设置（宽度、颜色、样式） | 用于左右进度条的边框 |
| `Switch` | 开关 | 用于显示背景斜线、激活动效 |
| `Radio.Group` | 单选组 | 用于斜线方向：`/`（left）和 `\`（right） |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

```typescript
{
    width: 600,
    height: 100,
    left: 15,
    top: 15,
    labelConfig: {
        labelSize: { width: 100 },
        labelFontStyle: { color: '#fff', fontSize: 14 },
    },
    leftConfig: {
        color1: '#108ee9',
        color2: '#87d068',
        width: 200,
        strokeWidth: 20,
        valueFontStyle: { color: '#fff', fontSize: 14 },
        unitFontStyle: { color: '#fff', fontSize: 14 },
        showObliqueLineBg: true,
        active: true,
        border: { borderWidth: 1, borderColor: '#d7d300', borderStyle: 'solid' },
        obliqueLineDirection: 'left',
        obliqueLineColor: '#ffffff7e',
        labelMargin: 10,
    },
    rightConfig: {
        // 与 leftConfig 结构一致
        color1: '#108ee9',
        color2: '#87d068',
        width: 200,
        strokeWidth: 20,
        // ...
        obliqueLineDirection: 'right',  // 仅方向默认不同
    },
}
```

## 5. 数据面板与交互面板

- **数据面板**：使用 `renderDataConfig` 函数，`fields` 来自 `dataModel.dataModelDefinition.header.dimensions` + `indicators`。`showDataStatusSwitch: true` 开启数据状态开关。
- **交互面板**：当前未启用（schema 中未定义 `defineInteractionSchema`）。
