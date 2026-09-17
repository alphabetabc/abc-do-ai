# task-2026-07-24-012-1-manual-fix

> 针对 task-012-d 落地后发现的手动问题修复（第二批）
>
> 任务编号：`task-2026-07-24-012-1` 上游任务：
>
> - [task-2026-07-21-012-d-manual-fix](./done/task-2026-07-21-012-d-manual-fix.md)（done，第一批手动修复）
>
> 状态：`in-progress`（实施完成，等待浏览器验证） 类型：`bugfix`

---

## 1. 背景

task-012-d 完成了第一批手动修复（setState 丢弃字段 / splitGroup byId 不含 children / generatorGroup byId 不含 children / handleAlign 闭包覆盖 / updateFieldConfig 不同步 components / 渲染性能优化 P0-P8 / 组点击不到 / 改名丢失 / 组内成组爆栈 / 组内对齐跳变）。

但在实际使用中又发现 3 类问题：

1. **保存丢失**：拖拽/配置面板修改后保存，后端拿到的 config 是旧值
2. **组内对齐**：task-012-d 的初版修复未完全覆盖，拖拽组内子组件场景仍异常
3. **`mergeByIdIntoTree` 自身 bug**：注释与实现不一致，导致 setComponents 后字段级更新（如改名）会被树覆盖丢失

本任务把这 3 类问题一次性根治。

---

## 2. 问题定位

### 问题 1：保存时丢失字段级更新（拖拽位置 / 配置面板改属性）

**现象**：拖拽移动组件（或修改配置面板属性）后点击保存，后端拿到的 config 中相关字段仍是旧值。

**根因分析**：

task-012-d 的 P6 优化（2026-07-23）把 `updateFieldConfig` 的 `needsTreeSync` / `syncInTree` 逻辑彻底删除，改为**永远只改 `byId`，`components` 数组引用不变**。这是为了解决"配置面板改任意属性都触发 RecursionComponents 全量重渲染"的性能问题。

但拖拽位置变更、配置面板 onChange 都走 `onValueChange` → `updateFieldConfig` 路径：

```
onDragStopHandle（designer-field/index.tsx L214）
  → onValueChange(uniqueId, { config: { ...nextPosition } })
  → submitFieldConfig(uniqueId, patch)
  → dispatch(updateFieldConfig(uniqueId, patch))
  → reducer：仅 patch byId[uniqueId].data，components 树不变
```

保存逻辑（`DesignerContent.tsx` handleSave L369-L374）读的是 `designerState.components`：

```ts
config: JSON.stringify({
    page: designerState.page,
    components: designerState.components,  // ← 树中位置/字段是旧的！
    realtimeDataFlow: designerState.realtimeDataFlow ?? [],
    customFieldsListMapping: {},
}),
```

`components` 树中目标字段是旧值，`byId` 中才是新值。保存读到旧值 → 后端存旧值。

**影响范围**：所有走 `updateFieldConfig`（字段级更新）路径的变更，只要后续没有触发 `setComponents`（结构性变更），保存时都会丢失：

| 场景 | 字段类型 | 当前是否丢失 |
| --- | --- | --- |
| 拖拽组件位置 | left/top | 是 |
| 拖拽组位置 | left/top | 是 |
| 拖拽组内子组件位置 | left/top | 是 |
| 配置面板改 left/top/width/height | 位置/尺寸 | 是 |
| 配置面板改 title | title | 是（虽然图层树从 byId 读，但保存走 tree） |
| 配置面板改其他任意 config 字段 | 任意 | 是 |

**关键文件**：

| 文件 | 行 | 作用 |
| --- | --- | --- |
| `src/store/modules/designer-canvas.ts` | L107-L126 | `updateFieldConfig` reducer 只改 byId |
| `src/designer/DesignerContent.tsx` | L357-L385 | `handleSave` 序列化读 `designerState.components` |
| `src/designer/DesignerContent.tsx` | L387-L396 | `useImperativeHandle.getState()` 返回 `designerCanvas` 全量 |
| `src/designer/DesignerContent.tsx` | L515-L522 | `onValueChange` → `submitFieldConfig` → `updateFieldConfig` |
| `src/pages/designer-page/designer-scene-monitor/index.tsx` | L37-L45 | 自定义 onSave：postMessage 用 `designerState.components` |
| `src/designer/toolbar/comp/saveAsTemp-modal/index.tsx` | L47-L74 | 存为模板：JSON.stringify 用 `designerState.components` |

### 问题 2a：组内对齐（handleAlign）组位置跳变

**现象**：选中组内 2 个元素，点击顶端对齐（或其他对齐方式），组的位置会意外跳变。

**根因分析**：

`recalcGroupBounds`（`DesignerContent.tsx` L279-L334）在每次 Redux 状态变化时触发。它对组内子组件做"位置重归一化"：

