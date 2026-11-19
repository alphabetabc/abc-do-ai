# performance-report-example

> 编号 013 · 源码 src/pages/performance-report-example · 报告实例：Fedx页面含死代码弹窗

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册：exact: true，path: '/performance-report-example'，component: 'performance-report-example'。无带参路由。

## 模块文件树

```text
performance-report-example/
├── example-setting/
│   ├── example-add/
│   │   └── index.jsx
│   └── index.jsx
├── index.jsx
└── style.less
```

## 入口与结构
入口 src/pages/performance-report-example/index.jsx（152 行函数组件）：渲染 @Components/fedx-report-page-template（pageId="356"）驱动报告实例列表；customActionHandler 中 report-indicator-search / report-template-modify 打开报告弹窗，report-template-export 导出 docx（Blob + a 标签下载，文件名含 dayjs 时间戳），Log 类 key 调 logsOperation 上报操作日志。一级结构：
- 导出文件名格式为 reportName_YYYYMMDDHHmmss.docx（dayjs 生成时间戳）。
- example-setting/（index.jsx 22 行）：按 pageType 分发到 example-add，未匹配时渲染「未知页面」。
- example-setting/example-add/（index.jsx 36 行）：Modal 占位组件，标题「修改报告/新增报告」，正文为重复占位文案，无数据请求。
- 注意：入口 index.jsx 未引用 example-setting，其 ReportAdd 实际 import 自 ../performance-report-template/report-add（第 6 行），example-setting 目录在 src 全仓范围内仅自引用。

## 数据来源
kpiMonitorService（src/common/services/kpiMonitorService）：reportExport（导出 docx，导出前校验 reportName/templateText 为空时 message.warn 阻断）。日志走 @Common/api/service/loggerApi 的 logsOperation。报告新增/修改等其余逻辑借由复用的 performance-report-template/report-add 完成。

## 状态
无模块内 hox。使用全局 useLoginInfoModel（@Src/hox）：取 userInfoString/activeRoute/userName/userId，userInfoString 需 JSON.parse。

## 复用组件
@Components/fedx-report-page-template；跨模块复用 src/pages/performance-report-template/report-add（页面目录互引）。

## i18n
未使用 react-intl-universal 或 global-message。文案为中文硬编码，含 @ts-ignore 注释残留。

## 风险与待定
- example-add 是半成品占位组件（正文为「报告弹窗」重复文案）；且当前入口链路根本不经过它。
- example-setting 的 pageType 判断值为 rule-add/rule-editor，与入口实际传入的 report-indicator-search/report-template-modify 不一致，两套 key 对不上，进一步印证该目录为遗留死代码。
- 入口 index.jsx 的 cacheResolveFnRef/cacheRejectFnRef 赋值后在整个文件内再未被读取，为死引用，与 performance-report-template/index.jsx 同款问题。
- index.jsx 的 customActionHandler 与 src/pages/performance-report-template/index.jsx 几乎逐行重复（日志上报段约 50 行）。
- 未发现模块内测试。
