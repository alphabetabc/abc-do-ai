# Task · 2026-09-04-001-symlink-scripts

## 任务元信息

| 项       | 值 |
| -------- | --- |
| 编号     | `TASK-2026-09-04-001-symlink-scripts` |
| Status   | 🟢 已完成 |
| 类型     | 仅 skill 维护 |
| 影响范围 | `scripts/setup-rules.mjs`、`scripts/sync-symlinks.mjs`、`.trae/rules/`、`.trae/AGENTS.md`、根目录 `.pnpmfile.cjs` |
| Roadmap  | `plans/roadmap.md` 季度目标 4「skill 与 docs 闭环」 |
| 验收标准 | 三个 symlink 目标全部创建且健康校验通过 |
| 前置依赖 | 无 |

---

## 目标（Goal）

改造 skill 内两个 symlink 脚本，使本项目自身的 AI 协作资产（rules / AGENTS.md / .pnpmfile.cjs）通过 symlink 部署到位：`env/rules/*` → `.trae/rules/`，`env/AGENTS.md` → `.trae/AGENTS.md`，`env/.pnpmfile.cjs` → 项目根 `.pnpmfile.cjs`。

## 步骤（执行计划）

### 步骤 1：改造脚本

- **动作**：`setup-rules.mjs` 默认目标目录改为 `.trae/rules`；`sync-symlinks.mjs` 扩展为同步 AGENTS.md → `.trae/AGENTS.md` 与 `env/.pnpmfile.cjs` → 根 `.pnpmfile.cjs`。
- **输出**：两个脚本更新。
- **🛑 等待用户**：否

### 步骤 2：执行与验证

- **动作**：以项目根为 target 运行两个脚本，验证 symlink 健康状态。
- **输出**：`.trae/rules/*`、`.trae/AGENTS.md`、根 `.pnpmfile.cjs` 三个（组）symlink。
- **🛑 等待用户**：否

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 已移除本任务索引行
- [x] `backlog.md` —— N/A（未登记过）
- [x] `plans/roadmap.md` —— N/A（进度以本卡为准）

## 执行结果

- `.trae/rules/01-link-format.md`、`.trae/rules/02-no-hallucination.md` → symlink 健康（setup-rules.mjs 幂等确认 already linked）。
- `.trae/AGENTS.md` → symlink 健康校验 OK。
- 根 `.pnpmfile.cjs` → symlink 健康校验 OK。
- 备注：`.trae/skills/oss-shaanxi-gold-building-project-context` 本身是指向 `.agents/skills/...` 的 Junction，两个 skill 目录是同一份文件。
