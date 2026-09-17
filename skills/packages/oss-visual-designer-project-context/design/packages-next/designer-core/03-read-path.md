# 03 — 框架读路径：订阅 + 同步读 + 序列化 + 跨异步边界

> 状态：`阶段 5 产出，待 review（A+B 双视角）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §3（读路径三分法 + 字段级订阅 + 跨异步边界）
> 对照标准：[00-overview.md](./00-overview.md) §5.2-5.3, §5.6 API 契约签名草案
> 当前项目权威：[design/src/designer-state/03-read-path.md](skills/oss-visual-designer-project-context/src/designer-state/03-read-path.md)

---

## 0. 文档定位与 review 标准

本文档定义 designer-core 框架的**读路径三分法**：响应式订阅（`useNode` / `useTree`）、同步读（`getState` / `getNodeById`）、保存序列化，以及跨异步边界读路径的统一 API。

**review 标准（task §1.1 阶段 5，A+B 双视角）**：
- **视角 A 事实核查**：每条读路径对照当前源码验证（hook 签名 + 行号）；跨异步边界模式可溯源
- **视角 B 逻辑审查**：覆盖当前读路径决策树全部场景；shallowEqual 约束完整；与 00-overview.md §5 + 01-data-model.md + 02-write-path.md 一致

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。

---

## 1. 读路径速查

| 场景 | 框架 API | 对应当前 API | 原因 |
| --- | --- | --- | --- |
| 渲染当前组件配置（字段级） | `useNode(id)` | `useFieldConf` | 订阅 byId 索引，O(1) re-render |
| 渲染整树（递归组件 / 图层树） | `useTree()` | `useSelector(components, shallowEqual)` | 响应结构性变化 |
| 异步回调读最新 state | `store.getState()` | `reduxStore.getState().designerCanvas` | 同步读，不订阅 |
| 保存序列化 | `getState().components` | `designerState.components` | components 永远 fresh |
| 读某组件的 parent（含 children） | `getNodeById(components, id)` | `getNodeById` | O(n) 但不 cloneDeep |
| 异步回调读 parent（不需要 children） | `getState().byId[getState().parentMap[id]]` | `byId[parentMap[id]]` | O(1) |
| 跨异步边界读最新 state | `useLatestState()` | `latestCache.current.state`（getter 模式） | 统一封装 ref 缓存 |

---

## 2. useNode（字段级订阅）

> **签名说明**：本文档签名是**上层聚合签名**（createDesigner 闭包绑定 store 后的形态）。底层散装 hook 签名为 `useNode<TData, TNode, TFlat, TExtra>(store, id)`（首参 store，四泛型）。详见 [00-overview.md §5.8](./00-overview.md)。

### 2.1 签名

```ts
/**
 * 字段级订阅 hook：订阅 byId[id]，shallowEqual 优化 re-render
 *
 * 对应当前项目 useFieldConf（hooks.ts L86-90）
 */
function useNode<TFlat>(id: string): TFlat | undefined;
```

### 2.2 契约（对照 fact-extraction §3.1 + 00-overview.md §5.2）

1. **订阅目标**：`state.byId[id]`（FlatNode，不含 children）
2. **内建 shallowEqual**（对应当前 `useSelector(s => s.byId[id], shallowEqual)`，hooks.ts L89）
3. **组件删除时返回 `undefined`**：调用方需判空（`field?.data`）
4. **需 children 时用 `getNodeById`**（非 useNode，因为 byId 不存 children）
5. **shallowEqual 生效机制**：配合 buildIndex 引用复用（`oldEntry.data === node.data`），未修改 data 的节点复用旧 byId 条目 → shallowEqual 命中引用相等 → 跳过 re-render → 字段级订阅粒度

### 2.3 vanilla Zustand 实现草案

```ts
// 框架 useNode 实现（vanilla Zustand）
import { useStore } from 'zustand';
import { shallowEqual } from './utils';

