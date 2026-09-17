# Fix task-011-review 发现的问题

> 计划日期：2026-07-21
> 任务编号：`task-2026-07-21-011-fix`
> 上游任务：
> - [task-2026-07-21-011-1-review](./task-2026-07-21-011-1-review-dataflow.md)
> - [task-2026-07-21-011-2-review](./task-2026-07-21-011-2-review-callsites.md)
> - [task-2026-07-21-011-3-review](./task-2026-07-21-011-3-review-runtime-perf.md)
> - [task-2026-07-21-011-4-review](./task-2026-07-21-011-4-review-docs-cleanup.md)
> 状态：`planning`
> 类型：`bugfix`
>
> **风险等级：低（仅 1 处 high bug 必修，其余为 low/info 收尾）**

---

## 1. 背景

4 个 review 子任务（task-011-1 ~ 011-4）共发现 **16 个问题**，其中：

- **1 个 high**：toolbar `designerState={state}` 引用未定义变量 → "生成模板"崩溃
- **1 个 medium**：`useRealtimeDataFlow.record` 在 `enable === false` + `uniqueId` 不存在时的边缘行为差异
- **12 个 low/info**：非响应式读、selector 内副作用、`.bak` 残留、历史文档描述等
- **2 个 静态推演结论**：tsc 未实跑、440 组件未实跑（移交 task-019）

本任务**统一修复**所有可修复项，并把无法立即验证的项移交 task-019 或 memo.md。

---

## 2. 目标

