# 004-docs-tree-guide.md

> 迁移自 `.trae/documents/design/docs-function-description.md`（2026-10-08，task-2026-10-08-001）；该源文件已随迁移删除。
> 作用：沉淀项目 `docs/` 交付物树的功能职责划分。范围：`docs/` 下所有子目录 + 顶层文件；不写具体模块 spec 内容。

## 1. 顶层

| 文件 | 角色 | 谁写 | 谁读 |
| --- | --- | --- | --- |
| `docs/index.md` | 文档总站（导航） | TL | 全员 |
| `docs/ai-prompts-guide.md` | AI 协作提示词模板 | TL | AI 协作者 |

## 2. design/ — 全局设计（权威）

> 定义性文档（「本项目用什么、怎么用」）；所有模块 spec 引用但不重复。**全局权威**，所有 spec 在此之上做减法。

### 2.1 核心文件

| 文件 | 角色 | 关键内容 |
| --- | --- | --- |
| `docs/design/tech-stack.md` | 技术栈 | react 18.1.0 / valtio 1.11.2 / fedx-ui 2.1.5 / antd 5.26.7 / npm 脚本 |
| `docs/design/system-overview.md` | 信息架构 | 路由 / 壳层 / 菜单 / 配置入口 |
| `docs/design/architecture.md` | 整体架构 | BFF + 视图层 + IA 总览 |
| `docs/design/data-models.md` | 全局数据模型 | 跨模块共享实体 |
| `docs/design/api-contracts.md` | HTTP 契约索引 | BFF 端点 / mock 索引 |
| `docs/design/framework-communication.md` | 框架间通信 | BFF ↔ 前端 / BFF ↔ 第三方 |
| `docs/design/glossary.md` | 术语表 | 业务 / 技术名词 |
| `docs/design/README.md` | design/ 索引 | — |

### 2.2 子目录

| 子目录 | 角色 | 谁写 |
| --- | --- | --- |
| `docs/design/decisions/` | ADR 模板（架构决策记录） | TL |
| `docs/design/realtime-protocol/` | Socket.IO 实时数据契约 | TL |
| `docs/design/iframe-pages/` | 第三方 iframe 嵌入清单 | TL |

维护原则：改一次全员受用；改动需 TL 评审；spec 引用而非重写。

## 3. operations/ — 运维

| 文件 | 角色 |
| --- | --- |
| `docs/operations/deployment.md` | 部署指南（pm2 / 端口 / 静态资源） |
| `docs/operations/troubleshooting.md` | 故障排查清单 |
| `docs/operations/README.md` | operations/ 索引 |

维护原则：遇到线上问题写一条；与 `docs/design/architecture.md` 运行时/部署章节交叉。

## 4. research/ — 调研记录

| 文件 | 角色 |
| --- | --- |
| `docs/research/README.md` | research/ 索引 + 调研模板 |

维护原则：写一次定稿不再改；命名 `YYYY-MM-DD-XXX-<topic>-findings.md`；决策依据被 design/decisions/ 采纳；不作为日常工作文档。

## 5. skills/ — 工程习惯

| 子目录 | 角色 |
| --- | --- |
| `docs/skills/common/` | 通用习惯（git-workflow） |
| `docs/skills/frontend/` | 前端习惯（react/coding、react/testing） |
| `docs/skills/ai-tools/` | AI 工具使用（claude-cursor/prompts） |

维护原则：写代码前必读；与 standards/ 互为补充（skills = 怎么做，standards = 做到什么）；模块 spec 引用而非重写。

## 6. standards/ — 编码规范

| 文件 | 角色 |
| --- | --- |
| `docs/standards/coding-standards.md` | 编码规范（命名 / 注释 / 文件结构） |
| `docs/standards/security-standards.md` | 安全规范（XSS / CSRF / token 处理） |
| `docs/standards/README.md` | standards/ 索引 |

维护原则：评审时引用；违反 MR 退回；改动需 TL 评审。

## 7. workflows/ — 流程定义

| 文件 | 角色 |
| --- | --- |
| `docs/workflows/as-is-to-be-guide.md` | 9 件套怎么写（as-is → spec 流程） |
| `docs/workflows/brownfield-module-refactor.md` | 存量改造的步骤 |
| `docs/workflows/tdd-process.md` | TDD 流程（单测 / E2E） |
| `docs/workflows/README.md` | workflows/ 索引 |

维护原则：改动流程需 TL 评审；各模块 spec 引用而非重写。

