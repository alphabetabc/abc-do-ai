# Task 006 — 街道级历史回溯（时间轴 + 地图点位回放）

> **前置**：
>
> -   [done/task-2026-08-24-001-module-init.md](../done/task-2026-08-24-001-module-init.md) 骨架已落地
> -   [done/task-2026-08-24-002-01-map-base.md](../done/task-2026-08-24-002-01-map-base.md) 地图点位 + 层级切换 + 打点渲染已完工
> -   [done/task-2026-08-25-004-station-outage-chart.md](../done/task-2026-08-25-004-station-outage-chart.md) 基站退服趋势 4 档时间粒度已落地（可作为时间轴的"右侧联动模块"参考）
>
> **关联文档**：
>
> -   设计稿：[../../design/001-pm-output.md](../../design/001-pm-output.md) §场景 3
> -   原始需求：[../../design/000-pm-input-spec.md](../../design/000-pm-input-spec.md) (3)「支持查询一段时间范围内的退服恢复趋势，并能够在地图上回溯出对应时间范围内的历史时间点的基站退服分布」
> -   会议纪要：[../../design/000-pm-input-meeting.md](../../design/000-pm-input-meeting.md) 07:52 / 13:17 PM 拍板"在街道级界面操作 + 仅展示退服点 + 拖动变换闪烁位置"
> -   前端规范：[../../design/003-frontend.md](../../design/003-frontend.md)
> -   当前状态：[../../status/current.md](../../status/current.md)
>
> **日期**：2026-08-25（初版）→ 2026-08-25（视觉迭代重激活）→ 2026-08-25（mock + map-stage 接入完成，归档）
> **状态**：已完成
> **位置**：`plans/done/task-2026-08-25-006-timeline-history.md`

> **重激活原因**：初版交付后用户多次反馈视觉细化（track 配色、thumb 形态演化、label 样式、className 化、tooltip 等），已陆续落地但未重新归档为 done。本版把这些迭代统一记录在 §11.7 与 §11.8。

---

## 一、目标

落地场景 3 的全部 3 条验收项：

1. **时间粒度切换**：日 / 周 / 月 / 自定义 4 档（与 task004 基站退服趋势对齐）
2. **时间轴拖动**：用户在街道级界面操作时间轴，可前后拖动
3. **地图点位回放**：拖动时间轴时，地图上的退服基站分布**同步**回溯到对应历史时间点（"按时序预切片"方案）

> **明确范围**：
>
> -   仅在 **street（街道）** 层级生效，其它层级进入时自动隐藏
> -   **仅展示退服点**（会议纪要 09:37 PM 明确：过滤正常基站，仅展示告警 / 退服点 + 闪烁动画）
> -   **仅与地图点位联动**（暂不联动网络影响 / 基站退服趋势图，留待后续 task）

---

## 二、背景 / 现状盘点

### 2.1 PM 原始需求（标书 (3)）

> 大屏支持查询一段时间范围内的退服恢复趋势，并能够在地图上回溯出对应时间范围内的历史时间点的基站退服分布。

### 2.2 会议纪要关键决策

| 时间点 | PM 决策                                                    | 来源         |
| ------ | ---------------------------------------------------------- | ------------ |
| 04:06  | 街道级下钻到物理站 / 逻辑站 / 小区的链路                   | 元宝会议助手 |
| 07:52  | **历史回溯拍板在街道级界面操作**，坦言对实现方式"毫无头绪" | 元宝会议助手 |
| 09:37  | **仅展示退服告警点，过滤正常基站**（"做减法砍掉无效信息"） | 元宝会议助手 |
| 11:23  | **拖动时闪烁位置变换**，按时间窗预切片保证流畅             | 元宝会议助手 |

### 2.3 现状盘点

| 项                 | 状态                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 时间轴组件         | ❌ **完全未实现**（grep "timeline\|回溯\|时间轴" 在 `web/pages/bj-cmcc-cmd-dispatcher/` 0 命中）                                                 |
| 时间粒度切换       | ⚠️ 仅 [station-outage 模块](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) 已支持 4 档（task004 落地），但**地图点位未联动** |
| 历史回溯 Mock 数据 | ❌ 未提供                                                                                                                                        |
| 地图点位渲染       | ✅ [map-stage.tsx:203-229](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-stage.tsx) 支持按 `markerData` 打点 + 闪烁动画（icon-radar.svg）     |
| 现有打点数据       | [map-markers.json](public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json) 仅 27 个静态点位，无时序信息                                      |

### 2.4 与 task004 的关系

[task004](../../done/task-2026-08-25-004-station-outage-chart.md) 已实现"基站退服趋势"模块（日 / 周 / 月 / 自定义 4 档折线图）。但 task004 的数据是"退服基站**数量**的时序"，**不包含每个时间点的具体点位**。

本 task 是 task004 的**空间维度延伸**：在时间轴拖动时，把当前数量"展开"为该时间点的实际退服基站分布。

---

## 三、关键决策（待 review）

### 3.1 时间轴控件位置

