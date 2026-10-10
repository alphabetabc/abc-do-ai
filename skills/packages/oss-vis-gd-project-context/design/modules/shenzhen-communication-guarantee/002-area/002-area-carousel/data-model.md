# 002-area-carousel · 区域轮巡（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（本模块**无独立接口**，复用 `getHomeAreaPointApi`，全量区域轮巡，不做类型过滤）。
> 取数入口：共享 hook `web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/use-area-carousel-data.ts`（与首屏共用；壳组件不 import 首屏服务层，跨屏引用仅允许经 `sub-pages/components/`）。
> mock 路径：`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`。

## API：getHomeAreaPointApi

- 函数名：`getHomeAreaPointApi`
- 源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（复制自信管局 `getHomeCenterMapDataApi`，viewItemId 沿用 `competition-homepage-point`）
- 契约细节另见首屏文档 `design/modules/shenzhen-communication-guarantee/001-home/003-center-map/data-model.md`

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| viewItemId | string | `'competition-homepage-point'` |
| viewPageId | string | `'open-close-ceremonies-view'`（复用信管局视图页） |
| viewPageArgs | object | `{}`（拉全量；区域屏轮巡不做类型过滤，过滤逻辑首屏才有） |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | `/static/mock/shenzhen-communication-guarantee/home-area-point.json` |
| 是否轮询 | - | 是（共享 hook `useAreaCarouselData` 内 `useRequest` 15 分钟轮询；「轮巡」仍指 UI 层自动轮播展示） |
| getEnvironment env key | - | 无（请求本身；轮巡间隔走 environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval`（分钟），未配置默认 15） |

### 原始响应结构（与 mock JSON 对齐）

```ts
/** 视图服务统一响应壳（getViewItemData） */
type TViewItemDataResponse = {
    code: number; // 响应码，200 成功（mock 为 200）
    message: string | null; // 提示信息（mock 为 null）
    data: {
        viewPageId: string; // 视图页 id，mock 值 'open-close-ceremonies-view'
        viewItemId: string; // 视图项 id，mock 值 'competition-homepage-point'
        viewItemData: {
            title: string; // 视图项标题，mock 值 '首屏地图打点'
            header: {
                dimFieldList: unknown[]; // 维度字段定义，mock 为空数组
                counterFieldList: unknown[]; // 计数器字段定义，mock 为空数组
            };
            rows: TAreaPointRow[]; // 区域打点数据行
        };
    };
};

/** mock rows 行结构 */
type TAreaPointRow = {
    intId: string; // 区域 id（mock 如 '1001'）
    userlabel: string; // 区域名称（mock 如 '深圳会展中心'）
    longitude: string; // 经度（字符串，mock 如 '114.0596'，勿按 number 消费）
    latitude: string; // 纬度（字符串，mock 如 '22.5426'）
    type: string; // 区域类型编号（'1'~'5'，信管局原字段，轮巡不消费）
    areaType: string; // 区域类型中文名（会场/参访区/酒店/交通枢纽/其它；本模块新增字段，依赖服务端补齐）
    imageUrl: string; // 图片地址（mock 为空字符串；区域图片实际不走服务端，采用前端静态资源目录 + 名称拼接）
};
```

### converter / 转换逻辑

使用公共 `defaultConverter`（`web/services/request/getViewItemData.ts`，取 `data.viewItemData.rows`），随后在 `getHomeAreaPointApi` 内做字段映射：

```ts
/** getHomeAreaPointApi 返回值 */
type TAreaPoint = {
    id: string; // 区域 id（由 intId 映射）
    name: string; // 区域名称（由 userlabel 映射）
    intId: string; // 原始区域 id（透传）
    userlabel: string; // 原始区域名称（透传）
    longitude: string; // 经度
    latitude: string; // 纬度
    type: string; // 区域类型编号（透传）
    areaType: string; // 区域类型中文名（透传）
    imageUrl: string; // 图片地址（透传，前端实际用静态资源拼接）
};
```

### fallback / 空数据兜底

- 请求成功但 `data.viewItemData.rows` 为空 → `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）走 fallback url：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-competition-homepage-point')` → `/common/static-file/fallback/shenzhen-communication-guarantee/open-close-ceremonies-view-competition-homepage-point`
- 请求出错或 rows 仍为空 → 返回 `[]`（空数组，轮巡无帧；组件层「仅 1 个区域静态展示」由 UI 处理）

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`（5 条区域数据：会场 / 参访区 / 酒店 / 交通枢纽 / 其它各 1 条）

## 消费差异（区域屏 vs 首屏）

- 区域屏轮巡消费**全部 rows**，不订阅 `areaTypeFilter` 交互字段做类型过滤
- 每帧展示：区域图片（前端静态资源拼接）+ `name`（区域名称）
