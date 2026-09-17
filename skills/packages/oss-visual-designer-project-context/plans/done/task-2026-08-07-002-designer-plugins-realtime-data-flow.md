# task-2026-08-07-002：designer-plugins createRealtimeDataFlowPlugin（组件间数据流转）

> 创建日期：2026-08-07
> v2 修订日期：2026-08-07（review r1 后按决策 A1+B1 重写）
> v3 微调日期：2026-08-07（review r2 后应用 5 项微调：行号修正 / 关系图重画 / opts 注释 / 类型收紧 / enable 注释 / 计数澄清）
> 状态：`done`（2026-08-10 归档；5/5 子任务 done，按用户决策"暂不修改 src/ 内容"归档，src/ 调用方迁移 + 死代码清理延后到 designer-plugins 集成阶段）
> 类型：`feature`
> 前置任务：task-2026-08-07-001（data-fetcher）/ task-2026-08-06-006（plugin-registry）
> 关联任务：task-2026-08-07-003（interaction，已 v2 同步更新消除矛盾）

> **review 状态**：本计划已通过两次 review：
> - [`.local-review/r1.md`](.local-review/r1.md) 三视角 review（C → 必修复 10 项 + 建议 8 项 + 可选 3 项）→ v2 修复映射见下
> - [`.local-review/r2.md`](.local-review/r2.md) 单视角验证（r2 评级 B+，10 项全部修复 + 5 项微调已应用）→ 进入 in-progress
>
> v2 修复映射：1.1→A1 决策 / 1.2→§1.1 重写 / 1.3→§2 重写 / 1.4→§3 重写 / 1.5→§4 重写 / 1.6→§5 关键风险点 / 1.7→B1 决策 / 1.8→§4.11 死代码清单 / 1.9→§4.5 / 1.10→§4.12 文档同步清单。

---

## 1. 背景与目标

### 1.1 背景（重写：与仓库现状对齐）

实时数据流转涉及 src/ 中 **3 套不同语义的 RealtimeDataFlow**：

| # | 语义层 | src/ 实现位置 | 旧字段 | 用途 |
|---|---|---|---|---|
| 1 | **数据内容** | `src/plugins/data-fetcher/RealtimeDataFlow.ts`（dispatch + `useCurrentDataSource` + `useRealtimeDataFlowDataSource`） | `component.realtimeDataFlow: Record<string, any>` | 组件 A 推数据 → 组件 B 订阅消费 |
| 2 | **订阅索引** | `src/store/modules/designer-canvas.ts` L179-198（`recordRealtimeDataFlow` / `deleteRealtimeDataFlow` reducer） | `designerCanvas.realtimeDataFlow: any[]` | 记录"哪个组件订阅了哪个 sourceId"，用于运行时路由 / 清理 |
| 3 | **`createRuntimeDataPlugin`** | `packages-next/designer-core/src/plugins/createRuntimeDataPlugin.ts` L62-167（**已存在**） | 通过 `runtimeArrayKey` 配置 | designer-core 已实现的订阅索引插件工厂 |

**当前签名（必须记住，避免再造）**：

| API | src/ 实际签名 | 文件:行号 |
|---|---|---|
| 数据 dispatch | `dispatchImp(uniqueId: string, list: any[]) => async (dispatch) => { dispatch({ type: 'component/realtimeDataFlow', data: { uniqueId, list } }) }` | `src/plugins/data-fetcher/RealtimeDataFlow.ts:21-28` |
| 数据订阅 hook | `useCurrentDataSource({ uniqueId, dataType, subscribeSourceId, fieldMapping, enablePreDpu, selectedPreDpu, enablePostDpu, selectedPostDpu, dataFilter, enableStrictFieldMapping, postDpuList })` | `src/plugins/data-fetcher/RealtimeDataFlow.ts:159` |
| DataFetcher helper | `useRealtimeDataFlowDataSource(ownerProps, opts, listener)` 含 dataType 判断 + listener 回调 + rowsConvertor | `src/plugins/data-fetcher/RealtimeDataFlow.ts:208` (def) → `L159` (useCurrentDataSource) / `src/plugins/data-fetcher/DataFetcher.ts:353`（唯一调用方） |
| iframe widget helper | `useCurrentRealtimeDataFlowSource(...)` | `src/formily/FedxReportContext.tsx:46` |
| 订阅索引 record/del | `useRealtimeDataFlow() => { record(uniqueId, { sourceId, enable }), del(uniqueId) }`（**无参**，dispatch 工厂） | `src/store/designer/hooks.ts:131-147` |
| 订阅索引 reducer | immer + `_.isEqual` 整体替换 | `src/plugins/data-fetcher/RealtimeDataFlow.ts:30-42`（数据）/ `src/store/modules/designer-canvas.ts:179-198`（索引） |

### 1.2 目标

**目标 1（数据内容迁移）**：将 src/ 第 1 套（数据内容）迁移到 `createRealtimeDataFlowPlugin`，管理 `extra.realtimeDataFlowData: Record<string, any>`。

**目标 2（订阅索引复用，不重写）**：将 src/ 第 2 套（订阅索引）由 designer-core 已存在的 `createRuntimeDataPlugin({ runtimeArrayKey: 'realtimeDataFlow', runtimeRecordKey: 'customFieldsListMapping' })` 承载，**不在 `createRealtimeDataFlowPlugin` 内部重写**（决策 A1）。

