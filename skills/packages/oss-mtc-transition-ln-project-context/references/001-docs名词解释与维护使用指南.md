# 001 · docs 名词解释与维护使用指南

> 性质：**长期维护文档**（稳定、通用、非大屏特化）
> 日期：2026-08-12
> 来源：skill 现有文档盘点 + docs/ 全量扫描（design / specs / skills / workflows / standards）
> 适用范围：仓库根 `docs/` 下所有正式文档；Agent 加载本 skill 后独立完成 docs 维护和基于 docs 的编码
> 与 [../design/001-big-screen-dev-guide.md](../design/001-big-screen-dev-guide.md) 的关系：**复用其通用部分（门禁 / 硬规则 / 五件套映射 / 12 步骨架）**，补其大屏特化之外未覆盖的缺口，详见 §11

---

## 0. 这份文档怎么读

按使用场景选读：

| 你的角色 / 场景 | 重点读 |
| --- | --- |
| 第一次接触本仓库的 Agent | §1 定位 + §2 目录总览 + §3 名词速查 |
| 收到一个 docs 维护任务（改某份 docs 文档） | §4 门禁 + §5 维护流程 + §7 引用规范 |
| 收到一个编码任务（基于 docs 写代码） | §6 编码流程 + §3 名词 + §10 硬规则 |
| 评审 / 合规检查 | §4 门禁 + §7 引用规范 + §9 状态约定 |
| 只想知道"某份 docs 文档是干嘛的" | §2 目录总览（按子目录/文件名定位） |

**不必顺序读**：每节独立可查，交叉引用用行号（`Lxx`）跳转。

---

## 1. docs/ 定位与设计原则

`docs/` 是项目**统一正式文档集合**（团队可见、入 Git）。三个核心原则：

1. **单一事实来源**：领域模型 / API 形状 / 架构决策**只能**定义在 `docs/design/` 下；其他文档引用，不复制。
2. **SDD 驱动**：每个特性（feature）在 `docs/specs/NNN-<name>/` 下用**五件套**交付；特性编号在 `docs/specs/index.md` 分配。
3. **门禁分层**：所有改动按 L1（自由）/ L2（提案）/ L3（严控）分级（详见 §4）。

完整阅读顺序见 [docs/index.md](index.md)。

---

## 2. docs/ 目录结构总览

docs/ 下分 6 个子目录。每个子目录标：**作用** / **何时修改** / **何时查阅** / **关键章节**。

### 2.1 `docs/design/` — 单一事实来源

| 项 | 说明 |
| --- | --- |
| **作用** | 系统级叙述、架构与 NFR、领域/表设计、HTTP 契约、技术栈、术语表、ADR |
| **何时修改** | 架构 / 契约 / 数据模型 / 技术栈选型变更时（走 L3 提案） |
| **何时查阅** | 编码前查领域与 HTTP 形状（必读）；新特性立项查 IA 与权限模型 |
| **关键文档** | `system-overview.md` / `architecture.md` / `data-models.md` / `api-contracts.md` / `tech-stack.md` / `glossary.md` / `decisions/` |

| 文件 | 一句话 | 何时必须改 | 何时必须查 |
| --- | --- | --- | --- |
| [system-overview.md](design/system-overview.md) | 系统背景、IA（菜单/路由）、页面框架、权限模型 | 新增/调整菜单或路由（§2.2.2）；调整数据可见性策略（§2.4.1） | 新建前端页面前查菜单项 key；查权限模型 |
| [architecture.md](design/architecture.md) | NFR、选型理由、数据库与持久化分工、部署拓扑 | 新增/调整技术选型；新增例程（视图/函数）登记到 §5.3 | 跨模块设计决策时；查选型理由 |
| [data-models.md](design/data-models.md) | 全局领域模型、数据库表字典（含统计快照表） | 新增/调整表结构；调整统计口径 | 编码前查表字段、字段口径、外键 |
| [api-contracts.md](design/api-contracts.md) | HTTP 错误体、请求/响应形状、§7 端点详述（按编号） | 新增/调整端点；调整响应形状；调整错误码 | 后端编码查端点契约；前端编码查响应类型 |
| [tech-stack.md](design/tech-stack.md) | 核心依赖版本（项目钉选）、环境分层 | 版本钉选变更；新增依赖到钉选表 | 引入新依赖前查是否已在钉选表 |
| [glossary.md](design/glossary.md) | 领域术语正式定义（团队规范用词） | 新增跨 spec 复用的领域术语 | 写 spec / 文档时统一用词 |
| [decisions/](design/decisions) | 架构决策记录（ADR） | 重大选型变更需写 ADR 时 | 查历史决策依据，避免重复讨论 |

