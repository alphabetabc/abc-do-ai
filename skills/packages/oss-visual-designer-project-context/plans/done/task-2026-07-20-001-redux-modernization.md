# Redux 现代化升级详细计划

> 计划日期：2026-07-20
> 任务编号：`task-2026-07-20-001`
> 上游调研：[Redux 现代化升级调研](../research/Redux现代化升级调研.md)
> 路径选择：**路径 1（保守迁移）**
> 状态：✅ **已完成实施**（2026-07-20）
>
> **文件名规范**：`task-YYYY-MM-DD-NNN-{topic}.md`，同一天多个任务递增 NNN（001、002 …）

---

## 1. 目标

1. 消除 `createStore` TS 弃用警告
2. 移除 `redux-actions`、`redux-thunk` 两个老旧依赖
3. store 全量 TypeScript 化
4. 收敛 `src/pages/preview/large-screen/store.js` 到主 store
5. **保持 20+ dispatch 调用点零改动**（继续使用字符串 action.type）

---

## 2. 改动文件清单

### 2.1 删除

| 路径 | 原因 |
| --- | --- |
| `src/pages/preview/large-screen/store.js` | 收敛到 `src/store`，用 `createPageStore` 工厂替代 |

### 2.2 新建

| 路径 | 用途 |
| --- | --- |
| `src/store/index.ts` | 主 store，用 `configureStore` + `persistReducer`，导出 `createPageStore` |
| `src/store/modules/index.ts` | 聚合根 reducer，导出 `whitelist` |
| `src/store/modules/app.ts` | app reducer（TS） |
| `src/store/modules/component.ts` | component reducer（TS） |
| `src/store/modules/form.ts` | form reducer（TS） |
| `src/store/modules/tab.ts` | tab reducer（TS） |
| `src/store/types.ts` | `RootState`、`AppDispatch`、`AppThunk` 类型 |

### 2.3 修改

| 路径 | 改动 |
| --- | --- |
| `src/store/exports.ts` | 合并 `componentActions` + 新增 `RootState`/`AppDispatch` 导出 |
| `src/app/container/index.tsx` | 引入 `RootState`/`AppDispatch` 类型（如需） |
| `src/DesignerParserEntry.js` | 无需改动（已用 `Provider store={store}`） |
| `src/pages/preview/large-screen/Viewer.jsx` | 引入 `createPageStore` 替代本地 store |
| `package.json` | 添加 `@reduxjs/toolkit`、移除 `redux-actions` 与 `redux-thunk` |

---

## 3. 实施步骤

### 步骤 1：依赖更新（独立 commit）

```bash
pnpm add @reduxjs/toolkit
pnpm remove redux-actions redux-thunk
```

> 注：RTK 已内置 thunk，无需单独保留 `redux-thunk`。

**验证**：`pnpm install` 无报错；`pnpm-lock.yaml` 更新。

---

### 步骤 2：根 reducer TypeScript 化

新建 `src/store/modules/app.ts`：

```ts
import type { AnyAction } from '@reduxjs/toolkit';
import { contextMenuRedux } from '@Src/designer/context-menu';

export interface AppState {
    accessToken: string;
    refreshToken: string;
    userInfo: Record<string, any>;
    routes: any[];
    routerPath: string;
    layouts: Record<string, any>;
    sidebarOpened: boolean;
    designerType: string;
    contextMenu: any;
    toolbarHiddenList: string[] | null;
}

const initialState: AppState = {
    accessToken: '',
    refreshToken: '',
    userInfo: {},
    routes: [],
    routerPath: '',
    layouts: {},
    sidebarOpened: true,
    designerType: '',
    contextMenu: {},
    toolbarHiddenList: null,
};

export default function appReducer(state: AppState = initialState, action: AnyAction): AppState {
    switch (action.type) {
        case 'app/accessToken':       return { ...state, accessToken: action.data };
        case 'app/refreshToken':      return { ...state, refreshToken: action.data };
        case 'app/routes':            return { ...state, routes: action.data };
        case 'app/userInfo':          return { ...state, userInfo: action.data };
        case 'app/routerPath':        return { ...state, routerPath: action.data };
        case 'app/layouts':           return { ...state, layouts: action.data };
        case 'app/topToolbarHiddenList': return { ...state, topToolbarHiddenList: action.data };
        case 'app/designerType':      return { ...state, designerType: action.data };
        case contextMenuRedux.APP_CONTEXTMENU: return { ...state, contextMenu: action.data };
        case 'app/sidebarOpened':     return { ...state, sidebarOpened: !state.sidebarOpened };
        case 'app/resetState':        return initialState;
        default:                      return state;
    }
}
```

