---
title: export-btn Schema 结构
description: 导出按钮物料（export-btn）的 Schema 配置面板定义，包含元素设置和导出接口
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn Schema 结构

## 1. 顶层结构

```typescript
{
    materials: 'export-btn',
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
                            ...getCompTitle(material),
                            ...BASE_LAYOUT,
                            baseStyle: { ... }  // FormCollapse.CollapsePanel
                        }
                    }
                }
            }
        },
        {
            name: '导出接口',
            key: 'customDataSourceApiConfig',
            schema: {
                type: 'object',
                properties: {
                    customDataSourceApiConfig: {
                        type: 'object',
                        title: '导出接口相关配置',
                        description: '支持数据集接入',
                        'x-component': 'ExportApi',
                    },
                },
            },
        },
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 元素设置面板 `baseStyle`

#### 2.1.1 按钮文本 `content`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `content` | number | 按钮文本 | Input | 按钮显示的文本内容 |

#### 2.1.2 元素边距 `margin`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `marginTop` | number | 上 | NumberPicker | 上边距 |
| `marginRight` | number | 右 | NumberPicker | 右边距 |
| `marginBottom` | number | 下 | NumberPicker | 下边距 |
| `marginLeft` | number | 左 | NumberPicker | 左边距 |

#### 2.1.3 元素文本 `textStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `textStyle` | object | 元素文本 | VisualTextStyle | 文本样式组合组件 |

**VisualTextStyle 配置**：
- `disableLineHeight: true` - 禁用行高配置

#### 2.1.4 元素行高 `lineHeight`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `lineHeight` | number | 元素行高 | NumberPicker | 行高 |

#### 2.1.5 元素边框 `border`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `borderStyle` | string | 线型 | Select | solid/dashed/dotted/double |
| `borderWidth` | number | 线宽 | NumberPicker | 边框宽度 |
| `borderColor` | number | 颜色 | ColorPicker | 边框颜色（⚠️ type 应为 string） |
| `borderRadius` | number | 圆角 | NumberPicker | 边框圆角 |

#### 2.1.6 元素背景 `backgroundType`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `backgroundType` | string | 元素背景 | Radio.Group | image/color |
| `backgroundColor` | string | 背景颜色 | ColorPicker | 依赖 `backgroundType='color'` |
| `backgroundImg` | string | 背景图片 | Background | 依赖 `backgroundType='image'` |
| `backgroundRepeat` | string | 背景重复 | Select | full/no-repeat/repeat-x/repeat-y/repeat |

#### 2.1.7 元素前缀 `prefix`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `show` | string | 开关 | Switch | 前缀显示开关（⚠️ x-hidden: true） |
| `prefixImg` | string | 前缀图片 | Background | 前缀图片 |
| `width` | number | 前缀尺寸 | NumberPicker | 前缀图标尺寸 |
| `marginTop` | number | 上 | NumberPicker | 前缀上边距 |
| `marginRight` | number | 右 | NumberPicker | 前缀右边距 |
| `marginBottom` | number | 下 | NumberPicker | 前缀下边距 |
| `marginLeft` | number | 左 | NumberPicker | 前缀左边距 |

## 3. 导出接口面板

使用 `ExportApi` 组件配置导出接口，支持：
- API 接口
- 数据集

配置存储在 `customDataSourceApiConfig` 中。

## 4. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `Input` | 文本输入 | 按钮文本 |
| `NumberPicker` | 数字输入 | 边距、边框、尺寸 |
| `ColorPicker` | 颜色选择 | 边框颜色、背景颜色 |
| `Select` | 下拉选择 | 边框线型、背景重复 |
| `Radio.Group` | 单选组 | 背景类型 |
| `Background` | 背景图片 | 背景图、前缀图 |
| `VisualTextStyle` | 文本样式 | 字体、字号、颜色 |
| `ExportApi` | 导出接口 | API/数据集配置 |
| `FormCollapse` | 折叠面板 | 配置分组 |

## 5. 默认值参考

```typescript
{
    dataConfig: {
        dataType: 'json',
        json: [],
    },
    config: {
        title: '导出按钮',
        width: 141,
        height: 58,
        left: 10,
        top: 490,
        isLock: false,
        isHidden: false,
        baseStyle: {
            textStyle: {
                fontFamily: 'Microsoft YaHei',
                fontWeight: '400',
                fontSize: 30,
                color: 'rgba(255, 255, 255, 0.62)',
                textAlign: 'center',
            },
            lineHeight: 2,
            marginTop: 0,
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
            backgroundType: 'color',
            backgroundImg: 'ShaanxiUnicom_zdcjqh1.png',
            backgroundRepeat: 'no-repeat',
            prefix: {
                show: true,
                prefixImg: {
                    url: '/oss-visual/5G-NFV/export.png',
                    isMaterial: true,
                },
                width: 40,
                marginTop: 0,
                marginRight: 5,
                marginBottom: 0,
                marginLeft: 0,
            },
            content: '导出',
            borderStyle: 'solid ',
            borderWidth: 1,
            borderColor: 'rgba(0, 213, 255, 1)',
            borderRadius: 5,
        },
        transform: {},
    },
    customDataSourceApiConfig: {
        dataType: 'api',
        api: {
            mode: 'post',
            url: '',
            headers: {},
            params: {},
            enableRequestControl: false,
        },
    },
}
```

## 6. 数据面板与交互面板

- **数据面板**：无（纯交互组件）
- **交互面板**：无（点击触发导出，不派发参数）
