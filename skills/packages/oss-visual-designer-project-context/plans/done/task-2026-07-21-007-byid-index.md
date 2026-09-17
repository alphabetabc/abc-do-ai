# 拆分 byId 索引 + 删除 EventBus + 引入 useFieldConf

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-007`
> 上游任务：[task-2026-07-21-006-designer-canvas-slice](./task-2026-07-21-006-designer-canvas-slice.md)（必须先完成）
> 状态：`planning`
> 类型：`refactor`
> 预计工时：1.5 天（含 0.5 天 buffer）
> 后续任务：[task-2026-07-21-008](./task-2026-07-21-008-patch-field-config.md)

---

## 1. 背景

[task-006](./task-2026-07-21-006-designer-canvas-slice.md) 已经把画布 state 搬进 Redux 的 `designerCanvas` slice，**但数据结构未变**（仍是整树 components）。本期要：

1. 在 designerCanvas slice 内**增加** `byId` 和 `parentMap` 两个派生索引
2. `setComponents` action 内部强制 `buildIndex` 重建索引
3. 新增 `useFieldConf(uniqueId)` hook：`useSelector(s => s.designerCanvas.byId[uniqueId], shallowEqual)`
4. `DesignerField` 的 `useDesignerSettingChange` → `useFieldConf`
5. 删除 `runtimeComponentsTrigger` EventBus
6. 删除 `useSyncDesignerUpdate`
7. `isForceUpdate=false` 路径（DataProvider.tsx L115-121）保留，**但内部改为 dispatch**（不再 mutation）

**调用方改动范围**：

- [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx)（核心）
- [src/designer/renderer/designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx)（`useDesignerSettingChange` → `useFieldConf`）
- [src/designer/aside-panel/layers-tree/index.jsx](src/designer/aside-panel/layers-tree/index.jsx)（`useSyncDesignerUpdate` → `useSelector`）
- [src/designer/renderer/utils.js](src/designer/renderer/utils.js)（新增 5 个工具函数）

**其余 13 个 `useDesigner()` 调用方零改动**（继续走兼容壳）。

---

## 2. 目标

1. designerCanvas slice 增加 `byId: Record<string, FlatField>` 和 `parentMap: Record<string, string>`
2. `setComponents` action：先 `state.components = newTree`，再 `state.byId = buildIndex(newTree).byId`，再 `state.parentMap = buildIndex(newTree).parentMap`
3. 新增 5 个工具函数（详见 §4.1）
4. 新增 `useFieldConf(uniqueId)` hook（详见 §4.2）
5. `useDesignerSettingChange` → `useFieldConf`（仅 `designer-field/index.tsx` 一处）
6. `useSyncDesignerUpdate` → `useSelector`（仅 `layers-tree/index.jsx` 一处）
7. 删除 `runtimeComponentsTrigger` 全部代码
8. `DataProvider.tsx` 的 `isForceUpdate=false` 路径：改为 dispatch `setComponents(components)`（不再 mutation + 不再 trigger EventBus）
9. `pnpm tsc --noEmit` 零新增错误

---

## 3. 关键设计决策

### 3.1 byId 存储结构（方案 B3：只存 data，不存 children）

```ts
interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;                          // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any }; // 不含 children
}
```

**理由**（详见 [调研 §8.2](../research/useDesigner迁移可行性审计.md)）：
- 组件渲染只读 `data.config`（width / height / left / top / isLock / isHidden…）
- `children` 在递归渲染时由 `components` 树提供（用 `RecursionComponents`）
- byId 只存"叶子数据"，避免和 components 树双源同步问题

### 3.2 components / byId 双源

- `components` —— **单一真相源**（结构性变更时整树替换）
- `byId` / `parentMap` —— **派生索引**（每次 `setComponents` 后 `buildIndex` 重建）

reducer 内部强制同步，调用方无感知：

```ts
// designerCanvas reducer 内部
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        draft.components = action.payload;
        const { byId, parentMap } = buildIndex(action.payload);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

### 3.3 buildIndex 成本可接受

