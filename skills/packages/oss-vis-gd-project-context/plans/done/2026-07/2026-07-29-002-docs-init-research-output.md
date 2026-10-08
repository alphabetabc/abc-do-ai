# Archived Plan-002：docs 目录与 AGENTS.md 初始化执行规划（第一轮研究产出，已归档）

> **状态**：⚠️ **已归档（2026-07-29）** — 本计划是第一轮 research 阶段产出的「docs 初始化执行规划」，作为研究结论参考保留。
> **当前 plans 目录下的活跃计划**：`.trae/skills/oss-vis-gd-project-context/plans/done/2026-07-29-001-plan-next-research-step.md`
> **归档原因**：第一轮 research 已结束；本计划不再作为可执行计划；后续 docs 初始化将基于第二轮 research 重写
> **配套 finding**：`.trae/skills/oss-vis-gd-project-context/plans/research/2026-07-29-001-docs-template-structure-findings.md`

---

> **原始内容（保留）：**

# Plan：docs 目录与 AGENTS.md 初始化

> **日期**：2026-07-29
> **作者**：TRAE Agent
> **配套 research**：`.trae/skills/oss-vis-gd-project-context/plans/research/2026-07-29-001-docs-template-structure-findings.md`
> **目标**：在项目根目录建立与模板对齐的 `docs/` 目录与 `AGENTS.md`
> **范围**：阶段 0–2（不进入阶段 4 重构）；不做业务代码变更
> **当前状态**：草稿，待人工确认后开始执行

---

## 0. TL;DR（结论先行）

| 维度                | 结论                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| 任务来源            | `.local-docs/docs模板-yzf/`（OSS 告警监控-联通系统 Brownfield 模板）                                       |
| 目标                | **阶段 0 + 阶段 1 + 阶段 2**：落 AGENTS.md、docs/ 骨架、业务模块 specs 初始版                              |
| 不做                | **阶段 4 重构**（R1–R5 切片改代码）                                                                       |
| 工期估时建议（人）  | 阶段 0.5–1 人日、阶段 1 1–2 人日、阶段 2 1–2 人日（不含 PM 评审）                                          |
| 关键依赖            | PM 输入（业务模块 A–H 八节）、后端契约（`docs-api-backend/` 整理）                                          |
| 关键风险            | 模板栈（React 16/antd 4）与本项目栈（React 18/antd 5/fedx-ssr）差异显著；spec 文档需重写而非简单替换       |
| 下一步              | **人工确认**：阶段 0.A–0.F 是否一次性执行；阶段 1 模块优先级确认                                           |

---

## 1. 目标与边界

### 1.1 目标（IN）

1. **阶段 0.A**：拷贝并替换 AGENTS.md 到项目根目录 `/AGENTS.md`
2. **阶段 0.B**：建立 `/docs/` 目录骨架（含 index、design、specs、skills、workflows、standards、research）
3. **阶段 0.C–F**：在 `docs/design/` 下重写 tech-stack / system-overview / architecture（3 篇），按需保留 framework-communication
4. **阶段 0.G**：在 `docs/design/` 下保留 data-models / api-contracts / glossary / decisions 模板占位（标注「待 phase 1/2 填」）
5. **阶段 0.H**：拷贝 workflows / standards / skills 的可复用文档
6. **阶段 1**：识别 4 个核心业务模块，建 specs/ 子目录，落 as-is-architecture.md + code-inventory.md
7. **阶段 2**：为每个模块落五件套（spec.md / plan.md / tasks.md / acceptance-tests.md / data-model-extensions.md）

### 1.2 不做（OUT）

1. ❌ 不改业务代码（任何 `src/`、`public/static/`、`build/`、`app.js`、`config.ts` 等都不动）
2. ❌ 不引入新依赖（`package.json` 不变）
3. ❌ 不动 `.eslintrc.js` / `.prettierrc.js` / `.gitignore`
4. ❌ 不创建 YAPI 导出 JSON（后端契约缺失，标注「待 YAPI 导出」）
5. ❌ 不写 `docs/specs/*/pm-inputs/pm-requirements-input.md` 业务正文（PM 未介入；留空 §A–H 章节，标注「待 PM 补」）
6. ❌ 不执行阶段 4 重构切片（R1–R5 暂不启动）

