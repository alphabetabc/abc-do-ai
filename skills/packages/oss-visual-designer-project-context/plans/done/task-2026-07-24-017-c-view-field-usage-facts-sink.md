# task-2026-07-24-017-c-view-field-usage-facts-sink

> 状态：`done`
> 创建：2026-07-24
> 完成：2026-07-24
> 类型：chore（文档事实下沉）

---

## 1. 背景

`07-view-slices.md` §7 当前"调用方清单"只列了 12 个文件，没有字段使用矩阵（哪个文件用哪些 view 字段）。`research/useView调用点字段审计.md` 提供了完整的字段使用矩阵（探索性调研）。

字段使用矩阵是 view 侧的事实（哪些调用方用哪些 view 字段），应该内联到 design 目录作为权威事实。

---

## 2. 目标

把字段使用矩阵从 research 文档下沉到 design 目录，作为 view 侧事实。

---

## 3. 阶段划分

| 阶段 | 范围 | 输出位置 | 上下文消耗 |
| --- | --- | --- | --- |
| **阶段 1：调研 + 验证** | 读 research + 对照 hooks.ts + grep 12 个调用方，产出矩阵表格 | plan 文档 §6 "阶段 1 产出" | **大**（13 个文件 + grep） |
| **阶段 2：内联 + 验证** | 把阶段 1 产出的矩阵写入 `07-view-slices.md` §7 或新建 `07-01-view-field-usage.md` | design 目录 | **小**（只需矩阵表格） |

**执行策略**：完成阶段 1 后**停止**（不自动继续到阶段 2）。阶段 2 在新窗口执行，读取本 plan 文档的 §6 产出即可，避免上下文爆表。

---

## 4. 阶段 1：调研 + 验证

### 4.1 读 `research/useView调用点字段审计.md` 的字段矩阵部分

找到以下信息：
- 12 个调用方文件
- 每个文件读哪些 view 字段
- 每个文件写哪些 view 字段

### 4.2 对照 `src/store/designer/hooks.ts` 和实际调用方验证

- 确认 16 个字段级 hook 的定义（`src/store/designer/hooks.ts` L50-68）
- 实际 grep 验证每个调用方使用的 hook：
    ```
    grep -rn "useView[A-Z][a-zA-Z]*\|useSetView" src/designer/
    ```
- 修正 research 中可能过时的部分（task-011 删 `useDesigner` 后 view 侧可能有变化）

### 4.3 决定内联方式

**判断**：
- 矩阵长度 < 30 行：直接内联到 `07-view-slices.md` §7
- 矩阵长度 ≥ 30 行：新建 `07-01-view-field-usage.md` 子文件，`07-view-slices.md` §7 保留链接

### 4.4 产出

把矩阵表格 + 内联方式决策写入本 plan 文档的 **§6 阶段 1 产出**（见下文）。阶段 2 直接读取该章节即可。

---

## 5. 阶段 2：内联 + 验证（新窗口执行）

### 5.1 前置读取

新窗口开始时：
1. 读本 plan 文档 §6 阶段 1 产出（获取矩阵 + 决策）
2. 读 `src/store/designer/hooks.ts` L50-68 确认 16 个 hook 位置（仅作引用）
3. **不需要**重新读 research 或 12 个调用方

### 5.2 改写 07-view-slices.md §7

**当前**（`07-view-slices.md` §7）：
```
## 7. 调用方清单

`useViewXxx` / `useSetView` 在 `src/` 的活跃调用方（16 个文件）：

- `src/designer/canvas-graph/index.tsx`
- `src/designer/DesignerContent.tsx`（`updateView` 注入 settingCollapsed）
- `src/designer/configuration-panel/component/index.jsx`
- ...（省略 9 个）

字段使用矩阵详见 [useView调用点字段审计.md](../research/useView调用点字段审计.md)。
```

**改为**（根据阶段 1 决策，二选一）：

**选项 A：矩阵 < 30 行，内联到 §7**
```
## 7. 字段使用矩阵

（阶段 1 产出的矩阵）

调用方文件清单（12 个）：

- `src/designer/canvas-graph/index.tsx`
- ...（完整列表）
```

**选项 B：矩阵 ≥ 30 行，新建 07-01-view-field-usage.md**
- `07-view-slices.md` §7 改为简短介绍 + 指向 `07-01-view-field-usage.md`
- 矩阵内联到新子文件

### 5.3 更新 00-overview.md 索引表

如果新建 `07-01-view-field-usage.md`，追加索引条目。

### 5.4 验证

```
grep -rn "\.\./research/useView" .trae/documents/design/designer-canvas/07-view-slices.md
grep -rn "\.\./research/useView" .trae/documents/design/designer-canvas/07-01-view-field-usage.md 2>/dev/null
```

