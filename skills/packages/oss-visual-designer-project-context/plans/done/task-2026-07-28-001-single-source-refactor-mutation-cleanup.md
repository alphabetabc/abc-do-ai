# task-2026-07-28-001：单源重构（1/4）— mutation 清理 + 基础设施

> 单源重构系列第 1 个 task，承载元计划 task-2026-07-27-001 阶段 4 的**前置步骤**（步骤 -1 / 0 / 1a / 1b）。
>
> - 计划日期：2026-07-28
> - 任务编号：`task-2026-07-28-001`
> - 状态：`done`
> - 类型：`refactor + chore`
> - 上游：[task-2026-07-27-001 单源重构元计划](./task-2026-07-27-001-single-source-refactor-meta-plan.md)（阶段 4 步骤 -1/0/1a/1b）
> - 下游：[task-2026-07-28-002 单源 reducer 改造](./task-2026-07-28-002-single-source-refactor-reducer.md)（**硬依赖本 task 完成**）

---

## 1. 背景与目标

单源重构（components 树唯一真相，byId 纯派生）的核心前提是**所有写入 Redux state 的 tree 必须是不可变的**。当前代码存在 3 处直接 mutation + 2 处 cloneDeep 需审计，这些 mutation 在单源后（步骤 2/3/4 改 reducer 为 Immer produce 改树）会破坏 Immer 不可变契约：

- `syncLayoutBlockSize2Children`（element.tsx:58-120）：内部用 `_.set` + `child.children = ...` 直接 mutate child 对象，3 个调用方都受影响
- `drag2layoutBlock.ts:49`：`layoutBlockNode.children = ...` 直接 mutation
- `useOnDrop.ts:28/L30/L61`：`unshift` + `splice` + `targetFieldConfig.children = ...` 直接 mutation

本 task 还包含两个独立的前置动作：
- 步骤 -1：验证 `useSaveCompDetailData4Designer.ts` 非双源（零改动确认）
- 步骤 0：性能基线测量（浏览器手动执行）
- 步骤 1b：移除 toolbar handleClear 死代码注释块（为 task-003 删除 undo/redo 死字段铺路）

**完成标准**：所有 mutation 消除 + 性能基线数据落地 + handleClear 死代码清理，为 task-002 单源 reducer 改造扫清前置依赖。

---

## 2. 步骤总览

| 步骤 | 改动 | 文件数 | 风险 | 独立 commit |
| --- | --- | --- | --- | --- |
| -1 | 验证 useSaveCompDetailData4Designer 非双源 | 0 | 极低 | 验证记录（无 commit） |
| 0 | 性能基线测量 | 1 脚本（.trae/） | 低 | `perf: 建立重构前性能基线` |
| 1a.1 | syncLayoutBlockSize2Children 不可变改造 | 1 | 中 | `refactor: syncLayoutBlockSize2Children 改为不可变` |
| 1a.2 | drag2layoutBlock 不直接 mutation | 1 | 中 | `refactor: drag2layoutBlock 不再直接 mutation` |
| 1a.3 | useOnDrop 改用不可变数组操作 | 1 | 中 | `refactor: useOnDrop 改用不可变数组操作` |
| 1a.4 | DropContainer 零改动验证 | 0 | 极低 | `chore: 验证 DropContainer 零改动` |
| 1a.5 | cloneDeep 审计 | 0 | 极低 | `chore: 审计 cloneDeep 路径（均无需改造）` |
| 1b | 移除 toolbar handleClear 死代码 | 1 | 极低 | `chore: 移除 toolbar handleClear 死代码` |

**依赖关系**：步骤 -1 / 0 / 1b 完全独立；1a.1 → 1a.2 → 1a.3 有弱依赖（1a.1 先改 syncLayoutBlockSize2Children 为不可变，后续调用方即使仍用 mutation 接收返回值也能工作）；1a.4 / 1a.5 独立验证。

---

## 3. 详细步骤

### 步骤 -1：排查 `useSaveCompDetailData4Designer.ts`（盲区验证）

**目标**：验证 `useSaveCompDetailData4Designer.ts` 不读 Redux state.byId/parentMap，单源后无需修改。