```ts
const { top, left, width, height } = getGroupSizePosition(parents.children);
const newChildren = resetChildrenPosition(parents.children, { top, left });
// newChildren 的 min top/left 归零
const finalData = setChildren(designerCanvas.components, parents.uniqueId, newChildren);
const results = mergeFieldConfig(finalData, { parentId: parents.uniqueId },
    { config: { top: prevTop + top, left: prevLeft + left, width, height } });
// 组位置 = prevPos + 子组件的 min top/left → 组跟着"漂移"
```

对拖拽场景这是正确的（组跟随子组件），但对"组内对齐"等显式改变子组件位置的操作，会导致组位置意外跳变。

**task-012-d 初版修复**：在 `handleAlign`（`canvas-graph/index.tsx` L355-L367）前后 `beginSkipGroupRecalc / endSkipGroupRecalc`；`recalcGroupBounds` 检测到标志时只更新组尺寸（`maxRight/maxBottom`），不改变组位置。

**初版修复覆盖情况**：对 handleAlign（走 `setComponents`）正确。但对**拖拽组内子组件**（走 `updateFieldConfig`）无效——见 §2b。

**关键文件**：
- `src/designer/DesignerContent.tsx` L278-L341：`recalcGroupBounds`（含 task-012-d 初版修复）
- `src/designer/canvas-graph/index.tsx` L312-L368：`handleAlign`（含 task-012-d 初版修复）
- `src/designer/renderer/utils.ts` L766-L796：`beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`

### 问题 2b：拖拽组内子组件时组尺寸不更新（plan 初版未识别）

**现象**：把组内子组件拖出原组边界，组本身尺寸不增长，子组件"溢出"组边界；或拖入缩小，组仍保持大尺寸。

**根因分析**：

`onDragStopHandle` 走 `updateFieldConfig`，**`components` 树不变**。`recalcGroupBounds` 订阅触发后：

```ts
const parents = getFieldNodeById(designerCanvas.components, parentId);  // 从 stale tree 取
const { top, left, width, height } = getGroupSizePosition(parents.children);  // 子组件位置全 stale
```

被拖子组件的新位置只在 `byId[childId].data.config` 里，不在 `parents.children` 里。`getGroupSizePosition` 算出的 bbox 还是旧尺寸，条件 `width !== prevWidth || height !== prevHeight` 为 false，函数 early return。**结果：组永远包不住被拖出边界的子组件**。

**关键文件**：
- `src/designer/DesignerContent.tsx` L278-L341：`recalcGroupBounds` 读 stale tree 的 `parents.children`
- `src/designer/renderer/designer-field/index.tsx` L192-L242：`onDragStopHandle` 走 `updateFieldConfig`

### 问题 3：`mergeByIdIntoTree` 自身 bug（注释与实现不一致）

**现象**：用户改名（title）→ `updateFieldConfig` → byId.title = "new"，tree.title = "old"。之后做任何 `setComponents` 操作（如对齐、成组、拖入图层组），合并后 title 被 tree 的 "old" 覆盖，**改名丢失**。

**根因分析**：

`mergeByIdIntoTree`（`renderer/utils.ts` L666-L698）当前实现：

```ts
const newData = { ...flat.data, ...node.data };  // 浅合并：node/tree 赢
if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
    newData.config = { ...flat.data.config, ...node.data.config };  // config：node/tree 赢
}
```

注释写"byId.config 的 title 保留，node.config 的 top/left 覆盖"，但**实现里 node 的所有 config 字段都会覆盖 byId 的字段**——包括 byId 中字段级更新过的 title。

正确语义应该是：
- 对 setComponents 场景（tree 是 fresh）：仅"tree 中**显式出现在 payload 节点里**的字段"以 tree 为准；其他字段以 byId 为准
- 对 save 场景（tree 是 stale，byId 是 fresh）：byId 全赢

**当前实现的实际行为**：
- setComponents 场景：如果新 payload 是 `mergeFieldConfig` 产出的新树，新树节点 data 是 `{ ...oldData, config: { ...oldConfig, ...newConfig } }`——`newConfig` 是新设置字段，旧的 fall-through 到 `oldConfig`。所以合并时 `newConfig` 字段赢、`oldConfig` 字段赢 byId —— 大部分情况碰巧对，但**字段级更新的字段如果 tree 中没出现，会被 byId 覆盖丢失**（title 丢失）
- save 场景：tree 全 stale，node 全赢 → byId 的新位置全丢（问题 1）

**关键文件**：
- `src/designer/renderer/utils.ts` L666-L698：`mergeByIdIntoTree` 实现
- `src/store/modules/designer-canvas.ts` L74-L100：setComponents / setState reducer 用 `mergeByIdIntoTree`

---

## 3. 修复方案

### 3.1 问题 1：保存时合并 byId 到 components 树（**byId 赢方向**）

