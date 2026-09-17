# task-2026-07-24-012-2-manual-fix：修复组尺寸重算后位置漂移导致子组件二次位移

> 针对 task-012-1 落地后发现的手动问题修复（第三批）
>
> 计划日期：2026-07-24任务编号：`task-2026-07-24-012-2` 上游任务：
>
> - [task-2026-07-24-012-1-manual-fix](./done/task-2026-07-24-012-1-manual-fix.md)（done，recalcGroupBounds freshChildNodes 修复，但位置归一化逻辑未动）
> - [task-2026-07-21-012-d-manual-fix](./done/task-2026-07-21-012-d-manual-fix.md)（done，beginSkipGroupRecalc/endSkipGroupRecalc 跳过机制，仅覆盖组内对齐场景）
>
> 状态：`done` 类型：`bugfix`
>
> **风险等级：中（修改 recalcGroupBounds 核心逻辑，影响所有组内拖拽场景）**
>
> **设计依据**：`.trae/documents/design/designer-canvas/04-edge-cases.md`（组尺寸重算）

---

## 1. 背景

### 1.1 问题描述

组内有 abcd 四个组件，用户拖动 a 向右移动：

1. 拖动过程中，a 的 left 实时更新（`updateFieldConfig` 只改 byId）
2. 拖动结束后，`recalcGroupBounds` 触发组尺寸重算
3. **问题**：组大小变化时，组的 left/top 锚点也跟着变了（不是保持原 left/top 只扩展 right/bottom），导致组位置漂移
4. 组位置漂移后，视觉上 a 又额外向右跳动了一段（二次位移）

### 1.2 根因定位

文件：[`src/designer/DesignerContent.tsx`](src/designer/DesignerContent.tsx) L279-L353

`recalcGroupBounds` 正常路径（非 skip）执行流程：

```ts
// L316: 算子组件 bbox
const { top, left, width, height } = getGroupSizePosition(freshChildNodes);
// top = 最上子组件的 top（min top）
// left = 最左子组件的 left（min left）

// L342: 子组件位置归一化（减去 min top/left）
const newChildren = resetChildrenPosition(freshChildNodes, { top, left });
// 每个子组件: left -= groupPosition.left, top -= groupPosition.top

// L347: 组位置补偿
{ config: { top: prevTop + top, left: prevLeft + left, width, height } }
```

**问题出在归一化 + 补偿逻辑**：

- `resetChildrenPosition` 把所有子组件的 left/top 减去 min 值，使最左/最上子组件归零
- 组的 left/top 补偿 `prevLeft + left`（prevLeft 是组原 left，left 是 min 值）
- **数学上绝对位置正确**（子组件相对位置 + 组偏移 = 绝对位置不变）

**但实际 Bug 在于**：组尺寸变化后，组的定位基准点不应漂移。当前实现把组当成"重新生成"——重算 bbox → 归一化子组件 → 补偿组位置。这在某些场景下会导致：

1. 组变大（width/height 变化）的同时 left/top 也变了
2. 渲染时序：先渲染组新尺寸（变大 + 位置漂移），再渲染子组件归一化后的新位置
3. 如果中间帧被绘制，用户看到组变大了但子组件还没归一化 → 视觉上 a 跳了一段

**与 a 的初始位置无关**：无论 a 在组的哪个位置，只要拖动后组的 bbox min 值变化（最左/最上子组件换了），就会触发归一化 + 补偿，导致组位置漂移。

### 1.3 相关代码

| 文件                               | 行        | 说明                                                       |
| ---------------------------------- | --------- | ---------------------------------------------------------- |
| `src/designer/DesignerContent.tsx` | L279-L353 | `recalcGroupBounds` 主逻辑                                 |
| `src/designer/DesignerContent.tsx` | L340-L353 | 正常路径（归一化 + 补偿），**Bug 所在**                    |
| `src/designer/DesignerContent.tsx` | L322-L338 | skip 路径（只更新尺寸不改位置），task-012-d 的组内对齐修复 |
| `src/designer/renderer/utils.ts`   | L322-L395 | `getGroupSizePosition`（算 bbox）                          |
| `src/designer/renderer/utils.ts`   | L397-L412 | `resetChildrenPosition`（归一化子组件位置）                |

---

## 2. 目标

1. 修复组内拖拽子组件后，组尺寸重算导致的位置漂移 + 子组件二次位移
2. **不改 skip 路径**（task-012-d 的组内对齐修复保持不变）
3. **不改 `getGroupSizePosition` / `resetChildrenPosition` 函数签名**（影响面太大）
4. `pnpm tsc --noEmit` 主目录 `src/` 零新增错误
5. 浏览器冒烟：组内拖拽 4 方向（上下左右）均无二次位移

