---
title: 组件逻辑维护
description: circular-progress 组件代码（index.jsx + 子组件）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `circular-progress` 组件代码（`index.jsx` + 子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
circular-progress/
├── index.jsx                      # 主组件入口
├── index.less                     # 样式
├── schema.ts                      # 配置面板（→ schema.md）
├── dataModel.json                 # 数据契约（→ data-model.md）
├── oss-material.json              # 物料元信息
└── components/
    ├── label.jsx                  # 标题子组件
    └── progess-chart.jsx          # SVG 圆环渲染子组件
```

## 2. 主组件 `index.jsx`

### 2.1 入口签名

```javascript
const CircularProgressChart = React.memo((props) => {
    const { config, dataSource: propsData, designer } = props;
    const { width, height, digitalProps, chartProps, titleProps } = config;
    // ...
});
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（含 chartProps / digitalProps / titleProps） |
| `dataSource` | array \| object | dataConfig | 数据（兼容数组与单对象，详见 § 2.2.1） |
| `designer` | object | 框架 | 设计器上下文，透传给 `DigitalFlop` |

### 2.2 关键逻辑

#### 2.2.1 数据形态适配

```javascript
let data = {};
if (_.isArray(propsData)) {
    const obj = propsData[0] || {};
    data = {
        percent: obj.value,        // ⚠️ 见 gotchas § 1
        unit: obj.unit,
        title: obj.name,           // ⚠️ 见 gotchas § 1
    };
} else {
    data = propsData;              // 直接复用对象形态
}
```

**注意**：
- 数组模式：取 `propsData[0]`，并显式转换为 `{ percent, unit, title }` 结构
- 对象模式：直接使用（依赖数据源返回的就是该结构）
- 数组模式存在**字段名不一致**问题（详见 gotchas.md § 1）

#### 2.2.2 圆环几何计算 `circularResolve`

```javascript
const circularResolve = ({ width: chartWidth, height, data, chartProps: chart, titleProps: title }) => {
    // 1. 计算可用高度（标题占用部分）
    const chartHeight = title?.visible ? height - title.textStyle.fontSize * 2 : height;

    // 2. 起点位置转旋转角度
    let rotateDegrees;
    switch (chart.startPosition) {
        case 'bottom': rotateDegrees = 0; break;
        case 'left':   rotateDegrees = 90; break;
        case 'right':  rotateDegrees = -90; break;
        default:       rotateDegrees = 180; break;  // 'top' 或其他
    }

    // 3. 计算半径（短边为基准）
    const minSize = Math.min(chartWidth, chartHeight);
    const radius = (0 < chart.radius && chart.radius < 1)
        ? (minSize / 2 - chart.padding) * chart.radius
        : minSize / 2 - chart.padding;

    // 4. 内/外半径
    const innerRadius = radius - chart.ringWidth * radius;
    const outerRadius = radius;

    // 5. 起点标识小圆点
    if (chart.circular) {
        circule.circlePointRadius = (chart.ringWidth * radius) / 2;
    }

    // 6. d3.arc() 生成 path
    circule.backgroundRing = d3Arc()({ innerRadius, outerRadius, startAngle: 0, endAngle: Math.PI * 2 });
    circule.froegroundRing = d3Arc()({ innerRadius, outerRadius, startAngle: 0, endAngle: Math.PI });

    // 7. 前景环旋转角度（百分比 + 起点偏移）
    circule.rotateAngle = (360 / 100) * data.percent + rotateDegrees;

    return circule;
};
```

**关键参数说明**：

| 输出 | 含义 | 传递给 |
| --- | --- | --- |
| `circularProps.width / .height` | SVG 宽高 | `ProgessChart` |
| `circularProps.backgroundRing` | 背景环 d3 path | `ProgessChart` `<path d=...>` |
| `circularProps.froegroundRing` | 前景环半圆 d3 path | `ProgessChart` |
| `circularProps.rotateAngle` | 前景环旋转角度（=百分比×3.6+起点偏移） | `ProgessChart` `<g transform="rotate(...)">` |
| `circularProps.circlePointRadius` | 起点标识圆点半径（仅当 `circular=true`） | `ProgessChart` `<circle r=...>` |
| `circularProps.isGradient` | 是否渐变 | `ProgessChart` 决定 `fill` 颜色 |

> ⚠️ 注意：前景环 `endAngle` 硬编码为 `Math.PI`（半圆），旋转是通过 `<g transform="rotate()">` 实现，不是 d3 端的角度参数。

#### 2.2.3 翻牌器 props 转换 `digitalFlopResolve`

```javascript
const digitalFlopResolve = (data, digitalProps) => {
    const itemDigitalProps = digitalProps;
    if (data?.unit) {
        itemDigitalProps['suffix']['text'] = data?.unit;  // ⚠️ 副作用：直接修改 config 对象
    }
    return {
        config: { ...itemDigitalProps },
        dataSource: { value: data?.percent ? data?.percent : 0 },
    };
};
```

**注意**：
- ⚠️ **直接修改 `digitalProps.suffix.text`**：会导致 `config` 对象被污染（详细见 gotchas.md § 2）
- `dataSource.value` 直接取自 `data.percent`（对象模式下）
- 数组模式下，由于 gotchas § 1 的字段名不匹配问题，`value` 会变成 `undefined` → 默认 0

#### 2.2.4 渲染结构

```jsx
<div className="ring-percent-container">
    {/* 翻牌器层（绝对定位，居中显示） */}
    <div
        className="digital-flop-container"
        style={{ height: `${circularProps.height}px` }}
    >
        <DigitalFlop {...digitalFlopProps} designer={designer} />
    </div>

    {/* SVG 圆环层 */}
    <ProgessChart uid={_.uniqueId('process-chart-')} chartProps={chartProps} circularProps={circularProps} />

    {/* 标题层（仅当 visible） */}
    <Title {...titleProps} text={data.title} />
</div>
```

