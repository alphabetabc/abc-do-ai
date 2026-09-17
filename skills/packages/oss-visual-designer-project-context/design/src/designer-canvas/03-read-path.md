# Designer Canvas 读路径（查）

> 配套 [00-overview.md](./00-overview.md) | 关注点：如何从 state 读出数据
>
> 关键问题：**读的是哪份数据（components vs byId）+ 是否订阅（useFieldConf vs useStore.getState）**

---

## 0. 读路径总图

```
读什么？              渲染订阅？      异步回调读？      保存序列化？
─────────────────────────────────────────────────────────────
某组件 config  ─►  useFieldConf     useStore.getState    designerState
                  (字段级订阅)      .byId[id]           .components
                                    (同步读)            (直接序列化)

parent 节点        useFieldConf     byId[parentMap[id]] designerState
(无 children)      (字段级订阅)     (同步读 O(1))       .components

parent 节点        getFieldNodeById getFieldNodeById    designerState
(含 children)      (返回 stale)     (返回 stale)        .components

整树 (structural)  useSelector      store.getState      designerState
                   (shallowEqual)   (同步读)            .components
```

---

## 1. 6 种读法速查表

| # | 读法 | 用途 | 频率 | 性能 | 文件 |
| --- | --- | --- | --- | --- | --- |
| 1 | `useFieldConf(id)` | 渲染当前组件 | 高频 | 字段级订阅 O(1) | [src/store/designer/hooks.ts](src/store/designer/hooks.ts) |
| 2 | `useSelector(s => s.designerCanvas.components, shallowEqual)` | 渲染整树 | 中频 | 引用变化触发 | — |
| 3 | `useSelector(s => s.designerCanvas.byId[id])` | 单点读 | 低频 | 字段级订阅 | — |
| 4 | `useStore().getState().designerCanvas.byId[id]` | 异步回调读最新 | 高频 | 同步 O(1)，不订阅 | `src/designer/DesignerContent.tsx` 等 |
| 5 | `getFieldNodeById(components, id)` | 读 parent 含 children | 低频 | O(n) 递归，不 cloneDeep | `src/designer/renderer/utils.ts` |
| 6 | `designerState.components` | 保存序列化 | 低频（仅 save） | 直接序列化 | — |

---

## 2. useFieldConf（渲染当前组件）

文件：[`src/store/designer/hooks.ts`](src/store/designer/hooks.ts)

```ts
export const useFieldConf = (uniqueId: string) =>
    useSelector(
        (s: RootReducerState) => s.designerCanvas.byId[uniqueId],
        shallowEqual,
    );
```

### 2.1 适用范围

| 场景 | 适用 | 原因 |
| --- | --- | --- |
| DesignerField 渲染 | ✅ | 只读自己组件的 config |
| 配置面板读当前组件 | ✅ | 同上 |
| layers-tree 读选中组件 | ✅ | 读选中节点的 displayName 等 |
| context-menu 复制/粘贴 | ✅ | 读源组件的 config |

### 2.2 不适用场景

| 场景 | 不适用 | 改用什么 |
| --- | --- | --- |
| 读 parent（含 children） | ❌ 返回 FlatField 不含 children | `getFieldNodeById(components, parentId)` |
| 读整树 | ❌ 只订阅单点 | `useSelector(s => s.designerCanvas.components, shallowEqual)` |
| 异步回调读最新 | ❌ 会触发 render | `useStore().getState()` |

### 2.3 失效场景

组件已删除时返回 `undefined`，调用方**必须**判空：

```ts
const fieldConf = useFieldConf(uniqueId);
if (!fieldConf?.data) return null;  // ⚠️ 必加判空
```

### 2.4 `propsDataSource` fallback 决策（task-007 §3.4）

`DesignerField` 渲染体使用 `fieldById ?? propsDataSource` 兜底，**不是**冗余设计：

**背景**：旧 `useDesignerSettingChange` 有两个 setSetting 来源——① EventBus 触发读 `getFieldConf`（完整树节点）；② `ownerSetting` prop 变化时 `setSetting(ownerSetting)`。`useFieldConf` 只覆盖第 1 个来源（订阅 byId），第 2 个来源（ownerSetting 回退）需要处理。

**决策**：
- **Redux 订阅不漏通知**——`useFieldConf` 订阅 `byId[uniqueId]`，data.config 任何字段变化都会触发 re-render，**不需要**额外订阅 ownerSetting
- **保留 `propsDataSource` 作为 fallback**——仅用于"byId[id] 不存在的过渡帧"（组件刚被删除但 props 还在渲染），防止 `dataSource.data.config` 解构 NPE：

```ts
// designer-field/index.tsx
const fieldById = useFieldConf(propsDataSource.uniqueId);
const dataSource = fieldById ?? propsDataSource; // byId 优先，props 兜底
```

