# 大屏可视化分析（big-screen）Roadmap

> 位置：`.trae/skills/oss-mtc-transition-ln-project-context/plans/`
> 范围：4 大屏 24 模块（人员 / 辽宁信访 / 进京信访 / 信访比对）
> 定位：**计划索引 + 审批流 + 里程碑**；实质内容指向 `design/` 文档

---

## 0. 关联文档

| 文档            | 内容                                                     | 位置                                 |
| --------------- | -------------------------------------------------------- | ------------------------------------ |
| `design/001`    | 开发指导总则（docs 现状 + 硬规则 + 开展步骤 + 矛盾跟踪） | `design/001-big-screen-dev-guide.md` |
| `design/002`    | 决策日志（D1–D9 + D-R4）                                 | `design/002-big-screen-decisions.md` |
| `design/003`    | 大屏路由权威表                                           | `design/003-big-screen-routes.md`    |
| `plans/memo.md` | 待办 / 探索中 / 未立案想法                               | `plans/memo.md`                      |
| `AGENTS.md` §10 | 文档修改门禁（L1/L2/L3）                                 | 仓库根                               |

---

## 1. 决策矩阵

> 完整决策矩阵（状态 + 阻塞方 + 影响范围）详见 `design/002-big-screen-decisions.md` §1。

---

## 2. 里程碑

| Milestone          | 目标                                                  | 依赖    | 入口              |
| ------------------ | ----------------------------------------------------- | ------- | ----------------- |
| **M0** 前置锁死    | ✅ D3 + D-R4 已拍板 → 全部步骤解锁                    | -       | `task-004` ✅     |
| **M1** spec 五件套 | ✅ 038 五件套已生成（task-013）；039-041 待生成       | M0 + D6 | `038-…` 起新 spec |
| **M2** 契约冻结    | `api-contracts.md` §7.18 + OpenAPI                    | M1      | 同 M1             |
| **M3** 后端        | `services/visual/big_screen/` + SQL + routers + 单测  | M2      | 同 M1             |
| **M4** 前端        | `pages/bigdata/` + `pages/dashboard/` + 共用壳 + 4 屏 | M2      | 同 M1             |
| **M5** 联调        | acceptance + 更新 AGENTS §2.1 / system-overview       | M3 + M4 | -                 |

> 实现步骤详见 `design/001` §4（12 步）

### 2.1 当前活跃分支

| 分支              | 状态          | 说明                                                                             |
| ----------------- | ------------- | -------------------------------------------------------------------------------- |
| **主线**（M1–M5） | 🟡 038 已解锁 | 038 PM 输入已迁入（D6 部分解锁）；039/040/041 待迁入；038 编码待启动（task-016） |
| **基础组件封装**  | 🟡 进行中     | 新分支：封装 `ScalerContainer` 等大屏通用组件，独立于主线推进                    |

---

## 3. 任务文件索引

