# technical-analysis.md · 网络操作预约模块优化提升需求 V4.1 前端技术分析

> ✅ **已按 develop-fujian 复核（2026-11-20，task-004）**：本文档原以 develop 为基线完成，核心判定（新建 cutover-order + 复用）在 fujian 上**成立**；读码细节已按 fujian 修订（路由数 18、column.js 行号、复用文件形态漂移标注），fujian 真源见 `branches/fujian/`（自包含域，task-005 重建）。

> ⚠️ **S1 方向更正（2026-11-20，用户确认）**：S1 统一入口是**本系统页面增加外部系统跳转按钮 → 新页签跳出到各专业工作台**（appKey + thirdToken 拼接），不是被嵌入；原「App.js L40~L145 免密通道增强」结论**作废**（那是反向的「别人嵌我们」链路）。S1 前端落点更正为：页面入口按钮（跳转链接配置 + token 拼接 + 新页签打开），App.js 通道仅可参考其 token 换用户信息的验证模式（接口由后端提供，前端不实现）。本文 §1/§2/§3/§6 中涉及 S1 的表述已同步修订。

> 父任务：`plans/task-2026-11-19-002-network-appointment-optimization-tech-analysis.md`
> 子任务：002-01（条目拆解）→ 002-02（归属分类）→ 002-03（增强vs新建判定）→ 002-04（本文档）
> 中间产物：`work/requirement-items.md`、`work/scope-classification.md`、`work/enhance-vs-newbuild.md`
> 真源基线：`branches/develop/design/architecture.md`、`branches/develop/design/modules/001~008/overview.md`、`branches/develop/references/`（task-001 沉淀，2026-11-19）
> 需求输入：`inputs/network-appointment-optimization-requirement-v4.1.md`（V4.1，2026-07-02，江泽能，4038 行）

---

## 1. 结论摘要

**整体结论：新建为主（新模块）+ 复用既有能力 + 一处增强。**

回答用户原始问题「我们是增强还是需要重新做」：

1. **需要新建**：网络割接单管理是一套全新业务域页面族（79 条前端可承接条目），既有模块均为「工程预约」域，无割接工单概念（fujian 复核 2026-11-20：全仓 grep「割接/NCDP」仅命中既有列字段「是否割接网元」，`src/pages/new-project/common/column.js` L130；develop-fujian 路由真源 18 条无对应路由）。建议新模块 **`src/pages/cutover-order/`**，路由 `/cutover-order`（模块设计骨架见 `branches/develop/design/modules/009-cutover-order/overview.md`）。
2. **不是从零重做**：新模块内部大量复用 task-001 真源登记的既有能力（网元搜索/导入导出/审批交互模式/VirtualTable/区域级联/hox），无需重造轮子。
3. **唯一增强点（已更正，见顶部警示）**：S1 统一入口 = 页面（建议首页）增加外部系统跳转按钮 → 拼接 appKey + thirdToken → 新页签打开各专业工作台链接；「获取用户信息」token 校验接口由后端提供（前端不实现）。S~M 档。

**范围切分**（116 条 = 90 页面功能点 + 26 接口功能点，002-01 口径）：

| 分类 | 条数 | 说明 |
| --- | --- | --- |
| 前端可承接 | 79 | 全部落新建模块 cutover-order（详见 §3 映射表） |
| 纯后端 | 34 | 检测/稽核/冲突/影响分析引擎（F-069~087 11 条）+ 服务端对接接口（API-001~022、026 共 23 条） |
| 跨系统联调 | 4 | S1 免密跳转 + API-023~025，落点 App.js 免密通道（增强） |
| 本仓不做 | 0 | D1~D3 已裁决（2026-11-19 用户确认） |

---

## 2. 需求条目映射表（摘要）

完整逐条表见 `work/scope-classification.md`（分类）与 `work/enhance-vs-newbuild.md`（判定），此处汇总映射：

