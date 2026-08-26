# 时间轴历史回溯设计文档

> 从 `003-frontend.md` §11 拆出，集中描述 TimelineHistory 组件的架构、交互、视觉、数据流、mock、store 约定。
> 通用规范见 `../003-frontend.md`；地图接入侧见 `./003-map.md` §8。

---

## 1. 模块概述

TimelineHistory 是 cmd-dispatcher 大屏的"历史回溯"交互控件，承载"拖动时间轴 → 地图点位随时间切换"的能力。

**定位**：纯派发控件（pure dispatcher），不拉取任何 mock / 接口数据，仅向 store 写入 `currentTimeIndex`。

**不负责**：

-   折线图渲染（退服恢复情况.png 静态图片，由 PM 维护，放在 service-recovery 模块）
-   per-time-point markers 渲染（由 map-stage 订阅 `currentTimeIndex` 自行取历史数据）
-   自动播放 / 时间窗口滚动

### 文件组织

```
web/pages/bj-cmcc-cmd-dispatcher/
├── components/
│   └── timeline-history/
│       └── index.tsx          # TimelineHistory 组件本体（~350 行）
├── modules/
│   └── service-recovery/
│       └── index.tsx          # 集成位置：叠加在退服恢复情况.png 顶部
└── store/
    └── index.ts               # currentTimeIndex / setCurrentTimeIndex
```

> 组件放在 `components/` 而非 `modules/`，因为它是"页面级共享 UI"（可被多个模块复用），不绑定单一业务模块。

---

## 2. 组件 API

```ts
interface TimelineHistoryProps {
    /** 时间点列表（HH:mm:ss 字符串数组）；默认以「当前时间为终点、向前每 5min 一个、共 24 个」生成 */
    points?: string[];
    /** 组件最外层定位（由调用方按设计稿传入；自身用 position: absolute） */
    style?: React.CSSProperties;
    /** 滑轨宽度（px）；用于计算 thumb / tick 位置；默认 1700 */
    width?: number;
    /** 是否渲染时间 label；默认 true */
    showLabels?: boolean;
    /**
     * label 抽稀间隔：每隔 N 个 tick 显示一个 label，避免密集。
     * 默认 5（HH:mm:ss 8 字符较宽，每 25min 一个 label 留出 ~370px 间距更透气）。
     */
    labelStride?: number;
    /** 默认时间点数量（仅在未传 points 时生效；默认 24） */
    defaultPointCount?: number;
    /** 默认时间间隔（分钟；仅在未传 points 时生效；默认 5） */
    defaultStepMinutes?: number;
    /** mount 时是否把 currentTimeIndex 推到 max（"现在"）；默认 true */
    snapToEndOnMount?: boolean;
}
```

### 默认时间点生成

```ts
const DEFAULT_POINT_COUNT = 24;
const DEFAULT_STEP_MINUTES = 5;

function buildDefaultPoints(count: number, stepMin: number, endAt: Date = new Date()): string[] {
    const arr: string[] = [];
    for (let i = count - 1; i >= 0; i -= 1) {
        const t = new Date(endAt.getTime() - i * stepMin * 60_000);
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        const ss = String(t.getSeconds()).padStart(2, '0');
        arr.push(`${hh}:${mm}:${ss}`);
    }
    return arr;
}
```

**关键约定**：

-   终点 = 当前时间（`new Date()`）；每个点向前倒推 `stepMin` 分钟；默认 24 个 → 覆盖前 2 小时
-   生成时机：组件 mount 时一次性快照（`useState` 初始化），避免页面长时间停留后时间漂移
-   **不用 dayjs**：native Date 足够，避免依赖风险
-   后续若有真实 PM 数据，调用方传 `points` prop 覆盖默认生成

---

## 3. 交互模型

### 3.1 拖动 / 点击

-   `pointerdown` → 开始拖动 + `setPointerCapture` + 立即 `setCurrentTimeIndex(idxFromClientX)`
-   `pointermove` → 拖动中持续 `setCurrentTimeIndex`
-   `pointerup` / `pointercancel` → 结束拖动 + `releasePointerCapture`

