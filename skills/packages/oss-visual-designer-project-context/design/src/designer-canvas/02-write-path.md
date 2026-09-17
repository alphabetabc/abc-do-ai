# Designer Canvas 写路径（增删改）

> 配套 [00-overview.md](./00-overview.md) | 关注点：所有改变 state 的入口

***

## 0. 写路径总图

```
                       ┌──────────────────────────────┐
                       │      designerCanvas slice     │
                       │  ┌─────────────────────────┐ │
   ┌─── 增 ──────────► │  │ setComponents (newTree) │ │ 结构性变更
   │                   │  │   └ buildIndex          │ │
   │                   │  └─────────────────────────┘ │
   │                   │  ┌─────────────────────────┐ │
   ├─── 改（字段级）─► │  │ updateFieldConfig(id,   │ │ 字段级 O(depth) 改树
   │                   │  │   patch)                │ │   + O(n) buildIndex
   │                   │  └─────────────────────────┘ │
   │                   │  ┌─────────────────────────┐ │
   │                   │  │ setDesignerCanvasState  │ │ 旧兼容
   │                   │  └─────────────────────────┘ │
   │                   │  ┌─────────────────────────┐ │
   │                   │  │ record/del × 2 (runtime)│ │ runtime hook
   │                   │  └─────────────────────────┘ │
   └───────────────────┴──────────────────────────────┘
```

> **task-002（2026-07-28）单源 reducer 改造后**：
> - `setComponents`：删除 `mergeByIdIntoTree(fieldPreserve)` 调用，改为直接赋值 + buildIndex
> - `updateFieldConfig`：从"只 patch byId，不改 components 树"改为"Immer produce 改 components 树 + buildIndex 重建 byId/parentMap"
> - byId 从"可独立写入"变为"纯派生（只读）"，components 树永远 fresh
> - buildIndex 在 produce 外调用（避免 Immer proxy 破坏引用复用）

***

## 1. action 全表

文件：[`src/store/modules/designer-canvas.ts`](src/store/modules/designer-canvas.ts)

| # | action.type                             | 类别                                | 是否改 components | 是否改 byId            | 频率     | 调用方                                               |
| - | --------------------------------------- | --------------------------------- | -------------- | ------------------- | ------ | ------------------------------------------------- |
| 1 | `designerCanvas/setComponents`          | 结构性变更                             | ✅ 整树替换         | ✅ buildIndex 重建     | 低频     | layer-manager / 拖入新组件 / dropToGroup / handleAlign（task-002 改） |
| 2 | `designerCanvas/setState`               | 旧兼容（含 components 走 setComponents） | 视 payload      | 视 payload           | 低频     | DataProvider 兼容壳（已删） / 其他 setState 调用             |
| 3 | `designerCanvas/updateFieldConfig`      | **字段级更新（O(depth) 改树 + O(n) buildIndex）** | ✅ Immer produce 改树 | ✅ buildIndex 重建 | **高频** | onDragStop / 配置面板 onChange / 锁定隐藏按钮 |
| 4 | `designerCanvas/recordRealtimeDataFlow` | runtime                           | ❌              | ❌                   | 中频     | 数据获取配置面板                                          |
| 5 | `designerCanvas/deleteRealtimeDataFlow` | runtime                           | ❌              | ❌                   | 低频     | 删除组件                                              |
| 6 | `designerCanvas/recordCustomFieldsList` | runtime                           | ❌              | ❌                   | 低频     | 自定义字段配置                                           |
| 7 | `designerCanvas/deleteCustomFieldsList` | runtime                           | ❌              | ❌                   | 低频     | 删除组件                                              |
| 8 | `designerCanvas/clearRuntime`           | runtime                           | ❌              | ❌                   | 低频     | 场景切换                                              |

> **task-002（2026-07-28）单源 reducer 改造后变更项**：
> - `setComponents`：删除 `mergeByIdIntoTree(fieldPreserve)` 调用，直接 `draft.components = action.payload` + buildIndex；`handleAlign` 从串行 N 次 `updateFieldConfig` 改为 1 次 `setComponents`（方案 B）
> - `updateFieldConfig`：从"只 patch byId[id]，components 不变"改为"Immer produce 改 components 树中对应节点 + buildIndex 重建 byId/parentMap"
> - `setState`：删除 `mergeByIdIntoTree`；增加 byId/parentMap 直接赋值防护（`console.error` + 从 safePayload 删除）；`'components' in` 改为 `hasOwnProperty`

