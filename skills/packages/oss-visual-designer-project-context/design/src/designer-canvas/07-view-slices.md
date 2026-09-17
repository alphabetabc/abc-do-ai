# View Slices 数据流架构（viewCanvas + viewUI）

> 配套 [00-overview.md](./00-overview.md) | 关注点：view 侧 state 的增删改查 + 迁移事实
>
> 本文是 view 侧（原 `useView`）从 Context 迁移到 Redux 后的**权威事实文档**。
> 迁移历史见 [task-003](../../plans/done/task-2026-07-20-003-designer-private-store.md) / [task-004](../../plans/done/task-2026-07-20-004-useview-call-sites-cleanup.md) / [task-005](../../plans/done/task-2026-07-20-005-designer-view-merge-into-main-store.md)。

---

## 1. state 形状

### 1.1 viewCanvas slice（高频）

文件：[`src/store/modules/view-canvas.ts`](src/store/modules/view-canvas.ts)

```ts
export interface ViewCanvasState {
    scale: number;              // 缩放比例
    lines: { h: number[]; v: number[] };  // 对齐线
    startX: number;             // 标尺 x 轴起始点
    startY: number;             // 标尺 y 轴起始点
    rulerWidth: number;         // 标尺宽度（视口宽度）
    rulerHeight: number;        // 标尺高度（视口高度）
    width: number;              // 画布宽度
    height: number;             // 画布高度
}
```

| 字段 | 何时改 | 频率 |
| --- | --- | --- |
| `scale` | 拖拽和缩放时 | 高频 |
| `lines` | 拖拽时对齐线每帧变化 | 高频 |
| `startX` / `startY` | 标尺原点拖动 | 中频 |
| `rulerWidth` / `rulerHeight` | 窗口 resize | 低频 |
| `width` / `height` | 切换页面尺寸 | 低频 |

### 1.2 viewUI slice（低频）

文件：[`src/store/modules/view-ui.ts`](src/store/modules/view-ui.ts)

```ts
export interface ViewUIState {
    tabsKey: string;                // 配置面板当前激活 tab
    layerCollapsed: boolean;        // 左侧面板显示开关
    layersTreeCollapsed: boolean;   // 图层树面板显示开关
    materialsListCollapsed: boolean;// 资产面板显示开关
    settingCollapsed: boolean;      // 右侧配置面板开关（由 environment 注入初始值）
    canvasToolbarCollapsed: boolean;// 画布工具栏开关
    visible: boolean;               // 模态框可见性
    isShowReferLine: boolean;       // 是否显示参考线
}
```

| 字段 | 何时改 | 频率 |
| --- | --- | --- |
| `tabsKey` | 用户点击配置面板 tab | 低频 |
| `*Collapsed` | 用户折叠/展开面板 | 低频 |
| `settingCollapsed` | 仅 init：`DesignerContent` mount 时注入 | 一次性 |
| `visible` | 模态框打开/关闭 | 低频 |
| `isShowReferLine` | 用户切换参考线 | 低频 |

### 1.3 为什么按频率拆两个 slice

task-003 决策：`viewCanvas` 高频更新（拖拽/缩放/对齐线每帧变化），`viewUI` 低频更新（用户点击/切换）。拆分后 `viewCanvas` 的频繁 dispatch 不会触发只订阅 `viewUI` 的组件 re-render。

---

## 2. 写路径

### 2.1 跨 slice 批量更新：`updateView` action

文件：[`src/store/modules/view-actions.ts`](src/store/modules/view-actions.ts)

```ts
export const updateView = createAction<DesignerViewPayload>('designerView/updateView');

export interface DesignerViewPayload extends Partial<ViewCanvasState>, Partial<ViewUIState> {}
```

**机制**：一个 action 同时更新 `viewCanvas` 和 `viewUI` 两个 slice。两个 slice 通过 `extraReducers` 监听 `updateView`，各自只处理属于自己的字段：

```ts
// view-canvas.ts 的 extraReducers
builder.addCase(updateView, (state, action) => {
    const payload = action.payload;
    for (const key of Object.keys(viewCanvasInitialState) as (keyof ViewCanvasState)[]) {
        if (key in payload) {
            (state as any)[key] = payload[key];
        }
    }
});
// view-ui.ts 的 extraReducers 同理
```

**调用方式**：

```ts
const setView = useSetView();
setView({ scale: 2, tabsKey: 'data' });  // 跨 slice 批量更新，内部 batch
```

### 2.2 单 slice 更新

