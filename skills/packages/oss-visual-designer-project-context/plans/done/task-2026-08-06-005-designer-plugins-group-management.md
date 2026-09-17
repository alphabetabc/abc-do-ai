# task-2026-08-06-005：createGroupManagementPlugin — group / splitGroup

> 创建日期：2026-08-06
> 状态：`done`（2026-08-07 完成）
> 类型：`feature`
> 前置任务：task-2026-08-06-004（move/copy/delete）

---

## 1. 背景与目标

### 1.1 背景

src/ 的 `layer-manager/group` 有 `group`（选中节点 → group 包裹）和 `splitGroup`（group → 子节点展开回父级）。

这俩是结构性变更 + 组尺寸重算（`recalcGroupBounds`），逻辑最复杂。

### 1.2 依赖的 designer-core 纯函数

| 操作 | 依赖函数 | designer-core 已有？ |
|---|---|---|
| group | `generatorGroup` | ✅ |
| splitGroup | `splitGroup` | ✅ |
| 组尺寸重算 | `recalcGroupBounds`（createDerivedComputePlugin） | ✅ |

### 1.3 目标

实现 `createGroupManagementPlugin`，提供 group / splitGroup 命令式 API。

### 1.4 不做什么

- 不实现组内子组件排序
- 不实现组的嵌套约束校验（由纯函数内部处理）

---

## 2. 详细步骤

### 2.1 目录结构

```
packages-next/designer-plugins/src/
└── group-management/
    ├── index.ts
    ├── types.ts
    └── plugin.ts
```

### 2.2 `group-management/types.ts`

```ts
import type { Plugin, TreeNode, FlatNode } from '@fedx-vis/designer-core';
import type { WidgetData, DesignerExtra } from '../shared/types';

export interface GroupManagementPlugin {
    /** 插件实例（组合 derived-compute + structure-tools） */
    plugin: Plugin<TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>;
    /** 选中节点 → group 包裹 */
    useGroup: () => (selectedIds: string[], parentId: string) => string | undefined;
    /** group → 子节点展开回父级 */
    useSplitGroup: () => (groupId: string) => void;
}
```

### 2.3 实现核心

```ts
import {
    generatorGroup,
    splitGroup,
    createDerivedComputePlugin,
    type Plugin,
} from '@fedx-vis/designer-core';

export function createGroupManagementPlugin(): GroupManagementPlugin {
    // derived-compute 插件：组尺寸自动重算
    const recalcPlugin = createDerivedComputePlugin({
        compute: (state) => {
            // 调用 recalcGroupBounds 逻辑
            // 具体实现时读 designer-core group-bounds.ts 确认接口
        },
    });

    const useGroup = () => {
        const { store } = useDesigner();
        return usePersistFn((selectedIds: string[], parentId: string): string | undefined => {
            const state = store.getState();
            // 获取父节点的 children
            const siblings = parentId === ROOT_ID
                ? state.components
                : getNodeById(state.components, parentId)?.children ?? [];

            // 调用 generatorGroup
            const result = generatorGroup(siblings, selectedIds, generateId);
            if (!result) return;

            const newTree = setChildren(state.components, parentId, result.components);
            store.setTree(newTree);
            return result.fieldId;
        });
    };

    const useSplitGroup = () => {
        const { store } = useDesigner();
        return usePersistFn((groupId: string) => {
            const state = store.getState();
            const result = splitGroup(state.components, groupId);
            if (!result) return;

            store.setTree(result);
        });
    };

    return { plugin: recalcPlugin, useGroup, useSplitGroup };
}
```

### 2.4 关键问题

1. **`generatorGroup` / `splitGroup` 的确切签名**：实现时需要读 designer-core `structure-ops.ts` 确认参数和返回值
2. **`recalcGroupBounds` 的集成方式**：是作为 derived-compute 插件自动触发，还是在 group/splitGroup 操作后手动调用
3. **generateId 注入**：同 task-004，需要 id 生成函数

---

## 3. 测试

1. **group**：选中 [a, b] → 生成 group 节点包裹，返回 groupId
2. **splitGroup**：group → 子节点展开回父级
3. **group 后尺寸重算**：group 后 group 节点的 config.width/height 是子节点边界
4. **splitGroup 后尺寸**：子节点保留原尺寸
5. **边界**：group 只选 1 个节点 → 正常包裹
6. **边界**：splitGroup 不存在的 id → no-op

