---
title: 组件逻辑维护
description: free-layout-indicators-viewer 组件代码（index.tsx + IndItem + StyledGradient）的维护要点
version: 1.0.0
last_updated: 2026-06-15
---

# 组件逻辑维护

本文档说明 `free-layout-indicators-viewer` 组件代码的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
free-layout-indicators-viewer/
├── index.tsx                        # 主组件
├── index.less                       # 样式
├── schema.ts                        # 配置面板（→ schema.md）
├── dataModel.json                   # 数据契约（→ data-model.md）
├── oss-material.json
├── components/
│   ├── IndItem.tsx                  # 单指标渲染器
│   └── StyledGradient.tsx           # 3 个 styled-components 渐变组件
└── doc/
    ├── readme.md
    └── CHANGELOG.md

# ⚠️ 静态资源（物料编译时拷贝）
public/static/images/free-layout-indicators-viewer/
└── default-bg.png                   # 默认背景图
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const FreeLayoutIndicatorsViewer: React.FC<DesignerField> = (props) => {
    const { config, dataSource } = props;
    const latestProps = useLatest(props);
    // ...
};
```

| props | 类型 | 来源 | 用途 |
|-------|------|------|------|
| `config` | object | schema | 用户配置（含 `layout` / `indicatorValueSetting` / ...） |
| `dataSource` | array | dataConfig | 数据数组 |
| `designer` | object | 框架 | 设计器上下文（用于 `getImageUrl`） |

### 2.2 关键逻辑

#### 2.2.1 背景图加载

```typescript
const getBackgroundImage = (name, ownerProps) => {
    return getMaterialImageUrl(name, ownerProps, 'static/images/free-layout-indicators-viewer');
};

const rootBackgroundImage = useMemo(() => {
    if (config.layout.disableBackground) return '';
    let image = config.layout.background;
    if (_.isNil(image) || _.isNil(image?.url)) {
        image = 'default-bg.png';  // ⚠️ 依赖静态资源
    }
    return getBackgroundImage(image, latestProps.current);
}, [config.layout.background, config.layout.disableBackground, latestProps]);
```

**`disableBackground = true` → 空白容器**（连默认图都不显示）。

#### 2.2.2 坐标点匹配 `points`

```typescript
const points = useMemo(() => {
    if (_.isEmpty(config.layout.points) || _.isEmpty(dataSource)) {
        return [];
    }
    return config.layout.points
        .map((point) => {
            const dataItem = dataSource.find((item) => item.indicatorId === point.id);
            if (!dataItem) return null;  // 找不到数据 → 该点不渲染
            let bgSetting = null;
            if (!_.isEmpty(config.indicatorItemSetting)) {
                bgSetting = config.indicatorItemSetting.find((item) => {
                    if (_.isNil(item.filterKey) || item.filterKey === '') return false;
                    return (item.filterKey || '').split(',').includes(dataItem.indicatorId);
                });
            }
            return { left: point.left, top: point.top, id: point.id, dataItem, bgSetting };
        })
        .filter(Boolean);
}, [config.indicatorItemSetting, config.layout.points, dataSource]);
```

**匹配规则**：

1. `dataItem = dataSource.find(item => item.indicatorId === point.id)` — 找不到则该点**不渲染**
2. `bgSetting = indicatorItemSetting.find(item => item.filterKey.split(',').includes(dataItem.indicatorId))` — 找不到则 `bgSetting = null`
3. 整体依赖：`[config.indicatorItemSetting, config.layout.points, dataSource]`

> ⚠️ `filterKey` 是**字符串**，用 `split(',')` 拆分。**注意前后空格**（如 `"id-1, id-2"` 中的空格）！

#### 2.2.3 渲染结构

```typescript
return (
    <section className="free-layout-indicators-viewer" style={{ backgroundImage: `url(${rootBackgroundImage})` }}>
        {points.map((point, index) => (
            <IndItem
                key={`${point.id}-${index}`}
                left={point.left}
                top={point.top}
                dataItem={point.dataItem}
                indicatorNameSetting={config.indicatorNameSetting}
                indicatorValueSetting={config.indicatorValueSetting}
                indicatorUnitSetting={config.indicatorUnitSetting}
                bgSetting={point.bgSetting}
                designer={props.designer}
                eventUISetting={config.layout.pointSize}
            />
        ))}
    </section>
);
```

### 2.3 维护检查清单

- [ ] `dataSource` 必须包含 `points` 中所有 `id`，否则部分点不渲染
- [ ] `filterKey` 多个 id 用**英文逗号**分隔，无空格
- [ ] 默认背景图 `default-bg.png` 是静态资源，**不能删除/重命名**

## 3. 单指标渲染器 `IndItem.tsx`

### 3.1 渲染结构

```typescript
<div
    className="ind-item"
    data-name="position-point"
    style={{
        position: 'absolute',
        left: props.left,
        top: props.top,
        width: 0.01,                // ⚠️ 容器本身几乎无尺寸
        height: 0.01,
        transform: 'translate3d(-50%, -50%, 0)',  // ⚠️ 居中定位
    }}
