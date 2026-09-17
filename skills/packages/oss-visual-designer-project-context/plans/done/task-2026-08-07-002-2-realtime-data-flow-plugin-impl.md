# task-2026-08-07-002-2：realtime-data-flow plugin.ts 实现 + barrel + 顶层导出

> 完成日期：2026-08-07
> 状态：`done`
> 类型：`feature`（task-002 子任务）
> 父任务：[`task-2026-08-07-002-designer-plugins-realtime-data-flow.md`](./task-2026-08-07-002-designer-plugins-realtime-data-flow.md) §4.4 + §4.6 + §4.7
> 前置：[`task-2026-08-07-002-1`](./task-2026-08-07-002-1-realtime-data-flow-types.md)（类型定义）

---

## 1. 范围

实现 `createRealtimeDataFlowPlugin` 工厂 + 5 个 hook + plugin 空壳 + barrel + 顶层导出。**不涉及注册**（plugin-registry 注册见子任务 [002-3](./task-2026-08-07-002-3-realtime-data-flow-registration.md)）。

## 2. 涉及文件

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/realtime-data-flow/plugin.ts`（新文件） | `createRealtimeDataFlowPlugin` 工厂 + 5 hooks（dispatch / useRealtimeDataFlowData / useRealtimeDataFlowDataSource / useRemoveRealtimeDataByUniqueId / useClearRealtimeData）+ plugin 空壳 + Error 序列化 |
| `packages-next/designer-plugins/src/realtime-data-flow/index.ts`（新文件） | barrel 导出 plugin + types |
| `packages-next/designer-plugins/src/index.ts` | 顶层 export 新增 createRealtimeDataFlowPlugin + RealtimeDataFlowPlugin 类型 + 3 个默认值 + RealtimeDataFlowItem / TRealtimeDataFlowDataItem 类型 |

## 3. 实施步骤

### 3.1 实现 `plugin.ts`

参考样板：[`packages-next/designer-plugins/src/data-fetcher/plugin.ts`](file:///e:/oss-fe-git/frame/oss-visual-designer/packages-next/designer-plugins/src/data-fetcher/plugin.ts)（task-001 done，6 hooks + plugin 空壳）。

5 个 hook 实现要点（对照父任务 §5 风险点 + §4.4 子步骤）：

| Hook | 关键实现 |
|---|---|
| `dispatch(uniqueId, list)` | `useTypedStore()` 取 store + state；写路径浅展开 `extra: { ...extra, realtimeDataFlowData: { ...extra.realtimeDataFlowData, [uniqueId]: list } }`；加 `_.isEqual(pre, list)` 等值守卫生效性；`list` 含 Error 时调 `serializeRealtimeData(data)` 转 `SerializableError`（对照 task-001 done §8.2.2） |
| `useRealtimeDataFlowData<T>(fetcherId)` | `useExtra(store, (s) => s.realtimeDataFlowData[fetcherId], shallowEqual)` 订阅；fetcherId 不存在返回 undefined；泛型 `<T = any>` |
| `useRealtimeDataFlowDataSource(ownerProps, opts, listener)` | dataType === IframeSource 时调 `useRealtimeDataFlowData(subscribeSourceId)` 订阅；effect 内维护 `cancelled` flag + `latestRef`（task-001 done §8.2.4 epoch guard）；listener 回调传 `{ rows }`（rowsConvertor 转换）；从 `ownerProps.value.dataConfig.iframeSource.*` 提取 `enablePreDpu` / `selectedPreDpu` / `enablePostDpu` / `selectedPostDpu` / `fieldMapping` / `enableStrictFieldMapping` / `dataFilter` / `itemConvertor` |
| `useRemoveRealtimeDataByUniqueId(uniqueId)` | 浅展开 + `delete realtimeDataFlowData[uniqueId]`（不存在的 uniqueId 静默跳过） |
| `useClearRealtimeData()` | 写 `extra.realtimeDataFlowData = {}` |
| `plugin` 空壳 | `{ name: 'realtime-data-flow', type: 'plugin', init?: () => {} }`（无副作用） |

### 3.2 创建 `realtime-data-flow/index.ts`

```ts
export { createRealtimeDataFlowPlugin } from './plugin';
export type { RealtimeDataFlowPlugin } from './types';
```

### 3.3 更新顶层 `index.ts`

新增：
```ts
export { createRealtimeDataFlowPlugin } from './realtime-data-flow';
export type { RealtimeDataFlowPlugin } from './realtime-data-flow';
export {
    defaultRealtimeDataFlowData,
    defaultRealtimeDataFlow,
    defaultCustomFieldsListMapping,
} from './types';
export type { RealtimeDataFlowItem, TRealtimeDataFlowDataItem } from './types';
```

## 4. 验证

- [x] `pnpm exec tsc --noEmit` 0 错误（designer-plugins 包；**说明**：2 个下游级联错误归属 002-3，见 §6）
- [x] `createRealtimeDataFlowPlugin()` 返回值结构：`{ plugin: { name, type, init? }, dispatch, useRealtimeDataFlowData, useRealtimeDataFlowDataSource, useRemoveRealtimeDataByUniqueId, useClearRealtimeData }`
- [x] 工厂可在测试中调用（plugin.init 无副作用，tsc 编译通过即可）
- [x] 顶层 index.ts export 全部就位

## 5. 完成后

- 更新本任务状态 → `done`，移入 `plans/done/` ✅
- 在父任务 task-002 §7.1 标记 "步骤 4-6" 完成（plugin + barrel + index）✅
- 启动子任务 002-3（注册 + view/plugin 字段保留）

## 6. 实施记录

### 6.1 改动清单

| 文件 | 改动 |
|---|---|
| [`packages-next/designer-plugins/src/realtime-data-flow/plugin.ts`](../../../packages-next/designer-plugins/src/realtime-data-flow/plugin.ts)（新文件） | `createRealtimeDataFlowPlugin()` 工厂 + 5 hooks（dispatch / useRealtimeDataFlowData / useRealtimeDataFlowDataSource / useRemoveRealtimeDataByUniqueId / useClearRealtimeData）+ plugin 空壳 + `deepEqual`（JSON.stringify）+ `serializeRealtimeData`（Error → SerializableError）+ `useLatestRef` 工具 |
| [`packages-next/designer-plugins/src/realtime-data-flow/types.ts`](../../../packages-next/designer-plugins/src/realtime-data-flow/types.ts)（修改） | 补充 `TreeNode` / `FlatNode` / `WidgetData` / `DesignerExtra` import；`plugin` 字段从 `Plugin` 默认泛型改为 `Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>`（与 data-fetcher 一致） |
| [`packages-next/designer-plugins/src/realtime-data-flow/index.ts`](../../../packages-next/designer-plugins/src/realtime-data-flow/index.ts)（新文件） | barrel：`createRealtimeDataFlowPlugin` + `RealtimeDataFlowPlugin` 类型 |
| [`packages-next/designer-plugins/src/index.ts`](../../../packages-next/designer-plugins/src/index.ts)（修改） | 业务类型追加 `RealtimeDataFlowItem` / `TRealtimeDataFlowDataItem`；默认值追加 `defaultRealtimeDataFlowData` / `defaultRealtimeDataFlow` / `defaultCustomFieldsListMapping`；插件追加 `createRealtimeDataFlowPlugin` + `RealtimeDataFlowPlugin` |

### 6.2 tsc 验证

`pnpm --filter @fedx-vis/designer-plugins exec tsc --noEmit` 结果：

- ✅ 5 个 hooks + plugin 空壳 + barrel + 顶层 export 全部 0 错误
- ⚠️ 2 个下游级联错误（**归属 task-002-3**）：
  - `src/create-designer.ts(117,9)` — `initialExtra` 缺 3 字段，task-002-3 §4.2 处理
  - `src/view/plugin.ts(170,19)` — view setView 的 extra payload 缺 3 字段保留，task-002-3 §4.5 处理

### 6.3 决策记录

**1. 等值守卫用 `JSON.stringify` 替代 `_.isEqual`**

designer-plugins 包依赖只有 `@fedx-vis/designer-core` + zustand（无 lodash），所以用 `JSON.stringify` 实现深等比较（与 src/ `_.isEqual` 语义对齐）：

- 循环引用：JSON.stringify 抛 TypeError → 捕获后回退到 `false`（保守更新）
- 性能：O(n) 序列化，足够实时数据 list（数组 + 普通对象）的常见场景

**2. `useRealtimeDataFlowDataSource` 降级实现（不做完整 rowsConvertor）**

src/ 的 `useRealtimeDataFlowDataSource` 内部用 `rowsConvertor` 做 DPU / fieldMapping / dataFilter 等转换，依赖 lodash + condition + runDpuList + oss-web-toolkits（src/ 特定）：

- 这些依赖不能下沉到 designer-plugins 包（保持包纯净，task-001 done §1.3 既定约束）
- 002-5 迁移 `DataFetcher.ts:353` 调用方时，由调用方保留转换逻辑（沿用 src/ RealtimeDataFlow.rowsConvertor）
- 当前实现：dataType === IframeSource 时 `listenerRef.current({ rows })` 直接传 rows，无转换

**3. 命令式 API（dispatch / useRemoveRealtimeDataByUniqueId / useClearRealtimeData）的实现选择**

按任务文档签名实现（命令式调用形态），但内部仍用 `useTypedStore()` 拿 store（与 `useRealtimeDataFlowData` 风格一致）：

- `dispatch = useDispatch()`：在 React 渲染期间创建稳定的命令式函数，调用方随时可调用
- `useRemoveRealtimeDataByUniqueId(uniqueId)` / `useClearRealtimeData()`：命令式形态，调用方需在 React 渲染期间调用（按 hook 规则），不依赖 React 渲染上下文

设计观察（供后续 review 参考）：接口签名 `(uniqueId) => void` / `() => void` 与 React Hooks 习惯略有偏差（hook 通常返回数据），但严格按任务文档设计执行。如未来需要"返回函数"形态，可加兼容方法：
```ts
useRemoveRealtimeDataByUniqueId(): (uniqueId: string) => void  // 返回函数版本
```

**4. `useLatestRef` 本地工具**

新增 `useLatestRef(value)`：每次渲染同步最新值到 ref，但**不订阅 store**（与 designer-core `useLatestState` 不同）。用于 `useRealtimeDataFlowDataSource` 内 listener / dataType 跨异步边界用最新值。

**5. types.ts 接口 `plugin` 字段补全泛型**

002-1 文档示例签名 `plugin: Plugin`（默认泛型），但实现时 `Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>` 与默认值不兼容（PluginContext 类型不匹配），tsc 报错。补充泛型后与 data-fetcher 接口风格一致。

### 6.4 数据流契约（实现后验证）

| 写入路径 | 调用方 | 内部实现 |
|---|---|---|
| dispatch | 数据源推送方（任意位置） | 等值守卫 → Error 序列化 → `setPartialState({ extra: { ...extra, realtimeDataFlowData: { ...data, [uniqueId]: list } } })` |
| useRemoveRealtimeDataByUniqueId | 组件卸载清理 | `setPartialState({ extra: { ...extra, realtimeDataFlowData: { ...data, [删 uniqueId] } } })` |
| useClearRealtimeData | 切应用 scope / reset | `setPartialState({ extra: { ...extra, realtimeDataFlowData: {} } })` |

⚠️ **唯一拥有者契约**：上述三个方法 + `dispatch` 是 `extra.realtimeDataFlowData` 的全部写入入口。其他插件（如 interaction）必须通过此入口写入。

### 6.5 后续

- 002-3：create-designer 注入默认值 + plugin-registry 注册 + view/plugin 字段保留（修复 2 个级联 tsc 错误）
- 002-4：单元测试（25 用例 / 9 describe，覆盖 dispatch 等值守卫 / Error 序列化 / useRealtimeDataFlowData 订阅 / useRemoveRealtimeDataByUniqueId 清理 / useClearRealtimeData / view-plugin field isolation / 跨插件 runtime-data 集成）
- 002-5：调用方迁移（DataFetcher.ts:353 + 4 处订阅方）+ 死代码清理（src/plugins/data-fetcher/RealtimeDataFlow.ts 整文件）+ 文档同步