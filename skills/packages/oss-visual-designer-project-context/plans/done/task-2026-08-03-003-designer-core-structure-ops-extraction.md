# task-2026-08-03-003：designer-core 结构操作抽离

## 背景

`generatorGroup` / `splitGroup` / `deleteFieldByUniqueId` 等是用户高频操作，designer-core 的 `createStructureToolsPlugin` 只提供注册壳，无实际实现。抽离后可验证框架的插件机制。

task-001（tree-utils.ts）/ task-002（group-bounds.ts）已分别抽离树遍历与组尺寸工具；本任务抽离剩余的结构变更类纯函数到 `structure-ops.ts`，作为可选消费路径。

## 目标

将 5 个结构操作纯函数抽离到 `packages-next/designer-core/src/structure-ops.ts`：

| 函数 | 现有位置 | 用途 |
| --- | --- | --- |
| `generatorField` | utils.ts L69-92 | 新建组件节点（生成 uniqueId + concat 到数组） |
| `generatorGroup` | utils.ts L437-483 | 成组：选中节点 → group 节点包裹 |
| `splitGroup` | utils.ts L484-516 | 拆组：group → 子节点展开回父级 |
| `deleteFieldByUniqueId` | utils.ts L275-303 | 删除节点（返回新数组 + 选中补偿） |
| `getSelectedKeys` | utils.ts L305-321 | 多选时判断是否同层级（返回选中 key） |

## 决策（research 阶段确认）

| ID | 决策 | 理由 |
| --- | --- | --- |
| D1 | **只抽离不替换** | 对齐 task-002 约束（r2.md §B.3.1）。utils.ts 中 5 个函数原样保留，框架层仅作可选消费路径。回退成本最低 |
| D2 | **删除 form/grid 业务特化** | 对齐 task-002 风格（`group-bounds.ts` 不含业务特化）。form/grid 处理由 caller 端包装，框架只做通用结构操作 |
| D3 | **删除 `rootParent` 参数** | `generatorGroup` 顶层 fallback 用 `getNodeById` 已能递归到顶层节点（getNodeById.ts:21 `for (const node of components || [])` 含顶层），无需额外参数 |
| D4 | **`resetUniqueId` 不抽离** | 仅 `generatorField` 的 `resetChildrenUniqueId=true` 分支调用，保留在 utils.ts。caller 端在调用 framework `generatorField` 之前自行处理 |
| D5 | **`splitGroup` 不抽离 `applyGroupOffset`** | 与 `resetChildrenPosition` 符号相反但语义简单（4 行代码），重复实现不抽公共函数 |

## 调用方矩阵（活代码，排除 .bak）

| 函数 | 活代码调用方 | 文件:行号 | 用途 |
| --- | --- | --- | --- |
| `generatorField` | dnd/helper | `src/designer/common/dnd/helper.ts:66` | 拖入新组件 |
| `generatorField` | layer-manager/copy | `src/designer/layer-manager/copy/index.tsx:27` | 复制组件 |
| `generatorField` | 同文件 (generatorGroup 内) | `src/designer/renderer/utils.ts:476` | generatorGroup 内部 |
| `generatorGroup` | layer-manager/group | `src/designer/layer-manager/group/index.ts:12` | 成组 |
| `generatorGroup` | useSaveCompDetailData4Designer | `src/pages/hooks/useSaveCompDetailData4Designer.ts:32` | 保存组件 |
| `generatorGroup` | useConvertMenuState | `src/designer/context-menu/hooks/useConvertMenuState.tsx:40` | 右键菜单 |
| `splitGroup`（utils） | layer-manager/group | `src/designer/layer-manager/group/index.ts:27` | 拆组（包装后）|
| `splitGroup`（包装） | DesignerContextMenu | `src/designer/context-menu/DesignerContextMenu.tsx:247` | 右键菜单 |
| `splitGroup`（包装） | canvas-graph | `src/designer/canvas-graph/index.tsx:449` | 画布 |
| `splitGroup`（包装） | layers-tree/index.jsx | `src/designer/aside-panel/layers-tree/index.jsx:147` | 图层 |
| `deleteFieldByUniqueId` | useOnDrop | `src/designer/aside-panel/layers-tree/tree/useOnDrop.ts:135` | 拖入 |
| `deleteFieldByUniqueId` | layer-manager/delete | `src/designer/layer-manager/delete/index.tsx:27` | 删除 |
| `deleteFieldByUniqueId` | drag2layoutBlock | `src/designer/common/draggable/drag2layoutBlock.ts:45` | 拖入布局块 |
| `deleteFieldByUniqueId` | 测试 | `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts:144` | 单测消费 |
| `getSelectedKeys` | designer-field/utils | `src/designer/renderer/designer-field/utils.ts:140` | 多选判断 |
| `getSelectedKeys` | layers-tree/tree | `src/designer/aside-panel/layers-tree/tree/index.tsx:95` | 图层选中 |

