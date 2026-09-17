# useView 调用点字段使用审计

> 审计日期：2026-07-20
> 任务编号：`task-2026-07-20-003`
> 审计范围：12 个 `useView()` 调用点
> 目的：为 slice 拆分（`viewCanvas` / `viewUI`）提供字段使用依据

---

## 1. 审计方法

对每个 `useView()` 调用点，搜索：
- **读取字段**：`view.xxx`（解构后的变量也算）
- **写入字段**：`setView({ xxx: ... })`

---

## 2. 字段使用矩阵

| 字段 | 读取点 | 写入点 | 更新频率 | 归属 slice |
| --- | --- | --- | --- | --- |
| `scale` | canvas-graph, designer-field | canvas-graph | **高频**（缩放/拖拽每帧） | `viewCanvas` |
| `lines` | canvas-graph | canvas-graph | **高频**（拖拽时对齐线每帧） | `viewCanvas` |
| `startX` | canvas-graph（隐式，通过 view 解构） | （初始化时） | 中频（画布滚动） | `viewCanvas` |
| `startY` | canvas-graph（隐式） | （初始化时） | 中频（画布滚动） | `viewCanvas` |
| `rulerWidth` | canvas-graph | canvas-graph | 中频（窗口 resize） | `viewCanvas` |
| `rulerHeight` | canvas-graph | canvas-graph | 中频（窗口 resize） | `viewCanvas` |
| `width` | canvas-graph | canvas-graph | 低频（页面尺寸切换） | `viewCanvas` |
| `height` | canvas-graph | canvas-graph | 低频（页面尺寸切换） | `viewCanvas` |
| `tabsKey` | configuration-panel/index, component/index, group/index, layout-block/ConfigurationPanel, designer-field, DropContainer, layers-tree/tree | 上述 7 个文件 | 低频（用户点击 tab） | `viewUI` |
| `visible` | toolbar | toolbar | 低频（打开/关闭模态） | `viewUI` |
| `layerCollapsed` | toolbar | toolbar | 低频（点击折叠） | `viewUI` |
| `settingCollapsed` | toolbar, configuration-panel/index | toolbar | 低频（点击折叠） | `viewUI` |
| `materialsListCollapsed` | aside-panel/materials | aside-panel/materials | 低频（点击折叠） | `viewUI` |
| `canvasToolbarCollapsed` | toolbar | toolbar | 低频（点击折叠） | `viewUI` |
| `isShowReferLine` | canvas-graph | canvas-graph | 低频（切换显示参考线） | `viewUI` |

> 注：`canvasToolbarCollapsed` 不在初始 state 中，但 toolbar 会读写它，需要加到 `viewUI` 的 state 里。

---

## 3. 各调用点详细字段使用

### 3.1 [toolbar/index.js](src/designer/toolbar/index.js) — 8 个字段

| 字段 | 操作 |
| --- | --- |
| `visible` | 读 + 写（toggleModal, setView({visible: true})） |
| `layerCollapsed` | 读 + 写 |
| `settingCollapsed` | 读 + 写 |
| `canvasToolbarCollapsed` | 读 + 写 |

**归属**：全部 `viewUI`

### 3.2 [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) — 9 个字段（高频）

| 字段 | 操作 | 频率 |
| --- | --- | --- |
| `rulerWidth` | 读（L103）+ 写（L182） | 中频（resize） |
| `rulerHeight` | 读（L103）+ 写（L183） | 中频（resize） |
| `scale` | 读（L103）+ 写（L111, L184） | **高频** |
| `lines` | 读（L103）+ 写（L190, L225, L276） | **高频** |
| `isShowReferLine` | 读（L103）+ 写（L189, L229, L275） | 低频 |
| `width` | 写（L208） | 低频 |
| `height` | 写（L209） | 低频 |
| `startX` | 隐式读（通过 view 解构） | — |
| `startY` | 隐式读（通过 view 解构） | — |

**归属**：`viewCanvas`（rulerWidth/rulerHeight/scale/lines/width/height/startX/startY）+ `viewUI`（isShowReferLine）

