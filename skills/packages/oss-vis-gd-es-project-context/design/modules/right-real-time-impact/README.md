---
name: gd-es-next-right-real-time-impact
title: 右屏「实时影响」维护技能
description: 维护右屏"实时影响"模块，包含 NetworkScale（无线/动环/传输/集客/家客指标卡片 + 详情弹窗 + 故障清单）与 damage-to-towns（乡镇受损三栏 + 退服统计弹窗 + 4 级下钻）两个子模块。Invoke when 修改、扩展或排查右屏"实时影响"任意子模块、其依赖 API、配置或样式时。
version: 1.1.0
author: Emergency Support Team
tags:
    - network
    - real-time-impact
    - network-scale
    - damage-to-towns
    - emergency-support
    - right-screen
---

# 右屏「实时影响」维护 Skill

> **目录约定**：
>
> - `references/network-scale/` — NetworkScale 子模块（卡片 / 轮播 / 详情 / 故障清单）
> - `references/damage-to-towns/` — damage-to-towns 子模块（三栏退服表 / 退服统计弹窗 / 下钻）
> - 跨切面概念（GIS 派发、选中态、dataTime 同步、配置驱动原则等）只在本文档定义一次

---

## TL;DR（30 秒）

| 维度         | 速记                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **模块归属** | `apps/main/app/components/right/network-compact/` 下的两个子模块                                              |
| **公共**     | `apps/main/request/right.ts` + `environment.json` + `widgetFields` + `ZoneLevelEnum`                          |
| **轮询**     | 两子模块独立配置键（默认 300 秒）：`network-conditions.request.interval` / `damage-to-towns.request.interval` |
| **GIS 派发** | `sectionRight:networkScale` / `damageToTownsGisPin`（主屏） / `damageToTownsModalGisPin`（弹窗）              |

---

## 适用场景

- 修改 NetworkScale 子组件（卡片 / 轮播 / 详情 / 故障清单）。
- 修改 damage-to-towns 子组件（三栏 / 退服统计弹窗 / 下钻）。
- 调整 `presets.ts` 指标 / 组合视图 / 分段轮播配置；调整 `environment.json` 图表 / 弹窗列 / 轮询。
- 排查数据不更新、图表不显示、轮播不切换、故障清单打不开、下钻异常等问题。
- 接入 / 修改后端 API（network-scale 4 个 + damage-to-towns 6 个）。
- 调整 GIS 派发字段、选中态联动、dataTime 同步链路。

---

## 任务入口

### NetworkScale 子模块