| API | 说明 |
| --- | --- |
| `dispatch(updateViewCanvas(partial))` | 只改 viewCanvas 字段 |
| `dispatch(updateViewUI(partial))` | 只改 viewUI 字段 |
| `dispatch(resetViewCanvas())` | 重置 viewCanvas 到初始值 |
| `dispatch(resetViewUI())` | 重置 viewUI 到初始值 |

### 2.3 `settingCollapsed` 初始值注入

`settingCollapsed` 的初始值来自 `environment.designerConfig.settingCollapsed`（hox model），在 `DesignerContent` 的 `useLayoutEffect` 中注入：

```ts
// DesignerContent.tsx
useLayoutEffect(() => {
    const { designerConfig } = useEnvironmentModel();
    dispatch(updateView({ settingCollapsed: designerConfig?.settingCollapsed }));
}, []);
```

**为什么不在 initialState 里直接写**：`environment` 是 hox model，slice 的 `initialState` 无法访问 hox 状态。改在 `DesignerContent` mount 时注入，保证时序正确（mount 后 `useLayoutEffect` 同步执行，早于首次渲染提交）。

---

## 3. 读路径

### 3.1 字段级订阅 hook（16 个）

文件：[`src/store/designer/hooks.ts`](src/store/designer/hooks.ts) L50-68

每个 hook 都是单行 `useSelector`，只订阅对应字段：

| hook | slice | 字段 |
| --- | --- | --- |
| `useViewScale` | viewCanvas | `scale` |
| `useViewLines` | viewCanvas | `lines` |
| `useViewStartX` | viewCanvas | `startX` |
| `useViewStartY` | viewCanvas | `startY` |
| `useViewRulerWidth` | viewCanvas | `rulerWidth` |
| `useViewRulerHeight` | viewCanvas | `rulerHeight` |
| `useViewCanvasWidth` | viewCanvas | `width` |
| `useViewCanvasHeight` | viewCanvas | `height` |
| `useViewTabsKey` | viewUI | `tabsKey` |
| `useViewLayerCollapsed` | viewUI | `layerCollapsed` |
| `useViewLayersTreeCollapsed` | viewUI | `layersTreeCollapsed` |
| `useViewMaterialsListCollapsed` | viewUI | `materialsListCollapsed` |
| `useViewSettingCollapsed` | viewUI | `settingCollapsed` |
| `useViewCanvasToolbarCollapsed` | viewUI | `canvasToolbarCollapsed` |
| `useViewVisible` | viewUI | `visible` |
| `useViewIsShowReferLine` | viewUI | `isShowReferLine` |

**导入路径**：`from '@Src/store/designer/hooks'`

### 3.2 只写不读：`useSetView`

```ts
export const useSetView = () => {
    const dispatch = useDispatch();
    return useCallback(
        (partial: DesignerViewPayload) => {
            batch(() => {
                dispatch(updateView(partial));
            });
        },
        [dispatch],
    );
};
```

返回稳定的 `setView` 引用，**不订阅任何 state**。适用于"只取 setView"场景（canvas-graph / toolbar / layers-tree/tree / DropContainer）。

### 3.3 已删除的 API

| 旧 API | 状态 | 替代 |
| --- | --- | --- |
| `useView()`（返回 `{ view, setView }` 全量 view） | 已删除（task-005 收尾） | `useViewXxx` 字段级 hook + `useSetView` |
| `ViewProvider` / `ViewStoreContext` | 已删除（task-003） | Redux slice |
| `DesignerStoreProvider` / `createDesignerStore` | 已删除（task-005） | 合并到主 store |

---

## 4. 迁移历史

### 4.1 task-003（2026-07-20）：Context → 私有 Redux store

- `useView` 从 `React Context + useSet` 迁移到**独立 Redux store**
- 按频率拆 `viewCanvas`（高频）/ `viewUI`（低频）两个 slice
- 提供 16 个字段级订阅 hook + `useView` 兼容层
- `settingCollapsed` 初始值通过 `DesignerStoreProvider` 工厂函数注入

### 4.2 task-004（2026-07-20）：调用点清理

- 新增 `useSetView`（只写不读）
- 9 个"读全量 view"调用点改为细粒度 hook
- 4 个"只取 setView"调用点改为 `useSetView`
- 统一 import 路径为 `@Src/store/designer/hooks`

### 4.3 task-005（2026-07-20）：合并到主 store（修复嵌套 Provider 回归）

**问题**：task-003 引入的 `<DesignerStoreProvider>` 嵌套 Provider 导致 react-redux 7.x `useSelector` 取最近 Provider 的 store，外层主 store 的 `component` / `app` slice 对内层组件不可见 → 选中/拖拽/工具栏静默失效。

