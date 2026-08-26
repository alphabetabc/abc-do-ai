# 变更检查清单 (Change Checklist)

北京移动指挥调度模块变更前 / 后自检项。

---

## 后端（项目无服务端，本节全部不适用 ❌）

> 本项目按 [roadmap.md §一](../../plans/roadmap.md)「重要调整」决策**无服务端**（所有演示数据以静态 JSON 形式存放于 `public/static/mock/bj-cmcc-cmd-dispatcher/`，前端直接 `fetch`）。下列 6 项后端自检全部不适用，不勾选。

-   ❌ 新增命令已加入集中枚举 / 常量
-   ❌ 新增 / 修改 handler 已注册到分发器
-   ❌ 入参 / 出参类型已在 `src/interface/detail.ts` 补全
-   ❌ Mock 数据已同步更新（`src/mock/` 与 `public/static/mock/`）→ 仅后者适用
-   ❌ 关键路径日志已补充（`src/socket/Socket.ts` 中含 `command` / `payload` / `traceId`）
-   ❌ 默认兜底处理器未遗漏

## 前端（模块级改动自检）

> 路由 / `render.tsx` / `LargeScreenEnv` 尺寸等 scaffold 项在 task001 已固化，后续 task 不再涉及。本节仅保留**模块级改动**每次都要查的项。

-   [ ] 模块文件改动已落位（`web/pages/bj-cmcc-cmd-dispatcher/modules/<name>/` 新增或修改）
-   [ ] `MY_LEVELS: Level[]` 与 `currentLevel` 兼容（非可见层级返回 `null`）
-   [ ] 如新增图片：`public/static/images/bj-cmcc-cmd-dispatcher/` 下资源已就位
-   [ ] 如新增 mock：`public/static/mock/bj-cmcc-cmd-dispatcher/` 下 JSON 已落地
-   [ ] 跨模块共享 UI 已抽到 `web/pages/bj-cmcc-cmd-dispatcher/components/<shared>/`（非必须）
-   [ ] TS 编译 0 错误（cmd-dispatcher scope 内）

## 文档

-   [ ] `design/003-frontend.md` 是否需要补充新模块结构 / 形态约定
-   [ ] `design/frontend/001-modules-params.md` 模块参数表已同步（如新增 / 改形态）
-   [ ] `status/current.md` 已更新（新增 / 修改模块描述、mock 表、资源表）
-   [ ] 对应 task 的 §六 文档同步要求表格项全部勾选

---

## Task001 收口自检（2026-08-24）

### 实施落地（全部 ✅）

-   [x] `web/pages/bj-cmcc-cmd-dispatcher/render.tsx` 全量 import 11 个模块，stage 容器 `position: relative`
-   [x] `web/pages/bj-cmcc-cmd-dispatcher/store/index.ts` 含 `currentLevel` / `setLevel` / `useVisibleGroup()`
-   [x] `web/pages/bj-cmcc-cmd-dispatcher/components/service-recovery-panel/index.tsx` 共享 UI（variant + src 双 prop）
-   [x] 11 个模块目录 + index.tsx 全到位
-   [x] 4 张 UI 出图接入（A 组：地图 / 网络影响 / 基站退服 / 退服恢复情况）
-   [x] `<Background>` 外框 z-index:10 + pointerEvents:'none' 覆盖
-   [x] dev 环境 `window.__store` 挂载（手测用）
-   [x] TS 0 错误

### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（路由 / 目录树 / 静态资源 / Group 映射 / z-order / 待办）
-   [x] `design/003-frontend.md` 已更新（新增 §5-10 共 6 小节约定）
-   [x] `design/001-pm-output.md` 已新增 §10「PM 回复记录附录」
-   [x] task001 拆分出 task002（地图交互）+ task003（B/C/D 模块）
-   [x] PM 待澄清 2 项已分流到 task002/003

### 路由 / 后端

-   [x] `src/controller/index.ts` 已含 `/bj-cmcc-cmd-dispatcher`（原有）

