# Task 009 — 退服恢复情况 4G/5G 趋势折线图

> **前置**：
>
> -   [done/task-2026-08-24-001-module-init.md](./done/task-2026-08-24-001-module-init.md) 骨架已落地
> -   [done/task-2026-08-25-004-station-outage-chart.md](./done/task-2026-08-25-004-station-outage-chart.md) 基站退服趋势 4 档时间粒度 + `ReactECharts` 模式已落地（本 task 复用趋势图模式）
> -   [done/task-2026-08-25-006-timeline-history.md](./done/task-2026-08-25-006-timeline-history.md) TimelineHistory 已挂在 service-recovery 顶部 + 24 个 5min 间隔时间点已定义
> -   [done/task-2026-08-25-007-time-label-and-clock.md](./done/task-2026-08-25-007-time-label-and-clock.md) 退服恢复时间范围 label 已落地（mount 时快照：此刻往前 2 小时 → 此刻）
>
> **关联文档**：
>
> -   设计稿：[../design/001-pm-output.md](../design/001-pm-output.md)
> -   前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> -   趋势图参考：[../design/frontend/001-modules-params.md](../design/frontend/001-modules-params.md)（结构型叠加变种约定）
> -   当前状态：[../status/current.md](../status/current.md)
> -   自检清单：[../status/checklist.md](../status/checklist.md)
>
> **日期**：2026-08-26
> **状态**：已完成

---

## 一、目标

在 `modules/service-recovery/index.tsx` 内叠加 4G / 5G 双线趋势折线图：

1. **双线对比**：4G 退服恢复数量 + 5G 退服恢复数量（两条折线，区分颜色）
2. **横坐标**：24 个时间点（5 分钟间隔），与 `TimelineHistory` 默认点数对齐（覆盖最近 2 小时）
3. **纵坐标**：min=0，max 由 mock 数据自适应（用户 2026-08-26 拍板：不锁 max=20，靠数据自己说话）
4. **按层级 mock**：city / company / district / street 四层各一份独立 mock（公司全网 / 单分公司 / 单行政区 / 单街道，退服量级递减）
5. **时间轴指示线**：订阅 store `currentTimeIndex`，图表上显示一条白色虚线指示 timeline 当前停留位置
6. **数据形态**：UI 出图 `退服恢复情况.png` 仅提供容器外壳（标题栏 + 装饰边框），内部画布由本 task 叠 echarts 折线图

> 引用 `roadmap.md` 中的关联：本 task 是 task003 §4.3「基站退服列表 + 数量统计」的姐妹 task，针对 A 组"退服恢复情况"模块补业务实现。

---

## 二、背景 / 现状盘点

### 2.1 service-recovery 模块当前实现

[modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx) 当前包含三块内容：

1. `ServiceRecoveryPanel` —— 透传 `退服恢复情况.png`，仅做 `<img objectFit="fill">`
2. `timeRange` label —— task007 落地，浮在图片左上角（left:763 / top:908 / zIndex:100）
3. `TimelineHistory` —— task006 落地，叠加在面板顶部 top:872 / `LEFT+40 ~ WIDTH-50`

模块整体保持 `position: absolute` 散布局（未用外层 wrapper），timeRange + TimelineHistory 直接铺在 ServiceRecoveryPanel 之上。

### 2.2 `退服恢复情况.png` 视觉约束

-   **坐标**：`LEFT=53 / TOP=822 / WIDTH=1790 / HEIGHT=238`（设计稿像素）
-   **视觉**：UI 出图仅绘制**标题栏** + **装饰边框** + **底部线条**，**中间画布区域为空白**，等待前端叠 echarts 折线图
-   **TimelineHistory 已占据 top:872~884**（棉花糖 thumb + 滑轨 + tick）
-   **timeRange label 已占据 top:908 附近的左上角文本位**

→ 折线图画布可放置在 `top:884 ~ top:1060`（≈176px 高），左右各保留 ~16px 边距。

### 2.3 已有基础（可复用）

| 能力             | 来源                                                                                                  | 用途                         |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| `ReactECharts`   | [modules/station-outage/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) | 折线图渲染（task004 已落地） |
| `useRequest`     | `@fedx-web-common/react-hooks`                                                                        | 异步拉取 mock                |
| 静态资源路径前缀 | `constants.STATIC_PATH` / `constants.IMAGE_PATH`                                                      | getter 延迟取值              |
| TimelineHistory  | [components/timeline-history](web/pages/bj-cmcc-cmd-dispatcher/components/timeline-history/)          | 时间轴（视觉留位已固定）     |

