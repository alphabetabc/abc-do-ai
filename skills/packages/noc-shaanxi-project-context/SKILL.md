---
name: 'noc-shaanxi-project-context'
description: 'oss-noc-shaanxi 项目统一上下文技能，在需要对项目进行拓展、重构等演进工作时提供设计文档与背景知识索引。'
---

# noc-shaanxi-project-context（项目上下文索引）

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 最后更新 | 2026-09-08 |

本技能是 oss-noc-shaanxi 项目的**唯一索引入口**，包含以下三大模块：

## 目录结构

```
noc-shaanxi-project-context/
├── SKILL.md                    # 本索引（仅定位，不放详细规则）
└── design/
    ├── modules/                # 模块设计文档（随源码持续进化）
    │   ├── index.md            # 模块索引
    │   ├── chinese-database-adapter/
    │   ├── management-overview-first/
    │   └── ui-streamer-path/
├── pm/                         # 历史 PM 输入文档（均已实施完成，仅作背景参考）
│   ├── index.md                # PM 输入索引
│   ├── gis-聚合/
│   ├── 国产数据库适配/
│   └── gis-配置升级/
└── plans/
    ├── roadmap.md               # 任务计划说明
    ├── task-yyyy-mm-dd-001-xxxx.md  # 进行中的任务
    └── done/                   # 已完成任务的归档
```

## 一、模块索引

详见 [design/modules/index.md](./design/modules/index.md)，包含：

- chinese-database-adapter — 国产数据库适配（DMDB / OceanBase / GaussDB / KingBase / GBase）
- management-overview-first — 中屏管理总览第一屏
- ui-streamer-path — StreamerPath 流光路径组件

## 二、PM 输入文档

详见 [pm/index.md](./pm/index.md)。均为历史需求 / 方案输入，已实施完成，仅作背景参考。

## 三、任务计划

后续任务在 [plans/](./plans/README.md) 下建立 `task-yyyy-mm-dd-001-xxxx.md` 记录任务内容，完成后归档到 [plans/done/](./plans/done/)。命名规则与生命周期详见 [plans/README.md](./plans/README.md)。

## 四、使用规则

1. **本文件只做索引**：详细规则一律放在 `design/modules/<module>/` 内的对应文档中维护。
2. **模块文档随源码进化**：任何源码改动都应在对应模块文档里同步体现（流程见 management-overview-first 的 `how-to-extend.md`）。
3. **引用方式**：跨模块引用统一写 `design/modules/<module-id>/`。
4. **pm 为只读背景**：`pm/` 下的文档描述的是历史输入，不代表当前实现；以 modules 文档和源码为准。
