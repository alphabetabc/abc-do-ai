# VectorLayer

中屏 GIS 出现频次最高的组件。封装 OL VectorLayer，接收打点 / 连线 source 和样式 + 交互回调。

- 类型：[VectorLayer.d.ts](node_modules/fedx-gis/dist/components/layers/VectorLayer.d.ts)

## Props（实际用到）

```ts
interface VectorLayerProps {
    id?: string; // ← DOM / OL layer id，必须全局唯一
    zIndex?: number; // ← 叠放顺序；越大越上面
    pointStyleType?: 'IMG' | 'POINT';
    pointStyle?: PointStyle; // ← 点位样式（按 neType 也可覆盖）
    source?: any[]; // ← 数据源，详见下方
    onClick?: (point) => void;
    onShowCircle?: (pointArr) => void; // ← 聚合显示圆圈，传给 CircleView
    onMove?: (e) => void; // ← 鼠标移动到点
    onDoubleClick?: (e) => void;
    onClickOther?: () => void; // ← 点击非点位空白处
    singlePopupVisible?: boolean;
    popupParam?: PopupParam;
    csFixedNum?: number;
    isDrawing?: boolean;
    isSetLocation?: boolean;
    onSetLocation?: any;
    isShowTitle?: boolean;
    isShowSamePoint?: boolean; // ← 是否叠加重合点
    isGongZhanByType?: boolean; // ← 是否按 neType 分组渲染
    isMassData?: boolean; // ← 大数据模式
    // 我们没用：
    isShowAnimation?;
    AnimationParam?;
    isShowSelStatus?;
    isHideLineTip?;
    isShowInCommon?;
    misplacement?;
    onRightClick?;
    onMouseOver?;
    onMouseOut?;
    onMoveEnd?;
    singlPopupParam?;
    isShowTrackAnimation?;
    isCluster?;
    isShowBadge?;
}
```

## source 结构（按 neType 分组）

所有业务打点接口（`getEmergencyNormalGis*PointsApi`）返回的都是这个结构：

```ts
Array<{
    neType: '201' | '3201' | '8104' | '900' | '2011' | '10005' | '1000501' | ...,
    points: Array<{
        type: 'point',
        neType: string,           // 单点的 neType = 上层 neType
        siteCode: string,         // int_id
        siteName: string,         // 显示名
        alarmLevel: string,       // '0', '1', '01', '11', '102' ...
        longitude: number,
        latitude: number,
        // 可选：
        isMachineryRoom?: boolean,    // 机房标记
        isTransmission?: boolean,     // 传输标记
        isOpticalCable?: boolean,     // 断点光缆标记（来自 OpticalCableGis）
        isTownNamePoint?: boolean,    // 乡镇名（仅 getEmergencyGisTownPointApi）
        isAlarm?: '0' | '1',          // 原始告警位
    }>,
}>
```

> 连线数据（`getEmergencySupportGisLinesApi` / `getEmergencySuddenGisLinesApi`）也用这套格式：
>
> ```ts
> { neType: 'town_line' | 'area_line0' ..., type: 'line', style: { color, width, showImg }, points: [{longitude, latitude}] }
> ```

## 我们用到的 props 子集

