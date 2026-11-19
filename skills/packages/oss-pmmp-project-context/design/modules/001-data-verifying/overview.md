# data-verifying

> 编号 001 · 源码 src/pages/data-verifying · 缺数检测列表与规则弹窗

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 47-51 行注册：path 为 /data-verifying，exact: true，无路由参数，component 为 data-verifying。
- 第 52-56 行注册：path 为 /data-verifying/:type/:id，exact: true，component 为 data-verifying/rule-setting；type 取值 new/edit/view，id 为规则 id（列表页新建时传 -1）。

## 模块文件树

```text
data-verifying/
├── common/
│   ├── columns.js
│   ├── hox.js
│   ├── rule-setting-handler.js
│   └── view-enum.js
├── del-data-verify/
│   └── index.jsx
├── rule-setting/
│   ├── index.jsx
│   └── index.less
├── enums.js
└── index.jsx
```

## 入口与结构
- 入口 src/pages/data-verifying/index.jsx（734 行）：缺数检测设置列表页，VirtualTable 分页列表，含查询条件缓存/还原（配合编辑页返回后还原）、新建/编辑跳转、行内启停/编辑/删除/导出、批量删除/批量启用/批量停用/批量导出，管理员只能操作自己创建的规则。
- common/columns.js（288 行）：列表列定义，网元类型/指标组/启停下拉用 SelectCondition 渲染，引用 dataVerifyNeType、dataVerifyIndGrp、dataVerifyInd 接口枚举。
- common/hox.js（21 行）：createModel 的 usePageInfo，缓存 loadType、operationType、selectGroupId、selectCond。
- common/rule-setting-handler.js（1 行）：仅一行注释，无实际代码。
- common/view-enum.js（0 行）：空文件。
- del-data-verify/index.jsx（114 行）：类组件删除按钮（withModel 注入登录与分页模型），硬编码 res[dataField] === '200' 判断成功。
- rule-setting/index.jsx（860 行）：新建/编辑/查看缺数检测规则弹窗页，读取 match.params 的 type/id，指标组选择联动回填网元类型/采集周期/表名，告警设置表单（标题/级别/检测周期/24 小时时段勾选）。
- enums.js（11 行）：vendorFlagEnum（是/否）。

## 数据来源
- 统一经 @Common/api 的 request 发请求；接口枚举取自 Enums.intfEnum，定义在 src/common/enum/common.js（第 426 行起 dataVerify* 各项），baseUrlType 均为 dataVerifyUrl。
- 列表页用到：dataVerifyGetAllAlarmSetsInfo（kpiDataQuality/getAllAlarmSetInfo 查询缺数告警）、dataVerifyDelAlarmSetsInfo、dataVerifyStartOrEndEnableFlag、dataVerifyExportAlarmSetsInfo。
- columns.js 用到：dataVerifyNeType（queryNeType）、dataVerifyIndGrp（queryIndexGroup）、dataVerifyInd（queryIndex）。
- rule-setting 用到：dataVerifySchemas（getAllAlarmSchemasInfo）、dataVerifyKpis（getAllAlarmKpisInfo）、dataVerifyAlarmLevel（getAllAlarmLevelInfo）、dataVerifyAddAlarmSetsInfo（addAlarmSetsInfo）、dataVerifyModifyAlarmSetsInfo（modifyAlarmSetsInfo）、dataVerifyQueryAlarmByRuleId、vendors（select/dropDownSelect，baseUrlType alarmModelUrl）。
- 导出走 @Common/utils/exportData 的 exportFun；rule-setting 用 @Common/utils/formatReg 的 positiveIntegerWithZero 校验检测周期（2~100）。

## 状态
- 全局：src/hox 的 useLoginInfoModel（取 userId/userName/userInfo/activeRoute）。
- 模块内：common/hox.js 的 usePageInfoModel（缓存查询条件与 loadType，供列表页与 rule-setting、del-data-verify 共享）；del-data-verify 用 hox 的 withModel 同时注入两个模型。

## 复用组件
- src/components/search-condition（SelectCondition，columns.js）。
- src/components/row-delete（RowDelete，列表行删除）。
- src/components/auth-button（AuthButton，按钮鉴权，authKey 前缀 pmmpDataVerifying*）。
- src/components/custom-modal-footer（CustomModalFooter，rule-setting 弹窗底部）。

## i18n
- 未使用 react-intl-universal / global-message；界面文案与 message 提示均为硬编码中文。

## 风险与待定
- del-data-verify/index.jsx 在 src 内无任何引用，为死代码。
- common/view-enum.js 为空文件、common/rule-setting-handler.js 仅一行注释，均无引用。
- rule-setting/index.jsx 第 256 行遗留 console.log('测试日志 指标缺数检测 保存参数', ...) 调试日志；第 78 行 debug 标志及第 421-456 行本地造数逻辑仍保留。
- rule-setting/index.jsx（860 行）、index.jsx（734 行）偏大，表单弹窗内嵌多个内部组件。
- 全模块无测试文件。