| 文件                                              | 状态                                                                                                | 阻塞              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- |
| `task-001-docs-通读与待办盘点.md`                 | ✅ 完成 → `done/`                                                                                   | —                 |
| ~~`task-002-前端目录现状核对.md`~~                | ❌ 撤销（task-001 已确认目录不存在）                                                                | —                 |
| `task-003-spec-拆分粒度决策.md`                   | ✅ 完成 → `done/`（D2 = 4 spec，038–041）                                                           | —                 |
| `task-004-后端API形状与鉴权决策.md`               | ✅ 完成 → `done/`（D3 + D7 + D-R4 已拍板）                                                          | —                 |
| `task-005-清理-api-contracts-合并冲突.md`         | 🔽 低优（非本项目引入，择机处理）                                                                   | L3 审批           |
| `task-006-迁移PM输入到-pm-inputs.md`              | ⚪ 待写                                                                                             | D2（✅ 已解锁）   |
| `task-007-4屏菜单结构决策.md`                     | ⚪ 待写（D1 已拍板，仅剩 D-R4）                                                                     | —                 |
| `task-008-确认-letter-screen-4.md`                | ✅ 完成（D9 已确认）                                                                                | —                 |
| `task-010-scaler-container-基础组件封装.md`       | ✅ 完成 → `done/`（ScalerContainer 缩放适配容器）                                                   | —                 |
| `task-011-ec-map-基础组件改造.md`                 | ✅ 完成 → `done/`（ec-map 依赖替换 + 类型补全）                                                     | —                 |
| `task-012-scaler-container-overflow与全屏增强.md` | ✅ 完成 → `done/`（overflow 按 mode 动态 + enableFullScreen 全屏能力）                              | —                 |
| `task-2026-08-12-013-038-spec五件套生成.md`       | ✅ 完成（五件套已生成）                                                                             | —                 |
| `task-2026-08-12-014-038-m0文档审批.md`           | ✅ 完成 → `done/`（M0 文档审批全部执行）                                                            | —                 |
| `task-2026-08-12-015-038-编码前置阻塞清理.md`     | ✅ 完成 → `done/`（B1-B5 已完成；B6 拆 B6.1/B6.2/B6.3/B6.4，其中 B6.2/B6.4 转交 memo R8/R9）        | 数据库/PM/geojson |
| `task-2026-08-12-016-038-编码开发.md`             | ⚪ 待启动（M1-M5 编码，等 task-015 阻塞清理完成）                                                   | task-015 完成     |
| `task-2026-08-13-017-skill内部文档偏移检查.md`    | ✅ 完成 → `done/`（偏移清单产出 + 全部偏移修复完成）                                                | —                 |
| `task-2026-08-13-018-路由信息多处记录优化.md`     | ✅ 完成 → `done/`（路由单一事实来源优化：project-meta §1 为唯一权威，其余引用不复制）               | —                 |
| `task-2026-08-13-019-skill文档结构性重复优化.md`  | ✅ 完成 → `done/`（门禁/决策/硬规则去重 + 路由权威表新建 design/003 + AGENTS §2.1 引用 design/003） | —                 |
| `task-2026-08-13-020-interaction-store-实现.md`   | ✅ 完成 → `done/`（InteractionStore 大屏交互状态管理，tsc 编译通过 + 类型推导验证通过）             | —                 |
| `task-2026-08-13-021-038五件套升级对齐大屏模板.md` | ✅ 完成 → `done/`（038 五件套升级对齐大屏模板：spec/plan/tasks/data-model-extensions/acceptance-tests 章节对齐 `_large-screen-template/`，§8 共享能力不写路径引用，042 共享组件顶层目录骨架建立） | —                 |
| `task-2026-08-13-022-039五件套生成-规格阶段.md` | ⚪ 待启动（039 spec.md + data-model-extensions.md；前置 task-021） | — |
| `task-2026-08-13-023-039五件套生成-实施阶段.md` | ⚪ 待启动（039 plan.md + tasks.md + acceptance-tests.md；前置 task-022） | — |
| `task-2026-08-13-024-040五件套生成-规格阶段.md` | ⚪ 待启动（040 spec.md + data-model-extensions.md；前置 task-022） | — |
| `task-2026-08-13-025-040五件套生成-实施阶段.md` | ⚪ 待启动（040 plan.md + tasks.md + acceptance-tests.md；前置 task-024） | — |
| `task-2026-08-13-026-041五件套生成-规格阶段.md` | ⚪ 待启动（041 spec.md + data-model-extensions.md；前置 task-024） | — |
| `task-2026-08-13-027-041五件套生成-实施阶段.md` | ⚪ 待启动（041 plan.md + tasks.md + acceptance-tests.md；前置 task-026） | — |

### 3.1 执行顺序

```
主线（🟡 038 已解锁，039-041 待迁入）
task-001（完成）──→ task-003（D2 完成）──→ task-004（D3 + D7 + D-R4 完成）──→ task-006 / task-007
                                                                          │
task-008（D9 完成）────────────────────────────────────────────────────────-┘

task-005（D8，✅ 已关闭）

038 主线：task-013（✅ 五件套）──→ task-014（✅ M0 文档审批）──→ task-015（✅ 阻塞清理）──→ task-016（⚪ 编码 M1-M5）

──────────────────────────── 分支（🟡 进行中，独立推进） ────────────────────────────

task-010（✅ ScalerContainer 完成）──→ task-011（✅ ec-map 改造完成）──→ task-012（✅ overflow + 全屏增强）──→ task-020（✅ InteractionStore）──→ 后续基础组件…
```

