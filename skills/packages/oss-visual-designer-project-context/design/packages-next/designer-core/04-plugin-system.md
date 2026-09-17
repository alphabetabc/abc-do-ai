# 04 — 框架插件机制：四类插件契约

> 状态：`阶段 6 产出，待 review（A+B 双视角）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §1.6, §2.1, §7.2, §8
> 对照标准：[00-overview.md](./00-overview.md) §4.3 插件 API

---

## 0. 文档定位与 review 标准

本文档定义 designer-core 框架的**四类插件契约**：runtime data、derived compute（内置 ref 防重入）、structure tools、cross-slice sync，以及它们与当前项目 8 个 action + recalcGroupBounds + updateView 的映射关系。

**review 标准（task §1.1 阶段 6，A+B 双视角）**：
- **视角 A 事实核查**：每类插件对照当前源码验证（action 行号 + 调用场景）；映射关系无幻觉
- **视角 B 逻辑审查**：四类边界清晰不重叠；插件不过度设计（只覆盖当前代码已有的 4 类模式）；与 00-overview.md §4.3 一致

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。

---

## 1. 插件总览

### 1.1 设计原则（task §5.1 风险缓解）

- **插件只覆盖当前代码已有的 4 类模式，不新增**（task §5.1 风险"插件机制设计过度"缓解）
- 每类插件有明确的**对应当前代码**（fact-extraction §7.2 + §1.6 + §2.1）
- 插件不直接 mutation 核心三字段（components/byId/parentMap），只操作 extra 或通过写路径间接改 components

### 1.2 四类插件速查

| 插件类型 | 对应当前代码 | fact-extraction 章号 | 操作对象 |
| --- | --- | --- | --- |
| **runtime data** | 5 个 runtime action（clearRuntime/record+deleteRealtimeDataFlow/record+deleteCustomFieldsList） | §2.1 + §7.2 | `extra` 字段 |
| **derived compute**（内置 ref 防重入） | recalcGroupBounds（isRecalcRef） | §1.6 | 监听 state 变化 → 派生计算 → setTree/setPartialState |
| **structure tools** | generatorGroup/splitGroup/setLevelPath 等 | §3.4 调用场景 | 纯函数：树 → 新树 |
| **cross-slice sync** | updateView + extraReducers（viewCanvas/viewUI） | task §0.5 | 外部 store 同步 |

---

## 2. Plugin 基础接口

### 2.1 签名

```ts
/**
 * 框架插件基础接口
 *
 * 插件通过 createTreeStore options.plugins 注册，在 store 创建时初始化
 */
export interface Plugin<
    TNode extends TreeNode = TreeNode,
    TFlat extends FlatNode = FlatNode,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
> {
    /** 插件名（唯一，用于调试/日志） */
    name: string;

    /** 插件类型 */
    type: PluginType;

    /**
     * 初始化钩子（store 创建时调用一次）
     * @returns 可选 cleanup 函数（store 销毁时调用）
     */
    init?: (context: PluginContext<TNode, TFlat, TExtra>) => void | (() => void);
}

export type PluginType = 'runtime-data' | 'derived-compute' | 'structure-tools' | 'cross-slice-sync';

/**
 * 插件上下文（注入 store API）
 */
export interface PluginContext<
    TNode extends TreeNode = TreeNode,
    TFlat extends FlatNode = FlatNode,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
