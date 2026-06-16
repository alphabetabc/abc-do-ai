---
name: gd-es-next-right-damage-to-towns
title: 右屏乡镇受损模块维护技能
description: 维护右屏「乡镇受损」(damage-to-towns) 模块，包含 Left/Middle/Right 三栏表格、区域统计、退服统计弹窗（ExitServiceDetail）、物理/逻辑切换与多级下钻。Invoke when 修改、修复或优化 damage-to-towns 模块及其子组件、ExitServiceDetail 弹窗、相关 API、配置、样式时。
version: 1.5.0
---

# damage-to-towns 模块维护 Skill

> **本 Skill 文档结构约定**（团队内部约定，违反者视为 PR 不通过）：
> - 跨切面概念只在 `SKILL.md`（**本文档**）定义一次
> - 代码片段只在 `exit-service-detail.md` 维护一次，其他文件用 `→ [详见]()` 引用
> - 版本号只在 frontmatter 与本文档末尾的"版本信息"表中出现
> - 行号引用为"近似锚点"，以 `grep -n` 验证为准
>
> **版本号协调规则**：
> - `SKILL.md` 版本号 = Skill 整体主版本；结构调整/概念增删时 +1
> - 子文档（api-reference.md / config-reference.md / exit-service-detail.md）**独立演进**，仅当对应内容（API 契约/配置 schema/弹窗实现）变化时升级
> - 子文档末尾"版本信息"表需注明"所属 Skill"及 `SKILL.md` 链接，便于交叉追溯

---

## TL;DR（30 秒）

