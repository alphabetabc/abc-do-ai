# Redux 现代化升级调研

> 调研时间：2026-07-20
> 调研范围：`src/store/**`、`src/pages/preview/large-screen/store.js`、全局 Redux / Context 用法
> 调研目标：① 是否将 `useDesigner` / `useView` 改造到 Redux；② 修复 `createStore` TS 弃用警告；③ `redux-actions` 是否可移除

---

## 1. 现状盘点

### 1.1 依赖版本（来自 `package.json`）

| 依赖 | 版本 | 状态 |
| --- | --- | --- |
| `redux` | `^4.0.5` | 老版本（4.2+ 已标记 `createStore` 为 `@deprecated`） |
| `redux-actions` | `^2.6.5` | 上游 v3.0.x 已 2 年未更新（2024-07-22），维护停滞 |
| `redux-persist` | `^6.0.0` | 与 RTK 兼容，需配合 `serializableCheck` 忽略持久化 action |
| `redux-thunk` | `^2.3.0` | RTK 内置 thunk，可移除 |
| `react-redux` | `^7.2.0` | 与 RTK 兼容 |
| `immer` | `^9.0.6` | 已在使用，RTK 内部依赖相同实现 |
| `@reduxjs/toolkit` | — | **未引入** |

### 1.2 store 结构

```
src/store/
├── index.js                 ← createStore + applyMiddleware(thunk)
├── exports.ts               ← componentActions（字符串字面量）
└── modules/
    ├── index.js             ← combineReducers + whitelist
    ├── app.js               ← handleActions，12 个 action
    ├── component.js         ← handleActions，10+ 个 action（含动态 action.type）
    ├── form.js              ← handleActions
    └── tab.js               ← handleActions
```

辅助 store：`src/pages/preview/large-screen/store.js`（独立 store，仅含 `component` reducer，预览模式专用）。

### 1.3 调用点统计

- `redux-actions` 引用：5 个文件（`modules/*` + `pages/preview/large-screen/store.js`）
- `createStore` 引用：2 个文件（`src/store/index.js`、`src/pages/preview/large-screen/store.js`）
- `dispatch({ type: 'app/...' })` / `dispatch({ type: 'component/...' })` 字符串派发：约 **20+ 文件**（详见后文索引）
- `useSelector` / `useDispatch` / `connect` 使用：约 **45 个文件**

---

## 2. 三个核心问题的调研结论

### 2.1 `useDesigner` / `useView` 是否需要 Redux 化

**结论（2026-07-20 初版，2026-07-20 修正）：**

- **`useDesigner`（components 树）**：保持 React Context 方案，**不迁移**。
- **`useView`（UI 状态）**：**迁移到独立的设计器私有 Redux store**（位于 `src/store/designer/`），详见 [task-2026-07-20-003](../plans/task-2026-07-20-003-designer-private-store.md)。

**修正理由：**

初版结论"暂不需要"存在两个误判，现已修正：

1. **误判 ① "跨页面共享不是诉求"**：实际调研发现设计器的两个入口（[src/index.js](src/index.js) 和 [src/DesignerParserEntry.js](src/DesignerParserEntry.js)）**都已经在 Redux Provider 内**，不存在"脱离 store 独自运行"的场景。
2. **误判 ② "Context 已够用"**：实际发现 `useSet` 实现存在严重性能问题——每次 `setView({ scale: 2 })` 都创建全新 view 对象，导致 `ViewStoreContext.Provider` 的 value 引用变化，**12 个消费者全部重渲染**。Context 没有字段级订阅机制，而 Redux 的 `useSelector` 有引用对比，能精确做到字段级订阅。

**`useDesigner` 仍保持 Context 的理由（不变）：**

1. **高频写入 + 大对象**：`state.components` 是 440 节点级别的树，每次拖拽都更新。若走 Redux，每次 dispatch 都要 reducer 重新计算整棵树，性能不如 `produce` 直接写入 ref。
2. **无字段级订阅需求**：`components` 是整体消费的树结构，不像 `view` 是独立字段的扁平对象。

**`useView` 迁移到独立 store（而非主 store）的理由：**

1. **生命周期**：`view` 是设计器私有状态，设计器关闭时应完全销毁，不应常驻主 store
2. **不污染预览页**：预览页 store 不需要 `view`，独立 store 不会进预览页 rootReducer
3. **DevTools 隔离**：`view.scale` 每帧更新的高频 action 不会污染主 store 的 DevTools
4. **统一维护**：store 物理位置放在 `src/store/designer/`，与主 store 同根管理

