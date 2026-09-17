# Designer Canvas 数据模型

> 配套 [00-overview.md](./00-overview.md) | 关注点：state 形状、FlatField、单源设计（task-002 改造）

---

## 1. state 形状（速查表）

文件：[`src/store/modules/designer-canvas.ts`](src/store/modules/designer-canvas.ts)

```ts
export interface DesignerCanvasState {
    appScopeId: string | null;                            // 应用/场景 scope id
    components: WidgetItem[];                              // 单一真相源（树）
    byId: Record<string, FlatField>;                       // 派生索引
    parentMap: Record<string, string>;                     // 派生索引
    page: PageConfig;                                      // 页面级配置
    realtimeDataFlow: RealtimeDataFlowItem[];              // runtime hook：实时数据流
    customFieldsListMapping: Record<string, string>;       // runtime hook：自定义字段
    meta: Record<string, any>;                             // 场景元数据
}
```

| 字段 | 类型 | 来源 | 何时改 | 谁读 |
| --- | --- | --- | --- | --- |
| `appScopeId` | `string \| null` | 初始加载 | 仅 init：走 `setDesignerCanvasState({ ...config, meta, appScopeId })`，由 [DesignerContent.tsx L259](src/designer/DesignerContent.tsx#L259) 设置 | designer Provider |
| `components` | `WidgetItem[]` | **真相源** | 结构性变更 + 字段级更新（setComponents / updateFieldConfig / setState） | 渲染树 + save |
| `byId` | `Record<string, FlatField>` | **派生索引（纯派生，只读）** | 由 setComponents / updateFieldConfig / setState 内 `buildIndex` 重建（纯派生，只读） | useFieldConf + 工具函数 |
| `parentMap` | `Record<string, string>` | **派生索引** | 由 setComponents / updateFieldConfig / setState 内 `buildIndex` 重建 | layer-manager / 边界计算 |
| `page` | `PageConfig` | 后端 API | 配置面板修改 | render + save |
| `realtimeDataFlow` | `RealtimeDataFlowItem[]` | 配置面板 | runtime action | 数据获取 |
| `customFieldsListMapping` | `Record<string, string>` | 配置面板 | runtime action | 表单 |
| `meta` | `Record<string, any>` | 后端 API | 场景切换 / 刷新 | 工具栏 |

> **速记**：所有写操作改 `components` 树 + `buildIndex` 重建 `byId`（单源）。`byId` 是纯派生（只读），`components` 树永远 fresh。
>
> **已删除字段**（task-003，2026-07-28）：`undo: any[]` / `redo: any[]` —— 从未实现的死字段，已从接口和 initialState 删除。

---

## 2. FlatField 定义

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts) `FlatField`

```ts
export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;                                // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any };       // ⚠️ 不含 children
}
```

| 关键点 | 说明 |
| --- | --- |
| **不含 children** | byId 是渲染所需的"叶子数据"。`children` 在递归渲染时由 `components` 树提供 |
| **`data` 是浅引用** | `buildIndex` 里 `byId[id].data = node.data`，直接复用 tree 节点的 data 引用。如需改走 dispatch |
| **parentId** | `ROOT_UNIQUE_ID` 表示顶级，详见下文 |
| **`data.drillDown` 不进 byId** | `buildIndex` 只遍历 `node.children`，**不**遍历 `data.config.drillDown`。原因：drillDown 是轮播层级配置数据（非渲染树结构），其 level 由 `setLevelPath` 单独维护。如把 drillDown 子节点塞进 byId，会与 setLevelPath 的 level 重置语义冲突，并让 byId 混入"非渲染节点"。溯源：[task-007 §4.1 buildIndex 注释](../../plans/done/task-2026-07-21-007-byid-index.md) |

### 2.1 buildIndex 性能（task-007 §3.3 选型依据）

