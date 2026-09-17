# task-2026-07-21-012-d-manual-fix

> 针对 task-006/011 落地后发现的手动问题修复

## 背景

task-006 把 `designerCanvas` slice 迁入 Redux + task-011 删除 `useDesigner` 兼容壳后，`DesignerContent.tsx` 的 `setState` 包装函数逻辑存在缺陷，导致初始化数据请求回来后 `meta` / `page` / `appScopeId` 等字段被丢弃，headerTitle 不显示场景名。

## 问题定位

### 问题 1：setState 丢弃非 components 字段

**文件**：`src/designer/DesignerContent.tsx` L137-L146

**现状**：
```tsx
const setState = usePersistFn((nextState: any) => {
    if (nextState && typeof nextState === 'object' && 'components' in nextState) {
        dispatch(setComponents(nextState.components));
        if (_.isEmpty(nextState.components)) {
            dispatch(setDesignerCanvasState({ realtimeDataFlow: [], customFieldsListMapping: {} }));
        }
    } else {
        dispatch(setDesignerCanvasState(nextState));
    }
});
```

**问题**：第 221 行初始化数据请求回来后调用：
```tsx
setState({ ...config, meta: res.data, appScopeId });
// config 含 components / page / realtimeDataFlow / customFieldsListMapping
```

进入 `if` 分支后只 `dispatch(setComponents(nextState.components))`，**丢弃了 `meta`、`appScopeId`、`page`、`realtimeDataFlow`、`customFieldsListMapping`**。

**影响**：
- `state.meta` 一直是 `initialState.meta = {}`
- L402 `state.meta?.name` 为空 → headerTitle 不显示场景名
- `state.page` 一直是 `initialState.page`（默认 1920x1080）→ 用户保存的页面配置丢失
- `state.appScopeId` 为 null → scope 注入失败

**根因**：task-006 迁移时 `setState` 包装函数只保留了 `components` 路径的语义，没有处理"一次性写入多个字段（含 components + meta + page 等）"的场景。原 `useDesigner` Context 的 `setState` 是 `Object.assign` 整体合并，task-006 拆成 `setComponents` + `setDesignerCanvasState` 两个 action 后语义丢失。

## 修复方案

`setState` 在 `components` 分支也要 dispatch 其他字段：

```tsx
const setState = usePersistFn((nextState: any) => {
    if (nextState && typeof nextState === 'object' && 'components' in nextState) {
        dispatch(setComponents(nextState.components));
        const rest = { ...nextState };
        delete rest.components;
        if (_.isEmpty(nextState.components)) {
            rest.realtimeDataFlow = rest.realtimeDataFlow ?? [];
            rest.customFieldsListMapping = rest.customFieldsListMapping ?? {};
        }
        if (Object.keys(rest).length > 0) {
            dispatch(setDesignerCanvasState(rest));
        }
    } else {
        dispatch(setDesignerCanvasState(nextState));
    }
});
```

## 实施记录

