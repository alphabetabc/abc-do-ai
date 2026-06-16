---
title: label-text 常见修改任务
description: 标题物料（label-text）最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# label-text 常见修改任务

本文档列出针对 `label-text` 最常见的修改需求及对应的代码定位。

## 任务 1：新增文本效果（如文字发光）

**场景描述**：需要为标题添加文字发光效果（如 text-shadow 多层叠加）。

**涉及文件**：
- `schema.ts`：添加发光效果配置字段
- `index.jsx`：构建发光样式

**步骤**：

1. 在 `schema.ts` 的 `textStyle` 中添加：

```typescript
isGlow: {
    title: '是否显示发光',
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
},
glowColor: {
    title: '发光颜色',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'ColorPicker',
    'x-reactions': {
        dependencies: ['.isGlow'],
        when: '{{ $deps[0] === true }}',
        fulfill: {
            state: { visible: true },
        },
        otherwise: {
            state: { visible: false },
        },
    },
},
glowSize: {
    title: '发光大小',
    type: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    'x-reactions': {
        dependencies: ['.isGlow'],
        when: '{{ $deps[0] === true }}',
        fulfill: {
            state: { visible: true },
        },
        otherwise: {
            state: { visible: false },
        },
    },
},
```

2. 在 `index.jsx` 中构建发光样式：

```typescript
// 发光
if (textSetting?.textStyle?.isGlow) {
    const { glowColor, glowSize } = textSetting.textStyle;
    Object.assign(labelTextStyle, {
        textShadow: `0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 2}px ${glowColor}`,
    });
}
```

3. 在 `defaultValue.config.text.textStyle` 中添加默认值：

```typescript
isGlow: false,
glowColor: '#FFFFFF',
glowSize: 10,
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.2](./schema.md#212-文本样式-textstyle)
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-文本样式构建)
- ⬜ 数据：（无）

## 任务 2：新增背景图片

**场景描述**：需要为标题添加背景图片（而非纯色/渐变）。

**涉及文件**：
- `schema.ts`：添加背景图片配置字段
- `index.jsx`：构建背景图片样式

**步骤**：

1. 在 `schema.ts` 的 `backgroundStyle` 中添加：

```typescript
isBackgroundImage: {
    title: '是否使用背景图片',
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
},
backgroundImage: {
    title: '背景图片',
    displayType: 'row',
    'x-decorator': 'FormItem',
    'x-component': 'Background',
    'x-component-props': { type: 'image' },
    'x-reactions': {
        dependencies: ['.isBackgroundImage'],
        when: '{{ $deps[0] === true }}',
        fulfill: {
            state: { visible: true },
        },
        otherwise: {
            state: { visible: false },
        },
    },
},
```

2. 在 `index.jsx` 中构建背景图片样式：

```typescript
if (backgroundStyle.isBackgroundImage) {
    const imgUrl = getImageUrl(backgroundStyle.backgroundImage, { env, constants });
    Object.assign(innerContainerStyle, {
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
    });
}
```

3. 在 `defaultValue.config.labelTextBg.backgroundStyle` 中添加默认值：

```typescript
isBackgroundImage: false,
backgroundImage: null,
```

**涉及**：
- 🟦 Schema：[schema.md § 2.2.1](./schema.md#221-背景颜色-backgroundstyle)
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-背景样式构建)
- ⬜ 数据：（无）

## 任务 3：新增前缀图标类型

**场景描述**：需要为前缀图标添加新的类型（如 SVG 图标）。

**涉及文件**：
- `schema.ts`：添加新的前缀类型选项
- `index.jsx`：渲染新的图标类型

**步骤**：

1. 在 `schema.ts` 的 `prefixiIConType` 中添加选项：

```typescript
enum: [
    { label: '图标', value: 'icon' },
    { label: '图片', value: 'custImg' },
    { label: 'SVG', value: 'svg' },  // 新增
],
```

2. 添加 SVG 配置字段：

```typescript
svgIcon: {
    title: 'SVG 图标',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-reactions': {
        dependencies: ['.prefixiIConType'],
        when: "{{ $deps[0] === 'svg' }}",
        fulfill: {
            state: { visible: true },
        },
        otherwise: {
            state: { visible: false },
        },
    },
},
```

3. 在 `index.jsx` 的 `CustomIcon` 中渲染 SVG：

```typescript
if (visible) {
    const isIcon = prefixiIConType === 'icon';
    const isSvg = prefixiIConType === 'svg';
    if (isIcon) {
        return <Icon type={prefixStyle.iconType} antdIcon style={innerStyle} />;
    } else if (isSvg) {
        return <span style={innerStyle} dangerouslySetInnerHTML={{ __html: prefixStyle.svgIcon }} />;
    } else {
        return <Icon style={innerStyle} component={IconComp} />;
    }
}
```

**涉及**：
- 🟦 Schema：[schema.md § 2.3.3](./schema.md#233-前缀图标配置)
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-前缀图标渲染)
- ⬜ 数据：（无）

## 任务 4：调整下钻交互参数

**场景描述**：需要修改 Modal 的默认尺寸或位置。

**涉及文件**：
- `schema.ts`：修改下钻配置的默认值

**步骤**：

1. 在 `schema.ts` 的 `modalSet` 中修改默认值：

```typescript
size: {
    type: 'void',
    title: '尺寸',
    'x-decorator': 'FormItem',
    'x-component': 'Space',
    'x-component-props': {
        size: 20,
    },
    properties: {
        width: {
            type: 'number',
            'x-component': 'NumberPicker',
            default: 800,  // 修改默认宽度
        },
        height: {
            type: 'number',
            'x-component': 'NumberPicker',
            default: 600,  // 修改默认高度
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 3.2.2](./schema.md#322-modal-配置-modalset)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 5：修改气泡内容换行方式

**场景描述**：需要将气泡内容的换行符从 `<br/>` 改为 `\n`。

**涉及文件**：
- `index.jsx`：修改气泡内容分割逻辑

**步骤**：

1. 在 `index.jsx` 的 `useEffect` 中修改分割逻辑：

```typescript
useEffect(() => {
    const toolTips = labelTextToolTip?.showToolTip ? labelTextToolTip?.title || realText : '';

    if (labelTextToolTip?.showToolTip && toolTips) {
        function convertTips(tips) {
            return tips.map((item) => {
                return <div>{convertContent(item)}</div>;
            });
        }
        // 修改分割符
        setMsgNode(convertTips(toolTips.split('\n')));
    } else {
        setMsgNode('');
    }
}, [labelTextToolTip]);
```

2. 在 `schema.ts` 的 `title` 字段中修改提示：

```typescript
title: {
    type: 'string',
    title: '气泡内容',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-decorator-props': {
        tooltip: '气泡内容默认为标题内容，文字换行示例：第一行\\n第二行\\n第三行',
    },
    // ...
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.4](./schema.md#24-气泡面板-labeltexttooltip)
- 🟨 组件逻辑：[component-logic.md § 2.2.6](./component-logic.md#226-气泡提示)
- ⬜ 数据：（无）
