# designer-core 框架总纲（00-overview）

> 状态：`阶段 2 产出，待 review（最严）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/done/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md)（阶段 1 产出，已 review 通过）
> 定位：**锁定目标/边界/能力矩阵 + 6 项核心 API 契约签名草案**。一旦本文档通过 review，后续 5 份子设计文档以本文档为对照标准。

---

## 0. 文档定位与 review 标准

本文档是 designer-core 框架的**总纲**。定义"框架是什么、不是什么"，锁定目标与边界，给出 6 项核心 API 的契约签名草案（哪怕用 `// 草案` 标注），并列出能力矩阵覆盖 25 bug 场景。

**review 标准（task §1.1 阶段 2，最严）**：
1. 目标清晰、边界明确
2. 6 项 API 签名草案完整
3. 能力矩阵覆盖 25 bug 场景
4. 与当前事实映射可溯源（每条对照 fact-extraction.md 章号 + 源码行号）
5. 抽象决策记录表无空白格（task §5.1 风险缓解）

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。本文档所有契约声明对照 [fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) 验证。

---

## 1. 框架是什么

### 1.1 一句话定义

designer-core 是一个**低代码可视化编辑器的状态管理框架**，提供"树 + 索引 + 订阅 + 插件"的骨架，技术载体为 Zustand + 插件机制，从当前 oss-visual-designer 项目的 Redux + Immer 单源架构沉淀而来。

### 1.2 核心命题

把当前项目已验证的 4 个架构思想抽象为普遍意义的框架：

| 架构思想 | 当前实现（fact-extraction 章号） | 框架抽象 |
| --- | --- | --- |
| 单源契约（components 唯一真相，byId/parentMap 派生只读） | §1.1-1.3 | `createTreeStore` 强制 components 真相源 + byId/parentMap 派生 |
| buildIndex 引用复用（`oldEntry.data === node.data`） | §1.5 | `buildIndex` 工具函数保留，框架内建引用复用 |
| 三条写路径（结构性/字段级/批量） | §2.2-2.4 | `setTree` / `updateNode` / `setPartialState` 三个 API |
| 字段级订阅（useFieldConf + shallowEqual） | §3.1 | `useNode(id)` + `useTree()` |

### 1.3 不做什么（非目标，task §2.2）

- ❌ 不迁移当前项目到框架（当前 `src/` 不改一行，作为验证载体）
- ❌ 不实现 undo/redo（当前项目从未实现，框架也不做）
- ❌ 不实现持久化（当前 `whitelist = []`，框架留接口不实现）
- ❌ 不封装具体物料类型 / group 算法 / page 配置
- ❌ 不纳入 hox `useComponentsInfo`（维持现状）
- ❌ 不实现 EventBus / Context 管理画布树（5 大反模式禁区，fact-extraction §5.1）

> **未来方案备忘**：若需 undo/redo，推荐树级快照方案（存 `getState().components` 序列化字符串 + 操作 message），而非 command pattern。Tango 的 `TangoHistory` 已验证此方案可行（100 条上限，文件级代码快照）。框架可提供 `createHistoryPlugin`（cross-slice-sync 类型），在 subscribe 回调中 push 快照。

---

## 2. 普遍意义边界（抽象 vs 留给业务）

> 对照 task §0.4 + fact-extraction §8 关键约束汇总。每行"抽象到框架"必须有 fact-extraction 事实依据。

### 2.1 抽象到框架

