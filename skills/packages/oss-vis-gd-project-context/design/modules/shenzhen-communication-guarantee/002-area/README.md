# 002-area · 重保区域屏视图

> 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/area/`。screen-name：`shenzhen-communication-guarantee-area`。布局（设计稿 3840×2160）：左 4G 业务（926×600，l120/t216）/ 右 5G 业务（926×600，l2800/t216）；其下对称 4G/5G 指标趋势（926×1126，l120·l2800/t840）；中部地图区；底部 区域轮巡（1682×160，NoStylePanel 无标题，l1079/t1496）+ 保障资源（1668×280，Panel 含标题，l1086/t1680）。

## widget 索引

| 子目录 | 内容 |
| --- | --- |
| [001-network-business/](./001-network-business/spec.md) | 4G/5G 业务（一套组件两份配置）：顶端统计指标（基站/小区总数、退服数、退服率） |
| [002-area-carousel/](./002-area-carousel/spec.md) | 区域轮巡（S 会议全部区域，图片+名称） |
| [003-preposition-resource/](./003-preposition-resource/spec.md) | 保障资源：人员、通信车、发电车 |
| [004-trend-indicators/](./004-trend-indicators/spec.md) | 4G/5G 指标趋势（一套组件两份配置）：RRC 均值/最大值、接通率、无线平均利用率 |

## 进入方式

- 左下角切换按钮（首页 → 重保区域）
- 首屏地图打点点击（携带区域上下文 `activeArea`）

## 数据源

`web/services/shenzhen-communication-guarantee/area/`（见各 widget data-model.md；接口清单见 [../000-overview/README.md](../000-overview/README.md) §6）