- 2026-07-23：定位问题 1，修复 `setState` 包装函数
- 2026-07-23：定位问题 2，修复 `splitGroup` 中 `byId[selected]` 不含 children 导致取消成组报错
- 2026-07-23：定位问题 3，修复 `generatorGroup` 中 `byId[item]` 不含 children 导致组内子组件丢失
- 2026-07-23：排查所有 `byId[]` 使用点，定位问题 4，修复 `useOnDrop` 中 `dropFieldConfig` 用 byId 不含 children 导致图层树拖拽丢子节点
- 2026-07-23：定位问题 5，修复 `handleAlign` forEach 闭包覆盖导致多选对齐只有最后一个生效（既有 bug，非本次引入，但一并修复）
- 2026-07-23：定位问题 6，修复 `updateFieldConfig` 不同步 components 树导致配置面板改名称后图层树不更新
- 2026-07-23：渲染性能优化 P0，ItemField useSelector 返回派生布尔值 isSelected，选中时从 N 次重渲染降到 2 次
- 2026-07-23：渲染性能优化 P1，DesignerField 去掉 components 整树订阅，拖拽回调改用 store.getState() 同步读
- 2026-07-23：渲染性能优化 P2（第二轮排查），RecursionComponents 添加 React.memo 截断重渲染链路。根因：RecursionComponents 无 memo → 父组件（CanvasGraph/DesignerContent）因 component.selected 变化 re-render 时，RecursionComponents 自身也 re-render → React 必须 reconcile 所有 DesignerField 子节点 → DesignerField 的 useSelector（useSyncExternalStore）绕过 memo 的 areEqual → 全量重渲染。P0/P1 只处理了下游叶子节点，未截断上游链路。
- 2026-07-23：渲染性能优化 P3，将 RecursionComponents 从 DesignerContentImp 内部提取到 DesignerContent 外层，作为 children 传入。DesignerContentImp 因 useSelector 重渲染时，props.children 引用不变 → React 跳过 children 的 reconcile → RecursionComponents 不受影响。同时将 onValueChange / enableWidgetMovable 提到外层定义。
- 2026-07-23：渲染性能优化 P4，删除 DesignerContentImp 内部 `useSelector(fullState => fullState.component.selected)` 响应式订阅。selected 只在 useEffect 和 latestCache 中使用，不需要触发组件重渲染。改为：① latestCache.selected 用 getter `get selected() { return reduxStore.getState().component.selected }` 每次访问同步读；② group 包围盒重计算 useEffect 改为 `reduxStore.subscribe(recalcGroupBounds)` 模式，在 store 变化回调内用 `getState()` 读，不触发组件重渲染。
- 2026-07-23：渲染性能优化 P5，DesignerContextMenu 去掉 `useSelector(s => s.designerCanvas.components)` 整树订阅和 `useSelector` 中的 `selected: state.component.selected`。components / selected 只在 onMenuClick 事件回调中使用，改为 `reduxStore.getState()` 同步读。每个 DesignerField 都包了一个 DesignerContextMenu，之前选中变化时所有 DesignerContextMenu 全量重渲染。同时 `contextMenuState` fallback 从 `|| {}`（每次新对象）改为 `|| EmptyObject`（模块级常量，引用稳定）。**至此，选中图层触发全量渲染的问题彻底解决。**
- 2026-07-23：渲染性能优化 P6，修改属性触发全量重渲染问题。① `updateFieldConfig` reducer 彻底删除 `needsTreeSync` / `syncInTree`，永远只改 `byId`，`components` 引用永远不变。根因：配置面板 `onValueChange` 提交 Formily 完整 `form.values`，其中 `config` 对象始终包含 `title`，导致 `'title' in patch.config` 恒为 true，每次改任何属性都 `syncInTree` 重建 `components` → `RecursionComponents` 全量重渲染。② 图层树 `buildTreeData` 的 title 从 `byId[uniqueId].data.config.title` 读取（不再从 `components` 树的 `material.data.config.title` 读），`treeData` 的 `useMemo` 依赖 `byId`。改 title 时 `byId` 变化 → 仅图层树重渲染（不是画布 440 个组件）。
- 2026-07-23：渲染性能优化 P7，`useConvertMenuState` hook 去掉 `useSelector(s => s.designerCanvas, shallowEqual)` 整 slice 订阅。根因：这个 hook 在每个 `DesignerContextMenu` 中调用（L122），而每个 `DesignerField` 都包了一个 `DesignerContextMenu`。`updateFieldConfig` 改 `byId` 时 → `designerCanvas` 引用变化 → `useConvertMenuState` 的 `useSelector` 触发 → 所有 `DesignerContextMenu` 重渲染 → 所有 `ItemField` 跟着重渲染。改为 `useStore` + `store.getState()` 同步读，`convertMenuState` 只在 `node` 变化时才执行（有缓存），不需要响应式订阅。
- 2026-07-23：渲染性能优化 P8，`DesignerContentImp` 拆分 `useSelector(s => s.designerCanvas, shallowEqual)` 整 slice 订阅为字段级订阅 `page` / `meta` / `appScopeId`。`DesignerContentImp` 渲染只读这 3 个字段，不读 `byId`。`updateFieldConfig` 改 `byId` 时这 3 个字段引用不变 → `DesignerContentImp` 不重渲染。保存逻辑（`handleSave` / `saveMethod`）、`useImperativeHandle.getState()`、`latestCache.state`、`refreshData` 回调全部改为 `reduxStore.getState().designerCanvas` 同步读。**至此，修改属性触发全量渲染的问题彻底解决。**
- 2026-07-23：关闭 Redux Toolkit `immutableCheck` 中间件（`src/store/index.ts` L24）。根因：物料组件由外部团队开发，无法保证遵守 Redux 不可变原则，部分图表组件在渲染时直接修改传入的 `config` 对象（如 `config.statistic.content`）。`setAutoFreeze(false)` 只关闭了 Immer 的 `Object.freeze`，但 `immutableCheck` 是独立的突变检测中间件，在 dispatch 之间深比较 state 引用发现突变后抛错。设计器作为宿主应承担兼容处理，`immutableCheck: false` 是合理的工程决策。
- 2026-07-24：**组点击不到问题修复**。`checkSelectedFieldInGroup`（`designer-field/utils.ts` L178）原用 `fieldVisitor` 遍历 `dataSource.children`，但 P6 后 `dataSource` 来自 `byId`（FlatField 不含 children），`fieldVisitor` 检查 `!_.isArray(fieldItem.children)` → true → 直接 return → 永远返回 false → 组的虚线边框（`getOverwriteStyleBorder` 的 `selectedFieldInGroup` 分支）永远不触发。修复：改为用 `parentMap` 反查——检查 `selectedIds` 的父级是否是 `dataSource.uniqueId`。调用处（`designer-field/index.tsx` L78）`useSelector` 中传入 `fullState.designerCanvas.parentMap`。`parentMap` 仅在结构性变更（setComponents）时重建，非高频路径。
- 2026-07-24：**改名后拖入/拖出组名字恢复问题修复**。根因：P6 改动后 `updateFieldConfig` 只更新 `byId` 不更新 `components` 树，`components` 树中的 data 是旧的。当拖入/拖出组触发 `setComponents` 时，`buildIndex` 用 `components` 树旧 data 重建 `byId`，覆盖了字段级更新（改名等），导致用户修改丢失。影响所有 19 个 `setComponents` 调用点。修复：新增 `mergeByIdIntoTree`（`renderer/utils.ts` L664），在 `setComponents` / `setState` reducer 的 `buildIndex` 之前调用，把当前 `byId` 的最新 data **深度合并**到新 `components` 树。深度合并策略：`{ ...byId.data, ...node.data }` 浅合并 + 对 `config` 做 `{ ...byId.config, ...node.config }` 深度合并，保留树中 `mergeFieldConfig` 更新的字段（如组的 top/left/width/height）和 byId 中字段级更新的字段（如 title），互不覆盖。
- 2026-07-24：**组内继续成组时 RangeError: Maximum call stack size exceeded 修复**。根因：`recalcGroupBounds`（`DesignerContent.tsx` L271）是 `reduxStore.subscribe` 回调，每次 Redux state 变化都触发。它在组内子组件位置变化时调用 `setState({components})` → `setComponents` → Redux state 变化 → 再次触发自身。`mergeByIdIntoTree` 用旧 byId data 覆盖 `mergeFieldConfig` 刚更新的组 config（top/left/width/height），导致计算条件持续为 true → 无限循环 → `deepMergeObj` 遍历 Immer proxy 爆栈。修复：① `mergeByIdIntoTree` 改为深度合并（见上条），避免覆盖结构性变更的新值；② `recalcGroupBounds` 加 `isRecalcRef` 重入防护，`setComponents` 触发的 subscribe 回调直接跳过，杜绝无限循环。
- 2026-07-24：**组内对齐导致组位置跳变修复**。根因：`handleAlign`（`canvas-graph/index.tsx`）用 `setComponents` 更新组内子组件位置后，`recalcGroupBounds`（`DesignerContent.tsx`）被 Redux subscribe 触发。`recalcGroupBounds` 的"位置重归一化"逻辑会把组内子组件的 min top/left 归零并补偿移动组位置（`top: prevTop + top`）。当子组件被对齐到非零 top（例如 top=50）时，组位置被补偿移动 50px → 组"跑到下面"。这是既有 bug（旧版 `useEffect` 依赖 `[state.components]` 也有同样的重归一化逻辑），非 task-012 引入。修复：新增模块级标志 `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`（`renderer/utils.ts`）。`handleAlign` 在 `dispatch(setComponents)` 前后设置/清除标志；`recalcGroupBounds` 检测到标志时只更新组的尺寸（width/height 适应子组件最大右下角），不改变组的 top/left，不重置子组件位置。仅对组内对齐（`parentMap[selectedIds[0]] !== ROOT_UNIQUE_ID`）设置标志，顶层对齐不受影响。

