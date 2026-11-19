# performance-rules

> 编号 011 · 源码 src/pages/performance-rules · 告警规则列表与超大编辑页

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册两条：exact: true，path: '/performance-rules'，component: 'performance-rules'（列表页）；exact: true，path: '/performance-rules/:type/:id/:creator'，component: 'performance-rules/edit-rule'（编辑页，带三个路径参数）。

## 模块文件树

```text
performance-rules/
├── common/
│   ├── columns.js
│   ├── dataHandler.js
│   ├── enable-flag-enum.js
│   ├── formatReg.js
│   ├── hox.js
│   ├── rule-enum.js
│   └── rule-template.js
├── delete/
│   └── index.jsx
├── edit-rule/
│   ├── ind-condition-modal/
│   │   └── index.jsx
│   ├── ne-condition/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── ne-condition-modal/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── other-setting/
│   │   └── index.jsx
│   ├── title/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index.jsx
│   └── index.less
├── rules-title/
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── index.less
```

## 入口与结构
入口 src/pages/performance-rules/index.jsx（427 行函数组件）：告警规则列表页（代码中 viewName 为「告警规则」），用 oss-web-common 的 VirtualTable 渲染，操作列含编辑/删除/复制/启用禁用/导出，按 isAdmin 与 creator 控制按钮禁用。一级结构：
- rules-title/：列表页标题条。
- delete/（104 行）：删除确认弹窗，接收 intf 与 onFresh。
- edit-rule/（index.jsx 1587 行）：新增/编辑规则整页，子件：title/、ne-condition/（360 行 网元条件）、ne-condition-modal/（294 行）、ind-condition-modal/（239 行 指标条件）、other-setting/（84 行 触发频率等）。
- common/：columns.js（314 行 列与查询条件定义）、dataHandler.js（346 行 条件格式化）、rule-enum.js（182 行）、enable-flag-enum.js、rule-template.js、formatReg.js、hox.js。

## 数据来源
无模块内 api.js。request（@Common/api）+ Enums.intfEnum（@Common/enum）取接口配置：queryAlarmRules、updateAlarmRules（删除即置 enableFlag）、exportAlarmRulesInfo、queryAlarmRulesDetail、modifyAlarmRules、indOperator、alarmText、alarmRuleInd、showIndexConditionCh、alarmName、neValue。

## 状态
模块内 hox：src/pages/performance-rules/common/hox.js 用 createModel(usePageInfo) 暴露 loadType/operationType/selectGroupId/selectCond。另用全局 useLoginInfoModel（@Src/hox）取 userInfo 判断 isAdmin。

## 复用组件
@Src/components/auth-button、@Src/components/custom-modal-footer、@Src/components/condition-show、@Src/components/condition、@Components/search-condition；oss-web-common 的 VirtualTable。

## i18n
未使用 react-intl-universal 或 global-message。文案与提示为中文硬编码。

## 风险与待定
- edit-rule/index.jsx 1587 行超大文件，表单/条件构造/提交逻辑全部内联。
- common/columns.js、dataHandler.js 各 300+ 行，规则表达式格式化逻辑集中，改动风险高。
- 列表默认分页取自 Enums.intfEnum.queryAlarmRules.qParams.data.pageSize（缺省 20）；操作列鉴权 key 前缀为 pmmpPerformanceRulesEdit/Copy/Enable:Other。
- 列表查询条件列由 common/columns.js 内嵌的 @Components/search-condition（SelectCondition）渲染。
- 删除操作复用 updateAlarmRules 接口、通过 enableFlag 置删除标记，语义隐蔽。
- 未发现模块内测试。
