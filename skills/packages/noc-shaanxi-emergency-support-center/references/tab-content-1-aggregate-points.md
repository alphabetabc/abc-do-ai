# TabContent1 · 设备经纬度重叠聚合（跨图层跨 neType）

> **tab1 已实现**，tab2 也已实现（[tab-content-2-aggregate-points.md](tab-content-2-aggregate-points.md)，按 SKILL.md 约定两个 Tab 各自实现）。

把 `dataStationPointsAll`（基站 `neType: 201/3201/8104`）和 `dataMachineryRoomPointsAll`（机房 `neType: 10005*`）做**跨图层合并**，让同址设备显示成一个聚合点 + 弹层列表。

- 源文件：
    - 工具：[buildAggregatedPoints.ts](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/utils/buildAggregatedPoints.ts)
    - 接入：[gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx)
    - 弹层列表项点击：[el-tooltip-circle/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/el-tooltip-circle/index.tsx)

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
【复用】setCirclePoints(pointArr) → GisCustomCircleView 显示圆圈
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

> 这是整个方案最容易踩坑的点，单独成节。

### 3.1 为什么需要

聚合组的所有 children 必须 `neType='aggregate'`，否则 OL 内部按 `neType` 拆图层，跨 neType 不会合并。

但 `pointClick(item)` 用 `item.neType` 决定派发到右屏哪个 Tab（无线/动环/BRAS/OLT）。如果 `item.neType='aggregate'`，派发失败。

→ 必须**同时保留原始 neType** 用于派发。

### 3.2 数据结构

```ts
{
    neType: 'aggregate',                // 锚点：让 OL 识别为同一分组
    longitude: anchor.longitude,        // 锚点经度
    latitude: anchor.latitude,          // 锚点纬度
    points: [
        {
            ...原始字段,
            rawNeType: '201',           // ← 保留原始 neType
            neType: 'aggregate',        // ← 覆盖
            longitude: anchor.longitude, // ← 强制共享锚
            latitude: anchor.latitude,   // ← 强制共享锚
        },
        {
            ...原始字段,
            rawNeType: '10005',         // ← 另一个原始 neType
            neType: 'aggregate',
            longitude: anchor.longitude,
            latitude: anchor.latitude,
        },
    ],
}
```

### 3.3 责任分工

| 位置                                        | 行为                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `buildAggregatedPoints.ts`                  | 把原 `neType` 复制到 `rawNeType`，覆盖 `neType='aggregate'`；所有 children 共享锚的 `longitude / latitude` |
| OL 内部                                     | 只看 `latitude / longitude` + `neType` 做 key 合并（`toFixed(csFixedNum=6)`），**不读 rawNeType**          |
| `pointClick(item)`                          | 读 `item.neType` → `'aggregate'` → 直接派发会失败                                                          |
| `ElTooltipCircle.onItemClick`               | **必须**复原：`onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}`     |
| 详情接口 `getEmergencyGisPointDetailApi` 等 | 同样读 `point.neType` 决定走哪个接口，所以复原必须在调用 `pointClick` **之前**                             |

---

## 4. `buildAggregatedPoints.ts` 实现

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

### 4.3 当前实现的几个细节

- `MAX_AGGREGATE_OUTPUT` 熔断代码目前**被注释掉**（实测数据量未到阈值，暂不启用）
- 输出 key 用 `points`（不是 `children`）—— 这是为了和 OL VectorLayer 的 source 结构对齐（`[{ neType, points: [...] }, ...]`）
- 输入参数是一个扁平数组（基站 + 机房已经在调用方 `flatMap` 过）

---

## 5. `gis/index.tsx` 改动

### 5.1 4 个 useMemo

完整代码（[gis/index.tsx:259-299](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L259-L299)）：

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

### 5.2 与 legend 的协作

`aggregatePoints` useMemo 的依赖包含 `neTypeCheckList` 和 `stationTypeCheckList`，所以：

- 取消勾选基站/机房图例 → 聚合 useMemo 重算 → 聚合点自动消失（避免鬼影）
- 勾选退服子图例 `'0,1'` 过滤 → `stationTypeCheckList.includes(p.isAlarm)` 过滤 → 聚合点 children 跟着变

> **不要**试图在 `aggregatePoints` 外层再套一层 `useEffect` 监听 legend —— `onViewSetChange` 的 `flushSync + setTimeout` 栅栏已经保证了渲染时序，`useMemo` 重算会自动复用这个时序，不需要额外处理。

### 5.3 新 VectorLayer

