# CenterPath 专用 API

`CenterPath`（ECharts Path 地图）使用的 3 个核心接口 + 2 个辅助接口。

- 源文件：[api.ts](web/services/emergency-support/center/api.ts)
- 使用方：[center-path/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-path/index.tsx)

## 1. `getPathMapJson(pathLevel, adcode)`

加载 ECharts GeoJSON。

| 项       | 内容                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------- |
| 调用方式 | 直接 `loadJson()`，**不走 `request`**                                                             |
| 入参     | `pathLevel: 'province' \| 'city'`、`adcode: string \| number`（来自 province / region 的 adcode） |
| 路径     | `${constants.STATIC_PATH}/map/${pathLevel}/${adcode}.json`                                        |
| 响应     | 标准 ECharts GeoJSON：`{ type: 'FeatureCollection', features: [{ type, properties, geometry }] }` |
| 调用方   | `CenterPath.useEffect` 注册地图时                                                                 |

### 调用示例

```ts
getPathMapJson(pathLevel, adcode).then((res) => {
    echarts.registerMap('map', res?.data);
    const properties = res?.data?.features?.map((item) => item.properties);
    setState({ properties });
});
```

### 易踩坑

- `res?.data`，再 `.features` —— 这两层结构是 `loadJson` 直接返回；和视图项接口不同
- adcode 必须是省级（省级用 `province.provinceId`）或地市级，不能传区县级

---

## 2. `getPathMapConfigJson()`

加载每个地市 / 区县的「中心点 cp 坐标」配置。

| 项       | 内容                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 调用方式 | 直接 `loadJson()`                                                                                                                      |
| 路径     | `${constants.STATIC_PATH}/map/map-config.json`                                                                                         |
| 响应     | `{ data: [{ id, adcode, name, cp: [lng, lat] }, ...] }`                                                                                |
| 调用方   | `CenterPath` 初始化（`useEffect(() => {}, [])`）+ `tab-content-1/components/center-gis/components/gis/index.tsx`（城市聚焦 useEffect） |

### 响应元素结构

```ts
{
    id: string | number,     // zoneId（地市 / 区县 / 乡镇）
    adcode: string,          // 高德 adcode
    name: string,            // 行政区名称
    cp: [longitude, latitude]  // 中心点经纬度
}
```

### 易踩坑

- 同一个地图实例（`map-config.json`）被 Path 和 GIS 两处共享，但**消费方式不同**：
    - Path：`convertData(ci)` 用来打气泡位置
    - GIS：`setMapCenter(cp)` 用来居中区县地图
- 修改配置 JSON 后要重启 dev server，Vite/UMD 缓存可能导致不生效

---

## 3. `getMiddleMapAlarmDataApiNew(viewPageArgs)` ★

> **当前生产使用版本**（取代旧版 `getMiddleMapAlarmDataApi`）。  
> 按 `selectedBubbleType` 决定后端 `viewItemId`，返回结构简化（无 `cellDescription`，直接是平铺字段）。

| 项     | 内容                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------- |
| 入参   | `{ startTime, endTime, zoneId, zoneLevel, selectedBubbleType: LegendEnum }`                             |
| 视图项 | `middle-map-alarm-station / -machinery-room / -bras / -olt / -jzjf` 五选一（来自 `selectedBubbleType`） |
| 调用方 | `CenterPath.useRequest(dailyCoverageData, ...)`                                                         |

### 入参示例

```ts
{
    startTime: '2026-07-13 00:00:00',
    endTime: '2026-07-13 23:59:59',
    zoneId: 610000,
    zoneLevel: ZoneLevelEnum.province,  // 1
    selectedBubbleType: LegendEnum.site  // 1
}
```

### `selectedBubbleType` → `viewItemId` 映射

| `LegendEnum` | 值  | viewItemId                        |
| ------------ | --- | --------------------------------- |
| `site`       | 1   | `middle-map-alarm-station`        |
| `room`       | 2   | `middle-map-alarm-machinery-room` |
| `bras`       | 4   | `middle-map-alarm-bras`           |
| `olt`        | 5   | `middle-map-alarm-olt`            |
| `siteRoom`   | 7   | `middle-map-alarm-jzjf`           |

> `trans (3)` 不走此接口，由 `getMiddleMapTransDataApi` 独立提供。

### 响应（已转换）

```ts
Array<{
    ...原始 rows[0],
    twoGNum: string,       // 来自 emergencySupportAlarmConfig.site2G 字段
    fourGNum: string,      // site4G
    fiveGNum: string,      // site5G
    oltNum: string,        // OLT
    brasNum: string,       // BRAS
    siteRoomTF: string,    // siteRoomTF（仅 jzjf 有值）
}>
```

