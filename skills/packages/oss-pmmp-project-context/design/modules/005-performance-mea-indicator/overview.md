# performance-mea-indicator

> 编号 005 · 源码 src/pages/performance-mea-indicator · 测量指标查询与导出

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 97-101 行注册：path 为 /performance-mea-indicator，exact: true，无路由参数，component 为 performance-mea-indicator。
- 无其他带参路由。

## 模块文件树

```text
performance-mea-indicator/
├── api.js
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/performance-mea-indicator/index.jsx（206 行）：测量指标查询列表页，单文件模块（仅入口加 api.js，无子目录）。ProTable 分页列表，列含指标组编号/名称、指标英文名/中文名、字段名；指标组搜索项用 SelectCondition 渲染；支持勾选导出、未勾选时确认全量导出、行内单条导出。
- api.js（85 行）：3 个导出函数，均走 @Common/api 的 request，baseUrlType performanceQueryUrl，blob 下载 xlsx：
  - searchClKpiPage（kpiGroup/searchClKpiPage 测量指标分页查询）。
  - exportClKpiDataByIds（kpiGroup/exportClKpiDataByIds 按 schemaId+counterEnName 批量导出）。
  - exportClKpiDataByParams（kpiGroup/exportClKpiDataByParams 按查询条件全量导出）。

## 数据来源
- 模块内 api.js（见上）。
- 指标组下拉枚举 kpiSchemaForKpiGroup 取自 Enums.intfEnum（src/common/enum/common.js 第 582-593 行，path select/dropDownSelect，desc 指标查询-指标组下拉框），由 SelectCondition 加载。

## 状态
- 无 hox，无模块内 hox.js；组件内 useState 保存 searchListRows（勾选行）与 exportParams（查询条件快照）。

## 复用组件
- src/components/search-condition（SelectCondition，指标组下拉）。
- 其余为 oss-ui 的 ProTable/Button/Icon/Tooltip/Modal。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- index.jsx 第 117 行定义局部 const request 作为 ProTable 数据源函数名，与 @Common/api 导出的 request 同名，虽未实际冲突但易误读。
- 导出下载逻辑（Blob 转 a 标签点击）在 api.js 两个导出函数间重复，且与 performance-per-indicator 的 api.js 几乎逐行相同。
- 全模块无测试文件；未发现超大文件。
