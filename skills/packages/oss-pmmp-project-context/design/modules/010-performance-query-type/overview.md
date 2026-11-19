# performance-query-type

> 编号 010 · 源码 src/pages/performance-query-type · 聚合壳：左Tab套网元地市两查询

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
src/routes/index.js 中注册：exact: true，path: '/performance-query-type'，component: 'performance-query-type'（第 117-121 行）。无带参路由。

## 模块文件树

```text
performance-query-type/
├── index.jsx
└── index.less
```

## 入口与结构
仅两个文件：src/pages/performance-query-type/index.jsx（24 行函数组件）与 index.less（12 行）。入口用左侧 Tabs（tabPosition="left"，defaultActiveKey="1"）聚合两个子页面：
- Tab「按网元查询」：渲染 src/pages/performance-query（NeQuery）。
- Tab「按地市查询」：渲染 src/pages/performance-query-region（RegionQuery）。
- 两个 TabPane key 分别为 "1"、"2"。
自身无任何子组件目录，两个 Tab 内容区分别挂在 className="ne" 与 className="region" 的容器 div 下。

## 数据来源
无自有接口调用。全部数据请求落在被聚合的 performance-query 与 performance-query-region 两个模块内。
模块内无 api.js、无服务层引用（Grep 确认）。

## 状态
无独立状态（文件内无 hox、无 state，仅 Tabs 的 defaultActiveKey="1"）。

## 复用组件
不引用 src/components 下任何组件；直接跨页面目录 import ../performance-query 与 ../performance-query-region。

## i18n
未使用 react-intl-universal 或 global-message。Tab 文案为中文硬编码。

## 风险与待定
- 跨页面模块互相 import（页面目录当组件用），与路由表按目录映射的约定耦合，重构页面路径会牵连本文件。
- 被聚合的 performance-query / performance-query-region 各自有独立路由可直达，同一组件存在双入口。
- 可疑实现：`<NeQuery props={props} />` 将路由 props 塞进名为 props 的属性而非展开透传，子页面若需 match/history 需从 props.props 取。
- 未发现模块内测试。
