# 02 — 框架写路径：setTree / updateNode / setPartialState + 派生索引重建

> 状态：`阶段 4 产出，待 review（A+B 双视角）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §2（三条写路径 reducer 契约 + 边界降级）
> 对照标准：[00-overview.md](./00-overview.md) §5.4-5.7 API 契约签名草案
> 当前项目权威：[design/src/designer-state/02-write-path.md](skills/oss-visual-designer-project-context/src/designer-state/02-write-path.md)

---

## 0. 文档定位与 review 标准

本文档定义 designer-core 框架的**三条写路径**：`setTree`（结构性变更）、`updateNode`（字段级更新）、`setPartialState`（批量更新），包含完整契约、边界降级、派生索引重建机制，以及与当前项目三个 reducer 的逐条对照。

**review 标准（task §1.1 阶段 4，A+B 双视角）**：
- **视角 A 事实核查**：每条契约对照当前源码验证（reducer 行号 + 边界条件）；边界行为逐条对照
- **视角 B 逻辑审查**：覆盖当前 25 bug 契约；vanilla Zustand 实现路径合理；与 00-overview.md §5 签名草案 + 01-data-model.md 类型定义一致

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。

---

## 1. 三条写路径速查

| 写路径 | 框架 API | 适用场景 | 是否改 components | 是否重建 byId | 对应当前 API |
| --- | --- | --- | --- | --- | --- |
| **结构性变更** | `setTree` | 拖入/删除/成组/拆组/移动/对齐/复制粘贴/导入 | ✅ 直接赋值 | ✅ buildIndex | `setComponents` |
| **字段级更新** | `updateNode` | 配置面板 onChange / 拖拽 onDragStop / 锁定隐藏 | ✅ 不可变改树 | ✅ buildIndex（引用复用） | `updateFieldConfig` |
| **批量更新** | `setPartialState` | 初始化 / 批量字段 + 可含结构性 | ✅（含 components 时） | ✅（含 components 时） | `setDesignerCanvasState` |

> 单源架构下 `updateNode` 也改 `components` 树，components 永远 fresh，无 stale tree 问题（fact-extraction §2.3）。

---

## 2. setTree（结构性变更）

### 2.1 签名

```ts
/**
 * 结构性变更：整树替换 components + 重建派生索引
 *
 * 对应当前项目 setComponents（designer-canvas.ts L68-80）
 */
function setTree(components: TNode[]): void;
```

### 2.2 契约（对照 fact-extraction §2.2 + 00-overview.md §5.5）

1. **直接赋值**（不克隆、不合并、不 mergeByIdIntoTree）：`components` 参数直接成为新真相源
2. **触发 buildIndex 重建** byId/parentMap（对照 designer-canvas.ts L78）
3. **oldById 从 set 外捕获**：`const oldById = get().byId`（对照 designer-canvas.ts L78 `state.byId`），用于引用复用
4. **空树防护**：`components` 为 undefined/空数组 → buildIndex 内 `|| []` 防护得空索引（对照 utils.ts L672/L695）。**业务级空数组防护由调用方负责**（fact-extraction §2.2：DesignerContent.tsx setState wrapper 检测 `_.isEmpty(components)` 补 realtimeDataFlow/customFieldsListMapping）
5. **仅在结构性变更用**：拖拽 onDragStop / 成组/拆组/复制粘贴/导入/删除/对齐

### 2.3 vanilla Zustand 实现草案

```ts
// 框架 setTree 实现（vanilla Zustand）
const setTree = (components: TNode[]) => {
    const oldById = get().byId;  // set 外捕获，用于引用复用
    set((state) => {
        const { byId, parentMap } = buildIndex(components, oldById);
        return { ...state, components, byId, parentMap };
    });
};
```

**与当前的差异**（fact-extraction §1.4 + §8 约束 3）：
- 当前：`produce(state, draft => { draft.components = payload })` → produce 外 `buildIndex`
- 框架：vanilla set 内直接赋值 + buildIndex（无 Immer proxy，引用比较成立）

### 2.4 边界降级

| 边界 | 当前行为 | 框架行为 | 事实依据 |
| --- | --- | --- | --- |
| `components === undefined` | buildIndex 内 `walk(undefined \|\| [], ROOT_ID)` 空树处理 | 同（框架保留 `\|\| []` 防护） | utils.ts L672/L695 |
| `components === []` | buildIndex 得空 byId/parentMap | 同 | utils.ts L672/L695 |
| 节点无 `uniqueId` | `if (!node \|\| !node.uniqueId) continue` 跳过 | 同 | utils.ts L673 |
| 节点无 `children` | `if (Array.isArray(node.children) && ...)` 不遍历 | 同 | utils.ts L689 |

---

## 3. updateNode（字段级更新）

### 3.1 签名

```ts
/**
 * 字段级更新：沿 parentMap 反向追踪路径，不可变修改节点 data + 重建索引
 *
 * 对应当前项目 updateFieldConfig（designer-canvas.ts L117-178）
 */
