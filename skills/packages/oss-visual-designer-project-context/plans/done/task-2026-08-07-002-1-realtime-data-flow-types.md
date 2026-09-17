# task-2026-08-07-002-1：realtime-data-flow 类型定义（types.ts + RealtimeDataFlowPlugin 接口）

> 创建日期：2026-08-07
> 完成日期：2026-08-07
> 状态：`done`
> 类型：`feature`（task-002 子任务）
> 父任务：[`task-2026-08-07-002-designer-plugins-realtime-data-flow.md`](./task-2026-08-07-002-designer-plugins-realtime-data-flow.md) §4.1
> 前置：task-2026-08-07-002 v3（in-progress）

---

## 1. 范围

仅做类型定义，**不实现**任何运行时逻辑（plugin.ts 实现见子任务 [002-2](./task-2026-08-07-002-2-realtime-data-flow-plugin-impl.md)）。

## 2. 涉及文件

| 文件 | 改动 |
|---|---|
| `packages-next/designer-plugins/src/types.ts` | 新增 `RealtimeDataFlowItem` / `TRealtimeDataFlowDataItem` 类型；`DesignerExtra` 新增 `realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping` 字段；新增 `defaultRealtimeDataFlowData` / `defaultRealtimeDataFlow` / `defaultCustomFieldsListMapping` 默认值 |
| `packages-next/designer-plugins/src/realtime-data-flow/types.ts`（新文件） | 定义 `RealtimeDataFlowPlugin` 接口（5 hooks）+ 对外 re-export 类型 |

## 3. 实施步骤

### 3.1 扩展 `types.ts`

按父任务 §3 完整定义照搬：

```ts
// === Realtime Data Flow 类型（task-2026-08-07-002 / 002-1）===

/** 订阅索引项（uniqueId ↔ sourceId 映射） */
export interface RealtimeDataFlowItem {
    uniqueId: string;
    sourceId: string;
    enable?: boolean; // 仅 dispatcher 分流标志，reducer 不写入
}

/** 数据内容项（dispatch 写入） */
export interface TRealtimeDataFlowDataItem {
    rows?: any[];
    extraResponse?: any;
    error?: SerializableError;
    [key: string]: unknown;
}

// DesignerExtra 新增 3 字段 + 默认值 3 个常量
```

注意：
- `SerializableError` 已在 task-001 done 引入（types.ts L87），**直接 import 复用**
- 移除原 `types.ts:158-162` 注释占位的 `// realtimeDataFlowData?: ...` / `// realtimeDataFlow?: ...` / `// customFieldsListMapping?: ...` 三行

### 3.2 新建 `realtime-data-flow/types.ts`

```ts
import type { Plugin } from '@fedx-vis/designer-core';
import type { TRealtimeDataFlowDataItem } from '../types';

export interface RealtimeDataFlowPlugin {
    plugin: Plugin;
    dispatch: (uniqueId: string, list: any[]) => void;
    useRealtimeDataFlowData: <T = any>(fetcherId: string) => T;
    useRealtimeDataFlowDataSource: (
        ownerProps: any,
        opts: { postDpuList?: any[] },
        listener: (rows: any) => void,
    ) => void;
    useRemoveRealtimeDataByUniqueId: (uniqueId: string) => void;
    useClearRealtimeData: () => void;
}

export type { RealtimeDataFlowItem, TRealtimeDataFlowDataItem } from '../types';
```

## 4. 验证

- [x] `pnpm exec tsc --noEmit` 在 designer-plugins 包 0 错误（**说明**：新类型必填契约产生 2 个下游级联错误，归属 002-3 处理，见 §6 实施记录）
- [x] 新字段在 types.ts 中可见，import 路径正确
- [x] 5 个 hook 签名与父任务 §2 完全一致
- [x] 默认值 `defaultRealtimeDataFlowData = {}` / `defaultRealtimeDataFlow = []` / `defaultCustomFieldsListMapping = {}` 类型正确

## 5. 完成后

- 更新本任务状态 → `done`，移入 `plans/done/` ✅
- 在父任务 task-002 §7.1 步骤概览标记 "步骤 1" 完成 ✅
- 启动子任务 002-2（plugin.ts 实现）

## 6. 实施记录

### 6.1 改动清单

| 文件 | 改动 |
|---|---|
| [`packages-next/designer-plugins/src/types.ts`](../../../packages-next/designer-plugins/src/types.ts) | ① L100-139 新增 `RealtimeDataFlowItem` / `TRealtimeDataFlowDataItem` 接口；② L196-216 `DesignerExtra` 新增 3 字段 + 移除 3 行注释占位；③ L269-292 新增 3 个默认值常量 |
| [`packages-next/designer-plugins/src/realtime-data-flow/types.ts`](../../../packages-next/designer-plugins/src/realtime-data-flow/types.ts)（新文件） | 定义 `RealtimeDataFlowPlugin` 接口（5 hooks）+ 对外 re-export 类型 |

### 6.2 tsc 验证

`pnpm --filter @fedx-vis/designer-plugins exec tsc --noEmit` 结果：

- ✅ 新增类型本身 0 错误
- ⚠️ 2 个下游级联错误（**归属 task-002-3**）：
  - `src/create-designer.ts(117,9)` — `initialExtra` 缺 3 字段，task-002-3 §4.2 处理
  - `src/view/plugin.ts(170,19)` — view setView 的 extra payload 缺 3 字段保留，task-002-3 §4.5 处理

这两处错误是"新必填类型契约"的合理回响——按父任务 §4.2 / §4.5 设计，需要在 002-3 注入默认值 + view payload 追加字段保留引用，tsc 才能完全通过。

### 6.3 决策记录

**1. 移除 `import type { TRealtimeDataFlowDataItem } from '../types';`**

任务文档 §3.2 示例代码包含此 import，但 `TRealtimeDataFlowDataItem` 在 `RealtimeDataFlowPlugin` 接口体中未被实际引用（dispatch 第二参是 `any[]`、hook 泛型是 `<T = any>`），触发 `noUnusedLocals: true` 错误。

由于 `export type { ..., TRealtimeDataFlowDataItem } from '../types'` 已通过 re-export 形式承载该类型对外暴露（应用层仍可 `import { TRealtimeDataFlowDataItem } from '../types'` 或通过 plugin barrel 间接访问），移除冗余 import 不影响功能契约。002-2 实现 plugin.ts 时如需在内部引用，会重新 import。

**2. 字段语义：必填（无 `?`）+ 默认值**

- `realtimeDataFlowData` / `realtimeDataFlow` / `customFieldsListMapping` 均标为**必填**，与"默认值由 create-designer 注入"的契约对齐（002-3 §4.2 处理）。
- 若标为 optional（`?:`），将允许调用方省略，破坏"字段必有"的契约保证（task-001 done §8.2.5 view-plugin field isolation 教训）。

### 6.4 后续

- 002-2：plugin.ts 实现 + barrel + 顶层导出
- 002-3：create-designer 注入默认值 + plugin-registry 注册 + view/plugin 字段保留
- 002-4：单元测试（25 用例 / 9 describe）
- 002-5：调用方迁移 + 死代码清理 + 文档同步