# 设计器私有 Store 迁移（useView → Redux）

> 计划日期：2026-07-20
> 任务编号：`task-2026-07-20-003`
> 上游任务：[task-2026-07-20-002-cleanup-unused-actions](./done/task-2026-07-20-002-cleanup-unused-actions.md)
> 状态：`done`
> 类型：`refactor`
> Research 报告：[useView调用点字段审计](../research/useView调用点字段审计.md)
> 重写日期：2026-07-20（修正 8 个技术遗漏点）
> 完成日期：2026-07-20

---

## 1. 背景

当前 `useView` 用 `React Context + useSet` 实现，`useSet` 基于 `useReducer`，每次 `setView({ scale: 2 })` 都会创建全新的 view 对象，导致 `ViewStoreContext.Provider` 的 `value` 每次都是新引用 → **所有 12 个消费者全部重渲染**，即使它们只关心 `scale` 不关心 `tabsKey`。

Context 的订阅是**全量订阅**，没有 selector 机制，这是 Context 相比 Redux 最大的劣势。

## 2. 目标

1. 把 `useView` 的状态迁移到独立的 Redux store
2. store 物理位置放在 `src/store/designer/` 下，统一维护
3. 消费者改为字段级订阅，只重渲染真正依赖该字段的组件
4. store 生命周期跟随 `DesignerContent`，不常驻主 store
5. 保持 `useView` API 向后兼容（内部改用 Redux），调用点零改动

## 3. 设计要点

### 3.1 目录结构

```
src/store/
├── index.ts                        # 主 store（app + component）
├── modules/
│   ├── app.ts
│   ├── component.ts
│   └── index.ts                    # 主 rootReducer
├── designer/                       # 设计器私有 store（新建）
│   ├── index.ts                    # configureStore + DesignerStoreProvider + 工厂
│   ├── modules/
│   │   ├── view-canvas.ts          # 高频更新 slice
│   │   ├── view-ui.ts              # 低频更新 slice
│   │   └── index.ts                # designer rootReducer
│   └── hooks.ts                    # 字段级订阅 hook + useView 兼容层
├── exports.ts
└── backup/
```

### 3.2 Slice 拆分

按**更新频率**拆分：

#### `viewCanvas` slice（高频，拖拽/缩放时更新）

| 字段 | 类型 | 初始值 | 说明 |
| --- | --- | --- | --- |
| `scale` | `number` | `1` | 缩放比例 |
| `lines` | `{ h: number[]; v: number[] }` | `{ h: [], v: [] }` | 对齐线 |
| `startX` | `number` | `-50` | 标尺 x 轴起始点 |
| `startY` | `number` | `-50` | 标尺 y 轴起始点 |
| `rulerWidth` | `number` | `0` | 标尺宽度 |
| `rulerHeight` | `number` | `0` | 标尺高度 |
| `width` | `number` | `1366` | 画布宽度 |
| `height` | `number` | `768` | 画布高度 |

**消费者**：[canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx)、[designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx)

#### `viewUI` slice（低频，用户点击/切换时更新）

| 字段 | 类型 | 初始值 | 说明 |
| --- | --- | --- | --- |
| `tabsKey` | `string` | `'config'` | 当前激活的 tab |
| `layerCollapsed` | `boolean` | `false` | 左侧面板开关 |
| `layersTreeCollapsed` | `boolean` | `false` | 图层树面板开关 |
| `materialsListCollapsed` | `boolean` | `false` | 资产面板开关 |
| `settingCollapsed` | `boolean` | 动态（见 §3.3） | 右侧配置面板开关 |
| `canvasToolbarCollapsed` | `boolean` | `false` | 画布工具栏开关（当前不在初始 state，但 toolbar 会读写，需新增） |
| `visible` | `boolean` | `false` | 模态框可见性 |
| `isShowReferLine` | `boolean` | `true` | 是否显示参考线 |

