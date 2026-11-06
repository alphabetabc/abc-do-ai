# Task · 2026-11-04-014-gauge-distill

> 蒸馏 `rc-echarts/gauge` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-04-014-gauge-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/gauge/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（半圆仪表盘 + 指针 + 圆形指针大刻度盘 + 百分比数值） |
| 前置依赖 | 无 |

---

## 目标（Goal）

把源项目 `web/components/ui/rc-echarts/gauge`（Gauge：echarts 双 series 半圆仪表盘，0–1 值驱动，value 为 0–1 小数）蒸馏为物料站模块 `docs/materials/components/rc-echarts/gauge/`。

## 背景与动机

- 台账第二部分 rc-echarts 系待蒸馏项
- 大屏指标评分/达成率常用形态（category=chart）

## 源码勘察结论（2026-11-04）

- 3 文件：`gauge/index.tsx`（23 行）/ `gauge/utils.ts`（130 行）/ `ReactIntersectionObserver.tsx`（53 行，仅 gauge 引用）
- 组件入口 `Gauge({ className, radius, center, value })`；value 语义 0–1，min 0 / max 1，detail formatter 显示 `value*100%`
- 双 series：主盘（progress + 指针 + 刻度）+ 装饰盘（圆形大指针 icon + detail 百分比文字）
- 依赖面：
  - `ReactECharts`（large-screen/lib）→ 按先例改 `import ReactECharts from 'echarts-for-react'`
  - `useMemorizedObject`（~/web/hooks）→ 内联为普通对象 + useMemo（该 hook 语义即深比较 memo，蒸馏按 props 直接依赖即可，行为等价）
  - `Decimal.mul(value, 100)`（~/web/utils/decimal）→ `Math.round(value * 100)`（value 为 0–1 小数，无精度问题）
  - `ReactIntersectionObserver` → 模块内内联（原生 IntersectionObserver，进入视口才渲染；该文件仅 gauge 引用，整文件搬入）
- props 无类型定义（源码即 any）→ 蒸馏时补 Props 接口（className/radius/center/value，不新增语义）

## 功能列表

- F1：manifest.json（name/description/tags/category=`chart`）
- F2：spec.md（Props 表 4 项；value 0–1 语义；进入视口渲染行为）
- F3：data-model.md（Props 类型、value 边界、option 生成契约）
- F4：code/（index.tsx + utils.ts + IntersectionObserver 内联；echarts-for-react 直接依赖）
- F5：examples/（基础示例：不同 value / radius；动态 value 示例）

## 不做清单

- 不搬 `large-screen/lib`、`~/web/hooks`、`~/web/utils/decimal`
- 不新增 Props、不改变双 series 结构与配色
- 不做仪表盘样式参数化（颜色/角度等沿用源内置）
- 不引入 decimal.js（乘 100 用原生算术）

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（内联 IntersectionObserver 与 memo 逻辑）→ spec/data-model/manifest → examples（mock value 数据）
- **输出**：`docs/materials/components/rc-echarts/gauge/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认半圆盘、指针、刻度、百分比文字、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 gauge 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=chart
- [x] A2：code/ 可直接 import，无 `~/web`、`large-screen/lib` 引用
- [x] A3：`pnpm build` 通过（998 modules）
- [x] A4：examples 在 dev:preview 渲染正常（浏览器实测 PASS：三表盘 72%/35%/100% 渲染、dynamic-value 步进动画、懒挂载触发、无 console error）
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

- 建卡。源码勘察完成（3 文件 / ~206 行）。关键决策：echarts-for-react 直接依赖；useMemorizedObject 简化为 useMemo；Decimal.mul → 原生乘法；ReactIntersectionObserver 整体内联（仅 gauge 引用）。
- 硬门槛①通过（2026-11-04，用户）。
- 四件套产出完成（code/ 3 文件 + manifest + spec + data-model + 2 examples）；`pnpm build` 通过（998 modules）；dev:preview 浏览器实测 PASS（basic 三表盘 72%/35%/100% 渲染、dynamic-value 步进动画、懒挂载触发、console 无 error）。
- 硬门槛②通过（2026-11-04，用户）。台账 002 rc-echarts 条目 gauge 子项已回填，归档至 done/2026-11/。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 同系先例（仅形态参考，不 import）：`docs/materials/components/rc-echarts/echarts-map/`
