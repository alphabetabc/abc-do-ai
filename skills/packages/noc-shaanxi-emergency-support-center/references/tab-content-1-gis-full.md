# TabContent1 · Gis（日常保障 GIS 实际渲染）

底层 GIS 渲染。封装 `fedx-gis/dist/gis-2d` 的 `MapContainer / VectorLayer / CircleView / TileArcgisRestLayer / XYZTileLayer`。包含图层加载、图例联动、网元点击、右屏派发、抢修跳转回流。

- 源文件：[gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx)

> 父组件：[center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/index.tsx)
>
> 这是日常保障 GIS 的实现。**不要把它和突发保障 GIS 合并**——突发保障 GIS 在另一目录，逻辑差别较大（区域配置、抢修回流路径不同）。
>
> **跨图层跨 neType 聚合**：见 [tab-content-1-aggregate-points.md](tab-content-1-aggregate-points.md)。本页只做指针，详细设计在那里。

## 职责

1. 加载 6 类数据图层（区域线、乡镇名、应急物资、机房、传输、基站 / 故障断点光缆）
2. **跨图层跨 neType 聚合**：业务层把基站 + 机房同址点合并为聚合点，详见 [聚合文档](tab-content-1-aggregate-points.md)
3. 维护图例（`neTypeCheckList / stationTypeCheckList / transmissionTypeCheckList`）
4. 网元 hover 显示 `ElTooltipBase`，网元 click 派发右屏或展示 `ElTooltipCircle`
5. 「抢修等级跳转」回流（`leftRepairNoticeParams?.intId`）：切换到 `repairCheckList`，聚焦到第一根告警网元
6. 乡镇名称 → 区县地图回流（监听 `showGisTownMapBack` 变化）
7. 断点光缆 `OpticalCableGis` 子组件

## Props（来自父组件）

| prop                                      | 类型                                                  | 说明                  |
| ----------------------------------------- | ----------------------------------------------------- | --------------------- |
| `currentTabType`                          | `TabChangeEnum`                                       | 守卫所有 `useRequest` |
| `zoneSelect`                              | `{ provinceId, regionId, cityId, zoneId, zoneLevel }` | 行政区                |
| `drillZone`                               | `{ zoneId, zoneLevel, regionId, cityId, ... }`        | 当前钻入 zone         |
| `dateTimeSelect` / `dateTimeRefreshFixed` | —                                                     | 时间窗口              |
| `leftRepairNoticeParams`                  | `{ intId, repairLevel, ... } \| undefined`            | 外部抢修跳转参数      |
| `zoneTownSelect`                          | `{ zoneId, zoneLevel } \| null`                       | 是否在乡镇模式        |
| `dispatch`                                | `(key, payload) => void`                              | 派发器                |
| `showGisTownMapBack`                      | `boolean`                                             | 回流开关              |
| `changeShowGisTownMapBack`                | `(v: boolean) => void`                                | 关闭回流开关          |

## State 总览

```ts
const [neTypeCheckList, setNeTypeCheckList] = useState<any>(suddenNeTypeCheckList); // 主图例
const [stationTypeCheckList, setStationTypeCheckList] = useState('0,1'); // 基站子图例
const [transmissionTypeCheckList, setTransmissionTypeCheckList] = useState('0,1,2'); // 传输子图例
const [circlePoints, setCirclePoints] = useState<any>([]); // 圆圈 Tooltip 目标
const [circleTooltipSource, setCircleTooltipSource] = useState<any>([]);
const [circleTooltipStyle, setCircleTooltipStyle] = useState<any>();
const [tooltipSource, setTooltipSource] = useState<any>(); // 基础 Tooltip 源
const [tooltipStyle, setTooltipStyle] = useState<any>();
const [zoneLevel, setZoneLevel] = useState<any>(props.drillZone?.zoneLevel); // 本地 zoneLevel
const [zoneId, setZoneId] = useState<any>(props.drillZone?.zoneId);
const [showLegend, setShowLegend] = useState(false);
const [opticalState, setOpticalState] = useSetState({
    // 光缆图层
    showOpticalCableGis: false,
    lineIds: null,
    azIntIds: null,
});
const [transRepairLevel, setTransRepairLevel] = useState('-1'); // 传输推荐抢修等级
const [machineryRoomRepairLevel, setMachineryRoomRepairLevel] = useState('-1');
```

