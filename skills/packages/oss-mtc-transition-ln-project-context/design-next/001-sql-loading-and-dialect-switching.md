# 001 · SQL 加载与方言切换 · 私域设计素材

> 本文件位于 **私域草稿区** `.trae/skills/oss-mtc-transition-ln-project-context/design-next/`，
> 用于沉淀 2026-09-15 一次会话中关于"服务端如何加载 SQL 文件 / Python 生态下 SQL 模板与参数如何工作 / 多方言分发是否可行"的讨论结论，
> 并为后续可能的扩展设计（如迁库评估、SQL 模板机制升级）保留空间。

---

## 第 1 章 · 现状事实（已核实，可信）

> 本章所有结论均能在仓库内通过 `Read` / `Grep` 验证。如有变动请同步更新本章。

### 1.1 服务端 SQL 文件的加载模式

- **位置**：运行时 SQL 模板全部外置到 `backend/app/repositories/sql/`，按业务域分子目录（`comparison/`、`visual/big_screen/*/`、`visual/query/` 等）。
- **加载方式**：每个 Service 文件内通过 `Path(__file__).resolve().parents[n]` 向上回溯定位 `_SQL_DIR` / `_SQL_PATH` 路径常量，调用 `read_text(encoding="utf-8")` 读取整段 SQL 字符串。
- **执行方式**：`get_db_connection()` 上下文管理器取得原生 psycopg2 连接，构造 `cur = conn.cursor()`，调用 `cur.execute(sql, params)`，再用 `cur.description` 取列名 + `cur.fetchall()` 取数据。

**两种典型写法**：

| 模式                                             | 形态                                                     | 出现位置（典型）                                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. 一域一文件，函数 `_load_sql()` 无参           | 模块级 `_SQL_PATH` 常量，函数体内 `_load_sql()` 原样返回 | 11 个 comparison 域（`backend/app/services/comparison/tax.py#L334` 等）                                                                                  |
| B. 一域多文件，函数 `_read_sql(name)` 接受文件名 | 模块级 `_SQL_DIR` 常量 + 函数体 `_read_sql("xxx.sql")`   | 大屏域各端点（`backend/app/services/visual/big_screen/petition/service.py#L45`、`backend/app/services/visual/big_screen/petition_comparison.py#L62` 等） |

**调用方式**：

- **完全显式**：每个 Service 函数通过**字符串字面量**指定要读哪个 `.sql` 文件（如 `_fetch("rank.sql", params)`）。
- **无自动发现**：仓库里**不存在**反射、注解、约定式路由、glob 扫描等机制。
- **唯一反例**：`backend/app/services/contrast.py#L173-L176` 使用 `-- section:` 注释锚点切片同一文件多段 SQL，属个别实现。

### 1.2 SQL 与参数的运行时处理机制

- **没有任何第三方 SQL 模板引擎**：`pyproject.toml` 14 个核心依赖中**不含** Jinja2 / Mako / pystache / sqlparse 等；
  `requirements.txt` 中的 `mako==1.3.12` 是 Alembic 自身依赖（`uv.lock` 注明 `via alembic`），与运行时 SQL 无关；
  `app/` 下搜索 `Template` / `jinja` / `mako` **0 命中**。
- **"模板 + 参数"机制 = psycopg2 驱动的命名占位符 `%(name)s`**：
    - `cur.execute(sql, params)` 调用时，psycopg2 在客户端通过 PG Extended Protocol 发出三条消息：Parse（含 `%(name)s` 的 SQL 文本）/ Bind（独立打包的参数字段）/ Execute。
    - **SQL 文本与参数值在协议层物理隔离**，**永远不会先拼成一个字符串再发送**——这是防 SQL 注入的物理保证。
- **驱动 ≠ 数据库引擎**：
    - 真正完成 "SQL 模板 + 参数 → 协议消息" 这一动作的是 **psycopg2（libpq 封装）**，位于客户端。
    - 数据库是 Kingbase，通过 PostgreSQL wire protocol 兼容接收；数据库引擎**只负责执行** Parse+Bind 后的语句，**不参与"参数化"** 这一动作。
- **跨方言对比**：

    | 驱动 / 数据库            | 占位符            | 接口                       |
    | ------------------------ | ----------------- | -------------------------- |
    | psycopg2 → Kingbase / PG | `%(name)s`        | `cur.execute(sql, params)` |
    | PyMySQL → MySQL          | `%(name)s` / `%s` | 同上                       |
    | cx_Oracle → Oracle       | `:name`           | 同上                       |
    | sqlite3 → SQLite         | `?`               | 同上                       |

    "调用形式"（`execute(sql, params)`）跨方言一致；
    "占位符字面量"在 PG 系与 PyMySQL 之间**互通**（均认 `%(name)s`），与 Oracle / SQLite 不互通。

### 1.3 一份典型 `.sql` 模板的真实样例

`backend/app/repositories/sql/visual/big_screen/beijing_petition/beijing.sql` 是带 `%(cant_code)s` 占位符的字符串模板，
它**就是模板**——"骨架固定、参数可变"满足模板的本质定义；与是否带 `{% if %}` 控制流无关。

