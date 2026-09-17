# task-2026-08-06-006：designer-plugins 插件组装方式重构（方案 B 聚合入口 + 可拔插）

> 创建日期：2026-08-06
> 完成日期：2026-08-07
> 状态：`done`
> 类型：`refactor`
> 前置任务：task-2026-08-06-001 ~ 005（包骨架 + view + layer-ops + group-management）

---

## 1. 背景与目标

### 1.1 背景

当前插件组装方式是**数组模式**：

```ts
// 当前方式
const view = createViewPlugin();
const layerOps = createLayerOpsPlugin();
const designer = createDesigner({
    plugins: [view.plugin, layerOps.plugin],  // ← 数组
});
// 组件内用
view.useViewScale();      // ← 从 view 实例上调
layerOps.useLock();       // ← 从 layerOps 实例上调
```

问题：
1. 应用层要分别持有 `view` / `layerOps` / `groupMgmt` 实例，插件多了很散
2. `plugins` 数组只传 `.plugin` 字段，hooks 在组件里从各实例上调，两套引用
3. 不直观表达"哪些插件启用了、哪些没启用"

### 1.2 目标

改为**对象模式（方案 B）**：

```ts
// 新方式
const designer = createDesigner({
    plugins: {
        view: createViewPlugin(),        // ← 对象，key 是插件名
        layerOps: createLayerOpsPlugin(),
        groupMgmt: createGroupManagementPlugin(),
        // 不传 = 不启用
    },
});
// 组件内用
designer.view.useViewScale();            // ← 从 designer 上直接调
designer.layerOps.useLock();
```

### 1.3 可拔插设计

- **不传 = 不启用**：`plugins` 对象中不传某个 key，该插件不启用
- **传自定义实例 = 替换**：应用层可以传自己的实现替换默认插件
- **类型安全**：`designer.view` / `designer.layerOps` 是可选属性，传了才有

```ts
// 替换某个插件
const designer = createDesigner({
    plugins: {
        view: createCustomViewPlugin(),  // ← 用自己的替换
        layerOps: createLayerOpsPlugin(),
    },
});

// 不启用某个插件
const designer = createDesigner({
    plugins: {
        view: createViewPlugin(),
        // layerOps 不传 → 不启用 → designer.layerOps 不存在
    },
});
```

### 1.4 不做什么

- ❌ 不碰 designer-core 的 `Plugin` 接口（不加 extensions / lifecycle）
- ❌ 不改 `PluginType` 枚举（不加 `field-ops` / `capability-bundle`）
- ❌ 不改目录结构 / 不改名（layer-ops → layer-management 单独 task）
- ❌ 不加中间件 / 拦截器

详见 [research/task-006-extensions-lifecycle-feasibility-report.md](../research/task-006-extensions-lifecycle-feasibility-report.md)。

---

## 2. 详细步骤

### 2.1 新增 `plugin-registry.ts`：PluginRegistry 类型映射

**文件**：`packages-next/designer-plugins/src/plugin-registry.ts`（新建）

```ts
import type { ViewPlugin } from './view';
import type { LayerOpsPlugin } from './layer-ops';
import type { GroupManagementPlugin } from './group-management';

/**
 * 插件名 → 插件实例类型的映射
 * 新增插件时在此追加一行
 */
export interface PluginRegistry {
    view: ViewPlugin;
    layerOps: LayerOpsPlugin;
    groupMgmt: GroupManagementPlugin;
    // 未来插件追加在此：
    // dataFetcher: DataFetcherPlugin;
    // realtimeDataFlow: RealtimeDataFlowPlugin;
    // interaction: InteractionPlugin;
}

/**
 * 插件配置对象：key 是插件名，值是插件实例
 * 所有字段可选——不传 = 不启用
 */
export type PluginOptions = {
    [K in keyof PluginRegistry]?: PluginRegistry[K];
};

/**
 * 从 PluginOptions 派生出已启用的插件实例
 * 只有传了的 key 才有值
 */
export type EnabledPlugins<T extends PluginOptions> = {
    [K in keyof T as T[K] extends undefined ? never : K]: NonNullable<T[K]>;
};
```

