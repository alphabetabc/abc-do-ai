---
name: 'agent-creator'
description: 'Interactive guide to create and integrate agents into arbitrary projects by scanning the codebase and producing step-by-step implementation plans and verification scripts.'
---

# Agent Creator Skill（交互式项目导向引导）

## 目的与概述

- 本 Skill 用于在不同项目中交互式引导用户创建 agent。重点不是一次性生成完整模板文件，而是通过读取项目结构与内容，分析适配点，然后以逐步引导、检查清单与可执行建议的形式帮助用户完成 agent 的设计与实现。

## 适用场景

- 新项目初始化时引导设计 agent
- 将 agent 集成到现有前端/后端/数据工程项目
- 在代码库中识别最佳接入点并生成实现步骤与验证用例

## 工作方式（高层）

1. 扫描项目：读取并解析关键文件（`package.json`、`pyproject.toml`、`README.md`、源代码目录、CI 配置等），并识别包管理器约定（Node 项目优先 `pnpm`，Python 项目优先 `uv`）。
2. 分析能力：根据语言、依赖、架构推断可行的 agent 类型与集成策略。
3. 生成计划：给出分步实现清单（优先级、估时、风险点）。
4. 交互引导：按步骤与用户互动（展示代码片段、命令、测试用例），在每一步等待用户确认或让用户选择自动化执行建议操作。
5. 验证与收尾：提供测试用例、验收检查点和提交建议（分支/PR 说明）。

## 交互流程（详细）

- 步骤 A：请求项目路径或工作区（或使用当前工作目录）。
- 步骤 B：扫描并列出发现的关键项（语言、框架、可用脚本、启动命令、现有 webhook/cron、数据库连接配置等），并询问用户确认扫描结果是否正确。
- 步骤 C：推荐 agent 类型（例如：事件监听型、API 后端型、UI 插件型、数据处理型），并给出每种类型的利弊与适配理由。
- 步骤 D：生成实现清单（按步骤细化）。用户可选择“全部显示”或“按步执行”。
- 步骤 E：逐步引导实现：每步给出必要的命令、示例代码片段、配置变更点与回滚建议。对于高风险或需要密钥的步骤，提示安全实践并等待显式确认。
- 步骤 F：生成简单的验证脚本或测试用例，并提示如何运行与验证。

## 提示词模板（示例）

- 系统提示（摘要）：
  "你是一个项目智能体创建助理。你的任务是阅读目标代码库，识别最佳接入点，生成分步实现计划，并在每一步与用户交互、提供可复制的命令或代码片段。遇到敏感信息或高风险操作时必须请求用户确认。"

- 扫描请求（向模型的检索/分析子任务）示例：
  "请读取仓库下的 `package.json`, `tsconfig.json`, `README.md`, `src/`，并列出语言、框架、可运行脚本、已配置的 CI、可能的 webhook 或任务入口。返回 JSON 格式的发现清单。"

- 计划生成示例：
  "基于以下发现清单，针对推荐的 agent 类型（后端 API），生成一个分步实现计划：每一步包括目的、具体命令/代码片段、预期验证方法与风险提示。"

## 扫描器发现与结构化输出

- 本 Skill 应支持结构化的发现清单与实现计划输出，以便在任意 IDE、CLI 或自动化流程中使用。
- 发现清单建议字段：
  - `projectRoot` (string)：项目根路径。
  - `languages` (array[string])：检测到的主要语言。
  - `frameworks` (array[string])：推断的框架或库。
  - `packageFiles` (array[string])：包/依赖文件路径。
  - `scripts` (object)：可用脚本与启动命令，Node 项目优先使用 `pnpm` 触发脚本，Python 项目优先使用 `uv` 运行环境。
  - `entryPoints` (array[string])：应用入口文件或启动命令。
  - `ciConfigs` (array[string])：CI 配置文件路径。
  - `dbConnections` (array[object])：数据库/外部服务连接元数据（不包含凭据）。
  - `webhooks` (array[object])：可能的 webhook/回调定义位置。
  - `tests` (object)：测试框架与运行命令。
  - `riskHints` (array[object])：潜在高风险点，包括 `reason` 和 `location`。
- 实现计划结构建议包含以下字段：
  - `stepId`：唯一标识。
  - `title`：简要目的。
  - `description`：步骤说明。
  - `commands`：推荐命令列表。
  - `codeSnippets`：示例代码片段。
  - `validation`：验证方法。
  - `riskLevel`：风险级别或注意事项。
  - `requiresConfirmation`：是否需要显式确认。

## 通用接口与输出模式

- 输入模式：支持以 JSON 或自然语言指令驱动，例如 `scan project`, `recommend agent`, `build plan`, `generate verification`。
- 输出模式：返回结构化 JSON 结果，并同时保留可读描述文本，便于任意 IDE/CLI/自动化流程消费。
- 输出建议字段：
  - `status`：`success` / `warning` / `error`。
  - `summary`：简要说明本次执行结果。
  - `scanResult`：扫描发现的项目元数据对象。
  - `plan`：分步实现计划数组。
  - `nextActions`：推荐的后续操作。

### 示例 `scanResult`

