# DispatchSummary 子组件

[dispatch-tasks/dispatch-summary/index.tsx](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.tsx) 实现"调度汇总"——顶部 3 个统计卡、效率 Tab、检索输入区、底部队伍/工单双表格。

## 职责概览

| 职责           | 说明                                                                 |
| -------------- | -------------------------------------------------------------------- |
| 顶部统计       | `getEmergencyDispatchSummaryApi` → 渲染 3 张卡片                     |
| 效率 Tab       | `队伍` / `工单`（无线专业）/ `汇聚层工单` / `接入层工单`（传输专业） |
| 检索输入区     | 根据 efficiencySelected + professionalType 切换 2~3 个 Input.Search  |
| 队伍表格       | `getEmergencyDispatchTeamApi` + 无线专业含油机/卫星包                |
| 工单表格       | `getEmergencyDispatchOrderApi` + Steps 工单状态                      |
| 行选中态       | store 字段 `sectionRight:selectedDispatchTeamOrOrder`                |
| Steps 工单状态 | 异常结束金黄色分支                                                   |

## 状态机

```typescript
const [state, setState] = useSetState({
    efficiencySelected: "队伍", // 队伍 | 工单 | 汇聚层工单 | 接入层工单
    regionName: "", // 队伍检索
    team: "", // 队伍检索
    stationName: "", // 工单检索（无线专业）
    faultName: "", // 工单检索（无线专业）
    car: "", // 工单检索（无线专业）
    orderRegionName: "", // 工单检索（传输专业）
    orderTeamName: "", // 工单检索（传输专业）
});

const { run: debouncedSetState } = useDebounceFn((key, value) => setState({ [key]: value }), { wait: 200, leading: false, trailing: true });
```

> 输入用 200ms 防抖；点击搜索按钮 `onSearch` 立即生效。

## 顶部统计

```tsx
const SummaryImages = ["sheet-00.svg", "sheet-01.svg", "sheet-02.svg"];

{
    dataSummary.map((item, index) => (
        <div className="dispatch-tasks-dispatch-summary-top-item">
            <div className="dispatch-tasks-dispatch-summary-top-item-content">
                <div className="dispatch-tasks-dispatch-summary-top-item-title">
                    <span className="...-title-line" style={{ backgroundColor: [蓝 / 黄 / 绿][index] }} />
                    <span className="...-title-text">{item.name}</span>
                </div>
                <div className="...-value">
                    <span className="...-value-number">{item.value}</span>
                    <span className="...-value-unit">{item.unit}</span>
                </div>
            </div>
            <img src={`${IMAGE_PATH}/ensure-progress/${SummaryImages[index]}`} />
        </div>
    ));
}
```

- **固定 3 个**：图片数组与颜色数组 `[蓝, 黄, 绿]` 长度一致。
- 颜色：`rgba(40, 108, 246, 1)` / `rgba(246, 191, 40, 1)` / `rgba(109, 212, 1, 1)`。
- 图片资源：`apps/main/public/static/images/ensure-progress/sheet-{00,01,02}.svg`。

## 效率 Tab

```text
"队伍"      →  始终显示
"工单"      →  仅无线专业
"汇聚层工单" →  仅传输专业
"接入层工单" →  仅传输专业
```

切换时通过 `useEffect` 重置：

```typescript
useEffect(() => {
    setState({ efficiencySelected: "队伍" });
}, [professionalType]);
```

## 检索输入区

| efficiencySelected     | professionalType | 输入框（顺序）                      |
| ---------------------- | ---------------- | ----------------------------------- |
| `队伍`                 | 任意             | `regionName` → `team`               |
| `工单`                 | `无线专业`       | `stationName` → `faultName` → `car` |
| 其它（工单/汇聚/接入） | `传输专业`       | `orderRegionName` → `orderTeamName` |

## 队伍表格

公共列（`commonTeamColumns`）：

```text
区域 | 队伍 | 队长 | 电话 | 任务中 | 异常归档 | 抢通数 | 工作量
```

无线专业在 **5 列** 之后插入：

- **油机（已用/总数）**：`dataIndex: generatorUsedTotal`，render 用 `generatorUsed`（黄色） + `/generatorTotal`。
- **卫星包**：`dataIndex: satellitePack`，固定宽度 120，Tooltip + ellipsis。

```typescript
if (professionalType === "无线专业") {
    return [...commonTeamColumns.slice(0, 5), wirelessGeneratorColumn, wirelessSatellitePackColumn, ...commonTeamColumns.slice(5)];
}
return commonTeamColumns;
```

