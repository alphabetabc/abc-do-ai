---
name: gd-es-next-warn-gis-maintenance
description: 用于维护和拓展 warn-gis 预警感知 GIS 组件的可复用技能
tags:
  - GIS
  - 预警
  - 维护
---

# warn-gis 组件维护技能 (Skill)

## 技能概述

这是一个用于维护和拓展 `warn-gis` 预警感知 GIS 组件的可复用技能。该技能涵盖了组件架构理解、常见修改、问题排查和性能优化等场景。

**核心组件文档**: [center-gis 详细技术文档](CENTER-GIS.md)

## 使用场景

### 1. 添加新图例项

### 2. 新增打点类型

### 3. 修改弹窗字段

### 4. 添加地图图层

### 5. 调试数据不更新问题

### 6. 优化性能问题

### 7. 扩展台风功能

### 8. 添加新的预警类型

---

## 技能模块

### 模块 1: 图例管理

#### 1.1 添加新的图例项

**场景**: 需要在图例面板中添加新的检查项

**步骤**:

1. **确定分类**
   - 风险预测类: 在 `WarnLegend` 的 `riskPredictionValues` 中添加
   - 物资预置类: 在 `WarnLegend` 的 `materialPresetValues` 中添加

2. **添加初始状态**

```typescript
// 文件: apps/main/app/components/center/warn-gis/warn-legend/index.tsx

const riskPredictionValues = {
  // ... existing items
  新增图例项: false, // ← 添加这一行
};
```

3. **添加全选处理**

```typescript
// 在 handleSelectAll 方法中添加
const handleSelectAll = (category: string, checked: boolean) => {
  const newCheckedValues = { ...checkedValues };

  switch (category) {
    // ... existing cases
    case 'newCategory': // ← 添加新分类
      newCheckedValues['新增图例项'] = checked;
      break;
  }

  setCheckedValues(newCheckedValues);
};
```

4. **添加全选状态获取**

```typescript
// 在 getSelectAllStatus 方法中添加
const getSelectAllStatus = (category: string) => {
  let allChecked = true;
  let anyChecked = false;

  switch (category) {
    // ... existing cases
    case 'newCategory':
      const items = ['新增图例项'];
      for (const item of items) {
        if (!checkedValues[item]) allChecked = false;
        if (checkedValues[item]) anyChecked = true;
      }
      break;
  }

  if (allChecked) return true;
  if (!anyChecked) return false;
  return undefined;
};
```

5. **添加 UI 渲染**

```typescript
// 在返回的 JSX 中添加
{legendSelected === "风险预测" && (
    <div className="warn-legend--content">
        <div className="legend-group">
            {/* ... existing groups */}
            <div className="legend-row" style={{ marginBottom: 2 }}>
                <div className="group-title-container">
                    <Checkbox
                        className="group-checkbox"
                        indeterminate={getSelectAllStatus("newCategory") === undefined}
                        checked={getSelectAllStatus("newCategory") === true}
                        onChange={(e) => handleSelectAll("newCategory", e.target.checked)}
                        style={{ marginRight: 5 }}
                    ></Checkbox>
                    <div className="group-title">新增分类:</div>
                </div>
                <div className="group-items-container">
                    <div className="group-item" style={{ marginRight: 1 }}>
                        <Image
                            className="group-icon"
                            preview={false}
                            src={`${constants.IMAGE_PATH}/emergency/icon-legend/your-icon.svg`}
                        />
                        <Checkbox
                            className="group-checkbox"
                            value={"新增图例项"}
                            checked={checkedValues["新增图例项"]}
                            onChange={(e) => handleCheckboxChange("新增图例项", e.target.checked)}
                        ></Checkbox>
                        <span className="group-name" style={{ width: 100 }}>
                            新增图例项名称
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
```

**验证点**:

- [ ] 图例面板显示新增项
- [ ] 全选/取消全选功能正常
- [ ] 选中状态正确传递到 `onLegendSelected`
- [ ] 对应的图层显示/隐藏正常

---

### 模块 2: 打点管理

#### 2.1 新增打点类型

**场景**: 需要在地图上新增一种类型的打点显示

**步骤**:

1. **创建打点组件**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/new-type/index.tsx

import { useMemo } from "react";
import styled from "styled-components";
import { useOverlayPoint } from "../OverlayPoint";

