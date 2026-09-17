# designer-plugins 业务插件包研究报告

> 调研日期：2026-08-05
> 调研范围：designer-core 框架能力 / src/ 设计器模块现状 / tango-main 参考项目 / 假插件迁移事实枚举
> 目标：为新建 `packages-next/designer-plugins/` 业务插件包提供完整的事实基础和设计方案

---

## 1. 背景与目标

### 1.1 项目现状

designer-core 框架内核能力已 100% 完成（状态管理 + 读路径 hooks + 插件系统 + 纯函数工具 + 聚合 API），集成测试已通过（190 tests passed）。

但 `src/` 下设计器仍使用旧版 Redux + 假插件（`src/plugins/` 下的 interaction / data-fetcher / animation / config-formatter），框架版零使用。

### 1.2 目标架构

```
react/zustand (peer)
    ↑
@fedx-vis/designer-core (框架内核，已完成)
  - createTreeStore / createDesigner / DesignerProvider
  - 6 个 hooks（useNode/useTree/useFlatTree/useUpdateNode/useLatestState/useExtra）
  - 4 类插件工厂（runtime-data/derived-compute/structure-tools/cross-slice-sync）
  - 18 个纯函数工具（树遍历/组尺寸/结构操作）
    ↑
@fedx-vis/designer-plugins (业务插件包，待新建)
  - createInteractionPlugin (组件联动)
  - createDataFetcherPlugin (数据请求+实时数据流)
  - createGroupManagementPlugin (组管理)
  - createLayerOpsPlugin (图层操作)
  - createViewPlugin (画布视图状态)
  - createAnimationPlugin / createConfigFormatterPlugin
    ↑
src/ 或 designer-next (应用层)
  - 保留 UI 组件（aside-panel/configuration-panel/toolbar/canvas-graph）
  - 重写渲染层（renderer/DesignerField/GeneratorWidget）
  - hooks 改为消费 designer-core + designer-plugins
```

### 1.3 核心原则

- **不做桥接，直接替换**：删除 Redux reducer case + state 字段，改为 designer-core store extra
- **不是迁移，是重写**：用新框架能力重新实现 src 的状态层 + 业务插件层 + 渲染层
- **UI 组件大量保留**：aside-panel / configuration-panel / toolbar / canvas-graph 的 UI 保留，内部 hooks 改数据源

---

## 2. designer-core 框架能力清单

### 2.1 聚合 API 层

| API | 签名 | 用途 |
| --- | --- | --- |
| `createDesigner` | `(options: CreateTreeStoreOptions) => Designer` | 一次创建，hooks 闭包绑定 store |
| `DesignerProvider` | `({designer, children}) => JSX` | Context 注入 Designer 实例 |
| `useDesigner` | `() => Designer` | 子组件获取 Designer（未包裹时抛错） |
| `useDesignerOptional` | `() => Designer \| null` | 可选版 |

### 2.2 Store API

| 方法 | 签名 | 用途 |
| --- | --- | --- |
| `setTree` | `(components) => void` | 结构性变更（整树替换 + buildIndex 重建） |
| `updateNode` | `(id, patch) => void` | 字段级更新（反向追踪 + 不可变改树 + 6 边界降级） |
| `setPartialState` | `(payload) => void` | 批量更新（浅合并 + byId/parentMap 防护） |
| `subscribe` | `(listener) => unsub` | 订阅 state 变化 |
| `getState` | `() => TreeStoreState` | 同步读 |
| `getNodeById` | `(components, id) => TNode` | 递归查找 |
| `buildIndex` | `(components, oldById?) => {byId, parentMap}` | 引用复用构建索引 |
| `getPluginContext` | `() => PluginContext` | 插件上下文 |
| `destroy` | `() => void` | 销毁 store |

### 2.3 读路径 Hooks

| Hook | 签名 | 用途 |
| --- | --- | --- |
| `useNode` | `(store, id) => TFlat \| undefined` | 字段级订阅 byId[id] |
| `useTree` | `(store, {shallow?}) => TNode[]` | 整树订阅（默认 shallow=true） |
| `useFlatTree` | `(store, flatten) => TFlatItem[]` | 整树+扁平化 |
| `useUpdateNode` | `(store) => (id, patch) => void` | 稳定引用更新回调 |
| `useLatestState` | `(store) => () => State` | 跨异步读（subscribe 实时刷新 ref） |
| `useExtra` | `(store, selector) => U` | extra 字段订阅（内建 shallowEqual） |