**层级说明**：
- 三层全部用 `position: absolute` 叠加（除 `digital-flop-container` 是 absolute + full-width）
- `designer` 透传给 `DigitalFlop`，确保编辑模式下选中态正常

### 2.3 维护检查清单

- [ ] 修改 `circularResolve` 后，回归验证 `isGradient / circular / startPosition / padding / radius` 的所有组合
- [ ] 修改 `digitalFlopResolve` 时注意 **直接修改 digitalProps** 的副作用
- [ ] 数组模式与对象模式数据均要测试
- [ ] 标题 / 翻牌器 / 圆环三者 z-index 默认未指定，需要时在 `index.less` 调整

## 3. 子组件 `progess-chart.jsx`

### 3.1 职责

渲染 SVG 圆环（背景环 + 前景环 + 起点标识圆点 + 渐变定义）。

### 3.2 关键 props

| prop | 类型 | 来源 | 说明 |
| --- | --- | --- | --- |
| `circularProps` | object | `index.jsx circularResolve()` | 圆环几何参数（见 § 2.2.2 表） |
| `chartProps` | object | schema `config.chartProps` | 用户配置（颜色 / 透明度 / 渐变） |
| `uid` | string | `_.uniqueId('process-chart-')` | 渐变 `linearGradient` 的唯一 id（避免同页多实例 id 冲突） |

### 3.3 渲染层级

```
<svg>
  <defs>
    <linearGradient id={uid}>        // 仅定义占位
      <stop offset="0%" />
      <stop offset="100%" />
    </linearGradient>
  </defs>
  <g transform="translate(centerX centerY)" opacity={fillOpacity}>
    <path d={backgroundRing} fill={backgroundColor} />      // 背景环
    <g className="indicator-point-group" transform="rotate(rotateAngle 0 0)">
      <path d={froegroundRing} fill={isGradient ? `url(#${uid})` : foregroundColor} />  // 前景环
      {circularPointRadius && <circle cx="0" cy={circleY} r={pointRadius} fill={foregroundColor} />}  // 起点标识
    </g>
  </g>
</svg>
```

### 3.4 维护检查清单

- [ ] 修改渐变方向时同时检查 `x1/y1/x2/y2` 四个属性
- [ ] 修改 `circleY` 公式 `(innerRadius + outerRadius) / 2` 时，要确认圆点落在前景环中心
- [ ] `uid` 必须保持唯一性（`_.uniqueId` 天然保证）

## 4. 子组件 `label.jsx`

### 4.1 职责

渲染标题文本。仅当 `visible=true` 时显示。

### 4.2 关键 props

| prop | 类型 | 来源 | 说明 |
| --- | --- | --- | --- |
| `visible` | boolean | schema `titleProps.visible` | 是否显示 |
| `text` | string | `data.title` | 标题文本 |
| `textStyle` | object | schema `titleProps.textStyle` | 文本样式（透传给 style） |
| `fontColor` | string | (历史字段) | 当前未使用 |

> ⚠️ `fontColor` 是历史遗留 prop，组件中并未消费（详见 gotchas.md § 3）。

### 4.3 渲染

```jsx
return visible
    ? <div style={{ ...(style.textStyle || {}), textAlign: 'center' }}>{text}</div>
    : <></>;
```

**注意**：
- 强制 `textAlign: 'center'` 覆盖 `textStyle.textAlign`
- 当 `visible=false` 时返回空 Fragment，不占空间

## 5. 样式 `index.less`

### 5.1 命名规范

```less
.ring-percent-container {  // 根 class（与 oss-material.json.name 不一致！）
    .digital-flop-container { ... }
    .circular-svg-content { ... }
    .circular-title { ... }
}
```

### 5.2 关键样式

```less
.ring-percent-container {
    position: relative;       // 容器相对定位
    width: 100%;
    height: 100%;

    .digital-flop-container {
        position: absolute;   // 翻牌器层绝对定位
        top: 0; left: 0;
        width: 100%;
    }

    .circular-svg-content {
        .indicator-point-group {
            transition: transform 100ms linear;  // 起点标识圆点过渡动画
        }
    }

    .circular-title {
        text-align: center;
    }
}
```

### 5.3 维护检查清单

- [ ] 根 class 为 `ring-percent-container`，与 `oss-material.json.name` (`circular-progress`) **不一致**
- [ ] 容器必须 `position: relative` 以支持子元素 absolute
- [ ] 翻牌器 absolute 定位居中显示
- [ ] 修改 `transition` 时长会直接影响百分比变化时的视觉响应

## 6. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 频繁刷新数据 | `React.memo` 包裹可避免 `data` 引用未变时重渲染；但每次 `data` 变化会触发 `circularResolve` 全量重算（d3 path 字符串） |
| 同页多实例 | 渐变 `<linearGradient>` 使用 `_.uniqueId` 避免 id 冲突 |
| 大数据 | 不适用（单组数据，无虚拟化需求） |

## 7. 调试小技巧

### 7.1 临时禁用渐变

```javascript
circule.isGradient = false;  // 强制使用纯色前景
```

### 7.2 临时禁用圆环背景

```javascript
// 在 progess-chart.jsx 中注释掉背景 path
// {circularProps.backgroundRing && (<path ... />)}
```

### 7.3 临时打印计算结果

```javascript
console.log('circularProps', circularProps);
console.log('data', data);
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 文档化 | 首次编写 5+1 文档；标注数组模式字段不一致问题（详见 gotchas.md § 1） |
