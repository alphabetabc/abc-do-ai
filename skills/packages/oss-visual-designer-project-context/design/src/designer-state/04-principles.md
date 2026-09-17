# 04 — 架构原则与禁区

> 配套 [00-README.md](./00-README.md) | 关注点：**提交前自检**
>
> 这是"宪法"：违反任何一条都会引发已知类型的 bug。已删除 API 清单见 [05-deleted-api.md](./05-deleted-api.md)。

---

## 0. 速查：4 大原则 + 5 大禁区

### 0.1 4 大原则

1. **单一真相源**：state 唯一，组件渲染只读 state（不直接读 props 算 state）
2. **不可变契约**：所有修改走 dispatch + Immer，外部禁止 mutation
3. **字段级订阅**：高频路径用 `useFieldConf` / `useSelector` + `shallowEqual`
4. **单源契约**：`components` 是唯一真相源，`byId` / `parentMap` 纯派生（只读），所有写操作改树 + `buildIndex` 重建；components 树永远 fresh，无 stale tree 问题

### 0.2 5 大禁区

1. ❌ **直接 mutation** state / byId / components / props 引用
2. ❌ **滥用 cloneDeep**（仅在 `resetUniqueId` / `generatorField` / `fetchMaterialSchema` 等结构性变更需要时才用）
3. ❌ **EventBus 反模式**（`runtimeComponentsTrigger` 等已删，禁止新增）
4. ❌ **Context + 全量 setState**（`useDesigner` 兼容壳已删，禁止新增）
5. ❌ **循环依赖 setState**（`recalcGroupBounds` 内 `setState` 触发 subscribe 必须 `isRecalcRef` 防重入）

---

## 1. 原则 1：单一真相源

### 1.1 含义

state（Redux store）是画布状态的唯一真相源。组件通过订阅（`useFieldConf` / `useSelector`）读，通过 dispatch 写。

### 1.2 适用范围

| 是 | 否 |
| --- | --- |
| 组件读 `useFieldConf(id).data.config` | 组件读 `props.config` 自己维护组件内 state |
| 工具函数读 `store.getState().byId[id]` | 工具函数读 `props` 假设组件已拿到 |
| 跨异步边界用 `latestCache.current` getter | 闭包保存 components 引用跨 dispatch |

### 1.3 例外

`DesignerField` 内部维护 `setLocations` 等纯 UI 临时状态（拖拽过程中显示用），不进入 store——这是合理的 UI 状态。

---

## 2. 原则 2：不可变契约

### 2.1 含义

所有修改 state 必须走 dispatch（reducer 内 Immer 处理不可变），外部禁止 mutation。

### 2.2 Immer frozen

```ts
state.designerCanvas.components  // ← Immer frozen（递归 read-only）
state.designerCanvas.byId[id]    // ← frozen
state.designerCanvas.parentMap   // ← frozen
```

**任何 mutation 抛 TypeError**：`Cannot assign to read only property 'x' of object '#<Object>'`

### 2.3 正确写法

```ts
// ✅ 增：dispatch 整树 / dispatch 字段级
dispatch(setComponents(newTree));
dispatch(updateFieldConfig(id, { config: { left: 100 } }));

// ✅ 改：用不可变工具
const newChildren = parents.children.map(c => ({ ...c, data: { ...c.data, config: { ...c.data.config, left: 100 } } }));
```

### 2.4 错误写法

```ts
// ❌ 直接 mutation
state.components[0].data.config.left = 100;        // 抛 TypeError
byId[id].data.config.left = 100;                   // 抛 TypeError
parents.children.push(newChild);                    // 抛 TypeError

// ❌ mutation 后 setState
parents.children = parents.children.filter(...);   // 抛 TypeError
setState({ components: components });               // 抛 TypeError
```

---

## 3. 原则 3：字段级订阅

### 3.1 含义

高频路径必须用字段级订阅，避免整树 re-render。

### 3.2 选型

| 场景 | 订阅 | 不订阅 |
| --- | --- | --- |
| 渲染当前组件 config | `useFieldConf(id)` | — |
| 渲染整树 | `useSelector(components, shallowEqual)` | 整树必须订阅（无法字段级） |
| 异步回调读最新 | — | `useStore().getState()` |

### 3.3 shallowEqual 必须加

```ts
// ✅ 字段级 + shallowEqual
const components = useSelector(s => s.designerCanvas.components, shallowEqual);

// ❌ 不带 shallowEqual → byId 变化触发整树 reconcile
const components = useSelector(s => s.designerCanvas.components);
```

详见 [06-bugs-and-tests.md](./06-bugs-and-tests.md)。

### 3.4 React.memo

```ts
// ✅ 配合 React.memo
export default React.memo(DesignerField);

// ❌ 不 memo → 父组件 render 触发整树 reconcile
```

详见 [`DesignerField性能优化文档.md`](../DesignerField性能优化文档.md)。

---

## 4. 原则 4：单源契约

### 4.1 含义

