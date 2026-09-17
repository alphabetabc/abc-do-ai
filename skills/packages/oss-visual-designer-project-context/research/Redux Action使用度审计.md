# Redux Action 使用度审计报告

> 审计日期：2026-07-20
> 任务编号：`task-2026-07-20-002`
> 审计范围：`src/` 全量代码（含 `packages/` 子包）
> 排除范围：`src/store/backup/*.bak`（备份文件）、`*.bak.*`（其他备份文件）

---

## 1. 审计方法

对每个 reducer 中声明的 action type，搜索以下三种调用模式：

1. **静态调用**：`dispatch({ type: 'app/accessToken', ... })` 或 `type: 'app/accessToken'`
2. **通过 componentActions 常量**：`dispatch({ type: componentActions.selected, ... })`
3. **通过插件常量**：`dispatch({ type: ACTION_INTERACTION, ... })`（实际值由 `packages/share` 提供）

同时对每个 slice 验证了 `useSelector(state => state.xxx)` 的读取情况。

> 注：`form/*` 与 `tab/*` 两个 slice 在 `src/` 内**完全没有任何 dispatch 调用**。

---

## 2. 审计结果总览

| Slice | 声明的 action 数 | 被 dispatch 的 action 数 | 死代码 action 数 | 被 useSelector 读取 |
| --- | --- | --- | --- | --- |
| `app` | 11 | 5 | 6 | 是（部分） |
| `component` | 12 | 7 | 5 | 是 |
| `form` | 4 | 0 | 4 | **否**（整个 slice 已删除） |
| `tab` | 3 | 0 | 3 | **否**（整个 slice 已删除） |
| **合计** | **30** | **12** | **18** | — |

**18 个 action 是死代码**（占 60%），从未被活代码 dispatch。

> 注 1：`component/dependencies` 虽然有 3 处 dispatch 调用，但全部在死代码组件 `packages/base/iframe/custom.js` 内，属于"自产自销型死代码"，已清理。
>
> 注 2：`tab/tabStore` 原本被 `packages/container/tabs/` 调用，但该目录在 task-002 中被整目录删除（用户确认废弃），导致 `tabStore` 也变为死代码。`tab` slice 已整个删除。

---

## 3. 详细审计表

### 3.1 `app` slice（[src/store/modules/app.ts](src/store/modules/app.ts)）

