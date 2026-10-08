# 003-bottom-indicators · bottom-指标（spec）

> 源码：`web/pages/info-management-bureau/sub-pages/home/modules/bottom-indicators/`。注册名「bottom-指标」，布局 461/796。

## 组件构成

- `NoStylePanel`（999×79，fadeInUp）内自绘 `ind-item` 列表（图标 + 名称 + 数值）
- 图标路径：`IMAGE_PATH/info-management-bureau/<icon>`（icon 来自数据）

## 维护准则

- 指标项/图标由数据与环境配置模板驱动，不新增组件
