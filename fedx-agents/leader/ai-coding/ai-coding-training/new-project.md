# 新项目开发流程

> 全员必须对齐的**主脊梁**。  
> 前置：[为什么做与思维转变](./mindset.md) · 下一步：[历史项目维护](./legacy-project.md)  
> 文件名以仓库为准：`pm-requirements-input.md`。

---

## 0. 深一层：这条链路在解决什么

上一篇已经讲过：瓶颈不在「AI 会不会写」，而在「人会不会问」。  
新项目流程的本质，是把「好问题」逼成**仓库里可执行、可验收、可追溯**的工件，再让 AI 按工件实现。

| 若跳过… | 典型后果 |
|----------|----------|
| 跳过技术确认 | 选错栈 / 碰错边界，五件套与代码一起返工 |
| 跳过 assets | 界面争议靠口头，AI 与研发各猜一套 |
| 跳过反向提问 | 需求「写完了」但仍充满未知；AI 用臆造填洞 |
| 跳过五件套审定 | 实现阶段边做边改口径，MR 无法对照验收 |
| 跳过 design 回写 | 契约只在某特性目录里，全局真相分裂 |

**硬门槛有两道：**

1. 没有产品审定的 `pm-requirements-input.md`（且经过**大模型反向提问**补洞），不开写五件套。  
2. 没有研发审定的五件套（及必要的 design / research 结论），不让 AI 大改业务代码。

---

## 1. 文档目录结构解析

先认清仓库文档树，再谈流程。下列以**产品仓常见 `docs/`** 为准（如 OpenClaw 企业后台）；框架 monorepo 见本节末。

### 1.1 总树

```text
仓库根/
├── AGENTS.md                 # Agent / AI 协作宪法（文档根、禁止项、权威顺序）
└── docs/
    ├── index.md              # 文档入口（若有）
    ├── design/               # ★ 全局设计单一事实来源（契约/模型/架构）
    ├── specs/                # ★ SDD 特性规格（含五件套与 pm-inputs）
    ├── research/             # 调研与 PoC（非正式基线；采纳须回写 design）
    ├── skills/               # 编码 / 测试 / AI 提示词等工程习惯
    ├── workflows/            # SDD / TDD 流程说明（若有）
    └── changelogs/           # 变更记录（若有；非行为权威）
```

### 1.2 `docs/design/` — 全局真相

| 路径（常见） | 解析 |
|--------------|------|
| `design/README.md` | 设计区索引与技术边界 |
| `tech-stack.md` | 技术栈、目录约定、工具链；新库/新栈在此登记 |
| `architecture.md` | NFR、持久化、部署、外部系统关系 |
| `system-overview.md` 或 `product-framework.md` | Shell、IA、全局交互、路由/菜单原则 |
| `api-contracts.md` 或 `api/*.md` | HTTP 契约拆分；与 OpenAPI 一致 |
| `data-models.md` | 表 / 实体字段全局权威 |
| `routes-*.md` 或 overview 中的路由节 | 路由与菜单登记 |
| `decisions/`（ADR） | 有争议或长远影响的决策记录 |
| `glossary.md` | 术语表 |
| 其他专项（如 `logging-platform-sdk.md`、`object-storage.md`） | 横切能力设计 |

**纪律：** 特性五件套**引用** design，不另造第二份全局契约。

### 1.3 `docs/specs/` — 特性级 SDD

