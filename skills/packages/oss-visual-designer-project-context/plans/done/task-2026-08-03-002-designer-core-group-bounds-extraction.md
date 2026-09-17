# task-2026-08-03-002：designer-core 组尺寸重算抽离

## 背景

`recalcGroupBounds` 是单源架构的核心派生计算能力，当前在 `src/designer/DesignerContent.tsx` L286-328 硬编码为 Redux subscribe 回调。designer-core 的 `createDerivedComputePlugin` 已提供防重入 + 订阅 + 写入机制壳，但算法未抽离。

## 目标

将组尺寸重算相关纯函数抽离到 `packages-next/designer-core/src/group-bounds.ts`：

| 函数 | 现有位置 | 用途 |
| --- | --- | --- |
| `getGroupSizePosition` | utils.ts L322-395 | 计算 children 的边界（left/top/width/height + 极值项） |
| `resetChildrenPosition` | utils.ts L397-412 | 子组件位置归一化（减去 group 的 left/top） |
| `syncGroupSize2Children` | utils.ts L598-634 | 组尺寸变化时按比例缩放子组件 |
| `mergeFieldConfig` | utils.ts L209-237 | 递归合并配置到指定 id 节点（不可变） |

并提供 `createRecalcGroupBounds` 工厂函数，封装为 `createDerivedComputePlugin` 的 compute 函数。

## 详细步骤

> **Commit 粒度**（cross-review §B.2.6）：本任务收敛为 3 个 commit，避免 7 步大爆炸或单 commit 粒度粗：
>
> | Commit | 内容 | 文件 |
> | --- | --- | --- |
> | **Commit 1：抽离 group-bounds.ts 主体** | 步骤 1+2+3+4 合并：新建 `group-bounds.ts` + 4 个纯函数（泛型化 + 去 immer + 去 oss-web-toolkits + 去 `@Utils/helper`）+ 私有 `deepMerge` helper（保留深合并语义见 §外部依赖）+ `GroupBounds<TData>` 类型导出 + 顺手把 `syncGroupSize2Children` 内 `resizeField` 参数 `groupField` 改为 `childNode`（cross-review §B.2.4） | 1 个新增 (`group-bounds.ts`) |
> | **Commit 2：抽离 createRecalcGroupBounds 工厂** | 步骤 5：新建 `createRecalcGroupBounds` 工厂函数 + `RecalcGroupBoundsOptions` 类型 | 1 个新增（同一文件内 / 或 与 1 同 commit，取决于是否影响 git blame 可读性） |
> | **Commit 3：导出 + 测试** | 步骤 6+7：`index.ts` 导出（`getGroupSizePosition` / `resetChildrenPosition` / `syncGroupSize2Children` / `mergeFieldConfig` / `createRecalcGroupBounds` / `GroupBounds` / `RecalcGroupBoundsOptions`）+ `__tests__/group-bounds.test.ts` 单测覆盖（含 §B.5 15 个测试缺口 + 轮播组件 `drillDown` 保留 fixture） | 2 个改动（`index.ts` + 新增测试文件） |

每个 commit 都可独立 revert（前 1 个 commit revert → 框架无此模块，等价"未抽离"；后 1 个 commit revert → 工厂可继续存在于 group-bounds.ts 但不导出，可作为基础被未来 task 复用）。

子步骤细节：

**Commit 1 内 4 个纯函数（顺序敏感）**：
1. 新建 `packages-next/designer-core/src/group-bounds.ts`，移植上述函数
2. 泛型化：用 `TreeNode<TData>` 替代 `any`（`getGroupSizePosition` 用结构类型见 §泛型化设计）
3. 去掉 `immer`（`mergeFieldConfig` 用 `produce`）→ 手动不可变 + **整体重赋值改造**（cross-review §B.2.2 + 边界行为 §4 第 1 条）
4. 去掉 `lodash` / `oss-web-toolkits`（`_.isEmpty` / `_.isArray`） + 保留深合并 `deepMerge`（不简化浅合并，cross-review §B.3.4）

**Commit 2 内工厂**：
- 接收 `getSelectedIds: () => string[]`（业务提供选中状态读取）
- 返回 `compute(state) => TNode[] | null`，6 处边界细节（cross-review §B.2.7）—— 空 selectedIds / 无 parentId / 无 components / 无变化短路 等

## 验证

