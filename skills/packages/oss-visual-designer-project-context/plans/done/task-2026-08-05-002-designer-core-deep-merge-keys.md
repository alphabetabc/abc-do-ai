# task-2026-08-05-002：designer-core `config` 业务耦合解耦（deepMergeKeys 可配置）

> 创建日期：2026-08-05
> 完成日期：2026-08-06
> 状态：`done`
> 类型：`refactor`
> 前置文档：[research/tango-cross-review报告.md](../research/tango-cross-review报告.md) §3.1

---

## 1. 背景与目标

### 1.1 背景

Tango 交叉印证报告发现 `updateNode` 硬编码了 `config` 字段的二次浅合并，违反"框架不感知业务语义"原则（[00-overview.md](../design/designer-core/00-overview.md) §2.2）。

当前代码（[`write-paths.ts`](../../../packages-next/designer-core/src/core/store/write-paths.ts) L68-74）：

```ts
const newData = {
    ...targetNode.data,
    ...patch,
    config: patch.config
        ? { ...targetNode.data.config, ...patch.config }
        : targetNode.data.config,
};
```

`config` 是当前项目的业务字段（`WidgetData.config`），不是框架概念。其他业务如果 `data` 结构中没有 `config` 字段，或 `config` 不是对象类型，这段代码会出错或产生无意义的 `{ config: undefined }`。

### 1.2 目标

将 `config` 硬编码改为 `deepMergeKeys` 可配置参数，框架不再感知任何业务字段名。

### 1.3 分层决策（2026-08-05 review 确定）

业务字段定义和预设配置的分层如下：

| 层 | 职责 | 示例 |
|---|---|---|
| **designer-core** | 提供 `deepMergeKeys` 机制（泛型，不感知任何字段名） | `CreateTreeStoreOptions.deepMergeKeys?: string[]` |
| **designer-plugins** | 定义 `WidgetData` + 预设 `deepMergeKeys: ['config']` + 导出封装好的 `createDesigner` | `export function createDesignerForDesigner(options) { return createDesigner<WidgetData>({ ...options, deepMergeKeys: ['config'] }) }` |
| **src/ 应用层** | 用 designer-plugins 导出的 `createDesigner`，不需要传 `deepMergeKeys` | `import { createDesignerForDesigner } from '@fedx-vis/designer-plugins'` |

**决策理由**：我们不是在做通用开源框架，是在给这个项目做设计器架构。designer-plugins 层预设好业务字段和配置，应用层只管组装 UI + 选插件，联调路径最短。

**本 task 范围**：只改 designer-core 层（去掉 `config` 硬编码，换成 `deepMergeKeys` 机制）。预设 `['config']` 的工作放到 designer-plugins 层（task-006），因为 designer-plugins 包还没建。

### 1.4 不做什么

- 不改 `setTree` / `setPartialState` 的逻辑
- 不改 `PluginContext`（那是 task-003）
- 不改 `useTree` equalityFn（那是 task-005）
- 不在 designer-core 层预设 `['config']`（预设放到 designer-plugins 层）
- 不改设计文档（同步更新 02-write-path.md 是本 task 的一部分，但不涉及其他文档）

---

## 2. 详细步骤

### 2.1 `write-paths.ts`：`updateNodeImmutable` 增加 `deepMergeKeys` 参数

**文件**：[`packages-next/designer-core/src/core/store/write-paths.ts`](../../../packages-next/designer-core/src/core/store/write-paths.ts)

**改动**：

1. 函数签名增加 `deepMergeKeys: string[]` 参数（放在 `markModified` 之前）

```ts
export function updateNodeImmutable<TData extends Record<string, any>, TNode extends TreeNode<TData>>(
    components: TNode[],
    parentMap: Record<string, string>,
    id: string,
    patch: UpdateNodePatch,
    deepMergeKeys: string[],   // ← 新增
    markModified: () => void,
): TNode[] {
```

2. 替换 L66-74 的硬编码 `config` 合并为通用循环

**改前**：
```ts
const newData = {
    ...targetNode.data,
    ...patch,
    config: patch.config
        ? { ...targetNode.data.config, ...patch.config }
        : targetNode.data.config,
};
```

**改后**：
```ts
// deepMergeKeys 指定的字段做二次浅合并，其余字段只做顶层浅合并
const newData = { ...targetNode.data, ...patch };
for (const key of deepMergeKeys) {
    if (
        patch[key] != null &&
        typeof targetNode.data[key] === 'object' &&
        targetNode.data[key] !== null
    ) {
        newData[key] = { ...targetNode.data[key], ...patch[key] };
    }
}
```

### 2.2 `createTreeStore.ts`：`CreateTreeStoreOptions` 增加 `deepMergeKeys`

**文件**：[`packages-next/designer-core/src/core/store/createTreeStore.ts`](../../../packages-next/designer-core/src/core/store/createTreeStore.ts)

**改动**：

1. `CreateTreeStoreOptions` 接口增加字段（L36-43 区域）

