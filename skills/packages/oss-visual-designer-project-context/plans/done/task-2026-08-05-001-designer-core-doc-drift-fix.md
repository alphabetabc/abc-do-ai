# task-2026-08-05-001：designer-core 设计文档与代码漂移修正

## 背景

designer-core 框架内核能力已 100% 完成，集成测试已通过（task-2026-08-04-001）。
但多角度 review 发现最初 6 份设计文档（`.trae/documents/design/designer-core/00-05`）与实际代码（`packages-next/designer-core/src/`）之间存在 8 项漂移 + 6 项文档滞后。

核心契约（单源、buildIndex 引用复用、三条写路径、四类插件类型、PluginContext 接口）无漂移，漂移集中在：
1. 上层聚合 API（createDesigner/Context）在最初设计文档中未规划
2. task-001/002/003 内置了结构工具函数，与"框架不内置 structure tools"原则存在张力
3. 个别 API 命名/签名发生了演进但文档未同步

## 目标

修正 6 份最初设计文档 + packages-next 内文档，使其与当前代码一致（§9.5 文档同步）。
不修改任何代码——纯文档修正。

## 详细步骤

### 高优先级（业务方按文档调用会失败）

#### D3: 04-plugin-system.md §3.2 — runtime data 插件方法名
- 文档：`clear / recordRealtimeDataFlow / deleteRealtimeDataFlow / recordCustomFieldsList / deleteCustomFieldsList`
- 实际：`clear / setArrayItem / removeArrayItem / setRecordItem / removeRecordItem`
- 修正：更新方法名 + 说明泛型化设计（runtimeArrayKey / runtimeRecordKey 配置）

#### D4: 03-read-path.md §7.3 — useLatestState 实现说明
- 文档：`ref.current = store.getState(); // 每次 render 更新`
- 实际：`useEffect` 内 `store.subscribe` 订阅更新 ref
- 修正：更新实现说明 + 标注竞态修复理由

#### L5: packages-next/docs/guide/plugins.md — setState 误写
- 文档：`PluginContext，包含 ... setState ...`
- 实际：`setPartialState`
- 修正：setState → setPartialState

### 中优先级（文档描述与代码不一致，但不直接导致调用失败）

#### D2: 04-plugin-system.md §5.3 + 05-principles.md §3.8 约束8 — 框架已内置 structure tools
- 文档：`框架不内置 structure tools`
- 实际：task-001/002/003 抽离了 13+ 函数并从 index.ts 公开导出
- 修正：更新文档承认工具函数已内置为框架核心层导出（非插件形式），保留 createStructureToolsPlugin 作为业务注册壳

#### D1: 00-overview.md §5.8 — 标注后补章节
- 修正：§5.8 开头标注"本节为 B8 后补，最初 6 份设计文档（00-05）未规划聚合层"

#### D8: 04-plugin-system.md §4.3 — createDerivedComputePlugin 签名
- 文档：`createDerivedComputePlugin(compute, options?: { name?: string })`
- 实际：`createDerivedComputePlugin(options: { compute, name? })`
- 修正：更新为 options 对象签名

#### D5/D6/L4: 03-read-path.md — hook 签名区分 + useTree shallowEqual
- 修正：区分底层散装签名（含 store 首参）与上层聚合签名（createDesigner 闭包绑定）
- 修正：useTree shallowEqual 说明（zustand v4 需用 useStoreWithEqualityFn）

#### D7/L3: 00-overview.md §5.1 + 03-read-path.md — 补充 API
- 修正：§5.1 补充 getPluginContext/destroy 方法
- 修正：03-read-path 补充 useExtra 章节

#### L1/L2: 统一两份 principles 文档
- `.trae/documents/design/designer-core/05-principles.md`（4 大原则 + 8 约束）
- `packages-next/designer-core/docs/design/principles.md`（4 大原则 + 8 约束）
- 修正：统一表述与编号，以代码实际为准

## 验证

