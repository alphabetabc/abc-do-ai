# layer-manager + utils 不可变改造 + 单元测试

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-010`
> 上游任务：[task-2026-07-21-009-cleanup](./done/task-2026-07-21-009-cleanup.md)
> 状态：`done`
> 完成日期：2026-07-21
> 类型：`refactor`
>
> **风险等级：高（潜在 runtime bug）**

---

## 1. 背景

`designerCanvas` 切片迁入 Redux（task-006/007/008）后，画布 `components` 树由 Immer produce 维护，引用不可变、嵌套数组在 `setComponents` 之外是 frozen。

但 `designerCanvas` 之外的几处**遗留直接 mutation** 会绕过 Immer，导致三种问题：

1. **运行时崩溃**：`getFieldConf` / `getParent` 已删 `cloneDeep`、返回浅引用。layer-manager / designer-field 内仍按"返回可写对象"使用 → 在 Immer frozen 状态上写 `config.isLock = ...` / `parents.children = ...` 会抛 `TypeError: Cannot assign to read only property`。当前靠 `getFieldOrderBy` 内 `cloneDeep` 兜底，但 `getFieldOrderBy` 一旦按设计去掉 `cloneDeep`，整条 `move` 链路立刻崩溃。
2. **状态被静默修改、Redux 订阅不到**：`components.splice(...)` / `unshift(temp)` / `push(temp)` 等原地改 `state.components` 嵌套数组，绕开 Redux dispatch，画布不更新、撤销栈不记录。
3. **`byId` / `parentMap` 索引与树结构脱钩**：mutation 完成后调用方再走 `setChildren(...)` → `dispatch(setComponents(...))`，reducer 内 `buildIndex` 会按新树重建索引——本次表现"碰巧正常"，但 mutation 期间所有 `useFieldConf(id)` 订阅的组件都会读到**旧值**，出现短暂不一致。

涉及的具体位置（按问题严重度排序）：

| 文件 | 行 | 现状 | 后果 |
| --- | --- | --- | --- |
| `src/designer/layer-manager/move/index.ts` | L19-21 | `components.splice(index, 1)[0]; components.unshift(temp);` | 依赖 `getFieldOrderBy` 的 `cloneDeep` 才能不爆雷；去 `cloneDeep` 后立刻抛 |
| `src/designer/layer-manager/move/index.ts` | L42-44 | `components.splice(index, 1)[0]; components.push(temp);` | 同上 |
| `src/designer/layer-manager/move/index.ts` | L64, L85 | `orderBy(components, index, ...)` 内部仍原地 splice | `orderBy` 返回的数组与入参同引用，调用方 `const results = orderBy(...)` 看似接收返回值，实则 `results === components`，后续 `setChildren(state.components, parents.uniqueId, results)` 会写入被 mutation 的数组 |
| `src/designer/renderer/designer-field/index.tsx` | L223 | `parents.children = parents.children.filter(...)` | `parents` 来自 `getParent`，task-009 后是浅引用；当前"侥幸"不爆雷是因为 `getParent` 仍返回的是组件树节点引用（非 Immer 代理，因 `getParent` 内部 for-loop 读取并返回原引用）。一旦在 Immer 生产树上调用，会抛 read-only 错 |
| `src/designer/renderer/utils.ts` | L296 | `deleteFieldByUniqueId` 内 `components.splice(index, 1)` | 同 `move` 风险 |
| `src/designer/renderer/utils.ts` | L262-265 | `orderBy` 内 `arr[next] = arr.splice(prev, 1, arr[next])[0]` | 同上 |
| `src/designer/renderer/utils.ts` | L443 | `generatorGroup` 内 `parents.children = parents.children.filter(...)` | 同 `designer-field/index.tsx` L223 |
| `src/designer/renderer/utils.ts` | L499 | `splitGroup` 内 `parents.children.splice(index, 1, ...children)` | 同上 |
| `src/designer/renderer/utils.ts` | L279 | `getFieldOrderBy` 内 `rebuild=true` 时 `_.cloneDeep(fields)` | `layer-manager/move` 当前依赖它"兜底"；不去掉就谈不上性能提升 |
| `src/designer/renderer/utils.ts` | L515 | `flatDesignerList` 内 `curr = _.cloneDeep(curr)` | 已被 task-009 注释标记为"待删"，但没动 |

**本任务目标**：将上述所有 mutation 改造为不可变写法；补充单测覆盖 layer-manager 与 utils 的核心不变量（操作前后顶层引用变化、未改动兄弟节点引用保持）；完成后 `designerCanvas` 的不可变契约才真正成立，`getFieldConf` / `getParent` / `getFieldOrderBy` 才可安全地再去 `cloneDeep`。

---

## 2. 目标

1. `layer-manager/move` 4 个函数（`moveToTop` / `moveToBottom` / `moveIndexToUp` / `moveIndexToDown`）改为不可变写法
2. `utils.ts` `orderBy` / `deleteFieldByUniqueId` / `splitGroup` / `generatorGroup` 改为不可变写法
3. `utils.ts` `getFieldOrderBy` 去掉 `_.cloneDeep`
4. `utils.ts` `flatDesignerList` 内部 `_.cloneDeep(curr)` 去掉
5. `designer-field/index.tsx` L223 改写为不修改 `parents.children` 的版本
6. 新增 `src/designer/__tests__/layer-manager-immutable.test.ts` 覆盖 7+ 个核心断言
7. `pnpm tsc --noEmit` 零新增错误（pre-existing 14 个错误数维持不变）
8. `pnpm test src/designer/__tests__/layer-manager-immutable` 全部通过

---

## 3. 关键设计决策

### 3.1 不可变改写原则

所有"改 children"的工具函数统一遵循以下不变量：

| 不变量 | 说明 | 校验方式 |
| --- | --- | --- |
| **顶层引用变化** | 调用工具函数后，输入数组的**最外层引用**必须变化（即 `result !== input`） | 单测：`expect(result).not.toBe(input)` |
| **未改动节点引用保持** | 与被改动节点无关的兄弟节点必须保持原引用（结构共享） | 单测：遍历 siblings，对比 `===` |
| **被改动节点引用变化** | 被增删/换位的节点必须是新对象（防止上层 Immer 误判未变） | 单测：`expect(result[i]).not.toBe(input[i])` |
| **drillDown 子树不进入 byId** | `byId` 索引只覆盖 `node.children`，不覆盖 `node.data.config.drillDown`（已有约定） | 见 `setLevelPath`（已在 task-009 改造完毕） |

### 3.2 layer-manager 函数签名不变

`moveToTop(state, selected, handle?)` 等 4 个函数**对外签名保持不变**（`DesignerState` + `selected: string` + 可选 `handle`）。改造仅在内部用不可变写法替换 splice/unshift/push。

调用方约定：返回 `{ components: finalData }`，由上游 `dispatch(setComponents(...))` 落库。本任务不修改调用方。

### 3.3 `orderBy` 不可变改写

旧：
```ts
export function orderBy(arr, next, prev) {
    arr[next] = arr.splice(prev, 1, arr[next])[0];
    return arr;
}
```

新：
```ts
/**
 * 不可变版 orderBy（task-010 引入，2026-07-21）
 * 把 arr[prev] 移动到 arr[next] 位置，返回新数组，原数组不变
 * 适用范围：layer-manager/move 的 moveIndexToUp / moveIndexToDown
 */
