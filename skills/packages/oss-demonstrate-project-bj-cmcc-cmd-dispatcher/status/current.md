# 当前落地状态 (Current State)

记录北京移动指挥调度模块已实现的路由、页面、目录与关键配置。

---

## 路由

| 路径                      | 说明             |
| ------------------------- | ---------------- |
| `/bj-cmcc-cmd-dispatcher` | 北京移动指挥调度 |

## 后端入口

-   `src/controller/index.ts` —— 追加 `@Get('/bj-cmcc-cmd-dispatcher') // 北京移动指挥调度`

## 前端页面目录

`web/pages/bj-cmcc-cmd-dispatcher/`

| 文件 / 目录                                       | 作用                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render.tsx`                                      | 页面组件；外层 `LargeScreenEnv`（2880×1080），内含 `cmd-dispatcher-stage` 容器（relative）、全量 import 12 个模块（含 task007 时钟）、调试信息块（top:70 避让时钟）、外框 `<Background>`（z-index:10, pointerEvents:none）                                                                                                                                                                                                                                            |
| `fetch.ts`                                        | SSR 数据预取（占位返回 `{}`）                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `web/pages/bj-cmcc-cmd-dispatcher/store/index.ts` | 页面级 zustand store：`currentLevel`（初始 `'city'`）/ `setLevel` / `selectedModuleId` / `modalOpen` + 地图标注字段（`shapes` / `selectedShapeId` / `activeTool` + 6 actions） + 时间轴字段（`currentTimeIndex` 初始 `0` + `setCurrentTimeIndex`）+ 派生 `useCurrentLevel()` selector                                                                                                                                                                                 |
| `components/service-recovery-panel/index.tsx`     | 共享 UI：接受 `variant: 'city'\|'cell'` + 可选 `src` prop；提供 src → `<img>`，否则占位 `<div>`                                                                                                                                                                                                                                                                                                                                                                       |
| `components/timeline-history/index.tsx`           | 街道级历史回溯滑轨（task006）：纯交互控件，默认以「当前时间为终点、向前每 5min 一个、共 24 个点」生成时间列表，mount 时自动 snap 到 idx=max（"现在"），点击 / 拖动 → store `setCurrentTimeIndex`；渲染 track + tick + thumb + 时间 label（每 3 个 tick 抽稀 1 个 label）；由 `modules/service-recovery` 叠在 `退服恢复情况.png` 顶部                                                                                                                                  |
| `modules/map/index.tsx`                           | 地图模块组装入口（MapStage + MapLegend + MapToolbar），wrapper `zIndex: 0`；订阅 `currentLevel` 传给 `MapLegend`                                                                                                                                                                                                                                                                                                                                                      |
| `modules/map/map-stage.tsx`                       | 底图 + 轮廓 + SVG overlay + 打点渲染 + 层级切换 crossfade 过渡动画；`useRequest` 请求 `map-markers.json`；按 `currentLevel` 过滤点位；接入 `useDraw` hook，SVG `pointerEvents: 'auto'`，渲染 previewShape + 选中/交互态传递；task006 §11.11.3 接入历史回溯：`EFFECTIVE_LEVELS = ['city','company','district']` 时 `useRequest` 拉 `history-timeline.json`，`markers` useMemo 按 `currentTimeIndex` 取 `historyData[level][idx].markers`，其余层走原 `markerData` 过滤 |
| `modules/map/map-legend.tsx`                      | 图例独立组件，`memo` 包裹；`LEVEL_LEGEND` getter 延迟取值；zIndex: 16（避免 crossfade 期间被新层 z=11/12 遮挡）                                                                                                                                                                                                                                                                                                                                                       |
| `modules/map/map-toolbar.tsx`                     | 6 按钮（select/rect/circle/polygon/undo/clear）+ activeTool 高亮 + select 模式下选中 shape 时显示"🗑 删除"按钮                                                                                                                                                                                                                                                                                                                                                        |
| `modules/map/presets.ts`                          | 地图常量映射：`MAP_LEVEL_ASSETS` / `NEXT_LEVEL` / `PREV_LEVEL` / `OUTLINE_POSITION` / `LEVEL_LEGEND`（getter）/ `getMarkerIcon`                                                                                                                                                                                                                                                                                                                                       |
| `modules/map/shape-renderer.tsx`                  | 按 Shape.type 路由 rect/circle/polygon；支持 `selected`/`preview`/`interactive`/`onSelect` prop，select 模式下 `pointerEvents: 'auto'` 可命中，选中态橙色高亮，预览态黄色虚线                                                                                                                                                                                                                                                                                         |
| `modules/map/types.ts`                            | Shape / Tool / DrawState / DEFAULT_SHAPE_STYLE / MapMarker                                                                                                                                                                                                                                                                                                                                                                                                            |
| `modules/map/use-draw.ts`                         | 鼠标绘制交互 hook：按 `activeTool` 分发 mousedown/move/up/click/dblclick；rect/circle 拖拽创建 + polygon click 落点 + dblclick 收尾；自管 DrawState 临时态，返回 `previewShape` + `svgProps` + `selectedId` + `selectShape` + `deleteSelected`                                                                                                                                                                                                                        |
| `modules/service-recovery/`                       | MY_LEVELS: city/company/district/street；退服恢复情况，复用 `service-recovery-panel`，variant='city'，引用 `退服恢复情况.png`；task007 新增时间范围 label（mount 时快照：此刻往前 2 小时 → 此刻，格式 `yyyy-mm-dd hh:mm:ss 至 yyyy-mm-dd hh:mm:ss`，浮在图片左上角 left:93/top:832，zIndex:100）                                                                                                                                                                      |
| `modules/service-recovery/trend-chart.tsx`        | task009 子组件：4G/5G 双线趋势折线图本体（无 level 守卫）；按 currentLevel 拉对应 mock（24 点 × 4G + 5G，y 轴 min=0 max 自适应）；task010 改造：x 轴 24 个 HH:mm label 由组件 mount 时锚点动态生成（mock 仅存 `{fourG, fiveG}`），markLine 改用索引定位（`safeIndex = clamp(currentTimeIndex, 0, 23)`）；订阅 store.currentTimeIndex 驱动 markLine 白色虚线指示线，跟 TimelineHistory 拖动联动；4G 冷蓝 `#5DD5F5` / 5G 暖青蓝 `#A6BEEC`；画布 left:69/top:884/width:1758/height:164                                                                                                                                                                                                                          |
| `modules/service-recovery-cell/`                  | MY_LEVELS: community/station/logical；退服小区恢复情况，复用 `service-recovery-panel`，variant='cell'，引用 `退服小区恢复情况.png`                                                                                                                                                                                                                                                                                                                                    |
| `modules/network-impact/`                         | MY_LEVELS: city~community；网络影响，按层级切换图片（city→网络影响.png / company→网络影响-2.png / district→网络影响-3.png / street→网络影响-4.png / community→网络影响-5.png）；右上角含故障分析报告入口（透明 div + antd Modal/Cascader）                                                                                                                                                                                                                            |
| `modules/network-impact/failure-report-modal.tsx` | 故障分析报告弹窗组件：网络影响模块右上角透明触发 div（100×30，仅 cursor:pointer，相对 wrapper 用 `right:20,top:17`）+ antd Modal（背景图容器 + 右上角 Cascader 默认 `['城区三分公司']` + 路径命中内容图，paddingTop:75 给 Cascader 留白）；mock 级联 4 个分公司 → 区 → 街道（三级，区 value 为区划代码，街道为占位 mock）；状态组件内 useState，不进 store；随父模块 MY_LEVELS 5 级一起显隐                                                                           |
| `modules/station-outage/`                         | MY_LEVELS: city~community；基站退服，引用 `基站退服.png`；task010 改造：x 轴 label 由组件 mount 时锚点动态生成（mock `day`/`week`/`month` 三档每点仅含 `{value}`，`custom` 档 label 保留供区间过滤）；PM 拍板 — 日档截止当前小时（含）`dayCutoffCount(anchorMs)=floor(h/2)+1`、月档截止当前月（含）+ 中文 `X月` 格式 `monthCutoffCount(anchorMs)=getMonth()+1`                                                                                                                                                                                                                                                                              |
| `modules/indicators/`                             | MY_LEVELS: station；指标，引用 `指标.png`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `modules/logical-station-list/`                   | MY_LEVELS: station；逻辑站清单，引用 `逻辑站清单.png`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `modules/support-tasks/`                          | MY_LEVELS: station；联保障任务，引用 `联保障任务.png`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `modules/alarm-detail/`                           | MY_LEVELS: station；告警明细，引用 `告警明细.png`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `modules/station-portrait/`                       | MY_LEVELS: logical；站址画像，引用 `站址画像.png`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `modules/cell-list/`                              | MY_LEVELS: logical；小区清单，引用 `小区清单.png`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `modules/station-performance/`                    | MY_LEVELS: logical；站址性能，引用 `站址性能.png`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `modules/clock/`                                  | 全局可见（无 MY_LEVELS 守卫）；task007 实时时钟模块，复用全局 `web/components/ui/time-display` 的 `TimeDisplay`，右上角 right:24/top:24，zIndex:100（叠在 Background z=10 之上）；内部每秒刷新显示 年/月/日 星期X HH:MM:SS                                                                                                                                                                                                                                            |

