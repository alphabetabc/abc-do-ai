---
title: label-text Schema 结构
description: 标题物料（label-text）的 Schema 配置面板定义，包含文本样式、背景、前缀、气泡、下钻交互
version: 1.0.0
last_updated: 2026-06-16
---

# label-text Schema 结构

## 1. 顶层结构

```typescript
{
    materials: 'label-text',
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
                            $collapse: { ... }  // FormCollapse 包含 4 个面板
                        }
                    }
                }
            }
        },
        defineDataConfigSchema({ ... }),  // 数据配置
        defineInteractionSchema({ ... })  // 交互配置（下钻）
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 文本面板 `text`

#### 2.1.1 文本内容 `textContainer.content`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `content` | string | 文本内容 | Input | 静态文本内容 |

#### 2.1.2 文本样式 `textStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `fontSize` | number | 字号 | NumberPicker | 字体大小 |
| `isGradient` | boolean | 字体颜色渐变 | Switch | 是否使用渐变 |
| `fontColor` | string | 字体颜色 | ColorPicker | 纯色，依赖 `isGradient=false` |
| `fontColorStart` | string | 开始颜色 | ColorPicker | 渐变起始色，依赖 `isGradient=true` |
| `fontColorEnd` | string | 结束颜色 | ColorPicker | 渐变结束色，依赖 `isGradient=true` |
| `fontFamily` | string | 字体 | Select | 从 `GLOBAL_FONTS` 读取 |
| `fontWeight` | string | 字体粗细 | Select | normal/bold/bolder/lighter/100-900 |
| `textAlign` | string | 文字对齐方式 | Select | left/center/right |
| `textDirection` | string | 文字排列方式 | Select | horizontal/vertical（垂直时旋转 90deg） |
| `letterSpacing` | number | 字间距 | NumberPicker | 字间距（px） |
| `isBoxReflect` | boolean | 是否显示倒影 | Switch | 倒影开关 |
| `boxReflectOpacity` | number | 倒影透明度 | SliderWithNumber | 0.2-0.5，依赖 `isBoxReflect=true` |
| `isTextShadow` | boolean | 是否显示阴影 | Switch | 阴影开关 |
| `textShadowH` | number | 水平阴影 | NumberPicker | 依赖 `isTextShadow=true` |
| `textShadowV` | number | 垂直阴影 | NumberPicker | 依赖 `isTextShadow=true` |
| `textShadowBlur` | number | 模糊阴影 | NumberPicker | 依赖 `isTextShadow=true` |
| `textShadowColor` | string | 阴影颜色 | ColorPicker | 依赖 `isTextShadow=true` |
| `isWebkitTextStroke` | boolean | 是否显示描边 | Switch | 描边开关 |
| `webkitTextStrokeSize` | number | 描边粗细 | NumberPicker | 依赖 `isWebkitTextStroke=true` |
| `webkitTextStrokeColor` | string | 描边颜色 | ColorPicker | 依赖 `isWebkitTextStroke=true` |
| `isCursorHand` | boolean | 手势光标 | Switch | cursor: pointer |

### 2.2 背景面板 `labelTextBg`

#### 2.2.1 背景颜色 `backgroundStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `isGradient` | boolean | 是否使用渐变 | Switch | 背景渐变开关 |
| `bgColor` | string | 背景色 | ColorPicker | 纯色，依赖 `isGradient=false` |
| `bgColorGradient` | string | 背景色渐变 | Select | topToBottom/leftToRight/leftTopToRightBottom |
| `bgColorGradientStartColor` | string | 渐变初始色 | ColorPicker | 依赖 `isGradient=true` |
| `bgColorGradientEndColor` | string | 渐变结束色 | ColorPicker | 依赖 `isGradient=true` |

