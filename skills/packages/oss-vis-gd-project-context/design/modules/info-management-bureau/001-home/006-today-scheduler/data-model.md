# 006-today-scheduler · 今日日程（data-model）

> 接口源码：`web/services/info-management-bureau/components/index.ts`。

## getTodaySchedulerDataApi

- viewItemId `today-competition-schedule`，返回：

```ts
{ id: area, name: areaName, time, title, status: inProgress, statusText: '进行中'|'未开始', raw }
```

- `id` 与 center-map 点位 id 联动
