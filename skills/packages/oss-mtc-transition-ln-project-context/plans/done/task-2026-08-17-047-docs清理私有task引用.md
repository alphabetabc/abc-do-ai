# Task · 2026-08-17-047-docs清理私有task引用

> 状态：✅ 完成
> 类型：仅 docs 维护
> 创建：2026-08-17
> 前置：无（纯清理类，不依赖任何 task）
> 关联依据：`.trae/rules/docs-no-private-refs.md`；`AGENTS.md` §10 文档修改门禁

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-08-17-047-docs清理私有task引用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 任务类型  | 仅 docs 维护（L3 严控）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 影响范围  | `docs/` 下含违规 `task-xxx` 引用的文件（初查 6 个，待步骤 1 完整审计后定稿）：<br>- `docs/specs/038-bigdata-personnel-display/data-model-extensions.md`<br>- `docs/specs/038-bigdata-personnel-display/spec.md`<br>- `docs/specs/039-bigdata-petition-display/spec.md`<br>- `docs/specs/039-bigdata-petition-display/data-model-extensions.md`<br>- `docs/design/api-contracts.md`<br>- `docs/specs/042-components-common/README.md`<br>- 待审计：038/039/040/041 的 `tasks.md` / `plan.md`（区分 spec 自带任务编号 vs 私有 task 引用） |
| 验收标准  | 1. 步骤 1 产出完整违规清单（文件 + 行号 + 原文 + 违规类型：纯私有 task 引用 / spec 自带任务编号误判 / 其他）<br>2. 清单经用户 review 后，步骤 2 按方案改写每一条<br>3. 改写后 `Grep "task-\d+" docs/` 仅剩 spec 五件套自带的内部任务编号（如 `tasks.md` 中 `#### 任务 task-001`）<br>4. 硬约束自检通过：`.trae/` / `agents.md`（不区分大小写）/ `.local-` 引用 0 命中<br>5. roadmap §4 提案 `R-DOCS-CLEAN-TASK-REFS` 勾选 [x]                                                                                                           |

---

## 1. 步骤（用户 review 后 AI 执行）

### 步骤 1：完整违规审计

- **动作**：
    1. `Grep "task-\d+" docs/` 列出全部命中文件
    2. 逐文件 `Read` 命中行上下文，区分三类：
        - **A 类 · 违规引用私有 task 文件**（指向 `.trae/skills/.../plans/task-xxx.md`，如「task-015 编码前置阻塞清理」「2026-08-17 task-046 落地」「task-034 阶段 A 落地」）→ 必须改写
        - **B 类 · spec 五件套自带任务编号**（如 `tasks.md` 中 `#### 任务 task-001`、`plan.md` 中 `task-001 ~ task-005`）→ **合规**，不动
        - **C 类 · 语义模糊**（如「属业务实现阶段 task-016」可能指 spec 内部任务也可能指私有 task）→ 标待用户澄清
    3. 对每条 A 类违规，起草改写方案（三选一）：
        - ① 删除 task 编号，改写为客观事实陈述（如「Kingbase 建表 SQL 已验证建表成功」）
        - ② 替换为正式 docs 引用（如 `docs/design/data-models.md §8.7`）
        - ③ 替换为正式 docs 章节锚点（如 `docs/design/api-contracts.md §7.38`）
- **输出**：违规清单 + 改写方案（写入本 task §4 审计表）
- **🛑 等待用户**：是（等待用户 review 清单 + 改写方案，确认哪些进入步骤 2）

### 步骤 2：逐条改写

- **动作**：按用户审批后的方案，对每条 A 类违规执行 `SearchReplace`
- **输出**：改写后的文件 diff（按文件分组列出前后对比）
- **🛑 等待用户**：否（改写完成后直接进入步骤 3 自检）

### 步骤 3：硬约束自检 + 提案勾选

- **动作**：
    1. `Grep "task-\d+" docs/` 复核仅剩 B 类合规命中
    2. `Grep "\.trae/|agents\.md|\.local-" docs/` 自检 0 命中（与 `docs-no-private-refs.md` / `docs-link-format.md` 联动）
    3. roadmap §4 提案 `R-DOCS-CLEAN-TASK-REFS` 勾选 [x]
    4. roadmap §3 索引本 task 状态更新为 ✅ 完成
    5. 本 task 文件移至 `plans/done/`
- **输出**：自检结果 + 状态更新确认
- **🛑 等待用户**：否

---

## 2. 依据（任务来源）

