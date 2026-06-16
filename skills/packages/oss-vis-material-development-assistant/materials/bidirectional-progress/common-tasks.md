---
title: 常见修改任务
description: 横向柱形图最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `bidirectional-progress` 最常见的修改需求及对应的代码定位。

## 任务 1：修改左右两侧的默认颜色

**场景描述**：业务方希望左右进度条使用不同的默认颜色。

**涉及文件**：
- `packages/bidirectional-progress/schema.ts`：修改 `defaultValue.config.leftConfig.color1/color2` 和 `rightConfig.color1/color2`

**步骤**：

1. 在 `schema.ts` 末尾 `defaultValue.config` 中找到：

```typescript
leftConfig: {
    color1: '#108ee9',
    color2: '#87d068',
    // ...
},
rightConfig: {
    color1: '#108ee9',
    color2: '#87d068',
    // ...
},
```

2. 修改对应的颜色值即可。

> 涉及：🟦 schema.md § 4

## 任务 2：新增一个配置项（如修改斜线密度）

**场景描述**：需要让用户控制斜线背景的密度（目前固定 `background-size: 7px 7px`）。

**涉及文件**：
- `packages/bidirectional-progress/schema.ts`：在 leftConfig/rightConfig 中新增字段
- `packages/bidirectional-progress/components/progress/ContainerStyle.ts`：使用新 props 控制 background-size
- `packages/bidirectional-progress/components/progress/index.tsx`：传递新 props

**步骤**：

1. 在 `schema.ts` 的 leftConfig/rightConfig 中添加字段：

```typescript
obliqueLineSize: {
    type: 'number',
    title: '斜线密度',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    name: 'obliqueLineSize',
    'x-index': 10, // 调整索引
},
```

2. 在 `ContainerStyle.ts` 中接收并使用：

```typescript
background-size: ${(props) => `${props.obliqueLineSize || 7}px ${props.obliqueLineSize || 7}px`};
```

3. 在 `Progress/index.tsx` 中解构并传递 `obliqueLineSize`。

> 涉及：
> - 🟦 Schema：[schema.md § 2.2](./schema.md#22-左侧设置-collapseleftconfig)
> - 🟨 组件逻辑：[component-logic.md § 3.2](./component-logic.md#32-关键-props)

## 任务 3：修改数据字段名

**场景描述**：后端返回的字段名与当前 dataModel 不匹配，需要映射。

**涉及文件**：
- `packages/bidirectional-progress/dataModel.json`：修改 indicators 中的 fieldName
- `packages/bidirectional-progress/index.tsx`：同步修改解构的字段名

**步骤**：

1. 在 `dataModel.json` 中修改对应字段的 `fieldName`：

```json
{
    "fieldName": "newLeftData",  // 原为 leftData
    "fieldLabel": "左侧数据",
    // ...
}
```

2. 在 `index.tsx` 中同步修改解构：

```typescript
const { label, leftData: newLeftData, leftUnit, leftMax, rightData, rightUnit, rightMax } = dataSource?.[0] || {};
// 后续使用 newLeftData
```

> 涉及：
> - 🟩 数据格式：[data-model.md § 2.2](./data-model.md#22-indicators指标)
> - 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-数据解构与百分比计算)

## 任务 4：支持多条数据渲染

**场景描述**：目前仅使用 `dataSource[0]`，需要支持多条数据循环渲染。

**涉及文件**：
- `packages/bidirectional-progress/index.tsx`：改为 map 渲染
- `packages/bidirectional-progress/index.less`：可能需要调整布局

**步骤**：

1. 在 `index.tsx` 中将单条解构改为 map 遍历：

```typescript
{dataSource?.map((item, index) => {
    const { label, leftData, leftUnit, leftMax, rightData, rightUnit, rightMax } = item || {};
    // 计算百分比，渲染 Progress
    return (
        <div key={index} className="bidirectional-progress-container">
            <Progress {...leftProgressProps} />
            <div>...</div>
            <Progress {...rightProgressProps} />
        </div>
    );
})}
```

2. 调整样式使多条数据垂直排列。

> 涉及：
> - 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-渲染结构)
> - 🟩 数据格式：[data-model.md § 3](./data-model.md#3-数据流向)

## 任务 5：修改百分比计算逻辑

**场景描述**：需要改变百分比的计算方式（如使用不同的基准值或计算规则）。

**涉及文件**：
- `packages/bidirectional-progress/index.tsx`：修改百分比计算行

**步骤**：

1. 在 `index.tsx` 中找到：

```typescript
const leftPercent = (leftData / (leftMax || leftMaxConfig || 100)) * 100;
const rightPercent = (rightData / (rightMax || rightMaxConfig || 100)) * 100;
```

2. 按需修改计算逻辑，例如使用固定最大值：

```typescript
const leftPercent = (leftData / 1000) * 100;
```

> 涉及：🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-数据解构与百分比计算)

## 任务 6：调整默认值

**涉及文件**：`packages/bidirectional-progress/schema.ts` 末尾 `defaultValue.config.*`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

常见调整项：
- `width` / `height`：组件整体尺寸
- `leftConfig.width` / `rightConfig.width`：柱子长度
- `leftConfig.strokeWidth` / `rightConfig.strokeWidth`：柱子宽度
- `labelConfig.labelSize`：中间标题区域尺寸
