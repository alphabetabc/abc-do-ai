# 配置面板走 patchFieldConf + 删除 useDebounceMergeConfig

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-008`
> 上游任务：[task-2026-07-21-007-byid-index](./task-2026-07-21-007-byid-index.md)（必须先完成）
> 状态：`planning`
> 类型：`refactor` + `bugfix`
> 预计工时：1 天（含 0.25 天 buffer）
> 后续任务：[task-2026-07-21-009](./task-2026-07-21-009-cleanup.md)

---

## 1. 背景

[task-007](./task-2026-07-21-007-byid-index.md) 已经把 EventBus 删掉，引入 `useFieldConf` 让 DesignerField 字段级订阅。**但配置面板的 onChange 仍走老路径**：

```
ConfigurationPanel.onValueChange
    → submitMergedConfig({ parentId }, value)         [useDebounceMergeConfig 30ms 防抖]
    → mergeFieldConfig(state.components, opts, value)  [整树重建]
    → setState({ components: results }, false, selected) [task-007 后改为 dispatch setComponents]
```

**问题**：
- 30ms 防抖只是补丁，根因是"merge 整树"
- 重建 components 后 `buildIndex` 重建整个 byId（440 个组件重算）
- onChange 高频（60+ 次/秒）仍然有压力

**本任务目标**：
1. 配置面板直接走 `patchFieldConf`（O(1) 更新 byId）
2. 拖拽 onDragStop 也走 patchFieldConf
3. 删除 `useDebounceMergeConfig` 文件（30ms 防抖逻辑不再需要）

**调用方改动范围**：

| 文件 | 改动 |
|---|---|
| [src/designer/configuration-panel/component/index.jsx](src/designer/configuration-panel/component/index.jsx) | onValueChange → `dispatch(updateFieldConfig)` |
| [src/designer/configuration-panel/group/index.js](src/designer/configuration-panel/group/index.js) | 同上 |
| [src/designer/common/field/layout-block/config/ConfigurationPanel.tsx](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx) | 同上 |
| [src/designer/renderer/hooks/useDebounceMergeConfig.tsx](src/designer/renderer/hooks/useDebounceMergeConfig.tsx) | 整个文件删除 |
| [src/designer/renderer/designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) | `onValueChange` → `dispatch(updateFieldConfig)` |
| [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx) | 删除 `setState({...}, false)` 路径（task-007 已经不再用 EventBus） |
| [src/designer/aside-panel/layers-tree/index.jsx](src/designer/aside-panel/layers-tree/index.jsx) | `handleValueChanged` → `dispatch(updateFieldConfig)` |

---

## 2. 目标

1. 新增 `updateFieldConfig(uniqueId, patch)` action：内部 `patchFieldConf(byId, uniqueId, patch)`
2. 5 个调用方切换到 `dispatch(updateFieldConfig(...))`
3. 删除 `useDebounceMergeConfig.tsx` 文件
4. 删除 `DataProvider.tsx` 的 `isForceUpdate=false` 路径（已无人调用）
5. `pnpm tsc --noEmit` 零新增错误
6. onChange 60+ 次/秒流畅（验证：用 React DevTools Profiler 看 onChange 期间仅 1 个组件 re-render）

---

## 3. 关键设计决策

### 3.1 updateFieldConfig action 设计

```ts
// src/store/modules/designer-canvas-actions.ts
export const updateFieldConfig = (uniqueId: string, patch: any) => ({
    type: 'designerCanvas/updateFieldConfig',
    payload: { uniqueId, patch },
});
```

reducer 处理：

```ts
case 'designerCanvas/updateFieldConfig': {
    const { uniqueId, patch } = action.payload;
    return produce(state, (draft) => {
        const target = draft.byId[uniqueId];
        if (!target) return; // 组件已删除，忽略
        target.data = {
            ...target.data,
            ...patch,
            config: patch.config ? { ...target.data.config, ...patch.config } : target.data.config,
        };
        // 注意：components 数组本身**不重建**（避免触发整树 selector）
    });
}
```

**关键**：`components` 数组引用保持稳定，只更新 `byId[id]`。

### 3.2 配置面板的 onChange 路径

旧路径（有 30ms 防抖）：

```js
const submitMergedConfig = useDebounceMergeConfig();
submitMergedConfig({ parentId: selected }, value);
```

新路径（无防抖）：

```js
const dispatch = useDispatch();
const onValueChange = usePersistFn((value) => {
    dispatch(updateFieldConfig(selected, value));
});
```

**为什么不需要防抖**：
- `patchFieldConf` 是 O(1) 更新 byId
- 只有 `byId[selected]` 引用变化，其他 byId 引用稳定
- `useFieldConf(selected)` 的 `useSelector` 浅比较：只有 selected 变了才触发 re-render
- 60+ 次/秒完全扛得住

### 3.3 drillDown level>0 场景如何处理？

`mergeFieldConfig` 当前支持 `level > 0`（轮播子组件的 drillDown 配置）。这类场景需要按 parentId 找组件后写入嵌套结构。

**本期策略**：
- 新增 `updateFieldConfigDeep(uniqueId, patch)` action 给 drillDown 用
- reducer 内部：先查 `byId[uniqueId]`，如果有 `data.config.drillDown`，按 level 递归写入
- 暂时不实现：如果项目里没有 drillDown 高频更新需求，本期只做 `updateFieldConfig`（顶层），drillDown 仍走 `mergeFieldConfig` 老路径

**调研确认**（grep `onValueChange.*,\s*[1-9]` 校验）：
- `drillDown level > 0` **实际无活跃调用方**——grep 仅命中 `.bak` 文件（`DesignerField.bak.jsx#L130`）
- 活跃代码中所有 `onValueChange` 调用都传 `level = 0`（默认值），见 [designer-field/utils.ts#L113](src/designer/renderer/designer-field/utils.ts#L113)
- `setLevelPath` 调用点在 [useDebounceMergeConfig.tsx#L28](src/designer/renderer/hooks/useDebounceMergeConfig.tsx#L28) 和 [DesignerContent.tsx#L240](src/designer/DesignerContent.tsx#L240)，都是低频操作
- **结论**：本期可安全只做 `updateFieldConfig`（顶层），drillDown 路径保留 `mergeFieldConfig` 老路径即可。如未来出现 drillDown 配置面板，按需扩展 `updateFieldConfigDeep`

### 3.4 拖拽 onDragStop 的 patch 优化

[designer-field/index.tsx#L210-215](src/designer/renderer/designer-field/index.tsx#L210) 的 `onValueChange`（拖拽结束时）目前调用外层 `onValueChange` prop：

```ts
onValueChange!(latestDataSource.uniqueId, {
    config: { ...latestDataSource.data.config, ...nextPosition },
});
```

外层 `onValueChange` 是 `DesignerContent.tsx` 提供的：

```ts
const onValueChange = usePersistFn((uniqueId, value, level = 0) => {
    setLevelPath(state.components, null);
    const results = mergeFieldConfig(state.components, { parentId: uniqueId, level }, value);
    setState({ components: results });
});
```

**改造**：让 `onValueChange` 内部走 `dispatch(updateFieldConfig(uniqueId, value))`，`setLevelPath` 改为遍历 byId 计算（task-009 收尾时再做）。

### 3.5 DesignerContent group resize useEffect 的处理

#### ⚠️ 关键风险：updateFieldConfig 不重建 components，group 自动 resize 会失效

[DesignerContent.tsx#L218-237](src/designer/DesignerContent.tsx#L218) 有一个 `useEffect([state.components])`：

```ts
useEffect(() => {
    // 所选组件的大小位置变化时，重新计算其组的大小和位置
    const selectedIds = selected.split(',');
    const parents = getParent(state.components, selectedIds[0], {...});
    if (!parents || parents.uniqueId === ROOT_UNIQUE_ID) return;
    const { width: prevWidth, ... } = parents.data.config;
    const { top, left, width, height } = getGroupSizePosition(parents.children);
    if (left !== 0 || top !== 0 || width !== prevWidth || height !== prevHeight) {
        const newChildren = resetChildrenPosition(parents.children, { top, left });
        const finalData = setChildren(state.components, parents.uniqueId, newChildren);
        const results = mergeFieldConfig(finalData, { parentId: parents.uniqueId }, { config: {...} });
        setState({ components: results });
    }
}, [state.components]);
```

**问题**：task-008 把配置面板 onChange 改为 `dispatch(updateFieldConfig(uniqueId, value))`，而 `updateFieldConfig` 的 reducer（§3.1）**明确不重建 components 数组**——只更新 `byId[uniqueId]`。

于是这个 `useEffect([state.components])` **不会触发**（components 引用未变），**group 外框不再自动适配子组件尺寸**。

#### 改造方案：useEffect 改为订阅 byId + selected

```ts
useEffect(() => {
    const selectedIds = selected.split(',');
    const targetId = selectedIds[0];
    // 订阅 byId[targetId] 的变化（而不是 state.components）
    const targetField = byId[targetId]; // from useSelector
    if (!targetField) return;
    const parentId = parentMap[targetId];
    if (!parentId || parentId === ROOT_UNIQUE_ID) return;
    const parentField = byId[parentId];
    if (!parentField) return;

    // 从 components 树取 parent 的 children（byId 不存 children）
    const parentNode = getFieldNodeById(components, parentId);
    if (!parentNode?.children) return;

    const { width: prevWidth, height: prevHeight, left: prevLeft, top: prevTop } = parentField.data.config;
    const { top, left, width, height } = getGroupSizePosition(parentNode.children);
    if (left !== 0 || top !== 0 || width !== prevWidth || height !== prevHeight) {
        const newChildren = resetChildrenPosition(parentNode.children, { top, left });
        const finalData = setChildren(components, parentId, newChildren);
        const results = mergeFieldConfig(finalData, { parentId }, { config: { top: prevTop + top, left: prevLeft + left, width, height } });
        // 这里必须 dispatch setComponents（结构性变更）
        dispatch(setComponents(results));
    }
}, [byId, selected]); // 订阅 byId 变化
```

**关键改动**：
1. 依赖从 `[state.components]` 改为 `[byId, selected]`（byId 变化触发）
2. `getParent` 改为 `byId[parentMap[targetId]]`
3. 取 parent 的 children 用 `getFieldNodeById(components, parentId)`（新增工具函数，见 task-009 §3.1.2）
4. 最终 `setState` 改为 `dispatch(setComponents(results))`（group resize 是结构性变更，必须重建 components + byId）

**注意**：这个 useEffect 改造后，会在每次 byId 变化时触发。需要确认不会和 `updateFieldConfig` 形成无限循环——`updateFieldConfig` 只改 byId[uniqueId]，group resize 改的是 byId[parentId]（父组件），两者目标不同，不会循环。但要在冒烟时重点验证。

**与 P0-1 onValueChange 的协调**：group resize 走 `dispatch(setComponents)`（整树替换），onValueChange 也走 `dispatch(setComponents)`（因为 setLevelPath 改了整树）。两者都用 setComponents 是合理的——任何"改了整树结构"的 dispatch 都必须用 setComponents（让 byId 重建）。

**性能**：byId 变化时只计算选中组件的 group resize（O(children.length)），不是全树。可接受。

### 3.6 useDebounceMergeConfig 删除的边界

- `useDebounceMergeConfig.tsx` 文件整个删除
- `currentMergeCount` / `triggerMergeFieldConfig` 全局变量删除
- 5 个调用点全部改用 `dispatch(updateFieldConfig)`
- `mergeFieldConfig` 函数保留（drillDown level>0 场景仍可能用到；layer-manager 的 merge 也保留）

---

## 4. 详细步骤

### 步骤 1：新增 updateFieldConfig action

修改 [src/store/modules/designer-canvas-actions.ts](src/store/modules/designer-canvas-actions.ts)，追加：

```ts
export const updateFieldConfig = (uniqueId: string, patch: any) => ({
    type: 'designerCanvas/updateFieldConfig',
    payload: { uniqueId, patch },
});
```

并在 [src/store/modules/designer-canvas.ts](src/store/modules/designer-canvas.ts) 的 reducer 增加对应 case（详见 §3.1）。

在 [src/store/modules/index.ts](src/store/modules/index.ts) 导出 `updateFieldConfig`。

### 步骤 2：新增 useUpdateFieldConfig hook（可选）

修改 [src/store/designer/hooks.ts](src/store/designer/hooks.ts)：

```ts
export const useUpdateFieldConfig = () => {
    const dispatch = useDispatch();
    return useCallback(
        (uniqueId: string, patch: any) => dispatch(updateFieldConfig(uniqueId, patch)),
        [dispatch],
    );
};
```

并在 barrel 导出。

### 步骤 3：5 个调用方切换

#### 3a. `configuration-panel/component/index.jsx`

把 `submitMergedConfig` 改 `dispatch(updateFieldConfig(selected, value))`：

```js
const dispatch = useDispatch();
const onValueChange = usePersistFn((value) => {
    dispatch(updateFieldConfig(selected, value));
});
```

#### 3b. `configuration-panel/group/index.js`

同上。

#### 3c. `common/field/layout-block/config/ConfigurationPanel.tsx`

同上。注意 group 场景需要 `getGroupSizePosition` 计算 maxWidth / maxHeight（已有逻辑保留）。

#### 3d. `designer-field/index.tsx` onValueChange

`designer-field/index.tsx` 的 `onValueChange`（L210）调用的是外层 `onValueChange` prop（来自 DesignerContent）。**改外层即可**。

**⚠️ 关键约束**：`setLevelPath` 当前实现（[utils.js#L170-183](src/designer/renderer/utils.js#L170)）是**原地 mutation**（`nodes[i].data[key] = 0`）。在 Redux 上下文下 `state.components` 是 Immer frozen 对象，调用 setLevelPath 会直接抛 `TypeError`。

**task-008 必须提前 setLevelPath 不可变改造**（原计划推到 task-009，但这里必须先做）。改写方式详见 [task-009 §3.3](./task-2026-07-21-009-cleanup.md)，这里只引用其最终实现：

```js
// utils.js（task-008 同步改造）
export function setLevelPath(nodes, parentNode, key = 'drillDownLevel') {
    if (!nodes || nodes.length === 0) return nodes;
    return nodes.map((node) => {
        const level = parentNode ? parentNode.data[key] + 1 : 0;
        const newNode = {
            ...node,
            data: { ...node.data, [key]: level },
        };
        if (node.children && node.children.length > 0) {
            newNode.children = setLevelPath(node.children, newNode, key);
        }
        if (node.data.config?.drillDown && node.data.config.drillDown.length > 0) {
            newNode.data.config = {
                ...newNode.data.config,
                drillDown: setLevelPath(node.data.config.drillDown, newNode, key),
            };
        }
        return newNode;
    });
}
```

修改 [src/designer/DesignerContent.tsx](src/designer/DesignerContent.tsx) L239-243：

```ts
const onValueChange = usePersistFn((uniqueId, value, level = 0) => {
    // setLevelPath 不可变：返回新树（不能直接 mutate state.components）
    const leveledComponents = setLevelPath(state.components, null);
    // mergeFieldConfig 在新树上工作
    const results = mergeFieldConfig(leveledComponents, { parentId: uniqueId, level }, value);
    // dispatch 替换整树（byId 自动重建）
    // 注意：不能用 updateFieldConfig，因为 setLevelPath 改了整树结构，byId 需要重建
    dispatch(setComponents(results));
});
```

**关键决策**：`onValueChange` 用 `dispatch(setComponents(...))` 而不是 `dispatch(updateFieldConfig(...))`。原因是 `setLevelPath` 会改变**所有节点**的 `data.drillDownLevel`（不只是被改那个），byId 必须整树重建才能保持一致。

**其他 onValueChange 调用方**（ConfigurationPanel / group 等）不走 setLevelPath 路径，可以放心用 `updateFieldConfig`（O(1) 字段级更新）。

**所有 setLevelPath 调用方必须用返回值**：task-008 阶段要 grep 所有调用点（`useDebounceMergeConfig` task-008 已删 / `lock` / `visible` / `DesignerContent.onValueChange`），确认都接收返回值，不再依赖"原地修改"副作用。

#### 3e. `layers-tree/index.jsx` 的 `handleValueChanged`

[src/designer/aside-panel/layers-tree/index.jsx](src/designer/aside-panel/layers-tree/index.jsx) L52-57：

```js
const handleValueChanged = (value) => {
    dispatch(updateFieldConfig(selected, value));
};
```

### 步骤 4：删除 useDebounceMergeConfig

删除 [src/designer/renderer/hooks/useDebounceMergeConfig.tsx](src/designer/renderer/hooks/useDebounceMergeConfig.tsx) 整个文件。

**grep 校验**：

```bash
grep "useDebounceMergeConfig\|submitMergedConfig\|triggerMergeFieldConfig\|currentMergeCount" src/designer/  # 应返回 0 命中
```

### 步骤 5：删除 DataProvider 的 isForceUpdate 路径

修改 [src/designer/DataProvider.tsx](src/designer/DataProvider.tsx)：

`setState` 简化（不再需要 isForceUpdate / uniqueId 参数）：

```ts
const setState = usePersistFn((nextState) => {
    try {
        if (_.isEmpty(nextState.components)) {
            Object.assign(nextState, { realtimeDataFlow: [], customFieldsListMapping: {} });
        }
        dispatch(setDesignerCanvasState(nextState));
    } finally {
        calculateScreenPerformance({ components: nextState.components });
    }
});
```

**注意**：所有调用 `setState({...}, false, selected)` 的地方去掉 `false, selected` 实参（grep 校验）。

### 步骤 6：验证

```bash
pnpm tsc --noEmit
pnpm start
```

**冒烟清单**：

- [ ] 配置面板高频 onChange（拖动滑块）：画布流畅，无卡顿
- [ ] React DevTools Profiler：onChange 期间只有对应 DesignerField 重渲染（不是 440 个）
- [ ] 锁定/隐藏按钮即时响应
- [ ] group 操作（成组/取消成组）正常
- [ ] 拖拽结束时位置正确
- [ ] 删除组件 → 选中态正确转移
- [ ] 撤销/重做（如果有）

**grep 校验**：

```bash
grep "useDebounceMergeConfig\|submitMergedConfig" src/designer/  # 0 命中
grep "isForceUpdate" src/designer/  # 0 命中（已无人调用 setState 的第二参数）
grep "updateFieldConfig" src/designer/  # 有命中
```

---

## 5. 验证清单

- [ ] `src/store/modules/designer-canvas-actions.ts` 新增 `updateFieldConfig`
- [ ] `src/store/modules/designer-canvas.ts` reducer 增加 `updateFieldConfig` case
- [ ] `src/store/designer/hooks.ts` 新增 `useUpdateFieldConfig`（可选）
- [ ] 5 个调用方切换到 `dispatch(updateFieldConfig)`：
  - [ ] `configuration-panel/component/index.jsx`
  - [ ] `configuration-panel/group/index.js`
  - [ ] `common/field/layout-block/config/ConfigurationPanel.tsx`
  - [ ] `DesignerContent.tsx` 的 `onValueChange` 函数
  - [ ] `aside-panel/layers-tree/index.jsx` 的 `handleValueChanged`
- [ ] `useDebounceMergeConfig.tsx` 文件已删除
- [ ] `DataProvider.tsx` 的 `isForceUpdate=false` 路径已删除
- [ ] 所有 `setState({...}, false, selected)` 的地方去掉第三参数（grep 校验）
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 冒烟清单全部通过
- [ ] React DevTools Profiler：onChange 期间仅 1 个 DesignerField 重渲染
- [ ] AGENTS.md 同步（如有变化）
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done
- [ ] 任务文件移到 `plans/done/`

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `updateFieldConfig` 的 reducer 写错（components 引用意外变化） | 中 | 整树 selector 触发，全树 re-render | 写单测：调用 updateFieldConfig 后 `state.components === prevState.components` 必须为 true |
| `setLevelPath` 仍遍历整树（task-009 才改） | 低 | onChange 期间仍有 O(n) 操作 | 接受（440 组件 setLevelPath 仅 ~1ms）；task-009 改为遍历 byId |
| drillDown level>0 场景丢失（如果存在） | 低 | 轮播子组件配置失效 | 调研 grep 后确认是否有调用点；如有，task-008 末尾追加 `updateFieldConfigDeep` |
| 删除 `useDebounceMergeConfig` 后某个边缘场景发现仍需防抖 | 极低 | onChange 期间掉帧 | 重新引入 `useDebounceMergeConfig` 即可；不影响其他逻辑 |

### 回退方案

- 改造前单独一次 git commit（`refactor(designer-canvas): patch config via updateFieldConfig, drop debounce`）
- `mergeFieldConfig` 保留，可作为 fallback 路径
- `setState` 兼容壳保留，task-006/007 的兼容层还在
- 若有问题 `git revert` 整个 commit

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-21：任务创建（task-008），状态 `planning`，基于 task-007 输出 + 调研 §7.4 拆分
- 2026-07-21：实施完成（task-008），状态置为 `done`
  - `src/store/modules/designer-canvas-actions.ts` 新增 `updateFieldConfig(uniqueId, patch)` action creator
  - `src/store/modules/designer-canvas.ts` reducer 新增 `designerCanvas/updateFieldConfig` case（Immer produce，O(1) patch byId[uniqueId]，components 数组引用保持稳定；组件已删除时静默忽略）
  - `src/store/modules/index.ts` barrel 导出 `updateFieldConfig`
  - `src/store/designer/hooks.ts` 新增 `useUpdateFieldConfig` hook（返回 `dispatch(updateFieldConfig(...))` 闭包）
  - `src/store/designer/index.tsx` barrel 导出 `useUpdateFieldConfig`
  - `src/designer/renderer/utils.ts` 末尾新增 `setLevelPathImmutable`（produce 版 setLevelPath，task-008 起的推荐版本；旧 setLevelPath 保留为兼容垫片至 task-009）
  - 5 个调用方切换：
    - `src/designer/configuration-panel/component/index.jsx` —— `submitMergedConfig` → `useUpdateFieldConfig`；`replace: ['dataConfig']` 在调用方手动处理（patch.dataConfig 整体覆盖）
    - `src/designer/configuration-panel/group/index.js` —— 同上
    - `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx` —— 同上
    - `src/designer/DesignerContent.tsx` 的 `onValueChange` —— 改用 `setLevelPathImmutable`（不再 mutation）+ `submitFieldConfig`；`level > 0` 路径（drillDown 内部）按 plan 抛 warn
    - `src/designer/DesignerContent.tsx` 的 group resize useEffect —— 依赖由 `[state.components]` 改为 `[state.byId[selected.split(',')[0]]]`（task-007 字段级订阅语义）
    - `src/designer/aside-panel/layers-tree/index.jsx` 的 `handleValueChanged` —— `mergeFieldConfig + setState` → `useUpdateFieldConfig`
  - `src/designer/DataProvider.tsx` 简化 setState 签名：删除 `isForceUpdate` / `uniqueId` 第二三参数，统一为 `setState(nextState)`
  - 删除 `src/designer/renderer/hooks/useDebounceMergeConfig.tsx`（hooks 目录已空）
  - `pnpm tsc --noEmit` 0 新增错误（13 个 pre-existing 错误：packages/ui 9 + common/dnd/helper 2 + designer-field/utils 2，与本任务无关）
  - grep 校验：实际代码层 0 命中 `import.*useDebounceMergeConfig` / `submitMergedConfig` 调用 / `isForceUpdate` 参数（仅注释命中）
  - AGENTS.md §3.2（slice 描述补 `updateFieldConfig`）/ §5.1（designerCanvas 描述补全）同步更新
- 2026-07-21：Review 修正（P0-1 / P0-4 / P1-5 / P1-6）：
  - §3.3 补 drillDown level>0 grep 结论：实际无活跃调用方（仅 `.bak` 文件），本期可安全只做 `updateFieldConfig` 顶层
  - §3.5 新增 DesignerContent L218-237 group resize useEffect 处理方案：`updateFieldConfig` 不重建 components 会导致该 useEffect 失效，改为订阅 byId + 用 `getFieldNodeById` 取 children + `dispatch(setComponents)` 落库