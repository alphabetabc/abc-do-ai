# 01 — 框架数据模型：泛型类型 + state 形状 + 派生索引

> 状态：`阶段 3 产出，待 review（A+B 双视角）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/done/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md)（§1 单源契约 + buildIndex）
> 对照标准：[00-overview.md](./00-overview.md) §5 API 契约签名草案
> 当前项目权威：[design/src/designer-state/01-data-model.md](skills/oss-visual-designer-project-context/design/src/designer-state/01-data-model.md)

---

## 0. 文档定位与 review 标准

本文档定义 designer-core 框架的**泛型数据模型**：树节点（TreeNode）、扁平索引条目（FlatNode）、store state（TreeStoreState），以及它们与当前项目 `WidgetItem` / `FlatField` / `DesignerCanvasState` 的映射关系。

**review 标准（task §1.1 阶段 3，A+B 双视角）**：
- **视角 A 事实核查**：每条类型定义能对照当前源码验证（源码类型 + 行号）；映射关系无幻觉
- **视角 B 逻辑审查**：泛型化合理（不过度抽象、不丢失约束）；派生索引契约完整；与 00-overview.md §5 签名草案一致

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。

---

## 1. 核心泛型类型定义

### 1.1 设计原则

框架类型泛型化的核心约束（对照 00-overview.md §2 普遍意义边界）：

| 原则 | 事实依据 | 约束 |
| --- | --- | --- |
| 树节点结构泛型化 | fact-extraction §1.1（WidgetItem L24-29） | `uniqueId` / `type` / `data` / `children` 四字段为骨架；`data` 内容业务自定义 |
| 扁平索引条目泛型化 | fact-extraction §1.5（FlatField L642-647） | `uniqueId` / `type` / `parentId` / `data` 四字段为骨架；**不含 children** |
| 业务数据泛型化 | fact-extraction §1.1（page/realtimeDataFlow/customFieldsListMapping/meta） | 框架只存不解释，用泛型参数或 `Record<string, any>` 承载 |
| ROOT 标识常量化 | fact-extraction §1.5（ROOT_UNIQUE_ID L22） | 框架导出 `ROOT_ID` 常量，默认值 `'-'`，可配置 |

### 1.2 TreeNode（树节点泛型）

```ts
/**
 * 框架树节点泛型
 *
 * 对应当前项目 WidgetItem（GeneratorWidget.tsx L24-29）：
 *   type WidgetItem = { uniqueId: string; type: string; data: WidgetData; children?: WidgetItem[] }
 *
 * 泛型参数：
 * - TData: 节点 data 类型（业务自定义，默认 unknown）
 *   对应当前 WidgetData = { config: WidgetConfig; [key: string]: any }
 */
export interface TreeNode<TData = unknown> {
    /** 节点唯一标识（框架强制非空，buildIndex 跳过无 uniqueId 节点） */
    uniqueId: string;
    /** 节点类型（框架不解释语义，业务自定义；对应当前 FIELD_COMP_TYPES 枚举） */
    type: string;
    /** 节点数据（业务自定义；框架通过引用复用优化订阅，禁止 reducer 外 mutation） */
    data: TData;
    /** 子节点（可选；无 children 或空数组视为叶子节点） */
    children?: TreeNode<TData>[];
}
```

**契约**（对照 fact-extraction §1.5 + 01-data-model.md §1.3）：
- `uniqueId` 必须是非空字符串，buildIndex 遍历时 `if (!node || !node.uniqueId) continue` 跳过无效节点（utils.ts L673）
- `type` 框架不感知语义，业务用枚举或字符串（当前项目 `FIELD_COMP_TYPES`，constants.ts L138-153）
- `data` 是引用复用的关键：`oldEntry.data === node.data` 判断节点是否修改（utils.ts L680）。**框架保证 data 是浅引用**，禁止 reducer 外修改
  - **data 引用生命周期**：`data` 是浅引用，禁止跨删除操作持有。节点删除后旧 data 引用虽未 GC 但已脱离 store 管理，读取会得到过期值。异步回调应通过 `getState()` 或 `useLatestState()` 实时读取，不缓存 data 引用
- `children` 可选；buildIndex 只遍历 `node.children`，**不遍历 `node.data.config.drillDown`**（utils.ts L653-656 注释）

### 1.3 FlatNode（扁平索引条目泛型）

```ts
/**
 * 框架扁平索引条目泛型
 *
 * 对应当前项目 FlatField（utils.ts L642-647）：
 *   interface FlatField { uniqueId: string; type: string; parentId: string; data: { config: any; [key: string]: any } }
 *
 * ⚠️ 不含 children —— 需 children 时用 getNodeById（O(n) 遍历树）
 */
