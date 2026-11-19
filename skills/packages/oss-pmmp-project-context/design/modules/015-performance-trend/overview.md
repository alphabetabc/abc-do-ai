# performance-trend

> 编号 015 · 源码 src/pages/performance-trend · 告警驱动趋势页双视图可导出

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 62-66 行注册：path 为 /performance-trend，exact: true，无路由参数。
- 页面不接路由参数，靠全局消息 changeSessionAndAlarmId 传入告警上下文；另被 test 页与 performance-trend-modal 引用。

## 模块文件树

```text
performance-trend/
├── indicator-list/
│   ├── index.jsx
│   └── index.less
├── trend-view/
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/performance-trend/index.jsx（351 行）：性能趋势页，监听全局消息取告警详情，初始化指标列表、时间范围与查询参数，切换趋势图/表格视图并支持导出。
- trend-view/（169 行）：趋势图视图，并行拉取指标时序数据与门限上下限，渲染 QueryChartLine，内嵌指标选择列表。
- indicator-list/（约 70 行）：指标列表选中态管理，选中主指标后回调重新查图。

## 数据来源
- 接口配置取自 src/common/intf-configs.js 的 Intfs：alarmDetail（flow/alarm-detail）、relationIndicators（indexquery/getRelationIndicators）、timesIndicatorTableData（indexquery/timesIndicatorTableData）、timesIndicatorTableDataExport（indexquery/timesIndicatorTableDataExport，blob 导出）、timesIndicatorMapData（indexquery/timesIndicatorMapData）、kpiManMarkSelect（select/kpiManMarkSelect）。
- 请求封装在 src/common/utils/getServerData.js：getServerData、getAlarmDetail、getServerDataByParallel。
- 表格基础列 Cols、mockCols 来自 src/common/table-cols.js；导出用 src/common/utils/exportData.js 的 exportFun。

## 状态
- 使用 @Src/hox 的 useLoginInfoModel（读 userId/userName/theme）与 useEnvironmentModel（读 performanceTrendAlarmConfig）；无模块内 hox.js。
- 组件内 useState 管理时间范围、指标列表、trendParams/tbParams 与视图切换。

## 复用组件
- src/components/query-table（表格视图）、src/components/query-chart-line（趋势图）。

## i18n
- 未使用 react-intl-universal / global-message；标题、导出文件名等均为硬编码中文。

## 风险与待定
- index.jsx 内残留多处 console.log 调试日志（第 75、81、128 行等）。
- 存在 isMock ref 调试开关与 mockCols 假数据分支，默认关闭但代码留在生产路径。
- 页面依赖外部框架 postMessage（shareActions）注入告警上下文，独立打开时 alarmDetails 为空、页面无数据。
- 全模块无测试文件。
