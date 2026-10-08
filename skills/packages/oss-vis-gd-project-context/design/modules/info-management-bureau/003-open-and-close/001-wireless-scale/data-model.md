# 001-wireless-scale · 无线规模（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-left.ts`，viewPageArgs 带 `openAndCloseConfig.area`。

| 接口内容 | viewItemId | 返回结构 |
| --- | --- | --- |
| 基站 | `wireless-scale-station` | `{ top: 基站总数/退服数/退服率, bottom: 5G/4G退服总数 }`（结构同 game-match 无线规模） |
| 小区 | `wireless-scale-community` | `{ chartData: 4G/5G小区饼图, communityData }` |
