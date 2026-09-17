# 02 — 写路径：action + reducer + 写边界

> 配套 [00-README.md](./00-README.md) | 关注点：**怎么改 state**
>
> 本文合并原 `03-write-path.md` + `05-edge-cases.md` §1/§3。覆盖所有写操作 + 写边界场景。

---

## 0. 三条写路径速查

| 写路径 | action | 适用场景 | 是否改 components | 是否重建 byId |
| --- | --- | --- | --- | --- |
| **结构性变更** | `designerCanvas/setComponents` | 拖入/删除/成组/拆组/移动/对齐 | ✅ 直接赋值 | ✅ buildIndex |
| **字段级更新** | `designerCanvas/updateFieldConfig` | 配置面板 onChange / 拖拽 onDragStop / 锁定隐藏 | ✅ Immer produce 改树 | ✅ buildIndex（引用复用） |
| **批量字段更新** | `designerCanvas/setState` | DataProvider / 初始化 / 旧 API 兼容 | ✅（payload 含 components 时） | ✅（含 components 时） |

> 单源架构下 `updateFieldConfig` 也改 `components` 树，components 永远 fresh，无 stale tree 问题。

---

## 1. action 全表

**源码位置**：`src/store/modules/designer-canvas.ts` reducer L66-215

| # | action type | 用途 | 改 components | 重建 byId | 频率 |
| --- | --- | --- | --- | --- | --- |
| 1 | `designerCanvas/setComponents` | 结构性变更 | ✅ 直接赋值 | ✅ | 低频 |
| 2 | `designerCanvas/setState` | 批量字段更新（含 components 时走 setComponents 逻辑） | ✅ | ✅（含 components 时） | 低频 |
| 3 | `designerCanvas/updateFieldConfig` | 字段级更新 | ✅ Immer produce | ✅ | **高频** |
| 4 | `designerCanvas/clearRuntime` | 清空 realtimeDataFlow + customFieldsListMapping | ❌ | ❌ | 低频 |
| 5 | `designerCanvas/recordRealtimeDataFlow` | 记录/更新实时数据流 | ❌ | ❌ | 中频 |
| 6 | `designerCanvas/deleteRealtimeDataFlow` | 删除实时数据流 | ❌ | ❌ | 低频 |
| 7 | `designerCanvas/recordCustomFieldsList` | 记录/更新自定义字段 | ❌ | ❌ | 低频 |
| 8 | `designerCanvas/deleteCustomFieldsList` | 删除自定义字段 | ❌ | ❌ | 低频 |

---

## 2. action creators 签名

**源码位置**：`src/store/modules/designer-canvas-actions.ts`

```ts
// L15-18：批量更新 state 字段
export const setDesignerCanvasState = (payload: Partial<DesignerCanvasState>) => ({
    type: 'designerCanvas/setState',
    payload,
});

// L29-32：整树替换 components
export const setComponents = (components: any[]) => ({
    type: 'designerCanvas/setComponents',
    payload: components,
});

// L43-46：字段级更新
export const updateFieldConfig = (uniqueId: string, patch: any) => ({
    type: 'designerCanvas/updateFieldConfig',
    payload: { uniqueId, patch },
});

// L52-54：清空 runtime
export const clearDesignerCanvasRuntime = () => ({
    type: 'designerCanvas/clearRuntime',
});

// L64-67 / L72-75：realtimeDataFlow record / delete
export const recordRealtimeDataFlow = (payload: { uniqueId: string; sourceId: string }) => ({...});
export const deleteRealtimeDataFlow = (payload: { uniqueId: string }) => ({...});

// L82-85 / L90-93：customFieldsList record / delete
export const recordCustomFieldsList = (payload: { uniqueId: string; setting: any }) => ({...});
export const deleteCustomFieldsList = (payload: { uniqueId: string }) => ({...});
```

---

## 3. setComponents reducer（结构性变更）

**源码位置**：`src/store/modules/designer-canvas.ts` `setComponents` case L68-80

**关键逻辑**（不贴完整代码）：

1. `produce(state, draft => { draft.components = action.payload })` —— Immer 包裹，得到 `intermediate`
2. 在 produce **外**调用 `buildIndex(intermediate.components, state.byId)` —— 重建 `byId` / `parentMap`，引用复用保持订阅粒度
3. 返回 `{ ...intermediate, byId, parentMap }`

