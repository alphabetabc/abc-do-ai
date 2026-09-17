# task-2026-08-05-003：designer-core `PluginContext` 补充 `updateNode`

> 创建日期：2026-08-05
> 完成日期：2026-08-06
> 状态：`done`
> 类型：`refactor`
> 前置文档：[research/tango-cross-review报告.md](../research/tango-cross-review报告.md) §3.3
> 前置任务：task-2026-08-05-002（`deepMergeKeys` 解耦）

---

## 1. 背景与目标

### 1.1 背景

Tango 交叉印证报告发现 `PluginContext` 只暴露了 `setTree` 和 `setPartialState`，没有 `updateNode`。插件如果需要做字段级更新（而非整树替换），只能用 `setTree`，性能不如 `updateNode`（无法利用沿路径浅拷贝 + buildIndex 引用复用）。

当前代码（[`plugins/types.ts`](../../../packages-next/designer-core/src/plugins/types.ts) L26-46）：

```ts
export interface PluginContext<...> {
    getState: () => TreeStoreState<...>;
    subscribe: (...) => () => void;
    setTree: (components: TNode[]) => void;
    setPartialState: (payload: Partial<TreeStoreState<...>>) => void;
    getNodeById: (...) => TNode | null;
    buildIndex: (...) => { byId, parentMap };
}
```

### 1.2 目标

在 `PluginContext` 中加入 `updateNode`，让插件有能力做字段级更新。

### 1.3 不做什么

- 不改 `updateNode` 的内部实现逻辑（已在 task-002 改过 `deepMergeKeys`）
- 不改插件排序逻辑
- 不改其他 hooks 或写路径

---

## 2. 详细步骤

### 2.1 `plugins/types.ts`：`PluginContext` 接口增加 `updateNode`

**文件**：[`packages-next/designer-core/src/plugins/types.ts`](../../../packages-next/designer-core/src/plugins/types.ts)

**改动**：在 `setTree` 后面、`setPartialState` 前面增加 `updateNode`

```ts
export interface PluginContext<...> {
    getState: () => TreeStoreState<...>;
    subscribe: (...) => () => void;
    /** 写路径：结构性变更（02-write-path.md §2） */
    setTree: (components: TNode[]) => void;
    /** 写路径：字段级更新（02-write-path.md §3） */
    updateNode: (id: string, patch: UpdateNodePatch) => void;
    /** 写路径：批量更新（02-write-path.md §4） */
    setPartialState: (payload: Partial<TreeStoreState<...>>) => void;
    getNodeById: (...) => TNode | null;
    buildIndex: (...) => { byId, parentMap };
}
```

需要 import `UpdateNodePatch`（如果尚未 import）。

### 2.2 `createTreeStore.ts`：`pluginContext` 对象增加 `updateNode`

**文件**：[`packages-next/designer-core/src/core/store/createTreeStore.ts`](../../../packages-next/designer-core/src/core/store/createTreeStore.ts)

**改动**：L198-207 的 `pluginContext` 对象增加 `updateNode`

**改前**：
```ts
const pluginContext: PluginContext<TNode, TFlat, TExtra> = {
    getState: store.getState,
    subscribe: store.subscribe as (...),
    setTree,
    setPartialState,
    getNodeById,
    buildIndex,
};
```

**改后**：
```ts
const pluginContext: PluginContext<TNode, TFlat, TExtra> = {
    getState: store.getState,
    subscribe: store.subscribe as (...),
    setTree,
    updateNode,
    setPartialState,
    getNodeById,
    buildIndex,
};
```

### 2.3 设计文档同步：`04-plugin-system.md`

**文件**：[`design/04-plugin-system.md`](../design/designer-core/04-plugin-system.md)

**改动**：

1. §2.1 PluginContext 表格补充 `updateNode` 行
2. §4.4 更新"写入走 setTree"为"结构性变更走 setTree，字段级更新走 updateNode"

### 2.4 测试补充

**文件**：[`packages-next/designer-core/src/__tests__/plugins.test.ts`](../../../packages-next/designer-core/src/__tests__/plugins.test.ts)

**新增测试用例**：

1. 插件通过 `ctx.updateNode` 更新节点 data，验证 byId 引用复用生效（未改节点 data 引用不变）
2. 插件通过 `ctx.updateNode` 更新不存在的 id，验证安全跳过（no-op）
3. 插件通过 `ctx.updateNode` 传空 patch，验证安全跳过

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| `PluginContext.updateNode` 可用 | `pnpm test`（新增 3 个测试用例） |
| 现有 190+ tests 不回归 | `pnpm test` 全量通过 |
| 类型安全 | `pnpm exec tsc --noEmit`（仅 `packages-next/designer-core/`） |
| 文档与代码一致 | 04-plugin-system.md §2.1 / §4.4 与代码交叉核对 |