## 静态资源目录

`public/static/images/bj-cmcc-cmd-dispatcher/`

| 文件 / 目录                                      | 用途                                                                  | 引用方式                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `background.png`                                 | 全屏大屏背景（外框）                                                  | `render.tsx` 通过 `<Background>`，inline `zIndex:10, pointerEvents:'none'`               |
| `map/city/base.png` + `outline.png`              | city 层底图 + 轮廓                                                    | `map-stage.tsx` 通过 `MAP_LEVEL_ASSETS` getter                                           |
| `map/company/` ... `map/logical/`                | 其它 6 层级底图 + 轮廓（暂用 city 图占位，待手动替换）                | 同上                                                                                     |
| `退服恢复情况.png`                               | 退服恢复情况（A 组）                                                  | `service-recovery` 透传 src 到 `service-recovery-panel`                                  |
| `退服小区恢复情况.png`                           | 退服小区恢复情况（B/C/D 组）                                          | `service-recovery-cell` 透传 src                                                         |
| `网络影响.png`                                   | 网络影响（city 层）                                                   | `network-impact` 按 `currentLevel` 取 `Record<Level, { get src(): string }>` getter 映射 |
| `网络影响-2.png`                                 | 网络影响（company 层）                                                | 同上                                                                                     |
| `网络影响-3.png`                                 | 网络影响（district 层）                                               | 同上                                                                                     |
| `网络影响-4.png`                                 | 网络影响（street 层）                                                 | 同上                                                                                     |
| `网络影响-5.png`                                 | 网络影响（community 层）                                              | 同上                                                                                     |
| `故障分析报告弹窗-背景.png`                      | 故障分析报告弹窗背景（容器）                                          | `network-impact/failure-report-modal.tsx` 通过 `backgroundImage` 引用                    |
| `故障分析报告弹窗-城区三分公司.png`              | 故障分析报告弹窗公司级内容图（路径 `/城区三分公司` 命中）             | 同上（路径命中 `CONTENT_IMG_BY_PATH` 后渲染）                                            |
| `故障分析报告弹窗-石景山.png`                    | 故障分析报告弹窗区级内容图（路径 `/城区三分公司/110107` 命中）        | 同上                                                                                     |
| `故障分析报告弹窗-广宁.png`                      | 故障分析报告弹窗街道级内容图（路径 `/城区三分公司/110107/广宁` 命中） | 同上                                                                                     |
| `基站退服.png`                                   | 基站退服（A+B 组）                                                    | `station-outage` 直接 `<img>`                                                            |
| `指标.png`                                       | 指标（C 组）                                                          | `indicators` 直接 `<img>`                                                                |
| `逻辑站清单.png`                                 | 逻辑站清单（C 组）                                                    | `logical-station-list` 直接 `<img>`                                                      |
| `联保障任务.png`                                 | 联保障任务（C 组）                                                    | `support-tasks` 直接 `<img>`                                                             |
| `告警明细.png`                                   | 告警明细（C 组）                                                      | `alarm-detail` 直接 `<img>`                                                              |
| `站址画像.png`                                   | 站址画像（D 组）                                                      | `station-portrait` 直接 `<img>`                                                          |
| `小区清单.png`                                   | 小区清单（D 组）                                                      | `cell-list` 直接 `<img>`                                                                 |
| `站址性能.png`                                   | 站址性能（D 组）                                                      | `station-performance` 直接 `<img>`                                                       |
| `legend-1.png` / `legend-2.png` / `legend-3.png` | 图例图片（city~community / station / logical）                        | `map-legend.tsx` 通过 `LEVEL_LEGEND` getter 映射                                         |
| `icon-radar.svg`                                 | 雷达扩散动画 SVG（logical 层点位）                                    | `map-stage.tsx` 通过 `icon: "radar"` 标记渲染                                            |
| `map/{level}/0.png` + `1.png`                    | 打点 icon：status 0=绿色 / 1=红色                                     | `map-stage.tsx` 通过 `getMarkerIcon()` 取值                                              |
| `map/station/sub-td.png` + `sub-nr.png`          | station 层 subType 打点 icon                                          | `map-stage.tsx` 通过 `getMarkerIcon()` 取值                                              |