export interface FlatNode<TData = unknown> {
    /** 节点唯一标识 */
    uniqueId: string;
    /** 节点类型（同 TreeNode.type） */
    type: string;
    /** 父节点 uniqueId；顶层节点为 ROOT_ID（'-'） */
    parentId: string;
    /** 节点数据（浅引用 = TreeNode.data，禁止 reducer 外 mutation） */
    data: TData;
}
```

**契约**（对照 fact-extraction §1.5）：
- `data` 直接 = `TreeNode.data` 的浅引用（utils.ts L686 `data: node.data`）
- `parentId` 顶层节点为 `ROOT_ID`（`'-'`），对应 `parentMap[id] === '-'`
- **不含 children**：需 children 时用 `getNodeById`（O(n) 递归遍历，返回完整 TreeNode）

### 1.4 ROOT_ID 常量

```ts
/**
 * 根节点标识
 *
 * 对应当前项目 ROOT_UNIQUE_ID（utils.ts L22）：
 *   export const ROOT_UNIQUE_ID = '-';
 *
 * 框架默认值 '-'，可通过 createTreeStore options 覆盖
 */
export const ROOT_ID = '-';
```

**契约**：
- `parentMap[id] === ROOT_ID` 表示该节点是顶层组件
- `updateNode(ROOT_ID, ...)` 为 no-op（根节点不可字段更新，对照 designer-canvas.ts L130）
- buildIndex 遍历入口 `walk(components, ROOT_ID)`（utils.ts L695）

---

## 2. TreeStoreState（store state 泛型）

### 2.1 类型定义

```ts
/**
 * 框架 store state 泛型
 *
 * 对应当前项目 DesignerCanvasState（designer-canvas.ts L19-36）：
 *   interface DesignerCanvasState {
 *     appScopeId: string | null;
 *     components: any[];                    // 真相源
 *     byId: Record<string, FlatField>;      // 派生只读
 *     parentMap: Record<string, string>;    // 派生只读
 *     page: any;                            // 业务数据
 *     realtimeDataFlow: any[];              // 业务数据
 *     customFieldsListMapping: Record<string, string>; // 业务数据
 *     meta: Record<string, any>;            // 业务数据
 *   }
 *
 * 泛型参数：
 * - TNode: 树节点类型（默认 TreeNode<unknown>）
 * - TFlat: 扁平索引条目类型（默认 FlatNode<unknown>）
 * - TExtra: 业务扩展状态类型（默认 Record<string, unknown>）
 */
export interface TreeStoreState<
    TNode extends TreeNode = TreeNode,
    TFlat extends FlatNode = FlatNode,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