### 2.4 为什么这次独立成 task

-   service-recovery 之前只承载 `退服恢复情况.png` 容器 + TimelineHistory + 时间 label，**没有任何业务数据**
-   用户 2026-08-26 拍板：补 4G/5G 双线趋势图（city/company/district 各一份 mock），横坐标 24 点 × 5min，y 轴自适应 mock 数据，外加时间轴指示线联动 timeline 拖动
-   这是 service-recovery 模块首次引入业务渲染（折线图），独立 task 便于 review 与状态追踪

---

## 三、落地方案

### 3.1 目录 / 文件改动

| 文件                                                                             | 类型 | 改动                                                                                                         |
| -------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| `modules/service-recovery/index.tsx`                                             | 改   | 引入 ReactECharts + useRequest（按 `currentLevel` 拉对应 mock）+ 双线 trend option + 时间轴指示线 markLine   |
| `modules/service-recovery/trend-chart.tsx`                                       | 新增 | `ServiceRecoveryTrendChart` 子组件：echarts 折线图本体（无 level 守卫，无 MY_LEVELS 概念，由父模块按需渲染） |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json`     | 新增 | 24 个时间点 × 2 系列（4G + 5G）的 mock 数据；公司全网级，绝对量最大（4G 8→3 / 5G 3→18）                      |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json`  | 新增 | 同上，单分公司级（4G 5→2 / 5G 2→10）                                                                         |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json` | 新增 | 同上，单行政区级（4G 3→1 / 5G 1→6）                                                                          |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json`   | 新增 | 同上，街道级（4G 2→0 / 5G 0→3）；最小粒度，绝对量最小                                                        |
| `status/current.md`                                                              | 改   | 新增 4 个 trend mock 引用 + modules/service-recovery 描述更新（增加"叠加 4G/5G 双线折线图 + 时间轴指示线"）  |
| `status/checklist.md`                                                            | 改   | 追加 task009 收口自检段                                                                                      |

> **拆分理由**（用户 2026-08-26 拍板）：模块入口（index.tsx）只负责"模块级"逻辑（MY_LEVELS 守卫 + 时间范围 label + TimelineHistory + 是否渲染图表），echarts 折线图本身的渲染逻辑下沉到 `trend-chart.tsx`，便于未来 station-performance 等同类模块复用。

### 3.2 关键类型与常量

```ts
// modules/service-recovery/trend-chart.tsx（子组件内私有）
interface TrendPoint {
    label: string; // HH:mm:ss（与 TimelineHistory 的 points 同格式）
    fourG: number; // 4G 退服恢复数量（个），0 ≤ x ≤ 20
    fiveG: number; // 5G 退服恢复数量（个），0 ≤ x ≤ 20
}

interface TrendData {
    level: string; // 'city' | 'company' | 'district'
    unit: string; // '个'
    points: TrendPoint[];
}

// 配色（PM 2026-08-26 拍板）
const FOUR_G_COLOR = 'rgba(68, 215, 182, 1)'; // 4G 冷绿
const FIVE_G_COLOR = 'rgba(24, 144, 255, 1)'; // 5G 亮蓝
const GRID_COLOR = 'rgba(48, 127, 214, 0.1)'; // grid 蓝底淡色

// 轴 label 样式（PM 2026-08-26 拍板）
// color: var(--Dark-10, rgba(255, 255, 255, 1))
// font-family: "Microsoft YaHei"; font-style: Regular; font-size: 15px
// font-weight: 400; line-height: 28px; letter-spacing: 0%; text-align: center
// 注：ECharts 走 canvas 渲染无法解析 CSS 变量，统一用 fallback rgba 值
const AXIS_LABEL = {
    color: 'rgba(255, 255, 255, 1)',
    fontStyle: 'normal',
    fontWeight: 400,
    fontFamily: 'Microsoft YaHei',
    fontSize: 15,
    lineHeight: 28,
    letterSpacing: 0,
    align: 'center',
} as const;

// 画布定位（PM review 微调后）
const CHART_LEFT = 69;
const CHART_TOP = 920;
const CHART_WIDTH = 1766;
const CHART_HEIGHT = 129;
```

