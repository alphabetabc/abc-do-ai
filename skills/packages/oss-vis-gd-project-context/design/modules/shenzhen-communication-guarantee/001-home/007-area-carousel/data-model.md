# 007-area-carousel · 区域轮巡（首屏，data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（复用地图打点接口，无独立接口）
> 取数入口：共享 hook `web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/use-area-carousel-data.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`（同打点接口）
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## API：getHomeAreaPointApi（复用）

- **函数**：`getHomeAreaPointApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`）
- 本模块无独立接口，与 [../003-center-map/data-model.md](./../003-center-map/data-model.md) 共用同一数据源；完整契约（入参、原始响应、fallback）见该文档
- 取数：共享 hook `useAreaCarouselData` 内 `useRequest` 调用，**轮询 15 分钟**；前端按 `areaType` 过滤后轮巡（订阅 `areaTypeFilter`）
- 轮巡间隔（前端行为）：environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval`（分钟），未配置默认 15

### 入参（摘要）

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `competition-homepage-point` |
| viewPageArgs | `{}` |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | 无（请求本身；轮巡间隔 env key 见上） |
| 是否轮询 | 是（hook 内 15 分钟） |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/home-area-point.json` |

### 本模块消费的字段子集（转换后）

```ts
/** 取自 HomeAreaPoint（打点行 + id/name 映射），本模块只消费以下字段 */
interface AreaCarouselItem {
    /** string：区域 id（= intId），激活态/初始定位匹配依据 */
    id: string;
    /** string：区域名称（= userlabel），轮巡展示文案；亦用于图片路径拼接 */
    name: string;
    /** string：区域类型（AreaType 枚举），类型联动过滤依据 */
    areaType: string;
    /** string：区域图片地址（mock 为空字符串，为空时走静态资源降级） */
    imageUrl?: string;
}
```

- 区域图片三级降级（`AreaThumbImage`）：接口 `imageUrl` → `${staticAssets.areaThumbnail}/${name}.png`（= `IMAGE_PATH/shenzhen-communication-guarantee/area-thumb/`）→ `default-thumb.png`
- 转换逻辑、原始响应结构与 fallback 行为同 003-center-map（空数据返回 `[]`，壳组件返回 null 不渲染）

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`

## 待确认

- 某类型下无区域时轮巡区空态样式（spec 边界项，样式待确认）