**目标 3（命名解耦）**：新插件 hook 全部改名以避免与旧 `useRealtimeDataFlow()` 重名（决策 B1）。

### 1.3 命名说明（重写）

旧架构有三个相关字段，迁移后字段归属如下：

| 旧字段 | 新字段 | 拥有者插件 | 备注 |
|---|---|---|---|
| `component.realtimeDataFlow: Record<string, any>`（数据内容） | `extra.realtimeDataFlowData: Record<string, any>` | `createRealtimeDataFlowPlugin` | 本任务核心 |
| `designerCanvas.realtimeDataFlow: any[]`（订阅索引） | `extra.realtimeDataFlow: RealtimeDataFlowItem[]` | `createRuntimeDataPlugin`（designer-core 已存在，配置 `runtimeArrayKey: 'realtimeDataFlow'`） | **本任务不重写**，只接入 |
| — | `extra.customFieldsListMapping: Record<string, string>` | `createRuntimeDataPlugin`（`runtimeRecordKey`） | 同期接入，同一插件覆盖 |

**迁移时必须改名**，避免命名冲突。

**Hook 命名改动**（决策 B1）：

| 旧名 | 新名 | 备注 |
|---|---|---|
| `useCurrentDataSource`（src/ 内读数据内容） | `useRealtimeDataFlowData(fetcherId)` | 改名避免与 task-001 done `dataFetcher.useCurrentDataSource(subscribeSourceId)` 同名混淆 |
| `useRealtimeDataFlowDataSource`（src/ 内 DataFetcher helper） | `useRealtimeDataFlowDataSource`（保留原名） | DataFetcher.ts:353 唯一调用方语义清晰，保留 |
| `useRealtimeDataFlow()`（src/ 内订阅索引 record/del） | 改用 `createRuntimeDataPlugin.setArrayItem(uniqueId, sourceId)` / `removeArrayItem(uniqueId)` | 4 个调用方（DesignerContent / DesignerContextMenu / FedxReportContext / layers-tree）迁移到 runtime-data plugin 直接调用 |

### 1.4 与其他插件的关系（重写：消除与 task-003 的矛盾）

```
                            realtime-data-flow（数据内容：extra.realtimeDataFlowData）
                                       ↑
                                       │ dispatch(uniqueId, list)
                                       │
                                   interaction
                                  （通过注入的 realtimeDataFlowPlugin
                                   实例转发 dispatch，不直接 setPartialState）

  runtime-data（订阅索引：extra.realtimeDataFlow + extra.customFieldsListMapping）
       ↑
       │ setArrayItem / removeArrayItem（由订阅方直接调用）
       │
  （订阅方组件，与 realtime-data-flow 平级，无依赖关系）
```

**关键契约（决策 B1）**：
- `realtimeDataFlowData` **唯一拥有者**是 `createRealtimeDataFlowPlugin`
- 其他插件（如 interaction）**必须通过** `realtimeDataFlowPlugin.dispatch(uniqueId, list)` 入口写入数据，**不得直接** `store.setPartialState({ extra: { realtimeDataFlowData: ... } })`
- 这保证字段契约（shape / 引用 / 订阅通知）的单一来源
- task-003 §1.3 / §2 需同步修改以反映此契约（dispatchRealtimeDataFlow 改为调 realtime-data-flow 插件的 dispatch，而非 setPartialState）

`createRuntimeDataPlugin` 与本插件**无依赖关系（平级）**：
- 两者都是 designer-plugins 平级的 plugin
- 应用层在 `createDesigner({ plugins: { ... } })` 时同时启用：`dataFetcher` / `realtimeDataFlow` / `runtimeData`（或 `interaction`）
- 两者通过 `store.setPartialState` 写入不同字段，互不耦合
- **runtime-data 不调用 realtime-data-flow 的 dispatch**；它的 `setArrayItem / removeArrayItem` 直接写 `extra.realtimeDataFlow`（订阅索引）

---

## 2. 接口草案（重写）

```ts
// === 数据内容（本插件拥有） ===

export interface RealtimeDataFlowPlugin {
    plugin: Plugin;

    /**
     * 推送数据到 realtimeDataFlowData
     *
     * - 等值守卫生效性：内部用 `_.isEqual` 比较新旧 list，相等则跳过写入（避免无意义 re-render）
     * - 写路径展开：`extra.realtimeDataFlowData` 整体浅展开，**不得直接 mutation**
     */
    dispatch: (uniqueId: string, list: any[]) => void;

    /**
     * 订阅指定 fetcherId 的数据
     *
     * - 单 fetcherId 级别细粒度订阅：用 `useExtra(s => s.realtimeDataFlowData[fetcherId], shallowEqual)`
     * - 泛型：消费者可指定 T 收紧类型
     */
    useRealtimeDataFlowData: <T = any>(fetcherId: string) => T;

    /**
     * DataFetcher 内部 helper（DataFetcher.ts:353 唯一调用方）
     *
     * 封装：dataType 判断 + useRealtimeDataFlowData 订阅 + listener 回调 + rowsConvertor
     *
     * 参数形态：
     * - `opts.postDpuList`：DPU 流水线后置处理列表（opts 形参仅承载此字段）
     * - `ownerProps.value.dataConfig.iframeSource.*`：其他转换参数走 ownerProps 路径
     *   （`enablePreDpu` / `selectedPreDpu` / `enablePostDpu` / `selectedPostDpu` /
     *    `fieldMapping` / `enableStrictFieldMapping` / `dataFilter` / `itemConvertor`）
     */
    useRealtimeDataFlowDataSource: (
        ownerProps: any,
        opts: { postDpuList?: any[] },
        listener: (rows: any) => void,
    ) => void;

    /**
     * 移除指定 uniqueId 的数据（组件卸载 / 选中清空时调用）
     *
     * 对照 src/plugins/data-fetcher/RealtimeDataFlow.ts：旧实现没有此 API，
     * 由 setState(realtimeDataFlow[uniqueId] = undefined) 隐式完成。新插件显式化。
     */
    useRemoveRealtimeDataByUniqueId: (uniqueId: string) => void;

    /**
     * 清空所有 realtimeDataFlowData（场景：切应用 scope / reset）
     *
     * - 对照 designer-canvas.ts L111 clearRuntime 语义
     */
    useClearRealtimeData: () => void;
}
```