export function orderBy(arr: any[], next: number, prev: number): any[] {
    const result = arr.slice();
    const [moved] = result.splice(prev, 1);
    result.splice(next, 0, moved);
    return result;
}
```

调用方 `moveIndexToUp` / `moveIndexToDown` 已用 `const results = orderBy(components, index, index-1)` 接收返回值，无需再改。

### 3.4 `deleteFieldByUniqueId` 不可变改写

旧：
```ts
export function deleteFieldByUniqueId(parentChildren, uniqueId, opts = {}) {
    let fieldId;
    const { index, components } = getFieldOrderBy(parentChildren, uniqueId, opts);
    if (components.length === 1) fieldId = ROOT_UNIQUE_ID;
    else if (index > 0) fieldId = components[index - 1].uniqueId;
    else fieldId = components[index + 1].uniqueId;
    components.splice(index, 1);   // ← mutation
    return { components, fieldId, index };
}
```

新（移除 `getFieldOrderBy` 调用，去掉 `rebuild` 参数，纯 `findIndex`）：
```ts
/** @type {import("./types").Utils.DeleteFieldByUniqueIdType} */
export function deleteFieldByUniqueId(parentChildren: any[], uniqueId: string) {
    if (isEmpty(parentChildren)) return { components: [], fieldId: ROOT_UNIQUE_ID, index: -1 };
    const index = parentChildren.findIndex((o) => o.uniqueId === uniqueId);
    if (index === -1) return { components: parentChildren, fieldId: ROOT_UNIQUE_ID, index: -1 };

    let fieldId: string;
    if (parentChildren.length === 1) fieldId = ROOT_UNIQUE_ID;
    else if (index > 0) fieldId = parentChildren[index - 1].uniqueId;
    else fieldId = parentChildren[index + 1].uniqueId;

    // 不可变：从原数组中过滤掉 uniqueId
    const components = parentChildren.filter((_, i) => i !== index);
    return { components, fieldId, index };
}
```

> **注意**：旧的 `opts.rebuild` 参数已无意义（`getFieldOrderBy` 不再被本函数调用），删除 opts 参数即可。调用方 `layer-manager/delete/index.tsx` / `drag2layoutBlock.ts` / `useOnDrop.ts` 共 3 处都未传 `opts`，无需修改。

### 3.5 `generatorGroup` / `splitGroup` 不可变改写

#### 3.5.1 `generatorGroup`

旧：
```ts
export function generatorGroup(fields, selected, rootParent) {
    const selectedIds = selected.split(',');
    const parents = getParent(fields, selectedIds[0], rootParent);
    if (!parents) return;
    parents.children = parents.children.filter((item) => !selectedIds.includes(item.uniqueId));   // ← mutation
    const children = selectedIds.map((item) => getFieldConf(fields, item));
    // ... 计算 newChildren ...
    const { components, fieldId } = generatorField(parents.children, 'field', configs, false);
    const finalData = setChildren(fields, parents.uniqueId, components);
    return { finalData, fieldId };
}
```

新：把 `parents.children.filter(...)` 替换为局部变量，`generatorField` 接收过滤后的新数组：
```ts
export function generatorGroup(fields, selected, rootParent) {
    const selectedIds = selected.split(',');
    const parents = getParent(fields, selectedIds[0], rootParent);
    if (!parents) return;
    // 不可变：从 parents.children 中过滤掉 selectedIds
    const remainingChildren = parents.children.filter((item) => !selectedIds.includes(item.uniqueId));
    const children = selectedIds.map((item) => getFieldConf(fields, item));
    // ... 计算 newChildren（selectedChildren 重组后平移坐标）...
    const { components, fieldId } = generatorField(remainingChildren, 'field', configs, false);
    const finalData = setChildren(fields, parents.uniqueId, components);
    return { finalData, fieldId };
}
```

#### 3.5.2 `splitGroup`

旧：
```ts
export function splitGroup(fields, selected, rootParent) {
    const parents = getParent(fields, selected, rootParent);
    const curFieldConf = getFieldConf(fields, selected);
    if (curFieldConf.type !== 'group') return;
    const index = parents.children.findIndex((item) => item.uniqueId === selected);
    const children = curFieldConf.children.map(...);   // 坐标重算
    parents.children.splice(index, 1, ...children);   // ← mutation
    const finalData = setChildren(fields, parents.uniqueId, parents.children);
    return { finalData: [...finalData], fieldId: parents.uniqueId };
}
```

新：用 spread 重组：
```ts
export function splitGroup(fields, selected, rootParent) {
    const parents = getParent(fields, selected, rootParent);
    const curFieldConf = getFieldConf(fields, selected);
    if (curFieldConf.type !== 'group') return;
    const index = parents.children.findIndex((item) => item.uniqueId === selected);
    const children = curFieldConf.children.map(...);   // 坐标重算
    // 不可变：在 index 处用 children 替换原节点
    const newChildren = [
        ...parents.children.slice(0, index),
        ...children,
        ...parents.children.slice(index + 1),
    ];
    const finalData = setChildren(fields, parents.uniqueId, newChildren);
    return { finalData, fieldId: parents.uniqueId };
}
```

> 注：旧代码末尾 `return { finalData: [...finalData], fieldId: parents.uniqueId }` 的 `[...finalData]` 是冗余的浅拷贝（`setChildren` 已经返回新数组），新代码去掉。

### 3.6 `getFieldOrderBy` 去掉 cloneDeep

旧：
```ts
export function getFieldOrderBy(fields, id, opts = {}) {
    if (isEmpty(fields)) return {};
    const { rebuild = true } = opts || {};
    let newFiled = rebuild ? _.cloneDeep(fields) : fields;   // ← cloneDeep
    const index = newFiled.findIndex((o) => o.uniqueId === id);
    return { index, components: newFiled };
}
```

新：
```ts
/**
 * 不可变版 getFieldOrderBy（task-010 引入，2026-07-21）
 * 直接返回原 fields 引用 + 索引位置（不 cloneDeep）
 *
 * 约束：调用方**禁止** mutation 返回的 `components` 数组。
 * 如需修改，请构造新数组后走 `setChildren(state.components, parentId, newChildren)`。
 */
