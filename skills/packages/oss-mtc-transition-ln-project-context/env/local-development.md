# 本地开发环境（Local Development）

> 本文件汇总本地开发的工具链、命令、端口与依赖服务的最小可用信息。

---

## 1. 系统前提

| 工具 | 版本 | 说明 |
|------|------|------|
| mise | 最新 | 用于统一管理 Node/Python/pnpm/uv 版本 |
| Git | — | 仓库协作基础 |
| Docker（可选） | Docker Compose v2 | 仅在需要容器化部署时使用 |

> 当前仅在 **Windows (PowerShell 7+)** 环境下被验证。

---

## 2. 工具链（由 `mise.toml` 锁定）

```toml
[tools]
node = "20"        # 前端构建（实际可用 20.x）
python = "3.11"    # 后端运行时
pnpm = "10"        # 前端包管理
uv = "latest"      # Python 包管理（替代 pip）

[env]
PYTHONUNBUFFERED = "1"
```

### 安装/同步

```powershell
# 安装仓库声明的全部工具版本
mise install

# 校验
mise --version
mise list
```

---

## 3. 一次性准备

```powershell
# 前端依赖
cd frontend
pnpm install

# 后端依赖
cd ../backend
uv sync
```

---

## 4. 启动服务

### 方式 A：分别启动

```powershell
# 后端（:8000）
cd backend
uv run uvicorn app.main:app --reload --port 8000

# 前端（默认 :5173，由 Vite 配置）
cd frontend
pnpm dev
```

### 方式 B：一键启动（前后端并行）

```powershell
# 仓库根
mise run dev
```

> `mise run dev` 通过 `tasks = ["dev-backend", "dev-frontend"]` 并行执行两个子任务。

### 健康检查

- 后端：`GET http://127.0.0.1:8000/health`
- 后端 OpenAPI 文档：`GET http://127.0.0.1:8000/docs`
- 前端：默认 `http://localhost:5173`

---

## 5. 端口 & 服务

| 服务 | 本地端口 | 用途 |
|------|---------|------|
| 前端（Vite dev） | 5173（默认） | 开发热更新 |
| 后端（FastAPI） | 8000 | API + OpenAPI 文档 |
| Kingbase（外部） | 54321（默认） | 通过 `DB_*` 环境变量连接 |

> Docker 端口见 `deployment.md`。

---

## 6. 关键环境变量（开发态样例）

后端读取 `backend/app/core/config.py`，开发态常用项：

| 变量 | 默认 / 样例 | 说明 |
|------|-------------|------|
| `ENVIRONMENT` | `dev` | 切换 dev / prod 行为 |
| `DEBUG` | `true`（dev） | 关闭/开启调试信息 |
| `SECRET_KEY` | 本地占位 | JWT 签名密钥，prod 必须替换 |
| `DB_MODE` | `mock` 或 `real` | mock 走内存存储，real 走 Kingbase |
| `DB_HOST` / `DB_PORT` | 外部 Kingbase 地址 | real 模式必填 |
| `DB_USER` / `DB_PASSWORD` | — | real 模式必填 |
| `DB_SEARCH_PATH` | `umc,vportal,dw_comparison,dw_basic_lc,public` | 多 schema 搜索顺序 |

具体配置以 `backend/app/core/config.py` 为准。

---

## 7. 数据库 Migration（仅 real 模式）

```powershell
cd backend
# Windows PowerShell
$env:DB_MODE="real"
uv run alembic upgrade head
```

迁移文件位于 `backend/alembic/versions/`；SQL 方言源脚本（含 Kingbase 方言）在 `backend/db/migrations/kingbase_oracle/`。

---

## 8. 常用命令速查

### 前端

```powershell
cd frontend
pnpm dev            # 开发服务
pnpm build          # 生产构建（tsc -b && vite build）
pnpm preview        # 预览构建产物
pnpm lint           # ESLint 检查
pnpm format         # Prettier 格式化
pnpm test           # Vitest 单测
```

### 后端

```powershell
cd backend
uv sync                                  # 同步依赖
uv run uvicorn app.main:app --reload --port 8000
uv run alembic upgrade head              # 迁移
uv run pytest                            # 测试
uv run python -m scripts.<name>          # 数据/迁移相关一次性脚本
```

### 数据脚本

`backend/scripts/` 下含若干一次性脚本（如 reseed、菜单路径补丁、报告模板生成等），按需调用：

```powershell
uv run python -m scripts.run_seed_visual_monthly
uv run python -m scripts.patch_umc_sys_menu_paths
# ...
```

---

## 9. 故障排查速查

| 现象 | 排查方向 |
|------|---------|
| 前端启动失败 / 端口占用 | 修改 `frontend/vite.config.ts` 的 `server.port`，或停掉占用的 5173 |
| 后端 500 | 查看 `DB_MODE` 与 `DB_*` 设置；mock 模式不依赖真实 DB |
| 401 / 403 | 是否已登录；菜单 key 是否包含；权限策略（参见 system-overview §2.4） |
| Alembic 漂移 | `backend/scripts/diff_umc_schema.py`、`fix_alembic_revision.py` 工具脚本 |
| Kingbase 方言报错 | 确认 `DB_SQL_COMPATIBILITY=oracle`，参考 `docs/skills/database/kingbase/coding.md` |