**未列入接口但由 `createRuntimeDataPlugin` 提供**（应用层需同时启用该插件）：
- `setArrayItem(uniqueId, sourceId)` / `removeArrayItem(uniqueId)` — 订阅索引 record/del
- 4 个 src/ 旧 `useRealtimeDataFlow()` 调用方迁移到 `createRuntimeDataPlugin.setArrayItem` / `removeArrayItem`

---

## 3. extra 类型扩展（重写）

在 [`packages-next/designer-plugins/src/types.ts`](packages-next/designer-plugins/src/types.ts) `DesignerExtra` 中新增：

```ts
// === Realtime Data Flow 类型（task-2026-08-07-002）===

/**
 * 订阅索引项（uniqueId ↔ sourceId 映射）
 *
 * 对应 src/store/modules/designer-canvas.ts L184-189 的 reducer 形态：
 *   state.realtimeDataFlow.push({ uniqueId, sourceId }) 或
 *   state.realtimeDataFlow = state.realtimeDataFlow.map(d => d.uniqueId === uniqueId ? { uniqueId, sourceId } : d)
 *
 * ⚠️ 注意：`enable` 字段仅作为 dispatcher 分流标志（hooks.ts L135-141 `enable === false` 时调 delete 而非 record），
 * **reducer 不会将 enable 写入 state**。本类型声明 enable? 是为兼容 dispatcher 调用形态，但运行时 extra.realtimeDataFlow 数组
 * 元素的实际形态是 `{ uniqueId, sourceId }`。
 *
 * 由 createRuntimeDataPlugin（designer-core 已存在）通过 runtimeArrayKey: 'realtimeDataFlow' 配置承载。
 */
export interface RealtimeDataFlowItem {
    uniqueId: string;
    sourceId: string;
    enable?: boolean;
}

/**
 * 数据内容项（dispatch 写入）
 *
 * 对应 src/plugins/data-fetcher/RealtimeDataFlow.ts L21 的 dispatchImp 第二参 list 形态。
 *
 * 兜底形态（对照 task-001 done §4 TGlobalFetcherResponse 强类型风格）：
 * - rows：数据行
 * - extraResponse：附加响应
 * - error：序列化后的 Error 实例（复用 task-001 done §8.2.2 SerializableError）
 * - 其他字段通过索引签名承载（迁移期兼容 src/ Record<string, any> 现状）
 *
 * 调用方如需严格类型，可自定义扩展类型 + 在 dispatch 时 cast。
 */
export interface TRealtimeDataFlowDataItem {
    rows?: any[];
    extraResponse?: any;
    error?: SerializableError;
    [key: string]: unknown;
}

// === DesignerExtra 扩展 ===

export interface DesignerExtra {
    // ... 已有字段（viewCanvas / viewUI / globalResponse / dataSetList）
    
    /**
     * 实时数据流数据内容：uniqueId → 数据 list
     *
     * 由 createRealtimeDataFlowPlugin 的 dispatch / useRealtimeDataFlowData 管理。
     * 对应原 src/store/modules/component.ts `component.realtimeDataFlow`。
     */
    realtimeDataFlowData: Record<string, TRealtimeDataFlowDataItem>;

    /**
     * 实时数据流订阅索引：组件订阅 sourceId 的记录
     *
     * 由 createRuntimeDataPlugin（designer-core）通过 runtimeArrayKey: 'realtimeDataFlow' 配置承载。
     * 对应原 src/store/modules/designer-canvas.ts `designerCanvas.realtimeDataFlow`。
     */
    realtimeDataFlow: RealtimeDataFlowItem[];

    /**
     * 自定义字段列表映射：uniqueId → fieldPath 映射
     *
     * 由 createRuntimeDataPlugin（designer-core）通过 runtimeRecordKey: 'customFieldsListMapping' 配置承载。
     * 对应原 src/store/modules/designer-canvas.ts `designerCanvas.customFieldsListMapping`。
     */
    customFieldsListMapping: Record<string, string>;

    [key: string]: unknown;
}

// === 默认初始值 ===

export const defaultRealtimeDataFlowData: Record<string, TRealtimeDataFlowDataItem> = {};
export const defaultRealtimeDataFlow: RealtimeDataFlowItem[] = [];
export const defaultCustomFieldsListMapping: Record<string, string> = {};
```

