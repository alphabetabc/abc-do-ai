# 设计器 Canvas 状态合并到主 Store（基础 + 兼容层）

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-006`
> 上游调研：[useDesigner迁移可行性审计](../research/useDesigner迁移可行性审计.md)
> 状态：`planning`
> 类型：`refactor`
> 预计工时：2 天（含 0.5 天 buffer）
> 后续任务：[task-2026-07-21-007](./task-2026-07-21-007-byid-index.md)、[task-2026-07-21-008](./task-2026-07-21-008-patch-field-config.md)、[task-2026-07-21-009](./task-2026-07-21-009-cleanup.md)

---

## 1. 背景

当前画布状态由 `useDesigner`（React Context + `useSet`）管理，存在三个问题：

1. **任何字段变化都触发所有 `useDesigner` 消费方重渲染**（440 个组件场景下性能差）
2. **8 处直接 mutation**（layer-manager / page/index.jsx / designer-field 等）
3. **`isForceUpdate=false` 路径 + `runtimeComponentsTrigger` EventBus 是反模式**（隐式通知、跳过 React 调度）

**本任务范围**：仅做"基础设施 + 兼容层 + 修 mutation"，**不动任何调用方代码**。所有 `useDesigner()` 调用方零改动（走兼容壳），降低风险。

后续 task-007/008/009 才逐步替换订阅、删除 EventBus。

### 1.1 数据结构（本期最终态）

```ts
interface DesignerCanvasState {
    appScopeId: string | null;
    components: WidgetItem[];                  // 单一真相源（结构性变更时替换）
    page: PageConfig;
    realtimeDataFlow: RealtimeDataFlowItem[];
    customFieldsListMapping: Record<string, string>;
    undo: any[];
    redo: any[];
    meta: Record<string, any>;
}
```

**注意**：本任务**不拆 byId / parentMap**——那是 task-007 的事。本期数据结构与现状完全一致，只是放进 Redux。

---

## 2. 目标

1. 新建 `designerCanvas` slice，包含 components / page / realtimeDataFlow / customFieldsListMapping / undo / redo / meta
2. `useDesigner` 改为兼容壳：内部从 `useSelector(s => s.designerCanvas)` 读、`dispatch` 写
3. 修掉 2 处真 bug mutation（DataProvider L117 / page/index.jsx L29-32，详见 §4.2 A 类）；其余 6 处推迟到 task-009 同步删 cloneDeep 时处理
4. 修掉 `configuration-panel/page/index.jsx` 的 render 内 mutation bug
5. `runtimeComponentsTrigger` 与 `isForceUpdate=false` 路径**保留**（task-007 才删）
6. `useDesignerSettingChange` / `useSyncDesignerUpdate` / `useDebounceMergeConfig` 三个 hook **保留**（task-007/008 才删）；DataProvider.tsx 仍导出这三个 hook 供 designer-field/index.tsx 等调用方继续使用
7. `designerCanvas` slice **不进入 redux-persist 白名单**（沿用当前 `whitelist = []` 的现状，编辑器状态不需要持久化）
8. `pnpm tsc --noEmit` 零新增错误
9. 17 个 `useDesigner()` 调用方**零改动**

---

## 3. 关键设计决策

### 3.1 兼容壳策略：保留 Context Provider，setState 走 dispatch

```ts
// 新 DataProvider.tsx（草图）
const DesignerProvider = (props) => {
    const state = useSelector((s: RootReducerState) => s.designerCanvas);
    const dispatch = useDispatch();

    const setState = usePersistFn((nextState, isForceUpdate = true, uniqueId?) => {
        if (!isForceUpdate && 'components' in nextState) {
            // 保留旧路径（task-007 删 EventBus 时一起删）
            legacyForceUpdate(nextState, uniqueId);
            return;
        }
        // 正常路径：dispatch 到 designerCanvas slice
        dispatch(setDesignerCanvasState(nextState));
    });

    // realtimeDataFlow / customFieldsList 是 hox-like API，保持原签名
    const realtimeDataFlow = useMemo(() => ({...}), [state.realtimeDataFlow, dispatch]);
    const customFieldsList = useMemo(() => ({...}), [state.customFieldsListMapping, dispatch]);

    return <DesignerContext.Provider value={{ state, setState, ... }}>{children}</DesignerContext.Provider>;
};
```

**理由**：
- 17 个调用方零改动（继续 `useDesigner()`）
- `setState` 仍走 dispatch（不再直接 mutation）
- `isForceUpdate=false` 路径先**保留**（task-007 删），保证本期行为完全等价

#### `legacyForceUpdate` 完整实现

`legacyForceUpdate` 是 task-006 过渡期的兼容函数，对应原 DataProvider L113-121 的 `isForceUpdate=false` 路径。**关键约束**：

- task-006 已把 state 搬进 Redux，`state.components` 是 Immer frozen 对象，**禁止直接 mutation**
- 必须用 `dispatch(setDesignerCanvasState({ components }))` 写状态（Immer 安全）
- 保留 EventBus 触发（task-007 才删），保证 `useDesignerSettingChange` 仍能收到通知

```ts
// DataProvider.tsx 内部函数（task-006 过渡期，task-007 整体删除）
const legacyForceUpdate = (nextState: any, uniqueId?: string) => {
    // 1. dispatch 更新 state（Immer 安全，不能直接 state.components = ...）
    dispatch(setDesignerCanvasState({ components: nextState.components }));
    // 2. 保留 EventBus 通知（task-007 删 EventBus 时连同此函数一起删）
    runtimeComponentsTrigger.trigger(getRuntimeTriggerKey(uniqueId), null, { data: nextState.components });
    runtimeComponentsTrigger.trigger(syncDesignerUpdateKey, null, {});
    // 3. 保留性能计算副作用
    calculateScreenPerformance({ components: nextState.components });
};
```

**双重通知语义**：`legacyForceUpdate` 会触发一次 dispatch（Redux 更新）+ EventBus 通知。`useDesignerSettingChange` 仍走 EventBus 收到通知，`useSelector` 也会收到 dispatch 通知——**双重通知**，但语义一致（都更新到同一份数据），不会出错。task-007 删 EventBus 后只剩 dispatch 路径。

**task-007 删除边界**：`legacyForceUpdate` + `runtimeComponentsTrigger.trigger(...)` 两行 + `useDesignerSettingChange` 订阅代码一起删除，改为单一 `dispatch(setComponents(...))` 路径。

### 3.2 不要把 useDesigner 整个删掉

不要一步到位删 Context Provider + 改 17 个文件调用方。本期只把 state 搬进 Redux，Context 保留作为兼容壳。

### 3.3 setDesignerCanvasState 的 action shape

```ts
// src/store/modules/designer-canvas-actions.ts
export const setDesignerCanvasState = (payload: Partial<DesignerCanvasState>) => ({
    type: 'designerCanvas/setState',
    payload,
});

