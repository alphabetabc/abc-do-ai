# Task · 2026-11-03-008-horizontal-interval-bar-chart-distill

> 蒸馏 `rc-echarts/horizontal-interval-bar-chart` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`（第二部分 rc-echarts 拆项第一张卡）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-008-horizontal-interval-bar-chart-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/horizontal-interval-bar-chart/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 物料四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染 |
| 前置依赖 | echarts@^6.1.0 + echarts-for-react@^3.0.6 已安装（用户 2026-11-03 确认） |

---

## 目标（Goal）

把源项目 `web/components/ui/rc-echarts/horizontal-interval-bar-chart`（水平区间柱状图，ECharts custom series）蒸馏为物料站模块 `docs/materials/components/rc-echarts/horizontal-interval-bar-chart/`，供大屏项目复用。

## 功能列表

- F1：manifest.json（name/description/tags/category=`chart`）
- F2：spec.md（Props 表：colors/xData/dataSource/showTooltip/legendRight/legendLeft；交互说明）
- F3：data-model.md（IHorizontalIntervalBarChartProps 等类型定义、数据形状）
- F4：code/（index.tsx + UIHorizontalIntervalBarChart.tsx，`ReactECharts` 改用 `echarts-for-react`，`isEmpty` 内联替代）
- F5：examples/（基础区间柱示例 + UI 封装版示例，自带 mock 数据）

## 不做清单

- 不蒸馏 rc-echarts 其余子组件（gauge / bar3d-line / pie-3d / map，另立任务卡）
- 不搬 `UIHorizontalIntervalBarChart` 对 antd Flex 的依赖——若无法自包含则改用等价 flex 布局并注明
- 不引入 styled-components 之外的新依赖；不改源项目任何文件

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：Read 源码 → 提炼 code/（替换 ReactECharts import 为 `echarts-for-react`、内联 isEmpty）→ spec/data-model/manifest → examples（含 mock）
- **输出**：`docs/materials/components/rc-echarts/horizontal-interval-bar-chart/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build`（tsc + vite）→ `pnpm dev:preview` 打开模块详情页确认 examples 渲染
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注「rc-echarts」行标注拆项进展；更新 current-sprint / roadmap；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest 字段符合词表（category=chart）
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、`large-screen/lib` 引用
- [x] A3：`pnpm build` 通过
- [x] A4：examples 在 dev:preview 中正常渲染（浏览器验证通过，含图例交互）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | 用户（「执行 task」；产物路径经确认定为 docs/materials/components/rc-echarts/horizontal-interval-bar-chart/；同日验收评审批准修正方案：删废弃 UI 版、数据契约改标量） |
| ② 实现验收 | 已验收 | 2026-11-03 | 用户（「那这个就这样吧，归档这个task」） |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡；用户确认 echarts@6.1.0 / echarts-for-react@3.0.6 已装，ReactECharts 采用 `echarts-for-react`（决策：不复制 min.js，公网 npm 包替代）。
- 用户批准执行（硬门槛①）；产物路径与用户确认为 `docs/materials/components/rc-echarts/horizontal-interval-bar-chart/`（任务卡原写的顶层平铺路径作废）。
- 四件套产出完成：manifest（category=chart）/ spec / data-model / code（index.tsx + UIHorizontalIntervalBarChart.tsx）/ examples（basic + ui-dom）。
- 蒸馏适配：ReactECharts → `echarts-for-react`；`isEmpty` 内联；UI 版按自包含要求把 antd Flex / styled-components / @fedx-web-common useSetState 改写为原生 flex + useState + 内联样式（源仓未装 styled-components，不引入新依赖）；`full-width/full-height` 类改内联尺寸。
- `pnpm build` 通过（tsc -b + vite）；`pnpm dev:preview` 浏览器验证两示例渲染正常、图例可点击、无 console error。
- 台账 002「rc-echarts」行备注已更新；current-sprint 状态改「待验收」。待用户硬门槛②验收后归档。
- **能力边界澄清（验收对话）**：确认组件不支持 x/y 切换与标准分组柱（renderItem 水平语义写死、多系列为同线错位叠放）；单系列天然支持。定位明确为「特定大屏视觉的定制条形图」，选型说明已体现在 spec.md §1。
- 用户验收通过并指示归档（硬门槛②）。
- **变更（验收评审发现，用户批准修正）**：用户质疑 UI 版必要性 → 源项目彻查证实 UIHorizontalIntervalBarChart 为接口联调前实验实现（唯一调用点在 commit 2e7ea90 被注释，`enableUiBar` 开关亦被注释），真实在用的只有 ECharts 版；且接口契约是标量 value（`right.ts` 聚合产出），非三元组。修正：① 删除 code/UIHorizontalIntervalBarChart.tsx 与 examples/ui-dom.tsx；② data-model.md 数据契约改为标量并标注三元组为 stack 内部维度；③ spec.md 重写（补 custom series + stack 实现原理、开放问题标注升级回归点）；④ manifest 描述同步；⑤ basic.tsx 示例改标量数据。已重新浏览器验证标量渲染正确（两系列并排错位、标签、图例、无 console error）。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
