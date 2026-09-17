# task-2026-08-03-001：designer-core 树遍历工具抽离

## 背景

designer-core 框架已成型（store + hooks + 插件壳），但 `src/designer/renderer/utils.ts` 中的树遍历纯函数尚未抽离到框架。这些函数无业务耦合、无副作用，是抽离风险最低的一类。

## 目标

将以下纯函数从 `src/designer/renderer/utils.ts` 抽离到 `packages-next/designer-core/src/tree-utils.ts`，泛型化 + 完整 TS 类型 + 单元测试：

| 函数 | 现有位置 | 用途 |
| --- | --- | --- |
| `flatDesignerList` | utils.ts L529-547 | 遍历树生成一维数组，追加 parentUniqueId 链 |
| `eachTreeNode` | utils.ts L552-569 | 递归遍历每个节点，支持提前终止 |
| `fieldVisitor` | utils.ts L575-593 | 递归查找有 children 的节点 |
| `orderBy` | utils.ts L248-253 | 数组元素位置移动（不可变） |
| `getFieldOrderBy` | utils.ts L266-273 | 返回节点在数组中的索引 |
| `setLevelPath` | utils.ts L162-178 | 设置 data 上的层级字段（不可变，递归 drillDown） |
| `setChildren` | utils.ts L100-121 | 递归替换指定 id 的 children（不可变） |
| `clearEmptyCollection` | utils.ts L414-435 | 清理空 children 的节点（不可变） |

## 详细步骤

1. **补全** `packages-next/designer-core/src/tree-utils.ts`（**骨架已存在**：前序 designer-core 框架封装 task 已预留 21 行骨架 + import + 头部注释，L19 `import { TreeNode, ROOT_ID } from './types';`，L21 仅 `// === flatDesignerList ===` 章节标记；本次在 L21 之后填充 8 个函数实现，**保留头部注释与 import**）
2. 泛型化：用 `TreeNode<TData>` 替代 `any`
3. 去掉 `immer` 依赖（`setLevelPath` 现有实现用 `produce`，改为手动不可变）
4. 去掉 `oss-web-toolkits`（`_.noop` / `_.isArray` 用 `() => {}` / `Array.isArray` 替代）+ 去掉 `@Utils/helper` 的 `isEmpty`（用 `!fields || fields.length === 0` 替代）
5. 在 `index.ts` 导出
6. 新建 `__tests__/tree-utils.test.ts`，覆盖核心场景

## 验证

- `pnpm --filter @fedx-vis/designer-core test` 通过
- `pnpm --filter @fedx-vis/designer-core typecheck` 通过
- 现有 `src/` 代码不改动（本次只抽离到框架，不替换调用方）

## Research（2026-08-03）

### 调用方矩阵

| 函数 | 活代码调用方 | 备注 |
| --- | --- | --- |
| `flatDesignerList` | `src/store/designer/hooks.ts:191`（useFlatComponents） | 唯一调用方 |
| `eachTreeNode` | **无活代码调用方**（仅 .bak 中有定义，无任何调用） | 可抽离但暂无消费者 |
| `fieldVisitor` | `src/designer/common/draggable/drag2layoutBlock.ts:7` | dragFieldInLayoutBlock 用它遍历 layout-block |
| `orderBy` | `src/designer/layer-manager/move/index.ts:80,101` | moveIndexToUp / moveIndexToDown |
| `getFieldOrderBy` | `src/designer/layer-manager/move/index.ts:35,55,76,97` | 4 个 move 函数都用 |
| `setLevelPath` | `src/designer/layer-manager/visible/index.ts:18,33` + `lock/index.ts:19,34` + `renderer/designer-field/utils.ts:170`（getResizedComponents，Bug #1 onResize 路径） | show/hide/lock/unlock + onResize 子组件级联缩放 |
| `setChildren` | 活代码调用方 7 处：`DesignerContent.tsx:310` + `useOnDrop.ts:29,48,53,63,98` + `move/index.ts:40,61,82,103` + `delete/index.tsx:28` + `copy/index.tsx:28` + `element.tsx:163` + `drag2layoutBlock.ts:53`；同文件自用：`utils.ts:478`（generatorGroup）/ `:510`（splitGroup）；测试消费：`recalcGroupBounds.spec.ts`、`useOnDrop.spec.ts` | 高频工具函数（含同文件自用与测试） |
| `clearEmptyCollection` | `src/designer/layer-manager/delete/index.tsx:29` | 唯一调用方 |

### 外部依赖

| 函数 | 依赖 | 替代方案 |
| --- | --- | --- |
| `setLevelPath` | `immer` produce | 手动不可变：map + 递归 drillDown |
| `eachTreeNode` | `oss-web-toolkits` `_.noop` / `_.isArray` | `() => {}` / `Array.isArray` |
| `fieldVisitor` | `oss-web-toolkits` `_.noop` / `_.isArray` | 同上 |
| `flatDesignerList` | 无外部依赖 | 直接移植 |
| `clearEmptyCollection` | 无外部依赖 | 直接移植 |
| `setChildren` | 无外部依赖 | 直接移植 |
| `orderBy` | 无外部依赖 | 直接移植 |
| `getFieldOrderBy` | `@Utils/helper` 的 `isEmpty`（utils.ts L267） | `!fields || fields.length === 0`（空数组返回 `{ index: -1, components: fields }` 契约保留） |

### 边界行为

