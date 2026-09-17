# 设计器 view 状态合并到主 store（修复嵌套 Provider 回归）

> 计划日期：2026-07-20
> 任务编号：`task-2026-07-20-005`
> 上游任务：[task-2026-07-20-003-designer-private-store](./done/task-2026-07-20-003-designer-private-store.md)、[task-2026-07-20-004-useview-call-sites-cleanup](./done/task-2026-07-20-004-useview-call-sites-cleanup.md)
> 状态：`done`
> 类型：`refactor`
> Research 报告：[useView调用点字段审计](../research/useView调用点字段审计.md)、[Redux现代化升级调研](../research/Redux现代化升级调研.md)

---

## 1. 背景

### 1.1 当前 bug

[canvas-graph/index.tsx#L109](src/designer/canvas-graph/index.tsx#L109) 在运行时抛错：

```ts
const selected = useSelector((fullState) => fullState.component.selected);
// TypeError: Cannot read properties of undefined (reading 'selected')
```

实际不止这一处 read 错——**所有在 `DesignerStoreProvider` 子树内的 `useSelector` 与 `useDispatch` 全部指向了设计器私有 store**，导致：

- `useSelector(s => s.component.selected)` 返回 `undefined`（设计器 store 没有 `component` slice）
- `useSelector(s => s.app.xxx)` 返回 `undefined`（设计器 store 没有 `app` slice）
- `useDispatch` 返回的是设计器 store 的 dispatch，`dispatch({ type: 'component/selected' })` 静默失效（设计器 store 的 reducer 不处理该 action）

**根本原因**：[task-003](./done/task-2026-07-20-003-designer-private-store.md) 把 `useView` 迁到了独立的 Redux store，并由 [DesignerContent.tsx#L367](src/designer/DesignerContent.tsx#L367) 用 `<DesignerStoreProvider>` 包裹子树。在 react-redux 7.x 里，嵌套 `<Provider>` 会让内层 Provider 接管 `useSelector`/`useDispatch` 的解析（`useSelector` 总是读取最近 Provider 的 store），**外层主 store 的 `component` / `app` slice 对内层组件不可见**。

### 1.2 影响面盘点

`DesignerContent` 渲染的全部子组件都在 `DesignerStoreProvider` 内，共 12 个文件受影响：

| 文件 | 错的 `useSelector` 行 | 错的 `useDispatch` 行 |
| --- | --- | --- |
| [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) | L109 | L110, L423, L436, L460 |
| [configuration-panel/index.js](src/designer/configuration-panel/index.js) | L23 | — |
| [renderer/hooks/useDebounceMergeConfig.tsx](src/designer/renderer/hooks/useDebounceMergeConfig.tsx) | L22 | — |
| [renderer/designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) | L66-75（读 `component` + `app`），L78（`useStore` 也拿错），L117（`store.getState().component.selected`） | L77, L152 |
| [toolbar/index.js](src/designer/toolbar/index.js) | L55（读 `app.topToolbarHiddenList` / `app.designerType`） | L84 |
| [aside-panel/materials/index.tsx](src/designer/aside-panel/materials/index.tsx) | L27（读 `app.designerType`） | — |
| [context-menu/ContextMenuModal.tsx](src/designer/context-menu/ContextMenuModal.tsx) | — | L29 |
| [context-menu/DesignerContextMenu.tsx](src/designer/context-menu/DesignerContextMenu.tsx) | — | L127, L219, L286, L304 |
| [canvas-graph/components/search-layer.tsx](src/designer/canvas-graph/components/search-layer.tsx) | — | L10, L14 |
| [data-query/InitDataQuery/index.tsx](src/designer/data-query/InitDataQuery/index.tsx) | — | L52 |
| [common/dnd/DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx) | — | L21, L78 |
| [aside-panel/layers-tree/tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx) | — | L31, L79, L96 |

**用户可见后果**：

- 拖拽/选中/对齐/删除等所有"写 `component/selected`"的交互静默失效（dispatch 走到设计器 store，reducer 不处理）
- 模态框的"设置/编辑"操作不更新右侧配置面板
- 工具栏/素材面板读 `app.designerType` 拿到 `undefined`，导致条件渲染错位
- 画布选中态、画布工具栏缩放等 read 路径抛 `TypeError` 直接挂掉

### 1.3 备选方案评估

| 方案 | 评价 |
| --- | --- |
| **A. 把 view 合并到主 store**（推荐） | 1 处 slice 集成 + 删除 `DesignerStoreProvider`；所有 `useSelector`/`useDispatch` 立刻统一指向主 store；副作用：view 状态在 designer 关闭再开后保留（**这是 UI 状态，保留可接受**） |
| B. 写 `useMainStoreSelector` / `useMainDispatch` 绕过 Provider | 不动架构，但要改 12+ 文件的 `useSelector`/`useDispatch`；每加一个新组件都得记得用新 hook，容易遗漏；regression 风险高 |
| C. 升级 react-redux 到 8+ 启用 `useSelector(selector, eq, { context })` | 跨大版本升级，react-redux 8 要 React 18+；本项目 React 17.0.2，升级链太深，**单独修这个 bug 不值得** |

选 **A**。

## 2. 目标

1. 把 `viewCanvas` + `viewUI` 合并到主 store，作为两个新的 top-level slice（`viewCanvas` / `viewUI`）
2. 删除 `src/store/designer/index.tsx` 的 `DesignerStoreProvider` 及其工厂函数
3. `src/store/designer/hooks.ts` 改用主 store 的 `RootState`（`useSelector` 不变，仅类型/路径变化）
4. `useView` / `useSetView` API 保持不变，调用方零改动
5. `updateView` 跨 slice action 保留（同时更新 `viewCanvas` + `viewUI`）
6. `settingCollapsed` 初始值由 `DesignerContent` 在 mount 时从 `useEnvironmentModel` 读取后 dispatch
7. `pnpm tsc --noEmit` 零新增错误；`pnpm start` 启动后画布/选中/工具栏全部正常工作
8. AGENTS.md §3.2 移除"设计器私有 store"表述，改为"主 store 的 viewCanvas / viewUI slice"

## 3. 关键设计决策

### 3.1 合并为两个 top-level slice，不引入嵌套

```ts
// src/store/modules/index.ts
export const rootReducer = combineReducers({
    app,
    component,
    viewCanvas,  // 新增
    viewUI,      // 新增
});
```

**理由**：

- `viewCanvas` 和 `viewUI` 已经在 [src/store/designer/modules/index.ts#L11-14](src/store/designer/modules/index.ts#L11) 通过 `combineReducers` 组合，迁到主 store 时只是把 `combineReducers` 上移一层
- 保持 `useViewScale` 等 16 个细粒度 hook 的 selector 路径不变（`s => s.viewCanvas.scale`），**调用方零改动**
- 字段归属清晰：`scale/lines/...` 在 `viewCanvas`，`*Collapsed/visible/...` 在 `viewUI`
- `updateView` 跨 slice action 已有 `extraReducers` 监听机制，迁过来无需改 action 定义

### 3.2 `updateView` action 保留

[src/store/designer/modules/view-actions.ts](src/store/designer/modules/view-actions.ts) 的 `updateView` 跨 slice action 同时更新 `viewCanvas` + `viewUI`：

- `viewCanvas` 和 `viewUI` 的 `extraReducers` 已经监听 `updateView`
- 迁移到主 store 后，`updateView` 的 action 仍由两个 slice 各自处理，逻辑零改动
- `useSetView` / `useView` 内部仍 `dispatch(updateView(partial))` + `batch()`，调用方零感知

### 3.3 `settingCollapsed` 初始值注入

原 [DesignerStoreProvider](src/store/designer/index.tsx#L41-L48) 在 `useEnvironmentModel` 中读 `environment?.designerConfig?.settingCollapsed`，作为设计器 store 的 `preloadedState`。

合并到主 store 后，主 store 的 `preloadedState` 不能再按"打开 designer 时环境不同"动态注入（主 store 是全局单例）。改为：

- slice `initialState.settingCollapsed` 默认 `false`
- 在 [DesignerContent](src/designer/DesignerContent.tsx) 的 `useLayoutEffect`（或在 `useEffect` 里尽早执行）读取 `useEnvironmentModel().environment?.designerConfig?.settingCollapsed`，若为 `true` 则 `dispatch(updateView({ settingCollapsed: true }))`

**接受代价**：从 designer 第一次挂载到 `useLayoutEffect` 跑完前，`useViewSettingCollapsed()` 返回 `false`（默认值）。这个窗口期极短（毫秒级），不影响可见行为。如需更严格保证，可以在 `useLayoutEffect` 里同步读取 `useEnvironmentModel` 并 dispatch。

### 3.4 生命周期差异：view 状态跨 designer 打开/关闭保留

原设计器私有 store 在 `DesignerStoreProvider` 卸载时整个 store 被 GC，view 状态全清空。

合并到主 store 后，view 状态会随主 store 在页面生命周期内保留：

- 优点：用户切到别的页面再切回 designer，面板折叠状态、tabsKey 等保持，体验更连贯
- 缺点：极少数场景（如刷新主 store）需要主动重置 view
- 缓解：在 [DesignerContent](src/designer/DesignerContent.tsx) 卸载时 `dispatch(resetViewCanvas())` + `dispatch(resetViewUI())`（已有的 action），按需启用

**默认不启用自动重置**——view 状态保留是更友好的默认行为。如果后续需要"严格隔离"行为，再加一个开关。

### 3.5 兼容性

- `useView` / `useSetView` 签名零变化，**所有 8 个 `useSetView` 调用点和已迁的细粒度 hook 调用点零改动**
- `updateView` action 名字和 payload 类型零变化
- `viewCanvasInitialState` / `viewUIInitialState` 导出保留
- `viewCanvasState` / `viewUIState` 类型别名保留
- 仅改动：`DesignerStoreProvider` 移除、`src/store/designer/index.tsx` 简化为 hook barrel、`hooks.ts` 中 `DesignerRootState` 改为从 `RootState` 取对应字段

## 4. 详细步骤

### 步骤 1：把 `view-canvas.ts` / `view-ui.ts` 搬到主 store modules

```bash
# 从设计器私有 store 移到主 store modules
mv src/store/designer/modules/view-canvas.ts src/store/modules/view-canvas.ts
mv src/store/designer/modules/view-ui.ts src/store/modules/view-ui.ts
mv src/store/designer/modules/view-actions.ts src/store/modules/view-actions.ts
```

**注意**：

- `view-canvas.ts` / `view-ui.ts` 内的 `import { updateView } from './view-actions'` 路径要改成 `'./view-actions'`（在同一目录，不变）
- 文件内容**完全不动**（slice name、reducer、extraReducers 都保持）

### 步骤 2：主 store 集成新 slice

修改 [src/store/modules/index.ts](src/store/modules/index.ts)：

```ts
import { combineReducers } from '@reduxjs/toolkit';

import app from './app';
import component from './component';
import viewCanvas, { viewCanvasInitialState } from './view-canvas';
import viewUI, { viewUIInitialState } from './view-ui';

export { updateView, type DesignerViewPayload } from './view-actions';
export type { ViewCanvasState, ViewUIState } from './view-canvas';
export { viewCanvasInitialState, viewUIInitialState };

/**
 * redux-persist 白名单：当前不持久化任何 slice
 */
export const whitelist: string[] = [];

export const rootReducer = combineReducers({
    app,
    component,
    viewCanvas,
    viewUI,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
export default rootReducer;
```

并把 `RootState` / `AppDispatch` 类型从 [src/store/index.ts](src/store/index.ts) 保持现有导出。

### 步骤 3：重写 `src/store/designer/` 为纯 hook barrel

`src/store/designer/index.tsx`：

- 删 `createDesignerStore` 工厂函数
- 删 `DesignerStoreProvider` 组件
- 文件改为只 re-export hooks（删除 JSX 元素后可改回 `.ts`）

```ts
// src/store/designer/index.ts
export {
    useView,
    useSetView,
    useViewScale,
    useViewLines,
    useViewStartX,
    useViewStartY,
    useViewRulerWidth,
    useViewRulerHeight,
    useViewCanvasWidth,
    useViewCanvasHeight,
    useViewTabsKey,
    useViewLayerCollapsed,
    useViewLayersTreeCollapsed,
    useViewMaterialsListCollapsed,
    useViewSettingCollapsed,
    useViewCanvasToolbarCollapsed,
    useViewVisible,
    useViewIsShowReferLine,
    updateView,
    type DesignerViewPayload,
} from '../modules';
```

`src/store/designer/hooks.ts`：

- `import { DesignerRootState }` 改为 `import type { RootReducerState } from '../modules'`
- 所有 `useSelector((s: DesignerRootState) => s.viewCanvas.xxx)` 改为 `useSelector((s: RootReducerState) => s.viewCanvas.xxx)`（路径不变）
- `useView` / `useSetView` 内 `dispatch(updateView(partial))` 不变（`updateView` 现在从主 store modules 来）

### 步骤 4：移除 `DesignerStoreProvider` 包裹

[src/designer/DesignerContent.tsx#L13](src/designer/DesignerContent.tsx#L13)：

```ts
// 改前
import { DesignerStoreProvider } from '@Src/store/designer';
// 改后
import { updateView } from '@Src/store/designer';
```

[src/designer/DesignerContent.tsx#L367-400](src/designer/DesignerContent.tsx#L367)：

- 删 `<DesignerStoreProvider>...</DesignerStoreProvider>` 这一对外层包裹
- 改用 `<>...</>` Fragment（因为现在没有 Provider 包裹）
- 把 `settingCollapsed` 初始值在 `useLayoutEffect` 中 dispatch 进去

新增的 effect 草图（插入到 `DesignerContent` 现有 `useEffect` 之前）：

```ts
useLayoutEffect(() => {
    // 从 environment 注入 settingCollapsed 初始值
    const initial = environment?.designerConfig?.settingCollapsed;
    if (initial !== undefined) {
        dispatch(updateView({ settingCollapsed: initial }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 步骤 5：清理对 `DesignerRootState` 类型的引用

[src/store/designer/hooks.ts](src/store/designer/hooks.ts) 中 `DesignerRootState` 类型别名移除，调用方如有引用统一改为 `RootReducerState`（grep 后确认无外部引用：上一轮 task-004 清理时已经全部走 `@Src/store/designer/hooks`，而 hooks 内部统一改造即可）。

### 步骤 6：删除 `designerRootReducer` 与 `DesignerStore` 类型

[src/store/designer/modules/index.ts](src/store/designer/modules/index.ts) 整个文件删除（slice 文件已搬到主 store，re-export 由主 store 的 `modules/index.ts` 接管）。

`DesignerStore` 类型（[src/store/designer/index.tsx#L53](src/store/designer/index.tsx#L53)）随 `createDesignerStore` 一并删除——无外部引用（仅 DesignerStoreProvider 内部用，Provider 也删除）。

### 步骤 7：验证

```bash
pnpm tsc --noEmit
pnpm start
```

冒烟测试（人工）：

- 打开设计器 → 选中组件 → 右侧配置面板更新（验证 `component/selected` 在 `DesignerStoreProvider` 子树内能正常 dispatch + 读取）
- 拖拽组件 → 对齐线 + 标尺 + 缩放响应（验证 `viewCanvas` 细粒度订阅）
- 切换 tab → `tabsKey` 切换正常
- 折叠左/右面板 → 状态正确
- 切换 designer 页面 → view 状态保留（如 `tabsKey` 仍是上次的值）
- React DevTools Profiler：拖拽时只有 `canvas-graph` + 受影响的 `designer-field` 重渲染，其他 12 个文件不重渲染

`grep` 校验：

- `grep "useSelector.*fullState\.component" src/designer` 应正常返回结果（说明 `useSelector` 能读主 store）
- `grep "DesignerStoreProvider" src/` 应返回 0 命中
- `grep "from '@Src/store/designer'" src/` 中文件 import 类型应该是 hook（`useView` / `useSetView` / `useViewXxx` / `updateView`），不再有 `DesignerStoreProvider`

## 5. 验证清单

- [x] `src/store/modules/view-canvas.ts` / `view-ui.ts` / `view-actions.ts` 已迁移
- [x] `src/store/modules/index.ts` 把 `viewCanvas` + `viewUI` 加入 `rootReducer`
- [x] `src/store/designer/index.tsx` 简化为 hook barrel
- [x] `src/store/designer/hooks.ts` 改用主 store 的 `RootReducerState`
- [x] `src/store/designer/modules/` 整个目录已删除
- [x] `src/designer/DesignerContent.tsx` 移除 `DesignerStoreProvider` 包裹
- [x] `DesignerContent` 用 `useLayoutEffect` 注入 `settingCollapsed` 初始值
- [x] `DesignerStore` / `DesignerStoreProvider` / `createDesignerStore` / `designerRootReducer` / `DesignerRootState` 全部删除，仓库内 0 引用
- [x] `pnpm tsc --noEmit` 零新增错误（`src/` 下零错误；预存的 `packages/ui` 10 个错误与本次任务无关）
- [ ] `pnpm start` 启动后画布/选中/工具栏全部正常 — **未跑 dev server，需人工验证**
- [ ] 12 个受影响文件中 `useSelector` 全部走主 store 解析 — 静态检查通过（grep 确认无 `DesignerStoreProvider` 残留），运行时验证需 `pnpm start` 启动后实际拖一下
- [ ] 12 个受影响文件中 `useDispatch` 全部走主 store 解析 — 同上
- [x] AGENTS.md §3.1 / §3.2 / §5.1 同步更新
- [x] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [x] 任务文件移到 `plans/done/`

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `settingCollapsed` 初始值在 effect 跑完前为 `false`，导致首帧配置面板错位 | 低 | 用 `useLayoutEffect`（DOM 提交前同步执行），窗口期压到 0；如还有问题可在 `DesignerContent` 顶层加 selector 兜底 |
| view 状态跨 designer 打开/关闭保留，导致用户困惑 | 极低 | UI 状态保留是更友好的默认；如需严格隔离，在 `DesignerContent` 卸载时 `dispatch(resetViewCanvas + resetViewUI)` |
| 主 store 增大（多 2 个 slice） | 0 | 字段少、对象小，无可观测影响 |
| `updateView` action 在主 store 中重名冲突 | 极低 | action type 是 `designerView/updateView`，namespace 化；与 `component/*` `app/*` 不冲突 |
| `designer-field/index.tsx` 的 `useStore<any>()` + `store.getState().component.selected` 写法需特别处理 | 中 | `useStore` 返回的也是最近 Provider 的 store，迁到主 store 后自动修复，无需改代码 |

### 回退方案

- 改造前 git commit 单独一次（便于 revert）
- 必要时 `git revert` 整个 commit 即可
- 不影响 task-001/002/003/004 已落地的 store 基础设施

## 7. 实施记录

- 2026-07-20：任务创建（task-005），状态 `planning`，针对 task-003 引入的嵌套 Provider 回归设计修复方案
- 2026-07-20：步骤 1 完成 — `view-canvas.ts` / `view-ui.ts` / `view-actions.ts` 从 `src/store/designer/modules/` 移到 `src/store/modules/`
- 2026-07-20：步骤 2 完成 — [src/store/modules/index.ts](src/store/modules/index.ts) 加入 `viewCanvas` / `viewUI` slice，导出 `updateView` / `resetViewCanvas` / `resetViewUI` / `ViewCanvasState` / `ViewUIState` / `DesignerViewPayload` 等
- 2026-07-20：步骤 3 完成 — [src/store/designer/index.tsx](src/store/designer/index.tsx) 重写为纯 hook barrel（hooks 从 `./hooks` re-export；actions/types 从 `../modules` re-export）
- 2026-07-20：步骤 4 完成 — [src/store/designer/hooks.ts](src/store/designer/hooks.ts) 改用主 store 的 `RootReducerState`；selector 路径（`s => s.viewCanvas.scale`）不变；`useView` / `useSetView` 签名不变，调用方零改动
- 2026-07-20：步骤 5 完成 — [src/designer/DesignerContent.tsx](src/designer/DesignerContent.tsx) 删除 `<DesignerStoreProvider>` 包裹，改为 Fragment；新增 `useLayoutEffect` 在 mount 时从 `useEnvironmentModel` 读取 `environment?.designerConfig?.settingCollapsed`，dispatch `updateView({ settingCollapsed })` 注入初始值
- 2026-07-20：步骤 6 完成 — 删除 `src/store/designer/modules/` 整个目录（包括 `designerRootReducer` / `DesignerRootState` / `createDesignerStore` / `DesignerStoreProvider` 等已无引用的符号）
- 2026-07-20：步骤 7 完成 — `pnpm tsc --noEmit` 在 `src/` 下零错误。10 个 `packages/ui/src/material-selector/` 错误为预存问题，与本次任务无关
- 2026-07-20：步骤 8 完成 — `grep` 校验：
  - `DesignerStoreProvider` / `createDesignerStore` / `designerRootReducer` / `DesignerRootState` / `DesignerStore` 在 `src/` 活跃代码中 0 命中（仅 3 处历史注释）
  - `useStore<any>()` 仅在 [designer-field/index.tsx#L78](src/designer/renderer/designer-field/index.tsx#L78) 使用，移除嵌套 Provider 后自动指向主 store，`store.getState().component.selected` 正确返回
  - [designer-field/index.tsx#L66-75](src/designer/renderer/designer-field/index.tsx#L66) 的 `useSelector` 读 `fullState.component` / `fullState.app` 现在能拿到主 store 的对应字段
- 2026-07-20：步骤 9 完成 — [AGENTS.md](../../../../AGENTS.md) 同步：
  - §3.1 数据流图：移除 `DesignerStoreProvider`，改为"主 store 的 viewCanvas / viewUI slice"
  - §3.2 三套状态边界表：第二行方案改为"主 store 的 `viewCanvas` / `viewUI` slice"，并加引用 task-005
  - §3.2 段落引用：把原 task-003 "迁移到私有 store" 段落替换为 task-005 "合并到主 store" 段落（解释嵌套 Provider 切错 store 的根因 + 修复方案）
  - §5.1 切片表：新增 `viewCanvas` / `viewUI` 两行
  - [Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 的历史注释同步更新为指向 task-005
- 2026-07-20：步骤 10 收尾（`useView` 兼容层清理）：
  - [src/store/designer/hooks.ts](src/store/designer/hooks.ts) 删 `useView`（L18-33 旧代码）；`useSetView` 注释更新为不再引用 `useView`；移除不再用的 `useMemo` / `shallowEqual` import
  - [src/store/designer/index.tsx](src/store/designer/index.tsx) 从 hook barrel 移除 `useView` re-export；顶部注释改 `useViewXxx` / `useSetView`
  - [src/store/modules/view-actions.ts](src/store/modules/view-actions.ts) 注释从"用于 useView 兼容层"改为"`useSetView` 和 DesignerContent mount 时的 settingCollapsed 注入"
  - [Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 历史注释改写（不再单提 `useView`）
  - [AGENTS.md](../../../../AGENTS.md) §3.2 新增"`useView` 兼容层已删除"段落
  - `pnpm tsc --noEmit` 再次通过：`src/` 零错误，10 个 `packages/ui` 预存错误与本次无关
  - `grep` 校验：`useView` 在活跃代码中 0 命中（剩余 5 命中全在 `.bak` 备份文件 + 注释中，不影响运行时）
