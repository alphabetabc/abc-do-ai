# Detail 详情弹窗

本文档描述 `apps/main/app/components/right/network-compact/network-scale/Detail.tsx` 的实现细节。

> 📌 简略引用见 [main-render-flow.md §6](./main-render-flow.md#6-顶部与底部容器)。本文档是它的展开版。
> 📌 配套组件 [fault-list-table.md](./fault-list-table.md) — 故障清单弹窗，由 Detail 触发。

## 目录

- [§1 组件定位](#1-组件定位)
- [§2 组件 Props](#2-组件-props)
- [§3 强制 remount 机制](#3-强制-remount-机制)
- [§4 内部状态](#4-内部状态)
- [§5 折线图（故障趋势）](#5-折线图故障趋势)
- [§6 柱状图（区域统计）](#6-柱状图区域统计)
- [§7 故障清单入口](#7-故障清单入口)
- [§8 布局结构](#8-布局结构)
- [§9 常见维护任务](#9-常见维护任务)

---

## 1. 组件定位

`Detail` 是 NetworkScale 主组件的"详情子组件"，**始终挂载**（不在 `props.open` 守卫内），由 `currentActiveIndItem` 是否为 `null` 决定显示空状态还是内容。

| 触发                    | 来源                                        | 行为                                                                                                                   |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **用户点击卡片**        | `handleIndClick` → setState `activeIndItem` | 选中项更新，Detail 显示对应指标的图表                                                                                  |
| **数据更新 / 区域切换** | `useEffect [data]`                          | 重新匹配 activeItem（详见 [main-render-flow.md §5.4](./main-render-flow.md#54-组合-id-重映射idmap--已确认为冗余逻辑)） |
| **柱状图点击**          | `barChartEvents.click`                      | 触发 `onShowDetailList({ type: "part", dataItem })` → 打开 FaultListTable 弹窗                                         |
| **故障清单链接**        | `<span>故障清单</span>` onClick             | 触发 `onShowDetailList({ type: "all" })` → 打开 FaultListTable 弹窗（全量）                                            |

---

## 2. 组件 Props

| Prop               | 类型             | 说明                                                                         |
| ------------------ | ---------------- | ---------------------------------------------------------------------------- |
| `indItem`          | `any`            | 当前选中的指标项（来自 `currentActiveIndItem`）。`null` 时 Detail 不渲染图表 |
| `currentZone`      | `any`            | 当前区域（用于 API 请求参数）                                                |
| `modalVisible`     | `boolean`        | 故障清单弹窗是否打开（仅控制链接颜色）                                       |
| `onShowDetailList` | `(info) => void` | 显示故障清单回调。`info.type = "all" \| "part"`                              |

---

## 3. 强制 remount 机制

```jsx
<Detail
    key={`detail-${currentZone?.zoneId ?? "unknown"}`}
    indItem={currentActiveIndItem}
    ...
/>
```

### 为什么需要 `key`

Detail 内部有这些"跨周期状态"：

- `state.currentTrendChartTimeRange`：折线图时间选择器
- 折线图 / 柱状图的 `useRequest` 缓存
- `barChartInstanceRef`：柱状图实例 ref

如果切换区域时 **不 remount**：

- 折线图会保留上一个区域的 `dataTime`，导致图表坐标轴错位
- 柱状图实例可能引用过期的 `option`，引发 chart 未刷新
- 时间选择器（`currentTrendChartTimeRange`）会显示上一个区域的时间范围

通过 `key={detail-${zoneId}}`，React 在 `zoneId` 变化时**完整销毁并重建** Detail 组件，所有内部状态自动归零。

### ⚠️ 修改时务必保留

```jsx
key={`detail-${currentZone?.zoneId ?? "unknown"}`}
```

如果删掉这个 `key`，切换区域会出现：

- 折线图坐标轴不刷新
- 柱状图残留上一个区域的数据
- 时间选择器显示陈旧时间

---

## 4. 内部状态

```typescript
const [state, setState] = useSetState({
    currentTrendChartTimeRange: [] as any[], // 折线图时间范围
});
```

| 字段                         | 用途                                                    |
| ---------------------------- | ------------------------------------------------------- |
| `currentTrendChartTimeRange` | 折线图时间范围，初始化为 `data.dataTime` 的前一天到当天 |

### 初始化逻辑

```typescript
useEffect(() => {
    const initIndDataTime = get(props.indItem ?? {}, "data.dataTime");
    if (!initIndDataTime) {
        setState({ currentTrendChartTimeRange: [] });
        return;
    }
    const dataTime = dayjs(initIndDataTime);
    setState({
        currentTrendChartTimeRange: [dataTime.subtract(1, "d"), dataTime],
    });
}, [props.indItem]);
```

**关键点**：

- 依赖 `[props.indItem]`：当选中项变化（含首次）时重新初始化时间范围
- `data.dataTime` 来自 `right.ts` `getNetworkSituationApi`（详见 [presets-config.md §2.1](./presets-config.md#21-图表系列配置unitidsettings) 与 §2.3 轮询间隔）
- 如果 `dataTime` 为空（无选中项），不初始化，等下次有 `indItem` 时再初始化

---

## 5. 折线图（故障趋势）

### 5.1 入口

```typescript
const trendChartOption = useLineChartOption({
    currentRange: state.currentTrendChartTimeRange,
    currentZone: props.currentZone,
    unitId: props.indItem?.id,
});
```

### 5.2 数据流

```
props.indItem.id (kpiType, 单 ID 如 "14")
        ↓
useLineChartOption → 调 getRightNetworkScaleDetailLineChartDataApi
        ↓
返回 { xData, yData, preMonthSameData, historyPeekValue, historyPeekValueDataTime }
        ↓
useMemo → lineOption(xData, yData, preMonthSameData, historyPeekValueInfo)
        ↓
echarts-for-react 渲染
```

### 5.3 API 参数

```typescript
const requestParams = {
    kpiType: options.unitId, // 单 ID，如 "14"
    startTime: start.format("YYYY-MM-DD HH:mm:ss").toString(),
    endTime: end.format("YYYY-MM-DD HH:mm:ss").toString(),
    preMonthStartTime: preMonthStart.format("YYYY-MM-DD HH:mm:ss").toString(),
    preMonthEndTime: preMonthEnd.format("YYYY-MM-DD HH:mm:ss").toString(),
    zoneName: options.currentZone?.zoneName,
    zoneLevel: options.currentZone?.zoneLevel,
    parentName: "-1", // 默认
    regionName: "-1", // 默认
};
// 区域级别处理
if (currentZone.zoneLevel === ZoneLevelEnum.town) {
    requestParams.parentName = currentZone.cityName;
    requestParams.regionName = currentZone.regionName;
} else if (currentZone.zoneLevel === ZoneLevelEnum.city) {
    requestParams.parentName = currentZone.regionName;
}
```

### 5.4 折线图配置（DetailChartOption.tsx）

| 数据系列                       | 名称     | 颜色                    | 说明     |
| ------------------------------ | -------- | ----------------------- | -------- |
| `preMonthSameData`             | 上月同期 | `rgba(22, 223, 241, 1)` | 蓝色     |
| `historyPeakValue`（markLine） | 历史峰值 | `rgba(246, 191, 40, 1)` | 黄色横线 |
| `currentValueData`             | 当前值   | `rgba(13, 255, 122, 1)` | 绿色     |

### 5.5 ready 条件

```typescript
ready: isDefined(options.unitId) && isDefined(options.currentZone?.zoneName);
```

- `unitId` 必须有值（`indItem.id`）
- `zoneName` 必须有值
- 否则不发起请求

---

## 6. 柱状图（区域统计）

### 6.1 入口

```typescript
const barChartOption = useBarChartOption({
    dataTime: get(props.indItem ?? {}, "data.dataTime"),
    currentZone: props.currentZone,
    unitId: props.indItem?.id,
    onDataChange() {},
});
```

### 6.2 数据流

```
props.indItem.id
props.indItem.data.dataTime
        ↓
useBarChartOption → 调 getRightNetworkScaleDetailBarChartDataApi
        ↓
返回 { xData, yData }
        ↓
useMemo → barOption(xData, yData, axisLabelFormatter)
        ↓
echarts-for-react 渲染
```

### 6.3 API 参数

```typescript
const requestParams = {
    kpiType: options.unitId, // 单 ID
    zoneName: options.currentZone?.zoneName,
    zoneLevel: options.currentZone?.zoneLevel,
    dataTime: options.dataTime, // 来自 indItem.data.dataTime
    parentName: "-1",
    regionName: "-1",
};
// 区域级别处理同折线图
```

### 6.4 ready 条件

```typescript
ready: isDefined(options.unitId) && isDefined(options.currentZone?.zoneName);
```

### 6.5 柱状图配置

| 配置项   | 说明                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| 类型     | `bar`（堆叠：`stack: "stack"`）                                                |
| 柱宽     | 10                                                                             |
| 颜色     | 系列 0: `rgba(22, 223, 241, 1)`（青）<br>系列 1: `rgba(246, 191, 40, 1)`（黄） |
| 选中模式 | `disabled: false`（可点击）                                                    |

### 6.6 柱状图点击事件

```typescript
const barChartEvents = usePersistActions({
    click(params: any) {
        if (barChartInstanceRef.current && params.seriesType === "bar") {
            ...
            executable(props.onShowDetailList, { type: "part", dataItem: params.data.__raw });
        }
    },
});
```

**触发链路**：

1. 用户点击柱状图某根柱子
2. `params.seriesType === "bar"` 守卫
3. 调用 `props.onShowDetailList({ type: "part", dataItem: params.data.__raw })`
4. 主组件 `setState({ openFaultListModal: true, faultListTableInfo: info })`
5. `<FaultListTable open={true} faultListTableInfo={info}>` 渲染
6. **FaultListTable 根据 `type === "part"` 调对应 API**（详见 [fault-list-table.md §1.2](./fault-list-table.md#12-触发来源)）

**为什么用 `params.data.__raw`**：

echarts 在 `data` 字段下挂了一个 `__raw` 字段，存放原始数据（含 `dataTime` / `regionName` 等）。FaultListTable 需要这些字段来拼接 API 请求参数。

---

## 7. 故障清单入口

```jsx
<span
    className="pr-[15px] cursor-pointer text-[#0dff7a]"
    onClick={() => {
        executable(props.onShowDetailList, { type: "all" });
    }}
    style={{
        color: props.modalVisible ? "rgba(255, 252, 80, 1)" : "rgba(13, 255, 122, 1)",
    }}
>
    故障清单
</span>
```

**点击行为**：

- 触发 `onShowDetailList({ type: "all" })`（注意：没有 `dataItem`）
- 主组件 setState 打开 FaultListTable
- **FaultListTable 根据 `type === "all"` 调对应 API**（无 `dataItem`，用 `currentIndItem`）

**样式**：

- 默认：`rgba(13, 255, 122, 1)`（绿色）
- 弹窗打开：`rgba(255, 252, 80, 1)`（黄色，高亮）

---

## 8. 布局结构

```jsx
<div className="px-6.5 network-scale-detail" data-title="network-scale-detail" key={`roo-${props.currentZone?.zoneName}`}>
    {/* 标题栏 */}
    <div className="title flex justify-between">
        <span className="text-[20px]">{get(props, "indItem.detailTitle") ?? "详情"}</span>
        <span className="pr-[15px] cursor-pointer text-[#0dff7a]" onClick={...}>故障清单</span>
    </div>
    {/* 图表区 */}
    <div className="flex justify-between">
        <div className="w-[675px] pl-[6px]" data-title="故障趋势">  {/* 折线图 */}
            <div className="chart-title relative">
                <span>故障趋势</span>
                <RangePicker ... />
            </div>
            <div className="w-[665px] h-[210px]">
                <DataStatus loading={false} data={trendChartOption} emptyDescription="当前无故障">
                    <ReactECharts option={trendChartOption} ... />
                </DataStatus>
            </div>
        </div>
        <div className="w-[827px]" data-title="区域统计">  {/* 柱状图 */}
            <div className="chart-title">区域统计</div>
            <div className="w-full h-[210px]">
                <DataStatus loading={false} data={barChartOption} emptyDescription="当前无故障">
                    <ReactECharts option={barChartOption} ... onEvents={barChartEvents} />
                </DataStatus>
            </div>
        </div>
    </div>
</div>
```

### 关键尺寸

| 元素       | 尺寸            |
| ---------- | --------------- |
| 整体       | `px-6.5` 内边距 |
| 折线图容器 | `w-[675px]`     |
| 柱状图容器 | `w-[827px]`     |
| 图表高度   | `h-[210px]`     |

### 标题与无选中态

- 标题：`indItem.detailTitle`（来自 items 模板）
- 无选中（`indItem` 为 `null`）：标题显示"详情"（fallback）
- 无数据：图表区域显示 `DataStatus` 的 `emptyDescription="当前无故障"`

### `key={"roo-${zoneName}"}`（独立于外层 key）

Detail 内部 `div` 还有一个独立的 `key`：

```jsx
<div ... key={`roo-${props.currentZone?.zoneName}`}>
```

**为什么需要这个**：

- 外层 `key={detail-${zoneId}}`（在 `index.tsx`）让整个 Detail remount
- 内层 `key={roo-${zoneName}}` 仅让 `div` 重新渲染（不影响组件状态）
- 用于强制重置 div 的 DOM，**解决一些 antd 内部状态错位**（如 echarts canvas 重绘）

⚠️ **修改时同样要保留**，否则切区域时可能看到残留的 canvas / tooltip。

---

## 9. 常见维护任务

### 9.1 修改折线图 / 柱状图颜色

- 折线图 / 柱状图配置集中在 [DetailChartOption.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/right/network-compact/network-scale/DetailChartOption.tsx) 的 `lineOption` / `barOption` 中
- 修改后无需改 Detail.tsx
- 按 §6 配置驱动原则，**应避免在 Detail.tsx 写硬编码颜色**

### 9.2 修改图表高度 / 宽度

直接修改 Detail.tsx §8 中的 `w-[...]` / `h-[...]` 类名（或对应的 CSS 变量）。

### 9.3 添加新的图表

1. 在 [DetailChartOption.tsx](file:///e:/oss-visual-gd-emergency-support-next/apps/main/app/components/right/network-compact/network-scale/DetailChartOption.tsx) 中新增 `useXxxChartOption` hook
2. 在 Detail.tsx 中调用并用 `echarts-for-react` 渲染
3. 配置走 `environment.json` 而不是组件内硬编码

### 9.4 添加新的"故障清单"入口

直接在 Detail.tsx 标题栏添加一个 `<span onClick={onShowDetailList}>`，传入不同的 `info`（如 `{ type: "all", filter: "xxx" }`），并扩展 FaultListTable 的 type 枚举（详见 [fault-list-table.md §1.2](./fault-list-table.md#12-触发来源)）。

---

> 📌 关键文件清单见 [main-render-flow.md §8](./main-render-flow.md#8-关键文件)。
