# 001-top-type-filter · 顶部 5 类型统计（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/top-indicators.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## API：getTopIndicatorsApi

- **函数**：`getTopIndicatorsApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`）
- 复制自信管局同名接口，类型字典与 `share/presets.ts` 的 `AreaType` 一致

### 入参

| 参数 | 值 | 说明 |
| --- | --- | --- |
| viewPageId | `open-close-ceremonies-view` | 复用信管局视图页 |
| viewItemId | `competition-homepage-statistics` | 顶部统计视图项 |
| viewPageArgs | `{}` | 全量下发，类型过滤联动为纯前端 |
| baseUrlType | `sceneViewService` | |
| 环境配置（getEnvironment） | 无 | 本接口不读 env 配置 |
| 是否轮询 | 否 | 一次性请求 |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/top-indicators.json` | |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface TopIndicatorsResponse {
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
            /** string：视图项标题（"顶部5类型统计"） */
            title: string;
            /** object：维度字段列表，当前为空 */
            header: {
                /** array：维度字段定义，当前空数组 */
                dimFieldList: unknown[];
                /** array：计数器字段定义，当前空数组 */
                counterFieldList: unknown[];
            };
            /** TopIndicatorRow[]：统计行 */
            rows: TopIndicatorRow[];
        };
    };
}

interface TopIndicatorRow {
    /** string：区域类型（会场 / 参访区 / 酒店 / 交通枢纽 / 其它） */
    type: string;
    /** number：该类型区域数量 */
    num: number;
}
```

### converter / 转换逻辑

使用 `defaultConverter`（`web/services/request/getViewItemData.ts`）取 `data.viewItemData.rows`，随后在函数体内与固定 5 类型字典匹配：

```ts
interface TopIndicator {
    /** string：区域类型，固定枚举：会场 / 参访区 / 酒店 / 交通枢纽 / 其它（顺序固定） */
    type: string;
    /** number：该类型区域数量；服务端未下发时为 0 */
    num: number;
}
```

- 返回 `TopIndicator[]`，长度固定 5，顺序固定（会场 → 参访区 → 酒店 → 交通枢纽 → 其它）
- 服务端 row 按 `type` 匹配命中时 `num = row.num || 0`；未命中的类型保持 0
- 服务端多下发的类型（不在字典内）会被丢弃

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 直接返回 5 类型全 0 的默认结构：
  `[{ type: '会场', num: 0 }, { type: '参访区', num: 0 }, { type: '酒店', num: 0 }, { type: '交通枢纽', num: 0 }, { type: '其它', num: 0 }]`
- 线上响应 `rows` 为空时经 `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-competition-homepage-statistics')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/top-indicators.json`

## 待确认

- 类型字典（004-00 三-1）：服务端需按深圳屏配置出数 5 类型，type 枚举值定稿后在 presets.ts 登记
