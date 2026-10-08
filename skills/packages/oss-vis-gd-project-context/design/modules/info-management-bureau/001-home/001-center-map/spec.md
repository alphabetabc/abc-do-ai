# 001-center-map · 中心地图（spec）

> 源码：`web/pages/info-management-bureau/sub-pages/home/modules/center-map/`。注册名「中心地图」，布局 114/200，订阅 `todayScheduler:activeItem`。

## 组件构成

- `index.tsx`：EChartsMap + seriesBuilder
- `map.ts`：geoBuilder、`mapLegendTypes` 图例/系列定义
- `ActiveOverlayItem.tsx`：选中场馆浮层（场馆名 + 缩略图）
- `ActiveOverlayItemBg.tsx`：浮层背景

## 行为

- 按 `mapLegendTypes`（5g退服/4g退服/竞赛/非竞赛/开闭幕式 等类型）分 series，symbol 为 image 图标
- 选中项（id 匹配 `todayScheduler:activeItem`）symbolSize ×2、zIndex+10，渲染 `ActiveOverlayItem`（缩略图取 `staticAssets.stadiumThumbnail`）
- 数据 15 分钟轮询
- 地图点击场馆：`switchViewByStadiumInfo`（view-state，见 [../../000-overview/README.md](../../000-overview/README.md#2-视图结构与切换机制核心)），仅暂停轮换状态下生效

## 维护准则

- 点位类型/图标调整改 `map.ts` 与 `images/`
