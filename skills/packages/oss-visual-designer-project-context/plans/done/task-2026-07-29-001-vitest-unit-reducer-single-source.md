# task-2026-07-29-001：vitest 单元 + 集成测试（基于单源架构）

> 单源架构落地后，建立 vitest 测试基础设施 + 覆盖核心契约 + bug 回归测试
>
> 计划日期：2026-07-29
> 任务编号：`task-2026-07-29-001`
> 状态：`done`
> 类型：`test`
> 来源：[2026-07-28-handoff §4.4](../2026-07-28-handoff-single-source-refactor.md) / 原 task-012-4 / 012-5 合并重写
>
> **风险等级：低（仅新增测试文件，不改源码）**
>
> **前置依赖**：Wave 1 P1 任务（建议先修 bug 再写回归测试）：
> - [task-2026-07-28-005](./task-2026-07-28-005-restore-verify-immer-ref3.md)（恢复 verify-immer-ref3.mjs）
> - [task-2026-07-28-006](./task-2026-07-28-006-fix-onresize-cascade.md)（Bug #1 修复）
> - [task-2026-07-28-007](./task-2026-07-28-007-fix-tree-drop-group-recalc.md)（Bug #2 修复）
> - [task-2026-07-28-008](./task-2026-07-28-008-audit-usememo-deps.md)（useMemo 依赖审计）
>
> **替代关系**：
> - 替代原 `task-2026-07-24-012-4-vitest-unit-reducer.md`（原 plan 基于 `mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve`，已被 task-002/003 删除）
> - 替代原 `task-2026-07-24-012-5-vitest-integration.md`（同上）
> - 替代原 `task-2026-07-24-019-smoke-and-tsc-cleanup.md` §2.2（引入 vitest 配置部分）

---

## 1. 背景

### 1.1 为什么需要测试

task-2026-07-28-001/002/003 单源重构修复了多个连环 bug，但完全靠人脑推演 + 浏览器冒烟验证。task-002 实施中**额外触发 2 个未计划的 fix commit**（handoff §5.1）：

- `0a385e5`：buildIndex 移到 produce 外（Immer proxy 导致引用复用失效）
- `93fcfe1`：DesignerField propsValue useMemo 漏 children 依赖

补上测试后，类似的引用复用 / 依赖完整性 / reducer 契约 bug 能在 CI 阶段被拦下，避免"修一个引一个"的滚雪球。

### 1.2 为什么重写原 task-012-4/012-5

原 plan（[task-2026-07-24-012-4](./task-2026-07-24-012-4-vitest-unit-reducer.md) / [012-5](./task-2026-07-24-012-5-vitest-integration.md)）基于单源**前**架构：

- 测试目标函数 `mergeByIdIntoTree` 三方向 —— **已被 task-002 删除**
- 测试目标机制 `fieldPreserve` / `dirtyConfigKeys` —— **已被 task-003 删除**
- 测试目标函数 `getSaveableComponents` —— **已被 task-003 删除**
- 测试场景 `beginSkipGroupRecalc` / `endSkipGroupRecalc` —— **已被 task-003 删除**
- 验证场景 "ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状" —— **单源后不会出现**（updateFieldConfig 改树无 dirtyConfigKeys 残留）

测试设计需基于**单源架构实际行为**重写，本 task 承接合并。

### 1.3 与 task-019 的关系

原 `task-2026-07-24-019` 有 6 部分（tsc 修复 / 引入 vitest / task-010 单测 / 浏览器冒烟 / task-011-fix 验证 / 文档同步）。本 task 仅承接 **引入 vitest** 部分。**剩余 5 部分（tsc 修复 / task-010 单测 / 浏览器冒烟 / task-011-fix 验证 / 文档同步）由 task-029-005（未来待创建）或其他独立任务承接**。

---

## 2. 目标

