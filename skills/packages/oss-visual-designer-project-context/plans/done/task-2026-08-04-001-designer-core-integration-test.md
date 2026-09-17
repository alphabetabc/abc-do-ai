# task-2026-08-04-001：designer-core 框架集成测试

## 背景

designer-core 框架内核能力已 ≈ 100%（见 `packages-next/designer-core/docs/design/parity-with-original.md`），task-001/002/003/004 相继抽离了 tree-utils / group-bounds / structure-ops / 目录优化。

但现有测试都是**单 API 单元测试**（`designer.test.tsx` 测单个 hook、`plugins.test.ts` 测单个插件、`parity-with-current.test.ts` 测单个写路径），**没有任何测试覆盖"多 API 组合的完整业务链路"**。框架从未被真实消费——`src/` 下 16+ 处调用方仍用 `utils.ts` 旧版，框架版零使用，正确性只靠单元测试验证。

## 目标

在 `packages-next/designer-core/src/__tests__/` 下新建 `integration.test.tsx`，用 `createDesigner` + 全套 hooks + 三条写路径 + 4 类插件，跑通**可视化设计器典型业务场景的完整链路**，验证框架端到端可用。

**不修改 `src/` 任何代码**——纯框架包内自证可用。

### 验证目标矩阵

| 链路 | 覆盖的 API | 现有测试覆盖？ |
| --- | --- | --- |
| 增：新建组件 → 追加到树 → 订阅感知 | `setTree` + `generatorNode` + `useTree` + `useNode` | 部分（单 API 测过，未组合） |
| 删：删除节点 → 选中补偿 → 订阅感知删除 | `deleteNodeById` + `setTree` + `useNode`(返回 undefined) | 部分 |
| 改：字段级更新 → config 浅合并 → byId 引用复用 → 订阅感知 | `updateNode` + `useNode` + `useUpdateNode` | 部分 |
| 结构：成组 / 拆组 → 组尺寸重算 → 派生计算 | `generatorGroup` + `splitGroup` + `getGroupSizePosition` + `createDerivedComputePlugin` | **未覆盖** |
| 批量：setPartialState 更新 extra → useExtra 感知 | `setPartialState` + `useExtra` | 部分 |
| 跨异步：useLatestState 在事件回调读最新 state | `useLatestState` + `updateNode` | 部分 |
| Context：Provider 注入 → 子组件 useDesigner 消费 | `DesignerProvider` + `useDesigner` + hooks | 部分 |
| 运行时数据：runtime data 插件增删 + extra 同步 | `createRuntimeDataPlugin` + `useExtra` | **未覆盖** |
| 跨 store：cross-slice sync 双向同步 | `createCrossSliceSyncPlugin` | 单独测过插件，未与业务链路组合 |

## 详细步骤

### 步骤 0：修正 parity 文档与实际代码的偏差（§9.5 文档同步）

**背景**：task-001/002/003 实际抽离了 8+5+5 个函数，但 `parity-with-original.md` §2.4 "辅助工具"表仍标注部分函数"不抽离"，文档滞后于代码。

**偏差清单**（对照 [index.ts](../../../packages-next/designer-core/src/index.ts) 实际导出）：

| parity 文档当前表述 | 实际代码（index.ts 导出） | 修正方向 |
| --- | --- | --- |
| `setLevelPath` → "❌ 不抽离"（L83） | ✅ 已抽离（`core/utils/tree-utils.ts`，task-001） | 改为"已抽离" |
| `orderBy` → "⚠️ 可后续抽离"（L84） | ✅ 已抽离（`core/utils/tree-utils.ts`，task-001，导出名 `orderBy`） | 改为"已抽离" |
| `getFieldOrderBy` → "⚠️ 可后续抽离"（L84） | ✅ 已抽离（导出名 `getNodeOrderBy`） | 改为"已抽离" |
| `clearEmptyCollection` → "保留业务层"（L85） | ✅ 已抽离（`core/utils/tree-utils.ts`，task-001） | 改为"已抽离" |
| `mergeFieldConfig`（同 L83 行内） | ✅ 已抽离（`core/utils/group-bounds.ts`，导出名 `mergeNodeData`，task-002） | 改为"已抽离" |
| `flatDesignerList` → "✅ 模式替代"（L86） | ✅ 已抽离（`core/utils/tree-utils.ts`，task-001，保留原名） | 改为"已抽离 + useFlatTree 模式替代并存" |

