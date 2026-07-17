# TabContent2 · Gis（突发保障 GIS 实际渲染）

底层 GIS 渲染。与日常保障 GIS 类似但有几处关键差异：

- 无乡镇名图层（`dataTownNames`）
- **有区域配置**：4 个区域可切换 + Modal 配置
- 抢修回流路径：直接聚焦告警网元（不经过乡镇回流）
- `pointClick` 没有动环 neType 子分支（`'1000501'`–`'1000505'` 会落到 default）

- 源文件：[gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx)

> 父组件：[center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/index.tsx)

## 职责

1. 加载 7 类数据图层（区域配置、区域线、应急物资、机房、传输、基站、故障断点光缆）
2. **区域配置**：从 `getEmergencySuddenGisAreaApi` 拉区域列表，最多展示 4 个
3. 区域选中 → 设置 `currentArea`，触发所有图层的 `useRequest`
4. 抢修回流（`leftRepairNoticeParams?.intId`）
5. 网元点击 → 派发右屏

## State 总览（与 tab1 比，多了区域相关）

```ts
const [neTypeCheckList, setNeTypeCheckList] = useState<any>(suddenNeTypeCheckList);
const [stationTypeCheckList, setStationTypeCheckList] = useState('0,1');
const [transmissionTypeCheckList, setTransmissionTypeCheckList] = useState('0,1,2');
const [circlePoints, setCirclePoints] = useState<any>([]);
const [circleTooltipSource, setCircleTooltipSource] = useState<any>([]);
const [circleTooltipStyle, setCircleTooltipStyle] = useState<any>();
const [tooltipSource, setTooltipSource] = useState<any>();
const [tooltipStyle, setTooltipStyle] = useState<any>();
// ★ 区域相关
const [currentArea, setCurrentArea] = useState<any>(null);
const [dataFilterArea, setDataFilterArea] = useState<any>(null);
const [showAreaSetting, setShowAreaSetting] = useState<any>(false);
const [areaSettingCheckList, setAreaSettingCheckList] = useState<any>(null);
const [refAreaData, setRefAreaData] = useState<any>(true);
const [showLegend, setShowLegend] = useState<any>(false);
const [opticalState, setOpticalState] = useSetState({
    showOpticalCableGis: false, lineIds: null, azIntIds: null,
});
const [transRepairLevel, setTransRepairLevel] = useState('-1');
const [machineryRoomRepairLevel, setMachineryRoomRepairLevel] = useState('-1');
```

## 7 类 useRequest

| key | API | ready 条件 |
|---|---|---|
| `dataAreaSetting` | `getEmergencySuddenGisAreaApi()` | `currentTabType === tab2` |
| `dataAreaLines` | `getEmergencySuddenGisLinesApi(currentArea?.areaId)` | `tab2 && isDefined(currentArea)` |
| `dataStationPointsAll` | `getEmergencyNormalGisStationPointsApi({}, {...dateTimeSelect}, '0,1', currentArea?.areaId)` | `tab2 && isDefined(currentArea) && !leftRepairNoticeParams?.intId` |
| `dataTransmissionPointsAll` | `getEmergencyNormalGisTransmissionPointsApi({}, {...dateTimeSelect}, '0,1,2', leftRepairNoticeParams?.intId, transRepairLevel, currentArea?.areaId)` | `tab2 && isDefined(currentArea)` |
| `dataMachineryRoomPointsAll` | `getEmergencyNormalGisMachineryRoomDataApi({}, {...dateTimeSelect}, leftRepairNoticeParams?.intId, machineryRoomRepairLevel, currentArea?.areaId)` | `tab2 && isDefined(currentArea)` |
| `dataSuppliesPointsAll` | `getEmergencyNormalGisSuppliesPointsApi({}, {...dateTimeSelect}, currentArea?.areaId)` | `tab2 && isDefined(currentArea) && !leftRepairNoticeParams?.intId` |
| `dataOpticalCable` | `getMiddleMapAlarmTransmissionApi({...dateTimeSelect}, leftRepairNoticeParams?.intId, currentArea?.areaId)` | `tab2 && opticalState.showOpticalCableGis && isDefined(currentArea)` |

> 注意：tab2 的所有业务图层请求都**不传 `zoneSelect`**，只传 `currentArea.areaId`。

## 区域选中 / 切换 / 配置

### 区域初始化 useEffect

```ts
useEffect(() => {
    if (dataAreaSetting) {
        const list = dataAreaSetting?.filter((item) => item.isSelected === 'true');
        const newData = list?.map((item) => ({ ...item, selected: list[0]?.areaId === item.areaId }));
        setDataFilterArea(newData?.slice(0, 4)); // 只取前 4 个
        setCurrentArea(list[0]);
        if (props.leftRepairNoticeParams) {
            props.dispatch(widgetFields.getField('leftRepairNoticeParams'), '');
        }
    }
}, [dataAreaSetting]);
```

### 切换区域

```ts
const changCurrentArea = (area) => {
    const newData = dataFilterArea?.map((item) => ({ ...item, selected: area?.areaId === item.areaId }));
    setTimeout(() => {
        setDataFilterArea(newData);
        setCurrentArea(area);
        if (leftRepairNoticeParams) props.dispatch(widgetFields.getField('leftRepairNoticeParams'), '');
    }, 1000);
};
```