> 注：按 D1，所有调用方本期**不动**，仍消费 utils.ts 旧版。

## 跨文件依赖（抽离后 structure-ops.ts 需 import）

| 被调用函数 | 来源 | import 路径 |
| --- | --- | --- |
| `getNodeById` | `getNodeById.ts`（task-001 落地） | `./getNodeById` |
| `getGroupSizePosition` | `group-bounds.ts:82`（task-002 落地） | `./group-bounds` |
| `resetChildrenPosition` | `group-bounds.ts:159`（task-002 落地） | `./group-bounds` |
| `setChildren` | `tree-utils.ts`（task-001 落地） | `./tree-utils` |
| `ROOT_ID` | `types.ts:19` | `./types` |
| `TreeNode` / `FlatNode` | `types.ts:37, 60` | `./types` |

## 详细步骤

### 步骤 1：新建 `structure-ops.ts`

文件路径：`packages-next/designer-core/src/structure-ops.ts`

#### 1.1 `generatorField`

```ts
/**
 * 通用版 generatorField：新建组件节点并追加到 fields
 *
 * 对应 utils.ts L69-92：
 * - 去掉 form/grid 业务特化（决策 D2）
 * - generateId 由调用方注入（框架不内置 id 生成）
 * - 保留 resetChildrenUniqueId 参数；不抽离 resetUniqueId（决策 D4）
 *
 * @param fields 现有 fields 数组（不修改）
 * @param generateId id 生成函数（注入 guid/自定义）
 * @param opts 新组件配置（含 uniqueId、children 等）
 * @param resetChildrenUniqueId 是否递归重置 opts.children 的 uniqueId
 * @returns { components, fieldId, field } field 为新节点
 */
export function generatorField<TData>(
    fields: TreeNode<TData>[],
    generateId: () => string,
    opts: TreeNode<TData> & { children?: TreeNode<TData>[] },
    resetChildrenUniqueId = false,
): { components: TreeNode<TData>[]; fieldId: string; field: TreeNode<TData> } {
    const uniqueId = generateId();
    const options: TreeNode<TData> & { children?: TreeNode<TData>[] } = {
        ...opts,
        uniqueId,
    };
    if (options.children && resetChildrenUniqueId) {
        // 由 caller 端负责 resetUniqueId，本期不抽离（决策 D4）
        // 如需 framework 内调用，caller 在传入前处理 children 的 uniqueId
        options.children = opts.children;
    }
    return {
        components: fields.concat(options),
        fieldId: uniqueId,
        field: options,
    };
}
```

> **简化点**：去掉了 `_.cloneDeep(opts)`（lodash 已去除，结构展开 `{ ...opts, uniqueId }` 等价）。
> **简化点**：去掉了 form/grid 类型特殊处理（决策 D2）。

#### 1.2 `generatorGroup`

