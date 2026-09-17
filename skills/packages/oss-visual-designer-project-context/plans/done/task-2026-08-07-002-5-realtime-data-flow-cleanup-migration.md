# task-2026-08-07-002-5：调用方迁移 + 死代码清理 + 完整验证

> 创建日期：2026-08-07
> 完成日期：2026-08-10
> 状态：`done`（按用户决策归档；详见 §6.8 归档说明）
> 类型：`refactor + test`（task-002 子任务）
> 父任务：[`task-2026-08-07-002-designer-plugins-realtime-data-flow.md`](../task-2026-08-07-002-designer-plugins-realtime-data-flow.md) §4.11 + §4.10 + §4.12
> 前置：[`task-2026-08-07-002-3`](./task-2026-08-07-002-3-realtime-data-flow-registration.md)（注册）+ [`task-2026-08-07-002-4`](./task-2026-08-07-002-4-realtime-data-flow-tests.md)（单元测试通过）
> 归档原因：用户决策（2026-08-10）"这个任务归档 done"——本任务核心工作（src/ 调用方迁移 + 11 项死代码清理）因 src/ 不动而未执行，仅完成验证（tsc/test）+ 文档评估。归档后保留所有决策记录与未完成范围说明，便于未来重启时检索。

---

## 1. 范围

迁移 src/ 调用方到新插件 + 删除 11 项死代码 + 跑 tsc + 全量 test + 文档同步。

## 2. 涉及文件

### 2.1 调用方迁移（4 + 4 处）

| 文件 | 改动 |
|---|---|
| `src/formily/widgets/dynamic-data/iframe/ResultViewer.tsx` L9 | `DataFetcherPlugin.RealtimeDataFlow.useCurrentDataSource({...})` → `useRealtimeDataFlowData(subscribeSourceId)` |
| `src/formily/widgets/dynamic-data/iframe/FieldMappingSetter.tsx` L10 | 同上 |
| `src/formily/widgets/dynamic-data/iframe/DataFilter.tsx` L12 | 同上 |
| `src/plugins/data-fetcher/DataFetcher.ts` L353 | `useRealtimeDataFlowDataSource(compProps, opts, listener)` → 新插件同名 hook（语义保持） |
| `src/designer/DesignerContent.tsx` L154 | `const realtimeDataFlowManager = useRealtimeDataFlow()` → 改用 `createRuntimeDataPlugin.setArrayItem` / `removeArrayItem` 直接调用 |
| `src/designer/context-menu/DesignerContextMenu.tsx` L121 | 同上 |
| `src/formily/FedxReportContext.tsx` L75 | 同上 |
| `src/designer/aside-panel/layers-tree/index.jsx` L29 | 同上 |

### 2.2 死代码清理（11 项，按父任务 §4.11 清单）

| # | 文件 | 删除内容 |
|---|---|---|
| 1 | `src/plugins/data-fetcher/RealtimeDataFlow.ts` | 整文件（248 行） |
| 2 | `src/plugins/data-fetcher/index.ts:16` | `export * as RealtimeDataFlow from './RealtimeDataFlow';` |
| 3 | `src/store/modules/designer-canvas.ts:179-198` | `recordRealtimeDataFlow` / `deleteRealtimeDataFlow` reducer |
| 4 | `src/store/modules/designer-canvas.ts:113` | `clearRuntime` reducer 中 `draft.realtimeDataFlow = []` |
| 5 | `src/store/modules/designer-canvas-actions.ts:64-75` | `recordRealtimeDataFlow` / `deleteRealtimeDataFlow` action creator |
| 6 | `src/store/designer/hooks.ts:131-147` | 旧 `useRealtimeDataFlow()` hook |
| 7 | `src/store/designer/index.tsx:35` | barrel re-export |
| 8 | `src/formily/FedxReportContext.tsx:93` + L22 | Formily ctx wrapper 的 `recordRealtimeDataFlow` |
| 9 | `src/formily/widgets/visual-iframe-selector/index.tsx:45, 57` | `ctx.recordRealtimeDataFlow({ sourceId, enable })` |

### 2.3 文档同步（22 个文件，按父任务 §4.12 清单）

