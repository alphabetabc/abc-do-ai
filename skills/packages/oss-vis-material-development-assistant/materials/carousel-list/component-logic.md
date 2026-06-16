---
title: carousel-list 组件逻辑维护
description: 轮播列表(垂直)物料（carousel-list）的组件代码维护要点，包含轮播逻辑、选中状态、样式构建、交互派发
version: 1.0.0
last_updated: 2026-06-16
---

# carousel-list 组件逻辑维护

本文档说明 `carousel-list` 组件代码（`index.jsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
carousel-list/
├── index.jsx          # 主组件
├── index.less         # 样式
├── schema.ts          # 配置面板（→ schema.md）
├── dataModel.json     # 数据契约（→ data-model.md）
├── oss-material.json  # 物料元信息
└── doc/readme.md      # 用户向文档
```

## 2. 主组件 `CarouselList`

### 2.1 入口签名

```typescript
const CarouselList = (props) => {
    const { dataSource: data, config, interaction } = props;
    const { swiperTimer, style, dividerStyle, selectedStyle, nameFontStyle, valueFontStyle, unitFontStyle } = config;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `dataSource` | array | dataConfig | 数据源（数组） |
| `config` | object | schema | 用户配置 |
| `interaction` | object | 框架 | 交互配置 |

### 2.2 关键逻辑

#### 2.2.1 轮播逻辑

```typescript
const carouselIndex = useRef(0); // 轮播索引

useEffect(() => {
    if (swiperTimer < 1) {
        return;
    }
    const timer = setInterval(() => {
        carouselIndex.current += 1;
        if (carouselIndex.current >= data?.length) {
            carouselIndex.current = 0;
        }
        setCurrentIndex(carouselIndex.current);
    }, swiperTimer * 1000);
    return () => {
        clearInterval(timer);
    };
}, [swiperTimer]);
```

**注意**：
- 使用 `useRef` 存储轮播索引
- `swiperTimer < 1` 时不启动轮播
- 轮播时间间隔为 `swiperTimer * 1000` 毫秒
- 到达末尾时重置为 0

#### 2.2.2 选中状态

```typescript
const [current, setCurrent] = useState(data[0]?.name);
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
    const name = data[currentIndex]?.name;
    setCurrent(name);
    if (_.isFunction(onChange)) {
        onChange(data[currentIndex]);
    }
}, [currentIndex]);
```

**注意**：
- `current` 存储当前选中项的 name
- `currentIndex` 存储当前选中项的索引
- 选中状态变化时触发 `onChange` 派发参数

#### 2.2.3 交互派发

```typescript
const onChange = (item) => {
    const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
    if (actionsParams.length > 0 && interaction?.dispatch) {
        interaction.dispatch({
            data: [
                {
                    fieldName: interaction.defined?.rowHighlightId,
                    state: item?.id,
                },
                {
                    fieldName: interaction.defined?.rowHighlightName,
                    state: item?.name,
                },
            ],
        });
    }
};
```

**注意**：
- 派发 `rowHighlightId` 和 `rowHighlightName` 两个参数
- 参数值来自选中项的 `id` 和 `name` 字段

#### 2.2.4 样式构建

```typescript
// 图标颜色
const colors = style.customColors && style.customColors.length > 0 
    ? style.customColors.map((item) => item.color) 
    : DEFAULT_COLORS;

// 分割线样式
const divider = {
    width: dividerStyle?.width,
    height: 5,
    backgroundImage: `linear-gradient(to right, ${dividerStyle?.color} ${dividerStyle?.density}%, transparent ${dividerStyle?.density}%)`,
    backgroundSize: `${dividerStyle?.dashedwidth}px 1px`,
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'center',
};

// 图标样式
const markerStyle = {
    width: style?.size,
    height: style?.size,
    borderRadius: style?.size / 2,
    borderWidth: style?.size / 4,
    borderStyle: 'solid',
};