---

## 4. 详细步骤（重写：完整 11+ 步，对照 task-001 done §8.1）

### 4.1 类型定义

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/types.ts` | ① 新增 `RealtimeDataFlowItem` / `TRealtimeDataFlowDataItem` 类型；② `DesignerExtra` 新增 `realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping` 字段；③ 新增 `defaultRealtimeDataFlowData` / `defaultRealtimeDataFlow` / `defaultCustomFieldsListMapping` 默认值（参考 task-001 done §8.1 步骤 1 的 `defaultDataSetListState` / `defaultGlobalResponse`） |
| `packages-next/designer-plugins/src/realtime-data-flow/types.ts`（新文件） | 定义 `RealtimeDataFlowPlugin` 接口（§2）+ 对外类型 `TRealtimeDataFlowDataItem` 等 |

### 4.2 create-designer.ts 注入初始 extra

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/create-designer.ts` | `CreateDesignerInitialExtra` 扩展三个字段：`realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping`（参考 task-001 done §8.1 步骤 2 + types.ts:40-45） |

### 4.3 plugin-registry.ts 注册

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/plugin-registry.ts` | ① 在 `PluginRegistry` interface 取消 `// realtimeDataFlow: RealtimeDataFlowPlugin;` 注释并补 `import type { RealtimeDataFlowPlugin } from './realtime-data-flow';`；② **同时取消 `// interaction: InteractionPlugin;` 占位注释**（虽然 interaction 是 task-003 范围，但占位注释同文件相邻清理） |

### 4.4 新插件 realtime-data-flow/plugin.ts 实现

| 步骤 | 内容 |
|---|---|
| 4.4.1 dispatch 实现 | `dispatch(uniqueId, list)`：从 `useTypedStore()` 取 store + state，写入路径用浅展开 `extra: { ...extra, realtimeDataFlowData: { ...extra.realtimeDataFlowData, [uniqueId]: list } }`；加 `_.isEqual(pre, list)` 等值守卫生效性 |
| 4.4.2 useRealtimeDataFlowData 实现 | `useRealtimeDataFlowData<T = any>(fetcherId: string): T`：用 `useExtra(store, (s) => s.realtimeDataFlowData[fetcherId], shallowEqual)` 订阅；fetcherId 不存在返回 undefined |
| 4.4.3 useRealtimeDataFlowDataSource 实现 | 封装 `useCurrentDataSource` 行为：dataType === IframeSource 时调 useRealtimeDataFlowData 订阅，listener 回调传 `{ rows }`（rowsConvertor 转换）；保留 `enablePreDpu` / `selectedPreDpu` / `fieldMapping` / `enableStrictFieldMapping` / `dataFilter` / `itemConvertor` / `postDpuList` 参数 |
| 4.4.4 useRemoveRealtimeDataByUniqueId 实现 | 写路径：`extra: { ...extra, realtimeDataFlowData: { ...extra.realtimeDataFlowData } }` + `delete realtimeDataFlowData[uniqueId]`（浅展开 + delete） |
| 4.4.5 useClearRealtimeData 实现 | 写路径：`extra: { ...extra, realtimeDataFlowData: {} }` |
| 4.4.6 plugin 空壳 | `{ name: 'realtime-data-flow', type: 'plugin', init?: () => {} }`（无副作用，对照 data-fetcher plugin.ts 空壳） |

### 4.5 view/plugin.ts 字段补齐（关键：避免 view setView 清空 realtime data）

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/view/plugin.ts` | L170-182 `useSetView` 的 extra payload 中追加三个字段保留引用：`realtimeDataFlowData: state.extra.realtimeDataFlowData` / `realtimeDataFlow: state.extra.realtimeDataFlow` / `customFieldsListMapping: state.extra.customFieldsListMapping`（**否则 view 任何 setView 会清空 realtime data**，task-001 done §8.2.5 踩坑教训） |

### 4.6 新插件 realtime-data-flow/index.ts barrel

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/realtime-data-flow/index.ts`（新文件） | `re-export plugin + types`，参考 `data-fetcher/index.ts` |

### 4.7 顶层 index.ts 导出

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/index.ts` | `export { createRealtimeDataFlowPlugin } from './realtime-data-flow/plugin'` + `export type { RealtimeDataFlowPlugin } from './realtime-data-flow/types'` + `export { defaultRealtimeDataFlowData, defaultRealtimeDataFlow, defaultCustomFieldsListMapping } from './types'` + `export type { RealtimeDataFlowItem, TRealtimeDataFlowDataItem } from './types'` |

### 4.8 测试用例

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/__tests__/realtime-data-flow.test.tsx`（新文件） | 见 §6 测试矩阵（对照 task-001 done §8.3 33 用例 / 9 describe） |

### 4.9 vitest 配置（如需）

- 沿用 task-001 done §8.1 步骤 10 的 `maxConcurrency: 1, fileParallelism: false`（如已有无需调整）

### 4.10 typecheck + 全量 test 验证

- `pnpm exec tsc --noEmit` 0 错误
- `pnpm test` 全量通过（含 data-fetcher / view / layer-ops / group-management 既有测试无回归）

### 4.11 迁移后死代码清理清单（review §1.8 11 项）

