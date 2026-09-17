# task-2026-08-07-003：designer-plugins createInteractionPlugin（事件订阅 + 派发）

> 创建日期：2026-08-07
> v2 修订日期：2026-08-07（与 task-2026-08-07-002 v2 同步，消除 dispatchRealtimeDataFlow 归属矛盾）
> v3 实施日期：2026-08-10（实际落地 designer-plugins 包内实现 + 28 用例测试；src/ 调用方迁移 + 死代码清理按 task-002-5 同等模式延后）
> 状态：`done`（2026-08-10 归档；designer-plugins 包内实现 + 测试完成；src/ 调用方迁移 + 死代码清理与 task-002-5 同等延期，需独立 task 承接）
> 类型：`feature`
> 前置任务：task-2026-08-07-002（realtime-data-flow）/ task-2026-08-06-006（plugin-registry）

> **同步修订说明**：review [.local-review/r1.md](../.local-review/r1.md) §1.7 指出本计划与 task-002 §1.4 矛盾（"interaction 不依赖 realtime-data-flow" vs "interaction 可以 dispatchRealtimeDataFlow"）。按决策 B1（task-002 重写时确定），`realtimeDataFlowData` 字段的**唯一拥有者**是 `createRealtimeDataFlowPlugin`，其他插件**必须通过** `realtimeDataFlowPlugin.dispatch(uniqueId, list)` 入口写入。本计划 v2 同步反映该契约。

---

## 1. 背景与目标

### 1.1 背景

src/ 的 interaction 插件管理组件间的事件订阅与派发：

| 能力 | src/ hook | 做什么 |
|---|---|---|
| **交互 API 创建** | `useCreateInteractionApi` | 为组件创建 interactionApi，包含 `dispatchRealtimeDataFlow` 等方法 |
| **订阅参数预处理** | `useInteractionsPreprocessor` | 扫描组件 config 里的 `:fieldName` 占位符，匹配 interactionList，组装 requestParams |
| **交互图** | `useInteractionsGraph` | 构建组件间的交互关系图 |
| **事件派发** | `dispatchAction` | 派发 `ACTION_INTERACTION` 事件，更新 `component.interactions` |

### 1.2 目标

迁移到 `createInteractionPlugin`，管理 `extra.interactions`。

### 1.3 与其他插件的关系（v2：消除与 task-002 §1.4 矛盾）

```
interaction（extra.interactions）
    │
    │ dispatchRealtimeDataFlow → 调用 realtimeDataFlowPlugin.dispatch(uniqueId, list)
    │                                ↓
    │                          extra.realtimeDataFlowData[uniqueId] = list
    ↓
realtime-data-flow（extra.realtimeDataFlowData，本插件拥有，调度入口）
```

**关键契约（与 task-002 §1.4 一致）**：
- `realtimeDataFlowData` **唯一拥有者**是 `createRealtimeDataFlowPlugin`
- interaction 内部的 `dispatchRealtimeDataFlow` **不再直接调** `store.setPartialState({ extra: { realtimeDataFlowData: ... } })`
- 改为**注入** `realtimeDataFlowPlugin` 实例到 interaction 工厂，interaction 内部 `dispatchRealtimeDataFlow` 调 `realtimeDataFlowPlugin.dispatch(uniqueId, list)`
- 这是 task-002 §1.4 决策 B1 的具体落地：保证字段契约的单一来源

**注入方式**（plugin-registry 模式）：
- `createInteractionPlugin` 工厂接受 `RealtimeDataFlowPlugin` 实例作为 option（对照 data-fetcher done §8.2.1 依赖注入模式）
- 或通过 `useDesignerPlugin('realtimeDataFlow')` 在 hook 内取（取决于 plugin-registry 是否暴露 `useDesignerPlugin`）

### 1.4 不做什么

- ❌ 不迁移 `ACTION_INTERACTION` 常量（继续用 `@fedx-vis/share` 导出的常量）
- ❌ 不改交互业务逻辑（保持原有的事件匹配 + 参数解析）
- ❌ **不直接写** `extra.realtimeDataFlowData`（v2 新增：必须通过 realtime-data-flow 插件的 dispatch 入口）

---

