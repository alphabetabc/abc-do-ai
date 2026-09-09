# center-gis 进阶模块（模块 6-9）

> 本文档从 SKILL.md 拆分，涵盖 warn-gis center-gis 的性能优化、同经纬度处理、扩展功能、zIndex 体系。

## 模块 6: 性能优化

### 6.1 优化数据处理

**场景**: 数据量大时性能下降

**优化方法**:

1. **使用 Ref 缓存数据**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

const dataSitePointsRef = useRef(EmptyObject.Array); // ← 使用 ref
const dataResourcePointsRef = useRef(EmptyObject.Array);

// 在 Effect 中更新 ref
useEffect(() => {
    if (ctxOpt && dataSitePointsNew) {
        // 更新 ref (不触发重渲染)
        dataSitePointsRef.current = [...dataSitePointsNew];

        // 使用 ref 中的数据
        const sites = dataSitePointsRef.current.filter((p: any) => alarmLevels.includes(p.alarmLevel));
        MapInit.addPoints(ctxOpt, sites);
    }
}, [ctxOpt, dataSitePointsNew, legendSelected]);
```

2. **使用 useMemo 缓存计算结果**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx

const legendSelectedList = useMemo(() => {
    try {
        return [...Object.entries(props.legendSelected)];
    } catch (error) {
        return EmptyObject.Array;
    }
}, [props.legendSelected]); // ← 缓存计算结果
```

3. **优化数据匹配**

```typescript
// 使用 Map 提高匹配效率
const weatherMap = useMemo(() => {
    const map = new Map();
    state.weatherPoints.forEach((point) => {
        map.set(point.config.name, point);
    });
    return map;
}, [state.weatherPoints]);

// 在渲染中使用
const weather = weatherMap.get(point.name);
```

### 6.2 优化图层清理

**场景**: 图层更新时性能问题

**优化方法**:

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

useEffect(() => {
    if (ctxOpt && dataResourcePointsNew) {
        // 优化: 只清理变化的图层
        const oldLayerIds = new Set(dataResourcePointsRef.current.map((p: any) => p.type));
        const newLayerIds = new Set(dataResourcePointsNew.map((p: any) => p.type));

        const layersToClear = [...oldLayerIds].filter((id) => !newLayerIds.has(id));

        if (layersToClear.length > 0) {
            MapInit.clearLayerById(ctxOpt, layersToClear);
        }

        // 更新 ref
        dataResourcePointsRef.current = [...dataResourcePointsNew];

        MapInit.addPoints(ctxOpt, dataResourcePointsNew);
    }
}, [ctxOpt, dataResourcePointsNew]);
```

---

## 模块 7: 同经纬度处理

### 7.1 应急资源聚合（经纬度去重）

**场景**: 当多个应急资源点具有相同经纬度时，需要聚合显示以避免重叠

**实现位置**: `apps/main/app/components/center/warn-gis/center-gis/index.tsx`

**核心逻辑**:

```typescript
// 使用 Map 按经纬度分组
const pointMap = new Map();
selectedPoints.forEach((p: any) => {
    const key = `${p.longitude}_${p.latitude}`;
    if (!pointMap.has(key)) {
        pointMap.set(key, []);
    }
    pointMap.get(key).push(p);
});

pointMap.forEach((points) => {
    if (points.length > 1) {
        // 经纬度重复的数据 → 聚合为"应急资源聚合"类型
        aggPoints.push({
            ...points[0],
            type: "应急资源聚合",
            intId: `应急资源聚合_${points[0].longitude}_${points[0].latitude}`,
            aggPoints: points, // 存储聚合的原始数据
        });
    } else {
        // 经纬度唯一的数据 → 保持原样
        singlePoints.push(...points);
    }
});

