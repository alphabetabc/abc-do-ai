---
name: 'ai-coding-project-initializer'
description: 'Use when bootstrapping or retrofitting a project for document-driven AI coding: setting up agents.md, the docs/design / docs/specs / docs/research tree, the five-piece spec template, the as-is→to-be legacy template, and the team conventions that keep docs and code in lockstep.'
---

# AI Coding Project Initializer

为项目装上**文档驱动 AI Coding** 的完整骨架：agent 协作宪法 + 设计真相源 + 特性级 SDD 目录 + 历史变更模板 + 团队铁律。

> 本 skill 通过 **node 脚本**生成文档骨架，避免消耗大量 token。agent 只需指引脚本路径并让用户执行。

## 适用场景

- **新项目**：从零搭建 `agents.md` 与 `docs/` 全树
- **存量项目**：补齐或整改 `agents.md` 及 `docs/design` / `docs/specs` / `docs/research` 体系
- **团队对齐**：把"文档驱动 AI 写代码"的纪律固化成可接手的仓库结构

## 30 秒选路（动手前先看）

| 你在做什么                          | 走哪条              | 动手前必须有什么                                  | 核心文档                    |
| ----------------------------------- | ------------------- | ------------------------------------------------- | --------------------------- |
| 新能力 / 新模块 / 要从零写规格      | **新项目**          | 产品审定的 PM 输入（含反向提问）                  | PM 输入 → 五件套 → design   |
| 改老系统已有行为 / 缺陷里的行为变更 | **历史项目**        | 审过的「现状 → 目标态」（含影响面、非目标、验收） | as-is → to-be → 回写 design |
| 其实是新功能，却想套历史模板        | **改走新项目**      | —                                                 | 不要硬套历史模板            |
| 现状根本写不清                      | **先调研 / 补规格** | —                                                 | 不要硬写目标态开改          |

> 这张表与 `AGENTS.md` 模板里的「两条主路径」同步；agent 进入任何项目应先查这张表再动手。

## 核心理念（装上骨架前先对齐认知）

1. **瓶颈在"会不会问"，不在"会不会写"** —— 文档是把问题外置成可执行、可验收工件的手段
2. **文档是单一真相源** —— `docs/design/` 是全局权威；特性五件套**引用** design，不另造第二份契约
3. **文档可接才算交付** —— 换一个人（或下周的你，或 AI）按仓库文档能接着干，才算做完
4. **三条铁律**：① 没写清的行为不让 AI 大改；② 契约/验收变了，文档与代码同批更新；③ 禁止臆造文档里没有的字段、接口、菜单
5. **编制更瘦 · 壁垒更少 · 文档可接** —— 用"更少的人 × AI × 好问题"替代"多人串联堆产能"

## 脚本清单（主要交付物）

| 脚本                                                     | 作用                                                       | 用法                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| [scripts/init.mjs](./scripts/init.mjs)                   | 初始化完整骨架：`AGENTS.md` + `docs/` 全树 + bootstrap ADR | `node scripts/init.mjs [目标目录] [--legacy]`               |
| [scripts/new-spec.mjs](./scripts/new-spec.mjs)           | 创建新特性规格目录（五件套 + PM 输入）并登记 index         | `node scripts/new-spec.mjs <编号-短名> [特性名]`            |
| [scripts/legacy-change.mjs](./scripts/legacy-change.mjs) | 创建历史变更文档（as-is→to-be 模板）                       | `node scripts/legacy-change.mjs <短名> [--spec <特性编号>]` |

所有脚本：**已存在的文件不会覆盖**，会跳过并提示。

## Bootstrap 流程（用脚本完成）

### 1. 摸底（agent 做）

读 `README.md`、根目录、CI / 脚本配置、git log，摸清项目是什么、单仓还是 monorepo。

### 2. 跟用户对齐（必做）

- 用**默认布局**还是复用已有结构（如 `CONTEXT.md` / `docs/adr/`）
- `agents.md` 的重点（业务领域 / 团队约定 / 工具链）
- 项目是**新项目主路径**为主，还是**历史项目维护**为主，还是两者都要

### 3. 执行脚本（用户做）

```bash
# 完整初始化（含历史变更模板）
node scripts/init.mjs --legacy

# 或只生成 AGENTS.md
node scripts/init.mjs --agents-only

# 或指定目标目录
node scripts/init.mjs /path/to/project
```

脚本会生成：

- `AGENTS.md` — Agent 协作宪法（权威顺序、三条铁律、角色分工）
- `docs/design/` — 全局真相（tech-stack / architecture / api-contracts / data-models / routes / glossary / decisions）
- `docs/specs/` — 特性级 SDD（index.md + \_template/ 五件套）
- `docs/research/` — 调研备忘
- `docs/skills/` · `workflows/` · `changelogs/` — 空目录占位
- `docs/design/decisions/0001-bootstrap.md` — Bootstrap ADR

### 4. 填写占位符（用户做）

脚本生成的文件里有 `<待填>` 占位符，用户需要编辑：

- `AGENTS.md` 的概览、约定、领域语言
- `docs/design/` 下各文件的技术栈、架构、API、数据模型

### 5. 后续创建特性 / 历史变更

```bash
# 新特性（自动登记到 specs/index.md）
node scripts/new-spec.mjs 001-model-management 模型管理

# 历史变更
node scripts/legacy-change.mjs fix-login-redirect
node scripts/legacy-change.mjs refactor-filter-bar --spec 001-model-management
```

## 默认文档骨架