**症状模式**（不下沉 12 个文件具体清单）：
- `useSelector(s => s.component.selected)` 返回 `undefined` → 拖拽/选中/对齐静默失效
- `useDispatch` 返回设计器 store 的 dispatch → `dispatch({ type: 'component/selected' })` 静默无效（reducer 不处理该 action）
- 工具栏/素材面板读 `app.designerType` 拿到 `undefined` → 条件渲染错位

**3 种备选方案评估**：

| 方案 | 评价 | 是否采用 |
| --- | --- | --- |
| **A. 把 view 合并到主 store** | 1 处 slice 集成 + 删除 `DesignerStoreProvider`；所有 `useSelector`/`useDispatch` 立刻统一指向主 store；副作用：view 状态在 designer 关闭再开后保留（UI 状态，保留可接受） | ✅ 选 |
| B. 写 `useMainStoreSelector` / `useMainDispatch` 绕过 Provider | 不动架构，但要改 12+ 文件的 `useSelector`/`useDispatch`；每加一个新组件都得记得用新 hook，容易遗漏；regression 风险高 | ❌ |
| C. 升级 react-redux 到 8+ 启用 `useSelector(selector, eq, { context })` | 跨大版本升级，react-redux 8 要 React 18+；本项目 React 17.0.2，升级链太深，单独修这个 bug 不值得 | ❌ |

**为什么选 A**：单点修改 + 调用方零改动 + view 状态跨 designer 保留是更友好的默认。溯源：[task-005 §1.1-1.3](../../plans/done/task-2026-07-20-005-designer-view-merge-into-main-store.md)。

**修复**：把 `viewCanvas` / `viewUI` 作为两个新的 top-level slice 加入主 `rootReducer`，删除独立 store。`useViewXxx` selector 路径不变（`s => s.viewCanvas.scale`），调用方零改动。

**收尾**：删除 `useView` 兼容层（task-004 后无活跃调用方，本身是反模式）。

详见 [task-005](../../plans/done/task-2026-07-20-005-designer-view-merge-into-main-store.md)。

---

## 5. 与 designerCanvas slice 的边界

| 维度 | view 侧 | designerCanvas 侧 |
| --- | --- | --- |
| 数据复杂度 | 16 个标量字段 | 组件树 + 派生索引（byId/parentMap） |
| 更新模式 | partial merge（Object.assign） | 结构性变更 buildIndex / 字段级 patch |
| 跨 slice 交互 | `updateView` action + extraReducers | 无（独立 slice） |
| stale 问题 | 无（每次更新都直接改 state） | 有（updateFieldConfig 只改 byId 不改 tree） |
| 持久化 | 不持久化（`whitelist = []`） | 不持久化 |
| 迁移状态 | 已稳定（task-005 后无改动） | 持续优化中（task-006~012） |

**两套 slice 没有直接的跨 slice 交互**——它们是主 store 的独立 top-level slice。唯一的"跨模块"交互是 `settingCollapsed` 初始值注入（`environment` hox model → `DesignerContent` → `dispatch(updateView)`），不涉及 designerCanvas。

---

## 6. 易错点

| 易错 | 后果 | 怎么避免 |
| --- | --- | --- |
| 用 `useView()` 读全量 view | 已删除，编译报错 | 改用 `useViewXxx` 字段级 hook |
| 新增字段只加到 slice 没加到 `updateView` 的 payload 类型 | TS 不报错但 extraReducers 不会处理 | `DesignerViewPayload` 是 `Partial<ViewCanvasState> & Partial<ViewUIState>`，新字段加到对应 State 接口即可 |
| 在 `initialState` 里直接写 `settingCollapsed` | `environment` 是 hox model，slice initialState 无法访问 | 在 `DesignerContent` mount 时 `dispatch(updateView({ settingCollapsed }))` |
| 跨 slice 批量更新不走 `updateView` 而分别 dispatch | 两次 dispatch 两次 re-render | 用 `useSetView()` 内部 `batch` |

---

## 7. 字段使用矩阵

`useViewXxx` / `useSetView` 在 `src/` 的活跃调用方共 **13 个文件**（hook 定义：[`src/store/designer/hooks.ts`](../../../src/store/designer/hooks.ts) L50-68，16 个 `useViewXxx` + L36-46 `useSetView`）。字段使用矩阵（按字段 · 16 行）：