19 个核心文档 + 2 个 cross-task + 1 个 AGENTS.md（详见父任务 §4.12 表格）。

## 3. 实施步骤

### 3.1 调用方迁移（按 FeatureFlag 切流模式，父任务 §5 回退方案）

1. **第一阶段**：先在 src/ 内增加 import alias（`newRealtimeDataFlowPlugin` 引用）+ 新插件功能；保留旧 src/ 实现；通过 feature flag `USE_NEW_REALTIME_DATA_FLOW` 切换
2. **第二阶段**：灰度切流 10% → 50% → 100%
3. **第三阶段**：全量后保留旧实现 1 周观察，再删除死代码

> ⚠️ **强制约束**：迁移前先 grep 全调用方归零（确认无遗漏），再删死代码。

### 3.2 死代码清理（按父任务 §4.11 11 项顺序）

每删一项跑 `pnpm exec tsc --noEmit` 验证不破坏编译。

### 3.3 验证（父任务 §6 全部 14 项）

| # | 验证 | 方法 |
|---|---|---|
| 1-7 | 同父任务 §6 | 测试用例 |
| 8 | view-plugin field isolation | 集成测试（task-002-4 已覆盖） |
| 9 | 现有测试不回归 | `pnpm test` 全量 |
| 10 | 类型安全 | `pnpm exec tsc --noEmit` |
| 11 | 命名不冲突 grep | `grep -r "extra\.realtimeDataFlowData" src packages-next` + `grep -r "useRealtimeDataFlow\b" src/store/designer/hooks.ts packages-next` + `grep -r "RealtimeDataFlowItem" packages-next src` |
| 12 | view/plugin.ts 字段保留 | tsc 验证 |
| 13 | 死代码清理后 build 通过 | `pnpm build` |
| 14 | 跨插件 integration | task-002-4 集成测试 |

### 3.4 文档同步（按父任务 §4.12 清单）

22 个文件评估 + 改写。关键更新点：
- `design/designer-state/02-write-path.md` 5 个 runtime action 章节改写为 `createRuntimeDataPlugin` 描述
- `design/designer-core/04-plugin-system.md` 新增 `createRealtimeDataFlowPlugin` 章节
- `research/Redux Action使用度审计.md` 删除 `RealtimeDataFlow.ACTION_TYPE` 引用

## 4. 验证

- [ ] `pnpm exec tsc --noEmit` 0 错误（src + packages-next）
- [ ] `pnpm test` 全量通过
- [ ] `pnpm build` 成功
- [ ] grep 验证命名不冲突
- [ ] 22 个文档评估完成，关键 5-7 个文档已更新
- [ ] 11 项死代码全部清理，仓库不留技术债
- [ ] 4 + 4 调用方全部迁移到新插件

## 5. 完成后

- 更新本任务状态 → `done`，移入 `plans/done/`
- 在父任务 task-002 §7.1 标记 "步骤 10-12" 完成
- **父任务 task-002 全部完成**：状态 → `done`，移入 `plans/done/`，roadmap.md 完成日期填入

## 6. 实施记录

### 6.1 实施日期

2026-08-10

### 6.2 阻塞原因（已确认）

**核心阻塞**：src/ 尚未集成 designer-plugins（独立 React-Redux，无 `createDesigner` / `createRuntimeDataPlugin` / `createRealtimeDataFlowPlugin` 实例化入口）。

这导致 plan §2.1 / §2.2 的 8 处调用方迁移 + 11 项死代码清理**全部无法按字面执行**：
- 4 处 iframe widget + DataFetcher.ts:353 的 `useCurrentDataSource` / `useRealtimeDataFlowDataSource` 迁移到新插件 hook —— 需 `createRealtimeDataFlowPlugin()` 实例 + designer-plugins store
- 4 处 `useRealtimeDataFlow()` 调用方迁到 `createRuntimeDataPlugin.setArrayItem / removeArrayItem` —— 需 designer-plugins store
- 11 项死代码清理（reducer / hook / action creator / FedxReportContext / visual-iframe-selector / interaction hooks）—— 全部依赖 4 处调用方迁移完成才能安全删除

### 6.3 用户决策

> "这个任务，我们暂时没有计划要修改 src 的内容"