### 修改文件

- `src/designer/recursion-components/index.tsx`：**P2 渲染性能优化**。添加 `React.memo` 包裹 `RecursionComponents`。当 props（enableWidgetMovable / onValueChange）不变时，RecursionComponents 不重渲染，整个子树的 reconcile 全部跳过。useSelector 对 designerCanvas.components 的订阅在真正需要时（如拖入新组件）仍会触发重渲染。
- `src/designer/DesignerContent.tsx` L137-L152：`setState` 在 `components` 分支补齐对 `rest`（meta/page/appScopeId/realtimeDataFlow/customFieldsListMapping）的 `setDesignerCanvasState` dispatch
- `src/designer/renderer/utils.ts` L482-L490：`splitGroup` 中 `curFieldConf` 改为直接用 `getFieldNodeById(fields, selected)` 取完整节点（含 children），不再用 `byId[selected] || getFieldNodeById(...)` 短路（byId 是 FlatField 不含 children，且 group 节点 byId 一定 truthy，导致永远不 fallback）
- `src/designer/renderer/utils.ts` L445-L448：`generatorGroup` 中 `children` 改为用 `getFieldNodeById(fields, item)` 取完整节点（含 children），不再用 `byId[item]`（同因：byId 是 FlatField 不含 children，成组后组内嵌套子节点丢失）
- `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` L82：`dropFieldConfig` 改为用 `getFieldNodeById(state.components, info.dragNode.key)` 取完整节点（含 children），不再用 `store.getState().designerCanvas.byId[...]`（dropFieldConfig 后续被 unshift/splice 写回树，FlatField 会导致拖拽 group/layout-block 时子节点丢失）
- `src/designer/canvas-graph/index.tsx` L312-L357：`handleAlign` forEach 内 `mergeFieldConfig(components, ...)` 每次基于闭包 `components`（不随 dispatch 同步更新），多次 `dispatch(setComponents(results))` 会导致前一个组件的修改被后一个基于旧树的结果覆盖。改为 `let results = components` 链式累计，最后只 `dispatch` 一次。**注：这是既有 bug（旧版 `setState` 也有同样的 forEach 闭包覆盖），非本次 task-012 引入，但一并修复。**
- `src/store/modules/designer-canvas.ts` L103-L135：`updateFieldConfig` reducer 原本只 patch `byId[uniqueId].data`，不更新 `components` 数组（task-008 设计目标：O(1) 字段级更新）。但图层树（`aside-panel/layers-tree`）订阅的是 `components` 数组，`components` 引用不变导致配置面板改名称后图层树不重渲染。修复：reducer 内当 patch 包含 `config.title`（影响图层树渲染的字段）时，同步递归更新 `components` 树中对应节点的 `data`。不含 `config.title` 时（如拖拽只改 `config.left/top`）跳过 O(n) 递归，保持 O(1) 性能。**优化原因**：无条件全树同步会导致配置面板输入名称时每个按键都全树遍历 + components 引用变化触发图层树重渲染，440 组件场景下性能不可接受。
- `src/designer/renderer/components/item-field/index.tsx` L40-46：**P0 渲染性能优化**。`useSelector` 原返回 `selected: state.component.selected`（原始字符串），选中变化时字符串变了 → `_.isEqual` 判定不等 → 所有 ItemField 全部重渲染。改为返回 `isSelected: state.component.selected === compProps.uniqueId`（派生布尔值）+ `shallowEqual`，只有选中/取消选中的 2 个 ItemField 重渲染，其余全部被 shallowEqual 拦住。L167 `selected === fullProps.uniqueId` 改为 `isSelected`。
- `src/designer/renderer/designer-field/index.tsx` L63-94：**P1 渲染性能优化**。去掉 `useSelector(s => s.designerCanvas.components, shallowEqual)` 整树订阅（L88 旧代码），改为 `getDesignerState()` 函数在事件回调中用 `store.getState().designerCanvas.components` 同步读。消除：`updateFieldConfig` 的 `config.title` 同步路径让 `components` 引用变化时，不再触发所有 DesignerField 重渲染。合并 `reduxStore` / `store` 两个 `useStore` 为一个 `store`。去掉 `RootReducerState` 未使用 import。5 处 `state` 引用（handleClick / onDragHandle / onDragStopHandle / onResizeHandle）改为 `getDesignerState()`。
- `src/designer/DesignerContent.tsx` L465-L480：**P3 渲染性能优化**。将 `RecursionComponents` 从 `DesignerContentImp` 内部提取到 `DesignerContent` 外层。`onValueChange`（usePersistFn + useUpdateFieldConfig）和 `enableWidgetMovable`（从 props 取）在外层定义，`<RecursionComponents>` 作为 children 传给 `DesignerContentImp`。`DesignerContentImp` 内部删除 `enableWidgetMovable` 解构、`submitFieldConfig`、`onValueChange` 定义。`CanvasGraph` 内继续用 `{props.children}` 渲染。效果：DesignerContentImp 因 useSelector 重渲染时，props.children 引用不变 → React 跳过 reconcile → RecursionComponents 不受影响。
- `src/designer/DesignerContent.tsx` L121-L124, L175-L192, L253-L295：**P4 渲染性能优化**。① 删除 `const selected = useSelector(fullState => fullState.component.selected)` 响应式订阅，改为 `const reduxStore = useStore<any>()`；② `latestCache.current.selected` 改为 getter `get selected() { return reduxStore.getState().component.selected }`，每次访问同步读 store 最新值，不在 render 期间固定；③ group 包围盒重计算 useEffect 从依赖 `[state.byId[selected.split(',')[0]]]` 改为 `reduxStore.subscribe(recalcGroupBounds)` 模式，在 store 变化回调内用 `getState()` 读 designerCanvas + component.selected，不触发组件重渲染。effect 卸载时 `unsubscribe()`。
- `src/designer/context-menu/DesignerContextMenu.tsx` L114-L131, L216-L218：**P5 渲染性能优化**。① 删除 `useSelector(s => s.designerCanvas.components, shallowEqual)` 整树订阅 + `useMemo` 构造 `designerState`，改为 `onMenuClick` 回调内 `reduxStore.getState().designerCanvas.components` 同步读；② 从 `useSelector` 返回值中移除 `selected: state.component.selected`（原始字符串，选中变化时所有 DesignerContextMenu 全量重渲染），改为 `onMenuClick` 回调内 `reduxStore.getState().component.selected` 同步读；③ `contextMenuState` fallback 从 `|| {}`（每次新对象，`_.isEqual` 深比较有开销）改为 `|| EmptyObject`（模块级常量 `const EmptyObject = {}`，引用稳定）。
- `src/store/modules/designer-canvas.ts` L100-L120：**P6 渲染性能优化**。`updateFieldConfig` reducer 彻底删除 `needsTreeSync` / `syncInTree` 逻辑。旧逻辑：`patch.config && 'title' in patch.config` 时递归同步 `components` 树。但配置面板提交完整 `config`（含 title），导致每次改任何属性都重建 `components` → `RecursionComponents` 全量重渲染。新逻辑：永远只改 `byId`，`components` 引用不变。
- `src/designer/aside-panel/layers-tree/tree/index.tsx` L12-L21, L27, L68-L76：**P6 渲染性能优化**。① `buildTreeData` 新增 `byId` 参数，title 从 `byId[material.uniqueId].data?.config?.title` 读取（不再从 `material.data.config.title`）；② 新增 `const byId = useSelector(s => s.designerCanvas.byId, shallowEqual)`，`designerState` 和 `treeData` 的 `useMemo` 依赖加入 `byId`。改 title 时 `byId` 变化 → 图层树重渲染（仅图层树），画布不受影响。
- `src/designer/context-menu/hooks/useConvertMenuState.tsx` L1-L64：**P7 渲染性能优化**。删除 `useSelector(s => s.designerCanvas, shallowEqual)` 整 slice 订阅，改为 `useStore` + `store.getState().designerCanvas` 同步读。`convertMenuState` 有 `latestCache` 缓存（`node` 不变时返回缓存值），不需要响应式订阅。消除：`updateFieldConfig` 改 `byId` 时 `designerCanvas` 引用变化 → 所有 `DesignerContextMenu`（每个 `DesignerField` 都包了一个）重渲染。
- `src/designer/DesignerContent.tsx` L141, L153-L168, L307-L355, L424-L470：**P8 渲染性能优化**。拆分 `useSelector(s => s.designerCanvas, shallowEqual)` 整 slice 订阅为 3 个字段级订阅：`const page = useSelector(s => s.designerCanvas.page, shallowEqual)` / `const meta = useSelector(s => s.designerCanvas.meta, shallowEqual)` / `const appScopeId = useSelector(s => s.designerCanvas.appScopeId)`。`updateFieldConfig` 改 `byId` 时这 3 个字段引用不变 → `DesignerContentImp` 不重渲染。保存逻辑（`handleSave` / `saveMethod`）、`useImperativeHandle.getState()`、`latestCache.state` getter、`refreshData` 回调全部改为 `reduxStore.getState().designerCanvas` 同步读。`headerTitle` 的 `useMemo` 依赖从 `state.meta` 改为 `meta`。JSX 中 `state.appScopeId` / `state.meta` / `state.page` 改为 `appScopeId` / `meta` / `page`。删除 `DesignerCanvasState` 类型 import（不再使用）。
- `src/designer/renderer/designer-field/utils.ts` L178-185：**组点击不到修复**。`checkSelectedFieldInGroup` 签名从 `(dataSource, selectedIds)` 改为 `(dataSource, selectedIds, parentMap)`，实现从 `fieldVisitor` 遍历 children 改为 `selectedIds.some(id => parentMap[id] === dataSource.uniqueId)`。删除未使用的 `fieldVisitor` import。
- `src/designer/renderer/designer-field/index.tsx` L73-84：**组点击不到修复**。`useSelector` 中传入 `fullState.designerCanvas.parentMap` 给 `checkSelectedFieldInGroup`。
- `src/designer/renderer/utils.ts` L649-700：**改名丢失修复**。新增 `mergeByIdIntoTree` 函数，把 byId 的最新 data 深度合并到 components 树节点。策略：`{ ...byId.data, ...node.data }` + config 深度合并 `{ ...byId.config, ...node.config }`，保留树中结构性变更新值和 byId 中字段级更新值。data 引用相同时跳过，byId 无此节点（新增）时保留树原样。
- `src/store/modules/designer-canvas.ts` L1, L74-97：**改名丢失修复**。import `mergeByIdIntoTree`；`setComponents` 和 `setState` 两个 case 在 `buildIndex` 之前调用 `mergeByIdIntoTree(action.payload, state.byId)` 合并 byId 字段级更新到新树。
- `src/designer/DesignerContent.tsx` L268-310：**组内成组爆栈修复**。`recalcGroupBounds` 加 `isRecalcRef`（useRef）重入防护。`isRecalcRef.current = true` → `setState({components})` → `isRecalcRef.current = false`，`setComponents` 触发的 subscribe 回调被 `if (isRecalcRef.current) return` 拦截，杜绝无限循环。
- `src/designer/renderer/utils.ts` L766-796：**组内对齐跳变修复**。新增模块级标志 `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`，用于在组内对齐等显式操作期间跳过 `recalcGroupBounds` 的位置重归一化。
- `src/designer/DesignerContent.tsx` L19, L300-319：**组内对齐跳变修复**。import `shouldSkipGroupRecalc`；`recalcGroupBounds` 在 `shouldSkipGroupRecalc()` 为 true 时走"仅更新尺寸"路径：计算子组件最大右下角（`maxRight` / `maxBottom`），只更新组的 `width` / `height`，不改变 `top` / `left`，不调用 `resetChildrenPosition` 重置子组件位置。
- `src/designer/canvas-graph/index.tsx` L32, L355-367：**组内对齐跳变修复**。import `beginSkipGroupRecalc` / `endSkipGroupRecalc`；`handleAlign` 在 `dispatch(setComponents)` 前后设置/清除标志。仅当选中组件在组内（`parentMap[selectedIds[0]] !== ROOT_UNIQUE_ID`）时设置标志，顶层多选对齐不受影响。