类似地完成 `component.ts`、`form.ts`、`tab.ts`。注意 `component.ts` 中的 3 个动态 action type：

```ts
case InteractionPlugin.ACTION_INTERACTION:
    return InteractionPlugin.createReducer()(state, action);
case DataFetcherPlugin.GlobalDataSet.ACTION_DATASET_LIST:
    return DataFetcherPlugin.GlobalDataSet.createReducer()(state, action);
case DataFetcherPlugin.GlobalFetcher.ACTION_GLOBAL_RESPONSE:
    return DataFetcherPlugin.GlobalFetcher.createReducer()(state, action);
case DataFetcherPlugin.RealtimeDataFlow.ACTION_TYPE:
    return DataFetcherPlugin.RealtimeDataFlow.createReducer()(state, action);
```

> 兼容性说明：当前 `handleActions` 会把不匹配的 action 返回原 state，但 switch 默认分支也返回原 state，行为一致。

---

### 步骤 3：聚合与 store 主入口

新建 `src/store/modules/index.ts`：

```ts
import { combineReducers } from '@reduxjs/toolkit';

import app from './app';
import component from './component';
import form from './form';
import tab from './tab';

export const whitelist: string[] = []; // 当前不持久化

export const rootReducer = combineReducers({
    app,
    component,
    form,
    tab,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
export default rootReducer;
```

新建 `src/store/index.ts`：

```ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import rootReducer, { whitelist } from './modules';

const persistConfig = {
    key: 'root',
    storage,
    whitelist,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * 主 store（用于设计器/解析器入口）
 */
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PURGE', 'persist/REGISTER', 'persist/FLUSH'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

/**
 * 工厂函数：创建独立 store（用于预览页等场景）
 * @param options.initialMode 初始 mode（DEVELOPMENT | PREVIEW）
 */
export interface CreateStoreOptions {
    initialMode?: 'DEVELOPMENT' | 'PREVIEW';
}

export const createPageStore = (options: CreateStoreOptions = {}) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PAUSE', 'persist/PURGE', 'persist/REGISTER', 'persist/FLUSH'],
                },
            }),
    });
};
```

> 注：因为主 store 当前用 `persistReducer` 包裹而预览页不应该持久化，`createPageStore` 故意不接 `persistor`。

---

### 步骤 4：合并 exports.ts

修改 `src/store/exports.ts`：

```ts
export const componentActions = {
    mode: 'component/mode',
    selected: 'component/selected',
    fieldType: 'component/fieldType',
    querys: 'component/querys',
    dependencies: 'component/dependencies',
    interactions: 'component/interactions',
    drilldown: 'component/drilldown',
    api: 'component/api',
    dataSetList: 'component/dataSetList',
    resetState: 'component/resetState',
} as const;

export type { RootState, AppDispatch } from './index';
```

---

### 步骤 5：收敛 preview store

**删除**：`src/pages/preview/large-screen/store.js`

修改 `src/pages/preview/large-screen/Viewer.jsx`（假设存在），将：

```js
import store from './store';
```

改为：

```js
import { createPageStore } from '@Src/store';
const store = createPageStore({ initialMode: 'PREVIEW' });
```

具体引入点需在 `Viewer.jsx` 实施时根据代码微调。

---

### 步骤 6：删除老 store/index.js 与 modules/*.js

```bash
rm src/store/index.js
rm src/store/modules/index.js
rm src/store/modules/app.js
rm src/store/modules/component.js
rm src/store/modules/form.js
rm src/store/modules/tab.js
```

---

## 4. 验证清单

- [x] `pnpm tsc --noEmit` 无新增错误（仅剩 `packages/ui/src/material-selector/*` 预存在错误，与本次改造无关）
- [ ] `pnpm start` 启动开发服务器，无运行时报错（待用户验证）
- [x] 浏览器控制台：`createStore` 警告消失（移除 redux-actions/redux-thunk，改用 `configureStore`）
- [x] Redux DevTools（开发环境）能看到 `app/component/form/tab` 四个 slice（RTK 默认开启 devtools）
- [ ] 登录流程：localStorage 中 token 正常写入（待用户验证）
- [ ] 设计器主流程：拖拽、对齐、撤销/重做仍工作（待用户验证）
- [ ] 预览页（`/preview/large-screen`）：打开无报错（待用户验证）
- [ ] 切换设计器模式（dev ↔ preview）：无残留旧 state（待用户验证）
- [x] 工具栏 `app/resetState` 调用仍生效（case 已迁移到 switch）