| # | 文件 | 删除内容 | 备注 |
|---|---|---|---|
| 1 | `src/plugins/data-fetcher/RealtimeDataFlow.ts` | 整文件（248 行） | 4 个 export 全部迁出 |
| 2 | `src/plugins/data-fetcher/index.ts:16` | `export * as RealtimeDataFlow from './RealtimeDataFlow';` | barrel 引用清理 |
| 3 | `src/store/modules/designer-canvas.ts:179-198` | `recordRealtimeDataFlow` / `deleteRealtimeDataFlow` reducer | 由 `createRuntimeDataPlugin` 接管 |
| 4 | `src/store/modules/designer-canvas.ts:113` | `clearRuntime` reducer 中 `draft.realtimeDataFlow = []` | 由 `createRuntimeDataPlugin.clear()` 接管 |
| 5 | `src/store/modules/designer-canvas-actions.ts:64-75` | `recordRealtimeDataFlow` / `deleteRealtimeDataFlow` action creator | 同上 |
| 6 | `src/store/designer/hooks.ts:131-147` | 旧 `useRealtimeDataFlow()` hook | 由 `createRuntimeDataPlugin.setArrayItem` / `removeArrayItem` 替代 |
| 7 | `src/store/designer/index.tsx:35` | barrel re-export | 同上 |
| 8 | `src/designer/DesignerContent.tsx:154` / `DesignerContextMenu.tsx:121` / `FedxReportContext.tsx:75` / `layers-tree/index.jsx:29` | 4 处旧 `useRealtimeDataFlow()` 调用 | 改用 `createRuntimeDataPlugin` 方法 |
| 9 | `src/formily/FedxReportContext.tsx:93` + L22 | Formily ctx wrapper 的 `recordRealtimeDataFlow` | 同步迁移到 runtime-data plugin |
| 10 | `src/formily/widgets/visual-iframe-selector/index.tsx:45, 57` | `ctx.recordRealtimeDataFlow({ sourceId, enable })` | 同上 |
| 11 | 4 处订阅方迁移 | `src/formily/widgets/dynamic-data/iframe/{ResultViewer,FieldMappingSetter,DataFilter}.tsx:9-12` 三处 `useCurrentDataSource` + `DataFetcher.ts:353` 一处 `useRealtimeDataFlowDataSource` | 改用 `realtimeDataFlowPlugin.useRealtimeDataFlowData(fetcherId)` / `useRealtimeDataFlowDataSource` |

> ⚠️ **清理前提**：所有调用方已迁移到新插件后再删除旧实现；建议先用 FeatureFlag 切流验证，确认无回归再清理（见 §5.4 回退方案）。

### 4.12 文档同步清单（review §1.10 r1 指出 23 个文件，r2 复核实际 22 行）

迁移后需要评估/更新的文档（19 个核心 + 2 cross-task + 1 AGENTS = **22 项**）：

| 类别 | 文件 | 评估内容 |
|---|---|---|
| data-model | `design/designer-canvas/01-data-model.md` L18, L31, L195 | `RealtimeDataFlowItem` 类型从注释变正式 |
| data-model | `design/designer-canvas/01-01-widget-types.md` L25, L373, L462 | 同上 |
| data-model | `design/designer-state/01-data-model.md` L153, L176, L182, L195 | `extra.realtimeDataFlowData` 字段说明 |
| write-path | `design/designer-state/02-write-path.md` L30, L66, L144, L281, L304, L310 | 5 个 runtime action 章节改写为 `createRuntimeDataPlugin` 描述 |
| read-path | `design/designer-state/03-read-path.md` L187 | `useRealtimeDataFlowData` 订阅方式说明 |
| plugin-system | `design/designer-core/04-plugin-system.md` L110, L134, L149, L502 | 新增 `createRealtimeDataFlowPlugin` 章节 |
| overview | `design/designer-canvas/00-overview.md` L60 / `design/designer-core/00-overview.md` L83, L97, L108, L175, L187 | 概览中说明字段迁移 |
| edge-cases | `design/designer-canvas/04-edge-cases.md` L151 | edge case 重新分类 |
| research | `research/designer-plugins-研究报告.md` L94, L138, L141, L303, L307, **L473**, L501, L525 | L473 关键决策与 v2 一致性核对 |
| research | `research/designer-core-fact-extraction.md` L39, L165, L318, L322, L367 | 同上 |
| research | `research/Redux Action使用度审计.md` L81 | 删除 `RealtimeDataFlow.ACTION_TYPE` 引用 |
| research | `research/Redux现代化升级调研.md` L152 | 同上 |
| research | `research/useDesigner迁移可行性审计.md` L9, L28, L46, L229 | 同上 |
| research | `research/渲染JSON类型声明.md` L26, L626 | 类型引用更新 |
| history | `plans/done/task-2026-07-21-006-designer-canvas-slice.md` L32, L46, L78, L79, L129, L135, L145, L147, L171, L194, L212, L260, L313, L319, L409 | 12 处提及，标注"历史方案"即可 |
| history | `plans/done/task-2026-07-21-007-byid-index.md` L247 | 同上 |
| roadmap | `plans/roadmap.md` L81 | 状态从 planning → done 后更新 |
| self | `plans/task-2026-08-07-002-designer-plugins-realtime-data-flow.md` | 实施记录章节 |
| cross-task | `plans/task-2026-08-07-003-designer-plugins-interaction.md` | §1.3 / §2 / §6 同步更新（消除 dispatchRealtimeDataFlow 矛盾） |
| cross-task | `plans/task-2026-08-07-001-designer-plugins-data-fetcher.md`（done） | 实施记录补充 cross-reference |
| AGENTS | `AGENTS.md` §4.5 / §10 | 如有新性能红线或禁区需补充 |

