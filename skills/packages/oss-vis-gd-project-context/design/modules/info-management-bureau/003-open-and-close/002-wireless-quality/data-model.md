# 002-wireless-quality · 网络质量-left（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
> mock 数据：`public/static/mock/info-management-bureau/wireless-quality-rrc.json`、`public/static/mock/info-management-bureau/wireless-quality-online-user.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/wireless-quality/index.tsx`（两个 API 均轮询 15 分钟）

两个 API 的请求形态与转换逻辑完全一致，仅 `viewItemId` / mock 文件不同。

## getLeftWirelessQualityRRCApi（RRC 连接数）

- 源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
- 入参：
  - `viewItemId`: `'wireless-quality-rrc'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/wireless-quality-rrc.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-wireless-quality-rrc_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`）

### 原始响应结构（mock 对齐）

```ts
interface WirelessQualityRRCResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'wireless-quality-rrc'
        viewItemData: {
            title: string;   // '左中-无线质量-rpc连接数'
            header: {
                counterFieldList: { /* dataTime(时间) / maxValue(最大值) / averageValue(均值) */ }[];
            };
            rows: Array<{
                dataTime: string;       // 时间点，如 '12:20'
                maxValue: string;       // 最大值，如 '32300'
                averageValue: string;   // 均值，如 '12'
            }>;
        };
    };
}
```

> ⚠️ 差异：mock 文件内 `viewItemId` 为 `'wireless-quality-rpc'`（title 也是 rpc 连接数），与源码请求的 `wireless-quality-rrc` 拼写不一致，属 mock 侧拼写问题；fallback 目录文件名为 `open-close-ceremonies-view-wireless-quality-rrc_${area}`。

### converter 转换后返回值

```ts
interface WirelessQualityChartResult {
    dataTime: string[];      // rows.dataTime 列，折线 x 轴
    maxValue: number[];      // Number(rows.maxValue)，最大值曲线
    averageValue: number[];  // Number(rows.averageValue)，均值曲线
}
```

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。

## getLeftWirelessQualityOnlineUserApi（在线用户数）

- 源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
- 入参：
  - `viewItemId`: `'wireless-quality-online-user'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/wireless-quality-online-user.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-wireless-quality-online-user_${area}`
  - 是否轮询：是（15 分钟）

### 原始响应结构（mock 对齐）

与 RRC 接口同构，`viewItemId` 为 `'wireless-quality-online-user'`，title 为 `'左中-无线质量-在线用户数'`：

```ts
interface WirelessQualityOnlineUserResponse {
    code: number;
    message: string | null;
    data: {
        viewPageId: string;
        viewItemId: string;
        viewItemData: {
            title: string;
            header: { counterFieldList: { /* dataTime / maxValue / averageValue */ }[] };
            rows: Array<{
                dataTime: string;       // 时间点，如 '23:20'
                maxValue: string;       // 最大值，如 '23'
                averageValue: string;   // 均值，如 '19'
            }>;
        };
    };
}
```

### converter 转换后返回值

与 RRC 相同：`{ dataTime: string[], maxValue: number[], averageValue: number[] }`。

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。

## mock 数据来源路径

- RRC：`public/static/mock/info-management-bureau/wireless-quality-rrc.json`；fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-wireless-quality-rrc_${area}.json`
- 在线用户数：`public/static/mock/info-management-bureau/wireless-quality-online-user.json`；fallback：同目录 `open-close-ceremonies-view-wireless-quality-online-user_${area}.json`
