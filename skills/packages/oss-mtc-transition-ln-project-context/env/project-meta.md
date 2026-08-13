# 项目根级元文档（Project Meta Files）

> 本目录作为仓库根级「元/管理类文件」的索引与摘要，便于团队与 AI Agent 快速了解项目顶层约定。

---

## 1. `AGENTS.md`（仓库根）

**位置**：`./AGENTS.md`

**作用**：AI Agent / 团队成员开发「**大屏（可视化分析）**」相关功能时的入口说明。

**镜像位置**：仓库根 `AGENTS.md` 是指向 `env/AGENTS.md` 的 **symlink**（符号链接）。`env/AGENTS.md` 为权威源，根 `AGENTS.md` 为 symlink 镜像。语义上以**根 `AGENTS.md`** 为权威载体（`AGENTS.md` §10 已声明），`env/AGENTS.md` 为 skill 内的可编辑副本。

若需重新建立 symlink（在跨机器克隆或文件丢失时），执行：

```powershell
New-Item -ItemType SymbolicLink `
  -Target .trae\skills\oss-mtc-transition-ln-project-context\env\AGENTS.md `
  -Path .\AGENTS.md
```

> `-Target` 必须是已存在的文件（源），`-Path` 是要新建的链接位置。
> 若根 `AGENTS.md` 已存在，先删除它（`Remove-Item .\AGENTS.md`）再执行上述命令。
> Windows 创建 symlink 可能需要开发者模式或管理员权限。

若要替换为拷贝版本（不再 symlink），执行 `Copy-Item .\.trae\skills\oss-mtc-transition-ln-project-context\env\AGENTS.md .\AGENTS.md -Force` 即可。

**管理范围**：大屏模块（人员 / 信访系列 / 月报），详见 AGENTS.md §2.1。

> 📌 **前端路由权威表**：`design/003-big-screen-routes.md`（唯一权威记录点）。
> 数据源 / spec / 现状列详见 `AGENTS.md` §2.1（权威）。

**约定要点**（详见 AGENTS.md §3–§7）：

- 前端：大屏代码按 PM 路由前缀分目录：`pages/bigdata/`（人员）、`pages/dashboard/`（信访系列）、`pages/visual/stats/`（月报）与 `components/big-screen/`
- 后端：路由 `api/visual/`、Service `services/visual/`、SQL 放 `repositories/sql/`（**不**进 alembic migration）
- 端点前缀：`/api/visual/<sub>`（**无** `/v1`）
- 鉴权：菜单项粒度（按 `GET /api/v1/menus/user` 的 key 校验）
- 大屏只读消费统计表快照（`stats_*` / `letter_screen_*` / `abi_*`）

**其它业务**（账号、组织、比对、统计报表、菜单权限等）不在 AGENTS.md 管理范围内，请参考对应 spec。

---

## 2. `HERMES.md`（仓库根）

**位置**：`./HERMES.md`

**作用**：Hermes Agent 增强框架说明，列出 `.hermes/skills/` 下 20 个 superpowers-zh 技能与触发条件，并声明 4 条核心规则：

1. 收到任务时先检查是否有匹配的 skill
2. 设计先于编码（brainstorming）
3. 测试先于实现（TDD）
4. 验证先于完成（verification-before-completion）

**使用方式**：任务匹配某个 skill 时，使用 `skill_view` 加载该 skill 并遵循其流程。

---

## 3. `README.md`（仓库根）

**位置**：`./README.md`

**作用**：项目的总入口文档，包含：

- 快速开始（环境准备、启动服务、Docker 打包与部署）
- 目录结构概览（`frontend/`、`backend/`、`docs/`、`docker-compose.yml`、`mise.toml`）
- 文档索引（指向 `docs/specs/README.md`、`docs/skills/README.md`）
- 开发规范入口（React / Python / Git）

---

## 4. `package.json`（仓库根）

**位置**：`./package.json`

**作用**：仓库根统一入口脚本（pnpm scripts）。

**当前内容**（本人最近定版，**以本目录镜像为准**）：

```json
{
    "name": "oss-mtc-transition-ln",
    "version": "0.1.0",
    "private": true,
    "description": "辽宁省退役军人事务综合管理服务平台 - 仓库根入口",
    "packageManager": "pnpm@10.13.1",
    "engines": {
        "node": ">=20",
        "pnpm": ">=10"
    },
    "scripts": {
        "dev:backend": "cd backend && uv run uvicorn app.main:app --reload --port 8000",
        "dev:frontend": "cd frontend && pnpm dev"
    }
}
```

> ⚠️ 此处内容由 `package.json`（**symlink 镜像**）提供，外部修改会自动反映。若需重建 symlink，执行：
>
> ```powershell
> New-Item -ItemType SymbolicLink `
>   -Target .trae\skills\oss-mtc-transition-ln-project-context\env\package.json `
>   -Path .\package.json
> ```

---

## 4a. `mise.toml`（仓库根）

**位置**：`./mise.toml`

**作用**：使用 `mise`（官方网站 `https://mise.jdx.dev/`）统一管理工具链版本。

**关键内容**：

- Node = 20（前端构建）
- Python = 3.11（后端运行时）
- pnpm = 10（前端包管理器）
- uv = latest（Python 包管理器）
- `PYTHONUNBUFFERED=1`
- 任务 `dev`：`tasks=["dev-backend", "dev-frontend"]`（并行）

---

## 5. `docker-compose.yml` + `.env.docker(.example)`

**位置**：

- 编排：`./docker-compose.yml`
- 环境变量模板：`./.env.docker.example`
- 实际配置：`./.env.docker`（**未提交**，按需 `.gitignore`）

**作用**：编排 backend + frontend 两个镜像；**不含数据库**（Kingbase 外部实例，通过 `DB_HOST/PORT/...` 连接）。

详见 `deployment.md`。

---

## 6. `.gitignore` / `.git/info/exclude`

**位置**：

- 仓库级：`.gitignore`
- 本地级：`.git/info/exclude`

**当前 `.git/info/exclude` 关键内容**：

```gitignore
.local-*
.trae
AGENTS.md
```

说明：

- `AGENTS.md`、`HERMES.md` 等根级管理类文件若不想入库，可保留在此
- `.local-*`：本地实验性文件前缀
- `.trae`：Trae IDE 的本地目录（含 skills、rules 等，**不**入库）

---

## 7. 关键 IDE 目录

| 目录       | 作用                                                          |
| ---------- | ------------------------------------------------------------- |
| `.trae/`   | Trae IDE 的本地数据（skills、rules、settings 等）——**不入库** |
| `.cursor/` | Cursor IDE 的本地数据（含 rules 等）                          |
| `.hermes/` | Hermes Agent 的本地数据（含 skills 等）                       |

> 这些目录仅作用于本地开发体验，**不参与仓库的协作流程**；其中的内容属于 IDE / Agent 私有配置，不应在团队间手动同步。
