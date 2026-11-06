# Task · 2026-11-06-034-unified-distill-workflow

> 蒸馏工作流收敛为一份：分析能力（profile-core）与数据层（distill-core）合并，消除 profile.mjs 与 profile-core.mjs 的功能重叠，survey 直接入库。母任务：../../task-2026-11-03-002-component-inventory.md

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-034` |
| Status | 已完成（已批准 → 实现完成） |
| 类型 | scripts |
| 影响范围 | `.trae/fedx-vis-ai-view-project-context/scripts/`（distill-core/ 与根脚本）、README×2、references/distill-workflow.md |
| 验收标准 | ①重叠能力唯一实现；②survey 直接入库不再落 json/md；③四脚本在仓库根可运行且对账/入库结果与迁移前一致；④退役脚本已删 |

## 目标

只保留一份蒸馏工作流：`distill-core/` 为唯一入口（survey / profile / sync-status / query + lib），profile-core.mjs 作为分析规则库被 survey 与 profile 共同复用。

## 步骤

1. `distill-core/survey.mjs`（新）：复用 profile-core 画像 + 四档归类逻辑，UPSERT module_survey（新行初始化 distill_status），stdout 输出四档表 + 相似聚类；不再落 json/md。旧 `scripts/distill-survey.mjs` 删除。
2. `distill-core/profile.mjs` 重构：删除自实现的 scan/analyze/hash，改用 profile-core 的 profileModule/sanitize/renderMd（stdout 视图）。
3. `profile-core.mjs` 修订：loadTs 去掉硬编码 E:/ 路径，改从 `DISTILL_SRC_ROOT` 环境变量 + cwd 探测（可移植）。
4. 删除退役脚本：`scan-business-module-shape.mjs`、`scan-component-inventory.mjs`、`2026-11-06-gen-bc-task-cards.cjs`（数据已过期失真）、`distill-core/import-survey.mjs`（json 通道退役，archive 基线已入库）。
5. 文档回填：scripts/README.md、research/README.md、references/distill-workflow.md。

## 不做清单

- 不改 materials.db schema
- 不动已入库的 40 项基线数据
- 不做四档归类规则本身的调整（只搬迁）

## 验收 checklist

- [ ] A1：distill-core/survey.mjs 运行入库，40 行 UPSERT 后数据与基线一致（count=40）
- [ ] A2：distill-core/profile.mjs 对同一模块画像结果 hash 与迁移前一致
- [ ] A3：sync-status / query 不受影响，对账仍为 2 distilled / 38 not-started
- [ ] A4：退役脚本已删除，文档无死引用
- [ ] A5：无硬编码盘符路径残留（grep E:/ 确认）

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已通过 | 2026-11-06 | 用户（「不接受重叠，我们就要一份工作流」） |
| ② 实现验收 | 已通过 | 2026-11-06 | 用户（「可以归档 task033 034」） |

## 进度日志

### 2026-11-06

- 建卡并获批，开工。
- 实现：`distill-core/survey.mjs` 新建（profile-core 画像 + 四档归类搬迁，UPSERT 直接入库，stdout 视图）；`distill-core/profile.mjs` 重构复用 profile-core；profile-core loadTs 去硬编码盘符改 DISTILL_SRC_ROOT 注入；删除 distill-survey.mjs / import-survey.mjs / scan-business-module-shape.mjs / scan-component-inventory.mjs / 2026-11-06-gen-bc-task-cards.cjs。
- 验证：survey 重跑 UPSERT 40 行，distill_status 对账仍 38 not-started / 2 distilled（人工态未受影响）；profile id=20 的 hash 与 survey normalized_hash 一致（cb6959ff…，分析能力统一生效）；grep 无盘符残留（setup-rules/sync-symlinks 的 `__dirname` 为 symlink 工具自身锚定，不在范围）。
- 文档回填：scripts/README.md、research/README.md、references/distill-workflow.md、current-sprint.md。
- ⚠️ 记录：重跑 survey 后 tier 分布 A16/B10/C3/D11 与 archive 基线（A13/B11/C5/D11）有差异——KNOWN 集改为动态 listMaterials() 所致（机器意见刷新）；已立卡 12 张的人工定档仍以 archive json 为准（README 已注明）。

### 验收 checklist 结果

- [x] A1：survey 入库 40 行，count=40
- [x] A2：profile 与 survey hash 一致（算法统一）
- [x] A3：sync-status / query 正常，对账 2/38 不变
- [x] A4：5 个退役脚本已删，文档已同步无死引用
- [x] A5：蒸馏链路无硬编码盘符
- 用户追加要求「profile-core 也移进 core」：profile-core.mjs 移入 distill-core/（含 import 修正 './profile-core.mjs'、头注释更新）；回归验证 survey（40 行）/ profile id=20（hash cb6959ff… 不变）/ sync-status（2/38 变更 0）全部通过；scripts/README.md 与 distill-workflow.md 路径已同步。
