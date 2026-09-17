# task-2026-08-06-003：createLayerOpsPlugin — lock/unlock + show/hide

> 创建日期：2026-08-06
> 状态：`done`（2026-08-06 完成）
> 类型：`feature`
> 前置任务：task-2026-08-06-001（包骨架）、task-2026-08-06-002（createViewPlugin）、task-2026-08-06-006（插件注册表重构）

---

## 1. 背景与目标

### 1.1 背景

src/ 的 `layer-manager/lock` 和 `layer-manager/visible` 各有一对函数（lock/unlock、show/hide），本质都是改 `config.isLock` / `config.isHidden`。

旧实现用 `mergeFieldConfig`（Immer produce 深度合并）+ `setLevelPath`，新架构下直接用 `store.updateNode(id, { config: { isLock: true } })` 即可——`deepMergeKeys: ['config']` 会做二次浅合并。

### 1.2 目标

实现 `createLayerOpsPlugin` 的第一部分：lock/unlock + show/hide。

### 1.3 插件组装方式

采用**方案 B 聚合入口 + 可拔插**（task-006 落地）：

```ts
// 应用层组装
const designer = createDesigner({
    plugins: {
        view: createViewPlugin(),
        layerOps: createLayerOpsPlugin(),  // ← 本 task
        // groupMgmt 不传 → 不启用
    },
});

// 组件内通过 designer.layerOps 使用
function Toolbar() {
    const lock = designer.layerOps?.useLock();
    // ...
}
```

每个插件工厂返回 `{ plugin, useXxx, ... }`，`createDesigner` 自动：
1. 收集 `.plugin` 字段注册到 store
2. 把实例挂到 `designer` 返回值上

新增插件时需在 `PluginRegistry` 追加一行类型映射。

### 1.4 不做什么

- 不实现 move / copy / delete（task-004）
- 不实现 group / splitGroup（task-005）
- 不引入 `mergeFieldConfig`（用 `updateNode` 替代）
- 不引入 `setLevelPath`（新架构不需要，levelPath 由遍历时派生）

---

## 2. 详细步骤

### 2.1 目录结构

```
packages-next/designer-plugins/src/
└── layer-ops/
    ├── index.ts          # createLayerOpsPlugin 导出
    ├── types.ts          # LayerOpsPlugin 接口
    └── plugin.ts         # 实现
```

### 2.2 `layer-ops/types.ts`

```ts
import type { Plugin, TreeNode, FlatNode } from '@fedx-vis/designer-core';
import type { WidgetData, DesignerExtra } from '../shared/types';

export interface LayerOpsPlugin {
    /** 空壳插件（lock/show 走 updateNode，不需要 PluginContext） */
    plugin: Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>;
    /** 锁定节点 */
    lock: (id: string) => void;
    /** 解锁节点 */
    unlock: (id: string) => void;
    /** 显示节点 */
    show: (id: string) => void;
    /** 隐藏节点 */
    hide: (id: string) => void;
}
```

### 2.3 `layer-ops/plugin.ts`

lock/unlock/show/hide 是命令式 API（不是 hooks），直接通过 store 调 `updateNode`：

```ts
import { useDesigner, type Plugin } from '@fedx-vis/designer-core';
import type { WidgetData, DesignerExtra } from '../shared/types';
import type { LayerOpsPlugin } from './types';

export function createLayerOpsPlugin(): LayerOpsPlugin {
    const plugin: Plugin<...> = {
        name: 'layer-ops-plugin',
        type: 'cross-slice-sync',
    };

    const lock = (id: string) => {
        // 需要从 Context 获取 store，但 lock 不是 hook
        // 解决：返回一个 hook 工厂，或者 lock 内部用 useDesigner
        // 问题：useDesigner 是 hook，不能在普通函数里调
        // 方案：lock 返回 hook，组件内调用
    };
    // ...
}
```

