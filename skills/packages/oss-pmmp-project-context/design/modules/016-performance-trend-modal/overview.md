# performance-trend-modal

> 编号 016 · 源码 src/pages/performance-trend-modal · 纯弹窗壳包裹performance-trend

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- src/routes/index.js 第 67-71 行注册：path 为 /performance-trend-modal，exact: true，无路由参数。
- src/hox/index.js 第 40-46 行的登录信息 mock 中也注册了菜单项 /pmmp/performance-trend-modal（operName 性能趋势）。
- src/pages/test/index.jsx 第 25 行有跳转按钮。

## 模块文件树

```text
performance-trend-modal/
└── index.jsx
```

## 入口与结构
- 入口 src/pages/performance-trend-modal/index.jsx：仅 39 行的单文件模块，无子目录。职责是把 performance-trend 页面包进 1184 宽的 Modal 弹窗展示。
- 无一级子组件。

## 数据来源
- 模块自身不请求任何接口；数据获取全部委托给被包裹的 src/pages/performance-trend。
- 关系确认：performance-trend-modal 第 4 行 import PerformanceTrend from '../performance-trend'，即 modal 引用 trend；trend 不反向引用 modal，是单向包裹关系。

## 状态
- 无独立状态，仅组件内 useState(modaVisible) 控制弹窗显隐；未用 hox。

## 复用组件
- src/components/custom-modal-footer（自定义弹窗底部按钮，onOk 仅关闭弹窗、无保存逻辑）。

## 实现细节
- Modal 配置：destroyOnClose、maskClosable: false、centered、getContainer 为 document.body、wrapClassName 为 alarm-window-context-modal、prefixCls 为 oss-ui-modal。
- 弹窗内直接渲染 PerformanceTrend 且不传任何 props，趋势页依赖的全局消息上下文在此弹窗路径下同样缺失。

## i18n
- 未使用 react-intl-universal / global-message；弹窗标题硬编码"性能趋势"。

## 风险与待定
- modaVisible 初始为 true 且关闭后只置 false，作为路由页直接打开时会立即弹窗、关闭后留白，无重开逻辑。
- Modal 传了非标准属性 height={492}，效果待定。
- 无测试文件；除弹窗壳外无独立逻辑，维护成本低。
