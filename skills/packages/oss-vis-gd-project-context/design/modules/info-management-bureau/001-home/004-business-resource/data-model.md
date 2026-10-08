# 004-business-resource · 右侧-十五运业务（data-model）

> 接口源码：`web/services/info-management-bureau/home/section-right.ts`。

## getRightBusinessResourceApi

- viewItemId `fifteen-game-business`，viewPageArgs 带 `homeConfig.area`
- 返回（空数据兜底 8 项）：

```ts
{ title, num, alarmNum, name, alarmName }
// name/alarmName 如 '基站数'/'退服数'、'专线数'/'中断数'
```