**store 注入问题**：lock/unlock/show/hide 在 src/ 中是命令式函数（直接调 `store.getState()`），但在 designer-plugins 中 store 通过 Context 注入。

**方案**：lock/unlock/show/hide 作为 hooks 返回（类似 useSetView），组件内调用获取命令式函数：

```ts
export interface LayerOpsPlugin {
    plugin: Plugin<...>;
    useLock: () => (id: string) => void;
    useUnlock: () => (id: string) => void;
    useShow: () => (id: string) => void;
    useHide: () => (id: string) => void;
}
```

### 2.4 实现核心

```ts
const useLock = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string) => {
        store.updateNode(id, { config: { isLock: true } });
    });
};

const useUnlock = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string) => {
        store.updateNode(id, { config: { isLock: false } });
    });
};

const useShow = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string) => {
        store.updateNode(id, { config: { isHidden: false } });
    });
};

const useHide = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string) => {
        store.updateNode(id, { config: { isHidden: true } });
    });
};
```

### 2.5 更新 `index.ts` 导出

追加：
```ts
export { createLayerOpsPlugin, type LayerOpsPlugin } from './layer-ops';
```

---

## 3. 测试

1. **lock**：调 `lock('a')` → `byId['a'].data.config.isLock === true`
2. **unlock**：调 `unlock('a')` → `isLock === false`
3. **show**：调 `show('a')` → `isHidden === false`
4. **hide**：调 `hide('a')` → `isHidden === true`
5. **config 二次浅合并**：lock 不覆盖其他 config 字段（`config.left` 保留）
6. **不存在的 id**：安全跳过（updateNode 内部已有防护）

---

## 4. 验证

| 验证项 | 方法 |
|---|---|
| 测试通过 | `pnpm --filter @fedx-vis/designer-plugins test` |
| 类型安全 | `pnpm --filter @fedx-vis/designer-plugins typecheck` |

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `isLock` / `isHidden` 是业务字段名 | 低 | 低 | designer-plugins 层定义，合理 |
| lock/show 作为 hooks 返回（非命令式） | 中 | 低 | 与 useSetView 同模式，一致性优先 |

---

## 6. 实施记录

> 2026-08-06 完成。

### 6.1 落地文件清单

```
src/
├── index.ts                          # barrel 导出（新增 createLayerOpsPlugin + LayerOpsPlugin）
├── create-designer.ts                # [主工厂] 上提自 shared/
├── types.ts                          # [业务类型] 上提自 shared/
├── hooks/
│   └── use-persist-fn.ts            # [跨插件 hook] 上提自 view/（task-003 review 后）
├── view/
│   ├── index.ts
│   ├── plugin.ts
│   └── types.ts
├── layer-ops/
│   ├── index.ts
│   ├── plugin.ts
│   └── types.ts
└── __tests__/
    ├── bootstrap.test.ts
    ├── view-plugin.test.tsx
    └── layer-ops-plugin.test.tsx
```

> 目录结构演变：
> - 初版（task-001）：`shared/` 收纳 create-designer.ts + types.ts + use-persist-fn.ts
> - 当前（task-003 多次 review 后）：`shared/` 删除，create-designer.ts / types.ts 上提为顶层，`use-persist-fn.ts` 移到 `hooks/`

### 6.2 关键实施决策（相对原计划的修正）

#### 决策 1：完全采用 "hooks 返回命令式函数" 形态（task 计划 §2.3 的最终方案）

task §2.2 与 §2.3 内部确实存在矛盾（前者列 `lock: (id) => void` 命令式，后者列 `useLock: () => (id) => void`）。task §2.3 末段明确选定 hooks 形态（"hooks 返回命令式函数，非命令式"），本任务采用此方案。

理由（与 createViewPlugin.useSetView 同模式）：
- `useDesigner()` 是 hook，必须在 React 渲染期调用
- store 通过 Context 注入，命令式函数无法在 hooks 之外获取 store
- 方案：hooks 内部 `useDesigner()` 后用 `usePersistFn` 封装命令式函数，引用稳定