#### 2.2.2 背景边框 `borderStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `visible` | boolean | 显示/隐藏 | Switch | 边框开关 |
| `border.borderRadius` | number | 圆角 | NumberPicker | 依赖 `visible=true` |
| `border.borderWidth` | number | 背景边框宽度 | NumberPicker | 依赖 `visible=true` |
| `border.borderStyle` | string | 背景边框线条 | Select | solid/dashed/dotted |
| `border.borderColor` | string | 背景边框颜色 | ColorPicker | 依赖 `visible=true` |

### 2.3 前缀面板 `prefix`

#### 2.3.1 前缀开关

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `visible` | boolean | 显示/隐藏 | Switch | 前缀图标开关 |

#### 2.3.2 文本样式 `textStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `fontSize` | number | 字号 | NumberPicker | 依赖 `visible=true` |
| `fontColor` | string | 字体颜色 | ColorPicker | 依赖 `visible=true` |
| `fontWeight` | string | 字体粗细 | Select | 依赖 `visible=true` |
| `fontMarginDirection` | string | 图标外边距方向 | Select | all/top/right/bottom/left |
| `fontMargin` | number | 图标外边距 | NumberPicker | 依赖 `visible=true` |

#### 2.3.3 前缀图标配置

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `prefixiIConType` | string | 前缀类型 | Radio.Group | icon/custImg |
| `iconType` | string | 前缀图标 | Select | Ant Design 图标名，依赖 `prefixiIConType='icon'` |
| `custImg` | object | 前缀图片 | Background | 自定义图片，依赖 `prefixiIConType='custImg'` |
| `custImgSize` | number | 图片尺寸 | NumberPicker | 依赖 `prefixiIConType='custImg'` |

### 2.4 气泡面板 `labelTextToolTip`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `showToolTip` | boolean | 气泡提示 | Switch | 气泡开关 |
| `title` | string | 气泡内容 | Input | 支持 `<br/>` 换行，依赖 `showToolTip=true` |
| `placement` | string | 气泡位置 | Select | top/left/right/bottom/topLeft/topRight/bottomLeft/bottomRight/leftTop/leftBottom/rightTop/rightBottom |

## 3. 交互面板（下钻配置）

交互面板使用 `defineInteractionSchema` 定义，包含：

### 3.1 订阅参数 `subscribe`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `labelText` | string | 标题文本 | Input | 接收其他组件传递的标题文本 |

### 3.2 动作配置 `action`

#### 3.2.1 下钻配置 `configurableEvent.clickEvent`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `show` | boolean | 下钻开关 | Switch | 是否启用下钻 |
| `effect` | string | 事件效果 | Select | Modal/Drawer/Window/WindowSelf |

#### 3.2.2 Modal 配置 `modalSet`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `params` | string | url参数 | Input | iframe URL 参数（如 a=1&b=2） |
| `drilldownItemFields` | string | 其他参数 | Input | 从数据项中获取字段作为 query 参数 |
| `position.left` | number | 位置 X | NumberPicker | Modal 位置 |
| `position.top` | number | 位置 Y | NumberPicker | Modal 位置 |
| `size.width` | number | 宽度 | NumberPicker | Modal 尺寸 |
| `size.height` | number | 高度 | NumberPicker | Modal 尺寸 |
| `closeIconPosition.closeIconLeft` | number | 关闭图标 X | NumberPicker | 关闭图标位置 |
| `closeIconPosition.closeIconTop` | number | 关闭图标 Y | NumberPicker | 关闭图标位置 |
| `closeIconFont.closeIconFontSize` | number | 关闭图标大小 | NumberPicker | 关闭图标样式 |
| `closeIconFont.closeIconType` | string | 关闭图标类型 | Input | 关闭图标 IconType |
| `mask` | boolean | 显示遮罩 | Switch | 是否显示遮罩层 |
| `closable` | boolean | 显示关闭 | Switch | 是否显示右上角关闭按钮 |

