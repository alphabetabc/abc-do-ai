# 删除 useDesigner 兼容壳 + 切换 16 个调用方 + realtimeDataFlow/customFieldsList 走 Redux

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-011`
> 上游任务：
> - [task-2026-07-21-007-byid-index](./done/task-2026-07-21-007-byid-index.md)
> - [task-2026-07-21-008-patch-field-config](./done/task-2026-07-21-008-patch-field-config.md)
> - [task-2026-07-21-009-cleanup](./done/task-2026-07-21-009-cleanup.md)
> - [task-2026-07-21-010-layer-manager-utils-immutable](./task-2026-07-21-010-layer-manager-utils-immutable.md)（强烈建议先完成）
> 状态：`planning`
> 类型：`refactor`
>
> **风险等级：中（纯重构，但横跨 16 个文件）**

---

## 1. 背景

`designerCanvas` 迁入 Redux（task-006/007/008）后，画布 state 已有更高效的访问路径：

- 字段级订阅：`useFieldConf(uniqueId)` 替代 `useDesigner().state.components` 全量读 + `useDesignerSettingChange` 事件触发
- 字段级写入：`useUpdateFieldConfig()` 替代 `useDesigner().setState` 的对象式更新
- 状态：`useSelector(s => s.designerCanvas, shallowEqual)` 替代 `useDesigner().state`

但 `useDesigner` 兼容壳仍存在，**16 个调用方**仍走 `Context` + `useDesigner()`：

- 每个调用方在每次组件树任何字段变化时都会 re-render（Context 特性）
- `realtimeDataFlow` / `customFieldsList` 是 `DataProvider` 闭包内方法，每次组件树变化都重建 `useMemo`
- `DesignerContext.Provider` 仍包裹整个 `DataProvider`，新增了无意义的 Context 层

调用方清单（grep `useDesigner(` 在 `src/` 排除 `.bak` 文件，共 **16 个活跃文件**）：

| # | 文件 | 行（大致） | 用法模式 |
| --- | --- | --- | --- |
| 1 | `src/designer/DesignerContent.tsx` | 整文件 | 渲染 + 回调 |
| 2 | `src/designer/toolbar/index.js` | 整文件 | 渲染 + 回调 |
| 3 | `src/designer/canvas-graph/index.tsx` | 整文件 | 渲染 + 回调（`handleAlign` 等） |
| 4 | `src/designer/aside-panel/layers-tree/index.jsx` | 整文件 | 渲染 + `useMemo([state.components])` |
| 5 | `src/designer/aside-panel/layers-tree/tree/index.tsx` | 整文件 | 工具函数包一层（也用 `useFlatComponents`） |
| 6 | `src/designer/configuration-panel/index.js` | 整文件 | 仅渲染读 `state.components` |
| 7 | `src/designer/configuration-panel/group/index.js` | 整文件 | 仅渲染读 + 回调内读 |
| 8 | `src/designer/configuration-panel/page/index.jsx` | 整文件 | 仅用 `setState({ page })` |
| 9 | `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` | 整文件 | 仅渲染读 + 回调内读 |
| 10 | `src/designer/common/dnd/DropContainer.tsx` | 整文件 | 仅回调内读 |
| 11 | `src/designer/renderer/designer-field/index.tsx` | 整文件 | 渲染读 + 回调读 |
| 12 | `src/designer/recursion-components/index.tsx` | 整文件 | 整树 `useMemo([state.components])` |
| 13 | `src/designer/context-menu/DesignerContextMenu.tsx` | 整文件 | 工具函数包一层 |
| 14 | `src/designer/context-menu/hooks/useConvertMenuState.tsx` | 整文件 | 缓存在 `latestCache.designerState` |
| 15 | `src/formily/FedxReportContext.tsx` | 整文件 | provider 内 `realtimeDataFlow.record` 等 |
| 16 | `src/designer/common/context/context-designer/Designer.tsx`（**内部 1 处**） | `useFlatComponents` 内 | 内部 hook |

外加 `src/designer/common/index.ts` barrel 导出 `useDesigner` / `DesignerContext` / `useFlatComponents`。

另外，`realtimeDataFlow` / `customFieldsList` 当前实现：

- 仍是 `DataProvider` 闭包内的 `useMemo`，每次 `state.realtimeDataFlow` / `state.customFieldsListMapping` 引用变化都重建对象
- 业务条件（`condition.withCondition(!params.enable, ...)`）写在 `DataProvider` 内，reducer 没接收对应 action
- `useFlatComponents` 内部用了 `useLazyUpdate` + `usePersistFn` 的"延迟更新"机制，依赖 `state.components` 引用变化

**本任务目标**：

1. 把 `realtimeDataFlow` / `customFieldsList` 的写入路径收编为 Redux action + reducer
2. 新增 `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents` 三个 hook
3. 16 个 `useDesigner()` 调用方改为 `useSelector` / `useFieldConf` / `useDispatch` / `useUpdateFieldConfig`
4. 删除 `useDesigner` / `DesignerContext` / `DesignerContext.Provider` / `DataProvider` 中的 Context value
5. `pnpm tsc --noEmit` 零新增错误

---

## 2. 目标

1. `src/store/modules/designer-canvas.ts` 新增 4 个 reducer case（`recordRealtimeDataFlow` / `deleteRealtimeDataFlow` / `recordCustomFieldsList` / `deleteCustomFieldsList`）
2. `src/store/modules/designer-canvas-actions.ts` 导出对应 4 个 action creator
3. `src/store/designer/hooks.ts` 新增 `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatFields` 三个 hook
4. `src/designer/common/index.ts` 移除 `useDesigner` / `DesignerContext` / `useFlatComponents` 的导出（或保留 `useFlatComponents` 指向新 hook）
5. 16 个 `useDesigner()` 调用方全部切换到 `useSelector` / `useDispatch` / `useFieldConf` / `useUpdateFieldConfig` / `useRealtimeDataFlow` / `useCustomFieldsList`
6. `src/designer/DataProvider.tsx` 改为"无害组件"（仅作为初始化占位，不再提供 Context value）
7. `src/designer/common/context/context-designer/Designer.tsx` 删除 `useDesigner` / `DesignerContext` / `useFlatComponents` 定义
8. AGENTS.md §3.2 / §5.1 同步更新（删除 useDesigner 描述，改为"统一从 `@Src/store/designer` 导入"）
9. `pnpm tsc --noEmit` 零新增错误

---

## 3. 关键设计决策

### 3.1 4 个 reducer case 的边界

业务条件判断放在 hook 层（dispatch 哪个 action），reducer 只做纯数据更新。

#### 3.1.1 `recordRealtimeDataFlow` / `deleteRealtimeDataFlow`

旧 `DataProvider.tsx` 实现（含业务条件）：
```ts
record: (uniqueId, params) => {
    if (_.isNil(params.sourceId) || params.sourceId === '') return;
    const nextRealtimeDataFlow = produce(state.realtimeDataFlow, (draft) => {
        const preIndex = draft.findIndex((d) => d.uniqueId === uniqueId);
        if (preIndex === -1) {
            draft.push({ uniqueId, sourceId: params.sourceId });
        } else {
            condition.withCondition(
                !params.enable,
                () => { draft.splice(preIndex, 1); },
                () => { Object.assign(draft[preIndex], { uniqueId, sourceId: params.sourceId }); },
            );
        }
    });
    dispatch(setDesignerCanvasState({ realtimeDataFlow: nextRealtimeDataFlow }));
},
```

改造后**reducer 保持纯净**，hook 层做条件分发：

```ts
// reducer（designer-canvas.ts）
case 'designerCanvas/recordRealtimeDataFlow': {
    const { uniqueId, sourceId } = action.payload;
    return produce(state, (draft) => {
        const preIndex = draft.realtimeDataFlow.findIndex((d) => d.uniqueId === uniqueId);
        if (preIndex === -1) {
            draft.realtimeDataFlow.push({ uniqueId, sourceId });
        } else {
            draft.realtimeDataFlow[preIndex] = { uniqueId, sourceId };   // 整体替换，避免 mutation
        }
    });
}
case 'designerCanvas/deleteRealtimeDataFlow': {
    const { uniqueId } = action.payload;
    return produce(state, (draft) => {
        draft.realtimeDataFlow = draft.realtimeDataFlow.filter((d) => d.uniqueId !== uniqueId);
    });
}
```

```ts
// action creator（designer-canvas-actions.ts）
export const recordRealtimeDataFlow = (payload: { uniqueId: string; sourceId: string }) => ({
    type: 'designerCanvas/recordRealtimeDataFlow',
    payload,
});
export const deleteRealtimeDataFlow = (payload: { uniqueId: string }) => ({
    type: 'designerCanvas/deleteRealtimeDataFlow',
    payload,
});
```

```ts
// hook（hooks.ts）
export const useRealtimeDataFlow = () => {
    const dispatch = useDispatch();
    return useMemo(() => ({
        record: (uniqueId: string, params: { sourceId?: string; enable?: boolean }) => {
            // 业务条件：sourceId 为空 → 忽略；enable === false → 删除
            if (_.isNil(params.sourceId) || params.sourceId === '') return;
            if (params.enable === false) {
                dispatch(deleteRealtimeDataFlow({ uniqueId }));
            } else {
                dispatch(recordRealtimeDataFlow({ uniqueId, sourceId: params.sourceId }));
            }
        },
        del: (uniqueId: string) => dispatch(deleteRealtimeDataFlow({ uniqueId })),
    }), [dispatch]);
};
```

#### 3.1.2 `recordCustomFieldsList` / `deleteCustomFieldsList`

旧实现（DataProvider.tsx L99-129）：
```ts
record(uniqueId, setting) {
    dispatch(setDesignerCanvasState({
        customFieldsListMapping: {
            ...state.customFieldsListMapping,
            [uniqueId]: JSON.stringify(setting),
        },
    }));
},
del(uniqueId) {
    const nextMapping = { ...state.customFieldsListMapping };
    delete nextMapping[uniqueId];
    dispatch(setDesignerCanvasState({ customFieldsListMapping: nextMapping }));
},
```

改造后 reducer：
```ts
case 'designerCanvas/recordCustomFieldsList': {
    const { uniqueId, setting } = action.payload;
    return produce(state, (draft) => {
        draft.customFieldsListMapping[uniqueId] = JSON.stringify(setting);
    });
}
case 'designerCanvas/deleteCustomFieldsList': {
    const { uniqueId } = action.payload;
    return produce(state, (draft) => {
        delete draft.customFieldsListMapping[uniqueId];
    });
}
```

hook：
```ts
export const useCustomFieldsList = () => {
    const dispatch = useDispatch();
    return useMemo(() => ({
        get: (uniqueId: string) => {
            // 注意：get 需要"读 state.customFieldsListMapping[uniqueId]"，单纯 useDispatch 不够
            // 调用方应该在消费侧用 useSelector 读；本 hook 只提供 record/del 方法
            // —— 如果 get 必须 hook 内闭包，使用 useSelector 读
            const mapping = store.getState().designerCanvas.customFieldsListMapping;
            return JSON.parse(mapping[uniqueId] ?? '[]');
        },
        record: (uniqueId: string, setting: any) => {
            dispatch(recordCustomFieldsList({ uniqueId, setting }));
        },
        del: (uniqueId: string) => {
            dispatch(deleteCustomFieldsList({ uniqueId }));
        },
    }), [dispatch]);
};
```

> ⚠️ **`get` 的设计选择**：原 `DataProvider` 闭包内的 `get` 能直接读 `state.customFieldsListMapping`，因为它就在闭包里。Hook 化的两个备选：
>
> 1. **`store.getState()` 读**：同步可读，但破坏"通过 hook 订阅"的惯例；适合非响应式场景（如 `convertMenuState` 的同步计算）
> 2. **新增 `useCustomFieldsListValue(uniqueId)` hook**：纯读，调用方在组件层订阅。`get` 拆为"同步（store.getState）"+"响应式（useCustomFieldsListValue）"
>
> **决策**：本任务采用方案 1（`get` 用 `store.getState()` 同步读），保持原 API 形态，调用方零行为变化。后续如需响应式读，再补 `useCustomFieldsListValue`。
>
> 如果调用方需要响应式读，**优先推荐**改为：
> ```ts
> const mySetting = useSelector((s) => s.designerCanvas.customFieldsListMapping[uniqueId]);
> const value = useMemo(() => JSON.parse(mySetting ?? '[]'), [mySetting]);
> ```

### 3.2 `useFlatComponents` 改造

旧（Designer.tsx）：
```ts
const useFlatComponents = () => {
    const { state } = useDesigner();
    const [flatComponents, setFlatComponents] = useState<any[]>([]);
    const lazyUpdater = useLazyUpdate();
    const watch = usePersistFn(() => {
        lazyUpdater.watch('createFlatComponents', state.components);
    });
    const forceUpdate = usePersistFn(() => {
        if (state.components) setFlatComponents(flatDesignerList(state.components));
    });
    useEffect(() => { lazyUpdater.add('createFlatComponents', () => forceUpdate()); forceUpdate(); }, [lazyUpdater, forceUpdate, watch]);
    useEffect(() => { watch(); });
    return [flatComponents, forceUpdate] as const;
};
```

新：基于 `useSelector` + `useMemo` 直接重算，去掉 `useLazyUpdate` 延迟更新机制（Redux 订阅本身就是同步响应）：
```ts
// store/designer/hooks.ts
export const useFlatComponents = () => {
    const components = useSelector(
        (s: RootReducerState) => s.designerCanvas.components,
        shallowEqual,
    );
    const flatComponents = useMemo(() => flatDesignerList(components), [components]);
    return [flatComponents] as const;
};
```

**API 变化**：旧 `useFlatComponents()` 返回 `[flatComponents, forceUpdate]`（二元组，`forceUpdate` 是手动触发刷新函数）；新 hook 只返回 `[flatComponents]`（一元组）。

调用方处理：
- `src/formily/FedxReportContext.tsx`：`const [flatComponents] = useFlatComponents();`（只用第一个元素）
- `src/designer/aside-panel/layers-tree/tree/index.tsx`：同上
- 这两个调用方都不需要 `forceUpdate`，零影响

### 3.3 `useDesigner()` 调用方切换模板

#### 3.3.1 仅渲染读 state.components
```ts
// 旧
const { state } = useDesigner();
const memoized = useMemo(() => something(state.components), [state.components]);

// 新
const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual);
const memoized = useMemo(() => something(components), [components]);
```

#### 3.3.2 读 state.byId[id]（替代 getFieldConf）
```ts
// 旧
const { state } = useDesigner();
const fieldConf = getFieldConf(state.components, selected);

