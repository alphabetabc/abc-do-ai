# 001-home · 首页视图

> 源码：`web/pages/info-management-bureau/sub-pages/home/`。信管局首页视图（ViewDimensionsTypes.Home）：全局保障态势总览（地图 + 上下指标带 + 左右业务面板 + 今日赛程）。

## 快速上手

- `index.tsx`：`ContainerProvider` + `WidgetsRender`（widget 体系见 [../000-overview/README.md](../000-overview/README.md)）
- `modules/screen.ts`：`createLargeScreen('info-management-bureau-home')`
- `modules/fields.ts`：交互字段 `todayScheduler:activeItem`（今日赛程项目）
- 接口层：`web/services/info-management-bureau/home/`（section-left / section-right / center），另有共享接口 `web/services/info-management-bureau/components/`

## widget 文档索引（按注册顺序）

| 子目录 | widget（注册名） | 布局 |
| --- | --- | --- |
| [001-center-map/](./001-center-map/spec.md) | 中心地图 | 114, 200 |
| [002-top-indicators/](./002-top-indicators/spec.md) | TOP-SECTION-指标 | 280, 93 |
| [003-bottom-indicators/](./003-bottom-indicators/spec.md) | bottom-指标 | 461, 796 |
| [004-business-resource/](./004-business-resource/spec.md) | 右侧-十五运业务 | 1490, 179 |
| [005-chbn-business/](./005-chbn-business/spec.md) | chbn业务 | 66, 181 |
| [006-today-scheduler/](./006-today-scheduler/spec.md) | 今日日程 | 470, 892 |

每个子目录含 `spec.md`（组件构成与交互）+ `data-model.md`（接口与字段结构）。

## 遗留代码

`modules/cloud-video/`、`game-private-network/`、`public-network/` 未注册 widget、无引用，属遗留代码（接口见 [005-chbn-business/data-model.md](./005-chbn-business/data-model.md)）。