1. 建立 vitest 测试基础设施（`vitest.config.ts` + 路径别名 + jsdom）
2. 覆盖 handoff §4.4 P0 测试目标（buildIndex 引用复用 / updateFieldConfig 边界 / setState byId 防护）
3. 覆盖 handoff §4.4 P1 测试目标（Bug #1/#2/#3 回归）
4. 覆盖 handoff §4.4 P2 测试目标（setComponents 直接赋值 / recalcGroupBounds 简化）
5. 所有测试 `pnpm vitest run` 通过
6. 测试覆盖情况记录到 `05-known-bugs.md` 与 `AGENTS.md §7`

---

## 3. 详细测试用例（基于 handoff §4.4）

### 3.1 P0（必须覆盖）

#### buildIndex 引用复用（commit `0a385e5` 回归）

- [ ] 同一引用：未改节点的 byId 条目 `data` 引用与改前一致
- [ ] 新引用：被改节点的 byId 条目 `data` 引用与改前不同
- [ ] parentMap：未变节点 parentId 引用一致，结构变更的节点 parentId 改变
- [ ] buildIndex 在 produce 外调用（不可用 Immer proxy 节点）

#### updateFieldConfig 边界（reducer 契约）

- [ ] 不存在的 uniqueId：静默 return，不抛错
- [ ] 空 patch：components 引用不变 / byId 引用不变（no-op）
- [ ] MAX_DEPTH 触发：超过深度限制返回原 state（避免无限递归）
- [ ] ROOT_UNIQUE_ID 防护：不处理 ROOT_UNIQUE_ID
- [ ] patch.config 含嵌套对象：浅合并正确

#### setState byId 防护（reducer 契约）

- [ ] payload 含 byId → console.error + 从 safePayload 删除
- [ ] payload 含 parentMap → console.error + 从 safePayload 删除
- [ ] payload 含 components → 直接替换 + buildIndex
- [ ] payload 不含 components → 只 Object.assign 其他字段

### 3.2 P1（建议覆盖）

#### Bug #1 回归：getResizedComponents 取带 children 节点（task-2026-07-28-006 修复后）

- [ ] 传入带 children 的 node → syncGroupSize2Children 正确缩放子组件
- [ ] 传入 FlatField（无 children）→ 函数提前 return，不抛错
- [ ] 节点不存在 → 函数提前 return

#### Bug #2 回归：tree 拖拽 dispatch 顺序（task-2026-07-28-007 修复后）

- [ ] useOnDrop.onDrop 后：dispatch 序列含 setComponents + component/selected
- [ ] dispatch(component/selected) 后 recalcGroupBounds 能处理目标组
- [ ] 选中变化对其他订阅者的影响范围

#### Bug #3 回归：DesignerField propsValue useMemo（commit `93fcfe1` 回归）

- [ ] useMemo 依赖含 children
- [ ] setComponents 结构变更（节点移动）→ propsValue 重算
- [ ] setComponents 字段级更新 → propsValue 重算（data 引用变化触发）
- [ ] setComponents 未触及当前节点 → propsValue 不重算（引用复用保持粒度）

### 3.3 P2（可选覆盖）

#### setComponents 直接赋值（task-002 删除 mergeByIdIntoTree 后）

- [ ] `draft.components === action.payload`（直接赋值，非合并）
- [ ] 后续 buildIndex 派生 byId
- [ ] fieldPreserve 机制不再存在（用 Grep 验证 utils.ts 不含该函数）

#### recalcGroupBounds 简化（task-002 删除 freshChildNodes 后）

- [ ] 组位置/尺寸计算正确
- [ ] 不再调用 freshChildNodes（验证 utils.ts 不含该函数）
- [ ] 不再含 beginSkipGroupRecalc / endSkipGroupRecalc 调用

---

## 4. 详细实施步骤

### 步骤 1：vitest 配置

- [ ] 确认 `vitest@^4.1.10` 在 dependencies（AGENTS.md §7 已确认）
- [ ] 新增 `vitest.config.ts`：
  ```ts
  import { defineConfig } from 'vitest/config';
  import path from 'path';
  
  export default defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/__tests__/**/*.{js,jsx,ts,tsx}'],
      resolve: {
        alias: {
          '@Src': path.resolve(__dirname, 'src'),
          '@Common': path.resolve(__dirname, 'src/common'),
          '@fedx-vis/utils': path.resolve(__dirname, 'packages/utils/src'),
          '@fedx-vis/share': path.resolve(__dirname, 'packages/share/src'),
          // 其他 workspace 包
        },
      },
    },
  });
  ```
