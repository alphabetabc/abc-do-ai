# CenterPath（中屏日常保障 Path 地图）

基于 ECharts 的省/地市 Path 地图。包含：图例切换（站点/机房/传输/BRAS/OLT）、双击下钻、单击气泡派发右屏。

- 源文件：[center-path/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-path/index.tsx)

## 职责

1. 加载省/地市 GeoJSON，渲染 ECharts Path 地图
2. 维护六个图例（`LegendEnum.site/room/trans/bras/olt/siteRoom`）
3. 三类 `useRequest`：覆盖告警 / 传输 / 机房，根据 `legendValue` 决定 `ready`
4. 处理双击下钻（省 → 地市 → 通知父组件跳 GIS）
5. 处理单击气泡，按 legend 分发到右屏不同 Tab + 派发告警 / 传输参数
6. 注册地图气泡点击事件 → 调用 `props.showGis(zone)` 跳转 GIS

## Props

| prop | 类型 | 说明 |
|---|---|---|
| `currentTabType` | `TabChangeEnum` | 用于判断是否渲染 Path（看下面 useEffect 守卫） |
| `zoneSelect` | `{ provinceId, regionId, cityId, zoneId, zoneLevel }` | 行政区选择（来自派发） |
| `dateTimeSelect` | `{ startTime, endTime }` | 时间窗口 |
| `dateTimeRefreshFixed` | `any` | 时间刷新键 |
| `dispatch` | `(key, payload) => void` | 派发器 |
| `showGis(zone)` | `(zone) => void` | 父组件提供的跳转 GIS 回调 |
| `legendValue` 等组件内部 state | — | — |

## State

```ts
const [state, setState] = useSetState({
    chart: null,                  // ECharts 实例
    zoneLevel: ZoneLevelEnum.province,
    zoneId: province.provinceId,
    adcode: province.adcode,
    provinceId: province.provinceId,
    regionId: 0,
    cityId: 0,
    pathMapConfig: null,          // getPathMapConfigJson 结果
    properties: null,             // 当前 GeoJSON 要素 properties
    legendValue: LegendEnum.site, // 当前图例
    dataSource: [],               // 气泡数据
});
```

## 三个 useRequest

### 1. 覆盖告警（wireless / bras / olt / siteRoom）

```ts
const { data: dailyCoverageData } = useRequest(
    () => getMiddleMapAlarmDataApiNew({
        zoneId, zoneLevel, ...props.dateTimeSelect,
        selectedBubbleType: state.legendValue,
    }),
    {
        refreshDeps: [zoneId, zoneLevel, dateTimeSelect, dateTimeRefreshFixed, legendValue],
        ready:
            state.legendValue !== LegendEnum.trans &&
            state.legendValue !== LegendEnum.room &&
            isDefined(state.zoneId) && isDefined(state.zoneLevel),
        pollingInterval: TIME_RANGE.HOUR * 24,
    },
);
```

注意 `selectedBubbleType` 控制后端返回字段。

### 2. 传输断点（trans）

```ts
getMiddleMapTransDataApi(props.zoneSelect, { zoneId, zoneLevel, ...dateTimeSelect })
ready: legendValue === LegendEnum.trans && isDefined(zoneId) && isDefined(zoneLevel)
```

### 3. 机房告警（room）

```ts
getMiddleMapMachineryRoomDataApi(props.zoneSelect, { zoneId, zoneLevel, ...dateTimeSelect })
ready: legendValue === LegendEnum.room && isDefined(zoneId) && isDefined(zoneLevel)
```

> 三个请求互斥，只有当前 legend 对应的请求会 `ready: true`，避免无效请求。

## ECharts 初始化 (initOptions)

`geo` + 两个 `effectScatter` 系列：

- 系列 1：8px 圆点，标记位置
- 系列 2：0px 圆点 + 标签，依赖 `convertData(ci=0.22 or 0.03)` 在气泡上方偏一点显示数值

气泡 label 的 rich 富文本：

- `value0`（`room` 图例）：红色 `#ff5050`
- `value1`（其他图例）：白色 `#F0F0F0`
- `value2`：绿 `#29ff67`
- `value3`：青 `#39f8ff`
- `value4`：黄 `#ffb900`

所有标签字体：`YouSheBiaoTiHei`，22px，背景图：

- `gis-三角体.png`（系列 1 标签背景）
- `gis-tip背景.png`（系列 2 标签背景）

事件：

- `dblclick` → `onMapDBClick`（地图区或气泡都触发）
- `click` → `onScatterClick`（只对 `effectScatter` 气泡）

## 关键流程

### 双击下钻 (drillMap)

```ts
const drillMap = (obj) => {
    if (!obj) return;
    if (zoneLevel === province) {
        setState({
            dataSource: [],
            adcode: obj.adcode,
            zoneId: obj.id,
            zoneLevel: region,
            regionId: obj.id,
        });
        dispatchZone(obj.id, ZoneLevelEnum.region);
    } else {
        setState({ cityId: obj.id });
        dispatchZone(obj.id, ZoneLevelEnum.city);  // ← 调用 props.showGis
    }
};
```

进入 region 后调用 `dispatchZone`：

