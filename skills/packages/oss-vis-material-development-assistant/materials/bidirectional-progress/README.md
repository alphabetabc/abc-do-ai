---
title: 横向柱形图（bidirectional-progress）
description: 横向柱形图物料概述、核心能力、三类维护内容索引
version: 1.0.0
last_updated: 2026-06-16
---

# 横向柱形图（bidirectional-progress）

## 1. 概述

**名称**：横向柱形图

**用途**：左右双向进度条组件，中间显示标题，两侧分别展示左右两个方向的进度条，支持渐变色、斜线背景、激活动效、边框等视觉效果。适用于对比展示两组数据的进度或完成度。

**所属分类**：进度/加载

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
| ---- | ---- |
| `packages/bidirectional-progress/index.tsx` | 主组件入口 |
| `packages/bidirectional-progress/schema.ts` | 配置面板定义 |
| `packages/bidirectional-progress/dataModel.json` | 数据契约 |
| `packages/bidirectional-progress/oss-material.json` | 物料元信息 |
| `packages/bidirectional-progress/index.less` | 主组件样式 |
| `packages/bidirectional-progress/components/progress/index.tsx` | 子组件 Progress |
| `packages/bidirectional-progress/components/progress/index.less` | 子组件样式 |
| `packages/bidirectional-progress/components/progress/ContainerStyle.ts` | 斜线背景 & 边框 styled-components |

### 1.2 核心能力

- 左右双向进度条展示，中间显示标题文本
- 左右两侧独立配置：颜色渐变（开始→结束）、柱子长度/宽度、值文本、单位文本
- 支持斜线背景（可配置方向/颜色）、边框样式
- 支持激活动效（`status="active"`）
- 数据驱动：通过 dataSource[0] 解构 7 个字段

### 1.3 适用场景

- 双维度数据对比（如磁盘使用量：已用 vs 剩余、流量对比：上行 vs 下行）
- 需要同时展示两组进度/数值的场景
- 仪表盘中的双向指标卡片

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| ---- | ---- | -------- |
| **Schema 维护** | [schema.md](./schema.md) | 配置面板 3 个 FormCollapse 面板、字段定义、x-component 清单 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 主组件 & Progress 子组件、props 传递、百分比计算、样式 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel.json 7 个 indicator 字段、dataSource 匹配规则 |

## 3. Schema 结构（摘要）

配置面板包含 3 个 FormCollapse 面板：**标题设置**（尺寸、文本）、**左侧设置**（数据最大值、颜色、柱子、值文本、单位文本、间距、边框、斜线、激活动效）、**右侧设置**（同左侧）。使用 `Size`、`VisualTextStyle`、`ColorPicker`、`NumberPicker`、`Border`、`Switch`、`Radio.Group` 等 x-component。详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `BidirectionalProgress` 从 `dataSource[0]` 解构 7 个字段，计算左右百分比后分别渲染 `Progress` 子组件。左侧通过 `reverse: true` 实现反向显示（CSS `transform: scale(-1, 1)`）。子组件基于 oss-ui 的 `Progress` 封装，支持渐变色、斜线背景、边框、激活动效。详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel.json 定义 7 个 indicator 字段（无 dimensions）：`label`（中间标题）、`leftData`/`leftUnit`/`leftMax`（左侧数据）、`rightData`/`rightUnit`/`rightMax`（右侧数据）。组件通过 `dataSource[0]` 取第一条数据。详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 新增一个配置项（如修改左右两侧的默认颜色）：涉及 🟦 schema.md + 🟨 component-logic.md
- 修改数据字段（如新增一个维度字段）：涉及 🟩 data-model.md + 🟨 component-logic.md + 🟦 schema.md
- 调整默认值：涉及 🟦 schema.md 末尾 defaultValue

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