#### 决策 2：`useTypedStore()` 私有 helper 复制（不抽到 hooks/）

view/plugin.ts 已有相同的私有 helper（task-002 §6.2 #2）。本任务在 layer-ops/plugin.ts 内复制，不抽到 hooks/。理由：
- AGENTS.md §10.1 "Only make changes that are directly requested or clearly necessary"
- 只有 2 个插件使用，3 处以下重复是合理的（helper 是 5 行业务类型 cast，不是机械复制）
- 后续 task-004/005 都引入时再统一抽到 hooks/（届时 cost 才清晰）

#### 决策 3：`usePersistFn` 抽到 `hooks/`（review 后修正）

初版在 layer-ops/ 下复制了一份 `use-persist-fn.ts`（35 行 × 2 = 70 行重复代码）。事后 review 指出：ahooks 经典实现无任何 design decision，**重复是机械搬运而非合理抽象**。在接受 task-003 落地后立即执行了 refactor：

- 从 `view/use-persist-fn.ts` 移到 `hooks/use-persist-fn.ts`
- `view/plugin.ts` 和 `layer-ops/plugin.ts` 改为 `import { usePersistFn } from '../hooks/use-persist-fn'`
- 删除 `view/use-persist-fn.ts` 和 `layer-ops/use-persist-fn.ts`

理由：task-005（group-management）会引入第三处副本。提前抽到 hooks/ 避免重复扩散到 3 处。

**经验教训**：原稿借口"3 处以下重复是合理的"——实际上 35 行的机械复制超出了"3 similar lines" 的合理阈值。判定标准应改为"代码行数 × 重复处数"，而非简单按"重复处数"。

#### 决策 4：删除 `shared/` 目录（review 后修正）

第二轮 review 指出 `shared/` 命名反模式：`create-designer.ts`（主工厂）、`types.ts`（业务类型）、`use-persist-fn.ts`（hook）三者性质完全不同，凑到 `shared/` 是"找不到合适位置的统一收纳"。修正：

- `create-designer.ts` 上提为顶层 `src/create-designer.ts`（主入口）
- `types.ts` 上提为顶层 `src/types.ts`（业务类型）
- `use-persist-fn.ts` 移到 `src/hooks/use-persist-fn.ts`（跨插件 hook）
- 删除 `src/shared/` 目录

判定标准：**目录名应描述"放进来的是什么"**，而不是"为什么放进来"。"shared" 只回答了"为什么"，没有回答"是什么"。

#### 决策 5：测试 scope 扩展（plan §3 6 项 → 实际 9 项）

plan §3 列了 6 项用例。第 6 项"不存在的 id"被扩展验证两个角度：(1) 不抛错；(2) 其他节点未被影响。额外新增第 7 项"usePersistFn 引用稳定"——验证 hooks 返回的 fn 跨 re-render 引用稳定（这是 usePersistFn 的核心契约，必须保证）。

测试覆盖：
1. 返回结构契约（plugin.name / plugin.type / 4 hooks 是函数）
2. lock('a') → isLock === true
3. unlock('a') → isLock === false
4. show('a') → isHidden === false
5. hide('a') → isHidden === true
6. config 二次浅合并（多字段场景）
7. config 二次浅合并（嵌套对象引用保留）
8. 不存在的 id 安全跳过
9. usePersistFn 引用稳定