完整代码（[gis/index.tsx:847-870](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L847-L870)）：

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

> **关键 prop 解读**：
>
> - `isGongZhanByType={true}`：让 OL 内部走共址聚合分支
> - `csFixedNum={emergencySupportGisConfig.csFixedNum}`：`emergencySupportGisConfig.csFixedNum = 6`，OL 用 `toFixed(6)` 做 key 合并
> - `zIndex={1004}`：在原图层（1000–1003）之上，避免被单点小图压住

### 5.4 原图层 source 替换

改动只发生在 `source` 一行（其他 props 不动），完整对照：

| 图层                       | 改前 source                  | 改后 source                               | 位置                                                                                                                                          |
| -------------------------- | ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `layerMachineryRoomPoints` | `dataMachineryRoomPointsAll` | `dataMachineryRoomPointsFiltered \|\| []` | [gis/index.tsx#L752](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L752) |
| `layerStationPoints`       | `dataStationPoints`          | `dataStationPointsFiltered \|\| []`       | [gis/index.tsx#L816](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L816) |

> ⚠️ **机房图层不要漏过滤**——`dataMachineryRoomPointsFiltered` 不可漏，否则同址处会同时显示聚合圆圈 + 机房单点。
> ⚠️ **`\|\| []` fallback**：原图层 source 都加了 `\|\| []`，避免 `*Filtered` 为 `undefined` 时 OL 内部炸错。`aggregatePoints` useMemo 始终返回数组所以不需要。

### 5.5 `ElTooltipCircle` 加 `onItemClick`

```tsx
<ElTooltipCircle
    key="EteElTooltipCirclePopup"
    source={circleTooltipSource}
    style={circleTooltipStyle}
    onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType ?? item.neType })}
/>
```

> **复原 neType 的 fallback**：`item.rawNeType ?? item.neType`。当 `circleTooltipSource` 是非聚合来源（比如未来新增的单点分支），`rawNeType` 不存在，fallback 到原 `neType`，派发依然正常。

---

## 6. `el-tooltip-circle/index.tsx` 改动

完整代码（[el-tooltip-circle/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/el-tooltip-circle/index.tsx)）：

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
                        <Row gutter={24}>
                            <Col span={10}>
                                <span className="tip-name">网元名称：</span>
                            </Col>
                            <Col span={14}>
                                <span className="tip-value">{item?.siteName}</span>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={10}>
                                <span className="tip-name">网元经度：</span>
                            </Col>
                            <Col span={14}>
                                <span className="tip-value">{item?.longitude}</span>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={10}>
                                <span className="tip-name">网元纬度：</span>
                            </Col>
                            <Col span={14}>
                                <span className="tip-value">{item?.latitude}</span>
                            </Col>
                        </Row>
                    </div>
                );
            })}
        </div>
    );
}
```

### 改动点

| 项             | 改前                                                        | 改后                                                                                                                      |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 解构 prop      | `{ source, style }`                                         | `{ source, style, onItemClick }`                                                                                          |
| 容器 style     | `style ?? {}`（旧逻辑）                                     | `style !== undefined ? style : {}`（仅 `undefined` 时用 `{}`，`null` 视为合法）                                           |
| `.content` div | 无 `onClick` / `style`                                      | `onClick={onItemClick ? () => onItemClick(item) : undefined}` + `style={onItemClick ? { cursor: 'pointer' } : undefined}` |
| `key`          | `item.siteCode \|\| \`${item.longitude}-${item.latitude}\`` | 同                                                                                                                        |

### 兼容性

- `onItemClick` 是可选 prop；不传时：
    - 不挂 `onClick`（无点击事件）
    - 不挂 `cursor: pointer`
    - 行为与之前完全一致
- tab2 也有独立的 `el-tooltip-circle` 组件，已同步加 `onItemClick`，详见 [tab-content-2-aggregate-points.md](tab-content-2-aggregate-points.md)

### key 设计

`key={item.siteCode || \`${item.longitude}-${item.latitude}\`}`—— 聚合场景下每个 children 的 `siteCode`是原始值（不是`'aggregate'`），所以用 `siteCode` 做 key 即可；理论上不会重复。

---

## 7. 与现有逻辑的边界

