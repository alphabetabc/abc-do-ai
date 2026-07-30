---
name: 'oss-visual-designer-docs-cross-review'
description: '针对 oss-visual-designer 项目的交叉 review skill：对 `.trae/documents/` 下的变更计划 / 调研 / 设计文档做深度交叉 review（三视角 + 对抗式交叉验证），专门检查设计器状态写路径契约与已删除 API 禁区。Invoke when user asks for doc review, cross review, or before executing any plan to ensure it can actually support development.'
version: '1.2.0'
date: '2026-07-30'
triggers:
  - 交叉 review
  - 深度 review
  - 审查计划/文档/方案
  - 帮我看看这个文档能不能支撑开发
---

# oss-visual-designer-docs-cross-review

对 oss-visual-designer 项目的 `.trae/documents/` 文档做深度交叉 review，目标是让文档**真的能支撑开发**（事实可验证 + 逻辑闭环 + 盲区排查，三者缺一不可）。

> 本 skill 自包含完整方法论 + 项目特化配置，可独立安装和运行。

---

## 1. 触发条件（When to Invoke）

- 用户说"review 这个计划/文档/方案"
- 用户说"交叉 review"、"深度 review"、"帮我看看这个文档能不能支撑开发"
- 用户准备执行某个 task-\*.md 前想做最后把关
- 用户对某份 research/ 或 design/ 文档的质量没把握

**不要用于**：纯代码 diff review（那是另一个 skill 的职责）；快速过一遍（本 skill 是深度 review，单次耗时较长；快速过一遍走第 6 节"降级规则：单视角快速通道"）。

---

## 2. 审查对象（项目特化）

本 skill 的审查对象是 `.trae/documents/` 下的文档，优先级：

1. **变更计划**：`.trae/documents/plans/task-*.md`（执行前最后把关）
2. **调研文档**：`.trae/documents/research/**/*.md`（事实性是否扎实）
3. **设计/架构文档**：`.trae/documents/design/**/*.md`（含 designer-canvas/ 子目录）
4. **元方案**：跨阶段的总计划（如 task-2026-07-27-001 单源重构元计划）

**不审查**：`AGENTS.md` / `.trae/rules/`（这些是规则源，不是被审查对象）；纯代码 diff（走代码 review，非本 skill 职责）；`.bak` 备份文件 / `src/store/backup/`（历史快照，非活代码）。

---

## 3. 核心原则（自包含，不外引）

本 skill 遵循以下原则，无需引用外部文档：

1. **事实优先**：所有结论必须本地可验证（通过仓库检索 / 文件读取 / 必要时运行验证当场确认），不能基于记忆/推测
2. **事实优先级**：仓库代码 > 运行验证（tsc/build/测试）> `.trae/documents/` 文档 > 模型记忆。冲突时以仓库代码为准
3. **禁止推测当结论**：无法用仓库代码验证的内容，只能标注"未验证假设"，不能作为结论输出
4. **review 与修改分离**：本 skill 只产出报告，不自动改被 review 的文档

---

## 4. Core Mechanism：三视角独立 Review + 对抗式交叉验证

Trae 主对话只有一个模型，但可以借助**当前环境支持的并行子任务 / subagent 能力**，让多个视角分别完成 review，再做一轮**对抗式交叉验证**。如果当前环境不支持并行 subagent，则退化为主对话按 A → B → C 顺序串行完成，最后再自行做一次交叉验证。

### 4.1 为什么是三视角 + 对抗式

- **单视角 review 的盲区**：架构师关注设计合理性，但可能漏掉调用方影响；测试工程师关注验证覆盖，但可能不深究性能；文档审查员关注完整性，但可能不验证事实
- **对抗式的价值**：第一轮 review 的结论可能是错的（subagent 也可能幻觉），需要第二轮交叉验证来确认
- **事实优先**：所有结论必须本地可验证，不能基于记忆/推测（见上方"核心原则"）

### 4.2 三视角定义

