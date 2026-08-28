# Task · 2026-08-28-065-letter-screen-4-建表migration

> 状态：✅ 完成（脚本阶段，2026-08-28；真库执行待用户窗口）
> 类型：编码（backend alembic）
> 创建：2026-08-28
> 前置：无；V 编号已定 **V30**（V29 文件名已被孤儿 SQL 占用，不复用）、down_revision = `pdva_20260827_0022`（2026-08-28 用户拍板：V29 孤儿属 umc 域范围外不处理，保持原状不入链）
> ⚠️ 2026-08-28 用户拍板：本 task **只补充脚本，不做执行**——产出 V30 SQL + revision py + 003 回填；不跑 `alembic upgrade` / `current`，不连真库；真库执行与验收待用户另行安排窗口
> 关联依据：`docs/design/data-models.md` §7.4；`docs/specs/040-bigdata-beijing-petition-display/data-model-extensions.md` §2.4；`.trae/skills/oss-mtc-transition-ln-project-context/design/backend/003-alembic-migrations.md` §4

---

## 0. 任务信息

| 项 | 值 |
| --- | --- |
| 编号-slug | 2026-08-28-065-letter-screen-4-建表migration |
| 任务类型 | 编码（backend alembic migration） |
| 影响范围 | 新增 `backend/db/migrations/kingbase_oracle/V30__letter_screen_4_table.sql` + 新增 `backend/alembic/versions/pdva_20260828_0023_*.py`；回填 `design/backend/003-alembic-migrations.md` §2 head |
| 验收标准（脚本阶段，本 task） | ① `V30__letter_screen_4_table.sql` 幂等建表（表存在即跳过）且全程零 DML；② `pdva_20260828_0023_*.py` 三件套齐备、`down_revision="pdva_20260827_0022"`、`downgrade()` 保留 raise 保险丝；③ 003 §2 回填 `pdva_20260828_0023` 新 head；④ 本地 pytest **不因本 task 新增失败**（基线已红见状态记录，mock 不连真库） |
| 执行阶段（**不在本 task**，待用户窗口） | 真库 `DB_MODE=real` 下 `alembic upgrade head` 成功、letter_screen_4 既有 361 行不受影响（行数前后一致）、`alembic current` 指向 `pdva_20260828_0023`；执行前须先核实真库实际 DDL 与本 SQL 的差异 |

---

## 1. 背景（缺口来源：task-064 盘点缺口 1）

- V07（pdva_20260819_0001）建 `letter_screen_1/2/3/5/6` 时，文件第 1 行注释明确「未提供 letter_screen_4 定义故不建表」→ 该表**全链无任何 revision 覆盖**
- 实库 letter_screen_4（361 行）系 2026-08-26 链外手工灌入（GBK 解码正常）；任何**新环境** `upgrade head` 后 039/040/041 模块4 地图端点将因缺表全部失败
- 040 dme §2.4 实测列头：`CANT_NAME, CANT_CODE, NUM, ORGAN_ID, REG_AUTHORITY, ID`（**无 STATS_DATE**）；040 所附参考 DDL 含 `STATS_DATE TIMESTAMP`，与实库不一致 → **不得照抄参考 DDL**，建表 SQL 以真库实际结构为准
- 361 行灌库脚本未收编 `db/seeds` / `data_patches`（task-064 低优 open question），本 task 不处理数据，只补 DDL

## 2. 步骤（用户 review 后 AI 执行）

### 步骤 1：确定 DDL 依据（**不连真库**）

- **动作**：以 `docs/design/data-models.md` §7.4（权威模型）+ 040 dme §2.4（实测列头 `CANT_NAME, CANT_CODE, NUM, ORGAN_ID, REG_AUTHORITY, ID`，无 STATS_DATE）为 DDL 口径编写；两处如有出入，以 dme 实测列头为准并在 SQL 头注释标注「待真库核实」项
- **🛑 真库 information_schema 核实移出本 task** → 成为执行窗口的前置步骤（见步骤 3）

### 步骤 2：编写 V SQL + revision ✅ 已完成（2026-08-28）

- **动作**：
  - 新增幂等建表 SQL（参照 pdva_20260819_0013 模式：`information_schema.tables` 检查存在即跳过；仅 DDL，零 DML，不动既有数据）
  - 新增 `pdva_20260828_0023_*.py`（三件套 `_SQL_PATH` / `_strip_line_comments` / `_split_sql_statements` 抄 pdva_20260827_0022；`downgrade()` 保留 `raise NotImplementedError` 保险丝——防 DROP 误删 361 行实库数据）
- **编号 / 链形态（已定，2026-08-28 用户拍板）**：V 编号 = **V30**（V29 孤儿文件保持原状不入链、编号不复用）；`down_revision = "pdva_20260827_0022"`
- **🛑 等待用户**：否

### 步骤 3：本地收尾（**不连真库、不跑 alembic**）✅ 已完成（2026-08-28）

- **动作**：003 §2 版本链表追加 `pdva_20260828_0023` 行（head 更新）；`cd backend && uv run pytest` 本地回归（mock，不连真库）；自检 V SQL 零 DML、幂等分支齐备
- **🛑 等待用户**：否

### 执行阶段（**不在本 task**，待用户窗口）

- **前置**：连真库查 `information_schema.columns` / 主键 / 索引（`dw_basic_lc.letter_screen_4`），比对 V30 SQL 差异；若有出入先修脚本再执行
- **动作**：`DB_MODE=real` 执行 `alembic upgrade head`（`DB_MODE=mock` 跑迁移直接 RuntimeError，必须连真库）→ 完成执行阶段验收（361 行不受影响 / `alembic current` 指向 `pdva_20260828_0023`）
- **🛑 等待用户**：是（真库写操作窗口，用户另行安排）

---

## 3. 状态记录

| 日期 | 变更 |
| --- | --- |
| 2026-08-28 | task 创建（task-064 盘点产出缺口 1；未写任何代码，待用户 review 步骤） |
| 2026-08-28 | 随 task-064 用户拍板同步：V 编号定为 **V30**、down_revision=`pdva_20260827_0022`，删除步骤 2 拍板依赖表（V29 孤儿属范围外保持原状） |
| 2026-08-28 | 用户拍板「只补充脚本，不做执行」：本 task 产出 V30 SQL + revision py + 003 回填 + 本地 pytest；真库核实 / `DB_MODE=real` 执行 / upgrade 验收全部移出，待用户另行安排窗口 |
| 2026-08-28 | 脚本阶段完成：新增 `V30__letter_screen_4_table.sql`（幂等建表、零 DML、列名**不带引号**以匹配 map.sql 等查询侧小写折叠引用）+ `pdva_20260828_0023_letter_screen_4_table.py`（三件套抄 0022、幂等模式抄 0013、downgrade raise 保险丝）；003 §2/§4.1 回填 head=`pdva_20260828_0023`；离线自检 `uv run alembic heads` = 0023 唯一 head（只读 script 目录不连库），SQL 解析 stmt_count=1 / 零 DML / 幂等守卫在位 |
| 2026-08-28 | pytest 基线结论：**基线已红且与本 task 无关**——全量 362 failed / 56 errors（根因：登录端点要求前端加密密码 `INVALID_PASSWORD_ENCRYPT`，测试 fixture 仍发明文 `admin` → `login_admin` fixture KeyError）；硬证据：临时移出本 task 两个新文件后重跑大屏子集结果完全一致（28 failed / 50 passed）；修复该基线属独立问题，未立项待用户决定 |
| 2026-08-28 | 归档：移入 `plans/done/`；roadmap §3 task-065 行同步「✅ 脚本完成 → done/」 |
