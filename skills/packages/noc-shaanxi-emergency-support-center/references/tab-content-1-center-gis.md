# TabContent1 · CenterGis（日常保障区县 / 乡镇 GIS）

日常保障 GIS 视图的壳组件。负责「返回上一层」、「乡镇地图返回区县」两条导航逻辑。所有具体地图渲染与打点逻辑在子组件 `Gis` 里。

- 源文件：[center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/index.tsx)
- 子组件：[Gis](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx)

## 职责

1. 接收父组件 (`TabContent1`) 传入的 `drillZone` 与 `showMap` 回调
2. 提供「返回上一层」按钮（`.back`）
3. 区分两种返回路径：乡镇地图 → 区县地图 / 区县地图 → Path 地图
4. 内部维护 `showGisTownMapBack` 状态，触发 `Gis` 的 useEffect 实现乡镇→区县回流

## Props

| prop                       | 类型                                   | 说明                                                                                    |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `zoneTownSelect`           | `{ zoneId, zoneLevel } \| null`        | 来自派发；存在表示当前是「乡镇」模式                                                    |
| `drillZone`                | `{ zoneId, zoneLevel, regionId, ... }` | 父组件传入的钻入 zone                                                                   |
| `showMap`                  | `() => void`                           | 父组件 `TabContent1` 提供的「返回到 Path」回调                                          |
| `changeShowGisTownMapBack` | `() => void`                           | 由 `CenterGis` 提供，用于重置自身回流状态                                               |
| `showGisTownMapBack`       | `boolean`                              | 内部回流开关，触发 `Gis` 把 zoneLevel 退回到 `city`                                     |
| `{...props}`               | —                                      | 透传给 `Gis`（含 `zoneSelect / dateTimeSelect / leftRepairNoticeParams / dispatch` 等） |

## State

```ts
const [showGisTownMapBack, setShowGisTownMapBack] = useState(false);
```

## 关键函数

```ts
const onBackClick = (e) => {
    e.stopPropagation();
    if (props.zoneTownSelect) {
        // 乡镇 → 区县
        setShowGisTownMapBack(true);
    } else {
        // 区县 → Path 地图
        props.showMap();
    }
};
```

`Gis` 组件监听 `props.showGisTownMapBack === true` 后，会：

- `setZoneLevel(ZoneLevelEnum.city)`
- `setZoneId(drillZone.zoneId)`
- 派发 `zoneSelect` = `{...drillZone}`（不修改级别）
- 派发 `zoneTownSelect = null`
- 调 `props.changeShowGisTownMapBack(false)` 关掉开关

## 渲染

```tsx
import { useEnvironment } from '~/web/hooks/useEnvironment';
import { constants } from '~/web/common/constants';

export const CenterGis = (props) => {
    const [showGisTownMapBack, setShowGisTownMapBack] = useState(false);
    const { emergencySupportGisConfig } = useEnvironment();
    const { showSatelliteBackgroundMap } = emergencySupportGisConfig;

    //返回地市PATH地图
    const onBackClick = (e) => { /* ... */ };

    return (
        <div
            className="emergency-support-center-gis-root"
            style={{
                backgroundImage: showSatelliteBackgroundMap
                    ? `url(${constants.IMAGE_PATH}/emergency-support/卫星地图.png)`
                    : '',
            }}
        >
            <div>
                <Gis
                    {...props}
                    showGisTownMapBack={showGisTownMapBack}
                    changeShowGisTownMapBack={() => setShowGisTownMapBack(false)}
                />
            </div>
            <Tooltip title="返回上一层">
                <div className="back" onClick={onBackClick} />
            </Tooltip>
        </div>
    );
};
```

> 卫星地图背景（commit `2bd9eee` 引入）由环境变量 `emergencySupportGisConfig.showSatelliteBackgroundMap` 控制是否显示；`.less` 中原本写死的 `background: url(...)` 已被注释，避免和 inline style 冲突。
>
> 注意：`drillZone` 已在 `{...props}` 中透传给 `<Gis>`，此处未作为独立命名 prop 显式写出；`Gis` 内部通过 `props.drillZone` 获取。

## className

- 根：`emergency-support-center-gis-root`
- 返回按钮：`.back`

## 子组件说明（仅指针，详细见 [tab-content-1-gis-full.md](tab-content-1-gis-full.md)）

- [Gis](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx)：fedx-gis 包装的实际地图，含 6 类图层 + **跨图层跨 neType 聚合图层**、网元点击派发、图例、光缆图层
- [Detail/LeftGisDetail](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/detail/index.tsx)：左上乡镇告警统计表
- [GisLegend](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis-legend/index.tsx)：图例组件（基站 / 传输 / 机房等可选项）
- [ElTooltipBase](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/el-tooltip-base/index.tsx)：基础 Tooltip（鼠标移动展示基础信息）
- [ElTooltipCircle](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/el-tooltip-circle/index.tsx)：圆圈 Tooltip（含聚合列表点击 → 派发右屏）
- [buildAggregatedPoints.ts](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/utils/buildAggregatedPoints.ts)：业务层网格桶聚合算法

### 聚合相关

- 详细设计：[tab-content-1-aggregate-points.md](tab-content-1-aggregate-points.md)
- 涉及文件：`utils/buildAggregatedPoints.ts`（新增）+ `Gis/index.tsx`（4 个 useMemo + 新 VectorLayer + 原图层过滤）+ `el-tooltip-circle/index.tsx`（加 `onItemClick`）
- 核心概念：`rawNeType`（聚合时保留原始 neType，派发前复原）
- **tab2 暂未实现**，按 SKILL.md 约定两个 Tab 各自实现

## 易踩坑

- 此组件**不直接调用** `widgetFields.getField('zoneTownSelect')`，仅靠 `Gis` 内 effect 处理；新增回流分支时同步修改 `Gis` 内监听
- `e.stopPropagation()` 是为了防止返回按钮事件冒泡到外层地图
- `setShowGisTownMapBack(true)` 后必须由 `Gis` 调用 `changeShowGisTownMapBack(false)` 重置，否则回流开关一直开着
- 和 `tab-content-2` 的 `CenterSuddenGis` 不同：**这是有返回按钮的**，突发保障的壳不带返回按钮
- 卫星地图背景在 commit `2bd9eee` 之后改用 inline `style.backgroundImage`；**不要**再在 `<div className="emergency-support-center-gis-root">` 上的 `.less` 写 `background: url(...)`（会盖过 inline style）

> 版本：v1.1 · 更新日期：2026-07-23（同步 `2bd9eee` 卫星背景改为 inline style）