### 不在本次范围

-   ❌ 数字人接入
-   ❌ 真实数据 / Mock 数据接入
-   ❌ 模块内部业务实现（图表 / 表格 / 列表）
-   ❌ 样式美化
-   ❌ 响应式 / 自适应
-   ❌ 地图热区实际接入（task002）
-   ❌ 热区 hot-zone 实际节点（task002）
-   ❌ B/C/D 组模块图片（task003）
-   ❌ 退服小区恢复情况 / 小区清单 / 站址画像 / 站址性能 命名 PM 二次确认（task003）

### 已知问题 / 遗留

-   task002 待办：地图热区 hot-zone 实际接入 + setLevel 联动 + 东山社区地图视图细化
-   task002 待办：按 PM 回复重构 `currentLevel`（删 cell/nr，加 logical）/ `LEVEL_TO_GROUP`
-   task003 待办：B/C/D 组模块图片 + 4 个模块命名 PM 二次确认
-   **项目其它模块已有 TS 错误**（layout/index.tsx、useSocketIOClient.ts、large-screen-demo、metahuman-shanxi、unicom-shannxi）—— 不在 cmd-dispatcher scope 内

---

## Task002-01 收口自检（2026-08-24）

### 实施落地（全部 ✅）

-   [x] `modules/map/map-stage.tsx` 底图 + 轮廓 + SVG overlay + 打点渲染 + crossfade 过渡动画
-   [x] `modules/map/map-legend.tsx` 图例独立组件（memo 包裹，与 MapStage 平级渲染）
-   [x] `modules/map/presets.ts` 常量映射抽离（MAP_LEVEL_ASSETS / NEXT_LEVEL / PREV_LEVEL / OUTLINE_POSITION / LEVEL_LEGEND getter / getMarkerIcon）
-   [x] `modules/map/types.ts` 新增 MapMarker 接口
-   [x] `modules/map/index.tsx` 组装 MapStage + MapLegend + MapToolbar
-   [x] `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json` 27 个点位，7 层级
-   [x] icon 文件分散到 `map/{level}/` 目录（0.png / 1.png / sub-td.png / sub-nr.png）
-   [x] `icon-radar.svg` 扩散动画（3 圈从中心扩散到最大后渐隐，错开 1s）
-   [x] crossfade 过渡：旧层淡出 + 新层淡入 + 轻微缩放（prevSnapshot 快照机制）
-   [x] 图例 z-index 修正：6 → 16（避免 crossfade 期间被新层 z=11/12 遮挡）
-   [x] LEVEL_LEGEND 改为 getter 形式（延迟取值）
-   [x] TS 0 错误

### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（新增 map-legend.tsx / z-order 表 / mock 数据 / 文件描述）
-   [x] `design/003-frontend.md` 已更新（删除 Group 抽象 / 热区改为 outline 点击 / 新增 §9 地图层级切换约定）
-   [x] task-2026-08-24-002-01-map-base.md 看板 + 附录已更新

### 不在本次范围

-   ❌ 鼠标绘制交互（task002-02）
-   ❌ B/C/D 组模块图片 PM 二次确认（task003）
-   ❌ 手动替换 6 个层级的 base.png + outline.png

### 已知问题 / 遗留

-   task002-02 待办：鼠标绘制交互（use-draw hook + shape 创建/选中/删除）
-   task003 待办：B/C/D 组模块图片 + 4 个模块命名 PM 二次确认
-   6 个层级的 base.png + outline.png 暂用 city 图占位，待手动替换

---

## Task002-02 收口自检（2026-08-25）

### 实施落地（全部 ✅）

