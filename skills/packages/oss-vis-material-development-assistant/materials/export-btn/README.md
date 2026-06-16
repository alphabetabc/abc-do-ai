---
title: export-btn 物料文档
description: 导出按钮物料的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn（导出按钮）

## 1. 概述

**名称**：导出按钮（export-btn）

**用途**：可自定义样式的导出按钮，支持点击触发导出接口，下载 Excel 文件。

**所属分类**：按钮 / 操作

**复杂度**：简单

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.tsx` | 主组件入口 |
| `index.less` | 样式 |
| `schema.ts` | 配置面板定义 |
| `oss-material.json` | 物料元信息 |

### 1.2 核心能力

- **自定义样式**：支持文本样式、边框、背景（图/色）、前缀图标
- **导出功能**：点击触发导出接口，下载 Excel 文件
- **接口配置**：支持自定义导出接口（API/数据集）
- **参数合并**：支持接收其他组件传递的参数

### 1.3 适用场景

- 大屏中需要导出数据的场景
- 需要自定义样式的导出按钮

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 元素设置面板（文本、边框、背景、前缀） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 导出逻辑、样式构建、前缀图标渲染 |
| **数据格式** | [data-model.md](./data-model.md) | 无数据模型（纯交互组件） |

## 3. Schema 结构（摘要）

Schema 分为 2 个主要面板：
- **配置**：元素设置（文本、边距、边框、背景、前缀）
- **导出接口**：ExportApi 组件配置导出接口

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `ExportBtn` 渲染流程：
1. **样式构建**：根据 baseStyle 构建按钮样式（背景、文本、边框）
2. **前缀渲染**：CustomIcon 子组件渲染前缀图标
3. **点击导出**：onInnerClick 触发导出接口，下载 Excel 文件

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

本物料无数据模型（纯交互组件），不使用 dataSource。

导出接口配置来自 `customDataSourceApiConfig` 或 `exportAPIConfig`（历史参数）。

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改按钮样式（文本、边框、背景）
- 修改前缀图标配置
- 修改导出接口配置

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- `borderColor` 的 type 声明为 `number` 但使用 ColorPicker
- 根 class 名为 `table-list-container`，与物料名不一致
- 导出文件名包含时间戳
