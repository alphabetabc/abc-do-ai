# 005-network-resource · 网络资源（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-right.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/fifteen-game-web-resources.json`。

## getRightFifteenGameWebResourcesApi

- 源码：`web/services/info-management-bureau/game-match/section-right.ts`
- 入参：
  - 函数入参 `areaId`（场馆区域 id，来自 `currentArea.areaId`）
  - `viewItemId: 'fifteen-game-web-resources'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { area: areaId }`
  - 环境配置项：无
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.MINUTE * 15`（15 分钟），`refreshDeps: [currentArea.areaId]`
  - `localMockUrl: '/static/mock/info-management-bureau/fifteen-game-web-resources.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: fifteen-game-web-resources.json） */
interface FifteenGameWebResourcesRow {
    type: string;             // 指标 id：'1' 行业专网 / '5' 场馆接入 / '2' 传输设备（mock 另含 '3' 5G备份网、'4' 临时布线，converter 忽略）
    type_format: string;      // type 的展示格式化副本
    typeName: string;         // 指标名称，如 '行业专网'
    typeName_format: string;  // typeName 的展示格式化副本
    num: string;              // 数量（设备总数），如 '84'
    num_format: string;       // num 的展示格式化副本
    alarmNum: string;         // 告警数（故障数/脱管数），如 '1'
    alarmNum_format: string;  // alarmNum 的展示格式化副本
}
```

外层为标准视图服务结构，header 声明 `type/typeName/num/alarmNum` 四个 counter 字段。

### converter / 转换逻辑

按 `row.type` 过滤并映射为展示卡片项，再按 `sort` 升序排列（1 行业专网 → 2 场馆接入 → 3 传输设备）：

```ts
interface NetworkResourceItem {
    title: string;                 // = row.typeName，如 '行业专网'
    name: '设备总数';               // 固定文案
    alarmName: '故障数' | '脱管数'; // type '1'/'5' 为 '故障数'，type '2' 为 '脱管数'
    num: string;                   // = row.num，设备总数
    alarmNum: string;              // = row.alarmNum，故障/脱管数
    sort: 1 | 2 | 3;               // 展示排序：行业专网 1、场馆接入 2、传输设备 3
}
```

### fallback / 空数据兜底

请求失败或 `rows` 为空时返回固定三条全零默认结构（顺序：行业专网、场馆接入、传输设备；无 `sort` 字段）：

```ts
[
    { title: '行业专网', name: '设备总数', alarmName: '故障数', num: 0, alarmNum: 0 },
    { title: '场馆接入', name: '设备总数', alarmName: '故障数', num: 0, alarmNum: 0 },
    { title: '传输设备', name: '设备总数', alarmName: '脱管数', num: 0, alarmNum: 0 },
]
```

未配置 `fallback` 回退函数。

### ⚠️ 差异

- mock rows 含 `type` 为 `'3'`（5G备份网2222）与 `'4'`（临时布线）的行，converter 不消费，属 mock 冗余数据。
- 兜底默认值 `num/alarmNum` 为 number 且无 `sort` 字段；真实转换值为 string 并带 `sort`，消费方需容忍两种形态。
