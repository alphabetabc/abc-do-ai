# Plan-002：docs 基础设施层落地计划（AGENTS.md + docs/ 顶层骨架）

> **日期**：2026-07-29
> **性质**：执行计划（基于 plan-001 的研究结论落地 docs 顶层结构）
> **前置计划**：[`2026-07-29-001-plan-next-research-step.md`](./2026-07-29-001-plan-next-research-step.md)（已规划 Stage A–F）
> **前置 finding**：`.trae/skills/oss-vis-gd-project-context/plans/done/research/2026-07-29-001-docs-template-structure-findings.md`（第一轮）
> **下游计划**：[`2026-07-29-003-plan-modules-specs.md`](./2026-07-29-003-plan-modules-specs.md)（业务模块层）
> **路线图**：`.trae/skills/oss-vis-gd-project-context/plans/done/roadmap.md`

---

## 1. 为什么需要这个计划

plan-001 已经规划了 5 个 Stage 的深度研究。本计划是 **Stage A–E 研究产出** 的下游执行：把研究结论转化为项目根 `/AGENTS.md` 与 `/docs/` 顶层结构（不含业务模块 spec）。

**关键原则**：

- **基础设施层**（本计划）相对独立，可在 PM 不介入的情况下完成
- **业务模块层**（plan-003）依赖 PM 输入，需与 PM 协同
- 两者按依赖关系分阶段推进：**先基础设施 → 后业务模块**

---

## 2. 目标（IN）

| #   | 目标                                                              | 输出位置                        |
| --- | ----------------------------------------------------------------- | ------------------------------- |
| G-1  | 落 `/AGENTS.md`（替换占位符后的本项目版）                          | 项目根 `/AGENTS.md`             |
| G-2  | 落 `/docs/index.md`（文档总站）                                    | `/docs/index.md`                |
| G-3  | 落 `/docs/design/tech-stack.md`（重写）                            | `/docs/design/tech-stack.md`    |
| G-4  | 落 `/docs/design/system-overview.md`（重写）                       | `/docs/design/system-overview.md` |
| G-5  | 落 `/docs/design/architecture.md`（重写）                          | `/docs/design/architecture.md`  |
| G-6  | 落 `/docs/design/data-models.md` / `api-contracts.md` / `glossary.md`（占位 + 待整合） | `/docs/design/`                 |
| G-7  | 决定并落 `/docs/design/framework-communication.md`（按 O-1 决策）  | `/docs/design/`                 |
| G-8  | 落 `/docs/design/decisions/`（ADR 模板）                           | `/docs/design/decisions/`       |
| G-9  | 落 `/docs/workflows/`（4 篇流程文档）                              | `/docs/workflows/`              |
| G-10 | 落 `/docs/standards/`（2 篇规范文档）                              | `/docs/standards/`              |
| G-11 | 落 `/docs/skills/`（README + common + frontend 占位 + ai-tools）  | `/docs/skills/`                 |
| G-12 | 落 `/docs/research/README.md`                                     | `/docs/research/`               |
| G-13 | 落 `/docs/specs/{index.md, spec-split-guide.md, _template/}`       | `/docs/specs/`                  |
| G-14 | 落 `/docs/ai-prompts-guide.md`                                    | `/docs/`                        |
| G-15 | 同步更新 `roadmap.md` 操作日志与决策表                            | `/trae/documents/roadmap.md`    |

---

## 3. 不做（OUT）

- ❌ 不写任何 `docs/specs/<module>/*.md`（业务模块 spec 留给 plan-003）
- ❌ 不写任何 `docs/design/data-models.md` 的实体内容（仅占位 + 标注「待 plan-003 整合」）
- ❌ 不写任何 `docs/design/api-contracts.md` 的接口内容（仅占位 + 标注「待 plan-003 整合」）
- ❌ 不动业务代码（`src/`、`public/static/`、`build/`、`package.json`、`*.config.*`）
- ❌ 不引入新依赖
- ❌ 不创建 `docs/research/<topic>/`（具体研究专题留给后续 plan）

---

## 4. 前置条件

| #   | 条件                                                                                | 来源                                                         | 状态        |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- |
| F-1  | plan-001 的 Stage A 已完成（AGENTS.md 内容设计结论）                                 | plan-001 §3.1                                                | ⏳ 待 Stage A |
| F-2  | plan-001 的 Stage B 已完成（docs/ 最小可行结构结论）                                 | plan-001 §3.2                                                | ⏳ 待 Stage B |
| F-3  | O-1（qiankun 微前端）已决策                                                         | 第一轮 finding §5.1                                          | ⏳ 待 PM    |
| F-4  | O-2（按钮级鉴权）已决策                                                             | 第一轮 finding §5.1                                          | ⏳ 待 PM    |
| F-5  | AGENTS.md 占位符替换清单确认                                                         | finding §3.5                                                 | ⏳ 待人工确认 |

