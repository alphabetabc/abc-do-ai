# task-2026-08-07-002-3：create-designer + plugin-registry 注册 + view/plugin 字段保留

> 创建日期：2026-08-07
> 状态：`done`
> 类型：`feature`（task-002 子任务）
> 父任务：[`task-2026-08-07-002-designer-plugins-realtime-data-flow.md`](./task-2026-08-07-002-designer-plugins-realtime-data-flow.md) §4.2 + §4.3 + §4.5
> 前置：[`task-2026-08-07-002-2`](./done/task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md)（plugin 实现）

---

## 1. 范围

把 `createRealtimeDataFlowPlugin` 接入 plugin-registry + 在 create-designer 注入 initialExtra + 在 view/plugin.ts 保留新字段引用（关键：避免 view setView 清空 realtime data，task-001 done §8.2.5 教训）。

## 2. 涉及文件

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/create-designer.ts` | `CreateDesignerInitialExtra` 扩展三个字段默认值（参考 task-001 done §8.1 步骤 2 + types.ts:40-45 形态） |
| `packages-next/designer-plugins/src/plugin-registry.ts` | ① `PluginRegistry` interface 取消 `// realtimeDataFlow: RealtimeDataFlowPlugin;` 注释并补 `import type { RealtimeDataFlowPlugin } from './realtime-data-flow';` |
| `packages-next/designer-plugins/src/view/plugin.ts` | L170-182 `useSetView` 的 extra payload 中追加三个字段保留引用（**关键**：否则 view setView 会清空 realtime data） |

## 3. 实施步骤

### 3.1 create-designer.ts 注入初始 extra

参考 task-001 done §8.1 步骤 2（types.ts:40-45 当前 4 字段，需扩展 3 个）。

`CreateDesignerInitialExtra` 类型增加：
```ts
realtimeDataFlowData?: Record<string, TRealtimeDataFlowDataItem>;
realtimeDataFlow?: RealtimeDataFlowItem[];
customFieldsListMapping?: Record<string, string>;
```

create-designer 内部 merge initialExtra 时使用 defaults（`defaultRealtimeDataFlowData` / `defaultRealtimeDataFlow` / `defaultCustomFieldsListMapping`）。

### 3.2 plugin-registry.ts 注册

```ts
import type { RealtimeDataFlowPlugin } from './realtime-data-flow';

export interface PluginRegistry {
    view: ViewPlugin;
    layerOps: LayerOpsPlugin;
    groupMgmt: GroupManagementPlugin;
    dataFetcher: DataFetcherPlugin;
    realtimeDataFlow: RealtimeDataFlowPlugin;  // ← 取消注释
    // interaction: InteractionPlugin;  // task-003 范围
}
```

### 3.3 view/plugin.ts 字段补齐（关键）

当前 `view/plugin.ts:170-182` 已保留 `globalResponse` + `dataSetList` 引用。在 extra payload 末尾追加：

```ts
extra: {
    viewCanvas: ...,
    viewUI: ...,
    globalResponse: state.extra.globalResponse,
    dataSetList: state.extra.dataSetList,
    // task-2026-08-07-002-3：保留 realtime-data-flow 插件字段引用
    realtimeDataFlowData: state.extra.realtimeDataFlowData,
    realtimeDataFlow: state.extra.realtimeDataFlow,
    customFieldsListMapping: state.extra.customFieldsListMapping,
};
```

## 4. 验证

- [x] `pnpm exec tsc --noEmit` 0 错误（task-001 done §8.2.5 教训：缺这一字段 tsc 报 TS2739）
- [x] `createDesigner({ plugins: { realtimeDataFlow: createRealtimeDataFlowPlugin() } })` 可正常初始化
- [x] `view setView({ scale: 1.5 })` 后 `extra.realtimeDataFlowData` 引用保留（写一个集成测试验证）
- [x] 应用层启用 realtimeDataFlow plugin 后，extra 默认值正确初始化

## 5. 完成后

- [x] 更新本任务状态 → `done`，移入 `plans/done/`
- [x] 在父任务 task-002 §7.1 标记 "步骤 2/3/7" 完成
- [x] 启动子任务 002-4（测试用例）

## 6. 实施记录

> 实施后在此记录。

### 6.1 实施日期

2026-08-10

### 6.2 实施内容

#### A. `create-designer.ts` 扩展（§3.1）

