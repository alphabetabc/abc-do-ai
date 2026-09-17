# task-2026-07-31-001 — designer-core 框架优化（基于 4 份 review 报告）

> 状态：`done`
> 类型：`refactor` + `enhancement`
> 优先级：**中**
> 创建日期：2026-07-31
> 完成日期：2026-07-31
> 前置：task-2026-07-30-001（已完成，归档至 done/）

---

## 1. 背景

task-2026-07-30-001 完成了 `designer-core` 框架封装（Zustand + Plugin），67 个测试全绿，typecheck/build 通过。随后收到 4 份独立 review 报告（r1-r4），从事实核查、逻辑审查、命名一致性、代码质量等多角度指出了若干问题。

本 task 基于 4 份报告的交叉分析，**以代码事实为准**，筛选出真实需要修复的问题，排除误判项。

---

## 2. review 交叉分析结论

### 2.1 不需要修复的（review 误判）

| # | review 指出的问题 | 判定为误判的理由 |
|---|---|---|
| A1 | API 命名 `field`→`node` 偏离设计文档 | 用户明确要求概念统一为 `Node`，代码是对的。需要更新的是 `.trae/documents/design/designer-core/` 设计文档（见 §3 步骤 1） |
| A2 | `DesignerProvider` 违反 05-principles §2.4 | §2.4 禁止的是"Context + 全量 setState 管理状态"，`DesignerProvider` 是纯 DI 注入（传递 store 实例），不管理状态，不违反禁区精神 |
| A3 | `Designer` 命名与 designer-next 冲突 | designer-next 的 `Designer` 是占位组件（`export const Designer = () => <div>Designer</div>`），未实际使用；framework 的 `Designer` 是 interface 类型，两者不冲突 |
| A4 | cross-slice sync 无内置防循环 | 文档 04-plugin-system §6.3 实现草案中也没有防重入，与 derived compute 的"内置防重入"是不同的设计契约。双向同步的防循环是业务责任（在 `onStateChange`/`onExternalChange` 入口判重入），文档应明确说明 |

### 2.2 需要修复的（真实问题）

| # | 问题 | 严重程度 | 来源 |
|---|---|---|---|
| B1 | `devFreeze` 选项声明但未实现 | 中 | r1/r2/r4 |
| B2 | `useLatestState` 在 hooks.ts 中有竞态风险 | 中 | r1/r2/r3/r4（全票） |
| B3 | hooks 逻辑在 hooks.ts 和 createDesigner.ts 中重复 | 中 | r2/r3 |
| B4 | `TreeStoreApi` 缺少 `TData` 泛型参数 | 中 | r3 |
| B5 | `setState` 命名混淆（覆盖 Zustand 原生 setState） | 中 | r2/r4 |
| B6 | `setPartialState` 中 `delete` 操作可改用解构 | 低 | r4 |
| B7 | 缺少 440 节点性能基线测试 | 低 | r1/r2/r4 |
| B8 | 设计文档命名滞后（仍用 `field` 系列） | 中 | r1/r2/r3/r4 |

---

## 3. 实施步骤

### 步骤 1：修复 `useLatestState` 竞态风险（B2）

**问题**：`hooks.ts` L131-138 的 `useLatestState` 仅在 render 时更新 `ref.current`，组件不 re-render 时 ref 是过期值。`createDesigner.ts` L164-175 的版本用 `useEffect + store.subscribe` 是正确的。

**修复**：将 `hooks.ts` 的 `useLatestState` 实现对齐 `createDesigner.ts` 版本（加 `useEffect + store.subscribe`）。

**验证**：现有测试应继续通过。

### 步骤 2：消除 hooks 逻辑重复（B3）

**问题**：6 个 hooks 在 `hooks.ts`（带 store 参数）和 `createDesigner.ts`（闭包绑定）中各实现了一遍。

**修复**：`createDesigner.ts` 的 `useXxxBound` 改为调用 `hooks.ts` 中的版本，用闭包绑定 store：