### 2.2 `docs/specs/` — SDD 特性切片

| 项 | 说明 |
| --- | --- |
| **作用** | 每个特性（feature）的 SDD 五件套交付（spec / plan / tasks / data-model-extensions / acceptance-tests），含 PM 原始输入 |
| **何时修改** | 新建特性（分配编号后从 `_template/` 复制五件套）；特性演进（更新五件套对应章节） |
| **何时查阅** | 编码前必读对应特性的 `spec.md`（需求 + 边界）；写验收测试读 `acceptance-tests.md` |
| **关键文档** | `index.md`（特性编号索引 + 状态表）+ `NNN-<name>/{5 文件}` + `_template/`（模板） |

| 子目录 / 文件 | 一句话 | 何时必须改 | 何时必须查 |
| --- | --- | --- | --- |
| [index.md](specs/index.md) | 特性编号 + 业务说明 + 状态表（已完成 / 进行中 / 待建） | 新增特性分配编号；特性状态变化 | 立项前查编号是否已占用；查特性当前状态 |
| `_template/` | 五件套空白模板 + pm-input 示例 | 仅 PM + 架构双签时可改 | 复制五件套时用 |
| `NNN-<name>/spec.md` | 特性需求（背景、角色、界面、数据、API、非功能、开放问题） | 需求变更；新增 §9 开放问题 | 编码前必读 |
| `NNN-<name>/plan.md` | 里程碑与风险 | 里程碑调整；新增风险 | 规划编码节奏时 |
| `NNN-<name>/tasks.md` | 按里程碑拆任务（含任务状态） | 任务进展同步勾选 | 每日看进度 |
| `NNN-<name>/data-model-extensions.md` | 特性级数据扩展（指向 design/data-models.md） | 新增特性级字段/视图/函数 | 编码前查字段口径 |
| `NNN-<name>/acceptance-tests.md` | Gherkin 验收场景 | 新增验收场景 | TDD 红-绿-重构时取场景 |
| `NNN-<name>/pm-inputs/` | PM 原始输入（assets + pm-requirements-input.md） | PM 增补输入；澄清开放问题 | 理解原始需求背景 |

### 2.3 `docs/skills/` — 可复用工程习惯

| 项 | 说明 |
| --- | --- |
| **作用** | 与具体业务无关的工程能力说明，按栈分区（common / frontend / backend / database / devops / ai-tools） |
| **何时修改** | 新增技术栈（复制 README + coding + testing）；栈内规范变更 |
| **何时查阅** | 编码前查对应栈的 `coding.md`；写测试查 `testing.md` |
| **优先级** | `standards/coding-standards.md` 明示：与 skills 冲突时，以 standards 为准 |