interface UpdateNodePatch {
    [key: string]: any;
    /**
     * 二次浅合并字段由 CreateTreeStoreOptions.deepMergeKeys 配置
     * （框架不感知业务字段名）
     */
}

function updateNode(id: string, patch: UpdateNodePatch): void;
```

### 3.2 契约（对照 fact-extraction §2.3 + 00-overview.md §5.4）

#### 3.2.1 边界降级（produce/set 外，对照 designer-canvas.ts L130-132）

| # | 边界条件 | 行为 | 事实依据 |
| --- | --- | --- | --- |
| 1 | `id === ROOT_ID` | no-op（根节点不可字段更新） | designer-canvas.ts L130 |
| 2 | `!parentMap[id]` | no-op（id 不存在于 parentMap） | designer-canvas.ts L131 |
| 3 | `!patch \|\| Object.keys(patch).length === 0` | no-op（空 patch） | designer-canvas.ts L132 |

#### 3.2.2 produce/set 内额外降级（对照 designer-canvas.ts L146-159）

| # | 边界条件 | 行为 | 事实依据 |
| --- | --- | --- | --- |
| 4 | parentMap 反向追踪时 `parentMap[current]` 为 falsy | 放弃更新（modified 保持 false） | designer-canvas.ts L146 |
| 5 | 反向追踪深度超过 `MAX_DEPTH = 100` | `console.error` + 放弃更新 | designer-canvas.ts L147-150 |
| 6 | 沿路径 find 不到节点（树与 parentMap 不一致） | 放弃更新（modified 保持 false） | designer-canvas.ts L159 |

> 边界 4/6 触发时 `modified` 保持 false，produce 后 `if (!modified) return state`（L173），返回原 state。

#### 3.2.3 路径查找（parentMap 反向追踪 O(depth)）

```ts
// 对照 designer-canvas.ts L139-152
const path: string[] = [];
let current: string = id;
let depth = 0;
const MAX_DEPTH = 100; // 10 倍冗余（440 组件场景实测最深 ≈ 10 层）
while (current !== ROOT_ID) {
    path.unshift(current);
    const next = parentMap[current];
    if (!next) return; // 边界 4：parentMap 不一致
    if (++depth >= MAX_DEPTH) {
        console.error('[updateNode] 超过最大深度', MAX_DEPTH, 'id:', id);
        return; // 边界 5
    }
    current = next;
}
```

#### 3.2.4 沿路径 find 节点（O(depth)）

```ts
// 对照 designer-canvas.ts L155-161
let currentChildren: TNode[] = components;
let node: TNode | null = null;
for (const pathId of path) {
    node = currentChildren?.find((c) => c.uniqueId === pathId) ?? null;
    if (!node) return; // 边界 6：树与 parentMap 不一致
    currentChildren = node.children || [];
}
```

#### 3.2.5 不可变修改节点 data（顶层浅合并 + deepMergeKeys 字段二次浅合并）

```ts
// 对照 designer-canvas.ts L164-168（已改：去除 config 硬编码，改由 CreateTreeStoreOptions.deepMergeKeys 配置）
const newData = { ...targetNode.data, ...patch };
for (const key of deepMergeKeys) {
    if (patch[key] === undefined) {
        // patch[key]=undefined 视为"不改"，还原为目标节点原值（保留原语义）
        newData[key] = targetNode.data[key];
    } else if (
        patch[key] != null &&
        typeof targetNode.data[key] === 'object' &&
        targetNode.data[key] !== null
    ) {
        newData[key] = { ...targetNode.data[key], ...patch[key] };
    }
}
node.data = newData;
```

**契约**：
- 顶层浅合并：`patch` 的顶层字段覆盖 `node.data` 同名字段（始终生效）
- `deepMergeKeys` 字段二次浅合并：仅当 `data[key]` 与 `patch[key]` 都为对象时触发；任一为 null/非对象则安全跳过（保持 patch 覆盖语义）
- `deepMergeKeys` 字段 `patch[key] === undefined`：视为"不改"，保留 `data[key]` 原值（避免顶层 spread 用 undefined 误覆盖）
- 框架不感知任何业务字段名：`deepMergeKeys` 列表由调用方传入，业务字段（如 `config`）的预设归业务层（designer-plugins 层 task-006 预设 `['config']`）
- 不可变更新：`node.data` 是新引用（触发 buildIndex 引用复用的"不复用"分支）

#### 3.2.6 buildIndex 重建（引用复用保持订阅粒度）

```ts
// 对照 designer-canvas.ts L176-177
const oldById = get().byId; // set 外捕获
const { byId, parentMap } = buildIndex(newComponents, oldById);
```

**引用复用逻辑**（fact-extraction §1.5）：
- 修改过的节点 `node.data` 是新引用 → `oldEntry.data !== node.data` → 不复用，创建新 byId 条目
- 未修改节点经不可变更新保留原 data 引用 → `oldEntry.data === node.data` → 复用旧 byId 条目 → `useNode` shallowEqual 命中 → 跳过 re-render

### 3.3 vanilla Zustand 实现草案

```ts
// 框架 updateNode 实现（vanilla Zustand）
const updateNode = (id: string, patch: UpdateNodePatch) => {
    const state = get();

    // 边界检查 1-3（set 外）
    if (id === ROOT_ID) return;
    if (!state.parentMap[id]) return;
    if (!patch || Object.keys(patch).length === 0) return;

    const oldById = state.byId; // set 外捕获
    let modified = false;

    // 不可变更新：沿路径浅拷贝到目标节点
    const newComponents = updateNodeImmutable(
        state.components,
        state.parentMap,
        id,
        patch,
        deepMergeKeys, // ← CreateTreeStoreOptions 注入，框架不感知业务字段
        () => { modified = true; },
    );

    if (!modified) return; // 边界 4/5/6

    // buildIndex 重建（引用复用）
    const { byId, parentMap } = buildIndex(newComponents, oldById);
    set({ components: newComponents, byId, parentMap });
};

