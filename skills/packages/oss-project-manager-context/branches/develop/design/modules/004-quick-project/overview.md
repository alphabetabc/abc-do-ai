# 004-quick-project

安徽快速预约页。src/pages/quick-project。是 new-project 的复制裁剪版（见 oss-project-manager-context/design/modules/003-new-project/overview.md）。

## 功能

- 与 new-project 相同骨架：多条件查询 + VirtualTable 列表、选模板新建、编辑、重新预约、影响分析、审批（project-auditgb）、高级信息、导入导出、模板下载。
- 裁剪点：
  - subjects 只保留 new-project-general（通用模板），无大范围/IP/SPC/端口/链路/细粒度/集客/家客/快速九个专题。
  - 列配置只用 columnTemp（无安徽 columnTempAH 分支）。
  - 无超时提醒/短信提醒（project-remind、send-message-remind）。
  - 少量 environment 开关（isDisruptProject、longTimeRemind、productVersion 相关）未引入。

## 结构

与 new-project 目录一一对应：index.jsx、common/column.js、control/（choose、edit、impact、audit、auditgb、info-demo、make-appoint-time、order、project-upload、show-new-project）、subjects/、model/（checkFun、extractFun、jfmConf、projectInfo）、service/api.js + apiSqlm.js、upload/。

## 维护要点

- 与 new-project 为复制分叉，通用逻辑修复需双改；改动前先 diff 两边同名文件。
- handleOk 无 maxNeInfoNum 上限校验、无 continuousTimeData 参数——与 new-project 的同名方法已分叉，勿盲目同步。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/quick-project、/quick-project/show-new-project（src/routes/index.js）。
- **组件树**：与 new-project 同构但裁剪：subjects/ 仅 new-project-general 一个专题（内部含 quick-list、listmult 等变体）；control/ 同款（project-audit、project-auditgb、project-info-demo、make-appoint-time、new-project-choose/edit/order/impact、project-upload、show-new-project 等）；upload/（含 downloadModel/）；model/ 与 common/column.js 同名复制；service/ api.js + apiSqlm.js。
- **状态管理**：无全局状态，组件内 state。
- **接口清单**：service/api.js（见 references/api-catalog.md quick-project 节；存在 quick/arProStatusImp/* 前缀变体端点）+ service/apiSqlm.js（与 new-project 同文件复制）。
- **可复用点**：直接复用 new-project 全部能力；本页新增的快速预约专属分支勿反哺 new-project。
- **已知坑**：与 new-project 复制分叉，双改纪律见「维护要点」。