> 缺失 F-3 / F-4 / F-5 时，按 finding 推荐值（独立部署 + 无按钮鉴权 + 推荐占位符）继续执行，标注「待 PM 确认」。

---

## 5. 执行步骤（按依赖顺序）

### 步骤 1：落 `/AGENTS.md`（G-1）

- **输入**：finding §3.5 占位符替换清单
- **来源**：拷贝 `.local-docs/docs模板-yzf/AGENTS.md`
- **动作**：替换占位符（项目定位、模块根路径、技术栈、依赖安装、公共组件库、API 请求、微前端、按钮鉴权）
- **输出**：`/AGENTS.md`
- **DoD**：所有 `{占位符}` 已替换；硬约束（不编造 API、不动业务代码）原样保留
- **本项目硬约束 D-11 / D-12 不写入 AGENTS.md**：根据 user 2026-07-29 反馈，硬约束已沉淀到 **`.trae/rules/docs-authoring-rules.md`**（Rule 1 / Rule 2 / Rule 3），作为 Trae rules 工作流约束，与 AGENTS.md 解耦
- **AGENTS.md 内容边界**（遵循 `.trae/rules/docs-authoring-rules.md` Rule 3）：仅含项目定位 / 模块根路径 / 技术栈 / 依赖安装 / 公共组件库 / API 请求约定；**不引用** `.trae/` 路径

### 步骤 2：建目录骨架（G-2 / G-6 / G-8–G-13）

- **动作**：
  ```
  mkdir -p /docs/{design/decisions,design/assets,workflows,standards,skills/common,skills/frontend,skills/ai-tools,research,specs/_template/pm-inputs/assets}
  ```
- **DoD**：所有目录已创建且为空（除模板占位文件）

### 步骤 3：落 `/docs/index.md`（G-2）

- **输入**：模板 `docs/index.md`（仅参考结构）
- **动作**：拷贝并调整路径锚点 + 写入本项目特定的入口（tech-stack / system-overview / architecture）
- **输出**：`/docs/index.md`
- **DoD**：路径锚点有效；建议阅读顺序指向本项目 design 三件套

### 步骤 4：落 design 三件套（G-3 / G-4 / G-5）

- **输入**：finding §2.2（技术栈对比）+ finding §3.2（映射分析）+ finding §3.4（AGENTS.md 占位符替换）
- **动作**：完全重写（不沿用模板原文）
- **输出**：
  - `/docs/design/tech-stack.md` — React 18 + antd 5 + fedx-ssr + valtio + midway + ECharts
  - `/docs/design/system-overview.md` — 4 大模块 IA + 路由 + 五大中心 + 信管局 + GIS
  - `/docs/design/architecture.md` — midway BFF + fedx-ssr + React 18 大屏分层
- **DoD**：三件套无模板原文残留；本项目特有内容齐全；交叉引用有效

### 步骤 5：落 design 辅助文档（G-6 / G-7 / G-8）

- **动作**：
  - G-6：拷贝模板 `data-models.md` / `api-contracts.md` / `glossary.md` 作为占位，**首行标注「待 plan-003 整合」**
  - G-7：按 O-1 决策
    - 启用 qiankun → 拷贝模板 `framework-communication.md` 并重写
    - 不启用 → 删（或改写为「上游/下游数据源契约」）
  - G-8：拷贝模板 `design/decisions/README.md` + `adr-template.md`
- **DoD**：所有文件首行均有「状态标注」（已重写 / 占位 / 待整合）

### 步骤 6：落 workflows（G-9）

- **动作**：拷贝模板 4 篇 + README，并按本项目栈微调
  - `workflows/README.md`
  - `workflows/as-is-to-be-guide.md`（**与模板一致，不重写**）
  - `workflows/brownfield-module-refactor.md`（**与模板一致，不重写**）
  - `workflows/tdd-process.md`（**与模板一致，不重写**）
- **DoD**：流程文档与模板一致；路径锚点适配本项目

### 步骤 7：落 standards（G-10）

- **动作**：拷贝模板 2 篇 + README
  - `standards/README.md`
  - `standards/coding-standards.md`（**按本项目栈微调**：React 18 + antd 5 + fedx-ssr）
  - `standards/security-standards.md`（与模板一致）