## 7 类数据 useRequest

> 所有 useRequest 的 `pollingInterval: TIME_RANGE.HOUR * 24`（即每天轮询）。

| key                          | API                                                                                                                                                                      | ready 条件                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `dataAreaLines`              | `getEmergencySupportGisLinesApi(zoneSelect, zoneId)`                                                                                                                     | `tab1 && isDefined(zoneId) && (zoneLevel ∈ {city, town}) && !leftRepairNoticeParams?.intId`                                               |
| `dataStationPointsAll`       | `getEmergencyNormalGisStationPointsApi(zoneSelect, {...drillZone, ...dateTimeSelect, zoneId, zoneLevel}, '0,1')`                                                         | `tab1 && isDefined(zoneId) && (zoneLevel ∈ {city, town}) && !leftRepairNoticeParams?.intId`                                               |
| `dataTransmissionPointsAll`  | `getEmergencyNormalGisTransmissionPointsApi(zoneSelect, {...drillZone, ...dateTimeSelect, zoneId, zoneLevel}, '0,1,2', leftRepairNoticeParams?.intId, transRepairLevel)` | `tab1 && isDefined(zoneId) && (zoneLevel ∈ {city, town}                                                                                   |     | leftRepairNoticeParams?.intId)` |
| `dataMachineryRoomPointsAll` | `getEmergencyNormalGisMachineryRoomDataApi(zoneSelect, {...drillZone, ...dateTimeSelect, zoneId, zoneLevel}, leftRepairNoticeParams?.intId, machineryRoomRepairLevel)`   | 同上                                                                                                                                      |
| `dataSuppliesPointsAll`      | `getEmergencyNormalGisSuppliesPointsApi(zoneSelect, {...drillZone, ...dateTimeSelect, zoneId, zoneLevel})`                                                               | `tab1 && isDefined(zoneId) && (zoneLevel ∈ {city, town}) && !leftRepairNoticeParams?.intId`                                               |
| `dataTownNames`              | `getEmergencyGisTownPointApi(zoneSelect, drillZone?.zoneId)`                                                                                                             | `tab1 && isDefined(drillZone.zoneId) && (zoneLevel ∈ {city, town}) && !leftRepairNoticeParams?.intId`                                     |
| `dataOpticalCable`           | `getMiddleMapAlarmTransmissionApi({...zoneSelect, ...dateTimeSelect}, leftRepairNoticeParams?.intId)`                                                                    | `tab1 && opticalState.showOpticalCableGis && isDefined(zoneSelect.zoneId) && isDefined(zoneSelect.zoneLevel) && (zoneLevel ∈ {city, town} |     | leftRepairNoticeParams?.intId)` |

## 数据过滤 (useMemo)

```ts
const dataStationPoints = useMemo(
    () =>
        dataStationPointsAll?.map((item) => ({
            neType: item.neType,
            points: item.points.filter((p) => stationTypeCheckList.includes(p.isAlarm)),
        })),
    [dataStationPointsAll, stationTypeCheckList],
);
```

`dataTransmissionPoints` 同理，依据 `transmissionTypeCheckList` 过滤。

## 跨图层跨 neType 聚合（详见 [聚合文档](tab-content-1-aggregate-points.md)）

> 本节是聚合能力的**指针 + 关键改动摘要**。完整代码（4 个 useMemo 完整实现、VectorLayer 完整 props、原图层 source 替换对照表、el-tooltip-circle 完整代码）、`rawNeType` 概念、为什么需要复原 neType、与 legend 的协作、tab2 计划等都在 [tab-content-1-aggregate-points.md](tab-content-1-aggregate-points.md)。
>
> **本节代码均与源文件 1:1 对齐**，未做任何简化或占位。

## 关键交互函数

### onViewSetChange（主图例）

```ts
import { flushSync } from 'react-dom';

const onViewSetChange = (checkedValues) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    flushSync(() => {
        setCirclePoints([]);
    });
    setTimeout(() => {
        setNeTypeCheckList(checkedValues);
    }, 1);
};
```