`components` 是**唯一真相源**，`byId` / `parentMap` 是**纯派生索引（只读）**。所有写操作都改 `components` 树 + `buildIndex` 重建 `byId` / `parentMap`，不允许直接写 `byId` / `parentMap`。

具体（详见 [01-data-model.md](./01-data-model.md) §4）：

- `updateFieldConfig`：Immer produce 改 `components` 树 → 在 produce **外**调用 `buildIndex` 重建 `byId` / `parentMap`
- `setComponents`：直接赋值 `components` → `buildIndex` 重建
- `setState`：直接赋值 `components` → `buildIndex` 重建；`byId` / `parentMap` 不允许直接赋值，由 `buildIndex` 派生

单源架构下 `updateFieldConfig` 改树，components 永远 fresh，不再有 stale tree 问题。

### 4.2 不变式

任何时候（dispatch 同步完成后）：

```
state.byId       = buildIndex(state.components).byId
state.parentMap  = buildIndex(state.components).parentMap
```

### 4.3 维护方

**仅 `setComponents` / `setState` / `updateFieldConfig` reducer 内部**维护。三者都改 `components` 树 + 在 produce **外**调用 `buildIndex` 重建派生索引。

### 4.4 外部禁止

```ts
// ❌ 外部修改 byId
store.dispatch({ type: 'foo', payload: { byId: { ...newById } } });  // 不会触发同步
draft.byId[id].data = newData;                                          // 不会触发同步（仅在 reducer 内 Immer 才生效）
```

---

## 5. 禁区 1：直接 mutation

### 5.1 检测方法

```bash
# 在 designer/ 目录下搜索 mutation 关键字
grep -rn "\.splice\|\.push\|\.unshift\|\.shift\|\.pop\|Object\.assign(.*page" src/designer/
grep -rn "\.config\.[a-z]* *=" src/designer/layer-manager/
```

### 5.2 已全部清理

原审计的 8 处 mutation + 后续发现的 `useOnDrop` / `syncLayoutBlockSize2Children` / `drag2layoutBlock` mutation **已全部清理**，改为不可变操作。

已清理列表：

- `designer-field/parents.children.filter(...)` mutation → 不可变（task-010）
- `layer-manager/move` 的 splice/push/unshift → 不可变（task-010）
- `layer-manager/lock` 的 `config.isLock = ...` → 不可变（task-009）
- `layer-manager/visible` 的 `config.isHidden = ...` → 不可变（task-009）
- `configuration-panel/page/index.jsx` render 内 `Object.assign(state.page, ...)` → 移到 useEffect（task-011-fix）
- `designer/aside-panel/layers-tree/tree/useOnDrop.ts` L28/L61 mutation → 不可变操作（task-2026-07-28-001）
- `designer/renderer/designer-field/element.tsx` `syncLayoutBlockSize2Children` 的 3 处 `_.set` + 3 处 `child.children =` → 浅展开 / spread + slice（task-2026-07-28-001）
- `designer/common/dnd/drag2layoutBlock.ts` L49 `layoutBlockNode.children =` → 不可变操作（task-2026-07-28-001）

详见 [06-bugs-and-tests.md](./06-bugs-and-tests.md) #22。

---

## 6. 禁区 2：滥用 cloneDeep

### 6.1 为什么是反模式

- `_.cloneDeep(440 组件树)` ≈ **10-50ms**
- 高频路径（onChange 60+ 次/秒）扛不住
- 不可变更新应该用 spread / map / filter，原地克隆是浪费

### 6.2 合理使用场景

仅在以下结构性变更场景使用 cloneDeep：

| 场景 | 函数 | 原因 |
| --- | --- | --- |
| 重新生成 uniqueId | `resetUniqueId` | 给外部 fields 改 uniqueId，**会改 data**，必须 cloneDeep |
| 创建组件节点 | `generatorField` | 给外部 opts 加 uniqueId，**会改**，必须 cloneDeep |
| 解冻 Immer frozen 对象给第三方库用 | `resetObjectSealed` | Immer frozen 对象传给不支持 frozen 的第三方库（如部分 ECharts 配置 / antd 组件内部 clone）会报错。`resetObjectSealed` 通过 cloneDeep 解除 frozen 让第三方库可写。**不是**结构性变更，是兼容性桥接 |
| 第三方模块 defaultValue | `fetchMaterialSchema` | 给第三方数据加 `resetDropItem2PointerPosition` |

### 6.3 反模式

```ts
// ❌ 纯读却 cloneDeep
function getFieldConf(components, id) {
    return _.cloneDeep(components).reduce(...);  // ← 已删
}

// ❌ 双重 cloneDeep
const parents = getParent(state.components, selected, root);  // ← cloneDeep 1 次
const { index, components } = getFieldOrderBy(parents.children, selected);  // ← cloneDeep 2 次
```

### 6.4 正确写法

```ts
// ✅ 用 byId / parentMap O(1) 查
const fieldConf = store.getState().designerCanvas.byId[id];
const parentId = store.getState().designerCanvas.parentMap[id];
```

---

