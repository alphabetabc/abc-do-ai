# useDesigner 迁移可行性审计

> 创建时间：2026-07-20
> 关联：[`useDesigner订阅粒度调研.md`](./useDesigner订阅粒度调研.md)
> 触发问题：[`ConfigurationPanel.tsx#L27`](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx#L27) 的 `useDesigner()` 误订阅

## 0. 背景

`useDesigner()` 当前返回 React Context 的 `{ state, setState, ... }`。`state` 包含 `components` / `page` / `meta` / `realtimeDataFlow` / `customFieldsListMapping` / `undo` / `redo`，任何字段更新都触发 Context value 变化，所有消费方重渲染。

讨论的方案是把 `state` 整体搬进主 Redux store 的 `designerCanvas` slice。本文档是**落地前的可行性审计**，回答 3 个问题：

1. **19 个 `useDesigner()` 调用方的 state 消费模式是什么**？哪些可以在搬 Redux 后零改动（用兼容壳），哪些必须改？
2. **有没有"setState 之后直接 mutation state"** 这种 Redux 不允许的写法？
3. **`useDesignerSettingChange` 和 `runtimeComponentsTrigger` 能用什么 Redux 原生机制替代**？

---

## 1. `useDesigner()` 调用方审计（19 个文件）

排除 2 个 `.bak` 备份，实际活跃 **17 个**。

### 1.1 分类（按"state 读取时机"）

| 类别 | 文件 | 模式 | 改造难度 |
| --- | --- | --- | --- |
| **A. 仅渲染体读** | `configuration-panel/index.js` | `useMemo([state.components])` | 🟢 易 |
| | `formily/FedxReportContext.tsx` | `useMemo([state.realtimeDataFlow])` | 🟢 易 |
| | `recursion-components/index.tsx` | `useMemo([state.components])` | 🟡 中（整树订阅） |
| | `designer/canvas-graph/index.tsx` | `useMemo([state.components])` | 🟡 中 |
| **B. 仅回调读（误订阅）** | `common/field/layout-block/config/ConfigurationPanel.tsx` | 回调内 `state.components` | 🟢 易（用 `useStore`） |
| | `configuration-panel/group/index.js` | 回调内 `state.components` | 🟢 易 |
| | `common/dnd/DropContainer.tsx` | 回调内 `state.components` | 🟢 易 |
| **C. 工具函数包一层** | `context-menu/DesignerContextMenu.tsx` | 把 `designerState` 传给 `layerManager.xxx` | 🟠 难（`layerManager` 重构） |
| | `context-menu/hooks/useConvertMenuState.tsx` | 缓存在 `latestCache.designerState` | 🟡 中 |
| | `aside-panel/layers-tree/tree/index.tsx` | 把 `state` 传给 `useOnDrop` | 🟡 中 |
| **D. 渲染 + 回调混用** | `designer/DesignerContent.tsx` | `latestCache.current.state` 跨异步 | 🟡 中 |
| | `designer/renderer/designer-field/index.tsx` | 渲染读 `state.components` + 回调读 + 直接 mutation | 🔴 难 |
| | `designer/toolbar/index.js` | `updater.watch` + 回调内 setState | 🟡 中 |
| | `designer/aside-panel/layers-tree/index.jsx` | `useMemo([state.components])` + 回调 setState | 🟡 中 |
| | `designer/renderer/hooks/useDebounceMergeConfig.tsx` | 回调内 `state.components` + **高频路径** | 🔴 难（高频拖拽） |
| **E. 仅用 setState** | `configuration-panel/page/index.jsx` | `setState({ page })` + **render 内 mutation** | 🔴 难（见 §2） |
| | `designer/canvas-graph/index.tsx`（handleAlign） | 回调内 `setState({ components })` | 🟢 易 |
| **F. 仅用方法（不读 state）** | `designer/canvas-graph/index.tsx`（setState 字段） | `setState` 操作组件 | 🟢 易 |
| | `designer/recursion-components/index.tsx` | 渲染时读 `state.components` | 🟢 易 |
| | `formily/FedxReportContext.tsx`（provider） | 只用 `realtimeDataFlow.record` | 🟢 易 |

### 1.2 关键调用方详情

#### `designer/renderer/hooks/useDebounceMergeConfig.tsx`（高频路径）

```ts
const setState = usePersistFn((nextState, isForceUpdate = true, uniqueId?: any) => {
    if (!isForceUpdate && 'components' in nextState) {
        state.components = nextState.components; // 直接 mutation！
        runtimeComponentsTrigger.trigger(getRuntimeTriggerKey(uniqueId), null, { data: nextState.components });
        runtimeComponentsTrigger.trigger(syncDesignerUpdateKey, null, {});
        return;
    }
    // ...
    innerSetState(nextState);
});

// 使用方
setState({ components: results }, false, selected);  // 走 isForceUpdate=false 分支
```

**关键发现**：`isForceUpdate=false` 这条**绕过 React 更新**的路径是 **拖拽期间高频写入** 的优化（DataProvider L113-121）。直接 mutation 状态 + EventBus 通知。

搬到 Redux 后：
- Redux 走 Immer 不允许外部 mutation，必须 dispatch
- 拖拽期间 60+ dispatches/秒，需要 `batch` 包
- 还需要给 `useDesignerSettingChange` 一个 Redux 等价物（`useSelector(s => getFieldConf(s.designerCanvas.components, uniqueId), shallowEqual)`）

#### `designer/canvas-graph/index.tsx`

- L228: `useMemo([state.components])` — 渲染读
- L312, L342: 回调内 `state.components` + `setState`
- 改造：渲染部分用 `useSelector`，回调部分用 `useStore` 或闭包（兼容壳）

#### `designer/recursion-components/index.tsx`

- 整树 `useMemo([state.components])` 用于递归渲染
- 这个组件**必须订阅整树变化**，因为它要响应 children/顺序变化
- 改造：`useSelector(s => s.designerCanvas.components, shallowEqual)` 等价

#### `designer/aside-panel/layers-tree/index.jsx`

- L38-40: `useMemo([state.components])` — 渲染读
- L31, L98: 回调内 `setState({ components })`
- 调用 `useSyncDesignerUpdate`（见 §4）
- 改造：兼容壳 + `useSyncDesignerUpdate` 改为 `useSelector`

#### `designer/renderer/designer-field/index.tsx`

- L56: `const dataSource = useDesignerSettingChange(uniqueId, propsDataSource);`
- L84: `const { state, setState } = useDesigner();`
- L187, L218, L221: 回调内 `state.components`
- **L220**: `parents.children = parents.children.filter(...)` — **直接 mutation**
- L342-343: `mergeFieldConfig(state.components, ...)` + `setState({ components: results })`
- 改造：渲染 + 回调都要重做

#### `designer/DesignerContent.tsx`

- L133: `const { state, setState, ... } = useDesigner();`
- L145: `latestCache.current.state` 跨异步边界使用
- L172: `setState(dataSource);` — 初始化全数据
- 改造：兼容壳 + `useStore` 跨异步

---

## 2. `setState` 后直接 mutation 审计

**审计结果：发现 8 处直接 mutation**，分布在 5 个文件：

| 文件 | 行 | 写法 | 严重度 |
| --- | --- | --- | --- |
| `designer/canvas-graph/index.tsx` | (setState 内部) | `state.components = nextState.components` (DataProvider L117) | 🔴 |
| `designer/renderer/hooks/useDebounceMergeConfig.tsx` | 调用 | `setState(..., false, selected)` 触发 isForceUpdate=false | 🔴 |
| `designer/layer-manager/move/index.ts` | L19, L21, L42, L44 | `components.splice/push/unshift` | 🔴 |
| `designer/layer-manager/lock/index.ts` | L10, L24 | `config.isLock = true/false` | 🔴 |
| `designer/layer-manager/visible/index.ts` | L10, L24 | `config.isHidden = true/false` | 🔴 |
| `designer/configuration-panel/page/index.jsx` | L29-32 | `Object.assign(state.page, {...})` (render 内) | 🔴 |
| `designer/renderer/designer-field/index.tsx` | L220 | `parents.children = parents.children.filter(...)` (回调内) | 🔴 |

**关键判断**：

1. **layer-manager** 的 mutation 已经是"预期内的"——`getFieldOrderBy` 返回的 `components` 引用就是 `state.components` 的某个嵌套数组。但因为后续 `setChildren` 会创建新引用并通过 `handle` 回写，这部分 mutation 其实**会被覆盖**。属于"看似 mutate 但最终由 setState 兜底"的写法。
2. **DataProvider L117** 的 mutation 是**有意的优化**（拖拽高频路径），EventBus 通知。
3. **`configuration-panel/page/index.jsx` L29-32** 是 **render 内 mutation**，更糟糕：每次 render 都修改 state.page，**根本不需要 setState 就会让 useDesigner 消费方重渲染**。属于 bug。

**搬到 Redux 后处理策略**：

- **layer-manager 4 处 mutation**：用 `getFieldOrderBy(...).map(filter)` / `[...components, temp]` 替换，保持不可变。
- **lock/visible 2 处 mutation**：`config.isLock = true` → `setChildren` 工具函数返回新对象，配置写在新对象上。
- **DataProvider 高频路径**：`batch(dispatch(setComponents(...)))`，单次 dispatch 触发一次通知。
- **page/index.jsx 那个 bug**：本来就要改的 bug，借迁移修复。

**估算改造成本**：layer-manager 6 个文件 + page/index.jsx + designer-field/index.tsx ≈ **8 个文件**，每个 30-60 分钟。

---

## 3. `useDesignerSettingChange` 调用方审计

### 3.1 调用点

| 文件 | 用途 | 改造 |
| --- | --- | --- |
| `designer/renderer/designer-field/index.tsx` L56 | 每个 DesignerField 实例订阅自己 uniqueId 的变化 | 改为 `useSelector(s => getFieldConf(s.designerCanvas.components, uniqueId), shallowEqual)` |
| `designer/renderer/DesignerField.bak.jsx`（备份） | 同上 | 不用改 |

### 3.2 实现逻辑（DataProvider L41-67）

```ts
export const useDesignerSettingChange = (uniqueId, ownerSetting) => {
    const [setting, setSetting] = useState(ownerSetting);
    // 订阅 runtimeComponentsTrigger 的 `@@key-uniqueId@@` 事件
    useEffect(() => {
        const subscribeKey = getRuntimeTriggerKey(uniqueId);
        runtimeComponentsTrigger.on(subscribeKey, null, subscribe);
        return () => runtimeComponentsTrigger.off(subscribeKey, null, subscribe);
    }, [uniqueId]);

    useEffect(() => {
        if (!_.isEqual(ownerSettingRef.current, ownerSetting)) {
            ownerSettingRef.current = ownerSetting;
            setSetting(ownerSetting);
        }
    }, [ownerSetting]);

    return setting;
};
```

**搬到 Redux 后等价物**：

```ts
// 新增 useFieldConf hook
export const useFieldConf = (uniqueId: string) => useSelector(
    (s: RootReducerState) => getFieldConf(s.designerCanvas.components, uniqueId),
    shallowEqual
);
```

**功能对比**：

| 特性 | `useDesignerSettingChange` | `useFieldConf` (Redux) |
| --- | --- | --- |
| 按 uniqueId 订阅 | ✅ | ✅ |
| 性能 | EventBus，O(1) 通知 | `useSelector` + Immer 浅比较，O(tree) 比对 |
| 高频拖拽 | 走 `setState(false, uniqueId)` 路径**不触发 React re-render**，只触发订阅者 | 走 dispatch，**会触发 React re-render**（即使 `useSelector` 比对未变化） |
| 删除组件时清理 | EventBus listener 显式 `off` | Redux 无需清理，组件 unmount 自动 unsubscribed |

**关键风险**：

`useDesignerSettingChange` 在拖拽期间通过 EventBus 通知，**不经过 React 渲染管线**，所以即使 440 个 DesignerField 都在监听，也只有被拖动那个 + 视觉上重叠的几个会重渲染。

搬到 Redux 后，**任何 dispatch 都会让所有 `useSelector` 比对一次**。440 个组件 × 树形比对 = 几十毫秒，可能掉帧。

**缓解方案**：
- 用 `useSyncExternalStore` 直接订阅 store 变更（绕过 React 调度）
- 或者在 `designerCanvas` slice 里用 `getFieldConf` 的 memoization + WeakMap 缓存
- 或者拆成更细粒度的 action（`updateFieldConfig(uniqueId, patch)`），用 `useSelector(s => s.designerCanvas.byId[uniqueId])` 订阅单个字段

**需要决策**：拖拽时是接受一次 React re-render（最简实现），还是做精细化优化（性能更好但复杂度高）。

---

## 4. `runtimeComponentsTrigger` 触发/监听审计

**审计结果**：

- `runtimeComponentsTrigger` **只在 `DataProvider.tsx` 内部使用**（grep 全仓只有这一个文件）
- 触发点 2 处（`syncDesignerUpdateKey` + `getRuntimeTriggerKey(uniqueId)`）
- 监听点 3 处（`useSyncDesignerUpdate` + `useDesignerSettingChange`）

**搬到 Redux 后**：

- `syncDesignerUpdateKey` 触发 → 各 `useSelector` 自动响应
- `getRuntimeTriggerKey(uniqueId)` 触发 → `useFieldConf(uniqueId)` 自动响应
- `runtimeComponentsTrigger` 整个删掉
- `useSyncDesignerUpdate` 简化为 `useSelector(s => s.designerCanvas.components, noop)` 或直接删（如果在 useFieldConf 后不再需要）

---

## 5. 迁移路径（推荐）

### Phase 0：架构基线（半天）
- 建立 `designerCanvas` slice（包含 components / page / meta / realtimeDataFlow / customFieldsListMapping / undo / redo）
- 兼容层：`useDesigner` 改为 `return useStore().getState().designerCanvas`
- `setState` 兼容层：旧调用方写法保留，内部走 dispatch

### Phase 1：迁移 + 兼容（1.5 天）
- 17 个 `useDesigner()` 调用方**行为不变**（兼容壳）
- 修掉 8 处直接 mutation（按 §2 表的策略）
- 修掉 `configuration-panel/page/index.jsx` 的 render 内 mutation（顺手 bug fix）
- `pnpm tsc --noEmit` 通过 + 手动冒烟（点击、拖拽、配置面板、撤销/重做）

### Phase 2：替换订阅（1.5 天）
- `useSyncDesignerUpdate` → `useSelector` 或删除
- `useDesignerSettingChange` → `useFieldConf`
- `runtimeComponentsTrigger` 删除
- 摸底：拖拽场景的 Profiler，看是否掉帧

### Phase 3：优化（可选，1 天）
- 决定拖拽期间是否需要 `useSyncExternalStore` 优化
- 给 `designerCanvas` slice 加 action 细分（`updateFieldConfig` / `moveField` 等）
- 评估是否需要 `redux-undo` 替代手写 undo/redo

**总工时估算：3-4 天**

---

## 6. 结论

### 6.1 可行性：**可行**

没有发现根本性障碍。直接 mutation 集中在 `layer-manager` 4 个文件 + page/index.jsx + designer-field/index.tsx，模式比较一致，可以批量改造。

### 6.2 风险点

| 风险 | 严重度 | 缓解 |
| --- | --- | --- |
| 拖拽期间 440 个 DesignerField 全部跑 `useSelector` 比对 | 🟠 中 | 摸底 Profiler；必要时 `useSyncExternalStore` 优化 |
| 8 处直接 mutation 漏改导致行为不一致 | 🟠 中 | 写单测覆盖 `layerManager.xxx` 函数；phase 1 严格冒烟 |
| `useDesignerSettingChange` 删了之后 440 组件的 EventBus 优化没了 | 🟠 中 | Phase 3 评估 + 优化 |
| 跨微应用嵌入（`DesignerParserEntry.js`）的影响 | 🟡 低 | 排查 + 测试 |

### 6.3 收益

1. **消除 6+ 个"误订阅"调用方**（ConfigurationPanel / DropContainer / group/index.js 等）
2. **干掉整个 `runtimeComponentsTrigger` EventBus**
3. **`useDesignerSettingChange` 替换为真正的 field-level subscription**
4. **DevTools 支持**：拖拽/撤销/重做的完整 action log
5. **`useDesigner` 兼容壳**让 17 个文件零改动，迁移平滑

### 6.4 下一步

可以开 **task-006** 了。建议先做 Phase 0 + Phase 1（兼容层 + 修 mutation），稳定后再做 Phase 2/3。

如果要继续，告诉我"开 task-006"即可。

---

## 7. 深度追问：`useDebounceMergeConfig` 和 `runtimeComponentsTrigger` 的本质

> 用户追问：merge 配置时整个 components 树被重建了，能不能优化掉？

### 7.1 问题本质

```
配置面板 onChange（60+ 次/秒）
    ↓ useDebounceMergeConfig 合并（30ms 防抖）
    ↓ setState({ components: results }, false, selected)   ← isForceUpdate=false
    ↓ DataProvider.tsx L115-121: state.components = nextState.components（直接 mutation）
    ↓ runtimeComponentsTrigger.trigger(@@uniqueId@@)
    ↓ useDesignerSettingChange(uniqueId) → setSetting
    ↓ 只有被改的那个 DesignerField 重新渲染
```

**关键问题**：`mergeFieldConfig` 每次返回**整个 components 树的新引用**，这是导致整树 re-render 的根因。

### 7.2 三个东西的判断

| 名字 | 能否干掉 | 替代方案 |
|---|---|---|
| `runtimeComponentsTrigger` EventBus | ✅ **可彻底删** | Redux 原生订阅 + 细粒度 dispatch |
| `useDesignerSettingChange` | ✅ **可彻底删** | `useSelector(s => s.byId[uniqueId], shallowEqual)` |
| `useSyncDesignerUpdate` | ✅ **可彻底删** | 不再需要"全局通知刷一下" |
| `useDebounceMergeConfig` 的**防抖**部分 | ⚠️ **看方案** | 见 7.3 方案对比 |

### 7.3 三种迁移方案对比

| 方案 | EventBus | 防抖 | byId 索引 | 改动量 | 拖拽性能 |
|---|---|---|---|---|---|
| **现状** | ✅ | ✅ | ❌ | — | ⭐⭐⭐（最优，但反模式） |
| **方案 A：保留防抖，删 EventBus** | ❌ | ✅ | ❌ | 🟢 小 | ⭐⭐（整树重建，440 组件 selector 比对） |
| **方案 B：拆 byId，全删** | ❌ | ❌ | ✅ | 🟠 中 | ⭐⭐⭐（字段级 dispatch，只 1 个组件 re-render） |

### 7.4 推荐方案 B（拆 byId）的数据结构

```ts
interface DesignerCanvasState {
    components: WidgetItem[];             // 整树（仅 group/拖入新组件时改）
    byId: Record<string, FieldConf>;      // 每个字段单独存（高频更新）
    page: PageConfig;
    // ...
}
```

#### onChange 改造

```ts
// 旧
const submitMergedConfig = (opts, value) => {
    const results = mergeFieldConfig(state.components, opts, value);
    setState({ components: results }, false, selected);  // isForceUpdate=false 绕过 React
};

// 新（方案 B）
const updateField = (uniqueId: string, patch: Partial<FieldConf>) => {
    dispatch({ type: 'designerCanvas/updateField', payload: { uniqueId, patch } });
};
// → Immer 只更新 byId[uniqueId]，组件用 useSelector 订阅自己，无防抖无绕过
```

#### reducer 实现

```ts
builder.addCase(updateField, (state, { payload: { uniqueId, patch } }) => {
    state.byId[uniqueId] = { ...state.byId[uniqueId], ...patch };
    // components 数组本身**不重建**，由单独的 syncComponentsFromById action 维护
});
```

#### group 操作（需要整树）走另一条路径

```ts
// group/拖入新组件/排序 等"结构性"操作
dispatch({ type: 'designerCanvas/setComponents', payload: newTree });
// 配套：同步重建 byId 索引（用 WeakMap memoization）
```

### 7.5 真实难点

`mergeFieldConfig` 当前是**递归重建整树**（输入 `parentId`，遍历找到组件并 patch）。需要拆成两个函数：

```ts
// 整树重建（保留给 group/拖入用）
mergeFieldConfig(tree: WidgetItem[], opts: { parentId: string }, value: any): WidgetItem[]

// 字段级更新（新加）
patchFieldConf(byId: Record<string, FieldConf>, uniqueId: string, patch: any): void
```

调用方按需选用：
- 配置面板 → `patchFieldConf`（高频，无防抖）
- group/移动/删除 → `mergeFieldConfig`（低频，可保留兼容壳）

### 7.6 收益

1. **彻底干掉 EventBus**（213 行代码删掉）
2. **`useDebounceMergeConfig` 删掉**（30ms 防抖逻辑不再需要）
3. **拖拽性能更优**：1 次 dispatch 只触发 1 个组件 re-render，而不是全树 diff
4. **DevTools 可观测**：每次 onChange 是一个 action，可回放
5. **`useDesignerSettingChange` 删掉**：用真正的 `useSelector` 字段级订阅
6. **`useSyncDesignerUpdate` 删掉**：不再需要"通知所有组件刷一下"

### 7.7 Phase 调整建议

原 Phase 2（替换订阅）需要扩成 Phase 2A + 2B：
- **Phase 2A**：拆 byId、删 EventBus、`useDesignerSettingChange` → `useSelector`（方案 B 的核心）
- **Phase 2B**：删 `useDebounceMergeConfig`、删 `useSyncDesignerUpdate`、配置面板改用 `patchFieldConf`

如果走方案 A（保守），可以保持原 Phase 0+1+2+3 节奏。

---

## 8. 深度追问：`renderer/utils.js` 的 22 个函数如何适配方案 B

> 用户追问：涉及一堆方法，需要深入调研可行性方案

### 8.1 函数清单与适配矩阵

| # | 函数 | 行 | 当前实现 | byId 适配 | 适配策略 |
|---|---|---|---|---|---|
| 1 | `mergeFieldConfig` | L214 | 递归整树 + Immer，O(tree) | O(1) | **拆成两个**：保留原函数给 drillDown level>0；新增 `patchFieldConf(byId, id, patch)` |
| 2 | `getFieldConf` | L149 | 递归遍历找组件 | O(1) | **替换**为 `byId[id]` |
| 3 | `setLevelPath` | L170 | 递归设置 drillDownLevel | 仍需遍历（level 依赖父节点） | **保留**遍历语义 |
| 4 | `setChildren` | L121 | 递归替换某 id 的 children | 仍需遍历（结构性变更） | **保留** |
| 5 | `getParent` | L93 | 递归找父节点 | O(1) | **替换**为 `parentMap[id]` |
| 6 | `getFieldOrderBy` | L261 | `findIndex` 找位置 | 由 parentMap + byId 推导 | **改写**为索引版本 |
| 7 | `getGroupSizePosition` | L311 | 遍历 children 算尺寸 | 不变 | **保留**（group 用） |
| 8 | `resetChildrenPosition` | L386 | map children | 不变 | **保留** |
| 9 | `generatorGroup` | L426 | 创建 group + mutation | 不变 | **保留**（结构性变更） |
| 10 | `splitGroup` | L468 | 拆分 group + mutation | 不变 | **保留**（结构性变更） |
| 11 | `generatorField` | L62 | 创建组件 + cloneDeep | 不变 | **保留**（结构性变更） |
| 12 | `deleteFieldByUniqueId` | L273 | splice + mutation | 不变 | **保留**（结构性变更） |
| 13 | `resetUniqueId` | L19 | cloneDeep + map | 不变 | **保留** |
| 14 | `orderBy` | L250 | splice 原地交换 | 不变 | **保留** |
| 15 | `getSelectedKeys` | L293 | 调用 `getParent` | 不变 | **保留**（依赖 parentMap） |
| 16 | `flatDesignerList` | L500 | reduce 扁平化 | 不变 | **保留**（用于初始化索引） |
| 17 | `eachTreeNode` | L521 | 递归遍历 | 不变 | **保留** |
| 18 | `fieldVisitor` | L544 | 递归遍历 children | 不变 | **保留** |
| 19 | `syncGroupSize2Children` | L567 | 递归算 group 子节点 resize | 不变 | **保留** |
| 20 | `generateConfigByString` | L43 | JSON.parse + resetUniqueId | 不变 | **保留** |
| 21 | `clearEmptyCollection` | L403 | 过滤空 children | 不变 | **保留** |
| 22 | `setLevelData` | L192 | 递归设置某 level 数据 | 不变（仅 drillDown 用） | **保留** |

### 8.2 byId 的存储结构（推荐方案 B3：只存 data，不存 children）

```ts
interface DesignerCanvasState {
    components: WidgetItem[];                              // 整树（结构性变更）
    byId: Record<string, FlatField>;                       // 扁平索引（高频更新）
    parentMap: Record<string, string>;                     // id → parentId（O(1) 找父）
}

interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;                                      // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any };             // 不含 children
}
```

**为什么是 B3 而不是 B1（存完整 FieldItem）**：
- 组件渲染只读 `data.config`（width/height/left/top/isLock/isHidden…）
- `children` 在递归渲染时由 `components` 树提供
- byId 只存渲染所需的"叶子数据"，避免和 components 树的双源同步问题

### 8.3 需要新增的工具函数

```ts
// ============ 索引构建（一次性，O(n)）============
/**
 * 从整树构建扁平索引 + 父子映射
 * 在 setComponents / generatorField / deleteFieldByUniqueId / generatorGroup / splitGroup 后调用
 */
export function buildIndex(components: WidgetItem[]): {
    byId: Record<string, FlatField>;
    parentMap: Record<string, string>;
};

// ============ O(1) 字段操作（高频路径）============
/**
 * 配置面板 onChange / 拖拽 onDragStop 用
 * 直接 patch byId[id]，不重建整树
 */
export function patchFieldConf(
    byId: Record<string, FlatField>,
    uniqueId: string,
    patch: any,                                            // { config?: {...}, ... }
    options?: { replace?: string[]; level?: number }
): void;

export function getFieldById(
    byId: Record<string, FlatField>,
    uniqueId: string
): FlatField | undefined;

export function getParentIdById(
    parentMap: Record<string, string>,
    uniqueId: string
): string | undefined;

export function removeFieldFromIndex(
    byId: Record<string, FlatField>,
    parentMap: Record<string, string>,
    uniqueId: string
): void;

// ============ 保留原版（低频路径）============
// mergeFieldConfig / setChildren / getGroupSizePosition / resetChildrenPosition /
// generatorGroup / splitGroup / generatorField / deleteFieldByUniqueId /
// setLevelPath / setLevelData / eachTreeNode / fieldVisitor /
// flatDesignerList / syncGroupSize2Children / clearEmptyCollection /
// resetUniqueId / orderBy / getSelectedKeys / getFieldOrderBy /
// generateConfigByString / getParent / getFieldConf
//
// 其中 getParent / getFieldConf / getFieldOrderBy 提供"由索引推导"的快路径版本
```

### 8.4 调用方改造矩阵

| 调用方 | 当前 | 改造后（方案 B） |
|---|---|---|
| `ConfigurationPanel.onValueChange` | `submitMergedConfig({ parentId }, value)` | `dispatch(updateFieldConfig(uniqueId, value))` → 内部 `patchFieldConf` |
| `DesignerField.onValueChange` | `setState({ components: mergeFieldConfig(...) })` | `dispatch(updateFieldConfig(uniqueId, value))` |
| `DesignerField.onDragStop` | `mergeFieldConfig` + `setChildren` 重建 group | 拆成多次 `dispatch(updateFieldConfig)` + 最后 `dispatch(setComponents)` 重建 group |
| `layers-tree` 锁定/隐藏 | `handleValueChanged({ config: { isLock } })` | `dispatch(updateFieldConfig(selected, { config: { isLock } }))` |
| `layer-manager.move*` | splice + setState 整树 | `dispatch(setComponents(newTree))` + `buildIndex` |
| `layer-manager.delete` | splice + setState | `dispatch(setComponents(newTree))` + `buildIndex` |
| `layer-manager.group` | `generatorGroup` + mutation | `dispatch(setComponents(newTree))` + `buildIndex` |
| `layer-manager.splitGroup` | `splitGroup` + mutation | `dispatch(setComponents(newTree))` + `buildIndex` |
| `canvas-graph.handleAlign` | setState 整树 | `dispatch(setComponents(newTree))` + `buildIndex` |
| `RecursionComponents` 渲染 | `useMemo([state.components])` | `useSelector(s => s.designerCanvas.components, shallowEqual)` |
| `DesignerField` 渲染 | `useDesignerSettingChange(uniqueId, propsDataSource)` | `useFieldConf(uniqueId)` → `useSelector(s => s.designerCanvas.byId[uniqueId], shallowEqual)` |
| `layers-tree` 渲染 | `useMemo([state.components])` | `useSelector(s => s.designerCanvas.components, shallowEqual)` |

### 8.5 关键设计决策

#### 决策 1：byId 还是 components 树作为单一数据源？

**采用双源**：
- `components` — 单一真相源（结构性变更时整树替换）
- `byId` / `parentMap` — 派生索引（每次 setComponents 后 `buildIndex` 重建）

理由：
- 组件渲染需要 children 递归结构（components 提供）
- onChange 高频路径只需 O(1) 查 byId
- `buildIndex` 是 O(n)，但只在结构性变更时调用（拖入/删除/group），不会高频

#### 决策 2：buildIndex 的成本

- 440 个组件：约 1-2ms（一次 reduce + 一次 map）
- 调用频率：拖入新组件/删除/group/split——这些是用户操作，不是高频拖拽
- 可接受

#### 决策 3：components 和 byId 的同步保证

- `setComponents` action 内部：先 `state.components = newTree`，再 `state.byId = buildIndex(newTree).byId`，再 `state.parentMap = buildIndex(newTree).parentMap`
- 用 Immer 的 draft 保证不可变
- 调用方不需要关心同步

#### 决策 4：mergeFieldConfig 的去留

**保留原版 + 新增 byId 版**：
- `mergeFieldConfig(tree, opts, value)` — drillDown level>0 时仍要按 parentId 找
- `patchFieldConf(byId, id, patch)` — 普通配置面板更新用

理由：drillDown（轮播子组件）的 level 处理依赖树结构，不能光改 byId。但 90% 的 onChange 是普通 config 更新，走 `patchFieldConf`。

### 8.6 改造后的 utils.js 结构

```
utils.js（约 600 行）
├── 索引工具（新增 ~80 行）
│   ├── buildIndex
│   ├── patchFieldConf
│   ├── getFieldById
│   ├── getParentIdById
│   └── removeFieldFromIndex
│
├── 字段级操作（新增 ~40 行）
│   └── mergeFieldConfigFast (byId 版走 O(1))
│
├── 整树操作（保留原版，~250 行）
│   ├── mergeFieldConfig
│   ├── setChildren
│   ├── getGroupSizePosition
│   ├── resetChildrenPosition
│   ├── generatorGroup
│   ├── splitGroup
│   ├── generatorField
│   ├── deleteFieldByUniqueId
│   └── setLevelPath / setLevelData
│
├── 递归遍历（保留原版，~100 行）
│   ├── eachTreeNode
│   ├── fieldVisitor
│   ├── flatDesignerList
│   └── syncGroupSize2Children
│
└── 杂项（保留原版，~120 行）
    ├── resetUniqueId
    ├── generateConfigByString
    ├── clearEmptyCollection
    ├── getFieldConf (兼容壳，内部走 byId)
    ├── getParent (兼容壳，内部走 parentMap)
    ├── getFieldOrderBy (兼容壳，内部走索引)
    ├── getSelectedKeys
    └── orderBy
```

### 8.7 风险评估

| 风险 | 严重度 | 缓解 |
|---|---|---|
| byId 和 components 不同步 | 🟠 中 | setComponents 内部强制 buildIndex；写单测覆盖 |
| buildIndex O(n) 拖慢 group 操作 | 🟢 低 | 440 组件约 1-2ms，可接受 |
| `mergeFieldConfig` 和 `patchFieldConf` 双路径混用 | 🟡 中 | Phase 1 严格审计调用方；优先用 patchFieldConf |
| `getFieldConf` 兼容壳多走一次 cloneDeep | 🟢 低 | 由 caller 决定要不要 await buildIndex |
| `setLevelPath` 仍依赖树遍历 | 🟢 低 | 改为遍历 byId + parentMap 推导 |
| drillDown level>0 场景怎么办 | 🟠 中 | 保留原 `mergeFieldConfig`；用单测覆盖 |

### 8.8 收益再总结

1. **彻底干掉 EventBus + useDesignerSettingChange + useSyncDesignerUpdate + useDebounceMergeConfig**（4 个反模式）
2. **onChange 路径变成真正的 O(1)**：1 个 dispatch + 1 个组件 re-render
3. **components 树只在结构性变更时改**（拖入/删除/group），拖拽期间 components 引用稳定
4. **DevTools 可观测**：每个 onChange 是一个 action
5. **store 之外的"字段查表"工具可直接复用 byId**：例如 `data-fetcher` / `interaction` 插件

### 8.9 Phase 调整（终版）

- **Phase 0**（0.5 天）：建 `designerCanvas` slice（含 components / byId / parentMap）+ `buildIndex` 工具 + 兼容壳
- **Phase 1**（1.5 天）：修 8 处 mutation + `useDesigner` 兼容层 + 冒烟
- **Phase 2A**（1 天）：拆 byId、`useDesignerSettingChange` → `useFieldConf`、`useSyncDesignerUpdate` → 删、`mergeFieldConfig` → `patchFieldConf`
- **Phase 2B**（1 天）：删 `useDebounceMergeConfig`、配置面板改走 `patchFieldConf`、拖拽 onDragStop 改走 `patchFieldConf`
- **Phase 3**（1 天，可选）：Profiler 摸底，决定是否需要 `useSyncExternalStore` 或更细粒度 action

**总工时估算 4-5 天**。

---

## 9. `cloneDeep` 滥用审计

> 用户追问：cloneDeep 的使用是否合理？

### 9.1 现状：designe r目录里 10 处 cloneDeep

```
src/designer/renderer/utils.js
├── L20   resetUniqueId        cloneDeep(fields)
├── L67   generatorField       cloneDeep(opts)
├── L95   getParent            cloneDeep(fields)        ❌ 完全多余
├── L150  getFieldConf         cloneDeep(fields)        ❌ 完全多余
├── L204  resetObjectSealed    工具函数                  ✅ 合理
├── L267  getFieldOrderBy      rebuild=true 时 cloneDeep ⚠️ 双重 cloneDeep
└── L502  flatDesignerList     cloneDeep(curr)          ❌ 完全多余

src/designer/common/dnd/helper.ts
└── L58   fetchMaterialSchema  cloneDeep({...materialInfo, data}) ✅ 合理

src/designer/aside-panel/layers-tree/index.jsx
└── L54   已注释的 cloneDeep    ✅ 不算

src/designer/toolbar/comp/dataset/DataSetList.tsx
└── L120  dataSetList 格式化   ⚠️ 待确认
```

### 9.2 三类分类

#### A. 合理（防止外层引用污染）— 4 处

| 文件:行 | 函数 | 原因 |
|---|---|---|
| `utils.js:20` | `resetUniqueId` | 给外部 fields 重新生成 uniqueId，**会改 data**，必须 cloneDeep |
| `utils.js:67` | `generatorField` | 给外部 opts 加 uniqueId，**会改 options**，必须 cloneDeep |
| `utils.js:204` | `resetObjectSealed` | 工具函数，含义明确 |
| `helper.ts:58` | `fetchMaterialSchema` | 给第三方模块的 defaultValue 加 resetDropItem2PointerPosition 信息，**会改** |

#### B. 不合理（纯读却 cloneDeep）— 3 处 ⚠️

| 文件:行 | 函数 | 问题 | 严重度 |
|---|---|---|---|
| `utils.js:95` | `getParent` | 整个 components 树 cloneDeep，但函数内只 reduce 读，**从不修改任何字段** | 🔴 高频 |
| `utils.js:150` | `getFieldConf` | 同上，**纯读**却 cloneDeep | 🔴 高频 |
| `utils.js:502` | `flatDesignerList` | reduce 内部每个 curr 都 cloneDeep，但内部只读 curr 字段（parentUniqueId 推导） | 🔴 中频 |

#### C. 双重 cloneDeep — 1 处 ⚠️

`getFieldOrderBy` 的调用链路：
```ts
// layer-manager/move/index.ts
const parents = getParent(state.components, selected, rootParent);  // ← 已经 cloneDeep 过一次整树
const { index, components } = getFieldOrderBy(parents.children, selected);  // ← 又 cloneDeep 一次 parents.children
```

**一次 layer-manager.move 操作做了 2 次全树 cloneDeep**。

### 9.3 性能影响估算

`_.cloneDeep` 一个 440 组件树：

| 指标 | 数值 |
|---|---|
| 单个组件估算大小 | ~1KB（config + type + children 引用） |
| 总大小 | ~440KB |
| cloneDeep 耗时 | **~10-50ms**（取决于结构复杂度） |

**每次操作的成本**：

| 操作 | 当前 cloneDeep 次数 | 耗时 |
|---|---|---|
| `ConfigurationPanel.onValueChange` | 1 次（getFieldConf）+ 1 次（mergeFieldConfig Immer） | ~50ms |
| `layer-manager.moveToTop` | 1 次（getParent）+ 1 次（getFieldOrderBy） | ~50ms |
| `getFieldConf(state.components, id)` | 1 次 | ~30ms |
| `flatDesignerList(components)` | N 次（N=组件数） | ~100ms |

**估算 onChange 路径**：合并 + cloneDeep + mergeFieldConfig = 一次 onChange **约 100-200ms**（高频 onChange 60+ 次/秒根本扛不住，所以才需要 `useDebounceMergeConfig` 的 30ms 防抖）。

### 9.4 为什么 `getParent` / `getFieldConf` 不需要 cloneDeep？

**它们是只读函数**：
- `getParent` 内部 `data.reduce((prev, cur, index, arr) => ...)` — 只读 `cur.uniqueId` / `cur.children`
- `getFieldConf` 内部 `data.reduce((prev, cur, index, arr) => ...)` — 只读 `cur.uniqueId` / `cur.children`

**这些代码**：
```js
arr.length = 0;  // nosonar 早期代码想用这个 trick 跳出循环
```
注释说"找到后修改原数组跳出循环"——这是非常早期的实现 hack，**完全可以用 `return cur` 直接返回**（外层 `prev` 非空就短路）。

**代码意图**：可能是因为**函数会返回 parent 对象，调用方可能修改 parent.children**（generatorGroup L430、designer-field L220 都是这样用）。所以函数内部"先 cloneDeep 防污染"是希望保护调用方。

**但是！调用方既然要修改 parent.children，那就应该**：
- 要么用不可变写法（`setChildren`）
- 要么由调用方自己 cloneDeep

**不应该由只读函数偷偷 cloneDeep**。这是个**反模式**。

### 9.5 搬到 byId 后能彻底干掉

```ts
// 现在
const conf = getFieldConf(state.components, id);        // O(n) + cloneDeep ~30ms
const parent = getParent(state.components, id, root);   // O(n) + cloneDeep ~30ms

// 方案 B 之后
const conf = byId[id];                                  // O(1)
const parentId = parentMap[id];                         // O(1)
const parent = byId[parentId];                          // O(1)
```

**所有 `_.cloneDeep` 在 B 方案后都消失**：
- `getFieldConf` → `getFieldById(byId, id)`，纯读，O(1)
- `getParent` → `getParentIdById(parentMap, id)`，纯读，O(1)
- `flatDesignerList` → `buildIndex` 替代，O(n) 但只算一次
- `getFieldOrderBy` → 由 parentMap + byId 推导

### 9.6 改写策略

| 函数 | 改造 |
|---|---|
| `getFieldConf` | 直接删，调用方改用 `byId[id]` |
| `getParent` | 直接删，调用方改用 `parentMap[id]`（或保留返回 FlatField 的 `getParentFieldById(byId, parentMap, id)`） |
| `getFieldOrderBy` | 改用 `getIndexById(parentMap, byId, id)`（返回在父 children 中的 index，由 parentMap + byId 推导） |
| `flatDesignerList` | 直接删（buildIndex 替代） |
| `resetUniqueId` / `generatorField` | 保留 cloneDeep（合理） |
| `resetObjectSealed` | 保留（合理） |
| `helper.ts:58` | 保留（合理） |

### 9.7 风险与缓解

| 风险 | 缓解 |
|---|---|
| 删除 `getFieldConf` 后调用方漏改 | Phase 1 全量 grep `getFieldConf\(`，列出调用点逐个改造 |
| 删除 `getParent` 后调用方拿不到 parent 引用 | 提供 `getParentFieldById(byId, parentMap, id)`（返回 FlatField，不 cloneDeep） |
| `flatDesignerList` 仍有调用方 | 列出调用点，看能否用 buildIndex 一次产出 |
| `_.cloneDeep` 在 helper / generator 还保留 | 接受（结构性变更需要，量少） |

### 9.8 收益

1. **配置面板 onChange**：从 ~100-200ms 降到 ~5-10ms（省 1 次 cloneDeep + 1 次整树遍历）
2. **layer-manager 操作**：从 ~50ms 降到 ~2ms
3. **`useDebounceMergeConfig` 的 30ms 防抖**：理论上可以去掉（onChange 路径已经够快）
4. **440 组件场景的批量操作**：从 ~1-2s 降到 ~50-100ms

### 9.9 与方案 B 的关系

`cloneDeep` 滥用问题是 **方案 B 的"赠送收益"**：
- 拆 byId 之后，O(1) 查询让 `getFieldConf` / `getParent` 不再需要 cloneDeep
- 这是**同一件事的两个角度**：用对数据结构让代码自然简洁

写进 task-006 时可以合并到 Phase 2A 的"拆 byId"步骤里，不需要单独开 Phase。