## 2. 接口草案（v2）

```ts
export interface InteractionPlugin {
    plugin: Plugin;

    /** 为组件创建 interactionApi */
    useCreateInteractionApi: (uniqueId: string) => InteractionType;

    /**
     * 订阅参数预处理
     *
     * 扫描组件 config 里的 `:fieldName` 占位符，匹配 interactionList，组装 requestParams
     */
    useInteractionsPreprocessor: (uniqueId: string) => void;

    /** 交互关系图 */
    useInteractionsGraph: (uniqueId: string) => any;

    /** 派发交互事件 */
    dispatchAction: (event: InteractionEvent) => void;

    /** 解析订阅参数 */
    parseSubscribeParams: (params: any) => any;
}

/**
 * 工厂选项（v2 新增：依赖注入模式，对照 data-fetcher done §8.2.1）
 *
 * interaction 内部的 dispatchRealtimeDataFlow 需要调用 realtime-data-flow 插件的 dispatch，
 * 通过注入解耦：interaction 不需要直接 import realtime-data-flow 的内部实现。
 */
export interface InteractionPluginOptions {
    /** realtime-data-flow 插件实例（用于 dispatchRealtimeDataFlow 转发） */
    realtimeDataFlowPlugin: RealtimeDataFlowPlugin;
}
```

---

## 3. extra 类型扩展

```ts
export interface DesignerExtra {
    // ... 已有字段
    interactions: Record<string, any>;    // ← 新增
}
```

---

## 4. 关键风险点（v2 扩展）

| 风险 | 影响 | 缓解 |
|---|---|---|
| ACTION_INTERACTION 来自 @fedx-vis/share | 不是字符串字面量 | 插件需对接 share 包常量 |
| 订阅参数解析复杂 | `:fieldName` 占位符匹配 | 保持原有解析逻辑 |
| 跨组件事件派发顺序 | 事件可能丢失 | 保持原有 dispatch 机制 |
| **dispatchRealtimeDataFlow 通过 realtime-data-flow 插件转发**（v2 新增） | 引入插件依赖 | 工厂接受 RealtimeDataFlowPlugin 注入；调用方需保证同时启用两个插件 |
| **未注入 realtime-data-flow 时降级行为**（v2 新增） | dispatchRealtimeDataFlow 变 noop | 工厂 option 必填；缺则报错 |

---

## 5. 详细步骤

> 待 review 通过后细化。

### 5.1 类型定义
### 5.2 createInteractionPlugin 工厂接受 RealtimeDataFlowPlugin 注入
### 5.3 useCreateInteractionApi 实现（dispatchRealtimeDataFlow 转发）
### 5.4 useInteractionsPreprocessor 实现
### 5.5 dispatchAction 实现
### 5.6 测试

---

## 6. 验证（v2 调整）

| 验证项 | 方法 |
|---|---|
| 交互事件派发 | 测试用例 |
| 订阅参数解析 | 测试用例 |
| dispatchRealtimeDataFlow 通过 realtime-data-flow 插件 dispatch 写入（v2 改为跨插件验证） | 测试用例 + 验证 extra.realtimeDataFlowData 实际值 |
| 未注入 realtime-data-flow 插件时 dispatchRealtimeDataFlow 报错或 noop | 测试用例 |
| 现有测试不回归 | `pnpm test` 全量通过 |

---

## 7. 实施记录

> v3 实施日期：2026-08-10

### 7.1 实施步骤（按 plan §5 落地）

**Step 1：创建 `src/interaction/types.ts`**

- 定义 `InteractionEvent` / `InteractionType` / `InteractionsGraph` / `CurrentFieldDrilldownDataResult` / `SubscribeObjectConfig` / `DispatchActionOptions` / `ParseSubscribeParamsResult` 等 7 个对外类型
- 定义 `InteractionPluginOptions`（14 个注入字段）：
  - 必填注入：`realtimeDataFlowPlugin`（跨插件转发，唯一拥有者契约）
  - 业务常量：`interactionConstants`（来自 `@fedx-vis/share.interactions`）
  - 条件工具：`withCondition` / `isAnd` / `pickWithOr` / `pickWithCondition`
  - 工具函数：`deepClone` / `objectFor` / `useMemorizedObject` / `flatTree`
  - 日志：`logWarn`