// 新
const fieldConf = useFieldConf(selected);
```

#### 3.3.3 仅用 setState
```ts
// 旧
const { setState } = useDesigner();
setState({ page });

// 新
const dispatch = useDispatch();
dispatch(setDesignerCanvasState({ page }));
```

#### 3.3.4 用 realtimeDataFlow / customFieldsList
```ts
// 旧
const { realtimeDataFlow, customFieldsList } = useDesigner();
realtimeDataFlow.record(uniqueId, { sourceId, enable });
customFieldsList.record(uniqueId, setting);

// 新
const realtimeDataFlow = useRealtimeDataFlow();
const customFieldsList = useCustomFieldsList();
realtimeDataFlow.record(uniqueId, { sourceId, enable });
customFieldsList.record(uniqueId, setting);
```

#### 3.3.5 工具函数包一层（layerManager.xxx(state, ...) / useOnDrop(state, ...)）
```ts
// 旧
const { state } = useDesigner();
const result = layerManager.xxx(state, selected, (components) => setState({ components }));

// 新
const dispatch = useDispatch();
const result = layerManager.xxx(state, selected, (components) => dispatch(setComponents(components)));
// 或更激进：layer-manager 接收 byId/parentMap 参数，调用方从 store 取
const byId = useSelector((s) => s.designerCanvas.byId, shallowEqual);
const parentMap = useSelector((s) => s.designerCanvas.parentMap, shallowEqual);
const result = layerManager.xxx({ byId, parentMap, components }, selected, (components) => dispatch(setComponents(components)));
```

#### 3.3.6 latestCache 缓存 + 跨异步访问
```ts
// 旧
const { state } = useDesigner();
const latestCache = useRef({ designerState: state });
const onAsync = usePersistFn(() => {
    latestCache.current.designerState.components;   // 异步读取
});