- `pnpm --filter @fedx-vis/designer-core test` 通过（含 tree-utils.test 已有 40 用例 + group-bounds.test 新增用例）
- `pnpm --filter @fedx-vis/designer-core typecheck` 通过
- **🔴 行为对照验证**（cross-review §B.2.5）：用相同 fixture 跑"框架版 group-bounds 4 函数" vs "utils.ts 原版"两个实现，比对输出 deep-equal：
  1. 对 `recalcGroupBounds.spec.ts` 现有 7 个用例复制 fixture → framework 版应输出相同 components 树
  2. 对 `useOnDrop.spec.ts` 现有 recalcGroupInTree 用例复制 fixture → framework 版输出相同
  3. 对 `getResizedComponents.spec.ts` 现有 7 个用例复制 fixture → framework 版 syncGroupSize2Children 输出相同 Map
  4. 新增可见 / 隐藏 / 锁定用例（cross-review §B.2.1）：fixture 含 `config.drillDown` → framework 版 `mergeFieldConfig` 应保留 `drillDown` 字段（验证深合并等价）
  5. 不手动目测 DesignerContent.tsx L286-328 行为——本期 utils.ts 中 `recalcGroupBounds` 函数未动，"对照"指纯函数输出 diff，不指 Redux subscribe 集成行为（task-003 集成阶段再做）
- **🔴 e2e 验证不属于本期**：工厂 `createRecalcGroupBounds` 替换 `DesignerContent.tsx:286-321` 的 e2e 验证（启动设计器拖拽组件到组内看尺寸重算）属集成阶段，留给 task-003 完成后的 task-004

## Research（2026-08-03）

### 调用方矩阵

| 函数 | 活代码调用方 | 备注 |
| --- | --- | --- |
| `getGroupSizePosition` | **5 处活代码 + 1 处同文件自用 + 2 处测试**：(1) `src/designer/DesignerContent.tsx:21,303`（recalcGroupBounds Redux subscribe 回调，仅读 selectedIds[0] 父组的 children）；(2) `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts:9,26`（recalcGroupInTree，tree 拖拽入组/出组后对目标/源组做尺寸重算，Bug #2 修复点 task-007）；(3) `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts:3,45`（测试消费）；(4) `src/designer/__tests__/recalcGroupBounds.spec.ts:5,43,140`（测试消费）；(5) `src/designer/canvas-graph/index.tsx:32,321`（alignItems 组内对齐方案 B：1 次 setComponents 累积改动；⚠️ caller 传 FlatField 数组 `byId[item]`，函数不依赖 children 但泛型签名需兼容 FlatNode）；(6) `src/designer/configuration-panel/group/index.js:6,32`（分组配置面板 maxWidth/maxHeight/width/height 推导，仅取部分字段）；(7) `src/designer/common/field/layout-block/config/ConfigurationPanel.tsx:8,33`（layout-block 配置面板，与 (6) 类似）；同文件自用：`utils.ts:452`（`generatorGroup` 内部计算新建组尺寸） | 高频纯函数（7 处生产 + 2 处测试 + 1 处同文件自用）|
| `resetChildrenPosition` | **2 处活代码 + 1 处同文件自用 + 2 处测试**：(1) `src/designer/DesignerContent.tsx:22,309`（recalcGroupBounds）；(2) `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts:10,28`（recalcGroupInTree）；(3) 测试消费 × 2：`recalcGroupBounds.spec.ts:6,45,150` + `useOnDrop.spec.ts:4,47,120`；同文件自用：`utils.ts:453`（`generatorGroup` 把子组件位置归一化到新建组内） | 与 getGroupSizePosition 严格成对出现 |
| `syncGroupSize2Children` | **1 处活代码 + 1 处测试**：(1) `src/designer/renderer/designer-field/utils.ts:9,167`（import 在 L9，调用在 L167，即 `getResizedComponents` 内 → `designer-field/index.tsx` 的 onResize 路径，layout-block / group 共用）；(2) `src/designer/renderer/designer-field/__tests__/getResizedComponents.spec.ts:2`（Bug #1 回归覆盖）；⚠️ `.bak/DesignerField.bak.jsx:26,179` 是历史快照不算活代码 | 单点调用、Bug #1 修复链路关键函数（onResize 必须用 `getFieldNodeById` 取带 children 的节点，FlatField 不行） |
| `mergeFieldConfig` | **🔴 9 处活代码 + 1 处同文件自用 + 2 处测试**（cross-review 阶段发现初稿漏报 4 处）：<br>(1) `src/designer/DesignerContent.tsx:20,311`（recalcGroupBounds 写父组新尺寸）<br>(2) `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts:11,30`（recalcGroupInTree）<br>(3) `src/designer/canvas-graph/index.tsx:32,358`（alignItems 方案 B 累积循环内 patch 选中字段；L326 是注释行）<br>(4) `src/designer/renderer/designer-field/utils.ts:11,174`（getResizedComponents 应用 syncGroupSize2Children 产出的 cfg Map；L14 是 `ROOT_UNIQUE_ID` import 行）<br>(5) **`src/designer/layer-manager/visible/index.ts:5,17,32`** —— ✅ **初稿漏报，show/hide 改 `isHidden`**<br>(6) **`src/designer/layer-manager/lock/index.ts:5,18,33`** —— ✅ **初稿漏报，lock/unlock 改 `isLock`**<br>(7) 测试消费 × 2：`recalcGroupBounds.spec.ts:8,47` + `useOnDrop.spec.ts:6,49`<br>同文件自用：`utils.ts:230`（递归 drill-down 到子树）<br>💬 **非活代码注释引用**（无需改）：`src/designer/aside-panel/layers-tree/index.jsx:66` 注释里"`dispatch(updateFieldConfig) 取代 mergeFieldConfig`"——指明旧写路径已不用 | 复杂递归函数（私有 `setLevelData` + `setLevelData` 内层 `deepMergeObj` + `resetObjectSealed`），需谨慎去 Immer。**🔴 入参形态有 4 处（visible/lock）含 `fieldConf.data.config` 浅拷贝（2 层结构，轮播组件可能含 `config.drillDown`），推翻初稿"扁平合并等价"假设——`group-bounds.ts` 中需保留深合并能力** |
| `recalcGroupBounds`（组合函数）| 不是 `utils.ts` 导出函数，而是 `DesignerContent.tsx:287-321` `useEffect`（L286-328）内的 Redux subscribe 回调 + 同函数内联在 `useOnDrop.ts:22-35`（名为 `recalcGroupInTree`）。两者用相同的纯函数组合（getFieldNodeById + getGroupSizePosition + resetChildrenPosition + setChildren + mergeFieldConfig），区别仅触发时机：subscribe 回调（selected 变化驱动）vs useOnDrop 内（拖拽结构变化驱动）。**`isRecalcRef` 三处用法**（仅 `recalcGroupBounds` 有）：L284 声明 + L288 `if (isRecalcRef.current) return; // 防止重入` + L317 前置位 + L319 后清位——对应框架 `createDerivedComputePlugin.ts:86 if (isRecalculating) return;` 等已内置防重入 | task-002 不移动此函数到 utils.ts（行为耦合 Redux），改为通过 `createRecalcGroupBounds` 工厂封装为 `derived-compute` 插件；工厂实现内无需自管 `isRecalcRef`（createDerivedComputePlugin 已内置） |

