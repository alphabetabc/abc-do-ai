# 001-center-map · 中心地图（data-model）

> 接口源码：`web/services/info-management-bureau/home/center.ts`。

## getHomeCenterMapDataApi

- viewPageId `open-close-ceremonies-view`，viewItemId `competition-homepage-point`，15 分钟轮询，空数据兜底
- 响应行映射：

```ts
{ id: intId, name: userlabel, type, longitude, latitude, ...raw }
```

- `type` 用于匹配 `mapLegendTypes` 系列；`id` 与今日赛程选中项联动