| 需求范围（V4.1 行号） | 条目 | 归属 | 前端落点 | 判定 | 分档 |
| --- | --- | --- | --- | --- | --- |
| S1 统一入口免密跳转（78-146）+ API-023~025 | 4 | 跨系统联调 | 页面入口按钮（跳转链接配置 + appKey/thirdToken 拼接 + 新页签；具体落页待原型确认，建议首页） | **增强**（已更正：非 App.js 通道，见顶部警示） | S~M |
| S2 新建工单-模板下载/导入（F-001~003） | 3 | 前端 | cutover-order + 复用 upload 流程模式 | 新建 | M |
| S2 新建工单-基本信息/业务影响/工程确认（F-004~006） | 3 | 前端 | cutover-order 表单族 | 新建 | L |
| S2 网元信息区（F-007~017） | 11 | 前端 | cutover-order + 复用网元搜索/extractFun | 新建 | L |
| S2 会审+六级审批（F-018~029） | 12 | 前端 | cutover-order（参照 project-audit 模式） | 新建 | L |
| S2 方案模板（F-030~037） | 8 | 前端 | cutover-order | 新建 | M |
| S2 附件/拓扑/三张表（F-038~041） | 4 | 前端 | cutover-order + oss-ui Upload 封装 | 新建 | M |
| S2 检测确认/取消（F-042/043） | 2 | 前端 | cutover-order | 新建 | S |
| S2 修改工单（F-044~054） | 11 | 前端 | 新建表单复用编辑态（S6 环节状态校验控制可编辑性） | 新建（并入表单） | — |
| S2 列表查询/导出（F-055~058，D2 裁决落本仓） | 4 | 前端 | cutover-order 列表页（VirtualTable） | 新建 | M |
| S2 详情呈现（F-059~068） | 10 | 前端 | cutover-order 详情页（7 大块 + 打点组件） | 新建 | M |
| S4 检测引擎（F-069~087） | 11+11 | 纯后端（计算）/ 前端（结果查看 F-072~090 中 11 条） | 结果展示在 cutover-order | 新建（展示层） | M |
| S3/S5/S6 接口（API-001~022、026） | 23 | 纯后端 | 无 | — | — |

合计：116 条全覆盖，无「待确认」占位结论（D1~D3 已裁决，见 `work/scope-classification.md` §4）。

---

## 3. 判定依据（要点）

1. **领域隔离**：割接工单（NCDP 工单号、六级审批、11/6 环节打点、三张表、方案模板）与工程预约域（new-project/home-page）字段域与流程模型完全不同，在既有模块上塞入新域会加剧 new-project index.jsx（fujian 上已达 2735 行，quick-project 1879 行，复制分叉加剧）的腐化——modules/003 维护要点已警示该文件与 quick-project 复制分叉问题。
2. **读码核查**（002-03 §3；fujian 复核 2026-11-20 成立）：全仓 grep「割接/NCDP」无领域代码命中；develop-fujian 路由真源 18 条无割接路由。
3. **D1 裁决（已更正，见顶部警示）**：S1 是本系统作为入口方**跳出**到各专业工作台（V4.1 §3.2.2.1 行 101~105：工作台提供跳转链接接收我方 ID/token；UC-008 步骤「从故障管理中心正常跳转到专业工作台」），前端只需页面入口按钮 + 链接拼接，工作量小 → 增强（页面级）而非新建模块。原「App.js 免密通道（别人嵌我们）复用」的论证作废；该通道仅可作为 token 换用户信息验证模式的参考（接口由后端对外提供）。

---

## 4. 前端技术方案要点

### 4.1 新模块 `src/pages/cutover-order/`（建议结构，002-04 提出、实施任务细化）

