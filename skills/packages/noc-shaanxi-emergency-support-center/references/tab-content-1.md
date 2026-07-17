# TabContent1（中屏日常保障）

日常保障 Tab 容器，包含「省/地市 Path 地图 + 下钻到区县 GIS」两个视图，通过 visibility 切换。

- 源文件：[tab-content-1/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/index.tsx)

## 职责

1. 维护 `mapType`（Path / GIS）与 `drillZone` 状态机
2. 提供 `showGis(zone)` 给 `CenterPath`：「双击地市地图跳到 GIS」
3. 提供 `showMap()` 给 `CenterGis`：「从 GIS 返回到 Path 地图」
4. 支持「外部抢修等级跳转 GIS」：`leftRepairNoticeParams` 有值时进入 GIS，并把 `props.zoneSelect` 透传给 GIS 作 `drillZone`

## State

```ts
const [state, setState] = useSetState({
    drillZone: null,
    mapType: MapTypeEnum.path,    // 初始 Path
    leftRepairZone: null,          // 来自外部抢修等级的 zone
});
```

## 关键函数

### showGis(zone)

```ts
const showGis = (zone) => {
    setState({ drillZone: zone, mapType: MapTypeEnum.gis });
};
```

由 `CenterPath.drillMap`（双击地市地图）调用，传参是构造好的 `{ zoneId, zoneLevel, provinceId, regionId, cityId }`。

### showMap()

两条路径：

```ts
const showMap = () => {
    if (props.leftRepairNoticeParams && state.leftRepairZone) {
        // 外部抢修跳转过来 → 根据 leftRepairZone 的级别决定回到 GIS 还是 Path
        const type =
            state.leftRepairZone.zoneLevel === ZoneLevelEnum.city ||
            state.leftRepairZone.zoneLevel === ZoneLevelEnum.town
                ? MapTypeEnum.gis
                : MapTypeEnum.path;
        setState({ mapType: type, leftRepairZone: null, drillZone: null });
        props.dispatch(widgetFields.getField('leftRepairNoticeParams'), '');
        props.dispatch(widgetFields.getField('zoneSelect'), { ...state.leftRepairZone });
    } else {
        // 普通返回 → 回到 Path（地市）
        setState({ mapType: MapTypeEnum.path });
        props.dispatch(widgetFields.getField('zoneSelect'), {
            ...state.drillZone,
            zoneLevel: ZoneLevelEnum.region,
            zoneId: state.drillZone?.regionId,
            cityId: 0,
        });
    }
};
```

### 进入修复模式 effect

```ts
useEffect(() => {
    if (props.leftRepairNoticeParams) {
        setState({ leftRepairZone: { ...props.zoneSelect }, mapType: MapTypeEnum.gis });
    }
}, [props.leftRepairNoticeParams]);
```

> 注意：`leftRepairZone` 取自 `props.zoneSelect`，**派发逻辑不在这里**——上游模块在派发 `leftRepairNoticeParams` 之前应该已经更新了 `zoneSelect`。

## 渲染

```tsx
<div className="full-width full-height tab-content-1">
    <div className="side"></div>
    <div className="center">
        <div className="center-path" style={{ visibility: state.mapType === MapTypeEnum.path ? 'visible' : 'collapse' }}>
            <CenterPath {...props} showGis={showGis} />
        </div>
        <div className="center-gis" style={{ visibility: state.mapType === MapTypeEnum.gis ? 'visible' : 'collapse' }}>
            {state.mapType === MapTypeEnum.gis && (
                <CenterGis {...props} drillZone={state.drillZone || state.leftRepairZone} showMap={showMap} />
            )}
        </div>
    </div>
    <div className="side side-right"></div>
</div>
```

- `visibility` 而非 `display`，可让切换时 CSS 过渡生效
- `center-path` 和 `center-gis` 两个 div 容器始终挂载（visibility 切换），但 **`CenterGis` 组件本身是条件挂载**的（`{state.mapType === MapTypeEnum.gis && <CenterGis .../>}`），避免 fetcher 提前启动；`CenterPath` 则一直挂载

## 透传给子组件的 props

`CenterPath` 与 `CenterGis` 接收 `{...props}` 后还会收到：

- `showGis` → 仅 Path
- `showMap` → 仅 Gis
- `drillZone` → 仅 Gis（来自 `state.drillZone || state.leftRepairZone`）

## className

- 根：`tab-content-1`
- 左右两侧栏：`.side` / `.side.side-right`
- 子视图：`center-path` / `center-gis`

## 易踩坑

- `visibility: collapse`（注意 CSS 里用的是 `collapse` 不是 `hidden`，目的是让元素不占布局空间）
- 进入 GIS 的过渡：`mapType` 切换不会触发子组件 unmount，子组件内部 `useRequest` 用 `ready` 守好
- 派发 `leftRepairNoticeParams: ''` 表示「清空抢修跳转」，不要改成 `null`
- 修改 `showGis` 的入参结构时同步修改 `CenterPath.drillMap` 的调用点

> 版本：v1.0 · 创建日期：2026-07-13
