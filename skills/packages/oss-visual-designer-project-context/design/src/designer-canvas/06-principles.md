# Designer Canvas 架构原则与禁区

> 配套 [00-overview.md](./00-overview.md) | 关注点：**提交前自检**
>
> 这是"宪法"：违反任何一条都会引发已知类型的 bug。

---

## 0. 速查：5 大原则 + 5 大禁区

### 0.1 5 大原则

1. **单一真相源**：state 唯一，组件渲染只读 state（不直接读 props 算 state）
2. **不可变契约**：所有修改走 dispatch + Immer，外部禁止 mutation
3. **字段级订阅**：高频路径用 useFieldConf / useSelector + shallowEqual
4. **单源契约**：components 是唯一真相源，byId/parentMap 纯派生（只读），所有写操作改树 + buildIndex 重建（task-002 后）
5. **~~stale tree 防护~~**：已消除（task-002 单源后 components 树永远 fresh，详见 §5）

### 0.2 5 大禁区

1. ❌ **直接 mutation** state / byId / components / props 引用
2. ❌ **滥用 cloneDeep**（仅在 resetUniqueId / generatorField / fetchMaterialSchema 等结构性变更需要时才用）
3. ❌ **EventBus 反模式**（runtimeComponentsTrigger 等已删，禁止新增）
4. ❌ **Context + 全量 setState**（useDesigner 兼容壳已删，禁止新增）
5. ❌ **循环依赖 setState**（recalcGroupBounds 内 setState 触发 subscribe 必须 isRecalcRef 防重入）

---

## 1. 原则 1：单一真相源

### 1.1 含义

state（Redux store）是画布状态的唯一真相源。组件通过订阅（useFieldConf / useSelector）读，通过 dispatch 写。

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
// task-006 之后
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

详见 [05-known-bugs.md §3.1 task-012-d P6](./05-known-bugs.md)。

### 3.4 React.memo

```ts
// ✅ 配合 React.memo
export default React.memo(DesignerField);

// ❌ 不 memo → 父组件 render 触发整树 reconcile
```

详见 [`DesignerField性能优化文档.md`](../DesignerField性能优化文档.md)。

---

## 4. 原则 4：单源契约

> **2026-07-28 更新**（task-002 单源 reducer 改造）：本节从原"双源同步"升级为"单源契约"。核心变化：`byId` / `parentMap` 从"可独立写入"变为"纯派生（只读）"，`updateFieldConfig` 改为"改树 + buildIndex"而非"只 patch byId"。

### 4.1 含义

`components` 是**唯一真相源**，`byId` / `parentMap` 是**纯派生索引（只读）**。所有写操作都改 `components` 树 + `buildIndex` 重建 `byId` / `parentMap`，不允许直接写 `byId` / `parentMap`。

具体：

- `updateFieldConfig`：Immer produce 改 `components` 树 → 在 produce **外**调用 `buildIndex` 重建 `byId` / `parentMap`
- `setComponents`：直接赋值 `components` → `buildIndex` 重建（不再走 `mergeByIdIntoTree`）
- `setState`：直接赋值 `components` → `buildIndex` 重建（不再走 `mergeByIdIntoTree`）；`byId` / `parentMap` 不允许直接赋值，由 `buildIndex` 派生

### 4.2 不变式

任何时候（dispatch 同步完成后）：

```
state.byId = buildIndex(state.components).byId
state.parentMap = buildIndex(state.components).parentMap
```

### 4.3 维护方

**仅 `setComponents` / `setState` / `updateFieldConfig` reducer 内部**维护。三者都改 `components` 树 + 在 produce **外**调用 `buildIndex` 重建派生索引。

`setComponents` 实际代码（task-002 后）：

```ts
case 'designerCanvas/setComponents': {
    // task-002 后：删除 mergeByIdIntoTree(fieldPreserve) 调用
    // 直接赋值 + buildIndex，buildIndex 在 produce 外调用（避免 Immer proxy 破坏引用复用）
    const newComponents = action.payload;
    const { byId, parentMap } = buildIndex(newComponents);  // ← produce 外，引用复用最优
    return {
        ...state,
        components: newComponents,
        byId,
        parentMap,
    };
}
```

> `mergeByIdIntoTree` / `fieldPreserve` / `dirtyConfigKeys`：task-002 后 reducer 不再调用，task-003 已从代码库删除函数定义和字段（2026-07-28）。详见 §12 已删除 API 清单。

**外部禁止**：

