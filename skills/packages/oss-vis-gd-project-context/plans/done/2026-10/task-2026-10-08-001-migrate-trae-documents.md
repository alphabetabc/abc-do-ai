# Task · 2026-10-08-001-migrate-trae-documents

## 任务元信息

| 项       | 值                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-08-001-migrate-trae-documents`                                                                                             |
| Status   | 已完成                                                                                                                                   |
| 类型     | docs / skill                                                                                                                             |
| 影响范围 | `.trae/skills/oss-vis-gd-project-context/plans/**`、`design/**`、`references/**`（新建文件）；源 `.trae/documents/**` 只读不动           |
| Roadmap  | `plans/roadmap.md`（迁移后写入首个条目）                                                                                                 |
| 验收标准 | `.trae/documents` 中的决策与结论全部迁入 skill，skill 内无指向 `.trae/documents` 的断链；验收通过后已迁移源文件被删除                   |
| 前置依赖 | 无                                                                                                                                       |

---

## 目标（Goal）

把 `.trae/documents`（工作区文档：roadmap 决策记录、docs 功能描述、归档 plan、research 结论、docs-link 图谱）中有长期价值的内容迁移到 `oss-vis-gd-project-context` skill 内，使 skill 成为自足的深度事实来源。迁移完成并验收通过后删除 `.trae/documents/**`。

---

## 步骤（执行计划）

### 步骤 1：迁移 roadmap 决策与进度

- **动作**：把 `.trae/documents/roadmap.md` 的 D-A / D-B / D-C / D-D 四系列决策表、当前阶段、下一步（P0~P4）迁入 `plans/roadmap.md`；操作日志 66 条不全文搬，只保留「已完成阶段摘要」一行式时间线。
- **输出**：`plans/roadmap.md`（实质内容替换「待 init」）
- **等待用户**：否

### 步骤 2：迁移 docs 树功能描述

- **动作**：把 `.trae/documents/design/docs-function-description.md`（12 节：docs/ 7 子目录职责、9 件套协作流程、谁写谁读边界）迁入 `design/docs-tree-guide.md`（新建，kebab-case）。其中指向 `.trae/` / `.local-docs/` 的引用（§11 关联文档 2 条）按 01-link-format 改为仓库根相对路径或删除；`../../docs/...` 相对链接改为根相对。
- **输出**：`design/docs-tree-guide.md`
- **等待用户**：否

### 步骤 3：迁移 docs-link 图谱

- **动作**：`.trae/documents/docs-link/README.md`（docs/ 互链规则 + mermaid graph）+ `graph.json` 迁入 `references/docs-link/`（低频稳定资料，符合 references 定位）。
- **输出**：`references/docs-link/README.md` + `references/docs-link/graph.json`
- **等待用户**：否

### 步骤 4：归档 plan 与 research 入 skill plans

- **动作**：`plans/done/`（11 份）复制到 skill `plans/done/2026-07/` 与 `plans/done/2026-08/`；`research/`（7 份结论文档）复制到 skill `plans/research/`；`scripts/`（11 个）复制到 skill `scripts/`（与 setup-rules / sync-symlinks 同目录）。复制后 grep 清理其中的 `.trae` 自引用表述（保留内容、修路径）。
- **输出**：`plans/done/**`（11 文件）+ `plans/research/**`（7 文件）+ `scripts/**`（11 文件）
- **等待用户**：否

### 步骤 5：更新索引、删除源文件与收尾

- **动作**：`plans/current-sprint.md` 登记本任务；`plans/roadmap.md` 加迁移条目；SKILL.md Pointer Map 的 references 行去掉「（可选）」标注实际内容；版本号 bump 0.3.0。**验收通过（硬门槛②）后**删除整个 `.trae/documents/` 目录（含 scripts/，已复制到 skill）。grep 自检（无 `../` 上溯、无 `.trae/documents` 引用残留）。
- **输出**：索引更新 + 自检报告
- **等待用户**：是（硬门槛②验收）

---

## 不做清单

- 迁移期间不修改 `.trae/documents/**` 源文件；删除动作在硬门槛②验收通过后执行，届时 `.trae/documents/` 整目录删除
- 同步更新 D-13 脚本位置约定：skill `env/rules/04-script-first-rule.md` 的脚本存放路径改为 `.trae/skills/oss-vis-gd-project-context/scripts/`
- 不把操作日志 66 条逐条搬入（只留阶段摘要）
- 不动 `docs/`（对外交付物）
- 不跑 lint/build（纯文档任务，N/A）

---

## 验收 checklist

- [x] A1：`plans/roadmap.md` 含 D-A~~D-D 决策表 + P0~~P4 下一步，无「待 init」
- [x] A2：`design/docs-tree-guide.md` 无 `../../` 上溯、无 `.trae` / `.local-docs` 引用（仅保留 1 行迁移出处注记）
- [x] A3：skill 内新增文件（1 design + 2 docs-link + 11 done + 7 research + 11 scripts）全部可读
- [x] A4：grep `oss-vis-gd-project-context` 内无 `\.\./\.\./` 上溯、无 `.trae/documents` 引用（残留均为迁移出处注记与 research 历史散文，非断链）
- [x] A5：`.trae/documents` 源目录 git status 无改动（迁移期间）
- [x] SKILL.md 版本 0.3.0，Pointer Map 与实际文件一致

---

## 审批记录

| 门槛       | 状态                                 | 日期       | 批准人 |
| ---------- | ------------------------------------ | ---------- | ------ |
| ① 需求审批 | 已批准（含 scripts/ 一并迁移的变更） | 2026-10-08 | user   |
| ② 实现验收 | 已验收                               | 2026-10-08 | user   |

---

## 实现记录（2026-10-08）

- 步骤 1~3：roadmap / docs-tree-guide / docs-link 按计划迁入，链接改根相对。
- 步骤 4：复制 done 11 + research 7 + scripts 11 入 skill；按 D-13 写两个批处理脚本修正路径：
  - `scripts/2026-10-08-fix-migrated-doc-links.js`：把 `](../...)` 历史链接改为仓库根相对反引号路径（含「多写一层 ../」时的重锚定回退），共修正 157 处
  - `scripts/2026-10-08-rewrite-trae-documents-refs.js`：把迁入文件内 `.trae/documents/...` 旧路径改写为 skill 新路径，共 117 处
- 步骤 5：SKILL.md bump 0.3.0（Pointer Map 补 done/research/docs-tree-guide/docs-link 行）；current-sprint 状态更新；D-13 脚本位置约定在 `env/rules/04` + `env/rules/README.md` 同步为 skill scripts/。
- 发现遗留问题（不在本任务范围）：`.trae/rules/docs-authoring-rules.md` 被根 AGENTS.md 引用但文件不存在。
- 硬门槛②验收通过后：`.trae/documents/` 下 33 个文件已全部删除（RunCommand 权限服务 502，改用 DeleteFile 逐文件删除）；残留空目录 shell 无法清理，git 不追踪空目录，仓库层面等效已删除。

## 关联

> - 源目录：`.trae/documents`（已删除）
> - 相关 rule：`oss-vis-gd-project-context/env/rules/01-link-format.md`（迁移时的路径修正依据）
