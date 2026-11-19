# threshold-setting

> 编号 017 · 源码 src/pages/threshold-setting · 树加分组加阈值列表

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 42-46 行注册：path 为 /threshold-setting，exact: true，无路由参数。
- 另被 src/pages/test/index.jsx 以按钮跳转。

## 模块文件树

```text
threshold-setting/
├── components/
│   ├── group-list/
│   │   ├── components/
│   │   │   ├── AddNetwork/
│   │   │   │   ├── index.jsx
│   │   │   │   └── index.less
│   │   │   └── GroupModal/
│   │   │       ├── index.jsx
│   │   │       └── index.less
│   │   ├── index.jsx
│   │   └── index.less
│   ├── index-info/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── setting-form/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── threshold-list/
│   │   ├── index.jsx
│   │   └── index.less
│   ├── threshold-setting-modal/
│   │   ├── index.jsx
│   │   └── index.less
│   └── time-from-modal/
│       └── index.jsx
├── index.jsx
└── index.less
```

## 入口与结构
- 入口 src/pages/threshold-setting/index.jsx（67 行）：阈值设置页，左侧指标树 + 右侧指标信息与阈值列表，本地 useState 联动选中项。
- components/index-info/：指标基础信息卡片，含置顶（setStickTime）操作。
- components/group-list/：网元分组/时段分组菜单列表，内嵌 components/GroupModal/（分组编辑弹窗）与 components/AddNetwork/（新增网元分组弹窗）。
- components/threshold-list/：阈值列表主表，含导入（Upload）、导出、删除入口。
- components/threshold-setting-modal/：阈值新增/编辑大弹窗，内嵌阈值折线图与时段、表单子组件。
- components/setting-form/：弹窗内的阈值条件表单。
- components/time-from-modal/：添加时段小弹窗，纯表单无接口。

## 数据来源
- 各组件经 @Common/api 的 request 调 thresholdSetting/* 系列接口：indexInfo、setStickTime（index-info）；queryIndex（setting-form）；queryThresholdList、import、export（threshold-list）；addNeGroup（group-list）；getNeGroup（GroupModal）；queryNeType、queryProvince、queryVendor、queryRegion、queryNeInfo（AddNetwork）。
- 未引用 src/common/intf-configs.js 或 getServerData 封装。

## 状态
- index-info、threshold-list、group-list 均使用 @Src/hox 的 useLoginInfoModel（取用户信息与日志字段）；无模块内 hox.js。
- 选中态全部由入口组件 useState 下发 props，未做全局状态。

## 复用组件
- src/components/threshold-tree（左侧指标树）、src/components/auth-button（index-info、threshold-list 权限按钮）、src/components/threshold-chart-line（setting-modal 阈值折线图）。

## i18n
- 未使用 react-intl-universal / global-message；文案硬编码中文。

## 风险与待定
- 多个超大文件：threshold-setting-modal/index.jsx 667 行、group-list/index.jsx 523 行、threshold-list/index.jsx 417 行、AddNetwork/index.jsx 350 行、setting-form/index.jsx 298 行。
- threshold-list 中 export 接口在第 220 与 261 行被调用两次，疑似重复导出实现。
- 全模块无测试文件。
