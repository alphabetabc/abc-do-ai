# 002-wireless-scale · 无线规模（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-left.ts`，viewPageArgs `{ area: areaId }`。

## getLeftWirelessScaleStationApi（基站）

- viewItemId `wireless-scale-station`：

```ts
{ top: [{name:'基站总数'|'退服数'|'退服率', value, level?}],
  bottom: [{name:'5G退服'|'5G总数'|'4G退服'|'4G总数', num, alarmNum, rate, level}] }
// 行 type: total / 5g / 4g
```

## getLeftWirelessScaleCommunityApi（小区）

- viewItemId `wireless-scale-community`：

```ts
{ chartData: [{value, name:'4G小区'|'5G小区'}], communityData: { fourGNum, fiveGNum, ... } }
```
