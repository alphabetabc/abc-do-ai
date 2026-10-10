# 001-center · 中心场馆（data-model）

> 接口源码：无（本模块不发起任何数据请求）。
> mock 路径：无。

## 接口清单

本模块为纯展示/数据通道 widget，**不消费任何视图服务接口**。

- `web/pages/info-management-bureau/sub-pages/game-match/modules/center/index.tsx`：把 `currentArea.name` 写入 `viewContextState.gameMatchStadiumName`，无接口调用。
- 静态资源：场馆图来自 `staticAssets.stadiumImage` 目录下的 `<场馆名>.png`，加载失败回退 `default-stadium.png`。
