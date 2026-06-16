---
title: 组件逻辑维护
description: 横向柱形图组件代码（index.tsx + Progress 子组件）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `bidirectional-progress` 组件代码（`index.tsx` + 子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
bidirectional-progress/
├── index.tsx                                # 主组件
├── index.less                               # 主组件样式
├── schema.ts                                # 配置面板（→ schema.md）
├── dataModel.json                           # 数据契约（→ data-model.md）
├── oss-material.json                        # 物料元信息
└── components/
    └── progress/
        ├── index.tsx                        # Progress 子组件
        ├── index.less                       # 子组件样式
        └── ContainerStyle.ts                # 斜线背景 & 边框 styled-components
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const BidirectionalProgress: React.FC<DesignerField> = (props) => {
    const { config, dataSource = {} } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| ----- | ---- | ---- | ---- |
| `config` | object | schema | 用户配置（labelConfig / leftConfig / rightConfig） |
| `dataSource` | array | dataConfig | 数据数组，取 `dataSource[0]` |
| `designer` | object | 框架 | 设计器上下文（当前未使用） |
| `interaction` | object | 框架 | 交互配置（当前未启用） |

### 2.2 关键逻辑

#### 2.2.1 数据解构与百分比计算

```typescript
const { label, leftData, leftUnit, leftMax, rightData, rightUnit, rightMax } = dataSource?.[0] || {};
const { labelConfig, leftConfig, rightConfig } = config || {};
const { labelSize, labelFontStyle } = labelConfig || {};
const { dataMax: leftMaxConfig, ...leftProps } = leftConfig || {};
const { dataMax: rightMaxConfig, ...rightProps } = rightConfig || {};

const leftPercent = (leftData / (leftMax || leftMaxConfig || 100)) * 100;
const rightPercent = (rightData / (rightMax || rightMaxConfig || 100)) * 100;
```

**注意**：
- 数据优先级：`dataSource[0].leftMax` > `config.leftConfig.dataMax` > `100`
- `leftProps` / `rightProps` 是排除 `dataMax` 后的剩余配置，直接透传给 Progress 子组件
- 百分比可能超过 100%，Progress 子组件中有对应处理（→ § 3.2）

#### 2.2.2 Progress props 组装

```typescript
const leftProgressProps = {
    percent: leftPercent,
    ...leftProps,       // 透传所有 leftConfig 配置（除 dataMax）
    value: leftData,
    unit: leftUnit,
    reverse: true,      // 左侧固定反向
};
const rightProgressProps = {
    percent: rightPercent,
    ...rightProps,
    value: rightData,
    unit: rightUnit,
    reverse: false,     // 右侧固定不反向
};
```

**注意**：左侧通过 `reverse: true` 实现反向显示，子组件通过 CSS `transform: scale(-1, 1)` 实现。

#### 2.2.3 渲染结构

```tsx
<section>
    <div className="bidirectional-progress-container">
        <Progress {...leftProgressProps} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...labelSize, ...labelFontStyle }}>
            {label}
        </div>
        <Progress {...rightProgressProps} />
    </div>
</section>
```

渲染层级：
```
section
└── .bidirectional-progress-container (flex)
    ├── Progress (左侧，reverse: true)
    ├── div (中间标题，样式来自 labelSize + labelFontStyle)
    └── Progress (右侧，reverse: false)
```

### 2.3 维护检查清单

- [ ] `dataSource[0]` 解构的字段名与 dataModel.json 的 fieldName 一致（→ data-model.md § 2.2）
- [ ] `leftProps` / `rightProps` 透传了 `leftConfig` / `rightConfig` 的所有字段（除 `dataMax`）
- [ ] 中间标题的样式来自 `labelSize`（宽高）和 `labelFontStyle`（颜色字号等）

## 3. 子组件 `Progress` (`components/progress/index.tsx`)

### 3.1 职责

基于 oss-ui 的 `Progress` 组件封装，实现单侧进度条的渲染。支持渐变色、斜线背景、反向显示、激活动效、边框等视觉效果。

### 3.2 关键 props

| prop | 类型 | 默认值 | 来源 | 说明 |
| ---- | ---- | ------ | ---- | ---- |
| `strokeWidth` | number | 20 | `config.*.strokeWidth` | 柱子宽度 |
| `color1` | string | `'#108ee9'` | `config.*.color1` | 渐变开始颜色 |
| `color2` | string | `'#87d068'` | `config.*.color2` | 渐变结束颜色 |
| `showObliqueLineBg` | boolean | true | `config.*.showObliqueLineBg` | 是否显示斜线背景 |
| `reverse` | boolean | false | 主组件固定传入 | 是否反向显示 |
| `active` | boolean | true | `config.*.active` | 是否开启激活动效 |
| `percent` | number | 100 | 主组件计算 | 进度百分比 |
| `width` | number | 200 | `config.*.width` | 柱子长度（容器宽度） |
| `valueFontStyle` | object | - | `config.*.valueFontStyle` | 值文本样式 |
| `unitFontStyle` | object | - | `config.*.unitFontStyle` | 单位文本样式 |
| `border` | object | - | `config.*.border` | 边框配置 |
| `obliqueLineDirection` | string | - | `config.*.obliqueLineDirection` | 斜线方向（left/right） |
| `obliqueLineColor` | string | - | `config.*.obliqueLineColor` | 斜线颜色 |
| `labelMargin` | number | 0 | `config.*.labelMargin` | 文字与柱子间距 |
| `value` | number/string | - | `dataSource[0].leftData/rightData` | 显示的值 |
| `unit` | string | - | `dataSource[0].leftUnit/rightUnit` | 显示的单位 |

### 3.3 渲染层级

```
ContainerStyle (styled-components，提供斜线背景 & 边框)
└── .single-progress-container
    ├── oss-ui Progress (antd Progress 封装)
    │   └── .oss-ui-progress-bg::after (斜线背景，由 ContainerStyle 生成)
    └── .single-progress-label-container (绝对定位)
        └── div
            ├── span (值文本，style={valueFontStyle})
            └── span (单位文本，style={unitFontStyle})
```

### 3.4 关键逻辑

**斜线背景**：通过 `ContainerStyle`（styled-components）在 `.oss-ui-progress-bg::after` 上生成 `background-image: linear-gradient(...)`。斜线角度根据 `obliqueLineDirection` 计算：`left` → `-45deg`，`right` → `45deg`。反向时角度取反。

**反向显示**：通过 CSS class `reverse-progress` 应用 `transform: scale(-1, 1)`。

**标签定位**：通过 `useEffect` 计算标签位置。当 `percent > 100` 时，使用完整宽度 + `labelMargin` 作为偏移量；否则按比例计算。

**激活动效**：通过 `status={active ? 'active' : 'normal'}` 控制 oss-ui Progress 的动画效果。

### 3.5 维护检查清单

- [ ] `ContainerStyle` 的 props 传递正确（`border`、`obliqueLineDeg`、`obliqueLineColor`）
- [ ] 斜线角度在反向时取反：`reverse ? -obliqueLineDeg : obliqueLineDeg`
- [ ] `reverse-progress` class 与 `oblique-line-bg` class 可共存
- [ ] 标签定位计算考虑了 `percent > 100` 的边界情况

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.bidirectional-progress-container {  // 根 class
    > div {
        flex: 0 0 auto;
    }
}
```

### 4.2 子组件样式 (`components/progress/index.less`)

```less
.single-progress-container {
    display: flex;
    width: 100%;
    position: relative;

    .oss-ui-progress-inner {
        border-radius: 0;       // 直角进度条
        .oss-ui-progress-bg {
            border-radius: 0;   // 直角进度条
        }
    }

    .reverse-progress {
        transform: scale(-1, 1);  // 反向显示
        .oss-ui-progress-text {
            transform: scale(-1, 1);  // 文字再反转回来
        }
    }

    .single-progress-label-container {
        position: absolute;
        height: 100%;
        display: flex;
        align-items: center;
    }
}
```

### 4.3 维护检查清单

- [ ] 根 class `.bidirectional-progress-container` 与 oss-material.json 的 name 一致
- [ ] 容器使用 `display: flex` 实现左右布局
- [ ] 子项使用 `flex: 0 0 auto` 防止伸缩

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
| ---- | ---- | ---- |
| `classNames` | `classnames` | 条件拼接 CSS class |
| `styled` | `styled-components` | 创建 ContainerStyle 动态样式组件 |

## 6. 性能要点

| 场景 | 注意事项 |
| ---- | -------- |
| 标签位置计算 | `useEffect` 依赖 `percent`、`width`、`reverse`、`labelMargin`，变化时重新计算 |
| ContainerStyle | styled-components 动态样式，每次 props 变化会重新生成 CSS |

## 7. 调试小技巧

### 7.1 查看实际配置值

```typescript
// 在 index.tsx 中
console.log('config:', config);
console.log('dataSource:', dataSource);
```

### 7.2 检查斜线背景

```typescript
// 在 Progress 组件中查看 ContainerStyle 生成的样式
console.log(containerRef.current?.querySelector('.oss-ui-progress-bg')?.getComputedStyle?.('background-image'));
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
| ---- | ---- | ---- |
| 2026-06-16 | 初始文档创建 | 物料文档体系建设 |