***

## 2. 结构性变更：setComponents / setState

### 2.1 调用约定

```ts
// 新（统一）
dispatch(setComponents(newTree));

// 旧兼容（payload 含 components）
dispatch(setDesignerCanvasState({ components: newTree, page: ... }));
```

### 2.2 reducer 内部流程（关键）

> **task-002（2026-07-28）单源 reducer 改造**：删除 `mergeByIdIntoTree(fieldPreserve)` 调用，改为"直接赋值 components + buildIndex 重建"。buildIndex 在 produce **外**调用——若在 produce 内调用，`draft.components` 是 Immer proxy，其 get trap 对对象属性递归包装，导致 `oldEntry.data === node.data` 永远 false（引用复用失效）。produce 外 `intermediate.components` 是真实对象，引用比较成立。

```ts
case 'designerCanvas/setComponents': {
    // task-002：直接赋值 + buildIndex（删除 mergeByIdIntoTree）
    const intermediate = produce(state, (draft) => {
        draft.components = action.payload;
    });
    // buildIndex 在 produce 外调用：传 state.byId（原始，非 proxy）用于引用复用
    const { byId, parentMap } = buildIndex(intermediate.components, state.byId);
    return { ...intermediate, byId, parentMap };
}
```

**关键点**：
- **components 树是单一真相源**：setComponents 直接赋值新树，byId/parentMap 全部由 buildIndex 从树派生
- **byId/parentMap 是纯派生（只读）**：reducer 不再允许直接赋值 byId/parentMap（setState 中有显式防护，见 §6）
- **buildIndex 引用复用**：`buildIndex(components, oldById)` 内部对未变 data 节点复用旧 byId 条目（`oldEntry.data === node.data` 时直接用 `oldEntry`），保持 `useFieldConf` 的 shallowEqual 订阅粒度
- **oldById 必须从 produce 外捕获**（`state.byId`），不能传 `draft.byId`（Immer proxy 破坏 `===` 比较）

**历史说明**（task-002 前的双源架构，已废弃，task-003 已删除 `mergeByIdIntoTree` 函数定义（2026-07-28））：

<details>
<summary>已废弃：为什么需要 mergeByIdIntoTree（双源架构历史）</summary>

- updateFieldConfig 只改 byId，不改 components → tree 是 stale
- setComponents 时如果直接用新树丢弃 byId → 之前的字段级更新全丢（如改名、拖拽位置）
- mergeByIdIntoTree 把 byId 的最新 data 合并到新树节点

**为什么用 `fieldPreserve` 而非 `nodeWins`**（task-012-1 §3.4）：

- `nodeWins` 让 tree 的旧值覆盖 byId 的字段级更新 → 拖拽后对齐会丢失拖拽位置
- `fieldPreserve` 用 `dirtyConfigKeys` 判断：仅对字段级更新过的字段取 byId 值，其他字段取 node 值
- 详见 §4.3

</details>

### 2.3 哪些操作走 setComponents

| 操作                | 文件                                     | 走什么 action    |
| ----------------- | -------------------------------------- | ------------- |
| 拖入新组件             | `designer-field/drag2layoutBlock`      | setComponents |
| 删除组件              | `layer-manager/delete`                 | setComponents |
| 成组                | `layer-manager/group` (generatorGroup) | setComponents |
| 拆组                | `layer-manager/group` (splitGroup)     | setComponents |
| 对齐                | `canvas-graph/handleAlign`             | setComponents（task-002 改：方案 B，1 次 dispatch） |
| 图层移动（置顶/置底/上移/下移） | `layer-manager/move`                   | setComponents |
| 复制                | `layer-manager/copy`                   | setComponents |
| 拖拽组件入布局组件         | `drag2layoutBlock`                     | setComponents |
| layers-tree 拖拽    | `useOnDrop`                            | setComponents |

**全部都是低频（用户操作）**。高频拖拽走 updateFieldConfig（§3）。

### 2.4 工具函数签名契约（task-012-c 变更）

成组 / 拆组 / 选中相关工具函数签名已扩展，直接读 `byId` / `parentMap`，O(1)：

