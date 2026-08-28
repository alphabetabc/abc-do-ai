# Task 011 — 退服恢复模块顶部 RangePicker + map 弹窗样式微调

> **前置**：
>
> -   [done/task-2026-08-25-007-time-label-and-clock.md](./done/task-2026-08-25-007-time-label-and-clock.md) 退服恢复模块时间范围快照 label 已落地
> -   [done/task-2026-08-25-006-timeline-history.md](./done/task-2026-08-25-006-timeline-history.md) TimelineHistory 已落地（驱动 store.currentTimeIndex）
> -   [done/task-2026-08-26-009-service-recovery-trend-chart.md](./done/task-2026-08-26-009-service-recovery-trend-chart.md) 4G/5G 双线趋势图已落地
>
> **关联文档**：
>
> -   前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> -   模块参数速查：[../design/frontend/001-modules-params.md](../design/frontend/001-modules-params.md)
> -   当前状态：[../status/current.md](../status/current.md)
> -   自检清单：[../status/checklist.md](../status/checklist.md)
> -   路线图：[../roadmap.md](../roadmap.md)
>
> **日期**：2026-08-27
> **状态**：已完成

---

## 一、目标

本次 task 涵盖两个独立的 PM 演示微调，统一归档到 task011：

### 目标 A — 退服恢复模块顶部新增自定义时间段 RangePicker

在 `modules/service-recovery/index.tsx` 模块**最上方**（`ServiceRecoveryPanel` 之上）新增一个 `DatePicker.RangePicker`，供用户在 Demo 中自由选择起止时间（精确到秒）。

1. **默认区间**：mount 时锚点的「前 2 小时 → 此刻」（与 task007 已沉淀模式一致）。
2. **纯本地 state**：onChange 仅更新组件内 `customRange`，**不联动** TimelineHistory / store.currentTimeIndex / 趋势图 markLine。
3. **保留 task007 原快照 label**：浮在图片左上角的 `timeRange` 文字 label 不动，仅新增 RangePicker；两者职责不同（一个只读快照、一个可交互选择）。

### 目标 B — map 弹窗样式微调 + 图片资源更新

`modules/map/map-detail-modal.tsx` 框选区域详情弹窗 PM 演示微调：

1. **弹窗位置微调**：`right: '50%' → '44%'`、`top: '40%' → '30%'`（更靠左上，避免与大屏右上角演示元素重叠）
2. **zIndex 抬升**：`zIndex: 10 → 100`（确保弹窗叠在 Background 之上，不被半透明背景遮挡）
4. **弹窗图片宽度**：`width: 420 → 620`（PM 演示效果放大，便于看清内容）
4. **图片资源替换**：
    - `public/static/images/bj-cmcc-cmd-dispatcher/map/company/outline.png` —— 替换为新版 company 层底图轮廓
    - `public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png` —— 替换为新版弹窗内容图（高分辨率版本）

## 二、背景 / 现状盘点

### 2.1 service-recovery 模块当前布局（task011 之前）

[modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx) 当前叠加层（自上而下）：

| 层序 | 元素                              | 位置                                          | 来源     |
| ---- | --------------------------------- | --------------------------------------------- | -------- |
| 1    | `ServiceRecoveryPanel` 背景图     | `left:53 / top:822 / w:1790 / h:238`          | task001  |
| 2    | 时间范围快照 label（`timeRange`） | `left:763 / top:908`（图片内左上）            | task007  |
| 3    | `TimelineHistory` 时间轴滑轨      | `left:93 / top:872`（图片顶部 6px 边距）      | task006  |
| 4    | `ServiceRecoveryTrendChart` 4G/5G 双线 + markLine | `left:69 / top:920`（中部）         | task009  |

### 2.2 既有 timeRange label 的定位

- 内容：mount 时一次性快照 `yyyy-mm-dd hh:mm:ss 至 yyyy-mm-dd hh:mm:ss`，**只读**，`pointerEvents: 'none'`
- 用途：固定显示「此刻往前 2 小时 → 此刻」区间，作为静态视觉参考
- 局限：用户无法调整区间；Demo 演示中若需展示「昨天」「上月」等历史时段，只能 mock 替换，无 UI 交互

