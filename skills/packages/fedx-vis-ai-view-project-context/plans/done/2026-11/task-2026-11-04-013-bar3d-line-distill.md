# Task · 2026-11-04-013-bar3d-line-distill

> 蒸馏 `rc-echarts/bar3d-line` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。rc-echarts 系已有先例（echarts-map / horizontal-interval-bar-chart，echarts 依赖允许）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-04-013-bar3d-line-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/bar3d-line/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（3D 柱体 + 折线 + markLine + 双 Y 轴 + 图例） |
| 前置依赖 | 无 |

---

## 目标（Goal）

把源项目 `web/components/ui/rc-echarts/bar3d-line`（Bar3dLineChart：echarts custom series 伪 3D 立方柱 + 折线 + markLine，双 Y 轴）蒸馏为物料站模块 `docs/materials/components/rc-echarts/bar3d-line/`。

## 背景与动机

- 台账第二部分 rc-echarts 系待蒸馏项
- 大屏常用「指标分组 → 柱/线混合」图表形态（category=chart）

## 源码勘察结论（2026-11-04）

- 2 文件：`index.tsx`（141 行）/ `utils.ts`（305 行）
- 组件入口 `Bar3dLineChart({ legend, seriesSettings, dataSource, yAxisLeft, yAxisRight, optionBuilder, onHandleBarClick })`
- 核心：`createSeries` 按 `indicatorGroup` 分组生成 Bar3D（custom renderItem 四面体 polygon）/ Line / MarkerLine 三类 series；`buildCubeOption` 定义 3D 立方柱渲染
- 依赖面：
  - `ReactECharts`（large-screen/lib）→ 按先例改 `import ReactECharts from 'echarts-for-react'`
  - `useLatest`（@fedx-web-common/react-hooks）→ 模块内 ref 内联
  - `cloneDeep` / `merge`（@fedx-web-common/utils）→ 模块内简易实现（仅用于 option 对象深拷贝与二级合并，结构已知可控）
  - d3 相关代码源码中已注释，无实际依赖
- `handleBarClick` 直接调用 `props.onHandleBarClick(params)` 未判空——蒸馏时补 `?.`（TS 修复，行为不变）

## 功能列表

- F1：manifest.json（name/description/tags/category=`chart`）
- F2：spec.md（Props 表 7 项；seriesSettings 的 SeriesType 枚举说明；dataSource 行结构契约）
- F3：data-model.md（TSeriesSettings / TDataSource 类型、SeriesType 枚举、createSeries 输出契约）
- F4：code/（index.tsx + utils.ts；useLatest / cloneDeep / merge 内联，echarts-for-react 直接依赖）
- F5：examples/（基础示例：柱+线+markLine；含 optionBuilder 自定义示例）

## 不做清单

- 不搬 `large-screen/lib`
- 不引入 @fedx-web-common 依赖（useLatest / utils 内联）
- 不新增 Props、不改变 createSeries 数据映射行为
- 不做 3D 柱形态配置扩展（barWidth / barGap 等沿用源参数）

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（内联 useLatest/cloneDeep/merge）→ spec/data-model/manifest → examples（mock indicatorGroup 数据）
- **输出**：`docs/materials/components/rc-echarts/bar3d-line/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认 3D 柱四面渲染、折线、markLine、图例、tooltip、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 bar3d-line 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=chart
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、`large-screen/lib` 引用
- [x] A3：`pnpm build` 通过（两轮：首轮 tsc 报 7 处类型错误已修；末轮 998 modules PASS）
- [x] A4：examples 在 dev:preview 渲染正常（浏览器实测 PASS：双示例 canvas 360/320px，3D 柱 + 折线 + markLine + 图例可见，「随机更新数据」按钮生效，无 console error）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-04 | user |
| ② 实现验收 | 已通过 | 2026-11-04 | user |

---

## 进度日志（按需追加）

### 2026-11-04

- 建卡。源码勘察完成（2 文件 / ~446 行）。关键决策：echarts-for-react 直接依赖（对齐 rc-echarts 先例）；useLatest / cloneDeep / merge 模块内内联；handleBarClick 补 `?.` 判空。
- 硬门槛①通过。四件套产出完成。
- 首轮 build 失败（7 处 tsc 错误）：未用参数 `params`、隐式 any 索引、seriesItem 类型未含 barWidth 等透传参数 → 修复（`_params`、Record 索引类型、seriesItem 补 `[x: string]: any` 并加注释）。二轮 build PASS。
- 首轮浏览器实测 FAIL：`seriesOpt.markLine.data = [...]` 在 MarkerLine 系列上崩溃（系列初始化无 markLine 属性，源码同病但源项目示例未触发）→ internalSettings 的 MarkerLine 补 `markLine: { data: [] }` 初始化。复测 PASS。
- 二轮实测遗留：源码依赖的全局类 `full-width full-height` 物料站不存在，canvas 仅 100px 高 → 容器与 ReactECharts 改内联 style 100%。终测 PASS（canvas 360/320px）。
- 硬门槛②通过（2026-11-04，用户）。台账 002 rc-echarts 条目 bar3d-line 子项已回填，归档至 done/2026-11/。


---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 同系先例（仅形态参考，不 import）：`docs/materials/components/rc-echarts/horizontal-interval-bar-chart/`
