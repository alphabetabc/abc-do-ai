# performance-over-monitor

> 编号 014 · 源码 src/pages/performance-over-monitor · 总体监控磁贴墙

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由

- src/routes/index.js 第 72-76 行注册：path 为 /performance-over-monitor，exact: true，无路由参数。
- 另被 src/pages/test/index.jsx 以按钮 history.push('/performance-over-monitor') 方式跳转。

## 模块文件树

```text
src/pages/performance-over-monitor/
├── index.jsx
├── index.less
├── images/
│   └── 0.svg
└── indicator-modal/
    └── index.jsx
```

## 入口与结构

- 入口 src/pages/performance-over-monitor/index.jsx（247 行）：总体监控视图磁贴墙，按专题展示告警分级计数与指标数，15 分钟定时刷新。
- indicator-modal/：指标详情弹窗，ProTable 分页展示专题已接指标（153 行）。
- images/：仅 0.svg，作图片加载失败的 fallback。

## 数据来源

- src/pages/performance-over-monitor/index.jsx 经 @Common/api 的 request 调 topicMonitor/topicList（baseUrlType: performanceQueryUrl），查询磁贴列表。
- indicator-modal 经同一 request 调 topicMonitor/relationKpis，分页查询指标详情。
- 跳转告警页使用 src/share/actions 的 postMessage（openRoute，entry 为 /alarm-cmcc/donghuan-gateway/pmmp_{topic_id}）。
- 定时刷新来自 src/common/timer 的 initTimer 与 interval.minute * 15。

## 状态

- 使用 @Src/hox 的 useLoginInfoModel 与 useEnvironmentModel；无模块内 hox.js。
- 组件内 useState：topicID、indicatorVisible、dataSource。

## 复用组件

- 未引用 src/components/ 下组件；仅用 oss-ui 的 Image、Modal、indicator-modal 内用 ProTable。

## i18n

- 未使用 react-intl-universal / global-message；界面文案为硬编码中文（如"不能查看未接入的专题！"、磁贴统计项名称）。

## 风险与待定

- 可疑实现：index.jsx 第 14-16 行在组件外直接 useEnvironmentModel?.data?.environment 取 indicators/provinceId，未调用 hook，取值恒为默认空值，环境配置可能未生效。
- index.jsx 第 170、177 行用 class 而非 className（React 警告隐患）。
- 全模块无测试文件；未发现超大文件。