// 辅助：不可变路径更新（替代 Immer produce）
function updateNodeImmutable<TNode extends TreeNode>(
    components: TNode[],
    parentMap: Record<string, string>,
    id: string,
    patch: UpdateNodePatch,
    deepMergeKeys: string[], // ← 二次浅合并字段列表（业务字段，框架不感知）
    markModified: () => void,
): TNode[] {
    // 1. parentMap 反向追踪路径（边界 4/5/6 见 §3.2.3-3.2.4）
    const path: string[] = [];
    let current = id;
    let depth = 0;
    const MAX_DEPTH = 100;
    while (current !== ROOT_ID) {
        path.unshift(current);
        const next = parentMap[current];
        if (!next) return components; // 边界 4：parentMap 不一致
        if (++depth >= MAX_DEPTH) return components; // 边界 5
        current = next;
    }

    // 2. 沿路径浅拷贝到目标节点（不可变更新）
    //    未改分支保留原引用 → buildIndex 引用复用成立
    const cloneAlongPath = (nodes: TNode[], pathIndex: number): TNode[] => {
        if (pathIndex >= path.length) return nodes;
        const targetId = path[pathIndex];
        const idx = nodes.findIndex((n) => n.uniqueId === targetId);
        if (idx === -1) return nodes; // 边界 6：树与 parentMap 不一致

        const targetNode = nodes[idx];
        let newChildren = targetNode.children || [];

        if (pathIndex === path.length - 1) {
            // 目标节点：顶层浅合并 + deepMergeKeys 字段二次浅合并
            markModified();
            const newData: Record<string, any> = { ...targetNode.data, ...patch };
            for (const key of deepMergeKeys) {
                if (patch[key] === undefined) {
                    newData[key] = targetNode.data[key]; // patch "不改" 语义
                } else if (
                    patch[key] != null &&
                    typeof targetNode.data[key] === 'object' &&
                    targetNode.data[key] !== null
                ) {
                    newData[key] = { ...targetNode.data[key], ...patch[key] };
                }
            }
            return nodes.map((n, i) =>
                i === idx ? { ...n, data: newData } : n,
            );
        }

        // 中间节点：递归浅拷贝 children
        newChildren = cloneAlongPath(newChildren, pathIndex + 1);
        return nodes.map((n, i) =>
            i === idx ? { ...n, children: newChildren } : n,
        );
    };

    return cloneAlongPath(components, 0);
}
```

**与当前的差异**：
- 当前：Immer `produce` 内改树（proxy 自动追踪修改 + 结构共享）
- 框架：手动不可变更新（沿路径浅拷贝到目标节点，未改分支保留原引用）
- **引用复用契约不变**：两种方式都保证未修改节点的 `data` 引用不变

### 3.4 拖拽 onChange 约定

task §1.1 阶段 4 约定：**拖拽 onChange 一律走 `updateNode`**，`setTree` 只在 onDragStop / 结构性变更用。

理由（对照 fact-extraction §2.3 + 02-write-path.md §0）：
- onChange 高频（60+/s），`updateNode` 只改单节点 data + buildIndex 引用复用，订阅粒度最优
- `setTree` 整树替换 + 全量 buildIndex，onChange 频率下性能差
- onDragStop 是低频结构性终点，走 `setTree` 确保最终状态一致

---

## 4. setPartialState（批量更新）

### 4.1 签名

```ts
/**
 * 批量更新：浅合并 state + byId/parentMap 防护 + 含 components 时重建索引
 *
 * 对应当前项目 setDesignerCanvasState（designer-canvas.ts L81-110）
 */