> `flushSync` + `setTimeout(..., 1)` 两段式栅栏：先同步 commit 空 circlePoints（让 `<GisCustomCircleView>` 卸载所有 `<img>`、关闭悬停 tooltip），再在下一帧写入新的 `neTypeCheckList`，避免 tooltip 残留在旧图层上。详见下文「`flushSync` 与 setTimeout 栅栏」。

### onShowCircle / onCirclePointMove / onCircleClick

圆圈 Tooltip（站点聚合）三件套：

- `onShowCircle(pointArr)` → 显示圆圈
- `onCirclePointMove` → 鼠标移动到点上显示 `ElTooltipCircle`
- `onCircleClick` → 触发 `pointClick`

`onShowCircle` 同样采用 `flushSync + setTimeout` 模式：

```ts
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    flushSync(() => {
        setCirclePoints([]);
    });
    setTimeout(() => {
        setCirclePoints(
            pointArr.map((p) => ({
                ...p,
                neType: p.rawNeType ?? p.neType,
            })),
        );
    }, 1);
};
```

### onPointClick（网元点击）

```ts
if (point.isTownNamePoint) {
    drillTownZone(obj); // 钻入乡镇
    props.dispatch(widgetFields.getField('zoneSelect'), { ...drillZone, zoneLevel: town, zoneId: point.siteName });
    props.dispatch(widgetFields.getField('zoneTownSelect'), { zoneLevel: town, zoneId: point.siteName });
} else if (point.isOpticalCable) {
    pointClick(point);
} else if (pointClickNeTypes.includes(point.neType) && Number(point.alarmLevel) > 0 && !point.isOpticalCable) {
    pointClick(point);
}
```

### pointClick（派发右屏）

```ts
const data = point.isOpticalCable
    ? await getEmergencyGisPointCableDetailApi({ cableSection: point.intId, ...dateTimeSelect })
    : point.isMachineryRoom
      ? await getEmergencyGisPointMachineryRoomDetailApi(point.neType, point.siteCode)
      : point.isTransmission
        ? await getEmergencyGisPointTransmissionDetailApi(point.isAlarm, point.siteCode)
        : await getEmergencyGisPointDetailApi(point.neType, point.siteCode);

if (isEmpty(data)) return;
props.dispatch(widgetFields.getField('rightTabChanged'), { key: 1 });
props.dispatch(widgetFields.getField('centerAreaNeIds'), { neIds: [point.siteCode], data });

if (point.isOpticalCable) {
    props.dispatch(widgetFields.getField('rightSecondTabTransType'), { type: '0' });
    props.dispatch(widgetFields.getField('rightSecondTabChanged'), { key: '传输' });
    props.dispatch(widgetFields.getField('rightSecondTabTransZoneParams'), {});
} else {
    switch (point.neType) {
        case '201': case '3201': case '8104':    → 无线
        case '10005': case '1000501'–'1000505': → 动环
        case '900':                               → BRAS
        case '2011':                              → OLT
        case '2008', '2009', '7111', '2034':      → 传输 + 清空 zoneParams
        default:                                  → 传输 + 清空 zoneParams
    }
}
```

> 比 Path 多一类「动环 (10005*)」分支；Path 是用 `mainIndexId` 派发告警参数，GIS 走 `rightSecondTabChanged` Tab 切换（告警参数由右屏 `data` 自行处理）。

### onPointMove（基础 Tooltip）

```ts
if (e.type === 'point' && !e.isTownNamePoint && !e.isOpticalCable) {
    setTooltipSource(e);
    setTooltipStyle({ visibility: 'visible' });
} else {
    setTooltipStyle({ visibility: 'collapse' });
    setTooltipSource(null);
}
```

### drillTownZone（下钻乡镇）

```ts
const drillTownZone = (obj) => {
    setZoneLevel(ZoneLevelEnum.town);
    setZoneId(obj.zoneId);
    setMapCenter([Number(obj.longitude), Number(obj.latitude)]);
    setMapZoom(Number(obj.gisLevel) || 11);
};
```

## 重要 useEffect

### 图层显示 (gisFunc.showLayer)

```ts
useEffect(() => {
    if (dataStationPoints || dataTransmissionPoints || dataSuppliesPointsAll || dataMachineryRoomPointsAll) {
        const map = getMap();
        const layerParam = neTypeList.map((item) => ({
            neType: item,
            isShow: neTypeCheckList.indexOf(item) >= 0,
        }));
        gisFunc.showLayer(map, layerParam);
    }
}, [dataStationPoints, dataTransmissionPoints, dataSuppliesPointsAll, dataMachineryRoomPointsAll]);
```