| 抽象项 | 事实依据（fact-extraction 章号 + 源码行号） | 框架实现 |
| --- | --- | --- |
| 单源契约（components 唯一真相，byId/parentMap 派生只读） | §1.1（state 8 字段）/ §1.2（赋值点）/ §1.3（无 mutation） | `createTreeStore` 强制 |
| buildIndex 引用复用算法 | §1.5（utils.ts L664-697，`oldEntry.data === node.data` L680） | `buildIndex` 工具函数 |
| 三条写路径（结构性/字段级/批量） | §2.1-2.4（designer-canvas.ts L68-110, L117-178） | `setTree` / `updateNode` / `setPartialState` |
| 字段级订阅 hook + shallowEqual | §3.1（hooks.ts L86-90） | `useNode(id)` |
| 整树订阅 hook + shallowEqual | §3.3（hooks.ts L189-193） | `useTree()` |
| 读路径三分法（订阅/同步读/序列化） | §3.1-3.7 | `useNode` / `getState` / `getNodeById` |
| 跨异步边界读路径（latestCache 模式） | §3.5（DesignerContent.tsx L190-211） | 框架提供统一 API |
| 5 大反模式约束（文档+静态扫描+dev Object.freeze） | §5.1（04-principles.md L18-24） | `05-principles.md` 子设计 |
| 复制/粘贴走 setTree（结构性变更） | §2.2（setComponents 直接赋值） | `setTree` |
| derived compute 防重入（recalcGroupBounds 模式） | §1.6（DesignerContent.tsx L276-328，isRecalcRef L284） | derived compute 插件内置 ref 防重入 |

### 2.2 不抽象（留给业务）

| 留给业务项 | 事实依据 | 理由 |
| --- | --- | --- |
| `FIELD_COMP_TYPES` 枚举 | 业务物料类型 | 框架只提供树骨架，不感知物料类型 |
| `PageConfig` 字段 | fact-extraction §1.1（page 字段 L28-29） | 业务页面配置，框架只存不解释 |
| group bounds 重算算法 | fact-extraction §1.6（recalcGroupBounds） | 业务算法，框架只提供 derived compute 插件机制 |
| `customFieldsListMapping` 序列化策略 | fact-extraction §1.1（L32-33） | 业务序列化，框架只存不解释 |
| `realtimeDataFlow` 业务语义 | fact-extraction §1.1（L30-31） | 业务实时数据，框架只提供 runtime data 插件机制 |
| 具体物料类型 | — | 框架不感知 |
| hox `useComponentsInfo`（18 文件） | task §0.4 | 维持现状，不纳入框架 |
| 复制/粘贴业务逻辑 | — | 框架只提供 setTree 写路径，业务逻辑由业务实现 |
| 选中/拖拽/放置目标 | 这三者是 UI 交互模型，不是树状态管理。混入 `TreeStoreState` 会导致画布缩放等高频操作触发组件树订阅者。 | Tango 的 `SelectSource` / `DragSource` / `DropTarget` 三件套模式（独立 observable，持有 workspace 引用派生节点，不冗余存储节点引用） |

---

## 3. 抽象决策记录表（task §5.1 风险缓解）

> 每行「抽象 → 事实依据（行号）→ 边界场景」。任何一格空白 → 拒绝通过。

| # | 抽象项 | 事实依据（源码行号） | 边界场景（不抽象的部分） | 决策 |
| --- | --- | --- | --- | --- |
| 1 | 单源契约 | designer-canvas.ts L22-L27（components 真相源 / byId·parentMap 派生） | appScopeId/page/realtimeDataFlow/customFieldsListMapping/meta 是业务数据，框架只存不解释 | ✅ 抽象 components+byId+parentMap 三字段契约；业务数据泛型化 |
| 2 | buildIndex 引用复用 | utils.ts L664-697（`oldEntry.data === node.data` L680） | drillDown 不遍历（L653-656）；data 是浅引用禁止外改（L658-662） | ✅ 抽象算法；drillDown/data 浅引用约束作为契约文档化 |
| 3 | setTree（结构性） | designer-canvas.ts L68-80（直接赋值 + buildIndex） | 空数组防护在调用方不在 reducer（fact-extraction §2.2） | ✅ 抽象直接赋值语义；空数组防护由业务调用方负责 |
| 4 | updateNode（字段级） | designer-canvas.ts L117-178（parentMap 反向追踪 + find + patch data） | patch.config 二次浅合并（L168）；MAX_DEPTH=100（L147） | ✅ 抽象字段级更新；patch 合并语义 + 深度限制作为契约 |
| 5 | setState（批量） | designer-canvas.ts L81-110（Object.assign + byId 防护） | byId 防护用 'in' 隐 bug（L91），框架改用 hasOwnProperty | ✅ 抽象浅合并语义；byId 防护修正为 hasOwnProperty |
| 6 | useNode 订阅 | hooks.ts L86-90（byId[id] + shallowEqual） | byId 不含 children，需 children 用 getNodeById | ✅ 抽象字段级订阅；children 读取走 getNodeById |
| 7 | useTree 订阅 | hooks.ts L189-193（components + shallowEqual + useMemo flat） | flatDesignerList 是业务扁平化，框架只提供 components 订阅 | ✅ 抽象整树订阅；扁平化由业务 useMemo |
| 8 | getNodeById | utils.ts L141-150（递归遍历，返回带 children） | O(n) 非索引读，禁止 mutation | ✅ 抽象工具函数保留原名；O(n) 性能特征文档化 |
| 9 | 跨异步边界读路径 | DesignerContent.tsx L190-211（latestCache getter） | useLatest（hooks/useLatest.tsx）是通用 ref，非 designer 特有 | ✅ 框架提供统一 API；useLatest 模式作为读路径契约 |
| 10 | derived compute 防重入 | DesignerContent.tsx L276-328（isRecalcRef L284） | recalcGroupBounds 算法本身是业务 | ✅ 抽象 ref 防重入机制；算法由业务插件实现 |
| 11 | 5 大反模式约束 | 04-principles.md L18-24 | Object.freeze 是 dev 模式约束，非运行时强制 | ✅ 文档 + 静态扫描 + dev Object.freeze 三层约束 |
| 12 | runtime data 插件 | designer-canvas.ts L111-212（5 个 runtime action） | realtimeDataFlow/customFieldsListMapping 业务语义 | ✅ 抽象插件机制；业务语义由业务插件实现 |