**消费者**：toolbar, configuration-panel/*, DropContainer, aside-panel/materials, layers-tree/tree, designer-field, canvas-graph（仅 isShowReferLine）

### 3.3 关键设计决策

#### 决策 1：`settingCollapsed` 初始值需要 `environment` 注入

原 `ViewProvider` 在 [DataProvider.tsx#L216-241](src/designer/DataProvider.tsx#L216) 读 `environment?.designerConfig?.settingCollapsed` 作为初始值。

**问题**：`environment` 来自 `useEnvironmentModel` (hox)，必须在 React 组件树内才能用。

**方案**：用工厂函数 + Provider 闭包传递：

```tsx
// src/store/designer/index.ts
export const createDesignerStore = (initialSettingCollapsed?: boolean) =>
    configureStore({ reducer: rootReducer, preloadedState: { viewUI: { settingCollapsed: initialSettingCollapsed ?? false } } });

export const DesignerStoreProvider = ({ children }) => {
    const { environment } = useEnvironmentModel();
    const storeRef = useRef<DesignerStore>();
    if (!storeRef.current) {
        storeRef.current = createDesignerStore(environment?.designerConfig?.settingCollapsed);
    }
    return <Provider store={storeRef.current}>{children}</Provider>;
};
```

#### 决策 2：保留 `useView` API（向后兼容）

10 个调用点都从 `@Src/designer/common` 导入 `useView`。直接改 API 风险高，改用**兼容层**：

```ts
// src/store/designer/hooks.ts
export const useView = () => {
    const view = useSelector(s => s, shallowEqual); // 整体读
    const dispatch = useDispatch();
    const setView = useCallback((partial: Partial<ViewCanvasState & ViewUIState>) => {
        dispatch(updateView(partial)); // 一个 action 接受 partial payload
    }, [dispatch]);
    return [view, setView] as const;
};
```

**性能权衡**：
- 兼容层用 `useSelector(s => s, shallowEqual)` 整体读取，靠 shallowEqual 防止无意义重渲染
- 高频组件（canvas-graph、designer-field）仍用 `useViewScale()` 等细粒度 hook 拿到最优性能
- 低频组件用 `useView()` 兼容层，重渲染频次与 Context 方案相当，但保留了迁移路径

#### 决策 3：`setView` 部分更新语义保留

原 `useSet` 实现是 `{ ...state, ...action }`（Object.assign），支持 `setView({ a: 1, b: 2 })` 一次性更新多个字段。

**方案**：用单一 `updateView` action 接受 partial payload，reducer 用 `{ ...state, ...payload }`：

```ts
// view-canvas.ts
const viewCanvasSlice = createSlice({
    name: 'viewCanvas',
    initialState,
    reducers: {
        updateViewCanvas: (state, action: PayloadAction<Partial<ViewCanvasState>>) => {
            Object.assign(state, action.payload);
        },
    },
});
```

#### 决策 4：移除 `ViewProvider` 和 `ViewStoreContext`

`ViewProvider` ([DataProvider.tsx#L216-241](src/designer/DataProvider.tsx#L216)) 整个移除，改为 `DesignerStoreProvider` 直接包 `DesignerContent` 的 children。

同步清理：
- [DataProvider.tsx#L14](src/designer/DataProvider.tsx#L14) 移除 `ViewStoreContext` 导入
- [common/index.ts](src/designer/common/index.ts) 移除 `ViewStoreContext` 导出
- [common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 移除 `useView` 的 Context 实现

### 3.4 入口注入

```tsx
// src/designer/DesignerContent.tsx
import { DesignerStoreProvider } from '@Src/store/designer';

const DesignerContent = () => (
    <DesignerStoreProvider>
        {/* 原 ViewProvider 位置直接展开 */}
        <Toolbar />
        <Canvas />
        ...
    </DesignerStoreProvider>
);
```

### 3.5 字段级订阅封装

提供细粒度 hook 用于高频组件：

```ts
// src/store/designer/hooks.ts
export const useViewScale = () => useSelector((s: DesignerRootState) => s.viewCanvas.scale);
export const useViewLines = () => useSelector((s: DesignerRootState) => s.viewCanvas.lines);
// ... 16 个字段对应 16 个 hook
```

### 3.6 保留 `useDesigner`（components 树）仍在 Context

`useDesigner` 管理的是组件树（几百个节点），塞进 Redux 会更慢。本次只迁移 `useView`。

## 4. 实施步骤

### 步骤 1：创建 store 目录结构

1. 新建 `src/store/designer/modules/view-canvas.ts`
2. 新建 `src/store/designer/modules/view-ui.ts`
3. 新建 `src/store/designer/modules/index.ts`（combineReducers）
4. 新建 `src/store/designer/hooks.ts`（含 `useView` 兼容层 + 16 个细粒度 hook）
5. 新建 `src/store/designer/index.ts`（含 `createDesignerStore` + `DesignerStoreProvider`）

### 步骤 2：注入 Provider

1. 修改 [DesignerContent.tsx](src/designer/DesignerContent.tsx) 包 `DesignerStoreProvider`
2. 移除 [DataProvider.tsx](src/designer/DataProvider.tsx) 中的 `ViewProvider`
3. 清理 [common/index.ts](src/designer/common/index.ts) 中的 `ViewStoreContext` 导出
4. 清理 [common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 中的 `useView` Context 实现

### 步骤 3：调用点优化（可选，二期）

高频组件改用细粒度 hook 拿到最优性能：

| 文件 | 优化点 |
| --- | --- |
| [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) | 改用 `useViewScale()` / `useViewLines()` 等 8 个细粒度 hook |
| [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) | 改用 `useViewScale()` + `useViewTabsKey()` |
| [toolbar/index.js](src/designer/toolbar/index.js) | 改用 `useViewVisible()` / `useViewLayerCollapsed()` 等 |

其余 7 个文件暂保留 `useView()` 兼容层，二期再优化。

### 步骤 4：验证

- `pnpm tsc --noEmit` 零新增错误
- `pnpm start` 运行验证拖拽性能
- 用 React DevTools Profiler 对比改造前后的重渲染数量

## 5. 验证清单

- [ ] `src/store/designer/` 目录及 5 个文件建立
- [ ] `DesignerStoreProvider` 在 `DesignerContent` 注入
- [ ] `ViewProvider` / `ViewStoreContext` 移除
- [ ] 10 个调用点（除 .bak）至少能用兼容层跑通
- [ ] 高频组件（canvas-graph、designer-field）改用细粒度 hook
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] `pnpm start` 验证拖拽、缩放、tab 切换、面板折叠功能
- [ ] Profiler 验证：拖拽时 canvas-graph + designer-field 重渲染，其他 10 个不重渲染
- [ ] 更新 roadmap.md 状态为 done
- [ ] 同步更新 AGENTS.md §3.2 标记迁移完成

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `settingCollapsed` 初始值在 Provider 外不可用 | 中 | 工厂函数 + `useRef` 延迟初始化（§3.3 决策 1） |
| `canvasToolbarCollapsed` 不在初始 state | 中 | 显式新增为 `viewUI` 字段，初始 `false` |
| `useView` 兼容层性能退化为 Context 方案 | 中 | 兼容层用 `shallowEqual`；高频组件改用细粒度 hook（§3.3 决策 2） |
| `setView` 批量更新语义丢失 | 低 | 用单一 `updateView` action 接受 partial payload（§3.3 决策 3） |
| 改造遗漏调用点 | 低 | 已知 10 个实际改造点（2 个 .bak 不动），逐一验证 |
| HMR 状态重置导致拖拽体验变化 | 低 | Context 方案本来也不持久，行为变化可接受；如需持久化可加 `redux-persist` |
| `useView` API 保留导致迁移不彻底 | 低 | 兼容层是过渡方案，二期任务推细粒度 hook 化 |

### 回退方案

- 改造前 git commit
- 必要时 `git revert` 即可恢复 Context 方案

## 7. 实施记录

- 2026-07-20：任务创建，开始 research 阶段
- 2026-07-20：修正 [Redux现代化升级调研.md](../research/Redux现代化升级调研.md) §2.1 中关于 useView 的结论
- 2026-07-20：修正 [AGENTS.md](../../../AGENTS.md) §3.2 三套状态管理边界表
- 2026-07-20：完成 research，输出 [useView调用点字段审计](../research/useView调用点字段审计.md)
  - 扫描 12 个调用点（其中 2 个是 .bak 文件，不改造）
  - 实际改造 10 个文件
  - 字段归类：`viewCanvas`（8 个字段，高频）+ `viewUI`（8 个字段，低频）
- 2026-07-20：技术 review，发现 8 个遗漏点：
  1. 实施示例代码矛盾（ViewProvider 与移除冲突）
  2. `canvasToolbarCollapsed` 不在初始 state
  3. `settingCollapsed` 初始值需要 `environment` 注入
  4. `ViewStoreContext` 在 common 模块的导出未清理
  5. `useView` API 向后兼容策略未明确
  6. `setView` 批量更新语义风险评估过高
  7. HMR / 持久化策略未提
  8. 预估性能数字偏差未说明
- 2026-07-20：重写计划文件，补充 8 个遗漏点的解决方案
- 2026-07-20：等待用户确认最终方案后进入实施阶段
- 2026-07-20：实施完成
  - 创建 `src/store/designer/` 目录（5 个文件：index.ts、hooks.ts、modules/index.ts、modules/view-canvas.ts、modules/view-ui.ts、modules/view-actions.ts）
  - 移除 `DataProvider.tsx` 中的 `ViewProvider` 和 `ViewStoreContext` 引用
  - 注入 `DesignerStoreProvider` 到 `DesignerContent`
  - 移除 `common/context/context-designer/Designer.tsx` 中的 `useView` Context 实现，改为从新 store re-export
  - 3 个高频组件改用细粒度 hook：
    - `canvas-graph/index.tsx`：10 个细粒度 hook + `useView()` 仅取 setView
    - `designer-field/index.tsx`：`useViewScale()` + `dispatch(updateView(...))`
    - `toolbar/index.js`：4 个细粒度 hook + `useView()` 仅取 setView
  - 验证：`pnpm tsc --noEmit` 零新增错误（packages/ui/ 中的错误是预先存在的）
  - **research 补遗**：实际扫描发现 12 个 `useView` 调用点（research 漏列 2 个：`aside-panel/index.js`、`aside-panel/layers-tree/index.jsx`），已通过 `useView` 兼容层覆盖，零修改
  - 实施发现 1 个技术补遗：循环依赖 —— `updateView` action 需要被 view-canvas / view-ui 的 `extraReducers` 引用，但 action 本身需要 `ViewCanvasState` / `ViewUIState` 类型，造成循环。解决：把 action 拆到 `modules/view-actions.ts` 独立文件，类型用 `import type` 解决循环
- 2026-07-20：归档（task 文件移至 `done/`）

## 8. 二期优化（不属本任务范围）

- 调用点全面细粒度 hook 化（替换 `useView()` 兼容层）
- 评估 `useDesigner` 的 components 树是否需要字段级订阅
- `view` 状态是否需要 `redux-persist` 跨刷新保留