function setPartialState(payload: Partial<TreeStoreState<TNode, TFlat, TExtra>>): void;
```

### 4.2 契约（对照 fact-extraction §2.4 + 00-overview.md §5.7）

#### 4.2.1 浅合并语义

`Object.assign` 语义：payload 的字段覆盖 state 同名字段（对照 designer-canvas.ts L102）。

#### 4.2.2 byId/parentMap 防护（P0 测试，框架用 hasOwnProperty 修正）

```ts
// 对照 designer-canvas.ts L91-99（框架修正 'in' → hasOwnProperty）
const hasById = Object.prototype.hasOwnProperty.call(payload, 'byId');
const hasParentMap = Object.prototype.hasOwnProperty.call(payload, 'parentMap');
if (hasById || hasParentMap) {
    console.error('[setPartialState] byId/parentMap 不能直接设置，单源架构下应由 buildIndex 派生');
}

const safePayload = { ...payload };
delete safePayload.byId;
delete safePayload.parentMap;
```

**⚠️ 隐 bug 修正**（fact-extraction §1.3 + §8 约束 2）：
- 当前用 `'in'` 操作符（遍历原型链），框架改用 `hasOwnProperty`（只查自身属性）
- `hasComponents` 当前已用 `hasOwnProperty`（designer-canvas.ts L95），框架统一为 hasOwnProperty

#### 4.2.3 含 components 时重建索引

```ts
// 对照 designer-canvas.ts L95, L105-108
const hasComponents = Object.prototype.hasOwnProperty.call(payload, 'components');
// ... Object.assign ...
if (hasComponents) {
    const oldById = get().byId; // set 外捕获
    const { byId, parentMap } = buildIndex(newState.components, oldById);
    return { ...newState, byId, parentMap };
}
return newState; // 不含 components → byId/parentMap 保持原引用不变
```

#### 4.2.4 防护性质

- **键存在性防护**，不检查 `payload.byId === state.byId` 引用是否一致
- 只要外部试图通过 setPartialState 传 byId（无论引用是否相同），都会被 console.error + 删除
- **不 throw**（避免边缘场景崩溃，对照 designer-canvas.ts L93 注释）

### 4.3 vanilla Zustand 实现草案

```ts
// 框架 setPartialState 实现（vanilla Zustand）
const setPartialState = (payload: Partial<TreeStoreState<TNode, TFlat, TExtra>>) => {
    // byId/parentMap 防护（hasOwnProperty）
    const hasById = Object.prototype.hasOwnProperty.call(payload, 'byId');
    const hasParentMap = Object.prototype.hasOwnProperty.call(payload, 'parentMap');
    if (hasById || hasParentMap) {
        console.error('[setPartialState] byId/parentMap 不能直接设置，单源架构下应由 buildIndex 派生');
    }

    const safePayload = { ...payload };
    delete safePayload.byId;
    delete safePayload.parentMap;

    const hasComponents = Object.prototype.hasOwnProperty.call(payload, 'components');

    if (hasComponents) {
        const oldById = get().byId; // set 外捕获
        set((state) => {
            const newState = { ...state, ...safePayload };
            const { byId, parentMap } = buildIndex(newState.components, oldById);
            return { ...newState, byId, parentMap };
        });
    } else {
        set((state) => ({ ...state, ...safePayload }));
    }
};
```

### 4.4 边界降级

| 边界 | 当前行为 | 框架行为 | 事实依据 |
| --- | --- | --- | --- |
| `payload === undefined` | `'byId' in undefined` 抛 TypeError（依赖调用方约束） | 框架加 `if (!payload) return` 防护 | designer-canvas.ts L91（无显式防护） |
| payload 含 byId | `'in'` 检测 + console.error + 删除 | `hasOwnProperty` 检测 + console.error + 删除 | designer-canvas.ts L91-99 |
| payload 含 parentMap | 同上 | 同上 | designer-canvas.ts L91-99 |
| payload 含 components | `hasComponents` → buildIndex 重建 | 同 | designer-canvas.ts L95, L105-108 |
| payload 不含 components | byId/parentMap 保持原引用不变 | 同 | designer-canvas.ts L109 |

---

## 5. 派生索引重建机制

### 5.1 重建触发点

| 写路径 | 是否重建 byId/parentMap | oldById 来源 | 事实依据 |
| --- | --- | --- | --- |
| `setTree` | ✅ 总是重建 | `get().byId`（set 外） | designer-canvas.ts L78 |
| `updateNode` | ✅ 总是重建 | `get().byId`（set 外） | designer-canvas.ts L134, L176 |
| `setPartialState`（含 components） | ✅ 重建 | `get().byId`（set 外） | designer-canvas.ts L106 |
| `setPartialState`（不含 components） | ❌ 不重建，保持原引用 | — | designer-canvas.ts L109 |

### 5.2 oldById 捕获约束（fact-extraction §8 约束 3）

**关键约束**：`oldById` 必须从 set 回调外捕获（`get().byId`），不能传 set 内的 `state.byId`。

理由：
- 当前 Redux+Immer：produce 外 `state.byId` 是原始对象，produce 内 `draft.byId` 是 Immer proxy，`oldEntry.data === node.data` 永远 false
- 框架 vanilla Zustand：set 回调内的 `state` 是新对象，`state.byId` 是新 byId（尚未重建），传给 buildIndex 会导致引用复用失效
- 正确做法：set 外 `const oldById = get().byId`，传入 buildIndex

### 5.3 buildIndex 引用复用算法（不变，详见 01-data-model.md §3.2）

```ts
const oldEntry = oldById?.[node.uniqueId];
byId[node.uniqueId] =
    oldEntry && oldEntry.data === node.data  // 引用比较
        ? oldEntry  // 复用旧条目
        : { uniqueId: node.uniqueId, type: node.type, parentId, data: node.data };