### 主图例变化

```ts
useEffect(() => {
    if (neTypeCheckList) {
        const map = getMap();
        const layerParam = neTypeList.map((item) => ({
            neType: item,
            isShow: neTypeCheckList.indexOf(item) >= 0,
        }));
        gisFunc.showLayer(map, layerParam);
        setOpticalState({ showOpticalCableGis: neTypeCheckList.indexOf('5') >= 0 });
    }
}, [neTypeCheckList]);
```

> `5` 表示光缆图层（具体见 `emergencySupportGisConfig.neTypeList`）。

### 乡镇回流（监听 props.showGisTownMapBack）

```ts
useEffect(() => {
    if (currentTabType === TabChangeEnum.tab1 && props.showGisTownMapBack) {
        setZoneLevel(ZoneLevelEnum.city);
        setZoneId(drillZone?.zoneId);
        props.dispatch(widgetFields.getField('zoneSelect'), { ...drillZone });
        props.dispatch(widgetFields.getField('zoneTownSelect'), null);
        props.changeShowGisTownMapBack(false);
    }
}, [currentTabType, props.showGisTownMapBack]);
```

> **注意 `zoneSelect` payload 不能漏 `provinceId/regionId/cityId`**，这里用 `{...drillZone}` 整体透传，依赖父组件传入完整的 `drillZone`。

### 区县地图聚焦 (cityId 变化)

```ts
useEffect(() => {
    getPathMapConfigJson().then((res) => {
        const obj = res?.data?.data?.find((item) => String(item.id) === String(drillZone?.cityId));
        if (obj?.cp) setMapCenter(obj.cp);
    });
}, [drillZone?.cityId]);
```

### 抢修回流（leftRepairNoticeParams → 聚焦到告警网元）

```ts
useEffect(() => {
    if (
        Number(leftRepairNoticeParams?.intId) &&
        (dataTransmissionPointsAll?.length > 0 || dataMachineryRoomPointsAll?.length > 0)
    ) {
        try {
            const trans = dataTransmissionPointsAll?.map((i) => i.points).flat();
            const machine = dataMachineryRoomPointsAll?.map((i) => i.points).flat();
            const lon = trans?.[0]?.longitude || machine?.[0]?.longitude || emergencySupportGisConfig.center[0];
            const lat = trans?.[0]?.latitude || machine?.[0]?.latitude || emergencySupportGisConfig.center[1];
            setMapCenter([lon, lat]);
            setMapZoom(Number(emergencySupportGisConfig.repairZoom) || 14);
        } catch (error) {
            setMapCenter(emergencySupportGisConfig.center);
        }
    }
}, [leftRepairNoticeParams, dataTransmissionPointsAll, dataMachineryRoomPointsAll]);
```

### 抢修切换图例

```ts
useEffect(() => {
    if (leftRepairNoticeParams?.intId) setNeTypeCheckList(repairCheckList);
    else setNeTypeCheckList(suddenNeTypeCheckList);
}, [leftRepairNoticeParams]);
```

### 断点光缆数据

```ts
useEffect(() => {
    setOpticalState({ lineIds: null, azIntIds: null });
    if (dataOpticalCable) {
        setTimeout(() => {
            setOpticalState({ lineIds: dataOpticalCable.lineIds, azIntIds: dataOpticalCable.azIntIds });
        }, 1);
    }
}, [dataOpticalCable]);
```

## 地图容器渲染 MapContainer

```tsx
<MapContainer
    view={{
        projection: emergencySupportGisConfig.projection || 'EPSG:4326',
        center: emergencySupportGisConfig.center,
        zoom: emergencySupportGisConfig.cityZoom || emergencySupportGisConfig.zoom,
        minZoom,
        maxZoom,
        imageUrl: `${constants.IMAGE_PATH}/emergency-support/map/{0}/{1}.png`,
    }}
    showRoom={false}
    interactions={{ doubleClickZoom: false }}
>
    {/* 图层：TileArcgisRestLayer / XYZTileLayer（根据 type 二选一） */}
    {/* VectorLayer: layerAreaLines, layerTownNames, layerSuppliesPoints, layerMachineryRoomPoints, layerTransmissionPoints, layerStationPoints, layerAggregatePoints */}
    {/* CircleView */}
    {/* OpticalCableGis */}
</MapContainer>
```

