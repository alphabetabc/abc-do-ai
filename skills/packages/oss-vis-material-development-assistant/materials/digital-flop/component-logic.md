---
title: 组件逻辑维护
description: digital-flop 组件代码（index.tsx + 4 个子组件 + TWEEN 动画）的维护要点
version: 1.0.0
last_updated: 2026-06-15
---

# 组件逻辑维护

本文档说明 `digital-flop` 组件代码（`index.tsx` + 4 个子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
digital-flop/
├── index.tsx                       # 主组件
├── index.less                      # 基础样式
├── schema.ts                       # 配置面板（→ schema.md）
├── dataModel.json                  # 数据契约（→ data-model.md）
├── types.ts                        # TS 类型
├── schema-parts/
│   └── defaultValues.ts            # 默认值抽离
├── oss-material.json
├── components/
│   ├── value-renderer.tsx          # TWEEN 动画核心
│   ├── RootStyled.tsx              # styled-components 根容器
│   ├── CompPrefixTpl.tsx           # 前缀模板 + prefixOptionResolve
│   ├── CompSuffixTpl.tsx           # 后缀模板 + suffixOptionResolve
│   └── TrendIcon.tsx               # 趋势图标 + tendencyTypes
└── doc/
    ├── readme.md                   # 用户向文档
    └── CHANGELOG.md
```

## 2. 类型定义 `types.ts`

```typescript
type TextStyle = {
    fontFamily: string | null;
    fontWeight: string | number | null;
    fontSize: number | null;
    textAlign: 'left' | 'center' | 'right' | null;
    lineHeight: string | number | null;
    color: string | null;
};