## Mock 数据

`public/static/mock/bj-cmcc-cmd-dispatcher/`

| 文件                                   | 用途                                                                                                                                                                                                                                                                                                                                                | 引用方式                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `map-markers.json`                     | 地图打点数据（task008 已归档；7 个层级共 144 个点位：city 70 / company 34 / district 16 / street 12 / community 8 / station 3 / logical 1；详见 [done/task-2026-08-25-008-map-markers-mock.md](../plans/done/task-2026-08-25-008-map-markers-mock.md)）                                                                                             | `map-stage.tsx` 通过 `useRequest` + `constants.STATIC_PATH` fetch                           |
| `history-timeline.json`                | 历史回溯 mock（task006）：city/company/district 三层 × 24 时间点；status 恒为 1，时间点间通过 marker 数量增减体现"退服→恢复"（idx 0 ~30% → idx 23 100%）；字段 `{left, top, status, type}` 沿用 map-markers.json，与 6 类资源 subType/category 字段同构（详见 [frontend/005-timeline-history.md §6.2](../design/frontend/005-timeline-history.md)） | `map-stage.tsx` 按 `currentLevel` + `currentTimeIndex` 取 `historyData[level][idx].markers` |
| `service-recovery-trend-city.json`     | task009 退服恢复趋势 mock（city 层）；task010 改造：每点仅含 `{fourG, fiveG}`（无 label），24 点 × 4G + 5G；4G 8→3（恢复趋势）/ 5G 3→18（新增部署趋势）；x 轴 24 个 HH:mm label 由组件 mount 时锚点动态生成                                                                                                                                                                                                       | `modules/service-recovery/trend-chart.tsx` 通过 `useRequest` 按 `currentLevel` fetch        |
| `service-recovery-trend-company.json`  | task009 退服恢复趋势 mock（company 层）；task010 改造：每点仅含 `{fourG, fiveG}`，24 点 × 4G + 5G；4G 5→2 / 5G 2→10；量级严格小于 city 层对应时点                                                                                                                                                                                                                     | 同上                                                                                        |
| `service-recovery-trend-district.json` | task009 退服恢复趋势 mock（district 层）；task010 改造：每点仅含 `{fourG, fiveG}`，24 点 × 4G + 5G；4G 3→1 / 5G 1→6；量级严格小于 company 层对应时点                                                                                                                                                                                                                  | 同上                                                                                        |
| `service-recovery-trend-street.json`   | task009 退服恢复趋势 mock（street 层）；task010 改造：每点仅含 `{fourG, fiveG}`，24 点 × 4G + 5G；4G 2→0 / 5G 0→3；量级最小                                                                                                                                                                                                                                           | 同上                                                                                        |
| `station-outage-trend-city.json`       | task004 基站退服趋势 mock（city 层）；task010 改造：`day`（12 点 `{value}`，HH:mm 日周期，2 小时间隔）/ `week`（7 点 `{value}`，MM-DD）/ `month`（12 点 `{value}`，原 MM-DD 已弃用）由组件 mount 时锚点动态生成 label；`custom`（4 份周切片，label 保留供 `flatMap + filter` 区间过滤）                                                                                                                                                                                                                                                                | `modules/station-outage/index.tsx` 通过 `useRequest` 按 `currentLevel` fetch                |
| `station-outage-trend-company.json`    | task004 基站退服趋势 mock（company 层）；task010 改造：同上结构                                                                                                                                                                                                                                                                                                                                                                                                            | 同上                                                                                        |
| `station-outage-trend-district.json`   | task004 基站退服趋势 mock（district 层）；task010 改造：同上结构                                                                                                                                                                                                                                                                                                                                                                                                            | 同上                                                                                        |
| `station-outage-trend-street.json`     | task004 基站退服趋势 mock（street 层）；task010 改造：同上结构                                                                                                                                                                                                                                                                                                                                                                                                            | 同上                                                                                        |
| `station-outage-trend-community.json`  | task004 基站退服趋势 mock（community 层）；task010 改造：同上结构                                                                                                                                                                                                                                                                                                                                                                                                          | 同上                                                                                        |