| prop                       | tab1 典型值                                                                                                                                 | tab2 典型值                 | 说明                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------- |
| `id`                       | `layerAreaLines` / `layerTownNames` / `layerSuppliesPoints` / `layerMachineryRoomPoints` / `layerTransmissionPoints` / `layerStationPoints` | 同步但少了 `layerTownNames` | 全局唯一                                                       |
| `zIndex`                   | 1000-1003                                                                                                                                   | 1000-1003                   | 应急 1000 < 机房 1001 < 传输 1002 < 基站 1003                  |
| `isDrawing`                | `false`                                                                                                                                     | `false`                     | 必须 false，否则进入 OL 编辑模式                               |
| `isShowTitle`              | `false`                                                                                                                                     | `false`                     | 关闭 OL 默认 tooltip（我们自己用 ElTooltipBase）               |
| `isShowSamePoint`          | `false`                                                                                                                                     | `false`                     | 重合点不堆叠显示                                               |
| `isGongZhanByType`         | `true`                                                                                                                                      | `true`                      | 按 neType 分组（按 neType 渲染不同样式）                       |
| `isMassData`               | （仅基站 layer）`false`                                                                                                                     | （同上）                    | 是否走 OL 聚合渲染，目前不依赖                                 |
| `csFixedNum`               | `emergencySupportGisConfig.csFixedNum`                                                                                                      | 同上                        | 坐标精度                                                       |
| `onClick`                  | `onPointClick`                                                                                                                              | 同                          | 详见 [tab-content-1-gis-full.md](../tab-content-1-gis-full.md) |
| `onShowCircle`             | `onShowCircle`                                                                                                                              | 同                          | 站点聚合显示                                                   |
| `onMove`                   | `onPointMove`                                                                                                                               | 同                          | 鼠标移动                                                       |
| `onClickOther`             | `onClickOther`                                                                                                                              | 同                          | 点击空白                                                       |
| `popupParam.containerName` | `toolTipWindow`                                                                                                                             | `toolTipWindow2`            | 对应外层 Tooltip div 的 id                                     |
| `pointStyle`               | `{ fontSize, fontWeight, fontFamily, offset, fontColor, fontBackColor, scale }`                                                             | 同                          | 点位的默认样式                                                 |

## popupParam 结构

```ts
interface PopupParam {
    containerName: string; // ← 关键：DOM id，对应外层 <div id="...">{tooltip}</div>
    offset: number[]; // [x, y]
    duration: number; // 0 = 不自动关闭
    position: string; // 'top-left' 等
}
```

> ⚠️ 改 `containerName` 时务必同步修改外层 `<div id>` 的 id。

## 常用回调入参

### onClick(point)

```ts
// 来自打点接口的 point
{
    type: 'point',
    neType: string,           // '201' | ...
    siteCode: string,         // int_id
    siteName: string,
    alarmLevel: string,
    longitude: number,
    latitude: number,
    // 业务标记
    isMachineryRoom?: boolean,
    isTransmission?: boolean,
    isOpticalCable?: boolean,
    // 来源标记
    isTownNamePoint?: boolean,
}
```

### onMove(e)

```ts
{ type: 'point', neType, siteCode, longitude, latitude, ... }
```

### onClickOther()

无入参。

### onShowCircle(pointArr)

point 数组（聚合后），传给 `CircleView` 的 `source` 用。

## `alarmLevel` → 图标自动匹配（`isGongZhanByType` 核心机制）

当 `VectorLayer` 设置 `isGongZhanByType={true}` 时，fedx-gis 会**自动根据每个点的 `neType` + `alarmLevel` 字段拼接图标路径**并渲染。

### 图标路径拼接规则

```
${constants.IMAGE_PATH}/emergency-support/map/{neType}/{alarmLevel}.png
```

例如 `neType='1000502'`、`alarmLevel='11'` → 加载 `map/1000502/11.png`。

### `alarmLevel` 构造

