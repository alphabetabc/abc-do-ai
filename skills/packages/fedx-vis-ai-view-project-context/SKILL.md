---
name: fedx-vis-ai-view-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束 / 组件蒸馏（把外部项目源码提炼为物料站四件套）。
---

# `fedx-vis-ai-view-project-context` Skill

加载上下文时读 `env/AGENTS.md` + 当前计划索引文件。

## Pointer Map

```text
env/          AGENTS.md · rules/
design/       vision · architecture · user-story-map
plans/        current-sprint · backlog · roadmap · templates/
references/   distill-workflow（蒸馏方法论）
scripts/      sync-symlinks · setup-rules · distill-survey · distill-profile
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | `fedx-vis-ai-view-project-context/design/vision.md` |
| 技术栈 / 模块边界 / 仓库结构 | `fedx-vis-ai-view-project-context/design/architecture.md` |
| 用户旅程 | `fedx-vis-ai-view-project-context/design/user-story-map.md` |
| 节奏 / 优先级 | `fedx-vis-ai-view-project-context/plans/roadmap.md` |
| 当前任务索引 | `fedx-vis-ai-view-project-context/plans/current-sprint.md` |
| 待办池 + [REJECTED] | `fedx-vis-ai-view-project-context/plans/backlog.md` |
| 任务卡模板 | `fedx-vis-ai-view-project-context/plans/templates/task-template.md` |
| 任务工作流 / 硬门槛 | `fedx-vis-ai-view-project-context/env/rules/03-task-workflow.md` |
| 项目硬约束 | `fedx-vis-ai-view-project-context/env/AGENTS.md` |
| AI 助手级规则 | `fedx-vis-ai-view-project-context/env/rules/*.md` |
| **组件蒸馏工作流**（两条工作流 / 四档处置 / 内联映射规则 / 四件套规范） | `fedx-vis-ai-view-project-context/references/distill-workflow.md` |

## 维护节奏

free（按需）：内容变更时随手更新对应文件，不设固定周期。

## 版本

- version: 0.2.0
- 更新时间：2026-11-06
