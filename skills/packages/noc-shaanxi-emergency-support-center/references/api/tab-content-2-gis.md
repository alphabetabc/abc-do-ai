# TabContent2 GIS 专用 API（突发保障区域 GIS）

突发保障 GIS 视图（`tab-content-2/components/center-gis/components/gis/index.tsx`）涉及的接口。

- 源文件：[api.ts](web/services/emergency-support/center/api.ts)
- 使用方：[tab-content-2 Gis](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx)

## 与 Tab1 接口的差异

| 项 | tab1 日常保障 | tab2 突发保障 |
|---|---|---|
| `zoneSelect` 入参 | **有**（`{...zoneSelect}`） | **空** `{}` |
| 区域参数 | 无 | `areaId` |
| 区县连线 | `getEmergencySupportGisLinesApi(zoneSelect, zoneId)` | `getEmergencySuddenGisLinesApi(areaId)` |
| 乡镇连线 | `getEmergencyGisTownPointApi` | **不调用** |
| 其他 5 类打点 | 调用 | 调用，但入参用 `{}` 代 `zoneSelect` + `areaId` |
| 详情接口 | `getEmergencyGisPointDetailApi` 等 | 同 tab1，**但 `pointClick` switch 没有 `'1000501'–'1000505'` 动环分支** |

下面只列出 tab2 独有的接口；和 tab1 重用的接口请参考 [tab-content-1-gis.md](tab-content-1-gis.md)。

---

## 1. `getEmergencySuddenGisLinesApi(areaId)`

突发保障区域边界连线。

| 项 | 内容 |
|---|---|
| 视图项 | `unexpected-coverage-area-lines` |
| 入参 | `viewPageArgs: { areaId }` |
| 返回 | `[{ neType:'area_line0' \| 'area_line1' ..., type:'line', style:{color:'#0F1090', width:3, showImg:false}, points:[{longitude,latitude}] }]` |
| 兜底 | `[{ neType:'area_line', type:'line', points: [] }]` |

### 与 tab1 `getEmergencySupportGisLinesApi` 关键差异

| 项 | tab1 (`town_line`) | tab2 (`area_line0...`) |
|---|---|---|
| 分组方式 | 按 `townName` 去重 | 按 `flag === '1'` 切分多组 |
| 线宽 | 1.5 | 3 |
| 颜色 | `#0F1090` | `#0F1090` |
| 兜底返回 | `[]` | `[{ neType:'area_line', points:[] }]`（注意兜底不是空数组） |

> ⚠️ 兜底返回结构不同会让消费方出错：tab2 的兜底返回是 1 个对象（neType 写成 'area_line' 而非 'area_line0'），调用方需要兼容。

---

## 2. `getEmergencySuddenGisAreaApi()`

突发保障区域列表（区域配置 / 区域名筛选）。

| 项 | 内容 |
|---|---|
| 视图项 | `unexpected-coverage-area` |
| 入参 | `viewPageArgs: {}` |
| 返回 | `Array<{ areaId, areaName, isSelected: 'true' \| 'false', longitude?, latitude?, gisLevel? }>` |
| 调用方 | Gis `useRequest(dataAreaSetting, ...)`（`refreshDeps: [refAreaData]`） |

### 区域初始化 effect

```ts
useEffect(() => {
    if (dataAreaSetting) {
        const list = dataAreaSetting?.filter((item) => item.isSelected === 'true');
        const newData = list?.map((item) => ({ ...item, selected: list[0]?.areaId === item.areaId }));
        setDataFilterArea(newData?.slice(0, 4));
        setCurrentArea(list[0]);
        if (props.leftRepairNoticeParams) {
            props.dispatch(widgetFields.getField('leftRepairNoticeParams'), '');
        }
    }
}, [dataAreaSetting]);
```

> `isSelected === 'true'` 是**字符串**比较，不要写成布尔判断。

---

## 3. `insertEmergencySuddenGisAreaApi(areaId)`

保存区域配置（**写接口**）。

