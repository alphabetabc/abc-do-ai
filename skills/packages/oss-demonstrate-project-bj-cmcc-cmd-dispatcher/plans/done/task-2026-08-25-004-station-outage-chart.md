# Task 004 — 基站退服模块能力补齐（趋势图 + 时间粒度）

> **前置**：
>
> -   [done/task-2026-08-24-001-module-init.md](../done/task-2026-08-24-001-module-init.md) 骨架已落地
> -   [done/task-2026-08-24-002-map.md](../done/task-2026-08-24-002-map.md) 地图模块已完工
> -   [task-2026-08-24-003-bcd-modules.md](../task-2026-08-24-003-bcd-modules.md) §4.3 已挂出"基站退服数据支持"待办，本 task 接续实施
>
> **关联文档**：
>
> -   设计稿：[../../design/001-pm-output.md](../../design/001-pm-output.md)
> -   前端规范：[../../design/003-frontend.md](../../design/003-frontend.md)
> -   当前状态：[../../status/current.md](../../status/current.md)
> -   自检清单：[../../status/checklist.md](../../status/checklist.md)
>
> **日期**：2026-08-25
> **状态**：待 review

---

## 一、目标

1. **替换基站退服模块为交互式结构模块**：不再仅展示静态图片，而是真实渲染日 / 周 / 月 / 自定义 4 档时间粒度下的退服趋势线图。
2. **对齐 PM 给出的完整设计稿**（`基站退服-full.png`）：标题 + tab 切换 + 单位标签 + 平滑折线 + 区域渐变。
3. **为后续 station-performance / 退服恢复情况 等同类趋势模块沉淀可复用模式**（如有复用价值，迁到 `components/`；否则保持模块本地）。
4. 同步 `task003 §4.3` 待办勾选。

> 引用 `roadmap.md` 中的 T 编号：T9（modules 拆 widget 占位）已落地，本 task 在占位上补业务实现。

---

## 二、背景 / 现状盘点

### 2.1 当前实现

[modules/station-outage/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) 当前仅：

```tsx
return (
    <img
        src="/static/images/bj-cmcc-cmd-dispatcher/基站退服.png"
        alt="基站退服"
        style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT, objectFit: 'fill' }}
    />
);
```

-   `基站退服.png`：空容器框（仅标题 + 底部虚线装饰，无任何业务内容）。
-   `基站退服-full.png`：PM 提供的完整设计稿（含 tab + 线图），目前**未被任何代码引用**。

### 2.2 模块坐标与层级（基于 status/current.md）

| 项       | 值                                                                         |
| -------- | -------------------------------------------------------------------------- |
| 坐标     | `left: 1878 / top: 726 / w: 906 / h: 323`                                  |
| 可见层级 | `city / company / district / street / community`（A+B 组，与 网络影响 同） |
| 静态图片 | `基站退服.png`（A+B 组共用一张图）                                         |

### 2.3 已有基础（可复用）

| 能力              | 来源                                                          | 用途               |
| ----------------- | ------------------------------------------------------------- | ------------------ |
| `ReactECharts`    | `web/components/large-screen/lib` (`@fedx-vis/react-echarts`) | 折线图渲染         |
| `useRequest`      | `@fedx-web-common/react-hooks`                                | 异步数据           |
| `antd DatePicker` | `antd 5.22.5`                                                 | 自定义时间区间选择 |
| 静态资源路径前缀  | `constants.IMAGE_PATH`                                        | getter 延迟取值    |

参考实现：[modules/network-impact/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx) 的 `Record<Level, { get src(): string }>` getter 模式。

### 2.4 为什么这次独立成 task

-   task003 主要承担 B/C/D 组**模块图片接入**与 PM **命名二次确认**，能力补齐仅在 §4.3 简述。
-   趋势图涉及 echarts 集成 + mock 数据结构 + 自定义日期区间 + 样式对齐，是独立可交付单元。
-   沿用 task001 ~ task003 的命名约定 `task-2026-08-25-004-station-outage-chart.md`。

---

## 三、落地方案

### 3.1 目录 / 文件改动