---

## 3. 修复方案（待实施时确认）

### 3.1 方案 A：组位置保持不变，只更新尺寸 + 子组件相对位置

**思路**：组尺寸变化时，保持组的 left/top 不变，只更新 width/height。子组件不做归一化（不减 min top/left），保持绝对位置。

```ts
// recalcGroupBounds 正常路径改造
const { top, left, width, height } = getGroupSizePosition(freshChildNodes);

if (width !== prevWidth || height !== prevHeight) {
    // 只更新组尺寸，不改组位置，不归一化子组件
    const results = mergeFieldConfig(
        designerCanvas.components,
        { parentId: parents.uniqueId },
        { config: { width, height } }, // 只改 width/height，top/left 不动
    );
    isRecalcRef.current = true;
    setState({ components: results });
    isRecalcRef.current = false;
}
```

**优点**：简单，组位置不漂移，子组件绝对位置不变 **风险**：组 left/top 不再等于子组件 bbox 的 min 值，可能影响其他依赖组位置的逻辑（如组本身的拖拽、组选中框渲染）

### 3.2 方案 B：组位置补偿但不归一化子组件

**思路**：组位置仍补偿（`prevLeft + left`），但子组件不归一化（不调 `resetChildrenPosition`）。

```ts
const { top, left, width, height } = getGroupSizePosition(freshChildNodes);

if (left !== 0 || top !== 0 || width !== prevWidth || height !== prevHeight) {
    // 组位置补偿，但子组件位置不动（保持绝对位置）
    const results = mergeFieldConfig(
        designerCanvas.components,
        { parentId: parents.uniqueId },
        { config: { top: prevTop + top, left: prevLeft + left, width, height } },
    );
    // 不调 setChildren + resetChildrenPosition
    isRecalcRef.current = true;
    setState({ components: results });
    isRecalcRef.current = false;
}
```

**问题**：子组件相对位置与组位置不匹配（组 left 变了但子组件 left 没变），可能导致组选中框与子组件错位

### 3.3 方案 C：归一化 + 补偿但消除中间帧（时序修复）

**思路**：归一化 + 补偿逻辑不变，但确保组尺寸变化和子组件归一化在同一个渲染帧内完成（避免中间帧被绘制）。

**问题**：当前已是单次 `setState({ components })`，理论上应是同一帧。如果是时序问题，可能是 `mergeByIdIntoTree` 的合并导致 byId 与 tree 不同步（task-014 修复后可能缓解）。

### 3.4 实施时需确认

- 实际复现 bug，用 Redux DevTools 观察 `recalcGroupBounds` 触发前后的 state 变化
- 确认是"归一化逻辑本身有问题"还是"时序/合并导致中间帧"
- 如果是 task-014（mergeByIdIntoTree 改名丢失）的关联问题，可能 task-014 修复后此 bug 自动消失

---

## 4. 详细步骤

### 步骤 1：复现 + 确认根因

1. 构造组内 abcd 场景
2. 拖动 a 向右，观察组位置是否漂移 + a 是否二次位移
3. 用 Redux DevTools 看 `recalcGroupBounds` 触发前后的 byId / components 差异
4. 确认是方案 A/B/C 中的哪一种

### 步骤 2：实施修复

按步骤 1 确认的方案实施。

### 步骤 3：浏览器冒烟

- [ ] 组内拖拽向右 → 无二次位移
- [ ] 组内拖拽向左 → 无二次位移
- [ ] 组内拖拽向上 → 无二次位移
- [ ] 组内拖拽向下 → 无二次位移
- [ ] 组内拖拽到组外（超出组边界）→ 组尺寸正确扩展，位置不漂移
- [ ] 组内对齐（task-012-d skip 路径）→ 回归正常
- [ ] 组本身拖拽 → 回归正常
- [ ] 组外顶层拖拽 → 回归正常

### 步骤 4：pnpm tsc --noEmit

零新增错误。

### 步骤 5：更新设计 spec

- `.trae/documents/design/designer-canvas/04-edge-cases.md`：组尺寸重算章节补充"位置漂移"修复说明

---

## 5. 验证清单

- [ ] 组内 4 方向拖拽无二次位移
- [ ] 组内对齐回归正常（skip 路径不受影响）
- [ ] 组本身拖拽回归正常
- [ ] `pnpm tsc --noEmit` 零新增错误
- [ ] 440 组件场景组内拖拽不卡顿

