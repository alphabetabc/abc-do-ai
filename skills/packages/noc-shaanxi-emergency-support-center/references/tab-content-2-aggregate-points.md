# TabContent2 · 设备经纬度重叠聚合（跨图层跨 neType）

> **tab2 已实现**，与 tab1 对称（按 SKILL.md 约定两个 Tab 各自实现，不抽公共）。

把 `dataStationPointsAll`（基站 `neType: 201/3201/8104`）和 `dataMachineryRoomPointsAll`（机房 `neType: 10005*`）做**跨图层合并**，让同址设备显示成一个聚合点 + 弹层列表。

- 源文件：
    - 工具：[buildAggregatedPoints.ts](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/utils/buildAggregatedPoints.ts)
    - 接入：[gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx)
    - 弹层列表项点击：[el-tooltip-circle/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/el-tooltip-circle/index.tsx)

---

## 1. 解决的问题

| 缺口                                                         | 修复后                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 同址基站 + 机房各自打点、叠加显示                            | 合并为 1 个聚合点，弹层列出所有设备                                                          |
| `csFixedNum=6` 容差 ≈ 0.11m，现实中经纬度略偏的设备不聚合    | 业务层用 `AGGREGATE_TOLERANCE=5e-5`（≈ 5m）做网格桶合并                                      |
| OL 内部只对同一 neType 聚合，跨 neType（基站 vs 机房）不合并 | 业务层先把所有 children 的 `neType` 覆盖为 `'aggregate'`、经纬度对齐到锚点，让 OL 命中同 key |
| 聚合弹层 `ElTooltipCircle` 无点击事件                        | 加 `onItemClick` 可选 prop，点击列表项派发右屏                                               |

---

## 2. 总体设计

```
dataStationPointsAll + dataMachineryRoomPointsAll
       ↓ 图例过滤（neTypeCheckList + stationTypeCheckList）
【新增】aggregatePoints = buildAggregatedPoints([stationFlat, roomFlat])
       ↓ 网格桶：粗分桶 + 9 邻域合并；同址 ≥2 点合成一组
       ↓ 输出 [{ neType: 'aggregate', longitude, latitude, points: [{ ..., rawNeType, neType: 'aggregate' }] }]
       ↓
【新增】VectorLayer id="layerAggregatePoints" zIndex=1004
       ↓ children 共享锚坐标 + 共享 neType='aggregate'
       ↓ OL 内部 toFixed(csFixedNum=6) 命中同 key → 触发 onShowCircle(pointArr)
       ↓
【复用】setCirclePoints(pointArr 复原 neType 后) → GisCustomCircleView 显示圆圈
【复用】onCirclePointMove → setCircleTooltipSource([e]) → ElTooltipCircle 列表
       ↓ 用户点击列表项
       ↓
【新增】onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}
       ↓ 复原 neType，pointClick 派发右屏

并行：
【新增】aggregatedCodes + dataStationPointsFiltered / dataMachineryRoomPointsFiltered
       ↓ 被聚合的 siteCode 从原图层移除（避免同址重复显示）
```

---

## 3. 关键概念：`rawNeType`

> 与 tab1 完全一致，详见 [tab-content-1-aggregate-points.md §3](tab-content-1-aggregate-points.md)。这里只列 tab2 特化点。

### 3.1 责任分工

