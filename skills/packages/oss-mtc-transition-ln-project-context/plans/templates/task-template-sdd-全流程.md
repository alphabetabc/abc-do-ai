# Task · {编号}-{slug} SDD 全流程

> 状态：⚪ 待启动
> 关联：`plans/roadmap-2026-08-11-big-screen.md` §3
> 类型：规格驱动开发（SDD）
> 创建：{日期}
> 前置：{依赖的决策 / task 编号}

---

## 0. 特性信息

| 项         | 值                                                            |
| ---------- | ------------------------------------------------------------- |
| 编号-slug  | {编号}-{slug}                                                 |
| spec 目录  | `docs/specs/{编号}-{slug}/`                                   |
| pm-input   | `docs/specs/{编号}-{slug}/pm-inputs/pm-requirements-input.md` |
| assets     | `docs/specs/{编号}-{slug}/pm-inputs/assets/`                  |
| 关联 spec  | {无 / 003-xxx 等}                                             |
| 智能体会话 | {会话标识或备注，一 spec 一会话}                              |

---

## 1. 阶段一：assets → pm-input

### 1.1 前置

- [ ] assets 已就位（txt + 截图放入 `pm-inputs/assets/`）

### 1.2 执行（推荐两阶段）

- [ ] **阶段 1**：研读 assets，输出分析（清单 / 摘录 / txt vs 截图核对 / 缺口 / 冲突问题）
- [ ] **人工闸门**：产品经理答复阶段 1 问题
- [ ] **阶段 2**：生成 `pm-requirements-input.md`（A–K 全章节）

### 1.3 闸门 1：pm-input §I 开放问题

- [ ] §I 所有条目已关闭（写「结论：…」或回填正文）
- [ ] 产品经理审阅定稿

---

## 2. 阶段二：pm-input → 五件套

### 2.1 前置

- [ ] 阶段一闸门已关闭
- [ ] 已通读 design 四件套（data-models / api-contracts / system-overview / architecture）
- [ ] 已选定参考的姊妹 spec（如 004 / 006 / 007）

### 2.2 执行（分步模式，大模块推荐）

- [ ] **第 1 轮**：生成 `spec.md` + `data-model-extensions.md`
- [ ] **第 1.5 轮（人工闸门）**：评审 spec §9 开放问题 + extensions §3 待合并项
    - [ ] 产品确认业务规则 / 边界 / 验收口径
    - [ ] 研发确认表 / API 是否在 design 登记
    - [ ] 未关闭项不得进入第 2 轮（阻塞的标 plan 前置 + 负责人）
- [ ] **第 2 轮**：生成 `acceptance-tests.md`（仅基于已确认的 spec §9）
- [ ] **第 3 轮**：生成 `plan.md` + `tasks.md`（里程碑可追溯到 pm-input 功能章节）

### 2.3 闸门 2：spec §9 + extensions §3

- [ ] spec §9 开放问题全部关闭
- [ ] `data-model-extensions.md` §3 待合并项已确认去向（合并 design 或标阻塞）
- [ ] 若有外部依赖不满足：spec §8.2 上游回填清单已列出

---

## 3. 阶段三：按 spec 开发

### 3.1 前置

- [ ] 阶段二闸门已关闭
- [ ] design 契约已冻结（若端点新增：`api-contracts.md` §7 增补 + OpenAPI 已写）
- [ ] 已读 `docs/skills/` 对应栈的 coding.md

### 3.2 执行（按 plan 里程碑切片）

- [ ] M?：{里程碑名} —— {范围说明}
- [ ] M?：{里程碑名} —— {范围说明}
- [ ] ...

### 3.3 验收

- [ ] `acceptance-tests.md` 中 P0 场景已实现自动化测试
- [ ] `tasks.md` 全部勾选
- [ ] 若改了 API / 持久化：`docs/design/` + `docs/specs/` 同步清单已列出

---

## 4. Prompt（复制即用）

> 来源：`docs/ai-prompts-guide.md`
> 用法：复制对应阶段的 prompt，替换 `{编号}-{slug}` 与 `{assets 文件名}` 后粘贴到智能体。
> 模式：**必须用 Agent 模式**（Ask 模式不能写文件）；一 spec 一会话。

### 4.1 阶段一：assets → pm-input

> 对应 `docs/ai-prompts-guide.md` §1.3

#### 4.1.1 阶段 1 — 研读 assets（只输出分析，不写 pm-input 正文）