### 2.2 重写 `create-designer.ts`：对象模式 + 可拔插

**文件**：`packages-next/designer-plugins/src/shared/create-designer.ts`（已有，重写）

**改前**（当前数组模式）：

```ts
export function createDesignerForDesigner(options) {
    const core = createDesignerCore({
        ...options,
        deepMergeKeys: ['config'],
        plugins: options.plugins ?? [],
    });
    return core;
}
```

**改后**（对象模式）：

```ts
import type { PluginOptions, PluginRegistry } from '../plugin-registry';

export function createDesignerForDesigner<TPlugins extends PluginOptions>(
    options: {
        initialComponents?: ...;
        initialExtra?: ...;
        plugins?: TPlugins;
    }
) {
    const plugins = options.plugins ?? {};
    
    // 收集所有已启用插件的 .plugin 字段
    const pluginList = Object.values(plugins)
        .filter((p) => p != null)
        .map((p) => p.plugin);

    const core = createDesignerCore({
        initialComponents: options.initialComponents,
        initialExtra: options.initialExtra,
        deepMergeKeys: ['config'],
        plugins: pluginList,
    });

    // 把插件实例挂到返回值上
    return {
        ...core,
        // 只有传了的插件才有值
        ...(plugins as Partial<PluginRegistry>),
    };
}
```

### 2.3 更新 `index.ts` 导出

**文件**：`packages-next/designer-plugins/src/index.ts`

新增导出：

```ts
export type { PluginRegistry, PluginOptions } from './plugin-registry';
```

### 2.4 更新现有测试

**文件**：`packages-next/designer-plugins/src/__tests__/bootstrap.test.ts`

现有测试用的是数组模式，需要改为对象模式：

```ts
// 改前
const designer = createDesignerForDesigner({
    plugins: [],
});

// 改后
const designer = createDesignerForDesigner({
    plugins: {},  // 空对象 = 不启用任何插件
});
```

### 2.5 新增测试

**文件**：`packages-next/designer-plugins/src/__tests__/plugin-registry.test.ts`（新建）

测试用例：

1. **对象模式基本可用**：传 `view + layerOps`，`designer.view` / `designer.layerOps` 可用
2. **不传 = 不启用**：只传 `view`，`designer.view` 可用，`designer.layerOps` 是 `undefined`
3. **替换插件**：传自定义 view 插件实例，`designer.view` 是自定义实例
4. **空 plugins 对象**：`plugins: {}`，不报错，所有插件字段都是 `undefined`
5. **插件 .plugin 字段被正确收集**：传 3 个插件，`core.plugins` 数组长度是 3

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| 对象模式可用 | `pnpm test`（新增 5 个测试用例） |
| 现有测试不回归 | `pnpm test` 全量通过 |
| 类型安全 | `pnpm exec tsc --noEmit`（仅 `packages-next/designer-plugins/`） |
| 可拔插语义正确 | 测试用例 2 + 3 验证 |

---

## 4. 风险与回退

### 4.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| 现有测试需要全部改 | 中 | 低 | 只有 bootstrap.test.ts 用了数组模式，改动量小 |
| 类型推断不够精确 | 低 | 低 | 如果 `designer.view` 推断为 `undefined | ViewPlugin`，消费方需要 `?.` 调用 |

### 4.2 回退

改动集中在 `create-designer.ts` + `plugin-registry.ts` + `index.ts`，回退 = 恢复数组模式。

---

## 5. 实施记录

### 5.1 实施过程（2026-08-07）

按 plan 4 步执行 + 1 步附加：

**Step 1：新建 `src/plugin-registry.ts`**
- 定义 `PluginRegistry` 接口（view / layerOps / groupMgmt 三个 key）
- 定义 `PluginOptions = Partial<PluginRegistry>`（所有字段可选）
- 定义 `EnabledPlugins<T>`（已启用插件实例的派生类型，备未来使用）

