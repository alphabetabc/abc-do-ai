# 004-business-resource · 右侧-十五运业务（spec）

> 源码：`web/pages/info-management-bureau/sub-pages/home/modules/business-resource/`。注册名「右侧-十五运业务」，布局 1490/179。

## 组件构成

- `PanelRight`（372×782）内 `ScaleItemCard`
- 数据 15 分钟轮询，空数据兜底 8 项：4G/5G基站（基站数/退服数）、竞赛专网（专线数/中断数）、临时布线（信息点数/故障数）、5G备份网（CPE终端数/故障数）、视频会议系统（终端数/告警数）、跨境专线、集群通信

## 维护准则

- 新增指标卡复用 `scale-item-card.tsx`
