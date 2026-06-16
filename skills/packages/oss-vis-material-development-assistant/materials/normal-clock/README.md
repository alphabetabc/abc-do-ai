---
title: normal-clock - 物料概述
description: 时钟物料的整体介绍和文档索引
version: 1.0.0
last_updated: 2026-06-16
---

# normal-clock 时钟物料

## 物料简介

`normal-clock` 是一个简单的时钟展示物料，用于在大屏中显示实时时间。该物料使用 `dayjs` 库每秒更新时间显示，支持多种时间格式和整点传参功能。

## 基本信息

| 属性 | 值 |
|------|-----|
| 名称 | normal-clock |
| 标题 | 时钟 |
| 分类 | 时钟 / 动画 |
| 复杂度 | 简单 |
| 数据源 | ❌ 不使用 |
| 主入口 | `packages/normal-clock/index.jsx` |

## 核心功能

1. **实时时间显示**：使用 `dayjs` 每秒更新，支持 13 种时间格式
2. **整点传参**：支持在指定时间点（00点-23点）派发参数，用于联动其他组件
3. **文本样式定制**：支持字体大小、颜色、字体、粗细、对齐方式配置
4. **兼容旧版本**：保留 switch case 1/2/3 的兼容逻辑

## 技术特点

- 纯前端组件，不依赖数据源（dataModel 为空）
- 使用 `setInterval` 每秒更新时间
- 使用 `useEffect` 清理定时器避免内存泄漏
- 通过 `interaction.dispatch` 实现整点参数派发

## 文档索引

| 文档 | 维度 | 说明 |
|------|------|------|
| [schema.md](./schema.md) | 🟦 | Schema 配置面板详解，包含所有配置项的定义和默认值 |
| [component-logic.md](./component-logic.md) | 🟨 | 组件逻辑维护，包含渲染逻辑、状态管理、生命周期 |
| [data-model.md](./data-model.md) | 🟩 | 数据契约说明（本物料无数据源） |
| [common-tasks.md](./common-tasks.md) | - | 常见修改任务指南 |
| [gotchas.md](./gotchas.md) | - | 踩坑记录和注意事项 |

## 源码文件结构

```
packages/normal-clock/
├── oss-material.json    # 物料元信息
├── schema.ts            # 配置面板定义
├── index.jsx            # 主组件逻辑
└── index.less           # 样式文件
```

## 依赖说明

- `dayjs`：时间格式化和获取当前时间
- `oss-web-toolkits`：工具函数（`_.pick`）
- `@Common/constants`：全局字体配置 `GLOBAL_FONTS`
- `@Common/schema`：Schema 工具函数

## 快速导航

- 修改配置面板 → [🟦 schema.md](./schema.md)
- 修改组件逻辑 → [🟨 component-logic.md](./component-logic.md)
- 了解数据结构 → [🟩 data-model.md](./data-model.md)