| 分区 | 一句话 | 关键文档 | 何时查 |
| --- | --- | --- | --- |
| `skills/README.md` | skills 总索引 | `docs/skills/README.md` | 定位栈入口 |
| `skills/common/` | 跨栈通用（Git / Review / 部署 / 安全工程习惯） | `git-workflow.md` / `coding.md` / `security.md` | 跨栈问题（分支策略、MR、部署） |
| `skills/frontend/react/` | React + TS + Vite + AntD | `README.md` / `coding.md` / `testing.md` | 前端编码 |
| `skills/backend/python/` | Python + FastAPI + Pydantic + SQLAlchemy | `README.md` / `coding.md` / `testing.md` | 后端编码（本项目主后端） |
| `skills/backend/java/` | JDK LTS + Spring | `README.md` / `coding.md` / `testing.md` | Java 后端 |
| `skills/database/kingbase/` | KingbaseES V8 + Oracle 兼容模式 | `README.md` / `coding.md` / `testing.md` | 本项目主库；DB 编码**必读 §1 与 design 对齐表** |
| `skills/database/postgresql/` | 通用 PG 习惯（fallback） | 同上 | 仅原生 PG 实例 |
| `skills/database/mongodb/` | MongoDB（占位） | — | 当前无需查阅 |
| `skills/devops/docker/` | Docker（占位） | — | 当前查 `skills/common/coding.md` 部署发布章节 |
| `skills/ai-tools/claude-cursor/` | Cursor AI 协作 | `README.md` / `prompts.md` | 用 Cursor 开发时 |

### 2.4 `docs/workflows/` — 工作流程

| 项 | 说明 |
| --- | --- |
| **作用** | 定义 SDD（规格驱动）与 TDD（测试驱动）两个核心流程 |
| **何时修改** | 流程步骤变更；MR 门禁规则调整 |
| **何时查阅** | 新建特性走 SDD；写测试走 TDD；评审 MR 查流程联动要求 |

| 文件 | 一句话 | 何时必读 |
| --- | --- | --- |
| [sdd-process.md](workflows/sdd-process.md) | SDD 6 步新建特性流程 + MR 联动要求 + ADR 触发条件 | 新建特性前 |
| [tdd-process.md](workflows/tdd-process.md) | TDD 分层（单元/集成/合同/E2E）+ 与 SDD 产物映射 + 红绿重构节奏 | 写测试前 |

### 2.5 `docs/standards/` — 仓库级硬约束

| 项 | 说明 |
| --- | --- |
| **作用** | 全项目硬约束（编码底线 + 安全门禁），**优先级最高**——与 skills 冲突时以 standards 为准 |
| **何时修改** | 全项目硬约束变更（如错误体格式、安全分级调整、版本锁策略） |
| **何时查阅** | 编码前必读；合规检查 |

| 文件 | 一句话 | 何时必读 |
| --- | --- | --- |
| [coding-standards.md](standards/coding-standards.md) | 单一事实来源 / 语言与风格 / 错误与日志 / 依赖与配置 / 文档联动 / 测试底线 | 编码前 |
| [security-standards.md](standards/security-standards.md) | 数据分级 / 认证授权 / 传输存储 / 依赖漏洞 / 审计留痕 / 合规 | 涉及安全时 |

### 2.6 `docs/research/` — 调研备忘（可选）

| 项 | 说明 |
| --- | --- |
| **作用** | 临时性技术调研、第三方对比、风险评估 |
| **何时修改** | 启动新调研 |
| **何时查阅** | 立项前的可行性调研；历史调研复盘 |

### 2.7 根文件

| 文件 | 一句话 | 何时查 |
| --- | --- | --- |
| [docs/index.md](index.md) | 文档总站：分区说明 + 建议阅读顺序 | 第一次接触 docs/ 时 |
| [docs/ai-prompts-guide.md](ai-prompts-guide.md) | AI 协作提示词指南（生成 pm-input、五件套、按 spec 开发） | AI 生成 spec / 文档时 |

---

## 3. 名词速查表

按字母顺序 / 中文拼音简排。每个名词：**定义 + 出处**。