> ⚠️ `buildIndex` 必须在 produce 外调用：produce 内 `draft.components` 是 Immer proxy，`oldEntry.data === node.data` 永远 false（引用复用失效）。

---

## 4. updateFieldConfig reducer（字段级更新）

**源码位置**：`src/store/modules/designer-canvas.ts` `updateFieldConfig` case L117-178

**关键逻辑**：

1. **边界检查**（produce 外，L129-132）：
   - `uniqueId === ROOT_UNIQUE_ID` → 返回原 state
   - `!state.parentMap[uniqueId]` → 返回原 state（组件不存在）
   - `!patch || Object.keys(patch).length === 0` → 返回原 state（空 patch）

2. **parentMap 反向追踪找路径**（produce 内，L139-152）：
   - 从 `uniqueId` 沿 `parentMap` 反向追踪到 `ROOT_UNIQUE_ID`，构建 `path: string[]`
   - `MAX_DEPTH = 100`（10 倍冗余，440 组件场景实测最深 ≈ 10 层）
   - 超过 `MAX_DEPTH` → `console.error` + 放弃更新

3. **沿路径找到节点**（produce 内，L155-161）：
   - 沿 `path` 从 `draft.components` 逐层 `find` 到目标 `node`
   - 树与 parentMap 不一致 → 放弃更新（`modified` 保持 false）

4. **修改节点 data**（produce 内，L164-168）：
   - 浅合并：`node.data = { ...node.data, ...patch, config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config }`
   - `config` 字段单独浅合并（与旧 `patchFieldConf` 语义一致）
   - `modified = true`

5. **produce 外 buildIndex 重建**（L176-177）：`buildIndex(intermediate.components, oldById)` —— 引用复用保持订阅粒度

6. **produce 内提前 return**（parentMap/树不一致）：`modified` 保持 false → 返回原 state（L173）

---

## 5. setState reducer（批量字段更新 / 第三条写路径）

**源码位置**：`src/store/modules/designer-canvas.ts` `setState` case L81-110

**关键逻辑**：

1. **单源防护**（L89-93）：payload 含 `byId` / `parentMap` → `console.error` + 从 `safePayload` 删除（不 throw，避免边缘场景崩溃）
2. **过滤 byId/parentMap**（L95-99）：`safePayload` 删除 `byId` / `parentMap`
3. **produce 赋值**（L101-103）：`Object.assign(draft, safePayload)`
4. **含 components 时重建索引**（L105-108）：`hasComponents` → `buildIndex(intermediate.components, state.byId)`

### 5.1 setDesignerCanvasState 调用方（第三条写路径）

**4 个调用方**（Grep 验证，排除 `.bak` / 测试）：

| 调用方 | 文件 | 用途 |
| --- | --- | --- |
| `DesignerContent.tsx` | L14 import, L159/L171/L174 `setState` wrapper | 初始化数据 / 兼容旧 setState |
| `toolbar/index.js` | L8 import, L337 | 工具栏操作 |
| `configuration-panel/page/index.jsx` | L4 import, L28/L37 | 页面配置 |
| `aside-panel/layers-tree/tree/index.tsx` | import | 图层树操作 |

> `DesignerContent.tsx` 的 `setState` wrapper（L160-176）：payload 含 `components` 走 `setComponents` + 剩余字段走 `setDesignerCanvasState`；`components` 为空时补 `realtimeDataFlow: []` 和 `customFieldsListMapping: {}`。

---

## 6. 工具函数签名表

**源码位置**：`src/designer/renderer/utils.ts`