| 现有逻辑                                                            | 处理                                            |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| 4 个 useRequest（基站/机房/传输/应急）                              | **零改动**                                      |
| `dataStationPoints` / `dataMachineryRoomPointsAll` 过滤             | **保留原版**，新增 `*Filtered` 版本用于图层渲染 |
| 4 个 VectorLayer 中 2 个 source                                     | 替换为 `*Filtered`；其他 props 不动             |
| `onShowCircle` 回调                                                 | **零改动**（聚合图层和原图层共用）              |
| `circlePoints` / `circleTooltipSource` / `circleTooltipStyle` state | **零改动**                                      |
| `onCirclePointMove` / `onCircleClick`                               | **零改动**                                      |
| `pointClick(point)`                                                 | **零改动**（调用方负责复原 neType）             |
| `<GisCustomCircleView>`                                             | **零改动**（仍是 tab1 的本地增强版）            |
| `<ElTooltipBase>`                                                   | **零改动**                                      |
| less 样式                                                           | **零改动**                                      |
| 后端 API                                                            | **零改动**                                      |

---

## 8. 数据流图（实现版）

```
dataStationPointsAll (useRequest)
    │  neType: 201/3201/8104
    │  points: [{ siteCode, longitude, latitude, isAlarm, neType, ... }]
    ▼
dataStationPoints (useMemo: 退服子图例过滤)
    ▼
dataStationPointsFiltered (useMemo: 移除被聚合的 siteCode)  ←──┐
    ▼                                                            │
<VectorLayer id="layerStationPoints" source={dataStationPointsFiltered \|\| []} />│
                                                                  │    │
dataMachineryRoomPointsAll (useRequest)                          │    │
    │  neType: 10005/1000501~005                                 │    │
    ▼                                                            │    │
dataMachineryRoomPointsFiltered (useMemo: 移除被聚合的 siteCode)←─┤    │
    ▼                                                            │    │
<VectorLayer id="layerMachineryRoomPoints" source={dataMachineryRoomPointsFiltered \|\| []} />    │    │
                                                                  │    │
        ┌─────────────────────────────────────────────────────────┘    │
        │                                                              │
        ▼                                                              │
aggregatePoints (useMemo: buildAggregatedPoints)                       │
        │ 依赖: dataStationPointsAll, dataMachineryRoomPointsAll,      │
        │       neTypeCheckList, stationTypeCheckList                  │
        │ 输出: [{ neType: 'aggregate', longitude, latitude,           │
        │         points: [{ ..., rawNeType, neType: 'aggregate' }] }] │
        ▼                                                              │
<VectorLayer id="layerAggregatePoints" source={aggregatePoints}        │
        isGongZhanByType={true}, csFixedNum={6}, zIndex=1004           │
        onShowCircle={onShowCircle}                                    │
        │                                                              │
        ▼ OL 内部: 共享锚坐标 + neType='aggregate' → toFixed(6) 同 key   │
        ▼                                                              │
onShowCircle(pointArr) → setCirclePoints(pointArr) → GisCustomCircleView
        │                                                              │
        ▼                                                              │
onCirclePointMove(point) → setCircleTooltipSource([point])              │
        ▼                                                              │
<ElTooltipCircle source={circleTooltipSource}                          │
                   onItemClick={(item) => pointClick({ ...item,         │
                                       neType: item.rawNeType ?? item.neType })} /> ─┘
```

---

## 9. 关键决策与取舍

> 本节沉淀"为什么这样实现"，帮助维护者理解代码结构而不是把它当 hack 看待。
> 这些决策的依据来自对实际行为的反推（imageUrl 模板、OL 内部聚合逻辑等），**不是凭空**。

### 9.1 为什么用 `aggregate/gongzhan{0/1}.png` 而不是 `group-point.png`

`MapContainer.view.imageUrl` 是个模板字符串，OL 内部按 `imageUrl.format(neType, alarmLevel)` 渲染点位图标。聚合 children 把 `neType` 全部覆盖为 `'aggregate'`，`isAlarm` 共享（0 / 1），OL 自动选：

```
public/static/images/emergency-support/map/aggregate/gongzhan{0|1}.png
```

**这两张图已存在**，无需新增任何图标资源。

> ⚠️ **维护约束**：不要去新增 `group-point.png` 这类自定义图标，OL 内部不会用。聚合图标走 `imageUrl` 模板机制。如果你需要新的图标状态，在 `public/static/images/emergency-support/map/aggregate/` 下加 `gongzhan{2,3,...}.png`（即扩展 alarmLevel），OL 自动识别。

### 9.2 为什么需要 `rawNeType`

聚合 children 必须 `neType='aggregate'`，否则：

- OL 按 `neType` 拆图层，跨 neType 不会合并
- 即使塞进同图层，OL 内部按 `csFixedNum` 合并的 key 计算可能因为 neType 不同而走不同分支