| 候选方案                    | 描述                                                              | 优点                 | 缺点                                                      |
| --------------------------- | ----------------------------------------------------------------- | -------------------- | --------------------------------------------------------- |
| **A. 大屏底部全屏通栏**     | 在 1080px 高度最底部（top: 1050 ~ 1070，30px 高）放一条横向时间轴 | 不干扰现有右侧模块   | 与"退服恢复情况"模块（top: 822 ~ 1060）位置接近，可能干扰 |
| B. 地图内部浮动             | 叠加在地图中央偏下                                                | 时间轴与地图强绑定   | 遮挡地图内容                                              |
| **C. 退服恢复情况模块上方** | 在 1790×238 模块顶部（top: 800）增加 20px 时间轴条                | 与"恢复情况"主题契合 | 模块被压缩                                                |
| **D. 独立的右侧模块区**     | 复用 1878 ~ 2784 的右侧空间，新增独立时间轴模块                   | 布局清晰             | 与现有 5 个右侧模块挤占                                   |

**默认采用方案 A**（最不破坏现有布局）。review 时与 PM 对齐。

### 3.2 时间粒度切换控件

| 候选方案                   | 描述                                                                   |
| -------------------------- | ---------------------------------------------------------------------- |
| A. 与 task004 一致         | 在时间轴左侧追加 4 个 tab（日 / 周 / 月 / 自定义）                     |
| **B. 复用 task004 的 tab** | 通过 store 共享 `range` 状态，时间轴与基站退服图共用 tab**（更紧凑）** |

**默认采用方案 B**。需要 store 新增 `historyRange: 'day' | 'week' | 'month' | 'custom'` + `setHistoryRange` 字段。

### 3.3 数据结构（按时序预切片）

会议纪要明确"按时序预切片保证流畅"，建议：

```json
// history-timeline.json
{
    "data": {
        "day": [
            { "time": "2026-08-25 00:00", "markers": [
                { "left": 661, "top": 253, "status": 1, "type": "city" },
                { "left": 835, "top": 387, "status": 1, "type": "city" },
                ...
            ]},
            { "time": "2026-08-25 02:00", "markers": [...] },
            ...
            { "time": "2026-08-25 22:00", "markers": [...] }
        ],
        "week": [...],
        "month": [...],
        "custom": [...]
    }
}
```

每个粒度的**时间点 ≤ 24 个**（满足会议纪要的流畅度要求）。

### 3.4 联动机制

-   **时间轴拖动** → 更新 `currentTimeIndex: number`
-   **`currentTimeIndex`** → `map-stage.tsx` 用其对应的 markers 替换 `markerData` 渲染
-   **切换 currentLevel → community / station** → 时间轴组件 `return null`（仅 street 显示）
-   **闪烁动画**：现有点位的闪烁通过 [icon-radar.svg](public/static/images/bj-cmcc-cmd-dispatcher/icon-radar.svg) + CSS 动画实现；历史回溯的点位复用同一闪烁逻辑。

---

## 四、落地方案

### 4.1 文件改动

| 文件                                                                    | 类型 | 改动                                                                                         |
| ----------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| `web/pages/bj-cmcc-cmd-dispatcher/store/index.ts`                       | 改   | 新增 4 字段：`historyRange` / `setHistoryRange` / `currentTimeIndex` / `setCurrentTimeIndex` |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/timeline/index.tsx`           | 新增 | 时间轴组件（含 4 档 tab + 拖动滑块 + 时间点 label）                                          |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/timeline/timeline-types.ts`   | 新增 | 类型定义：`TimelineRange` / `TimePoint` / `HistoryData`                                      |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/timeline/timeline-slider.tsx` | 新增 | 滑块拖动逻辑（受控 / 非受控 / 性能优化）                                                     |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-stage.tsx`            | 改   | 接入 `currentTimeIndex`，优先用历史点位替换 markerData；非 street / 时间轴未启用时回原行为   |
| `web/pages/bj-cmcc-cmd-dispatcher/render.tsx`                           | 改   | 在 stage 容器内、平级于其它模块的位置挂载 `<Timeline />`                                     |
| `public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`       | 新增 | 4 档时间粒度的预切片 Mock（每档 ≤ 24 个时间点）                                              |
| `status/current.md`                                                     | 改   | 模块清单 + 资源表 + Mock 清单 + store 字段表                                                 |
| `status/checklist.md`                                                   | 改   | 追加本 task 收口自检段                                                                       |
| `plans/roadmap.md`                                                      | 改   | 看板追加本 task                                                                              |

### 4.2 组件层级

```
modules/timeline/
├── index.tsx              # 模块入口：MY_LEVELS + 定位 + 4 档 tab + slider
├── timeline-slider.tsx    # 滑块拖动组件
├── timeline-types.ts      # TimelineRange / TimePoint / HistoryData
└── timeline-tabs.tsx      # 4 档 tab（日 / 周 / 月 / 自定义）
```

### 4.3 store 扩展

```ts
// store/index.ts（追加）
export type TimelineRange = 'day' | 'week' | 'month' | 'custom';

export interface CmdDispatcherState {
    // ... 现有字段 ...
    /** 历史回溯时间粒度（与 task004 的 station-outage range 同语义，本 task 不共享，避免耦合） */
    historyRange: TimelineRange;
    /** 设置历史回溯时间粒度 */
    setHistoryRange: (range: TimelineRange) => void;
    /** 当前历史回溯时间点索引（0 ~ N-1） */
    currentTimeIndex: number;
    /** 设置当前历史回溯时间点索引 */
    setCurrentTimeIndex: (idx: number) => void;
}

// store 实例追加
historyRange: 'day',
setHistoryRange: (range) => set({ historyRange: range, currentTimeIndex: 0 }),
currentTimeIndex: 0,
setCurrentTimeIndex: (idx) => set({ currentTimeIndex: idx }),
```

> **关于"是否共享 task004 range"**：默认不共享。task004 的 range 是模块内 UI 状态，不入 store；本 task 的 range 入 store 是为了跨模块联动。两套 range 在 demo 时大概率会同步切换，但代码层面保持解耦。