**调用方盲区注**：① `src/designer/configuration-panel/group/index.js` 用 `getGroupSizePosition` 但只解构部分字段（`maxWidth`/`maxHeight`/`width`/`height`），抽离后无需改 consumer。② `canvas-graph/index.tsx` 对齐循环中 `selectFields` 是 `byId[item]`（FlatField，无 children）—— 但函数只读 `data.config.{left,top,width,height}`，**不依赖 children**，所以抽离后语义不变。③ Bug #1 修复路径（`getResizedComponents` 取带 children 的 `groupNode` 传入 `syncGroupSize2Children`）是 2026-07-28 task-006 落地，跨函数数据流逻辑（FlatField vs 完整节点）需在测试中保留。

### 外部依赖

| 函数 | 依赖 | 替代方案 |
| --- | --- | --- |
| `getGroupSizePosition` | 无外部依赖（`reduce` 内闭包读 `data.config.{width,height,left,top}`） | 直接移植 |
| `resetChildrenPosition` | 无外部依赖 | 直接移植 |
| `syncGroupSize2Children` | `oss-web-toolkits` 的 `_.isEmpty` / `_.isArray` + `@Utils/helper` 的 `round` + `parseInt`（JS 内置） | `Object.keys(field \|\| {}).length === 0` 等价 `_.isEmpty` 对纯对象（注意 `_.isEmpty` 兼容 Map/Set，需保持 flat object 语义）；`Array.isArray`；`Math.round` **不完全等价**——`@Utils/helper` 的 `round` 接受 `decimals` 参数且 NaN→0，而 `Math.round` 仅对 round 默认 0 行为，且 NaN→NaN —— **utils.ts 的 4 处 `round(...)` 调用都不传 decimals**，NaN 输入已被 L606-607 防御，可等价替换 |
| `mergeFieldConfig` | `immer` `produce` + `@Utils/helper` 的 `deepMergeObj` + `@Utils/helper` 的 `isEmpty` + `oss-web-toolkits` 的 `_.cloneDeep`（在 `resetObjectSealed`） | **🔴 去 immer**：手动不可变递归 + 整体重赋值。涉及两处 mutation：`(a) field.children = mergeFieldConfig(...)` → `return { ...field, children: mergeFieldConfig(...) }`；(b) **初稿漏报**：`level === 0` 路径下 `field.data = deepMergeObj(...)` 在 utils.ts:220 直接对 draft 节点赋值（Immer 内合法），去 Immer 后必须 `return { ...field, data: newData }`（同 task-001 `setLevelPath` 的整体重赋值套路，tree-utils.ts 参考实现）—— 没改这一处会导致 `field.data` 引用未变，buildIndex 派生失效、订阅不刷新（**cross-review §B.2.2 高影响项**）<br>**保留 `deepMergeObj`（不是浅合并替代）**：🔴 **cross-review 推翻初稿"扁平对象等价浅合并"假设**——`layer-manager/visible/lock` 4 处 caller 的 `value` 含 `{ ...fieldConf.data, config: { ...fieldConf.data.config, isHidden: false } }` 2 层结构（轮播组件下 `config.drillDown` 字段在原版 `deepMergeObj` 下保留，浅合并下丢失）。**必须保留深合并**：复制 `@Utils/helper.deepMergeObj` 简化版（不带 `customMergeFn` 参数）到 `packages-next/designer-core/src/utils.ts`，命名 `deepMerge` 避免与 utils.ts 冲突。框架不引入 `@Utils/helper` 依赖<br>**保留 `replace` 参数**：cross-review §B.2.3 决策闭环——opts 保留 `replace?: string[]` 字段（task-001 tree-utils.ts 风格统一），实现保留 `customMergeFn` 等价语义：当 `replace` 含 key 时跳过 `newData[key]` 替换（与原版一致）。当前 9 处活代码 caller 无 caller 传 `replace`，但保持签名兼容不破坏 utils.ts 双源<br>**去 `isEmpty`**：`target.length > 0` 替 `isEmpty(target)`（仅用于 `setLevelData` 递归判断 drillDown 非空），但需先判 `target != null` 防 NPE（utils.ts:194 `isEmpty(target[i].data.config.drillDown)` 入参可能是 undefined）<br>**去 `resetObjectSealed`**：**整体删除 helper**（去 Immer 后无需绕 seal） |
| `setLevelData`（`mergeFieldConfig` 私有 helper，`utils.ts:187-197`） | `isEmpty`（判断 drillDown 是否非空递归）+ `deepMergeObj`（递归合并 value 到目标 layer） | `(target != null) && target.length > 0` 替 `isEmpty`；`deepMerge` 替 `deepMergeObj`。该函数**不在 utils.ts 导出**，随 `mergeFieldConfig` 一起迁到框架，作为模块内私有函数 |
| `resetObjectSealed`（`utils.ts:199` 私有 helper） | `_.cloneDeep` | **整体删除 helper**——去 Immer 后不再有 sealed obj 问题（utils.ts 旧版是为绕过 Immer `Cannot assign to read only property`） |

