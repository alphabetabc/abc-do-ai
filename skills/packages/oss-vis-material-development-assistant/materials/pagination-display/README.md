---
title: pagination-display 物料概览
description: 基础分页组件物料的整体介绍、文件结构与核心特性
version: 1.0.0
last_updated: 2026-06-16
---

# pagination-display 物料概览

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | pagination-display |
| **标题** | 基础分页组件 |
| **分类** | 进度 / 加载 |
| **复杂度** | 简单 |
| **源文件路径** | `src/packages/pagination-display/` |

## 文件结构

```
src/packages/pagination-display/
├── oss-material.json      # 物料元信息
├── schema.ts              # 配置面板 Schema 定义
├── index.jsx              # 组件主逻辑
├── index.less             # 样式文件
├── dataModel.json         # 数据模型定义
└── doc/                   # 物料文档
    ├── README.md
    └── CHANGELOG.md
```

## 核心特性

### 1. 分页展示
- 基于 `oss-ui` 的 `Pagination` 组件封装
- 显示总条数（格式：`共 X 条`）
- 支持页码切换交互

### 2. 数据源优先级
- **优先**：`extraResponse.data.viewItemData.page.total`
- **降级**：`dataSource[0].total`
- 当 total 为 0 或 falsy 时，不渲染分页组件

### 3. 交互派发
页码变化时派发两个参数：
- `changePaginationPage`：当前页码（Number）
- `changePaginationPageSize`：每页条数（Number）

### 4. 固定配置
- `showSizeChanger`: false（不显示每页条数切换器）
- `showQuickJumper`: false（不显示快速跳转）
- `size`: 'small'（小尺寸模式）

## 默认配置

```json
{
  "config": {
    "width": 250,
    "height": 50,
    "style": {
      "pageSize": 10
    }
  },
  "dataConfig": {
    "json": [
      { "total": "55" }
    ]
  }
}
```

## 文档导航

| 文档 | 说明 | 维度 |
|------|------|------|
| [schema.md](./schema.md) | 配置面板字段定义 | 🟦 配置维度 |
| [component-logic.md](./component-logic.md) | 组件渲染与交互逻辑 | 🟨 交互维度 |
| [data-model.md](./data-model.md) | 数据模型与字段映射 | 🟩 数据维度 |
| [common-tasks.md](./common-tasks.md) | 常见修改任务指南 | - |
| [gotchas.md](./gotchas.md) | 注意事项与陷阱 | - |

## 使用场景

适用于可视化大屏中需要展示分页信息的场景，例如：
- 表格数据的分页导航
- 列表数据的页码切换
- 需要与其他组件联动分页状态的场景