## Mock 生成脚本

`.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/`

| 脚本                            | 用途                                                                                                                                                                                                                                  | 输出文件                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `gen-history-timeline-mock.cjs` | 生成历史回溯 mock（task006 §11.11.2）：city/company/district 三层 × 24 时间点，status 恒为 1，marker 数量按 idx 渐增                                                                                                                  | `public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json` |
| `gen-map-markers-mock.cjs`      | 生成地图打点 mock（task008）：7 个层级共 144 个点位（city 70 / company 34 / district 16 / street 12 / community 8 / station 3 / logical 1），按用户提供多边形轮廓 + PM 业务语义分布；固定 LCG 种子 `_seed = 20260826`，输出稳定可复现 | `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json`      |

> 运行方式：`node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/<name>.cjs`

## 设计稿尺寸

-   宽：2880 px
-   高：1080 px
-   `enableScreenControl={false}`
-   `enableMetaHuman` 未启用

## 模块显隐（currentLevel → MY_LEVELS）

模块不经过 Group 中间层，直接声明 `MY_LEVELS: Level[]`，订阅 `useCurrentLevel()` 做 `includes` 判断。

### 11 个模块的 MY_LEVELS（实际 grep 自 `web/pages/bj-cmcc-cmd-dispatcher/modules/*/index.tsx`，截至 2026-08-26）