### 1.3 验收定义（DoD）

- [ ] `/AGENTS.md` 已落项目根，内容为模板替换占位符后的本项目版本
- [ ] `/docs/index.md` 与 `/docs/design/README.md` 已存在且路径锚点有效
- [ ] `/docs/design/tech-stack.md` 描述本项目栈（React 18 + antd 5 + fedx-ssr + valtio + midway）
- [ ] `/docs/design/system-overview.md` 描述本项目 IA（应急大屏 + 五大中心 + 信管局 + GIS）
- [ ] `/docs/design/architecture.md` 描述本项目分层（midway BFF + fedx-ssr + React 18）
- [ ] `/docs/workflows/{as-is-to-be-guide,brownfield-module-refactor,tdd-process}.md` 与模板一致
- [ ] `/docs/standards/{coding,security}-standards.md` 与模板一致或微调
- [ ] `/docs/specs/_template/` 完整五件套 + pm-inputs
- [ ] `/docs/specs/<4 个核心模块>/` 每个模块至少有 as-is-architecture.md + 五件套
- [ ] `/docs/specs/index.md` 登记 4 个核心模块
- [ ] 所有 Open Question（research O-1 ~ O-11）至少在对应 spec.md §10 登记

---

## 2. 前置条件

| #   | 条件                                                                                       | 来源                                  | 状态     |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------- | -------- |
| P-1 | research 文档已完成                                                                         | `.trae/skills/oss-vis-gd-project-context/plans/done/research/task-2026-07-29-001-docs-template-research.md` | ✅        |
| P-2 | PM 已确认 4 个核心业务模块列表（or AI 按 §3 推荐值占位）                                    | 阶段 1 起点                           | ⏳ 待确认 |
| P-3 | 后端接口契约清单（`docs-api-backend/`）已粗略分类                                           | 阶段 0.5 增补                         | ⏳ 待开始 |
| P-4 | 是否启用微前端的决策                                                                        | research O-1                          | ⏳ 待 PM/架构师确认 |
| P-5 | 是否需要按钮级鉴权章节                                                                      | research O-2                          | ⏳ 待确认 |
| P-6 | 是否有单测体系                                                                              | research O-3                          | ⏳ 待确认 |
| P-7 | 浏览器兼容 / 分辨率矩阵                                                                    | research 5.2                          | ⏳ 待 PM 补 |

> P-2 / P-4 / P-5 / P-6 / P-7 缺失时，AI 按 research 推荐值占位 + 标注「待 PM 确认」，**不阻塞执行**。

---

## 3. 模块识别（推荐）

> 此为 AI 推荐方案，最终由 PM 在阶段 1 前确认。

| 优先级 | slug                          | 中文名           | 路由                            | 文档范围                                                                                          |
| ------ | ----------------------------- | ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| P0     | `emergency-support-dashboard` | 应急保障大屏     | `/gd-emergency-support`         | 7 个子模块（保障进展 / 保障任务 / 值班表 / 预警感知 / 应急资源 / 网络情况 / 乡镇受损）+ 地图层 |
| P0     | `five-major-center`           | 五大中心         | `/five-major-center`            | 指挥调度中心 / 综合展示中心 / 态势感知中心 / 信管局（嵌入）/ iframe 外部页                       |
| P1     | `info-management-bureau`      | 信管局视图       | `/info-management-bureau`       | 开闭幕式 / 比赛日 / 首页 / 倒计时（4 类子视图）                                                  |
| P1     | `gis-entry`                   | GIS 大屏地图     | `/gis-entry`                    | fedx-gis 集成、EMap、底图、图例、GeoJSON                                                         |

**未识别 / 暂不进 specs（待 PM 决策）**：