### 4.4 时间轴组件骨架

```tsx
// modules/timeline/index.tsx
import { useRequest } from '@fedx-web-common/react-hooks';
import { useState } from 'react';
import { constants } from '@/common/constants';
import { useCmdDispatcherStore } from '../../store';
import type { Level } from '../../store';
import type { HistoryData } from './timeline-types';
import { TimelineTabs } from './timeline-tabs';
import { TimelineSlider } from './timeline-slider';

const MY_LEVELS: Level[] = ['street'];
const LEFT = 0;
const TOP = 1042; // 1080 - 38（30 + 8 边距）
const WIDTH = 2880;
const HEIGHT = 32;

export const Timeline: React.FC = () => {
    const currentLevel = useCmdDispatcherStore((s) => s.currentLevel);
    const range = useCmdDispatcherStore((s) => s.historyRange);
    const setRange = useCmdDispatcherStore((s) => s.setHistoryRange);

    const { data } = useRequest<HistoryData>(async () => {
        const res = await fetch(`${constants.STATIC_PATH}/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`);
        return res.json();
    });

    if (!MY_LEVELS.includes(currentLevel)) return null;
    if (!data) return null;

    const points = data[range];
    const maxIdx = points.length - 1;

    return (
        <div
            style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT, pointerEvents: 'auto' }}
        >
            <TimelineTabs value={range} onChange={setRange} />
            <TimelineSlider points={points} maxIdx={maxIdx} />
        </div>
    );
};

export default Timeline;
```

### 4.5 滑块拖动组件骨架

```tsx
// modules/timeline/timeline-slider.tsx
import { useCmdDispatcherStore } from '../../store';

export const TimelineSlider: React.FC<{ points: TimePoint[]; maxIdx: number }> = ({ points, maxIdx }) => {
    const idx = useCmdDispatcherStore((s) => s.currentTimeIndex);
    const setIdx = useCmdDispatcherStore((s) => s.setCurrentTimeIndex);
    const [dragging, setDragging] = useState(false);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIdx(Number(e.target.value));
    };

    return (
        <div style={{ position: 'absolute', left: 200, right: 20, top: 8 }}>
            <div style={{ color: '#9bd9ee', fontSize: 12 }}>{points[idx]?.time ?? '--'}</div>
            <input
                type="range"
                min={0}
                max={maxIdx}
                value={idx}
                onChange={onChange}
                onMouseDown={() => setDragging(true)}
                onMouseUp={() => setDragging(false)}
                style={{
                    width: '100%',
                    cursor: 'pointer',
                    accentColor: '#5DD5F5',
                }}
            />
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'rgba(166,190,206,0.6)',
                    fontSize: 10,
                }}
            >
                {points
                    .filter((_, i) => i % 4 === 0)
                    .map((p) => (
                        <span key={i}>{p.time}</span>
                    ))}
            </div>
        </div>
    );
};
```

> **性能考虑**：拖动时频繁 setState 可能导致 27 个点位重新渲染。优化策略：
>
> 1.  用 `requestAnimationFrame` 节流（每 16ms 更新一次）
> 2.  `map-stage.tsx` 中点位 `<img>` 已有 `animation` keyframe 闪烁，重渲染不影响
> 3.  如果仍有卡顿，考虑把 markers 数组 memoize

### 4.6 地图联动（map-stage.tsx 改动）

```tsx
// modules/map/map-stage.tsx
// 现有逻辑：
const { data: markerData } = useRequest(async () => {
    const res = await fetch(`${constants.STATIC_PATH}/mock/bj-cmcc-cmd-dispatcher/map-markers.json`);
    return res.json() as Promise<{ data: MapMarker[] }>;
});
const markers = (markerData?.data ?? []).filter((m) => m.type === currentLevel);

// 改为：street + 时间轴启用时，优先用历史点位
const historyRange = useCmdDispatcherStore((s) => s.historyRange);
const currentTimeIndex = useCmdDispatcherStore((s) => s.currentTimeIndex);
const { data: historyData } = useRequest<HistoryData>(
    async () => {
        if (currentLevel !== 'street') return null;
        const res = await fetch(`${constants.STATIC_PATH}/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`);
        return res.json();
    },
    { ready: currentLevel === 'street' },
);

const markers = useMemo(() => {
    if (currentLevel === 'street' && historyData) {
        const points = historyData[historyRange];
        const point = points[currentTimeIndex] ?? points[0];
        return point.markers;
    }
    return (markerData?.data ?? []).filter((m) => m.type === currentLevel);
}, [currentLevel, historyData, historyRange, currentTimeIndex, markerData]);
```

### 4.7 闪烁动画

复现现有 [icon-radar.svg](public/static/images/bj-cmcc-cmd-dispatcher/icon-radar.svg) 的 3 圈扩散动画。所有历史点位都用 `icon: "radar"` 标记 + svg animation，不需额外写 CSS。

### 4.8 Mock 数据结构（待 PM 提供数据）

> ⚠️ 本 task 强依赖 PM 提供的 history-timeline.json 数据。**Mock 数据需 PM / 数据组出**。

```json
// history-timeline.json
{
    "day": [
        { "time": "08-25 00:00", "markers": [
            { "left": 661, "top": 253, "status": 1, "type": "city" },
            ...
        ]},
        { "time": "08-25 02:00", "markers": [...] },
        ...
        { "time": "08-25 22:00", "markers": [...] }
    ],
    "week": [...],   // 周维度 7 个时间点（每日 1 帧）
    "month": [...],  // 月维度 30 个时间点（每日 1 帧）
    "custom": [...]  // 自定义档（3 份预切片）
}
```

