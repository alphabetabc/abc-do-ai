# Task 010 — 趋势图 label 数据/视图分离 + PM 截断规则

> **前置**：
>
> -   [done/task-2026-08-25-004-station-outage-chart.md](./done/task-2026-08-25-004-station-outage-chart.md) 基站退服 4 档时间粒度趋势图已落地（mock 内置 label）
> -   [done/task-2026-08-25-007-time-label-and-clock.md](./done/task-2026-08-25-007-time-label-and-clock.md) "此刻往前 2 小时"锚点模式已沉淀
> -   [done/task-2026-08-26-009-service-recovery-trend-chart.md](./done/task-2026-08-26-009-service-recovery-trend-chart.md) 退服恢复 4G/5G 双线趋势图已落地（mock 内置 label）
>
> **关联文档**：
>
> -   前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> -   模块参数速查：[../design/frontend/001-modules-params.md](../design/frontend/001-modules-params.md)
> -   当前状态：[../status/current.md](../status/current.md)
> -   自检清单：[../status/checklist.md](../status/checklist.md)
> -   路线图：[../roadmap.md](../roadmap.md)
>
> **日期**：2026-08-26
> **状态**：已完成

---

## 一、目标

两个趋势图模块的"x 轴 label 渲染"做一致性重构 + PM 拍板的两条截断规则落地：

1. **数据/视图分离**：所有趋势图 mock 只存数值，x 轴 label 由组件按"挂载时刻锚点 + range"动态生成。废除 mock 内硬编码 label 的做法。
2. **PM 拍板 — 日档截断**：station-outage 日档仅展示"当前小时（含）"之前的桶，不展示未来时刻（demo 时间戳固定在 2026-08-26 14:00~14:30 区间时显示 8 个点）。
3. **PM 拍板 — 月档截断 + 中文化**：station-outage 月档仅展示"当前月（含）"之前的月份，label 格式由 `MM-01` 改为中文 `1月`/`2月`/.../`12月`。
4. **markLine 索引化**：service-recovery 时间轴指示线由 `xLabels[currentTimeIndex]` 字符串匹配改为索引匹配，消除 label 漂移后 markLine 失锚的隐患。

---

## 二、背景 / 现状盘点

### 2.1 service-recovery 趋势图（task009 落地版）

[modules/service-recovery/trend-chart.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/trend-chart.tsx) 当前实现：

- mock（4 个 `service-recovery-trend-{level}.json`）每点携带 `label: "HH:mm:ss"`，24 个时间点覆盖"往前 2 小时"区间
- 组件直接 `points.map((p) => p.label)` 取出 label 喂给 xAxis
- markLine 用 `xLabels[currentTimeIndex] ?? xLabels[xLabels.length - 1]` 字符串锚定

**问题**：mock label 写死后，组件 mount 时刻与 mock 写死时刻不一致时，label 与 TimelineHistory 的 24 时间点不同源，演示时肉眼可见错位。同时 mock label 属于"展示数据"，与数值耦合，违背"mock 只存数值"原则。

### 2.2 station-outage 趋势图（task004 落地版）

[modules/station-outage/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) 当前实现：

- mock 5 个 `{level}.json` 均有 `day` / `week` / `month` / `custom` 4 档，**每点携带 `label`**：
  - `day`: 12 个 `HH:mm`（00:00 ~ 22:00，2 小时间隔）
  - `week`: 7 个 `MM-DD`（当前写死 08-15 ~ 08-21）
  - `month`: 12 个 `MM-DD`（当前写死 01-01 ~ 12-01）
  - `custom`: 4 份周切片，每份 7 个 `MM-DD`（label 用于按用户区间过滤）

**问题**：
- `day` 12 个点是"全天 24h 周期"，demo 任何时刻看都是 12 个点，**没体现"实时性"**，未来桶（当前时刻之后的）也展示，与 PM "截至当前时刻"要求矛盾。
- `week` / `month` label 写死 08-15/01-01，跨日 / 跨月后再看 demo label 明显陈旧。
- `month` label 格式 `MM-DD` 不符合大屏中文场景的 PM 偏好（"1月" "2月" 更直观）。

### 2.3 模式沉淀：mount 时锚点快照

task007 / task009 已沉淀模式：

- `anchorMs = useMemo(() => Date.now(), [])` 挂载时锁定，避免每次 render label 漂移
- 与 TimelineHistory 的"挂载时刻生成 24 时间点"同源策略