- `large-screen-demo`：demo 页，仅供联调，可不写 spec
- 第三方 iframe（节假日保障、抗台防汛、全运会、高速大屏、高铁专网、态势感知）：外部依赖，仅在 `five-major-center` spec 中标注链接

---

## 4. 阶段 / 切片执行计划

### 阶段 0：骨架初始化（一次性，约 0.5 人日）

| ID    | 任务                                                                                              | 源 → 目标路径                                  | 改动类型 | 依赖 |
| ----- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- | ---- |
| 0.A   | 拷贝模板 AGENTS.md → 项目根，替换占位符                                                          | `.local-docs/docs模板-yzf/AGENTS.md` → `/AGENTS.md` | 替换     | —    |
| 0.B-1 | 拷贝模板 docs/index.md → 项目 docs/                                                               | `.local-docs/docs模板-yzf/docs/index.md` → `/docs/index.md` | 拷贝     | —    |
| 0.B-2 | 拷贝模板 docs/ai-prompts-guide.md → 项目 docs/                                                    | 同上路径 → `/docs/ai-prompts-guide.md`          | 拷贝     | —    |
| 0.B-3 | 创建空目录                                                                                        | `/docs/{design,specs,skills,workflows,standards,research}/` | 目录     | —    |
| 0.C   | 拷贝模板 docs/design/README.md                                                                    | → `/docs/design/README.md`                     | 拷贝     | —    |
| 0.D   | **重写** docs/design/tech-stack.md（按本项目栈：React 18 + antd 5 + fedx-ssr + valtio + midway） | 模板作为参考                                   | 重写     | —    |
| 0.E   | **重写** docs/design/system-overview.md（按本项目 IA：4 大模块 + 路由）                          | 模板作为参考                                   | 重写     | —    |
| 0.F   | **重写** docs/design/architecture.md（按本项目分层：midway BFF + fedx-ssr + React 18 大屏）     | 模板作为参考                                   | 重写     | —    |
| 0.G   | 拷贝模板 docs/design/{data-models,api-contracts,glossary}.md + decisions/                        | → `/docs/design/{3 个 md + decisions/}`       | 拷贝（占位） | — |
| 0.H-1 | 拷贝模板 docs/workflows/{README,as-is-to-be-guide,brownfield-module-refactor,tdd-process}.md   | → `/docs/workflows/`                            | 拷贝     | —    |
| 0.H-2 | 拷贝模板 docs/standards/{README,coding-standards,security-standards}.md                          | → `/docs/standards/`                            | 拷贝     | —    |
| 0.H-3 | 拷贝模板 docs/skills/{README,common/git-workflow.md,frontend/README.md,ai-tools/claude-cursor/} | → `/docs/skills/`                              | 拷贝     | —    |
| 0.I   | 拷贝模板 docs/specs/{index,spec-split-guide}.md                                                  | → `/docs/specs/`                               | 拷贝     | —    |
| 0.J   | 拷贝模板 docs/specs/_template/（五件套 + pm-inputs）                                             | → `/docs/specs/_template/`                     | 拷贝     | —    |
| 0.K   | 在 specs/index.md 录入 4 个核心模块占位行（slug / 中文名 / 路由 / 状态）                        | → `/docs/specs/index.md`                       | 录入     | 3    |

> 阶段 0 完成后，应满足 DoD 中除 specs/ 子目录正文外的全部条目。

### 阶段 1：As-Is 文档化（每个模块约 0.5 人日，4 个 = 2 人日）

> 通用约束：阶段 1 **只读业务代码**，不允许修改任何 `src/` 或 `public/`。

