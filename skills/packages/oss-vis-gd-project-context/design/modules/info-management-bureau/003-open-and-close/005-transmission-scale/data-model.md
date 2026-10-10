# 005-transmission-scale · 网络资源（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-right.ts`（函数 `getRightFifteenGameWebResourcesApi`）
> mock 数据：`public/static/mock/info-management-bureau/fifteen-game-web-resources.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/transmission-scale/index.tsx`（轮询：15 分钟）

## getRightFifteenGameWebResourcesApi（网络资源）

- 源码：`web/services/info-management-bureau/open-and-close/section-right.ts`
- 入参：
  - `viewItemId`: `'fifteen-game-web-resources'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：源码中 `localMockUrl` 已注释（曾指向 `/static/mock/info-management-bureau/fifteen-game-web-resources.json`），实际依赖 fallback JSON
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-web-resources_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`）

### 原始响应结构（mock 对齐）

```ts
interface FifteenGameWebResourcesResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'fifteen-game-web-resources'
        viewItemData: {
            title: string;   // '开闭幕式与比赛日-网络资源'
            header: {
                counterFieldList: { /* type(指标id) / typeName(指标名称) / num(数量) / alarmNum(告警数) */ }[];
            };
            rows: Array<{
                type: string;             // 指标 id：'1'=行业专网，'2'=传输设备，'3'=5G备份网，'4'=临时布线，'5'=场馆接入
                type_format: string;      // 格式化值（converter 不消费）
                typeName: string;         // 指标名称，如 '行业专网'
                typeName_format: string;  // 格式化值（converter 不消费）
                num: string;              // 总数，如 '84'
                num_format: string;       // 格式化值（converter 不消费）
                alarmNum: string;         // 故障/告警数，如 '1'
                alarmNum_format: string;  // 格式化值（converter 不消费）
            }>;
        };
    };
}
```

> ⚠️ 差异：mock rows 含 `type: '4'`（临时布线）与 `type: '5'`（场馆接入）行，但前端模板（`viewItemDataTemplate`）只声明 type `'1'`-`'3'`（「临时布线」模板项已被注释掉），未命中模板的行被丢弃。

### converter 转换后返回值

```ts
type FifteenGameWebResourcesResult = Array<{
    title: string;    // row.typeName（模板 titleFieldName），如 '行业专网'
    name: string;     // row.subTypeName（模板 nameFieldName），缺省保留模板值，如 '设备故障数/总数'
    num: string;      // row.num，总数
    alarmNum: string; // row.alarmNum，故障/告警数
    type: string;     // 指标 id：'1' | '2' | '3'
    titleFieldName: string;  // 'typeName'
    nameFieldName: string;   // 'subTypeName'
    alarmNumFieldName: string; // 'alarmNum'
    numFieldName: string;    // 'num'
}>;
```

缺省模板（3 项，未被环境配置覆盖时）：

| type | title | name |
| --- | --- | --- |
| `'1'` | 行业专网 | 设备故障数/总数 |
| `'2'` | 传输设备 | 脱管数/总数 |
| `'3'` | 5G备份网 | CPE终端故障数/总数 |

### fallback / 空数据兜底

`err || isEmpty(rows)` 时直接返回缺省模板 `viewItemDataTemplate`（num/alarmNum 均为 0，见上表字段结构）。

## mock 数据来源路径

- 本地 mock：`public/static/mock/info-management-bureau/fifteen-game-web-resources.json`（源码中 localMockUrl 已注释，仅作参考形态）
- fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-web-resources_${area}.json`
