# 05 — 框架架构原则与禁区

> 状态：`阶段 7 产出，待 review（A+B+C 三视角）`
> 创建日期：2026-07-30
> 所属 task：[task-2026-07-30-001-designer-core-framework.md](skills/oss-visual-designer-project-context/plans/task-2026-07-30-001-designer-core-framework.md)
> 事实基准：[research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §4（4 大原则）+ §5（5 大反模式）+ §8（8 大约束）
> 当前项目权威：[design/src/designer-state/04-principles.md](skills/oss-visual-designer-project-context/src/designer-state/04-principles.md)

---

## 0. 文档定位与 review 标准

本文档是 designer-core 框架的"宪法"：定义 4 大架构原则 + 5 大反模式 + 8 大实现约束，以及提交前自检清单。违反任何一条都会引发已知类型的 bug（对照 25 bug 矩阵）。

**review 标准（task §1.1 阶段 7，A+B+C 三视角）**：
- **视角 A 事实核查**：每条原则/反模式/约束对照当前源码验证（源码行号 + bug #）；无幻觉
- **视角 B 逻辑审查**：原则间不冲突；覆盖 25 bug 全部；与 00-04 文档一致
- **视角 C 对抗式审查**：模拟"恶意用户"绕过约束的场景，验证约束是否可被规避

**事实优先级**：仓库代码 > 运行验证 > `skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。

---

## 1. 4 大架构原则

### 1.1 原则 1：单一真相源

**含义**：框架 store（`TreeStoreState`）是树状态的唯一真相源。组件通过订阅（`useNode` / `useTree`）读，通过写路径（`setTree` / `updateNode` / `setPartialState`）写。

**对照当前**（fact-extraction §4.1）：
- 当前：Redux store 是画布状态唯一真相源
- 框架：Zustand store 是树状态唯一真相源

**适用范围**：

| 是 | 否 |
| --- | --- |
| 组件读 `useNode(id).data` | 组件读 `props` 自己维护组件内 state |
| 工具函数读 `getState().byId[id]` | 工具函数读 `props` 假设组件已拿到 |
| 跨异步边界用 `useLatestState()` | 闭包保存 components 引用跨 set |

**例外**：`DesignerField` 内部维护 `setLocations` 等纯 UI 临时状态（拖拽过程中显示用），不进入 store——这是合理的 UI 状态，框架不约束。

### 1.2 原则 2：不可变契约

**含义**：所有修改 state 必须走写路径（`setTree` / `updateNode` / `setPartialState`），框架内部保证不可变更新，外部禁止 mutation。

**对照当前**（fact-extraction §4.2 + §8 约束 1）：
- 当前：Redux + Immer，`produce` 内修改 draft，Immer frozen 自动抛 TypeError
- 框架：vanilla Zustand，**无 Immer frozen 保护**，依赖**开发者自觉 + 框架 set 函数内不可变更新**

**⚠️ 框架与当前的关键差异**（fact-extraction §8 约束 1）：
- 当前 Immer frozen 提供**运行时保护**：`state.components[0].data.config.left = 100` 抛 TypeError
- 框架 vanilla Zustand **无运行时保护**：直接 mutation 不会抛错，但会破坏引用复用 + 单源契约
- **框架补偿措施**：
  1. 框架 set 函数内强制不可变更新（`updateNode` 沿路径浅拷贝）
  2. 开发文档强调禁止 mutation（本文档 §2.4）
  3. 可选：开发环境加 `Object.freeze` 深冻结（性能开销，默认关闭）

**正确写法**：

```ts
// ✅ 增：setTree / updateNode
store.setTree(newTree);
store.updateNode(id, { config: { left: 100 } });

// ✅ 改：用不可变工具
const newChildren = parents.children.map(c => ({ ...c, data: { ...c.data, config: { ...c.data.config, left: 100 } } }));
store.setTree(newTree);
```

**错误写法**：

```ts
// ❌ 直接 mutation（框架无 TypeError，但破坏引用复用 + 单源契约）
getState().components[0].data.config.left = 100;
getState().byId[id].data.config.left = 100;
parents.children.push(newChild);

// ❌ mutation 后 setTree（state 已被污染）
parents.children = parents.children.filter(...);
store.setTree(components);
```

### 1.3 原则 3：字段级订阅

**含义**：高频路径必须用字段级订阅（`useNode`），避免整树 re-render。

**对照当前**（fact-extraction §4.3）：
- 当前：`useFieldConf(id)` + `shallowEqual`
- 框架：`useNode(id)` 内建 `shallowEqual`

**选型**（对照 03-read-path.md §8）：

| 场景 | 订阅 | 不订阅 |
| --- | --- | --- |
| 渲染当前组件 config | `useNode(id)` | — |
| 渲染整树（递归组件 / 图层树） | `useTree()` | `useNode(id)` 不够 |
| 异步回调读 state | `getState()` | `useNode` 闭包过期 |

**shallowEqual 强制**（03-read-path.md §9）：
- `useNode(id)`：内建 shallowEqual
- `useTree()`：框架强制 shallowEqual（默认 true，不可关闭）
- 业务订阅 extra 字段：需手动加 shallowEqual

### 1.4 原则 4：单源契约

**含义**：`components` 是唯一真相源，`byId` / `parentMap` 纯派生（只读），所有写操作改树 + `buildIndex` 重建；components 树永远 fresh，无 stale tree 问题。

**对照当前**（fact-extraction §4.4）：
- 当前：单源架构（task-002 落地），components 是真相源，byId/parentMap 由 buildIndex 重建
- 框架：继承单源契约，`TreeStoreState.components` 是真相源，`byId`/`parentMap` 派生只读

**核心约束**：
1. `byId` / `parentMap` 只能由 `buildIndex` 重建，不可直接赋值（`setPartialState` 防护拦截）
2. `updateNode` 改 components 树（不是只改 byId），components 永远 fresh
3. 保存序列化直接读 `getState().components`，无需 `getSaveableComponents`（已删）

---

## 2. 5 大反模式

### 2.1 反模式 1：直接 mutation

**禁止**：直接 mutation state / byId / components / props 引用。

**事实依据**（fact-extraction §5.1）：
- bug #9（layer-manager mutation）：直接改 `parents.children`
- bug #10（configuration-panel render 内 mutation）：render 内改 state
- bug #11（designer-field parents.children mutation）：直接改 parents.children
- bug #22（mutation 残留 + cloneDeep 滥用）：mutation 后 cloneDeep 掩盖

**框架约束**（§1.2）：
- 框架无 Immer frozen 运行时保护，依赖开发者自觉
- 框架 set 函数内强制不可变更新
- 可选开发环境 `Object.freeze` 深冻结

### 2.2 反模式 2：滥用 cloneDeep

**禁止**：滥用 `cloneDeep`（仅在 `resetUniqueId` / `generatorField` / `fetchMaterialSchema` 等结构性变更需要时才用）。

**事实依据**（fact-extraction §5.2）：
- bug #22：mutation 后 cloneDeep 滥用，掩盖 mutation 问题
- 当前 AGENTS.md §10.2 禁区

**框架约束**：
- 框架不提供 `cloneDeep`
- 业务如需深拷贝，自行引入 lodash.cloneDeep，但**只在结构性变更用**
- 字段级更新（`updateNode`）禁止 cloneDeep，用浅拷贝 + 引用复用

### 2.3 反模式 3：EventBus

**禁止**：EventBus 反模式（`runtimeComponentsTrigger` 等已删，禁止新增）。

**事实依据**（fact-extraction §5.3）：
- 当前已删除 `runtimeComponentsTrigger` 等 EventBus 模式
- AGENTS.md §10.2 禁区

**框架约束**：
- 框架不提供 EventBus
- 跨组件通信走 store 订阅（`useNode` / `useTree`）
- 派生计算走 `derived compute` 插件（subscribe + setTree），不走 EventBus

### 2.4 反模式 4：Context + 全量 setPartialState

**禁止**：Context + 全量 setPartialState（`useDesigner` 兼容壳已删，禁止新增）。

**事实依据**（fact-extraction §5.4）：
- 当前已删除 `useDesigner` 兼容壳（task-007/012）
- AGENTS.md §10.2 禁区

**框架约束**：
- 框架不提供 Context Provider 包裹 store
- store 通过 `createTreeStore` 创建，hooks（`useNode` / `useTree`）直接订阅
- 业务如需 Context 传递 store 实例，可自行包裹，但**禁止用 Context + 全量 setPartialState 替代字段级订阅**

### 2.5 反模式 5：循环依赖 setPartialState

**禁止**：循环依赖 setPartialState（`recalcGroupBounds` 内 `setPartialState` 触发 subscribe 必须 `isRecalcRef` 防重入）。

**事实依据**（fact-extraction §5.5 + §1.6）：
- 当前 `recalcGroupBounds` 用 `isRecalcRef` 防重入（DesignerContent.tsx L284, L288, L317, L319）
- bug #16：`recalcGroupBounds` 路径改名后 stale parents.children

**框架约束**（04-plugin-system.md §4）：
- `derived compute` 插件**内置 ref 防重入**（`isRecalculating` 标志）
- 业务提供 `compute` 函数，框架提供防重入 + 订阅 + 写入
- 业务不可绕过插件直接 `subscribe + setTree`（会丢失防重入）

---

## 3. 8 大实现约束

### 3.1 约束 1：vanilla Zustand 无 Immer frozen 保护

**事实依据**（fact-extraction §8 约束 1）：
- 当前 Redux+Immer：`produce` 内修改 draft，frozen 自动抛 TypeError
- 框架 vanilla Zustand：无 frozen 保护

**框架约束**：
- 框架 set 函数内强制不可变更新（`updateNode` 沿路径浅拷贝）
- 开发文档强调禁止 mutation（§2.1）
- 可选：开发环境加 `Object.freeze` 深冻结（性能开销，默认关闭）

### 3.2 约束 2：setPartialState 用 hasOwnProperty 修正 'in' 隐 bug

**事实依据**（fact-extraction §8 约束 2 + §1.3）：
- 当前 `setPartialState` 用 `'in'` 操作符检测 byId/parentMap（遍历原型链）
- 框架改用 `hasOwnProperty`（只查自身属性）

**框架约束**（02-write-path.md §4.2.2）：
- `setPartialState` 防护用 `Object.prototype.hasOwnProperty.call(payload, 'byId')`
- 统一为 hasOwnProperty（`hasComponents` 也用 hasOwnProperty）

### 3.3 约束 3：buildIndex 在 set 回调内调用，oldById 从 set 外捕获

**事实依据**（fact-extraction §8 约束 3 + §1.4）：
- 当前 Redux+Immer：buildIndex 在 produce 外调用（Immer proxy 破坏引用比较）
- 框架 vanilla Zustand：buildIndex 在 set 回调内调用（无 Immer proxy）
- **关键**：oldById 必须从 set 外捕获（`get().byId`），不能传 set 内的 `state.byId`

**框架约束**（02-write-path.md §5.2）：
- `setTree` / `updateNode` / `setPartialState`（含 components）都在 set 外 `const oldById = get().byId`
- buildIndex 在 set 回调内调用，传入 oldById

### 3.4 约束 4：derived compute 内置 ref 防重入

**事实依据**（fact-extraction §8 约束 4 + §1.6）：
- 当前 `recalcGroupBounds` 用 `isRecalcRef` 防重入
- 框架 `derived compute` 插件内置 `isRecalculating` 标志

**框架约束**（04-plugin-system.md §4.4）：
- `derived compute` 插件内置防重入
- 业务不可绕过插件直接 `subscribe + setTree`

### 3.5 约束 5：禁止绕过 buildIndex 直接赋值 byId/parentMap

**事实依据**（fact-extraction §8 约束 5 + AGENTS.md §10.2）：
- 当前单源架构：byId/parentMap 是纯派生索引，只由 buildIndex 重建
- AGENTS.md §10.2 禁区

**框架约束**（01-data-model.md §2.2 + 02-write-path.md §4.2.2）：
- `setPartialState` 防护拦截 byId/parentMap 直接赋值（hasOwnProperty + console.error + delete）
- 框架不提供直接赋值 byId/parentMap 的 API

### 3.6 约束 6：保存序列化直接读 components

**事实依据**（fact-extraction §8 约束 6 + §3.7）：
- 当前：直接序列化 `designerState.components`（单源后永远 fresh）
- `getSaveableComponents` 已删

**框架约束**（03-read-path.md §6）：
- 保存序列化直接读 `getState().components`
- 框架不提供 `getSaveableComponents`

### 3.7 约束 7： getNodeById 保留原名

**事实依据**（task §0.7 + 00-overview.md §0.7）：
- `getNodeById` 保留原名，不加 `use` 前缀（非 hook）

**框架约束**：
- 导出 `getNodeById`（非 `useFieldNodeById`）
- 是纯函数，不是 hook

### 3.8 约束 8：插件不侵入核心三字段

**事实依据**（04-plugin-system.md §1.1 + 00-overview.md §2.2）：
- 插件只操作 extra 或扩展行为，不操作 components/byId/parentMap

**框架约束**：
- `runtime data` 插件只改 extra
- `derived compute` 插件通过 `ctx.setTree` 改 components（走写路径，不直接改）
- `structure tools` 插件是纯函数注册壳，不操作 store；通用的结构操作 / 组尺寸 / 树遍历函数已作为核心工具层导出（`core/utils/`），业务可直接 import 或注册进 plugin
- `cross-slice sync` 插件同步外部 store，不操作核心三字段

---

## 4. 25 bug 覆盖总表

> 分类口径对齐 [fact-extraction §6.3](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) 修正后分类 + [00-overview.md §4.2](./00-overview.md)。

### 4.1 框架直接覆盖的 bug（7 个，需框架测试）

| bug # | 描述 | 框架机制 | 原则/反模式/约束 |
| --- | --- | --- | --- |
| #3 | setLevelPath 丢弃返回值 | `createTreeStore` set 返回值统一 | 原则 4 |
| #9 | layer-manager mutation | `createTreeStore` 强制不可变 | 反模式 1 |
| #10 | configuration-panel render 内 mutation | `createTreeStore` 不可变契约 | 反模式 1 |
| #15 | byId 不含 children | `getNodeById` | 原则 3 |
| #18 | 组内成组爆栈（splitGroup 递归无终止） | `derived compute` 插件（防重入） | 反模式 5 |
| #24 | getResizedComponents 取不到带 children 节点 | `getNodeById` | 原则 3 |
| #25 | useOnDrop trigger 未追加 recalcGroupInTree | `getNodeById` | 原则 3 |

### 4.2 框架间接覆盖的 bug（12 个，单源架构自带消除）

| bug # | 描述 | 框架机制 | 原则/反模式/约束 |
| --- | --- | --- | --- |
| #1 | setComponents 路径改名丢失 | `setTree` 直接赋值（单源） | 原则 4 |
| #2 | handleAlign 多选对齐 pre-existing | `setTree` 单次写（单源） | 原则 4 |
| #4 | drag2layoutBlock updateFieldConfig 不同步 | `updateNode` 改树+buildIndex（单源） | 原则 4 |
| #11 | designer-field parents.children mutation | `createTreeStore` 不可变契约 | 反模式 1 |
| #13 | handleAlign 闭包覆盖 | `setTree` 单次写 + `useTree` 后闭包 fresh | 原则 3+4 |
| #14 | setState 丢弃字段 | `setPartialState` + `setTree` 拆分语义 | 原则 4 |
| #17 | 改名丢失 | `setTree` 直接赋值（单源） | 原则 4 |
| #19 | 组内对齐跳变 | `setTree` 单次写（单源） | 原则 4 |
| #20 | 保存丢失 | `getState().components` fresh（单源） | 约束 6 |
| #21 | recalcGroupBounds 读 stale parents.children | `getNodeById` fresh（单源） | 原则 3 |
| #22 | mutation 残留 + cloneDeep 滥用 | `createTreeStore` 不可变契约 | 反模式 1+2 |
| #23 | stale tree 防御性读取未统一封装 | `useNode` + `getNodeById`（单源） | 原则 3 |

### 4.3 已删 API 静态扫描（5 个，框架不测试，禁止重新引入）

| bug # | 描述 | 框架机制 | 事实依据 |
| --- | --- | --- | --- |
| #5 | 容器嵌套 updateFieldConfig 边界 | 已删 API，静态扫描禁止重新引入 | fact-extraction §6.3 |
| #6 | 多选对齐 updateFieldConfig 逐个 dispatch | 同上 | fact-extraction §6.3 |
| #7 | recalcGroupInTree 未纯函数组合 | 同上 | fact-extraction §6.3 |
| #8 | propsValue useMemo 依赖 | 同上 | fact-extraction §6.3 |
| #12 | setState 多字段 mergeByIdIntoTree 问题 | 同上 | fact-extraction §6.3 |

### 4.4 与状态框架无关（1 个，业务自行处理）

| bug # | 描述 | 原因 | 事实依据 |
| --- | --- | --- | --- |
| #16 | 组点击不到（group 选中事件处理缺陷） | UI 事件处理，非状态框架范畴 | fact-extraction §6.3 + 00-overview §4.2 |

### 4.5 覆盖汇总

| 分类 | 数量 | bug # | 框架测试？ |
| --- | --- | --- | --- |
| ✅ 直接覆盖 | 7 | #3, #9, #10, #15, #18, #24, #25 | ✅ 是 |
| ⚠️ 间接覆盖 | 12 | #1, #2, #4, #11, #13, #14, #17, #19, #20, #21, #22, #23 | ❌ 单源架构自带 |
| 🚫 已删 API | 5 | #5, #6, #7, #8, #12 | ❌ 静态扫描 |
| ❌ 无关 | 1 | #16 | ❌ 业务处理 |
| **合计** | **25** | — | **框架测试范围 19（7 直接 + 12 间接）** |

---

## 5. 提交前自检清单

### 5.1 框架开发者自检（修改框架代码时）

1. ☐ 改动是否破坏单源契约？（byId/parentMap 只由 buildIndex 重建）
2. ☐ 改动是否破坏引用复用？（oldEntry.data === node.data 比较）
3. ☐ 改动是否破坏不可变契约？（set 函数内不可变更新）
4. ☐ 改动是否破坏字段级订阅？（useNode/useTree shallowEqual）
5. ☐ 改动是否引入反模式？（直接 mutation / cloneDeep 滥用 / EventBus / Context+setPartialState / 循环依赖）
6. ☐ 改动是否满足 8 大约束？
7. ☐ 是否更新了相关文档（00-05）？

### 5.2 业务开发者自检（使用框架时）

1. ☐ 读 state 是否用正确 API？（渲染用 useNode/useTree，异步用 getState）
2. ☐ 写 state 是否用正确写路径？（结构性用 setTree，字段级用 updateNode，批量用 setPartialState）
3. ☐ 是否直接 mutation state？（禁止，框架无运行时保护）
4. ☐ 是否滥用 cloneDeep？（只在结构性变更用）
5. ☐ 是否用 EventBus？（禁止，走 store 订阅）
6. ☐ 是否用 Context + 全量 setPartialState？（禁止，走字段级订阅）
7. ☐ derived compute 是否用插件？（禁止绕过插件直接 subscribe+setTree）
8. ☐ 保存序列化是否直接读 components？（禁止调 getSaveableComponents）

---

## 6. 与前序文档的一致性核对

| 维度 | 00-04 文档 | 本文档 | 一致性 |
| --- | --- | --- | --- |
| 4 大原则 | 00 §3 决策记录 | §1 | ✅ |
| 5 大反模式 | 00 §3 决策记录 | §2 | ✅ |
| 8 大约束 | 00 §3 决策记录 + fact-extraction §8 | §3 | ✅ |
| 单源契约 | 01 §2.2 + 02 §5 | §1.4 | ✅ |
| 不可变契约 | 02 §3.2.5（updateNode 不可变） | §1.2 | ✅ |
| 字段级订阅 | 03 §2（useNode）+ §3（useTree） | §1.3 | ✅ |
| derived compute 防重入 | 04 §4.4 | §2.5 + §3.4 | ✅ |
| 插件不侵入核心三字段 | 04 §1.1 | §3.8 | ✅ |
| hasOwnProperty 修正 | 02 §4.2.2 | §3.2 | ✅ |
| buildIndex oldById 捕获 | 01 §3.3 + 02 §5.2 | §3.3 | ✅ |
| 25 bug 全覆盖 | 02 §7 + 03 §10 | §4 | ✅ |

---

## 7. 相关文档

- [00-overview.md](./00-overview.md) §3 —— 决策记录（4 大原则 + 5 大反模式 + 8 大约束的源头）
- [01-data-model.md](./01-data-model.md) §2.2 —— 单源契约（byId/parentMap 派生只读）
- [02-write-path.md](./02-write-path.md) §3.2.5 —— 不可变更新（updateNode 浅拷贝）
- [03-read-path.md](./03-read-path.md) §9 —— shallowEqual 约束
- [04-plugin-system.md](./04-plugin-system.md) §4.4 —— derived compute 防重入
- [design/src/designer-state/04-principles.md](skills/oss-visual-designer-project-context/src/designer-state/04-principles.md) —— 当前项目架构原则权威
- [research/designer-core-fact-extraction.md](skills/oss-visual-designer-project-context/research/designer-core-fact-extraction.md) §4, §5, §8 —— 事实基准
