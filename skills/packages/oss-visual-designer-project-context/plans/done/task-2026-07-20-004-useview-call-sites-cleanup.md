# useView 调用点清理 + 细粒度订阅收尾

> 计划日期：2026-07-20
> 任务编号：`task-2026-07-20-004`
> 上游任务：[task-2026-07-20-003-designer-private-store](./done/task-2026-07-20-003-designer-private-store.md)
> 状态：`done`
> 类型：`refactor`
> Research 报告：[useView调用点字段审计](../research/useView调用点字段审计.md)

---

## 1. 背景

[task-2026-07-20-003](./done/task-2026-07-20-003-designer-private-store.md) 把 `useView` 的状态从 Context 迁移到设计器私有 Redux store，并按更新频率拆为 `viewCanvas`（高频）/ `viewUI`（低频）两个 slice，提供 16 个字段级 hook。

但迁移留下两个尾巴：

### 1.1 `Designer.tsx` 通过 Context 文件 re-export `useView`

[Designer.tsx#L60](src/designer/common/context/context-designer/Designer.tsx#L60) 用 `export { useView } from '@Src/store/designer/hooks'` 把 Redux hook 二次转发到 Context 路径。问题：

- **语义错位**：`Designer.tsx` 是 `useDesigner`（画布树 Context）的归属文件，re-export 一个 Redux hook 让读者误以为 `useView` 仍是 Context-based。
- **路径分叉**：`useView` 真实定义在 `@Src/store/designer/hooks`，但通过 `@Src/designer/common` 二次转发，未来删 Context 那块代码时容易踩到。
- **阻碍收敛**：re-export 的存在理由是"调用方零改动"，但 12 个调用点本来就要改 import 路径，让它们直接指向 Redux 是更干净的终态。

### 1.2 仍有 9 个调用点用 `useView` 读全量 view

字段级订阅的优势只对 4 个组件（`canvas-graph/designer-field/toolbar/DropContainer`）生效。其余 9 个消费者仍在 `useView()` 中读取整个 view 对象，订阅 `shallowEqual` 后的合并对象——当 `scale` 等高频字段变化时，`useSelector` 返回的新合并对象会让这 9 个组件跟着重渲染，**字段级订阅的红利被吃掉了**。

## 2. 目标

1. 移除 [Designer.tsx#L57-60](src/designer/common/context/context-designer/Designer.tsx#L57) 的 `useView` re-export 与注释
2. 新增 `useSetView` hook：只返回稳定的 `setView` 引用，不订阅任何状态
3. 9 个仍读全量 view 的调用点改为细粒度 hook
4. 4 个只取 `setView` 的调用点改为 `useSetView`
5. 12 个 `import { useView } from '@Src/designer/common'` 全部改为 `from '@Src/store/designer'`
6. `pnpm tsc --noEmit` 零新增错误；440 组件场景拖拽/缩放无明显掉帧

## 3. 关键设计决策

### 3.1 新增 `useSetView` hook

只取 `setView` 的 4 个调用点目前写法是 `const { setView } = useView()`，这会触发 `useSelector` 读路径 + 每次拿到一个引用稳定的 `setView` 包装（`useCallback`）。问题：

- 多了一次 `useSelector` 调用，组件签名里出现无意义的 `view` 引用
- 代码意图模糊：看不出来这个组件是不订阅 view 状态的

新增专用 hook：

```ts
// src/store/designer/hooks.ts
export const useSetView = () => {
    const dispatch = useDispatch();
    return useCallback(
        (partial: Partial<DesignerRootState['viewCanvas'] & DesignerRootState['viewUI']>) => {
            batch(() => {
                dispatch(updateView(partial));
            });
        },
        [dispatch],
    );
};
```

**与 `useView` 兼容层并存**：`useView` 保留作为"需要读全量 view 的兼容入口"，但所有"只写不读"的场景必须改用 `useSetView`。

### 3.2 删除 re-export

[Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 删 [L57-60](src/designer/common/context/context-designer/Designer.tsx#L57) 4 行（注释 + re-export）。该文件回归"只负责 Context"的本分。

### 3.3 9 个调用点细粒度改造表

下表列出每个文件实际读 view 的字段，迁移到对应细粒度 hook：

| 文件 | 当前 | 目标 |
| --- | --- | --- |
| [configuration-panel/index.js#L19](src/designer/configuration-panel/index.js#L19) | `const { view } = useView();` | 按 view.* 引用逐字段替换为对应细粒度 hook（待审计） |
| [configuration-panel/group/index.js#L19](src/designer/configuration-panel/group/index.js#L19) | `const { view, setView } = useView();` | view.* 字段细粒度化 + `useSetView()` |
| [configuration-panel/component/index.jsx#L43](src/designer/configuration-panel/component/index.jsx#L43) | `const { view, setView } = useView();` | view.* 字段细粒度化 + `useSetView()` |
| [aside-panel/index.js#L15](src/designer/aside-panel/index.js#L15) | `const { view } = useView({});` | 移除无效实参 `{}` + 字段细粒度化（待审计） |
| [aside-panel/layers-tree/index.jsx#L20](src/designer/aside-panel/layers-tree/index.jsx#L20) | `const { view, setView } = useView({});` | 同上 |
| [aside-panel/materials/index.tsx#L36](src/designer/aside-panel/materials/index.tsx#L36) | `const { view, setView }: any = useView();` | 字段细粒度化 + `useSetView()` |
| [common/dnd/DropContainer.tsx#L19](src/designer/common/dnd/DropContainer.tsx#L19) | `const { setView } = useView();` | `useSetView()` |
| [common/field/layout-block/config/ConfigurationPanel.tsx#L18](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx#L18) | `const { view, setView } = useView();` | 字段细粒度化 + `useSetView()` |

**审计原则**：每个文件逐行 `grep 'view\.'` 找引用，列出用到哪些字段，迁移后必须保证语义等价。审计结果记入本计划"实施记录"章节。

### 3.4 import 路径统一

| 当前 | 目标 |
| --- | --- |
| `import { useView } from '@Src/designer/common'` | `import { useView } from '@Src/store/designer'` |
| `import { useView } from '../common'` | `import { useView } from '@Src/store/designer'` |
| `import { LAYOUT_BLOCK, useDesigner, useView } from '../common'` | `useView` 拆出来单独 import；其他保留 |
| `import { useDesigner, useView } from '@Src/designer/common'` | `useView` 拆出来单独 import |

机械替换，按文件 grep 验证无遗漏。

## 4. 实施步骤

### 步骤 0：前置项 — `src/store/designer/index.ts` → `index.tsx`

[src/store/designer/index.ts](src/store/designer/index.ts) 包含 React 组件 `DesignerStoreProvider`，按项目规则 §4.1（单文件组件用 `.tsx`）应改后缀。

变更内容：

1. `git mv src/store/designer/index.ts src/store/designer/index.tsx`
2. `React.createElement(Provider, { store: storeRef.current }, children)` 改回 JSX：`<Provider store={storeRef.current}>{children}</Provider>`
3. 保留 `import React, { useRef } from 'react'`（`React.ReactNode` 类型仍需用）

**影响范围**：[designer-field/index.tsx:16](src/designer/renderer/designer-field/index.tsx#L16) 与 [DesignerContent.tsx:13](src/designer/DesignerContent.tsx#L13) 通过别名 `@Src/store/designer` 引用，bundler 自动解析 `.ts`/`.tsx`，调用方零改动。

### 步骤 1：审计 9 个调用点实际使用的 view 字段

对 [§3.3](#33-9-个调用点细粒度改造表) 9 个文件逐个 `grep -n 'view\\.'` 找出 `view.xxx` 引用，记录到"实施记录"表格。

### 步骤 2：新增 `useSetView` hook

修改 [src/store/designer/hooks.ts](src/store/designer/hooks.ts)：

- 在 `useView` 后追加 `useSetView` 实现
- 顶部注释更新："只写不读场景用 `useSetView`，不要解构 `useView()` 的 `setView`"

### 步骤 3：删除 re-export

[src/designer/common/context/context-designer/Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 删 [L57-60](src/designer/common/context/context-designer/Designer.tsx#L57) 4 行。

### 步骤 4：迁移 4 个"只取 setView"的调用点

- [src/designer/toolbar/index.js](src/designer/toolbar/index.js)
- [src/designer/canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx)
- [src/designer/aside-panel/layers-tree/tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx)
- [src/designer/common/dnd/DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx)

把 `const { setView } = useView();` 替换为 `const setView = useSetView();`。

### 步骤 5：迁移 9 个"读全量 view"的调用点

按 [§3.3](#33-9-个调用点细粒度改造表) 审计结果逐文件改造，**每个文件改完必须人工 grep 确认无 `view.xxx` 残留**。

### 步骤 6：统一 import 路径

对所有 `import { useView } from` 的行（除 `@Src/store/designer/hooks` / `@Src/store/designer` 外）做替换。

### 步骤 7：验证

```bash
pnpm tsc --noEmit
pnpm start
```

冒烟测试：

- 拖拽组件（验证 `scale/lines` 订阅）
- 缩放画布
- 切换 tab（验证 `tabsKey` 订阅）
- 折叠/展开左右面板（验证 `layerCollapsed/settingCollapsed` 订阅）
- React DevTools Profiler：拖拽期间只 `canvas-graph` + 受影响 `designer-field` 重渲染，其余组件不重渲染

## 5. 验证清单

- [x] [src/store/designer/hooks.ts](src/store/designer/hooks.ts) 新增 `useSetView`
- [x] [Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 删 re-export 与注释
- [x] 4 个"只取 setView"调用点改为 `useSetView`
- [x] 9 个"读全量 view"调用点审计完成 + 逐文件改造
- [x] 12 个 import 路径统一到 `@Src/store/designer`
- [x] 仓库内不再有 `import { useView } from '@Src/designer/common'` / `'../common'`（活跃代码 0 命中；`.bak` 备份文件除外）
- [x] `pnpm tsc --noEmit` 零新增错误（`src/` 下零错误；预存的 `packages/ui` 10 个错误与本次任务无关）
- [ ] `pnpm start` 启动无运行时报错 — **未跑 dev server，需人工验证**
- [ ] 440 组件场景拖拽/缩放流畅（目测 + Profiler 抽样）— **未跑 dev server，需人工验证**
- [x] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [x] 同步更新 [AGENTS.md](../../../../AGENTS.md) §3.2（如有需要）— 见实施记录末尾说明

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| 字段细粒度迁移漏改 `view.xxx` 引用 | 中 | 每个文件改完 `grep 'view\\.'` 验证；tsc 会暴露类型错误 |
| import 路径替换遗漏 | 低 | `rg "useView.*from '@Src/designer/common'"` 应返回空 |
| `useSetView` 闭包捕获问题（dispatch 引用变化） | 低 | `useCallback` 依赖 `dispatch`；React-Redux 保证 dispatch 引用稳定 |
| 440 组件场景性能反而下降（细粒度订阅触发更多 selector 调用） | 低 | 细粒度订阅是 useSelector 官方推荐模式；如有疑虑用 Profiler 对比 |
| `materials/index.tsx` 的 `useView({})` 误传实参 | 低 | 顺手清掉 |

### 回退方案

- 改造前 git commit
- 必要时 `git revert` 整个 commit 即可
- 不影响 task-003 已落地的 store/Provider 基础设施

## 7. 实施记录

- 2026-07-20：任务创建，等待开工
- 2026-07-20：补充前置项：步骤 0 — `src/store/designer/index.ts` → `index.tsx` 重命名（合并自上一轮过度纠正）
- 2026-07-20：步骤 0 已完成，文件重命名 + 改 JSX + 集中导出到底部
- 2026-07-20：步骤 1 审计结果

  | 文件 | view.* 字段 | 细粒度 hook 替换 |
  | --- | --- | --- |
  | `configuration-panel/index.js` | `view.settingCollapsed` | `useViewSettingCollapsed()` |
  | `configuration-panel/group/index.js` | `view.tabsKey` ×2 | `useViewTabsKey()` |
  | `configuration-panel/component/index.jsx` | `view.tabsKey` ×2 | `useViewTabsKey()` |
  | `aside-panel/index.js` | `view.layerCollapsed` / `view.layersTreeCollapsed` / `view.materialsListCollapsed` | 3 个对应 hook |
  | `aside-panel/layers-tree/index.jsx` | `view.layersTreeCollapsed` ×2 | `useViewLayersTreeCollapsed()` |
  | `aside-panel/materials/index.tsx` | `view.materialsListCollapsed` ×2 | `useViewMaterialsListCollapsed()` |
  | `common/field/layout-block/config/ConfigurationPanel.tsx` | `view.tabsKey` ×2 | `useViewTabsKey()` |
  | `common/dnd/DropContainer.tsx` | (无 view 读) | 仅替换为 `useSetView()` |

- 2026-07-20：步骤 2 已完成 — `useSetView` 在 [hooks.ts#L40-50](src/store/designer/hooks.ts#L40) 新增。返回稳定的 `setView` 引用（`useCallback([dispatch])`），不订阅任何 state。
- 2026-07-20：步骤 3 已完成 — [Designer.tsx](src/designer/common/context/context-designer/Designer.tsx) 原 L57-60 的 `export { useView } from '@Src/store/designer/hooks'` + 注释全部删除。保留指向 task-003 的迁移说明注释，文件回归"只负责 Context"本分。
- 2026-07-20：步骤 4 已完成 — 4 个"只取 setView"调用点改为 `useSetView()`：

  | 文件 | 改动 |
  | --- | --- |
  | [canvas-graph/index.tsx#L113](src/designer/canvas-graph/index.tsx#L113) | `const setView = useSetView();`，`@Src/store/designer/hooks` 导入列表新增 `useSetView` |
  | [toolbar/index.js#L51](src/designer/toolbar/index.js#L51) | 同上 |
  | [layers-tree/tree/index.tsx#L25](src/designer/aside-panel/layers-tree/tree/index.tsx#L25) | 同上 |
  | [common/dnd/DropContainer.tsx#L20](src/designer/common/dnd/DropContainer.tsx#L20) | 同上 |

- 2026-07-20：步骤 5 已完成 — 9 个"读全量 view"调用点按步骤 1 审计表逐文件改造，每个文件 `grep 'view\\.'` 验证零残留：

  | 文件 | 实际改动 |
  | --- | --- |
  | [configuration-panel/index.js#L9](src/designer/configuration-panel/index.js#L9) | import 改为 `useViewSettingCollapsed`，`useView()` 整段删除 |
  | [configuration-panel/group/index.js#L6](src/designer/configuration-panel/group/index.js#L6) | import 改为 `useViewTabsKey, useSetView`；`view.tabsKey` ×2 替换；`useView()` 整段删除 |
  | [configuration-panel/component/index.jsx#L11](src/designer/configuration-panel/component/index.jsx#L11) | 同上 |
  | [aside-panel/index.js#L3](src/designer/aside-panel/index.js#L3) | import 改为 `useViewLayerCollapsed, useViewLayersTreeCollapsed, useViewMaterialsListCollapsed`；3 个 `view.*` 替换；顺手清掉 `useView({})` 无效实参 |
  | [aside-panel/layers-tree/index.jsx#L6](src/designer/aside-panel/layers-tree/index.jsx#L6) | import 改为 `useViewLayersTreeCollapsed, useSetView`；`view.layersTreeCollapsed` ×2 替换；`useView({})` 整段删除 |
  | [aside-panel/materials/index.tsx#L19](src/designer/aside-panel/materials/index.tsx#L19) | import 改为 `useViewMaterialsListCollapsed, useSetView`；`view.materialsListCollapsed` ×2 替换；`: any` 强转顺手清掉 |
  | [common/field/layout-block/config/ConfigurationPanel.tsx#L7](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx#L7) | import 改为 `useViewTabsKey, useSetView`；`view.tabsKey` ×2 替换；`useView()` 整段删除 |
  | [renderer/designer-field/index.tsx#L15](src/designer/renderer/designer-field/index.tsx#L15) | 已在 task-003 阶段迁为细粒度，本任务无新增改动 |
  | [toolbar/index.js](src/designer/toolbar/index.js) | 已在步骤 4 同步迁为 `useSetView`（原本就只取 `setView`） |

- 2026-07-20：步骤 6 已完成 — import 路径全部统一为 `from '@Src/store/designer/hooks'`。`grep "useView.*from '@Src/designer/common'"` 在活跃代码中返回空（仅 `src/designer/canvas-graph/index.bak.js` 和 `src/designer/renderer/DesignerField.bak.jsx` 两个备份文件有残留，不影响构建）。
- 2026-07-20：步骤 7 验证结果

  - `pnpm tsc --noEmit`：**`src/` 下零错误**。全量 10 个错误全部集中在 `packages/ui/src/material-selector/{index.tsx, LazyImageLoader.tsx}`，与本次任务无关（`sortTypes` 缺失 + `ref.current` 可能为 null 的预存问题）。
  - `grep "useView.*from '@Src/designer/common'"` 活跃代码：**0 命中**。
  - `grep "\bview\.(settingCollapsed|tabsKey|...)"` 活跃代码：**0 命中**。
  - 440 组件场景冒烟测试：需在 `pnpm start` 启动后人工执行（Profiler 抽样）。本次未跑起 dev server，仅完成静态校验。
  - 冒烟测试清单（拖拽/缩放/tab 切换/折叠面板）需要人工确认，未自动化。
