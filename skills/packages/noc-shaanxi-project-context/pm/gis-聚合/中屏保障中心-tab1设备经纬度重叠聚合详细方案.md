# 中屏保障中心 · tab1 设备经纬度重叠聚合 — 详细实现方案

> **实施状态：已完成**

> 状态：**v0.4 · 待 Review（已引入 rawNeType 概念）**
> 作者：MiniMax-M3
> 日期：2026-07-14
> 父文档：`.trae/documents/中屏保障中心-设备经纬度重叠聚合需求分析.md`
> 适用范围：**tab1（日常保障）** 详细方案。tab2 在 Phase 4 对称实现

---

## 0. 关键概念：`rawNeType`（v0.4 新增）

> 在 v0.3 基础上，用户引入了 `rawNeType` 字段解决"跨类型聚合图层"的问题。下面把这个概念沉淀到文档里。

### 0.1 为什么要引入 `rawNeType`

聚合组的所有 children 必须把 `neType` 改成 `'aggregate'`，否则：

- VectorLayer 把 `[{ neType: '201', points: [...] }, { neType: '3201', points: [...] }, ...]` 视为**多个图层**（按 neType 拆开），跨 neType 不会合并
- 即使塞进同一个图层，OL 内部的聚合 key 计算可能因为 neType 不同而走不同分支

→ 必须让所有 children **共享同一个 neType** 才能进入同一个 VectorLayer 分组，让 OL 内部按 csFixedNum 命中同 key 触发 `onShowCircle`。

**但是**，`pointClick(item)` 函数用 `item.neType` 决定派发到右屏哪个 Tab（无线/动环/BRAS/OLT/基站机房）。如果 `item.neType='aggregate'`，派发会失败。

→ 必须**同时保留原始 neType** 用于派发。

### 0.2 数据结构

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
        {
            ...原始字段,
            neType: 'aggregate',
            rawNeType: '10005',        // ← 另一个原始 neType
            longitude: 锚点经度,
            latitude: 锚点纬度,
        },
    ],
}
```

### 0.3 `rawNeType` 的使用位置

| 位置                                                                                    | 行为                                                      |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `buildAggregatedPoints.ts` 内部                                                         | 把原 neType 复制到 `rawNeType`，覆盖 `neType='aggregate'` |
| OL 内部                                                                                 | 只看 `latitude/longitude` 做 key 合并，**不读 neType**    |
| `pointClick(item)`                                                                      | 读 `item.neType` → 拿到 `'aggregate'` → 派发失败 ⚠️       |
| `onItemClick` 回调                                                                      | **必须**复原 neType 后再传给 `pointClick`                 |
| 详情接口 `getEmergencyGisPointDetailApi` / `getEmergencyGisPointMachineryRoomDetailApi` | 读 `point.neType` 决定走哪个接口                          |

---

## 1. 第一步：现有聚合机制（先把现状讲清楚）

> 在动手前，必须先把"现有聚合怎么做的"完整理解一遍。下面是基于实际代码（`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx`）梳理出的链路。

### 1.1 数据层（4 个 useRequest）

`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L76-L166`：

| useRequest key               | API 返回结构                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `dataStationPointsAll`       | `[{ neType: '201'\|'3201'\|'8104'\|'900'\|'2011', points: [{ siteCode, longitude, latitude, isAlarm, ... }] }, ...]` |
| `dataMachineryRoomPointsAll` | `[{ neType: '10005'\|'1000501'\|...\|'1000505', points: [...] }, ...]`                                               |
| `dataTransmissionPointsAll`  | 传输点（**不参与本次聚合**）                                                                                         |
| `dataSuppliesPointsAll`      | 应急点（**不参与本次聚合**）                                                                                         |

### 1.2 过滤层（2 个 useMemo）

`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L230-L246`：

```ts
const dataStationPoints = useMemo(() => {
    return dataStationPointsAll?.map((item) => ({
        neType: item.neType,
        points: item.points.filter((p) => stationTypeCheckList.includes(p.isAlarm)),
    }));
}, [dataStationPointsAll, stationTypeCheckList]);