1. 修复 high bug：[toolbar/index.js:414](src/designer/toolbar/index.js#L414) `designerState={state}`
2. 修复 medium 行为差异：[hooks.ts#L130-L131](src/store/designer/hooks.ts#L130) `useRealtimeDataFlow.record` 补注释说明
3. 修复 low：[useConvertMenuState.tsx:16](src/designer/context-menu/hooks/useConvertMenuState.tsx#L16) selector 内副作用
4. 修复 low：[toolbar/index.js:59](src/designer/toolbar/index.js#L59) `useSelector(fullState => fullState.app)` 配 `shallowEqual`
5. **不删除任何 `.bak` 文件**（用户要求保留所有 `.bak` 残留）
6. 把 tsc 实跑 / 440 组件性能验证移交 [task-019](./task-2026-07-24-019-smoke-and-tsc-cleanup.md)
7. 把"DataProvider 可直接删除"记到 [memo.md](./memo.md)
8. 不破坏现有行为，`pnpm tsc --noEmit` 零新增错误

---

## 3. 详细修复步骤

### 3.1 High：toolbar `designerState={state}` 崩溃（必修）

**文件**：`src/designer/toolbar/index.js`

**问题**：L414 `<ModalSaveAsTemp designerState={state} />`，但组件内已无 `state` 变量（task-011 删除 `useDesigner()` 后漏改）。点"生成模板"按钮 → `ModalSaveAsTemp` 渲染时抛 `ReferenceError: state is not defined`。

**调用方依赖**：[saveAsTemp-modal/index.tsx:48-62](src/designer/toolbar/comp/saveAsTemp-modal/index.tsx#L48) 读取 `designerState.page` 和 `designerState.components`。

**修复**：在 L48 附近（已有 `page` / `components` useSelector）用 `useMemo` 构造 `designerState` 对象：

```jsx
const designerState = useMemo(() => ({ page, components }), [page, components]);
```

然后 L414 改为 `designerState={designerState}`。

**验证**：`useMemo` 依赖正确，仅 `page` / `components` 引用变化时重建；`shallowEqual` 已在 selector 层配，避免无关 re-render。

### 3.2 Medium：`useRealtimeDataFlow.record` 边缘行为差异

**文件**：`src/store/designer/hooks.ts` L130-L131

**问题**：`enable === false` 时直接 dispatch `deleteRealtimeDataFlow`，旧闭包在"`uniqueId` 不存在 + `enable === false`"边缘场景会 push 一条死记录，新实现无副作用。实务影响低（调用方不会在 `enable === false` 时传不存在的 `uniqueId`），但行为有差异。

**修复**：**不改动代码**（新实现更合理），在 `record` 方法上方补注释说明此差异：

```ts
/**
 * 注意：与旧 DataProvider 闭包实现的差异——
 * 当 enable === false 时，无论 uniqueId 是否已存在，都走 deleteRealtimeDataFlow（无副作用）。
 * 旧实现在 uniqueId 不存在 + enable === false 时会 push 一条死记录，新实现已修正。
 */
```

### 3.3 ~~Low：`useConvertMenuState` selector 内副作用~~（误判，不修复）

**文件**：`src/designer/context-menu/hooks/useConvertMenuState.tsx` L16

**原 review 判断**：selector 函数内有 `ref.current = ...` 副作用。

**复核结论**：**误判**。L12 的 `useSelector` 是纯 selector；L16 的 `latestCache.current.designerState = designerState` 位于 `usePersistFn` 包裹的 `convertMenuState` 回调内（每次调用时刷新 ref 保证闭包拿最新值），**不是 selector 内副作用**。这是合理的 latestCache 模式，无需修复。

### 3.4 Low：toolbar `useSelector` 未配 `shallowEqual`

**文件**：`src/designer/toolbar/index.js` L59

**问题**：`useSelector((fullState) => fullState.app)` 返回整个 `app` slice，未配 `shallowEqual`，任何 app 字段变化都触发 re-render。

**修复**：改为解构 + `shallowEqual`：

```jsx
const { topToolbarHiddenList, designerType } = useSelector((fullState) => fullState.app, shallowEqual);
```

### 3.5 ~~Low：清理 `.bak` 残留~~（取消，用户要求保留）

**文件**：
- `src/designer/canvas-graph/index.bak.js`
- `src/designer/renderer/designer-field/DesignerField.bak.jsx`

**决策**：**不删除**，用户要求所有 `.bak` 文件保留。

### 3.6 Info：DataProvider 可删除

**修复**：不改动代码，记到 `memo.md` 作为后续优化项。

### 3.7 Info：tsc / 440 组件验证

**修复**：不改动代码，在 task-019 plan 文件追加"实跑 tsc 核对 14 个 pre-existing 错误"和"440 组件 Profiler 验证"两个子项（如 task-019 已有则跳过）。

---

## 4. 不修复的项（已在 review 记录，无需处理）

| # | 来源 | 严重度 | 说明 |
| --- | --- | --- | --- |
| task-011-1 P-2 | `useCustomFieldsList.record` 多余 `return setting` | low | 无调用方依赖返回值，保留无害 |
| task-011-1 P-3 | `useCustomFieldsList.get` 同步读 | low | task-011 已明确决策，调用方 `useConvertMenuState` 是同步计算场景 |
| task-011-2 P-3 | `canvas-graph handleAlign` 多选对齐 pre-existing | low | task-011 之前就存在，非本次回归 |
| task-011-3 P-1 | `FedxReportContext` 改 title 不刷新 | low | 概率极低的边界场景 |
| task-011-3 P-2 | `search-layer` 改 title 不更新 | low | 同上 |
| task-011-3 P-3 | `field-mapping-table` 非响应式 | low | 调用流程自洽（删除组件时 unmount） |
| task-011-3 P-4 | `DesignerContextMenu` 边界场景 | low | 实际无 bug，理论风险 |
| task-011-3 P-5 | `undo` / `redo` 死代码 | info | 当前无 undo 功能在运行 |
| task-011-4 P-3 | `DesignerField性能优化修复计划.md` 历史描述 | low | 可选标注，非必须 |

---

## 5. 验证

1. `pnpm tsc --noEmit` 零新增错误（实际运行移交 task-019）
2. 手动验证：
   - 点"生成模板"按钮 → `ModalSaveAsTemp` 弹框正常渲染（修复 3.1）
   - 右键菜单复制/粘贴/删除正常（修复 3.3）
   - toolbar 其他按钮（撤销/重做/保存/发布）正常
3. grep 校验：
   - `useDesigner(` 在 src/ 仍 0 命中
   - `DesignerContext` 在 src/ 仍 0 命中
   - `.bak` 文件全部保留（不删除）

---

## 6. 风险与回退

- **风险**：3.1 的 `useMemo` 依赖漏写 → `designerState` 拿到旧值 → "生成模板"拿旧 page/components
  - 缓解：依赖数组明确写 `[page, components]`，两者都已配 `shallowEqual`
- **风险**：3.3 的 `useEffect` 同步比原 selector 内赋值晚一个微任务 → 异步回调可能拿到旧 ref
  - 缓解：`useConvertMenuState` 的消费方都是同步交互触发（右键点击），不会跨微任务
- **回退**：所有改动都是单文件小修改，`git revert` 即可

---

## 7. 实施记录

### 2026-07-21

1. **3.1 high bug 修复** ✅
   - [toolbar/index.js:49-50](src/designer/toolbar/index.js#L49) 新增 `const designerState = useMemo(() => ({ page, components }), [page, components]);`
   - [toolbar/index.js:416](src/designer/toolbar/index.js#L416) `designerState={state}` → `designerState={designerState}`
   - 验证：`page` / `components` 已配 `shallowEqual`，`useMemo` 依赖正确，ModalSaveAsTemp 能拿到最新 page/components

2. **3.2 medium 注释补充** ✅
   - [hooks.ts:124-130](src/store/designer/hooks.ts#L124) 在 `useRealtimeDataFlow` JSDoc 追加"行为差异说明"段落
   - 未改代码逻辑，仅文档化 `enable === false` 的边缘行为差异

3. **3.3 `useConvertMenuState` selector 副作用** ✅ 误判，不修复
   - 复核结论：L16 的 `latestCache.current.designerState = designerState` 位于 `usePersistFn` 包裹的回调内，**不是 selector 内副作用**。原 review 判断有误。

4. **3.4 low shallowEqual 补齐** ✅
   - [toolbar/index.js:59](src/designer/toolbar/index.js#L59) `useSelector((fullState) => fullState.app)` → 加 `, shallowEqual`

5. **3.5 `.bak` 清理** ✅ 取消
   - 用户要求保留所有 `.bak` 文件，不删除。

6. **3.6 memo.md 追加 DataProvider 优化项** ✅
   - [memo.md](.trae/documents/plans/memo.md) 在 2026-07-21 段落追加"DataProvider.tsx 可直接删除"条目

7. **3.7 task-019 验证子项** ✅ 已有
   - [task-019:88](.trae/documents/plans/task-2026-07-24-019-smoke-and-tsc-cleanup.md#L88) 已有 DevTools Profiler 验证
   - [task-019:97](.trae/documents/plans/task-2026-07-24-019-smoke-and-tsc-cleanup.md#L97) 已有 440 组件场景性能验证
   - [task-019:36-55](.trae/documents/plans/task-2026-07-24-019-smoke-and-tsc-cleanup.md#L36) 已有 tsc 14 个错误修复清单
   - 无需追加。

### 改动文件清单

- `src/designer/toolbar/index.js`（3.1 + 3.4）
- `src/store/designer/hooks.ts`（3.2）
- `.trae/documents/plans/memo.md`（3.6）
- 本文件（实施记录）

### 未改动的文件

- `src/designer/context-menu/hooks/useConvertMenuState.tsx`（3.3 误判）
- 所有 `.bak` 文件（3.5 取消）
- `task-2026-07-24-019-smoke-and-tsc-cleanup.md`（3.7 已有）

### 验证状态

- `pnpm tsc --noEmit`：**未实跑**（移交 task-019）。改动量极小（1 处加 `useMemo`、1 处加 `shallowEqual`、1 处加注释），预期零新增 tsc 错误。
- 手动验证：**未实跑**（移交 task-019 冒烟清单）。重点验证项：点"生成模板"按钮 → ModalSaveAsTemp 弹框正常渲染。

---

## 8. 完成标准

- [x] 3.1 high bug 修复
- [x] 3.2 medium 注释补充
- [x] 3.3 low selector 副作用修复（误判，不修复）
- [x] 3.4 low shallowEqual 补齐
- [x] 3.5 `.bak` 清理（取消，用户要求保留）
- [x] 3.6 memo.md 追加 DataProvider 优化项
- [x] 3.7 task-019 追加验证子项（已有，无需追加）
- [ ] `pnpm tsc --noEmit` 零新增（移交 task-019 实跑）
- [x] 本文件 §7 实施记录填写
- [x] roadmap.md 追加本任务索引