```text
src/pages/cutover-order/          （用户指定：本模块一律 TypeScript，.tsx/.ts）
  index.tsx              工单列表页（VirtualTable + 多条件查询 + 导出）
  order-create/          新建/编辑工单（表单族：基本信息/业务影响/网元区/审批配置/方案/附件）
  order-detail/          详情页（7 大块分区 + NCDP 11 环节/省内 6 环节打点）
  control/               弹窗族（模板导入、网元搜索、审批人推荐、检测结果确认、取消确认、检测/稽核/冲突/影响结果展示）
  model/                 校验与数据转换（复用 new-project/model 模式，注意勿复制分叉）
  service/api.ts         割接域接口层（后端新增端点，见 4.3）
  upload/                模板/网元/三张表导入导出（参照 new-project/upload 流程）
```

- 路由：`/cutover-order`（+ 详情/新建子路由），登记入 `src/routes/index.js`；qiankun 内嵌经 MemoryRouter，无额外适配。
- 状态：新代码按 architecture.md 关键决策——hox 或组件内 state，不引 redux。
- 样式与 UI：oss-ui 组件 + less，PageContainer 页头。

### 4.2 复用点（真源引用 `branches/develop/references/reusable-capabilities.md`；fujian 复核状态见右列，2026-11-20）

| 能力 | 复用来源 | fujian 复核 |
| --- | --- | --- |
| 网元搜索（含板卡/端口/ONU 层级） | `new-project-gcss/search-gcss`、`new-project-fgss/search-fgss` | 存在且未变更，成立 |
| 网元数据转换（周期/级联） | `new-project/model/extractFun.js`（neInfoConverter/neInfoLKConverter/listCycleDispose） | ⚠️ 漂移：文件大改（±398 行新增周期计算函数族），复用前须在 fujian 上重读 |
| 导入导出全流程 | `new-project/upload/index.jsx`（下载模板→上传→错误 Excel→confirmImport→revoke） | 小改（±35 行 + 新增 gcss-continuous-time），基本成立 |
| 前端 Excel 导出 | `pages/common/export.js`（大数据量走后端导出端点） | 未变更，成立 |
| 审批交互模式 | `new-project/control/project-audit/`（六级动态扩展为新建） | 未变更，成立 |
| 列表 | VirtualTable 用法参照 `new-project/index.jsx` | ⚠️ 漂移：参照文件大改（现 2735 行），参照点须重读 |
| ~~免密跳转~~（S1 已更正为页面入口按钮，不复用 App.js 通道；仅参考其 token 验证模式，接口由后端提供） | `src/App.js` L40~L145 | 未变更（不再作为 S1 落点） |

### 4.3 接口契约需求（前端视角，待后端提供）

- 工单 CRUD / 列表 / 详情端点（割接域，本仓 api-catalog 无对应端点，需后端新增）
- 方案模板、附件存储、三张表、检测结果/稽核/冲突/影响分析结果查询端点
- 审批推荐（会审/审批人自动推荐）端点
- 字段契约基线：新建/编辑接口约 60 字段（V4.1 行 526-671）、检测结果 8 字段（行 900-909）、状态同步 8 字段（行 923-932）、跨专业推送（行 946-1010）
- **operation_type 字典待需求方补充**（P1，行 548 等 5 处「待补充」）

---

## 5. 工作量分档汇总

| 分档 | 组数 | 内容 |
| --- | --- | --- |
| L | 3 | 工单表单族（F-004~006/044~054）、网元信息区（F-007~017）、六级审批配置（F-018~029） |
| M | 7 | 模板导入、方案模板、附件上传、列表页、详情页、环节打点、检测结果查看 |
| S | 2 | 检测确认/取消弹窗、App.js 免密增强（S~M） |

> 只给分档不做日历排期（父卡不做清单）。L 级三组构成新建工单页主体，M 级可并行。

## 6. 风险与依赖