| 函数 | 旧签名 | 新签名（task-012-c） | 说明 |
| --- | --- | --- | --- |
| `generatorGroup` | `(fields, selected, rootParent)` | `(fields, byId, parentMap, selected, rootParent)` | 成组：需要 byId 读节点 data，parentMap 判断层级 |
| `splitGroup` | `(fields, selected, rootParent)` | `(fields, byId, parentMap, selected, rootParent)` | 拆组：同上 |
| `getSelectedKeys` | `(fields, keys, parent)` | `(byId, parentMap, keys)` | 选中：直接读 `byId[parentMap[item]]?.uniqueId`，O(1)，不再递归 tree |

**关键**：这些函数不再接收 `fields`（components 树），而是接收 `byId` + `parentMap` 索引。调用方必须从 `store.getState().designerCanvas` 取 `byId` / `parentMap` 传入。

#### 2.4.1 签名决策边界（task-012-b vs task-012-c）

工具函数迁移到 `byId`/`parentMap` 时，**两类函数走了不同决策**：

| 类别 | 函数 | 决策 | 原因 |
| --- | --- | --- | --- |
| **成组/拆组/选中工具**（task-012-c） | `generatorGroup` / `splitGroup` / `getSelectedKeys` | **强制改签名**，接收 `byId`/`parentMap` | 这些函数被 `designer-field/utils.ts` 等多处调用，签名变更是为了消除内部对 `getParent` 的递归依赖，直接 O(1) 读索引 |
| **layer-manager 整体函数**（task-012-b） | `lock` / `visible` / `move` / `copy` / `delete` | **不强制改签名**，保持 `(state, selected, handle?)` | 调用方（`canvas-graph`、`DesignerContextMenu` 等 5 处）只需传 `state`，不关心 `byId`/`parentMap`；函数内部用 `store.getState().designerCanvas.byId`/`.parentMap` 访问，**保持调用方零改动** |

**为什么不统一改签名**：强制改 layer-manager 签名会连带改动 5 个调用方，回归风险高；而函数内部访问 `store.getState()` 是同步读（dispatch 后 store 已更新），不会引入 stale read 问题。溯源：[task-012-b §3.1](../../plans/done/task-2026-07-21-012-b-utils-cleanup.md) + [task-012-c §3.4](../../plans/done/task-2026-07-21-012-c-utils-cleanup.md)。

***

## 3. 字段级更新：updateFieldConfig

> **task-002（2026-07-28）单源 reducer 改造**：从"只 patch byId，components 树不变（O(1)）"改为"Immer produce 改 components 树中对应节点 + buildIndex 重建 byId/parentMap"。复杂度从 O(1) 变为 O(depth) 找路径 + O(n) buildIndex，但 byId 变为纯派生（只读），components 树永远 fresh，消除双源同步问题。订阅粒度由 buildIndex 引用复用保持（未变 data 节点复用旧 byId 条目）。

### 3.1 调用约定

```ts
const submitFieldConfig = useUpdateFieldConfig();
submitFieldConfig(uniqueId, { config: { left: 100, top: 200 } });
```

签名同原 `submitMergedConfig`，task-008 引入。

### 3.2 reducer 实现

```ts
case 'designerCanvas/updateFieldConfig': {
    const { uniqueId, patch } = action.payload;

    // 边界检查（produce 外）：根节点 / 不存在 / 空 patch 直接返回
    if (uniqueId === ROOT_UNIQUE_ID) return state;
    if (!state.parentMap[uniqueId]) return state;
    if (!patch || Object.keys(patch).length === 0) return state;

    // ⚠️ 关键：在 produce 外捕获旧 byId 引用（r1§1.2 修复）
    // 不能传 draft.byId（Immer proxy 会破坏 === 比较）
    const oldById = state.byId;
    let modified = false; // 标记 produce 内是否成功改树

    const intermediate = produce(state, (draft) => {
        // 1. parentMap 反向追踪找路径 O(depth)
        const path: string[] = [];
        let current: string = uniqueId;
        let depth = 0;
        const MAX_DEPTH = 100; // 10 倍冗余（440 组件场景实测最深 ≈ 10 层）
        while (current !== ROOT_UNIQUE_ID) {
            path.unshift(current);
            const next = draft.parentMap[current];
            if (!next) return; // parentMap 不一致：放弃本次更新
            if (++depth >= MAX_DEPTH) {
                console.error('[updateFieldConfig] 超过最大深度', MAX_DEPTH, 'uniqueId:', uniqueId);
                return;
            }
            current = next;
        }

        // 2. 沿路径找到节点 O(depth)
        // draft.components 是数组，不是带 children 的根节点
        let currentChildren: any[] = draft.components;
        let node: any = null;
        for (const id of path) {
            node = currentChildren?.find((c: any) => c.uniqueId === id) ?? null;
            if (!node) return; // 树与 parentMap 不一致：放弃
            currentChildren = node.children || [];
        }

        // 3. 修改节点 data（浅合并，与旧 patchFieldConf 语义一致）
        node.data = {
            ...node.data,
            ...patch,
            config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config,
        };
        modified = true;
    });

    // produce 内提前 return（parentMap/树不一致）：返回原 state
    if (!modified) return state;

    // 4. produce 外 buildIndex 重建 byId/parentMap O(n)，引用复用保持订阅粒度
    // ⚠️ 传入 oldById（原始 state.byId），不是 draft.byId
    const { byId, parentMap } = buildIndex(intermediate.components, oldById);
    return { ...intermediate, byId, parentMap };
}
```

