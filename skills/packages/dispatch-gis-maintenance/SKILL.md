---
name: dispatch-gis-maintenance
description: 用于维护和拓展 dispatch-gis 指挥调度 GIS 组件的可复用技能
tags:
  - GIS
  - 指挥调度
  - 维护
---

# dispatch-gis 组件维护技能 (Skill)

## 技能概述

这是一个用于维护和拓展 `dispatch-gis` 指挥调度 GIS 组件的可复用技能。该技能涵盖了组件架构理解、常见修改、问题排查和性能优化等场景。

**核心组件文档**: [center-gis 详细技术文档](CENTER-GIS.md)

## 使用场景

### 1. 添加新图例项

### 2. 新增打点类型

### 3. 修改弹窗字段

### 4. 添加地图图层

### 5. 调试数据不更新问题

### 6. 优化性能问题

### 7. 扩展跨地市飞线功能

### 9. 添加新的预警类型

---

## 1. 添加新图例项

### 场景描述

需要添加新的图例选项，例如添加"应急仓"图例项。

### 步骤

#### 1.1 在图例组件中添加默认值

**文件**: `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`

```typescript
const defaultValues = {
  任务中: true,
  应急通信车: false,
  抢修车辆: false,
  无线队伍: false,
  空闲: false,
  应急发电车: false,
  卫星便携包: false,
  传输队伍: false,
  核心层: true,
  重要层: false,
  支撑层: false,
  普通站: false,
  光缆: false,
  机房: false,
  跨市调度: showCrossLine,
  应急仓: false, // ← 新增
  // ... 其他图例
};
```

#### 1.2 在图层状态设置中添加逻辑

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
const setLegendLayerStatus = () => {
  const neTypeCheckList: any[] = [];
  Object.keys(legendSelected).forEach((key) => {
    if (
      legendSelected[key] &&
      key !== '任务中' &&
      key !== '空闲' &&
      key !== '跨市调度' &&
      key !== '物理站址退服' &&
      key !== '物理站址正常'
    ) {
      if (resourceTypes.includes(key)) {
        if (isTasking) neTypeCheckList.push(`${key}1`);
        if (isIdle) neTypeCheckList.push(`${key}0`);
      } else {
        neTypeCheckList.push(`${key}`);
      }
    }
  });
  MapInit.setLayerStatus(ctxOpt, neTypeCheckList);
};
```

#### 1.3 添加数据请求和打点逻辑

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
// 添加新的数据请求
const { data: newLegendData } = useRequest(
  () =>
    getNewLegendDataApi({
      zoneId: currentZone?.zoneId,
      zoneLevel: currentZone?.zoneLevel,
      taskId: supportTask?.wdId,
    }),
  {
    ready: isDefined(supportTask?.wdId) && isDefined(currentZone),
    refreshDeps: [supportTask?.wdId, currentZone],
    pollingInterval: interval * TIME_RANGE.SECOND,
  }
);

// 添加 Effect 监听数据变化
useEffect(() => {
  if (ctxOpt && legendSelected['应急仓']) {
    console.log('测试日志 指挥调度  应急仓打点数据 更新');
    MapInit.clearLayerById(ctxOpt, ['应急仓']);
    MapInit.addPoints(ctxOpt, newLegendData);
    setLegendLayerStatus();
  }
}, [newLegendData, legendSelected]);
```

#### 1.4 在 MapInit 中添加图标路径

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
const iconPath = `${p.level}.png`;
const imageUrl = `${constants.IMAGE_PATH}/emergency/map/图例/应急仓/${iconPath}`;
```

---

## 2. 新增打点类型

### 场景描述

需要添加新的打点类型，例如添加"无人机基站"打点。

### 步骤

#### 2.1 添加字段配置

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`

```typescript
export const fieldSource = [
  // ... 其他配置
  {
    key: '无人机基站',
    label: '无人机基站',
    showPopup: true,
    title: '无人机基站详情',
    showTrail: false,
    field: [
      { key: 'resourceTypeName', label: '物资类型' },
      { key: 'resourceId', label: '设备编号' },
      { key: 'regionName', label: '所属地市' },
      { key: 'resourceStatusText', label: '调度状态' },
      { key: 'batteryLevel', label: '电池电量', hideEmpty: true },
      { key: 'flightTime', label: '飞行时长', hideEmpty: true },
    ],
  },
];
```