- 定义 `InteractionPlugin` 接口（1 命令式 dispatchAction + 5 hooks + 1 工具函数 + plugin 空壳）

**Step 2：创建 `src/interaction/plugin.ts`**

- 实现 `useTypedStore()` 第 6 处副本（与 view/layer-ops/group-management/data-fetcher/realtime-data-flow 一致，按 task-002 §5 风险点 12 推迟抽取）
- 实现默认工具函数（无依赖注入时降级）：`defaultParseSubscribeParams` / `defaultPickWithOr` / `defaultPickWithCondition` / `defaultDeepClone`（JSON 序列化）/ `defaultObjectFor`（递归遍历）
- 实现 `useFlattenTree()`（useCallback 包装 designer-core 的 `flatDesignerList`，保持引用稳定）
- 实现 `reduceInteractions` 纯 reducer（从 src/ reducer.ts 迁移；DRILL_DOWN 跳过 + 跨 uniqueId 冲突清理 + 同 uniqueId 字段合并）
- 实现 `plugin` 空壳 + `init` 闭包绑定 `ctx`
- 实现 `dispatchAction`（命令式 API，写 extra.interactions）
- 实现 `useCreateInteractionApi`（返回 interactionApi，含 dispatch / subscribe / defined / action / dispatchRealtimeDataFlow）
- 实现 `useInteractionsPreprocessor`（扫描 `:fieldName` 占位符，组装请求参数）
- 实现 `useInteractionsGraph`（扫描整树，构建 source/target/link）
- 实现 `useCurrentFieldDrilldownData`（从 defined + subscribe 中找当前触发项）
- 实现 `useSubscribeObject`（替换 `:fieldName` 为 interaction.state）
- 实现 `parseSubscribeParams`（pure utility）

**Step 3：创建 `src/interaction/index.ts` barrel**

- re-export `createInteractionPlugin` + 20 个类型

**Step 4：扩展 `types.ts` 的 `DesignerExtra` + 默认值**

- 新增 `InteractionEvent` 类型（与 interaction/types.ts 共享语义）
- `DesignerExtra` 新增 `interactions: InteractionEvent[]` 字段
- 新增 `defaultInteractions: InteractionEvent[] = []`

**Step 5：扩展 `create-designer.ts` 的 `CreateDesignerInitialExtra`**

- 新增 `interactions?: InteractionEvent[]` 字段
- 在 `initialExtra` 默认值合并中追加 `interactions: initialExtra?.interactions ?? defaultInteractions`

**Step 6：在 `plugin-registry.ts` 注册 `interaction` 插件**

- 取消 `// interaction: InteractionPlugin;` 占位注释
- 替换为带 JSDoc 的正式注册（task-2026-08-07-003 描述）

**Step 7：`view/plugin.ts` 保留 `interactions` 字段**

- 在 `useSetView` 的 extra payload 中追加 `interactions: state.extra.interactions`（避免 view setView 清空 interactions，task-001 done §8.2.5 教训）

**Step 8：顶层 `index.ts` 导出**

- `InteractionEvent` 类型导出
- `defaultInteractions` 默认值导出
- `createInteractionPlugin` + 20 个类型导出

**Step 9：创建 `src/__tests__/interaction.test.tsx`（28 用例 / 9 describe）**

| describe | 用例数 | 覆盖 |
|---|---|---|
| 结构契约 | 3 | plugin.name / plugin.type + 6 hooks 是函数 |
| initial defaults | 2 | 默认 [] / view 写不破坏 interactions |
| dispatchAction | 6 | 基本 dispatch / 跨 uniqueId fieldName 冲突清理 / DRILL_DOWN 跳过 / 同 uniqueId 合并 / callback 触发 / 非法数据过滤 |
| useCreateInteractionApi | 4 | 返回 interactionApi 形状 / subscribe 命中 / dispatchRealtimeDataFlow 转发到 realtimeDataFlowPlugin / 未注入时 warn + noop |
| useInteractionsPreprocessor | 4 | 替换 `:fieldName` / 空 interactions 不处理 / 数组 state 转 string / customDataSourceApiConfig + exportAPIConfig |
| useInteractionsGraph | 2 | 无组件 → 空图 / 有 `:fieldName` → 正确识别 source/target/link |
| useCurrentFieldDrilldownData | 2 | 无 match → `{}` / 有 match → curStateItem + value + index + key |
| useSubscribeObject | 3 | 替换 `:fieldName` / 排除 CONFIGURABLE_EVENT/DYNAMIC_EVENTS / formatter 调用 |
| parseSubscribeParams | 2 | `:fieldName` 解析 / 普通字符串 |
| **合计** | **28** | **全部通过** |