**Step 2：重写 `src/create-designer.ts`**
- `CreateDesignerOptions<TPlugins extends PluginOptions>` 改为接收 `plugins?: TPlugins` 对象
- `createDesigner` 函数体：
  - 收集 `plugins` 对象所有非空 value 的 `.plugin` 字段 → `pluginList` 数组，传给底层 `createDesignerCore`
  - 返回 `{ ...core, ...plugins }`——只有传入的插件 key 会挂到返回值上
- 新增导出 `CreateDesignerReturn<TPlugins>` 类型：
  - 注意：**类型设计从 `[K in keyof TPlugins]?: NonNullable<TPlugins[K]>` 调整为 `[K in keyof PluginRegistry]?: PluginRegistry[K]`**
  - 理由：测试和消费方需要访问「未传的插件字段」验证 undefined（`designer.layerOps`），且与 `designer.view?.useViewScale()` 可选链调用语义兼容
  - 运行时仍按 plan §2.2 执行（只挂传入的 key）

**Step 3：更新 `src/index.ts`**
- 新增导出 `PluginRegistry` / `PluginOptions` / `EnabledPlugins` / `CreateDesignerReturn` 类型

**Step 4：批量更新现有测试（数组模式 → 对象模式）**
- `view-plugin.test.tsx`：4 处
- `layer-ops-plugin.test.tsx`：8 处
- `layer-ops-move-copy-delete.test.tsx`：19 处
- `group-management.test.tsx`：18 处
- 合计 **49 处测试 + 3 处 plugin 注释** = **52 处**（用 [task-006-batch-replace-plugins.mjs](../../scripts/task-006-batch-replace-plugins.mjs) 脚本批量替换）
- plan §2.4 假设只有 bootstrap.test.ts 需要改，实际**所有插件测试都用数组模式**——脚本一并处理

**Step 5：新增 `src/__tests__/plugin-registry.test.ts`（7 个用例）**
1. 对象模式基本可用（传 view + layerOps）
2. 不传 = 不启用：只传 view
3. 不传 = 不启用：只传 groupMgmt（**plan 之外的补充用例**）
4. 替换插件：传自定义 view 实例
5. 空 plugins 对象：plugins: {}
6. 不传 plugins 缺省（**plan 之外的补充用例**）
7. 插件 .plugin 字段被正确收集：3 个 mock plugin 的 init 都被调用
- 用例 5 的验证方式偏离 plan：plan 写「core.plugins 数组长度是 3」，但 designer-core 的 plugins 不在 state 上暴露。改为用 `vi.fn()` 包装 init，验证 3 个 init 都触发（语义等价——证明 3 个 .plugin 都被传给底层 store）

### 5.2 验证结果

```
✓ src/__tests__/plugin-registry.test.ts (7 tests) 15ms
✓ src/__tests__/layer-ops-plugin.test.tsx (9 tests) 85ms
✓ src/__tests__/view-plugin.test.tsx (5 tests) 88ms
✓ src/__tests__/group-management.test.tsx (19 tests) 117ms
✓ src/__tests__/layer-ops-move-copy-delete.test.tsx (20 tests) 126ms
✓ src/__tests__/bootstrap.test.ts (8 tests) 11ms

Test Files  6 passed (6)
     Tests  68 passed (68)
```

- `pnpm test`：6 个测试文件 / 68 个用例全通过（其中 7 个为新增）
- `pnpm exec tsc --noEmit`：通过

### 5.3 计划偏离说明

| plan 内容 | 实际做法 | 原因 |
|---|---|---|
| §2.4 bootstrap.test.ts 需要改 | **未改动** | bootstrap.test.ts 现有调用都没传 `plugins` 参数，默认 `plugins = {}` 已自动兼容对象模式 |
| §2.5 用例 5：「core.plugins 数组长度是 3」 | **改为：3 个 mock plugin 的 init 都触发** | designer-core 不在 state 上暴露 plugins 数组，无法直接访问；用 init spy 验证「3 个 .plugin 被传给 store」语义等价 |
| `CreateDesignerReturn` 类型用 `[K in keyof TPlugins]` | **改为 `[K in keyof PluginRegistry]`** | 测试和消费方需要访问未传字段验证 undefined；类型保持向后兼容（未传字段 = undefined，可选链调用） |