---

## 4. 风险与回退

### 4.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 插件用 `updateNode` 绕过 derived-compute 的 ref 防重入 | 低 | 中 | `updateNode` 和 `setTree` 一样会触发 `store.subscribe`，derived-compute 的 ref 防重入是在 subscribe 回调中生效的，不会被绕过 |
| `UpdateNodePatch` 未 import | 低 | 低 | 检查 `plugins/types.ts` 的 import |

### 4.2 回退

改动是纯增量（接口加一个方法 + 对象加一个字段），删除即回退。

---

## 5. 实施记录

### 5.1 三验证（AGENTS.md §9.3）

执行前用本地代码当场验证（不在记忆层假设）：

| 维度 | 结论 |
| --- | --- |
| **存在性** | `plugins/types.ts` / `createTreeStore.ts` / `plugins.test.ts` / `04-plugin-system.md` 均存在 |
| **签名** | `UpdateNodePatch` 在 `core/types.ts` L119-121 已定义；`createTreeStore.ts` 内 `updateNode` 已在 L143-172 实现且 `TreeStoreApi` 接口 L74 已暴露；`PluginContext` 接口尚未包含 `updateNode` |
| **契约** | `updateNode` 在 `TreeStoreApi` 已暴露（调用方即写插件），`PluginContext` 暴露它是顺向扩展，未触动派生索引/单源禁区 |

### 5.2 落地点

| 文件 | 改动 |
| --- | --- |
| [`plugins/types.ts`](../../../packages-next/designer-core/src/plugins/types.ts) | import 增加 `UpdateNodePatch`；`PluginContext` 接口在 `setTree` 与 `setPartialState` 之间插入 `updateNode: (id: string, patch: UpdateNodePatch) => void` |
| [`createTreeStore.ts`](../../../packages-next/designer-core/src/core/store/createTreeStore.ts) | `pluginContext` 对象 L218-L222 顺序保持（`setTree → updateNode → setPartialState`），与 `TreeStoreApi` 对齐 |
| [`04-plugin-system.md`](../../documents/design/designer-core/04-plugin-system.md) | §2.1 PluginContext 接口代码块补充 `updateNode` 行；§4.4 契约第 3 条由"写入走 setTree"改为"结构性变更走 setTree，字段级更新走 updateNode" |
| [`plugins.test.ts`](../../../packages-next/designer-core/src/__tests__/plugins.test.ts) | 新增 `describe('PluginContext.updateNode（task-2026-08-05-003）')`，3 个用例 |

### 5.3 新增测试用例

1. **byId 引用复用**：构造 `[a, b]` 树，通过 `ctx.updateNode('a', { config: { left: 999 } })` 更新 a。验证：a 的 `data.config.left = 999`；b 的 `byId` 条目和数据引用完全不变（`buildIndex(components, oldById)` 的引用复用生效）
2. **不存在 id no-op**：`ctx.updateNode('non_existent_id', ...)` 后整个 state（components/byId/parentMap）引用保持不变（边界 2 命中早退）
3. **空 patch no-op**：`ctx.updateNode('a', {})` 后整个 state 引用保持不变，节点的 `byId['a'].data` 引用也保持（边界 3 命中早退）

测试通过自定义 inline `Plugin`（`type: 'runtime-data'`，闭包绑定 ctx）注入 store，调用方使用 `bridged.updateNode` 触发写路径。

### 5.4 验证结果

| 验证项 | 结果 |
| --- | --- |
| `pnpm test`（designer-core） | **197/197 通过**（11 个测试文件，`plugins.test.ts` 从 13 → 16 用例） |
| `pnpm exec tsc --noEmit`（designer-core） | **通过**（无错误） |
| 文档一致性 | §2.1 接口与 `plugins/types.ts` 对齐；§4.4 与代码契约一致 |
| 性能基线 | 440 节点 1000 次 `updateNode` P95 = 0.388ms（< 5ms 基线） |

### 5.5 风险复盘

- 已加的测试覆盖了 `updateNode` 的 3 个早退边界 + 1 条正常写路径
- 未引入新的写路径或改既有 `updateNode` 实现（仅扩展 `PluginContext` 的 API 表面）
- 删除对应字段即可回退（增量改动）