| 指标 | 数据 | 来源 |
| --- | --- | --- |
| 440 组件构建耗时 | 约 **1-2ms**（p95=0.2ms） | [task-007 §3.3 L89](../../plans/done/task-2026-07-21-007-byid-index.md)："一次递归 + 两次 reduce" |
| 调用频率 | 拖入新组件 / 删除 / group / split / **updateFieldConfig（每次字段级更新）** | 用户操作级 + 高频 onChange |
| 是否在 onChange 高频路径 | **是**（task-002 后 updateFieldConfig 也调用 buildIndex） | 440 组件 p95=0.2ms，开销可忽略 |

**结论**：buildIndex 在所有写操作时触发（含高频 updateFieldConfig），440 组件 p95=0.2ms，开销可忽略。订阅粒度由 buildIndex 引用复用保持（见 §2.2）。

### 2.2 buildIndex 引用复用（task-002，2026-07-28）

task-002 单源改造后，`updateFieldConfig` 每次都调用 `buildIndex` 重建 byId。为避免未修改节点触发不必要的 re-render，buildIndex 支持引用复用：

签名：`buildIndex(components, oldById?)`
- `oldById` 可选，传入时对未变 `data` 节点复用旧 byId 条目
- 判断条件：`oldEntry && oldEntry.data === node.data` → 复用 `oldEntry`
- 效果：`useFieldConf(id)` 的 shallowEqual 判定 `byId[id]` 引用不变 → 跳过 re-render

⚠️ **buildIndex 必须在 Immer `produce` 外调用**：
- `produce` 内 `draft.components` 是 Immer proxy
- proxy get trap 对对象属性递归包装，导致 `oldEntry.data === node.data` 永远 `false`
- `produce` 外 `intermediate.components` 是真实对象，引用比较成立