| # | 函数 | 签名 | 行号 |
| --- | --- | --- | --- |
| 1 | `generatorField` | `(fields, type = 'field', opts = {}, resetChildrenUniqueId = false) => { components, fieldId, field }` | L69-92 |
| 2 | `generatorGroup` | `(fields: any[], byId, parentMap, selected: string, rootParent: any) => { finalData, fieldId }` | L437-483 |
| 3 | `splitGroup` | `(fields: any[], byId, parentMap, selected: string, rootParent: any) => { finalData, fieldId }` | L484-516 |
| 4 | `getSelectedKeys` | `(byId: Record<string, any>, parentMap: Record<string, string>, keys: string[]) => string` | L307-321 |
| 5 | `deleteFieldByUniqueId` | `(parentChildren, uniqueId) => { components, fieldId, index }` | L275-303 |
| 6 | `setChildren` | `(fields, id, children) => fields \| children` | L100-122 |
| 7 | `mergeFieldConfig` | `(fields: any[], opts: { parentId, level = 0, replace }, value: any) => any[]` | L208-237 |
| 8 | `setLevelPath` | `(nodes: any[], parentNode: any, key = 'drillDownLevel') => any[]` | L152-178 |
| 9 | `getFieldOrderBy` | `(fields, id) => { index: number, components: any[] }` | L265-273 |
| 10 | `orderBy` | `(arr, next, prev) => any[]` | L247-253 |
| 11 | `getFieldNodeById` | `(components: any[], uniqueId: string) => any \| null` | L141-150 |
| 12 | `getGroupSizePosition` | `(children) => { leftItem, topItem, ..., width, height, ... }` | L322-395 |
| 13 | `resetChildrenPosition` | `(children, groupPosition) => any[]` | L397-412 |

> ⚠️ `setLevelPath` 是**活代码**（task-009 不可变版），被 layer-manager 等调用。**不是已删除 API**（已删除的是 `useLevelPath` hook 版本，见 [05-deleted-api.md](./05-deleted-api.md)）。

### 6.1 getFieldNodeById（核心函数）

**源码位置**：`src/designer/renderer/utils.ts` L141-150（注释 L124-130）

- task-012-c 核心函数，替代已删 `getParent`
- 从 `components` 树递归查找指定 `uniqueId` 的节点（**不 cloneDeep**，返回浅引用）
- 用于"需要访问 parent.children 或目标节点本身（含 children）"的少数场景
- 15 个调用方（Grep 验证）
- 组件已删除时返回 `null`，调用方需判空
- 禁止 mutation 返回值（如需修改走 `dispatch(setComponents(newTree))`）

详见 [03-read-path.md](./03-read-path.md) §getFieldNodeById。

---

## 7. handleAlign（组内对齐）

**源码位置**：`src/designer/canvas-graph/index.tsx` `handleAlign` L312-417

**关键逻辑**：

- 事件回调（非 React render），用 `store.getState().designerCanvas.byId` 同步读
- 方案 B：1 次 `setComponents` + `mergeFieldConfig` 累积改动
- 闭包 `components` 永远 fresh（单源后无 stale 问题）

---

## 8. 写边界场景

### 8.1 recalcGroupBounds（拖组内子组件 + 组内对齐）

**源码位置**：`src/designer/DesignerContent.tsx` L287-321

**触发条件**：每次 Redux 状态变化都触发（`reduxStore.subscribe(recalcGroupBounds)`，L323 注册）。

**目的**：当选中组件是组的子组件时，重新计算**组的尺寸和位置**（组的 bounds 跟随子组件的 bbox）。

**算法**：

1. 读 `getState().component.selected`（L290）
2. `parentMap[selectedIds[0]]` 找父组 id（L293-294）
3. `getFieldNodeById(components, parentId)` 取父组节点（L296）
4. 读 `parents.data.config` 的 `width/height/left/top`（L298）
5. `getGroupSizePosition(parents.children)` 计算子组件 bbox（L303）
6. bbox 与组当前 bounds 不一致 → `resetChildrenPosition` + `setChildren` + `mergeFieldConfig`（L309-315）
7. `setState({ components: results })`（L318）

**单源简化**（task-002）：components 树永远 fresh，`parents.children` 已是最新值，无需 `freshChildNodes` 包装。

### 8.2 isRecalcRef（防重入）

**源码位置**：`src/designer/DesignerContent.tsx` L284-319

```ts
const isRecalcRef = useRef(false);

const recalcGroupBounds = () => {
    if (isRecalcRef.current) return;  // 防重入
    // ...
    isRecalcRef.current = true;
    setState({ components: results });
    isRecalcRef.current = false;
};
```

**为什么需要**：`recalcGroupBounds` 内 `setState({components})` → `setComponents` → Redux subscribe → `recalcGroupBounds`，形成重入循环。若不防护，计算条件持续为 true 时会无限循环 → 爆栈。`isRecalcRef.current` 重入防护覆盖多 dispatch 序列。