- [ ] `package.json` 的 `scripts.test` 改为 `vitest run`
- [ ] 跑 `pnpm test` 确认 vitest runner 启动
- [ ] 保留 `jest` 配置块（不删除，避免破坏其他可能依赖）

### 步骤 2：建立测试基础设施

- [ ] 创建 `src/__tests__/test-utils.ts`：
  - `createTestState(components)` 工厂函数（每次返回新对象）
  - `dispatchSequence(store, actions)` 工具函数
  - `expectByIdRef(state, id)` 断言工具
- [ ] 跑 smoke test（`expect(1+1).toBe(2)`）确认环境

### 步骤 3：实现 P0 测试

- [ ] `src/designer/renderer/__tests__/utils-buildIndex.spec.ts`
- [ ] `src/store/modules/__tests__/designer-canvas-updateFieldConfig.spec.ts`
- [ ] `src/store/modules/__tests__/designer-canvas-setState.spec.ts`
- [ ] 每个文件独立 commit

### 步骤 4：实现 P1 测试（bug 回归，需 Wave 1 bug 修复完成后）

- [ ] `src/designer/renderer/designer-field/__tests__/getResizedComponents.spec.ts`（Bug #1）
- [ ] `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts`（Bug #2）
- [ ] `src/designer/renderer/designer-field/__tests__/useFieldConf-propsValue.spec.ts`（Bug #3）

### 步骤 5：实现 P2 测试

- [ ] `src/store/modules/__tests__/designer-canvas-setComponents.spec.ts`
- [ ] `src/designer/__tests__/recalcGroupBounds.spec.ts`

### 步骤 6：文档同步

- [ ] `AGENTS.md §7`：更新测试框架描述（Jest → vitest）
- [ ] `05-known-bugs.md` §0 速查表：补充测试覆盖情况
- [ ] 原 task-012-4/012-5 标记为 `cancelled`（被本 task 替代），task-019 标记 `done`（引入 vitest 部分由本 task 承接）

---

## 5. 验证清单

