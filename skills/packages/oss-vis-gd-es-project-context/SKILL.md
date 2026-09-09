---
name: oss-vis-gd-es-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束。
---

# oss-vis-gd-es-project-context Skill

加载上下文时读 `env/AGENTS.md` + 当前计划索引文件。

## Pointer Map

```text
env/          AGENTS.md · rules/
design/       vision.md · architecture.md · user-story-map.md · modules/
plans/        current-sprint.md · backlog.md · roadmap.md · templates/
references/   （可选低频资料）
scripts/      sync-symlinks · setup-rules
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | oss-vis-gd-es-project-context/design/vision.md |
| 技术栈 / 模块边界 / 仓库结构 | oss-vis-gd-es-project-context/design/architecture.md |
| 用户旅程 | oss-vis-gd-es-project-context/design/user-story-map.md |
| 节奏 / 优先级 | oss-vis-gd-es-project-context/plans/roadmap.md |
| 当前任务索引 | oss-vis-gd-es-project-context/plans/current-sprint.md |
| 待办池 + [REJECTED] | oss-vis-gd-es-project-context/plans/backlog.md |
| 任务卡模板 | oss-vis-gd-es-project-context/plans/templates/task-template.md |
| 任务工作流 / 硬门槛 | oss-vis-gd-es-project-context/env/rules/03-task-workflow.md |
| 项目硬约束 | oss-vis-gd-es-project-context/env/AGENTS.md |
| AI 助手级规则 | oss-vis-gd-es-project-context/env/rules/01-link-format.md、02-no-hallucination.md |

## 维护节奏

按 sprint 维护：current-sprint.md 为当前迭代任务索引，迭代结束归档至 plans/done/ 并更新 roadmap.md。

## 版本

- version: 1.0.0
- 更新时间：2026-09-09