**核心思路**：在所有保存路径前，把 `byId` 的最新 data **完全覆盖** `components` 树节点的 data（因为 tree 一定是 stale 的，byId 才是 fresh 的）。

**Step 1.1：新增 `getSaveableComponents(state)` 工具函数**

在 `src/designer/renderer/utils.ts` 中新增：

```ts
/**
 * 获取可用于序列化保存的 components 树
 * - 把 byId 中的最新 data 合并到 components 树
 * - save 场景：tree 一定是 stale 的，byId 才是 fresh 的，因此 byId 全赢
 * - 不修改 Redux state，返回新数组供序列化
 * - 所有保存路径（handleSave / saveAsTemp / postMessage / getState）统一调用本函数
 */
export function getSaveableComponents(state: { components: any[]; byId: Record<string, FlatField> }): any[] {
    return mergeByIdIntoTree(state.components, state.byId, 'byIdWins');
}
```

**Step 1.2：扩展 `mergeByIdIntoTree` 增加 `direction` 参数**

```ts
export function mergeByIdIntoTree(
    components: any[],
    byId: Record<string, FlatField>,
    direction: 'nodeWins' | 'byIdWins' = 'nodeWins',
): any[] {
    if (!byId || Object.keys(byId).length === 0) return components;

    const mergeNode = (node: any): any => {
        if (!node || !node.uniqueId) return node;
        const flat = byId[node.uniqueId];
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        const newChildren = hasChildren ? node.children.map(mergeNode) : node.children;
        if (!flat) return newChildren === node.children ? node : { ...node, children: newChildren };

        const dataRefSame = flat.data === node.data;
        if (dataRefSame && newChildren === node.children) return node;
        if (dataRefSame) return { ...node, children: newChildren };

        let newData: any;
        if (direction === 'byIdWins') {
            // save 场景：byId 是 fresh，全赢
            newData = { ...node.data, ...flat.data };
            if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
                newData.config = { ...node.data.config, ...flat.data.config };
            }
        } else {
            // setComponents 场景：node 是 fresh，但"未显式出现在 node 中的字段"以 byId 为准
            // 简化策略：仍 node 赢（保留旧行为，避免 setComponents 路径回归）
            // 改名丢失的修复见 §3.3
            newData = { ...flat.data, ...node.data };
            if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
                newData.config = { ...flat.data.config, ...node.data.config };
            }
        }
        return { ...node, data: newData, children: newChildren };
    };
    return components.map(mergeNode);
}
```

注意：`nodeWins` 分支保留原行为，避免 setComponents 路径回归（命名/改名丢失的彻底修复见 §3.3）。

**Step 1.3：替换所有保存路径**

| 文件 | 现状 | 改为 |
| --- | --- | --- |
| `src/designer/DesignerContent.tsx` L370-L375 | `components: designerState.components` | `components: getSaveableComponents(designerState)` |
| `src/designer/DesignerContent.tsx` L387-L396 | `getState: () => reduxStore.getState().designerCanvas` | 保留原样（调用方按需走 getSaveableComponents）。在 `getState` 注释里说明：直接返回的是 byId/tree 分离的 state，序列化请用 `getSaveableComponents` |
| `src/pages/designer-page/designer-scene-monitor/index.tsx` L43 | `components: designerState.components` | `components: getSaveableComponents(designerState)` |
| `src/designer/toolbar/comp/saveAsTemp-modal/index.tsx` L58 | `components: designerState.components` | `components: getSaveableComponents(designerState)` |

**为什么不直接改 updateFieldConfig 同步 components 树（方案 B）**：
- 拖拽每个像素变化都重建 components → RecursionComponents 全量 reconcile → 440 组件场景拖拽卡顿
- 违背 task-012-d P6 优化（[done/task-2026-07-21-012-d-manual-fix](./done/task-2026-07-21-012-d-manual-fix.md)）

**为什么不改 updateFieldConfig 按需同步（方案 C）**：
- 同上，拖拽路径性能不可接受

**决策**：采用方案 A（byIdWins 方向）。

### 3.2 问题 2a：组内对齐组位置跳变

**Step 2a.1：验证 task-012-d 初版修复**

启动 dev 服务器，浏览器冒烟：
1. 创建一个组，组内放 2 个组件（一个 top=100，一个 top=300）
2. 选中组内 2 个组件 → 顶端对齐 → 组位置应保持不变，组件对齐到 top=100
3. 顶层（非组内）多选 → 对齐 → 不受影响

如验证通过则本子任务只需 §3.3 顺手加固即可。

**Step 2a.2：如有问题，调整标志机制**

可能的调整：
- `handleAlign` 的 `beginSkipGroupRecalc / endSkipGroupRecalc` 加 try/finally 保护（避免异常卡住标志）
- `recalcGroupBounds` 的"仅更新尺寸"分支改为读 byId 计算 bbox（顺带修问题 2b）

