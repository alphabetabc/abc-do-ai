# task-2026-08-06-002：designer-plugins createViewPlugin

> 创建日期：2026-08-06
> 状态：`done`（2026-08-06 完成）
> 类型：`feature`
> 前置任务：task-2026-08-06-001（包骨架 + 业务类型预设）
> 前置文档：
> - [research/designer-plugins-研究报告.md](../research/designer-plugins-研究报告.md)
> - [design/designer-core/03-read-path.md](../design/designer-core/03-read-path.md)

---

## 1. 背景与目标

### 1.1 背景

task-006 已完成包骨架 + 业务类型定义 + 预设 `createDesigner`。本 task 实现 `createViewPlugin`——管理 viewCanvas（画布高频状态）和 viewUI（UI 低频状态）。

### 1.2 定位决策：方案 B（放入 extra）

viewCanvas / viewUI 放入 `TreeStoreState.extra`，走 `setPartialState` 浅合并。

理由：
1. `useStoreWithEqualityFn` 的 selector + equalityFn 已隔离无关变化
2. 统一 store 消费简单
3. `useExtra` + `shallowEqual` 机制已存在
4. Tango 用独立模型是因为 MobX 的 observable 粒度不同

### 1.3 目标

1. 实现 `createViewPlugin`：返回 view hooks + 空壳 plugin
2. 提供 18 个细粒度 view hooks（对应 src/store/designer/hooks.ts 的现有模式）
3. 补充测试

### 1.4 不做什么

- 不实现 P1-P4 插件
- 不改 src/ 代码（应用层迁移到 designer-app 是后续任务）

---

## 2. 详细步骤

### 2.1 目录结构

```
packages-next/designer-plugins/src/
└── view/
    ├── index.ts          # createViewPlugin 导出
    ├── types.ts          # ViewPlugin 接口 + ViewPluginOptions
    └── plugin.ts         # createViewPlugin 实现
```

### 2.2 `view/types.ts`

```ts
import type { Plugin } from '@fedx-vis/designer-core';
import type { ViewCanvasState, ViewUIState } from '../shared/types';

export interface ViewPluginOptions {
    initialViewCanvas?: Partial<ViewCanvasState>;
    initialViewUI?: Partial<ViewUIState>;
}

export interface ViewPlugin {
    /** 空壳插件（view 状态走 extra，不需要 PluginContext） */
    plugin: Plugin;
    /** 画布高频字段 hooks */
    useViewScale: () => number;
    useViewLines: () => { h: number[]; v: number[] };
    useViewStartX: () => number;
    useViewStartY: () => number;
    useViewRulerWidth: () => number;
    useViewRulerHeight: () => number;
    useViewCanvasWidth: () => number;
    useViewCanvasHeight: () => number;
    /** UI 低频字段 hooks */
    useViewTabsKey: () => string;
    useViewLayerCollapsed: () => boolean;
    useViewLayersTreeCollapsed: () => boolean;
    useViewMaterialsListCollapsed: () => boolean;
    useViewSettingCollapsed: () => boolean;
    useViewCanvasToolbarCollapsed: () => boolean;
    useViewVisible: () => boolean;
    useViewIsShowReferLine: () => boolean;
    /** 只写 hook（跨 viewCanvas + viewUI 批量更新） */
    useSetView: () => (patch: Partial<ViewCanvasState> & Partial<ViewUIState>) => void;
}
```

### 2.3 `view/plugin.ts`

store 注入方案：**方案 B（useDesigner Context）**——hooks 内部通过 `useDesigner()` 获取 store，不依赖闭包。

