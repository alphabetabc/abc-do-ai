# task-2026-07-28-008：审计 useMemo 依赖完整性

> Bug #3（commit `93fcfe1`）揭示了 plan 阶段的 useMemo 依赖审计盲区，本 task 系统性排查类似隐患
>
> 计划日期：2026-07-28
> 任务编号：`task-2026-07-28-008`
> 状态：`done`
> 类型：`refactor` + `chore`
> 来源：[2026-07-28-handoff §3.4](../2026-07-28-handoff-single-source-refactor.md) / commit `93fcfe1`
>
> **风险等级：中（可能修改多个文件，需配套冒烟）**

---

## 1. 背景

task-002 引用复用优化后，setComponents 结构变更时 byId 条目引用**可能不变**（节点 data 未改只是位置变了），但 children 变了。原 useMemo 依赖 `[onValueChange, dataSource]` 漏掉 children → propsValue 不重算 → FieldGenerator 收到旧 propsValue → 子组件不渲染/残留。

**Bug #3 现象**：
- 拖入组：原位置消失但新位置不出现 + 组尺寸不更新
- 拖出组：画布出现两个实例（新位置 + 原位置残留）

**修复**：commit `93fcfe1` 补充 children 到 useMemo 依赖数组。

**揭示的盲区**：plan 阶段未审计所有依赖 `dataSource` / `byId[id]` 的 useMemo / useCallback 是否需要补 `children` 或 `parentMap` 依赖。单源后引用复用使 byId 条目引用在结构变更时可能不变，**任何依赖 byId 的 useMemo 都可能存在类似问题**。

---

## 2. 目标

1. 系统性审计所有依赖 `dataSource` / `byId[id]` 的 useMemo / useCallback
2. 评估每个是否需要补 `children` 或 `parentMap` 依赖
3. 修复发现的 bug
4. 测试结构性变更（拖入组/拖出组/组内移动）作为回归冒烟
5. 把"useMemo 依赖审计"纳入未来类似重构的 plan 模板

---

## 3. 详细步骤

### 步骤 1：枚举审计目标

- [ ] Grep `useMemo` + `useCallback` 引用 `dataSource` / `byId[` 的位置
- [ ] 列出每个 useMemo 的依赖数组 + 用途
- [ ] 重点关注：渲染路径（designer-field/）+ 配置面板（configuration-panel/）+ 图层树（layers-tree/）+ dnd（common/dnd/）

### 步骤 2：逐个评估依赖完整性

对每个 useMemo / useCallback，按下表评估：

| 问题 | 判断标准 | 修复 |
| --- | --- | --- |
| 漏 `children` 依赖 | 闭包内访问 `node.children` | 补 `children` 到依赖数组 |
| 漏 `parentMap` 依赖 | 闭包内用 parentMap 反查 | 补 `parentMap` 到依赖数组 |
| 漏 `onValueChange` 依赖 | 闭包内调 onValueChange 但未声明依赖 | 补依赖或说明为何不依赖 |
| 不必要的依赖（导致频繁重算） | 依赖了未实际使用的值 | 移除 |
| useMemo 不必要（计算成本低） | 只是对象字面量 | 改为直接赋值 |

### 步骤 3：实施修复

- [ ] 按步骤 2 评估结果逐个修改
- [ ] 每个修改一个独立 commit（粒度小，便于 review 和回退）
- [ ] commit message 引用原 useMemo 位置（如 `fix(DesignerField): useMemo 补 children 依赖 (#xxx)`）

### 步骤 4：回归冒烟（结构性变更场景）

按 handoff §3.4 操作建议：

- [ ] 拖入组：原位置消失 + 新位置出现 + 组尺寸更新
- [ ] 拖出组：画布只保留新位置一个实例 + 原组尺寸缩小
- [ ] 组内移动：组件位置变化 + 其他兄弟组件位置不变
- [ ] 同级排序：组件顺序变化 + 父组尺寸不变
- [ ] 配置面板 propsValue 正确重算（拖拽过程中观察配置面板实时更新）

---

## 4. 验证清单

- [ ] `pnpm exec tsc --noEmit` 零新增错误
- [ ] `pnpm build` 通过
- [ ] 审计清单记录到任务文件 §6 实施记录
- [ ] 拖入组 / 拖出组 / 组内移动 / 同级排序 4 类冒烟全部通过
- [ ] 配置面板 propsValue 在结构变更时正确重算
- [ ] 440 组件场景性能无回归
- [ ] 任务文件移到 `plans/done/`
- [ ] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 审计漏掉某些间接依赖 | 中 | 新 bug 滞留 | 配合结构性变更冒烟；后续回归测试拦截 |
| 修改依赖数组引入依赖循环 | 中 | 性能塌方 / 死循环 | 每个修改独立 commit + 性能验证 |
| 改动量大（10+ 文件） | 中 | review 困难 | 按文件分组独立 commit，每个 commit 配套验证 |
| 改错依赖导致新 bug | 低 | 渲染异常 | 完整冒烟 + Profiler 对比 |

### 回退