**事实依据**（已 Read 代码确认）：
- [`src/pages/hooks/useSaveCompDetailData4Designer.ts:18`](../../src/pages/hooks/useSaveCompDetailData4Designer.ts#L18) `const components = pageConfig.components;` —— 从 `pageInfo.config`（外部 props）读，**不是 Redux state**
- [`src/pages/hooks/useSaveCompDetailData4Designer.ts:30`](../../src/pages/hooks/useSaveCompDetailData4Designer.ts#L30) `const { byId, parentMap } = buildIndex(components);` —— **自建** byId/parentMap，**不是读 Redux state.byId/parentMap**
- [`src/pages/hooks/useSaveCompDetailData4Designer.ts:32`](../../src/pages/hooks/useSaveCompDetailData4Designer.ts#L32) `generatorGroup(components, byId, parentMap, selected, ...)` —— 把自建 byId/parentMap 传给 generatorGroup 作为参数

**操作清单**：
- [ ] Grep 整个 src 是否还有其他文件直接调用 `buildIndex(` 构造本地 byId（期望仅此一处 + reducer 2 处 + utils.ts 函数定义 + 备份文件）
- [ ] 若发现新调用方：补入本步骤并评估影响

**验证**：`pnpm exec tsc --noEmit`（src/ 应 0 错误，基线已确认）

**commit**：无（验证步骤，零改动）

---

### 步骤 0：建性能基线

**目标**：用 Performance API 实测当前双源架构的关键指标，作为 task-002/003/004 单源后对比基线。

**事实依据**：元计划阶段 5 §5.3.1 已定义基线建立的必要性。基线脚本 [`perf-baseline.js`](../research/refactor-single-source/perf-baseline.js) 已就绪（114 行，浏览器 DevTools Console 注入式）。

**操作清单**：
- [ ] 执行 `pnpm start` 启动 dev server
- [ ] 注入方式：把 perf-baseline.js 复制到 `src/_perf-baseline.js`（下划线前缀表示临时），`src/index.js` 增加 `import './_perf-baseline.js';`（仅在 dev mode）
- [ ] 浏览器打开 designer 路由
- [ ] Console 执行 `window.runPerfBaseline()`
- [ ] 等输出 `[BASELINE DONE]`
- [ ] 把 console 输出复制到 [`baseline-2026-07-27.md`](../research/refactor-single-source/baseline-2026-07-27.md) 对应表格
- [ ] **必做**：执行 `verifyImmerProxyReference()` 验证 Immer proxy 引用比较语义（r1§1.2：不再是可选，单源后需确认 sameRef=true）
- [ ] 完成后删除 `src/_perf-baseline.js` + 还原 `src/index.js`（工具用完即留原则）

**测量覆盖**：5 场景（empty/small/medium/large/xlarge）× 4 指标（buildIndex/mergeByIdIntoTree/setComponents/updateFieldConfig）+ 4 对齐规模（N=10/50/220/440）

**验证**：基线报告填写完整

**commit**：`perf: 建立重构前性能基线（数据见 baseline-2026-07-27.md，脚本 perf-baseline.js 随附）`

**回退**：删除脚本和报告（位于 `.trae/`，不进 src/）

---

### 步骤 1a.1：改 `syncLayoutBlockSize2Children` 为不可变（含 NaN 防护）

**目标**：消除 `_.set` + `child.children = ...` 的直接 mutation。

**文件**：[`src/designer/common/field/layout-block/helper/element.tsx`](../../src/designer/common/field/layout-block/helper/element.tsx#L58-L120) L58-L120

**当前问题**（已 Read 确认）：
- L69-L72 / L90-L94 / L109-L112：`_.set(child, 'data.config.width', ...)` 是 lodash in-place mutation
- L74 / L97 / L115：`child.children = resizeChildren(...)` 直接 reassign
- L77 / L115：`width / oWidth` 在 `oWidth=0`（新建组件）时产生 NaN

**目标实现**：

```ts
const syncLayoutBlockSize2Children = (layoutBlockConfig: any, children: any[]) => {
    const width = _.get(layoutBlockConfig, 'data.config.width');
    const height = _.get(layoutBlockConfig, 'data.config.height');

    const resizeChildren = (childrenList: any, parentSize: any): any[] => {
        if (!_.isArray(childrenList) || childrenList.length === 0) return childrenList;
        if (childrenList.length === 1) {
            return childrenList.map((child: any) => {
                const oWidth = _.get(child, 'data.config.width');
                const oHeight = _.get(child, 'data.config.height');
                const newChild = {
                    ...child,
                    data: {
                        ...child.data,
                        config: {
                            ...child.data.config,
                            width: parentSize.width,
                            height: parentSize.height,
                            left: 0,
                            top: 0,
                        },
                    },
                };
                if (child.children) {
                    // NaN 防护：oWidth/oHeight 为 0 时 xScale/yScale = NaN/Infinity
                    const xScale = oWidth ? parentSize.width / oWidth : 1;
                    const yScale = oHeight ? parentSize.height / oHeight : 1;
                    newChild.children = resizeChildren(child.children, {
                        width: parentSize.width,
                        height: parentSize.height,
                        xScale,
                        yScale,
                    });
                }
                return newChild;
            });
        } else {
            return childrenList.map((child: any) => {
                const childWidth = _.get(child, 'data.config.width');
                const childHeight = _.get(child, 'data.config.height');
                const left = _.get(child, 'data.config.left');
                const top = _.get(child, 'data.config.top');
                const newChild = {
                    ...child,
                    data: {
                        ...child.data,
                        config: {
                            ...child.data.config,
                            width: parentSize.xScale * childWidth,
                            left: parentSize.xScale * left,
                            height: parentSize.yScale * childHeight,
                            top: parentSize.yScale * top,
                        },
                    },
                };
                if (child.children) {
                    newChild.children = resizeChildren(child.children, parentSize);
                }
                return newChild;
            });
        }
    };

    return children.map((child) => {
        const oWidth = _.get(child, 'data.config.width');
        const oHeight = _.get(child, 'data.config.height');
        const newChild = {
            ...child,
            data: {
                ...child.data,
                config: {
                    ...child.data.config,
                    width,
                    height,
                    left: 0,
                    top: 0,
                },
            },
        };
        if (child.children) {
            const xScale = oWidth ? width / oWidth : 1;
            const yScale = oHeight ? height / oHeight : 1;
            newChild.children = resizeChildren(child.children, { width, height, xScale, yScale });
        }
        return newChild;
    });
};
```

**核心改动**：
- 所有 `_.set(child, ...)` 改为浅展开 `{ ...child, data: { ...child.data, config: { ...child.data.config, ... } } }`
- 所有 `child.children = ...` 改为 `newChild.children = ...`
- 2 处 `width / oWidth` 改为 `oWidth ? width / oWidth : 1`（NaN 防护）

**⚠️ 行为变更标注**（r2§2.1 修正：**不是行为变更，是重构 + NaN Bugfix**）：
>
> r1§1.3 误判为"行为变更"——实际源码 [element.tsx:64-102](../../src/designer/common/field/layout-block/helper/element.tsx#L64-L102) **已经有** `childrenList.length === 1` 和 `else` 两个分支：
> - 1 个子组件（L64）：覆盖为父尺寸 + left=0, top=0
> - 2+ 个子组件（L83）：按 `parentSize.xScale * childWidth` 比例缩放
>
> 我的伪代码**完全保留了这两个分支**，语义与原实现一致。唯一新增的是 NaN 防护（`oWidth ? width / oWidth : 1`），这是 bugfix（原实现 `oWidth=0` 时产生 NaN）。
>
> **不需要 feature flag**（r1§1.3 建议的 `LEGACY_LAYOUT_BLOCK_SYNC` 不采纳，因为没有行为变更）。

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**：
- [ ] 从素材面板拖入 layout-block 区域：组件尺寸正确铺满
- [ ] 图层树拖拽到 layout-block 节点：组件尺寸正确铺满
- [ ] onDragStop 把组件拖入 layout-block（高亮状态）：尺寸正确铺满
- [ ] **新建组件（默认 width/height 为 0）拖入 layout-block**：尺寸正确铺满（验证 NaN 防护）
- [ ] **layout-block 内 2+ 子组件**：按比例缩放（r2§2.1：语义与原实现一致，非行为变更）

**回退**：`git revert` 此 commit

**commit**：`refactor: syncLayoutBlockSize2Children 改为不可变（消除 _.set / child.children mutation + NaN 防护） [Bugfix: oWidth=0 时 NaN 防护]`

---

### 步骤 1a.2：改 `drag2layoutBlock.ts:49` 不直接 mutation

**目标**：消除 `layoutBlockNode.children = ...` 的直接 mutation。

**文件**：[`src/designer/common/draggable/drag2layoutBlock.ts`](../../src/designer/common/draggable/drag2layoutBlock.ts#L33-L57) L49

**当前实现**（已 Read 确认 L49）：
```ts
layoutBlockNode.children = LAYOUT_BLOCK.layoutBlockElement.syncLayoutBlockSize2Children(layoutBlockNode, [
    ...(layoutBlockNode.children || []),
    dropField,
]);
return setChildren(newComponents, layoutBlockUniqueId, layoutBlockNode.children);
```

**目标实现**：
```ts
const newLayoutBlockChildren = LAYOUT_BLOCK.layoutBlockElement.syncLayoutBlockSize2Children(layoutBlockNode, [
    ...(layoutBlockNode.children || []),
    dropField,
]);
return setChildren(newComponents, layoutBlockUniqueId, newLayoutBlockChildren);
```

**核心改动**：用 `const newLayoutBlockChildren = ...` 接收返回值，不再 `layoutBlockNode.children = ...`

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**：
- [ ] onDragStop 把组件拖入 layout-block 高亮区域：组件正确进入 layout-block，尺寸正确铺满
- [ ] 拖入后立即保存（handleSave）：保存的配置正确

**回退**：`git revert` 此 commit

**commit**：`refactor: drag2layoutBlock.dropField2LayoutBlock 不再直接 mutation layoutBlockNode.children`

---

### 步骤 1a.3：改 `useOnDrop.ts:28/L30/L61` 不直接 mutation

**目标**：消除 `unshift` + `splice` + `targetFieldConfig.children = ...` 的直接 mutation。

**文件**：[`src/designer/aside-panel/layers-tree/tree/useOnDrop.ts`](../../src/designer/aside-panel/layers-tree/tree/useOnDrop.ts#L27-L33) L27-L33 + L60-L62

**当前实现**（已 Read 确认）：
```ts
// L28
targetFieldConfig.children.unshift(dropFieldConfig);
// L30
targetFieldConfig.children = LAYOUT_BLOCK.layoutBlockElement.syncLayoutBlockSize2Children(targetFieldConfig, targetFieldConfig.children);
// L61
targetParentChildren.splice(dropPosition === -1 ? index : index + 1, 0, dropFieldConfig);
```

**目标实现**：
```ts
// L28 改为
// 第一层语义：构造"追加了 dropFieldConfig 后"的目标子数组（仅追加，未做 layout-block 尺寸同步）
const withDropFieldChildren = [dropFieldConfig, ...targetFieldConfig.children];
// L30 改为
// 第二层语义：若目标是 layout-block，对 withDropFieldChildren 再做尺寸同步，得到最终要写入的子数组
const syncedLayoutBlockChildren = targetFieldConfig.type === FIELD_COMP_TYPES.LAYOUT_BLOCK
    ? LAYOUT_BLOCK.layoutBlockElement.syncLayoutBlockSize2Children(targetFieldConfig, withDropFieldChildren)
    : withDropFieldChildren;
newComponents = setChildren([...newComponents], targetFieldUniqueId, syncedLayoutBlockChildren);

// L61 改为
const insertIndex = dropPosition === -1 ? index : index + 1;
const newParentChildren = [
    ...targetParentChildren.slice(0, insertIndex),
    dropFieldConfig,
    ...targetParentChildren.slice(insertIndex),
];
newComponents = setChildren([...newComponents], targetFieldConfigParent.uniqueId, newParentChildren);
```

**附加优化**：L24 `[...newComponents]` 多余（setChildren 已 immutable），顺手删除。

**核心改动**：
- L28 `unshift` 改为 `[dropFieldConfig, ...children]` 创建新数组
- L30 `targetFieldConfig.children = ...` 改为 `syncedLayoutBlockChildren` 局部变量（区分"仅追加"的 `withDropFieldChildren` 与"尺寸同步后"的最终写入数组）
- L61 `splice` 改为 spread + slice 创建新数组
- L24 `[...newComponents]` 删除

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**：
- [ ] 图层树拖动节点到另一个节点内部：组件位置正确
- [ ] 图层树拖动节点到 gap 位置：组件位置正确
- [ ] 拖动 layout-block 类型节点到另一个 layout-block：尺寸正确铺满

**回退**：`git revert` 此 commit

**commit**：`refactor: useOnDrop 改用不可变数组操作（消除 unshift / splice mutation）`

---

### 步骤 1a.4：`DropContainer.tsx` 调用方验证

**目标**：验证 `DropContainer.tsx` 通过 `setChildren2LayoutBlock` 调用 `syncLayoutBlockSize2Children`（1a.1 已改为不可变），且 `setChildren` 本身 immutable，所以 DropContainer **零改动**。

**文件**：[`src/designer/common/dnd/DropContainer.tsx`](../../src/designer/common/dnd/DropContainer.tsx#L63) L63

**事实依据**：`setChildren2LayoutBlock`（element.tsx:123）内部调用 `syncLayoutBlockSize2Children`（1a.1 已改为不可变），返回新数组传给 `setChildren`（immutable）。

**操作清单**：
- [ ] Read `DropContainer.tsx` 确认 L63 调用 `setChildren2LayoutBlock` 的方式
- [ ] tsc 确认无类型错误

**验证**：
```bash
pnpm exec tsc --noEmit
```

**浏览器冒烟**：
- [ ] 从素材面板拖入 layout-block 高亮区域：组件正确进入 layout-block

**commit**：`chore: 验证 DropContainer.tsx 零改动（1a.1/1a.2/1a.3 完成后无需修改）`

---

### 步骤 1a.5：cloneDeep 审计

**目标**：审计元计划 task-016 点名的 2 处 cloneDeep，确认是否需要改造。

**审计对象**：

| 位置 | 代码 | 风险评估 |
| --- | --- | --- |
| [`src/designer/common/dnd/helper.ts:60`](../../src/designer/common/dnd/helper.ts#L60) | `_.cloneDeep({...remoteModule?.materialInfo, data: remoteModule?.defaultValue})` | **零风险**：cloneDeep 的是素材面板物料信息，最终传给 `generatorField` 生成新组件，**不读 Redux state** |
| [`src/designer/toolbar/comp/dataset/DataSetList.tsx:120`](../../src/designer/toolbar/comp/dataset/DataSetList.tsx#L120) | `return _.cloneDeep(rawDataSetList)` | **零风险**：cloneDeep 的是数据集原始数据，用于离线编辑，**不写入 Redux state** |

**审计范围说明**（r2§2.6）：本次审计范围仅限 task-016 点名的 2 处 cloneDeep。src/designer/ 下还有 3 处 cloneDeep 使用（均零风险，不在本次审计范围）：
- utils.ts `resetUniqueId` 中 `_.cloneDeep(fields)`：克隆输入参数，不读 Redux state
- utils.ts `generatorField` 中 `_.cloneDeep(opts)`：克隆物料默认值，不读 Redux state  
- utils.ts `resetObjectSealed` 中 `_.cloneDeep(obj)`：克隆密封对象，通用工具

**结论**：2 处 cloneDeep 均**零改动**。

**验证**：Grep 确认 2 处 cloneDeep 均无后续被 Immer 冻结或被 setComponents 写入的路径

**commit**：`chore: 审计 dnd/helper.ts L60 + DataSetList.tsx L120 cloneDeep 路径（均无需改造）`

---

### 步骤 1b：移除 `toolbar/index.js` handleClear 死代码

**目标**：清理 dead code，为 task-003 删除 undo/redo 死字段铺路。

**文件**：[`src/designer/toolbar/index.js`](../../src/designer/toolbar/index.js#L77-L91) L77-L91 + L307-L320

**当前状态**：`handleClear` 函数（L77-L91）和对应的按钮 JSX（L307-L320）都被 `/* nosonar */` 注释块注释掉。`handleClear` 是 `undo`/`redo` 死字段的唯一潜在调用方（已注释）。

**操作清单**：
- [ ] `grep -n 'handleClear' src/ --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx'` → 期望仅 toolbar/index.js 内匹配，无其他活代码引用
- [ ] 删除 L77-L91 的 `/* nosonar */ ... handleClear ... */` 注释块
- [ ] 删除 L307-L320 的 `/* nosonar */ ... 按钮 JSX ... */` 注释块

**验证**：
```bash
pnpm exec tsc --noEmit
# 浏览器确认 toolbar 仍正常渲染（无视觉差异）
```

**回退**：`git revert` 此 commit

**commit**：`chore: 移除 toolbar handleClear 死代码注释块（为 task-003 删 undo/redo 死字段铺路）`

---

## 4. 验证清单

### 4.1 类型安全（每步必跑）

```bash
pnpm exec tsc --noEmit
```

- [x] `src/` 目录 0 错误
- [x] `packages/ui` 的 10 个 pre-existing 错误允许保留（与本 task 无关）

### 4.2 浏览器冒烟（步骤 1a 综合验证）

- [x] 从素材面板拖入新组件 → layout-block 区域
- [x] 从素材面板拖入新组件 → 普通画布
- [x] 图层树拖拽节点（移动层级、放入子节点、放入 gap）
- [x] onDragStop 把组件拖入 layout-block 高亮区
- [x] 新建组件（width/height=0）拖入 layout-block（验证 NaN 防护）
- [x] layout-block 内 2+ 子组件（验证按比例缩放：r2§2.1 确认非行为变更，语义与原实现一致）
- [x] toolbar 正常渲染（步骤 1b 验证）

### 4.3 性能基线（步骤 0 产出）

- [x] `baseline-2026-07-27.md` 5 场景 × 4 指标填写完整
- [x] **必做** `verifyImmerProxyReference()` 结果记录（r1§1.2/r2§1.1：不再是可选，单源后需确认 sameRef=true）

---

## 5. 风险与回退

### 5.1 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| syncLayoutBlockSize2Children NaN 防护引入新 bug | 低 | r2§2.1：非行为变更，仅 NaN Bugfix + 不可变重构；浏览器冒烟覆盖 2+ 子组件 + 新建组件场景 |
| mutation 改造引入新 bug | 中 | 每步独立 commit + 浏览器冒烟 + 可独立 revert |
| 性能基线测量不准确 | 低 | 用 Performance API + 100 次迭代取 p95 |
| cloneDeep 审计遗漏 | 极低 | r2§2.6：已确认 task-016 点名 2 处 + utils.ts 其余 3 处均不读 Redux state |

### 5.2 回退方案

每个步骤独立 `git revert`，无跨步骤依赖。步骤 1a.1/1a.2/1a.3 有弱依赖，回退时建议按 1a.3 → 1a.2 → 1a.1 顺序（但任意顺序 revert 也能编译通过，因为每步都是自洽的）。

---

## 6. 与下游 task 的衔接

**完成本 task 后**，task-002（单源 reducer 改造）可以开始执行，因为：
- 所有 mutation 已消除，Immer produce 改树不会拿到 mutated tree
- 性能基线已建立，reducer 改造后可对比
- handleClear 死代码已清理，task-003 删除 undo/redo 死字段无阻碍

**task-002 前置条件**：本 task 所有步骤完成 + tsc 通过 + 浏览器冒烟通过。

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：task 创建。从 task-2026-07-27-001 元计划阶段 4 拆分步骤 -1/0/1a/1b 为独立 task。
- 2026-07-28：结合 r1.md + r2.md review 报告优化——修正 syncLayoutBlockSize2Children 定性（r2§2.1：非行为变更，是重构+NaN Bugfix）、修正变量名歧义（r1§2.1：newTargetChildren→withDropFieldChildren / finalChildren→syncedLayoutBlockChildren）、统一 perf-baseline.js 注入路径（r1§2.5：方案 A webpack 临时 import）、handleClear 增加 grep 验证（r1§3.1）、cloneDeep 审计范围说明（r2§2.6：补充 utils.ts 其余 3 处均零风险）。
- 2026-07-28：开始执行。所有代码改动步骤已完成并独立提交：
  - 步骤 -1（验证 useSaveCompDetailData4Designer 非双源）：零改动确认。Grep `buildIndex(` 确认调用方仅 reducer 2 处 + 本文件 1 处 + utils.ts 定义 + .bak 备份，无新调用方。
  - 步骤 0（性能基线测量）：已完成。`baseline-2026-07-27.md` 数据填写完整（5 场景×4 指标 + align 串行/批量对比 + onResize 真热路径 + immerProxyVerify 验证）。关键发现：① setComponents 520ms 中 reducer 计算仅占 0.2ms，真正瓶颈在 React 渲染；② 对齐串行 N=440 达 75 秒（当前就有问题，方案 B 批量 setComponents 是必须）；③ onResize 已无法维持 10Hz（单次 dispatch ~1 秒）；④ immerProxyVerify sameRef=false（双源架构下预期，单源后需重测）。`src/_perf-baseline.js` 已清理，`src/index.js` 已还原。
  - 步骤 1a.1（syncLayoutBlockSize2Children 不可变改造）：commit `176c4a4`。`_.set` → 浅展开，`child.children =` → `newChild.children =`，2 处加 NaN 防护（`oWidth ? width / oWidth : 1`）。保留 `childrenList.length === 1` 和 `else` 两个分支语义不变。
  - 步骤 1a.2（drag2layoutBlock 不直接 mutation）：commit `b28988f`。`layoutBlockNode.children = ...` 改为 `const newLayoutBlockChildren = ...` 接收返回值。
  - 步骤 1a.3（useOnDrop 改用不可变数组操作）：commit `ca06b16`。`unshift` → `[dropFieldConfig, ...children]`，`splice` → spread + slice，`targetFieldConfig.children = ...` → `syncedLayoutBlockChildren` 局部变量（区分 withDropFieldChildren 仅追加 vs syncedLayoutBlockChildren 尺寸同步后）。删除 3 处多余的 `[...newComponents]`（setChildren 已 immutable）。
  - 步骤 1a.4（DropContainer 零改动验证）：零改动确认。`DropContainer.tsx` L63 调用 `setChildren2LayoutBlock`，内部调用已改造为不可变的 `syncLayoutBlockSize2Children`，返回新数组传给 `setChildren`（immutable）。
  - 步骤 1a.5（cloneDeep 审计）：零改动确认。`dnd/helper.ts:60` cloneDeep 素材物料信息（不读 Redux state），`DataSetList.tsx:120` cloneDeep 数据集原始数据（不写入 Redux state），均零风险。utils.ts 其余 3 处 cloneDeep 也不在本次范围。
  - 步骤 1b（移除 toolbar handleClear 死代码）：commit `e3e392d`。删除 L77-L91 handleClear 函数注释块 + L307-L320 按钮 JSX 注释块（含 handleCopy 死代码，两者均无活代码定义）。
  - 类型检查：`pnpm exec tsc --noEmit` 通过——`src/` 目录 0 错误，仅 `packages/ui` 10 个 pre-existing 错误（与本 task 无关）。
  - **待办**：浏览器冒烟验证（需用户手动执行，见 §4.2 验证清单）。
- 2026-07-28：浏览器冒烟发现既有 bug（非本 task 引入）：
  - **现象**：调整 layout-block 尺寸时，内部子组件不跟着调整（正式版正常）。
  - **根因**：task-007（2026-07-21）引入 `useFieldConf` 字段级订阅 byId，`designer-field/index.tsx:59` 的 `dataSource = fieldById || propsDataSource`，byId 是 FlatField **不含 children**。onResize 路径 `getResizedComponents` → `syncGroupSize2Children(dataSource, newConfig)`，`dataSource` 无 children → 函数内 `if (_.isArray(group.children))` 为 false → 子组件不缩放。
  - **与本 task 的关系**：**正交**。本 task 改的是 `syncLayoutBlockSize2Children`（拖入路径），这个 bug 在 `syncGroupSize2Children`（onResize 路径）。本 task 的改造不会恶化也不会修复此 bug。
  - **与单源重构的关系**：**正交**。单源后 byId 仍是 FlatField（不含 children），此 bug 不会被自动修复。但单源后 components 树永远 fresh，修复会更简单（可直接从 `state.components` 取带 children 的节点）。
  - **research 盲区**：阶段 1 §1.11 分析了 `useFieldConf` 订阅 byId（不含 children），§1.17 标注 `syncGroupSize2Children` 保留，但**没有交叉验证** byId 无 children 对 `syncGroupSize2Children` 入参的影响。这是跨函数数据流追踪的遗漏，不影响双源同步主线的正确性。
  - **处理决策**：不暂停单源重构。记录到 05-known-bugs.md + memo.md，作为单源重构完成后的 follow-up 项。
