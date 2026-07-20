# 文档目录树

> 本文件描述 `docs/` 全树结构与每个文件的职责。
> 与 [SKILL.md](../SKILL.md) 中的"默认文档骨架"配合使用。

## 总树

```text
<project-root>/
├── AGENTS.md                         # ★ Agent / AI 协作宪法（文档根、权威顺序、禁止项）
└── docs/
    ├── index.md                       # 文档入口（可选）
    ├── roadmap.md                     # ★ 项目级计划（迭代、排期、里程碑）
    ├── design/                        # ★ 全局设计单一事实来源
    │   ├── README.md                  #   设计区索引与技术边界
    │   ├── tech-stack.md              #   技术栈、目录约定、工具链
    │   ├── architecture.md            #   NFR、持久化、部署、外部系统
    │   ├── system-overview.md         #   Shell、IA、全局交互、路由/菜单原则
    │   ├── api-contracts.md           #   HTTP 契约（与 OpenAPI 一致）
    │   ├── data-models.md             #   表 / 实体字段全局权威
    │   ├── routes.md                  #   路由与菜单登记
    │   ├── glossary.md                #   术语表
    │   └── decisions/                 #   ADR：有争议或长远影响的决策
    ├── specs/                         # ★ 特性级 SDD（含五件套与 pm-inputs）
    │   ├── index.md                   #   特性编号登记表
    │   └── _template/                 #   复制用的空模板
    ├── research/                      # 调研与 PoC（非正式基线；采纳须回写 design）
    │   └── README.md
    ├── skills/                        # 编码 / 测试 / AI 提示词等工程习惯
    ├── workflows/                     # SDD / TDD 流程说明（可选）
    └── changelogs/                    # 变更记录（可选；非行为权威）
```

## `docs/design/` — 全局真相

| 路径                        | 解析                                        |
| --------------------------- | ------------------------------------------- |
| `design/README.md`          | 设计区索引与技术边界                        |
| `design/tech-stack.md`      | 技术栈、目录约定、工具链；新库/新栈在此登记 |
| `design/architecture.md`    | NFR、持久化、部署、外部系统关系             |
| `design/system-overview.md` | Shell、IA、全局交互、路由/菜单原则          |
| `design/api-contracts.md`   | HTTP 契约拆分；与 OpenAPI 一致              |
| `design/data-models.md`     | 表 / 实体字段全局权威                       |
| `design/routes.md`          | 路由与菜单登记                              |
| `design/glossary.md`        | 术语表                                      |
| `design/decisions/`         | 有争议或长远影响的决策记录（ADR）           |

**纪律：**

- 特性五件套**引用** design，不另造第二份全局契约
- 破坏性变更必须先改 design / OpenAPI，再改代码
- 不确定的内容写"待补"，**禁止凭空编造**字段、API、表结构

## `docs/specs/` — 特性级 SDD

```text
docs/specs/
├── index.md                          # 特性编号登记表（新特性必须登记）
├── _template/                        # 复制用的空模板
│   ├── pm-inputs/
│   │   ├── pm-requirements-input.md  # PM 需求输入模板
│   │   └── assets/                   # 模板示例资源
│   ├── spec.md
│   ├── acceptance-tests.md
│   ├── data-model-extensions.md
│   ├── plan.md
│   └── tasks.md
└── <编号-短名>/                      # 例：019-model-management
    ├── pm-inputs/
    │   ├── pm-requirements-input.md  # ★ 产品冻结的业务需求
    │   └── assets/                   # 原型 / 切图
    ├── spec.md                       # ★ 五件套
    ├── acceptance-tests.md
    ├── data-model-extensions.md
    ├── plan.md
    ├── tasks.md
    └── （可选）伙伴指南、专项说明等附属文档
```

详细模板见 [spec-five-pieces.md](./spec-five-pieces.md)。

## `docs/research/` — 调研备忘

```text
docs/research/
├── README.md           # 与 design 的边界说明
└── <主题>/ 或 topic.md # 方案对比、PoC、抓帧、第三方探查
```

**用途：** 与项目相关、但**尚未**进入 design/specs 正式基线的调研——备选方案对比、PoC、抓帧、第三方文档摘录、竞品/协议探查等。

| 可以放 research                | 不要放 research                            |
| ------------------------------ | ------------------------------------------ |
| 多方案对比、实验结论、风险记录 | 已采纳的架构结论（应回写 design / ADR）    |
| Gateway / 第三方行为探查笔记   | 密钥、未脱敏生产数据                       |
| 给写五件套用的参考材料         | 让 spec **直接依赖**外部仓库实现细节当契约 |

**纪律：** 调研结论一旦采纳为架构或 API 行为，必须回写 `docs/design/` 或 ADR；五件套只引用 design，不引用"只有 research 里写过"的隐性契约。

## `docs/skills/` · `workflows/` · 根 `AGENTS.md`

| 路径               | 解析                                                 |
| ------------------ | ---------------------------------------------------- |
| `docs/skills/`     | 前后端编码习惯、测试分层、AI 提示词模版等            |
| `docs/workflows/`  | SDD / TDD 流程（如何与五件套衔接）                   |
| 仓库根 `AGENTS.md` | AI 默认约束：读哪些文档、禁止臆造字段、框架/业务边界 |

## 谁写到哪（对照）

| 产出                       | 落点                                             |
| -------------------------- | ------------------------------------------------ |
| 项目迭代计划、排期、里程碑 | `docs/roadmap.md`                                |
| 技术选型、架构取舍         | `design/tech-stack` · `architecture` · ADR       |
| HTTP / 表结构全局定义      | `design/api-contracts` · OpenAPI · `data-models` |
| 业务需求（产品语言）       | `specs/.../pm-inputs/pm-requirements-input.md`   |
| 特性行为与验收、计划任务   | `specs/.../` 五件套                              |
| 未定论的探查               | `research/` → 采纳后回写 design                  |

## 框架 monorepo 差异（若用 next-admin 类模板）

```text
packages/framework-docs/     # 框架 design / specs(000–00x) / skills / workflows
apps/<product>/docs/         # 产品 design 扩展 + 业务 specs(003+)
```

原则相同：框架文档管 Shell/账号等；业务五件套在产品 `docs/specs/`。提示词里的路径按当前仓库改准。

## 历史变更文档落点

| 写什么               | 放哪                                                          |
| -------------------- | ------------------------------------------------------------- |
| 现状 → 目标态正文    | `docs/specs/<相关特性>/` 变更说明，或 MR 附件（团队统一一种） |
| 接口 / 表结构变更    | 回写 `docs/design/api-contracts`、OpenAPI、`data-models.md`   |
| 原来就有五件套的行为 | 同步该特性 `spec.md` / `acceptance-tests.md`                  |
| 探查笔记             | 可先 `docs/research/`；写进正式约定后必须回写 design          |
| 只重构、对外行为不变 | 可无行为 diff，但须写明"行为不变"与验证方式；禁止借重构改行为 |

历史变更模板见 [legacy-change-template.md](./legacy-change-template.md)。