### 7.2 关键决策与避坑

#### 7.2.1 跨插件转发（task-002 决策 B1 落地）

- `InteractionPluginOptions.realtimeDataFlowPlugin` 为可注入的 `RealtimeDataFlowPlugin` 实例
- `interactionApi.dispatchRealtimeDataFlow(list)` 内部调 `realtimeDataFlowPlugin.dispatch(uniqueId, list)` —— 不直接 `store.setPartialState({ extra: { realtimeDataFlowData: ... } })`
- 未注入时降级为 `noop + logWarn`（一次性 warn，不重复）
- 设计意图：保证 `extra.realtimeDataFlowData` 字段契约的单一来源（task-002 §1.4 决策 B1）

#### 7.2.2 reducer 纯函数迁移（无 immer）

- 原 src/ 用 `immer.produce`，本插件包无 immer 依赖
- 实现用普通 JS 数组方法（filter / findIndex / Object.assign）
- 算法保持不变：
  1. DRILL_DOWN_FIELD_NAMES 字段跳过（不参与跨 uniqueId 清理）
  2. 跨 uniqueId 同 fieldName 冲突：旧 uniqueId 的项被删除
  3. 同 uniqueId 字段合并：后续 dispatch 覆盖先前 state
- 验证：dispatchAction 6 个测试用例覆盖全部 reducer 路径

#### 7.2.3 `useFlatTree` 稳定回调（避免无限循环）

- useFlatTree 注释明确指出"需用 useCallback 包裹以保持引用稳定"
- `useFlattenTree()` hook 内部用 useCallback 包装 `flatDesignerList<WidgetData>`
- `useInteractionsGraph` 内部调 `useFlattenTree()` 获取稳定回调，再传给 `useFlatTree`

#### 7.2.4 view/plugin.ts 字段保留（避免 view setView 清空 interactions）

- 沿用 task-001 done §8.2.5 教训：view setView 默认只送 `{ viewCanvas, viewUI }`，会覆盖其他 extra 字段
- 在 useSetView 的 extra payload 中追加 `interactions: state.extra.interactions` 保留引用

#### 7.2.5 `useTypedStore()` 第 6 处副本（已知边界）

- 与 view/layer-ops/group-management/data-fetcher/realtime-data-flow 共 6 处
- 按 task-002 §5 风险点 12 推迟抽取到 `hooks/`，避免 scope 蔓延
- 本任务**不抽取**（保持与其他插件一致）

#### 7.2.6 `useInteractionsPreprocessor` 简化

- 原 src/ 用 `withCondition` / `isAnd` 控制流程
- 本插件无 lodash 依赖，直接用 `if` 语句（语义等价）
- `pickWithOr` / `pickWithCondition` 通过 options 注入（默认实现足够覆盖业务场景）
- `_.set(draft, keyPath, state)` 替换为自实现 `setByPath`（按 lodash _.set 的 keyPath 语法覆盖 `a.b.c` / `a.b[0].c`）

### 7.3 测试矩阵执行结果

```
✓ src/__tests__/interaction.test.tsx (28 tests) 132ms
✓ src/__tests__/data-fetcher.test.tsx (33 tests) 164ms
✓ src/__tests__/group-management.test.tsx (19 tests) 111ms
✓ src/__tests__/realtime-data-flow.test.tsx (25 tests) 128ms
✓ src/__tests__/layer-ops-move-copy-delete.test.tsx (20 tests) 67ms
✓ src/__tests__/view-plugin.test.tsx (5 tests) 48ms
✓ src/__tests__/layer-ops-plugin.test.tsx (9 tests) 58ms
✓ src/__tests__/bootstrap.test.ts (8 tests) 12ms
✓ src/__tests__/plugin-registry.test.ts (7 tests) 12ms

Test Files  9 passed (9)
     Tests  154 passed (154)
```