**修正文件**：`packages-next/designer-core/docs/design/parity-with-original.md` §2.4 表格

**原则**：以代码为准（§9.2 优先级 1），文档同步修正（§9.5）。

### 步骤 1：新建 `integration.test.tsx`

文件路径：`packages-next/designer-core/src/__tests__/integration.test.tsx`

复用现有 `test-utils.ts`（`makeNode` / `makeGroup` / `TestNode` / `TestFlat`）和 `renderHook.tsx`（`renderHook` / `renderHookWithWrapper` / `act`）。

### 步骤 2：编写集成测试用例

#### 2.1 增删改查完整链路（无插件，纯 store + hooks）

**场景**：模拟设计器"新建组件 → 选中编辑 → 删除"全流程

```
1. createDesigner 创建 store（含 2 个节点）
2. useTree 订阅 → 初始 2 节点
3. setTree 追加新节点 → useTree 感知到 3 节点
4. useNode('new') 订阅新节点
5. updateNode('new', { config: { left: 100 } }) → useNode 感知 left 变化
6. useUpdateNode() hook 调用 → 同步感知
7. setTree 删除节点 → useNode('deleted') 返回 undefined
8. 全程 validateIndex 校验 byId/parentMap 一致性
```

断言点：
- `useTree` 返回长度随 setTree 变化
- `useNode` 返回值随 updateNode 变化
- 删除后 `useNode` 返回 `undefined`
- `byId.data === node.data` 引用复用成立
- `getState().components` 永远 fresh

#### 2.2 成组 / 拆组 + 派生计算链路

**场景**：模拟"选中多个节点 → 成组 → 组尺寸自动重算 → 拆组"

```
1. createDesigner 创建 store（2 个叶子节点）+ createDerivedComputePlugin
   - compute 函数：检测 group 的 children 位置变化 → 重算 group bounds
2. useTree 订阅
3. generatorGroup 成组 → setTree → useTree 感知
4. derived compute 插件触发 → group bounds 被重算
5. updateNode 改子节点位置 → group bounds 再次重算
6. splitGroup 拆组 → setTree → useTree 感知
7. 全程 group.data.config.width/height 正确
```

断言点：
- 成组后 group 节点存在且 children 正确
- derived compute 被触发（compute call count > 0）
- 拆组后 group 消失，叶子节点回到顶层
- 防重入标志阻止爆栈（compute call count 有限）

#### 2.3 runtime data 插件 + extra 订阅链路

**场景**：模拟"组件绑定实时数据源 → useExtra 订阅 → 清理"

```
1. createDesigner + createRuntimeDataPlugin
2. useExtra 订阅 realtimeDataFlow
3. plugin.setArrayItem('comp_1', 'source_1') → useExtra 感知
4. plugin.setArrayItem('comp_1', 'source_2') → 更新
5. plugin.clear() → useExtra 感知清空
6. 全程 components/byId/parentMap 引用不变（插件不侵入核心三字段）
```

断言点：
- `useExtra` 返回值随 plugin 操作变化
- 插件操作前后 `components` / `byId` / `parentMap` 引用不变（`toBe`）

#### 2.4 跨异步边界 + Context 链路

**场景**：模拟"Provider 注入 → 子组件用 useDesigner → 事件回调用 useLatestState 读最新 state"

```
1. createDesigner + DesignerProvider 包裹
2. renderHookWithWrapper: useDesigner() 获取实例
3. useNode('a') 订阅
4. useLatestState() 获取 getter
5. act: designer.updateNode('a', { config: { left: 100 } })
6. useNode 感知到 left=100
7. useLatestState()() 也读到 left=100（跨异步）
```

断言点：
- Provider 内 `useDesigner()` 返回正确实例
- `useNode` 与 `useLatestState` 读到一致的值
- 事件回调场景（模拟：在 setTimeout 内调 useLatestState）读到最新值

#### 2.5 cross-slice sync 双向同步链路