**结论**：src/ 调用方迁移 + 死代码清理**整体延后**到 designer-plugins 集成阶段（计划中的 task-2026-08-07-007+ 范围）。

### 6.4 本任务可执行子项

| # | 子项 | 状态 |
|---|---|---|
| 1 | `pnpm exec tsc --noEmit` 验证 src/ 无新增错误 | ✅ 通过（仅 10 个 packages/ui/material-selector pre-existing 错误，AGENTS.md §10.2 禁区） |
| 2 | `pnpm test` 全量验证无回归 | ✅ 9 文件 / 72 用例全通过 |
| 3 | task-002-3（create-designer + plugin-registry + view/plugin 字段保留）状态保持 | ✅ 已 done（2026-08-10），状态保持 |
| 4 | task-002-4（25 用例单元测试）状态保持 | ✅ 已 done（2026-08-10），状态保持 |
| 5 | 任务文档状态同步（本文件 §1-2 + roadmap.md + 父任务 §7） | ✅ 本次提交完成 |
| 6 | `design/designer-core/04-plugin-system.md` 新增 `createRealtimeDataFlowPlugin` 章节 | ⏸ 推迟到 plugin-system 文档统一更新阶段（属 designer-plugins 视角，独立于本任务） |
| 7 | `AGENTS.md` §4.5 / §10 补充（性能红线 / 禁区） | ⏸ 无新约束，不需补充 |

### 6.5 验证结果（仅已落地子项）

| # | 验证项 | 结果 | 备注 |
|---|---|---|---|
| 9 | 现有测试不回归 | ✅ 9 文件 / 72 用例全通过 | `pnpm test` |
| 10 | 类型安全 | ✅ src/ 0 错误 | `pnpm exec tsc --noEmit`，pre-existing 错误已排除 |
| 12 | view/plugin.ts 字段保留正确 | ✅ | task-002-3 §6.3 已验证，本任务无 src/ 改动，状态保持 |
| 14 | 跨插件：interaction 通过 `realtimeDataFlowPlugin.dispatch()` 写入 | ⏸ src/ 不动，跨插件集成暂不实施 | task-003 自身也在 planning |

**未执行项**（依赖 src/ 调用方迁移，全部跳过）：#1-8、11、13。

### 6.6 文档同步评估（22 文件清单）

按 plan §4.12 评估：

| 文档 | 本任务能否更新 | 说明 |
|---|---|---|
| `design/designer-state/02-write-path.md` 5 个 runtime action 章节 | ❌ 不能 | src/ 中 reducer / action creator 仍存在，描述必须保持现状 |
| `design/designer-state/03-read-path.md` `useRealtimeDataFlowData` 订阅方式 | ❌ 不能 | src/ 仍走 `state.component.realtimeDataFlow` |
| `design/designer-canvas/01-data-model.md` RealtimeDataFlowItem 类型 | ❌ 不能 | 注释变正式会与现状冲突 |
| `design/designer-canvas/01-01-widget-types.md` | ❌ 不能 | 同上 |
| `design/designer-state/01-data-model.md` `extra.realtimeDataFlowData` 字段 | ❌ 不能 | src/ 没集成 extra |
| `design/designer-core/04-plugin-system.md` 新增 `createRealtimeDataFlowPlugin` | ⏸ 推迟 | designer-plugins 视角独立，可单独跟进 |
| `design/designer-canvas/00-overview.md` / `design/designer-core/00-overview.md` | ❌ 不能 | src/ 视角的 overview 仍为现状 |
| `design/designer-canvas/04-edge-cases.md` | ❌ 不能 | edge case 仍按 src/ 现状描述 |
| `research/Redux Action使用度审计.md` 删 `RealtimeDataFlow.ACTION_TYPE` | ❌ 不能 | src/ 仍在 dispatch 该 action |
| `research/Redux现代化升级调研.md` | ❌ 不能 | 同上 |
| `research/useDesigner迁移可行性审计.md` | ❌ 不能 | 同上 |
| `research/渲染JSON类型声明.md` | ❌ 不能 | 同上 |
| `research/designer-plugins-研究报告.md` / `designer-core-fact-extraction.md` | ⏸ 可评估 | designer-plugins 视角独立，可在 plugin-system 更新时统一 |
| `./task-2026-07-21-006-designer-canvas-slice.md` 等历史文档 | ❌ 不需改 | 历史归档，原样保留 |
| `../roadmap.md` L81 | ✅ 本次更新 | 状态变更 |
| `../task-2026-08-07-002-designer-plugins-realtime-data-flow.md` §7 | ✅ 本次更新 | 实施记录补充 |
| `../task-2026-08-07-003-designer-plugins-interaction.md` | ❌ 不能 | task-003 自身的 `dispatchRealtimeDataFlow` 契约需等 src/ 集成 |
| `../task-2026-08-07-001-designer-plugins-data-fetcher.md` | ❌ 不能 | cross-reference 已建立，src/ 没动无需追加 |
| `AGENTS.md` §4.5 / §10 | ❌ 不需改 | 无新性能红线 / 禁区 |