```ts
// ❌ 外部修改 byId
store.dispatch({ type: 'foo', payload: { byId: { ...newById } } });  // 不会触发同步
draft.byId[id].data = newData;                                          // 不会触发同步（仅在 reducer 内 Immer 才生效）
```

### 4.4 updateFieldConfig（已废弃旧设计）

> ⚠️ **本节描述的"只 patch byId、不改 components 树"旧设计已废弃**（task-002 单源 reducer 改造，2026-07-28）。task-002 后 `updateFieldConfig` 改为"Immer produce 改 components 树 + buildIndex 重建 byId/parentMap"，**components 树永远 fresh，不再有 stale tree 问题**。以下保留历史说明，仅供参考。

**旧设计**（task-008 的 P6 优化，已废弃）：

```ts
// ❌ 旧实现（task-002 前）：只 patch byId，components 树 stale
case 'designerCanvas/updateFieldConfig': {
    return produce(state, (draft) => {
        const target = draft.byId[uniqueId];
        const newData = { ...target.data, ...patch, ... };
        target.data = newData;
        // ⚠️ components 不变！tree 是 stale
    });
}
```

**新实现**（task-002 后）：Immer produce 改 components 树，buildIndex 在 produce 外重建派生索引，components 树永远 fresh：

```ts
// ✅ 新实现（task-002 后）：改树 + buildIndex，components 永远 fresh
case 'designerCanvas/updateFieldConfig': {
    const newComponents = produce(state.components, (draft) => {
        const target = findNodeInTree(draft, uniqueId);  // 在树里找节点
        if (target) {
            target.data = { ...target.data, ...patch, ... };
        }
    });
    const { byId, parentMap } = buildIndex(newComponents);  // ← produce 外，引用复用
    return {
        ...state,
        components: newComponents,
        byId,
        parentMap,
    };
}
```

> `dirtyConfigKeys`：task-002 后 reducer 不再依赖（byId 不再独立写入），task-003 已从 `FlatField` 接口和 `buildIndex` 中删除（2026-07-28）。

---

## 5. 原则 5：~~stale tree 防护~~（已消除）

> ✅ **本节描述的 stale tree 问题已消除**（task-002 单源 reducer 改造，2026-07-28）。task-002 后 `updateFieldConfig` 改为"改树 + buildIndex"，**components 树永远 fresh**，不再有 byId 更新过而 components 未同步的情况。以下内容保留作为历史参考，**新代码无需再考虑 stale tree 防护**。

### 5.1 含义（历史）

> ⚠️ 以下为 task-002 前的旧事实，task-002 后已消除。

`updateFieldConfig` 后 `state.components` 不会立即同步。任何读 components 的代码（如 `recalcGroupBounds` / 保存序列化 / `mergeFieldConfig` 输入）都可能拿到 stale。

### 5.2 stale 防护 checklist（历史，task-002 后不再需要）

> ⚠️ 以下防护在 task-002 后不再需要（components 永远 fresh），但保留历史参考。其中 `freshChildNodes` 包装、`beginSkipGroupRecalc` / `endSkipGroupRecalc` 等 task-002 已在 reducer / `recalcGroupBounds` 简化中移除或不再依赖。

- [x] ~~读 children 的位置/尺寸 → `freshChildNodes`（byId 重算）包装~~（task-002 后 components 永远 fresh，无需包装）
- [x] ~~保存序列化 → `getSaveableComponents(state)`~~（task-003 已删除 `getSaveableComponents`，保存直接序列化 `designerState.components`）
- [x] ~~setComponents 前的 mergeFieldConfig / getGroupSizePosition → 从 byId 读，不要从 components 读~~（task-002 后 components 即真相源，可直接读）
- [x] ~~handleAlign 等显式操作子组件位置 → `beginSkipGroupRecalc` / `endSkipGroupRecalc` + try/finally~~（task-002 后 `recalcGroupBounds` 已简化，删除 freshChildNodes 包装、shouldSkipGroupRecalc 分支、两步同步）

详见 [04-edge-cases.md](./04-edge-cases.md)。

### 5.3 stale 的判定（历史，task-002 后不再适用）

> ⚠️ 以下判定逻辑基于"byId 可能比 components 更新"的旧前提。task-002 后 byId 由 buildIndex 从 components 派生，二者永远一致，此判定不再适用。

```ts
// ❌ 旧判定（task-002 前适用）：byId.data 引用与 treeNode.data 引用不同 → 该节点被字段级更新过
const flat = byId[c.uniqueId];
if (flat && flat.data !== c.data) {
    // flat.data 是 fresh
    // c.data 是 stale
    return { ...c, data: flat.data };  // 用 flat.data 覆盖
}
return c;  // 没被字段级更新，c.data 仍是 fresh
```

