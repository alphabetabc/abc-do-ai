# dispatch-gis center-gis 技术文档

## 1. 概述

`center-gis` 是 `dispatch-gis` 指挥调度模块的核心地图组件，负责地图初始化、图层管理、数据打点、路径绘制、事件处理等核心功能。

**组件定位**: 作为指挥调度模块的地图渲染引擎，承载所有 GIS 相关操作，包括跨地市飞线、应急资源聚合、传输线路等功能。

## 2. 架构设计

### 2.1 组件结构

```
center-gis/
├── index.tsx          # 主组件，管理状态和数据流转
└── utils/
    ├── mapInit.tsx    # 地图初始化和操作工具类
    └── field.ts       # 弹窗字段配置
```

### 2.2 核心模块职责

| 模块          | 职责                           | 关键功能                                 |
| ------------- | ------------------------------ | ---------------------------------------- |
| `index.tsx`   | 状态管理、数据请求、事件协调   | 数据获取、图层控制、状态同步             |
| `mapInit.tsx` | 地图初始化、图层操作、要素管理 | 图层创建、打点、路径绘制、弹窗、事件绑定 |
| `field.ts`    | 弹窗字段配置                   | 字段映射、显示控制                       |

### 2.3 数据流架构

```
API 请求 → 数据处理 → 状态更新 → 地图渲染
    ↓          ↓           ↓           ↓
 useRequest → 聚合处理 → useState → MapInit
```

## 3. 核心功能实现

### 3.1 地图初始化

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
export default {
    InitMap: function (ctxOpt: any, onPointerMove: any, onSingleClick: any, onDblClick: any) {
        const { map, EMap } = ctxOpt;

        // 初始化移动弹窗
        new EMap.Event.Move({
            map,
            callback: (lonLat: any, feature: any) => {
                // 悬浮事件处理
            },
        }).add();

        // 初始化单击事件
        new EMap.Event.Click({
            map,
            hitTolerance: 5,
            clickType: "singleclick",
            callback: (lonLat: any, feature: any) => {
                onSingleClick(lonLat, feature);
            },
        }).add();

        // 初始化双击事件（下钻）
        new EMap.Event.Click({
            map,
            hitTolerance: 5,
            clickType: "dblclick",
            callback: (lonLat: any, feature: any) => {
                onDblClick(lonLat, feature);
            },
        }).add();
    },
};
```

### 3.2 应急资源聚合（同经纬度处理）

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

**核心逻辑**:

```typescript
const handleResourcePoints = () => {
    const selectedStatus: string[] = [];
    if (legendSelected["任务中"]) selectedStatus.push("1");
    if (legendSelected["空闲"]) selectedStatus.push("0");

    const pointMap = new Map();
    const aggPoints: any[] = [];
    const singlePoints: any[] = selectedStatus.length > 0 ? [] : [...dataResourcePointsNew];

    if (selectedStatus.length > 0) {
        const resourceTypes = ["应急通信车", "应急发电车", "卫星便携包", "无线队伍", "传输队伍"];
        const aggregatedSelectedTypes = Object.keys(legendSelected).filter((key) => {
            return legendSelected[key] === true && resourceTypes.includes(key);
        });
        const emergencyAggregatedSelectedTypes = selectedStatus.flatMap((num) => aggregatedSelectedTypes.map((item) => item + num));

        const selectedPoints: any = [];
        const unselectedPoints: any = [];
        dataResourcePointsRef.current.forEach((p: any) => {
            if (emergencyAggregatedSelectedTypes.includes(p.type)) {
                selectedPoints.push(p);
            } else {
                unselectedPoints.push(p);
            }
        });

        selectedPoints.forEach((p: any) => {
            const key = `${p.longitude}_${p.latitude}`;
            if (!pointMap.has(key)) {
                pointMap.set(key, []);
            }
            pointMap.get(key).push(p);
        });

        pointMap.forEach((points) => {
            if (points.length > 1) {
                aggPoints.push({
                    ...points[0],
                    type: "应急资源聚合",
                    intId: `应急资源聚合_${points[0].longitude}_${points[0].latitude}`,
                    aggPoints: points,
                });
            } else {
                singlePoints.push(...points);
            }
        });

        singlePoints.push(...unselectedPoints);
    }

    MapInit.addPoints(ctxOpt, singlePoints);
    MapInit.addPoints(ctxOpt, aggPoints);
};
```

### 3.3 跨地市飞线绘制

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
addCrossCityLines: function (ctxOpt: any, lines: any) {
    const { map, EMap } = ctxOpt;
    const eStyle = new EMap.Style();

    lines?.forEach((p: any) => {
        if (p?.type) {
            let gLayer = map.getLayerById(p.type);
            if (!gLayer) {
                gLayer = new EMap.ELayer({
                    type: "Vector",
                    id: p.type,
                    zIndex: 98,
                    source: { wrapX: false },
                    style: eStyle.style({
                        stroke: eStyle.stroke({
                            color: "rgba(250, 100, 1, 1)",
                            lineCap: "round",
                            lineDash: null,
                            width: 6,
                        }),
                    }),
                });
                map.addLayer(gLayer);
            }

            // 贝塞尔曲线计算
            const mid = [(p.longitudeA + p.longitudeB) / 2, (p.latitudeA + p.latitudeB) / 2];
            const dx = p.longitudeB - p.longitudeA;
            const dy = p.latitudeB - p.latitudeA;
            const control = [mid[0] - dy * 0.3, mid[1] + dx * 0.3];

            const curvePoints: any[] = [];
            for (let t = 0; t <= 1; t += 0.02) {
                const x = Math.pow(1 - t, 2) * p.longitudeA +
                          2 * (1 - t) * t * control[0] +
                          Math.pow(t, 2) * p.longitudeB;
                const y = Math.pow(1 - t, 2) * p.latitudeA +
                          2 * (1 - t) * t * control[1] +
                          Math.pow(t, 2) * p.latitudeB;
                curvePoints.push([x, y]);
            }

            const g4line = new EMap.EFeature({
                type: "LineString",
                coordinates: [curvePoints],
                id: p.intId,
                layer: gLayer,
            });
            g4line.add();
        }
    });
},
```