export function getFieldOrderBy(fields: any[], id: string) {
    if (isEmpty(fields)) return { index: -1, components: fields };
    const index = fields.findIndex((o) => o.uniqueId === id);
    return { index, components: fields };
}
```

> **行为变化**：旧的 `opts.rebuild` 参数删除，调用方都是 `getFieldOrderBy(parents.children, selected)`，未传 opts，零影响。
>
> **去 cloneDeep 的好处**：layer-manager 一次操作省一次 O(n) 深拷贝；440 组件场景下约 30ms 提升（参考调研 §9.2 类别 B 性能数字）。

### 3.7 `flatDesignerList` 去掉 cloneDeep

旧：
```ts
export function flatDesignerList(designerList, parent = { uniqueId: ROOT_UNIQUE_ID }) {
    return designerList.reduce((prev, curr, index, arr) => {
        curr = _.cloneDeep(curr);   // ← cloneDeep
        curr.parentUniqueId = [...(parent.parentUniqueId || []), parent.uniqueId];   // ← mutation
        prev = prev.concat(curr);
        // ...
    }, []);
}
```

新：
```ts
/**
 * 不可变版 flatDesignerList（task-010 引入，2026-07-21）
 * 遍历树生成一维数组，每个节点追加 `parentUniqueId` 链
 *
 * 不再 cloneDeep 每个节点：调用方（`useFlatComponents` hook）只读不 mutate。
 * 如果调用方需要 mutate，**必须**先用 `byId` 找到原节点后通过 dispatch 改 store，
 * 而不是改 flatDesignerList 返回的对象。
 */
