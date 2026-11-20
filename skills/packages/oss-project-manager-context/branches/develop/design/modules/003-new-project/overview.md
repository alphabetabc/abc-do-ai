# 003-new-project

工程预约新建/管理核心页。src/pages/new-project。主入口 index.jsx 超 64KB（约 1200+ 行单类组件），改动需分段读。

## 功能

- 顶部多条件查询（时间、工程名、专业、类型、状态、地区等）+ VirtualTable 工程列表。
- 新建工程预约：先弹 new-project-choose 选模板（通用 GeneralTemplate + 十个专题），再进 subjects 对应专题表单。
- 专题模板：大范围 Dafan、IP、SPC、端口 PortAppoint、链路 Link、细粒度 FineGrainedAppoint、集客 GCSS、家客 FGSS、快速 QuickTemplate。
- 列表行操作：编辑（edit）、重新预约时间（makeAppoint）、影响分析（new-project-impact）、审批（project-audit / project-auditgb 两套）、高级信息（project-info-demo）、人员（project-staff-demo）、网元导入导出（upload / project-upload）、模板下载（downloadModel）。
- 提醒：超时提醒弹窗（project-remind）+ 短信提醒（send-message-remind）。
- 干扰预约：工程类型 id=30，受 isDisruptProject 配置控制显隐。

## 结构

```text
index.jsx                 主容器（巨型类组件，约 1200+ 行）
common/column.js          列配置：columnTemp 通用 / columnTempAH 安徽
control/                  弹窗族：choose、edit、impact、audit、auditgb、
                         info-demo、make-appoint-time、order、project-upload、
                         project-remind、send-message-remind、show-new-project
subjects/                 十个专题表单组件（general/dafan/ip/spc/port/link/
                         finegrained/gcss/fgss/quick），由 subjects/index.jsx 按
                         subject.id 分发
model/                    checkFun 校验、extractFun 数据转换（neInfoConverter、
                         neInfoLKConverter、listCycleDispose）、jfmConf、projectInfo
service/api.js            接口层（约 40 个方法）
service/apiSqlm.js        loadJSON 等 SQLM 数据加载
upload/                   导入/下载模板
```

## 关键实现

- 状态：类组件 + hox withModel；大量行为开关读 environment 配置（checkDuplicateConfig、isSpecifyTimeConfig、isMakeAppPointEditConfig、isDisruptProjectConfig、longTimeMemoConfig、eomsIdConfig、productVersion 等），省分个性化：isHLJDisabled（黑龙江 EOMS 锁定）、isAHEoms（安徽外部调起新建）、isFJnetworkTypeTopDisabled（福建）、specificProvince.isAH 切换列配置。
- 工程类型分类走 projectTypeClassValue 的 A/B/C/D/disturbed/maint 分支。
- 网元数据流：专题表单选网元 → extractFun 转换（周期 listCycleDispose / 链路 neInfoLKConverter / 普通 neInfoConverter）→ maxNeInfoNum 上限校验 → netSelComplete 回调 → arProStatusImp 临时表/正式表接口落库。
- 链路相关接口受版本开关 dateLk（type=23）控制，与 home-page 的 api.js 同一机制。

## 接口域（service/api.js，baseUrlType=exportUrl）

- appointment/*：createProject、updateProject、updateArProInfo、senior/insetProjectInfo、getUserInfo、options、downloadExcelModel、importProInfo。
- project/approval、project/approval/judge：审批。
- arProStatusImp/*：网元/链路临时表、正式表、TCC 变体、checkDuplicate 查重。
- netWork/*：模板下载、导入、confirmImport、revoke。

## 维护要点

- index.jsx 与 quick-project/index.jsx 结构同源（复制分叉），改通用逻辑需评估是否双改。
- subjects/index.jsx 中 GeneralMode 用 `{true && ...}` 常驻挂载，其余按 visible 卸载，性能不一致。
- api.js 中 deleteTmpArProStatusImp 重复定义（第 348/362 行附近），后者覆盖前者。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/new-project、/new-project/show-new-project、/new-project/control/project-info-demo（src/routes/index.js）。
- **组件树**：src/pages/new-project（100+ 文件）：
- index.jsx — 入口（路由 /new-project）
- subjects/ — 13 个专题，结构高度一致：index.jsx（专题入口/表单）+ 
ew-project-X-list/（网元表，含 edit/）+ 
ew-project-X-time/（时间段选择，多含 X-continuous-time/ 连续时段子组件）+ 
ew-project-X-impact/（影响分析）；部分专题另有 search-X/（网元搜索）与 
ew-project-X-resources/（资源表）：
  - new-project-general（通用，含 listmult 多选与 quick-list 变体）、new-project-dafan（达泛）、new-project-fgss、new-project-gcss、new-project-finegrained（精细）、new-project-ip、new-project-link、new-project-port、new-project-spc、new-project-quick
- control/ — 弹窗集合：new-project-choose（专题选择）、new-project-edit（编辑）、new-project-order（重预约）、new-project-impact（影响分析）、make-appoint-time（预约时间）、project-audit / project-auditgb（两套审批，各含 project-staff-demo）、project-info-demo（详情，路由直达）、project-remind、project-upload、send-message-remind、show-new-project（只读展示，路由 /new-project/show-new-project）
- upload/ — 网元导入导出流程页（downloadModel/ 模板下载子组件）
- model/ — checkFun.js（校验）、extractFun.js（数据转换）、projectInfo.js、jfmConf.js
- common/column.js — 表格列定义
- service/ — api.js（request 通道）、apiSqlm.js（dataService 通道）
- **状态管理**：无全局状态，组件内 state；用户信息经 hox useLoginInfoModel。
- **接口清单**：见本文件「接口域」节 + references/api-catalog.md new-project 节（约 35 端点 + sqlm sqlId 10 个）。
- **可复用点**：search-gcss/search-fgss（网元选择器）、upload 流程（下载模板→上传→错误 Excel→confirmImport→revoke）、model/checkFun、model/extractFun、审批 control/project-audit。
- **已知坑**：deleteTmpArProStatusImp 重复定义（L348/L362）；与 quick-project 复制分叉需双改；sqlm 用 dataService+configs.js，非 sqlm 用 request+baseUrlType=exportUrl，两通道并存。


