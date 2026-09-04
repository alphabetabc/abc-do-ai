# Task · 2026-09-02-078-fastapi-sql-logging

> 状态：✅ 完成（2026-09-03 归档；步骤 8 公开文档落行由用户决定后续另行处理，设计文档已沉淀至 `design/backend/004-sql-logging.md`）
> 类型：调研 + 编码 + 文档同步
> 创建：2026-09-02
> 前置：无
> 关联依据：用户 2026-09-02 反馈「给 fastapi 的 backend 做一个 log 能力，如果生态有，我们就不做了，如果没有我们就做一个；目标就是为接口打印 sql；是写到文档里面的那种 log」

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-09-02-078-fastapi-sql-logging                                                                                                                                                                                                                    |
| 任务类型  | 调研 + 编码 + 文档同步（FastAPI 后端 SQL 日志能力建设）                                                                                                                                                                                               |
| 影响范围  | `backend/app/db/database.py`（事件钩子挂载）、新增 `backend/app/middleware/sql_log.py`（候选）、新增 `backend/app/core/logging.py`（候选）、`backend/app/core/config.py`、`backend/app/main.py`、新建 `docs/skills/backend/python/logging.md`（候选） |
| 验收标准  | ① FastAPI 生态调研结论明确（什么有 / 什么没有） ② 接口命中数据库时打印 SQL（带 request_id / 路径 / 耗时 / 参数） ③ 配置项 + 文件落盘策略明确 ④ 文档沉淀到 `docs/skills/backend/python/`                                                               |

---

## 0.1 任务定位

用户目标拆解：

1. **生态先调研**：FastAPI / SQLAlchemy / 第三方包是否已提供「按接口打印 SQL」的开箱即用方案？
2. **没有则造**：缺失的能力由本仓库自研（SQLAlchemy event + FastAPI middleware + stdlib logging）。
3. **文档落地**：把能力 + 使用方式沉淀到 `docs/skills/backend/python/logging.md`（候选），与 `docs/skills/backend/python/coding.md` §6（日志）联动。

> 用户措辞「写到文档里面的那种 log」理解为「**正式文档化**的 log 能力」，而非临时 print；不是「日志文件落到 docs/ 目录里」。

---

## 0.2 现状（baseline）

| 项                             | 当前状态                                                                         | 证据                                                                                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FastAPI 请求级日志**         | ⚠️ 仅有「访问日志中间件」（`AuditLogMiddleware`）写 `umc.umc_audit_log` 表       | `backend/app/middleware/audit_log.py`                                                                                                                                                                                                   |
| **SQLAlchemy SQL echo**        | ⚠️ 引擎 `echo=settings.debug`（仅 `DEBUG=True` 时打 SQL 到 stdout）              | `backend/app/db/database.py#L29`                                                                                                                                                                                                        |
| **Per-request SQL 关联**       | ❌ 无（无 `request_id` / 路由路径 与 SQL 的绑定）                                | Grep `before_cursor_execute` 0 命中                                                                                                                                                                                                     |
| **stdlib logging 统一配置**    | ❌ 无（仅 print 散落：lifespan / audit_log 失败 / DB 连接失败 / 中间件加载）     | Grep `logger = logging.getLogger` 0 命中                                                                                                                                                                                                |
| **业务 service 自定义 logger** | ⚠️ 6 个 service 用 stdlib logger，但无 SQL 维度                                  | `backend/app/services/organ_perspective.py` / `backend/app/services/dict.py` / `backend/app/services/cant.py` / `backend/app/services/organ_type.py` / `backend/app/services/cant_type.py` / `backend/app/services/comparison/crime.py` |
| **现有编码约定（日志）**       | ✅ `coding.md` §6 已提到 `structlog 或 stdlib`、`request_id`、`level`、JSON 单行 | `docs/skills/backend/python/coding.md#L92`                                                                                                                                                                                              |

**核心缺口**：当一个 API 端点（如 `/api/visual/big-screen/petition/map-overview`）内部跑了 5 条 SQL 时，**无法在日志里看到「这次请求」对应的全部 SQL + 耗时 + 拼接参数**，只能靠临时 `echo=True` 抓全局——而那会污染所有路由的日志输出且无 request 上下文。

