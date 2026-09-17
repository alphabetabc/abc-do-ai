---
description: oss-visual-designer 项目规则：文档目录与落位原则、命名规范、任务管理流程、依赖与脚本纪律。本仓专用。
alwaysApply: true
---

# 04 · 项目规则

## 1. 目录与位置

- 项目文档：本 skill `oss-visual-designer-project-context/`
    - 设计/架构文档：`design/`
    - 调研文档：`research/`
    - 变更计划：
        - 待办/进行中：`plans/` 根目录
        - 已完成归档：`plans/done/`
        - 任务路线图：`plans/roadmap.md`
        - 待评估项（未立项想法/待办）：`plans/backlog.md`
- Skill 文档：`.trae/skills/{skill-name}/SKILL.md`

## 2. 命名规范

- 设计/调研/规则文档：中文文件名 + `.md`，清晰描述内容（例：`综合展示中心文档.md`）
- 变更计划（plans）：`task-YYYY-MM-DD-NNN-{topic}.md`，同一天多个任务递增 NNN（001、002 …），例：`task-2026-07-20-001-redux-modernization.md`
- Skill 目录：英文小写，多个单词用 `-`（例：`data-analysis`）

## 3. 任务管理流程

### 3.1 新任务

1. 在 `plans/` 根目录创建 `task-YYYY-MM-DD-NNN-{topic}.md`
2. 在 `roadmap.md` 索引表追加一行，状态置为 `planning` 或 `in-progress`

### 3.2 任务进行中

- 详细过程记录在 `task-*.md` 的"实施记录"章节
- 状态变更时同步更新 `roadmap.md`
- 临时想法（未立项的）记到 `plans/backlog.md`，不要混进 roadmap

### 3.3 任务完成

1. 把 `task-*.md` 移动到 `plans/done/`
2. 在 `roadmap.md` 中把状态改为 `done`，填入完成日期
3. 同步更新 `AGENTS.md` 中相关引用（如有）

> `cancelled` 任务同样归档到 `plans/done/`（保留 cancelled 状态与取消说明，roadmap 链接指向 `./done/`）。根目录只保留 `planning` / `in-progress` / `blocked` 活跃任务。

### 3.4 待评估项（backlog.md）

- 用于记录**未正式立项**且尚未落到设计文档的想法、待办、待确认项（唯一暂存区，不再另设 memo）
- 决定立项 → 在 `plans/` 创建 task 文件 + 在 `roadmap.md` 追加索引 + 从 backlog 删除
- 决定放弃 → 从 backlog 删除

### 3.5 任务状态

- `planning` — 计划中，未开工
- `in-progress` — 正在执行
- `done` — 已完成并归档到 `done/`
- `blocked` — 阻塞中，需要外部输入或决策（保留在根目录）
- `cancelled` — 取消，不再推进（归档到 `done/`，保留 cancelled 状态与取消说明）

## 4. SKILL.md 必含内容

- 名称与描述、功能特性、使用方法、输入输出示例、依赖关系

## 5. 依赖与工作区

- 包管理器：统一使用 **pnpm**，禁止 npm/yarn
- 工作区：pnpm workspace（根目录含 `pnpm-workspace.yaml`），可用 `--filter` 指定工作区

## 6. 脚本编写

- 需要执行脚本（文件批量替换、数据处理、代码生成等）时，在 `.trae/scripts/` 目录下创建 Node.js `.mjs` 脚本，用 `node .trae/scripts/xxx.mjs` 运行
- **禁止**用 PowerShell `Set-Content` / `Get-Content` 等命令修改含中文的文件（会破坏 UTF-8 编码）
- 脚本中读写文件必须显式指定 `utf-8` 编码
- 脚本用完即留，方便复用