| 名词 | 英文 | 定义 | 出处 |
| --- | --- | --- | --- |
| **五件套** | Five-piece set | SDD 特性交付的 5 份文档：`spec.md` / `plan.md` / `tasks.md` / `data-model-extensions.md` / `acceptance-tests.md` | [workflows/sdd-process.md](workflows/sdd-process.md) §2 |
| **SDD** | Specification-Driven Development | 规格驱动开发：编码前在 specs/ 锁定边界 / 契约 / 验收，再实现 | [workflows/sdd-process.md](workflows/sdd-process.md) |
| **TDD** | Test-Driven Development | 测试驱动开发：先写失败用例（红），再最小实现（绿），再重构 | [workflows/tdd-process.md](workflows/tdd-process.md) |
| **pm-input / pm-requirements-input** | PM Requirements Input | PM 原始需求输入（A-K 章节模板），存在 `specs/NNN-*/pm-inputs/pm-requirements-input.md` | [specs/_template/pm-inputs/](specs/_template/pm-inputs) + [ai-prompts-guide.md](ai-prompts-guide.md) §1.3 |
| **design 四件套** | design four-piece | `docs/design/` 下的核心 4 份：`system-overview.md` / `architecture.md` / `data-models.md` / `api-contracts.md`（也常含 `tech-stack.md`） | [design/README.md](design/README.md) |
| **ADR** | Architecture Decision Record | 架构决策记录，存在 `docs/design/decisions/`，记录重大选型的上下文与决策 | [design/decisions/README.md](design/decisions/README.md) + [adr-template.md](design/decisions/adr-template.md) |
| **单一事实来源** | Single Source of Truth (SSOT) | 领域模型 / HTTP 形状只能定义在 `design/data-models.md` 与 `design/api-contracts.md`，其他文档引用而不复制 | [standards/coding-standards.md](standards/coding-standards.md) §1 |
| **Gherkin** | Gherkin | 验收测试语言：`Given / When / Then` 结构，用于 `acceptance-tests.md` | [workflows/tdd-process.md](workflows/tdd-process.md) §2 |
| **合同测试** | Contract Test | 验证 API 实现与 api-contracts.md §7 契约一致的测试 | [workflows/tdd-process.md](workflows/tdd-process.md) §1 |
| **菜单 key / require_menu_key** | menu key | 后端鉴权粒度到菜单项，参见 `system-overview.md §2.4`；后端用 `require_menu_key("xxx")` 装饰器守卫 | [system-overview.md](design/system-overview.md) §2.4 |
| **NFR** | Non-Functional Requirement | 非功能需求（性能 / 可用性 / 安全等），定义在 `design/architecture.md` 第一部分 | [architecture.md](design/architecture.md) |
| **IA** | Information Architecture | 信息架构：菜单、路由、页面层级；定义在 `design/system-overview.md §2.2` | [system-overview.md](design/system-overview.md) §2.2 |
| **数据可见性策略** | data visibility | `none` / `org_tree` / `self` 三种策略，见 `system-overview.md §2.4.1` | [system-overview.md](design/system-overview.md) §2.4.1 |
| **统计快照表** | stats snapshot | `stats_*` / `letter_screen_*` / `abi_*` 等只读统计表，大屏只消费不写入 | [AGENTS.md §5.2](../../AGENTS.md) |
| **金丝雀 / 蓝绿** | canary / blue-green | 发布策略，详见 `skills/common/coding.md` 部署章节 | [skills/common/coding.md](skills/common/coding.md) §部署与发布 |
| **pm-input 章节 A-K** | pm-input sections | PM 需求输入的 11 个章节（A 功能名片 / B 背景 / C 用户权限 / D 用户旅程 / E 界面清单 / F 数据规则 / G 验收标准 / H 非功能 / I 开放问题 / J 参考 / K 静态资源） | [design/001-big-screen-dev-guide.md §2](../design/001-big-screen-dev-guide.md) |
| **M0-M5 里程碑** | Milestones | SDD 通用里程碑骨架：M0 文档审批 / M1 后端竖切 / M2 批量端点 / M3 前端 / M4 扩展 / M5 联调 | [001-big-screen-dev-guide.md §2](../design/001-big-screen-dev-guide.md) §035 实现切片 |