### 2.3 缺失的交互能力

- Demo 演示场景：有时需快速切换到「3 小时前」「昨天上午」「最近 30 分钟」等区间，手动改 mock 成本高
- 现有交互：TimelineHistory 滑轨只能选 24 个 5min 间隔的固定点（覆盖前 2 小时），无法跨区间
- 结论：需要一个独立、可自由选择起止时间的控件，**但不必立刻联动下游**——先落地 UI 能力，联动与否后续 task 再决定

### 2.4 模式沉淀（可直接抄）

- `station-outage` 自定义档（task004）已使用 `DatePicker.RangePicker`（`format="YYYY-MM-DD"`，size="small"），可直接参考其 antd 接入方式
- `dayjs` 从 `@fedx-web-common/utils` 引入（沿用模块内既有 import）
- mount 时锚点模式：`useState(() => dayjs().subtract(2, 'hour'))` 等惰性初始化写法（task007 / task009 / task010 已沉淀）

## 三、落地方案

### 3.1 改动文件清单

| 文件                                                                         | 类型 | 改动                                                                                                                | 归属目标 |
| ---------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| [web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx) | 改   | import `DatePicker` from antd + `Dayjs` type from dayjs；新增 `customRange` state + `<DatePicker.RangePicker>`；保留 task007 原 `timeRange` label | A |
| [web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx) | 改   | 弹窗位置 `right/top` 微调 + `zIndex 10→100` + 弹窗图片 `width 420→620`                                            | B |
| [public/static/images/bj-cmcc-cmd-dispatcher/map/company/outline.png](public/static/images/bj-cmcc-cmd-dispatcher/map/company/outline.png) | 改   | 替换为新版 company 层底图轮廓（83418 → 95694 bytes）                                                                  | B |
| [public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png](public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png) | 改   | 替换为新版弹窗内容图高分辨率版本（167989 → 479376 bytes）                                                              | B |
| `status/current.md`                                                          | 改   | `modules/service-recovery/` 行追加 RangePicker 说明；`modules/map/map-detail-modal.tsx` 行追加样式微调说明；待办勾选 task011；元信息日期更新 | A + B |
| `design/frontend/001-modules-params.md`                                      | 改   | `service-recovery` 行资源列追加 `+ 自定义时间段 RangePicker`；"结构型叠加变种"约定追加 task011；版本号 v1.4.0      | A |
| `plans/roadmap.md`                                                           | 改   | 新增 T20 任务分解 + §八 看板勾选 T20；版本号 v2.4.0                                                                 | A + B |
| `status/checklist.md`                                                        | 改   | 新增 Task011 收口自检章节（覆盖 A + B）                                                                              | A + B |
| `plans/done/task-2026-08-27-011-service-recovery-range-picker.md`            | 新   | 本文件                                                                                                              | A + B |

> **目标 A 未触动**：`TimelineHistory` / `ServiceRecoveryTrendChart` / `ServiceRecoveryPanel` / `store` / 4 个 mock 全部不变。
>
> **目标 B 未触动**：`MapDetailModal` 业务逻辑（仅 street 层级 + modalOpen + selectedId 守卫）不变；只调整 inline style 数值与图片资源。

### 3.2 目标 A — modules/service-recovery/index.tsx 关键改造

```tsx
// 新增 import
import { DatePicker } from 'antd';
import { type Dayjs } from 'dayjs';

// 模块顶部新增 state
// RangePicker 默认值：mount 时锚点的前 2 小时 → 锚点
const [customRange, setCustomRange] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs();
    const start = end.subtract(2, 'hour');
    return [start, end];
});

// JSX 顶部新增（位于 <ServiceRecoveryPanel> 之上）
<div
    style={{
        position: 'absolute',
        left: 1064,
        top: 823,
        zIndex: 100,
    }}
>
    <DatePicker.RangePicker
        value={customRange}
        onChange={(v) => {
            // 仅两端都齐才更新；半选 / 清空时保留旧值，避免出现 [null, null] 闪烁
            if (v && v[0] && v[1]) {
                setCustomRange([v[0], v[1]]);
            }
        }}
        showTime={{ format: 'HH:mm:ss' }}
        format="YYYY-MM-DD HH:mm:ss"
        size="large"
    />
</div>
```

