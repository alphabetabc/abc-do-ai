# performance-query-region

> 编号 009 · 源码 src/pages/performance-query-region · 地市维度查询query/his精简版

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册：exact: true，path: '/performance-query-region'，component: 'performance-query-region'（第 122-126 行）。无带参路由。

## 模块文件树

```text
performance-query-region/
├── his-view/
│   ├── index.jsx
│   └── index.less
├── query-view/
│   ├── select-ind-value/
│   │   └── index.jsx
│   ├── select-schema-value/
│   │   └── index.jsx
│   ├── index.jsx
│   └── index.less
├── index.jsx
└── index.less
```

## 入口与结构
入口 src/pages/performance-query-region/index.jsx（61 行，class 组件）：仅持有 params 并透传 handleQuery，params 额外含 regionId/cityId。一级结构：
- query-view/（index.jsx 505 行）：查询表单，与 performance-query/query-view 同构，增加地市/区县（districtCountry）级联；支持导出（kpiDataExportByRegion）。
- his-view/（40 行）：历史表格，QueryTable 固定 pageSize 20；dataEmpty 时渲染 constants.IMAGE_PATH 下的 noResult.png 空态图。
- 无 cur-view、无 edit、无 components 子目录，比 performance-query 少当前值与图表能力。

## 数据来源
无模块内 api.js。Intfs（@Common/intf-configs）：specialty、objectClass、vendor、region（getServerDataByParallel 并行基础数据）；schemaSelect、kpiIndexSelect（级联下拉）；districtCountry（区县联动，getServerData 拉取）；kpiDataHisValueTableByRegion（历史表格）；kpiDataExportByRegion（导出）。

## 状态
无模块内 hox。使用全局 hox：useLoginInfoModel（@Src/hox）、useQueryHook（src/hox/query-hox.js）、useEnvironmentModel。

## 复用组件
@Components/select-value、@Components/query-table；@Src/components/auth-button。
his-view 空态图路径常量取自 @Common/constants 的 IMAGE_PATH。

## i18n
未使用 react-intl-universal 或 global-message。文案为中文硬编码。

## 风险与待定
- query-view 505 行大文件，与 performance-query/query-view（632 行）大段重复。
- select-ind-value（165 行）、select-schema-value（163 行）与 performance-query 同名文件为复制副本（相对 query 版少 13 行左右的裁剪差异；select-schema-value 差异为 3 增/13 删）。本模块无 select-ne-value。
- his-view 列定义取 @Common/table-cols 的 Cols 拼接 mockCols（mock 前缀列与真实列混用，与 performance-query/his-view 同款写法）。
- 入口 index.jsx 的 unitId/unitName state 声明后未参与任何逻辑（只透传给 HisView），疑似从 performance-query 拷贝后的残留。
- 未发现模块内测试。
