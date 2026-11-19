# performance-indicator-group

> 编号 003 · 源码 src/pages/performance-indicator-group · 指标组三步编辑管理

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 107-111 行注册：path 为 /performance-indicator-group，exact: true，无路由参数，component 为 performance-indicator-group。
- 第 112-116 行注册：path 为 /performance-indicator-group/edit/:type/:id，exact: true，component 为 performance-indicator-group/edit；type 取值 new/edit/show，id 为指标组 id。

## 模块文件树

```text
performance-indicator-group/
├── components/
│   ├── import-indicator/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── mea-indicator/
│   │   └── index.jsx
│   └── per-indicator/
│       └── index.jsx
├── edit/
│   ├── indicator-group-setting/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── measure-indicator-setting/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── performance-indicator-setting/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index.jsx
│   └── index.less
├── api.js
├── enums.js
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/performance-indicator-group/index.jsx（868 行）：指标组管理列表页，VirtualTable 列表，查询下拉取 vendorForKpiGroup/useTypeForKpiGroup/intervalForKpiGroup/subClassForKpiGroup/equipmentClassForKpiGroup/networkTypeTopForKpiGroup 枚举，工具栏含新建/导入/导出/生成脚本，行内操作含编辑/复制/删除/启停/查看测量指标/查看性能指标；点击指标组名称以 show 类型跳编辑页。
- api.js（407 行）：21 个导出函数，全部走 @Common/api 的 request，path 前缀 kpiGroup/，baseUrlType performanceQueryUrl；含 searchKpiGroupPage、searchKpiGroup、deleteKpiGroup、copyKpiGroup、generateScript（下载 KPIDB 建表脚本 zip）、enableSechemaId/disableSechemaId、searchClKpiByGroup/searchXnKpiByGroup、importKpiGroup/getImportTemplate、addKpiGroup/editKpiGroup、deleteClKpi/addClKpi/editClKpi、deleteXnKpi/addXnKpi/editXnKpi 及两个导出函数。
- enums.js（32 行）：enableFlagEnum（启用/停用）、withMoEnum（是/否）、kpiTypeEnum（R 浮点数/P 百分比）。
- components/per-indicator/index.jsx（136 行）：指标组性能指标弹窗查询，调 searchXnKpiByGroup。
- components/mea-indicator/index.jsx（71 行）：指标组测量指标弹窗查询，调 searchClKpiByGroup。
- components/import-indicator/index.jsx（104 行）：指标组导入弹窗，调 importKpiGroup/getImportTemplate。
- edit/index.jsx（117 行）：编辑页容器，左侧菜单三步（指标组设置/测量指标设置/性能指标设置），读取 match.params 的 type/id，show 类型整体只读，返回按钮跳回列表页。
- edit/indicator-group-setting/index.jsx（437 行）：指标组基本信息表单，调 addKpiGroup/editKpiGroup。
- edit/measure-indicator-setting/index.jsx（341 行）：测量指标列表及增删改弹窗，调 searchClKpiByGroup/deleteClKpi/addClKpi/editClKpi。
- edit/performance-indicator-setting/index.jsx（601 行）：性能指标列表及增删改弹窗，调 searchXnKpiByGroup/deleteXnKpi/addXnKpi/editXnKpi。

## 数据来源
- 模块内 api.js（见上）；下拉数据另经 Enums.intfEnum（src/common/enum/common.js）的 vendorForKpiGroup 等，配合 @Common/api 的 request 由 SelectCondition 加载。

## 状态
- 无模块内 hox.js；edit/index.jsx、components/import-indicator/index.jsx、edit/indicator-group-setting/index.jsx 使用全局 src/hox 的 useLoginInfoModel（取登录信息与主题 theme）。

## 复用组件
- src/components/search-condition（SelectCondition，列表查询与性能指标设置弹窗）。
- src/components/auth-button（AuthButton，列表页按钮鉴权）。
- src/components/custom-modal-footer（CustomModalFooter，各弹窗底部）。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- 超大文件：index.jsx 868 行、edit/performance-indicator-setting/index.jsx 601 行、api.js 407 行。
- api.js 中 editClKpi 的 defaultErrorMessage 误写为「新增测量指标失败」（应为修改失败，第 353 行附近）。
- enableSechemaId/disableSechemaId 函数名拼写错误（Sechema 应为 Schema），且已被引用不宜随意改名。
- 导出下载逻辑（Blob 转 a 标签点击）在 api.js 三个导出函数间重复。
- 全模块无测试文件。