**idx 映射**：

```ts
const idxFromClientX = (clientX: number): number => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(ratio * max);
};
```

-   `max = list.length - 1`
-   点击 / 拖动均走同一映射函数，保证点击任意位置 snap 到最接近的 tick

### 3.2 mount snap

```ts
useEffect(() => {
    if (snapToEndOnMount && max > 0 && currentTimeIndex !== max) {
        setCurrentTimeIndex(max);
    }
}, []); // 仅 mount 时执行
```

-   默认 `snapToEndOnMount: true`：滑轨默认在"现在"（idx = max）
-   依赖项为空（`[]`）→ 仅 mount 时执行一次，后续用户操作不再干预
-   若 PM 要求保留"上次退出时 idx" → 改 store 持久化（localStorage / sessionStorage）

### 3.3 不做的事

-   ❌ 自动播放模式（用户原 plan 拍板：拖动控制，无自动循环）
-   ❌ 拖动节流（原生 pointer events 60fps 下足够流畅；marker 数量放大到 100+ 时再评估 `requestAnimationFrame`）
-   ❌ 滑轨动画过渡（拖动即时响应，无缓动）
-   ❌ 滚动时间窗口（mount 后时间点不再刷新）

---

## 4. 视觉设计

### 4.1 配色（PM 设计稿对齐：蓝色 #307FD6 系）

| 元素          | 颜色                                | 说明                                            |
| ------------- | ----------------------------------- | ----------------------------------------------- |
| track 未填充  | `rgba(48, 127, 214, 0.2)`           | 浅蓝 0.2 透明                                   |
| track 已填充  | `rgba(48, 127, 214, 1)`             | 实蓝 1.0                                        |
| thumb 头 / 棍 | `#fff`                              | 白色填充                                        |
| tick 默认     | `rgba(48, 127, 214, 0.7)`           | 蓝色 0.7 透明                                   |
| tick active   | `rgba(48, 127, 214, 1)`             | 实蓝 1.0                                        |
| label         | `rgba(255, 255, 255, 0.8)`          | 白色 0.8 透明                                   |
| tooltip 背景  | `rgba(20, 38, 56, 0.95)`            | 深蓝高不透（适配面板 `rgb(17,31,50)` 偏深底色） |
| tooltip 边框  | `1px solid rgba(48, 127, 214, 0.6)` | track 蓝系边框                                  |

### 4.2 尺寸常量

```ts
const TRACK_HEIGHT = 12;
const THUMB_HEAD_WIDTH = 5; // 棉花糖头宽
const THUMB_HEAD_HEIGHT = 8; // 棉花糖头高
const THUMB_HEAD_RADIUS = 7; // 圆角半径（接近半宽 → 胶囊感）
const THUMB_STICK_WIDTH = 2; // 棍宽
const THUMB_STICK_HEIGHT = 6; // 棍高（实际渲染用 TRACK_HEIGHT，保持与 track 等高填满）
const TICK_HEIGHT = 8;
const LABEL_HEIGHT = 28; // label 行高
```

### 4.3 thumb 形态（棉花糖头 + 棍）

```
   ┌──┐  ← 棉花糖头：5×8 圆角矩形，顶圆角 7px / 底圆角 2px（上宽下窄收口）
   │  │
   ╰┬─╯
    │    ← 棍：2×12，填满 track 高度
   ─┼─   ← track（12px 高，蓝色填充）
    │
```

-   头：`borderRadius: '7px 7px 2px 2px'`（上方胶囊感，下方收口向棍过渡）
-   棍：`width: 2, height: TRACK_HEIGHT`，`borderRadius: 1`
-   整体 `transform: translateX(-50%)` 居中对齐到 `thumbLeft`

### 4.4 thumb-time tooltip（chip 化）

-   位置：thumb 棉花糖头之上 `TRACK_HEIGHT + THUMB_HEAD_HEIGHT + 6`px
-   形态：chip 化容器（深蓝背景 + track 蓝边框 + 4px 圆角 + 阴影）
-   内容：当前时间点 `list[currentTimeIndex]`（HH:mm:ss）
-   字体：Microsoft YaHei / 16px / 行高 20px / 白色
-   `whiteSpace: 'nowrap'` + `transform: translate(-50%, 0)` 水平居中

