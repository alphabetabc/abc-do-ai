# Task · 2026-11-03-010-ind-top-n-distill

> 蒸馏 `ind-top-n` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`。原暂缓项，前置 center 物料已由同事产出，现解锁。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-010-ind-top-n-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/ui/ui-ind-top-n/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（排名条 + 光点动画 + 渐变三角条形） |
| 前置依赖 | ui-center 物料已产出（`docs/materials/components/ui/ui-center/`）——但按模块隔离约定不跨模块 import，Center 逻辑模块内内联 |

---

## 目标（Goal）

把源项目 `web/components/ui/ind-top-n`（IndTopN：TopN 排名列表，rank 徽标 + SVG 渐变三角条形 + 光点动画）蒸馏为物料站模块 `docs/materials/components/ui/ui-ind-top-n/`。

## 背景与动机

- 台账暂缓项，前置 center 已解锁
- 大屏 section-left/right 排名位常用形态（indicator 类）

## 源码勘察结论（2026-11-03）

- 4 文件：`index.tsx`（21 行）/ `Item.tsx`（70 行）/ `Container.tsx`（74 行 styled-components）/ `index.less`（70 行）
- 组件入口 `IndTopN({ title, className, width, data })`，`data: { id, name, value, percent, rank }[]`
- 依赖面：
  - `styled-components`（Container.tsx 全部 + index.tsx 的 width 容器）→ 按先例（ui-center/ui-svg）改为内联 style / less，零外部依赖
  - `classnames` → 模板字符串内联
  - `@fedx-web-common/utils` 的 `isEmpty/isNumber` → 内联实现
  - `@fedx-web-common/react-hooks` 的 `useSize` → 按同事 ui-svg 先例，ResizeObserver 自实现
  - `~/web/hooks/useUniqueId`（useRef+useId）→ 模块内内联
  - `../center` 的 Center → 模块内内联（物料站禁止跨模块 import）
- less 中引用字体 YouSheBiaoTiHei / Swiss721BT / DIN / MicrosoftYaHei：保留 font-family 声明，字体本身不随物料分发（大屏环境字体）
- 光点动画依赖 `@keyframes animation-scale`（定义在 less 中）+ styled-components 伪元素 → 迁移为 less/内联实现
- 业务引用：grep `IndTopN` 仅组件自身（台账说明：经 `lib/` 聚合导出显示 0 次属正常）

## 功能列表

- F1：manifest.json（name/description/tags/category=`indicator`）
- F2：spec.md（Props 表：IndTopN 的 title/className/width/data；Item 数据项 id/name/value/percent/rank；交互与动画说明；字体说明）
- F3：data-model.md（Props 类型、数据项结构、percent 语义与边界）
- F4：code/（index.tsx + Item.tsx + index.less；styled-components/classnames/useSize/useUniqueId/Center 全部内联，零外部依赖）
- F5：examples/（基础排名示例 + percent 动态变化示例，mock 数据）

## 不做清单

- 不搬 `~/web/components/ui/center`（内联，不跨模块 import）
- 不分发字体文件（YouSheBiaoTiHei / Swiss721BT / DIN 等，仅在 CSS 声明）
- 不引入新 npm 依赖（styled-components、classnames 均不引入）
- 不做 echarts 版 TopN（纯 HTML/SVG 实现，保持源形态）

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（styled-components → 内联 style + less；useSize → ResizeObserver；useUniqueId/isEmpty/isNumber/Center 内联）→ spec/data-model/manifest → examples
- **输出**：`docs/materials/components/ui/ui-ind-top-n/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认排名条渲染、光点定位动画、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 ind-top-n 行更新；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=indicator
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、styled-components、classnames 引用
- [x] A3：`pnpm build` 通过
- [x] A4：examples 在 dev:preview 渲染正常（rank 徽标 + 渐变三角条形 + 光点动画 + 呼吸圈）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | user（会话指令「task 010 执行」） |
| ② 实现验收 | 已通过 | 2026-11-03 | user（「这个任务可以了，请归档」） |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡。源码勘察完成（4 文件 / ~235 行）。关键决策：styled-components 与 classnames 全部内联化（对齐同事 ui-center/ui-svg 零依赖先例）；useSize 用 ResizeObserver 自实现；Center 因模块隔离约定内联。

### 2026-11-03 · 执行

- 产出 `docs/materials/components/ui/ui-ind-top-n/`：code/（index.tsx + Item.tsx + types.ts + index.less）、spec.md、data-model.md、manifest.json（category=indicator）、examples/（basic + dynamic-percent）。
- 实现要点：
  - BarContainer/RankNumberContainer 的 styled-components 伪元素样式迁入 index.less；光点位置由动态 `--light-left` CSS 变量驱动（原为 styled props `$left`），percent=0 时加 `no-light` 类隐藏光点
  - useUniqueId 用 React 18 `useId` 内联（多实例 SVG 渐变 id 不冲突）；useSize 用 ResizeObserver 内联；Center 内联为普通 div
  - keyframes 改名 `ind-top-n-animation-scale` 避免全局命名冲突；类型收敛到 types.ts（props 从 any 收紧）
- 验证：`pnpm build` 通过（tsc -b + vite build）；dev:preview 浏览器验证 PASS（rank 徽标 / 渐变三角 / 光点呼吸圈 / 2s 动态 percent 过渡动画均正常，console 无 error）
- 台账 002 ind-top-n 行已回填。

### 2026-11-03 · 修复（用户反馈）

- 问题：宽度变化较小时，条形末端光点与条形宽度动画不同步（光点滞后）。
- 根因：svg 的 `width` 属性与 `viewBox` 在数据更新时瞬时跳到新值，仅 CSS `width` 走 1s 过渡；svg 默认 `preserveAspectRatio="xMidYMid meet"` 在 viewBox（新值）与过渡中的 CSS width 不一致时按比例缩放居中绘制，导致**视觉条形末端**偏离 CSS width 轨迹，与纯 `left` 过渡的光点脱节（宽度减小时偏差最明显）。此问题源项目同样存在。
- 修复：svg 增加 `preserveAspectRatio="none"`，绘制坐标严格贴合 CSS width，条形末端与光点同为 1s linear、轨迹完全一致（高度方向 viewBox 与元素一致，无非均匀拉伸副作用）。
- 复验：`pnpm build` 通过。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 前置物料（仅形态参考，不 import）：`docs/materials/components/ui/ui-center/`
