# warn-gis center-gis 技术文档

## 1. 概述

`center-gis` 是 `warn-gis` 预警感知模块的核心地图组件，负责地图初始化、图层管理、数据打点、事件处理等核心功能。

**组件定位**: 作为预警感知模块的地图渲染引擎，承载所有 GIS 相关操作。

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

| 模块          | 职责                           | 关键功能                       |
| ------------- | ------------------------------ | ------------------------------ |
| `index.tsx`   | 状态管理、数据请求、事件协调   | 数据获取、图层控制、状态同步   |
| `mapInit.tsx` | 地图初始化、图层操作、要素管理 | 图层创建、打点、弹窗、事件绑定 |
| `field.ts`    | 弹窗字段配置                   | 字段映射、显示控制             |

### 2.3 数据流架构

```
API 请求 → 数据处理 → 状态更新 → 地图渲染
    ↓          ↓           ↓           ↓
 useRequest → 聚合处理 → useState → MapInit
```

## 3. 核心功能实现

### 3.1 地图初始化

**文件**: `apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx`

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

**文件**: `apps/main/app/components/center/warn-gis/center-gis/index.tsx`

**核心逻辑**:

```typescript
const handleResourcePoints = () => {
    const pointMap = new Map();
    const aggPoints: any[] = [];
    const singlePoints: any[] = [];

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

    MapInit.addPoints(ctxOpt, singlePoints);
    MapInit.addPoints(ctxOpt, aggPoints);
};
```

### 3.3 图层管理

**文件**: `apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx`

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

### 3.4 弹窗系统

**文件**: `apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx`

```typescript
showMapClickPopup: function (lonLat: any) {
    if (clickPopup) clickPopup.show(lonLat, warnCmdPopupTipWindow);
},

showMapMovePopup: function (lonLat: any, feature: any) {
    if (movePopup) {
        // 设置弹窗内容
        movePopup.show(lonLat, warnCmdToolTipWindow);
    }
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
| `getTrailLineApi`            | 获取轨迹线数据       | `zoneId`, `zoneLevel`, `taskId` | 轨迹数组   |

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

**代码位置**: `apps/main/app/components/center/warn-gis/center-gis/index.tsx`

```typescript
const { data: dataResourcePointsNew } = useRequest(
    () =>
        getEmergencyResourceMapApi({
            zoneId: currentZone?.zoneId,
            zoneLevel: currentZone?.zoneLevel,
            taskId: supportTask?.id,
        }),
    {
        ready: isDefined(currentZone) && isDefined(supportTask),
        refreshDeps: [currentZone, supportTask],
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

### 5.2 地图事件处理流程

```
1. 地图事件触发（点击/悬浮/双击）
2. 回调函数处理
3. 更新 curPoint 状态
4. 触发弹窗显示
5. 执行相应业务逻辑
```

## 6. 配置参数

### 6.1 请求配置

**文件**: `apps/main/app/environment.ts`

```typescript
{
    "gd-emergency-support": {
        "modules": {
            "warn-gis": {
                "request": {
                    "interval": 300  // 轮询间隔（秒）
                }
            }
        }
    }
}
```

### 6.2 字段配置

**文件**: `apps/main/app/components/center/warn-gis/center-gis/utils/field.ts`

```typescript
export const fieldSource = [
    {
        key: "无线队伍",
        label: "无线队伍",
        showPopup: true,
        title: "队伍详情",
        field: [
            { key: "userlabel", label: "队伍名称" },
            { key: "resourceTypeName", label: "专业" },
            { key: "regionName", label: "所属地市" },
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
    console.log("[warn-gis] 数据更新", data.length);
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

### 7.3 弹窗不显示

**问题**: 点击或悬浮时弹窗不显示

**解决方案**:

```typescript
// 检查 field.ts 配置
{
    key: "类型名称",
    showPopup: true,  // 确保为 true
    // ...
}

// 检查数据是否存在
if (!dataPoint || !fieldSet) {
    console.warn("[warn-gis] 弹窗数据为空");
    return;
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
    console.warn("[warn-gis] 经纬度格式错误", p);
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
const legendSelectedList = useMemo(() => {
    return [...Object.entries(legendSelected)];
}, [legendSelected]);
```

## 9. 相关文件

| 文件路径                                                                | 说明         |
| ----------------------------------------------------------------------- | ------------ |
| `apps/main/app/components/center/warn-gis/center-gis/index.tsx`         | 主组件       |
| `apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx` | 地图工具类   |
| `apps/main/app/components/center/warn-gis/center-gis/utils/field.ts`    | 字段配置     |
| `apps/main/app/request/center.ts`                                       | API 请求定义 |
| `apps/main/app/store.ts`                                                | 全局状态管理 |

---

**文档版本**: 1.0  
**最后更新**: 2026-05-21  
**维护团队**: GD Emergency Support Team
