# Bootstrap 检查清单

> 第一次给项目装上文档驱动 AI Coding 骨架（或整改存量项目）时，按此清单走。

## 第一步 · 摸底

- [ ] 读 `README.md` —— 项目是什么
- [ ] 看根目录文件 —— 单仓 / monorepo / 文档驱动
- [ ] 找包管理器：`package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` …
- [ ] 看 CI / 脚本：`.github/workflows/` / `Makefile` / `scripts/`
- [ ] 翻 git log 近 30 条 —— 项目活跃度、命名风格
- [ ] 看是否已有 `AGENTS.md` / `CONTEXT.md` / `docs/adr/` 等等价物 —— 有则**复用**，不重复造

> 跳过 `vendor/`、`node_modules/`、`dist/` 等无关目录。

## 第二步 · 跟用户对齐（必做，不要替用户决定）

- [ ] **文档布局**：用默认布局（`AGENTS.md` + `docs/` 全树），还是复用已有结构？
- [ ] **`AGENTS.md` 重点**：业务领域 / 团队约定 / 工具链 / 其他？
- [ ] **主路径倾向**：
  - 新项目为主（从零写规格，走 PM 输入 → 五件套）
  - 历史项目为主（改老代码，走 as-is → to-be）
  - 两者都要（默认推荐）
- [ ] **Agent 工作准则**：模板中的默认简版准则是否适用？需要增减哪些？
  - 落盘优先 / 防发散 / 基于原始代码 / 控制上下文 / 文档持续重构 / 深度对齐 / 测试先行 / 系统化调试 / 禁止臆造 / 文档同批
- [ ] **三条铁律是否可协商**：默认不可协商，但团队若需调整措辞，在此确认
- [ ] **是否需要历史变更模板**：历史项目场景必须；纯新项目可暂缓

## 第三步 · 写文件

### 3.1 根级

- [ ] 创建 `AGENTS.md`（由 `init.mjs` 从 `references/templates/AGENTS.md` 生成）
- [ ] 在 `AGENTS.md` 登记 bootstrap 决策

### 3.2 `docs/design/` — 全局真相

- [ ] `docs/design/README.md` — 设计区索引与技术边界
- [ ] `docs/design/tech-stack.md` — 技术栈、目录约定、工具链；新库/新栈在此登记
- [ ] `docs/design/architecture.md` — NFR、持久化、部署、外部系统关系
- [ ] `docs/design/system-overview.md` — Shell、IA、全局交互、路由/菜单原则
- [ ] `docs/design/api-contracts.md` — HTTP 契约（与 OpenAPI 一致）
- [ ] `docs/design/data-models.md` — 表 / 实体字段全局权威
- [ ] `docs/design/routes.md` — 路由与菜单登记
- [ ] `docs/design/glossary.md` — 术语表
- [ ] `docs/design/decisions/.gitkeep` — ADR 目录（按需建文件）

> 上述文件按需创建——没有对应内容时建空占位（写"待补"），不要凭空编造字段或契约。

### 3.3 `docs/specs/` — 特性级 SDD

- [ ] `docs/specs/index.md` — 特性编号登记表（新特性必须登记）
- [ ] `docs/specs/_template/` — 复制用的空模板，按 [spec-five-pieces.md](./spec-five-pieces.md) 放好：
  - `pm-inputs/pm-requirements-input.md`
  - `pm-inputs/pm-requirements-input-example.md` — ★ 示例文档，新成员填 PM 输入的参考
  - `pm-inputs/assets/.gitkeep`
  - `spec.md`
  - `acceptance-tests.md`
  - `data-model-extensions.md`
  - `plan.md`
  - `tasks.md`

### 3.4 `docs/research/`

- [ ] `docs/research/README.md` — 与 design 的边界说明

### 3.5 其他（按需）

- [ ] `docs/roadmap.md` — 项目级计划（迭代、排期、里程碑）
- [ ] `docs/skills/` — 编码 / 测试 / AI 提示词等工程习惯
- [ ] `docs/workflows/` — SDD / TDD 流程说明
- [ ] `docs/changelogs/` — 变更记录（非行为权威）

### 3.6 历史项目场景额外

- [ ] 在 `docs/specs/_template/` 或单独位置放好 [legacy-change-template.md](./legacy-change-template.md)

## 第四步 · 自检