| 项 | 内容 |
|---|---|
| 视图项 | `insert-unexpected-coverage-area` |
| 入参 | `viewPageArgs: { areaId: 'xxx,yyy,zzz' }`（**逗号分隔字符串**） |
| 返回 | `boolean`（`res.code === 200` 时为 true，否则 false） |

### 调用方

```tsx
<Modal title="是否保存区域名称显示设置？" onOk={handleAreaSettingOK}>
    ...
</Modal>
```

```ts
const handleAreaSettingOK = () => {
    Modal.confirm({
        title: `是否保存区域名称显示设置？`,
        onOk: () => {
            insertEmergencySuddenGisAreaApi(areaSettingCheckList?.join(',')).then((res) => {
                if (res) {
                    message.success('保存成功！');
                    setShowAreaSetting(false);
                    setRefAreaData(!refAreaData);   // ← 通过 refAreaData 触发 dataAreaSetting 重新请求
                } else {
                    message.error('保存失败！');
                }
            });
        },
    });
};
```

### 易踩坑

- 入参是 `areaId.join(',')`，**不是数组**
- 成功后用 `setRefAreaData(!refAreaData)` 刷新区域列表；不要手动 `useRequest.refresh()`
- 超过 4 个区域时 `onAreaSettingChange` 会 `message.info` 提示但不阻止选择；前端限制 4 个区域是因为后端 / 渲染上限
- 写接口失败返回 `false`，**不是 throw**，不要 catch

---

## 4. 通用打点接口（与 tab1 共用，但入参不同）

### `getEmergencyNormalGisStationPointsApi(zoneSelect, viewPageArgs, isAlarm, areaId?)`

```ts
// tab2 调用
getEmergencyNormalGisStationPointsApi({}, { ...props.dateTimeSelect }, '0,1', currentArea?.areaId);
```

> `zoneSelect` 传 `{}`，`areaId` 从 `currentArea` 取。

### `getEmergencyNormalGisTransmissionPointsApi(zoneSelect, viewPageArgs, isAlarm, repairIntId, repairLevel, areaId?)`

```ts
// tab2 调用
getEmergencyNormalGisTransmissionPointsApi(
    {},
    { ...props.dateTimeSelect },
    '0,1,2',
    props.leftRepairNoticeParams?.intId,
    transRepairLevel,
    currentArea?.areaId,           // ← 最后位置
);
```

### `getEmergencyNormalGisMachineryRoomPointsApi(zoneSelect, viewPageArgs, repairIntId, repairLevel, areaId?)`

```ts
// tab2 调用
getEmergencyNormalGisMachineryRoomPointsApi(
    {},
    { ...props.dateTimeSelect },
    props.leftRepairNoticeParams?.intId,
    machineryRoomRepairLevel,
    currentArea?.areaId,
);
```

### `getEmergencyNormalGisSuppliesPointsApi(zoneSelect, viewPageArgs, areaId?)`

```ts
// tab2 调用
getEmergencyNormalGisSuppliesPointsApi({}, { ...props.dateTimeSelect }, currentArea?.areaId);
```

### `getMiddleMapAlarmTransmissionApi(viewPageArgs, repairIntId, areaId?)`

```ts
// tab2 调用
getMiddleMapAlarmTransmissionApi({ ...props.dateTimeSelect }, leftRepairNoticeParams?.intId, currentArea?.areaId);
```

> ⚠️ **没有 `zoneSelect`**，只传 `dateTimeSelect`。

---

## 5. pointClick 差异：缺动环分支

tab2 的 `pointClick` switch：

```ts
switch (point.neType) {
    case '201': case '3201': case '8104':    → 无线
    case '900':                               → BRAS
    case '2011':                              → OLT
    case '10005':                             → 动环 (只有这一个值)
    default:                                  → 传输 + 清空 zoneParams
}
```

> ⚠️ 没有 `'1000501' / '1000502' / '1000503' / '1000504' / '1000505'` 分支，全部落到 default。
>
> 排查 bug 时注意：动环子类型在 tab2 都会被派发到「传输」Tab。这是已知现状，需要时手动同步分支。

> 版本：v1.0 · 创建日期：2026-07-13
