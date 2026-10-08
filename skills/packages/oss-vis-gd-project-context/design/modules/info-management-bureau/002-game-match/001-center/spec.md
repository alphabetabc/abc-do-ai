# 001-center · 中心场馆（spec）

> 源码：`web/pages/info-management-bureau/sub-pages/game-match/modules/center/`。注册名「中心场馆」，布局 0/0，订阅 `currentArea`。

## 组件构成

- `index.tsx`：数据通道 widget，无自身渲染
- `LazyImage.tsx`：场馆图渐进加载

## 行为

- 把 currentArea.name 写入 `viewContextState.gameMatchStadiumName`
- 驱动 `GameMatchCenterBackground`（由本模块导出、`sub-pages/index.tsx` 渲染）经 LazyImage 加载 `<staticAssets.stadiumImage>/<场馆名>.png`，失败回退 `default-stadium.png`