> {
    /** 同步读 state（不订阅） */
    getState: () => TreeStoreState<TNode, TFlat, TExtra>;
    /** 订阅 state 变化（listener 第二参数为 prevState） */
    subscribe: (listener: (state: TreeStoreState<TNode, TFlat, TExtra>, prevState: TreeStoreState<TNode, TFlat, TExtra>) => void) => () => void;
    /** 写路径：结构性变更 */
    setTree: (components: TNode[]) => void;
    /** 写路径：字段级更新（沿路径浅拷贝 + buildIndex 引用复用） */
    updateNode: (id: string, patch: UpdateNodePatch) => void;
    /** 写路径：批量更新（与 TreeStoreApi 对齐） */
    setPartialState: (payload: Partial<TreeStoreState<TNode, TFlat, TExtra>>) => void;
    /** 工具函数 */
    getNodeById: (components: TNode[], id: string) => TNode | null;
    /** buildIndex（插件一般不需要，但 derived compute 可能用到） */
    buildIndex: (
        components: TNode[],
        oldById?: Record<string, TFlat>,
    ) => { byId: Record<string, TFlat>; parentMap: Record<string, string> };
}
```

---

## 3. runtime data 插件

### 3.1 对应当前代码

当前项目 5 个 runtime action（fact-extraction §2.1 + §7.2）：

| 当前 action.type | 行号 | 用途 | 框架插件对应 |
| --- | --- | --- | --- |
| `designerCanvas/clearRuntime` | L111-116 | 清空 realtimeDataFlow + customFieldsListMapping | `runtimeDataPlugin.clear()` |
| `designerCanvas/recordRealtimeDataFlow` | L179-191 | 记录/更新实时数据流 | `runtimeDataPlugin.recordRealtimeDataFlow()` |
| `designerCanvas/deleteRealtimeDataFlow` | L192-198 | 删除实时数据流 | `runtimeDataPlugin.deleteRealtimeDataFlow()` |
| `designerCanvas/recordCustomFieldsList` | L199-205 | 记录/更新自定义字段 | `runtimeDataPlugin.recordCustomFieldsList()` |
| `designerCanvas/deleteCustomFieldsList` | L206-212 | 删除自定义字段 | `runtimeDataPlugin.deleteCustomFieldsList()` |

### 3.2 插件契约

```ts
/**
 * runtime data 插件
 *
 * 管理 extra 中的运行时数据（数组类 + Record 类字段）
 * 不操作 components/byId/parentMap
 *
 * 注：方法名泛型化（setArrayItem / setRecordItem），不绑定具体业务字段名。
 * 字段名通过 runtimeArrayKey / runtimeRecordKey 配置。
 */
export interface RuntimeDataPlugin<TNode extends TreeNode, TFlat extends FlatNode, TExtra extends Record<string, unknown>> extends Plugin<TNode, TFlat, TExtra> {
    type: 'runtime-data';

    /** 清空所有 runtime 数据（数组 + Record 归零） */
    clear: () => void;

    /** 数组类字段操作（如 realtimeDataFlow 订阅关系索引） */
    setArrayItem: (uniqueId: string, sourceId: string) => void;
    removeArrayItem: (uniqueId: string) => void;

    /** Record 类字段操作（如 customFieldsListMapping） */
    setRecordItem: (uniqueId: string, value: any) => void;
    removeRecordItem: (uniqueId: string) => void;
}
```

### 3.3 实现草案

```ts
// 框架 runtime data 插件实现
function createRuntimeDataPlugin<TNode extends TreeNode, TFlat extends FlatNode, TExtra extends Record<string, unknown>>(options: {
    runtimeArrayKey: string;   // 如 'realtimeDataFlow'
    runtimeRecordKey: string;  // 如 'customFieldsListMapping'
}): RuntimeDataPlugin<TNode, TFlat, TExtra> {
    // ctx 在 init 时绑定到闭包，供方法使用
    let ctx: PluginContext<TNode, TFlat, TExtra> | null = null;

    return {
        name: 'runtime-data',
        type: 'runtime-data',
        init: (context) => {
            ctx = context; // 绑定到闭包
            // 初始化 extra 中的字段（如果不存在）
            const state = ctx.getState();
            if (!state.extra[options.runtimeArrayKey]) {
                ctx.setPartialState({ extra: { ...state.extra, [options.runtimeArrayKey]: [] } });
            }
        },
        clear: () => {
            if (!ctx) return;
            const state = ctx.getState();
            ctx.setPartialState({
                extra: {
                    ...state.extra,
                    [options.runtimeArrayKey]: [],
                    [options.runtimeRecordKey]: {},
                },
            });
        },
        setArrayItem: (uniqueId, sourceId) => {
            if (!ctx) return;
            const state = ctx.getState();
            const list = state.extra[options.runtimeArrayKey] || [];
            const preIndex = list.findIndex((d) => d.uniqueId === uniqueId);
            const newList = preIndex === -1
                ? [...list, { uniqueId, sourceId }]
                : list.map((d, i) => i === preIndex ? { uniqueId, sourceId } : d);
            ctx.setPartialState({ extra: { ...state.extra, [options.runtimeArrayKey]: newList } });
        },
        // ... 其他方法（removeArrayItem / setRecordItem / removeRecordItem）类似，通过闭包 ctx 访问 store API
    };
}
```

**契约**：
- **不操作 components/byId/parentMap**：只改 `extra` 中的 runtime 字段
- **不可变更新**：`extra` 字段用展开运算符创建新引用
- **key 可配置**：不同业务的数组类 / Record 类字段名不同，通过 `runtimeArrayKey` / `runtimeRecordKey` 配置
- **ctx 闭包绑定**：`init(ctx)` 时将 PluginContext 绑定到闭包变量，插件方法通过闭包访问 store API（非 init 时段无 ctx 参数）

### 3.4 对应当前 hooks

| 当前 hook | 框架对应 | 说明 |
| --- | --- | --- |
| `useRealtimeDataFlow()` | `runtimeDataPlugin.setArrayItem` / `.removeArrayItem` | 返回 `{ record, del }`，业务条件（sourceId 空/enable=false）在业务层处理 |
| `useCustomFieldsList()` | `runtimeDataPlugin.setRecordItem` / `.removeRecordItem` | `get` 通过 `getState()` 同步读 |

> 框架插件提供 action 方法，当前 hooks 的"业务条件判断"（sourceId 空忽略、enable=false 改 delete）由业务自行封装。

---

## 4. derived compute 插件（内置 ref 防重入）

### 4.1 对应当前代码

当前项目 recalcGroupBounds（fact-extraction §1.6，DesignerContent.tsx L276-328）：

| 维度 | 当前实现 | 事实依据 |
| --- | --- | --- |
| 防重入标志 | `isRecalcRef = useRef(false)` | DesignerContent.tsx L284 |
| 入口判重入 | `if (isRecalcRef.current) return;` | L288 |
| 写入前置位 | `isRecalcRef.current = true;` | L317 |
| 写入后清位 | `isRecalcRef.current = false;` | L319 |
| 订阅机制 | `reduxStore.subscribe(recalcGroupBounds)` | L323 |
| 写入方式 | `setState({ components: results })` | L318 |

### 4.2 插件契约

```ts
/**
 * derived compute 插件
 *
 * 监听 state 变化 → 派生计算 → 写回 state
 * 内置 ref 防重入机制（对应 isRecalcRef）
 *
 * 业务提供 compute 函数，框架提供防重入 + 订阅 + 写入
 */
