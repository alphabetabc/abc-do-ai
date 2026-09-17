# task-2026-07-24-015：stale tree 防御性读取统一封装

> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-015`
> 上游任务：
> - [task-2026-07-24-012-1-manual-fix](./task-2026-07-24-012-1-manual-fix.md)（in-progress，§2b 修 recalcGroupBounds，但其他位置未审计）
>
> 状态：`done`（2026-07-28）
> 类型：`refactor`（预防性封装）
>
> **⚠️ 本任务已被单源架构根本消除，不再需要**：原 plan 是为双源时代的"stale tree 防御性读取"统一封装 `safeRead*` 工具函数。task-002（2026-07-28）单源重构**根本消除**了 stale tree 问题：`updateFieldConfig` 改为"改树 + buildIndex"，components 树永远 fresh，不再需要 `safeRead*` 包装（详见 [05-known-bugs.md §1.2](../design/designer-canvas/05-known-bugs.md) / [memo.md 2026-07-24](./memo.md)）。本任务状态标记为 `done` 以表达"防御性封装目标已被架构级方案替代"。
>
> **风险等级：中（新增公共工具函数，多处调用方替换）** — **不再适用**（任务关闭）
>
> **设计依据**：`.trae/documents/design/designer-canvas/05-known-bugs.md §1.2`、`.trae/documents/design/designer-canvas/04-edge-cases.md §0`

---

## 1. 背景

`updateFieldConfig` 只改 byId 不改 components 树（task-008 P6 优化）。任何读 `state.components` 的代码都可能拿到 stale data。

task-012-1 已在 `recalcGroupBounds` 中用 `freshChildNodes` 包装修复了问题 2b，但**散落处理**，其他位置可能仍有类似 bug：

| 已修 | 待审计 |
| --- | --- |
| `recalcGroupBounds` 用 freshChildNodes（task-012-1） | `layer-manager/move/copy/delete` 读 parent.children |
| `handleSave` 用 `getSaveableComponents` | `drag2layoutBlock` 读 children |
| `saveAsTemp-modal` 用 `getSaveableComponents` | `useOnDrop` 读 children |
| `designer-scene-monitor` 用 `getSaveableComponents` | `element.tsx` 读 layout-block children |
| — | `mergeFieldConfig` / `setChildren` / `getFieldOrderBy` 等工具函数输入 |

**目标**：把"读 children 时 byId 重算"封装为公共工具函数，统一调用方写法，避免散落处理导致下次再出同类 bug。

---

## 2. 目标

1. 在 `src/designer/renderer/utils.ts` 新增 `safeRead*` 工具函数：
   - `safeReadChildNodes(byId, children)` —— 用 byId 重写 children 节点的 data
   - `safeReadFieldConf(byId, node)` —— 用 byId 读单节点 config
2. 审计 5 个文件（layer-manager × 3、drag2layoutBlock、useOnDrop、element.tsx）的 children 读取位置，改为 `safeReadChildNodes` 包装
3. 审计 `mergeFieldConfig` / `setChildren` / `getFieldOrderBy` 的调用方，看是否需要输入参数加 `byId`
4. `pnpm tsc --noEmit` 零新增错误
5. 浏览器冒烟：拖拽 / 对齐 / 复制 / 删除 / 拖入图层组 全部正常

---

## 3. 修复方案

### 3.1 safeRead* 工具函数设计

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts)

```ts
/**
 * safeReadChildNodes —— 用 byId 重写 children 节点的 data（防 stale tree）
 *
 * 背景：updateFieldConfig 只改 byId 不改 components 树，读 state.components
 *       可能拿到 stale data。task-012-1 在 recalcGroupBounds 中用类似逻辑修
 *       复了"拖拽组内子组件组尺寸不更新"。本任务统一封装。
 *
 * 策略：对每个子节点，若 byId[node.uniqueId].data !== node.data（说明
 *       byId 经历过字段级更新），用 byId.data 覆盖 node.data。
 *       data 引用相同时跳过（减少不必要的对象创建）。
 *
 * @param byId  byId 索引（含字段级更新的最新 data）
 * @param children  children 数组（可能 stale）
 * @returns  新的 children 数组（data 全部 fresh）
 *
 * 性能：O(k)，k = children 数量。引用相同时跳过，不创建新对象。
 */
export function safeReadChildNodes(
    byId: Record<string, FlatField>,
    children: any[] | undefined,
): any[] | undefined {
    if (!children || children.length === 0) return children;
    return children.map((c) => {
        if (!c || !c.uniqueId) return c;
        const flat = byId[c.uniqueId];
        if (flat && flat.data !== c.data) {
            return { ...c, data: flat.data };
        }
        return c;
    });
}

/**
 * safeReadFieldConf —— 用 byId 读单节点 config（防 stale tree）
 *
 * 背景：直接从 components 树读 node.data.config 可能 stale。
 *       用 byId 读总是 fresh。
 *
 * @param byId  byId 索引
 * @param node  tree 节点（含 uniqueId）
 * @returns  fresh config（或 undefined）
 */