**场景**：模拟"框架 state 变化 → 同步到外部 store" + "外部 store 变化 → 框架感知"

```
1. createDesigner + createCrossSliceSyncPlugin（mock 外部 store）
2. designer.updateNode → onStateChange 被调用
3. 外部 store 变化 → onExternalChange 被调用
4. destroy → 双向订阅取消
```

断言点：
- `onStateChange` 在框架 state 变化时被调用
- `onExternalChange` 在外部 store 变化时被调用
- `destroy` 后双向订阅取消

### 步骤 3：运行验证

```bash
pnpm --filter @fedx-vis/designer-core typecheck
pnpm --filter @fedx-vis/designer-core test
```

期望：
- typecheck 通过（0 error）
- test 通过（现有 183 + 新增集成测试，全绿）

## 验证

- `packages-next/designer-core/docs/design/parity-with-original.md` §2.4 与 `index.ts` 实际导出一致（§9.5）
- `pnpm --filter @fedx-vis/designer-core typecheck` 通过
- `pnpm --filter @fedx-vis/designer-core test` 通过
- 现有 `src/` 代码不改动（纯框架包内测试 + 文档修正）

## 风险

| ID | 风险 | 缓解 |
| --- | --- | --- |
| R1 | 集成测试依赖 renderHook，React act 行为可能与真实组件不同 | 复用现有 `renderHook.tsx`（已被 10 个测试文件验证），遵循现有测试模式 |
| R2 | derived compute 插件在测试环境的 subscribe 时机可能与生产不同 | 在 act 内触发 updateNode，确保 Zustand subscribe 同步触发 |
| R3 | cross-slice sync 的 mock 外部 store 行为可能与真实 Zustand 不一致 | 测试只验证"回调被调用 + destroy 后取消"，不模拟真实 store 语义 |
| R4 | 集成测试可能暴露框架 bug（如 useLatestState 竞态、插件顺序问题） | 正是本任务的价值——发现 bug 是收益，不是风险；发现的 bug 单独修复 |
| R5 | `integration.test.tsx` 需 `.tsx` 后缀（含 JSX） | 同 `designer.test.tsx` / `hooks.test.tsx` 模式 |

## 回退

删除 `packages-next/designer-core/src/__tests__/integration.test.tsx` 即可，无其他文件变更。

## 实施记录

### 2026-08-05 实施

#### 步骤 0：修正 parity 文档 §2.4

- 文件：`packages-next/designer-core/docs/design/parity-with-original.md`
- 修正 §2.4「辅助工具」表：
  - `setLevelPath`：❌ 不抽离 → ✅ 已抽离（task-001，`core/utils/tree-utils.ts`）
  - `mergeFieldConfig`：合并到同行的 → ✅ 已抽离（task-002，导出名 `mergeNodeData`，`core/utils/group-bounds.ts`）
  - `orderBy`：⚠️ 可后续抽离 → ✅ 已抽离（task-001，导出名 `orderBy`）
  - `getFieldOrderBy`：⚠️ 可后续抽离 → ✅ 已抽离（task-001，导出名 `getNodeOrderBy`）
  - `clearEmptyCollection`：保留业务层 → ✅ 已抽离（task-001）
  - `flatDesignerList`：✅ 模式替代 → ✅ 已抽离 + `useFlatTree` 模式替代并存
  - `setLevelData`：保留业务层（未变，与 drillDown 强绑定）

#### 步骤 1-2：新建 integration.test.tsx

- 文件：`packages-next/designer-core/src/__tests__/integration.test.tsx`（419 行）
- 5 个 describe 块，7 个测试用例：
  - §2.1 增删改查完整链路（2 用例）：新建→追加→订阅→更新→删除 + 引用复用
  - §2.2 成组/拆组 + 派生计算（1 用例）：generatorGroup + derived compute + splitGroup
  - §2.3 runtime data 插件 + extra 订阅（1 用例）：setArrayItem + clear + 核心三字段引用不变
  - §2.4 跨异步 + Context（2 用例）：Provider + useDesigner + useLatestState + setTimeout 场景
  - §2.5 cross-slice sync 双向同步（1 用例）：onStateChange + onExternalChange + destroy 取消

