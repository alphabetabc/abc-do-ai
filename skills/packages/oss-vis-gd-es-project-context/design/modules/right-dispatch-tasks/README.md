---
name: gd-es-next-right-dispatch-tasks
title: 右屏「抢修调度」维护技能
description: 维护右屏"抢修调度"模块，包含顶部专业切换与时间选择、调度汇总（顶部统计 + Tab 切换 + 表格 + Steps 工单状态）、抢修资源（水球图 + 多环饼图）三块。Invoke when 修改、扩展或排查右屏"抢修调度"任意子模块、其依赖 API、配置或样式时。
version: 1.0.0
author: Emergency Support Team
tags:
    - dispatch-tasks
    - dispatch-summary
    - resource-usage
    - emergency-support
    - right-screen
    - steps
    - echarts
---

# 右屏「抢修调度」维护 Skill

> **目录约定**：
>
> - `references/main.md` — 主组件 `DispatchTasks`（顶部工具条 + 派发两子组件）
> - `references/dispatch-summary.md` — `DispatchSummary`（顶部统计 / Tab / 队伍-工单双表格）
> - `references/resource-usage.md` — `ResourceUsage`（水球图 + 多环饼图）
> - `references/api.md` — 4 个 API 入参/响应
> - `references/style.md` — 关键 class 与样式约束
> - 跨切面概念（专业切换、时间区间、轮询、store 联动）只在 SKILL.md 定义一次

---

## TL;DR（30 秒）

| 维度         | 速记                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| **模块归属** | `apps/main/app/components/right/dispatch-tasks/`                                                                |
| **公共**     | `apps/main/request/custom/right.ts` + `environment.json` + `widgetFields`（`sectionRight:selectedDispatchTeamOrOrder`） |
| **轮询**     | 两子模块独立配置键（默认 300 秒）：`dispatch-tasks-summary.request.interval` / `dispatch-tasks-resource-usage.request.interval` |
| **专业切换** | `无线专业` / `传输专业`（`传输汇聚`、`传输接入` 已注释保留）                                                      |
| **时间区间** | `supportTask.eventStartTime` → `eventEndTime`，自动填充，手动可改                                                  |

---

## 适用场景

- 修改主组件顶部日期选择器或专业切换 Tab。
- 修改 `DispatchSummary` 顶部 3 张统计卡、效率 Tab、队伍/工单表格、Steps 工单状态。
- 修改 `ResourceUsage` 水球图、环饼图、图标（队伍/人员/油机）。
- 调整 `environment.json` 中 `dispatch-tasks-summary` / `dispatch-tasks-resource-usage` 轮询。
- 排查数据不更新、Tab 切换空白、Steps 显示异常、行选中态丢失等问题。
- 接入 / 修改后端 API（dispatch 4 个）。
- 调整 store 联动（`sectionRight:selectedDispatchTeamOrOrder`）。

---

## 任务入口