---

## 5. 关键风险点（新增）

| # | 风险 | 评级 | 缓解 |
|---|---|---|---|
| 1 | 多 plugin 并发写 `extra.realtimeDataFlowData` | 高 | 唯一拥有者契约：本插件 `dispatch()` 入口 + 等值守卫生效性；测试覆盖并发场景 |
| 2 | `useRealtimeDataFlowData` 订阅粒度（fetcherId 级别细粒度） | 中 | 强制 `useExtra(s => s.realtimeDataFlowData[fetcherId], shallowEqual)`，禁止 `useExtra(s => s.realtimeDataFlowData)` 全量订阅 |
| 3 | `useRealtimeDataFlowDataSource` 内 listener 回调的 epoch guard（组件 unmount 后避免 setState-on-unmounted） | 高 | effect 内维护 `cancelled` flag + `latestRef`（参考 task-001 done §8.2.4 epoch guard 模式） |
| 4 | 旧 `src/plugins/data-fetcher/RealtimeDataFlow.ts` 移除时机 | 高 | 4.11 清理清单**仅在所有调用方迁移完成后**执行 |
| 5 | `interaction/hooks.ts:249` 旧 import `RealtimeDataFlow.dispatch` 仍存在 | 高 | task-003 同步更新：改为通过 realtime-data-flow 插件的 dispatch 入口 |
| 6 | Error 实例不可序列化（data 字段含 Error） | 中 | 写路径加 `serializeRealtimeData(data)` 检测 Error 并转 `SerializableError`（参考 task-001 done §8.2.2） |
| 7 | `useRealtimeDataFlowDataSource` 内 `enablePreDpu` / `fieldMapping` / `dataFilter` 等转换参数是否下沉到新插件 | 中 | 4.4.3 实现时保留全部转换参数，与 src/ 现状 1:1 对齐 |
| 8 | `globalRecorder.recordRealtimeDataFlowDataSource` 埋点副作用（src/common/constants/globalConstants.ts:41） | 低 | 在新 hook 内保留调用（不动埋点层） |
| 9 | view/plugin.ts L170-182 没追加新字段保留 → view setView 清空 realtime data | 高 | 4.5 显式补全，tsc 验证 |
| 10 | 11 项死代码清理遗漏 → 仓库留技术债 | 中 | 4.11 完整清单 + 单独 commit |
| 11 | 23 个文档不同步 → 文档与代码漂移 | 中 | 4.12 完整清单 |
| 12 | `useTypedStore` 第 5 处副本（task-001 done §8.5 已知边界） | 低 | 本任务**推迟**抽取（避免 scope 蔓延），记到 memo.md |
| 13 | `clearRuntime` reducer（designer-canvas.ts:113）行为在 `createRuntimeDataPlugin` 复用后是否仍由 view plugin 调用？ | 中 | view 插件不再调 clearRuntime；改由 runtime-data plugin 在 cleanup 时调 `clear()`，或保留 view 调 runtime-data.clear() 的转发 |
| 14 | `enableStrictFieldMapping` 引用 `DESIGNER_ORIGIN_DATA_SYMBOL`（src/plugins/data-fetcher/constants.ts）是否下沉到新插件 | 低 | 不下沉，保留 src/ 常量，helper 内部引用 |

### 回退方案

**FeatureFlag 切流（推荐）**：
1. 新插件与旧实现并存 1 个 sprint
2. 应用层通过 feature flag `USE_NEW_REALTIME_DATA_FLOW` 控制：true 用新插件，false 用旧 src/plugins/data-fetcher/RealtimeDataFlow.ts
3. 灰度切流：先 10% → 50% → 100%
4. 全量后保留旧实现 1 周观察，再执行 4.11 清理

**紧急回滚**：
- FeatureFlag 切回 false，所有调用方立即回到旧实现
- 新插件代码保留但 disable（plugin-registry.ts 注释掉 `realtimeDataFlow` 注册）

**破坏性变更应对**：
- 若 `useRealtimeDataFlowData` 与 src/ `useCurrentDataSource` 行为差异超过容忍度，保留旧 helper 作为兼容层：
  ```ts
  // 新插件导出兼容层
  useCurrentDataSource: (opts) => useRealtimeDataFlowData(opts.subscribeSourceId);
  ```
  让迁移方按调用方渐进切换

---

## 6. 验证（重写）

