---
title: normal-clock - Schema 配置面板详解
description: 时钟物料的配置面板定义、字段说明和默认值
version: 1.0.0
last_updated: 2026-06-16
---

# 🟦 Schema 配置面板详解

> 本文档描述 `packages/normal-clock/schema.ts` 中的配置面板定义。

## 面板结构

本物料使用 1 个 `FormCollapse` 折叠面板：

```
配置
└── 文本 (CollapsePanel)
    ├── 时钟格式 (timeFormat)
    ├── 时钟传参 (isTimeParams)
    ├── 时钟传参格式 (timeParamsFormat) [条件显示]
    ├── 时钟传参时间点 (timeParamsDate) [条件显示]
    └── 文本样式 (textStyle) [嵌套 CollapsePanel]
        ├── 字号 (fontSize)
        ├── 字体颜色 (color)
        ├── 字体 (fontFamily)
        ├── 字体粗细 (fontWeight)
        └── 文字对齐方式 (textAlign)
```

## 配置项详解

### 1. 时钟格式 (timeFormat)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `'YYYY/MM/DD HH:mm:ss'` |

**可选值（13种）：**

| value | label 示例 |
|-------|-----------|
| `YYYY/MM/DD HH:mm:ss` | 2022/01/01 13:00:00 |
| `YYYY-MM-DD HH:mm:ss` | 2022-01-01 13:00:00 |
| `YYYY年MM月DD日 HH:mm:ss` | 2022年01月01日 13:00:00 |
| `YYYY/MM/DD HH:mm` | 2022/01/01 13:00 |
| `YYYY-MM-DD HH:mm` | 2022-01-01 13:00 |
| `YYYY年MM月DD日 hh:mm` | 2022年01月01日 13:00 |
| `YYYY/MM/DD HH` | 2022/01/01 13 |
| `YYYY-MM-DD HH` | 2022-01-01 13 |
| `YYYY年MM月DD日 HH` | 2022年01月01日 13 |
| `YYYY/MM/DD` | 2022/01/01 |
| `YYYY-MM-DD` | 2022-01-01 |
| `YYYY年MM月DD日` | 2022年01月01日 |
| `HH:mm:ss` | 13:00:00 |

### 2. 时钟传参 (isTimeParams)

| 属性 | 值 |
|------|-----|
| 类型 | `boolean` |
| 组件 | `Switch` |
| 默认值 | `false` |
| Tooltip | 启用整点传参，每到设置的整点会传出对应时钟传参格式信息 |

### 3. 时钟传参格式 (timeParamsFormat)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `''` |
| 显示条件 | `isTimeParams === true` |

**可选值（13种）：** 与 `timeFormat` 类似，但分钟和秒固定为 `00`。

### 4. 时钟传参时间点 (timeParamsDate)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `''` |
| 显示条件 | `isTimeParams === true` |

**可选值（24个）：** `00:00:00` 到 `23:00:00`，对应 00点 到 23点。

### 5. 文本样式 (textStyle)

嵌套的 `FormCollapse` 面板，包含以下配置项：

#### 5.1 字号 (fontSize)

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 组件 | `NumberPicker` |
| 默认值 | `24` |

#### 5.2 字体颜色 (color)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `ColorPicker` |
| 默认值 | `'#FFFFFF'` |
| 显示条件 | `isGradient === false` |

#### 5.3 字体 (fontFamily)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `'DIN Black'` |
| 数据来源 | `GLOBAL_FONTS` |

#### 5.4 字体粗细 (fontWeight)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `400` |

**可选值：** `normal`, `bold`, `bolder`, `lighter`, `100`-`900`

#### 5.5 文字对齐方式 (textAlign)

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 组件 | `Select` |
| 默认值 | `'center'` |

**可选值：** `left`, `center`, `right`

## 交互配置 (defineInteractionSchema)

| 字段 | 类型 | 说明 |
|------|------|------|
| `timeParamsKey` | `string` | 整点时间参数派发的字段名 |

## 默认值 (defaultValue)

```typescript
{
    dataConfig: {
        dataType: 'json',
        sql: {},
        dataSet: { current: {}, params: {} },
        api: { mode: 'get', url: '', headers: {}, params: {} },
        json: { content: '', iconType: '' }
    },
    config: {
        title: 'normal-clock',
        width: 400,
        height: 60,
        left: 15,
        top: 15,
        background: '',
        isLock: false,
        isHidden: false,
        normal: {
            timeFormat: 'YYYY/MM/DD HH:mm:ss',
            textStyle: {
                fontSize: 24,
                color: '#FFFFFF',
                fontFamily: 'DIN Black',
                fontWeight: 400,
                textAlign: 'center'
            },
            isTimeParams: false,
            timeParamsFormat: '',
            timeParamsDate: ''
        }
    }
}
```

## 条件显示逻辑

| 字段 | 条件 | 说明 |
|------|------|------|
| `timeParamsFormat` | `isTimeParams === true` | 启用整点传参时显示 |
| `timeParamsDate` | `isTimeParams === true` | 启用整点传参时显示 |
| `color` | `isGradient === false` | 非渐变模式时显示 |

## 相关文档

- 配置如何影响渲染 → [🟨 component-logic.md](./component-logic.md)
- 数据默认值 → [🟩 data-model.md](./data-model.md)