// 分别添加聚合数据和非聚合数据
MapInit.addPoints(ctxOpt, singlePoints);
MapInit.addPoints(ctxOpt, aggPoints);
```

**处理流程**:

1. **数据分组**: 通过 `longitude_latitude` 作为 key 将数据分组
2. **判断聚合**: 如果同一经纬度有多个点，则进行聚合
3. **生成聚合点**: 将聚合数据包装为"应急资源聚合"类型，保留原始数据在 `aggPoints` 中
4. **分别渲染**: 聚合点和非聚合点分别添加到地图

**验证点**:

- [ ] 同经纬度的多个资源点正确聚合为一个标记
- [ ] 聚合点显示"应急资源聚合"类型
- [ ] 点击聚合点可查看所有聚合的资源详情
- [ ] 非聚合点正常显示

### 7.2 dispatch-gis 中的同经纬度处理

**实现位置**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

dispatch-gis 采用相同的聚合策略，但增加了状态过滤：

```typescript
// 过滤选中状态的数据
const selectedStatus: string[] = [];
if (legendSelected["任务中"]) selectedStatus.push("1");
if (legendSelected["空闲"]) selectedStatus.push("0");

// 聚合选中的资源类型
const resourceTypes = ["应急通信车", "应急发电车", "卫星便携包", "无线队伍", "传输队伍"];
const aggregatedSelectedTypes = Object.keys(legendSelected).filter((key) => {
    return legendSelected[key] === true && resourceTypes.includes(key);
});
```

### 7.3 路径起点/终点去重

**场景**: 在添加路径图层时，避免重复创建相同经纬度的起点/终点标记

**实现位置**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

**核心逻辑**:

```typescript
// 检查经纬度是否已存在的辅助函数
const isPointExists = (longitude: number, latitude: number) => {
    const features = gLayer2.getSource()?.getFeatures();
    if (!features) return false;
    return features.some((feature: any) => {
        const coords = feature.getGeometry()?.getCoordinates();
        return coords && coords[0] === longitude && coords[1] === latitude;
    });
};

// 创建起点要素（仅当该经纬度不存在时）
if (!isPointExists(p?.longitudeA, p?.latitudeA)) {
    const g4point1 = new EMap.EFeature({
        type: "Point",
        coordinates: [p?.longitudeA, p?.latitudeA],
        // ... 样式配置
    });
    g4point1.add();
}

// 创建终点要素（仅当该经纬度不存在时）
if (!isPointExists(p?.longitudeB, p?.latitudeB)) {
    // ... 创建终点
}
```

**验证点**:

- [ ] 相同经纬度的起点/终点只创建一次
- [ ] 不同经纬度的点正常显示
- [ ] 路径线条正常连接起点和终点

---

## 模块 8: 扩展功能

### 8.1 添加新的预警类型

**场景**: 需要添加新的预警类型（如地震预警）

**步骤**:

1. **创建预警组件**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/earthquake-warning/index.tsx

import { useMemo } from "react";
import { useOverlayPoint } from "../OverlayPoint";

export const EarthquakeWarning = (props: { data: any; legendSelected: any }) => {
    const overlayCtx = useOverlayPoint();

    const show = useMemo(() => {
        return props.legendSelected.some((d: any) => d[0] === "earthquake" && d[1] === true);
    }, [props.legendSelected]);

    if (!show || !props.data) return null;

    return (
        <div
            className="icon-div"
            onClick={() => {
                overlayCtx.createPortal(
                    <div className="overlay-item-info-card">
                        <h3>地震预警</h3>
                        <p>震级: {props.data.magnitude}</p>
                        <p>深度: {props.data.depth}km</p>
                        <p>时间: {props.data.time}</p>
                    </div>
                );
            }}
        >
            ⚠️
        </div>
    );
};
```

2. **在 OverlayPoint 中注册**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx

import { EarthquakeWarning } from "./earthquake-warning";