每个粒度 ≤ 24 个时间点（会议要求）。具体点位数据由 PM / 数据组提供。

---

## 五、交互流程

### 5.1 进入街道级

```
1. 任何层级 → 点击地图 outline → 切到 street
2. 底部时间轴自动渲染（top: 1042）
3. map-stage 自动用 history-timeline[day][0] 的点位渲染
```

### 5.2 切换时间粒度

```
click(日/周/月/自定义 tab)
→ setHistoryRange(range)
→ setCurrentTimeIndex(0)
→ historyData[range][0] 替换为 markers
→ 地图点位刷新
```

### 5.3 拖动时间轴

```
拖动 slider 滑块
→ setCurrentTimeIndex(idx) (节流到 16ms 一次)
→ historyData[range][idx] 替换为 markers
→ 地图点位平滑切换
→ 顶部时间 label 同步更新
```

### 5.4 离开街道级

```
click(地图 base) → 切到 community 或上层
→ 时间轴组件 return null（自动隐藏）
→ map-stage 恢复原 markerData 渲染
→ currentTimeIndex 保留在 store 中，下次进入 street 时复用
```

---

## 六、不在本次范围

-   ❌ 自定义档的日期区间选择器（沿用 task004 的 `antd DatePicker.RangePicker`，本 task 暂简化：用预切片，UI 上只切到"自定义"tab 即展示对应数据）
-   ❌ 联动网络影响 / 基站退服趋势模块（task004 已有的折线图；本 task 独立）
-   ❌ 时间轴动画（拖动滑块时的平滑过渡）
-   ❌ 时间点指示线（在地图上画"当前时间"的标记）
-   ❌ 自动播放模式（不自动循环播放，按 PM 拍板：拖动控制）
-   ❌ 历史点位对比（同时显示多帧叠加）
-   ❌ 历史回溯的导出 / 截图 / 录像
-   ❌ 历史数据接入真实接口

---

## 七、待 PM 确认（review 时定）

| #   | 待确认项                                         | 默认决策                                                |
| --- | ------------------------------------------------ | ------------------------------------------------------- |
| 1   | 时间轴位置？                                     | 方案 A（顶部全屏通栏 top: 1042）                        |
| 2   | 时间粒度切换 UI？是否复用 task004 的 tab？       | 独立 4 档 tab，不共享                                   |
| 3   | history-timeline.json 数据是否可出？什么时候出？ | 假设可在 review 后 24h 内出                             |
| 4   | 闪烁动画形态？是否复用现有 icon-radar？          | 复用                                                    |
| 5   | 是否需要"自动播放"按钮？                         | 否，仅拖动控制                                          |
| 6   | 拖动时的性能要求？                               | 默认每 16ms 更新一次（60fps），如 PM 要求更高帧率再优化 |

---

## 八、验收标准

### 8.1 时间轴组件（5 条）

1. `currentLevel === 'street'` → 时间轴可见
2. `currentLevel !== 'street'` → 时间轴 return null
3. 时间轴 4 档 tab 可切换，active tab 高亮
4. slider 滑块拖动 → `currentTimeIndex` 同步更新
5. 时间 label 显示当前时间点的 `time` 字段

### 8.2 地图联动（4 条）

6. 拖动 slider → 地图点位**同步**切换（节流后 ≤ 100ms 延迟）
7. street + day tab → 展示 ≤ 24 个时间点
8. 切换 week / month / custom tab → 点位重置到第 0 帧
9. 离开 street → 点位恢复原 markerData

### 8.3 数据契约（3 条）

10. `public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json` 文件存在
11. 文件含 4 个 key（day / week / month / custom）
12. 每个 key 的数组长度 ≤ 24

### 8.4 工程约束（3 条）

13. TS 编译 0 错误（cmd-dispatcher scope 内）
14. 不引入新依赖（slider 用原生 `<input type="range">`）
15. `map-stage.tsx` 改动仅限 `markers` 计算逻辑，不破坏现有渲染 / 层级切换 / 框选交互

---

## 九、文档同步要求

| 触发动作                          | 必须更新                                                      |
| --------------------------------- | ------------------------------------------------------------- |
| store 字段扩展（4 个新字段）      | `status/current.md`（store 字段表）+ `design/003-frontend.md` |
| 新增模块 `timeline`               | `status/current.md`（模块清单）                               |
| 新增 mock `history-timeline.json` | `status/current.md`（mock 清单）                              |
| 时间轴联动约定                    | `design/003-frontend.md`（追加时间轴联动章节）                |
| 本 task 收口                      | `status/checklist.md` 追加本 task 收口自检段                  |

---

## 十、与上下游的衔接

| 上下游                              | 衔接内容                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 上游 task004（基站退服趋势）        | 数据格式参考（4 档时间粒度的数据结构），UI 风格参考（青色折线 + 区域渐变 + Microsoft YaHei 字体）               |
| 下游真实接口接入                    | `history-timeline.json` 替换为 `fetch('/api/history-timeline?range=...')`；本 task 的 store 字段 + 组件无需改动 |
| task-2026-08-25-005（故障报告弹窗） | 独立 task，**不联动**。两个弹窗可同时显示在街道级界面                                                           |

---

## 十一、实施记录（2026-08-25）

