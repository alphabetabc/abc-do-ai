# 03 — 读路径：订阅 + 同步读 + 保存序列化 + 读边界

> 配套 [00-README.md](./00-README.md) | 关注点：**怎么读 state**
>
> 本文合并原 `04-read-path.md` + `05-edge-cases.md` §2。覆盖所有读操作 + 读边界场景。

---

## 0. 读路径速查

| 场景 | 用什么 | 原因 |
| --- | --- | --- |
| 渲染当前组件配置 | `useFieldConf(uniqueId)` | 字段级订阅 byId 索引，O(1) re-render |
| 渲染整树（递归组件 / 图层树） | `useSelector(s => s.designerCanvas.components, shallowEqual)` | 需要响应结构性变化 |
| 异步回调读最新 state | `store.getState().designerCanvas.*` | 同步读，不订阅 |
| 保存序列化 | 直接读 `designerState.components` | components 永远 fresh |
| 读某组件的 parent（含 children） | `getFieldNodeById(components, parentId)` | O(n) 但不 cloneDeep |
| 异步回调读 parent 节点（不需要 children） | `byId[parentMap[uniqueId]]` | O(1) |

---

## 1. hooks 签名

**源码位置**：`src/store/designer/hooks.ts`

### 1.1 useFieldConf（字段级订阅）

**源码位置**：`hooks.ts` L86-90

```ts
export const useFieldConf = (uniqueId: string) =>
    useSelector(
        (s: RootReducerState) => s.designerCanvas.byId[uniqueId],
        shallowEqual,
    );
```

- 按 `uniqueId` 订阅 `byId` 索引中该组件的 `FlatField`
- 字段级更新：仅 `byId[uniqueId]` 引用变化时触发 re-render，其他组件不重渲染
- 组件已删除时返回 `undefined`，调用方需判空（`fieldById?.data`）
- 配合 `buildIndex` 引用复用保持订阅粒度（未变 data 节点复用旧 byId 条目）

**适用范围**（hooks.ts L70-85 注释）：

- ✅ designer-field 渲染（只读 `dataSource.data`）
- ✅ 配置面板读当前组件
- ❌ layer-manager 读父节点 children（用 `getFieldNodeById(components, id)`，byId 不存 children）
- ❌ useOnDrop 读父节点 children（同上）

### 1.2 useUpdateFieldConfig（字段级更新 dispatcher）

**源码位置**：`hooks.ts` L102-110

```ts
export const useUpdateFieldConfig = () => {
    const dispatch = useDispatch();
    return useCallback(
        (uniqueId: string, patch: any) => {
            dispatch(updateFieldConfig(uniqueId, patch));
        },
        [dispatch],
    );
};
```

- 返回 `(uniqueId: string, patch: any) => void`
- 取代原 `useDebounceMergeConfig().submitMergedConfig`（已删）
- 不再走 debounce（30ms 延迟）—— Redux 内部 batching + 同步 dispatch 已够

### 1.3 useFlatComponents（扁平化组件列表）

**源码位置**：`hooks.ts` L189-193

```ts
export const useFlatComponents = () => {
    const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual);
    const flatComponents = useMemo(() => flatDesignerList(components), [components]);
    return [flatComponents] as const;
};
```

- 返回 `[flatComponents]`（**不是** `[flatComponents, forceUpdate]`）
- 旧实现返回 `[flatComponents, forceUpdate]`，新实现删除 `forceUpdate`（全部 4 个调用方只用第一个元素）

### 1.4 useRealtimeDataFlow（实时数据流）

**源码位置**：`hooks.ts` L131-147

```ts
export const useRealtimeDataFlow = () => {
    // ...
    return useMemo(() => ({
        record: (uniqueId: string, params: { sourceId?: string; enable?: boolean }) => {...},
        del: (uniqueId: string) => dispatch(deleteRealtimeDataFlow({ uniqueId })),
    }), [dispatch]);
};
```

- 返回 `{ record, del }`（稳定引用，不订阅 state）
- `record` 业务条件：`sourceId` 为空 → 忽略；`enable === false` → 改 dispatch `deleteRealtimeDataFlow`
- `del` → `dispatch(deleteRealtimeDataFlow({ uniqueId }))`

### 1.5 useCustomFieldsList（自定义字段映射）

**源码位置**：`hooks.ts` L159-177

```ts
export const useCustomFieldsList = () => {
    // ...
    return useMemo(() => ({
        get: (uniqueId: string) => {
            const mapping = store.getState().designerCanvas.customFieldsListMapping;
            return JSON.parse(mapping[uniqueId] ?? '[]');
        },
        record: (uniqueId: string, setting: any) => {...},
        del: (uniqueId: string) => {...},
    }), [dispatch]);
};
```

- 返回 `{ get, record, del }`
- `get` 通过 `store.getState()` 同步读（不订阅），保持原 `DataProvider` 闭包 API 形态
- `record` → `dispatch(recordCustomFieldsList({ uniqueId, setting }))`，reducer 内 `JSON.stringify(setting)`
- 响应式读取场景请直接用 `useSelector((s) => s.designerCanvas.customFieldsListMapping[uniqueId])`

---

## 2. getFieldNodeById（核心读函数）

**源码位置**：`src/designer/renderer/utils.ts` L141-150（注释 L124-130）