>
    {props.bgSetting && (
        <div className="ind-item-bg" style={{
            backgroundImage: `url(${getImageUrl(props.bgSetting.background, props.designer)})`,
            width: props.bgSetting.backgroundSize?.width,
            height: props.bgSetting.backgroundSize?.height,
        }} />
    )}

    <StyledValueLinearGradient ... >          {/* 数字 */}
        <DigitalNumber value={dataItem.indicatorValue} suffix={...} />
    </StyledValueLinearGradient>

    <StyledNameLinearGradient ... >            {/* 名称 */}
        {dataItem.indicatorName}
    </StyledNameLinearGradient>

    {props.eventUISetting && (                {/* 事件代理容器 */}
        <div className="ind-item-event-ui" style={{ width: ..., height: ... }} />
    )}
</div>
```

### 3.2 关键 prop

| prop | 类型 | 来源 | 说明 |
|------|------|------|------|
| `left` | string/number | `point.left` | 支持 `'20%'` 或 `100` |
| `top` | string/number | `point.top` | 支持 `'40%'` 或 `50` |
| `dataItem` | object | dataSource 匹配项 | 含 `indicatorValue` / `indicatorName` / `indicatorUnit` |
| `bgSetting` | object | `indicatorItemSetting` 匹配项 | 含 `background` / `backgroundSize` |
| `indicatorValueSetting` | object | schema | 数字样式 |
| `indicatorNameSetting` | object | schema | 名称样式 |
| `indicatorUnitSetting` | object | schema | 单位样式 |
| `eventUISetting` | object | `layout.pointSize` | 事件代理容器尺寸 |
| `designer` | object | 框架 | 设计器上下文 |

### 3.3 关键点

- **容器几乎无尺寸**（`0.01 × 0.01`），靠 `transform: translate3d(-50%, -50%, 0)` 居中
- **数字和名称绝对定位**（`StyledValueLinearGradient` 和 `StyledNameLinearGradient`），互不干扰
- **事件代理容器** `ind-item-event-ui` 有 `z-index: 999`（`index.less`），用于后续交互

### 3.4 维护检查清单

- [ ] 数字使用 `@Src/components/digital-number`，**未使用 TWEEN 动画**（与 digital-flop 区别）
- [ ] 单位是数字的 `suffix`，与名称独立
- [ ] `data-name="position-point"` 标识位置点（CSS 钩子）

## 4. 渐变文字 `StyledGradient.tsx`

### 4.1 三个 styled-components

```typescript
const gradientStr = (props) => {
    return `
        ${utils.createCssStringFromStyles(props.$font)};
        background: ${props.$enableGradient ? createGradientColorStr(props.$colors) : ''};
        ${props.$enableGradient ? '-webkit-background-clip: text;' : ''}
        ${props.$enableGradient ? '-webkit-text-fill-color: transparent;' : ''}
    `;
};

