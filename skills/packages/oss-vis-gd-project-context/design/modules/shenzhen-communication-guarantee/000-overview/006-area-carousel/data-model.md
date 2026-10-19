# 006-area-carousel · data-model

## useAreaCarouselData（取数 hook）

- 数据源：`getMapAreaLayerApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`，viewPageId `open-close-ceremonies-view` / viewItemId `map-area-layer`，viewPageArgs `{ areaType: '201,202,203,204,205' }` 全量拉取前端过滤；008-00 起两屏同源）
- 轮询：15 分钟（`TIME_RANGE.MINUTE * 15`）
- 返回：`{ data: GuaranteeArea[], interval }`；`interval` 读 environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval`（分钟，默认 15）
- hook 字段映射（用户裁决）：`id = areaId`（与打点 intId 同套）、`name = areaName`（区域编码）、`type = areaTypeName`（汉字类型）

## 数据行（GuaranteeArea）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | any | 区域标识（= areaId，tooltip 联动匹配键） |
| name | string | 区域编码（卡片标题 / 缩略图文件名拼接；areaName，用户裁决不取 picUrl） |
| type | string? | 区域类型汉字（会场/参访区/酒店/交通枢纽/其它，类型过滤用） |
| imageUrl | string? | 缩略图直链（当前接口无此字段） |

原始字段与契约详见 `design/modules/shenzhen-communication-guarantee/001-home/007-area-carousel/data-model.md`

## 图片降级链

1. `item.imageUrl`
2. `shenzhen-communication-guarantee/area-thumb/${name}.png`（经 `getImageUrl` 走 BFF `/common/static-file/view-image`，支持无扩展名 stem 探测，详见 design backend/common/static-file.md）
3. `${staticAssets.areaThumbnail}/default-thumb.png`
