---
title: progress-list-bar 物料文档
description: 水平进度图物料（progress-list-bar）的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar（水平进度图）

## 1. 概述

**名称**：水平进度图（progress-list-bar）

**用途**：展示水平进度条列表，支持渐变色进度条、进度点动画、自定义样式。

**所属分类**：进度 / 加载

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.tsx` | 主组件入口 |
| `index.less` | 样式 |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |
| `components/RowItem.tsx` | 单行进度条组件 |
| `components/Styled.tsx` | styled-components 样式组件 |

### 1.2 核心能力

- **水平进度条**：支持左右方向、渐变色进度条
- **进度点动画**：支持进度点动画效果（enableAnimation）
- **自定义样式**：支持自定义进度条高度、圆角、间距、背景色
- **数据驱动**：支持从数据源读取 label、value、unit 字段

### 1.3 适用场景

- 大屏展示水平进度条列表
- 需要渐变色进度条的场景
- 需要进度点动画效果的场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 样式配置面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 进度条渲染、动画效果 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel.json 字段定义、数据流向 |

## 3. Schema 结构（摘要）

Schema 分为 1 个主要面板：
- **样式**：进度条方向、高度、圆角、间距、背景色、进度点动画开关

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `ProgressListBar` 渲染流程：
1. **数据解析**：从 `dataSource` 读取 label、value、unit 字段
2. **样式构建**：根据配置构建进度条样式（高度、圆角、间距、背景色）
3. **进度条渲染**：使用 `RowItem` 子组件渲染单行进度条
4. **动画效果**：如果 `enableAnimation` 为 true，使用 `ProgressDot` 组件渲染进度点动画

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel.json 定义了 3 个指标字段：
- `label`（标签）
- `value`（值）
- `unit`（单位）

数据流向：
```
外部数据源 → dataModel.json → dataSource → index.tsx → RowItem.tsx → 渲染
```

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改进度条样式（高度、圆角、间距、背景色）
- 修改进度点动画效果
- 新增数据字段

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- 使用 transient props（`$size`、`$color`、`$enableAnimation`）避免 DOM 透传
- 进度点动画使用 `keyframes` 实现
- 渐变色使用 `linear-gradient` 实现