> `setTimeout(1000)` 是为了配合区域切换的视觉过渡。

### 区域配置保存

```ts
const handleAreaSettingOK = () => {
    Modal.confirm({
        title: '是否保存区域名称显示设置？',
        onOk: () => {
            insertEmergencySuddenGisAreaApi(areaSettingCheckList?.join(',')).then((res) => {
                if (res) {
                    message.success('保存成功！');
                    setShowAreaSetting(false);
                    setRefAreaData(!refAreaData); // 刷新
                } else {
                    message.error('保存失败！');
                }
            });
        },
    });
};
```

`onAreaSettingChange` 限制最多 4 个：`message.info('最多只能选择4个区域！');`

### 区域选中后，地图聚焦

```ts
useEffect(() => {
    if (currentTabType === TabChangeEnum.tab2 && currentArea) {
        if (currentArea?.longitude && currentArea?.latitude) {
            setMapCenter([Number(currentArea?.longitude), Number(currentArea?.latitude)]);
        }
        if (currentArea?.gisLevel) setMapZoom(Number(currentArea?.gisLevel));
        if (currentArea?.areaId) props.dispatch(widgetFields.getField('centerAreaId'), currentArea?.areaId || '');
    }
}, [currentTabType, currentArea]);
```

> 派发 `centerAreaId` 给上层，AI 智能问答会用到。

## 网元点击 (pointClick)

与 tab1 差别：

```ts
case '10005':    // 注意 tab1 是 '10005', '1000501'–'1000505'
case '900':      // BRAS
case '2011':     // OLT
default:         // 传输 + 清空 zoneParams
```

> ⚠️ tab2 的 switch 没有 `case '1000501': case '1000502': ...`，所有动环 neType（`'1000501'`–`'1000505'`）会落到 default。需要时同步增加。

并且 tab2 的 `onPointClick` 没有处理 `point.isTownNamePoint` 的分支（也不应有此分支）。

## 抢修回流

```ts
const onBackClick = () => {
    props.dispatch(widgetFields.getField('leftRepairNoticeParams'), '');
};
```

回流按钮**只在 `leftRepairNoticeParams` 存在时显示**：

```tsx
{props.leftRepairNoticeParams && (
    <Tooltip title="返回上一层">
        <div className="back" onClick={onBackClick} />
    </Tooltip>
)}
```

抢修切换图例和地图聚焦逻辑与 tab1 类似：

```ts
useEffect(() => {
    if (leftRepairNoticeParams?.intId) setNeTypeCheckList(repairCheckList);
    else setNeTypeCheckList(suddenNeTypeCheckList);
}, [leftRepairNoticeParams]);
```

## 区域配置 Modal

```tsx
<Modal
    width={250}
    open={showAreaSetting}
    maskClosable={false}
    mask={false}
    title={'区域配置'}
    onClose={() => setShowAreaSetting(false)}
    onOk={handleAreaSettingOK}
    destroyOnClose
    onCancel={() => setShowAreaSetting(false)}
    style={{ top: '125px', left: '550px' }}
    bodyStyle={{ height: '200px', overflowY: 'auto' }}
>
    <Checkbox.Group value={areaSettingCheckList} onChange={onAreaSettingChange}>
        {dataAreaSetting?.map((item) => (
            <Checkbox style={{ margin: 5 }} value={item.areaId}>{item.areaName}</Checkbox>
        ))}
    </Checkbox.Group>
</Modal>
```

## 容器 id 与 Tooltip 节点

```tsx
<div className="emergency-support-center-sudden-gis-map-container" id="emergency-gis-map2">
```

```tsx
<div id="toolTipWindow2">...</div>
<div id="toolTipWindowCircle2">...</div>
```

> 后缀 `2` 用以和 tab1 的 `toolTipWindow / toolTipWindowCircle1` 区分。**保留**。

## className

- 根：`emergency-support-center-sudden-gis-map-container`
- 区域面板遮罩：`.banner-mask`
- 区域面板：`.area`，含 `.area-content` `.child` `.child-selected` `.title` `.title-selected`
- 区域配置入口按钮：`.area-setting`
- 图例相关：`.legend-title` `.legend-title-hidden` `.legend-group` `.legend-name`
- 抢修回流按钮：`.back`

## 易踩坑

- tab2 没有 `zoneSelect`，所有业务图层请求的入参都直接是 `{}` + `currentArea.areaId`
- 区域相关状态有 7 个：`currentArea / dataFilterArea / showAreaSetting / areaSettingCheckList / refAreaData / dataAreaSetting / dataAreaLines`，加区域配置相关逻辑时请同步看这一组
- `changCurrentArea` 中的 `setTimeout(1000)` 是刻意的，不要删除
- `pointClick` 的 switch 没有动环 neType 子分支（`1000501`-`1000505`），需要时同步加，不要依赖 default
- `insertEmergencySuddenGisAreaApi` 是写接口，调用后用 `setRefAreaData(!refAreaData)` 触发刷新，**不要直接刷新 `dataAreaSetting`**
- 区域切换会清空 `leftRepairNoticeParams`（派发 `''`），注意顺序：`changCurrentArea` 内最后才清
- `GisLegend` 是从 tab1 的目录复用的（`../../../../../tab-content-1/components/center-gis/components/gis-legend`），不要重复实现

> 版本：v1.0 · 创建日期：2026-07-13