#### 2.2 添加数据请求

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
const { data: droneDataNew } = useRequest(
  () =>
    getDronePointsApi({
      zoneId: currentZone?.zoneId,
      zoneLevel: currentZone?.zoneLevel,
      taskId: supportTask?.wdId,
    }),
  {
    ready: isDefined(supportTask?.wdId) && isDefined(currentZone),
    refreshDeps: [supportTask?.wdId, currentZone],
    pollingInterval: interval * TIME_RANGE.SECOND,
  }
);
```

#### 2.3 添加 Effect 监听

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
useEffect(() => {
  if (ctxOpt && legendSelected['无人机基站']) {
    console.log('测试日志 指挥调度  无人机基站打点数据 更新');
    const layerIds = [...new Set(dataDroneRef.current.map((p: any) => p.type))];
    MapInit.clearLayerById(ctxOpt, layerIds);

    dataDroneRef.current = [...droneDataNew];

    if (droneDataNew.length > 0) {
      MapInit.addPoints(ctxOpt, droneDataNew);
    }
    setLegendLayerStatus();
  }
}, [droneDataNew, legendSelected]);
```

#### 2.4 添加图标文件

**路径**: `apps/main/app/public/static/images/emergency/map/图例/无人机基站/`

**图标文件**: `0.png`（空闲）、`1.png`（任务中）

---

## 3. 修改弹窗字段

### 场景描述

需要修改应急发电车弹窗中显示的字段，例如添加"油机数量"字段。

### 步骤

#### 3.1 修改字段配置

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`

```typescript
{
    key: "应急发电车",
    label: "应急发电车",
    showPopup: true,
    title: "应急物资详情",
    showTrail: true,
    field: [
        { key: "resourceTypeName", label: "物资类型" },
        { key: "resourceId", label: "车牌号" },
        { key: "regionName", label: "所属地市" },
        { key: "resourceStatusText", label: "调度状态" },
        { key: "supportOilMachine", label: "油机数量", hideEmpty: true },  // ← 新增
        { key: "fuelLevel", label: "油量", hideEmpty: true },  // ← 新增
    ],
}
```

#### 3.2 添加样式处理（可选）

**文件**: `apps/main/app/components/center/dispatch-gis/dispatch-popup/index.tsx`

```typescript
const renderStyle = (item: any) => {
  if (item.key === 'deploy_state') {
    return { color: '#44D7B6' };
  } else if (
    item.key === 'resourceStatusText' &&
    source[item.key] === '任务中'
  ) {
    return { color: 'rgba(255, 139, 81, 1)' };
  } else if (item.key === 'fuelLevel') {
    // 油量低于 30% 显示红色
    const fuelLevel = parseInt(source[item.key] || '100');
    if (fuelLevel < 30) {
      return { color: '#FF5733', fontWeight: 'bold' };
    }
  }
  return {};
};
```

---

## 4. 添加地图图层

### 场景描述

需要添加新的地图图层，例如添加"应急通信车实时位置"图层。

### 步骤

#### 4.1 在 MapInit 中添加图层添加方法

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
addRealTimePosition: function (ctxOpt: any, data: any) {
    const { map, EMap } = ctxOpt;
    const eStyle = new EMap.Style();

    // 清理旧数据
    const gLayer = map.getLayerById("realTimePosition");
    gLayer && map.clearLayerFeatures(gLayer);

    let layer = map.getLayerById("realTimePosition");
    if (!layer) {
        layer = new EMap.ELayer({
            type: "Vector",
            id: "realTimePosition",
            zIndex: 199,  // 高于普通打点
            source: { wrapX: false },
            style: eStyle.style({
                stroke: eStyle.stroke({
                    color: "rgba(255, 215, 0, 1)",
                    lineCap: "round",
                    width: 4,
                }),
            }),
        });
        map.addLayer(layer);
    }

    // 添加要素
    data.forEach((item: any) => {
        const g4point = new EMap.EFeature({
            type: "Point",
            coordinates: [item.longitude, item.latitude],
            id: item.intId,
            layer: layer,
            style: eStyle.style({
                image: eStyle.image({
                    anchor: [0.5, 1],
                    scale: 1.2,
                    src: `${constants.IMAGE_PATH}/emergency/map/图例/应急通信车实时位置.png`,
                }),
                text: eStyle.text({
                    font: "14px arial, sans-serif",
                    text: item.resourceName,
                    textBaseline: "bottom",
                    offsetX: 0,
                    offsetY: 25,
                    fillColor: "#FFD700",
                    strokeColor: "#000000",
                    strokeWidth: 3,
                }),
            }),
        });
        g4point.add();
    });
}
```