### 5.4 task-015 计划

> ⚠️ **task-002 已消除 stale tree 问题**（components 树永远 fresh）。task-015（`safeRead*` 工具函数统一封装）已不再需要——单源后 components 永远 fresh，无需 stale 防护。task-015 可取消。详见 [task-015](../../plans/task-2026-07-24-015-stale-tree-defensive-reading.md)。

---

## 6. 禁区 1：直接 mutation

### 6.1 检测方法

```bash
# 在 designer/ 目录下搜索 mutation 关键字
grep -rn "\.splice\|\.push\|\.unshift\|\.shift\|\.pop\|Object\.assign(.*page" src/designer/
grep -rn "\.config\.[a-z]* *=" src/designer/layer-manager/
```

### 6.2 已清理（task-009 / task-010）

- `designer-field/parents.children.filter(...)` mutation → 不可变（task-010）
- `layer-manager/move` 的 splice/push/unshift → 不可变（task-010）
- `layer-manager/lock` 的 `config.isLock = ...` → 不可变（task-009）
- `layer-manager/visible` 的 `config.isHidden = ...` → 不可变（task-009）
- `configuration-panel/page/index.jsx` render 内 `Object.assign(state.page, ...)` → 移到 useEffect（task-011-fix）

### 6.3 待清理（task-016）

> **2026-07-28 更新**（task-2026-07-28-001）：原 task-006 审计的 8 处 mutation **已全部清理**。task-016 点名的 2 行真 mutation（useOnDrop L28/L61）+ syncLayoutBlockSize2Children 的 6 处 mutation + drag2layoutBlock 的 1 处 mutation，均由 task-2026-07-28-001 步骤 1a.1/1a.2/1a.3 清理完成。详见 [05-known-bugs.md §1.3](./05-known-bugs.md)。

**原 task-006 审计的 8 处 mutation 已全部修复**，详见 [05-known-bugs.md §1.3](./05-known-bugs.md) 和 [task-016 §3](../../plans/task-2026-07-24-016-audit-cloneDeep-mutations.md)。

### 6.4 隐式保护事实（task-006 → task-009 决策原因）

> **关键事实**：task-006 阶段 `getFieldConf` / `getParent` / `getFieldOrderBy` 内部都 `_.cloneDeep` 后再返回，工具函数内部的 mutation 改的是 clone **不污染 state**（Immer 安全）。因此 task-006 只修了 2 处"真 bug mutation"（DataProvider L117 / page/index.jsx L29-32），其余 6 处推迟到 task-009 删 cloneDeep 时同步改造——这是"**工具函数内部 mutation 的隐式保护**"事实。

**未来警示**：删除任何 `cloneDeep` 前必须先审计其内部 mutation 是否还受保护。否则 mutation 会直接作用到 Immer frozen 对象，抛 `TypeError: Cannot assign to read only property`。溯源：[task-006 §4 步骤 4](../../plans/done/task-2026-07-21-006-designer-canvas-slice.md)。

---

## 7. 禁区 2：滥用 cloneDeep

### 7.1 为什么是反模式

- `_.cloneDeep(440 组件树)` ≈ **10-50ms**（task-009 §9.3 估算）
- 高频路径（onChange 60+ 次/秒）扛不住
- 不可变更新应该用 spread / map / filter，原地克隆是浪费

### 7.2 合理使用场景

仅在以下结构性变更场景使用 cloneDeep：

| 场景 | 函数 | 原因 |
| --- | --- | --- |
| 重新生成 uniqueId | `resetUniqueId` | 给外部 fields 改 uniqueId，**会改 data**，必须 cloneDeep |
| 创建组件节点 | `generatorField` | 给外部 opts 加 uniqueId，**会改**，必须 cloneDeep |
| 解冻 Immer frozen 对象给第三方库用 | `resetObjectSealed` | Immer frozen 对象传给不支持 frozen 的第三方库（如部分 ECharts 配置 / antd 组件内部 clone）会报错。`resetObjectSealed` 通过 cloneDeep 解除 frozen 让第三方库可写。**不是**结构性变更，是兼容性桥接 |
| 第三方模块 defaultValue | `fetchMaterialSchema` | 给第三方数据加 resetDropItem2PointerPosition |

### 7.3 反模式（待清理）

```ts
// ❌ 纯读却 cloneDeep
function getFieldConf(components, id) {
    return _.cloneDeep(components).reduce(...);  // ← 已删（task-009）
}

// ❌ 双重 cloneDeep
const parents = getParent(state.components, selected, root);  // ← cloneDeep 1 次
const { index, components } = getFieldOrderBy(parents.children, selected);  // ← cloneDeep 2 次
```