```ts
export function getFieldNodeById(components: any[], uniqueId: string): any | null {
    for (const node of components || []) {
        if (node.uniqueId === uniqueId) return node;
        if (node.children) {
            const found = getFieldNodeById(node.children, uniqueId);
            if (found) return found;
        }
    }
    return null;
}
```

**用途**：从 `components` 树递归查找指定 `uniqueId` 的节点（**不 cloneDeep**，返回浅引用）。

**与 byId 的区别**：

| 读法 | 返回 | 含 children | 复杂度 |
| --- | --- | --- | --- |
| `byId[id]` | `FlatField` | ❌ | O(1) |
| `getFieldNodeById(components, id)` | 完整节点 | ✅ | O(n) |

**适用场景**（需要 children 时）：

- layer-manager 读父节点 children
- useOnDrop 读父节点 children
- `generatorGroup` / `splitGroup` 取完整节点
- `getResizedComponents` 取带 children 的 group 节点
- `recalcGroupBounds` 取父组节点

**15 个调用方**（Grep 验证）。

**注意**：

- 返回浅引用，禁止 mutation（如需修改走 `dispatch(setComponents(newTree))`）
- 组件已删除时返回 `null`，调用方需判空

---

## 3. 保存序列化

### 3.1 当前实现

直接序列化 `designerState.components`（单源后永远 fresh，无需 `getSaveableComponents`）。

### 3.2 主保存（handleSave）

**源码位置**：`src/designer/DesignerContent.tsx` `handleSave` L344-373

```ts
const designerState = reduxStore.getState().designerCanvas;
// ...
config: JSON.stringify({
    page: designerState.page,
    components: designerState.components,           // 直接序列化
    realtimeDataFlow: designerState.realtimeDataFlow ?? [],
    customFieldsListMapping: {},                    // 序列化为空对象
}),
```

> `customFieldsListMapping` 序列化为 `{}`（不保存运行时映射）。

### 3.3 保存点路径（5 个）

| # | 路径 | 文件 | 触发 |
| --- | --- | --- | --- |
| 1 | 主保存 | `src/designer/DesignerContent.tsx` `handleSave` L344 | 点保存按钮 / Ctrl+S / 自动保存 |
| 2 | 存为模板 | `src/designer/toolbar/comp/saveAsTemp-modal/index.tsx` L56-59 | "生成模板"按钮 |
| 3 | 微应用嵌入 postMessage | `src/pages/designer-page/designer-scene-monitor/index.tsx` L37-47 | 微应用嵌入保存 |
| 4 | preview 侧 useMaterialData | `src/hooks/useMaterialData.ts` | preview 渲染 |
| 5 | preview 侧 useCompDetailData4Designer | `src/hooks/useCompDetailData4Designer.ts` | preview 渲染 |

> 所有保存点均直接读 `designerState.components` 序列化（单源后永远 fresh）。

### 3.4 useImperativeHandle.getState

**源码位置**：`src/designer/DesignerContent.tsx` L375-384

```ts
useImperativeHandle(designerRef, () => ({
    triggerSave: (showSuccessMessage) => handleSave(showSuccessMessage),
    getState: () => reduxStore.getState().designerCanvas,
}));
```

外部通过 `designerRef.current.getState()` 拿到 state 后要序列化，**直接读 `.components` 即可**（永远 fresh）。

---

## 4. 读路径决策树

```
要读 state？
├─ React 渲染期间
│   ├─ 读当前组件配置
│   │   → useFieldConf(uniqueId)
│   │     订阅 byId[id]，shallowEqual，字段级 re-render
│   │
│   ├─ 读整树（递归组件 / 图层树）
│   │   → useSelector(s => s.designerCanvas.components, shallowEqual)
│   │     必须加 shallowEqual，否则 byId 变化触发整树 reconcile
│   │
│   └─ 读 page / meta / appScopeId
│       → useSelector(s => s.designerCanvas.page, shallowEqual)
│
├─ 异步回调 / 事件处理器
│   ├─ 读最新 state（不订阅）
│   │   → store.getState().designerCanvas.*
│   │     同步读，不触发 re-render
│   │
│   ├─ 读父节点（不需要 children）
│   │   → byId[parentMap[uniqueId]]
│   │     O(1)
│   │
│   └─ 读父节点（需要 children）/ 读目标节点本身（含 children）
│       → getFieldNodeById(components, id)
│         O(n) 但不 cloneDeep，返回浅引用
│
└─ 保存序列化
    → 直接读 designerState.components
      单源后永远 fresh，无需 getSaveableComponents（已删）
```

---

## 5. 易错点

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| `useSelector(s => s.designerCanvas.components)` 不带 `shallowEqual` | byId 变化触发整树 reconcile | 必须加 `shallowEqual` |
| 用 `byId[id]` 读 children | `undefined`（byId 不存 children） | 用 `getFieldNodeById(components, id)` |
| 异步回调里用 `useSelector` 的值 | 拿到过期值（闭包捕获） | 用 `store.getState()` 同步读 |
| 保存时调 `getSaveableComponents` | API 已删除，报错 | 直接序列化 `designerState.components` |
| `useFieldConf(id)` 返回 `undefined` 未判空 | `Cannot read property 'data' of undefined` | `fieldById?.data` |

---

## 6. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [01-data-model.md](./01-data-model.md) —— 数据模型（类型 + state 形状）
- [02-write-path.md](./02-write-path.md) —— 写路径（含 recalcGroupBounds / 异常输入边界）
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
- [05-deleted-api.md](./05-deleted-api.md) —— 已删除 API 速查
