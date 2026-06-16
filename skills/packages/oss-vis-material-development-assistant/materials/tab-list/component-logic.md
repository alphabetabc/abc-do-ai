# tab-list 组件逻辑

## 1. 概述

tab-list 是一个基于 Radio.Group 的 Tab 切换组件，核心逻辑包括：
1. 轮播切换逻辑
2. 选中状态管理
3. 样式构建（背景、文本、前缀）
4. 交互派发（12 个参数）
5. 轮播控制开关

## 2. 核心逻辑

### 2.1 轮播逻辑

```typescript
const carouselIndex = useRef(0);
const timer = useRef();
const [innerEnableCarousel, setInnerEnableCarousel] = useState(true);

useEffect(() => {
    if (data && enableCarousel && innerEnableCarousel) {
        timer.current = setInterval(() => {
            carouselIndex.current += 1;
            if (carouselIndex.current >= data?.length) {
                carouselIndex.current = 0;
            }
            setCheckedId(data[carouselIndex.current]?.id);
        }, period * 1000);
    } else {
        if (timer.current) {
            clearInterval(timer.current);
        }
    }
    return () => {
        clearInterval(timer.current);
    };
}, [enableCarousel, period, innerEnableCarousel, data]);
```

**轮播控制**：
- `enableCarousel`：schema 配置的轮播开关（`commonStyle.carousel.show`）
- `innerEnableCarousel`：组件内部轮播状态（受控制按钮影响）
- `period`：轮播周期（秒）

**外部控制轮播启停**：
```typescript
// 停止轮播
useEffect(() => {
    if (interactionProps?.stopCarouselParam) {
        setInnerEnableCarousel(false);
    }
}, [interactionProps?.stopCarouselParam]);

// 启动轮播
useEffect(() => {
    if (interactionProps?.startCarouselParam) {
        setInnerEnableCarousel(true);
    }
}, [interactionProps?.startCarouselParam]);
```

### 2.2 选中状态管理

```typescript
const [checkedId, setCheckedId] = useState(commonStyle?.defaultCheck || data[0]?.id);

// 点击切换
<Radio value={item.id} key={index}>
    <section onClick={() => setCheckedId(item.id)} checked={checked} style={style}>
        {/* 内容 */}
    </section>
</Radio>
```

**默认选中**：优先使用 `commonStyle.defaultCheck`，否则使用 `data[0]?.id`

### 2.3 交互派发

```typescript
useEffect(() => {
    const item = (data || []).find((item) => item.id === checkedId);
    
    // 动态事件派发（优先级高）
    if (actionsParams.length > 0 && interaction?.dispatch) {
        interaction.dispatch({
            data: [
                { fieldName: interaction.defined?.onClick, state: item?.param || 0 },
                { fieldName: interaction.defined?.onClickId, state: item?.id },
                { fieldName: interaction.defined?.onClickName, state: item?.content },
                { fieldName: interaction.defined?.onClickParams1, state: item?.params1 },
                // ... params2-9
            ],
        });
    }
    
    // 兼容事件派发（优先级低）
    if (clickEventConfig?.clickParams && interaction?.dispatch) {
        interaction.dispatch({
            data: [
                { fieldName: interaction.defined?.clickParams, state: clickEventConfig?.clickParams },
            ],
        });
    }
}, [checkedId, data]);
```

**派发参数**：
- `onClick`：元素的 `param` 字段（注意：dataModel 中未定义此字段）
- `onClickId`：元素的 `id` 字段
- `onClickName`：元素的 `content` 字段
- `onClickParams1-9`：元素的 `params1-9` 字段
- `clickParams`：配置面板中设置的固定值

### 2.4 样式构建

```typescript
const formateStyle = (style) => {
    const { backgroundImg, backgroundType, backgroundColor, backgroundRepeat, textStyle, prefixStyle, ...innerStyle } = style;

    if (backgroundType === 'image' && backgroundImg) {
        innerStyle.backgroundImage = `url(${getImageUrl(backgroundImg, { env, constants })})`;
        if (backgroundRepeat === 'full') {
            innerStyle.backgroundSize = '100% 100%';
            innerStyle.backgroundRepeat = 'no-repeat';
        } else {
            innerStyle.backgroundRepeat = backgroundRepeat;
        }
    } else if (backgroundColor) {
        innerStyle.backgroundColor = backgroundColor;
    }

    const result = { ...innerStyle, ...textStyle };
    return result;
};
```

