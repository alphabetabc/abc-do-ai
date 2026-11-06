# research/ · 数据层目录（SQLite 单库）

唯一持久事实源：`materials.db`（SQLite，进 git）。**唯一持久形态 = materials.db + stdout 人读视图**；日期快照 json 与 temp 临时文件模式已退役（2026-11-06，task-033）。

## materials.db

三表（node:sqlite，Node ≥22.5 内置，零第三方依赖）：

- `module_survey` —— 模块勘察记录（project/center/section/module 唯一，tier 四档、normalized_hash、similar_to、明细 JSON）
- `distill_status` —— 蒸馏状态：`not-started` / `queued`（已立卡待执行）/ `distilled` / `enhanced` / `shelved`；`queued` / `enhanced` / `shelved` 为人工决策态，**不被自动对账覆盖**（queued → distilled 由蒸馏完成后 sync 升级，人工改）
- `module_profile` —— 单模块画像（文件树、deps、hooks、exports、需内联点、normalized_hash）

> 历史 json 基线（2026-11-05 survey 快照）已随方案 A 收敛删除（2026-11-06）：人工审定档固化在各模块 `distill_status.reason`，db 是唯一事实源。

维护脚本：`../scripts/distill-core/`（一律在物料站仓库根目录运行，路径从 `process.cwd()` 锚定，换电脑不废）：

| 命令 | 作用 |
| --- | --- |
| `node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/survey.mjs [源项目根]` | 工作流1 · 批量评价：画像 + 四档归类 + 相似聚类，直接 UPSERT 入库（新行初始化 not-started，人工决策态不受影响），stdout 输出归类表 |
| `node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/sync-status.mjs` | 对账 `docs/materials` manifest → 增量更新状态 |
| `node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/profile.mjs <模块源码路径 \| survey-id>` | 工作流2 · 单模块画像入库 + stdout 视图（与 survey 同一套 hash/规则库，不落任何文件） |
| `node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/query.mjs <pending\|similar\|duplicates\|status\|tiers>` | 人读查询视图，stdout 输出 |
| `node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/view.mjs [端口]` | 浏览器视图（默认 http://localhost:8899）：三表浏览 / 行详情 / 状态分布，只读 |

## 工作流约定

- **何时 sync**：每次蒸馏完成（硬门槛②通过）后必跑 `sync-status.mjs`；立项/规划前先跑一次（2026-11-06 task-018 重复立项教训）
- **已蒸馏的处置决策**：`distilled` 模块再被需求命中时——①形态一致 → 物料增强（独立卡）；②无法 Props 化 → 新物料 + ALIAS 登记；③拿不准 → 上报
- **改名/合并登记**：蒸馏目录名 ≠ 源模块名时，登记到 `distill-core/lib.mjs` 的 ALIAS 表，否则对账失真
- **跨项目复用**：换项目做同类勘察时，新 survey/profile 直接入库（project 字段区分），`query.mjs duplicates`（normalized_hash 相同）与 `similar` 直接跨项目对比
- 首次基线（2026-11-06）：40 项 = 2 distilled / 14 queued（12 张 B/C 蒸馏卡，carousel 双版本）/ 1 shelved（地图系）/ 23 not-started

## git 提交

- `materials.db` 进 git；`*.db-wal` / `*.db-shm` 已在根 .gitignore 忽略（脚本收尾 checkpoint 截断 WAL）
