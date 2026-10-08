# 006-today-scheduler · 今日日程（spec）

> 源码：复用 `web/pages/info-management-bureau/sub-pages/components/today-scheduler/`。注册名「今日日程」，布局 470/892。

## 组件构成

- 共享组件 `today-scheduler/`（home / game-match 视图均使用，home 引共享层、game-match 用自有副本）

## 交互

- 选中项经 `todayScheduler:activeItem` 字段广播，联动 [001-center-map/spec.md](../001-center-map/spec.md)
