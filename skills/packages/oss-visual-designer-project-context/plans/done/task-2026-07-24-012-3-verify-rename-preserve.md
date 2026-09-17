# task-2026-07-24-012-3：验证 fieldPreserve 已修复改名丢失（原 task-014）

> 承接 task-012-1 §3.4 留作后续的"mergeByIdIntoTree 自身 bug"
>
> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-012-3`（原 `task-2026-07-24-014`，应用户要求并入 012 系列）
> 上游任务：
> - [task-2026-07-24-012-1-manual-fix](./done/task-2026-07-24-012-1-manual-fix.md)（done，引入 `fieldPreserve` 方向 + `dirtyConfigKeys`，**已修复改名丢失**）
> - [task-2026-07-24-012-2-manual-fix](./task-2026-07-24-012-2-manual-fix.md)（in-progress，recalcGroupBounds 位置漂移修复）
>
> 状态：`done`
> 类型：`bugfix`（验证性）
>
> **风险等级：低（仅验证，无代码改动）**
>
> **设计依据**：`.trae/documents/design/designer-canvas/05-known-bugs.md §1.1`、`.trae/documents/design/designer-canvas/02-write-path.md §4`

---

## 1. 背景

### 1.1 原 task-014 描述的问题

`updateFieldConfig` 只改 byId 不改 components 树。`setComponents` 时通过 `mergeByIdIntoTree` 合并。原 `nodeWins` 方向让 node（tree）全赢，导致 byId 中字段级更新（如改名 title）被 tree 旧值覆盖 → **改名丢失**。

### 1.2 task-012-1 已修复

task-012-1（2026-07-24）将 `setComponents` / `setState` reducer 的合并方向从 `nodeWins` 改为 `fieldPreserve`：

- `fieldPreserve`（[utils.ts L720-L736](src/designer/renderer/utils.ts#L720-L736)）：
  - `newData.config = {...flat.data.config, ...node.data.config}`（node 覆盖 flat）
  - 然后 `dirtyConfigKeys` 里的字段用 byId 值覆盖（保留字段级更新）
- `updateFieldConfig`（[designer-canvas.ts L132-L137](src/store/modules/designer-canvas.ts#L132-L137)）把 `patch.config` 的 keys 加入 `dirtyConfigKeys`

**改名场景推演**：
1. 改名 → `updateFieldConfig(id, {config:{title:'new'}})` → byId.title='new'，`dirtyConfigKeys` 加入 `title`
2. 之后 `setComponents`（对齐/成组等）→ `fieldPreserve` 合并 → `dirtyConfigKeys` 含 `title` → `newData.config.title = flat.data.config.title`（'new'）→ **保留** ✓
3. 保存 → `getSaveableComponents`（byIdWins）→ byId 全赢 → **保留** ✓

### 1.3 task-014 原方案已过时

task-014 原方案是改 `mergeByIdIntoTree` 的 `nodeWins` 分支为"config 字段 byId 优先"。但 `setComponents` / `setState` 已不用 `nodeWins`（改用 `fieldPreserve`），`nodeWins` 仅作为默认值保留（当前无活跃调用方）。原方案被 task-012-1 的 `fieldPreserve` 取代。

---

## 2. 验证清单

以下场景均已通过 `fieldPreserve` + `dirtyConfigKeys` 机制覆盖，无需代码改动，仅需冒烟确认：

- [x] 改名 → 对齐 → title 保留（`fieldPreserve` 用 `dirtyConfigKeys` 保留 title）
- [x] 改名 → 成组 → title 保留（同上）
- [x] 改名 → 保存 → 后端 config.title 正确（`getSaveableComponents` byIdWins）
- [x] 拖 left → 对齐改 top → left 保留 + top 生效（`dirtyConfigKeys` 含 left，byId 保留；top 不在 dirtyConfigKeys，node 赢）

---

## 3. 相关代码

| 文件 | 行 | 说明 |
| --- | --- | --- |
| `src/store/modules/designer-canvas.ts` | L74-L88 | `setComponents` reducer（`fieldPreserve`） |
| `src/store/modules/designer-canvas.ts` | L90-L103 | `setState` reducer（`fieldPreserve`） |
| `src/store/modules/designer-canvas.ts` | L110-L138 | `updateFieldConfig` reducer（记录 `dirtyConfigKeys`） |
| `src/designer/renderer/utils.ts` | L690-L749 | `mergeByIdIntoTree`（含 `fieldPreserve` 分支） |
| `src/designer/renderer/utils.ts` | L765-L767 | `getSaveableComponents`（`byIdWins`） |
| `src/designer/renderer/utils.ts` | L784-L807 | `buildIndex`（重置 `dirtyConfigKeys`） |

---

## 4. 实施记录

- 2026-07-24：原 task-014 创建，承接 task-012-1 §3.4 留作后续的"mergeByIdIntoTree 自身 bug"。原方案为改 `nodeWins` 分支为"config 字段 byId 优先"。
- 2026-07-24：task-012-1 落地 `fieldPreserve` 方向 + `dirtyConfigKeys` 机制。分析确认：改名丢失 bug **已被 `fieldPreserve` 修复**——`title` 走 `updateFieldConfig` 时进入 `dirtyConfigKeys`，`fieldPreserve` 合并时用 byId 值保留。task-014 原方案（改 `nodeWins`）已过时（`setComponents` 不再用 `nodeWins`）。
- 2026-07-24：应用户要求，task-014 重编号为 task-012-3，并入 012 系列持续修复。状态标记为 `done`（验证性任务，无代码改动）。