---

## 6. 风险与回退

| 风险                                         | 概率 | 影响                           | 缓解                      |
| -------------------------------------------- | ---- | ------------------------------ | ------------------------- |
| 修复破坏组选中框渲染（组位置与子组件不匹配） | 中   | 选中框偏移                     | 冒烟验证组选中框位置      |
| 修复破坏组本身拖拽（组位置语义变化）         | 低   | 组拖拽位置异常                 | 冒烟验证组拖拽            |
| 与 task-014（mergeByIdIntoTree）关联         | 中   | task-014 修复后此 bug 可能消失 | 步骤 1 先确认是否仍可复现 |

### 回退

- 单 commit：`fix(recalcGroupBounds): prevent group position drift on child drag`
- `git revert` 即可回退

### 执行顺序建议

```
task-014 (mergeByIdIntoTree 改名丢失)
    ↓
task-012-2 (组位置漂移)  ← 建议排在 task-014 之后，确认是否关联
    ↓
task-016 (mutation 清理)
    ↓
task-015 (safeRead 封装)
    ↓
task-019 (冒烟 + tsc + vitest + 单测)
```

**理由**：task-012-2 的步骤 1 需要确认 bug 是否与 task-014（mergeByIdIntoTree nodeWins 合并覆盖）关联。如果 task-014 修复后此 bug 消失，task-012-2 可直接关闭。

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建（task-012-2），用户报告组内拖拽子组件后组位置漂移 + 子组件二次位移。根因初判为 `recalcGroupBounds` 正常路径的归一化 + 补偿逻辑导致组定位基准点漂移。需实施时复现确认是否与 task-014 关联
- 2026-07-24：全局分析后**修正根因判断**。原判断（归一化+补偿导致基准点漂移）不准确——数学上绝对位置正确。真正根因是 `fieldPreserve` 合并覆盖：
    - 拖动 a → `updateFieldConfig` 改 byId[a].data.config.left/top，并记录到 `dirtyConfigKeys`
    - `recalcGroupBounds` 正常路径 `setState({components})` → `setComponents` reducer → `mergeByIdIntoTree(results, byId, 'fieldPreserve')`
    - `fieldPreserve` 用 byId 中 a 的拖动后**绝对值**覆盖 results 中归一化后的**相对值** → 归一化失效 + 组位置漂移 → 二次位移
    - 与 task-014（mergeByIdIntoTree 改名丢失）**无关联**，是 `fieldPreserve` 的 dirtyConfigKeys 覆盖问题，与 task-012-1 修 handleAlign 同类
- 2026-07-24：实施修复（方案 A v1）。`recalcGroupBounds` 正常路径改为对组节点 + 每个子节点分别 `reduxStore.dispatch(updateFieldConfig(...))`。只改 byId，不触发 `mergeByIdIntoTree` 合并。
- 2026-07-24：**v1 引入新 bug**。用户反馈：拖 a 后组容器变化正常，但点击组整个组向右移动，点击 a 组还原到拖动前位置。根因：只走 updateFieldConfig 导致 byId 与 components 树长期不一致。选中变化触发 recalcGroupBounds 时，用 components 树的 stale `prevLeft` 做基准（`prevLeft + min` 用的旧 prevLeft），把组位置设回旧值。
- 2026-07-24：实施修复（方案 A v2）。改为**先 updateFieldConfig 同步 byId，再 setComponents 同步 components 树**：
    - 先 dispatch updateFieldConfig 把归一化后的组位置 + 子组件位置写入 byId，使 byId 的 left/top 与 results 一致
    - 再走 setState({components: results}) → setComponents 的 fieldPreserve 合并时 byId 值已正确，覆盖无害
    - components 树同步更新，避免选中时 stale prevLeft 导致跳回旧位置
    - `pnpm tsc --noEmit` 验证 `src/` 零新增错误
- 2026-07-24：更新设计文档 `04-edge-cases.md` §1.6 决策树 + 新增 §1.6.1 修复说明 + §1.7 易错点。

### 待办：浏览器冒烟

- [x] 组内拖拽向右 → 无二次位移
- [x] 组内拖拽向左 → 无二次位移
- [x] 组内拖拽向上 → 无二次位移
- [x] 组内拖拽向下 → 无二次位移
- [x] 组内拖拽到组外（超出组边界）→ 组尺寸正确扩展，位置不漂移
- [x] 组内对齐（skip 路径）→ 回归正常
- [x] 组本身拖拽 → 回归正常
- [x] 组外顶层拖拽 → 回归正常