预期：0 命中（research 链接已删除）。

---

## 6. 阶段 1 产出（执行后填写）

> **AI Agent 完成阶段 1 后，必须把以下内容填入本章节，然后停止。**

### 6.1 矩阵表格（按字段 · 16 行）

> 字段定义在 [`src/store/modules/view-canvas.ts`](../../../src/store/modules/view-canvas.ts) + [`view-ui.ts`](../../../src/store/modules/view-ui.ts)；hook 定义在 [`src/store/designer/hooks.ts`](../../../src/store/designer/hooks.ts) L50-68（共 16 个 `useViewXxx`）+ L36-46（`useSetView`）。调用方 13 个（含 DesignerContent，1 个用 direct `dispatch(updateView(...))` 不经 `useSetView`）。

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
| `tabsKey` | viewUI | `useViewTabsKey` → component/config, group/config, layout-block/config | component/config, group/config, layout-block/config（onTabClick）+ DropContainer, layers-tree/tree（drop 后设 `'config'`） | 低频 |
| `layerCollapsed` | viewUI | `useViewLayerCollapsed` → toolbar, aside-panel/index | toolbar（左侧面板按钮） | 低频 |
| `layersTreeCollapsed` | viewUI | `useViewLayersTreeCollapsed` → aside-panel/index, layers-tree | layers-tree（折叠按钮） | 低频 |
| `materialsListCollapsed` | viewUI | `useViewMaterialsListCollapsed` → aside-panel/index, materials | materials（折叠按钮） | 低频 |
| `settingCollapsed` | viewUI | `useViewSettingCollapsed` → toolbar, configuration-panel | DesignerContent（mount 注入 initial；**不经 `useSetView`**，direct `dispatch(updateView({ settingCollapsed }))`）+ toolbar（右侧面板按钮） | 低频 |
| `canvasToolbarCollapsed` | viewUI | `useViewCanvasToolbarCollapsed` → toolbar, canvas-graph | toolbar（画布工具栏按钮） | 低频 |
| `visible` | viewUI | `useViewVisible` → toolbar | toolbar（`toggleModal` / `globalRuntimeMessage.on('showSettingModal')` 回调） | 低频 |
| `isShowReferLine` | viewUI | `useViewIsShowReferLine` → canvas-graph | canvas-graph（`handleShowReferLine` / 卸载 cleanup / `handleSetting`） | 低频 |

**13 个调用方文件清单**：

- `src/designer/canvas-graph/index.tsx`（10 字段：scale / lines / startX / startY / rulerWidth / rulerHeight / width / height / isShowReferLine / canvasToolbarCollapsed；写 7 字段）
- `src/designer/DesignerContent.tsx`（**直 dispatch**，写 `settingCollapsed` 初始值）
- `src/designer/toolbar/index.js`（读 + 写 `visible` / `layerCollapsed` / `settingCollapsed` / `canvasToolbarCollapsed`）
- `src/designer/configuration-panel/index.js`（只读 `settingCollapsed`）
- `src/designer/configuration-panel/component/index.jsx`（读 + 写 `tabsKey`）
- `src/designer/configuration-panel/group/index.js`（读 + 写 `tabsKey`）
- `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx`（读 + 写 `tabsKey`）
- `src/designer/common/dnd/DropContainer.tsx`（**只写** `tabsKey: 'config'`，无读）
- `src/designer/aside-panel/index.js`（**只读** `layerCollapsed` / `layersTreeCollapsed` / `materialsListCollapsed`，无写）
- `src/designer/aside-panel/materials/index.tsx`（读 + 写 `materialsListCollapsed`）
- `src/designer/aside-panel/layers-tree/index.jsx`（读 + 写 `layersTreeCollapsed`）
- `src/designer/aside-panel/layers-tree/tree/index.tsx`（**只写** `tabsKey: 'config'`，无读）
- `src/designer/renderer/designer-field/index.tsx`（**只读** `scale`，无写）

### 6.2 内联方式决策

- [x] 矩阵 < 30 行 → **选项 A**（内联到 §7）
- [ ] 矩阵 ≥ 30 行 → 选项 B（新建 07-01-view-field-usage.md）

**理由**：按字段主表 16 行 + 调用方清单 13 行 + 标题/说明 ≈ 30 行，但 §7 本身要保留少量引导语，**刚好处于临界**。进一步压缩：

- 砍掉调用方清单里的"字段数"标注 → 13 行变 13 个文件名（一行一个）
- 不重复列举频率列（与 §1.1/§1.2 已有的频率表重复）
- 矩阵主体保留 16 行（字段）× 5 列