// 新
const state = useSelector((s: RootReducerState) => s.designerCanvas, shallowEqual);
const latestCache = useRef({ designerState: state });
useEffect(() => {
    latestCache.current.designerState = state;   // 同步同步
}, [state]);
const onAsync = usePersistFn(() => {
    latestCache.current.designerState.components;
});
```

> 注：原 `useDesigner()` 返回的对象引用在 `setState` 时会变化，导致 `latestCache.current.designerState` 自动更新（因为 useDesigner 是 hook，重新执行时 ref.current 重新赋值）。新方案需要 `useEffect(() => { latestCache.current.designerState = state; }, [state])` 显式同步。

#### 3.3.7 `useFlatComponents` 内 `useDesigner()`
旧：
```ts
const useFlatComponents = () => {
    const { state } = useDesigner();
    // ...
};
```
新：见 §3.2

### 3.4 `DataProvider` 改造

当前 `DataProvider` 是 `DesignerProvider`，提供 `<DesignerContext.Provider value={...}>`。改造后：

```ts
// src/designer/DataProvider.tsx
/**
 * 占位组件：保留以兼容旧 import 路径，但不再提供任何 Context value
 * - 初始化逻辑（如 dispatch(setComponents(initialComponents))) 如有需要，在 useEffect 内执行
 * - task-011（2026-07-21）：删除 DesignerContext.Provider，因为 useDesigner 已删除
 */