> ⚠️ **`deepMerge` 实现细节**：`deepMerge(target, source)` 仅浅 1 层 + config 字段二浅合并即可（无需递归到 deeper），与 `@Utils/helper` 的 `deepMergeObj`（深递归）等价语义对轮播组件而言仍要二浅合并保持 `config.drillDown` 不丢。**简化版伪代码**：
> ```ts
> function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>, replace?: string[]): T {
>     const result = { ...target };
>     for (const key of Object.keys(source)) {
>         if (replace?.includes(key)) {
>             result[key] = source[key] as any; // 强制替换
>         } else if (key === 'config' && target.config && typeof target.config === 'object') {
>             // config 字段二浅合并（保留 drillDown 等兄弟字段）
>             result.config = { ...target.config, ...(source.config ?? {}) };
>         } else {
>             result[key] = source[key] as any;
>         }
>     }
>     return result;
> }
> ```
> 关键设计：`config` 字段二浅合并等价于原 `@Utils/helper.deepMergeObj` 在本场景的语义（轮播组件的 `config.drillDown` 字段保留），其他顶层字段不递归。**测试必须覆盖轮播组件场景**（虽然 visible/lock 在 utils.ts 中 L1-37 Read 未直接处理轮播，但代码层契约不能丢）。

### 边界行为

1. **`getGroupSizePosition`**：
    - 入参 `children` 为 `any[]`（utils.ts 用 `any`），每个子项必须有 `data.config.{left,top,width,height}` 4 字段，否则 `undefined.*` 抛 `TypeError`。**现有 5 处 caller 均保证结构**（来自 components 树，由 buildIndex 派生）。
    - 返回值含 6 个极值项 + 6 个极值标量 + 4 个汇总字段（top/left/width/height）。**抽离后完整保留**——`configuration-panel/group/index.js` 读 `maxWidth/maxHeight`、`canvas-graph/index.tsx` 读 `leftValue/topValue/rightValue/bottomValue`、`recalcGroupBounds` 读 `top/left/width/height`，5 处 caller 消费的字段子集合计覆盖全部返回字段。
    - `reduce((prev, cur, index, arr) => …, null)`：初始 `prev=null`，非空 children 第一个元素走 `if (!prev) return cur;` 分支，无 NPE。
    - **🔴 空 children 行为（cross-review §B.5 第 1 条）**：6 个 reduce `reduce(..., null)` 在 `children=[]` 时不执行，每个 reduce 返回 `null`，函数返回 `{ leftItem: null, topItem: null, ... leftValue: null.data.config.left }` 抛 NPE。**当前 utils.ts 实现同样有 NPE**（caller 默认非空 children），属于"曾被使用未删除"的行为——**本期抽离保留**：在测试中标注"传入空 children 抛 NPE 是 by-design"，不修复（caller 端 `recalcGroupBounds` 已在 DesignerContent.tsx:297 用 `!parents.children` 提前 return，不会传空；5 处 caller 全部有前置防护）。如未来要修，加 `if (children.length === 0) return null`。