| 视角                    | 推荐执行方式                                            | 关注点                                                                                                  | 产出                           |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **A. 事实核查员**       | 优先用代码库检索能力较强的 subagent；没有就由主对话执行 | 文档里每个事实结论能否用仓库检索/文件读取当场验证？行号/路径/API 签名是否准确？是否有幻觉？             | 事实错误清单（带仓库验证证据） |
| **B. 架构与逻辑审查员** | 优先用通用推理型 subagent；没有就由主对话执行           | 背景→现状→目标→步骤→验证→风险→回退 的逻辑链是否闭环？决策是否自洽？方案是否可行？                       | 逻辑断点清单 + 决策质疑        |
| **C. 盲区排查员**       | 优先用代码库检索能力较强的 subagent；没有就由主对话执行 | 主动找未覆盖的文件/调用方/边界场景。关键 API 的所有调用方是否都被摸清？有没有漏掉的死代码/死字段/边界？ | 盲区清单（带检索证据）         |

### 4.3 对抗式交叉验证（第二轮）

三个 subagent 的产出汇总后，主对话做一轮交叉验证：

1. **A 的事实结论 vs B 的逻辑断点**：B 质疑的某点，A 是否有事实证据支持/反驳？
2. **C 的盲区 vs B 的方案**：C 发现的盲区，B 的方案是否已覆盖？
3. **A 的行号验证 vs C 的 grep 结果**：A 说"L123 是 X"，C grep 出来的实际调用方是否和 A 说的一致？
4. **降级规则**：任何 subagent 的结论如果无法用仓库代码验证，标注为"未验证假设"而非结论

### 4.4 执行能力映射（避免绑死工具名）

本 skill 依赖的是**能力**，不是某一套固定工具名。执行时请按当前环境做映射：

- **并行子任务能力**：能并行起多个 subagent 就并行；否则串行执行三视角
- **仓库检索能力**：可用 `rg`、代码搜索、grep 类能力定位调用方 / 路径 / API
- **文件读取能力**：可用编辑器读取、`Get-Content`、Read 类能力查看具体实现
- **结果汇总能力**：主对话统一做严重度分级与对抗式交叉验证

如果当前环境提供专门的代码库子代理，优先让视角 A / C 使用；视角 B 可以由主对话或通用推理型子代理执行。

---

## 5. How to Use

### 5.1 步骤 1：明确 review 范围

向用户确认：

1. 要 review 哪份文档（或哪几份）？
2. review 报告存到哪个路径？（用户每次指定；默认 `.local-review/r{N}.md`，其中 `N` 为 `.local-review/` 下下一个可用序号）
3. 是否有特别关注的点？（如"重点看性能预算是否合理"）

### 5.2 步骤 2：并行启动三个视角进行 review

优先使用**当前环境支持的并行 subagent 能力**一次性拉起 3 个视角（最大化并行）；如果环境不支持并行 subagent，就由主对话按 A → B → C 顺序执行。

```
视角 A（事实核查员）:
  - 读被 review 的文档
  - 提取每个事实结论（行号/路径/API/数字）
  - 用仓库检索 / 文件读取能力当场验证
  - 产出：事实错误清单（带证据）

视角 B（架构逻辑审查员）:
  - 读被 review 的文档
  - 检查逻辑链闭环、决策自洽、方案可行性
  - 产出：逻辑断点清单 + 决策质疑

视角 C（盲区排查员）:
  - 读被 review 的文档
  - 检索文档提到的所有 API/函数/字段的所有调用方
  - 对比文档声称的调用方清单是否完整
  - 产出：盲区清单（带检索证据）
```

**关键**：每个子任务的指令必须包含：

- 被 review 文档的绝对路径
- 该视角的具体检查清单（见第 7 节）
- 要求产出格式（带仓库证据，禁止推测当结论）
- 明确"不要修改任何文件，只做 review 产出"

### 5.3 步骤 3：主对话汇总 + 对抗式交叉验证

三个 subagent 返回后，主对话：

1. 汇总三份产出
2. 做对抗式交叉验证（见第 4.3 节）
3. 按严重程度分级：**高（必须修）/ 中（建议优化）/ 低（可选改进）**
4. 每条带：具体问题 + 仓库证据 + 修复建议

### 5.4 步骤 4：写 review 报告到用户指定路径

报告格式见第 8 节。

### 5.5 步骤 5：等用户确认是否修改