```ts
import { useCallback } from 'react';
import {
    useDesigner,
    useExtra,
    shallowEqual,
    type Plugin,
} from '@fedx-vis/designer-core';
import type { ViewCanvasState, ViewUIState } from '../shared/types';
import type { ViewPlugin, ViewPluginOptions } from './types';

export function createViewPlugin(_options?: ViewPluginOptions): ViewPlugin {
    const plugin: Plugin = {
        name: 'view-plugin',
        type: 'cross-slice-sync',
        init: () => () => {}, // noop cleanup
    };

    const useViewScale = () => useExtra(useDesigner().store, (s) => s.viewCanvas.scale);
    const useViewLines = () => useExtra(useDesigner().store, (s) => s.viewCanvas.lines, shallowEqual);
    const useViewStartX = () => useExtra(useDesigner().store, (s) => s.viewCanvas.startX);
    const useViewStartY = () => useExtra(useDesigner().store, (s) => s.viewCanvas.startY);
    const useViewRulerWidth = () => useExtra(useDesigner().store, (s) => s.viewCanvas.rulerWidth);
    const useViewRulerHeight = () => useExtra(useDesigner().store, (s) => s.viewCanvas.rulerHeight);
    const useViewCanvasWidth = () => useExtra(useDesigner().store, (s) => s.viewCanvas.width);
    const useViewCanvasHeight = () => useExtra(useDesigner().store, (s) => s.viewCanvas.height);

    const useViewTabsKey = () => useExtra(useDesigner().store, (s) => s.viewUI.tabsKey);
    const useViewLayerCollapsed = () => useExtra(useDesigner().store, (s) => s.viewUI.layerCollapsed);
    const useViewLayersTreeCollapsed = () => useExtra(useDesigner().store, (s) => s.viewUI.layersTreeCollapsed);
    const useViewMaterialsListCollapsed = () => useExtra(useDesigner().store, (s) => s.viewUI.materialsListCollapsed);
    const useViewSettingCollapsed = () => useExtra(useDesigner().store, (s) => s.viewUI.settingCollapsed);
    const useViewCanvasToolbarCollapsed = () => useExtra(useDesigner().store, (s) => s.viewUI.canvasToolbarCollapsed);
    const useViewVisible = () => useExtra(useDesigner().store, (s) => s.viewUI.visible);
    const useViewIsShowReferLine = () => useExtra(useDesigner().store, (s) => s.viewUI.isShowReferLine);

    const useSetView = () => {
        const { store } = useDesigner();
        return useCallback(
            (patch: Partial<ViewCanvasState> & Partial<ViewUIState>) => {
                const state = store.getState();
                const viewCanvasPatch: Partial<ViewCanvasState> = {};
                const viewUIPatch: Partial<ViewUIState> = {};

                // 分离 viewCanvas 和 viewUI 字段
                for (const key in patch) {
                    if (key in state.extra.viewCanvas) {
                        (viewCanvasPatch as any)[key] = (patch as any)[key];
                    } else if (key in state.extra.viewUI) {
                        (viewUIPatch as any)[key] = (patch as any)[key];
                    }
                }

                store.setPartialState({
                    extra: {
                        ...(Object.keys(viewCanvasPatch).length > 0
                            ? { viewCanvas: { ...state.extra.viewCanvas, ...viewCanvasPatch } }
                            : {}),
                        ...(Object.keys(viewUIPatch).length > 0
                            ? { viewUI: { ...state.extra.viewUI, ...viewUIPatch } }
                            : {}),
                    },
                });
            },
            [store]
        );
    };

    return {
        plugin,
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
        useSetView,
    };
}
```

### 2.4 `view/index.ts`

```ts
export { createViewPlugin } from './plugin';
export type { ViewPlugin, ViewPluginOptions } from './types';
```

### 2.5 更新 `src/index.ts` 导出

在 task-006 的 index.ts 基础上追加：

```ts
// === createViewPlugin ===
export { createViewPlugin, type ViewPlugin, type ViewPluginOptions } from './view';
```

---

## 3. 测试

### 3.1 测试文件

```
packages-next/designer-plugins/src/
└── __tests__/
    └── view-plugin.test.tsx
```

### 3.2 测试用例

1. **createViewPlugin 返回正确结构**：plugin.name / plugin.type / 18 个 hooks 是函数
2. **useSetView 更新 viewCanvas 字段**：调 `setView({ scale: 1.5 })` → `useViewScale()` 返回 1.5
3. **useSetView 更新 viewUI 字段**：调 `setView({ tabsKey: 'data' })` → `useViewTabsKey()` 返回 'data'
4. **useSetView 跨 viewCanvas + viewUI 批量更新**：一次调用同时改 scale + tabsKey
5. **字段级隔离**：改 viewCanvas.scale 不触发 viewUI 订阅者 re-render

---

## 4. 验证

| 验证项 | 方法 |
|---|---|
| 测试通过 | `pnpm --filter @fedx-vis/designer-plugins test` |
| 类型安全 | `pnpm --filter @fedx-vis/designer-plugins typecheck` |

---

## 5. 风险与回退

### 5.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| useDesigner 在 hooks 中取不到 store | 低 | 高 | 必须 DesignerProvider 包裹；测试用 renderHook + Provider |
| useExtra 的 equalityFn 对 number/string 默认 Object.is 足够 | 高 | 低 | 基本类型不需要 shallowEqual；lines 对象需要 |

### 5.2 回退

删除 `src/view/` 目录 + 移除 index.ts 中的导出即回退。

---

## 6. 实施记录

### 6.1 落地文件清单

| 文件 | 行数 | 说明 |
| --- | --- | --- |
| `packages-next/designer-plugins/src/view/types.ts` | 53 | `ViewPlugin` / `ViewPluginOptions` 类型契约 |
| `packages-next/designer-plugins/src/view/plugin.ts` | 217 | `createViewPlugin` 实现（空壳 Plugin + 16 读 hook + 1 写 hook，用 usePersistFn） |
| `packages-next/designer-plugins/src/view/use-persist-fn.ts` | 35 | 本地 usePersistFn（与 packages/hooks/src/usePersistFn.ts 同源，去除 lodash 依赖） |
| `packages-next/designer-plugins/src/view/index.ts` | 8 | barrel 导出 |
| `packages-next/designer-plugins/src/index.ts` | +7 | 追加 `createViewPlugin` 导出 |
| `packages-next/designer-plugins/src/__tests__/view-plugin.test.tsx` | 217 | 5 个用例 |