### 选中图层全量重渲染问题总结

**问题**：选中任意图层时，所有 `ItemField`（console.log 验证）全量重渲染。440 组件场景下严重影响性能。

**根因**：重渲染链路上有多个组件通过 `useSelector` 响应式订阅了 `component.selected` 或 `designerCanvas.components`，选中变化时从源头到叶子节点全链路穿透：

```
component.selected 变化
  → DesignerContentImp: useSelector(component.selected) 重渲染          ← P4 修复
  → CanvasGraph: useSelector(component.selected) 重渲染                 ← 需后续处理
  → RecursionComponents: 无 React.memo，父组件重渲染时跟着重渲染        ← P2+P3 修复
  → DesignerField: useSelector(component.selected) + useSelector(components) ← P1 修复
  → DesignerContextMenu: useSelector(components) + useSelector(selected) ← P5 修复
  → ItemField: useSelector(selected) 返回原始字符串                      ← P0 修复
  → 全量重渲染
```

**修复策略**（P0-P5，逐层截断）：

| 优化 | 文件 | 策略 | 效果 |
| --- | --- | --- | --- |
| P0 | ItemField | useSelector 返回派生布尔值 `isSelected` + `shallowEqual` | 选中时从 N 次降到 2 次 |
| P1 | DesignerField | 去掉 components 整树订阅，事件回调改用 `store.getState()` | 改属性时不触发全量 |
| P2 | RecursionComponents | 添加 `React.memo` | 截断父组件重渲染传导 |
| P3 | DesignerContent | RecursionComponents 提到外层作为 children 传入 | props.children 引用稳定，跳过 reconcile |
| P4 | DesignerContent | 删除 `useSelector(selected)`，改用 `store.subscribe` + getter | 选中时 DesignerContentImp 自身不重渲染 |
| P5 | DesignerContextMenu | 去掉 components/selected 响应式订阅，改用 `store.getState()` | 选中时所有 DesignerContextMenu 不重渲染 |