| 模块（import 自 render.tsx） | 文件                                                                                                        | MY_LEVELS（数组字面量，从源码 grep）                     | Group（沿用现状） |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------- |
| `ServiceRecoveryModule`      | [service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx)           | `['city', 'company', 'district', 'street']`              | A                 |
| `ServiceRecoveryCellModule`  | [service-recovery-cell/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery-cell/index.tsx) | `['community', 'station', 'logical']`                    | B/C/D             |
| `NetworkImpactModule`        | [network-impact/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx)               | `['city', 'company', 'district', 'street', 'community']` | A/B               |
| `StationOutageModule`        | [station-outage/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx)               | `['city', 'company', 'district', 'street', 'community']` | A/B               |
| `IndicatorsModule`           | [indicators/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/indicators/index.tsx)                       | `['station']`                                            | C                 |
| `LogicalStationListModule`   | [logical-station-list/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/logical-station-list/index.tsx)   | `['station']`                                            | C                 |
| `SupportTasksModule`         | [support-tasks/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/support-tasks/index.tsx)                 | `['station']`                                            | C                 |
| `AlarmDetailModule`          | [alarm-detail/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/alarm-detail/index.tsx)                   | `['station']`                                            | C                 |
| `StationPortraitModule`      | [station-portrait/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-portrait/index.tsx)           | `['logical']`                                            | D                 |
| `CellListModule`             | [cell-list/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/cell-list/index.tsx)                         | `['logical']`                                            | D                 |
| `StationPerformanceModule`   | [station-performance/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/station-performance/index.tsx)     | `['logical']`                                            | D                 |
| `ClockModule`                | [clock/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/clock/index.tsx)                                 | **无 MY_LEVELS 守卫**，全局可见                          | 全局              |

