# 中屏保障中心 · tab2 设备经纬度重叠聚合 — 详细实现方案

> **实施状态：已完成**

> 状态：**v0.1 · 待 Review（对称 tab1 v0.4，已引入 rawNeType 概念）**
> 作者：MiniMax-M3
> 日期：2026-07-16
> 父文档：
> - `.trae/documents/中屏保障中心-设备经纬度重叠聚合需求分析.md`
> - `.trae/documents/中屏保障中心-tab1设备经纬度重叠聚合详细方案.md`
> 适用范围：**tab2（突发保障）** 详细方案，对称 tab1 v0.4 实现。按 SKILL.md 约定不抽公共组件，算法/图层分别在 `tab-content-2/` 下独立实现。

---

## 0. 关键概念：`rawNeType`

> 与 tab1 v0.4 完全一致，复用同一概念，原因不再重复。详见 tab1 方案 §0。

### 0.1 数据结构

```ts
{
    neType: 'aggregate',     // ← 强制覆盖，让 OL 内部识别为同一分组
    longitude: 锚点经度,
    latitude: 锚点纬度,
    points: [
        {
            ...原始字段,
            neType: 'aggregate',       // ← 强制覆盖
            rawNeType: '201',          // ← 保留原始 neType（来自原数据）
            longitude: 锚点经度,        // ← 强制共享锚
            latitude: 锚点纬度,
        },
        ...
    ],
}
```

### 0.2 `rawNeType` 使用位置（tab2 特化）

| 位置 | 行为 |
|---|---|
| `buildAggregatedPoints.ts` 内部 | 把原 neType 复制到 `rawNeType`，覆盖 `neType='aggregate'` |
| OL 内部 | 只看 `latitude/longitude` 做 key 合并，**不读 neType** |
| `pointClick(item)` | 读 `item.neType` → 拿到 `'aggregate'` → switch 分支全部 miss → 走 `default`（传输）派发失败 ⚠️ |
| `onItemClick` 回调 | **必须**用 `rawNeType` 复原 neType 后再传给 `pointClick` |
| `onShowCircle` 回调 | 进入 `setCirclePoints` 前必须把 `rawNeType` 复原为 `neType`（否则 `onCircleClick` → `pointClick` 同样失败） |
| 详情接口 `getEmergencyGisPointDetailApi` / `getEmergencyGisPointMachineryRoomDetailApi` | 读 `point.neType` 决定走哪个接口（`isMachineryRoom`/`isTransmission` 标志位同样依赖原始数据） |

---

## 1. tab2 现状盘点（与 tab1 差异）

### 1.1 数据层（4 个 useRequest + 区域配置）

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L89-L159`：

| useRequest key | API | tab2 特化点 |
|---|---|---|
| `dataStationPointsAll` | `getEmergencyNormalGisStationPointsApi` | 第 1 参 `{}`（tab1 传 `props.zoneSelect`），第 4 参 `currentArea?.areaId` |
| `dataMachineryRoomPointsAll` | `getEmergencyNormalGisMachineryRoomPointsApi` | 第 1 参 `{}`，第 4 参 `currentArea?.areaId` |
| `dataTransmissionPointsAll` | `getEmergencyNormalGisTransmissionPointsApi` | 同上，不参与聚合 |
| `dataSuppliesPointsAll` | `getEmergencyNormalGisSuppliesPointsApi` | 同上，不参与聚合 |

> tab2 **没有** tab1 的 `zoneSelect/zoneId/zoneLevel` 下钻参数，改用 `currentArea`（区域配置选中项）作为刷新依赖。

### 1.2 过滤层（2 个 useMemo，与 tab1 一致）

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L187-L203`：

```ts
const dataStationPoints = useMemo(() => {
    return dataStationPointsAll?.map((item) => ({
        neType: item.neType,
        points: item.points.filter((item) => stationTypeCheckList.includes(item.isAlarm)),
    }));
}, [dataStationPointsAll, stationTypeCheckList]);

const dataTransmissionPoints = useMemo(() => {
    return dataTransmissionPointsAll?.map((item) => ({
        neType: item.neType,
        points: item.points.filter((item) => transmissionTypeCheckList.includes(item.isAlarm)),
    }));
}, [dataTransmissionPointsAll, transmissionTypeCheckList]);
```

