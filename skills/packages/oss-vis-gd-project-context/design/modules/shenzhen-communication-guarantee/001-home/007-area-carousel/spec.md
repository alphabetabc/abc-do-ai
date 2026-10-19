# 007-area-carousel · 区域轮巡（首屏，spec）

## 职责

首屏底部：默认所有保障区域轮巡展示，每帧含**区域图片 + 区域名称**；与顶部类型统计联动过滤。

## 布局（设计稿）

- 尺寸：1968×174.51
- left 934 / top 1760
- NoStylePanel 容器（无面板标题/背景）
- 初始展示 4 张卡片（`maxSliderCount=4`，2026-10-13 现场调整自 3），超出出左右箭头滑窗

## 组件构成

- 壳：`home/modules/area-carousel/index.tsx`（widget `subscribe` 订阅 `areaTypeFilter`）
- 共享组件：`sub-pages/components/area-carousel/`（两屏共用，含取数 hook `useAreaCarouselData`，禁止跨屏 import 服务层）
- 数据源同 center-map 打点接口（`getHomeAreaPointApi`，15 分钟轮询）

## 卡片视觉

- 尺寸（large 规格）：450×159（2026-10-13 现场调整自 586.5）；图片容器 180×135
- 结构：flex 左右（图左、名称右、垂直居中），仅名称无类型标签
- 名称样式：`rgba(206, 223, 255, 1)` / Source Han Sans CN / 36px / 500，超长省略
- 图片三级降级：接口 `imageUrl` → `${imageRoot}/area-thumb/${name}.png` → `default-thumb.png`；item 变化时 useEffect 重算图片地址（2026-10-14 修复：切换区域后缩略图不更新的问题），img key 改为 `item.id`

## 交互

- 自动轮巡：定时切换（间隔 environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval` **秒**，默认 60，2026-10-14 由分钟改为秒）；hover 暂停、离开恢复
- 自动轮巡到点 `dispatch(activeArea)` 广播当前区域，供 center-map TOOLTIP
- **联动**：订阅 `areaTypeFilter`，非 null 时仅轮巡该类型区域（按 `areaType` 过滤）；取消选中恢复全部
- **显隐**：订阅容器上下文 `useContainerContext().visible`，不可见时组件返回 null 不渲染（2026-10-14 轮播优化）
- 点击切屏：`switchViewByArea` 逻辑当前注释停用（2026-10-13 现场调整，点击卡片不切屏），切屏入口仅剩 center-map TOOLTIP 浮层

## 边界

- 某类型下无区域：组件返回 null（不渲染，空态样式待联调确认）
- 仅 1 个区域：停止轮巡，静态展示
