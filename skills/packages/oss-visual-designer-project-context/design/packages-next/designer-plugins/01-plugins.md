# designer-plugins 插件契约（01-plugins）

> 状态：`已完成实现的事实回填（代码为准）`
> 创建日期：2026-09-16
> 事实基准：`packages-next/designer-plugins/src/<plugin>/plugin.ts`

所有插件共用模式（详见 [02-principles.md](skills/oss-visual-designer-project-context/design/packages-next/designer-plugins/02-principles.md)）：
- `useTypedStore()`：`useDesigner().store` 的类型层 cast（`Record<string, unknown>` → `DesignerExtra`），运行时 createDesigner 已绑定正确类型
- store 注入方案 B：hooks 内部通过 `useDesigner()` Context 获取 store，插件实例可在多次 createDesigner 中复用
- 命令式 hooks 用 `usePersistFn` 包裹（引用稳定）
- Plugin 对象多为「空壳」（name + type，无 init 副作用）——状态走 extra，由 createDesigner 预设初始化

---

## 1. view 插件

源码：[view/plugin.ts](packages-next/designer-plugins/src/view/plugin.ts)

**定位**：viewCanvas（高频：拖拽/缩放/对齐线/标尺/画布尺寸）+ viewUI（低频：tab/面板折叠/模态框/参考线/选中）状态管理。

**字段分桶**：

| 桶 | 字段 |
| --- | --- |
| viewCanvas | scale / lines / startX / startY / rulerWidth / rulerHeight / width / height |
| viewUI | tabsKey / layerCollapsed / layersTreeCollapsed / materialsListCollapsed / settingCollapsed / canvasToolbarCollapsed / visible / isShowReferLine / selected |

**hooks（17 读 + 2 写）**：
- 读：`useViewScale` … `useViewIsShowReferLine`（useExtra 细粒度订阅，内建 shallowEqual）+ `useSelected`（viewUI.selected，string | null）
- 写：`useSetView(patch)`：跨 viewCanvas + viewUI 批量更新，按冻结的 `VIEW_CANVAS_KEYS` / `VIEW_UI_KEYS` 分桶，未知字段静默丢弃
- 写：`useSetSelected(id | null)`：内部走 useSetView

**关键约束（setView 写路径）**：
- setPartialState 是顶层浅合并，setView 必须发送**完整 extra**，未改动的其他插件字段（globalResponse / dataSetList / realtimeDataFlowData / realtimeDataFlow / customFieldsListMapping / interactions）保留原引用——否则会清空其他插件状态（task-001 done §8.2.5 教训）
- **新增 extra 字段时必须同步补 setView 的引用保留列表**（当前手动维护，是已知维护点）

## 2. layer-management 插件

源码：[layer-management/plugin.ts](packages-next/designer-plugins/src/layer-management/plugin.ts)

**定位**：10 个互不依赖的图层操作命令。

| 类别 | 操作 | 写路径 |
| --- | --- | --- |
| 字段级 | useLock / useUnlock / useShow / useHide | `updateNode(id, { config: { isLock/isHidden } })`（deepMergeKeys 保证 config 二次浅合并） |
| 结构性 | useMoveToTop / useMoveToBottom / useMoveUp / useMoveDown | getNodeOrderBy + filter/spread 或 orderBy + `setChildren` + `setTree` |
| 结构性 | useCopy | generatorNode（generateId 注入，默认 Date.now+random base36）+ setTree，返回新 fieldId |
| 结构性 | useDeleteNode | deleteNodeById（含选中补偿 fieldId）+ clearEmptyCollection（清理空 group）+ setTree |

不变量：
- 边界 no-op：parentId 不存在 / 已在目标位置 / 找不到节点
- copy 默认**不**重置子树 uniqueId（`resetChildrenUniqueId = false`；与 src/ 行为不同，src/ 传 true；如需扩展走 options）
- siblings 取法：`parentId === ROOT_ID ? state.components : getNodeById(state.components, parentId)?.children ?? []`
- delete 时 `newChildren === siblings`（deleteNodeById 找不到 id）→ 直接 no-op 省 setTree

## 3. group-management 插件

源码：[group-management/plugin.ts](packages-next/designer-plugins/src/group-management/plugin.ts)

**定位**：useGroup（成组）+ useSplitGroup（拆组），全部走 designer-core 纯函数 `generatorGroup` / `splitGroup` + setTree。

- generatorGroup 内部已含 getGroupSizePosition（按子节点边界框算 group 尺寸）+ resetChildrenPosition（子节点坐标归一化为组内相对坐标）
- splitGroup 内部加回 groupLeft/groupTop 偏移还原绝对坐标

