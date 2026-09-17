# Review task-011-2：16 调用方切换正确性

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-011-2-review`
> 上游任务：[task-2026-07-21-011](./done/task-2026-07-21-011-drop-usedesigner-compat.md)
> 状态：`planning`
> 类型：`review`
>
> **目标**：逐文件审查 16 个 `useDesigner()` 调用方是否按 §3.3 模板正确切换，是否有遗漏、语义漂移、React hook 违规、闭包陷阱。

---

## 1. 背景

task-011 把 16 个调用方从 `useDesigner()` 切换到 `useSelector` / `useDispatch` / `useFieldConf` / `useUpdateFieldConfig` / `useRealtimeDataFlow` / `useCustomFieldsList`。

**这是幻觉高发区**，因为：
- 每个调用方切换模式不同（7 个模板）
- 闭包回调内的 `state` 引用最容易漏（异步拿到旧值）
- React hook 规则（hook 不能在回调内调用）容易被破坏
- `layerManager.xxx(state, ...)` 这类松散入参的"伪 state"（`useMemo(() => ({ components }), [components])`）是否真的能替代原 `state` 对象

---

## 2. 16 个调用方清单与审查重点

> 每个文件按"原用法模式 → 切换后应如何 → 重点核查项"审查。

### 批次 1（4 个文件）

#### 1. `src/designer/configuration-panel/page/index.jsx`
- 原用法：`setState({ page })`
- 切换后应：`dispatch(setDesignerCanvasState({ page }))`
- [ ] 是否正确？
- [ ] 是否有其他 `setState` 调用未切换？

#### 2. `src/designer/common/dnd/DropContainer.tsx`
- 原用法：仅回调内读 `state.components`
- 切换后应：回调内 `useSelector` 或闭包捕获
- [ ] **重点**：回调（onDrop）内的 `state.components` 是否拿到最新值？闭包陷阱？
- [ ] 是否在回调内误调 `useSelector`（hook 违规）？

#### 3. `src/designer/configuration-panel/index.js`
- 原用法：仅渲染读 `state.components`
- 切换后应：`useSelector(s => s.designerCanvas.components, shallowEqual)`
- [ ] 是否正确？

#### 4. `src/designer/configuration-panel/group/index.js`
- 原用法：渲染读 + 回调内读
- **已知修复**：原在 `onValueChange` 回调内调 `useDesigner()`（React hook 违规），task-011 移到顶层 `useSelector`
- [ ] **重点**：确认 hook 不再在回调内调用
- [ ] `onValueChange` 闭包内的 `components` / `selected` 是否拿到最新值？

### 批次 2（4 个文件）

#### 5. `src/designer/recursion-components/index.tsx`
- 原用法：整树 `useMemo([state.components])`
- 切换后应：`useSelector` + `useMemo([components])`
- [ ] **重点**：`useMemo` 依赖是否仍是 `state.components`（已失效引用）还是新 `components` 变量？
- [ ] `shallowEqual` 是否必要（整树引用变化才重算）？

#### 6. `src/designer/canvas-graph/index.tsx`
- 原用法：渲染 + 回调（含 `handleAlign`）
- 切换后应：`designerState = useMemo(() => ({ components }), [components])` 兼容 `layerManager` 松散入参
- [ ] **重点**：`handleAlign` 内的 `state.components` 是否拿到最新值？
- [ ] `layerManager.align(state, selected, callback)` 的 `state` 是否真的能工作（layer-manager 是否只读 `state.components`）？
- [ ] callback `(components) => dispatch(setComponents(components))` 是否正确？

#### 7. `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx`
- 原用法：渲染读 + 回调内读
- 切换后应：同上
- [ ] 回调内闭包陷阱？

#### 8. `src/designer/toolbar/index.js`
- 原用法：渲染 + 回调
- 切换后应：`useSelector` + `useDispatch`
- [ ] **重点**：撤销/重做按钮的回调是否拿到正确的 `undo` / `redo` 栈？

### 批次 3（4 个文件）

#### 9. `src/designer/aside-panel/layers-tree/index.jsx`
- 原用法：`useMemo([state.components])`
- 切换后应：`useSelector` + `useMemo([components])`
- [ ] 图层树渲染是否正确（拖拽移动后是否刷新）？

#### 10. `src/designer/aside-panel/layers-tree/tree/index.tsx`
- 原用法：工具函数包一层 + `useFlatComponents`
- 切换后应：`useFlatComponents` 从 `@Src/store/designer/hooks` 导入
- [ ] **重点**：`useFlatComponents` 返回一元组，调用方是否仍解构 `[flatComponents, forceUpdate]`？如果是，`forceUpdate` 会是 `undefined`，运行时调用会崩
- [ ] import 路径是否切换？

#### 11. `src/designer/renderer/designer-field/index.tsx`
- 原用法：渲染 + 回调（task-010 已修 mutation）
- 切换后应：`useFieldConf(uniqueId)` + `useUpdateFieldConfig`
- [ ] **重点**：是否真的用 `useFieldConf`（字段级订阅）而不是 `useSelector` 全量读？
- [ ] 回调内 `updateFieldConfig` 是否正确？

#### 12. `src/designer/DesignerContent.tsx`
- 原用法：latestCache 模式
- 切换后应：`useSelector(s => s.designerCanvas, shallowEqual)` + `useEffect(() => { latestCache.current.designerState = state }, [state])`
- [ ] **重点**：`latestCache` 是否有 `useEffect` 同步？跨异步是否拿最新值？
- [ ] `setState` shim 函数是否保留原复杂分支（`'components' in nextState` → `setComponents` / 否则 → `setDesignerCanvasState` / components 为空 → `clearRuntime`）？
- [ ] **幻觉排查**：是否有简化掉原分支逻辑的情况？

### 批次 4（3 个文件 + provider）

#### 13. `src/designer/context-menu/DesignerContextMenu.tsx`
- 原用法：工具函数包一层
- 切换后应：`designerState = useMemo(() => ({ components }), [components])`
- [ ] 右键菜单的"复制/粘贴/删除/成组"等操作是否拿到正确 `components`？

#### 14. `src/designer/context-menu/hooks/useConvertMenuState.tsx`
- 原用法：latestCache + generatorGroup
- 切换后应：`useSelector` + `useEffect` 同步 ref
- [ ] **重点**：`latestCache.current.designerState` 是否同步？异步计算菜单状态时是否拿旧值？
- [ ] `useCustomFieldsList().get(uniqueId)` 同步读是否正常工作（这是 `get` 用 `store.getState()` 的主要消费方）？

#### 15. `src/formily/FedxReportContext.tsx`
- 原用法：provider 内 `realtimeDataFlow.record` 等
- 切换后应：`useRealtimeDataFlow()` + `useCustomFieldsList()`
- [ ] **重点**：Provider value 是否用 `useMemo` 包裹（避免每次 render 重建 Context value）？
- [ ] `useCurrentRealtimeDataFlowSource` 是否改用 `useSelector` 读 `realtimeDataFlow`？
- [ ] `uniqueId` 显式 `: string` 修复是否合理？

#### 16. `src/designer/common/context/context-designer/Designer.tsx`
- 原用法：内部 `useFlatComponents` hook 定义
- 切换后应：清空文件，仅 re-export `./screen-performance`
- [ ] **重点**：文件是否真的清空？是否仍残留 `useDesigner` / `DesignerContext` 定义？
- [ ] `common/index.ts` barrel 是否还能正常工作？

---

## 3. 通用审查项（所有 16 个文件）

- [ ] **3.1** 每个文件是否还有 `useDesigner` / `DesignerContext` import 残留？
    ```bash
    grep -rn "useDesigner\|DesignerContext" src/designer/ src/formily/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
    ```
    预期：0 命中（注释与 .bak 除外）
- [ ] **3.2** 每个回调内的 `state` 引用是否安全（无闭包陷阱）？
    - 异步回调（setTimeout / Promise / event listener）内的 `components` 必须通过 `latestCache` 或 `useRef` 同步
- [ ] **3.3** React hook 规则是否被破坏？
    - 没有任何 `useXxx` 在回调 / 条件分支 / 循环内调用
- [ ] **3.4** `useMemo` / `useCallback` 依赖数组是否正确？
    - 不能是 `[state.components]`（旧引用已失效），应是新的 `components` 变量
- [ ] **3.5** `useSelector` 是否都配了 `shallowEqual`（对象/数组返回值场景）？
- [ ] **3.6** `layerManager.xxx(state, ...)` 调用方的 `state` 是 `useMemo(() => ({ components }), [components])` 构造的伪 state —— 确认 layer-manager 只读 `state.components`，不读 `state.byId` / `state.page` 等

---

## 4. 审查方法

1. **逐文件 diff 对比**：`git log -p` 查看 task-011 commit 内每个文件的改动
2. **闭包陷阱推演**：对每个回调，问"如果用户在 1 秒后触发，state 是当时的还是最新的？"
3. **grep 残留**：`useDesigner` / `DesignerContext` / `setState` / `state.components`（旧引用）
4. **运行时验证**：启动 `pnpm start`，重点测 16 个调用方的交互场景（见 task-011 §4 步骤 8 冒烟清单）

---

## 5. 输出

在本文档 §6"审查记录"追加：
- 每个文件的 ✅ / ❌ / ⚠️ 结论
- 发现的问题列表（编号、严重度、文件:行、描述、建议修复）
- 是否有"看似切换了但语义漂移"的情况

---

## 6. 审查记录

> 审查人：AI Agent（task-011-2 review）
> 审查日期：2026-07-21
> 审查范围：16 个 `useDesigner()` 调用方 + 通用审查项 §3.1~3.6
> 审查方法：逐文件 Read + Grep 残留校验 + 闭包陷阱推演 + layer-manager 入参验证

---

### 6.1 批次 1（4 个文件）

#### 1. `src/designer/configuration-panel/page/index.jsx` ✅

- 切换情况（`src/designer/configuration-panel/page/index.jsx`）：
  - L2 import：`useDispatch, useSelector, shallowEqual` ✅
  - L4 import：`setDesignerCanvasState` ✅
  - L14：`const page = useSelector((s) => s.designerCanvas.page, shallowEqual)` ✅（字段级订阅 page，配 shallowEqual）
  - L15：`const dispatch = useDispatch()` ✅
  - L28：`dispatch(setDesignerCanvasState({ page: realValue }))` ✅（对应 §3.3.3 模板）
  - L37：useEffect 内 `dispatch(setDesignerCanvasState({ page: {...page, pageSize: polyfilledSize} }))` ✅（task-006 把 render 内 mutation 搬到 useEffect）
- 是否有其他 `setState` 调用未切换？无（grep 该文件 `setState` 0 命中）
- 结论：完全符合 §3.3.3 模板，无遗漏、无语义漂移

#### 2. `src/designer/common/dnd/DropContainer.tsx` ✅

- 切换情况（`src/designer/common/dnd/DropContainer.tsx`）：
  - L3 import：`useDispatch, useSelector, shallowEqual` ✅
  - L8 import：`setComponents, type RootReducerState` ✅
  - L20：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L22：`const dispatch = useDispatch()` ✅
  - L77：`dispatch(setComponents(nextComponents))` ✅
- **重点核查：闭包陷阱**
  - `handleDrop` 用 `usePersistFn`（L36）包裹，`usePersistFn` 内部用 ref 保存最新闭包，所以 `components`（L54）/ `materialsList` / `designerType` 在异步 await（L54 `runPromise`）后仍拿最新值 ✅
  - 未在回调内调用 `useSelector`（hook 违规）✅
- 结论：闭包陷阱安全，无 hook 违规

#### 3. `src/designer/configuration-panel/index.js` ✅

- 切换情况（`src/designer/configuration-panel/index.js`）：
  - L3 import：`useSelector, shallowEqual` ✅
  - L20：`const components = useSelector((s) => s.designerCanvas.components, shallowEqual)` ✅（对应 §3.3.1 模板）
  - L30-40：`useMemo(() => getFieldConf(components, selected), [selected, components])` ✅（依赖数组用了新 `components` 变量，不是旧 `state.components`）
- 结论：完全符合 §3.3.1 模板

#### 4. `src/designer/configuration-panel/group/index.js` ✅

- 切换情况（`src/designer/configuration-panel/group/index.js`）：
  - L2 import：`connect, useSelector, shallowEqual` ✅
  - L5 import：`useViewTabsKey, useSetView, useUpdateFieldConfig, useFieldConf` ✅
  - L18：`const fieldById = useFieldConf(selected)` ✅（字段级订阅 byId[selected]）
  - L19：`const submitFieldConfig = useUpdateFieldConfig()` ✅
  - L22：`const components = useSelector((s) => s.designerCanvas.components, shallowEqual)` ✅
- **重点核查：原 React hook 违规是否修复**
  - `onValueChange`（L27-41）定义在组件顶层，不在任何回调内调用 `useXxx` ✅
  - `onValueChange` 内通过闭包读 `components` / `selected`（L31 `getFieldConf(components, selected)`），由于组件每次 re-render 都重建 `onValueChange`，闭包始终拿到最新值 ✅
  - `submitFieldConfig(selected, {...value, config: {...value.config, ...params}})` ✅（对应 §3.3.4 模板）
- 结论：hook 违规已修复，闭包安全

---

### 6.2 批次 2（4 个文件）

#### 5. `src/designer/recursion-components/index.tsx` ✅

- 切换情况（`src/designer/recursion-components/index.tsx`）：
  - L2 import：`useSelector, shallowEqual` ✅
  - L4 import：`type RootReducerState` ✅
  - L10：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L12-41：`useMemo(() => loopComponents(components), [components, props.onValueChange, props.enableWidgetMovable])` ✅
- **重点核查：useMemo 依赖**
  - 依赖数组是 `[components, ...]`（L41），不是旧的 `[state.components]` ✅
  - `shallowEqual` 对 components 数组引用变化才触发，正确 ✅
- 结论：完全符合 §3.3.1 模板

#### 6. `src/designer/canvas-graph/index.tsx` ⚠️

- 切换情况（`src/designer/canvas-graph/index.tsx`）：
  - L2 import：`useSelector, useDispatch, batch, shallowEqual` ✅
  - L16 import：`setComponents, type RootReducerState` ✅
  - L113：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L115：`const designerState = useMemo(() => ({ components }), [components])` ✅（对应 §3.3.5 模板，构造伪 state 传给 layerManager）
  - L424/437/462：`layerManager.group/splitGroup/copy(designerState, selected, callback)` ✅
  - callback `(components, selectedIds) => batch(() => { dispatch(setComponents(components)); dispatch({type:'component/selected', data: selectedIds}) })` ✅
- **重点核查：handleAlign（L311-349）**
  - `handleAlign` 在组件顶层定义（非 usePersistFn 包裹），每次 re-render 重建，闭包内的 `components`（L316 `getFieldConf(components, item)` / L346 `mergeFieldConfig(components, ...)`）始终拿最新值 ✅
  - L347 `dispatch(setComponents(results))` ✅
- **⚠️ 隐患**：`handleAlign` 在 `selectFields.forEach` 循环内连续 `dispatch(setComponents(results))`（L347），每次循环都基于本轮闭包的 `components` 计算 `results`，但 dispatch 是异步生效的——循环内后续迭代仍读旧 `components`，可能导致多选对齐时只有最后一个组件的位置生效。
  - 但这是**原代码就存在的问题**（task-011 未引入新 bug），`useDesigner` 时代 `state.components` 在闭包内也是同一份引用。task-011 切换后行为一致。
  - 严重度：low（pre-existing，不阻塞 task-011）
- 结论：切换正确，pre-existing 多选对齐问题不影响 task-011

#### 7. `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` ✅

- 切换情况（`src/designer/common/field/layout-block/config/ConfigurationPanel.tsx`）：
  - L2 import：`useSelector, shallowEqual` ✅
  - L6 import：`useViewTabsKey, useSetView, useUpdateFieldConfig` ✅
  - L19：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L25：`const submitFieldConfig = useUpdateFieldConfig()` ✅
- **重点核查：闭包陷阱**
  - `onValueChange` 用 `usePersistFn`（L27）包裹 ✅
  - 闭包内读 `components` / `selected`（L29 `getFieldConf(components, selected)`）—— `usePersistFn` 保证拿最新值 ✅
  - `submitFieldConfig(selected, {...value, config: {...value.config, ...(params||{})}})` ✅
- **⚠️ 小问题**：L13-15 `const { selected } = useSelector(...)` 返回对象但配了 `shallowEqual` ✅，但 selector 返回 `{selected: ...}` 只有一个字段，直接 `useSelector(s => s.component.selected)` 更简洁。不影响正确性。
- 结论：切换正确，闭包安全

#### 8. `src/designer/toolbar/index.js` ❌

- 切换情况（`src/designer/toolbar/index.js`）：
  - L6 import：`useSelector, shallowEqual, useDispatch` ✅
  - L8 import：`setDesignerCanvasState` ✅
  - L46-48：`dispatch` / `page` / `components` 都正确从 useSelector/useDispatch 取 ✅
  - L365：`dispatch(setDesignerCanvasState({ page: config.page, components: config.components }))` ✅
- **❌ 严重问题**：L414 `designerState={state}` —— `state` 变量在组件作用域内**完全未定义**！
  - grep `\bstate\b` 该文件只命中 L54（注释 "setView 来自 useSetView（只写不读，不订阅 view state）"）和 L414（bug 行）
  - 这是 task-011 切换时漏改：原 `useDesigner()` 返回 `{ state }`，切换后 `state` 变量被删除，但 L414 的 `designerState={state}` 没改成 `designerState={{ page, components }}` 或 `designerState={useSelector(s => s.designerCanvas)}`
  - **运行时影响**：用户点击"生成模板"按钮 → `setModalState({ saveAsTempModalVisible: true })` → `ModalSaveAsTemp` 渲染 → React 求值 `designerState={state}` → 抛 `ReferenceError: state is not defined` → 弹框崩溃
  - `ModalSaveAsTemp`（`src/designer/toolbar/comp/saveAsTemp-modal/index.tsx` L48-62）确实需要 `designerState.page` / `designerState.components` 来构造保存参数
  - **建议修复**：
    ```jsx
    designerState={useSelector((s) => s.designerCanvas, shallowEqual)}
    ```
    或在组件顶层加：
    ```jsx
    const designerState = useSelector((s) => s.designerCanvas, shallowEqual);
    ```
    然后改 L414 为 `designerState={designerState}`
  - 严重度：**high**（功能崩溃，但仅影响"生成模板"按钮，不影响核心画布操作）
- **重点核查：撤销/重做按钮**
  - 该文件 grep `undo` / `redo` 0 命中，撤销/重做不在此文件（原 task-011 清单描述有误，实际在 DesignerContent.tsx）
- 结论：**有 high severity bug**，阻塞 task-011 的 done 状态

---

### 6.3 批次 3（4 个文件）

#### 9. `src/designer/aside-panel/layers-tree/index.jsx` ✅

- 切换情况（`src/designer/aside-panel/layers-tree/index.jsx`）：
  - L3 import：`connect, batch, useSelector, shallowEqual` ✅
  - L5 import：`useViewLayersTreeCollapsed, useSetView, useUpdateFieldConfig, useCustomFieldsList, useRealtimeDataFlow` ✅
  - L6 import：`setComponents` ✅
  - L21-22：`useCustomFieldsList()` / `useRealtimeDataFlow()` ✅
  - L24：`const components = useSelector((s) => s.designerCanvas.components, shallowEqual)` ✅
  - L25：`const state = useMemo(() => ({ components }), [components])` ✅（伪 state 传给 layerManager）
  - L30：`useUpdateFieldConfig()` ✅
- **重点核查：图层树渲染刷新**
  - L39-46：`rootParent = useMemo(() => ({..., children: state.components || []}), [state.components])` ✅
  - L48-54：`useEffect` 依赖 `[selected, state.components]`，正确响应组件树变化 ✅
  - L72/80/88/96/114/130/138：`layerManager.xxx(state, selected, ...)` ✅
  - L115-116：删除时 `customFieldsList.del(selected)` + `realtimeDataFlow.del(selected)` ✅
- 结论：完全符合 §3.3.5 + §3.3.4 模板

#### 10. `src/designer/aside-panel/layers-tree/tree/index.tsx` ✅

- 切换情况（`src/designer/aside-panel/layers-tree/tree/index.tsx`）：
  - L4 import：`batch, useDispatch, useSelector, shallowEqual` ✅
  - L5 import：`useSetView, useFlatComponents` from `@Src/store/designer/hooks` ✅（import 路径已切换）
  - L6 import：`setComponents, type RootReducerState` ✅
  - L26：`const components = useSelector(...)` ✅
  - L27：`const designerState = useMemo(() => ({ components }), [components])` ✅
  - L32：`const [flatComponents] = useFlatComponents()` ✅
- **重点核查：useFlatComponents 返回一元组解构**
  - L32 `const [flatComponents] = useFlatComponents()` —— 只解构第一个元素，未解构 `forceUpdate` ✅
  - `hooks.ts` L182-185 `useFlatComponents` 返回 `[flatComponents] as const`，调用方解构第一个元素正确 ✅
- **重点核查：onDrop**
  - L104：`const onDrop = useOnDrop(designerState, props, (info) => dispatch(setComponents(info.components)))` ✅
  - `useOnDrop`（`useOnDrop.ts` L69-107）接收 `state` 参数，内部读 `state.components`（L73/L78）—— 传 `designerState = { components }` 兼容 ✅
- 结论：完全符合 §3.3.5 + §3.3.7 模板

#### 11. `src/designer/renderer/designer-field/index.tsx` ✅

- 切换情况（`src/designer/renderer/designer-field/index.tsx`）：
  - L7 import：`batch, useSelector, useDispatch, shallowEqual, useStore` ✅
  - L14 import：`useFieldConf, useViewScale` ✅
  - L15 import：`setComponents, type RootReducerState` ✅
  - L58：`const fieldById = useFieldConf(propsDataSource.uniqueId)` ✅（字段级订阅，对应 §3.3.2 模板）
  - L59：`const dataSource = (fieldById as unknown as DataSource) || propsDataSource` ✅（byId 不存在时回退 propsDataSource）
  - L89：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L90：`const state = useMemo(() => ({ components }), [components])` ✅
- **重点核查：useFieldConf vs useSelector 全量读**
  - 渲染读用 `useFieldConf`（字段级）✅
  - 回调内读 `state.components`（L193 `draggableHelper.dragFieldInLayoutBlock(state.components, ...)` / L202 `dropToGroup(state, ...)` / L227 `getParent(state.components, ...)` / L233 `getFieldConf(state.components, ...)` / L259 `getResizedComponents(ref, position, dataSource, state)`）—— 这些是工具函数需要完整树，不能用 byId，所以保留 `useSelector` 读 components 是正确的 ✅
- **重点核查：回调内 updateFieldConfig / setComponents**
  - L204：`dispatch(setComponents(info.components))` ✅
  - L219：`onValueChange(latestDataSource.uniqueId, {...})` —— 这个 `onValueChange` 是 props 传入的（来自 DesignerContent L266 `usePersistFn`），内部走 `submitFieldConfig` ✅
  - L259：`dispatch(setComponents(getResizedComponents(...)))` ✅
- **重点核查：latestCache 模式**
  - L106-110：`latestCache.current = { ...latestCache.current, dataSource }` —— 每次 render 同步赋值，非 useEffect ✅（这个是 ref 直接赋值，不需要 useEffect，因为是同步 render 期间更新）
- **重点核查：getSelected 用 store.getState()**
  - L81：`const store = useStore<any>()` ✅
  - L122-124：`getSelected()` 用 `store.getState().component.selected` ✅（惰性读，不订阅）
- 结论：完全符合 §3.3.2 + §3.3.5 模板，性能优化到位

#### 12. `src/designer/DesignerContent.tsx` ✅

- 切换情况（`src/designer/DesignerContent.tsx`）：
  - L2 import：`useSelector, useDispatch, batch, shallowEqual` ✅
  - L13 import：`updateView, useUpdateFieldConfig, useCustomFieldsList, useRealtimeDataFlow` ✅
  - L14 import：`setDesignerCanvasState, setComponents, type DesignerCanvasState, type RootReducerState` ✅
  - L137：`const state = useSelector<RootReducerState, DesignerCanvasState>((s) => s.designerCanvas, shallowEqual)` ✅
  - L138-139：`useRealtimeDataFlow()` / `useCustomFieldsList()` ✅
  - L141：`useUpdateFieldConfig()` ✅
- **重点核查：setState shim（L146-155）**
  - L147：`if (nextState && typeof nextState === 'object' && 'components' in nextState)` ✅
  - L148：`dispatch(setComponents(nextState.components))` ✅
  - L149-151：`if (_.isEmpty(nextState.components)) dispatch(setDesignerCanvasState({ realtimeDataFlow: [], customFieldsListMapping: {} }))` ✅（对应原 clearRuntime 分支）
  - L153：`else dispatch(setDesignerCanvasState(nextState))` ✅
  - **未简化掉原分支逻辑** ✅
- **重点核查：latestCache（L167-174）**
  - L167：`useRef({ selected, state, configValidator: props.configValidator, customFieldsListManager, realtimeDataFlowManager })` ✅
  - L168-174：`latestCache.current = { selected, state, ... }` —— **每次 render 同步赋值，不是 useEffect** ✅
  - 与 §3.3.6 模板略有差异（模板建议用 `useEffect(() => { ref.current = state }, [state])`），但实际实现是 render 期间直接赋值，**更早同步**（useEffect 在 commit 后才执行，render 期间赋值在 render 阶段就生效）
  - 闭包陷阱安全：`handleDelete`（L362-382）在 `useEffect` 内注册到 window keydown，回调内读 `latestCache.current.state` / `latestCache.current.selected` / `latestCache.current.customFieldsListManager` / `latestCache.current.realtimeDataFlowManager` ✅（拿最新值）
- **重点核查：useEffect 依赖 byId（L264）**
  - L264：`}, [state.byId[selected.split(',')[0]]])` ✅（task-008 改造，字段级订阅语义）
- 结论：完全符合 §3.3.6 模板（且 latestCache 同步比模板更早），未简化分支逻辑

---

### 6.4 批次 4（3 个文件 + provider）

#### 13. `src/designer/context-menu/DesignerContextMenu.tsx` ✅

- 切换情况（`src/designer/context-menu/DesignerContextMenu.tsx`）：
  - L9 import：`useSelector, useDispatch, batch, shallowEqual` ✅
  - L13 import：`useCustomFieldsList, useRealtimeDataFlow` ✅
  - L14 import：`setComponents, type RootReducerState` ✅
  - L117：`const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual)` ✅
  - L118：`const designerState = useMemo(() => ({ components }), [components])` ✅
  - L119-120：`useCustomFieldsList()` / `useRealtimeDataFlow()` ✅
- **重点核查：右键菜单操作拿正确 components**
  - L238-257：`layerManager.copy/moveToTop/.../delete(designerState, selected, callback)` ✅
  - L252-257：删除时同时调 `customFieldsList.del(selected)` + `realtimeDataFlow.del(selected)` ✅
- **重点核查：useDesignerContextMenu hook（L285-316）**
  - L288-289：`useSelector` 读 selected / designerType ✅
  - L290-291：`latestState.current = { selected, designerType }` render 期间同步 ✅
  - hook 内未调任何 hook 在回调内 ✅
- 结论：完全符合 §3.3.5 + §3.3.4 模板

#### 14. `src/designer/context-menu/hooks/useConvertMenuState.tsx` ⚠️

- 切换情况（`src/designer/context-menu/hooks/useConvertMenuState.tsx`）：
  - L2 import：`useSelector, shallowEqual` ✅
  - L4 import：`usePersistFn` ✅
  - L5 import：`type RootReducerState` ✅
  - L12：`const designerState = useSelector((s: RootReducerState) => s.designerCanvas, shallowEqual)` ✅
  - L13：`const latestCache = useRef({ designerState, currentNode: null, menuState: null })` ✅
- **重点核查：latestCache 同步**
  - L16：`latestCache.current.designerState = designerState` —— 在 `convertMenuState` **函数体内**赋值，不是 useEffect ✅
  - `convertMenuState` 用 `usePersistFn` 包裹（L15），每次调用都先同步 `latestCache.current.designerState = designerState`，然后读 `latestCache.current.designerState.components`（L31）✅
  - `usePersistFn` 保证 `designerState` 闭包始终是最新一次 render 的值 ✅
- **⚠️ 隐患**：`usePersistFn` 的实现是"每次 render 更新 ref，调用时从 ref 取最新闭包"。`convertMenuState` 在 `DesignerContextMenu.tsx` L126 被调用（`contextMenuState: convertMenuState(state.app.contextMenu?.node || null, state) || {}`），是在 useSelector 的 selector 函数内调用——**selector 内有副作用**（L16 赋值 latestCache.current.designerState）。
  - React-Redux 文档警告：selector 应该是纯函数，不应有副作用。但实际副作用只是 ref 赋值，不会导致错误结果（只是 React 18 严格模式可能调用两次 selector）。
  - 严重度：low（潜在违规，但行为正确）
- **重点核查：useCustomFieldsList().get 同步读**
  - 本文件未调 `useCustomFieldsList`（grep 0 命中），`get` 的消费方在其他文件 ✅
- 结论：切换正确，但 selector 内有副作用（low severity，不阻塞）

#### 15. `src/formily/FedxReportContext.tsx` ✅

- 切换情况（`src/formily/FedxReportContext.tsx`）：
  - L2 import：`useSelector, shallowEqual` ✅
  - L10 import：`useFlatComponents, useRealtimeDataFlow, useCustomFieldsList` from `@Src/store/designer/hooks` ✅
  - L74-75：`useRealtimeDataFlow()` / `useCustomFieldsList()` ✅
  - L76：`const uniqueId: string = useSelector((state: any) => _.get(state, 'component.selected'))` ✅（显式 `: string` 类型修复）
  - L48：`useCurrentRealtimeDataFlowSource` 内 `useSelector((s) => s.designerCanvas.realtimeDataFlow, shallowEqual)` ✅
- **重点核查：Provider value 用 useMemo**
  - L84-108：`const context = useMemo(() => {...}, [envModel, compInfo, appScopeId, latest])` ✅
  - `recordRealtimeDataFlow` / `customFieldsList.record` / `customFieldsList.get` 通过 `latest.current.xxx` 间接调用，避免闭包陷阱 ✅
- **重点核查：useCurrentRealtimeDataFlowSource**
  - L45-61：`useFlatComponents()` + `useSelector(realtimeDataFlow)` + `useMemo([flatComponents, realtimeDataFlow])` ✅
- 结论：完全符合 §3.3.4 模板，Provider value 正确 memo 化

#### 16. `src/designer/common/context/context-designer/Designer.tsx` ✅

- 切换情况（`src/designer/common/context/context-designer/Designer.tsx`）：
  - 文件已清空，仅保留 L12 `export * from './screen-performance'` ✅
  - L1-11 是注释说明历史 ✅
  - grep `useDesigner\(` / `DesignerContext\b` 在本文件 0 命中（仅注释提到历史）✅
- **重点核查：common/index.ts barrel**
  - `src/designer/common/index.ts` L11 `export * from './context/context-designer'` ✅
  - 由于 `Designer.tsx` 仅 re-export `./screen-performance`，barrel 仍能正常工作 ✅
- 结论：完全符合 §3.4 / §3.5 模板

---

### 6.5 通用审查项（§3）

#### 3.1 grep `useDesigner\|DesignerContext` 残留 ✅

- `src/designer/` + `src/formily/` grep 结果：
  - `useDesigner(` 调用：**0 命中**（活跃代码）✅
  - `DesignerContext\b`：**0 命中**（活跃代码）✅
  - 残留命中均为：
    - 注释（`DataProvider.tsx` L10/L12、`Designer.tsx` L3、`types.ts` L1/L7、`hooks.ts` L115/L143/L173）
    - `.bak` 文件（`canvas-graph/index.bak.js` L72、`DesignerField.bak.jsx` L17/L260）
    - 组件名 `DesignerContextMenu` / hook 名 `useDesignerContextMenu`（右键菜单，与 `useDesigner` Context 无关）
- 结论：✅ 符合预期

#### 3.2 回调内 state 引用是否安全（无闭包陷阱）✅

- 异步回调（setTimeout / Promise / event listener）内的 `components` 检查：
  - **DropContainer.tsx** `handleDrop`（async + await）：用 `usePersistFn` 包裹 ✅
  - **DesignerContent.tsx** `handleDelete`（window keydown listener）：用 `latestCache.current.state` ✅
  - **DesignerContent.tsx** `handleSave`（setInterval + window keydown）：用 `usePersistFn` 包裹，闭包内读 `state`（L286/L303/L307-318）—— `usePersistFn` 保证最新值 ✅
  - **FedxReportContext.tsx** Provider value 的 `recordRealtimeDataFlow` / `customFieldsList.record/get`：用 `latest.current.xxx` ✅
- 结论：✅ 无闭包陷阱

#### 3.3 React hook 规则未被破坏 ✅

- 所有 16 个文件检查 `useXxx` 调用位置：
  - **group/index.js**：原 `onValueChange` 回调内调 `useDesigner()` 的 hook 违规**已修复**（L18-22 移到顶层）✅
  - 其他 15 个文件：所有 `useSelector` / `useDispatch` / `useFieldConf` / `useUpdateFieldConfig` / `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents` / `useMemo` / `useRef` / `useEffect` 均在组件顶层调用 ✅
- 结论：✅ 无 hook 违规

#### 3.4 useMemo/useCallback 依赖数组正确 ✅

- 检查所有 `useMemo` / `useCallback` 依赖数组：
  - **recursion-components/index.tsx** L41：`[components, props.onValueChange, props.enableWidgetMovable]` ✅（新 `components` 变量，非旧 `state.components`）
  - **configuration-panel/index.js** L40：`[selected, components]` ✅
  - **layers-tree/index.jsx** L45：`[state.components]` ✅（`state.components` 是 `useMemo(() => ({ components }), [components]).components`，引用等价于 `components`）
  - **layers-tree/index.jsx** L54：`[selected, state.components]` ✅
  - **canvas-graph/index.tsx** L115：`[components]` ✅
  - **designer-field/index.tsx** L90：`[components]` ✅
  - **toolbar/index.js** L252：`[topToolbarHiddenList, visualType]` ✅
  - **FedxReportContext.tsx** L60：`[flatComponents, realtimeDataFlow]` ✅
  - **FedxReportContext.tsx** L108：`[envModel, compInfo, appScopeId, latest]` ✅
- 结论：✅ 无旧 `state.components` 失效引用

#### 3.5 useSelector 对象/数组返回值配 shallowEqual ✅

- 检查所有 `useSelector` 返回对象/数组的场景：
  - **page/index.jsx** L14：`page`（对象）配 shallowEqual ✅
  - **DropContainer.tsx** L20：`components`（数组）配 shallowEqual ✅
  - **DropContainer.tsx** L23：`designerType`（标量）无需 shallowEqual ✅
  - **configuration-panel/index.js** L20：`components`（数组）配 shallowEqual ✅
  - **configuration-panel/index.js** L24：`selected`（标量）无需 ✅
  - **group/index.js** L22：`components`（数组）配 shallowEqual ✅
  - **recursion-components/index.tsx** L10：`components`（数组）配 shallowEqual ✅
  - **canvas-graph/index.tsx** L113：`components`（数组）配 shallowEqual ✅
  - **canvas-graph/index.tsx** L110：`selected`（标量）无需 ✅
  - **layout-block/ConfigurationPanel.tsx** L13-15：返回对象 `{selected}` 配 shallowEqual ✅
  - **layout-block/ConfigurationPanel.tsx** L19：`components`（数组）配 shallowEqual ✅
  - **toolbar/index.js** L47-48：`page` / `components` 配 shallowEqual ✅
  - **toolbar/index.js** L59：`app` slice 对象，**未配 shallowEqual** ⚠️
    - `const { topToolbarHiddenList, designerType } = useSelector((fullState) => fullState.app)` —— 返回整个 `app` slice 对象，未配 shallowEqual
    - 严重度：low（`app` slice 变化频率低，且只解构两个字段，性能影响小；但严格说应配 shallowEqual 或改为 `useSelector(s => ({topToolbarHiddenList: s.app.topToolbarHiddenList, designerType: s.app.designerType}), shallowEqual)`）
    - **pre-existing**：原代码可能就是这样写的，task-011 未引入新问题
  - **layers-tree/index.jsx** L24：`components` 配 shallowEqual ✅
  - **layers-tree/tree/index.tsx** L26：`components` 配 shallowEqual ✅
  - **layers-tree/tree/index.tsx** L35-58：返回对象配 shallowEqual ✅
  - **designer-field/index.tsx** L69-78：返回对象配 shallowEqual ✅
  - **designer-field/index.tsx** L89：`components` 配 shallowEqual ✅
  - **DesignerContent.tsx** L121：`selected`（标量）无需 ✅
  - **DesignerContent.tsx** L137：`designerCanvas`（对象）配 shallowEqual ✅
  - **DesignerContextMenu.tsx** L117：`components` 配 shallowEqual ✅
  - **DesignerContextMenu.tsx** L123-131：返回对象配 shallowEqual ✅
  - **useConvertMenuState.tsx** L12：`designerCanvas`（对象）配 shallowEqual ✅
  - **FedxReportContext.tsx** L48：`realtimeDataFlow`（数组）配 shallowEqual ✅
  - **FedxReportContext.tsx** L76：`selected`（标量）无需 ✅
  - **DesignerContextMenu.tsx** L288-289（useDesignerContextMenu）：`selected` / `designerType`（标量）无需 ✅
- 结论：✅ 基本符合，toolbar/index.js L59 是 pre-existing 小问题（low）

#### 3.6 layerManager.xxx(state, ...) 的伪 state 检查 ✅

- `layer-manager/` 下所有文件 grep `state\.(components|byId|parentMap|page|meta|realtimeDataFlow|customFieldsListMapping|undo|redo)` 结果：
  - **全部 29 处命中都是 `state.components`** ✅
  - 无任何 `state.byId` / `state.parentMap` / `state.page` / `state.meta` 等读取 ✅
- 调用方构造的伪 state（`useMemo(() => ({ components }), [components])`）足够支撑 layer-manager ✅
- 涉及调用方：
  - `canvas-graph/index.tsx` L115 ✅
  - `layers-tree/index.jsx` L25 ✅
  - `layers-tree/tree/index.tsx` L27 ✅
  - `designer-field/index.tsx` L90 ✅
  - `DesignerContextMenu.tsx` L118 ✅
- 结论：✅ layer-manager 只读 `state.components`，伪 state 安全

---

### 6.6 发现的问题列表

| # | 严重度 | 文件:行 | 描述 | 建议修复 |
| --- | --- | --- | --- | --- |
| 1 | **high** | `src/designer/toolbar/index.js:414` | `designerState={state}` 引用未定义的 `state` 变量（task-011 切换时漏改，原 `useDesigner()` 返回的 `state` 已删除）。用户点击"生成模板"按钮 → `ModalSaveAsTemp` 渲染 → 抛 `ReferenceError: state is not defined` → 弹框崩溃 | 在组件顶层（L48 附近）加 `const designerState = useSelector((s) => s.designerCanvas, shallowEqual);`，然后改 L414 为 `designerState={designerState}` |
| 2 | low | `src/designer/context-menu/hooks/useConvertMenuState.tsx:16` | `convertMenuState` 在 `useSelector` 的 selector 函数内被调用（`DesignerContextMenu.tsx:126`），且函数体内有副作用（`latestCache.current.designerState = designerState`）。React-Redux 要求 selector 是纯函数 | 把 `latestCache.current.designerState = designerState` 移到 `useEffect(() => { latestCache.current.designerState = designerState }, [designerState])`，或把 `convertMenuState` 调用移出 selector（在 useMemo 内调用） |
| 3 | low | `src/designer/toolbar/index.js:59` | `useSelector((fullState) => fullState.app)` 返回整个 `app` slice 对象，未配 `shallowEqual`。`app` slice 任意字段变化都会触发 toolbar re-render | 改为 `useSelector((s) => ({ topToolbarHiddenList: s.app.topToolbarHiddenList, designerType: s.app.designerType }), shallowEqual)`（pre-existing，非 task-011 引入） |
| 4 | low | `src/designer/canvas-graph/index.tsx:311-349` | `handleAlign` 在 `selectFields.forEach` 循环内连续 `dispatch(setComponents(results))`，循环内后续迭代仍读旧 `components`，多选对齐时只有最后一个组件位置生效 | 改为在循环外一次性合并所有对齐结果，或用 `reduce` 累积（pre-existing，非 task-011 引入） |

---

### 6.7 总结论

#### 是否有"看似切换了但语义漂移"的情况

- **15 个文件切换正确，无语义漂移** ✅
- **1 个文件有 high severity bug**：`toolbar/index.js` L414 `designerState={state}` 引用未定义变量，属于切换时遗漏，会导致"生成模板"功能崩溃
- **3 个 low severity 问题**（2 个 pre-existing、1 个 selector 副作用），不阻塞 task-011

#### 是否阻塞 task-011 的 done 状态

- **阻塞**：问题 #1（high）必须修复后才能确认 task-011 完成。该 bug 会导致"生成模板"按钮点击后弹框崩溃，属于功能性回归。
- **不阻塞**：问题 #2~#4（low）可单独修复或记录到 memo。

#### task-011 实施质量评价

- 16 个调用方中 15 个切换正确（93.75%），模板应用规范
- `useFieldConf` / `useUpdateFieldConfig` / `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents` 5 个新 hook 设计合理，API 与旧 `useDesigner()` 返回值形态对齐
- `DesignerContent.tsx` 的 `setState` shim 完整保留了原 `'components' in nextState` / `clearRuntime` 分支逻辑，未简化
- `latestCache` 模式（render 期间同步赋值）比 §3.3.6 模板建议的 `useEffect` 同步更早生效，闭包陷阱安全
- `Designer.tsx` / `DataProvider.tsx` / `types.ts` / `common/index.ts` barrel 清理干净
- grep 校验通过（`useDesigner(` / `DesignerContext` 在活跃代码 0 命中）

**建议**：修复问题 #1 后，task-011 可维持 done 状态；问题 #2~#4 记录到 `memo.md` 作为后续优化项。