### 8.3 recalcGroupInTree（拖拽出组/入组）

**源码位置**：`src/designer/aside-panel/layers-tree/tree/useOnDrop.ts` L22-35

**用途**：拖拽节点入组/出组后，重新计算目标组的尺寸和位置。

**算法**（纯函数）：

1. `getFieldNodeById(components, groupId)` 取组节点（L23）
2. `getGroupSizePosition(groupNode.children)` 计算 bbox（L26）
3. bbox 与组当前 bounds 不一致 → `resetChildrenPosition` + `setChildren` + `mergeFieldConfig`（L28-34）
4. 返回更新后的 components 树（若无变化则原样返回）

**调用点**：`useOnDrop.ts` L167 `finalComponents = recalcGroupInTree(finalComponents, dropFieldParentId)`

### 8.4 getResizedComponents（onResize 子组件级联缩放）

**源码位置**：`src/designer/renderer/designer-field/utils.ts` L152-178

**关键逻辑**：

- `dataSource` 来自 `useFieldConf`（byId 索引），是 FlatField，**不含 children**
- `syncGroupSize2Children` 依赖 `group.children` 才能递归 `resizeField`，FlatField 会导致命中失败 → 子组件不缩放
- 修复：`getFieldNodeById(state.components, dataSource.uniqueId)` 取带 children 的完整节点传入（L166）
- 单源后 `components` 永远 fresh

### 8.5 键盘快捷键

**源码位置**：`src/designer/DesignerContent.tsx` L387-428

| 快捷键 | 函数 | 行号 | 行为 |
| --- | --- | --- | --- |
| `Ctrl+S` | `handleKey2Save` | L387-399 | `window.addEventListener('keydown')` → `handleSave(true)` + `e.preventDefault()` |
| `Delete` | `handleDelete` | L411-430 | `window.addEventListener('keydown')` → `layerManager.delete` + `setState({components})` + `dispatch(component/selected)` |

> `handleDelete` 检查 `document.activeElement?.nodeName !== 'INPUT'`，避免输入框中删除。

### 8.6 异常输入边界（3 个）

**源码位置**：`src/store/modules/designer-canvas.ts`

| # | 边界 | 行号 | 处理 |
| --- | --- | --- | --- |
| 1 | `updateFieldConfig` 传不存在 id | L129-131 | `!state.parentMap[uniqueId]` → 返回原 state |
| 2 | `setComponents` 传空数组 | `DesignerContent.tsx` L166 | `setState` wrapper 检测 `_.isEmpty(nextState.components)` → 补 `realtimeDataFlow: []` 和 `customFieldsListMapping: {}` |
| 3 | `setState` 同时传 components 和 byId | L89-93 | `console.error('[setState] byId/parentMap 不能直接设置...')` + 从 `safePayload` 删除 `byId` / `parentMap` |

> 边界 3 用 `console.error` + 降级（删除），不 throw（避免边缘场景崩溃）。

---

## 9. 写路径决策树

```
要改 state？
├─ 结构性变更（拖入/删除/成组/拆组/移动/对齐/复制）
│   → dispatch(setComponents(newTree))
│     reducer: 直接赋值 + buildIndex 重建
│
├─ 字段级更新（配置面板 onChange / 拖拽 onDragStop / 锁定隐藏）
│   → dispatch(updateFieldConfig(uniqueId, patch))
│     reducer: Immer produce 改树 + buildIndex 重建（引用复用）
│
├─ 批量字段更新（初始化 / 旧 API 兼容）
│   → dispatch(setDesignerCanvasState(partial))
│     reducer: Object.assign + (含 components 时 buildIndex)
│
├─ runtime 数据（realtimeDataFlow / customFieldsList）
│   → dispatch(recordRealtimeDataFlow / deleteRealtimeDataFlow / ...)
│     reducer: 只改对应字段，不动 components
│
└─ 清空 runtime
    → dispatch(clearDesignerCanvasRuntime())
      reducer: realtimeDataFlow = [], customFieldsListMapping = {}
```

---

## 10. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [01-data-model.md](./01-data-model.md) —— 数据模型（类型 + state 形状）
- [03-read-path.md](./03-read-path.md) —— 读路径（含 getFieldNodeById / 保存序列化）
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
- [05-deleted-api.md](./05-deleted-api.md) —— 已删除 API 速查