export function flatDesignerList(designerList, parent = { uniqueId: ROOT_UNIQUE_ID }) {
    return designerList.reduce((prev, curr) => {
        const node = {
            ...curr,
            parentUniqueId: [...(parent.parentUniqueId || []), parent.uniqueId],
        };
        prev = prev.concat(node);
        if (curr.children) prev = prev.concat(flatDesignerList(curr.children, curr));
        if (curr.childrenGroup) prev = prev.concat(flatDesignerList(curr.childrenGroup, curr));
        return prev;
    }, []);
}
```

### 3.8 `designer-field/index.tsx` L223 改写

旧（[designer-field/index.tsx#L219-234](src/designer/renderer/designer-field/index.tsx#L219)）：
```ts
const parents = getParent(state.components, selectedIds[0], { uniqueId: ROOT_UNIQUE_ID, children: [] });
if (!parents) return;
parents.children = parents.children.filter((item: any) => !selectedIds.includes(item.uniqueId));   // ← mutation
```

新：用 `setChildren` 返回新树：
```ts
const parents = getParent(state.components, selectedIds[0], { uniqueId: ROOT_UNIQUE_ID, children: [] });
if (!parents) return;
// 不可变：从 parents.children 中过滤掉 selectedIds，构造新数组
const remainingChildren = parents.children.filter((item: any) => !selectedIds.includes(item.uniqueId));
// 注意：本函数后续不需要重建 components 树，被移除的 child 后续会在 onValueChange 里通过
// updateFieldConfig 单独更新坐标（见 L226-233）。此处只是辅助计算 "selectedChildren" 的源数据。
const selectedChildren = selectedIds.map((item) => getFieldConf(state.components, item));
// ... 后续 onValueChange 调用照旧 ...
```

> 注：本函数是**多选拖拽**场景，主拖元素由 `onValueChange(latestDataSource.uniqueId, {...nextPosition})` 走 `useUpdateFieldConfig`，其他 sibling 仅更新 left/top 增量。`parents.children.filter` 的结果只用于定位"被拖元素的兄弟节点"，实际 coordinate 计算由 `selectedChildren` 决定，并不依赖 `parents.children` 被修改后的状态。所以去掉 mutation 不影响功能。

---

## 4. 详细步骤

### 步骤 1：改写 `utils.ts` 4 个工具函数（orderBy / deleteFieldByUniqueId / generatorGroup / splitGroup）

文件：`src/designer/renderer/utils.ts`

按 §3.3、§3.4、§3.5 改写 4 个函数。grep 校验：

```bash
grep -n "components.splice\|components.unshift\|components.push(temp)\|parents.children.splice\|parents.children =" src/designer/renderer/utils.ts
# 应返回 0 命中（除注释 + setLevelPath 内部 produce 写法）
```

### 步骤 2：去掉 `getFieldOrderBy` 与 `flatDesignerList` 的 cloneDeep

文件：`src/designer/renderer/utils.ts`

按 §3.6、§3.7 改写。grep 校验：

```bash
grep -n "_\.cloneDeep" src/designer/renderer/utils.ts
# 应只在 deepMergeObj / resetObjectSealed / 注释 中命中
```

### 步骤 3：改写 `layer-manager/move` 4 个函数

文件：`src/designer/layer-manager/move/index.ts`

不可变实现示例（`moveToTop`）：
```ts
const moveToTop = (state, selected, handle?) => {
    const rootParent = getRootParent(state);
    const parents = getParent(state.components, selected, rootParent);
    if (!parents) return;
    const { index, components } = getFieldOrderBy(parents.children, selected);
    if (index - 1 >= 0) {
        // 不可变：从 components 中移除 index，再把被移除元素放到头部
        const moved = components[index];
        const newChildren = [moved, ...components.filter((_, i) => i !== index)];
        const finalData = setChildren(state.components, parents.uniqueId, newChildren);
        handle && handle(finalData);
        return { components: finalData };
    } else {
        message.destroy();
        message.warning('图层已经置顶');
        return;
    }
};
```

`moveToBottom` 类比（`...components.filter(...), components[index]` 放到尾部）。

### 步骤 4：改写 `designer-field/index.tsx` L223

文件：`src/designer/renderer/designer-field/index.tsx`

按 §3.8 改写。

### 步骤 5：新增单元测试

文件：`src/designer/__tests__/layer-manager-immutable.test.ts`

覆盖以下断言（每个至少 1 个 `expect`）：

| # | 测试用例 | 断言 |
| --- | --- | --- |
| 1 | `moveToTop` 后 `finalData` 与 `state.components` 顶层引用不同 | `expect(finalData).not.toBe(state.components)` |
| 2 | `moveToTop` 后未改动的兄弟节点引用保持 | 构造 4 个 sibling 树，move 第 3 个到顶，断言 sibling[0]、sibling[3] `===` 原节点 |
| 3 | `moveToTop` 后被移动节点引用变化 | `expect(finalData[0]).not.toBe(state.components[2].children[2])` |
| 4 | `moveToBottom` 对称断言 | 同上 |
| 5 | `moveIndexToUp` 交换相邻两个 | 断言 index-1 与 index 节点身份互换，且新数组引用变化 |
| 6 | `orderBy` 不改原数组 | `const arr = [{id:1},{id:2},{id:3}]; const result = orderBy(arr, 0, 2); expect(result).not.toBe(arr); expect(arr[0].id).toBe(1);` |
| 7 | `deleteFieldByUniqueId` 移除中间节点 | 断言 `components.length === 原.length - 1`，且未改 sibling `===` |
| 8 | `deleteFieldByUniqueId` 仅 1 个节点时返回 ROOT_UNIQUE_ID | `expect(fieldId).toBe(ROOT_UNIQUE_ID)` |
| 9 | `splitGroup` 后 children 数量正确 | 原 group 含 3 个 child，split 后 children 数 +2 |
| 10 | `generatorGroup` 构造 group 节点 + children 数量正确 | 选中 3 个 sibling 成组，新 group 含 3 个 child，原 sibling 位置空出 |
| 11 | `getFieldOrderBy` 返回的 components 与入参同引用（不 cloneDeep） | `const { components } = getFieldOrderBy(arr, id); expect(components).toBe(arr);` |
| 12 | `flatDesignerList` 不再 cloneDeep 节点 | 验证节点 `===` 入参节点（除加了 `parentUniqueId` 字段的对象） |

测试文件框架：
```ts
import { moveToTop, moveToBottom, moveIndexToUp, moveIndexToDown } from '@Src/designer/layer-manager/move';
import { orderBy, deleteFieldByUniqueId, splitGroup, generatorGroup, getFieldOrderBy, flatDesignerList, ROOT_UNIQUE_ID } from '@Src/designer/renderer/utils';

