---
title: carousel-list Schema 结构
description: 轮播列表(垂直)物料（carousel-list）的 Schema 配置面板定义，包含功能、样式、分割线、选中样式、名称/数值/单位样式面板
version: 1.0.0
last_updated: 2026-06-16
---

# carousel-list Schema 结构

## 1. 顶层结构

```typescript
{
    materials: 'carousel-list',
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
                            ...getCompTitle(material, dataModel),
                            ...BASE_LAYOUT,
                            $collapse: { ... }  // FormCollapse 包含 6 个面板
                        }
                    }
                }
            }
        },
        {
            name: '数据',
            key: 'dataConfig',
            schema: { ... }  // DynamicData 组件
        },
        {
            name: '交互',
            key: 'interactions',
            schema: { ... }  // 交互面板
        },
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 功能面板 `swiperTimer`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `swiperTimer` | number | 轮播时间间隔(s) | NumberPicker | min: 1, step: 10 |

### 2.2 样式面板 `style`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `width` | number | 行宽度 | NumberPicker | 行宽度 |
| `height` | number | 行高度 | NumberPicker | 行高度 |
| `size` | number | 图标尺寸 | NumberPicker | 图标尺寸 |
| `customColors` | string | 图标自定义填充色 | ColorGroup | 图标颜色数组 |

### 2.3 分割线样式面板 `dividerStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `color` | string | 颜色 | ColorPicker | 分割线颜色 |
| `width` | number | 总长度 | NumberPicker | 分割线总长度 |
| `dashedwidth` | number | 虚线长度 | NumberPicker | 虚线段长度 |
| `density` | number | 虚线密度 | NumberPicker | 虚线密度（百分比） |

### 2.4 选中样式面板 `selectedStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `background` | string | 背景颜色 | ColorPicker | 选中项背景色 |
| `color` | string | 边框颜色 | ColorPicker | 选中项边框色 |
| `borderStyle` | string | 边框样式 | Select | dashed/solid |
| `borderWidth` | number | 边框宽度 | NumberPicker | 选中项边框宽度 |
| `boxShadow` | number | 阴影尺寸 | NumberPicker | 选中项阴影尺寸 |
| `shadowColor` | string | 阴影颜色 | ColorPicker | 选中项阴影颜色 |

### 2.5 名称样式面板 `nameFontStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `fontFamily` | string | 字体 | Select | 从 GLOBAL_FONTS 读取 |
| `fontSize` | number | 字号 | NumberPicker | 字体大小 |
| `fontWeight` | string | 字体粗细 | Select | 从 FONT_WEIGHT 读取 |
| `isCustomColors` | boolean | 是否多色 | Switch | 是否使用多色 |
| `color` | string | 字体颜色 | ColorPicker | 依赖 `isCustomColors=false` |
| `customColors` | array | 自定义填充色 | ColorGroup | 依赖 `isCustomColors=true` |

### 2.6 数值样式面板 `valueFontStyle`

与名称样式面板结构相同。

### 2.7 单位样式面板 `unitFontStyle`

与名称样式面板结构相同。

## 3. 交互面板

### 3.1 行高亮事件 `$onClickAction`

#### 3.1.1 派发参数 `$collapsePanel-click`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `rowHighlightId` | string | 行数据ID:id | Input | 派发参数名称 |
| `rowHighlightName` | string | 行数据名称:name | Input | 派发参数名称 |

## 4. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `NumberPicker` | 数字输入 | 尺寸、时间、密度等 |
| `ColorPicker` | 颜色选择 | 背景色、边框色、字体色 |
| `ColorGroup` | 颜色组 | 多色配置 |
| `Select` | 下拉选择 | 字体、边框样式 |
| `Switch` | 开关 | 是否多色 |
| `Input` | 文本输入 | 派发参数名称 |
| `FormCollapse` | 折叠面板 | 配置分组 |
| `DynamicData` | 数据配置 | 数据源配置 |

## 5. 默认值参考

```typescript
{
    dataConfig: {
        dataType: 'json',
        json: [
            { id: '1', name: '语音专线', value: 99.99, unit: '%' },
            { id: '2', name: '物联网专线', value: 18, unit: '%' },
            { id: '3', name: '数据专线', value: 32, unit: '%' },
            { id: '4', name: '互联网专线', value: 15, unit: '%' },
            { id: '5', name: '短彩信专线', value: 15, unit: '%' },
        ],
        isRefresh: false,
        refreshTime: 5 * 60,
    },
    config: {
        title: '轮播列表(垂直)',
        width: 300,
        height: 300,
        left: 15,
        top: 15,
        isLock: false,
        isHidden: false,
        swiperTimer: 3,
        style: {
            width: 285,
            height: 40,
            size: 18,
            customColors: [],
        },
        dividerStyle: {
            color: '#C9CDD6',
            width: 280,
            dashedwidth: 8,
            density: 50,
        },
        selectedStyle: {
            background: 'rgba(0, 138, 255, 0.1)',
            borderStyle: 'solid',
            color: '#008aff',
            borderWidth: 1,
            boxShadow: 8,
            shadowColor: '#008aff',
        },
        nameFontStyle: {
            fontFamily: '',
            fontSize: 17,
            color: '#FFFFFF',
            fontWeight: '400',
            isCustomColors: false,
            customColors: [],
        },
        valueFontStyle: {
            fontFamily: '',
            fontSize: 17,
            color: '#FFFFFF',
            fontWeight: 'bold',
            isCustomColors: false,
            customColors: [],
        },
        unitFontStyle: {
            fontFamily: '',
            fontSize: 17,
            color: '#FFFFFF',
            fontWeight: 'bold',
            isCustomColors: false,
            customColors: [],
        },
    },
}
```

## 6. 数据面板与交互面板

- **数据面板**：使用 `DynamicData` 组件，字段来自 `dataModel.json` 的 `dimensions` + `indicators`
- **交互面板**：使用自定义交互面板，包含行高亮事件派发参数