```

---

## 6. 写路径决策树（框架版）

```
要改 state？
├─ 结构性变更（拖入/删除/成组/拆组/移动/对齐/复制/导入）
│   → setTree(newTree)
│     直接赋值 + buildIndex 重建
│
├─ 字段级更新（配置面板 onChange / 拖拽 onDragStop / 锁定隐藏）
│   → updateNode(id, patch)
│     parentMap 反向追踪 + 不可变改树 + buildIndex 重建（引用复用）
│
├─ 批量更新（初始化 / 批量字段 + 可含结构性）
│   → setPartialState(partial)
│     浅合并 + byId 防护 + (含 components 时 buildIndex)
│
└─ runtime 数据（realtimeDataFlow / customFieldsList）
    → runtime data 插件（04-plugin-system.md 细化）
      只改 extra 字段，不动 components/byId/parentMap
```

---

## 7. 25 bug 覆盖对照

### 7.1 写路径直接覆盖的 bug

| bug # | 描述 | 框架 API | 覆盖方式 | 事实依据 |
| --- | --- | --- | --- | --- |
| #1 | setComponents 路径改名丢失 | `setTree` | 直接赋值无合并覆盖 | fact-extraction §6.2 |
| #2 | handleAlign 多选对齐 pre-existing | `setTree` | 单次 setTree 预防多次写覆盖 | fact-extraction §6.2 |
| #3 | setLevelPath 丢弃返回值 | `createTreeStore` | set 返回值统一 | fact-extraction §6.2 |
| #4 | drag2layoutBlock updateFieldConfig 不同步 | `updateNode` | 改树+buildIndex 永远 fresh | fact-extraction §6.2 |
| #13 | handleAlign 闭包覆盖 | `setTree` | 后闭包 fresh | fact-extraction §6.2 |
| #14 | setState 丢弃字段 | `setPartialState` + `setTree` | 拆分语义 | fact-extraction §6.2 |
| #17 | 改名丢失 | `setTree` | 直接赋值无合并 | fact-extraction §6.2 |
| #19 | 组内对齐跳变 | `setTree` | 单次写树预防 stale | fact-extraction §6.2 |
| #20 | 保存丢失 | `setTree` | 后直接序列化 fresh | fact-extraction §6.2 |

### 7.2 间接覆盖的 bug（单源架构自带）

| bug # | 描述 | 框架机制 | 事实依据 |
| --- | --- | --- | --- |
| #9 | layer-manager mutation | `createTreeStore` 强制不可变 set | fact-extraction §6.2 |
| #10 | configuration-panel render 内 mutation | `createTreeStore` 不可变契约 | fact-extraction §6.2 |
| #11 | designer-field parents.children mutation | `createTreeStore` 不可变契约 | fact-extraction §6.2 |
| #22 | mutation 残留 + cloneDeep 滥用 | `createTreeStore` 不可变契约 | fact-extraction §6.2 |

---

## 8. 与 00-overview.md §5 + 01-data-model.md 的一致性核对

| 维度 | 00-overview.md / 01-data-model.md | 本文档 | 一致性 |
| --- | --- | --- | --- |
| `setTree(components)` 签名 | 00 §5.5 | §2.1 | ✅ |
| `updateNode(id, patch)` 签名 | 00 §5.4 | §3.1 | ✅ |
| `setPartialState(payload)` 签名 | 00 §5.7 | §4.1 | ✅ |
| `deepMergeKeys` 二次浅合并机制（替代硬编码 config） | 00 §5.4 | §3.2.5 | ✅ |
| buildIndex 引用复用 | 01 §3.2 | §5.3 | ✅ |
| oldById set 外捕获 | 01 §3.3 | §5.2 | ✅ |
| byId 防护 hasOwnProperty 修正 | 00 §5.7 + 01 §7.2 | §4.2.2 | ✅ |
| ROOT_ID no-op | 00 §5.4 + 01 §1.4 | §3.2.1 | ✅ |
| MAX_DEPTH = 100 | 00 §5.4 | §3.2.3 | ✅ |

---

## 9. 相关文档

- [00-overview.md](./00-overview.md) §5.4-5.7 —— API 签名草案对照标准
- [01-data-model.md](./01-data-model.md) §3 —— buildIndex 引用复用算法
- [03-read-path.md](./03-read-path.md) —— 读路径（updateNode 的订阅方）
- [04-plugin-system.md](./04-plugin-system.md) —— runtime data 插件（5 个 runtime action 的框架归属）
- [design/src/designer-state/02-write-path.md](skills/oss-visual-designer-project-context/src/designer-state/02-write-path.md) —— 当前项目写路径权威
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §2 —— 事实基准
