# task-2026-07-24-012-4：vitest 纯函数 + reducer 单元测试

> 为 designerCanvas 状态管理建立测试基础设施，拦住 task-012-2 类连环 bug 的回归
>
> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-012-4`
> 上游任务：
> - [task-2026-07-24-012-2-manual-fix](./done/task-2026-07-24-012-2-manual-fix.md)（done，recalcGroupBounds 位置漂移修复）
> - [task-2026-07-24-012-3-verify-rename-preserve](./done/task-2026-07-24-012-3-verify-rename-preserve.md)（done，改名丢失已修验证）
>
> 状态：`done`（2026-07-28）
> 类型：`test`
>
> **⚠️ 本任务已被新任务替代**：原 plan 基于 `mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve` 等单源前架构机制（已被 task-2026-07-28-002/003 删除），实际不可执行。**测试目标由 [task-2026-07-29-001-vitest-unit-reducer-single-source](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接**（基于单源架构重写）。本任务状态标记为 `done` 以表达"目标已实现"，实际工作在新 task 中执行。
>
> **风险等级：低（仅新增测试文件，不改源码）**
>
> **设计依据**：`.trae/documents/design/designer-canvas/02-write-path.md`、`05-known-bugs.md`

---

## 1. 背景

### 1.1 为什么需要测试

task-012-1/012-2/012-3 连续修复了 3 个连环 bug，根因都是 `byId / components 双源同步` + `mergeByIdIntoTree` 合并方向问题。每次修复都靠人脑推演 + 浏览器冒烟，v1 修复甚至引入了新 bug（byId 与树长期不一致）。

这些 bug 的核心都是**纯函数 + reducer 层面**的问题，不需要浏览器环境就能测。补上单元测试后，后续 task-015（stale tree 防御）/ task-016（mutation 清理）的改动有了回归兜底。

### 1.2 测试范围

本 task 覆盖**第 1+2 层**（纯函数 + reducer）。第 3 层（集成不变量）由 [task-012-5](./task-2026-07-24-012-5-vitest-integration.md) 覆盖。

---

## 2. 目标

1. 建立 vitest 测试基础设施（config + 示例测试）
2. 覆盖 `mergeByIdIntoTree` 三种合并方向的所有分支
3. 覆盖 `designerCanvasReducer` 三个核心 action（`setComponents` / `setState` / `updateFieldConfig`）
4. 覆盖 `getGroupSizePosition` / `resetChildrenPosition` / `buildIndex` 纯函数
5. 所有测试 `pnpm vitest run` 通过

---

## 3. 详细测试用例

### 3.1 纯函数测试

#### `mergeByIdIntoTree`（[utils.ts L690-L749](src/designer/renderer/utils.ts#L690)）

**`nodeWins` 方向**：
- [ ] byId 为空 → 返回原树
- [ ] 节点不在 byId 中（新增节点）→ 保留树原样
- [ ] `flat.data === node.data`（引用相同）→ 不合并
- [ ] byId 有节点且 data 不同 → node.data 覆盖 flat.data（node 全赢）
- [ ] config 字段：node.config 覆盖 flat.config

**`byIdWins` 方向**：
- [ ] byId.data 覆盖 node.data（byId 全赢）
- [ ] config 字段：flat.config 覆盖 node.config
- [ ] 嵌套 children 递归合并

**`fieldPreserve` 方向**（task-012-1 核心）：
- [ ] 无 dirtyConfigKeys → node.data 覆盖 flat.data（等同 nodeWins）
- [ ] dirtyConfigKeys 含 `left` → config.left 取 byId 值，其他字段取 node 值
- [ ] dirtyConfigKeys 含 `title` → config.title 取 byId 值（**改名保留，task-012-3 验证的核心**）
- [ ] dirtyConfigKeys 含多个字段 → 每个字段都取 byId 值
- [ ] 嵌套 children 递归合并 + dirtyConfigKeys 隔离（每个节点独立）

#### `getGroupSizePosition`（[utils.ts L322-L395](src/designer/renderer/utils.ts#L322)）

- [ ] 单子组件 → bbox = 该组件的 top/left/width/height
- [ ] 多子组件 → top = min(top)，left = min(left)，width = max(right) - min(left)，height = max(bottom) - min(top)
- [ ] 空数组 → 返回 0/0/0/0

#### `resetChildrenPosition`（[utils.ts L397-L412](src/designer/renderer/utils.ts#L397)）

- [ ] 单子组件 → left/top 减去 groupPosition → 归零
- [ ] 多子组件 → 每个减去 groupPosition.left/top
- [ ] groupPosition 为 0 → 子组件位置不变

#### `buildIndex`（[utils.ts L765-L807](src/designer/renderer/utils.ts#L765)）

- [ ] 扁平树（无 children）→ byId 含所有节点，parentMap 正确
- [ ] 嵌套树（group 含 children）→ byId 含所有节点，parentMap 记录父子关系
- [ ] dirtyConfigKeys 初始化为空 Set
- [ ] drillDown 节点不进 byId（如果有此逻辑）

### 3.2 reducer 测试

#### `designerCanvas/setComponents`（[designer-canvas.ts L74-L88](src/store/modules/designer-canvas.ts#L74)）

- [ ] 整树替换 + buildIndex 重建 byId/parentMap
- [ ] **fieldPreserve 合并**：先 updateFieldConfig 改 left，再 setComponents → left 保留（byId 值），其他字段取新树值
- [ ] **改名保留**：先 updateFieldConfig 改 title，再 setComponents → title 保留
- [ ] 无 dirtyConfigKeys 时 → 纯整树替换

#### `designerCanvas/setState`（[designer-canvas.ts L90-L103](src/store/modules/designer-canvas.ts#L90)）

- [ ] payload 含 components → 同 setComponents 逻辑
- [ ] payload 不含 components → 只 Object.assign
- [ ] fieldPreserve 合并同 setComponents

#### `designerCanvas/updateFieldConfig`（[designer-canvas.ts L110-L138](src/store/modules/designer-canvas.ts#L110)）

- [ ] patch.config.left → byId[id].data.config.left 更新
- [ ] **dirtyConfigKeys 记录**：patch.config 含 left/top → dirtyConfigKeys 加入 left 和 top
- [ ] **dirtyConfigKeys 累积**：多次 updateFieldConfig → dirtyConfigKeys 累积不去重
- [ ] 组件已删除（byId 无此 id）→ 忽略，不报错
- [ ] components 树引用不变（性能：不触发 RecursionComponents 重渲染）

---

## 4. 实施步骤

### 步骤 1：确认 vitest 配置

- [ ] 确认 `vitest.config.ts` / `vitest.config.js` 是否存在
- [ ] 确认 `package.json` 的 `test` script 是否指向 vitest
- [ ] 确认 tsconfig 路径别名（`@Src/` / `@fedx-vis/*`）在 vitest 中可用
- [ ] 跑一个 `expect(1+1).toBe(2)` 的 smoke test 确认环境

### 步骤 2：创建测试文件

```
src/designer/renderer/__tests__/utils.spec.ts        # 纯函数测试
src/store/modules/__tests__/designer-canvas.spec.ts  # reducer 测试
```

### 步骤 3：实现测试用例

按 §3 的用例列表逐个实现。

### 步骤 4：跑测试

- [ ] `pnpm vitest run` 全部通过
- [ ] 无 console.error / console.warn

### 步骤 5：更新文档

- [ ] `05-known-bugs.md`：补充测试覆盖情况
- [ ] `AGENTS.md` §7：更新测试框架描述（Jest → vitest）

---

## 5. 验证清单

- [ ] `pnpm vitest run` 全部通过
- [ ] `mergeByIdIntoTree` 三方向全覆盖
- [ ] reducer 三 action 全覆盖
- [ ] 纯函数三函数全覆盖
- [ ] `pnpm tsc --noEmit` 零新增错误

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| vitest 路径别名不生效 | 中 | 测试无法 import `@Src/` | 用 vitest config 的 `resolve.alias` 配置 |
| Immer frozen 对象在测试中不可断言 | 低 | `expect(obj).toEqual(...)` 失败 | 用 `produce` 创建测试数据，或 `original(obj)` |
| reducer 测试需要构造大 state | 低 | 测试代码冗长 | 抽 `createTestState()` 工厂函数 |

### 回退

- 测试文件独立，删除即可回退
- 不改任何源码

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建。分析 task-012-1/012-2/012-3 连环 bug 后，确认根因是双源同步 + 合并方向问题，补测试能拦住回归。本 task 覆盖第 1+2 层（纯函数 + reducer），第 3 层（集成不变量）由 task-012-5 覆盖。
- **2026-07-28：状态变更 `planning` → `done`（被新任务替代）**。原因：原 plan 基于 `mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve` 等单源前架构机制，已被 task-2026-07-28-002/003 删除，无法按原计划执行。**测试目标由 [task-2026-07-29-001-vitest-unit-reducer-single-source](./task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接**（基于单源架构重写）。原计划文件保留作为历史参考。