这份文件里出现的**可移植 / 方言专属**写法分布：

| 写法                                                | 类型                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `CAST(NULLIF(TRIM(col), '') AS DECIMAL)`            | 可移植（PG/MySQL/Oracle 通用）                 |
| `MAX(CAST(STATS_DATE AS DATE))`                     | 可移植                                         |
| `WHERE ORGAN_ID IN (code, code \|\| '000')`         | `\|\|` 字符串拼接是 PG/Oracle 专属             |
| `NVL(a, b)`                                         | PG/Oracle 专属；MySQL 是 `IFNULL` / `COALESCE` |
| `dw_basic_lc.letter_screen_X`（多 schema 全限定名） | 架构差异，PG 系有 schema、MySQL 早期无等价物   |

### 1.4 已有的官方约定（权威出处）

| 约定                                                                                                                                       | 出处                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 运行时 SELECT SQL 不进 migration，按域放 `backend/app/repositories/sql/` 或 `backend/sql/`                                                 | `docs/design/architecture.md` §4.1 + `docs/design/tech-stack.md` §5 |
| `get_db_connection()`（psycopg2 原生）与 SQLAlchemy Session 双路径选择原则                                                                 | `docs/skills/database/kingbase/coding.md` §2                        |
| 复杂只读查询文件头注释规范（schema、参数、是否仅 Kingbase Oracle 模式）                                                                    | `docs/skills/database/kingbase/coding.md` §5.5                      |
| 后端 7 步端点工作流（契约 → 实库 → SQL 模板 → Service → Schema → Router → 测试），明确 Service 层负责 `load_sql()` + `get_db_connection()` | `.trae/.../design/backend/002-endpoint-workflow.md` §1              |
| SQL 双轨制硬规则 R1：运行时 SELECT 放 `repositories/sql/`，不进 migration                                                                  | `.trae/.../design/backend/002-endpoint-workflow.md` §5              |
| SQL 加载分层时序图（load_sql → get_db_connection → cursor → 行转 dict）                                                                    | `.trae/.../design/backend/001-tech-map.md` §3 + §5                  |
| 业务 SQL 主流走原生 psycopg2（`get_db_connection()`，约 40 文件 200+ 处调用），SQLAlchemy engine 路径极少                                  | `.trae/.../design/backend/004-sql-logging.md` §1                    |
| LoggingCursor 双路径捕获（psycopg2 cursor_factory + SQLAlchemy engine event）                                                              | `.trae/.../design/backend/004-sql-logging.md` §2.1                  |

---

## 第 2 章 · 已被讨论但**未实施**的方向（仅记录，不主张落地）

> 本章记录对话过程中浮现的"未来可能路径"。
> **本文件不主张、不承诺、不评估优先级**——仅作为后续设计的素材库。

### 2.1 关于"多方言文件分发"是否可行的讨论要点

**讨论中提出的方案形态**：

```
foo.pg.sql
foo.mysql.sql
foo.oracle.sql
```

由分发器按当前方言自动选文件，找不到则兜底 `.sql`。

**已被识别到的接缝处**（不分先后）：

1. **占位符字面量在 cx_Oracle 下不同**（`:name` 而非 `%(name)s`），需 Python 端 params 配套改造；
2. **PG 数组字面量 `%(arr)s::varchar[]` 在 MySQL 不存在等价物**——要么在 SQL 端展开成 `IN (?,?,?)`，要么在 Python 端把 list 展开成 `organ_ids_0/1/2...` 占位符；
3. **多 schema 全限定名（`dw_basic_lc.letter_screen_X`）跨方言不通**——MySQL 早期 schema ≈ database，**属于架构层差异**；
4. **Python 端 params 构造逻辑也要按方言分叉**（不只是 SQL 文件）；
5. **mock 模式跑不到真实 SQL**，CI 上**无法做"跨方言等价"自动校验**，需新增真实库回归套件；
6. **同语义 SQL 在三份文件中容易漂移**（改 PG 版漏改 MySQL 版），需要强约束流程配合；
7. **业界主流**（SQLAlchemy / Django / Rails）多走"单源 + 翻译器"路线，分文件分发在大型 ORM 中少见。

**讨论中浮出的替代方向**（同样未实施，仅记录）：

- 自建 `app/db/sql_funcs.py` 函数适配层（COALESCE / IFNULL / CONCAT / NVL / STR_TO_DATE）；
- 自建 `app/db/array_param.py` 占位符统一 + PG 数组 → IN 展开；
- 引入 sqlglot / Apache Calcite 做方言自动翻译；
- 重写 `archive_infor_list` 等特别复杂的动态查询为 SQLAlchemy QueryBuilder。

### 2.2 关于"是否有依赖处理 SQL 模板 + 参数"的核实结论

- 已确认**没有任何第三方 SQL 模板引擎**被运行时使用。
- **机制全部由 psycopg2 驱动在客户端协议层完成**，依赖关系是 PG 客户端协议本身的 `%(name)s` 占位符支持。
- 如未来需要"控制流级别的 SQL 模板"（`{% if %}` / `{% for %}` 拼装），需引入 Jinja2 / Mako 等；目前**未引入**。