> {
    /** 组件树（唯一真相源，结构性变更时整树替换） */
    components: TNode[];
    /** 派生只读索引：uniqueId → FlatNode（不含 children） */
    byId: Record<string, TFlat>;
    /** 派生只读索引：child uniqueId → parent uniqueId */
    parentMap: Record<string, string>;
    /** 业务扩展状态（框架只存不解释；对应当前 page/realtimeDataFlow/customFieldsListMapping/meta） */
    extra: TExtra;
}
```

### 2.2 字段角色契约

| 字段 | 角色 | 事实依据（源码行号） | 框架约束 |
| --- | --- | --- | --- |
| `components` | **真相源** | designer-canvas.ts L22-L23 | 唯一可变源；setTree/updateNode/setPartialState 三个写路径修改 |
| `byId` | **派生只读** | designer-canvas.ts L24-L25 | 仅由 buildIndex 重建；setPartialState 防护拦截直接赋值（框架用 hasOwnProperty 修正 'in' 隐 bug） |
| `parentMap` | **派生只读** | designer-canvas.ts L26-L27 | 仅由 buildIndex 重建；同 byId 防护 |
| `extra` | **业务数据** | designer-canvas.ts L28-L35（page/realtimeDataFlow/customFieldsListMapping/meta） | 框架只存不解释；泛型化承载 |

### 2.3 与当前项目的映射

当前 `DesignerCanvasState` 的 8 个字段映射到框架 `TreeStoreState`：

| 当前字段 | 框架字段 | 映射方式 | 事实依据 |
| --- | --- | --- | --- |
| `components` | `components` | 直接映射（类型从 `any[]` 收窄为 `TNode[]`） | designer-canvas.ts L22 |
| `byId` | `byId` | 直接映射（类型从 `Record<string, FlatField>` 泛型化为 `Record<string, TFlat>`） | designer-canvas.ts L24 |
| `parentMap` | `parentMap` | 直接映射 | designer-canvas.ts L26 |
| `appScopeId` | `extra.appScopeId` | 归入 extra | designer-canvas.ts L20-L21 |
| `page` | `extra.page` | 归入 extra | designer-canvas.ts L28-L29 |
| `realtimeDataFlow` | `extra.realtimeDataFlow` | 归入 extra | designer-canvas.ts L30-L31 |
| `customFieldsListMapping` | `extra.customFieldsListMapping` | 归入 extra | designer-canvas.ts L32-L33 |
| `meta` | `extra.meta` | 归入 extra | designer-canvas.ts L34-L35 |

**设计决策**：当前项目的 5 个业务字段（appScopeId/page/realtimeDataFlow/customFieldsListMapping/meta）统一归入 `extra`，而非在框架 state 中平铺。理由：
1. 框架不感知业务语义（00-overview.md §2.2 不抽象项）
2. 不同业务的扩展字段不同，泛型 `TExtra` 比硬编码字段更灵活
3. 框架核心只管 `components` + `byId` + `parentMap` 三字段，extra 透传

### 2.4 initialState

```ts
/**
 * 框架初始 state
 *
 * 对应当前项目 designerCanvasInitialState（designer-canvas.ts L38-62）
 */
export const createInitialTreeStoreState = <
    TNode extends TreeNode,
    TFlat extends FlatNode,
    TExtra extends Record<string, unknown>,
>(
    options?: {
        initialComponents?: TNode[];
        initialExtra?: TExtra;
    },
): TreeStoreState<TNode, TFlat, TExtra> => ({
    components: options?.initialComponents ?? [],
    byId: {},      // 由 buildIndex 在 createTreeStore 内重建
    parentMap: {}, // 由 buildIndex 在 createTreeStore 内重建
    extra: (options?.initialExtra ?? {}) as TExtra,
});
```

**契约**：
- `byId` / `parentMap` 初始为 `{}`，`createTreeStore` 内部立即调 `buildIndex(initialComponents, undefined)` 重建（对照 01-data-model.md §2.2 initialState L41-L42 后由 reducer 重建）
- `components` 默认 `[]`（对照 designer-canvas.ts L40）
- `extra` 默认 `{}`，业务可传入初始 page/realtimeDataFlow 等（对照 designer-canvas.ts L43-L61 initialState.page）

---

## 3. 派生索引：buildIndex

### 3.1 框架 buildIndex 签名

```ts
/**
 * 从整树构建扁平索引 + 父子映射
 *
 * 对应当前项目 buildIndex（utils.ts L664-697）
 *
 * @param components 组件树
 * @param oldById 旧 byId（可选，用于引用复用）
 * @returns { byId, parentMap }
 */
export function buildIndex<TNode extends TreeNode, TFlat extends FlatNode>(
    components: TNode[],
    oldById?: Record<string, TFlat>,
): {
    byId: Record<string, TFlat>;
    parentMap: Record<string, string>;
};
```

### 3.2 引用复用算法（契约不变）

框架 buildIndex 内部实现**必须保留**当前项目的引用复用算法（fact-extraction §1.5）：

```ts
// 引用复用关键逻辑（utils.ts L678-687）
const oldEntry = oldById?.[node.uniqueId];
byId[node.uniqueId] =
    oldEntry && oldEntry.data === node.data  // ← 引用比较，未修改节点复用旧条目
        ? oldEntry
        : { uniqueId: node.uniqueId, type: node.type, parentId, data: node.data };