export const StyledValueLinearGradient = styled.div<...>`... .digital-number-value span { ${gradientStr} }`;
export const StyledUnitLinearGradient = styled.span<...>`${gradientStr}`;
export const StyledNameLinearGradient = styled.div<...>`... ${gradientStr}`;
```

| 组件 | 类型 | 应用对象 | 作用 |
|------|------|----------|------|
| `StyledValueLinearGradient` | `div` | 数字外层 | 注入渐变到 `.digital-number-value span` |
| `StyledUnitLinearGradient` | `span` | 单位 | 直接注入 |
| `StyledNameLinearGradient` | `div` | 名称 | 直接注入 |

### 4.2 `$enableGradient` 控制

- `false`：只应用 `fontStyle`（颜色、字体、大小等）
- `true`：额外注入 `background-clip: text` + `text-fill-color: transparent`

### 4.3 字体注入

```typescript
${utils.createCssStringFromStyles(props.$font)};
```

来自 `@oss-chart/common`，**将 JS 对象转 CSS 字符串**。字段包括：
- `fontSize` / `fontFamily` / `fontWeight` / `lineHeight` / `color` / `textAlign` 等

### 4.4 维护检查清单

- [ ] `$font` 必须是合法样式对象（参考 `compositionFontStyle()` 工厂）
- [ ] `$colors` 必须是 CssGradientColor 数组结构（含 `colorStops`）
- [ ] `$enableGradient` 必须严格 boolean（不可传 truthy 非 boolean）

## 5. 样式 `index.less`

```less
.free-layout-indicators-viewer {
    position: relative;
    width: 100%;
    height: 100%;
    background: no-repeat center center;
    background-size: 100% 100%;

    .ind-item {
        white-space: nowrap;

        .ind-item-bg {
            background: no-repeat center;
            background-size: 100% 100%;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }

        .ind-item-event-ui {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 999;          // ⚠️ 事件层 z-index
        }
    }
}
```

### 5.1 关键样式

- 根容器 `width: 100%; height: 100%` — 撑满外层
- 背景图 `background-size: 100% 100%` — 拉伸填充
- 事件层 `z-index: 999` — 确保在背景图之上
- 背景图容器 `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)` — 居中

### 5.2 维护检查清单

- [ ] 根 class 是 `free-layout-indicators-viewer`（**与 `oss-material.json.name` 一致** ✅）
- [ ] 事件层 `z-index` 不要被其他组件覆盖
- [ ] 背景图拉伸可能失真，谨慎选择

## 6. 静态资源 `default-bg.png`

### 6.1 位置

`public/static/images/free-layout-indicators-viewer/default-bg.png`

### 6.2 加载机制

```typescript
return getMaterialImageUrl('default-bg.png', ownerProps, 'static/images/free-layout-indicators-viewer');
```

- 第一个参数：文件名（含扩展名）
- 第三个参数：物料静态资源目录（**与物料 name 一致**）
- 物料编译时 `webpack-components.config.js` 会把 `public/static/images/{name}/*` 拷贝到产物

### 6.3 维护检查清单

- [ ] 路径必须**与物料 name 完全一致**（`free-layout-indicators-viewer`）
- [ ] 改物料名时**同步改资源目录名**
- [ ] 删除前先确认无物料引用

## 7. 常用工具函数

| 函数 | 来源 | 用途 |
|------|------|------|
| `getMaterialImageUrl` | `@Src/utils/getImageUrl` | 加载物料静态资源 |
| `getImageUrl` | `@Src/utils` | 通用图片 URL（带 designer 上下文） |
| `useLatest` | `@Src/hooks/useLatest` | 保留最新 props（用于回调） |
| `createGradientColorStr` | `@Src/utils` | 渐变色 CSS 字符串 |
| `utils.createCssStringFromStyles` | `@oss-chart/common` | 字体对象 → CSS 字符串 |
| `DigitalNumber` | `@Src/components/digital-number` | 数字组件（无 TWEEN 动画） |

## 8. 性能要点

| 场景 | 注意事项 |
|------|----------|
| 大量坐标点（>50） | `points` useMemo 依赖 `[config.indicatorItemSetting, config.layout.points, dataSource]`，单点变化会重算所有 |
| 频繁数据更新 | 内部 `find` 操作是 O(n*m)，可用 Map 优化 |
| 大量背景图 | `Background` 组件会预加载图片，可能影响首屏 |
| styled-components | 动态生成 CSS，第一次渲染略慢 |

## 9. 调试小技巧

### 9.1 查看实际匹配的 points

```typescript
// index.tsx
console.log('matched points:', points);
```

### 9.2 临时禁用背景

```typescript
// index.tsx
if (true) return ''; // 强制禁用
```

### 9.3 查看 indicatorItemSetting 匹配

```typescript
// IndItem.tsx
console.log('bgSetting:', props.bgSetting);
```

## 10. 维护历史

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
