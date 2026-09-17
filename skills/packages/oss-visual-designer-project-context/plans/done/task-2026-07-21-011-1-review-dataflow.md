# Review task-011-1：数据流正确性（reducer / action / hooks）

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-011-1-review`
> 上游任务：[task-2026-07-21-011](./done/task-2026-07-21-011-drop-usedesigner-compat.md)
> 状态：`planning`
> 类型：`review`
>
> **目标**：审查 task-011 新增的 reducer / action creator / hooks 实现是否纯净、不可变、边界条件完备、API 形态与原 `DataProvider` 闭包一致。

---

## 1. 背景

task-011 把 `realtimeDataFlow` / `customFieldsList` 的写入路径从 `DataProvider` 闭包迁到 Redux：

- 4 个新 reducer case：`recordRealtimeDataFlow` / `deleteRealtimeDataFlow` / `recordCustomFieldsList` / `deleteCustomFieldsList`
- 4 个 action creator
- 3 个新 hook：`useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents`

这一层是整个改造的"地基"，任何 bug 都会被 16 个调用方放大。**重点核查**：

1. reducer 是否真的不可变（Immer produce 用对没）
2. 边界条件（空数组、不存在的 uniqueId、重复 record）是否覆盖
3. hook 的 `record` / `del` / `get` API 形态是否与原闭包**零行为差异**
4. 业务条件（`sourceId` 为空、`enable === false`）是否在 hook 层正确分流
5. `useFlatComponents` 去 `useLazyUpdate` 后是否在所有场景都能同步响应

---

## 2. 审查清单

### 2.1 reducer 层（`src/store/modules/designer-canvas.ts`）

- [ ] **2.1.1** `recordRealtimeDataFlow` case：
    - 是否用 `produce(state, draft => ...)` 不可变更新？
    - `preIndex === -1` 时 push `{ uniqueId, sourceId }`，否则整体替换 `draft.realtimeDataFlow[preIndex] = { uniqueId, sourceId }`（不是 `Object.assign`，避免半更新）？
    - **幻觉排查**：是否有"新增" / "更新"分支写反？是否有漏写 `return produce(...)` 直接 `return state` 的退化分支？
- [ ] **2.1.2** `deleteRealtimeDataFlow` case：
    - 用 `.filter` 还是 `splice`？两者都可（Immer 内 splice 安全），但**确认返回新数组引用**
    - 不存在 uniqueId 时是否安全（filter 无副作用）
- [ ] **2.1.3** `recordCustomFieldsList` case：
    - `draft.customFieldsListMapping[uniqueId] = JSON.stringify(setting)` —— 确认 `setting` 一定是可序列化的（旧实现也 stringify，行为一致）
    - **幻觉排查**：是否有人误写成 `JSON.parse` 或直接赋值对象？
- [ ] **2.1.4** `deleteCustomFieldsList` case：
    - `delete draft.customFieldsListMapping[uniqueId]` 是否正确（Immer 支持 `delete`）
    - uniqueId 不存在时是否安全
- [ ] **2.1.5** 4 个 case 是否都落在了 `switch (action.type)` 内正确的位置，**没有 fall-through 缺 `break` / `return`**？
- [ ] **2.1.6** `clearRuntime` / `setDesignerCanvasState` 等"清空类" action 是否仍能正确重置 `realtimeDataFlow` / `customFieldsListMapping`（task-006 L55-57 的硬重置保留没）？
- [ ] **2.1.7** `byId` / `parentMap` 索引在 4 个新 case 下是否需要重建？答案应为"不需要"（runtime 数据不影响组件树结构）—— 确认 reducer 没误调 `buildIndex`

### 2.2 action creator 层（`src/store/modules/designer-canvas-actions.ts`）

- [ ] **2.2.1** 4 个 action creator 的 `type` 字符串是否与 reducer 的 `case` 完全一致（拼写、大小写、命名空间 `designerCanvas/`）？
- [ ] **2.2.2** payload 形状是否与 reducer 解构一致（`{ uniqueId, sourceId }` / `{ uniqueId }` / `{ uniqueId, setting }`）？
- [ ] **2.2.3** 是否导出到 `src/store/modules/index.ts` barrel？是否有遗漏？

### 2.3 hook 层（`src/store/designer/hooks.ts`）

#### 2.3.1 `useRealtimeDataFlow`

- [ ] 返回 `{ record, del }` 两个方法（与原闭包 API 一致）？
- [ ] `record(uniqueId, { sourceId, enable })`：
    - `sourceId` 为 `nil` 或 `''` → 静默 return（与旧实现一致）？
    - `enable === false` → dispatch `deleteRealtimeDataFlow`（不是 `recordRealtimeDataFlow`）？
    - 其他 → dispatch `recordRealtimeDataFlow`？
- [ ] `useMemo([dispatch])` 包裹，避免每次 render 重建对象？
- [ ] **幻觉排查**：是否有"enable === false 还走 record"的反逻辑？是否有"sourceId 为空时反而 push 一个空对象"的 bug？

#### 2.3.2 `useCustomFieldsList`

- [ ] 返回 `{ get, record, del }` 三个方法？
- [ ] `get(uniqueId)` 用 `store.getState().designerCanvas.customFieldsListMapping[uniqueId]` 同步读，`JSON.parse(... ?? '[]')` —— **确认空值返回 `[]` 而不是 `null` / `undefined`**（与旧实现一致）
- [ ] `record(uniqueId, setting)` dispatch `recordCustomFieldsList`？
- [ ] `del(uniqueId)` dispatch `deleteCustomFieldsList`？
- [ ] **幻觉排查**：`get` 内是否误用 `useSelector`（hook 内嵌 hook，违规）？是否漏了 `JSON.parse`？
- [ ] **隐患排查**：`store.getState()` 同步读破坏订阅——确认所有响应式场景已改用 `useSelector`（见 task-011-3-review）。`get` 仅保留给同步计算场景（如 `useConvertMenuState`）。

#### 2.3.3 `useFlatComponents`

- [ ] 用 `useSelector(s => s.designerCanvas.components, shallowEqual)` 订阅？
- [ ] `useMemo(() => flatDesignerList(components), [components])` 重算？
- [ ] 返回 `[flatComponents]`（一元组，不再是 `[flatComponents, forceUpdate]`）？
- [ ] **幻觉排查**：是否仍残留 `useLazyUpdate` / `usePersistFn` import？是否仍导出 `forceUpdate`？
- [ ] **隐患排查**：`shallowEqual` 是否合适？`components` 树顶层引用变化才会触发重算 —— 字段级 `updateFieldConfig` 不改顶层引用，所以 `useFlatComponents` 不会重算。**这是预期行为还是回归**？（task-008 引入字段级更新后，`useFlatComponents` 在字段级更新下不再同步——需确认调用方不依赖字段级变化的 flat 重算）

### 2.4 barrel 导出（`src/store/designer/index.tsx`）

- [ ] `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents` 是否导出？
- [ ] 是否有其他文件从旧路径 `@Src/designer/common` 导入这 3 个 hook（应已全切到 `@Src/store/designer/hooks`）？

---

## 3. 审查方法

1. **静态阅读**：逐行读 `designer-canvas.ts` / `designer-canvas-actions.ts` / `hooks.ts` 的相关代码段
2. **对照原实现**：与 task-011 文档 §3.1.1 / §3.1.2 / §3.2 的"旧实现"逐行对比行为
3. **边界用例推演**：空数组 / 不存在 uniqueId / 重复 record / enable 切换 / 可序列化失败的 setting
4. **grep 校验**：
   ```bash
   grep -n "realtimeDataFlow\|customFieldsList" src/store/modules/designer-canvas.ts
   grep -n "useRealtimeDataFlow\|useCustomFieldsList\|useFlatComponents" src/store/designer/hooks.ts
   ```

---

## 4. 输出

在本文档 §5"审查记录"追加：
- 每个清单项的 ✅ / ❌ / ⚠️ 结论
- 发现的问题列表（编号、严重度、文件:行、描述、建议修复）
- 如有问题，是否需要阻塞 task-011 的 done 状态

---

## 5. 审查记录

> 审查人：AI Agent（review task-011-1）
> 审查日期：2026-07-21
> 审查范围：`src/store/modules/designer-canvas.ts` / `designer-canvas-actions.ts` / `src/store/designer/hooks.ts` / `src/store/designer/index.tsx`
> 对照文档：[task-011 上游计划](./done/task-2026-07-21-011-drop-usedesigner-compat.md) §3.1.1 / §3.1.2 / §3.2

### 5.1 清单逐项结论

#### 2.1 reducer 层（`src/store/modules/designer-canvas.ts`）

- ✅ **2.1.1 `recordRealtimeDataFlow` case**：[designer-canvas.ts#L118-L130](src/store/modules/designer-canvas.ts#L118) 用 `produce(state, draft => ...)` 不可变更新；`preIndex === -1` 时 `draft.realtimeDataFlow.push({ uniqueId, sourceId })`（L125），否则 `draft.realtimeDataFlow[preIndex] = { uniqueId, sourceId }`（L127）整体替换而非 `Object.assign` 半更新（符合 task 文档 §3.1.1 期望）。无"新增/更新分支写反"，无 `return state` 退化分支。
- ✅ **2.1.2 `deleteRealtimeDataFlow` case**：[designer-canvas.ts#L131-L137](src/store/modules/designer-canvas.ts#L131) 用 `.filter(...)` 返回新数组引用赋值给 `draft.realtimeDataFlow`（L135），Immer 内安全。uniqueId 不存在时 filter 无副作用，安全。
- ✅ **2.1.3 `recordCustomFieldsList` case**：[designer-canvas.ts#L138-L144](src/store/modules/designer-canvas.ts#L138) `draft.customFieldsListMapping[uniqueId] = JSON.stringify(setting)`（L142），与旧 `DataProvider` 闭包 `JSON.stringify(setting)` 行为一致（见 task-011 文档 §3.1.2 旧实现 L173）。无误写为 `JSON.parse` 或直接赋值对象。注：`setting` 的可序列化性由调用方保证，旧实现同样不校验，行为一致。
- ✅ **2.1.4 `deleteCustomFieldsList` case**：[designer-canvas.ts#L145-L151](src/store/modules/designer-canvas.ts#L145) `delete draft.customFieldsListMapping[uniqueId]`（L149），Immer 支持 `delete` 操作符。uniqueId 不存在时 `delete` 无副作用，安全。
- ✅ **2.1.5 switch 结构**：4 个 case 各自 `return produce(...)`（L122/L134/L141/L148），无 fall-through，无缺 `break`/`return`。`default: return state`（L153）兜底正确。
- ✅ **2.1.6 `clearRuntime` 重置**：[designer-canvas.ts#L97-L102](src/store/modules/designer-canvas.ts#L97) `draft.realtimeDataFlow = []` + `draft.customFieldsListMapping = {}`（L99-L100）保留 task-006 的硬重置逻辑。`setDesignerCanvasState`（L86-L96）通过 `Object.assign(draft, action.payload)` 也支持调用方显式传 `realtimeDataFlow` / `customFieldsListMapping` 覆盖。
- ✅ **2.1.7 byId/parentMap 索引**：4 个新 case 均未调用 `buildIndex`，正确——runtime 数据不影响组件树结构，不需要重建索引。`buildIndex` 仅在 `setComponents`（L81）/ `setState` 且 payload 含 `components`（L91）时调用。

#### 2.2 action creator 层（`src/store/modules/designer-canvas-actions.ts`）

- ✅ **2.2.1 type 字符串一致**：[designer-canvas-actions.ts#L64-L93](src/store/modules/designer-canvas-actions.ts#L64) 4 个 action creator 的 `type` 分别为 `designerCanvas/recordRealtimeDataFlow` / `designerCanvas/deleteRealtimeDataFlow` / `designerCanvas/recordCustomFieldsList` / `designerCanvas/deleteCustomFieldsList`，与 reducer 的 `case` 字符串（[designer-canvas.ts#L118/L131/L138/L145](src/store/modules/designer-canvas.ts#L118)）完全一致，命名空间 `designerCanvas/` 拼写正确。
- ✅ **2.2.2 payload 形状一致**：
    - `recordRealtimeDataFlow` payload = `{ uniqueId: string; sourceId: string }`（[actions#L64](src/store/modules/designer-canvas-actions.ts#L64)）↔ reducer 解构 `{ uniqueId, sourceId }`（[designer-canvas.ts#L121](src/store/modules/designer-canvas.ts#L121)）✅
    - `deleteRealtimeDataFlow` payload = `{ uniqueId: string }`（[actions#L72](src/store/modules/designer-canvas-actions.ts#L72)）↔ reducer `{ uniqueId }`（[designer-canvas.ts#L133](src/store/modules/designer-canvas.ts#L133)）✅
    - `recordCustomFieldsList` payload = `{ uniqueId: string; setting: any }`（[actions#L82](src/store/modules/designer-canvas-actions.ts#L82)）↔ reducer `{ uniqueId, setting }`（[designer-canvas.ts#L140](src/store/modules/designer-canvas.ts#L140)）✅
    - `deleteCustomFieldsList` payload = `{ uniqueId: string }`（[actions#L90](src/store/modules/designer-canvas-actions.ts#L90)）↔ reducer `{ uniqueId }`（[designer-canvas.ts#L147](src/store/modules/designer-canvas.ts#L147)）✅
- ✅ **2.2.3 barrel 导出**：[modules/index.ts#L12](src/store/modules/index.ts#L12) 单行导出全部 4 个新 action creator（`recordRealtimeDataFlow, deleteRealtimeDataFlow, recordCustomFieldsList, deleteCustomFieldsList`），无遗漏。

#### 2.3 hook 层（`src/store/designer/hooks.ts`）

##### 2.3.1 `useRealtimeDataFlow`

- ✅ **返回 `{ record, del }`**：[hooks.ts#L124-L140](src/store/modules/designer-canvas-actions.ts#L124) 返回 `{ record, del }` 两个方法，与原闭包 API 一致（task-011 文档 §3.1.1）。
- ⚠️ **`record(uniqueId, { sourceId, enable })` 分流逻辑**：[hooks.ts#L128-L135](src/store/designer/hooks.ts#L128)
    - ✅ `sourceId` 为 `nil` 或 `''` → `return`（L129），与旧实现一致
    - ✅ `enable === false` → dispatch `deleteRealtimeDataFlow`（L131），与旧实现"已存在 + enable=false → splice"的**主流程**一致
    - ✅ 其他 → dispatch `recordRealtimeDataFlow`（L133）
    - ⚠️ **行为差异**（见问题 P-1）：旧实现中 `enable === false` 的删除逻辑**仅在 `preIndex !== -1`（记录已存在）时生效**；当 `preIndex === -1`（记录不存在）时，旧实现会**无视 `enable` 直接 push 一条 `{ uniqueId, sourceId }`**。新实现则**无论记录是否存在，`enable === false` 都调 `deleteRealtimeDataFlow`**（对空数组 filter 无副作用，最终不留记录）。
- ✅ **`useMemo([dispatch])` 包裹**：[hooks.ts#L126-L139](src/store/designer/hooks.ts#L126) 用 `useMemo(() => ({...}), [dispatch])` 包裹，避免每次 render 重建对象。
- ⚠️ **幻觉排查**：无"enable === false 还走 record"的反逻辑（L130-L134 分流正确）。但存在 P-1 描述的边缘行为差异。

##### 2.3.2 `useCustomFieldsList`

- ✅ **返回 `{ get, record, del }`**：[hooks.ts#L152-L170](src/store/designer/hooks.ts#L152) 返回三个方法，与原闭包 API 一致。
- ✅ **`get(uniqueId)` 同步读**：[hooks.ts#L156-L159](src/store/designer/hooks.ts#L156) `store.getState().designerCanvas.customFieldsListMapping[uniqueId]` 同步读，`JSON.parse(mapping[uniqueId] ?? '[]')`——空值返回 `[]` 而非 `null`/`undefined`，与旧实现一致（task-011 文档 §3.1.2 期望）。
- ✅ **`record(uniqueId, setting)` dispatch**：[hooks.ts#L160-L163](src/store/designer/hooks.ts#L160) dispatch `recordCustomFieldsList`。额外 `return setting`（L162）是新增行为，但无调用方依赖返回值（grep 确认 `customFieldsList.record(...)` 5 个调用点均不接返回值），不算回归。
- ✅ **`del(uniqueId)` dispatch**：[hooks.ts#L164-L166](src/store/designer/hooks.ts#L164) dispatch `deleteCustomFieldsList`。
- ✅ **幻觉排查**：`get` 内未误用 `useSelector`（用的是 `store.getState()` 同步读，不是 hook 内嵌 hook）。未漏 `JSON.parse`（L158）。
- ⚠️ **隐患排查**：[hooks.ts#L157](src/store/designer/hooks.ts#L157) `store.getState()` 同步读破坏订阅——但 task-011 文档 §3.1.2 已明确决策（方案 1：`get` 仅保留给同步计算场景，如 `useConvertMenuState` / `FedxReportContext` wrapper）。grep 确认 `customFieldsList.get()` 调用点（1 个：`field-mapping-table/index.jsx#L41`）实际通过 `FedxReportContext` 的 wrapper（[FedxReportContext.tsx#L96](src/formily/FedxReportContext.tsx#L96) `() => latest.current.customFieldsList.get(latest.current.uniqueId)`）转发，属于同步读场景，无响应式需求。**符合预期**，但需在 task-011-3-review 确认所有响应式场景已改用 `useSelector`。

