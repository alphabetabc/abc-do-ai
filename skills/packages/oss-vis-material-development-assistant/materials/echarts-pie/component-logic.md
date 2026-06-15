---
title: 组件逻辑维护
description: echarts-pie 组件代码（index.jsx + options.ts）的维护要点
version: 1.0.0
last_updated: 2026-06-15
---

# 组件逻辑维护

本文档说明 `echarts-pie` 组件代码（`index.jsx` + `options.ts`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
echarts-pie/
├── index.jsx        # 主组件（入口）
├── options.ts       # ECharts option 构造器
├── index.less       # 样式（仅容器宽高 100%）
├── schema.ts        # 配置面板（→ schema.md）
├── dataModel.json   # 数据契约（→ data-model.md）
├── oss-material.json# 物料元信息
└── doc/
    ├── README.md    # 用户向文档
    └── CHANGELOG.md # 更新日志
```

## 2. 主组件 `index.jsx`

### 2.1 入口签名

```jsx
const EchartsPie = (props) => {
    const { config, interaction, dataSource: data } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
|-------|------|------|------|
| `config` | object | schema | 用户配置（图形/图例/标签/引导线/悬浮提示） |
| `dataSource` | array | dataConfig | 数据数组，每项含 `name/value/unit/id` |
| `interaction` | object | 框架 | 交互配置（下钻 + 派发参数） |

### 2.2 关键逻辑

#### 2.2.1 数据状态判断

```jsx
const isSuccess = useMemo(() => {
    if (lodash.isArray(data) && data.length === 0) {
        return true; // 空数组视为成功（无数据展示）
    }
    return Boolean(data?.[0]?.value); // 首条有 value 视为有数据
}, [data]);
```

**注意**：空数组 `[]` 被视为 `SUCCESS` 状态（渲染空图表），而非 `ERROR`。只有 `data[0].value` 为 falsy 时才显示错误态。

#### 2.2.2 点击事件派发

```jsx
const onItemClick = (chartObj) => {
    const { data } = chartObj;
    const actionsParams = Object.keys(lodash.omit(interaction?.defined || {}, ['configurableEvent'])).filter(Boolean);
    // 派发参数（onClickId/Name/Value）
    if (actionsParams.length > 0 && interaction?.dispatch) {
        interaction.dispatch({
            data: [
                { fieldName: interaction.defined?.onClickId, state: data.id },
                { fieldName: interaction.defined?.onClickName, state: data.name },
                { fieldName: interaction.defined?.onClickValue, state: data.value },
            ],
        });
    }
    // 弹窗（Modal/Drawer）
    const clickEvent = interaction?.defined?.configurableEvent?.clickEvent;
    if (clickEvent?.show) {
        if (clickEvent.effect === 'Modal' || clickEvent.effect === 'Drawer') {
            interaction.dispatch({
                data: [{ fieldName: 'clickEvent', state: { visible: true, ...data } }],
            });
        }
    }
};
```

**注意**：点击事件同时支持"派发参数"和"弹窗"两种模式。弹窗通过 `interaction.dispatch({ fieldName: 'clickEvent' })` 触发，框架层处理 Modal/Drawer 的渲染。

#### 2.2.3 Option 构造

```jsx
const option = getOption(config, data);
```

详见 [options.ts](#3-option-构造器-optionsts)。

### 2.3 维护检查清单

- [ ] `onItemClick` 中 `interaction?.defined` 读取的是交互面板配置，字段名需与 schema 一致
- [ ] `isSuccess` 判断逻辑：空数组视为成功，首条 `value` 为 0 时视为失败
- [ ] `shouldSetOption` 自定义比较器需处理 `isFunction` 类型

## 3. Option 构造器 `options.ts`

### 3.1 入口签名

```typescript
export const getOption = (config, data) => { ... }
```

### 3.2 关键逻辑

#### 3.2.1 颜色处理

```typescript
color: chart.customColors && _.isArray(chart.color) && chart.color.length > 0
    ? chart.color
    : DEFAULT_COLORS
```

**注意**：`customColors` 开关控制是否使用自定义颜色数组。关闭时回退到 `DEFAULT_COLORS`。

#### 3.2.2 数据排序

```typescript
data: _.isArray(data) && data.length > 0
    ? data.sort((a, b) => a.value - b.value)
    : []
```

**注意**：数据按 `value` 升序排列后传入 ECharts。这意味着饼图扇区从最小到最大排列。

#### 3.2.3 图形配置

```typescript
if (chart.centerX && chart.centerY) {
    newCharts['center'] = [chart.centerX, chart.centerY];
}
if (chart.innerRadius && chart.outerRadius) {
    newCharts['radius'] = [chart.innerRadius, chart.outerRadius];
}
if (chart.roseType) {
    newCharts['roseType'] = 'radius';
}
```

#### 3.2.4 标签配置

```typescript
let defaultLabel = {
    show: false,
    alignTo: 'labelLine',
    formatter: '{name|{b}}\n{percent|{d}%}',
    verticalAlign: 'middle',
    align: 'center',
    color: '#fff',
    rich: {
        name: { fontSize: 16, color: '#999' },
    },
};
option.series[0]['label'] = { ...defaultLabel, ...textStyle, ...others };
```

**注意**：标签使用 `rich` 富文本模式，`{name|{b}}` 显示分类名称，`{percent|{d}%}` 显示百分比。`textStyle`（来自 `VisualTextStyle`）会覆盖 `rich.name` 的样式。

#### 3.2.5 悬浮提示

```typescript
if (name) {
    option.series[0]['name'] = tooltip.name;
}
option['tooltip'] = {
    show: true,
    trigger: 'item',
    ...tooltipOpt,
};
```

**注意**：`tooltip.name` 设置的是 `series[0].name`（即图表标题），而非 tooltip 的 title。

### 3.3 维护检查清单

- [ ] `defaultLabel.formatter` 使用 ECharts 富文本格式，修改时需保持兼容
- [ ] `textStyle` 覆盖 `rich.name` 时需注意只覆盖字号/颜色等样式属性
- [ ] 图例/标签/引导线/悬浮提示的 `show` 开关控制整个子配置的显隐

## 4. 样式 `index.less`

```less
.echarts-pie-wrapper {
    width: 100%;
    height: 100%;
}
```

仅设置容器宽高 100%，无其他样式。

### 4.1 维护检查清单

- [ ] 根 class 为 `echarts-pie-wrapper`（硬编码在 `index.jsx` 的 `className` 中）
- [ ] 容器 `position: relative` 由框架层保证

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
|------|------|------|
| `getOption(config, data)` | `./options` | 构造 ECharts option |
| `lodash.isEqualWith` | `oss-web-toolkits` | 深度比较（用于 `shouldSetOption`） |
| `lodash.omit` | `oss-web-toolkits` | 排除交互面板中的 `configurableEvent` |
| `DEFAULT_COLORS` | `@Common/constants` | 默认颜色数组 |

## 6. 性能要点

| 场景 | 注意事项 |
|------|----------|
| `shouldSetOption` | 使用 `lodash.isEqualWith` 自定义比较，处理 `isFunction` 类型（`toString()` 对比） |
| `useMemo` | `isSuccess` 使用 `useMemo` 缓存计算结果 |
| 数据排序 | 每次渲染都会 `sort` 原数组（`data.sort` 会修改原数组，注意副作用） |

## 7. 调试小技巧

### 7.1 查看最终 option

```jsx
// 在 index.jsx 中临时添加
console.log('option:', option);
```

### 7.2 查看点击事件数据

```jsx
// 在 onItemClick 中取消注释
// console.log('*****************@@@@@@@@@@@@@@@@@@@@@@', chartObj);
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-06-15 | 创建文档 | 首次 5+1 文档化 |