function useNode<TFlat>(id: string): TFlat | undefined {
    return useStore(store, (state) => state.byId[id], shallowEqual);
}
```

**与当前的差异**：
- 当前：`useSelector((s) => s.designerCanvas.byId[uniqueId], shallowEqual)`（React-Redux）
- 框架：`useStore(store, (s) => s.byId[id], shallow)`（Zustand，更轻量）

### 2.4 适用范围（对照 fact-extraction §3.1 注释 L70-85）

| 场景 | useNode 适用？ | 原因 |
| --- | --- | --- |
| designer-field 渲染（读 `dataSource.data`） | ✅ | 字段级订阅，O(1) |
| 配置面板读当前组件 | ✅ | 字段级订阅 |
| layer-manager 读父节点 children | ❌ | byId 不存 children，用 `getNodeById` |
| useOnDrop 读父节点 children | ❌ | 同上 |

### 2.5 useUpdateNode（字段级更新 dispatcher）

```ts
/**
 * 字段级更新 dispatcher hook：返回稳定的 updateNode 引用
 *
 * 对应当前项目 useUpdateFieldConfig（hooks.ts L102-110）
 *
 * 框架提供此 hook 作为 store.updateNode 的 React 封装（useCallback 稳定引用）
 * 业务也可直接调 store.updateNode()（非 hook 场景）
 */
function useUpdateNode(): (id: string, patch: UpdateNodePatch) => void;
```

**契约**（对照 fact-extraction §3.2，hooks.ts L102-110）：
- 返回 `(id: string, patch: UpdateNodePatch) => void`（稳定引用，useCallback）
- 内部调 `store.updateNode(id, patch)`（02-write-path.md §3）
- 不走 debounce（对应当前删除的 `useDebounceMergeConfig`，Redux batching + 同步 dispatch 已够）

---

## 3. useTree（整树订阅）

### 3.1 签名

```ts
/**
 * 整树订阅 hook：订阅 components，框架强制 shallowEqual
 *
 * 对应当前项目 useSelector(s => s.components, shallowEqual)
 */