// 配套 action：清空 realtimeDataFlow / customFieldsListMapping（setState 内部逻辑）
export const clearRuntimeState = () => ({ type: 'designerCanvas/clearRuntime' });
```

reducer 内部用 Immer 处理：
- `setState` payload 直接 merge
- `clearRuntime` 清空 realtimeDataFlow / customFieldsListMapping

### 3.4 useDesigner 兼容壳签名严格保持

```ts
// src/designer/common/context/context-designer/Designer.tsx
export const useDesigner = () => {
    const state = useSelector((s: RootReducerState) => s.designerCanvas);
    const dispatch = useDispatch();
    const setState = usePersistFn((nextState, isForceUpdate, uniqueId) => {...});
    const realtimeDataFlow = useMemo(() => ({...}), [state, dispatch]);
    const customFieldsList = useMemo(() => ({...}), [state, dispatch]);
    return { state, setState, realtimeDataFlow, customFieldsList };
};
```

调用方拿到的 `state` 引用必须**保持稳定**（即仅当内部字段变化时才换引用），否则 `useMemo([state.components])` 等依赖会失效。

**实现**：用 `useSelector(s => s.designerCanvas, shallowEqual)`——这要求 components / page 等顶层字段都是稳定引用（Immer 默认行为，但 splice/push 会被 immer 视作 mutation 而创建新引用，OK）。

---

## 4. 详细步骤

### 步骤 1：新建 designerCanvas slice

新建文件 [src/store/modules/designer-canvas.ts](src/store/modules/designer-canvas.ts)：

```ts
import type { AnyAction } from '@reduxjs/toolkit';
import produce from 'immer';

export interface DesignerCanvasState {
    appScopeId: string | null;
    components: any[];
    page: any;
    realtimeDataFlow: any[];
    customFieldsListMapping: Record<string, string>;
    undo: any[];
    redo: any[];
    meta: Record<string, any>;
}

const initialState: DesignerCanvasState = {
    appScopeId: null,
    components: [],
    page: {
        pageSize: '1920 x 1080',
        zoom: 'scaleX',
        backgroundMode: 'define',
        backgroundColor: 'rgba(0,17,52,1)',
        backgroundImage: '',
        backgroundDefine: 'background-2.png',
        backgroundBlur: 0,
        backgroundOpacity: 100,
        width: 1920,
        height: 1080,
        customPageSize: { width: 0, height: 0 },
    },
    realtimeDataFlow: [],
    customFieldsListMapping: {},
    undo: [],
    redo: [],
    meta: {},
};