```text
docs/specs/
├── index.md                          # 特性编号登记表（新特性必须登记）
├── _template/                        # 复制用的空模板
│   ├── pm-inputs/
│   │   ├── pm-requirements-input.md  # PM 需求输入模板
│   │   ├── pm-requirements-input-example.md
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

### 1.4 `docs/research/` — 调研备忘

```text
docs/research/
├── README.md           # 与 design 的边界说明
└── <主题>/ 或 topic.md # 方案对比、PoC、抓帧、第三方探查
```

非正式基线；**采纳为架构或 API 行为时必须回写** `design/` 或 ADR。

### 1.5 `docs/skills/` · `workflows/` · 根 `AGENTS.md`

| 路径 | 解析 |
|------|------|
| `docs/skills/` | 前后端编码习惯、测试分层、AI 提示词模版等 |
| `docs/workflows/` | SDD / TDD 流程（如何与五件套衔接） |
| 仓库根 `AGENTS.md` | AI 默认约束：读哪些文档、禁止臆造字段、框架/业务边界 |

### 1.6 谁写到哪（对照）

| 产出 | 落点 |
|------|------|
| 技术选型、架构取舍 | `design/tech-stack` · `architecture` · ADR |
| HTTP / 表结构全局定义 | `design/api*` · OpenAPI · `data-models` |
| 业务需求（产品语言） | `specs/.../pm-inputs/pm-requirements-input.md` |
| 特性行为与验收、计划任务 | `specs/.../` 五件套 |
| 未定论的探查 | `research/` → 采纳后回写 design |

### 1.7 框架 monorepo 差异（若用 next-admin 类模板）

```text
packages/framework-docs/     # 框架 design / specs(000–00x) / skills / workflows
apps/<product>/docs/         # 产品 design 扩展 + 业务 specs(003+)
```

原则相同：框架文档管 Shell/账号等；业务五件套在产品 `docs/specs/`。提示词里的路径按当前仓库改准。

---

## 2. 总览

```text
① 产品：收集需求、说明背景
        │
        ▼
② 技术经理：技术选型与确认（写入/更新 design 或 ADR）
        │
        ▼
③ 产品：pm-inputs/assets
        │
        ▼
④ 产品 + AI：起草 pm-requirements-input.md
        │
        ▼
④★ 大模型反向提问 → 补全未知细节 → 产品审定冻结
        │
        ▼
⑤ 研发 + AI：spec 五件套 + 同步 design（按需 research）
        │
        ▼
⑥ 研发 + AI：按五件套 SDD+TDD 实现 → 验收
```

| 阶段 | 主责 | 关键产出 | AI 角色 |
|------|------|----------|---------|
| ① 背景 | 产品 | 痛点、目标、范围 | 可整理纪要，产品确认 |
| ② 技术确认 | 技术经理 | 选型结论、边界、分期；必要时 `tech-stack` / ADR / architecture | 可调研对比，技术拍板 |
| ③ assets | 产品 | `pm-inputs/assets/` | 不替代贴图 |
| ④ PM 输入草稿 | 产品 + AI | `pm-requirements-input.md` 初稿 | 按模板生成 |
| ④★ 反向提问 | 产品 + AI | 开放问题关闭或显式挂起；定稿 PM 输入 | **必须反向追问未知** |
| ⑤ 五件套 + design | 研发 + AI | 五件套；API/数据/路由等 design 增量；按需 research | 起草；研发审定 |
| ⑥ 实现 | 研发 + AI | 代码、测试、文档同批 | 按文档实现；人审 MR |

---

## 3. 阶段 ① — 产品收集需求、说明背景

目标：把「为什么做、给谁用、做成什么样」说清到**可以开始写文档**，而不是说清到可以开始猜代码。

必须沉淀（可先纪要，但最终进仓库）：

- 给谁用、解决什么痛  
- 本期目标 vs 明确不做  
- 关键业务规则与角色直觉  
- 参考系统 / 竞品行为（若有）  

此阶段**不要求**产品写表名、HTTP、OpenAPI。未知处后面用反向提问逼出来。

---

## 4. 阶段 ② — 技术选型与确认（及 design 落点）

技术经理把「能不能做、用什么做、边界在哪」写成**可引用结论**，禁止只留在会议上。

### 4.1 要确认什么

- 能否复用现有框架 / 模块 / 平台能力  
- 是否引入新依赖、新服务、新存储、新外部系统  
- 与 Gateway / 第三方边界（若相关）  
- 风险、工期量级、是否分期  
- 对前端 / 后端 / 数据的约束（性能、安全、部署）  

极小、无争议增量可**书面豁免**完整选型，但豁免理由要留下。

### 4.2 结论写到哪里

选型与架构不是口头说明，而要落到仓库设计真相源。路径与职责见 **§1 文档目录结构解析**（`tech-stack` / `architecture` / API / `data-models` / ADR / 路由等）。

**原则：** 特性五件套**引用** design，不另造第二真相。破坏性变更必须先改 design / OpenAPI，再改代码。

---

## 5. 阶段 ③ — `pm-inputs/assets`

```text
docs/specs/<编号-短名>/pm-inputs/
  assets/                      ← 原型、切图、流程图、PDF…
  pm-requirements-input.md
