---
name: "oss-mtc-transition-ln-project-context"
description: "为 AI Agent 与本人沉淀 oss-mtc-transition-ln 项目的「私人、非公开」上下文——记录不便或未必要入项目正式文档（docs/、AGENTS.md、README.md 等）的设计、决策、备忘等内容，仅本地使用；团队其它同事看不到此处文件。Invoke when user shares private notes / design notes / pre-decision context / pending investigations / personal preferences about this repo, or when agent needs local project memory not appropriate for team-wide docs."
---

# oss-mtc-transition-ln Project Context（私人上下文）

## 定位（重要）

本 skill 是 **本地、私人、非公开性质** 的项目记忆区——既包括「暂未拍板的草稿」，也包括「不便或未必要入公司项目正式文档（`docs/`、`AGENTS.md`、`README.md`）的成熟内容」（团队架构 / 私有决策 / 不便公开的备忘等）。只服务于「我（用户）」与「AI Agent」之间的协作：

- ⚠️ `.trae/` 目录**不入 Git 仓库**（`.git/info/exclude` 已排除）
- ⚠️ 团队其它同事**看不到**这里的任何内容
- ✅ 因此这里适合放：
    - **私人设计**：架构母文档、组件契约、决策日志、模板与早期形态的草稿/候选/未定型条目（与成熟设计并存，**不必**因「已是拍板版本」就强制迁移出去）
    - 不方便写进团队文档的备忘、想法、待验证假设
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
> - 只跟我 / AI 有关，或不便在公司项目公开 → 写进 skill

## 目录结构

```
oss-mtc-transition-ln-project-context/
├── SKILL.md            # 本文件：skill 说明 + 范围边界
├── references/         # 稳定参考手册：docs/ 名词解释与维护使用指南（面向 Agent）
├── scripts/            # 本地脚本（symlink 同步等）
├── plans/              # 私人计划：草稿迭代、待办、调研计划
├── design/             # 私人设计：架构母文档、组件契约、决策日志、模板与早期形态草稿（含已拍板条目，与草稿/候选并存）
├── pm/                 # 私人 PM 需求：原始输入（不可改）+ 个人分析整理、可执行版本（可编辑）
└── env/                # 私人环境信息：本地开发踩坑、命令备忘、机器/账号信息（含 AGENTS.md / package.json symlink 镜像）
```