-   [x] 新增 `modules/map/use-draw.ts`（事件分发 hook：mousedown/move/up/click/dblclick 按 activeTool 分发 + previewShape 临时预览 + 切工具自动 reset DrawState）
-   [x] 改 `modules/map/map-stage.tsx`（接入 useDraw hook，SVG `pointerEvents: 'auto'`，渲染 previewShape，传递 selected/interactive/onSelect 给 ShapeRenderer）
-   [x] 改 `modules/map/shape-renderer.tsx`（扩展 `selected`/`preview`/`interactive`/`onSelect` prop；选中态橙色高亮 `#ff8800` + strokeWidth=3；预览态黄色虚线 `#ffff00` + strokeDasharray）
-   [x] 改 `modules/map/map-toolbar.tsx`（select 模式 + selectedShapeId 非空时显示"🗑 删除"按钮，点击调 removeShape + setSelected(null)）
-   [x] rect / circle 拖拽创建（mousedown 起点 → mousemove 预览 → mouseup 落定 addShape，距离 ≤2px 防误触）
-   [x] polygon click 落点 + dblclick 收尾（≥3 点才 addShape）
-   [x] select 命中 + 高亮 + 删除（click shape → setSelected，空白处取消选中，🗑 按钮删除）
-   [x] 切换 activeTool 时 DrawState 重置（useEffect 监听 tool 变化）
-   [x] 坐标转换：getBoundingClientRect → 2880×1080 设计稿像素
-   [x] TS 0 错误（cmd-dispatcher scope 内）

### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（map 模块文件清单新增 use-draw.ts + 各文件描述更新 + 待办勾选）
-   [x] `design/003-frontend.md` 已更新（新增 §11 鼠标绘制交互约定：事件路由表 / 坐标系 / DrawState 自管 / 选中态样式表 / 删除交互）
-   [x] task-2026-08-24-002-02-map-draw.md 看板已更新

### 不在本次范围

-   ❌ 快捷键 Esc / Ctrl+Z / Delete（用户已确认不加快捷键）
-   ❌ 样式可配置（用户已确认写死）
-   ❌ 持久化（用户已确认不持久化）
-   ❌ 弹窗 4 指标卡（属 selector widget，后续 task）
-   ✅ 历史回溯时间轴（task006 已完成）
-   ❌ 真实地图底图替换（PM 二轮答复，后续 task）
-   ❌ B/C/D 组模块图片 PM 二次确认（task003）

### 已知问题 / 遗留

