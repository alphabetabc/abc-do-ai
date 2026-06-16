---
title: 常见修改任务
description: circular-progress 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `circular-progress` 最常见的修改需求及对应的代码定位。

## 任务 1：调整圆环颜色

**场景描述**：用户希望调整背景环 / 前景环的颜色或透明度。

涉及：
- 🟦 Schema：[schema.md § 2.2](./schema.md#22-图形chartprops)
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-圆环几何计算-circularresolve)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `chartProps` 调整 `backgroundColor` / `foregroundColor` / `fillOpacity` 默认值
2. 运行时无需改代码，`progess-chart.jsx` 自动消费 `chartProps` 颜色
3. （如改色系）联动调整 `defaultValue.config.chartProps` 保证默认数据美观

## 任务 2：调整圆环粗细 / 大小

**场景描述**：用户希望圆环更细 / 更粗 / 更大 / 更小。

涉及：
- 🟦 Schema：[schema.md § 2.2](./schema.md#22-图形chartprops)
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-圆环几何计算-circularresolve)

**步骤**：

1. `radius`（0~1）控制整体大小比例；`ringWidth`（0~1）控制圆环粗细
2. 在 `schema.ts` 调整 `NumberPicker` 的 `min / max / step`（如需要更细可把 `step` 改为 `0.01`）
3. 默认值修改在 `defaultValue.config.chartProps.radius` / `ringWidth`

## 任务 3：调整翻牌器样式

**场景描述**：用户希望中心数字的字体、颜色、字号、动画时长变化。

涉及：
- 🟦 Schema：[schema.md § 2.3.1](./schema.md#231-数字number)
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-翻牌器-props-转换-digitalflopresolve)
- ⬜ 数据：（无）

**步骤**：

1. 翻牌器样式字段在 `schema.ts` 的 `digitalProps.number` 下
2. 文本样式用 `VisualTextStyle` 聚合组件；普通 / 经典模式用 `flopType` 切换
3. 经典模式下 `backgroundColor` / `backgroundRadius` 才可见（`x-reactions` 控制）
4. ⚠️ 翻牌器是**复用** `digital-flop` 物料，复杂修改需要在 `digital-flop` 那边调整

## 任务 4：调整趋势判断

**场景描述**：用户希望趋势判断逻辑变化（如阈值、图标、颜色）。

涉及：
- 🟦 Schema：[schema.md § 2.3.2](./schema.md#232-趋势trend)
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-翻牌器-props-转换-digitalflopresolve) + 翻牌器内部
- ⬜ 数据：（无）

**步骤**：

1. `threshold` 是临界值（数值大小）
2. `iconSelect` 选择图标（已过滤掉 `custom`）
3. `iconColorSettings.up/down` 分别控制上升 / 下降颜色
4. `syncToNumber` 决定趋势是否影响数字颜色
5. 实际趋势判断逻辑在 `digital-flop` 物料中，本组件只负责传 `digitalProps.trend` 配置

## 任务 5：修改默认数据

**场景描述**：用户首次拖入时，希望展示一个具体的 KPI（如"在线率 99.5%"）。

涉及：
- 🟦 Schema：[schema.md § 4](./schema.md#4-默认值参考)
- ⬜ 组件逻辑：（无）
- 🟩 数据：[data-model.md § 4](./data-model.md#4-默认数据示例)

**步骤**：

修改 `schema.ts` 末尾 `defaultValue.dataConfig.json`：

```typescript
dataConfig: {
    json: { percent: 99.5, unit: '%', title: '在线率' },
    // ...
},
```

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

## 任务 6：调整标题样式 / 隐藏

**场景描述**：用户希望标题字体更大 / 更小 / 隐藏。

涉及：
- 🟦 Schema：[schema.md § 2.4](./schema.md#24-标题titleprops)
- 🟨 组件逻辑：[component-logic.md § 4](./component-logic.md#4-子组件-labeljsx)

**步骤**：

1. 隐藏：`titleProps.visible = false`
2. 改样式：`titleProps.textStyle` 用 `VisualTextStyle` 调整
3. 标题文本从 `data.title` 传入，运行时只读 schema 的 `visible` / `textStyle`

## 任务 7：新增交互事件（如下钻）

**场景描述**：用户希望点击圆环派发参数给其他组件。

涉及：
- 🟦 Schema：当前未启用 `defineInteractionSchema`，需要新增
- 🟨 组件逻辑：[component-logic.md § 2.1](./component-logic.md#21-入口签名) + 渲染根节点绑定 `onClick`
- 🟩 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `fields` 数组新增 `defineInteractionSchema({...})`
2. 在 `index.jsx` 解构 `interaction`，在根 div 上加 `onClick={() => interaction.dispatch(...)}`
3. 派发的数据从 `dataSource[0]` 读取（`id / title / percent / unit`）

> ⚠️ 本任务会引入"交互面板"功能，是破坏性变更，需回归验证。

## 任务 8：新增字段到 dataModel

**场景描述**：用户希望支持一个新的数据字段（如"目标值" `target`）。

涉及：
- 🟦 Schema：（如需面板）在 `digitalProps` 添加对应字段
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-数据形态适配) + 各 Resolve 函数
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标)

**步骤**：

1. 在 `dataModel.json` 的 `indicators` 数组添加 `{ fieldName: 'target', fieldLabel: '目标值', dataType: 'String' }`
2. 在 `index.jsx` 第 107-111 行的数据映射中加上 `target: obj.target`（数组模式）
3. 决定 `target` 在 UI 的用途（如对比线、辅助文本等），修改对应 Resolve 函数
4. 在 `schema.ts` 添加用户可配字段（如需）

## 任务 9：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.{xxx}`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

### 9.1 调整尺寸默认值

```typescript
config: {
    width: 400,
    height: 250,
    // ...
}
```

### 9.2 调整图形默认值

```typescript
config: {
    chartProps: {
        isGradient: true,
        radius: 1,
        ringWidth: 0.2,
        // ...
    },
    // ...
}
```

### 9.3 调整标题默认值

```typescript
config: {
    titleProps: {
        visible: true,
        textStyle: { /* ... */ },
    },
}
```

### 9.4 调整默认数据

```typescript
dataConfig: {
    json: { percent: 98, unit: '%', title: 'vEPC附着成功率' },
    // ...
}
```

## 任务 10：迁移到数组模式（修复字段映射 bug）

**场景描述**：用户希望真正使用数组模式驱动多个数据。

涉及：
- 🟦 Schema：（无）
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-数据形态适配)
- 🟩 数据：[data-model.md § 4.1](./data-model.md#41-数组形态示例-来自-docreadmemd)

**步骤**：

1. 修改 `index.jsx` 第 107-111 行的字段映射：
    ```javascript
    data = {
        percent: obj.percent,  // 原: obj.value
        unit: obj.unit,
        title: obj.title,     // 原: obj.name
    };
    ```
2. 验证对象模式不受影响（`data = propsData` 路径）

> 详细背景见 [gotchas.md § 1](./gotchas.md#1-数据-数组模式字段名不一致)。
