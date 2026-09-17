# task-2026-08-07-001：designer-plugins createDataFetcherPlugin（数据请求 + 全局数据集）

> 创建日期：2026-08-07
> 完成日期：2026-08-07
> 状态：`done`
> 类型：`feature`
> 前置任务：task-2026-08-06-006（插件组装方式重构）

---

## 1. 背景与目标

### 1.1 背景

src/ 的 data-fetcher 包含 3 个子能力：

| 子能力 | src/ 位置 | 做什么 | 数据存在哪（旧） | 数据存在哪（新） |
|---|---|---|---|---|
| **useFetchData** | `DataFetcher.ts` | 组件级数据请求：按组件 config 的 dataConfig 发 HTTP 请求，返回 `{ data, loading, error }` | 组件内部 state | 组件内部 state（不进 store） |
| **GlobalDataFetcher** | `GlobalDataFetcher.ts` | 全局数据请求：管理共享数据集的轮询 + 响应分发 | `component.globalResponse` | `extra.globalResponse` |
| **GlobalDataSet** | `GlobalDataSet.ts` | 共享数据集管理：从后端拉数据集列表 + 格式化 | `component.dataSetList` | `extra.dataSetList` |

### 1.2 目标

将 3 个子能力迁移到 designer-plugins 的 `createDataFetcherPlugin`，统一管理 `extra.globalResponse` + `extra.dataSetList`。

### 1.3 不做什么

- ❌ 不迁移 `RealtimeDataFlow`（单独 task-008）
- ❌ 不迁移 `interaction`（单独 task-009）
- ❌ 不改 HTTP 请求实现（保持原有 fetch / axios 逻辑）

### 1.4 与其他插件的关系

```
data-fetcher（extra.globalResponse + extra.dataSetList）
    ↓ 提供全局数据响应
realtime-data-flow（extra.realtimeDataFlowData）  ← 独立，不依赖 data-fetcher
interaction（extra.interactions）                  ← 独立，不依赖 data-fetcher
```

三个插件各自管 `extra` 中不同的字段，互相独立。

---

## 2. 子能力详细分析

### 2.1 useFetchData（组件级请求）

**src/ 现状**（`DataFetcher.ts`）：
- 入参：组件 `dataConfig`（包含 url / method / params / polling 等）
- 行为：发 HTTP 请求 → 返回 `{ data, loading, error }`
- 状态：存在组件内部 React state，**不进 store**
- 特殊：支持轮询（polling）、请求去重（fetchStorage）

**新架构**：
- `useFetchData(uniqueId, options)` 仍然是 React hook
- 内部用 `store.useNode(uniqueId)` 读 `dataConfig`
- HTTP 请求逻辑保持不变
- 返回值不变：`{ data, loading, error }`

### 2.2 GlobalDataFetcher（全局请求 + 轮询）

**src/ 现状**（`GlobalDataFetcher.ts`）：
- 管理 `globalFetcherMap`：多个共享数据集的请求配置
- 轮询机制：按配置间隔自动重新请求
- 响应分发：请求结果存到 `component.globalResponse`，组件通过 `useGlobalFetcherResponse(fetcherId)` 订阅
- 生命周期：组件 mount 时启动轮询，unmount 时停止

**新架构**：
- `extra.globalResponse: Record<string, any>` — 存储全局响应
- `useGlobalFetcher()` — 启动全局请求（在 App 根组件调用）
- `useGlobalFetcherResponse(fetcherId)` — 订阅指定 fetcher 的响应
- 写路径：`store.setPartialState({ extra: { globalResponse: { ...old, [fetcherId]: response } } })`

### 2.3 GlobalDataSet（数据集管理）

**src/ 现状**（`GlobalDataSet.ts`）：
- 从后端拉取数据集列表
- 格式化数据集（补 `label` / `value` 字段）
- 存到 `component.dataSetList`
- 组件通过 `useDataSetList()` 订阅

**新架构**：
- `extra.dataSetList: DataSetItem[]` — 存储数据集列表
- `useDataSetList()` — 订阅数据集列表
- 写路径：`store.setPartialState({ extra: { dataSetList: newList } })`

---

## 3. 接口草案

```ts
export interface DataFetcherPlugin {
    plugin: Plugin;
    /** 组件级数据请求 */
    useFetchData: (uniqueId: string, options?: FetchOptions) => {
        data: any;
        loading: boolean;
        error: Error | null;
    };
    /** 启动全局请求（App 根组件调用） */
    useGlobalFetcher: () => void;
    /** 订阅全局 fetcher 响应 */
    useGlobalFetcherResponse: (fetcherId: string) => any;
    /** 订阅数据集列表 */
    useDataSetList: () => DataSetItem[];
    /** 订阅当前数据源 */
    useCurrentDataSource: (subscribeSourceId: string) => any;
}
```

