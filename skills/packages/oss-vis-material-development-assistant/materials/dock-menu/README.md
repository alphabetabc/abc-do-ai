---
title: 程序坞菜单
description: dock-menu 物料概述、三类维护内容索引及核心能力摘要
version: 1.0.0
last_updated: 2026-06-16
---

# dock-menu

## 1. 概述

**名称**：程序坞菜单

**用途**：可展开/收缩的侧边导航菜单，支持鼠标悬停展开、菜单项选中高亮、点击跳转链接。常用于大屏场景的页面导航。

**所属分类**：容器 / 布局

**复杂度**：高

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.tsx` | 主组件入口 |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |
| `index.less` | 样式 |
| `type.d.ts` | 类型定义 |
| `doc/images/*.png` | 文档截图 |

### 1.2 核心能力

- 侧边菜单 hover 触发展开/隐藏，支持屏幕左侧/右侧两种位置
- 菜单项支持选中高亮（activeKey 匹配），默认/选中两套独立样式
- 每个菜单项支持前缀图标 + 标题文本，点击跳转 URL
- 热区（hot-zone）控制触发区域宽度，支持展开/隐藏两种宽度

### 1.3 适用场景

- 大屏页面间的导航切换
- 侧边工具栏 / 程序坞式菜单

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 3 个 FormCollapse 面板（通用、默认设置、选中设置）、字段定义、x-component |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 组件 hover 展开逻辑、样式格式化、菜单项渲染、热区交互 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel.json 字段定义、dataSource 匹配规则、默认数据 |

## 3. Schema 结构（摘要）

配置面板包含 3 个 FormCollapse 面板：**通用**（展开宽度、隐藏宽度、默认选中项 ID、菜单背景色、热区设置）、**默认设置**（元素尺寸、边距、文本、行高、边框、背景、前缀）、**选中设置**（同默认设置）。使用 DATA_CONFIG 常量作为数据面板，无交互面板。

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

组件名 `DockMenu`，通过 hover 控制 `showInner` 状态切换展开/隐藏。热区（`.hot-zone`）和菜单面板（`.dock-inner`）均有 `transition` 动画。`formateItemBgStyle` 格式化背景样式（背景图/背景色），`onItemClick` 处理 URL 跳转。内联子组件 `ItemTitle` 渲染前缀图标 + 标题。

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel.json 定义 3 个 indicator 字段：`key`（菜单 key）、`url`（URL）、`title`（名称），无 dimensions。默认数据 2 条（地市保障场景、区域保障场景）。

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 新增菜单项样式配置项（如 hover 样式）：涉及 🟦 Schema + 🟨 组件逻辑
- 调整热区交互行为：涉及 🟦 Schema + 🟨 组件逻辑
- 新增数据字段（如菜单图标）：涉及 🟦 Schema + 🟨 组件逻辑 + 🟩 数据

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
