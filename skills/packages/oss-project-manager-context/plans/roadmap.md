# roadmap.md

## R1 真源沉淀

- 状态：已完成（2026-11-19，归档 plans/done/2026-11/）
- 任务：`task-2026-11-19-001-source-truth-capture`
- 产出：`branches/develop/design/architecture.md` 补全、`branches/develop/design/modules/001~008` 六要素补齐、`branches/develop/references/` 5 份真源文档、`SKILL.md` Pointer Map 更新（2026-11-20 迁入 branches/develop/）
- 目的：让 AI/维护者仅读 skill 上下文即可完成需求评估与方案设计，不必重复逆向代码

## R2 网络割接需求技术分析

- 状态：已完成（2026-11-19，归档 plans/done/2026-11/，含子任务 002-01~04）
- 任务：`task-2026-11-19-002-network-appointment-optimization-tech-analysis`（父卡 + 4 子卡）
- 前置：R1 完成
- 产出：`pm/001-2026-03-27-network-appointment-optimization/technical-analysis.md`（英文文件名）
- ✅ fujian 基线复核完成（2026-11-20，task-004）：核心判定在 develop-fujian 上成立，读码细节已修订；真源落 `branches/fujian/`（自包含域，task-005）
- 目的：判定需求对本仓是「增强既有模块」还是「新建模块」，给出前端归属、方案要点与工作量分档

## R3 Pixso 原型提取（前置实施）

- 状态：待审批
- 任务：`task-2026-11-19-003-pixso-agent-requirements-spec`
- 前置：R2 完成
- 产出：`pm/001-2026-03-27-network-appointment-optimization/pixso-extraction-requirements.md`（面向 Pixso 智能体的提取要求 + 投喂指令）
- 目的：让外部智能体按我们的结构提取 21 张原型图信息，补齐 cutover-order「必须新写」部分的字段/交互细节