### 6.3 验证结果

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm --filter @fedx-vis/designer-plugins typecheck` | 0 error |
| 单元测试 | `pnpm --filter @fedx-vis/designer-plugins test` | 22 passed (8 bootstrap + 5 view-plugin + 9 layer-ops-plugin) |
| 构建 | `pnpm --filter @fedx-vis/designer-plugins build` | 成功，dist 模块数 10 → 9，bundle 4.17 kB → 3.98 kB |

> 注：以上验证在 2 次重构（use-persist-fn 抽到 hooks/ + 删除 shared/）之后。重测 typecheck / test / build 全部仍通过。dist 清空后再 build 验证无 stale 文件（`dist/shared/` 已消失）。

### 6.4 后续 task 衔接

- `task-2026-08-06-004`（move/copy/delete）会扩展 LayerOpsPlugin 接口（新增 useMove/useCopy/useDelete），走 setTree 而非 updateNode
- `task-2026-08-06-005`（group-management）独立插件 createGroupManagementPlugin，会直接复用 `hooks/use-persist-fn.ts`
- `task-2026-08-06-006`（plugin registry refactor）会整合 3 个插件（view + layer-ops + group-management），PluginRegistry 抽象
- 应用层迁移（src/ 旧 layer-manager/lock + layer-manager/visible 迁移到 designer-plugins）按计划 §1.4 推迟到 designer-app 阶段

### 6.5 延期到 task-006 的架构问题（不动手，记入清单）

基于 2026-08-06 review，本任务**有意保留**以下架构问题，等待 task-006 统一处理：

| 问题 | 当前状态 | 为什么会保留 |
|---|---|---|
| **plugin 壳是死代码** | `name` + `type` 占位，无 init / 无 lifecycle | task-003 时间窗内不值得专门改造，下一个 plugin 到来时一起改 |
| **无扩展点** | hooks 直接调用，无 pre/post 拦截 | 用户最初架构意图需要 plugin 抽象落地，但需要先升级 designer-core `Plugin` 接口，跨包改动 |
| **无生命周期钩子** | plugin 没有 `onBeforeInit` / `onAfterInit` / `onBeforeDestroy` / `onAfterDestroy` 等 mount/unmount 钩子 | 跨插件协调需求（"config plugin 初始化后注册 data-fetcher 监听"）需要 lifecycle hooks；同样要改 designer-core `Plugin` 接口 |
| **`type: 'cross-slice-sync'` 撒谎** | layer-ops 不跨 slice | 同上，需要 `PluginType` 扩展 'field-ops' / 'capability-bundle' |
| **命名 "layer-ops" 可能误导** | 暗示"图层面板触发"，实际是节点 config 字段变更 | 与 UI 触发位置无关；候选 rename：`widget-config` / `widget-state` |
| **group / structure 插件运行时耦合** | task-005 会调 task-004 的 useMove | 拆插件是为组织，运行时耦合是结构性问题 |
| **每插件 boilerplate 重复** | usePersistFn + useTypedStore 在 view/layer-ops 都复制 | 同一形态在 3 个插件重复出现，靠 task-006 提取 |

**统一处理位置**：[task-2026-08-06-006-designer-plugins-plugin-registry.md](./task-2026-08-06-006-designer-plugins-plugin-registry.md)（plugin registry refactor + 架构升级合并实施）

**处理思路**：
1. 升级 designer-core `Plugin` 接口（加 `lifecycle?: PluginLifecycleHooks` + `extensions?: ExtensionPoint[]`）
2. 扩展 `PluginType`（'field-ops' / 'capability-bundle'）
3. 在 designer-plugins 引入 capability-driven 插件分组（config / structure / group / data-fetcher / interaction）
4. 一次性把 task-003/004/005 三个插件补齐 lifecycle + 扩展点接入
5. 评估命名重命名（layer-ops → widget-config 等）

**为什么不现在做**：
- task-003 边界明确（4 个 hooks + 测试），再做就是 over-engineering
- 扩展点设计需要 designer-core 配合（要 task-006 范围）
- 多个 plugin 同时改可以避免"先做完再改"的二次工作量

**任务边界提醒**：后续 review task-003/004/005 时，不要因为发现"plugin 壳是死代码"就单独改这个文件——必须等 task-006 统一处理。