每个 VectorLayer 的 `popupParam.containerName` 必须用 `toolTipWindow`（与页面节点 id 对应）。

## Tooltip 节点

```tsx
<div id="toolTipWindow">
    {tooltipSource && <ElTooltipBase source={tooltipSource} style={tooltipStyle} />}
</div>
<div id="toolTipWindowCircle1">
    {circleTooltipSource && <ElTooltipCircle source={circleTooltipSource} style={circleTooltipStyle} />}
</div>
```

> `toolTipWindowCircle1` 末尾的 1 是为了和 tab2 的 `toolTipWindowCircle2` 区分，**修改时务必保留后缀**。

## 图例区

```tsx
<div className={`legend-title ${showLegend ? '' : 'legend-title-hidden'}`} onClick={() => setShowLegend(!showLegend)}>
    <span className="legend-name">图例</span>
</div>;
{
    showLegend && (
        <div className="legend-group">
            <GisLegend
                repairLevel={leftRepairNoticeParams?.repairLevel}
                neTypeCheckList={neTypeCheckList}
                onViewSetStationChange={onViewSetStationChange}
                onViewSetTransmissionChange={onViewSetTransmissionChange}
                onViewSetChange={onViewSetChange}
                onMachineryRoomRepairLevelChange={(item) => setMachineryRoomRepairLevel(item)}
                onTransRepairLevelChange={(item) => setTransRepairLevel(item)}
            />
        </div>
    );
}
```

## 容器 id

```html
<div className="emergency-support-center-gis-map-container" id="emergency-gis-map1"></div>
```

> 后缀 `1` 区分突发保障的 `emergency-gis-map2`，**保留**。

## 易踩坑

- 7 个 `useRequest` 的 `ready` 守卫很冗余但**不能简化**——`leftRepairNoticeParams?.intId` 的影响在不同的请求中不一样，合并会引入跨场景请求
- `point.isTownNamePoint` 是真正进入乡镇的入口，依赖 fedx-gis 在图层渲染时打的标记
- 抢修回流时使用的是 `Number(leftRepairNoticeParams?.intId)` 做数值判断，但清空时派发的是 `''`，**`''` 会被 `Number()` 转成 0**，所以判断时是 `Number(...) && ...`
- `flushSync + setTimeout(..., 1)` 在 `onViewSetChange` / `onShowCircle` 是「先清后设」的栅栏；**不要尝试用 `key` 强制 `<GisCustomCircleView>` 重挂载替代**——见下文「flushSync 与 setTimeout 栅栏」原因
- 修改图层显示控制时记得 `neTypeList`（来自 `emergencySupportGisConfig`）与 `neTypeCheckList` 的同步
- **聚合点**（[详见](tab-content-1-aggregate-points.md)）：`rawNeType` 复原必须在 `pointClick` 调用前；`csFixedNum` 必须传；机房图层必须过滤；熔断 `MAX_AGGREGATE_OUTPUT` 当前被注释掉

## `flushSync` 与 setTimeout 栅栏（重点）

`onViewSetChange` 和 `onShowCircle` 采用两段式状态更新：

```ts
flushSync(() => setCirclePoints([])); // ① 同步 commit：清空聚合点
setTimeout(() => setXxx(newValue), 1); // ② 下一帧：写入新值
```

### 为什么需要栅栏

`<GisCustomCircleView>` 的渲染链路里有一处**直接 DOM 操作**（`onCircleViewMouseMove` 内）：

```ts
const div = document.getElementById(props.toolPupWindowId);
const circleWindow = document.getElementById('circleWindow');
if (div) circleWindow?.appendChild(div); // 把外部 tooltip DOM 搬进 circleWindow
```

这段代码绕过了 React 的虚拟 DOM 跟踪。如果用 `<GisCustomCircleView key={neTypeCheckList.join('|')} />` 让 key 变化触发整棵子树重挂载，React 在卸载时会按自己的虚拟树清理节点，但外部 tooltip 节点已经被搬离原父节点，真实 DOM 树与 React fiber 不一致，触发：

