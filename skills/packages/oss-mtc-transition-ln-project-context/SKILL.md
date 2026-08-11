---
name: "oss-mtc-transition-ln-project-context"
description: "为 AI Agent 与本人沉淀 oss-mtc-transition-ln 项目的「私人/草稿」上下文——记录不便写进项目正式文档（docs/、AGENTS.md、README.md 等）的内容，仅本地使用。Invoke when user shares private notes / pre-decision context / pending investigations / personal preferences about this repo, or when agent needs local project memory not appropriate for team-wide docs."
---

# oss-mtc-transition-ln Project Context（私人上下文）

## 定位（重要）

本 skill 是 **本地、私人、草稿性质** 的项目记忆区，只服务于「我（用户）」与「AI Agent」之间的协作：

- ⚠️ `.trae/` 目录**不入 Git 仓库**（`.git/info/exclude` 已排除）
- ⚠️ 团队其它同事**看不到**这里的任何内容
- ✅ 因此这里适合放：
    - 不方便写进团队文档的草稿、想法、待验证假设
    - AI Agent 的上下文备忘（用户偏好、踩坑记录、约定）
    - 与本仓库相关的工具/IDE/会话侧配置（rule、skill、流程笔记）
    - 一次性调查、临时 TODO、个人复盘
- ❌ **不适合**放：
    - 项目正式规范（→ `docs/skills/`）
    - 团队共享的设计/契约（→ `docs/design/`、`docs/specs/`）
    - 大屏开发职责范围（→ 根 `AGENTS.md`）
    - 与他人协作的入口说明（→ `README.md`、`HERMES.md`）

> 判断标准：**「如果有同事问起这个内容，他应不应该在正式文档里看到？」**
>
> - 应该看到 → 不要写进 skill，写进项目正式文档
> - 只跟我 / AI 有关 → 写进 skill

## 目录结构

```
oss-mtc-transition-ln-project-context/
├── SKILL.md            # 本文件：skill 说明 + 范围边界
├── plans/              # 私人计划：草稿迭代、待办、调研计划
├── design/             # 私人设计：未成熟的设计草案、API 想法、字段命名候选
├── pm/                 # 私人 PM 需求：原始输入、个人理解、未拍板反馈、待澄清问题
└── env/                # 私人环境信息：本地开发踩坑、命令备忘、机器/账号信息（含 AGENTS.md / package.json 硬链接镜像）
```

> skill 内不要再新建根级 `.md`，所有内容按主题放进上述三个子目录。
> 子目录内的文件命名自由，建议「主题 + 日期」，如 `2026-08-11-pm-inputs-summary.md`。

## 使用方式

1. 用户提到「记一下」「备忘」「我想起一个事」「这事先别写到项目里」等 → 把信息写到对应子目录
2. AI Agent 在新会话启动时，如果任务与本仓库相关，先 `Read` 本 SKILL.md 与 `plans/`、`design/`、`env/` 关键文件，建立项目私域上下文
3. 已有的「项目正式文档摘要」（如 `env/project-overview.md`）可作为快速入口，但它**不替代** `docs/` 内的正式文档
4. 当内容被验证、达成共识、需要交付给团队时，**主动迁移**到 `docs/` 或 `AGENTS.md`，并在本目录中标记 `[→ docs/skills/python/coding.md §4]` 一类的去向

## 子目录说明

| 子目录    | 内容示例                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- |
| `plans/`  | 我个人的待办、调研计划、未排期 spec 草案                                                       |
| `design/` | API 形状草稿、字段名候选、架构备选方案、未定型的 schema                                         |
| `pm/`     | PM 原始需求输入、个人理解、未拍板反馈、跨 spec 待澄清问题                                       |
| `env/`    | 本地命令备忘、踩坑、机器配置、临时脚本（根 `AGENTS.md` / `package.json` 通过硬链接镜像在此）   |

## 与正式文档的关系

| 类别                               | 写到哪里                                       |
| ---------------------------------- | ---------------------------------------------- |
| 团队规范、coding 规则              | `docs/skills/`                                 |
| 架构与契约                         | `docs/design/`                                 |
| 需求规格                           | `docs/specs/NNN-name/`                         |
| 大屏开发职责、模块表               | 根 `AGENTS.md`（硬链接镜像到 `env/AGENTS.md`） |
| 项目入口、启动、部署               | `README.md`                                    |
| **个人备忘、私有草稿、未定型想法** | **本 skill**                                   |