### 2.4 插件系统

**PluginContext 提供**：`getState` / `subscribe` / `setTree` / `setPartialState` / `getNodeById` / `buildIndex`

**4 类插件工厂**：

| 工厂 | 类型 | 机制 | 对应 src/ 能力 |
| --- | --- | --- | --- |
| `createRuntimeDataPlugin` | runtime-data | extra 中数组+Record 的 CRUD | designer-canvas 的 realtimeDataFlow/customFieldsListMapping |
| `createDerivedComputePlugin` | derived-compute | subscribe → compute → setTree（内建防重入） | recalcGroupBounds |
| `createStructureToolsPlugin` | structure-tools | 纯函数注册壳（无 init） | generatorGroup/splitGroup |
| `createCrossSliceSyncPlugin` | cross-slice-sync | 框架 ↔ 外部 store 双向同步 | viewCanvas/viewUI |

### 2.5 纯函数工具（18 个）

**树遍历（tree-utils.ts）**：flatDesignerList / eachTreeNode / visitNonLeafNodes / orderBy / getNodeOrderBy / setLevelPath / setChildren / clearEmptyCollection

**组尺寸（group-bounds.ts）**：getGroupSizePosition / resetChildrenPosition / syncGroupSize2Children / mergeNodeData / createRecalcGroupBounds（工厂）

**结构操作（structure-ops.ts）**：generatorNode / generatorGroup / splitGroup / deleteNodeById / getSelectedKeys

---

## 3. src/ 设计器模块现状

### 3.1 按职责分层

| 层 | 模块 | 核心文件 | 新能力归属 |
| --- | --- | --- | --- |
| 状态管理 | store/modules（5 slice）+ hooks.ts | designer-canvas.ts / component.ts / view-canvas.ts / view-ui.ts | designer-core 直接替代 |
| 业务插件 | plugins/（4 个假插件） | interaction / data-fetcher / animation / config-formatter | designer-plugins 重写 |
| 业务操作 | layer-manager（8 类操作） | copy/delete/group/lock/move/visible | designer-plugins 提供 |
| UI 组件 | aside-panel / configuration-panel / toolbar / canvas-graph | 纯 UI 组件 | 保留 UI，改数据源 |
| 渲染层 | renderer | DesignerField / GeneratorWidget / utils.ts | 需重写 |

### 3.2 假插件现状

src/plugins/ 下 5 个"插件"全部是假插件——没有插件接口（无 name/type/init/destroy），通过 component.ts switch case 硬编码接入，强耦合 React-Redux + hox + 业务 services。作者在 readme.md 中已自承"现在的代码能力其实还是内部使用的方法集合"。

| 模块 | 实际形态 | 适合做真插件？ |
| --- | --- | --- |
| interaction | React hooks + Redux reducer | 部分（reducer 适合，hooks 不适合） |
| data-fetcher | React hooks + Redux reducer + thunk | 部分（4 个 reducer 适合，useFetchData 不适合） |
| animation | React 组件 + schema 常量 | 不适合（应归物料层） |
| config-formatter | 纯函数 | 不适合（价值极低） |
| common | 工具重导出 | 不适合 |

### 3.3 需迁移的 state 字段

| 字段 | 原 slice | 目标 | 注意点 |
| --- | --- | --- | --- |
| `interactions` | component | `extra.interactions` | 归并逻辑复杂（drillDown 保留 + 互斥 + 合并） |
| `realtimeDataFlow`（数据内容） | component | `extra.realtimeDataFlowData` | **必须改名**避免与订阅索引冲突 |
| `globalResponse` | component | `extra.globalResponse` | 浅合并 |
| `dataSetList` | component | `extra.dataSetList` | 整体替换 |
| `realtimeDataFlow`（订阅索引） | designerCanvas | `extra.realtimeDataFlow` | 已被 createRuntimeDataPlugin 覆盖 |
| `customFieldsListMapping` | designerCanvas | `extra.customFieldsListMapping` | **注意 stringify 语义差异** |
| `page` / `meta` / `appScopeId` | designerCanvas | `extra.page/meta/appScopeId` | — |

**不迁移的 component slice 字段**：`mode` / `selected` / `querys`（保留在 Redux 或迁入 designer-plugins 的独立 store）

### 3.4 影响面汇总

