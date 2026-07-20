# 设计区索引

> 全局设计单一事实来源。特性五件套**引用** design，不另造第二份契约。

## 文件清单

- [tech-stack.md](./tech-stack.md) — 技术栈、目录约定、工具链
- [architecture.md](./architecture.md) — NFR、持久化、部署、外部系统
- [system-overview.md](./system-overview.md) — Shell、IA、全局交互、路由/菜单原则
- [api-contracts.md](./api-contracts.md) — HTTP 契约（与 OpenAPI 一致）
- [data-models.md](./data-models.md) — 表 / 实体字段全局权威
- [routes.md](./routes.md) — 路由与菜单登记
- [glossary.md](./glossary.md) — 术语表
- [decisions/](./decisions/) — ADR

## 纪律

- 不确定的内容写"待补"，**禁止凭空编造**字段、API、表结构
- 破坏性变更必须先改 design / OpenAPI，再改代码