function useTree<TNode>(options?: { shallow?: boolean }): TNode[];
```

### 3.2 契约（对照 fact-extraction §3.3 + 00-overview.md §5.3）

1. **订阅目标**：`state.components`（整树）
2. **框架强制 shallowEqual**（对应当前 `useSelector(s => s.components, shallowEqual)`，task §0.7 约定）
3. **`options.shallow` 默认 true**：框架内置 shallowEqual，业务不可关闭（防止 byId 变化触发整树 reconcile）
4. **业务如需扁平化**：自行 `useMemo(() => flatList(tree), [tree])`（对应当前 `flatDesignerList` + `useFlatComponents`）

### 3.3 vanilla Zustand 实现草案

```ts
// 框架 useTree 实现（vanilla Zustand）
// 注：zustand v4 需用 useStoreWithEqualityFn（from 'zustand/traditional'），不支持 undefined equalityFn
function useTree<TNode>(options?: { shallow?: boolean }): TNode[] {
    const shallow = options?.shallow ?? true; // 默认 true，框架强制
    return useStoreWithEqualityFn(
        store,
        (state) => state.components,
        shallow ? shallowEqual : Object.is, // false 分支用 Object.is（引用相等）
    );
}
```

> **注**：`useStore`（zustand v4 原生）不支持 equalityFn 参数，需用 `useStoreWithEqualityFn`（from `zustand/traditional`）。false 分支用 `Object.is` 而非 `undefined`，是 `useStoreWithEqualityFn` API 要求。

### 3.4 与 useFlatTree 的关系

| API | 框架提供 | 说明 |
| --- | --- | --- |
| `useTree()` | ✅ 核心 API | 订阅整树 components |
| `useFlatTree()` | ⚠️ 可选辅助 | 订阅整树 + useMemo 扁平化（对应当前 `useFlatComponents`） |

`useFlatTree` 实现草案（如果框架提供）：

```ts
// 底层散装签名（首参 store，泛型保留类型信息）
function useFlatTree<TData, TNode, TFlat, TExtra, TFlatItem>(
    store: TreeStoreApi<TNode, TFlat, TExtra>,
    flatten: (tree: TNode[]) => TFlatItem[],
): TFlatItem[] {
    const tree = useTree<TNode>();
    return useMemo(() => flatten(tree), [tree, flatten]);
}
```

> 框架只提供 `useTree`，扁平化函数由业务传入（当前项目 `flatDesignerList` 是业务函数）。
>
> ⚠️ **flatten 引用稳定性**：`flatten` 作为 `useMemo` 依赖，若每次 render 传入新函数引用会导致重算。业务需用 `useCallback` 包裹 `flatten` 以保持引用稳定。

### 3.5 不同写路径下的 shallowEqual 行为

> **本节为 task-2026-08-05-005 补充**（基于 [research/tango-cross-review报告.md](skills/oss-visual-designer-project-context/research/tango-cross-review报告.md) §3.2 的"方案 B：保持 shallowEqual 但文档说明"决策）。

框架 `useTree` 内建 `shallowEqual`（§3.2 第 2 条）—— 它对数组做**元素引用比较**，期望"未改节点引用不变则不触发 re-render"。但**写路径的实现语义**决定了不同 API 下 `components` 引用变化模式不同，因此 `useTree` 的实际 re-render 行为也不同。

#### 3.5.1 行为说明表

| 场景 | components 引用 | shallowEqual 结果 | useTree 是否 re-render | 原因 |
| --- | --- | --- | --- | --- |
| `setTree(newTree)`（整树替换） | 变（直接赋值新数组） | true（已变化） | 是（正确） | 整树结构性变更 |
| `updateNode(id, patch)`（字段级） | 变（沿路径浅拷贝生成新数组） | true（已变化） | 是（正确，但消费者应 `useMemo`） | `02-write-path.md` §3 不可变更新：浅拷贝从根到目标节点路径上的所有数组 |
| `setPartialState({ extra: {...} })`（不含 components） | 不变 | false（无变化） | 否（正确） | shallowEqual 命中引用相等 |
| `updateNode(id, patch)` 后其他节点字段引用 | 不变（byId 引用复用） | — | — | `buildIndex` 引用复用：`oldEntry.data === node.data` 时复用旧 byId 条目（02-write-path.md §4） |

**关键认知**：`updateNode` 总是沿路径浅拷贝生成新的 `components` 顶层数组引用，因此 `shallowEqual` **总判定为已变化**，整树 `useTree` 会 re-render。这**不是 bug**——树确实变了，返回新数组引用是正确的不可变更新语义。`useTree` 的 `shallowEqual` 主要价值在于：**当写路径完全没碰 components**（如 `setPartialState` 只改 extra），避免 byId 重建触发整树 reconcile。

#### 3.5.2 消费者使用建议

> **消费决策**：根据使用场景选择订阅粒度，避免整树 re-render 引发不必要重算。

- **只需单个节点** → 用 `useNode(id)`（字段级订阅 byId，不受 `updateNode` 其他节点影响）。详见 §2。
- **需要扁平化** → 用 `useFlatTree(store, flatten)`（内建 `useMemo`，引用稳定）。详见 §3.4。
- **需要派生计算** → `useTree()` + `useMemo(() => derive(tree), [tree])`。
- **结构性变化时必须整树 re-render**（如递归渲染组件树、图层树）→ 直接用 `useTree()`，接受 updateNode 下的 re-render。

#### 3.5.3 与 Tango 对照

Tango 用 MobX `computed nodesTree`，**自动追踪依赖**到 `_nodesTree` 被重新赋值的时刻，无需手写 equalityFn。我们用 Zustand + 显式 `shallowEqual` 只能依赖**数组引用变化**作为变更信号，语义粒度更粗——这是 Zustand 模型与 MobX 模型的本质差异，不是 bug（详见 [research/tango-cross-review报告.md](skills/oss-visual-designer-project-context/research/tango-cross-review报告.md) §3.2）。

---

## 4. getState（同步读）

### 4.1 签名

```ts
/**
 * 同步读 store state（不订阅，不触发 re-render）
 *
 * 对应当前项目 reduxStore.getState().designerCanvas
 */