#### 3.2.3 Drawer 配置 `drawerSet`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `params` | string | url参数 | Input | iframe URL 参数 |
| `drilldownItemFields` | string | 其他参数 | Input | 从数据项中获取字段 |
| `title` | string | 弹窗标题 | Input | Drawer 标题 |
| `placement` | string | 位置 | Select | top/bottom/left/right |
| `width` | number | 宽度 | NumberPicker | 依赖 `placement='left'` 或 `'right'` |
| `height` | number | 高度 | NumberPicker | 依赖 `placement='top'` 或 `'bottom'` |
| `mask` | boolean | 显示遮罩 | Switch | 是否显示遮罩层 |
| `closable` | boolean | 显示关闭 | Switch | 是否显示左上角关闭按钮 |

#### 3.2.4 Window 配置 `windowSet`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `params` | string | url参数 | Input | 新窗口 URL |

## 4. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `Input` | 文本输入 | 静态文本、URL 参数 |
| `NumberPicker` | 数字输入 | 字号、间距、尺寸等 |
| `ColorPicker` | 颜色选择 | 字体颜色、背景颜色、边框颜色 |
| `Select` | 下拉选择 | 字体、对齐方式、渐变方向 |
| `Switch` | 开关 | 各种效果开关 |
| `SliderWithNumber` | 滑块 | 倒影透明度 |
| `Radio.Group` | 单选组 | 前缀类型 |
| `Background` | 背景图片 | 前缀图片 |
| `VisualTextStyle` | 文本样式 | 字体样式组合组件 |
| `Border` | 边框 | 背景边框 |
| `FormCollapse` | 折叠面板 | 配置分组 |
| `FormLayout` | 表单布局 | 下钻配置布局 |
| `Card` | 卡片 | 下钻配置分组 |

## 5. 默认值参考

```typescript
{
    config: {
        title: '标题',
        width: 400,
        height: 60,
        left: 15,
        top: 15,
        text: {
            textStyle: {
                fontSize: 18,
                isGradient: false,
                fontColor: '#FFFFFF',
                fontColorStart: 'rgba(255,255,255,1)',
                fontColorEnd: 'rgba(255,255,255,0)',
                fontWeight: 'bold',
                textAlign: 'center',
                textDirection: 'horizontal',
                isBoxReflect: true,
                boxReflectOpacity: 0.2,
                fontFamily: 'Source Han Sans CN',
                isTextShadow: false,
                textShadowH: 0,
                textShadowV: 0,
                textShadowBlur: 0,
                textShadowColor: '#FFFFFF',
                isWebkitTextStroke: false,
                webkitTextStrokeSize: 0,
                webkitTextStrokeColor: '#FFFFFF',
                isCursorHand: false,
            },
            textContainer: {
                content: '标题',
            },
        },
        labelTextBg: {
            backgroundStyle: {
                isGradient: true,
                bgColor: 'rgba(0,0,0,0)',
                bgColorGradient: 'topToBottom',
                bgColorGradientStartColor: 'rgba(10,155,255,1)',
                bgColorGradientEndColor: 'rgba(0,0,0,0)',
            },
            borderStyle: {
                visible: false,
                border: {
                    borderRadius: 0,
                    borderDirection: 'all',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: '#000000',
                },
            },
        },
        prefix: {
            visible: true,
            textStyle: {
                fontSize: 18,
                fontColor: '#FFFFFF',
                fontWeight: 'bold',
                fontMarginDirection: 'all',
                fontMargin: 0,
            },
            prefixiIConType: 'custImg',
            iconType: 'FastForwardOutlined',
            custImg: '分组1.png',
            custImgSize: 10,
        },
        labelTextToolTip: {
            showToolTip: false,
            title: '',
            placement: 'top',
        },
    },
    dataConfig: {
        dataType: 'json',
        json: {
            content: '',
            iconType: '',
        },
    },
}
```

## 6. 数据面板与交互面板

- **数据面板**：使用 `defineDataConfigSchema`，字段来自 `dataModel.json` 的 `dimensions` + `indicators`
- **交互面板**：使用 `defineInteractionSchema`，包含订阅参数 `labelText` 和完整的下钻配置（Modal/Drawer/Window/WindowSelf）