```ts
// 之前：重写整个 hook
const useNodeBound = (id: string) => {
    return useStoreWithEqualityFn(store, ...);
};

// 之后：复用 hooks.ts
const useNodeBound = (id: string) => useNode(store, id);
```

**验证**：67 个测试全绿。

### 步骤 3：补全 `TreeStoreApi` 的 `TData` 泛型（B4）

**问题**：`TreeStoreApi<TNode, TFlat, TExtra>` 只有 3 个泛型参数，缺少 `TData`，导致 `TNode extends TreeNode` 丢失了 `TData` 约束。

**修复**：`TreeStoreApi` 增加 `TData` 泛型参数，与 `createTreeStore` 对齐：

```ts
export interface TreeStoreApi<
    TData extends Record<string, any> = Record<string, any>,
    TNode extends TreeNode<TData> = TreeNode<TData>,
    TFlat extends FlatNode<TData> = FlatNode<TData>,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
>
```

**验证**：typecheck 通过。

### 步骤 4：实现 `devFreeze` 或删除接口声明（B1）

**问题**：`CreateTreeStoreOptions.devFreeze` 声明了但 `createTreeStore` 函数体完全未使用。

**决策**：删除接口声明。理由：vanilla Zustand 无 frozen 保护是已知的设计决策（依赖开发者自觉），`devFreeze` 的 Object.freeze 深冻结在每次 setState 后执行会有性能开销，且与框架的"不可变更新"契约重复。如果未来需要运行时保护，再单独引入。

**同步**：更新设计文档 00-overview §5.1 和 05-principles §3.1，删除 `devFreeze` 相关描述。

### 步骤 5：清理 `setState` 命名混淆（B5）

**问题**：`TreeStoreApi.setState` 被覆盖为 `setPartialState`，但接口注释说"业务应走 setTree/updateNode/setPartialState，原始 setState 保留供框架内部"——实际不是"保留"而是"替换"。

**修复**：
- `TreeStoreApi` 接口中 `setState` 改名为 `setPartialState`（对外暴露名与内部实现名一致）
- 删除 `TreeStoreApi` 中可调用 signature `(<U>(selector) => U)`（store 当 hook 用是不安全的类型转换）
- `getInitialState` 保留（zustand v4.5+ 要求）但加注释说明

**验证**：typecheck + test + build。

### 步骤 6：优化 `setPartialState` 的 delete 操作（B6）

**问题**：`delete safePayload.byId` / `delete safePayload.parentMap` 语义不干净。

**修复**：改为解构排除：

```ts
const { byId: _byId, parentMap: _parentMap, ...safePayload } = payload;
```

### 步骤 7：补充 440 节点性能基线测试（B7）

**问题**：task §4.2 要求但未实现。

**修复**：新增 `src/__tests__/performance.test.ts`：
- `makeLargeTree(440)` 构造 440 节点树
- 1000 次 `updateNode(id, { config: { left: x } })`
- 测量 P50/P95/P99
- 断言 P95 < 5ms（合理阈值，当前项目基线 0.2ms p95）

### 步骤 8：更新设计文档命名（B8）

**问题**：`.trae/documents/design/designer-core/` 6 份文档仍用 `field` 系列命名，代码已统一为 `node`。

**修复**：用脚本批量替换 6 份设计文档：
- `useField` → `useNode`
- `updateField` → `updateNode`
- `getFieldNodeById` → `getNodeById`
- `UpdateFieldPatch` → `UpdateNodePatch`
- `useUpdateField` → `useUpdateNode`

**同步**：在设计文档中补充 `createDesigner` / `DesignerProvider` / `useDesigner` 的契约描述（新增章节或补充到 00-overview）。

---

## 4. 验证