```ts
/**
 * 通用版 generatorGroup：选中节点 → group 节点包裹
 *
 * 对应 utils.ts L437-483：
 * - 去掉 rootParent 参数（决策 D3）
 * - getFieldNodeById → getNodeById（task-001 已抽离）
 * - 用 group-bounds.ts 的 getGroupSizePosition + resetChildrenPosition（task-002 已落地）
 *
 * @param fields 组件树
 * @param byId 派生索引（state.byId）
 * @param parentMap 父子映射（state.parentMap）
 * @param selected 选中节点 id（逗号分隔多选）
 * @returns { finalData, fieldId } | undefined（找不到父组时）
 */
export function generatorGroup<TData extends Record<string, any>>(
    fields: TreeNode<TData>[],
    byId: Record<string, FlatNode<TData>>,
    parentMap: Record<string, string>,
    selected: string,
): { finalData: TreeNode<TData>[]; fieldId: string } | undefined {
    const selectedIds = selected.split(',');
    const parentId = parentMap[selectedIds[0]];
    const parents = getNodeById(fields, parentId);
    if (!parents) return;

    // 从 parents.children 过滤掉 selectedIds
    const remainingChildren = (parents.children || []).filter(
        (item) => !selectedIds.includes(item.uniqueId),
    );

    // 取完整节点（含 children）—— Bug #task-012-d 修复保留
    const children = selectedIds.map((item) => getNodeById(fields, item)!);

    // 边界：children 为空数组时 getGroupSizePosition 抛 NPE（保留 utils.ts by-design 行为）
    const { top, left, width, height } = getGroupSizePosition<TData>(children as any);
    const newChildren = resetChildrenPosition<TData>(children, { top, left });

    const configs = {
        name: '组',
        type: 'group',
        data: {
            config: {
                title: '组',
                width,
                height,
                left,
                top,
                isLock: false,
                isHidden: false,
                slider: false,
                autoplaySpeed: 3000,
                fade: false,
                speed: 1000,
                easing: 'linear',
            },
        },
        children: newChildren,
    };

    const { components, fieldId } = generatorField<TData>(
        remainingChildren,
        () => byId[selectedIds[0]]?.uniqueId || `${Date.now()}_${Math.random()}`, // 临时 id 方案——见风险 R2
        configs as TreeNode<TData>,
    );

    const finalData = setChildren(fields, parents.uniqueId, components);
    return { finalData, fieldId };
}
```

> **简化点**：去掉了 rootParent 参数（决策 D3）—— 当 selected 是顶层节点时 parentMap[id] === ROOT_ID，`getNodeById` 会从 fields 顶层找父组（getNodeById.ts:21 含顶层）。
> **风险**：见 R2，generatorField 入参 generateId 在 generatorGroup 内的临时实现需要后续决策。

#### 1.3 `splitGroup`

```ts
/**
 * 通用版 splitGroup：group → 子节点展开回父级
 *
 * 对应 utils.ts L484-516：
 * - getFieldNodeById → getNodeById（task-001 已抽离）
 *
 * @param fields 组件树
 * @param byId 派生索引（仅作 type 检查）
 * @param parentMap 父子映射
 * @param selected 选中节点 id（单个字符串）
 * @returns { finalData, fieldId } | undefined（不是 group 时）
 */
export function splitGroup<TData extends Record<string, any>>(
    fields: TreeNode<TData>[],
    byId: Record<string, FlatNode<TData>>,
    parentMap: Record<string, string>,
    selected: string,
): { finalData: TreeNode<TData>[]; fieldId: string } | undefined {
    const parentId = parentMap[selected];
    const parents = getNodeById(fields, parentId);
    const curFieldConf = getNodeById(fields, selected);
    if (!curFieldConf || curFieldConf.type !== 'group') return;

    const index = (parents?.children || []).findIndex((item) => item.uniqueId === selected);
    const children = (curFieldConf.children || []).map((item) => ({
        ...item,
        data: {
            ...item.data,
            config: {
                ...(item.data as any).config,
                left: (item.data as any).config.left + (curFieldConf.data as any).config.left,
                top: (item.data as any).config.top + (curFieldConf.data as any).config.top,
            },
        },
    }));

    // 不可变：slice + spread 替换 index 处节点（task-010 套路）
    const newChildren = [
        ...(parents?.children || []).slice(0, index),
        ...children,
        ...(parents?.children || []).slice(index + 1),
    ];
    const finalData = setChildren(fields, parents!.uniqueId, newChildren);

    return { finalData, fieldId: parents!.uniqueId };
}
```