报告产出后**暂停**，等用户 review 报告并决定：

- 哪些条目要修
- 修改由谁做（用户自己改 / 主对话改 / 再起 subagent 改）

**不要自动修改被 review 的文档**——review 和修改必须分离，避免"自己改自己 review"。

---

## 6. 降级规则：单视角快速通道

三视角并行是默认模式，但以下场景**降级为单视角**，避免过度审查：

| 场景                        | 降级到                         | 理由                                     |
| --------------------------- | ------------------------------ | ---------------------------------------- |
| 文档 < 100 行的小 task      | 仅视角 A（事实核查）           | 小文档逻辑链短，主要风险是事实错误       |
| 纯调研文档（无步骤/无回退） | 视角 A + 视角 B（跳过 C 盲区） | 调研文档不涉及调用方影响，盲区排查收益低 |
| 用户明确说"快速过一遍"      | 仅视角 A                       | 用户已接受低严谨度                       |
| 紧急阻塞、用户要立刻决策    | 仅视角 B（架构逻辑）           | 时间紧时优先保逻辑闭环                   |

**降级时必须**在报告"总评"里标注"本次 review 降级为单视角 X，未做完整三视角交叉验证，结论严谨度相应降级"。

---

## 7. 各视角检查清单

### 7.1 视角 A：事实核查员

对文档里每个**事实性陈述**，用仓库检索 / 文件读取能力当场验证：

1. **行号验证**：文档说"utils.ts L690-L749 是 mergeByIdIntoTree"——实际读 utils.ts L690-L749，确认是不是这个函数
2. **路径验证**：文档引用的文件路径是否存在？
3. **API 签名验证**：文档说"`useFieldConf(uniqueId)` 订阅 `byId[id]`"——读 hooks.ts 实际实现，确认签名和订阅目标
4. **数字验证**：文档说"440 组件 1-2ms"——这个数字的来源是哪里？文档记录还是实测？是否能找到出处
5. **调用方清单验证**：文档说"15 个调用方"——grep 这个 API，实际命中几个文件？
6. **死代码验证**：文档说"X 是死代码无调用方"——grep X，确认是否真的 0 调用方
7. **状态/字段验证**：文档说"undo/redo 是死字段"——grep undo/redo，确认是否真的无 action 读写

**禁止**：把文档自己的陈述当成事实来源——必须用仓库代码验证。

### 7.2 视角 B：架构与逻辑审查员

检查文档的**逻辑链和决策自洽性**：

1. **背景→现状→目标 链条**：背景说的问题，现状是否真的存在？目标是否真的解决问题？
2. **决策矩阵自洽**：每个决策的"倾向 A/B"是否和理由一致？有没有"倾向 A 但理由支持 B"的矛盾？
3. **步骤可执行性**：步骤是否能独立 commit + 回退？步骤间依赖是否标注？有没有"步骤 X 依赖步骤 Y 但 Y 在 X 后面"的顺序错误？
4. **风险覆盖**：识别的风险是否都有缓解措施？有没有"识别了风险但没给缓解"的悬空风险？
5. **验证完整性**：验证方案是否覆盖所有改动点？有没有"改了 X 但验证清单里没 X"的遗漏？
6. **回退方案**：每个步骤的 git revert 路径是否真的能回退？有没有"步骤 X 和 Y 改了同一文件，revert X 会破坏 Y"的冲突？
7. **契约一致性**：参见第 9.3 节"项目特化契约检查清单"——结构性变更走 `setComponents`，字段级走 `updateFieldConfig`；禁止引入已删除的 API（如 `useDesigner` / `getFieldConf` / `DesignerContext`）
8. **反例与边界测试**（嫁接自 design-reviewer 维度）：针对文档中的 API/函数/流程，强制找至少 **3 个恶意/异常输入场景**（空值、超大并发、权限越权、状态悬挂）。检查文档是否明确了这些场景下的系统行为（报错？降级？重试？）。未覆盖 → 标记**【高影响漏洞】**
9. **假设显式化**（嫁接自 design-reviewer 维度）：扫描文档中的模糊描述（"通常"、"一般"、"预期"、"依赖外部"），转为显式假设表：

   | ID  | 假设内容                 | 风险等级 | 是否已验证   |
   | --- | ------------------------ | -------- | ------------ |
   | A1  | 假设数据库连接池不会耗尽 | 高       | ❌（无证据） |

   交叉比对仓库代码：假设中提到的版本号或组件是否与现有依赖冲突？