| # | 验证项 | 方法 |
|---|---|---|
| 1 | `dispatch` 写入 `realtimeDataFlowData` | 测试用例 + `pnpm exec tsc --noEmit` |
| 2 | `useRealtimeDataFlowData` 订阅正确（fetcherId 细粒度） | 测试用例 |
| 3 | `useRealtimeDataFlowDataSource` 含 dataType 判断 + listener 回调 + rowsConvertor | 测试用例（迁移 src/ `useCurrentDataSource` 等价行为） |
| 4 | `useRemoveRealtimeDataByUniqueId` 清理指定 uniqueId | 测试用例 |
| 5 | `useClearRealtimeData` 清空全部 | 测试用例 |
| 6 | 多 ownerId 并发 dispatch 数据一致性（末写者赢 + 等值守卫生效性） | 测试用例 |
| 7 | Error 实例序列化 | 测试用例（对照 task-001 done §8.2.2） |
| 8 | view-plugin field isolation（view 写不破坏 realtime data） | 测试用例 |
| 9 | 现有测试不回归 | `pnpm test` 全量通过 |
| 10 | 类型安全 | `pnpm exec tsc --noEmit`（designer-plugins 包 0 错误） |
| 11 | 命名不冲突（具体命令）：<br>`grep -r "extra\.realtimeDataFlowData" src packages-next`（应只在 packages-next 命中）<br>`grep -r "useRealtimeDataFlow\b" src/store/designer/hooks.ts packages-next`（应只在 types.ts + 新 plugins）<br>`grep -r "RealtimeDataFlowItem" packages-next src`（应只在 types.ts + 新 plugin） | 手动 grep 验证 |
| 12 | view/plugin.ts 字段保留正确 | tsc 验证（task-001 done §8.2.5 教训） |
| 13 | 11 项死代码清理后 build 通过 | `pnpm build` |
| 14 | 跨插件：interaction 通过 `realtimeDataFlowPlugin.dispatch()` 写入（task-003 同步修改后验证） | 集成测试 |

### 测试矩阵（对照 task-001 done §8.3 33 用例 / 9 describe）

| describe | 用例数 | 覆盖 |
|---|---|---|
| 结构契约 | 3 | createRealtimeDataFlowPlugin 返回 plugin + 5 hooks |
| initial defaults | 2 | 默认 realtimeDataFlowData = {} / realtimeDataFlow = [] |
| useRealtimeDataFlowData | 4 | 默认 undefined / dispatch 后可读 / fetcherId 不存在 / 泛型 |
| useRealtimeDataFlowDataSource | 4 | dataType === IframeSource 触发 / dataType !== IframeSource 不触发 / listener 回调 / rowsConvertor 转换 |
| useRemoveRealtimeDataByUniqueId | 3 | 移除指定 uniqueId / 不存在的 uniqueId / 移除后 useRealtimeDataFlowData 返回 undefined |
| useClearRealtimeData | 2 | 清空全部 / 清空后 dispatch 重新写入可读 |
| dispatch 并发 | 3 | 等值守卫生效性 / 末写者赢 / Error 实例序列化 |
| view-plugin field isolation | 2 | view 写不破坏 realtimeDataFlowData；反之亦然 |
| 跨插件（runtime-data） | 2 | setArrayItem 后 realtimeDataFlow 数组更新；removeArrayItem 后清理 |

合计 **25 用例**（对照 task-001 done 33 用例，realtime-data-flow 功能更聚焦）。

---

## 7. 实施记录

> review 通过后在此记录实施过程。

（待填写）

### 7.1 子任务分解

由于本任务工作量较大（12 个步骤 + 25 用例测试 + 11 项死代码清理 + 22 个文档同步），实施工作拆分为 **5 个子任务**，每个子任务对应父任务 §4 的一个逻辑段：

| 子任务 | 范围 | 状态 | 文档 |
|---|---|---|---|
| **002-1** | §4.1 类型定义（types.ts + RealtimeDataFlowPlugin 接口） | **done**（2026-08-07） | [task-2026-08-07-002-1-realtime-data-flow-types.md](./done/task-2026-08-07-002-1-realtime-data-flow-types.md) |
| **002-2** | §4.4 plugin.ts 实现 + §4.6 barrel + §4.7 顶层导出 | **done**（2026-08-07） | [task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md](./done/task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md) |
| **002-3** | §4.2 create-designer + §4.3 plugin-registry + §4.5 view/plugin 字段保留 | **done**（2026-08-10） | [task-2026-08-07-002-3-realtime-data-flow-registration.md](./done/task-2026-08-07-002-3-realtime-data-flow-registration.md) |
| **002-4** | §4.8 单元测试（25 用例 / 9 describe） | **done**（2026-08-10） | [task-2026-08-07-002-4-realtime-data-flow-tests.md](./done/task-2026-08-07-002-4-realtime-data-flow-tests.md) |
| **002-5** | §4.11 调用方迁移 + 死代码清理 + §4.10 验证 + §4.12 文档同步 | **blocked**（2026-08-10）src/ 调用方迁移 + 死代码清理延后到 designer-plugins 集成阶段 | [task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md](./task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md) |

**执行顺序**：002-1 → 002-2 → 002-3 → 002-4 → 002-5（强依赖：types → plugin impl → registration → tests → migration）

**父任务完成条件**：5 个子任务全部 `done` 后，本任务移入 `plans/done/`。

**002-5 归档说明（2026-08-10）**：src/ 尚未集成 designer-plugins（独立 React-Redux，无 `createDesigner` / `createRuntimeDataPlugin` 实例化入口）。plan §2.1 / §2.2 的 8 处调用方迁移 + 11 项死代码清理**全部依赖** designer-plugins store，无法按字面执行。