> **MapModule**（[modules/map/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/index.tsx)）在 render.tsx 中作为"全局底层"渲染，**不属于浮层面板**，无 MY_LEVELS 守卫；它通过 `OUTLINE_POSITION` / `NEXT_LEVEL` / `PREV_LEVEL` / `LEVEL_LEGEND` 控制不同层级的底图/轮廓/图例/打点显隐，但本身始终挂载。

### Level → 可见模块映射（数据流：MY_LEVELS 数组 → includes 判断）

| Level       | 中文   | 可见模块（按 render.tsx 顺序）                                                                          | 模块数 |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------- | ------ |
| `city`      | 北京   | Map（全局）+ ServiceRecovery + NetworkImpact + StationOutage + Clock                                    | 5      |
| `company`   | 分公司 | Map（全局）+ ServiceRecovery + NetworkImpact + StationOutage + Clock                                    | 5      |
| `district`  | 区     | Map（全局）+ ServiceRecovery + NetworkImpact + StationOutage + Clock                                    | 5      |
| `street`    | 街道   | Map（全局）+ ServiceRecovery + NetworkImpact + StationOutage + Clock                                    | 5      |
| `community` | 社区   | Map（全局）+ ServiceRecoveryCell + NetworkImpact + StationOutage + Clock                                | 5      |
| `station`   | 物理站 | Map（全局）+ ServiceRecoveryCell + Indicators + LogicalStationList + SupportTasks + AlarmDetail + Clock | 7      |
| `logical`   | 逻辑站 | Map（全局）+ ServiceRecoveryCell + StationPortrait + CellList + StationPerformance + Clock              | 6      |

**层级切换交互**：

-   点击 outline `<img>` → 下钻到下一层（`NEXT_LEVEL` 映射）
-   点击 base `<img>` → 返回上一层（`PREV_LEVEL` 映射）
-   city 层 base 不可点击（无上一层）；logical 层 outline 不可点击（无下一层）

## z-order

| 层                             | 内容                           | z-index                                       |
| ------------------------------ | ------------------------------ | --------------------------------------------- |
| 时钟模块                       | `<ClockModule>` 右上角实时时钟 | 100                                           |
| 顶层                           | `<Background>` 外框            | 10                                            |
| 地图 wrapper                   | `cmd-dispatcher-map-wrapper`   | 0（内部子元素在此 stacking context 内分层）   |
| 地图图例                       | `MapLegend <img>`              | 16（wrapper 内；高于 crossfade 新层 z=11/12） |
| 地图新层底图（crossfade 期间） | `base <img>`                   | 11（仅 `prevSnapshot` 存在时）                |
| 地图新层轮廓（crossfade 期间） | `outline <img>`                | 12（仅 `prevSnapshot` 存在时）                |
| 地图打点                       | `marker <img>`                 | 5（wrapper 内）                               |
| 地图工具栏                     | `MapToolbar`                   | 5（wrapper 内）                               |
| 地图 SVG overlay               | shape 渲染层                   | 3（wrapper 内）                               |
| 地图 outline `<img>`           | 轮廓层（可点击下钻）           | 2（wrapper 内；非 crossfade 期间）            |
| 地图 base `<img>`              | 底图层（可点击返回）           | 1（wrapper 内；非 crossfade 期间）            |
| 浮层面板                       | 11 个模块                      | auto (=0)，与地图 wrapper 同级                |

## 地图图片组织（按层级分组）

```
public/static/images/bj-cmcc-cmd-dispatcher/map/
├── city/        base.png + outline.png + 0.png + 1.png  ← 正式
├── company/     base.png + outline.png + 0.png + 1.png  ← 占位，待替换
├── district/    base.png + outline.png + 0.png + 1.png  ← 占位，待替换
├── street/      base.png + outline.png + 0.png + 1.png  ← 占位，待替换
├── community/   base.png + outline.png + 0.png + 1.png  ← 占位，待替换
├── station/     base.png + outline.png + 0.png + 1.png + sub-td.png + sub-nr.png  ← 占位，待替换
└── logical/     base.png + outline.png + 0.png + 1.png  ← 占位，待替换
```