- **DoD**：coding-standards.md 明确标注「适配 React 18 / antd 5」

### 步骤 8：落 skills（G-11）

- **动作**：拷贝模板 skills/ 内容
  - `skills/README.md`
  - `skills/common/{README.md, git-workflow.md}`（与模板一致）
  - `skills/frontend/{README.md, react/{README.md, coding.md（占位）, testing.md（占位）}}`
    - coding.md / testing.md 留**占位文件**，**标注「待 plan-003 整合」**
  - `skills/ai-tools/claude-cursor/{README.md, prompts.md}`（与模板一致）
- **DoD**：所有文件存在；占位文件首行标注「待 plan-003 整合」

### 步骤 9：落 research（G-12）

- **动作**：拷贝模板 `research/README.md`；**不创建**任何 `<topic>/` 子目录
- **DoD**：`/docs/research/README.md` 存在

### 步骤 10：落 specs 顶层（G-13）

- **动作**：
  - 拷贝 `specs/index.md`（**模板版本**：登记 _template 与 fault-report 等示例；本项目模块由 plan-003 后追加）
  - 拷贝 `specs/spec-split-guide.md`（与模板一致）
  - 拷贝 `specs/_template/`（五件套 + pm-inputs/）
- **DoD**：specs/ 顶层可用；模板完整；specs/index.md 占位行清晰

### 步骤 11：落 `/docs/ai-prompts-guide.md`（G-14）

- **动作**：拷贝模板；调整路径锚点适配本项目
- **DoD**：文档存在；占位符 `{slug}` / `{模块中文名}` / `{CODE_ROOT}` 保留供后续替换

### 步骤 12：同步更新 roadmap（G-15）

- **动作**：
  - §3 操作日志追加 14 个步骤（步骤 1–11）的状态（✅ 已完成 / ⚠️ 占位 / ⏳ 待 PM）
  - §2 决策表追加本计划沉淀的新决策（D-11 起）
- **DoD**：roadmap.md 反映本计划执行后的新状态

---

## 6. 步骤清单总览

| 步骤 | 目标 | 产物类型 | 阻塞 |
| ---- | ---- | -------- | ---- |
| 1    | 落 `/AGENTS.md` | 重写 | F-5 |
| 2    | 建目录骨架 | 目录 | — |
| 3    | 落 `/docs/index.md` | 重写 | — |
| 4    | 落 design 三件套 | **重写**（核心） | F-1 |
| 5    | 落 design 辅助文档 | 拷贝 + 占位 | F-3 |
| 6    | 落 workflows | 拷贝 | — |
| 7    | 落 standards | 拷贝 + 微调 | — |
| 8    | 落 skills | 拷贝 + 占位 | F-2 |
| 9    | 落 research | 拷贝 | — |
| 10   | 落 specs 顶层 | 拷贝 | — |
| 11   | 落 ai-prompts-guide | 拷贝 | — |
| 12   | 更新 roadmap | 同步 | — |

---

## 7. 风险与缓解

| #   | 风险                                                                                                       | 缓解                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R-1 | design 三件套重写可能与本项目实际不符                                                                       | 重写时严格基于 finding §2.2/§3.1 的事实数据；不确定处标「待 PM/架构师确认」                          |
| R-2 | 占位文件（data-models / api-contracts / glossary / coding.md / testing.md）后期被遗忘                         | 占位文件首行加 ⚠️ 标注 + roadmap §4.1 跟踪                                                          |
| R-3 | `/AGENTS.md` 占位符替换可能跑出模板意外内容                                                                 | 逐项对照 finding §3.5 替换清单；不替换的占位符删除而非保留                                            |
| R-4 | framework-communication.md 按 O-1 决策不明                                                                   | 默认按「不启用 qiankun」处理（删除或改写），加 ⚠️ 标注「待 PM 确认」                                  |
| R-5 | docs/ 体积较大导致一次 commit 变更过大                                                                       | 分步骤 commit；每个步骤完成后立即 commit（不堆积）                                                    |
| R-6 | 路径锚点（`./design/tech-stack.md` 等）在拷贝后失效                                                         | 拷贝后逐文件检查锚点；用编辑器跳转验证                                                                |
| R-7 | README.md（项目根 1 行版）未纳入本计划，可能导致项目根文档不一致                                              | 计划 12（roadmap 同步）追加 D-「README.md 是否重写」决策（建议保持现状或仅扩写 1 句）                  |