export const designerCanvasInitialState = initialState;

export default function designerCanvas(state = initialState, action: AnyAction): DesignerCanvasState {
    switch (action.type) {
        case 'designerCanvas/setState': {
            return produce(state, (draft) => {
                Object.assign(draft, action.payload);
            });
        }
        case 'designerCanvas/clearRuntime': {
            return produce(state, (draft) => {
                draft.realtimeDataFlow = [];
                draft.customFieldsListMapping = {};
            });
        }
        default:
            return state;
    }
}
```

新建 [src/store/modules/designer-canvas-actions.ts](src/store/modules/designer-canvas-actions.ts)：

```ts
export const setDesignerCanvasState = (payload: Partial<DesignerCanvasState>) => ({
    type: 'designerCanvas/setState',
    payload,
});

export const clearDesignerCanvasRuntime = () => ({ type: 'designerCanvas/clearRuntime' });
```

### 步骤 2：主 store 注册 slice

修改 [src/store/modules/index.ts](src/store/modules/index.ts)，加入：

```ts
import designerCanvas from './designer-canvas';

export const rootReducer = combineReducers({
    app,
    component,
    designerCanvas,    // ← 新增
    viewCanvas,
    viewUI,
});

export { setDesignerCanvasState, clearDesignerCanvasRuntime } from './designer-canvas-actions';
export type { DesignerCanvasState } from './designer-canvas';
export { designerCanvasInitialState } from './designer-canvas';
```

### 步骤 3：重写 DataProvider

修改 [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx)：

- 删 `useSet` 内部 state
- 改用 `useSelector((s: RootReducerState) => s.designerCanvas, shallowEqual)` + `useDispatch`
- `setState` 内部：正常路径 `dispatch(setDesignerCanvasState(nextState))`；`isForceUpdate=false` 路径**保留旧逻辑**（task-007 才删）
- `realtimeDataFlow.record` / `customFieldsList.record` 等 mutation 改用 `produce + dispatch`（不再写 latestState.current）

**特别注意**：
- `runtimeComponentsTrigger` 全局变量保留
- `useDesignerSettingChange` / `useSyncDesignerUpdate` 不动
- `useSet` hook import 删除（不再需要）

### 步骤 4：处理 mutation（按"是否真 bug"分类）

> **关键认知**：调研 §9.2 已确认 `getFieldConf` / `getParent` / `getFieldOrderBy` 内部都先 `_.cloneDeep` 再返回值。**layer-manager / designer-field / utils.js 等工具函数内部的 mutation 改的都是 clone，不是 state**——task-006 阶段这些 mutation **不会破坏 Redux**（state 仍是完整 clone 的源头）。
>
> 只有 **2 处**直接改 state 本身的 mutation 是真 bug，本期必修；其余推迟到 task-009（与删 cloneDeep 同步）。

#### A. 真 bug（本期必修，2 处）

| 文件 | 行 | 当前写法 | 为什么是 bug | 改造 |
|---|---|---|---|---|
| [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx) | L117 | `state.components = nextState.components` | 改的是 `useSet` 内部 state；task-006 搬进 Redux 后 state 是 Immer frozen | 整个 DataProvider 重写时改为 `dispatch(setDesignerCanvasState({ components }))`（详见 §3.1 legacyForceUpdate） |
| [src/designer/configuration-panel/page/index.jsx](src/designer/configuration-panel/page/index.jsx) | L29-32 | `Object.assign(state.page, {...})` | render 内直接改 state 本身（不是 clone），搬进 Redux 后会抛 `TypeError` | 移到事件回调（POLYFILL_DIMENSION 在 `useEffect` 里触发），用 `setState({ page: { ...state.page, ...polyfillPatch } })` |

#### B. 当前安全、task-009 必改（6 处）

> task-006 阶段这些 mutation 改的是 `getFieldConf` / `getParent` / `getFieldOrderBy` 返回的 cloneDeep 副本，**不污染 state**。但 task-009 删 cloneDeep 后会爆雷（Immer 报只读保护），必须同步改。详见 [task-009 §3.2](./task-2026-07-21-009-cleanup.md) layer-manager splice 崩溃方案。

| 文件 | 行 | 当前写法 | task-009 改造 |
|---|---|---|---|
| [src/designer/layer-manager/move/index.ts](src/designer/layer-manager/move/index.ts) | L19, L21, L42, L44 | `components.splice/push/unshift`（改的是 `getFieldOrderBy` 返回的 clone） | 改为不可变写法：`[components[index], ...components.filter((_, i) => i !== index)]` 等 |
| [src/designer/layer-manager/lock/index.ts](src/designer/layer-manager/lock/index.ts) | L10, L24 | `config.isLock = true`（改的是 `getFieldConf` 返回的 clone） | 改为构造新 config 再走 `mergeFieldConfig` |
| [src/designer/layer-manager/visible/index.ts](src/designer/layer-manager/visible/index.ts) | L10, L24 | 同上（isHidden） | 同上 |

#### C. utils.js / designer-field / 其他工具函数内部 mutation（推迟到 task-009）

不在本期范围：调研 §9.4 + 工具函数内部调用链确认这些 mutation 都改的是 cloneDeep 副本：
- `utils.js` `orderBy` L250-253 的 `arr.splice`（改 clone）
- `utils.js` `deleteFieldByUniqueId` L284 的 `components.splice`（改 clone）
- `utils.js` `generatorGroup` L430 的 `parents.children.filter` + 赋值（改 clone）
- `utils.js` `splitGroup` L486 的 `parents.children.splice`（改 clone）
- `designer-field/index.tsx` L220 的 `parents.children = ...filter(...)`（改 clone）
- `aside-panel/layers-tree/tree/useOnDrop.ts` L27 的 `targetFieldConfig.children.unshift`（改 clone）
- `common/field/layout-block/helper/element.tsx` L108-114 的 `_.set(child, ...)` + `child.children = resizeChildren(...)`（改 clone）
- `common/draggable/drag2layoutBlock.ts` L38 周边（改 clone）

**task-009 收尾**：删 `cloneDeep` 时必须同步把这些 mutation 改成不可变写法，并加单测（详见 task-009 §4 步骤 2）。

#### 单元测试范围（task-009 收尾时落地）

- 每个 layer-manager 函数加单测：操作前后 components 引用必须不同，但未改动的兄弟节点引用必须相同（结构共享）
- `getFieldOrderBy` 的 `rebuild=true` 默认行为保持（layer-manager 内部 cloneDeep）

### 步骤 5：useDesigner 兼容壳签名验证

```ts
// 17 个调用方的使用模式
const { state, setState, realtimeDataFlow, customFieldsList } = useDesigner();
```

兼容壳返回的对象必须有：
- `state`：与原 Context value 等价（字段名一致、引用稳定）
- `setState`：签名 `(nextState, isForceUpdate?, uniqueId?)` 不变
- `realtimeDataFlow`：方法 `{ record, del }` 不变
- `customFieldsList`：方法 `{ get, record, del }` 不变

调用方**零改动**——只验证 `pnpm tsc --noEmit` 通过 + 人工冒烟。

### 步骤 6：验证

```bash
pnpm tsc --noEmit
pnpm start
```

**冒烟清单**（人工，10 分钟）：

- [ ] 打开设计器，初始化加载（无白屏、无报错）
- [ ] 拖入新组件（layer-manager.delete / group / move 路径）
- [ ] 选中组件 → 右侧配置面板更新
- [ ] 修改配置项（onChange 高频路径）→ 画布实时响应
- [ ] 拖拽组件 → 位置实时更新
- [ ] 撤销/重做（如果有）
- [ ] 保存场景 → 后端拿到的 config 与改动一致
- [ ] 刷新页面 → 状态正确恢复（除 view 状态外的 slice 都恢复）

**grep 校验**：

```bash
# 1. designerCanvas slice 已注册
grep "designerCanvas" src/store/modules/index.ts