> 与原 plan 的差异已在文档顶部「设计变更记录」声明，本节仅记录落地细节。

### 11.1 文件改动（最终）

| 文件                                                                       | 类型 | 改动                                                                                              |
| -------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| `web/pages/bj-cmcc-cmd-dispatcher/store/index.ts`                          | 改   | 新增 2 字段：`currentTimeIndex` / `setCurrentTimeIndex`（原计划 4 字段，删 `historyRange` 系列）   |
| `web/pages/bj-cmcc-cmd-dispatcher/components/timeline-history/index.tsx`    | 新增 | 滑轨组件（24 整点内置 + track/tick/thumb/label）                                                  |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx`      | 改   | 在 `<ServiceRecoveryPanel>` 同级叠加 `<TimelineHistory>`（`left:83 / top:830 / width:1730`）       |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-stage.tsx`               | 改   | 订阅 `currentTimeIndex`（占位，未接入 per-time-point 数据）                                        |
| `status/current.md` / `status/checklist.md` / `plans/roadmap.md`           | 改   | 同步本次落地（含 design changes 说明）                                                            |
| `plans/task-2026-08-25-006-timeline-history.md` → `plans/done/`            | 移   | 移到 done/，文档顶部追加「设计变更记录」                                                          |

> **未落地**：`public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`（设计变更后 TimelineHistory 不依赖任何外部数据）

### 11.2 组件定位

```
web/pages/bj-cmcc-cmd-dispatcher/components/timeline-history/
└── index.tsx         # 单一文件（未拆分；逻辑较 task004 多但仍可控）
```

> 与 task004 选择一致：单文件便于就近维护；未拆 `slider.tsx` / `tabs.tsx`。

### 11.3 store 实际改动

```ts
// store/index.ts（追加）
export interface CmdDispatcherState {
    // ... 现有字段 ...

    /** 当前历史回溯时间点索引（0 ~ N-1）。
     * TimelineHistory 组件写入此字段，所有订阅方（如 map-stage）按此 idx 切换数据。
     * N 由 TimelineHistory 组件自身持有的时间点列表决定（默认 24 个整点），store 仅承载 idx。 */
    currentTimeIndex: number;
    /** 设置当前历史回溯时间点索引 */
    setCurrentTimeIndex: (idx: number) => void;
}

// store 实例追加
currentTimeIndex: 0,
setCurrentTimeIndex: (idx) => set({ currentTimeIndex: idx }),
```

### 11.4 TimelineHistory 关键 API

```ts
export interface TimelineHistoryProps {
    points?: string[];          // 时间点列表（默认以「当前时间为终点、向前每 5min 一个、共 24 个 HH:mm:ss 字符串」生成）
    style?: React.CSSProperties;// 外层定位（left/top 由调用方传）
    width?: number;             // 滑轨宽度（默认 1700）
    showLabels?: boolean;       // 是否渲染底部时间 label（默认 true）
    labelStride?: number;       // 底部 label 抽稀间隔（默认 5：HH:mm:ss 8 字符较宽，每 25min 一个 label）
    defaultPointCount?: number; // 默认时间点数量（默认 24）
    defaultStepMinutes?: number;// 默认时间间隔（默认 5 分钟）
    snapToEndOnMount?: boolean; // mount 时是否自动 snap 到 max（默认 true）
}
```

### 11.4.1 时间点生成逻辑（mount 时一次性快照）

```
mount 时刻 = T₀（含实际秒数）
points = [T₀ - 23×5min, T₀ - 22×5min, ..., T₀ - 1×5min, T₀]
       = [T₀ - 115min, T₀ - 110min, ..., T₀ - 5min, T₀]
共 24 个点（HH:mm:ss 格式），覆盖前 2 小时

idx = 0   → 2 小时前
idx = 23  → 现在

label 格式：`HH:mm:ss`（秒数与 mount 时刻的秒数一致；如 mount 在 14:35:23，全部 label 都是 ":23" 秒）
```

> 长会话停留时不会重新生成（避免漂移）；如需"滚动时间窗口"由后续 task 引入 `interval` prop 扩展。

### 11.4.2 拇指顶部白色时间提示（thumb-time tooltip）

```
位置：在 thumb 棉花糖头之上 6px（bottom: TRACK_HEIGHT + THUMB_HEAD_HEIGHT + 6 = 26）
内容：list[currentTimeIndex]（与底部 label 同数据，实时跟随 thumb 移动）
颜色：#fff（纯白，不透明 — 区别于底部 label 的 rgba(255,255,255,0.8)）
字号：16px（同底部 label）
父级：timeline-history__thumb（跟随 thumb 移动）
```

> 设计意图：底部 label 列出 axis 刻度，拇指顶部 tooltip 显式标注"你当前在这"。底部 label 全部统一白色后，唯一区分选中点的是 thumb 位置 + 拇指顶部 tooltip。

### 11.5 map-stage 订阅占位

```tsx
// modules/map/map-stage.tsx
// task006：街道级历史回溯订阅占位。当前无 per-time-point 数据源，
// 仅在 street 层订阅 currentTimeIndex 触发组件重渲染；接入真实数据后，
// 用 historyData[timePoints[currentTimeIndex]].markers 替换下面 markers 计算逻辑。
const currentTimeIndex = useCmdDispatcherStore((s) => s.currentTimeIndex);
```

### 11.6 与原 plan 的取舍