#### 4.2 在主组件中调用

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
useEffect(() => {
  if (ctxOpt && legendSelected['应急通信车实时位置']) {
    console.log('测试日志 指挥调度  应急通信车实时位置图层 更新');
    MapInit.addRealTimePosition(ctxOpt, realTimePositionData);
    setLegendLayerStatus();
  }
}, [realTimePositionData, legendSelected]);
```

---

## 5. 调试数据不更新问题

### 场景描述

地图数据不更新，需要排查问题。

### 排查步骤

#### 5.1 检查依赖项

**检查点**: `refreshDeps` 是否包含所有依赖

```typescript
// ❌ 错误示例
const { data } = useRequest(api, {
  refreshDeps: [supportTask?.wdId], // 缺少 currentZone
});

// ✅ 正确示例
const { data } = useRequest(api, {
  refreshDeps: [supportTask?.wdId, currentZone?.zoneId, currentZone?.zoneLevel],
});
```

#### 5.2 检查轮询间隔

**检查点**: 轮询间隔是否合理

```typescript
const { interval = 300 } =
  useEnvironment('gd-emergency-support.modules.dispatch-gis.request') ?? {};
pollingInterval: interval * TIME_RANGE.SECOND; // 默认 300 秒
```

#### 5.3 检查 API 返回数据

**检查点**: API 是否返回数据

```typescript
const { data: newData } = useRequest(() => getNewDataApi({...}), {
    onSuccess: (data) => {
        console.log("✅ API 返回数据", data);
    },
    onError: (error) => {
        console.error("❌ API 请求失败", error);
    },
});
```

#### 5.4 检查 Effect 执行

**检查点**: Effect 是否执行

```typescript
useEffect(() => {
  console.log('🔍 Effect 执行', data);
  if (ctxOpt) {
    // 地图操作
  }
}, [data]);
```

---

## 6. 优化性能问题

### 场景描述

地图性能较差，需要优化。

### 优化方法

#### 6.1 使用 ref 存储大数据

**优化前**:

```typescript
const [data, setData] = useState([]);
```

**优化后**:

```typescript
const dataRef = useRef([]);
```

#### 6.2 批量清理图层

**优化前**:

```typescript
data.forEach((p) => {
  const gLayer = map.getLayerById(p.type);
  gLayer && map.clearLayerFeatures(gLayer);
});
```

**优化后**:

```typescript
const layerIds = [...new Set(data.map((p) => p.type))];
MapInit.clearLayerById(ctxOpt, layerIds);
```

#### 6.3 使用 useMemo 缓存计算结果

**优化前**:

```typescript
const columns = [
  // 每次渲染都重新计算
];
```

**优化后**:

```typescript
const columns = useMemo(() => {
  return [
    // 缓存计算结果
  ];
}, [resourceTypes]);
```

#### 6.4 使用 useMemoizedFn 缓存函数

**优化前**:

```typescript
const handleLegendChange = (value: string, checked: boolean) => {
  // 每次渲染都重新创建函数
};
```

**优化后**:

```typescript
const handleLegendChange = useMemoizedFn((value: string, checked: boolean) => {
  // 缓存函数引用
});
```

---

## 7. 同经纬度处理

### 场景描述

当多个应急资源点具有相同经纬度时，需要聚合显示以避免重叠；路径起点/终点需要去重以避免重复创建。

---

#### 7.1 应急资源聚合（经纬度去重）

**位置**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

**核心逻辑**:

```typescript
// 过滤选中状态的数据
const selectedStatus: string[] = [];
if (legendSelected['任务中']) selectedStatus.push('1');
if (legendSelected['空闲']) selectedStatus.push('0');

// 使用 Map 按经纬度分组
const pointMap = new Map();
// 1. 有重复经纬度的数据（将type改为应急资源聚合）
const aggPoints: any[] = [];
// 2. 去掉重复数据以外的数据（经纬度唯一的数据）
const singlePoints: any[] =
  selectedStatus.length > 0 ? [] : [...dataResourcePointsNew];

