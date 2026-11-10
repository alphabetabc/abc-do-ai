# Task · 2026-11-06-035-big-screen-ln-distill

> Epic：oss-mtc-transition-ln 大屏（`frontend/src/pages/visual/big-screen`）蒸馏为物料站四件套。新源项目（第 2 个），工作流沿用 distill-workflow（survey → 定档 → 立子卡蒸馏）。前序源项目：oss-visual-gd-emergency-support（epic 001，已归档）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-035-big-screen-ln-distill` |
| Status | 进行中（已批准，步骤 1 执行中） |
| 类型 | docs |
| 影响范围 | research/materials.db（新源项目入库）、后续 `docs/materials/components/**` 或 `docs/materials/business/**`（按定档）、本文件、current-sprint.md |
| Roadmap | 阶段 2~4（对第 2 源项目重跑；阶段 4 需在定档后才能确认范围） |
| 验收标准 | 本卡范围＝survey 入库 + 人工定档冻结（硬门槛①'）；蒸馏子卡另立（见步骤） |
| 前置依赖 | distill-workflow 工具链（033/034 已交付：survey / profile / sync-status / query） |

---

## 目标（Goal）

把 `oss-mtc-transition-ln/frontend/src/pages/visual/big-screen`（+ `frontend/src/components/large-screen`）作为**第 2 个源项目入口**跑完整蒸馏工作流：survey 扫描入库 → 四档人工定档 → 按定档立 B/C 子卡蒸馏。本卡为 epic 锚点 + survey/定档阶段的执行卡；逐模块蒸馏不在本卡内。

**优先级定位（2026-11-06 需求对齐拍板）**：本 epic 核心交付 = **大屏基建物料**（scaler-container / interaction-store / data-status / time-display / big-screen components 层的 background / header / fullscreen-button），让物料站 skill 能驱动出一个完整大屏；业务模块蒸馏服务于验证基建可组合性。图表/卡片类复用模块若与既有 rc-echarts 物料高度重合，定档时倾向 A 档（补 examples）而非重复蒸馏。

## 源码入口

两处（2026-11-06 勘察确认 + 用户确认）：

1. `oss-mtc-transition-ln/frontend/src/pages/visual/big-screen/`（4 大屏页面层）
   - 4 个大屏：`personnel/`（5 子模块）、`petition/`（8 子模块）、`beijing-petition/`（9 子模块）、`petition-comparison/`（6 子模块，含 presets.ts 模式）
   - 共享层：`components/`（background / header / fullscreen-button）、`shared/menu.ts`
   - 各大屏自带 `store.ts`（请求/状态层，蒸馏时剥离，不独立成物料）
2. `oss-mtc-transition-ln/frontend/src/components/large-screen/`（16 个共享组件层）
   - 基建：`interaction-store`（zustand 联动 runtime，用户拍板物料站直接引入 zustand）、`scaler-container`（设计稿等比缩放 + portal 全屏）
   - 渲染层：`data-status` / `time-display` / `info-card` / `ec-map`
   - 图表/卡片：`hor-bar-chart` / `ver-bar-chart` / `pie-chart` / `radar-chart` / `employment-bar-card` / `entitled-object-bar-card` / `regional-population-bar-card` / `retiree-pie-card` / `retiree-total-card`
   - 请求层：`use-polling`（轮询，首拉属 useRequest 职责；物料站零请求层定位，预期 D 档搁置）
- 映射口径：大屏名作 center；叶子目录作 module；嵌套中间层（beijing-summary、channel/components 等）记 section；`large-screen/` 各组件 center=`large-screen-components`
- ⚠️ `petition/` 与 `beijing-petition/` 7 个同名子模块，疑似多版本（C 档候选），以 survey 相似度聚类（≥0.8）+ 人工评审为准
- ⚠️ 技术栈差异：源项目为 React 19 + Ant Design 6 + ECharts 6 + @ant-design/plots，与物料站（React 18）版本兼容性需在 profile 阶段核对

## 功能列表

- F1：survey 适配与入库——**核心抽取 + 双入口薄壳**：survey.mjs 的采集→画像→相似度→四档归类→入库逻辑抽为 `survey-core.mjs`；原 survey.mjs 改为源 1 薄壳（命令行为不变，重跑幂等）；新建 `survey-big-screen.mjs` 薄壳（PROJECT / PAGES / 映射口径 / SHELVED 参数化，源 2 SHELVED 初始为空）；`PROJECT` 从 lib.mjs 硬编码改为入口传入。分析能力仍统一来自 profile-core（034 收敛约束不破）
- F2：人工定档（硬门槛①'）：A/B/C/D 四档逐项审定（聚类结论必须评审），写入 db distill_status；基建优先——interaction-store / scaler-container 等基建件入库后直接立卡，不排队尾
- F3：按定档结论立蒸馏子卡（B/C 档）；A/D 档直接在 db 落终态与 reason

## 不做清单

- 不改 `src/`（物料站站点代码）与源项目任何代码（只读勘察）
- 不在本卡内做逐模块蒸馏（子卡执行）
- 不搬运源项目真实接口地址/密钥；数据 mock 化规则不变
- docs/ 修改门禁（oss-mtc-transition-ln §10）不受影响：本卡只动 fedx-vis-ai-view 仓

---

## 步骤（执行计划）

### 步骤 1：survey 适配与全量入库
- **动作**：确认 survey.mjs 对 `pages/visual/big-screen` 目录形态的 center/section/module 映射（不重写分析能力，034 收敛约束）；跑全量 survey → research/materials.db（新 project 维度）
- **输出**：db module_survey 新增该源项目条目 + stdout 画像视图
- **等待用户**：否

### 步骤 2：定档评审（硬门槛①'）
- **动作**：基于 survey 四档预归类 + 相似度聚类，产出定档建议表，提交用户逐项审定（含 petition/beijing-petition 多版本是否合并、components 共享层是否独立物料、store.ts 处置）
- **输出**：db distill_status 定档冻结（queued/shelved 落库）
- **等待用户**：是

### 步骤 3：立子卡 + 移交
- **动作**：B/C 档逐项立蒸馏子卡（沿用 task 模板）；A/D 档落终态；本卡转 epic 进度锚点（沿用 001 模式）
- **输出**：current-sprint 子卡索引；本卡 Status → 进行中（epic 态）
- **等待用户**：是

---

## 验收 checklist

- [x] A1：survey 入库覆盖 big-screen 全部子目录，db project 维度区分两源项目（源1 40 行 + 源2 46 行，2026-11-06 步骤 1 执行记录）
- [x] A2：定档建议表可独立判定（每项含 tier + 理由 + 相似度证据），经用户审定冻结（46 行终态落库，queued 29 / shelved 17）
- [x] A3：B/C 档子卡全部建立并入 current-sprint 索引（4 张批次卡 040–043，覆盖 24 行 queued；#68/#69/#70 用户拍板 D 档搁置，2026-11-09）；A/D 档 db 终态 + reason 落库（步骤 2 已冻结 + 2026-11-09 增补）
- [ ] A4：本卡转 epic 锚点，范围边界（不做清单）与 001 一致

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | 用户（Q1–Q5 对齐 + epic 不关闭约定） |
| ①' 定档冻结（步骤 2 内） | 已批准 | 2026-11-06 | 用户（基建合并策略 / radar echarts 直线段 / ④ 组精读结论，三项逐项拍板） |
| ② 实现验收 | 待验收 |  |  |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡：用户指定第 2 源项目入口 `oss-mtc-transition-ln/frontend/src/pages/visual/big-screen`，细节待后续讨论；本卡先立骨架（survey/定档/立卡三步）。
- 需求对齐 · Q1（survey 适配方式）已定：**核心抽取 + 双入口薄壳**。把 survey.mjs 的采集→画像→相似度→四档归类→入库逻辑抽为 `survey-core.mjs`；原 `survey.mjs` 改为源 1 薄壳入口（命令行为不变，重跑结果幂等），新建 `survey-big-screen.mjs` 作为源 2 薄壳入口。`PROJECT` 从 lib.mjs 硬编码改为入口传入（db 区分两源项目，满足 A1）。薄壳参数收窄为：PROJECT / PAGES / center-section-module 映射 / SHELVED（源 2 初始为空）。分析能力仍统一来自 profile-core（034 约束不破）。
  - 勘察依据：`scripts/distill-core/survey.mjs#L10-L15` PAGES 硬编码源 1 四层目录形态；`lib.mjs#L28` PROJECT 写死 `oss-visual-gd-emergency-support`。
- 需求对齐 · Q2（范围 + 映射口径 + 基建优先）已定：
  - **源码入口扩为两处**：`frontend/src/pages/visual/big-screen`（4 大屏页面层）+ `frontend/src/components/large-screen`（16 个共享组件层，勘察确认含 interaction-store / scaler-container / ec-map / use-polling / data-status / time-display / info-card / 各 chart&card 共 16 目录）。
  - **映射口径**：4 大屏名（personnel / petition / beijing-petition / petition-comparison）作 center；叶子目录作 module；嵌套中间层（如 beijing-summary、channel/components）记 section；`large-screen/` 各组件作 module，center=`large-screen-components`。任务卡「源码入口」一节同步扩写。
  - **基建优先**：interaction-store、scaler-container 作为第一批蒸馏对象，survey 入库后直接立卡（不排队尾），作为后续业务模块蒸馏的承载底座。
  - **zustand 放行**：用户拍板物料站直接引入 zustand（届时由用户安装），interaction-store 蒸馏按直接依赖处理，不做内联改写。
- 需求对齐 · Q3（复用/多版本定档口径）已定：同名仅作线索，是否合并蒸馏（C 档）以 survey 相似度聚类（≥0.8）为证据 + **人工评审**逐项审定，差异走 Props/examples；personnel、petition-comparison 子模块按常规四档规则判，不预设。large-screen/ 的 chart/card 组件与大屏内图表的复用关系同样交给聚类呈现，定档时一并评审。
- 需求对齐 · Q4（大屏数 + store.ts 处置）已定：4 个大屏（personnel / petition / beijing-petition / petition-comparison，用户更正"3 个"口误）全部进 survey。各模块自带 `store.ts` 不作为独立蒸馏对象：蒸馏时请求/轮询层剥离、状态 Props 化（examples 提供 mock）；survey 采集计入模块文件画像但不单独立行。
- 需求对齐 · Q5（目标定位 + 基建清单收窄）已定：本 epic 核心交付 = 大屏基建（scaler-container / interaction-store / data-status / time-display + big-screen components 层 background / header / fullscreen-button），使物料站 skill 可驱动完整大屏；图表/卡片类与 rc-echarts 高度重合的倾向 A 档补 examples。**use-polling 不蒸馏**（勘察确认其为 ahooks useRequest 的轮询补充、20 行 setInterval 封装；物料站零请求层定位，蒸馏时统一剥离），入库但预期 D 档搁置。
- 正文已回填（目标定位 / 源码入口两处 / F1-F3 更新），提交硬门槛①审批。
- 用户确认：本卡**全程不关闭**，作为 epic 总卡留在 `plans/` 根（沿用 001 模式）：子卡索引挂在下方，子卡逐个归档 done/，本卡持续作为锚点跟踪基建交付进度，不随子卡清空而归档。

### 步骤 1 执行记录（2026-11-06）

- 核心抽取完成：新增 `scripts/distill-core/survey-core.mjs`（画像组装→聚类→四档归类→UPSERT 入库→stdout 视图，规则只搬迁不调整）；`survey.mjs` 改源 1 薄壳（project 常量内联，命令行为不变）；新建 `survey-big-screen.mjs` 源 2 薄壳；`lib.mjs` 删除 PROJECT 硬编码导出（grep 确认仅 survey.mjs 使用）。
- 源 2 采集口径（Q2 落地）：4 大屏 center；嵌套真子模块（自带 index.tsx，如 beijing-summary/overview-indicator）父目录记 section；`components` 命名子目录视为内部子组件（channel / map / ec-map 整体一个 module）；`big-screen/components`（background/header/fullscreen-button）center=`big-screen-components`；`large-screen/` 16 目录 center=`large-screen-components`；`shared/`、`assets/`、`images/` 跳过。beijing-summary 顶层 index.tsx 为编排层，不单独成 module（Q2 既定）。
- 验证：源 1 重跑幂等（40 行，档位分布 A23/D11/C1/B5 与历史一致）；源 2 全量入库 46 行（project=`oss-mtc-transition-ln-big-screen`）：personnel 5 + petition 8 + beijing-petition 8 + petition-comparison 6 + big-screen-components 3 + large-screen-components 16。档位分布 B28/A16/D2。
- 关键聚类证据：petition 与 beijing-petition 8 对同名子模块相似度全部 ≥0.98（其中 7 对=1.0，逐字节同构）→ C 档合并候选极强；petition-region-bar 与 regional-population-bar-card 相似度 0.69；petition-comparison/trend 与 petition-trend 0.51。
- 预归类与预期差异项（待步骤 2 人工评审）：use-polling 预归类 B（预期 D 搁置，Q5 拍板）；hor-bar-chart / info-card 预归类 D 低置信；所有基建件（scaler-container / interaction-store / data-status / time-display / background / header / fullscreen-button）预归类 B 低置信——基建优先立卡口径下大概率 B 档直接立卡。
- A1 勾选依据：db module_survey 两 project 维度并存（40 + 46 行），distill_status 全部初始化 not-started。

### 步骤 2 定档冻结记录（硬门槛①'，2026-11-06 用户批准）

- 精读批次：23 模块跑 `profile.mjs`（personnel 41-45、petition-comparison 62-67、large-screen 图表/卡片 72-76/78-82/86），画像入 `module_profile` 表；决策点经用户逐项拍板：
  - 基建 7 件 → **5 件 B 立卡新建 + 2 件合入既有物料**（data-status → 增强 ui-data-status 补 error 态 + loading 保占位；time-display → 增强 ui-time-display 补 dayjs 格式定制 + mode；用户选合入不并存，消除同类双物料歧义）
  - radar-chart → **B 立卡 + echarts radar 直线段重写**（echarts 官方文档核实：9/10 特性原生覆盖、indicator.max 比 plots 更优，唯 smooth 平滑曲线不支持，用户接受直线段；@ant-design/plots 零新依赖原则不引入）
  - ④ 组精读结论：personnel 4 件 0.3KB 占位编排 D 搁置；petition-comparison 6 件 + data-overview + retiree-total-card B；图表基建（hor-bar / ver-bar / pie / info-card / ec-map）B；4 件 bar/pie-card 组合 A 档下沉 examples
- **db 终态冻结**（project=`oss-mtc-transition-ln-big-screen`，46 行）：queued 29 + shelved 17，not-started=0；明细与 reason 全部落 `distill_status`（decided_by=user，2026-11-06）
- C 档合并口径：petition 侧 8 件立卡蒸馏，beijing-petition 侧 8 件 shelved 指向同物料（相似度 7 对=1.0、1 对=0.98）

### 步骤 3 子卡排队表（2026-11-06）

| 批次 | 子卡 / 对象 | 状态 |
| --- | --- | --- |
| 第 1 批 · 基建 | [task-036 interaction-store](./done/2026-11/task-2026-11-06-036-interaction-store-distill.md)（zustand 已安装 v5.1.0） | ✅ 完成并归档（2026-11-09 蒸馏 + 验收 + db #77 distilled） |
| 第 1 批 · 基建 | [task-037 scaler-container](./done/2026-11/task-2026-11-06-037-scaler-container-distill.md) | ✅ 完成并归档（2026-11-09 蒸馏 + 验收 + db #83 distilled） |
| 第 2 批 · 基建剩余 | [task-040 批次卡](./task-2026-11-09-040-ui-data-status-time-display-enhance.md)：增强 ui-data-status / ui-time-display（2 件）；background（#68）/ fullscreen-button（#69）/ header（#70）用户拍板 D 档搁置 | ✅ 已完成 → done/2026-11/（2026-11-09 硬门槛②通过；db #71/#84 落 distilled） |
| 第 2 批 · 图表基建 | [task-041 批次卡](./done/2026-11/task-2026-11-09-041-chart-basics-batch.md)：hor-bar / ver-bar / pie / radar（echarts 直线段）/ ec-map 并入 echarts-map + info-card 并入 ui-widget-shell（6 件） | ✅ 完成并归档（2026-11-10 硬门槛②通过；db #72/#75/#76/#78/#79/#86 落 distilled） |
| 第 2 批 · C 合并 | [task-042 批次卡](./task-2026-11-09-042-petition-c-merge-batch.md)：overview-indicator / channel-stat / map-overview（3 件）；identity-type / demands / region-bar / trend / region-map 2026-11-10 用户拍板 shelved（薄壳，缩量做精品）；beijing 侧 #54/#55/#58 仍指向 3 物料，#56/#57/#59/#60/#61 改指既有 echarts 物料 | 📋 已立卡，待审批（2026-11-10 缩量改卡） |
| 第 2 批 · 业务 | [task-043 批次卡](./task-2026-11-09-043-business-screens-batch.md)：personnel-data-overview / 比对 map / channel / retiree-total-card（4 件）；appeal / identity / rank / trend 2026-11-10 用户拍板 shelved（薄壳模板化，缩量做精品） | 📋 已立卡，待审批（2026-11-10 缩量改卡） |
| 不立卡（db 已终态） | A 档下沉 4 件组合卡片（基建+图表就绪后随对应子卡作 examples 消化）；D 档 8 件（use-polling + personnel 4 占位 + background / fullscreen-button / header，#68/#69/#70 2026-11-09 用户拍板搁置）；beijing-petition 8 件（shelved 指向） | — |

> 立卡策略：各批次开工前逐张立卡（沿用逐项模式），本表为唯一排队索引。

### 第 2 批子卡立项记录（2026-11-09）

- 建卡 4 张批次卡（040–043），覆盖 db 全部 `queued` 行（2 + 6 + 8 + 8 = 24 件）；background（#68）/ fullscreen-button（#69）/ header（#70）经用户 2026-11-09 拍板 D 档搁置（reason 落库：主背景纯图片无逻辑 / 全屏能力已有 scaler-container 覆盖 / header 与源项目强耦合）。每卡含逐模块清单表（模块 / db id / 源路径 / 产物路径 / 关键处理）与「本批通用约定」块。
- 用户三项拍板（写入每张卡的通用约定）：
  1. **产物分组三路分流**：基础 UI → `components/ui/ui-*`；echarts 图表 → `components/rc-echarts/echarts-*`；大屏业务 → `business/*`
  2. **允许 Props 化**：为可配置性新增 Props（配色 / 尺寸 / 位置 / 数据形态），**偏离 distill-workflow 不变式「不新增 Props」**，属用户批准的例外，新增项须逐条记入 spec.md
  3. **图片走站内占位图**：源站贴图一律不搬运，占位图统一落 `docs/materials/_assets/` 共享目录
- 实施中发现并已在卡内记录的关键依赖差异：
  - `@ant-design/icons`（041）、`@ant-design/plots`（048）、`dayjs`（044）物料站均未安装 → 分别走内联 SVG / echarts radar 直线段重写 / Intl 零依赖实现
  - `axios` + `ahooks` + `use-polling` 请求层（050 等）按「物料站零请求层定位」剥离，数据 mock 化
  - `react-router-dom`（042）→ 导航状态 Props 化
  - 041 与 042 分属不同物料 → 组合关系走 examples / slot 注入，不跨物料 import
- 058（petition/region-map）仅 11 行 re-export，卡内建议**不单独出物料**，作为 056 的别名用法；若实现期确认有独立语义需回用户确认。

---

## 关联

> - 工作流权威：../../references/distill-workflow.md
> - 前序 epic（工作流与工具链来源）：./task-2026-11-03-001-master-component-distill.md
> - 工具链：../../scripts/distill-core/（survey / profile / sync-status / query）
> - 源项目治理（只读约束侧）：oss-mtc-transition-ln 根 AGENTS.md（§3 前端目录约定、§10 文档修改门禁）