但 `pointClick(point)` 用 `item.neType` 决定派发到右屏哪个 Tab。`neType='aggregate'` 派发失败。

→ **构造时**把原 `neType` 复制到 `rawNeType`；**调用 `pointClick` 前**用 `rawNeType` 复原 `neType`。

### 9.3 为什么聚合 useMemo 依赖 `neTypeCheckList` 和 `stationTypeCheckList`

- `neTypeCheckList`（主图例）：用户取消勾选某 neType 后，该 neType 的单点不再显示；如果聚合组 children 还包含这个 neType，聚合点会显示但里面有空 children → **鬼影**
- `stationTypeCheckList`（退服子图例）：用户只想看「退服」时，正常的 2G/4G/5G 不应出现在 children 中

→ `aggregatePoints` useMemo 在依赖变化时重算，按 legend 重新过滤 children，保证聚合点视觉与 legend 一致。

> ⚠️ **机房不过 `stationTypeCheckList`**：机房 neType（`10005*`）和基站 neType（`201/3201/8104`）走不同的子图例。机房只过滤 `neTypeCheckList`（参见 §5.1 `roomFlat` 写法）。

### 9.4 为什么聚合点不参与抢修回流 / 乡镇下钻

- 抢修回流（`leftRepairNoticeParams?.intId`）：聚焦目标是单点，聚合点本身没有 `intId`。若聚合 children 中恰好包含 `intId` 对应的设备，让用户点聚合点 → 列表里点该项进右屏（**不**做服务端聚焦）
- 乡镇下钻：聚焦/切换地图级别由 `MapContainer` 处理，聚合图层不参与级别切换

> 这两条是**有意的不做**，不是漏写。如果业务上要"聚合点参与回流"，要先讨论清楚语义，不要直接改。

---

## 10. 明确未实现 / 不要按需求文档去补

> 本节列出"曾被讨论但**未实现**"的能力。维护时如果发现代码里没有对应逻辑，**不要主动补**——除非有明确的增量开发任务。

| 未实现的能力                      | 状态                         | 说明                                                                                                                                  |
| --------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 自定义图标 `group-point.png`      | **不实现**                   | OL 内部走 `imageUrl` 模板即可（见 §9.1）                                                                                              |
| `.aggregate-badge` 角标 CSS       | **不实现**                   | OL 用 `gongzhan{level}.png` 内置气泡样式，角标数字由 OL 内部生成（`e.length.toString()`）                                             |
| `formatCount(n)` 99+ 熔断         | **不实现**                   | OL 内部已处理大数字渲染；不需要业务层做                                                                                               |
| `gisFunc.showLayer` 控制聚合图层  | **不实现**                   | `layerParam.neType` 是 `neTypeList` 单值，聚合点 children 是 1:N，遍历控制不到；聚合图层自动响应 `aggregatePoints` useMemo 的空值卸载 |
| 业务层 OL 投影做角标              | **不实现**                   | OL 自己画角标，业务层不要碰                                                                                                           |
| `MAX_AGGREGATE_OUTPUT = 600` 熔断 | **代码里有常量但判断被注释** | 当前数据量未到阈值，暂不启用                                                                                                          |

---

## 11. 易踩坑

- **`rawNeType` 命名与复原位置**：永远是「构造时复制 → 调用前复原」。如果中间任何一层漏写复原，`pointClick` 收到的就是 `'aggregate'`，派发失败
- **`csFixedNum` 必须传**：`layerAggregatePoints` 的 `csFixedNum={emergencySupportGisConfig.csFixedNum}` 不传等于 0，OL 不会按精度合并，聚合点不会被识别为「同 key」
- **`zIndex=1004`**：必须 > 原图层（1003），否则聚合点被基站小图压住
- **机房图层也要过滤**：`dataMachineryRoomPointsFiltered` 不可漏，否则同址处会同时显示聚合圆圈 + 机房单点
- **熔断暂未启用**：`MAX_AGGREGATE_OUTPUT = 600` 的判断目前在代码里被注释掉；如果未来数据量增长到会触发熔断的阈值，需要打开那段注释
- **不要用 `key` 让 `GisCustomCircleView` 重挂载**：详见 [tab-content-1-gis-full.md § `flushSync` 与 setTimeout 栅栏](tab-content-1-gis-full.md)，直接 DOM 操作会导致 `removeChild` 报错
- **`aggregatePoints` useMemo 依赖要包含 legend**：否则取消勾选图例后聚合点不消失（鬼影）

---

> 版本：v1.0 · 创建日期：2026-07-14