**关键点**：
- **parentMap 反向追踪找路径 O(depth)**：从 `uniqueId` 沿 `parentMap` 向上追溯到根，得到路径数组
- **沿路径找到节点 O(depth)**：`draft.components` 是数组（不是带 children 的根节点），用 `currentChildren` 遍历
- **修改节点 data**：浅合并，与旧 `patchFieldConf` 语义一致
- **buildIndex 在 produce 外调用**：`intermediate.components` 是真实对象（非 Immer proxy），引用比较成立
- **引用复用**：`buildIndex(components, oldById)` 对未变 data 节点复用旧 byId 条目，保持 `useFieldConf` shallowEqual 订阅粒度
- **防御性编程**：parentMap 不一致 / 树与 parentMap 不一致 / 空 patch / 根节点 / 超过 MAX_DEPTH 全部静默返回（合法失败或调用方 bug 不崩溃）
- **`dirtyConfigKeys` 已删除（task-003，2026-07-28）**：单源后 byId 纯派生，FlatField 接口不再含 dirtyConfigKeys 字段

### 3.3 哪些操作走 updateFieldConfig

| 操作                  | 文件                                | 频率            |
| ------------------- | --------------------------------- | ------------- |
| 拖拽组件 onDragStop     | `designer-field/onDragStopHandle` | **高频**（拖拽结束时） |
| 拖拽组 onDragStop      | 同上                                | 中频            |
| 配置面板 onChange（任意字段） | 5 个 Formily 配置面板                  | **高频**        |
| 锁定按钮                | `layer-manager/lock`              | 低频            |
| 隐藏按钮                | `layer-manager/visible`           | 低频            |
| 配置面板 title          | `configuration-panel/component`   | 中频            |

> ⚠️ **task-002 变更**：`handleAlign`（对齐）从 `updateFieldConfig` 改回 `setComponents`（方案 B），因为单源后 `updateFieldConfig` 每次 buildIndex O(n)，N=440 串行对齐 = 75 秒灾难。对齐操作在闭包树上 `mergeFieldConfig` 累积改动 → 1 次 `setComponents`。

### 3.4 关键不变式

> **task-002 单源后**：`updateFieldConfig` 改 components 树中对应节点 + buildIndex 重建 byId/parentMap。**components 树永远 fresh，byId 纯派生（只读）**。

订阅粒度由 buildIndex 引用复用保持：未变 data 节点复用旧 byId 条目（`oldEntry.data === node.data` 时直接用 `oldEntry`），`useFieldConf` 的 shallowEqual 订阅不会误触发其他组件 re-render。

**历史不变式（task-002 前，已废弃）**：`byId[id]` 是 fresh 的，`components` 树对应节点是 stale。这是 P6 优化的设计：拖拽期间 1 次 dispatch 只改 byId，components 引用稳定，其他组件不 re-render。单源后此设计已被取代。

### 3.5 stale 风险（详见 [04-edge-cases.md](./04-edge-cases.md)）

> ✅ **task-002 单源后已消除**：components 树永远 fresh，byId 纯派生，不再有"读 components 树拿 stale 数据"的风险。以下为历史说明（双源架构时期）。

<details>
<summary>已废弃：双源架构下的 stale 风险（task-002 前）</summary>

任何"读 components 树"的操作都可能拿到 stale 数据：