### 4.5 label 样式

-   格式：HH:mm:ss（8 字符）
-   字体：Microsoft YaHei / 16px / 行高 28px / `rgba(255,255,255,0.8)`
-   **无 active 蓝分支**（用户决定：去 active 高亮，保持 label 统一色）
-   抽稀：`labelStride = 5`（每 25min 一个 label），`i % labelStride !== 0 && i !== max` 时不渲染
-   `transform: translateX(-50%)` 居中对齐到 tick

### 4.6 DOM className 映射（BEM 化）

```
.timeline-history                       // 根
.timeline-history__track               // 滑轨（含 pointer 事件）
.timeline-history__track-filled        // 已填充进度
.timeline-history__ticks               // ticks + thumb 容器
.timeline-history__tick                // 单 tick
.timeline-history__tick--active        // active tick
.timeline-history__thumb               // thumb wrapper
.timeline-history__thumb-time          // 顶部 tooltip（chip）
.timeline-history__thumb-head          // 棉花糖头
.timeline-history__thumb-stick         // 棍
.timeline-history__labels              // 底部 label 容器
.timeline-history__label               // 单 label
```

> className 已就位，所有静态样式（颜色 / 尺寸 / 圆角 / 字体 / tooltip chip）当前 inline，可下放到 `timeline-history.module.css`。

---

## 5. 数据流

### 5.1 完整链路

```
TimelineHistory 拖动/点击
        │
        ▼
store.setCurrentTimeIndex(idx)         ←——— 纯派发，TimelineHistory 不感知任何 mock
        │
        ▼
modules/map/map-stage.tsx 订阅 currentTimeIndex
        │
        ▼
在 map-stage.tsx 内 useMemo 决策：
   if (isEffectiveLevel(currentLevel) && historyData)
       markers = historyData[level][idx].markers
   else
       markers = (markerData.data ?? []).filter(by type)
        │
        ▼
city/company/district 层 markers 随 idx 切换；street/community/station/logical 走 fallback
```

### 5.2 store 字段

```ts
// store/index.ts
interface CmdDispatcherState {
    // ...
    currentTimeIndex: number;           // 0 ~ N-1（默认 0）
    setCurrentTimeIndex: (idx: number) => void;

    /** 历史回溯是否激活（驱动地图消费走 history-timeline.json 还是 map-markers.json）。
     *  2026-08-26 修改：TimelineHistory 配对调用 setCurrentTimeIndex + setHistoryActive，
     *  实现 isHistoryActive ≡ (currentTimeIndex !== max)。
     *  —— idx=max（"现在"）→ false → map-markers.json（实时，含完整 6 类资源）
     *  —— idx<max            → true  → history-timeline.json[idx].markers（含 6 类资源按 phase 时序到位）
     */
    isHistoryActive: boolean;            // 默认 false
    setHistoryActive: (active: boolean) => void;
}
```

-   `currentTimeIndex` 初始值 `0`
-   `isHistoryActive` 初始值 `false`
-   `N`（最大 idx）由 TimelineHistory 组件自身持有的时间点列表决定（默认 24）
-   store 仅承载 idx + 激活态，不承载时间点列表（避免组件卸载后 idx 丢失但列表残留）
-   **配对写入约束**：TimelineHistory 在同一渲染周期内同时调用 `setCurrentTimeIndex` 和 `setHistoryActive`（详见 §6.5 `updateIdx`），不得单独修改其中之一 — 否则会出现"idx 已更新但激活态未跟上"的中间态渲染。

### 5.3 职责边界

> 本节是 timeline ↔ map 的"契约"，加一个新消费者时请重读本节。

