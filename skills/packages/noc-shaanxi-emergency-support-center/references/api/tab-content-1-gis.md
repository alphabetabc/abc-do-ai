# TabContent1 GIS 专用 API（日常保障区县 / 乡镇 GIS）

日常保障 GIS 视图（`tab-content-1/components/center-gis/components/gis/index.tsx` + `detail/index.tsx`）涉及的全部接口。

- 源文件：[api.ts](web/services/emergency-support/center/api.ts)
- 使用方：
  - [tab-content-1 Gis](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx)
  - [tab-content-1 Detail/LeftGisDetail](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/detail/index.tsx)

## 总表

| 接口 | 调用方 | 响应关键字段 |
|---|---|---|
| `getEmergencySupportGisLinesApi` | Gis (dataAreaLines) | `[{ neType:'town_line', type:'line', style, points:[{longitude,latitude}] }]` |
| `getEmergencyGisTownPointApi` | Gis (dataTownNames) | `[{ neType:'town_point', points:[{isTownNamePoint, longitude, latitude, siteName, gisLevel, ...}] }]` |
| `getEmergencyNormalGisStationPointsApi` | Gis (245G/OLT/BRAS) | `Array<{ neType, points: [...] }>`（按 neType 分组） |
| `getEmergencyNormalGisTransmissionPointsApi` | Gis (传输) | 同上分组 |
| `getEmergencyNormalGisMachineryRoomPointsApi` | Gis (机房) | 同上分组 |
| `getEmergencyNormalGisSuppliesPointsApi` | Gis (应急) | 同上分组 |
| `getMiddleMapAlarmTransmissionApi` | Gis (断点光缆) | `{ lineIds: string[], azIntIds: string[] }` |
| `getMiddleMapTownSiteAlarmDataApi` | Detail 表 | `Array<{ zoneId, zoneName, siteNum, roomNum, ... }>` |
| `getEmergencySupportTownLonLatDataApi` | Detail 表 | `Array<{ zoneId, longitude, latitude, ... }>` |
| `getEmergencyGisPointDetailApi` | Gis (pointClick) | `[rows[0].alarmDetail]` |
| `getEmergencyGisPointCableDetailApi` | Gis (pointClick) | 数组 |
| `getEmergencyGisPointMachineryRoomDetailApi` | Gis (pointClick) | `[rows[0].alarmDetail]` |
| `getEmergencyGisPointTransmissionDetailApi` | Gis (pointClick) | `[rows[0].alarmDetail]` |

下面按顺序展开。

---

## 1. `getEmergencySupportGisLinesApi(zoneSelect, zoneId)`

区县 / 乡镇边界连线（日常保障）。

| 项 | 内容 |
|---|---|
| 视图项 | `emergency-town-boundary` |
| 入参 | `viewPageArgs: { ...zoneSelect, zoneId }` |
| 返回 | `Array<{ neType: 'town_line', type: 'line', style, points: [{longitude,latitude}] }>` |
| 调用方 | Gis `useRequest(dataAreaLines, ...)` |