10. **可测试性审查**（嫁接自 design-reviewer 维度）：仅凭这份文档，测试工程师能否写出完整测试用例？输出明确的**测试覆盖缺口清单**，例如：
    - [ ] 缺少并发场景的模拟方案
    - [ ] 缺少外部依赖 Mock 的契约定义
    - [ ] 缺少状态机异常分支的验证

### 7.3 视角 C：盲区排查员

主动找文档**没覆盖的东西**：

1. **调用方完整性**：文档说"updateFieldConfig 有 15 个调用方"——grep `updateFieldConfig\|useUpdateFieldConfig`，实际命中几个文件？文档表格是否漏了某些文件？
2. **相关 API 未被提及**：文档讨论 byId，但 grep `byId` 出现的文件里，有没有文档完全没提的？
3. **死代码/死字段遗漏**：文档说"skip 机制是死代码"——还有没有其他类似的死代码（如 patchFieldConf）文档没提到？
4. **边界场景遗漏**：文档讨论了拖拽/对齐/成组，还有没有其他交互场景（如复制/粘贴/撤销/导入配置）没被讨论？
5. **文档间引用一致性**：文档 A 引用文档 B 的 §X.Y，B 里是否真的有这个章节？内容是否一致？
6. **备份文件/历史遗留**：grep `.bak`，有没有备份文件没被清理？
7. **跨目录影响**：改 src/store/ 的东西，是否影响 packages/\* 或 src/pages/preview/？
8. **项目特化盲区检查点**：参见第 9.4 节

---

## 8. Report Format

```markdown
# {被 review 文档名} 交叉 review

> Reviewer：oss-visual-designer-docs-cross-review skill（三视角 + 对抗式交叉验证） Review 日期：{YYYY-MM-DD} Review 对象：`{文档路径}` 项目特化检查：已应用 §9 Project-Specific Config 事实依据：{列出 subagent 用的 Grep/Read 证据来源}

---

## 0. 总评

**评级：{A / B+ / B / C}（{一句话总评}）**

**整体判断**：{2-3 句话概述文档质量、主要优点、主要问题}

按漏洞严重程度分 3 档列出（高 / 中 / 低），每条带具体修复建议。

---

## 1. 必须修复（高优先级）

### 1.1 [高] {问题标题}

**事实**：{subagent 发现的问题，带仓库证据}

**风险**：{如果不修会怎样}

**修复建议**：{具体怎么改}

**验证视角**：{A 事实核查 / B 架构逻辑 / C 盲区排查 / 交叉验证}

---

## 2. 建议优化（中优先级）

（同上格式）

---

## 3. 可选改进（低优先级）

（同上格式）

---

## 4. 关键事实补充（独立验证）

{列出 subagent 独立验证的事实，与文档陈述对照}

---

## 5. 总结

### 5.1 必须修

### 5.2 建议优化

### 5.3 可选改进

### 5.4 可以进入下一阶段吗？

**{可以 / 不可以}**，理由：{...}
```

---

## 9. Project-Specific Config（项目特化配置）

本章节是 oss-visual-designer 项目专属的检查配置，由本 skill §7.2 第 7 条"契约一致性"与 §7.3 第 8 条"项目特化盲区"引用。下面提到的文档路径，默认都是**安装到目标项目后的运行态路径**。修改本章节前请先核对目标项目中的 `.trae/documents/design/designer-canvas/06-principles.md` 与 `.trae/documents/design/designer-canvas/02-write-path.md`。

### 9.1 审查对象路径覆盖

| 类型          | 项目特化路径                                                              | 优先级 |
| ------------- | ------------------------------------------------------------------------- | ------ |
| 变更计划      | `.trae/documents/plans/task-*.md`                                         | 高     |
| 元方案        | `.trae/documents/plans/{YYYY-MM-DD}-handoff-*.md` / `task-*-meta-plan.md` | 高     |
| 调研文档      | `.trae/documents/research/**/*.md`                                        | 中     |
| 设计/架构文档 | `.trae/documents/design/**/*.md`（含 `designer-canvas/` 子目录）          | 中     |