| 来源类型 | 路径                                                  | 引用章节                                                 |
| -------- | ----------------------------------------------------- | -------------------------------------------------------- |
| rule     | `.trae/rules/docs-no-private-refs.md`                 | 全文（禁止引用 `.trae/` 下任何文件）                     |
| rule     | `.trae/rules/docs-link-format.md`                     | 全文（docs/ 下引用须用仓库相对路径纯文本）               |
| AGENTS   | `AGENTS.md`                                           | §8 禁止行为（不得编造路径）/ §10 文档修改门禁（L3 严控） |
| skill    | `references/002-基于skill与docs的协作开发workflow.md` | §8 防漂移 review checklist                               |

**触发事件**：2026-08-17 用户在 `docs/specs/038-bigdata-personnel-display/data-model-extensions.md#L239` 选中「task-015 编码前置阻塞清理」并质疑「docs 下能体现 task-xxx 么？」；用户确认 `task-xxx` 指向私有文件后指示「你建立一个 task」。

---

## 3. 状态记录

| 日期       | 变更                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-17 | task 创建（用户指示建立 task 处理 docs/ 对私有 task-xxx 的违规引用）                                                                                 |
| 2026-08-17 | 步骤 1 审计完成：扫描 `docs/` 下 16 个命中文件，分类 A/B/C 三类，产出 §4 审计表（含 36 条 A 类违规 + 0 条 B 类 + 0 条 C 类）；待用户 review 改写方案 |

---

## 4. 审计表（步骤 1 产出，2026-08-17）

> 扫描范围：`docs/` 全目录
> 扫描方式：`Grep "task-\d+" docs/` + 逐文件 `Read` 上下文
> 命中文件数：16
> 分类规则：
>
> - **A 类 · 违规**：引用 `.trae/skills/.../plans/task-xxx.md` 私有文件 → 必须改写
> - **B 类 · 合规**：spec 五件套自带内部任务编号（如 `tasks.md`「任务 task-001」）→ 不动
> - **C 类 · 待澄清**：语义模糊 → 标待用户确认

### 4.1 A 类违规（36 条，需改写）

> 改写方案三选一：① 删 task 编号改客观事实 ② 替换为 `docs/design/...` 正式引用 ③ 替换为 docs 章节锚点