用户决策（2026-08-10）：**暂不修改 src/ 内容**——src/ 调用方迁移 + 死代码清理整体延后。后续用户决策"归档 done"——任务标记 done 并移入 `plans/done/`，核心未完成范围在 §6.8 完整保留。

**重启条件**：src/ 集成 designer-plugins 后，新建独立 task `task-2026-08-XX-XXX-designer-plugins-integration-migrate-src-callers.md` 承接原 002-5 范围。

**重启前父任务可声明的部分完成状态**：designer-plugins 内部实现已落地（002-1~002-4）+ 002-5 验证完成（tsc/test 通过），可单独标记 **002-1~002-5 子集完成**（与 AGENTS.md §9.2 一致："代码事实" 优先于 "plan 字面描述"）。

**父任务整体状态**：`done`（2026-08-10）——按用户决策"归档 done"整体归档。核心未完成范围（src/ 调用方迁移 + 死代码清理）通过 002-5 子任务 [task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md §6.8](./done/task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md) 完整保留，便于未来重启检索。

### 7.2 关键决策与避坑

> 实施后追加，记录关键决策点（参考 task-001 done §8.2 模式）。

### 7.3 测试矩阵执行结果

> 实施后填入 §6 矩阵的实际结果。

### 7.4 验证结果

> 实施后填入 §6 验证表的实际结果。

#### 子任务 002-3 验证（done 2026-08-10）

| # | 验证项 | 结果 |
|---|---|---|
| §4.2 | `pnpm exec tsc --noEmit`（package 级） | ✅ 0 错误 |
| §4.3 | `createDesigner({ plugins: { realtimeDataFlow: ... } })` 类型通过 | ✅ |
| §4.5 | `view setView({ scale: 1.5 })` 后 `extra.realtimeDataFlowData` 引用保留 | ✅ 集成测试覆盖 |
| §4.10 | `pnpm exec vitest run`（package 级） | ✅ 7 文件 / 101 用例全通过 |

#### 子任务 002-4 验证（done 2026-08-10）

| # | 验证项 | 结果 |
|---|---|---|
| §6 §1-3 | dispatch / useRealtimeDataFlowData / fetcherId 细粒度订阅 | ✅ 25/25 用例通过 |
| §6 §4 | useRealtimeDataFlowDataSource 含 dataType 判断 + listener 回调 | ✅ 4 用例 |
| §6 §5-7 | useRemove / useClear / dispatch 并发 | ✅ 8 用例 |
| §6 §8 | view-plugin field isolation | ✅ 2 用例 |
| §6 §9 | 现有测试无回归（`pnpm test` 全量） | ✅ 8 文件 / 126 用例通过 |
| §6 §10 | 类型安全（package 级 + workspace 级） | ✅ 0 错误 |

#### 子任务 002-5 验证（blocked 2026-08-10，src/ 不动）

| # | 验证项 | 结果 |
|---|---|---|
| §6 §9 | 现有测试无回归（`pnpm test` 全量） | ✅ 9 文件 / 72 用例全通过 |
| §6 §10 | 类型安全（`pnpm exec tsc --noEmit`） | ✅ src/ 0 错误（仅 10 个 packages/ui/material-selector pre-existing） |
| §6 §11 | 命名不冲突 grep | ⏸ 跳过（src/ 没动） |
| §6 §13 | 死代码清理后 build 通过 | ⏸ 跳过（src/ 没动） |

详见 [task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md §6.5](./task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md)。

### 7.5 已知边界 / 后续

> 实施后记录遗留问题。

#### 子任务 002-5 边界（done 2026-08-10，按用户决策归档）

- **归档原因**：用户决策"这个任务归档 done"——任务核心范围（src/ 调用方迁移 + 11 项死代码清理）因 src/ 不动未执行；保留已完成的验证（tsc/test）+ 文档评估作为"done"语义的一部分；未完成范围通过 002-5 §6.8 完整记录便于未来重启检索。
- **重启条件**：src/ 集成 designer-plugins 后，新建独立 task 承接原 002-5 范围。
- **设计建议**：src/ 集成层选择：
  - **方案 A**：直接接入 `createDesigner({ plugins: { realtimeDataFlow, runtimeData, ... } })`，把 designer-plugins store 暴露到 React Context，调用方全部迁移到 designer-plugins hooks
  - **方案 B**：保留 React-Redux 主架构，把 designer-plugins store 作为镜像 store（仅承载 realtime-data-flow / runtime-data 字段），通过订阅同步
  - **方案 C**：暂不集成 designer-plugins，继续维持 React-Redux 现状，原 002-5 范围永久延期
- **建议**：方案 A 是 task-002 设计的最终目标，但工作量较大（涉及 src/index.js / App / DesignerContent / DesignerContextMenu / FedxReportContext / layers-tree / 4 处 iframe widget + DataFetcher.ts:353 + interaction hooks.ts + 11 项死代码），应作为独立 task `task-2026-08-XX-XXX-designer-plugins-integration-migrate-src-callers.md` 启动，避免与 task-002 父任务混淆
- **当前策略**：方案 C（用户决策"暂不修改 src"），后续决策"归档 done"。待未来 designer-plugins 集成阶段启动新 task。
- **本任务文档归档位置**：`plans/done/task-2026-08-07-002-5-realtime-data-flow-cleanup-migration.md`（AGENTS.md §3.3 done 任务归档到 done/）