| Action | 调用点 | 状态 |
| --- | --- | --- |
| `app/accessToken` | 无 | ❌ 死代码 |
| `app/refreshToken` | 无 | ❌ 死代码 |
| `app/routes` | 无 | ❌ 死代码 |
| `app/userInfo` | 无 | ❌ 死代码 |
| `app/routerPath` | 无 | ❌ 死代码 |
| `app/layouts` | 无 | ❌ 死代码 |
| `app/topToolbarHiddenList` | [pages/preview/material/index.tsx#L19](src/pages/preview/material/index.tsx#L19)、[pages/designer-page/designer-material-custom/index.tsx#L27](src/pages/designer-page/designer-material-custom/index.tsx#L27)、[pages/designer-page/designer-material-business/index.tsx#L27](src/pages/designer-page/designer-material-business/index.tsx#L27) | ✅ 使用 |
| `app/designerType` | 6 处：[large-screen](src/pages/designer-page/large-screen/index.tsx#L11)、[layout](src/pages/designer-page/layout/index.tsx#L11)、[large-screen-local](src/pages/designer-page/large-screen-local/index.tsx#L11)、[designer-material-custom](src/pages/designer-page/designer-material-custom/index.tsx#L23)、[designer-material-business](src/pages/designer-page/designer-material-business/index.tsx#L23)、[designer-scene-monitor](src/pages/designer-page/designer-scene-monitor/index.tsx#L34) | ✅ 使用 |
| `app/contextMenu`（= `contextMenuRedux.APP_CONTEXTMENU`） | 5 处：[DesignerContextMenu.tsx](src/designer/context-menu/DesignerContextMenu.tsx)（3）、[ContextMenuModal.tsx](src/designer/context-menu/ContextMenuModal.tsx)（2），通过 `contextMenuAction()` action creator | ✅ 使用 |
| `app/sidebarOpened` | 无 | ❌ 死代码 |
| `app/resetState` | [app/container/index.tsx#L133](src/app/container/index.tsx#L133) | ✅ 使用 |

**死代码 action：7 个**
- `app/accessToken`、`app/refreshToken`、`app/routes`、`app/userInfo`、`app/routerPath`、`app/layouts`、`app/sidebarOpened`

> 备注：`app/accessToken` 等 6 个 action 看起来是为登录流程准备的，但实际登录态由 `hox` 的 `useAppInfoModel` 管理（见 [src/hox/](src/hox)），Redux 这边从未被接入。`app/sidebarOpened` 也是历史遗留，侧边栏开合由组件局部 state 管理。

---

### 3.2 `component` slice（[src/store/modules/component.ts](src/store/modules/component.ts)）

| Action | 调用点 | 状态 |
| --- | --- | --- |
| `component/mode` | [DesignerContent.tsx#L156](src/designer/DesignerContent.tsx#L156)、[renderer/designer-parser/index.jsx#L75](src/designer/renderer/designer-parser/index.jsx#L75) | ✅ 使用 |
| `component/selected` | 13 处（layers-tree、canvas-graph、DropContainer、search-layer 等） | ✅ 高频使用 |
| `component/fieldType` | 无 dispatch（仅 [exports.ts](src/store/exports.ts) 中声明） | ❌ 死代码 |
| `component/querys` | [DesignerContent.tsx#L157](src/designer/DesignerContent.tsx#L157)、[Viewer.jsx#L104](src/pages/preview/large-screen/Viewer.jsx#L104)（通过 `componentActions.querys`） | ✅ 使用 |
| `component/dependencies` | 唯一调用方 `packages/base/iframe/custom.js` 是死代码组件（3 处调用全在死代码内） | ❌ 死代码（自产自销型，已清理） |
| `component/interactions`（= `InteractionPlugin.ACTION_INTERACTION`） | [plugins/interaction/component/hooks.ts#L171](src/plugins/interaction/component/hooks.ts#L171) | ✅ 使用 |
| `component/drilldown` | 无 dispatch（仅 [exports.ts](src/store/exports.ts) 中声明） | ❌ 死代码 |
| `component/api` | 无 dispatch（仅 [exports.ts](src/store/exports.ts) 中声明） | ❌ 死代码 |
| `component/dataSetList`（= `DataFetcherPlugin.GlobalDataSet.ACTION_DATASET_LIST`） | [GlobalDataSet.ts#L57](src/plugins/data-fetcher/GlobalDataSet.ts#L57)、[#L74](src/plugins/data-fetcher/GlobalDataSet.ts#L74)、[#L89](src/plugins/data-fetcher/GlobalDataSet.ts#L89)、[#L98](src/plugins/data-fetcher/GlobalDataSet.ts#L98) | ✅ 使用 |
| `component/globalResponse`（= `DataFetcherPlugin.GlobalFetcher.ACTION_GLOBAL_RESPONSE`） | [GlobalDataFetcher.ts#L107](src/plugins/data-fetcher/GlobalDataFetcher.ts#L107)、[#L284](src/plugins/data-fetcher/GlobalDataFetcher.ts#L284) | ✅ 使用 |
| `component/realtimeDataFlow`（= `DataFetcherPlugin.RealtimeDataFlow.ACTION_TYPE`） | [RealtimeDataFlow.ts#L24](src/plugins/data-fetcher/RealtimeDataFlow.ts#L24) | ✅ 使用 |
| `component/resetState` | [app/container/index.tsx#L134](src/app/container/index.tsx#L134) | ✅ 使用 |

**死代码 action：3 个**
- `component/fieldType`、`component/drilldown`、`component/api`

> 备注：这 3 个 action 在 [exports.ts](src/store/exports.ts) 的 `componentActions` 常量里有声明，但没有任何文件引用 `componentActions.fieldType` / `componentActions.drilldown` / `componentActions.api`。疑似为未来功能预留，但从未启用。

---

### 3.3 `form` slice（[src/store/modules/form.ts](src/store/modules/form.ts)）

| Action | 调用点 | 状态 |
| --- | --- | --- |
| `form/dependencies` | 无 | ❌ 死代码 |
| `form/conditions` | 无 | ❌ 死代码 |
| `form/parmas`（疑似 typo of `params`） | 无 | ❌ 死代码 |
| `form/resetState` | 无 | ❌ 死代码 |

**死代码 action：4 个（整个 slice 都是死代码）**

**useSelector 验证**：搜索 `state.form` / `state\.form` 在 `src/` 全代码中**零命中**。

> 备注：整个 `form` slice 从未被 dispatch，也从未被 `useSelector` 读取。可能是历史遗留代码，已被 Formily 表单方案（见 [src/formily/](src/formily)）取代。**建议整个 slice 删除**。

---

### 3.4 `tab` slice（[src/store/modules/tab.ts](src/store/modules/tab.ts)）

| Action | 调用点 | 状态 |
| --- | --- | --- |
| `tab/tabStore` | [packages/container/tabs/table.js#L60](src/packages/container/tabs/index.js#L60)、[packages/container/tabs/index.js#L22](src/packages/container/tabs/index.js#L22) | ✅ 使用 |
| `tab/tabBind` | **🔴 发现 bug**：调用方写的是 `tab/bind`，不是 `tab/tabBind`！见 [packages/container/tabs/index.js#L21](src/packages/container/tabs/index.js#L21)、[#L53](src/packages/container/tabs/index.js#L53) | ❌ 死代码（且调用方有 typo） |
| `tab/resetState` | 无 | ❌ 死代码 |

**死代码 action：2 个** + **1 个 typo bug**

#### 🐛 Bug 详情：`tab/bind` vs `tab/tabBind`

reducer 声明的 action type 是 `tab/tabBind`，但调用方 dispatch 的是 `tab/bind`：

```js
// src/packages/container/tabs/index.js
dispatch({ type: 'tab/bind', data: [] });        // ← 实际调用（永远命中 default 分支）
// ...
type: 'tab/bind',                                 // ← 实际调用（永远命中 default 分支）
```

```ts
// src/store/modules/tab.ts
case 'tab/tabBind':                               // ← reducer 声明（永远不会被命中）
    return { ...state, tabBind: action.data };
```

**后果**：`tabBind` 字段从未被 reducer 更新，调用方 dispatch 的数据被静默丢弃。

**useSelector 验证**：`state.tab.tabStore` 被读取（2 处：[table.js#L184](src/packages/container/tabs/table.js#L184)、[index.js#L132](src/packages/container/tabs/index.js#L132)），但 `state.tab.tabBind` 从未被读取。

> **结论**：`tabBind` 字段从写入端到读取端全链路都是死代码，且伴随 typo bug。

---

## 4. componentActions 常量使用情况（[src/store/exports.ts](src/store/exports.ts)）

`exports.ts` 中声明了 10 个 `componentActions.*` 常量，实际使用情况：

| 常量 | 实际值 | 是否被引用 |
| --- | --- | --- |
| `componentActions.mode` | `'component/mode'` | ❌（dispatch 时用字符串字面量） |
| `componentActions.selected` | `'component/selected'` | ❌（dispatch 时用字符串字面量） |
| `componentActions.fieldType` | `'component/fieldType'` | ❌ |
| `componentActions.querys` | `'component/querys'` | ✅ [Viewer.jsx#L104](src/pages/preview/large-screen/Viewer.jsx#L104) |
| `componentActions.dependencies` | `'component/dependencies'` | ❌ |
| `componentActions.interactions` | `'component/interactions'` | ❌ |
| `componentActions.drilldown` | `'component/drilldown'` | ❌ |
| `componentActions.api` | `'component/api'` | ❌ |
| `componentActions.dataSetList` | `'component/dataSetList'` | ❌ |
| `componentActions.resetState` | `'component/resetState'` | ❌ |

**10 个常量只用了 1 个**（`componentActions.querys`）。其他 9 个都是死代码。

> 备注：其他 dispatch 调用点直接用字符串字面量 `'component/selected'` 等，没有走 `componentActions` 常量。这导致 `componentActions` 常量大部分是"无效抽象"。

---

## 5. 清理建议

### 5.1 可安全删除的死代码（不影响运行时行为）

| 类别 | 项目 | 文件 |
| --- | --- | --- |
| app 死代码 action | `app/accessToken`、`app/refreshToken`、`app/routes`、`app/userInfo`、`app/routerPath`、`app/layouts`、`app/sidebarOpened` | [app.ts](src/store/modules/app.ts) |
| app 死代码字段 | `accessToken`、`refreshToken`、`routes`、`userInfo`、`routerPath`、`layouts`、`sidebarOpened`、`topToolbarHiddenList`（合并到 `toolbarHiddenList`） | [app.ts](src/store/modules/app.ts) interface |
| component 死代码 action | `component/fieldType`、`component/drilldown`、`component/api` | [component.ts](src/store/modules/component.ts) |
| component 死代码字段 | `fieldType`、`drilldown`、`api` | [component.ts](src/store/modules/component.ts) interface |
| form 整个 slice | `form` reducer + state | [form.ts](src/store/modules/form.ts)、[modules/index.ts](src/store/modules/index.ts) |
| tab 死代码 action | `tab/tabBind`、`tab/resetState` | [tab.ts](src/store/modules/tab.ts) |
| tab 死代码字段 | `tabBind` | [tab.ts](src/store/modules/tab.ts) interface |
| exports 死代码常量 | `componentActions` 中除 `querys` 外的 9 个 | [exports.ts](src/store/exports.ts) |

### 5.2 需要用户决策的项

| 项目 | 选项 A | 选项 B |
| --- | --- | --- |
| `tab/bind` typo bug | 修 reducer：`tab/tabBind` → `tab/bind`（对齐调用方） | 修调用方：`tab/bind` → `tab/tabBind`（对齐 reducer） |
| `topToolbarHiddenList` 命名不一致 | 修 reducer：统一为 `toolbarHiddenList`（需同步修调用方） | 保留现状（双字段） |
| `form/parmas` typo | 删除整个 slice（推荐，反正没人用） | 保留并修 typo 为 `params` |

### 5.3 不建议清理的项

- `app/resetState` / `component/resetState` / `tab/resetState`：即使 `form/resetState` 和 `tab/resetState` 没被调用，也建议保留作为生命周期兜底（未来可能用到）

---

## 6. 清理后预期效果

- 删除 16 个死代码 action case
- 删除 `form` slice 整个文件
- `exports.ts` 的 `componentActions` 从 10 个减到 1 个（或全部删除改为直接用字符串）
- 修复 1 个 typo bug（`tab/bind` vs `tab/tabBind`）
- 统一 1 个字段命名（`topToolbarHiddenList` → `toolbarHiddenList`）
- Redux store 的初始化 state 体积减小（移除 11 个无用字段）

---

## 7. 风险评估

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| 有动态拼接的 action type 未被发现 | 低 | 已搜索 `componentActions.*` 与字符串字面量两种模式 |
| 外部微应用 dispatch 了被删的 action | 低 | 项目内 action type 不对外暴露（非 lib 导出） |
| `form` slice 被某个未搜索到的路径读取 | 低 | 已搜索 `state.form` 零命中 |
| 删除 `tabBind` 字段后调用方报错 | 低 | 调用方 dispatch 的数据本来就被丢弃，删除字段不影响行为 |

整体风险**低**，清理是安全的。