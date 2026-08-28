# 001 · 后端技术地图（业务无关）

> 定位：记录本仓库后端的**技术事实**——技术栈、分层模型、目录职责、请求生命周期、基础设施。
> 业务口径 / 字段含义不在本文件；见 `docs/design/api-contracts.md` 与 `docs/design/data-models.md`。
> 文中所有路径 / 文件名均已核实存在（2026-08-28 核实，后续改动须同步更新）。

---

## 1. 技术栈一览

| 项 | 选型 | 备注 |
|---|---|---|
| Web 框架 | FastAPI | 入口 `backend/app/main.py`，路由统一挂 `/api` 前缀 |
| 数据访问 | SQLAlchemy（engine / session）+ **原生 SQL 模板** | 见 §3「无独立 ORM 模型层」 |
| 数据库 | Kingbase（人大金仓），Oracle 兼容模式 | 驱动 psycopg2；库名默认 `pdva` |
| 迁移 | Alembic | `backend/alembic/`，配置 `backend/alembic.ini` |
| 数据校验 | Pydantic | `backend/app/schemas/` |
| 测试 | pytest | `backend/tests/` |
| 包管理 | uv | `backend/pyproject.toml` |
| 运行模式 | `DB_MODE=mock \| real`（`settings.db_mode`） | mock 免菜单鉴权、用假数据；real 连真实库 |

## 2. 目录地图

### 2.1 backend/ 顶层

```
backend/
├── app/                 # FastAPI 应用主体
├── alembic/             # Alembic 迁移（env.py + versions/）
├── db/                  # 基线 DDL / 种子 / 数据补丁（非 Alembic）
│   ├── migrations/kingbase_oracle/   # V01 起按序编号的基线 SQL
│   ├── seeds/                        # 各域种子数据
│   └── data_patches/                 # 数据补丁 SQL
├── repositories/        # 仅 sql/ 子目录，存放运行时 SQL 模板（无 .py）
├── scripts/             # 运维 / 种子 / 巡检脚本
├── tests/               # pytest 测试（扁平 test_*.py + conftest.py + fixtures/）
├── data/report/         # 运行时生成的导出文件
├── alembic.ini / pyproject.toml / Dockerfile / .env.example / README.md
```

### 2.2 app/ 内部职责

| 目录 | 职责 | 典型文件 |
|------|------|---------|
| `app/api/` | 路由层，按域分三块 | `api/v1/`（users、auth、menus…）、`api/comparison/`（比对域）、`api/visual/`（大屏 / 月报 / query） |
| `app/services/` | 业务逻辑 + SQL 执行 + 聚合 | `services/visual/big_screen/*.py`、`services/auth.py` |
| `app/schemas/` | Pydantic 请求/响应模型，扁平单文件 | `schemas/common.py`、`schemas/visual.py` |
| `app/repositories/` | 只有 `sql/` 子目录，按域放 SQL 模板 | `sql/visual/big_screen/…/*.sql` |
| `app/core/` | 基础设施 | `config.py`、`deps.py`、`security.py`、`menu_access.py` |
| `app/db/` | 连接与会话 | `database.py` |
| `app/middleware/` | 中间件 | `audit_log.py` |
| `app/assets/report_templates/` | 报表导出模板 | xlsx / docx |
| 根 | 入口 + 兼容补丁 | `main.py`、`kingbase_sqlalchemy.py` |

> ⚠️ **没有 `app/models/` 目录**：本项目不用 ORM 模型层做数据访问，`Base = declarative_base()` 定义在 `app/db/database.py`，实际读数靠 SQL 模板 + cursor。

## 3. 分层模型（一个请求怎么走）

以 `backend/app/api/visual/big_screen/petition_comparison/router.py` 这条真实链路为例：

```
客户端 GET /api/visual/big-screen/petition-comparison/rank?organId=210000
  │
  ├─ main.py：统一挂 /api 前缀、注册各域 router、中间件
  ├─ middleware/audit_log.py：审计日志
  ├─ Router（api/…/router.py）      ← 只做编排，不写业务
  │    ├─ 鉴权依赖 Depends(_big_screen_auth())
  │    │    mock 模式 → get_current_user（仅登录）
  │    │    real 模式 → require_menu_key("<菜单 key>")
  │    ├─ Query 参数声明与校验
  │    ├─ 调 service 函数
  │    └─ ValueError → HTTPException 400；结果包 ApiResponse
  ├─ Service（services/…py）        ← 业务 + 取数
  │    ├─ load_sql("rank.sql") 读 SQL 模板
  │    ├─ 参数规范化（如 organId 校验/右补齐，非法 → ValueError）
  │    ├─ get_db_connection() 执行 SQL → 行转 {小写列名: 值} dict
  │    └─ 聚合 → 返回 Response schema
  ├─ Schema（schemas/*.py）         ← Pydantic 响应形状
  └─ 响应壳 ApiResponse(code, message, data)（schemas/common.py）
```