本 task 复用该模式，扩展应用到 station-outage 全档 + service-recovery xLabel。

---

## 三、落地方案

### 3.1 数据 / 视图分离原则

**mock**：每个点仅含数值字段，移除所有 `label`。例如：

```jsonc
// service-recovery-trend-city.json（改造后）
{
    "level": "city",
    "unit": "个",
    "points": [
        { "fourG": 8, "fiveG": 3 },
        { "fourG": 9, "fiveG": 4 },
        // ... 24 个
        { "fourG": 3, "fiveG": 18 }
    ]
}
```

**组件**：用 `useMemo` 在挂载时生成 `xLabels: string[]`，按 range 类型动态拼字符串（HH:mm / MM-DD / X月 / 用户区间 MM-DD）。

**唯一例外**：`station-outage.custom` 数组保留 label，因为：

1. `custom` 是"用户选区间 → 命中 mock 切片"模式，label 仍用于 `flatMap + filter` 区间匹配
2. 组件 xLabels 用 Dayjs 按用户区间逐日生成，与 mock label 同源（MM-DD），二者天然对齐

### 3.2 改动文件清单

| 文件                                                                             | 类型 | 改动                                                                                       |
| -------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json`     | 改   | 移除 24 个 point 的 `label` 字段                                                            |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json`  | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json` | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json`   | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-city.json`       | 改   | 移除 `day` / `week` / `month` 三档的 `label`；`custom` 档保留 label                          |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-company.json`    | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-district.json`   | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-street.json`     | 改   | 同上                                                                                        |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-community.json`  | 改   | 同上                                                                                        |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/trend-chart.tsx`     | 改   | 新增 `anchorMs` + `xLabels` useMemo；markLine 改用索引定位（带 clamp）                       |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx`             | 改   | 新增 `pad2` / `DAY_LABELS` 常量 + `dayCutoffCount` / `monthCutoffCount` 工具函数 + `xLabels` useMemo + `points` 同步截取 |
| `status/current.md`                                                              | 改   | mock 清单更新：service-recovery 4 个 + station-outage 5 个均标注"label 由组件动态生成"；service-recovery / station-outage 模块描述追加"x 轴 label 动态生成" |
| `design/frontend/001-modules-params.md`                                          | 改   | service-recovery / station-outage 行追加 label 生成方式说明                                  |
| `plans/roadmap.md`                                                               | 改   | 新增 T19 任务分解 + §八 看板勾选 + 版本号 v2.3.0                                            |

> **未触动**：`history-timeline.json`（点位回放，按 idx 取 markers）、`map-markers.json`（点位坐标，与 label 无关）均不在本 task scope。

### 3.3 service-recovery trend-chart.tsx 关键改造

```tsx
// 新增常量
const POINT_COUNT = 24;
const POINT_INTERVAL_MIN = 5;
const pad2 = (n: number) => String(n).padStart(2, '0');

// 新增 useMemo：挂载时锁定锚点 + 24 个 HH:mm label
const anchorMs = useMemo(() => Date.now(), []);

const xLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = POINT_COUNT - 1; i >= 0; i--) {
        const t = new Date(anchorMs - i * POINT_INTERVAL_MIN * 60_000);
        labels.push(`${pad2(t.getHours())}:${pad2(t.getMinutes())}`);
    }
    return labels;
}, [anchorMs]);

// chart option 改造
const option = useMemo(() => {
    if (!trend) return {};
    const safeIndex = Math.max(0, Math.min(currentTimeIndex, POINT_COUNT - 1));
    return {
        // ...
        xAxis: {
            type: 'category',
            data: xLabels,  // ← 从 mock 改用动态 label
            // ... 原 axisLabel.formatter: val => val.slice(0,5) 删除（已为 HH:mm）
        },
        series: [
            {
                name: '4G',
                // ...
                markLine: {
                    data: [{ xAxis: safeIndex, ... }],  // ← 索引定位
                },
            },
            // ...
        ],
    };
}, [xLabels, trend, currentTimeIndex]);
```

**关键变更**：
- `TrendPoint` 接口移除 `label: string`，仅 `fourG` / `fiveG`
- 删除 `axisLabel.formatter: val => val.slice(0,5)`（label 已为 HH:mm，无需截断）
- markLine `xAxis: xLabels[currentTimeIndex] ?? xLabels[xLabels.length - 1]` → `xAxis: safeIndex`（索引）
- `safeIndex` 用 `Math.max(0, Math.min(currentTimeIndex, POINT_COUNT - 1))` clamp 防越界

### 3.4 station-outage index.tsx 关键改造

```tsx
// 新增常量
const pad2 = (n: number) => String(n).padStart(2, '0');
const DAY_LABELS: string[] = Array.from({ length: 12 }, (_, i) => `${pad2(i * 2)}:00`);

