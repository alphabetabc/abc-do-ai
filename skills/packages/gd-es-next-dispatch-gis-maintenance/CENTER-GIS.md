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

### 3.6 发光/泛光动画

**场景**：对核心层、核心机楼等高优先级业务 type，在普通点位之外额外创建一个 ripple 扩散动画 layer，作为视觉强调。

**核心数据结构**（`mapInit.tsx` 顶部）：

```typescript
/**
 * 发光能力白名单。
 * - key：业务 type（如 "核心层"、"核心机楼"）
 * - layerIdPrefix：ripple 衍生 layerId 的前缀
 * 修改此 Map 时请同步确认所有"按 type 过滤 / 按前缀筛"的调用点
 * （isFlash / setLayerStatus / 未来事件过滤）。
 * 注：此为 mapInit 内部实现细节，不导出。
 */
const enableAnimateLayerTypes = new Map<string, { layerIdPrefix: string }>([
    ["核心层", { layerIdPrefix: "核心层_ripple" }],
    ["核心机楼", { layerIdPrefix: "核心机楼_ripple" }],
]);
```

**layerId 命名约定**：`${layerIdPrefix}_${intId}`，例：`核心层_ripple_123`

#### 3.6.1 isFlash 判断（`addPoints` 内）

```typescript
const isFlash = isCoreFlash && enableAnimateLayerTypes.has(p.type) && p.level === "21";

if (isFlash) {
    const handle = createGlowPointAnimator({
        map,
        EMap,
        layerId: `${enableAnimateLayerTypes.get(p.type)?.layerIdPrefix}_${p?.intId}`,
        points: [{ id: p?.intId, longitude: p?.longitude, latitude: p?.latitude }],
        mode: "ripple",
        // ...其它动画参数
    });
    ctxOpt.__glowHandles.set(p?.intId, handle);
}
```

#### 3.6.2 setLayerStatus 反查（基于 Map 迭代，不依赖 regex）

```typescript
if (layerId && allLegendKeys.includes(layerId)) {
    // 族名归并："光缆" + 任何可发光 type（与 enableAnimateLayerTypes 同步）
    checkKey = ["光缆", ...enableAnimateLayerTypes.keys()].find((k) => layerId.includes(k)) || layerId;
} else {
    // 通用规则：从 Map 里反查 layerId 归属 type
    for (const [type, { layerIdPrefix }] of enableAnimateLayerTypes) {
        if (layerId?.startsWith(layerIdPrefix)) {
            checkKey = type;
            break;
        }
    }
}
```

#### 3.6.3 添加新发光类型的最小步骤

1. 在 `enableAnimateLayerTypes` Map 加 entry（`{ type, layerIdPrefix }`）：
    ```typescript
    ["新类型", { layerIdPrefix: "新类型_ripple" }],
    ```
2. 如果新类型需要不同的 `level` 阈值，调整 `isFlash` 中的 `p.level === "XX"` 条件。
3. **无需**改 `setLayerStatus`（自动通过 `for...of Map + startsWith(prefix)` 识别）。
4. **需要**在事件过滤（pointermove / clickPopup）列表里显式加 `enableAnimateLayerTypes.get("新类型")!.layerIdPrefix`——**这是有意为之的"摩擦"**，强迫开发者决策"新类型要不要进这个 filter"。

#### 3.6.4 与旧实现的差异

| 维度                                 | 旧实现                                               | 新实现                                                                            |
| ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| 白名单存储                           | `["核心层", "核心机楼"]` 数组 + 4 处硬编码           | 1 个 Map 单一来源                                                                 |
| isFlash 检查                         | `p.type === "X" \|\| p.type === "Y"`                 | `Map.has(p.type)`                                                                 |
| setLayerStatus 反查                  | 4 条硬编码 if-else + regex `^(.+?)_ripple(?:_\d+)?$` | `for...of Map + startsWith(layerIdPrefix)`                                        |
| 事件过滤（pointermove / clickPopup） | `"核心层_ripple"` / `"核心机楼_ripple"` 字面量       | **显式 `get("X")!.layerIdPrefix`**——避免隐式派生耦合                              |
| 添加新 type 改动                     | 改 ≥4 处                                             | 改 1 处（Map entry）+ 在需要它的 filter 列表里显式 `get("X")!.layerIdPrefix` 一行 |
| `__glowHandles` 清理                 | 整批清空（跨 addPoints 调用互相抹除）                | **差量更新 + 按类别分流**（仅销毁本次不再需要的句柄）                             |

#### 3.6.5 `__glowHandles` 差量更新

**问题**：`addPoints` 会被多个 useEffect 依次调用（物理站 → 动环机房 → 应急资源），旧实现每次都 `forEach + clear` 整张 Map，导致**非本次类别**的 glow 句柄被误杀，下次轮到时再重建——视觉表现是"不该消失的 glow 闪烁"。

**新实现**：