| 操作                               | 风险                                | 防护                                      |
| -------------------------------- | --------------------------------- | --------------------------------------- |
| `recalcGroupBounds`              | 读 stale children → 组尺寸不更新         | 用 byId 重算 `freshChildNodes`（task-012-1） |
| 保存序列化                            | 读 stale config → 后端存旧值            | `getSaveableComponents`（task-012-1）     |
| `handleAlign`（旧 setComponents 方案） | mergeFieldConfig 输入 stale → 新树不准确 | **task-012-1 改走 updateFieldConfig，不再有此风险** |

**task-002 后的对应变化**：
- `recalcGroupBounds`：删除 `freshChildNodes` 包装（单源后 `parents.children` 已是最新值）+ 删除两步同步 + 删除 `shouldSkipGroupRecalc` 分支，简化为单次 `setComponents`
- 保存序列化：`getSaveableComponents` 仍调用 `mergeByIdIntoTree(byIdWins)`，但单源后 `state.components` 已是 fresh，`byIdWins` 实际是恒等操作（task-003 负责简化）
- `handleAlign`：改回 `setComponents`（方案 B），在闭包树上 `mergeFieldConfig` 累积改动 → 1 次 dispatch

</details>

***

## 4. mergeByIdIntoTree 合并语义（最复杂）

> ⚠️ **task-002（2026-07-28）后 reducer 不再调用 `mergeByIdIntoTree`**：
> - `setComponents` reducer：已删除 `mergeByIdIntoTree(fieldPreserve)` 调用，改为直接赋值 + buildIndex
> - `setState` reducer：已删除 `mergeByIdIntoTree(fieldPreserve)` 调用，改为直接赋值 + buildIndex
> - `updateFieldConfig` reducer：已改为 Immer produce 改树 + buildIndex，不再 patch byId（无需 mergeByIdIntoTree 合并）
>
> **task-003 已删除 `mergeByIdIntoTree` 函数定义和 `getSaveableComponents` 函数（2026-07-28）**。
>
> 以下内容为**历史参考**，保留以理解双源架构时期的决策。`dirtyConfigKeys` / `fieldPreserve` / `nodeWins` 方向均已在 reducer 中废弃（task-003 已删除函数定义和 `dirtyConfigKeys` 字段）。

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts) `mergeByIdIntoTree`

### 4.1 函数签名

```ts
export function mergeByIdIntoTree(
    components: any[],
    byId: Record<string, FlatField>,
    direction: 'nodeWins' | 'byIdWins' | 'fieldPreserve' = 'nodeWins',
): any[];
```

### 4.2 合并方向对比

| direction | node (tree) | byId | 适用场景 | 调用方 |
| --- | --- | --- | --- | --- |
| `'nodeWins'`（默认） | ✅ 赢 | 补充 | node 一定是 fresh 的场景（极少） | （无活跃调用方，保留兼容） |
| `'byIdWins'` | 补充 | ✅ 赢 | **save 路径**（tree 全 stale，byId 全 fresh） | `getSaveableComponents` |
| `'fieldPreserve'` | 操作字段赢 | 字段级更新字段赢 | **setComponents 路径**（task-012-1） | `designer-canvas.ts` 的 setComponents/setState reducer |

#### 4.2.1 为什么 setComponents 走 fieldPreserve（task-012-1 §3.4 决策原因）

**关键判断**：setComponents 路径的新树由 `mergeFieldConfig` 产出，基于 React 闭包 `components`。但 `updateFieldConfig`（拖拽等）只改 byId 不改 components 树，所以闭包可能是 stale 的——被字段级更新过的组件在树中是旧值。

**问题复现**（原 `nodeWins` 的 bug）：

```
1. 选中 ab 对齐 → setComponents(mergedTree) → byId 更新 ✓
2. 拖 b → updateFieldConfig(bId, {config:{left,top}}) → 只改 byId[b].data，components 树不变
3. 选中 cd 对齐 → handleAlign 里 `let results = components`（闭包，b 在树中是旧位置）
   → mergeFieldConfig(results, ...) 基于 stale 树改 cd
   → setComponents(results) → reducer mergeByIdIntoTree(results, byId, 'nodeWins')
   → 对 b 节点：nodeWins 让 node（stale）的旧 left/top 覆盖 byId 的新 left/top → b 位置丢失
```

**修复**（`fieldPreserve` 方向）：给 FlatField 加 `dirtyConfigKeys: Set<string>`，记录字段级更新过的 config 字段名。合并时对 `dirtyConfigKeys` 中的字段取 byId 值，其他字段取 node 值。

