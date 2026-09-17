# Roadmap（任务路线图）

> 2026-09-16 自 `.trae/skills/oss-visual-designer-project-context/plans/roadmap.md` 迁入，历史流水全量保留；维护节奏 free（按需，任务驱动）。
>
> 所有正式任务的索引入口，按编号倒序排列。
> 状态：`planning` / `in-progress` / `done` / `blocked` / `cancelled`
>
> **维护规则**：
> - 新任务在 `plans/` 根目录创建 `task-YYYY-MM-DD-NNN-{topic}.md`，并在本表追加一行
> - 完成后把 task 文件移到 `plans/done/`，并把下表状态改为 `done`，填完成日期
> - 失败/取消的任务保留在根目录，状态置为 `blocked` / `cancelled`
> - **未正式立项的想法/灵感不要写在这里**，写到 [backlog.md](./backlog.md)

---

## 索引表

| 编号 | 标题 | 状态 | 类型 | 创建日期 | 完成日期 | 文档 |
| --- | --- | --- | --- | --- | --- | --- |
| task-2026-09-16-003 | src 能力入口遍历盘点与差距矩阵（designer-app 演进 Phase 0 事实账本） | done | docs（调研盘点） | 2026-09-16 | 2026-09-17 | [task-2026-09-16-003-src-capability-inventory.md](./done/task-2026-09-16-003-src-capability-inventory.md) |
| task-2026-09-16-002 | designer-app 演进方案（另起炉灶 + 物料兼容协议，5 阶段路线） | done | docs（方案设计） | 2026-09-16 | 2026-09-16 | [task-2026-09-16-002-designer-app-evolution-plan.md](./done/task-2026-09-16-002-designer-app-evolution-plan.md) |
| task-2026-09-16-001 | src 能力域总览文档（design/src/能力域总览.md，六大能力域 + hox vs Redux 边界） | done | docs | 2026-09-16 | 2026-09-16 | [task-2026-09-16-001-src-capability-overview.md](./done/task-2026-09-16-001-src-capability-overview.md) |
| task-2026-08-07-002-5 | realtime-data-flow 调用方迁移 + 死代码清理 + 验证（task-002 子任务，src/ 不动 → done 归档） | done | refactor + test | 2026-08-07 | 2026-08-10 | [task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md](./done/task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md) |
| task-2026-08-07-002-4 | realtime-data-flow 单元测试 25 用例（task-002 子任务） | done | test | 2026-08-07 | 2026-08-10 | [task-2026-08-07-002-4-realtime-data-flow-tests.md](./done/task-2026-08-07-002-4-realtime-data-flow-tests.md) |
| task-2026-08-07-002-3 | realtime-data-flow create-designer + plugin-registry + view/plugin 字段保留（task-002 子任务） | done | feature | 2026-08-07 | 2026-08-10 | [task-2026-08-07-002-3-realtime-data-flow-registration.md](./done/task-2026-08-07-002-3-realtime-data-flow-registration.md) |
| task-2026-08-07-002-2 | realtime-data-flow plugin.ts 实现 + barrel + 顶层导出（task-002 子任务） | done | feature | 2026-08-07 | 2026-08-07 | [task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md](./done/task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md) |
| task-2026-08-07-002-1 | realtime-data-flow 类型定义（task-002 子任务） | done | feature | 2026-08-07 | 2026-08-07 | [task-2026-08-07-002-1-realtime-data-flow-types.md](./done/task-2026-08-07-002-1-realtime-data-flow-types.md) |
| task-2026-08-07-004 | designer-plugins 改名 + selected 放入 viewUI（layer-ops → layer-management） | done | refactor | 2026-08-07 | 2026-08-10 | [task-2026-08-07-004-designer-plugins-rename-and-selected.md](./done/task-2026-08-07-004-designer-plugins-rename-and-selected.md) |
| task-2026-08-07-003 | designer-plugins createInteractionPlugin（事件订阅 + 派发） | done | feature | 2026-08-07 | 2026-08-10 | [task-2026-08-07-003-designer-plugins-interaction.md](./done/task-2026-08-07-003-designer-plugins-interaction.md) |
| task-2026-08-07-002 | designer-plugins createRealtimeDataFlowPlugin（组件间数据流转） | done | feature | 2026-08-07 | 2026-08-10 | [task-2026-08-07-002-designer-plugins-realtime-data-flow.md](./done/task-2026-08-07-002-designer-plugins-realtime-data-flow.md) |
| task-2026-08-07-001 | designer-plugins createDataFetcherPlugin（数据请求 + 全局数据集） | done | feature | 2026-08-07 | 2026-08-07 | [task-2026-08-07-001-designer-plugins-data-fetcher.md](./done/task-2026-08-07-001-designer-plugins-data-fetcher.md) |
| task-2026-08-06-006 | designer-plugins 插件组装方式重构（方案 B 聚合入口 + 可拔插） | done | refactor | 2026-08-06 | 2026-08-07 | [task-2026-08-06-006-designer-plugins-plugin-registry.md](./done/task-2026-08-06-006-designer-plugins-plugin-registry.md) |
| task-2026-08-06-005 | designer-plugins createGroupManagementPlugin（group/splitGroup + 组尺寸重算） | done | feature | 2026-08-06 | 2026-08-07 | [task-2026-08-06-005-designer-plugins-group-management.md](./done/task-2026-08-06-005-designer-plugins-group-management.md) |
| task-2026-08-06-004 | designer-plugins createLayerOpsPlugin — move + copy + delete（结构性变更，走 setTree） | done | feature | 2026-08-06 | 2026-08-07 | [task-2026-08-06-004-designer-plugins-layer-ops-move-copy-delete.md](./done/task-2026-08-06-004-designer-plugins-layer-ops-move-copy-delete.md) |
| task-2026-08-06-003 | designer-plugins createLayerOpsPlugin — lock/unlock + show/hide（字段级更新，走 updateNode） | done | feature | 2026-08-06 | 2026-08-06 | [task-2026-08-06-003-designer-plugins-layer-ops-lock-show.md](./done/task-2026-08-06-003-designer-plugins-layer-ops-lock-show.md) |
| task-2026-08-06-002 | designer-plugins createViewPlugin（viewCanvas/viewUI → extra，17 个细粒度 hooks = 16 读 + 1 写） | done | feature | 2026-08-06 | 2026-08-06 | [task-2026-08-06-002-designer-plugins-create-view-plugin.md](./done/task-2026-08-06-002-designer-plugins-create-view-plugin.md) |
| task-2026-08-06-001 | designer-plugins 包骨架 + 业务类型预设（WidgetData/DesignerExtra + 预设 createDesigner） | done | feature | 2026-08-06 | 2026-08-06 | [task-2026-08-06-001-designer-plugins-bootstrap.md](./done/task-2026-08-06-001-designer-plugins-bootstrap.md) |
| task-2026-08-05-005 | designer-core `useTree` equalityFn 文档修正（shallowEqual 行为说明 + 消费者使用建议） | done | docs | 2026-08-05 | 2026-08-06 | [task-2026-08-05-005-designer-core-usetree-equalityfn-doc.md](./done/task-2026-08-05-005-designer-core-usetree-equalityfn-doc.md) |
| task-2026-08-05-004 | designer-core 文档盲点补充（选中/拖拽决策 + undo/redo 备忘 + iframe 边界 + data 引用生命周期） | done | docs | 2026-08-05 | 2026-08-06 | [task-2026-08-05-004-designer-core-doc-blind-spots.md](./done/task-2026-08-05-004-designer-core-doc-blind-spots.md) |
| task-2026-08-05-003 | designer-core `PluginContext` 补充 `updateNode`（插件可做字段级更新） | done | refactor | 2026-08-05 | 2026-08-06 | [task-2026-08-05-003-designer-core-plugin-context-update-node.md](./done/task-2026-08-05-003-designer-core-plugin-context-update-node.md) |
| task-2026-08-05-002 | designer-core `config` 业务耦合解耦（deepMergeKeys 可配置） | done | refactor | 2026-08-05 | 2026-08-06 | [task-2026-08-05-002-designer-core-deep-merge-keys.md](./done/task-2026-08-05-002-designer-core-deep-merge-keys.md) |
| task-2026-08-05-001 | designer-core 设计文档与代码漂移修正（8 项漂移 + 6 项文档滞后） | done | docs | 2026-08-05 | 2026-08-05 | [task-2026-08-05-001-designer-core-doc-drift-fix.md](./done/task-2026-08-05-001-designer-core-doc-drift-fix.md) |
| task-2026-08-04-001 | designer-core 框架集成测试（createDesigner + hooks + 写路径 + 4 类插件端到端链路） | done | test | 2026-08-04 | 2026-08-05 | [task-2026-08-04-001-designer-core-integration-test.md](./done/task-2026-08-04-001-designer-core-integration-test.md) |
| task-2026-08-03-004 | designer-core src 目录优化（core/store + core/utils + react 分层） | done | refactor | 2026-08-03 | 2026-08-03 | [task-2026-08-03-004-designer-core-src-organization.md](./done/task-2026-08-03-004-designer-core-src-organization.md) |
| task-2026-08-03-003 | designer-core 结构操作抽离（generatorGroup/splitGroup/deleteFieldByUniqueId/getSelectedKeys） | done | refactor | 2026-08-03 | 2026-08-03 | [task-2026-08-03-003-designer-core-structure-ops-extraction.md](./done/task-2026-08-03-003-designer-core-structure-ops-extraction.md) |
| task-2026-08-03-002 | designer-core 组尺寸重算抽离（getGroupSizePosition/resetChildrenPosition/syncGroupSize2Children/mergeFieldConfig + createRecalcGroupBounds 工厂） | done | refactor | 2026-08-03 | 2026-08-03 | [task-2026-08-03-002-designer-core-group-bounds-extraction.md](./done/task-2026-08-03-002-designer-core-group-bounds-extraction.md) |
| task-2026-08-03-001 | designer-core 树遍历工具抽离（flatDesignerList/eachTreeNode/fieldVisitor/orderBy/setLevelPath） | done | refactor | 2026-08-03 | 2026-08-03 | [task-2026-08-03-001-designer-core-tree-utils-extraction.md](./done/task-2026-08-03-001-designer-core-tree-utils-extraction.md) |
| task-2026-07-31-004 | designer-core 代码质量小改（buildIndex as 断言 / 日志级别 / cleanup 反序 / updateNodeImmutable 导出决策） | done | refactor | 2026-07-31 | 2026-07-31 | [task-2026-07-31-004-designer-core-code-cleanup.md](./done/task-2026-07-31-004-designer-core-code-cleanup.md) |
| task-2026-07-31-003 | designer-core 测试补充（useTree/useFlatTree 单元测试 / setPartialState 含 components 不可变验证 / 迁移 reducer 测试） | done | test | 2026-07-31 | 2026-07-31 | [task-2026-07-31-003-designer-core-test-supplement.md](./done/task-2026-07-31-003-designer-core-test-supplement.md) |
| task-2026-07-31-002 | designer-core 设计文档与代码注释同步（Plugin TExtra / subscribe 双参数 / getInitialState / useFlatTree flatten / README 示例） | done | docs | 2026-07-31 | 2026-07-31 | [task-2026-07-31-002-designer-core-docs-sync.md](./done/task-2026-07-31-002-designer-core-docs-sync.md) |
| task-2026-07-31-001 | designer-core 框架优化（基于 4 份 review 报告，修复 useLatestState 竞态/hooks 重复/泛型缺失/devFreeze/setState 命名/性能基线/文档命名同步） | done | refactor + enhancement | 2026-07-31 | 2026-07-31 | [task-2026-07-31-001-designer-core-optimization.md](./done/task-2026-07-31-001-designer-core-optimization.md) |
| task-2026-07-30-001 | designer-core 框架封装（Zustand + Plugin，文档先行，当前项目为验证载体，packages-next/designer-core/） | done | feature + research | 2026-07-30 | 2026-07-31 | [task-2026-07-30-001-designer-core-framework.md](./done/task-2026-07-30-001-designer-core-framework.md) |
| task-2026-07-29-007 | designer-state 文档群基于源码事实重写（9 份→8 份，合并 01+02 / 拆 05 并入 02+03 / 拆 07→04+05 / 精简 00 / AGENTS.md 引用更新） | done | chore | 2026-07-29 | 2026-07-29 | [task-2026-07-29-007-designer-canvas-state-docs-fact-rewrite.md](./done/task-2026-07-29-007-designer-canvas-state-docs-fact-rewrite.md) |
| task-2026-07-29-006 | designer-canvas 文档群结构重构（新建 designer-canvas-state 目录，去历史化重写） | done | chore | 2026-07-29 | 2026-07-29 | [task-2026-07-29-006-designer-canvas-docs-restructure.md](./done/task-2026-07-29-006-designer-canvas-docs-restructure.md) |
| task-2026-07-29-005 | 修复 globalResponse 存入 Error 实例导致 Redux serializableCheck 告警 | done | bugfix | 2026-07-29 | 2026-07-29 | [task-2026-07-29-005-fix-global-response-non-serializable.md](./done/task-2026-07-29-005-fix-global-response-non-serializable.md) |
| task-2026-07-29-004 | 清理 .bak 备份文件（用户决定保留，取消） | cancelled | chore | 2026-07-29 | 2026-07-28 | [task-2026-07-29-004-cleanup-bak-files.md](./done/task-2026-07-29-004-cleanup-bak-files.md)（⚠️ 用户决定 .bak 文件永久保留，本任务不再推进） |
| task-2026-07-29-003 | 文档 + 注释 + dev-only 收尾（utils.ts dead code 注释 / DesignerContent 双源描述 / 02-write-path §4 迁移 research / reducer dev-only console.warn / AGENTS.md §10.2 引用 §12） | cancelled | chore | 2026-07-29 | 2026-07-29 | [done/task-2026-07-29-003-docs-and-deadcode-cleanup.md](./done/task-2026-07-29-003-docs-and-deadcode-cleanup.md)（⚠️ review 后取消：5 项中 3 项已在 task-002/003 主重构时完成；剩余 2 项低价值零散收尾，记到 backlog.md） |
| task-2026-07-29-002 | 工具函数 store.getState().byId 改为 getFieldNodeById（架构债务清偿，setChildren2LayoutBlock / recalcGroupBounds 等） | cancelled | refactor | 2026-07-29 | 2026-07-29 | [task-2026-07-29-002-refactor-byid-to-getfieldnodebyid.md](./done/task-2026-07-29-002-refactor-byid-to-getfieldnodebyid.md)（⚠️ review 后取消：立论与 06-principles/03-read-path 冲突，byId 是合规读路径；目标函数已重构；残留 7 处 5 处合规） |
| task-2026-07-29-001 | vitest 单元 + 集成测试（基于单源架构，合并重写原 task-012-4/012-5/019 §2.2） | done | test | 2026-07-29 | 2026-07-29 | [done/task-2026-07-29-001-vitest-unit-reducer-single-source.md](./done/task-2026-07-29-001-vitest-unit-reducer-single-source.md) |
| task-2026-07-28-008 | 审计 useMemo 依赖完整性（Bug #3 task-2026-07-28-008 揭示盲区系统性排查） | done | refactor + chore | 2026-07-28 | 2026-07-29 | [done/task-2026-07-28-008-audit-usememo-deps.md](./done/task-2026-07-28-008-audit-usememo-deps.md) |
| task-2026-07-28-007 | 修复 Bug #2：tree 拖拽节点入组/出组后组尺寸不更新（known-bugs #25） | done | bugfix | 2026-07-28 | 2026-07-29 | [done/task-2026-07-28-007-fix-tree-drop-group-recalc.md](./done/task-2026-07-28-007-fix-tree-drop-group-recalc.md) |
| task-2026-07-28-006 | 修复 Bug #1：layout-block onResize 子组件不级联缩放（known-bugs #24） | done | bugfix | 2026-07-28 | 2026-07-28 | [done/task-2026-07-28-006-fix-onresize-cascade.md](./done/task-2026-07-28-006-fix-onresize-cascade.md) |
| task-2026-07-28-005 | 恢复 verify-immer-ref3.mjs 验证脚本（task-002 步骤 2 引用证据找回） | done | chore | 2026-07-28 | 2026-07-28 | [done/task-2026-07-28-005-restore-verify-immer-ref3.md](./done/task-2026-07-28-005-restore-verify-immer-ref3.md) |
| task-2026-07-28-004 | 单源重构（4/4）— 文档更新 + 全量验证（8 份文档重写 + 全量冒烟 + 性能验证 + 归档） | done | docs + test | 2026-07-28 | 2026-07-28 | [task-2026-07-28-004-single-source-refactor-docs-verify.md](./done/task-2026-07-28-004-single-source-refactor-docs-verify.md) |
| task-2026-07-28-003 | 单源重构（3/4）— 死代码清理 + 保存路径（删 mergeByIdIntoTree + dirtyConfigKeys + skip 机制 + 4 死函数 + undo/redo 死字段） | done | refactor + chore | 2026-07-28 | 2026-07-28 | [task-2026-07-28-003-single-source-refactor-cleanup-save.md](./done/task-2026-07-28-003-single-source-refactor-cleanup-save.md) |
| task-2026-07-28-002 | 单源重构（2/4）— 单源 reducer 改造（updateFieldConfig/setComponents/setState + 简化 recalcGroupBounds） | done | refactor | 2026-07-28 | 2026-07-28 | [task-2026-07-28-002-single-source-refactor-reducer.md](./done/task-2026-07-28-002-single-source-refactor-reducer.md) |
| task-2026-07-28-001 | 单源重构（1/4）— mutation 清理 + 基础设施（syncLayoutBlockSize2Children + drag2layoutBlock + useOnDrop + 性能基线） | done | refactor + chore | 2026-07-28 | 2026-07-28 | [task-2026-07-28-001-single-source-refactor-mutation-cleanup.md](./done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md) |
| task-2026-07-27-001 | 单源重构元计划（6 阶段：摸清现状→定义目标→差距分析→详细步骤→验证方案→定稿） | done | research | 2026-07-24 | 2026-07-28 | [task-2026-07-27-001-single-source-refactor-meta-plan.md](./done/task-2026-07-27-001-single-source-refactor-meta-plan.md) |
| task-2026-07-24-016 | 清理 8 处 mutation 残留 + cloneDeep 滥用 | done | refactor | 2026-07-24 | 2026-07-28 | [done/task-2026-07-24-016-audit-cloneDeep-mutations.md](./done/task-2026-07-24-016-audit-cloneDeep-mutations.md)（⚠️ 已被 [task-2026-07-28-001](./done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md) 承接） |
| task-2026-07-24-015 | stale tree 防御性读取统一封装（safeRead* 工具函数） | done | refactor | 2026-07-24 | 2026-07-28 | [done/task-2026-07-24-015-stale-tree-defensive-reading.md](./done/task-2026-07-24-015-stale-tree-defensive-reading.md)（⚠️ 被单源架构根本消除，不再需要） |
| task-2026-07-24-012-5 | vitest 集成不变量测试（多步 dispatch 序列，覆盖 task-012-1/012-2/012-3 修复） | done | test | 2026-07-24 | 2026-07-28 | [done/task-2026-07-24-012-5-vitest-integration.md](./done/task-2026-07-24-012-5-vitest-integration.md)（⚠️ 已被 [task-2026-07-29-001](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 替代） |
| task-2026-07-24-012-4 | vitest 纯函数 + reducer 单元测试（mergeByIdIntoTree 三方向 + reducer 三 action） | done | test | 2026-07-24 | 2026-07-28 | [done/task-2026-07-24-012-4-vitest-unit-reducer.md](./done/task-2026-07-24-012-4-vitest-unit-reducer.md)（⚠️ 已被 [task-2026-07-29-001](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 替代） |
| task-2026-07-24-012-1-manual-fix | 手动修复：组位置移动后保存丢失 + 组内对齐组位置乱动 + fieldPreserve 局限性 | done | bugfix | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-012-1-manual-fix.md](./done/task-2026-07-24-012-1-manual-fix.md) |
| task-2026-07-24-017-a-research-link-wording | designer-canvas 目录：7 处 research 链接措辞调整（标注"探索性调研，非权威事实"） | done | chore | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-017-a-research-link-wording.md](./done/task-2026-07-24-017-a-research-link-wording.md) |
| task-2026-07-24-017-b-persistence-strategy-facts-sink | designer-canvas 目录：持久化策略下沉为事实（01-data-model.md §6） | done | chore | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-017-b-persistence-strategy-facts-sink.md](./done/task-2026-07-24-017-b-persistence-strategy-facts-sink.md) |
| task-2026-07-24-017-c-view-field-usage-facts-sink | designer-canvas 目录：view 字段使用矩阵下沉为事实（07-view-slices.md §7） | done | chore | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-017-c-view-field-usage-facts-sink.md](./done/task-2026-07-24-017-c-view-field-usage-facts-sink.md) |
| task-2026-07-24-012-3 | 验证 fieldPreserve 已修复改名丢失（原 task-014） | done | bugfix | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-012-3-verify-rename-preserve.md](./done/task-2026-07-24-012-3-verify-rename-preserve.md) |
| task-2026-07-24-012-2 | 修复组尺寸重算后位置漂移导致子组件二次位移 | done | bugfix | 2026-07-24 | 2026-07-24 | [done/task-2026-07-24-012-2-manual-fix.md](./done/task-2026-07-24-012-2-manual-fix.md) |
| task-2026-07-24-019 | 冒烟测试集中执行 + tsc pre-existing 错误修复 + 引入 vitest + task-010 单测补全 | done | test + bugfix | 2026-07-24 | 2026-07-28 | [done/task-2026-07-24-019-smoke-and-tsc-cleanup.md](./done/task-2026-07-24-019-smoke-and-tsc-cleanup.md)（⚠️ 已被拆分，§2.2 由 [task-2026-07-29-001](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接） |
| task-2026-07-24-018-plan-content-facts-sink | designer-canvas 目录：plan 任务内容（事实性细节）下沉为 design 事实 | done | chore | 2026-07-24 | 2026-07-24 | [task-2026-07-24-018-plan-content-facts-sink.md](./done/task-2026-07-24-018-plan-content-facts-sink.md) |
| task-2026-07-21-012-d-manual-fix | 手动修复：DesignerContent.setState 丢弃 meta/page/appScopeId 字段 | done | bugfix | 2026-07-23 | 2026-07-24 | [done/task-2026-07-21-012-d-manual-fix.md](./done/task-2026-07-21-012-d-manual-fix.md) |
| task-2026-07-21-011-fix | Fix task-011-review 发现的问题（high: toolbar designerState / medium: useRealtimeDataFlow 注释 / low: selector 副作用 + shallowEqual + .bak 清理） | done | bugfix | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-fix-review-issues.md](./done/task-2026-07-21-011-fix-review-issues.md) |
| task-2026-07-21-011-4-review | Review task-011-4：文档一致性与收尾（grep / DataProvider / barrel / AGENTS.md / tsc 比对） | done | review | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-4-review-docs-cleanup.md](./done/task-2026-07-21-011-4-review-docs-cleanup.md) |
| task-2026-07-21-011-3-review | Review task-011-3：运行时行为与性能（latestCache / useFlatComponents / re-render / 440 组件） | done | review | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-3-review-runtime-perf.md](./done/task-2026-07-21-011-3-review-runtime-perf.md) |
| task-2026-07-21-011-2-review | Review task-011-2：16 调用方切换正确性（闭包陷阱 / hook 违规 / 语义漂移） | done | review | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-2-review-callsites.md](./done/task-2026-07-21-011-2-review-callsites.md) |
| task-2026-07-21-011-1-review | Review task-011-1：数据流正确性（reducer / action / hooks 不可变与边界） | done | review | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-1-review-dataflow.md](./done/task-2026-07-21-011-1-review-dataflow.md) |
| task-2026-07-21-012-c | 工具函数清理（渲染路径 + onValueChange + AGENTS.md） | done | refactor + chore | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-012-c-utils-cleanup.md](./done/task-2026-07-21-012-c-utils-cleanup.md) |
| task-2026-07-21-012-b | 工具函数清理（工具函数路径调用方迁移） | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-012-b-utils-cleanup.md](./done/task-2026-07-21-012-b-utils-cleanup.md) |
| task-2026-07-21-012-a | 工具函数清理（utils.ts 自身闭包，新增 `getFieldNodeById`） | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-012-a-utils-cleanup.md](./done/task-2026-07-21-012-a-utils-cleanup.md) |
| task-2026-07-21-012 | 工具函数清理 + DesignerContent.onValueChange setLevelPath 修正 + 文档一致性收尾 | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-012-utils-cleanup-onvaluechange.md](./done/task-2026-07-21-012-utils-cleanup-onvaluechange.md)（已拆分到 012-a/b/c，均已 done） |
| task-2026-07-21-011 | 删除 useDesigner 兼容壳 + 切换 16 个调用方 + realtimeDataFlow/customFieldsList 走 Redux | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-011-drop-usedesigner-compat.md](./done/task-2026-07-21-011-drop-usedesigner-compat.md) |
| task-2026-07-21-010 | layer-manager + utils 不可变改造（单元测试未编写，改用人工代码审阅） | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-010-layer-manager-utils-immutable.md](./done/task-2026-07-21-010-layer-manager-utils-immutable.md) |
| task-2026-07-21-006 | 设计器 Canvas 状态合并到主 Store（基础 + 兼容层 + 修 mutation） | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-006-designer-canvas-slice.md](./done/task-2026-07-21-006-designer-canvas-slice.md) |
| task-2026-07-21-007 | 拆分 byId 索引 + 删除 EventBus + 引入 useFieldConf | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-007-byid-index.md](./done/task-2026-07-21-007-byid-index.md) |
| task-2026-07-21-008 | 配置面板走 patchFieldConf + 删除 useDebounceMergeConfig | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-008-patch-field-config.md](./done/task-2026-07-21-008-patch-field-config.md) |
| task-2026-07-21-009 | 收尾：清理 utils.js cloneDeep + 删除 useDesigner 兼容壳 | done | refactor | 2026-07-21 | 2026-07-21 | [done/task-2026-07-21-009-cleanup.md](./done/task-2026-07-21-009-cleanup.md) |
| task-2026-07-20-005 | 设计器 view 状态合并到主 store（修复嵌套 Provider 回归） | done | refactor | 2026-07-20 | 2026-07-20 | [done/task-2026-07-20-005-designer-view-merge-into-main-store.md](./done/task-2026-07-20-005-designer-view-merge-into-main-store.md) |
| task-2026-07-20-004 | useView 调用点清理 + 细粒度订阅收尾 | done | refactor | 2026-07-20 | 2026-07-20 | [done/task-2026-07-20-004-useview-call-sites-cleanup.md](./done/task-2026-07-20-004-useview-call-sites-cleanup.md) |
| task-2026-07-20-003 | 设计器私有 Store 迁移（useView → Redux） | done | refactor | 2026-07-20 | 2026-07-20 | [done/task-2026-07-20-003-designer-private-store.md](./done/task-2026-07-20-003-designer-private-store.md) |
| task-2026-07-20-002 | 清理未使用的 Redux action + packages 死代码 | done | refactor | 2026-07-20 | 2026-07-20 | [done/task-2026-07-20-002-cleanup-unused-actions.md](./done/task-2026-07-20-002-cleanup-unused-actions.md) |
| task-2026-07-20-001 | Redux 现代化升级 | done | refactor | 2026-07-20 | 2026-07-20 | [done/task-2026-07-20-001-redux-modernization.md](./done/task-2026-07-20-001-redux-modernization.md) |

---

## 状态图例

- `planning` — 计划中，未开工
- `in-progress` — 正在执行
- `done` — 已完成并归档到 `done/`
- `blocked` — 阻塞中，需要外部输入或决策（保留在根目录）
- `cancelled` — 取消，不再推进（保留在根目录）

---

## 类型图例

- `feature` — 新增功能
- `refactor` — 重构（无行为变化或变化可控）
- `bugfix` — 修复缺陷
- `research` — 调研（可能产出 research/ 文档）
- `chore` — 杂项（依赖升级、文档维护等）
- `test` — 测试补充
- `review` — 代码审查（对已完成 task 的复核）

---

## 命名规范

- 文件名：`task-YYYY-MM-DD-NNN-{topic}.md`
- 同一天多个任务递增 NNN（001、002、003 …）
- `{topic}` 用英文小写，多个单词用 `-`
- 例：`task-2026-07-20-002-cleanup-unused-actions.md`