# API 维护

抢修调度 4 个 API 全部位于 [apps/main/request/custom/right.ts](apps/main/request/custom/right.ts)。

- `baseUrlType`: `sceneViewServiceWD`
- `viewPageId`: `custom-gd-emergency-support-right`

## 4 个 API 总览

| 函数                              | viewItemId                       | localMockUrl                                                     |
| --------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `getEmergencyDispatchSummaryApi`  | `emergency-dispatch-summary`     | `/static/mock/emergency/custom-gd-emergency-support-right.json`  |
| `getEmergencyDispatchTeamApi`     | `emergency-dispatch-team`        | `/static/mock/emergency/emergency-dispatch-team.json`            |
| `getEmergencyDispatchOrderApi`    | `emergency-dispatch-order`       | `/static/mock/emergency/emergency-dispatch-order.json`           |
| `getEmergencyDispatchResourceUsageApi` | `emergency-dispatch-resource-usage` | `/static/mock/emergency/emergency-dispatch-resource-usage.json` |

> 所有函数接收 `viewPageArgs`，由组件直接传入。

## 通用入参

```typescript
{
    taskId: string,                  // 来自 supportTask?.wdId
    zoneId?: string,                 // 来自 currentZone?.zoneId
    zoneLevel?: number,              // 来自 currentZone?.zoneLevel
    timeRange?: [string, string],    // 来自主组件 state.timeRangeParams
    professionalType?: string,       // 来自主组件 state.typeSelected
}
```

## Summary 入参与响应

```typescript
getEmergencyDispatchSummaryApi({ taskId, zoneId, zoneLevel, professionalType, timeRange })
```

**响应**（`rows[]` 数组，每项字段）：

| 字段      | 类型   | 含义                       |
| --------- | ------ | -------------------------- |
| `name`    | string | 统计项名称（如"工单总数"） |
| `value`   | string | 数值                       |
| `unit`    | string | 单位                       |
| `renderRowKey` | string | 渲染 key（由后端转换时附加） |

> 固定返回 3 个统计项，与顶部卡片数对应。

## Team 入参与响应

```typescript
getEmergencyDispatchTeamApi({ taskId, zoneId, zoneLevel, professionalType, timeRange, regionName, team })
```

| 参数         | 来源                       |
| ------------ | -------------------------- |
| `regionName` | `state.regionName`（队伍检索） |
| `team`       | `state.team`（队伍检索）       |

**响应字段**（无线专业）：

```text
区域(region) | 队伍(team) | 队长(leaderName) | 电话(leaderPhone)
| 任务中(taskInProgress) | 异常归档(abnormalArchived)
| 抢通数(normalArchived) | 工作量(workload)
| 油机已用(generatorUsed) | 油机总数(generatorTotal) | 卫星包(satellitePack)
```

**响应字段**（传输专业）：

```text
区域 | 队伍 | 队长 | 电话 | 任务中 | 异常归档 | 抢通数 | 工作量
```

## Order 入参与响应

```typescript
getEmergencyDispatchOrderApi({
    taskId, zoneId, zoneLevel, professionalType, timeRange,
    stationName?,   // 无线专业-工单检索
    faultName?,     // 无线专业-工单检索
    car?,           // 无线专业-工单检索
    orderType?,     // 传输专业："汇聚层工单"/"接入层工单"，队伍时传 ""
    regionName?,    // 传输专业-工单检索
    team?,          // 传输专业-工单检索
})
```

> 入参逻辑在 `DispatchSummary` 内按 `professionalType` 分支：

```typescript
if (professionalType === "无线专业") {
    Object.assign(params, { stationName, faultName, car });
} else {
    Object.assign(params, {
        regionName: orderRegionName,
        team: orderTeamName,
        orderType: efficiencySelected === "队伍" ? "" : efficiencySelected,
    });
}
```

**响应字段**：

```text
工单号(orderId) | 站名/机房名称(stationName) | 站点层级(siteLevel, 仅无线)
| 油机(generator, 仅无线) | 故障发生时间(faultTime, 仅传输)
| 故障处理人(handler) | 电话(phone) | 工单状态(orderStatus)
```

**orderStatus 子结构**（数组）：

```typescript
orderStatus: Array<{
    name: string,    // 步骤名（如"派单"、"接单"、"到场"、"抢通完成"、"异常结束"）
    value: string,   // "1"=已完成, "0"=未完成
    time: string,    // 时间字符串
}>
```

`renderOrderStatusSteps` 把这个数组转成 `Steps` 数组（详见 [dispatch-summary.md §Steps 工单状态](./dispatch-summary.md#steps-工单状态)）。

## ResourceUsage 入参与响应

```typescript
getEmergencyDispatchResourceUsageApi({ taskId, zoneId, zoneLevel, timeRange, professionalType })
```

**响应**：

```typescript
{
    liquidValue: number,  // 资源使用率 0-100（API 内部 row.resourceUsageRate * 100）
    pieData: [
        { type: 1, typeName: "队伍", totalNum, taskNum, closeNum },
        { type: 2, typeName: "人员", totalNum, taskNum, closeNum },
        { type: 3, typeName: "油机", totalNum, taskNum, closeNum },
    ]
}
```

> **兜底逻辑**：API 内部若 `err || isEmpty(rows)`，自动返回 `{ liquidValue: 0, pieData: [...3 个全 0] }`。

**响应字段映射**：

| 字段                | 后端字段            | 含义           |
| ------------------- | ------------------- | -------------- |
| `liquidValue`       | `resourceUsageRate` | 资源使用率     |
| `pieData[0].totalNum` | `teamTotal`        | 队伍总数       |
| `pieData[0].taskNum`  | `teamInTask`       | 任务中队伍     |
| `pieData[0].closeNum` | `teamIdle`         | 空闲队伍       |
| `pieData[1].totalNum` | `personTotal`      | 人员总数       |
| `pieData[1].taskNum`  | `personInTask`     | 任务中人员     |
| `pieData[1].closeNum` | `personIdle`       | 空闲人员       |
| `pieData[2].totalNum` | `generatorTotal`   | 油机总数       |
| `pieData[2].taskNum`  | `generatorOccupied`| 已占用油机     |
| `pieData[2].closeNum` | `generatorIdle`    | 空闲油机       |

## Mock 切换真实 API

每个 `getViewItemDataApi` 调用清空 `localMockUrl`：

```typescript
getViewItemDataApi({
    loggerText: "...",
    baseUrlType,
    localMockUrl: "",  // ← 清空
    params: { viewPageId, viewItemId, viewPageArgs },
    converter: defaultConverter,
})
```

**不要删** `viewItemId` / `viewPageId`。

## 相关文档

- [main.md](./main.md) — 主组件如何使用 API
- [dispatch-summary.md](./dispatch-summary.md) — 汇总子组件字段细节
- [resource-usage.md](./resource-usage.md) — 资源子组件字段细节