| # | 风险 | 缓解/前置 |
| --- | --- | --- |
| R1 | 79 条前端条目依赖后端新增端点，api-catalog 无割接域端点，后端就绪度是排期前置 | 推动后端先出接口契约（§4.3） |
| R2 | F-066 NCDP 打点依赖 S5 状态同步链路（NCDP 侧） | 联调排期前置确认 |
| R3 | operation_type 字典「待补充」（P1） | 需求方补齐后再定表单/列表契约 |
| R4 | S1 页面入口按钮的 thirdToken 获取方式未定（当前登录态 token 直传 or 换发），且跳转链接由各工作台联调时提供 | 联调前置确认 token 来源与链接清单；入口落页（建议首页）待原型确认 |
| R5 | V4.1 是否终版（父卡开放问题 1），60 字段接口契约可能变更 | 以后端契约为准冻结字段 |
| R6 | 新模块勿复制 new-project 的分叉模式（index.jsx 与 quick-project 复制分叉教训） | 公共逻辑抽 model/ 复用而非复制 |

## 7. 不做清单（本仓前端范围外）

- S3/S5/S6 服务端对接接口 23 条（API-001~022、026）：后端实现
- 检测/稽核/冲突/影响分析计算引擎（F-069~087）：后端规则引擎，前端只做触发与结果展示
- NCDP 登录页集成到故障管理中心：NCDP 侧
- Oracle 19c、后端表设计：不在本仓
- PRD / 原型 / 接口详设：本文档只做前端落地判定

## 8. 开放问题（继承父卡 + 本分析新增）

| # | 问题 | 负责方 | 状态 |
| --- | ---- | ------ | ---- |
| 2 | 后端割接域端点与 NCDP/全网调度侧就绪度 | 后端/集成 | 开放 |
| 3 | operation_type 字典 | 需求方 | 开放 |
| 4 | ~~独立路由与菜单归属~~ 已裁决（D3）：页面在本仓实现 | — | 已关闭 |
| 5 | 无线/动环专题模板归属 | 前端 | 开放（不影响 cutover-order 主体判定） |
| 6 | （新增）行 3990 提及核心网工作台调用 3 个查询接口未立项（P2） | 需求方 | 开放 |
| 7 | （新增）原型说明 EMF 附件未解析（P3） | 需求方 | 开放 |
| 8 | （已裁决 2026-11-20，用户确认）需求 S2「首页工单列表界面」：**在现有首页（home-page-list）上改造**，不新建独立列表页。具体改动位置（查询区/列头/操作列如何融合割接要素）待原型提取后细化 | — | 已关闭（改造 home-page-list） |
| 9 | （已裁决 2026-11-20，用户确认）需求 S2「无线接入网、动环新建工单改造」：**改造现有 `/new-project` 建项页**，非新建 cutover-order/order-create/。⚠️ 与本分析原判定相反：该页字段域与割接新建工单（45+ 字段）无交集，且 index.jsx 已 2735 行与 quick-project 复制分叉（modules/003 维护警示）→ 落地时须重估工作量与腐化风险（R6 升级），改造策略（并入现页 vs 条件分支 vs 拆分重构）须在实施任务技术设计阶段专项评估 | — | 已关闭（改造 /new-project；原「新建」判定作废，风险升级待评估） |
| 10 | （已裁决 2026-11-20，用户确认）需求 S2「网络割接工单详情查看」：**改造现有 demo「查看工程」路由（独立页面）**，非新建 cutover-order/order-detail/，也非弹窗形态。子路由设计按「查看工程」路由改造展开 | — | 已关闭（改造「查看工程」路由） |
| 11 | （已裁决 2026-11-20，用户确认）需求 S2「网络割接工单检测结果查看」：**弹窗**形态（cutover-order/control/ 检测结果展示弹窗族思路保留，落点按 #9/#10 改造结论归位到对应改造页面） | — | 已关闭（弹窗） |

---

## 9. 后续动作建议

1. 用户评审本文档（父任务硬门槛②）
2. 通过后立编码实施任务（建议按 L 级三组 + M 级并行拆子任务），模块设计按 `branches/develop/design/modules/009-cutover-order/overview.md` 骨架细化
3. 推动后端接口契约（§4.3）与开放问题 1/3 关闭