- 每个修改独立 commit，可单独 `git revert <commit>`
- 不改函数签名，回退成本低

---

## 6. 实施记录

> 实施过程中按时间顺序追加。
>
> **审计清单**（2026-07-29 完成系统性审计，覆盖渲染路径 / 配置面板 / 图层树 / dnd / canvas-graph / layer-manager）：

### 6.1 审计结论

**未发现需要修复的 Bug #3 同类缺陷**。Bug #3（commit `93fcfe1`，`designer-field/index.tsx` L270 的 `propsValue` useMemo）是唯一一处命中"byId 引用复用 + children 漏依赖"陷阱的点，已修复。

**核心机制验证**（已当场确认）：
- `buildIndex`（`src/designer/renderer/utils.ts` L664-697）：`oldEntry.data === node.data` 时复用 byId 条目引用（L679-681），确认引用复用机制存在
- `FlatField`（L641-646）：**不含 children**，仅 `uniqueId / type / parentId / data`
- `useFieldConf`（`src/store/designer/hooks.ts` L86-90）：订阅 `byId[uniqueId]`，返回 FlatField
- 因此所有依赖 `dataSource`（byId 派生）的 useMemo，在结构性变更且节点 data 未变时，dataSource 引用不变

**为什么其他 useMemo 不受影响**：
1. 依赖 dataSource 的 useMemo（如 `overwriteStyle` / `groupState`）只读 `dataSource.data.config` 解构的原始值或 `dataSource.type`——data 引用不变 = 这些值不变 = 不重算正确
2. 唯一例外是 `propsValue`，因为 `createFieldPropsValue`（utils.ts L114）把 `children`（来自 props 递归，结构性变更时会变）写入返回值，而 children 不在 dataSource.data 内 → 必须显式依赖 children。**此问题已修复**
3. 依赖 components 树的 useMemo（如 `treeData` / `designerState` / `flatComponents`）在单源后 components 每次 dispatch 引用必变，依赖链完整

### 6.2 审计清单（按目录）

#### A. 渲染路径 `src/designer/renderer/`（含 designer-field / generator / GeneratorWidget / item-field / group-field）