> **关键发现**：canvas-graph 是唯一的高频更新点，且同时读 `viewCanvas` 和 `viewUI` 的字段。但因为 `useSelector` 是字段级订阅，`isShowReferLine` 变化不会触发 canvas-graph 重渲染（除非它真的依赖 isShowReferLine）。

### 3.3 [configuration-panel/index.js](src/designer/configuration-panel/index.js) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `settingCollapsed` | 读（L24） |

**归属**：`viewUI`

### 3.4 [configuration-panel/component/index.jsx](src/designer/configuration-panel/component/index.jsx) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 读 + 写 |

**归属**：`viewUI`

### 3.5 [configuration-panel/group/index.js](src/designer/configuration-panel/group/index.js) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 读 + 写 |

**归属**：`viewUI`

### 3.6 [layout-block/config/ConfigurationPanel.tsx](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 读 + 写 |

**归属**：`viewUI`

### 3.7 [DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 写（L76，设置为 'config'） |

**归属**：`viewUI`

### 3.8 [aside-panel/materials/index.tsx](src/designer/aside-panel/materials/index.tsx) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `materialsListCollapsed` | 读 + 写 |

**归属**：`viewUI`

### 3.9 [aside-panel/layers-tree/tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx) — 1 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 写（L89，设置为 'config'） |

**归属**：`viewUI`

### 3.10 [renderer/designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) — 2 个字段

| 字段 | 操作 |
| --- | --- |
| `tabsKey` | 写（L149，设置为 'config'） |
| `scale` | 读（L313） |

**归属**：`viewCanvas`（scale）+ `viewUI`（tabsKey）

### 3.11 [renderer/DesignerField.bak.jsx](src/designer/renderer/DesignerField.bak.jsx) — 备份文件

**处理**：不改造，备份文件。

### 3.12 [canvas-graph/index.bak.js](src/designer/canvas-graph/index.bak.js) — 备份文件

**处理**：不改造，备份文件。

---

## 4. Slice 拆分方案

### 4.1 `viewCanvas` slice（高频 + 画布尺寸）

```ts
interface ViewCanvasState {
    scale: number;              // 缩放比例
    lines: { h: number[]; v: number[] };  // 对齐线
    startX: number;             // 标尺 x 轴起始点
    startY: number;             // 标尺 y 轴起始点
    rulerWidth: number;         // 标尺宽度
    rulerHeight: number;        // 标尺高度
    width: number;              // 画布宽度
    height: number;             // 画布高度
}
```

**消费者**：canvas-graph, designer-field

### 4.2 `viewUI` slice（低频 + UI 折叠/切换）

```ts
interface ViewUIState {
    tabsKey: string;                    // 当前激活的 tab
    layerCollapsed: boolean;            // 左侧面板开关
    layersTreeCollapsed: boolean;       // 图层树面板开关
    materialsListCollapsed: boolean;    // 资产面板开关
    settingCollapsed: boolean;          // 右侧配置面板开关
    canvasToolbarCollapsed: boolean;    // 画布工具栏开关
    visible: boolean;                   // 模态框可见性
    isShowReferLine: boolean;           // 是否显示参考线
}
```