机房没有 useMemo 过滤，直接喂图层（与 tab1 一致）。

### 1.3 图层渲染（4 个 VectorLayer + 区域线图层）

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L550-L703`：

| 图层 id | source | zIndex | isGongZhanByType | isShowSamePoint | csFixedNum | onShowCircle |
|---|---|---|---|---|---|---|
| `layerAreaLines`（tab2 独有） | `dataAreaLines` | — | false | false | ✓ | ✗ |
| `layerSuppliesPoints` | `dataSuppliesPointsAll` | 1000 | true | false | ✓ | ✓ |
| `layerMachineryRoomPoints` | `dataMachineryRoomPointsAll` | 1001 | true | false | ✓ | ✓ |
| `layerTransmissionPoints` | `dataTransmissionPoints` | 1002 | true | false | ✓ | ✓ |
| `layerStationPoints` | `dataStationPoints` | 1003 | true | false | ✓ | ✓ |

### 1.4 弹层显示（CircleView + ElTooltipCircle）

tab2 两个关键差异：

1. **CircleView 替换为 `GisCustomCircleView`**（`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L704-L712`），与 tab1 v0.4 保持一致。`GisCustomCircleView` 额外提供 `radius` prop（按聚合点数量动态调整圆圈半径），比原生 `CircleView` 的固定 `overlayStyle.width` 更适合聚合场景。
2. **toolPupWindowId = `toolTipWindowCircle2`**（tab1 是 `toolTipWindowCircle1`），保持 tab2 原命名，避免冲突。

```tsx
// 新增 import（顶部）
import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView';

// 替换原生 CircleView
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

ElTooltipCircle 容器（`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L729-L737`）：

```tsx
<div id="toolTipWindowCircle2">
    {circleTooltipSource && (
        <ElTooltipCircle
            key="EteElTooltipCirclePopup2"
            source={circleTooltipSource}
            style={circleTooltipStyle}
        ></ElTooltipCircle>
    )}
</div>
```

### 1.5 `pointClick` switch 差异（tab2 缺机房子分支）

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L316-L348`：

tab2 的 switch 只匹配 `case '10005'`，**没有** tab1 的 `case '1000501'...'1000505'` 子分支。这意味着：

- tab1 机房子 neType `1000501-1000505` 走 `动环` Tab
- tab2 机房子 neType `1000501-1000505` 走 `default` → **传输** Tab（**潜在 bug，但不在本次聚合方案范围内**）

聚合方案**不修复**此差异，只确保 `rawNeType` 正确复原，把决策权留给现有 `pointClick`。

### 1.6 tab2 缺失的能力（与 tab1 v0.4 对比）

| 缺口 | tab1 v0.4 现状 | tab2 现状 |
|---|---|---|
| `utils/buildAggregatedPoints.ts` | ✅ 已新增 | ❌ 不存在 |
| `aggregatePoints` useMemo | ✅ 已加 | ❌ 未加 |
| `aggregatedCodes` / 过滤后 useMemo | ✅ 已加 | ❌ 未加 |
| `layerAggregatePoints` VectorLayer | ✅ 已加（zIndex 1004） | ❌ 未加 |
| `onShowCircle` 复原 neType | ✅ 已加（`rawNeType ?? neType`） | ❌ 未加 |
| `ElTooltipCircle.onItemClick` 复原 neType | ✅ 已加 | ❌ 未加 |
| `ElTooltipCircle` 组件本身 `onItemClick` prop | ✅ 已加 | ❌ 未加 |
| `flushSync` 包裹 `setCirclePoints([])` | ✅ 已加 | ❌ 未加（tab2 用 `setTimeout` 直接置空，需评估是否补 flushSync） |

---

## 2. 增量设计（对称 tab1 v0.4）

### 2.1 总体思路

```
dataStationPointsAll (基站) + dataMachineryRoomPointsAll (机房)
       ↓
【新增】业务层网格桶聚合 (utils/buildAggregatedPoints.ts)
       ↓ 输出 [{ neType: 'aggregate', longitude, latitude, points: [{ ...device, rawNeType, neType: 'aggregate', ... }] }]
       ↓
【新增】VectorLayer id="layerAggregatePoints" (zIndex=1004)
       ↓ onShowCircle={onShowCircle}（复用现有回调，回调内复原 neType）
       ↓ OL 内部按 csFixedNum 命中同 key → 触发 onShowCircle(pointArr)
       ↓
