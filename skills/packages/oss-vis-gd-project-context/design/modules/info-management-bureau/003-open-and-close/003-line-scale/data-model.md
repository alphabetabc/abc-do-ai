# 003-line-scale · 专线规模（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-right.ts`（函数 `getRightFifteenGameLineScaleApi`）
> mock 数据：`public/static/mock/info-management-bureau/fifteen-game-line-scale.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/line-scale/index.tsx`（轮询：15 分钟）

## getRightFifteenGameLineScaleApi（专线规模）

- 源码：`web/services/info-management-bureau/open-and-close/section-right.ts`
- 入参：
  - `viewItemId`: `'fifteen-game-line-scale'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/fifteen-game-line-scale.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-line-scale_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`）

### 原始响应结构（mock 对齐）

```ts
interface FifteenGameLineScaleResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'fifteen-game-line-scale'
        viewItemData: {
            title: string;   // '开闭幕式与比赛日-专线规模'
            header: {
                counterFieldList: { /* type(指标id) / typeName(指标名称) / num(数量) / alarmNum(告警数) */ }[];
            };
            rows: Array<{
                type: string;               // 指标 id：'1'=重保专线，'2'=视频会议系统
                type_format: string;        // type 格式化值（converter 不消费）
                typeName: string;           // 指标名称，如 '重保专线'
                typeName_format: string;    // 格式化值（converter 不消费）
                num: string;                // 总数，如 '294'
                num_format: string;         // 格式化值（converter 不消费）
                alarmNum: string;           // 中断/告警数，如 '20'
                alarmNum_format: string;    // 格式化值（converter 不消费）
            }>;
        };
    };
}
```

> ⚠️ 差异：mock rows 中 `num` / `alarmNum` 为字符串（header 声明 dataType String），前端按原值透传不做转换；`*_format` 冗余字段 converter 不消费。

### converter 转换后返回值

```ts
type FifteenGameLineScaleResult = Array<{
    title: string;    // row.typeName，如 '重保专线'
    name: string;     // 固定 '中断数/总数'
    num: string;      // row.num，总数
    alarmNum: string; // row.alarmNum，中断数
}>;
```

仅消费 `type === '1'`（重保专线）与 `type === '2'`（视频会议系统）两行，其余 type 丢弃。

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回：

```ts
[
    { title: '重保专线', name: '中断数/总数', num: 0, alarmNum: 0 },
    { title: '视频会议系统', name: '中断数/总数', num: 0, alarmNum: 0 },
]
```

## mock 数据来源路径

- 本地 mock：`public/static/mock/info-management-bureau/fifteen-game-line-scale.json`
- fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-line-scale_${area}.json`
