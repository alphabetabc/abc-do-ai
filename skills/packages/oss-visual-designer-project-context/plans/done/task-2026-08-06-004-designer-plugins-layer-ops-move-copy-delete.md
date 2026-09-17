# task-2026-08-06-004：createLayerOpsPlugin — move + copy + delete

> 创建日期：2026-08-06
> 状态：`done`（2026-08-07 完成）
> 类型：`feature`
> 前置任务：task-2026-08-06-003（lock/show）

---

## 1. 背景与目标

### 1.1 背景

src/ 的 `layer-manager/move` 有 4 个函数（moveToTop / moveToBottom / moveIndexToUp / moveIndexToDown），`layer-manager/copy` 有复制，`layer-manager/delete` 有删除。

这些是结构性变更（重排兄弟顺序 / 新增节点 / 删除节点），走 `setTree`。

### 1.2 依赖的 designer-core 纯函数

| 操作 | 依赖函数 | designer-core 已有？ |
|---|---|---|
| move（4 个） | `getNodeOrderBy` + `orderBy` + `setChildren` | ✅ 全部已有 |
| copy | `generatorNode` + `setChildren` | ✅ 已有 |
| delete | `deleteNodeById` + `setChildren` + `clearEmptyCollection` | ✅ 全部已有 |

### 1.3 目标

在 task-003 的 `layer-ops/plugin.ts` 中追加 move / copy / delete。

### 1.4 不做什么

- 不实现 group / splitGroup（task-005）
- 不做 UI 确认弹窗（src/ 的 delete 有 Modal.confirm，这属于应用层）

---

## 2. 详细步骤

### 2.1 扩展 `layer-ops/types.ts`

```ts
export interface LayerOpsPlugin {
    // task-003 已有
    plugin: Plugin<...>;
    useLock: () => (id: string) => void;
    useUnlock: () => (id: string) => void;
    useShow: () => (id: string) => void;
    useHide: () => (id: string) => void;
    // task-004 新增
    useMoveToTop: () => (id: string) => void;
    useMoveToBottom: () => (id: string) => void;
    useMoveUp: () => (id: string) => void;
    useMoveDown: () => (id: string) => void;
    useCopy: () => (id: string) => string | undefined;  // 返回新节点 id
    useDeleteNode: () => (id: string) => string | undefined;  // 返回下一个选中 id
}
```

### 2.2 实现核心

move 操作用 `getNodeOrderBy` + `orderBy` + `setChildren` + `setTree`：

```ts
import { getNodeOrderBy, orderBy, setChildren } from '@fedx-vis/designer-core';

const useMoveToTop = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string) => {
        const state = store.getState();
        const parentId = state.parentMap[id];
        if (!parentId) return;

        // 获取兄弟节点数组
        const siblings = parentId === ROOT_ID
            ? state.components
            : getNodeById(state.components, parentId)?.children ?? [];

        const { index } = getNodeOrderBy(siblings, id);
        if (index <= 0) return;

        const moved = siblings[index];
        const newChildren = [moved, ...siblings.filter((_, i) => i !== index)];
        const newTree = setChildren(state.components, parentId, newChildren);
        store.setTree(newTree);
    });
};
```

copy 操作用 `generatorNode` + `setChildren` + `setTree`：

```ts
import { generatorNode } from '@fedx-vis/designer-core';

const useCopy = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string): string | undefined => {
        const state = store.getState();
        const node = state.byId[id];
        if (!node) return;

        const parentId = state.parentMap[id];
        if (!parentId) return;

        // 用 generatorNode 生成新节点（新 id）
        const { components: newChildren, fieldId } = generatorNode(
            parentId === ROOT_ID ? state.components : getNodeById(state.components, parentId)?.children ?? [],
            generateId,  // id 生成函数（需注入或用内置 guid）
            { ...node, data: node.data },
        );

        const newTree = setChildren(state.components, parentId, newChildren);
        store.setTree(newTree);
        return fieldId;
    });
};
```

delete 操作用 `deleteNodeById` + `clearEmptyCollection` + `setTree`：

```ts
import { deleteNodeById, clearEmptyCollection } from '@fedx-vis/designer-core';

const useDeleteNode = () => {
    const { store } = useDesigner();
    return usePersistFn((id: string): string | undefined => {
        const state = store.getState();
        const parentId = state.parentMap[id];
        if (!parentId) return;

        const siblings = parentId === ROOT_ID
            ? state.components
            : getNodeById(state.components, parentId)?.children ?? [];

        const { components: newChildren, nextSelectedId } = deleteNodeById(siblings, id);
        let newTree = setChildren(state.components, parentId, newChildren);
        newTree = clearEmptyCollection(newTree, (item) => item.type === 'group');
        store.setTree(newTree);
        return nextSelectedId;
    });
};
```