| 任务               | 一句话答案                                                | 详细                                                                                 |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **改顶部日期/专业** | 主组件 `index.tsx` 的 `state.timeRange` + `typeSelected`  | [main.md §状态机](./references/main.md)                                              |
| **改顶部统计卡**   | `DispatchSummary` → `dataSummary.map`                     | [dispatch-summary.md §顶部统计](./references/dispatch-summary.md#顶部统计)           |
| **改效率 Tab**     | `DispatchSummary` → `state.efficiencySelected`            | [dispatch-summary.md §效率 Tab](./references/dispatch-summary.md#效率-tab)           |
| **改队伍表格列**   | `DispatchSummary` → `teamColumns`（含无线专业油机/卫星包） | [dispatch-summary.md §队伍表格](./references/dispatch-summary.md#队伍表格)          |
| **改工单表格列**   | `DispatchSummary` → `orderColumns` + `renderOrderStatusSteps` | [dispatch-summary.md §工单表格](./references/dispatch-summary.md#工单表格)        |
| **改 Steps 工单状态** | `renderOrderStatusSteps`（内联于 dispatch-summary/index.tsx，含异常结束样式） | [order-status-steps.md §任务入口](./references/order-status-steps.md#任务入口) |
| **改水球图**       | `ResourceUsage` → `liquidOption`                          | [resource-usage.md §水球图](./references/resource-usage.md#水球图)                   |
| **改环饼图**       | `ResourceUsage` → `generateChartOption`                   | [resource-usage.md §环饼图](./references/resource-usage.md#环饼图)                   |
| **改轮询**         | `environment.json` → `dispatch-tasks-*.request.interval`  | —                                                                                    |
| **改 API**         | `apps/main/request/custom/right.ts`                       | [api.md](./references/api.md)                                                        |
| **改样式**         | 两个 `index.css` + 关键 class                             | [style.md](./references/style.md)                                                    |

---

## 关键概念（一次讲清楚，跨切面）

### 1. 三层组件结构

```text
DispatchTasks (主组件，顶部工具条 + 派发)
    ├── DispatchSummary   (顶部 3 统计卡 + 效率 Tab + 队伍/工单表格)
    └── ResourceUsage     (左侧水球图 + 右侧 3 个环饼图)
```

- 主组件只持有 **顶部日期 + 专业类型**，向下透传 `taskId` / `currentZone` / `timeRange` / `professionalType`。
- 两子组件独立轮询、独立 `useEnvironment` 配置键，**互不依赖**。

详见 [main.md](./references/main.md)。

### 2. 专业类型枚举（4 个值，实际只启用 2 个）

```typescript
type ProfessionalType = "无线专业" | "传输汇聚" | "传输接入" | "传输专业";
```

| 取值           | 启用 | 表格列差异                                              | 检索字段                                |
| -------------- | ---- | ------------------------------------------------------- | --------------------------------------- |
| `无线专业`     | ✅   | 油机（已用/总数）、卫星包                              | `stationName` / `faultName` / `car`     |
| `传输汇聚`     | ❌   | 已注释保留                                              | —                                       |
| `传输接入`     | ❌   | 已注释保留                                              | —                                       |
| `传输专业`     | ✅   | 基础列（机房名称、故障发生时间）                        | `regionName` / `team` / `orderType`     |

> **注意**：Tab 顶部已注释 `传输汇聚` / `传输接入`，**修改专业类型时检查 4 处一致性**：顶部 Tab、`state.typeSelected` 初始值、`teamColumns` 分支、`orderColumns` 分支、`efficiencySelected` 重置 effect。

详见 [dispatch-summary.md §专业类型差异](./references/dispatch-summary.md#专业类型差异)。

### 3. 时间区间双轨制

```text
state.timeRange (用户选择)         →  "YYYY-MM-DD"
state.timeRangeParams (入参)      →  "YYYY-MM-DD" + "YYYY-MM-DD 23:59:59"
```

- 主组件初始化：`eventStartTime` → `eventEndTime || dayjs().format("YYYY-MM-DD")`。
- 主组件 `useEffect`：当 `timeRange` 都有值时同步 `timeRangeParams`，**end 自动补齐 `23:59:59`**。

详见 [main.md §时间区间](./references/main.md#时间区间)。

### 4. 轮询配置键（两子模块独立）

| 子模块           | 配置键                                                       | 默认 |
| ---------------- | ------------------------------------------------------------ | ---- |
| DispatchSummary  | `gd-emergency-support.modules.dispatch-tasks-summary.request` | 300s |
| ResourceUsage    | `gd-emergency-support.modules.dispatch-tasks-resource-usage.request` | 300s |

均通过 `useEnvironment("...request")?.interval` 读取，`pollingInterval: interval * TIME_RANGE.SECOND`。

详见 [main.md §轮询](./references/main.md#轮询)。

### 5. 行选中态（store 联动）

- 主键：`sectionRight:selectedDispatchTeamOrOrder`（注册于 `apps/main/app/components/fields.ts`）。
- 形状：`{ type: "队伍" | "工单", record: any | null }`。
- 点击表格行 → `dispatch(...)` 写入；再次点击同记录 → `record: null`。
- 判定：`JSON.stringify(selectedTeam?.record) === JSON.stringify(record)`，包在 `try/catch` 内防止序列化报错。
- 高亮 class：`row-selected`（背景色 `rgba(41, 122, 191, 0.5)`）。

详见 [dispatch-summary.md §行选中态](./references/dispatch-summary.md#行选中态)。

### 6. Steps 工单状态（异常结束分支）

`renderOrderStatusSteps(orderStatus)` 把后端 `[{ name, value, time }]` 转成 `Steps` 数组：

| `value` | Steps status    | 图标背景                |
| ------- | --------------- | ----------------------- |
| `"1"`   | `finish`        | 绿色 `rgba(61, 255, 99)` |
| `"0"`   | `wait`          | 半透明白色              |

**异常结束分支**：`name === "异常结束"` → `className: "dispatch-summary-steps-item-abnormal"`，图标变金黄 `rgba(251, 212, 103)`。

Steps 整体套 `<Tooltip>`，每行显示 `name + time`。

详见 [order-status-steps.md](./references/order-status-steps.md)。

### 7. ResourceUsage 图标三态

| `pie.type` | 图标                  | typeName         |
| ---------- | --------------------- | ---------------- |
| `1`        | `iconPie1`（队伍）    | 队伍              |
| `2`        | `iconPie2`（人员）    | 人员              |
| 其他       | `iconPie3`（油机）    | 油机              |

图标来自 `@/images/resource-{队伍|人员|油机}.png`，通过 `graphic` 居中绘制（`left: 22%, top: 31%`）。

详见 [resource-usage.md §环饼图](./references/resource-usage.md#环饼图)。

---

## 文档导航

### references/

| 文档                                                                                  | 何时读                |
| ------------------------------------------------------------------------------------- | --------------------- |
| [main.md](./references/main.md)                                                       | **改主组件 / 顶部**   |
| [dispatch-summary.md](./references/dispatch-summary.md)                               | **改汇总子组件**      |
| [resource-usage.md](./references/resource-usage.md)                                   | **改资源子组件**      |
| [api.md](./references/api.md)                                                         | **查/改接口**         |
| [style.md](./references/style.md)                                                     | **改样式**            |
| [order-status-steps.md](./references/order-status-steps.md)                         | **改 Steps 工单状态** |

---

## 排错（Q&A）

| #   | 症状                                | 一句话定位                                                            |
| --- | ----------------------------------- | --------------------------------------------------------------------- |
| Q1  | 数据不更新                          | `environment.json` → `dispatch-tasks-summary.request.interval` / `dispatch-tasks-resource-usage.request.interval` |
| Q2  | 顶部时间没自动填充                  | `supportTask?.eventStartTime` 为空 / 任务切换未触发 effect            |
| Q3  | 切换专业后表格列不变化              | `teamColumns` / `orderColumns` 的 `useMemo` 依赖未带 `professionalType` |
| Q4  | 工单状态 Steps 全显示为 wait        | 后端 `value` 全为 `"0"`（未完成）；检查数据源                          |
| Q5  | 异常结束 Steps 没有金黄色            | `name` 不是 `"异常结束"` 字面量；后端命名变化                          |
| Q6  | 行点击无选中态                      | `fields.ts` 未注册 `sectionRight:selectedDispatchTeamOrOrder`         |
| Q7  | 行选中后高亮丢失                    | `JSON.stringify` 抛出 → `isActive = false`；记录含循环引用              |
| Q8  | 环饼图图标不显示                    | `pie.type` 不在 1/2 范围；走默认 `iconPie3`                            |
| Q9  | 水球图数字不更新                    | `liquidOption` 的 `useMemo` 依赖未带 `dataChart.liquidValue`         |
| Q10 | `dispatch-tasks-resource-usage` 接口返回兜底数据 | `getEmergencyDispatchResourceUsageApi` 内 `err` 或 `isEmpty(rows)` 兜底逻辑触发 |

---

## 场景指南

### 场景 1：新增专业类型（如 `传输汇聚` 启用）

1. `index.tsx` 顶部 Tab 解除注释。
2. `DispatchSummary` → `teamColumns` / `orderColumns` 添加分支。
3. `DispatchSummary` → `efficiencySelected` 重置 effect 检查（`useEffect` 仅重置为 `"队伍"`）。
4. 检索字段映射：当前 `非无线专业` 走 `regionName/team/orderType`，可参考。

### 场景 2：新增汇总顶部统计项

1. `DispatchSummary` → `dataSummary.map` 不变（**保持 3 个**），如要多于 3 个：
   - 调整 `SummaryImages` 数组与 `dispatch-tasks-dispatch-summary-top-item` 容器宽度。
   - 调整顶部颜色数组 `["rgba(40, 108, 246, 1)", "rgba(246, 191, 40, 1)", "rgba(109, 212, 1, 1)"]`。
2. 如需新增 mock 数据，参见 `apps/main/public/static/mock/emergency/custom-gd-emergency-support-right.json`。

### 场景 3：调整工单 Steps 样式

- 步骤容器宽：`calculateStepsWidth(length)` = `Math.min(550, length === 1 ? 75 : 29 + length * 56)`。
- 图标颜色：`rgba(61, 255, 99, 0.6)` 边框 + `rgba(61, 255, 99, 0.2)` 背景。
- 异常结束 class：`dispatch-summary-steps-item-abnormal` → 金黄 `rgba(251, 212, 103)`。

### 场景 4：调整水球图配色 / 数字格式

- `liquidOption` 内 `color` 数组（线性渐变 `rgba(0, 149, 255, 1)` → `rgba(7, 55, 89, 1)`）。
- `label.formatter`：当前 `${dataChart.liquidValue}%`，小数位固定。
- 数据范围：`dataChart.liquidValue / 100`（水球图要求 0-1）。

### 场景 5：Mock 切真实 API

`apps/main/request/custom/right.ts` 每个 `getViewItemDataApi` 调用清空 `localMockUrl`。**不要删** `viewItemId`/`viewPageId`。

### 场景 6：行选中扩展为多选 / 跨模块

- 当前 `sectionRight:selectedDispatchTeamOrOrder` 单值字段，多选需新增独立字段（如 `selectedDispatchTeamList`）。
- 联动模块：左屏应急资源、右屏 GIS（若需要派发点位）。

---

## 版本信息

| 字段         | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| **Skill ID** | `gd-es-next-right-dispatch-tasks`                                   |
| **当前版本** | `1.0.0`                                                             |
| **最后更新** | `2026-07-13`                                                        |
| **维护者**   | Emergency Support Team                                              |
| **入口模块** | `apps/main/app/components/right/dispatch-tasks/`                    |
| **接口文件** | `apps/main/request/custom/right.ts`（dispatch 4 个）                |
| **配置文件** | `apps/main/public/config/environment.json`                          |

## 适用范围

- ✅ **适用**：修改 / 扩展 / 排查 DispatchTasks、DispatchSummary、ResourceUsage 任意子模块
- ✅ **适用**：跨子模块的统一修改（轮询、专业切换、时间区间）
- ✅ **适用**：6 类场景拓展 + 10 条排错
- ⚠️ **谨慎**：修改跨切面概念（专业类型枚举、时间区间双轨制）——牵涉两子模块
- ⚠️ **谨慎**：修改 store 字段 `sectionRight:selectedDispatchTeamOrOrder`（必须同步消费方）
- ❌ **不适用**：右屏"实时影响"模块（network-compact）、左屏、Header
- ❌ **不适用**：纯样式 / 响应式调整