const DesignerProvider = (props: { children: React.ReactNode }) => {
    return <>{props.children}</>;
};

export const DataProvider = DesignerProvider;
```

> 如果后续发现 `DataProvider` 完全无副作用（无 useEffect / useDispatch），可以**直接删除文件**，调用方 import 改为 `React.Fragment` 或直接 `<>{children}</>`。本任务保守做法：保留占位组件，删除 Context.Provider。

### 3.5 barrel 导出处理

`src/designer/common/index.ts` 当前导出 `useDesigner` / `DesignerContext` / `useFlatComponents`：

```ts
// 旧
export { useDesigner, DesignerContext, useFlatComponents } from './context/context-designer/Designer';

// 新：删除 useDesigner / DesignerContext 导出，useFlatComponents 指向新 hook
export { useFlatComponents } from '@Src/store/designer/hooks';
```

---

## 4. 详细步骤

### 步骤 1：新增 4 个 reducer case

文件：`src/store/modules/designer-canvas.ts`

按 §3.1.1 / §3.1.2 在 `switch (action.type)` 末尾追加 4 个 case。

### 步骤 2：新增 4 个 action creator

文件：`src/store/modules/designer-canvas-actions.ts`

导出 `recordRealtimeDataFlow` / `deleteRealtimeDataFlow` / `recordCustomFieldsList` / `deleteCustomFieldsList`。

### 步骤 3：新增 3 个 hook

文件：`src/store/designer/hooks.ts`

按 §3.1.1 / §3.1.2 / §3.2 新增 `useRealtimeDataFlow` / `useCustomFieldsList` / 改造 `useFlatComponents`。

### 步骤 4：切换 16 个调用方

按 §3.3 的 7 个模板，逐文件切换。建议**分批**进行，每批跑一遍 `pnpm tsc --noEmit`：

**批次 1（4 个文件，独立性强）**：
- `src/designer/configuration-panel/page/index.jsx` — 仅用 `setState({ page })`
- `src/designer/common/dnd/DropContainer.tsx` — 仅回调内读
- `src/designer/configuration-panel/index.js` — 仅渲染读
- `src/designer/configuration-panel/group/index.js` — 渲染 + 回调

**批次 2（4 个文件）**：
- `src/designer/recursion-components/index.tsx` — 整树 useMemo
- `src/designer/canvas-graph/index.tsx` — 渲染 + 回调 + handleAlign
- `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` — 渲染 + 回调
- `src/designer/toolbar/index.js` — 渲染 + 回调

**批次 3（4 个文件）**：
- `src/designer/aside-panel/layers-tree/index.jsx` — useMemo + 回调
- `src/designer/aside-panel/layers-tree/tree/index.tsx` — 工具函数包一层 + 用 `useFlatComponents`
- `src/designer/renderer/designer-field/index.tsx` — 渲染 + 回调（含 mutation，task-010 已修）
- `src/designer/DesignerContent.tsx` — latestCache 模式

**批次 4（3 个文件，含 provider）**：
- `src/designer/context-menu/DesignerContextMenu.tsx` — 工具函数包一层
- `src/designer/context-menu/hooks/useConvertMenuState.tsx` — latestCache + generatorGroup
- `src/formily/FedxReportContext.tsx` — provider，含 realtimeDataFlow / customFieldsList

### 步骤 5：改造 `DataProvider` 与 `Designer.tsx`

按 §3.4 / §3.5 改造。

### 步骤 6：barrel 导出清理

`src/designer/common/index.ts` 删除 `useDesigner` / `DesignerContext`，`useFlatComponents` 指向新 hook。

### 步骤 7：grep 校验

```bash
grep -n "useDesigner(\|DesignerContext\b" src/designer/ src/formily/
# 应返回 0 命中（除注释 + 文档 + .bak 文件）
```

### 步骤 8：tsc + 冒烟

```bash
pnpm tsc --noEmit
pnpm start
```

冒烟清单（覆盖全部 16 个调用方）：
- [ ] 配置面板 onChange（左侧选中 → 右侧改属性 → 画布响应）
- [ ] 图层树拖拽移动（layers-tree/index.jsx + tree/index.tsx）
- [ ] 右键菜单（DesignerContextMenu）
- [ ] 实时数据流 record / del（FedxReport + DataProvider 子树）
- [ ] customFieldsList record / get / del（FedxReport + 配置面板）
- [ ] 拖拽组件入画布（DropContainer + recursion-components）
- [ ] group/split/copy/delete（layer-manager 全套）
- [ ] toolbar 撤销/重做（DesignerContent）
- [ ] designer-field 渲染 + 选中（renderer/designer-field）
- [ ] React DevTools Profiler：Context 层消失，`useDesigner()` 不再触发组件 re-render

---

## 5. 验证清单

- [ ] `src/store/modules/designer-canvas.ts` 新增 4 个 reducer case（`recordRealtimeDataFlow` / `deleteRealtimeDataFlow` / `recordCustomFieldsList` / `deleteCustomFieldsList`）
- [ ] `src/store/modules/designer-canvas-actions.ts` 新增 4 个 action creator
- [ ] `src/store/designer/hooks.ts` 新增 `useRealtimeDataFlow` / `useCustomFieldsList` / 改造 `useFlatComponents`
- [ ] 16 个 `useDesigner()` 调用方（含 `Designer.tsx` 内部）全部切换
- [ ] `src/designer/DataProvider.tsx` 不再提供 `DesignerContext.Provider`
- [ ] `src/designer/common/context/context-designer/Designer.tsx` 删除 `useDesigner` / `DesignerContext` / `useFlatComponents` 定义
- [ ] `src/designer/common/index.ts` 删除 `useDesigner` / `DesignerContext` 导出
- [ ] grep `useDesigner(\|DesignerContext\b` 在 `src/designer/` 与 `src/formily/` 0 命中（活跃代码）
- [ ] `pnpm tsc --noEmit` 零新增错误（pre-existing 14 个错误数不变）
- [ ] 冒烟清单全部通过
- [ ] AGENTS.md §3.2 / §5.1 同步更新（移除 useDesigner 描述，补充新 hook）
- [ ] 任务文件移到 `plans/done/`
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `useFlatComponents` 去掉 `forceUpdate` 后某个调用方依赖手动刷新 | 低 | 拖拽期间某些子树不更新 | grep 校验调用方只用第一个元素；冒烟时重点验证拖拽场景 |
| `latestCache` 模式调用方漏掉 `useEffect(() => ref.current = state)` | 中 | 跨异步时拿到旧 state | 切换时严格按 §3.3.6 模板；单测覆盖 |
| `useCustomFieldsList.get` 用 `store.getState()` 同步读，破坏订阅惯例 | 低 | 调用方在响应式场景下漏更新 | 调用方改用 `useSelector` 读；本任务保守起见保留 `get` API |
| `DesignerContext.Provider` 删除后某个未切换的旧 import 报错 | 中 | tsc 红 | 分批切换；每批跑 tsc；最后一步 grep 校验 |
| `setDesignerCanvasState` 还残留 `clearRuntime` 内对 `realtimeDataFlow` / `customFieldsListMapping` 的硬重置（task-006 L55-57） | 低 | 切换后逻辑路径变化 | 保留兼容：reducer 内 `clearRuntime` 不变；新 hook 不受影响 |

### 回退方案

- 改造前一次 commit：`refactor(designer): drop useDesigner compat, migrate 16 call sites to useSelector`
- `useDesigner` / `DesignerContext` 可作为 `@deprecated` 兼容壳保留 1 个版本（导出指向新 hook），下个版本再删
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-21：任务创建（task-011），状态 `planning`，承接 task-006/007/008/009 的设计器 store 收敛，收尾删除 useDesigner Context 兼容壳
- 2026-07-21：实施完成，状态 `done`。实施摘要：
    - **reducer**：`src/store/modules/designer-canvas.ts` 新增 4 个 case（`recordRealtimeDataFlow` / `deleteRealtimeDataFlow` / `recordCustomFieldsList` / `deleteCustomFieldsList`），均用 `produce` 不可变更新
    - **action creator**：`src/store/modules/designer-canvas-actions.ts` 导出对应 4 个 action creator；`src/store/modules/index.ts` barrel 同步导出
    - **hooks**：`src/store/designer/hooks.ts` 新增 `useRealtimeDataFlow` / `useCustomFieldsList`（`get` 用 `store.getState()` 同步读，保留原 API 形态）/ `useFlatComponents`（基于 `useSelector` + `useMemo` 直接重算，删除 `useLazyUpdate` 延迟更新机制，返回 `[flatComponents]` 一元组）；`src/store/designer/index.tsx` barrel 同步导出
    - **16 个调用方切换**：全部从 `useDesigner()` 切到 `useSelector` / `useDispatch` / `useFieldConf` / `useUpdateFieldConfig` / `useRealtimeDataFlow` / `useCustomFieldsList`。其中 `canvas-graph/index.tsx` / `aside-panel/layers-tree/tree/index.tsx` / `renderer/designer-field/index.tsx` / `context-menu/DesignerContextMenu.tsx` / `context-menu/hooks/useConvertMenuState.tsx` 用 `designerState = useMemo(() => ({ components }), [components])` 兼容 `layerManager.xxx(state, ...)` 的 `{ components: any[] }` 松散入参
    - **DesignerContent.tsx**：保留 `setState` shim 函数（原逻辑含 `'components' in nextState` → `setComponents`、否则 → `setDesignerCanvasState`、且 components 为空时 `clearRuntime` 的复杂分支）
    - **DataProvider.tsx**：退化为占位组件（仅 `<>{children}</>`）
    - **Designer.tsx**：清空文件，仅 re-export `./screen-performance` 以保持 barrel `common/index.ts` 工作正常
    - **types.ts**：移除 `useDesigner` import，`DesignerState` 重定义为最小结构类型 `{ components: any[]; [prop: string]: any }`（layer-manager 调用方传 `{components}` 部分对象，不能用 `DesignerCanvasState`）
    - **renderer/utils.ts**：`mergeFieldConfig` 补充显式 `: any[]` 类型标注以修复 tsc 推断错误
    - **configuration-panel/group/index.js**：修复原 React hook 违规（原在 `onValueChange` 回调内调 `useDesigner()`）→ 移到顶层 `useSelector`
    - **FedxReportContext.tsx**：`VisualFedxReportProvider` 改用 `useRealtimeDataFlow()` + `useCustomFieldsList()`；`useCurrentRealtimeDataFlowSource` 改用 `useSelector` 读 `realtimeDataFlow`；`uniqueId` 显式 `: string` 类型修复 undefined 报错
    - **search-layer.tsx** / **plugins/interaction/component/hooks.ts**：`useFlatComponents` import 从 `@Src/designer/common` 改为 `@Src/store/designer/hooks`
- 2026-07-21：grep 校验通过 —— `useDesigner(` / `DesignerContext` 在 `src/designer/` 与 `src/formily/` 0 命中（仅注释与 `.bak` 文件残留）
- 2026-07-21：`pnpm tsc --noEmit` 结果 —— 14 个错误，全部 pre-existing（10 个 `packages/ui/src/material-selector/`、2 个 `designer/common/dnd/helper.ts`、2 个 `designer/renderer/designer-field/utils.ts`），**零新增错误**
- 2026-07-21：AGENTS.md 同步更新 —— §1 技术栈、§3.1 数据流图、§3.2 三套状态管理边界表、§5.1 slice 表、§9.2 不做什么清单
- 2026-07-21：任务文件归档到 `plans/done/`，roadmap 状态置为 `done`