```

- 有界面 / 交互争议时强烈建议入库  
- 文件名英文短横线；在 PM 输入里用相对路径引用  
- 不强制每个特性都有；有则 AI 与评审必须看得到同一套图  

---

## 6. 阶段 ④ — 起草 `pm-requirements-input.md`

按仓库 `_template/pm-inputs/pm-requirements-input.md` 用业务语言填写（可 AI 起草）。

| 块 | 写什么 | 深度要求 |
|----|--------|----------|
| A 功能名片 | 名称、一句话价值、入口、优先级、依赖 | 价值要可验证，不是口号 |
| B 背景与范围 | 痛点、本期目标、明确不做 | 「不做」写不全 = 反向提问重点 |
| C 用户与权限 | 业务角色与可见能力 | 隐藏 / 禁用 / 跟全站规范，要选定 |
| D 用户旅程 | 看到什么、点到什么（5–10 步） | 关键分支单独写 |
| E 界面清单 | 按钮、表、弹窗/抽屉 | 与 assets 对得上 |
| F 数据与规则 | 业务词；已知表字段可附 | 未知标「待确认」，禁止瞎编 |
| G 验收标准 | S1… 可观察；可选 Gherkin | 每条都能失败/通过 |
| H 非功能 | 量级、体验、审计等 | 没有就写「无额外要求」 |
| I 开放问题 | 未决清单 | **反向提问的主战场** |
| J 参考资料 | Figma、兄弟 spec、外链 | |
| K assets | 附件路径 | |

禁止：未审定草稿当冻结需求；编造已在 design 里的字段定义。

---

## 7. 阶段 ④★ — 大模型反向提问（关键关卡）

写完 PM 输入初稿后，**不要立刻进五件套**。必须让大模型扮演「刁钻评审」，对文档做反向提问，把未知细节逼到显式状态。

### 7.1 为什么必须做

- 人写需求时容易「自己以为写清了」；AI 实现时会在空白处**自信地填错**  
- 反向提问把「不会问」变成可训练动作：问题清单 = 开放问题 = 下一轮要拍板的决策  
- 与思维篇一致：核心能力是提问；这里是流程化的提问  

### 7.2 怎么做

1. 把完整 `pm-requirements-input.md`（及 assets 路径说明）交给模型。  
2. 要求：只提问与列未知，**先不写五件套、不写代码**。  
3. 产品 / 技术对每一问给出：已决结论 / 待确认主责 / 本期不做。  
4. 回写进 PM 输入（B/F/G/I 等），直到「阻塞实现的未知」清零或显式挂起。  
5. **产品审定冻结**后，才进入五件套。  

### 7.3 推荐提示词（可复制）

```text
你是苛刻的产品+研发双审。请只基于我粘贴的《产品经理需求输入》全文（及所述 assets），
列出反向问题，按优先级排序。要求：
1) 覆盖：范围边界、角色权限、主旅程分支、空态/错态、数据口径、验收可测性、非功能、与外部系统边界；
2) 每个问题说明：若不问清楚，实现阶段最可能出现什么错误臆造；
3) 区分：必须本期拍板 / 可挂起为开放问题；
4) 禁止直接写 spec 五件套或代码；禁止编造业务事实——未知就提问。
输出：问题清单 + 建议回写到文档的哪一节。
```

### 7.4 通过标准

- [ ] 至少完成一轮有记录的反向提问（问题与答复可追溯）  
- [ ] 阻塞实现的未知已关闭，或写入「开放问题」并指定主责与截止点  
- [ ] 产品确认：可以据本文档生成五件套  

---

## 8. research 文档：调研与备忘（按需，但边界要清）

路径常见：`docs/research/`。

**用途：** 与项目相关、但**尚未**进入 design/specs 正式基线的调研——备选方案对比、PoC、抓帧、第三方文档摘录、竞品/协议探查等。

| 可以放 research | 不要放 research |
|-----------------|-----------------|
| 多方案对比、实验结论、风险记录 | 已采纳的架构结论（应回写 design / ADR） |
| Gateway / 第三方行为探查笔记 | 密钥、未脱敏生产数据 |
| 给写五件套用的参考材料 | 让 spec **直接依赖**外部仓库实现细节当契约 |

**纪律：** 调研结论一旦采纳为架构或 API 行为，必须回写 `docs/design/` 或 ADR；五件套只引用 design，不引用「只有 research 里写过」的隐性契约。

何时做：阶段 ② 前后、或 ⑤ 发现未知技术点时；**不替代** PM 输入与五件套。

---

## 9. 阶段 ⑤ — spec 五件套（明细）+ design 同步

**输入：** 已冻结的 PM 输入 + assets + 技术确认 + 既有 design +（若有）已回写的 research 结论。

### 9.1 五件套分别是什么、里面有什么

| 文件 | 职责 | 内部应有的明细（对齐 `_template`） |
|------|------|-------------------------------------|
| `spec.md` | 特性规格：行为与边界的主叙述 | 背景与目标；角色与权限；**接口契约索引**（指向 design/OpenAPI，不复制全局字段）；界面与交互；数据与领域概述；边界/错误处理表；非功能摘录；依赖与拆分；开放问题 |
| `acceptance-tests.md` | 可对照验收 | Gherkin Feature/Scenario（Given/When/Then）；补充 checklist；场景与自动化类型映射表 |
| `data-model-extensions.md` | 本特性数据增量草稿 | 涉及实体/表及与 design 关系；字段增量表；合并回 `data-models.md` 的约定；规则与约束 |
| `plan.md` | 实现计划 | 目标与范围；前置条件（契约/模型/架构是否已齐）；里程碑切片 M1…；风险与缓解；评审检查点 |
| `tasks.md` | 可勾选任务 | 后端 / 前端 / 测试 / 文档 / DevOps 分组清单；与 plan 切片可追溯 |

**权威顺序（冲突时）：**  
本特性 `spec.md` + `acceptance-tests.md` → `docs/design/*` + OpenAPI → 系统级约定（Shell/鉴权等）→ 编码 skills。

### 9.2 五件套与 design 怎么分工

```text
pm-requirements-input（业务语言，产品冻结）
        │
        ▼
spec 五件套（特性级：行为、验收、增量、计划、任务）
        │
        ├── 引用并推动更新 → docs/design/*（全局真相）
        │
        └── 需要探查时 → docs/research/* → 采纳后回写 design
```

- **新 API / 字段 / 错误码**：先设计进 `api-contracts` / `api/*` + OpenAPI，再在 `spec` 里索引。  
- **新表 / 字段**：`data-model-extensions` 起草 → 定稿后合并进 `data-models.md`。  
- **新路由 / 菜单**：登记 routes / system-overview（或产品 routes-business）。  
- **跨特性争议决策**：写 ADR，不塞进某个 tasks 复选框里了事。  

### 9.3 推荐提示词（生成五件套）

```text
请根据 docs/specs/<编号-短名>/pm-inputs/pm-requirements-input.md（及 assets），
按仓库 docs/specs/_template 生成同目录五件套：
spec.md、plan.md、tasks.md、data-model-extensions.md、acceptance-tests.md。
全局权威引用 docs/design/（及 OpenAPI）；不要编造已存在于 design 的字段定义；
未知处写入「开放问题」与 plan 前置条件。
若需新增/变更 API 或表结构，列出必须同步修改的 design 文件清单，先说明再写入草稿。
```

生成后建议再跑**半轮反向提问**（针对五件套与 PM 输入不一致、验收不可测、契约缺口），再研发审定。

### 9.4 研发审定关卡

- [ ] 与冻结的 PM 输入一致，非目标未被加戏  
- [ ] acceptance-tests 每条可观察、可失败  
- [ ] 开放问题有主责或已关闭  
- [ ] 需改的 design / OpenAPI / 路由已列入 plan 或已改  
- [ ] 特性已在 specs 索引登记  
- [ ] research 若有采纳项，已回写 design，而非只躺在 research  

---

## 10. 阶段 ⑥ — 按五件套实现（SDD + TDD）

```text
冻结接口草稿（可 mock）
  → 从 acceptance-tests 写失败用例（红）
  → 最小实现（绿）
  → 重构（保持绿）
  → 对照验收勾选
  → MR：代码与文档同批（或紧跟随，团队统一）
```

TDD 优先：契约边界、回归、公共逻辑——不是每一行都先写测。  
提示词必须指向五件套路径与非目标；见 [提示词与自检](./cheatsheet.md)。

---

## 11. AI Coding 工具与技能（要会用，不是装了就算）

工具解决「怎么按规定执行」；文档解决「执行什么」。没有文档，工具只会加速做错。

### 11.1 必提：Superpowers（流程技能）

仓库 / Cursor 中的 **Superpowers** 技能族，用来把 AI 会话按纪律跑完，而不是闲聊式改代码。与新项目强相关的包括：

| 技能 | 用在新项目的何时 |
|------|------------------|
| `using-superpowers` | 任何任务前：先发现并加载该用的技能 |
| `brainstorming` | 阶段 ①–②：澄清意图、方案权衡；未批准设计前不开战写码 |
| `writing-plans` | 五件套前后：把 plan/tasks 落成可执行步骤 |
| `test-driven-development` | 阶段 ⑥：红 → 绿 → 重构 |
| `executing-plans` / `subagent-driven-development` | 按计划推进、可拆分的并行任务 |
| `systematic-debugging` | 实现期缺陷：先取证再改 |
| `verification-before-completion` | 宣称完成前：跑验证、给证据 |
| `requesting-code-review` / `receiving-code-review` | MR 前后审查节奏 |
| `using-git-worktrees` | 需要隔离实验分支时 |

原则：**可能适用就先加载技能**；用户指令优先于技能教条。

### 11.2 必提：Frontend Design（前端设计技能）

当任务涉及**新页面、营销/落地、显著 UI 改版**时，启用 **frontend-design**（或团队等价技能 / 设计规范）：

- 避免千篇一律的「AI 味」布局与配色套路  
- 在**已有设计系统 / 管理后台 Shell**内工作时：以产品与 `docs/design` 的 Shell/主题约定为准，技能服从现有体系  
- 与 PM assets、spec「界面与交互」对齐，不凭空发挥  

偏前端 + UI 的团队更要把「会问交互问题」和 frontend-design 纪律绑在一起。

### 11.3 反模式

- 不加载 Superpowers / TDD，直接「帮我写完」  
- 无 PM 输入与反向提问，就上 frontend-design「做漂亮」  
- research 当契约、design 不更新  
- 工具很全，文档很空——那是高速返工  

---

## 12. 角色一览

| 角色 | 负责 | 默认不负责 |
|------|------|------------|
| 产品 | 背景、assets、PM 输入、**答复反向提问**、验收口径 | HTTP / 表结构最终定稿 |
| 技术经理 | 选型、design/ADR 落点、技术开放问题 | 代替产品写业务验收 |
| 研发 | 五件套、design 增量、TDD、MR | 无冻结 PM 输入开大需求 |
| AI | 起草、反向提问、实现与测试 | 当需求真相源、擅自扩 scope |

---

## 13. 开工前检查清单

- [ ] 背景与范围已说清  
- [ ] 技术确认完成（或书面豁免）；选型结论已落到 design/ADR（若需要）  
- [ ] assets 已按需入库  
- [ ] `pm-requirements-input.md` 已起草  
- [ ] **已完成大模型反向提问并回写**；产品冻结 PM 输入  
- [ ] 五件套已生成并经研发审定  
- [ ] 必要的 design / OpenAPI / 路由已同步或列入 plan  
- [ ] research 采纳项已回写 design（若有）  
- [ ] 实现将使用 Superpowers（含 TDD）等技能；UI 任务考虑 frontend-design  
- [ ] 实现提示词指向五件套与非目标  

---

日常正式项目必须走完含 **④★ 反向提问** 的完整链路，不要只做实现段。

**下一步：** [历史项目维护](./legacy-project.md)。
