---
name: 'noc-shaanxi-first-government-enterprise-business'
parent: 'noc-shaanxi-management-overview-first'
version: '1.2'
updated: '2026-06-24'
description: '维护和扩展政府企业业务模块，包含组件、数据展示、布局等综合管理功能。当需要修改或增强政府企业业务模块时调用此技能。核心原则：配置驱动渲染，所有修改从 presets.ts 开始。'
---

# 政府企业业务模块维护技能

> **所属父技能**：[noc-shaanxi-management-overview-first](../../SKILL.md)
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/modules/government-enterprise-business/SKILL.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.2     |
| 最后更新 | 2026-06-24 |

## 核心原则：配置驱动渲染

**任何修改或扩展都必须从 `presets.ts` 开始！**

`presets.ts` 是整个模块的**配置中枢**和**唯一入口**，定义了：

- 业务类型枚举
- 详情页面的组件映射
- 数据转换逻辑

## 功能概述

此技能用于维护和扩展陕西NOC管理总览第一屏的政府企业业务模块，涵盖以下方面：

### 模块结构

政府企业业务模块位于：
`web/pages/management-overview-first/modules/government-enterprise-business/`

### 核心功能区域

| 区域         | 路径                 | 说明                                |
| ------------ | -------------------- | ----------------------------------- |
| **首页概览** | `overview-v2/`       | **当前有效版本** - 椭圆轨道动画展示 |
| **旧版概览** | `overview/`          | 历史版本，不再使用                  |
| **详情页面** | `detail/`            | 业务规模和质量详情展示              |
| **指标组件** | `detail/ind-show/`   | 仪表盘、饼图、Top5等组件            |
| **布局组件** | `detail/multi-part/` | LeftPart/RightPart布局组件          |
| **配置中心** | `presets.ts`         | **核心** - 业务配置和数据转换       |

## 调用时机

**调用此技能当：**

- 需要修改政府企业业务模块的任何组件
- 需要添加新的业务类型（从 `presets.ts` 开始）
- 需要调整布局结构或数据展示逻辑
- 需要修复模块中的 bug
- 需要扩展模块功能

## 设计架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      presets.ts (配置中心)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │ overviewTypes   │  │ indOverviewSettings│ │ detailSettings  │    │
│  │ (业务类型枚举)   │  │ (概览布局配置)     │ │ (详情配置-Map)   │    │
│  └────────┬────────┘  └────────┬────────┘  └─────────┬────────┘    │
└───────────┼────────────────────┼─────────────────────┼─────────────┘
            │                    │                     │
            ▼                    ▼                     ▼
     overview-v2/         overview/ (旧)          detail/
     (椭圆轨道动画)       (已废弃)              (详情展示)
```

## 扩展工作流程

```
需求分析
    ↓
审视 presets.ts（最重要！）
    ↓
判断：现有配置能否满足？
    ├── 是 → 调整配置
    └── 否 → 添加新配置/组件
            ↓
       验证配置
            ↓
       测试渲染
```

## 详细文档

- [overview-v2 模块详细文档](./overview-v2-documentation.md) - 当前有效首页概览，椭圆轨道动画实现
- [Detail 模块详细文档](./detail-documentation.md) - 详情页面架构、组件详解、数据流和扩展指南（含 presets.ts 详解）

## 关键文件速查

| 文件                  | 路径                                                                  | 作用         |
| --------------------- | --------------------------------------------------------------------- | ------------ |
| presets.ts            | `modules/government-enterprise-business/presets.ts`                   | 配置中心     |
| overview-v2/index.tsx | `modules/government-enterprise-business/overview-v2/index.tsx`        | 首页入口     |
| detail/index.tsx      | `modules/government-enterprise-business/detail/index.tsx`             | 详情入口     |
| ellipse-track.ts      | `modules/government-enterprise-business/overview-v2/ellipse-track.ts` | 椭圆动画核心 |
| multi-part/index.ts   | `modules/government-enterprise-business/detail/multi-part/index.ts`   | 布局组件导出 |

## 版本演进说明

| 版本  | 关键变更                                                                                  |
| ----- | ----------------------------------------------------------------------------------------- |
| v1.0  | 初始版本，详细文档写在本文件                                                              |
| v1.1  | 拆出 `overview-v2-documentation.md` 与 `detail-documentation.md` 详细文档                  |
| v1.2  | 整体迁移至父技能 `noc-shaanxi-management-overview-first` 的 `modules/government-enterprise-business/` 子目录 |