## 队伍表格

队伍表格由 `state.efficiencySelected === "队伍"` 控制渲染，列定义在 `teamColumns` (`useMemo` 依赖 `professionalType`)。

### 列定义（公共列 `commonTeamColumns`）

| 列       | dataIndex          | width | 无线专业 | 传输专业 | 说明         |
| -------- | ------------------ | ----- | -------- | -------- | ------------ |
| 区域     | `region`           | 180   | ✅       | ✅       | —            |
| 队伍     | `team`             | 260   | ✅       | ✅       | —            |
| 队长     | `leaderName`       | 100   | ✅       | ✅       | —            |
| 电话     | `leaderPhone`      | 150   | ✅       | ✅       | —            |
| 任务中   | `taskInProgress`   | 80    | ✅       | ✅       | 任务中队伍数 |
| 异常归档 | `abnormalArchived` | 80    | ✅       | ✅       | 异常归档数   |
| 抢通数   | `normalArchived`   | 80    | ✅       | ✅       | 正常归档数   |
| 工作量   | `workload`         | 80    | ✅       | ✅       | —            |

### 无线专业专有列（插在第 5 列后）

| 列                           | dataIndex            | width | 说明                                          |
| ---------------------------- | -------------------- | ----- | --------------------------------------------- |
| 油机（已用 / 总数，黄色）    | `generatorUsedTotal` | 150   | render 用 `generatorUsed` + `/generatorTotal` |
| 卫星包（Tooltip + ellipsis） | `satellitePack`      | 120   | 超长名称 Tooltip                              |

**插入位置**：

```typescript
return [...commonTeamColumns.slice(0, 5), wirelessGeneratorColumn, wirelessSatellitePackColumn, ...commonTeamColumns.slice(5)];
```

> 即插在"电话"列之后、"任务中"列之前。**修改插入位置时务必核对 `slice` 边界**。

### 数据源与检索

| API                           | 入参（额外）                                |
| ----------------------------- | ------------------------------------------- |
| `getEmergencyDispatchTeamApi` | `regionName`、`team`（2 个 `Input.Search`） |

### 行选中态

- 字段：`sectionRight:selectedDispatchTeamOrOrder`，`type: "队伍"`
- 高亮 class：`row-selected`
- `JSON.stringify` 包 `try/catch`

