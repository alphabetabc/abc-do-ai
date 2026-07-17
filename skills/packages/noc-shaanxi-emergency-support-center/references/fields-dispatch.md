# widgetFields 派发表（中屏 center 模块）

> 本表汇总中屏保障中心模块涉及的所有派发字段、payload 结构、派发方与消费方。修改派发逻辑前请先确认本表，再读源文件对照。

字段全部来自 `web/pages/emergency-support/modules/fields.ts`：

```ts
import { widgetFields } from '../fields';
// 派发：props.dispatch(widgetFields.getField('xxx'), payload);
```

## 总表

| 字段 key                        | 方向    | Payload 类型                                                                                        | 派发方                                                                       | 主要消费方                                                                    | 备注                                                                  |
| ------------------------------- | ------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `zoneSelect`                    | 出      | `{ provinceId, regionId, cityId, zoneId, zoneLevel }`                                               | `CenterZone`(初始化)、`CenterPath`、`CenterGis`(tab1)、`LeftGisDetail` | `CenterPath`、`CenterGis`(tab1) 全部 `useRequest` 的 `ready` 与 `refreshDeps` | 行政区状态机主入口；`TabButton` 切换时不派发 `zoneSelect`（只重置 `centerAreaId` / `centerAreaNeIds`） |
| `zoneTownSelect`                | 出      | `{ zoneId, zoneLevel } \| null`                                                                     | `CenterGis`(tab1)、`LeftGisDetail`                                           | `CenterGis`(tab1) 的「乡镇→区县」返回按钮                                     | 控制 GIS 是否处于「乡镇模式」                                         |
| `dateTimeSelect`                | 入      | `{ startTime, endTime }`                                                                            | 上层（其它模块派发）                                                         | 中屏所有 `useRequest` 的 `refreshDeps`                                        | 左屏时间面板                                                          |
| `dateTimeRefreshFixed`          | 入      | `any` (变更即触发刷新)                                                                              | 上层                                                                         | 中屏所有 `useRequest` 的 `refreshDeps`                                        | 用于左屏「固定」按钮                                                  |
| `center:tabChange`              | 出      | `TabChangeEnum`                                                                                     | `TabButton`                                                                  | 上层 + 右屏公告区隐藏控制                                                     | URL `?tab=2` 也可触发初始化派发                                       |
| `rightTabChanged`               | 出      | `{ key: 1 }`                                                                                        | `CenterPath`、`Gis`(tab1、tab2)                                              | 右屏轮播切换                                                                  | `key: 1` 表示右屏第二屏                                               |
| `rightSecondTabChanged`         | 出      | `{ key: '无线' \| '传输' \| 'BRAS' \| 'OLT' \| '动环' \| '基站机房' }`                              | `CenterPath`、`Gis`(tab1、tab2)                                              | 右屏第二屏详情列表 Tab                                                        | 字符串值与右屏渲染条件严格匹配                                        |
| `rightSecondTabAlarmParams`     | 出      | `{ alarmParams: { sessionId, statisticItemId, cellId, mainIndexId, roomMainIndexId?, pageIndex } }` | `CenterPath`                                                                 | 右屏详情列表                                                                  | `mainIndexId` 等取值见 `useEnvironment().emergencySupportAlarmConfig` |
| `rightSecondTabTransType`       | 出      | `{ type: '0' \| '1' ... }`                                                                          | `CenterPath`、`Gis`(tab1、tab2)                                              | 右屏第二屏「传输」详情                                                        | 默认为 `'0'`                                                          |
| `rightSecondTabTransZoneParams` | 出      | `{ zoneId, zoneLevel } \| {}`                                                                       | `CenterPath`、`Gis`(tab1、tab2)                                              | 右屏第二屏「传输」详情                                                        | 区县地市参数；传空对象 `{}` 表示全部                                  |
| `centerAreaId`                  | 出      | `string` (区域 id)                                                                                  | `TabButton`(重置时清空)、`Gis`(tab2 区域选中)                                | `TabContent2`                                                                 | 突发保障区域 id                                                       |
| `centerAreaNeIds`               | 出      | `{ neIds: string[], data: any[] \| any }`                                                           | `CenterPath`、`Gis`(tab1、tab2)                                              | 右屏 GIS 打点回显                                                             | `TabButton` 切回 tab1 时派发 `{ neIds: '', data: [] }` 重置           |
| `leftRepairNoticeParams`        | 出 / 入 | `{ intId, repairLevel, ... } \| ''` (清空)                                                          | `CenterGis`(tab1)、`Gis`(tab1、tab2)                                         | `Gis` 内 `useRequest` 控制 `ready`，并用于切回 tab1 的特殊渲染                | 「外部抢修等级跳转 GIS」入口；派发 `''` 表示清空                      |

