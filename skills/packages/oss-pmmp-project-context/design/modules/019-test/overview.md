# test

> 编号 019 · 源码 src/pages/test · 开发导航残留页挂根路由

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 11-15 行注册为根路由 path: '/'（exact: true），第 16-20 行注册 /test（exact: true），两处 component 均为 test。
- 即应用默认落地页就是这个开发导航页。
- 按钮目标路由均已在路由表注册，其中 /data-verifying/:type/:id 规则覆盖 new/-1 与 view/-1 两个演示入参。

## 模块文件树

```text
test/
└── index.jsx
```

## 入口与结构
- 入口 src/pages/test/index.jsx：174 行单文件，无子目录。class 组件 Default，仅渲染三组 Divider/Space 包裹的按钮，点击用 this.props.history.push 跳转。
- 模块目录仅此一个 index.jsx，无样式、图片等资源文件。
- 跳转目标覆盖全站约 20 个路由：性能数据、性能趋势/弹窗、性能规则、阈值设置、缺数错数三态、总体监控、指标管理/组管理、测量与性能指标查询、报告模板与实例、四类性能数据查询页。
- 其中 /data-verifying/new/-1 与 /data-verifying/view/-1 是带参路由的固定演示入参。

## 数据来源
- 无任何接口请求，未引用 src/common/api 或 src/common/services 下的任何封装。

## 状态
- 无独立状态，未用 hox；类组件写法，未用 hooks。

## 复用组件
- 未引用 src/components/ 下组件，仅用 oss-ui 的 Button、Space、Divider。

## i18n
- 未使用 react-intl-universal / global-message；按钮文案硬编码中文。

## 风险与待定
- 确认为开发期导航/脚手架残留页，却挂在根路由 '/'，生产访问首页即暴露全部功能入口清单。
- 未引用 auth-button 做权限控制，全部按钮无条件渲染。
- 用 class 组件写法，与仓库其余函数组件风格不一致。
- 无测试文件；建议上线前替换根路由或加权限拦截。