| 位置                                        | 行为                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildAggregatedPoints.ts`                  | 把原 `neType` 复制到 `rawNeType`，覆盖 `neType='aggregate'`；所有 children 共享锚的 `longitude / latitude`                                      |
| OL 内部                                     | 只看 `latitude / longitude` + `neType` 做 key 合并（`toFixed(csFixedNum=6)`），**不读 rawNeType**                                               |
| `onShowCircle(pointArr)`                    | **必须**复原：`pointArr.map(p => ({ ...p, neType: p.rawNeType ?? p.neType }))`，否则 `onCircleClick` → `pointClick` 拿到 `'aggregate'` 派发失败 |
| `pointClick(item)`                          | 读 `item.neType` → `'aggregate'` → 直接派发会失败                                                                                               |
| `ElTooltipCircle.onItemClick`               | **必须**复原：`onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}`                                          |
| 详情接口 `getEmergencyGisPointDetailApi` 等 | 同样读 `point.neType` 决定走哪个接口，所以复原必须在调用 `pointClick` **之前**                                                                  |

> ⚠️ **tab2 与 tab1 的差异**：tab2 的 `onShowCircle` 也做了复原（tab1 的 `onShowCircle` 是零改动）。因为 tab2 用 `setTimeout` 直接置空 `circlePoints`，`onCircleClick` 会读 `circlePoints` 中的点调用 `pointClick`，如果不复原会失败。

---

## 4. `buildAggregatedPoints.ts` 实现

> 算法与 tab1 完全相同，文件独立在 `tab-content-2/` 下（按 SKILL.md 约定不抽公共）。

### 4.1 关键常量

```ts
const AGGREGATE_TOLERANCE = 5e-5; // 5m，业务层判定容差
const AGGREGATE_GRID_SIZE = 1e-3; // 100m 一格
const MAX_AGGREGATE_OUTPUT = 600; // 熔断上限（当前**代码里被注释掉**，未启用）
```

### 4.2 算法（网格桶 + 9 邻域）

```
1) 粗分桶：floor(longitude / GRID_SIZE) + ':' + floor(latitude / GRID_SIZE)
2) 桶内 + 9 邻域合并：同址 (|Δlon|, |Δlat|) < TOLERANCE 视为一组
3) 只输出 ≥2 个共点的组
4) 输出的 children 共享锚坐标 + 共享 neType='aggregate' + 保留 rawNeType
```

**复杂度**：O(n)，3 万点 < 50ms。

---

## 5. `gis/index.tsx` 改动

### 5.1 import 变更

[gis/index.tsx:3-8](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L3-L8)：

```ts
// 从 fedx-gis import 中移除了 CircleView
import { MapContainer, TileArcgisRestLayer, VectorLayer, getMap, gisFunc, XYZTileLayer } from 'fedx-gis/dist/gis-2d';
// 新增
import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView';
```

[gis/index.tsx:27](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L27)：

```ts
import { buildAggregatedPoints } from '../../utils/buildAggregatedPoints';
```

### 5.2 4 个 useMemo

完整代码（[gis/index.tsx:208-249](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L208-L249)）：

```ts
// 聚合点：业务层跨图层（基站 + 机房）合并
const aggregatePoints = useMemo(() => {
    if (!dataStationPointsAll || !dataMachineryRoomPointsAll) return [];

    // 扁平化基站（201/3201/8104）+ 图例过滤
    const stationFlat = dataStationPointsAll
        .filter((g) => ['201', '3201', '8104'].includes(g.neType))
        .flatMap((g) => g.points)
        .filter((p) => neTypeCheckList?.includes(p.neType) && stationTypeCheckList?.includes(p.isAlarm));

    // 扁平化机房（10005*）+ 图例过滤（机房不参与 stationTypeCheckList）
    const roomFlat = dataMachineryRoomPointsAll
        .filter((g) => String(g.neType).startsWith('10005'))
        .flatMap((g) => g.points)
        .filter((p) => neTypeCheckList?.includes(p.neType));

    return buildAggregatedPoints([...stationFlat, ...roomFlat]);
}, [dataStationPointsAll, dataMachineryRoomPointsAll, neTypeCheckList, stationTypeCheckList]);

// 原图层过滤：移除被聚合的 siteCode
const aggregatedCodes = useMemo(() => {
    const set = new Set();
    aggregatePoints.forEach((g) => g.points.forEach((p) => p.siteCode && set.add(p.siteCode)));
    return set;
}, [aggregatePoints]);

const dataStationPointsFiltered = useMemo(() => {
    if (aggregatedCodes.size === 0) return dataStationPoints;
    return dataStationPoints?.map((g) => ({
        ...g,
        points: g.points.filter((p) => !aggregatedCodes.has(p.siteCode)),
    }));
}, [dataStationPoints, aggregatedCodes]);

const dataMachineryRoomPointsFiltered = useMemo(() => {
    if (aggregatedCodes.size === 0) return dataMachineryRoomPointsAll;
    return dataMachineryRoomPointsAll?.map((g) => ({
        ...g,
        points: g.points.filter((p) => !aggregatedCodes.has(p.siteCode)),
    }));
}, [dataMachineryRoomPointsAll, aggregatedCodes]);
```

> **与 tab1 差异**：`aggregatePoints` useMemo 依赖**没有** `zoneSelect` / `zoneId`，因为 tab2 用 `currentArea?.areaId` 控制 useRequest，数据源变化会自动触发 `dataStationPointsAll` 更新 → useMemo 重算。

### 5.3 `onShowCircle` 复原 neType

完整代码（[gis/index.tsx:267-279](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L267-L279)）：

```ts
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    setCirclePoints([]);
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

> **与 tab1 差异**：tab1 的 `onShowCircle` 是零改动（直接 `setCirclePoints(pointArr)`）；tab2 在 `setCirclePoints` 前做了 `rawNeType ?? neType` 复原。因为 tab2 用 `setTimeout` 直接置空，`onCircleClick` 会读 `circlePoints` 中的点调用 `pointClick`，如果不复原会失败。

### 5.4 原图层 source 替换

改动只发生在 `source` 一行（其他 props 不动），完整对照：