### 3.4 路径起点/终点去重

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
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
        id: "A" + p?.intId,
        layer: gLayer2,
        style: eStyle.style({
            image: eStyle.image({
                anchor: [0.5, 0.5],
                scale: 0.7,
                src: `${constants.IMAGE_PATH}/emergency/map/图例/起点.png`,
            }),
            text: null,
        }),
    });
    g4point1.add();
}

// 创建终点要素（仅当该经纬度不存在时）
if (!isPointExists(p?.longitudeB, p?.latitudeB)) {
    const g4point2 = new EMap.EFeature({
        type: "Point",
        coordinates: [p?.longitudeB, p?.latitudeB],
        id: "B" + p?.intId,
        layer: gLayer2,
        style: eStyle.style({
            image: eStyle.image({
                anchor: [0.5, 0.5],
                scale: 0.7,
                src: `${constants.IMAGE_PATH}/emergency/map/图例/终点.png`,
            }),
            text: null,
        }),
    });
    g4point2.add();
}
```

### 3.5 图层管理

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
addPoints: function (ctxOpt: any, data: any) {
    const { map, EMap } = ctxOpt;
    const eStyle = new EMap.Style();

    data.forEach((item: any) => {
        const layerId = item.type;
        let gLayer = map.getLayerById(layerId);

        if (!gLayer) {
            gLayer = new EMap.ELayer({
                type: "Vector",
                id: layerId,
                zIndex: 199,
                source: { wrapX: false },
                style: eStyle.defaultStyle(),
            });
            map.addLayer(gLayer);
        }

        const g4point = new EMap.EFeature({
            type: "Point",
            coordinates: [Number(item.longitude), Number(item.latitude)],
            id: item.intId,
            layer: gLayer,
            style: eStyle.style({
                image: eStyle.image({
                    anchor: [0.5, 1],
                    scale: 0.7,
                    src: `${constants.IMAGE_PATH}/emergency/map/图例/${item.type}.png`,
                }),
            }),
        });
        g4point.add();
    });
},
```

## 4. API 接口说明

### 4.1 MapInit 工具类方法

| 方法名              | 功能           | 参数                                                     | 返回值 |
| ------------------- | -------------- | -------------------------------------------------------- | ------ |
| `InitMap`           | 初始化地图事件 | `ctxOpt`, `onPointerMove`, `onSingleClick`, `onDblClick` | 无     |
| `addPoints`         | 添加打点数据   | `ctxOpt`, `data`                                         | 无     |
| `addLines`          | 添加连线数据   | `ctxOpt`, `data`                                         | 无     |
| `addTrailLine`      | 添加轨迹线     | `ctxOpt`, `data`                                         | 无     |
| `addCrossCityLines` | 添加跨地市飞线 | `ctxOpt`, `lines`                                        | 无     |
| `clearLayerById`    | 清空指定图层   | `ctxOpt`, `layerIds`                                     | 无     |
| `setLayerStatus`    | 设置图层可见性 | `ctxOpt`, `layerIds`                                     | 无     |
| `setCenter`         | 设置地图中心点 | `ctxOpt`, `lonlat`                                       | 无     |
| `showMapClickPopup` | 显示点击弹窗   | `lonLat`                                                 | 无     |
| `showMapMovePopup`  | 显示悬浮弹窗   | `lonLat`, `feature`                                      | 无     |

