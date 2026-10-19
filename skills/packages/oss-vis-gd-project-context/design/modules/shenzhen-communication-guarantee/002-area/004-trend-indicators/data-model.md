# 004-trend-indicators · 4G/5G 指标趋势（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/area/trend.ts`（`getAreaTrendApi`）
> 公共请求层：`web/services/request/getViewItemData.ts`（`getViewItemDataApi`）。
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/area-trend-4g.json` / `area-trend-5g.json`（当天 0 点起、2 小时一点；4g mock 为 00:00–14:00 共 8 点）
> 接口契约（服务端文档）：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「四、4G趋势指标」「五、5G趋势指标」

## 接口状态：已定稿并落码

- viewItemId：`key-guarantee-area-4g-trend` / `key-guarantee-area-5g-trend`（按 networkType 二选一）
- viewPageId：`open-close-ceremonies-view`（复用信管局视图页，2026-10-12 服务端确认）
- viewPageArgs：`{ area, time }`（area=区域 adcode；time=截止时间 `yyyy-mm-dd hh:mm:ss`，起始为当天 0 点）

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| viewItemId | string | `key-guarantee-area-4g-trend` / `key-guarantee-area-5g-trend` |
| viewPageId | string | `open-close-ceremonies-view` |
| viewPageArgs | object | `{ area, time }`（time 截止时间，起始当天 0 点） |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | `/static/mock/shenzhen-communication-guarantee/area-trend-4g.json` / `area-trend-5g.json` |
| 是否轮询 | - | 是（组件层 `pollingInterval` 15 分钟；`refreshDeps: [area]` 切区域即拉取） |

### 响应结构

视图服务统一响应壳（见 `defaultConverter`，`web/services/request/getViewItemData.ts`）：

```ts
/** 视图服务统一响应壳（getViewItemData） */
type TViewItemDataResponse = {
    code: number; // 响应码，200 成功
    message: string | null; // 提示信息
    data: {
        viewPageId: string; // 视图页 id
        viewItemId: string; // 视图项 id
        viewItemData: {
            title: string; // 视图项标题
            header: {
                dimFieldList: unknown[]; // 维度字段定义（本场景为空数组）
                counterFieldList: unknown[]; // 计数器字段定义（本场景为空数组）
            };
            rows: TTrendRow[]; // 趋势数据行（converter 取此字段）
        };
    };
};
```

`rows` 行结构（服务端契约，见 api-doc.md 四/五）：

```ts
type TTrendRow = {
    name: string; // 指标名称：'RRC最大连接数'/'RRC平均连接数'/'4G接通率'或'5G接通率'/'无线平均利用率'
    x: string; // 时间（hh:mi）
    y1: string; // 指标值
};
```

### converter / 转换逻辑

`defaultConverter` 取 `data.viewItemData.rows` 后，`getAreaTrendApi` 内按 `x`（hh24:mi）聚合为共用时间轴的四组指标序列（接通率指标名按 networkType 区分：`4G接通率` / `5G接通率`）：

```ts
/** getAreaTrendApi 返回值 */
type TAreaTrendData = {
    dataTime: string[]; // 共用时间轴（x 去重后的出现顺序）
    rrcMaxValue: (number | null)[]; // RRC最大连接数
    rrcAverageValue: (number | null)[]; // RRC平均连接数
    connectRate: (number | null)[]; // ${networkType}接通率
    utilization: (number | null)[]; // 无线平均利用率
};
```

值缺失 / 空串转 `null`（断点）；出错或 rows 为空返回 `EMPTY_TREND`。

### fallback / 空数据兜底

按既有范式（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）：

1. 请求成功但 `data.viewItemData.rows` 为空 → `viewItemDataFallbackApi` 走 fallback url：`getFallbackUrl('shenzhen-communication-guarantee', '<viewPageId>-<viewItemId>')`（`/common/static-file/fallback/shenzhen-communication-guarantee/<viewPageId>-<viewItemId>`，见 `web/services/request/getStaticApi.ts`）
2. 兜底默认值结构：全空趋势（图表空态 / 断点展示）
