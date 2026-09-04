# Task · 2026-09-04-002-earth-dev-docs

## 任务元信息

| 项       | 值                                                                      |
| -------- | ----------------------------------------------------------------------- |
| 编号     | `task-2026-09-04-002-earth-dev-docs`                                    |
| Status   | 🟢 已完成                                                               |
| 类型     | 仅 docs 维护（AI 项目上下文 skill 目录）                                |
| 影响范围 | `.agents/skills/oss-shaanxi-gold-building-project-context/design/frontend/earth/`（index.md / common-layer.md / business-layer.md） |
| Roadmap  | earth 组件文档化（对应 `docs/specs/000-components/001-earth/` 特性）    |
| 验收标准 | 文档自足：开发者正常开发无需回读 earth 源码；所有行号均来自当日实读     |
| 前置依赖 | 无                                                                      |

---

## 目标（Goal）

为 `web/components/earth` 组件建立面向开发的深度文档（存放于本 skill 的 `design/frontend/earth/`），按「通用层 + 业务层」两份文档拆分，并补充数据/配置维护指南，使文档可直接作为开发指导。

---

## 步骤（执行计划）

### 步骤 1：通用层文档

- **动作**：逐文件 Read 入口/hooks/store/helpers/stage 全部源码后撰写
- **输出**：`design/frontend/earth/common-layer.md`
- **🛑 等待用户**：否

### 步骤 2：业务层文档

- **动作**：逐文件 Read business / business-gold-building / editor 源码后撰写
- **输出**：`design/frontend/earth/business-layer.md`
- **🛑 等待用户**：否

### 步骤 3：数据与配置维护指南

- **动作**：查证 earthSetting（config.default.ts）、objectResourceList.json、presets、cityDataAssets 来源后补写专节
- **输出**：`business-layer.md` §5
- **🛑 等待用户**：否

### 步骤 4：索引

- **动作**：index.md 改写为薄索引（指向两份文档）
- **输出**：`design/frontend/earth/index.md`
- **🛑 等待用户**：否

---

## 交付物清单

- `design/frontend/earth/index.md`：两层文档薄索引
- `design/frontend/earth/common-layer.md`：通用层详解（入口 / hooks / store / helpers / stage 13 个子组件、横切数据流、已知问题清单）
- `design/frontend/earth/business-layer.md`：业务层详解（business / business-gold-building / editor、二次开发指南、§5 数据与配置维护指南、已知问题清单）

## 备注

- 曾误改 `docs/specs/000-components/001-earth/tasks.md`（新增 M5 段），未走审批，已回退；spec 目录变更需另行走 specs 流程。

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 任务索引行已登记（归档时移除）
- [x] `backlog.md` —— 未登记过，N/A
- [x] `plans/roadmap.md` —— N/A
