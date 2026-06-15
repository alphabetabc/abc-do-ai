---
title: echarts-bar
description: 多系列条形图（ECharts 横向条形图）— 多维度 Y 轴 + 多系列 + 图形/标签/坐标轴/图例/悬浮提示全配置
version: 1.0.0
last_updated: 2026-06-15
---

# echarts-bar

## 1. 概述

**名称**：多系列条形图(echarts)

**用途**：基于 ECharts 的**横向条形图**（注意：`yAxis` 为类目轴 `category`，`xAxis` 为数值轴 `value`），支持**多维度 Y 轴** + **多系列**（`compareType` 分组），可配置图形宽度/圆角/填充图案、文本标签、坐标轴、图例、悬浮提示及下钻交互。

**所属分类**：图表（ECharts）

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
|------|------|
| `index.tsx` | **主组件入口**（`oss-material.json.main` 指向） |
| `index.jsx` | ⚠️ **孤儿文件**，不再加载（详见 [gotchas.md § 1](./gotchas.md)） |
| `options.ts` | ECharts `option` 构造器（核心渲染逻辑） |
| `schema.ts` | 配置面板 / 数据面板 / 交互面板 |
| `dataModel.json` | 数据契约（dimensions + indicators） |
| `oss-material.json` | 物料元信息（`main: "./index.tsx"`） |
| `index.less` | ⚠️ 空文件（未引入任何样式） |
| `doc/readme.md` | 用户向文档（设计器侧边栏渲染） |

### 1.2 核心能力

- **多维度 Y 轴**：以 `dimensionName` 字段去重后作为 Y 轴类目
- **多系列**：`compareType` 字段分组，每组生成一个 `series`（无 `compareType` 时退化为单系列）
- **图形样式**：最大宽度、4 向圆角、渐变填充、图案填充（decal）、图形背景色
- **标签**：位置（13 种 ECharts 位置）、颜色继承图形色、内外边距、千分位宽度
- **坐标轴**：X/Y 轴线/标签样式独立配置，X 轴可设最大值
- **图例**：普通/滚动、8 种 icon、4 向定位
- **悬浮提示**：背景/边框色 + 文本样式
- **下钻交互**：单击派发 `id/name/value` + 弹出 Modal / Drawer

### 1.3 适用场景

- 横向多维对比（小区数 / 基站数 / 故障数等多系列同图）
- 大屏可视化、运维监控、指标排名
- 需要"标签同色"+"渐变填充"等定制化样式的场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
|------|------|----------|
| **Schema 维护** | [schema.md](./schema.md) | 7 个 FormCollapse 分组（图形 / 标签 / X轴 / Y轴 / 网格 / 图例 / 悬浮提示）+ 数据面板 + 交互面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.tsx` 入口与点击事件、`options.ts` option 构造、性能优化（`shouldSetOption` + `replaceMerge`） |
| **数据格式** | [data-model.md](./data-model.md) | 2 维度 + 3 指标、`compareType` 分组规则、`__rawData__` 透传 |

## 3. Schema 结构（摘要）

- **配置面板**（`config`）：6 个 FormCollapse 分组（图形样式 / 图形文本标签 / X轴 / Y轴 / 网格 / 图例 / 悬浮提示），使用大量 `x-reactions` 控制显隐
- **数据面板**（`dataConfig`）：`DynamicData` 组件，展开 `dataModel.json` 的 `header.dimensions + header.indicators`
- **交互面板**（`interactions`）：单击事件 → 派发参数（`onClickId/Name/Value`）+ 下钻（`Modal`/`Drawer`）

## 4. 组件逻辑（摘要）

- **`index.tsx`**：接 `config / dataSource / interaction`，用 `useMemo` 计算 `option`，外层包 `DataStatus` 错误态
- **点击事件**：`onItemClick` 同时支持"派发参数"（`onClickId/Name/Value` 字段映射）和"弹窗"（Modal/Drawer 通过 `interaction.dispatch({ fieldName: 'clickEvent' })`）
- **性能**：`shouldSetOption` 自定义比较器（处理 `isFunction` 的 `toString()` 对比），`replaceMerge: ['series']` 仅替换系列而非整个 chart

## 5. 数据格式（摘要）

- **dimensions**：`dimensionName`（Y轴类目，去重）、`compareType`（多系列分组，可选）
- **indicators**：`indicatorId`（联动）、`indicatorValue`（Y轴数据）、`indicatorUnit`（单位）
- **多系列规则**：存在 `compareType` 时按其分组生成 `series`，每组对应一个类目轴

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 任务 1：新增配置项（如图形描边、动画）
- 任务 2：调整多系列分组逻辑（改 `compareType` → `groupBy` 字段）
- 任务 3：调整默认颜色 / 默认尺寸

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

⚠️ **最重要的一条**：`index.jsx` 是孤儿文件，**不要修改**！所有改动只动 `index.tsx` + `options.ts`。