【复用】setCirclePoints(pointArr 复原后) → 现有 CircleView 显示圆圈
【复用】onCirclePointMove → 现有 ElTooltipCircle 显示
       ↓ 用户 hover 圆圈时弹层显示"同址的所有设备"
       ↓
【扩展】ElTooltipCircle 加 onItemClick prop
       ↓ 列表项点击 → 复原 neType（rawNeType → neType） → pointClick(item) 复用派发
       ↓
【新增】原图层过滤：被聚合的 siteCode 从 dataStationPoints / dataMachineryRoomPointsAll 移除
       ↓ 避免同址重复显示
```

### 2.2 关键决策（tab2 特化）

| # | 决策 | 依据 |
|---|---|---|
| 1 | **算法与 tab1 完全相同，但文件独立** | SKILL.md 约定 tab1/tab2 严格隔离，不抽公共。`utils/buildAggregatedPoints.ts` 在 `tab-content-2/` 下新增一份 |
| 2 | **CircleView 替换为 `GisCustomCircleView`** | 与 tab1 v0.4 保持一致；`GisCustomCircleView` 的 `radius` prop 按聚合点数量动态调整圆圈半径，比原生 `CircleView` 的固定 `overlayStyle.width` 更适合聚合场景 |
| 3 | **toolPupWindowId 保持 `toolTipWindowCircle2`** | 与 tab2 现状一致，避免 DOM id 冲突 |
| 4 | **`onShowCircle` 复原 neType** | 与 tab1 一致：`pointArr.map(p => ({ ...p, neType: p.rawNeType ?? p.neType }))`，否则 `onCircleClick` → `pointClick` 拿到 `'aggregate'` 派发失败 |
| 5 | **`ElTooltipCircle.onItemClick` 复原 neType** | 与 tab1 一致：`pointClick({ ...item, neType: item.rawNeType ?? item.neType })` |
| 6 | **不补 `flushSync`** | tab1 聚合版用 `flushSync` 是为解决栅栏时序问题；tab2 现状 `setTimeout` 已能工作，本次只做聚合增量，不顺手重构时序。若联调出现圆圈不消失的回归，再单独评估 |
| 7 | **聚合 useMemo 依赖 `neTypeCheckList` + `stationTypeCheckList`** | 与 tab1 一致，避免 legend 切换后聚合点鬼影 |
| 8 | **机房过滤逻辑与 tab1 一致**：`String(g.neType).startsWith('10005')` | tab2 机房 neType 与 tab1 同源 |
| 9 | **聚合点不参与 `gisFunc.showLayer`** | 与 tab1 一致：聚合图层 source 为空时自然卸载，不进 `neTypeList` 遍历 |
| 10 | **聚合点不参与区域聚焦** | tab2 的 `currentArea` 聚焦目标是区域中心，不是单点；聚合点 children 若命中 `leftRepairNoticeParams.intId` 也不处理，让用户点击聚合点 → 列表里选该项 |

### 2.3 聚合 useMemo 关键代码（tab2 版）

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
```

> 与 tab1 唯一差异：**无 `zoneSelect/zoneId` 依赖**，因为 tab2 用 `currentArea` 控制 useRequest，数据源变化会自动触发 `dataStationPointsAll` 更新 → useMemo 重算。

---

## 3. 改动文件清单（纯增量）

| # | 文件 | 操作 | 类型 |
|---|---|---|---|
| 1 | `tab-content-2/components/center-gis/utils/buildAggregatedPoints.ts` | **新增** | 业务层跨图层聚合（带 rawNeType），算法与 tab1 完全相同 |
| 2 | `tab-content-2/components/center-gis/components/gis/index.tsx` | **改** | import（`buildAggregatedPoints` + `GisCustomCircleView`）+ 4 个 useMemo + 1 个 VectorLayer + 2 个原图层 source + 替换 `CircleView` 为 `GisCustomCircleView` + `onShowCircle` 复原 neType + ElTooltipCircle `onItemClick` 复原 neType |
| 3 | `tab-content-2/components/center-gis/components/el-tooltip-circle/index.tsx` | **改** | 加 `onItemClick` 可选 prop（与 tab1 实现一致） |

> 按 SKILL.md 约定，tab1/tab2 严格隔离，不抽公共组件。`buildAggregatedPoints.ts` 在两个目录下各一份。

