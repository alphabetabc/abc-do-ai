---
name: oss-hwms-monitor-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束。
---

# oss-hwms-monitor-project-context Skill

加载上下文时读当前计划索引文件，按需查 Pointer Map。

## Pointer Map

```text
env/          AGENTS.md · rules/
design/       vision · architecture · user-story-map
plans/        current-sprint · backlog · roadmap · templates/
pm/           （可选）
references/   （可选低频资料）
scripts/      sync-symlinks · setup-rules
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | `oss-hwms-monitor-project-context/design/vision.md` |
| 技术栈 / 模块边界 / 仓库结构 | `oss-hwms-monitor-project-context/design/architecture.md` |
| 用户旅程 | `oss-hwms-monitor-project-context/design/user-story-map.md` |
| 节奏 / 优先级 | `oss-hwms-monitor-project-context/plans/roadmap.md` |
| 当前任务索引 | `oss-hwms-monitor-project-context/plans/current-sprint.md` |
| 待办池 + [REJECTED] | `oss-hwms-monitor-project-context/plans/backlog.md` |
| 任务卡模板 | `oss-hwms-monitor-project-context/plans/templates/task-template.md` |
| 任务工作流 / 硬门槛 | `oss-hwms-monitor-project-context/env/rules/03-task-workflow.md` |
| 项目硬约束 | `oss-hwms-monitor-project-context/env/AGENTS.md` |
| AI 助手级规则 | `oss-hwms-monitor-project-context/env/rules/*.md` |

## 维护节奏

sprint。当前迭代任务见 `oss-hwms-monitor-project-context/plans/current-sprint.md`，节奏与优先级见 `oss-hwms-monitor-project-context/plans/roadmap.md`。

## 版本

- version: 0.2.0
- 更新时间：2026-11-05