**样式优先级**：
1. 选中项使用 `activeStyle`
2. 未选中项使用 `baseStyle`
3. `textStyle` 会覆盖 `innerStyle` 中的文本相关属性

### 2.5 轮播控制按钮

```typescript
const [showAutoPlayIconFlag, setAutoPlayIconFlag] = useState(false);

const onMouseOver = () => {
    if (enableCarousel && isAutoPlayControler) {
        setTimeout(() => setAutoPlayIconFlag(true), 50);
    }
};

const onMouseOut = () => {
    if (enableCarousel && isAutoPlayControler) {
        setTimeout(() => setAutoPlayIconFlag(false), 50);
    }
};

const onAutoPlayIconClick = () => {
    innerEnableCarousel ? setInnerEnableCarousel(false) : setInnerEnableCarousel(true);
};
```

**控制按钮显示条件**：
- `enableCarousel`：轮播开关开启
- `isAutoPlayControler`：控制开关开启
- `showAutoPlayIconFlag`：鼠标悬停状态

**按钮图标**：
- 轮播中：`iconjieshu`（结束图标）
- 轮播暂停：`iconkaishi1`（开始图标）

### 2.6 前缀图标渲染

```typescript
const CustIcon = (props) => {
    const { custStyle = {}, data, env, constants } = props;
    const { show = false, prefixType = 'icon', ...prefixStyle } = custStyle;

    const iconComp = useMemo(() => {
        const prefixSrc = getImageUrl(prefixStyle.prefixImg, { env, constants }) || `${constants?.IMAGE_PATH}/${data}.png`;
        return () => <Image width={prefixStyle.width} preview={false} src={prefixSrc} />;
    }, [data, prefixStyle.width, prefixStyle.prefixImg, env, constants]);

    if (show && data) {
        const isIcon = prefixType === 'icon';
        if (isIcon) {
            return <Icon type={data} antdIcon style={prefixStyle} />;
        } else {
            return <Icon style={prefixStyle} component={iconComp} />;
        }
    } else {
        return <></>;
    }
};
```

**前缀类型**：
- `icon`：使用 `Icon` 组件，`data` 为 Icon 名称
- `image`：使用 `Image` 组件，`data` 为图片名称（无后缀），或 `prefixImg` 指定的图片

### 2.7 显示控制

```typescript
const visible = interactionProps?.visible ? interactionProps?.visible : '1';

return (
    <ConfigProvider prefixCls="oss-ui">
        {visible === '1' ? (
            <DataStatus status={isSuccess ? DataStatus.STATUS.SUCCESS : DataStatus.STATUS.ERROR}>
                {/* 组件内容 */}
            </DataStatus>
        ) : (
            ''
        )}
    </ConfigProvider>
);
```

**显示逻辑**：
- `visible === '1'`：显示组件
- `visible !== '1'`：隐藏组件（返回空字符串）

### 2.8 数据状态检查

```typescript
const isSuccess = useMemo(() => {
    if (lodash.isArray(data) && data.length === 0) {
        return true;
    }
    return !lodash.isNil(data?.[0]?.content);
}, [data]);
```

**成功条件**：
- 数据为空数组：成功
- 数据第一项有 `content` 字段：成功
- 否则：失败

## 3. 组件结构

```
ConfigProvider (prefixCls="oss-ui")
└── DataStatus (status=isSuccess)
    └── div.table-list-container
        ├── Icon.tab-list-switch-btn (轮播控制按钮，条件显示)
        └── Radio.Group
            └── Radio[] (遍历 data)
                └── section
                    ├── CustIcon (前缀图标)
                    └── span (文本内容)
```

## 4. 事件处理

| 事件 | 处理函数 | 说明 |
|------|----------|------|
| `onClick` (容器) | `(e) => e.stopPropagation()` | 阻止事件冒泡 |
| `onMouseOver` | `onMouseOver` | 显示轮播控制按钮 |
| `onMouseOut` | `onMouseOut` | 隐藏轮播控制按钮 |
| `onClick` (控制按钮) | `onAutoPlayIconClick` | 切换轮播状态 |
| `onClick` (Tab项) | `() => setCheckedId(item.id)` | 切换选中项 |

## 5. 跨文档引用

- **Schema 配置**：`config.commonStyle.carousel` 控制轮播 → 参见 [schema.md](./schema.md#31-通用配置commonstyle)
- **数据格式**：`data` 数组结构 → 参见 [data-model.md](./data-model.md#2-数据结构)
- **交互派发**：`interaction.dispatch` 参数 → 参见 [schema.md](./schema.md#42-派发action)