### 2.3 id 生成函数

copy 需要生成新 uniqueId。src/ 用 `guid()`（`@Src/utils`）。

方案：designer-plugins 提供默认 `generateId` 函数（简单 `Date.now() + random`），也支持 `createDesigner` options 注入自定义生成器。

---

## 3. 测试

1. **moveToTop**：3 兄弟 [a, b, c]，moveToTop('c') → [c, a, b]
2. **moveToBottom**：3 兄弟 [a, b, c]，moveToBottom('a') → [b, c, a]
3. **moveUp**：3 兄弟 [a, b, c]，moveUp('c') → [a, c, b]
4. **moveDown**：3 兄弟 [a, b, c]，moveDown('a') → [b, a, c]
5. **copy**：copy('a') → 新节点出现在 a 后面，id 不同，data 相同
6. **deleteNode**：delete('b') → [a, c]，返回 nextSelectedId
7. **边界**：moveToTop 已在顶部 → no-op
8. **边界**：delete 不存在的 id → no-op

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
| `generatorNode` 签名与用法不匹配 | 中 | 中 | 实现时读 designer-core 源码确认 |
| `deleteNodeById` 返回值结构 | 中 | 中 | 实现时读 designer-core 源码确认 |
| id 生成函数注入方式 | 低 | 低 | 默认 guid + options 覆盖 |

---

## 6. 实施记录

> 2026-08-07 完成。

### 6.1 落地文件清单

```
packages-next/designer-plugins/src/
├── layer-ops/
│   ├── index.ts          # 追加导出 LayerOpsPluginOptions
│   ├── plugin.ts         # 追加 6 个 hooks（moveToTop/Bottom/Up/Down + copy + deleteNode）
│   └── types.ts          # 追加 LayerOpsPluginOptions + 6 个 hooks 类型
└── __tests__/
    └── layer-ops-move-copy-delete.test.tsx   # 新增 20 个测试
```

### 6.2 关键实施决策（相对原计划的修正）

#### 决策 1：泛型参数走 TypeScript 自动推断，不显式标注

原 plan 示例写法使用 `<TreeNode<WidgetData>>` 作为显式泛型参数，但 designer-core 的工具函数泛型参数不一致：
- `setChildren<TData>` / `clearEmptyCollection<TData>` / `generatorNode<TData>` / `deleteNodeById<TData>`：泛型是 `TData`（节点 data 类型）
- `getNodeById<TNode extends TreeNode>` / `getNodeOrderBy<T extends { uniqueId: string }>` / `orderBy<T>`：泛型是节点类型本身

如果对所有函数都传 `<TreeNode<WidgetData>>`，会导致 setChildren/clearEmptyCollection/generatorNode/deleteNodeById 把 `TreeNode<WidgetData>` 当作 `TData`，推断出 `TreeNode<TreeNode<WidgetData>>[]`，产生 type error。

最终方案：所有泛型参数都让 TS 从 `state.components: TreeNode<WidgetData>[]` 自动推断 → 全部正确解析为 `<WidgetData>`，零 type error。

注：plan §2.2 示例写法是设计稿，不是要逐字照抄的代码。任务实施以 plan 的"实现核心 + 行为契约"为准，写法按实际类型签名适配。

#### 决策 2：useDeleteNode 早退优化（引用相等判断）

deleteNodeById 找不到 id 时返回 `{ components: parentChildren, fieldId: ROOT_ID, index: -1 }`——`components` 是原引用。如果直接走 setChildren + clearEmptyCollection + setTree，会做一次无意义的 setTree 触发订阅。

优化：`newChildren === siblings` 时直接 no-op。这对应"delete 不存在的 id"用例（plan §3 用例 8）。

#### 决策 3：defaultGenerateId 内置，options.generateId 注入

plan §2.3 提到"designer-plugins 提供默认 generateId + 支持 createDesigner options 注入"。但 createDesigner 是另一个工厂，与 createLayerOpsPlugin 是并列关系，不便让 createDesigner 知道 layer-ops 的特定选项。

调整：在 createLayerOpsPlugin 层接受 `LayerOpsPluginOptions.generateId`，默认 `Date.now().toString(36) + Math.random().toString(36)`。理由：
- 关注点分离：createDesigner 只管通用选项（plugins/initialComponents/initialExtra），业务插件选项归各插件工厂
- 闭包内一次性求值 `const generateId = options.generateId ?? defaultGenerateId`，hooks 内不读 options（保持 usePersistFn 引用稳定语义）