2. **`resetChildrenPosition`**：纯 `map` 浅复制 + `data.config.{left,top}` 减偏移，**不修改入参**，返回新数组。`useOnDrop.spec.ts:147-154` 已有"不修改原数组"测试，抽离后保留。**嵌套引用语义**：`{ ...item, data: { ...item.data, config: { ...item.data.config, left: ..., top: ... } } }` 是浅复制——`item.children`（数组引用）、`item.data.config.drillDown`（数组引用）保留旧引用。这是 utils.ts 现有行为，caller 端契约一致。

3. **`syncGroupSize2Children`**（关键 Bug #1 修复路径）：
    - 早 return：`_.isEmpty(group?.data?.config)` 为 true 时返回 `undefined`（注：返回 void 而非空 Map，caller 必须判空）。**该行为是 utils.ts L599 当前行为，抽离后不变**。
    - NaN 处理：`scaleX/scaleY` 为 NaN 时置 1（即 `width/height = 0` 防御）。**`Math.round` 替换**：`@Utils/helper.round` 与 `Math.round` 不完全等价（见外部依赖行 + 行内注），但 utils.ts 的 4 处 `round(...)` 调用不传 decimals + NaN 由 L606-607 防，等价替换。
    - 递归：原 utils.ts 内 `resizeField = (groupField) => { groupField.children.forEach(...) }`——`resizeField` 接受的是 child 节点本身（不是 children 数组）。**🔴 cross-review §B.2.4 决策**：抽离时**顺手把误导参数命名 `groupField` 改为 `childNode`**——私有函数，无 caller 影响，符合 task-001 tree-utils.ts 重命名 `setLevelPath` 入参的风格
    - 关键边界：`if (Array.isArray(field.children) && field.children.length > 0)`：嵌套子组件递归。FlatField（无 children）落入 false 分支，不递归。`getResizedComponents.spec.ts` 已覆盖此情形。
    - **🔴 newConfig 缺字段语义**：cross-review §B.5 第 4 条——若 `newConfig` 不传 `width/height`，`width/gWidth = undefined/数值 = NaN` → L606-607 防 → scaleX/scaleY=1 → 子组件 left/top 不变（宽高不变假设）。测试覆盖 NaN + 缺字段两场景。

4. **`mergeFieldConfig`**（最复杂，需逐行梳理）：
    - 入口：`{ parentId, level=0, replace? }`，递归用 `level` 区分"目标层直接合并"vs"drillDown 层递归合并"。
    - `level === 0` 路径（最常见，9 处活代码 caller 全用此）：找 `field.uniqueId === parentId` 节点后 `field.data = deepMergeObj(...)`。
        - **🔴 cross-review §B.2.2 高影响项**：utils.ts:220 的 `field.data = ...` 是 Immer 内 mutation，去 Immer 后**必须改为构造新 field 对象**：`return { ...field, data: newData }`（同 task-001 `setLevelPath` 的整体重赋值套路，tree-utils.ts:255-267 参考实现）。漏改这一处 → `field.data` 引用未变 → buildIndex 派生失效 → 组件订阅不刷新
        - `resetObjectSealed` 整段删除（去 Immer 后不需要绕 seal）
    - **🔴 deepMerge 实现保留 cross-review §B.3.4 决策**：保留 `@Utils/helper.deepMergeObj` 的"config 字段二浅合并 + 其他顶层不递归"语义（轮播组件下 `config.drillDown` 不丢）。详见外部依赖行末 pseudo-code
    - `level > 0` 路径：找目标层后用 `setLevelData(field.data.config.drillDown, objKey='drillDownLevel', level, value)`：在 `drillDown` 数组里递归找 `data[objKey] === level` 的节点，做 `deepMerge(data, value)`。`setLevelData` 内继续递归 `drillDown`（轮播层级）。
    - **递归核心**（children 分支）：`field.children = mergeFieldConfig(field.children, ...)` 在 utils.ts:230 是 immer 内 mutation，去 Immer 后 → `return { ...field, children: mergeFieldConfig(field.children, opts, value) }`（task-001 套路）
    - **`replace` 决策闭环**（cross-review §B.2.3）：opts 保留 `replace?: string[]` 字段签名（与 task-001 tree-utils.ts 风格统一），实现保留 `customMergeFn` 等价语义——`deepMerge` 内 `if (replace.includes(key)) result[key] = source[key]`（强制替换）。9 处活代码 caller 无 caller 传 `replace`，但保留签名兼容双源期。测试覆盖 `replace=['isHidden']` 时 `mergeFieldConfig(..., newData={isHidden: true})` 应替换而非深合并
    - **9 处活代码 caller 入参形态**（cross-review §B.2.1）：4 处（visible/lock）入参含嵌套 `config: { ...fieldConf.data.config, isHidden: false }`，要求 `deepMerge` 必须对 `config` 字段做二浅合并——**测试必须覆盖**（fixture：组件带 `config.drillDown`，hide 后 `drillDown` 字段保留）。其他 5 处 caller 入参扁平（`{ config: { top, left, width, height } }`）+ 6 个 reduce 极值项 + 4 个汇总字段