### 7.4 正确写法

```ts
// ✅ 用 byId / parentMap O(1) 查
const fieldConf = store.getState().designerCanvas.byId[id];
const parentId = store.getState().designerCanvas.parentMap[id];
```

---

## 8. 禁区 3：EventBus 反模式

### 8.1 含义

禁止用 EventBus / 发布订阅模式做画布状态通知。

### 8.2 已删（task-007）

- `runtimeComponentsTrigger`（DataProvider 内部使用，已删）
- `syncDesignerUpdateKey`
- `getRuntimeTriggerKey(uniqueId)`

### 8.3 替代方案

| 旧 | 新 |
| --- | --- |
| EventBus.trigger('uniqueId-changed') | dispatch(updateFieldConfig(...)) |
| EventBus.on('uniqueId-changed', handler) | useFieldConf(id) / useSelector |
| 全局通知 + useSyncDesignerUpdate | 各 useSelector 自动响应 |

### 8.4 为什么是反模式

- Redux 自带发布订阅（dispatch → store.subscribe → useSelector），不需要额外 EventBus
- EventBus 与 Redux 双源数据，调试复杂
- EventBus 难做时间旅行 / DevTools 调试

---

## 9. 禁区 4：Context + 全量 setState

### 9.1 含义

禁止用 React Context + useState + Immer 管理画布树（useDesigner 兼容壳模式）。

### 9.2 已删（task-011）

- `useDesigner()` → 改用 `useSelector` / `useDispatch` / `useFieldConf`
- `DesignerContext` / `DesignerContext.Provider`
- `DataProvider` 退化为占位组件（仅 `<>{children}</>`）

### 9.3 替代方案

| 旧 | 新 |
| --- | --- |
| `const { state, setState } = useDesigner()` | `const state = useSelector(...)` / `const dispatch = useDispatch()` |
| `useDesignerSettingChange(id, props)` | `useFieldConf(id)` |
| `useSyncDesignerUpdate()` | 删（不再需要） |
| `useDebounceMergeConfig()` | 删（防抖不再需要） |

### 9.4 为什么是反模式

- Context value 变化触发所有消费方 re-render
- 440 组件场景下任何字段变化都全量 re-render
- Redux + useSelector 支持字段级订阅 + shallowEqual，性能最优

---

## 10. 禁区 5：循环依赖 setState

### 10.1 含义

`recalcGroupBounds` 内 setState → Redux subscribe → recalcGroupBounds，形成重入循环。

### 10.2 已防护

```ts
// DesignerContent.tsx recalcGroupBounds
const isRecalcRef = useRef(false);

const recalcGroupBounds = () => {
    if (isRecalcRef.current) return;  // ← 防重入
    // ...
    isRecalcRef.current = true;
    setState({ components: results });
    isRecalcRef.current = false;
};
```

### 10.3 易触发场景

新增一个"读 state → 算结果 → setState"的 subscribe 回调时，**必须**用 ref 防重入。

---

## 11. 提交前自检清单

每提交一个 PR，按下面 checklist 过一遍：

### 11.1 数据流正确性

- [ ] 渲染路径用 `useFieldConf` / `useSelector(..., shallowEqual)`
- [ ] 异步回调用 `useStore().getState()` 同步读
- [x] ~~保存用 `getSaveableComponents`~~（task-003 已删除，保存直接序列化 `designerState.components`）
- [x] ~~读 children 的位置/尺寸用 `freshChildNodes` 包装~~（task-002 后 components 树永远 fresh，无需 `freshChildNodes`）

### 11.2 不可变契约

- [ ] 无 `state.xxx = ...` 直接 mutation
- [ ] 无 `byId[id].data = ...` mutation
- [ ] 无 `parents.children.push(...)` mutation
- [ ] 无 `Object.assign(components, {...})` 整树替换
- [ ] 修改一律走 dispatch

### 11.3 无反模式

- [ ] 无 `cloneDeep(components)` 整树克隆（除非 resetUniqueId / generatorField）
- [ ] 无新增 EventBus
- [ ] 无新增 `useDesigner` 兼容壳
- [ ] 无新增 `runtimeComponentsTrigger` 触发/监听

### 11.4 性能

- [ ] 整树 useSelector 配 shallowEqual
- [ ] DesignerField / 类似高频组件配 React.memo
- [ ] 拖拽期间避免整树 dispatch
- [ ] 嵌套 subscribe 回调用 ref 防重入