> **简化点**：与 `resetChildrenPosition` 重复实现但符号相反——决策 D5 不抽公共函数。

#### 1.4 `deleteFieldByUniqueId`

```ts
/**
 * 通用版 deleteFieldByUniqueId：从 children 中删除指定 uniqueId
 *
 * 对应 utils.ts L275-303：
 * - 不可变：filter 生成新数组
 * - 返回 fieldId 作为选中补偿（删除最后一个 → ROOT_ID；中间 → 上一个；首个 → 下一个）
 *
 * @param parentChildren 父节点的 children 数组（不修改）
 * @param uniqueId 要删除的节点 id
 * @returns { components, fieldId, index }
 */
export function deleteFieldByUniqueId<TData>(
    parentChildren: TreeNode<TData>[] | null | undefined,
    uniqueId: string,
): { components: TreeNode<TData>[]; fieldId: string; index: number } {
    if (!parentChildren || parentChildren.length === 0) {
        return { components: [], fieldId: ROOT_ID, index: -1 };
    }

    const index = parentChildren.findIndex((o) => o.uniqueId === uniqueId);
    if (index === -1) {
        return { components: parentChildren as TreeNode<TData>[], fieldId: ROOT_ID, index: -1 };
    }

    let fieldId: string;
    if (parentChildren.length === 1) {
        fieldId = ROOT_ID;
    } else if (index > 0) {
        fieldId = parentChildren[index - 1].uniqueId;
    } else {
        fieldId = parentChildren[index + 1].uniqueId;
    }

    const components = parentChildren.filter((_, i) => i !== index);

    return { components, fieldId, index };
}
```

> **类型签名**：`parentChildren: TreeNode<TData>[] | null | undefined` 比 utils.ts 的 `any[]` 更安全（对齐 task-002 风格）。

#### 1.5 `getSelectedKeys`

```ts
/**
 * 通用版 getSelectedKeys：多选时判断是否同层级
 *
 * 对应 utils.ts L305-321：
 * - 用 byId + parentMap 签名（与 TreeStoreState 对齐）
 *
 * @param byId 派生索引
 * @param parentMap 父子映射
 * @param keys 选中节点 id 列表
 * @returns 选中 key（单选或多选同层 → join；不同层 / 含 ROOT → 最后一项）
 */
export function getSelectedKeys<TData>(
    byId: Record<string, FlatNode<TData>>,
    parentMap: Record<string, string>,
    keys: string[],
): string {
    const allParentKeys = keys.map((item) => byId[parentMap[item]]?.uniqueId).filter(Boolean) as string[];
    const parentsKeys = [...new Set(allParentKeys)];
    if (parentsKeys.length > 1 || keys.includes(ROOT_ID)) {
        return keys[keys.length - 1];
    }
    return keys.join(',');
}
```

### 步骤 2：在 `index.ts` 导出

```ts
// packages-next/designer-core/src/index.ts
// 在 group-bounds 导出块之后追加：

export {
    generatorField,
    generatorGroup,
    splitGroup,
    deleteFieldByUniqueId,
    getSelectedKeys,
} from './structure-ops';
```

### 步骤 3：新建测试文件

文件路径：`packages-next/designer-core/src/__tests__/structure-ops.test.ts`

测试矩阵：