---

## 0.3 生态调研（必做）

> 用户硬性要求：**先调研，再决定做不做**。

### 0.3.1 候选能力盘点

| 能力                                                                            | 出处                  | 是否满足「按接口打印 SQL」                                                              |
| ------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `engine.echo = True`                                                            | SQLAlchemy            | ⚠️ 全局开关，无 request 关联；与 `settings.debug=True` 已耦合                           |
| `event.listens_for(engine, "before_cursor_execute")` / `"after_cursor_execute"` | SQLAlchemy core event | ✅ 可拿到 statement + params + 耗时；**无 request 关联**，需自行用 `contextvars` 绑定   |
| `logging.basicConfig` + `Formatter` + `Handler`                                 | stdlib `logging`      | ✅ 基础设施；无 SQL 语义，需自接                                                        |
| `structlog`                                                                     | 第三方                | ✅ 适合 JSON 单行 + `request_id` 注入（`coding.md` §6 已点名）；非 SQL 专用             |
| `asgi-correlation-id`                                                           | 第三方                | ✅ 给每请求挂 `X-Request-ID`，但不接 SQL                                                |
| `fastapi-sql-logger` / `sqlalchemy-metrics` / `sqltap`                          | 第三方                | ❌ 已检：要么年久失修、要么只针对 MySQL、要么仅暴露 prometheus metric，不直接打印到 log |
| `loguru`                                                                        | 第三方                | ⚠️ 替换 stdlib logging，需要全局改造                                                    |
| `python-json-logger` / `python-logstash-async`                                  | 第三方                | ✅ JSON formatter，但与 SQL 无关                                                        |

**调研结论（候选）**：

- **没有现成的「按接口维度打印 SQL」开箱即用方案**；要么过度（要 Prometheus / APM），要么只覆盖半边（echo 或 event 单边）。
- 自研方案需要 **3 块拼装** = SQLAlchemy event + contextvars request_id + stdlib/structlog 输出。

### 0.3.2 自研方案最小依赖增量

| 能力                               | 自研方式                                                                      | 是否需要新增第三方包 |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------------------- |
| 抓 SQL + 参数 + 耗时               | `event.listens_for(engine, "before_cursor_execute" / "after_cursor_execute")` | 否（stdlib）         |
| 关联 request（route / request_id） | `contextvars.ContextVar` + FastAPI middleware 注入                            | 否                   |
| 文件落盘 + 滚动                    | `logging.handlers.RotatingFileHandler`                                        | 否                   |
| JSON 单行                          | `logging.Formatter` 自定义 / `python-json-logger`                             | 否（可纯 stdlib）    |

→ 0 新增第三方包，全部用 stdlib + SQLAlchemy event 实现即可。

---

## 0.4 期望行为（待用户拍板）

### 0.4.1 必备能力

| #   | 能力                  | 说明                                                                                          |
| --- | --------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **每条 SQL 一行日志** | 包含：`时间戳` / `request_id` / `method` / `path` / `sql` / `params` / `耗时 ms` / `是否报错` |
| 2   | **每个请求聚合**      | 一行「请求结束」日志汇总：本请求 SQL 条数 / 总耗时 / 错误条数                                 |
| 3   | **配置开关**          | `SQL_LOG_ENABLED`（默认 `True` in dev / `False` in prod，由 `settings.environment` 推断）     |
| 4   | **输出双路**          | console（stdout）+ 文件（`backend/logs/sql-{YYYY-MM-DD}.log`，RotatingFileHandler，10MB×5）   |
| 5   | **参数脱敏**          | 对 `password` / `token` / `secret` 关键字自动替换为 `***`（参考 coding.md §7 安全基线）       |
| 6   | **慢 SQL 告警**       | 单条 > `SLOW_SQL_MS`（默认 500ms）日志级别升 `WARNING` 并带 `[SLOW]` 前缀                     |
| 7   | **失败不抛**          | 日志记录失败绝不影响业务（try/except 包住）                                                   |

