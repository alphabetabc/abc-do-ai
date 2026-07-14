# ResourceUsage 子组件

[dispatch-tasks/resource-usage/index.tsx](apps/main/app/components/right/dispatch-tasks/resource-usage/index.tsx) 实现"抢修资源"——左侧水球图 + 右侧 3 个环饼图（队伍/人员/油机）。

## 职责概览

| 职责 | 说明 |
| --- | --- |
| 数据请求 | `getEmergencyDispatchResourceUsageApi` 一次性返回 `{ liquidValue, pieData }` |
| 水球图 | ECharts `liquidFill`，`dataChart.liquidValue / 100` |
| 环饼图 | 每个 `pieData` 一张，圆环 50%-80%，左侧总数 + 右侧图例 |
| 资源图标 | `graphic.image` 居中显示（队伍/人员/油机） |

## 数据契约

`getEmergencyDispatchResourceUsageApi` 返回（参见 `apps/main/request/custom/right.ts`）：

```typescript
{
    liquidValue: number,  // 0-100，已乘 100
    pieData: [
        { type: 1, typeName: "队伍", totalNum: string, taskNum: string, closeNum: string },
        { type: 2, typeName: "人员", totalNum: string, taskNum: string, closeNum: string },
        { type: 3, typeName: "油机", totalNum: string, taskNum: string, closeNum: string },
    ]
}
```

> **兜底逻辑**：API 内部若 `err || isEmpty(rows)`，自动返回 `{ liquidValue: 0, pieData: [...3 个全 0] }`。

## 水球图

```typescript
const liquidOption = useMemo(() => ({
    series: [{
        type: "liquidFill",
        radius: "90%",
        center: ["50%", "50%"],
        data: [dataChart.liquidValue / 100],   // 0-1
        label: { formatter: `${dataChart.liquidValue}%`, fontSize: 30, fontWeight: 700 },
        outline: { show: true, borderDistance: 5, itemStyle: { borderWidth: 3, borderColor: "rgba(92, 108, 126, 1)" } },
        color: [new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 149, 255, 1)" },
            { offset: 1, color: "rgba(7, 55, 89, 1)" },
        ])],
        backgroundStyle: { color: "transparent" },
    }],
}), [dataChart.liquidValue]);
```

- **数据范围**：水球图要求 0-1，所以传入 `liquidValue / 100`。
- **label formatter**：直接显示 `${liquidValue}%`，保留 2 位小数（接口内 `toFixed(2)`）。
- **颜色**：线性渐变 `rgba(0, 149, 255, 1)` → `rgba(7, 55, 89, 1)`。
- **依赖**：必须带 `dataChart.liquidValue`，否则数字不更新。

## 环饼图

`generateChartOption(pie)` 为每个 `pieData` 项生成独立 ECharts 配置：

```typescript
const seriesData = [
    {
        name: "任务中",
        value: parseInt(pie.taskNum || 0),
        itemStyle: { color: "rgba(22, 223, 241, 1)" },   // 青色
    },
    {
        name: "空闲",
        value: parseInt(pie.closeNum || 0),
        itemStyle: { color: "rgba(251, 212, 103, 1)" },  // 金黄
    },
];
```

ECharts 配置关键点：

| 字段                          | 值                                                |
| ----------------------------- | ------------------------------------------------- |
| `type`                        | `pie`                                             |
| `radius`                      | `["50%", "80%"]`（环宽 30）                       |
| `center`                      | `["30%", "45%"]`（左偏，与右侧图例错开）          |
| `label`                       | `show: false`                                     |
| `labelLine`                   | `show: false`                                     |
| `emphasis`                    | `disabled: true`（鼠标划入不放大）                |
| `legend.right`                | `"1%"`                                            |
| `legend.formatter`            | `\`${name} ${item?.value}\``（图例带数字）         |

### 资源图标（graphic）

```typescript
graphic: [{
    type: "image",
    left: "22%",
    top: "31%",
    width: 38,
    height: 38,
    style: {
        image: pie.type === 1 ? iconPie1.src : pie.type === 2 ? iconPie2.src : iconPie3.src,
    },
    z: 10,
}]
```

| `pie.type` | 图标                | typeName |
| ---------- | ------------------- | -------- |
| `1`        | `iconPie1`（队伍）  | 队伍     |
| `2`        | `iconPie2`（人员）  | 人员     |
| 其它       | `iconPie3`（油机）  | 油机     |

图标资源来自 `@/images/resource-{队伍|人员|油机}.png`。

## 布局

```tsx
<div className="dispatch-tasks-resource-usage-content">
    <div className="dispatch-tasks-resource-usage-liquid">
        <ReactECharts option={liquidOption} />
    </div>
    <div className="right-part flex justify-between items-center gap-x-2.5">
        {dataChart.pieData?.map((item, index) => (
            <div className="dispatch-tasks-resource-usage-child">
                <div className="dispatch-tasks-resource-usage-header">
                    <div className="dispatch-tasks-resource-usage-title">{item.typeName}</div>
                </div>
                <div className="dispatch-tasks-resource-usage-pie">
                    <div className="dispatch-tasks-resource-usage-pie-total">
                        <div className="...-total-text">{item.typeName}总数</div>
                        <div className="...-total-value">{item.totalNum || 0}</div>
                    </div>
                    <ReactECharts option={generateChartOption(item)} style={{ width: 250 }} />
                </div>
            </div>
        ))}
    </div>
</div>
```

- 容器高度固定 180px。
- 左：水球图（150×130）。
- 右：3 个饼图卡片（min-width 440，flex: 1）。

## 轮询

```typescript
const { interval = 300 } = useEnvironment("gd-emergency-support.modules.dispatch-tasks-resource-usage.request") ?? {};

const { data: dataChart } = useRequest(
    () => getEmergencyDispatchResourceUsageApi({ ... }),
    {
        ready: isDefined(taskId) && isDefined(currentZone),
        refreshDeps: [taskId, currentZone, timeRange, professionalType],
        pollingInterval: interval * TIME_RANGE.SECOND,
    }
);
```

`ready` 守卫：`isDefined(taskId) && isDefined(currentZone)`（**不要求** `professionalType`，与 DispatchSummary 不同）。

## 扩展建议

### 新增资源类型（如"应急车辆"）

1. `apps/main/request/custom/right.ts` → `getEmergencyDispatchResourceUsageApi` 内部追加 `{ type: 4, typeName: "应急车辆", ... }`。
2. 新增图标 `apps/main/images/resource-应急车辆.png`。
3. `generateChartOption` 三元判断改为 `switch (pie.type)`。
4. 检查 `dataChart.pieData` 长度（可能需要调整 `right-part` 布局）。

### 修改水球图颜色

- `color: [new echarts.graphic.LinearGradient(0, 0, 0, 1, [...])]`。
- `outline.itemStyle.borderColor` 改为对应配色。

### 调整环饼图位置

- `center: ["30%", "45%"]` → 左偏 30%；右侧 `legend.right: "1%"`。
- 若图标偏移：`graphic.left: "22%", top: "31%"`。

## 相关文档

- [main.md](./main.md) — 主组件
- [dispatch-summary.md](./dispatch-summary.md) — 汇总子组件
- [api.md](./api.md) — 接口
- [style.md](./style.md) — 样式