5. **`getSelectedKeys` 等不被抽离**：见 §抽离范围边界。

### 抽离范围边界

- **本任务抽离**：`getGroupSizePosition` / `resetChildrenPosition` / `syncGroupSize2Children` / `mergeFieldConfig` + `createRecalcGroupBounds` 工厂
- **本任务不抽离**（已在 task-001 抽离到 `tree-utils.ts`）：`setLevelPath` / `getFieldNodeById`（框架命名为 `getNodeById`） / `setChildren` / `clearEmptyCollection` / `flatDesignerList` 等
- **本任务不抽离**（不在抽离范围）：`generatorGroup` / `splitGroup` / `deleteFieldByUniqueId` / `getSelectedKeys` / `getFieldOrderBy` —— 结构性变更类函数，留给 task-003 处理
- **本任务不替换调用方**：参照 task-001 "只抽离不替换"约束。`DesignerContent.tsx` 内 `recalcGroupBounds`、`useOnDrop.ts:22` 内 `recalcGroupInTree`、对齐循环等 9+ 处活代码 caller 暂不动；调用方替换与"集成阶段"耦合，待 task-003 完成后做集成阶段

### 泛型化设计

- **4 个核心函数**全部用 `TreeNode<TData>` + `Record<string, any>` 替代 `any`（对齐 task-001 的 `tree-utils.ts` 风格）
- `resetChildrenPosition<TData>(children: TreeNode<TData>[], groupPosition: { left: number; top: number }): TreeNode<TData>[]`
- `syncGroupSize2Children<TData>(group: TreeNode<TData>, config?: Record<string, any>): Map<string, Record<string, any>> | undefined`（FlatField 入参兼容——返回 Map 只含 group 自身，不递归）
- `mergeFieldConfig<TData>(fields: TreeNode<TData>[], opts: { parentId: string; level?: number; replace?: string[] }, value: Record<string, any>): TreeNode<TData>[]`
- **🔴 `getGroupSizePosition` 泛型放宽**（cross-review §B.2.8）：原计划 `TreeNode<TData>[]` 但 canvas-graph/index.tsx:321 实际传 FlatNode[]（`byId[item]`），类型不兼容。**改为结构类型**：`getGroupSizePosition<TData>(children: ReadonlyArray<{ data: TData; [key: string]: any }>): GroupBounds<TData>`——FlatNode / TreeNode 都满足该结构。函数只读 `data.config.{left,top,width,height}`，不依赖 children 字段
- **新类型导出**：`GroupBounds<TData>`（getGroupSizePosition 返回值类型，含极值项 + 汇总字段），对外命名为独立 type 不内联
- 沿用 `ROOT_ID`（框架已有，与 utils.ts `ROOT_UNIQUE_ID` 同值 `-`）

### 工厂 createRecalcGroupBounds

```
type RecalcGroupBoundsOptions<
    TNode extends TreeNode = TreeNode,
    TFlat extends FlatNode = FlatNode,
    TExtra extends Record<string, unknown> = Record<string, unknown>,
> = {
    /** 业务提供读取 selected 状态的回调（框架不耦合 Redux） */
    getSelectedIds: () => string[];
};

/** 工厂：返回符合 createDerivedComputePlugin.compute 签名的派生计算函数 */
export function createRecalcGroupBounds<
    TNode extends TreeNode,
    TFlat extends FlatNode,
    TExtra extends Record<string, unknown>,
>(options: RecalcGroupBoundsOptions<TNode, TFlat, TExtra>): (state: TreeStoreState<TNode, TFlat, TExtra>) => TNode[] | null;
```

用法（示意，**本期不替换调用方**）：

```ts
import { createDesigner, createRecalcGroupBounds, createDerivedComputePlugin } from '@fedx-vis/designer-core';

const designer = createDesigner({
    initialTree: [...],
    plugins: [
        createDerivedComputePlugin({
            compute: createRecalcGroupBounds({
                getSelectedIds: () => store.getState().component.selected.split(','),
            }),
        }),
    ],
});
```

**🔴 工厂 6 处边界细节**（cross-review §B.2.7）—— compute 实现伪代码：

