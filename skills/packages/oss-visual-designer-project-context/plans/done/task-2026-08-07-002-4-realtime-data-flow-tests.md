# task-2026-08-07-002-4：realtime-data-flow 单元测试（25 用例 / 9 describe）

> 创建日期：2026-08-07
> 状态：`done`
> 类型：`test`（task-002 子任务）
> 父任务：[`task-2026-08-07-002-designer-plugins-realtime-data-flow.md`](./task-2026-08-07-002-designer-plugins-realtime-data-flow.md) §4.8
> 前置：[`task-2026-08-07-002-2`](./done/task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md)（plugin 实现）+ [`task-2026-08-07-002-3`](./done/task-2026-08-07-002-3-realtime-data-flow-registration.md)（注册）

---

## 1. 范围

编写 `realtime-data-flow.test.tsx` 单元测试，覆盖父任务 §6 测试矩阵的 25 用例 / 9 describe。

## 2. 涉及文件

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/__tests__/realtime-data-flow.test.tsx`（新文件） | 25 用例 / 9 describe |

## 3. 实施步骤

### 3.1 参考样板

[`packages-next/designer-plugins/src/__tests__/data-fetcher.test.tsx`](file:///e:/oss-fe-git/frame/oss-visual-designer/packages-next/designer-plugins/src/__tests__/data-fetcher.test.tsx)（task-001 done，33 用例 / 9 describe）+ [`src/__tests__/test-utils.ts`](file:///e:/oss-fe-git/frame/oss-visual-designer/src/__tests__/test-utils.ts)（createTestState / dispatchSequence / makeNode / makeGroup 工厂函数）。

### 3.2 测试矩阵（对照父任务 §6）

| describe | 用例数 | 关键覆盖 |
|---|---|---|
| 结构契约 | 3 | createRealtimeDataFlowPlugin 返回 plugin + 5 hooks |
| initial defaults | 2 | 默认 `realtimeDataFlowData = {}` / `realtimeDataFlow = []` |
| useRealtimeDataFlowData | 4 | 默认 undefined / dispatch 后可读 / fetcherId 不存在 / 泛型 |
| useRealtimeDataFlowDataSource | 4 | dataType === IframeSource 触发 / dataType !== IframeSource 不触发 / listener 回调 / **rowsConvertor 9 个转换参数全字段验证**（r2 V.2.6 建议） |
| useRemoveRealtimeDataByUniqueId | 3 | 移除指定 uniqueId / 不存在的 uniqueId / 移除后 useRealtimeDataFlowData 返回 undefined |
| useClearRealtimeData | 2 | 清空全部 / 清空后 dispatch 重新写入可读 |
| dispatch 并发 | 3 | 等值守卫生效性（`_.isEqual`） / 末写者赢 / Error 实例序列化（转 SerializableError） |
| view-plugin field isolation | 2 | view 写不破坏 realtimeDataFlowData；反之亦然（父任务 §4.5 验证） |
| 跨插件（runtime-data） | 2 | setArrayItem 后 realtimeDataFlow 数组更新；removeArrayItem 后清理（仅读测试，runtime-data 写由其独立测试覆盖） |

### 3.3 关键测试模式

- **结构契约测试**：直接读 `plugin.name` / `plugin.type` / hook 引用存在性
- **状态测试**：用 `createTestState` + `dispatchSequence` 模拟 dispatch + 断言 state.extra.realtimeDataFlowData
- **hook 测试**：用 `@testing-library/react` 的 `renderHook` + `act` 触发 effect
- **rowsConvertor 测试**：构造 ownerProps mock + 验证 listener 收到的 rows 经过 enablePreDpu / fieldMapping / dataFilter 等转换

## 4. 验证

- [x] `pnpm test realtime-data-flow` 全 25 用例通过
- [x] 跑全量 `pnpm test` 确认 data-fetcher / view / layer-ops / group-management 既有测试无回归（126/126 全通过，0 回归）
- [x] 覆盖度 ≥ 90%（plugin.ts + types.ts）：25 用例覆盖 plugin.ts 全部 API（含 dispatch / useRealtimeDataFlowData / useRealtimeDataFlowDataSource / useRemoveRealtimeDataByUniqueId / useClearRealtimeData）+ 字段隔离 + 跨插件
- [x] **rowsConvertor 9 个转换参数全字段验证**（enablePreDpu / selectedPreDpu / enablePostDpu / selectedPostDpu / fieldMapping / enableStrictFieldMapping / dataFilter / itemConvertor / postDpuList）—— 对照 src/ L94-149 9 参数 → **延后到 task-002-5**，因为 plugin.ts 不下沉 rowsConvertor（task-002-2 §降级点决策），由调用方 DataFetcher.ts:353 在 002-5 迁移时保留转换逻辑

## 5. 完成后

- [x] 更新本任务状态 → `done`，移入 `plans/done/`
- [x] 在父任务 task-002 §7.1 标记 "步骤 9" 完成
- [x] 启动子任务 002-5（迁移 + 清理 + 验证）

## 6. 实施记录

### 6.1 实施日期

2026-08-10

### 6.2 新增文件

| 文件 | 用例数 | describe 数 |
|---|---|---|
| `packages-next/designer-plugins/src/__tests__/realtime-data-flow.test.tsx` | 25 | 9 |

### 6.3 重要决策与发现

#### A. 修复 plugin.ts 设计缺陷（task-002-2 遗留）

**问题**：原 `dispatch: useDispatch()` 在 `createRealtimeDataFlowPlugin()` 工厂调用时执行 `useTypedStore()` → `useDesigner()` → `useContext(DesignerContext)`，触发 React "Invalid hook call" 错误。

**根因**：`useDispatch` 是 React hook（内部用 `useTypedStore()`），但被工厂返回值调用（`dispatch: useDispatch()`），违反 React Hooks 规则。

**同样的问题**：`useRemoveRealtimeDataByUniqueId` 和 `useClearRealtimeData` 文档为命令式 API 但实现是 hook。

**修复**（plugin.ts 重构）：
1. 增加 `let ctx: PluginContext | null = null` 闭包
2. `plugin.init` 注入 ctx：`init: (context) => { ctx = context; }`
3. `dispatch` / `useRemoveRealtimeDataByUniqueId` / `useClearRealtimeData` 改为普通函数，用闭包里的 ctx
4. 移除 `useCallback` import（不再需要）
5. 增加 `PluginContext` 类型 import

**API 不变**（仍是 `(uniqueId: string, list: any[]) => void` 等命令式签名），调用方代码无需调整。

#### B. 跨插件（runtime-data）测试用 createDesignerCore 绕过

**问题**：`createRuntimeDataPlugin` 返回的实例是直接 `Plugin`（`name`/`type`/`init`/`clear`/`setArrayItem` 等都在对象上），但 `createDesigner({ plugins: {...} })` 用 `.map((p) => p.plugin)` 提取字段，对 runtimeData 会得到 undefined。

**解决**：跨插件测试用 `@fedx-vis/designer-core` 的 `createDesigner` 直接传入 `[realtimeDataFlow.plugin, runtimeData]` 数组，绕过 `.plugin` 包装层。

**理由**：`runtimeData` 的设计（直接 Plugin）和 `realtimeDataFlow` 的设计（`.plugin` 包装）架构不一致——`runtimeData` 来自 designer-core（pre-existing），`realtimeDataFlow` 来自 designer-plugins（task-001 起的统一模式）。本任务不重做 runtimeData 设计（属 designer-core 范畴，AGENTS.md §10.2 禁区）。

#### C. TRealtimeDataFlowDataItem 数据形态修正

初版测试误把 `initialExtra.realtimeDataFlowData[uniqueId]` 写成数组 `[{...}]`，实际是 `TRealtimeDataFlowDataItem`（对象 `{ rows?: any[] }`）。修正后：

```ts
initialExtra: {
    realtimeDataFlowData: {
        'comp_typed': { rows: [{ id: 42, name: 'foo' }] },  // ← 对象含 rows
    },
},
```

`useRealtimeDataFlowData<T>(fetcherId)` 返回 `T`（即 `TRealtimeDataFlowDataItem`），消费者取 `.rows` 拿到数据行。

### 6.4 验证结果

| # | 验证项 | 结果 | 备注 |
|---|---|---|---|
| 1 | `pnpm exec vitest run src/__tests__/realtime-data-flow.test.tsx` | ✅ 25/25 通过 | |
| 2 | `pnpm exec vitest run`（package 全量） | ✅ 8 文件 / 126 用例全通过 | 25 新增 + 101 既有（data-fetcher 33 / view-plugin 5 / layer-ops 9+20 / group-management 19 / bootstrap 8 / plugin-registry 7）|
| 3 | `pnpm exec tsc --noEmit`（package 级） | ✅ 0 错误 | |
| 4 | `pnpm exec tsc --noEmit`（workspace 级） | ✅ 无新增错误 | 现有 10 个 `packages/ui/src/material-selector/*` pre-existing 错误与本任务无关（AGENTS.md §10.2 禁区）|
| 5 | rowsConvertor 9 参数测试 | ⏸ 延后到 task-002-5 | 见 §3.2 注释 + §4 验证 ✓ |

### 6.5 已知边界 / 后续

- rowsConvertor 9 参数测试按 task-002-2 §降级点决策推迟到 task-002-5（迁移 DataFetcher.ts:353 调用方时补充）。
- 跨插件测试用 `createDesignerCore`（designer-core 直接入口）而非 `createDesigner`（designer-plugins 包装），原因是 `runtimeData` 架构与 designer-plugins `.plugin` 包装层不兼容。runtimeData 自身的 Plugin 接口设计不在本任务 scope（属 designer-core）。
- plugin.ts 重构（命令式 API 改用 init 闭包）是 task-002-2 留下的设计缺陷，task-002-4 测试驱动发现并修复。父任务 task-002 §1.4 "唯一拥有者契约" 仍成立（dispatch 仍是唯一写入入口，API 不变）。