| 文件                                                                         | 类型 | 改动                                                            |
| ---------------------------------------------------------------------------- | ---- | --------------------------------------------------------------- |
| `modules/station-outage/index.tsx`                                           | 改   | 重写：从 `<img>` 切换为结构型组件，含 Tab / 单位 / 折线图三部分 |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend.json`        | 新增 | 4 档数据（日 / 周 / 月 / 自定义）的合并 Mock                    |
| `public/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-custom.json` | 新增 | 自定义档单独 Mock（前端带 `[start, end]` 入参时拉取）           |
| `status/current.md`                                                          | 改   | 新增 trend mock 引用 + modules/station-outage 描述更新          |
| `status/checklist.md`                                                        | 改   | 追加 task004 收口自检段                                         |
| `task-2026-08-24-003-bcd-modules.md`                                         | 改   | §4.3 / §五 看板勾选 + 引用 task004                              |

### 3.2 组件分层（推荐）

为方便维护与复用，按以下三层拆分（不引入新目录，所有代码放在 `modules/station-outage/` 内）：

```
modules/station-outage/
├── index.tsx              # 模块入口：MY_LEVELS + 定位 + 标题栏
├── trend-chart.tsx        # echarts 折线图组件（受控 xData/yData/title/unit）
├── trend-tabs.tsx         # 日/周/月/自定义 4 个 tab + active 状态
└── trend-types.ts          # TrendRange / TrendData 类型 + 常量
```

> **判断依据**：本次只在 1 个模块使用，暂不升级到 `components/` 跨模块共享；后续若 station-performance / 退服恢复情况 等也要做趋势，再抽 `components/trend-panel/`。

### 3.3 关键类型与常量

```ts
// modules/station-outage/trend-types.ts
export type TrendRange = 'day' | 'week' | 'month' | 'custom';

export interface TrendDataPoint {
    /** 横轴标签（HH:mm / MM-dd / 第 N 周 等） */
    label: string;
    /** 退服基站数（个） */
    value: number;
}

export interface TrendDataset {
    range: TrendRange;
    unit: string; // "个"
    /** 当 range = 'custom' 时必填，否则可选 */
    customRange?: [string, string]; // ISO yyyy-mm-dd
    points: TrendDataPoint[];
}

// 颜色（与 UI 设计稿对齐）
export const LINE_COLOR = '#5DD5F5'; // 青色折线
export const AREA_COLOR_TOP = 'rgba(93, 213, 245, 0.45)';
export const AREA_COLOR_BOTTOM = 'rgba(93, 213, 245, 0)';
export const AXIS_LABEL_COLOR = 'rgba(255,255,255,0.65)';
export const GRID_COLOR = 'rgba(255,255,255,0.08)';
```

### 3.4 模块入口（index.tsx）

```tsx
const MY_LEVELS: Level[] = ['city', 'company', 'district', 'street', 'community'];
const LEFT = 1878,
    TOP = 726,
    WIDTH = 906,
    HEIGHT = 323;

export const StationOutageModule: React.FC = () => {
    const currentLevel = useCurrentLevel();
    if (!MY_LEVELS.includes(currentLevel)) return null;

    const [range, setRange] = useState<TrendRange>('day');
    const [customRange, setCustomRange] = useState<[string, string] | null>(null);

    return (
        <div style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT }}>
            {/* 1. 标题栏 */}
            <Header title="基站退服" range={range} onRangeChange={setRange} />
            {/* 2. 单位标签 */}
            <span style={{ position: 'absolute', left: 16, top: 44, color: '#9bd9ee', fontSize: 14 }}>单位（个）</span>
            {/* 3. 折线图 */}
            <TrendChart range={range} customRange={customRange} />
            {/* 4. 自定义档：日期选择器（仅 range === 'custom' 时展开） */}
            {range === 'custom' && <CustomRangePicker value={customRange} onChange={setCustomRange} />}
        </div>
    );
};
```

### 3.5 TrendTabs（trend-tabs.tsx）

```tsx
const TABS: { key: TrendRange; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
    { key: 'custom', label: '自定义' },
];