| 组件               | 负责                                                  | 不负责                                  |
| ------------------ | ----------------------------------------------------- | --------------------------------------- |
| `TimelineHistory`  | 时间点列表生成、idx 派发、视觉（track/thumb/label）   | mock 数据、地图消费、marker 渲染         |
| `store`            | 持有 `currentTimeIndex`；不持久化（mount 重置为 max）  | 时间点列表、marker 列表                  |
| `map-stage.tsx`    | 订阅 idx + 决定哪些层级走 timeline；legend 过滤叠加    | timeline 视觉、时间点列表生成            |
| `mock`             | 提供 `history-timeline.json` 与 `map-markers.json`    | 上述任一组件职责                        |

> **不变性约束**：timeline 组件 API（含 `points` / `defaultStepMinutes` / `snapToEndOnMount` 等 prop）保持稳定；后续如需新增"折线图联动"等消费者，**只新增**一份订阅 `currentTimeIndex` 的组件即可，timeline 自身零改动。

### 5.4 地图接入（"前三层"方案）

详见 [003-map.md §8](./003-map.md#8-与时间轴历史回溯的联动task006)。要点摘录：

| 层级             | timeline 可见       | timeline 影响地图点位           | mock 数据源                          |
| ---------------- | ------------------- | ------------------------------- | ------------------------------------ |
| `city`           | ✅（service-recovery）| ✅                              | `history-timeline.json` city key     |
| `company`        | ✅                   | ✅                              | `history-timeline.json` company key  |
| `district`       | ✅                   | ✅                              | `history-timeline.json` district key |
| `street`         | ✅（仅展示，不响应）| ❌（仍走 `map-markers.json`）    | —                                    |
| `community`      | ❌                  | ❌                              | —                                    |
| `station` / `logical` | ❌              | ❌                              | —                                    |

#### 5.4.1 源码约束

-   `EFFECTIVE_LEVELS = ['city', 'company', 'district'] as const`（在 [map-stage.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-stage.tsx)）
-   `isEffectiveLevel(level)` 类型守卫
-   `useRequest<HistoryData>` 以 `ready: isEffective` 守卫 → 不在有效层时不发请求

#### 5.4.2 timeline 影响资源打点（v3 后生效）

> **2026-08-26 变更**：resources 现已写入 `history-timeline.json` 的 markers[]，按"应急调度时序 phase"逐步到位。

timeline 切换 markers 时，`markers[]` 内的 `subType` / `category` 字段**保留**，所以 timeline 拖动时，前五层的 **6 类资源**打点也会按 phase 出现并按 `category` 在 filter 范围内显隐（参考 [003-map.md §10.7](./003-map.md#107-图例过滤优先级checkbox-vs-timeline)）。

资源到位相序（应急调度逻辑：先应急通信 → 再抢修车辆 → 物资 → 人员）：

| subType          | phase [start, end] | 含义                                 |
| ---------------- | ------------------ | ------------------------------------ |
| emergency-vehicle | [0, 10]            | idx 0 起逐步到位，idx 10 全员到齐     |
| repair-vehicle    | [3, 18]            | idx 3 起逐车到场，idx 18 全员到齐     |
| generator         | [5, 20]            | idx 5 起逐步部署，idx 20 全员到位     |
| sat-bag           | [7, 23]            | idx 7 起逐套启用，idx 23 全员到位     |
| wireless-team     | [10, 23]           | idx 10 起队伍入场，idx 23 满员        |
| transmission-team | [14, 23]           | idx 14 起队伍入场，idx 23 满员（末位）|

**示例**（city 层，idx 0 → 23 的 markers 演变）：

| idx (time)        | 总 markers | 节点     | 资源到位情况                                                  |
| ----------------- | ---------- | -------- | -------------------------------------------------------------- |
| idx 0  (12:35)    | 3          | 3        | 0                                                              |
| idx 5  (12:55)    | 13         | 6        | + 8 emergency-vehicle（已就位8）                              |
| idx 10 (13:25)    | 29         | 7        | + 7 repair-vehicle + 5 generator + 2 sat-bag                  |
| idx 14 (13:45)    | 47         | 8        | + 10 repair-vehicle + 9 generator + 5 sat-bag + 4 wireless    |
| idx 18 (14:10)    | 60         | 9        | + 14 repair-vehicle + 12 generator + 7 sat-bag + 8 wireless + transmission-team 起始 |
| idx 23 (14:30)    | 70         | 10       | + 全部 6 类资源齐备（10 节点 + 60 资源 = 70，与 map-markers.json city 全等）|

> 这是"6 类资源在 timeline 上的到位顺序"的可视化呈现，用于现场复盘指挥调度动作的时序。
> ⚠️ **mock 数据声明**：phase 表是脚本生成的示意性时序（PM 未提供历史资源到位时序，仅给定 L4 street 完整快照）。若 PM 后续补正真实数据，替换 `gen-history-timeline-mock.cjs` 的 `SUBTYPE_PHASE` 即可。

#### 5.4.3 与图例 checkobox 的叠加效果

timeline 切换出来的 markers，与 `legendCheckedValues`（默认 `['移动油机', '抢修车辆']`）做交集过滤。所以**默认打开页面时**：

- idx=max（"现在"）→ 走 map-markers.json：仅看到 generator + repair-vehicle 两类
- idx<max（历史回溯）→ 走 history-timeline.json：仅看到 phase 已到达 `end` 且 `category` 在勾选内的资源

如需看全部 6 类资源打点 → 取消图例 checkbox 过滤或在 store 中清空 `legendCheckedValues`。

---

## 6. mock 数据

### 6.1 文件

`public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`

### 6.2 结构

```ts
interface HistoryTimePoint {
    time: string;        // HH:mm:ss
    markers: MapMarker[]; // 与 map-markers.json 同构（含 subType / category 等可选字段）
}

interface HistoryData {
    city: HistoryTimePoint[];      // 24 时间点
    company: HistoryTimePoint[];   // 24 时间点
    district: HistoryTimePoint[];  // 24 时间点
}
```

> **同构注意**：`history-timeline.json` 的 `markers[]` 与 `map-markers.json` 同构（含 `subType` / `category` / `status` 等可选字段），所以 timeline 走出来的资源打点能直接享用 `getMarkerIcon` 与 §9 图例过滤。

### 6.3 数据策略（2026-08-26 v3 更新）

-   **status 恒为 1**（不用 0/1 切换图标；用户拍板）
-   **节点**：idx 0 → 30% 节点数（最少 1 个保底）；idx 23 → 100% 节点数；线性增长
-   **资源（v3 新增）**：每个 subType 在 `[start, end]` 区间线性增长；`SUBTYPE_PHASE` 表见 §5.4.2
-   **idx=23 的 markers 与 map-markers.json 对应 layer 完全一致**（含坐标 / subType / category / status 全字段）
-   **idx=0 的 markers** ≈ 起手告警快照（最少的节点 + 0 资源，反映"刚开始应急响应"的状态）
-   "退服→恢复"叙事 + "应急资源到场"叙事叠加：节点先复活（idx=0 已存在少量），车辆/物资/人员逐步到位

| 层级     | 时间点数 | idx 0 markers | idx 23 markers | idx 23 与 map-markers 关系 |
| -------- | -------- | ------------- | -------------- | --------------------------- |
| city     | 24       | 3（仅节点）   | 70             | **完全一致**（10 节点 + 60 资源 = 70） |
| company  | 24       | 2（仅节点）   | 34             | **完全一致**（6 节点 + 28 资源 = 34）  |
| district | 24       | 2（仅节点）   | 16             | **完全一致**（4 节点 + 12 资源 = 16）  |

> **idx=23 与 map-markers.json 完全一致的设计选择**：
> - 与 `isHistoryActive = (currentTimeIndex !== max)` 配合，idx=max 自动回退到 map-markers.json；当手动从 history-timeline.json[idx=23] 取值时，结果与实时数据等价——避免"现在"vs"最后一帧"不一致
> - 任何对 map-markers.json 的修改（如 PM 补正坐标）只需重新运行 `gen-history-timeline-mock.cjs` 同步

### 6.4 坐标与字段来源

-   **坐标（left/top）**：沿用 `map-markers.json` 各层级 marker 的字段
-   **status**：节点为 PM 状态（如有），资源固定 1
-   **subType / category / icon / width / height**：从 `map-markers.json` 整对象 spread 复制，**完整字段保留**

### 6.5 生成脚本

`scripts/gen-history-timeline-mock.cjs`（skill 目录下）—— **v3**

**运行方式**：

```bash
node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-history-timeline-mock.cjs
```

**脚本设计**：

-   **数据源**：读 `map-markers.json` 的 `city` / `company` / `district` 三层，按 subType 分组
-   **节点曲线**：`nodeRatio = 0.3 + (idx / 23) * 0.7`（线性 0.3 → 1.0，最少保底 1）
-   **资源曲线**：每个 subType 按 `SUBTYPE_PHASE = { 'emergency-vehicle': [0, 10], 'repair-vehicle': [3, 18], 'generator': [5, 20], 'sat-bag': [7, 23], 'wireless-team': [10, 23], 'transmission-team': [14, 23] }` 线性插值
-   **时间点**：UTC 基准 `12:35:23` 起，每 5min 递增（24 点 → `14:30:23`），规避时区
-   **idx=23 = map-markers.json 对应 layer 全等**：保证"现在"vs"history 终点"无差异
-   **输出路径**：相对路径 `../../../../public/static/mock/bj-cmcc-cmd-dispatcher/`

> ⚠️ **mock 数据声明**：phase 表是脚本生成的示意性时序（PM 未提供历史资源到位时序，仅给定 L4 street 完整快照）。若 PM 后续补正真实数据，替换 `SUBTYPE_PHASE` 即可。

---

## 7. 集成位置

### 7.1 service-recovery 模块

TimelineHistory 由 `modules/service-recovery/index.tsx` 集成，叠加在 `退服恢复情况.png` 顶部：

```tsx
// modules/service-recovery/index.tsx
const TIMELINE_LEFT = LEFT + 40;
const TIMELINE_WIDTH = WIDTH - 90;

<TimelineHistory
    style={{ position: 'absolute', left: TIMELINE_LEFT, top: 872, width: TIMELINE_WIDTH }}
    width={TIMELINE_WIDTH}
/>;
```

### 7.2 可见层级

service-recovery 的 `MY_LEVELS = ['city', 'company', 'district', 'street']`，timeline 在这 4 层均可见。

> **可见 ≠ 影响**：street 层 timeline 渲染（保持 service-recovery 面板视觉一致），但拖动不触发 markers 切换——详见 §5.4 / [003-map.md §8.3](./003-map.md#83-有效层级前三层方案)。

### 7.3 与地图模块的耦合点

> 地图接入侧的更详细描述见 [003-map.md §8](./003-map.md#8-与时间轴历史回溯的联动task006)。本节仅给快速参考。

| 耦合点              | 在 timeline 这边                              | 在 map-stage 那边                                         |
| ------------------- | --------------------------------------------- | --------------------------------------------------------- |
| 时间点列表          | `points` prop（默认 24 个 5min 间隔）          | 不直接用，靠 mock 数据 keys                              |
| idx 派发           | `setCurrentTimeIndex(idx)` + `setHistoryActive(idx !== max)` 配对调用 | `useMemo` 订阅，`isHistoryActive && isEffectiveLevel` 时取 `historyData[level][idx].markers`，否则走 `markerData.filter(type)` |
| 视觉                | 棉花糖 thumb / chip tooltip / tick label    | 不感知                                                    |
| mount 行为          | snapToEndOnMount=true → updateIdx(max) → idx=max, isHistoryActive=false（"现在"，实时数据）| 初始即"现在"状态的 markers                                |
| 多消费者扩展        | 不感知；只动 `currentTimeIndex` + `isHistoryActive` | 任何"想跟着时间点跑"的组件都可订阅                      |

---

## 8. 关键决策记录

| #   | 决策                                                  | 理由                                               |
| --- | ----------------------------------------------------- | -------------------------------------------------- |
| 1   | timeline 位置：嵌入 service-recovery 面板顶部         | 用户指示；保持模块紧凑                             |
| 2   | timeline 可见层级：city / company / district / street | 不破坏 service-recovery 面板一致性                 |
| 3   | timeline 影响地图层级：仅 city / company / district   | street 层已有退服恢复情况.png，timeline 拖动不响应 |
| 4   | 无 4 档 tab：单滑轨                                   | PM 截图设计为准                                    |
| 5   | thumb 形态：棉花糖头 + 棍                             | 用户多轮迭代最终方案                               |
| 6   | thumb-time tooltip：chip 化（深蓝背景 + 蓝边框）      | 适配面板 `rgb(17,31,50)` 偏深底色                  |
| 7   | label 样式：无 active 蓝分支                          | 用户去 active 高亮决定                             |
| 8   | label stride = 5                                      | HH:mm:ss 8 字符较宽，需透气                        |
| 9   | mount snap 到 max                                     | 滑轨默认在"现在"                                   |
| 10  | className 全面 BEM 化                                 | 为未来 CSS 下放留位                                |
| 11  | 时间点生成：native Date + mount 一次性快照            | 避免依赖风险 + 防止长会话漂移                      |
| 12  | mock status 恒为 1，通过数量增减体现退服恢复          | 用户 2026-08-25 拍板                               |
| 13  | mock 仅 city / company / district 三层                | street 走原 markerData 路径                        |
| 14  | **isHistoryActive ≡ (currentTimeIndex !== max)** —— 配对 setCurrentTimeIndex + setHistoryActive 调用 | 拖到右端"现在"自动回实时数据（含完整 6 类资源），解决"timeline 一旦触摸历史态永不退出"的 v1 bug |
| 15  | **history-timeline.json idx=23 与 map-markers.json 对应 layer 全等** | 与 #14 联防：用户视角下"现在"无差别；mock 同步可走 `gen-history-timeline-mock.cjs` 单点脚本 |
| 16  | 资源到位 phase 表（emergency → repair → gen → sat-bag → wireless → transmission）| 应急调度时序 mock 数据；PM 未给历史时序，按行业常识排；若 PM 提供真实数据替换 `SUBTYPE_PHASE` 即可 |

> 决策 #14 / #15 / #16 为 2026-08-26 timeline↔6 资源联动修复新增。

---

## 9. 未做的潜在工作

| 项                                     | 说明                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 自动播放模式                           | 拖动控制，无自动循环播放（用户原 plan 拍板）                                                  |
| 历史点位对比 / 多帧叠加                | 不在范围                                                                                      |
| 时间轴动画                             | 拖动滑块的平滑过渡，未实现                                                                    |
| 时间点指示线（地图上画"当前时间"标记） | 未实现                                                                                        |
| 联动网络影响 / 基站退服趋势            | 不联动（task006 独立）                                                                        |
| 历史数据导出 / 截图 / 录像             | 不在范围                                                                                      |
| 自定义档日期选择器                     | 不在范围（沿用 task004 的 antd DatePicker 简化版）                                            |
| CSS 下放                               | className 已就位，静态样式可下放到 `timeline-history.module.css`                              |
| mount snap 持久化                      | 当前默认 snap 到 max；若需保留"上次退出时 idx"则 store 持久化                                 |
| street 层 timeline 禁用态              | 当前 street 渲染但不响应拖动；可加 `disabled` 视觉提示                                        |
| PM 真实数据源接入                      | 当前用 mock；下游接口 `fetch('/api/history-timeline?range=...')` 接入时 store + 组件 API 不变 |

---

## 文档元信息

> 版本：v1.2.0
> 日期：2026-08-26（v1.2.0 — timeline↔6 资源联动修复：§5.2 加入 isHistoryActive 字段与配对写入约束 / §5.4.2 重写为 phase 表 + city idx 演变示例 / §6 mock 数据策略 v3 / §7.3 耦合点表更新 / §8 决策 #14-16）
> 历史：
> - v1.1.0（2026-08-26）：§5 数据流扩展职责边界表 / §5.4 timeline 影响资源打点示例 / §6 mock 与资源打点的关系 / §7.3 地图耦合点速查表
> - v1.0.0（2026-08-25）：从 003-frontend.md §11 拆出，反哺 task006 归档
