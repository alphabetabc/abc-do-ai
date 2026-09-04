# 004 · SQL 日志能力设计（FastAPI 后端）

> 目标：为每个 API 请求打印其执行的全部 SQL（含参数 / 耗时 / request 上下文），JSON 单行输出到 console + 日志文件。
> 来源：task-2026-09-02-078-fastapi-sql-logging（2026-09-03 完成）。
> 关联：`design/backend/001-tech-map.md`（技术栈）、`002-endpoint-workflow.md`（端点工作流）。

---

## 1. 背景与生态调研结论

### 1.1 诉求

- 接口命中数据库时，日志里能看到「这次请求」对应的全部 SQL + 拼接参数 + 耗时
- 正式文档化的 log 能力，而非临时 `echo=True`

### 1.2 调研结论（为什么自研）

| 候选能力                                                   | 出处                  | 结论                                                |
| ---------------------------------------------------------- | --------------------- | --------------------------------------------------- |
| `engine.echo = True`                                       | SQLAlchemy            | 全局开关，无 request 关联，与 `settings.debug` 耦合 |
| `event.listens_for(engine, "before/after_cursor_execute")` | SQLAlchemy core event | 可行但**只覆盖 engine 路径**                        |
| `structlog` / `asgi-correlation-id` / `loguru`             | 第三方                | 各覆盖半边（上下文/格式），非 SQL 专用，且引入依赖  |
| `fastapi-sql-logger` / `sqltap` 等                         | 第三方                | 年久失修或仅 metric，不满足                         |

**关键事实（决定架构）**：本仓库业务 SQL 绝大多数走**原生 psycopg2**（`get_db_connection()`，约 40 文件 200+ 处调用），SQLAlchemy engine 路径极少。仅挂 engine event 抓不到主流量。

**结论**：生态无现成「按接口打印 SQL」方案，0 新增依赖自研，双路径捕获（psycopg2 cursor 为主 + engine event 为辅）。

---

## 2. 架构设计

```
HTTP 请求
  │
  ▼
SqlLogContextMiddleware（middleware/sql_log.py）
  ├─ request_id = header X-Request-ID 或生成 UUID
  └─ ContextVar 注入：request_id / method / path / stats{count,total_ms,errors}
  │
  ▼
业务层（两条 SQL 路径，都会调 log_sql）
  ├─ 主路径：get_db_connection() → conn.cursor_factory = LoggingCursor
  │          （database.py 的 LoggingCursor.execute / executemany）
  └─ 辅路径：SQLAlchemy engine event（before/after_cursor_execute + handle_error）
  │
  ▼
core/logging.py · log_sql()
  ├─ 组装 JSON 单行（ts / request_id / method / path / sql / params / duration_ms）
  ├─ 参数脱敏（password / token / secret → ***）
  ├─ 慢 SQL（≥ sql_log_slow_ms）→ [SLOW] 前缀 + WARNING
  └─ 更新请求级 stats
  │
  ▼
logging.getLogger("sql")
  ├─ StreamHandler（console / stdout）
  └─ RotatingFileHandler → backend/logs/sql-YYYY-MM-DD.log（10MB × 5）
  │
  ▼
请求结束（middleware finally）
  └─ log_request_summary：sql_count / sql_total_ms / sql_error_count
```

### 2.1 双路径捕获的原因

| 路径                                         | 覆盖范围                                              | 实现方式                                                                         |
| -------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `LoggingCursor`（psycopg2 `cursor_factory`） | 所有走 `get_db_connection()` 的原生 SQL（业务主流量） | 子类化 `psycopg2.extensions.cursor`，包装 `execute` / `executemany` 记录耗时     |
| SQLAlchemy engine event                      | 走 ORM / `SessionLocal` / `engine.connect()` 的 SQL   | `before_cursor_execute` 打时间戳，`after_cursor_execute` / `handle_error` 记日志 |

### 2.2 request 上下文传递

- `contextvars.ContextVar`（`request_id_var` / `request_method_var` / `request_path_var` / `request_sql_stats_var`），定义在 `core/logging.py`
- FastAPI 同步 + 异步混合：`get_db_connection()` 在线程池 / 内联执行均能读到当前上下文的 ContextVar（asyncio task 继承上下文）
- 无请求上下文（如启动脚本、定时任务）时 `request_id` 为空串，stats 为 None，照常记 SQL（只是无 request 维度）

---

## 3. 文件清单