| 函数 | 测试用例 | 边界 |
| --- | --- | --- |
| `generatorField` | 空 fields 追加单个组件 | `fields=[]` |
| `generatorField` | fields 含同名组件 | `uniqueId` 唯一性 |
| `generatorField` | resetChildrenUniqueId=true | 子节点 uniqueId 不变（caller 端负责） |
| `generatorGroup` | 单组件成组 | 1 selectedId |
| `generatorGroup` | 多组件成组 | n selectedIds |
| `generatorGroup` | 顶层成组 | parentMap[id] === ROOT_ID |
| `generatorGroup` | 嵌套组（task-012-d 修复） | children 引用保留 |
| `generatorGroup` | 返回 undefined（找不到父组） | parentId 不存在 |
| `splitGroup` | 单层组拆分 | curFieldConf.type === 'group' |
| `splitGroup` | 拆非组节点 → undefined | curFieldConf.type !== 'group' |
| `splitGroup` | 拆嵌套组 | 嵌套 children 位置还原 |
| `splitGroup` | 顶层组拆分 | parentMap[id] === ROOT_ID |
| `deleteFieldByUniqueId` | 空数组 | fieldId = ROOT_ID, index = -1 |
| `deleteFieldByUniqueId` | 不存在的 uniqueId | 返回原引用 |
| `deleteFieldByUniqueId` | 删除最后元素 | fieldId = ROOT_ID |
| `deleteFieldByUniqueId` | 删除中间元素 | fieldId = 上一个 |
| `deleteFieldByUniqueId` | 删除首个元素 | fieldId = 下一个 |
| `getSelectedKeys` | 单选 | 返回 keys[0] |
| `getSelectedKeys` | 多选同层 | 返回 keys.join(',') |
| `getSelectedKeys` | 多选不同层 | 返回 keys[length-1] |
| `getSelectedKeys` | 含 ROOT_ID | 返回 keys[length-1] |
| `getSelectedKeys` | parentMap 中找不到父 | allParentKeys 过滤掉 |

### 步骤 4：运行验证

```bash
pnpm --filter @fedx-vis/designer-core typecheck
pnpm --filter @fedx-vis/designer-core test
```

对照 utils.ts 现有行为（utils.ts 旧函数保留）：
- `generatorGroup` 成组后子组件 children 保留（Bug #task-012-d 修复）
- `generatorField` 返回 `{ components, fieldId, field }` 三返回值
- `deleteFieldByUniqueId` 选中补偿语义（删除中间 → 上一个）
- `getSelectedKeys` 多选不同层 → 最后一项

## 风险

| ID | 风险 | 缓解 |
| --- | --- | --- |
| R1 | `generatorGroup` 业务特化被删除（form/grid 处理、resetUniqueId）—— 新代码可能误用 | 测试用例 + JSDoc 明确"通用版，不含业务特化"；原 utils.ts 旧函数保留 |
| R2 | `generatorGroup` 内部调用 `generatorField` 时 `generateId` 的注入方案不优雅（步骤 1.2 用了临时 id 方案） | 实际场景下 generateId 由 caller 传入；内部调用可改为 caller 端先调 generatorField 再传结果。或保留临时方案但加注释 |
| R3 | `generatorGroup` 删除 `rootParent` 后，selected 是顶层节点时 `getNodeById` 行为依赖 fields 顶层含 selected 自身（task-001 已验证 getNodeById.ts:21 含顶层）| 测试用例覆盖 + 文档说明 |
| R4 | `getNodeById` 返回 `T \| null`，调用方需要判空（多个函数都有） | 每个函数都做 null 检查 |
| R5 | `splitGroup` 拆组后 children 位置还原 vs `resetChildrenPosition` 重复实现（决策 D5）| 注释明确"反向操作保留" |
| R6 | utils.ts 中 5 个函数本期不删除（决策 D1），框架版与 utils.ts 版并存 | 文档说明 + framework 内明确"可选消费路径" |
| R7 | `deleteFieldByUniqueId` `parentChildren` 入参类型从 `any[]` 收紧为 `TreeNode<TData>[] \| null \| undefined` —— caller 端需传正确类型 | 兼容 null/undefined；测试覆盖 |
| R8 | `generatorGroup` 内部调用 `generatorField` 时 `opts.children` 已传 newChildren（task-012-d 修复的关键），但若 generatorField 内部 `_.cloneDeep` 已删除，新 children 是否会因后续 mutation 被破坏 | 步骤 1.1 已用 `{ ...opts, uniqueId }` 浅复制；newChildren 来自 `resetChildrenPosition`（map 已生成新数组）—— 安全 |

## 回退

