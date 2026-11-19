# protable

> 编号 018 · 源码 src/pages/protable · 无路由孤儿ProTable演示页

## 目录

- [路由](#路由) · [模块文件树](#模块文件树) · [入口与结构](#入口与结构) · [数据来源](#数据来源) · [状态](#状态) · [复用组件](#复用组件) · [i18n](#i18n) · [风险与待定](#风险与待定)

## 路由
- 未注册：在 src/routes/index.js 中 Grep "protable" 无匹配，没有任何路由指向该模块，属于孤儿页面。

## 模块文件树

```text
protable/
└── index.jsx
```

## 入口与结构
- 入口 src/pages/protable/index.jsx：仅 37 行单文件，无子目录。渲染一个 oss-ui ProTable 演示表格，仅两列（standardRuleId、auditUser）。
- ProTable 传 dataSource={[]} 静态空数组，rowKey 为 standardRuleId，数据完全依赖 request 回调。
- 无任何页面或组件链接到 protable，src/pages/test/index.jsx 的导航按钮清单中也没有它。

## 数据来源
- 使用 @Common/api 的 proxy.get 直接请求硬编码完整地址 http://10.10.2.233:9091/mock/20/rule/feiqi/viewRules（内网 mock 服务器地址，写死在代码中）。
- request 回调默认参数 pageSize: 20、current: 1、auditUser: '1243'，返回固定取 res.ruleDetailList。
- 未使用 src/common/intf-configs.js 的接口配置。

## 状态
- 无独立状态，仅一个空对象 params 常量；未用 hox。
- request 回调为 async/await 写法，固定返回 data/success/total 结构供 ProTable 消费。

## 复用组件
- 未引用 src/components/ 下组件，仅用 oss-ui 的 ProTable。

## i18n
- 未使用 react-intl-universal / global-message；列标题直接用英文字段名 standardRuleId、auditUser。

## 风险与待定
- 确认为测试残留：无路由入口、硬编码内网 mock IP（10.10.2.233）、写死请求参数 auditUser: '1243'，是 ProTable 组件用法验证代码。
- 请求写法为 proxy.get({ fullUrl }) 传完整地址，与仓库其余模块 request('路径', 配置) 的封装用法不一致，属孤例。
- 硬编码 IP 存在泄露内网拓扑的隐患，建议清理。
- 无测试文件。
