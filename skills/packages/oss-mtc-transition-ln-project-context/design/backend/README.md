# Backend

后端技术 + 工作流的**业务无关**沉淀区，与 `components/`（前端组件设计）平级。

## 定位

- 目标读者：需要「全面把握后端开发全貌」的人（含不熟悉后端的开发者）
- 只记录：技术栈、分层模型、目录职责、请求生命周期、基础设施速查、端点开发标准流程、硬规则
- 不记录：具体业务口径、业务字段含义、某个 spec 的实现细节（这些在 `docs/specs/` 与 `docs/design/`）

## 文件索引

| 文件 | 主题 |
|------|------|
| `001-tech-map.md` | 后端技术地图：技术栈 + 分层模型 + 目录地图 + 请求生命周期 + 基础设施速查 + 常用命令 |
| `002-endpoint-workflow.md` | 端点开发工作流：7 步标准流程 + M1/M2 竖切 + 模块纵向切片 + 后端硬规则摘录 |
| `003-alembic-migrations.md` | Alembic 迁移维护：双层编排机制 + 版本链全景 + 新增迁移固定动作 + 排障 + 边界 |

## 与正式文档的关系

本目录是**速览层**，深挖时按主题跳正式文档（均为仓库相对路径）：

| 主题 | 正式文档 |
|------|---------|
| 总体架构 / SQL 双轨制 | `docs/design/architecture.md` |
| API 契约 | `docs/design/api-contracts.md` |
| 数据模型 / 表结构 | `docs/design/data-models.md` |
| 后端编码规范 | `docs/skills/backend/python/coding.md` |
| Kingbase 方言规范 | `docs/skills/database/kingbase/coding.md` |
| TDD 流程 | `docs/workflows/tdd-process.md` |

## 维护约定

- 后端**基础设施变化**（新增目录、换鉴权方式、改连接管理等）→ 更新 `001-tech-map.md`
- 后端**流程/规则变化**（工作流调整、新增硬规则）→ 更新 `002-endpoint-workflow.md`
- 新增文件须登记进本索引表
- 所有写入的路径 / 文件名 / 配置项必须先在仓库中核实，禁止凭记忆编造
