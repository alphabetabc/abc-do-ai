# Task · 2026-11-03-012-progress-bar-distill

> 蒸馏 `progress-bar` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-012-progress-bar-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/ui/ui-progress-bar/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（名称 + 翻牌数字 + 渐变单位 + 斜纹进度条填充/描边/动画） |
| 前置依赖 | 无（DigitalFlop 形态参考 ui-digital-flop / ui-column-3d，模块内内联） |

---

## 目标（Goal）

把源项目 `web/components/ui/progress-bar`（ProgressBar：名称 + 数字翻牌/渐变单位 + 斜纹描边进度条）蒸馏为物料站模块 `docs/materials/components/ui/ui-progress-bar/`。

## 源码勘察结论（2026-11-03）

- 3 文件：`index.tsx`（57 行）/ `BarStyledContainer.ts`（55 行）/ `index.less`（36 行），共 4.6KB
- 入口 `ProgressBar({ name, value, unit, percent, textGradientColors?, strokeWidth?, barColor?, barDecorationLineColor? })`
- 渲染结构：上部信息行（info-name + StyledLinearGradient 包 DigitalFlop，suffix 为 LinearTextGradient 单位）+ 下部斜纹进度条（BarStyledContainer 定制样式包裹 antd Progress：`strokeLinecap="butt"`、`trailColor="transparent"`、`status="active"`、`showInfo=false`）
- 依赖面与处置（对齐 column-3d / ind-top-n 先例，零外部依赖）：
  - `antd` Progress → 物料站无 antd，**用 div + CSS 重实现**（条形填充 + 边框 + 斜纹 overlay + active 流光动画），保持源 Props 面
  - `styled-components`（BarStyledContainer）→ 模板 CSS 内联（ind-top-n 先例）
  - `../digital-flop` 的 DigitalFlop / StyledLinearGradient → 模块内内联（模块隔离约定；参考已产出 ui-digital-flop 形态）
  - `large-screen/lib` 的 LinearTextGradient → min.js 产物无法搬运，CSS `linear-gradient + background-clip: text` 等价实现（column-3d 先例）
  - less 引用字体 DingTalk-JinBuTi / MicrosoftYaHei：保留 font-family 声明，字体不随物料分发
- 类名注意：源码 less 选择器依赖 `.fedx-ui-progress` / `.fedx-ui-statistic-content`（fedx 包装版 antd 前缀），重实现后类名改为本模块自有命名
- 业务引用：台账记录被引 0 次（经 `lib/` 聚合导出显示 0 次属正常）

## 功能列表

- F1：manifest.json（name/description/tags/category=`chart`）
- F2：spec.md（Props 表 8 项；percent 语义；斜纹描边/流光动画说明）
- F3：data-model.md（Props 类型、percent 边界、翻牌行为契约）
- F4：code/（index.tsx + 样式；antd/styled-components/DigitalFlop/LinearTextGradient 全部内联，零外部依赖）
- F5：examples/（基础示例 + 颜色/宽度自定义示例 + percent 动态变化示例，mock 数据）

## 不做清单

- 不搬 `../digital-flop` 原组件（内联，不跨模块 import）
- 不搬 `large-screen/lib`（LinearTextGradient 用 CSS background-clip 等价内联）
- 不引入新 npm 依赖（antd、styled-components 均不引入）
- 不分发字体文件（仅 CSS 声明）
- 不新增源 Props 面之外的配置项
- 不做 antd Progress 全能力对齐（只实现本组件用到的水平线形形态）

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（antd Progress → div/CSS 重实现；DigitalFlop 内联；LinearTextGradient → CSS 渐变文字；BarStyledContainer → CSS）→ spec/data-model/manifest → examples
- **输出**：`docs/materials/components/ui/ui-progress-bar/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认名称、翻牌数字、渐变单位、斜纹填充/描边、流光动画、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 progress-bar 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=chart
- [x] A2：code/ 可直接 import，无 antd、styled-components、digital-flop、large-screen/lib 引用
- [x] A3：`pnpm build` 通过
- [x] A4：examples 在 dev:preview 渲染正常（斜纹进度条 + 翻牌 + 渐变单位 + 动画、无 console error）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-04 | 用户 |
| ② 实现验收 | 已通过 | 2026-11-04 | 用户 |

---

## 进度日志（按需追加）

### 2026-11-04

- 建卡（2026-11-03）。源码勘察：3 文件 / 4.6KB，antd Progress 定制斜纹描边包裹。
- 硬门槛①通过（2026-11-04）：按卡内方案执行，antd Progress → div+CSS 重实现，其余依赖内联。
- 四件套产出 + `pnpm build` 通过 + dev:preview 浏览器实测 PASS（三示例、斜纹、渐变文字、8 个 shine 元素动画 running、console 无 error）。
- 硬门槛②通过（2026-11-04）：用户验收；台账 002 备注回填、current-sprint 索引移除、本卡归档。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 形态参考（不 import）：`docs/materials/components/ui/ui-digital-flop/`、`docs/materials/components/ui/ui-column-3d/`（DigitalFlop / LinearTextGradient 内联先例）