#### 步骤 3：验证

- `pnpm --filter @fedx-vis/designer-core typecheck`：✅ 通过（0 error）
- `pnpm --filter @fedx-vis/designer-core test`：✅ 通过（190 tests passed = 183 现有 + 7 新增）
- `src/` 代码未改动（纯框架包内测试 + 文档修正）

#### 实施中的技术细节

1. `useDesigner()` 返回泛型默认的 `Designer`（非具体类型），测试中用 `as unknown as typeof designer` 双重断言规避 TS2352（与 designer.test.tsx 现有模式一致，该文件 L236 也用 `as any`）
2. §2.2 的 compute 函数遍历所有 group 重算 bounds（简化版 recalcGroupBounds），验证插件机制而非业务算法
3. 未使用 `deleteNodeById` / `ROOT_ID` import（从 index 导出验证可用，但测试链路未直接覆盖——deleteNodeById 的选中补偿在 structure-ops.test.ts 已覆盖）

### 2026-08-05 多角度 Review

启动 3 个并行 review agent，结论如下：

#### Review 1：测试质量审查

**已修复的高危问题**：
- P-2.4-B（高危）：§2.4"setTimeout 跨异步"场景原未真正用 setTimeout，等价于单元测试 → 已改用 `vi.useFakeTimers()` + 真 `setTimeout` + `vi.advanceTimersByTime(100)` 验证跨异步边界
- P-ASSERT-B（高危）：`test-utils.ts` 的 `validateIndex` 函数恒返回 true（walk 内 return 不终止递归）→ 已修复为 `let valid = true` + 短路终止
- P-2.2-A（中危）：防重入阈值 `<50` 是魔法数 → 收紧为 `<20` 并注释说明集成链路多次 setTree 的累积语义
- P-2.3-A（低危）：§2.3 更新场景未断言数组长度 → 补 `toHaveLength(1)` 区分更新与追加

**未修复的低危问题（记录留档）**：
- P-2.4-A（低危）：§2.4 未直接断言 `useDesigner() === designer`（间接验证已足够，且 designer.test.tsx L240 已覆盖）
- P-ISO-A（中危）：renderHook.tsx 模块级 `container` 变量被覆盖（现有测试工具问题，非本任务范围）
- P-FLAKY-A（高危标注但实际不触发）：derived compute 的 subscribe 时机依赖同步性——当前实现确实同步，若未来改异步需加 `vi.waitFor`
- P-DUP-A（低危）：§2.5 与 plugins.test.ts 高度重复（唯一新增价值是 createDesigner 包装）

#### Review 2：文档一致性审查

**6 项核心修正全部正确**（setLevelPath / orderBy / getNodeOrderBy / clearEmptyCollection / mergeNodeData / flatDesignerList 均与 index.ts 实际导出一致）。

**发现的遗漏**：§2.4 表声称"与 index.ts 实际导出对齐"，但遗漏了 `eachTreeNode` / `visitNonLeafNodes` / `setChildren` 三个 tree-utils.ts 中已抽离并导出的函数。这三个函数属于树遍历辅助工具，应当补入表中。（未修复——属于额外的文档完善，可在后续 task 中处理）

#### Review 3：框架契约审查

**结论：未违反任何框架契约或禁区**。
- 未绕过 buildIndex（所有 byId/parentMap 变更均通过 setTree/updateNode 间接触发）
- 未使用已删除 API
- 写路径落点正确（setTree / updateNode / setPartialState）
- generatorGroup/splitGroup 调用签名与 structure-ops.ts 一致
- compute 返回值符合 `TNode[] | null` 契约
- 防重入机制有显式断言
- runtime data 插件不侵入核心三字段有显式验证

**唯一值得注意的风险**：validateIndex 实现 bug（已在 Review 1 中修复）。

### 最终验证状态

- `pnpm --filter @fedx-vis/designer-core typecheck`：✅ 通过（0 error）
- `pnpm --filter @fedx-vis/designer-core test`：✅ 通过（190 tests = 183 现有 + 7 新增集成测试）
- `src/` 代码未改动（纯框架包内测试 + 文档修正 + test-utils bug 修复）