// 在返回中添加
<EarthquakeWarning data={props.earthquakeData} legendSelected={props.legendSelected} />
```

3. **添加数据请求**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx

useRequest(
    () =>
        getEarthquakeWarningApi({
            /* params */
        }),
    {
        // ... existing config
        onSuccess: (dataSource) => {
            setState({
                earthquakePoints: dataSource,
            });
        },
    },
);
```

### 8.2 添加自定义地图事件

**场景**: 需要添加双击下钻以外的自定义事件

**步骤**:

1. **在 MapInit 中添加事件**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx

export default {
    // ... existing methods

    initCustomEvents: function (ctxOpt: any, customCallback: any) {
        const { map, EMap } = ctxOpt;
        if (!map) return;

        // 添加右键事件
        new EMap.Event.Click({
            map,
            hitTolerance: 5,
            clickType: "rightclick",
            callback: (lonLat: any, feature: any) => {
                const featureId = feature?.id_ || "";
                customCallback({
                    type: "rightclick",
                    lonLat,
                    featureId,
                    feature,
                });
            },
        }).add();
    },
};
```

2. **在 CenterGis 中使用**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

const onCustomEvent = (params: any) => {
    console.log("[自定义事件]", params);
    // 处理自定义事件
};

useEffect(() => {
    if (ctxOpt) {
        MapInit.InitMap(ctxOpt, onPointerMove, onSingleClick, onDblClick);
        MapInit.initCustomEvents(ctxOpt, onCustomEvent); // ← 添加
    }
}, [ctxOpt]);
```

---

## 模块 9: zIndex 体系（数据层赋值 + 渲染层消费）

**场景**：告警点被同经纬度的正常点遮挡、不同级别点位叠放顺序不可控。warn-gis 与 dispatch-gis 共用同一套 zIndex 体系，把 zIndex 从"渲染层运行时硬编码"前移到"API 数据生成时主动赋值"，渲染层只消费。

> **与 dispatch-gis 的差异**：warn-gis 没有发光 ripple 图层（无 `enableAnimateLayerTypes`、无 `__glowHandles`），只消费物理站 API 返回的 zIndex；不涉及动环机房（动环机房只在 dispatch-gis 出现）。

**核心规则**：

| 规则            | 说明                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------ |
| 数据层赋值      | `getEmergencySitePointsApi` 在 `rows.map` 时按 `levelOrder[${type}${status}]` 查表赋 `zIndex` |
| 告警 > 正常     | 同级别内 status=1（199）永远高于 status=0（195）                                              |
| 级别降序        | type 1 > 2 > 3 > 4，核心层 > 重要层 > 支撑层 > 普通站                                         |
| 渲染层 fallback | `p.zIndex                                                                                     |     | (isMaxIcon ? 99999 : 99)`——物理站用数据带的值（192-199），应急资源 fallback 99 |
| 图层清理粒度    | 按 `${type}${zIndex}` 精确清理，否则切换图例时旧图层残留                                      |
| allLegendKeys   | 装带 zIndex 后缀的 key（"核心层199"等），与 layerId 一一对应                                  |

**关键文件**：

- `apps/main/request/center.ts`（`getEmergencySitePointsApi` 的 `levelOrder` 表 + `zIndex` 字段）
- `apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx`（`addPoints` 消费 `p.zIndex || fallback`、`allLegendKeys` 带 zIndex 后缀）
- `apps/main/app/components/center/warn-gis/center-gis/index.tsx`（图层清理按 `${type}${zIndex}` 精确粒度）

**验证点**：

- [ ] 同经纬度的告警点和正常点，告警点在上层可见
- [ ] 高级别点（核心层）压在低级别点（普通站）之上
- [ ] 切换图例时旧图层不残留（清理覆盖所有 type+zIndex 组合）
- [ ] 应急资源点仍正常显示（fallback 99）

**详细文档**：[CENTER-GIS.md §3.5](../CENTER-GIS.md#35-zindex-体系数据层赋值--渲染层消费) — 含 levelOrder 表、消费规则、清理粒度、allLegendKeys 匹配
