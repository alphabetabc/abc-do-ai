# 001-network-business · 4G/5G 业务（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/area/section-left.ts`（`getAreaNetworkBusinessApi`）
> 公共请求层：`web/services/request/getViewItemData.ts`（`getViewItemDataApi`）。
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/area-network-business-4g.json` / `area-network-business-5g.json`
> 接口契约（服务端文档）：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「二、4G业务」「三、5G业务」

## 接口状态：已定稿并落码

- viewItemId：`key-guarantee-area-4g-business` / `key-guarantee-area-5g-business`（按 networkType 二选一）
- viewPageId：`open-close-ceremonies-view`（复用信管局视图页，2026-10-12 服务端确认）
- viewPageArgs：`{ area }`（区域 adcode，随区域切换联动）

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| viewItemId | string | `key-guarantee-area-4g-business` / `key-guarantee-area-5g-business` |
| viewPageId | string | `open-close-ceremonies-view` |
| viewPageArgs | object | `{ area }`（区域 adcode） |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | `/static/mock/shenzhen-communication-guarantee/area-network-business-4g.json` / `...-5g.json` |
| 是否轮询 | - | 是（组件层 `pollingInterval` 15 分钟；`refreshDeps: [area]` 切区域即拉取，2026-10-12 按代码回填） |

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
            rows: TNetworkBusinessRow[]; // 业务数据行（converter 取此字段）
        };
    };
};
```

`rows` 行结构（服务端契约，见 api-doc.md 二/三）：

```ts
type TNetworkBusinessRow = {
    type: string; // 类型：'4G基站'/'4G小区' 或 '5G基站'/'5G小区'
    num: string; // 总数
    retireNum: string; // 退服数
    retireRate: string; // 退服率（%）
};
```

### converter / 转换逻辑

`defaultConverter` 取 `data.viewItemData.rows` 后，`getAreaNetworkBusinessApi` 内按 `type` 匹配 `${networkType}基站` / `${networkType}小区` 行并转换为展示结构：

```ts
/** getAreaNetworkBusinessApi 返回值 */
type TNetworkBusinessData = {
    station: { name: string; value: number | string; level?: string }[]; // 基站：总数/退服数(level '1')/退服率
    community: { name: string; value: number | string; level?: string }[]; // 小区：同上
};
```

行缺失时 `toScaleItems` 返回 null，兜底 `EMPTY_STATION` / `EMPTY_COMMUNITY`（全 0，退服率 `'0%'`）。

### fallback / 空数据兜底

按既有范式（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）：

1. 请求成功但 `data.viewItemData.rows` 为空 → `viewItemDataFallbackApi` 走 fallback url：`getFallbackUrl('shenzhen-communication-guarantee', '<viewPageId>-<viewItemId>')`（`/common/static-file/fallback/shenzhen-communication-guarantee/<viewPageId>-<viewItemId>`，见 `web/services/request/getStaticApi.ts`）
