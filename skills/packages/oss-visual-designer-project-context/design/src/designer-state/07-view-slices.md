# 07 — View Slices：viewCanvas + viewUI

> 配套 [00-README.md](./00-README.md) | 关注点：**修改 view 状态 / 加新 view 字段**
>
> viewCanvas + viewUI 与 designerCanvas 是并列 slice，统一在 `designer-state/` 目录文档化。

---

## 0. 概览

| slice | 文件 | action 模式 | 用途 |
| --- | --- | --- | --- |
| `viewCanvas` | `src/store/modules/view-canvas.ts` | `createSlice` | 画布高频状态：scale / lines / 标尺 / 画布尺寸 |
| `viewUI` | `src/store/modules/view-ui.ts` | `createSlice` | UI 低频状态：tabsKey / *Collapsed / visible / isShowReferLine |

> `isShowReferLine` 虽写在画布但属于 UI 状态，归到 `viewUI`。

---

## 1. ViewCanvasState（画布高频状态）

**源码位置**：`src/store/modules/view-canvas.ts` `ViewCanvasState` L16-33

```ts
export interface ViewCanvasState {
    scale: number;                      // 缩放比例
    lines: { h: number[]; v: number[] }; // 对齐线
    startX: number;                     // 标尺 x 轴起始点
    startY: number;                     // 标尺 y 轴起始点
    rulerWidth: number;                 // 标尺宽度（视口宽度）
    rulerHeight: number;                // 标尺高度（视口高度）
    width: number;                      // 画布宽度
    height: number;                     // 画布高度
}
```

**initialState**（L35-44）：

```ts
{
    scale: 1,
    lines: { h: [], v: [] },
    startX: -50,
    startY: -50,
    rulerWidth: 0,
    rulerHeight: 0,
    width: 1366,
    height: 768,
}
```

### 1.1 viewCanvas actions

**源码位置**：`view-canvas.ts` L46-68

| action | 用途 |
| --- | --- |
| `updateViewCanvas` | `Object.assign(state, action.payload)`，部分更新 |
| `resetViewCanvas` | 重置为 `viewCanvasInitialState` |
| `updateView`（extraReducers） | 跨 slice 的 partial update，只处理属于本 slice 的字段 |

---

## 2. ViewUIState（UI 低频状态）

**源码位置**：`src/store/modules/view-ui.ts` `ViewUIState` L14-31

```ts
export interface ViewUIState {
    tabsKey: string;                    // 当前激活的 tab
    layerCollapsed: boolean;            // 左侧面板显示开关
    layersTreeCollapsed: boolean;       // 图层树面板显示开关
    materialsListCollapsed: boolean;    // 资产面板显示开关
    settingCollapsed: boolean;          // 右侧配置面板开关（由 environment 注入初始值）
    canvasToolbarCollapsed: boolean;    // 画布工具栏开关
    visible: boolean;                   // 模态框可见性
    isShowReferLine: boolean;           // 是否显示参考线
}
```

**initialState**（L33-42）：

```ts
{
    tabsKey: 'config',
    layerCollapsed: false,
    layersTreeCollapsed: false,
    materialsListCollapsed: false,
    settingCollapsed: false,
    canvasToolbarCollapsed: false,
    visible: false,
    isShowReferLine: true,
}
```

### 2.1 viewUI actions

**源码位置**：`view-ui.ts` L44-66

| action | 用途 |
| --- | --- |
| `updateViewUI` | `Object.assign(state, action.payload)`，部分更新 |
| `resetViewUI` | 重置为 `viewUIInitialState` |
| `updateView`（extraReducers） | 跨 slice 的 partial update，只处理属于本 slice 的字段 |

---

## 3. updateView 跨 slice 机制

**源码位置**：`src/store/modules/view-actions.ts` L13-15

```ts
export interface DesignerViewPayload extends Partial<ViewCanvasState>, Partial<ViewUIState> {}

export const updateView = createAction<DesignerViewPayload>('designerView/updateView');
```

### 3.1 机制

`updateView` 是一个独立的 action，`viewCanvas` 和 `viewUI` 两个 slice 通过 `extraReducers` 监听它，并按字段归属分发到对应子 slice。

**viewCanvas extraReducers**（`view-canvas.ts` L57-67）：

```ts
extraReducers: (builder) => {
    builder.addCase(updateView, (state, action) => {
        const payload = action.payload;
        for (const key of Object.keys(viewCanvasInitialState) as (keyof ViewCanvasState)[]) {
            if (key in payload) {
                (state as any)[key] = payload[key];
            }
        }
    });
},
```

**viewUI extraReducers**（`view-ui.ts` L55-65）：同上逻辑，遍历 `viewUIInitialState` 的 key。

> 独立成文件（`view-actions.ts`）是为了避免 `modules/index.ts` 引入循环依赖。

---

## 4. Hooks

**源码位置**：`src/store/designer/hooks.ts`

### 4.1 useSetView（只写不读）

**源码位置**：`hooks.ts` L36-46

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

- 返回稳定的 `setView` 引用，不订阅任何 state
- 用 `batch(() => dispatch(updateView(partial)))` 批量更新，跨 `viewCanvas` 和 `viewUI` 两个 slice
- 直接传入 partial，`updateView` action 内部 `batch`

### 4.2 viewCanvas 字段级 hook（8 个）

**源码位置**：`hooks.ts` L50-57

| hook | 字段 |
| --- | --- |
| `useViewScale` | `scale` |
| `useViewLines` | `lines` |
| `useViewStartX` | `startX` |
| `useViewStartY` | `startY` |
| `useViewRulerWidth` | `rulerWidth` |
| `useViewRulerHeight` | `rulerHeight` |
| `useViewCanvasWidth` | `width` |
| `useViewCanvasHeight` | `height` |

### 4.3 viewUI 字段级 hook（8 个）

**源码位置**：`hooks.ts` L61-68

| hook | 字段 |
| --- | --- |
| `useViewTabsKey` | `tabsKey` |
| `useViewLayerCollapsed` | `layerCollapsed` |
| `useViewLayersTreeCollapsed` | `layersTreeCollapsed` |
| `useViewMaterialsListCollapsed` | `materialsListCollapsed` |
| `useViewSettingCollapsed` | `settingCollapsed` |
| `useViewCanvasToolbarCollapsed` | `canvasToolbarCollapsed` |
| `useViewVisible` | `visible` |
| `useViewIsShowReferLine` | `isShowReferLine` |

> 共 16 个字段级 hook（viewCanvas 8 + viewUI 8）。

---

## 5. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [01-data-model.md](./01-data-model.md) —— 数据模型（designerCanvas slice）
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