**核心原则**：
- `selected` 和 `components` 只在**事件回调**（onMenuClick / onDragStop / handleClick 等）中使用时，不需要响应式订阅，改为 `store.getState()` 同步读
- 需要响应式订阅的场景（如 DesignerField 的 `useFieldConf`），selector 应返回**派生值**（布尔值 / 计算结果），而非原始 state 字段，让 `shallowEqual` 能有效拦截
- `React.memo` + 稳定的 props 引用（`usePersistFn` / 布尔值 / children）是截断重渲染链路的关键

### 全量排查结果（byId[] 使用点审计）

### 修改属性全量重渲染问题总结

**问题**：在配置面板修改任意属性时，所有 `ItemField` 全量重渲染。440 组件场景下严重影响性能。

**根因**：三个独立的问题叠加导致：

```
配置面板 onChange → submitFieldConfig(uniqueId, patch)
  → dispatch(updateFieldConfig)

  ① reducer: needsTreeSync 恒为 true（Formily 提交完整 config 含 title）
     → syncInTree 重建 components 引用
     → RecursionComponents 的 useSelector(components) 触发        ← P6 修复

  ② useConvertMenuState: useSelector(s => s.designerCanvas)
     → byId 变化时 designerCanvas 引用变化
     → 所有 DesignerContextMenu 重渲染 → ItemField 跟着重渲染     ← P7 修复

  ③ DesignerContentImp: useSelector(s => s.designerCanvas)
     → byId 变化时 designerCanvas 引用变化
     → DesignerContentImp 重渲染（虽然 children 引用稳定，但自身开销）  ← P8 修复
```

