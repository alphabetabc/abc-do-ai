# plans/ · 计划层

索引可空。节奏 / 优先级唯一入口为 `roadmap.md`（不在 `design/`）。

| 文件 / 目录 | 角色 |
| --- | --- |
| `current-sprint.md` | 当前计划索引（可空） |
| `backlog.md` | 未立项想法 / 待评估项（唯一暂存区；`[REJECTED]` 标记放弃项） |
| `roadmap.md` | 任务流水索引（单文件，历史全量保留） |
| `templates/task-template.md` | 任务卡模板；需要时复制为 `task-YYYY-MM-DD-NNN-<slug>.md` |
| `done/` | 已完成任务归档（扁平结构，历史沿用） |

## 约定

- init / 日常**不强制**创建 `task-*.md`
- 任务两阶段工作流（硬门槛 / 回退）见 `oss-visual-designer-project-context/env/rules/03-task-workflow.md`；卡面结构见 task-template
- 归档前先更新 `current-sprint.md` / `backlog.md` / `roadmap.md` 中的引用，再移动文件

## 任务卡命名

```text
task-<YYYY-MM-DD>-<NNN>-<slug>.md
```
