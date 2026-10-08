# 002-top-indicators · TOP-SECTION-指标（data-model）

> 接口源码：`web/services/info-management-bureau/home/`。

## getTopIndicatorsApi

- viewItemId `competition-homepage-statistics`，15 分钟轮询，空数据兜底
- 返回固定 5 项：

```ts
{ type: '竞赛场馆'|'非竞赛场馆'|'办公场所'|'酒店'|'医院', num }
```