export interface DerivedComputePlugin<TNode extends TreeNode, TFlat extends FlatNode> extends Plugin<TNode, TFlat> {
    type: 'derived-compute';

    /**
     * 派生计算函数
     *
     * @param state 当前 state
     * @returns 新 components（若需更新）或 null（无需更新）
     */
    compute: (state: TreeStoreState<TNode, TFlat, any>) => TNode[] | null;
}
```

### 4.3 实现草案

```ts
// 框架 derived compute 插件实现
function createDerivedComputePlugin<TNode extends TreeNode, TFlat extends FlatNode, TExtra extends Record<string, unknown>>(
    options: {
        compute: (state: TreeStoreState<TNode, TFlat, TExtra>) => TNode[] | null;
        name?: string;
    },
): DerivedComputePlugin<TNode, TFlat, TExtra> {
    let isRecalculating = false; // 防重入（对应当前 isRecalcRef）
    let unsubscribe: (() => void) | null = null;

    return {
        name: options.name ?? 'derived-compute',
        type: 'derived-compute',
        compute: options.compute,
        init: (ctx) => {
            // 订阅 state 变化（对应当前 reduxStore.subscribe(recalcGroupBounds)）
            unsubscribe = ctx.subscribe((state) => {
                // 防重入（对应 if (isRecalcRef.current) return;）
                if (isRecalculating) return;

                const newComponents = compute(state);
                if (newComponents) {
                    // 写入前置位（对应 isRecalcRef.current = true;）
                    isRecalculating = true;
                    // 写入（对应 setState({ components: results })）
                    ctx.setTree(newComponents);
                    // 写入后清位（对应 isRecalcRef.current = false;）
                    isRecalculating = false;
                }
            });
        },
    };
    // cleanup: unsubscribe?.()（init 返回值）
}
```

### 4.4 契约

1. **内置 ref 防重入**（fact-extraction §8 约束 5）：`isRecalculating` 标志防止 compute → setTree → subscribe → compute 循环爆栈
2. **compute 是纯函数**：接收 state，返回新 components 或 null（无需更新）
3. **结构性变更走 setTree，字段级更新走 updateNode**：
   - 派生计算若生成新整树，走 `ctx.setTree(newComponents)`（对应当前 `setState({ components: results })`，fact-extraction §1.6 注释 L306-308）
   - 派生计算若只改单节点字段，走 `ctx.updateNode(id, patch)`（沿路径浅拷贝 + buildIndex 引用复用，性能更优）
4. **算法由业务提供**：框架只提供防重入 + 订阅 + 写入机制，具体算法（如 recalcGroupBounds）由业务 compute 函数实现

### 4.5 业务使用示例

```ts
// 业务侧 recalcGroupBounds 插件（非框架代码）
const recalcGroupBoundsPlugin = createDerivedComputePlugin({
    compute: (state) => {
        const selected = externalStore.getState().selected; // 读外部 store
        if (!selected || !selected.length) return null;

        const selectedId = selected[0];
        const parentId = state.parentMap[selectedId];
        if (!parentId || parentId === ROOT_ID) return null;

        const parent = getNodeById(state.components, parentId);
        if (!parent?.children) return null;

        // 业务算法：计算组 bounds（getGroupSizePosition + resetChildrenPosition）
        const newComponents = recalcGroupBoundsAlgorithm(state.components, parent);
        return newComponents;
    },
    name: 'recalc-group-bounds',
});
```

---

## 5. structure tools 插件

### 5.1 对应当前代码

当前项目结构工具函数（fact-extraction §3.4 调用场景 + 02-write-path.md §6）：

| 当前函数 | 行号 | 用途 | 框架对应 |
| --- | --- | --- | --- |
| `generatorGroup` | utils.ts L437-483 | 成组 | structure tools（业务实现） |
| `splitGroup` | utils.ts L484-516 | 拆组 | structure tools（业务实现） |
| `setLevelPath` | utils.ts L152-178 | 设置层级路径 | structure tools（业务实现） |
| `deleteFieldByUniqueId` | utils.ts L275-303 | 删除节点 | structure tools（业务实现） |
| `mergeFieldConfig` | utils.ts L208-237 | 合并字段配置 | structure tools（业务实现） |
| `getGroupSizePosition` | utils.ts L322-395 | 计算组尺寸位置 | structure tools（业务实现） |
| `resetChildrenPosition` | utils.ts L397-412 | 重置子节点位置 | structure tools（业务实现） |

### 5.2 插件契约

```ts
/**
 * structure tools 插件
 *
 * 提供树结构操作工具函数（成组/拆组/删除/排序等）
 * 纯函数：接收树 → 返回新树，不直接操作 store
 *
 * 框架只提供注册机制，具体工具函数由业务实现
 */