**修复策略**（P6-P8）：

| 优化 | 文件 | 策略 | 效果 |
| --- | --- | --- | --- |
| P6 | designer-canvas.ts + layers-tree/tree | 删除 `syncInTree`，`components` 永不变；图层树 title 从 `byId` 读 | 改属性时 `RecursionComponents` 不重渲染 |
| P7 | useConvertMenuState | `useSelector(designerCanvas)` → `store.getState()` | 改属性时所有 `DesignerContextMenu` 不重渲染 |
| P8 | DesignerContent | `useSelector(designerCanvas)` → 字段级 `page`/`meta`/`appScopeId` | 改属性时 `DesignerContentImp` 不重渲染 |

**核心教训**：
- `useSelector` 订阅整个 slice 对象时，Immer 的结构共享只保证未改字段引用不变，但**被改字段的引用一定变**，`shallowEqual` 会判定整个 slice 不等
- 任何在 `DesignerField` / `DesignerContextMenu` 等**被批量渲染的组件**内部调用的 hook，都不能有响应式订阅整个 `designerCanvas` slice 的 `useSelector`
- `needsTreeSync` 这类"条件同步 components"的方案本质上是脆弱的——只要调用方提交完整对象，条件判断就会失效。正确做法是让消费方（图层树）改用字段级订阅（`byId`），而非依赖 `components` 重建

