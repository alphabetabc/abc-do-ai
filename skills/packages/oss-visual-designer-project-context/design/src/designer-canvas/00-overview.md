# Designer Canvas 数据流架构 —— 总览

> 状态：`current`（2026-07-28，task-002/003 单源重构后）
>
> ⚠️ **权威性声明**：本目录是 designer canvas slice 的**权威设计文档**。
>
> - **新 task（task-2026-07-27-001+）**：必须基于本目录做方案设计。方案中引用的"事实"应能在本目录找到对应描述，**不允许**只依赖历史 task 推断。
> - **历史归档 task（task-005 ~ task-012-1）**：仅作为**实现记录**参考，**不**作为设计依据。新 task 不应反向依赖历史 task 的细节，而应从本目录出发。
>
> 事实准确性：每条事实均已对照源码验证（行号标注在 fact-check 章节）。如有偏差，以代码事实为准，更新本目录。
>
> 用途：本目录所有文档的入口与索引页

---

## 0. 这是什么

`designerCanvas` 是画布运行时大对象的 Redux slice，存 **components 树（唯一真相源）** + 派生 byId/parentMap 索引 + page + runtime hooks。

经过 task-006~012 + **task-2026-07-28-001/002/003 单源重构**的演进，当前架构：

- **单源原则**：`components` 树是唯一真相源，`byId` / `parentMap` 是纯派生索引（只读，由 `buildIndex` 重建，禁止直接写入）。
- **字段级订阅**：`useFieldConf(uniqueId)` 订阅 `byId[id]`，配合 `buildIndex` 引用复用保持订阅粒度（未变 data 节点复用旧 byId 引用）。
- **已删除 API**：`useDesigner` / `useDesignerSettingChange` / `runtimeComponentsTrigger` / `useSyncDesignerUpdate` / `useDebounceMergeConfig` / `getFieldConf` / `getParent` / `mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `fieldPreserve` / `dirtyConfigKeys` / `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` / `undo` / `redo` 全部已删除。

本文档集合用于：
1. **快速识别**当前架构的"事实"（避免每个 task 重新读源码审计）
2. **快速定位**已知 bug 和待办（不再走查 useDesigner 迁移可行性审计全文）
3. **快速知道状态如何管理**（增删改查的全图）

---

## 1. 文档索引

| # | 文件 | 关注点 | 何时读 |
| --- | --- | --- | --- |
| 00 | [00-overview.md](./00-overview.md) | **本页**（总览 + 索引） | 第一次进入 |
| 01 | [01-data-model.md](./01-data-model.md) | **数据模型**（state 形状、FlatField、单源架构） | 修改 state schema / 引入新字段 |
| 01-01 | [01-01-widget-types.md](./01-01-widget-types.md) | **Widget 类型定义**（WidgetItem / WidgetData / WidgetConfig / PageConfig / SchemaConfig 完整定义） | 修改组件树节点结构 / 加新 config 字段 |
| 02 | [02-write-path.md](./02-write-path.md) | **写路径 = 增删改**（3 类 action + 单源原则 + buildIndex 引用复用） | 加新 action / 改 reducer / 改 setComponents 流程 |
| 03 | [03-read-path.md](./03-read-path.md) | **读路径 = 查**（useFieldConf / useStore / 直接序列化 components / 各种读法对比） | 加新订阅 / 改 save 逻辑 / 修读不到最新值的 bug |
| 04 | [04-edge-cases.md](./04-edge-cases.md) | **边界场景**（recalcGroupBounds / save / setComponents 输入计算，单源后已简化） | 修涉及"tree + byId 同步"的复杂场景 bug |
| 05 | [05-known-bugs.md](./05-known-bugs.md) | **历史 bug 索引**（按"是否已修"分类） | 修复前先查这个，看是不是已知 bug |
| 06 | [06-principles.md](./06-principles.md) | **架构原则与禁区**（单源原则、不可变契约、禁用 mutation/cloneDeep/EventBus、已删除 API 清单） | 提交前自检 |
| 07 | [07-view-slices.md](./07-view-slices.md) | **View Slices**（viewCanvas + viewUI + updateView 跨 slice 机制 + 迁移事实） | 修改 view 状态 / 加新 view 字段 / 排查 view 侧问题 |

---

## 2. 一页纸概览

### 2.1 state 形状（详见 [01-data-model.md](./01-data-model.md)）

```ts
interface DesignerCanvasState {
    appScopeId: string | null;                            // 应用/场景 scope id
    components: WidgetItem[];                              // 单一真相源（树）
    byId: Record<string, FlatField>;                       // 派生索引：id → FlatField（不含 children）
    parentMap: Record<string, string>;                     // 派生索引：id → parentId（O(1) 找父）
    page: PageConfig;                                      // 页面级配置
    realtimeDataFlow: RealtimeDataFlowItem[];              // runtime hook 数据
    customFieldsListMapping: Record<string, string>;
    meta: Record<string, any>;                             // 场景元数据
}

interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;                                // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any };       // ⚠️ 不含 children（children 在 components 树）
}
```

> ⚠️ **task-003（2026-07-28）已删除字段**：`undo: any[]` / `redo: any[]` —— 从未实现的死字段，已从接口和 initialState 删除。
> ⚠️ **task-003（2026-07-28）已删除字段**：`FlatField.dirtyConfigKeys: Set<string>` —— 双源时代记录字段级更新过的 config 字段名，单源后 byId 纯派生，无需记录。

### 2.2 action 全图（详见 [02-write-path.md](./02-write-path.md)）

| action 类型 | 用途 | 是否更新 components | 是否更新 byId | 频率 |
| --- | --- | --- | --- | --- |
| `designerCanvas/setComponents` | 结构性变更（拖入/删除/成组/对齐） | ✅ 直接赋值 | ✅ buildIndex 重建（引用复用） | 低频 |
| `designerCanvas/setState` | 旧 setState 兼容（含 components 时走 setComponents 路径） | ✅ | ✅ buildIndex 重建 | 低频 |
| `designerCanvas/updateFieldConfig` | **字段级更新**（拖拽 onDragStop / 配置面板 onChange） | ✅ Immer produce 改树 | ✅ buildIndex 重建（引用复用） | **高频** |
| `designerCanvas/recordRealtimeDataFlow` | runtime hook：实时数据流 | ❌ | ❌ | 中频 |
| `designerCanvas/deleteRealtimeDataFlow` | runtime hook：删除 | ❌ | ❌ | 低频 |
| `designerCanvas/recordCustomFieldsList` | runtime hook：自定义字段 | ❌ | ❌ | 低频 |
| `designerCanvas/deleteCustomFieldsList` | runtime hook：删除 | ❌ | ❌ | 低频 |
| `designerCanvas/clearRuntime` | 清空 runtime hooks | ❌ | ❌ | 低频 |

> ⚠️ **单源原则防护**（task-002）：
> - `setState` reducer 内部防护：若 payload 含 `byId` / `parentMap`，打印错误并忽略（`[setState] byId/parentMap 不能直接设置...`），只由 `buildIndex` 派生。
> - `updateFieldConfig` 空 patch 防护：`patch` 为空对象时返回原 state（引用不变，无 buildIndex 执行）。
> - `updateFieldConfig` 不存在 uniqueId 防护：`parentMap[uniqueId]` 为 undefined 时返回原 state。

### 2.3 读路径全图（详见 [03-read-path.md](./03-read-path.md)）

| 场景 | 用什么 | 原因 |
| --- | --- | --- |
| 渲染当前组件配置 | `useFieldConf(uniqueId)` | 字段级订阅 byId 索引，O(1) re-render（buildIndex 引用复用保持粒度） |
| 异步回调读最新 state | `useStore().getState().designerCanvas.*` | 同步读，不订阅 |
| 渲染整树（递归组件 / 图层树） | `useSelector(s => s.designerCanvas.components, shallowEqual)` | 需要响应结构性变化 |
| 保存序列化 | **直接读 `designerState.components`** | 单源后 components 永远 fresh（task-003 删除 `getSaveableComponents`） |
| 读某个组件的 parent（含 children） | `getFieldNodeById(components, parentId)` | O(n) 但不 cloneDeep |
| 异步回调读 parent 节点（不需要 children） | `byId[parentMap[uniqueId]]` | O(1) |

### 2.4 边界场景速查（详见 [04-edge-cases.md](./04-edge-cases.md)）

| 场景 | 当前实现 | 风险点 |
| --- | --- | --- |
| 组内对齐（handleAlign） | 方案 B（1 次 `setComponents` + mergeFieldConfig 累积改动） | 单源后闭包 components 永远 fresh，无 stale 问题 |
| 拖拽组内子组件 → recalcGroupBounds | 直接读 `parents.children`（单源后 fresh） | task-002 删除 freshChildNodes，单源后无需包装 |
| 保存序列化 | 直接读 `designerState.components` | task-003 删除 `getSaveableComponents`，单源后直接序列化 |
| setComponents 输入计算（闭包 stale） | 单源后闭包 components 永远 fresh | task-002 根本消除 stale 闭包问题 |

---

## 3. 关键决策（详见各章节）

> "来源"列为**设计决策的溯源**（哪个 task 决定了这个设计），新 task 不应反向依赖这些 task plan 的细节。本目录是设计权威。

| 决策 | 结论 | 决策溯源（参考） |
| --- | --- | --- |
| **单源 vs 双源** | **单源**：`components` 树是唯一真相源，`byId`/`parentMap` 是纯派生索引（只读，由 buildIndex 重建） | task-007 引入双源 → **task-002 改为单源** |
| **字段级 action 设计** | `updateFieldConfig` 改树 + buildIndex（O(n) + 引用复用保持订阅粒度） | task-008 引入（O(1) 只改 byId）→ **task-002 改为改树 + buildIndex** |
| **byId/parentMap 写入防护** | `setState` reducer 防护：payload 含 byId/parentMap 时打印错误并忽略 | **task-002 引入** |
| **保存序列化** | 直接读 `designerState.components`（单源后永远 fresh） | task-012-1 引入 `getSaveableComponents` → **task-003 删除，改为直接序列化** |
| **runtime hooks** | 4 个 action（record/del × 2）+ 2 个 hook（useRealtimeDataFlow / useCustomFieldsList） | task-011 引入 |
| **`useDesigner` 兼容壳** | **已删除**；统一改 `useSelector` / `useDispatch` / `useFieldConf` | task-011 删除 |
| **`getFieldConf` / `getParent`** | **已删除**；用 `byId[id]` / `parentMap[id] + getFieldNodeById` | task-012-c 删除 |
| **`runtimeComponentsTrigger` EventBus** | **已删除**；用 `useSelector` 字段级订阅 | task-007 删除 |
| **`useDesignerSettingChange`** | **已删除**；用 `useFieldConf(uniqueId)` | task-007 删除 |
| **`useSyncDesignerUpdate`** | **已删除** | task-007 删除 |
| **`useDebounceMergeConfig`** | **已删除**；防抖不再需要 | task-008 删除 |
| **`mergeByIdIntoTree` / `getSaveableComponents`** | **已删除**；单源后 components 即真相源，无需合并 | task-012-1 引入 → **task-003 删除** |
| **`fieldPreserve` / `dirtyConfigKeys` / `patchFieldConf`** | **已删除**；单源后 byId 纯派生，无字段级覆盖问题 | task-012-1 引入 → **task-003 删除** |
| **`beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`** | **已删除**；单源后 setComponents 直接赋值，无需 skip | task-012-d 引入 → **task-003 删除** |
| **`undo` / `redo` 字段** | **已删除**；从未实现的死字段 | **task-003 删除** |

---

## 4. 快速导航：常见任务对照表

| 我要做什么 | 看哪份文档 |
| --- | --- |
| 修改 state 形状（加字段） | [01-data-model.md](./01-data-model.md) |
| 加新 action | [02-write-path.md](./02-write-path.md) |
| 改 setComponents / buildIndex 逻辑 | [02-write-path.md](./02-write-path.md) |
| 加新订阅 hook | [03-read-path.md](./03-read-path.md) |
| 改保存序列化逻辑 | [03-read-path.md](./03-read-path.md) + [04-edge-cases.md](./04-edge-cases.md) |
| 改拖拽逻辑 | [04-edge-cases.md](./04-edge-cases.md) |
| 改对齐 / 组操作 | [04-edge-cases.md](./04-edge-cases.md) |
| 排查"读不到最新值"的 bug | [03-read-path.md](./03-read-path.md) + [05-known-bugs.md](./05-known-bugs.md) |
| 排查"保存后字段丢失" | [03-read-path.md](./03-read-path.md) + [04-edge-cases.md](./04-edge-cases.md) + [05-known-bugs.md](./05-known-bugs.md) |
| 排查"组尺寸不更新" | [04-edge-cases.md](./04-edge-cases.md) + [05-known-bugs.md](./05-known-bugs.md) |
| 提交前自检（mutation / cloneDeep / EventBus / 单源原则） | [06-principles.md](./06-principles.md) |
| 看历史任务演进 | [.trae/skills/oss-visual-designer-project-context/plans/done/task-2026-07-21-006~012*](../../plans/done/) |

---

## 5. 相关文档（外部引用）

> 严格区分"参考归档"和"必读依赖"。新 task **不**应反向依赖历史 task 的细节。

### 5.1 📌 必读依赖（新 task 启动前必读）

> 这些是新 task 方案设计的**输入**。task plan 应引用本目录章节而非历史 task。

- **本目录 7 份核心文档**（按访问频率）：
  - [06-principles.md](./06-principles.md) —— 架构原则与禁区（提交前自检）
  - [05-known-bugs.md](./05-known-bugs.md) —— 历史 bug 索引（修 bug 前先查）
  - [03-read-path.md](./03-read-path.md) —— 读路径（如何从 state 读）
  - [02-write-path.md](./02-write-path.md) —— 写路径（如何改 state）
  - [04-edge-cases.md](./04-edge-cases.md) —— 边界场景
  - [01-data-model.md](./01-data-model.md) —— 数据模型
  - [01-01-widget-types.md](./01-01-widget-types.md) —— Widget 类型定义
- **单源重构系列 task**（task-2026-07-28-001/002/003/004，实现记录）：
  - [task-2026-07-28-001](../../plans/done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md) —— mutation 清理 + 性能基线
  - [task-2026-07-28-002](../../plans/done/task-2026-07-28-002-single-source-refactor-reducer.md) —— reducer 单源改造
  - [task-2026-07-28-003](../../plans/done/task-2026-07-28-003-single-source-refactor-cleanup-save.md) —— 死代码清理 + 保存路径
  - [task-2026-07-28-004](../../plans/done/task-2026-07-28-004-single-source-refactor-docs-verify.md) —— 文档更新 + 全量验证
- **2 个待修 follow-up task**（单源后剩余 bug）：
  - layout-block onResize 子组件不级联缩放（详见 [05-known-bugs.md §1.4](./05-known-bugs.md)）
  - tree 拖拽节点入组/出组后组尺寸不更新（详见 [05-known-bugs.md §1.5](./05-known-bugs.md)）

### 5.2 📚 参考归档（实现记录，新 task 不依赖）

> 这些 task 已经归档到 `done/`，是**实现过程**而非**设计依据**。
> 仅在排查"为什么这么实现"时查阅，不要在新 task 方案中反向引用其细节。

- **调研文档**（决策背景，可选查阅）：
  - [useDesigner 迁移可行性审计](../../research/useDesigner迁移可行性审计.md) —— task-006 决策背景（**探索性调研，非权威事实**，已大部分落地）
  - [useView 调用点字段审计](../../research/useView调用点字段审计.md) —— task-005 拆分设计（**探索性调研，非权威事实**；字段使用矩阵见 [07-view-slices.md](./07-view-slices.md) §7）
  - [Redux 现代化升级调研](../../research/Redux现代化升级调研.md) —— slice 模式（**探索性调研，非权威事实**；持久化策略见 [01-data-model.md](./01-data-model.md) §6）
- **已归档 task**（按时间倒序）：
  - [task-012-1](../../plans/done/task-2026-07-24-012-1-manual-fix.md) —— 保存丢失 + 拖拽组尺寸修复（**已被 task-002/003 单源架构根本替代**）
  - [task-012-d](../../plans/done/task-2026-07-21-012-d-manual-fix.md) —— P0-P8 渲染性能优化 + 改名丢失 + 组内对齐跳变
  - [task-012-a/b/c](../../plans/done/task-2026-07-21-012-a-utils-cleanup.md) —— 删 getFieldConf / getParent
  - [task-011](../../plans/done/task-2026-07-21-011-drop-usedesigner-compat.md) —— 删 useDesigner / DataProvider 兼容壳
  - [task-010](../../plans/done/task-2026-07-21-010-layer-manager-utils-immutable.md) —— layer-manager 不可变改造
  - [task-009](../../plans/done/task-2026-07-21-009-cleanup.md) —— 删 cloneDeep / setLevelPath 改造
  - [task-008](../../plans/done/task-2026-07-21-008-patch-field-config.md) —— updateFieldConfig 字段级 action
  - [task-007](../../plans/done/task-2026-07-21-007-byid-index.md) —— byId / parentMap 索引 + useFieldConf
  - [task-006](../../plans/done/task-2026-07-21-006-designer-canvas-slice.md) —— designerCanvas slice 迁入 Redux
  - [task-005](../../plans/done/task-2026-07-20-005-designer-view-merge-into-main-store.md) —— viewCanvas / viewUI 合并到主 store

### 5.3 ⚠️ 反模式警告

**新 task 禁止**：

- ❌ 在方案中只读历史 task plan 就开始写代码
- ❌ 引用 `useDesigner` / `useDesignerSettingChange` / `runtimeComponentsTrigger` 等已删 API
- ❌ 引用 `getFieldConf` / `getParent` / `mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `fieldPreserve` / `dirtyConfigKeys` 等已删 API
- ❌ 引用 `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` / `undo` / `redo` 等已删 API
- ❌ 用 `state.components` 直接保存序列化时再调 `getSaveableComponents`（已删除，单源后直接序列化 `designerState.components`）
- ❌ 绕过 `buildIndex` 直接赋值 `byId` / `parentMap`（单源原则禁区，详见 [06-principles.md §12](./06-principles.md)）