**消费者**：toolbar, configuration-panel/*, DropContainer, aside-panel/materials, layers-tree/tree, designer-field, canvas-graph（仅 isShowReferLine）

### 4.3 拆分收益预估

| 场景 | 改造前（Context） | 改造后（Redux 字段级订阅） |
| --- | --- | --- |
| 拖拽时 `scale` 变化 | 12 个组件全重渲染 | **仅 canvas-graph + designer-field 重渲染**（2 个） |
| 切换 tab 时 `tabsKey` 变化 | 12 个组件全重渲染 | **仅订阅 tabsKey 的 7 个组件重渲染** |
| 折叠面板时 `layerCollapsed` 变化 | 12 个组件全重渲染 | **仅 toolbar 重渲染**（1 个） |

**性能提升**：拖拽场景从 12 → 2，减少 83% 的重渲染。

---

## 5. 改造清单

### 5.1 新建文件

| 文件 | 用途 |
| --- | --- |
| `src/store/designer/index.ts` | `createDesignerStore` + `DesignerStoreProvider` + 类型导出 |
| `src/store/designer/modules/view-canvas.ts` | `viewCanvas` slice |
| `src/store/designer/modules/view-ui.ts` | `viewUI` slice |
| `src/store/designer/modules/index.ts` | `combineReducers` |
| `src/store/designer/hooks.ts` | `useViewScale` / `useViewLines` 等字段级订阅封装 |

### 5.2 改造文件（10 个，排除 2 个 .bak）

| 文件 | 使用的字段 | 改造方式 |
| --- | --- | --- |
| [toolbar/index.js](src/designer/toolbar/index.js) | visible, layerCollapsed, settingCollapsed, canvasToolbarCollapsed | 改用 `useViewVisible()` / `useViewLayerCollapsed()` 等 hook |
| [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) | scale, lines, rulerWidth, rulerHeight, isShowReferLine, width, height | 改用 `useViewScale()` 等 hook（高频字段） + `useViewIsShowReferLine()`（低频字段） |
| [configuration-panel/index.js](src/designer/configuration-panel/index.js) | settingCollapsed | 改用 `useViewSettingCollapsed()` |
| [configuration-panel/component/index.jsx](src/designer/configuration-panel/component/index.jsx) | tabsKey | 改用 `useViewTabsKey()` + `useSetViewTabsKey()` |
| [configuration-panel/group/index.js](src/designer/configuration-panel/group/index.js) | tabsKey | 同上 |
| [layout-block/config/ConfigurationPanel.tsx](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx) | tabsKey | 同上 |
| [DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx) | tabsKey（仅写） | 改用 `useDispatch` + action creator |
| [aside-panel/materials/index.tsx](src/designer/aside-panel/materials/index.tsx) | materialsListCollapsed | 改用 `useViewMaterialsListCollapsed()` |
| [layers-tree/tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx) | tabsKey（仅写） | 改用 `useDispatch` + action creator |
| [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) | scale, tabsKey | 改用 `useViewScale()` + `useDispatch` for tabsKey |

### 5.3 修改文件

| 文件 | 修改 |
| --- | --- |
| [DataProvider.tsx](src/designer/DataProvider.tsx) | 移除 `ViewProvider`，改为在 `DesignerContent` 注入 `DesignerStoreProvider` |
| [DesignerContent.tsx](src/designer/DesignerContent.tsx) | 包裹 `DesignerStoreProvider` |
| [common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) | 移除 `useView` hook 实现 |
| [common/index.ts](src/designer/common/index.ts) | 移除 `useView` 导出，改为 re-export from `@Src/store/designer/hooks` |

### 5.4 删除文件/代码

- `ViewStoreContext` 定义
- `ViewProvider` 组件
- `useView` hook 实现

---

## 6. 风险与对策

### 6.1 `setView` 批量更新语义丢失

**问题**：原来 `setView({ scale: 2, lines: {...} })` 一次更新两个字段，改成 Redux 后需要两次 dispatch。

**对策**：
- RTK 默认会 batch 同一事件循环内的多次 dispatch（通过 `react-redux` 的 batched updates）
- 或者在 hook 封装里提供 `useSetView()` 返回一个可以批量更新的 setter

### 6.2 canvas-graph 同时读 viewCanvas 和 viewUI

**问题**：canvas-graph 同时用 `scale`（viewCanvas）和 `isShowReferLine`（viewUI），跨 slice 订阅。

**对策**：`useSelector` 支持跨 slice 订阅，分别调用两个 `useSelector` 即可，RTK 会自动合并订阅。

### 6.3 `startX` / `startY` 隐式读取

**问题**：canvas-graph 通过 `const { ... } = view` 解构，可能隐式读取了 `startX`/`startY` 但没显式列出来。

**对策**：改造时仔细检查 canvas-graph 的解构语句，确保所有用到的字段都显式订阅。

---

## 7. 后续工作建议

- 改造完成后，用 React DevTools Profiler 验证拖拽时的重渲染数量
- 考虑是否需要把 `useDesigner` 的部分字段（如 `page`）也做字段级订阅（但这个需要更复杂的方案，不在本任务范围）