### 4.2 数据请求接口

| 接口名                       | 功能                 | 参数                            | 返回值     |
| ---------------------------- | -------------------- | ------------------------------- | ---------- |
| `getEmergencyResourceMapApi` | 获取应急资源打点数据 | `zoneId`, `zoneLevel`, `taskId` | 资源点数组 |
| `getSiteGisPinApi`           | 获取站点打点数据     | `zoneId`, `zoneLevel`, `taskId` | 站点数组   |
| `getCrossCityLineApi`        | 获取跨地市飞线数据   | `zoneId`, `zoneLevel`, `taskId` | 飞线数组   |
| `getTransPointsLinesApi`     | 获取传输线路数据     | `zoneId`, `zoneLevel`, `taskId` | 线路数组   |

## 5. 数据流程

### 5.1 应急资源打点流程

```
1. useRequest 发起 API 请求
2. 数据返回后更新 state
3. useEffect 监听数据变化
4. 执行同经纬度聚合处理
5. 调用 MapInit.addPoints 渲染
6. 更新图例状态
```

**代码位置**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
const { data: dataResourcePointsNew } = useRequest(
    () =>
        getEmergencyResourceMapApi({
            zoneId: currentZone?.zoneId,
            zoneLevel: currentZone?.zoneLevel,
            taskId: supportTask?.wdId,
        }),
    {
        ready: isDefined(supportTask?.wdId) && isDefined(currentZone),
        refreshDeps: [supportTask?.wdId, currentZone],
        pollingInterval: interval * TIME_RANGE.SECOND,
    },
);

useEffect(() => {
    if (ctxOpt && dataResourcePointsNew) {
        // 聚合处理和渲染逻辑
        handleResourcePoints();
    }
}, [ctxOpt, dataResourcePointsNew, legendSelected]);
```

### 5.2 跨地市飞线绘制流程

```
1. useRequest 发起 API 请求
2. 数据返回后更新 state
3. useEffect 监听数据变化（仅省级）
4. 调用 MapInit.addCrossCityLines 绘制飞线
5. 更新图例状态
```

## 6. 配置参数

### 6.1 请求配置

**文件**: `apps/main/app/environment.ts`

```typescript
{
    "gd-emergency-support": {
        "modules": {
            "dispatch-gis": {
                "request": {
                    "interval": 300  // 轮询间隔（秒）
                }
            }
        }
    }
}
```

### 6.2 字段配置

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`

```typescript
export const fieldSource = [
    {
        key: "应急通信车",
        label: "应急通信车",
        showPopup: true,
        title: "应急物资详情",
        showTrail: true,
        field: [
            { key: "resourceTypeName", label: "物资类型" },
            { key: "resourceId", label: "车牌号" },
            { key: "regionName", label: "所属地市" },
            { key: "resourceStatusText", label: "调度状态" },
        ],
    },
    // ... 其他配置
];
```

## 7. 常见问题解决方案

### 7.1 数据不更新

**问题**: 地图数据长时间不更新

**解决方案**:

```typescript
// 检查依赖项是否完整
useRequest(() => getDataApi({ param1, param2 }), {
    ready: isDefined(param1) && isDefined(param2),
    refreshDeps: [param1, param2], // 确保包含所有依赖
    pollingInterval: 300000,
});

// 添加调试日志
onSuccess: (data) => {
    console.log("[dispatch-gis] 数据更新", data.length);
};
```

### 7.2 图层不显示

**问题**: 图层已添加但不可见

**解决方案**:

```typescript
// 检查图层可见性
const layer = map.getLayerById("layerId");
console.log("图层状态:", layer?.getVisible());

// 检查图例选中状态
if (legendSelected["图层名称"] !== true) {
    MapInit.setLayerStatus(ctxOpt, false);
}
```

### 7.3 跨地市飞线不显示

**问题**: 省级地图跨地市飞线不显示

**解决方案**:

```typescript
// 检查区域层级
if (currentZone?.zoneLevel !== "province") {
    console.warn("[dispatch-gis] 非省级区域，不显示跨地市飞线");
    return;
}

// 检查图例选中状态
if (legendSelected["跨市调度"] !== true) {
    MapInit.setLayerStatus(ctxOpt, ["crossCityLine"], false);
}
```

### 7.4 同经纬度聚合异常

**问题**: 同经纬度的点没有正确聚合

**解决方案**:

```typescript
// 检查聚合逻辑
const key = `${p.longitude}_${p.latitude}`; // 确保格式正确

// 验证数据格式
if (typeof p.longitude !== "number" || typeof p.latitude !== "number") {
    console.warn("[dispatch-gis] 经纬度格式错误", p);
}
```