### 6.2 关键实施决策（相对原计划的修正）

1. **`useExtra` 不需要外部传 `shallowEqual`**：`useExtra(store, selector)` 内部已用 `shallowEqual`（`designer-core/react/hooks.ts:175`）。原计划 `useExtra(useDesigner().store, selector, shallowEqual)` 第 3 个参数会被 TS 拒绝（签名只接受 2 个参数），已修正。

2. **`useDesigner()` 返回 `Designer<defaults>`，store 的 TExtra 是 `Record<string, unknown>`**：导致 selector 中 `s.viewCanvas` 被推为 `unknown`。新增 `useTypedStore()` 内部 helper 做 `as unknown as TreeStoreApi<WidgetData, ...>` 类型 cast（运行时完全兼容，因为 hook 闭包在 `createDesigner` 内创建时已绑定业务类型）。

3. **`ViewPlugin.plugin` 必须显式标注泛型**：`Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>`，否则 `createDesigner({ plugins: [view.plugin] })` 会因 Plugin 逆变位置不兼容而报错（Plugin<defaults> 不能赋值给 Plugin<WidgetData,...>）。

4. **`useSetView` 必须始终发送完整 `extra`**：designer-core 的 `setPartialState` 是顶层浅合并（`state` 上 spread `payload`），不能只送部分 extra 字段——否则另一字段会被覆盖丢失。原计划代码存在该隐患，已修正：
   - 始终发送 `{ viewCanvas, viewUI }` 两字段
   - 未改动的字段保留原引用（`useExtra` + `shallowEqual` 命中，避免无谓 re-render）
   - 全部为未知字段时早退

5. **测试辅助 `renderHookWithProvider` 处理 DesignerProvider 类型不兼容**：`DesignerProvider.designer` prop 类型为 `Designer<defaults>`，与 `DesignerInstance`（WidgetData 具体化）不兼容（setTree 逆变）。运行时完全兼容，内部用 `as unknown as Designer` cast 一次。

6. **`createElement` 必须显式传 `children`**：`createElement(DesignerProvider, { designer }, child)` 在 @types/react 17 下会让 children 被识别为缺失（DesignerProvider 的 props 类型中 children 是 required）。改为 `{ designer, children: child }` 单 prop 对象。

7. **`useSetView` 用 `usePersistFn` 替代 `useCallback`**（用户提议 + 后续调整）：
   - 与 `packages/hooks/src/usePersistFn.ts` 同源（ahooks 经典实现），但**复制到本地** `view/use-persist-fn.ts`，避免引入 `@fedx-vis/hooks` → `lodash-es` / `@fedx-vis/share` / `@fedx-vis/utils` 传递依赖
   - `Noop` 类型用本地 `(...args: any[]) => any` 定义，去除 `lodash-es` 的 `typeof noop` 依赖
   - 行为：返回的 fn 引用永远稳定（首次 render 后），调用时走最新 fn 闭包；与 `useCallback(fn, [store])` 在 store 不变场景下行为等价，但省去维护 deps 的负担

### 6.3 实施步骤时间线

1. ✅ Read 验证：`useDesigner()` / `useExtra` / `shallowEqual` / `Plugin` / `setPartialState` / `ViewCanvasState` / `ViewUIState` 全部签名一致
2. ✅ 创建 `view/types.ts`
3. ✅ 创建 `view/plugin.ts`
4. ✅ 创建 `view/index.ts`
5. ✅ 更新 `src/index.ts` 追加导出
6. ✅ 创建 `__tests__/view-plugin.test.tsx`（5 用例：结构契约 / viewCanvas 单字段 / viewUI 单字段 / 跨字段批量 / 字段级隔离）
7. ✅ `pnpm typecheck` 通过
8. ✅ `pnpm test` 通过（13 tests passed: 8 bootstrap + 5 view-plugin）
9. ✅ 归档到 `plans/done/` + 更新 roadmap

### 6.4 验证

```
$ pnpm typecheck
> tsc --noEmit
（exit 0）

$ pnpm test
 RUN  v4.1.10 E:/oss-fe-git/frame/oss-visual-designer/packages-next/designer-plugins
 ✓ src/__tests__/bootstrap.test.ts (8 tests) 16ms
 ✓ src/__tests__/view-plugin.test.tsx (5 tests) 67ms
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

### 6.5 未实施 / 后续

- 应用层迁移（src/store/designer/hooks.ts 改为消费 view plugin hooks）按计划 §1.4 推迟到 designer-app 阶段
- P1-P4 插件（layerOps / groupManagement / dataFetcher / interaction）后续 task 跟进
- 未创建使用文档（research/designer-plugins-研究报告.md §3.3 已有 createViewPlugin 接口设计，可直接参考 `view/types.ts`）