**各层职责一句话**：

- **Router**：鉴权 + 参数声明 + 异常映射 + 响应壳；禁止写业务逻辑
- **Service**：业务规则 + SQL 执行 + 聚合；是唯一碰数据的地方
- **Schema**：响应形状契约（Pydantic）；前端按此渲染
- **SQL 模板**：`.sql` 文件放 `repositories/sql/<域>/`，由 Service `load_sql()` 读取，参数用绑定变量

## 4. 基础设施速查表

| 设施 | 位置 | 要点 |
|------|------|------|
| 配置中心 | `backend/app/core/config.py` | `settings.database_url`、`db_mode`、`db_client_encoding` 等；本地配置抄 `.env.example` |
| 登录态 | `backend/app/core/deps.py` | `get_current_user`（FastAPI 依赖注入） |
| 菜单鉴权 | `backend/app/core/menu_access.py` | `require_menu_key(required_key)`；无权限 → 403 |
| 密码/安全 | `backend/app/core/security.py` | 哈希、token |
| 连接与会话 | `backend/app/db/database.py` | `create_engine`（pool_pre_ping）+ `SessionLocal` + `get_db` 依赖 + `get_db_connection()` 原生连接上下文 |
| Kingbase 驱动补丁 | `backend/app/kingbase_sqlalchemy.py` | `patch_psycopg2_server_version_detection()`，必须先于 engine 创建执行 |
| 统一响应壳 | `backend/app/schemas/common.py` | `ApiResponse[T](code, message, data)`、`PagedData[T]` |
| 审计日志 | `backend/app/middleware/audit_log.py` | 中间件形式 |

## 5. SQL 管理双轨制（最易踩坑的约定）

| 类型 | 去处 | 例子 |
|------|------|------|
| **DDL（建表/改表）** | `backend/db/migrations/kingbase_oracle/V*.sql`，由 Alembic 编排执行 | `V01__schemas.sql` … |
| **运行时查询（SELECT）** | `backend/app/repositories/sql/<域>/…/*.sql`，**绝不进 migration** | `rank.sql`、`summary.sql` |

配套硬规则：手写 SQL 用全限定 `schema.table`（如 `dw_basic_lc.xxx`），不依赖 `search_path`；必须参数化，禁止拼接用户输入。

> Alembic 编排机制、版本链、新增 migration 的固定动作、排障见独立文档 `003-alembic-migrations.md`。速记：迁移必须 `DB_MODE=real` + `uv run alembic upgrade head`；顺序权威是 revision 链不是 V 编号；downgrade 一律手工；不能 autogenerate。

## 6. 测试组织

- 扁平单层 `backend/tests/test_*.py`，按域命名；无 unit/contract 子目录
- 共享夹具 `backend/tests/conftest.py`；静态夹具 `backend/tests/fixtures/<域>/`
- 三类典型测试：合同测试（`test_visual_query_contract.py`）、端点测试（`test_big_screen_*.py`）、鉴权测试（`test_visual_auth.py`）

## 7. 常用命令（Windows / uv）

```powershell
cd backend
uv sync                                        # 安装依赖
uv run uvicorn app.main:app --reload --port 8000   # 开发模式启动
uv run pytest                                  # 跑测试
$env:DB_MODE = "real"; uv run alembic upgrade head # 执行迁移（需真实库）
```

- Swagger：http://localhost:8000/docs ；ReDoc：http://localhost:8000/redoc
- ⚠️ 不要在其它项目的 venv 里直接敲 `alembic`（会缺 psycopg2/bcrypt），一律 `uv run`

## 8. 如何快速读懂一个既有端点（阅读顺序）

1. 找 `backend/app/api/<域>/…/router.py`：看路径、鉴权、参数、响应壳
2. 顺着 import 进 `backend/app/services/…`：看参数规范化 + `load_sql()` 加载了哪些 SQL
3. 打开对应 `backend/app/repositories/sql/…/*.sql`：看真实查询与全限定表名
4. 看 `backend/app/schemas/*.py` 对应 Response：确认返回形状
5. 最后看 `backend/tests/test_*.py`：用例即行为文档
