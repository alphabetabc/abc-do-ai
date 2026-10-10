# 004-trunk-communication · 集群通信（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-right.ts`（函数 `getRightTrunkCommunicationApi`）
> mock 数据：`public/static/mock/info-management-bureau/fifteen-game-trunk-communication.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/trunk-communication/index.tsx`（轮询：15 分钟）

## getRightTrunkCommunicationApi（集群通信）

- 源码：`web/services/info-management-bureau/open-and-close/section-right.ts`
- 入参：
  - `viewItemId`: `'fifteen-game-trunk-communication'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/fifteen-game-trunk-communication.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-trunk-communication_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`）

### 原始响应结构（mock 对齐）

```ts
interface FifteenGameTrunkCommunicationResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'fifteen-game-trunk-communication'
        viewItemData: {
            title: string;   // '开闭幕式-集群通信'
            header: {
                counterFieldList: { /* type(指标id) / typeName(指标名称) / num(数量) / alarmNum(告警数) */ }[];
            };
            rows: Array<{
                type: string;             // 指标 id，mock 为 '1'
                type_format: string;      // 格式化值（converter 不消费）
                typeName: string;         // 指标名称，如 '和对讲终端'
                typeName_format: string;  // 格式化值（converter 不消费）
                num: string;              // 终端总数，如 '321'
                num_format: string;       // 格式化值（converter 不消费）
                alarmNum: string;         // 故障数，如 '22'
                alarmNum_format: string;  // 格式化值（converter 不消费）
            }>;  // converter 只取 rows[0]
        };
    };
}
```

> ⚠️ 差异：`num` / `alarmNum` 为字符串（header 声明 dataType String），前端原值透传；`*_format` 冗余字段不消费。

### converter 转换后返回值

```ts
type FifteenGameTrunkCommunicationResult = Array<{
    title: string;    // rows[0].typeName，如 '和对讲终端'
    name: string;     // 固定 '故障数/总数'
    num: string;      // rows[0].num，终端总数
    alarmNum: string; // rows[0].alarmNum，故障数
}>;
```

固定返回长度为 1 的数组（只取第一行）。

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回：

```ts
[{ title: '和对讲终端数', name: '故障数/总数', num: 0, alarmNum: 0 }]
```

## mock 数据来源路径

- 本地 mock：`public/static/mock/info-management-bureau/fifteen-game-trunk-communication.json`
- fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-trunk-communication_${area}.json`