const NewTypeIcon = styled.div`
    width: 44px;
    height: 38px;
    border-radius: 3px;
    background: #your-color;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

export const NewType = (props: { data: any; legendSelected: any }) => {
    const overlayCtx = useOverlayPoint();

    const show = useMemo(() => {
        // 检查图例是否选中
        return props.legendSelected.some((d: any) => d[0] === "newType" && d[1] === true);
    }, [props.legendSelected]);

    if (!show || !props.data) return null;

    return (
        <NewTypeIcon
            className="icon-div"
            onClick={() => {
                // 点击事件处理
                overlayCtx.createPortal(
                    <div className="overlay-item-info-card">
                        <h3>新增类型详情</h3>
                        <p>{props.data.description}</p>
                    </div>
                );
            }}
        >
            {props.data.count ?? 0}
        </NewTypeIcon>
    );
};
```

2. **在 OverlayPoint 中注册**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx

import { Weather } from "./weather";
import { WeatherWarning } from "./weather-warning";
import { WaterWarning } from "./water-warning";
import { HighRiskTown } from "./high-risk-town";
import { NewType } from "./new-type";  // ← 添加导入

export function OverlayPoint(props: any) {
    // ... existing code

    return (
        <>
            {/* ... existing components */}
            <NewType data={props.newTypeData} legendSelected={props.legendSelected} />
            {/* ... rest of the code */}
        </>
    );
}
```

3. **在 RiskPredictionPoints 中添加数据请求**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx

// 添加新的 useRequest
useRequest(
  () => {
    return getNewTypeMapApi({
      zoneId: props.currentZone.zoneId,
      zoneLevel: props.currentZone.zoneLevel,
      taskId: props.supportTask.id,
      labelPoints,
    });
  },
  {
    ready:
      isDefined(props.currentZone) &&
      isDefined(props.supportTask) &&
      isDefined(labelPoints),
    refreshDeps: [props.currentZone, props.supportTask, labelPoints],
    pollingInterval: TIME_RANGE.MINUTE * 15,
    onSuccess: (dataSource) => {
      setState({
        newTypePoints: dataSource,
      });
    },
  }
);
```

4. **在 OverlayPoint 渲染中匹配数据**

```typescript
// 在 RiskPredictionPoints 的返回中
{(labelPoints?.points ?? []).map((point) => {
    // ... existing matches
    const newTypeData = state.newTypePoints.find((d) => {
        if (props.legendSelected["newType"] !== true) {
            return false;
        }
        try {
            return d.config.name === point.name;
        } catch (e) {
            console.error("[中屏打点-新增类型-未命中]", { data: d, labelPoint: point });
            return false;
        }
    });

    return (
        <OverlayPoint
            key={point.name}
            point={point}
            weather={weather}
            waterSituation={waterSituation}
            highRiskTown={highRiskTown}
            newTypeData={newTypeData}  // ← 传递数据
            legendSelected={legendSelectedList}
        />
    );
})}
```

**验证点**:

- [ ] 新打点类型在地图上正确显示
- [ ] 图例选中/取消影响打点显示
- [ ] 点击打点显示详情弹窗
- [ ] 数据轮询正常更新

---

### 模块 3: 弹窗字段管理

#### 3.1 添加弹窗字段

**场景**: 需要在鼠标悬浮提示或点击弹窗中添加新字段

**步骤**:

1. **修改字段配置**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/utils/field.ts

export const fieldSource = [
  {
    key: '无线队伍',
    label: '无线队伍',
    showPopup: true,
    title: '队伍详情',
    field: [
      { key: 'userlabel', label: '队伍名称' },
      { key: 'resourceTypeName', label: '专业' },
      // ... existing fields
      { key: 'newField', label: '新字段', hideEmpty: true }, // ← 添加这一行
    ],
  },
  // ... existing sources
];

export const commonFieldSource = {
  key: '通用物资',
  label: '通用物资',
  showPopup: true,
  title: '物资预置详情',
  field: [
    { key: 'resourceTypeName', label: '物资类型' },
    { key: 'resourceName', label: '物资编号' },
    // ... existing fields
    { key: 'newField', label: '新字段', hideEmpty: true }, // ← 添加这一行
  ],
};
```

2. **在数据源中确保字段存在**

```typescript
// 确保 API 返回的数据包含 newField 字段
// 如果需要转换数据格式，可以在 useRequest 的 converter 中处理
```

**验证点**:

- [ ] 悬浮提示显示新字段
- [ ] 点击弹窗显示新字段
- [ ] `hideEmpty: true` 的字段在为空时正确隐藏

---

### 模块 4: 地图图层管理

#### 4.1 添加新的地图图层

**场景**: 需要在地图上添加新的图层类型

**步骤**:

1. **在 MapInit 中添加图层创建方法**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx

export default {
  // ... existing methods

  addNewLayer: function (ctxOpt: any, data: any) {
    const { map, EMap } = ctxOpt;
    if (!map) return;

    const eStyle = new EMap.Style();

    // 清理旧数据
    const gLayer = map.getLayerById('newLayer');
    gLayer && map.clearLayerFeatures(gLayer);

    let layer = map.getLayerById('newLayer');
    if (!layer) {
      layer = new EMap.ELayer({
        type: 'Vector',
        id: 'newLayer',
        zIndex: 99,
        source: { wrapX: false },
        style: eStyle.style({
          stroke: eStyle.stroke({
            color: '#FF5722',
            lineCap: 'round',
            width: 3,
          }),
        }),
      });
      map.addLayer(layer);
    }

    // 添加要素
    data.forEach((item: any) => {
      const feature = new EMap.EFeature({
        type: 'LineString',
        coordinates: item.coordinates,
        id: item.id,
        layer: layer,
      });
      feature.add();
    });
  },

  setNewLayerStatus: function (ctxOpt: any, visible: boolean) {
    const { map } = ctxOpt;
    if (!map) return;

    const layer = map.getLayerById('newLayer');
    if (layer) {
      layer.setVisible(visible);
    }
  },
};
```