如发现违反，从本目录出发重做方案。

---

## 6. 代码事实来源（fact-check）

> 本目录每条事实均已对照源码验证。**代码 > 文档**：如有偏差，以代码为准并更新本文档。
>
> fact-check 时间：2026-07-28（task-002/003 单源重构完成后）
> fact-checker：本目录维护者
>
> **fact-check 触发时机**：
>
> 1. 任何 task 修改 `designerCanvas` slice / `useFieldConf` / `buildIndex` 等本目录覆盖的代码
> 2. 任何 task 发现"文档与代码不一致"
> 3. 季度审计（防止技术债累积）
>
> **fact-check 方法**：
>
> - 对每份文档 §N 的关键事实，运行 grep / 读源文件验证
> - 验证通过 → 标注 `✅`（行号 + 链接）
> - 验证失败 → 标注 `❌` + 修正方案
> - 推测/未验证 → 标注 `⚠️ 推测`，下次 task 触及时验证

### 6.1 关键事实对照表

| 文档章节 | 事实 | 代码位置 | 状态 |
| --- | --- | --- | --- |
| 01-data-model.md §1 | `DesignerCanvasState` 形状（无 undo/redo） | `src/store/modules/designer-canvas.ts` L19-L40 | ✅（task-003 已删除 undo/redo） |
| 01-data-model.md §2 | `FlatField` 定义（无 dirtyConfigKeys） | `src/designer/renderer/utils.ts` L640-L647 | ✅（task-003 已删除 dirtyConfigKeys） |
| 01-data-model.md §3 | `ROOT_UNIQUE_ID = '-'` | `src/designer/renderer/utils.ts` L22 | ✅ |
| 01-data-model.md §4 | 单源同步保证（buildIndex 重建） | `src/store/modules/designer-canvas.ts` L74-L85 | ✅（task-002 单源） |
| 02-write-path.md §1 | 8 个 action 全表 | `src/store/modules/designer-canvas.ts` L72-L160 | ✅ |
| 02-write-path.md §3.2 | updateFieldConfig reducer（改树 + buildIndex） | `src/store/modules/designer-canvas.ts` L107-L126 | ✅（task-002 单源） |
| 02-write-path.md §4 | mergeByIdIntoTree 已删除 | `src/designer/renderer/utils.ts` | ✅（task-003 已删除） |
| 03-read-path.md §2 | `useFieldConf` 实现 | `src/store/designer/hooks.ts` L86-L90 | ✅ |
| 03-read-path.md §4 | `useStore().getState()` 异步读模式 | `src/designer/DesignerContent.tsx` L125 | ✅ |
| 03-read-path.md §6 | 保存序列化直接读 components | `src/designer/DesignerContent.tsx` L357-L363 | ✅（task-003 删除 getSaveableComponents） |
| 04-edge-cases.md §1 | recalcGroupBounds 直接读 parents.children | `src/designer/DesignerContent.tsx` L300-L303 | ✅（task-002 单源） |
| 04-edge-cases.md §1.7 | isRecalcRef 防重入 | `src/designer/DesignerContent.tsx` L284 | ✅（单源下保留） |
| 04-edge-cases.md §2 | 3 个保存路径直接读 components | `DesignerContent.tsx` L360 / `designer-scene-monitor/index.tsx` / `saveAsTemp-modal/index.tsx` | ✅（task-003） |
| 05-known-bugs.md §1.1 | 改名丢失 bug | `src/designer/renderer/utils.ts` | ✅ 已修（task-002 单源根本解决） |
| 05-known-bugs.md §1.2 | stale tree 防御性读取 | - | ✅ 已修（task-002 单源根本消除） |
| 05-known-bugs.md §1.3 | mutation 残留 + cloneDeep | grep 验证 | ✅ 已修（task-2026-07-28-001 全部完成） |
| 06-principles.md §6 | mutation 残留 | grep 验证：`layer-manager/{lock,visible,move}/` + `useOnDrop` + `element.tsx` + `drag2layoutBlock` 全部已修 | ✅ 已审计（task-2026-07-28-001） |
| 06-principles.md §7 | cloneDeep | grep 验证：合理使用（白名单），仅剩 `dnd/helper.ts` L60、`DataSetList.tsx` L120 | ✅ 已审计（task-001） |
| 06-principles.md §12 | 已删除 API 清单 | grep 验证：`src/` 下 0 活代码引用 | ✅（task-003） |
| 00-overview.md §6.1 | buildIndex 位置 | `src/designer/renderer/utils.ts` L664 | ✅ |
| 00-overview.md §6.1 | setComponents reducer case | `src/store/modules/designer-canvas.ts` L74 | ✅ |
| 00-overview.md §6.1 | recordRealtimeDataFlow / delete / recordCustomFieldsList / deleteCustomFieldsList / clearRuntime case | `src/store/modules/designer-canvas.ts` L127 / L140 / L147 / L154 / L101 | ✅ |
| 00-overview.md §6.1 | useUpdateFieldConfig / useRealtimeDataFlow / useCustomFieldsList 位置 | `src/store/designer/hooks.ts` L102 / L131 / L159 | ✅ |

