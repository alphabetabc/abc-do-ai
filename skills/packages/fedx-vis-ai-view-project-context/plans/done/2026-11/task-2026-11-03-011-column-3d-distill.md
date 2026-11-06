# Task · 2026-11-03-011-column-3d-distill

> 蒸馏 `column-3d` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。原暂缓项，前置 digital-flop 物料已产出，现解锁。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-011-column-3d-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/ui/ui-column-3d/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（3D 柱体 + 顶面 percent 填充 + 数字翻牌 + 单位渐变） |
| 前置依赖 | ui-digital-flop 物料已产出——但按模块隔离约定不跨模块 import，DigitalFlop 逻辑模块内内联 |

---

## 目标（Goal）

把源项目 `web/components/ui/column-3d`（Column3d：SVG 伪 3D 柱体，percent 驱动顶面/侧面填充 + 数字翻牌 + 渐变单位）蒸馏为物料站模块 `docs/materials/components/ui/ui-column-3d/`。

## 背景与动机

- 台账暂缓项，前置 digital-flop 已解锁
- 大屏指标位常用装饰形态（indicator 类）

## 源码勘察结论（2026-11-03）

- 2 文件：`index.tsx`（155 行）/ `index.less`（32 行），共 7.0KB
- 组件入口 `Column3d({ className, width, color, percent, unit, value, precision })`
- 渲染结构：上部数字区（DigitalFlop + LinearTextGradient 单位）+ 下部 SVG 伪 3D 柱体（4 个多边形描边 + 3 个填充面，percent 映射 topTranslate/sideScale）+ 外发光 boxShadow
- 依赖面：
  - `classnames` → 模板字符串内联
  - `d3` 的 `color`（透明度调整）与 `scaleLinear` → 内联实现（hex/rgb 解析 + clamp 线性映射），零外部依赖
  - `../digital-flop` 的 `DigitalFlop`、`StyledLinearGradient` → 模块内内联（物料站禁止跨模块 import；按 ui-digital-flop 已蒸馏形态参考，colors/angle 作为 props 或直接实现渐变包裹）
  - `../../large-screen/lib` 的 `LinearTextGradient` → 来自 min.js 产物，无法搬运；模块内用 `background: linear-gradient + background-clip: text` 等价实现
  - `uniqueId` 用模块级自增 `++id`（源码即如此，保留）
- less 引用字体 DIN：保留 font-family 声明，字体不随物料分发
- 业务引用：台账记录被引 0 次（经 `lib/` 聚合导出显示 0 次属正常）

## 功能列表

- F1：manifest.json（name/description/tags/category=`indicator`）
- F2：spec.md（Props 表：className/width/color/percent/unit/value/precision；percent 语义 0-100 与柱体填充行为；单位渐变说明）
- F3：data-model.md（Props 类型、percent 边界、数字翻牌行为契约）
- F4：code/（index.tsx + index.less；classnames/d3/DigitalFlop/LinearTextGradient 全部内联，零外部依赖）
- F5：examples/（基础示例 + percent/value 动态变化示例，mock 数据）

## 不做清单

- 不搬 `../digital-flop` 原组件（内联，不跨模块 import）
- 不搬 `large-screen/lib`（LinearTextGradient 用 CSS background-clip 等价内联）
- 不引入新 npm 依赖（d3、classnames 均不引入）
- 不分发字体文件（DIN 等，仅在 CSS 声明）
- 不做柱体形态/尺寸的额外配置项（保持源 Props 面）

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（d3Color/scaleLinear 内联；DigitalFlop 内联；LinearTextGradient → CSS 渐变文字）→ spec/data-model/manifest → examples
- **输出**：`docs/materials/components/ui/ui-column-3d/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认柱体描边/填充、percent 顶面位移与侧面缩放、数字翻牌、单位渐变、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 column-3d 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=indicator
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、d3、classnames、digital-flop 跨模块引用
- [x] A3：`pnpm build` 通过
- [x] A4：examples 在 dev:preview 渲染正常（浏览器实测 PASS：basic 三柱 SVG+渐变；columnWidth 50/90/140 实测生效；翻牌动画；无 console error）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（含补充：新增 columnWidth prop 柱宽参数化） | 2026-11-03 | user |
| ② 实现验收 | 已验收（用户确认完成） | 2026-11-03 | user |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡。源码勘察完成（2 文件 / ~190 行）。关键决策：d3 的 color/scaleLinear 与 classnames 全部内联（对齐零依赖先例）；DigitalFlop 因模块隔离约定内联（参考已产出 ui-digital-flop 形态）；LinearTextGradient 源自 min.js 产物无法搬运，改用 CSS linear-gradient + background-clip:text 等价实现。
- 硬门槛①通过（含补充需求：新增 columnWidth prop 柱宽参数化，不传时跟随 width 保持源形态）。
- 四件套产出完成；`pnpm build` 通过；dev:preview 浏览器实测 PASS（columnWidth 50/90/140 生效、翻牌动画、无 console error）。待用户验收（硬门槛②）。
- 用户反馈优化：移除模拟发光的冗余 div（含源码遗留的 scale(1.001) 渲染 hack）与外层 wrapper，boxShadow 直接施加在 SVG 上，DOM 层级 -2。`pnpm build` 复验通过。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 前置物料（仅形态参考，不 import）：`docs/materials/components/ui/ui-digital-flop/`
