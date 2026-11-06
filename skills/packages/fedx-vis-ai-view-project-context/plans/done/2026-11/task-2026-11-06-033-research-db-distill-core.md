# Task · 2026-11-06-033-research-db-distill-core

> research 数据层 SQLite 化：materials.db 单库替代日期快照 json + temp 临时文件，勘察/状态/画像能力统一收敛到 scripts/distill-core/。台账母任务：../../task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-033-research-db-distill-core` |
| Status | 已完成 |
| 类型 | infra（脚本 + 数据层，不改业务代码） |
| 影响范围 | `.trae/fedx-vis-ai-view-project-context/research/`（新增 materials.db、README 重写、旧 json 归档、temp/ 退役）、`scripts/distill-core/`（新增脚本包）、根 `.gitignore`、`scripts/sync-distill-status.cjs` 与 `distill-profile.mjs`（旧实现退役） |
| Roadmap | 阶段 3 支撑设施 |
| 验收标准 | 见 A1–A6 |
| 前置依赖 | Node 26（node:sqlite 内置稳定，零第三方依赖；脚本统一 ESM .mjs） |

---

## 目标（Goal）

把 research 数据层从「按日期快照 json + temp 过程文件」迁移为**单库 SQLite 持久层**，全部能力收敛到 `scripts/distill-core/`：

1. 跨项目对比（换项目时按 normalized_hash / profile 匹配已勘察模块）
2. 蒸馏状态对账（每次硬门槛②后 sync，立项前先 sync，杜绝重复立项）
3. 单模块画像常驻（profile 不再落 temp，用完即弃 → 直接入库）
4. **唯一持久形态：materials.db（进 git）+ stdout 人读视图**；temp/ 与日期快照 json 模式退役

## 技术设计

### 表结构（research/materials.db）

```sql
CREATE TABLE module_survey (
  id INTEGER PRIMARY KEY,
  project TEXT NOT NULL,          -- 如 'oss-visual-gd-emergency-support'
  center TEXT, section TEXT, module TEXT,
  source_path TEXT,
  files INTEGER, size_kb REAL,
  normalized_hash TEXT,           -- 相似模块识别键
  tier TEXT, tier_reason TEXT, confidence REAL,
  similar_to TEXT,                -- JSON 字符串
  exports_json TEXT,
  surveyed_at TEXT,
  UNIQUE(project, center, section, module)
);
CREATE TABLE distill_status (
  module_survey_id INTEGER PRIMARY KEY REFERENCES module_survey(id),
  status TEXT NOT NULL,           -- distilled / not-started / enhanced / shelved
  matched_material TEXT,
  decided_by TEXT, decided_at TEXT, reason TEXT
);
CREATE TABLE module_profile (
  module_survey_id INTEGER PRIMARY KEY REFERENCES module_survey(id),
  profile_json TEXT NOT NULL,     -- 依赖清单、组件结构、体量、需内联点等
  profiled_at TEXT
);
```

### scripts/distill-core/ 脚本包（全部 node:sqlite，ESM .mjs）

| 脚本 | 作用 |
| --- | --- |
| `lib.mjs` | 公共：开库/建表/迁移、checkpoint、ALIAS 表、错误处理 |
| `import-survey.mjs <json>` | 旧 survey json 一次性导入（幂等 UPSERT） |
| `sync-status.mjs` | 对账 docs/materials manifest → 增量更新 distill_status（替代旧 sync-distill-status.cjs） |
| `profile.mjs <模块路径>` | 单模块画像：扫源码 → UPSERT module_profile + stdout 人读视图（不落任何文件） |
| `query.mjs <pending\|similar\|duplicates\|status>` | 人读查询视图，stdout 输出 |

### 迁移与退役

- 旧 `scripts/sync-distill-status.cjs`、`distill-profile.mjs` 删除（能力并入 distill-core）
- `research/2026-11-05-distill-survey-*.json` 导入后移入 `research/archive/`（历史事实源封存，不删）
- `research/temp/` 删除；README 重写为 db 时代约定（含 status 枚举语义、ALIAS 登记、跨项目用法）
- `.gitignore` 增 `*.db-wal` / `*.db-shm`；`materials.db` 进 git
- 脚本收尾 `PRAGMA wal_checkpoint(TRUNCATE)`，防 WAL 边车残留

## 不做清单

- 不引入第三方 npm 依赖（node:sqlite 为 Node ≥22.5 内置；若运行环境不满足，上报用户决策而非自行装包）
- 不存逐文件源码全文（只存画像/结构摘要，控制体积）
- 不做 Web UI / 持久化 md 报表（人读视图仅 stdout）
- 不改 docs/materials 物料与 plans 任务卡结构（12 张蒸馏卡不受影响）
- 不做多项目并发写入加锁（单机单人使用场景，超范围）

---

## 步骤（执行计划）

### 步骤 1：distill-core 脚本包 + 建库
- **输出**：`scripts/distill-core/`（lib/import/sync/profile/query 五个 .mjs）+ `research/materials.db`
- **等待用户**：否

### 步骤 2：数据迁移与退役
- **动作**：import 旧 json → sync 全量对账 → 旧脚本/temp/archive 处置 → README/.gitignore 更新
- **验证**：`query.cjs pending` 输出与 current-sprint 12 张在办卡一致；`query.cjs similar` 能命中已聚类模块；`pnpm build` 不受影响（纯 infra 改动，跑一次确认）
- **等待用户**：否

### 步骤 3：硬门槛②
- **等待用户**：是

---

## 验收 checklist

- [x] A1：materials.db 三表建成，旧 survey 40 项全量导入（含 distillStatus 回填字段）
- [x] A2：`sync-status.mjs` 对账结果 = 2 distilled / 38 not-started，与 11-06 人工对账一致
- [x] A3：`profile.mjs`（实测 survey id=20 network-scale）画像入库且 stdout 可读，全程无临时文件产生
- [x] A4：`query.mjs` 五个子命令（pending/similar/duplicates/status/tiers）均可用，pending 14 行 B/C 与 plans 在办卡经合并口径对齐
- [x] A5：temp/ 退役（本就未建）、旧脚本删除、旧 json 入 archive/、README 重写、.gitignore 更新，残留引用仅剩描述退役历史的合理提及（grep 校验通过）
- [x] A6：research/ 下持久产物仅 materials.db（+archive 历史封存）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user |
| ② 实现验收 | 已通过 | 2026-11-06 | user（「可以归档 task033 034」） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡。方案经多轮收敛：json 快照 → SQLite（node:sqlite 零依赖）+ temp 退役 + 能力收敛 scripts/distill-core/。
- 硬门槛①批准（含修订：ESM .mjs / Node 26；路径锚定改 process.cwd()——用户指出 __dirname 相对上溯换电脑会失效，加 assertRepoRoot() 校验）。
- 实现中修 bug ×2：ROOT 少算一级致库误建 .trae/research/（已删重建）；MATERIALS_DIR 同类问题 + 物料目录为三层结构，listMaterials 改递归扫 manifest.json。
- 五脚本完成；导入 40 项；对账 = 2 distilled / 38 not-started（与 11-06 人工对账一致）；profile 实测 id=20；query 五子命令验证通过。
- 退役完成：旧 sync-distill-status.cjs / distill-profile.mjs 删除，旧 json 入 archive/（12 张任务卡引用路径同步改 archive/），research/README 重写，根 .gitignore 加 *.db-wal/-shm/-journal。
- `pnpm build` 复验通过（41.39s，infra 改动零影响）。待硬门槛②。
- 硬门槛②通过（用户批准归档）。后续 task-034 在本卡基础上进一步收敛：import-survey 退役（survey 直接入库）、profile.mjs 改复用 profile-core、profile-core 移入 distill-core/——最终形态以 task-034 归档卡为准。

---

## 关联

> - 台账母任务：../../task-2026-11-03-002-component-inventory.md
> - 旧事实源 json 已删除（2026-11-06 方案 A 收敛，人工审定档固化于 materials.db distill_status.reason）
> - 04-script-first rule：脚本仅 Node 内置 API、幂等、显式退出码
