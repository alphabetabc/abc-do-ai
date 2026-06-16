---
title: label-text 组件逻辑维护
description: 标题物料（label-text）的组件代码维护要点，包含文本效果、背景、前缀、气泡、下钻交互
version: 1.0.0
last_updated: 2026-06-16
---

# label-text 组件逻辑维护

本文档说明 `label-text` 组件代码（`index.jsx` + `CustomIcon` 子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
label-text/
├── index.jsx          # 主组件
├── index.less         # 样式（渐变文本裁剪）
├── schema.ts          # 配置面板（→ schema.md）
├── dataModel.json     # 数据契约（→ data-model.md）
├── oss-material.json  # 物料元信息
└── doc/readme.md      # 用户向文档
```

## 2. 主组件 `LabelText`

### 2.1 入口签名

```typescript
const LabelText = (props) => {
    const {
        config,
        dataSource,
        interaction,
        designer: { env, constants, utils },
        interactionProps,
    } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（text、labelTextBg、prefix、labelTextToolTip） |
| `dataSource` | object/array | dataConfig | 数据源（对象或数组） |
| `interaction` | object | 框架 | 交互配置（下钻） |
| `designer` | object | 框架 | 设计器上下文（env、constants、utils） |
| `interactionProps` | object | 框架 | 交互参数（来自其他组件） |
| `receivedPropsParams` | object | 框架 | 下钻参数 |

### 2.2 关键逻辑

#### 2.2.1 文本来源判断

```typescript
// 优先级：interactionProps > receivedPropsParams > dataSource > 静态配置
let realText = dataSource?.content || dataSource?.[0]?.content || textContainer.content;

if (props.interactionProps && props.interactionProps.labelText) {
    realText = _.get(props, 'interactionProps.labelText');
} else if (props.receivedPropsParams && props.interaction?.defined?.labelText) {
    const definedLabelText = props.interaction.defined.labelText;
    const { subscribeKey } = utils.parseSubscribeParams(definedLabelText);
    const receivedText = props.receivedPropsParams[subscribeKey];
    if (receivedText) {
        realText = receivedText;
    }
}
```

**注意**：
- `interactionProps.labelText` 来自其他组件传递的标题文本
- `receivedPropsParams` 来自下钻参数
- `dataSource` 可能是对象或数组（兼容两种格式）
- `textContainer.content` 是静态配置的默认值

#### 2.2.2 文本样式构建

```typescript
const labelTextStyle = {
    ..._.pick(textSetting.textStyle, ['fontSize', 'fontWeight', 'textAlign', 'fontFamily']),
    display: 'inline-block',
    lineHeight: isNaN(textSetting.textStyle.fontSize) ? textSetting.textStyle.fontSize : `${textSetting.textStyle.fontSize}px`,
    whiteSpace: 'pre',
};

// 渐变
if (textSetting.textStyle.isGradient) {
    const { fontColorStart, fontColorEnd } = textSetting.textStyle;
    Object.assign(labelTextStyle, {
        backgroundImage: `linear-gradient(180deg, ${fontColorStart} 0%, ${fontColorEnd} 100%)`,
    });
} else {
    Object.assign(labelTextStyle, {
        color: textSetting.textStyle.fontColor,
    });
}

// 阴影
if (textSetting?.textStyle?.isTextShadow) {
    const { textShadowH, textShadowV, textShadowBlur, textShadowColor } = textSetting.textStyle;
    Object.assign(labelTextStyle, {
        textShadow: `${textShadowH}px ${textShadowV}px ${textShadowBlur}px ${textShadowColor}`,
    });
}

// 描边
if (textSetting?.textStyle?.isWebkitTextStroke) {
    const { webkitTextStrokeSize, webkitTextStrokeColor } = textSetting.textStyle;
    Object.assign(labelTextStyle, {
        WebkitTextStroke: `${webkitTextStrokeSize}px ${webkitTextStrokeColor}`,
    });
}

// 字间距
if (textSetting?.textStyle?.letterSpacing) {
    const { letterSpacing } = textSetting.textStyle;
    Object.assign(labelTextStyle, {
        letterSpacing: `${letterSpacing}px`,
    });
}
```

**注意**：
- 渐变文本需要在 CSS 中添加 `background-clip: text` 和 `-webkit-text-fill-color: transparent`（见 `index.less`）
- `lineHeight` 使用 `fontSize` 值，如果 `fontSize` 不是数字则直接使用
- `whiteSpace: 'pre'` 保留空白符

#### 2.2.3 背景样式构建

```typescript
const innerContainerStyle = {
    textAlign: labelTextStyle.textAlign,
};

// 边框
if (backgroundSetting.borderStyle.visible) {
    Object.assign(innerContainerStyle, backgroundSetting.borderStyle.border);
}

// 垂直文本
if (textSetting.textStyle.textDirection === 'vertical') {
    Object.assign(innerContainerStyle, {
        transform: 'rotate(90deg)',
    });
}

// 背景
const { backgroundStyle } = backgroundSetting;
if (backgroundStyle.isGradient) {
    const gradientDir = BACKGROUND_GRADIENT_MAPPING[backgroundStyle.bgColorGradient];
    Object.assign(innerContainerStyle, {
        backgroundImage: `linear-gradient(to ${gradientDir}, ${backgroundStyle.bgColorGradientStartColor} , ${backgroundStyle.bgColorGradientEndColor})`,
    });
} else {
    Object.assign(innerContainerStyle, {
        backgroundColor: backgroundStyle.bgColor,
    });
}
```

**注意**：
- `BACKGROUND_GRADIENT_MAPPING` 将 schema 中的方向映射为 CSS 方向：
  - `topToBottom` → `bottom`
  - `leftToRight` → `right`
  - `leftTopToRightBottom` → `bottom right`
- 垂直文本使用 `transform: rotate(90deg)` 旋转

#### 2.2.4 前缀图标渲染

```typescript
const CustomIcon = (props) => {
    const { env, constants, innerStyle, ...custStyle } = props;
    const { visible = false, prefixiIConType = 'icon', ...prefixStyle } = custStyle;

    const IconComp = useMemo(() => {
        const imgUrl = getImageUrl(prefixStyle.custImg, { env, constants });
        return () => <Image width={prefixStyle.custImgSize} preview={false} src={`${imgUrl}`} />;
    }, [prefixStyle.custImg, prefixStyle.custImgSize, env, constants]);

    if (visible) {
        const isIcon = prefixiIConType === 'icon';
        if (isIcon) {
            return <Icon type={prefixStyle.iconType} antdIcon style={innerStyle} />;
        } else {
            return <Icon style={innerStyle} component={IconComp} />;
        }
    } else {
        return <></>;
    }
};
```

**注意**：
- `prefixiIConType` 为 `'icon'` 时渲染 Ant Design 图标
- `prefixiIConType` 为 `'custImg'` 时渲染自定义图片
- `IconComp` 使用 `useMemo` 避免重复加载图片
- `innerStyle` 包含前缀文本样式（fontSize、fontWeight、fontColor、margin）

#### 2.2.5 倒影渲染

```typescript
{textSetting.textStyle.isBoxReflect && (
    <div
        style={{
            transform: 'scale(1,-1)',
            height: labelTextStyle.fontSize / 2,
            position: 'relative',
            overflow: 'hidden',
            opacity: textSetting.textStyle.boxReflectOpacity,
        }}
    >
        <div
            style={{
                ..._.omit(innerContainerStyle, ['borderColor', 'borderWidth', 'borderStyle']),
                position: 'absolute',
                bottom: 0,
                width: '100%',
            }}
        >
            <CustomIcon {...prefixSetting} innerStyle={prefixTextStyle} env={env} constants={constants} />
            <span style={labelTextStyle} className={classNames({ 'label-text-gradient': textSetting.textStyle.isGradient })}>
                {realText}
            </span>
        </div>
    </div>
)}
```

**注意**：
- 倒影使用 `transform: scale(1,-1)` 垂直翻转
- 倒影高度为 `fontSize / 2`
- 倒影透明度为 `boxReflectOpacity`（0.2-0.5）
- 倒影中移除了边框样式（`_.omit(innerContainerStyle, ['borderColor', 'borderWidth', 'borderStyle'])`）

#### 2.2.6 气泡提示

```typescript
useEffect(() => {
    const toolTips = labelTextToolTip?.showToolTip ? labelTextToolTip?.title || realText : '';

    if (labelTextToolTip?.showToolTip && toolTips) {
        function convertTips(tips) {
            return tips.map((item) => {
                return <div>{convertContent(item)}</div>;
            });
        }
        setMsgNode(convertTips(_.split(toolTips, '<br/>')));
    } else {
        setMsgNode('');
    }
}, [labelTextToolTip]);

// 渲染
<Tooltip placement={labelTextToolTip?.placement} title={msgNode}>
    {/* ... */}
</Tooltip>
```

**注意**：
- 气泡内容支持 `<br/>` 换行，需要手动分割
- `convertContent` 函数处理各种类型的内容（React 元素、数组、对象）
- 气泡位置由 `placement` 控制（12 个位置）

#### 2.2.7 点击交互

```typescript
const onLabelClick = () => {
    const clickEvent = interaction?.defined?.configurableEvent?.clickEvent;

    if (clickEvent?.show) {
        if (clickEvent.effect === 'Modal' || clickEvent.effect === 'Drawer') {
            interaction.dispatch({
                data: [
                    {
                        fieldName: 'clickEvent',
                        state: {
                            visible: true,
                            param: realText,
                        },
                    },
                ],
            });
        } else if (clickEvent.effect === 'Window') {
            window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`);
        } else if (clickEvent.effect === 'WindowSelf') {
            window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`, '_self');
        }
    }
};
```

**注意**：
- Modal/Drawer 使用 `interaction.dispatch` 触发
- Window/WindowSelf 使用 `window.open` 打开新窗口
- `interactionProps?.urlParam` 来自其他组件传递的 URL 参数

### 2.3 维护检查清单

- [ ] 文本来源优先级是否正确
- [ ] 渐变文本是否添加了 CSS 裁剪
- [ ] 倒影是否移除了边框样式
- [ ] 气泡内容是否正确分割 `<br/>`
- [ ] 下钻交互是否正确调用 `interaction.dispatch`

## 3. 样式 `index.less`

### 3.1 命名规范

```less
.label-text-root {
    .label-text-gradient {
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
}
```

### 3.2 关键样式

```less
.label-text-gradient {
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

**注意**：
- 渐变文本需要添加 `label-text-gradient` 类名
- `background-clip: text` 和 `-webkit-text-fill-color: transparent` 实现文本渐变效果

### 3.3 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致
- [ ] 渐变文本是否添加了 `label-text-gradient` 类名

## 4. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `convertContent` | 组件内 | 转换各种类型的内容为字符串 |
| `getImageUrl` | `@Utils` | 获取图片 URL |
| `_.pick` | `oss-web-toolkits` | 从对象中选取指定属性 |
| `_.omit` | `oss-web-toolkits` | 从对象中排除指定属性 |
| `_.get` | `oss-web-toolkits` | 安全获取对象属性 |
| `_.split` | `oss-web-toolkits` | 分割字符串 |

## 5. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 图片加载 | `CustomIcon` 使用 `useMemo` 避免重复加载 |
| 文本样式 | 使用 `Object.assign` 动态构建样式对象 |
| 气泡内容 | 使用 `useEffect` 监听 `labelTextToolTip` 变化 |

## 6. 调试技巧

### 6.1 查看文本来源

```typescript
console.log('realText:', realText);
console.log('interactionProps:', props.interactionProps);
console.log('receivedPropsParams:', props.receivedPropsParams);
console.log('dataSource:', dataSource);
```

### 6.2 查看文本样式

```typescript
console.log('labelTextStyle:', labelTextStyle);
console.log('innerContainerStyle:', innerContainerStyle);
```

## 7. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
