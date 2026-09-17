# task-2026-07-28-006：修复 Bug #1 — layout-block onResize 子组件不级联缩放

> 修复 known-bugs #24：调整 layout-block / group 尺寸时，内部子组件不跟随调整
>
> 计划日期：2026-07-28
> 任务编号：`task-2026-07-28-006`
> 状态：`planning`
> 类型：`bugfix`
> 来源：[05-known-bugs.md §1.4](../design/designer-canvas/05-known-bugs.md) / [2026-07-28-handoff §3.2](../2026-07-28-handoff-single-source-refactor.md)
>
> **风险等级：中（涉及 onResize 数据流切换，需验证渲染副作用）**

---

## 1. 背景

task-007（2026-07-21）引入 `useFieldConf` 字段级订阅 byId 后：

- [`designer-field/index.tsx:59`](../../src/designer/renderer/designer-field/index.tsx#L59) `dataSource = fieldById || propsDataSource`
- byId 是 **FlatField**（不含 children，见 [`hooks.ts`](../../src/store/designer/hooks.ts) `useFieldConf`）
- onResize 路径 [`getResizedComponents`](../../src/designer/renderer/designer-field/utils.ts#L151) → `syncGroupSize2Children(dataSource, newConfig)`
- `dataSource` 无 children → [`utils.ts:630`](../../src/designer/renderer/utils.ts#L630) `if (_.isArray(group.children))` 为 false → `resizeField` 不执行 → **子组件不缩放**

**与单源重构的关系**：正交。单源后 byId 仍是 FlatField，bug 不被自动修复；但 components 树永远 fresh，**修复更简单**——可直接从 `state.components` + `getFieldNodeById` 取带 children 的节点。

**影响范围**：layout-block 和 group 的 onResize 都受影响（`syncGroupSize2Children` 不区分类型）。

---

## 2. 目标

1. `getResizedComponents` 改为从 `state.components` + `getFieldNodeById` 取带 children 的节点
2. 浏览器冒烟：layout-block / group onResize 子组件级联缩放正常
3. 不影响其他渲染路径
4. 440 组件场景性能无回归

---

## 3. 详细步骤

### 步骤 1：定位代码

- [ ] Read `src/designer/renderer/designer-field/utils.ts` L151 附近 `getResizedComponents`
- [ ] Read `src/designer/renderer/designer-field/index.tsx` L59 附近 `dataSource` 来源
- [ ] Read `src/designer/renderer/utils.ts` L630 `syncGroupSize2Children` 实现
- [ ] Read `src/designer/renderer/utils.ts` `getFieldNodeById`（task-012-a 引入）
- [ ] Read `src/designer/DesignerContent.tsx` 中 `getResizedComponents` 调用方上下文，确认能取到 `state`

### 步骤 2：实现修复

**核心改动**（在 `getResizedComponents` 中）：

```ts
// 旧：从 dataSource 取（FlatField，无 children）
// const node = dataSource;

// 新：从 state.components + getFieldNodeById 取（带 children 的完整节点）
import { getFieldNodeById } from '@/designer/renderer/utils';
const node = getFieldNodeById(state.components, uniqueId);
```

**可选优化**：若 `getResizedComponents` 上下文取不到 state，可考虑：
- 把 state 作为参数传入（推荐，函数更纯）
- 或用 `useStore().getState().components`（次选，注意闭包陷阱）

### 步骤 3：浏览器冒烟

- [x] 启动 `pnpm start`
- [x] 拖入 layout-block + 多个子组件
- [x] 选中 layout-block，拖角 / 拖边调整尺寸 → 子组件跟随缩放
- [x] 同样验证 group onResize
- [x] 验证不修改尺寸时渲染无回归（对照修复前）

### 步骤 4：性能验证

- [~] 440 组件场景下，layout-block onResize 响应时间 < 200ms（用户本地冒烟通过，未做严格 Profiler 量化）
- [~] Profiler 检查 onResize 期间无异常 re-render 雪崩（同上）

---

## 4. 验证清单

- [x] `pnpm exec tsc --noEmit` 零新增错误（packages/* pre-existing 错误与本次无关，见 AGENTS.md §10.2）
- [~] `pnpm build`（用户指示跳过）
- [x] 浏览器冒烟：layout-block onResize 子组件级联缩放 ✓
- [x] 浏览器冒烟：group onResize 子组件级联缩放 ✓
- [x] 440 组件场景性能无回归（用户本地冒烟通过，未做严格 Profiler 量化）
- [x] 已知 bug #24 从 05-known-bugs.md §1.4 标记为已修 + §3.1 增加条目
- [x] 任务文件移到 `plans/done/`
- [x] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| `getResizedComponents` 上下文取不到 `state.components` | 中 | 需重构函数签名 | 把 state 作为参数传入 |
| `getFieldNodeById` 返回值与原 dataSource 结构差异 | 低 | 后续链路崩溃 | 对照原 dataSource 结构验证；加 assertion |
| onResize 路径有其他隐式依赖 dataSource | 中 | 修复后其他功能异常 | 完整冒烟（拖拽、选中、配置面板） |
| `getFieldNodeById` 在大树下性能 | 低 | 440 组件场景掉帧 | 性能验证；必要时改为缓存 |

### 回退

- 单 commit 改动，`git revert <commit>` 回退
- 涉及文件少，回退成本低

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：任务创建。承接 handoff §3.2 P1 #2 / known-bugs #24。单源重构完成后 components 树永远 fresh，可简化修复。
- 2026-07-28：实施完成。
  - **三验证**：`getResizedComponents`（utils.ts:151）调用方在 [index.tsx:253](../../src/designer/renderer/designer-field/index.tsx#L253)，传入 `state = getDesignerState() = { components }`，`state.components` 可用；`getFieldNodeById`（utils.ts:141）签名 `(components, uniqueId) => node|null`，递归 node.children，返回带 children 的完整节点；`syncGroupSize2Children`（utils.ts:598）依赖 `group.children`（utils.ts:630）才能递归 `resizeField`。
  - **改动**（单文件 `src/designer/renderer/designer-field/utils.ts`）：
    1. import 增加 `getFieldNodeById`
    2. `getResizedComponents` 中新增 `const groupNode = getFieldNodeById(state.components, dataSource.uniqueId) || dataSource;`，把 `syncGroupSize2Children(dataSource, newConfig)` 改为 `syncGroupSize2Children(groupNode, newConfig)`
  - **兜底逻辑**：`|| dataSource` 防止 `getFieldNodeById` 返回 null（理论上不会发生，state.components 永远包含当前节点）。
  - **tsc**：`pnpm exec tsc --noEmit` 仅 `packages/ui` / `packages/share` pre-existing 错误（AGENTS.md §10.2 不修），`src/` 零新增错误。
  - **build/浏览器冒烟/性能验证**：用户指示跳过 build；浏览器冒烟（layout-block / group onResize 子组件级联缩放 + 不调整尺寸时渲染无回归）由用户本地执行通过；440 组件场景性能无回归（用户本地冒烟通过，未做严格 Profiler 量化）。
  - **文档同步**：05-known-bugs.md 表格 #24 状态改为 🟢 已修；§1.4 标题加 🟢 已修标记 + 修复说明；§3.1 已修索引增加条目。