| ID     | 任务                                                                                                | 输出路径                                                              | 改动类型 | 依赖   |
| ------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- | ------ |
| 1.A    | 建 4 个模块的 specs 子目录                                                                          | `/docs/specs/{emergency-support-dashboard,five-major-center,info-management-bureau,gis-entry}/` | 目录     | 0.K    |
| 1.B-1  | 拷贝 _template → 各模块目录                                                                         | 同上                                                                 | 拷贝     | 1.A    |
| 1.B-2  | 每个模块的 pm-inputs 目录建空 pm-requirements-input.md（A–H 八节留空，标注「待 PM 补」）             | `/docs/specs/<slug>/pm-inputs/pm-requirements-input.md`               | 模板占位 | 1.B-1  |
| 1.B-3  | 每个模块的 pm-inputs 目录建空 code-inventory.md（A/B 留空，C–J 阶段 1 AI 补）                       | `/docs/specs/<slug>/pm-inputs/code-inventory.md`                       | 模板占位 | 1.B-1  |
| 1.C-1  | emergency-support-dashboard：as-is-architecture.md（7 个子模块 + 应急大屏地图层）                   | `/docs/specs/emergency-support-dashboard/as-is-architecture.md`        | 重写     | 1.B-1  |
| 1.C-2  | five-major-center：as-is-architecture.md（指挥 / 综合展示 / iframe / 信管局嵌入）                   | `/docs/specs/five-major-center/as-is-architecture.md`                  | 重写     | 1.B-1  |
| 1.C-3  | info-management-bureau：as-is-architecture.md（开闭幕式 / 比赛日 / 首页 / 倒计时 4 类）             | `/docs/specs/info-management-bureau/as-is-architecture.md`             | 重写     | 1.B-1  |
| 1.C-4  | gis-entry：as-is-architecture.md（fedx-gis + EMap + 底图 + GeoJSON + 图例）                         | `/docs/specs/gis-entry/as-is-architecture.md`                          | 重写     | 1.B-1  |
| 1.D-1  | 每个模块补 code-inventory.md §C–J（路由 / 页面 / 组件 / API / 数据源 / 状态 / 样式 / 第三方）     | `/docs/specs/<slug>/pm-inputs/code-inventory.md`                       | 补全     | 1.C-*  |

> 阶段 1 完成后，每个模块都应能回答「这个模块现在长什么样」。

### 阶段 2：To-Be 五件套（每个模块约 0.5 人日，4 个 = 2 人日）