type NumberSetting = {
    size: { width: number | null; height: number | null };
    textStyle: Omit<TextStyle, 'lineHeight'>;  // 数字不需要 lineHeight
    textGap: number | null;
    flopType: 'normal' | 'classics';
    backgroundImage: string & { url: string; isMaterial: boolean };
    backgroundColor: string | null;
    backgroundRadius: number | null;
    groupSeparator: { show: boolean; separator: string | null | '' };
    precision: number | null;
    animation: { show: boolean; duration: number | null };
    [key: string]: any;  // ← 允许隐式字段
};
```

> ⚠️ `NumberSetting` 有 `[key: string]: any`，所以组件能读取**未在 schema 声明的字段**（如 `enableRemoveEndZero` / `fontSkew`）。

## 3. 主组件 `index.tsx`

### 3.1 入口签名

```typescript
const DigitalFlop = (props: any) => {
    const { className, config, dataSource: propsData, designer, interaction, interactionProps } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
|-------|------|------|------|
| `config` | object | schema | 用户配置 |
| `dataSource` | object/array | dataConfig | **单对象**（或取数组第一项） |
| `designer` | object | 框架 | 设计器上下文（`getImageUrl` 需要） |
| `interaction` | object | 框架 | `{ defined, dispatch }` |
| `interactionProps` | object | 框架 | URL 参数（`urlParam`） |
| `className` | string | 框架 | 透传 className |

### 3.2 dataSource 转换

```typescript
const dataSource = useMemo(() => {
    let result = _.isArray(propsData) ? propsData[0] : propsData;
    if (_.isEmpty(result)) result = {};
    return result;
}, [propsData]);

const data = dataSource.value;
const dataLevel = Number(dataSource.render);
```

> ⚠️ **单对象**！如果数据源给的是数组，只取第一项。

### 3.3 关键逻辑

#### 3.3.1 趋势方向判断 `tendency`

```typescript
const tendency = useMemo(() => {
    let result: any = null;
    if (_.isUndefined(data)) return result;
    const threshold = Number(prefixOption.trend.threshold);
    if (!Number.isNaN(data) && !Number.isNaN(threshold)) {
        if (data > threshold) result = tendencyTypes[0]; // 'up'
        if (data < threshold) result = tendencyTypes[1]; // 'down'
    }
    return result;
}, [data, prefixOption.trend?.threshold]);
```

⚠️ **等于阈值时** `tendency` 为 `null`，**不显示**趋势图标（`!tendencyTypes.includes(tendency)` 返回 null）。

#### 3.3.2 颜色优先级 `statisticOption.valueStyle.color`

```typescript
result.valueStyle.color = prefixOption.trend.iconColorSettings.syncToNumber
    ? prefixOption.trend.iconColorSettings[tendency]  // 趋势色
    : (_.get(numberSetting, 'textStyle.color') || trendSetting[tendency]);

if (prefixOption.trend?.iconColorSettings?.syncToNumber && trend?.isLevel?.show === true) {
    const { color } = latestGetTrendColor.current();
    result.valueStyle.color = color;  // ← 级别色覆盖
}
```

**优先级**：级别色 > 趋势色（up/down）> 文本默认色。

#### 3.3.3 后缀颜色 `suffixColor`

```typescript
const suffixColor = useMemo(() => {
    if (suffix?.syncToSuffix && prefixOption.trend?.iconColorSettings?.syncToNumber && trend?.isLevel?.show === true) {
        return color; // 级别色
    } else if (suffix?.syncToSuffix && prefixOption.trend?.iconColorSettings?.syncToNumber) {
        return prefixOption?.trend?.iconColorSettings?.[tendency]; // 趋势色
    }
    return suffixOption?.style?.color; // 默认
}, [...]);
```

> `suffix.syncToSuffix` 必须配合 `iconColorSettings.syncToNumber` 才生效。

#### 3.3.4 点击事件 `onLabelClick`

```typescript
const onLabelClick = () => {
    const actionsParams = Object.keys(_.omit(interaction?.defined || {}, ['configurableEvent'])).filter(Boolean);

    if (actionsParams.length > 0 && interaction?.dispatch) {
        interaction.dispatch({
            data: [{ fieldName: interaction.defined?.onClickId, state: dataSource.id }],
        });
    }

    const clickEvent = interaction?.defined?.configurableEvent?.clickEvent;
    if (clickEvent?.show) {
        if (clickEvent.effect === 'Modal' || clickEvent.effect === 'Drawer') {
            interaction.dispatch({
                data: [{ fieldName: 'clickEvent', state: { visible: true, ...dataSource } }],
            });
        } else if (clickEvent.effect === 'Window') {
            window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`);
        } else if (clickEvent.effect === 'WindowSelf') {
            window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`, '_self');
        }
    }
};
```

> ⚠️ `dataSource.id` 在 dataModel **未声明**！详见 [data-model.md § 3.1](./data-model.md#31-默认数据示例)。

#### 3.3.5 渲染结构

```
<ConfigProvider prefixCls="oss-ui">          ← 全局 Antd 样式前缀
  <RootStyled                                 ← styled-components（渐变/倾斜/千分位）
    onClick={onLabelClick}
    enable={textGradientColor.show && !isLevel.show}  ← 级别模式禁用渐变
    gradientColor={...}
    numberSkew={config.number.fontSkew ?? 0}  ← ⚠️ 隐式字段
    ...
  >
    <Statistic                                ← antd Statistic
      prefix={<PrefixTpl .../>}                ← 含 trendSetting.trendVisible 时显示 TrendIcon
      suffix={<SuffixTpl .../>}
      valueRender={valueRenderer.valueRender} ← TWEEN 渲染
    />
  </RootStyled>
</ConfigProvider>
```

> ⚠️ `enable` 条件：`!trend?.isLevel?.show` — 启用级别渲染时**不应用文本渐变色**（避免颜色冲突）。

### 3.4 维护检查清单

- [ ] `dataSource` 是单对象，不是数组
- [ ] `tendency` 为 null 时不显示趋势图标
- [ ] 颜色优先级：级别 > 趋势 > 文本默认
- [ ] `enableRemoveEndZero` / `fontSkew` 是隐式字段，schema 未声明
- [ ] 点击事件派发依赖 `dataSource.id`（需在 dataConfig 中手动填入）

## 4. 动画核心 `value-renderer.tsx`

### 4.1 全局 RAF 循环

```typescript
let rafRunningFlag = false;
let stopFlag = false;
let rafId: any = null;
const update = () => {
    if (stopFlag) {
        cancelAnimationFrame(rafId);
        rafId = null;
        return;
    }
    TWEEN.update();
    rafId = requestAnimationFrame(update);
};
```

⚠️ **模块级单例**：多个 `digital-flop` 实例**共享**同一个 RAF 循环。`rafRunningFlag` 防止重复启动。

### 4.2 类 `ValueRenderer`

```typescript
class ValueRenderer {
    private option: any;
    private preValue = 0;
    private currentValue = 0;
    private wrapperId = `value_renderer_id_${++renderId}_${Date.now()}_${uuid()}`;
    private tween: any = null;
    private forceUpdateFlag = false;
    private valueOption: any = {};
    private designerProps: any = undefined;

    set value(v: number) { this.currentValue = v; }
    set designer(value) { this.designerProps = value; }
    set isForceUpdate(flag: boolean) { this.forceUpdateFlag = flag; }
    get isForceUpdate() { return this.forceUpdateFlag; }
    valueRender(valueNode) { /* ... */ }
    updateStyle(option) { /* ... */ }
    start() { /* ... */ }
    stop() { /* this.tween?.stop() */ }
    dispose() { /* this.stop(); this.tween = null */ }
}
```

#### 4.2.1 TWEEN 触发逻辑

```typescript
valueRender(valueNode) {
    const num = Number(value);
    if (Number(this.preValue) !== num) {
        this.forceUpdateFlag = false;
        this.currentValue = isNaN(num) ? 0 : num;
        this.tween = new TWEEN.Tween({ value: this.preValue })
            .to({ value: this.currentValue }, this.innerAnimationOption.duration)
            .easing(this.innerAnimationOption.easing)
            .onUpdate((o) => this.update(o))
            .onComplete(() => { this.preValue = this.currentValue; })
            .onStop(() => { this.preValue = this.currentValue; });
    } else {
        this.forceUpdateFlag = true;  // 值未变
    }
    return <section id={this.wrapperId}>...</section>;
}
```

#### 4.2.2 数字字符渲染

```typescript
let valueArr: Array<string> = value.split('');
if (this.valueOption.enableRemoveEndZero && this.valueOption.precision > 0) {
    valueArr = valueArr.reduceRight((r, v) => {
        if (_.toString(v) !== '0' || r.length > 0) r.unshift(v);
        return r;
    }, [] as any);
    const lastItem = valueArr[valueArr.length - 1];
    if (lastItem === '.') valueArr.pop();
}
```

> `enableRemoveEndZero` 是**隐式字段**（schema 未声明）！详见 [gotchas.md § 3](./gotchas.md#3-️-隐式字段-enableremoveendzero)。

#### 4.2.3 字符级样式

```typescript
valueArr.forEach((d, i) => {
    const el = document.createElement('span');
    const numClassName = ['.', this.valueOption.groupSeparator].includes(d) ? 'wrapper-separate-char' : 'wrapper-real-number';
    const cls = `wrapper-number ${numClassName}`;
    el.setAttribute('class', `${cls} ${d === this.valueOption.groupSeparator ? 'group-separator-char' : ''}`);
    // ... 注入 style
});
```

> 直接操作 DOM（不用 React 渲染每个字符），**性能更好**，但需手动同步 React 生命周期。

#### 4.2.4 `flopType: 'normal'` 的特殊处理

```typescript
if (flopType === flopTypeEnums.normal) {
    el.style.backgroundImage = 'none';
    el.style.backgroundColor = 'transparent';
    el.style.padding = '0';
}
```

`normal` 模式强制清除背景。

### 4.3 `useValueRenderer` Hook

```typescript
export const useValueRenderer = (data, option) => {
    const preValueRenderRef: any = useRef();
    const valueRenderer = useMemo(() => {
        if (preValueRenderRef.current) preValueRenderRef.current.stop();
        preValueRenderRef.current = new ValueRenderer({
            valueStyles: ['color', 'fontFamily', 'fontSize', 'fontWeight', 'backgroundColor', 'backgroundImage', 'borderRadius'],
        });
        return preValueRenderRef.current;
    }, []);

    useEffect(() => { /* updateStyle */ }, [option.style, option.precision, option.groupSeparator, option.flopType, option.enableRemoveEndZero, valueRenderer]);
    useEffect(() => { /* value + animation */ }, [valueRenderer, data?.value, option.animation?.show, option.animation?.duration]);
    return preValueRenderRef.current;
};
```

> ⚠️ `useMemo([])` 依赖为空 → `valueRenderer` 只在 mount 时创建一次。如需重置请用 `dispose()`。

### 4.4 维护检查清单

- [ ] 不要在组件外手动调 `TWEEN.update()`，模块级 RAF 循环已处理
- [ ] 修改字符级样式需同步 `valueStyles` 列表
- [ ] `enableRemoveEndZero` 仅在 `precision > 0` 时生效

## 5. 根容器 `RootStyled.tsx`

### 5.1 styled-components 注入

```typescript
export const RootStyled = styled.div<any>`
    .oss-ui-statistic-content {
        .oss-ui-statistic-content-prefix {
            display: ${(props) => (props.prefixVisible ? 'inline-block' : 'none')};
        }
    }

    .wrapper-number {
        &.group-separator-char {
            margin-left: ${(props) => props.groupSeparatorStyle.marginLeft}px;
            margin-right: ${(props) => props.groupSeparatorStyle.marginRight}px;
        }
        .single-char-token {
            ${cssGradientTransform}    // 渐变文字
        }
        &.wrapper-real-number {
            ${cssTransformSkewNumber}  // 字体倾斜
        }
    }

    .digital-flop-suffix {
        ${cssGradientTransformSuffix}  // 后缀渐变（独立于数字渐变）
    }
`;
```

### 5.2 渐变文字 CSS

```typescript
const cssGradientTransform = (props) => {
    let gradientColor = '';
    if (props.enable && _.isArray(props.gradientColor) && !_.isEmpty(props.gradientColor)) {
        gradientColor = createGradientColorStr(props.gradientColor);
        return `
            background-image: ${props.enable ? gradientColor : 'initial'};
            -webkit-background-clip: text;
            -webkit-text-fill-color: ${props.enable ? 'transparent' : 'initial'};
        `;
    }
    return '';
};
```

> `props.enable` 来自 `index.tsx` 的 `enable` prop（`textGradientColor.show && !isLevel.show`）。

### 5.3 字体倾斜

```typescript
const cssTransformSkewNumber = (props) => {
    const skewDeg = toNumber(props.numberSkew);
    if (skewDeg !== 0) {
        return `
            transform: skew(${skewDeg}deg);
            transform-origin: bottom;
        `;
    }
    return '';
};
```

> `numberSkew` 来自 `config.number.fontSkew`（**隐式字段**！详见 [gotchas.md § 3](./gotchas.md#3-️-隐式字段-enableremoveendzero)）。

### 5.4 维护检查清单

- [ ] 渐变文字依赖 `props.enable` + `props.gradientColor` 都有效
- [ ] 后缀渐变独立配置（`suffixTextGradientColor`），**可与数字渐变不同**
- [ ] 字体倾斜 `transform-origin: bottom`，避免底部抖动

## 6. 前缀/后缀模板

### 6.1 `CompPrefixTpl.tsx`

```typescript
const PrefixTpl = (props: { style, text, trendSetting, tendency, designer }) => {
    const { fontSize = 16, fontWeight = 'normal', fontFamily = 'Microsoft Yahei', color = '', marginRight = 0 } = style;
    return (
        <span className="digital-flop-prefix" style={{ fontSize, fontFamily, fontWeight, color, marginRight }}>
            {trendSetting.trendVisible ? (
                <TrendIcon width={trendSetting.iconWidth} designer={designer} tendency={tendency}
                    iconType={trendSetting.iconSelect} option={trendSetting} />
            ) : null}
            <span className="digital-flop-prefix-text">{text}</span>
        </span>
    );
};
```

#### 6.1.1 `prefixOptionResolve`（核心配置转换）

```typescript
export const prefixOptionResolve = (options) => {
    const text = _.get(options, 'prefix.text');
    const result = {
        text,
        style: {
            color: _.get(options, 'prefix.textStyle.color'),
            fontSize: _.get(options, 'prefix.textStyle.fontSize'),
            fontWeight: _.get(options, 'prefix.textStyle.fontWeight'),
            fontFamily: _.get(options, 'prefix.textStyle.fontFamily'),
        },
        trend: {
            trendVisible: _.get(options, 'trend.show') && _.get(options, 'trend.position', 'left') === 'left',  // ← 只在 left 时显示
            threshold: _.get(options, 'trend.threshold'),
            iconSelect: _.get(options, 'trend.iconSelect'),
            iconWidth: _.get(options, 'trend.iconColorSettings.iconWidth', fontSize),
            iconColorSettings: { up, upIcon, down, downIcon, syncToNumber },
            isLevel: { ...options.current.isLevel, show, itemsSet },
        },
    };
    return result;
};
```

> 💡 `trendVisible` 判断：`trend.show === true && trend.position === 'left'`。后缀类似但 `position === 'right'`。

### 6.2 `CompSuffixTpl.tsx`

与前缀对称，**额外读取 `dataSource?.suffix`**：

```typescript
text={dataSource?.suffix || suffixOption.text}
```

> 渲染时优先用 `dataSource.suffix` 字段（如后端返回"个/人/次"等单位），再用 schema 配置的固定值。

### 6.3 维护检查清单

- [ ] `trend.position` 决定趋势图标在 prefix 还是 suffix
- [ ] 后缀支持 `dataSource.suffix` 动态覆盖
- [ ] `options.current.isLevel` 透传运行时计算的级别色

## 7. 趋势图标 `TrendIcon.tsx`

### 7.1 三种 iconType

```typescript
export const tendencyTypes = ['up', 'down'];
export const trendIcons = ['↑', '+/-', 'custom'];

switch (iconType) {
    case '↑':
        return <Icon type={isDown ? 'ArrowDownOutlined' : 'ArrowUpOutlined'} antdIcon />;
    case '+/-':
        return <Icon type={isDown ? 'MinusOutlined' : 'PlusOutlined'} antdIcon />;
    case 'custom':
        if (!iconImage) return null;
        return <Icon component={() => <Image width={style.iconWidth ?? width} src={getImageUrl(iconImage, designer)} />} />;
    default:
        return null;
}
```

### 7.2 级别覆盖

```typescript
if (option?.isLevel?.show === true) {
    style.color = option?.isLevel?.color;
    style.iconImage = option?.isLevel?.iconImage;
    style.iconWidth = option?.isLevel?.iconWidth;
}
```

> 级别模式**覆盖** `iconColorSettings` 的 up/down 色。

### 7.3 维护检查清单

- [ ] `tendency === null` 时不渲染（`!tendencyTypes.includes(tendency)` 返回 null）
- [ ] `iconType === 'custom'` 但无 `iconImage` 时返回 null（**不显示**）

## 8. 样式 `index.less`

```less
.visual-base-digital-flop {
    position: relative;
    &::after { position: absolute; left: 0; top: 0; width: 100%; height: 100%; content: ''; }
    .wrapper-number {
        color: #fff;
        display: inline-block;
        &.wrapper-real-number {
            background-color: rgb(16, 65, 147);  // 默认背景色（classics 模式默认）
            // ...
        }
    }
}
```

> 根 class 是 `visual-base-digital-flop`（**与 oss-material.json.name 'digital-flop' 不一致**！详见 [gotchas.md § 4](./gotchas.md#4-️-根-class-与物料名不一致)）。

## 9. 常用工具函数

| 函数 | 来源 | 用途 |
|------|------|------|
| `useValueRenderer` | `./components/value-renderer` | TWEEN 动画 hook |
| `prefixOptionResolve` / `suffixOptionResolve` | `./components/Comp*` | 配置转换 |
| `tendencyTypes` / `trendIcons` | `./components/TrendIcon` | 常量 |
| `useLatest` | `@Src/hooks/useLatest` | 保留最新值（用于回调） |
| `createGradientColorStr` | `@Utils` | 渐变色 CSS 字符串 |
| `getImageUrl` | `@Src/utils` | 图片 URL 处理（带 designer 上下文） |
| `thousand` / `uuid` | `@Src/utils` | 千分位 / 唯一 ID |

## 10. 性能要点

| 场景 | 注意事项 |
|------|----------|
| 大量同屏实例 | RAF 循环模块级单例，**只启动 1 次**，所有实例共享 |
| 频繁数据更新 | TWEEN 缓动由 `innerAnimationOption.duration` 控制，默认 1000ms |
| 字符级 DOM 操作 | `value-renderer.tsx` 直接 `appendChild`，**不走 React diff** |
| `valueRender` 每次都新建 TWEEN | 但只有 `preValue !== currentValue` 时才创建 |

## 11. 调试小技巧

### 11.1 查看 TWEEN 当前值

```typescript
// value-renderer.tsx update() 内
console.log('TWEEN update:', o.value, this.currentValue);
```

### 11.2 关闭动画快速调试

```typescript
// index.tsx:148
const valueRenderer = useValueRenderer(
    { value: ... },
    { animation: { show: false, duration: 0 }, ... }
);
```

### 11.3 临时禁用渐变

```typescript
<RootStyled enable={false} ...>
```

## 12. 维护历史

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
