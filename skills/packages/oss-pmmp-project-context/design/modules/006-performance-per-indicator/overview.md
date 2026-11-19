# performance-per-indicator

> 编号 006 · 源码 src/pages/performance-per-indicator · 性能指标查询与导出

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 102-106 行注册：path 为 /performance-per-indicator，exact: true，无路由参数，component 为 performance-per-indicator。
- 无其他带参路由。

## 模块文件树

```text
performance-per-indicator/
├── api.js
├── enums.js
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/performance-per-indicator/index.jsx（262 行）：性能指标查询列表页，单文件模块（入口、api.js、enums.js，无子目录）。ProTable 分页列表，列含指标组编号/名称、指标编号、英文名/中文名、值类型、小数位、单位、算法、最大/最小值、是否预警、字段名；指标组搜索项用 SelectCondition 渲染；支持勾选导出（按 kpiId）、未勾选时确认全量导出、行内单条导出。
- api.js（85 行）：3 个导出函数，均走 @Common/api 的 request，baseUrlType performanceQueryUrl，blob 下载 xlsx：
  - searchXnKpiPage（kpiGroup/searchXnKpiPage 性能指标分页查询）。
  - exportXnKpiDataByIds（kpiGroup/exportXnKpiDataByIds 按 kpiIds 批量导出）。
  - exportXnKpiDataByParams（kpiGroup/exportXnKpiDataByParams 按查询条件全量导出）。
- enums.js（22 行）：withMoEnum（是/否）、kpiTypeEnum（R 浮点数/P 百分比），用于列 valueEnum。

## 数据来源
- 模块内 api.js（见上）。
- 指标组下拉枚举 kpiSchemaForKpiGroup 取自 Enums.intfEnum（src/common/enum/common.js 第 582-593 行），由 SelectCondition 加载。

## 状态
- 无 hox，无模块内 hox.js；组件内 useState 保存 searchListRows（勾选行）与 exportParams（查询条件快照）。

## 复用组件
- src/components/search-condition（SelectCondition，指标组下拉）。
- 其余为 oss-ui 的 ProTable/Button/Icon/Tooltip/Modal。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- index.jsx 第 192 行 exportParams 收集的字段名 kpiZhNam 疑似笔误（列 dataIndex 为 kpiZhName），按条件全量导出时中文名参数可能始终为空，待后端参数核对。
- 与 performance-mea-indicator 的 api.js 及导出交互逻辑高度重复（仅 path 与参数差异），未抽公共层。
- 全模块无测试文件；未发现超大文件。