```text
【任务】从 assets 生成《产品经理需求输入》的前期分析，供产品经理审阅对齐。

【必读】
- @docs/specs/_template/pm-inputs/pm-requirements-input.md（章节 A–K）
- @docs/specs/_template/pm-inputs/pm-requirements-input-example.md（粒度与表述）
- @docs/specs/{编号}-{slug}/pm-inputs/assets/ 下全部文件
- @docs/design/data-models.md、api-contracts.md、system-overview.md、architecture.md

【权威引用】
通读 design 四件套与 pm-input 模板；技术事实以 design 为准（字段、API、路由/菜单等）。
未知记入阶段 1 问题清单，阶段 2 写入 pm-input §I「开放问题」。

【阶段 1 输出要求】
1. 列出 assets 清单及每个文件作用。
2. 从 *.txt 逐条摘录要点，保留原文中文名称（菜单、按钮、列名、比对类型等）。
3. 逐张核对截图与 txt：一致项 / 仅 txt / 仅截图 / 冲突项（表格列出）。
4. 列出 assets 未覆盖但 pm-input 必填的缺口（入口、角色权限、默认值、与其它功能边界等）。
5. 每条冲突或缺口写成可向产品经理提出的具体问题。

【本阶段禁止】
- 不要写入 pm-requirements-input.md
- 不要生成五件套
- 不要擅自统一 txt 与截图的叫法

阶段 1 结束后等我（产品经理）回复；我确认后再执行阶段 2。
```

#### 4.1.2 阶段 2 — 生成 pm-requirements-input.md（收到产品答复后）

```text
【任务】生成 @docs/specs/{编号}-{slug}/pm-inputs/pm-requirements-input.md，供产品经理审阅。

【必读】同阶段 1；并纳入以下产品拍板结论：
（粘贴阶段 1 问题的产品答复）

【输出】
- 按 _template 填写 A–K 全章节（无可填项的模板子表可删，如无筛选则删 E.1 筛选条件表）。
- 粒度对齐 pm-requirements-input-example.md；参考 @docs/specs/019-comparison-statistics-query/pm-inputs/pm-requirements-input.md。
- 已拍板项写入正文或 §I「结论：…」；仍待定项只留在 §I。
- §J、§K 链接 assets/ 下全部文件。

【硬性约束】
1. 名称与含义与 assets 原文一致，不得因「更好懂」而改名。
2. 通读 design 四件套与 pm-input 模板；技术事实以 design 为准（字段、API、路由/菜单等）。
   未知写 §I「开放问题」（生成五件套时迁入 plan 前置）。
3. 不要生成 spec/plan/tasks/data-model-extensions/acceptance-tests。

【完成后附 5–8 条 PM 核对清单】：assets 覆盖情况、§I 待确认项、txt 与截图差异摘要。
```

#### 4.1.3 阶段 1 答复后的续写（仅更新 pm-input）

```text
针对 @docs/specs/{编号}-{slug}/，产品结论如下：

（粘贴答复）

请更新 pm-requirements-input.md：已确认项写入正文或 §I「结论：…」；
仍待定项保留在 §I；业务中文名称仍与 assets 原文一致。
通读 design 四件套与 pm-input 模板；技术事实以 design 为准，不臆造。
```

#### 4.1.4 一次出稿（产品已口头拍板时的备选）

> 对应 §1.3.2；当产品已口头确认全部冲突 / 缺口时可一次出稿，跳过两阶段。

```text
请基于 @docs/specs/{编号}-{slug}/pm-inputs/assets/ 全部内容，
按 @docs/specs/_template/pm-inputs/pm-requirements-input.md 结构
生成 @docs/specs/{编号}-{slug}/pm-inputs/pm-requirements-input.md。

约束：
1. 深度参考 assets；txt 与截图冲突写入 §I，并在文首说明待产品确认；禁止私自统一叫法。
2. 菜单、按钮、列名、比对类型等与 assets 原文一致。
3. 通读 design 四件套与 pm-input 模板；技术事实以 design 为准（字段、API、路由/菜单等）。
   未知写 §I「开放问题」（生成五件套时迁入 plan 前置）。
4. 缺信息写入 §I 或先列出问题，不要猜测。
5. 非研发表述；粒度参考 pm-requirements-input-example.md。
6. §J、§K 链接全部 assets；只输出 pm-input，不生成五件套。

完成后简要说明：assets 覆盖情况、§I 待确认项、txt 与截图差异。
```