> **为什么常量写在 trend-chart.tsx 而不是 index.tsx**：常量强耦合于 chart 组件内部使用（option 引用），放组件内方便 review + 后续提取到 `components/trend-chart/` 时无须再拆分常量。

### 3.3 模块入口（index.tsx）

**改动思路**：保留现有 timeRange + TimelineHistory + ServiceRecoveryPanel 三块，在 `<ServiceRecoveryPanel>` 与 `<TimelineHistory>` 之间**无条件**渲染 `<ServiceRecoveryTrendChart />`。模块级显隐完全交给已有的 `MY_LEVELS` 守卫（[index.tsx#L38](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx#L38)）。

```tsx
// modules/service-recovery/index.tsx
import { ServiceRecoveryTrendChart } from './trend-chart';

// 注意：本模块不再定义 TREND_LEVELS / showTrendChart 守卫
// 模块整体显隐由现有 MY_LEVELS 守卫统一控制，trend-chart 是否渲染由父模块直接决定
export const ServiceRecoveryModule: React.FC = () => {
    const currentLevel = useCurrentLevel();

    // ... 现有 timeRange / MY_LEVELS 守卫 / TIMELINE_LEFT/WIDTH 不变

    if (!MY_LEVELS.includes(currentLevel)) return null;

    return (
        <>
            <ServiceRecoveryPanel ... />
            <div ...>{timeRange}</div>
            <TimelineHistory ... />
            <ServiceRecoveryTrendChart />
        </>
    );
};
```

**关键设计点**：

-   模块入口（index.tsx）不**再**引入额外的层级判断（TREND_LEVELS / showTrendChart）
-   图表本体下沉到 trend-chart.tsx，**不感知**任何 level 概念
-   4 个层级（city / company / district / street）各有一份 mock，图表渲染逻辑零修改即可全层覆盖

### 3.3.1 折线图组件（trend-chart.tsx）

```tsx
// modules/service-recovery/trend-chart.tsx（实际落地版）
import React, { useMemo } from 'react';
import { useRequest } from '@fedx-web-common/react-hooks';
import { constants } from '@/common/constants';
import { ReactECharts } from '~/web/components/large-screen/lib';
import { useCmdDispatcherStore, useCurrentLevel } from '../../store';

// 画布定位（PM review 微调后）
const CHART_LEFT = 69;
const CHART_TOP = 920;
const CHART_WIDTH = 1766;
const CHART_HEIGHT = 129;

// 配色（PM 2026-08-26 拍板）
const FOUR_G_COLOR = 'rgba(68, 215, 182, 1)';
const FIVE_G_COLOR = 'rgba(24, 144, 255, 1)';
const GRID_COLOR = 'rgba(48, 127, 214, 0.1)';

// 轴 label 样式（PM 2026-08-26 拍板）
const AXIS_LABEL = {
    color: 'rgba(255, 255, 255, 1)',
    fontStyle: 'normal',
    fontWeight: 400,
    fontFamily: 'Microsoft YaHei',
    fontSize: 15,
    lineHeight: 28,
    letterSpacing: 0,
    align: 'center',
} as const;

interface TrendPoint {
    label: string;
    fourG: number;
    fiveG: number;
}

interface TrendData {
    level: string;
    unit: string;
    points: TrendPoint[];
}

export const ServiceRecoveryTrendChart: React.FC = () => {
    const currentLevel = useCurrentLevel();
    const currentTimeIndex = useCmdDispatcherStore((s) => s.currentTimeIndex);

    const { data: trend } = useRequest<TrendData, []>(
        async () => {
            const res = await fetch(
                `${constants.STATIC_PATH}/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-${currentLevel}.json`,
            );
            return (await res.json()) as TrendData;
        },
        { refreshDeps: [currentLevel] },
    );

    const xLabels = trend?.points.map((p) => p.label) ?? [];

    const option = useMemo(() => {
        if (!trend) return {};
        return {
            grid: { left: 40, right: 20, top: 16, bottom: 24 },
            tooltip: { show: false },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xLabels,
                axisLine: { lineStyle: { color: GRID_COLOR } },
                axisLabel: {
                    ...AXIS_LABEL,
                    formatter: (val: string) => val.slice(0, 5),
                },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value',
                min: 0,
                axisLine: { show: false },
                splitLine: { lineStyle: { color: GRID_COLOR } },
                axisLabel: { ...AXIS_LABEL },
            },
            series: [
                {
                    name: '4G',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 4,
                    data: trend.points.map((p) => p.fourG),
                    lineStyle: { color: FOUR_G_COLOR, width: 2 },
                    itemStyle: { color: FOUR_G_COLOR },
                    markLine: {
                        symbol: 'none',
                        silent: true,
                        animation: false,
                        label: { show: false },
                        data: [
                            {
                                xAxis: xLabels[currentTimeIndex] ?? xLabels[xLabels.length - 1],
                                lineStyle: { color: '#FFFFFF', width: 1, type: 'dashed', opacity: 0.7 },
                            },
                        ],
                    },
                },
                {
                    name: '5G',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 4,
                    data: trend.points.map((p) => p.fiveG),
                    lineStyle: { color: FIVE_G_COLOR, width: 2 },
                    itemStyle: { color: FIVE_G_COLOR },
                },
            ],
        };
    }, [xLabels, trend, currentTimeIndex]);

    return (
        <div
            style={{
                position: 'absolute',
                left: CHART_LEFT,
                top: CHART_TOP,
                width: CHART_WIDTH,
                height: CHART_HEIGHT,
            }}
        >
            <ReactECharts style={{ width: '100%', height: '100%' }} option={option} replaceMerge={['series']} />
        </div>
    );
};

export default ServiceRecoveryTrendChart;
```

> **markLine 实现要点**：
>
> -   放在 `series` 而非 `xAxis` 是因为 `series.markLine` 在 boundaryGap=false 的 category 轴上能正确锚定到 tick 中点（与 TimelineHistory 的 thumb 视觉对齐）
> -   `silent: true` 不响应鼠标事件，避免与 timeline 拖动手势冲突
> -   `animation: false` 避免拖动过程中频繁重绘
> -   颜色用白色虚线，与 TimelineHistory thumb 棉花糖头白色保持视觉统一

### 3.4 mock 数据（按层级 4 个文件）

> **与 TimelineHistory 对齐**：mock 的 label 数组与 TimelineHistory 默认生成的 24 个时间点**同源**（同 mount 时 `new Date()` 起点，向前 5min 一次）。由于组件 mount 时刻有微秒级差异，**前端**在挂载前不会校验 label 一致，仅视觉上每 5min 一档。

按当前层级（city / company / district / street）拆 4 个独立 mock，覆盖模块 `MY_LEVELS` 全部 4 个层级。沿用 `station-outage` 命名约定 `<模块>-<维度>-<层级>.json`：

| 文件                                                                             | 层级               | 形态特点                                     |
| -------------------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json`     | city（公司全网）   | 退服数绝对值最大，体现"分公司级别的资源聚合" |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json`  | company（分公司）  | 单一分公司层级，退服数显著小于 city          |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json` | district（行政区） | 单一行政区层级，退服数较小                   |
| `public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json`   | street（街道）     | 单街道级，绝对量最小                         |

**每个文件结构**（24 个时间点 × 4G + 5G）：

```json
{
    "level": "city",
    "unit": "个",
    "points": [
        { "label": "HH:mm:ss", "fourG": 8, "fiveG": 3 },
        { "label": "HH:mm:ss", "fourG": 9, "fiveG": 4 },
        // ... 24 个
        { "label": "HH:mm:ss", "fourG": 3, "fiveG": 18 }
    ]
}
```

**叙事**（按层级量级递减，体现"全网聚合 → 单分公司 → 单行政区 → 单街道"的退服规模差）：

| 层级     | 4G 范围 | 5G 范围 | 含义                          |
| -------- | ------- | ------- | ----------------------------- |
| city     | 8 → 3   | 3 → 18  | 公司全网级，绝对量最大        |
| company  | 5 → 2   | 2 → 10  | 单分公司，绝对量明显小于 city |
| district | 3 → 1   | 1 → 6   | 单行政区，绝对量较小          |
| street   | 2 → 0   | 0 → 3   | 单街道级，绝对量最小          |

> 4G 退服数随时间**下降**（恢复），5G 退服数随时间**上升**（新增部署），所有值落在 0~20 区间。

> ⚠️ **mock 数据声明**：4G/5G 数值是示意性时序（PM 未提供历史退服恢复的 4G/5G 拆分数据）。若 PM 后续补正真实数据，直接替换 4 个文件内的 `points[]` 即可，组件 0 改动。

### 3.5 图表位置与 z-order 复核

| 层                                    | z-index  | 来源                                                                                                     |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `Background` 外框                     | 10       | render.tsx inline                                                                                        |
| `MapStage` wrapper + 子元素           | 0        | map-stage.tsx（内部子元素 stacking context 内）                                                          |
| 11 个浮层面板                         | auto = 0 | 各模块 `position: absolute`，与 wrapper 同级                                                             |
| `timeRange` label                     | 100      | task007 落地，左上 left:763/top:908                                                                      |
| `TimelineHistory`                     | 100      | task006 落地，top:872（`Modules` 内 inline style）                                                       |
| **`service-recovery` 折线图（新增）** | **auto** | 本 task 落地，相对于模块 area `top:920 / left:69 / width:1766 / height:129`，位于 `TimelineHistory` 下方 |

> **z-order 风险**：TimelineHistory 整体 zIndex:100，会盖住折线图上半部分。**本 task 不会调整 TimelineHistory 的 zIndex**——折线图整体在 top:920 之下，TimelineHistory 滑轨+thumb 占 top:872~900，二者纵向**不重叠**，无需 z-index 调整。

### 3.6 图例

-   **不新增图例组件**：4G / 5G 颜色区分靠「双线对比」自解释
-   若后续 PM 要求图例，复用 `modules/map/map-legend.tsx` 的 `legendCheckboxes` 模式（task003 已沉淀）

### 3.7 性能 / 兼容性

-   数据量：24 点 × 2 系列 → echarts 内置优化足够，无 `requestAnimationFrame` 需求
-   `replaceMerge={['series']}`：与 station-outage 一致，避免 series 引用变更引起全图重渲
-   4G/5G mock 数值保证落在 0~20 区间内（避免 y 轴自适应导致范围漂移）

### 3.8 时间轴指示线（timeline ↔ chart 联动）

> 用户 2026-08-26 拍板：timeline 滑动停止后，图表上要有一条指示线同步显示当前选中时间点。

**实现位置**：4G series 的 `markLine`（详见 §3.3 代码块）。

**数据流**：

```
用户拖动 TimelineHistory
       ↓
store.setCurrentTimeIndex(idx)   ← TimelineHistory 在 pointerup 时调用
       ↓
service-recovery 模块订阅 currentTimeIndex
       ↓
option useMemo 依赖 [xLabels, trend, currentTimeIndex]
       ↓
echarts 重渲 markLine（垂直白色虚线，锚定 xLabels[idx]）
```

**视觉**：

-   颜色：`#FFFFFF`（与 TimelineHistory thumb 棉花糖头同色）
-   线型：`dashed`，宽 1px，opacity 0.7
-   范围：从 x 轴顶部到底部（series 默认行为）
-   不响应鼠标（`silent: true`）—— 避免与 TimelineHistory 拖动手势冲突

**边界处理**：

-   `currentTimeIndex === max`（"现在"）→ markLine 锚定到 x 轴最右端，与 thumb 视觉位置一致
-   `currentTimeIndex === 0`（最早点）→ markLine 锚定到 x 轴最左端
-   `xLabels` 为空（mock 未加载）→ markLine 不渲染（data 为空数组时 echarts 自动忽略）

**不在本次范围**：

-   ❌ markLine 上叠加时间 label（hover 才显示）→ 不在 PM 拍板范围内
-   ❌ markLine 拖动（点 markLine 反向跳 timeline）→ 当前 markLine 仅展示，不交互

---

## 四、不在本次范围

-   ❌ 图例（4G/5G 颜色说明）→ 用户未要求，组件依赖颜色自解释
-   ❌ tooltip 弹层（hover 详情）→ 用户未要求

---

## 五、验收标准

1. 页面 `/bj-cmcc-cmd-dispatcher` 可正常打开，无运行时报错
2. `modules/service-recovery/index.tsx` 引入 `ReactECharts` + `useRequest`，新增折线图 option + markLine
3. `service-recovery-trend-{city,company,district,street}.json` 4 个 mock 文件存在，JSON 合法，各 24 个 points
4. 折线图渲染：4G 冷绿线（`rgba(68, 215, 182, 1)`）+ 5G 亮蓝线（`rgba(24, 144, 255, 1)`），smooth + symbol:circle，**无 areaStyle 渐变填充**（最终落地版删除）
5. y 轴 min=0；4G/5G mock 数值自动适配 y 轴上限（city 4G 8→3 / 5G 3→18；company 5→2 / 2→10；district 3→1 / 1→6；street 2→0 / 0→3）
6. x 轴 24 个 5min 间隔时间点；label 样式：白 `rgba(255,255,255,1)` + Microsoft YaHei 15px + fontWeight 400 + lineHeight 28
7. grid 颜色：`rgba(48, 127, 214, 0.1)`（PM 拍板蓝底淡色）
8. city / company / district / street 4 个层级均显示折线图 + markLine（各层级加载对应 mock）
9. TimelineHistory 滑轨、timeRange label、`退服恢复情况.png` 容器均正常显示，无 z-order 遮挡
10. **markLine 联动**：拖动 TimelineHistory 滑轨，松手后图表上显示一条白色虚线指示线，位置对齐 thumb 停留处对应的 x 轴 tick

---

## 六、文档同步要求

| 触发动作                                                                    | 必须更新                                                                                                                                          | 状态 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 新增 4 个 `service-recovery-trend-{city,company,district,street}.json` mock | `status/current.md`（Mock 数据清单）                                                                                                              | ✅   |
| 修改 `modules/service-recovery/index.tsx` 加折线图 + markLine               | `status/current.md`（modules/service-recovery 描述更新）+ `design/frontend/001-modules-params.md`（service-recovery 形态：复用组件 → 结构型叠加） | ✅   |
| 新增 task 文件                                                              | `roadmap.md`（看板勾选 M3 全部完成 → M4 推进）                                                                                                    | ✅   |
| —                                                                           | `status/checklist.md` 自检                                                                                                                        | ✅   |

---

## 七、看板

-   [x] 创建 `service-recovery-trend-city.json`（24 个点，4G 8→3 / 5G 3→18）
-   [x] 创建 `service-recovery-trend-company.json`（24 个点，4G 5→2 / 5G 2→10）
-   [x] 创建 `service-recovery-trend-district.json`（24 个点，4G 3→1 / 5G 1→6）
-   [x] 创建 `service-recovery-trend-street.json`（24 个点，4G 2→0 / 5G 0→3）
-   [x] 新增 `modules/service-recovery/trend-chart.tsx`：`ServiceRecoveryTrendChart` 子组件（echarts 折线图本体，无 level 守卫）
-   [x] 修改 `modules/service-recovery/index.tsx`：import trend-chart + 无条件渲染 `<ServiceRecoveryTrendChart />`
-   [x] 验证：4G/5G 双线渲染、x 轴 24 点、markLine 跟随 timeline 拖动
-   [x] 验证：与 TimelineHistory + timeRange label 无 z-order 冲突
-   [x] 同步 `status/current.md`（mock 清单 + service-recovery 描述）
-   [x] 同步 `design/frontend/001-modules-params.md`（service-recovery 形态）
-   [x] 同步 `roadmap.md`（看板勾选）
-   [x] 按 `status/checklist.md` 自检

---

## 八、PM 待澄清

| #   | 事项                                          | 阻塞 | 说明                                                                         |
| --- | --------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| 1   | 4G/5G 折线颜色是否符合 PM 期望                | 否   | 暂用冷蓝 + 暖青蓝区分；如 PM 给出色卡直接替换常量                            |
| 2   | 4G/5G mock 数值时序（4G 降 / 5G 升）是否合理  | 否   | 体现"4G 退服恢复 + 5G 新增部署"运维时序；PM 提供真实数据可直接覆写 points[]  |
| 3   | 是否需要图例（4G / 5G 颜色说明）              | 否   | 当前不引入；如 PM 要求，复用 `map-legend` Checkbox 模式                      |
| 4   | 是否需要 tooltip（hover 显示 4G/5G 具体数值） | 否   | 当前不引入；如 PM 要求，复用 `modules/network-impact` 内的 antd Popover 模式 |

---

## 九、实施记录（2026-08-26）

### 9.1 实际落点清单

**新增文件**：

-   [modules/service-recovery/trend-chart.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/trend-chart.tsx) —— `ServiceRecoveryTrendChart` 子组件（echarts 折线图本体）
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-city.json)
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-company.json)
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-district.json)
-   [public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json](public/static/mock/bj-cmcc-cmd-dispatcher/service-recovery-trend-street.json)

