# task-2026-07-28-002：单源重构（2/4）— 单源 reducer 改造

> 单源重构系列第 2 个 task，承载元计划 task-2026-07-27-001 阶段 4 的**核心 reducer 改造步骤**（步骤 2 / 3 / 4 / 5）。
>
> - 计划日期：2026-07-28
> - 任务编号：`task-2026-07-28-002`
> - 状态：`planning`
> - 类型：`refactor`（架构级）
> - 上游：[task-2026-07-28-001 mutation 清理](./task-2026-07-28-001-single-source-refactor-mutation-cleanup.md)（**硬依赖**：所有 mutation 必须先消除）
> - 下游：[task-2026-07-28-003 死代码清理 + 保存路径](./task-2026-07-28-003-single-source-refactor-cleanup-save.md)（**硬依赖本 task 完成**：mergeByIdIntoTree 调用方必须先清零）

---

## 1. 背景与目标

本 task 是单源重构的"心脏手术"——把 3 个 reducer action 从"双源同步"改为"单源 + byId 派生"：

- `updateFieldConfig`：从 O(1) patch byId 改为 O(depth) produce 改树 + O(n) buildIndex 派生
- `setComponents`：删除 `mergeByIdIntoTree(fieldPreserve)` 调用，直接赋值 + buildIndex
- `setState`：同 setComponents + 顺手修 `'components' in` 隐 bug + byId/parentMap 直接赋值防护
- `recalcGroupBounds`：删除 freshChildNodes 包装 + 两步同步 + skip 分支，简化为单次 setComponents

**核心契约变更**：
- byId 从"可独立写入"变为"纯派生（只读）"
- components 树从"结构性变更时整树替换"变为"字段级更新也改树"
- useFieldConf 订阅粒度由 buildIndex 引用复用保持（决策 11）

**完成标准**：3 个 reducer action 全部改为单源实现 + recalcGroupBounds 简化 + tsc 通过 + 浏览器冒烟通过 + 性能不退化（对比 task-001 步骤 0 基线）。

---

## 2. 步骤总览

| 步骤 | 改动 | 文件数 | 风险 | 独立 commit |
| --- | --- | --- | --- | --- |
| 2 | updateFieldConfig reducer 改为 produce 改树 + buildIndex | 2 | **极高** | `refactor: updateFieldConfig 改为 Immer produce 改树 + buildIndex 派生` |
| 3 | setComponents reducer 删除 mergeByIdIntoTree | 1 | **极高** | `refactor: setComponents reducer 删除 mergeByIdIntoTree 调用` |
| 4 | setState reducer 删除 mergeByIdIntoTree + 修隐 bug + 防护 | 2 | 高 | `refactor: setState reducer 删除 mergeByIdIntoTree + 修隐 bug + 防护` |
| 5 | 简化 recalcGroupBounds（删 freshChildNodes + 两步同步 + skip 分支） | 1 | 高 | `refactor: recalcGroupBounds 简化为单次 setComponents` |

**依赖关系**：
- 步骤 2 → 3 → 4 改同一文件相邻 case（[designer-canvas.ts](../../src/store/modules/designer-canvas.ts) L74-L139），建议按顺序执行
- 步骤 5 **硬依赖** 步骤 2/3/4 全部完成（freshChildNodes 包装删除前单源必须先到位，否则 task-012-2 修复回归）

---

## 3. 详细步骤

### 步骤 2：改 `updateFieldConfig` reducer

> ⚠️ **契约变更 + 架构级风险**：本步骤把字段级更新从 O(1) patch byId 改为 O(n) buildIndex 全量重建，**破坏 useFieldConf 的 shallowEqual 订阅粒度**（AGENTS.md §4.5 性能红线）。已含**强制缓解方案**（buildIndex 未变节点引用复用）。

**目标**：把字段级更新从"直接 patch byId"改为"Immer produce 改树 + buildIndex 派生 + 未变节点引用复用"。