**范围决策**：本期不集成 createRecalcGroupBounds 派生插件——「组内子组件拖拽后自动重算尺寸」需要外部 getSelectedIds 回调接入点，留待后续。generateId 注入与 layer-management 同模式。

## 4. data-fetcher 插件

源码：[data-fetcher/plugin.ts](packages-next/designer-plugins/src/data-fetcher/plugin.ts)

**定位**：数据请求 + 全局数据集，迁移 src/plugins/data-fetcher 的 3 个子能力。

**hooks（6 个）**：
- `useFetchData(uniqueId, …)`：组件级请求，订阅 `byId[id].data.config.dataConfig` → `options.fetcherFactory[dataType](…)` → `{ data, loading, error, status, extraResponse }`
- `useGlobalFetcher()`：根组件调用，订阅 `extra.dataSetList.global` → 逐 item 调 `options.fetchGlobalItemFn` → 写 extra.globalResponse + 按 `options.getPollingInterval` 轮询 + 卸载清理
- `useGlobalFetcherResponse(fetcherId)` / `useCurrentDataSource(sourceId)` / `useDataSetList()`：useExtra 读
- `useUpdateDataSetList()`：dispatch（loading → dataSetApi.getDataSetList → success/error/empty）

**Options（依赖注入，全部可选有默认值）**：fetcherFactory / fetchGlobalItemFn / getPollingInterval / formatDataSetItem / dataSetApi。

**默认值约定**：
- dataSetList 初始 status 为 `'empty'` 而非 `'loading'`（避免 initial state 闪烁）
- globalResponse / 轮询策略与 src/plugins/data-fetcher/GlobalDataFetcher.ts 对齐

## 5. realtime-data-flow 插件

源码：[realtime-data-flow/plugin.ts](packages-next/designer-plugins/src/realtime-data-flow/plugin.ts)

**定位**：组件间实时数据流转（uniqueId → 数据内容）。

**API（2 命令式 + 3 hook）**：
- `dispatch(uniqueId, list)`：写 extra.realtimeDataFlowData
- `useRemoveRealtimeDataByUniqueId(uniqueId)` / `useClearRealtimeData()`：清理（组件卸载 / 切 scope / reset）
- `useRealtimeDataFlowData(fetcherId)`：读
- `useRealtimeDataFlowDataSource(ownerProps, opts, listener)`：DataFetcher helper

**唯一拥有者契约**：dispatch / remove / clear 是 `extra.realtimeDataFlowData` 的全部写入入口；其他插件（如 interaction）必须经 dispatch 转发，禁止直接 `setPartialState({ extra: { realtimeDataFlowData } })`。

实现要点：
- 写路径整体浅展开（不可变）
- 等值守卫：JSON.stringify 深等比较（不引 lodash）；循环引用抛错回退强制更新
- Error 序列化为 SerializableError（与 task-2026-07-29-005 模式一致）

## 6. interaction 插件

源码：[interaction/plugin.ts](packages-next/designer-plugins/src/interaction/plugin.ts)

**定位**：组件间事件订阅 + 派发，迁移 src/plugins/interaction/component 的 hooks + reducer。

**API**：
- `dispatchAction(opts)`：命令式写 extra.interactions
- `useCreateInteractionApi(ownerProps, opts)` → `{ interactionApi }`：`dispatch`（内部调 dispatchAction）+ `dispatchRealtimeDataFlow(list)`（**必须经注入的 realtimeDataFlowPlugin.dispatch 转发**，未注入时降级 noop + warn）
- `useInteractionsPreprocessor(ownerProps)` → `{ watchedFields, requestParams, customDataSourceApiParams }`
- `useInteractionsGraph()` → `{ source, target, link }`
- `useCurrentFieldDrilldownData(opts)` / `useSubscribeObject(config, formatter)`
- `parseSubscribeParams(value)`：纯函数

reducer 算法保持 src/ 原样（DRILL_DOWN_FIELD_NAMES 跳过 / 跨 uniqueId 冲突 fieldName 清理 / 同 uniqueId 字段合并），实现上用注入的 deepClone + 数组方法替代 immer produce；按 uniqueId 隔离各组件事件。

**Options**：大量依赖注入点（deepClone / pickWithOr / pickWithCondition / parseSubscribeParams / flatTree / logWarn 等），默认实现零依赖；realtimeDataFlowPlugin 注入用于 B1 转发决策。