---

## 第 3 章 · 未决问题 / 留白（TODO）

> 这里列出会话中浮现但**未能闭环**的问题，留给后续 Agent / 团队成员补全。

- [ ] **TODO-A**：仓库 `.sql` 文件中**所有方言痕迹出现位置的清单**——按文件归类 `NVL` / `||` / `TO_DATE` / `::varchar[]` / `ANY` / `AGE` / `DATE_PART` 等出现位置；未盘点。
- [ ] **TODO-B**：是否需要把 `.sql` 文件里**所有 `NVL` 替换为 `COALESCE`**？—— COALESCE 是 PG/MySQL/Oracle 三方言通用写法，理论上是更安全的选择；但本仓库当前 Kingbase 兼容模式 `NVL` 原生支持，未确认是否值得改。
- [ ] **TODO-C**：多 schema 架构（`umc` / `vportal` / `dw_comparison` / `dw_basic_lc`）未来是否需要评估 MySQL 落地方案——属于架构层议题，与本文件"SQL 加载机制"主线关联但不重叠。
- [ ] **TODO-D**：是否需要在仓库**新增一份专门讲 "SQL 加载执行原理" 的设计文档**——目前散落在 `001-tech-map.md` §3 + §5、`004-sql-logging.md` §1/§2.1、`002-endpoint-workflow.md` §5 R1、`docs/skills/database/kingbase/coding.md` §2/§5.5 等多处，**没有单一权威页面**。
- [ ] **TODO-E**：本文件是否应纳入 `.trae/skills/.../design/` 而非 `design-next/`？——目前放在 `design-next/` 仅因本文件属于"未来设计素材"，**未确认**这种归类是否符合后续维护者的预期。

---

## 第 4 章 · 引用索引

> 本章维护本文件引用过的所有仓库路径，便于后续审阅时反向核对。
> 私域文档不受 `docs/` 内链接格式规范约束，但保留"仓库相对路径"风格以便后续整理。

### 4.1 业务代码引用

- `backend/app/services/comparison/medical_insurance.py#L212-L213` — 一域一文件 `_load_sql()` 模式样例
- `backend/app/services/comparison/tax.py#L334`
- `backend/app/services/comparison/social_assistance.py#L38`
- `backend/app/services/comparison/loan.py#L41`
- `backend/app/services/comparison/urban_pension.py#L43`
- `backend/app/services/visual/big_screen/petition/service.py#L19-L46` — `_read_sql(name)` 一域多文件模式样例
- `backend/app/services/visual/big_screen/petition/service.py#L53` — `cur.execute(sql, params)`
- `backend/app/services/visual/big_screen/petition_comparison.py#L62`
- `backend/app/services/visual/big_screen/beijing_petition/service.py#L46`
- `backend/app/services/visual/analysis_report.py#L164`
- `backend/app/services/contrast.py#L173-L176` — `-- section:` 注释切片反例

### 4.2 SQL 模板引用

- `backend/app/repositories/sql/visual/big_screen/beijing_petition/beijing.sql` — 本文件第 1.3 节典型样例
- `backend/app/repositories/sql/visual/query/archive_infor_list.sql#L35` — 含 `TO_DATE(...)` 的反例

### 4.3 公开文档引用

- `docs/design/architecture.md` §4.1 — 运行时 SQL 归属分工
- `docs/design/tech-stack.md` §5 — `repositories/sql/` 路径硬约定
- `docs/skills/database/kingbase/coding.md` §2 / §5.5 — 双路径选择 + 运行时 SQL 文件头注释规范
- `docs/skills/backend/python/coding.md` §2 — 分层职责

### 4.4 私域素材引用

- `.trae/skills/oss-mtc-transition-ln-project-context/design/backend/001-tech-map.md` §3 / §5 — SQL 加载分层时序图 + SQL 双轨制
- `.trae/skills/oss-mtc-transition-ln-project-context/design/backend/002-endpoint-workflow.md` §1 / §5 — 端点工作流 7 步 + R1 SQL 双轨制硬规则
- `.trae/skills/oss-mtc-transition-ln-project-context/design/backend/004-sql-logging.md` §1 / §2.1 — 双路径捕获

### 4.5 配置文件引用

- `backend/pyproject.toml` — 14 个核心依赖清单（无 Jinja2 / Mako / pystache）
- `backend/requirements.txt#L41` — `mako==1.3.12`（Alembic 内部依赖，运行时 SQL 无关）
- `backend/app/db/database.py` — `get_db_connection()` 实现
- `backend/app/kingbase_sqlalchemy.py` — Kingbase 版本串 Assertion 补丁（证明数据库是 Kingbase 而非真 PG）

---

## 第 5 章 · 变更记录

| 日期       | 变更                                                                                                              | 备注       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| 2026-09-15 | 初稿：基于一次会话内 8 个问题的讨论结论，落第 1–4 章；含 TODO-A~E                                                 | 初版       |
| 2026-09-15 | 按 `.trae/rules/docs-link-format.md` 精神清理 `file:///` 链接，改为仓库相对路径纯文本形式（保留 `#L<行号>` 锚点） | 链接规范化 |