`alarmLevel` 的值由后端 API 层在 [api.ts#L1017](web/services/emergency-support/center/api.ts#L1017) 和 [api.ts#L1101](web/services/emergency-support/center/api.ts#L1101) 构造：

```ts
alarmLevel: `${Number(item.repairLevel) || ''}${item.isAlarm}`;
```

即 **抢修等级 + 告警状态** 拼接成一个数字作为文件名。

### 文件名编码规则

| 文件名           | `repairLevel`（十位） | `isAlarm`（个位） | 含义                                   |
| ---------------- | --------------------- | ----------------- | -------------------------------------- |
| `0.png`          | 0                     | 0                 | 正常，无告警                           |
| `9.png`          | —                     | —                 | 通用告警（无抢修等级信息时的默认图标） |
| `11.png`         | 1级                   | 告警(1)           | 1级抢修 + 告警                         |
| `21.png`         | 2级                   | 告警(1)           | 2级抢修 + 告警                         |
| `31.png`         | 3级                   | 告警(1)           | 3级抢修 + 告警                         |
| `41.png`         | 4级                   | 告警(1)           | 4级抢修 + 告警                         |
| `1.png`          | —                     | 告警(1)           | 无抢修等级 + 告警                      |
| `gongzhan0.png`  | 0                     | 0                 | 在岗状态 - 正常                        |
| `gongzhan1.png`  | —                     | 告警(1)           | 在岗状态 - 告警                        |
| `gongzhan11.png` | 1级                   | 告警(1)           | 在岗状态 - 1级抢修告警                 |
| `gongzhan21.png` | 2级                   | 告警(1)           | 在岗状态 - 2级抢修告警                 |
| `gongzhan31.png` | 3级                   | 告警(1)           | 在岗状态 - 3级抢修告警                 |
| `gongzhan41.png` | 4级                   | 告警(1)           | 在岗状态 - 4级抢修告警                 |

> 十位 = 抢修等级（1-4），个位 = 告警状态（0=正常, 1=告警）。`gongzhan*` 系列用于"在岗状态"场景。

### 适用的图层

以下 VectorLayer 均使用 `isGongZhanByType={true}`，`alarmLevel` 决定图标：

| 图层 id                    | 数据来源                                      | neType 范围                                                                                               |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `layerMachineryRoomPoints` | `getEmergencyNormalGisMachineryRoomPointsApi` | `10005`, `1000501`–`1000505`（机房类）                                                                    |
| `layerTransmissionPoints`  | `getEmergencyNormalGisTransmissionPointsApi`  | `2008`(WDM), `2009`(PTN), `7111`(SPN), `2034`(OTN)（传输类）                                              |
| `layerStationPoints`       | `getEmergencyNormalGisStationPointsApi`       | `201`(2G), `3201`(5G), `8104`(4G), `900`(BRAS), `2011`(OLT)（基站类，仅用 `isAlarm`，不用 `repairLevel`） |
| `layerSuppliesPoints`      | `getEmergencyNormalGisSuppliesPointsApi`      | `10020`–`10037`（应急物资）                                                                               |
| `layerAggregatePoints`     | `buildAggregatedPoints` 聚合结果              | 跨 neType 聚合                                                                                            |

### 抢修等级筛选与图标联动

GIS 图例中有"推荐抢修等级"下拉选择框（`machineryRoomRepairLevel` / `transRepairLevel`），当选择特定等级时，后端返回的打点数据会过滤到对应抢修等级，此时 `alarmLevel` 的十位就是该等级，加载对应图标。选择"全部"（`-1`）时，返回所有等级数据。

## 与 gisFunc.showLayer 配合

```ts
const layerParam = neTypeList.map((item) => ({
    neType: item,
    isShow: neTypeCheckList.indexOf(item) >= 0,
}));
gisFunc.showLayer(map, layerParam);
```

> VectorLayer 的 source 中每个 neType 的 `isShow` 由 `gisFunc.showLayer` 的入参 `layerStates` 控制（按 neType 取）。

## 易踩坑

- **`isDrawing: false`** 是必须的；否则地图进入编辑模式
- **`isGongZhanByType: true`** 让 OL 把每个 neType 当一组；数据必须按 source 顶层 neType 分好组
- **`zIndex`** 大的在上：基站 1003 > 传输 1002 > 机房 1001 > 应急 1000。这样小点压在大点之下
- **`source`** 必须是非空数组；空数组 OL 会忽略图层
- 别忘了导入 `fedx-gis/dist/gis-2d.css`，否则 popup 定位会错位
- `id` 必须全局唯一，重复 id 会让 `gisFunc.getLayerById` 取错图层

> 版本：v1.1 · 更新日期：2026-08-05（新增「`alarmLevel` → 图标自动匹配」章节）
