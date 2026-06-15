---
title: 组件逻辑维护
description: echarts-bar 组件代码（index.tsx + options.ts）的维护要点
version: 1.0.0
last_updated: 2026-06-15
---

# 组件逻辑维护

本文档说明 `echarts-bar` 组件代码（`index.tsx` + `options.ts`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
echarts-bar/
├── index.tsx              # 主组件（✅ 实际加载）
├── index.jsx              # ⚠️ 孤儿文件（详见 gotchas.md § 1）
├── options.ts             # ECharts option 构造器
├── schema.ts              # 配置面板（→ schema.md）
├── dataModel.json         # 数据契约（→ data-model.md）
├── oss-material.json      # 物料元信息（main: "./index.tsx"）
├── index.less             # ⚠️ 空文件
└── doc/
    ├── readme.md          # 用户向文档
    └── CHANGELOG.md
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
import { ReactECharts } from '@fedx-vis/react-echarts';
import { DataStatus } from 'oss-ui';
import { _ as lodash } from 'oss-web-toolkits';
import { getOption } from './options';

const EchartsBar: React.FC<DesignerField> = (props) => {
    const { config, interaction, dataSource: data } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
|-------|------|------|------|
| `config` | object | schema | 用户配置（含 chart/label/grid/legend/tooltip/xAxis/yAxis） |
| `dataSource` | array | dataConfig | 图表数据数组 |
| `interaction` | object | 框架 | `{ defined, dispatch, urlParam }` |
| `designer` | object | 框架 | 设计器上下文（一般未使用） |

### 2.2 关键逻辑

#### 2.2.1 点击事件 `onItemClick`

```typescript
const onItemClick = (chartObj) => {
    const { data } = chartObj;
    const actionsParams = Object.keys(lodash.omit(interaction?.defined || {}, ['configurableEvent'])).filter(Boolean);

    // 1. 派发参数（id/name/value 三个字段名映射）
    if (actionsParams.length > 0 && interaction?.dispatch) {
        interaction.dispatch({
            data: [
                { fieldName: interaction.defined?.onClickId,    state: data.id },
                { fieldName: interaction.defined?.onClickName,  state: data.name ?? chartObj.name },
                { fieldName: interaction.defined?.onClickValue, state: data.value },
            ],
        });
    }

    // 2. 弹窗（Modal/Drawer）
    const clickEvent = interaction?.defined?.configurableEvent?.clickEvent;
    if (clickEvent?.show) {
        if (clickEvent.effect === 'Modal' || clickEvent.effect === 'Drawer') {
            interaction.dispatch({
                data: [
                    { fieldName: 'clickEvent', state: { visible: true, ...data } },
                ],
            });
        }
    }
};
```

> ⚠️ **data.id/name/value 来自哪里？** 来自 `options.ts` 的 series 包装 `data: convertData.map((item) => ({ value: item.indicatorValue, __rawData__: item }))`。
>
> `data.value` 实际是 `indicatorValue` 数值（外层 value），`data.name` 来自 ECharts 默认（dimensionName），`data.id` 来自 `__rawData__.id`（**注意：当前 dataModel 中没有 id 字段，data.id 实际为 undefined**，需要扩展 dataModel 才能真正派发）。

#### 2.2.2 数据有效性判断 `isSuccess`

```typescript
const isSuccess = useMemo(() => {
    if (lodash.isArray(data) && data.length === 0) return true;
    return Boolean(data?.[0]?.indicatorValue);
}, [data]);
```

外层包 `<DataStatus status={isSuccess ? SUCCESS : ERROR}>`，**空数组视为成功，无数据时显示空态**。

#### 2.2.3 option 计算

```typescript
const option = useMemo(() => {
    if (lodash.isArray(data) && data.length > 0) return getOption(config, data);
    return {};
}, [config, data]);
```

空数据返回 `{}`，ECharts 会自动显示"无数据"提示。

#### 2.2.4 性能优化 `shouldSetOption` + `replaceMerge`

```typescript
<ReactECharts
    option={option}
    shouldSetOption={(prev, current) => {
        return !lodash.isEqualWith(prev.option, current.option, (v1: any, v2: any) => {
            if (lodash.isFunction(v1) && lodash.isFunction(v2)) {
                return v1.toString() === v2.toString();
            }
            return false;
        });
    }}
    onEvents={{ click: onItemClick }}
    style={{ width: config.width || 400, height: config.height || 400 }}
    className="echarts-bar-wrapper"
    replaceMerge={['series']}
/>
```

| 优化点 | 作用 |
|--------|------|
| `shouldSetOption` | 自定义深比较，处理 `formatter` 等函数属性（`toString()` 对比） |
| `replaceMerge: ['series']` | 替换 series 时**不重置整个 chart 实例**，保留交互/选中态 |

### 2.3 维护检查清单

- [ ] 不要修改 `index.jsx`（孤儿文件）！
- [ ] 修改 option 字段时同步 `options.ts` 的读取路径
- [ ] 新增事件需同时在 `onEvents` 注册
- [ ] 调整样式在 `index.less` 写，但**当前 less 为空**，所有样式都在 `options.ts` 内联

## 3. `options.ts`：ECharts option 构造器

### 3.1 入口签名

```typescript
export const getOption = (config, data) => { ... }
```

| 参数 | 来源 | 说明 |
|------|------|------|
| `config` | props.config | 配置面板的所有字段 |
| `data` | props.dataSource | 数据数组 |

### 3.2 关键逻辑

#### 3.2.1 颜色来源

```typescript
const colors = chart.customColors && _.isArray(chart.color) && chart.color.length > 0
    ? chart.color
    : DEFAULT_COLORS; // 来自 @Common/constants
```

`customColors = false` 时**强制使用 `DEFAULT_COLORS`**，用户配置被忽略。

#### 3.2.2 标签处理 `getSeriesLabel`

```typescript
const isOutsideLabel = label.position === 'outside';
const getSeriesLabel = (currentIndex) => {
    const seriesLabelShow = isOutsideLabel ? false : label.show;
    if (seriesLabelShow) {
        const myLabel = { show: true, position: label.position };
        if (label.colorInherit) {
            chart.customColors
                ? Object.assign(myLabel, { color: chart.color[currentIndex].colorStops[0].color })
                : Object.assign(myLabel, { color: 'inherit' });
        } else {
            Object.assign(myLabel, { color: label.textStyle.color });
        }
        return myLabel;
    }
    return { show: false };
};
```

⚠️ **`isOutsideLabel` 时 series 内的 `label.show` 强制为 false**，标签改为通过额外添加的 Y 轴显示（见下文）。

#### 3.2.3 outside 模式的双 Y 轴

```typescript
if (isOutsideLabel) {
    yAxis.push({
        ...yAxisItem,         // type: 'category', gridIndex: 0, position: 'right', axisTick/Line hidden
        axisLabel: getyAxisLabel(index),
        data: convertData.map((item) => item.indicatorValue),
    });
}
```

`position === 'right'` 是 ECharts 的内置能力，配合 `yAxis` 数组实现"外部标签"效果。

#### 3.2.4 图形背景 `showBackground` + `borderRadius`

```typescript
const seriesItem = {
    type: 'bar',
    showBackground: chart.showBackground,
    itemStyle: { borderRadius },
    zlevel: 2,
    barMaxWidth: chart.barMaxWidth,
};
if (chart.showBackground) {
    Object.assign(seriesItem, {
        backgroundStyle: { color: chart.backgroundColor, borderRadius },
    });
}
```

ECharts 5.x 原生 `showBackground` API，**背景色和图形圆角需手动同步**（已处理）。

#### 3.2.5 图案填充 `showBarDecal`

```typescript
if (showBarDecal) {
    const rotationDegrees = _.get(chart, 'barDecalSetting.rotation') ?? -45;
    Object.assign(seriesItem.itemStyle, {
        decal: {
            symbolSize: 0.5,
            dashArrayX: (_.get(chart, 'barDecalSetting.dashArrayX', '') || '1,1').split(',').map((d) => _.toNumber(d)),
            dashArrayY: (_.get(chart, 'barDecalSetting.dashArrayY', '') || '4,3').split(',').map((d) => _.toNumber(d)),
            rotation: (rotationDegrees * Math.PI) / 180,  // 度 → 弧度
        },
    });
}
```

⚠️ `dashArrayX/Y` 是字符串（`'1,1'`），需 `.split(',')` 转 number 数组。`rotation` 是**度数**，需 `* Math.PI / 180` 转弧度（**别忘了**）。

#### 3.2.6 多系列 vs 单系列

```typescript
if (data[0].compareType) {
    // 多系列：按 compareType 分组
    const convertDatas = _.groupBy(data, 'compareType');
    _.forEach(Object.keys(convertDatas), (seriesName, index) => {
        const convertData = convertDatas[seriesName];
        series.push({
            name: seriesName,
            label: getSeriesLabel(index),
            data: convertData.map((item) => ({ value: item.indicatorValue, __rawData__: item })),
            ...seriesItem,
        });
        if (isOutsideLabel) {
            yAxis.push({...yAxisItem, axisLabel: getyAxisLabel(index), data: convertData.map((item) => item.indicatorValue)});
        }
    });
} else {
    // 单系列
    series.push({
        ...seriesItem,
        label: getSeriesLabel(0),
        data: data.map((item) => ({ value: item.indicatorValue, __rawData__: item })),
    });
}
```

⚠️ **分支判断依据是 `data[0].compareType`**，只要第一行有该字段就走多系列。`__rawData__` 用于在点击事件中拿原始数据。

#### 3.2.7 Y 轴数据来源

```typescript
data: _.uniq(data.map((item) => item.dimensionName)),
```

Y 轴类目来自 `dimensionName` 去重。**注意 Y 轴是 `inverse: true`**（横向条形图默认底部到顶部，但 ECharts 默认是顶部到底部，加 `inverse: true` 让顺序正常）。

### 3.3 维护检查清单

- [ ] 渐变填充色数组**至少需要 1 个色**，否则 `chart.color[currentIndex]` 会报错
- [ ] 修改 `borderRadius` 时同步 `backgroundStyle.borderRadius`
- [ ] 修改 `label.position` 时检查 `getSeriesLabel` 和 `getyAxisLabel` 的耦合
- [ ] `decal.rotation` 一定要转弧度

## 4. 样式 `index.less`

⚠️ **当前 `index.less` 是空文件**，所有样式由 ECharts option 内联控制。

如需调整：
- **图表容器尺寸** → `config.width/height`
- **内部样式** → `options.ts` 各分组
- **外层包装** → 在 `index.tsx` 加 className + 在 `index.less` 写

```typescript
// 建议引入（如需）
import './index.less';
// 当前已注释
```

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
|------|------|------|
| `getOption(config, data)` | `./options` | 构造 ECharts option |
| `DEFAULT_COLORS` | `@Common/constants` | 默认颜色调色板 |
| `lodash.omit` / `lodash.isEqualWith` / `lodash.isFunction` / `lodash.toNumber` | `oss-web-toolkits` | 函数比较、对象过滤 |
| `DataStatus.STATUS` | `oss-ui` | 错误态判断 |

## 6. 性能要点

| 场景 | 注意事项 |
|------|----------|
| 大量数据（>1000 行） | ECharts 原生支持；`replaceMerge: ['series']` 避免全量重渲染 |
| 频繁更新 config | `shouldSetOption` 自定义比较器会先对比，避免无意义 `setOption` |
| formatter 函数 | `shouldSetOption` 通过 `toString()` 对比函数，**函数体内容变化时会被识别为不同** |
| 动画 | ECharts 默认开启；如需关闭可设 `option.animation = false` |

## 7. 调试小技巧

### 7.1 查看完整 option

```typescript
// options.ts 末尾
// console.log(option, 'echarts-bar-options---------------------');
// 已注释的调试代码，取消注释即可在控制台查看
```

### 7.2 临时禁用 shouldSetOption

```typescript
<ReactECharts option={option} /* 暂时移除 shouldSetOption 强制每次 setOption */ />
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