### 7.5 路径起点/终点重复

**问题**: 相同经纬度的起点/终点重复创建

**解决方案**:

```typescript
// 使用 isPointExists 检查
if (!isPointExists(p?.longitudeA, p?.latitudeA)) {
    // 创建起点
}

if (!isPointExists(p?.longitudeB, p?.latitudeB)) {
    // 创建终点
}
```

## 8. 性能优化

### 8.1 使用 Ref 缓存数据

```typescript
const dataResourcePointsRef = useRef([]);

useEffect(() => {
    dataResourcePointsRef.current = [...dataResourcePointsNew];
}, [dataResourcePointsNew]);
```

### 8.2 批量图层操作

```typescript
const layerIds = [...new Set(data.map((p: any) => p.type))];
MapInit.clearLayerById(ctxOpt, layerIds); // 批量清理
```

### 8.3 使用 useMemo 缓存计算

```typescript
const columns = useMemo(() => {
    return [
        // 缓存计算结果
    ];
}, [resourceTypes]);
```

## 9. 传输路由告警图层

### 9.1 组件职责

`MapEmergencyTransmissionView` 组件负责传输路由告警数据的请求、过滤和图层渲染，支持多种传输路由类型的动态显示。

### 9.2 核心流程

```
图例状态变化 → 数据时间计算 → 全量告警数据请求 → 图层参数过滤 → 图层数据请求 → 地图渲染
```

### 9.3 图例状态映射

| 图例名称   | 图层服务名             | 类型枚举值 |
| ---------- | ---------------------- | ---------- |
| 二干       | 省级传输二干告警图层   | 1          |
| 骨干层路由 | 地市骨干层路由告警图层 | 3          |
| 汇聚路由   | 区县汇聚层路由告警图层 | 4          |
| 接入层     | 乡镇接入层路由告警图层 | 2          |
| 乡镇三路由 | 乡镇三路由告警图层     | -          |
| 节点机房   | 乡镇路由站点告警图层表 | -          |

### 9.4 详细文档

请参考: [MapEmergencyTransmissionView 组件维护文档](./MapEmergencyTransmissionView.md)

## 10. 图例组件

### 10.1 组件职责

`DispatchLegend` 组件负责管理地图图例的显示/隐藏状态，提供应急物资、物理站点、传输路由、动环机房等多种图层的复选框控制。

### 10.2 核心功能

- **状态管理**: 维护图例选中状态，支持单选和批量选择
- **联动机制**: 与调度队伍、乡镇退服告警等场景联动
- **限制控制**: 应急资源类型最大选择数量限制
- **状态同步**: 实时同步图例状态到外部组件

### 10.3 图例分组

| 分组         | 主要图例                                                                           |
| ------------ | ---------------------------------------------------------------------------------- |
| 应急物资     | 任务中、应急通信车、抢修车辆、无线队伍、应急发电车、卫星便携包、传输队伍、跨市调度 |
| 物理站点     | 核心层、重要层、支撑层、普通站、光缆、机房                                         |
| 传输路由     | 二干、骨干层路由、汇聚路由、接入层、乡镇三路由、节点机房                           |
| 传输状态     | 传输路由中断、传输路由正常                                                         |
| 物理站址状态 | 物理站址退服、物理站址正常                                                         |
| 动环机房     | 动环机房停电、动环机房环境、动环机房正常、核心机楼、重要汇聚、普通汇聚、业务汇聚   |

### 10.4 详细文档

请参考: [DispatchLegend 组件维护文档](./DispatchLegend.md)

## 11. 全局状态变量

### 11.1 damageToTownsGisPin（乡镇退服GIS定位）

`damageToTownsGisPin` 是用于乡镇退服告警GIS定位联动的核心全局状态变量，实现了右侧告警面板与地图组件之间的数据传递和事件联动。

**消费组件**：DispatchLegend、zone-select、center-gis、damage-to-towns

**详细文档**: [damageToTownsGisPin 全局状态变量维护文档](./damageToTownsGisPin.md)

## 12. 相关文件

| 文件路径                                                                        | 说明             |
| ------------------------------------------------------------------------------- | ---------------- |
| `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`             | 主组件           |
| `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`     | 地图工具类       |
| `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`        | 字段配置         |
| `apps/main/app/components/center/dispatch-gis/MapEmergencyTransmissionView.tsx` | 传输路由告警组件 |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`        | 图例组件         |
| `apps/main/app/request/center.ts`                                               | API 请求定义     |
| `apps/main/app/request/custom/center.ts`                                        | 自定义 API 请求  |
| `apps/main/app/store.ts`                                                        | 全局状态管理     |

---

**文档版本**: 1.1
**最后更新**: 2026-06-04
**维护团队**: GD Emergency Support Team