- 需删除的 9 个 reducer case（component.ts 4 个 + designer-canvas.ts 5 个）
- 需删除的 5 个 action creator（designer-canvas-actions.ts）
- 需改造的 11 个 useSelector 调用点
- 需改造的 11 个 dispatch 调用点
- 需保留的 17 个 hooks（内部改读 designer-core store）

---

## 4. tango-main 参考项目

### 4.1 架构模式

tango-main 采用严格分层依赖：

```
@music163/tango-helpers  (基础工具，无业务)
        ↑
@music163/tango-core     (核心引擎，依赖 helpers)
        ↑
@music163/tango-designer      (设计器，依赖 core + helpers + setting-form + sandbox + ui)
```

### 4.2 可借鉴的设计模式

| 模式 | tango-main 做法 | designer-plugins 对应 |
| --- | --- | --- |
| 工厂模式 | `createEngine(options)` 返回聚合实例 | `createXxxPlugin(options)` 返回 Plugin 对象 |
| Barrel 导出 | `src/index.ts` 统一 `export *` | designer-plugins/index.ts |
| 构建配置 | tsc 双产物（ESM + CJS） | 与 designer-core 对齐用 vite |
| peerDependencies | 框架级依赖外置（react/styled-components） | react/zustand/designer-core 外置 |
| helpers 独立包 | 通用工具抽成独立 npm 包 | @fedx-vis/utils 已承担此角色 |

### 4.3 不借鉴的部分

- tango-main 用 MobX，本项目用 Zustand
- tango-main 的 core 包含业务模型（Designer/Workspace/Engine），designer-core 故意不含业务模型
- tango-main 用 tsc 构建，designer-core 已用 vite，designer-plugins 应对齐

---

## 5. designer-plugins 项目设计方案

### 5.1 包配置

- **包名**：`@fedx-vis/designer-plugins`
- **位置**：`packages-next/designer-plugins/`
- **构建**：vite 库模式（ESM + CJS），与 designer-core 对齐
- **peerDependencies**：`react` / `zustand` / `@fedx-vis/designer-core`
- **dependencies**：`@fedx-vis/designer-core`（workspace:^）+ `@fedx-vis/request` / `@fedx-vis/share` / `@fedx-vis/hooks` / `@fedx-vis/utils`

### 5.2 目录结构

```
packages-next/designer-plugins/
├── package.json
├── tsconfig.json          # paths 映射 designer-core 源码
├── vite.config.ts         # 多入口（index + interaction + data-fetcher）
└── src/
    ├── index.ts           # barrel 导出所有插件工厂 + 类型
    ├── interaction/       # createInteractionPlugin
    │   ├── index.ts
    │   ├── types.ts       # InteractionEvent / InteractionField
    │   ├── plugin.ts      # 工厂实现
    │   ├── reducer.ts     # 归并逻辑（从 src 迁移）
    │   ├── hooks.ts       # useCreateInteractionApi 等
    │   ├── utils.ts       # parseSubscribeParams 等
    │   └── constants.ts   # ACTION_INTERACTION / CONFIGURABLE_EVENT
    ├── data-fetcher/      # createDataFetcherPlugin
    │   ├── index.ts
    │   ├── types.ts
    │   ├── plugin.ts      # 工厂实现（组合 runtime-data）
    │   ├── DataFetcher.ts # useFetchData hook
    │   ├── GlobalDataFetcher.ts
    │   ├── GlobalDataSet.ts
    │   ├── RealtimeDataFlow.ts
    │   ├── constants.ts
    │   └── utils/
    ├── group-management/  # createGroupManagementPlugin
    │   ├── index.ts
    │   ├── types.ts
    │   └── plugin.ts      # 组合 derived-compute + structure-tools
    ├── layer-ops/         # createLayerOpsPlugin
    │   ├── index.ts
    │   ├── types.ts
    │   └── plugin.ts      # copy/delete/lock/move/visible
    ├── view/              # createViewPlugin
    │   ├── index.ts
    │   ├── types.ts
    │   └── plugin.ts      # viewCanvas + viewUI 状态管理
    ├── animation/         # createAnimationPlugin
    │   ├── index.ts
    │   ├── types.ts
    │   ├── plugin.ts
    │   ├── components.tsx
    │   └── schema.ts
    ├── config-formatter/  # createConfigFormatterPlugin
    │   ├── index.ts
    │   └── plugin.ts
    └── shared/            # 跨插件共享
        ├── types.ts
        └── utils.ts
```

### 5.3 业务插件接口设计

#### createInteractionPlugin

