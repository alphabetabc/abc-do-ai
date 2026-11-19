# performance-query-batch

> 编号 008 · 源码 src/pages/performance-query-batch · 批量查询：多指标组Tab与网元导入

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册：exact: true，path: '/performance-query-batch'，component: 'performance-query-batch'。无带参路由。edit/ 目录不是独立路由，作为弹窗组件被 query-view 引用（query-view/index.jsx 第 16 行 import EditComp from '../edit'）。

## 模块文件树

```text
performance-query-batch/
├── edit/
│   ├── upload/
│   │   ├── index.jsx
│   │   └── index.module.less
│   ├── api.js
│   └── index.jsx
├── his-view/
│   ├── index.jsx
│   └── index.less
├── query-view/
│   ├── select-ind-value/
│   │   └── index.jsx
│   ├── select-ne-value/
│   │   └── index.jsx
│   ├── select-schema-value/
│   │   └── index.jsx
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── index.less
```

## 入口与结构
入口 src/pages/performance-query-batch/index.jsx（140 行，class 组件）：查询参数 state、按指标组生成多 Tab（Tabs + changeExtSchemas）、Tab 级导出。一级结构：
- query-view/（index.jsx 541 行）：查询表单，多选指标组生成 tabData，内嵌 edit 弹窗做网元手工输入/检索/导入。
- his-view/（68 行）：按 schemaId 查历史表格（QueryTable）。
- edit/（index.jsx 602 行）：网元列表选择弹窗，含筛选/手动录入/模板下载与导入；upload/（197 行）导入上传弹窗；api.js（55 行）接口封装。

## 数据来源
- edit/api.js：@Common/api 的 request 封装三个接口（baseUrlType: performanceQueryUrl）：indexquery/nePageList（网元分页）、indexquery/getNeNameImportTemplate（模板下载，blob）、indexquery/importNeNames（导入上传）。
- query-view 与 his-view 走 Intfs：objectClass、schemaSelect、kpiIndexBatchSelect、kpiMapDataExportByBatch（两处导出）、kpiMapDataHisValueTableBySchemaId。

## 状态
无模块内 hox。使用全局 hox：useLoginInfoModel（@Src/hox）、useQueryHook（src/hox/query-hox.js）、useEnvironmentModel。

## 复用组件
@Components/select-value、@Components/query-table、@Components/custom-modal-footer；@Src/components/auth-button。

## i18n
未使用 react-intl-universal 或 global-message。文案为中文硬编码。

## 风险与待定
- query-view 541 行、edit 602 行，两个大文件。
- Tab 栏导出按钮复用 authKey「pmmpPerformanceQueryQueryViewHandleExport:Other」，与 performance-query 查询区导出按钮同名，权限配置互相影响。
- edit 弹窗按 fieldType「title_text」筛选网元名称，列表数据由 query-view 传入后本地过滤。
- select-* 子组件与 performance-query 高度重复：select-ne-value（174 行）与 performance-query 同名文件逐字节相同（git diff --no-index 无差异）；select-ind-value（180 行）与 query 版差 17 增/11 删；select-schema-value（185 行）差 16 增/2 删。均为复制粘贴后小改。
- edit/index.jsx 用 immer produce 管理列表状态，与模块其余 setState 风格不一致。
- 未发现模块内测试。