```typescript
// 1. 初始化（如果还没有）
if (!ctxOpt.__glowHandles) {
    ctxOpt.__glowHandles = new Map<any, { destroy: () => void }>();
}

// 2. 本次 addPoints 中需要发光的 (type, intId) 复合 key 集合（复用 isFlash 判断）
//    使用复合 key 防止不同 type 的 intId 碰撞导致句柄互相覆盖
const currentFlashKeys = new Set<string>();
//    本次 addPoints 中发光能力 type 集合（清理段按类别分流用，独立于 isFlash 判断：
//    即使当前数据没有 level="21" 的点，老的同 type 句柄也能被正确销毁）
const currentPointTypes = new Set<string>();
points?.forEach((p: any) => {
    if (p?.type && enableAnimateLayerTypes.has(p.type)) {
        currentPointTypes.add(p.type);
    }
    if (isCoreFlash && p.level === "21" && p?.intId !== undefined) {
        currentFlashKeys.add(`${p.type}::${p.intId}`);
    }
});

// 3. 销毁：旧句柄但本次不在集合内（跨类别的句柄先按 type 过滤掉，避免误杀）
ctxOpt.__glowHandles.forEach((handle: any, key: any) => {
    const [type] = (key as string).split("::");
    // 跨类别：保留（核心层 句柄不被动环机房 addPoints 销毁）
    if (!currentPointTypes.has(type)) return;
    // 同类别但本次不需要发光（被移除 / 降级了）：销毁
    if (!currentFlashKeys.has(key)) {
        handle.destroy?.();
        ctxOpt.__glowHandles.delete(key);
    }
});

// 4. 重建：在 forEach 内，isFlash 时销毁旧句柄再创建新句柄（避免 set 覆盖造成双重动画）
if (isFlash) {
    const flashKey = `${p.type}::${p.intId}`;
    const oldHandle = ctxOpt.__glowHandles.get(flashKey);
    if (oldHandle) {
        oldHandle.destroy?.();
    }
    const handle = createGlowPointAnimator({...});
    ctxOpt.__glowHandles.set(flashKey, handle);
}
```

**关键点**：

- `currentFlashKeys` 复用 `enableAnimateLayerTypes.has(p.type) && p.level === "21"` 判断——与 `isFlash` 完全一致
- **复合 key (`${type}::${intId}`)**：防止不同 type 的 intId 碰撞导致句柄互相覆盖（数据层没有强保证时仍安全）
- **按类别分流**：清理段先 split key 取 type，只对 `currentPointTypes` 中的 type 进行销毁判断，跨类别句柄直接 `return` 不动——这是修复"动环机房 addPoints 误杀核心层句柄"的关键
- 跨 useEffect 调用之间不互相抹除：物理站 addPoints 不会销毁动环机房的句柄
- 重建前必须先 `destroy` 旧句柄：`Map.set` 是覆盖语义，旧句柄不会被 GC，需要主动销毁

**已知限制**：

- 同类别内每次 addPoints 仍会重建（位置 / 颜色更新可保持新鲜）——这是有意的，保留位置新鲜度
- 真正"零重建"的实现需要数据签名比对（经纬度 / 颜色变化才重建），超出本轮范围
- 复合 key 假设 `p.type` 中不含 `::`，当前业务 type（"核心层"、"核心机楼"、"应急通信车1" 等）均无 `::`，无碰撞风险

#### 3.6.6 显式 `get()` vs 派生常量：选型决策

事件过滤（pointermove / clickPopup）需要用到 `enableAnimateLayerTypes` 里的 `layerIdPrefix`。本轮有两条可选路径：

| 路径                          | 形态                                                                                                                                       | 优点                                                                                                  | 缺点                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **A. 派生常量 + spread**      | 模块级 `const animateRipplePrefixes = [...enableAnimateLayerTypes.values()].map(v => v.layerIdPrefix);`，调用点 `...animateRipplePrefixes` | DRY：单点修改所有调用点同步；调用点简洁                                                               | 隐式耦合：Map 加 entry 会**自动**注入所有调用点；每个调用点拿同一份，无法差异化 |
| **B. 显式 `get()`**（已采用） | 调用点 `enableAnimateLayerTypes.get("核心层")!.layerIdPrefix`                                                                              | 可追溯：阅读调用点时一眼知道用了什么；灵活：每个调用点可选不同子集；新加 type 不会"偷偷"进所有 filter | 调用点略有冗余                                                                  |

**选 B 的理由**：

1. **事件过滤是"按场景选子集"**——pointermove 跳过 `核心层_ripple` 但放过 `核心机楼_ripple` 是合理需求（虽然当前没用到）。用派生常量强行"全选"会丧失这个灵活性
2. **新加 type 不应隐式扩散**——加 `"骨干层"` 到 Map，开发者应该**主动决定**"骨干层要不要进 pointermove 过滤"，而不是被派生常量偷偷加进去
3. **可读性**——`enableAnimateLayerTypes.get("核心层")!.layerIdPrefix` 在过滤列表里**自解释**，读者不需要追到派生常量定义

**反例（保留派生）**：`setLayerStatus` 内部仍用 `[...enableAnimateLayerTypes.keys()]` 派生（位置：`apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`）。理由：setLayerStatus 是"按图例控可见性"的**全集**操作——所有发光 type 都应参与归并，派生是合理的"全集"表达

**注意点**：

- 用 `!` 而非 `?? ""`：`get("X")?.layerIdPrefix ?? ""` 会让 `indexOf("")` 永远返回 0（空串是任何串的子串），**会引入隐性 bug**
- `!` 是合理的"显式契约"——key 在 Map 中就是契约的一部分

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

**文档版本**: 1.8
**最后更新**: 2026-06-26
**维护团队**: GD Emergency Support Team
**整理内容**: - §3.6.6 反例链接改用相对路径（`file:///e:/...` → 项目根相对路径）- SKILL.md 与 CENTER-GIS.md 内容去重：SKILL.md 精简为入口，详细设计在本文件 - token 优化：减少重复内容，保留核心决策信息