| 任务               | 一句话答案                                                                              | 详细                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **加新指标**       | `presets.ts` 的 `items` + `groupViews`（可选） + `environment.json` 的 `unitIdSettings` | [presets-config.md §1.3](./references/network-scale/presets-config.md#13-添加新指标)                     |
| **加组合指标**     | `groupViews.children` 声明                                                              | [presets-config.md §1.4](./references/network-scale/presets-config.md#14-添加组合指标推荐方式)           |
| **启用分段轮播**   | `presets.ts` 设置 `groupViewType: "carouselSection"`                                    | [carousel-components.md §5](./references/network-scale/carousel-components.md#5-carouselsection分段轮播) |
| **改图表系列**     | `environment.json` → `unitIdSettings`                                                   | [presets-config.md §2.1](./references/network-scale/presets-config.md#21-图表系列配置unitidsettings)     |
| **改故障清单列**   | `environment.json` → `rightNetworkCompactFaultListTable.columns` + `apiList`            | [fault-list-table.md §6](./references/network-scale/fault-list-table.md#6-列配置environmentjson)         |
| **改轮询**         | `environment.json` → `network-conditions.request.interval`                              | [presets-config.md §2.3](./references/network-scale/presets-config.md#23-轮询间隔)                       |
| **改历史数据查看** | `store.right.historyTime` 串联 NetworkScale + damage-to-towns 数据时间 | [history-time.md](./references/history-time.md) |
| **排查问题**       | 按"数据/卡片/轮播/图表/选中态/弹窗"分类速查                                             | [troubleshooting.md](./references/network-scale/troubleshooting.md)                                      |

### damage-to-towns 子模块

| 任务                | 一句话答案                                                                   | 详细                                                                                       |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **加列（中/右栏）** | `Part.Middle.Settings.tsx` / `Part.Right.tsx` → `columns`                    | —                                                                                          |
| **加列（弹窗）**    | `environment.json` → `detailModal.{type}.columns.{zoneLevel}`                | [config-reference.md](./references/damage-to-towns/config-reference.md)                    |
| **改下钻/选中态**   | `ExitServiceDetail.tsx` → `handleRowClick` + `onRow`                         | [exit-service-detail.md](./references/damage-to-towns/exit-service-detail.md#行点击与下钻) |
| **改 GIS 派发**     | `index.tsx` → `onCellClick` + `apps/main/app/components/fields.ts` 注册      | [§1 onCellClick 三表派发](#1-oncellclick-三表派发)                                         |
| **改轮询**          | `environment.json` → `damage-to-towns.request.interval`                      | —                                                                                          |
| **加颜色/等级**     | `Context.tsx`（枚举+映射）+ `Part.Left.tsx`（图标）+ `colors` 两处 + Tooltip | [场景 1](#场景-1新增告警颜色等级)                                                          |
| **加下钻层级**      | `ZoneLevelEnum` + `buildRequestParams` + `handleRowClick`                    | [场景 2](#场景-2新增弹窗下钻层级)                                                          |

---

## 关键概念（一次讲清楚，跨切面）

<a id="1-oncellclick-三表派发"></a>

### 1. onCellClick 三表派发（damage-to-towns）

`index.tsx` 的 `onCellClick` 根据 `info.table` 走 3 条分支，构建不同 GIS 派发参数：

| 字段                                 | middleTable                        | rightTable            | exitServiceDetailModal         |
| ------------------------------------ | ---------------------------------- | --------------------- | ------------------------------ |
| **派发字段**                         | `damageToTownsGisPin`              | `damageToTownsGisPin` | **`damageToTownsModalGisPin`** |
| `zoneName`                           | `record.cityName`                  | `record.regionName`   | `record.city`                  |
| `townName`                           | `record.townName`                  | `record.regionName`   | `record.town`                  |
| `regionName`                         | `record.regionName`                | `record.parentRegion` | `record.region`                |
| `cityName`                           | `record.cityName`                  | `record.cityName`     | `record.city`                  |
| `isTownExitRoute`                    | `false`                            | **`true`**            | `false`                        |
| `zoneLevel`/`sceneType`/`isTownship` | 固定 `"3"` / `"township"` / `true` | 同                    | 同                             |

> **关键点**：弹窗走 `damageToTownsModalGisPin`，主屏走 `damageToTownsGisPin`；两个字段都必须在 `fields.ts` 注册。`rightTable` 的 `isTownExitRoute = true` 标识出局路由来源。

<a id="2-选中态双轨制"></a>

### 2. 选中态双轨制（damage-to-towns）

| 来源                            | 驱动字段                    | 计算方式               |
| ------------------------------- | --------------------------- | ---------------------- | ---- | ---- | ----------------------------------------- |
| **弹窗**（`ExitServiceDetail`） | 内部 `state.selectedRowKey` | `region                | city | town | alarmType`组合键，由`handleRowClick` 控制 |
| **主屏中栏**（`Part.Middle`）   | store `selectedTableRecord` | `getSelectRowKey` 计算 |

> **不要混用**：弹窗行高亮完全独立于 store；GIS 派发与主屏中栏仍走 store。

<a id="3-datetime-同步链路"></a>

### 3. dataTime 同步链路（damage-to-towns）

```
左栏 useLeftTable() → leftDataTime = leftState.dataSource[0].dataTime
        │ (Context.tsx)
        ▼
useMiddleTable() / useRightTable() → requestParams.dataTime = leftDataTime
```

- `leftDataTime === null` 时中/右两栏提前 `return Promise.resolve([])`。
- 修改左栏数据源时**必须考虑**是否纳入此同步链路。

<a id="4-currentregionparams-回退规则"></a>

### 4. currentRegionParams 回退规则（damage-to-towns）

| `currentZone.zoneLevel` | 请求 `zoneName`              | 请求 `zoneLevel`           | 备注                  |
| ----------------------- | ---------------------------- | -------------------------- | --------------------- |
| `province`              | `currentZone.zoneName`       | `currentZone.zoneLevel`    | 透传                  |
| `city` / `town`         | **`currentZone.regionName`** | **`ZoneLevelEnum.region`** | **强制回退到 region** |

- 设计意图：左栏"旗帜 + 区域汇总表"是宏观视角，不随下钻细化。

<a id="5-旗帜过滤双映射"></a>

### 5. 旗帜过滤双映射（damage-to-towns）

| 表格 | 过滤逻辑                                                                   |
| ---- | -------------------------------------------------------------------------- |
| 中栏 | `d.severity === leftSelectedFlag`（red/yellow/blue）                       |
| 右栏 | `d.alarmType === AlarmLevelString[leftSelectedFlag]`（乡镇全阻/双断/单断） |

- `AlarmLevelString` 维护在 `Context.tsx`，**新增颜色时必须同步此表**（否则右栏过滤失效）。

<a id="6-配置驱动原则"></a>

### 6. 配置驱动原则（两子模块通用）

> 🎯 **核心原则**：所有展示逻辑由 `presets.ts` / `environment.json` 声明式配置控制，组件内部不写业务硬编码。

| 配置位置                                                          | 控制内容                               |
| ----------------------------------------------------------------- | -------------------------------------- |
| `presets.ts` 的 `items[]`                                         | 指标 ID / 标签 / 详情标题              |
| `presets.ts` 的 `groupViews[]`                                    | 组合视图 + `viewType`                  |
| `presets.ts` 的 `groupViewType`                                   | 普通轮播 / 分段轮播切换                |
| `environment.json` 的 `unitIdSettings`                            | 图表系列                               |
| `environment.json` 的 `rightNetworkCompactFaultListTable.columns` | 故障清单列宽 / 渲染 / fieldName        |
| `environment.json` 的 `detailModal.{type}.columns.{zoneLevel}`    | 退服弹窗列（damage-to-towns）          |
| `Context.tsx` 的 `AlarmLevelString`                               | 颜色 → 告警类型映射（damage-to-towns） |

详细反面案例与落地清单见 [principles.md](./references/network-scale/principles.md)。

<a id="7-历史数据查看-networkscale"></a>

### 7. 历史数据查看（跨子模块）

NetworkScale 标题栏日历 Dropdown 选择历史时间点，`historyTime` 存于全局 store（`store.ts:87`，初始 `null`），作为"串联时间"驱动 NetworkScale + damage-to-towns 全部请求。`null` 表示"未选历史时间"，请求时不传 `dataTime`，由后端按当前时间处理。

> 数据流、消费详情、修改约束见 [history-time.md](./references/history-time.md)。

---

## 文档导航

### NetworkScale 子模块 references/

| 文档                                                                        | 何时读          |
| --------------------------------------------------------------------------- | --------------- |
| [principles.md](./references/network-scale/principles.md)                   | **扩展前必读**  |
| [presets-config.md](./references/network-scale/presets-config.md)           | **改配置**      |
| [main-render-flow.md](./references/network-scale/main-render-flow.md)       | **改主组件**    |
| [sub-components.md](./references/network-scale/sub-components.md)           | **改子组件**    |
| [carousel-components.md](./references/network-scale/carousel-components.md) | **调轮播**      |
| [detail-component.md](./references/network-scale/detail-component.md)       | **改详情弹窗**  |
| [fault-list-table.md](./references/fault-list-table.md)                     | **改故障清单**  |
| [troubleshooting.md](./references/network-scale/troubleshooting.md)         | **出问题**      |
| [overview.md](./references/network-scale/overview.md)                       | **考古 / 历史** |

### damage-to-towns 子模块 references/

| 文档                                                                          | 何时读             |
| ----------------------------------------------------------------------------- | ------------------ |
| [api-reference.md](./references/damage-to-towns/api-reference.md)             | **查接口**         |
| [config-reference.md](./references/damage-to-towns/config-reference.md)       | **改弹窗列配置**   |
| [exit-service-detail.md](./references/damage-to-towns/exit-service-detail.md) | **改退服统计弹窗** |

### 跨子模块 references/

| 文档                                            | 何时读         |
| ----------------------------------------------- | -------------- |
| [history-time.md](./references/history-time.md) | **改历史时间** |

---

## 排错（Q&A）

### NetworkScale（详见 [troubleshooting.md](./references/network-scale/troubleshooting.md)）

| #   | 症状                     | 一句话定位                                                    |
| --- | ------------------------ | ------------------------------------------------------------- |
| Q1  | 数据不更新               | `environment.json` → `network-conditions.request.interval`    |
| Q2  | 卡片不显示 / 数字恒为 0  | `presets.ts` 与 API 返回的 `id` 不一致                        |
| Q3  | 组合卡片不显示           | `groupViews.children` 未配置 / 旧 `groupId` 已废弃            |
| Q4  | 轮播不切换               | `groupViews` 长度 < 2                                         |
| Q5  | 图表不显示               | `unitIdSettings` 未配齐 / `dataTime` 为空                     |
| Q6  | 选中状态丢失             | `Detail` 的 `key` 未带 `zoneId`                               |
| Q7  | 故障清单打不开           | `currentIndItem.id` 为空 / `onShowDetailList` 回调路径        |
| Q8  | 选历史时间后数据跳回当前 | `dataTime` 来源被改成 `data.currentDataTime` 等非 `historyTime` |

### damage-to-towns

| #   | 症状                      | 一句话定位                                                           |
| --- | ------------------------- | -------------------------------------------------------------------- |
| Q1  | 旗帜点击后中/右两栏没反应 | `Context.tsx:AlarmLevelString` 未同步新颜色                          |
| Q2  | 表格一直 loading          | `leftDataTime` 为 null / `currentRegionParams.requestParams` 为 null |
| Q3  | 弹窗打不开/无数据         | `environment.json` 缺该 `zoneLevel` 列配置                           |
| Q4  | GIS 打点后地图无反应      | `fields.ts` 未注册对应字段，或 GIS 未订阅                            |
| Q5  | 弹窗内新列不显示          | `environment.json` 缺该 `zoneLevel` 列配置 / `dataIndex` 拼写错      |
| Q6  | 拖拽失效                  | 鼠标不在"顶部数据时间+按钮区域"内 / `getContainer` 异常              |

---

## 场景指南

<a id="场景-1新增告警颜色等级"></a>

### 场景 1：新增告警颜色/等级（damage-to-towns）

**修改清单**（4 处必同步）：

1. `Context.tsx` → `ColorLevelString` 枚举追加
2. `Context.tsx` → `AlarmLevelString` 追加映射（**否则右栏过滤失效**）
3. `Part.Left.tsx` → `IconFlagImages` 数组追加
4. **`colors` 同步改两处**（`Part.Middle.Settings.tsx` 按颜色键、`Part.Right.tsx` 按业务名键）

<a id="场景-2新增弹窗下钻层级"></a>

### 场景 2：新增弹窗下钻层级（damage-to-towns）

> 当前 4 级：province → region → city → town。

1. `Context.tsx` → `ZoneLevelEnum` 追加值
2. `ExitServiceDetail.tsx` → `buildRequestParams()` switch 追加 case
3. `ExitServiceDetail.tsx` → `handleRowClick` 调整终止条件
4. `environment.json` → `detailModal.{physical|logic}.columns` 追加对应 `zoneLevel` 配置

### 场景 3：Mock 切真实 API

`apps/main/request/right.ts` 每个 `getViewItemDataApi` 调用清空 `localMockUrl`。**不要删** `viewItemId`/`viewPageId`。

### 场景 4：新增 NetworkScale 指标

1. `presets.ts` → `viewItemDataTemplate` 的某 group 下追加 `items`
2. （如需组合显示）追加 `groupViews`
3. （如需图表系列）`environment.json` → `unitIdSettings` 追加
4. （如需故障清单弹窗）`environment.json` → `rightNetworkCompactFaultListTable.columns` + `apiList` 追加

详见 [presets-config.md §1.3](./references/network-scale/presets-config.md#13-添加新指标) 与 [fault-list-table.md §5](./references/network-scale/fault-list-table.md#5-后端路由unitid--viewitemid)。

### 场景 5：性能优化（NetworkScale）

- 避免重复计算：`useMemo`（如 `viewItemData` 拆分、激活项计算）
- 稳定函数引用：`useMemoizedFn` 包装事件处理
- 懒加载图表：图表挂载在 `DataStatus` 内，未入视口不渲染
- `useRequest` ready 守卫：参数不就绪时跳过请求

详见 [troubleshooting.md §3](./references/network-scale/troubleshooting.md#3-性能优化清单)。

### 6：调整历史数据查看行为

> `index.tsx:187-228` — 日历 Dropdown + `StyledDatePicker`。完整说明见 [history-time.md](./references/history-time.md)。

---

## 版本信息

| 字段         | 值                                                                 |
| ------------ | ------------------------------------------------------------------ |
| **Skill ID** | `gd-es-next-right-real-time-impact`                                |
| **当前版本** | `1.3.0`                                                            |
| **最后更新** | `2026-07-07`                                                       |
| **维护者**   | Emergency Support Team                                             |
| **入口模块** | `apps/main/app/components/right/network-compact/`                  |
| **接口文件** | `apps/main/request/right.ts`（NetworkScale 4 + damage-to-towns 7） |
| **配置文件** | `apps/main/public/config/environment.json`                         |

## 适用范围

- ✅ **适用**：修改 / 扩展 / 排查 NetworkScale 与 damage-to-towns 任意子模块
- ✅ **适用**：跨子模块的统一修改（轮询、配置驱动原则、依赖升级）
- ✅ **适用**：6 类场景拓展 + 14 条排错
- ⚠️ **谨慎**：修改跨切面概念（配置驱动原则、轮询、dataTime 同步链路）——牵涉两子模块
- ⚠️ **谨慎**：修改 GIS 派发字段（必须同步 `fields.ts` 与 GIS 订阅方）
- ❌ **不适用**：跨"右屏"模块外的修改（如左屏应急资源、Header 头）
- ❌ **不适用**：纯样式 / 响应式调整