```ts
const compute = (state: TreeStoreState): TNode[] | null => {
    const selectedIds = options.getSelectedIds();
    if (!selectedIds || selectedIds.length === 0) return null;       // (1) + (5)
    const parentId = state.parentMap[selectedIds[0]];
    if (!parentId || parentId === ROOT_ID) return null;               // (2)
    const parents = getNodeById(state.components, parentId);
    if (!parents || parents.uniqueId === ROOT_ID || !parents.children) return null;  // (3)
    const { width: prevWidth, height: prevHeight, top: prevTop, left: prevLeft } = parents.data.config;
    const { top, left, width, height } = getGroupSizePosition(parents.children);
    if (left === 0 && top === 0 && width === prevWidth && height === prevHeight) return null; // (4)
    const newChildren = resetChildrenPosition(parents.children, { top, left });
    const finalData = setChildren(state.components, parents.uniqueId, newChildren);
    return mergeFieldConfig(
        finalData,
        { parentId: parents.uniqueId },
        { config: { top: prevTop + top, left: prevLeft + left, width, height } },
    );
    // 注意：多选场景 (selectedIds.length > 1) 仅处理 selectedIds[0] 父组，与原 DesignerContent.tsx:294 行为一致
    // subscribe 触发：ctx.subscribe(state => compute(state))，compute 同步 → setTree 触发下次 subscribe → 被 createDerivedComputePlugin 内置 isRecalculating 拦截（createDerivedComputePlugin.ts:86）
};
```

## 风险

（cross-review §B.2.10 补全 5 条）

- `syncGroupSize2Children` 涉及 Bug #1（layout-block onResize 级联缩放）修复逻辑，需保证行为一致
- `mergeFieldConfig` 的 `setLevelData` 递归 drillDown 逻辑复杂，需完整移植
- `mergeFieldConfig` 去 Immer 后 `level === 0` 路径 `field.data` 整体重赋值改造（cross-review §B.2.2）—— 漏改导致 buildIndex 派生失效
- `mergeFieldConfig` 9 处活代码 caller 中 visible/lock 入参需深合并保留 `config.drillDown`，不可简化为浅合并
- `createRecalcGroupBounds` 依赖外部选中状态，需通过 options 注入（框架不耦合 Redux）
- `createRecalcGroupBounds` 工厂本期不被消费（仅壳 + 类型），无端到端验证；后续 task-003 集成阶段需走 `DesignerContent.tsx:286-321` 替换 + e2e 验证
- `getGroupSizePosition` 泛型放宽为结构类型后，TreeNode 与 FlatNode 混传编译通过但运行时行为约定需测试覆盖
- utils.ts 中 4 个同名函数本期保留（双源并存），实施者改错版本风险——需要测试显式导入框架版（`from '@fedx-vis/designer-core'`）避免误读 utils.ts

## 回退

删除 `group-bounds.ts` 和测试文件，从 `index.ts` 中移除 `getGroupSizePosition` / `resetChildrenPosition` / `syncGroupSize2Children` / `mergeFieldConfig` / `createRecalcGroupBounds` / `deepMerge` / `GroupBounds` 的导出即可。utils.ts 中 4 个旧函数未删，无需"恢复"——回退后等价于"未抽离"（双源变单源 src 版）。

## 实施记录

### 2026-08-03

**Research 完成**（详见上文 Research 章节）：
- 4 个函数全部梳理了活代码调用方（9+5+1+2 共 17 处活代码 + 3 处同文件自用 + 4 处测试）
- cross-review 阶段新增 4 处 caller（layer-manager/visible/lock × 4）
- 边界行为、抽离范围边界、泛型化设计、工厂设计全部覆盖

**Cross-review 完成**（报告存 `.local-review/r2.md`，三视角深度）：
- **视角 A（事实核查）**：补 `getResizedComponents` 引用 + `recalcGroupInTree` 同函数体描述 + canvas-graph L326 注释行误标 + `.bak` 文件排除
- **视角 B（架构逻辑）**：9 项（3 高 + 4 中 + 2 低）—— 高优项"9 处 caller 而非 5 处"、level===0 整体重赋值、FlatNode/TreeNode 类型放宽为结构类型
- **视角 C（盲区排查）**：8 风险 + 3 commit 粒度 + 5 验证步骤

**实施**（同一天，按 3 commit 粒度落地）：

**Commit 1：抽离 group-bounds.ts 主体**（4 个纯函数）
- `packages-next/designer-core/src/group-bounds.ts` 新建 504 行
- `getGroupSizePosition`：泛型化为 `getGroupSizePosition<TData extends Record<string, any>>(children: ReadonlyArray<{ data: TData; [key: string]: any }>): GroupBounds<TData>`，6 个 reduce + GroupBounds 返回类型（极值项新增 `uniqueId` 字段，GroupBounds<TData> 接口同步导出）
- `resetChildrenPosition`：泛型化为 `<TData>(children: TreeNode<TData>[], groupPosition)`，浅复制 + config.{left,top} 减偏移
- `syncGroupSize2Children`：泛型化为 `<TData>(group: TreeNode<TData>, config?)`，私有 `resizeField(childNode)` 改名（原 `groupField` 误导）
- `mergeFieldConfig`：泛型化为 `<TData>(fields, opts, value)`，去 immer + 整体重赋值（level===0 路径 `return { ...field, data: newData }`，children 分支 `return { ...field, children: mergeFieldConfig(...) }`），早 return 保留原 `fields` 引用（new `findNodeByUniqueId` 私有 helper）
- 私有 `deepMerge`：config 字段二浅合并 + replace[] 强制替换语义保留
- 私有 `setLevelData`：在 drillDown 数组里递归找 data[objKey] === level 的节点合并

