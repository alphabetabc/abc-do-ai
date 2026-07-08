---
name: gd-es-next-right-real-time-impact-history-time
title: 历史数据查看参考（跨子模块）
description: 全局 store.right.historyTime 在 NetworkScale 与 damage-to-towns 两子模块中的数据流、消费方式、当前实现与修改约束。所属 Skill: gd-es-next-right-real-time-impact。
version: 1.5.0
---

# 历史数据查看（跨子模块）

> `store.right.historyTime`（`store.ts:87`）是全局状态，初始 `null`，NetworkScale 写入，两子模块消费。
> **`null` 语义**：表示"未选择历史时间"，请求时不传 `dataTime`，由后端默认返回最新数据。

---

## 全局数据流

```
NetworkScale 日历 Dropdown → setHistoryTime(date) → store.right.historyTime
                                                          │
                              ┌───────────────────────────┤
                              ▼                           ▼
                     NetworkScale                    damage-to-towns
              dataTime: historyTime ?? undefined   getTownDamageStatisticsApi (leftStatistics)
              (null 时不传 dataTime)               getTownDamageStatisticsZoneApi (useLeftTable)
              getNetworkSituationApi()             (null 时不传 dataTime)
                                                  │
                                                  ▼
                                       leftDataTime = leftState.dataSource[0].dataTime
                                                  │
                                                  ▼
                                  useMiddleTable / useRightTable / Provider.dataTime
                                                  │
                                                  ▼
                                  requestParams.dataTime = leftDataTime
```

- **写入方**：仅 NetworkScale（`index.tsx:208` 的 `onOk` 回调）
- **消费方**：NetworkScale + damage-to-towns（左栏统计 + 左栏表格 + 中栏 + 右栏）
- **初始 `null` 不阻塞请求**：`historyTime === null` 时，三个 `useRequest` 均能发起请求（不传 `dataTime`，后端按当前时间处理）
- **`historyTime` 是串联时间**：damage-to-towns 中/右栏的 `dataTime` 不直接读 `historyTime`，而是读**左栏表格接口返回的 `dataTime`**，避免与左栏数据时序错位

---

## 各模块消费详情

### NetworkScale

| 文件            | 消费方式                                            | 说明                                                                        |
| --------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| `index.tsx:45`  | `usePageStore(state => state.right.historyTime)`    | 读取全局值                                                                  |
| `index.tsx:95`  | `dataTime: historyTime ?? undefined`                | `historyTime` 为 `null` 时不传 `dataTime`，后端按当前时间处理               |
| `index.tsx:100` | `ready: !isEmpty(requestParams)`                    | **不再**用 `historyTime` 做守卫，`null` 也能发起请求                        |
| `index.tsx:101` | `refreshDeps: [requestParams, historyTime]`         | `historyTime` 变化时重新请求                                                |
| `index.tsx:183` | `data?.currentDataTime ?`                           | 标题栏日历区域渲染条件：后端返回 `currentDataTime` 后才显示                 |
| `index.tsx:208` | `setHistoryTime(date.format("YYYY-MM-DD HH:mm:00"))` | 用户 `onOk` 后写入 store，格式带秒（`HH:mm:00`）                            |
| `index.tsx:224` | `{data?.currentDataTime}`                           | 数据时间展示用后端返回值（不再用 `historyTime`）                            |
| `index.tsx:195` | `value={historyTime ? dayjs(historyTime) : undefined}` | DatePicker 值：`historyTime` 为 `null` 时 `undefined`，不默认高亮当前时间 |

> ⚠️ NetworkScale 请求时 `dataTime` **原值透传**（不 format），可能是 `null` / `"YYYY-MM-DD HH:mm"` / `"YYYY-MM-DD HH:mm:00"`。后端需兼容这几种格式。

### damage-to-towns

