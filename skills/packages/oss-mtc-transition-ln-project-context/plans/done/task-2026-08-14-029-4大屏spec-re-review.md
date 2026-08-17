# Task · 2026-08-14-029-4大屏spec-re-review

> 状态：✅ 完成 → `done/`
> 类型：L3 docs 维护（4 大屏 spec 与 data-models.md 一致性 re-review）
> 创建：2026-08-14
> 完成：2026-08-14
> 前置：无（以当前 data-models.md 为正确基线）
> 关联依据：`docs/design/data-models.md`；`docs/specs/038~041/spec.md`；`docs/specs/038~041/data-model-extensions.md`
> **review 记录**：`plans/task-2026-08-14-029-review-notes.md`（差异清单逐份记录在此）
> **后续修复 task**：task-030（039）/ task-031（040）/ task-032（041）/ task-033（038）

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-08-14-029-4大屏spec-re-review                                                                                                                                                                                                                                            |
| 任务类型  | L3 docs 维护（review only）                                                                                                                                                                                                                                                   |
| 基线假定  | 当前 data-models.md 是正确版本                                                                                                                                                                                                                                                |
| 影响范围  | `docs/specs/038-bigdata-personnel-display/spec.md`<br>`docs/specs/039-bigdata-petition-display/spec.md`<br>`docs/specs/040-bigdata-beijing-petition-display/spec.md`<br>`docs/specs/041-bigdata-petition-comparison-display/spec.md`<br>以及对应的 `data-model-extensions.md` |
| 验收标准  | ① 4 份 spec 与 data-models.md 的引用一致性核对完成 ② 差异清单逐份记录到 review-notes ③ 后续修复 task 已拆分创建                                                                                                                                                           |
| 优先级    | **最高**——只有保证 038~041 spec 完全正确，才考虑 data-models.md 和 AGENTS.md 的事                                                                                                                                                                                             |

---

## 1. 背景

data-models.md 已恢复至正确版本。当前基线：

- §7 信访大屏：§7.1~§7.5（letter_screen_1/2/3/5/6，**无 letter_screen_4**）
- §8 报表/统计分析：§8.1~§8.5（**无 §8.6 信访大屏模块、无 §8.7 aa_jycy 就业信息**）
- §1 边界表：可视化分析-信访 → `dw_basic_lc`
- 全文**无 `dw_dashboard`** schema 标注

4 份大屏 spec 是在此基线之前生成的，可能存在引用已不存在章节/表的问题。本 task 负责逐份核对并记录差异。

---

## 2. 执行结果

### 步骤 1：038 spec re-review ✅

- 发现 14 处差异，全部集中在 `aa_jycy` / §8.7 引用
- 2 张表引用正确（`stats_jdlk_persion_infor_cant` §6.4、`abi_zb_tyjrjqyfdx` §8.2）
- §10 O-2/O-5/O-6 依赖 `aa_jycy`，需用户决策后处理

### 步骤 2：039 spec re-review ✅

- 发现 20 处差异：15 处 §8.6/dw_dashboard 引用失效 + 4 处 §7.4 错位 + 1 处 varchar
- §10 O-1 前提失效；O-2/O-3 问题仍在但需删除 §8.6 引用

### 步骤 3：040 spec re-review ✅

- 发现 20 处差异，与 039 完全同构
- 040 的 REG_AUTHORITY=1 和模块3 扩展为 9 项卡片不受影响

### 步骤 4：041 spec re-review ✅

- 发现 20 处差异，与 039/040 同构
- 041 的 REG_AUTHORITY IN(1,2) 双值聚合和对比渲染不受影响
- 开放问题编号与 039/040 不同（O-2 是 schema 不一致）

### 步骤 5：汇总 ✅

- 合计 74 处差异：60 处需修复 + 14 处需用户决策
- 拆分为 4 个修复 task：task-030（039）/ task-031（040）/ task-032（041）/ task-033（038）

---

## 3. 硬约束

- 以当前 data-models.md 为正确基线，不假设"之前应该有什么"
- 保留 §10 原始 O 条目，添加「决议 / 说明」列说明状态变更原因
- 修改的 docs 文件不写 `.trae/` 路径引用
- 不修改 PM 输入原始内容

---

## 4. 依据

| 来源类型 | 路径                                                         | 引用章节               |
| -------- | ------------------------------------------------------------ | ---------------------- |
| docs     | `docs/design/data-models.md`                                 | §1、§7、§8（当前基线） |
| docs     | `docs/specs/038-bigdata-personnel-display/spec.md`           | 全文                   |
| docs     | `docs/specs/039-bigdata-petition-display/spec.md`            | 全文                   |
| docs     | `docs/specs/040-bigdata-beijing-petition-display/spec.md`    | 全文                   |
| docs     | `docs/specs/041-bigdata-petition-comparison-display/spec.md` | 全文                   |
| docs     | `docs/specs/038~041-bigdata-*/data-model-extensions.md`      | 全文                   |

---

## 5. 状态记录

| 日期       | 变更                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| 2026-08-14 | task 创建                                                                                |
| 2026-08-14 | ✅ 4 份 spec re-review 全部完成；review-notes 已记录 74 处差异；拆分为 task-030~033 修复 |