| 文件 | useMemo 行 | 用途 | 当前依赖 | 评估 | 修复 |
| --- | --- | --- | --- | --- | --- |
| designer-field/index.tsx | L95 | show = !isHidden | `[isHidden]` | 纯原始值，无需修复 | — |
| designer-field/index.tsx | L97 | hasEditing | `[hasSelected, isLock, isHidden, dataDebug.showModal, modalVisible]` | 纯布尔计算，依赖完整 | — |
| designer-field/index.tsx | L163 | overwriteStyleBorder | `[hasSelected, rest.borderStyle, selectedFieldInGroup]` | 纯 UI，依赖完整 | — |
| designer-field/index.tsx | L167 | overwriteStyle | `[width, height, background, rest, slider, dataSource, overwriteStyleBorder]` | 只读 dataSource.type + data 解构值，data 不变则值不变，无需修复 | — |
| designer-field/index.tsx | L270 | propsValue | `[onValueChange, dataSource, children]` | **已修复（Bug #3）**，createFieldPropsValue 写入 children，必须依赖 children | — |
| designer-field/index.tsx | L283 | rndSize | `[height, width]` | 纯原始值 | — |
| designer-field/index.tsx | L287 | disableMovable | `[slider, propsEnableMovable]` | 纯原始值 | — |
| designer-field/index.tsx | L291 | rndProps | `[enableWidgetMovable, hasEditing]` | 纯 UI | — |
| generator.tsx | L45 | 取 materialsField | `[ownerProps.type]` | 闭包访问 `useAppInfoModel?.data?.container` 未列入依赖（hox 全局模型，非 byId 相关，本任务范围外） | —（非本任务） |
| generator.tsx | L56 | FieldElement | `[Field, compProps.type]` | L67 读 latestProps.current.compProps.type（ref），逻辑自洽，非 byId 相关 | — |
| GeneratorWidget.tsx | L56 | show | `[isHidden]` | 纯 UI | — |
| GeneratorWidget.tsx | L62 | overwriteStyle | `[width, height, background, left, top, slider, rest, value.type]` | value 来自 widgets 树（非 byId），无引用复用问题 | — |
| GeneratorWidget.tsx | L77 | getSubField (useCallback) | `[value.type]` | 同 generator.tsx L45，hox 模型漏依赖，非本任务范围 | —（非本任务） |
| GeneratorWidget.tsx | L116 | result (loopWidgets) | `[widgets]` | widgets 树引用，依赖完整 | — |
| item-field/index.tsx | L36/71/76/111 | dpuList/fullProps/containerStyle/memoField | 各自原始值/props | 纯值或 props 透传，依赖完整；children 经 omit 剔除不渲染子组件 | — |
| group-field/index.jsx | L142/227 | initParams/sliderInfinite | 配置值 | 纯值，children 来自 props 非_byId | — |
| group-field/components/* | L14/47/57/83 | 样式/showIcon | 配置值 | 纯值，依赖完整 | — |
| data-debug/* | L7/10/25/36 | formData/requestErrMsg | snapshot 值 | 纯数据快照，与 byId/children 无关 | — |
| designer-parser/index.jsx | L34/63 | backgroundStyles/size | page config 值 | 纯样式计算，与 byId/children 无关 | — |

#### B. 配置面板 `src/designer/configuration-panel/`

| 文件 | useMemo 行 | 用途 | 当前依赖 | 评估 | 修复 |
| --- | --- | --- | --- | --- | --- |
| component/index.jsx | L18 | 查找物料 | `[cname, materialsList]` | 纯查找，materialsList 非画布 components | — |
| component/index.jsx | L53 | 过滤 remoteSchemaFields | `[remoteSchemaFields, designerType]` | 纯 UI 配置 | — |
| index.js | L32 | currentConf（从 currentField 提取） | `[currentField]` | currentField=byId[selected]。data 引用不变=内容不变=不重算正确 | — |
| index.js | L48 | 选择渲染面板 | `[currentConf, loading, selected]` | 依赖完整 | — |

#### C. 图层树 `src/designer/aside-panel/layers-tree/`

| 文件 | useMemo 行 | 用途 | 当前依赖 | 评估 | 修复 |
| --- | --- | --- | --- | --- | --- |
| index.jsx | L32 | state={components} | `[components]` | components 单源后每次 dispatch 必变，依赖完整 | — |
| index.jsx | L49 | rootParent | `[state.components]` | 同上，rootParent.children=components 引用必变 | — |
| tree/index.tsx | L31 | designerState={components,byId} | `[components, byId]` | 传给 useOnDrop（usePersistFn，读 ref），引用陈旧无影响 | — |
| tree/index.tsx | L72 | treeData | `[props.tree, byId]` | props.tree=rootParent，其 children 链结构性变更时引用必变 → 触发重算；byId 用于读 title（data 不变则 title 不变，不重算正确） | —（建议加注释说明依赖 props.tree 传导） |
| tree/index.tsx | L123 | mergedExpandedKeys | `[stateExpandedKeys, expandedKeys]` | 纯 UI 状态 | — |

#### D. dnd / draggable / canvas-graph / DesignerContent / layer-manager

| 文件 | useMemo 行 | 用途 | 当前依赖 | 评估 | 修复 |
| --- | --- | --- | --- | --- | --- |
| common/dnd/ | — | — | — | 4 个文件均无 useMemo/useCallback | — |
| common/draggable/ | — | — | — | 无 useMemo/useCallback | — |
| canvas-graph/index.tsx | L105 | widgetVisibleList | `[hideWidgetList]` | 纯过滤 | — |
| canvas-graph/index.tsx | L117 | designerState={components} | `[components]` | components 单源后每次必变 | — |
| canvas-graph/index.tsx | L173/181/209/482 | 标尺/偏移/缩放样式 | view 状态值 | 纯 view 计算，与 byId/children 无关 | — |
| canvas-graph/index.tsx | L235 | groupState | `[curFieldConf]` | curFieldConf=byId[selected]，只读 type；结构性变更不改 type，不重算正确 | — |
| canvas-graph/index.tsx | L275 | backgroundStyles | page config 值 | 纯样式，与 byId/children 无关 | — |
| canvas-graph/components/search-layer.tsx | L19 | options | `[flatComponents]` | flatComponents 由 useFlatComponents 派生（依赖 components），链路完整 | — |
| DesignerContent.tsx | L181/452 | currentSceneId/headerTitle | ID/文本值 | 纯计算，与 byId/children 无关 | — |
| layer-manager/ | — | — | — | 8 个文件均纯函数，事件回调内 store.getState() 同步读，无 useMemo | — |

### 6.3 附带发现（非本任务范围，记录备查）

1. **generator.tsx L45 / GeneratorWidget.tsx L77**：闭包访问 `useAppInfoModel?.data?.container` 但依赖数组未包含。属于 hox 全局模型订阅问题，与 byId/children 引用复用无关。如需修复需评估 container 变化频率与影响面，建议另开 task。
2. **canvas-graph L117 designerState 闭包陈旧**：`layerManager.group(designerState, ...)` 在事件回调中用渲染快照 components，而 byId 来自 store.getState()。单源后 components 每次 dispatch 引用必变，渲染快照通常是最新值，实际风险低。如需彻底修复应改为回调内 `store.getState().designerCanvas.components`，超出本任务范围。

### 6.4 时间线

- 2026-07-28：任务创建。承接 handoff §3.4 P1 #4。Bug #3（commit `93fcfe1`）揭示了 useMemo 依赖审计盲区，本 task 系统性排查类似隐患。
- 2026-07-29：完成系统性审计。3 个 search subagent 并行覆盖渲染路径 / 配置面板+图层树 / dnd+canvas-graph+layer-manager，主对话交叉验证关键结论。**未发现需修复的 Bug #3 同类缺陷**。Bug #3 是唯一命中"byId 引用复用 + children 漏依赖"陷阱的点，已修复。