---

## 4. 文档修改门禁

源自 [001 §0](../design/001-big-screen-dev-guide.md) + [AGENTS.md §10](AGENTS.md)。

| 等级 | 范围 | 修改方式 |
| --- | --- | --- |
| **L1 自由** | `.trae/skills/oss-mtc-transition-ln-project-context/**` | 当前会话可直接编辑 |
| **L2 授权** | 仓库根 `AGENTS.md` | 须走 `plans/roadmap-*.md` §6 提案审批 |
| **L3 严控** | `docs/**/*.md` / `README.md` / `docs/specs/_template/**` | 须走同上提案审批 + PM / 架构师会签 |

**`docs/` 内不同子目录的 L3 严格度差异**：
- `docs/specs/_template/**`：仅 PM + 架构双签可改
- `docs/specs/NNN-<name>/**`：按特性 L3 提案；模板文件被任何 spec 引用即视为稳定
- `docs/design/**`：`architecture.md` / `data-models.md` / `api-contracts.md` 是单一事实来源，修改影响范围大，审批最严
- `docs/skills/**` / `docs/workflows/**` / `docs/standards/**`：影响跨栈 / 跨流程，L3 提案

**docs/ 禁止引用**（详见 §7）：
- ❌ `.trae/` 任意路径
- ❌ `AGENTS.md` / `agents.md`
- ❌ `.local-*` 文件

---

## 5. 通用 docs 维护流程

> 简化版骨架。大屏特化 12 步见 [001 §4](../design/001-big-screen-dev-guide.md)。

### 5.1 新建特性（SDD 6 步，来自 [sdd-process.md §2](workflows/sdd-process.md)）

| 步 | 动作 | 输出文件 | L |
| --- | --- | --- | --- |
| 1 | 在 `specs/index.md` 分配编号与目录名 | `docs/specs/index.md` | L3 |
| 2 | 复制 `_template/` 五件套到新目录 | `docs/specs/NNN-*/{5 文件}` | L3 |
| 3 | 新增实体/字段 → 先更新 `design/data-models.md`（或在 `data-model-extensions.md` 草稿并计划回填） | `docs/design/data-models.md` 或 `data-model-extensions.md` | L3 |
| 4 | 新增端点/响应形状 → 先更新 `design/api-contracts.md §7` 与 OpenAPI，再在 `spec.md` 索引 | `docs/design/api-contracts.md` | L3 |
| 5 | 新增表/迁移 → 更新 `design/architecture.md` 数据库章节并提交 migration | `docs/design/architecture.md` + migration | L3 |
| 6 | 菜单/路由对齐 `design/system-overview.md §2.2.2` | `docs/design/system-overview.md` | L3 |

### 5.2 演进已有特性

| 动作 | 必改文件 |
| --- | --- |
| 需求变更 | `spec.md`（对应章节）+ `acceptance-tests.md`（新增/调整场景） |
| 新增/调整端点 | `design/api-contracts.md §7` → `spec.md` 索引引用 |
| 新增/调整表/字段 | `design/data-models.md` → `data-model-extensions.md` 同步 |
| 新增/调整菜单路由 | `design/system-overview.md §2.2.2` + `AGENTS.md §2.1`（若新增大屏模块） |
| MR 联动要求 | 见 [sdd-process.md §3](workflows/sdd-process.md)：行为 / API / Schema 变化必须联动 spec + design；仅内部重构可只更 tasks.md |

### 5.3 删除 / 废弃

- 特性废弃：`specs/index.md` 状态列改"废弃"；特性目录保留（不删）
- 文档废弃：顶部加 `> ⚠️ 本文档已废弃，详见 xxx`，**不删除**

---

## 6. 基于 docs 的编码流程

> Agent 收到编码任务后的标准动作序列。

