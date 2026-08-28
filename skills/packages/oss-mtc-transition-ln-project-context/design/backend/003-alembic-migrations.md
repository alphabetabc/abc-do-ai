# 003 · Alembic 迁移维护指南（业务无关）

> 定位：`backend/alembic/` + `backend/db/migrations/kingbase_oracle/` 这套 DDL 迁移体系怎么运作、怎么扩展、怎么修坑。
> 运行时查询 SQL 不在此体系内（见 `001-tech-map.md` §5 双轨制）。
> 所有路径 / revision 号均已核实（2026-08-28）。

---

## 1. 双层结构

```
backend/alembic/versions/pdva_*.py     ← 编排层：只定义 revision 链，读取并执行下面的 SQL
backend/db/migrations/kingbase_oracle/V*.sql  ← 实际 DDL（V01…V28 已入链；V29 孤儿未入链）
```

- 编排文件自身不含 DDL，`upgrade()` 里读取对应 `V*.sql`，按分号拆语句逐条执行
- 拆语句工具三件套（`_SQL_PATH` / `_strip_line_comments` / `_split_sql_statements`）在每个编排文件内复制，不在公共模块
- ⚠️ 拆分逻辑按 `;` 切分：**SQL 片段里不要在字符串字面量内写未转义分号**

## 2. 版本链现状（单链、无分支，head = `pdva_20260828_0023`）

| revision | 对应 V 文件 | 主题 |
|----------|------------|------|
| `pdva_20260213_0001` | V01–V08（打包执行） | 多 schema 初始化（schemas / umc / vportal / dw_comparison / dw_basic_lc stats+reports） |
| `pdva_20260214_0002` | V09 | umc 组织变更履历 |
| `pdva_20260519_0003` | V10 | train |
| `pdva_20260520_0004` | V11 | umc 账号 |
| `pdva_20260520_0005` | V12 | umc 组织结构 |
| `pdva_20260525_0006a` | V14（comparison 扩展） | 比对域扩展 |
| `pdva_20260525_0006b` | V13__umc_dict | umc 字典 |
| `pdva_20260526_0007a` | V14__umc_sys_user_fields | 用户表字段 |
| `pdva_20260526_0007b` | V15__umc_feature_tables | 功能表 |
| `pdva_20260526_0008` | V15__uum_sms_log | 短信日志 |
| `pdva_20260526_0009` | V13__uum_application_authorization | 应用授权 |
| `pdva_20260526_0010` | V16 | app 树 |
| `pdva_20260529_0011` | V17 | 月报文件信息 |
| `pdva_20260601_0012` | V18 | t_jdlk 字典 |
| `pdva_20260819_0013` | V19 | 综合查询组织/区划/家庭（幂等建表） |
| `pdva_20260820_0014` | V20__umc_dict_align_v15 | umc 字典对齐 v15 |
| `pdva_20260824_0015` | V21 | umc 对齐字段列 |
| `pdva_20260824_0016` | V22 | visual_query 字段主键 |
| `pdva_20260824_0017` | V23 | 归档子表 + aa_jycy（现场列、无 IDENTITY） |
| `pdva_20260824_0018` | V24 | t_jdlk 字典全列 |
| `pdva_20260824_0019` | V25 | 字段长度对齐 |
| `pdva_20260826_0020` | V26 | uum 门户字段重命名 |
| `pdva_20260827_0021` | V27 | drop_legacy_user_ref |
| `pdva_20260827_0022` | V28 | umc_sys_user organ_id 索引 |
| `pdva_20260828_0023` | V30 | letter_screen_4 幂等建表（039/040/041 模块4；实库已有 361 行则跳过；**当前 head**） |

**关键认知**：

- **执行顺序权威 = `down_revision` 链，不是 V 编号**。V13/V14/V15 编号各被两个 SQL 复用、V05 空缺、V13 的两个文件分属链上不同位置——按文件名猜顺序必错
- 同日撞号用后缀消重（`0006a→0006b`、`0007a→0007b`），链仍是单线
- V05 缺号是历史遗留，不代表有隐藏文件
- `V29__tyyh_deploy_type_field_dict.sql`（umc 域）文件已存在但未入链（无对应 revision）——2026-08-28 拍板：范围外保持原状不处理；**新 migration 编号从 V30 起，V29 编号不复用**

## 3. 运行门禁与环境

- `alembic/env.py`：`DB_MODE=mock` 时直接 `RuntimeError`——**迁移必须连真实库**
- 连接串 / `client_encoding` 复用 `app/core/config.py`（与应用同一份 settings）
- 执行前先打 Kingbase 驱动补丁 `patch_psycopg2_server_version_detection()`
- 无 ORM models 层 → **`alembic revision --autogenerate` 不可用**，全部手写

## 4. 什么时候需要新增 migration + 固定动作

### 4.0 触发信号表（改动意图 → 去哪）

> 本仓库**无 CI / pre-commit 拦截**「放错位置」的 SQL——没人会自动提醒你。识别方式只有两种：① 交付物跑起来时炸（硬闸门）；② 人 / AI 主动按此表判断。