### 11.5 文档

- [ ] 如新增 action，更新 [02-write-path.md §1](./02-write-path.md)
- [ ] 如加新读法，更新 [03-read-path.md §1](./03-read-path.md)
- [ ] 如修 bug，更新 [05-known-bugs.md §3](./05-known-bugs.md)
- [ ] 如引入新原则，更新本文档

---

## 12. 已删除 API 清单（task-002/003 单源重构，2026-07-28）

> 以下 API 在单源重构中已从代码库删除，**禁止重新引入**。grep 验证：`src/` 下 0 活代码引用（仅注释和 `.bak` 备份文件中保留历史说明）。

### 12.1 双源同步机制（task-003 删除）

| API | 原用途 | 删除原因 |
| --- | --- | --- |
| `mergeByIdIntoTree` | 把 byId 字段级更新合并到 components 树（三方向：nodeWins / byIdWins / fieldPreserve） | 单源后 updateFieldConfig 改树，components 永远 fresh，无需合并 |
| `getSaveableComponents` | 保存序列化时把 byId 合并到 tree（byIdWins 方向） | 单源后 components 即真相源，保存直接序列化 `designerState.components` |
| `dirtyConfigKeys`（FlatField 字段） | 记录字段级更新过的 config 字段名，供 fieldPreserve 合并判断 | 单源后 byId 纯派生，无需记录字段级更新 |
| `nodeWins` / `byIdWins` / `fieldPreserve`（三方向字符串字面量） | mergeByIdIntoTree 的合并方向参数 | 随 mergeByIdIntoTree 删除 |

### 12.2 死工具函数（task-003 删除）

| API | 原用途 | 删除原因 |
| --- | --- | --- |
| `patchFieldConf` | 工具函数版 patch byId（与 reducer 内联实现不一致） | 单源后 byId 纯派生，reducer 内 Immer produce 改树 + buildIndex |
| `getFieldById` | 从 byId 读节点 | 与 `byId[id]` 直接访问重复 |
| `getParentIdById` | 从 parentMap 读父节点 | 与 `parentMap[id]` 直接访问重复 |
| `removeFieldFromIndex` | 从 byId/parentMap 删除条目 | 单源后由 buildIndex 全量重建，无需手动删除 |

### 12.3 skip 机制（task-003 删除）

| API | 原用途 | 删除原因 |
| --- | --- | --- |
| `_skipGroupRecalc`（模块级变量） | skip 标志 | 单源后 recalcGroupBounds 简化，shouldSkipGroupRecalc 永远 false |
| `beginSkipGroupRecalc` | 设置 skip 标志 | 同上 |
| `endSkipGroupRecalc` | 清除 skip 标志 | 同上 |
| `shouldSkipGroupRecalc` | 检查 skip 标志 | 同上 |

### 12.4 undo/redo 死字段（task-003 删除）

| API | 原用途 | 删除原因 |
| --- | --- | --- |
| `undo: any[]`（DesignerCanvasState 字段） | 撤销栈 | 从未实现（无 action 读写），死字段 |
| `redo: any[]`（DesignerCanvasState 字段） | 重做栈 | 同上 |

### 12.5 禁区：禁止绕过 buildIndex 直接赋值 byId/parentMap

```ts
// ❌ 禁止：绕过 buildIndex 直接赋值 byId/parentMap
store.dispatch({ type: 'designerCanvas/setState', payload: { byId: { ...newById } } });
// → reducer 会 console.error + 从 safePayload 中删除 byId

// ❌ 禁止：在 reducer 外用 buildIndex 修改 byId/parentMap
// → 仅 setComponents / setState / updateFieldConfig reducer 内部允许调用 buildIndex

// ✅ 正确：所有 byId/parentMap 更新都通过 reducer 改 components 树 + buildIndex 重建
dispatch(setComponents(newTree));
dispatch(updateFieldConfig(id, patch));
```

---

## 13. 相关文档

- [00-overview.md](./00-overview.md) —— 索引页
- [01-data-model.md](./01-data-model.md) —— 数据模型
- [02-write-path.md](./02-write-path.md) —— 写路径
- [03-read-path.md](./03-read-path.md) —— 读路径
- [04-edge-cases.md](./04-edge-cases.md) —— 边界场景
- [05-known-bugs.md](./05-known-bugs.md) —— 历史 bug
- 审计（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计](../../research/useDesigner迁移可行性审计.md)
- 现有性能优化：[`DesignerField性能优化文档.md`](../DesignerField性能优化文档.md)