| 图层                       | 改前 source                  | 改后 source                               | 位置                                                                                                                                          |
| -------------------------- | ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `layerMachineryRoomPoints` | `dataMachineryRoomPointsAll` | `dataMachineryRoomPointsFiltered \|\| []` | [gis/index.tsx#L663](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L663) |
| `layerStationPoints`       | `dataStationPoints`          | `dataStationPointsFiltered \|\| []`       | [gis/index.tsx#L725](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L725) |

### 5.5 新 VectorLayer

完整代码（[gis/index.tsx:754-776](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L754-L776)）：

```tsx
{
    /* 聚合图层：业务层跨图层合并 → 触发 onShowCircle → 复用现有 CircleView */
}
<VectorLayer
    id="layerAggregatePoints"
    source={aggregatePoints}
    isDrawing={false}
    singlePopupVisible={false}
    isSetLocation={false}
    pointStyle={{
        fontSize: 14,
        fontWeight: '400',
        fontFamily: '微软雅黑',
        offset: [-150, -150],
        fontColor: 'black',
        fontBackColor: 'rgba(238, 44, 44, 0.5)',
        scale: 1,
    }}
    onShowCircle={onShowCircle}
    csFixedNum={emergencySupportGisConfig.csFixedNum}
    isShowTitle={false}
    isShowSamePoint={false}
    isGongZhanByType={true}
    zIndex={1004}
/>;
```

> **与 tab1 差异**：tab2 的 `layerAggregatePoints` **没有** `onClick` / `onMove` / `onClickOther`（tab1 也没有）。其他 props 完全一致。

### 5.6 `CircleView` 替换为 `GisCustomCircleView`

完整代码（[gis/index.tsx:777-786](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L777-L786)）：

```tsx
<GisCustomCircleView
    visible={true}
    source={circlePoints}
    toolPupWindowId="toolTipWindowCircle2"
    onClick={onCircleClick}
    onMouseMove={onCirclePointMove}
    tooltipProperty={{ placement: 'top' }}
    overlayStyle={{ width: 300 }}
    radius={circlePoints.length > 10 ? 100 : 60}
/>
```

> **与 tab1 差异**：tab1 原本就用 `GisCustomCircleView`；tab2 是从原生 `CircleView`（动态 `overlayStyle.width`）替换过来的。`toolPupWindowId` 保持 `toolTipWindowCircle2`（tab1 是 `toolTipWindowCircle1`）。

### 5.7 `ElTooltipCircle` 加 `onItemClick`

完整代码（[gis/index.tsx:803-811](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L803-L811)）：

```tsx
<div id="toolTipWindowCircle2">
    {circleTooltipSource && (
        <ElTooltipCircle
            key="EteElTooltipCirclePopup2"
            source={circleTooltipSource}
            style={circleTooltipStyle}
            onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}
        />
    )}
</div>
```

---

## 6. `el-tooltip-circle/index.tsx` 改动

> 与 tab1 实现完全一致。

完整代码（[el-tooltip-circle/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/el-tooltip-circle/index.tsx)）：

```tsx
import { Row, Col } from 'antd';
import './index.less';

//GIS打点tip
export default function Index(props) {
    const { source, style, onItemClick } = props;
    return (
        <div className="emergency-support-gis-tip-circle-container" style={style !== undefined ? style : {}}>
            {source?.map((item) => {
                return (
                    <div
                        className="content"
                        key={item.siteCode || `${item.longitude}-${item.latitude}`}
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                        style={onItemClick ? { cursor: 'pointer' } : undefined}
                    >
                        {/* Row/Col 渲染网元名称/经度/纬度，与 tab1 一致 */}
                    </div>
                );
            })}
        </div>
    );
}
```

### 改动点

| 项             | 改前                    | 改后                                                                                                                      |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 解构 prop      | `{ source, style }`     | `{ source, style, onItemClick }`                                                                                          |
| 容器 style     | `style ?? {}`（旧逻辑） | `style !== undefined ? style : {}`（仅 `undefined` 时用 `{}`，`null` 视为合法）                                           |
| `.content` div | 无 `onClick` / `style`  | `onClick={onItemClick ? () => onItemClick(item) : undefined}` + `style={onItemClick ? { cursor: 'pointer' } : undefined}` |

---

## 7. 与现有逻辑的边界

| 现有逻辑                                                            | 处理                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| 4 个 useRequest（基站/机房/传输/应急）+ 区域配置 2 个               | **零改动**                                             |
| `dataStationPoints` / `dataMachineryRoomPointsAll` 过滤             | **保留原版**，新增 `*Filtered` 版本用于图层渲染        |
| 5 个 VectorLayer（区域线 + 4 业务图层）中 2 个 source               | 替换为 `*Filtered`；其他 props 不动                    |
| `onShowCircle` 回调                                                 | **改**：`setCirclePoints` 前复原 `rawNeType ?? neType` |
| `circlePoints` / `circleTooltipSource` / `circleTooltipStyle` state | **复用**                                               |
| `onCirclePointMove` / `onCircleClick`                               | **零改动**                                             |
| `pointClick(point)`                                                 | **零改动**（调用方负责复原 neType）                    |
| `<CircleView>`                                                      | **替换**为 `<GisCustomCircleView>`（加 `radius` prop） |
| `<ElTooltipBase>`                                                   | **零改动**                                             |
| less 样式                                                           | **零改动**                                             |
| 后端 API                                                            | **零改动**                                             |
| `currentArea` 区域聚焦逻辑                                          | **零改动**（聚合点不参与聚焦）                         |
| `gisFunc.showLayer`                                                 | **零改动**（聚合图层不进 neTypeList 遍历）             |

---

## 8. 与 tab1 的差异对照

| 维度                                                    | tab1                                                                                      | tab2                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 数据源控制参数                                          | `props.zoneSelect` + `zoneId/zoneLevel`                                                   | `currentArea?.areaId`                                                    |
| `aggregatePoints` useMemo 依赖                          | `dataStationPointsAll, dataMachineryRoomPointsAll, neTypeCheckList, stationTypeCheckList` | 同（无 `zoneSelect/zoneId`）                                             |
| `onShowCircle` 复原 neType                              | **零改动**（直接 `setCirclePoints(pointArr)`）                                            | **改**：`pointArr.map(p => ({ ...p, neType: p.rawNeType ?? p.neType }))` |
| CircleView 组件                                         | `GisCustomCircleView`（原本就用）                                                         | `GisCustomCircleView`（从原生 `CircleView` 替换）                        |
| toolPupWindowId                                         | `toolTipWindowCircle1`                                                                    | `toolTipWindowCircle2`                                                   |
| `layerAggregatePoints` 的 `onClick/onMove/onClickOther` | 无                                                                                        | 无                                                                       |
| `buildAggregatedPoints.ts` 路径                         | `tab-content-1/utils/`                                                                    | `tab-content-2/utils/`（独立一份）                                       |
| `setCirclePoints([])` 时序                              | `flushSync` 包裹                                                                          | `setTimeout` 直接置空（保持现状）                                        |

---

## 9. 明确未实现 / 不要按需求文档去补

> 与 tab1 完全一致，详见 [tab-content-1-aggregate-points.md §10](tab-content-1-aggregate-points.md)。这里只列 tab2 特有项。

| 未实现的能力                              | 状态                         | 说明                                                                                                  |
| ----------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| 自定义图标 `group-point.png`              | **不实现**                   | OL 内部走 `imageUrl` 模板即可                                                                         |
| `.aggregate-badge` 角标 CSS               | **不实现**                   | OL 用 `gongzhan{level}.png` 内置气泡样式，角标数字由 OL 内部生成                                      |
| `formatCount(n)` 99+ 熔断                 | **不实现**                   | OL 内部已处理大数字渲染；不需要业务层做                                                               |
| `gisFunc.showLayer` 控制聚合图层          | **不实现**                   | 聚合图层自动响应 `aggregatePoints` useMemo 的空值卸载                                                 |
| `MAX_AGGREGATE_OUTPUT = 600` 熔断         | **代码里有常量但判断被注释** | 当前数据量未到阈值，暂不启用                                                                          |
| `pointClick` 机房子分支 `1000501-1000505` | **不修复**                   | tab2 的 switch 缺机房子分支，走 default → 传输 Tab；聚合方案不修复此差异，只确保 `rawNeType` 正确复原 |

---

## 10. 易踩坑

- **`rawNeType` 命名与复原位置**：永远是「构造时复制 → 调用前复原」。tab2 有**两处**复原：`onShowCircle` 内 + `ElTooltipCircle.onItemClick` 内
- **`onShowCircle` 复原不能漏**：tab2 的 `onCircleClick` 会读 `circlePoints` 中的点调用 `pointClick`，如果 `onShowCircle` 不复原，`pointClick` 收到 `'aggregate'` 派发失败
- **`csFixedNum` 必须传**：`layerAggregatePoints` 的 `csFixedNum={emergencySupportGisConfig.csFixedNum}` 不传等于 0，OL 不会按精度合并
- **`zIndex=1004`**：必须 > 原图层（1003），否则聚合点被基站小图压住
- **机房图层也要过滤**：`dataMachineryRoomPointsFiltered` 不可漏，否则同址处会同时显示聚合圆圈 + 机房单点
- **`aggregatePoints` useMemo 依赖要包含 legend**：否则取消勾选图例后聚合点不消失（鬼影）
- **`GisCustomCircleView` 的 `radius` prop**：`circlePoints.length > 10 ? 100 : 60`，与 tab1 一致

---

> 版本：v1.0 · 创建日期：2026-07-16