> 通用约束：阶段 2 **只写 docs/**，不允许修改业务代码。

| ID     | 任务                                                                                                  | 输出路径                                                          | 改动类型 | 依赖   |
| ------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- | ------ |
| 2.A-1  | emergency-support-dashboard：spec.md（含 §8 现状→目标差异 + §10 开放问题 O-1/O-2/O-6/O-9）            | `/docs/specs/emergency-support-dashboard/spec.md`                 | 重写     | 1.C-1  |
| 2.A-2  | five-major-center：spec.md（含 O-11 第三方 iframe 边界）                                              | `/docs/specs/five-major-center/spec.md`                           | 重写     | 1.C-2  |
| 2.A-3  | info-management-bureau：spec.md（含 O-7 子视图拆分决策）                                              | `/docs/specs/info-management-bureau/spec.md`                      | 重写     | 1.C-3  |
| 2.A-4  | gis-entry：spec.md（fedx-gis 升级路径）                                                               | `/docs/specs/gis-entry/spec.md`                                   | 重写     | 1.C-4  |
| 2.B-*  | 每个模块的 plan.md（R1–R5 切片；R1=无行为变更的类型/枚举对齐）                                       | `/docs/specs/<slug>/plan.md`                                      | 重写     | 2.A-*  |
| 2.C-*  | 每个模块的 tasks.md（每切片可勾选，关联 S*）                                                          | `/docs/specs/<slug>/tasks.md`                                     | 重写     | 2.B-*  |
| 2.D-*  | 每个模块的 acceptance-tests.md（含「现状」列：已实现 / 部分 / 未实现）                                | `/docs/specs/<slug>/acceptance-tests.md`                          | 重写     | 2.A-*  |
| 2.E-*  | 每个模块的 data-model-extensions.md（仅写本模块增量，全局实体合并回 design/data-models.md §2）        | `/docs/specs/<slug>/data-model-extensions.md`                     | 重写     | 2.A-*  |
| 2.F-1  | 整合 docs/design/data-models.md（从 4 个 data-model-extensions.md 提取公共实体）                      | `/docs/design/data-models.md`                                     | 重写     | 2.E-*  |
| 2.F-2  | 整合 docs/design/api-contracts.md（BFF 端点 + 后端契约 + mock 数据映射）                              | `/docs/design/api-contracts.md`                                   | 重写     | —      |
| 2.F-3  | 整合 docs/design/glossary.md（应急保障 / 五大中心 / 信管局 / GIS 术语）                               | `/docs/design/glossary.md`                                        | 重写     | —      |

> 阶段 2 完成后，每个模块都应能回答「这个模块应该长什么样 + 怎么重构」。

### 阶段 3：PM 评审（不属本 plan 范围）

> 阶段 3 是 PM 对 as-is + spec §8/§10 的评审，**不属于 AI 文档化任务**，由 PM / 架构师完成。

### 阶段 4：重构（不在本 plan 范围）

> 阶段 4 是按 plan.md / tasks.md 的 R1–R5 切片改代码，需要单独的 plan 启动。

---

## 5. 模块详细执行规划

### 5.1 emergency-support-dashboard（应急保障大屏 · P0）

**目录结构**：

```
docs/specs/emergency-support-dashboard/
├── as-is-architecture.md       # §1 职责 / §2 子模块 / §3 路由 / §4 地图层 / §5 数据流 / §6 状态 / §7 性能 / §8 债务 / §9 拆分 / §10 开放问题
├── pm-inputs/
│   ├── pm-requirements-input.md # A–H 八节留空
│   └── code-inventory.md        # A–J 全填（路由 / 子模块 / API / mock / 状态 / 样式 / 第三方）
├── spec.md                      # §1 背景 / §2 角色 / §3 接口索引 / §4 界面（7 子模块 + 地图）/ §5 数据 / §6 边界 / §7 NFR / §8 Gap / §9 依赖 / §10 开放问题
├── plan.md                      # R1 类型枚举 / R2 API 收敛 / R3 状态机 / R4 组件拆分 / R5 边界
├── tasks.md                     # 每切片可勾选
├── acceptance-tests.md          # S1–S_N（含现状列）
├── data-model-extensions.md     # 应急保障 NE 类型 / 保障任务 / 值班表 / 预警等
└── assets/                      # 占位（截图待补）
```

**as-is-architecture.md 关键章节**：

| §   | 标题                       | 内容要点                                                                                          |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | 模块职责                   | 7 个子模块 + 地图层（应急 NE 类型 / 台风预报 / 物资调度）的职责                                    |
| 2   | 结构总览（mermaid）        | 路由层 → 页面层 → 组件层 → 数据层                                                                 |
| 3   | 子模块详情                 | 保障进展 / 保障任务 / 值班表 / 预警感知 / 应急资源 / 网络情况 / 乡镇受损（每个一行表）           |
| 4   | 地图层                     | fedx-gis 1.6.9 + EMap v2 + GisConfig + 21 地市 GeoJSON + 应急图例 + 抢修队伍图例                  |
| 5   | 数据流                     | 环境配置 → BFF mock → 前端组件；BFF 仅 `/api/index` + `/api/detail/:id`                           |
| 6   | 状态                       | valtio 1.11.2 + React Hooks（未发现全局状态管理）                                                  |
| 7   | 性能基线                   | 大屏首屏 < 2s / Socket.IO 实时数据延迟 < 1s（待 PM 确认）                                         |
| 8   | 技术债务                   | mock 数据驱动、按钮鉴权缺失、错误处理分散、单元测试缺失                                          |
| 9   | 拆分建议                   | 暂不拆分（7 个子模块功能相对独立，可作为子章节）                                                  |
| 10  | 开放问题                   | O-6 模块 key 对应关系 / O-9 NE 类型建模 / O-10 mock → 真实接口迁移路径                            |

### 5.2 five-major-center（五大中心 · P0）

**目录结构**：同 5.1，但内容按 4 类子视图拆分（伞形 §9）。

**as-is-architecture.md 关键章节**：

| §   | 标题             | 内容要点                                                                                          |
| --- | ---------------- | ------------------------------------------------------------------------------------------------- |
| 1   | 模块职责         | 应急大屏嵌入 + 综合展示嵌入 + 第三方 iframe 集成                                                  |
| 2   | 结构总览         | 指挥调度中心（carousel）/ 综合展示中心（carousel + 保障业务图标 + 个人业务指标）/ iframe-page       |
| 3   | 子视图详情       | cmd-dispatcher-center / comprehensive-display-center / situation-awareness-center                  |
| 4   | 第三方 iframe    | 节假日保障 / 抗台防汛 / 全运会 / 高速大屏 / 高铁专网 / 态势感知（6 个外部 URL）                  |
| 5   | 数据流           | 视图切换 + iframe 加载 + 缩放配置                                                                 |
| 8   | 技术债务         | iframe 跨域 / 缩放响应式 / 视图切换动画                                                            |
| 9   | 拆分建议         | 暂不拆（4 类子视图独立路由 + config 统一驱动）                                                     |
| 10  | 开放问题         | O-11 第三方 iframe 是否纳入 docs 范围                                                              |

### 5.3 info-management-bureau（信管局视图 · P1）

**目录结构**：同 5.1，但 §9 标注「按 O-7 决策是否拆 4 个子 spec」。

**as-is-architecture.md 关键章节**：

| §   | 标题         | 内容要点                                                                                          |
| --- | ------------ | ------------------------------------------------------------------------------------------------- |
| 1   | 模块职责     | 开闭幕式 / 比赛日 / 首页 / 倒计时 4 类子视图的管理                                                |
| 2   | 结构总览     | viewManager（手动 / 自动 + settings + homeConfig + unitConfig）                                   |
| 3   | 子视图详情   | 开闭幕式（开幕式 / 闭幕式 / 残特奥会开幕式 / 残特奥会闭幕式）/ 比赛日 / 首页 / 倒计时            |
| 4   | 数据源       | `open-close-ceremonies-view-*` / `fifteen-game-*` / `home-center-map` / `today-game-scheduler` 等 mock |
| 5   | 数据流       | 视图切换 + 倒计时 + 缩放                                                                            |
| 8   | 技术债务     | 视图切换动画 / 配置驱动 vs 写死                                                                    |
| 9   | 拆分建议     | **按 O-7 决策**：（A）单 spec 含 4 子视图 / （B）拆为 4 子 spec + 伞形                           |
| 10  | 开放问题     | O-7 4 子视图是否拆 spec / 数据源扩展性                                                            |

### 5.4 gis-entry（GIS 大屏地图 · P1）

**目录结构**：同 5.1。

**as-is-architecture.md 关键章节**：

| §   | 标题             | 内容要点                                                                                          |
| --- | ---------------- | ------------------------------------------------------------------------------------------------- |
| 1   | 模块职责         | GIS 大屏地图（独立路由 `/gis-entry`）                                                              |
| 2   | 结构总览         | fedx-gis 集成层 + EMap 底图层 + GeoJSON 数据层 + 图例 + 交互                                       |
| 3   | 子能力详情       | 21 地市 GeoJSON + 乡镇 GeoJSON + 应急图例（暴雨/台风/洪水/雨量）+ 抢修队伍图例                     |
| 4   | 数据源           | GisConfig + EMapConfig + 21 地市 GeoJSON + 应急物资图标 + 应急图例（icon-legend）                 |
| 5   | 数据流           | 地图初始化 → GeoJSON 加载 → 图层渲染 → 交互                                                        |
| 8   | 技术债务         | GisConfig 与 EMapConfig 二选一关系未明 / GeoJSON 体积 / 图例维护                                    |
| 9   | 拆分建议         | 暂不拆                                                                                             |
| 10  | 开放问题         | GisConfig vs EMapConfig 何时使用                                                                  |

---

## 6. 风险与缓解

| #   | 风险                                                                                                       | 缓解                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R-1 | 阶段 0 一次性拷贝 + 重写耗时较长（4 个 design 文档）                                                       | 拆分执行：先 0.A–0.B（骨架），再 0.D–0.F（3 篇 design），最后 0.G–0.K（占位）                       |
| R-2 | PM 未介入时 §A–H 留空，影响阶段 2 spec.md §1–§5 准确性                                                     | 阶段 2 标注「待 PM 补」，不臆造业务规则                                                                |
| R-3 | 后端契约缺失（`docs-api-backend/` 散乱），api-contracts.md 难以一次成型                                       | 阶段 0.5 增补「api-contracts.md 框架」（按 baseUrlType / 端点分类模板），标注「待 YAPI 导出 / 待后端补」 |
| R-4 | 第三方 iframe 难以文档化                                                                                    | 在 five-major-center spec §10 + glossary.md 标注「外部依赖」，不写内部细节                            |
| R-5 | 模板栈与本项目栈差异（React 16/antd 4/Hox/oss-web-common → React 18/antd 5/valtio/fedx-ssr）              | tech-stack.md **明确标注差异** + 删除模板中不适用的小节（如 oss-web-common）                          |
| R-6 | 阶段 2 spec.md 可能过长（>300 行），单文件难维护                                                            | 按 `.trae/skills/oss-vis-gd-project-context/plans/done/docs/specs/spec-split-guide.md` 决策是否拆子 spec                          |
| R-7 | 真实接口契约变动频繁（mock 阶段 → 联调阶段）                                                                | spec.md §3 接口索引标注「来源 + 最后更新日期」，api-contracts.md 单独维护                              |
| R-8 | docs/ 体积过大导致仓库 commit 变重                                                                         | 每个 spec 五件套控制在 1000 行内；assets/ 仅放必要截图                                                  |
| R-9 | AI 单次无法读完所有 design/spec 文档                                                                       | 阶段 2 每次只跑一个模块的 5 件套生成，遵守 `.trae/skills/oss-vis-gd-project-context/plans/done/docs/ai-prompts-guide.md`  |

---

## 7. 评审检查点

### 7.1 阶段 0 评审（创建 /AGENTS.md + /docs/ 骨架后）

- [ ] AGENTS.md 占位符已全部替换为「广东移动_应急保障可视化大屏」相关内容
- [ ] docs/index.md 路径锚点可点击（验证 4 篇 design 章节链接）
- [ ] docs/design/tech-stack.md 描述本项目栈（不含模板原文）
- [ ] docs/design/system-overview.md 列出 4 个核心模块路由
- [ ] docs/design/architecture.md 描述 midway BFF + fedx-ssr + React 18 分层
- [ ] docs/workflows/ + docs/standards/ 与模板一致（路径交叉引用有效）
- [ ] docs/specs/_template/ 完整五件套 + pm-inputs

### 7.2 阶段 1 评审（每个模块 as-is 后）

- [ ] as-is-architecture.md 10 节齐全
- [ ] code-inventory.md §C–J 全部填实（路由 / 组件 / API / 数据源 / 状态 / 样式 / 第三方）
- [ ] pm-inputs/pm-requirements-input.md A–H 八节留空 + 标注「待 PM 补」
- [ ] as-is 仅描述现状，不写改进建议（改进建议进 spec §8）

### 7.3 阶段 2 评审（每个模块 spec 后）

- [ ] spec.md §8 列出「现状 → 目标」差异（引用 as-is 章节）
- [ ] spec.md §10 列出本模块阻塞项（O-* 编号引用 research）
- [ ] acceptance-tests.md 每条 S* 含「现状」列（已实现 / 部分 / 未实现 / 与业务不符）
- [ ] plan.md R1–R5 切片可执行；R1 严格无行为变更
- [ ] tasks.md 每条勾选项写到文件路径级
- [ ] data-model-extensions.md 明确「已合并到 design/data-models.md / 未合并 / 不合并」状态
- [ ] design/data-models.md / api-contracts.md / glossary.md 已整合各模块的公共实体 / 接口 / 术语

### 7.4 完成定义（DoD）

- [ ] AGENTS.md + docs/ 全部初始化条目已落
- [ ] 4 个核心模块的 as-is + 五件套齐全
- [ ] design/ 三篇必填（tech-stack / system-overview / architecture）已重写
- [ ] design/ data-models / api-contracts / glossary 三篇已整合
- [ ] 所有 Open Question（O-1 ~ O-11）已登记到对应 spec §10
- [ ] docs/ 仓库目录未污染业务代码（git diff 仅 docs/ + AGENTS.md）

---

## 8. 工时与依赖提示（不做时间预测，仅列依赖关系）

| 前置任务                                | 必须等其完成后才能开始的后续任务                       |
| --------------------------------------- | ------------------------------------------------------ |
| 阶段 0.B（docs/ 骨架）                  | 阶段 0.D–0.F（design 重写）                            |
| 阶段 0.K（specs/index.md 登记）         | 阶段 1.A（建模块子目录）                               |
| 阶段 1.B-2/3（pm-inputs 占位）          | 阶段 1.C-*（as-is-architecture）                       |
| 阶段 1.C-*（as-is 完整）                | 阶段 1.D-*（code-inventory 补全）                       |
| 阶段 1.D-*（code-inventory 完整）       | 阶段 2.A-*（spec.md 重写）                             |
| 阶段 2.A-*（spec.md）                   | 阶段 2.B-/2.C-/2.D-/2.E-*（plan / tasks / acceptance / data-model-extensions） |
| 阶段 2.E-*（所有模块 data-model-extensions） | 阶段 2.F-1（整合 design/data-models.md）           |
| 阶段 2.F-1/2/3                          | 阶段 3（PM 评审）                                      |
| 阶段 3（PM 评审通过）                   | 阶段 4（按 plan.md 切片重构）                          |

---

## 9. 关联文档

| 文档                                                                                                          | 说明                                          |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `.trae/skills/oss-vis-gd-project-context/plans/done/research/task-2026-07-29-001-docs-template-research.md` | 配套 research                                  |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/AGENTS.md`                              | 模板 AGENTS（待替换占位符）                   |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/docs/workflows/as-is-to-be-guide.md` | Brownfield As-Is/To-Be 模式指南       |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/docs/workflows/brownfield-module-refactor.md` | Brownfield 阶段步骤               |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/docs/ai-prompts-guide.md` | 三条主提示词（阶段 1 / 2 / 4）                |
| `.trae/skills/oss-vis-gd-project-context/plans/.local-docs/docs模板-yzf/docs/specs/spec-split-guide.md` | 复杂模块拆分指南（阶段 2 适用）              |

---

## 10. 立即可启动的下一步（用户决策）

> 以下选择影响阶段 0/1/2 的执行范围，请确认：

| 选项 | 决策                                                                                                                          | 默认值                |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Q-1  | **阶段 0.A–0.F 是否一次性执行**？（推荐：是）                                                                                | 推荐：是              |
| Q-2  | **4 个核心模块优先级**？（推荐：emergency-support-dashboard P0，其余 P1；或全部 P0）                                          | 推荐：见 §3           |
| Q-3  | **O-1 是否启用 qiankun 微前端**？（推荐：否，独立部署 + iframe）                                                              | 推荐：否              |
| Q-4  | **O-2 是否引入按钮级鉴权**？（推荐：否，本项目为大屏可视化，无角色鉴权需求）                                                  | 推荐：否              |
| Q-5  | **O-7 信管局 4 子视图是否拆 spec**？（推荐：单 spec + 4 子章节）                                                              | 推荐：单 spec         |
| Q-6  | **是否生成 `docs/research/antd-5/` 替换模板 `antd-4.19.1/`**？（推荐：暂不，需时再补）                                          | 推荐：暂不            |
| Q-7  | **是否生成 `docs/research/fedx-ssr/`**？（推荐：是，作为可视化栈调研）                                                       | 推荐：是              |

> 全部使用「推荐」值 → AI 可直接执行阶段 0.A–0.F（6 个任务，估时约半天）
> 如有调整 → 给出选项编号即可，AI 重新生成 plan