---

## 8. 评审检查点

### 8.1 步骤 1 后（AGENTS.md 落盘）

- [ ] 所有占位符已替换
- [ ] 硬约束（原模板「必须遵守」「禁止」段）原样保留
- [ ] 跨文档引用（如 `@AGENTS.md`）仍指向正确位置

### 8.2 步骤 4 后（design 三件套落盘）

- [ ] 三件套中**无模板原文残留**（逐段对照模板原文）
- [ ] 提及的技术栈全部为本项目（无 React 16 / antd 4 / Hox / oss-web-common 等）
- [ ] 路由表覆盖 `/gd-emergency-support` / `/five-major-center` / `/info-management-bureau` / `/gis-entry`
- [ ] 架构分层明确：BFF / SSR / 前端 三层职责清晰

### 8.3 步骤 12 后（roadmap 同步）

- [ ] roadmap.md §3 操作日志追加 11 步
- [ ] roadmap.md §2 决策表追加 D-11 起新决策
- [ ] roadmap.md §4.1 索引反映新文件
- [ ] roadmap.md §5 下一步指向 plan-003

### 8.4 完成定义（DoD）

- [ ] G-1 ~ G-15 全部完成
- [ ] 没有动任何业务代码（git diff 仅 `/AGENTS.md` + `/docs/` + `/trae/documents/roadmap.md`）
- [ ] 所有路径锚点有效
- [ ] 没有模板原文残留
- [ ] 占位文件首行均有 ⚠️ 标注
- [ ] roadmap.md 同步更新
- [ ] 本计划执行完成后移入 `plans/done/`

---

## 9. 工时与依赖提示（不做时间预测，仅列依赖）

| 前置                       | 必须等其完成后才能开始的后续                                |
| -------------------------- | ----------------------------------------------------------- |
| 步骤 1（AGENTS.md）        | 步骤 12（roadmap 同步）                                     |
| 步骤 2（建目录）           | 步骤 3–11（所有文件落盘）                                   |
| 步骤 4（design 三件套）    | 步骤 5（design 辅助文档，便于交叉引用）                     |
| plan-001 Stage A           | 步骤 1（AGENTS.md 内容来自 Stage A 结论）                   |
| plan-001 Stage B           | 步骤 8（skills/ 占位来自 Stage B 结论）                     |
| 全部步骤完成               | plan-003 启动（业务模块 spec 依赖顶层骨架）                 |

---

## 10. 关联文档

| 文档                                                                                                          | 说明                                                |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `.trae/skills/oss-vis-gd-project-context/plans/done/roadmap.md`                                                                              | 整体路线图                                          |
| [`./2026-07-29-001-plan-next-research-step.md`](./2026-07-29-001-plan-next-research-step.md)                  | 上游：研究计划（Stage A–F）                          |
| [`./2026-07-29-003-plan-modules-specs.md`](./2026-07-29-003-plan-modules-specs.md)                            | 下游：业务模块 spec 落地计划                         |
| `.trae/skills/oss-vis-gd-project-context/plans/done/research/2026-07-29-001-docs-template-structure-findings.md` | 第一轮 research 结论                                 |
| `.trae/skills/oss-vis-gd-project-context/plans/done/plans/done/2026-07-29-002-docs-init-research-output.md` | 已归档：第一轮 docs 初始化执行规划                   |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/AGENTS.md`                              | 模板 AGENTS（仅参考结构）                           |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/docs`                                      | 模板 docs/（仅参考结构）                            |

---

## 11. 立即可启动的下一步（用户决策）

| 选项 | 决策                                                                                                          | 默认值          |
| ---- | --------------------------------------------------------------------------------------------------------------- | --------------- |
| Q-A  | plan-001 的 Stage A 是否已准备好可启动本计划？                                                                 | 推荐：先完成 Stage A 再启动 |
| Q-B  | 步骤 4（design 三件套）是否需要 PM/架构师评审草稿后才落盘？                                                    | 推荐：先落盘评审，后微调 |
| Q-C  | 占位文件（data-models / api-contracts / glossary）是否在 plan-003 整合前允许被引用？                          | 推荐：不允许    |
| Q-D  | 本计划 12 步是否一次性执行，还是分批（如先 AGENTS.md + docs/ 骨架，再 design 三件套）？                       | 推荐：分批      |

> 全部使用「推荐」值 → AI 可直接启动本计划，但会等 plan-001 Stage A 完成后才开始步骤 1
> 如调整 → 给出选项字母即可，AI 重新生成执行顺序