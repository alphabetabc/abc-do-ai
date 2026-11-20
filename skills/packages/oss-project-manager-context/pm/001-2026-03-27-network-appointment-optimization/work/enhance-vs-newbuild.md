# enhance-vs-newbuild.md · 「增强 vs 新建」判定表

> 子任务 `task-2026-11-19-002-03-enhance-vs-newbuild-verdict` 产出。
> 输入：`work/scope-classification.md`（79 条前端可承接 + 4 条跨系统联调）。
> 真源基线：`design/architecture.md`、`design/modules/001~008/overview.md`、`references/reusable-capabilities.md`、`references/api-catalog.md`（task-001 真源）。

---

## 0. 整体结论

**新建为主（新页面族），复用既有能力，少量增强**。

| 结论 | 范围 | 依据 |
| --- | --- | --- |
| **新建** | S2 网络割接单管理页面族（79 条前端可承接的绝大多数） | 割接工单是全新业务域：全仓 grep「割接/NCDP」仅命中既有列字段「是否割接网元」（`src/pages/new-project/common/column.js` L122/L318），无割接工单领域代码；既有 8 模块均服务「工程预约」域，无工单/审批六级/NCDP 环节概念。路由表（`design/architecture.md` 路由真源，15 条）亦无对应路由 |
| **复用（新建内部）** | 导入导出、网元表格/搜索、审批配置、VirtualTable、区域级联、定时器、hox 状态 | `references/reusable-capabilities.md` 已确认各项能力与路径 |
| **增强** | App.js 免密跳转通道（4 条跨系统联调） | `src/App.js` L40~L145 既有 hash token → bss/api/v1/user → zones/roles 链路，方向变化但规范同源（002-02 D1 裁决） |

**新建落点**：建议新模块 `src/pages/cutover-order/`（网络割接单管理），路由 `/cutover-order`，后续 002-04 详化页面/组件拆分；如需开模块设计卡则新增 `design/modules/009-cutover-order/overview.md`。

---

## 1. 判定表（按 002-02 分组）

工作量分档口径：S=局部改动/单组件；M=多组件页面级；L=页面族/跨页面。

### 1.1 新建页面族（新建 + 复用既有能力）

| 条目组（002-02 口径） | 判定 | 落点 | 理由（真源引用） | 分档 |
| --- | --- | --- | --- | --- |
| REQ-F-001~003（模板下载/导入/批量导入） | **新建**（复用导入导出流程） | `cutover-order/` 新建工单页 + 复用 `new-project/upload/index.jsx` 全流程模式（下载模板→上传→错误 Excel→confirmImport→revoke，reusable-capabilities「网元导入导出」） | 既有 upload 是工程预约网元导入，工单模板为新契约；接口走后端新增端点 | M |
| REQ-F-004~006（基本信息/业务影响/工程信息确认） | **新建** | `cutover-order/` 新建工单表单（45+ 字段，requirement-items §5） | 既有专题表单（new-project/subjects）字段域完全不同（工程预约 vs 割接工单，含 NCDP 工单号等新字段）；无既有表单可增强 | L |
| REQ-F-007~017（网元查询/导出/添加/周期/级联/导入/清空 11 条） | **新建**（强复用既有网元能力） | `cutover-order/` 网元表格 + 搜索弹窗；复用 `search-gcss/search-fgss` 网元搜索模式、`model/extractFun.js` 转换（neInfoConverter/listCycleDispose 周期/级联）、`pages/common/export.js` 前端导出 | reusable-capabilities「网元选择/搜索」「数据转换」；字段 14 个为割接域新契约（含是否割接网元、是否物联网专网网元） | L |
| REQ-F-018~029（会审人员 + 一~六级审批 12 条） | **新建**（参照既有审批模式） | `cutover-order/` 审批配置区；参照 `new-project/control/project-audit/` 交互模式，但审批为六级动态 + 自动推荐，超出既有两套审批组件能力 | modules/003「审批 project-audit / project-auditgb 两套」为工程预约审批，无六级/自动推荐概念 | L |
| REQ-F-030~037（方案模板 CRUD/引用 8 条） | **新建** | `cutover-order/` 方案模板管理 | 全仓无方案模板库概念（api-catalog.md 无对应端点） | M |
| REQ-F-038~041（附件/拓扑/三张表上传下载） | **新建**（需封装上传组件） | 基于 oss-ui Upload 封装业务上传组件 | reusable-capabilities 明确「本仓不存在通用文件上传组件」；拓扑图支持模板库为新增 | M |
| REQ-F-042/043（检测结果确认 / 取消工单） | **新建** | 确认弹窗 + 列表行操作 | 交互小但依赖新页面族上下文 | S |
| REQ-F-044~054（修改类 11 条） | **新建**（复用新建表单编辑态） | 新建工单表单复用为编辑态，按 S6 约束（行 518 环节状态校验）控制可编辑性 | 与 004~041 同页面复用（002-02 已注） | （并入表单 L，不另计） |
| REQ-F-055~058（列表查询/导出 4 条） | **新建**（复用 VirtualTable + 导出） | `cutover-order/` 工单列表页（D2 裁决：能力在本仓完成，落点为新模块列表页，不增强 home-page/new-project 列表） | home-page 为工程预约总览、new-project 为建项列表，业务域不同；VirtualTable 与多条件查询模式可直接复用（modules/001/003） | M |
| REQ-F-059~065（详情查看 7 条） | **新建** | `cutover-order/` 详情页（7 大块分区展示，061 含专业工作台特有字段） | 全仓无工单详情页；展示组件（Descriptions/表格）用 oss-ui 既有 | M |
| REQ-F-066/067（NCDP 11 环节 + 省内 6 环节打点） | **新建** | `cutover-order/` 进度打点组件 | 全仓无进度打点组件；数据依赖 S5 状态同步（NCDP，联调风险） | M |
| REQ-F-068/072~074/076/078/082~084/088~090（结果查看 11 条） | **新建** | `cutover-order/` 检测/稽核/冲突/影响分析结果展示（弹窗或详情分区） | 展示层新建；检测计算在后端（002-02 §1.2） | M |

