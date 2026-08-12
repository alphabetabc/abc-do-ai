# 项目综合记录（Project Overview）

> 本文件作为 oss-mtc-transition-ln 项目的「综合概览」，覆盖项目背景、技术栈、模块清单、当前状态、关键约定与文档索引。
> 详细设计请以 `docs/design/` 与 `docs/specs/index.md` 为准。

---

## 1. 项目身份

| 项         | 值                                             |
| ---------- | ---------------------------------------------- |
| 仓库名     | `oss-mtc-transition-ln`                        |
| 项目中文名 | 辽宁省退役军人事务综合管理服务平台（**PDVA**） |
| 类型       | 全栈 Web 应用（前后端 + 数据库）               |
| 当前阶段   | **开发中**                                     |
| 目标用户   | 辽宁省退役军人事务管理相关业务人员、运维人员   |

> 项目代号 `pdva` 出现在镜像名（`pdva-frontend`、`pdva-backend`）与 Compose 配置中。

---

## 2. 技术栈

### 2.1 前端

| 技术                            | 版本    | 用途            |
| ------------------------------- | ------- | --------------- |
| React                           | 19.x    | UI 框架         |
| Ant Design                      | 6.x     | 组件库          |
| @ant-design/pro-components      | 2.x     | Pro 系列组件    |
| React Router                    | 7.x     | 路由            |
| Zustand                         | 5.x     | 客户端状态      |
| Axios                           | 1.x     | HTTP 客户端     |
| Day.js                          | 1.x     | 日期处理        |
| React Activation                | 0.13.x  | 页签保活        |
| Vite                            | 8.x     | 构建/开发服务器 |
| TypeScript                      | 6.x     | 类型系统        |
| Vitest + @testing-library/react | —       | 单元测试        |
| ESLint + Prettier               | —       | Lint/Format     |
| 包管理                          | pnpm 10 | —               |

### 2.2 后端

| 技术                  | 版本/说明 | 用途                                           |
| --------------------- | --------- | ---------------------------------------------- |
| Python                | 3.11      | 运行时                                         |
| FastAPI               | —         | Web 框架                                       |
| SQLAlchemy            | —         | ORM（数据库方言封装 `kingbase_sqlalchemy.py`） |
| Alembic               | —         | 数据库迁移                                     |
| Pydantic              | —         | Schema 校验                                    |
| Uvicorn               | —         | ASGI 服务器                                    |
| python-jose / passlib | —         | JWT / 密码哈希                                 |
| uv                    | latest    | 包管理（替代 pip/poetry）                      |
| pytest                | —         | 测试                                           |

### 2.3 数据 & 中间件

| 项        | 说明                                                           |
| --------- | -------------------------------------------------------------- |
| 主数据库  | **Kingbase**（人大金仓，Oracle 兼容模式）                      |
| 连接协议  | PostgreSQL 协议（`DB_SQL_COMPATIBILITY=oracle`）               |
| 多 schema | `umc` / `vportal` / `dw_comparison` / `dw_basic_lc` / `public` |
| 缓存      | **未引入**（一期架构）                                         |
| 消息队列  | **未引入**（一期架构）                                         |

### 2.4 部署与工具链

| 项               | 说明                                |
| ---------------- | ----------------------------------- |
| mise             | 统一管理 Node/Python/pnpm/uv 版本   |
| Docker + Compose | 一体化打包（不含 DB）               |
| 文档规范         | SDD（Spec-Driven Development）+ TDD |
| 协作方式         | Git MR，规范化提交                  |

---

## 3. 模块清单（按 docs/specs 编号）

> 编号规则：`NNN-<kebab-name>/`，含 `spec` / `plan` / `tasks`（通常） / `acceptance-tests` / `data-model-extensions` 五件套。

### 3.1 基础框架

| 编号 | 名称           | 状态                               |
| ---- | -------------- | ---------------------------------- |
| 000  | framework      | 框架级（菜单/布局基线）            |
| 001  | authentication | 登录、鉴权、JWT、Captcha、密码策略 |

### 3.2 账号与组织（UMC）