可在提示词末尾追加冲突优先级，例如：`txt 为主、截图为辅；冲突记入 §I。`

---

### 4.2 阶段二：pm-input → 五件套

> 对应 `docs/ai-prompts-guide.md` §2.1（通用）/ §2.2（分步）

#### 4.2.1 通用提示词（复制即用）

```text
请以 @docs/specs/{编号}-{slug}/pm-inputs/pm-requirements-input.md
为**唯一需求主输入**，在同目录
@docs/specs/{编号}-{slug}/ 下生成与
@docs/specs/_template/ 对齐的五件套：

- spec.md
- plan.md
- tasks.md
- data-model-extensions.md
- acceptance-tests.md

约束：
1. 五件套的业务范围、交互、验收标准**均从 pm-requirements-input.md 推导**；
   按 _template 各文件的章节约定拆分，不要另起一套需求表述。
2. pm-input 中「需求来源」指向的 assets/ 文件（如 assets/{assets 文件名}）
   仅作**原生需求核对引用**：在 spec.md 附录保留相对路径链接；
   若 assets 与 pm-input 表述不一致，**以 pm-input 为准**，差异写入 spec §开放问题。
3. 通读 design 四件套与 pm-input 模板；技术事实以 design 为准（字段、API、路由/菜单等）。
   未知写 spec §开放问题与 plan 前置，不臆造。
4. 风格与结构对齐已完成姊妹 spec（如 @docs/specs/006-organization-type-management/
   或 @docs/specs/004-division-type-management/）。
5. data-model-extensions.md 若登记**新表、新字段或跨特性共享模型变更**：
   - 在 §1/§2 写增量草稿，并在 §3「合并回 design 的约定」列出待合并项；
   - 不得仅在 extensions 中永久定义权威模型——定稿须合并至 docs/design/data-models.md
     （流程见 workflows/sdd-process.md §2 第 3 步；实现 MR 见各 spec tasks.md 与
     skills/database/kingbase/coding.md）；
   - 若 design 尚无对应章节，写入 spec §9 开放问题与 plan 前置，不要静默假定已入库。
   仅引用已有表时，extensions 以 API 字段对照为主，§3 勾选「已在 data-models §x.x」即可。
6. spec.md 顶部注明：产品输入 pm-inputs/pm-requirements-input.md、路由、依赖 spec。
7. **外部依赖接口**（pm-input「依赖/前置」及 UI 引用模块）：
   - 先在 spec §3 列出：上游 spec、现有 Path、本特性用途、是否满足。
   - **满足**：写「复用」并引用 Path / operationId。
   - **不满足**（例：需全量组织树，上游仅有分页列表）：在本 spec §8.2 写「上游回填清单」
     （上游目录 | 目标文件 | 章节 | 待补内容）；plan 前置与 tasks「上游同步」引用该清单；
     **不在本特性另立新端点**，实现仍归上游模块。同一会话可选 @上游目录 回填其 spec/plan/tasks。
8. 生成后更新 @docs/specs/index.md（若该编号尚未登记）。
9. 生成完成后，简要说明：pm-input 各章节 → 五件套的对应关系；assets 差异；§8.2 清单（若有）。

请先通读 pm-requirements-input.md、pm-requirements-input-example.md、design 四件套及 pm-input 所列上游 spec §3，再生成文件。
```

#### 4.2.2 分步生成（大模块推荐）

**第 1 轮 — 生成 spec + 数据扩展**

```text
仅基于 @docs/specs/{编号}-{slug}/pm-inputs/pm-requirements-input.md
生成 spec.md 与 data-model-extensions.md。
assets/ 仅在 spec 附录保留引用路径；正文需求一律来自 pm-input。
未知 API/字段/路由/业务规则写入 spec §9 开放问题，不臆造。
```

**第 1.5 轮 — 人工澄清（产品 + 研发，阻塞后续轮次）**

- 评审 `spec.md` §9 开放问题及 `data-model-extensions.md` §3 待合并项。
- **产品**：确认业务规则、边界、验收口径；必要时回填 pm-input，或直接在 spec §9 写「状态/结论」。
- **研发**：确认表/API 是否已在 design 登记；新增模型是否可合并 `data-models.md`、是否需单独 MR。
- **未关闭的开放问题**不得进入第 2 轮；若暂无法关闭，在 plan 前置标阻塞并注明负责人。

