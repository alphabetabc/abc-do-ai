# task-2026-07-28-003：单源重构（3/4）— 死代码清理 + 保存路径

> 单源重构系列第 3 个 task，承载元计划 task-2026-07-27-001 阶段 4 的**清理步骤**（步骤 6 / 6a / 6b / 6c）。
>
> - 计划日期：2026-07-28
> - 任务编号：`task-2026-07-28-003`
> - 状态：`done`
> - 类型：`refactor + chore`
> - 上游：[task-2026-07-28-002 单源 reducer 改造](./task-2026-07-28-002-single-source-refactor-reducer.md)（**硬依赖**：mergeByIdIntoTree 调用方必须先清零）
> - 下游：[task-2026-07-28-004 文档更新 + 全量验证](./task-2026-07-28-004-single-source-refactor-docs-verify.md)

---

## 1. 背景与目标

task-002 完成后，单源架构已到位：
- `mergeByIdIntoTree` 的 3 个调用方已清零（setComponents / setState reducer + getSaveableComponents 内部）
- `dirtyConfigKeys` 已无写入方（updateFieldConfig reducer 已删除写入）
- `freshChildNodes` + 两步同步已删除（recalcGroupBounds 已简化）

本 task 清理所有"因单源架构到位而失去调用方"的死代码 + 改造保存路径：

- 步骤 6：3 个保存路径改为直接序列化 `components` + 删除 `getSaveableComponents` 函数
- 步骤 6a：删除 `mergeByIdIntoTree` 函数本体 + `dirtyConfigKeys` 字段 + 三方向字符串字面量 + canvas-graph 注释清理
- 步骤 6b：删 skip 机制 + 4 个死工具函数 + undo/redo 死字段

> **不做**：不清理 `src/designer/**/*.bak` 和 `src/store/backup/*.bak` 备份文件。AGENTS.md §10.2 只要求"grep 时排除、不参考其实现"，未要求删除。这些文件不影响构建/运行，删除无技术收益且超出本 task 边界。

**未来清理计划**（不在本 task 范围，r1§2.6）：

- 阶段 4 步骤 6c 原列"清理 8 个备份文件（4 个 designer/\*.bak + 4 个 store/backup/\*.bak）"，本 task 主动放弃
- 时机：单源重构稳定后（task-004 完成后 1 个月）单独开 task
- 验证：`grep \.bak src/` → 期望 0 命中
- 风险：备份文件长期存在，未来新人 grep 时可能误读——通过 AGENTS.md §10.2 已标注"`.bak` 备份文件是历史快照，不是活代码"缓解

**完成标准**：所有双源同步机制本体删除 + 保存路径直接序列化 components + 死代码清理 + tsc 通过 + grep 验证 0 命中。

---

## 2. 步骤总览

| 步骤 | 改动 | 文件数 | 风险 | 独立 commit |
| --- | --- | --- | --- | --- |
| 6 | 3 保存路径改直接序列化 + 删 getSaveableComponents | 4 | 中 | `refactor: 删除 getSaveableComponents，3 保存路径直接序列化 components` |
| 6a | 删 mergeByIdIntoTree + dirtyConfigKeys + 三方向字面量 + canvas-graph 注释 | 2 | 低 | `refactor: 删除 mergeByIdIntoTree + dirtyConfigKeys + 三方向字面量` |
| 6b | 删 skip 机制 + 4 死函数 + undo/redo 死字段 | 2 | 极低 | `chore: 清理 skip 机制 + 4 死函数 + undo/redo 死字段` |

**依赖关系**：
- 步骤 6 → 6a（**强依赖**：步骤 6 删除 getSaveableComponents 后，mergeByIdIntoTree 仅剩 reducer 2 处调用方，但 task-002 已删除这 2 处；步骤 6a 删除 mergeByIdIntoTree 函数本体）
- 步骤 6b 独立

---

## 3. 详细步骤

### 步骤 6：改 `getSaveableComponents` 路径（删除函数）