export const TrendTabs: React.FC<{
    value: TrendRange;
    onChange: (v: TrendRange) => void;
}> = ({ value, onChange }) => (
    <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 2 }}>
        {TABS.map((t) => {
            const active = value === t.key;
            return (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    style={{
                        width: 56,
                        height: 28,
                        fontSize: 13,
                        background: active ? 'rgba(93,213,245,0.25)' : 'transparent',
                        border: '1px solid rgba(93,213,245,0.4)',
                        color: active ? '#5DD5F5' : '#9bd9ee',
                        cursor: 'pointer',
                    }}
                >
                    {t.label}
                </button>
            );
        })}
    </div>
);
```

> 样式细节以 `基站退服-full.png` 为准（active tab 为蓝色高亮带描边）；最终坐标 / 圆角 / 字号以设计稿为准微调。

### 3.6 TrendChart（trend-chart.tsx）

```tsx
import { ReactECharts } from '~/web/components/large-screen/lib';

export const TrendChart: React.FC<{
    range: TrendRange;
    customRange?: [string, string] | null;
}> = ({ range, customRange }) => {
    // 1. 取数据
    const url =
        range === 'custom'
            ? `/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend-custom.json?from=${customRange?.[0]}&to=${customRange?.[1]}`
            : `/static/mock/bj-cmcc-cmd-dispatcher/station-outage-trend.json`;
    const { data } = useRequest(() => fetch(url).then((r) => r.json()));
    const ds: TrendDataset | undefined = data?.data?.find((d: TrendDataset) => d.range === range);

    // 2. 组装 echarts option
    const option = useMemo(
        () => ({
            grid: { left: 40, right: 16, top: 24, bottom: 32 },
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: ds?.points.map((p) => p.label) ?? [],
                axisLine: { lineStyle: { color: GRID_COLOR } },
                axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 12 },
            },
            yAxis: {
                type: 'value',
                min: 0,
                axisLine: { show: false },
                splitLine: { lineStyle: { color: GRID_COLOR } },
                axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 12 },
            },
            series: [
                {
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    data: ds?.points.map((p) => p.value) ?? [],
                    lineStyle: { color: LINE_COLOR, width: 2 },
                    itemStyle: { color: LINE_COLOR },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: AREA_COLOR_TOP },
                                { offset: 1, color: AREA_COLOR_BOTTOM },
                            ],
                        },
                    },
                },
            ],
        }),
        [ds],
    );

    return (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 70, bottom: 0 }}>
            <ReactECharts style={{ width: '100%', height: '100%' }} option={option} />
        </div>
    );
};
```

### 3.7 自定义日期区间（仅 `range === 'custom'` 展示）

```tsx
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