function getState(): TreeStoreState<TNode, TFlat, TExtra>;
```

### 4.2 契约（对照 fact-extraction §3.6）

1. **同步读**：返回当前 state 快照，不订阅
2. **用于异步回调 / 事件处理器**：避免闭包捕获过期值
3. **Zustand 原生支持**：`useStore.getState()` 或 store 实例的 `getState()`

### 4.3 调用场景（对照 fact-extraction §3.6 实测调用点）

| 场景 | 当前实现 | 框架实现 |
| --- | --- | --- |
| 事件回调读 state | `reduxStore.getState().designerCanvas.*` | `store.getState().*` |
| Promise 回调读 state | 同上 | 同上 |
| subscribe 回调读 state | 同上 | 同上 |
| 读 parent（不需要 children） | `byId[parentMap[id]]` | `getState().byId[getState().parentMap[id]]` |
| 读 parent（需要 children） | `getNodeById(components, parentId)` | `getNodeById(getState().components, parentId)` |

---

## 5. getNodeById（工具函数）

### 5.1 签名（01-data-model.md §4 已定义）

```ts
function getNodeById<TNode extends TreeNode>(
    components: TNode[],
    id: string,
): TNode | null;
```

### 5.2 契约（对照 fact-extraction §3.4）

- **递归遍历** components 树（O(n)），返回完整节点（含 children）的浅引用
- **禁止 mutation**：返回的是树中节点的直接引用
- **纯函数**，无副作用
- **与 `useNode` 区别**：useNode 订阅 byId[id]（FlatNode 不含 children）O(1)；getNodeById 遍历树返回完整节点 O(n)
- **空树防护**：`for (const node of components || [])`（utils.ts L142）

### 5.3 适用场景（对照 fact-extraction §3.4 调用场景）

- recalcGroupBounds 读父组节点（DesignerContent.tsx L296）
- generatorGroup/splitGroup 取完整节点（utils.ts L441/L449/L491）
- useOnDrop 读父节点 children
- getResizedComponents 取带 children 的 group 节点
- useConvertMenuState 读 state

---

## 6. 保存序列化

### 6.1 契约（对照 fact-extraction §3.7）

1. **直接读 `getState().components` 序列化**：单源后永远 fresh，无需 `getSaveableComponents`（已删）
2. **框架不提供序列化函数**：序列化逻辑由业务实现（框架只提供 `getState()` 同步读）
3. **业务序列化示例**（对照 DesignerContent.tsx L350-363）：

```ts
// 业务侧序列化（非框架代码）
const state = store.getState();
const serialized = JSON.stringify({
    components: state.components,        // 直接序列化
    extra: state.extra,                  // 业务数据（page/realtimeDataFlow 等）
    // customFieldsListMapping: {} —— 业务决定是否序列化
});
```

### 6.2 useImperativeHandle.getState

当前项目通过 `useImperativeHandle` 暴露 `getState()` 给外部（DesignerContent.tsx L375-384）。框架**不提供**此封装，由业务自行实现：

```ts
// 业务侧（非框架代码）
useImperativeHandle(ref, () => ({
    getState: () => store.getState(),
    triggerSave: () => { /* 业务保存逻辑 */ },
}));
```

---

## 7. 跨异步边界读路径（统一 API）

### 7.1 当前模式（fact-extraction §3.5）

当前项目有两类 ref 缓存模式：

1. **latestCache getter 模式**（DesignerContent.tsx L190-211）：用 getter 缓存 `getState()` 读取器
2. **useLatest hook**（hooks/useLatest.tsx L1-10）：`useRef(value)` + 每次 render 更新

### 7.2 框架统一 API

```ts
/**
 * 跨异步边界读最新 state 的 hook
 *
 * 统一当前两种模式：
 * - latestCache getter（DesignerContent.tsx L190-211）
 * - useLatest（hooks/useLatest.tsx L1-10）
 *
 * 返回一个稳定引用的 getter 函数，每次调用读最新 state
 */