### 1.2 增强（既有代码改造）

| 条目 | 判定 | 落点 | 理由 | 分档 |
| --- | --- | --- | --- | --- |
| S1 免密跳转 + REQ-API-023~025 + S1 token 接口（4 条跨系统联调） | **增强** | `src/App.js` L40~L145 免密通道（hash 解析 access_token → tokenUrl → zones/roles） | 既有实现完整且规范同源（002-02 D1 裁决：本仓此前即嵌入外部系统，方向变化但免密规范一致）；改动为支持新 appKey/新调起方参数 | S~M |

### 1.3 不做判定（002-02 已排除）

纯后端 34 条（F-069~087 检测引擎 + API-001~022/026）不进本表；本仓不做 0 条。

---

## 2. 分档汇总

| 分档 | 条目组数 | 说明 |
| --- | --- | --- |
| S | 2 组（F-042/043；App.js 免密增强） | 弹窗/行操作/通道参数扩展 |
| M | 7 组 | 模板导入、方案模板、附件上传、列表、详情、打点、结果查看 |
| L | 3 组（核心） | 新建工单表单族（含修改态复用）、网元信息区、审批路径配置 |

> L 级三组构成新建工单页主体；M 级可并行；整体为**一个新模块 `cutover-order`** 的页面族建设，非多个模块。

## 3. 判定依据的读码核查记录

- 「割接/NCDP」全仓 grep：仅 `new-project/common/column.js` L122/L318、`quick-project/common/column.js` 及各专题 edit 表单的「是否割接网元」字段命中 —— 无割接工单领域代码 ✓
- 路由真源 15 条无割接相关路由（`design/architecture.md`）✓
- App.js 免密链路存在（002-02 D1 裁决附 L40~L145 实据）✓

## 4. 风险（供 002-04 汇总）

| # | 风险 | 关联 |
| --- | --- | --- |
| R1 | 79 条中绝大多数依赖后端新增端点（本仓 api-catalog 无割接域端点），后端就绪度是前置 | 父卡开放问题 2 |
| R2 | F-066 NCDP 打点依赖 S5 状态同步链路（NCDP 侧），联调排期风险 | 同上 |
| R3 | operation_type 字典「待补充」（P1），表单/列表/接口契约阻塞 | 父卡开放问题 3 |
| R4 | App.js 免密增强涉及 qiankun 主应用链路，需回归既有登录态（userInfoMap 写入） | 1.2 节 |
| R5 | 需求 V4.1 是否终版（父卡开放问题 1），字段契约（60 字段接口、45 字段表单）可能变更 | 全局 |

## 5. 结论

- **增强 vs 新建的答案：新建为主**——新模块 `cutover-order` 承接 79 条前端可承接条目中的绝大多数（页面族），内部大量复用 task-001 真源登记的既有能力；唯一增强点为 App.js 免密通道（S~M）。
- 002-04 据此输出最终技术分析文档，并新增 `design/modules/009-cutover-order/overview.md` 模块设计骨架。