| 原 plan 决策 | 实际决策 | 理由 |
|---|---|---|
| `modules/timeline/`（模块级） | `components/timeline-history/`（共享级） | 用户明确指示放 components/；后续若其它模块复用可直接 import |
| 4 档 tab | 无 tab，单滑轨 | PM 截图设计为准，无 tab 概念 |
| 时间粒度切换 UI | 无（内置 24 整点） | 同上 |
| `history-timeline.json` mock | 无 mock | TimelineHistory 改为纯派发控件；per-time-point 数据由数据组后续提供 |
| 闪烁动画 | 复用现有 `icon-radar.svg`（未启用） | 等数据源接入后再启用（markers 切换时复用 fade-in 动画即可触发闪烁感） |
| 联动网络影响 / 基站退服趋势 | 不联动 | 保持 task006 独立；后续 task 扩展 |

### 11.7 视觉细化记录（review 后迭代）

| 轮次 | 改动 | 决定方 |
|---|---|---|
| 1 | track 未填充/填充配色：`rgba(48,127,214,0.2)` / `rgba(48,127,214,1)` | PM 截图设计稿 |
| 2 | thumb 形态从「白球」改为「pushpin（矩形 + 白球 + 棍）」 | 用户迭代 |
| 3 | thumb 形态再改为「棉花糖 + 棍」（头为圆角矩形 + 底部细棍） | 用户迭代 |
| 4 | thumb 头 + 棍颜色均为 `#fff`（白色） | 用户决定 |
| 5 | label `font-family / size / line-height` 对齐 PM：16px / 28px / Microsoft YaHei / 白色 0.8 透明 | PM 截图设计稿 |
| 6 | 全部 div / span 加 BEM className（`timeline-history__*`），保留动态定位 | 用户要求 |
| 7 | label 格式 `HH:mm` → `HH:mm:ss`；`labelStride` 3 → 5；曾用 dayjs 改为 native Date（避免依赖风险） | 用户迭代 |
| 8 | 移除 active label 蓝色高亮（label 全部统一白色） | 用户决定 |
| 9 | 拇指头部上方新增白色时间提示（thumb-time tooltip，`#fff` 不透明） | 用户决定 |
| 10 | tooltip chip 化：深蓝背景 `rgba(20,38,56,0.95)` + track 蓝边框 + 4px 圆角 + 阴影（适配面板 `rgb(17,31,50)` 偏深底色） | 用户决定 |
| 11 | 范围决策：timeline 影响地图的层级 = 前三层（city / company / district），street 渲染但不响应；MY_LEVELS 不变（保留 street 可见以维持 service-recovery 面板一致性） | 用户决定 |

### 11.8 最终视觉规格（Final Visual Spec）

#### 11.8.1 视觉常量表（自上而下、自外而内）

| 常量 | 值 | 用途 |
|---|---|---|
| `TRACK_COLOR` | `rgba(48, 127, 214, 0.2)` | 滑轨未填充部分（PM 设计稿蓝色 #307FD6 的 0.2 透明） |
| `TRACK_FILLED_COLOR` | `rgba(48, 127, 214, 1)` | 滑轨已填充部分 + active tick + active label（之前是 active 高亮，已移除） |
| `THUMB_COLOR` | `#fff` | thumb 棉花糖头 + 棍（白色填充，在面板上醒目） |
| `TICK_COLOR` | `rgba(48, 127, 214, 0.7)` | 普通 tick（蓝色 0.7 透明） |
| `TICK_ACTIVE_COLOR` | `rgba(48, 127, 214, 1)` | 当前选中 tick（实蓝） |
| `LABEL_COLOR` | `rgba(255, 255, 255, 0.8)` | 底部时间 label（统一白色 0.8 透明，无 active 蓝分支） |
| `LABEL_FONT_FAMILY` | `"Microsoft YaHei"` | label 字体（PM 设计稿） |
| `LABEL_FONT_SIZE` | `16` | label 字号（PM 设计稿） |
| `LABEL_LINE_HEIGHT` | `28` | label 行高（PM 设计稿） |
| `LABEL_HEIGHT` | `28` | label 容器高度（与 line-height 一致避免溢出） |
| `TOOLTIP_BG` | `rgba(20, 38, 56, 0.95)` | thumb-time tooltip 背景（面板 rgb(17,31,50) 略亮 + 高不透） |
| `TOOLTIP_BORDER` | `1px solid rgba(48, 127, 214, 0.6)` | tooltip 边框（track 蓝系） |
| `TOOLTIP_RADIUS` | `4` | tooltip 圆角（chip 形） |
| `TOOLTIP_PADDING_X` / `Y` | `10` / `4` | tooltip 内边距 |
| `TOOLTIP_OFFSET_ABOVE_HEAD` | `6` | tooltip 与 thumb 棉花糖头的间距 |
| `TOOLTIP_LINE_HEIGHT` | `20` | tooltip 行高 |
| `TOOLTIP_BOX_SHADOW` | `0 2px 8px rgba(0, 0, 0, 0.4)` | tooltip 阴影（轻微深度感） |

#### 11.8.2 尺寸常量表

| 常量 | 值 | 用途 |
|---|---|---|
| `TRACK_HEIGHT` | `12` | 滑轨高度 |
| `TICK_HEIGHT` | `8` | tick 标记高度 |
| `THUMB_HEAD_WIDTH` | `5` | thumb 棉花糖头宽度 |
| `THUMB_HEAD_HEIGHT` | `8` | thumb 棉花糖头高度 |
| `THUMB_HEAD_RADIUS` | `7` | thumb 棉花糖头顶部圆角（接近半宽 → 胶囊感），底部圆角硬编码 2px |
| `THUMB_STICK_WIDTH` | `2` | thumb 棍宽度 |
| `THUMB_STICK_HEIGHT` | `6` | thumb 棍高度（实际渲染时 JSX 改用 `TRACK_HEIGHT` 让棍填满 track，便于指示当前位置） |

