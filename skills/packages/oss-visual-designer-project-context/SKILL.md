---
name: oss-visual-designer-project-context
description: 项目治理骨架：加载 env/AGENTS.md、design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog / 项目硬约束。
---

# `oss-visual-designer-project-context` Skill

加载上下文时读 `oss-visual-designer-project-context/env/AGENTS.md` + 当前计划索引文件。

## Pointer Map

<!-- 引用硬规则：
     skill 包内引用一律 `oss-visual-designer-project-context/<包内相对路径>`；
     禁 `../`、`file:///`、可点击 markdown 链接、emoji、「本 skill」模糊指代 -->

```text
env/          AGENTS.md · rules/
design/       vision · architecture · user-story-map · designer-state/ · designer-core/ · designer-canvas/ · topics/（专题文档）
plans/        current-sprint · backlog · roadmap · templates/ · done/
research/     历史调研文档（可能滞后，读时对照代码）
references/   （低频资料）
scripts/      sync-symlinks · setup-rules
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | `oss-visual-designer-project-context/design/vision.md` |
| 技术栈 / 模块边界 / 仓库结构 | `oss-visual-designer-project-context/design/architecture.md` |
| 用户旅程 | `oss-visual-designer-project-context/design/user-story-map.md` |
| 主线状态契约（8 份） | `oss-visual-designer-project-context/design/src/designer-state/` |
| 新架构内核契约（6 份） | `oss-visual-designer-project-context/design/packages-next/designer-core/` |
| 历史调研 | `oss-visual-designer-project-context/research/` |
| 任务流水 / 优先级 | `oss-visual-designer-project-context/plans/roadmap.md` |
| 未立项想法 / 待评估项 | `oss-visual-designer-project-context/plans/backlog.md` |
| 当前任务索引 | `oss-visual-designer-project-context/plans/current-sprint.md` |
| 任务卡模板 | `oss-visual-designer-project-context/plans/templates/task-template.md` |
| 任务工作流 / 硬门槛 | `oss-visual-designer-project-context/env/rules/03-task-workflow.md` |
| 项目硬约束 | `oss-visual-designer-project-context/env/AGENTS.md` |
| AI 助手级规则 | `oss-visual-designer-project-context/env/rules/*.md` |

## 维护节奏

free（按需）：任务驱动，无固定周期。新任务在 `plans/` 建 `task-YYYY-MM-DD-NNN-<slug>.md` 并在 `roadmap.md` 追加索引；完成后归档到 `plans/done/`。

## 版本

- version: 1.0.0
- 更新时间：2026-09-16