export interface StructureToolsPlugin<TNode extends TreeNode> extends Plugin<TNode, any> {
    type: 'structure-tools';

    /** 注册的工具函数映射 */
    tools: Record<string, (...args: any[]) => TNode[] | { components: TNode[]; [key: string]: any }>;
}
```

### 5.3 设计决策

> **更新（task-001/002/003）**：框架已将通用的结构操作 + 组尺寸 + 树遍历工具函数抽离到 `core/utils/` 下并从 `index.ts` 公开导出（13+ 函数）。这些函数是**无状态纯函数**，作为框架核心工具层提供，业务可直接 import 调用。

**当前分层**（已落地）：

| 层级 | 位置 | 内容 | 说明 |
| --- | --- | --- | --- |
| 核心工具层 | `core/utils/tree-utils.ts` | flatDesignerList / eachTreeNode / visitNonLeafNodes / orderBy / getNodeOrderBy / setLevelPath / setChildren / clearEmptyCollection | 树遍历 + 查询纯函数 |
| 核心工具层 | `core/utils/structure-ops.ts` | generatorNode / generatorGroup / splitGroup / deleteNodeById / getSelectedKeys | 结构操作纯函数（已去掉 form/grid 业务特化） |
| 核心工具层 | `core/utils/group-bounds.ts` | getGroupSizePosition / resetChildrenPosition / syncGroupSize2Children / mergeNodeData / createRecalcGroupBounds | 组尺寸计算 + 派生计算工厂 |
| 注册壳 | `plugins/createStructureToolsPlugin.ts` | createStructureToolsPlugin | 业务可将工具函数注册为插件，统一命名空间 |

**设计理由**：
1. 通用的树遍历 / 结构操作 / 组尺寸计算是纯函数，不依赖 PluginContext，作为核心工具层导出比塞进插件更自然
2. `createStructureToolsPlugin` 保留为**业务注册壳**——业务可选择直接 import 调用，或注册进 plugin 统一管理
3. `createRecalcGroupBounds` 工厂返回 `compute` 函数，适配 `createDerivedComputePlugin.compute` 签名，是"组尺寸重算插件"的算法注入点

### 5.4 业务使用示例

```ts
// 业务侧 structure tools 插件（非框架代码）
const structureToolsPlugin: StructureToolsPlugin<WidgetItem> = {
    name: 'designer-structure-tools',
    type: 'structure-tools',
    tools: {
        generatorGroup: (fields, byId, parentMap, selected, rootParent) => { /* 业务实现 */ },
        splitGroup: (fields, byId, parentMap, selected, rootParent) => { /* 业务实现 */ },
        deleteFieldByUniqueId: (parentChildren, uniqueId) => { /* 业务实现 */ },
        // ...
    },
};