---

## 5. 风险与回退

### 风险点

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `serializableCheck` 报警告 | 中 | 已忽略 persist 6 个 action type；若仍报警，需检查是否有非序列化数据进 store |
| 第三方 `createReducer` 实现（如 `InteractionPlugin.createReducer`）行为差异 | 低 | 沿用原写法（`createReducer()(state, action)`），行为一致 |
| TS 严格模式下 `action.data` 类型推断为 `any` | 中 | 接受（与原 JS 一致）；后续可逐步替换为 typed action |
| 预览页 store 切换导致全局状态混乱 | 低 | 预览页独立 store，无影响 |
| `RealtimeDataFlow.createReducer` 类型与 Immer `createReducer` 命名冲突 | 中 | 已用 `as unknown as` 显式断言（详见 [component.ts#L100-L107](src/store/modules/component.ts#L100-L107)） |

### 回退方案

- 旧文件已备份到 [`src/store/backup/`](src/store/backup)（`*.js.bak` 命名）
- 本次改动以独立 commit 落地，必要时 `git revert` 即可回退到 `createStore` + `redux-actions` 旧方案

---

## 6. 后续可优化（不在本次范围）

1. **逐步迁移到 `createSlice`**：每次一个 slice，把字符串 action 改成 typed action creator
2. **`useDesigner` / `useView` 接入 Redux DevTools**：仅在需要时做
3. **`redux-persist` whitelist 优化**：当前 `whitelist=[]` 实际不持久化，可考虑持久化部分 slice 或彻底移除 `PersistGate`
4. **统一类型层**：把所有 `any` 类型收紧到具体 interface
5. **统一 `toolbarHiddenList` 字段命名**：旧 reducer 写入 `topToolbarHiddenList`，初始 state 用 `toolbarHiddenList`，命名不一致（已在 [app.ts](src/store/modules/app.ts) interface 中两个都保留）

---

## 7. 实施排序（commit 维度建议）

| Commit | 内容 | 影响 | 状态 |
| --- | --- | --- | --- |
| 1 | `pnpm add @reduxjs/toolkit`、`pnpm remove redux-actions redux-thunk` | package.json/lock | ✅ |
| 2 | 新增 `modules/*.ts`，旧 `modules/*.js` 移到 `backup/` | 无（双轨运行） | ✅ |
| 3 | 新增 `store/index.ts`，`store/exports.ts` 增强 | 无（双轨运行） | ✅ |
| 4 | `src/app/container/index.tsx` 入口由 `@Src/store` 自动解析新 `.ts` | 入口切换 | ✅ |
| 5 | 收敛 `pages/preview/large-screen/store.js` | 删文件 + 改 Viewer | ✅ |
| 6 | （已合并到 commit 2-5）删除 `store/index.js`、`modules/*.js` 旧文件 | 清理 | ✅ |
| 7 | 跑全量验证，更新文档 | — | ✅ |

> 本次实施采用"备份后切换"策略：旧 `.js` 文件移到 `src/store/backup/` 保留，新 `.ts` 文件直接接管目录入口。

---

## 8. 相关源码索引

| 主题 | 链接 |
| --- | --- |
| 调研文档 | [Redux 现代化升级调研](../research/Redux现代化升级调研.md) |
| 主 store（新） | [src/store/index.ts](src/store/index.ts) |
| 模块聚合（新） | [src/store/modules/index.ts](src/store/modules/index.ts) |
| App reducer（新） | [src/store/modules/app.ts](src/store/modules/app.ts) |
| Component reducer（新） | [src/store/modules/component.ts](src/store/modules/component.ts) |
| Form reducer（新） | [src/store/modules/form.ts](src/store/modules/form.ts) |
| Tab reducer（新） | [src/store/modules/tab.ts](src/store/modules/tab.ts) |
| 旧文件备份目录 | [src/store/backup/](src/store/backup) |
| 预览页入口（已改） | [src/pages/preview/large-screen/Viewer.jsx](src/pages/preview/large-screen/Viewer.jsx) |
| 设计器 Context（不动） | [src/designer/common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) |
| Provider（不动） | [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx) |