> skill 内不要再新建根级 `.md`，所有内容按主题放进上述子目录。
> 子目录内的文件命名自由，建议「主题 + 日期」，如 `2026-08-11-pm-inputs-summary.md`。
> 例外：`.local-*` 前缀文件（如 `.local-symlink-status.json`）为脚本生成的状态快照，不属于文档，不受此约束。
>
> **references/ 与其他目录分工**：
>
> - `references/`：通用、稳定、长期维护的参考手册。
>     - `001-docs名词解释与维护使用指南.md` — 答"docs 是什么"
>     - `002-基于skill与docs的协作开发workflow.md` — 答"AI + 用户怎么协作"
> - Agent 加载 skill 后**先读 references/** 建立上下文，再进入具体任务。
> - `design/`：大屏特化架构母文档、决策日志与组件契约（含早期形态的草稿/候选，重构版见 `design/001-big-screen-dev-guide.md`）。
> - `env/` / `plans/` / `pm/`：摘要 / 待办 / 原始输入，不重复 references/ 内容。

## 使用方式

1. 用户提到「记一下」「备忘」「我想起一个事」「这事先别写到项目里」等 → 把信息写到对应子目录
2. AI Agent 在新会话启动时，如果任务与本仓库相关，先 `Read` 本 SKILL.md + `references/`（建立 docs/ 上下文） + `plans/` + `env/project-overview.md`，建立项目私域上下文
3. 已有的「项目正式文档摘要」（如 `env/project-overview.md`）可作为快速入口，但它**不替代** `docs/` 内的正式文档
4. 当内容被验证、达成共识、需要交付给团队时，**主动迁移**到 `docs/` 或 `AGENTS.md`，并在本目录中标记 `[→ docs/skills/python/coding.md §4]` 一类的去向

## 会话启动检查（symlink 自检）

**触发时机**：每次新会话首次加载本 skill 后、进入任何仓库任务前，由 AI Agent 主动执行一次。

**执行命令**（在仓库根运行）：

```bash
node .trae/skills/oss-mtc-transition-ln-project-context/scripts/sync-symlinks.mjs --status
```

**行为**：

- 检查 `env/AGENTS.md` 与 `env/package.json` 是否为指向仓库根对应文件的 symlink
- 结果以覆盖式快照写入 `.local-symlink-status.json`（不入库，`.local-` 前缀已被 `.git/info/exclude` 排除）
- 控制台输出 `✓ 所有 symlink 正常` 或 `✗ 存在异常 symlink，详见状态文件`

**异常处理**：

- 若 `allOk === false`：**不要自动执行 `sync`**（建立 symlink 可能需要开发者模式/管理员权限），改为**告知用户**当前状态并询问是否修复
- 修复命令：`node .trae/skills/oss-mtc-transition-ln-project-context/scripts/sync-symlinks.mjs`（无参数即 sync 模式）
- 详见 `scripts/sync-symlinks.mjs` 文件头注释

## 子目录说明

| 子目录     | 内容示例                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/` | 本地脚本：symlink 同步（`sync-symlinks.mjs`）等                                                                                                                                                    |
| `plans/`   | 我个人的待办、调研计划、未排期 spec 草案                                                                                                                                                           |
| `design/`  | 大屏架构母文档（`004`）、组件契约（`components/`）、决策日志（`002`）、模板（`_large-screen-template/`）；以及早期形态的 API / 字段草稿、架构备选方案、未定型 schema（与已拍板项并存，未强制迁出） |
| `pm/`      | PM 原始需求输入（**不得修改**）+ 我们对其做的分析、归纳、跨 spec 整理、可执行提炼（**可编辑**，服务于"更准确地执行项目任务"）                                                                      |
| `env/`     | 本地命令备忘、踩坑、机器配置、临时脚本（根 `AGENTS.md` / `package.json` 通过 symlink 镜像在此）                                                                                                    |

## 禁止行为

- ❌ `pm/` 目录里**标记为 PM 原始输入**的文件（如原始 PM 提供的需求说明、邮件抄送、对话记录等），未经用户明确授权**不得修改**；我们对 PM 输入做的**分析、归纳、跨 spec 整理版可正常编辑**
- ❌ 不要在本文件未涉及的目录中乱建文件
- ❌ 草稿未经验证 / 拍板前不要迁移到正式文档

## Task 管理约定

1. **生成五件套时必须套用 SDD 全流程模板**：创建 task 时使用 `plans/templates/task-template-sdd-全流程.md` 作为骨架，不得自创结构。模板中的 §0 特性信息、§1-§3 三阶段、§4 Prompt、§5 状态记录均需保留；Prompt 章节中的 `{编号}-{slug}` 等变量替换为实际值。
2. **文档 task 与编码 task 分开**：当一次工作同时涉及 L3 文档审批（修改 `docs/` 下文件）和代码实现时，拆为两个独立 task——文档审批一个、编码开发一个。文档 task 完成并 review 通过后，编码 task 才启动。

## 与正式文档的关系

| 类别                                                                           | 写到哪里                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------ |
| 团队规范、coding 规则                                                          | `docs/skills/`                                   |
| 架构与契约                                                                     | `docs/design/`                                   |
| 需求规格                                                                       | `docs/specs/NNN-name/`                           |
| 大屏开发职责、模块表                                                           | 根 `AGENTS.md`（symlink 镜像到 `env/AGENTS.md`） |
| 项目入口、启动、部署                                                           | `README.md`                                      |
| **为更好执行任务做的私人细化**（PM 原始输入 + 我们的分析整理/归纳/可执行提炼） | `pm/`（原始不可改，分析整理版可编辑）            |
| **个人待办、草稿迭代、调研计划**                                               | `plans/`                                         |
| **私人设计**（架构/组件/决策/模板，含已拍板条目）                              | `design/`（**非公开**，不强制迁出）              |