```ts
export interface InteractionPluginOptions {
  eventBus?: any;           // @fedx-vis/share.interactions
  enableDrillDown?: boolean;
}

export interface InteractionPlugin {
  plugin: Plugin;           // 注册到 store（runtime-data 变体）
  useCreateInteractionApi: (uniqueId: string) => InteractionType;
  useInteractionsPreprocessor: (uniqueId: string) => void;
  useInteractionsGraph: (uniqueId: string) => any;
  useCurrentFieldDrilldownData: (uniqueId: string) => any;
  useSubscribeObject: (uniqueId: string) => any;
  dispatchAction: (event: InteractionEvent) => void;
  parseSubscribeParams: (params: any) => any;
}
```

**核心逻辑**：
- interactions 数组存入 `extra.interactions`
- 归并逻辑（drillDown 保留 + fieldName 互斥 + Object.assign 合并）迁移为纯函数
- dispatchAction 改为调 `ctx.setPartialState({ extra: { ...extra, interactions: newList } })`
- hooks 内部 useSelector 改为 `useExtra(s => s.interactions)`

#### createDataFetcherPlugin

```ts
export interface DataFetcherPluginOptions {
  requestAdapter?: any;    // @fedx-vis/request 实例
  globalDataSet?: Record<string, any>;
  realtimeArrayKey?: string;
}

export interface DataFetcherPlugin {
  plugin: Plugin;           // 组合 runtime-data
  useFetchData: (uniqueId: string, options: FetchOptions) => { data, loading, error };
  useGlobalFetcher: () => void;
  useGlobalFetcherResponse: (fetcherId: string) => any;
  useDataSetList: () => any;
  useCurrentDataSource: (subscribeSourceId: string) => any;
  eachRequestParams: (params: any) => any;
  getDesignerOriginData: () => any;
  fetchStorage: any;
}
```

**核心逻辑**：
- realtimeDataFlow（订阅索引）→ `createRuntimeDataPlugin.setArrayItem`
- customFieldsListMapping → `createRuntimeDataPlugin.setRecordItem`
- globalResponse → `extra.globalResponse`（浅合并）
- dataSetList → `extra.dataSetList`（整体替换）
- realtimeDataFlowData（数据内容）→ `extra.realtimeDataFlowData`（按 uniqueId 写 list）
- useFetchData 保留为 React hook（强依赖 useEffect/useRef/useSelector）

#### createGroupManagementPlugin

```ts
export interface GroupManagementPluginOptions {
  recalcOnChildrenChange?: boolean;
  getSelectedIds?: () => string[];
  name?: string;
}

export interface GroupManagementPlugin {
  plugin: Plugin;           // 组合 derived-compute + structure-tools
  tools: {
    generatorGroup: (...) => { components, fieldId };
    splitGroup: (...) => { components, fieldId };
    deleteNode: (components, id) => { components, selected };
    getSelectedKeys: (byId, parentMap, selected) => string;
  };
}
```

**核心逻辑**：
- derived-compute：`createDerivedComputePlugin({ compute: createRecalcGroupBounds({ getSelectedIds }) })`
- structure-tools：注册 generatorGroup/splitGroup/deleteNodeById/getSelectedKeys
- 不做成单一插件——组管理子能力性质异构（纯函数/订阅派生/事件驱动），分层更合适

#### createLayerOpsPlugin

```ts
export interface LayerOpsPluginOptions {
  generateId?: () => string;
}

export interface LayerOpsPlugin {
  plugin: Plugin;           // structure-tools
  copy: (components, id) => { components, selected };
  deleteNode: (components, id) => { components, selected };
  lock: (components, id, locked) => components;
  move: (components, id, direction) => components;
  setVisible: (components, id, visible) => components;
}
```

#### createViewPlugin

```ts
export interface ViewPluginOptions {
  initialScale?: number;
  initialCanvasSize?: { width, height };
}

export interface ViewPlugin {
  plugin: Plugin;           // cross-slice-sync（独立 Zustand store）
  useView: () => ViewState;
  useSetView: () => (patch) => void;
  useViewScale: () => number;
  useViewLines: () => any[];
  // ...细粒度 hook
}
```

**核心逻辑**：
- viewCanvas（高频：scale/lines/标尺/画布尺寸）+ viewUI（低频：tabsKey/collapsed/visible）
- 用独立 Zustand store 管理，通过 `createCrossSliceSyncPlugin` 与 designer-core store 同步
- 或直接放入 `extra`（如果不需要独立 store）

### 5.4 与 designer-core 的消费关系