---

## 4. 新增 `utils/buildAggregatedPoints.ts`

> 算法与 tab1 的 `web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/utils/buildAggregatedPoints.ts` **完全相同**，仅文件路径在 `tab-content-2/` 下。

### 4.1 关键代码片段

```ts
const AGGREGATE_TOLERANCE = 5e-5; // 5m
const AGGREGATE_GRID_SIZE = 1e-3; // 100m 一格

export function buildAggregatedPoints(points) {
    if (!points || points.length === 0) return [];

    // 1) 粗分桶
    const buckets = new Map();
    for (const p of points) {
        const gx = Math.floor(p.longitude / AGGREGATE_GRID_SIZE);
        const gy = Math.floor(p.latitude / AGGREGATE_GRID_SIZE);
        const key = `${gx}:${gy}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(p);
    }

    // 2) 桶内 + 9 邻域合并
    const groups = [];
    const consumed = new Set();

    for (const [key, pts] of buckets) {
        if (consumed.has(key)) continue;

        const group = [...pts];
        consumed.add(key);

        const [gx, gy] = key.split(':').map(Number);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nbKey = `${gx + dx}:${gy + dy}`;
                const nb = buckets.get(nbKey);
                if (!nb) continue;
                for (const np of nb) {
                    const anchor = group[0];
                    if (
                        Math.abs(anchor.longitude - np.longitude) < AGGREGATE_TOLERANCE &&
                        Math.abs(anchor.latitude - np.latitude) < AGGREGATE_TOLERANCE
                    ) {
                        group.push(np);
                    }
                }
            }
        }

        // 只输出 ≥2 个共点的组
        if (group.length > 1) {
            const anchor = group[0];
            groups.push({
                neType: 'aggregate',
                longitude: anchor.longitude,
                latitude: anchor.latitude,
                points: group.map((p) => ({
                    ...p,
                    rawNeType: p.neType,
                    neType: 'aggregate',
                    longitude: anchor.longitude,
                    latitude: anchor.latitude,
                })),
            });
        }
    }

    return groups;
}
```

---

## 5. 修改 `gis/index.tsx`

### 5.1 新增 import

```ts
import { buildAggregatedPoints } from '../../utils/buildAggregatedPoints';
import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView';
```

### 5.2 新增 4 个 useMemo（在 `dataTransmissionPoints` 之后）

```ts
// 聚合点：业务层跨图层（基站 + 机房）合并
const aggregatePoints = useMemo(() => {
    if (!dataStationPointsAll || !dataMachineryRoomPointsAll) return [];

    const stationFlat = dataStationPointsAll
        .filter((g) => ['201', '3201', '8104'].includes(g.neType))
        .flatMap((g) => g.points)
        .filter((p) => neTypeCheckList?.includes(p.neType) && stationTypeCheckList?.includes(p.isAlarm));

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

### 5.3 修改 `onShowCircle` 复原 neType

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L222-L229`：

```ts
// ⚠️ 当前实现：未复原 neType
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    setCirclePoints([]);
    setTimeout(() => {
        setCirclePoints(pointArr);
    }, 1);
};

// ✅ 改为：用 rawNeType 复原 neType
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

### 5.4 替换 `CircleView` 为 `GisCustomCircleView`

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L704-L712`：

```tsx
// ⚠️ 当前实现：原生 CircleView + 动态 overlayStyle.width
<CircleView
    visible={true}
    source={circlePoints}
    toolPupWindowId="toolTipWindowCircle2"
    onClick={onCircleClick}
    onMouseMove={onCirclePointMove}
    tooltipProperty={{ placement: 'top' }}
    overlayStyle={{ width: circlePoints.length > 10 ? 500 : 300 }}
/>

// ✅ 改为：GisCustomCircleView + 动态 radius（与 tab1 v0.4 一致）
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

> 同时需要从 fedx-gis 的 import 中移除 `CircleView`（若不再被其他地方使用），避免未使用告警。

### 5.5 修改原图层 source

| 图层 | 当前 source | 改为 |
|---|---|---|
| `layerMachineryRoomPoints` | `dataMachineryRoomPointsAll \|\| []` | `dataMachineryRoomPointsFiltered \|\| []` |
| `layerStationPoints` | `dataStationPoints \|\| []` | `dataStationPointsFiltered \|\| []` |

其他 props 不动。

### 5.6 新增 `layerAggregatePoints` VectorLayer

在 `layerStationPoints` 之后、`CircleView` 之前插入：

```tsx
{/* 聚合图层：业务层跨图层合并 → 触发 onShowCircle → 复用现有 CircleView */}
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
/>
```

> 与 tab1 的 `layerAggregatePoints` 配置完全一致（除了没有 `onClick`/`onMove`/`onClickOther`，与 tab2 现有图层风格保持一致——tab2 现有图层都有这些回调，聚合图层也建议补上以保持一致；但 tab1 聚合图层没补，为对称起见 tab2 也不补。**待 Review**：是否给聚合图层补 `onClick`/`onMove`/`onClickOther`？）

### 5.7 修改 ElTooltipCircle 调用加 onItemClick

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx#L731-L735`：

```tsx
// ⚠️ 当前实现：无 onItemClick
<ElTooltipCircle
    key="EteElTooltipCirclePopup2"
    source={circleTooltipSource}
    style={circleTooltipStyle}
></ElTooltipCircle>

// ✅ 改为：加 onItemClick，复原 neType 后派发
<ElTooltipCircle
    key="EteElTooltipCirclePopup2"
    source={circleTooltipSource}
    style={circleTooltipStyle}
    onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}
/>
```

---

## 6. 修改 `el-tooltip-circle/index.tsx`

> 与 tab1 实现完全一致。

`web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/el-tooltip-circle/index.tsx`：

```tsx
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
                        {/* ...现有 Row/Col 渲染不变... */}
                    </div>
                );
            })}
        </div>
    );
}
```

---

## 7. 数据流总览（tab2 版）

```
dataStationPointsAll + dataMachineryRoomPointsAll
       ↓
[新增 useMemo: aggregatePoints]
       ↓ 业务层网格桶跨图层合并
       ↓ 输出 [{ neType: 'aggregate', longitude, latitude, points: [{ ..., rawNeType, neType: 'aggregate' }] }]
       ↓
[新增 VectorLayer: layerAggregatePoints] (zIndex=1004)
       ↓ onShowCircle={onShowCircle}  ← 复用现有回调（回调内复原 neType）
       ↓ OL 命中同 key → 触发 onShowCircle(pointArr)
       ↓
【复原 neType】setCirclePoints(pointArr.map(p => ({ ...p, neType: p.rawNeType ?? p.neType })))
       ↓
【复用】现有 CircleView 显示圆圈（toolTipWindowCircle2）
【复用】onCirclePointMove → setCircleTooltipSource([point]) → 现有 ElTooltipCircle 显示列表
       ↓ 用户点列表项
       ↓
【复原 neType】onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}
       ↓
【复用】pointClick → 右屏派发（switch 分支按复原后的 neType 匹配）

并行：
【新增 useMemo】aggregatedCodes + dataStationPointsFiltered / dataMachineryRoomPointsFiltered
       ↓ 被聚合的点从原图层移除
       ↓ 喂给 layerStationPoints / layerMachineryRoomPoints
```

---

## 8. 与现有逻辑的关系（明确边界）

| 现有逻辑 | 我们的处理 |
|---|---|
| 4 个 useRequest（+ 区域配置 2 个） | **零改动** |
| 4 个现有 VectorLayer + `layerAreaLines` | **仅改 `layerMachineryRoomPoints` / `layerStationPoints` 的 source**；其他不动 |
| `onShowCircle` 回调 | **改**：进入 `setCirclePoints` 前复原 `rawNeType → neType` |
| `circlePoints` / `circleTooltipSource` / `circleTooltipStyle` state | **复用** |
| `onCirclePointMove` / `onCircleClick` | **复用**（弹层列表项点击走 `onItemClick`，不走 `onCircleClick`） |
| `pointClick` 函数 | **复用**（调用方负责把 `rawNeType` 复原为 `neType`） |
| `<CircleView>` 组件 | **替换**为 `GisCustomCircleView`（加 `radius` prop，与 tab1 一致） |
| `<ElTooltipCircle>` | 仅加 `onItemClick` 可选 prop |
| less 样式 | **零改动** |
| 后端 API | **零改动** |
| `currentArea` 区域聚焦逻辑 | **零改动**（聚合点不参与聚焦） |
| `gisFunc.showLayer` | **零改动**（聚合图层不进 neTypeList 遍历） |

---

## 9. tab2 vs tab1 关键差异对照

| 维度 | tab1 v0.4 | tab2 v0.1（本方案） |
|---|---|---|
| 数据源控制参数 | `props.zoneSelect` + `zoneId/zoneLevel` | `currentArea?.areaId` |
| CircleView 组件 | `GisCustomCircleView`（带 `radius`） | `GisCustomCircleView`（带 `radius`，与 tab1 一致） |
| toolPupWindowId | `toolTipWindowCircle1` | `toolTipWindowCircle2` |
| `setCirclePoints([])` 时序 | `flushSync` 包裹 | `setTimeout` 直接置空（保持现状，不补 flushSync） |
| `pointClick` 机房子分支 | 有 `1000501-1000505` | 无（走 default → 传输，**已知差异，不修复**） |
| 区域线图层 | 无 `layerAreaLines` | 有 `layerAreaLines`（不参与聚合） |
| 算法实现 | `tab-content-1/utils/buildAggregatedPoints.ts` | `tab-content-2/utils/buildAggregatedPoints.ts`（独立一份） |

---

## 10. 与 legend 的交互

> 与 tab1 完全一致，详见 tab1 方案 §3.7。这里只列 tab2 特化点。

| legend 字段 | tab2 来源 | 聚合层响应 |
|---|---|---|
| `neTypeCheckList` | `suddenNeTypeCheckList` 初始化 | `aggregatePoints` useMemo 依赖；重新计算时先按 neTypeCheckList 过滤 children |
| `stationTypeCheckList` | `'0,1'` 初始化 | 同上，过滤 `stationTypeCheckList.includes(p.isAlarm)` |
| `machineryRoomRepairLevel` | `setMachineryRoomRepairLevel` | `useRequest` refreshDeps → `dataMachineryRoomPointsAll` 更新 → 聚合自然重算 |
| `transRepairLevel` | `setTransRepairLevel` | 传输不参与聚合，无需处理 |
| `leftRepairNoticeParams?.intId` | 父组件派发 | 聚合点不参与聚焦；切到 `repairCheckList` 时 `neTypeCheckList` 变化 → 聚合重算 |

---

## 11. Mock 数据调研（tab2 能否复用 tab1 的 mock 数据）

### 11.1 项目 Mock 数据机制

项目无 `__mocks__/`、`fixtures/`、`*.test.*` 等单测目录。所有 mock 数据为静态 JSON 文件，集中在 `public/static/mock/emergency-support/`，通过 API 层的 `localMockUrl` 字段接入。

### 11.2 tab1 / tab2 打点 API 的 Mock 数据对应关系

| API | Mock 文件 | tab1 | tab2 | 说明 |
|---|---|---|---|---|
| `getEmergencyNormalGisStationPointsApi` | `middle-mapPointStation.json`（~2.7MB） | ✅ 共用 | ✅ 共用 | 基站打点（neType: 201/3201/8104/900/2011） |
| `getEmergencyNormalGisMachineryRoomPointsApi` | `middle-mapPointMachineryRoom.json`（~2.2MB） | ✅ 共用 | ✅ 共用 | 机房打点（neType: 10005/1000501-005） |
| `getEmergencyNormalGisTransmissionPointsApi` | `middle-mapPointTransmission.json`（~863KB） | ✅ 共用 | ✅ 共用 | 传输打点（不参与聚合） |
| `getEmergencyNormalGisSuppliesPointsApi` | **无 mock** | — | — | 应急物资（API 未设 `localMockUrl`） |
| `getMiddleMapAlarmTransmissionApi` | `middle-map-alarm-transmission.json` | ✅ 共用 | ✅ 共用 | 断点光缆 |
| `getEmergencySupportGisLinesApi`（tab1 独有） | `gis-lines.json` | ✅ | — | 日常保障区县边界连线（按 townName 分组） |
| `getEmergencySuddenGisLinesApi`（tab2 独有） | `gis-area-lines.json` | — | ✅ | 突发保障区域边界连线（按 flag 分组，线宽 3px） |
| `getEmergencySuddenGisAreaApi`（tab2 独有） | `unexpected-coverage-area.json` | — | ⚠️ 存在但 `localMockUrl` 被注释 | 突发区域列表 |

### 11.3 结论：tab2 **可以直接复用 tab1 的打点 mock 数据**

**关键事实**：tab1 和 tab2 的基站/机房打点 API 是**同一个函数**（`getEmergencyNormalGisStationPointsApi` / `getEmergencyNormalGisMachineryRoomPointsApi`），共用同一份 mock JSON 文件。差异仅在调用参数：

| 参数 | tab1 | tab2 |
|---|---|---|
| 第 1 参（zoneSelect） | `props.zoneSelect` | `{}` |
| 区域标识 | `zoneId` + `zoneLevel` | `currentArea?.areaId` |

但 mock 文件是静态 JSON，**不区分参数**——无论传什么 `areaId`/`zoneId`，返回的都是同一份数据。因此：

- ✅ tab2 聚合功能开发时，**无需新增 mock 数据**
- ✅ tab2 开启 mock 后，`dataStationPointsAll` / `dataMachineryRoomPointsAll` 拿到的数据与 tab1 **完全相同**
- ✅ `buildAggregatedPoints` 消费的是这两个 API 的返回值，tab2 复用同一算法 + 同一 mock 数据，聚合行为与 tab1 一致
- ✅ mock 数据中若存在经纬度相近（差值 < 5e-5）的点，会自然触发聚合

### 11.4 Mock 数据中的聚合触发情况

mock JSON 原始字段为 `objectClass` / `int_id` / `longitude` / `latitude` / `isAlarm` / `userlabel`，API 层内部将 `objectClass` 映射为 `neType`、`int_id` 映射为 `siteCode`。

mock 数据中是否有经纬度重叠的点：
- 基站 mock（`middle-mapPointStation.json`）约 2.7MB，覆盖陕西省大量基站
- 机房 mock（`middle-mapPointMachineryRoom.json`）约 2.2MB，覆盖大量机房
- **同址共站是常见场景**（基站 + 机房共址），mock 数据中大概率存在经纬度重叠的点

> 建议：联调时先开启 mock 验证聚合效果，确认 `buildAggregatedPoints` 输出非空聚合组。

### 11.5 tab2 独有 API 的 Mock 情况

| API | Mock 状态 | 影响 |
|---|---|---|
| `getEmergencySuddenGisAreaApi` | mock 文件存在但 `localMockUrl` 被注释 | tab2 区域列表走真实接口；若需 mock 测试，需取消注释 API 第 546 行的 `localMockUrl` |
| `getEmergencySuddenGisLinesApi` | ✅ 有 mock（`gis-area-lines.json`） | 区域边界连线可 mock |
| `insertEmergencySuddenGisAreaApi` | 无 mock（写操作） | 保存区域配置走真实接口 |

> 聚合功能不依赖区域列表/区域连线，只依赖基站/机房打点数据。因此即使区域相关 API 走真实接口，聚合功能仍可用 mock 数据验证。

---

## 12. 待 Review 事项

- [ ] 聚合图层 `layerAggregatePoints` 是否需要补 `onClick`/`onMove`/`onClickOther`？tab1 没补，tab2 为对称也不补；但 tab2 现有图层都有这些回调，是否要保持一致？
- [ ] tab2 的 `onShowCircle` 用 `setTimeout` 直接置空 `circlePoints`，不补 `flushSync` 是否会有圆圈不消失的回归？（tab1 补了 `flushSync` 解决此问题）
- [ ] tab2 `pointClick` 缺机房子分支 `1000501-1000505`，聚合后用户点击机房子类型会走 `default` → 传输 Tab，是否要在本次顺手修复？（**建议不修**，超出聚合方案范围）
- [ ] `rawNeType` 命名是否与 tab1 保持一致？（建议一致，便于维护）
- [ ] tab2 聚合开发时是否直接复用 tab1 的 mock 数据（`middle-mapPointStation.json` + `middle-mapPointMachineryRoom.json`）？（✅ 调研结论：可以，两 Tab 共用同一份 mock，无需新增）
- [ ] 若需在 mock 环境验证 tab2 区域列表（`getEmergencySuddenGisAreaApi`），需取消注释 API 第 546 行的 `localMockUrl`；聚合功能本身不依赖此 API，是否需要？

---

> 版本：v0.1 · 2026-07-16 · tab2 对称 tab1 v0.4 实现