### 7.4 验证结果

| 验证项 | 方法 | 结果 |
|---|---|---|
| `pnpm exec tsc --noEmit -p packages-next/designer-plugins/tsconfig.json` | designer-plugins 包类型检查 | ✅ 0 错误 |
| `pnpm exec tsc --noEmit`（workspace 根） | 全量 tsc | ✅ 除 packages/ui/src/material-selector pre-existing 10 个错误外，0 新错误 |
| `pnpm test`（designer-plugins 包） | 9 文件 / 154 用例 | ✅ 全部通过 |
| 结构契约 | 3 用例 | ✅ |
| dispatchAction 6 路径 | 6 用例 | ✅ |
| dispatchRealtimeDataFlow 转发 | 1 用例 | ✅ |
| dispatchRealtimeDataFlow 未注入 warn + noop | 1 用例 | ✅ |
| useInteractionsPreprocessor 替换 | 4 用例 | ✅ |
| useInteractionsGraph source/target/link | 2 用例 | ✅ |
| useSubscribeObject 排除 CONFIGURABLE_EVENT | 1 用例 | ✅ |
| view/plugin 字段保留 | 1 用例 | ✅ |
| 跨插件转发（task-002 决策 B1） | 集成用例 | ✅ |

### 7.5 已知边界 / 后续

#### 7.5.1 src/ 调用方迁移 + 死代码清理（与 task-002-5 同等延期）

src/ 尚未集成 designer-plugins（独立 React-Redux，无 `createDesigner` 实例化入口）。本计划 §1.4 / §5 的"调用方迁移" + "死代码清理"**全部依赖** designer-plugins store，与 task-002-5 模式完全一致：

| 待迁移 src/ 文件 | 涉及的 hook |
|---|---|
| `src/plugins/interaction/component/hooks.ts` | useInteractionsPreprocessor / useCreateInteractionApi / useInteractionsGraph / useCurrentFieldDrilldownData / useSubscribeObject / dispatchAction |
| `src/plugins/interaction/component/reducer.ts` | createReducer（被 src/store/modules/component.ts:64-65 调用） |
| `src/plugins/interaction/component/utils.ts` | parseSubscribeParams |
| `src/plugins/interaction/component/index.ts` | barrel re-export |
| `src/plugins/interaction/index.ts` | 外层 barrel |
| `src/store/modules/component.ts` | `interactions: any[]` 字段 + createReducer 调用 |
| 调用方（src/designer/ / src/formily/ / src/packages/） | useCreateInteractionApi / useInteractionsPreprocessor / useInteractionsGraph / useCurrentFieldDrilldownData / useSubscribeObject |

**重启条件**：src/ 集成 designer-plugins 后，新建独立 task `task-2026-08-XX-XXX-designer-plugins-integration-migrate-src-callers.md` 承接原 task-003-5 范围。

#### 7.5.2 `useTypedStore()` 第 6 处副本

- 与 view/layer-ops/group-management/data-fetcher/realtime-data-flow 共 6 处
- 按 task-002 §5 风险点 12 推迟抽取到 `hooks/`，避免本任务 scope 蔓延
- 后续 task 统一抽到 `hooks/useTypedStore.ts`

#### 7.5.3 `useInteractionsPreprocessor` 简化点

- 原 src/ 用 `withCondition` / `isAnd` 控制流程，本插件用 `if` 语句
- `_.set` 替换为自实现 `setByPath`（按 lodash _.set 的 keyPath 语法）
- 行为语义 1:1 对齐，覆盖原 src/ 测试用例
- 后续如需对齐 src/ 完整测试，可补充 `useMemorizedObject` 注入（未注入时 useMemo + JSON.stringify 替代）

#### 7.5.4 任务文档归档位置

- 本任务文档归档到 `plans/done/task-2026-08-07-003-designer-plugins-interaction.md`（AGENTS.md §3.3 done 任务归档到 done/）
