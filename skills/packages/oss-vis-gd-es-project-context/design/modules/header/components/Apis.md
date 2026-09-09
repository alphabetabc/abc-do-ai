# Header 相关 API（[apps/main/request/header.ts](apps/main/request/header.ts)）

Header 模块直接依赖的两个接口函数，均基于通用 `getViewItemDataApi`，并通过 `runPromise` 统一处理错误。

## 公共依赖

```ts
import { defaultConverter, getViewItemDataApi } from "@/utils/request";
import { runPromise } from "@/utils/runPromise";

const baseUrlType = "sceneViewService";
```

> `baseUrlType` 决定从 `@/utils/request` 的环境配置中取哪个 baseURL。

## getGuaranteeTaskListApi

拉取任务下拉列表。

```ts
export const getGuaranteeTaskListApi = async () => {
    const [err, rows] = await runPromise(
        getViewItemDataApi({
            loggerText: "中屏-预警通知-指挥调度-保单列表",
            baseUrlType,
            localMockUrl: "/static/mock/emergency/guarantee-task-list.json",
            params: {
                viewPageArgs: {},
                viewItemId: "guarantee-task-list",
                viewPageId: "guarantee-left-page",
            },
            converter: defaultConverter,
        }),
    );

    if (err) {
        console.log("获取保单列表失败", { err });
        return [];
    }

    return rows.map((d: any) => ({ ...d, value: d.emerEventId, label: d.emerEventName }));
};
```

### 入参 / 响应

- **viewItemId**：`guarantee-task-list`
- **viewPageId**：`guarantee-left-page`
- **viewPageArgs**：`{}`（无需参数）
- **mock**：`/static/mock/emergency/guarantee-task-list.json`
- **返回**：标准 antd `options` 形态（`{ value, label, ...其它 }`），`TaskSelect` 用 `value` / `label` / `wdId` / `eventStartTime` / `eventEndTime`

### 错误兜底

失败返回 `[]`，`TaskSelect.isEmpty(taskOptions)` 时不渲染下拉。

## getNoticeApi

拉取实时公告列表。

```ts
let renderKey = 0;
export const getNoticeApi = async () => {
    const [err, rows] = await runPromise(
        getViewItemDataApi({
            loggerText: "中屏-预警通知-指挥调度-实时公告",
            localMockUrl: "/static/mock/emergency/guarantee-right-page-emergency-support-real-time-announcement.json",
            baseUrlType,
            params: {
                viewPageArgs: {},
                viewItemId: "emergency-support-real-time-announcement",
                viewPageId: "guarantee-right-page",
            },
            converter: defaultConverter,
        }),
    );

    if (err) {
        console.log("获取保单列表失败", { err });
        return [];
    }

    return rows.map((d: any) => ({ ...d, renderKey: `render-${renderKey++}` }));
};
```

### 入参 / 响应

- **viewItemId**：`emergency-support-real-time-announcement`
- **viewPageId**：`guarantee-right-page`
- **viewPageArgs**：`{}`
- **mock**：`/static/mock/emergency/guarantee-right-page-emergency-support-real-time-announcement.json`
- **返回**：每条带 `renderKey`（自增 `render-0`、`render-1` …），用于 React `key`

### 关键点

- `renderKey` 是模块级**自增**变量，进程内不会重置 —— 切换任务、轮询都会得到唯一 key
- 公告组件对 `key` 同时拼接 `real-` / `duplicate-` 前缀以区分实片段与重复片段

## 常见修改

| 需求                                  | 改哪儿                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| 调整任务下拉字段（如排序、加 `disabled`） | `getGuaranteeTaskListApi` 的 `rows.map(...)`                      |
| 调整公告字段（如追加时间）            | `getNoticeApi` 的 `rows.map(...)`                                   |
| 改 viewItemId / viewPageId            | `params` 内对应字段                                                 |
| 关闭 mock                             | 删 `localMockUrl`                                                   |
| 调整 loggerText                       | 保持 `中屏-预警通知-指挥调度-...` 约定，便于网络面板检索             |

## 相关

- 使用方：
  - [TaskSelect.md](./TaskSelect.md)
  - [Notice.md](./Notice.md)
- 配套：
  - [MissionItem.md](./MissionItem.md) 中的 `getViewItemDataApi`（政府/省/市级响应）

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/request/header.ts`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.0  | 2026-06-17 | 初始版本 |