| 编号 | 名称                                            |
| ---- | ----------------------------------------------- |
| 002  | account-administration                          |
| 003  | organ-structure-management（组织架构）          |
| 004  | division-type-management（区划类型）            |
| 005  | division-management（区划）                     |
| 006  | organization-type-management（组织类型）        |
| 007  | organization-perspective-management（组织视角） |
| 008  | organization-structure-management（组织结构）   |
| 009  | user-management（用户）                         |

### 3.3 权限与应用

| 编号 | 名称                             |
| ---- | -------------------------------- |
| 010  | application-management（应用）   |
| 011  | authorization-management（授权） |
| 012  | dictionary-management（字典）    |
| 013  | function-management（功能）      |
| 014  | menu-management（菜单）          |
| 015  | role-management（角色）          |

### 3.4 审计日志

| 编号 | 名称                                   |
| ---- | -------------------------------------- |
| 016  | application-access-log（应用访问日志） |
| 017  | access-log（访问日志）                 |
| 018  | sms-log（短信日志）                    |

### 3.5 比对统计（comparison）

| 编号    | 名称                                                                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 019     | comparison-statistics-query（比对统计查询）                                                                                                                                                         |
| 020     | person-existence-query（人员存在查询）                                                                                                                                                              |
| 021     | contrast-information（比对信息）                                                                                                                                                                    |
| 022     | comprehensive-information-query（综合信息查询）                                                                                                                                                     |
| 023–034 | population / education-training / crime / tax / loan / social-assistance / urban-pension / enterprise-pension / employment-registration / housing-status / medical-insurance / petition-appeal 比对 |

### 3.6 可视化分析（visual / 大屏）

| 编号   | 名称                                          | 状态/范围                                           |
| ------ | --------------------------------------------- | --------------------------------------------------- |
| 035    | visual-monthly-statistics（**统计分析月报**） | M1–M3 已实现；M4 分析报告待建                       |
| (待建) | **人员信息大屏**                              | 数据源 `dw_basic_lc.stats_*` 已有；前端待建         |
| (待建) | **信访信息大屏**                              | 数据源 `dw_basic_lc.letter_screen_*` 已有；前端待建 |
| (待建) | **大数据综合展示** `/visual/big-screen`       | 由 035 spec §1.4 列出，独立 spec 待建               |

> 可视化分析相关开发管理详见仓库根 `AGENTS.md`；AGENTS 模块表详见 `project-meta.md` §1。

---

## 4. 目录结构（精简版）

```
oss-mtc-transition-ln/
├── frontend/                          # 前端应用（React + Vite）
│   ├── src/
│   │   ├── pages/                     # 页面（含 visual、auth、account 等）
│   │   ├── components/                # 通用组件
│   │   ├── api/                       # 后端 API 封装
│   │   ├── hooks/                     # 自定义 hooks
│   │   └── store/                     # Zustand store
│   └── package.json                   # pnpm@10
├── backend/                           # 后端应用（FastAPI + uv）
│   ├── app/
│   │   ├── api/                       # 路由层（api/visual/、api/v1/、api/comparison/）
│   │   ├── services/                  # 业务编排（services/visual/、services/comparison/ 等）
│   │   ├── schemas/                   # Pydantic 模型
│   │   ├── core/                      # 配置、安全、依赖、菜单鉴权
│   │   ├── db/                        # SQLAlchemy session/database
│   │   ├── repositories/sql/          # 应用侧 SQL（含 visual/、comparison/）
│   │   └── middleware/                # 审计日志等
│   ├── alembic/                       # 迁移版本
│   ├── db/
│   │   ├── migrations/kingbase_oracle # Kingbase 方言源脚本
│   │   ├── seeds/                     # 测试种子数据
│   │   └── data_patches/              # 菜单/数据补丁
│   ├── tests/                         # pytest 测试
│   ├── scripts/                       # 一次性数据/迁移脚本
│   └── pyproject.toml                 # uv 管理依赖
├── docs/                              # 正式文档（specs / design / skills / standards / workflows）
├── assets/                            # 历史 SQL 源（迁移输入）
│   ├── 账号管理/                       # umc.sql（实际存在）
│   └── ⚠️ 可视化分析/                  # AGENTS §2.2 引用但实际不存在；SQL 源在 pm/ 私人输入中
├── docker-compose.yml                 # 一体化部署
├── .env.docker(.example)              # 部署环境变量
├── mise.toml                          # 工具链版本管理
├── README.md                          # 项目主入口
├── AGENTS.md                          # 大屏开发管理（团队私有元文档）
└── HERMES.md                          # Hermes Agent 框架说明（本地）
```