```
<project-root>/
├── AGENTS.md                          # ★ Agent / AI 协作宪法
└── docs/
    ├── index.md                       # 文档入口
    ├── design/                        # ★ 全局设计单一事实来源
    │   ├── README.md                  #   设计区索引与技术边界
    │   ├── tech-stack.md              #   技术栈、目录约定、工具链
    │   ├── architecture.md            #   NFR、持久化、部署、外部系统
    │   ├── system-overview.md         #   Shell、IA、全局交互、路由/菜单
    │   ├── api-contracts.md           #   HTTP 契约（与 OpenAPI 一致）
    │   ├── data-models.md             #   表 / 实体字段全局权威
    │   ├── routes.md                  #   路由与菜单登记
    │   ├── glossary.md                #   术语表
    │   └── decisions/                 #   ADR
    ├── specs/                         # ★ 特性级 SDD
    │   ├── index.md                   #   特性编号登记表
    │   ├── _template/                 #   五件套空模板
    │   └── _legacy-changes/           #   独立历史变更（不挂特性）
    ├── research/                      # 调研与 PoC
    ├── skills/                        # 编码 / 测试 / AI 提示词
    ├── workflows/                     # SDD / TDD 流程
    └── changelogs/                    # 变更记录
```

> 已有等价物时**复用**，不重复造；缺什么补什么，懒加载。

## 权威顺序（冲突时以此为准）

```text
本特性 spec.md + acceptance-tests.md
        ↓
docs/design/* + OpenAPI
        ↓
系统级约定（Shell / 鉴权等）
        ↓
编码 skills
```

特性五件套**引用** design，不复制全局字段；破坏性变更必须先改 design / OpenAPI，再改代码。

## 两条硬门槛（装好骨架后才能开工）

1. **新项目**：没有产品审定的 `pm-requirements-input.md`（且经过大模型反向提问补洞），不开写五件套。
2. **历史项目**：没有研发审定的 as-is→to-be（含影响面、非目标、验收），不让 AI 大改老代码。

## 角色一览

| 角色     | 负责                                                     | 默认不负责                 |
| -------- | -------------------------------------------------------- | -------------------------- |
| 产品     | 背景、assets、PM 输入、答复反向提问、验收口径            | HTTP / 表结构最终定稿      |
| 技术经理 | 选型、design/ADR 落点、仓库级分桶（S1–S5）、契约争议拍板 | 代替产品写业务验收         |
| 研发     | 五件套 / as-is→to-be、design 增量、TDD、MR               | 无冻结文档就让 AI 大改     |
| AI       | 起草、反向提问、实现与测试                               | 当需求真相源、擅自扩 scope |

> 小团队里产品/技术经理/研发可能是同一个人——角色分工仍是**职责清单**，不是人头数。

## 参考文档（按需读取，不必全读）

| 文档                                                                           | 作用                                                                  |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [references/templates/](./references/templates/)                               | ★ 所有可复制模板文件（脚本读取此目录，不内嵌文档）                    |
| [references/constraint-phrases.md](./references/constraint-phrases.md)         | ★ 通用约束三句 + 反例速查 + 阶段提示词（随时可加到提示词）            |
| [references/superpowers-cheatsheet.md](./references/superpowers-cheatsheet.md) | ★ Superpowers 技能族速查（新项目 9 项 + 历史 5 项 + Frontend Design） |
| [references/bootstrap-checklist.md](./references/bootstrap-checklist.md)       | Bootstrap 检查清单、常见陷阱、**5 项指标自检**（是否在做 AI Coding）  |
| [references/doc-tree.md](./references/doc-tree.md)                             | `docs/` 全树结构与每个文件职责                                        |
| [references/spec-five-pieces.md](./references/spec-five-pieces.md)             | 五件套使用指南：反向提问提示词、研发审定关卡                          |
| [references/legacy-change-template.md](./references/legacy-change-template.md) | 历史变更使用指南：P1–P6 / S1–S5 速查、反向提问提示词、反模式          |

> 与 `AGENTS.md` 模板的对应：
>
> - **9 条红线速查**（禁止事项）→ `AGENTS.md` 模板「禁止事项（全员红线）」段
> - **30 秒选路表** → `AGENTS.md` 模板「两条主路径」段
> - **三条铁律** → `AGENTS.md` 模板「三条铁律（全员）」段

## 输出风格

- agent 默认**只给建议、不动文件**；实际文件生成交给脚本
- 涉及删除、覆盖、迁移等高风险动作前必须显式确认
- 目录与文件命名遵循项目既有约定；没有约定就用默认布局
- **Token 意识**：脚本生成骨架，agent 只负责指引和解释

## 与其他 skill 的边界

本 skill **只负责装骨架**，不承担骨架装好后的执行层职责。

### 初始化完成后，本 skill 不做：

| 不做的事                                       | 由谁承担                                              |
| ---------------------------------------------- | ----------------------------------------------------- |
| 反向提问（PM 输入或 as-is→to-be 的刁钻评审）   | agent 按项目情况即兴使用 references 里的提示词        |
| 五件套内容生成                                 | agent 读 PM 输入后起草，研发审定                      |
| TDD / 系统化调试 / 代码审查                    | Superpowers 技能族（不强制安装）                      |
| Frontend Design（新页面 / 显著 UI 改版）       | frontend-design 技能，服从 `docs/design` 约定         |
| 骨架演进（加新 design 文件、拆分膨胀文档）     | agent 按项目需要即兴处理，参考 doc-tree.md            |
| 健康度检查（AGENTS.md 是否过长、特性是否登记） | agent 按项目需要即兴检查，参考 bootstrap-checklist.md |

### 本 skill 做的：

- 首次装骨架（`init.mjs`）
- 创建特性规格目录（`new-spec.mjs`）
- 创建历史变更文档（`legacy-change.mjs`）
- 提供 templates/ 模板和 references 使用指南（供 agent 按需读取）

> 简单说：**装骨架的归本 skill，骨架里跑的内容归 agent 和其他 skill。**