designer-plugins 通过三种方式消费 designer-core：

1. **组合框架插件工厂**：业务插件的 `plugin` 字段内部调用 `createRuntimeDataPlugin` / `createDerivedComputePlugin` / `createStructureToolsPlugin` / `createCrossSliceSyncPlugin`
2. **使用 PluginContext API**：业务插件在 `init(context)` 中获取 `getState` / `subscribe` / `setTree` / `setPartialState`
3. **复用纯函数工具**：直接 import `generatorGroup` / `splitGroup` / `createRecalcGroupBounds` 等

### 5.5 与 src/ 的消费关系

应用层通过 DesignerProvider 注入：

```tsx
import { createDesigner, DesignerProvider } from '@fedx-vis/designer-core';
import { createInteractionPlugin, createDataFetcherPlugin } from '@fedx-vis/designer-plugins';

const interaction = createInteractionPlugin({ eventBus: share.interactions });
const dataFetcher = createDataFetcherPlugin({ requestAdapter: request });

const designer = createDesigner({
  initialComponents: [...],
  plugins: [interaction.plugin, dataFetcher.plugin],
});

<DesignerProvider designer={designer}>
  <App />
</DesignerProvider>
```

---

## 6. 能力缺口

### 6.1 designer-plugins 需提供但 src 现有的能力

| 能力 | src/ 位置 | designer-plugins 插件 | 优先级 |
| --- | --- | --- | --- |
| 组件联动 | plugins/interaction | createInteractionPlugin | P4（最复杂） |
| 数据请求 | plugins/data-fetcher | createDataFetcherPlugin | P1-P3 |
| 组管理 | layer-manager/group + renderer/utils | createGroupManagementPlugin | P2 |
| 图层操作 | layer-manager（8 类） | createLayerOpsPlugin | P1 |
| 画布视图状态 | view-canvas + view-ui slice | createViewPlugin | P0 |
| 动画配置 | plugins/animation | createAnimationPlugin | P3 |
| 配置格式化 | plugins/config-formatter | createConfigFormatterPlugin | P3 |

### 6.2 需评估是否补齐的横切能力

