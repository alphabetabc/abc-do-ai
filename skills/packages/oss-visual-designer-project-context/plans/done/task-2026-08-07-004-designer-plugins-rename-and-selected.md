# task-2026-08-07-004：designer-plugins 改名 + selected 放入 viewUI

> 创建日期：2026-08-07
> 状态：`in-progress`
> 类型：`refactor`
> 前置任务：task-2026-08-07-001 ~ 003（data-fetcher / realtime-data-flow / interaction）

> **路径修正**：原 plan 路径 `src/layer-ops/` 与代码不符，实际为 `packages-next/designer-plugins/src/layer-ops/`。

---

## 1. 背景与目标

### 1.1 改名：layer-ops → layer-management

`layer-ops` 不够清晰，`layer-management` 更准确表达"管理层"语义。

改动范围：
- 目录：`src/layer-ops/` → `src/layer-management/`
- 导出：`createLayerOpsPlugin` → `createLayerManagementPlugin`
- 类型：`LayerOpsPlugin` → `LayerManagementPlugin`
- PluginRegistry key：`layerOps` → `layerManagement`（**2026-08-10 修订**：plan 原写 `layerMgmt`，用户反馈缩写不优雅，统一改为完整名；group 同步改为 `groupManagement`）
- 测试文件路径 + import

### 1.2 selected 放入 viewUI

当前 `selected`（选中节点 id）没有归属。讨论结论：放 `extra.viewUI.selected`，和 `tabsKey` / `settingCollapsed` 同层，都是 UI 交互状态。

改动范围：
- `ViewUIState` 新增 `selected: string | null`
- `useSelected()` hook
- `useSetSelected()` hook

---

## 2. 详细步骤

### 2.1 layer-ops → layer-management 改名

| 文件 | 改动 |
|---|---|
| `src/layer-ops/` | 目录重命名为 `src/layer-management/` |
| `src/layer-management/index.ts` | `createLayerOpsPlugin` → `createLayerManagementPlugin` |
| `src/layer-management/types.ts` | `LayerOpsPlugin` → `LayerManagementPlugin` |
| `src/plugin-registry.ts` | `layerOps: LayerOpsPlugin` → `layerMgmt: LayerManagementPlugin` |
| `src/index.ts` | 导出名更新 |
| `src/__tests__/layer-ops*.test.ts` | 文件名 + import 更新 |

### 2.2 selected 放入 viewUI

**文件**：`src/view/types.ts`

```ts
export interface ViewUIState {
    // ... 已有字段
    selected: string | null;    // ← 新增
}
```

**文件**：`src/view/plugin.ts`

新增 hooks：

```ts
useSelected: () => {
    const store = useTypedStore();
    return useExtra(store, (s) => s.viewUI?.selected ?? null);
},

useSetSelected: () => {
    const store = useTypedStore();
    const setView = useSetView();
    return usePersistFn((id: string | null) => {
        setView({ selected: id });
    });
},
```

**默认值**：`selected: null`

### 2.3 更新 PluginRegistry

```ts
export interface PluginRegistry {
    view: ViewPlugin;
    layerMgmt: LayerManagementPlugin;    // ← 改名
    groupMgmt: GroupManagementPlugin;
    // ...
}
```

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| 改名后所有 import 正确 | `pnpm exec tsc --noEmit` |
| 现有测试不回归 | `pnpm test` 全量通过 |
| selected 读写正确 | 新增测试用例 |
| selected 默认 null | 测试用例 |

---

## 4. 风险与回退

### 4.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 改名遗漏 | 中 | 低 | tsc 会报所有 import 错误，逐一修复即可 |
| selected 与现有选中逻辑冲突 | 低 | 低 | 新架构是全新的，没有旧选中逻辑冲突 |

### 4.2 回退

改名是纯机械操作，git revert 即可。selected 是新增字段，删除即回退。

---

## 5. 实施记录

### 5.1 实际改动文件清单（实测）

#### Part 1: layer-ops → layer-management 改名