// 选中样式
const selected = {
    width: style?.width,
    height: style?.height,
    background: selectedStyle?.background,
    border: `${selectedStyle?.borderWidth}px ${selectedStyle?.borderStyle} ${selectedStyle?.color}`,
    borderRadius: '8px',
    boxShadow: `0px 0px ${selectedStyle?.boxShadow}px ${selectedStyle?.shadowColor}`,
};
```

**注意**：
- 图标颜色使用 `DEFAULT_COLORS` 作为默认值
- 分割线使用 `backgroundImage` 实现虚线效果
- 图标使用圆形样式（`borderRadius: size / 2`）
- 选中样式包含背景、边框、阴影

#### 2.2.5 字体样式

```typescript
function format(style) {
    return {
        fontFamily: style?.fontFamily,
        fontSize: style?.fontSize,
        fontWeight: style?.fontWeight,
    };
}

function colorsFormat(style) {
    const colors = style?.isCustomColors && style?.customColors?.length > 0 
        ? style.customColors.map((item) => item.color) 
        : [];
    return colors;
}

const nameColors = colorsFormat(nameFontStyle);
const valueColors = colorsFormat(valueFontStyle);
const unitColors = colorsFormat(unitFontStyle);

const nameFont = format(nameFontStyle);
const valueFont = format(valueFontStyle);
const unitFont = format(unitFontStyle);
```

**注意**：
- `format` 提取字体样式
- `colorsFormat` 提取多色配置
- 如果 `isCustomColors` 为 true 且 `customColors` 有值，使用多色

#### 2.2.6 渲染结构

```typescript
return (
    <div className="carousel-list-container">
        {data &&
            data.map((item, index) => [
                <div
                    key={index}
                    className={`carousel-list-line`}
                    style={current === item?.name ? selected : { width: style?.width, height: style?.height }}
                    id={item?.name}
                >
                    <div className="carousel-list-line-block">
                        <div style={{ ...markerStyle, borderColor: colors[index] }}></div>
                        <div
                            className="carousel-list-name"
                            style={{ ...nameFont, color: nameFontStyle?.isCustomColors ? nameColors[index] : nameFontStyle?.color }}
                        >
                            {item?.name}
                        </div>
                    </div>
                    <div className="carousel-list-line-block">
                        <div style={{ ...valueFont, color: valueFontStyle?.isCustomColors ? valueColors[index] : valueFontStyle?.color }}>
                            {item?.value}
                        </div>
                        <div style={{ ...unitFont, color: unitFontStyle?.isCustomColors ? unitColors[index] : unitFontStyle?.color }}>
                            {item?.unit}
                        </div>
                    </div>
                </div>,
                <div style={divider}></div>,
            ])}
    </div>
);
```

**注意**：
- 使用 `current === item?.name` 判断是否选中
- 选中项应用 `selected` 样式，否则应用默认样式
- 图标颜色使用 `colors[index]`
- 字体颜色根据 `isCustomColors` 判断使用多色还是单色
- 每行后面添加分割线

### 2.3 维护检查清单

- [ ] 轮播时间间隔是否正确
- [ ] 选中状态判断是否正确
- [ ] 样式构建是否正确
- [ ] 交互派发是否正确

## 3. 样式 `index.less`

### 3.1 命名规范

```less
.carousel-list-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .carousel-list-line {
        padding: 0 8px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        .carousel-list-line-block {
            display: flex;
            flex-direction: row;
            align-items: center;
        }

        .carousel-list-name {
            margin-left: 20px;
        }
    }
}
```

**注意**：
- 根 class 与 `oss-material.json.name` 一致
- 使用 flex 布局

### 3.2 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致
- [ ] 布局是否正确

## 4. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `format` | 组件内 | 提取字体样式 |
| `colorsFormat` | 组件内 | 提取多色配置 |
| `_.isFunction` | `oss-web-toolkits` | 判断是否为函数 |
| `DEFAULT_COLORS` | `@Common/constants` | 默认颜色数组 |

## 5. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 轮播逻辑 | 使用 `useRef` 存储索引，避免重渲染 |
| 定时器清理 | 使用 `clearInterval` 清理定时器 |
| 样式构建 | 使用 `useMemo` 缓存样式（未实现，可优化） |

## 6. 调试技巧

### 6.1 查看轮播状态

```typescript
console.log('currentIndex:', currentIndex);
console.log('current:', current);
```

### 6.2 查看样式

```typescript
console.log('selected:', selected);
console.log('divider:', divider);
```

## 7. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
