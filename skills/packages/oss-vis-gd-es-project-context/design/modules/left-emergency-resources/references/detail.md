# 详情组件

5 个详情组件的字段、表格结构与列宽配置关系。

## 组件总览

| 组件 | 表格结构 | 层级 | 读取的配置节点 |
| --- | --- | --- | --- |
| `EmergencyResourcesDetail` | 动态资源父+子列 | 2 | `resourceColumns` |
| `EmergencyResourcesFullDetail` | 动态资源父+子列 | 2 | `resourceColumns` |
| `EmergencyResourcesCrossCityDetail` | 动态资源父+子列 | 2 | `resourceColumns` |
| `EmergencyResourcesPresetDetail` | 资源类型→移动/铁塔→计划/到达 | 3 | `resourceColumns` |
| `EmergencyResourcesPresetTeamDetail` | 平铺固定列 | 1 | `columns` |

## 字段定义

### EmergencyResourcesDetail（实时出动）

| 字段 | 含义 |
| --- | --- |
| `totalCount` | 总计 |
| `localInTask` | 任务中(本地) |
| `externalInTask` | 任务中(被支援) |
| `idle` | 空闲 |

### EmergencyResourcesFullDetail（全量资源）

| 字段 | 含义 |
| --- | --- |
| `totalCount` | 总计 |
| `localInTask` | 任务中(本地) |
| `externalInTask` | 任务中(外派) |
| `idle` | 空闲 |

城市层级特殊处理：

```typescript
zoneId: currentZone?.zoneLevel === ZoneLevelEnum.city ? currentZone?.regionId : currentZone?.zoneId;
zoneLevel: currentZone?.zoneLevel === ZoneLevelEnum.city ? ZoneLevelEnum.region : currentZone?.zoneLevel;
```

并将 `cityId` 作为第二参数传给 API，在 API 内过滤 rows。

### EmergencyResourcesCrossCityDetail（跨市调度）

| 字段 | 含义 |
| --- | --- |
| `total` | 总计 |
| `arrived` | 到达 |
| `inTask` | 在途 |

### EmergencyResourcesPresetDetail（本地预置）

| 字段 | 含义 |
| --- | --- |
| `mobilePlan` | 移动计划 |
| `mobileArrival` | 移动到达 |
| `towerPlan` | 铁塔计划 |
| `towerArrival` | 铁塔到达 |

只有 `人员`、`队伍`、`抢修车辆`、`油机` 会展示铁塔列。

### EmergencyResourcesPresetTeamDetail（本地预置-队伍）

三段数据：

1. 区域列表：`getEmergencyResourcePresetDetailRegionApi`
2. 中间类型统计：`getEmergencyResourcePresetDetailTypeApi`
3. 队伍列表：`getEmergencyResourcePresetDetailListApi`

状态联动：

- `dataRegion` 更新后默认选中第一个 `zoneId`
- `dataStat` 更新后默认选中第一个 `type`
- 点击区域会刷新中间统计和列表
- 点击统计类型会刷新列表

表格字段：

| 字段 | 含义 |
| --- | --- |
| `zone` | 区域 |
| `team` | 队伍 |
| `leader` | 队长 |
| `phone` | 电话 |
| `type` | 类型 |
| `status` | 状态（`已到达`/`已到位` 时用青色高亮） |
| `assignTime` | 任务下发时间 |
| `arrivalTime` | 要求到达时间 |
| `preArrivalTime` | 预置到位时间 |

## 数据转换约定

### 表格行聚合

4 个动态资源详情组件（Detail / FullDetail / PresetDetail / CrossCityDetail）都会把接口返回的多行资源类型数据按区域合并成一行：

```typescript
const zoneKey = `${item.zoneId}_${item.zoneName}`;
acc[zoneKey][`${item.resourceType}_xxx`] = Number(item.xxx) || 0;
```

新增字段时需要同步修改：

1. API 合计字段
2. 详情组件 columns
3. `dataListNew` 聚合字段
4. sorter 逻辑

### 合计行

多个详情 API 会在前端插入 `zoneName: "合计"`、`zoneId: "-999"` 的合计行，然后再追加原始 rows。修改排序、rowKey 或分组逻辑时不要丢失合计行。

## 接收的 props

```typescript
interface DetailProps {
    currentZone: any;             // 当前区域，含 zoneId、zoneLevel
    taskId?: string;              // 当前任务 ID（supportTask?.wdId）
    resourceType: string;         // 选中的资源类型
    tableColumnsSettings?: any;   // 来自 detailModal.<key> 的列宽配置
}
```

## 相关文档

- [modal-config.md](modal-config.md) — 列宽配置实现细节
- [api.md](api.md) — 各组件对应的 API
- [main.md](main.md) — 主组件派发
