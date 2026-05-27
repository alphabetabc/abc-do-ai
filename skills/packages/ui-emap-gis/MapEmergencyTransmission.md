---
name: "MapEmergencyTransmission"
description: "应急传输图层组件，用于加载和管理传输网络告警图层"
---

# MapEmergencyTransmission 组件说明

## 1. 组件概述

`MapEmergencyTransmission` 是一个 React 组件，用于在 EMap GIS 地图上加载和管理传输网络应急告警图层。该组件封装了 WMS 图层的加载逻辑，支持多层级告警展示和动态 CQL 过滤。

## 2. 组件结构

```
MapEmergencyTransmission
├── 主图层 (WMS)
└── TransmissionSubLayer (可选子图层)
    └── 多个子告警图层
```

## 3. 核心组件

### 3.1 MapEmergencyTransmission

**属性说明：**

| 属性           | 类型             | 必填 | 默认值                | 说明           |
| -------------- | ---------------- | ---- | --------------------- | -------------- |
| id             | `string`         | 否   | `defaultId-{useId}`   | 图层唯一标识   |
| name           | `string`         | 否   | `defaultName-{useId}` | 图层名称       |
| serverCodeName | `ServerCodeName` | 是   | -                     | 服务编码名称   |
| cqlFilter      | `string`         | 否   | -                     | CQL过滤条件    |
| zIndex         | `number`         | 否   | 2                     | 图层层级       |
| enableSubLayer | `boolean`        | 否   | false                 | 是否启用子图层 |
| subLayerList   | `SubLayerItem[]` | 否   | -                     | 子图层配置列表 |

**serverCodeName 支持的值：**

| 服务编码名称           | WMS服务码 | 说明                 |
| ---------------------- | --------- | -------------------- |
| 乡镇界图层             | HRwClcjk  | 乡镇行政区划边界     |
| 乡镇三路由告警图层     | HR5tnRyT  | 乡镇级三路由告警     |
| 地市骨干层路由告警图层 | HRMNncdi  | 地市级骨干层路由告警 |
| 区县汇聚层路由告警图层 | HRCLGQuE  | 区县级汇聚层路由告警 |
| 乡镇接入层路由告警图层 | HRRm2GHe  | 乡镇级接入层路由告警 |
| 乡镇路由站点告警图层表 | HRrNVRh2  | 乡镇路由站点告警     |
| 省级传输二干告警图层   | HRaiGz51  | 省级传输二干告警     |

**SubLayerItem 类型：**

```typescript
{
  color?: string;      // 子图层颜色
  zIndex?: number;     // 子图层层级
  cqlFilter?: string;  // 子图层CQL过滤条件
}
```

### 3.2 TransmissionSubLayer

内部子图层组件，用于渲染多个告警图层实例。当需要对同一数据源应用不同过滤条件和样式时使用。

## 4. API 函数

### 4.1 getEmergencyTransmissionAlarmLayerDataApi

根据电路名称列表获取告警图层配置数据。

**参数：**

| 参数           | 类型             | 必填 | 说明         |
| -------------- | ---------------- | ---- | ------------ |
| serverCodeName | `ServerCodeName` | 是   | 服务编码名称 |
| circuitNames   | `string[]`       | 是   | 电路名称列表 |

**返回值：**

```typescript
{
    zIndex: number; // 图层层级
    cqlFilter: string; // CQL过滤条件
    color: string; // 告警颜色
}
[];
```

**内部逻辑：**

1. 根据 `serverCodeName` 获取对应的搜索编码
2. 调用 `EMapRequest.baseInfoSearchMultiSearch` 批量查询电路数据
3. 将结果按 `alarmGroupSize`（默认100）分组，生成多个子图层配置

**搜索编码映射：**

| 服务编码名称           | 搜索编码 |
| ---------------------- | -------- |
| 乡镇三路由告警图层     | IFNRfFfe |
| 地市骨干层路由告警图层 | IF6ZJuvO |
| 区县汇聚层路由告警图层 | IFCqkCYe |
| 乡镇接入层路由告警图层 | IFdphCYW |
| 省级传输二干告警图层   | IFahf2nT |

## 5. 使用示例

### 5.1 基础用法

```tsx
import { MapEmergencyTransmission } from "@/components/ui/emap-gis";

<MapEmergencyTransmission id="town-alarm" name="乡镇三路由告警" serverCodeName="乡镇三路由告警图层" cqlFilter="city in ('广州市')" zIndex={5} />;
```

### 5.2 带自图层的用法

```tsx
<MapEmergencyTransmission
    id="multi-alarm"
    name="多级别告警"
    serverCodeName="地市骨干层路由告警图层"
    enableSubLayer
    subLayerList={[
        { color: "#FF0000", zIndex: 10, cqlFilter: "alarm_level = '严重'" },
        { color: "#FFA500", zIndex: 9, cqlFilter: "alarm_level = '一般'" },
    ]}
/>
```

### 5.3 动态加载告警数据

```tsx
import { useEffect, useState } from "react";
import { MapEmergencyTransmission, getEmergencyTransmissionAlarmLayerDataApi } from "@/components/ui/emap-gis";

const AlarmLayer = ({ circuitNames }) => {
    const [subLayerList, setSubLayerList] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getEmergencyTransmissionAlarmLayerDataApi({
                serverCodeName: "地市骨干层路由告警图层",
                circuitNames,
            });
            setSubLayerList(data);
        };
        fetchData();
    }, [circuitNames]);

    return (
        <MapEmergencyTransmission
            id="dynamic-alarm"
            name="动态告警"
            serverCodeName="地市骨干层路由告警图层"
            enableSubLayer={subLayerList.length > 0}
            subLayerList={subLayerList}
        />
    );
};
```

## 6. 生命周期

### 6.1 挂载阶段

1. 调用 `addEmergencyTransmissionLayer` 创建 WMS 图层
2. 保存图层实例到状态
3. 返回清理函数用于组件卸载时移除图层

### 6.2 更新阶段

- `cqlFilter` 变化：重新创建图层
- `zIndex` 变化：更新图层层级
- `enableSubLayer`/`subLayerList` 变化：重新渲染子图层

### 6.3 卸载阶段

调用保存的 `remove()` 函数移除图层

## 7. 依赖关系

| 依赖                            | 说明                            |
| ------------------------------- | ------------------------------- |
| `useEMapUtil`                   | 自定义Hook，封装EMap工具方法    |
| `useSetState`                   | ahooks的状态管理Hook            |
| `addEmergencyTransmissionLayer` | EMapUtils方法，添加应急传输图层 |
| `EMapRequest`                   | EMap请求工具                    |
| `getEnvironment`                | 环境配置获取                    |

## 8. 配置说明

组件使用 `getEnvironment("EMapConfig.emergencyTransmission")` 获取配置：

| 配置项         | 说明                                                            |
| -------------- | --------------------------------------------------------------- |
| alarmLayerCode | 告警图层搜索编码映射（可扩展）                                  |
| layerSettings  | 各图层的配置（zIndex, alarmZIndex, alarmGroupSize, alarmColor） |

## 9. 注意事项

1. **性能优化**：当告警数据量大时，`getEmergencyTransmissionAlarmLayerDataApi` 会自动按 `alarmGroupSize`（默认100）分组，避免单图层数据过多
2. **CQL过滤**：支持标准CQL语法，可灵活过滤地理要素
3. **图层层级**：子图层的 `zIndex` 独立于主图层，需合理设置避免遮挡
4. **服务编码**：`serverCodeName` 必须与配置中的服务编码对应，否则无法加载图层
