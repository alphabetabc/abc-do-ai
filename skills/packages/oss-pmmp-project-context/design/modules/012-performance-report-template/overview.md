# performance-report-template

> 编号 012 · 源码 src/pages/performance-report-template · 报表模板：Fedx页面加设置页

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册两条：exact: true，path: '/performance-report-template'，component: 'performance-report-template'（第 77-81 行，列表页）；exact: true，path: '/performance-report-template/:type/:name'，component: 'performance-report-template/template-setting'（第 82-86 行，设置页，带 type/name 两个路径参数）。

## 模块文件树

```text
performance-report-template/
├── report-add/
│   ├── index.jsx
│   └── index.less
├── template-setting/
│   ├── basic/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── process-setting/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── report/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── style.less
```

## 入口与结构
入口 src/pages/performance-report-template/index.jsx（118 行函数组件）：渲染 @Components/fedx-report-page-template（pageId="311"）驱动列表页，customActionHandler 处理新增/编辑/详情跳转（history.push 到 new/-1、edit/:name、detail/:name）与构建报告弹窗；customHandleKey 含 Log 时调 logsOperation 上报操作日志。一级结构：
- report-add/（index.jsx 392 行）：构建/编辑报告弹窗，负责创建、导出、保存、编辑四类请求。
- template-setting/（index.jsx 217 行，class 组件）：模板设置页，从 match.params 取 type/name，type 非 new 时先 getTemplate 回填；子件 basic/（357 行 基本信息）、report/（49 行 报告内容）、process-setting/（219 行 指标过程设置）。
- 样式文件：style.less（13 行）。

## 数据来源
无模块内 api.js。统一走 src/common/services/kpiMonitorService：getTemplate、saveTemplate、editTemplate（template-setting）、postSelectDropDownSelect（basic 四个下拉）、getKpiList（process-setting）、reportCreate/reportExport/reportSave/reportEdit（report-add）。日志走 @Common/api/service/loggerApi 的 logsOperation。

## 状态
无模块内 hox。使用全局 useLoginInfoModel（@Src/hox）：取 userInfoString/activeRoute/userName/userId，userInfoString 需 JSON.parse 后取 operationsButton/zones（用于日志按钮名与 zone_id）。

## 复用组件
@Components/fedx-report-page-template、@Components/check-tag（template-setting/basic）。

## i18n
未使用 react-intl-universal 或 global-message。文案为中文硬编码，含 @ts-ignore 注释残留。

## 风险与待定
- index.jsx 的 customActionHandler 日志分支与 src/pages/performance-report-example/index.jsx 几乎逐行重复（两处各约 50 行），复制粘贴实现。
- template-setting 对 new/edit/detail 三种 type 共用同一表单与回填逻辑，已读代码内未见按 type 区分只读。
- basic/index.jsx 357 行、四个下拉均重复调用 postSelectDropDownSelect，模式重复。
- 入口 index.jsx 的 cacheResolveFnRef/cacheRejectFnRef 两个 ref 赋值后在整个文件内再未被读取，为死引用。
- 列表页「构建报告」弹窗由 customHandleKey「report-template-build-report」触发，复用本模块 report-add；跳转路径硬编码 /performance-report-template/new/-1、edit/:name、detail/:name，依赖第二条带参路由。
- 未发现模块内测试。
