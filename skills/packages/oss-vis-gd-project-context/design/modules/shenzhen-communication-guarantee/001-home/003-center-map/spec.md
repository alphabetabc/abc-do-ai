# 003-center-map · 首屏地图（spec）

> 2026-10-10 迁移完成（004-03）；005 已接入 TOOLTIP 联动（activeArea 订阅 + 浮层）与类型图层过滤（areaTypeFilter）；2026-10-21（003 卡）完成重保区域两层结构与完整联动重构。

## 职责

首屏中部：深圳地市地图 + 两层打点（重保常显层 + 可过滤普通层）；重保 tip 常显与外移引导线；轮巡联动的普通点位 TOOLTIP；类型联动图层过滤；点击重保区域下钻。

## 组件构成

- `index.tsx` / `map.ts` / `index.less` / `ActiveOverlayItem.tsx`，物理复制自信管局 `home/modules/center-map`
- 底图：EChartsMap（`~/web/components/ui/rc-echarts/map`，echarts geo，`useRawEvent` 模式），adcode `440300`（深圳）；geojson 位于 `public/static/map/geojson/`
- `map.ts` 导出：
    - `geoBuilder`（geo 数组，区县名 label 关闭）
    - `mapPointTypes` 字典（会场/参访区/酒店/交通枢纽/其它），每类含 `iconUrl`（普通 `icon-map-normal-green.svg`，46×68）与 `iconKeyAreaUrl`（重保 `icon-map-key-area.png`，64×52）
    - `isKeyArea(item, ids?)`：重保白名单判定（`String(item.id)` 匹配；**ids 为空/未配置时返回 true，全量显示、不做重保划分**）
- `ActiveOverlayItem.tsx`：TOOLTIP 浮层，支持 `keyArea` prop（黄色 tip 样式 `scg-map-info--overlay--key-area`）与 `tipBottom`
- 数据：`getHomeAreaPointApi`（见同目录 data-model.md），组件内 15 分钟轮询；数据为空时不渲染 EChartsMap
- widget 注册 `subscribe.activeArea`（轮巡广播）与 `subscribe.areaTypeFilter`（top-type-filter 点击广播）

## 重保区域配置（纯 environment，无源码默认值）

配置键 `shenzhen-communication-guarantee.homeConfig.centerMap`（environment-local.json），index.tsx 一次性解构消费，`?? {}` 兜底：

```jsonc
{
    "importantAreaIds": ["100", "1460194794", "1134568079", "-798315596"], // 白名单（intId）：HC_FT_001 国交会场 / HC_QH_001 前海会场 / JT_BA_001 深圳机场 / CC1 市民中心
    "importantAreaIndicatorLines": { // tip 外移 + 引导线（key 为 intId，未配置的点位 tip 停在点位上方）
        "<intId>": { "name": "HC_QH_001", "longitude": 114.094116, "latitude": 22.386877, "waypoints": [[lon, lat], ...] },
    },
}
```

- 白名单与轮巡接口（`getMapAreaLayerApi` 的 areaId）同套 ID 体系
- 调整 tip 位置/折线只改 env，不动源码

## 交互（003 定稿：两层结构 + 初始/过滤态）

- **两层 series**：每个类型产 2 个 series——重保常显层（`isKeyArea` 命中，`zBase: 1000` 永远置顶，任何情况不被过滤）+ 普通层（仅 `areaTypeFilter === 类型名` 时渲染，排除重保点位）。seriesId `${类型}-key` / `${类型}-normal`
- **初始态（未选中类型）**：地图仅显示重保点位，普通点位不显示；轮播不启动（首屏 area-carousel `autoplay={!!areaTypeFilter}`），且初始态 auto 广播被拦截（`!areaTypeFilter && info.type !== 'click'` 不透传）
- **过滤态（选中类型）**：显示重保 + 该类型普通点位；普通点位 tip 随轮播 activeArea 显示（overlayInfo 命中重保时返回 null，避免双 tip）
- **重保 tip 常显**：`keyAreaOverlayList` 全量渲染重保 tip（黄色 keyArea 样式，位置可经 `importantAreaIndicatorLines` 外移），不参与轮播，点击 `switchViewByArea` 下钻
- **引导线**：配置了外移的重保点，echarts 追加 `lines` series（`polyline: true` 横平竖直折线：点位 → waypoints → tip 终点），颜色 `rgba(255, 242, 204, 1)`、width 3、zlevel 999
- **点击下钻**：series `silent: false` + EChartsMap `useRawEvent` 透传原生点击，`onMapPointClick` 仅重保点位（`params.data.__rawData`）触发 `switchViewByArea`；普通点位点击忽略
- **返回重置**：top-type-filter 监听容器 `visible=false` 时 `dispatch(areaTypeFilter, null)`，ScaleItemCard 受控（`value` prop）同步清高亮

## 布局与视觉要点

- **整屏亮度 / 区县划分（004 卡定稿）**：经素材替换承载——亮版 `page-background.png`、`home-bg.png`、`map-bg.png`（区县划分与区县名绘制于底图素材中）；代码层不加 ECharts 区县图层，geo label 保持 `show: false`
- 激活态不放大（用户 2026-10-21 裁决）：icon 恒定原始尺寸，激活仅 zlevel +10 置顶；`symbolOffset [0,0]` 中心锚定
- 普通轮播 tip `tipBottom` 30；重保 tip `tipBottom` 0
- `.react-echarts` 保留全尺寸 `::after` 蒙层（index.less L92-104，空背景，仅占位）
- tip 样式（index.less）：绿色 `.scg-map-info--overlay` 背景 `icon-map-normal-tip-green.svg`（207×179，图片窗口 200×127）；重保黄色 `.scg-map-info--overlay--key-area` 背景 `icon-map-key-area-tip-yellow.svg` + `tip-circle-yellow.png` 底部圆点（普通为 `tip-circle-green.png`）

## 边界

- env 未配置 `importantAreaIds`：全量显示（所有点位视为重保常显层，过滤仍按类型生效）
- 类型过滤后无普通区域：地图保持重保点位 + 深圳底图
- activeArea 命中重保或未匹配打点：不渲染轮播 tip（重保已由常显 tip 覆盖）
