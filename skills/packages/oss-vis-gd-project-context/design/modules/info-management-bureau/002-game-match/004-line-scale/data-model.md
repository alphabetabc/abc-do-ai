# 004-line-scale · 专线规模（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-right.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/fifteen-game-line-scale.json`。

## getRightFifteenGameLineScaleApi

- 源码：`web/services/info-management-bureau/game-match/section-right.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id，来自 `currentArea.areaId`）
  - `viewItemId: 'fifteen-game-line-scale'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.MINUTE * 15`（15 分钟），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/fifteen-game-line-scale.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: fifteen-game-line-scale.json） */
interface FifteenGameLineScaleRow {
    type: string;             // 指标 id，如 '1'（重保专线）、'2'（视频会议系统）
    type_format: string;      // type 的展示格式化副本
    typeName: string;         // 指标名称，如 '重保专线'、'视频会议系统'
    typeName_format: string;  // typeName 的展示格式化副本
    num: string;              // 数量，如 '294'
    num_format: string;       // num 的展示格式化副本
    alarmNum: string;         // 告警数，如 '20'
    alarmNum_format: string;  // alarmNum 的展示格式化副本
}
```

外层为标准视图服务结构，header 声明 `type/typeName/num/alarmNum` 四个 counter 字段。

### converter / 转换逻辑

**不做转换**：请求成功且 `rows` 非空时直接 `return rows`，返回 `FifteenGameLineScaleRow[]` 原始行数组（含 `*_format` 冗余字段）。

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回固定两条全零默认结构：

```ts
[
    { typeName: '重保专线', num: 0, alarmNum: 0 },
    { typeName: '视频会议系统', num: 0, alarmNum: 0 },
]
```

注意：默认结构不带 `type/type_format/*_format` 字段，且 `num/alarmNum` 为 number（mock 中为 string）。未配置 `fallback` 回退函数。

### ⚠️ 差异

- 兜底默认值与真实 rows 的字段集不一致（默认值缺 `type` 等字段，`num/alarmNum` 类型不同），消费方需容忍两种形态。