| 文件                      | 消费方式                                                                                         | 说明                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `Context.tsx:152`         | `...(props.historyTime ? { dataTime: dayjs(props.historyTime).format("YYYY-MM-DD HH:mm:ss") } : {})` | **左栏统计**（`leftStatistics`）：`historyTime` 非空才传 `dataTime` |
| `Context.tsx:158`         | `ready: isDefined(currentRegionParams.requestParams)`                                            | **不再**用 `historyTime` 做守卫，`null` 也能发起请求                |
| `Context.tsx:159`         | `refreshDeps: [currentRegionParams, props.historyTime]`                                          | `historyTime` 变化时重新请求                                        |
| `Part.Left.Table.tsx:148` | `getTownDamageStatisticsZoneApi({ ...requestParams, ...(historyTime ? { dataTime: ... } : {}) })` | **左栏表格**（`useLeftTable`）：`historyTime` 非空才传 `dataTime`   |
| `Part.Left.Table.tsx:154` | `ready: isDefined(currentRegionParams.requestParams)`                                            | **不再**用 `historyTime` 做守卫，`null` 也能发起请求                |
| `Part.Left.Table.tsx:155` | `refreshDeps: [currentRegionParams, historyTime]`                                                | `historyTime` 变化时重新请求                                        |
| `Context.tsx:145`         | `leftDataTime = leftState.dataSource[0].dataTime`                                                | **左栏表格数据时间**（`dataTime` 字段），作为中/右栏时间源          |
| `Context.tsx:225, 232`    | `useMiddleTable({ dataTime: leftDataTime })`                                                     | **中栏 + 右栏**：跟随左栏表格时间                                   |
| `Context.tsx:255`         | `Provider.dataTime = leftDataTime`                                                               | Provider 暴露的 `dataTime`                                          |

> ✅ 左栏表格与左栏统计都消费 `historyTime`，历史模式下两者**保持同步**。
> ✅ 中/右栏的 `dataTime` 跟随左栏表格（`leftDataTime`），保持全模块时间一致。
> ✅ `historyTime === null` 时，左栏统计 + 左栏表格均不传 `dataTime`，后端按当前时间处理。

---

## 关键状态

| 状态                      | 类型             | 作用                                                |
| ------------------------- | ---------------- | --------------------------------------------------- |
| `store.right.historyTime` | `string \| null` | 历史时间，初始 `null`，NetworkScale mount 时初始化  |
| `state.showTimeDropdown`  | `boolean`        | NetworkScale 日历 Dropdown 开关                     |
| `leftDataTime`            | `string \| null` | damage-to-towns 中/右栏的时间源（左栏表格数据时间） |

---

## 初始化逻辑

`store.right.historyTime` 初始值为 `null`（`store.ts:87`）。

> **当前实现**：**不再**有前端强制初始化 `historyTime` 为当前时间的逻辑。
> NetworkScale `index.tsx` 已删除原 `useEffect(() => { if (historyTime === null) setHistoryTime(dayjs().format(...)) })`。

| 阶段                | `historyTime` 值 | 请求 `dataTime`                                       | 行为                       |
| ------------------- | ---------------- | ----------------------------------------------------- | -------------------------- |
| store 初始          | `null`           | 不传（NetworkScale）/ 不传（damage-to-towns 左栏）    | 后端按当前时间返回最新数据 |
| 用户选历史时间 `onOk` | `"YYYY-MM-DD HH:mm:00"` | 透传（NetworkScale）/ format 后传（damage-to-towns） | 拉历史数据                 |
| 用户清空 DatePicker  | `null`（allowClear） | 不传                                                  | 回到当前时间数据           |

- `null` 是合法的"未选择历史时间"状态，不阻塞任何请求
- damage-to-towns **无**初始化逻辑，依赖 NetworkScale 写入或保持 `null`
- 标题栏日历区域在 `data?.currentDataTime` 有值后才渲染（首次请求返回后显示）

---

## 修改约束

