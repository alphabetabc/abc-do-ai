# 006-line-quality · 网络质量（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-right.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/ceremonies-line-quality-up.json`、`public/static/mock/info-management-bureau/ceremonies-line-quality-down.json`。

上行/下行流量两个接口的入参、原始行结构与转换后返回值完全一致，仅 `viewItemId` 与 mock 文件不同。

## getRightLineQualityUpApi（上行流量）

- 源码：`web/services/info-management-bureau/game-match/section-right.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id，来自 `currentArea.areaId`）
  - `viewItemId: 'ceremonies-line-quality-up'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.MINUTE * 15`（15 分钟），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/ceremonies-line-quality-up.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: ceremonies-line-quality-up.json） */
interface LineQualityRow {
    dataTime: string;          // 时间，如 '23:00'
    dataTime_format: string;   // dataTime 的展示格式化副本
    flowValue: string;         // 流量值，如 '0.226'
    flowValue_format: string;  // flowValue 的展示格式化副本
    flowRate: string;          // 流量利用率，如 '9.939'
    flowRate_format: string;   // flowRate 的展示格式化副本
}
```

外层为标准视图服务结构，header 声明 `dataTime/flowValue/flowRate` 三个 counter 字段。

### converter / 转换逻辑

按行拆成三个平行数组（时序图表用）。注意映射关系：**`maxValue` ← `flowRate`（利用率），`averageValue` ← `flowValue`（流量值）**，且均经 `Number()` 转数值：

```ts
interface LineQualityResult {
    dataTime: string[];      // 各行 dataTime
    maxValue: number[];      // Number(各行 flowRate)，流量利用率
    averageValue: number[];  // Number(各行 flowValue)，流量值
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。未配置 `fallback` 回退函数。

---

## getRightLineQualityDownApi（下行流量）

- 源码：`web/services/info-management-bureau/game-match/section-right.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id）
  - `viewItemId: 'ceremonies-line-quality-down'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，15 分钟（同上），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/ceremonies-line-quality-down.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: ceremonies-line-quality-down.json） */
interface LineQualityRow {
    dataTime: string;          // 时间，如 '12:15'
    dataTime_format: string;   // dataTime 的展示格式化副本
    flowValue: string;         // 流量值，如 '98.95'
    flowValue_format: string;  // flowValue 的展示格式化副本
    flowRate: string;          // 流量利用率，如 '87.1'
    flowRate_format: string;   // flowRate 的展示格式化副本
}
```

### converter / 转换逻辑

与上行接口完全一致（`maxValue` ← `flowRate`，`averageValue` ← `flowValue`）：

```ts
interface LineQualityResult {
    dataTime: string[];      // 各行 dataTime
    maxValue: number[];      // Number(各行 flowRate)
    averageValue: number[];  // Number(各行 flowValue)
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。未配置 `fallback` 回退函数。

### ⚠️ 差异

- mock 文件 `ceremonies-line-quality-down.json` 内 `data.viewItemId`/title 均为 `'ceremonies-line-quality-up'`（上行），与源码请求的 `'ceremonies-line-quality-down'` 不一致；本地 mock 按文件命中，真实接口 id 以源码为准。
