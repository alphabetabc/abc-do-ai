---
title: 基础标签（normal-label）
description: 基础标签物料概述、文件入口、核心能力及三类维护内容索引
version: 1.0.0
last_updated: 2026-06-16
---

# 基础标签（normal-label）

## 1. 概述

**名称**：基础标签

**用途**：纯文本展示组件，从数据源读取 `labelText` 字段并渲染为带样式的文本标签。适用于仪表盘、数据看板中展示简单的文本内容或标题。

**所属分类**：文本/标签/标题

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
| ---- | ---- |
| `packages/normal-label/index.tsx` | 主组件入口 |
| `packages/normal-label/schema.ts` | 配置面板定义 |
| `packages/normal-label/dataModel.json` | 数据契约 |
| `packages/normal-label/oss-material.json` | 物料元信息 |
| `packages/normal-label/index.less` | 样式（当前为空） |

### 1.2 核心能力

- 纯文本展示：从 `dataSource[0].labelText` 读取并渲染文本
- 自定义文本样式：支持字体、颜色、大小、行高、字重配置
- 简洁轻量：无子组件、无状态、无交互，渲染路径极短

### 1.3 适用场景

- 仪表盘/数据看板中的静态文本标签
- 展示组件标题或说明文字
- 需要统一文本样式管理的纯文本场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| ---- | ---- | -------- |
| **Schema 维护** 🟦 | [schema.md](./schema.md) | 配置面板分组（基础设置）、VisualTextStyle 特殊组件、数据面板配置 |
| **组件逻辑维护** 🟨 | [component-logic.md](./component-logic.md) | index.tsx 渲染逻辑、props 结构、样式维护 |
| **数据格式** 🟩 | [data-model.md](./data-model.md) | dataModel.json 字段定义、dataSource 匹配规则、默认数据 |

## 3. Schema 结构（摘要）

配置面板包含 1 个 FormCollapse 面板「基础设置」，使用 `VisualTextStyle` 组件提供文本样式编辑（禁用 textAlign，启用 lineHeight）。数据面板通过 `renderDataConfig` 函数生成，字段来自 dataModel 的 indicators。无交互面板。

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

组件极简：`NormalLabel` 接收 `props.config` 和 `props.dataSource`，渲染 `<section style={config.common.textStyle}><span>{dataSource?.[0]?.labelText}</span></section>`。无子组件、无状态、无生命周期、无交互事件。

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel 定义 1 个 indicator 字段 `labelText`（String，字段名"文本"），无 dimensions。组件仅读取 `dataSource[0].labelText`，其余数据项被忽略。

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 修改默认文本内容 → 🟩 data-model.md（默认数据）+ 🟦 schema.md（defaultValue）
- 调整文本样式默认值 → 🟦 schema.md（defaultValue.config.common.textStyle）
- 新增文本前缀/后缀 → 🟦 schema.md（新增配置项）+ 🟨 component-logic.md（渲染逻辑）

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