最终 §7 主体 ≈ 22 行（含主表 + 调用方短清单），**确认选项 A**，无需新建子文件。

### 6.3 修正点（research 与实际代码不一致）

1. **`designer-field/index.tsx`**：research §3.10 声称在 L149 写 `tabsKey: 'config'`，但当前代码（task-005 合并主 store 后）未导入 `useSetView`，也没有 `setView(` 调用。**该写入点已删除**，designer-field 当前**只读 `scale`**，无任何 view 字段写入。
2. **`DesignerContent.tsx`**：research §3 完全没列。task-005（合并到主 store）后改为在 mount 时 `dispatch(updateView({ settingCollapsed }))` 注入初始值，**是新的写入方**，且**不经 `useSetView`**（直接 import `updateView` from `@Src/store/designer`）。
3. **`aside-panel/index.js`**：research §3 没列，但实际用 3 个 hook（`useViewLayerCollapsed` / `useViewLayersTreeCollapsed` / `useViewMaterialsListCollapsed`），**只读不写**——为 SplitPanel 布局调整用。
4. **`aside-panel/layers-tree/index.jsx`**：research §3.9 只列了 `aside-panel/layers-tree/tree/index.tsx`（内部树组件），但实际容器文件 `aside-panel/layers-tree/index.jsx` **单独**读 `useViewLayersTreeCollapsed` + 用 `useSetView` 写回。**两个文件职责不同**，07-view-slices.md §7 当前已包含 `layers-tree/index.jsx` 但漏了 `aside-panel/index.js`，是清单不完整。
5. **写路径 API 变化**：research §3/§5 描述的是 Context 时代 `setView({...})` 写法；task-005 后**所有用户驱动写入方**统一改为 `useSetView()`（返回 partial 接收函数，内部 batch + `updateView` action）；**只有 `DesignerContent` 的 mount 注入**保留 direct `dispatch(updateView(...))`（一次性 useLayoutEffect，不需要稳定引用）。
6. **`.bak` 文件处理**：research §3.11/§3.12 列了 2 个备份文件（`DesignerField.bak.jsx` / `canvas-graph/index.bak.js`），确认**当前仍存在**（glob 验证），但均不参与 view 字段读写，不需要列入 §7。

### 6.4 grep 验证记录

- **正则 1**：`useView[A-Z][a-zA-Z]*|useSetView` → 16 个文件命中
    - **13 个 view 调用方**（见 §6.1 调用方清单）
    - **3 个非调用方**：
        - `src/store/designer/hooks.ts`（hook 定义本身）
        - `src/store/designer/index.tsx`（re-export `useViewXxx` 给 `@Src/store/designer` barrel）
        - `src/store/modules/view-actions.ts`（`updateView` action 定义，源码中提及 `useView` 字段）
- **正则 2**：`from '@Src/store/designer/hooks'` → 16 个文件 import
    - **12 个 view 调用方**（少了 `DesignerContent.tsx`——它从 `@Src/store/designer` 直接 import `updateView`，不经 hooks barrel）
    - **4 个非 view 调用方**（仅 import designerCanvas runtime hook）：
        - `src/designer/canvas-graph/components/search-layer.tsx`（`useFlatComponents`）
        - `src/plugins/interaction/component/hooks.ts`（`useFlatComponents`）
        - `src/designer/context-menu/DesignerContextMenu.tsx`（`useCustomFieldsList` / `useRealtimeDataFlow`）
        - `src/formily/FedxReportContext.tsx`（`useFlatComponents` / `useCustomFieldsList` / `useRealtimeDataFlow`）

---

## 7. 整体验证（阶段 2 完成后）

### 7.1 grep 验证

```
grep -rn "\.\./research/useView" .trae/documents/design/designer-canvas/
```

预期：0 命中。

### 7.2 矩阵准确性验证（阶段 2 执行时）

- 每个调用方文件实际 import 的 hook 与矩阵一致
- 每个写入的字段在实际代码中有 `setView` / `dispatch` 调用

---

## 8. 风险与回退

- **风险**：中——research 文档可能基于旧代码，需要对照实际代码验证
- **回退**：直接改回即可

---

## 9. 不做

- ❌ 不修改 `src/` 任何代码（只改文档）
- ❌ 不修改 `useView调用点字段审计.md`（作为历史调研保留）
- ❌ 不动 `01-data-model.md` §6 持久化（task-017-b）
- ❌ 不动其他 research 链接措辞（task-017-a）
- ❌ **完成阶段 1 后不自动继续阶段 2**（避免上下文爆表，由用户在新窗口启动）