## 行政区状态机（zoneSelect）

```
                     zoneLevel: province
                            │
                  双击省地图（或初始化）
                            ▼
                     zoneLevel: region
                            │
                  双击地市地图（CenterPath 触发 props.showGis）
                            ▼
                     zoneLevel: city   ← 在 GIS 模式下
                            │
                点击乡镇名称 (isTownNamePoint)
                            ▼
                     zoneLevel: town
                            │
                       返回上一层 → city
                            │
                   返回上一层（无 zoneTownSelect）→ region
```

`zoneSelect` payload 必须包含：

- `zoneLevel: ZoneLevelEnum`（来自 `~/web/services/emergency-support/enum`）
- `zoneId`: 当前级别对应的 id
- `provinceId`: 始终来自 `useEnvironment().province.provinceId`
- `regionId`: 进入 region 后填 regionId，province 时为 0
- `cityId`: 进入 city 后填 cityId，province/region 时为 0

派发规则参考 `CenterPath` 的 `dispatchZone` 实现。

## 右屏联动（pointClick / onScatterClick）

任何打点点击最终都收敛为「派发 `rightTabChanged` + `rightSecondTabChanged` + `centerAreaNeIds`」三件套，再根据网元类型补 `rightSecondTabTransType` / `rightSecondTabTransZoneParams` / `rightSecondTabAlarmParams`。

neType → Tab 映射（来自两份 Gis `pointClick` switch）：

| neType                          | 右屏 Tab               |
| ------------------------------- | ---------------------- |
| `201`, `3201`, `8104`           | 无线                   |
| `10005`, `1000501`–`1000505`    | 动环 (仅 tab1)         |
| `900`                           | BRAS                   |
| `2011`                          | OLT                    |
| `2008`, `2009`, `7111`, `2034`  | 传输 + 清空 zoneParams |
| `default`                       | 传输 + 清空 zoneParams |
| `point.isOpticalCable === true` | 传输 + 清空 zoneParams |

> tab2 的 `pointClick` 没有「`1000501`–`1000505` 动环分支」，处理动环 neType 时会落到 `default`，需要排查时注意。

## 易踩坑

- **`centerAreaId` 必须用 `string`，** 不能传 `null`/`undefined`，`TabButton` 切回 tab1 时清空派发的是 `''`。
- **清空场景统一用派发 `''`**：`leftRepairNoticeParams` 被清空时派发 `''` 而不是 `null`。
- **`zoneSelect` 中 `provinceId` 不要从 props 解构出来的 `drillZone` 取**，始终来自 `useEnvironment().province.provinceId`。
- **Tab 切换不会自动清空 `zoneSelect`，** `TabButton` 切回 tab1 时只重置 `centerAreaId` / `centerAreaNeIds`；省 `zoneSelect` 的初始化派发在 `CenterZone`（index.tsx）的 `useEffect([])` 中只执行一次。
- **`useRequest` 的 `ready` 守卫必须区分 `TabChangeEnum.tab1 / tab2`**，避免 tab 切换瞬间触发跨 tab 请求。

> 版本：v1.0 · 创建日期：2026-07-13