## 7. 禁区 3：EventBus 反模式

### 7.1 含义

禁止用 EventBus / 发布订阅模式做画布状态通知。

### 7.2 已删

- `runtimeComponentsTrigger`（`DataProvider` 内部使用，已删）
- `syncDesignerUpdateKey`
- `getRuntimeTriggerKey(uniqueId)`

### 7.3 替代方案

| 旧 | 新 |
| --- | --- |
| `EventBus.trigger('uniqueId-changed')` | `dispatch(updateFieldConfig(...))` |
| `EventBus.on('uniqueId-changed', handler)` | `useFieldConf(id)` / `useSelector` |
| 全局通知 + `useSyncDesignerUpdate` | 各 `useSelector` 自动响应 |

### 7.4 为什么是反模式

- Redux 自带发布订阅（dispatch → store.subscribe → useSelector），不需要额外 EventBus
- EventBus 与 Redux 双源数据，调试复杂
- EventBus 难做时间旅行 / DevTools 调试

---

## 8. 禁区 4：Context + 全量 setState

### 8.1 含义

禁止用 React Context + useState + Immer 管理画布树（`useDesigner` 兼容壳模式）。

### 8.2 已删

- `useDesigner()` → 改用 `useSelector` / `useDispatch` / `useFieldConf`
- `DesignerContext` / `DesignerContext.Provider`
- `DataProvider` 退化为占位组件（仅 `<>{children}</>`）

### 8.3 替代方案

| 旧 | 新 |
| --- | --- |
| `const { state, setState } = useDesigner()` | `const state = useSelector(...)` / `const dispatch = useDispatch()` |
| `useDesignerSettingChange(id, props)` | `useFieldConf(id)` |
| `useSyncDesignerUpdate()` | 删（不再需要） |
| `useDebounceMergeConfig()` | 删（防抖不再需要） |

### 8.4 为什么是反模式

- Context value 变化触发所有消费方 re-render
- 440 组件场景下任何字段变化都全量 re-render
- Redux + `useSelector` 支持字段级订阅 + `shallowEqual`，性能最优

---

## 9. 禁区 5：循环依赖 setState

### 9.1 含义

`recalcGroupBounds` 内 `setState` → Redux subscribe → `recalcGroupBounds`，形成重入循环。

### 9.2 已防护

**源码位置**：`src/designer/DesignerContent.tsx` L284-319

```ts
const isRecalcRef = useRef(false);

const recalcGroupBounds = () => {
    if (isRecalcRef.current) return;  // ← 防重入
    // ...
    isRecalcRef.current = true;
    setState({ components: results });
    isRecalcRef.current = false;
};
```

### 9.3 易触发场景

新增一个"读 state → 算结果 → setState"的 subscribe 回调时，**必须**用 ref 防重入。

详见 [02-write-path.md](./02-write-path.md) §recalcGroupBounds。

---

## 10. 提交前自检清单

每提交一个 PR，按下面 checklist 过一遍：

### 10.1 数据流正确性

- [ ] 渲染路径用 `useFieldConf` / `useSelector(..., shallowEqual)`
- [ ] 异步回调用 `useStore().getState()` 同步读
- [ ] 保存直接序列化 `designerState.components`

### 10.2 不可变契约

- [ ] 无 `state.xxx = ...` 直接 mutation
- [ ] 无 `byId[id].data = ...` mutation
- [ ] 无 `parents.children.push(...)` mutation
- [ ] 无 `Object.assign(components, {...})` 整树替换
- [ ] 修改一律走 dispatch

### 10.3 无反模式

- [ ] 无 `cloneDeep(components)` 整树克隆（除非 `resetUniqueId` / `generatorField`）
- [ ] 无新增 EventBus
- [ ] 无新增 `useDesigner` 兼容壳
- [ ] 无新增 `runtimeComponentsTrigger` 触发/监听

### 10.4 性能

- [ ] 整树 `useSelector` 配 `shallowEqual`
- [ ] `DesignerField` / 类似高频组件配 `React.memo`
- [ ] 拖拽期间避免整树 dispatch
- [ ] 嵌套 subscribe 回调用 ref 防重入

### 10.5 文档

- [ ] 如新增 action，更新 [02-write-path.md](./02-write-path.md)
- [ ] 如加新读法，更新 [03-read-path.md](./03-read-path.md)
- [ ] 如修 bug，更新 [06-bugs-and-tests.md](./06-bugs-and-tests.md)
- [ ] 如引入新原则，更新本文档
- [ ] 如删除 API，更新 [05-deleted-api.md](./05-deleted-api.md)

---

## 11. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [01-data-model.md](./01-data-model.md) —— 数据模型（单源契约详见 §4）
- [02-write-path.md](./02-write-path.md) —— 写路径
- [03-read-path.md](./03-read-path.md) —— 读路径
- [05-deleted-api.md](./05-deleted-api.md) —— 已删除 API 速查
- 现有性能优化：[`DesignerField性能优化文档.md`](../DesignerField性能优化文档.md)