- 440 组件：约 1-2ms（一次递归 + 两次 reduce）
- 调用频率：拖入新组件 / 删除 / group / split —— 用户操作频率
- 不在 onChange 高频路径上

### 3.4 useFieldConf 必须是稳定的订阅 hook

```ts
// src/store/designer/hooks.ts
export const useFieldConf = (uniqueId: string) =>
    useSelector(
        (s: RootReducerState) => s.designerCanvas.byId[uniqueId],
        shallowEqual,
    );
```

返回 `undefined` 当组件不存在（删除后）。`DesignerField` 调用方需判空。

#### ⚠️ 关键风险：useFieldConf 与 designer-field 渲染数据需求不对齐

`useDesignerSettingChange` 现状（[DataProvider.tsx#L41-67](src/designer/DataProvider.tsx#L41)）有**两个 setSetting 来源**：
1. EventBus 触发 → `getFieldConf(e.data, uniqueId)`（返回完整树节点）
2. `ownerSetting` prop 变化 → `setSetting(ownerSetting)`

`useFieldConf` 只覆盖第 1 个来源（订阅 byId）。**第 2 个来源（ownerSetting 回退）在 task-007 里没有替代**。

更严重的问题：**`designer-field/index.tsx` 的渲染不仅读 `data.config`，还读 `children`**（递归子组件）。但 byId 的 FlatField 结构（方案 B3）**不存 children**——`useFieldConf` 返回的 FlatField 没有 children 字段。

[designer-field/index.tsx#L56](src/designer/renderer/designer-field/index.tsx#L56) 现状：
```ts
const dataSource = useDesignerSettingChange(propsDataSource.uniqueId, propsDataSource) as DataSource;
// L80: const { config, ...rest } = dataSource.data;  ← 只读 data
// 但 propsDataSource 来自父组件 RecursionComponents 传的整树节点（含 children）
```

**实际分析**：`designer-field` 渲染体只解构 `dataSource.data`（[L80](src/designer/renderer/designer-field/index.tsx#L80)），**不直接读 `dataSource.children`**——children 通过 `props.children` 传入（RecursionComponents 递归）。所以 byId 的 FlatField（只存 data）**能满足 designer-field 的渲染需求**。

**但 ownerSetting 回退仍需处理**：当父组件 RecursionComponents 因 components 引用变化重渲染时，`propsDataSource` 引用会变，`useDesignerSettingChange` 的第二个 useEffect 会 `setSetting(ownerSetting)` 同步。`useFieldConf` 不订阅 ownerSetting，**会导致**：父组件传新 propsDataSource 但 byId 未变时，DesignerField 不更新。

**实际场景**：byId 未变意味着 data.config 未变，DesignerField 重渲染也无意义——所以 ownerSetting 回退**主要是为了同步 uniqueId 等非 data 字段**。但 `useFieldConf` 已经订阅了 byId[uniqueId]，uniqueId 不变。

#### 决策

1. `useFieldConf` 不订阅 `propsDataSource`（**Redux 订阅不会漏通知，无需回退**）
2. **保留 `propsDataSource` 作为 fallback**：覆盖"byId[id] 不存在"（组件刚被删除但 props 还在过渡帧渲染）的情况，避免 `dataSource.data.config` 解构 NPE：

```ts
// designer-field/index.tsx 改造
const fieldById = useFieldConf(propsDataSource.uniqueId);
const dataSource = fieldById ?? propsDataSource; // byId 优先，props 兜底
```

#### useFieldConf 的适用范围

| 场景 | 是否用 useFieldConf | 原因 |
|---|---|---|
| `designer-field` 渲染（读 data.config） | ✅ | 只读 data，byId 满足 |
| 配置面板读当前组件 | ✅ | 只读 data |
| `layer-manager` 读父节点 children | ❌ | byId 不存 children，用 `getFieldNodeById(components, id)` |
| `useOnDrop` 读父节点 children | ❌ | 同上 |

### 3.5 EventBus 删除的边界

- `runtimeComponentsTrigger` 全局变量删除
- `getRuntimeTriggerKey` / `syncDesignerUpdateKey` 删除
- `useDesignerSettingChange` 删除（替换为 `useFieldConf`，详见 §3.4）
- `useSyncDesignerUpdate` 删除（替换为 `useSelector`）
- `setState({ components }, false, uniqueId)` 第二个参数 `uniqueId` 删除（已不需要）

---

## 4. 详细步骤

### 步骤 1：utils.js 新增 5 个工具函数

修改 [src/designer/renderer/utils.js](src/designer/renderer/utils.js)，在文件末尾追加：

```js
/**
 * 从整树构建扁平索引 + 父子映射
 * 在 setComponents / generatorField / deleteFieldByUniqueId / generatorGroup / splitGroup 后调用
 *
 * 注意：只遍历 node.children，不遍历 node.data.config.drillDown
 *       drillDown 子节点（轮播层级数据）不进入 byId 索引
 *       原因：drillDown 是配置数据（非渲染树），level 由 setLevelPath 单独维护
 *       详见 task-009 §3.3 setLevelPath 的 drillDown 处理
 *
 * ⚠️ data 是浅引用（直接 = node.data），禁止在 reducer 之外修改 byId[id].data
 *    如需修改，请走 dispatch：
 *    - 字段级更新：dispatch(updateFieldConfig(id, patch))
 *    - 整树替换：dispatch(setComponents(newTree))，由 reducer 内部调 buildIndex 重建
 *    这样既保证 Immer 不可变语义，也避免双源同步问题
 */
export function buildIndex(components) {
    const byId = {};
    const parentMap = {};

    const walk = (nodes, parentId) => {
        for (const node of nodes) {
            if (!node || !node.uniqueId) continue;
            byId[node.uniqueId] = {
                uniqueId: node.uniqueId,
                type: node.type,
                parentId,
                data: node.data, // 浅引用（组件 data 自身是不可变替换的）
            };
            parentMap[node.uniqueId] = parentId;
            if (Array.isArray(node.children) && node.children.length > 0) {
                walk(node.children, node.uniqueId);
            }
        }
    };

    walk(components || [], ROOT_UNIQUE_ID);
    return { byId, parentMap };
}

/**
 * 字段级更新（O(1)）
 * 不重建整树，直接 patch byId[id]
 */
export function patchFieldConf(byId, uniqueId, patch) {
    const target = byId[uniqueId];
    if (!target) return false;
    target.data = {
        ...target.data,
        ...patch,
        config: patch.config ? { ...target.data.config, ...patch.config } : target.data.config,
    };
    return true;
}

export function getFieldById(byId, uniqueId) {
    return byId[uniqueId];
}

export function getParentIdById(parentMap, uniqueId) {
    return parentMap[uniqueId];
}

export function removeFieldFromIndex(byId, parentMap, uniqueId) {
    delete byId[uniqueId];
    delete parentMap[uniqueId];
}
```

**注意**：`buildIndex` 复用现有 `ROOT_UNIQUE_ID` 常量（L15）。

### 步骤 2：designerCanvas slice 增加 byId / parentMap

修改 [src/store/modules/designer-canvas.ts](src/store/modules/designer-canvas.ts)：

```ts
export interface DesignerCanvasState {
    appScopeId: string | null;
    components: any[];
    byId: Record<string, FlatField>;            // 新增
    parentMap: Record<string, string>;          // 新增
    page: any;
    realtimeDataFlow: any[];
    customFieldsListMapping: Record<string, string>;
    undo: any[];
    redo: any[];
    meta: Record<string, any>;
}

export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;
    data: { config: any; [key: string]: any };
}

const initialState: DesignerCanvasState = {
    appScopeId: null,
    components: [],
    byId: {},                                   // 新增
    parentMap: {},                              // 新增
    page: { /* ... */ },
    realtimeDataFlow: [],
    customFieldsListMapping: {},
    undo: [],
    redo: [],
    meta: {},
};
```

reducer 增加 `setComponents` action：

```ts
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        draft.components = action.payload;
        const { byId, parentMap } = buildIndex(action.payload);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

新建 action [src/store/modules/designer-canvas-actions.ts](src/store/modules/designer-canvas-actions.ts) 增加：

```ts
export const setComponents = (components: any[]) => ({
    type: 'designerCanvas/setComponents',
    payload: components,
});
```

**setDesignerCanvasState action 行为**：仍 merge 全部字段，但当 payload 包含 `components` 时，强制重建 byId / parentMap：

```ts
case 'designerCanvas/setState': {
    return produce(state, (draft) => {
        Object.assign(draft, action.payload);
        if ('components' in action.payload) {
            const { byId, parentMap } = buildIndex(action.payload.components);
            draft.byId = byId;
            draft.parentMap = parentMap;
        }
    });
}
```

### 步骤 3：新增 useFieldConf hook

修改 [src/store/designer/hooks.ts](src/store/designer/hooks.ts)，新增：

```ts
import { useFieldConf } from './field-conf'; // 新建
// 或直接在 hooks.ts 内定义：
export const useFieldConf = (uniqueId: string) =>
    useSelector(
        (s: RootReducerState) => s.designerCanvas.byId[uniqueId],
        shallowEqual,
    );
```

并在 [src/store/designer/index.tsx](src/store/designer/index.tsx) barrel 加入 `export { useFieldConf }`。

### 步骤 4：DataProvider 删除 EventBus + 改 isForceUpdate 路径

修改 [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx)：

- 删 `runtimeComponentsTrigger` 全局变量
- 删 `getRuntimeTriggerKey` / `syncDesignerUpdateKey`
- 删 `useSyncDesignerUpdate` 函数
- 删 `useDesignerSettingChange` 函数
- 删 `useEffect` 清理 EventBus（L195-199）
- 改 `setState`：

```ts
const setState = usePersistFn((nextState, isForceUpdate = true) => {
    try {
        if (!isForceUpdate && 'components' in nextState) {
            // 旧路径：直接 mutation state.components + EventBus trigger
            // 新路径：dispatch setComponents，Immer 重建 byId/parentMap
            dispatch(setComponents(nextState.components));
            // 保留 calculateScreenPerformance 副作用
            calculateScreenPerformance({ components: nextState.components });
            return;
        }
        if (_.isEmpty(nextState.components)) {
            Object.assign(nextState, { realtimeDataFlow: [], customFieldsListMapping: {} });
        }
        dispatch(setDesignerCanvasState(nextState));
    } finally {
        calculateScreenPerformance({ components: nextState.components });
    }
});
```

**注意**：
- `isForceUpdate=false` 的第二个参数 `uniqueId` **删除**（已不需要）
- 所有调用 `setState({...}, false, selected)` 的地方要去掉 `selected` 实参（grep 后批量改）

### 步骤 5：designer-field 切换 useFieldConf

修改 [src/designer/renderer/designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx)：

- 删 `import { useDesignerSettingChange } from '../../DataProvider'`
- 加 `import { useFieldConf } from '@Src/store/designer'`
- L56 改为 `const fieldById = useFieldConf(propsDataSource.uniqueId);`
- L80 `const { config, ...rest } = dataSource.data;` 改为 `const { config, ...rest } = fieldById?.data || {};`
- 加判空保护（删除组件时 byId 已无该 entry）

**grep 校验**：

```bash
grep "useDesignerSettingChange" src/designer/  # 应返回 0 命中
```

### 步骤 6：layers-tree 切换 useSelector

修改 [src/designer/aside-panel/layers-tree/index.jsx](src/designer/aside-panel/layers-tree/index.jsx)：

- 删 `import { useSyncDesignerUpdate } from '../../DataProvider'`
- 删 `useSyncDesignerUpdate()` 调用
- `useMemo([state.components])` 改为 `useSelector(s => s.designerCanvas.components, shallowEqual)`

**grep 校验**：

```bash
grep "useSyncDesignerUpdate" src/designer/  # 应返回 0 命中
grep "runtimeComponentsTrigger" src/designer/  # 应返回 0 命中
```

### 步骤 7：清理 useDebounceMergeConfig 的 uniqueId 实参

`useDebounceMergeConfig.tsx` L29 调用 `setState({ components: results }, false, selected)`，新签名去掉了 uniqueId：

```ts
setState({ components: results }, false);  // 删除第三个参数 selected
```

**grep 校验**：

```bash
grep "setState({ components" src/designer/  # 检查所有调用点，确认无第三个参数
```

### 步骤 8：验证

```bash
pnpm tsc --noEmit
pnpm start
```

**冒烟清单**：

- [ ] 拖拽期间画布流畅（React DevTools Profiler：只有被改动的 DesignerField 重渲染）
- [ ] 配置面板 onChange 期间，被改组件实时更新，其余组件不重渲染
- [ ] 删除组件 → byId 对应 entry 清理
- [ ] group / split group → byId 同步正确
- [ ] 拖入新组件 → byId 新增 entry
- [ ] 刷新页面 → 状态正确恢复（byId 在初始 load 时一并重建）

**嵌入场景验证（DesignerParserEntry.js）**：
- [ ] grep `DesignerParserEntry.js` 的 components 加载路径（应走 `DesignerContent` 的 mount 流程）
- [ ] 确认 mount 时机只触发一次 `dispatch(setComponents(components))`，避免 byId 多次重建
- [ ] 写一个集成测试：模拟微应用嵌入（直接调用 DesignerParserEntry 入口），验证 byId 在 mount 后立即可用、后续 dispatch 正确传播

**grep 校验**：

```bash
grep "runtimeComponentsTrigger\|useDesignerSettingChange\|useSyncDesignerUpdate" src/designer/  # 0 命中
grep "useFieldConf" src/designer/  # 有命中
```

---

## 5. 验证清单

- [ ] `src/designer/renderer/utils.js` 新增 5 个工具函数
- [ ] `src/store/modules/designer-canvas.ts` 增加 `byId` / `parentMap` + `setComponents` action
- [ ] `src/store/modules/designer-canvas-actions.ts` 导出 `setComponents`
- [ ] `src/store/designer/hooks.ts` 新增 `useFieldConf`
- [ ] `src/store/designer/index.tsx` barrel 导出 `useFieldConf`
- [ ] `src/designer/DataProvider.tsx` 删除 EventBus 相关代码 + `setState` 改 dispatch
- [ ] `src/designer/renderer/designer-field/index.tsx` 切换 `useFieldConf`
- [ ] `src/designer/aside-panel/layers-tree/index.jsx` 切换 `useSelector`
- [ ] `src/designer/renderer/hooks/useDebounceMergeConfig.tsx` 去掉 uniqueId 实参
- [ ] 所有调用 `setState({...}, false, selected)` 的地方去掉 `selected` 实参（grep 校验）
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 冒烟清单全部通过
- [ ] React DevTools Profiler：拖拽期间只有 ~1 个 DesignerField 重渲染（不是 440 个）
- [ ] AGENTS.md §3.2 同步更新（说明 EventBus 已删、useFieldConf 替代 useDesignerSettingChange）
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [ ] 任务文件移到 `plans/done/`

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `byId` 数据与 `components` 不同步（漏调 `setComponents`） | 中 | 部分组件渲染过期 | reducer 内部强制 `buildIndex`；写单测：随机操作 components 树后 byId 必须一致 |
| `useFieldConf(uniqueId)` 在 component 已删除时返回 undefined，导致 NPE | 中 | 渲染报错 | 调用方判空（`fieldById?.data`） |
| `isForceUpdate=false` 改 dispatch 后性能回退（Immer 重建 byId 有成本） | 低 | 拖拽掉帧 | `buildIndex` 是 O(n)，440 组件约 1-2ms，可接受；如有问题可加 memoization（task-009 评估） |
| `designer-field/index.tsx` L80 的 `dataSource.data.config` 解构可能在 unmount 时 NPE | 低 | 渲染报错 | `const { config, ...rest } = fieldById?.data \|\| {};` |
| 跨微应用嵌入（`DesignerParserEntry.js`）的 byId 初始化时机 | 低 | 嵌入场景失败 | 在 `DesignerContent` mount 时 `dispatch(setComponents(components))` 一次即可 |

### 回退方案

- 改造前单独一次 git commit（`refactor(designer-canvas): add byId index, remove EventBus`）
- EventBus 与 byId 共存**仅限本期过渡**，本期结束必须删除
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-21：任务创建（task-007），状态 `planning`，基于 task-006 输出 + 调研 §7/§8 拆分
- 2026-07-21：状态置为 `in-progress`，开始执行
- 2026-07-21：实施完成（task-007），状态置为 `done`
  - 备份 `src/designer/renderer/utils.js` 为 `utils.bak.js`，改名为 `utils.ts`（顶部加 `@ts-nocheck`），末尾追加 5 个新工具函数：`FlatField` 类型 / `buildIndex` / `patchFieldConf` / `getFieldById` / `getParentIdById` / `removeFieldFromIndex`
  - `src/store/modules/designer-canvas.ts` 增加 `byId: Record<string, FlatField>` / `parentMap: Record<string, string>` 字段 + `setComponents` action case（reducer 内部 `buildIndex` 重建索引）；`setDesignerCanvasState` case 兼容旧调用方，payload 含 `components` 时也重建
  - `src/store/modules/designer-canvas-actions.ts` 新增 `setComponents(components)` action creator
  - `src/store/modules/index.ts` 导出 `setComponents`
  - `src/store/designer/hooks.ts` 新增 `useFieldConf(uniqueId)`（`useSelector(s => s.designerCanvas.byId[uniqueId], shallowEqual)`），barrel 同步导出
  - **删除 EventBus 全套**：
    - `src/designer/DataProvider.tsx` 删除 `runtimeComponentsTrigger` / `useSyncDesignerUpdate` / `useDesignerSettingChange` / `useEffect` 清理 EventBus；`setState` 的 `isForceUpdate=false` 路径改为 `dispatch(setComponents(nextState.components))`（reducer 内部重建 byId）
  - `src/designer/renderer/designer-field/index.tsx` 切 `useFieldConf(propsDataSource.uniqueId)`，删除 `useDesignerSettingChange` import；用 `fieldById ?? propsDataSource` 兜底
  - `src/designer/aside-panel/layers-tree/index.jsx` 切 `useSelector(s => s.designerCanvas.components, shallowEqual)` + `useMemo` 重组 state，删除 `useSyncDesignerUpdate` import
  - `src/designer/renderer/hooks/useDebounceMergeConfig.tsx` 删除 `selected` 引用 + `useSelector` import，setState 第三参数 `selected` 删除
  - `pnpm tsc --noEmit` 0 新增错误（13 个 pre-existing 错误：packages/ui 9 + common/dnd/helper 2 + designer-field/utils 2，与本任务无关）
  - grep 校验：实际代码层 0 命中 `runtimeComponentsTrigger` / `useDesignerSettingChange` / `useSyncDesignerUpdate`（注释 + .bak 文件除外）
  - AGENTS.md §3.1（数据流图重写） / §3.2（slice 描述更新） / §4.5（性能红线改用 useFieldConf） / §5.1（designerCanvas 描述补充 byId/parentMap）同步更新
- 2026-07-21：Review 修正（P0-3 / P0-5 / P1-4）：
  - §3.4 补 `useFieldConf` 与 `designer-field` 渲染数据需求分析：byId 的 FlatField 不存 children，但 designer-field 渲染体只读 `dataSource.data`（children 来自 props），byId 满足需求
  - §3.4 补 `ownerSetting` 回退逻辑分析：决策为不需要回退（Redux 订阅不会漏），但保留 `propsDataSource` 作为 fallback（`fieldById ?? propsDataSource`）
  - §3.4 新增 `useFieldConf` 适用范围表（designer-field/配置面板 ✅，layer-manager/useOnDrop ❌ 需 `getFieldNodeById`）
  - §4.1 `buildIndex` 注释补 drillDown 说明：只遍历 node.children，不遍历 data.config.drillDown（drillDown 子节点不进入 byId，level 由 setLevelPath 单独维护）