**修改文件**：

-   [modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx) —— import + 无条件渲染 `<ServiceRecoveryTrendChart />`
-   [status/current.md](../status/current.md) —— 模块表 + mock 表 + 元信息更新
-   [status/checklist.md](../status/checklist.md) —— 新增 Task009 收口自检章节
-   [design/frontend/001-modules-params.md](../design/frontend/001-modules-params.md) —— service-recovery 形态（复用组件 → 结构型叠加）

### 9.2 关键决策偏差（vs 原 plan）

| #   | 偏差项             | 原 plan                                             | 实际落地                                                                                                 | 决策方                                  |
| --- | ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | y 轴 max           | 锁 max=20                                           | **不锁**，由 mock 自适应                                                                                 | 用户拍板（早期反馈）                    |
| 2   | mock 拆分粒度      | 3 个（city/company/district）                       | 4 个（+street）                                                                                          | 用户拍板（中期反馈）                    |
| 3   | TREND_LEVELS 守卫  | index.tsx 内 TREND_LEVELS + showTrendChart 条件渲染 | **完全移除**，trend-chart.tsx 不感知 level                                                               | 用户拍板（晚期反馈）                    |
| 4   | 4G/5G 配色         | `#5DD5F5` 冷蓝 + `#A6BEEC` 暖青蓝                   | `rgba(68, 215, 182, 1)` 冷绿 + `rgba(24, 144, 255, 1)` 亮蓝                                              | 用户手动微调                            |
| 5   | areaStyle 渐变填充 | 有（4G + 5G 各自渐变 area）                         | **完全移除**，仅折线                                                                                     | 用户手动删除                            |
| 6   | grid 颜色          | `rgba(255, 255, 255, 0.08)` 白色淡                  | `rgba(48, 127, 214, 0.1)` 蓝色淡                                                                         | 用户拍板                                |
| 7   | 画布定位           | top:884 / height:164                                | top:920 / height:129 / width:1766 / left:69                                                              | 用户手动微调（按新 `退服恢复情况.png`） |
| 8   | fontSize           | 14                                                  | 15                                                                                                       | 用户手动微调                            |
| 9   | label 样式         | 仅 color / fontSize / fontFamily                    | 完整 spec（color / fontStyle / fontWeight / fontFamily / fontSize / lineHeight / letterSpacing / align） | PM 拍板                                 |