const dataTransmissionPoints = useMemo(() => {
    return dataTransmissionPointsAll?.map((item) => ({
        neType: item.neType,
        points: item.points.filter((p) => transmissionTypeCheckList.includes(p.isAlarm)),
    }));
}, [dataTransmissionPointsAll, transmissionTypeCheckList]);
```

**机房没有 useMemo 过滤**——`dataMachineryRoomPointsAll` 直接喂给图层。

### 1.3 图层渲染（4 个 VectorLayer）

`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L683-L778`：

| 图层 id                    | source                       | zIndex | isGongZhanByType | isShowSamePoint | csFixedNum | onShowCircle |
| -------------------------- | ---------------------------- | ------ | ---------------- | --------------- | ---------- | ------------ |
| `layerSuppliesPoints`      | `dataSuppliesPointsAll`      | 1000   | true             | false           | ✓          | ✓            |
| `layerMachineryRoomPoints` | `dataMachineryRoomPointsAll` | 1001   | true             | false           | ✓          | ✓            |
| `layerTransmissionPoints`  | `dataTransmissionPoints`     | 1002   | true             | false           | ✓          | ✓            |
| `layerStationPoints`       | `dataStationPoints`          | 1003   | true             | false           | ✓          | ✓            |

### 1.4 OL 内部聚合（fedx-gis 源码层）

`gis-2d.js` 去混淆后的关键代码（**实测证据**）：

```js
const csFixedNum = props.csFixedNum;  // = emergencySupportGisConfig.csFixedNum = 6
const key = `${latitude.toFixed(csFixedNum)}-${longitude.toFixed(csFixedNum)}`;

if (!keys.includes(key) || isShowSamePoint) {
    groups.push({ key, value: [point] });
    keys.push(key);
} else {
    groups.forEach(g => g.key === key && g.value.push(point));
}

if (group.value.length === 1) {
    addPoint(layer, group.value[0], ...);
} else {
    const style = createBubbleStyle(group.value, ..., isGongZhanByType);
    addBubblePoint(layer, group.value, style, ..., isGongZhanByType);
    // ← 触发 onShowCircle(group.value)
}
```

**核心事实**：

- 聚合粒度 = `csFixedNum=6` → key 精度 `1e-6`° ≈ **0.11m**
- 同一个 neType 内做聚合，**不跨 neType**
- 跨图层（基站 + 机房）**完全不合并**

### 1.5 弹层显示（CircleView + ElTooltipCircle）

**两个独立 state**（`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L48-L50`）：

```ts
const [circlePoints, setCirclePoints] = useState<any>([]);
const [circleTooltipSource, setCircleTooltipSource] = useState<any>([]);
const [circleTooltipStyle, setCircleTooltipStyle] = useState<any>();
```

**回调链路**：

```ts
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    setCirclePoints([]);
    setTimeout(() => setCirclePoints(pointArr), 1);
};

const onCirclePointMove = (e) => {
    if (e.type === 'point' && !e.isOpticalCable) {
        setCircleTooltipSource([e]);
        setCircleTooltipStyle({ visibility: 'visible' });
    } else {
        setCircleTooltipStyle({ visibility: 'collapse' });
        setCircleTooltipSource(null);
    }
};

const onCircleClick = (point) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    if (!point.isOpticalCable) {
        pointClick(point);
    }
};
```

**CircleView 渲染**（`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L780-L788`）：

```tsx
<CircleView
    visible={true}
    source={circlePoints}
    toolPupWindowId="toolTipWindowCircle1"
    onClick={onCircleClick}
    onMouseMove={onCirclePointMove}
    tooltipProperty={{ placement: 'top' }}
    overlayStyle={{ width: 300 }}
/>
```

**ElTooltipCircle 渲染**（`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L856-L865`）：

```tsx
<div id="toolTipWindowCircle1">
    {circleTooltipSource && (
        <ElTooltipCircle key="EteElTooltipCirclePopup" source={circleTooltipSource} style={circleTooltipStyle} />
    )}
</div>
```

### 1.6 现有聚合的缺口（我们要补的）

| 缺口                             | 影响                                        |
| -------------------------------- | ------------------------------------------- |
| **跨图层（基站+机房）不合并**    | 同址的 245G 基站 + 机房各自打点，叠加显示   |
| **`csFixedNum=6` 容差几乎为零**  | 现实中经纬度相同但 OL 不同 key 的设备不聚合 |
| **`onCircleClick` 只派发单个点** | 弹层有 N 个设备，点击只进第 1 个            |
| **`ElTooltipCircle` 无点击事件** | 用户无法在弹层列表里选某一项                |

---

## 2. 第二步：增量设计

### 2.1 总体思路

```
dataStationPointsAll (基站) + dataMachineryRoomPointsAll (机房)
       ↓
【新增】业务层网格桶聚合 (utils/buildAggregatedPoints.ts)
       ↓ 输出 [{ neType: 'aggregate', longitude, latitude, points: [{ ...device, rawNeType, neType: 'aggregate', ... }] }]
       ↓
【新增】VectorLayer id="layerAggregatePoints"
       ↓ 接 onShowCircle={onShowCircle}（复用现有回调）
       ↓ OL 内部按 csFixedNum 命中同 key → 触发 onShowCircle(pointArr)
       ↓
【复用】setCirclePoints(pointArr) → 现有 CircleView 显示圆圈
【复用】onCirclePointMove → 现有 ElTooltipCircle 显示
       ↓ 用户 hover 圆圈时弹层显示"同址的所有设备"
       ↓