## 8. specs/ — 业务模块 spec（项目交付物）

### 8.1 顶层

| 文件 | 角色 |
| --- | --- |
| `docs/specs/index.md` | 模块索引（所有模块的登记表） |
| `docs/specs/spec-split-guide.md` | 复杂模块拆分指南 |

### 8.2 模板

`docs/specs/_template/` — 5 件套模板 + pm-inputs 子目录。

### 8.3 模块目录（每个模块 9 件套）

| 文件 | 角色 | 谁写 |
| --- | --- | --- |
| `as-is-architecture.md` | 代码现状（10 节） | AI / dev（基于代码事实） |
| `spec.md` | To-Be 目标态（9 节） | PM（AI 辅助填充） |
| `pm-inputs/pm-requirements-input.md` | PM 输入（§A–§H） | PM（业务语言） |
| `pm-inputs/code-inventory.md` | 代码清单（A–M 节） | AI / dev（基于代码事实） |
| `acceptance-tests.md` | 验收场景（Gherkin） | PM + QA |
| `plan.md` | 实施计划（模板框架） | PM / TL |
| `tasks.md` | 任务分解（模板框架） | PM / TL |
| `data-model-extensions.md` | 数据增量（实体清单） | dev |
| `assets/README.md` | 截图归档 | 任何 |

### 8.4 9 件套协作流程

```text
PM 业务语言                AI 读代码事实                  PM 拍板
        ↓                            ↓                                ↓
pm-requirements-input.md  ──→  as-is-architecture.md  ──→  spec.md (PM 评审)
                            code-inventory.md              acceptance-tests.md
                                                            data-model-extensions.md
                                                            plan.md (实施顺序)
                                                            tasks.md (任务拆分)
                                                                            ↓
                                                                    dev 实施
```

### 8.5 9 件套职责边界（D-11 执行）

| 文档 | 写 | 不写 |
| --- | --- | --- |
| pm-requirements-input.md | PM 业务语言 | AI 推断的业务规则 |
| as-is-architecture.md | 代码事实（路由 / 文件 / 配置） | 改进建议 / 重构方向 |
| code-inventory.md | 代码清单（依赖 / 组件 / 状态） | 跨模块互链分析 |
| spec.md | PM 拍板（背景 / 角色 / 边界） | R1–R5 切片 / GAP-* |
| acceptance-tests.md | PM + QA（业务场景） | 实施切片 |
| plan.md | PM / TL（实施顺序） | AI 提的「建议」 |
| tasks.md | PM / TL（任务拆分） | AI 派的任务 |
| data-model-extensions.md | dev（实体 / 字段） | 整合策略 / 合并状态 |
| assets/README.md | 谁截图谁写 | AI 生成的图 |

## 9. 文档间引用关系

```text
design/ ────────► spec.md / code-inventory.md（引用，不重写）
skills/ ────────► spec.md / code-inventory.md（开发习惯）
standards/ ─────► spec.md（评审依据）
workflows/ ─────► plan.md / tasks.md（流程）
operations/ ────► 独立（事件驱动）
research/ ──────► 独立（已归档）
specs/ ─────────► 业务模块交付物（9 件套）
```

## 10. 文档维护规则

| 规则 | 适用范围 |
| --- | --- |
| D-11 代码事实优先 | 所有事实性陈述必须基于代码 |
| D-12 docs/ 内容隔离 | docs/ 不得引用 `.trae/` / `.local-docs/` |
| D-13 Node.js 脚本优先 | 批处理 / 跨文件 / 验证类任务 |
| TL 评审 | design/ / standards/ / workflows/ 改动 |
| PM 主导 | spec.md / pm-requirements-input.md / acceptance-tests.md |
| dev 主导 | as-is-architecture.md / code-inventory.md / data-model-extensions.md |
| PM / TL 主导 | plan.md / tasks.md |

## 11. 关联文档

- `docs/index.md` — 文档总站
- `docs/specs/index.md` — 模块索引
- `oss-vis-gd-project-context/plans/roadmap.md` — 路线图（本 skill 内）
- `oss-vis-gd-project-context/env/rules/01-link-format.md` — 链接格式规范（D-14 路径格式已并入）
- D-11/D-12（代码事实优先 / docs 内容隔离）决策出处：`oss-vis-gd-project-context/plans/roadmap.md` §决策表。⚠️ 规则原文 `.trae/rules/docs-authoring-rules.md` 当前在 `.trae/rules/` 中不存在（根 AGENTS.md 仍引用），属遗留待处理项
