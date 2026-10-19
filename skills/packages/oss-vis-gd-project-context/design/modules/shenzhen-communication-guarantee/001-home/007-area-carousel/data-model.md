# 007-area-carousel · 区域轮巡（首屏 + 区域屏同源，data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（008-00 起两屏轮巡同源切 `map-area-layer`，打点/tooltip 仍走打点接口）
> 取数入口：共享 hook `web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/use-area-carousel-data.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/map-area-layer.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## API：getMapAreaLayerApi（008-00 新增，2026-10-12 落码）

- **函数**：`getMapAreaLayerApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`，含 `TMapAreaLayerRow` / `TMapAreaLayerParams` 类型）
- **契约**：docs-api-backend/shenzhen-communication-guarantee/api-doc.md 七（地图-区域图层-区域tooltip-区域轮巡）
- 取数：共享 hook `useAreaCarouselData` 内 `useRequest` 调用，**轮询 15 分钟**；前端按类型过滤后轮巡（订阅 `areaTypeFilter`，`areaTypeName` 汉字直接匹配）
- 轮巡间隔（前端行为）：environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval`（**秒**，2026-10-14 由分钟改为秒），未配置默认 60
- **两屏同源**：首屏底端与区域屏底端轮巡均消费此 hook（用户裁决 2026-10-12）
- 打点 / tooltip **不切此接口**（无经纬度），仍走 [../003-center-map/data-model.md](./../003-center-map/data-model.md) 的 `getHomeAreaPointApi`

### 入参（摘要）

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `map-area-layer` |
| viewPageArgs.areaType | `'201,202,203,204,205'`（MAP_AREA_TYPE_CODES 全量，前端自行过滤；参数预留可传子集） |
| viewPageArgs.area | 可选：区域ID，传入查单条；轮巡不传（拉全量） |
| baseUrlType | `sceneViewService` |
| 是否轮询 | 是（hook 内 15 分钟） |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/map-area-layer.json` |

### 本模块消费的字段子集（转换后）

```ts
/** map-area-layer 行（注意文档语义对调：areaName 为区域编码，picUrl 为区域名称） */
interface TMapAreaLayerRow {
    areaName: string;    // 区域编码（area_name）
    areaId: string;      // 区域ID（与打点接口 intId 同套，tooltip 联动匹配键）
    areaTypeName: string; // 区域类型名称（会场/参访区/酒店/交通枢纽/其它，汉字）
    picUrl: string;      // 区域名称（pic_url）；当前无消费点，预留
}
```

- hook 字段映射（用户裁决）：`id = areaId`、`name = areaName`（区域编码）、`type = areaTypeName`
- 区域图片三级降级（`AreaThumbImage`）：接口 `imageUrl` → `${staticAssets.areaThumbnail}/${name}.png`（= `IMAGE_PATH/shenzhen-communication-guarantee/area-thumb/`，name 为区域编码）→ `default-thumb.png`
- 空数据返回 `[]`，壳组件返回 null 不渲染

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/map-area-layer.json`

## 待确认（开放问题，见任务卡 008-00）

- 点击卡片切区域上下文需 area adcode；`areaId` 是否可当 adcode 用（开放问题 #2）
- 缩略图保留现状：走前端静态资源 `area-thumb/${name}.png`，`picUrl` 不启用（用户裁决 2026-10-12，008-00 开放问题 #3 关闭）
- 某类型下无区域时轮巡区空态样式（spec 边界项，样式待确认）