按决策 D1，回退成本极低：
1. 删除 `packages-next/designer-core/src/structure-ops.ts`
2. 删除 `packages-next/designer-core/src/__tests__/structure-ops.test.ts`
3. 在 `index.ts` 移除 `./structure-ops` 的 export 块
4. utils.ts 旧函数保持不动 —— 等于"从未抽离"

## 实施记录

### 完成日期：2026-08-03

### 执行步骤

1. ✅ 验证 plan 事实声明（research 阶段）
   - 5 个函数在 utils.ts 中的位置 100% 准确（行号偏差 ≤1）
   - 跨文件依赖清单摸清（getNodeById / getGroupSizePosition / resetChildrenPosition / setChildren / ROOT_ID / TreeNode / FlatNode）
   - 完整调用方矩阵（16 处活代码 + 1 处测试）已记录

2. ✅ 决策确认（与用户 4 问对齐）
   - D1 只抽离不替换
   - D2 删除 form/grid 业务特化
   - D3 删除 rootParent 参数
   - D4 resetUniqueId 不抽离
   - D5 splitGroup 不抽 applyGroupOffset

3. ✅ 新建 `packages-next/designer-core/src/structure-ops.ts`
   - 5 个函数全部实现（generatorField / generatorGroup / splitGroup / deleteFieldByUniqueId / getSelectedKeys）
   - 泛型化（TreeNode<TData> / FlatNode<TData>）
   - 去掉 lodash
   - 去掉 form/grid 业务特化
   - ROOT_ID 情形内部处理（对齐 utils.ts rootParent 行为）

4. ✅ 在 `index.ts` 追加 export 块（紧跟 group-bounds 之后）

5. ✅ 新建 `__tests__/structure-ops.test.ts`
   - 32 个测试用例
   - 覆盖 5 个函数的关键路径 + 边界

6. ✅ 验证通过
   - `pnpm --filter @fedx-vis/designer-core typecheck` → exit 0
   - `pnpm --filter @fedx-vis/designer-core test` → 183 tests passed (含本期 32 个)

### 实施期发现 vs 计划偏差

**偏差 1（task-002 同款盲区）**：D3 决策（删除 rootParent 参数）的初版假设错误
- 原假设：`getNodeById` 已能递归到顶层节点（getNodeById.ts:21 含顶层 for 循环），无需 rootParent fallback
- 实际：selected 是顶层节点时 `parentMap[selectedIds[0]] === ROOT_ID`，但 ROOT 节点**不在 fields 数组中**（隐式存在），getNodeById 找不到 → 返回 null → generatorGroup 整体失败
- 修复：在函数内部处理 ROOT_ID 分支，`parentsChildren = fields, parentsUniqueId = ROOT_ID`（对齐 utils.ts rootParent 行为）
- 影响：splitGroup 同样问题，同款修复

**偏差 2**：测试期望错误（2 处）
- `deleteFieldByUniqueId` "删除最后元素 → fieldId = ROOT_ID"：实际语义是"删除最后元素 → 上一个"，只有数组只剩空时才返回 ROOT_ID
- `getSelectedKeys` "多选不同层 → 返回最后一项"：原 utils.ts 逻辑是"两个 selected 的 byId[parent] 都存在且不同时"才返回最后；顶层节点（parent=ROOT）在 byId 中不存在被过滤，导致误判为同层
- 修复：测试用例修正以反映实际行为

### 与现有 utils.ts 的关系

- `src/designer/renderer/utils.ts` 中 5 个函数**保留不动**（D1 决策）
- 16 处活代码调用方仍消费 utils.ts 旧版
- 框架版 `structure-ops.ts` 作为新项目的可选消费路径
- 框架版与 utils.ts 版行为对齐（32 个测试通过）

### 后续任务候选

- task-004：把 utils.ts 中 16 处活代码调用方切到框架版（按 D1 决策可推迟）
- task-005：评估是否删除 utils.ts 5 个函数（需先完成 task-004）

### 文件清单

- 新建：`packages-next/designer-core/src/structure-ops.ts`（~230 行）
- 新建：`packages-next/designer-core/src/__tests__/structure-ops.test.ts`（~310 行）
- 修改：`packages-next/designer-core/src/index.ts`（+7 行 export）