---

## 4. 验证

| 验证项 | 方法 |
|---|---|
| 测试通过 | `pnpm --filter @fedx-vis/designer-plugins test` |
| 类型安全 | `pnpm --filter @fedx-vis/designer-plugins typecheck` |

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| `generatorGroup` 签名不匹配 | 高 | 中 | 实现时读源码确认 |
| `recalcGroupBounds` 集成方式 | 高 | 中 | 可能需要手动调而非自动派生 |
| 组尺寸重算时机 | 中 | 中 | group/splitGroup 后手动触发 vs subscribe 自动 |

---

## 6. 实施记录

> 2026-08-07 完成。

### 6.1 落地文件清单

```
packages-next/designer-plugins/src/
├── group-management/
│   ├── index.ts          # barrel 导出
│   ├── plugin.ts         # createGroupManagementPlugin 实现
│   └── types.ts          # GroupManagementPlugin + Options 类型
├── __tests__/
│   └── group-management.test.tsx   # 新增 19 个测试
└── index.ts              # 主 barrel 追加导出
```

### 6.2 关键实施决策（相对原计划的修正）

#### 决策 1：useGroup 校验链显式化（plan §2.2 与 generatorGroup 真实签名错配的修正）

plan §2.2 示例代码用 `generatorGroup(siblings, selectedIds, generateId)`（3 参），但 designer-core 真实签名是 `generatorGroup(nodes, byId, parentMap, selected, generateId)`（5 参，`selected` 为逗号分隔字符串）。

实现策略：保留 plan 设计的入参形态 `(selectedIds: string[], parentId: string)`，但在调用真实函数前增加 3 段校验：
1. **存在性**：所有 selectedIds 必须在 `state.byId` 中
2. **一致性**：`parentMap[selectedIds[0]] === parentId`（入参与推导必须一致）
3. **同层性**：多选时所有节点的 parentId 必须等于 selectedIds[0] 的 parentId

校验失败 → 静默 no-op，components 引用不变（避免无谓订阅）。这种前置校验同时承担了 plan §2.4 关键问题 1 的"参数语义对齐"职责。

#### 决策 2：不集成 createRecalcGroupBounds 派生插件（plan §2.3 关键问题 2 的最终决策）

plan §2.3 的 `recalcPlugin` 草图依赖 `createRecalcGroupBounds` 工厂，但该工厂需要外部 `getSelectedIds` 回调，而本框架目前没有 selected 状态的接入点（selected 状态当前在 Redux `component` slice）。

权衡 4 个候选：
- generatorGroup 成组时已设置正确尺寸（getGroupSizePosition）→ 无需后置重算
- splitGroup 拆组时已通过加回偏移还原原坐标 → 无需重算
- 真正的"组尺寸重算"场景是「组内子节点拖拽移动后组件尺寸自动重算」→ 该场景才需要派生计算
- AGENTS.md §10.1「Only make changes that are directly requested or clearly necessary」

**最终决策**：本期不集成。理由 4 站得住。

未来扩展点：task-006 plugin registry 阶段可接入 selected 状态 + `createRecalcGroupBounds`，把本插件的 plugin 类型从 `'cross-slice-sync'` 升级为 `'cross-slice-sync' + derived-compute` 组合（或拆分两个 plugin 实例）。

#### 决策 3：plan §2.2 关键问题 2 的另一种解读——继承 task-004 §6.2 决策 5

task-004 §6.2 决策 5 提到"task-005 引入第 4 处 useTypedStore 副本时一起抽到 hooks/use-typed-store.ts"。本任务确实是第 4 处副本（view + layer-ops 各 1 + layer-ops task-004 +1 = 4），但本期按 plan 严格范围**暂不抽取**。理由：

- plan 没有列 useTypedStore 抽取为子步骤
- 抽取的最佳时机是 task-006 plugin registry 重构（统一处理 useTypedStore + plugin 空壳 + 扩展点 + lifecycle）
- 提前抽取会引入与 task-006 设计冲突的风险

决策：保留第 4 处副本，task-006 合并处理。