### 0.4.2 可选能力（用户拍板是否纳入）

- **JSON 单行格式**（建议默认开，方便日志采集）；与 `coding.md` §6 「JSON 单行适合采集」对齐
- **集成 AuditLogMiddleware**（访问日志与 SQL 日志共享 `request_id`）
- **跨请求慢 SQL 统计**（按 SQL 文本 hash 聚合 Top N 慢查询）

---

## 0.5 候选方案（用户拍板）

| 方案                                                           | 组成                                                                                                                                                                                                                                          | 优劣                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **A. SQLAlchemy event + contextvars + stdlib logging**（推荐） | ① `database.py` 注册 `before_cursor_execute` / `after_cursor_execute`；② 新增 `middleware/sql_log.py` 注入 `request_id` / `path` 到 ContextVar；③ 新增 `core/logging.py` 统一 stdlib `logging` 配置；④ `core/config.py` 加 `sql_log_*` 配置项 | ✅ 0 新增依赖；✅ 与 coding.md §6 对齐；⚠️ 需自写 JSON formatter     |
| **B. 引入 structlog**                                          | A + 引入 `structlog>=24.1.0`                                                                                                                                                                                                                  | ✅ JSON / 上下文绑定更优雅；⚠️ 引入第三方依赖（pyproject.toml 改动） |
| **C. 引入 fastapi-sql-logger 类三方包**                        | 调研已显示无成熟包，跳过                                                                                                                                                                                                                      | ❌ 不可行                                                            |
| **D. 啥也不做**                                                | 保留 `engine.echo=settings.debug` 现状                                                                                                                                                                                                        | ❌ 不满足用户「按接口打印 SQL」诉求                                  |

> **推荐 A**：0 新增依赖，与现有栈对齐。

---

## 0.6 涉及文件（方案 A 落地清单）

> 实际改动以步骤 2 拍板的方案为准。