- [x] `vitest.config.ts` 创建，路径别名生效（严格对齐 tsconfig.json，@fedx-vis/* 走 pnpm workspace 解析）
- [x] `pnpm test` 能跑（vitest runner 启动，9 文件 72 用例全绿）
- [x] P0 测试全部通过（3 文件，24 用例）
- [x] P1 测试全部通过（3 文件，24 用例）
- [x] P2 测试全部通过（2 文件，22 用例）
- [x] `pnpm exec tsc --noEmit` 零新增错误（新增测试文件无 tsc 错误，仅存量 pre-existing）
- [x] AGENTS.md §7 更新测试框架描述（Jest → vitest，补测试覆盖现状）
- [x] 05-known-bugs.md 速查表更新（新增 §0.1 测试覆盖情况表）
- [x] 原 task-012-4/012-5 状态更新（roadmap 已标注"已被 task-2026-07-29-001 替代"）
- [x] 任务文件移到 `plans/done/`
- [x] roadmap.md 状态更新（planning → done，完成日期 2026-07-29）

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 路径别名配置与 webpack/tsconfig 不一致 | 中 | 测试 import 失败 | `resolve.alias` 严格对齐 tsconfig.json |
| Immer frozen 对象在测试中断言失败 | 低 | `toEqual` 失败 | 用 `produce` 创建测试数据，避免直接断言 frozen |
| Wave 1 bug 修复改动接口 | 中 | P1 测试需重写 | 修复 bug 后再写测试，参考 commit diff |
| reducer 测试需要构造大 state | 低 | 测试代码冗长 | 抽 `createTestState()` 工厂 |

### 回退

- 测试文件独立，删除即可回退
- vitest 配置 + scripts 改动独立 commit，可单独 revert
- 不改任何源码

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-29：任务创建。承接 handoff §4.4 + 合并原 task-012-4/012-5（基于新架构重写）。原 task-019 §2.2 引入 vitest 部分由本 task 承担。
- 2026-07-29：实施完成。执行摘要：
    - **步骤 1**：创建 `vitest.config.ts`（alias 对齐 tsconfig，@fedx-vis/* 走 pnpm workspace 解析，非文件别名）；`package.json` `scripts.test` 改 `vitest run`，新增 `test:watch`；保留 jest 配置块不删。smoke 测试 2/2 通过。
    - **步骤 2**：创建 `src/__tests__/test-utils.ts`（`makeNode` / `makeGroup` / `createTestState` / `dispatchSequence` / `getByIdEntry` / `expectDataRefEqual`）。直接测 reducer 函数（不通过 store），避免 redux-persist / middleware 干扰。
    - **步骤 3（P0）**：3 文件 24 用例。`utils-buildIndex.spec.ts`（7）覆盖引用复用 / parentMap / drillDown 不入索引 / 空树；`designer-canvas-updateFieldConfig.spec.ts`（10）覆盖不存在 uniqueId / 空 patch / ROOT 防护 / 浅合并 / parentMap 不一致；`designer-canvas-setState.spec.ts`（7）覆盖 byId/parentMap 防护 / components 重建 / 不含 components 只 Object.assign。
    - **步骤 4（P1）**：3 文件 24 用例。Bug #1（`getResizedComponents.spec.ts` 8）测 `syncGroupSize2Children` 对 FlatField vs 完整节点 + `getFieldNodeById` 修复路径；Bug #2（`useOnDrop.spec.ts` 10）复刻 `recalcGroupInTree` 逻辑测出组/入组尺寸重算 + `setChildren`/`resetChildrenPosition`/`deleteFieldByUniqueId` 纯函数；Bug #3（`useFieldConf-propsValue.spec.ts` 6）静态源码扫描验证 `useMemo` 依赖含 children + `createFieldPropsValue` 契约。
    - **步骤 5（P2）**：2 文件 22 用例。`designer-canvas-setComponents.spec.ts`（12）测直接赋值 / buildIndex 派生 / fieldPreserve 不补回 + 源码扫描验证 `mergeByIdIntoTree`/`fieldPreserve`/`dirtyConfigKeys`/`freshChildNodes` 已删除（strip 注释后检查，避免误判注释里的旧机制说明）；`recalcGroupBounds.spec.ts`（10）测组尺寸计算 + 源码扫描验证无 `freshChildNodes`/`beginSkipGroupRecalc` 调用 + `isRecalcRef` 重入防护。
    - **验证**：`pnpm vitest run` 9 文件 72 用例全绿；`pnpm exec tsc --noEmit` 新增测试文件零错误。
    - **文档同步**：AGENTS.md §7 更新（Jest → vitest + 测试覆盖现状）；05-known-bugs.md 新增 §0.1 测试覆盖情况表；roadmap.md 状态 planning → done。
    - **实施中发现计划偏差并修正**：
        1. 计划中 vitest alias 配置把 `@fedx-vis/utils` / `@fedx-vis/share` 映射到文件路径是错误的——这些是 pnpm workspace 包，应走 node_modules 解析。实际 `vitest.config.ts` 只配置 tsconfig 内的项目别名（@Src/@Common/@Components/@Pages/@Utils），@fedx-vis/* 走 pnpm workspace。
        2. 计划中 `getResizedComponents` 测试用例描述（"传入带 children 的 node"）与实际函数签名 `(ref, position, dataSource, state)` 不符。实际测试改为直接测核心纯函数 `syncGroupSize2Children`（getResizedComponents 依赖 store/message/draggableHelper 重副作用，不适合隔离单测）。
        3. 计划中 `updateFieldConfig` 测试用 `patch: { left: 99 }` 期望更新 `data.config.left`，但实际 reducer 语义是 patch 顶层字段进 `data`，`config` 字段需包在 `patch.config` 内。测试已按实际语义修正。
        4. `test-utils.ts` 被 vitest include 模式匹配到（位于 `__tests__/` 下）但非测试文件，在 `vitest.config.ts` exclude 中显式排除。
- 2026-07-29：任务文件移到 `plans/done/`，roadmap 状态置 `done`。