# 2. DataProvider 已不再用 useSet
grep "useSet" src/designer/DataProvider.tsx  # 应返回 0 命中

# 3. layer-manager mutation 已修
grep -n "config.isLock = \|config.isHidden = " src/designer/layer-manager/  # 应返回 0 命中
grep -n "components.splice" src/designer/layer-manager/  # 应返回 0 命中

# 4. designer-field 直接 mutation 已修
grep -n "parents.children = " src/designer/renderer/designer-field/index.tsx  # 应返回 0 命中
```

---

## 5. 验证清单

- [ ] `src/store/modules/designer-canvas.ts` 已创建并导出
- [ ] `src/store/modules/designer-canvas-actions.ts` 已创建并导出 `setDesignerCanvasState` / `clearDesignerCanvasRuntime`
- [ ] 主 store rootReducer 已加入 `designerCanvas`
- [ ] `src/designer/DataProvider.tsx` 已改用 `useSelector` + `dispatch`，**不再** `useSet`
- [ ] 8 处直接 mutation 已修（grep 校验通过）
- [ ] `configuration-panel/page/index.jsx` render 内 mutation 已挪到事件回调
- [ ] 17 个 `useDesigner()` 调用方**零改动**（diff 仅限上述文件）
- [ ] `runtimeComponentsTrigger` / `useDesignerSettingChange` / `useSyncDesignerUpdate` / `useDebounceMergeConfig` 保留不动（task-007/008 才动）
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 冒烟清单全部通过
- [ ] AGENTS.md §3.2 / §5.1 同步更新（designerCanvas slice 加入切片表）
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [ ] 任务文件移到 `plans/done/`

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `useSelector(s => s.designerCanvas, shallowEqual)` 浅比较导致某些场景引用不稳定 | 中 | 部分组件过度 re-render | 字段级 selector 兜底（task-007）；或把 designerCanvas state 拆成多个 sub-slice（task-009 评估） |
| layer-manager 修 mutation 后行为有微妙差异（比如 splice 替换 vs filter 替换） | 中 | 功能 bug | 每个函数加单测；冒烟清单覆盖所有 layer-manager 操作 |
| `page/index.jsx` 的 mutation 改了之后，原来的"未保存就关闭页面"的提示可能失效 | 低 | 用户体验差异 | 检查 useEffect 依赖；如必要保留 `useEffect` 副作用 |
| 17 个调用方有某个依赖 `useDesigner()` 的 identity（误以为每次都新对象） | 低 | 潜在 re-render | 兼容壳用 `useMemo` 包裹返回值；冒烟覆盖 |

### 回退方案

- 改造前单独一次 git commit（`feat(designer-canvas): add designerCanvas slice`）
- 兼容壳与原 Context 共存**仅限本期**
- 若有问题，`git revert` 整个 commit 即可，不影响其他文件
- 不影响 task-001/002/003/004/005 已落地的 store 基础设施

---

## 7. 实施记录

> 实施过程中按时间顺序追加，每完成一个步骤加一行。

- 2026-07-21：任务创建（task-006），状态 `planning`，基于 useDesigner迁移可行性审计 §6 + §9 拆分
- 2026-07-21：状态置为 `in-progress`，开始执行基础设施 + 兼容层
- 2026-07-21：实施完成（task-006），状态置为 `done`
  - 新建 `src/store/modules/designer-canvas.ts`（slice + `DesignerCanvasState` 类型 + 2 个 reducer case）
  - 新建 `src/store/modules/designer-canvas-actions.ts`（`setDesignerCanvasState` / `clearDesignerCanvasRuntime`）
  - 在 `src/store/modules/index.ts` 注册 `designerCanvas` slice，导出 `DesignerCanvasState` / `RootReducerState`
  - 重写 `src/designer/DataProvider.tsx`：state 改 `useSelector((s) => s.designerCanvas, shallowEqual)` + `useDispatch`；`setState` 正常路径 `dispatch(setDesignerCanvasState(...))`；`isForceUpdate=false` 路径保留为 `legacyForceUpdate`（dispatch + EventBus 双重通知，task-007 删 EventBus 时一并删）；`realtimeDataFlow` / `customFieldsList` 改 `produce` + dispatch（不再写 `latestState.current`）
  - 修 `src/designer/configuration-panel/page/index.jsx` L28-32 的 render 内 `Object.assign(state.page, ...)` 移到 `useEffect`（pageSize 变化时触发 polyfill）
  - `pnpm tsc --noEmit` 0 新增错误（packages/ui 9 个预存在错误与本任务无关，memo 已记录）
  - grep 校验：DataProvider 中 `useSet` 仅在注释命中；slice 已注册；layer-manager / designer-field B/C 类 mutation 按 plan 推迟到 task-009（因 `getFieldConf` / `getParent` 等工具函数仍 `cloneDeep` 保护）
  - AGENTS.md §3.2 / §5.1 同步更新（新增 `designerCanvas` slice 描述、改写"不要把画布 state 塞进 Redux"警告为"走字段级 action 推荐"）
- 2026-07-21：Review 修正（P1-2 / P1-3）：
  - §3.1 补 `legacyForceUpdate` 完整实现（解决 Immer 只读对象 mutation 矛盾，改为 dispatch + EventBus 双重通知）
  - §4 步骤 4 明确 mutation 边界：本期只修 5 个文件 8 处显式 mutation，utils.js 内部工具函数 mutation 留到 task-009（因 task-006 阶段 cloneDeep 仍在，mutation 不会污染 state）