// 使用：工具函数返回新树，调用方走 setTree
const { finalData } = structureToolsPlugin.tools.generatorGroup(/* ... */);
store.setTree(finalData);
```

---

## 6. cross-slice sync 插件

### 6.1 对应当前代码

当前项目 `updateView` + `extraReducers`（task §0.5）：

| 维度 | 当前实现 | 事实依据 |
| --- | --- | --- |
| viewCanvas slice | `createSlice` + typed action creator | AGENTS.md §5 |
| viewUI slice | `createSlice` + typed action creator | AGENTS.md §5 |
| 跨 slice 同步 | `updateView` action + `extraReducers` | task §0.5 |
| 批量更新 | `updateView({ scale, lines, ... })` 一次更新 viewCanvas + viewUI | task §0.5 |

### 6.2 插件契约

```ts
/**
 * cross-slice sync 插件
 *
 * 框架 store 与外部 store（如 viewCanvas/viewUI）的双向同步
 * 对应当前 updateView + extraReducers 模式
 */
export interface CrossSliceSyncPlugin<TNode extends TreeNode, TFlat extends FlatNode> extends Plugin<TNode, TFlat> {
    type: 'cross-slice-sync';

    /**
     * 框架 state 变化时，同步到外部 store
     */
    onStateChange?: (state: TreeStoreState<TNode, TFlat, any>) => void;

