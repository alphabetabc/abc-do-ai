# 002-area-carousel · 区域轮巡（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（008-00 起与首屏**两屏同源**，走 `getMapAreaLayerApi`，viewItemId `map-area-layer`，全量区域轮巡，不做类型过滤；打点/tooltip 仍走 `getHomeAreaPointApi`）。
> 取数入口：共享 hook `web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/use-area-carousel-data.ts`（与首屏共用；壳组件不 import 首屏服务层，跨屏引用仅允许经 `sub-pages/components/`）。
> mock 路径：`public/static/mock/shenzhen-communication-guarantee/map-area-layer.json`。
> 完整契约（入参 / 原始响应 / fallback）详见首屏文档 `design/modules/shenzhen-communication-guarantee/001-home/007-area-carousel/data-model.md`，要点：rows `[{areaName(编码), areaId(与打点 intId 同套), areaTypeName(汉字), picUrl(名称，无消费点)}]`，hook 映射 `id=areaId`、`name=areaName`、`type=areaTypeName`（用户裁决 2026-10-12）。

## 消费差异（区域屏 vs 首屏）

- 区域屏轮巡消费**全部 rows**，不订阅 `areaTypeFilter` 交互字段做类型过滤
- 每帧展示：区域图片（前端静态资源拼接）+ `name`（区域编码）
- 点击卡片切区域上下文：`areaId` 可直接当区域屏接口 `area` 参数用（用户确认 2026-10-12，`resolveAreaAdcode` 回退 `area.id` 链路通）