---

## 4. extra 类型扩展

在 `shared/types.ts` 的 `DesignerExtra` 中新增：

```ts
export interface DesignerExtra {
    // ... 已有字段
    globalResponse: Record<string, any>;      // ← 新增
    dataSetList: DataSetItem[];                // ← 新增
}
```

---

## 5. 关键风险点

| 风险 | 影响 | 缓解 |
|---|---|---|
| 轮询生命周期管理 | 请求泄漏 | 在插件 `init` 中启动，`cleanup` 中清理 |
| 请求去重（fetchStorage） | 重复请求 | 保持原有 fetchStorage 机制 |
| globalResponse 存 Error 实例 | 序列化问题 | task-2026-07-29-005 已修复，保持修复 |
| customFieldsListMapping stringify | 数据格式不一致 | 在插件层加 stringify |

---

## 6. 详细步骤

> 待 review 通过后细化。

### 6.1 类型定义
### 6.2 useFetchData 实现
### 6.3 GlobalDataFetcher 实现
### 6.4 GlobalDataSet 实现
### 6.5 测试

---

## 7. 验证

| 验证项 | 方法 |
|---|---|
| useFetchData 基本可用 | 测试用例 |
| globalResponse 更新 | 测试用例 |
| dataSetList 更新 | 测试用例 |
| 轮询清理 | 测试用例 |
| 现有测试不回归 | `pnpm test` 全量通过 |
| 类型安全 | `pnpm exec tsc --noEmit` |

---

## 8. 实施记录

### 8.1 步骤概览

| 步骤 | 状态 | 产物 |
|---|---|---|
| 1. types.ts 扩展 `DesignerExtra` 增加 `globalResponse` / `dataSetList` | ✅ | `packages-next/designer-plugins/src/types.ts` 新增 5 个类型 + 2 个默认值 |
| 2. create-designer.ts 注入 `CreateDesignerInitialExtra` | ✅ | `packages-next/designer-plugins/src/create-designer.ts` |
| 3. plugin-registry.ts 注册 `dataFetcher: DataFetcherPlugin` | ✅ | 替换原 comment placeholder |
| 4. view/plugin.ts `useSetView` 保留 extra 中的 globalResponse / dataSetList 引用 | ✅ | 修复 TS2739（type 缺失字段） |
| 5. `data-fetcher/types.ts` | ✅ | 11 个对外契约类型 + DataFetcherPluginOptions |
| 6. `data-fetcher/plugin.ts`（6 hooks + plugin 空壳 + serializeGlobalResponse + 默认 fetcherFactory / polling / formatDataSetItem） | ✅ | useFetchData / useGlobalFetcher / useGlobalFetcherResponse / useDataSetList / useCurrentDataSource / useUpdateDataSetList |
| 7. `data-fetcher/index.ts` barrel 导出 | ✅ | re-export plugin + types |
| 8. 顶层 `index.ts` 导出 createDataFetcherPlugin + 11 类型 + 2 默认值 + CreateDesignerInitialExtra | ✅ | |
| 9. 测试 `__tests__/data-fetcher.test.tsx`（33 个用例 / 9 个 describe） | ✅ | 全部通过 |
| 10. vitest 配置调优（maxConcurrency: 1, fileParallelism: false） | ✅ | 缓解 Windows jsdom OOM |
| 11. typecheck + 全量 test 验证 | ✅ | tsc 0 错误；7 个测试文件 / 101 用例全通过 |

### 8.2 关键决策与避坑

#### 8.2.1 依赖注入（plugin 包保持纯净）

designer-plugins 只依赖 `@fedx-vis/designer-core`（不能引入 axios / oss-web-toolkits / hox 等应用层依赖）。HTTP / middleware / DPU / dataSetApi 等项目特定行为通过 `DataFetcherPluginOptions` 注入：

- `fetcherFactory`（dataType → fetcher 映射）
- `getRequestConfig` / `getFinallyRequestConfig` / `runDpuList`（组件级 useFetchData 的 DPU 流水线）
- `fetchGlobalItemFn`（全局轮询的实际 HTTP 调用）
- `getPollingInterval`（默认 `item.isRefresh ? item.refreshTime : false`）
- `isDevelopmentFn`（默认 dev 不轮询，与 src/ 行为对齐）
- `dataSetApi.getDataSetList`（数据集列表拉取）
- `formatDataSetItem`（默认 identity 透传）

未注入时降级为「无 HTTP 纯状态管理」：useDataSetList / useGlobalFetcherResponse 仍可读默认空 state，useFetchData / useGlobalFetcher / useUpdateDataSetList 返回 no-op。

#### 8.2.2 Error 实例序列化（沿用 task-2026-07-29-005 修复）

