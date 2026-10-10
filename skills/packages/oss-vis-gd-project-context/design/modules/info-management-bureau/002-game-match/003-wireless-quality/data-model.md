# 003-wireless-quality · 网络质量-left（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-left.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/wireless-quality-rrc.json`、`public/static/mock/info-management-bureau/wireless-quality-online-user.json`。

两个接口（RRC 连接数 / 在线用户数）的入参、原始行结构与转换后返回值完全一致，仅 `viewItemId` 与 mock 文件不同。

## getLeftWirelessQualityRRCApi（RRC 连接数）

- 源码：`web/services/info-management-bureau/game-match/section-left.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id，来自 `currentArea.areaId`）
  - `viewItemId: 'wireless-quality-rrc'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.MINUTE * 15`（15 分钟），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/wireless-quality-rrc.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: wireless-quality-rrc.json） */
interface WirelessQualityRow {
    dataTime: string;      // 时间，如 '12:20'
    maxValue: string;      // 最大值，如 '32300'
    averageValue: string;  // 均值，如 '12'
}
```

外层为标准视图服务结构，header 声明 `dataTime/maxValue/averageValue` 三个 counter 字段。

### converter / 转换逻辑

按行拆成三个平行数组（时序图表用），`maxValue/averageValue` 经 `Number()` 转数值：

```ts
interface WirelessQualityResult {
    dataTime: string[];      // 各行 dataTime
    maxValue: number[];      // Number(各行 maxValue)
    averageValue: number[];  // Number(各行 averageValue)
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。未配置 `fallback` 回退函数。

### ⚠️ 差异

- mock 文件内 `data.viewItemId` 为 `'wireless-quality-rpc'`（title 亦为「rpc连接数」），与源码请求的 `'wireless-quality-rrc'` 不一致；本地 mock 按 URL 文件命中，不影响请求，但真实接口 id 以源码 `'wireless-quality-rrc'` 为准。

---

## getLeftWirelessQualityOnlineUserApi（在线用户数）

- 源码：`web/services/info-management-bureau/game-match/section-left.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id）
  - `viewItemId: 'wireless-quality-online-user'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，15 分钟（同上），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/wireless-quality-online-user.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: wireless-quality-online-user.json） */
interface WirelessQualityRow {
    dataTime: string;      // 时间，如 '23:20'
    maxValue: string;      // 最大值，如 '23'
    averageValue: string;  // 均值，如 '19'
}
```

外层为标准视图服务结构，header 声明 `dataTime/maxValue/averageValue` 三个 counter 字段。

### converter / 转换逻辑

与 RRC 接口完全一致：

```ts
interface WirelessQualityResult {
    dataTime: string[];      // 各行 dataTime
    maxValue: number[];      // Number(各行 maxValue)
    averageValue: number[];  // Number(各行 averageValue)
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。未配置 `fallback` 回退函数。
