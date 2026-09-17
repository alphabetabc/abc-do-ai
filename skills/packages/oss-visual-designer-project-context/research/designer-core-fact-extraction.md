# designer-core 框架事实提取（阶段 1）

> 状态：`阶段 1 产出，待 review`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](../plans/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：当前仓库代码（2026-07-30 当场验证）+ `.trae/skills/oss-visual-designer-project-context/design/src/designer-state/` 权威文档
> 验证方法：每条结论经 Grep/Read/Glob 当场验证，附源码绝对路径 + 行号；无法验证的标注"未验证"

---

## 0. 文档定位

本文档是 designer-core 框架（Zustand + Plugin）的**事实基准**。所有结论必须能对照当前项目源码验证，不得出现"通常应该"、"一般来说"等无源码依据的表述。

**事实优先级**：仓库代码 > 运行验证 > `.trae/skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。冲突时以仓库代码为准。

**本文档产出对应 task §1.1 阶段 1 要求**：
- 单源契约 / buildIndex 引用复用 / 三条写路径 / 字段级订阅 / 5 大禁区，每条标注源码位置
- Zustand 路径实测（§9，待编码环境就绪后补）
- 25 bug × 6 能力覆盖矩阵（§6）
- 当前名→框架名映射表（§7）
- grep 排除清单（.bak 8 文件，§5.3）

---

## 1. 单源契约 + buildIndex 引用复用

### 1.1 designerCanvas slice state 形状

`src/store/modules/designer-canvas.ts#L19-L62`

| 字段 | 类型 | 角色 | 证据 |
| --- | --- | --- | --- |
| `appScopeId` | `string \| null` | 业务数据 | L20-L21；initial L39 |
| `components` | `any[]` | **真相源**（结构性变更时整树替换） | L22-L23；注释 L12 "单一真相源"；setComponents 直接赋值 L76 |
| `byId` | `Record<string, FlatField>` | **派生只读索引**（by uniqueId） | L24-L25；由 buildIndex 重建 L78/L106/L176；setState 防护 L91-L99 |
| `parentMap` | `Record<string, string>` | **派生只读索引**（child→parent） | L26-L27；同 byId |
| `page` | `any` | 业务数据（页面级配置） | L28-L29；initial 含 pageSize/zoom/background* 等 L43-L58 |
| `realtimeDataFlow` | `any[]` | 业务数据（实时数据流） | L30-L31；initial `[]` L59；recordRealtimeDataFlow/deleteRealtimeDataFlow action 维护 L179-L198 |
| `customFieldsListMapping` | `Record<string, string>` | 业务数据（自定义字段映射） | L32-L33；initial `{}` L60；recordCustomFieldsList/deleteCustomFieldsList action 维护 L199-L212 |
| `meta` | `Record<string, any>` | 业务数据（杂项元数据） | L34-L35；initial `{}` L61 |

State 类型定义：`DesignerCanvasState` interface（L19-L36）；initialState 导出为 `designerCanvasInitialState`（L64）。

### 1.2 components 唯一真相源（赋值点全清单）

Grep `components:` / `.components =` 在 `designer-canvas.ts` 的全部命中：

- `setComponents`（L68-L80）：`draft.components = action.payload`（L76），随后 `buildIndex(intermediate.components, state.byId)` 重建索引（L78），返回 `{ ...intermediate, byId, parentMap }`（L79）。
- `setState`（L81-L110）：先做 byId/parentMap 防护（L91-L99 删除 safePayload 中的 byId/parentMap），再 `Object.assign(draft, safePayload)`（L102），若 payload 含 components 则 `buildIndex` 重建（L105-L107）。
- `updateFieldConfig`（L117-L178）：不改 components 引用，而是在 produce 内沿 parentMap 反向追踪路径并修改 `node.data`（L164-L168），produce 外 `buildIndex` 重建（L176-L177）。

```ts
// src/store/modules/designer-canvas.ts#L75-L80
const intermediate = produce(state, (draft) => {
    draft.components = action.payload;
});
const { byId, parentMap } = buildIndex(intermediate.components, state.byId);
return { ...intermediate, byId, parentMap };
```

### 1.3 byId/parentMap 派生只读（无直接 mutation）

- Grep `byId:` / `parentMap:` 在该文件仅命中：state 类型定义（L25/L27）、initialState（L41/L42）、以及 setComponents/setState/updateFieldConfig 三个 action 中 `const { byId, parentMap } = buildIndex(...)` 后的解构返回（L78-79、L106-107、L176-177）。**没有任何 action 直接 `draft.byId = ...` 或 `draft.parentMap = ...`**。
- Grep `byId\.\w+\s*=` / `parentMap\.\w+\s*=` 在 `designer-canvas.ts` 中 **0 命中**。reducer 内不存在 `byId[id] = ...` 这类直接 mutation。
- setState 防护代码（L91-L99）显式拦截外部传入的 byId/parentMap：

```ts
// src/store/modules/designer-canvas.ts#L89-L99
if ('byId' in payload || 'parentMap' in payload) {
    console.error('[setState] byId/parentMap 不能直接设置，单源架构下应由 buildIndex 派生');
}
const safePayload = { ...payload };
delete safePayload.byId;
delete safePayload.parentMap;
```

**⚠️ 已知隐 bug**：L91 用 `'byId' in payload`（遍历原型链），而非 `hasOwnProperty`。L95 的 `hasComponents` 才用 `hasOwnProperty`。04-principles.md §5 注释提到这是"隐 bug"，但 byId/parentMap 检测**未改**为 hasOwnProperty。框架实现时应统一用 hasOwnProperty。

### 1.4 buildIndex 必须在 produce 外调用

reducer 注释明确说明：buildIndex 不能在 produce 内调用，因为 `draft.components` 是 Immer proxy，其 get trap 会递归包装对象属性，导致 `oldEntry.data === node.data` 永远 false（引用复用失效）。

`src/store/modules/designer-canvas.ts#L72-L74, L86, L124-L126`

### 1.5 buildIndex 引用复用算法

`src/designer/renderer/utils.ts#L664-L697`

```ts
export function buildIndex(
    components: any[],
    oldById?: Record<string, FlatField>,
): { byId: Record<string, FlatField>; parentMap: Record<string, string> } {
    const byId: Record<string, FlatField> = {};
    const parentMap: Record<string, string> = {};
    const walk = (nodes: any[], parentId: string) => {
        for (const node of nodes || []) {
            if (!node || !node.uniqueId) continue;
            // 单源引用复用（task-002）：data 未变化时复用旧 byId 条目
            const oldEntry = oldById?.[node.uniqueId];
            byId[node.uniqueId] =
                oldEntry && oldEntry.data === node.data
                    ? oldEntry
                    : { uniqueId: node.uniqueId, type: node.type, parentId, data: node.data };
            parentMap[node.uniqueId] = parentId;
            if (Array.isArray(node.children) && node.children.length > 0) {
                walk(node.children, node.uniqueId);
            }
        }
    };
    walk(components || [], ROOT_UNIQUE_ID);
    return { byId, parentMap };
}
```

**契约**：
- 输入：组件树 `components: any[]`（含 children）+ 旧 `byId`（可选，用于引用复用）
- 输出：`{ byId, parentMap }` —— byId 是 `Record<uniqueId, FlatField>`（FlatField 不含 children），parentMap 是 `Record<childUniqueId, parentUniqueId>`
- 引用复用关键：`oldEntry.data === node.data`（L680）—— 未修改节点经 Immer 结构共享返回原引用 → 复用旧 byId 条目，保持 `useFieldConf` shallowEqual 订阅粒度
- 遍历范围：只遍历 `node.children`，**不遍历** `node.data.config.drillDown`（注释 L653-L656）
- **data 是浅引用**：`data: node.data` 直接 = 节点 data 引用（L686），禁止 reducer 外修改 `byId[id].data`（L658-L662）
- FlatField 形状（L642-L647）：`{ uniqueId, type, parentId, data }`，**不含 children**
- ROOT_UNIQUE_ID 常量：`src/designer/renderer/utils.ts#L22`

### 1.6 DesignerContent recalcGroupBounds 防重入

`src/designer/DesignerContent.tsx#L276-L328`

- 防重入标志：`const isRecalcRef = useRef(false);`（L284）
- 入口判重入：`if (isRecalcRef.current) return;`（L288）
- 写入前置位：`isRecalcRef.current = true;`（L317）
- 写入后清位：`isRecalcRef.current = false;`（L319）
- 订阅机制：`reduxStore.subscribe(recalcGroupBounds)`（L323），在 `useEffect([], ...)` 内注册（L286-L328）。用 `store.subscribe` 替代 `useEffect + useSelector 依赖`，避免 selected 变化触发组件重渲染
- 写入方式：**只调 `setState({ components: results })`**（L318），不直接调 `updateFieldConfig`。注释（L306-L308）说明单源后 setComponents 直接赋值 + buildIndex，单次写入即可，删除了旧双源时代的"两步同步"

重入成因（注释 L279-L283）：recalcGroupBounds 内调 `setState({components})` → `setComponents` action → Redux subscribe 回调 → 再次进入 recalcGroupBounds，若不防护会无限循环爆栈。

---

## 2. 三条写路径（reducer 契约 + 边界降级）

### 2.1 8 个 action 全表

Grep `case 'designerCanvas/` 在 `designer-canvas.ts` 命中 8 处（L68/81/111/117/179/192/199/206）。

| # | action.type | 行号 | 分类 | 改 components | 重建 byId/parentMap | 频率 |
|---|---|---|---|---|---|---|
| 1 | `designerCanvas/setComponents` | L68-80 | **结构性变更** | ✅ 直接赋值 | ✅ buildIndex | 低频 |
| 2 | `designerCanvas/setState` | L81-110 | **批量**（字段级 + 可含结构性） | ✅（payload 含 components 时） | ✅（含 components 时） | 低频 |
| 3 | `designerCanvas/clearRuntime` | L111-116 | **其他**（runtime 清空） | ❌ | ❌ | 低频 |
| 4 | `designerCanvas/updateFieldConfig` | L117-178 | **字段级** | ✅ Immer produce 改树 | ✅ buildIndex（引用复用） | **高频** |
| 5 | `designerCanvas/recordRealtimeDataFlow` | L179-191 | **其他**（runtime record） | ❌ | ❌ | 中频 |
| 6 | `designerCanvas/deleteRealtimeDataFlow` | L192-198 | **其他**（runtime delete） | ❌ | ❌ | 低频 |
| 7 | `designerCanvas/recordCustomFieldsList` | L199-205 | **其他**（runtime record） | ❌ | ❌ | 低频 |
| 8 | `designerCanvas/deleteCustomFieldsList` | L206-212 | **其他**（runtime delete） | ❌ | ❌ | 低频 |

**分类汇总**：结构性 1 / 字段级 1 / 批量 1 / 其他（runtime）5。

### 2.2 写路径 1：setComponents（框架名 setTree）

- **action.type**：`'designerCanvas/setComponents'`
- **reducer**：Immer `produce` 内 `draft.components = action.payload`（直接赋值，不克隆、不合并、不 mergeByIdIntoTree）；produce 外 `buildIndex(intermediate.components, state.byId)` 重建
- **buildIndex 在 produce 外的原因**：produce 内 `draft.components` 是 Immer proxy，proxy get trap 对对象属性递归包装，导致 `oldEntry.data === node.data` 永远 false
- **边界降级**：reducer 本身**不校验** `action.payload` 为空/undefined。若传 `undefined`，`buildIndex(undefined, ...)` 内部 `walk(components || [], ROOT_UNIQUE_ID)` 以空数组处理（L672/L695 有 `|| []` 防护），得到空 byId/parentMap。空数组的业务防护在调用方 `DesignerContent.tsx` 的 setState wrapper（检测 `_.isEmpty(nextState.components)` 补 realtimeDataFlow/customFieldsListMapping），**不在 reducer 内**

`src/store/modules/designer-canvas.ts#L68-L80`

### 2.3 写路径 2：updateFieldConfig（框架名 updateField）

- **action.type**：`'designerCanvas/updateFieldConfig'`
- **reducer 实现**：
  - **不用 byId 查找节点**。用 `parentMap` 反向追踪构建路径（O(depth)），再沿路径从 `draft.components` 逐层 `find` 到目标 `node`
  - **不可变更新**：Immer `produce` 内 `node.data = { ...node.data, ...patch, config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config }`（浅合并；`config` 字段单独二次浅合并，与旧 `patchFieldConf` 语义一致）
- **边界降级（task 文档 §1.3 说 L129-132，实测 L130-132）**：
  1. `uniqueId === ROOT_UNIQUE_ID` → `return state`（根节点不可字段更新，L130）
  2. `!state.parentMap[uniqueId]` → `return state`（id 不存在于 parentMap，L131）
  3. `!patch || Object.keys(patch).length === 0` → `return state`（空 patch，L132）
- **produce 内额外降级**（`modified` 保持 false，produce 后 `if (!modified) return state`，L173）：
  4. parentMap 反向追踪时 `draft.parentMap[current]` 为 falsy → `return`（放弃，L146）
  5. 反向追踪深度超过 `MAX_DEPTH = 100` → `console.error` + `return`（L147-150）
  6. 沿路径 find 不到节点（树与 parentMap 不一致）→ `return`（L159）
- **是否触发 buildIndex**：**是**。produce 外 `buildIndex(intermediate.components, oldById)` 全量重建 byId/parentMap。**不是单点更新**——单源架构下 byId 是纯派生，每次整树重建。订阅粒度由 buildIndex 引用复用保持
- **引用复用逻辑**：`oldById` 从 produce 外的 `state.byId` 捕获（L134），传给 buildIndex 第二参数。修改过的节点 `node.data` 是新引用 → 不复用；未修改节点经 Immer 结构共享返回原引用 → 复用旧 byId 条目

`src/store/modules/designer-canvas.ts#L117-L178`

**⚠️ action creator 注释滞后**：`designer-canvas-actions.ts` L34-42 的 updateFieldConfig JSDoc 仍写"直接 patch byId[uniqueId]，**不重建 components 数组**"——与 reducer 单源实现矛盾（reducer 实际改 components 树 + buildIndex 重建）。这是双源时代旧注释未更新。

### 2.4 写路径 3：setState（框架名 setState）

- **action.type**：`'designerCanvas/setState'`
- **reducer 实现**：**浅合并**语义。`Object.assign(draft, safePayload)` 在 Immer produce 内执行。`safePayload` 是 payload 过滤掉 byId/parentMap 后的浅拷贝
- **byId 防护（P0 测试）**：
  1. 检测 + 告警（L91-93）：`if ('byId' in payload || 'parentMap' in payload)` → `console.error`。**用 `'in'` 操作符**（遍历原型链，隐 bug 未修）
  2. 降级删除（L97-99）：`delete safePayload.byId; delete safePayload.parentMap;` —— 从副本删除，不 throw
- **防护性质**：**键存在性防护**，不检查 `payload.byId === state.byId` 引用是否一致。只要外部试图通过 setState 传 byId（无论引用是否相同），都会被 console.error + 删除
- **含 components 时**：`hasComponents = Object.prototype.hasOwnProperty.call(payload, 'components')`（L95，**这里用 hasOwnProperty**），若 true 则 produce 后 `buildIndex` 重建并返回 `{ ...intermediate, byId, parentMap }`；否则直接返回 `intermediate`（byId/parentMap 保持原引用不变）
- **边界降级**：payload 为 undefined → 代码无显式防护，`'byId' in undefined` 会抛 TypeError（依赖调用方约束）

`src/store/modules/designer-canvas.ts#L81-L110`

### 2.5 写路径契约文档对照

`02-write-path.md` 声称的三条写路径与代码实测**完全一致**：

| 写路径 | 文档声称 | 代码实测 | 一致性 |
|---|---|---|---|
| 结构性变更 | setComponents：直接赋值 + buildIndex | L75-79 | ✅ |
| 字段级更新 | updateFieldConfig：Immer produce 改树 + buildIndex 引用复用 | L137-177 | ✅ |
| 批量字段更新 | setState：Object.assign + 含 components 时 buildIndex | L101-108 | ✅ |

**描述性偏差（非实质错误）**：
1. `designer-canvas-actions.ts` L34-42 updateFieldConfig JSDoc 滞后（源码内部注释，非文档错误）
2. `02-write-path.md` §5 L85 注释"修 'components' in 隐 bug"描述不精确：byId/parentMap 检测（L91）仍用 `'in'`，只有 `hasComponents`（L95）用 hasOwnProperty
3. `02-write-path.md` §0 L15"setState 含 components 时走 setComponents 逻辑"表述不严谨：setState 在自己 case 内调 buildIndex，不走 setComponents case，语义等价但代码路径独立
4. 行号微偏：文档 §4 L97-100 说边界检查 L129-132，实测 L130-132（L129 是注释行）

---

## 3. 读路径三分法 + 字段级订阅

### 3.1 字段级订阅 hook：useFieldConf

`src/store/designer/hooks.ts#L86-L90`

```ts
export const useFieldConf = (uniqueId: string) =>
    useSelector(
        (s: RootReducerState) => s.designerCanvas.byId[uniqueId],
        shallowEqual,
    );
```

- **签名**：`useFieldConf(uniqueId: string)` → `FlatField | undefined`
- **订阅目标**：`state.designerCanvas.byId[uniqueId]`（FlatField，不含 children）
- **shallowEqual**：是，useSelector 第二参数
- **适用范围**（注释 L70-85）：✅ designer-field 渲染 / 配置面板读当前组件；❌ layer-manager 读父节点 children（用 getFieldNodeById）/ useOnDrop 读父节点 children
- **调用方**：`designer-field/index.tsx` L58、`configuration-panel/index.js` L22
- **shallowEqual 生效机制**：配合 buildIndex 引用复用（utils.ts L680 `oldEntry.data === node.data`），未修改 data 的节点复用旧 byId 条目 → shallowEqual 命中引用相等 → 跳过 re-render → 字段级订阅粒度

### 3.2 useUpdateFieldConfig hook

`src/store/designer/hooks.ts#L102-L110`

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

- **签名**：`useUpdateFieldConfig()` → `(uniqueId: string, patch: any) => void`
- **dispatch 的 action**：`updateFieldConfig(uniqueId, patch)` → `{ type: 'designerCanvas/updateFieldConfig', payload: { uniqueId, patch } }`（字符串 action.type，非 RTK createSlice）
- **action creator**：`src/store/modules/designer-canvas-actions.ts#L43-L46`
- **调用方**：`DesignerContent.tsx` L502、`configuration-panel/component/index.jsx` L48、`configuration-panel/group/index.js` L18

### 3.3 useFlatComponents / 整树订阅

`src/store/designer/hooks.ts#L189-L193`

```ts
export const useFlatComponents = () => {
    const components = useSelector((s: RootReducerState) => s.designerCanvas.components, shallowEqual);
    const flatComponents = useMemo(() => flatDesignerList(components), [components]);
    return [flatComponents] as const;
};
```

- **签名**：`useFlatComponents()` → `[flatComponents] as const`（**不是** `[flatComponents, forceUpdate]`，旧 forceUpdate 已删）
- **订阅目标**：`state.designerCanvas.components`（整树）
- **shallowEqual**：是
- **整树订阅点（useSelector + components + shallowEqual）实测**：
  - `canvas-graph/index.tsx` L115
  - `aside-panel/layers-tree/tree/index.tsx` L28（同时 L30 还订阅 byId）
  - `configuration-panel/group/index.js` L21

### 3.4 getFieldNodeById 工具函数

`src/designer/renderer/utils.ts#L141-L150`

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

- **签名**：`getFieldNodeById(components: any[], uniqueId: string)` → `any | null`
- **读取方式**：**递归遍历 components 树**（不读 byId，因为 byId 不存 children）。同步、纯函数、无副作用
- **返回**：完整节点（含 children）的浅引用，禁止 mutation
- **与 byId 的区别**（注释 L124-135）：`byId[id]` 返回 FlatField（不含 children）O(1)；`getFieldNodeById` 返回完整节点 O(n)
- **调用场景**（需 children 时）：`DesignerContent.tsx` L296（recalcGroupBounds 读父组）、`utils.ts` L441/L449/L491（generatorGroup/splitGroup）、`useConvertMenuState.tsx` L32

### 3.5 跨异步边界读路径（latestCache.current 模式）

项目中有两类 ref 缓存模式：

#### 3.5.1 latestCache 模式（DesignerContent 核心）

`src/designer/DesignerContent.tsx#L190-L211`（定义）、L414-421（使用）

```ts
const latestCache = useRef({
    get selected() { return reduxStore.getState().component.selected; },
    get state() { return reduxStore.getState().designerCanvas; },
    configValidator, customFieldsListManager, realtimeDataFlowManager,
});
```

- **缓存内容**：用 **getter** 形式缓存 `reduxStore.getState()` 的同步读取器（`selected` / `state`），以及 `configValidator` / `customFieldsListManager` / `realtimeDataFlowManager`
- **异步场景**：L414 `window.addEventListener('keydown', handleDelete)` 事件回调内读 `latestCache.current.state`；L245 `getDataFunc().then(...)` Promise 回调内读 `latestCache.current.configValidator`
- **本质**：getter 模式意味着每次访问 `.state` / `.selected` 都重新调 `reduxStore.getState()`，是"同步读 store"的语法糖，不是缓存快照值

#### 3.5.2 designer-field latestCache

`src/designer/renderer/designer-field/index.tsx#L107-L111`

- 缓存 `{ dataSource, nextPosition? }`，在 L195 `onDragStopHandle`（Rnd 拖拽停止回调）内读 `latestCache.current.dataSource`（避免闭包捕获过期 dataSource）

#### 3.5.3 useLatest hook 封装

`src/hooks/useLatest.tsx#L1-L10`：`useRef(value)` + 每次 render `ref.current = value`

使用点：`FedxReportContext.tsx` L79、`RealtimeDataFlow.ts` L198、`useDesignerSnapshot.ts` L27、`context-meta-human/core.tsx` L114——在 Promise/effect 内读最新 props/回调

### 3.6 同步读 store.getState()

多处用 `useStore<any>()` 拿 store 后在事件回调/effect 内 `store.getState().designerCanvas.*` 同步读。实测调用点（排除 .bak）：

| 文件 | 行号 | 场景 | 读什么 |
| --- | --- | --- | --- |
| `DesignerContent.tsx` | L192/L195/L203/L206 | latestCache getter | `getState().component.selected` / `getState().designerCanvas` |
| `DesignerContent.tsx` | L289-290 | subscribe 回调 | `getState().designerCanvas` / `getState().component.selected` |
| `DesignerContent.tsx` | L332/L350/L381/L471 | saveMethod/handleSave/getState/refreshData | `getState().designerCanvas` |
| `designer-field/index.tsx` | L70/L124/L224 | 事件回调 | `getState().designerCanvas.components` / `.byId` / `getState().component.selected` |
| `canvas-graph/index.tsx` | L319/L329 | handleAlign | `getState().designerCanvas.byId[item]` / `.designerCanvas` |
| `layers-tree/tree/index.tsx` | L94 | onSelect（注释 L93 明确"不能在事件回调里调 useSelector"） | `getState().designerCanvas` |
| `useOnDrop.ts` | L79/L128 | onDrop | `getState().designerCanvas.parentMap` |
| `drag2layoutBlock.ts` | L40 | 拖拽辅助 | `getState().designerCanvas.parentMap` |
| `useConvertMenuState.tsx` | L31 | convertMenuState | `getState().designerCanvas` |
| `hooks.ts` | L164 | useCustomFieldsList.get | `store.getState().designerCanvas.customFieldsListMapping` |

### 3.7 保存序列化读路径

`src/designer/DesignerContent.tsx#L344-L373`（handleSave）

```ts
// L350-363
const designerState = reduxStore.getState().designerCanvas;
const params = {
    config: JSON.stringify({
        page: designerState.page,
        // task-003：单源后 components 树永远 fresh，直接序列化即可
        components: designerState.components,
        realtimeDataFlow: designerState.realtimeDataFlow ?? [],
        customFieldsListMapping: {},
    }),
    ...
};
```

- **主保存入口**：handleSave（L344）—— 保存按钮 / Ctrl+S（L387-398）/ 自动保存（L401-408 setInterval）
- **saveMethod**（L330）：onSave 回调或 visualManageApi.save
- **useImperativeHandle.getState**（L375-384）：外部 `designerRef.current.getState()` 拿 state 后自行序列化
- 单源后直接读 `designerState.components` 序列化，`getSaveableComponents` 已删（AGENTS.md §10.2 禁区）

### 3.8 读路径契约文档对照

`03-read-path.md` 与代码实测整体**高度一致**。发现的不一致：

1. **§3.3 保存点 #2 路径失效**：文档声称 `src/designer/toolbar/comp/saveAsTemp-modal/index.tsx` 存在"存为模板"保存点，Glob 实测无匹配。文件已删除或路径迁移，文档滞后
2. **§5 易错点"不带 shallowEqual 后果"描述可能滞后**：单源后 updateFieldConfig reducer 实测会触发 components 引用变化（produce 改树后 components 是新引用），需对照 reducer 验证文档"byId 变化触发整树 reconcile"的描述

---

## 4. 现有测试基线

### 4.1 test-utils.ts 工厂函数

`src/__tests__/test-utils.ts#L1-L66`

| 工厂函数 | 签名 | 行号 | 用途 |
| --- | --- | --- | --- |
| `makeNode` | `(uniqueId, config={}, extra={}) => node` | L12-L17 | 构造组件节点（带 data.config，可选 children） |
| `makeGroup` | `(uniqueId, config, children) => node` | L20-L25 | 构造 group 节点（含 children，type='group'） |
| `createTestState` | `(components=[], extra={}) => DesignerCanvasState` | L31-L40 | 构造测试 state，自动 `buildIndex(components, undefined)` 重建 byId/parentMap |
| `dispatchSequence` | `(reducer, initial, actions) => DesignerCanvasState` | L46-L48 | 对 reducer 依次 dispatch 一串 action |
| `getByIdEntry` | `(state, id) => FlatField \| undefined` | L54-L56 | 取 byId 条目 |
| `expectDataRefEqual` | `(state, id, expectedData) => boolean` | L59-L62 | 断言某 id 的 byId 条目 data 引用与期望一致（引用复用验证） |

re-export：`ROOT_UNIQUE_ID, buildIndex, designerCanvasReducer`，类型 `DesignerCanvasState, FlatField`（L64-L66）

### 4.2 P0/P1/P2 测试文件

| 测试文件 | 主题 | 关键用例 |
| --- | --- | --- |
| `src/designer/renderer/__tests__/utils-buildIndex.spec.ts` | **P0 buildIndex 引用复用** | 未改节点 byId data 引用一致；被改节点 data 引用不同；parentMap；跳过无 uniqueId；不遍历 drillDown；空树不抛错 |
| `src/store/modules/__tests__/designer-canvas-updateFieldConfig.spec.ts` | **P0 updateFieldConfig 边界** | 不存在 uniqueId 静默 return；空 patch no-op；ROOT 防护；正常 patch 浅合并；patch.config 嵌套浅合并；引用复用；parentMap 不一致返回原 state |
| `src/store/modules/__tests__/designer-canvas-setState.spec.ts` | **P0 setState byId 防护** | payload 含 byId → console.error + 删除；含 parentMap；同时含两者报错一次；含 components 直接替换+buildIndex；不含 components 不重建 |
| `src/designer/__tests__/recalcGroupBounds.spec.ts` | **P1 Bug #2 + P2 简化** | 组位置/尺寸计算；源码契约（不含 freshChildNodes/skipGroupRecalc）；含 isRecalcRef 重入防护；recalcGroupInTree 一致性 |
| `src/designer/renderer/designer-field/__tests__/useFieldConf-propsValue.spec.ts` | **P1 Bug #3 propsValue** | useMemo 依赖含 children；结构变更 propsValue 重算；字段级更新 data 引用变化 propsValue 重算；未触及节点 propsValue 不重算 |
| `src/store/modules/__tests__/designer-canvas-setComponents.spec.ts` | **P2 单源 + 已删 API 扫描** | draft.components === action.payload；buildIndex 派生；旧 byId 不合并（fieldPreserve 已删）；utils.ts 不含已删 API |
| `src/designer/renderer/designer-field/__tests__/getResizedComponents.spec.ts` | **Bug #1 回归** | getResizedComponents（8 用例） |
| `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts` | **Bug #2 回归** | useOnDrop trigger（10 用例） |

---

## 5. 5 大反模式 + 已删 API + .bak 排除清单

### 5.1 5 大反模式（04-principles.md §0.2）

`.trae/skills/oss-visual-designer-project-context/design/src/designer-state/04-principles.md#L18-L24`

| # | 反模式 | 行号 | 一句话描述 |
| --- | --- | --- | --- |
| 1 | 直接 mutation | L20 | 禁止直接 mutation state / byId / components / props 引用 |
| 2 | 滥用 cloneDeep | L21 | 仅在 resetUniqueId/generatorField/fetchMaterialSchema 等结构性变更用，高频路径扛不住 10-50ms 整树克隆 |
| 3 | EventBus 反模式 | L22 | runtimeComponentsTrigger 等已删，禁止新增 EventBus 做画布状态通知 |
| 4 | Context + 全量 setState | L23 | useDesigner 兼容壳已删，禁止用 React Context + useState + Immer 管理画布树 |
| 5 | 循环依赖 setState | L24 | recalcGroupBounds 内 setState 触发 subscribe 必须 isRecalcRef 防重入 |

详细展开：禁区 1（§5，L166-191）/ 禁区 2（§6，L195-233）/ 禁区 3（§7，L237-262）/ 禁区 4（§8，L265-290）/ 禁区 5（§9，L294-320）

### 5.2 已删 API grep 清单

**5 大已删 API**（task §4.2 要求 grep 命中则 fail）：

| API | 活代码命中 | 注释/测试命中 | 结论 |
| --- | --- | --- | --- |
| `mergeByIdIntoTree` | 0 | designer-canvas.ts L70/L83/L84/L120 注释；setComponents.spec.ts 负向断言 | **已删** |
| `getSaveableComponents` | 0 | 全仓 0 命中 | **已删** |
| `patchFieldConf` | 0 | designer-canvas.ts L163 注释；utils.ts L8 注释 | **已删** |
| `fieldPreserve` | 0 | DesignerContent.tsx L306/L307 注释；setComponents.spec.ts 负向断言 | **已删** |
| `dirtyConfigKeys` | 0 | setComponents.spec.ts L123/L124/L136/L139 负向断言 | **已删** |

**扩展已删 API**（AGENTS.md §10.2）：

| API | 活代码命中 | 结论 |
| --- | --- | --- |
| `useDesigner`（词边界） | 0（15 文件注释） | **已删** |
| `DesignerContext` / `DesignerContext.Provider` | 0 定义（context-designer/Designer.tsx 已清空） | **已删**（注意：`DesignerContextMenu` 是活代码，非 Context，grep 误匹配） |
| `useDesignerSettingChange` | 0（3 文件注释） | **已删** |
| `getFieldConf`（词边界） | 0（16 文件注释） | **已删** |
| `getParent`（词边界） | 0（8 文件注释） | **已删** |
| `useDebounceMergeConfig` | 0（5 文件注释） | **已删** |
| `useLevelPath` | 0（全仓 0 命中） | **已删** |
| `runtimeComponentsTrigger` | 0（DataProvider.tsx L5 注释） | **已删** |
| `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` | 0（仅测试负向断言） | **已删** |
| `undo` / `redo`（src 下） | 0（public/static 第三方资源误匹配，须排除） | **已删**（死字段，从未实现） |

**⚠️ setLevelPath 不是已删 API**：活代码，定义在 `src/designer/renderer/utils.ts#L152-L178`，被 layer-manager 等 3 文件调用。05-deleted-api.md §4 明确澄清。框架重写时不得列入已删除清单。

### 5.3 .bak 备份文件清单（Glob `**/*.bak*` 验证，共 8 个）

| # | 完整路径 | 所在目录 |
| --- | --- | --- |
| 1 | `src/designer/renderer/utils.bak.js` | renderer |
| 2 | `src/designer/renderer/GeneratorWidget.bak.js` | renderer |
| 3 | `src/designer/renderer/DesignerField.bak.jsx` | renderer |
| 4 | `src/designer/canvas-graph/index.bak.js` | canvas-graph |
| 5 | `src/store/backup/modules-index.js.bak` | **store/backup/** |
| 6 | `src/store/backup/index.js.bak` | **store/backup/** |
| 7 | `src/store/backup/component.js.bak` | **store/backup/** |
| 8 | `src/store/backup/app.js.bak` | **store/backup/** |

**grep 排除规则**：验证已删 API 时必须排除这 8 个文件（4 个在 `src/store/backup/`，4 个散落在 renderer/canvas-graph 靠 `.bak` 后缀区分）。

### 5.4 提交前自检清单 + React.memo + Immer frozen

**提交前自检清单**（04-principles.md §10，L324-362）：
- §10.1 数据流正确性：渲染路径用 useFieldConf/useSelector+shallowEqual；异步回调用 getState() 同步读；保存直接序列化 components
- §10.2 不可变契约：无 state.xxx= 直接 mutation；无 byId[id].data= mutation；无 parents.children.push；无 Object.assign(components) 整树替换；修改一律走 dispatch
- §10.3 无反模式：无 cloneDeep(components) 整树克隆（除非 resetUniqueId/generatorField）；无新增 EventBus；无新增 useDesigner 兼容壳；无新增 runtimeComponentsTrigger
- §10.4 性能：整树 useSelector 配 shallowEqual；DesignerField 配 React.memo；拖拽期间避免整树 dispatch；嵌套 subscribe 回调用 ref 防重入
- §10.5 文档：新增 action 更新 02-write-path.md；加新读法更新 03-read-path.md；修 bug 更新 06-bugs-and-tests.md；引入新原则更新 04-principles.md；删除 API 更新 05-deleted-api.md

**React.memo 约定**（04-principles.md §3.4，L116-125）：画布高频组件必须 `React.memo`（如 `export default React.memo(DesignerField)`）

**Immer frozen 语义**（04-principles.md §2.2，L54-62）：components/byId/parentMap 三个字段都是 Immer frozen（递归只读），任何直接 mutation 抛 `TypeError: Cannot assign to read only property 'x'`。这是不可变契约的运行时保障

---

## 6. 25 bug × 6 能力覆盖矩阵

### 6.1 25 bug 清单

依据 `06-bugs-and-tests.md` §0 速查表。**所有 bug 均已修复 🟢**。

**⚠️ 分类差异说明**：task §2.3 将 #15、#18 归入"UI 事件类"，但 06 速查表实际描述分别为"byId 索引缺 children 节点"（结构性）与"splitGroup 递归爆栈"（运行时）。按事实优先级（代码/06 文档 > task 文档），本文档以 06 速查表分类为准，并在矩阵中相应判定。

| # | 一句话描述 | task §2.3 归属 | 06 速查表实际核对 | 根因（据速查表归纳） | 状态 | 测试文件 |
|---|---|---|---|---|---|---|
| 1 | setComponents 路径改名丢失 | 结构性 | ✓ | 旧 mergeByIdIntoTree 按 id 合并覆盖；单源无覆盖 | 已修复 | setComponents.spec.ts（间接） |
| 2 | handleAlign 多选对齐 pre-existing | 结构性 | ✓ | 对齐多次写树；改方案 B 单次 setComponents | 已修复 | — |
| 3 | setLevelPath 丢弃返回值 | 运行时 | ✓ | 写路径丢弃 reducer 返回值 | 已修复 | — |
| 4 | drag2layoutBlock updateFieldConfig 不同步 | 结构性 | ✓ | updateFieldConfig 未触发 buildIndex；单源改树+buildIndex | 已修复 | updateFieldConfig.spec.ts（间接） |
| 5 | useDesignerSettingChange 高频 path 不走 React | 已删 API | ✓ | 高频更新绕过 React 订阅 | 已删 API | —（静态扫描） |
| 6 | runtimeComponentsTrigger EventBus | 已删 API | ✓ | 跨组件通信走 EventBus | 已删 API | —（静态扫描） |
| 7 | useDebounceMergeConfig 30ms 防抖 | 已删 API | ✓ | 30ms 防抖合并导致 stale | 已删 API | —（静态扫描） |
| 8 | useSyncDesignerUpdate 全局通知 | 已删 API | ✓ | 全局通知同步 designer update | 已删 API | —（静态扫描） |
| 9 | layer-manager mutation（splice/push） | 运行时 | ✓ | layer-manager 直接 mutation state | 已修复 | — |
| 10 | configuration-panel/page render 内 mutation | 运行时 | ✓ | render 内直接 mutation state | 已修复 | — |
| 11 | designer-field parents.children mutation | 结构性 | ✓ | designer-field 内 mutation parents.children | 已修复 | — |
| 12 | getFieldConf/getParent cloneDeep 滥用 | 已删 API | ✓ | cloneDeep 破坏引用复用 + 性能 | 已删 API | —（静态扫描） |
| 13 | handleAlign 闭包覆盖 | 结构性 | ✓ | 闭包捕获 stale components；单源闭包永远 fresh | 已修复 | — |
| 14 | setState 丢弃字段 | 结构性 | ✓ | setState 浅合并丢弃字段；拆分 setComponents+setState | 已修复 | setState.spec.ts |
| 15 | splitGroup/generatorGroup byId 不含 children | **UI 事件（task）** | ❌ **结构性**（索引缺 children） | byId 未含 group children 节点；签名扩展 | 已修复 | — |
| 16 | 组点击不到 | UI 事件 | ✓ | group 选中事件处理缺陷 | 已修复 | — |
| 17 | 改名丢失 | 结构性 | ✓ | 改名后写树覆盖；单源根本解决 | 已修复 | setComponents.spec.ts（间接） |
| 18 | 组内成组爆栈 | **UI 事件（task）** | ❌ **运行时**（递归爆栈） | splitGroup 递归无终止条件 | 已修复 | — |
| 19 | 组内对齐跳变 | 结构性 | ✓ | 组内对齐坐标计算 + 闭包 stale | 已修复 | — |
| 20 | 保存丢失 | 结构性 | ✓ | 保存时读 stale components；单源永远 fresh | 已修复 | setComponents.spec.ts（间接） |
| 21 | 拖拽组内子组件组尺寸不更新 | 结构性 | ✓ | recalcGroupBounds 读 stale parents.children | 已修复 | recalcGroupBounds.spec.ts（间接） |
| 22 | mutation 残留 + cloneDeep 滥用 | 结构性 | ✓ | 剩余 mutation + cloneDeep；清理为不可变 | 已修复 | useFieldConf-propsValue.spec.ts |
| 23 | stale tree 防御性读取未统一封装 | 结构性 | ✓ | 各处散落 stale 防御性读取；单源+updateField+getFieldNodeById 统一封装 | 已修复 | updateFieldConfig.spec.ts（间接） |
| 24 | layout-block onResize 子组件不级联缩放 | 运行时 | ✓ | getResizedComponents 取不到带 children 节点；改用 getFieldNodeById | 已修复 | getResizedComponents.spec.ts |
| 25 | tree 拖拽节点入组/出组后组尺寸不更新 | 运行时 | ✓ | useOnDrop trigger 未追加 dispatch(component/selected)+recalcGroupInTree | 已修复 | useOnDrop.spec.ts |

### 6.2 25 × 6 能力覆盖矩阵

6 项核心 API（task §2.1）：`createTreeStore` / `useField` / `useTree` / `updateField` / `setTree` / `getFieldNodeById`

图例：✅ 框架直接覆盖 / ⚠️ 间接覆盖（单源架构自带）/ ❌ 与状态框架无关 / 🚫 已删 API（只能静态扫描）

| # | createTreeStore | useField | useTree | updateField | setTree | getFieldNodeById |
|---|---|---|---|---|---|---|
| 1 | ⚠️ 单源无 mergeByIdIntoTree 覆盖 | ❌ | ❌ | ❌ | ✅ setTree 直接赋值无合并覆盖 | ❌ |
| 2 | ⚠️ 单源闭包 fresh 消除 pre-existing | ❌ | ❌ | ❌ | ✅ 单次 setTree 预防多次写覆盖 | ❌ |
| 3 | ⚠️ 单源 set 返回值统一 | ❌ | ❌ | ❌ | ✅ setTree 统一返回新 state | ❌ |
| 4 | ⚠️ 单源改树+buildIndex 永远 fresh | ❌ | ❌ | ✅ updateField 改树+重建索引 | ❌ | ❌ |
| 5 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| 6 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| 7 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| 8 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| 9 | ✅ createTreeStore 强制不可变 set | ❌ | ❌ | ❌ | ⚠️ 单源不可变契约间接约束 | ❌ |
| 10 | ✅ createTreeStore 不可变契约预防 render 内 mutation | ❌ | ❌ | ❌ | ⚠️ 间接约束 | ❌ |
| 11 | ✅ createTreeStore 不可变契约预防 parents.children mutation | ❌ | ❌ | ❌ | ⚠️ 间接约束 | ❌ |
| 12 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| 13 | ⚠️ 单源闭包永远 fresh | ❌ | ❌ | ❌ | ✅ setTree 后闭包 fresh | ❌ |
| 14 | ⚠️ 单源拆分 setState/setTree 语义 | ❌ | ❌ | ✅ updateField 专管字段级 | ✅ setTree 专管结构性 | ❌ |
| 15 | ⚠️ 单源 byId 含完整 children | ❌ | ❌ | ❌ | ✅ setTree 重建 byId 含 children | ✅ getFieldNodeById 返回带 children |
| 16 | ❌ UI 事件 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 17 | ⚠️ 单源唯一真相预防改名丢失 | ❌ | ❌ | ❌ | ✅ setTree 直接赋值无合并 | ❌ |
| 18 | ⚠️ 单源架构间接约束递归 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 19 | ⚠️ 单源闭包 fresh 消除跳变 | ❌ | ❌ | ❌ | ✅ setTree 单次写树预防 stale | ❌ |
| 20 | ⚠️ 单源 components 永远 fresh | ❌ | ❌ | ❌ | ✅ setTree 后直接序列化 fresh | ❌ |
| 21 | ⚠️ 单源 parents.children 永远 fresh | ❌ | ❌ | ❌ | ✅ setTree 重建后读 fresh | ✅ getFieldNodeById 取带 children 供 recalc |
| 22 | ✅ createTreeStore 不可变契约预防 mutation 残留 | ❌ | ❌ | ❌ | ⚠️ 间接约束 cloneDeep 滥用 | ❌ |
| 23 | ⚠️ 单源 updateField+buildIndex 永远 fresh | ❌ | ❌ | ✅ updateField 统一封装消除散落读取 | ❌ | ✅ getFieldNodeById 统一封装读取 |
| 24 | ⚠️ 单源 byId 含完整 children | ❌ | ❌ | ❌ | ❌ | ✅ getFieldNodeById 取带 children 供 getResizedComponents |
| 25 | ⚠️ 单源 trigger 追加后组尺寸重算 | ❌ | ❌ | ❌ | ✅ setTree 后 recalcGroupInTree 重算 | ✅ getFieldNodeById 取节点供 recalc |

### 6.3 框架测试范围汇总

**按 task §2.3 原始分类**（#15/#18 归 UI 事件）：

| 判定 | 数量 | bug 编号 |
|---|---|---|
| ✅ 框架直接覆盖 | 5 | #3, #9, #10, #24, #25 |
| ⚠️ 间接覆盖 | 12 | #1, #2, #4, #11, #13, #14, #17, #19, #20, #21, #22, #23 |
| ❌ 与状态框架无关 | 3 | #15, #16, #18 |
| 🚫 已删 API | 5 | #5, #6, #7, #8, #12 |
| **框架测试范围（✅+⚠️）** | **17** | |

→ task §2.3 声称"✅+⚠️ 共 17 个"，**按其分类口径数量一致**。

**按 06 速查表实际描述修正后**（#15 归结构性、#18 归运行时）：

| 判定 | 数量 | bug 编号 |
|---|---|---|
| ✅ 框架直接覆盖 | 7 | #3, #9, #10, #15, #18, #24, #25 |
| ⚠️ 间接覆盖 | 12 | #1, #2, #4, #11, #13, #14, #17, #19, #20, #21, #22, #23 |
| ❌ 与状态框架无关 | 1 | #16 |
| 🚫 已删 API | 5 | #5, #6, #7, #8, #12 |
| **框架测试范围（✅+⚠️）** | **19** | |

→ 若以 06 速查表事实为准修正 #15/#18 分类，框架测试范围应为 **19 个**。**建议 task §2.3 更新分类，将 #15 归入结构性、#18 归入运行时**，相应框架测试范围从 17 扩展为 19。

---

## 7. 当前名 → 框架名映射表

### 7.1 API 映射（task §0.7 草案 + 事实核对）

| 当前 API | 框架 API | 性质 | 当前源码位置 | 核对结论 |
| --- | --- | --- | --- | --- |
| `useFieldConf` | `useField` | hook（字段级订阅） | `hooks.ts#L86-L90` | ✅ 签名/订阅目标/shallowEqual 均属实 |
| `useUpdateFieldConfig` | `useUpdateField` | hook（更新 dispatcher） | `hooks.ts#L102-L110` | ✅ |
| `updateFieldConfig` | `updateField` | store action | `designer-canvas-actions.ts#L43-L46` | ✅ |
| `setComponents` | `setTree` | store action | `designer-canvas.ts#L68-L80` | ✅ |
| `setDesignerCanvasState` / `setState` | `setState` | store action | `designer-canvas.ts#L81-L110` | ✅（action.type 实测为 `designerCanvas/setState`，框架名保留 setState） |
| `getFieldNodeById` | `getFieldNodeById` | 工具函数（保留原名） | `utils.ts#L141-L150` | ✅ 纯函数，递归遍历，不加 use 前缀 |
| `buildIndex` | `buildIndex` | 工具函数（保留原名） | `utils.ts#L664-L697` | ✅ |
| `useFlatComponents` | `useFlatTree` | hook | `hooks.ts#L189-L193` | ✅（返回 `[flatComponents] as const`，旧 forceUpdate 已删） |
| `useSelector(components, shallowEqual)` | `useTree()` | hook（整树订阅，框架内置 shallowEqual） | `canvas-graph/index.tsx#L115` 等 | ✅ |

### 7.2 8 个 action 框架映射

| 当前 action.type | 框架对应 | 分类 | 是否纳入框架核心 |
| --- | --- | --- | --- |
| `designerCanvas/setComponents` | `setTree` | 结构性变更 | ✅ 核心 |
| `designerCanvas/setState` | `setState` | 批量 | ✅ 核心 |
| `designerCanvas/updateFieldConfig` | `updateField` | 字段级 | ✅ 核心 |
| `designerCanvas/clearRuntime` | （插件：runtime data） | 其他 | ⚠️ 留给 runtime data 插件 |
| `designerCanvas/recordRealtimeDataFlow` | （插件：runtime data） | 其他 | ⚠️ 同上 |
| `designerCanvas/deleteRealtimeDataFlow` | （插件：runtime data） | 其他 | ⚠️ 同上 |
| `designerCanvas/recordCustomFieldsList` | （插件：runtime data） | 其他 | ⚠️ 同上 |
| `designerCanvas/deleteCustomFieldsList` | （插件：runtime data） | 其他 | ⚠️ 同上 |

**结论**：框架核心 API 覆盖 3 个写路径 action（setTree/setState/updateField），其余 5 个 runtime action 归入 runtime data 插件范畴。

---

## 8. 关键约束汇总（供 designer-core 子设计文档引用）

1. **单源写入路径**：所有 components 结构性变更必须经 setTree 或 setState({components})，reducer 内统一调 buildIndex 重建 byId/parentMap。字段级更新走 updateField，reducer 内改 components 树中节点 data + buildIndex 重建
2. **byId/parentMap 只读**：reducer 内无直接 mutation；setState action 内置 console.error + 降级防护（L91-L99）。**框架实现时统一用 hasOwnProperty**，修正当前 `'in'` 隐 bug
3. **buildIndex 必须在 produce 外调用**：Immer proxy 破坏 `oldEntry.data === node.data` 引用比较（L72-L74/L86/L124-L126 注释）。**框架若用 vanilla Zustand 无 Immer proxy 问题，但仍需保证引用复用的 oldById 从 set 外捕获**
4. **引用复用契约**：`oldEntry.data === node.data`（utils.ts L680）— 未改节点复用旧 byId 条目，保持 useField shallowEqual 订阅粒度
5. **recalcGroupBounds 防重入**：`isRecalcRef = useRef(false)`（DesignerContent.tsx L284），subscribe 回调内 setState 前后置位/清位（L317/L319）。**框架的 derived compute 插件应内置 ref 防重入机制**
6. **data 是浅引用**：`byId[id].data` 直接 = components 树中节点 data 引用（utils.ts L686），禁止 reducer 外修改
7. **读路径三分法**：响应式订阅（useField/useTree+shallowEqual）/ 同步读（getState()/byId[parentMap[id]]/getFieldNodeById）/ 保存序列化（直接读 components）
8. **跨异步边界读路径**：latestCache.current（getter 缓存 store 读取器）/ useLatest（ref 缓存最新 props）。**框架应提供统一的跨异步边界读 API**，避免散落 ref 模式
9. **5 大反模式约束**：直接 mutation / 滥用 cloneDeep / EventBus / Context+全量 setState / 循环依赖 setState。框架以"文档 + 静态扫描 + dev 模式 Object.freeze"约束，非运行时强制
10. **setLevelPath 是活代码**，不得列入已删除 API 清单

---

## 9. Zustand 路径实测（待补）

> task §0.6 要求阶段 1 实测 vanilla Zustand vs immer middleware。当前 `packages-next/designer-core/` 目录尚未创建（阶段 9+ 编码时建），无可运行环境。
>
> 本节为**实测计划**，待编码环境就绪后补数据。

### 9.1 实测项

1. **440 节点 tree，单字段 update，`useField(id)` 订阅方 re-render 数**
   - vanilla Zustand + 手动 buildIndex 维护引用
   - Zustand + immer middleware
   - 预期：vanilla 未改节点 0 re-render；immer middleware 若嵌套对象只改 inner field 导致外层引用变化，可能触发额外 re-render
2. **高频拖拽 dispatch 60+/s，累计耗时**
   - 同上两组
3. **结果写入本节**

### 9.2 当前性能基线（对照）

`research/refactor-single-source/baseline-2026-07-27.md#L59`：440 节点 updateFieldConfig p95 = 0.2ms。

框架阈值（task §4.2）：≤ 当前 1.2 倍 = p95 ≤ 0.24ms。

### 9.3 决策方向（task §0.6）

- **推荐 vanilla Zustand + 手动 buildIndex 维护引用**（默认路径）：与 04-principles.md 不可变契约一致；不引入 Immer 间接层；vanilla set 可精确控制引用变化范围
- **immer middleware 仅作为自定义中间件选项暴露，不作为默认**：Zustand 4.x + immer middleware 在嵌套对象只改 inner field 时外层引用会变化，与 byId 引用复用目标冲突

---

## 10. 阶段 1 review 自检

按 task §1.1 阶段 1 review 标准：

- ✅ **事实准确，无遗漏**：单源契约/buildIndex/三写路径/字段级订阅/5 大禁区/读路径三分法/测试基线均逐条提取，每条带源码行号
- ⚠️ **Zustand 实测有数据**：§9 仅计划，待编码环境就绪后补（task §0.6 要求阶段 1 实测，但目录未建无法跑；建议阶段 2 总设计 review 时作为前置条件，或单独起一个最小可运行 spike）
- ✅ **覆盖矩阵每格有判定**：§6.2 25×6 矩阵，每格 ✅/⚠️/❌/🚫 + 一句理由
- ✅ **当前名→框架名映射表**：§7.1 含 9 行映射 + 源码核对；§7.2 含 8 action 映射
- ✅ **grep 排除清单**：§5.3 列出 8 个 .bak 文件完整路径

**发现的事实偏差（需 task 文档同步）**：
1. task §2.3 把 #15/#18 归 UI 事件类，与 06 速查表实际描述不符（§6.1 已标注）。建议修正后框架测试范围从 17 扩展为 19
2. task §1.3 说 updateFieldConfig 边界在 L129-132，实测 L130-132（L129 是注释行）
3. setState byId 防护用 `'in'` 而非 hasOwnProperty（隐 bug 未修），框架实现时应统一用 hasOwnProperty

---

## 11. 相关文档

- [task-2026-07-30-001-designer-core-framework.md](../plans/task-2026-07-30-001-designer-core-framework.md)（所属 task）
- [designer-state/00-README.md](../design/src/designer-state/00-README.md)（事实基准索引）
- [designer-state/01-data-model.md](../design/src/designer-state/01-data-model.md)（数据模型权威）
- [designer-state/02-write-path.md](../design/src/designer-state/02-write-path.md)（写路径权威）
- [designer-state/03-read-path.md](../design/src/designer-state/03-read-path.md)（读路径权威）
- [designer-state/04-principles.md](../design/src/designer-state/04-principles.md)（5 大禁区来源）
- [designer-state/05-deleted-api.md](../design/src/designer-state/05-deleted-api.md)（已删 API 速查）
- [designer-state/06-bugs-and-tests.md](../design/src/designer-state/06-bugs-and-tests.md)（25 bug 归档）
- [research/refactor-single-source/baseline-2026-07-27.md](./refactor-single-source/baseline-2026-07-27.md)（性能基线）
