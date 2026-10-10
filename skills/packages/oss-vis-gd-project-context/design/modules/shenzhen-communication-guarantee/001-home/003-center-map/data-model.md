# 003-center-map · 首屏地图（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## API：getHomeAreaPointApi

- **函数**：`getHomeAreaPointApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`）
- 首屏地图打点 / 区域轮巡数据源；复制自信管局 `getHomeCenterMapDataApi`

### 入参

| 参数                       | 值                                                                   | 说明                   |
| -------------------------- | -------------------------------------------------------------------- | ---------------------- |
| viewPageId                 | `open-close-ceremonies-view`                                         | 复用信管局视图页       |
| viewItemId                 | `competition-homepage-point`                                         | 首屏地图打点视图项     |
| viewPageArgs               | `{}`                                                                 | 拉全量，类型过滤纯前端 |
| baseUrlType                | `sceneViewService`                                                   |                        |
| 环境配置（getEnvironment） | 无                                                                   | 本接口不读 env 配置    |
| 是否轮询                   | 否                                                                   | 一次性请求             |
| localMockUrl               | `/static/mock/shenzhen-communication-guarantee/home-area-point.json` |                        |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface HomeAreaPointResponse {
    /** number：状态码，200 为成功 */
    code: number;
    /** string | null：提示信息，成功时为 null */
    message: string | null;
    data: {
        /** string：视图页 id（回显请求参数） */
        viewPageId: string;
        /** string：视图项 id（回显请求参数） */
        viewItemId: string;
        viewItemData: {
            /** string：视图项标题（"首屏地图打点"） */
            title: string;
            /** object：头部字段定义，当前均为空数组 */
            header: { dimFieldList: unknown[]; counterFieldList: unknown[] };
            /** HomeAreaPointRow[]：区域打点行 */
            rows: HomeAreaPointRow[];
        };
    };
}

interface HomeAreaPointRow {
    /** string：区域 id（前端映射为 id） */
    intId: string;
    /** string：区域名称（前端映射为 name） */
    userlabel: string;
    /** string：打点经度（⚠️ mock 中为字符串，勿按 number 消费） */
    longitude: string;
    /** string：打点纬度（⚠️ mock 中为字符串，勿按 number 消费） */
    latitude: string;
    /** string：区域序号（信管局原字段，本模块暂未使用） */
    type: string;
    /** string：区域类型（AreaType 枚举：会场 / 参访区 / 酒店 / 交通枢纽 / 其它，与 share/presets.ts 字典对齐）——本模块新增字段，依赖服务端补齐 */
    areaType: string;
    /** string：区域图片地址（mock 中为空字符串；TOOLTIP 图片实际采用前端静态资源目录 + 名称拼接，不依赖该字段） */
    imageUrl: string;
}
```

### converter / 转换逻辑

`defaultConverter` 取 rows 后，函数体内做字段映射（`{ ...d, id: d.intId, name: d.userlabel }`）：

```ts
type HomeAreaPoint = Array<
    HomeAreaPointRow & {
        /** string：区域 id（= intId） */
        id: string;
        /** string：区域名称（= userlabel） */
        name: string;
    }
>;
```

- 返回打点数组；原字段（intId / userlabel 等）通过展开保留

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 返回 `[]`（地图保持深圳底图，无打点）
- 线上 `rows` 为空时经 `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-competition-homepage-point')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/home-area-point.json`

## 待确认

- 004-00 一-1 事项 1：数据过滤方式（前端传参由后端过滤，还是拉全量自滤；当前按拉全量实现）
- 004-00 一-1 事项 2：`areaType` 字段服务端补齐，枚举值与 presets 字典对齐