```ts
const dispatchZone = (zoneId, zoneLevel) => {
    const zone = {
        provinceId: state.provinceId, // 始终来自环境
        zoneId, zoneLevel,
        regionId: 0, cityId: 0,
    };
    if (zoneLevel === region) zone.regionId = zoneId;
    else if (zoneLevel === city) {
        zone.regionId = state.regionId;
        zone.cityId = zoneId;
        props.showGis(zone); // 关键
    }
    props.dispatch(widgetFields.getField('zoneSelect'), zone);
};
```

### 单击气泡 (onScatterClick)

- 全局派发 `rightTabChanged: { key: 1 }`、`centerAreaNeIds: { neIds: '', data: [] }`
- 按 `legendValue` switch：
  - `room` → 切右屏「动环」 + 派发 `rightSecondTabChanged: '动环'` + `rightSecondTabAlarmParams`（用 `emergencySupportAlarmConfig.roomTD`）
  - `trans` → 切右屏「传输」+ 设置 `rightSecondTabTransType: '0'` + `rightSecondTabTransZoneParams`
  - `site` → 「无线」 + `mainIndexId: emergencySupportAlarmConfig.site245G, roomMainIndexId: site245GRoom`
  - `bras` → 「BRAS」 + `mainIndexId: BRAS`
  - `olt` → 「OLT」 + `mainIndexId: OLT`
  - `siteRoom` → 「基站机房」 + `mainIndexId: siteRoomTF`

> 别名映射由 `useEnvironment().emergencySupportAlarmConfig` 提供，新增告警类型时同步检查环境变量。

### convertData (气泡数据转换)

```ts
const convertData = (ci = 0) => {
    const resData = [];
    state.dataSource?.forEach((data) => {
        const coodObj = state.pathMapConfig?.find((item) => item.id === data?.zoneId);
        if (coodObj?.cp) {
            const [x, y] = coodObj.cp;
            resData.push({ ...data, value: [x, y + ci] });
        }
    });
    return resData;
};
```

- `pathMapConfig` 是 `getPathMapConfigJson` 返回的 cp 点位信息
- `ci` 用于让数值标签向上偏移，省级 `0.22`，其他 `0.03`

### 图例切换 (onLegendChange)

```ts
const onLegendChange = (e) => {
    setState({ legendValue: e.target.value });
};
```

简单值切换，所有联动由 useRequest 和 useEffect 自动处理。

### 数据 → dataSource 转换（底部 useEffect）

```ts
useEffect(() => {
    setState({ dataSource: [] });
    setTimeout(() => {
        if (legendValue === room) { /* map machineryRoom fields */ }
        else if (legendValue === trans) { /* map trans fields */ }
        else { switch (legendValue) { site, bras, olt, siteRoom, default } }
    }, 100);
}, [dailyCoverageData, dailyTransData, dailyMachineryRoomData, legendValue]);
```

`setTimeout 100ms` 是为了等旧 `dataSource` 清空后再写入新值，避免 ECharts 渲染旧数据。

### 地图加载 (初始化 useEffect)

```ts
useEffect(() => {
    const chart = echarts.init(document.getElementById('echartsMap'));
    setState({ chart });
    getPathMapConfigJson().then((res) => setState({ pathMapConfig: res?.data?.data }));
}, []);
```

注册地图：

```ts
useEffect(() => {
    if (props.currentTabType === TabChangeEnum.tab1 && chart && pathMapConfig && zoneLevel && adcode) {
        if (zoneLevel === province || zoneLevel === region) {
            getPathMapJson(zoneLevel === province ? 'province' : 'city', adcode).then((res) => {
                echarts.registerMap('map', res?.data);
                const properties = res?.data?.features?.map((item) => item.properties);
                setState({ properties });
            });
        } else {
            props.showGis(zoneId); // 进入 city 跳 GIS
        }
    }
}, [currentTabType, chart, zoneLevel, pathMapConfig, adcode]);
```

## 返回上一层

```tsx
{state.zoneLevel === ZoneLevelEnum.region && (
    <Tooltip title="返回上一层">
        <div className="back" onClick={onBackClick} />
    </Tooltip>
)}
```

`onBackClick` 恢复 `province` 级别 + 派发 `dispatchZone`。

## 静态资源路径

| 用途 | 路径 |
|---|---|
| 系列 1 标签背景 | `/static/images/emergency-support/gis-三角体.png` |
| 系列 2 标签背景 | `/static/images/emergency-support/gis-tip背景.png` |

## className

- 根：`emergency-support-center-path-root`
- 地图容器：`map`（id 为 `echartsMap`，由 ECharts init 取）
- 右上角返回按钮：`back`
- 左下角图例：`legend`，含 `title` + `radio`

## 易踩坑

- 三类请求互斥由 `ready` 控制，修改时不要图省事合并请求，后端接口签名不同
- `selectedBubbleType` 是后端关键字，新加图例要先确认后端是否支持
- 双击地市 → `showGis`，**不要直接派发 `zoneSelect`** 来跳 GIS，必须通过 `props.showGis`，让父组件 TabContent1 同步更新 `mapType` 与 `drillZone`
- `convertData(ci)` 中的 `ci` 偏移在切换省级 / 地市时不同，省级 0.22，地市 0.03
- 单击气泡的 swich 分支里没改 `centerAreaNeIds.data`，因为是重置为 `[]`，真正派发的是 `pointClick`（GIS 那边）
- `props.currentTabType` 必须显式判断，否则会跨 tab 渲染

> 版本：v1.0 · 创建日期：2026-07-13