### 9.2 不审查清单（项目特化）

- `AGENTS.md` / `.trae/rules/`：规则源，非被审查对象
- 纯代码 diff：走代码 review，非本 skill 职责
- `*.bak` / `src/store/backup/`：历史快照，非活代码（grep 时排除，见 AGENTS.md §10.2）
- `src/packages/`（注意与根 `packages/` workspace 子包区别）：本地物料包目录，仅当文档显式涉及才纳入

### 9.3 项目特化契约检查清单（注入视角 B 第 7 条）

执行 review 时，负责该视角的执行者必须按以下契约清单核查：

1. **状态写路径契约**（来源：`designer-canvas/02-write-path.md`）
   - ✅ 结构性变更（拖拽/成组/重组/树结构变化）必须走 `dispatch(setComponents(newTree))`
   - ✅ 字段级 O(1) 更新（单字段 patch）必须走 `dispatch(updateFieldConfig(id, patch))`
   - ❌ 禁止直接 mutation `state.components`（Immer frozen，违反会抛 `TypeError: Cannot assign to read only property`）

2. **已删除 API 禁区**（来源：`designer-canvas/06-principles.md` §禁区清单）
   - ❌ `useDesigner` / `DesignerContext` / `DesignerContext.Provider` / `DataProvider` 闭包（task-011 已删）
   - ❌ `useDesignerSettingChange` / `runtimeComponentsTrigger`（EventBus 已删）
   - ❌ `getFieldConf` / `getParent`（O(n) 工具函数已删，改用 `getFieldNodeById` 或 `useFieldConf`）
   - ❌ `useDebounceMergeConfig`（task-008 已删）
   - ❌ `useLevelPath` / `setLevelPath` 永久放弃语义（task-007 引入，新代码禁用）

3. **Redux Action 模式契约**（来源：AGENTS.md §4.4 混合模式）
   - 老 slice（`designerCanvas` / `component` / `app`）：字符串 `action.type` + `switch`
   - 新 slice（`viewCanvas` / `viewUI`）：RTK `createSlice` + typed action creator
   - 新增 slice 优先用 `createSlice`，但不得把现有老 slice 强制改 `createSlice`（避免大爆炸）

4. **路径别名契约**（来源：AGENTS.md §4.2）
   - ✅ `import xxx from '@Src/xxx'`（主源码）/ `'@Common/xxx'` / `'@Components/xxx'`
   - ❌ 禁止 `@Configs/*`（死别名，`src/configs/` 不存在）
   - ❌ 禁止用相对路径 `../../../` 跨多个目录

5. **工具用完即留契约**（来源：`.trae/rules/项目规则.md` §6）
   - ❌ 禁止创建 `context-scanner.js` 之类持久化脚本生成 `project-context.json`（产生规则双源）
   - ❌ 禁止用 PowerShell `Set-Content` / `Get-Content` 修改含中文文件（破坏 UTF-8）
   - 脚本读写文件必须显式 `utf-8` 编码

### 9.4 项目特化盲区检查点（注入视角 C 第 8 条）

执行 review 时，负责该视角的执行者必须主动 grep 检查：