### 字段映射（来自 `emergencySupportAlarmConfig`）

```ts
twoGNum = item[site2G];
fourGNum = item[site4G];
fiveGNum = item[site5G];
oltNum = item[OLT];
brasNum = item[BRAS];
siteRoomTF = item[siteRoomTF];
```

缺失字段默认 `'0'`。

### CenterPath 怎么用

```ts
const dailyCoverageData = ...; // 此接口返回值
useEffect(() => {
    if (dailyCoverageData && legendValue !== LegendEnum.trans) {
        switch (legendValue) {
            case LegendEnum.site:
                const data1 = dailyCoverageData.map((item) => ({ ...item, value1: item.twoGNum, ... }));
                setState({ dataSource: data1 });
                break;
            case LegendEnum.bras:        // 用 brasNum
            case LegendEnum.olt:         // 用 oltNum
            case LegendEnum.siteRoom:    // 用 siteRoomTF
        }
    }
}, [dailyCoverageData, legendValue]);
```

### 易踩坑

- 别和旧版 `getMiddleMapAlarmDataApi` 混用 —— 旧版返回结构里所有指标都塞在 `cellDescription`，新版直接平铺。详见下方"已弃用"段落
- 机房图例实际不调用此接口，走 `getMiddleMapMachineryRoomDataApi`

### 🗑 已弃用（旧版）

`getMiddleMapAlarmDataApi`：

- 返回结构是 `cellDescription: string`，需要 `getMainIndexValueById` 解码
- `selectedBubbleType` 6 = 专线中断（图例未启用），其他 1/2/4/5 含义相同
- 字段映射通过 `emergencySupportAlarmConfig` 的统计项 id（`statistic245GSiteItemId` 等），而新版直接通过字段名

> 中心模块当前未调用，留作兼容。

---

## 4. `getMiddleMapMachineryRoomDataApi(zoneSelect, viewPageArgs)`

机房图例专用接口（新版）。

| 项       | 内容                                                         |
| -------- | ------------------------------------------------------------ |
| 调用方式 | **裸 `request`**，不走 `getViewItemDataApi`                  |
| URL      | `EmergencySupport/middleMapAlarmMachineryRoom`               |
| 方法     | POST                                                         |
| 入参     | `{ ...zoneSelect, ...viewPageArgs, zoneLevel: String(...) }` |
| 调用方   | `CenterPath.useRequest(dailyMachineryRoomData, ...)`         |

### 响应（已转换）

```ts
Array<{
    ...原始字段,
    roomTD: string,             // 停电机房 (emergencySupportAlarmConfig.roomTD)
    roomKFD: string,            // 可发电机房 (roomKFD)
    siteRoomKFDYXYW: string,    // siteRoomKFDYXYW
    siteRoomBKFDYXYW: string,   // siteRoomBKFDYXYW
}>
```

### CenterPath 怎么用

```ts
if (legendValue === LegendEnum.room) {
    const data2 = dailyMachineryRoomData.map((item) => ({
        ...item,
        value1: item.roomTD,
        value2: item.roomKFD,
        value3: item.siteRoomKFDYXYW,
        value4: item.siteRoomBKFDYXYW,
        legendValue: LegendEnum.room,
    }));
    setState({ dataSource: data2 });
}
```

### 易踩坑

- 此接口是 `request` 形式，**响应路径直接是 `res.data`**（不是 `res.data.viewItemData.rows`）
- 字段名通过环境变量配置，后端表 schema 改变时要同步检查 `emergencySupportAlarmConfig`

---

## 5. `getMiddleMapTransDataApi(zoneSelect, viewPageArgs)`

传输断点（trans）图例接口。

| 项     | 内容                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| 视图项 | `interrupted-transmission-alarm`                                                                                      |
| 入参   | `viewPageArgs: { ...zoneSelect, ...viewPageArgs }`；`viewPageArgs` 通常是 `{ zoneId, zoneLevel, startTime, endTime }` |
| 调用方 | `CenterPath.useRequest(dailyTransData, ...)`                                                                          |

### 响应（已处理 `rows`）

```ts
Array<{
    ...原始字段,
    alarmNum?: number,        // 断点数量
}>
```

### CenterPath 怎么用

```ts
if (legendValue === LegendEnum.trans) {
    const data3 = dailyTransData.map((item) => ({
        ...item,
        value1: item.alarmNum,
        legendValue: LegendEnum.trans,
    }));
    setState({ dataSource: data3 });
}
```

### 易踩坑

- `localMockUrl: /static/mock/emergency-support/interrupted-transmission-alarm.json` —— 调试时检查 mock 是否生效
- 此接口独立于机房 / 告警接口，不走裸 `request`

> 版本：v1.0 · 创建日期：2026-07-13
