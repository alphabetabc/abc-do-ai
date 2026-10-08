# roadmap · 节奏与优先级

> 迁移自 `.trae/documents/roadmap.md`（2026-10-08，task-2026-10-08-001）；该源文件已随迁移删除。
> 用途：沉淀 docs 文档化路径的关键决策（D 系列）与下一步优先级。

## 1. 当前阶段

plan-001 ~ plan-010 全部完成（docs/ 基础设施 + five-major-center 七件套 + web/components 视图基础设施文档化 + facts-only 清理）。2026-10-08 起工作区文档迁移入本 skill（task-2026-10-08-001）。

## 2. 关键决策

### 2.1 D-A 系列（早期硬约束沉淀，2026-07-29）

| # | 决策 | 落地位置 |
| --- | --- | --- |
| D-A1 | 代码事实优先：docs/ 所有事实性陈述必须基于当前仓库代码；改进建议必须显式标注「待评审」 | `.trae/rules/docs-authoring-rules.md` Rule 1 |
| D-A2 | docs/ 内容隔离：`/docs/` 不得引用 `.trae/documents/` 与 `.local-docs/` | `.trae/rules/docs-authoring-rules.md` Rule 2 |
| D-A3 | Node.js 脚本优先：批处理/跨文件操作优先用脚本，仅 Node 内置 API，幂等 | `.trae/rules/script-first-rule.md`（D-13） |

### 2.2 D-B 系列（第二轮 research 沉淀，2026-07-29）

| # | 决策 | 来源 |
| --- | --- | --- |
| D-B1 | AGENTS.md 硬约束段保留模板 9 条；删 qiankun + AuthButton 2 条 | `plans/research/2026-07-29-002-agents-md-content-plan.md` |
| D-B2 | 实现习惯段重写：React 18 / valtio / fedx-ui / antd 5 / pnpm / Socket.IO；删「微前端」「按钮鉴权」 | 同上 |
| D-B3 | 项目定位：前端单体（BFF+SSR+大屏），当前重点应急保障大屏 + 五大中心，Brownfield | 同上 |
| D-B4 | 项目特有硬约束落 Trae rules，与 AGENTS.md 解耦 | plan-002 |
| D-B5 | docs/ 最小可行结构：41 文件 + 3 空目录 | `plans/research/2026-07-29-003-docs-mvp-structure.md` |
| D-B6 | 不创建 antd-4.19.1 research / YAPI 快照 | 同上 |
| D-B7 | 保留 skills/{common,frontend} 两层；新增 realtime-protocol / iframe-pages / operations 目录 | 同上 |
| D-B8 | 新增 `docs/specs/_template/pm-inputs/code-inventory.md` | 同上 |
| D-B9 | emergency-support-dashboard：伞形 spec + 7 子 spec | `plans/research/2026-07-29-004-modules-spec-strategy.md` |
| D-B10 | five-major-center 拆 3 子 spec | 同上（**被 D-C4 推翻**） |
| D-B11 | info-management-bureau 单 spec；gis-entry 独立 spec | 同上 |
| D-B12 | PM 输入兜底三档分类（被 D-C3 部分强化：AI 推断档禁用） | `plans/research/2026-07-29-005-pm-input-fallback-strategy.md` |
| D-B13 | docs-api-backend/ 整合方案：右屏→§A / frontend→§B / 摄像头→§C / metahuman 不整合 | `plans/research/2026-07-29-006-existing-docs-integration.md` |

### 2.3 D-C 系列（plan-003 v2 范围决策，2026-07-29）

| # | 决策 |
| --- | --- |
| D-C1 | 路径修正：视图/组件/hooks 在 `web/`，BFF 保留 `src/` |
| D-C2 | 视图层由 fedx-ssr 编译加载（非 external）；`src/` 仅含 BFF |
| D-C3 | PM 不介入时 spec §1/§5 严格留空；不允许 AI 推断起草业务规则 |
| D-C4 | five-major-center 实际 5 条路由，不拆子 spec，单 spec 含 3 自渲染子中心 + iframe-page 共用（推翻 D-B10） |
| D-C5 | plan-003 v2 仅做 five-major-center，其余 3 模块暂缓 |
| D-C6 | information-hub-center 路由已注册（router.tsx:24-27），非「待摸排」 |

### 2.4 D-D 系列（plan-005~010 web/components 文档化，2026-08-03）

| # | 决策 |
| --- | --- |
| D-D1 | 5 个 `web/components/` 子目录落 `docs/design/`，不进 specs/（视图基础设施非业务模块） |
| D-D2 | `web/components/ui/` 颗粒度「API 总册 + 索引」：单文件 `docs/design/component-library.md` |
| D-D3 | 视图层在 `web/` 由 fedx-ssr 编译加载；替代「视图代码在 @fedx-* 包」错误表述 |
| D-D4 | 大屏引擎 Provider 树落 `docs/design/large-screen-engine.md` |
| D-D5 | 操控端↔屏端 WebSocket 落 `docs/design/realtime-protocol/screen-control-socket.md`；与 BFF↔浏览器通道独立 |
| D-D6 | 同进程 WebSocket 端口 9032 保留代码事实，不替 PM 拍板 |
| D-D7 | meta-human 在 large-screen-engine.md 仅写机制；action 调用示例不复制（D-15） |
| D-D8 | 「本仓库不含视图组件代码」表述已全删；socket 实现细节记录于 screen-control-socket.md §4 |

### 2.5 D-E 系列（工作区文档迁移，2026-10-08）

| # | 决策 |
| --- | --- |
| D-E1 | `.trae/documents/**`（含 scripts/）整体迁入本 skill；验收通过后删除源目录 |
| D-E2 | D-13 脚本存放位置改为 `.trae/skills/oss-vis-gd-project-context/scripts/` |
| D-E3 | docs-link 图谱归 references/；归档 plan 与 research 归 plans/（done/ 按月、research/ 平铺） |

## 3. 已完成阶段摘要

- 2026-07-29：第一/二轮 research（7 份结论）→ docs/ 基础设施 41 文件 → AGENTS.md → five-major-center 七件套 → facts-only 清理 → LLM-Skill（five-major-center-interaction-trigger）→ Rule 4 路径统一（45 文件 491 处）
- 2026-08-03：web/components 视图基础设施文档化（plan-005~010：app-bootstrap / data-scheme / large-screen-engine / screen-control-socket / component-library / 4 处遗留修正）
- 2026-10-08：project-context skill 初始化（本 skill）；`.trae/documents` 迁入 skill（task-2026-10-08-001）

## 4. 下一步

| 优先级 | 任务 | 期望产物 | 阻塞项 |
| --- | --- | --- | --- |
| P0 | emergency-support-dashboard 伞形 spec + 7 子 spec | `docs/specs/emergency-support-dashboard/**` | 无 |
| P1 | info-management-bureau 单 spec | `docs/specs/info-management-bureau/**` | 待 P0 |
| P2 | gis-entry 单 spec | `docs/specs/gis-entry/**` | 待 P1 |
| P3 | 整合 4 模块共享实体进 design/{data-models,api-contracts,glossary}.md | design 三件套 | 待 P0~P2 |
