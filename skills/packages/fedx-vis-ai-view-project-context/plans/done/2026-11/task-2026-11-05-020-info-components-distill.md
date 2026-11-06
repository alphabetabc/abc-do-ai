# Task · 2026-11-05-020-info-components-distill

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-05-020-info-components-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/{indicator-view,chart-bar-pie,detail-table,dispatch-progress}/`（各含 manifest.json / spec.md / data-model.md / code/ / examples/） |
| Roadmap | `plans/roadmap.md` §组件蒸馏 |
| 验收标准 | 四件独立物料四件套齐备且站点可预览（chart-pie 作为 chart-bar-pie 的 example 合并，不单独出料） |
| 前置依赖 | task-018（ensure-progress 已归档）、task-019（工作流 2 画像能力） |

---

## 目标（Goal）

> 蒸馏 information-hub-center 的 `components` 目录下 5 个子组件为 4 件独立物料（indicator-view / chart-bar-pie / detail-table / dispatch-progress），其中 chart-pie 与 chart-bar-pie 的 Pie.tsx 高度同源，作为 chart-bar-pie 的 example 合并，不单独出料。

---

## 步骤（执行计划）

### 步骤 1：建卡与定档确认

- **动作**：核对五件与既有物料的重叠面，形成归类结论；用户拍板拆分粒度与 DetailTable 定位
- **输出**：本任务卡（已含定档结论与不做清单）
- **等待用户**：是（硬门槛①）

### 步骤 2：indicator-view 蒸馏

- **动作**：left / right 双版对比（仅样式类名差异、DOM 结构一致）→ 合并为一个物料，left 版为基准；图标走内联 SVG（不复用源项目位图资源）
- **输出**：`docs/materials/components/business/indicator-view/` 四件套
- **等待用户**：否

### 步骤 3：chart-bar-pie 蒸馏（含 chart-pie 合并）

- **动作**：抽 `barOption`（纵向柱状图）+ `Pie.tsx`（2D 环形 + 双侧图例）为一个组合物料；chart-pie 的 Pie.tsx 差异（filter value>0 / 5 条以下填充空数组 / tooltip 注释块）作为 examples 变体
- **输出**：`docs/materials/components/business/chart-bar-pie/` 四件套 + `examples/chart-pie-variant.tsx`
- **等待用户**：否

### 步骤 4：detail-table 蒸馏

- **动作**：以 left 版 ProTable 语义（request 回调 + 行选择 + 首行默认选中 + activeRowField 高亮）为准，剥离 @ant-design/pro-table 依赖，改为受控数据 + onRowSelect 回调的受控组件
- **输出**：`docs/materials/components/business/detail-table/` 四件套
- **等待用户**：否

### 步骤 5：dispatch-progress 蒸馏

- **动作**：纵轴节点时间线 + 图文卡片；图标内联 SVG；useEnvironment/useIntervalTimer 剥离
- **输出**：`docs/materials/components/business/dispatch-progress/` 四件套
- **等待用户**：否

### 步骤 6：站点验证与回填

- **动作**：`pnpm build` 通过；四件 manifest 的 category 取自分类词表（indicator / chart / table / business）；回填本卡技术设计与进度日志
- **输出**：构建通过记录 + 任务卡回填
- **等待用户**：是（硬门槛②）

---

## 背景与动机

information-hub-center 的 `section-left/components` 与 `section-right/components` 目录各含一组子组件，共 5 个（indicator-view / chart-bar-pie / chart-pie / table / dispatch-progress）。按 task-017 定稿结论，这批属于「B 档独立物料」，与既有 ui-* 物料（ui-ind-top-n、ui-table、rc-echarts/pie-3d）形态不重叠，值得单独出料。

---

## 功能列表

- F1：indicator-view 物料（图标 + 数值指标卡，双版合并）
- F2：chart-bar-pie 物料（纵向柱状图 + 2D 环形图组合，含 chart-pie 变体 example）
- F3：detail-table 物料（带行选择的业务表格，ProTable 语义受控化）
- F4：dispatch-progress 物料（纵轴节点时间线 + 图文卡片）

---

## 不做清单

- 不做 chart-pie 独立物料（与 chart-bar-pie 的 Pie.tsx 高度同源，作为 example 合并）
- 不做 source 项目中的 `section-right-modal-content` / `section-left-modal-content` 等布局壳类（那是页面级布局，非组件能力）
- 不引入 @ant-design/pro-table / procomponents 依赖（物料站无此依赖，且站点 AGENTS 禁止在 docs/ 中引入站点逻辑）
- 不做信息枢纽页面的整页级业务模块（整页蒸馏另议）
- 不复用源项目位图资源（icon-*.svg 等），一律内联 SVG 等价重绘

---

## 业务规则

- **chart-bar-pie**：bar 与 pie 的数据源独立（bar 为分类序列，pie 为占比序列）；left/right 版差异为容器类名与图例/单位默认处理（left 默认 showPie=false、单位固定「个」；right 默认 showPie=true、单位取数据自带 unit）
- **detail-table**：首行默认选中；activeRowField 指定高亮字段；行选择为受控（外部持有 selectedKey）
- **indicator-view**：left/right 双版仅容器类名与栅格宽度不同，DOM 与数据一致 → 合并为一物料
- **dispatch-progress**：节点图标区分「已完成 / 进行中 / 未开始」三态，时序由 props 传入

---

## 前置 / 必读

- [x] 已读：`research/2026-11-04-business-module-shape.md`（017 定稿归类表）
- [x] 已读：五件画像产物 `research/2026-11-05-distill-profile-{indicator-view,dispatch-progress,chart-bar-pie-left,chart-pie-left,detail-table-left,indicator-view-right,chart-bar-pie-right,detail-table-right}.md`
- [x] 已读：task-018 归档卡（物料代码约定参照）
- [ ] 依赖已就绪：task-018 已归档 ✓

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | 五件拆分落地粒度 | 用户 | 已关闭 | 拆 4 件独立物料（chart-pie 并入 examples） |
| 2 | DetailTable 定位 | 用户 | 已关闭 | 做成带行选择的业务表格（保留 ProTable 语义，改为受控） |

---

## 验收 checklist

- [x] A1：四件物料均含 manifest.json（name / description / tags / category 四项必填，category 取自分类词表）/ spec.md / data-model.md / code/ / examples/
- [x] A2：chart-bar-pie 的 examples 含 chart-pie 变体（`examples/chart-pie-variant.tsx`），且 examples 均 default export 可运行、自带 mock 数据、不依赖外部服务
- [x] A3：detail-table 具备行选择 + 首行默认选中（非受控时 useEffect）+ activeRowField 高亮（matchField 字段比较），且不依赖 @ant-design/pro-table
- [x] A4：四件 code/ 内不出现源项目路径别名（~/web/...）、不引入站点逻辑、不分发位图资源（dispatch-progress 的 icon-line/icon-fault 改为 CSS 虚线轴 + 纯色标签等价重绘）
- [x] A5：`pnpm build` 通过（2026-11-05，`✓ built in 23.55s`，3448 modules，四件物料 example chunks 均在产物中）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（N/A，无架构级决策）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（N/A，未声明；以 build 通过为准）

---

## 技术设计（阶段二回填）

- **indicator-view**（category=indicator）：left/right 双版合并，保留全部 Props（right 多出的 loading/emptyDescription 内联空态实现，替代 DataStatus 依赖）；active 按 `id` 匹配；图标走 ReactNode 内联 SVG；nameColor 走 CSS 变量 `--name-color`
- **chart-bar-pie**（category=chart）：组合物料；`BarData {xData,yData,legendName?,unit?}`（统一可空 unit，覆盖 left 固定「个」/right 取 data.unit 双版语义）；`Pie` 单独成文件并从 index re-export（`export { Pie }; export type { PieData, IndicatorItem };`，修复 chart-pie-variant example 引用）；中心指标 graphic/DOM 双模式（enableGraphicIndView）
- **detail-table**（category=table）：**antd v6 Table 承载**（用户中途加装 antd ^6.7.0，替代最初自建 `<table>` 方案）；ProTable request 回调语义受控化为纯 `dataSource` props；首行默认选中迁移到 `useEffect`（仅非受控且无 selectedRow 时）；`matchField = activeRowField ?? rowKey` 字段值比较（非引用比较）驱动 rowClassName `.selected-row`；`disableRowSelect=true` 即 right 版纯展示语义；loading/emptyText 内联（替代 DataStatus）
- **dispatch-progress**（category=business）：纯展示时间线；位图等价重绘——icon-line.svg → `border-left: 2px dashed` 虚线轴，icon-fault.png 标签底图 → 纯色圆角背景，typeStyle 可覆盖标签配色；自定义细滚动条
- **依赖内联化**（全件通用）：classnames → 模板字符串；isEmpty → `!arr?.length`；chunk（图例分列）→ 内联 slice；useSetState → useState；echarts-for-react 直接 import（不引源项目 `~/web/components/large-screen/lib` 别名）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-05 | 建卡 | 017 定稿队列下一项：info components 五件 | — |
| 2026-11-05 | detail-table 从自建 `<table>` 改为 antd Table 承载 | 用户主动提供 antd ^6.7.0 依赖，antd Table 的 sticky 表头/scroll/emptyText/onRow 能力更贴合 ProTable 语义 | 否（实现方案内技术选型调整，需求与验收不变；spec 差异表已同步修正） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-05 | 用户（对话拍板：正常推进整卡） |
| ② 实现验收 | 已通过 | 2026-11-06 | 用户 |

---

## 进度日志

### 2026-11-05

> - task-018 已归档，四件套位于 `docs/materials/components/business/ensure-progress/`
> - 用工作流 2（distill-profile.mjs）跑出 8 份画像产物，五件（+左右双版）全部精读
> - 重叠面核对：indicator-view 与 ui-ind-top-n 形态不同；chart-bar-pie 的 pie 是 2D 环形（非 pie-3d surface）；detail-table 的行选择是 ui-table 没有的；dispatch-progress 与 ensure-progress 形态完全不同
> - 用户拍板：拆 4 件独立物料 + detail-table 做带行选择版本 → 建卡
> - 步骤 2-5 完成：indicator-view / chart-bar-pie / detail-table / dispatch-progress 四件套全部产出
> - 用户中途加装 antd ^6.7.0 → detail-table 改用 antd Table 承载（见变更记录）
> - `pnpm build` 前两轮各 1-2 个 TS 错误：① chart-pie-variant 引 Pie 未导出 → index.tsx 补 re-export；② detail-table example useState 泛型过窄 → `useState<Record<string, any>>` 放宽。第三轮通过（`✓ built in 23.55s`，3448 modules）
> - 验收 checklist A1-A5 全勾，任务卡技术设计/变更记录/本日志已回填 → 停在硬门槛②等用户验收
> - 用户反馈「饼图没有出来」→ 浏览器实测：`.pie---root`（flex 布局）内 echarts 容器宽度塌缩为 0，控制台报「Can't get DOM width or height」；修复：Pie.tsx 内包一层 `.pie-chart { flex:1; min-width:0 }` 容器并给 ReactECharts 显式 width:100%。复验三 example canvas 均非零尺寸有像素，警告消失
> - 用户反馈「柱图图例位置很奇怪」→ getBarOption legend 补 `top: 0`（echarts legend 默认落绘图区右下）；排查中发现更严重问题：dev 下图表时有时无——根因是 src/main.tsx 的 React.StrictMode effect 双执行与 echarts-for-react「临时实例→finished→dispose 重建」竞态，去掉 StrictMode 后复验三 example 柱/环/图例全部稳定渲染

---

## 引用一致性（归档前必走）

- [ ] `current-sprint.md` —— 移除该任务索引行
- [ ] `backlog.md` —— 若曾登记，迁移到 `[REJECTED]` 或相应位置
- [ ] `roadmap.md` —— 按需更新进度

> 禁止：未完成引用更新前移动文件。

---

## 关联

> - 相关 task：task-2026-11-05-018-ensure-progress-distill（已归档）、task-2026-11-05-019-distill-pipeline、task-2026-11-04-017-business-inventory-refine
> - 相关 backlog 项：无