#### 11.8.3 位置计算公式

| 元素 | 公式 | 说明 |
|---|---|---|
| 根容器 height | `TRACK_HEIGHT` (12px) | 不含 thumb / label（thumb 溢出向上、label 溢出向下） |
| Track top | `THUMB_HEAD_HEIGHT / 2 - TRACK_HEIGHT / 2` = `-2` | 居中对齐 thumb 棉花糖头（thumb 头中心 y=4，track 中心 y=4） |
| Tick top | `THUMB_HEAD_HEIGHT / 2 - TICK_HEIGHT / 2` = `0` | tick 中心对齐 thumb 头中心 |
| 已填充进度 width | `${ratio * 100}%` | 动态跟随 currentTimeIndex |
| thumb 棍 width | `TRACK_STICK_WIDTH` (2) | 细线 |
| thumb 棍 height | `TRACK_HEIGHT` (12) | 填满 track（覆盖在 track 上方） |
| 棉花糖头 bottom | `TRACK_HEIGHT` (12) | 头底部紧贴 track 上沿 |
| tooltip bottom | `TRACK_HEIGHT + THUMB_HEAD_HEIGHT + TOOLTIP_OFFSET_ABOVE_HEAD` = `26` | 头之上 6px |
| label 容器 top | `THUMB_HEAD_HEIGHT + TICK_HEIGHT + LABEL_OFFSET`（user 编辑后改 `10`） | thumb 头 + tick 之下偏移 |

#### 11.8.4 DOM 树 + className 映射

```
<div className="timeline-history">                      ← 根（position: absolute, width=prop, height=TRACK_HEIGHT）
  <div className="timeline-history__track">             ← 滑轨背景（height: TRACK_HEIGHT, cursor: pointer, 接收 pointer 事件）
    <div className="timeline-history__track-filled" />  ← 已填充进度（width: ratio*100%）
  </div>
  <div className="timeline-history__ticks">             ← ticks + thumb 容器（pointerEvents: none）
    {…24 个 tick div}                                  ← className: timeline-history__tick [+ --active]
    <div className="timeline-history__thumb">           ← thumb 容器（position: absolute, left: thumbLeft）
      <div className="timeline-history__thumb-time" />  ← tooltip（chip 化，跟随 thumb）
      <div className="timeline-history__thumb-head" />  ← 棉花糖头（5×8 圆角矩形）
      <div className="timeline-history__thumb-stick" /> ← 棍（2×12 填满 track）
    </div>
  </div>
  {showLabels && (
    <div className="timeline-history__labels">          ← 底部 label 容器
      {…6 个 label span}                                ← className: timeline-history__label
    </div>
  )}
</div>
```

#### 11.8.5 元素 / 视觉汇总

| className | 元素 | 关键样式 |
|---|---|---|
| `timeline-history` | 根容器 | `position: absolute, width, height: 12, pointerEvents: auto, userSelect: none` |
| `timeline-history__track` | 滑轨背景 | `height: 12, background: TRACK_COLOR, cursor: pointer, borderRadius: 6 (TRACK_HEIGHT/2)` |
| `timeline-history__track-filled` | 已填充进度 | `width: ${ratio*100}%, background: TRACK_FILLED_COLOR, borderRadius: '0 6px 6px 0'` |
| `timeline-history__ticks` | tick + thumb 容器 | `pointerEvents: none` |
| `timeline-history__tick` | 单个 tick | `width: 2, height: 8, background: TICK_COLOR 或 TICK_ACTIVE_COLOR` |
| `timeline-history__thumb` | thumb 容器 | `position: absolute, left: thumbLeft, bottom: 0` |
| `timeline-history__thumb-time` | tooltip | chip 化（背景 / 边框 / 阴影 + 圆角 4 + 内边距 4/10），白色文字 |
| `timeline-history__thumb-head` | 棉花糖头 | `width: 5, height: 8, background: '#fff', borderRadius: '7px 7px 2px 2px'` |
| `timeline-history__thumb-stick` | 棍 | `width: 2, height: 12, background: '#fff', borderRadius: 1` |
| `timeline-history__labels` | 底部 label 容器 | `top: 10, height: 28, pointerEvents: none` |
| `timeline-history__label` | 单个 label | 白色 16px / Microsoft YaHei / 行高 28px |

### 11.9 挂载位置（service-recovery 集成）

```tsx
// modules/service-recovery/index.tsx
<>
    <ServiceRecoveryPanel />
    <TimelineHistory
        style={{ position: 'absolute', left: 83, top: 830, width: 1730 }}
    />
</>
```

| 项 | 值 | 备注 |
|---|---|---|
| `left` | `83` | 退服恢复情况.png 左 30px 留白 |
| `top` | `830` | 图片顶 8px 边距（图片 top=822，height=238 → 底部 1060） |
| `width` | `1730` | 1880 屏宽 - 左右各 30px 留白（与原图对齐） |
| height | `TRACK_HEIGHT` (12) | 根容器内置 |
| `pointerEvents` | `auto` | track 单独可点击 / 拖动 |

### 11.10 待办（视觉闭环后还差什么）