打点 icon 文件命名规则：

-   `{level}/0.png` — status 0（绿色，icon-green.png）
-   `{level}/1.png` — status 1（红色，icon-red.png）
-   `station/sub-{subType}.png` — subType 专属 icon（sub-td.png / sub-nr.png）

outline 各层级位置（设计稿像素）：

| Level     | left | top |
| --------- | ---- | --- |
| city      | 281  | 95  |
| company   | 103  | 172 |
| district  | 350  | 161 |
| street    | 275  | 180 |
| community | 285  | 256 |
| station   | 396  | 104 |
| logical   | 187  | 82  |

## 待办（持续追加）

-   [x] [task-2026-08-24-002-02-map-draw.md](../plans/task-2026-08-24-002-02-map-draw.md)：鼠标绘制交互（use-draw hook + shape 创建/选中/删除）
-   [x] [task-2026-08-24-002-03-map-detail-modal.md](../plans/task-2026-08-24-002-03-map-detail-modal.md)：框选区域详情弹窗（map-detail-modal + 图片弹窗 + 智能避让 + street 层级约束）
-   [x] [task-2026-08-24-003-bcd-modules.md](../plans/done/task-2026-08-24-003-bcd-modules.md)：B/C/D 组模块图片接入完成；网络影响按层级切换 5 张图（`Record<Level, { get src(): string }>` getter 映射）；PM 命名二次确认已取消（4 个命名保持现状）；趋势图 → task004
-   [x] 手动替换 6 个层级的 base.png + outline.png（2026-08-25 验证 7 层级 MD5 互不相同）
-   [x] [task-2026-08-25-005-failure-report-modal.md](../plans/done/task-2026-08-25-005-failure-report-modal.md)：故障分析报告弹窗（图片兜底）落地；新增 `modules/network-impact/failure-report-modal.tsx`，网络影响模块右上角透明 div 触发；antd Modal + Cascader，路径命中 PM 内容图；mock 级联 4 个分公司 → 区 → 街道（三级，区 value 为区划代码，街道为占位 mock）
-   [x] [task-2026-08-25-008-map-markers-mock.md](../plans/done/task-2026-08-25-008-map-markers-mock.md)：前五层地图打点 mock（map-markers.json）落地；新增 `.trae/skills/.../scripts/gen-map-markers-mock.cjs` 生成脚本（固定 LCG 种子，可复现）；7 个层级共 144 个点位（city 70 / company 34 / district 16 / street 12 / community 8 / station 3 / logical 1）；`category` 与 `legendCheckboxes` label 一致
-   [ ] task003 §4.2 遗留：基站退服按层级切换图片（A 组 vs B 组截图不同）
-   [ ] task003 §4.2 遗留：退服小区恢复情况按层级切换图片（B/C/D 组各层级截图可能不同）
-   [ ] task003 §4.3 遗留：基站退服列表 + 数量统计（趋势图已分流到 task004 完成）
-   [x] [task-2026-08-26-010-dynamic-time-labels.md](../plans/done/task-2026-08-26-010-dynamic-time-labels.md)：趋势图 label 数据/视图分离 + PM 拍板 — 日档截止当前时刻、月档截止当前月 + 中文 `X月` 格式 + markLine 索引化

---

## 文档元信息

> 日期：2026-08-26（更新：task010 趋势图 label 数据/视图分离 + PM 截断规则——9 个 mock 移除 label 字段；trend-chart.tsx 与 station-outage/index.tsx 新增 anchorMs + xLabels useMemo；markLine 改用索引定位；service-recovery / station-outage 模块描述更新；mock 清单追加 station-outage 5 行）
> 历史：
>
> -   2026-08-26：task008 前五层地图打点 mock 归档（gen-map-markers-mock.cjs + map-markers.json 144 点位）
> -   2026-08-25：task007 退服恢复时间范围 label + 右上角实时时钟模块；新增 modules/clock/，render.tsx 挂载 ClockModule