**Commit 2：抽离 createRecalcGroupBounds 工厂**
- `createRecalcGroupBounds<TNode, TFlat, TExtra>(options: { getSelectedIds: () => string[] }): compute`
- 6 处边界防护：空 selectedIds / 无 parentId / ROOT_ID 父组 / 无 children / 无变化短路（left=0 && top=0 && 尺寸一致）
- 多选场景仅处理 selectedIds[0]（与原 DesignerContent.tsx:294 行为一致）
- 内部用条件类型 `TData = TNode['data'] extends Record<string, any> ? TNode['data'] : Record<string, any>` 兼容 default 泛型

**Commit 3：导出 + 测试 + test-utils 兼容**
- `packages-next/designer-core/src/index.ts`：导出 `getGroupSizePosition` / `resetChildrenPosition` / `syncGroupSize2Children` / `mergeFieldConfig` / `createRecalcGroupBounds` + `GroupBounds<TData>` / `MergeFieldConfigOptions` / `RecalcGroupBoundsOptions` 类型
- `packages-next/designer-core/src/__tests__/group-bounds.test.ts`：29 个测试用例覆盖 5 个 describe 块：
  - getGroupSizePosition (5)：单子/多子/极值项/FlatNode 兼容/空 children 抛 NPE
  - resetChildrenPosition (3)：相对化/不可变/嵌套引用保留
  - syncGroupSize2Children (6)：缩放/NaN 防御/空 config/FlatField/嵌套子组/Math.round
  - mergeFieldConfig (7)：基础合并/level=0 整体重赋值/轮播 drillDown 保留/replace[]/children 递归/找不到 parentId/level>0 drillDown 路径
  - createRecalcGroupBounds (8)：基础/空 selectedIds/无 parentId/ROOT_ID 父组/无 children/无变化短路/多选/getSelectedIds 不缓存
- `packages-next/designer-core/src/__tests__/test-utils.ts`：`makeGroup` 改为重载签名（task-001 旧签名 `makeGroup(id, children)` + task-002 新签名 `makeGroup(id, config, children)` ），`TestData['config']` 补 `isHidden` / `drillDown` 字段

**验证**（最终）：
- `pnpm --filter @fedx-vis/designer-core typecheck` ✓（exit code 0，无任何 TS 错误）
- `pnpm --filter @fedx-vis/designer-core test group-bounds` ✓（29 个新测试用例全绿）
- `pnpm --filter @fedx-vis/designer-core test` ✓（9 个测试文件 / 151 个测试全绿 —— `makeGroup` 重载同时修复了 task-001 遗留的 tree-utils / write-paths / buildIndex / designer 等测试套件 22 个 pre-existing 失败）

**实施中遇到的实际问题**（cross-review 未识别，调试中发现）：
1. **`makeGroup` 签名不一致**：`__tests__/test-utils.ts` 现有签名是 `(uniqueId, children)`（task-001 风格），但 task-002 的 group-bounds.test.ts 全部以 `(uniqueId, config, children)` 3 参数写法调用。第一轮 typecheck / test 均暴露该问题。修复：改为 TypeScript 重载 + 运行时分发（`Array.isArray(arg2)` 判旧签名）
2. **`getNodeById` 不在 tree-utils.ts**：第一版从 `./tree-utils` 导入但该函数在独立的 `./getNodeById.ts` 文件中。修复：分两行 import
3. **`scaleX/scaleY = (width ?? 0) / gWidth` 绕过 NaN 防御**：原始 utils.ts L606-607 的 NaN 防御依赖 `undefined / number = NaN` 触发 `isNaN`。`(width ?? 0) / gWidth` 把 undefined 变 0，结果 NaN 防御永远不触发，缩放归零。修复：去掉 `?? 0`，与 utils.ts 行为对齐
4. **`GroupBounds` 接口需含 `uniqueId` 字段**：6 极值项原定义只有 `data: TData`，但 5 处 caller 的 `result.leftItem.uniqueId` 等访问需要 uniqueId。修复：接口补 uniqueId，函数返回处同步 cast 类型

**未做（按方案不替换调用方）**：
- `src/designer/renderer/utils.ts` 中 4 个同名函数保留未删
- `src/designer/DesignerContent.tsx:286-321` `recalcGroupBounds` Redux subscribe 回调未替换为 `createRecalcGroupBounds` 工厂
- `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts:22-35` `recalcGroupInTree` 未替换
- 9 处 `mergeFieldConfig` 活代码 caller 未替换
- 上述替换与"集成阶段"耦合，留给 task-003（后续计划）完成