**12 行全部填满，无空白格**。

---

## 4. 能力矩阵（覆盖 25 bug 场景）

> 对照 [fact-extraction.md §6](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) 25 bug × 6 能力覆盖矩阵。修正后分类：结构性 13 / UI 事件 1 / 运行时 6 / 已删 API 5。

### 4.1 6 项核心 API

| API | 性质 | 对应当前 API | fact-extraction 章号 |
| --- | --- | --- | --- |
| `createTreeStore` | store factory | Redux `combineReducers` + `designerCanvasInitialState` | §1.1 |
| `useNode(id)` | hook（字段级订阅） | `useFieldConf` | §3.1 |
| `useTree()` | hook（整树订阅） | `useSelector(components, shallowEqual)` | §3.3 |
| `updateNode` | store action | `updateFieldConfig` | §2.3 |
| `setTree` | store action | `setComponents` | §2.2 |
| `getNodeById` | 工具函数 | `getNodeById`（保留原名） | §3.4 |

### 4.2 25 bug 覆盖汇总

| 判定 | 数量 | bug 编号 |
| --- | --- | --- |
| ✅ 框架直接覆盖 | 7 | #3, #9, #10, #15, #18, #24, #25 |
| ⚠️ 间接覆盖（单源架构自带） | 12 | #1, #2, #4, #11, #13, #14, #17, #19, #20, #21, #22, #23 |
| ❌ 与状态框架无关 | 1 | #16 |
| 🚫 已删 API（只能静态扫描） | 5 | #5, #6, #7, #8, #12 |
| **框架测试范围（✅+⚠️）** | **19** | |

