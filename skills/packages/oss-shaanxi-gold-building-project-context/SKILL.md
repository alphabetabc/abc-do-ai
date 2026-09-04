---
name: oss-shaanxi-gold-building-project-context
description: 项目治理骨架 skill：加载项目级 AI 工作守则（env/AGENTS.md）+ 意图层（design/）+ 计划层（plans/）。触发词：项目治理 / 加载项目上下文 / sprint 索引 / BACKLOG / 项目级硬约束。
---

# `oss-shaanxi-gold-building-project-context` Skill

## 2. Pointer Map（场景 → 引用文件）

skill 自身目录结构：

```
oss-shaanxi-gold-building-project-context/
|-- SKILL.md          ← 本文件（动作契约、加载顺序）
|-- env
|   |-- AGENTS.md     ← 项目级 AI 工作守则（灵魂宪法）
|   `-- rules/        ← AI 助手级 rules
|-- design            ← 意图层
|   |-- vision.md     ← 北极星
|   |-- architecture.md ← 架构
|   |-- user-story-map.md ← 用户旅程
|   `-- codebase-map.md ← 项目结构档案（docs/src/web/public 详细结构）
|-- plans             ← 计划层
|   |-- roadmap.md    ← 季度路线
|   |-- current-sprint.md
|   `-- backlog.md
|-- references/       ← L3 深度资料（按需读）
`-- pm/               ← PM 素材（不被 load 扫描）
```

| 场景 | 引用文件 |
| --- | --- |
| 北极星 / 禁止清单 | `design/vision.md` |
| 技术栈 / 模块边界 | `design/architecture.md` |
| 用户旅程 / 挂载点 | `design/user-story-map.md` |
| 设计路线图 | `plans/roadmap.md` |
| 本周任务索引 | `plans/current-sprint.md` |
| 搁置池 + [REJECTED] | `plans/backlog.md` |
| 活跃任务详情 | `plans/TASK-YYYY-MM-DD-NNN-<slug>.md` |
| 已完成任务归档 | `plans/done/<YYYY-MM>/` |
| 季度执行切片（按需） | `plans/roadmap-YYYY-QN-<slug>.md` |
| 业务能力子目录（按需） | `design/components/<name>/` 或 `design/modules/<name>/` |
| 稳定参考资料（可选） | `references/*.md` |
| PM 输入与分析素材（可选） | `pm/*.md` |
| scripts/（symlink 等维护脚本） | `scripts/` |

---

## 3. 维护节奏

- **谁负责**：项目方主导，AI 协助；任何 AI 改动必须可被项目方一键回退。
- **何时更新**：
  - `design/vision.md`、`design/architecture.md`、`design/user-story-map.md`：发生方向/技术/角色调整时。
  - `plans/roadmap.md`：季度滚动重写一次（季度首周）。
  - `plans/current-sprint.md`：每周一更新；周末回填进度。
  - `plans/backlog.md`：长期追加，季度末清理。
- **逾期识别**：每个文件首部带「证据日期 / 季度」元信息；过期 ≥ 90 天需在 sprint 评审时确认是否续期。
- **与 git commit 的关系**：commit message 引用对应 `TASK-*.md` 或 `docs/specs/NNN-*/spec.md`；纯文档改动用 `docs:` 前缀。

---

## 4. 版本

- version: 0.1.0
- 更新时间：2026-09-04
