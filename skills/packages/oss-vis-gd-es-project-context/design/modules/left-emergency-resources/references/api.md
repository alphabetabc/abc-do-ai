# API 维护

应急资源 API 全部位于 [apps/main/request/custom/left.ts](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/request/custom/left.ts)。

- `baseUrlType`: `sceneViewServiceWD`
- `viewPageId`: `custom-gd-emergency-support-left`

## 11 个 API 总览

| 函数 | viewItemId | localMockUrl |
| --- | --- | --- |
| `getEmergencyResourcesCrossCityApi` | `emergency-resource-cross-city` | `/static/mock/emergency/emergency-resource-cross-city.json` |
| `getEmergencyResourcesFullApi` | `emergency-resource-full` | `/static/mock/emergency/emergency-resource-full.json` |
| `getEmergencyResourcesRealTimeApi` | `emergency-resource-real-time` | `/static/mock/emergency/emergency-resource-real-time.json` |
| `getEmergencyResourcesPresetApi` | `emergency-resource-preset` | `/static/mock/emergency/emergency-resource-preset.json` |
| `getEmergencyResourceRealTimeDetailApi` | `emergency-resource-real-time-detail` | `/static/mock/emergency/emergency-resource-real-time-detail.json` |
| `getEmergencyResourceFullDetailApi` | `emergency-resource-full-detail` | `/static/mock/emergency/emergency-resource-full-detail.json` |
| `getEmergencyResourcePresetDetailApi` | `emergency-resource-preset-detail` | `/static/mock/emergency/emergency-resource-preset-detail.json` |
| `getEmergencyResourceCrossCityDetailApi` | `emergency-resource-cross-city-detail` | `/static/mock/emergency/emergency-resource-cross-city-detail.json` |
| `getEmergencyResourcePresetDetailRegionApi` | `emergency-resource-preset-detail-region` | `/static/mock/emergency/emergency-resource-preset-detail-region.json` |
| `getEmergencyResourcePresetDetailTypeApi` | `emergency-resource-preset-detail-type` | `/static/mock/emergency/emergency-resource-preset-detail-type.json` |
| `getEmergencyResourcePresetDetailListApi` | `emergency-resource-preset-detail-list` | `/static/mock/emergency/emergency-resource-preset-detail-list.json` |

## 4 个图表 API 入参

```typescript
getEmergencyResourcesXxxApi({ taskId: string; zoneId: string; zoneLevel: number | string });
```

| 参数 | 来源 |
| --- | --- |
| `taskId` | `supportTask?.wdId` |
| `zoneId` | `currentZone?.zoneId` |
| `zoneLevel` | `currentZone?.zoneLevel` |

## 4 个详情 API 入参

### 实时出动 / 全量资源 / 跨市调度

```typescript
getEmergencyResourceXxxDetailApi({ taskId, zoneId, zoneLevel, resourceType });
getEmergencyResourceFullDetailApi({ taskId, zoneId, zoneLevel, xCode, cityId });
```

| 详情 API | resourceType 来源 | cityId 来源 |
| --- | --- | --- |
| 实时出动 | `state.resourceType` | — |
| 跨市调度 | `state.resourceType` | — |
| 全量资源 | `dataFull?.find(item => item.x === state.resourceType)?.xCode` | `currentZone?.zoneLevel === city ? currentZone?.cityId : undefined` |

### 本地预置

```typescript
getEmergencyResourcePresetDetailApi({ taskId, zoneId, zoneLevel, resourceType });
```

## 3 个本地预置-队伍 API 入参

| API | 入参 |
| --- | --- |
| `getEmergencyResourcePresetDetailRegionApi` | `taskId, zoneId, zoneLevel` |
| `getEmergencyResourcePresetDetailTypeApi` | `taskId, zoneId, zoneLevel, zoneId: 已选区域` |
| `getEmergencyResourcePresetDetailListApi` | `taskId, zoneId, zoneLevel, zoneId: 已选区域, type: 已选类型` |

## 响应字段

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `rows[]` | array | 数据行，每行对应一个区域+资源类型组合 |
| `rows[].zoneId` | string | 区域 ID |
| `rows[].zoneName` | string | 区域名称 |
| `rows[].resourceType` | string | 资源类型中文名 |
| `rows[].xCode` | string | 资源类型后端编码 |
| `rows[].xxx` | number | 资源数量字段 |
| `合计行` | — | `zoneName: "合计"`、`zoneId: "-999"` |

## resourceType 映射

详情接口中的中文 `resourceType` 通过 `reverseResourceTypeMap` 转成后端字段：

```typescript
const reverseResourceTypeMap = {
    卫星电话: "preset_material_isatphone",
    卫星便携包: "preset_material_portableBag",
    队伍: "preset_material_team",
    人员: "preset_material_teamMember",
};
```

新增资源类型时优先检查这里是否需要补充映射。

## 相关文档

- [detail.md](detail.md) — 各 API 对应的详情组件
- [main.md](main.md) — 主组件如何使用这些 API
