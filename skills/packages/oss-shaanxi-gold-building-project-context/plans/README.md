# plans/ · 计划层目录约定

> **定位**（§3.6）：滚动规划层 —— 本周任务索引 + 单任务卡 + BACKLOG + 季度执行切片 + 归档目录（`handoff-*` 仅为可选命名保留位，见 §3.4）。

---

## 文件清单

| 文件                                | 角色                                       | 约束                            |
| ----------------------------------- | ------------------------------------------ | ------------------------------- |
| `current-sprint.md`                 | 本周任务**索引**（仅放标题 + 链接）        | ≤50 行，活跃维护                |
| `task-YYYY-MM-DD-NNN-<slug>.md`     | 单任务卡（独立文件）                       | 全生命周期（创建 → 归档）       |
| `backlog.md`                        | 搁置池 + 待办想法 + 末尾 `[REJECTED]` 区段 | 长期追加，季度清理              |
| `handoff-*.md`（可选）              | 体系命名保留位                             | **非**本 Skill Agent 动作；§3.4 |
| `done/<YYYY-MM>/`                   | 已完成任务归档                             | 按完成月归档                    |
| `roadmap.md`                        | 季度目标（战略切片）                       | **≤ 50 行**，季度滚动重写       |
| `roadmap-YYYY-QN-<slug>.md`（可选） | 季度执行切片                               | 必须在 `plans/roadmap.md` 登记  |

## 全局唯一入口原则

- `current-sprint.md` 与 `backlog.md` 是**全局唯一**导航入口
- 任何模块级 `SPRINT.md` / `BACKLOG.md` 只能作为**局部维护材料**，不得独立出现在 `load` 发现路径
- 模块任务必须同步到全局入口（无全局入口看不到的“孤儿任务”）

## 滚动规划

只规划最近 1~2 周；季度目标由 `plans/roadmap.md` 承载。

## 任务卡命名规则

```
TASK-<YYYY-MM-DD>-<NNN>-<slug>.md
```

- `YYYY-MM-DD`：创建日期（**唯一**，非修改日期、非归档日期）
- `NNN`：当日序号，三位补零
- `<slug>`：kebab-case 短描述（≤30 字符）

**反例**：

- ❌ `task-001.md`（无日期）
- ❌ `TASK-2026-9-1-1-xxx.md`（日期未补零）
- ❌ `TASK-20260901-001.md`（日期格式不分离）

## handoff 命名槽（可选 · 非 Agent 必知）

```
handoff-YYYY-MM-DD-HHMMSS.md
```

仅当宿主/其它工具需要落临时桥文件时使用此名；本 Skill **不**教 Agent 创建或 `load` 消费（详见设计 §3.4）。

## 引用一致性（归档前必走）

任务卡“移入归档目录”必须**先同步更新所有引用**，再移动文件（详见 §3.6.1 R1 引用一致性）：

- `current-sprint.md` —— 移除该任务的索引行
- `backlog.md` —— 迁移到 `[REJECTED]` 区段或相应位置
- `plans/roadmap.md` / `plans/roadmap-YYYY-QN-*.md` —— 更新季度目标进度

## 当前文件清单

- [x] `current-sprint.md` · 本周任务索引（2026-09-04 init）
- [x] `backlog.md` · 待办池 + [REJECTED]（2026-09-04 init）
- [x] `roadmap.md` · 季度目标（2026-09-04 init，自 design/ 迁入）
- [x] `templates/task-template.md` · 新任务卡模板（骨架文件，未改动）
- [ ] `TASK-*.md` · （按需创建；本周无活跃任务）
- [ ] `done/<YYYY-MM>/` · （按需归档）
- [ ] `roadmap-YYYY-QN-*.md` · （按需）