【扩展】ElTooltipCircle 加 onItemClick prop
       ↓ 列表项点击 → 复原 neType（rawNeType → neType） → pointClick(item) 复用派发
       ↓
【新增】原图层过滤：被聚合的 siteCode 从 dataStationPoints/dataMachineryRoomPointsAll 移除
       ↓ 避免同址重复显示
```

### 2.2 关键决策

| #   | 决策                                                                                                                                  | 依据                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **图标用 `aggregate/gongzhan{0/1}.png`（自动）**                                                                                      | 走 `onShowCircle` 复用 `CircleView`；MapContainer.view.imageUrl 模板 `${IMAGE_PATH}/emergency-support/map/{0}/{1}.png` 中 `{0}=neType`、`{1}=alarmLevel`，所以 children 的 `neType='aggregate'` + 共享 `isAlarm` 自动选 `aggregate/gongzhan{0/1}.png`。**这两张图已存在，无需新增**。 |
| 2   | **业务层预聚合让 OL 自动命中同 key**                                                                                                  | 不直接 push 到 `circlePoints`，让 OL 内部按 `csFixedNum` 触发 `onShowCircle`                                                                                                                                                                                                          |
| 3   | **新图层 source 结构用 `points: [{ ...device, neType: 'aggregate', rawNeType: 原 neType, longitude, latitude, siteCode, isAlarm }]`** | `rawNeType` 保留原始类型供 `pointClick` 派发                                                                                                                                                                                                                                          |
| 4   | **被聚合的点从原图层移除**                                                                                                            | 否则同址处既显示聚合圆圈又显示 N 个单点小图                                                                                                                                                                                                                                           |
| 5   | **弹层列表点击派发复用 `pointClick`，但要复原 neType**                                                                                | `neType` 已被覆盖为 `'aggregate'`，必须用 `rawNeType` 复原                                                                                                                                                                                                                            |
| 6   | **机房单独处理**                                                                                                                      | 机房 neType 不参与 `stationTypeCheckList` 过滤                                                                                                                                                                                                                                        |

> 📝 **历史纠错（v0.4 review）**：早期曾考虑 `group-point.png` 自定义图标。后经调研确认：聚合图标的图片路径规则由 `MapContainer.view.imageUrl` 模板决定，OL 内部按 `{neType}/{alarmLevel}` 自动替换；`aggregate/gongzhan{0/1}.png` 已在 `public/static/images/emergency-support/map/aggregate/` 下存在，**无需新增任何图标**。

### 2.3 业务层聚合的关键技巧

让同址点共享同一个 (longitude, latitude)，并且 `neType` 全部覆盖为 `'aggregate'`，原始 `neType` 保留到 `rawNeType`。

---

## 3. 第三步：改动文件清单（纯增量）

| #   | 文件                                                                         | 操作     | 类型                                                                                                                     |
| --- | ---------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `tab-content-1/components/center-gis/utils/buildAggregatedPoints.ts`         | **新增** | 业务层跨图层聚合（**带 rawNeType**）                                                                                     |
| 2   | `tab-content-1/components/center-gis/components/gis/index.tsx`               | **改**   | import + 4 个 useMemo + 1 个 VectorLayer + 2 个原图层 source + ElTooltipCircle onItemClick + **onItemClick 复原 neType** |
| 3   | `tab-content-1/components/center-gis/components/el-tooltip-circle/index.tsx` | **改**   | 加 `onItemClick` 可选 prop                                                                                               |

> ⚠️ **tab2 不在本文档范围**。Phase 4 时对称实现（按 SKILL.md 约定不抽公共）。

---

## 4. 新增 `utils/buildAggregatedPoints.ts`

### 4.1 关键代码片段（已引入 rawNeType）

```ts
groups.push({
    neType: 'aggregate',
    longitude: anchor.longitude,
    latitude: anchor.latitude,
    points: group.map((p) => ({
        ...p,
        rawNeType: p.neType, // ← 保留原始 neType
        neType: 'aggregate', // ← 覆盖为聚合标识
        longitude: anchor.longitude, // ← 强制共享锚经度
        latitude: anchor.latitude, // ← 强制共享锚纬度
    })),
});
```

完整代码见 `web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/utils/buildAggregatedPoints.ts`。

---

## 5. 修改 `gis/index.tsx`

### 5.1 现有 ElTooltipCircle 调用加 onItemClick + **复原 neType**

`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/gis/index.tsx#L898`：

```tsx
// ⚠️ 当前实现（v0.3）：未复原 neType，pointClick 拿到 neType='aggregate'，派发会失败
<ElTooltipCircle
    key="EteElTooltipCirclePopup"
    source={circleTooltipSource}
    style={circleTooltipStyle}
    onItemClick={(item) => pointClick(item)}
/>

// ✅ v0.4 必须改为：用 rawNeType 复原 neType 后再派发
<ElTooltipCircle
    key="EteElTooltipCirclePopup"
    source={circleTooltipSource}
    style={circleTooltipStyle}
    onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType || item.neType })}
/>
```