| 文件 | 行 | 用法 | 是否需要 children | 是否安全 |
| --- | --- | --- | --- | --- |
| `canvas-graph/index.tsx` L319 | `byId[item]` | handleAlign 只读 data.config 做 getGroupSizePosition | 否 | ✅ 安全 |
| `configuration-panel/index.js` L22 | `useFieldConf(selected)` | 配置面板只读 data.config 渲染表单 | 否 | ✅ 安全 |
| `configuration-panel/group/index.js` L40 | `submitFieldConfig` | 写入 byId[selected].data | 否（写路径） | ✅ 安全 |
| `DesignerContent.tsx` L269 | `state.byId[selected]` | useEffect 依赖项，仅比较引用 | 否 | ✅ 安全 |
| `aside-panel/layers-tree/index.jsx` L40 | `useFieldConf(selected)` | 图层树只读 data.config 显示锁定/隐藏状态 | 否 | ✅ 安全 |
| `aside-panel/layers-tree/tree/useOnDrop.ts` L82 | `byId[info.dragNode.key]` | dropFieldConfig 被 unshift/splice 写回树 | **是** | ❌ 已修复 |
| `context-menu/hooks/useConvertMenuState.tsx` L35 | `getFieldNodeById`（已正确） | fieldCfg 传入 generatorGroup 需要 children | 是 | ✅ 已正确用 getFieldNodeById |
| `renderer/utils.ts` generatorGroup L447 | `byId[item]` | children 写入 group 的 children | **是** | ❌ 已修复（问题 3） |
| `renderer/utils.ts` splitGroup L486 | `byId[selected]` | 读 curFieldConf.children | **是** | ❌ 已修复（问题 2） |

