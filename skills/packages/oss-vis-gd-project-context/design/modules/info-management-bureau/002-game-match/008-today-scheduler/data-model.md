# 008-today-scheduler · 今日赛程（data-model）

> 接口源码：`web/services/info-management-bureau/components/index.ts`（与 home 视图共用 `getTodaySchedulerDataApi`；公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/today-game-scheduler.json`。

## getTodaySchedulerDataApi

- 源码：`web/services/info-management-bureau/components/index.ts`（接口平台文档：`http://10.10.2.8:9091/project/1251/interface/api/31254`，见源码注释）
- 入参：
  - 无函数入参
  - `viewItemId: 'today-competition-schedule'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: {}`
  - 环境配置项（页面侧）：`getEnvironment('info-management-bureau.gameMatchConfig.todayGameScheduler.interval') ?? 15`（赛程轮播切换间隔，秒，非请求参数）
  - `baseUrlType: 'sceneViewService'`
  - 轮询：是，页面侧 `useRequest` 设 `pollingInterval: TIME_RANGE.HOUR * 24`（24 小时）
  - `localMockUrl: '/static/mock/info-management-bureau/today-game-scheduler.json'`

### 原始响应结构（rows 元素，对齐 mock）

```ts
/** rows 行结构（mock: today-game-scheduler.json） */
interface TodaySchedulerRow {
    id: string;            // 比赛 id，如 '243'
    id_format: string;     // id 的展示格式化副本
    time: string;          // 比赛时段，如 '00:00:00~23:59:59'
    time_format: string;   // time 的展示格式化副本
    tittle: string;        // 标题（注意拼写为 tittle），mock 中均为 ''
    tittle_format: string; // tittle 的展示格式化副本
    area: string;          // 区域 id，如 '-2047149787'
    area_format: string;   // area 的展示格式化副本
    areaName: string;      // 区域（场馆）名称，如 '大运中心体育场'
    areaName_format: string; // areaName 的展示格式化副本
}
```

外层为标准视图服务结构，header 声明 `id/time/tittle/area/areaName` 五个 counter 字段。

### converter / 转换逻辑

逐行映射为赛程项：

```ts
interface TodaySchedulerItem {
    id: string;         // = row.area（⚠️ 用区域 id 作赛程项 id，非 row.id）
    name: string;       // = row.areaName，场馆名称
    time: string;       // = row.time，比赛时段
    title: string;      // = row.title（mock 字段实为 tittle，见差异）
    status: string;     // = row.inProgress：'1' 进行中 / '0' 未开始（mock 中无此字段，见差异）
    statusText: '进行中' | '未开始'; // inProgress === '1' ? '进行中' : '未开始'
    raw: TodaySchedulerRow; // 原始行数据
}
```

### fallback / 空数据兜底

- 请求层 `fallback`：`rows` 为空时经 `viewItemDataFallbackApi`（`web/services/info-management-bureau/loadFallbackData.ts`）请求 `getFallbackUrl('info-management-bureau', 'today-game-scheduler')` 的静态兜底 JSON。
- 转换层兜底：请求失败或 `rows` 仍为空时返回 `[]`。
- 页面层：`isEmpty(data)` 时本模块不渲染（返回 null）。

### ⚠️ 差异

- 源码读取 `d.title` 与 `d.inProgress`，但 mock rows 字段为 `tittle` 且**无** `inProgress` 字段——按 mock 数据运行时 `title` 为 `undefined`、`status` 为 `undefined`（`statusText` 走 `'未开始'` 分支）。真实接口字段以源码消费项（`title`/`inProgress`）为准。
- 转换后 `id` 取自 `row.area` 而非 `row.id`；页面选中回调再以 `item.id` 补写 `areaId`（见 `modules/today-scheduler/index.tsx` 的 `onChange`）。