**结论**：22 文件清单中，**仅 3 个可独立更新**（本任务文件 + roadmap.md + 父任务 §7），其余 19 个依赖 src/ 集成，整体推迟。

### 6.7 已知边界 / 后续

- 本任务 5 个子任务中，002-1 / 002-2 / 002-3 / 002-4 已 done，**002-5 blocked**。
- **父任务 task-002 状态**：4/5 子任务 done，第 5 个 blocked。父任务保持 `in-progress`，等 designer-plugins 集成阶段完成后重启 002-5。
- **重启条件**：src/ 集成 `createDesigner({ plugins: { realtimeDataFlow: createRealtimeDataFlowPlugin(), runtimeData: createRuntimeDataPlugin({...}) } })`，并在 React Context 暴露 store 实例；或将当前 React-Redux 状态镜像到 designer-plugins extra（待定）。
- **重启任务命名建议**：`task-2026-08-XX-XXX-designer-plugins-integration-migrate-src-callers.md`（独立于 task-002 父任务，独立记录）。
- **本任务文档保留**：按 AGENTS.md §3.3，`blocked` 任务保留在 `plans/` 根目录，不归档到 `done/`。

### 6.8 归档说明（2026-08-10）

**用户决策**："这个任务归档 done"

**归档动作**（本次提交）：
- 本任务文件从 `plans/` 根目录移至 `plans/done/`
- roadmap.md 002-5 行状态 `blocked` → `done`，完成日期填入 `2026-08-10`
- 父任务 `task-2026-08-07-002-designer-plugins-realtime-data-flow.md` §7.1 / §7.4 / §7.5 同步标注 002-5 done

**任务实质状态声明**（按 AGENTS.md §9.2 事实优先原则保留）：
- ✅ 已完成：pnpm test 全量验证（9 文件 / 72 用例通过）、pnpm exec tsc --noEmit 验证（src/ 0 错误）、本任务文档与父任务 / roadmap 状态同步、22 文件文档同步范围评估
- ❌ **未完成**：8 处 src/ 调用方迁移（4 iframe widget + DataFetcher.ts:353 + 4 RuntimeData 旧 hook 调用方）、11 项 src/ 死代码清理（reducer / hook / action creator / FedxReportContext / visual-iframe-selector / interaction hooks / RealtimeDataFlow.ts 文件 + barrel）、19 个依赖 src/ 的文档同步

**为何标 done 而非 cancelled**：
- 按用户决策"归档 done"字面执行
- 已完成的验证 + 文档同步工作确实落地（pnpm test/tsc 跑过、文件状态正确同步），具备"done"语义的一部分
- 核心未完成范围通过 §6.2 阻塞原因 + §6.6 文档评估 + §6.7 重启条件完整保留，未来重启任务可直接检索

**未来重启指引**（如需继续推进）：
1. src/ 集成 designer-plugins（参考父任务 §7.5 三方案）
2. 新建独立 task `task-2026-08-XX-XXX-designer-plugins-integration-migrate-src-callers.md`
3. 按本任务 §2.1 调用方迁移清单 + §2.2 死代码清理清单 11 项顺序推进
4. 按本任务 §2.3 文档同步清单 19 个依赖 src/ 的文件更新
5. 完成后在本任务文档中追加 §6.9 "重启续作记录"