### 6.1 编码前阅读顺序（按依赖关系）

```
1. docs/standards/coding-standards.md        ← 仓库级硬约束（优先级最高）
2. docs/standards/security-standards.md      ← 若涉及安全
3. docs/specs/NNN-<name>/spec.md             ← 本特性需求
4. docs/specs/NNN-<name>/acceptance-tests.md  ← 验收场景（用于写测试）
5. docs/specs/NNN-<name>/data-model-extensions.md ← 特性级数据扩展
6. docs/design/data-models.md                ← 全局表字典（先确认字段是否已存在）
7. docs/design/api-contracts.md              ← 端点契约（§7 端点编号）
8. docs/design/architecture.md               ← NFR + 持久化分工
9. docs/design/system-overview.md            ← 菜单/路由 + 权限模型
10. docs/skills/<栈>/coding.md               ← 编码规范
11. docs/skills/<栈>/testing.md              ← 测试规范
12. docs/skills/database/kingbase/coding.md  ← 若涉及 DB（§1 必读）
```

### 6.2 编码中

- 端点形状变更 → 先改 `api-contracts.md §7` 再写代码
- 表结构变更 → 先写 migration + 更新 `data-models.md` 再改 ORM
- 新增第三方库 → 先在 `skills/frontend/react/coding.md §6`（或对应栈）登记再 `pnpm add`

### 6.3 编码后回写 docs

| 改动类型 | 必回写文件 |
| --- | --- |
| 新增端点 | `design/api-contracts.md §7` + `spec.md §9 开放问题` 关闭 |
| 新增表/字段 | `design/data-models.md` + migration 入库 + `data-model-extensions.md` 同步 |
| 新增菜单/路由 | `design/system-overview.md §2.2.2` + `AGENTS.md §2.1`（若大屏） |
| 新增验收场景 | `acceptance-tests.md` + 自动化测试用例 |
| 任务完成 | `specs/NNN-*/tasks.md` 勾选 + `specs/index.md` 状态列更新 |

### 6.4 MR 描述模板

```
## 变更类型
- [ ] 新增端点
- [ ] 新增/调整数据模型
- [ ] 新增/调整菜单路由
- [ ] 内部重构（无需联动 docs）
- [ ] 其他：___

## docs 联动
- design/api-contracts.md §7.xx：___（链接）
- design/data-models.md §x：___（链接）
- specs/NNN-name/spec.md §x：___（链接）
- acceptance-tests.md 新增场景：___

## 验收
- [ ] 自动化测试通过
- [ ] Gherkin 场景对应至少 1 个自动化用例
- [ ] 401 / 403 / 5xx 错误体走 api-contracts §4
```

---

## 7. docs 交叉引用规范

### 7.1 路径约定

| 来源 → 目标 | 路径形式 | 示例 |
| --- | --- | --- |
| docs 内文件互引 | 相对路径（推荐） | `[spec.md](../../specs/038-bigdata-personnel-display/spec.md)` |
| docs → 仓库根其他 | 相对路径 | `[AGENTS.md](../../AGENTS.md)`（注意：AGENTS.md 本身**禁止被 docs 引用**，见 §7.3） |
| 跨域链接 | 绝对 URL 仅用于外部资源 | 不可用于内部 |

### 7.2 章节引用格式

- 章节号：`§6.4`、`§7.18`
- 章节号 + 范围：`§7.18-L520`（大屏实际写法）
- 行号引用：仅在本 skill 内部用（docs/ 内不写 `Lxx`，Markdown 渲染会乱）

### 7.3 docs/ 禁止引用（反幻觉 + 反私有）

> 完整规则：[.trae/rules/docs-no-private-refs.md](../../rules/docs-no-private-refs.md)

- ❌ `.trae/` 任意路径（含 skill / rules / plans）
- ❌ `AGENTS.md` / `agents.md`
- ❌ `.local-*` 文件
- ❌ 个人笔记、未拍板想法

