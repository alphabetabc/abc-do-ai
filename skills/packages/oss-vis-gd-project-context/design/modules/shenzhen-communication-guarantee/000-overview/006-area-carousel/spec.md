# 006-area-carousel · 区域轮巡组件（spec）

> 共享组件 `sub-pages/components/area-carousel/`（005 落码）。参考信管局 today-scheduler 轮播节奏（非复制）。

## 导出

- `AreaCarousel`：轮巡组件本体
- `AreaThumbImage`：区域缩略图（单卡片/地图 TOOLTIP 复用）
- `useAreaCarouselData`：取数 hook（见 data-model.md）

## AreaCarousel props

| prop | 说明 |
| --- | --- |
| data | 区域数组（打点数据行） |
| interval? | 自动轮巡间隔（分钟），默认 15；仅 1 个区域不轮巡 |
| maxSliderCount? | 单屏最多卡片数（两屏壳均传 3） |
| size? | `large`（首屏，卡片 586.5×159）/ `default`（区域屏，500×159）；图均 180×135 |
| defaultActiveItemId? | 初始激活项 id（找不到回落 0） |
| onChange? | `(activeItem, { type: 'auto' \| 'click' })` 激活项变化回调 |

## 行为

- antd Carousel（dots=false、超屏出箭头、infinite=false）+ `useIntervalTimer` 定时轮巡
- hover 暂停 / 离开恢复；`calculateGoToSlideIndex` 滑窗跟随激活卡
- 激活卡高亮（青色边框 + 内外发光）；`defaultActiveItemId` 或 data 变化时重置定位
- 图片 `object-fit: contain`（原比例适配，不裁切）

## AreaThumbImage

- 图片源三级降级：接口 `imageUrl` → `${areaThumbnail}/${name}.png`（经 `getImageUrl`，BFF view-image stem 探测）→ `default-thumb.png`
- 加载失败 onError 换缺省图（`key={src}` 强制重挂载）

## 卡片视觉

flex 左右结构（图左、名称右、垂直居中）；仅名称（无类型标签）`rgba(206,223,255,1)` / Source Han Sans CN / 36px / 500，超长省略（title 提示全名）。

## 使用方

| 使用方 | 差异 |
| --- | --- |
| home/modules/area-carousel | 订阅 areaTypeFilter 过滤；auto 广播 activeArea；click 切区域屏 |
| area/modules/area-carousel | 全量不联动；click 仅 setActiveArea |

> 两屏壳接线详见 [../../001-home/007-area-carousel/spec.md](../../001-home/007-area-carousel/spec.md) 与 [../../002-area/002-area-carousel/spec.md](../../002-area/002-area-carousel/spec.md)。
