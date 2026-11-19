# performance-data

> 编号 002 · 源码 src/pages/performance-data · 性能数据查询图表表格

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 21-25 行注册：path 为 /performance-data，exact: true，无路由参数，component 为 performance-data。
- 第 26-31 行注册：path 为 /performance-data/performance-data-table，exact: true，component 为 performance-data/performance-data-view/performance-data-table（直挂表格子组件，无参数）。

## 模块文件树

```text
performance-data/
├── performance-data-query/
│   ├── index.jsx
│   └── index.less
├── performance-data-view/
│   ├── performance-data-chart/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── performance-data-table/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/performance-data/index.jsx（50 行）：类容器组件，持有查询参数 state（specialty/region/objectClass/vendor/neList/indList/timeLevel/timeRange），查询时对 neList/indList 按 label 升序排序后传给视图，渲染查询表单与结果视图。
- performance-data-query/index.jsx（914 行）：查询表单类组件，专业/网元类型/厂商/地市/网元/指标/时间粒度/时间范围，网元与指标为远程搜索下拉，选中后经 handleQuery 回传父组件。
- performance-data-view/index.jsx（233 行）：结果视图类组件，无数据显示空态图（constants.IMAGE_PATH/noResult.png），有数据时渲染图表与表格；负责分页查询表格数据与导出。
- performance-data-view/performance-data-chart/index.jsx（973 行）：图表区，按网元/指标组合查询并渲染单/双 Y 轴折线图与柱状图，叠加门限线。
- performance-data-view/performance-data-table/index.jsx（141 行）：结果表格类组件，ProTable 展示网元名称/开始时间/结束时间加动态指标列，导出按钮回调父组件方法。

## 数据来源
- 统一经 @Common/api 的 request 发请求，接口枚举定义在 src/common/enum/common.js，baseUrlType 多为 alarmModelUrl。
- query 用到：specialty、objectClass、vendors、regionCityLocal（均 select/dropDownSelect 不同 selectType）、neData（select/objectClassSelect）、indData（select/kpiIndexSelect），见 common.js 第 11-82 行。
- view 用到：tbData（indexquery/timesIndicatorTableData，表格分页数据）、exportData（indexquery/timesIndicatorTableDataExport，responseType blob，导出 xls）。
- chart 用到：kpiManMarkData（select/kpiManMarkSelect 门限数据）、chartData（indexquery/timesIndicatorMapData 图表数据）。

## 状态
- 无 hox：全模块 grep 无 withModel/useModel 命中，无模块内 hox.js；状态全部为组件内 state 与类属性，经 props 传递。

## 复用组件
- chart 引用 src/components/comp-singley-line、comp-doubley-line、comp-singley-bar、comp-doubley-bar 四个图表组件。
- 未使用 search-condition、auth-button、row-delete 等其他公共组件；下拉均为模块内自建。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- 超大文件：performance-data-chart/index.jsx 973 行、performance-data-query/index.jsx 914 行。
- query 内 debug = true 类属性（第 28 行）从未被读取，getDebugData_ind（第 412 行）定义后未调用，属死代码；view 与 table 内保留 DEBUG 分支与 getDebugData_tb 等造数函数（未调用）。
- view/table/query 为类组件，props.params 深比较触发查询，逻辑集中、可读性差。
- 全模块无测试文件。