```

**契约**（对照 fact-extraction §1.5 + 01-data-model.md §3.3）：
1. **只遍历 `node.children`**（L689-691），**不遍历 `node.data.config.drillDown`**（L653-656 注释）
2. **引用复用**：`oldEntry.data === node.data` 时复用旧 byId 条目，保持 `useNode` shallowEqual 订阅粒度
3. **`oldById` 必须从 set 外捕获**（对照 designer-canvas.ts L134 `const oldById = state.byId`），不能传 set 内的 draft state.byId
4. **data 是浅引用**：`data: node.data` 直接 = 节点 data 引用（L686），禁止 reducer 外修改
5. **循环引用**：不做检测，依赖不可变更新保证无环（与当前一致）
6. **空树防护**：`walk(components || [], ROOT_ID)`（L695），`for (const node of nodes || [])`（L672）双重 `|| []` 防护

### 3.3 框架与当前的差异

| 维度 | 当前（Redux + Immer） | 框架（vanilla Zustand） | 事实依据 |
| --- | --- | --- | --- |
| buildIndex 调用位置 | produce 外（Immer proxy 破坏引用比较） | set 回调内（无 Immer proxy） | fact-extraction §1.4 + §8 约束 3 |
| oldById 捕获 | `const oldById = state.byId`（produce 外） | `const oldById = get().byId`（set 外） | designer-canvas.ts L134 |
| 引用复用机制 | Immer 结构共享未改节点返回原引用 | 框架手动不可变更新，未改节点保留原 data 引用 | fact-extraction §1.5 |

**关键约束**（fact-extraction §8 约束 3）：vanilla Zustand 无 Immer proxy，buildIndex 可在 set 回调内调用。但**仍需保证 oldById 从 set 外捕获**（`get().byId`），不能传 set 内的 `state.byId`（set 回调内的 state 是新对象）。

---

## 4. getNodeById（工具函数）

### 4.1 框架签名

```ts
/**
 * 从组件树递归查找指定 uniqueId 的节点（返回完整节点，含 children）
 *
 * 对应当前项目 getNodeById（utils.ts L141-150）
 * 保留原名，不加 use 前缀（00-overview.md §0.7 + task §0.7）
 *
 * @param components 组件树
 * @param uniqueId 目标节点 uniqueId
 * @returns 目标节点（含 children）或 null
 */
export function getNodeById<TNode extends TreeNode>(
    components: TNode[],
    uniqueId: string,
): TNode | null;
```

### 4.2 契约（对照 fact-extraction §3.4）

- **递归遍历** components 树（O(n)），返回完整节点（含 children）的浅引用
- **禁止 mutation**：返回的是树中节点的直接引用，修改会破坏单源契约
- **纯函数**，无副作用
- **与 `useNode` 区别**：useNode 订阅 `byId[id]`（FlatNode 不含 children）O(1)；getNodeById 遍历树返回完整节点 O(n)
- **空树防护**：`for (const node of components || [])`（utils.ts L142）

---

## 5. 类型映射汇总表

### 5.1 完整映射

| 当前项目类型 | 源码位置 | 框架类型 | 映射方式 |
| --- | --- | --- | --- |
| `WidgetItem` | GeneratorWidget.tsx L24-29 | `TreeNode<TData>` | 泛型化（data 类型参数化） |
| `WidgetData` | GeneratorWidget.tsx L19-22 | `TData`（泛型参数） | 业务自定义，框架不定义 |
| `WidgetConfig` | GeneratorWidget.tsx L9-17 | （不映射） | 业务自定义，框架不感知 |
| `FlatField` | utils.ts L642-647 | `FlatNode<TData>` | 泛型化（data 类型参数化） |
| `DesignerCanvasState` | designer-canvas.ts L19-36 | `TreeStoreState<TNode, TFlat, TExtra>` | 拆分核心三字段 + extra |
| `ROOT_UNIQUE_ID` | utils.ts L22 | `ROOT_ID` | 重命名（去项目前缀） |
| `FIELD_COMP_TYPES` | constants.ts L138-153 | （不映射） | 业务枚举，框架不感知 |
| `PageConfig` | （概念类型，源码 any） | `TExtra.page` | 归入 extra |
| `SchemaConfig` | （概念类型） | （不映射） | 业务序列化结构，框架不感知 |

### 5.2 类型约束关系

```ts
// 框架类型约束链
TreeNode<TData>
    ↓ buildIndex
FlatNode<TData>  // TData 相同，保证 byId[id].data === tree node.data 引用复用
    ↓ useNode