---

## 5. 当前开发状态（概览）

> 以下为综合自代码与文档的判断，非官方进度报告。

| 域                                    | 状态                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| **认证 / 权限（001/010–018）**        | 主体已实现；按 spec 五件套维护                                                |
| **组织 / 区划（002–008）**            | 主体已实现，仍在按 PM 输入迭代细节                                            |
| **菜单 / 角色 / 授权（014/015/011）** | 主体已实现                                                                    |
| **比对统计（019–034）**               | 大量 spec 已建，部分业务已在 `api/comparison/` 与 `services/comparison/` 落地 |
| **可视化分析 / 大屏（035 + 待建）**   | 035 月报 M1–M3 已实现，M4 待建；人员/信访/综合大屏前端待建                    |
| **AI 工具集成**                       | docs/skills/ai-tools/claude-cursor 已具备参考                                 |
| **审计 / 日志**                       | 016/017/018 spec 已建；中间件 `audit_log.py` 已有                             |

---

## 6. 关键约定

### 6.1 文档

- `docs/specs/<NNN>-<name>/` 五件套：spec / plan / tasks / data-model-extensions / acceptance-tests
- 文档交叉引用以 `docs/` 内路径为准（**不要**跨目录混入 `AGENTS.md` / `.trae/` / `.local-*`）
- API 行为以 `docs/design/api-contracts.md` 与 OpenAPI 为最终单一事实来源

### 6.2 后端

- 路由：`backend/app/api/<domain>/`；编排：`backend/app/services/<domain>/`
- 分层禁止循环：service → api 反向禁止
- Schemas（Pydantic）只放请求/响应/查询聚合，**不**含 SQL
- 命名：`snake_case`（函数/变量）、`PascalCase`（类）、`UPPER_SNAKE`（常量）
- 详见 `.cursor/rules/backend-fastapi-python.mdc`

### 6.3 前端

- 大屏相关目录与开发流程见 `AGENTS.md`
- 通用 React 规范见 `docs/skills/frontend/react/coding.md`
- Mock 账号（如 `admin`）在 dev/mock 模式可用；生产必须按 `docs/design/api-contracts.md` §7.1.1 满足密码策略

### 6.4 数据库

- 库对象变更（DDL / 视图 / 函数 / 过程）走 Alembic migration
- 应用运行时加载的查询 SQL 放 `backend/app/repositories/sql/<domain>/`，**不**入 migration
- Kingbase 方言标识：目录 `kingbase_oracle/` 或文件名带 `kingbase`
- 详见 `docs/design/architecture.md`

### 6.5 安全 & 合规

- 鉴权：菜单项粒度 + JWT（HS256）+ Refresh Token
- 密码策略：参见 `docs/design/api-contracts.md` §7.1.1 与 `001-authentication/spec.md`
- 审计：关键接口接入 `middleware/audit_log.py`

---

## 7. 文档索引（不要重复展开，链回主索引）

| 我想了解…         | 入口                             |
| ----------------- | -------------------------------- |
| 系统总览          | `docs/design/system-overview.md` |
| 架构设计          | `docs/design/architecture.md`    |
| 数据模型          | `docs/design/data-models.md`     |
| API 契约          | `docs/design/api-contracts.md`   |
| 技术栈            | `docs/design/tech-stack.md`      |
| 术语表            | `docs/design/glossary.md`        |
| 全部 spec         | `docs/specs/index.md`            |
| 开发规范          | `docs/skills/README.md`          |
| 工作流程          | `docs/workflows/README.md`       |
| 项目编码/安全规范 | `docs/standards/README.md`       |
| 大屏开发          | `AGENTS.md`                      |

---

## 8. 变更记录

| 日期       | 变更                                                                      | 备注 |
| ---------- | ------------------------------------------------------------------------- | ---- |
| 2026-08-11 | 在 `.trae/skills/oss-mtc-transition-ln-project-context/env/` 创建综合记录 | 初版 |