### 7.4 反幻觉自检清单

新建或修改 `docs/` 内文档时自检：

- [ ] 全文未出现 `.trae/` / `AGENTS.md` / `.local-`
- [ ] 引用前已实际 `Read` / `Grep` / `Glob` 验证目标存在
- [ ] 章节编号与现行文件一致（未编造）
- [ ] 表字段名、枚举值、SQL 结果**未凭推测填充**（未知标"待验证"）

---

## 8. docs ↔ skill ↔ AGENTS.md ↔ README.md 关系全景

```
┌─────────────────────────────────────────────────────────────────┐
│  团队可见（入 Git）                                                │
│                                                                  │
│  README.md                  ← 项目入口、启动、部署                  │
│  AGENTS.md                  ← 大屏开发职责、模块表、文档门禁        │
│  docs/                      ← 项目统一正式文档                      │
│    ├─ design/               ← 单一事实来源（SSOT）                  │
│    ├─ specs/                ← SDD 特性切片                          │
│    ├─ skills/               ← 工程习惯（栈内）                      │
│    ├─ workflows/            ← SDD / TDD 流程                        │
│    ├─ standards/            ← 仓库级硬约束（优先级最高）              │
│    ├─ research/             ← 临时调研                              │
│    └─ ai-prompts-guide.md   ← AI 提示词指南                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↑ 引用
┌─────────────────────────────────────────────────────────────────┐
│  私人可见（不入 Git，.git/info/exclude 已排除）                     │
│                                                                  │
│  .trae/skills/oss-mtc-transition-ln-project-context/            │
│    ├─ SKILL.md              ← skill 入口                          │
│    ├─ references/  (本目录) ← docs/ 名词解释与维护使用指南（稳定）  │
│    ├─ design/               ← 大屏特化设计草案与决策（已重构为 001）│
│    ├─ env/                  ← 本地环境、项目元数据                  │
│    ├─ plans/                ← 待办、task、roadmap                  │
│    ├─ pm/                   ← PM 原始输入（只读）                  │
│    └─ scripts/              ← symlink 同步等本地脚本               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**内容归属判断**：问"如果有同事问起这个内容，他应不应该在正式文档里看到？"——应该看到 → 写 `docs/`；只跟我 / AI 有关 → 写 skill。

---

## 9. docs 状态约定

### 9.1 特性状态（`specs/index.md`）

| 状态 | 取值 | 含义 |
| --- | --- | --- |
| 待建 | ⬜ / 待建 | spec 未生成 |
| 进行中 | 🟡 / 进行中 | 五件套未全部完成或编码未完成 |
| 已完成 | ✅ / 已完成 | 五件套齐全 + 联调通过 + 已归档 done/ |
| 废弃 | ⛔ / 废弃 | 不再维护；特性目录保留 |

### 9.2 文档稳定度（隐含约定）

| 类型 | 稳定度 | 修改建议 |
| --- | --- | --- |
| `docs/specs/_template/` | 极高 | 极少改；改前必须评估对所有 spec 的影响 |
| `docs/design/data-models.md` / `api-contracts.md` / `architecture.md` | 高 | 修改需联动所有引用方 |
| `docs/skills/<栈>/coding.md` | 中 | 跟随版本升级调整 |
| `docs/specs/NNN-*/` | 中 | 跟随需求演进 |
| `docs/research/` | 低 | 调研结束可归档 |

### 9.3 task 状态（skill 内部，详见 [AGENTS.md §10.1](../../AGENTS.md)）

| 状态 | 含义 | 位置 |
| --- | --- | --- |
| ⚪ 进入 | 新建 task，未启动 | `plans/` |
| 🟡 进行中 | 已启动未完成 | `plans/` |
| ✅ 完成 | 已完成并移动到 done/ | `plans/done/` |

---

## 10. 实现期硬规则（通用部分）

> 完整 14 条见 [001 §3](../design/001-big-screen-dev-guide.md)。本节列**通用且跨特性适用**的子集（编号沿用 001 便于对照）。

| # | 规则 | 出处 | 适用层 |
| --- | --- | --- | --- |
| R1 | 运行时查询 SQL 不入 migration，放 `backend/app/repositories/sql/` 或 `backend/app/services/visual/sql/` | architecture §4.1 + kingbase/coding.md §5.5 | 后端 |
| R2 | Kingbase Oracle 兼容模式：DDL 目录 `kingbase_oracle/`，用 `VARCHAR2` / `NUMBER` / `COMMENT ON`；勿粘 MySQL `int(11)` / `AUTO_INCREMENT` | kingbase/coding.md §3.1 | 后端 / DB |
| R3 | 新入口须 patch Kingbase 版本探测：`patch_psycopg2_server_version_detection()` | kingbase/coding.md §2.2 | 后端 |
| R4 | 全限定 schema.table：手写 SQL 用 `dw_basic_lc.letter_screen_1` 等，不依赖 `search_path` | kingbase/coding.md §2.3 | 后端 |
| R6 | 菜单级鉴权：`require_menu_key("xxx")`；无权限 → 403 | system-overview §2.4 | 后端 + 前端 |
| R7 | 大屏 / 统计只读：仅消费统计表快照，不写明细库 | AGENTS §5.2 | 后端 |
| R9 | 包管理唯一 pnpm，禁用 npm/yarn；React 19 + AntD 6 + Vite 8 | react/coding.md §1 | 前端 |
| R10 | HTTP 客户端 axios 单例，统一 Bearer + 401/续约/登出拦截器 | react/coding.md §5 | 前端 |
| R11 | 加载 / 空态 / 错误态必须实现：401→`/login`，403→`/403`，5xx 走契约统一错误体 | AGENTS §5.4 + system-overview §2.3 | 前端 |
| R12 | 参数化查询 mandatory，禁止拼接用户输入；日志不输出密码 / 连接串 | kingbase/coding.md §6 | 后端 |
| R13 | docs 禁止引用 `.trae/` / `AGENTS.md` / `.local-*` | docs-no-private-refs 规则 | 文档 |
| R14 | L3 文档改动须走 roadmap §6 提案审批 | AGENTS §10 | 文档 |

---

## 11. 与 [001](../design/001-big-screen-dev-guide.md) 的关系

### 11.1 分工

| 维度 | 本文档（references/001） | design/001 |
| --- | --- | --- |
| 性质 | 通用、稳定 | 大屏特化、长期维护 |
| 主体 | docs/ 本身 | 大屏项目（038 等） |
| 覆盖 | 全部 specs/ skills/ workflows/ standards/ 子目录 | 仅大屏相关 docs 与硬规则 |
| 受众 | 任何涉及 docs/ 的 Agent / 任务 | 大屏开发 Agent |

### 11.2 复用关系

| 本文档章节 | 复用自 001 | 增量 |
| --- | --- | --- |
| §4 门禁 | 001 §0 | 加 docs/ 内严格度差异 |
| §5 维护流程 | 001 §4（12 步） | 简化为通用 6 步 + 演进动作 |
| §10 硬规则 | 001 §3 R1-R14 | 提取通用子集，剔除大屏特化 |

### 11.3 不重复

- 001 §1 docs 现状盘点：定期刷新（本文件不复制）
- 001 §2 五件套 + pm-input 映射：见 [001 §2](../design/001-big-screen-dev-guide.md)（本文档 §3 名词速查表给定义，不重复映射）
- 001 §5 docs 内部矛盾跟踪：动态维护在 001

---

## 12. 变更记录

| 日期 | 变更 | 来源 |
| --- | --- | --- |
| 2026-08-12 | 初版：盘点 skill + docs 全量扫描后沉淀通用维护使用指南 | task 同步归档 `2026-08-11-docs-通读盘点.md` 后建立 references/ |