- [ ] **PM 真实数据源接入**：history-timeline.json mock 或接口；接入后 map-stage 用 `historyData[range][idx].markers` 替换当前 markers 计算逻辑（任务 doc §4.6 已写代码片段）
- [ ] **像素微调**：当前 `left:83 / top:830 / width:1730` 是按 `退服恢复情况.png` 估算 ±5px；PM 更新图片后需对齐
- [ ] **CSS 下放**：所有静态样式（颜色 / 尺寸 / 圆角 / 字体）当前 inline，可下放到 `timeline-history.module.css` 配合 className 化（className 已就位）
- [ ] **mount snap 行为**：当前默认 snap 到 max（"现在"）；若 PM 要求保留"上次退出时 idx"则改 store 持久化
- [x] **历史回溯 mock 数据**（"前三层"方案）：生成 `history-timeline.json` 包含 city / company / district 三个 key，每个 key ≤ 24 时间点 × 各自层级 markers（city: 9 / company: 6 / district: 4）；map-stage 改为：currentLevel ∈ {city, company, district} 时用历史点位，street 时仍走原 `markerData` 路径（timeline 在 street 渲染但不响应拖动）——**mock + map-stage 接入均已完成（2026-08-25）**

### 11.11 数据范围与作用层级（"前三层"方案）

#### 11.11.1 timeline 可见 vs 影响范围

| 层级 | timeline 可见 | timeline 影响地图点位 | mock 数据 |
|---|---|---|---|
| city | ✅ | ✅ | ✅ |
| company | ✅ | ✅ | ✅ |
| district | ✅ | ✅ | ✅ |
| street | ✅（MY_LEVELS 保留） | ❌（仅渲染，不响应拖动） | ❌（不生成） |
| community / station / logical | ❌ | ❌ | ❌ |

> **决策理由**：
>
> 1. timeline 在 service-recovery 模块下，MY_LEVELS = `['city', 'company', 'district', 'street']` 4 层都可见，去掉 street 会破坏面板一致性 → 保留 MY_LEVELS
> 2. 退服点稠密的是 city / company / district（9 / 6 / 4 markers），时间回溯空间分布感最强
> 3. street 层已有 `退服恢复情况.png` 4G/5G 趋势图 + 静态 markers，时间回溯冗余
> 4. community / station / logical 单点或太细，时间回退无空间感

#### 11.11.2 mock 数据结构（history-timeline.json）

```jsonc
{
    "city": [
        // 24 个时间点；status 恒为 1，时间点间通过 marker 数量增减体现"退服→恢复"
        // idx 0 ~30% 点位（3 个）→ idx 23 100% 点位（9 个）
        { "time": "12:35:23", "markers": [
            { "left": 661, "top": 253, "status": 1, "type": "city" },
            ...  // idx 0 仅 3 个
        ]},
        { "time": "12:40:23", "markers": [...] },  // 逐时间点递增
        ...
        { "time": "14:30:23", "markers": [...] }   // idx 23 满 9 个
    ],
    "company": [
        // 24 个时间点；idx 0 → 2 个，idx 23 → 6 个
    ],
    "district": [
        // 24 个时间点；idx 0 → 1 个，idx 23 → 4 个
    ]
}
```

| 层级 | 时间点数 | idx 0 markers | idx 23 markers | 最大总量 |
|---|---|---|---|---|
| city | 24 | 3 | 9 | 9 |
| company | 24 | 2 | 6 | 6 |
| district | 24 | 1 | 4 | 4 |

> 策略变更（2026-08-25 用户拍板）：status 恒为 1，不再用 0/1 切换图标；改为通过 marker 数量增减体现退服恢复过程。生成脚本：`scripts/gen-history-timeline-mock.cjs`。

> 时间点格式与 TimelineHistory 默认 `HH:mm:ss` 对齐（mount 时快照倒推 24 个 5min 步长点），保证 timeline 拖动时 label 与 mock 时间点一一对应。

#### 11.11.3 map-stage 接入逻辑

```ts
// modules/map/map-stage.tsx
const EFFECTIVE_LEVELS = ['city', 'company', 'district'] as const;
type EffectiveLevel = (typeof EFFECTIVE_LEVELS)[number];

const currentLevel = useCurrentLevel();
const currentTimeIndex = useCmdDispatcherStore((s) => s.currentTimeIndex);
const { data: historyData } = useRequest<HistoryData>(
    async () => {
        if (!EFFECTIVE_LEVELS.includes(currentLevel as EffectiveLevel)) return null;
        const res = await fetch(`${STATIC_PATH}/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`);
        return res.json();
    },
    { ready: EFFECTIVE_LEVELS.includes(currentLevel as EffectiveLevel) },
);

const markers = useMemo(() => {
    if (EFFECTIVE_LEVELS.includes(currentLevel as EffectiveLevel) && historyData) {
        const points = historyData[currentLevel as EffectiveLevel];
        return (points?.[currentTimeIndex] ?? points?.[0])?.markers ?? [];
    }
    return (markerData?.data ?? []).filter((m) => m.type === currentLevel);
}, [currentLevel, historyData, currentTimeIndex, markerData]);
```

> street 层：timeline 仍渲染（`TimelineHistory` 在 `ServiceRecoveryModule` 内）但拖动不触发 markers 切换（map-stage 走原 `markerData` 路径）。

---

## 文档元信息

> 日期：2026-08-25（初版）→ 2026-08-25（视觉迭代重激活）→ 2026-08-25（mock + map-stage 接入完成，归档）
> 状态：已完成
> 位置：`plans/done/task-2026-08-25-006-timeline-history.md`
