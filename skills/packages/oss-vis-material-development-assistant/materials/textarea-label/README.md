---
title: textarea-label 物料文档
description: 文本域物料的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label（文本域）

## 1. 概述

**名称**：文本域（textarea-label）

**用途**：多行文本展示组件，支持文本样式配置、自适应高度、边框开关。

**所属分类**：文本 / 标签 / 标题

**复杂度**：简单

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.tsx` | 主组件入口 |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |

### 1.2 核心能力

- **文本样式**：支持字体颜色、字体族、字体粗细、字号、行高配置
- **自适应高度**：支持根据内容自动调整高度
- **边框控制**：支持显示/隐藏边框
- **数据驱动**：从 dataSource 读取 labelText 字段

### 1.3 适用场景

- 大屏展示多行文本内容
- 需要自适应高度的文本展示
- 简单的文本域展示需求

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 基础设置面板（文本样式、自适应高度、边框） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | Input.TextArea 渲染、props 传递 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel.json 字段定义、数据流向 |

## 3. Schema 结构（摘要）

Schema 分为 1 个主要面板：
- **基础设置**：文本样式（VisualTextStyle）、自适应高度开关、边框开关

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `TextareaLabel` 渲染流程：
1. **读取配置**：从 config.common 读取 textStyle、autoSize、bordered
2. **读取数据**：从 dataSource[0].labelText 读取文本内容
3. **渲染 TextArea**：使用 oss-ui 的 Input.TextArea 组件

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel.json 定义了 1 个指标字段：
- `labelText`（文本域）

数据流向：
```
外部数据源 → dataModel.json → dataSource → index.tsx → Input.TextArea → 渲染
```

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改文本样式配置
- 添加新的配置项
- 修改数据字段

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- VisualTextStyle 的 disableTextAlign 设置为 true
- 仅读取 dataSource[0]，不支持多条数据