```ts
export interface CreateTreeStoreOptions<...> {
    initialComponents?: TNode[];
    initialExtra?: TExtra;
    plugins?: Plugin<TNode, TFlat, TExtra>[];
    /** 需要二次浅合并的 data 字段名列表（默认空数组，框架不感知业务字段） */
    deepMergeKeys?: string[];
}
```

2. `createTreeStore` 函数体内解构并设默认值（L103 区域）

```ts
const {
    initialComponents = [],
    initialExtra = {} as TExtra,
    plugins = [],
    deepMergeKeys = [],
} = options;
```

3. `updateNode` 函数调用 `updateNodeImmutable` 时传入 `deepMergeKeys`（L148 区域）

**改前**：
```ts
const newComponents = updateNodeImmutable<TData, TNode>(
    state.components, state.parentMap, id, patch, () => { modified = true; }
);
```

**改后**：
```ts
const newComponents = updateNodeImmutable<TData, TNode>(
    state.components, state.parentMap, id, patch, deepMergeKeys, () => { modified = true; }
);
```

### 2.3 `types.ts`：`UpdateNodePatch` 更新注释

**文件**：[`packages-next/designer-core/src/core/types.ts`](../../../packages-next/designer-core/src/core/types.ts)

**改动**：L119-123 的 `UpdateNodePatch` 接口，移除 `config` 特殊字段注释

**改前**：
```ts
/**
 * 字段级更新 patch
 *
 * 对应 00-overview.md §5.4 + 02-write-path.md §3.1：
 * - 浅合并语义：patch 顶层字段覆盖 node.data 同名字段
 * - config 字段二次浅合并（与旧 patchFieldConf 语义一致）
 */
export interface UpdateNodePatch {
    [key: string]: any;
    /** config 字段二次浅合并（patch.config 字段覆盖 node.data.config 同名字段） */
    config?: Record<string, any>;
}
```

**改后**：
```ts
/**
 * 字段级更新 patch
 *
 * 对应 00-overview.md §5.4 + 02-write-path.md §3.1：
 * - 浅合并语义：patch 顶层字段覆盖 node.data 同名字段
 * - 需要二次浅合并的字段由 CreateTreeStoreOptions.deepMergeKeys 配置
 */
export interface UpdateNodePatch {
    [key: string]: any;
}
```

### 2.4 设计文档同步：`02-write-path.md`

**文件**：[`design/02-write-path.md`](../design/designer-core/02-write-path.md)

**改动**：§3.2.5 更新 `config` 硬编码描述为 `deepMergeKeys` 可配置

### 2.5 测试补充

**文件**：[`packages-next/designer-core/src/__tests__/write-paths.test.ts`](../../../packages-next/designer-core/src/__tests__/write-paths.test.ts)

**新增测试用例**：

1. `deepMergeKeys` 为空数组时，所有字段只做顶层浅合并（`patch.config = { left: 100 }` 直接覆盖 `data.config`，不合并）
2. `deepMergeKeys: ['config']` 时，`config` 字段做二次浅合并（`data.config = { left: 0, top: 0 }` + `patch.config = { left: 100 }` → `data.config = { left: 100, top: 0 }`）
3. `deepMergeKeys` 指定的字段在 `data` 中不是对象时，安全跳过（不报错，保持 patch 值）
4. `deepMergeKeys` 指定的字段在 `patch` 中为 `null`/`undefined` 时，不触发二次合并（保持顶层浅合并的覆盖语义）

**现有测试适配**：

现有测试中调用 `updateNode` 且依赖 `config` 二次浅合并行为的用例，需要在 `createTreeStore` options 中传 `deepMergeKeys: ['config']` 才能保持原有语义。需 grep 现有测试找到所有此类用例。

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| `deepMergeKeys` 功能正确 | `pnpm test`（新增 4 个测试用例） |
| 现有 190 tests 不回归 | `pnpm test` 全量通过（适配后的测试也通过） |
| 类型安全 | `pnpm exec tsc --noEmit`（仅 `packages-next/designer-core/`） |
| 文档与代码一致 | 02-write-path.md §3.2.5 与代码交叉核对 |

---

## 4. 风险与回退

### 4.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 现有测试依赖 `config` 合并行为，未传 `deepMergeKeys` 导致失败 | 高 | 中 | grep 现有测试中 `updateNode` + `config` 的用例，逐一适配（传 `deepMergeKeys: ['config']`） |
| `createDesigner` 聚合 API 未透传 `deepMergeKeys` | 低 | 低 | `createDesigner` 直接透传 `CreateTreeStoreOptions`，`deepMergeKeys` 会自然透传。预设 `['config']` 是 designer-plugins 层的事（task-006），不在本 task 范围 |

### 4.2 回退

改动是增量的：`deepMergeKeys` 默认空数组，不传则所有字段只做顶层浅合并。如需回退，传 `deepMergeKeys: ['config']` 即恢复原有行为。

---

## 5. 实施记录

> review 通过后在此记录实施过程。

### 2026-08-06 实施完成

#### 改动文件清单

