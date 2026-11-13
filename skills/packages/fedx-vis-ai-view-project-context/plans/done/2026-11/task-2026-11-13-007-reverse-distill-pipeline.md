# Task · 2026-11-13-007-reverse-distill-pipeline

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-007-reverse-distill-pipeline` |
| Status | 已批准 |
| 类型 | 编码 / docs / skill |
| 影响范围 | `docs/skeleton/scripts/`（新增产料打包脚本）、`docs/workflows/`（新增逆向蒸馏工作流文档）、`scripts/`（新增收料导入脚本）、`pnpm-workspace.yaml`（如涉及） |
| Roadmap | 阶段 5 · 闭环验证与迭代优化（首任务） |
| 验收标准 | 宿主项目内 AI 现写的组件可按指引打包为物料 zip → 物料站一键导入 → 过质量门槛 → 人工 review 合入 → `export:skill` 发布新版 |
| 前置依赖 | task-2026-11-13-006（骨架收敛 + `apps/playground` 验证回路）；领导定调（项目内产料、组件=代码、否决 DSL） |

---

## 目标（Goal）

打通「宿主项目（如 hermes showcase）内 AI 现写组件 → 逆向蒸馏为物料 → 回流物料站 → 重新发布 skill」的半自动管道，使组件沉淀不依赖历史项目盘点，形成持续产料闭环。

---

## 背景与动机

- 阶段 1~4（历史项目蒸馏）已完成 35 个物料；阶段 5 要求「项目内产料」闭环
- 用户场景：在 hermes showcase 完成能力后，感觉物料可复用，希望低成本提炼回物料站
- 现状：物料生产只有「历史项目 → 正向蒸馏」路径，无「项目内现写组件 → 逆向回流」路径

---

## 功能列表

- F1 **产料打包脚本**（`docs/skeleton/scripts/export-material.mjs`，随骨架/skill 分发）：
  - 校验四件套结构完整性（manifest 含 runtime 块 / spec / data-model / code / examples）
  - 校验蒸馏约束：自包含、无跨模块 import、依赖白名单、examples 自带 mock
  - 产出 `material-<name>.zip`（含目录结构与校验清单）
- F2 **skill 内工作流文档**（`docs/workflows/material-distill.md`，暂名）：
  - 指导宿主侧 AI：何时值得提料、如何剥离请求/路由/环境耦合、如何填 propsContract、如何跑打包脚本
  - 按「导出产物视角」书写路径（与 schema-mode.md 同规范，由 export-skill.mjs 拷入 skill）
- F3 **收料导入脚本**（`scripts/import-material.mjs`，物料站侧）：
  - 解包 zip → 落位 `docs/materials/<分组>/<模块>/`
  - 自动跑质量门槛（`pnpm build` / `pnpm check:material-registry` / playground 用例）
  - 提示人工 review（硬门槛：不合入不合版）

---

## 不做清单

- 不做全自动合入（外部 AI 产物必须人工 review）
- 不做平台化管理界面（物料台账仍以 `research/materials.db` + 文件系统为准）
- 不在本任务内修改既有 35 个物料的结构
- 不做 zip 的网络传输（下载/拷贝由用户手动完成）

---

## 步骤（执行计划）

### 步骤 1：处置评审（硬门槛①）

- **动作**：按功能列表 F1~F3 评审方案（脚本放位、工作流文档命名、收料门槛清单），用户拍板
- **输出**：批准的处置结论
- **等待用户**：是

### 步骤 2：F1 产料打包脚本 + F2 工作流文档

- **动作**：实现 export-material.mjs；撰写 material-distill.md（导出产物视角路径规范）
- **输出**：骨架内脚本 + skill 工作流文档；`pnpm export:skill` 验证文档被正确拷入
- **等待用户**：否

### 步骤 3：F3 收料导入脚本

- **动作**：实现 import-material.mjs（解包落位 + 自动门槛 + review 提示）
- **输出**：物料站侧脚本；用 playground 验证用例走一遍完整回路（模拟 zip → 导入 → 门槛 → review）
- **等待用户**：否

### 步骤 4：端到端演练与验收（硬门槛②）

- **动作**：用一个真实/模拟的宿主产料 zip 走完整管道，验证发布新版 skill
- **输出**：验收结论 + 文档回填
- **等待用户**：是

---

## 技术设计与实现记录（回填 · 2026-11-13）

### 交付物

| 功能 | 文件 | 说明 |
| ---- | ---- | ---- |
| F1 打包 | `docs/skeleton/scripts/export-material.mjs` | 随骨架/skill 分发，零依赖；校验四件套 + 提炼约束；store-only zip 自实现（CRC32 + central directory，无外部依赖） |
| F2 工作流 | `docs/workflows/material-extract.md` | 导出产物视角（宿主项目内运行 `scripts/export-material.mjs`），按用户定调不使用「蒸馏」字样 |
| F3 收料 | `scripts/import-material.mjs`（`pnpm import:material`） | 解包（防路径穿越）→ 同规则校验 → 落位 `docs/materials/<分组>/<模块>/` → 三门槛（build / check:material-registry / playground build）→ 失败默认回滚（`--keep-on-fail` 保留） |

### 关键设计决策

- **zip 格式**：store-only 自实现（宿主侧脚本零依赖分发；收料侧只解自家 zip，method≠0 直接报错）
- **包元信息**：zip 根含 `MATERIAL-PACKAGE.json`（format/version/module/group/createdAt）
- **依赖白名单**：react 系之外须在 manifest `deps` 显式声明；禁 `@/materials`、`@/src` 别名与绝对路径 import；相对 import 解析后不得逃出物料目录
- **已存在即拒绝**：目标目录已存在时收料退出（升级物料须人工 review 手动替换）
- **schemaable 物料的鸡生蛋问题**：playground registry 注册属人工步骤——门槛失败时提示先注册再重导；`--keep-on-fail` 支持落位后修复

### 端到端演练结论（硬门槛②证据）

模拟物料 `stat-card`（business 组，schemaable type=demo-stat-card）走完整管道：

1. export-material.mjs 打包通过（含一次 central directory 字段偏移 bug 修复）
2. import-material.mjs 首次导入 → registry 门槛失败 → 回滚路径验证
3. `--keep-on-fail` 落位 + playground registry 注册 + `code/` 拷入 playground 后：`pnpm build` / `pnpm check:material-registry`（8/8）/ `pnpm check:skeleton-mirror` / playground build 全过
4. `pnpm export:skill` 产物含 `workflows/material-extract.md`、`skeleton/scripts/export-material.mjs`、`specs/stat-card/`
5. 演练物料已清理，仓库恢复原状（registry 回 7 键）

- **镜像同步**（用户验收时补充的要求）：`export-material.mjs` 同时落位 `apps/playground/scripts/`，纳入 check-skeleton-mirror 白名单（现 15 个共有文件）；骨架侧脚本改动须同步 playground 并在 playground 内实测（已实测：非法目录名拒绝 + 合法物料打包成功）

### 踩坑

- Windows 上 `rm(force:true)` 可能静默失败（回滚后目录仍存在）→ 回滚改为 `force:false` + existsSync 断言，回滚不彻底时显式报错

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | 工作流文档命名（material-distill.md vs 其他） | 用户 | 已关闭 | 定为 `material-extract.md`（用户要求不体现「蒸馏」，称「提炼」） |
| 2 | zip 内 examples 的 mock 是否允许引用宿主环境数据 | 用户 | 已关闭 | 禁止，必须自包含 |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-13 | 用户 |
| ② 实现验收 | 已通过（2026-11-13，用户验收通过并指示归档；归档前 review 修复一处 playground CRLF 漂移致 mirror 失败，复检 15/15） | 2026-11-13 | 用户 |

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [x] `roadmap.md` —— 阶段 5 进度更新
- [x] `env/AGENTS.md` —— `pnpm import:material` 已入质量门槛命令清单

---

## 关联

> - 前置：task-2026-11-13-006-manual-review-fixes（playground 验证回路）
> - 相关：roadmap.md 阶段 5；references/distill-workflow.md（正向蒸馏方法论，本任务为逆向补充）
