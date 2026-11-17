# design/ · 意图层

每信息只落一个文件。节奏 / 优先级在 `plans/roadmap.md`，**不**放本目录。禁止另建 `codebase-map.md`（结构写在 `architecture.md`）。

| 文件 | 写什么 | 不写什么 |
| --- | --- | --- |
| `vision.md` | 定位 / 北极星 / 禁止清单 / 假设 | 技术栈细目、目录树 |
| `architecture.md` | 技术栈 / 包边界 / 仓库结构概要 / 关键决策 | 北极星文案、用户旅程正文 |
| `user-story-map.md` | 角色与主旅程 | 架构禁令、计划索引 |
| `skeleton.md` | 大屏骨架：目录职责 / 关键决策 / 已知缺口 | 物料内容、workflow 步骤正文 |
| `v1-skill-mvp/schema-runtime.md` | v1（skill 组装路线）：双路径定位 / Schema 草案 / 物料配置契约 / 渲染器职责 / 边界 | 实施排期、任务拆解（归 `plans/`） |
| `v2-chat-mcp/chat-mcp.md` | v2（聊天窗 + MCP 迭代）：产品形态 / MCP 接口契约 / 演示时序 / 分期 P0-P2 | v1 归档内容、plans 层信息 |
| `v2-chat-mcp/hld.md` | v2 概要设计：技术栈选型 / 模块划分与依赖规则 / 数据流 / 传输层约定 / 目录规划 | tool 级详细设计（归任务卡） |

## 版本目录约定

迭代设计按版本目录组织：`v1-skill-mvp`（已完成）→ `v2-chat-mcp`（进行中）→ `v3-…`。旧版本目录只归档不再扩写；活设计写当前版本目录。

占位正文统一为「待 init」；有内容才扩写。
