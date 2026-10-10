# 006-today-scheduler · 今日日程（data-model）

> 接口源码：web/services/info-management-bureau/components/index.ts
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/mock/info-management-bureau/today-game-scheduler.json、public/static/fallback/info-management-bureau/today-game-scheduler.json、public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-weather_<area>_<areaName>.json

## getTodaySchedulerDataApi（今日赛程）

- 函数定义：`getTodaySchedulerDataApi`（web/services/info-management-bureau/components/index.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/31254

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `today-competition-schedule` |
| viewPageArgs | `{}`（无参数） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | 无 |
| localMockUrl | `/static/mock/info-management-bureau/today-game-scheduler.json`（源码中**生效中**） |
| 轮询 | 组件层轮询（见 [spec.md](./spec.md)） |

### 原始响应结构（与 mock 对齐）

外层为视图服务通用包裹（`code: 200`、`message`、`data`），核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题，如「比赛日-中下-今日日程」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者，如「陈厚萍」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（id/time/tittle/area/areaName）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（比赛id/时间/标题/区域id/区域名称）
            fieldName: string;     // string，字段名（id/time/tittle/area/areaName）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，今日赛程行
}

interface Row {
    id: string;             // string，比赛 id（如 "243"）
    id_format: string;      // string，格式化副本
    time: string;           // string，比赛时间段，如 "00:00:00~23:59:59"
    time_format: string;
    tittle: string;         // string，标题（mock 中为空串；注意拼写为 tittle）
    tittle_format: string;
    area: string;           // string，场馆区域 id（与 center-map 打点 intId 同源，联动用）
    area_format: string;
    areaName: string;       // string，场馆名称（如「大运中心体育场」）
    areaName_format: string;
}
```

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`。随后 map 为：

```ts
interface TodaySchedulerItem {
    id: string;         // string，取自 area（场馆区域 id，非比赛 id），经 `todayScheduler:activeItem` 与中心地图联动
    name: string;       // string，取自 areaName，场馆名称
    time: string;       // string，透传 time
    title: string;      // string，取自 d.title（⚠️ 见下方差异）
    status: string;     // string，取自 d.inProgress（⚠️ 见下方差异），'1' 进行中 / '0' 未开始
    statusText: string; // string，'进行中'（inProgress === '1'）或 '未开始'
    raw: Row;           // object，原始行数据整体透传
}
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'today-game-scheduler'))` —— rows 为空时请求 `/common/static-file/fallback/info-management-bureau/today-game-scheduler.json`
- 最终兜底：出错或 rows 为空时返回 `[]`

### mock 数据来源

- public/static/mock/info-management-bureau/today-game-scheduler.json（localMockUrl，生效中）
- public/static/fallback/info-management-bureau/today-game-scheduler.json

⚠️ 差异：源码读取 `d.title` 与 `d.inProgress`，但 mock 与 fallback 的 rows 均只有 `tittle` 字段且**没有** `title` / `inProgress` 字段 —— 实际运行时 `title`/`status` 为 `undefined`，`statusText` 恒为 '未开始'。字段名以 mock 为准（`tittle`），源码存在拼写/字段缺失问题。

## getWeatherDataApi（场馆天气，今日日程配套公共接口）

- 函数定义：`getWeatherDataApi`（web/services/info-management-bureau/components/index.ts）
- 入参：`params: { area: 场馆id, areaName: 场馆名称 }`

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `ceremonies-weather` |
| viewPageArgs | `{ ...params }`（即 `{ area, areaName }`） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | 无 |
| localMockUrl | 无 |
| 轮询 | 否（按场馆选中/切换触发） |

### 原始响应结构（与 fallback mock 对齐）

外层为视图服务通用包裹，核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题「天气」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述「天气」
    author: string;         // string，作者，如「陈厚萍」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（region/weatherId/wearthName/temperature/aqiId/aqiName/aqiValue）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（地市/天气id/天气名称/温度/空气id/空气名称/空气质量值）
            fieldName: string;     // string，字段名（注意天气名称字段拼写为 wearthName）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，单场馆天气行
}

interface Row {
    region: string;         // string，地市（如「广州」）
    region_format: string;
    weatherId: string;      // string，天气图标 id（如 "1002"）
    weatherId_format: string;
    wearthName: string;     // string，天气名称（如「多云」；拼写为 wearthName）
    wearthName_format: string;
    temperature: string;    // string，温度（如 "32.2"）
    temperature_format: string;
    aqiId: string;          // string，空气质量图标 id（如 "0"）
    aqiId_format: string;
    aqiValue: string;       // string，空气质量数值（如 "42"）
    aqiValue_format: string;
    aqiName: string;        // string，空气质量等级（如「优」）
    aqiName_format: string;
}
```

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`，随后取 `rows[0]` 原样返回（不做字段映射）。

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-ceremonies-weather_<area>_<areaName>'))` —— fallback 文件名按场馆 id + 名称命名
- 最终兜底：出错或 rows 为空时返回 `{}`

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-weather_-2047149787_大运中心体育场.json
- public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-weather_-2028761466_广东省奥林匹克体育中心体育场.json