| 约束                                                                                            | 原因                                                                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **必须保留** `historyTime ?? undefined` / `...(historyTime ? {...} : {})` 的条件传参            | `historyTime` 初始为 `null`，此时不应传 `dataTime`，由后端按当前时间处理                       |
| **必须保留** `refreshDeps: [..., historyTime]`                                                  | 用户选历史时间后需要重新请求                                                                   |
| **不要** 重新加回 `isDefined(historyTime)` 的 `ready` 守卫                                       | 当前设计允许 `null` 发起请求；加回守卫会导致首次加载无数据                                     |
| **不要** 重新加回 `useEffect` 把 `null` 初始化为当前时间                                        | `null` 是"未选历史时间"的合法语义；前端强制初始化会让"当前时间"与"用户选了当前时间"无法区分    |
| **不要** 把中/右栏 `dataTime` 改成 `historyTime`                                                | 中/右栏必须跟随左栏表格（`leftDataTime`），保持全模块数据时序一致                              |
| **不要** 引入 `isManualTime` 等额外状态                                                         | `historyTime` 本身就是 source of truth，不需要额外标记                                         |
| **确认** `getNetworkSituationApi` 兼容 `YYYY-MM-DD HH:mm` 与 `YYYY-MM-DD HH:mm:00` 两种格式     | NetworkScale 透传 `historyTime` 原值，用户 `onOk` 写入的是带秒格式（`HH:mm:00`）              |
| **确认** `getTownDamageStatisticsApi` / `getTownDamageStatisticsZoneApi` 对 `dataTime` 语义一致 | 两个 API 都用 `historyTime` 请求，语义不同时会显示错位数据                                     |

---

## 已知差异（待观察）

| 项              | NetworkScale                                | damage-to-towns（左栏统计 / 左栏表格）                                             | 状态    |
| --------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| `dataTime` 格式 | `historyTime` 原值透传（`HH:mm` 或 `HH:mm:00`） | `dayjs(historyTime).format("YYYY-MM-DD HH:mm:ss")`                                 | ⚠️ 已知 |
| 后端实际接收    | `2026-07-07 10:00` 或 `2026-07-07 10:00:00` | `2026-07-07 10:00:00`                                                              | 待观察  |
| 来源            | `index.tsx:95`（NetworkScale `useRequest`） | `Context.tsx:152`（`leftStatistics`）+ `Part.Left.Table.tsx:150`（`useLeftTable`） | —       |

> **当前决定**：保留差异。NetworkScale 透传用户 `onOk` 写入的值（`YYYY-MM-DD HH:mm:00`），damage-to-towns 统一格式化为带秒。
> **触发条件**：当发现"同一 `historyTime`，NetworkScale 与 damage-to-towns 拉到不同时间点数据"时统一格式。
> **统一方向**：建议 NetworkScale 也改为 `dayjs(historyTime).format("YYYY-MM-DD HH:mm:ss")`，与 damage-to-towns 一致。

---

## 排错

| 症状                     | 原因                                                | 修复                                                                              |
| ------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 选历史时间后数据跳回当前 | `dataTime` 来源被改成 `data.currentDataTime` 等     | 保持 `dataTime: historyTime ?? undefined`（NetworkScale）/ 条件传参（damage-to-towns） |
| 首次加载无数据           | 重新加回了 `isDefined(historyTime)` 的 `ready` 守卫 | 移除 `historyTime` 守卫，`null` 时也应发起请求                                    |
| 日历区域不显示           | `data?.currentDataTime` 为 `null`（后端未返回）     | 检查后端是否返回 `currentDataTime` 字段                                           |
| 日历 Dropdown 不弹出     | `getPopupContainer` 返回 null / 定位异常            | 检查 `triggerNode` 引用                                                           |
| 左栏表格和统计不同步     | 某个 `dataTime` 来源不是 `historyTime`              | 统一两处 `dataTime` 字段                                                          |
| 中/右栏与左栏时间错位    | 中/右栏 `dataTime` 改成了 `historyTime`             | 恢复 `dataTime: leftDataTime`（`Context.tsx:225, 232, 255`）                      |
| DatePicker 默认显示当前时间 | `value={dayjs(historyTime)}`，`dayjs(null)` 返回当前时间 | 已修复：改为 `value={historyTime ? dayjs(historyTime) : undefined}`（`index.tsx:195`） |

---

## 版本信息

| 字段           | 值                                               |
| -------------- | ------------------------------------------------ |
| **所属 Skill** | [gd-es-next-right-real-time-impact](../SKILL.md) |
| **当前版本**   | `1.5.0`                                          |
| **最后更新**   | `2026-07-07`                                     |