> ⚠️ **回退依赖**：本步骤与步骤 6a 存在依赖——`getSaveableComponents` 内部调用 `mergeByIdIntoTree`（[utils.ts:766](../../src/designer/renderer/utils.ts#L766)）。若步骤 6a 已执行（mergeByIdIntoTree 已删除），单独 revert 本步骤会导致编译失败。回退顺序：先 revert 6a 再 revert 6。

**目标**：3 个保存路径改为直接序列化 `designerState.components`，删除 `getSaveableComponents` 函数。

**改动清单（4 文件）**：

#### 6.1 `DesignerContent.tsx:414` 改保存路径

**文件**：[`src/designer/DesignerContent.tsx`](../../src/designer/DesignerContent.tsx#L414) L414

**当前实现**：
```ts
config: JSON.stringify({
    page: designerState.page,
    components: getSaveableComponents(designerState),
    realtimeDataFlow: designerState.realtimeDataFlow ?? [],
    customFieldsListMapping: {},
}),
```

**目标实现**：
```ts
config: JSON.stringify({
    page: designerState.page,
    components: designerState.components,  // 直接序列化（单源后永远 fresh）
    realtimeDataFlow: designerState.realtimeDataFlow ?? [],
    customFieldsListMapping: {},
}),
```

**import 删除**（[DesignerContent.tsx:19](../../src/designer/DesignerContent.tsx#L19)）：`getSaveableComponents` 从 import 列表中删除（task-002 步骤 5 已删除 `shouldSkipGroupRecalc`，本步骤删除剩下的 `getSaveableComponents`）

#### 6.2 `saveAsTemp-modal/index.tsx:59` 改保存路径

**文件**：[`src/designer/toolbar/comp/saveAsTemp-modal/index.tsx`](../../src/designer/toolbar/comp/saveAsTemp-modal/index.tsx#L9) L9 + L59

**当前实现**：
```ts
import { getSaveableComponents } from '@Src/designer/renderer/utils';
// ...
config: JSON.stringify({
    page: designerState.page,
    components: getSaveableComponents(designerState),
}),
```

**目标实现**：
```ts
// import 删除 getSaveableComponents
// ...
config: JSON.stringify({
    page: designerState.page,
    components: designerState.components,
}),
```

#### 6.3 `designer-scene-monitor/index.tsx:47` 改保存路径

**文件**：[`src/pages/designer-page/designer-scene-monitor/index.tsx`](../../src/pages/designer-page/designer-scene-monitor/index.tsx#L15) L15 + L47

**当前实现**：
```ts
import { getSaveableComponents } from '@Src/designer/renderer/utils';
// ...
shareActions.actions?.postMessage?.(
    'onDesignerSave',
    { page: designerState.page, components: getSaveableComponents(designerState) },
    'microApp',
);
```

**目标实现**：
```ts
// import 删除 getSaveableComponents
// ...
shareActions.actions?.postMessage?.(
    'onDesignerSave',
    { page: designerState.page, components: designerState.components },
    'microApp',
);
```

#### 6.4 `utils.ts:765-767` 删 `getSaveableComponents` 函数

**文件**：[`src/designer/renderer/utils.ts`](../../src/designer/renderer/utils.ts#L765-L767) L765-L767

**删除内容**：L765-L767 整个函数（含 JSDoc 注释）

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**（重点验证 task-012-1 修复未回归）：
- [ ] 拖动组件后立即保存：保存的配置包含正确的位置
- [ ] 改名后立即保存：保存的配置包含正确的标题
- [ ] 拖动 + 改名后保存：两个字段都正确
- [ ] 另存为模板（saveAsTemp）：保存正确
- [ ] 场景监控嵌入（designer-scene-monitor）：postMessage 数据正确
- [ ] **Ctrl+S 保存快捷键**（DesignerContent.tsx:449）：快捷键触发保存正确
- [ ] **Delete 键删除组件**（DesignerContent.tsx:480）：删除快捷键触发正确

**回退**：`git revert` 此 commit。**注意**：若步骤 6a 已执行，需先 revert 6a 再 revert 6。

**commit**：`refactor: 删除 getSaveableComponents 函数，3 个保存路径直接序列化 components（单源后无需合并）`

---

### 步骤 6a：删 `mergeByIdIntoTree` + `dirtyConfigKeys` + 三方向字符串字面量

> ⚠️ **强依赖关系**：本步骤强依赖 task-002 步骤 3+4 + 本 task 步骤 6——`mergeByIdIntoTree` 有 3 个调用方，必须全部清零后才能删除函数本体：
>
> | 调用点 | 所在文件 | 删除步骤 |
> | --- | --- | --- |
> | `setComponents` reducer L83 | designer-canvas.ts | task-002 步骤 3 |
> | `setState` reducer L96 | designer-canvas.ts | task-002 步骤 4 |
> | `getSaveableComponents` 内部 L766 | utils.ts | 本 task 步骤 6 |
>
> **正确执行顺序**：task-002 步骤 3 → 步骤 4 → 本 task 步骤 6 → 本步骤 6a。任何顺序错乱都会导致 tsc 编译失败。

**目标**：删除双源同步机制本体。

**改动清单（2 文件）**：

**文件 1**：[`src/designer/renderer/utils.ts`](../../src/designer/renderer/utils.ts)

**删除内容**：
- L657-L749 `mergeByIdIntoTree` 函数（含 JSDoc 注释，约 90 行）
- L654 `FlatField.dirtyConfigKeys` 字段定义
- L729-L735 fieldPreserve 方向的 `flat.dirtyConfigKeys.forEach`（随函数删除）
- 三方向字符串字面量 `nodeWins` / `byIdWins` / `fieldPreserve`（随函数删除）

**`buildIndex` 简化**（L784-L807）：删除 `dirtyConfigKeys: new Set()` 初始化

```ts
// 当前 L791-L797 (双源架构下)：
// byId[node.uniqueId] = {
//     uniqueId: node.uniqueId,
//     type: node.type,
//     parentId,
//     data: node.data,
//     dirtyConfigKeys: new Set(),  // ← 双源架构下存在
// };
// 单源后（task-002 步骤 2 已应用）：
// byId[node.uniqueId] = {
//     uniqueId: node.uniqueId,
//     type: node.type,
//     parentId,
//     data: node.data,
//     // dirtyConfigKeys 已在 task-002 步骤 2 重写 buildIndex 时一并删除
// };
```

**时序依赖**：本步骤 6a 假设 task-002 步骤 2 已应用（buildIndex 已是新签名，dirtyConfigKeys 已删除）。如果 task-002 步骤 2 未先应用，本步骤需先手动删除 dirtyConfigKeys，再应用 task-002 步骤 2。

> 注：task-002 步骤 2 已扩展 buildIndex 签名为 `(components, oldById?)` 并增加引用复用逻辑。本步骤在此基础上删除 `dirtyConfigKeys: new Set()` 初始化。

**`FlatField` 接口简化**（L642-L655）：
```ts
// 当前：
export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;
    data: { config: any; [key: string]: any };
    dirtyConfigKeys: Set<string>;
}
// 改为：
export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;
    data: { config: any; [key: string]: any };
}
```

**文件 2**：[`src/designer/canvas-graph/index.tsx`](../../src/designer/canvas-graph/index.tsx#L323-L329) L323-L329（注释清理）

**canvas-graph 注释清理**：handleAlign 注释引用 dirtyConfigKeys + fieldPreserve + mergeByIdIntoTree，本步骤同步清理为单源后的语义注释：

```ts
// task-2026-07-24-012-1 + task-2026-07-27-001 修复（2026-07-27）：对齐走 updateFieldConfig → 单源后自动改树 + buildIndex 派生
// - 单源架构：updateFieldConfig 改树后 byId 同步刷新，无需 mergeByIdIntoTree 合并
// - recalcGroupBounds 直接读 components（永远 fresh），无需 freshChildNodes 包装
```

**reducer import 清理**：[`designer-canvas.ts:3`](../../src/store/modules/designer-canvas.ts#L3)
```ts
// 当前
import { buildIndex, mergeByIdIntoTree, type FlatField } from '@Src/designer/renderer/utils';
// 改为
import { buildIndex, type FlatField } from '@Src/designer/renderer/utils';
```

**验证**：
```bash
pnpm exec tsc --noEmit
# 引用清理验证：确认无活代码引用
# grep "dirtyConfigKeys" src/ → 期望 0 命中
# grep "mergeByIdIntoTree" src/ → 期望 0 命中
# grep "nodeWins\|byIdWins\|fieldPreserve" src/ → 期望 0 命中（注释除外）
```

**浏览器冒烟**：
- [ ] 所有 reducer 行为与 task-002 一致（无新增功能，纯清理）
- [ ] useFieldConf 订阅 byId[id] 仍能拿到最新值
- [ ] 对齐操作（handleAlign）行为一致（注释清理不影响功能）

**回退**：`git revert` 此 commit

**commit**：`refactor: 删除 mergeByIdIntoTree + dirtyConfigKeys + 三方向字符串字面量（双源同步机制本体删除 + canvas-graph 注释清理）`

---

### 步骤 6b：删 skip 机制 + 4 个死工具函数 + undo/redo 死字段

**目标**：删除所有"重构前就是死代码"的清理项。

> 💡 task-001 步骤 1b 已移除 toolbar handleClear 注释块（undo/redo 死字段的唯一潜在调用方），本步骤删除 undo/redo 死字段理由更充分。

**改动清单（2 文件）**：

#### 6b.1 `utils.ts` 删除 skip 机制 + 4 个死工具函数

**文件**：[`src/designer/renderer/utils.ts`](../../src/designer/renderer/utils.ts)

**删除内容**：
- L815-L833 `patchFieldConf` 函数（死代码 + 与 reducer 内联实现不一致）
- L835-L837 `getFieldById` 函数（死代码）
- L839-L841 `getParentIdById` 函数（死代码）
- L843-L846 `removeFieldFromIndex` 函数（死代码）
- L863-L875 skip 机制：模块级变量 `_skipGroupRecalc` + `beginSkipGroupRecalc` + `endSkipGroupRecalc` + `shouldSkipGroupRecalc`

> 注：task-002 步骤 5 已删除 DesignerContent.tsx 中对 `shouldSkipGroupRecalc` 的 import 和调用。本步骤删除 utils.ts 中的函数本体。

**skip 机制成为死代码的原因**（r2§3.2）：

skip 机制（beginSkipGroupRecalc / endSkipGroupRecalc / shouldSkipGroupRecalc）在 task-012-d（2026-07-24）引入，用于"组内对齐等显式操作时跳过位置重归一化"。但 task-002 步骤 5 简化 recalcGroupBounds 后：
- freshChildNodes 包装已删除（单源后 components 永远 fresh）
- task-012-2 两步同步已删除（单源后单次 setComponents 即可）
- shouldSkipGroupRecalc 的调用方已删除（task-002 步骤 5 已清理 import）

"组内对齐时组位置跳变"的问题现在通过单源架构根本解决：对齐走方案 B（批量 setComponents），recalcGroupBounds 直接读 components（永远 fresh），不再需要 skip 机制跳过位置重归一化。

#### 6b.2 `designer-canvas.ts` 删除 undo/redo 死字段

**文件**：[`src/store/modules/designer-canvas.ts`](../../src/store/modules/designer-canvas.ts)

**删除内容**：
- L34-L35 `undo: any[]` 字段（含 JSDoc）
- L36-L37 `redo: any[]` 字段（含 JSDoc）
- L65 `initialState.undo = []`
- L66 `initialState.redo = []`

**验证**：
```bash
pnpm exec tsc --noEmit
# grep "undo\|redo" src/store/modules/designer-canvas.ts → 期望 0 命中
# grep "patchFieldConf\|getFieldById\|getParentIdById\|removeFieldFromIndex" src/ → 期望 0 命中
# grep "beginSkipGroupRecalc\|endSkipGroupRecalc\|shouldSkipGroupRecalc\|_skipGroupRecalc" src/ → 期望 0 命中
```

**浏览器冒烟**：
- [ ] 整体行为不变（这些是死代码，删除不应影响任何场景）
- [ ] 持久化测试（redux-persist 当前 whitelist=[]）：undo/redo 删除不影响持久化行为

**回退**：`git revert` 此 commit

**commit**：`chore: 清理 skip 机制 + 4 个死工具函数 + undo/redo 死字段（重构历史遗留清理）`

---

## 4. 验证清单

### 4.1 类型安全（每步必跑）

```bash
pnpm exec tsc --noEmit
```

### 4.2 grep 验证（步骤 6a/6b 完成后）

```bash
# 步骤 6a 后：期望全部 0 命中（注释除外）
grep -rn "dirtyConfigKeys" src/ --include="*.ts" --include="*.tsx"
grep -rn "mergeByIdIntoTree" src/ --include="*.ts" --include="*.tsx"
grep -rn "nodeWins\|byIdWins\|fieldPreserve" src/ --include="*.ts" --include="*.tsx"

# 步骤 6b 后：期望全部 0 命中
grep -rn "patchFieldConf\|getFieldById\|getParentIdById\|removeFieldFromIndex" src/ --include="*.ts" --include="*.tsx"
grep -rn "beginSkipGroupRecalc\|endSkipGroupRecalc\|shouldSkipGroupRecalc\|_skipGroupRecalc" src/ --include="*.ts" --include="*.tsx"
grep -rn "undoStack\|redoStack\|pushUndo\|popUndo" src/ --include="*.ts" --include="*.tsx"
```

### 4.3 浏览器冒烟（步骤 6 保存路径验证）

- [ ] 拖动组件后立即保存：保存的配置包含正确的位置
- [ ] 改名后立即保存：保存的配置包含正确的标题
- [ ] 拖动 + 改名后保存：两个字段都正确
- [ ] 另存为模板（saveAsTemp）：保存正确
- [ ] 场景监控嵌入（designer-scene-monitor）：postMessage 数据正确
- [ ] Ctrl+S 保存快捷键
- [ ] Delete 键删除组件

---

## 5. 风险与回退

### 5.1 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 步骤 6/6a 顺序错乱导致编译失败 | 高 | 强依赖已标注，按 6 → 6a 顺序执行 |
| 死代码删除遗漏 | 极低 | grep 验证 0 命中 |

### 5.2 回退方案

**回退依赖图**：

| 回退该步骤 | 必须同时回退 | 原因 |
| --- | --- | --- |
| 步骤 6 | 步骤 6a（若已执行） | getSaveableComponents 回退后又调用 mergeByIdIntoTree |
| 步骤 6a | 无 | 函数恢复后无调用方也不影响 |
| 步骤 6b | 无 | 死代码删除/恢复不影响其他步骤 |

**回退顺序**（如需回退到双源架构）：步骤 6a → 步骤 6 → task-002 步骤 4 → task-002 步骤 3 → task-002 步骤 5 → task-002 步骤 2

---

## 6. 与上下游 task 的衔接

**前置条件**：task-002（单源 reducer 改造）完成。mergeByIdIntoTree 的 3 个调用方已全部清零。

**完成本 task 后**，task-004（文档更新 + 全量验证）可以开始执行，因为：
- 所有代码改动已完成（task-001 mutation + task-002 reducer + task-003 清理）
- 文档可以开始重写（代码已稳定）
- 全量验证可以执行（所有改动已到位）

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：task 创建。从 task-2026-07-27-001 元计划阶段 4 拆分步骤 6/6a/6b/6c 为独立 task。
- 2026-07-28：结合 r1.md + r2.md review 报告优化——修复 dirtyConfigKeys 伪代码时序冲突（r1§2.3：标注 task-002 步骤 2 已删除）、skip 机制删除理由补充（r2§3.2）、增加"未来清理计划"段（r1§2.6：备份文件清理延后）。
- 2026-07-28：执行完成。步骤 6 / 6a / 6b 全部落地，tsc 通过（src/ 无错误，仅 packages/ pre-existing），grep 验证全部 0 命中（仅注释 + .bak 备份文件）。
    - 步骤 6：3 个保存路径（DesignerContent.tsx:360 / saveAsTemp-modal/index.tsx:59 / designer-scene-monitor/index.tsx:47）改为直接序列化 `designerState.components`；删除 `getSaveableComponents` 函数 + 3 处 import。
    - 步骤 6a：删除 `mergeByIdIntoTree` 函数本体（约 90 行）+ `FlatField.dirtyConfigKeys` 字段 + `buildIndex` 中 `dirtyConfigKeys: new Set()` 初始化。三方向字面量 `nodeWins`/`byIdWins`/`fieldPreserve` 随函数删除。
    - 步骤 6b：删除 `patchFieldConf` / `getFieldById` / `getParentIdById` / `removeFieldFromIndex` 4 个死工具函数 + skip 机制（`_skipGroupRecalc` + `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`）+ `designer-canvas.ts` 中 `undo` / `redo` 死字段（接口定义 + initialState）。
    - **与 task 文档的差异**：
        1. **canvas-graph 注释清理无需改动**：task 文档 §6a 说"handleAlign 注释引用 dirtyConfigKeys + fieldPreserve + mergeByIdIntoTree"，但实际 L323-L329 已被 task-002 改写为单源语义注释，不含这些关键词。本步骤确认无需改动。
        2. **reducer import 清理无需改动**：task 文档 §6a 说 `designer-canvas.ts:3` import 含 `mergeByIdIntoTree` 需删除，但实际当前 import 已是 `import { buildIndex, ROOT_UNIQUE_ID, type FlatField }`（task-002 已清理）。本步骤确认无需改动。
        3. **patchFieldConf 内 dirtyConfigKeys 引用**：task 文档 §4.2 说"步骤 6a 后 grep dirtyConfigKeys 期望 0 命中"，但 patchFieldConf（死代码，6b 才删）内部有 `target.dirtyConfigKeys` 写入。按 6a → 6b 顺序执行时，6a 后 grep 会有 patchFieldConf 内的命中，6b 删 patchFieldConf 后才完全清零。本 task 按 6a → 6b 顺序执行，6b 完成后 grep `dirtyConfigKeys` 仅剩注释引用（task 文档 §4.2 明确"注释除外"）。
    - **浏览器冒烟验证**：代码层验证（tsc + grep）已通过。浏览器冒烟（拖动/改名/保存/saveAsTemp/postMessage/Ctrl+S/Delete）需用户在本地启动 `pnpm start` 后执行，本 task 无法自动完成。
- 2026-07-28：task 归档到 done/，roadmap 状态改为 done。