| 字段 | slice | 读取点（hook） | 写入点 | 频率 |
| --- | --- | --- | --- | --- |
| `scale` | viewCanvas | `useViewScale` → canvas-graph, designer-field | canvas-graph（`updateScale` / `useEffect([width,height])`） | **高频** |
| `lines` | viewCanvas | `useViewLines` → canvas-graph | canvas-graph（`handleLine` / 卸载 cleanup） | **高频** |
| `startX` | viewCanvas | `useViewStartX` → canvas-graph | （初始化时由 canvas-graph 间接写入） | 中频 |
| `startY` | viewCanvas | `useViewStartY` → canvas-graph | 同上 | 中频 |
| `rulerWidth` | viewCanvas | `useViewRulerWidth` → canvas-graph | canvas-graph（`useEffect([width,height])`） | 低频 |
| `rulerHeight` | viewCanvas | `useViewRulerHeight` → canvas-graph | 同上 | 低频 |
| `width` | viewCanvas | `useViewCanvasWidth` → canvas-graph | canvas-graph（`useLayoutEffect([pageSize])`） | 低频 |
| `height` | viewCanvas | `useViewCanvasHeight` → canvas-graph | 同上 | 低频 |
| `tabsKey` | viewUI | `useViewTabsKey` → component/config, group/config, layout-block/config | component/config, group/config, layout-block/config（onTabClick）+ DropContainer + layers-tree/tree（drop 后设 `'config'`） | 低频 |
| `layerCollapsed` | viewUI | `useViewLayerCollapsed` → toolbar, aside-panel/index | toolbar（左侧面板按钮） | 低频 |
| `layersTreeCollapsed` | viewUI | `useViewLayersTreeCollapsed` → aside-panel/index, layers-tree | layers-tree（折叠按钮） | 低频 |
| `materialsListCollapsed` | viewUI | `useViewMaterialsListCollapsed` → aside-panel/index, materials | materials（折叠按钮） | 低频 |
| `settingCollapsed` | viewUI | `useViewSettingCollapsed` → toolbar, configuration-panel | DesignerContent（mount 注入 initial；**不经 `useSetView`**，direct `dispatch(updateView({ settingCollapsed }))`）+ toolbar（右侧面板按钮） | 低频 |
| `canvasToolbarCollapsed` | viewUI | `useViewCanvasToolbarCollapsed` → toolbar, canvas-graph | toolbar（画布工具栏按钮） | 低频 |
| `visible` | viewUI | `useViewVisible` → toolbar | toolbar（`toggleModal` / `globalRuntimeMessage.on('showSettingModal')` 回调） | 低频 |
| `isShowReferLine` | viewUI | `useViewIsShowReferLine` → canvas-graph | canvas-graph（`handleShowReferLine` / 卸载 cleanup / `handleSetting`） | 低频 |

**调用方清单（13 个文件）**：

- `src/designer/canvas-graph/index.tsx`（读 10 字段：scale / lines / startX / startY / rulerWidth / rulerHeight / width / height / isShowReferLine / canvasToolbarCollapsed；写 7 字段）
- `src/designer/DesignerContent.tsx`（**直 dispatch**，写 `settingCollapsed` 初始值；`import { updateView } from '@Src/store/designer'`）
- `src/designer/toolbar/index.js`（读 + 写 `visible` / `layerCollapsed` / `settingCollapsed` / `canvasToolbarCollapsed`）
- `src/designer/configuration-panel/index.js`（只读 `settingCollapsed`）
- `src/designer/configuration-panel/component/index.jsx`（读 + 写 `tabsKey`）
- `src/designer/configuration-panel/group/index.js`（读 + 写 `tabsKey`）
- `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx`（读 + 写 `tabsKey`）
- `src/designer/common/dnd/DropContainer.tsx`（**只写** `tabsKey: 'config'`，无读）
- `src/designer/aside-panel/index.js`（**只读** `layerCollapsed` / `layersTreeCollapsed` / `materialsListCollapsed`，无写——为 SplitPanel 布局调整用）
- `src/designer/aside-panel/materials/index.tsx`（读 + 写 `materialsListCollapsed`）
- `src/designer/aside-panel/layers-tree/index.jsx`（读 + 写 `layersTreeCollapsed`）
- `src/designer/aside-panel/layers-tree/tree/index.tsx`（**只写** `tabsKey: 'config'`，无读）
- `src/designer/renderer/designer-field/index.tsx`（**只读** `scale`，无写）

> **历史说明**：本矩阵已对照源码验证。`designer-field/index.tsx` 不再写 `tabsKey`（原调研记录已过时）；`DesignerContent.tsx` 是 task-005 合并主 store 后新增的写入方（mount 时直 dispatch 注入 `settingCollapsed` 初始值，**不经 `useSetView`**）；`aside-panel/index.js` 是新增只读调用方；`aside-panel/layers-tree/index.jsx`（容器）与 `tree/index.tsx`（内部树）职责不同。写路径 API 已从 Context 时代 `setView({...})` 统一迁移到 `useSetView()`。