describe('layer-manager 不可变改造', () => {
    // fixture：构造一个 3 层深的 components 树（10 节点左右）
    const buildFixture = () => ([ /* ... */ ]);

    test('moveToTop 后 components 顶层引用变化', () => { /* ... */ });
    test('moveToTop 后未改动的兄弟节点引用保持', () => { /* ... */ });
    // ... 其它 10 个用例
});
```

### 步骤 6：跑测试 + tsc 校验

```bash
pnpm test src/designer/__tests__/layer-manager-immutable
pnpm tsc --noEmit
```

测试全部通过 + tsc 零新增错误。

### 步骤 7：人工冒烟

```bash
pnpm start
```

冒烟清单：
- [ ] 单选拖拽（position onChange）
- [ ] 多选拖拽（drag group with siblings）—— **重点验证 §3.8 的改写**
- [ ] 鼠标拖拽期间不掉帧（DevTools Profiler 看 render 次数）
- [ ] 图层"置顶/置底/上移/下移"
- [ ] "成组 / 拆组"
- [ ] "删除"组件
- [ ] "复制"组件
- [ ] "锁定 / 解锁"
- [ ] "隐藏 / 显示"
- [ ] 配置面板 onChange（拖动 slider、输入数字）
- [ ] 保存场景 → 后端拿到的 config 与改动一致

---

## 5. 验证清单

- [x] `src/designer/renderer/utils.ts` `orderBy` 改为不可变（返回新数组）
- [x] `src/designer/renderer/utils.ts` `deleteFieldByUniqueId` 改为不可变（filter 重组，去掉 `opts.rebuild`）
- [x] `src/designer/renderer/utils.ts` `generatorGroup` 不再 mutation `parents.children`
- [x] `src/designer/renderer/utils.ts` `splitGroup` 不再 mutation `parents.children`
- [x] `src/designer/renderer/utils.ts` `getFieldOrderBy` 去掉 `_.cloneDeep`
- [x] `src/designer/renderer/utils.ts` `flatDesignerList` 去掉 `_.cloneDeep(curr)`
- [x] `src/designer/layer-manager/move/index.ts` 4 个函数（`moveToTop` / `moveToBottom` / `moveIndexToUp` / `moveIndexToDown`）改为不可变
- [x] `src/designer/renderer/designer-field/index.tsx` L223 不再 mutation `parents.children`
- [ ] 新增 `src/designer/__tests__/layer-manager-immutable.test.ts`，至少 12 个断言（用户决策：跳过，详见 §7 实施记录。**已迁移到 [task-019](../task-2026-07-24-019-smoke-and-tsc-cleanup.md) §2.3 执行**）
- [ ] `pnpm test src/designer/__tests__/layer-manager-immutable` 全部通过（同上，**已迁移到 [task-019](../task-2026-07-24-019-smoke-and-tsc-cleanup.md) §2.3 执行**）
- [x] `pnpm tsc --noEmit` 零新增错误（pre-existing 14 个错误数不变）
- [x] grep `components.splice\|components.unshift\|components.push(temp)` 在 layer-manager 与 utils.ts 0 命中（仅注释）
- [x] grep `parents.children =\s*parents.children` 0 命中
- [ ] 人工冒烟清单全部通过（手动代码审阅完成；浏览器/拖拽场景**已迁移到 [task-019](../task-2026-07-24-019-smoke-and-tsc-cleanup.md) §2.4 执行**）
- [x] 任务文件移到 `plans/done/`
- [x] 更新 [roadmap.md](./roadmap.md) 状态为 done

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `orderBy` 改不可变后某个 layer-manager 调用方漏接返回值，导致 children 不变 | 中 | move 操作无效 | 单元测试覆盖；冒烟时跑一遍置顶/置底/上移/下移 |
| `deleteFieldByUniqueId` 去掉 `opts.rebuild` 后某个调用方传入 `opts` 被忽略 | 低 | 行为不变（无调用方传 opts） | grep 校验；保留 `opts` 参数为可选但忽略 |
| `splitGroup` 去掉末尾冗余 `[...finalData]` 后有调用方依赖该浅拷贝 | 极低 | 引用比较失败 | 全项目无该用法；单测 + 冒烟覆盖 |
| `flatDesignerList` 去掉 cloneDeep 后某个调用方假设节点可写 | 低 | 在 Redux 派生的 frozen 树上报错 | 全项目 grep 调用方：当前只有 `useFlatComponents` 用，且只读不 mutate |
| 多选拖拽场景改写 §3.8 后计算坐标出错 | 中 | 多选拖拽位置错误 | 单测覆盖；人工冒烟时重点验证多选拖拽 |

### 回退方案

- 改造前一次 commit：`refactor(designer): layer-manager + utils 不可变改造 + 单测`
- 若有问题 `git revert` 整个 commit
- layer-manager 函数签名不变，调用方零改动，回滚范围可控

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-21：任务创建（task-010），状态 `planning`，基于 task-006/007/008/009 输出的不可变契约补全 + 单元测试硬化
- 2026-07-21：状态置为 `in-progress`，开工
- 2026-07-21：实施完成（task-010），状态置为 `done`
  - `src/designer/renderer/utils.ts`：
    - `orderBy` 改为不可变（slice + splice 重组，返回新数组）
    - `getFieldOrderBy` 去掉 `_.cloneDeep`，新增 `index: -1, components: fields` 空数组返回
    - `deleteFieldByUniqueId` 改为不可变（filter 重组），删除 `opts.rebuild` 参数（已无意义）
    - `generatorGroup` 改为不可变（`remainingChildren = parents.children.filter(...)`，不再 `parents.children = ...` mutation）
    - `splitGroup` 改为不可变（`newChildren = [...slice, ...children, ...slice]`，不再 `parents.children.splice(...)` mutation）
    - `flatDesignerList` 改为不可变（spread 重组，不再 `_.cloneDeep(curr)`）
  - `src/designer/layer-manager/move/index.ts`：4 个函数（`moveToTop` / `moveToBottom` / `moveIndexToUp` / `moveIndexToDown`）改为不可变
    - `moveToTop`：`newChildren = [moved, ...components.filter(...)]`
    - `moveToBottom`：`newChildren = [...components.filter(...), moved]`
    - `moveIndexToUp` / `moveIndexToDown`：依赖 `orderBy` 内部已不可变（`const results = orderBy(...)` 接住返回值）
  - `src/designer/renderer/designer-field/index.tsx` L223：删除 `parents.children = parents.children.filter(...)` mutation（该 mutation 实际未使用，纯死代码；删除不影响功能）
  - **单元测试未编写**：用户决策——项目 jest 配置存在多个 pre-existing 问题（`testRunner` 写死 Mac 本地路径、`oss-ui/lib/index.js` 缺失、`@fedx-vis/utils` ESM 解析失败），调试成本高于手动验证；改用人工代码审阅确认 4 个改写函数的逻辑正确性
  - grep 校验：
    - `utils.ts` 中 `components.splice / unshift / push(temp) / parents.children =` 0 命中（仅注释）
    - `move/index.ts` 中 `components.splice / unshift / push(temp)` 0 命中（仅注释）
    - `designer-field/index.tsx` 中 `parents.children =` 0 命中（仅注释）
    - `utils.ts` 中 `_.cloneDeep` 剩余 3 处均在合法场景（`resetUniqueId` / `generatorField` opts 处理 / `resetObjectSealed` 解封 Immer frozen），未影响本次不可变改造
  - `pnpm tsc --noEmit` 输出 14 个错误，全部是 pre-existing（与 review 报告一致）：`packages/ui/src/material-selector/index.tsx` 8 + `LazyImageLoader.tsx` 2 + `src/designer/common/dnd/helper.ts` 2 + `src/designer/renderer/designer-field/utils.ts` 2。零新增错误
  - 任务文件移到 `plans/done/`
  - roadmap.md 状态置为 `done`，完成日期 2026-07-21