function useLatestState(): () => TreeStoreState<TNode, TFlat, TExtra>;
```

### 7.3 实现草案

```ts
// 框架 useLatestState 实现
function useLatestState(): () => TreeStoreState<TNode, TFlat, TExtra> {
    const ref = useRef(store.getState());
    // subscribe 模式：store 变化时同步更新 ref（非 render 时更新）
    useEffect(() => {
        const unsubscribe = store.subscribe((state) => {
            ref.current = state;
        });
        return unsubscribe;
    }, []);
    return useCallback(() => ref.current, []);
}
```

**与当前的差异**：
- 当前 latestCache 用 getter 形式（`get state() { return reduxStore.getState().designerCanvas; }`），每次访问调 `getState()`
- 框架 `useLatestState` 返回 getter 函数，调用时读 `ref.current`
- **实现模式**：用 `store.subscribe` 订阅更新 ref（非"每次 render 更新"）。理由：仅在 render 时更新 ref 会有竞态风险——组件未 re-render 时 ref 是过期值（如 setTimeout / keydown 回调跨渲染读 state）。subscribe 模式保证非渲染时段 ref 也最新
- 两种模式本质相同：都是"同步读 store"的语法糖，不是缓存快照值

### 7.4 适用场景

| 场景 | 当前实现 | 框架实现 |
| --- | --- | --- |
| keydown 事件回调读 state | `latestCache.current.state` | `useLatestState()()` |
| Promise 回调读 state | `latestCache.current.configValidator` | 业务自行缓存或用 `getState()` |
| 拖拽 onDragStop 回调读 dataSource | `latestCache.current.dataSource` | 业务用 `useLatest(value)` 或 `getState()` |

> 框架提供 `useLatestState` 作为统一 API，但业务仍可直接用 `getState()`（更简单，无需 hook）。

---

## 7.5 useExtra（extra 字段订阅）

> **注**：本节为后续增量，最初设计草案将"读 extra"列为业务自行用 `useStore` 订阅。实际代码已将 `useExtra` 作为框架一级 hook 导出，内建 shallowEqual。

```ts
/**
 * extra 字段订阅 hook
 *
 * 业务用 selector 从 extra 中选取所需字段，内建 shallowEqual
 */
function useExtra<TData, TNode, TFlat, TExtra, U>(
    store: TreeStoreApi<TNode, TFlat, TExtra>,
    selector: (extra: TExtra) => U,
): U;
```

**实现**（`react/hooks.ts`）：
```ts
function useExtra(store, selector) {
    return useStoreWithEqualityFn(store, (state) => selector(state.extra), shallowEqual);
}
```

**与决策树的关系**：§8 决策树中"读 extra"原建议业务自行 `useStore`，实际已由 `useExtra` 封装，业务直接调 `useExtra(store, (extra) => extra.xxx)` 即可。

---

## 8. 读路径决策树（框架版）

```
要读 state？
├─ React 渲染期间
│   ├─ 读当前组件配置（字段级）
│   │   → useNode(id)
│   │     订阅 byId[id]，shallowEqual，字段级 re-render
│   │
│   ├─ 读整树（递归组件 / 图层树）
│   │   → useTree()
│   │     框架强制 shallowEqual
│   │
│   └─ 读 extra（page / meta / realtimeDataFlow）
│       → useExtra(store, (extra) => extra.xxx)
│         框架一级 hook，内建 shallowEqual
│
├─ 异步回调 / 事件处理器
│   ├─ 读最新 state（不订阅）
│   │   → store.getState()
│   │     同步读，不触发 re-render
│   │
│   ├─ 读父节点（不需要 children）
│   │   → getState().byId[getState().parentMap[id]]
│   │     O(1)
│   │
│   ├─ 读父节点（需要 children）/ 读目标节点（含 children）
│   │   → getNodeById(getState().components, id)
│   │     O(n) 但不 cloneDeep，返回浅引用
│   │
│   └─ 跨异步边界（统一 API）
│       → useLatestState()
│         返回 getter，调用时读最新 state
│
└─ 保存序列化
    → getState().components
      单源后永远 fresh，无需 getSaveableComponents（已删）
