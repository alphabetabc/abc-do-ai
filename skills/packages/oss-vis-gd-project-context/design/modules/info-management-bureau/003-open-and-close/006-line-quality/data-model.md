# 006-line-quality · 网络质量（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-right.ts`（函数 `getRightUserCountDataApi`、`getRightLineQualityDownApi`；另有 `getRightLineQualityUpApi` 定义于同文件但当前视图未调用）
> mock 数据：`public/static/mock/info-management-bureau/open-close-ceremonies-view-new-guaranteed-area-users-chart2-all.json`、`...-5g.json`、`...-4g.json`、`public/static/mock/info-management-bureau/ceremonies-line-quality-down.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 `public/static/fallback/info-management-bureau/` 下 JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/line-quality/index.tsx`（两个 API 均轮询 15 分钟）

## getRightUserCountDataApi（用户数曲线，聚合 3 个接口）

- 源码：`web/services/info-management-bureau/open-and-close/section-right.ts`
- 串行发起 3 个 `getViewItemDataApi` 请求后聚合：
  - 子请求 1：`viewItemId: 'new-guaranteed-area-users-chart2-all'`（总用户数）
  - 子请求 2：`viewItemId: 'new-guaranteed-area-users-chart2-5g'`（5G 用户数）
  - 子请求 3：`viewItemId: 'new-guaranteed-area-users-chart2-4g'`（4G 用户数）
- 三个子请求公共入参：
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`getMockUrl('info-management-bureau', 'open-close-ceremonies-view-new-guaranteed-area-users-chart2-{all|5g|4g}')`，即 `/static/mock/info-management-bureau/` 下同名文件
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-new-guaranteed-area-users-chart2-{all|5g|4g}_${area}`
  - 是否轮询：是（`TIME_RANGE.MINUTE * 15`，由页面 useRequest 控制）

### 原始响应结构（mock 对齐，三个子请求同构）

```ts
interface GuaranteedAreaUsersChartResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'new-guaranteed-area-users-chart2-all' | '...-5g' | '...-4g'
        viewItemData: {
            title: string;   // 如 '新-保障区域用户-曲线图-all'
            header: {
                counterFieldList: { /* x(时间) / y1(用户数) */ }[];
            };
            rows: Array<{
                x: string;         // 时间点，如 '08:15'
                x_format: string;  // 格式化值（converter 不消费）
                y1: string;        // 用户数，如 '33304'
                y1_format: string; // 格式化值（converter 不消费）
            }>;
        };
    };
}
```

> ⚠️ 差异：`y1` 为字符串（header 声明 dataType String），converter 直接透传 `row.y1` 不转数字，由图表组件自行处理；`*_format` 冗余字段不消费。

### converter 转换后返回值

```ts
interface UserCountResult {
    xData: string[];  // dataAll 各行 x，x 轴时间序列
    yData: Array<{
        type: string;   // 固定 '总用户数' | '5G用户数' | '4G用户数'
        data: string[]; // 对应 rows 的 y1 列（原样字符串）
    }>;  // 长度固定 3，顺序：总用户数 → 5G用户数 → 4G用户数
}
```

任一子请求 `err || isEmpty(rows)` 时，对应序列为 `[]`（不阻塞其余序列）。

### fallback / 空数据兜底

无整体兜底返回值：各子请求失败/为空时对应曲线数据为空数组；三路全失败时返回 `{ xData: [], yData: [{ type: '总用户数', data: [] }, { type: '5G用户数', data: [] }, { type: '4G用户数', data: [] }] }`。

## getRightLineQualityDownApi（无线平均速率/专线流量下行）

- 源码：`web/services/info-management-bureau/open-and-close/section-right.ts`
- 入参：
  - `viewItemId`: `'ceremonies-line-quality-down'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: `{ area }`，`area` 取环境配置 `info-management-bureau.openAndCloseConfig.area`
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：`/static/mock/info-management-bureau/ceremonies-line-quality-down.json`
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-line-quality-down_${area}`
  - 是否轮询：是（15 分钟）

### 原始响应结构（mock 对齐）

```ts
interface CeremoniesLineQualityDownResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'ceremonies-line-quality-down'
        viewItemData: {
            title: string;   // '右下-专线质量-上行流量'
            header: {
                counterFieldList: { /* dataTime(时间) / flowValue(流量值) / flowRate(流量利用率) */ }[];
            };
            rows: Array<{
                dataTime: string;        // 时间点，如 '12:15'
                dataTime_format: string; // 格式化值（converter 不消费）
                flowValue: string;       // 流量值，如 '98.95'
                flowValue_format: string; // 格式化值（converter 不消费）
                flowRate: string;        // 流量利用率，如 '87.1'
                flowRate_format: string; // 格式化值（converter 不消费）
            }>;
        };
    };
}
```

> ⚠️ 差异：mock 文件 `ceremonies-line-quality-down.json` 内的 `viewItemId` / `title` 仍为上行（`ceremonies-line-quality-up` / '右下-专线质量-上行流量'），疑似从 up 复制而来，仅 rows 数值不同。页面将本接口数据渲染为「无线平均速率」（avaName 上行速率 / maxName 下行速率）。

### converter 转换后返回值

```ts
interface LineQualityChartResult {
    dataTime: string[];      // rows.dataTime 列，折线 x 轴
    maxValue: number[];      // Number(rows.flowRate)，页面展示为「下行速率」
    averageValue: number[];  // Number(rows.flowValue)，页面展示为「上行速率」
}
```

### fallback / 空数据兜底

`err || isEmpty(rows)` 时返回 `{ dataTime: [], maxValue: [], averageValue: [] }`。

## 附：getRightLineQualityUpApi（专线质量-上行流量，当前视图未调用）

定义于 `web/services/info-management-bureau/open-and-close/section-right.ts`，`viewItemId: 'ceremonies-line-quality-up'`，请求/转换逻辑与 down 完全一致（同样取 `flowRate` / `flowValue`）。页面 `line-quality/index.tsx` 中对它的调用已被注释（「专线流量」卡片），当前本视图仅调用 UserCount + Down 两个 API。

## mock 数据来源路径

- 用户数：`public/static/mock/info-management-bureau/open-close-ceremonies-view-new-guaranteed-area-users-chart2-all.json`、`open-close-ceremonies-view-new-guaranteed-area-users-chart2-5g.json`、`open-close-ceremonies-view-new-guaranteed-area-users-chart2-4g.json`
- 无线平均速率：`public/static/mock/info-management-bureau/ceremonies-line-quality-down.json`；fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-line-quality-down_${area}.json`
- 上行流量（未调用）：`public/static/mock/info-management-bureau/ceremonies-line-quality-up.json`