**实施详情见 [task-2026-07-20-003-designer-private-store](../plans/task-2026-07-20-003-designer-private-store.md)。**

### 2.2 `createStore` 弃用警告能否修复

**结论：可以修复，且推荐用 Redux Toolkit 的 `configureStore` 一并解决。**

**问题描述**：Redux 4.2.0 起 `createStore` 被标记为 `@deprecated`，是 TypeScript 视觉警告（删除线 + 跳转提示），运行时无错误，但视觉污染明显。当前两条调用点：

- [`src/store/index.js#L19`](src/store/index.js#L19)
- [`src/pages/preview/large-screen/store.js#L76-L80`](src/pages/preview/large-screen/store.js#L76-L80)

**三种修复方案**：

| 方案 | 改动量 | 收益 | 风险 |
| --- | --- | --- | --- |
| **A. 升级到 RTK（推荐）** | 中 | 类型化、DevTools 增强、自动 thunk、可移除 `redux-thunk` | 中（需测试） |
| B. `import { legacy_createStore as createStore } from 'redux'` | 极小 | 仅消除警告 | 零 |
| C. 不处理 | 0 | — | 视觉警告持续 |

**推荐方案 A**，理由：

- 同时解决 `redux-actions` 问题（见 §2.3）
- `redux-thunk` 不再需要（RTK 内置）
- `redux-persist` 与 RTK 兼容（[官方有完整方案](https://blog.logrocket.com/persist-state-redux-persist-redux-toolkit-react/)），只需在 `configureStore` 的 `middleware` 中 `serializableCheck.ignoredActions` 加上 `FLUSH/REHYDRATE/PAUSE/PERSIST/PURGE/REGISTER`
- 类型推导更准确：`RootState` / `AppDispatch` 可直接 `ReturnType<typeof store.getState>` 派生

### 2.3 `redux-actions` 是否可移除

**结论：可以且建议移除。**

**事实依据**：

- 上游 [`redux-utilities/redux-actions`](https://github.com/redux-utilities/redux-actions) 最后一次 release 是 2024-07-22（v3.0.3），维护频率已降至极低
- 在本项目中仅使用 `handleActions`，用于将 action.type 字符串映射到 reducer 函数，本质是 `switch (action.type)` 的语法糖
- 当前 5 个调用文件全部是简单的 `(state, action) => ({ ...state, key: action.data })` 模式，可直接迁移到原生 `switch`

**迁移示例**（以 `app.js` 为例）：

```js
// 旧
import { handleActions } from 'redux-actions';
export default handleActions({
    'app/accessToken': (state, action) => ({ ...state, accessToken: action.data }),
    // ...
}, initState);

// 新（推荐路径 1：原生 switch）
export default function appReducer(state = initState, action: AnyAction) {
    switch (action.type) {
        case 'app/accessToken': return { ...state, accessToken: action.data };
        // ...
    }
}

// 新（可选路径 2：createSlice，但需改 dispatch 点）
const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        accessToken: (state, action: PayloadAction<string>) => { state.accessToken = action.payload }
    }
});
```

路径 2 的代价：约 20+ 个 dispatch 点需从 `dispatch({ type: 'app/accessToken', data: x })` 改成 `dispatch(appActions.accessToken(x))`，改动面大。

---

## 3. `pages/preview/large-screen/store.js` 收敛分析

### 3.1 当前差异

| 字段 | 主 store (`src/store/modules/component.js`) | preview store |
| --- | --- | --- |
| `mode` 初始值 | `MODE.DEVELOPMENT` | `MODE.PREVIEW` |
| `selected` 初始值 | `ROOT_UNIQUE_ID` (`'-'`) | `'-'` |
| `realtimeDataFlow` | `{}` | 无此字段 |
| 其他 9 个字段 | 一致 | 一致 |

### 3.2 收敛方案

在 `src/store/index.ts` 暴露工厂函数：

```ts
export interface CreateStoreOptions {
    initialMode?: 'DEVELOPMENT' | 'PREVIEW';
}

export const createPageStore = (opts?: CreateStoreOptions) =>
    configureStore({
        reducer: rootReducer,
        preloadedState: opts?.initialMode
            ? { component: { ...componentInitState, mode: opts.initialMode } }
            : undefined,
    });
```

`pages/preview/large-screen/Viewer.jsx` 改为：

```ts
import { createPageStore } from '@Src/store';
const store = createPageStore({ initialMode: 'PREVIEW' });
```

效果：
- 删除 `pages/preview/large-screen/store.js`
- `component` reducer 不再需要两份
- 后续 `component` 字段调整时只需改一处

---

## 4. Redux 调用点索引（供迁移期参考）

### 4.1 `app/` action 派发

- [`src/app/container/index.tsx#L133`](src/app/container/index.tsx#L133) `app/resetState`
- [`src/initialize/index.js`](src/initialize/index.js) `app/*` (loginInfo 等)

### 4.2 `component/` action 派发（精选）

- [`src/designer/DesignerContent.tsx#L155-L157`](src/designer/DesignerContent.tsx#L155-L157) `component/mode`、`component/querys`
- [`src/designer/canvas-graph/index.tsx`](src/designer/canvas-graph/index.tsx) 多处
- [`src/designer/toolbar/index.js`](src/designer/toolbar/index.js)
- [`src/designer/renderer/designer-field/index.tsx`](src/designer/renderer/designer-field/index.tsx)
- [`src/designer/context-menu/DesignerContextMenu.tsx`](src/designer/context-menu/DesignerContextMenu.tsx)
- [`src/designer/canvas-graph/components/search-layer.tsx`](src/designer/canvas-graph/components/search-layer.tsx)
- [`src/designer/aside-panel/layers-tree/tree/index.tsx`](src/designer/aside-panel/layers-tree/tree/index.tsx)
- [`src/packages/container/tabs/table.js`](src/packages/container/tabs/table.js)
- [`src/packages/container/tabs/index.js`](src/packages/container/tabs/index.js)
- [`src/packages/base/iframe/custom.js`](src/packages/base/iframe/custom.js)
- [`src/pages/designer-page/*`](src/pages/designer-page/large-screen/index.tsx)（4 个页面）

### 4.3 `form/` / `tab/` action 派发

- 待扫描（form/tab 当前使用频率较低）

---

## 5. 推荐路径

**路径 1（保守迁移，推荐）**：
1. 引入 `@reduxjs/toolkit`
2. `store/index.js` → `store/index.ts`（用 `configureStore` + `persistReducer`）
3. `modules/*.js` → `modules/*.ts`（保持字符串 action.type，改用原生 `switch` 函数 reducer）
4. 暴露 `createPageStore()` 工厂函数，删除 `pages/preview/large-screen/store.js`
5. 移除 `redux-actions`、`redux-thunk`
6. `exports.ts` 增加 `RootState` / `AppDispatch` 类型导出

**路径 2（完整 createSlice，备选）**：
在路径 1 基础上，把 `switch` 改成 `createSlice`，并同步改造 20+ dispatch 调用点。

---

## 6. 关键源码索引

| 主题 | 文件 |
| --- | --- |
| Store 主入口 | [store/index.js](src/store/index.js) |
| Reducers 聚合 | [store/modules/index.js](src/store/modules/index.js) |
| App reducer | [store/modules/app.js](src/store/modules/app.js) |
| Component reducer | [store/modules/component.js](src/store/modules/component.js) |
| Actions 导出 | [store/exports.ts](src/store/exports.ts) |
| 设计器 Context | [designer/common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) |
| Context Provider | [designer/DataProvider.tsx](src/designer/DataProvider.tsx) |
| 主入口 Provider | [app/container/index.tsx](src/app/container/index.tsx) |
| 解析器入口 | [DesignerParserEntry.js](src/DesignerParserEntry.js) |
| 预览 store（待收敛） | [pages/preview/large-screen/store.js](src/pages/preview/large-screen/store.js) |

---

## 7. 参考资料

- [Redux Toolkit - configureStore](https://redux-toolkit.js.org/api/configureStore)
- [Redux Toolkit - Usage Guide](https://redux-toolkit.js.org/usage/usage-guide)
- [Redux - createStore deprecated](https://redux.js.org/api/createstore)
- [redux-persist + RTK 整合](https://blog.logrocket.com/persist-state-redux-persist-redux-toolkit-react/)
- [redux-actions npm](https://www.npmjs.com/package/redux-actions)（维护停滞）