**判定标准**：`propsDataSource` 仅作 fallback，**不**作为数据源——任何 data 字段更新都必须走 Redux dispatch，不依赖 props 同步。溯源：[task-007 §3.4 决策](../../plans/done/task-2026-07-21-007-byid-index.md)。

---

## 3. useSelector 整树订阅

```ts
const components = useSelector(
    (s: RootReducerState) => s.designerCanvas.components,
    shallowEqual,
);
```

### 3.1 适用场景

- RecursionComponents 递归渲染
- canvas-graph 渲染
- layers-tree 整树遍历

### 3.2 关键陷阱

> `shallowEqual` 必须加！否则任何 byId 变化（field-level update）都触发整树 reconcile。

**反例代码**（不要这么写）：

```ts
// ❌ 不带 shallowEqual
const components = useSelector(s => s.designerCanvas.components);
// 后果：拖拽期间 60+ 次/秒 updateFieldConfig → byId 引用变化 → useSelector 误触发
// → 整个 RecursionComponents 重渲染 → 440 组件场景卡顿
```

**正例代码**：

```ts
// ✅ 必须配 shallowEqual
const components = useSelector(s => s.designerCanvas.components, shallowEqual);
// shallowEqual 浅比较 components 引用：未变则不触发
```

task-012-d 已统一修复（所有整树 useSelector 都配 shallowEqual）。

### 3.3 失效模式

如果**只用 `useFieldConf` 配 React.memo**，那么 byId 变化只会触发对应组件 render，不会触发整树 useSelector。但如果某个 useSelector 不带 shallowEqual，会被 byId 变化误触发。

详见 [05-known-bugs.md §2 P6](./05-known-bugs.md)。

---

## 4. useStore().getState()（异步回调读最新）

文件：所有"事件回调 / dispatch 后同步读"的位置

```ts
const reduxStore = useStore<any>();
const designerCanvas = reduxStore.getState().designerCanvas;
```

### 4.1 为什么需要

useSelector 订阅触发 render；但**异步回调（事件处理 / dispatch 后）需要立即读最新值，不应订阅**。

```ts
// ❌ 错：异步回调里 useSelector 拿到的是上一次 render 的值
const components = useSelector(s => s.designerCanvas.components);
const onDragStop = () => {
    mergeFieldConfig(components, ...);  // 可能是 stale
};

// ✅ 对：异步回调里同步读 store
const reduxStore = useStore();
const onDragStop = () => {
    const components = reduxStore.getState().designerCanvas.components;
    mergeFieldConfig(components, ...);
};
```

### 4.2 适用场景

| 场景 | 用什么读 | 理由 |
| --- | --- | --- |
| onDragStop / onResize / onValueChange | `useStore().getState().designerCanvas.byId[id]` | 异步回调 |
| handleAlign | `byId[item]` from getState | 同上 |
| recalcGroupBounds subscribe 回调 | `getState()` 全量 | 同上 |
| layer-manager lock / visible / move / delete | `getState().byId[selected]` | 工具函数（非 React 上下文） |
| saveMethod / handleSave | `getState()` 全量 + `designerState.components` | 保存 |

### 4.3 latestCache 模式

`DesignerContent.tsx` 用 `latestCache.current` 缓存 getter：

```ts
const latestCache = useRef({
    get selected() { return reduxStore.getState().component.selected; },
    get state() { return reduxStore.getState().designerCanvas; },
});
```

**作用**：闭包跨异步边界（setTimeout / Promise / event handler）时，**每次访问 getter 都同步读最新**，避免 useEffect 闭包过期。

### 4.4 易错点

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| 异步回调里用 useSelector 拿到的值 | stale | 改用 `useStore().getState()` |
| 直接读 `state.designerCanvas.components`（假设 components 是 fresh） | updateFieldConfig 后 components 是 stale | 保存直接序列化 `designerState.components`（task-003 后单源，components 永远 fresh），归一化用 byId 重算（详见 [04-edge-cases.md](./04-edge-cases.md)） |
| 闭包保存 components 引用跨多次 dispatch | 永远是第一次的引用 | 用 `latestCache` getter 或每次重新 `getState()` |

---

## 5. getFieldNodeById（读 parent 含 children）

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts)

```ts
export function getFieldNodeById(components: any[], uniqueId: string): any | null;
```

### 5.1 用途

少数需要 parent.children 的场景：

- `recalcGroupBounds`：读组的 children 算 bbox
- `layer-manager/move`：读 parent.children 改顺序
- `layer-manager/copy`：读 parent.children 复制
- `layer-manager/delete`：读 parent.children 删除

### 5.2 性能

- O(n) 递归
- 不 cloneDeep（task-009 已删）
- 不接受 uniqueId 已删除（返回 null，调用方判空）

### 5.3 stale 风险

task-002 单源后 components 永远 fresh，返回值直接可用。

