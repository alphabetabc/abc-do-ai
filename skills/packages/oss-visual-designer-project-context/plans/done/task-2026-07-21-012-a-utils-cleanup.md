# 工具函数清理 - 子任务 A：utils.ts 自身闭包

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-012-a`
> 上游任务：
> - [task-2026-07-21-009-cleanup](./done/task-2026-07-21-009-cleanup.md)
> - [task-2026-07-21-010-layer-manager-utils-immutable](./task-2026-07-21-010-layer-manager-utils-immutable.md)
> 后续任务：
> - task-2026-07-21-012-b：工具函数路径调用方迁移
> - task-2026-07-21-012-c：渲染路径迁移 + onValueChange 修复 + AGENTS.md
> 状态：`done`
> 类型：`refactor`
>
> **风险等级：低（仅新增工具函数，不修改既有 API）**

---

## 1. 背景

`designerCanvas` 迁入 Redux + `byId`/`parentMap` 索引后，原 `getFieldConf(components, id)` / `getParent(components, id, parent)` 仍以 O(n) 递归函数形式存在——完全可被 `byId[id]` / `parentMap[id]` 替代。

但在删除这两个函数前，**少数需要 parent.children 的场景**（如 `layer-manager/move`、`useOnDrop` 等）仍需递归查找节点。task-009 §3.1.2 已设计 `getFieldNodeById` 工具函数，但未落地。

**本任务目标**：仅落地 `getFieldNodeById` 工具函数，作为后续 012-b/c 的依赖基础。不删除任何既有函数，不修改任何既有 API。

---

## 2. 目标

1. 在 `src/designer/renderer/utils.ts` 中新增 `getFieldNodeById(components, uniqueId)` 函数
2. `pnpm tsc --noEmit` 零新增错误
3. grep 校验 `getFieldNodeById` 函数已定义

---

## 3. 关键设计决策

### 3.1 函数签名

```ts
/**
 * 从 components 树递归查找指定 uniqueId 的节点（不 cloneDeep）
 * 仅用于"需要访问 parent.children 或目标节点本身（含 children）"的少数场景
 *
 * 与已删 getFieldConf / getParent 的区别：
 * - getFieldConf：返回 FlatField（不含 children）—— 等价于 byId[id]
 * - getParent：返回 parent 节点（含 children）
 * - getFieldNodeById：返回目标节点本身（含 children）—— 用于"已知 id 找完整节点"
 *
 * 注意：
 * - 返回浅引用，禁止 mutation（如需修改走 dispatch(setComponents(newTree))）
 * - 组件已删除时返回 null，调用方需判空
 * - 与 byId 索引的区别：byId 不存 children，需要 children 时用本函数
 *
 * @param {any[]} components 组件树
 * @param {string} uniqueId 目标节点 uniqueId
 * @returns {any | null}
 */
export function getFieldNodeById(components: any[], uniqueId: string): any | null {
    for (const node of components) {
        if (node.uniqueId === uniqueId) return node;
        if (node.children) {
            const found = getFieldNodeById(node.children, uniqueId);
            if (found) return found;
        }
    }
    return null;
}
```

### 3.2 不删除既有函数

`getFieldConf` / `getParent` 函数定义保留——它们的活跃调用方（15+ 个文件）将在 012-b / 012-c 逐步迁移。task-012-c 最终删除函数定义。

---

## 4. 详细步骤

### 步骤 1：新增 `getFieldNodeById` 函数

文件：`src/designer/renderer/utils.ts`

在 `getFieldConf` 函数定义（L153）之前插入 `getFieldNodeById` 函数，保持文件内部函数顺序一致。

### 步骤 2：grep + tsc 校验

```bash
grep -n "export function getFieldNodeById" src/designer/renderer/utils.ts
# 应返回 1 行命中

pnpm tsc --noEmit
# 零新增错误（pre-existing 错误数不变）
```

---

## 5. 验证清单

- [ ] `src/designer/renderer/utils.ts` 新增 `getFieldNodeById` 函数定义
- [ ] grep `export function getFieldNodeById` 在 utils.ts 中 1 行命中
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 任务文件移到 `plans/done/`
- [ ] 更新 [roadmap.md](./roadmap.md) 状态为 done

---

## 6. 风险与回退

### 风险点

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 函数被外部误用为 `getFieldConf` 替代品 | 低 | 性能浪费（O(n) vs O(1)） | JSDoc 明确说明用途与 byId 的区别 |

### 回退方案

- 新增函数纯加法，回退只需删除函数定义（无副作用）

---

## 7. 实施记录

- 2026-07-21：任务创建（task-012-a），承接 task-009 §3.1.2 设计，作为 task-012-b/c 的依赖基础