2. **在 CenterGis 中使用**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

// 添加新的数据请求
const { data: newData = EmptyObject.Array } = useRequest(
  () =>
    getNewLayerDataApi({
      /* params */
    }),
  {
    ready: isDefined(currentZone),
    refreshDeps: [currentZone],
    pollingInterval: interval * TIME_RANGE.SECOND,
  }
);

// 添加 Effect
useEffect(() => {
  if (ctxOpt && newData) {
    MapInit.addNewLayer(ctxOpt, newData);
  }
}, [ctxOpt, newData]);

// 在 setLegendLayerStatus 中添加
const setLegendLayerStatus = () => {
  // ... existing code
  const newTypeCheckList = Object.keys(legendSelected).filter(
    (key) => key === 'newType' && legendSelected[key] === true
  );
  if (newTypeCheckList.length > 0) {
    MapInit.setNewLayerStatus(ctxOpt, true);
  } else {
    MapInit.setNewLayerStatus(ctxOpt, false);
  }
};
```

**验证点**:

- [ ] 新图层正确添加到地图
- [ ] 图层显示/隐藏控制正常
- [ ] 数据更新时图层正确刷新
- [ ] 图层清理正常

---

### 模块 5: 调试技巧

#### 5.1 数据不更新问题排查

**问题**: 数据请求未触发或数据未更新

**排查步骤**:

1. **检查依赖项**

```typescript
// 确保所有依赖项都在 refreshDeps 中
useRequest(
  () =>
    getDataApi({
      /* params */
    }),
  {
    ready: isDefined(param1) && isDefined(param2),
    refreshDeps: [param1, param2], // ← 检查这里
    pollingInterval: 300000,
  }
);
```

2. **添加调试日志**

```typescript
useRequest(
  () => {
    console.log('[调试日志] 数据请求触发', { param1, param2 });
    return getDataApi({ param1, param2 });
  },
  {
    // ... existing config
    onSuccess: (data) => {
      console.log('[调试日志] 数据返回', data);
      // ... existing code
    },
    onError: (error) => {
      console.error('[调试日志] 数据请求失败', error);
    },
  }
);
```

3. **检查轮询间隔**

```typescript
// 确保轮询间隔正确
const { interval = 300 } =
  useEnvironment('gd-emergency-support.modules.warn-gis.request') ?? {};
const pollingInterval = interval * TIME_RANGE.SECOND; // 300 * 1000 = 300000ms
```

4. **检查 ready 条件**

```typescript
// 确保 ready 条件正确
ready: isDefined(param1) && isDefined(param2) && isDefined(param3);
// 如果 param3 是可选的，使用 isDefined(param3) || true
```

#### 5.2 地图图层不显示

**问题**: 图层已添加但不可见

**排查步骤**:

1. **检查图层可见性**

```typescript
// 在浏览器控制台执行
const layer = map.getLayerById('your-layer-id');
console.log('图层状态:', {
  id: layer.id_,
  visible: layer.getVisible(),
  zIndex: layer.getZIndex(),
});
```

2. **检查图层样式**

```typescript
// 确保样式正确
const eStyle = new EMap.Style();
layer.setStyle(
  eStyle.style({
    stroke: eStyle.stroke({
      color: '#FF5722', // ← 确保颜色可见
      width: 3,
    }),
  })
);
```

3. **检查数据**

```typescript
// 确保数据不为空
if (data.length > 0) {
  console.log('[调试日志] 添加图层数据', data.length, '条');
  MapInit.addPoints(ctxOpt, data);
} else {
  console.warn('[调试日志] 图层数据为空');
}
```

#### 5.3 弹窗不显示

**问题**: 鼠标悬浮或点击后弹窗不显示

**排查步骤**:

1. **检查 showPopup 配置**

```typescript
// 在 field.ts 中
{
    key: "无线队伍",
    showPopup: true,  // ← 确保为 true
    // ...
}
```

2. **检查 legendSelected**

```typescript
// 在 RiskPredictionPoints 中
if (props.legendSelected['riskPrediction'] !== true) {
  return null; // ← 确保不返回 null
}
```

3. **检查数据**

```typescript
// 在 CenterGis 的 curPoint Effect 中
console.log('[调试日志] 点击数据', {
  intId,
  dataPoint,
  fieldSet,
  state: state.curPoint,
});
```

---

### 模块 6: 性能优化

#### 6.1 优化数据处理

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
    const sites = dataSitePointsRef.current.filter((p: any) =>
      alarmLevels.includes(p.alarmLevel)
    );
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

#### 6.2 优化图层清理

**场景**: 图层更新时性能问题

**优化方法**:

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

useEffect(() => {
  if (ctxOpt && dataResourcePointsNew) {
    // 优化: 只清理变化的图层
    const oldLayerIds = new Set(
      dataResourcePointsRef.current.map((p: any) => p.type)
    );
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

### 模块 7: 同经纬度处理

#### 7.1 应急资源聚合（经纬度去重）

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
      type: '应急资源聚合',
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

#### 7.2 dispatch-gis 中的同经纬度处理

**实现位置**: `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