| 路径 | tree.data 状态 | byId.data 状态 | 选什么方向 | 原因 |
| --- | --- | --- | --- | --- |
| **setComponents** | operation 字段 fresh / 未触碰字段 stale | 字段级更新字段 fresh | **fieldPreserve** | dirtyConfigKeys 区分：字段级更新字段取 byId，operation 字段取 node |
| **save** | 全 stale | 全 fresh | **byIdWins** | tree 没有比 byId 更新的字段，byId 全赢 |

#### 4.2.2 fieldPreserve 的局限性与 handleAlign 迁移（task-012-1 续）

**`fieldPreserve` 无法处理的情况**：当 setComponents 的 operation 也修改了 `dirtyConfigKeys` 中记录的字段时，`fieldPreserve` 误用 byId 旧值覆盖 operation 的新值。

**复现场景**：

```
1. 拖组内组件 a → updateFieldConfig(aId, {config:{left:100}}) → a.dirtyConfigKeys = {'left'}
2. 选中 ab 点击左对齐 → mergeFieldConfig 改 a.left=0 → setComponents(mergedTree)
3. reducer fieldPreserve：
   a 的 dirtyConfigKeys 含 'left' → 取 byId 的 left=100 → 覆盖对齐后的 left=0
   → 对齐不生效！
```

**根因**：`dirtyConfigKeys` 只记录"字段级更新过"这一事实，无法区分"字段级更新"与"setComponents operation 也改了同名字段"。

**修复**：`handleAlign` 从 `setComponents` + `mergeFieldConfig` 改为 `updateFieldConfig`：
- 对齐只改 `config.left`/`config.top`，是纯字段级更新，走 `updateFieldConfig` 天然正确
- `updateFieldConfig` 直接改 byId，不涉及 `mergeByIdIntoTree`，无覆盖风险
- `recalcGroupBounds` 读 byId 拿到对齐后位置，`fieldPreserve` 在后续 `setComponents` 时保护 byId 值（此时 byId 已是对齐后的）
- 移除了不再需要的 `beginSkipGroupRecalc`/`endSkipGroupRecalc` 逻辑

**设计启示**：`fieldPreserve` 是 setComponents 路径的"安全网"，能处理大部分 stale 闭包场景。但如果 operation 本身也改了 `dirtyConfigKeys` 中的字段，就会冲突。**根本解法是让只改 config 字段的操作走 `updateFieldConfig` 而非 `setComponents`**，从源头避免合并冲突。

### 4.3 fieldPreserve 语义详解（task-012-1 §3.4）

```ts
// 以 node.data 为基础（保留本次操作），config 中 dirtyConfigKeys 字段用 byId 值覆盖
newData = { ...flat.data, ...node.data };
if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
    newData.config = { ...flat.data.config, ...node.data.config };
    // dirtyConfigKeys 中的字段：用 byId 的值覆盖（保留字段级更新）
    if (flat.dirtyConfigKeys && flat.dirtyConfigKeys.size > 0) {
        flat.dirtyConfigKeys.forEach((key) => {
            if (key in flat.data.config) {
                newData.config[key] = flat.data.config[key];
            }
        });
    }
}
```

**dirtyConfigKeys 生命周期**：

| 时机 | 操作 | 在哪里 |
| --- | --- | --- |
| `buildIndex` 创建 FlatField | `dirtyConfigKeys: new Set()`（空） | `utils.ts` buildIndex |
| `updateFieldConfig` patch.config | `dirtyConfigKeys.add(key)` 累加 | `designer-canvas.ts` reducer |
| `patchFieldConf` patch.config | 同上 | `utils.ts` patchFieldConf |
| `setComponents` / `setState` 后 buildIndex | 重置为空 Set（字段级更新已合并到树） | `designer-canvas.ts` reducer |

**为什么不用 `nodeWins` + 引用差异判断**（task-012-1 §3.4 排除的方案）：

- `mergeFieldConfig` 用 `deepMergeObj` 递归合并，产出的 `node.data.config` 是"本次操作字段(新) + 旧字段"的混合体
- `updateFieldConfig` 产出的 `byId.data.config` 是"字段级更新字段(新) + 旧字段"的混合体
- 两者都是"部分新+部分旧"，无法通过引用差异区分具体哪个字段是新的
- `dirtyConfigKeys` 显式记录字段名，语义清晰

### 4.4 byIdWins 语义详解

```ts
const newData = { ...node.data, ...flat.data };  // byId 全赢
if (flat.data.config && node.data.config && flat.data.config !== node.data.config) {
    newData.config = { ...node.data.config, ...flat.data.config };
}
```