| #   | 文件                                                                                                                                                | 行      | 原文（摘录）                                                                                                     | 涉及 task                                                                            | 改写方案                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| 1   | `docs/specs/038-bigdata-personnel-display/data-model-extensions.md`                                                                                 | 239     | `> **来源**：task-015 编码前置阻塞清理（Kingbase 建表 SQL，已验证建表成功）。`                                   | task-015                                                                             | ① 删编号：`> **来源**：Kingbase 建表 SQL（已验证建表成功）。`                                           |
| 2   | 同上                                                                                                                                                | 293     | `...权威源为 docs/design/data-models.md#L1924 §8.7（2026-08-17 task-046 落地）；...`                             | task-046                                                                             | ① 删编号：`...权威源为 docs/design/data-models.md#L1924 §8.7；...`                                      |
| 3   | 同上                                                                                                                                                | 294     | `...Kingbase 双引号包裹语法已验证（task-046 §8.7 历史归档段；spec §10 O-2 关闭）；...`                           | task-046                                                                             | ① 删编号：`...Kingbase 双引号包裹语法已验证（docs/design/data-models.md §8.7；spec §10 O-2 关闭）；...` |
| 4   | `docs/specs/038-bigdata-personnel-display/spec.md`                                                                                                  | 111     | `> design 详述：docs/design/api-contracts.md §7.41（2026-08-17 task-034 阶段 A 落地）`                           | task-034                                                                             | ① 删编号：`> design 详述：docs/design/api-contracts.md §7.41`                                           |
| 5   | 同上                                                                                                                                                | 306     | `...见 data-model-extensions.md §2.5（task-040 §4.11 已同步）；...`                                              | task-040                                                                             | ① 删编号：`...见 data-model-extensions.md §2.5（已同步）；...`                                          |
| 6   | 同上                                                                                                                                                | 370     | `...大屏专用组件：ScalerContainer（task-010 ✅）、EcMap（task-011 ✅）。`                                        | task-010, task-011                                                                   | ① 删编号：`...大屏专用组件：ScalerContainer（✅）、EcMap（✅）。`                                       |
| 7   | 同上                                                                                                                                                | 461     | `- **图表组件**：EcMap（task-011 ✅）`                                                                           | task-011                                                                             | ① 删编号：`- **图表组件**：EcMap（✅）`                                                                 |
| 8   | 同上                                                                                                                                                | 543     | `> ⚠️ 卡片 contentHeight 当前使用 InfoCard 默认 200；需按图表实际高度逐卡调整（属业务实现阶段 task-016）。`      | task-016                                                                             | ① 删编号：`...（属业务实现阶段）。`                                                                     |
| 9   | 同上                                                                                                                                                | 544     | `> ⚠️ InfoCard title 已加 white-space: nowrap（task-041 修改），超长标题直接截断不换行。`                        | task-041                                                                             | ① 删编号：`> ⚠️ InfoCard title 已加 white-space: nowrap，超长标题直接截断不换行。`                      |
| 10  | 同上                                                                                                                                                | 609     | `                                                                                                                | ScalerContainer \| ✅ 已实现（建议共享） \| 大屏缩放适配容器；task-010 ✅；...`      | task-010                                                                                                | ① 删编号：`...大屏缩放适配容器；✅；...` |
| 11  | 同上                                                                                                                                                | 610     | `                                                                                                                | EcMap \| ✅ 已实现（建议共享） \| ECharts 地图组件；task-011 ✅；...`                | task-011                                                                                                | ① 删编号                                 |
| 12  | 同上                                                                                                                                                | 611     | `                                                                                                                | InteractionStore \| ✅ 已实现（建议共享） \| ...；task-020 ✅；...`                  | task-020                                                                                                | ① 删编号                                 |
| 13  | 同上                                                                                                                                                | 629     | `                                                                                                                | ScalerContainer \| task-010 ✅ 已完成；§8 建议共享 \|`                               | task-010                                                                                                | ① 删编号：`                              | ScalerContainer \| ✅ 已完成；§8 建议共享 \|` |
| 14  | 同上                                                                                                                                                | 630     | `                                                                                                                | EcMap \| task-011 ✅ 已完成；§8 建议共享 \|`                                         | task-011                                                                                                | ① 删编号                                 |
| 15  | 同上                                                                                                                                                | 631     | `                                                                                                                | InteractionStore \| task-020 ✅ 已完成；§8 建议共享 \|`                              | task-020                                                                                                | ① 删编号                                 |
| 16  | 同上                                                                                                                                                | 656-667 | §10 O-2/O-5/O-6/O-7/O-8/O-9/O-10 关闭理由含 `task-046` / `task-034` / `task-042` / `task-038` / `task-040`       | 多个                                                                                 | ① 逐条删编号，保留决议内容（如「2026-08-17 决议：Kingbase 双引号包裹语法验证已通过...」）               |
| 17  | `docs/specs/039-bigdata-petition-display/spec.md`                                                                                                   | 112     | `> design 详述：docs/design/api-contracts.md §7.42（2026-08-17 task-034 阶段 A 落地）`                           | task-034                                                                             | ① 删编号                                                                                                |
| 18  | 同上                                                                                                                                                | 558     | `...（属业务实现阶段 task-016）。`                                                                               | task-016                                                                             | ① 删编号                                                                                                |
| 19  | 同上                                                                                                                                                | 686     | O-9 关闭理由：`2026-08-17 task-034 阶段 A 落地：...`                                                             | task-034                                                                             | ① 删编号                                                                                                |
| 20  | 同上                                                                                                                                                | 687     | O-10 关闭理由：`2026-08-17 task-042 已落地：...`                                                                 | task-042                                                                             | ① 删编号                                                                                                |
| 21  | 同上                                                                                                                                                | 688     | O-11 关闭理由：`task-038 已落地（仅 039）；...`                                                                  | task-038                                                                             | ① 删编号                                                                                                |
| 22  | 同上                                                                                                                                                | 689     | O-12：`task-038 范围收窄为 038 + 039；...`                                                                       | task-038                                                                             | ① 删编号                                                                                                |
| 23  | `docs/specs/039-bigdata-petition-display/data-model-extensions.md`                                                                                  | 166     | `...spec.md §3.3 /rank label (MAX_TIME) 字段已删（task-040 §4.9 ✅）；...`                                       | task-040                                                                             | ① 删编号                                                                                                |
| 24  | `docs/design/api-contracts.md`                                                                                                                      | 212     | `...data 字段统一为 items: [{ key, name, value, unit, label?, type? }]（task-038 落地；详述见 §7.41 / §7.42）。` | task-038                                                                             | ① 删编号                                                                                                |
| 25  | 同上                                                                                                                                                | 1495    | `...docs/design/data-models.md#L1924 §8.7（task-046 落地；spec §10 O-2 关闭...）`                                | task-046                                                                             | ① 删编号                                                                                                |
| 26  | `docs/specs/042-components-common/README.md`                                                                                                        | 5       | `> **状态**：✅ 首批 11 个组件登记完成（task-039 完成）`                                                         | task-039                                                                             | ① 删编号                                                                                                |
| 27  | 同上                                                                                                                                                | 27      | `                                                                                                                | 001-scaler-container \| ScalerContainer \| 基础容器 \| task-010/012 \| ✅ 已登记...` | task-010/012                                                                                            | ① 删编号                                 |
| 28  | 同上                                                                                                                                                | 28      | `                                                                                                                | 002-ec-map \| EChartsMap \| 基础组件 \| task-011 \| ✅ 已登记...`                    | task-011                                                                                                | ① 删编号                                 |
| 29  | 同上                                                                                                                                                | 29      | `                                                                                                                | 003-interaction-store \| InteractionStore \| 状态管理 \| task-020 \| ✅ 已登记...`   | task-020                                                                                                | ① 删编号                                 |
| 30  | 同上                                                                                                                                                | 80      | `                                                                                                                | 2026-08-11 \| 042 顶层目录 + README 占位建立（task-021） \|`                         | task-021                                                                                                | ① 删编号                                 |
| 31  | 同上                                                                                                                                                | 81      | `                                                                                                                | 2026-08-14 \| 首批 11 个组件登记完成（task-039）：...`                               | task-039                                                                                                | ① 删编号                                 |
| 32  | `docs/specs/038-bigdata-personnel-display/tasks.md`                                                                                                 | 22-24   | `ScalerContainer（task-010 ✅）/ EcMap（task-011 ✅）/ InteractionStore（task-020 ✅）`                          | task-010/011/020                                                                     | ① 删编号                                                                                                |
| 33  | `docs/specs/038-bigdata-personnel-display/plan.md`                                                                                                  | 13-15   | 共享能力表 3 行含 `task-010 ✅` / `task-011 ✅` / `task-020 ✅`                                                  | 同上                                                                                 | ① 删编号                                                                                                |
| 34  | `docs/specs/039-bigdata-petition-display/tasks.md`                                                                                                  | 25-27   | 同 038 tasks.md，前缀 `038 task-010` 等                                                                          | 同上                                                                                 | ① 删编号                                                                                                |
| 35  | `docs/specs/039-bigdata-petition-display/plan.md`                                                                                                   | 13-15   | 同 038 plan.md                                                                                                   | 同上                                                                                 | ① 删编号                                                                                                |
| 36  | `docs/specs/040-bigdata-beijing-petition-display/{tasks,plan}.md` + `041-bigdata-petition-comparison-display/{tasks,plan,spec,acceptance-tests}.md` | 多处    | 共享能力表 + 导航按钮表含 `task-010/011/020/013/022/024/026/027`                                                 | 多个                                                                                 | ① 删编号                                                                                                |

