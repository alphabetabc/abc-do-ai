---
title: 常见修改任务
description: free-layout-indicators-viewer 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-15
---

# 常见修改任务

本文档列出针对 `free-layout-indicators-viewer` 最常见的修改需求及对应的代码定位。

## 任务 1：新增布局配置项（如旋转角度、缩放）

**场景描述**：希望整个布局支持旋转或缩放。

涉及：

- 🟦 Schema：[schema.md § 2.1](./schema.md#21-布局配置-layout)
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-渲染结构)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `layout` 下添加：
   ```typescript
   rotate: {
       type: 'number',
       title: '整体旋转角度',
       'x-component': 'NumberPicker',
       'x-decorator': 'FormItem',
       'x-component-props': { min: -180, max: 180 },
   },
   scale: {
       type: 'number',
       title: '整体缩放',
       'x-component': 'NumberPicker',
       'x-decorator': 'FormItem',
       'x-component-props': { min: 0.1, max: 5, step: 0.1 },
   },
   ```
2. 在 `index.tsx` 的根 section 上应用：
   ```typescript
   <section className="free-layout-indicators-viewer" style={{
       backgroundImage: `url(${rootBackgroundImage})`,
       transform: `rotate(${config.layout.rotate ?? 0}deg) scale(${config.layout.scale ?? 1})`,
       transformOrigin: 'center',
   }}>
   ```

## 任务 2：调整默认背景图

**场景描述**：替换 `default-bg.png` 为新设计图。

涉及：

- 🟨 组件逻辑：（仅资源替换）
- ⬜ Schema / Data：（无）

**步骤**：

1. 替换 `public/static/images/free-layout-indicators-viewer/default-bg.png` 为新图
2. 确保文件名仍为 `default-bg.png`（或在 `index.tsx` 改默认文件名）
3. 跑 `pnpm run build:single-material free-layout-indicators-viewer` 确认产物包含新图

> ⚠️ **不要重命名目录** `free-layout-indicators-viewer`（与 `oss-material.json.name` 绑定）。

## 任务 3：新增指标分组/类型

**场景描述**：希望"指标值"分两行显示（如主数值 + 副数值）。

涉及：

- 🟦 Schema：[schema.md § 2.2](./schema.md#22-指标值-indicatorvaluesetting) — 复制一份做"副指标值"
- 🟨 组件逻辑：[component-logic.md § 3](./component-logic.md#3-单指标渲染器-inditemtsx) — IndItem 加新 prop
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标) — 加新字段

**步骤**：

1. **dataModel**：加 `subIndicatorValue` 字段
2. **schema**：复制 `indicatorValueSetting` 改名为 `subIndicatorValueSetting`，放到同一分组
3. **IndItem**：新增 `subIndicatorValueSetting` prop，渲染第二个 `StyledValueLinearGradient`
4. **index.tsx**：透传 prop
5. **defaultValue**：加默认数据 + 默认样式

## 任务 4：启用交互面板（下钻）

**场景描述**：希望点击某个指标跳转到详情页。

涉及：

- 🟦 Schema：[schema.md § 4](./schema.md#4-交互面板) — 取消注释
- 🟨 组件逻辑：[component-logic.md § 3.4](./component-logic.md#34-维护检查清单) — 实现 `ind-item-event-ui` 事件
- ⬜ 数据：（无）

**步骤**：

1. **schema.ts**：取消 `defineInteractionSchema` 注释，配置点击事件
2. **IndItem.tsx**：给 `ind-item-event-ui` 容器加 `onClick`：
   ```typescript
   <div
       className="ind-item-event-ui"
       style={{ width: ..., height: ... }}
       onClick={() => onItemClick?.(dataItem)}
   />
   ```
3. **index.tsx**：透传 `interaction` props 到 IndItem
4. **IndItem**：实现 `onItemClick`，调用 `interaction.dispatch`

## 任务 5：调整 `filterKey` 匹配规则（如支持 indicatorType）

**场景描述**：希望按 `indicatorType` 字段匹配个性化背景。

涉及：

- 🟦 Schema：[schema.md § 2.5](./schema.md#25-指标个性配置-indicatoritemsetting) — 加 type 字段
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-坐标点匹配-points) — 改匹配函数
- 🟩 数据：（已有 `indicatorType`）

**步骤**：

1. 在 `indicatorItemSetting` 的每项加 `matchType: 'id' | 'type'` 字段
2. 改匹配函数：
   ```typescript
   bgSetting = config.indicatorItemSetting.find((item) => {
       if (_.isNil(item.filterKey)) return false;
       const matchKey = item.matchType === 'type' ? dataItem.indicatorType : dataItem.indicatorId;
       return item.filterKey.split(',').includes(matchKey);
   });
   ```

## 任务 6：性能优化（>50 个点）

**场景描述**：点很多时 `find` 操作慢。

涉及：

- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-坐标点匹配-points)

**步骤**：

1. 用 Map 优化 dataSource 查找：
   ```typescript
   const dataMap = useMemo(() => {
       return new Map(dataSource.map((item) => [item.indicatorId, item]));
   }, [dataSource]);

   // 替换
   // const dataItem = dataSource.find((item) => item.indicatorId === point.id);
   // 为
   const dataItem = dataMap.get(point.id);
   ```
2. 同样优化 `indicatorItemSetting` 匹配

## 任务 7：调整指标数字组件（替换为 TWEEN 动画）

**场景描述**：希望数字也能"翻牌"动画。

涉及：

- 🟦 Schema：（无需改）
- 🟨 组件逻辑：[component-logic.md § 3.1](./component-logic.md#31-渲染结构) — 替换 `DigitalNumber`

**步骤**：

1. 在 IndItem 中改用 `digital-flop` 物料的 `useValueRenderer`（或 `DigitalNumber` 的翻牌版）
2. 注意：`free-layout-indicators-viewer` 的 `DigitalNumber` 不带 TWEEN 动画

> ⚠️ `DigitalNumber` 来自 `@Src/components/digital-number`，是**通用数字组件**，不带动画。带动画需用 `digital-flop` 的 `useValueRenderer`。