适用于 save：tree 全 stale（没经历过 setComponents），byId 全 fresh（有所有 updateFieldConfig 的累计更新）。

### 4.5 调用方对照表

> ⚠️ task-002 后 reducer 调用方已全部废弃；task-003 已删除 `getSaveableComponents`，`mergeByIdIntoTree` 无任何活跃调用方。

| 调用方 | 方向 | 状态 | 理由 |
| --- | --- | --- | --- |
| `designer-canvas.ts` setComponents reducer | `fieldPreserve` | ❌ **已废弃（task-002）** | 单源后直接赋值 + buildIndex，无需合并 |
| `designer-canvas.ts` setState reducer（含 components） | `fieldPreserve` | ❌ **已废弃（task-002）** | 同上 |
| `getSaveableComponents` | `byIdWins` | ❌ **已删除（task-003）** | 单源后保存直接序列化 components |

***

## 5. runtime hook action（4 个）

文件：[`src/store/modules/designer-canvas.ts`](src/store/modules/designer-canvas.ts)

| action                                       | 用途           | 调用方      |
| -------------------------------------------- | ------------ | -------- |
| `recordRealtimeDataFlow(uniqueId, sourceId)` | 注册组件的实时数据源   | 数据获取配置面板 |
| `deleteRealtimeDataFlow(uniqueId)`           | 删除组件时清理      | 删除组件     |
| `recordCustomFieldsList(uniqueId, setting)`  | 注册组件的自定义字段列表 | 自定义字段配置  |
| `deleteCustomFieldsList(uniqueId)`           | 删除组件时清理      | 删除组件     |

**封装 hook**（[src/store/designer/hooks.ts](src/store/designer/hooks.ts)）：

| hook                    | 方法                                                              | 用途            |
| ----------------------- | --------------------------------------------------------------- | ------------- |
| `useRealtimeDataFlow()` | `get(uniqueId)` / `record(uniqueId, sourceId)`                  | 组件读取 + 配置面板写入 |
| `useCustomFieldsList()` | `get(uniqueId)` / `record(uniqueId, setting)` / `del(uniqueId)` | 同上            |

**关键约束**：

- `record` 在 `enable === false` 时走 delete（task-011 fix 注释明确）
- 写路径都是 O(1)，不会触发组件级 re-render（runtime 状态独立）

***

## 6. setDesignerCanvasState（setState 兼容）

旧 `useDesigner().setState({ components: newTree, page: ... })` 的兼容壳：

> **task-002（2026-07-28）单源 reducer 改造**：
> - 删除 `mergeByIdIntoTree(fieldPreserve)` 调用，含 components 时直接赋值 + buildIndex
> - 修 `'components' in` 隐 bug（`'in'` 会遍历原型链，改用 `Object.prototype.hasOwnProperty.call`）
> - 增加 byId/parentMap 直接赋值防护：检测到 `byId`/`parentMap` 在 payload 中时 `console.error` + 从 safePayload 中删除（不 throw，避免边缘场景崩溃）
> - buildIndex 在 produce 外调用（同 setComponents，避免 Immer proxy 破坏引用复用）

- payload 含 `components` 走 setComponents 路径（直接赋值 + buildIndex）
- 其他字段走 Immer `Object.assign(draft, safePayload)`（safePayload 已过滤 byId/parentMap）

**当前活跃调用方**（grep `setDesignerCanvasState` 验证）：