1. **`flatDesignerList`**：有 `childrenGroup` 分支（L541-542），虽然代码中没有其他地方设置 `childrenGroup` 字段，但这是历史行为，抽离时保留
2. **`setLevelPath`**：递归处理 `data.config.drillDown`（轮播层级数据），`drillDown` 不进入 byId 索引但进入 setLevelPath 的层级计算。key 默认 `'drillDownLevel'`
3. **`setLevelPath`** 去掉 Immer 的关键：drillDown 赋值 `draft[i].data.config.drillDown = setLevelPath(drillDown, draft[i], key)` 在 produce 内是 mutation，去 Immer 后要改为 `{ ...node, data: { ...node.data, config: { ...node.data.config, drillDown: setLevelPath(drillDown, newNode, key) } } }`
4. **`eachTreeNode`**：支持 callback 返回 truthy 提前终止（设 callback=null），后续递归跳过
5. **`fieldVisitor`**：只遍历有 children 的节点，callback 返回 truthy 时**终止整个遍历**（模块级 `callback` 标志置 null，当前 forEach 剩余 child 与所有嵌套 visitor 全部跳过），与 `eachTreeNode` 语义一致。佐证：`drag2layoutBlock.ts:7-30` 依赖"命中即全局停"
6. **`setChildren`**：`id === ROOT_UNIQUE_ID` 时直接返回 children（根节点替换）
7. **`clearEmptyCollection`**：`shouldClear` 回调判断是否清理，空 children 的 group 被移除

### 泛型化设计

- 所有函数用 `TreeNode<TData>` 泛型化
- `setLevelPath` 的 `key` 参数保留（默认 `'drillDownLevel'`）
- `flatDesignerList` 返回类型：`(TreeNode<TData> & { parentUniqueId: string[] })[]`
- `eachTreeNode` / `fieldVisitor` 的 iterator 签名：`(node: TreeNode<TData>, index: number | null, parent: TreeNode<TData> | null) => boolean | void`
- `clearEmptyCollection` 的 `shouldClear` 签名：`(node: TreeNode<TData>) => boolean`
- `ROOT_UNIQUE_ID` → 框架已有 `ROOT_ID`（值相同 `'-'`），用框架的

## 风险

- `setLevelPath` 去掉 Immer 后需保证不可变语义正确（drillDown 递归），且必须保持"返回新数组"的契约——`designer-field/utils.ts:170` 的 onResize 路径（Bug #1 修复）依赖此契约（task-009 强调"必须接收返回值"，旧 mutation 版直接改 results 引用会破坏该路径）
- `flatDesignerList` 的 `childrenGroup` 分支需保留（现有逻辑遍历 childrenGroup）
- `eachTreeNode` 无活代码调用方，抽离后暂无消费者，但保留以备后续使用
- `tree-utils.ts` 骨架注释 L17 写有错误的"`_.isEmpty` 用原生替代"（同 §1.2 高优先级项），实施时需同步修正骨架注释

## 回退

删除 `tree-utils.ts` 和测试文件，恢复 `index.ts` 导出即可。

## 实施记录

### 2026-08-03

**Research 完成**（详见上文）：
- 8 个函数全部梳理了活代码调用方 + 外部依赖 + 边界行为 + 泛型化设计

**Cross-review 完成**（报告存 `.local-review/r1.md`，评级 B）：
- 8 处问题（3 高 + 2 中 + 3 低）已全部修复到文档与骨架代码：
  - 拆开 `getFieldOrderBy` 依赖（@Utils/helper.isEmpty），去掉错误"`_.isEmpty`"
  - "新建"改"补全"，明确 tree-utils.ts 骨架已存在
  - `setLevelPath` 调用方补 `designer-field/utils.ts:170`（Bug #1 路径）
  - `fieldVisitor` 终止语义改为"终止整个遍历"
  - 行号 + 同文件自用 + eachTreeNode 表述 等低优先项

**实施**（同一天）：
- `packages-next/designer-core/src/tree-utils.ts`：补全 8 个函数实现，全部泛型化 + 去除 immer / `_.noop` / `_.isArray` / `isEmpty` 依赖
- `packages-next/designer-core/src/__tests__/tree-utils.test.ts`：40 个测试用例覆盖核心场景
- `packages-next/designer-core/src/index.ts`：导出 `flatDesignerList` / `eachTreeNode` / `fieldVisitor` / `orderBy` / `getFieldOrderBy` / `setLevelPath` / `setChildren` / `clearEmptyCollection` + `TreeIterator` / `FieldOrderResult` 类型

**验证**：
- `pnpm --filter @fedx-vis/designer-core typecheck` ✓
- `pnpm --filter @fedx-vis/designer-core test` ✓（8 文件 / 122 个测试全绿，tree-utils 新增 40 个全绿）
- `pnpm --filter @fedx-vis/designer-core build` ✓（ESM 19.10 KB / CJS 13.82 KB，gzip 后 5.71 / 4.58 KB）

**实施中发现的小问题（已记入测试注释，不影响行为对齐）**：
- `flatDesignerList` 递归时传 `curr`（不是 `node`），所以 `parentUniqueId` **只到直接父**，不形成完整链路（与 utils.ts 现有行为一致，consumer `layers-tree/tree/index.tsx:49` 用法证实）
- `fieldVisitor` callback 接 `child`，不是 `fieldItem`
- `clearEmptyCollection` 不递归清理"因子节点清理变空"的父节点

**未做（本次按方案只抽离不替换调用方）**：
- `src/designer/renderer/utils.ts` 等 8 个函数保留未删（task-002 / task-003 完成后或未来做"集成阶段"再统一替换调用方）