```json
{
  "projectRoot": ".",
  "languages": ["node"],
  "frameworks": ["express"],
  "packageFiles": ["package.json"],
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  },
  "entryPoints": ["src/index.js"],
  "ciConfigs": [".github/workflows/ci.yml"],
  "tests": {
    "framework": "jest",
    "run": "pnpm test"
  },
  "riskHints": [
    {
      "reason": "包含数据库迁移脚本",
      "location": "scripts/migrate.sh"
    }
  ]
}
```

### 示例 `plan`

```json
[
  {
    "stepId": "setup-agent-shell",
    "title": "初始化 Agent 运行环境",
    "description": "创建 agent 目录和基础配置文件，确保与当前项目依赖兼容。",
    "commands": ["mkdir agent && cd agent", "pnpm init -y"],
    "codeSnippets": [],
    "validation": "检查 agent 目录是否创建并含 package.json。",
    "riskLevel": "low",
    "requiresConfirmation": false
  }
]
```

## 交互式引导策略

- 该 Skill 应把用户需求拆解为“扫描-推荐-计划-执行-验证-回顾”六个阶段。
- 每个阶段由独立响应块表示：当前内容、下一步建议、可选命令、风险提示、是否需要确认。
- 对于每一步，Skill 应提供：
  - `goal`：本步目标。
  - `actions`：建议操作列表。
  - `artifacts`：需要创建或修改的文件/配置说明。
  - `validation`：验证结果的方式。
  - `fallback`：可选回滚或后备方案。
- 在用户继续之前，Skill 不应自动修改工作区中的文件，而是输出明确可执行建议。
- 对于复杂项目，Skill 应支持“复盘/重估”指令，允许用户在任何阶段重新扫描项目并调整计划。

## 提示词与指令模式

- 系统提示：
  "你是一个通用项目 agent 创建助理。你的任务是理解目标仓库结构、推荐最适合的 agent 集成方式，并以分步可执行计划指导用户实施。输出必须兼容结构化 JSON 和可读文本。"
- 任务请求：
  - `scan project`：扫描工程并输出发现清单。
  - `recommend agent`：基于发现结果推荐 agent 类型与集成路径。
  - `build plan`：生成实施计划并标出风险点。
  - `generate verification`：输出验证步骤与测试建议。
- STEP 请求：
  - `next step`：执行并描述当前计划的下一步。
  - `show step <stepId>`：展示指定步骤的详细建议。
  - `confirm step <stepId>`：当步骤包含潜在破坏性动作时请求显式确认。

## 示例对话

### 场景 1：扫描并推荐

用户："扫描当前项目并推荐 agent 类型。"
Skill：

- 检测到语言：`JavaScript/Node.js`
- 框架：`Express`
- 入口文件：`src/index.js`
- 可用脚本：`pnpm start`, `pnpm test`
- 推荐 agent 类型：`后端 API agent`
- 推荐理由：该项目已有服务器端入口且可快速集成中间件和 webhook。

### 场景 2：生成分步计划

用户："按步骤引导我把 agent 集成到后端。"
Skill：

1. 创建 agent 目录和基础配置。
2. 在现有 startup 文件中注册 agent 初始化逻辑。
3. 添加一个 agent 事件处理模块和 webhook 入口。
4. 生成验证脚本并执行基本测试。

### 场景 3：验证与回顾

用户："为 agent 生成验收测试。"
Skill：

- 生成 `pnpm test` 可用的最小测试说明。
- 推荐覆盖点：初始化、路由注册、配置加载、核心业务流程。
- 输出验证命令：`pnpm test -- --runInBand`。

## 能力清单（Skill 支持项）

- 项目感知：识别语言、框架、依赖与脚本
- 建议引导：给出 agent 类型推荐与原因
- 可操作建议：命令、代码片段、配置修改建议（但默认不直接写入文件，除非用户授权）
- 逐步交互：支持按步执行或只给清单
- 验证引导：生成测试/验收步骤
- 集成建议：CI、审计、密钥存储与监控接入点

## 用户交互意图（示例）

- "扫描当前项目并推荐 agent 类型" → 返回发现清单与推荐
- "按步骤引导我把 agent 集成到后端" → 生成并逐步执行清单
- "为 agent 生成验收测试" → 生成可运行的简单测试用例代码与运行命令

## 安全与限制

- 不自动写入敏感文件（如包含凭证的配置）——默认给出修改建议并等待确认。
- 生成 `.gitignore` / secret-scan 提醒并建议使用环境变量或 secret 管理方案。
- 对可能造成破坏的命令（如数据库迁移、删除资源）必须要求显式确认和备份提示。

## 验收标准

- 能够识别项目主要语言与框架并生成匹配的 agent 类型推荐。
- 为常见项目能生成分步实现清单（每步包含命令/示例/验证方法）。
- 提供至少一组可运行的基本验证脚本供用户执行验证。

## 示例互动（短）

1. 用户："扫描仓库" → Skill：列出发现（语言：Node、框架：Express、脚本：start,test）并推荐“后端 API agent”。
2. 用户："按步骤引导我实现" → Skill：生成 6 步实施计划并询问是否按顺序执行第 1 步。
3. 用户："生成验收测试" → Skill：提供 Jest/pytest 的最小测试示例与运行命令。

（此文档为设计草案，后续可根据你的项目偏好扩展具体提示模板与集成说明）