if (selectedStatus.length > 0) {
  const resourceTypes = [
    '应急通信车',
    '应急发电车',
    '卫星便携包',
    '无线队伍',
    '传输队伍',
  ];

  // 应急资源聚合选中的类型
  const aggregatedSelectedTypes = Object.keys(legendSelected).filter((key) => {
    return legendSelected[key] === true && resourceTypes.includes(key);
  });
  const emergencyAggregatedSelectedTypes = selectedStatus.flatMap((num) =>
    aggregatedSelectedTypes.map((item) => item + num)
  );

  const selectedPoints: any = [];
  const unselectedPoints: any = [];
  dataResourcePointsRef.current.forEach((p: any) => {
    if (emergencyAggregatedSelectedTypes.includes(p.type)) {
      selectedPoints.push(p);
    } else {
      unselectedPoints.push(p);
    }
  });

  // 按经纬度分组
  selectedPoints.forEach((p: any) => {
    const key = `${p.longitude}_${p.latitude}`;
    if (!pointMap.has(key)) {
      pointMap.set(key, []);
    }
    pointMap.get(key).push(p);
  });

  // 处理聚合和非聚合数据
  pointMap.forEach((points) => {
    if (points.length > 1) {
      // 经纬度重复的数据 → 聚合为"应急资源聚合"类型
      aggPoints.push({
        ...points[0],
        type: '应急资源聚合',
        intId: `应急资源聚合_${points[0].longitude}_${points[0].latitude}`,
        aggPoints: points,
      });
    } else {
      // 经纬度唯一的数据 → 保持原样
      singlePoints.push(...points);
    }
  });

  singlePoints.push(...unselectedPoints);
}

// 分别添加聚合数据和非聚合数据
MapInit.addPoints(ctxOpt, singlePoints);
MapInit.addPoints(ctxOpt, aggPoints);
```

**处理流程**:

1. **状态过滤**: 根据图例选中状态过滤数据
2. **数据分组**: 通过 `longitude_latitude` 作为 key 将数据分组
3. **判断聚合**: 如果同一经纬度有多个点，则进行聚合
4. **生成聚合点**: 将聚合数据包装为"应急资源聚合"类型
5. **分别渲染**: 聚合点和非聚合点分别添加到地图

**验证点**:

- [ ] 同经纬度的多个资源点正确聚合为一个标记
- [ ] 聚合点显示"应急资源聚合"类型
- [ ] 点击聚合点可查看所有聚合的资源详情
- [ ] 非聚合点正常显示

---

#### 7.2 路径起点/终点去重

**位置**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

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
    type: 'Point',
    coordinates: [p?.longitudeA, p?.latitudeA],
    id: 'A' + p?.intId,
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
    type: 'Point',
    coordinates: [p?.longitudeB, p?.latitudeB],
    id: 'B' + p?.intId,
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

**验证点**:

- [ ] 相同经纬度的起点/终点只创建一次
- [ ] 不同经纬度的点正常显示
- [ ] 路径线条正常连接起点和终点

---

## 8. 扩展跨地市飞线功能

### 场景描述

需要修改跨地市飞线的颜色和宽度。

### 步骤

#### 8.1 修改飞线样式

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

```typescript
addCrossCityLines: function (ctxOpt: any, lines: any) {
    // ... 其他代码

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
                            color: "rgba(250, 100, 1, 1)",  // ← 修改颜色
                            lineCap: "round",
                            lineDash: null,
                            lineDashOffset: 0,
                            lineJoin: "round",
                            miterLimit: 10,
                            width: 6,  // ← 修改宽度
                        }),
                    }),
                });
                map.addLayer(gLayer);
            }

            // ... 其他代码
        }
    });
}
```

#### 8.2 添加飞线点击事件

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
useEffect(() => {
  if (state.curPoint?.intId?.includes('crossCityLine')) {
    if (state.curPoint.handleType === 'singleclick') {
      setState({
        crossCityLineId: state.curPoint.intId,
        modalVisible: true,
      });
    }
  }
}, [state.curPoint]);
```

---

## 9. 添加新的预警类型

### 场景描述

需要添加新的预警类型，例如添加"台风预警"打点。

### 步骤