> 历史：旧双源时代返回的节点的 `data` 可能是 stale（如果该节点经历过 updateFieldConfig），需配合 `freshChildNodes` 包装用 byId 重写。task-002 单源重构后此问题已消除。

详见 [04-edge-cases.md §1](./04-edge-cases.md)。

### 5.4 替代方案（不推荐）

如果场景允许，可以用 parentMap + byId + 虚拟根节点构造：

```ts
const parentId = parentMap[uniqueId];
const parentNode = parentId === ROOT_UNIQUE_ID
    ? { uniqueId: ROOT_UNIQUE_ID, children: designerCanvas.components }
    : getFieldNodeById(designerCanvas.components, parentId);
```

task-002 单源后 components 永远 fresh，返回值直接可用，无需 freshChildNodes 包装。

---

## 6. 保存序列化（直接序列化 designerState.components）

> task-003 已删除 `getSaveableComponents` 函数，3 个保存路径改为直接序列化 `designerState.components`。

### 6.1 用途

保存路径直接序列化 `designerState.components`（task-003 已删除 `getSaveableComponents`）。

### 6.2 为什么

task-002 单源后 components 永远 fresh，直接序列化即可。

> 历史：旧双源时代 `updateFieldConfig` 只改 byId、components 是 stale，直接序列化 components 会存旧值（task-012-1 问题 1），所以需要 `getSaveableComponents` 用 byIdWins 合并。task-002 单源重构后此问题已消除。

### 6.3 实现

3 个保存路径直接读 `designerState.components`，无需 mergeByIdIntoTree byIdWins 合并。

> 历史：旧 `getSaveableComponents` 内部调 `mergeByIdIntoTree(components, byId, 'byIdWins')`——byId 全赢（fresh），tree 节点的结构（children 顺序等）以 tree 为准。单源后 components 即唯一真相，无需合并。

### 6.4 调用方

3 个保存路径直接读 `designerState.components`：

| 文件 | 用途 |
| --- | --- |
| `DesignerContent.tsx` | `designerState.components` |
| `designer-scene-monitor/index.tsx` | `designerState.components` |
| `saveAsTemp-modal/index.tsx` | `designerState.components` |

详见 [task-003](../../plans/done/task-2026-07-24-003-dead-code-cleanup.md)。

---

## 7. read 配置 vs read parent vs read children 对照

| 需求 | 用什么 | 代码 |
| --- | --- | --- |
| 当前组件的 config.title | `useFieldConf(id)` 渲染 / `byId[id]` 异步 | `fieldConf.data.config.title` |
| 当前组件的 config.left | 同上 | `fieldConf.data.config.left` |
| 当前组件的 parent 的 uniqueId | `parentMap[id]` | `parentMap[uniqueId]` |
| 当前组件的 parent 节点（不含 children） | `byId[parentMap[id]]` | `byId[parentMap[uniqueId]]` |
| 当前组件的 parent 节点（含 children） | `getFieldNodeById(components, parentMap[id])` | 详见 §5 |
| 当前组件的所有祖先 | 递归（罕见） | 不推荐，单独设计 |
| 整树渲染 | `useSelector(components, shallowEqual)` | 详见 §3 |
| 顶层组件列表 | `state.designerCanvas.components` | 顶层数组 |

---

## 8. 读路径决策树

```
Q: 是渲染还是异步回调？
├─ 渲染 → Q: 订阅整树还是单组件？
│       ├─ 整树 → useSelector(components, shallowEqual)
│       └─ 单组件 → useFieldConf(id)
└─ 异步回调 → useStore().getState().designerCanvas
       └─ Q: 需要 children 吗？
               ├─ 否 → .byId[id]
               └─ 是 → getFieldNodeById(components, id)
                       ⚠️ data 可能 stale，需要 byId 重写

Q: 是保存序列化吗？
└─ 是 → designerState.components  // 直接序列化（task-003 后单源）
```

---

## 9. 易错点

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| 用 `useDesigner()` 或 `useDesignerSettingChange` | 已删除，编译报错 | 改用 `useFieldConf` / `useSelector` |
| 异步回调用 useSelector 拿到的值 | stale | 改用 `useStore().getState()` |
| 保存直接序列化 `state.components` | 后端存旧值 | task-003 后单源，直接序列化 `designerState.components`（components 永远 fresh）；~~旧双源时代用 `getSaveableComponents`~~（task-003 已删除，直接序列化 components） |
| `useFieldConf(id)` 不判空 | 组件删除后 NPE | 加 `?.data` 判空 |
| `getFieldNodeById` 返回值 mutation | Immer frozen 抛错 | 读 + dispatch 修改，不要原地改 |
| `useSelector(components)` 不配 shallowEqual | byId 变化触发整树 reconcile | 必须 shallowEqual |
| 直接读 components.parent.children（跳过 freshChildNodes 包装） | 读到 stale data | 用 byId 重算 children |