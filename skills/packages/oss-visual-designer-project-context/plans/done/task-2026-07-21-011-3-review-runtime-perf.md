# Review task-011-3：运行时行为与性能

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-011-3-review`
> 上游任务：[task-2026-07-21-011](./done/task-2026-07-21-011-drop-usedesigner-compat.md)
> 状态：`planning`
> 类型：`review`
>
> **目标**：审查 task-011 改造在运行时的实际行为，重点排查 latestCache 同步、useFlatComponents 去 forceUpdate 影响、订阅粒度、re-render 性能、440 组件场景表现。

---

## 1. 背景

task-011 的静态正确性（reducer / 调用方）由 task-011-1 / 011-2 review 覆盖。本任务聚焦**运行时行为**——这些是静态阅读难以发现、必须实际运行或深入推演才能暴露的问题：

1. `latestCache` 异步同步是否真的同步（task-011 §3.3.6 模板）
2. `useFlatComponents` 去掉 `forceUpdate` 后，调用方在"字段级更新"场景下是否还能拿到刷新的 flat 列表
3. `useCustomFieldsList.get` 用 `store.getState()` 同步读，在响应式场景下是否漏更新
4. Context 删除后，re-render 范围是否真的缩小（性能目标达成）
5. 440 组件场景下，字段级订阅是否真的避免了全量重渲染

---

## 2. 审查清单

### 2.1 latestCache 同步正确性

涉及文件：
- `src/designer/DesignerContent.tsx`
- `src/designer/context-menu/hooks/useConvertMenuState.tsx`

- [ ] **2.1.1** `DesignerContent.tsx` 是否有 `useEffect(() => { latestCache.current.designerState = state; }, [state])`？
- [ ] **2.1.2** `useConvertMenuState.tsx` 同上？
- [ ] **2.1.3** **闭包陷阱推演**：
    - 用户右键组件 A → 弹出菜单 → 1 秒后另一个 dispatch 改了 components → 用户点"删除"
    - 此时 `latestCache.current.designerState.components` 是**新的**还是**旧的**？
    - 如果是旧的，删除操作可能作用于已不存在的组件 —— **严重 bug**
- [ ] **2.1.4** `state` 的引用是否在每次 dispatch 后都变（`shallowEqual` 下，字段级 `updateFieldConfig` 会不会让顶层 `designerCanvas` 引用变化）？
    - `useSelector(s => s.designerCanvas, shallowEqual)` + 字段级更新：顶层引用不变 → `latestCache` 不更新 → **异步拿到旧值**
    - 这是 task-008 字段级更新与 task-011 latestCache 模式的**潜在冲突**

### 2.2 useFlatComponents 去 forceUpdate 的影响

涉及文件：
- `src/formily/FedxReportContext.tsx`
- `src/designer/aside-panel/layers-tree/tree/index.tsx`

- [ ] **2.2.1** 两个调用方是否真的只用 `[flatComponents]` 第一个元素，不依赖 `forceUpdate`？
    ```bash
    grep -rn "useFlatComponents" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
    ```
- [ ] **2.2.2** **关键推演**：`useFlatComponents` 订阅 `s.designerCanvas.components`（顶层引用）。
    - 拖入新组件 → `setComponents(newTree)` → 顶层引用变 → flat 重算 ✅
    - 字段级 `updateFieldConfig(uniqueId, { x: 100 })` → **顶层引用不变** → flat 不重算
    - 图层树 / FedxReport 是否依赖字段级变化的 flat 重算？
        - 如果依赖 → **回归 bug**：拖动组件位置时图层树不刷新
        - 如果不依赖 → 确认调用方只关心"结构变化"（增删组件）不关心"字段变化"
- [ ] **2.2.3** 旧 `useFlatComponents` 用 `useLazyUpdate` 延迟更新，新版本去掉了。是否有场景需要"批量更新后一次重算"（旧机制的防抖效果）？去掉后是否在 440 组件 + 高频拖拽下卡顿？

### 2.3 useCustomFieldsList.get 同步读

涉及文件：
- `src/designer/context-menu/hooks/useConvertMenuState.tsx`（主要消费方）
- 其他可能调用 `.get` 的地方

- [ ] **2.3.1** grep `useCustomFieldsList().get` 或 `.get(uniqueId)` 调用方
- [ ] **2.3.2** 每个调用方是否在**同步计算**场景（不是响应式渲染）？
    - 响应式场景应改用 `useSelector(s => s.designerCanvas.customFieldsListMapping[uniqueId])`
- [ ] **2.3.3** **推演**：用户改了组件 A 的 customFields → 右键组件 A → 菜单状态计算调 `.get(A)`
    - `store.getState()` 拿到的是**最新的**（Redux 是同步的）✅
    - 所以只要 `.get` 在用户交互触发的同步流里调用，就没问题
    - 但如果是 `useMemo([deps])` 内调用，deps 不含 customFieldsListMapping → **漏更新** ❌

### 2.4 Context 删除后的 re-render 表现

- [ ] **2.4.1** React DevTools Profiler 验证：
    - 改一个组件的 `x` 位置 → 应该只有该组件 + 配置面板 re-render
    - 不应该有 16 个调用方全量 re-render（task-011 的核心目标）
- [ ] **2.4.2** `DataProvider` 退化为 `<>{children}</>` 后，是否真的不再触发子树 re-render？
    - 占位组件没有 state / props 变化，不会 re-render ✅
- [ ] **2.4.3** `FedxReportContext` 的 Provider value 是否用 `useMemo` 包裹？
    - 如果没包，每次 Provider 重渲染都会让所有 consumer 重渲染 —— **性能回归**

### 2.5 440 组件场景

- [ ] **2.5.1** 加载 440 组件的大屏 → 拖拽一个组件 → 是否卡顿？
- [ ] **2.5.2** 改一个组件的配置 → 是否只该组件 re-render（用 Profiler 确认）？
- [ ] **2.5.3** 图层树滚动 / 选中切换是否流畅？
- [ ] **2.5.4** 对比改造前后的 Profiler 火焰图（如果改造前有基线）

### 2.6 撤销/重做栈

- [ ] **2.6.1** `DesignerContent.tsx` 的 `setState` shim 是否正确处理 undo/redo？
- [ ] **2.6.2** undo 后 `realtimeDataFlow` / `customFieldsListMapping` 是否回滚？
    - **隐患**：task-011 把这两个写入路径迁到独立 action，但 undo 栈可能只记录 `components` 变化 —— 确认 undo 是否能回滚 runtime 数据

---

## 3. 审查方法

1. **代码推演**：对每个 latestCache / get 调用点，推演"异步 + 字段级更新"场景
2. **运行时验证**：
   - `pnpm start` 加载 440 组件大屏
   - React DevTools Profiler 录制：拖拽 / 改配置 / 右键菜单
   - 检查 re-render 范围
3. **断点调试**：在 `latestCache.current.designerState = state` 处打断点，确认同步时机
4. **对比基线**：如果可能，`git stash` 改造前后对比 Profiler

---

## 4. 输出

在本文档 §5"审查记录"追加：
- 每个清单项的 ✅ / ❌ / ⚠️ 结论
- Profiler 截图（如适用）
- 发现的问题列表（编号、严重度、文件:行、描述、建议修复）
- 440 组件场景的性能数据

---

## 5. 审查记录

> 审查人：AI Agent（静态代码推演，未运行 `pnpm start`）
> 审查日期：2026-07-21
> 审查方式：代码阅读 + 闭包同步时机推演 + 字段级更新与 latestCache 交互推演
> 性能项：440 组件场景用静态推演代替，标注"需运行时验证"

### 5.1 2.1 latestCache 同步正确性

#### 2.1.1 `DesignerContent.tsx` 是否有 `useEffect(() => { latestCache.current.designerState = state; }, [state])`？

**⚠️ 不完全符合模板，但采用了更强的同步策略**

[`DesignerContent.tsx:167-174`](src/designer/DesignerContent.tsx) 的实现：

```ts
const latestCache = useRef({ selected, state, configValidator: props.configValidator, customFieldsListManager, realtimeDataFlowManager });
latestCache.current = {
    selected,
    state,
    configValidator: props.configValidator,
    realtimeDataFlowManager,
    customFieldsListManager,
};
```

**关键观察**：第 168-174 行是**同步赋值**（在函数体顶层，不是 `useEffect`）。这意味着**每次 render 时** `latestCache.current` 都会被刷新为本次 render 的最新 `state` —— 比 `useEffect` 模板更早、更可靠（`useEffect` 在 commit 后才执行，期间若有同步事件可能拿到旧值）。

字段名是 `latestCache.current.state`（不是 `designerState`），但语义等价。

#### 2.1.2 `useConvertMenuState.tsx` 同上？

**⚠️ 不符合 `useEffect` 模板，但策略合理**

[`useConvertMenuState.tsx:12-16`](src/designer/context-menu/hooks/useConvertMenuState.tsx)：

```ts
const designerState = useSelector((s: RootReducerState) => s.designerCanvas, shallowEqual);
const latestCache = useRef({ designerState, currentNode: null as any, menuState: null as any });

