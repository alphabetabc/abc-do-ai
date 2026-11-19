---
name: oss-pmmp-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束。
---

# oss-pmmp-project-context Skill

加载上下文时先读 `oss-pmmp-project-context/env/AGENTS.md`，再按需要读 design/ 意图层与当前计划索引文件。

## Pointer Map

```text
oss-pmmp-project-context/env/     AGENTS.md · rules/
oss-pmmp-project-context/design/  vision.md · architecture.md · user-story-map.md
oss-pmmp-project-context/plans/   current-sprint.md · backlog.md · roadmap.md · templates/task-template.md
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | `oss-pmmp-project-context/design/vision.md` |
| 技术栈 / 模块边界 / 仓库结构 | `oss-pmmp-project-context/design/architecture.md` |
| 用户旅程 | `oss-pmmp-project-context/design/user-story-map.md` |
| 节奏 / 优先级 | `oss-pmmp-project-context/plans/roadmap.md` |
| 当前任务索引 | `oss-pmmp-project-context/plans/current-sprint.md` |
| 待办池 + [REJECTED] | `oss-pmmp-project-context/plans/backlog.md` |
| 任务卡模板 | `oss-pmmp-project-context/plans/templates/task-template.md` |
| 任务工作流 / 硬门槛 | `oss-pmmp-project-context/env/rules/03-task-workflow.md` |
| 项目硬约束 | `oss-pmmp-project-context/env/AGENTS.md` |
| AI 助手级规则 | `oss-pmmp-project-context/env/rules/*.md` |

## 维护节奏

free：不定期维护。需要更新计划或治理文件时随手更新，无固定周期。

## 版本

- version: 0.1.0
- 更新时间：2026-11-19