    /**
     * 外部 store 变化时，同步到框架（如果需要）
     */
    onExternalChange?: (externalState: any) => void;
}
```

### 6.3 实现草案

```ts
// 框架 cross-slice sync 插件实现
function createCrossSliceSyncPlugin<TNode extends TreeNode, TFlat extends FlatNode>(
    options: {
        externalStore: { subscribe: (fn: () => void) => () => void; getState: () => any };
        onStateChange?: (state: TreeStoreState<TNode, TFlat, any>) => void;
        onExternalChange?: (externalState: any) => void;
    },
): CrossSliceSyncPlugin<TNode, TFlat> {
    let unsubInternal: (() => void) | null = null;
    let unsubExternal: (() => void) | null = null;

    return {
        name: 'cross-slice-sync',
        type: 'cross-slice-sync',
        onStateChange: options.onStateChange,
        onExternalChange: options.onExternalChange,
        init: (ctx) => {
            // 框架 state → 外部 store
            if (options.onStateChange) {
                unsubInternal = ctx.subscribe(options.onStateChange);
            }
            // 外部 store → 框架（如果需要）
            if (options.onExternalChange) {
                unsubExternal = options.externalStore.subscribe(() => {
                    options.onExternalChange?.(options.externalStore.getState());
                });
            }
            // cleanup
            return () => {
                unsubInternal?.();
                unsubExternal?.();
            };
        },
    };
}
```

### 6.4 契约

1. **单向或双向同步**：业务可选 `onStateChange`（框架→外部）、`onExternalChange`（外部→框架）或两者
2. **不侵入核心三字段**：同步的是外部 store 状态（如 viewCanvas/viewUI），不操作 components/byId/parentMap
3. **对应当前 updateView**：当前 `updateView` 一次更新 viewCanvas + viewUI（跨 slice 批量），框架单 store 天然原子（task §0.5），cross-slice sync 插件用于框架 store ↔ 外部 store 的同步

### 6.5 业务使用示例

```ts
// 业务侧 viewCanvas/viewUI 同步插件（非框架代码）
const viewSyncPlugin = createCrossSliceSyncPlugin({
    externalStore: viewStore, // 外部 Zustand store（viewCanvas + viewUI）
    // 框架 state 变化时，同步 selected 到 view store
    onStateChange: (state) => {
        // 业务逻辑：从 state 派生 view 状态
    },
});
```

---

## 7. 插件注册与生命周期

### 7.1 注册

```ts
const store = createTreeStore({
    initialComponents: [...],
    initialExtra: { page: {...}, realtimeDataFlow: [] },
    plugins: [
        createRuntimeDataPlugin({ ... }),
        createDerivedComputePlugin(recalcCompute),
        structureToolsPlugin,
        createCrossSliceSyncPlugin({ ... }),
    ],
});
```

### 7.2 生命周期

| 阶段 | 时机 | 行为 |
| --- | --- | --- |
| init | `createTreeStore` 调用时 | 依次调用各插件 `init(ctx)`，注入 store API |
| 运行时 | state 变化时 | derived compute 的 subscribe 回调触发；cross-slice sync 的 onStateChange 触发 |
| cleanup | store 销毁时（如果有） | 调用 `init` 返回的 cleanup 函数 |

### 7.3 插件顺序

- **runtime data**：最先初始化（确保 extra 字段就绪）
- **derived compute**：在 runtime data 之后（可能依赖 extra 字段）
- **structure tools**：无顺序依赖（纯函数，不订阅）
- **cross-slice sync**：最后初始化（依赖框架 store 已就绪）

---

## 8. 与当前 8 action 的完整映射

| 当前 action.type | 框架对应 | 插件类型 | 是否核心 | 事实依据 |
| --- | --- | --- | --- | --- |
| `designerCanvas/setComponents` | `setTree` | — | ✅ 核心 | fact-extraction §7.2 |
| `designerCanvas/setState` | `setPartialState` | — | ✅ 核心 | fact-extraction §7.2 |
| `designerCanvas/updateFieldConfig` | `updateNode` | — | ✅ 核心 | fact-extraction §7.2 |
| `designerCanvas/clearRuntime` | `runtimeDataPlugin.clear()` | runtime data | ⚠️ 插件 | fact-extraction §7.2 |
| `designerCanvas/recordRealtimeDataFlow` | `runtimeDataPlugin.recordRealtimeDataFlow()` | runtime data | ⚠️ 插件 | fact-extraction §7.2 |
| `designerCanvas/deleteRealtimeDataFlow` | `runtimeDataPlugin.deleteRealtimeDataFlow()` | runtime data | ⚠️ 插件 | fact-extraction §7.2 |
| `designerCanvas/recordCustomFieldsList` | `runtimeDataPlugin.recordCustomFieldsList()` | runtime data | ⚠️ 插件 | fact-extraction §7.2 |
| `designerCanvas/deleteCustomFieldsList` | `runtimeDataPlugin.deleteCustomFieldsList()` | runtime data | ⚠️ 插件 | fact-extraction §7.2 |

**结论**：框架核心 API 覆盖 3 个写路径 action（setTree/setPartialState/updateNode），其余 5 个 runtime action 归入 runtime data 插件。derived compute / structure tools / cross-slice sync 不对应具体 action，对应的是行为模式（recalcGroupBounds / 工具函数 / updateView）。

---

## 9. 与前序文档的一致性核对

| 维度 | 00-overview.md | 本文档 | 一致性 |
| --- | --- | --- | --- |
| 四类插件 | §4.3 | §1.2 | ✅ |
| runtime data → 5 runtime action | §4.3 + §6.2 | §3 | ✅ |
| derived compute → recalcGroupBounds | §4.3 + §2.1 | §4 | ✅ |
| structure tools → generatorGroup 等 | §4.3 | §5 | ✅ |
| cross-slice sync → updateView + extraReducers | §4.3 | §6 | ✅ |
| 插件不侵入核心三字段 | §2.2 | §1.1 | ✅ |
| derived compute 内置 ref 防重入 | §3 决策记录 #10 | §4.4 | ✅ |

---

## 10. 相关文档

- [00-overview.md](./00-overview.md) §4.3 —— 插件 API 速查
- [01-data-model.md](./01-data-model.md) §2 —— TreeStoreState（extra 字段承载 runtime data）
- [02-write-path.md](./02-write-path.md) §6 —— 写路径决策树（runtime data 走插件）
- [03-read-path.md](./03-read-path.md) §7 —— 跨异步边界读路径（插件可能用到 getState）
- [05-principles.md](./05-principles.md) —— 插件须遵守 5 大反模式约束
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §1.6, §2.1, §7.2, §8 —— 事实基准