- 6 份设计文档与 `index.ts` 实际导出一致
- packages-next 内文档与代码一致
- 不修改任何代码

## 风险

| ID | 风险 | 缓解 |
| --- | --- | --- |
| R1 | 文档修正可能引入新的不一致 | 每项修正后对照代码验证 |
| R2 | L1/L2 两份 principles 统一可能影响已有引用 | 只统一表述，不改变文件路径 |

## 回退

git revert 文档变更即可，无代码影响。

## 实施记录

### 2026-08-05 实施

#### 高优先级修正（业务方按文档调用会失败）

**D3: 04-plugin-system.md §3.2-3.4 — runtime data 插件方法名**
- 接口方法名：`recordRealtimeDataFlow/deleteRealtimeDataFlow/recordCustomFieldsList/deleteCustomFieldsList` → `setArrayItem/removeArrayItem/setRecordItem/removeRecordItem`
- 实现草案：`keys: { realtimeDataFlowKey, customFieldsListMappingKey }` → `options: { runtimeArrayKey, runtimeRecordKey }`
- 契约说明：更新 key 可配置描述
- §3.4 映射表：更新当前 hook 对应关系

**D4: 03-read-path.md §7.3 — useLatestState 实现说明**
- 实现草案：`ref.current = store.getState(); // 每次 render 更新` → `useEffect` 内 `store.subscribe` 订阅更新 ref
- 差异说明：新增"subscribe 模式理由"（竞态修复：组件未 re-render 时 ref 会过期）

**L5: packages-next/docs/guide/plugins.md — setState 误写**
- `PluginContext，包含 ... setState ...` → `setPartialState`

#### 中优先级修正（文档与代码不一致）

**D2: 04-plugin-system.md §5.3 + 05-principles.md §3.8 — 框架已内置 structure tools**
- §5.3：`框架不内置 structure tools` → 更新为"已将通用工具函数抽离到 core/utils/ 并从 index.ts 导出" + 分层表
- §3.8 约束 8：`structure tools 插件是纯函数，不操作 store` → `纯函数注册壳，不操作 store；通用工具函数已作为核心工具层导出`
- packages-next/docs/design/principles.md 约束 7：同步修正

**D8: 04-plugin-system.md §4.3 + §4.5 — createDerivedComputePlugin 签名**
- §4.3 实现：`createDerivedComputePlugin(compute, options?: { name? })` → `createDerivedComputePlugin(options: { compute, name? })`
- §4.5 示例：同步更新调用方式

**D1: 00-overview.md §5.8 — 标注后补章节**
- `本节为 B8 落地的上层封装` → `本节为 B8 task 后补，最初 6 份设计文档（00-05）未规划聚合层`

**D5/D6/L4: 03-read-path.md — hook 签名 + useTree shallowEqual**
- §2：新增"签名说明"注释，区分底层散装签名（含 store 首参）与上层聚合签名
- §3.3：useTree 实现草案更新为 `useStoreWithEqualityFn`（zustand v4 要求）+ false 分支用 `Object.is`
- §3.4：useFlatTree 签名更新为底层散装签名（含 store 首参 + TFlatItem 泛型）

**D7/L3: 00-overview.md §5.1 + 03-read-path.md §7.5 — 补充 API**
- §5.1：TreeStoreApi 补充 `getPluginContext()` / `destroy()` 方法说明
- 03-read-path：新增 §7.5 useExtra 章节 + 更新 §8 决策树"读 extra"路径

**L1/L2: 统一两份 principles 文档**
- packages-next/docs/design/principles.md：约束 7 同步修正 + 顶部新增交叉引用注释（指向权威文档）

#### 未修改的文件
- 01-data-model.md（无漂移）
- 02-write-path.md（无漂移）
- 代码文件（纯文档修正任务）

#### 验证
- 6 份设计文档与 index.ts 实际导出一致
- packages-next 内文档与代码一致
- 不修改任何代码