---

## 4. 待审批的文档改动提案

> 每条勾选走完才执行；与 `AGENTS.md` §10 联动

| 状态 | 提案                                                                                                                             | 目标文件                                                                                                                                  | 等级 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| [x]  | **R-AGENTS-L1L2L3** 文档修改门禁                                                                                                 | `AGENTS.md` §10                                                                                                                           | L2   |
| [x]  | **R-AGENTS-TASK-DONE** task 文件生命周期                                                                                         | `AGENTS.md` §10.1                                                                                                                         | L2   |
| [x]  | **R-AGENTS-ANTI-HALLUCINATION** 反幻觉规则                                                                                       | `AGENTS.md` §8 禁止行为新增条目                                                                                                           | L2   |
| [x]  | D2 spec 拆分登记（038–041）                                                                                                      | `docs/specs/index.md` + `docs/design/system-overview.md` §2.2.2                                                                           | L3   |
| [x]  | D3 API 形状                                                                                                                      | `docs/design/api-contracts.md` §7.18                                                                                                      | L3   |
| [x]  | D1 图表选型                                                                                                                      | `docs/specs/{NNN}/spec.md` §0 + `docs/skills/frontend/react/coding.md`                                                                    | L3   |
| [ ]  | 数据模型口径                                                                                                                     | `docs/design/data-models.md` §6 / §7                                                                                                      | L3   |
| [ ]  | 模块清单                                                                                                                         | `AGENTS.md` §2.1                                                                                                                          | L2   |
| [ ]  | AGENTS §5.5 图表选型更新                                                                                                         | `AGENTS.md` §5.5                                                                                                                          | L2   |
| [x]  | AGENTS §2.2 assets SQL 路径修正                                                                                                  | `AGENTS.md` §2.2                                                                                                                          | L2   |
| [ ]  | data-models.md §7 补录 `letter_screen_4`                                                                                         | `docs/design/data-models.md` §7                                                                                                           | L3   |
| [x]  | **R-AGENTS-SKILL-AUTOLOAD** skill 自动加载                                                                                       | `AGENTS.md` §1 新增条目                                                                                                                   | L2   |
| [x]  | **R-AGENTS-ROUTE-REF** AGENTS §2.1 路由列引用 design/003                                                                         | `AGENTS.md` §2.1                                                                                                                          | L2   |
| [x]  | **R-DOCS-038-UPGRADE** 038 五件套升级对齐大屏模板                                                                                | `docs/specs/038-bigdata-personnel-display/{spec,plan,tasks,data-model-extensions,acceptance-tests}.md`                                    | L3   |
| [x]  | **R-DOCS-COMPONENTS-COMMON-INIT** 042 共享组件目录骨架建立（顶层目录 + README 占位） | `docs/specs/042-components-common/README.md` | L3   |
| [ ]  | **R-DOCS-039-SPEC** 039 辽宁信访大屏规格阶段（spec.md + data-model-extensions.md） | `docs/specs/039-bigdata-petition-display/{spec,data-model-extensions}.md` | L3   |
| [ ]  | **R-DOCS-039-IMPL** 039 辽宁信访大屏实施阶段（plan.md + tasks.md + acceptance-tests.md） | `docs/specs/039-bigdata-petition-display/{plan,tasks,acceptance-tests}.md` | L3   |
| [ ]  | **R-DOCS-040-SPEC** 040 进京信访大屏规格阶段（spec.md + data-model-extensions.md） | `docs/specs/040-bigdata-beijing-petition-display/{spec,data-model-extensions}.md` | L3   |
| [ ]  | **R-DOCS-040-IMPL** 040 进京信访大屏实施阶段（plan.md + tasks.md + acceptance-tests.md） | `docs/specs/040-bigdata-beijing-petition-display/{plan,tasks,acceptance-tests}.md` | L3   |
| [ ]  | **R-DOCS-041-SPEC** 041 信访比对大屏规格阶段（spec.md + data-model-extensions.md） | `docs/specs/041-bigdata-petition-comparison-display/{spec,data-model-extensions}.md` | L3   |
| [ ]  | **R-DOCS-041-IMPL** 041 信访比对大屏实施阶段（plan.md + tasks.md + acceptance-tests.md） | `docs/specs/041-bigdata-petition-comparison-display/{plan,tasks,acceptance-tests}.md` | L3   |

