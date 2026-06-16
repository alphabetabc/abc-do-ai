---
title: single-image - 物料概述
description: 单张图片物料的总览文档，包含功能简介、文件结构和文档索引
version: 1.0.0
last_updated: 2026-06-16
---

# single-image 单张图片

## 物料简介

单张图片物料，支持**位图（Image）**和**矢量图（SVG）**两种渲染模式，可配置点击下钻（Modal / Drawer / Window / WindowSelf）和参数派发，并支持按省/地市级别的可见范围控制。

| 属性 | 值 |
|------|-----|
| 物料名称 | single-image |
| 物料标题 | 单张图片 |
| 分类 | 媒体 / 播放 |
| 复杂度 | 中 |
| 源码路径 | `packages/single-image/` |
| 入口文件 | `packages/single-image/index.jsx` |

## 核心功能

1. **双模式图片渲染**：位图使用 `backgroundImage`，矢量图使用 `WebkitMaskImage` + 填充色
2. **图片重复控制**：支持 full / no-repeat / repeat-x / repeat-y / repeat 五种模式
3. **点击交互**：支持下钻弹窗（Modal/Drawer）和新窗口打开（Window/WindowSelf），以及参数派发
4. **参数拼接**：支持 otherParam1-5 的接收与透传
5. **可见范围**：支持 all / province / city 三级可见性控制

## 文件结构

```
packages/single-image/
├── oss-material.json   # 物料元信息
├── schema.ts           # 配置面板 Schema 定义
├── index.jsx           # 主组件逻辑
├── index.less          # 样式文件
├── dataModel.json      # 数据契约定义
└── doc/                # 物料自带文档
    ├── README.md
    ├── CHANGELOG.md
    └── images/
```

## 5+1 文档索引

| 文档 | 图标 | 说明 |
|------|------|------|
| [schema.md](./schema.md) | 🟦 | Schema 配置面板详解：3 个 FormCollapse 面板 + 下钻配置 |
| [component-logic.md](./component-logic.md) | 🟨 | 组件逻辑维护：渲染流程、点击处理、可见性控制 |
| [data-model.md](./data-model.md) | 🟩 | 数据契约：1 个指标字段 content |
| [common-tasks.md](./common-tasks.md) | 📋 | 常见修改任务指南 |
| [gotchas.md](./gotchas.md) | ⚠️ | 踩坑记录与注意事项 |

## 依赖关系

- `@Common/schema` — `BASE_LAYOUT`、`getCompTitle`、`defineInteractionSchema`
- `oss-ui` — `ConfigProvider`
- `oss-web-toolkits` — `_`（lodash 工具）
- `@Utils` — `getImageUrl`
- `../../hooks/useDevelopment` — `useDevelopmentMode`
