---
name: 'agent-creator'
description: 'Use when setting up or fixing up a project`s agent-facing docs (agents.md, research/, plans/, decisions/), starting a research-and-planning workflow for any change, or needing a living index of current plans and decisions.'
---

# Agent Creator Skill

为项目"装上"agent 友好的文档骨架，并驱动 **research → plan → maintain** 的循环。

> "重构 / 新项目" 只是触发场景的两个例子。本 skill 不绑定具体工作类型，**任何**需要研究、规划、留痕的项目变更都可以走这条循环。

## 适用场景

- **新项目**：从零搭建 `agents.md` 与配套目录
- **存量项目**：补齐或整改 `agents.md` 及其索引
- **任意变更**（重构、加 feature、修 bug、性能优化、依赖升级…）：走 research → plan → maintain
- **周期性回顾**：清理过期计划、归档已落地的决策。触发信号：`agents.md` 越来越长且难以快速定位信息、`research/` 笔记堆积大量 `superseded` 状态、`plans/` 中有长期停滞的计划

## 默认文档骨架

```
<project-root>/
├── agents.md                 # 项目门面：概述、约定、计划与决策的索引
├── research/                 # 调研笔记
│   └── YYYY-MM-DD-<topic>.md
├── plans/                    # 进行中的计划
│   └── YYYY-MM-DD-<topic>.md
└── decisions/                # 决策记录（ADR 风格）
    └── NNNN-<title>.md
```

> 已有等价物时**复用**（如 `CONTEXT.md`、`docs/adr/`、`README.md`），不重复造；缺什么补什么，懒加载。

## 核心循环：Research → Plan → Maintain

<HARD-GATE>
在未完成 Research 阶段（输出 `research/` 笔记并获得用户确认）前，不得进入 Plan 阶段。
在未完成 Plan 阶段（输出 `plans/` 计划并获得用户确认）前，不得开始执行。
</HARD-GATE>

### 1. Research（调研）

- 先读 `agents.md`、相关 `research/`、`decisions/`，避免重复工作
- 跑代码 / 跑测试 / 看 git log / 翻 issue，**摸清现状再说话**
- 输出 `research/YYYY-MM-DD-<topic>.md`，至少包含：现状、约束、候选方案、引用了哪些文件 / 决策 / 已有计划
- **完成判断**：用户能基于笔记做出"做不做、怎么做"的判断

### 2. Plan（计划）

- 在 `plans/YYYY-MM-DD-<topic>.md` 创建计划文件
- 必备字段：目标、范围、依赖、阶段拆解、验收标准、风险
- 涉及**不可逆 / 反直觉**的决策，落地为 `decisions/NNNN-*.md`，并在计划中引用
- 计划是**活的**——状态变更必须更新文件，不靠记忆
- 涉及代码变更的计划，每个任务应包含测试验证步骤
- **完成判断**：每个阶段都有明确的"做完什么样"

### 任务粒度

- 每个任务是一个可独立验证的最小单元（2-5 分钟可完成）
- 每个任务必须包含：涉及的文件路径、预期行为、验证方式
- 禁止占位符："TBD"、"类似 Task N"、"添加适当的错误处理"

### 3. Maintain（维护）

- 执行中：每完成一阶段就更新计划文件（勾选、补充、调整）
- 结束：把结论写回 `agents.md`，或归档到 `decisions/`
- 过期调研：在 `research/` 笔记上标 `status: superseded-by-plan-X`
- **完成判断**：`agents.md` 始终反映项目当前状态

## Bootstrap 流程（首次进入 / 整改存量）

详细步骤见 [references/bootstrap-checklist.md](./references/bootstrap-checklist.md)。核心四件事：

1. 读 `README.md`、根目录、CI / 脚本配置，摸清项目是什么
2. 跟用户确认两件事：
   - 用**默认布局**还是复用已有结构
   - `agents.md` 的重点（业务领域 / 团队约定 / 工具链 / 其他）
3. 写 `agents.md`（用 [references/agents-md.template.md](./references/agents-md.template.md)），按需建空目录
4. 跟用户确认 **Agent 工作准则**（防发散、落盘优先、基于原始代码、控制上下文、文档持续重构、深度对齐、测试先行、系统化调试）——模板中有默认简版，根据项目实际情况增减；如已安装对应 skill（grill-me、tdd、diagnose 等），可将简版替换为引用
5. 在 `agents.md` 里登记本次 bootstrap 决策（可选写一条 `decisions/`）

## `agents.md` 模板

完整模板见 [references/agents-md.template.md](./references/agents-md.template.md)，可被本 skill 或其他 skill 复制引用。

最小可用版：

```md
# <项目名> — Agent Brief

## 概览

- 业务一句话、关键入口

## 约定

- 包管理器 / 目录约定 / 命名规则 / **不要做的事**

## Agent 工作准则

- 落盘优先 / 防发散 / 基于原始代码 / 控制上下文 / 文档持续重构
- 详见模板 [references/agents-md.template.md](./references/agents-md.template.md)

## 当前任务焦点

- **当前**：<任务名 — 对应 plans/ 中的文件>
- **下一步**：<接下来的任务>

## 当前计划

- [plans/<name>](plans/<name>.md) — 状态

## 决策索引

- [decisions/NNNN-xxx](decisions/NNNN-xxx.md) — 选 X 不选 Y 的原因

## 调研索引

- [research/YYYY-MM-DD-topic](research/YYYY-MM-DD-topic.md) — <结论>
```

## 输出风格

- 默认**只给建议、不动文件**；用户确认后再写入
- 涉及删除、覆盖、迁移、数据库改动等高风险动作前必须显式确认
- 目录与文件命名遵循项目既有约定；没有约定就用上面的默认
- **Token 意识**：`agents.md` 是每次会话都要加载的文档，控制体量。准则用速查表不用长文，细节拆到 `research/` 按需读取。避免 agent 用大量 token 读取文档却只解决一个小问题

## 与其他 skill 的边界

以下 skill **不强制安装**。未安装时，`agents.md` 模板的"Agent 工作准则"段已包含简版约束；已安装则可替换为引用，获得更完整的方法论。

- **grill-me / grill-with-docs**：深度追问式对齐。简版约束见模板"深度对齐"段
- **to-prd / to-issues**：需求复杂、需多人协作时升级走 PRD。本 skill 的"计划"粒度更轻，通常够用
- **tdd**：RED-GREEN-REFACTOR 循环。简版约束见模板"测试先行"段
- **diagnose**：系统化调试循环。简版约束见模板"系统化调试"段
