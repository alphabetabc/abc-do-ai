# MissionItem（[response-level/mission-item/index.tsx](apps/main/app/components/header/response-level/mission-item/index.tsx)）

响应级别模块的核心展示组件。展示三类响应等级：

- 政府响应（`government-response`）
- 省级响应（`province-response`）
- 市级响应（`region-response`，按 1~4 级聚合统计）

## Props

```ts
interface MissionItemProps {
    eventId: string;                    // 保障任务 ID（= emerEventId）
    enableEmptyDataNull?: boolean;     // 数据未就绪时是否渲染 null，默认 false
}
```

## 数据请求

三个独立 `getViewItemDataApi` 调用，挂 `viewPageId: "guarantee-left-page"`，`viewPageArgs: { emerEventId: eventId }`：

| viewItemId              | 用途     | 响应处理                              | mock 地址                                                                          |
| ----------------------- | -------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| `government-response`   | 政府响应 | 取 `rows[0]`                          | `/static/mock/emergency/guarantee-left-page-government-response.json`              |
| `province-response`     | 省级响应 | 取 `rows[0]`                          | `/static/mock/emergency/guarantee-left-page-province-response.json`                |
| `region-response`       | 市级响应 | 按 `responseLevel` 1~4 分组统计数量/城市列表 | 无 mock（走真实接口）                                                              |

市级数据组装：

```ts
const newRes = [1, 2, 3, 4].map(level => ({
    responseLevel: level,
    responseName: `${['一', '二', '三', '四'][level-1]}级`,
    count: rows.filter(r => String(r.responseLevel) === String(level)).length,
    rate:  count / total,
    cities: rows.filter(r => String(r.responseLevel) === String(level))
                .map(r => r.responseRegion),
}));
```

兜底数据：`defaultCityData`（4 个 0）。

## 轮询配置

```ts
const { interval = 300 } = useEnvironment("gd-emergency-support.modules.security-mission.request") ?? {};

useRequest(() => Promise.all([getGovernmentData(), getProvincialData(), getCityData()]), {
    refreshDeps: [eventId],
    ready: isDefined(eventId),
    pollingInterval: interval * TIME_RANGE.SECOND,   // 默认 300s
    onSuccess: () => setShow(true),
});
```

> `eventId` 变化会自动刷新；空值时 `ready: false` 不发请求。

## 渲染结构

```text
.mission-item  (flex gap-x-2.5)
├── .mission-item-header
│   ├── [data-id="government-response-level"]
│   │   └── "政府响应"  +  大字号 等级数字 + "级"  (或 "无")
│   └── [data-id="province-response-level"]
│       └── "省级响应"  +  大字号 等级数字 + "级"  (或 "无")，左右分隔线
└── [data-id="city-response-level"]
    ├── "市级响应"
    └── .city-levels-section (4 列)
        └── Tooltip(市X级响应：城市列表)
            └── .level-main
                ├── .level-bar  (背景 = getBgColorByLevel, 右侧 2px 实线 = getColorByLevel)
                │   └── .level-name ("一级"...)
                └── .level-value (城市数量)
```

## 颜色映射

```ts
getColorByLevel:   // 数字主色
    1 → rgba(255, 88, 87)     2 → rgba(249, 144, 42)
    3 → rgba(255, 237, 0)     4 → rgba(11, 217, 255)
    default → white

getBgColorByLevel: // 背景填充（半透明）
    1 → rgba(255, 38, 35, 0.22)
    2 → rgba(255, 147, 11, 0.2)
    3 → rgba(255, 237, 0, 0.2)
    4 → rgba(22, 153, 241, 0.2)
    default → ""

getTextColorByLevel: // 等级名文本色
    1 → rgba(255, 139, 138)
    2 → rgba(255, 187, 121)
    3 → rgba(255, 237, 0)
    4 → rgba(11, 217, 255)
    default → white
```

## 空数据兜底

- 政府/省级无 `responseLevel` → 显示「无」字样（28px、半透明白）
- 市级无数据 → 仍然渲染 4 个等级条，`count = 0`
- `enableEmptyDataNull === true` 且首次请求未完成 → 整体 `return null`

## 样式表（[response-level/mission-item/index.css](apps/main/app/components/header/response-level/mission-item/index.css)）

| 选择器                       | 关键属性                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| `.mission-item`              | padding 18px、字号 24px                                          |
| `.mission-item-header`       | flex space-between                                               |
| `.level-info`                | flex column，标题 24px                                           |
| `.level-value`               | `D-DIN-PRO` 24px                                                 |
| `.level-unit`                | `Source Han Sans CN` 20px                                        |
| `.city-levels-section`       | flex space-between，row-gap 2px                                  |
| `.level-bar`                 | min-width 60px、height 24px、flex row，文字左对齐                |
| `.level-bar .level-name`     | 60px、24px、`Source Han Sans CN`                                 |
| `.level-value`（市级数值）   | `D-DIN-PRO` 24px、margin-left 8px                               |
| `.city-levels-header`        | 24px、宽 50px、margin-bottom 5px                                 |

> 外层 `.ResponseLevelV2----root` 的覆写优先级更高，最终生效样式以 [response-level/index.css](apps/main/app/components/header/response-level/index.css) 为准。

## 常见修改

| 需求                          | 改哪儿                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| 调整等级颜色                  | `getColorByLevel / getBgColorByLevel / getTextColorByLevel`             |
| 调整轮询周期                  | `environment.json` 中 `gd-emergency-support.modules.security-mission.request.interval` |
| 接入新维度（如同级单位）       | 新增 `getViewItemDataApi` 调用 + 渲染块                                |
| 调整等级列宽                  | `.level-main` 的 `width: 100px`                                        |
| Tooltip 文本格式              | `<Tooltip title={...}>` 字符串模板                                    |
| 数据加载前隐藏                | 传 `enableEmptyDataNull` 或在父级 `ResponseLevelV2` 控制挂载            |

## 依赖

- `react`：`useState`
- `antd`：`Tooltip`
- `ahooks`：`useRequest`
- `@/utils/request`：`getViewItemDataApi`
- `@/hooks/useIntervalTimer`：`TIME_RANGE`
- `@/hooks/useEnvironment`：`useEnvironment`
- `@/utils`：`isDefined`
- `./index.css`

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/response-level/mission-item/index.tsx`
- 配套样式：`apps/main/app/components/header/response-level/mission-item/index.css`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.0  | 2026-06-17 | 初始版本 |
