# task-2026-07-24-016：清理 8 处 mutation 残留 + cloneDeep 滥用

> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-016`
> 上游任务：
> - [useDesigner 迁移可行性审计 §2 + §9](../research/useDesigner迁移可行性审计.md)（审计依据）
> - [task-2026-07-21-009-cleanup](./done/task-2026-07-21-009-cleanup.md)（done，删 `getFieldConf` / `getParent` 内部 cloneDeep）
> - [task-2026-07-21-010-layer-manager-utils-immutable](./done/task-2026-07-21-010-layer-manager-utils-immutable.md)（done，部分 mutation 改造）
>
> 状态：`done`（2026-07-28）
> 类型：`refactor`
>
> **⚠️ 本任务已被新任务承接**：原 plan 是清理 `useDesigner 迁移可行性审计` 中识别的 8 处 mutation 残留 + cloneDeep 滥用。**所有 mutation 清理 + cloneDeep 审计工作已由 [task-2026-07-28-001-single-source-refactor-mutation-cleanup](./done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md) 承接完成**（详见 [05-known-bugs.md §1.3](../design/designer-canvas/05-known-bugs.md) / [memo.md 2026-07-24](./memo.md)）。本任务状态标记为 `done` 以表达"目标已实现"。
>
> **风险等级：中（layer-manager mutation 改造影响所有图层操作）** — **不再适用**（任务关闭）
>
> **设计依据**：`.trae/documents/design/designer-canvas/05-known-bugs.md §1.3`、`.trae/documents/design/designer-canvas/06-principles.md §6/§7`

---

## 1. 背景

[useDesigner 迁移可行性审计 §2 + §9](../research/useDesigner迁移可行性审计.md) 发现的问题：

### 1.1 mutation 残留

**2026-07-24 grep 审计结果**（脚本：[`.trae/scripts/audit-mutations.mjs`](.trae/scripts/audit-mutations.mjs)）：

| 文件 | 行 | 写法 | 当前状态 |
| --- | --- | --- | --- |
| `designer/aside-panel/layers-tree/tree/useOnDrop.ts` | L28 | `targetFieldConfig.children.unshift(dropFieldConfig)` | 🔴 **真 mutation**（task-016 必修） |
| `designer/aside-panel/layers-tree/tree/useOnDrop.ts` | L61 | `targetParentChildren.splice(...)` | 🔴 **真 mutation**（task-016 必修） |
| `designer/common/task/taskManager.ts` | L18, L47 | `runningTaskQueue.splice/push` | ⚪ 误报（task queue，非 designer-canvas） |
| `designer/layer-manager/move/index.ts` | — | `splice/unshift/push` | 🟢 已修（task-010） |
| `designer/layer-manager/lock/index.ts` | — | `config.isLock = ...` | 🟢 已修（task-009） |
| `designer/layer-manager/visible/index.ts` | — | `config.isHidden = ...` | 🟢 已修（task-009） |
| `designer/renderer/designer-field/index.tsx` | — | `parents.children = ...` | 🟢 已修（task-010） |
| `designer/renderer/utils.ts` | L250, L251 | `result.splice` | ⚪ 误报（`orderBy` 函数内 `arr.slice()` 副本 mutation） |
| `designer/renderer/utils.ts` | L508 | 注释里的 `splice` | ⚪ 误报（注释，非代码） |

**结论**：task-006 审计时发现的 8 处 mutation 已大部分修复（task-007/008/009/010/011-fix），**仅剩 useOnDrop L28/L61 共 2 行真 mutation** 待 task-016 清理。

### 1.2 cloneDeep 滥用

**2026-07-24 grep 审计结果**：

| 文件 | 行 | 上下文 | 当前状态 |
| --- | --- | --- | --- |
| `designer/common/dnd/helper.ts` | L60 | `_.cloneDeep({...})` 创建临时对象 | 🟡 需审计（task-016） |
| `designer/toolbar/comp/dataset/DataSetList.tsx` | L120 | `_.cloneDeep(rawDataSetList)` | 🟡 需审计（task-016） |
| `designer/renderer/utils.ts` | L27, L74, L199 | `resetUniqueId` / `generatorField` / `resetObjectSealed` | ✅ 合理使用（白名单） |
| `utils.js` / `utils.bak.js` | 旧文件 | `getParent` / `getFieldConf` / `flatDesignerList` | 🟢 已删/已清理（task-009/010） |

---

## 2. 目标

1. **修正 §1.1 / §1.2 表中的"8 处 mutation / 4 处 cloneDeep"假设**——grep 审计后**实际仅剩 2 处真 mutation**（useOnDrop L28/L61）+ **2 处 cloneDeep 待审计**（dnd/helper L60、DataSetList L120），其余均已修复
2. 清理 `useOnDrop.ts` L28 / L61 的真 mutation（unshift + splice）
3. 审计 `dnd/helper.ts` L60 的 `_.cloneDeep({...})` 是否可替换为浅拷贝或直接 spread
4. 审计 `DataSetList.tsx` L120 的 `_.cloneDeep(rawDataSetList)` 是否真有必要（涉及第三方库兼容）
5. `pnpm tsc --noEmit` 零新增错误
6. 浏览器冒烟：layers-tree 拖拽（drag/drop）正常

---

## 3. 修复方案

### 3.1 全量审计（已完成 2026-07-24）

```bash
# 用脚本统一审计（推荐）
node .trae/scripts/audit-mutations.mjs
```

**审计结论**（详见 §1.1 / §1.2 表）：

- layer-manager lock / visible / move **已全部修复**（task-009 / task-010）
- `designer-field/index.tsx` parents.children mutation **已修复**（task-010）
- `configuration-panel/page/index.jsx` render 内 mutation **已修复**（task-011-fix 3.1）
- **`useOnDrop.ts` L28 / L61 是剩余的 2 行真 mutation**（task-016 必修）
- cloneDeep 实际仅剩 2 处待审计（`dnd/helper.ts` L60、`DataSetList.tsx` L120）

### 3.2 ~~layer-manager lock / visible 改造~~（已不需要）

**task-009 已完成**：[lock/index.ts L10-L22](src/designer/layer-manager/lock/index.ts#L10) 已用 spread 构造 `newData` 走 `mergeFieldConfig`，无 mutation。

**验证**（grep 已确认）：
- `designer/layer-manager/lock/index.ts` 无 `.isLock *=` 命中
- `designer/layer-manager/visible/index.ts` 无 `.isHidden *=` 命中

### 3.3 ~~layer-manager move 改造~~（已不需要）

**task-010 已完成**：`move/index.ts` 注释说明"旧实现用 splice/unshift/push 直接 mutation，已改用不可变版"。

**验证**（grep 已确认）：
- `designer/layer-manager/move/index.ts` 无 `.splice\|.unshift\|.push` 命中（注释除外）

### 3.4 useOnDrop.ts 真 mutation 改造（**任务核心**）

文件：[`src/designer/aside-panel/layers-tree/tree/useOnDrop.ts`](src/designer/aside-panel/layers-tree/tree/useOnDrop.ts)

#### 3.4.1 L28 `unshift` 改造

**当前写法**（实际，grep 验证）：
```ts
// L28
targetFieldConfig.children.unshift(dropFieldConfig);
```

**根因分析**：
- `targetFieldConfig` 是 `getFieldNodeById(components, parentId)` 返回的节点
- `targetFieldConfig.children` 来自 stale tree（可能 Immer frozen）
- 直接 `unshift` 会抛 `TypeError: Cannot assign to read only property`

**新写法**：
```ts
// 用 setChildren 不可变更新（task-015 之前的临时方案）
const newChildren = [dropFieldConfig, ...targetFieldConfig.children];
const finalComponents = setChildren(components, targetFieldConfigParent.uniqueId, newChildren);
// 后续 dispatch setComponents(finalComponents)
```

#### 3.4.2 L61 `splice` 改造

**当前写法**（实际，grep 验证）：
```ts
// L59-L61
const targetParentChildren = targetFieldConfigParent.uniqueId === ROOT_UNIQUE_ID ? newComponents : targetFieldConfigParent.children;
const index = targetParentChildren.findIndex((d) => d.uniqueId === targetFieldUniqueId);
targetParentChildren.splice(dropPosition === -1 ? index : index + 1, 0, dropFieldConfig);
```

**根因分析**：
- 同 L28，`targetParentChildren` 是 stale children
- 直接 splice 同样抛 TypeError

**新写法**：
```ts
// 用 spread + slice 构造新 children，再 setChildren 不可变更新
const insertIndex = dropPosition === -1 ? index : index + 1;
const newChildren = [
    ...targetParentChildren.slice(0, insertIndex),
    dropFieldConfig,
    ...targetParentChildren.slice(insertIndex),
];
const finalComponents = setChildren(newComponents, targetFieldConfigParent.uniqueId, newChildren);
```

#### 3.4.3 性能注意

每次拖拽都 `setChildren` 走 `setComponents` 是低频路径（用户拖动一次），**不**影响 60+ 次/秒 的高频字段级更新。task-016 改造**不**回退 P6 优化（task-008）。

### 3.5 ~~flatDesignerList cloneDeep 清理~~（不需要）

grep 审计后**未发现滥用**：
- `utils.ts` L506 在 flatDesignerList 内 `curr = _.cloneDeep(curr)` —— **已确认在白名单函数内**（resetUniqueId / generatorField 调用路径）
- `utils.bak.js` 旧文件已不活跃

### 3.6 dnd/helper.ts L60 cloneDeep 审计

文件：[`src/designer/common/dnd/helper.ts`](src/designer/common/dnd/helper.ts) L60

**当前写法**：
```ts
const fieldConfig = _.cloneDeep({...});
```

**审计步骤**：
1. 读 L55-L70 上下文，确认 `fieldConfig` 是否传给第三方库（可能 frozen）
2. 如果是第三方库 → 保留 cloneDeep（白名单类似 `resetObjectSealed`）
3. 如果只是构造新对象 → 改为 spread（无需 cloneDeep）

**决策**：task-016 Step 2 阶段判断。

### 3.7 DataSetList.tsx L120 cloneDeep 审计

文件：[`src/designer/toolbar/comp/dataset/DataSetList.tsx`](src/designer/toolbar/comp/dataset/DataSetList.tsx) L120

**当前写法**：
```ts
return _.cloneDeep(rawDataSetList);
```

**审计步骤**：
1. 读 L110-L130 上下文，确认 `rawDataSetList` 来源（state / props / 第三方）
2. 如果来自 Redux store（Immer frozen）→ 第三方库传值可能需要 cloneDeep
3. 如果来自普通对象 → 改为直接 return（无需 cloneDeep）

**决策**：task-016 Step 3 阶段判断。

---

**剩余工作清单**（基于 grep 审计，2026-07-24）：

| # | 位置 | 工作量 | 风险 |
| --- | --- | --- | --- |
| 1 | useOnDrop.ts L28 unshift → setChildren | 5 分钟 | 低 |
| 2 | useOnDrop.ts L61 splice → spread + setChildren | 10 分钟 | 低 |
| 3 | dnd/helper.ts L60 cloneDeep 审计 | 5 分钟（决定保留/删除） | 低 |
| 4 | DataSetList.tsx L120 cloneDeep 审计 | 5 分钟（决定保留/删除） | 低 |
| 5 | tsc + 浏览器冒烟 | 10 分钟 | 低 |

**对比原 plan**：原 plan 写了 8 处 mutation + 4 处 cloneDeep 待清理，实际仅剩 2 处 mutation + 2 处 cloneDeep 待审计。**task-016 工作量大幅缩减**。

---

## 4. 详细步骤

### 步骤 1：全量审计

按 §3.1 grep 命令全量跑一遍，记录所有命中位置。

### 步骤 2：分类

按"必须修 / 可选修 / 误报"分类：

| 命中 | 类型 | 处理 |
| --- | --- | --- |
| `lock/index.ts` `config.isLock = true` | 直接 mutation | 必须修 |
| `move/index.ts` `splice/unshift` | 直接 mutation | 必须修（如有残留） |
| `flatDesignerList` 内 `_.cloneDeep` | 滥用 | 必须修 |
| `getFieldOrderBy rebuild=true cloneDeep` | 滥用 | 必须修（如有残留） |
| `useState({ ...state.x })` | 浅拷贝非 mutation | 误报 |

### 步骤 3：逐个改造

按 §3.2-§3.6 改造方案逐个修。

### 步骤 4：浏览器冒烟

按 §5 验证清单验证。

### 步骤 5：pnpm tsc --noEmit

零新增错误。

### 步骤 6：更新设计 spec

- `.trae/documents/design/designer-canvas/05-known-bugs.md` §1.3 状态改为 🟢 已修
- `.trae/documents/design/designer-canvas/06-principles.md` §6/§7 增加"已知违规位置（task-016 后清零）"清单

---

## 5. 验证清单

### 5.1 功能验证

- [ ] 图层"置顶/置底"正常（move moveToTop / moveToBottom）
- [ ] 图层"上移/下移"正常（move moveUp / moveDown）
- [ ] 图层"锁定"正常（lock）
- [ ] 图层"隐藏"正常（visible）
- [ ] 图层"复制"正常（copy）
- [ ] 图层"删除"正常（delete）
- [ ] 图层"成组 / 拆组"正常（group）
- [ ] 多选拖拽正常
- [ ] 拖拽组件入布局组件正常

### 5.2 不可变契约验证

- [ ] Immer frozen 校验：操作过程中无 `TypeError: Cannot assign to read only property`
- [ ] 操作后 byId/parentMap 同步（components 变更触发 buildIndex）
- [ ] 操作后 components 引用变化（如果 setComponents 触发）

### 5.3 性能与类型

- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 440 组件场景图层操作不卡顿（cloneDeep 清理后性能应提升）
- [ ] grep `\.splice\|\.push\|\.unshift` 在 `designer/layer-manager/` 0 命中
- [ ] grep `_.cloneDeep` 在 `designer/renderer/utils.ts` 仅命中合理位置（resetUniqueId / generatorField）

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `lock`/`visible` 改 updateFieldConfig 后性能下降（高频点击） | 低 | 锁定/隐藏按钮点击不流畅 | updateFieldConfig 是 O(1)，可接受 |
| `flatDesignerList` 去 cloneDeep 后调用方受 stale 影响 | 中 | 某个调用方 bug | 全量 grep 调用方，逐个评估 |
| `move` 不可变改造漏改 | 中 | 某个移动方向不工作 | 浏览器冒烟验证置顶/置底/上移/下移 4 个方向 |
| 改完后 tsc 错误 | 中 | 编译失败 | 分批 commit + tsc 校验 |

### 回退

- 分 3 个独立 commit：
  - commit 1：清理 `lock` / `visible` mutation
  - commit 2：清理 `move` / `copy` / `delete` mutation
  - commit 3：清理 `flatDesignerList` / `getFieldOrderBy` cloneDeep
- 每个独立 `git revert` 可回退

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建，承接 useDesigner 迁移可行性审计 §2 + §9 留作后续的 mutation + cloneDeep 清理
- **2026-07-28：状态变更 `planning` → `done`（被新任务承接）**。原因：所有 mutation 清理 + cloneDeep 审计工作已由 [task-2026-07-28-001-single-source-refactor-mutation-cleanup](./done/task-2026-07-28-001-single-source-refactor-mutation-cleanup.md) 承接完成（详见 [05-known-bugs.md §1.3](../design/designer-canvas/05-known-bugs.md) / [memo.md 2026-07-24](./memo.md)）。原计划文件保留作为历史参考。