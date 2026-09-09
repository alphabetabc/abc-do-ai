# plans/ · 计划层

索引可空。节奏 / 优先级唯一入口为 `roadmap.md`（不在 `design/`）。

| 文件 | 角色 |
| --- | --- |
| `current-sprint.md` | 当前计划索引（可空） |
| `backlog.md` | 待评估 / `[REJECTED]`（有真实项才写） |
| `roadmap.md` | 节奏与优先级（单文件） |
| `templates/task-template.md` | 任务卡模板；需要时复制为 `task-YYYY-MM-DD-NNN-<slug>.md` |
| `done/<YYYY-MM>/` | 已完成任务归档（按需） |

## 约定

- init **不强制**创建 `task-*.md`
- 任务两阶段工作流（硬门槛 / 回退）见 `env/rules/03-task-workflow.md`；卡面结构见 task-template
- Status：`待审批` → `已批准` → `进行中` → `已完成`；否决用 `已拒绝`
- 模块级目录若启用，须在设计文档约定；模板不预置
- 归档前先更新 `current-sprint.md` / `backlog.md` / `roadmap.md` 中的引用，再移动文件

## 任务卡命名

```text
task-<YYYY-MM-DD>-<NNN>-<slug>.md
```