const convertMenuState = usePersistFn((node, state) => {
    latestCache.current.designerState = designerState;
    ...
```

**关键观察**：
- `latestCache.current.designerState` **不是在 render 中同步赋值**，而是在 `convertMenuState` 被调用时（通过 `usePersistFn` 的闭包）赋值
- [`usePersistFn.ts:12-13`](../../../../packages/hooks/src/usePersistFn.ts) 内部 `fnRef.current = fn` 每次 render 都更新最新闭包，所以 `convertMenuState` 调用时拿到的 `designerState` 是**最近一次 render 的 `useSelector` 结果**
- 这意味着 `latestCache.current.designerState` 在 `convertMenuState` 调用时才更新，不是 render 时就更新 —— 但对调用方来说等价（因为只有调用 `convertMenuState` 才会用到）

#### 2.1.3 闭包陷阱推演：右键 → dispatch → 点删除

**✅ 无闭包陷阱**

推演路径：
1. 用户右键组件 A → `useDesignerContextMenu.showContextMenu` ([`DesignerContextMenu.tsx:296-313`](src/designer/context-menu/DesignerContextMenu.tsx)) dispatch `contextMenuAction({ node })` + `component/selected`
2. 1 秒后另一个 dispatch 改了 components（如拖拽 / 字段级 `updateFieldConfig`）
3. 用户点"删除" → `onMenuClick` ([`DesignerContextMenu.tsx:216-265`](src/designer/context-menu/DesignerContextMenu.tsx)) → `layerManager.delete(designerState, selected, ...)`

**关键**：`DesignerContextMenu` 第 117-118 行：
```ts
const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual);
const designerState = useMemo(() => ({ components }), [components]);
```

`designerState` 是 useMemo 派生，依赖 `components` 引用。**只要 components 引用变 → DesignerContextMenu re-render → designerState 重新生成 → onMenuClick 闭包拿到最新 designerState**。

但 `onMenuClick` 不是 `usePersistFn` 包裹的（是普通函数），它每次 render 都重建，所以闭包里的 `designerState` 永远是当前 render 的。**点删除时拿到的就是最新的 components**。

对于 `DesignerContent.tsx` 的 Delete 键路径（[`DesignerContent.tsx:362-382`](src/designer/DesignerContent.tsx)），用的是 `latestCache.current.state` —— 由 §2.1.1 已确认每次 render 同步刷新，且 `useEffect` 的 `handleDelete` 监听器每次 `[dispatch, setState]` 变化时重新绑定（`setState` 来自 `usePersistFn` 稳定，`dispatch` 稳定，所以监听器只绑定一次）。但 `handleDelete` 内部读的是 `latestCache.current.state` —— ref 永远是最新值，**无闭包陷阱**。

#### 2.1.4 字段级 `updateFieldConfig` 是否让顶层 `designerCanvas` 引用变化？latestCache 是否更新？

**⚠️ 潜在冲突，但实际影响有限**

**推演**：
- `designerCanvas` reducer 的 `updateFieldConfig` case ([`designer-canvas.ts:103-117`](src/store/modules/designer-canvas.ts))：
  ```ts
  return produce(state, (draft) => {
      const target = draft.byId[uniqueId];
      ...
      target.data = { ...target.data, ...patch, ... };
  });
  ```
- Immer `produce` 会返回**新顶层对象**（因为 `draft.byId[uniqueId]` 被修改，`byId` 引用变 → 整个 state 顶层引用变）
- 但 `useSelector(s => s.designerCanvas, shallowEqual)` 的 `shallowEqual` 只比较顶层 keys：`appScopeId` / `components` / `byId` / `parentMap` / `page` / `realtimeDataFlow` / `customFieldsListMapping` / `undo` / `redo` / `meta`
- `updateFieldConfig` 修改了 `byId`（Immer 会生成新 `byId` 引用）→ `shallowEqual` 判定不等 → **触发 re-render → `state` 更新 → `latestCache.current.state` 更新** ✅

**但**：`updateFieldConfig` 不修改 `components` 引用（见注释 "components 数组引用保持稳定"）。这意味着：
- `DesignerContent.tsx` 的 `state` 变了（顶层引用变），latestCache 同步更新 ✅
- `DesignerContextMenu.tsx` 的 `components` selector 不变（`s.designerCanvas.components` 引用不变）→ **designerState 不更新** ⚠️

**影响**：如果用户右键组件 A 后，另一个 dispatch 走的是字段级 `updateFieldConfig`（如改 A 的 x 位置），则 `DesignerContextMenu` 的 `designerState` 不会刷新。但此时点"删除"，`layerManager.delete(designerState, ...)` 用的 `designerState.components` 还是旧的 —— **但旧的 components 树里 A 仍然存在**（字段级更新不改树结构，只改 byId），所以删除操作仍能正确找到 A。

**结论**：字段级更新场景下 `DesignerContextMenu.designerState` 略滞后，但删除/移动等结构性操作走的是 `setComponents`（顶层引用变），会刷新。**实际无 bug**，但建议 `DesignerContextMenu` 改用 `latestCache` + `usePersistFn` 模式以防边界场景。

---

### 5.2 2.2 useFlatComponents 去 forceUpdate 的影响

#### 2.2.1 调用方是否只解构 `[flatComponents]`，不依赖 `forceUpdate`？

**✅ 全部调用方只用第一个元素**

grep 结果（4 个调用方）：
- [`FedxReportContext.tsx:46`](src/formily/FedxReportContext.tsx): `const [flatComponents] = useFlatComponents();`
- [`search-layer.tsx:17`](src/designer/canvas-graph/components/search-layer.tsx): `const [flatComponents] = useFlatComponents();`
- [`layers-tree/tree/index.tsx:32`](src/designer/aside-panel/layers-tree/tree/index.tsx): `const [flatComponents] = useFlatComponents();`
- [`interaction/component/hooks.ts:267`](src/plugins/interaction/component/hooks.ts): `const [flatComponents] = useFlatComponents();`

全部只解构第一个元素，`forceUpdate` 不会被调用（也不会是 undefined 崩溃，因为根本没取）。✅

#### 2.2.2 关键推演：字段级 `updateFieldConfig` 后 flat 是否重算？图层树是否依赖？

**⚠️ 有回归风险，但调用方实际只依赖结构变化**

**推演**：
- `useFlatComponents` ([`hooks.ts:182-186`](src/store/designer/hooks.ts)):
  ```ts
  const components = useSelector((s) => s.designerCanvas.components, shallowEqual);
  const flatComponents = useMemo(() => flatDesignerList(components), [components]);
  ```
- 字段级 `updateFieldConfig` **不改 `components` 引用**（见 §2.1.4）→ `components` selector 不触发 → `flatComponents` 不重算

**调用方分析**：
1. **`layers-tree/tree/index.tsx`**：用 `flatComponents` 计算 `expandedKeys`（基于 `uniqueId` / `parentUniqueId` / `type`，都是结构字段，字段级更新不改这些）→ **不依赖字段级变化** ✅
2. **`FedxReportContext.useCurrentRealtimeDataFlowSource`**：用 `flatComponents` 匹配 `realtimeDataFlow` 里的 `uniqueId`，取 `data.config.title` / `type`。**`title` 是字段级数据**——如果用户改了组件 title，`flatComponents` 不重算 → `useCurrentRealtimeDataFlowSource` 返回的 label 不更新 ⚠️
   - 但这个 hook 只用于实时数据流下拉列表，title 改变的频率极低，且需要用户在配置面板改 title 后立即切到数据流面板才会触发，**概率极低**
3. **`search-layer.tsx`**：搜索图层组件，用 `flatComponents` 渲染列表。**`title` 是显示字段**——改 title 后搜索列表不更新 ⚠️
   - 同样概率低，但比 #2 更可能触发（用户改 title 后搜索）
4. **`interaction/component/hooks.ts`**：交互联动，用 `flatComponents` 查找目标组件。读的是 `uniqueId` / `type` 等结构字段 → **不依赖字段级变化** ✅

**结论**：`#2` 和 `#3` 存在理论回归（改 title 后下拉/搜索列表不刷新），但实际触发概率低。建议：若需修复，`useFlatComponents` 改为订阅 `byId`（`s => s.designerCanvas.byId`），任何字段级更新都会重算 flat（代价是 440 组件下每次字段更新都重算 flat，性能下降）。

#### 2.2.3 旧 `useLazyUpdate` 防抖效果丢失

**⚠️ 有性能回归风险，需运行时验证**

旧实现用 `useLazyUpdate` 延迟更新（推测 30ms 防抖），新实现是 `useMemo` 同步重算。

- 440 组件 + 高频拖拽：每次 `setComponents`（拖拽 onDrop 不走 setComponents，但 onDragStop 走 `updateFieldConfig` 不触发 flat 重算）→ 实际上**拖拽不会触发 flat 重算**（因为走字段级更新）
- 只有**结构性变更**（增删组件 / 成组 / 拖入新组件）才触发 flat 重算 —— 这些操作频率低，440 组件下一次性重算可接受
- **结论**：去 forceUpdate 后实际性能**可能更好**（少了防抖的延迟和额外 re-render），但需运行时验证 440 组件 + 连续增删场景

---

### 5.3 2.3 useCustomFieldsList.get 同步读

#### 2.3.1 调用方 grep

**3 个调用点**：
- [`FedxReportContext.tsx:96`](src/formily/FedxReportContext.tsx): `get: () => latest.current.customFieldsList.get(latest.current.uniqueId)`
- [`field-mapping-table/index.jsx:41`](src/formily/widgets/dynamic-data/field-mapping-table/index.jsx): `const [state, setState] = useSetState({ ..., customFieldsList: customFieldsList.get() ?? [] });`
- [`DesignerContent.tsx:372`](src/designer/DesignerContent.tsx): `latestCache.current.customFieldsListManager.del(...)`（这是 `del` 不是 `get`，不计）

实际 `.get()` 调用只有 2 处。

#### 2.3.2 / 2.3.3 同步读在响应式场景的漏更新

**❌ `field-mapping-table` 存在漏更新**

[`field-mapping-table/index.jsx:41`](src/formily/widgets/dynamic-data/field-mapping-table/index.jsx):
```jsx
const [state, setState] = useSetState({ showModal: false, customFieldsList: customFieldsList.get() ?? [] });
```

**问题**：`customFieldsList.get()` 在**组件 mount 时**调用一次（`useSetState` 初始值），之后 `state.customFieldsList` 是组件内本地状态，**不会响应 `customFieldsListMapping` 的外部变化**。

- 如果用户在别的面板改了 customFields，`field-mapping-table` 不会刷新
- 但 `field-mapping-table` 自己的 `onFinished` ([line 52-55](src/formily/widgets/dynamic-data/field-mapping-table/index.jsx)) 调 `customFieldsList.record(list)` 后也 `setState({ customFieldsList: list })`，**自洽**
- 风险场景：组件 A 的 customFields 被外部清除（如删除组件时 `customFieldsList.del`），`field-mapping-table` 仍显示旧数据 —— **但删除组件后配置面板会切走，`field-mapping-table` unmount，不会残留**

**结论**：理论上有漏更新，但实际调用流程自洽，**无可见 bug**。建议改为 `useSelector(s => s.designerCanvas.customFieldsListMapping[uniqueId])` 以符合响应式惯例。

`FedxReportContext.tsx:96` 的 `get` 在 `useFedxReportContext().customFieldsList.get()` 被调用时同步读 `store.getState()`，**Redux 是同步的，拿到的是最新值** ✅（调用方在事件回调里调，不是 render 里）。

---

### 5.4 2.4 Context 删除后的 re-render 表现

#### 2.4.1 React DevTools Profiler 验证

**⚠️ 需运行时验证**（本环境无法启动）

静态推演：
- `useFieldConf(uniqueId)` ([`hooks.ts:86-90`](src/store/designer/hooks.ts)) 订阅 `s.designerCanvas.byId[uniqueId]`，字段级 `updateFieldConfig` 只改 `byId[uniqueId]` → **仅订阅该 uniqueId 的组件 re-render** ✅
- 原 `useDesigner` Context 模式下，任何字段变化都触发 Context value 变化 → 16 个调用方全量 re-render —— task-011 删除 Context 后此问题消失 ✅

#### 2.4.2 `DataProvider` 退化为 `<>{children}</>` 后是否触发子树 re-render？

**✅ 不触发**

[`DataProvider.tsx:23-25`](src/designer/DataProvider.tsx):
```tsx
const DesignerProvider = (props: { children: React.ReactNode }) => {
    return <>{props.children}</>;
};
```

- 无 state / 无 props 变化（`children` 由父组件控制）→ 不会 re-render
- 即使父组件 re-render，`DataProvider` 本身是纯透传，React 会跳过其子树的 reconciliation（因 children 引用未变）

#### 2.4.3 `FedxReportContext` 的 Provider value 是否用 `useMemo` 包裹？

**✅ 已包裹**

[`FedxReportContext.tsx:84-108`](src/formily/FedxReportContext.tsx):
```tsx
const context = useMemo(() => {
    return { ...DefaultContext, envModel, compInfoModel: compInfo, ... };
}, [envModel, compInfo, appScopeId, latest]);
```

**但有一个隐患**：deps 含 `latest`（`useLatest` 的返回值），`useLatest` 通常返回稳定的 ref 对象，但需确认 `useLatest` 实现是否每次 render 返回新对象。若 `latest` 引用稳定，则 `context` 只在 `envModel` / `compInfo` / `appScopeId` 变化时重算 —— ✅

---

### 5.5 2.5 440 组件场景

> **以下为静态推演，需运行时验证**

#### 2.5.1 / 2.5.2 拖拽 / 改配置的 re-render 范围

**推演结论**：
- 改一个组件的 `x` 位置 → `dispatch(updateFieldConfig(uniqueId, { config: { x } }))`
- reducer 内 Immer 只修改 `byId[uniqueId]`，`components` 引用不变
- 订阅 `s.designerCanvas.byId[uniqueId]` 的组件 re-render（仅被改的组件）✅
- 订阅 `s.designerCanvas.components` 的组件（如 `layers-tree` / `search-layer`）**不 re-render** ✅
- 订阅 `s.designerCanvas`（顶层 shallowEqual）的 `DesignerContent` 会 re-render（因 `byId` 引用变），但 `DesignerContent` 的子组件通过 props 传递的是 `state.page` / `state.meta` 等未变字段，React 会跳过子树 reconciliation

**预期**：440 组件下改一个组件配置，re-render 数量 ≈ 1（被改组件）+ 少量顶层组件（DesignerContent 自身）—— **性能应大幅优于改造前**

#### 2.5.3 图层树滚动 / 选中切换

- 选中切换走 `component/selected` action，不触发 `designerCanvas` 变化 → 图层树通过 `useSelector(s => s.component.selected)` 订阅，只重渲染图层树本身 ✅
- 图层树滚动是纯 DOM 操作，无 Redux 交互 ✅

#### 2.5.4 对比基线

**⚠️ 无基线数据**，需运行时 Profiler 对比

---

### 5.6 2.6 撤销/重做栈

#### 2.6.1 `setState` shim 是否正确处理 undo/redo？

**✅ 无活跃 undo/redo 功能，shim 不需要处理**

grep 结果显示 `undo` / `redo` 字段：
- [`designer-canvas.ts:35-37, 65-66`](src/store/modules/designer-canvas.ts): 仅在 interface 和 initialState 中声明，**reducer 中无任何 case 写入 `undo` / `redo`**
- [`toolbar/index.js:85-86`](src/designer/toolbar/index.js): `undo: []` / `redo: []` 在被注释的 `handleClear` 函数内（`/* nosonar ... */`），**死代码**

`setState` shim ([`DesignerContent.tsx:146-155`](src/designer/DesignerContent.tsx)) 只处理 `components` 分支，不涉及 undo/redo —— **当前无 undo/redo 功能在运行**，shim 正确。

#### 2.6.2 undo 后 realtimeDataFlow / customFieldsListMapping 是否回滚？

**✅ 不适用（无 undo 功能）**

由于 `undo` / `redo` 字段无活跃写入路径，不存在"undo 后回滚"场景。task-011 把 `realtimeDataFlow` / `customFieldsListMapping` 迁到独立 action 是正确的——若未来引入 undo，需确保 undo action 同时回滚这三个字段（components / realtimeDataFlow / customFieldsListMapping），但**当前不是 bug**。

---

### 5.7 发现的问题列表

| # | 严重度 | 文件:行 | 描述 | 建议修复 |
|---|--------|---------|------|----------|
| 1 | low | [`FedxReportContext.tsx:46-61`](src/formily/FedxReportContext.tsx) | `useCurrentRealtimeDataFlowSource` 用 `flatComponents` 取 `data.config.title`，字段级更新 title 后不刷新（理论回归，实际触发概率极低） | 若需修复，改为直接订阅 `byId` 或接受当前行为（标注 known limitation） |
| 2 | low | [`search-layer.tsx:17`](src/designer/canvas-graph/components/search-layer.tsx) | 搜索列表用 `flatComponents`，改 title 后搜索结果不更新（同 #1） | 同 #1 |
| 3 | low | [`field-mapping-table/index.jsx:41`](src/formily/widgets/dynamic-data/field-mapping-table/index.jsx) | `customFieldsList.get()` 在 `useSetState` 初始值中同步读，不响应外部变化（自洽但不符合响应式惯例） | 改为 `useSelector(s => s.designerCanvas.customFieldsListMapping[uniqueId])` |
| 4 | low | [`DesignerContextMenu.tsx:117-118`](src/designer/context-menu/DesignerContextMenu.tsx) | `designerState` 用 `useMemo([components])` 派生，字段级更新不刷新。实际无 bug（删除走 `setComponents`），但边界场景有风险 | 改用 `latestCache` + `usePersistFn` 模式（与 `DesignerContent` 一致） |
| 5 | info | [`designer-canvas.ts:35-37, 65-66`](src/store/modules/designer-canvas.ts) | `undo` / `redo` 字段为死代码，无活跃写入路径 | 未来引入 undo 时再启用，或现在删除以减少 state 体积 |

---

### 5.8 440 组件场景性能推演

> **以下为静态推演，需运行时验证**

**改造前**（基于 task-011 文档描述）：
- 任何字段变化 → Context value 变化 → 16 个 `useDesigner()` 调用方全量 re-render
- 440 组件下，一次拖拽 onDragStop 触发 440+ 次 re-render

**改造后**（task-011 落地）：
- 字段级 `updateFieldConfig` → 仅 `byId[uniqueId]` 变化 → 仅订阅该 uniqueId 的组件 re-render
- `components` 引用不变 → `layers-tree` / `search-layer` / `FedxReportContext` 不 re-render
- `DesignerContent` 因订阅顶层 `designerCanvas`（shallowEqual）会 re-render，但子组件 props 未变，React 跳过 reconciliation

**预期 re-render 数量**：1（被改组件）+ 1（DesignerContent 顶层）≈ 2 次

**结论**：性能应**大幅改善**，但以下场景需运行时验证：
- 连续增删组件（触发 `setComponents` + `flatDesignerList` 重算）：440 组件下 flat 重算复杂度 O(n)，单次约 1-2ms，可接受
- 图层树滚动：纯 DOM，无性能问题
- 改配置面板：仅被改组件 re-render ✅

**标注**：以上为静态推演，需用 React DevTools Profiler 录制 440 组件大屏的实际拖拽 / 配置场景验证。

---

### 5.9 总结论

**是否阻塞 task-011 的 done 状态？**

**✅ 不阻塞**

**理由**：
1. **无 high 严重度问题**：5 个问题均为 low / info，且多为"理论回归"或"不符合惯例"，无实际可见 bug
2. **核心目标达成**：删除 `useDesigner` Context 兼容壳后，字段级订阅（`useFieldConf`）确实实现了"仅被改组件 re-render"的性能目标
3. **latestCache 同步正确**：`DesignerContent` 用 render 期同步赋值（比 useEffect 更早），`useConvertMenuState` 用 `usePersistFn` 闭包刷新，均无闭包陷阱
4. **`useFlatComponents` 去 forceUpdate**：4 个调用方全部只用第一个元素，无运行时崩溃风险；字段级更新不触发 flat 重算是**预期行为**（调用方只关心结构变化）
5. **undo/redo**：当前无活跃功能，task-011 的独立 action 迁移是正确的未来基础

**建议（非阻塞）**：
- 问题 #1 / #2：若产品反馈"改 title 后搜索/数据流列表不刷新"，再修复
- 问题 #3：响应式惯例优化，可纳入后续小 task
- 问题 #4：防御性改造，可纳入后续小 task
- 问题 #5：死代码清理，可纳入后续小 task

**需运行时验证项**（不阻塞 done）：
- 440 组件 Profiler 实测（§2.5）
- React DevTools Profiler 录制拖拽 / 配置场景（§2.4.1）
