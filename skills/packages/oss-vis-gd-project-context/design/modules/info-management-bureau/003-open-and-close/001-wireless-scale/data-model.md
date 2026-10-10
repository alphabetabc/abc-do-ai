# 001-wireless-scale · 无线规模（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
> mock 数据：`public/static/mock/info-management-bureau/wireless-scale-station.json`、`public/static/mock/info-management-bureau/wireless-scale-community.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/wireless-scale/index.tsx`（轮询：15 分钟）

## getLeftWirelessScaleStationApi（基站）

- 源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
- 入参：
  - `viewItemId`: `'wireless-scale-station'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/wireless-scale-station.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-wireless-scale-station_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`）

### 原始响应结构（mock 对齐）

```ts
interface WirelessScaleStationResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;      // string，视图页 id，如 'open-close-ceremonies-view'
        viewItemId: string;      // string，视图项 id，如 'wireless-scale-station'
        viewItemData: {
            title: string;       // string，标题，如 '左上-无线规模-基站'
            header: {
                counterFieldList: { dataType: string; fieldLabel: string; fieldName: string; fieldUnit: string; list: string }[];
                // 字段元信息：alarmNum(告警数) / num(总数) / rate(占比) / type(类型)
            };
            rows: Array<{
                alarmNum: number;  // 告警/退服数（header 声明 dataType String，mock 实际为 number）
                num: number;       // 总数（header 声明 String，mock 实际为 number）
                rate: string;      // 占比/退服率，如 '11%'
                type: string;      // 行类型：'total' | '5g' | '4g' | '1' | '2' | '3'（'1'/'2'/'3' 为冗余行，converter 不消费）
            }>;
        };
    };
}
```

> ⚠️ 差异：`header.counterFieldList` 声明 `alarmNum` / `num` 的 `dataType` 为 `String`，但 mock JSON 中实际是 `number`；converter 按原值透传，前端不做类型转换。mock rows 中存在 `type: '1'/'2'/'3'` 的行，converter 只消费 `total` / `5g` / `4g`。

### converter 转换后返回值

```ts
interface WirelessScaleStationResult {
    top: Array<{
        name: string;          // '基站总数' | '退服数' | '退服率'
        value: number | string; // total 行的 num / alarmNum / rate 原值
        level?: string;         // '退服数' 项固定 '1'（告警着色）
    }>;
    bottom: Array<{
        name: string;   // '5G退服/总数' | '4G退服/总数'
        num: number | string;   // 5g/4g 行的 num（总数）
        alarmNum: number | string; // 5g/4g 行的 alarmNum（退服数）
        rate: string;    // 如 '13.3%'
        level: string;   // 5G 项 '1'，4G 项 '2'
    }>;
}
```

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回全零默认结构：

```ts
{
    top: [
        { name: '基站总数', value: 0 },
        { name: '退服数', value: 0, level: '1' },
        { name: '退服率', value: 0 },
    ],
    bottom: [
        { name: '5G退服/总数', num: 0, alarmNum: 0, rate: '0%', level: '1' },
        { name: '4G退服/总数', num: 0, alarmNum: 0, rate: '0%', level: '2' },
    ],
}
```

## getLeftWirelessScaleCommunityApi（小区）

- 源码：`web/services/info-management-bureau/open-and-close/section-left.ts`
- 入参：
  - `viewItemId`: `'wireless-scale-community'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/wireless-scale-community.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-wireless-scale-community_${area}`
  - 是否轮询：是（15 分钟）

### 原始响应结构（mock 对齐）

```ts
interface WirelessScaleCommunityResponse {
    code: number;
    message: string | null;
    data: {
        viewPageId: string;
        viewItemId: string;
        viewItemData: {
            title: string;  // '左上-无线规模-小区'
            header: {
                counterFieldList: { /* totalNum(全部小区数) / fourGNum(4g小区数) / fiveGNum(5g小区数) / rate(45g比率) */ }[];
            };
            rows: Array<{
                totalNum: string;  // 全部小区数，如 '1088'
                fourGNum: string;  // 4G 小区数，如 '755'
                fiveGNum: string;  // 5G 小区数，如 '999'
                rate: string;      // 4/5G 比率，如 '50%'
            }>;  // mock 中仅 1 行，converter 只取 rows[0]
        };
    };
}
```

### converter 转换后返回值

```ts
interface WirelessScaleCommunityResult {
    chartData: Array<{
        value: number;  // Number(fourGNum) / Number(fiveGNum) 转数字
        name: string;   // '4G小区' | '5G小区'（饼图数据源）
    }>;
    communityData: {    // rows[0] 原样透传（string 字段）
        totalNum: string;
        fourGNum: string;
        fiveGNum: string;
        rate: string;
    };
}
```

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回 `{ chartData: [], communityData: {} }`。

## mock 数据来源路径

- 基站：`public/static/mock/info-management-bureau/wireless-scale-station.json`（本地 mock）；fallback 见 `public/static/fallback/info-management-bureau/open-close-ceremonies-view-wireless-scale-station_-2028761466,-1999284500,2119480143,243466997,-1667507826,-360734630.json`（文件名即 `_${area}` 后缀实例）
- 小区：`public/static/mock/info-management-bureau/wireless-scale-community.json`；fallback 同目录 `open-close-ceremonies-view-wireless-scale-community_${area}.json`