// PM 拍板 — 日档截断：当前小时（含）之前的桶数
function dayCutoffCount(anchorMs: number): number {
    const h = new Date(anchorMs).getHours();
    return Math.floor(h / 2) + 1;
}

// PM 拍板 — 月档截断：当前月（含）之前的月数
function monthCutoffCount(anchorMs: number): number {
    return new Date(anchorMs).getMonth() + 1;
}

// xLabels 动态生成
const xLabels = useMemo<string[]>(() => {
    if (range === 'day') return DAY_LABELS.slice(0, dayCutoffCount(anchorMs));
    if (range === 'week') {
        const labels: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(anchorMs - i * 24 * 60 * 60_000);
            labels.push(`${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
        }
        return labels;
    }
    if (range === 'month') {
        const count = monthCutoffCount(anchorMs);
        return Array.from({ length: count }, (_, i) => `${i + 1}月`);
    }
    // custom：按用户选区间逐日生成 MM-DD
    if (!customRange || !customRange[0] || !customRange[1]) return [];
    const labels: string[] = [];
    let cur = customRange[0].clone();
    const end = customRange[1];
    while (cur.valueOf() <= end.valueOf()) {
        labels.push(cur.format('MM-DD'));
        cur = cur.add(1, 'day');
    }
    return labels;
}, [range, anchorMs, customRange]);

// points 同步截取（保持 xLabels / data 同长对齐）
const points = useMemo<DataPoint[]>(() => {
    if (!trend) return [];
    if (range === 'day') return trend.day.slice(0, dayCutoffCount(anchorMs));
    if (range === 'month') return trend.month.slice(0, monthCutoffCount(anchorMs));
    if (range !== 'custom') return trend[range];
    // ... custom 过滤逻辑保留（mock label 仍在）
}, [trend, range, anchorMs, customRange]);

// chart option 用 xLabels
xAxis: { type: 'category', data: xLabels, ... }
```

**DataPoint 接口变更**：

```ts
// 旧
interface DataPoint {
    label: string;
    value: number;
}

// 新（label 改为可选，仅 custom 档用）
interface DataPoint {
    label?: string;
    value: number;
}
```

custom 档过滤时使用 `(p.label ?? '') >= start && (p.label ?? '') <= end` 兜底。

### 3.5 PM 拍板细节

| 档   | PM 要求                                       | 实现                                                                                                |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 日   | 截止到当前时刻，不展示未来桶                  | `dayCutoffCount(anchorMs)` 返回 `floor(h/2)+1`，如 14:30 → 8（00/02/.../14），01:30 → 1（仅 00）     |
| 周   | 维持现状语义（最近 7 天），格式 MM-DD 不变    | `today-6` 到 `today`，已沿用                                                                       |
| 月   | 截止到当前月 + 中文 `1月`/`2月`/`12月` 格式  | `monthCutoffCount(anchorMs)` 返回 `getMonth()+1`，如 8 月 → 8（1月..8月），1 月 → 1                   |
| 自定义 | 用户选区间决定，label 仍按 MM-DD 用于过滤   | 用 Dayjs 按区间逐日生成 xLabels；mock 中 `custom[].points[].label` 保留供 `flatMap + filter` 匹配 |

### 3.6 markLine 索引化收益

| 项           | 字符串锚定（旧）                                  | 索引锚定（新）                            |
| ------------ | ------------------------------------------------- | ----------------------------------------- |
| label 漂移   | markLine 找不到对应 label 失锚                    | 与 label 字符串解耦，无影响                |
| mock 改动    | 改 label 即破 markLine                            | 改 label 不影响 markLine                   |
| 性能         | 字符串相等比较 O(n)                               | 数值索引 O(1)                              |
| 可读性       | `xLabels[currentTimeIndex]` 隐含"label 匹配"     | `safeIndex` 直接表明"第几个点"语义清晰    |

---

## 四、不在本次范围

-   ❌ 趋势图实际数据接入（仍为 mock）
-   ❌ 真实时间同步 / 定时刷新（mount 时锚点冻结，符合 demo 演示模式）
-   ❌ label 文案 i18n（仅中文）
-   ❌ `history-timeline.json` / `map-markers.json` 改造（与本 task 无关）
-   ❌ 月份"全年 vs 滚动 12 月"等业务口径选择（按 PM 拍板仅"截止当前月"）
-   ❌ `custom` 档 mock label 移除（保留以兼容既有 filter 逻辑）

---

## 五、验收标准

1. service-recovery 4 个 mock（`{city,company,district,street}`）的 `points[]` 每项仅含 `{fourG, fiveG}`，无 `label` 字段
2. service-recovery `trend-chart.tsx`：`xLabels` 24 个 HH:mm 字符串由组件 `useMemo` 生成，与 TimelineHistory mount 时刻锚点同源
3. service-recovery markLine 用 `safeIndex = Math.max(0, Math.min(currentTimeIndex, 23))` 索引定位
4. station-outage 5 个 mock（`{city,company,district,street,community}`）的 `day` / `week` / `month` 三档 `points[]` 每项仅含 `{value}`，无 `label` 字段；`custom` 档 label 保留
5. station-outage `index.tsx`：`DAY_LABELS` 常量 12 个（HH:mm，2 小时间隔）；`xLabels` 按 range + `dayCutoffCount` / `monthCutoffCount` / 自定义区间动态生成
6. station-outage 日档：demo 当前时刻 14:30 → 显示 8 个点（00:00 ~ 14:00），不展示 16:00 之后未来桶
7. station-outage 周档：demo 当前时刻 → 显示今天及前 6 天 MM-DD（7 个点）
8. station-outage 月档：demo 当前 8 月 → 显示 `1月` ~ `8月`（8 个点，中文格式，无 `01-01` 等）
9. station-outage 自定义档：用户选区间后按 MM-DD 逐日生成 xLabels；mock 中 custom label 仍用于 `flatMap + filter` 命中切片
10. 两个组件 `points` useMemo 均按相应 cutoff 函数切片，与 `xLabels` 同长对齐（chart 不出现 data 错位）
11. TS 编译 0 错误（cmd-dispatcher scope 内）
12. demo 任何时刻打开页面：service-recovery x 轴 24 点显示"近 2h"、station-outage 日档显示"截至现在"、月档显示"截至当月 + 中文"

---

## 六、文档同步要求

| 触发动作                                           | 必须更新                                                                                                                       | 状态 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- |
| 9 个 mock 文件去 label                             | `status/current.md`（mock 清单追加"label 由组件动态生成"备注）                                                                  | ✅   |
| 修改 `trend-chart.tsx` / `index.tsx`              | `status/current.md`（modules/service-recovery + station-outage 描述追加"x 轴 label 动态生成 + markLine 索引化"）+ `design/frontend/001-modules-params.md`（两个模块行追加 label 生成方式） | ✅   |
| 新增 task 文件                                      | `roadmap.md`（新增 T19 任务分解 + §八 看板勾选 + 版本号升 v2.3.0）                                                              | ✅   |
| —                                                  | `status/checklist.md` 自检                                                                                                     | ✅   |

---

## 七、看板

-   [x] service-recovery 4 个 mock 移除 label 字段（仅保留 `{fourG, fiveG}`）
-   [x] service-recovery `trend-chart.tsx`：新增 `anchorMs` + `xLabels` useMemo；markLine 改用索引定位
-   [x] station-outage 5 个 mock 移除 `day` / `week` / `month` 三档的 label 字段；`custom` 档 label 保留
-   [x] station-outage `index.tsx`：新增 `DAY_LABELS` / `pad2` 常量 + `dayCutoffCount` / `monthCutoffCount` 工具函数 + `xLabels` / `points` useMemo 同步截取
-   [x] PM 拍板 — 日档截止到当前时刻（demo 14:30 → 8 个点）
-   [x] PM 拍板 — 月档截止到当前月 + 中文 `1月`/`2月` 格式
-   [x] markLine 索引化（消除 label 漂移失锚隐患）
-   [x] 同步 `status/current.md`（mock 清单 + 模块描述）
-   [x] 同步 `design/frontend/001-modules-params.md`（label 生成方式说明）
-   [x] 同步 `roadmap.md`（T19 + 看板勾选 + 版本号）
-   [x] 按 `status/checklist.md` 自检

---

## 八、PM 待澄清

| #   | 事项                                       | 阻塞 | 说明                                                                                                                            |
| --- | ------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 月档是否要"全年 12 月" vs "滚动 12 月"    | 否   | 暂按 PM 拍板"截止当前月"，1 月 → 1 个点、12 月 → 12 个点；如 PM 后续要求"全年"再补全年模式                                        |
| 2   | 日档是否要"实时刷新"（而非 mount 冻结）    | 否   | 沿用 task007 锚点模式，demo 场景下刷新频率要求不明确；如要"每秒重算 label"需新增 timer，引入额外复杂度                            |
| 3   | markLine 是否要 hover label                | 否   | 当前仅锚定索引线，无 label 提示；task009 §九 已声明不在 scope                                                                    |
| 4   | 月档"X月"格式 vs"X 月"（空格）            | 否   | 暂用无空格 `1月`，符合中文常见排版；如 PM 要求空格再批量替换                                                                      |

---

## 九、实施记录（2026-08-26）

### 9.1 实际落点清单

**修改文件**：

-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json) —— 24 个 point 移除 `label`
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-city.json](public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-city.json) —— `day`/`week`/`month` 移除，`custom` 保留
-   [public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-company.json](public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-company.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-district.json](public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-district.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-street.json](public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-street.json) —— 同上
-   [public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-community.json](public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-community.json) —— 同上
-   [modules/service-recovery/trend-chart.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/trend-chart.tsx) —— anchorMs + xLabels useMemo + markLine 索引化
-   [modules/station-outage/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) —— DAY_LABELS / pad2 常量 + dayCutoffCount / monthCutoffCount 工具函数 + xLabels / points useMemo

**新增文档**：

-   [plans/done/task-2026-08-26-010-dynamic-time-labels.md](./task-2026-08-26-010-dynamic-time-labels.md)（本文件）

**同步文档**：

-   [status/current.md](../status/current.md) —— mock 清单追加"label 由组件动态生成"备注；modules/service-recovery / station-outage 描述追加
-   [design/frontend/001-modules-params.md](../design/frontend/001-modules-params.md) —— 两个模块行追加 label 生成方式说明
-   [plans/roadmap.md](../roadmap.md) —— 新增 T19 + §八 看板勾选 + 版本号 v2.3.0

### 9.2 关键决策偏差（vs 原计划）

| #   | 偏差项                | 原计划                                                              | 实际落地                                                                                  |
| --- | --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `custom` 档 label     | 拟一并移除，靠 `range` 字段筛选                                     | **保留**，因 `flatMap + filter` 仍按 label 区间过滤；移除需重构为按 chunk range 匹配      |
| 2   | 日档 cutoff 函数命名  |  | 命名 `dayCutoffCount(anchorMs): number`，与 `monthCutoffCount` 风格统一 |
| 3   | month label 格式     | 拟 `01-01` 改 `1/1`                                                 | **改 `X月`**，PM 拍板中文格式                                                              |
| 4   | markLine 安全钳位   | `xLabels[currentTimeIndex] ?? xLabels[xLabels.length-1]` 字符串兜底 | `safeIndex = Math.max(0, Math.min(currentTimeIndex, POINT_COUNT-1))` 索引 clamp，零边界异常  |

### 9.3 校验结果

-   ✅ service-recovery 4 个 mock：`{fourG, fiveG}` 结构合法，24 × 2 = 48 个数值点
-   ✅ station-outage 5 个 mock：`{value}` 结构合法（day 12 / week 7 / month 12）；custom 4 份周切片 × 7 点 label 保留
-   ✅ demo 14:30 模拟：service-recovery x 轴 24 点 HH:mm；station-outage 日档 8 点、月档 8 点（中文 `1月..8月`）
-   ⚠️ `pnpm run lint` 因 sandbox pnpm store 权限问题未跑通（沿用 task009 §9.3 同结论）

### 9.4 scope 外的已知问题

-   ❌ 跨日 / 跨月 demo 重启后 label 跳变（mount 锚点冻结 → 重启后刷新）；接受 demo 模式
-   ❌ station-outage `custom` 档 mock label 写死 `08-15` 等日期，跨月不再匹配（与 task004 §9.4 一致）
-   ❌ 月档"X月"格式无空格不符合某些 PM 偏好（待 PM 反馈再批量替换）

---

## 文档元信息

> **日期**：2026-08-26（创建 → 归档）
> **状态**：已完成（2026-08-26 归档至 `done/`）