| 文件                                                                                        | 行    | 用途                                                | payload                                                |
| ----------------------------------------------------------------------------------------- | ---- | ------------------------------------------------- | ------------------------------------------------------ |
| [DesignerContent.tsx](src/designer/DesignerContent.tsx#L163)                              | L163 | refreshData 时（不含 components 字段）                   | `{ ...rest }`                                          |
| [DesignerContent.tsx](src/designer/DesignerContent.tsx#L166)                              | L166 | refreshData 时（含 components 字段，走 setComponents 路径） | `{ ...nextState }`                                     |
| [configuration-panel/page/index.jsx](src/designer/configuration-panel/page/index.jsx#L28) | L28  | 页面级配置修改                                           | `{ page: realValue }`                                  |
| [configuration-panel/page/index.jsx](src/designer/configuration-panel/page/index.jsx#L37) | L37  | pageSize polyfill 兜底                              | `{ page: { ...page, pageSize } }`                      |
| [toolbar/index.js](src/designer/toolbar/index.js#L85)                                     | L85  | designerType / currentMaterialItem 等 UI 状态        | UI 状态                                                  |
| [toolbar/index.js](src/designer/toolbar/index.js#L367)                                    | L367 | 后端 config 加载                                      | `{ page: config.page, components: config.components }` |

**已删**：`DataProvider.tsx`（task-011 删除）

***

## 7. 写路径原则

| 原则                                              | 说明                                      |
| ----------------------------------------------- | --------------------------------------- |
| **结构性变更走 setComponents**                        | 拖入/删除/成组/拆组/移动/复制/对齐（task-002 改） 全部走 setComponents  |
| **字段级更新走 updateFieldConfig**                    | 拖拽位置/配置面板改任意字段 走 updateFieldConfig（O(depth) 改树 + O(n) buildIndex，task-002 单源后） |
| **runtime hooks 走 4 个专用 action**                | 不污染 components / byId                   |
| **绝不直接 mutation state**                         | Immer frozen，mutation 抛 TypeError       |
| **绝不在 reducer 外用 buildIndex 修改 byId/parentMap** | 仅 reducer 内 buildIndex 重建，外部修改会破坏同步     |
| **byId/parentMap 是纯派生（只读）**（task-002） | 不允许通过 setState 直接赋值 byId/parentMap，reducer 会 console.error 并过滤 |

***

## 8. 写路径决策树（新增 action 时用）

```
Q: 这次变更是否影响 components 树结构（父子关系/顺序）？
├─ 是 → setComponents
└─ 否 → Q: 是否只改某个组件的 data？
        ├─ 是 → updateFieldConfig
        └─ 否 → Q: 是否改 page / meta / appScopeId？
                ├─ 是 → setDesignerCanvasState
                └─ 否 → Q: 是否 runtime hook？
                        ├─ 是 → 4 个专用 action
                        └─ 否 → 重新考虑，可能需要新 action
```

***

## 9. 易错点

| 易错                                                                      | 后果                                                                    | 怎么避免                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| 在 setComponents 后立即读 `byId`（不用 `useFieldConf`）                          | 拿到旧的（reducer 内 buildIndex 后是新值，但 useSelector 还没触发）                    | setComponents 后用 `useStore().getState()` 同步读 |
| 把 `updateFieldConfig` 用在结构变更                                            | ~~tree 不更新，后续 setComponents 的 buildIndex 用 stale data~~（task-002 后 tree 会更新，但语义错误：updateFieldConfig 走 parentMap 反向追踪找路径，不适合父子关系/顺序变更） | 严格区分：结构变更走 setComponents |
| ~~`mergeByIdIntoTree` 方向用错~~（task-002 后 reducer 不再调用） | ~~setComponents 路径用 byIdWins → 字段级更新覆盖 tree 新值；save 路径用 nodeWins → 保存旧值；setComponents 路径用 nodeWins → 字段级更新被 tree 旧值覆盖~~ | **已不适用**（reducer 已删除 mergeByIdIntoTree 调用，getSaveableComponents 也已由 task-003 删除，函数定义已不存在） |
| mutation `state.designerCanvas.components.push(...)`                    | Immer frozen 抛 TypeError                                              | 所有改走 dispatch                                |
| 改 byId 时绕过 reducer                                                      | 双源同步破坏                                                                | 仅 reducer 内 buildIndex                       |
| ~~`setDesignerCanvasState({ components: newTree })` 不经过 mergeByIdIntoTree~~（task-002 后已不适用） | ~~字段级更新丢失~~ | **已不适用**（task-002 后 setState reducer 已删除 mergeByIdIntoTree，含 components 时直接赋值 + buildIndex；byId/parentMap 直接赋值会被防护过滤） |
| ~~只改 config 字段的操作走 setComponents（如对齐）~~（task-002 后已不适用） | ~~`fieldPreserve` 的 `dirtyConfigKeys` 误用 byId 旧值覆盖 operation 新值~~ | **已不适用**（task-002 后 reducer 不再调用 mergeByIdIntoTree/fieldPreserve；对齐已改回 setComponents 方案 B，单源后 components 树永远 fresh 无合并冲突） |
| 通过 setState 直接赋值 byId/parentMap（task-002 新增风险） | 破坏单源原则：byId 与 components 树不一致 | reducer 已防护：console.error + 从 safePayload 删除 |

