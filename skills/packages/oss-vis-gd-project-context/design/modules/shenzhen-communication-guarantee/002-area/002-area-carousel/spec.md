# 002-area-carousel · 区域轮巡（区域屏，spec）

## 职责

区域屏底部：所有保障区域**全量**轮巡（不受类型过滤联动），每帧含区域图片 + 区域名称。

## 布局（设计稿，组合 1061）

- 尺寸：1682×160
- left 1079 / top 1496
- NoStylePanel 容器（无面板标题/背景）
- 初始展示 3 张卡片（`maxSliderCount=3`），超出出左右箭头滑窗

## 组件构成

- 壳：`area/modules/area-carousel/index.tsx`
- 共享组件：`sub-pages/components/area-carousel/`（与首屏共用，取数走共享 hook `useAreaCarouselData`，壳内不 import 首屏服务层）

## 卡片视觉（default 规格）

- 尺寸：500×159；图片容器 180×135；其余与首屏一致
- 结构：flex 左右（图左、名称右、垂直居中），仅名称无类型标签
- 名称样式：`rgba(206, 223, 255, 1)` / Source Han Sans CN / 36px / 500，超长省略
- 图片三级降级：接口 `imageUrl` → `${imageRoot}/area-thumb/${name}.png` → `default-thumb.png`

## 交互

- 自动轮巡，间隔同首屏配置（environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval` 分钟，默认 15）；hover 暂停、离开恢复
- 无类型联动（全量）
- 点击卡片：`setActiveArea` 更新当前区域上下文（跨屏上下文见 `sub-pages/components/view-context.tsx`）
- 从首屏打点/轮巡切屏进入时，`defaultActiveItemId=activeArea?.id` 初始定位到该区域

## 边界

- 仅 1 个区域：静态展示
