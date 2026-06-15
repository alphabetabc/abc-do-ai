---
title: 常见修改任务
description: echarts-bar 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-15
---

# 常见修改任务

本文档列出针对 `echarts-bar` 最常见的修改需求及对应的代码定位。

## 任务 1：新增一个图形样式配置项（如描边色 / 阴影）

**场景描述**：需要给条形图加图形描边。

涉及：

- 🟦 Schema：[schema.md § 2.1](./schema.md#21-图形样式-chart)
- 🟨 组件逻辑：[component-logic.md § 3.2.4](./component-logic.md#324-图形背景-showbackground--borderradius)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `chart` 分组下添加：
   ```typescript
   borderColor: {
       type: 'string',
       title: '图形描边色',
       'x-decorator': 'FormItem',
       'x-component': 'ColorPicker',
   },
   ```

2. 在 `options.ts` 的 `seriesItem.itemStyle` 读取：
   ```typescript
   const seriesItem = {
       type: 'bar',
       showBackground: chart.showBackground,
       itemStyle: {
           borderRadius,
           borderColor: chart.borderColor,  // 新增
           borderWidth: chart.borderWidth,  // 配套
       },
       // ...
   };
   ```

3. （可选）在 `defaultValue.config.chart` 加默认值。

## 任务 2：调整多系列分组规则（如按 `groupName` 而非 `compareType`）

**场景描述**：业务方希望多系列字段名从 `compareType` 改为 `groupName`。

涉及：

- 🟦 Schema：（一般无需改动，dataModel 字段名调整由 dataConfig 自动适配）
- 🟨 组件逻辑：[component-logic.md § 3.2.6](./component-logic.md#326-多系列-vs-单系列)
- 🟩 数据：[data-model.md § 2.1](./data-model.md#21-dimensions维度)

**步骤**：

1. 在 `dataModel.json` 的 `dimensions` 数组中**新增** `groupName` 字段（保留 `compareType` 兼容旧数据）
2. 在 `options.ts` 修改分组逻辑：
   ```typescript
   // 原：const convertDatas = _.groupBy(data, 'compareType');
   // 改：
   const groupKey = data[0].groupName ? 'groupName' : 'compareType'; // 兼容
   const convertDatas = _.groupBy(data, groupKey);
   ```
3. 同步修改 `defaultValue.dataConfig.json` 的示例数据

## 任务 3：调整默认颜色 / 默认尺寸

**涉及文件**：

- `schema.ts` 末尾 `defaultValue.config.chart` / `defaultValue.config.{width, height, left, top}`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

```typescript
// 示例：调整默认渐变色
color: [
    {
        global: false,
        type: 'linear',
        x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
            { offset: 0, color: '#008AFF' },
            { offset: 1, color: '#00F6FF' },
        ],
    },
],
```

## 任务 4：新增下钻事件类型（如 `Window` / `WindowSelf`）

**场景描述**：点击条形图需要"打开新浏览器窗口"或"当前窗口打开"，参考 `digital-flop`。

涉及：

- 🟦 Schema：[schema.md § 3.1](./schema.md#31-单击事件-onclickaction)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-点击事件-onitemclick)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `effect` Select 选项中追加：
   ```typescript
   {
       label: '打开新浏览器窗口',
       value: 'Window',
   },
   {
       label: '当前窗口打开',
       value: 'WindowSelf',
   },
   ```
2. 在 `index.tsx` 的 `onItemClick` 中添加：
   ```typescript
   } else if (clickEvent.effect === 'Window') {
       window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`);
   } else if (clickEvent.effect === 'WindowSelf') {
       window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`, '_self');
   }
   ```
3. 给 `Window`/`WindowSelf` 加 `windowSet` schema 块（参考 digital-flop 的实现）

## 任务 5：删除孤儿文件 `index.jsx`

**场景描述**：清理无用文件，避免误改。

涉及：

- 🟨 组件逻辑：（无功能影响，仅清理）

**步骤**：

1. 确认 `oss-material.json.main: "./index.tsx"` 已正确指向
2. 删除 `src/packages/echarts-bar/index.jsx`
3. 跑构建 `pnpm run build` 确认无报错
4. ⚠️ **不要**通过 git 直接删除，先确认是否有其他模块 import 它（`grep -r "echarts-bar" src/` 验证）

## 任务 6：新增交互字段（如派发 `compareType`）

**场景描述**：点击条形图派发"分组维度"以便外部联动。

涉及：

- 🟦 Schema：[schema.md § 3.1.2](./schema.md#312-派发参数)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-点击事件-onitemclick)
- ⬜ 数据：（无需改 dataModel，原始数据可读）

**步骤**：

1. 在 `schema.ts` 的"派发参数"分组加字段：
   ```typescript
   onClickCompareType: {
       title: '元素:compareType',
       type: 'string',
       'x-decorator': 'FormItem',
       'x-component': 'Input',
   },
   ```
2. 在 `index.tsx` 的派发 data 数组加：
   ```typescript
   {
       fieldName: interaction.defined?.onClickCompareType,
       state: data.__rawData__.compareType,
   },
   ```

## 任务 7：性能优化（大数据量）

**场景描述**：> 1000 行数据时图表卡顿。

涉及：

- 🟨 组件逻辑：[component-logic.md § 6](./component-logic.md#6-性能要点)

**步骤**：

1. 在 `options.ts` 关闭 ECharts 动画：`option.animation = false;`
2. 检查 `shouldSetOption` 是否仍然有效（`lodash.isEqualWith` 在大数据量时可能慢）
3. 考虑使用 `dataset` + `large: true`（ECharts 大数据模式）