```

---

## 9. shallowEqual 约束

### 9.1 框架强制点

| API | shallowEqual | 约束 | 事实依据 |
| --- | --- | --- | --- |
| `useNode(id)` | ✅ 内建 | 字段级订阅粒度 | hooks.ts L89 |
| `useTree()` | ✅ 框架强制（默认 true） | 防止 byId 变化触发整树 reconcile | 03-read-path.md §5 易错点 |
| `useStore(store, selector)` | ⚠️ 业务自行 | 业务订阅 extra 字段时需手动加 | — |

### 9.2 不带 shallowEqual 的后果（对照 03-read-path.md §5）

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| `useTree({ shallow: false })` | byId 变化触发整树 reconcile | 框架默认 true，不可关闭 |
| 用 `byId[id]` 读 children | `undefined`（byId 不存 children） | 用 `getNodeById(components, id)` |
| 异步回调里用 `useNode` 的值 | 拿到过期值（闭包捕获） | 用 `store.getState()` 同步读 |
| 保存时调 `getSaveableComponents` | API 已删除，报错 | 直接序列化 `getState().components` |
| `useNode(id)` 返回 `undefined` 未判空 | `Cannot read property 'data' of undefined` | `field?.data` |

---

## 10. 25 bug 覆盖对照

### 10.1 读路径直接覆盖的 bug

| bug # | 描述 | 框架 API | 覆盖方式 | 事实依据 |
| --- | --- | --- | --- | --- |
| #15 | byId 不含 children | `getNodeById` | 返回带 children 的完整节点 | fact-extraction §6.2 |
| #23 | stale tree 防御性读取未统一封装 | `useNode` + `getNodeById` | 统一封装消除散落读取 | fact-extraction §6.2 |
| #24 | getResizedComponents 取不到带 children 节点 | `getNodeById` | 取带 children 供 getResizedComponents | fact-extraction §6.2 |
| #25 | useOnDrop trigger 未追加 recalcGroupInTree | `getNodeById` | 取节点供 recalc | fact-extraction §6.2 |

### 10.2 间接覆盖的 bug

| bug # | 描述 | 框架机制 | 事实依据 |
| --- | --- | --- | --- |
| #13 | handleAlign 闭包覆盖 | `useTree` 后闭包 fresh | fact-extraction §6.2 |
| #20 | 保存丢失 | `getState().components` 永远 fresh | fact-extraction §6.2 |
| #21 | recalcGroupBounds 读 stale parents.children | `getNodeById` 读 fresh | fact-extraction §6.2 |

---

## 11. 与前序文档的一致性核对

| 维度 | 00-overview.md / 01-02 | 本文档 | 一致性 |
| --- | --- | --- | --- |
| `useNode<TFlat>(id)` 签名 | 00 §5.2 | §2.1 | ✅ |
| `useTree<TNode>(options?)` 签名 | 00 §5.3 | §3.1 | ✅ |
| `getNodeById` 签名 | 01 §4.1 | §5.1 | ✅ |
| shallowEqual 强制 | 00 §5.3 | §9.1 | ✅ |
| useNode 返回 undefined | 00 §5.2 | §2.2 | ✅ |
| getState 同步读 | 00 §7.1 | §4 | ✅ |
| 跨异步边界 latestCache | 00 §2.1 | §7 | ✅ |
| 保存序列化直接读 components | 02 §2.2（setTree 后 fresh） | §6 | ✅ |

---

## 12. 相关文档

- [00-overview.md](./00-overview.md) §5.2-5.3, §5.6 —— API 签名草案对照标准
- [01-data-model.md](./01-data-model.md) §4 —— getNodeById 签名
- [02-write-path.md](./02-write-path.md) —— 写路径（updateNode 的订阅方）
- [04-plugin-system.md](./04-plugin-system.md) —— runtime data 插件（useRealtimeDataFlow / useCustomFieldsList 的框架归属）
- [design/src/designer-state/03-read-path.md](skills/oss-visual-designer-project-context/src/designer-state/03-read-path.md) —— 当前项目读路径权威
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §3 —— 事实基准

---

## 13. 跨 iframe 边界（未来场景，当前不涉及）

> **状态**：未来场景备忘。当前 designer-core 假设在同一窗口内（共享 store 引用），未涉及跨 iframe 通信。

如果渲染器在 iframe 里（如沙箱预览、外嵌场景）：

- **不能共享 store 引用**：iframe 有独立的 JS 上下文，Zustand store 实例无法跨窗口传递
- **需走 postMessage + 全量序列化**：主窗口 `getState().components` 序列化后 postMessage 发送，iframe 侧反序列化后用 `setTree` 写入自己的 store 副本
- **多实例路由**：用 channelId 区分多个 iframe
- **握手流程**：iframe 发 initialized → 主窗口注册 → 后续消息带 channelId
- **参考**：Tango 的 sandbox 包（CodeSandbox sandpack 协议）