| 文件 | 改动内容 |
|---|---|
| [`packages-next/designer-core/src/core/store/write-paths.ts`](../../../packages-next/designer-core/src/core/store/write-paths.ts) | `updateNodeImmutable` 增加 `deepMergeKeys: string[]` 参数；移除 `config` 硬编码，改为遍历 `deepMergeKeys` 通用循环；增加 `patch[key] === undefined` 视为"不改"语义 |
| [`packages-next/designer-core/src/core/store/createTreeStore.ts`](../../../packages-next/designer-core/src/core/store/createTreeStore.ts) | `CreateTreeStoreOptions` 增加 `deepMergeKeys?: string[]`；`createTreeStore` 解构默认值 `[]`；`updateNode` 调用 `updateNodeImmutable` 时透传 |
| [`packages-next/designer-core/src/core/types.ts`](../../../packages-next/designer-core/src/core/types.ts) | `UpdateNodePatch` 注释从"config 二次浅合并"改为"由 deepMergeKeys 配置"；移除 `config?: Record<string, any>` 字段特殊注释 |
| [`.trae/documents/design/designer-core/02-write-path.md`](../design/designer-core/02-write-path.md) | §3.2.5 标题/契约/代码 + §3.3 实现草案 + §8 一致性表 全部同步为 `deepMergeKeys` 描述 |
| [`packages-next/designer-core/src/__tests__/write-paths.test.ts`](../../../packages-next/designer-core/src/__tests__/write-paths.test.ts) | 1 个原测试加 `deepMergeKeys: ['config']`；1 个直接 `updateNodeImmutable` 调用补参数；新增 4 个 `deepMergeKeys` 机制测试 |
| [`packages-next/designer-core/src/__tests__/parity-with-current.test.ts`](../../../packages-next/designer-core/src/__tests__/parity-with-current.test.ts) | 1 个原测试加 `deepMergeKeys: ['config']`（验证 size 字段保留） |
| [`packages-next/designer-core/src/__tests__/designer.test.tsx`](../../../packages-next/designer-core/src/__tests__/designer.test.tsx) | 1 个原测试加 `deepMergeKeys: ['config']`（验证 config.name 保留） |

#### 关键实现细节

**1. `deepMergeKeys` 字段 `patch[key] === undefined` 语义**

实现层加了一条额外防护（超出 task §2.1 草案）：

```ts
for (const key of deepMergeKeys) {
    if (patch[key] === undefined) {
        // 顶层 spread 已用 undefined 覆盖，还原为目标节点原值（patch "不改" 语义）
        newData[key] = (targetNode.data as Record<string, any>)[key];
    } else if (
        patch[key] != null &&
        typeof targetNode.data[key] === 'object' &&
        targetNode.data[key] !== null
    ) {
        newData[key] = { ...targetNode.data[key], ...patch[key] };
    }
}
```

**理由**：原代码 `patch.config ? {...} : targetNode.data.config` 在 `patch.config === undefined` 时保留原 `data.config`。无脑的 `{ ...data, ...patch }` 顶层 spread 会用 `undefined` 覆盖，导致 `data.config = undefined`，与原语义偏离**。新增防护让 `deepMergeKeys` 字段维持"patch `undefined` = 不改"的隐含语义（其他顶层字段仍按 spread 行为）。

#### 验证结果

- `pnpm test`（packages-next/designer-core）：**194/194 通过**（含 4 个新增 deepMergeKeys 测试 + 3 个适配测试）
- `pnpm typecheck`（packages-next/designer-core）：**0 错误**
- 根仓 `pnpm exec tsc --noEmit`：仅 `packages/ui/src/material-selector/` pre-existing 错误（AGENTS.md §10.2 禁止修 `packages/*` pre-existing tsc 错误），与本 task 无关

#### 适配测试摘要

| 测试文件 | 原测试数 | 改动 | 新增 | 总数 |
|---|---|---|---|---|
| write-paths.test.ts | 27 | 2（1 加 options + 1 直接调用补参数） | 4（deepMergeKeys 机制） | 31 |
| parity-with-current.test.ts | 5 | 1（加 options） | 0 | 5 |
| designer.test.tsx | 19 | 1（加 options） | 0 | 19 |

#### 与 task §2.5 风险表对照

- ✅ 现有测试依赖 `config` 合并行为：grep 出 3 处，全部已传 `deepMergeKeys: ['config']`
- ✅ `createDesigner` 透传：`createDesigner` options 透传 `CreateTreeStoreOptions`，`deepMergeKeys` 自然透传
- ✅ 回退方案：传 `deepMergeKeys: ['config']` 恢复原行为（验证已通过 `parity-with-current.test.ts` 第 2 用例）

---

## 6. 后续任务（独立立项）

本 task 只修复 `config` 业务耦合。以下问题拆为独立 task：

| 编号 | 内容 | 类型 |
|---|---|---|
| task-003 | `PluginContext` 补充 `updateNode` | refactor |
| task-004 | 文档盲点补充（选中/拖拽决策 + undo/redo 备忘 + iframe 边界 + data 引用生命周期） | docs |
| task-005 | `useTree` equalityFn 文档修正 | docs |
| task-006 | designer-plugins P0 启动（createViewPlugin） | feature |