#### 决策 4：useCopy 不显式重置 children uniqueId（与 plan §2.2 一致，但与 src/ 不一致）

plan §2.2 示例对 generatorNode 不传第 4 参 `resetChildrenUniqueId`（默认 false），即不重置子树 uniqueId。

src/ layer-manager/copy/index.ts 第 27 行对 generatorField 传 `true`，会重置子树 uniqueId。

本任务按 plan 写法不重置。理由：
- plan 是更近期设计意图，且 FlatNode 不含 children（byId 不带 children）—— 用 FlatNode 做 opts 时根本不会传 children，resetChildrenUniqueId 默认 false 是合理的
- 未来若需要"复制 group 时子树 id 也要重置"，可扩展 LayerOpsPluginOptions（如 `copyResetChildrenUniqueId`）

注：这是已记录的偏离点；如用户实际需求是"复制 group 也要重置子树 id"，下一 task 调整即可。

#### 决策 5：useTypedStore 仍未抽到 hooks/（延迟到 task-005 / task-006）

task-003 §6.2 决策 2 已记录"view/plugin.ts + layer-ops/plugin.ts 两处复制"，本任务再增加 1 处（共 3 处）依然按既定原则不抽：
- AGENTS.md §10.1 "Only make changes that are directly requested or clearly necessary"
- 抽取时机：task-005（createGroupManagementPlugin）会引入第 4 处副本，那时一起抽到 hooks/ 成本清晰

注：task-006 已规划 plugin registry refactor，会顺带处理 useTypedStore 抽取。

#### 决策 6：测试覆盖扩展（plan §3 列了 8 项 → 实际 20 项）

plan §3 列了 8 项用例（4 个 move + copy + delete + 2 个边界）。本任务补充：
- move 边界（已在目标位置 → no-op + components 引用不变）：plan 仅 1 个 moveToTop 边界，扩展到 4 个 move 各加 1 个
- delete 选中补偿 3 类（首项/中间/末项）：plan 仅 1 个用例，扩展到 3 个
- group 内子节点 move 生效（嵌套路径）
- useDeleteNode 清理空 group（与 src/ delete 行为对齐）
- LayerOpsPluginOptions.generateId 注入生效
- useCopy / useMoveToTop hooks 引用稳定

#### 决策 7：测试文件命名（layer-ops-move-copy-delete.test.tsx）

延续 task-003 的 `layer-ops-plugin.test.tsx` 命名风格，但用 `-move-copy-delete` 后缀区分测试范围（task-003 测试的是 lock/show）。两文件共存：
- layer-ops-plugin.test.tsx（9 项，task-003）
- layer-ops-move-copy-delete.test.tsx（20 项，task-004）

合并时机：task-006 plugin registry 重构时按"每插件一个测试文件"重组。

### 6.3 验证结果

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm --filter @fedx-vis/designer-plugins typecheck` | 0 error |
| 单元测试 | `pnpm --filter @fedx-vis/designer-plugins test` | 42 passed (8 bootstrap + 5 view + 9 layer-ops-lock-show + 20 layer-ops-move-copy-delete) |
| 构建 | `pnpm --filter @fedx-vis/designer-plugins build` | 成功，bundle 3.98 kB → 6.39 kB（gzip 1.84 kB） |
| designer-core | `pnpm --filter @fedx-vis/designer-core typecheck` | 0 error（未改动，确认无回归） |

### 6.4 后续 task 衔接

- `task-2026-08-06-005`（createGroupManagementPlugin，group/splitGroup）独立插件
  - 会直接复用 `hooks/use-persist-fn.ts`
  - 仍会引入 useTypedStore 第 4 处副本，task-005 落地后抽取
- `task-2026-08-06-006`（plugin registry refactor）整合 3 个插件（view + layer-ops + group-management）
  - PluginRegistry 抽象
  - useTypedStore 抽取
  - lifecycle / extensions 接入
- 应用层迁移（src/ 旧 layer-manager/move + layer-manager/copy + layer-manager/delete 迁移到 designer-plugins）按计划推迟到 designer-app 阶段

### 6.5 延期到 task-006 的架构问题（与 task-003 §6.5 一致，不再重复记录）

plugin 壳死代码 / 无扩展点 / 无生命周期钩子 / `type: 'cross-slice-sync'` 撒谎 / 命名误导 / 插件运行时耦合 / boilerplate 重复等 7 项架构问题，已在 task-003 §6.5 记录，本任务不重复，统一等 task-006 处理。
