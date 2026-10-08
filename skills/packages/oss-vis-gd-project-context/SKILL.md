---
name: oss-vis-gd-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束。
---

# oss-vis-gd-project-context Skill

## Pointer Map

```text
env/          AGENTS.md · rules/
design/       001-vision · 002-architecture · 003-user-story-map · 004-docs-tree-guide · 005-large-screen-page-init · components/ · modules/
plans/        current-sprint · backlog · roadmap · templates/
references/   docs-link（docs 树引用关系）· 低频资料
scripts/      sync-symlinks · setup-rules · 迁移归档脚本
```

| 场景                         | 引用文件                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| 北极星 / 禁止清单            | `oss-vis-gd-project-context/design/001-vision.md`                                      |
| 技术栈 / 模块边界 / 仓库结构 | `oss-vis-gd-project-context/design/002-architecture.md`                                |
| 用户旅程                     | `oss-vis-gd-project-context/design/003-user-story-map.md`                              |
| 节奏 / 优先级                | `oss-vis-gd-project-context/plans/roadmap.md`                                          |
| 当前任务索引                 | `oss-vis-gd-project-context/plans/current-sprint.md`                                   |
| 待办池 + [REJECTED]          | `oss-vis-gd-project-context/plans/backlog.md`                                          |
| 任务卡模板                   | `oss-vis-gd-project-context/plans/templates/task-template.md`                          |
| 归档任务                     | `oss-vis-gd-project-context/plans/done/<YYYY-MM>/`                                     |
| 调研笔记                     | `oss-vis-gd-project-context/plans/research/`                                           |
| docs/ 树功能说明             | `oss-vis-gd-project-context/design/004-docs-tree-guide.md`                             |
| 大屏页面骨架初始化           | `oss-vis-gd-project-context/design/005-large-screen-page-init.md`                      |
| 业务模块文档（各模块索引）   | `oss-vis-gd-project-context/design/modules/<模块>/README.md`（现有 five-major-center） |
| 可复用组件文档（各组件索引） | `oss-vis-gd-project-context/design/components/README.md`                               |
| docs 引用关系图              | `oss-vis-gd-project-context/references/docs-link/`                                     |
| 任务工作流 / 硬门槛          | `oss-vis-gd-project-context/env/rules/03-task-workflow.md`                             |
| 项目硬约束                   | `oss-vis-gd-project-context/env/AGENTS.md`                                             |
| AI 助手级规则                | `oss-vis-gd-project-context/env/rules/*.md`                                            |

## 维护节奏

按 phase（spec/plan 阶段）维护：每阶段开始更新 `plans/current-sprint.md`，结束后沉淀 `plans/roadmap.md`；无固定周期。

## 版本

- version: 0.3.1
- 更新时间：2026-10-08