- [x] `pnpm test`：69 测试全绿（含新增性能测试，P95=0.165ms < 5ms 阈值）
- [x] `pnpm typecheck`：0 错误
- [x] `pnpm build`：成功（dist/index.js 16.56 kB）
- [x] 设计文档命名与代码一致（field→node + setState→setPartialState + 补充 createDesigner 契约）

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 步骤 2（消除重复）引入行为变化 | 低 | 中 | 67 个测试覆盖 |
| 步骤 3（泛型补全）导致类型推断失败 | 低 | 低 | typecheck 验证 |
| 步骤 5（setState 改名）破坏外部调用 | 低 | 低 | 框架尚未被外部使用 |

---

## 6. 不做的事

- **不改 cross-slice sync 加防循环**：双向同步的防循环是业务责任，文档说明即可
- **不删 `DesignerProvider`/`useDesigner`**：DI 注入不违反禁区精神
- **不改 `Designer` 类型名**：与 designer-next 占位组件不冲突
- **不移植当前项目 reducer 测试**：框架是独立包，行为对齐通过迁移时验证

---

## 7. 实施记录

### 代码改动（packages-next/designer-core/src/）

| 步骤 | 文件 | 改动 |
|---|---|---|
| B2 | `hooks.ts` | `useLatestState` 加 `useEffect + store.subscribe`，修复非渲染时 ref 过期竞态 |
| B3 | `createDesigner.ts` | 6 个 `useXxxBound` 改为复用 `hooks.ts` 同名 hook，删除重复实现（净减约 40 行） |
| B4 | `createTreeStore.ts` / `hooks.ts` / `createDesigner.ts` | `TreeStoreApi` 增加 `TData` 泛型参数（第一位），同步 10 处调用点 + hooks 6 个签名 |
| B1 | `createTreeStore.ts` | 删除 `CreateTreeStoreOptions.devFreeze` 声明（未实现，决策删除而非实现） |
| B5 | `createTreeStore.ts` / `plugins/types.ts` / `createRuntimeDataPlugin.ts` | `TreeStoreApi` 删除 `setState` 字段 + callable signature；`PluginContext.setState` 改名 `setPartialState`；插件 6 处 `ctx.setState` → `ctx.setPartialState` |
| B6 | `createTreeStore.ts` | `setPartialState` 的 `delete` 改为解构排除；console.error 前缀 `[setState]` → `[setPartialState]` |
| B7 | `__tests__/performance.test.ts` | 新增 440 节点 + 1000 次 updateNode 性能基线测试（P50/P95/P99 + 引用复用验证） |

### 文档改动（.trae/documents/design/designer-core/）

- **命名对齐脚本** `.trae/scripts/designer-core-docs-rename.mjs`：批量替换 6 份文档 166 处 `field`→`node` 系列命名
- **setState → setPartialState 同步**：5 份文档中指代框架 API 的 `setState` 改为 `setPartialState`（保留历史/Zustand 原生/bug 语境的 12 处）
- **00-overview §5.8 新增**：补充 `createDesigner` / `DesignerProvider` / `useDesigner` / `useDesignerOptional` 契约描述
- **devFreeze 描述清理**：00-overview §5.1 删除 `devFreeze?: boolean` 接口声明

### 验证结果

- `pnpm test`：69 测试全绿（67 原有 + 2 新增性能测试），P95=0.165ms
- `pnpm typecheck`：0 错误
- `pnpm build`：成功，dist/index.js 16.56 kB / gzip 5.03 kB

### 决策备注

- **B4 泛型顺序**：任务文档建议 TData 第一位，会破坏 10 处调用点。采用任务文档原方案（TData 第一）并同步修改所有调用点，保持与 `createTreeStore` 工厂层一致。
- **B5 setState 改名范围**：任务文档说"setState 改名为 setPartialState"，但框架内部 L129/160/189/196 仍需调用原生 zustand `store.setState`（支持函数形式）。故只删除 `TreeStoreApi` 对外的 `setState` 字段，内部 `store.setState`（对 zustand 原生 store 变量的闭包调用）保留。
- **B1 devFreeze**：按任务文档决策删除接口声明，不实现。05-principles §3.1 的"可选 Object.freeze"原则描述保留（是设计原则，非接口声明）。