| 路径                                            | 改动类型 | 内容                                                                                                                                                  |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/app/core/config.py`                    | 修改     | 新增 `sql_log_enabled` / `sql_log_dir` / `sql_log_level` / `sql_log_slow_ms` / `sql_log_max_bytes` / `sql_log_backup_count` / `sql_log_json` 等配置项 |
| `backend/app/core/logging.py`（新增）           | 新建     | stdlib `logging` 统一配置：root logger + 控制台 handler + RotatingFileHandler + JSON formatter（可选）                                                |
| `backend/app/middleware/sql_log.py`（新增）     | 新建     | `SqlLogContextMiddleware`：从 header `X-Request-ID` 或生成 UUID 注入 ContextVar，捕获 path / method                                                   |
| `backend/app/db/database.py`                    | 修改     | 注册 SQLAlchemy event `before_cursor_execute` / `after_cursor_execute`；首条 SQL 时初始化 logger                                                      |
| `backend/app/main.py`                           | 修改     | `app.add_middleware(SqlLogContextMiddleware)`；启动时调用 `configure_logging(settings)`                                                               |
| `docs/skills/backend/python/logging.md`（新增） | 新建     | 使用文档：配置项 / 输出示例 / 关闭方式 / 与 AuditLog 联动                                                                                             |
| `docs/skills/backend/python/coding.md`          | 修改     | §6「日志」补充「SQL 日志能力」段落，指向 `logging.md`                                                                                                 |

---

## 0.7 待用户拍板

1. **方案选 A / B / C / D 哪一个**？（默认 A）
2. **JSON 单行格式是否默认开**？（建议：是，与 coding.md §6 对齐）
3. **新增日志目录** `backend/logs/` 是否加入 `.gitignore`？（建议：是）
4. **是否一并修改 `coding.md` §6**？（建议：是，保持规范统一）
5. **慢 SQL 阈值默认值**？建议 500ms，可改为 200 / 1000
6. **是否纳入「失败 SQL 单独计数 + 请求结束汇总日志」**？（建议：是）

---

## 1. 步骤

### 步骤 1：生态调研 ⏳

- **动作**：§0.3 盘点，输出「生态已有能力 vs 缺口」对照表 + 结论
- **输出**：§0.3 调研结论确认
- **🛑 等待用户**：否（自查，结论作为后续步骤依据）

### 步骤 2：拍板方案 ⏳

- **动作**：与用户对齐 §0.5 方案选择 + §0.7 6 个待拍板点
- **输出**：选定方案 + 配置默认值写入 §0.5 / §0.7
- **🛑 等待用户**：是

### 步骤 3：实现 logging 配置（`core/logging.py`） ⏳

- **动作**：按拍板方案新建/修改 `backend/app/core/logging.py`（stdlib 统一配置）
- **输出**：logging.py 代码 + pytest 覆盖（可选）
- **🛑 等待用户**：否

### 步骤 4：实现 SQL 事件钩子（`db/database.py`） ⏳

- **动作**：注册 `before_cursor_execute` / `after_cursor_execute`，记录耗时 + 参数 + 错误
- **输出**：database.py 改动
- **🛑 等待用户**：否

### 步骤 5：实现 request 上下文中间件（`middleware/sql_log.py`） ⏳

- **动作**：新建中间件，注入 `request_id` / `method` / `path` 到 `ContextVar`
- **输出**：sql_log.py 代码
- **🛑 等待用户**：否

### 步骤 6：main.py 接线 + config.py 增项 ⏳

- **动作**：添加中间件 + lifespan 调用 `configure_logging`；`config.py` 新增配置项
- **输出**：main.py + config.py 改动
- **🛑 等待用户**：否

### 步骤 7：本地验证 ⏳

- **动作**：启服务 → 命中一个含 SQL 的接口（如 `/api/visual/big-screen/petition/map-overview`）→ 检查 stdout 与 `backend/logs/sql-*.log` 都打出 SQL + request_id + 耗时
- **输出**：验证结论（含示例日志片段）
- **🛑 等待用户**：否

### 步骤 8：文档落行 ⏳

- **动作**：新建 `docs/skills/backend/python/logging.md`；`coding.md` §6 补充段落；如有 `AGENTS.md` 关联更新
- **输出**：3 处文档改动
- **🛑 等待用户**：否

### 步骤 9：回读验证 ⏳

- **动作**：阅读改动文件确认无遗漏；L3 文档改动走 AGENTS §10 提案审批
- **输出**：验证结论
- **🛑 等待用户**：是

---

## 2. 依据（任务来源）

| 来源类型 | 路径                                     | 引用章节                                                                                              |
| -------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| skill    | `plans/roadmap-2026-08-11-big-screen.md` | §3（待登记）                                                                                          |
| docs     | `docs/skills/backend/python/coding.md`   | §6（日志：structlog 或 stdlib / request_id / JSON 单行）                                              |
| 现状     | `backend/app/middleware/audit_log.py`    | 已有访问日志中间件（仅 request/response 维度）                                                        |
| 现状     | `backend/app/db/database.py`             | `engine.echo=settings.debug`（无 request 关联）                                                       |
| 用户反馈 | —                                        | 2026-09-02「给 fastapi 的 backend 做一个 log 能力……目标就是为接口打印 sql；是写到文档里面的那种 log」 |

---

## 3. 状态记录

| 日期       | 变更                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 2026-09-02 | task 创建：聚焦「FastAPI 后端 SQL 日志能力」；§0.3 生态调研结论候选已列；待步骤 2 用户拍板方案 |
| 2026-09-03 | 用户拍板方案 A 修正版（psycopg2 cursor_factory 主路径 + engine event 辅路径），理由：业务 214 处调用走原生 `get_db_connection()`，仅靠 engine event 抓不到主流量。步骤 3-7 完成（config.py / core/logging.py / middleware/sql_log.py / database.py / main.py），本地验证通过（真实 Kingbase SQL 已落盘 JSON 单行 + request 上下文 + 耗时；慢 SQL `[SLOW]` 前缀 + 参数脱敏生效；`backend/logs/` 已被 .gitignore `logs/` 覆盖）。修复一处 bug：try 内 `return` 跳过 else 分支导致成功路径不记日志。待步骤 8 文档落行（L3 走提案审批） |
