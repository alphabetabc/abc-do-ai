# Task · 2026-11-04-015-pie-3d-distill

> 蒸馏 `rc-echarts/pie-3d` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。2026-11-04 用户决策：恢复蒸馏（曾搁置），emap-gis / decoration / screen-title / titles 同日搁置。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-04-015-pie-3d-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/pie-3d/`（新增四件套）、`package.json`（可能新增 echarts-gl 依赖——见开放问题 #1）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（3D 饼扇曲面 + 空数据不渲染 + 渐显过渡） |
| 前置依赖 | 无 |

---

## 目标（Goal）

把源项目 `web/components/ui/rc-echarts/pie-3d`（Pie3d：echarts-gl surface 参数方程伪 3D 饼图）蒸馏为物料站模块 `docs/materials/components/rc-echarts/pie-3d/`。

## 背景与动机

- 台账 rc-echarts 系收官项（bar3d-line / gauge 已完成）
- 大屏占比类指标常用形态（category=chart）

## 源码勘察结论（2026-11-04）

- 2 文件：`index.tsx`（46 行）/ `utils.ts`（280 行）
- 组件入口 `Pie3d({ data, colors, extraOpts })`：
  - data 空则不渲染（isEmpty 判断）
  - colors 数组按索引循环取色注入 itemStyle
  - 首帧 rAF 后渐显（opacity 0→1，0.3s）
  - `getPie3dOption(pieData, 0.45, memoExtraOpts)`，0.45 为内径比
- 核心：`getParametricEquation`（扇形曲面参数方程，选中/悬停逻辑源码中已禁用 isSelected=false、hoverRate 恒 1）；`getPie3dOption` 生成 N 个扇形 surface series + 3 个透明遮挡面（盖顶/垫底），d3.max + scaleLinear 将 value 归一到 0–100 决定扇高
- 依赖面：
  - `echarts-gl`（side-effect import，surface 系列必需）→ **物料站未安装**，见开放问题 #1
  - `ReactECharts`（large-screen/lib）→ 按先例改 `import ReactECharts from 'echarts-for-react'`
  - `isEmpty` / `cloneDeep` / `isUndefined`（@fedx-web-common/utils）→ 物料站已有 `lodash-es` 依赖，直接 import 同名函数
  - `useMemorizedObject`（~/web/hooks）→ 源码 36 行整段复制内联，其 isEqualWith/isFunction 亦取自 lodash-es（函数按 toString 对比）
  - `d3` 的 `max` / `scaleLinear` → 模块内内联（column-3d 先例：clamp 线性映射），零 d3 依赖

## ⚠️ 开放问题（审批时需决策）

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | **echarts-gl 与物料站 echarts 6.1.0 兼容性**：…… | 用户 | 已关闭 | 采用方案 (a)：echarts-gl 2.0.9 与 echarts 6.1.0 共存实测可行——build 通过（1938 modules）、dev:preview 两个示例 WebGL canvas 均渲染出彩色 3D 扇形、无兼容性抛错（2026-11-04 浏览器实测） |

## 功能列表

- F1：manifest.json（name/description/tags/category=`chart`）
- F2：spec.md（Props 表 3 项：data/colors/extraOpts；data 空不渲染；渐显行为；value 归一语义）
- F3：data-model.md（Props 类型、扇形生成契约、归一化规则）
- F4：code/（index.tsx + utils.ts；d3 内联；isEmpty/cloneDeep/isUndefined 取自 lodash-es；useMemorizedObject 整段内联；echarts-for-react 直接依赖；echarts-gl side-effect import）
- F5：examples/（基础示例多扇形 + extraOpts.viewControl 自定义）

## 不做清单

- 不实现选中/悬停位移效果（源码中已禁用，保持 disabled）
- 不新增 Props、不改内径比 0.45 与遮挡面结构
- 不引入 d3（max/scaleLinear 内联）
- 不分发字体

---

## 步骤（执行计划）

### 步骤 0：兼容性验证（前置）

- **动作**：安装 echarts-gl，用最小 demo 验证 echarts 6.1.0 + echarts-gl 2.0.9 surface 渲染；不可行则回到开放问题 #1 重新决策
- **输出**：验证结论（写入进度日志）
- **等待用户**：否（不可行时上报）

### 步骤 1：四件套产出

- **动作**：code/（内联 d3/工具）→ spec/data-model/manifest → examples（mock data）
- **输出**：`docs/materials/components/rc-echarts/pie-3d/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认 3D 扇形曲面、渐显、空数据不渲染、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 pie-3d 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=chart
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、`large-screen/lib`、`d3` 引用（lodash-es 为物料站既有依赖，允许）
- [x] A3：`pnpm build` 通过（首跑 4 个 TS 报错：pieData.forEach 隐式 any + 3 处遮挡面 z 函数未用参数 u，已修复）
- [x] A4：examples 在 dev:preview 渲染正常（浏览器实测 PASS：basic / view-control 两示例 canvas 均采样到彩色 3D 扇形像素；console 无兼容性抛错，仅 vite 预构建 chunk 中断（非致命）、echarts-gl `geo3D exists.` 常规 warn、挂载瞬间 DOM 尺寸时序 warn）
- [x] A5：台账 002 对应条目备注已更新

### 2026-11-04（执行）

- 步骤 0 兼容性验证：安装 echarts-gl 2.0.9（pnpm，有 peer 依赖警告符合预期），实测与 echarts 6.1.0 共存可行，开放问题 #1 关闭（方案 a）。
- 四件套产出完成：code/utils.ts（getParametricEquation + getPie3dOption，d3Max/scaleLinearClamped 内联）、code/index.tsx（Pie3d + useMemorizedObject 整段内联 + lodash-es）、spec.md、data-model.md、manifest.json、examples/basic.tsx + view-control.tsx。
- `pnpm build` 首跑 4 个 TS 报错（forEach 隐式 any、遮挡面 z 函数未用参数 u→_u），修复后 PASS（1938 modules）。
- dev:preview 浏览器实测 PASS：两示例渲染彩色 3D 扇形，无兼容性抛错。待用户验收（硬门槛②）。
- 用户反馈「饼图太小」：根因是 wrapper 沿用了源项目全局 class `full-width full-height`（物料站不存在）导致高度塌陷至 ~100px；改为显式 `style={{ width: '100%', height: '100%' }}` 后复验 PASS（canvas 360px 高、扇形填充中心区域、无新增 error）。

---

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（方案 a：echarts-gl 2.0.9 与 echarts 6 共存，先实测；lodash-es 复用 / useMemorizedObject 整段内联） | 2026-11-04 | 用户 |
| ② 实现验收 | 已通过（尺寸塌陷问题修复并复验通过；commit 032d841） | 2026-11-04 | 用户 |

---

## 进度日志（按需追加）

### 2026-11-04

- 建卡。源码勘察完成（2 文件 / ~326 行）。关键决策：d3 的 max/scaleLinear 与 @fedx-web-common 工具全部内联；useMemorizedObject → useMemo；选中/悬停效果源码已禁用、保持。**最大风险**：echarts-gl 2.0.9 官方仅支持 echarts ≤5，物料站为 6.1.0，列为开放问题 #1，建议先按共存实测。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 同系先例（仅形态参考，不 import）：`docs/materials/components/rc-echarts/gauge/`
