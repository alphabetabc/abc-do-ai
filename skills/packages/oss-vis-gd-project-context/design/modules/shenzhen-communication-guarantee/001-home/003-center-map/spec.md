# 003-center-map · 首屏地图（spec）

> 2026-10-10 迁移完成（004-03）；005 已接入 TOOLTIP 联动（activeArea 订阅 + 浮层 + 激活打点放大）与类型图层过滤（areaTypeFilter）。

## 职责

首屏中部：深圳地市地图 + 区域打点（默认全部区域）；轮巡联动的 TOOLTIP 浮层；类型联动图层过滤。

## 组件构成

- `index.tsx` / `map.ts` / `index.less` / `ActiveOverlayItem.tsx`，物理复制自信管局 `home/modules/center-map`
- 底图：EChartsMap（`~/web/components/ui/rc-echarts/map`，echarts geo），adcode `440300`（深圳）；geojson 位于 `public/static/map/geojson/`
- `map.ts`：`geoBuilder`（geo 数组 + 区县名白字 label）+ `mapPointTypes` 字典（打点类型 1-5：会场/参访区/酒店/交通枢纽/其它）；打点为 image:// symbol（`icon-map-<类型>.svg`，90×90，staticAssets.imageRoot 取路径），silent: true
- `ActiveOverlayItem.tsx`：TOOLTIP 浮层（OverlayItem + mutableLngLat，contentStyle bottom 165）；图片复用共享 `AreaThumbImage` 三级降级
- 数据：`getHomeAreaPointApi`（见同目录 data-model.md），组件内 15 分钟轮询；数据为空时不渲染 EChartsMap
- widget 注册 `subscribe.activeArea`（轮巡每帧 `dispatch` 广播）与 `subscribe.areaTypeFilter`（top-type-filter 点击 `dispatch` 广播）

## 布局

- NoStylePanel 1615×1200 + map-bg.png 容器；widgets 注册 left 1200 / top 400
- 用户手调：geo left 135 / right 24 / top 350 / bottom 350，区县名 label 30px + stroke；map-bg 居中 background-size 2960×1226
- TOOLTIP 浮层（用户 2026-10-10 定稿）：556 宽、padding 20、8px 圆角 + 4px 边框 `rgba(27,72,129,0.72)`、backdrop-blur 20；标题白字 40px/700；图 516×330 居中 + 0.75px 蓝描边，图片 `object-fit: contain` 原比例适配（信管局 ActiveOverlayItemBg SVG 光效未采用，纯 CSS 背景）

## 交互

- **TOOLTIP**：轮巡 activeArea 经 widget subscribe 注入 props，按 id 匹配打点生成 overlayInfo（经纬度 + 标题 + 原始行）渲染浮层；激活打点 ×2（symbolSize 180 / offset -64）且 zlevel +10；浮层点击 `switchViewByArea` 切区域屏
- **图层过滤**：订阅 `areaTypeFilter`，seriesBuilder 内按类型分图层生成 series；`areaTypeFilter` 非 null 且不等于图层类型名时该图层 series 返回 null（不渲染）；null 为全部
- **点击切屏**：打点本身 `silent: true` 不可点击；切屏入口为 TOOLTIP 浮层点击（`switchViewByArea`）

## 边界

- 类型过滤后无区域：地图保持深圳底图，无打点（空态）
- activeArea 未匹配到打点：不渲染浮层
- 打点图标 `icon-map-<类型>.svg` 与类型统计卡图标 `icon-<类型>.svg` 均已就位