export const CustomRangePicker: React.FC<{
    value: [string, string] | null;
    onChange: (v: [string, string] | null) => void;
}> = ({ value, onChange }) => {
    const dv: [Dayjs, Dayjs] | null = value ? [dayjs(value[0]), dayjs(value[1])] : null;
    return (
        <div style={{ position: 'absolute', left: 100, top: 44 }}>
            <DatePicker.RangePicker
                value={dv}
                onChange={(v) => onChange(v ? [v[0]!.format('YYYY-MM-DD'), v[1]!.format('YYYY-MM-DD')] : null)}
                size="small"
                format="YYYY-MM-DD"
            />
        </div>
    );
};
```

> 简化策略：自定义档不做服务端区间聚合，前端根据入参 `[from, to]` 在 mock 中挑最近一份匹配（或前端按 `from/to` 字段过滤现有 `points`）；本 task 不引入后端聚合。

### 3.8 Mock 数据结构

**`station-outage-trend.json`**（日 / 周 / 月 三档写死数据）：

```json
{
    "data": [
        {
            "range": "day",
            "unit": "个",
            "points": [
                { "label": "00:00", "value": 2 },
                { "label": "02:00", "value": 1 },
                { "label": "04:00", "value": 3 },
                { "label": "06:00", "value": 8 },
                { "label": "08:00", "value": 21 },
                { "label": "10:00", "value": 30 },
                { "label": "12:00", "value": 25 },
                { "label": "14:00", "value": 18 },
                { "label": "16:00", "value": 16 },
                { "label": "18:00", "value": 14 },
                { "label": "20:00", "value": 6 },
                { "label": "22:00", "value": 2 }
            ]
        },
        {
            "range": "week",
            "unit": "个",
            "points": [
                { "label": "周一", "value": 120 },
                { "label": "周二", "value": 145 },
                { "label": "周三", "value": 168 },
                { "label": "周四", "value": 132 },
                { "label": "周五", "value": 156 },
                { "label": "周六", "value": 98 },
                { "label": "周日", "value": 87 }
            ]
        },
        {
            "range": "month",
            "unit": "个",
            "points": [
                { "label": "1月", "value": 3200 },
                { "label": "2月", "value": 2980 },
                { "label": "3月", "value": 3450 },
                { "label": "4月", "value": 3120 },
                { "label": "5月", "value": 2890 },
                { "label": "6月", "value": 3050 },
                { "label": "7月", "value": 3340 },
                { "label": "8月", "value": 3580 },
                { "label": "9月", "value": 3210 },
                { "label": "10月", "value": 2950 },
                { "label": "11月", "value": 2780 },
                { "label": "12月", "value": 3100 }
            ]
        }
    ]
}
```

**`station-outage-trend-custom.json`**（自定义档：3 份预切片，前端按 `from/to` 选最近一份）：

```json
{
    "data": [
        {
            "range": "custom",
            "customRange": ["2026-08-01", "2026-08-07"],
            "unit": "个",
            "points": [
                { "label": "08-01", "value": 18 },
                { "label": "08-02", "value": 22 },
                { "label": "08-03", "value": 15 },
                { "label": "08-04", "value": 28 },
                { "label": "08-05", "value": 32 },
                { "label": "08-06", "value": 19 },
                { "label": "08-07", "value": 12 }
            ]
        },
        {
            "range": "custom",
            "customRange": ["2026-08-08", "2026-08-14"],
            "unit": "个",
            "points": [
                /* ... */
            ]
        },
        {
            "range": "custom",
            "customRange": ["2026-08-15", "2026-08-21"],
            "unit": "个",
            "points": [
                /* ... */
            ]
        }
    ]
}
```

> **简化策略**：自定义档不做真实区间聚合；mock 准备 3 份预切片，前端按入参 `[from, to]` 与 mock `customRange` 做日期交集判断，取交集最大的一份。范围不匹配时退化为最新一份并 console.warn。

### 3.9 静态资源处理

-   **不再使用 `基站退服.png`**：本 task 移除该图作为模块背景；保留作为组件调试用 fallback（组件 `src` 为空时回到 `<img>` 显示）。
-   `基站退服-full.png`：**仅供开发对照**，不进生产构建路径（已存在 `public/static/images/` 但无代码 import，不影响产物体积）。

### 3.10 性能 / 兼容性

-   echarts option 用 `useMemo` 缓存，避免每次 render 重算。
-   Tab 切换不重建 `<ReactECharts>`，通过 option merge 复用实例（`replaceMerge: ['series']`）。
-   自定义档 mock 切换为本地预切片，不引入异步 loading 闪烁（loading 体验保持流畅）。

---

## 四、不在本次范围

-   ❌ 后端真实数据接入（fetch / socket）
-   ❌ 表格 / 列表实现（task003 §4.3 的"退服基站列表 / 数量统计"延后）
-   ❌ 按层级切换数据 / 图片（沿用现有 `基站退服.png`，与网络影响模块"按层级切换"不同步）
-   ❌ echarts 主题切换 / 暗色适配（用 inline style 写死配色，不引入自定义 theme）
-   ❌ tab 间动画过渡（保留直接切换，与现有 UI 风格一致）
-   ❌ 导出图片 / 打印 / 大屏控制（Demo 范围）
-   ❌ 升级到跨模块共享的 `components/trend-panel/`（待后续模块也需趋势时再抽）
-   ❌ 退服恢复情况模块的同步改造（task001 §9.5 命名二次确认已取消）

---

## 五、验收标准

1. ~~`modules/station-outage/` 目录下新增 `index.tsx` / `trend-chart.tsx` / `trend-tabs.tsx` / `trend-types.ts`~~ → 实施中合并到单一 `index.tsx`，便于就近维护
2. ✅ `modules/station-outage/index.tsx` 不再是纯 `<img>`，改为「图片背景 + 4 tab + 单位 + 折线图 + 自定义日期」叠加
3. ✅ `MY_LEVELS` 保持 `['city','company','district','street','community']`，非可见层级 `return null` 卸载
4. ✅ 4 个 tab（`day` / `week` / `month` / `custom`）可点击切换，active 状态视觉对齐 `基站退服-full.png`
5. ✅ 默认选中 `day`，折线图正确渲染 12 个小时点（00:00 ~ 22:00）
6. ✅ 切换至 `week` / `month` 时横轴标签（mm:dd）与数据点对应切换
7. ✅ 切换至 `custom` 时显示 antd `DatePicker.RangePicker`，选完区间后按 mock 切片过滤并渲染
8. ✅ 折线 `smooth: true`，区域渐变 `rgba(93,213,245,0.45) → rgba(93,213,245,0)`
9. ✅ 单位标签 "单位（个）" 渲染在标题下方左侧（`top:62 / left:20`），使用 PM 指定色 `rgba(166,190,206,1)` + `Microsoft YaHei` + `17.76px`
10. ✅ 曲线左右两端与 y 轴边界对齐（`grid.right: 0` + `xAxis.boundaryGap: false`）
11. ✅ `public/static/mock/bj-cmcc-cmd-dispatcher/` 目录下新增 5 份 `{level}` mock JSON
12. ✅ TS 编译 0 错误（cmd-dispatcher scope 内）
13. ✅ 自定义档半选状态（仅选 start）不触发过滤，避免图表抖动
14. ✅ 数据按层级严格 ≤ max 限制（脚本校验通过）

---

## 六、文档同步要求

| 触发动作                                       | 必须更新                                                                                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 模块从图片型 → 结构型                          | `status/current.md`（modules/station-outage 描述 + 资源清单移除 `基站退服.png` 引用）+ `design/frontend/001-modules-params.md`（`station-outage` 行：形态改为"结构型"） |
| 新增 2 份 mock JSON                            | `status/current.md`（Mock 数据表新增 2 行）                                                                                                                             |
| `task003 §4.3 / §五` 看板                      | 勾选"基站退服数据支持 → 趋势图"项，并标注"已分流到 task004"                                                                                                             |
| 新增组件分层约定（modules/<x>/index + 子文件） | `design/003-frontend.md` §5 目录约定补充"复杂模块允许内部分文件"                                                                                                        |
| 本 task 收口                                   | `status/checklist.md` 追加 task004 收口自检段                                                                                                                           |

---

## 七、看板

-   [x] 重写 `modules/station-outage/index.tsx`（背景图 + 4 tab + 单位 + 折线图 + 自定义日期；单文件集成，便于就近维护）
-   [x] mock 数据：5 份 `{level}.json`（city/company/district/street/community）
-   [x] mock 数据：自定义档 4 份周切片（8/1-8/7、8/8-8/14、8/15-8/21、8/22-8/28）
-   [x] 视觉对齐 `基站退服-full.png`（tab / 单位 / 折线 / 区域 / 配色）
-   [x] TS 编译 0 错误
-   [x] 同步 `status/current.md`（modules 描述 + mock 表 + 资源表）
-   [x] 同步 `design/frontend/001-modules-params.md`（station-outage 行：形态改为"结构型"）
-   [x] 同步 `task-2026-08-24-003-bcd-modules.md`（§五 看板：趋势图分流标 ✅）
-   [x] 数据合规校验：5 份 mock max ≤ 各层级限制

---

## 八、收口：反哺 design

-   本 task 不产出 PM / 设计该给而未给的内容，无需回填 `001-pm-output.md`。
-   模块形态由"图片型"升"结构型"，仅是工程实现差异，不构成验收基线变更。

---

## 九、PM 待澄清

| 项                             | 状态   | 处理                                                                                |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| 自定义档日期区间是否需要聚合？ | 不阻塞 | 本 task 简化为前端挑最近预切片，**未对齐 PM**，按 Demo 范围处理；后续真实接入时再问 |
| 不同层级下是否要不同数据？     | 不阻塞 | 沿用现有"5 层级共用一份 mock"策略，**未对齐 PM**；若 PM 后续要求再做                |
| 折线配色 / 单位 / 字号微调     | 不阻塞 | 按 `基站退服-full.png` 设计稿为基线开发；若 PM 反馈再调                             |

---

## 十、实施记录

> 本节在 task 完成后回填。

---

## 文档元信息

> **日期**：2026-08-25
> **状态**：待 review