### 9.3 校验结果

-   ✅ TypeScript：`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` 0 错误（trend-chart.tsx + index.tsx）
-   ✅ JSON 解析：4 个 mock 文件均合法（node -e 验证）
-   ✅ 数据逻辑性校验：24 × 2 序列满足 `city > company > district >= street`（脚本校验通过）
-   ⚠️ `pnpm run lint` 因 sandbox pnpm store 权限问题未跑通（项目预存的 eslint prettier 配置冲突也与本次无关）

### 9.4 scope 外的已知问题

-   ❌ `退服恢复情况.png` 图片资源未替换（PM 自己手动换，本 task 不涉及）
-   ❌ markLine 拖动反向跳 timeline（仅展示，不交互）—— PM 未要求
-   ❌ tooltip 弹层 / 图例 / 4G/5G 颜色说明 —— PM 未要求
-   ❌ 历史 mock 数据未对齐 TimelineHistory mount 时刻的 label（mock 用占位 label 12:35-14:30，与 mount 时实际生成的 24 时间点微秒级不一致，前端不校验）

### 9.5 后续 task 建议

-   Task010+：street 层显示折线图但 y 轴接近 0~3 量级，建议加 `yAxis.min: 0, max: dynamic` 适配街道小量级，或 `splitNumber: 3` 控制 y 轴刻度密度
-   Task010+：若 PM 要求 `退服恢复情况.png` 内部画布区域改为标题栏外侧（避免 timeline + 时段 label 与折线图重叠），需重新校准 CHART_LEFT/TOP/WIDTH/HEIGHT

---

## 文档元信息

> **日期**：2026-08-26（创建 → 归档）
> **状态**：已完成（2026-08-26 归档至 `done/`）