> **同名 tab2 版本见** [tab-content-2-gis.md](tab-content-2-gis.md#1-getemergencysuddengislinesapiareaid)，响应结构不同（分组 / flag）—— 别引用错。

---

## 2. `getEmergencyGisTownPointApi(zoneSelect, zoneId)`

日常保障乡镇名称点位。

| 项 | 内容 |
|---|---|
| 视图项 | `town-latitude-and-longitude` |
| 入参 | `viewPageArgs: { ...zoneSelect, zoneId }` |
| 返回 | `[{ neType: 'town_point', points: [{ siteCode, siteName, isTownNamePoint: true, longitude, latitude, gisLevel, ... }] }]` |
| 调用方 | Gis `useRequest(dataTownNames, ...)` |

### 响应元素字段说明

| 字段 | 来源 | 用途 |
|---|---|---|
| `siteCode` | index in rows | 标识唯一 |
| `siteName` | `item.label` | Tooltip / 钻入显示 |
| `neTypeName` | `item.cityName` | Tooltip 副标题 |
| `isTownNamePoint` | `true` | 标记为乡镇名点位（Gis.onPointClick 用此字段判断是否下钻） |
| `longitude`, `latitude` | 后端 | 屏幕坐标 |
| `gisLevel` | 数字 | 钻入时的 `setMapZoom` 值 |

### 点位转换为乡镇坐标

在 `Gis.onPointClick` 中：

```ts
if (point.isTownNamePoint) {
    const obj = {
        zoneId: point.siteName,           // ← 注意：用 siteName 当 zoneId
        longitude: point.longitude,
        latitude: point.latitude,
        gisLevel: point.gisLevel || 13,
    };
    drillTownZone(obj);
}
```

---

## 3. `getEmergencyNormalGisStationPointsApi(zoneSelect, viewPageArgs, isAlarm, areaId?)`

245G / OLT / BRAS 通用打点（**日常 + 突发都用**）。

| 项 | 内容 |
|---|---|
| URL | `EmergencySupport/middleMapPointStation` |
| 方法 | POST（**裸 `request`**） |
| 入参 | `{ ...zoneSelect, ...viewPageArgs, zoneLevel: String(...), isAlarm, areaId }` |
| 返回 | `Array<{ neType: '201'|'3201'|'8104'|'900'|'2011', points: any[] }>`（5 个固定 neType，空数组兜底） |
| 调用方 | Gis (两个版本)、tab1 detail 不调用 |

### neType → 含义

| neType | 含义 |
|---|---|
| `201` | 2G 基站 |
| `3201` | 4G 基站 |
| `8104` | 5G 基站 |
| `900` | BRAS |
| `2011` | OLT |

### 响应元素（point）

```ts
{
    ...原始字段,
    type: 'point',
    neType: item.objectClass,       // '201'|'3201'|...
    siteCode: item.int_id,
    siteName: item.userlabel,
    neTypeName: item.objectClass,
    alarmLevel: item.isAlarm,
}
```

### 错误兜底

无数据时返回 5 组 `{neType, points:[]}`，**不要期待空数组**，否则下游 `filter` 会有问题。

---

## 4. `getEmergencyNormalGisTransmissionPointsApi(zoneSelect, viewPageArgs, isAlarm, repairIntId, repairLevel, areaId?)`

传输打点（4 个 neType）。

| 项 | 内容 |
|---|---|
| URL | `EmergencySupport/middleMapPointTransmission` |
| 方法 | POST |
| 入参 | `{ ...zoneSelect, ...viewPageArgs, areaId, zoneLevel:String(...), isAlarm, intId: repairIntId || '', repairLevel }` |
| 返回 | `Array<{ neType: '2008'|'2009'|'7111'|'2034', points: any[] }>` |
| 兜底 | 4 组空数组 |

### neType 含义

| neType | 含义 |
|---|---|
| `2008` | 传输 |
| `2009` | 传输 |
| `7111` | 传输 |
| `2034` | 传输 |

> 这 4 个 neType 在 `pointClick` switch 全部归到「传输」Tab。

### 响应 point 字段

```ts
{
    ...原始,
    type: 'point',
    neType: item.objectClass,
    siteCode: item.int_id,
    siteName: item.userlabel,
    neTypeName: item.objectClass,
    alarmLevel: `${Number(item.repairLevel) || ''}${item.isAlarm}`,  // 拼接
    isTransmission: true,                                              // 标记
}
```

> `alarmLevel` 是「抢修等级 + 告警级别」拼接字符串。

---

## 5. `getEmergencyNormalGisMachineryRoomPointsApi(zoneSelect, viewPageArgs, repairIntId, repairLevel, areaId?)`

机房打点（6 个 neType）。

| 项 | 内容 |
|---|---|
| URL | `EmergencySupport/middleMapPointMachineryRoom` |
| 方法 | POST |
| 入参 | `{ ...zoneSelect, ...viewPageArgs, areaId, zoneLevel:String(...), isAlarm:'0,1', intId:repairIntId||'', repairLevel }` |
| 返回 | `Array<{ neType: '10005'|'1000501'|'1000502'|'1000503'|'1000504'|'1000505', points: any[] }>` |
| 兜底 | 6 组空数组 |

### neType 含义

| neType | 含义 |
|---|---|
| `10005` | 动环（汇总） |
| `1000501`–`1000505` | 动环子类型 |

### 响应 point 字段

```ts
{
    ...原始,
    type: 'point',
    neType: item.objectClass,
    siteCode: item.int_id,
    siteName: item.userlabel,
    neTypeName: item.objectClass,
    alarmLevel: `${Number(item.repairLevel) || ''}${item.isAlarm}`,
    isMachineryRoom: true,
}
```

> `isMachineryRoom: true` 在 `pointClick` 分支判断中使用，决定走「机房详情」接口。

---

## 6. `getEmergencyNormalGisSuppliesPointsApi(zoneSelect, viewPageArgs, areaId?)`

应急物资打点。

| 项 | 内容 |
|---|---|
| URL | `EmergencySupport/middleMapPointSupplies` |
| 方法 | POST |
| 入参 | `{ ...zoneSelect, ...viewPageArgs, areaId, zoneLevel:String(...) }` |
| 返回 | `Array<{ neType: '10020'|'10021'|'10026'|'10029'|'10036'|'10037', points: any[] }>` |
| 兜底 | 6 组空数组 |

### neType 含义

| neType | 含义 |
|---|---|
| `10020`, `10021` | 应急物资类型 1/2 |
| `10026`, `10029` | 类型 3/4 |
| `10036`, `10037` | 类型 5/6 |

> 应急物资点击不进右屏 `pointClick`（在 `onPointClick` 里 `pointClickNeTypes` 没有包含这些类型），只显示基础 Tooltip。

---

## 7. `getMiddleMapAlarmTransmissionApi(viewPageArgs, repairIntId, areaId?)`

断点光缆数据（**日常 + 突发都用**）。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-alarm-transmission` |
| 入参 | `viewPageArgs: { ...zoneSelect, ...dateTimeSelect, eqpIntId: repairIntId || '', areaId }` |
| 返回 | `{ lineIds: string[], azIntIds: string[] }` |
| 兜底 | `{ lineIds: [], azIntIds: [] }` |

### 数据流向

```ts
const viewItemData = get(res, 'data.viewItemData');
const lineIds = viewItemData?.cableSectionList?.map((item) => item.cableSection) || [];
const azIntIds = viewItemData?.intIdList?.map((item) => item.intId) || [];
```

传给 `OpticalCableGis`：

```tsx
<OpticalCableGis
    onPointClick={onOpticalCablePointClick}
    lineIds={opticalState.lineIds}
    azIntIds={opticalState.azIntIds}
    isShowLayer={opticalState.showOpticalCableGis}
/>
```

`OpticalCableGis` 内部再用 `lineIds` / `azIntIds` 调用 `transGisMap/getSegment`、`viewItemId: 'node-office-alarm'`、`viewItemId: 'cable-port'` 等等后端查询。

---

## 8. `getMiddleMapTownSiteAlarmDataApi(viewPageArgs)`

`LeftGisDetail` 表里用的乡镇告警数据。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-town-site-alarm` |
| 入参 | `viewPageArgs: { statisticItemId, selectDims, dimMergeGroups, indexIds, flowIndexConfig, associatedField:'provinceId,regionId,cityId,township', zoneId, workTeamTimeInfo, startTime, endTime }` |
| 返回 | `Array<{ zoneId: item.township, zoneName: item.township, siteNum, roomNum, twoGNum, fourGNum, fiveGNum, oltNum, brasNum, powerOffNum, electricNum, cellDescription }>` |

> `cellDescription` 保留原值，`useRequest` key 是 `cellDescription`。

### Detail 表里列

```
columns = [
    { title:'乡镇', dataIndex:'zoneName' },
    { title:'基站退服', dataIndex:'siteNum', format:`${twoG}/${fourG}/${fiveG}` },
    { title:'机房', dataIndex:'roomNum', format:`${powerOff}/${electric}` },
    { title:'传输', dataIndex:'alarmNum' },
    { title:'BRAS', dataIndex:'brasNum' },
    { title:'OLT', dataIndex:'oltNum' },
]
```

### 校验逻辑

```ts
ready: isDefined(drillZone.zoneId) && isDefined(drillZone.zoneLevel),
```

> 依赖 `drillZone` 完整透传。

---

## 9. `getEmergencySupportTownLonLatDataApi(viewPageArgs)`

`LeftGisDetail` 表点击乡镇行时下钻用——拿乡镇经纬度。

| 项 | 内容 |
|---|---|
| 视图项 | `emergency-support-town-lon-and-lat` |
| 入参 | `viewPageArgs: { zoneId: drillZone?.cityId }` |
| 返回 | `Array<{ zoneId, longitude, latitude, ... }>` |

### Detail 中怎么用

```ts
const obj = dataTownLonLat?.find((item) => item.zoneId === zoneId) || dataTownLonLat[0];
if (obj) {
    props.drillTownZone(obj);
    props.dispatch(widgetFields.getField('zoneSelect'), {
        ...props.drillZone,
        zoneLevel: ZoneLevelEnum.town,
        zoneId: zoneId,
    });
    props.dispatch(widgetFields.getField('zoneTownSelect'), {
        zoneLevel: ZoneLevelEnum.town,
        zoneId: zoneId,
    });
}
```

---

## 10. `getEmergencyGisPointDetailApi(objectClass, intId)`

网元基础详情（用于 `pointClick` 走默认分支：neType 不在 `tab1.Gis.pointClick` switch 例外列表中）。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-alarm-detail-station` |
| 入参 | `viewPageArgs: { objectClass, intId }` |
| 返回 | `[rows[0].alarmDetail]`（**数组包裹一个对象**） |

> ⚠️ 注意 `rows.data` 多一层。这是详情类接口的固定格式，详见 [`getEmergencyGisPointMachineryRoomDetailApi`](#11-getemergencygispointmachineryroomdetailapiobjectclass-intid)。

---

## 11. `getEmergencyGisPointCableDetailApi(viewPageArgs)`

断点光缆详情。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-alarm-detail-cable` |
| 入参 | `viewPageArgs: { cableSection: point.intId, ...dateTimeSelect }` |
| 返回 | `rows` 数组（**没有再包 `.alarmDetail`**） |

> 与其他 `*DetailApi` 不同，断点光缆详情返回结构是平的。

---

## 12. `getEmergencyGisPointMachineryRoomDetailApi(objectClass, intId)`

机房详情。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-alarm-detail-machinery-room` |
| 返回 | `[rows[0].alarmDetail]` |

---

## 13. `getEmergencyGisPointTransmissionDetailApi(type, intId)`

传输详情。

| 项 | 内容 |
|---|---|
| 视图项 | `middle-map-alarm-detail-transmission` |
| 入参 | `viewPageArgs: { type, intId }`（注意这里是 `type` 不是 `objectClass`） |
| 返回 | `[rows[0].alarmDetail]` |

---

## 详情接口统一选择逻辑

`pointClick` 根据点的属性选择不同接口：

```ts
const data = point.isOpticalCable
    ? await getEmergencyGisPointCableDetailApi({ cableSection: point.intId, ...dateTimeSelect })
    : point.isMachineryRoom
      ? await getEmergencyGisPointMachineryRoomDetailApi(point.neType, point.siteCode)
      : point.isTransmission
        ? await getEmergencyGisPointTransmissionDetailApi(point.isAlarm, point.siteCode)
        : await getEmergencyGisPointDetailApi(point.neType, point.siteCode);

if (isEmpty(data)) return;  // ← 关键，没有数据时直接返回，不派发右屏
```

> 这意味着任何一个详情接口失败都不会报错到 UI，只会静默不派发右屏，调试时记得看 console。

> 版本：v1.0 · 创建日期：2026-07-13
