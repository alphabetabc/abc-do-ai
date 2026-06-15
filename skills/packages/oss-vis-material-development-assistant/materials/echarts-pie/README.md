---
title: echarts-pie
description: 饼环图（ECharts 饼图/环图/玫瑰图）— 图形/图例/标签/引导线/悬浮提示全配置 + 下钻交互
version: 1.0.0
last_updated: 2026-06-15
---

# echarts-pie

## 1. 概述

**名称**：饼环图(echarts)

**用途**：基于 ECharts 的饼图组件，支持**饼图/环图/玫瑰图**三种形态。支持图形配置（中心坐标、内外半径、起始角度、最小角度）、自定义填充色、图例（普通/滚动）、标签（位置/对齐/文本样式）、标签引导线、悬浮提示，以及单击下钻交互。

**所属分类**：图表（ECharts）

**复杂度**：中

### 1.1 文件入口

| 文件                | 作用                                        |
| ------------------- | ------------------------------------------- |
| `index.jsx`         | 主组件入口（`oss-material.json.main` 指向） |
| `options.ts`        | ECharts `option` 构造器（核心渲染逻辑）     |
| `schema.ts`         | 配置面板 / 数据面板 / 交互面板              |
| `dataModel.json`    | 数据契约（dimensions + indicators）         |
| `oss-material.json` | 物料元信息                                  |
| `index.less`        | 样式（仅容器宽高 100%）                     |
| `doc/readme.md`     | 用户向文档（设计器侧边栏渲染）              |

### 1.2 核心能力

-   **三种图形形态**：饼图（实心）、环图（空心）、玫瑰图（`roseType: 'radius'`）
-   **图形样式**：中心坐标（百分比）、内外半径（百分比）、起始角度、最小扇区角度
-   **自定义填充色**：开关控制，启用后使用渐变颜色数组
-   **图例**：显示/隐藏、普通/滚动、8 种图标、水平/垂直布局、4 向定位
-   **标签**：外部/内部/中心、引线对齐/文字对齐、数值及单位样式、分类名称样式
-   **标签引导线**：显示/隐藏、平滑、两段长度
-   **悬浮提示**：标题、背景色、边框色/粗细、标签文本样式
-   **下钻交互**：单击派发 `id/name/value` + 弹出 Modal / Drawer

### 1.3 适用场景

-   分类占比展示（故障原因分布、业务类型占比）
-   大屏可视化、运维监控、数据报表
-   需要环图空心区域展示额外信息的场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 6 个 FormCollapse 分组（图形 / 图例 / 标签 / 标签引导线 / 悬浮提示）+ 数据面板 + 交互面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.jsx` 入口与点击事件、`options.ts` option 构造、`shouldSetOption` 性能优化 |
| **数据格式** | [data-model.md](./data-model.md) | 1 维度 + 4 指标、`value` 排序规则、`id` 字段用于交互派发 |

## 3. Schema 结构（摘要）

-   **配置面板**（`config`）：5 个 FormCollapse 分组（图形 / 图例 / 标签 / 标签引导线 / 悬浮提示），使用 `x-reactions` 控制显隐
-   **数据面板**（`dataConfig`）：`DynamicData` 组件，展开 `dataModel.json` 的 `header.dimensions + header.indicators`
-   **交互面板**（`interactions`）：单击事件 → 派发参数（`onClickId/Name/Value`）+ 下钻（`Modal`/`Drawer`）

## 4. 组件逻辑（摘要）

-   **`index.jsx`**：接 `config / dataSource / interaction`，用 `useMemo` 计算 `option`，外层包 `DataStatus` 错误态
-   **点击事件**：`onItemClick` 同时支持"派发参数"（`onClickId/Name/Value` 字段映射）和"弹窗"（Modal/Drawer 通过 `interaction.dispatch({ fieldName: 'clickEvent' })`）
-   **性能**：`shouldSetOption` 自定义比较器（处理 `isFunction` 的 `toString()` 对比）

## 5. 数据格式（摘要）

-   **dimensions**：`dimension_name`（分类名称，即饼图扇区名）
-   **indicators**：`value`（数值）、`unit`（单位）、`name`（标题）、`id`（指标 ID，用于交互派发）
-   **排序**：数据按 `value` 升序排列后传入 ECharts

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

-   任务 1：新增配置项（如图形描边、动画）
-   任务 2：调整默认颜色 / 默认尺寸
-   任务 3：修改排序逻辑

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
