# damageToTownsGisPin 全局状态变量维护文档

## 1. 概述

`damageToTownsGisPin` 是应急支撑系统中用于**乡镇退服告警GIS定位联动**的核心全局状态变量。该变量实现了右侧告警面板与地图组件之间的数据传递和事件联动。

**核心职责**：
- 存储乡镇退服告警的详细信息
- 协调多个组件之间的联动行为
- 支持图例自动勾选、地图定位、数据请求等场景

## 2. 定义与注册

### 2.1 字段定义

**文件**: `apps/main/app/components/fields.ts`

```typescript
{
    name: "sectionRight:damageToTownsGisPin",
    value: "sectionRight:damageToTownsGisPin",
    desc: "乡镇受损:Gis定位",
}
```

### 2.2 状态派发

**文件**: `apps/main/app/components/right/network-compact/damage-to-towns/index.tsx`

```typescript
const params = {
    townName,
    zoneName,
    zoneLevel: "3",
    alarmType: info.table === "middleTable" ? get(info, "tableType") : get(info, "record.alarmType"),
    scanTime: info.table === "middleTable" ? get(info, "record.scanTime") : get(info, "record.dataTime"),
    sceneType: "township",
    isTownship: true,
    townId,
    regionName,
    cityName,
    isTownExitRoute,
    selected,
};

dispatch(widgetFields.getField("sectionRight:damageToTownsGisPin"), params);
```

## 3. 数据结构

| 字段 | 类型 | 说明 | 来源 | 约束 |
|------|------|------|------|------|
| `townName` | string | 乡镇名称 | 告警记录 | 必填 |
| `zoneName` | string | 区域名称 | 告警记录 | 必填 |
| `zoneLevel` | string | 区域级别 | 固定值"3" | 固定为"3" |
| `alarmType` | string | 告警类型 | `record.tableType`/`record.alarmType` | 必须为三种类型之一 |
| `scanTime` | string | 扫描/数据时间 | `record.scanTime`/`record.dataTime` | 必填 |
| `sceneType` | string | 场景类型 | 固定值"township" | 固定为"township" |
| `isTownship` | boolean | 是否乡镇 | 固定为true | 固定为true |
| `townId` | string/number | 乡镇ID | 告警记录 | 可选 |
| `regionName` | string | 省份名称 | 告警记录 | 必填 |
| `cityName` | string | 城市名称 | 告警记录 | 必填 |
| `isTownExitRoute` | boolean | 是否乡镇退服路由 | 判断逻辑 | 必填 |
| `selected` | boolean | 是否选中状态 | 点击事件 | 必填 |

## 4. 告警类型枚举

```typescript
// 有效的告警类型
["乡镇单断", "乡镇双断", "乡镇全阻"]
```

## 5. 消费组件列表

### 5.1 组件映射表

| 组件 | 文件路径 | 功能 | 触发条件 |
|------|----------|------|----------|
| **DispatchLegend** | `dispatch-legend/index.tsx` | 图例联动（自动勾选光缆、机房） | `alarmType`匹配 + `selected=true` |
| **zone-select** | `zone-select/index.tsx` | 地图定位到告警乡镇 | `selected=true` |
| **center-gis** | `center-gis/index.tsx` | 触发传输机房光缆数据请求 | `alarmType`匹配 + `selected=true` + `zoneLevel=town` |
| **dispatch-gis/index.tsx** | `dispatch-gis/index.tsx` | props传递给子组件 | 无 |

### 5.2 图例联动（DispatchLegend）

```typescript
useEffect(() => {
    if (["乡镇单断", "乡镇双断", "乡镇全阻"].includes(damageToTownsGisPin?.alarmType) && damageToTownsGisPin?.selected) {
        const newCheckedValues = { ...checkedValues, 光缆: true, 机房: true };
        setTimeout(() => {
            setCheckedValues(newCheckedValues);
        }, damageToTownsGisPinTimeout * 1000);
    }
}, [damageToTownsGisPin]);
```

### 5.3 地图定位（zone-select）