##### 2.3.3 `useFlatComponents`

- ✅ **`useSelector` + `shallowEqual`**：[hooks.ts#L183](src/store/designer/hooks.ts#L183) `useSelector((s) => s.designerCanvas.components, shallowEqual)`。
- ✅ **`useMemo` 重算**：[hooks.ts#L184](src/store/designer/hooks.ts#L184) `useMemo(() => flatDesignerList(components), [components])`。
- ✅ **返回 `[flatComponents]` 一元组**：[hooks.ts#L185](src/store/designer/hooks.ts#L185) `return [flatComponents] as const`，不再返回 `forceUpdate`。grep 确认 4 个调用方（`FedxReportContext` / `search-layer` / `interaction/hooks` / `layers-tree/tree`）均用 `const [flatComponents] = useFlatComponents()` 解构首个元素，零影响。
- ✅ **幻觉排查**：grep 确认 `useLazyUpdate` / `usePersistFn` 在 `hooks.ts` 中仅注释出现（L175），无 import 残留。`forceUpdate` 未被导出。
- ⚠️ **隐患排查（字段级更新下不重算）**：[hooks.ts#L183](src/store/designer/hooks.ts#L183) `shallowEqual` 比较 `components` 数组顶层引用。task-008 引入的 `updateFieldConfig` action（[designer-canvas.ts#L103-L117](src/store/modules/designer-canvas.ts#L103)）仅 patch `byId[uniqueId]`，**不改 `components` 数组引用**，因此 `useFlatComponents` 在字段级更新下不会重算。这是**预期行为**（task-008 设计目标就是字段级更新不触发整树重算），但需确认 4 个调用方不依赖"配置面板 onChange 后 flatComponents 立即反映新字段值"。grep 确认调用方均用 `flatComponents` 做结构性遍历（如 `find` / `filter` / `map` 取 uniqueId / type / parentId），不读 `data` 字段值——**符合预期**，无回归。注：结构性变更（`setComponents`）会重建 `components` 引用并触发 `useFlatComponents` 重算，覆盖拖拽/删除/成组等场景。

#### 2.4 barrel 导出（`src/store/designer/index.tsx`）

- ✅ **3 个 hook 导出**：[index.tsx#L35-L37](src/store/designer/index.tsx#L35) 导出 `useRealtimeDataFlow` / `useCustomFieldsList` / `useFlatComponents`，无遗漏。
- ✅ **旧路径 import 清理**：grep `from '@Src/designer/common'` 确认 `src/` 内无任何文件从旧路径导入这 3 个 hook（仅 `DropContainer` / `EnvProvider` / `LAYOUT_BLOCK` / `useScreenPerformance` 等其他符号从 `@Src/designer/common` 导入，与 task-011 无关）。所有 3 个 hook 的 import 均指向 `@Src/store/designer/hooks` 或 `@Src/store/designer`。

### 5.2 发现的问题列表

| # | 严重度 | 文件:行 | 描述 | 建议修复 |
| --- | --- | --- | --- | --- |
| P-1 | medium | [hooks.ts#L130-L131](src/store/designer/hooks.ts#L130) | `useRealtimeDataFlow.record` 在 `enable === false` 时直接 dispatch `deleteRealtimeDataFlow`，与旧 `DataProvider` 闭包在"`uniqueId` 不存在于 `realtimeDataFlow` 数组 + `enable === false`"边缘场景下行为不一致。旧实现：`preIndex === -1` 分支无视 `enable` 直接 `push({ uniqueId, sourceId })`，最终数组留有一条"enable=false 的死记录"；新实现：`deleteRealtimeDataFlow` 对空数组 filter 无副作用，最终数组无记录。**实务影响低**：调用方典型流程是"先 record 启用 → 再 record 关闭"（preIndex !== -1），此场景两者行为一致；"从未 record 过 + enable=false"是边缘场景，且旧实现留下死记录本身更像 bug。 | 可选修复（二选一）：① 保持现状，在 hook 注释补充"`enable === false` 对未记录的 uniqueId 为 no-op，与旧实现在 preIndex===-1 时 push 死记录的行为不同——这是有意修正"；② 严格对齐旧行为：`if (params.enable === false) { dispatch(recordRealtimeDataFlow({ uniqueId, sourceId: params.sourceId })); /* 先确保 push */ dispatch(deleteRealtimeDataFlow({ uniqueId })); }`（不推荐，过度复杂）。建议选 ①。 |
| P-2 | low | [hooks.ts#L162](src/store/designer/hooks.ts#L162) | `useCustomFieldsList.record` 额外 `return setting`，旧实现无返回值。属于"超出原 API 形态的额外行为"。 | 无需修复（无调用方依赖返回值，额外返回值不影响行为）。如需严格对齐可删除 `return setting`，但收益低。 |
| P-3 | low | [hooks.ts#L157](src/store/designer/hooks.ts#L157) | `useCustomFieldsList.get` 用 `store.getState()` 同步读，破坏"通过 hook 订阅"的惯例。task-011 文档 §3.1.2 已明确决策（方案 1，保持原 API 形态），但需在 task-011-3-review 确认所有响应式场景已改用 `useSelector`。 | 不阻塞 task-011。在 task-011-3-review 中重点核查 `get` 的所有调用方是否在响应式场景下漏更新。 |

### 5.3 总结论

**不阻塞 task-011 的 done 状态**。

- 4 个 reducer case 不可变更新正确（`produce` 用对、无 mutation、无 fall-through、`clearRuntime` 硬重置保留、未误调 `buildIndex`）
- 4 个 action creator 的 type/payload 与 reducer 完全一致，barrel 导出无遗漏
- 3 个 hook 的 API 形态与原闭包基本零差异，业务条件（`sourceId` 为空 / `enable === false`）在 hook 层正确分流
- `useFlatComponents` 去 `useLazyUpdate` 后基于 `useSelector` 同步响应，字段级更新下不重算是预期行为（调用方不读字段值）
- 发现 1 个 medium 行为差异（P-1）+ 2 个 low 提示（P-2 / P-3），均不阻塞
- P-1 建议在 hook 注释补充说明（可选），P-3 移交 task-011-3-review 核查响应式调用方

**建议**：task-011 的 done 状态维持，P-1 作为已知行为差异记录在案，不回退。