完整 25×6 矩阵见 [fact-extraction.md §6.2](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md#62-25--6-能力覆盖矩阵)。

### 4.3 插件 API（4 类，task §0.4 + fact-extraction §7.2）

| 插件类型 | 对应当前代码 | fact-extraction 章号 |
| --- | --- | --- |
| runtime data | 5 个 runtime action（clearRuntime/record+deleteRealtimeDataFlow/record+deleteCustomFieldsList） | §2.1 + §7.2 |
| derived compute（内置 ref 防重入） | recalcGroupBounds（isRecalcRef） | §1.6 |
| structure tools | generatorGroup/splitGroup/setLevelPath 等 | §3.4 调用场景 |
| cross-slice sync | updateView + extraReducers（viewCanvas/viewUI） | task §0.5 |

---

## 5. 6 项核心 API 契约签名草案

> 以下签名为**草案**，子设计文档（01-05）细化实现。标注 `// 草案` 的部分表示阶段 3-7 锁定。

### 5.1 createTreeStore

```ts
// 草案：store factory
interface CreateTreeStoreOptions<TNode, TFlat> {
    // 初始组件树
    initialComponents?: TNode[];
    // 初始业务状态（page/meta 等，泛型化）
    initialState?: Record<string, any>;
    // 插件列表
    plugins?: Plugin[];
}

interface TreeStore<TNode, TFlat, TExtra> {
    // 真相源
    components: TNode[];
    // 派生只读索引
    byId: Record<string, TFlat>;
    parentMap: Record<string, string>;
    // 业务数据（泛型化，框架只存不解释；对应当前 page/realtimeDataFlow/customFieldsListMapping/meta）
    extra: TExtra;
}

function createTreeStore<TData, TNode extends TreeNode<TData>, TFlat extends FlatNode<TData>, TExtra extends Record<string, unknown> = Record<string, unknown>>(
    options: CreateTreeStoreOptions<TNode, TFlat, TExtra>,
): TreeStoreApi<TNode, TFlat, TExtra>;
```

**契约**（对照 fact-extraction §1.1-1.3）：
- components 是唯一真相源；byId/parentMap 由 buildIndex 派生，**禁止直接赋值**（对照 designer-canvas.ts L91-99 setState 防护，框架用 hasOwnProperty 修正 'in' 隐 bug）
- 框架内建 buildIndex 调用，业务不需手动调
- 业务数据（page/meta/realtimeDataFlow 等）归入 `extra` 字段，泛型化，框架只存不解释（详见 [01-data-model.md §2.3](./01-data-model.md)）
- 泛型参数：TData 是 TNode/TFlat 的共同 data 类型约束（保证引用复用语义）；TExtra 承载业务扩展状态（详见 [01-data-model.md §5.2](./01-data-model.md)）
- `TreeStoreApi` 提供 zustand 原生基础方法：`subscribe`（订阅 state 变化，listener 第二参数为 prevState）/ `getState`（同步读）/ `getInitialState`（获取初始 state，zustand v4.5+ ReadonlyStoreApi 要求，主要供测试/调试）
- `TreeStoreApi` 还提供 `getPluginContext()`（获取插件上下文，供插件 init 使用）和 `destroy()`（销毁 store，调用所有插件的 cleanup 函数，取消订阅）

### 5.2 useNode

```ts
// 草案：字段级订阅 hook
function useNode<TFlat>(
    id: string,
): TFlat | undefined;
```

**契约**（对照 fact-extraction §3.1，hooks.ts L86-90）：
- 订阅 `state.byId[id]`（FlatField，不含 children）
- 内建 shallowEqual（对应当前 `useSelector(s => s.byId[id], shallowEqual)`）
- 组件删除时返回 `undefined`
- 需 children 时用 `getNodeById`（非 useNode）

### 5.3 useTree

```ts
// 草案：整树订阅 hook
function useTree<TNode>(
    options?: { shallow?: boolean }, // 默认 true，框架强制 shallowEqual
): TNode[];
```

**契约**（对照 fact-extraction §3.3，hooks.ts L189-193）：
- 订阅 `state.components`（整树）
- **框架强制 shallowEqual**（对应当前 `useSelector(s => s.components, shallowEqual)`，task §0.7 约定）
- 业务如需扁平化，自行 `useMemo(() => flatList(tree), [tree])`（对应当前 `flatDesignerList`）

### 5.4 updateNode

```ts
// 草案：字段级更新 action
interface UpdateNodePatch {
    [key: string]: any;
    config?: Record<string, any>; // config 字段二次浅合并
}

function updateNode(
    id: string,
    patch: UpdateNodePatch,
): void;
```

**契约**（对照 fact-extraction §2.3，designer-canvas.ts L117-178）：
- **边界降级**（对照 L130-132）：
  - `id === ROOT` → no-op（根节点不可字段更新）
  - `!parentMap[id]` → no-op（id 不存在）
  - `!patch || Object.keys(patch).length === 0` → no-op（空 patch）
- **路径查找**：parentMap 反向追踪 O(depth) + find（对照 L137-159）
- **不可变更新**：`node.data = { ...node.data, ...patch, config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config }`（对照 L164-168）
- **MAX_DEPTH = 100**（对照 L147，防止 parentMap 循环引用爆栈）
- **触发 buildIndex 重建** byId/parentMap，引用复用保持订阅粒度（对照 L176-177）
- 拖拽 onChange 一律走 updateNode（task §1.1 阶段 4 约定）

### 5.5 setTree

```ts
// 草案：结构性变更 action
function setTree(
    components: TNode[],
): void;
```

**契约**（对照 fact-extraction §2.2，designer-canvas.ts L68-80）：
- 直接赋值（不克隆、不合并、不 mergeByIdIntoTree）
- **触发 buildIndex 重建** byId/parentMap（对照 L78）
- 边界：`components` 为 undefined/空数组 → buildIndex 内 `|| []` 防护得空索引（对照 utils.ts L672/L695）。业务级空数组防护由调用方负责（fact-extraction §2.2）
- 仅在结构性变更用（拖拽 onDragStop / 成组/拆组/复制粘贴/导入）

### 5.6 getNodeById

```ts
// 保留原名，工具函数
function getNodeById<TNode>(
    components: TNode[],
    id: string,
): TNode | null;
```

**契约**（对照 fact-extraction §3.4，utils.ts L141-150）：
- 递归遍历 components 树（O(n)）
- 返回完整节点（含 children）的浅引用，**禁止 mutation**
- 纯函数，无副作用
- 与 `useNode` 区别：useNode 订阅 byId[id]（FlatField 不含 children）O(1)；getNodeById 遍历树返回完整节点 O(n)

### 5.7 setPartialState（补充，批量更新）

```ts
// 草案：批量更新 action
function setPartialState(
    payload: Partial<TreeStore<TNode, TFlat, TExtra>>,
): void;
```

**契约**（对照 fact-extraction §2.4，designer-canvas.ts L81-110）：
- **浅合并**语义（Object.assign）
- **byId/parentMap 防护**：payload 含 byId/parentMap → console.error + 删除（**框架用 hasOwnProperty 修正 'in' 隐 bug**，对照 L91-99）
- payload 含 components → buildIndex 重建（对照 L105-107）
- payload 不含 components → byId/parentMap 保持原引用不变

### 5.8 上层聚合 API（createDesigner / DesignerProvider / useDesigner）

> **注**：本节为 B8 task 后补，最初 6 份设计文档（00-05）未规划聚合层。基于 [`packages-next/designer-core/src/createDesigner.ts`](packages-next/designer-core/src/createDesigner.ts) 与 [`packages-next/designer-core/src/react/context.tsx`](packages-next/designer-core/src/react/context.tsx) 实际实现。

`createTreeStore`（§5.1）是底层 store factory，散装导出 hooks 与命令式 API。在项目中直接使用会出现"处处传 store 参数 / 跨模块传递困难"问题。`createDesigner` 在其之上提供**聚合层**：一次创建，处处可用。

#### 5.8.1 createDesigner

```ts
function createDesigner<
    TData extends Record<string, any> = Record<string, any>,
    TNode extends TreeNode<TData> = TreeNode<TData>,
    TFlat extends FlatNode<TData> = FlatNode<TData>,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
>(
    options: CreateTreeStoreOptions<TData, TNode, TFlat, TExtra>,
): Designer<TData, TNode, TFlat, TExtra>;
```

**职责**：
- 创建底层 `TreeStoreApi`（调用 `createTreeStore`）
- **hooks 闭包绑定 store**：复用 [`hooks.ts`](packages-next/designer-core/src/react/hooks.ts) 的同名 hook 实现（B3 重构后），闭包捕获 store，调用时无需传 store 参数（避免逻辑重复）
- **命令式 API 直接透传 store**：`setTree` / `updateNode` / `setPartialState` / `getNodeById` / `getState` / `buildIndex` / `destroy`
- 暴露底层 `store` 引用（高级场景）

**返回 Designer 实例**（完整字段见 [`createDesigner.ts` Designer 接口](packages-next/designer-core/src/createDesigner.ts)）：

| 分类 | 字段 | 说明 |
| --- | --- | --- |
| hooks | `useNode` / `useTree` / `useFlatTree` / `useUpdateNode` / `useLatestState` / `useExtra` | 闭包绑定 store，调用时无需传 store |
| 命令式 API | `setTree` / `updateNode` / `setPartialState` / `getNodeById` / `getState` / `buildIndex` / `destroy` | 直接透传 store |
| store 引用 | `store` | 底层 `TreeStoreApi` 实例（高级场景） |

**用法**：

```tsx
const designer = createDesigner({ initialComponents: [...] });

// 组件内直接用（同模块）
const field = designer.useNode('comp_001');
designer.updateNode('comp_001', { config: { left: 100 } });

// 命令式
designer.setTree(newTree);
```

#### 5.8.2 DesignerProvider

```tsx
function DesignerProvider({
    designer,
    children,
}: {
    designer: Designer;
    children: ReactNode;
}): JSX.Element;
```

**职责**：Context 注入层，注入 Designer 实例。

**关键约束**：
- **纯 DI 注入**：只传递 `createDesigner` 返回的 store 实例，**不管理状态、不创建 store**，不违反 [05-principles.md §2.4](./05-principles.md) "Context + 全量 setPartialState" 禁区精神（该禁区针对"用 Context + 全量 setPartialState 替代字段级订阅"的反模式，DesignerProvider 仅做实例传递，订阅仍走 `useNode` / `useTree` 字段级订阅）
- 顶层创建一次，子树用 `useDesigner()` 获取

#### 5.8.3 useDesigner / useDesignerOptional

```ts
function useDesigner(): Designer;            // 未包裹 Provider 时抛错
function useDesignerOptional(): Designer | null;  // 未包裹返回 null
```

**职责**：从 Context 获取 Designer 实例，避免 prop drilling。

- `useDesigner`：必须在 `<DesignerProvider>` 包裹的组件树内使用，否则抛错
- `useDesignerOptional`：可选版，用于"有 Provider 用 Context，没有就 fallback 到外部传入"的场景

**用法**：

```tsx
// 顶层
const designer = createDesigner({ ... });
<DesignerProvider designer={designer}>
  <App />
</DesignerProvider>

// 任意子组件
function ConfigPanel({ id }: { id: string }) {
  const { useNode, useUpdateNode, updateNode } = useDesigner();
  const field = useNode(id);
  const update = useUpdateNode();
  // ...
}
```

---

## 6. 与当前项目映射关系

### 6.1 API 映射（task §0.7 + fact-extraction §7.1）

| 当前 API | 框架 API | 性质 | fact-extraction 核对 |
| --- | --- | --- | --- |
| `useFieldConf` | `useNode` | hook | §3.1 ✅ |
| `useUpdateFieldConfig` | `useUpdateNode` | hook | §3.2 ✅ |
| `updateFieldConfig` | `updateNode` | action | §2.3 ✅ |
| `setComponents` | `setTree` | action | §2.2 ✅ |
| `setDesignerCanvasState`/`setState` | `setPartialState` | action | §2.4 ✅ |
| `getNodeById` | `getNodeById` | 工具函数（保留原名） | §3.4 ✅ |
| `buildIndex` | `buildIndex` | 工具函数（保留原名） | §1.5 ✅ |
| `useFlatComponents` | `useFlatTree` | hook | §3.3 ✅ |
| `useSelector(components, shallowEqual)` | `useTree()` | hook | §3.3 ✅ |

### 6.2 8 action 映射（fact-extraction §7.2）

| 当前 action.type | 框架对应 | 是否核心 |
| --- | --- | --- |
| `designerCanvas/setComponents` | `setTree` | ✅ 核心 |
| `designerCanvas/setState` | `setPartialState` | ✅ 核心 |
| `designerCanvas/updateFieldConfig` | `updateNode` | ✅ 核心 |
| `designerCanvas/clearRuntime` | runtime data 插件 | ⚠️ 插件 |
| `designerCanvas/recordRealtimeDataFlow` | runtime data 插件 | ⚠️ 插件 |
| `designerCanvas/deleteRealtimeDataFlow` | runtime data 插件 | ⚠️ 插件 |
| `designerCanvas/recordCustomFieldsList` | runtime data 插件 | ⚠️ 插件 |
| `designerCanvas/deleteCustomFieldsList` | runtime data 插件 | ⚠️ 插件 |

---

## 7. 技术选型（Zustand + Plugin）

### 7.1 为什么 Zustand（task §0.5）

| 维度 | 当前 Redux 事实 | Zustand 对应 | 适配度 |
| --- | --- | --- | --- |
| 单源契约 | components 真相，byId/parentMap 派生 | `create` 一个 store，`get()` 同步读、`set()` 不可变写 | 契约不变 |
| 字段级订阅 | useFieldConf + shallowEqual | `useStore(s => s.byId[id], shallow)` | 等价且更轻 |
| 引用复用 | `oldEntry.data === node.data` | 框架显式提供 setTree/updateNode 浅 path setPartialState，store 内维护 byId 引用复用 | 契约等价，实现责任从 user 转到 framework |
| 跨 slice 批量更新 | updateView + extraReducers | 单 store 天然原子 | 简化 |
| 同步读 | `store.getState()` | `useStore.getState()` | 等价 |

### 7.2 Zustand + Immer 决策（task §0.6）

**决策方向**（待 fact-extraction §9 实测确认，当前无编码环境无法跑）：
- **推荐 vanilla Zustand + 手动 buildIndex 维护引用**（默认路径）
  - 理由：与 04-principles.md 不可变契约一致；不引入 Immer 间接层；vanilla set 可精确控制引用变化范围
  - 风险：手动不可变更新代码量大于 Immer produce
- **immer middleware 仅作为自定义中间件选项暴露，不作为默认**
  - 理由：Zustand 4.x + immer middleware 在嵌套对象只改 inner field 时外层引用会变化，与 byId 引用复用目标冲突

**降级方案**：若阶段 9+ 编码时实测 vanilla 不可变更新代码量过大，可回退到 immer middleware 作为默认，但需在 `05-principles.md` 文档化引用复用语义变化。

### 7.3 buildIndex 必须在 set 外调用（关键约束）

fact-extraction §1.4：当前 Redux+Immer 下 buildIndex 必须在 produce 外调用，因为 Immer proxy 破坏 `oldEntry.data === node.data` 引用比较。

**框架影响**：vanilla Zustand 无 Immer proxy，buildIndex 可在 set 回调内调用。但**仍需保证 oldById 从 set 外捕获**（对照 designer-canvas.ts L134 `const oldById = state.byId`），不能传 set 内的 draft state.byId。

---

## 8. 子设计文档导航（阶段 3-7）

本文档通过 review 后，5 份子设计文档以本文档为对照标准：

| 阶段 | 文档 | 内容 | review 视角 |
| --- | --- | --- | --- |
| 3 | `01-data-model.md` | 泛型类型（TreeNode/FlatNode/TreeStoreState），与当前 WidgetItem/FlatField/DesignerCanvasState 映射 | A+B 双视角 |
| 4 | `02-write-path.md` | setTree/updateNode/setPartialState 契约 + 派生索引重建 + 边界降级（对照 fact-extraction §2） | A+B 双视角 |
| 5 | `03-read-path.md` | useNode/useTree/getState/getNodeById + 跨异步边界读路径 + shallowEqual（对照 fact-extraction §3） | A+B 双视角 |
| 6 | `04-plugin-system.md` | 四类插件契约（runtime data/derived compute/structure tools/cross-slice sync） | A+B 双视角 |
| 7 | `05-principles.md` | 4 大原则 + 5 大反模式约束 + 提交前自检 + React.memo + Immer frozen 决策 | A+B+C 三视角 |

---

## 9. 相关文档

- [task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/done/task-2026-07-30-001-designer-core-framework.md)（所属 task）
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md)（阶段 1 事实基准）
- [design/src/designer-state/00-README.md](skills/oss-visual-designer-project-context/design/src/designer-state/00-README.md)（当前项目状态管理权威）
- [design/src/designer-state/04-principles.md](skills/oss-visual-designer-project-context/design/src/designer-state/04-principles.md)（5 大禁区来源）
- [design/src/designer-state/06-bugs-and-tests.md](skills/oss-visual-designer-project-context/design/src/designer-state/06-bugs-and-tests.md)（25 bug 归档）