### 6.2 fact-check checklist（每次维护本目录时跑）

- [ ] grep `useDesigner\b\|useDesignerSettingChange\b\|runtimeComponentsTrigger\b` 在 `src/` 仍 0 命中（兼容壳未复活）
- [ ] grep `getFieldConf\b\|getParent\b` 在 `src/designer/` 仍 0 命中（兼容壳未复活）
- [ ] grep `mergeByIdIntoTree\|getSaveableComponents\|patchFieldConf\|fieldPreserve\|dirtyConfigKeys` 在 `src/` 仍 0 命中（单源后已删除）
- [ ] grep `beginSkipGroupRecalc\|endSkipGroupRecalc\|shouldSkipGroupRecalc\|_skipGroupRecalc` 在 `src/` 仍 0 命中（task-003 已删除）
- [ ] grep `state\.components *=\|state\.byId *=` 在 `src/designer/` 仍 0 命中（无新增 mutation）
- [ ] grep `_.cloneDeep(components)\|_.cloneDeep(state.components)\|_.cloneDeep(.*\.children)` 在 `src/designer/` 仅命中合理位置（resetUniqueId / generatorField / fetchMaterialSchema）
- [ ] grep `JSON.stringify(.*components.*designerState\|JSON.stringify(.*components.*designerCanvas` 在 `src/` 全部直接读 `designerState.components`（无 `getSaveableComponents`）
- [ ] 3 个保存路径直接读 `designerState.components`（无 `getSaveableComponents`）

### 6.3 偏差修复流程

发现"文档与代码不一致"时：

1. **记录偏差**：在 fact-check 章节加 `❌` 条目，标注"代码 X，文档 Y"
2. **判断方向**：以代码为权威（代码是事实，文档是描述）
3. **修复文档**：更新对应章节
4. **追溯影响**：如有相关 task 依赖旧文档，标注"需重审方案"
5. **commit**：单独 commit `docs(designer-canvas): fix fact-check deviation in §N`

---