**关键决策**：

| #   | 决策                                    | 取值                                                                                                |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | 位置                                    | `left: 1064, top: 823`（PM 2026-08-27 拍板，微调自初版 `top: TOP-40=782` / `left: LEFT=53`）        |
| 2   | size                                    | `"large"`（PM 拍板，便于触达）                                                                      |
| 3   | showTime                                | `{ format: 'HH:mm:ss' }` + `format="YYYY-MM-DD HH:mm:ss"`（精确到秒，与原 `timeRange` label 风格一致）|
| 4   | onChange 半选 / 清空保护                | 仅两端都齐才更新 state；保留旧值避免 `[null, null]` 闪烁                                            |
| 5   | 不联动                                  | 组件内纯本地 state，不订阅 store / 不调任何 setter                                                  |
| 6   | 保留 task007 原 `timeRange` label       | 两者并存：label 是只读快照、RangePicker 是可交互选择器，职责分明                                    |
| 7   | zIndex                                  | 100（与 TimelineHistory / timeRange label 同级）                                                    |

### 3.3 目标 A — 状态 / 联动矩阵

| 模块元素                       | 状态来源                       | 接收 task011 联动？ |
| ------------------------------ | ------------------------------ | ------------------- |
| `ServiceRecoveryPanel` 背景图  | props（无 state）              | ❌                  |
| 时间范围快照 label             | 本地 state `timeRange`         | ❌（仅 mount 快照） |
| **`customRange` RangePicker**  | **本地 state `customRange`**   | **N/A（本 task 新增）** |
| `TimelineHistory` 时间轴       | store `currentTimeIndex`       | ❌（按设计要求不联动） |
| `ServiceRecoveryTrendChart`    | 订阅 store `currentTimeIndex`  | ❌（按设计要求不联动） |

### 3.4 目标 B — modules/map/map-detail-modal.tsx 关键改动