#### 决策 4：useSplitGroup 提前做类型校验（避免无谓纯函数调用）

plan §2.3 没有显式提到 useSplitGroup 的提前校验，但 splitGroup 纯函数自身有 `curNodeConf.type !== 'group'` 防护。提前在组件层校验 `node.type !== 'group'` 可节省一次纯函数调用 + setTree 调用风险（虽然 splitGroup 找不到/类型不对也会 return undefined，但多层防护避免任何副作用链）。

#### 决策 5：测试覆盖扩展（plan §3 列了 6 项 → 实际 19 项）

plan §3 列了 6 项用例（group + splitGroup + 2 尺寸 + 2 边界）。本任务补充：

| 类别 | 增量用例 | 数量 |
| --- | --- | --- |
| useGroup 校验 | 空数组 / 不存在 id / parentId 与推导不一致 / 多选不同层 | 4 |
| useGroup 尺寸 | 子节点位置归一化（绝对 - group 偏移 = group 内相对） | 1 |
| useGroup 嵌套 | group 内子节点成组（嵌套路径） | 1 |
| useSplitGroup 嵌套 | 嵌套组拆分（父组保留，子组拆出） | 1 |
| useGroup generateId 注入 | 自定义 id 前缀生效 | 1 |
| 引用稳定 | useGroup + useSplitGroup 跨 re-render 引用稳定 | 2 |
| 往返 | 成组 → 拆组，components 顺序还原 + 子节点绝对坐标还原 | 1 |
| 结构契约 | plugin.name / plugin.type / 2 hooks 是函数 | 1 |

合计 6 + 13 = 19 项。比 plan 多 13 项，主要用于覆盖边界场景与契约保证。

#### 决策 6：测试发现 generatorGroup 排序行为（"成组位置在末尾"）

测试发现：`generatorGroup` 内部 `[...remainingChildren, groupNode]` ——新 group 总是追加到剩余兄弟末尾，而不是插入到原 selected 位置。

这不是 bug（与 src/ 同语义），但与 plan §3.1 的隐含期望"[a, b] → group 包裹"心智模型有偏差。已在测试用例注释 + 实现记录中显式标注。

注：src/ 的 generatorField 也是同样行为（utils.ts L437-483）——本任务是按设计意图对齐，不是新发现的差异。

### 6.3 验证结果

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm --filter @fedx-vis/designer-plugins typecheck` | 0 error |
| 单元测试 | `pnpm --filter @fedx-vis/designer-plugins test` | 61 passed (8 bootstrap + 5 view + 9 layer-ops-lock-show + 20 layer-ops-move-copy-delete + 19 group-management) |
| 构建 | `pnpm --filter @fedx-vis/designer-plugins build` | 成功，bundle 6.39 kB → 7.49 kB（gzip 1.84 → 2.09 kB） |
| designer-core | `pnpm --filter @fedx-vis/designer-core typecheck` | 0 error（未改动，确认无回归） |

### 6.4 后续 task 衔接

- `task-2026-08-06-006`（plugin registry refactor）整合 4 个插件（view + layer-ops + group-management + future）
  - useTypedStore 抽取（本任务决策 3 提到的延期点）
  - recalcGroupBounds 派生计算接入（本任务决策 2 提到的未来扩展点）
  - PluginRegistry 抽象 / lifecycle / extensions / plugin type 升级路径
- 应用层迁移（src/ 旧 layer-manager/group + 旧 layer-manager/group-style-edit 迁移到 designer-plugins）按计划推迟到 designer-app 阶段

### 6.5 延期到 task-006 的架构问题（与 task-003/004 §6.5 一致，不再重复记录）

plugin 壳死代码 / 无扩展点 / 无生命周期钩子 / `type: 'cross-slice-sync'` 撒谎 / 命名误导 / 插件运行时耦合 / boilerplate 重复等架构问题，已在 task-003 §6.5 + task-004 §6.5 记录，本任务不重复，统一等 task-006 处理。

新增一项：本插件同样存在"plugin 实际不订阅 state"，但命名 `group-management-plugin` 是行为级的（group / splitGroup 命令式操作），与 layer-ops-plugin 命名风格一致。如果 task-006 决定按行为重命名（如 `GroupOpsPlugin`），本插件可一并调整。