export function safeReadFieldConf<T = any>(
    byId: Record<string, FlatField>,
    node: any,
): T | undefined {
    if (!node || !node.uniqueId) return undefined;
    const flat = byId[node.uniqueId];
    return flat?.data?.config as T | undefined;
}
```

### 3.2 调用方改造清单

| # | 文件 | 位置 | 改造 |
| --- | --- | --- | --- |
| 1 | `designer/layer-manager/move/index.ts` | 读 parent.children | 用 safeReadChildNodes 包装 |
| 2 | `designer/layer-manager/copy/index.tsx` | 读 parent.children | 同上 |
| 3 | `designer/layer-manager/delete/index.tsx` | 读 parent.children | 同上 |
| 4 | `designer/common/draggable/drag2layoutBlock.ts` | 读 layoutBlock.children | 同上 |
| 5 | `designer/aside-panel/layers-tree/tree/useOnDrop.ts` | 读 parent.children | 同上 |
| 6 | `designer/common/field/layout-block/helper/element.tsx` | 读 layoutBlock.children | 同上 |
| 7 | `designer/renderer/utils.ts` `getFieldNodeById` | 返回值可能 stale | 加 byId 参数（可选，向后兼容） |

### 3.3 mergeFieldConfig / setChildren 工具函数

**问题**：这两个函数操作 tree，输入是 `components`，输出也是 `components`。如果 tree 是 stale，mergeFieldConfig 输出也是 stale。

**解决方案 A**（推荐）：mergeFieldConfig 内部用 safeReadChildNodes 自动重算（加 byId 参数）

**解决方案 B**：保持 mergeFieldConfig 不变，调用方先用 safeReadChildNodes 包装 components

**决策**：方案 A（更安全）。mergeFieldConfig / setChildren / getFieldOrderBy / `getGroupSizePosition` 全部加 byId 参数（可选，缺省时行为不变）。

### 3.4 getFieldNodeById 扩展

```ts
// 旧
export function getFieldNodeById(components: any[], uniqueId: string): any | null;

// 新
export function getFieldNodeById(
    components: any[],
    uniqueId: string,
    byId?: Record<string, FlatField>,  // 可选：传入则返回 fresh data 的节点
): any | null {
    const node = findNode(components, uniqueId);
    if (!node || !byId) return node;
    const flat = byId[uniqueId];
    if (flat && flat.data !== node.data) {
        return { ...node, data: flat.data };
    }
    return node;
}
```

**注意**：如果父节点的 children 也要重算，需要外层调用 `safeReadChildNodes(byId, node.children)`。

### 3.5 完整改造矩阵

| 函数 | 改造类型 | 影响 |
| --- | --- | --- |
| `safeReadChildNodes` | 新增 | 工具函数 |
| `safeReadFieldConf` | 新增 | 工具函数 |
| `getFieldNodeById` | 加可选 byId 参数 | 向后兼容 |
| `mergeFieldConfig` | 加可选 byId 参数 | 向后兼容；setComponents 内已有 byId，可传入 |
| `setChildren` | 加可选 byId 参数 | 同上 |
| `getFieldOrderBy` | 暂不动（输入是 children 不是 nodes，操作 order 不读 data） | — |
| `getGroupSizePosition` | 加可选 byId 参数 | recalcGroupBounds 已有 byId |

### 3.6 决策树（读 children 时）

```
Q: 读 children 的 data 是否会受影响？
├─ 是 → 用 safeReadChildNodes(byId, children)
└─ 否 → 直接用 children

Q: 读单节点的 config？
├─ 是 → 用 safeReadFieldConf(byId, node)
└─ 否 → 直接用 node.data
```

---

## 4. 详细步骤

### 步骤 1：新增 safeRead* 工具函数

文件：[`src/designer/renderer/utils.ts`](src/designer/renderer/utils.ts)

按 §3.1 实现 `safeReadChildNodes` + `safeReadFieldConf`。

### 步骤 2：扩展 getFieldNodeById / mergeFieldConfig / setChildren / getGroupSizePosition

按 §3.4-§3.5 加可选 byId 参数。

### 步骤 3：替换 layer-manager 3 个文件的 children 读取

文件：
- `src/designer/layer-manager/move/index.ts`
- `src/designer/layer-manager/copy/index.tsx`
- `src/designer/layer-manager/delete/index.tsx`

```ts
// 旧
const { index, components } = getFieldOrderBy(parentNode.children, selected);