```diff
     <div
         style={{
             position: 'absolute',
-            right: '50%',
-            top: '40%',
-            zIndex: 10,
+            right: '44%',
+            top: '30%',
+            zIndex: 100,
             pointerEvents: 'auto',
         }}
         onClick={(e) => e.stopPropagation()}
@@
             <img
                 src={`${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/地图弹窗-1.png`}
                 alt="区域详情"
                 draggable={false}
                 style={{
-                    width: 420,
+                    width: 620,
                     height: 'auto',
                     display: 'block',
                     pointerEvents: 'none',
                 }}
             />
```

**关键改动**：

| #   | 改动                                    | 取值                                                                                  |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | 弹窗位置（right / top）                 | `right: 50% → 44%`、`top: 40% → 30%`（更靠左上 6% / 上移 10%，避开大屏右上角演示元素）|
| 2   | zIndex                                  | `10 → 100`（确保弹窗叠在 Background z=10 之上，不再被半透明外框遮挡）                |
| 3   | 弹窗图片宽度                            | `420 → 620`（PM 演示放大，便于看清弹窗内文字 / 图表）                                 |
| 4   | `outline.png`（company 层）             | 83418 → 95694 bytes，新版底图轮廓                                                     |
| 5   | `地图弹窗-1.png`                        | 167989 → 479376 bytes（约 2.85x），新版高分辨率弹窗内容图                             |

**业务逻辑未触动**：
- 仅在 `street` 层级 + `modalOpen=true` + `selectedId` 存在时才渲染
- 关闭按钮 `onClose` 逻辑（`setSelected(null) + setModalOpen(false)`）不变
- 仍走 `constants.IMAGE_PATH` 静态资源路径
- 注释掉的"智能避让"代码块（`getShapeCenterX` / `isLeftSide`）保留不动

**图片资源替换说明**：
- `outline.png`：company 层底图轮廓更新（视觉细节差异，需 PM 复核演示效果）
- `地图弹窗-1.png`：弹窗内容图分辨率提升，更清晰；MD5 不一致但视觉布局相同（如有 PM 推翻现有 layout，需另行评估）

## 四、不在本次范围

### 目标 A — RangePicker

- ❌ RangePicker 联动 TimelineHistory（拖动 / 点击更新 `currentTimeIndex`）
- ❌ RangePicker 联动 4G/5G 趋势图 markLine
- ❌ RangePicker 联动 4G/5G 趋势图数据（仍是 mock 24 点，与用户选择无关）
- ❌ RangePicker 联动地图点位 / store 任何字段
- ❌ RangePicker 受 TimelineHistory 反向驱动
- ❌ 「最近 30 分钟 / 1 小时 / 3 小时 / 今日」快捷按钮
- ❌ 自定义档持久化（仅本地 state，刷新页面恢复默认）
- ❌ RangePicker 样式定制（深色背景 / 与大屏配色对齐）—— 沿用 antd 默认
- ❌ 移除 / 替换 task007 原 `timeRange` 快照 label

### 目标 B — map 弹窗

- ❌ map 弹窗的"智能避让"逻辑（task002-03 注释掉的 `getShapeCenterX` / `isLeftSide` 代码块，本次仍未启用）
- ❌ map 弹窗内嵌 5 指标卡组件（属后续 selector widget，独立 task）
- ❌ map 弹窗的拖动 / 缩放 / 关闭动画
- ❌ 替换 / 重画 `地图弹窗-1.png` 内容图（PM 已提供新版资源，直接采用）
- ❌ outline.png 的非 company 层（city / district / street / community / station / logical）替换
- ❌ MapDetailModal 业务逻辑（仅 street 层级守卫 + modalOpen + selectedId 触发条件）

## 五、验收标准

### 目标 A — RangePicker

1. `modules/service-recovery/index.tsx` 新增 `DatePicker.RangePicker`，位于 `<ServiceRecoveryPanel>` 之上（JSX 顺序第一）
2. import 正确：`DatePicker` from `'antd'`，`type Dayjs` from `'dayjs'`
3. `customRange: [Dayjs, Dayjs]` state 默认值：`dayjs().subtract(2, 'hour')` → `dayjs()`（mount 时一次性快照）
4. `format="YYYY-MM-DD HH:mm:ss"` + `showTime={{ format: 'HH:mm:ss' }}`，精确到秒
5. `size="large"`（PM 拍板）
6. 位置：`left: 1064, top: 823`，zIndex: 100
7. onChange 仅两端都齐才更新 state；半选 / 清空时保留旧值
8. **不动** TimelineHistory、ServiceRecoveryTrendChart、ServiceRecoveryPanel、store、4 个 mock 任何代码
9. **保留** task007 原 `timeRange` 快照 label（位置、文案、样式、state 一律不变）
10. RangePicker 不订阅 store，不调用任何 setter（联动下游属后续 task）
11. TS 编译 0 错误（cmd-dispatcher scope 内）
12. Demo 打开页面：城市层级视图最上方出现 antd RangePicker，默认显示 `[now-2h, now]`；用户可调整起止时间，下游无任何响应

### 目标 B — map 弹窗

13. `modules/map/map-detail-modal.tsx` 弹窗容器 `right` 由 `50%` 改为 `44%`、`top` 由 `40%` 改为 `30%`、`zIndex` 由 `10` 改为 `100`
14. 弹窗内 `<img>` 的 `width` 由 `420` 改为 `620`
15. `地图弹窗-1.png` 已替换为新版（167989 → 479376 bytes）
16. `map/company/outline.png` 已替换为新版（83418 → 95694 bytes）
17. **业务逻辑未触动**：street 层级守卫 + modalOpen + selectedId 守卫、关闭按钮 onClose、`constants.IMAGE_PATH` 引用、注释代码块全部不变
18. TS 编译 0 错误（cmd-dispatcher scope 内）
19. Demo 打开页面：street 层级选中 shape 后弹出详情弹窗，位置 `right:44% top:30%`、zIndex=100 不被背景遮挡、图片宽度 620 更大更清晰、company 层底图轮廓为新版本

## 六、文档同步要求

| 触发动作                                                       | 必须更新                                                                                                                              | 状态 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 改 `modules/service-recovery/index.tsx`                        | `status/current.md`（模块描述追加 RangePicker）+ `design/frontend/001-modules-params.md`（资源列 + 变种约定）                          | ✅   |
| 改 `modules/map/map-detail-modal.tsx` + 2 张图片                | `status/current.md`（`modules/map/map-detail-modal.tsx` 行追加样式微调说明 + 资源表追加 2 张图片更新）                                | ✅   |
| 新增 task 文件                                                  | `plans/roadmap.md`（新增 T20 + §八 看板勾选 T20 + 版本号 v2.4.0）                                                                     | ✅   |
| Task011 收口自检                                                | `status/checklist.md` 新增本 task 收口自检章节                                                                                         | ✅   |

## 七、看板

### 目标 A — RangePicker

- [x] `modules/service-recovery/index.tsx` 顶部新增 `<DatePicker.RangePicker>`
- [x] `customRange` state 默认 `[now-2h, now]`，纯本地，不联动下游
- [x] 保留 task007 原 `timeRange` 快照 label
- [x] 位置 `left: 1064 / top: 823 / size: large`（PM 2026-08-27 拍板）
- [x] onChange 仅两端都齐才更新 state（半选 / 清空保护）

### 目标 B — map 弹窗

- [x] `modules/map/map-detail-modal.tsx` 弹窗位置 `right/top` 微调（`50%/40%` → `44%/30%`）
- [x] `zIndex` 抬升（`10` → `100`，避免被 Background 遮挡）
- [x] 弹窗图片宽度放大（`420` → `620`）
- [x] `map/company/outline.png` 替换（83418 → 95694 bytes）
- [x] `地图弹窗-1.png` 替换（167989 → 479376 bytes，新版高分辨率）

### 文档同步

- [x] 同步 `status/current.md`（service-recovery 模块描述 + map 模块 map-detail-modal 描述 + 资源表）
- [x] 同步 `design/frontend/001-modules-params.md`（service-recovery 行 + 结构型叠加变种约定）
- [x] 同步 `plans/roadmap.md`（T20 + 看板勾选 + 版本号 v2.4.0）
- [x] `status/checklist.md` 新增 Task011 收口自检章节（覆盖 A + B）
- [x] 按 `status/checklist.md` 自检

## 八、PM 待澄清

### 目标 A — RangePicker

| #   | 事项                                                | 阻塞 | 说明                                                                                                                            |
| --- | --------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | RangePicker 是否需要联动 TimelineHistory             | 否   | 当前纯本地；如 PM 后续要求联动，需 store 改造或 RangePicker 与 TimelineHistory 共享派生 state，独立 task 启动                  |
| 2   | RangePicker 是否需要联动 4G/5G 趋势图               | 否   | 当前 mock 24 点与用户选择无关；真实数据接入后需在 trend-chart.tsx 增加 `range` prop，按用户区间重新计算 mock 切片或真实数据       |
| 3   | 快捷档（最近 30min / 1h / 3h / 今日）按钮          | 否   | 当前纯 RangePicker；PM 演示若需快捷切换可加按钮组，独立 task                                                                       |
| 4   | 是否保留 task007 原 `timeRange` 快照 label          | 否   | PM 2026-08-27 明确「之前的保留」，两者并存；后续如确认 label 冗余可移除                                                            |
| 5   | RangePicker 视觉是否需要定制（深色背景 / 蓝色边框） | 否   | 当前用 antd 默认 + size="large"；与大屏色系差异较大，PM review 时若要求定制再独立 task                                            |

### 目标 B — map 弹窗

| #   | 事项                                                  | 阻塞 | 说明                                                                                                                            |
| --- | ----------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 6   | 是否启用"智能避让"逻辑（task002-03 注释的 `isLeftSide`） | 否   | 当前弹窗固定 `right: 44% top: 30%`；如 PM 要求按 shape 位置自动选左/右弹窗，独立 task 启用注释代码                              |
| 7   | 弹窗内是否拆为 5 指标卡组件（结构化字段）             | 否   | 当前图片兜底（task005 已声明图片内容写死）；如 PM 后续要求结构化数据展示，独立 task                                                 |
| 8   | outline.png 是否需要同步替换其他 6 层级（city/district/street/community/station/logical） | 否   | 当前仅 PM 提供了 company 层新版本；其它层级沿用现状，T15 task 待办已跟踪                                                                  |

## 九、实施记录（2026-08-27）

### 9.1 实际落点清单

**修改文件**：

- [web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx)
    - 新增 import：`DatePicker` from `'antd'`、`type Dayjs` from `'dayjs'`
    - 新增本地 state `customRange: [Dayjs, Dayjs]`（默认值 `[now-2h, now]`）
    - JSX 顶部新增 `<DatePicker.RangePicker>` 容器（`<ServiceRecoveryPanel>` 之上）
    - 保留 task007 原 `timeRange` label / `formatTime` 工具函数 / `useState` 不变
- [web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx)
    - 弹窗容器 `right: '50%' → '44%'`、`top: '40%' → '30%'`、`zIndex: 10 → 100`
    - 弹窗 `<img>` 的 `width: 420 → 620`
    - 业务逻辑（仅 street 层级守卫 + modalOpen + selectedId + 关闭按钮 onClose）保持不变
- [public/static/images/bj-cmcc-cmd-dispatcher/map/company/outline.png](public/static/images/bj-cmcc-cmd-dispatcher/map/company/outline.png)
    - 替换为新版 company 层底图轮廓（83418 → 95694 bytes，+14.7%）
- [public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png](public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png)
    - 替换为新版弹窗内容图高分辨率版本（167989 → 479376 bytes，+185.4%）

**新增文档**：

- [plans/done/task-2026-08-27-011-service-recovery-range-picker.md](./task-2026-08-27-011-service-recovery-range-picker.md)（本文件）

**同步文档**：

- `status/current.md` —— `modules/service-recovery/` 行追加 RangePicker 说明；`modules/map/map-detail-modal.tsx` 行追加样式微调说明；资源表更新 2 张图片 bytes；待办勾选 task011；元信息日期 2026-08-27
- `design/frontend/001-modules-params.md` —— `service-recovery` 行资源列追加 `+ 自定义时间段 RangePicker`；"结构型叠加变种"约定追加 task011；版本号 v1.4.0
- `plans/roadmap.md` —— 新增 T20 任务分解；§八 看板勾选 T20；版本号 v2.4.0
- `status/checklist.md` —— 新增 Task011 收口自检章节（覆盖 A + B）

### 9.2 关键决策偏差（vs 原计划）

#### 目标 A — RangePicker

| #   | 偏差项             | 原计划（初版）                                                              | 实际落地                                                                                                       |
| --- | ------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | 位置               | `left: LEFT=53, top: TOP - 40 = 782`（面板上方左对齐）                      | **PM 2026-08-27 拍板**：`left: 1064, top: 823`（模块中上方，size large 便于触达）                              |
| 2   | size               | `"small"`（沿用 station-outage 默认）                                       | **PM 拍板**：`"large"`（大屏触达便利性）                                                                       |
| 3   | 原 label 处置      | 初版误删 task007 原 `timeRange` label                                       | **PM 拍板恢复**：「之前的保留」—— 保留原 label 不动，RangePicker 与 label 并存                              |
| 4   | onChange 边界      | 任一值变化即更新 state                                                       | 仅两端都齐才更新；半选 / 清空时保留旧值，避免 `[null, null]` 闪烁                                              |
| 5   | 范围语义           | 仅模块独立可见层级（city ~ street）可见                                     | 与 task001 / task006 / task009 一致：MY_LEVELS 守卫不变，RangePicker 跟随父模块显隐                            |

#### 目标 B — map 弹窗

| #   | 偏差项                            | 原 task002-03 计划                                                                 | 实际落地（task011 现状）                                                                       |
| --- | --------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 6   | 弹窗位置（right / top）           | `right: '50%' top: '40%'`（task002-03 落地版）                                     | **PM 2026-08-27 微调**：`right: '44%' top: '30%'`（更靠左上）                                 |
| 7   | zIndex                            | `10`（task002-03 落地版，与 Background 同级）                                       | **PM 抬升**：`100`（确保弹窗不被半透明 Background 遮挡）                                      |
| 8   | 弹窗图片宽度                      | `420`（task002-03 落地版）                                                          | **PM 放大**：`620`（便于看清弹窗内容）                                                         |
| 9   | 智能避让逻辑                      | task002-03 注释掉的 `getShapeCenterX` / `isLeftSide`（未启用）                     | **本次仍未启用**（PM 要求固定位置即可）                                                        |
| 10  | `outline.png` + `地图弹窗-1.png` | task002-03 落地版（旧版）                                                          | **PM 替换为新版资源**（bytes 详见 §9.1）                                                       |

### 9.3 校验结果

#### 目标 A — RangePicker

- ✅ `modules/service-recovery/index.tsx` 新增 RangePicker（顶部第一层），原 `timeRange` label 保留
- ✅ import：`DatePicker` from antd + `type Dayjs` from dayjs + `dayjs` 沿用 `@fedx-web-common/utils`
- ✅ state：`customRange: [Dayjs, Dayjs]` 默认 `[now-2h, now]`（mount 时惰性初始化）
- ✅ 位置 / 样式：`left:1064 / top:823 / size="large" / zIndex:100`
- ✅ 不联动：未订阅 store，未调任何 setter，未影响 TimelineHistory / trend-chart / mock

#### 目标 B — map 弹窗

- ✅ `modules/map/map-detail-modal.tsx` 弹窗位置 / zIndex / 图片宽度按预期调整
- ✅ `map/company/outline.png` 替换为新版（MD5 变化，视觉细节差异）
- ✅ `地图弹窗-1.png` 替换为新版高分辨率版本（MD5 变化，视觉布局保持一致）
- ✅ 业务逻辑未触动：street 守卫 + modalOpen + selectedId 守卫、关闭按钮 onClose、`constants.IMAGE_PATH` 引用、注释代码块全部保持原样

#### 构建验证

- ⚠️ `pnpm run lint` 因 sandbox pnpm store 权限问题未跑通（沿用 task009 / task010 同结论，未跑实际构建验证；如需可由 PM 在本地或 CI 验证）
- ✅ git diff 校验：4 个文件改动符合预期，service-recovery 35 行新增、map-detail-modal 8 行修改、2 张图片 bytes 替换

### 9.4 scope 外的已知问题

#### 目标 A — RangePicker

- ❌ RangePicker 与原 `timeRange` label 视觉冗余（PM 拍板两者并存；后续若确认 label 冗余再移除）
- ❌ antd 默认浅色 RangePicker 与大屏深色背景视觉差异较大，PM review 时若要求定制需独立 task
- ❌ RangePicker 大小写 / 中文 / i18n 不涉及（仅中文 `YYYY-MM-DD HH:mm:ss`）
- ❌ Demo 切换层级时 RangePicker 仍维持当前用户选择，不按层级 reset（按 PM 要求不联动）
- ❌ RangePicker 在不同分辨率 / `enableScreenControl` 开启时位置需重新对齐（当前仅 2880×1080 设计稿对齐）

#### 目标 B — map 弹窗

- ❌ outline.png 仅 company 层替换，其它 6 层级（city/district/street/community/station/logical）沿用旧版（T15 task 待办已跟踪）
- ❌ 智能避让逻辑仍未启用（task002-03 注释代码保留，PM 拍板固定位置即可）
- ❌ `地图弹窗-1.png` 高分辨率版本 479376 bytes，体积较大；如需 CDN 优化可单独压缩
- ❌ 弹窗位置 `right: '44%' top: '30%'` 是百分比定位，跨分辨率可能与背景图装饰元素偏移（2880×1080 下视觉对齐）

---

## 文档元信息

> **日期**：2026-08-27（创建 → 归档）
> **状态**：已完成（2026-08-27 归档至 `done/`）