### 调用点影响分析

| 调用点 | 入参 | 修复前 | 修复后 |
| --- | --- | --- | --- |
| L185 `setState(dataSource)` | dataSource（可能含 components + 其他字段） | 丢失非 components 字段 | 正确写入所有字段 |
| L221 `setState({ ...config, meta: res.data, appScopeId })` | 含 components + meta + appScopeId + page + realtimeDataFlow + customFieldsListMapping | **丢失 meta/page/appScopeId 等**（本 bug） | 正确写入所有字段 |
| L259 `setState({ components: results })` | 只含 components | rest 为空，不 dispatch setDesignerCanvasState | 行为不变（rest 为空跳过） |
| L363 `setState({ components })` | 只含 components | 同上 | 行为不变 |
| L421 `setState({ meta: data })` | 只含 meta（无 components） | 走 else 分支 | 行为不变 |

## 验证

- [x] headerTitle 显示场景名（state.meta.name 不为空）
- [x] state.page 为后端返回的页面配置
- [x] state.appScopeId 正确注入
- [x] 拖拽 / 删除 / 保存等结构性操作不受影响

> 遗留问题迁移到 task-2026-07-24-012-1-manual-fix.md：
> - 组位置移动后保存丢失（components 树未同步）
> - 组内对齐时组位置乱动（recalcGroupBounds 位置重归一化）——已在本任务修复初版，需验证