### 3.3 问题 2b：拖拽组内子组件时组尺寸不更新

**核心思路**：`recalcGroupBounds` 计算 bbox 时**优先读 byId**（fresh），fallback 到 tree.children（stale）。

**Step 2b.1：在 `recalcGroupBounds` 中用 byId 重算 bbox**

修改 `src/designer/DesignerContent.tsx` L297-L319：

```ts
// 原：const parents = getFieldNodeById(designerCanvas.components, parentId);
//     const { top, left, width, height } = getGroupSizePosition(parents.children);
//     // children 是 stale 的，被拖的子组件新位置不在里面

// 新：用 byId 重算子组件 bbox（byId 包含所有字段级更新）
const byId = designerCanvas.byId;
const childIds = parents.children.map((c: any) => c.uniqueId);
const freshChildren = childIds
    .map((id: string) => byId[id])
    .filter(Boolean)  // byId 不含 children，但 FlatField.data 与 children.data 引用一致
    .map((flat: any) => ({ data: flat.data }));  // 转成 getGroupSizePosition 期望的形状

const { top, left, width, height } = getGroupSizePosition(freshChildren);
```

注意：`buildIndex` 里 `byId[id].data` 是 `node.data` 的**浅引用**（见 utils.ts L722-L727），所以 `byId[id].data === treeNode.data` 在 setComponents 之后才相等（被拖后 byId 是新的 data 引用，tree 还是旧 data 引用）。

为节省遍历，只对**可能 stale 的子树**（即最近一次 dispatch 是 `updateFieldConfig`）走 byId 重算。简化方案：**总是从 byId 重算**（一次遍历 O(k)，k 是子组件数，subtree 通常很小）。

**Step 2b.2：仅更新尺寸分支同步走 byId**