// 新
const freshChildren = safeReadChildNodes(byId, parentNode.children);
const { index, components } = getFieldOrderBy(freshChildren, selected);
```

### 步骤 4：替换 drag2layoutBlock / useOnDrop / element.tsx

文件：
- `src/designer/common/draggable/drag2layoutBlock.ts`
- `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts`
- `src/designer/common/field/layout-block/helper/element.tsx`

同上模式包装。

### 步骤 5：recalcGroupBounds 用 safeReadChildNodes 替换内联实现

文件：[`src/designer/DesignerContent.tsx`](src/designer/DesignerContent.tsx) L300-L313

```ts
// 旧（task-012-1 内联实现）
const freshChildNodes = parents.children.map((c: any) => {
    const flat = byId[c.uniqueId];
    if (flat && flat.data !== c.data) {
        return { ...c, data: flat.data };
    }
    return c;
});

// 新（用工具函数）
const freshChildNodes = safeReadChildNodes(byId, parents.children);
```

### 步骤 6：浏览器冒烟

按 §5 验证清单逐项验证。

### 步骤 7：pnpm tsc --noEmit

零新增错误。

### 步骤 8：更新设计 spec

- `.trae/documents/design/designer-canvas/03-read-path.md` §1 加 `safeRead*` 行
- `.trae/documents/design/designer-canvas/05-known-bugs.md` §1.2 状态改为 🟢 已修
- `.trae/documents/design/designer-canvas/06-principles.md` §5.4 更新 stale 防护 checklist

---

## 5. 验证清单

### 5.1 功能验证

- [ ] 拖拽组件 → 保存 → 后端 config 正确（与 task-012-1 验证清单一致）
- [ ] 拖拽组内子组件 → 组尺寸正确（task-012-1 §2b 验证清单）
- [ ] 组内对齐 → 组位置不跳变（task-012-1 §2a 验证清单）
- [ ] 图层"置顶/置底/上移/下移"正常（layer-manager/move 改造后）
- [ ] 图层"复制"正常（layer-manager/copy 改造后）
- [ ] 图层"删除"正常（layer-manager/delete 改造后）
- [ ] 拖拽组件入布局组件正常（drag2layoutBlock 改造后）
- [ ] layers-tree 拖拽正常（useOnDrop 改造后）
- [ ] 布局组件 resize 后子组件位置正确（element.tsx 改造后）

### 5.2 回归

- [ ] 顶层多选对齐不受影响
- [ ] 多个组嵌套 → 任意层对齐 / 移动正常
- [ ] 改名 → 对齐 → title 保留（task-012-1 fieldPreserve 已修，task-012-3 验证）

### 5.3 性能与类型

- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 440 组件场景拖拽仍然流畅（safeReadChildNodes O(k) 不增加额外开销）
- [ ] 浅引用相等时跳过（减少对象创建）

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `safeReadChildNodes` 返回新数组引用，触发不必要的 reconcile | 低 | 性能下降 | 浅引用相等时返回原对象 |
| **safeReadChildNodes 新数组 + 下游旧 mutation 冲突** | 中 | Immer frozen 代理上抛 `TypeError: Cannot assign to read only property` | **执行前先跑 task-016 §3.1 的 grep 审计，确认 layer-manager / drag2layoutBlock / useOnDrop 的 mutation 已清理。task-015 应排在 task-016 之后** |
| 调用方漏改某个 stale 读取位置 | 中 | 类似 task-012-1 问题 2b 的 bug 复发 | 全量 grep `parents.children` / `node.children` / `state.components` 找 stale 读取 |
| mergeFieldConfig 等工具函数加 byId 参数破坏向后兼容 | 低 | 旧调用方编译报错 | 可选参数 + 缺省时行为不变 |

**执行顺序约束**：

```
task-016 (mutation 清理)
    ↓
task-015 (safeRead 封装)  ← 必须排在 task-016 之后
    ↓
~~task-014 (mergeByIdIntoTree 改名丢失)~~  ← 已重编号为 task-012-3（done，task-012-1 fieldPreserve 已修）
```

**理由**：safeReadChildNodes 返回新数组引用，下游如有 `.push` / `.splice` / `parents.children = ...` 等 mutation，新数组虽然非 frozen，但 byId 派生路径可能把 frozen 引用带回来。在 mutation 没清理前混用 safeRead + 旧 mutation，会抛 Immer 错误。task-016 已通过 grep 审计发现剩余 1 处真 mutation（useOnDrop L28/L61），应先清理。

### 回退

- 单 commit：`refactor(safeRead): add safeReadChildNodes/safeReadFieldConf wrappers`
- `git revert` 即可回退

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建，承接 task-012-1 §2b 修复后的"统一封装 stale tree 读取"
- **2026-07-28：状态变更 `planning` → `done`（被单源架构根本消除，不再需要）**。原因：task-002（2026-07-28）单源重构根本消除了 stale tree 问题——`updateFieldConfig` 改为"改树 + buildIndex"，components 树永远 fresh，stale tree 问题在架构层面已不存在。**`safeRead*` 工具函数不再需要**（详见 [05-known-bugs.md §1.2](../design/designer-canvas/05-known-bugs.md) / [memo.md 2026-07-24](./memo.md)）。原计划文件保留作为历史参考。