详见 [§行选中态](#行选中态)。

### 任务入口

| 任务                   | 触点                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| 改公共列               | `commonTeamColumns` 数组                                           |
| 改无线专业专有列       | `wirelessGeneratorColumn` / `wirelessSatellitePackColumn` 插入位置 |
| 改列宽                 | 各列 `width` 字段                                                  |
| 改检索字段             | `dataTeamList` 的 `useRequest` 入参 + 顶部 `Input.Search` 区域     |
| 改表格分页             | `pagination={{ pageSize: 7 }}`                                     |
| 切到无线专业新增专有列 | 仿照 `wirelessGeneratorColumn` 在 `slice` 边界插入                 |

---

## 工单表格

工单表格由 `state.efficiencySelected !== "队伍"` 控制渲染，列定义在 `orderColumns` (`useMemo` 依赖 `professionalType`)。

### 通用列结构

| 列           | width (无线) | width (传输) | dataIndex     | 渲染                                      |
| ------------ | ------------ | ------------ | ------------- | ----------------------------------------- |
| 工单号       | auto         | auto         | `orderId`     | Tooltip + ellipsis，取 `-` 之后部分显示   |
| 站名 / 机房  | 200          | 125          | `stationName` | 无线 Tooltip+ellipsis；传输 ellipsis:true |
| 站点层级     | 100          | —            | `siteLevel`   | ellipsis:true（**仅无线**）               |
| 油机         | 150          | —            | `generator`   | Tooltip+ellipsis（**仅无线**）            |
| 机房名称     | —            | 125          | `stationName` | ellipsis（**仅传输**，dataIndex 同站名）  |
| 故障发生时间 | —            | 125          | `faultTime`   | ellipsis（**仅传输**）                    |
| 故障处理人   | 80           | 120          | `handler`     | ellipsis                                  |
| 电话         | 80           | 80           | `phone`       | ellipsis                                  |
| 工单状态     | 450          | 520          | `orderStatus` | `renderOrderStatusSteps`（详见专文）      |

### 无线专业列

```text
工单号 | 站名 | 站点层级 | 油机 | 故障处理人 | 电话 | 工单状态(Steps)
```

### 传输专业列

```text
工单号 | 机房名称 | 故障发生时间 | 故障处理人 | 电话 | 工单状态(Steps)
```

### 工单号显示规则

```typescript
const displayText = text?.includes("-") ? text.substring(text.indexOf("-") + 1) : text || "";
return (
    <Tooltip title={<span style={{ fontSize: 16 }}>{text || ""}</span>}>
        <span className="inline-block whitespace-nowrap text-ellipsis overflow-hidden w-[300px]">{displayText}</span>
    </Tooltip>
);
```

| 取值             | 单元格展示宽度 | Tooltip  |
| ---------------- | -------------- | -------- |
| 含 `-`           | `-` 之后部分   | 完整文本 |
| 不含 `-`         | 原文           | 原文     |
| `null/undefined` | 空字符串       | 空字符串 |

> ⚠️ 无线专业 ellipsis 宽度 `300px`，传输专业 `350px`。修改时同步两侧。

### 工单状态列（最后一列）

> 详见专文 [order-status-steps.md](./order-status-steps.md)。

简述：

- `render: renderOrderStatusSteps`（位置：`dispatch-summary/index.tsx#L45-L83`）
- 容器宽度：无线 450 / 传输 520（**大于** Steps 上限 550，可能被截断）
- Steps 内部 `overflow: hidden` 兜底

### 数据源与检索

| API                            | 入参分支                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `getEmergencyDispatchOrderApi` | 无线：`stationName`、`faultName`、`car`<br>传输：`regionName`、`team`、`orderType` |

`orderType` 取值：

| `efficiencySelected` | `orderType` 入参           |
| -------------------- | -------------------------- |
| `队伍`               | `""`（空字符串）           |
| `汇聚层工单`         | `"汇聚层工单"`             |
| `接入层工单`         | `"接入层工单"`             |
| `工单`（仅无线）     | `""`（无线不传 orderType） |

### 行选中态

- 字段：`sectionRight:selectedDispatchTeamOrOrder`，`type: "工单"`
- 高亮 class：`row-selected`
- `JSON.stringify` 包 `try/catch`

详见 [§行选中态](#行选中态)。

### 任务入口

| 任务             | 触点                                                           |
| ---------------- | -------------------------------------------------------------- |
| 改无线专业列     | `orderColumns` 内 `professionalType === "无线专业"` 分支       |
| 改传输专业列     | `orderColumns` 末尾分支                                        |
| 改工单号显示     | 两处 `render`（无线 + 传输）                                   |
| 改 ellipsis 宽度 | `w-[300px]` / `w-[350px]`                                      |
| 改 Steps 列宽    | `width: 450` / `width: 520`（同步 `calculateStepsWidth` 上限） |
| 改表格横向滚动   | `scroll={{ x: "max-content" }}`                                |
| 新增工单类型     | `efficiencySelected` + `orderType` 入参映射                    |

---

## 两表对比与一致性约束

| 维度         | 队伍表格                                   | 工单表格                                          |
| ------------ | ------------------------------------------ | ------------------------------------------------- |
| 触发条件     | `state.efficiencySelected === "队伍"`      | `state.efficiencySelected !== "队伍"`             |
| 列定义       | `teamColumns`                              | `orderColumns`                                    |
| 检索输入数   | 2（`regionName` + `team`）                 | 2~3（无线 3，传输 2）                             |
| 表格分页     | `pageSize: 7`                              | `pageSize: 7`                                     |
| 行选中 type  | `"队伍"`                                   | `"工单"`                                          |
| 列选中态字段 | `sectionRight:selectedDispatchTeamOrOrder` | 同上                                              |
| 行点击回调   | `dispatch(..., { type: "队伍", record })`  | `dispatch(..., { type: "工单", record })`         |
| 滚动行为     | 默认（无 `scroll` 配置）                   | `scroll={{ x: "max-content" }}`（无线专业列较多） |

### 必同步点（修改时检查）

1. **`useMemo` 依赖**：两表 `useMemo` 依赖都必须带 `[professionalType]`。
2. **`onRow` 高亮 class**：都用 `row-selected`，CSS 在 `dispatch-summary/index.css`。
3. **`pagination.pageSize`**：两表都是 7，改一个必同步另一个。
4. **`rowKey`**：队伍 `rowKey="rowNum"`、工单 `rowKey="rowNum"`（一致，但若后端换 key 需双表同步）。
5. **`dispatch(...)` 形状**：必须包含 `type` 字段，否则选中态失效。
6. **`efficiencySelected` 重置**：`useEffect(() => setState({ efficiencySelected: "队伍" }), [professionalType])` 切换专业时强制回 `"队伍"`。

---

## 行选中态

```typescript
const { selectedTeam } = useSubscribe({
    selectedTeam: widgetFields.getField("sectionRight:selectedDispatchTeamOrOrder"),
});

onRow: (record) => {
    let isActive = false;
    try {
        isActive = selectedTeam?.type === "队伍" && JSON.stringify(selectedTeam?.record) === JSON.stringify(record);
    } catch {
        isActive = false;
    }
    return {
        onClick: () => {
            dispatch(widgetFields.getField("sectionRight:selectedDispatchTeamOrOrder"), {
                type: "队伍", // 工单表格这里是 "工单"
                record: isActive ? null : record,
            });
        },
        className: cx("cursor-pointer", { "row-selected": isActive }),
    };
};
```

- 主键：`sectionRight:selectedDispatchTeamOrOrder`（注册于 `apps/main/app/components/fields.ts:31`）。
- 形状：`{ type: "队伍" | "工单", record: any | null }`。
- 点击同记录 → `record: null`（取消选中）。
- 高亮 class：`row-selected`（背景 `rgba(41, 122, 191, 0.5)`）。
- `JSON.stringify` 包在 try/catch 防止循环引用。

## Steps 工单状态

> 详见专文 [order-status-steps.md](./order-status-steps.md)（含数据契约 / 宽度算法 / Tooltip / 异常分支 / 抽组件建议 / 6 类场景）。

简述：[renderOrderStatusSteps(orderStatus)](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.tsx#L45-L83)：

```typescript
const calculateStepsWidth = (length: number) => Math.min(550, length === 1 ? 75 : 29 + length * 56);

orderStatus.map((status) => ({
    title: status.name,
    content: status.name,
    status: status.value === "1" ? "finish" : "wait",
    className: status.name === "异常结束" ? "dispatch-summary-steps-item-abnormal" : undefined,
}));

const pendingIndex = orderStatus.findIndex((status) => status.value === "0");
const current = pendingIndex === -1 ? orderStatus.length - 1 : pendingIndex;
```

| 后端 `value` | Steps status | 图标背景                             |
| ------------ | ------------ | ------------------------------------ |
| `"1"`        | `finish`     | 绿 `rgba(61, 255, 99, 0.2)` + 绿描边 |
| `"0"`        | `wait`       | 半透明白色                           |

**异常结束分支**：`status.name === "异常结束"` → className `dispatch-summary-steps-item-abnormal`，图标变金黄 `rgba(251, 212, 103)`。

Steps 整体套 `<Tooltip>`，每行展示 `name + time`，白底 `pre-line`。

> 完整数据契约 / 宽度算法 / Tooltip / 异常分支 / 抽组件建议 / 6 类场景：[order-status-steps.md](./order-status-steps.md)

## 专业类型差异

| 取值       | 表格列差异                       | 检索字段                  | efficiencySelected             |
| ---------- | -------------------------------- | ------------------------- | ------------------------------ |
| `无线专业` | 含油机/卫星包列                  | stationName/faultName/car | 队伍 / 工单                    |
| `传输汇聚` | （已注释保留）                   | —                         | —                              |
| `传输接入` | （已注释保留）                   | —                         | —                              |
| `传输专业` | 基础列（机房名称、故障发生时间） | regionName/team/orderType | 队伍 / 汇聚层工单 / 接入层工单 |

`getEmergencyDispatchOrderApi` 的入参逻辑：

```typescript
if (professionalType === "无线专业") {
    Object.assign(params, { stationName, faultName, car });
} else {
    Object.assign(params, {
        regionName: orderRegionName,
        team: orderTeamName,
        orderType: efficiencySelected === "队伍" ? "" : efficiencySelected,
    });
}
```

## 轮询

```typescript
const { interval = 300 } = useEnvironment("gd-emergency-support.modules.dispatch-tasks-summary.request") ?? {};
// pollingInterval: interval * TIME_RANGE.SECOND
```

3 个 `useRequest` 共享同一 `pollingInterval`：

1. `getEmergencyDispatchSummaryApi`（顶部统计）
2. `getEmergencyDispatchTeamApi`（队伍表格）
3. `getEmergencyDispatchOrderApi`（工单表格）

`ready` 守卫：`isDefined(taskId) && isDefined(currentZone) && isDefined(professionalType)`。

## 相关文档

- [main.md](./main.md) — 主组件
- [resource-usage.md](./resource-usage.md) — 资源子组件
- [api.md](./api.md) — 接口
- [style.md](./style.md) — 样式
- [order-status-steps.md](./order-status-steps.md) — Steps 工单状态