- [ ] `AGENTS.md` 里所有链接都能点开、不指向不存在的文件
- [ ] `docs/specs/index.md` 存在且为空登记表
- [ ] `docs/specs/_template/` 五件套齐全（含 PM 输入示例）
- [ ] 空目录里有 `.gitkeep`（如果用了 git）
- [ ] 没有把"我自己也记不住"的细节写进 `AGENTS.md` —— 那属于 `docs/research/`
- [ ] 没有把"做了就回不去"的决策埋在 `AGENTS.md` —— 必须落 `docs/design/decisions/`
- [ ] `AGENTS.md` 控制在合理长度 —— 过长会挤占 agent 上下文空间，细节拆到 `docs/`
- [ ] 工作准则用速查表而非长文 —— agent 每次会话都要读这份文档
- [ ] `docs/design/` 下没有凭空编造的字段、API、表结构 —— 不确定就写"待补"

### 「算会用」自检（对照 cheatsheet §8.3）

- [ ] 能独立选择新项目或历史项目路径
- [ ] 动手前有可分享、已冻结的文档
- [ ] 提示词指向文档路径，不是只贴聊天
- [ ] 合并前对照过验收；契约变更已回写 design

## 常见陷阱

| 陷阱 | 症状 | 纠正 |
|------|------|------|
| `AGENTS.md` 写成 README 副本 | agent 不知道在哪两份文档之间怎么选 | README = 给**人**看的索引；`AGENTS.md` = 给 **agent** 看的索引 |
| 决策只写聊天记录 | 三个月后没人知道当时为什么选 X | 不可逆 / 反直觉的决策一律落 `docs/design/decisions/` |
| 特性不登记就开工 | `docs/specs/` 里散落无编号目录 | 新特性必须先在 `docs/specs/index.md` 登记 |
| design 凭空编造字段 | AI 按假契约实现，上线炸 | 不确定就写"待补"，禁止臆造 |
| research 当契约 | 五件套引用 research 里的隐性约定 | research 采纳后必须回写 design，五件套只引用 design |
| 文档无限膨胀挤占上下文 | agent 读取效率下降 | 定期重构：过大的文件拆分或归档，`AGENTS.md` 只放索引和概要 |
| 结论只停留在聊天里 | 换个会话就丢失 | 一切结论落 `docs/`，不靠对话记忆 |
| 套默认布局却没跟用户确认 | 项目已有 `CONTEXT.md`，又多出一份 `AGENTS.md` | 第二步对齐不可省；已有等价物一律**复用** |

## 「算在 AI Coding 吗」自检（与「会用本 skill」分开）

> 装上骨架 ≠ 在做 AI Coding。下面 5 项可观察指标，对照检查团队或个人——
> 大多数做不到 = 你只是在「用 AI 写代码」，还不算 AI Coding。
> 这一节是**思维底座**，对应 [培训材料 · 为什么做与思维转变 §1.3 重要指标](../fedx-agents/leader/ai-coding/ai-coding-training/mindset.md)（路径按本仓库实际位置调整）。

### 5 项指标（可观察、可勾选）

1. **动手前有可分享、已写清的文档**
   - 新项目：产品审定的 PM 输入（已反向提问补洞）+ 五件套
   - 历史项目：审过的「现状 → 目标态」（含影响面、非目标、验收）
2. **提示词挂文档路径**，不是只贴聊天记录
3. **有可勾选、可判定失败的验收**；合并前对照打勾
4. **契约 / 行为变了，文档与代码同批更新**
5. **文档不清或 AI 越界时停下来问**，而不是猜完继续大改

### 评分用法

| 做到项数 | 状态 |
| --- | --- |
| 5/5 | 在做 AI Coding；可帮团队带新人 |
| 3–4/5 | 在过渡期；按缺哪条补哪条 |
| 0–2/5 | 在「用 AI 辅助传统编程」；先回到 [三条铁律](./SKILL.md) 与本节第 1、2 条 |

> 不要把这一节当口号。这一节用来**打断「看着像就收」的幻觉**——AI 产出物表面完整，不等于按 AI Coding 纪律跑完。

## Bootstrap 完成 ≠ 任务完成

骨架装上之后才算**开始**。后续任何变更都应走对应主路径：

- **新项目主路径**：PM 输入 → 反向提问 → 五件套 → 实现 → 验收
- **历史项目 6 步**：查现状 → 写目标态 → 反向提问 → 列文档 → 改代码 → 验收同批

并通过 `AGENTS.md` 的索引让 agent 能找到上下文。