| 开发意图 | 正确去处 | 走法 |
|---------|---------|------|
| 新建表 / 加列 / 改列类型 / 建索引 | `kingbase_oracle/V*.sql` + 新 revision | 本节 §4.1 流程 |
| 纯查询取数（大屏 / 报表） | `repositories/sql/<域>/*.sql` + Service `load_sql()` | 见 `002-endpoint-workflow.md` §1 |
| 参考数据 / 演示数据 | `db/seeds/` + `scripts/run_seed_*.py` | 不碰 alembic |
| 一次性数据订正 | `db/data_patches/` + `scripts/patch_*.py` | 不碰 alembic |

**会自动炸的硬闸门**（错误已发生时的兜底，不是事前提醒）：mock 模式跑迁移 → RuntimeError；误跑 `downgrade` → 保险丝抛错；revision 引用的 SQL 文件缺失 → FileNotFoundError；响应形状错 → pytest 合同测试红。

**不会自动拦的**：DDL 误放 `repositories/sql/`、运行时 SELECT 误写进 migration、种子误入 DDL——放错位置无任何报错，只能靠本表 + 交付自检。

**典型组合场景**：「编码中发现缺表，PM 提供表结构 + 数据」→ ① 先连真库核实（information_schema，防同名异 schema）；② 表结构走 §4.1 建迁移（幂等建表）；③ 数据按性质分流：参考/演示 → `db/seeds/` + `scripts/run_seed_*.py`（**不进 migration**）；④ 表模型同步进 spec 的 `data-model-extensions.md`（`docs/design/data-models.md` 走 L3 门禁）；⑤ 更新本文件 §2 版本链 head。

### 4.1 新增 migration 的固定动作

1. **写 SQL**：`backend/db/migrations/kingbase_oracle/` 新建 `V<下一个序号>__<slug>.sql`（当前链尾 V30；V29 编号被未入链孤儿 SQL 占用不复用，下一个 **V31**）
2. **写编排**：`backend/alembic/versions/` 新建 `pdva_<YYYYMMDD>_<下一个序号>__<slug>.py`，抄 `pdva_20260827_0022`（或 `pdva_20260819_0013`）模板：
   - `revision = "pdva_<YYYYMMDD>_<NNNN>"`；`down_revision = "pdva_20260828_0023"`（**每次指向当前链尾，以 §2 表末行为准**）
   - 抄 `_SQL_PATH` / `_strip_line_comments` / `_split_sql_statements` 三件套
   - 现场可能已有同名表 → 抄 `0013` 的 `information_schema` 幂等跳过模式
   - `downgrade()` 保留 `raise NotImplementedError`（全链统一：不做自动降级，回滚靠手工 DROP / 备份还原）
   - ⚠️ `downgrade()` 是 Alembic 框架钩子，**只有手动执行 `alembic downgrade` 命令才会调用**；日常 `upgrade head` 与 AI 编码永远不会执行它——留这个抛错是「保险丝」，防止有人误跑 downgrade 自动删表破坏现场数据（规范出处：`docs/skills/database/kingbase/coding.md` §5.2「降级」）
3. **执行与验证**（Windows）：

```powershell
cd backend
$env:DB_MODE = "real"
uv run alembic upgrade head     # 升级
uv run alembic current          # 确认库当前版本
uv run alembic history          # 查看完整链
uv run pytest                   # 回归
```

## 5. 排障

| 症状 | 处理 |
|------|------|
| `alembic upgrade` 报 revision 缺失 / 库里版本号指向已删除的文件 | 用 `backend/scripts/fix_alembic_revision.py` 把 `alembic_version` 表修正到目标 revision，再 `upgrade head`。⚠️ 脚本内默认值是旧 head `pdva_20260520_0005`，必须 `--to <最新 revision>` 显式指定 |
| mock 模式跑迁移报 RuntimeError | 预期行为，切 `DB_MODE=real` |
| 缺 psycopg2 / bcrypt | 在其它项目 venv 里直接敲了 `alembic`；一律 `cd backend && uv run alembic ...` |
| 建表已存在导致中断 | 新迁移应自带幂等（参照 `0013`）；现场手工建的表先核对结构再决定跳过策略 |

## 6. 边界（什么不该进 alembic）

- **运行时 SELECT 永不进 migration** → 放 `backend/app/repositories/sql/<域>/`
- 种子数据 → `backend/db/seeds/`（`scripts/run_seed_*.py` 执行），数据补丁 → `backend/db/data_patches/`
- `scripts/` 下其他脚本按前缀分类：`run_seed_*`（灌种子）、`patch_*`（数据补丁）、`verify_*`（对数校验）、`inspect_*`（报表模板排查）——均为一次性运维工具，不属 alembic 链

## 7. 维护本文件的时机

- 新增 / 修改 migration 模式（如引入新幂等策略）→ 更新 §4
- 版本链变化（新 head、出现分支）→ 更新 §2 表
- 新增排障经验 → 更新 §5