-   task003 待办：B/C/D 组模块图片 + 4 个模块命名 PM 二次确认
-   [6 个层级的 base.png + outline.png 暂用 city 图占位，待手动替换
-   **项目其它模块已有 TS 错误**（layout/index.tsx、useSocketIOClient.ts、large-screen-demo、metahuman-shanxi、unicom-shannxi）—— 不在 cmd-dispatcher scope 内

---

## Task003 + Task004 收口自检（2026-08-25）

### Task003 — B/C/D 组模块图片 + 命名二次确认

#### 实施落地（全部 ✅）

-   [x] task003 §五 看板 8 项：图片接入 / Group 校验 / `pointerEvents` / TS / 趋势图（→ task004）完成
-   [x] task003 §四.2 网络影响按层级切换 5 张图（`Record<Level, { get src(): string }>` getter 映射）
-   [x] PM 命名二次确认：4 个 ⚠️ 命名保持现状（不再推进）

#### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（图片清单 + 网络影响按层级切换 + 命名最终状态）
-   [x] `design/003-frontend.md` 不需要改（命名未变）
-   [x] task003 §7.1 / §7.2 实施记录已落
-   [x] task003 §五 看板勾选 + §四.2 网络影响项 ✅

#### 不在本次范围

-   ❌ 退服基站列表 / 数量统计（task003 §4.3 剩余项，留待后续 task）
-   ❌ 退服小区恢复情况 / 退服恢复情况按层级切换图片（task003 §4.2 未实现）

### Task004 — 基站退服模块能力补齐（趋势图 + 时间粒度）

> 详见 [done/task-2026-08-25-004-station-outage-chart.md](../../plans/done/task-2026-08-25-004-station-outage-chart.md) §10.1 实施记录

#### 实施落地（全部 ✅）

-   [x] 重写 `modules/station-outage/index.tsx`：图片背景 + 4 tab + 单位标签 + 折线图 + 自定义日期区间
-   [x] 折线图用 `ReactECharts`（曲线 `smooth` + 区域渐变 + 两端对齐 y 轴）
-   [x] 单位标签按 PM 设计稿：`rgba(166, 190, 206, 1)` + `Microsoft YaHei` + `17.76px`
-   [x] 自定义档 `antd DatePicker.RangePicker`，半选状态不触发过滤
-   [x] 数据接入：`useRequest`（ahooks）+ `ready` + `refreshDeps` 按 `currentLevel` 自动切换
-   [x] 新增 5 份 mock：`station-outage-trend-{city,company,district,street,community}.json`
-   [x] 数据合规校验：每层级所有数据点 ≤ 限制（脚本校验通过）
-   [x] TS 编译 0 错误

#### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（modules 描述 + 资源表 + mock 表 + 待办）
-   [x] `design/frontend/001-modules-params.md` 已更新（station-outage 形态 + 「结构型叠加变种」约定）
-   [x] task003 §五 看板勾选 + §7.2 实施记录

#### 不在本次范围

-   ❌ 退服基站列表 / 数量统计（task003 §4.3 剩余项）
-   ❌ 不同层级数据联动（按 PM 给定 max 限制固定，纵向层级 max 不同）
-   ❌ 自定义档日期区间聚合（前端预切片匹配，4 份周切片足够 Demo）

---

## Task005 收口自检（2026-08-25）

> 详见 [task-2026-08-25-005-failure-report-modal.md](../../plans/done/task-2026-08-25-005-failure-report-modal.md)

### 实施落地（全部 ✅）

-   [x] 新增 `web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/failure-report-modal.tsx`（透明触发 div + antd Modal/Cascader + mock 级联数据 + 路径命中映射）
-   [x] 改 `web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx`：import `FailureReportModal`，外层 wrapper div 集中模块定位（`position:absolute, left/top/width/height`），`<img>` 用 `width:100%/height:100%` 填充，渲染 `<FailureReportModal />`；保留 5 级 MY_LEVELS 显隐逻辑
-   [x] 触发 div 锚点：相对 wrapper 用 `right: 0, top: 0, width: 100, height: 30`（等价绝对坐标 `left: 1878+906-100=2684, top: 87`），仅 `cursor: pointer`，无视觉元素
-   [x] antd Modal 视觉：`title={null}` / `footer={null}` / `width={960}` / `centered` / `destroyOnClose`；`styles.body.padding=0` + `styles.content.background='transparent'`，避免覆盖 PM 背景图设计
-   [x] 背景图容器：`故障分析报告弹窗-背景.png` 通过 `backgroundImage` 渲染，`backgroundSize: '100% 100%'`
-   [x] 右上角 Cascader：`changeOnSelect` + `expandTrigger='hover'` + `width: 280`；Cascader 输入框自带路径展示（无需额外 Breadcrumb）
-   [x] Cascader 默认选中 `['城区三分公司']`（`DEFAULT_CASCADE_PATH` 常量）：打开弹窗即命中公司级内容图，提升 Demo 体验
-   [x] Mock 级联：3 个分公司（城区一/二/三分公司）+ 6 个区 + 9 个街道，最小可用集覆盖 PM 主演示路径 `城区三分公司 → 石景山区 → 广宁`
-   [x] 路径命中映射：`CONTENT_IMG_BY_PATH` 仅 3 条（PM 已出图），其它路径不渲染 `<img>` 仅显示背景
-   [x] 内容图容器 `padding: '75px 24px 24px'`：顶部 75px 给 Cascader 与内容图之间留白，避免覆盖
-   [x] 关闭后重置：`afterClose` → `setCascadePath(DEFAULT_CASCADE_PATH)`，下次打开仍是默认选中
-   [x] 状态隔离：`open` + `cascadePath` 全部 `FailureReportModal` 组件内 `useState`，不进 store
-   [x] 与框选弹窗（`map-detail-modal`）独立：可同时存在，互不耦合
-   [x] 4 张图片资源已存在（PM 已出图）：`故障分析报告弹窗-{背景,城区三分公司,石景山,广宁}.png`
-   [x] TS 编译 0 错误（cmd-dispatcher scope 内）

### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（`modules/network-impact/` 说明追加故障报告能力 + 新增 `failure-report-modal.tsx` 行 + 资源表追加 4 张图片 + 待办勾选 task005 + 日期更新）
-   [x] `design/003-frontend.md` 已更新：§5.1 简化为「外层 wrapper div」约定 + 引用 frontend/004-module-wrapper-div.md（避免 design 引用具体 task）
-   [x] `design/frontend/004-module-wrapper-div.md` 已新增：模块 wrapper div 模式独立文档（推荐结构 / 好处 / 反例 / 适用场景）
-   [x] `plans/done/task-2026-08-25-005-failure-report-modal.md` 已更新：§3.4.1/3.4.2 代码示例同步实施调整（wrapper div + 默认选中 + paddingTop:75）；§4.1/4.3/7.5 交互流程同步；状态改「已完成」
-   [x] task005 §六 文档同步要求表格项全部勾选

### 不在本次范围（图片兜底留待后续）

-   ❌ 5 个结构化字段拆解为 React 组件（全阻物理站 / 受影响物理站 / 资源数 / 退服占比 / RRC 最大连接数）
-   ❌ 真实接口对接（图片内容写死；级联选项为 mock）
-   ❌ 弹窗内列表分页 / 排序 / 筛选
-   ❌ 自定义动画 / 智能避让（沿用 antd 居中）
-   ✅ 历史回溯功能（task006 已完成）
-   ❌ 社区 / 物理站 / 逻辑站层级的故障报告按钮（PM 标书仅要求 3 级）

### 已知问题 / 遗留

-   弹窗宽高按背景图实际比例可在 PM review 时微调（当前 `width={960}` + `minHeight: 600`）
-   透明 div 的 hover 高亮由 PM review 时确认（默认不加）
-   后续真实接口接入时，需要把 `FAILURE_REPORT_CASCADE` 替换为接口数据，并把命中 `<img>` 替换为 5 字段结构化组件

---

## Task006 收口自检（2026-08-25）

> 详见 [task-2026-08-25-006-timeline-history.md](../../plans/done/task-2026-08-25-006-timeline-history.md)
>
> **设计变更记录（与原 plan diff）**：原 plan 提出的「4 档 tab + mock history-timeline.json」方案被 PM 截图设计推翻 — 实际 UI 是单横向滑轨（track + thumb + tick + label），无 tab。TimelineHistory 改为纯派发控件，仅向 store 写入 `currentTimeIndex`。
>
> **时间范围最终决策**：默认以「当前时间为终点、向前每 5min 一个、共 24 个点 → 覆盖前 2 小时」生成时间列表；mount 时一次性快照并 snap 到 idx=max（"现在"）。
>
> **mock + map-stage 接入（2026-08-25 归档补充）**：最终落地"前三层"方案——生成 `history-timeline.json`（city/company/district × 24 时间点，status 恒为 1，marker 数量按 idx 渐增体现退服恢复）；map-stage 接入 `EFFECTIVE_LEVELS` + `useRequest<HistoryData>` + `useMemo` 按 `currentTimeIndex` 取历史点位。

### 实施落地（全部 ✅）

-   [x] 新增 `web/pages/bj-cmcc-cmd-dispatcher/components/timeline-history/index.tsx`（共享组件，非 modules）：默认时间点 = 「当前时间为终点、向前每 5min 一个、共 24 个点 → 覆盖前 2 小时」；mount 时自动 snap 到 idx=max（"现在"）；track + 进度填充 + tick marks + thumb + 时间 label（每 3 个 tick 抽稀 1 个 label）；点击 / 拖动滑轨 → `setCurrentTimeIndex`；pointerEvents:'auto' 单独可命中
-   [x] 视觉对齐 PM 设计稿：track `rgba(48, 127, 214, 0.2)` 12px + 已填充 `rgba(48, 127, 214, 1)` 12px + thumb 棉花糖形（顶圆角矩形 14×16，圆角 `7px 7px 2px 2px` 上宽下窄 + 底棍 2×6）+ tick marks 蓝色系
-   [x] 改 `web/pages/bj-cmcc-cmd-dispatcher/store/index.ts`：新增 `currentTimeIndex: number`（初始 0）+ `setCurrentTimeIndex: (idx: number) => void`
-   [x] 改 `modules/service-recovery/index.tsx`：在 `<ServiceRecoveryPanel>` 同级叠加 `<TimelineHistory>`，位置 `left: 83 / top: 830 / width: 1730`（图片顶 8px 边距 + 左右各 30px 留白）；保持原 `MY_LEVELS`（city ~ street）与原 `<img>` 不变
-   [x] 改 `modules/map/map-stage.tsx`：接入历史回溯——`EFFECTIVE_LEVELS = ['city','company','district']` + `useRequest<HistoryData>` 拉 `history-timeline.json`（`ready: isEffective` 守卫）+ `markers` useMemo 按 `currentTimeIndex` 取 `historyData[level][idx].markers`，其余层走原 `markerData` 过滤
-   [x] 改 `modules/map/types.ts`：新增 `HistoryTimePoint` / `HistoryData` 类型
-   [x] 新增 `public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json`：city/company/district 三层 × 24 时间点，status 恒为 1，marker 数量按 idx 渐增（idx 0 ~30% → idx 23 100%）
-   [x] 新增 `.trae/skills/.../scripts/gen-history-timeline-mock.cjs`：mock 生成脚本（固定坐标 + LCG 随机 → 稳定输出）
-   [x] **不引入** antd Slider / 新依赖；用 pointer events + ref 实现拖动

### 文档同步（全部 ✅）

-   [x] `status/current.md` 已更新（components 目录新增 timeline-history + store 字段表追加 + service-recovery 模块说明追加 + 待办勾选 task006 + 日期更新）
-   [x] `plans/roadmap.md` 已更新（T11 状态 ✅；§7.2 Mock 清单移除 history-timeline.json 并标注"不落地"；§八 看板勾选）
-   [x] `plans/task-2026-08-25-006-timeline-history.md` 已迁至 `done/` 并补充设计变更说明 + 实施记录

### 不在本次范围

-   ❌ 拖动节流（原生 pointer events 触达频率由浏览器决定，60fps 下足够流畅；待 marker 数量放大到 100+ 时再评估 `requestAnimationFrame` 节流）
-   ❌ 自定义档日期区间选择器（设计变更后无 tab 概念）
-   ❌ 联动网络影响 / 基站退服趋势模块
-   ❌ 滑轨动画过渡 / 自动播放模式
-   ❌ 滑轨视觉背景（PM 截图由用户更新图片提供；当前 React 自带 track 视觉作为兜底）
-   ❌ 滚动时间窗口（mount 后时间点不再刷新，避免漂移；如需由后续 task 引入 `interval` prop）
-   ❌ PM 真实数据源接入（当前用 mock；下游接口 `fetch('/api/history-timeline?range=...')` 接入时 store + 组件 API 不变）

### 已知问题 / 遗留

-   滑轨精确像素（`left: 83 / top: 830 / width: 1730`）按当前 `退服恢复情况.png` 估算；PM 更新图片后可能需要微调 ±5px
-   street 层 timeline 渲染但不响应拖动（map-stage 走原 markerData 路径）；如需更明确 UX，可加 `disabled` 视觉提示

---

## 文档元信息

> 日期：2026-08-25（归档更新：Task006 mock + map-stage 接入完成——history-timeline.json 生成 / EFFECTIVE_LEVELS 前三层方案 / types.ts HistoryData 类型 / scripts/gen-history-timeline-mock.cjs；已知问题移除"currentTimeIndex 未使用"；历史回溯待办勾选 ✅）