### 5.2 其他改动（v0.3 已完成）

| 改动                                 | 位置                        | 行数         |
| ------------------------------------ | --------------------------- | ------------ |
| 新增 import                          | 顶部                        | +1           |
| 新增 4 个 useMemo                    | dataTransmissionPoints 之后 | +55          |
| 改 `layerMachineryRoomPoints` source | line 738                    | 改 1 个 prop |
| 改 `layerStationPoints` source       | line 802                    | 改 1 个 prop |
| 新增 VectorLayer                     | layerStationPoints 之后     | +25          |

---

## 6. 修改 `el-tooltip-circle/index.tsx`

仅加 `onItemClick` 可选 prop，不改其他逻辑。

`web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/components/el-tooltip-circle/index.tsx`：

```tsx
<div
    className="content"
    key={item.siteCode || `${item.longitude}-${item.latitude}`}
    onClick={onItemClick ? () => onItemClick(item) : undefined}
    style={onItemClick ? { cursor: 'pointer' } : undefined}
>
```

---

## 7. 数据流总览

```
dataStationPointsAll + dataMachineryRoomPointsAll
       ↓
[新增 useMemo: aggregatePoints]
       ↓ 业务层网格桶跨图层合并
       ↓ 输出 [{ neType: 'aggregate', longitude, latitude, points: [{ ..., rawNeType, neType: 'aggregate' }] }]
       ↓
[新增 VectorLayer: layerAggregatePoints]
       ↓ onShowCircle={onShowCircle}  ← 复用现有回调
       ↓ OL 命中同 key → 触发 onShowCircle(pointArr)
       ↓
【复用】setCirclePoints(pointArr) → 现有 CircleView 显示圆圈
【复用】onCirclePointMove → setCircleTooltipSource([point]) → 现有 ElTooltipCircle 显示列表
       ↓ 用户点列表项
       ↓
【复原 neType】onItemClick={(item) => pointClick({ ...item, neType: item.rawNeType || item.neType })}
       ↓
【复用】pointClick → 右屏派发

并行：
【新增 useMemo】aggregatedCodes + dataStationPointsFiltered / dataMachineryRoomPointsFiltered
       ↓ 被聚合的点从原图层移除
       ↓ 喂给 layerStationPoints / layerMachineryRoomPoints
```

---

## 8. 与现有逻辑的关系（明确边界）

| 现有逻辑                                                            | 我们的处理                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 4 个 useRequest                                                     | **零改动**                                                       |
| 4 个现有 VectorLayer                                                | **仅改 source**：用过滤后的版本；其他 props 不动                 |
| `onShowCircle` 回调                                                 | **复用**                                                         |
| `circlePoints` / `circleTooltipSource` / `circleTooltipStyle` state | **复用**                                                         |
| `onCirclePointMove` / `onCircleClick`                               | **复用**（弹层列表项点击走 `onItemClick`，不走 `onCircleClick`） |
| `pointClick` 函数                                                   | **复用**（但调用方负责把 `rawNeType` 复原为 `neType`）           |
| `<CircleView>` 组件                                                 | **零改动**                                                       |
| `<ElTooltipCircle>`                                                 | 仅加 `onItemClick` 可选 prop                                     |
| less 样式                                                           | **零改动**                                                       |
| 后端 API                                                            | **零改动**                                                       |

---

## 9. v0.4 vs v0.3 关键变更

| 维度                    | v0.3                                 | v0.4                                           |
| ----------------------- | ------------------------------------ | ---------------------------------------------- |
| children 数据           | `neType='aggregate'`，无 `rawNeType` | `neType='aggregate'`，**`rawNeType` 保留原值** |
| OL 内部聚合             | 仍然可触发 `onShowCircle`            | 仍然可触发                                     |
| `pointClick(item)` 派发 | 失败（item.neType='aggregate'）      | 成功（onItemClick 处复原）                     |
| 文档 §0                 | 不存在                               | 新增 `rawNeType` 概念章节                      |

---

## 10. 待 Review 事项

- [ ] `rawNeType` 命名是否合理？（也可叫 `originalNeType` / `sourceNeType`）
- [ ] `onItemClick` 复原 neType 的写法 `item.rawNeType || item.neType` 是否要兼容单点场景？
- [ ] 当 `pointClick` 走 `getEmergencyGisPointDetailApi` 详情接口时，是否能正确读 `rawNeType` 决定走哪个接口？

---

> 版本：v0.4 · 2026-07-14 · 已引入 rawNeType 概念