可选提示词（澄清后刷新 spec）：

```text
根据以下结论更新 @docs/specs/{编号}-{slug}/spec.md §9 与相关章节，
并将已确认项从「待确认」改为「已确认」；仍待定项保留并注明阻塞方：

（粘贴产品/研发答复）
```

**第 2 轮 — 验收测试（依赖已澄清的 spec）**

```text
基于**已更新**的 @docs/specs/{编号}-{slug}/spec.md，
补充 acceptance-tests.md（场景来自 pm-input 验收/边界及 spec §9 已确认结论）。
勿为 §9 仍为「待确认」的项编写确定性 Then 步骤。
```

**第 3 轮 — 计划与任务**

```text
基于 spec.md + acceptance-tests.md，
生成 @docs/specs/{编号}-{slug}/plan.md 与 tasks.md。
里程碑与任务须可追溯到 pm-input 的功能章节；
plan 前置须覆盖 data-model-extensions.md §3 待合并 design 项。
```

#### 4.2.3 与已有 spec 重叠时的补充句

> 若 pm-input 注明关联已有 spec（如 008 关联 003），在通用提示词（§4.2.1）末尾追加：

```text
补充：pm-input 已注明关联 @docs/specs/003-organ-structure-management/spec.md。
生成策略：以 pm-input 为主输入编写本目录五件套；
已有 spec 中相关章节仅作**已有实现/契约对照**，避免与 design 冲突；
已有 spec 与 pm-input 不一致处写入本 spec §开放问题，不要静默覆盖。
assets/ 仅在 spec 附录引用，不参与章节拆分。
```

---

### 4.3 阶段三：按 spec 开发

> 对应 `docs/ai-prompts-guide.md` §3
> 权威阅读顺序：先 `docs/design/`，再 `docs/specs/<特性>/` 五件套，最后 `docs/skills/` 所选栈。

#### 4.3.1 整特性开发（按 plan 切片）

```text
请严格依据以下文档实现 @docs/specs/{编号}-{slug}/：

必读：
- spec.md、plan.md、tasks.md、acceptance-tests.md、data-model-extensions.md
- docs/design/api-contracts.md、data-models.md
- docs/skills/backend/python/coding.md（按实际栈替换）
- docs/skills/frontend/react/coding.md
- docs/workflows/tdd-process.md

执行方式：
1. 按 plan.md 的里程碑顺序实现；每完成一个切片，在 tasks.md 勾选对应项。
2. 契约变更须先更新 design/api-contracts 与 OpenAPI，再写代码。
3. 不要引入 spec/契约中未定义的响应字段。
4. 实现 acceptance-tests.md 中 P0 场景；先写失败测试再实现（TDD）。
5. 完成后列出：改动文件、未完成的 tasks、开放问题。

本期只做 plan.md M1（后端 API），不要动前端。
```

> 将最后一行中的 `M1` 与范围按 plan 实际切片替换。

#### 4.3.2 单任务 / 单 MR

```text
实现 @docs/specs/{编号}-{slug}/tasks.md 中
「后端 → …」这一条（或指定具体勾选项）。

约束：
- 行为以 spec.md 对应章节和 api-contracts 为准
- 错误码与 acceptance-tests.md 相关场景一致
- 遵循 docs/skills/common/git-workflow.md
- 附带对应单元测试

完成后说明如何本地验证。
```

#### 4.3.3 只补测试

```text
请根据 @docs/specs/{编号}-{slug}/acceptance-tests.md
中的 Gherkin，在现有测试框架下补充自动化测试；
遵循 docs/workflows/tdd-process.md 的分层约定。
优先覆盖 spec 中标注为 P0 的场景。
```

#### 4.3.4 契约先行（SDD 推荐）

> 端点尚未写入 design 时，先冻结契约再写代码：

```text
{编号}-{slug} 的后端 CRUD 端点尚未写入 design。
请根据 spec.md §3 起草 api-contracts §7 增补与 OpenAPI 片段，
列出 Request/Response、错误码、分页约定；
不要写实现代码，等我确认后再开发。
```

#### 4.3.5 MR 文档同步

```text
若本次 MR 改变了对外 API 或持久化，
列出需要同步更新的 docs/design/ 与 docs/specs/ 文件清单。
```

---

## 5. 状态记录

| 日期   | 变更   |
| ------ | ------ |
| {日期} | {内容} |