---

## 5. 变更记录

| 日期       | 变更                                                                                                                                                                                                                                                                                                                                | 备注                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 2026-08-11 | 初始化 + 多轮重构（task-001 元任务 / L1L2L3 门禁 / task 生命周期 / D2 拍板 4 spec）                                                                                                                                                                                                                                                 | 初版→多轮迭代               |
| 2026-08-11 | 文档结构调整：通读盘点拆为 `design/001`（指导总则）+ `design/002`（决策日志）；§5 风险移至 `memo.md`；roadmap 瘦身为索引型                                                                                                                                                                                                          | 用户要求：roadmap 只做索引  |
| 2026-08-11 | AGENTS §8 新增 4 条反幻觉规则（不得编造路径/端点/表字段/章节编号/数据/操作状态）；private-notes 删除，有价值内容迁入 memo                                                                                                                                                                                                           | R-AGENTS-ANTI-HALLUCINATION |
| 2026-08-11 | M1 标记 ⏸️ 暂停；§2.1 新增「当前活跃分支」（主线暂停 / 基础组件分支 🟡）；§3.1 执行顺序图体现分支关系；task-010 索引登记                                                                                                                                                                                                            | 主线暂停 + 分支开启         |
| 2026-08-11 | task-011 ec-map 基础组件改造完成（依赖替换 ahooks/echarts-for-react/antd，类型补全，tsc 编译通过）；§3 索引 + §3.1 执行顺序图更新                                                                                                                                                                                                   | 基础组件分支推进            |
| 2026-08-11 | task-012 创建：ScalerContainer overflow 按 mode 动态 + enableFullScreen 全屏能力；设计文档已更新；§3 索引 + §3.1 执行顺序图更新                                                                                                                                                                                                     | 基础组件分支推进            |
| 2026-08-11 | task-012 完成：代码实现 + 三路 subagent review（代码质量/设计一致性/安全边界）+ 修复 4 项问题（enableFullScreen 依赖/SSR 守卫/基础类名/零尺寸守卫）；tsc 编译通过；移至 done/                                                                                                                                                       | 基础组件分支推进            |
| 2026-08-12 | task-013 创建：038 人员信息大屏 spec 五件套生成；阶段一（pm-input）标记完成；阶段二（五件套）进行中；§3 索引 + §3.1 执行顺序图更新                                                                                                                                                                                                  | 主线 M1 启动                |
| 2026-08-12 | task-013 完成：三张表核对通过（data-models §6.4/§8.2/§8.7）；五件套全部生成（spec/extensions/acceptance-tests/plan/tasks）；8 项开放问题登记；task 移至 done/                                                                                                                                                                       | 主线 M1 spec 完成           |
| 2026-08-12 | task-014 创建：038 M0 文档审批（index.md + system-overview §2.2.2 已修改待 review；api-contracts §7.41+ 未执行）；M1 后端竖切待启动                                                                                                                                                                                                 | M0 L3 审批                  |
| 2026-08-12 | task-014 拆分：M1-M5 编码部分移至 task-015；task-014 仅保留 M0 文档审批                                                                                                                                                                                                                                                             | task 职责清晰化             |
| 2026-08-12 | task-014 完成：M0-3 api-contracts §7.18 端点契约登记；M0 全部完成                                                                                                                                                                                                                                                                   | D3 落地                     |
| 2026-08-12 | AGENTS §1 新增 R-AGENTS-SKILL-AUTOLOAD：AI Agent 新会话须先加载 skill                                                                                                                                                                                                                                                               | L2 提案执行                 |
| 2026-08-12 | task-015 拆分：原「038 编码开发」改为 task-016；task-015 重新定义为「038 编码前置阻塞清理」（B1-B6）；§3 索引 + §3.1 执行顺序图更新                                                                                                                                                                                                 | task 职责清晰化             |
| 2026-08-12 | task-015 完成：B1-B5 已完成；B6 拆 B6.1/B6.2/B6.3/B6.4，B6.1/R7 路由决策落地（AGENTS.md + 038 spec/acceptance/plan/tasks 同步），B6.2 转交 memo R8，B6.4 转交 memo R9，B6.3 13 处编号逐个更新；文件移入 `done/`，§4 索引 + §3.1 执行顺序图同步                                                                                      | ✅ 038 阻塞清理完成         |
| 2026-08-13 | task-017 + task-018 创建：skill 内部文档偏移检查 + 路由信息多处记录优化；§3 索引登记                                                                                                                                                                                                                                                | skill 文档整理              |
| 2026-08-13 | task-017 完成：偏移清单全部修复（路由 7 + symlink 3 + api-contracts 8 + D6 3 + 其他 6 + 引用断裂 3）；D6 更新为部分解锁、D8 更新为已关闭、D1 提案标记已执行；§3 索引 + §3.1 执行顺序图更新                                                                                                                                          | 偏移修复完成                |
| 2026-08-13 | task-019 创建：skill 文档结构性重复优化（门禁/决策/硬规则去重 + 路由表双向引用精简）；§3 索引登记                                                                                                                                                                                                                                   | 结构性去重                  |
| 2026-08-13 | task-019 步骤 1 完成：新建 design/003 路由权威表；design/001 §0、references/001 §4/§10、roadmap §1、project-meta §1 全部改为引用去重；§0 关联文档表登记 design/003；§4 新增 R-AGENTS-ROUTE-REF 提案（待审批）                                                                                                                       | 结构性去重步骤 1 完成       |
| 2026-08-13 | task-019 完成：R-AGENTS-ROUTE-REF 提案审批通过并执行（AGENTS §2.1 路由引用改为 design/003）；task 移至 done/                                                                                                                                                                                                                        | 结构性去重全部完成          |
| 2026-08-13 | task-020 创建：InteractionStore 大屏交互状态管理实现（zustand v5 + defineFields + useShallow）；design/components/003 设计文档已生成；§3 索引 + §3.1 执行顺序图更新                                                                                                                                                                 | 基础组件分支推进            |
| 2026-08-13 | task-020 完成：tsc 编译 0 errors；类型推导验证通过（getField 返回精确类型，label 推导为 string 非 any）；代码与设计文档 §5 一致；task 移至 done/                                                                                                                                                                                    | 基础组件分支推进            |
| 2026-08-13 | task-021 创建：038 五件套升级对齐大屏模板（spec/plan/tasks/data-model-extensions/acceptance-tests 五件套章节对齐 `_large-screen-template/`）；roadmap §4 提案 R-DOCS-038-UPGRADE 已登记，待 PM / 架构师会签                                                                                                                         | L3 提案登记                 |
| 2026-08-13 | task-021 决策：038 升级后 §8 共享能力表格不写路径引用；大屏模板暂不晋升；042-components-common 共享组件顶层目录 + README 占位已建立；roadmap §4 提案 R-DOCS-COMPONENTS-COMMON-INIT 标记已执行                                                                                                                                       | L3 骨架建立                 |
| 2026-08-13 | task-022~027 创建：039/040/041 三大屏五件套生成任务（每个大屏 2 个 task：规格阶段 spec.md+data-model-extensions.md / 实施阶段 plan.md+tasks.md+acceptance-tests.md，共 6 个 task）；roadmap §4 提案 R-DOCS-039/040/041-SPEC+IMPL 共 6 项已登记                                       | L3 提案登记                 |
| 2026-08-13 | 共享组件 spec 方案调整：原方案为派生 `{父编号}-shared-{父slug}/` + 蒸馏到 `large-screen-shared` skill；领导指示改为直接生成独立 spec `NNN-components-common/`，不走派生命名，不蒸馏到 skill。004 §4 + 005 第三步 + `_large-screen-template/` 全部已改；原方案备份在 `004_v0`、`005_v0`、`_large-screen-template_v0/`。详见 memo R10 | 领导指示：方案调整          |
