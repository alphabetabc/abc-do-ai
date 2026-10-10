# 006-area-carousel · data-model

## useAreaCarouselData（取数 hook）

- 数据源：`getHomeAreaPointApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`，viewPageId `open-close-ceremonies-view` / viewItemId `competition-homepage-point`，viewPageArgs 空）
- 轮询：15 分钟（`TIME_RANGE.MINUTE * 15`）
- 返回：`{ data: GuaranteeArea[], interval }`；`interval` 读 environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval`（分钟，默认 15）

## 数据行（GuaranteeArea）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | any | 区域标识 |
| name | string | 区域名（卡片标题 / 缩略图文件名拼接） |
| areaType | string? | 区域类型（首屏类型过滤用） |
| imageUrl | string? | 缩略图直链（优先） |
| longitude / latitude | number | 经纬度（地图打点复用同一数据源） |

## 图片降级链

1. `item.imageUrl`
2. `shenzhen-communication-guarantee/area-thumb/${name}.png`（经 `getImageUrl` 走 BFF `/common/static-file/view-image`，支持无扩展名 stem 探测，详见 design backend/common/static-file.md）
3. `${staticAssets.areaThumbnail}/default-thumb.png`