| 维度 | 速记 |
|------|------|
| **架构** | `index.tsx` 入口 → `Context.tsx` Provider → `Part.Left/Middle/Right` 三栏 → `ExitServiceDetail.tsx` 弹窗 |
| **数据** | 6 个 viewItemId，详见 [api-reference.md](./api-reference.md) |
| **派发** | `onCellClick` 三表 → 2 个 GIS 字段（详见 [关键概念 §1](#1-oncellclick-三表派发) |
| **选中态** | 弹窗内部 `state.selectedRowKey` / 主屏中栏消费 store（详见 [关键概念 §2](#2-选中态双轨制)）|
| **时间** | `leftDataTime` 同步中/右两栏（详见 [关键概念 §3](#3-datetime-同步链路)）|

---

## 任务入口（按"我要做什么"索引）

| 任务 | 一句话答案 | 详细章节 |
|------|----------|---------|
| **加列**（中栏） | `Part.Middle.Settings.tsx` → `useMiddleTable` → `physicalTable.columns` / `logicTable.columns` | — |
| **加列**（右栏） | `Part.Right.tsx` → `columns` | — |
| **加列**（弹窗） | `environment.json` → `detailModal.{type}.columns.{zoneLevel}` | [config-reference.md](./config-reference.md) |
| **改下钻/选中态** | `ExitServiceDetail.tsx` → `handleRowClick` + `onRow` | [exit-service-detail.md](./exit-service-detail.md#行点击与下钻) |
| **改 GIS 派发** | `index.tsx` → `onCellClick` + `apps/main/app/components/fields.ts` 注册 | [关键概念 §1](#1-oncellclick-三表派发) |
| **改轮询** | `environment.json` → `request.interval` | — |
| **改拖拽** | `index.tsx` → `state.disabledDraggable` + 弹窗 `onMouseOver/Out` | [exit-service-detail.md](./exit-service-detail.md#弹窗拖拽控制) |
| **加颜色/等级** | `Context.tsx`（枚举+映射）+ `Part.Left.tsx`（图标）+ `colors` 两处（Middle.Settings/Right）+ `index.tsx` Tooltip | [场景 1](#场景-1新增告警颜色等级) |
| **切真实 API** | `apps/main/request/right.ts` → 清空 `localMockUrl` | [场景 3](#场景-3mock-切真实-api) |
| **加下钻层级** | `ZoneLevelEnum` + `buildRequestParams` + `handleRowClick` | [场景 4](#场景-4新增弹窗下钻层级) |
| **加 GIS 派发字段** | `index.tsx:onCellClick` → `params` 追加 + `fields.ts` 注册 | [场景 5](#场景-5新增-gis-派发字段) |

---

## 文件地图（10 个源文件）

> **角色图例**：★ 入口 · ◇ Hook/常量 · ◆ 容器组件 · ✦ 弹窗主体

| 文件 | 角色 | 1 行职责 |
|------|------|---------|
| `index.tsx` | ★ | 入口；Provider/Modal/onCellClick + GIS 派发分流 |
| `Context.tsx` | ◇ | Provider/数据 hook + `ColorLevelString` / `AlarmLevelString` / `ServiceType` 枚举 |
| `Part.Left.tsx` | ◆ | 左栏旗帜 + 区域汇总表容器（`IconFlagImages` 数组维护在此） |
| `Part.Left.Table.tsx` | ◇ | `useLeftTable` Hook |
| `Part.Middle.tsx` | ◆ | 中栏乡镇退服表容器（消费 `Part.Middle.Settings` 导出的选中态工具） |
| `Part.Middle.Settings.tsx` | ◇ | 中栏列定义 + `useMiddleTable` + `getSelectRowKey` / `isRowSelected` / `btns` 共享工具 + `colors` 常量 |
| `Part.Right.tsx` | ◆ | 右栏路由表（`columns` + 内联 `colors` 业务名映射） |
| `Part.Right.Table.tsx` | ◇ | `useRightTable` Hook |
| `ExitServiceDetail.tsx` | ✦ | 弹窗主体（`handleRowClick` / `onRow` / `btns` / `buildRequestParams`） |
| `index.css` | — | 布局 + 表格暗黑样式 |

> **行数说明**：本表不标注行数；按本 Skill "文档结构约定"，行号引用为近似锚点，请以 `grep -n` 验证。

---

## 关键概念（一次讲清楚）

### 1. onCellClick 三表派发

`index.tsx` 的 `onCellClick` 根据 `info.table` 走 3 条分支，构建不同 GIS 派发参数：

| 字段              | middleTable       | rightTable        | exitServiceDetailModal |
| ----------------- | ----------------- | ----------------- | ---------------------- |
| **派发字段**      | `damageToTownsGisPin` | `damageToTownsGisPin` | **`damageToTownsModalGisPin`** |
| `zoneName`        | `record.cityName` | `record.regionName` | `record.city` |
| `townName`        | `record.townName` | `record.regionName` | `record.town` |
| `townId`          | `record.townId`   | —                 | `record.townId` |
| `regionName`      | `record.regionName` | `record.parentRegion` | `record.region` |
| `cityName`        | `record.cityName` | `record.cityName` | `record.city` |
| `alarmType`       | `info.tableType`  | `record.alarmType` | `info.tableType`（被 line 142 覆盖） |
| `scanTime` 取值源  | `record.scanTime` | `record.dataTime` | `record.scanTime`（被 line 143 覆盖） |
| `isTownExitRoute` | `false`           | **`true`**        | `false` |
| `zoneLevel`/`sceneType`/`isTownship` | 固定 `"3"` / `"township"` / `true` | 同 | 同 |
| `selected`        | `info.selected`   | `info.selected`   | `info.selected` |

> **注意**：派发 payload 实际**只有 `scanTime` 字段，没有 `dataTime` 字段**。本表用 `scanTime 取值源` 一行表达不同表取自 record 的哪个属性（scanTime vs dataTime 语义不同：扫描时间 vs 数据时间）。

**关键点**：
- **派发字段分流**：弹窗内点击走 `damageToTownsModalGisPin`；主屏点击走 `damageToTownsGisPin`。两个字段都必须在 `apps/main/app/components/fields.ts` 注册
- `rightTable` 特殊地设置 `isTownExitRoute = true`（GIS 接收方可据此区分来源表）
- `scanTime` 与 `dataTime` 是不同语义（扫描时间 vs 数据时间），分表使用不可混用
- `zoneLevel` 固定 `"3"` 是与后端约定的"乡镇级"标识
- `exitServiceDetailModal` 列的 `alarmType` / `scanTime` 在源码中有二次覆盖（先取 `record.alarmType`/`record.dataTime`，再被 `tableType`/`record.scanTime` 覆盖）

### 2. 选中态双轨制

| 来源 | 驱动字段 | 计算方式 |
|------|---------|---------|
| **弹窗**（`ExitServiceDetail`） | 内部 `state.selectedRowKey` | `getRowKey` 包含 `region|city|town|alarmType`，切换由 `handleRowClick` 控制 |
| **主屏中栏**（`Part.Middle`） | store `selectedTableRecord` | `getSelectRowKey` 计算 |

> **不要混用**：弹窗行高亮完全独立，不再消费外部 `selectedTableRecord`（`index.tsx` 中该 prop 已注释）；GIS 派发与主屏中栏的 `selectedTableRecord` 仍走 store。

### 3. dataTime 同步链路

```
左栏 useLeftTable() → leftDataTime = leftState.dataSource[0].dataTime
        │ (Context.tsx)
        ▼
useMiddleTable() / useRightTable() → requestParams.dataTime = leftDataTime
```

- **时序约束**：中/右两栏的 `dataTime` 必须以左栏为基准，避免"旗帜展示 T1 而表格展示 T0"的不一致
- `leftDataTime === null` 时，中/右两栏提前 `return Promise.resolve([])`
- 修改左栏数据源时**必须考虑**是否纳入此同步链路

### 4. currentRegionParams 回退规则

| `currentZone.zoneLevel` | 请求 `zoneName`       | 请求 `zoneLevel`        | 备注       |
| ----------------------- | --------------------- | ----------------------- | ---------- |
| `province`              | `currentZone.zoneName` | `currentZone.zoneLevel` | 透传       |
| `city` / `town`         | **`currentZone.regionName`** | **`ZoneLevelEnum.region`** | **强制回退到 region** |

- 设计意图：左栏"小旗子 + 区域汇总表"是宏观视角，不随下钻细化
- `dataTime` 用 getter 每次请求实时取当前时间

### 5. 旗帜过滤双映射

| 表格 | 过滤逻辑                                             |
| ---- | ---------------------------------------------------- |
| 中栏 | `d.severity === leftSelectedFlag`（red/yellow/blue）  |
| 右栏 | `d.alarmType === AlarmLevelString[leftSelectedFlag]`（乡镇全阻/双断/单断） |

- `AlarmLevelString` 维护在 `Context.tsx`，**新增颜色时必须同步此表**（否则右栏过滤失效）
- 旗帜点击同一颜色会切换"激活/取消激活"（`isActive ? null : item.flag`）

---

## 任务卡（常见修改 1-3 行）

| 修改项 | 文件:位置 | 说明 |
|--------|----------|------|
| **加列（中栏）** | `Part.Middle.Settings.tsx` → `useMiddleTable` → `physicalTable.columns` / `logicTable.columns` | 追加 `{ title, dataIndex, render }` |
| **加列（右栏）** | `Part.Right.tsx` → `columns` 数组 | 同上 |
| **加列（弹窗）** | `environment.json` → `detailModal.{physical\|logic}.columns.{zoneLevel}` | 见 [config-reference.md](./config-reference.md) |
| **改轮询** | `environment.json` → `request.interval` | 单位秒，默认 300 |
| **改 ServiceType** | `Context.tsx` → 共享枚举 | `Physical = "physical"`, `Logical = "logical"` |
| **改拖拽** | `index.tsx` → `state.disabledDraggable` + 弹窗 `onMouseOver/Out` | 见 [exit-service-detail.md#弹窗拖拽控制](./exit-service-detail.md#弹窗拖拽控制) |
| **改 GIS 派发** | `index.tsx` → `onCellClick` 构建 params + `fields.ts` 注册 | 见 [关键概念 §1](#1-oncellclick-三表派发) |
| **改下钻** | `ExitServiceDetail.tsx` → `handleRowClick` + `buildRequestParams` | 见 [exit-service-detail.md#行点击与下钻](./exit-service-detail.md#行点击与下钻) |

---

## 排错（Q&A）

| # | 症状 | 一句话定位 | 详细 |
|---|------|----------|------|
| Q1 | 旗帜点击后中/右两栏没反应 | 检查 `Context.tsx:AlarmLevelString` 是否同步新颜色 | [§5](#5-旗帜过滤双映射) |
| Q2 | 表格一直 loading | `currentRegionParams.requestParams` 为 null，或 `leftDataTime` 为 null | [§3](#3-datetime-同步链路) [§4](#4-currentregionparams-回退规则) |
| Q3 | 弹窗打不开/无数据 | `state.openDetailModal` 未 true，或 `environment.json` 缺该 `zoneLevel` 列配置 | [config-reference.md](./config-reference.md) |
| Q4 | GIS 打点后地图无反应 | `fields.ts` 未注册对应字段，或 GIS 未订阅 | [§1](#1-oncellclick-三表派发) |
| Q5 | dataTime 显示 T0 但表格 T1 | 已知设计；`rows[0]?.scanTime` 可能比 `leftDataTime` 晚一拍 | [§3](#3-datetime-同步链路) |
| Q6 | 弹窗内新列不显示 | `environment.json` 缺该 `zoneLevel` 列配置 / `dataIndex` 拼写错 | [config-reference.md](./config-reference.md) |
| Q7 | 拖拽失效 | 鼠标不在"顶部数据时间+按钮区域"内 / `getContainer` 异常 | [exit-service-detail.md](./exit-service-detail.md) |

---

## 场景指南（6 类拓展）

### 场景 1：新增告警颜色/等级

> 例：新增"紫色"作为新等级。

**修改清单**（4 处必同步）：

1. `Context.tsx` → `ColorLevelString` 枚举追加
2. `Context.tsx` → `AlarmLevelString` 追加映射（**否则右栏过滤失效**）
3. `Part.Left.tsx` → `IconFlagImages` 数组追加
4. **`colors` 同步改两处**（按"颜色键"和"业务名键"两套并存，缺一会导致中/右两栏色块渲染异常）：
   - `Part.Middle.Settings.tsx` → `colors` 对象（按 `blue/yellow/red` 颜色键，配套 16 进制色值）
   - `Part.Right.tsx` → 内联 `colors` 对象（按 `乡镇单断/乡镇双断/乡镇全阻` 业务名键，配套 16 进制色值）
5. `index.tsx` 标题栏 Tooltip 追加图例（如需）

**验证**：点击新色旗帜 → 中栏 `severity === 'xxx'` 过滤、右栏 `alarmType === '新业务名'` 过滤。

### 场景 2：新增列（中栏物理退服表）

`Part.Middle.Settings.tsx` → `physicalTable.columns` 追加 `{ title, dataIndex, width, render }`。注意 CSS `.middle { width }` 是否需调整。

### 场景 3：Mock 切真实 API

`apps/main/request/right.ts` 每个 `getViewItemDataApi` 调用清空 `localMockUrl`。**不要删** `viewItemId`/`viewPageId`。

### 场景 4：新增弹窗下钻层级

> 当前 4 级：province → region → city → town。

1. `Context.tsx` → `ZoneLevelEnum` 追加值
2. `ExitServiceDetail.tsx` → `buildRequestParams()` switch 追加 case
3. `ExitServiceDetail.tsx` → `handleRowClick` 调整终止条件（**注意：city 分支当前承担 GIS 派发 + 选中态切换双重职责**）
4. `environment.json` → `detailModal.{physical\|logic}.columns` 追加对应 `zoneLevel` 配置
5. `api-reference.md` → 响应结构追加新字段

### 场景 5：新增 GIS 派发字段

`index.tsx` → `onCellClick` 的 `params` 对象追加字段 + `fields.ts` 注册。**三表共用同一字段**，避免 GIS 按表分支处理。

### 场景 6：调整弹窗拖拽

`index.tsx` → `disabledDraggable` 默认值 + 弹窗 `onMouseOver/Out` 触发区域。

---

## 详细参考

- [exit-service-detail.md](./exit-service-detail.md) — **弹窗所有代码片段、handleRowClick、onRow、btns、拖拽控制**
- [api-reference.md](./api-reference.md) — 6 个 API 契约
- [config-reference.md](./config-reference.md) — 配置 schema 与列配置规范

---

## 依赖

- React + TypeScript + Next.js
- antd（Table、Modal、Tooltip、Button）
- ahooks（useSetState、useRequest、**useMemoizedFn**、**useLatest**）
- dayjs、lodash-es
- 项目内部：StyledTable、StyledDraggableModal、Box、widgetFields、useDispatch/useSubscribe、ZoneLevelEnum
- 工具函数：getEnvironment、useEnvironment、formatString、cx、isDefined
- 接口：均来自 `@/request/right`

---

## 版本信息

| 字段 | 值 |
|------|---|
| **Skill ID** | `gd-es-next-right-damage-to-towns` |
| **当前版本** | `1.5.0` |
| **最后更新** | `2026-06-16` |
| **维护者** | Emergency Support Team |
| **入口模块** | `apps/main/app/components/right/network-compact/damage-to-towns/index.tsx` |
| **接口文件** | `apps/main/request/right.ts`（6 个 viewItemId） |
| **配置文件** | `apps/main/public/config/environment.json` |
| **关联文档** | [exit-service-detail.md](./exit-service-detail.md)（弹窗实现） |

## 版本历史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| `1.5.0` | `2026-06-16` | **评审修复**：文件地图改为角色标签（避免行数过期）；场景 1 colors 路径补全两处；onCellClick 表合并 `scanTime`/`dataTime` 行；新增"版本号协调规则"（子文档独立演进） |
| `1.4.0` | `2026-06-16` | **结构性重构**：新增 30 秒 TL;DR + 任务入口索引 + 文件地图 + 任务卡（11 个常见修改各 1-3 行）；关键概念精简为 5 节表格化；排错改为 Q&A 表；场景指南精简为 4-5 步清单；版本信息从 2 个文件合并为 1 处。**目标：30 秒定位任务、3 步内找到修改位置** |
| `1.3.1` | `2026-06-16` | 同步修复：SKILL.md「修改弹窗下钻行为」章节仍残留旧文本「约 line 189…时终止下钻」 |
| `1.3.0` | `2026-06-16` | 弹窗选中态改为内部 `state.selectedRowKey` 自管理；GIS 派发分流；`index.tsx:216` prop 注释 |
| `1.2.0` | `2026-06-16` | GIS 派发字段分流：`damageToTownsModalGisPin`；`Part.Middle.Settings.tsx` btns 改 getter |
| `1.1.0` | `2026-06-16` | 新增关键交互机制详解、拓展场景、常见问题排错 |
| `1.0.0` | `2026-06-02` | 初版发布 |

## 适用范围

- ✅ **适用**：新增/修改三栏表格列、调整轮询、配置弹窗列、调整下钻行为、修改 ServiceType 枚举、调整拖拽、修改 GIS 派发参数
- ✅ **适用**：接入新数据源、新增/调整颜色枚举（**必须同步** `Context.tsx:AlarmLevelString`）
- ✅ **适用**：6 类拓展场景 + 7 类排错
- ⚠️ **谨慎**：修改 `onCellClick` 字段、修改 `currentRegionParams` 回退逻辑、修改 `dataTime` 同步链路（牵涉面广）
- ❌ **不适用**：跨模块修改、纯样式/响应式调整
