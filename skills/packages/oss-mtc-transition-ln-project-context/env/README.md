# Env

记录 oss-mtc-transition-ln 项目的环境信息与项目元数据。

## 文件索引

| 文件 | 主题 |
|------|------|
| `project-overview.md` | **项目综合记录**（推荐先看） |
| `project-meta.md` | 仓库根级元文档（`package.json` / `AGENTS.md` / `README.md` / `HERMES.md` / `mise.toml` / `docker-compose.yml` / IDE 目录） |
| `AGENTS.md` | 仓库根 `AGENTS.md` 的**硬链接镜像**（自动双向同步） |
| `package.json` | 仓库根 `package.json` 的**硬链接镜像**（自动双向同步，pnpm scripts 入口） |
| `local-development.md` | 本地开发（工具链、命令、端口、迁移、命令速查） |
| `deployment.md` | Docker Compose 部署（含生产加固清单） |

## 文件命名建议

- `local-dev.md`：本地开发环境
- `toolchain.md`：工具链版本与安装
- `env-vars.md`：环境变量清单
- `deployment.md`：部署说明

## 速览

- 前端：`cd frontend && pnpm install && pnpm dev`
- 后端：`cd backend && uv run uvicorn app.main:app --reload --port 8000`
- 一键：`mise run dev`
- 工具链：`mise install`（参见仓库根 `mise.toml`）
- 部署：`docker compose --env-file .env.docker up -d --build`
- 数据库：Kingbase（外部实例，通过 `.env.docker` 配置连接）
