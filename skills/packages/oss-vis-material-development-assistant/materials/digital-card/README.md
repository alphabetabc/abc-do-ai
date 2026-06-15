---
title: digital-card
description: 数字牌 — 渐变背景 + 标题 + 数值的单指标卡片组件
version: 1.0.0
last_updated: 2026-06-15
---

# digital-card

## 1. 概述

**名称**：数字牌

**用途**：用于展示单个数值指标的卡片组件，支持渐变背景色效果、标题和数值的独立样式配置、左边框装饰线配置。纯展示组件，无交互事件。

**所属分类**：数字 / 指标卡

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
|------|------|
| `index.jsx` | 主组件入口（`oss-material.json.main` 指向） |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约（dimensions + indicators，均为空） |
| `oss-material.json` | 物料元信息 |
| `index.less` | 样式 |
| `doc/readme.md` | 用户向文档（设计器侧边栏渲染） |

### 1.2 核心能力

- **渐变背景**：支持渐变色起始/结束颜色配置
- **标题区域**：左边框装饰线（显示/隐藏、颜色、宽度）、左内边距、文字对齐、文字颜色/大小/粗细
- **数值区域**：对齐方式、字体颜色/大小/粗细
- **纯展示**：无交互事件，无下钻，无派发参数

### 1.3 适用场景

- 大屏可视化中的单个指标展示（如故障数、在线率、告警数）
- 仪表盘中的数字卡片
- 需要渐变背景和装饰边框的场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
|------|------|----------|
| **Schema 维护** | [schema.md](./schema.md) | 3 个 FormCollapse 分组（背景 / 标题 / 数值） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.jsx` Class 组件、样式计算、`dataSource[0]` 读取 |
| **数据格式** | [data-model.md](./data-model.md) | 空 dataModel、`label` + `value` 字段约定 |

## 3. Schema 结构（摘要）

- **配置面板**（`config`）：3 个 FormCollapse 分组（背景 / 标题 / 数值），使用 `ColorPicker`、`Switch`、`NumberPicker`、`Select` 等组件
- **数据面板**（`dataConfig`）：使用 `DATA_CONFIG` 通用数据配置
- **交互面板**：未启用（纯展示组件）

## 4. 组件逻辑（摘要）

- **`index.jsx`**：Class 组件，从 `props.config` 读取样式配置，从 `props.dataSource[0]` 读取 `label` 和 `value`
- **样式计算**：`fnGetStyle` 工具方法读取配置，标题颜色未设置时回退到背景渐变结束色
- **左边框**：`showLeftBorder` 开关控制，默认使用背景渐变结束色作为边框色

## 5. 数据格式（摘要）

- **dataModel.json**：dimensions 和 indicators 均为空数组
- **数据约定**：`dataSource[0].label` 显示标题，`dataSource[0].value` 显示数值
- **单条数据**：仅读取第一条数据，多余数据忽略

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 任务 1：新增配置项（如圆角、阴影）
- 任务 2：修改默认颜色 / 默认尺寸
- 任务 3：调整标题与数值的布局比例

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