[DesignerContent.tsx L304-L319](src/designer/DesignerContent.tsx#L304-L319) 的"shouldSkipGroupRecalc 时只更新尺寸"分支同样把 `parents.children.map(c => ...)` 改为 `childIds.map(id => byId[id].data.config...)` 读取。

**Step 2b.3：归一化分支保留 children 内的子组件更新**

归一化（`resetChildrenPosition`）依赖 `children` 数组本身（要把树节点的 children 整个替换掉）。子组件的**新位置**已经在 byId，所以 `parents.children` 里是 stale 位置。**修复**：在归一化前先把 children 的 data 用 byId 刷新：

```ts
const freshChildNodes = parents.children.map((c: any) => {
    const flat = byId[c.uniqueId];
    return flat && flat.data !== c.data ? { ...c, data: flat.data } : c;
});
const { top, left, width, height } = getGroupSizePosition(freshChildNodes);
const newChildren = resetChildrenPosition(freshChildNodes, { top, left });
// setChildren / mergeFieldConfig 照旧
```

### 3.4 问题 3：`mergeByIdIntoTree` 改名丢失

**根因**：`setComponents` 场景下，mergeFieldConfig 产出的新树节点 data 是 `{ ...oldData, config: { ...oldConfig, ...newConfig } }`——对于"用户在 byId 改了但本次 setComponents 没涉及的字段"（如 title），tree 里仍是旧值。merge 时 `{ ...byId.config, ...node.config }` 让 node 的旧 title 覆盖 byId 的新 title。

**修复策略**：区分"node 中显式更新的字段"和"node 中未触碰的字段"。但简单实现无法在 merge 阶段判断哪些字段是 node 显式更新的（mergeFieldConfig 返回的 data 已经是新对象，没有元信息）。

**简化方案**：保留 setComponents 路径原行为（node 赢），但**在 setComponents reducer 之前先把 byId 的字段级更新**显式 patch 回新树**——也就是 `setComponents` reducer 内部改成：

```ts
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        // 把 byId 中字段级更新的 data patch 回新树节点（按 uniqueId 对齐）
        // 关键：只 patch byId 的 data（fresh），不替换 node 的 data（fresh for operation fields）
        // 策略：对每个节点，先 node.data（fresh for operation），再 overlay byId.data（fresh for field-level）
        // 但字段级更新过的字段（如 title）byId 有新值，tree 中没动 → 应该是 byId 赢
        // 而本次 setComponents 改的字段（如 left）tree 有新值，byId 没动 → 应该是 tree 赢
        // 这两个方向的合并无法用单一方向浅合并解决
        // ...
    });
}
```

**最终方案**：保持现有 nodeWins 行为，但**额外**在 setComponents reducer 里对每个节点做"byId 中存在但 node 中不存在的新字段"检测并合并。简化实现：

```ts
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        // 把 byId 中的字段级更新（特别是"tree 没触碰的字段"）合并到新树
        const mergedComponents = mergeByIdIntoTreeWithFreshFields(action.payload, state.byId);
        draft.components = mergedComponents;
        const { byId, parentMap } = buildIndex(mergedComponents);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

`mergeByIdIntoTreeWithFreshFields` 思路：只对"byId.data.config 中存在、但 node.data.config 中不存在（旧引用）"的字段做 byId 赢合并，其他字段保持 node 赢。

更简单：给每个 FlatField 加 `lastSetBy: 'tree' | 'field' | null` 元信息，记录该字段最后一次来源。但侵入性大。

**实用方案（推荐）**：利用 byId 是浅引用 + tree.data 是 stale 的特性，写一个专门的"setComponents 路径合并"函数：

```ts
/**
 * setComponents 路径专用：把 byId 中字段级更新（特别是字段级更新过的字段）合并到新树
 * - node 是 fresh（mergeFieldConfig 产出），按 node 为准
 * - byId 中**引用与 node.data 不同**的字段（即字段级更新过），按 byId 为准
 *   → 因为字段级更新（updateFieldConfig）会让 byId.data 变成新引用，node.data 还是旧引用
 *   → 通过浅引用差异就能识别"哪些字段是 byId 单独更新过的"
 */
export function mergeFieldLevelUpdatesToTree(
    components: any[],
    byId: Record<string, FlatField>,
): any[] {
    // 实现：对每个节点，如果 byId[node.uniqueId].data !== node.data，
    // 说明 byId 经历过字段级更新，需要把 byId.data 的内容整体 overlay 到 node.data
    // 但要注意：node.data.config 是本次 operation 的 fresh 值，
    // byId.data.config 是字段级更新的 fresh 值，两者引用不同（Immer 替换）
    // 合并策略：{ ...node.data, ...byId.data, config: { ...node.data.config, ...byId.data.config } }
    // 这样 config 字段：以 byId 为准（节点级更新会被字段级覆盖）
    // ⚠️ 这要求 setComponents 路径只对"updateFieldConfig 过"的节点按 byId 赢
    //     对没字段级更新的节点，byId.data === node.data，无需合并
}
```

**决策**：~~本任务暂时不动 §3.4~~ **本任务实施 §3.4**（2026-07-24 更新）。

原计划留作后续 task，但用户报告了新场景"ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状"，与 §3.4 同根因（setComponents 路径 byId 字段级更新被 tree 旧值覆盖）。决定在本任务一并修复。

**最终实施方案**：给 FlatField 加 `dirtyConfigKeys: Set<string>`，记录字段级更新过的 config 字段名。`mergeByIdIntoTree` 新增 `fieldPreserve` 合并方向：对 `dirtyConfigKeys` 中的字段取 byId 值（保留字段级更新），其他字段取 node 值（保留本次操作）。`setComponents` / `setState` reducer 从 `nodeWins` 改为 `fieldPreserve`。

详见 §3.4-fix。

> 注：§3.4 已在本任务实施，本任务修问题 1、2a、2b、3（§3.4）。

### 3.4-fix：`dirtyConfigKeys` + `fieldPreserve` 合并方向

**问题复现**：选中 ab 对齐 → 拖 b 到别处 → 选中 cd 对齐 → ab 恢复原状（b 回到对齐前的位置）。

**根因链**：
1. 选中 ab 对齐 → `setComponents(mergedTree)` → byId 更新 ✓
2. 拖 b → `updateFieldConfig(bId, {config:{left,top}})` → **只改 byId[bId].data，components 树不变**
3. 选中 cd 对齐 → `handleAlign` 里 `let results = components`（React 闭包，b 在树中位置是旧的）→ `mergeFieldConfig(results, ...)` 基于 stale 树改 cd → `setComponents(results)` → reducer `mergeByIdIntoTree(results, byId, 'nodeWins')`：
   - 对 b 节点：`flat.data !== node.data`（b 被字段级更新过），nodeWins 分支 `{...flat.data, ...node.data}` → node.data 的**旧** left/top 覆盖 flat.data 的**新** left/top → **b 位置丢失**

**核心困难**：`mergeFieldConfig` 用 `deepMergeObj` 递归合并，产出的 node.data.config 是"本次操作字段(新) + 旧字段"的混合体，`updateFieldConfig` 产出的 byId.data.config 是"字段级更新字段(新) + 旧字段"的混合体。两者都是"部分新+部分旧"，无法在 `mergeByIdIntoTree` 里通过引用差异区分具体哪个字段是新的。

**解决方案**：给 FlatField 加 `dirtyConfigKeys: Set<string>`，显式记录字段级更新过的 config 字段名。

**Step 3.4.1：FlatField 加 `dirtyConfigKeys` 字段**

```ts
export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;
    data: { config: any; [key: string]: any };
    dirtyConfigKeys: Set<string>; // 字段级更新过的 config 字段名
}
```

**Step 3.4.2：`buildIndex` 初始化 `dirtyConfigKeys`**

`buildIndex` 创建 FlatField 时 `dirtyConfigKeys: new Set()`（空集合，因为树刚重建，字段级更新已合并）。

**Step 3.4.3：`updateFieldConfig` reducer 记录 keys**

```ts
if (patch.config) {
    if (!target.dirtyConfigKeys) target.dirtyConfigKeys = new Set();
    Object.keys(patch.config).forEach((key) => target.dirtyConfigKeys.add(key));
}
```

**Step 3.4.4：`mergeByIdIntoTree` 新增 `fieldPreserve` 方向**

```ts
} else if (direction === 'fieldPreserve') {
    // 以 node.data 为基础（保留本次操作），config 中 dirtyConfigKeys 字段用 byId 值覆盖
    newData = { ...flat.data, ...node.data };
    if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
        newData.config = { ...flat.data.config, ...node.data.config };
        if (flat.dirtyConfigKeys && flat.dirtyConfigKeys.size > 0) {
            flat.dirtyConfigKeys.forEach((key) => {
                if (key in flat.data.config) {
                    newData.config[key] = flat.data.config[key];
                }
            });
        }
    }
}
```

**Step 3.4.5：`setComponents` / `setState` reducer 改用 `fieldPreserve`**

```ts
const mergedComponents = mergeByIdIntoTree(action.payload, state.byId, 'fieldPreserve');
```

**覆盖范围**：所有走 `setComponents` / `setState` 的调用点自动受益（handleAlign / recalcGroupBounds / layer-manager lock/visible / resize / 成组 / 拆组 等），无需逐个调用点修。

**为什么不改 `updateFieldConfig` 同步 components 树（方案 D）**：
- `RecursionComponents` 用 `shallowEqual` 订阅 `components` 数组引用
- 拖拽每个像素变化都同步树 → components 引用变 → RecursionComponents 全量 reconcile → 440 组件卡顿
- 违背 task-012-d P6 优化

**为什么不用"在调用点前用 byIdWins 同步 fresh 树"（方案 H）**：
- 需要逐个调用点修（handleAlign / lock / visible / resize / recalcGroupBounds 等十余处）
- 容易遗漏，且每个调用点都要加 `mergeByIdIntoTree` 调用
- 方案 J（dirtyConfigKeys）在 reducer 层一次性解决，覆盖更完整

### 3.5 实施顺序

按风险从低到高：

1. **Step 2b.1 + 2b.2 + 2b.3**：先修 `recalcGroupBounds` 读 byId 重算 bbox（独立修复，问题 2b）
2. **Step 1.1 + 1.2**：新增 `getSaveableComponents` + 扩展 `mergeByIdIntoTree` direction 参数（基础设施，问题 1 修复前置）
3. **Step 1.3**：替换 3 个保存路径（应用问题 1 修复）
4. **Step 2a.1**：浏览器冒烟验证问题 2a 的 task-012-d 修复
5. **Step 2a.2**：如有问题，调整 handleAlign 的 try/finally 保护
6. **Step 3.4.1-3.4.5**：`dirtyConfigKeys` + `fieldPreserve`（问题 3，§3.4）

---

## 4. 详细步骤

### 步骤 1：扩展 `mergeByIdIntoTree` + 新增 `getSaveableComponents`

**文件**：`src/designer/renderer/utils.ts`

1. 找到 `mergeByIdIntoTree`（L666），加 `direction` 参数（默认 `'nodeWins'` 保持向后兼容）
2. 实现 `byIdWins` 分支：`{ ...node.data, ...flat.data }` + `{ ...node.data.config, ...flat.data.config }`
3. 在文件末尾（`mergeByIdIntoTree` 后）新增 `getSaveableComponents` 函数

### 步骤 2：替换 `handleSave` 的 components 读取

**文件**：`src/designer/DesignerContent.tsx`

1. import 新增 `getSaveableComponents`（已有 `mergeByIdIntoTree` import 的话在同语句加）
2. L370-L375 `components: designerState.components` 改为：
   ```ts
   components: getSaveableComponents(designerState),
   ```

### 步骤 3：替换 `designer-scene-monitor` 的 onSave

**文件**：`src/pages/designer-page/designer-scene-monitor/index.tsx`

1. L43 `components: designerState.components` 改为：
   ```ts
   components: getSaveableComponents(designerState),
   ```

### 步骤 4：替换 `saveAsTemp-modal` 的 components 读取

**文件**：`src/designer/toolbar/comp/saveAsTemp-modal/index.tsx`

1. import 新增 `getSaveableComponents`
2. L58 `components: designerState.components` 改为：
   ```ts
   components: getSaveableComponents(designerState),
   ```

### 步骤 5：修改 `recalcGroupBounds` 用 byId 重算 bbox

**文件**：`src/designer/DesignerContent.tsx`

1. L288-L296 取 `parents` 后，新增从 byId 读子组件 data 的辅助：
   ```ts
   const byId = designerCanvas.byId;
   const freshChildNodes = parents.children.map((c: any) => {
       const flat = byId[c.uniqueId];
       // byId 不存 children 数组，但 FlatField.data 与 treeNode.data 浅引用相同
       // 字段级更新（updateFieldConfig）后 byId.data 是新引用，c.data 是旧引用
       // 用 data 引用差异判断是否需要刷新
       if (flat && flat.data !== c.data) {
           return { ...c, data: flat.data };
       }
       return c;
   });
   ```
2. L298 `getGroupSizePosition(parents.children)` 改为 `getGroupSizePosition(freshChildNodes)`
3. L304-L319（shouldSkipGroupRecalc 分支）的 `parents.children.map(c => c.data.config.left + c.data.config.width)` 改为读 `freshChildNodes.map(c => c.data.config...)`
4. L322 `resetChildrenPosition(parents.children, { top, left })` 改为 `resetChildrenPosition(freshChildNodes, { top, left })`
5. L323 `setChildren(designerCanvas.components, parents.uniqueId, newChildren)` 保留（操作的是整树）

### 步骤 6：浏览器冒烟验证（问题 2a）

**前提**：`pnpm start` 已启动

1. 创建组，组内放 2 个组件（top 一上一下）
2. 选中组内 2 个组件 → 顶端对齐 → 组位置不跳变
3. 选中组内 2 个组件 → 左/右/水平居中/垂直居中 → 组位置不跳变
4. 顶层多选（非组内）→ 对齐 → 不受影响（回归）

### 步骤 7：浏览器冒烟验证（问题 2b + 问题 1）

1. 拖拽组内子组件向左移出原组边界 → 组尺寸应增长
2. 拖拽组内子组件向右移回原边界 → 组尺寸应缩小
3. 拖拽组本身移动 → 保存 → 后端 config 中组位置正确
4. 拖拽组内子组件 → 保存 → 后端 config 中子组件位置正确
5. 配置面板改 title → 保存 → 后端 config 中 title 正确（仅适用于 setComponents 路径不丢失的场景——见 §3.4 说明）
6. 存为模板 → 后端 config 中位置正确
7. 微应用嵌入场景（designer-scene-monitor）保存 → postMessage 数据中位置正确

### 步骤 8：TypeScript 校验

```bash
pnpm tsc --noEmit
```

要求：零新增错误。

---

## 5. 验证清单

### 问题 1（保存丢失）
- [ ] 拖拽移动顶层组件 → 保存 → 后端 config 中组件位置正确
- [ ] 拖拽移动组 → 保存 → 后端 config 中组位置正确
- [ ] 拖拽移动组内子组件 → 保存 → 后端 config 中子组件位置正确
- [ ] 配置面板修改 left/top → 保存 → 后端 config 中位置正确
- [ ] 配置面板修改 title → 保存 → 后端 config 中 title 正确
- [ ] 存为模板 → 后端 config 中所有字段正确
- [ ] 微应用嵌入场景保存 → postMessage 数据中位置正确

### 问题 2a（组内对齐组位置跳变）
- [ ] 选中组内 2 个元素 → 顶端对齐 → 组位置不跳变
- [ ] 选中组内 2 个元素 → 左/右/水平居中/垂直居中 → 组位置不跳变
- [ ] 顶层多选对齐不受影响（回归）
- [ ] 多个组嵌套 → 任意层对齐 → 各级组位置不跳变

### 问题 2b（拖拽组内子组件组尺寸不更新）
- [ ] 拖拽组内子组件向右下移出原边界 → 组尺寸正确增长
- [ ] 拖拽组内子组件向左上回到原边界 → 组尺寸正确缩小
- [ ] 拖拽组内子组件超出原组右下角 → 拖完后能选中组（不被裁切影响）

### 问题 3（§3.4：setComponents 覆盖字段级更新）
- [ ] 选中 ab 对齐 → 拖 b 到别处 → 选中 cd 对齐 → ab 保持对齐后状态（b 不恢复原状）
- [ ] 拖拽组件 → 成组 → 之前拖拽的位置不丢失
- [ ] 拖拽组件 → 锁定/隐藏 → 之前拖拽的位置不丢失
- [ ] 配置面板改 title → 对齐其他组件 → title 不丢失
- [ ] 配置面板改任意 config 字段 → 任意 setComponents 操作 → 字段不丢失

### 性能与类型
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 440 组件场景拖拽仍然流畅（手动验证，未引入全量重渲染）
- [ ] 保存耗时无明显增加（mergeByIdIntoTree O(n)，440 组件应 < 5ms）

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `mergeByIdIntoTree` 的 `byIdWins` 分支实现有 bug | 中 | 部分字段保存丢失或覆盖错乱 | 对照 byId 和 components 的 data 字段，单元测试各场景；先在 dev 环境手动验证 5 类典型字段（title / left / top / width / height / 自定义字段） |
| `recalcGroupBounds` 改读 byId 后性能下降 | 低 | 拖拽卡顿 | byId 查找 O(1)，subtree 通常很小（k < 50），整体可接受 |
| `getSaveableComponents` 遗漏某个保存路径 | 低 | 部分场景仍丢失 | 全量 grep `designerState.components` / `designerCanvas.components` / `state.components` 找序列化点，逐一替换 |
| `fieldPreserve` 合并方向有 bug | 中 | setComponents 后部分字段错乱 | dirtyConfigKeys 只记录 config 字段，非 config 字段仍走 nodeWins 逻辑；先在 dev 环境验证"ab 对齐 → 拖 b → cd 对齐"场景 |

### 回退方案

- 每个 §3 子任务独立 commit：step 2b / step 1.1+1.2 / step 1.3 / step 2a 验证独立可 revert
- 任何一步出问题 `git revert <commit>`

---

## 7. 延伸改进（不在本任务范围）

- **字段级更新架构一致性**：当前 updateFieldConfig 只改 byId 不改 tree 是 task-008 的 P6 优化。后果是所有 tree-reading 操作（recalcGroupBounds / handleAlign / save）都需要额外补偿。长期可考虑：
  - 方案 X：撤销 P6，updateFieldConfig 同步 tree（牺牲性能换一致性）
  - 方案 Y：把 tree 改为 derived（用 selector + memo 从 byId 算），state 只存 byId
  - 方案 Z：保持现状，封装"safe tree read"工具，统一处理 stale 问题（本任务走的就是这个思路，dirtyConfigKeys 是方案 Z 的具体实现）

  待后续 task 评估。

---

## 8. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建，承接 task-012-d 遗留的 2 个问题
- 2026-07-24：review 阶段发现 plan 初版三处不足：
  1. 问题 1 修复方案 A 的 `mergeByIdIntoTree` 方向反了（nodeWins vs byIdWins）
  2. 问题 1 漏了 2 个外部保存路径（saveAsTemp-modal、designer-scene-monitor）
  3. 问题 2 漏掉"拖拽组内子组件组尺寸不更新"的 bug，且 `mergeByIdIntoTree` 自身有改名丢失的注释/实现不一致 bug
- 2026-07-24：plan 重写完成，新增 §2b（拖拽组尺寸）、§3.3（mergeByIdIntoTree byIdWins 变体）、§3.4（改名丢失，留作后续 task）、§7（延伸改进）
- 2026-07-24：实施落地，5 个文件修改完成：
  - `src/designer/renderer/utils.ts`：扩展 `mergeByIdIntoTree` 增加 `direction` 参数（nodeWins / byIdWins），新增 `getSaveableComponents(state)` 工具函数
  - `src/designer/DesignerContent.tsx`：handleSave 用 `getSaveableComponents(designerState)` 序列化；recalcGroupBounds 用 byId 重算子组件 data（freshChildNodes）修问题 2b
  - `src/designer/canvas-graph/index.tsx`：handleAlign 加 try/finally 保护 skip 标志
  - `src/pages/designer-page/designer-scene-monitor/index.tsx`：onSave postMessage 用 getSaveableComponents
  - `src/designer/toolbar/comp/saveAsTemp-modal/index.tsx`：onFinish JSON.stringify 用 getSaveableComponents
- 2026-07-24：tsc --noEmit 校验，零新增错误（基线 10 个 packages/ui/src/material-selector 错误与本次修改无关）
- 2026-07-24：状态更新为 `in-progress`，等待浏览器手动验证（todo 9）
- 2026-07-24：用户报告新场景"ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状"，定位为 §3.4 同根因（setComponents 的 nodeWins 合并覆盖 byId 字段级更新）。决定在本任务一并修复 §3.4
- 2026-07-24：§3.4 实施落地（方案 J：dirtyConfigKeys + fieldPreserve），3 个文件修改完成：
  - `src/designer/renderer/utils.ts`：FlatField 加 `dirtyConfigKeys: Set<string>`；`buildIndex` 初始化为空 Set；`patchFieldConf` 记录 patch.config keys；`mergeByIdIntoTree` 新增 `fieldPreserve` 方向（对 dirtyConfigKeys 字段取 byId 值，其他取 node 值）
  - `src/store/modules/designer-canvas.ts`：`updateFieldConfig` reducer 记录 patch.config keys 到 dirtyConfigKeys；`setComponents` / `setState` reducer 从 `nodeWins` 改为 `fieldPreserve`
  - tsc --noEmit 校验，零新增错误（基线 10 个 packages/ui/src/material-selector 错误与本次修改无关）
  - 覆盖所有 setComponents / setState 调用点（handleAlign / recalcGroupBounds / layer-manager lock/visible / resize / 成组 / 拆组等），无需逐个调用点修