FlatNode<TData> | undefined

// store state 组合
TreeStoreState<TNode, TFlat, TExtra>
    where TNode extends TreeNode
          TFlat extends FlatNode
          TNode['data'] extends TFlat['data']  // data 类型一致
```

**约束**：`TNode` 的 `data` 类型和 `TFlat` 的 `data` 类型必须一致（或子类型关系），保证 buildIndex 引用复用语义成立。框架在 `createTreeStore` 泛型约束中强制：

```ts
function createTreeStore<
    TData,
    TNode extends TreeNode<TData> = TreeNode<TData>,
    TFlat extends FlatNode<TData> = FlatNode<TData>,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateTreeStoreOptions<TNode, TFlat, TExtra>): TreeStoreApi<TNode, TFlat, TExtra>;
```

---

## 6. 与 00-overview.md §5 签名草案的一致性核对

| 00-overview.md 签名 | 本文档细化 | 一致性 |
| --- | --- | --- |
| `createTreeStore<TNode, TFlat>(options)` | §5.2 补充 `TData` / `TExtra` 泛型参数 | ✅ 细化（TData 是 TNode/TFlat 的共同约束） |
| `useNode<TFlat>(id)` | §1.3 FlatNode 泛型化 | ✅ |
| `useTree<TNode>(options?)` | §1.2 TreeNode 泛型化 | ✅ |
| `updateNode(id, patch)` | （写路径文档细化，02-write-path.md） | — |
| `setTree(components)` | （写路径文档细化，02-write-path.md） | — |
| `getNodeById<TNode>(components, id)` | §4.1 签名一致 | ✅ |
| `setPartialState(payload)` | （写路径文档细化，02-write-path.md） | — |

**偏差说明**：00-overview.md §5.1 `createTreeStore` 签名只有 `<TNode, TFlat>` 两个泛型参数，本文档补充为 `<TData, TNode, TFlat, TExtra>` 四个。理由：`TData` 是 TNode/TFlat 的共同约束（保证引用复用语义），`TExtra` 承载业务扩展状态。这是对草案的**细化**，不违反草案契约。

---

## 7. 不变量与边界

### 7.1 类型不变量

1. **`TNode['data']` 与 `TFlat['data']` 类型一致**：保证 buildIndex 的 `oldEntry.data === node.data` 引用比较在类型层面成立
2. **`FlatNode` 不含 `children`**：需 children 时必须用 `getNodeById`（O(n)），不可通过 byId 获取
3. **`byId` / `parentMap` 是 `TreeStoreState` 的派生只读字段**：不可直接赋值，只能由 buildIndex 重建

### 7.2 运行时边界（对照 fact-extraction §1.5 + §2.2-2.4）

| 边界场景 | 当前行为 | 框架行为 | 事实依据 |
| --- | --- | --- | --- |
| buildIndex 传入 undefined | `walk(components \|\| [], ROOT_ID)` 空树处理 | 同（框架保留 `\|\| []` 防护） | utils.ts L672/L695 |
| buildIndex 遇无 uniqueId 节点 | `if (!node \|\| !node.uniqueId) continue` 跳过 | 同 | utils.ts L673 |
| buildIndex 遇无 children 节点 | `if (Array.isArray(node.children) && ...)` 不遍历 | 同 | utils.ts L689 |
| getNodeById 传入空树 | `for (const node of components \|\| [])` 空循环返回 null | 同 | utils.ts L142 |
| setPartialState 传 byId/parentMap | `'in'` 检测 + console.error + 删除 | `hasOwnProperty` 检测 + console.error + 删除（修正隐 bug） | designer-canvas.ts L91-99；fact-extraction §1.3 |
| updateNode 传 ROOT_ID | `return state`（no-op） | 同 | designer-canvas.ts L130 |

---

## 8. 相关文档

- [00-overview.md](./00-overview.md) —— 框架总纲（§5 API 签名草案对照标准）
- [02-write-path.md](./02-write-path.md) —— 框架写路径（setTree/updateNode/setPartialState 细化）
- [03-read-path.md](./03-read-path.md) —— 框架读路径（useNode/useTree/getNodeById 细化）
- [design/src/designer-state/01-data-model.md](skills/oss-visual-designer-project-context/design/src/designer-state/01-data-model.md) —— 当前项目数据模型权威
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §1 —— 事实基准