```
Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```

### flushSync 与 setTimeout 的分工

| 步骤                                   | 作用                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `flushSync(() => setCirclePoints([]))` | 同步 commit：`<GisCustomCircleView>` 重渲染，`<img>` 全部卸载、悬停 tooltip 关闭 |
| `setTimeout(..., 1)`                   | 把第二次 state 写入推到下一个 macrotask，避免被 React 自动批处理合并             |

两段式保证：**第一次更新（清空）的 DOM 卸载真的发生**，第二次更新（写入新值）才接着发生。React 不会去卸载任何子树，所以 `removeChild` 不会触发。

### 为什么不直接 flushSync 两次？

```ts
flushSync(() => setCirclePoints([]));
flushSync(() => setNeTypeCheckList(checkedValues)); // ❌ 这样写会被合并或顺序混乱
```

React 18 在 `flushSync` 嵌套时会试图合并相邻的同步更新，效果不稳定。`setTimeout(..., 1)` 是更稳妥的"下一帧栅栏"。

### 与 tab2 的差异

tab2（突发保障 GIS）目前**仍用旧模式**（`setCirclePoints([])` + `setTimeout`），未引入 `flushSync`。原因：tab2 仍在用 fedx-gis 原版 `CircleView`，未受直接 DOM 操作污染。如果后续 tab2 切换到 `<GisCustomCircleView>`，需要同步把这两处回调改成 `flushSync + setTimeout` 模式。

## `<GisCustomCircleView>` 自定义聚合圆组件

tab1 **没有使用** `fedx-gis` 的 `CircleView`，而是使用本地增强版 `GisCustomCircleView`，导入方式：

```ts
import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView';
```

源文件：[CircleView.tsx](web/components/ui/oss-gis/CircleView.tsx)、辅助工具 [gisCommon.ts](web/components/ui/oss-gis/gisCommon.ts)

### 相对 fedx-gis 原版的差异

| 项                     | fedx-gis 原版 `CircleView`              | `GisCustomCircleView`（本项目）                                                                     |
| ---------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 图标 baseUrl 来自      | `view.options_.imageUrl`（同 fedx-gis） | 同                                                                                                  |
| `tooltipProperty` 控制 | `visible`（antd 4）                     | `open`（antd 5，规避废弃警告）                                                                      |
| 可配置几何尺寸         | ❌ 写死 160 / 38 / 50                   | ✅ props：`circleSize` / `iconSize` / `radius`                                                      |
| `getSiteImgPath` 来源  | fedx-gis 内部实现                       | 本地 [gisCommon.ts](web/components/ui/oss-gis/gisCommon.ts)（fedx-gis 内部实现未对外暴露运行时 JS） |

### 几何 props

```ts
interface CircleProps {
    // ... 与 fedx-gis 相同 ...
    circleSize?: number; // 外层圆形容器直径，默认 160
    iconSize?: number; // 单个图标尺寸，默认 38
    radius?: number; // 图标轨道半径（容器中心到图标中心的距离），默认 50
}
```

派生量 `centerOffset = (circleSize - iconSize) / 2` 在组件内部即时计算。

### tab1 中的实际用法

```tsx
<GisCustomCircleView
    visible={true}
    source={circlePoints}
    toolPupWindowId="toolTipWindowCircle1"
    onClick={onCircleClick}
    onMouseMove={onCirclePointMove}
    tooltipProperty={{ placement: 'top' }}
    overlayStyle={{ width: 300 }}
    radius={circlePoints.length > 10 ? 100 : 60} // ← 自适应半径：点数 > 10 用大半径
/>
```

> `radius` 自适应是 tab1 特有的：聚合点 > 10 时把轨道撑大到 100，否则用默认 60，避免图标重叠。

### 注意事项

- 不要试图用 `key` prop 让 `GisCustomCircleView` 强制重挂载代替 `flushSync` 栅栏（原因见上文「flushSync 与 setTimeout 栅栏」）
- `toolPupWindowId` 仍然区分 tab：`toolTipWindowCircle1`（tab1）、`toolTipWindowCircle2`（tab2，目前未切换）

> 版本：v1.1 · 更新日期：2026-07-14