`serializeGlobalResponse(response)`：检测 response.error 是否为 Error 实例，若是则转为 `{ message, stack, ...customProps }` 的 SerializableError 后再写入 `extra.globalResponse`。即使当前是 Zustand（非 Redux），也保持与 src/ 行为一致，避免后续迁移时的二次返工。

#### 8.2.3 `useFetchData` 无限重渲染修复（关键）

第一次实现踩坑：effect 依赖里包含 `fetchOptions?.dpuList` 等数组字段 → 每次 render `fetchOptions` 是新对象引用 → 触发 effect 重跑 → 触发 setState → 再次 render → 死循环 → vitest worker OOM。

**修复**：用 ref 把 fetchOptions 缓存，effect 依赖改为最小化的 `[dataConfig?.dataType]`：

```ts
const fetchOptionsRef = useRef(fetchOptions);
fetchOptionsRef.current = fetchOptions;
useEffect(() => { ... }, [dataConfig?.dataType]);  // 不是 fetchOptions
```

完整 effect 逻辑在 `useFetchData` 内部用 `fetchOptionsRef.current` 读取最新 options，避免依赖数组膨胀。

#### 8.2.4 `useGlobalFetcher` 生命周期与 epoch guard

- 每个全局数据集 item 维护 `timerRef` 用于清理 setTimeout 链；
- 在 useEffect 顶部维护 `cancelled` flag + epoch 计数 `runIdRef.current++`，组件 unmount / 重跑时丢弃过期请求的写入，防止 setState-on-unmounted 警告与 stale 数据覆盖；
- 轮询链：`fetch → 写 extra → setTimeout(getPollingInterval) → fetch`，直到返回 false 或组件卸载。

#### 8.2.5 view/plugin.ts 字段补齐

加完 `globalResponse` / `dataSetList` 后，`useSetView` 的 extra payload 缺失这两个字段，tsc 报 TS2739。在 view/plugin.ts 的 extra 对象内补上：

```ts
globalResponse: state.extra.globalResponse,
dataSetList: state.extra.dataSetList,
```

并修正外层类型让 `useSetView` 的入参类型完整。

### 8.3 测试矩阵

| describe | 用例数 | 覆盖 |
|---|---|---|
| 结构契约 | 4 | createDataFetcherPlugin 返回值结构 / DataFetcherPluginOptions 全可选 |
| initial defaults | 2 | 默认 globalResponse / dataSetList 形状 |
| useDataSetList | 3 | 默认空 / initialExtra 注入 / 多个组件独立订阅 |
| useGlobalFetcherResponse | 5 | 未注册 fetcherId 返回 undefined / 初始注入可读 / 写入后订阅 / 泛型 / 不存在的 key |
| useUpdateDataSetList | 5 | 未注入 dataSetApi → noop / 注入后 loading→success / empty→success / 注入 isQuiet |
| useGlobalFetcher | 4 | 未注入 fetchGlobalItemFn → noop / 注入后 effect 触发 / polling 设置 / Error 序列化 |
| useCurrentDataSource | 3 | status / rows / extraResponse 三字段提取 |
| useFetchData | 5 | 默认 noop / 订阅 dataConfig / 状态流转（loading→success） / error 序列化 / 轮询清理 |
| view-plugin field isolation | 2 | view 插件不会被 data-fetcher 误改 / 反之亦然 |

合计 **33 用例，全部通过**（单文件 4.21s；全量 7 文件 101 用例 22.7s）。

### 8.4 验证

| 项 | 结果 |
|---|---|
| `pnpm exec tsc --noEmit`（designer-plugins 包） | 0 errors |
| `pnpm test`（全量） | 101 / 101 passed |
| 新增代码无 eslint 警告 | ✅ |
| view / layer-ops / group-management / bootstrap / plugin-registry 现有测试无回归 | ✅ |

### 8.5 已知边界 / 后续

- `useTypedStore()` 私有 helper 在 view / layer-ops / group-management / data-fetcher 共 4 处副本，后续 task 抽到 `hooks/useTypedStore.ts`（plan §6.2 标注但未在本任务执行）。
- HTTP 行为依赖应用层注入；本任务只迁移状态契约，不替代 src/plugins/data-fetcher 的具体实现。
- `customFieldsListMapping.stringify` 与 `fetchStorage` 去重机制：plan §5 标注的「在插件层加 stringify / 保持 fetchStorage」目前 useFetchData 已透传 receivedPropsParams / appScopeId 给应用层 fetcherFactory，由应用层决定是否 stringify / 去重（保持与 src/ 一致）。
- realtime-data-flow（plan §1.3 不做）：由独立 task-2026-08-07-002 处理。
- interaction（plan §1.3 不做）：由独立 task-2026-08-07-003 处理。