| 文件 | 类型 | 说明 |
|---|---|---|
| `packages-next/designer-plugins/src/layer-ops/index.ts` | 删除 | 旧 barrel |
| `packages-next/designer-plugins/src/layer-ops/plugin.ts` | 删除 | 旧实现 |
| `packages-next/designer-plugins/src/layer-ops/types.ts` | 删除 | 旧类型 |
| `packages-next/designer-plugins/src/layer-management/index.ts` | 新建 | 新 barrel（导出 `createLayerManagementPlugin`） |
| `packages-next/designer-plugins/src/layer-management/plugin.ts` | 新建 | 新实现（plugin.name = `'layer-management-plugin'`） |
| `packages-next/designer-plugins/src/layer-management/types.ts` | 新建 | 新类型（`LayerManagementPlugin` / `LayerManagementPluginOptions`） |
| `packages-next/designer-plugins/src/plugin-registry.ts` | 改 | import 改 `./layer-management`；key `layerOps` → `layerMgmt`；类型 import |
| `packages-next/designer-plugins/src/index.ts` | 改 | barrel 导出名 |
| `packages-next/designer-plugins/src/create-designer.ts` | 改 | JSDoc 同步 |
| `packages-next/designer-plugins/src/__tests__/layer-ops-plugin.test.tsx` | 删除 | 旧测试 |
| `packages-next/designer-plugins/src/__tests__/layer-ops-move-copy-delete.test.tsx` | 删除 | 旧测试 |
| `packages-next/designer-plugins/src/__tests__/layer-management-plugin.test.tsx` | 新建 | 新测试 |
| `packages-next/designer-plugins/src/__tests__/layer-management-move-copy-delete.test.tsx` | 新建 | 新测试 |
| `packages-next/designer-plugins/src/__tests__/plugin-registry.test.ts` | 改 | `layerOps` → `layerMgmt` |
| `packages-next/designer-plugins/src/data-fetcher/plugin.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/data-fetcher/types.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/group-management/plugin.ts` | 改 | JSDoc 注释（4 处） |
| `packages-next/designer-plugins/src/group-management/types.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/interaction/plugin.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/realtime-data-flow/plugin.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/realtime-data-flow/types.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/src/hooks/use-persist-fn.ts` | 改 | JSDoc 注释 |
| `packages-next/designer-plugins/package.json` | 改 | description 同步 |

#### Part 2: selected 放入 viewUI

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/types.ts` | `ViewUIState` 新增 `selected: string \| null`；`defaultViewUIState.selected = null` |
| `packages-next/designer-plugins/src/view/types.ts` | `ViewPlugin` 新增 `useSelected` + `useSetSelected` |
| `packages-next/designer-plugins/src/view/plugin.ts` | `VIEW_UI_KEYS` 加入 `'selected'`；新增 `useSelected` hook（用 `useExtra`）；return 新增 `useSetSelected`（走 `useSetView` + `usePersistFn`） |
| `packages-next/designer-plugins/src/__tests__/view-plugin.test.tsx` | 19 个 hook 断言；新增 4 个 selected 测试（默认值 / 写入 / 清空 / 与 useSetView 等价） |

### 5.2 关键决策

1. **`useSetSelected` 实现路径**：内部调用 `useSetView()` + `usePersistFn()`，复用既有的浅合并 + 其它 extra 字段引用保留逻辑（与 task-002-3 / task-003 同模式）。
2. **`selected` 字段类型**：用 `string \| null` 而非 `string \| undefined` —— `null` 显式表达"未选中"，避免与"字段不存在"语义混淆。
3. **`VIEW_UI_KEYS` 必须包含 `'selected'`**：`useSetView` 的 patch 分桶逻辑依赖此 Set 决定字段走 viewUI 还是被丢弃（这是实测中发现的坑 —— 调试发现没加入 Set 时 `setView({ selected: 'a' })` 静默不写）。

### 5.3 验证结果

| 验证项 | 结果 |
|---|---|
| `pnpm exec tsc --noEmit`（designer-plugins） | ✅ 0 errors |
| `pnpm test`（designer-plugins） | ✅ 9 个文件 / 160 用例全过（含新增 4 个 selected 用例 + 改名后的 29 个 layer-management 用例） |
| `pnpm test`（designer-core） | ✅ 11 个文件 / 197 用例全过（无回归） |
| `pnpm test`（src/） | ✅ 9 个文件 / 72 用例全过（无回归） |
| `Grep layer-ops\|LayerOps\|createLayerOps\|layerOps\|LayerOpsPlugin` | ✅ 0 匹配 |
| 主仓 `tsc --noEmit` 残留错误 | ⚠️ 仅 `packages/ui/src/material-selector/` 的 pre-existing 错误（与本任务无关，按 AGENTS.md §10.2 不修） |

### 5.4 遇到的问题

- **SearchReplace 静默失配**：多次对同一文件的 SearchReplace 调用（多轮 + 大上下文匹配）出现"diff 显示成功但实际未写入"现象，需逐行 Read + 小上下文 SearchReplace 验证。已通过最终 Read 全部确认。
- **`VIEW_UI_KEYS` 漏写 `'selected'`**：第一次 SearchReplace 后 ts 通过但运行时 `setView({ selected })` 不写 store。临时加 console.log 定位到 `VIEW_UI_KEYS.has('selected') === false`（浅合并走到"两 bucket 都空"早退分支），修复后通过。

### 5.5 2026-08-10 修订：Registry key 去掉缩写

用户反馈 `layerMgmt` / `groupMgmt` 缩写不优雅，统一改为完整名词：

- `PluginRegistry.layerMgmt` → `layerManagement`
- `PluginRegistry.groupMgmt` → `groupManagement`

为保持一致性，**所有局部变量 + JSDoc + 测试** 也同步重命名（局部 var `const layerMgmt = ...` → `const layerManagement = ...`；`plugins: { layerMgmt }` → `plugins: { layerManagement }` 等）。

执行方式：写 `.trae/scripts/rename-mgmt-to-management.mjs` 脚本批量替换（7 个文件 / 196 处替换），避免手动逐个 SearchReplace 出错。

验证：tsc 0 errors；tests 9 文件 / 160 用例全过；Grep `layerMgmt|groupMgmt` 0 匹配。