| 关键词                                              | 期望场景                        | 盲区识别模式                                                                                                |
| --------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `useFieldConf\|useUpdateFieldConfig`                | 所有字段级订阅必须走这两个 hook | grep 出现 `useDesigner\|DesignerContext\|useDesignerSettingChange` 等已删除 API → 标记**【已删 API 残留】** |
| `setComponents\|updateFieldConfig`                  | 写路径只有这两条                | grep 出现 `dispatch.*setState\|dispatch.*setDesignerCanvasState(.*newTree)` → 检查是否符合写路径契约        |
| `byId\|parentMap`                                   | 派生索引                        | grep 出现 `byId\.\w+\s*=`（直接赋值） → 标记**【直接 mutation byId】**                                      |
| `mergeByIdIntoTree\|fieldPreserve\|dirtyConfigKeys` | byId/树合并机制                 | grep 出现 → 标记 task-2026-07-27-001 单源重构 in-progress，需确认是否会被新方案替代                         |
| `\.bak\|/backup/`                                   | 备份文件                        | grep 命中 → 标记**【备份文件残留】**（AGENTS.md §10.2 已规定不参考其实现）                                  |
| `useFieldNodeById\|getFieldNodeById`                | task-012-a 新增                 | grep 出现 `getFieldConf\|getParent` → 标记**【已删 API 残留】**                                             |
| `cloneDeep`                                         | 不可变改造前残留                | grep `cloneDeep` 在 src/designer/ 出现 → 标记**【可能存在 mutation 残留】**（task-009/012 落地情况）        |
| `setLevelPath\|useLevelPath`                        | task-007 放弃语义               | grep 出现 → 标记**【放弃语义 API 残留】**                                                                   |
| `useOnDrop`                                         | 已知 mutation 残留（2 行）      | grep `state\.components\.\w+\.\w+\s*=` 在该文件 → 标记**【直接 mutation 残留】**                            |

### 9.5 性能红线检查（项目特化）

- **440 组件场景**：所有涉及画布渲染 / dispatch 频率的改动，必须考虑 440 组件场景下的性能影响（来源：`designer-canvas/01-data-model.md` §buildIndex 性能）
- **`useFieldConf` 订阅粒度**：禁止把整个 `state.components` 作为 `useSelector` 入参（导致全量订阅）
- **画布组件必须 `React.memo`**（来源：AGENTS.md §4.5）

### 9.6 报告存放路径

默认：`.local-review/r{N}.md`（`N` 为 `.local-review/` 下下一个可用序号）。用户可显式指定其他路径。

### 9.7 持久化产物约束

- ❌ 禁止在 review 过程中创建 `project-context.json` / `codebase-summary.md` 等持久化产物（违反"工具用完即留"）
- ✅ 只产出 review 报告 + 必要时在 task 文档的"实施记录"章节追加发现

---

## 10. 重要约束

1. **review 和修改分离**：本 skill 只产出 review 报告，不自动修改被 review 的文档。修改由用户确认后再做。
2. **禁止推测当结论**：任一视角产出的结论都必须带仓库证据（如检索命中、文件行号、运行验证结果）。无法验证的标注"未验证假设"。
3. **报告路径**：默认存到 `.local-review/r{N}.md`（`N` 为 `.local-review/` 下下一个可用序号）。用户可显式指定其他路径。
4. **不引用 review 报告本身**：如果基于本 skill 的报告修改文档，修改时不要写"根据 review 报告第 X 条"——把结论内化到文档里。
5. **并行启动 subagent**：若当前环境支持并行 subagent，三个视角应尽量在单条消息里并行启动；若不支持，则按第 6 节降级或串行执行。
6. **执行 review 时不改文件**：分配给任一视角的指令里都要明确写清"只做 review 产出，不要修改任何文件"。
7. **不依赖外部脚本**：本 skill 不引入 `context-scanner.js` 之类的脚本生成 `project-context.json`——Trae 原生的仓库检索 / 文件读取能力已能当场验证，引入脚本会产生持久化产物违反"工具用完即留"原则，且产生规则双源。

---

## 11. 使用示例

用户："帮我 review 一下阶段2-目标架构设计.md，报告存到 .local-review/oss-docs-review.md"

主对话：

1. 确认 review 对象：`.trae/documents/research/refactor-single-source/阶段2-目标架构设计.md`
2. 确认报告路径：`.local-review/oss-docs-review.md`
3. 判断是否降级：该文档是架构设计文档且篇幅较大 → 不降级，走完整三视角
4. 用当前环境支持的并行 subagent 能力启动 3 个视角（A 事实核查 / B 架构逻辑 / C 盲区排查），指令中显式提示"参考本 skill §9 Project-Specific Config 注入项目特化检查项"
5. 三个 subagent 返回后，主对话汇总 + 对抗式交叉验证
6. 写报告到 `.local-review/oss-docs-review.md`
7. 暂停，等用户确认哪些条目要修
