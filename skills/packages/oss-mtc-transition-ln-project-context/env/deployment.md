# 部署环境（Deployment）

> 适用场景：使用 Docker Compose 进行一体化打包与部署。**不含数据库**，Kingbase 由外部提供。

---

## 1. 前置条件

- Docker（>= 24）
- Docker Compose v2（`docker compose`）
- 外部 Kingbase 库已就绪，且容器网络可达
- （可选）发布前在宿主机执行过 Alembic 迁移到目标 DB

---

## 2. 配置文件

### 2.1 复制模板

```bash
cp .env.docker.example .env.docker
```

### 2.2 关键项

| 变量                      | 必填   | 说明                                                               |
| ------------------------- | ------ | ------------------------------------------------------------------ |
| `PROJECT_NAME`            | 否     | 镜像/容器前缀，默认 `pdva`                                         |
| `IMAGE_TAG`               | 否     | 标签，默认 `latest`                                                |
| `FRONTEND_PORT`           | 否     | 前端暴露端口，默认 `80`                                            |
| `BACKEND_PORT`            | 否     | 后端暴露端口，默认 `8000`                                          |
| `SECRET_KEY`              | **是** | JWT 签名；**生产必须替换为强随机串**                               |
| `DB_HOST` / `DB_PORT`     | **是** | 外部 Kingbase                                                      |
| `DB_USER` / `DB_PASSWORD` | **是** | 数据库账号                                                         |
| `DB_NAME`                 | 否     | 默认 `pdva`                                                        |
| `DB_SEARCH_PATH`          | 否     | 多 schema 搜索顺序：`umc,vportal,dw_comparison,dw_basic_lc,public` |
| `DB_SQL_COMPATIBILITY`    | 否     | 默认 `oracle`（与 JDBC sql_mode=oracle 对齐）                      |
| `CORS_ORIGINS`            | **是** | 生产填实际访问域名，多个用逗号分隔                                 |

> 完整的模板请见 `.env.docker.example`。

---

## 3. 构建与启动

### 3.1 一键启动

```bash
docker compose --env-file .env.docker up -d --build
```

### 3.2 访问入口

| 入口                        | 地址（默认端口）             |
| --------------------------- | ---------------------------- |
| 前端（Nginx + `/api` 反代） | `http://localhost`           |
| 后端 API 直连（调试）       | `http://localhost:8000`      |
| 后端健康检查                | `GET /health`                |
| 后端 OpenAPI 文档           | `http://localhost:8000/docs` |

---

## 4. 镜像说明

| 镜像            | 构建上下文  | 基础镜像                   | 暴露端口 |
| --------------- | ----------- | -------------------------- | -------- |
| `pdva-frontend` | `frontend/` | Nginx                      | 80       |
| `pdva-backend`  | `backend/`  | Python 3.11 + uv + uvicorn | 8000     |

- 前端构建：`pnpm install && pnpm run build` → Nginx 托管 `dist/`
- 后端构建：`uv sync --no-dev` → uvicorn 监听 :8000

---

## 5. 常用容器命令

```bash
# 实时日志
docker compose --env-file .env.docker logs -f

# 查看单服务日志
docker compose --env-file .env.docker logs -f backend

# 停止并保留卷
docker compose --env-file .env.docker down

# 仅重建某一服务
docker compose --env-file .env.docker up -d --build backend
```

---

## 6. 数据迁移（仅 real 模式，发布前在宿主机执行）

```bash
# Linux/macOS
cd backend
DB_MODE=real uv run alembic upgrade head
```

```powershell
# Windows PowerShell
cd backend
$env:DB_MODE="real"
uv run alembic upgrade head
```

---

## 7. 生产加固清单

- [ ] `SECRET_KEY` 替换为强随机串（推荐 64 字节以上）
- [ ] `CORS_ORIGINS` 设为实际域名（多域用逗号）
- [ ] `ENVIRONMENT=prod`、`DEBUG=false`
- [ ] 数据库账号最小权限
- [ ] 前端容器 `FRONTEND_PORT` 不暴露公网调试端口；仅 80/443
- [ ] 容器 `restart: unless-stopped` 已配置（compose 文件已包含）
- [ ] 外部 Kingbase 网络隔离 / 仅允许容器网段访问

---

## 8. 本地手动打包（不使用 Compose）

### 前端

```bash
cd frontend
pnpm install
pnpm run build
# 产物：frontend/dist/
```

### 后端

```bash
cd backend
uv sync --no-dev
# 镜像可在此基础上加一层 uvicorn 启动
```

---

## 9. 容器网络与依赖

- 容器编排**不含** Kingbase，由运维侧提供外部实例
- `backend` 与 `frontend` 通过 Compose 默认网络通信
- `frontend` 通过 Nginx 反代 `/api` → `backend:8000`
- 健康检查：`curl http://127.0.0.1:8000/health`（compose healthcheck 配置）