```typescript
useEffect(() => {
    if (damageToTownsGisPin?.selected && dataList) {
        const { regionName, cityName, townName } = damageToTownsGisPin;
        locateZoneInfo(regionName, cityName, townName, dataList, false);
    }
}, [damageToTownsGisPin]);
```

### 5.4 数据请求（center-gis）

```typescript
if (
    !["乡镇单断", "乡镇双断", "乡镇全阻"].includes(damageToTownsGisPin?.alarmType) ||
    !damageToTownsGisPin?.selected ||
    currentZone?.zoneLevel !== ZoneLevelEnum.town
) {
    return;
}
// 执行乡镇退服相关的数据请求
```

## 6. 数据流转图

```
右侧面板选择告警 → dispatch派发状态 → 各组件监听变化 → 执行联动操作
    ↓                      ↓                     ↓                   ↓
damage-to-towns → damageToTownsGisPin → DispatchLegend/zone-select/center-gis → 图例勾选/地图定位/数据请求
```

## 7. 配置参数

**文件**: `apps/main/public/config/environment.json`

```json
{
    "EMapConfig": {
        "damageToTownsGisPinTimeout": 3  // 联动延迟时间（秒）
    }
}
```

## 8. 关键约束

| 条件 | 说明 | 影响组件 |
|------|------|----------|
| `alarmType` | 必须是 "乡镇单断"、"乡镇双断"、"乡镇全阻" 之一 | DispatchLegend, center-gis |
| `selected` | 必须为 `true` | DispatchLegend, zone-select, center-gis |
| `zoneLevel` | 固定为 "3"（乡镇级别） | center-gis |
| `currentZone?.zoneLevel` | 必须为乡镇级别 | center-gis |

## 9. 维护注意事项

### 9.1 修改场景与影响范围

| 修改场景 | 需要更新的文件 | 影响范围 |
|----------|---------------|----------|
| 新增告警类型 | `dispatch-legend/index.tsx`, `center-gis/index.tsx` | 图例联动、数据请求 |
| 修改数据结构 | `damage-to-towns/index.tsx`, 所有消费组件 | 全局联动 |
| 调整联动延迟 | `environment.json` | DispatchLegend, zone-select |
| 修改联动逻辑 | `dispatch-legend/index.tsx` | 图例自动勾选 |

### 9.2 版本兼容性

| 版本 | 变更说明 | 影响组件 |
|------|----------|----------|
| v1.0 | 初始版本 | 所有组件 |
| v1.1 | 新增 `isTownExitRoute` 字段 | damage-to-towns, center-gis |

## 10. 常见问题

### 10.1 联动不生效

**问题现象**：选中乡镇退服告警后，图例或地图没有联动

**排查步骤**：
1. 检查 `alarmType` 是否为有效值（乡镇单断/双断/全阻）
2. 检查 `selected` 是否为 `true`
3. 检查 `damageToTownsGisPinTimeout` 配置是否合理
4. 检查 dispatch 是否正确派发

### 10.2 数据过期

**问题现象**：显示的是旧数据

**解决方案**：确保每次派发时包含最新的 `scanTime` 和 `selected` 状态

### 10.3 重复触发

**问题现象**：多次触发联动操作

**解决方案**：使用 `useEffect` 的依赖数组控制触发条件

## 11. 相关文件

| 文件路径                                                                 | 说明 |
|--------------------------------------------------------------------------|------|
| `apps/main/app/components/fields.ts`                                     | 字段定义 |
| `apps/main/app/components/right/network-compact/damage-to-towns/index.tsx` | 状态派发 |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx` | 图例联动 |
| `apps/main/app/components/center/zone-select/index.tsx`                  | 地图定位 |
| `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`      | 数据请求 |
| `apps/main/app/components/center/dispatch-gis/index.tsx`                 | props传递 |
| `apps/main/public/config/environment.json`                               | 配置参数 |

---

**文档版本**: 1.0  
**最后更新**: 2026-06-04  
**维护团队**: GD Emergency Support Team