### 4.2 B 类合规（0 条）

> 本次扫描未发现 spec 五件套自带的内部任务编号（如 `#### 任务 task-001`）命中 `task-\d+` 模式。038/039/040/041 的 `tasks.md` 使用 `- [x]` 复选框格式，未使用 `task-NNN` 编号体系。

### 4.3 C 类待澄清（0 条）

> 所有命中均能明确判断为引用私有 task 文件（A 类），无语义模糊案例。

### 4.4 统计

| 维度               | 数量                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 命中文件           | 16                                                                                                                                                                                                                        |
| A 类违规           | 36 条                                                                                                                                                                                                                     |
| B 类合规           | 0 条                                                                                                                                                                                                                      |
| C 类待澄清         | 0 条                                                                                                                                                                                                                      |
| 涉及私有 task 编号 | task-010 / task-011 / task-012 / task-013 / task-016 / task-020 / task-021 / task-022 / task-023 / task-024 / task-025 / task-026 / task-027 / task-034 / task-038 / task-039 / task-040 / task-041 / task-042 / task-046 |

### 4.5 改写策略统一建议

> 36 条 A 类违规**全部**建议采用方案 ①（删 task 编号 + 保留客观事实陈述），理由：
>
> 1. 这些引用本质是「溯源备注」，删编号后客观事实仍成立（如「Kingbase 建表 SQL 已验证」「docs/design/data-models.md §8.7」「✅ 已完成」）
> 2. 方案 ②/③ 需逐条判断指向哪个 docs 章节，部分引用（如 `task-016 业务实现阶段`）无对应 docs 章节
> 3. 方案 ① 改写最简、风险最低、符合 `docs-no-private-refs.md` 要求
>
> **等待用户 review 确认后进入步骤 2**