| 缺口 | 说明 | 建议归属 |
| --- | --- | --- |
| undo/redo | task-002 删除了死字段，框架无历史栈 | designer-plugins 的 HistoryPlugin |
| 拖拽 DnD | common/dnd + draggable | 新 designer-ui 包 |
| 画布渲染 | DesignerField / GeneratorWidget | 新 designer-ui 包 |
| id 生成 | generatorNode 需 caller 注入 | designer-plugins 统一策略 |
| 物料系统 | packages/* + materials | 保留，designer-plugins 提供接口 |
| 持久化 | redux-persist（当前 whitelist=[]） | 业务层或 PersistPlugin |
| 微前端接入 | designer-next/src/micro-app/ | 应用层 |

### 6.3 designer-core 已提供但 src 现有实现存在缺陷（重写时修复）

| 能力 | src 现状缺陷 | designer-core 改进 |
| --- | --- | --- |
| setPartialState byId 防护 | 用 `'byId' in payload`（遍历原型链） | 修正为 `hasOwnProperty.call` |
| useLatestState | 仅 render 时更新 ref，有竞态 | 用 subscribe 实时刷新 ref |
| useFlatTree | flatDesignerList 硬编码 | flatten 函数业务传入 |
| updateNode | Immer produce | 手动不可变路径更新 |
| 工具函数 | 依赖 lodash/oss-web-toolkits | 自实现 shallowEqual |

---

## 7. 迁移优先级建议

### 7.1 按风险从低到高

```
P0: createViewPlugin（viewCanvas + viewUI → 独立 Zustand store）
    ↓
P1: createLayerOpsPlugin（copy/delete/lock/move/visible，纯函数注册）
    ↓
P2: createGroupManagementPlugin（组合 derived-compute + structure-tools）
    ↓
P3: createDataFetcherPlugin（runtime-data 组合，4 个子模块）
    ↓
P4: createInteractionPlugin（归并逻辑最复杂，最后做）
```

### 7.2 按依赖顺序

```
P0 createViewPlugin          ← 无依赖，最先做
P1 createLayerOpsPlugin      ← 依赖 designer-core 纯函数
P2 createGroupManagementPlugin ← 依赖 createDerivedComputePlugin + 纯函数
P3 createDataFetcherPlugin   ← 依赖 createRuntimeDataPlugin
P4 createInteractionPlugin   ← 依赖 createRuntimeDataPlugin + 跨插件调 RealtimeDataFlow
```

### 7.3 关键风险点

1. **customFieldsListMapping 的 stringify 语义**：当前 Redux 版会 `JSON.stringify`，`createRuntimeDataPlugin.setRecordItem` 不 stringify——必须保持语义一致
2. **realtimeDataFlow 命名冲突**：`component.realtimeDataFlow`（数据内容）vs `designerCanvas.realtimeDataFlow`（订阅索引）——必须改名 `extra.realtimeDataFlowData`
3. **useInjectGlobalFetcherResponse2nextPage**：跨 store 注入（微应用嵌套），子 store 可能仍是 Redux
4. **ACTION_INTERACTION 来自 @fedx-vis/share**：不是字符串字面量，插件需对接 share 包
5. **interaction 跨插件调 RealtimeDataFlow**：`hooks.ts:250` 调 `RealtimeDataFlow.dispatch`，迁移时需保证调用顺序

---

## 8. designer-next 现状

designer-next **完全没有消费 designer-core**，是早于 designer-core 的空壳尝试：

| 文件 | 实际内容 | 状态 |
| --- | --- | --- |
| src/root/index.tsx | `LargeScreenAppRoot = () => <span>123</span>` | 空壳 |
| src/core/designer/index.tsx | `Designer = () => <div>Designer</div>` | 空壳 |
| src/core/viewer/index.tsx | `Viewer = () => <div>Viewer</div>` | 空壳 |
| src/hox/useComponentsInfo.ts | 基于 hox 的组件列表状态 | 旧 hox 模式 |

**结论**：designer-next 不能作为 designer-core 的消费参考。真正的消费参考是 designer-core 自身的集成测试（`integration.test.tsx`）。

---

## 9. 结论

1. **designer-core 框架内核已完成 100%**，覆盖状态管理、读路径 hooks、插件系统、纯函数工具
2. **designer-plugins 尚未创建**，需承载 7 个业务插件 + 业务 hooks 适配层
3. **重写策略**：不是迁移替换，而是用新框架能力重新实现 src 的状态层 + 业务插件层 + 渲染层，UI 组件层大量保留
4. **优先级**：P0 createViewPlugin → P1 createLayerOpsPlugin → P2 createGroupManagementPlugin → P3 createDataFetcherPlugin → P4 createInteractionPlugin
5. **关键风险**：customFieldsListMapping stringify 语义 / realtimeDataFlow 命名冲突 / 跨 store 注入 / share 包常量对接

---

## 附录：关键文件路径索引

**designer-core 框架**：
- `packages-next/designer-core/src/index.ts`（导出清单）
- `packages-next/designer-core/src/createDesigner.ts`（聚合 API）
- `packages-next/designer-core/src/plugins/types.ts`（插件契约）
- `packages-next/designer-core/src/plugins/createRuntimeDataPlugin.ts`
- `packages-next/designer-core/src/plugins/createDerivedComputePlugin.ts`
- `packages-next/designer-core/src/core/utils/structure-ops.ts`
- `packages-next/designer-core/src/core/utils/group-bounds.ts`
- `packages-next/designer-core/src/core/utils/tree-utils.ts`

**src/ 假插件**：
- `src/plugins/index.ts`（聚合出口）
- `src/plugins/readme.md`（作者自承"假插件"）
- `src/plugins/interaction/component/reducer.ts`（归并逻辑）
- `src/plugins/interaction/component/hooks.ts`（5 个 hooks）
- `src/plugins/data-fetcher/DataFetcher.ts`（useFetchData ~400 行）
- `src/plugins/data-fetcher/GlobalDataFetcher.ts`（globalResponse）
- `src/plugins/data-fetcher/GlobalDataSet.ts`（dataSetList）
- `src/plugins/data-fetcher/RealtimeDataFlow.ts`（realtimeDataFlow）

**src/ 状态层**：
- `src/store/modules/component.ts`（4 个 reducer case L63-78）
- `src/store/modules/designer-canvas.ts`（5 个 runtime reducer case L111-212）
- `src/store/modules/designer-canvas-actions.ts`（5 个 action creator）
- `src/store/designer/hooks.ts`（17 个设计器 hooks）

**tango-main 参考**：
- `.local-pkg/tango-main/packages/core/package.json`
- `.local-pkg/tango-main/packages/core/src/factory.ts`
- `.local-pkg/tango-main/packages/designer/package.json`
