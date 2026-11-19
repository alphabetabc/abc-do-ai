# performance-indicator-manage

> 编号 004 · 源码 src/pages/performance-indicator-manage · 报表模板承载指标管理

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 87-91 行注册：path 为 /performance-indicator-manage，exact: true，无路由参数，component 为 performance-indicator-manage。
- 无其他带参路由。

## 模块文件树

```text
performance-indicator-manage/
├── check-tag/
│   ├── index.jsx
│   └── index.less
├── custom-variables/
│   ├── left-card/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── right-card/
│   │   └── index.jsx
│   ├── index.jsx
│   └── index.less
├── indicator-setting/
│   ├── indicator-add/
│   │   ├── index.jsx
│   │   └── index.less
│   └── index.jsx
├── indicator-template/
│   ├── custom-variables/
│   │   ├── left-card/
│   │   │   ├── index.jsx
│   │   │   └── index.less
│   │   ├── right-card/
│   │   │   └── index.jsx
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index.jsx
│   └── index.less
├── index.tsx
└── style.less
```

## 入口与结构
- 入口 src/pages/performance-indicator-manage/index.tsx（95 行，本模块唯一 TS 入口）：基于 @Components/fedx-report-page-template 的报表页（pageId 341），通过 customComponentMaps 注入自定义组件 CheckTag 与 IndicatorTemplate；customActionHandler 拦截 customHandleKey 含 Log 的自定义动作，组装日志并调 logsOperation 上报。
- check-tag/index.jsx（151 行）：报表自定义表单组件，用 fedx-report 的 useDataSource 取数据源，渲染单选/多选标签勾选。
- indicator-template/index.jsx（100 行）：报表自定义表单组件，TextArea（500 字上限）加插入变量按钮，按光标位置插入变量内容，内嵌 CustomVariables 弹窗。
- custom-variables/（index 141 行、left-card 304 行、right-card 86 行）：变量选择弹窗；index 第 25 行直接 request('api/v1/eventcapabilityopen/var/querycombobox') 取下拉数据。
- indicator-template/custom-variables/（index 141 行、left-card 331 行、right-card 86 行）：同功能弹窗的第二份实现，改用 kpiMonitorService（getDictInfo、getVarInfo）取数。
- indicator-setting/index.jsx（30 行）：自定义组件分发器，pageType 为 rule-add/rule-editor 时渲染 indicator-add，否则显示「未知页面」。
- indicator-setting/indicator-add/index.jsx（470 行）：指标新增/编辑表单，4 处下拉用 kpiMonitorService.postSelectDropDownSelect，引用根级 custom-variables。

## 数据来源
- index.tsx：@Common/api/service/loggerApi 的 logsOperation（操作日志上报）。
- custom-variables/index.jsx：@Common/api 的 request，直连 path api/v1/eventcapabilityopen/var/querycombobox。
- indicator-template/custom-variables 与 indicator-add：src/common/services/kpiMonitorService（默认导出类实例，baseUrlType kpiMonitorService/varManagerService），用到 postSelectDropDownSelect、getDictInfo、getVarInfo。

## 状态
- 无模块内 hox.js；index.tsx、custom-variables/index.jsx、custom-variables/left-card、indicator-template/custom-variables/index.jsx、indicator-template/custom-variables/left-card 使用全局 src/hox 的 useLoginInfoModel。

## 复用组件
- src/components/fedx-report-page-template（报表页模板）。
- src/components/custom-modal-footer（两处变量弹窗底部）。
- src/components/check-tag（indicator-add 引用，注意与模块内 check-tag 同名但非同一实现）。
- src/common/utils/index（checks，光标位置等工具）。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- custom-variables 在模块内存在根级与 indicator-template/ 下两份近似重复实现，left-card 行数接近（304 与 331），维护时易漏改。
- 数据获取方式不统一：一处裸 request 直连 api/v1 路径，其余走 kpiMonitorService 服务层。
- 入口为 index.tsx，与其余模块（jsx）不一致；index.tsx 内多处 @ts-ignore 压制类型。
- check-tag、indicator-add 等依赖报表平台配置（pageId 341 与 fedx-report 数据源），脱离报表环境不可运行。
- 全模块无测试文件。