dispatch-gis 采用相同的聚合策略，但增加了状态过滤：

```typescript
// 过滤选中状态的数据
const selectedStatus: string[] = [];
if (legendSelected['任务中']) selectedStatus.push('1');
if (legendSelected['空闲']) selectedStatus.push('0');

// 聚合选中的资源类型
const resourceTypes = [
  '应急通信车',
  '应急发电车',
  '卫星便携包',
  '无线队伍',
  '传输队伍',
];
const aggregatedSelectedTypes = Object.keys(legendSelected).filter((key) => {
  return legendSelected[key] === true && resourceTypes.includes(key);
});
```

#### 7.3 路径起点/终点去重

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
    type: 'Point',
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

### 模块 8: 扩展功能

#### 8.1 添加新的预警类型

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
  }
);
```

#### 8.2 添加自定义地图事件

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
      clickType: 'rightclick',
      callback: (lonLat: any, feature: any) => {
        const featureId = feature?.id_ || '';
        customCallback({
          type: 'rightclick',
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
  console.log('[自定义事件]', params);
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

## 技能检查清单

### 添加新功能

- [ ] 确定组件位置
- [ ] 添加数据请求 (useRequest)
- [ ] 添加状态管理
- [ ] 添加 UI 渲染
- [ ] 添加地图操作 (MapInit)
- [ ] 添加事件处理
- [ ] 测试数据流
- [ ] 测试用户交互

### 调试问题

- [ ] 检查依赖项
- [ ] 检查轮询间隔
- [ ] 检查 ready 条件
- [ ] 添加调试日志
- [ ] 检查数据格式
- [ ] 检查图层配置
- [ ] 检查样式设置

### 性能优化

- [ ] 使用 Ref 缓存数据
- [ ] 使用 useMemo 缓存计算
- [ ] 优化图层清理
- [ ] 减少不必要的重渲染
- [ ] 优化数据结构

---

## 最佳实践

### 1. 代码组织

- 按功能模块组织文件
- 使用清晰的命名约定
- 添加详细的注释

### 2. 状态管理

- 优先使用组件 state
- 避免过度使用 store
- 使用 ahooks 管理副作用

### 3. 性能优化

- 使用 Ref 存储大数据
- 使用 useMemo 缓存计算
- 优化图层清理逻辑

### 4. 调试技巧

- 添加前缀日志
- 使用条件断点
- 检查数据流

### 5. 测试验证

- 单元测试关键函数
- E2E 测试用户流
- 性能测试大数据量

---

## 相关资源

### 关联技能

- [warn-gis-risk-prediction-points](../warn-gis-risk-prediction-points/SKILL.md) - 风险预测打点模块，负责在 GIS 地图上渲染各类风险预测打点（天气、气象预警、水情预警、高风险乡镇）

### 文档

- `docs/components/warn-gis.md` - 完整维护文档
- `docs/maintenance/network-scale.md` - 网络规模相关文档

### 代码

- `apps/main/app/components/center/warn-gis/` - 组件源码
- `apps/main/app/request/center.ts` - API 请求
- `apps/main/app/store.ts` - 状态管理

### 工具

- React DevTools - 组件调试
- Redux DevTools - 状态调试
- Chrome Performance - 性能分析

---

**技能版本**: 1.1  
**最后更新**: 2026-05-21  
**维护团队**: GD Emergency Support Team  
**更新内容**: 添加同经纬度处理模块（应急资源聚合、dispatch-gis 同经纬度处理、路径起点/终点去重）
