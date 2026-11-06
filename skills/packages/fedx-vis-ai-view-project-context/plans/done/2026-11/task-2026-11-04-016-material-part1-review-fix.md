# Task · 2026-11-04-016-material-part1-review-fix

> 第一部分（同事提交）物料 review 问题修复。台账母任务：`./task-2026-11-03-002-component-inventory.md`。review 结论（2026-11-04，含全量 `pnpm build` PASS + 子代理逐模块审查）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-04-016-material-part1-review-fix` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | 5 个 manifest.json + ui-video 的 spec.md / data-model.md；AGENTS.md 分类词表（可选，若采纳 `form`） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 5 处 category 合规（或词表已扩充）、blendScreen 补入文档、`pnpm build` 复验通过 |
| 前置依赖 | 无 |

---

## 目标（Goal）

修复第一部分 12 个物料模块 review 发现的规范性问题：category 词表违规 5 处 + ui-video Props 文档缺失 1 处。

## Review 结论摘要（2026-11-04）

- 全量 `pnpm build` PASS（tsc + vite，1938 modules）——编译与依赖纪律全部合格
- 12 模块 import 纪律全部合格：无跨模块、无 src/、无外部库
- 问题 3 类：
  1. **category 用了词表外值 `display`（4 处）**：ui-digital-flop、ui-time-display、ui-vertical-infinite-info —— 词表无 `display`；digital-flop 词表典型物料明确归 `indicator`；vertical-infinite-info 词表典型物料归 `table`
  2. **category 用了词表外值 `form`（1 处）**：ui-select —— 词表无 `form`
  3. **ui-video 文档缺 `blendScreen` Prop**：code `Video.tsx` 有 `blendScreen: boolean`（默认 true），spec.md Props 表与 data-model.md `VideoProps` 均未收录

## 修复方案（待审批决策）

| # | 问题 | 方案 |
| - | ---- | ---- |
| 1 | digital-flop / time-display 的 category=display | 改为 `indicator` |
| 2 | vertical-infinite-info 的 category=display | 改为 `table` |
| 3 | select 的 category=form | **二选一（需决策）**：(a) 在 AGENTS.md 词表新增 `form`（表单类：select 等）；(b) 改用现有分类（无贴切项，均勉强）——倾向 (a) |
| 4 | ui-video 缺 blendScreen | 补入 spec.md Props 表（blendScreen/boolean/true/视频与背景混合开关）与 data-model.md VideoProps |

## 不做清单

- 不改 5 个模块的 code/ 与 examples/（review 合格）
- 不处理「echarts（被引 15 次）无对应物料」疑点（用户指示暂不管，2026-11-04）
- 不处理 ui-panel / ui-table 的轻微表述问题（不计为问题）
- 不改 AGENTS.md 词表以外的任何约定

---

## 步骤（执行计划）

### 步骤 1：修复

- **动作**：改 5 处 manifest.json category + ui-video 两个文档补 blendScreen +（若选方案 3a）AGENTS.md 词表加 `form` 行
- **等待用户**：否（方案 3 需先拍板）

### 步骤 2：复验

- **动作**：`pnpm build` 复验；grep 校验无残留 `display`/`form` 词表外 category
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 相应行备注 review 结论；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：5 处 category 全部合规（词表内或词表已扩充）
- [x] A2：ui-video spec.md / data-model.md 均含 blendScreen
- [x] A3：`pnpm build` 复验通过（1938 modules）
- [x] A4：台账 002 备注 review 结论

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（含修复方案 1/2/4；方案 3 执行时按推荐 (a) 词表新增 form） | 2026-11-04 | user |
| ② 实现验收 | 已通过（用户确认归档） | 2026-11-04 | user |

---

## 进度日志（按需追加）

### 2026-11-04

- 建卡。review 完成：全量 build PASS；12 模块纪律合格；问题 3 类（4×category=display、1×category=form、ui-video 缺 blendScreen 文档）。echarts 疑点按用户指示搁置。
- 修复执行完成：3 处 category 改值 + AGENTS.md 词表新增 form（方案 3a）+ ui-video 两文档补 blendScreen；grep 校验 display 清零；build 复验 PASS（1938 modules）。
- 硬门槛②通过，台账 002 第一部分收官语补 task-016 引用，归档。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
