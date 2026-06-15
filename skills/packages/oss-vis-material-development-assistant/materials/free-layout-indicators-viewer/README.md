---
title: free-layout-indicators-viewer
description: 自由布局指标查看器 — MonacoEditor 配置坐标点 + styled-components 渐变文字 + 个性化背景图
version: 1.0.0
last_updated: 2026-06-15
---

# free-layout-indicators-viewer

## 1. 概述

**名称**：自由布局指标

**用途**：在一张**自定义背景图**上**自由定位**多个指标（指标值/名称/单位），每个指标可独立配置位置、字体（含渐变）、独立背景图。典型场景是"大屏中嵌入多个 KPI 卡片到背景图的特定位置"。

**所属分类**：容器 / 布局

**复杂度**：高

### 1.1 文件入口

| 文件 | 作用 |
|------|------|
| `index.tsx` | 主组件入口（`oss-material.json.main` 指向） |
| `schema.ts` | 配置面板 / 数据面板（**无交互面板**） |
| `dataModel.json` | 数据契约（无 dimensions，5 个 indicators） |
| `oss-material.json` | 物料元信息（`main: "./index.tsx"`） |
| `index.less` | 根容器 + 指标点 + 背景图 + 事件层样式 |
| `components/IndItem.tsx` | **单指标渲染器**（含背景、渐变数字、单位、名称） |
| `components/StyledGradient.tsx` | **3 个 styled-components 渐变组件**（值/单位/名称） |
| `doc/readme.md` | 用户向文档（设计器侧边栏渲染） |
| `public/static/images/free-layout-indicators-viewer/default-bg.png` | ⚠️ **默认背景图静态资源**（物料编译时拷贝） |

### 1.2 核心能力

- **自由坐标布局**：`points` 数组通过 `MonacoEditor` 配置，每点 `{ id, left, top }`，`left/top` 支持**百分比**和**绝对像素**
- **默认背景图**：当 `layout.background` 为空时自动使用 `default-bg.png`（静态资源）
- **禁用背景**：`layout.disableBackground` 开关，可关闭背景图
- **三组独立样式**：指标值 / 指标名 / 指标单位，分别配置偏移、宽度、字体（含渐变色）
- **渐变文字**：通过 styled-components 注入 `-webkit-background-clip: text`，每个分组独立
- **个性化背景图**：`indicatorItemSetting` 数组（ArrayCollapse），按 `filterKey`（indicatorId 列表）匹配，**为单个/多个指标加独立背景**
- **指标名宽度**：`indicatorNameSetting.width` 控制自动换行

### 1.3 适用场景

- 大屏中**背景图+多个 KPI 卡片**的精确定位
- 需要"自定义背景图"+"位置/字体/大小灵活配置"的场景
- 不需要交互（点击下钻）的纯展示型指标

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
|------|------|----------|
| **Schema 维护** | [schema.md](./schema.md) | 5 个 FormCollapse 分组（布局配置/指标值/指标名/指标单位/指标个性配置） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.tsx` 坐标点匹配 + `IndItem` 单指标渲染 + styled-components 渐变 |
| **数据格式** | [data-model.md](./data-model.md) | 无 dimensions，5 个 indicators（id/name/value/unit/type） |

## 3. Schema 结构（摘要）

- **配置面板**（`config`）：`defineConfigSchema` 工厂 + `getCompTitle` + `BASE_LAYOUT`
- **布局配置 `$layout`**：`points`（MonacoEditor）+ `background`（Background）+ `disableBackground`（Switch）+ `pointSize`（Size）
- **指标值/名/单位**：3 个独立 `FormCollapse.CollapsePanel`，**都使用 `compositionFontStyle()` 工厂** 注入字体配置
- **指标个性配置 `$indicatorItemSetting`**：`ArrayCollapse`，每项含 `filterKey` + `background` + `backgroundSize`
- **数据面板**（`dataConfig`）：`defineDataConfigSchema` 工厂
- **交互面板**：⚠️ **当前未启用**（schema.ts 注释了 `defineInteractionSchema`）

## 4. 组件逻辑（摘要）

- **`index.tsx`**：用 `useMemo` 把 `config.layout.points` 与 `dataSource` 按 `indicatorId` 匹配，生成 `points` 数组
- **`IndItem`**：每个指标渲染为**绝对定位**的小元素（含背景图、渐变数字、单位、名称）
- **`StyledGradient`**：3 个 styled-components，通过 `enableGradient` 条件注入 `-webkit-background-clip: text`
- **背景图加载**：`getMaterialImageUrl('default-bg.png', ...)`（`@Src/utils/getImageUrl`）
- **个性化背景匹配**：`indicatorItemSetting` 数组按 `filterKey` 拆分 `indicatorId` 列表，匹配则用 `bgSetting`

## 5. 数据格式（摘要）

- **dimensions**：空
- **indicators**：`indicatorId`（必填，与 `points[].id` 匹配）/ `indicatorName` / `indicatorValue` / `indicatorUnit` / `indicatorType`（可选，**组件未使用**）
- **匹配规则**：`dataSource.find((item) => item.indicatorId === point.id)`，**找不到则该点不渲染**

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 任务 1：新增布局配置项（如旋转角度、缩放）
- 任务 2：调整默认背景图
- 任务 3：新增指标分组/类型
- 任务 4：启用交互面板（下钻）

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

⚠️ **重要警告**：

1. **静态资源依赖**：`public/static/images/free-layout-indicators-viewer/default-bg.png` 物料编译时拷贝，**删除/重命名会破坏构建**
2. **无交互面板**：当前未启用，点击事件**未实现**（虽然 `IndItem` 留了 `eventUISetting` 钩子）
3. **`indicatorType` 字段未使用**：dataModel 声明但组件未读取