**文件**：
- [`src/store/modules/designer-canvas.ts`](../../src/store/modules/designer-canvas.ts#L110-L139) L110-L139（reducer case）
- [`src/designer/renderer/utils.ts`](../../src/designer/renderer/utils.ts#L784-L807) L784-L807（buildIndex 签名扩展）

**当前实现**（已 Read 确认 L110-L139）：
```ts
case 'designerCanvas/updateFieldConfig': {
    const { uniqueId, patch } = action.payload;
    return produce(state, (draft) => {
        const target = draft.byId[uniqueId];
        if (!target) return;
        const newData = {
            ...target.data,
            ...patch,
            config: patch.config ? { ...target.data.config, ...patch.config } : target.data.config,
        };
        target.data = newData;
        if (patch.config) {
            if (!target.dirtyConfigKeys) {
                target.dirtyConfigKeys = new Set();
            }
            Object.keys(patch.config).forEach((key) => target.dirtyConfigKeys.add(key));
        }
    });
}
```

**目标实现**：

> ⚠️ **r1§1.2 修复**：`oldById` 必须从**原始 `state.byId`**（produce 外捕获）传入，**不能传 `draft.byId`**。
>
> **原因**：在 `produce(state, draft => { ... })` 内部，`draft.byId` 是 Immer proxy。访问 `draft.byId[id].data` 会触发 Immer 的 proxy 包装——即使原始 `state.byId[id].data === state.components[...].data`（同一引用），经 proxy 包装后引用比较可能失效。`setAutoFreeze(false)`（[initializer/index.ts:23](../../src/app/initializer/index.ts#L23)）让未修改对象返回原引用，但 proxy 包装层仍可能破坏 `===` 比较。
>
> **正确做法**：在 produce 外捕获 `const oldById = state.byId;`，传入 buildIndex。buildIndex 内部遍历的是 `draft.components`（proxy），但 `oldEntry.data` 来自原始 `state.byId`（非 proxy），`node.data` 来自 `draft.components`（proxy）。对于**未被修改的节点**，Immer 结构共享会让 `draft.components[...].data` 返回原始 `state.components[...].data` 引用，此时 `oldEntry.data === node.data` 成立（因为 `state.byId[id].data === state.components[...].data` 是 buildIndex 的浅引用赋值契约）。
>
> **验证**：步骤 0 的 `verifyImmerProxyReference()` **必做**（不再是可选），确认单源后 `sameRef=true`（baseline §2.7 双源下 sameRef=false 是预期，单源后需翻转）。

```ts
case 'designerCanvas/updateFieldConfig': {
    const { uniqueId, patch } = action.payload;

    // 边界检查（produce 外面）
    if (uniqueId === ROOT_UNIQUE_ID) return state;
    if (!state.parentMap[uniqueId]) return state;
    if (!patch || Object.keys(patch).length === 0) {
        return state;
    }

    // ⚠️ 关键：在 produce 外捕获旧 byId 引用（r1§1.2 修复）
    // 不能传 draft.byId（Immer proxy 会破坏 === 比较）
    const oldById = state.byId;

    return produce(state, (draft) => {
        // 1. parentMap 反向追踪找路径 O(depth)
        const path: string[] = [];
        let current: string = uniqueId;
        let depth = 0;
        const MAX_DEPTH = 100;
        while (current !== ROOT_UNIQUE_ID) {
            path.unshift(current);
            const next = draft.parentMap[current];
            if (!next) return; // parentMap 不一致：放弃本次更新
            if (++depth >= MAX_DEPTH) {
                console.error('[updateFieldConfig] 超过最大深度', MAX_DEPTH, 'uniqueId:', uniqueId);
                return;
            }
            current = next;
        }

        // 2. 沿路径找到节点 O(depth)
        // draft.components 是数组，不是带 children 的根节点
        let currentChildren: any[] = draft.components;
        let node: any = null;
        for (const id of path) {
            node = currentChildren?.find((c: any) => c.uniqueId === id) ?? null;
            if (!node) return; // 树与 parentMap 不一致：放弃
            currentChildren = node.children || [];
        }

        // 3. 修改节点 data（浅合并）
        node.data = {
            ...node.data,
            ...patch,
            config: patch.config ? { ...node.data.config, ...patch.config } : node.data.config,
        };

        // 4. buildIndex 重建 byId/parentMap O(n)，引用复用保持订阅粒度
        // ⚠️ 传入 oldById（原始 state.byId），不是 draft.byId
        const { byId, parentMap } = buildIndex(draft.components, oldById);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

**须同步修改 `buildIndex` 函数签名**（[utils.ts:784](../../src/designer/renderer/utils.ts#L784)）：

```ts
// 新签名（增加可选参数 oldById 用于引用复用）
export function buildIndex(
    components: any[],
    oldById?: Record<string, FlatField>,
): { byId: Record<string, FlatField>; parentMap: Record<string, string> } {
    const byId: Record<string, FlatField> = {};
    const parentMap: Record<string, string> = {};
    const walk = (nodes: any[], parentId: string) => {
        for (const node of nodes || []) {
            if (!node || !node.uniqueId) continue;
            // 引用复用：data 未变化时复用旧条目，保持 shallowEqual 订阅粒度
            // oldEntry 来自原始 state.byId（非 Immer proxy），node.data 来自 draft.components
            // 未修改节点经 Immer 结构共享返回原引用 → oldEntry.data === node.data 成立
            const oldEntry = oldById?.[node.uniqueId];
            byId[node.uniqueId] = (oldEntry && oldEntry.data === node.data)
                ? oldEntry
                : { uniqueId: node.uniqueId, type: node.type, parentId, data: node.data };
            parentMap[node.uniqueId] = parentId;
            if (Array.isArray(node.children) && node.children.length > 0) {
                walk(node.children, node.uniqueId);
            }
        }
    };
    walk(components || [], ROOT_UNIQUE_ID);
    return { byId, parentMap };
}
```

**需新增 import**：`ROOT_UNIQUE_ID` 从 `@Src/designer/renderer/utils`（若未导入）

**核心改动**：
1. **数据结构修正**：`draft.components` 是数组，遍历用 `currentChildren` 而非 `node.children`
2. **契约缓解**：`buildIndex(components, oldById)` 内部对未变 data 节点复用旧 byId 引用
3. **r1§1.2 修复**：`oldById` 从 `state.byId`（produce 外）捕获，**不传 `draft.byId`**（Immer proxy 破坏 `===`）
4. **Immer 语义**：produce 内全部 `return state` 改为 `return;`
5. **MAX_DEPTH 阈值**：100（10 倍冗余，440 组件场景实测最深 ≈ 10 层），前置递增 `++depth >= MAX_DEPTH`
6. **防御性编程**：parentMap 不一致 / 树与 parentMap 不一致 / 空 patch / currentChildren undefined 全部走 `return;`
7. **patch 为空检查**：避免无意义的 buildIndex（r1§3.4：删除冗余 `typeof patch === 'object'`）

**性能验收标准**（基于 task-001 步骤 0 基线）：

> ⚠️ **r1§1.1 修复**：baseline §2.5 实测当前双源架构下 N=440 串行对齐耗时 **75 秒**，N=10 也要 3.7 秒。这是**当前就存在的严重性能问题**，不是单源重构引入的退化。单源后若仍走串行 updateFieldConfig，性能只会更糟（每次 updateFieldConfig 都 buildIndex）。
>
> **结论**：对齐操作**必须走方案 B（批量 setComponents）**，不是"退化超阈值才回退"。方案 B 是**默认实现**，不是备选方案。

| 指标 | 基线（双源） | 单源后阈值 | 回退路径 |
| --- | --- | --- | --- |
| `buildIndex` 单次（440 组件） | p95=0.2ms | p95 ≤ 0.24ms (1.2x) | 纯计算，预期持平 |
| `updateFieldConfig` 单次 | p95=158.7ms | p95 ≤ 190ms (1.2x) | 引用复用失效 → 全量 re-render → 方案 D（增量 buildIndex） |
| 拖动单个组件（onDragStop）帧率 | task-001 基线实测 | ≥ max(50fps, 基线 - 5fps) | 加 rAF 节流（方案 C） |
| buildIndex 引用复用 sameRef | **false**（双源） | **true**（单源后翻转） | **必做验证**（步骤 0 verifyImmerProxyReference） |
| 全选对齐（N=10）总耗时 | 串行 3731ms | **≤ 50ms（方案 B 必选）** | 方案 B 是默认实现，非回退路径 |
| 全选对齐（N=440）总耗时 | 串行 74933ms | **≤ 200ms（方案 B 必选）** | 方案 B 基线 523ms，需 rAF 节流进一步降低 |
| 批量对齐（N=440）单次 setComponents | 523ms | ≤ 523ms（持平） | 方案 B 基线 |

**对齐热路径方案 B（必选实现）**：

> 当前 [canvas-graph/index.tsx:330-357](../../src/designer/canvas-graph/index.tsx#L330-L357) `handleAlign` 是 `selectFields.forEach((item) => { dispatch(updateFieldConfig(...)) })`——串行 N 次 dispatch。单源后必须改为 1 次 setComponents。

```ts
// handleAlign 改造（单源后必选）
const handleAlign = (align: AlignType) => {
    if (!align) return;
    const selectedIds = selected.split(',');
    const selectFields = selectedIds.map((item) => store.getState().designerCanvas.byId[item]);
    const { leftValue, topValue, rightValue, bottomValue } = getGroupSizePosition(selectFields) as any;

    // 方案 B：1 次 setComponents 完成 N 个组件对齐
    const designerState = store.getState().designerCanvas;
    let newComponents = designerState.components;
    selectFields.forEach((item) => {
        let value: { left?: number; top?: number };
        switch (align) {
            case 'left': value = { left: leftValue }; break;
            case 'right': value = { left: rightValue - item.data.config.width }; break;
            case 'top': value = { top: topValue }; break;
            case 'bottom': value = { top: bottomValue - item.data.config.height }; break;
            case 'vertical': value = { top: (topValue + bottomValue) / 2 - item.data.config.height / 2 }; break;
            case 'horizontal': value = { left: (leftValue + rightValue) / 2 - item.data.config.width / 2 }; break;
            default: value = {}; break;
        }
        // mergeFieldConfig 在树上改 left/top，1 次 dispatch
        newComponents = mergeFieldConfig(newComponents, { uniqueId: item.uniqueId }, { config: value });
    });
    dispatch(setComponents(newComponents));
};
```

**验证**：
```bash
pnpm exec tsc --noEmit
# 验证 buildIndex 引用复用生效（r1§3.2 补充具体步骤）：
# 1. 打开 React DevTools Profiler
# 2. 开启 "Record why each component rendered"
# 3. 点击 Profiler 录制按钮
# 4. 选中 1 个组件，dispatch updateFieldConfig(id, { config: { left: 100 } })
# 5. 停止录制
# 6. 查看其他组件的 re-render 计数：应全部为 0
# 7. 仅目标组件 re-render 计数为 1
# 8. 若其他组件 re-render 计数 > 0 → 引用复用失效 → 触发方案 D（增量 buildIndex）
```

**浏览器冒烟**：
- [ ] 拖动组件：位置正确更新（onDragStop → onValueChange → submitFieldConfig → updateFieldConfig）
- [ ] 多选拖动：所有选中组件位置联动更新
- [ ] 配置面板改属性：所有配置面板（组件 / 组 / layout-block / 页面）正常更新
- [ ] 图层树锁定/隐藏：状态正确更新
- [ ] 对齐按钮（左/右/上/下/水平居中/垂直居中）：选中组件位置正确对齐
- [ ] **layer-manager 6 模块**：复制 / 移动 / 锁定 / 显示隐藏 / 删除 / 成组拆组
- [ ] **context-menu 9 操作**：复制 / 移动 / 锁定 / 隐藏 / 删除
- [ ] **layers-tree**：拖动 / 锁定 / 隐藏 / 选中联动

**边界场景测试**：
- [ ] 删除瞬间 dispatch updateFieldConfig（parentMap 不一致）：放弃更新，不抛错
- [ ] 循环引用场景（构造 mock 验证 MAX_DEPTH 触发 + console.error）

**回退**：`git revert` 此 commit

> ⚠️ **Revert 冲突风险**：本步骤与步骤 3/4 改同一文件相邻 case。单独 revert 可能因相邻 case 修改产生 merge conflict。回退顺序建议：步骤 4 → 步骤 3 → 重新应用步骤 4。

**commit**：`refactor: updateFieldConfig 改为 Immer produce 改树 + buildIndex 派生（单源 reducer 改造 - action 1/3，含 O(1)→O(n) 引用复用缓解）`

---

### 步骤 3：改 `setComponents` reducer

**目标**：删除 `mergeByIdIntoTree(fieldPreserve)` 调用，改为"直接赋值 components + buildIndex"。

**文件**：[`src/store/modules/designer-canvas.ts`](../../src/store/modules/designer-canvas.ts#L74-L89) L74-L89

**当前实现**（已 Read 确认 L74-L89）：
```ts
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        const mergedComponents = mergeByIdIntoTree(action.payload, state.byId, 'fieldPreserve');
        draft.components = mergedComponents;
        const { byId, parentMap } = buildIndex(mergedComponents);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

**目标实现**：
```ts
case 'designerCanvas/setComponents': {
    return produce(state, (draft) => {
        draft.components = action.payload;
        // r1§1.2 修复：传 state.byId（produce 外），不传 draft.byId（Immer proxy 破坏 ===）
        const { byId, parentMap } = buildIndex(draft.components, state.byId);
        draft.byId = byId;
        draft.parentMap = parentMap;
    });
}
```

**核心改动**：
- 删除 `mergeByIdIntoTree(payload, state.byId, 'fieldPreserve')` 调用
- 直接 `draft.components = action.payload`
- buildIndex 输入改用 `draft.components`（在 produce 内，Immer 允许读 draft 引用）
- **r1§1.2 修复**：`buildIndex(draft.components, state.byId)` 第二参数传 `state.byId`（produce 外），不传 `draft.byId`（Immer proxy 破坏 `===`）

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**：
- [ ] 从素材面板拖入新组件：组件正确出现在画布
- [ ] 图层树拖拽节点（移动层级 / 放入子节点 / 删除）
- [ ] 右键菜单成组 / 拆组
- [ ] onDragStop 把组件拖入 layout-block
- [ ] onResize 缩放组件
- [ ] 拖动组件到组内（dropToGroup）
- [ ] 导入配置（toolbar setDesignerCanvasState）：树正确重建
- [ ] **数据查询初始化（InitDataQuery）**：组件正确渲染，数据集正确加载

**回退**：`git revert` 此 commit

> ⚠️ **Revert 冲突风险**：与步骤 2/4 改同一文件相邻 case。

**commit**：`refactor: setComponents reducer 删除 mergeByIdIntoTree 调用（单源 reducer 改造 - action 2/3）`

---

### 步骤 4：改 `setState` reducer（+ `'components' in` 隐 bug + byId/parentMap 防护）

> ⚠️ **单源原则风险**：`Object.assign(draft, action.payload)` 可能破坏单源原则——若调用方传 `{ byId: ... }` 不传 `components`，byId 会被直接赋值而不通过 buildIndex 派生。需显式防护。

**目标**：删除 `mergeByIdIntoTree(fieldPreserve)` 调用；顺手把 `'components' in action.payload` 改为 `Object.prototype.hasOwnProperty.call(...)`；增加 byId/parentMap 直接赋值的防护。

**文件**：
- [`src/store/modules/designer-canvas.ts`](../../src/store/modules/designer-canvas.ts#L90-L103) L90-L103（reducer case）
- [`src/designer/DesignerContent.tsx`](../../src/designer/DesignerContent.tsx#L154) L154（setState 兼容函数）

**当前实现**（已 Read 确认 L90-L103）：
```ts
case 'designerCanvas/setState': {
    return produce(state, (draft) => {
        Object.assign(draft, action.payload);
        if ('components' in action.payload) {
            const mergedComponents = mergeByIdIntoTree(action.payload.components, state.byId, 'fieldPreserve');
            draft.components = mergedComponents;
            const { byId, parentMap } = buildIndex(mergedComponents);
            draft.byId = byId;
            draft.parentMap = parentMap;
        }
    });
}
```

**目标实现**（reducer）：
```ts
case 'designerCanvas/setState': {
    const payload = action.payload;

    // 单源原则防护：byId/parentMap 不允许通过 setState 直接赋值
    if ('byId' in payload || 'parentMap' in payload) {
        console.error('[setState] byId/parentMap 不能直接设置，单源架构下应由 buildIndex 派生');
    }

    return produce(state, (draft) => {
        // 过滤掉 byId/parentMap（防护），再合并其他字段
        const safePayload = { ...payload };
        delete safePayload.byId;
        delete safePayload.parentMap;
        Object.assign(draft, safePayload);

        // 隐 bug 修复：用 hasOwnProperty 替代 'in'
        if (Object.prototype.hasOwnProperty.call(payload, 'components')) {
            draft.components = payload.components;
            // 引用复用（与步骤 2/3 buildIndex 签名一致）
            const { byId, parentMap } = buildIndex(draft.components, state.byId);
            draft.byId = byId;
            draft.parentMap = parentMap;
        }
    });
}
```

> **r2§1.3 决策理由：为什么用 console.error 而不是 throw**
>
> `setState` 是兼容旧调用方的通用 action（`Object.assign(draft, payload)`），调用方可能传任意字段。当前 grep 确认没有"只传 byId/parentMap 不传 components"的调用方，但无法保证未来不出现。
>
> - **throw**：会导致边缘场景（如第三方插件传错字段）直接崩溃，影响用户数据丢失
> - **console.error + 降级**：开发环境能看到警告，生产环境不崩溃，byId/parentMap 被过滤掉（safePayload 删除），状态保持一致
>
> 这与 Immer 冻结对象 mutation 的 `throw TypeError` 不同——那是**运行时不可变契约**（必须 throw），而这是**架构原则约束**（建议 console.error + 降级）。

**DesignerContent L154 同步修复**（已 Read 确认）：
```ts
// 当前
if (nextState && typeof nextState === 'object' && 'components' in nextState) {
// 改为
if (nextState && typeof nextState === 'object' && Object.prototype.hasOwnProperty.call(nextState, 'components')) {
```

**核心改动**：
1. reducer 删除 mergeByIdIntoTree：直接 `draft.components = payload.components` + buildIndex（引用复用）
2. **r1§1.2 修复**：buildIndex 传 `state.byId`（produce 外），不传 `draft.byId`
3. reducer 隐 bug 修复：`'components' in` 改 `Object.prototype.hasOwnProperty.call(...)`
4. reducer 单源原则防护：检测 `byId`/`parentMap` 直接赋值并 console.error，从 safePayload 中删除（r2§1.3：决策理由见上）
5. DesignerContent L154 同步修复

**验证**：
```bash
pnpm exec tsc --noEmit
# 验证 setState 防护生效（在 console 执行）：
# dispatch(setDesignerCanvasState({ byId: { test: {} } }))
# → 应看到 console.error: [setState] byId/parentMap 不能直接设置...
# → state.byId 不应被改变
```

**浏览器冒烟**：
- [ ] 导入配置（toolbar setDesignerCanvasState）：树正确重建，所有组件渲染正确
- [ ] 页面配置面板（configuration-panel/page onChange）
- [ ] 数据查询初始化（InitDataQuery）
- [ ] DesignerContent setState 兼容函数（dataSource 初始化）
- [ ] **`setState({ byId: {} })` 触发 console.error**（防护单元测试场景）

**调用方回归验证**：
- [ ] Grep `setDesignerCanvasState\|setState(` 所有调用方，确认无"只传 byId/parentMap 不传 components"的场景

**回退**：`git revert` 此 commit

> ⚠️ **Revert 冲突风险**：与步骤 2/3 改同一文件相邻 case。

**commit**：`refactor: setState reducer 删除 mergeByIdIntoTree + 修 'components' in 隐 bug + byId 直接赋值防护（单源 reducer 改造 - action 3/3）`

---

### 步骤 5：简化 `recalcGroupBounds`

> ⚠️ **r2§1.2 修正：硬依赖仅步骤 2**（不是步骤 2/3/4）
>
> **原因**：`freshChildNodes` 包装（[DesignerContent.tsx:308-L314](../../src/designer/DesignerContent.tsx#L308-L314)）的存在是为了应对"双源下 byId fresh 但 tree stale"。只要**步骤 2 完成**（updateFieldConfig 改为改树 + buildIndex），tree 就永远 fresh，freshChildNodes 就失去存在意义。步骤 3/4 与 recalcGroupBounds 的 freshChildNodes **无直接关系**。
>
> **软依赖**：建议步骤 3/4 也完成后才执行步骤 5，原因是减少中间态数量、降低测试成本（见 §4.4 mixed-mode 分阶段冒烟）。但**不是硬阻塞**——若步骤 3/4 遇到问题，步骤 5 可以提前执行。

**目标**：删除 `freshChildNodes` 包装 + task-012-2 两步同步 + `shouldSkipGroupRecalc` 分支 + 引用已删除机制的注释。

**文件**：[`src/designer/DesignerContent.tsx`](../../src/designer/DesignerContent.tsx#L278-L383) L278-L383 + L299-L300, L341-L348（注释清理）

**当前实现**（已 Read 确认 L278-L383，约 100 行）：
- L286-L296: 取 parent + `freshChildNodes` 包装
- L307-L314: `freshChildNodes` 用 byId 重算子组件 data（双源 stale 防护）
- L316: getGroupSizePosition 输入 freshChildNodes
- L322-L338: `shouldSkipGroupRecalc()` 分支（永远 false，但代码存在）
- L340-L375: 正常路径（含 task-012-2 两步同步）
- L299-L300, L341-L348 注释引用 dirtyConfigKeys / fieldPreserve / freshChildNodes / 两步同步

**目标实现**（约 60 行）：
```ts
const recalcGroupBounds = () => {
    if (isRecalcRef.current) return;
    const designerCanvas = reduxStore.getState().designerCanvas;
    const currentSelected = reduxStore.getState().component.selected;
    const selectedIds = currentSelected.split(',');
    const parentMap = designerCanvas.parentMap;
    const parentId = parentMap[selectedIds[0]];
    if (!parentId || parentId === ROOT_UNIQUE_ID) return;
    const parents = getFieldNodeById(designerCanvas.components, parentId);
    if (!parents || parents.uniqueId === ROOT_UNIQUE_ID || !parents.children) return;
    const { width: prevWidth, height: prevHeight, left: prevLeft, top: prevTop } = parents.data.config;

    // 直接读 components（单源后永远 fresh，无需 freshChildNodes 包装）
    const { top, left, width, height } = getGroupSizePosition(parents.children);

    if (left !== 0 || top !== 0 || width !== prevWidth || height !== prevHeight) {
        const newChildren = resetChildrenPosition(parents.children, { top, left });
        const finalData = setChildren(designerCanvas.components, parents.uniqueId, newChildren);
        const results = mergeFieldConfig(
            finalData,
            { parentId: parents.uniqueId },
            { config: { top: prevTop + top, left: prevLeft + left, width, height } },
        );
        isRecalcRef.current = true;
        setState({ components: results });
        isRecalcRef.current = false;
    }
};
```

**删除内容**：
- L307-L314 `freshChildNodes` 整段（13 行）
- L322-L338 `shouldSkipGroupRecalc` 整段（17 行）
- L360-L371 task-012-2 两步同步整段（12 行）
- L292-L296 死分支简化（`parentId === ROOT_UNIQUE_ID` 三元另一分支永不执行）
- L19 `shouldSkipGroupRecalc` import 删除
- L299-L300 注释段（引用 dirtyConfigKeys + fieldPreserve）
- L341-L348 注释段（引用 freshChildNodes + 两步同步）

**核心改动**：
- getGroupSizePosition 输入从 freshChildNodes 改回 parents.children
- 删除两步同步（单源后 components 永远 fresh，单次 setComponents 即可）
- 删除 shouldSkipGroupRecalc 分支
- 删除引用已删除机制的注释

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**（重点验证 task-012-2 修复未回归）：
- [ ] 拖动组内子组件：组尺寸正确跟随子组件（不漂移，不二次位移）
- [ ] 拖动组内子组件到组外：组尺寸正确收缩
- [ ] 组内对齐（左/右/上/下/水平居中/垂直居中）：组位置不意外跳变
- [ ] 拖动整个组：组位置正确更新
- [ ] 删除组内组件：组尺寸正确收缩
- [ ] 成组 / 拆组：组件结构正确变化
- [ ] **批量操作后 recalcGroupBounds 触发**：连续 3 次 dispatch 后只触发 1 次 recalc（验证 isRecalcRef 防重入）

**回退**：`git revert` 此 commit

**commit**：`refactor: recalcGroupBounds 简化为单次 setComponents（删除 freshChildNodes + 两步同步 + skip 分支 + 引用已删除机制的注释）`

---

## 4. 验证清单

### 4.1 类型安全（每步必跑）

```bash
pnpm exec tsc --noEmit
```

- `src/` 目录 0 错误

### 4.2 浏览器冒烟

#### 基础交互（6 项）
- [ ] 从素材面板拖入新组件
- [ ] 选中组件（单击 / ctrl+多选）
- [ ] 拖动组件（onDrag）
- [ ] onDragStop 拖动组件（多选时子组件联动）
- [ ] 缩放组件（onResize）
- [ ] 删除组件（Delete 快捷键）

#### layer-manager 6 模块
- [ ] 复制 / 移动到顶底层上下移 / 锁定解锁 / 显示隐藏 / 删除 / 成组拆组

#### 右键菜单 9 操作
- [ ] 复制 / 移动 / 锁定 / 隐藏 / 删除

#### 组相关
- [ ] 成组 / 拆组 / 拖动组内子组件（不漂移不二次位移）/ 拖动整个组 / 组内对齐 / 删除组内组件

#### 配置面板
- [ ] 组件 / 组 / layout-block / 页面 配置面板改属性

#### 保存 / 导入
- [ ] 保存大屏 / 另存为模板 / 场景监控 postMessage / 导入配置 / Ctrl+S

### 4.3 性能验证（步骤 2 完成后对比基线）

| 指标 | 基线 | 单源后阈值 | 验证方法 |
| --- | --- | --- | --- |
| `buildIndex` 单次（440 组件） | p95=0.2ms | p95 ≤ 0.24ms (1.2x) | Console performance.mark |
| `updateFieldConfig` 单次 | p95=158.7ms | p95 ≤ 190ms (1.2x) | Console performance.mark |
| 拖动单个组件帧率 | task-001 基线实测 | ≥ max(50fps, 基线 - 5fps) | Chrome DevTools Performance |
| 全选对齐（N=10）总耗时 | 串行 3731ms | **≤ 50ms（方案 B 必选）** | Console 计时（方案 B 实现） |
| 440 组件全选对齐 | 串行 74933ms | **≤ 200ms（方案 B 必选）** | Console 计时（方案 B + rAF） |
| buildIndex 引用复用 sameRef | false（双源） | **true**（单源后翻转） | verifyImmerProxyReference() + React DevTools Profiler |

### 4.4 mixed-mode 分阶段冒烟（r1§2.2 + r2§1.4 修复）

> mixed-mode 持续时间长（步骤 2 完成即开始，步骤 5 完成才结束）。每个步骤完成后都跑一次 mixed-mode 冒烟，而非只在步骤 2 后跑 1 项。

#### mixed-mode #1（步骤 2 完成后）
> updateFieldConfig 已改树 + freshChildNodes 包装仍在

- [ ] 拖动组内子组件 1 次，确认无漂移（task-012-2 修复验证）
- [ ] 拖动组：组位置正确更新
- [ ] 成组 / 拆组：组件结构正确变化
- [ ] 删除组内组件：组尺寸正确收缩

#### mixed-mode #2（步骤 3 完成后）
> setComponents 也已单源 + freshChildNodes 包装仍在

- [ ] 拖入新组件到组内：组件正确进入组
- [ ] 删除组：组件结构正确变化
- [ ] 图层树拖拽节点到组内：组件位置正确

#### mixed-mode #3（步骤 4 完成后）
> setState 也已单源 + freshChildNodes 包装仍在

- [ ] 导入配置（含成组+嵌套）：树正确重建
- [ ] 场景监控 postMessage：数据正确

#### 最终验证（步骤 5 完成后）
> freshChildNodes 已删除，全单源

- [ ] 重复 mixed-mode #1/#2/#3 的所有冒烟项（共 9 项）

---

## 5. 风险与回退

### 5.1 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| O(1)→O(n) 契约冲突破坏 useFieldConf 订阅 | **极高** | buildIndex 引用复用（r1§1.2：oldById 从 state.byId 捕获）+ verifyImmerProxy 必做 + 性能验收 |
| 引用复用失效（Immer proxy 破坏 ===） | **极高** | r1§1.2 已修复：oldById 从 produce 外捕获；verifyImmerProxyReference 必做验证 sameRef=true |
| 对齐操作串行 N 次 dispatch（75 秒灾难） | **极高** | r1§1.1：方案 B（批量 setComponents）是**默认实现**，不是回退路径 |
| 数据结构错（draft.components 是数组） | 高 | 伪代码已修正用 currentChildren 遍历 |
| Immer 语义（return state vs return;） | 高 | 伪代码已改为 `return;` |
| setState Object.assign 破坏单源 | 高 | byId/parentMap 防护（r2§1.3：console.error 决策理由见步骤 4） |
| Revert 冲突（步骤 2/3/4 同文件相邻 case） | 中 | r1§2.4：推荐全部回退后重新应用，不要单独 revert 中间步骤 |
| task-012-2 修复回归（步骤 5 删 freshChildNodes） | 中 | r2§1.2：步骤 5 硬依赖**仅步骤 2**（步骤 3/4 是软依赖）+ mixed-mode 分阶段冒烟 |

### 5.2 回退方案

> r1§2.4 修复：步骤 2/3/4 改同一文件相邻 case，git revert 会冲突。推荐方式：全部回退后重新应用，不要单独 revert 中间步骤。

**回退依赖图**（r2§1.2 修正：步骤 5 硬依赖仅步骤 2）：

| 回退该步骤 | 必须同时回退 | 原因 |
| --- | --- | --- |
| 步骤 2 | 步骤 5（若已执行） | updateFieldConfig 回退到只改 byId → tree 又变 stale → freshChildNodes 必须恢复 |
| 步骤 3 | 步骤 6a（task-003，若已执行） | setComponents 回退后又调用 mergeByIdIntoTree |
| 步骤 4 | 步骤 6a（task-003，若已执行） | 同上 |
| 步骤 5 | 无 | freshChildNodes 恢复不影响其他步骤（r2§1.2：不依赖步骤 3/4） |

**推荐回退顺序**（如需回退到双源架构）：
- 步骤 2+3+4 全部 git revert（按 commit 时间倒序，不要单独 revert 中间步骤）
- 步骤 5 单独 revert（与步骤 2/3/4 无冲突，改不同文件）

### 5.3 性能回退决策树（r2§2.4 修复：量化触发条件）

| 优先级 | 方案 | 触发条件 | 实施成本 | 预期收益 |
| --- | --- | --- | --- | --- |
| **默认实现** | 方案 A：buildIndex 引用复用 | — | 已在步骤 2 实现 | 保持 useFieldConf 订阅粒度 |
| **默认实现** | 方案 B：批量 setComponents 对齐 | — | handleAlign 改造（见步骤 2） | N=440 从 75 秒→523ms |
| 方案 C：rAF 节流 | onResize 单次 dispatch > 100ms | 低 | onResize 加 rAF 节流 | 维持 10Hz |
| 方案 D：增量 buildIndex | sameRef=false（引用复用失效）且 updateFieldConfig p95 > 190ms | 中 | buildIndex 只重建被改节点+祖先链 | 减少 buildIndex 范围 |
| 方案 E：回退双源 | 方案 A-D 均不达标 | 极高 | git revert 步骤 2/3/4/5 | 回到基线性能 |

**红线**：若 sameRef=false 且方案 D 仍无法让 updateFieldConfig p95 ≤ 190ms → 触发方案 E（回退双源）

---

## 6. 与上下游 task 的衔接

**前置条件**：task-001（mutation 清理）完成。所有 mutation 已消除，Immer produce 改树不会拿到 mutated tree；性能基线已建立。

**r2§1.4 精细依赖梳理**：

| task-003 步骤 | 依赖 task-002 步骤 | 依赖原因 |
| --- | --- | --- |
| 步骤 6（保存路径） | 步骤 2/3/4 | getSaveableComponents 内部调用 mergeByIdIntoTree，需步骤 3/4 先清零 reducer 调用方 |
| 步骤 6a（删 mergeByIdIntoTree） | 步骤 2/3/4 + 本 task 步骤 6 | mergeByIdIntoTree 的 3 个调用方必须全清零 |
| 步骤 6b（删 skip + 死函数 + undo/redo） | **无**（完全独立） | 死代码，不依赖任何步骤 |

> **并行机会**：task-003 步骤 6b 完全独立，可在 task-001 完成后随时开始（不需要等 task-002）。task-003 步骤 6/6a 只依赖 task-002 步骤 2/3/4，**不依赖步骤 5**（r2§1.2 修正）。

**task-003 前置条件**：本 task 步骤 2/3/4 完成（步骤 5 不阻塞 task-003 步骤 6/6a，但阻塞 task-004 全量验证）。

---

## 7. 边界场景与异常行为（r2§2.2）

| 异常输入 | 预期行为 | 分类 | 验证方法 |
| --- | --- | --- | --- |
| 空 components 树调用 updateFieldConfig | `state.parentMap[uniqueId]` 为 undefined → return state | 静默失败（合法） | 步骤 2 边界场景测试 |
| uniqueId 为 undefined/null | `state.parentMap[undefined]` 为 undefined → return state | 静默失败（调用方 bug 但不崩溃） | 步骤 2 边界场景测试 |
| patch 为空对象 `{}` | `Object.keys(patch).length === 0` → return state | 静默失败（合法，无操作） | 步骤 2 边界场景测试 |
| patch.config 为 null | `patch.config ?` 为 falsy → 走原 config（不合并） | 合法（调用方想保留原 config） | 步骤 2 边界场景测试 |
| setState 传空对象 `{}` | Object.assign 无操作，无 components 字段 → 不触发 buildIndex | 合法（无操作） | 步骤 4 验证 |
| setComponents 传非数组（undefined/null） | buildIndex 内 `walk(components || [], ...)` 降级为空数组 | 静默降级（调用方 bug） | 步骤 3 验证 |
| parentMap 与 tree 不一致（删除瞬间 dispatch） | parentMap 反向追踪失败 → return;（放弃更新） | 静默失败（合法，组件已删除） | 步骤 2 边界场景测试 |
| 循环引用（parentMap 成环） | MAX_DEPTH=100 触发 → console.error + return; | 防御性终止 | 步骤 2 边界场景测试 |

---

## 8. 显式假设表（r2§2.3）

| ID | 假设内容 | 风险等级 | 是否已验证 | 验证方法 |
| --- | --- | --- | --- | --- |
| A1 | Immer draft 中未修改对象引用与原对象相等（引用复用前提） | 高 | ❌（步骤 0 必做验证） | verifyImmerProxyReference() 确认 sameRef=true |
| A2 | buildIndex 在 440 组件场景下 p95 ≤ 0.24ms | 高 | ✅（baseline §2.1 实测 p95=0.2ms） | baseline 已验证 |
| A3 | 所有调用方遵循"结构性变更走 setComponents，字段级走 updateFieldConfig"契约 | 高 | ❌（grep 过但未审计语义） | 步骤 2 浏览器冒烟覆盖 |
| A4 | 没有调用方直接修改 byId 后再 dispatch setComponents | 高 | ❌（grep 过但未审计语义） | 步骤 3 浏览器冒烟覆盖 |
| A5 | 保存路径直接序列化 components 后，与 getSaveableComponents 输出一致 | 中 | ❌（待验证） | task-003 步骤 6 浏览器冒烟 |
| A6 | undo/redo 死字段删除不影响任何现有功能 | 低 | ✅（grep 确认无调用方） | task-003 步骤 6b grep 验证 |
| A7 | setAutoFreeze(false) 让 Immer 结构共享更纯粹（未修改对象返回原引用） | 中 | ✅（Read initializer/index.ts:23 确认） | 源码已验证 |

---

## 9. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：task 创建。从 task-2026-07-27-001 元计划阶段 4 拆分步骤 2/3/4/5 为独立 task。
- 2026-07-28：结合 r1.md + r2.md review 报告优化——修复 Immer 引用复用伪代码（oldById 从 state.byId 捕获）、对齐方案 B 提升为默认实现、步骤 5 硬依赖修正（仅依赖步骤 2）、mixed-mode 分阶段冒烟、setState 防护决策理由、边界场景+假设表。
- 2026-07-28：执行完成（2 commit）。
  - **commit 1（`883a911`）**：步骤 2/3/4 reducer 改造
    - `src/designer/renderer/utils.ts`：buildIndex 签名扩展 oldById 参数（引用复用）
    - `src/store/modules/designer-canvas.ts`：updateFieldConfig 改 produce 改树 + buildIndex；setComponents 删 mergeByIdIntoTree；setState 删 mergeByIdIntoTree + hasOwnProperty + byId/parentMap 防护；清理 mergeByIdIntoTree 未使用 import
    - `src/designer/canvas-graph/index.tsx`：handleAlign 改方案 B（1 次 setComponents）；清理 updateFieldConfig 未使用 import；新增 mergeFieldConfig import
  - **commit 2（`d080f72`）**：步骤 4/5 DesignerContent 配套改造
    - `src/designer/DesignerContent.tsx`：recalcGroupBounds 简化（删 freshChildNodes + shouldSkipGroupRecalc 分支 + 两步同步 + 死分支）；setState L154 hasOwnProperty；清理 shouldSkipGroupRecalc / updateFieldConfig 未使用 import
  - **commit 拆分说明**：plan 原列 4 个独立 commit，但步骤 2/3/4 改 designer-canvas.ts 相邻 case 无法用非交互 git 拆分；步骤 4（L154）与步骤 5（recalcGroupBounds）改同一文件且步骤 5 删除了步骤 4 import 的使用方，无法独立提交。按 plan §5.2"步骤 2/3/4 整体回退"建议合并为 2 commit。
  - **plan 伪代码修正**：handleAlign 方案 B 伪代码写 `{ uniqueId: item.uniqueId }`，实际 mergeFieldConfig 签名用 `opts.parentId` 匹配 `field.uniqueId === parentId`（即 parentId 参数是目标节点 uniqueId），已按代码实际签名实现 `{ parentId: item.uniqueId }`。
  - **tsc**：src/ 0 错误（packages/ui 10 个 pre-existing 无关）。
  - **待办**：浏览器冒烟（plan §4.2/§4.4）+ 性能验证（plan §4.3 verifyImmerProxyReference sameRef=true）需在浏览器环境执行。
