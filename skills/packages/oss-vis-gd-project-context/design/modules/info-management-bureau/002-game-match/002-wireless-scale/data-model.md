# 002-wireless-scale · 无线规模（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-left.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/wireless-scale-station.json`、`public/static/mock/info-management-bureau/wireless-scale-community.json`。

## getLeftWirelessScaleStationApi（基站）

- 源码：`web/services/info-management-bureau/game-match/section-left.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id，来自 `currentArea.areaId`）
  - `viewItemId: 'wireless-scale-station'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.MINUTE * 15`（15 分钟），`refreshDeps: [currentArea.areaId]`，`ready: isDefined(areaId)`
  - `localMockUrl: '/static/mock/info-management-bureau/wireless-scale-station.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: wireless-scale-station.json） */
interface WirelessScaleStationRow {
    alarmNum: number; // 告警数（退服数）
    num: number;      // 总数
    rate: string;     // 占比/退服率，如 '11%'
    type: string;     // 行类型：'total' 基站总数 / '5g' / '4g'（mock 另含 '1'/'2'/'3' 行，converter 忽略）
}
```

响应外层为标准视图服务结构：`code/message/data.viewPageId/data.viewItemId/data.viewItemData.{title, header.counterFieldList, rows}`（header 声明了 `alarmNum/num/rate/type` 四个 counter 字段）。

### converter / 转换逻辑

按 `row.type` 分派到固定展示位（`total` → top，`5g` → bottom[0]，`4g` → bottom[1]），返回：

```ts
interface WirelessScaleStationResult {
    /** 顶部三指标 */
    top: Array<{
        name: '基站总数' | '退服数' | '退服率'; // 固定文案
        value: number | string;                // 基站总数=num、退服数=alarmNum、退服率=rate
        level?: '1';                           // 退服数携带告警级别标记
    }>;
    /** 底部两条退服进度 */
    bottom: Array<{
        name: '5G退服/总数' | '4G退服/总数'; // 固定文案
        num: number;      // 总数
        alarmNum: number; // 退服数
        rate: string;     // 退服率，如 '13.3%'
        level: '1' | '2'; // 5G 固定 '1'，4G 固定 '2'
    }>;
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回全零默认结构：

```ts
{
    top: [
        { name: '基站总数', value: 0 },
        { name: '退服数', value: 0, level: '1' },
        { name: '退服率', value: '0%' },
    ],
    bottom: [
        { name: '5G退服/总数', num: 0, alarmNum: 0, rate: '0%', level: '1' },
        { name: '4G退服/总数', num: 0, alarmNum: 0, rate: '0%', level: '2' },
    ],
}
```

未配置 `fallback` 回退函数（仅本地 mock 与空数据默认值）。

### ⚠️ 差异

- mock rows 中 `type` 为 `'1'/'2'/'3'` 的行（各含 num/alarmNum/rate）不被 converter 消费，属 mock 冗余数据。
- mock 中 `total` 行 `num` 为 number 类型，而 header 声明 `dataType: 'String'`，类型以实际 JSON 为准。

---

## getLeftWirelessScaleCommunityApi（小区）

- 源码：`web/services/info-management-bureau/game-match/section-left.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id）
  - `viewItemId: 'wireless-scale-community'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，15 分钟（同上），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/wireless-scale-community.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows[0] 行结构（mock: wireless-scale-community.json，rows 仅 1 行） */
interface WirelessScaleCommunityRow {
    totalNum: string; // 全部小区数，如 '1088'
    fourGNum: string; // 4G 小区数，如 '755'
    fiveGNum: string; // 5G 小区数，如 '999'
    rate: string;     // 4/5G 比率，如 '50%'
}
```

外层为标准视图服务结构，header 声明 `totalNum/fourGNum/fiveGNum/rate` 四个 counter 字段。

### converter / 转换逻辑

取 `rows[0]` 作为 `communityData`，并生成饼图数据（注意 `Number()` 转数值）：

```ts
interface WirelessScaleCommunityResult {
    /** ECharts 饼图数据 */
    chartData: Array<{
        value: number;          // Number(fourGNum) 或 Number(fiveGNum)
        name: '4G小区' | '5G小区'; // 固定文案
    }>;
    /** 原始第一行数据，字段见 WirelessScaleCommunityRow */
    communityData: WirelessScaleCommunityRow;
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回 `{ chartData: [], communityData: {} }`。未配置 `fallback` 回退函数。

### ⚠️ 差异

- mock 中字段均为字符串；converter 对 `chartData.value` 做 `Number()` 转换，`communityData` 保持原样（字符串）。