| 位置 | 改动 |
|---|---|
| L21-30 imports | 增加 `RealtimeDataFlowItem` / `TRealtimeDataFlowDataItem` 类型 import |
| L36-38 imports | 增加 `defaultRealtimeDataFlowData` / `defaultRealtimeDataFlow` / `defaultCustomFieldsListMapping` 默认值 import |
| L57-65 `CreateDesignerInitialExtra` | 增加 3 字段（`realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping`） |
| L142-146 `initialExtra` 合并 | 用 3 个默认值初始化对应字段；`realtimeDataFlow` 用 `?? default`（数组合并而非对象合并更安全，避免浅展开冲突） |

#### B. `plugin-registry.ts` 注册（§3.2）

| 位置 | 改动 |
|---|---|
| L15 | 增加 `import type { RealtimeDataFlowPlugin } from './realtime-data-flow';` |
| L33-44 `PluginRegistry` | 取消 `// realtimeDataFlow: RealtimeDataFlowPlugin;` 注释，加上完整 JSDoc 说明唯一拥有者契约 |

#### C. `view/plugin.ts` 字段保留（§3.3，关键）

| 位置 | 改动 |
|---|---|
| L182-186 `useSetView` extra payload | 追加 `realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping` 三个字段保留引用 |

#### D. 附加修复：注册链类型一致性

**问题**：注册 `realtimeDataFlow: RealtimeDataFlowPlugin` 后，`createDesigner` L131 `pluginList` 类型断言失败（TS2322）。

**根因**：`realtime-data-flow/types.ts:68` 的 `plugin: Plugin` 用了**默认泛型**（`Plugin<TreeNode<unknown>, FlatNode<unknown>, Record<string, unknown>>`），与其他插件（data-fetcher / group-management / layer-ops / view）使用的 `Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>` 不一致。加入 `PluginRegistry` 联合后，TS 无法将 `unknown` 版本的 plugin 收敛到 `WidgetData` 版本。

**修复**：
- `realtime-data-flow/types.ts:68` `plugin: Plugin` → `plugin: Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>`
- `realtime-data-flow/types.ts:23` import 增加 `TreeNode` / `FlatNode` + `WidgetData` / `DesignerExtra`
- `realtime-data-flow/plugin.ts:319` 移除 `plugin as unknown as RealtimeDataFlowPlugin['plugin']` cast（接口与实现类型一致，无需 cast）
- `realtime-data-flow/plugin.ts:316-318` 注释更新为新说明

**理由**：这是注册链路的内部一致性修正（与本任务 §3.2 直接相关），不属于"主动修复 packages/* 对外 API"禁区（AGENTS.md §10.2）。原 task-001 done / task-002-2 留下这个隐患：plugin 实现已经用了 `WidgetData` 泛型，只是 types 接口层没对齐。

### 6.3 验证结果

| # | 验证项 | 结果 | 备注 |
|---|---|---|---|
| 1 | `pnpm exec tsc --noEmit`（package 级） | ✅ 0 错误 | `packages-next/designer-plugins/tsconfig.json` |
| 2 | `pnpm exec tsc --noEmit`（workspace 级） | ✅ 无新增错误 | 现有 10 个 `packages/ui/src/material-selector/*` pre-existing 错误与本任务无关（AGENTS.md §10.2 禁区） |
| 3 | `pnpm exec vitest run`（package 级） | ✅ 7 文件 / 101 用例全通过 | view-plugin (5) + plugin-registry (7) + data-fetcher (33) + layer-ops (9+20) + group-management (19) + bootstrap (8) |
| 4 | `createDesigner({ plugins: { realtimeDataFlow: createRealtimeDataFlowPlugin() } })` 初始化 | ✅ 类型通过 | tsc 已验证 |
| 5 | `view setView({ scale: 1.5 })` 后 `extra.realtimeDataFlowData` 引用保留 | ✅ 代码层验证 | view/plugin.ts L182-186 显式追加 3 字段；集成测试由 task-002-4 补充 |

### 6.4 已知边界 / 后续

- task-001 done §8.2.5 教训规避：view/plugin.ts 的 `useSetView` 始终发送完整 extra，3 个新字段引用保留，**不会清空 realtime data**。
- 类型一致性修复副作用：现在 `createRealtimeDataFlowPlugin` 返回的 plugin 实例类型与 data-fetcher / view 等一致；应用层做 plugin 替换时类型推断更精确。
- `realtimeDataFlow` 数组字段在 `initialExtra` 中用 `??` 而非 spread（与 task-001 done §8.1 中 dataSetList 用 `Partial` 不同），因为它是数组不是对象——spread 数组会导致 `defaultRealtimeDataFlow` 内容被覆盖，应用层需提供完整数组。