实现见 [`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts) `buildIndex`（L784-L818）+ [`src/store/modules/designer-canvas.ts`](src/store/modules/designer-canvas.ts) `setComponents` / `setState` / `updateFieldConfig` reducer（均在外层 `buildIndex(intermediate.components, state.byId)`）。

---

## 3. ROOT_UNIQUE_ID

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts)

```ts
export const ROOT_UNIQUE_ID = '-';
```

**约定**：所有顶层组件的 `parentId === '-'`，而不是组件自己的 uniqueId。

**为什么是 `'-'` 而不是 `undefined`**：

- O(1) 查表不需要判 `undefined` vs `ROOT`
- 序列化安全（JSON 不存 `undefined`）

**怎么用**：

```ts
const parentId = parentMap[uniqueId];
if (!parentId || parentId === ROOT_UNIQUE_ID) {
    // 顶级组件
    const root = { uniqueId: ROOT_UNIQUE_ID, children: designerCanvas.components };
}
```

---

## 4. 单源设计（task-002 改造，2026-07-28）

> **task-002 改造说明**：原"双源设计（components + byId/parentMap，byId 可独立写入）"已改为"单源设计（components 是唯一真相源，byId/parentMap 纯派生只读）"。`updateFieldConfig` 不再只 patch byId，而是 Immer produce 改 components 树 + `buildIndex` 重建 byId/parentMap；`setComponents` / `setState` 删除 `mergeByIdIntoTree(fieldPreserve)` 调用，直接赋值 + `buildIndex`。历史"双源不同步窗口期 / stale tree"问题已消除（见 §4.3 / §4.4 标注）。

### 4.1 为什么是单源而不是双源（task-002 改造）

| 方案 | 描述 | 缺点 |
| --- | --- | --- |
| 单源 A：只存 components | 渲染时 O(n) 递归查找 | 配置面板 onChange 60+ 次/秒 → 全树比对 440 组件 → 卡顿 |
| 单源 B：只存 byId | 扁平化所有数据 | 失去 tree 结构，无法递归渲染 / 拖入组 |
| ~~双源（旧，task-002 前）~~ | ~~components 是真相源，byId 可独立写入（updateFieldConfig 只 patch byId 不改树）~~ | ~~需保持同步，存在 stale tree / 不同步窗口期~~ |
| ✅ **单源（当前，task-002 后）** | components 是唯一真相源；所有写操作（含 updateFieldConfig）改 components 树 + `buildIndex` 重建 byId/parentMap；byId 纯派生（只读） | buildIndex 每次 updateFieldConfig 都跑一次（440 组件 p95=0.2ms，可忽略） |

### 4.2 同步保证

**核心不变式**（所有写操作后）：

```
state.byId = buildIndex(state.components, oldById).byId
state.parentMap = buildIndex(state.components, oldById).parentMap
```

task-002 后，`buildIndex` 在 Immer `produce` **外**调用（避免 proxy 破坏引用复用，见 §2.2），并用 `oldById` 复用未变节点的 byId 条目。实现见 [`designer-canvas.ts`](src/store/modules/designer-canvas.ts) 的 `setComponents` / `setState` / `updateFieldConfig` reducer：

```ts
// setComponents（task-002 单源：直接赋值 + produce 外 buildIndex + 引用复用）
case 'designerCanvas/setComponents': {
    const intermediate = produce(state, (draft) => {
        draft.components = action.payload;
    });
    const { byId, parentMap } = buildIndex(intermediate.components, state.byId);
    return { ...intermediate, byId, parentMap };
}

// updateFieldConfig（task-002 单源：produce 改树 + produce 外 buildIndex + 引用复用）
case 'designerCanvas/updateFieldConfig': {
    const { uniqueId, patch } = action.payload;
    if (uniqueId === ROOT_UNIQUE_ID) return state;
    if (!state.parentMap[uniqueId]) return state;
    if (!patch || Object.keys(patch).length === 0) return state;

    const oldById = state.byId;
    let modified = false;
    const intermediate = produce(state, (draft) => {
        // parentMap 反向追踪找路径 O(depth) → 沿路径定位节点 → 浅合并 data
        // ...（详见 reducer 源码 L143-L176）
        node.data = {
            ...node.data,
            ...patch,
            config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config,
        };
        modified = true;
    });
    if (!modified) return state;
    // produce 外 buildIndex 重建 byId/parentMap O(n)，引用复用保持订阅粒度
    const { byId, parentMap } = buildIndex(intermediate.components, oldById);
    return { ...intermediate, byId, parentMap };
}
```

### 4.3 不同步的窗口期（task-012-1 新增的概念）

> ✅ **已消除（task-002 后）**：task-002 单源改造后，`updateFieldConfig` 改为 Immer produce 改 components 树 + `buildIndex` 重建 byId/parentMap，components 树永远 fresh，不再存在"byId 与 components 不同步的窗口期"。以下内容保留为历史参考。

~~`updateFieldConfig` **只改 byId，不改 components**：~~

```ts
// ❌ 旧实现（task-002 前，已废弃）：
case 'designerCanvas/updateFieldConfig': {
    return produce(state, (draft) => {
        const target = draft.byId[uniqueId];
        const newData = {
            ...target.data,
            ...patch,
            config: patch.config ? { ...target.data.config, ...patch.config } : target.data.config,
        };
        target.data = newData;
        // ⚠️ components 不变！tree 是 stale 的
    });
}
```

~~这是 **task-008 P6 优化**的设计：拖拽期间 1 次 dispatch 只改 byId，components 引用稳定，其他组件不会 re-render。~~

~~**后果**：任何读 `components` 树的操作都可能拿到 stale 数据。详见 [04-edge-cases.md](./04-edge-cases.md)。~~

**task-002 后**：上述不同步窗口期已消除，`updateFieldConfig` 改树 + `buildIndex` 重建，components 永远 fresh。`useFieldConf` 订阅粒度由 `buildIndex` 引用复用保持（见 §2.2）。

### 4.4 stale 窗口期的防护

> ✅ **已消除（task-002 后）**：components 树永远 fresh，不再有 stale tree 问题。以下防护表保留为历史参考（其中"读 byId"路径在 task-002 后依然有效，"接受 stale"语义已不再需要）。

| 场景 | 防护 | task-002 后状态 |
| --- | --- | --- |
| 渲染当前组件 | `useFieldConf(uniqueId)` —— 只读 byId，无 stale | ✅ 依然有效（buildIndex 引用复用保持订阅粒度） |
| 渲染整树 | 走 `components` —— ~~接受"没追到字段级更新"~~ | ✅ components 永远 fresh，无需接受 stale |
| 读组件 parent（含 children） | `getFieldNodeById(components, id)` —— ~~接受 stale~~，但 children 的 data 用 byId 重算 | ✅ components 永远 fresh |
| 异步回调读最新 | `useStore().getState().designerCanvas.byId[id]` —— byId 永远是 fresh | ✅ 依然有效 |
| 保存序列化 | `getSaveableComponents(state)` —— ~~把 byId 合并到 tree（byIdWins 方向）~~ | ✅ components 即真相源，无需 byIdWins 合并（保留为兼容口径） |

---

## 5. 树节点结构（WidgetItem）

完整类型定义见 [01-01-widget-types.md](./01-01-widget-types.md)（含 `WidgetItem` / `WidgetData` / `WidgetConfig` / `PageConfig` / `SchemaConfig` 等）。简版：

```ts
interface WidgetItem {
    uniqueId: string;
    type: string;                          // 组件类型（如 'echarts-bar' / 'group' / 'layout-block'）
    data: {
        config: Record<string, any>;       // 组件配置（left/top/width/height/title/...）
        [key: string]: any;                // 其他 data 字段（drillDown / 自定义）
    };
    children?: WidgetItem[];               // 仅 group / layout-block 有
}
```

**关键约束**：

| 约束 | 原因 |
| --- | --- |
| `children` 仅 group / layout-block 有 | 叶子组件 `children` 是 `undefined`，调用方需判空 |
| `data.config` 是组件渲染的唯一配置源 | 由 `useFieldConf` 字段级订阅 |
| `data.drillDown` 不进 byId | 轮播层级数据，level 由 `setLevelPath` 单独维护 |
| `children` 顺序敏感 | 渲染顺序 = z-index 顺序 |

### 5.1 `setLevelPath` 契约（task-009 改造，task-012 评估）

- `setLevelPath` 已改为不可变版（用 `produce`）
- task-012 评估后判定 `drillDownLevel` 重置语义已**永久放弃**——当前无活跃调用方使用 level>0 语义
- ⚠️ **review r1 §1.3 修正（2026-07-27）**：`setLevelPath` 函数本身**仍是活代码**，有 3 个调用方：
    - [layer-manager/visible/index.ts](../../../../src/designer/layer-manager/visible/index.ts) L18/L33（show/hide 后重置整树 drillDownLevel）
    - [layer-manager/lock/index.ts](../../../../src/designer/layer-manager/lock/index.ts) L19/L34（lock/unlock 后重置整树 drillDownLevel）
    - [designer-field/utils.ts](../../../../src/designer/renderer/designer-field/utils.ts) L163（resize 后重置整树 drillDownLevel）
  这些调用都传 `parentNode = null`，即把整树 drillDownLevel 重置为 0（根级）——与 §5.1.1 "drillDown level>0 无活跃调用方" 一致。`setLevelPath` 不可删。
- ⚠️ `useLevelPath`（旧 hook）已删除（task-009，src 下 0 命中），与 `setLevelPath` 函数不同——不要混淆
- **如需修改 drillDown 相关逻辑**：走 `dispatch(updateFieldConfig(id, patch))` + 字段级 patch，**不要**重新引入 level>0 的 `setLevelPath` 分支

#### 5.1.1 drillDown level>0 无活跃调用方（task-008 §3.3 grep 结论）

**grep 验证**（`onValueChange.*,\s*[1-9]`）：
- 活跃代码中所有 `onValueChange` 调用都传 `level = 0`（默认值），见 `src/designer/renderer/designer-field/utils.ts`
- grep `onValueChange.*,\s*[1-9]` 仅命中 `.bak` 文件（`DesignerField.bak.jsx`），非活跃代码
- ⚠️ **review r1 §1.3 修正**：原版称 "`setLevelPath` 调用点在 `useDebounceMergeConfig.tsx`（已删）和 `DesignerContent.tsx`" —— 已过时。实际 `setLevelPath` 调用点见 §5.1（layer-manager/visible + lock + designer-field/utils），都传 `parentNode = null`（重置整树 level 为 0），属低频操作。

**结论**：drillDown level>0 实际无活跃调用方（所有 `setLevelPath` 调用都是重置为 0），`updateFieldConfig`（顶层 O(1)）已覆盖所有真实场景。如未来真需要 drillDown 字段级更新，按 [task-008 §3.3](../../plans/done/task-2026-07-21-008-patch-field-config.md) 加 `updateFieldConfigDeep` action——reducer 内部先查 `byId[uniqueId]`，如果有 `data.config.drillDown`，按 level 递归写入。溯源：task-008 §7 Review 修正。

---

## 6. 持久化

**当前 `whitelist: string[] = []`，实际不持久化任何 slice**。源码注释（`src/store/modules/index.ts` L17-L19）标注为"仅保留 PersistGate 占位"。

源码事实（行号可验证）：

- `whitelist` 定义：`src/store/modules/index.ts` L20（`export const whitelist: string[] = []`）
- `persistConfig` 配置：`src/store/index.ts` L8-L12（`{ key: 'root', storage, whitelist }`）
- `PersistGate` 使用：`src/app/container/index.tsx` L117（`<PersistGate loading={null} persistor={persistor}>`，运行时挂载但因 whitelist 为空而不触发数据恢复）

---

## 7. 关键文件清单

| 文件 | 行 | 内容 |
| --- | --- | --- |
| `src/store/modules/designer-canvas.ts` | — | DesignerCanvasState 接口 + reducer（task-002 单源：setComponents/setState/updateFieldConfig 改树 + buildIndex） |
| `src/designer/renderer/utils.ts` | L642-L696 | FlatField + buildIndex（task-002 签名扩展：`buildIndex(components, oldById?)` 引用复用） |
| `src/store/designer/hooks.ts` | L86-L90 | `useFieldConf` hook |
| `src/store/designer/hooks.ts` | L102-L112 | `useUpdateFieldConfig` hook |
| `src/store/designer/hooks.ts` | L120-L180 | `useRealtimeDataFlow` + `useCustomFieldsList` hooks |
| `src/store/designer/hooks.ts` | L190 | `useFlatComponents` hook |

> **已删除**（task-003，2026-07-28）：`mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `getFieldById` / `getParentIdById` / `removeFieldFromIndex` / skip 机制 / `dirtyConfigKeys` 字段 / `undo`/`redo` 死字段。详见 [06-principles.md §12](./06-principles.md)。

---

## 8. 易错点

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| 直接 mutation `state.components` 或 `byId[id]` | Immer frozen 对象抛 `TypeError` | 所有修改走 dispatch |
| 在 byId 上加 children 字段 | 双源同步复杂化 | children 只在 components 树 |
| 用 `useFieldConf` 读 parent 的 children | 返回值是 FlatField（无 children） | 改用 `getFieldNodeById(components, parentId)` |
| 在 `useEffect` 里读 `byId[id].data` 触发额外 render | 字段级订阅不会触发，需要 `useFieldConf` | 异步回调用 `useStore().getState()` |
| 假设 components 是 fresh | ~~updateFieldConfig 后 components 是 stale~~ | task-002 后 components 永远 fresh（updateFieldConfig 改树 + buildIndex 重建） |
| 在 produce 内调用 buildIndex | Immer proxy 破坏引用复用（`oldEntry.data === node.data` 永远 false），未变节点也重建 byId 条目 → useFieldConf 订阅粒度失效 → 全量 re-render | buildIndex 必须在 produce 外调用，用 `intermediate.components`（真实对象）；`oldById` 从 `state.byId`（produce 外）捕获 |