| 文件                                        | 角色                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `backend/app/core/config.py`                | `sql_log_*` 配置项（见 §4）                                                                              |
| `backend/app/core/logging.py`（新增）       | ContextVar 定义、`log_sql` / `log_request_summary`、`configure_logging()`（幂等）                        |
| `backend/app/middleware/sql_log.py`（新增） | `SqlLogContextMiddleware`：注入上下文 + 响应头回传 `X-Request-ID` + 请求结束汇总                         |
| `backend/app/db/database.py`                | `LoggingCursor`（execute/executemany 包装）+ `get_db_connection` 挂 `cursor_factory` + engine event 钩子 |
| `backend/app/main.py`                       | lifespan 调 `configure_logging()`；`app.add_middleware(SqlLogContextMiddleware)`                         |

---

## 4. 配置项（`backend/.env`）

| 配置项                 | 默认值                | 说明                                       |
| ---------------------- | --------------------- | ------------------------------------------ |
| `SQL_LOG_ENABLED` / `ENABLE_LOG` | `True`                | 总开关；关闭时 cursor 直接透传，零开销路径 |
| `SQL_LOG_DIR` / `LOG_DIR` | `""` → `backend/logs` | 日志目录                                   |
| `SQL_LOG_LEVEL`        | `INFO`                | sql logger 级别                            |
| `SQL_LOG_SLOW_MS`      | `500`                 | 慢 SQL 阈值（毫秒）                        |
| `SQL_LOG_MAX_BYTES`    | `10485760`            | 单文件 10MB                                |
| `SQL_LOG_BACKUP_COUNT` | `5`                   | 保留 5 个滚动备份                          |

`.gitignore` 已有 `logs/` 与 `*.log`，日志产物不入库。

---

## 5. 日志格式

### 5.1 每条 SQL 一行（JSON 单行，便于采集解析）

```json
{
    "ts": "2026-09-03T18:04:23.685",
    "request_id": "a1b2c3...",
    "method": "GET",
    "path": "/api/visual/big-screen/petition/map-overview",
    "kind": "business",
    "sql": "SELECT * FROM dw_basic_lc.letter_screen_1 WHERE stats_date = %s",
    "params": ["2026-08"],
    "duration_ms": 10.55
}
```

- `kind` 字段按表名前缀分类，便于过滤：`business`（业务，默认）/ `auth`（`umc_sys_user` / `umc_sys_role` / `umc_sys_permission` / `umc_organ` 鉴权查询）/ `audit`（`umc_audit_log` 访问日志写库）

- 失败 SQL 附 `"error"` 字段，级别 WARNING
- 慢 SQL（≥ 阈值）加 `[SLOW] ` 前缀（非 JSON 前缀）并升 WARNING
- SQL 文本已做空白折叠（多行 SQL 压成单行）

### 5.2 请求结束汇总

```json
{
    "ts": "...",
    "request_id": "a1b2c3...",
    "method": "GET",
    "path": "/api/...",
    "event": "request_sql_summary",
    "sql_count": 5,
    "sql_total_ms": 812.3,
    "sql_error_count": 0
}
```

### 5.3 参数脱敏

参数名含 `password` / `token` / `secret`（不区分大小写）时值替换为 `***`。

---

## 6. 安全与稳定性设计

1. **失败不抛**：`log_sql` / `log_request_summary` / 文件 handler 初始化全部 try/except 吞异常，日志问题绝不影响业务
2. **性能**：单次 execute 增加一次 `time.perf_counter` + 一次 JSON 序列化；`SQL_LOG_ENABLED=False` 时 cursor 走透传分支零开销
3. **幂等**：`configure_logging()` 重复调用不重复加 handler（`_configured` 标记）
4. **日志轮转**：`RotatingFileHandler` 10MB × 5，防磁盘打爆；文件按日期命名便于检索
5. **logger 隔离**：`logging.getLogger("sql")` 且 `propagate = False`，不污染 root logger / uvicorn 输出

---

## 7. 已知边界 / 后续可选增强

- `LoggingCursor` 只包装 `execute` / `executemany`；`callproc` / `copy` 未记录（当前业务未使用）
- 请求级 stats 依赖中间件包裹；若在请求处理中起独立线程执行 SQL，ContextVar 上下文需显式传递（当前业务无此模式）
- 可选增强（未实现）：跨请求慢 SQL 聚合 Top N、与 AuditLogMiddleware 共享 request_id 写库、SQLAlchemy `echo` 与本日志的开关统一

---

## 8. 变更记录

| 日期       | 变更                                                            |
| ---------- | --------------------------------------------------------------- |
| 2026-09-03 | 初版：记录 SQL 日志能力的设计与实现（task-2026-09-02-078 完成） |