#### 8.1 添加字段配置

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`

```typescript
{
    key: "台风预警",
    label: "台风预警",
    showPopup: true,
    title: "台风预警详情",
    showTrail: false,
    field: [
        { key: "alarmType", label: "预警类型" },
        { key: "alarmTime", label: "预警时间" },
        { key: "windSpeed", label: "风速", hideEmpty: true },
        { key: "pressure", label: "气压", hideEmpty: true },
        { key: "moveDirection", label: "移动方向", hideEmpty: true },
        { key: "moveSpeed", label: "移动速度", hideEmpty: true },
    ],
}
```

#### 8.2 添加数据请求

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
const { data: typhoonAlarmData } = useRequest(
  () =>
    getTyphoonAlarmApi({
      zoneId: currentZone?.zoneId,
      zoneLevel: currentZone?.zoneLevel,
      taskId: supportTask?.wdId,
    }),
  {
    ready: isDefined(supportTask?.wdId) && isDefined(currentZone),
    refreshDeps: [supportTask?.wdId, currentZone],
    pollingInterval: interval * TIME_RANGE.SECOND,
  }
);
```

#### 8.3 添加 Effect 监听

**文件**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

```typescript
useEffect(() => {
  if (ctxOpt && legendSelected['台风预警']) {
    console.log('测试日志 指挥调度  台风预警打点数据 更新');
    MapInit.clearLayerById(ctxOpt, ['台风预警']);
    MapInit.addPoints(ctxOpt, typhoonAlarmData);
    setLegendLayerStatus();
  }
}, [typhoonAlarmData, legendSelected]);
```

---

## 10. 常见问题

### 10.1 图层不显示

**问题**: 地图图层不显示

**解决方案**:

1. 检查图例是否选中
2. 检查数据是否为空
3. 检查图层 ID 是否重复
4. 检查 `setLegendLayerStatus` 是否被调用

### 10.2 数据不更新

**问题**: 地图数据不更新

**解决方案**:

1. 检查依赖项是否变化
2. 检查轮询间隔设置
3. 检查 API 是否返回数据
4. 检查 Effect 是否执行

### 10.3 弹窗不显示

**问题**: 点击地图元素弹窗不显示

**解决方案**:

1. 检查 `showPopup` 是否为 true
2. 检查字段数据是否存在
3. 检查 `legendSelected` 中的对应项是否为 true
4. 检查 `clearPopupData` 是否被调用

### 10.4 跨地市飞线不显示

**问题**: 省级地图跨地市飞线不显示

**解决方案**:

1. 检查 `showCrossLine` 是否为 true
2. 检查区域层级是否为省级
3. 检查 `dataCrossCityLineNew` 是否有数据
4. 检查 `legendSelected["跨市调度"]` 是否为 true

### 10.5 传输机房光缆连线不显示

**问题**: 乡镇单断/双断/全阻时传输机房光缆连线不显示

**解决方案**:

1. 检查 `damageToTownsGisPin.alarmType` 是否为 "乡镇单断"、"乡镇双断" 或 "乡镇全阻"
2. 检查 `damageToTownsGisPin.selected` 是否为 true
3. 检查 `dataTransPointsLines` 是否有数据
4. 检查 Effect 是否执行

---

## 11. 维护指南

### 11.1 添加新功能

1. **确定位置**: 根据功能类型选择组件
2. **数据请求**: 使用 ahooks useRequest
3. **地图操作**: 使用 MapInit 工具类
4. **状态管理**: 优先使用组件 state，其次使用 store

### 11.2 调试技巧

1. **日志**: 使用 `console.log` + 前缀标识
2. **检查点**:
   - 数据请求是否触发
   - 数据是否返回
   - Effect 是否执行
   - 地图操作是否成功

### 11.3 性能监控

1. **网络请求**: 检查轮询频率
2. **DOM 操作**: 检查图层清理
3. **渲染次数**: 使用 React DevTools Profiler

---

## 12. 相关文件

### 12.1 组件文件

- `apps/main/app/components/center/dispatch-gis/`

### 12.2 请求文件

- `apps/main/app/request/center.ts`
- `apps/main/app/request/custom/center.ts`

### 12.3 Store

- `apps/main/app/store.ts`

### 12.4 枚举

- `apps/main/app/enum/`

### 12.5 UI 组件

- `apps/main/app/components/ui/emap-gis/`

---

**文档版本**: 1.1  
**最后更新**: 2026-05-21  
**维护团队**: GD Emergency Support Team  
**更新内容**: 添加同经纬度处理模块（应急资源聚合、路径起点/终点去重）
