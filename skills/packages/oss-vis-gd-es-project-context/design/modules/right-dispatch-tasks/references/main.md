# 主组件 DispatchTasks

[dispatch-tasks/index.tsx](apps/main/app/components/right/dispatch-tasks/index.tsx) 是整个抢修调度模块的容器与派发中枢。

## 职责概览

| 职责 | 说明 |
| --- | --- |
| 顶部工具条 | 日期范围选择器（RangePicker）+ 专业类型 Tab |
| 全局状态订阅 | `supportTask`（`eventStartTime`/`eventEndTime`/`wdId`）、`currentZone` |
| 时间区间双轨 | `timeRange`（用户选择）→ `timeRangeParams`（入参 end 补 `23:59:59`） |
| 子组件派发 | `<DispatchSummary>` + `<ResourceUsage>`，透传 4 个 props |
| 容器布局 | `Box`（宽 1570，高 955）+ 两个 `dispatch-tasks-container` 行 |

## 状态机

```typescript
const [state, setState] = useSetState<DispatchTasksState>({
    typeSelected: "无线专业",
    timeRange: ["", ""],          // RangePicker 双向绑定（YYYY-MM-DD）
    timeRangeParams: ["", ""],    // 实际入参（end 补 23:59:59）
});
```

## 时间区间双轨

```text
supportTask.eventStartTime ──┐
supportTask.eventEndTime   ──┴─▶ timeRange        (RangePicker 展示用)
                                            │
                                            ▼ useEffect
                                  timeRangeParams   (入参使用)
                                  start: timeRange[0]
                                  end:   timeRange[1] + " 23:59:59"
```

- `useEffect #1`：`supportTask` 变化时同步 `timeRange`。
- `useEffect #2`：`timeRange` 变化且两端非空时同步 `timeRangeParams`。
- 用户手动调整日期 → `onChange(dates, dateStrings)` → `setState({ timeRange: dateStrings })`。

## 专业类型 Tab

`typeSelected` 当前枚举：

```typescript
typeSelected: "无线专业" | "传输汇聚" | "传输接入" | "传输专业";
```

默认 `"无线专业"`。`传输汇聚` / `传输接入` 在 Tab 中已注释（保留扩展位）。

| typeSelected  | 是否启用 | 子组件差异（表格列、检索字段） |
| ------------- | -------- | ----------------------------- |
| `无线专业`    | ✅       | 油机（已用/总数）、卫星包；检索 stationName/faultName/car |
| `传输汇聚`    | ❌       | （保留位）                     |
| `传输接入`    | ❌       | （保留位）                     |
| `传输专业`    | ✅       | 基础列；检索 regionName/team/orderType；efficiencySelected 多出"汇聚层工单"/"接入层工单" |

## 子组件派发

主组件向两子组件透传：

| props              | 来源                                  |
| ------------------ | ------------------------------------- |
| `taskId`           | `supportTask?.wdId`                   |
| `currentZone`      | `currentZone`（含 `zoneId`/`zoneLevel`） |
| `timeRange`        | `state.timeRangeParams`               |
| `professionalType` | `state.typeSelected`                  |

`DispatchSummary` 与 `ResourceUsage` 互不依赖、独立轮询。

## 容器布局

```tsx
<Box title={"右侧-抢修调度"} titleBox={<TitleTabs />} width={1570} height={955}>
    {/* 第一行：调度汇总 */}
    <div className="dispatch-tasks-container">
        <div className="dispatch-tasks-header">
            <div className="dispatch-tasks-header-title text-[20px]">调度汇总</div>
            <div className="dispatch-tasks-header-right">
                <RangePicker ... />
                <专业 Tab />
            </div>
        </div>
        <DispatchSummary ... />
    </div>
    {/* 第二行：抢修资源 */}
    <div className="dispatch-tasks-container">
        <div className="dispatch-tasks-header">
            <div className="dispatch-tasks-header-title text-[20px]">抢修资源</div>
        </div>
        <ResourceUsage ... />
    </div>
</Box>
```

## 轮询

主组件本身不直接轮询，轮询由两子组件控制：

| 子模块            | 配置键                                                              |
| ----------------- | ------------------------------------------------------------------- |
| DispatchSummary   | `gd-emergency-support.modules.dispatch-tasks-summary.request`        |
| ResourceUsage     | `gd-emergency-support.modules.dispatch-tasks-resource-usage.request` |

详见 [style.md](./style.md) 与 [api.md](./api.md)。

## 相关文档

- [dispatch-summary.md](./dispatch-summary.md) — 汇总子组件
- [resource-usage.md](./resource-usage.md) — 资源子组件
- [api.md](./api.md) — 接口
- [style.md](./style.md) — 样式