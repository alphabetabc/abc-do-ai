# performance-query

> 编号 007 · 源码 src/pages/performance-query · 性能查询

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由

src/routes/index.js 中注册：exact: true，path: '/performance-query'，component: 'performance-query'。无带参路由。另被 /performance-query-type 页面以组件方式二次聚合（见 010）。

## 模块文件树

```text
performance-query/
├── index.jsx
├── index.less
├── common/
│   └── cur-view-cols.js
├── components/
│   ├── query-chart/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── query-chart-condition/
│   │   ├── index.jsx
│   │   └── index.less
│   └── query-title/
│       ├── index.jsx
│       └── index.less
├── cur-view/
│   ├── index.jsx
│   └── index.less
├── his-view/
│   ├── index.jsx
│   └── index.less
└── query-view/
    ├── index.jsx
    ├── index.less
    ├── select-ind-value/index.jsx
    ├── select-ne-value/index.jsx
    └── select-schema-value/index.jsx
```

## 入口与结构

- 入口 src/pages/performance-query/index.jsx（137 行，class 组件）：持有查询参数 state，handleQuery 排序 neList/indList 后取对象名称列表与当前值判空，渲染三块布局。
- query-view/（index.jsx 632 行）：查询条件表单，含网元类型/指标组/指标/网元/专业/厂家/地市/对象名称/时间范围，支持 URL 参数（window.location.search）回填与自动查询。
- cur-view/（18 行）：当前值表格。
- his-view/（180 行）：历史值，Radio 切换曲线/柱状图/表格。
- components/query-title：标题条。
- components/query-chart（51 行）：历史曲线图封装。
- components/query-chart-condition：图表网元/指标条件选择。
- common/cur-view-cols.js：当前值表格列定义。

## 数据来源

无模块内 api.js。直接使用 @Common/intf-configs 的 Intfs 与 @Common/utils/getServerData：specialty、objectClass、vendor、region（下拉基础数据，getServerDataByParallel 并行拉取）；schemaSelect、kpiIndexSelect、objectClassSelect（三个级联下拉）；kpiUnitSelect、kpiMapDataCurtValue（入口）；kpiMapDataHisValue、kpiMapDataHisValueTable（历史）；hisValueChatLine（曲线）；kpiMapDataExport（导出）。

## 状态

无模块内 hox。使用全局 hox：useLoginInfoModel（@Src/hox，withModel 注入 login）、useQueryHook（src/hox/query-hox.js，管理 neUpdate/schemaUpdate/indUpdate 三个级联刷新标志）、useEnvironmentModel（读取 performanceQueryParamConfig 控制字段显隐）。

## 复用组件

- @Components/select-value、@Components/query-table、@Components/query-chart-line、@Components/query-chart-bar。
- @Src/components/auth-button（重置/查询/导出按钮鉴权）。

## i18n

未使用 react-intl-universal 或 global-message（模块内 Grep 无匹配）。文案为中文硬编码。

## 风险与待定

- query-view/index.jsx 632 行大文件，表单联动逻辑集中。
- query-view/index.jsx 第 142 行残留 console.log('测试日志，性能导出参数', ...)。
- query-view 下 select-ind-value（174 行）、select-ne-value（174 行）、select-schema-value（172 行）三者为复制粘贴副本：同模块内 select-ne-value 与 select-ind-value 仅差 6 行增 5 行删；与 query-batch、query-region 同名文件互为副本（详见 008/009）。
- 未发现模块内测试。
