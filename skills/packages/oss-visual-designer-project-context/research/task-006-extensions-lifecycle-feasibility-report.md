# task-006 架构升级可行性分析报告

> 创建日期：2026-08-06
> 研究对象：task-2026-08-06-006 提出的 4 个子目标（方案 B 聚合入口 + extensions 扩展点 + lifecycle 钩子 + 目录重组）
> 研究方法：Tango 源码对比 + 业界方案对比（Redux/Zustand/VS Code/Webpack Tapable）+ 当前实现现状审计
> 状态：`调研产出，待决策`

---

## 0. 报告定位

task-006 原计划只做"方案 B 聚合入口 + 可拔插"，在 review 过程中范围扩展为 4 个子目标。本报告对每个子目标做深度可行性分析，结论是**只有子目标 1 应保留，子目标 2-5 应砍掉或推迟**。

---

## 1. 子目标 1：方案 B 聚合入口 + 可拔插

### 1.1 设计回顾

`plugins` 从数组改为对象，`designer.view` / `designer.layerOps` 直接可用：

```ts
const designer = createDesigner({
    plugins: {
        view: createViewPlugin(),
        layerOps: createLayerOpsPlugin(),
        // groupMgmt 不传 → 不启用
    },
});
designer.view?.useViewScale();
```

### 1.2 Tango 对照

Tango 的 widget / setter / prototype 注册**全部用对象 Map**（`Record<string, Component>`），不是数组：

| 注册目标 | 数据结构 | 注册 API |
|---|---|---|
| Widgets | 模块闭包 `const widgets = {}` | `registerWidget(key, component)` |
| Setters | `REGISTERED_FORM_ITEM_MAP: Record<string, ...>` | `register(config)` 按 name+alias |
| Prototypes | `Workspace.componentPrototypes: Map<string, ...>` | `setComponentPrototypes(Record)` |

**全部是对象/Map，没有一个用数组。** 原因：按 key O(1) 查找，不需要有序遍历。

### 1.3 结论：**保留，合理**

方案 B 与 Tango 的注册模式一致。对象 key 即插件标识，不传就不启用，传自定义实例就替换。

**唯一调整建议**：`PluginRegistry` 的类型映射用 `interface` 累加（每个插件 task 独立扩展自己的 registry 条目），避免一次性定义所有插件。

---

## 2. 子目标 2：extensions 扩展点（pre/post hook）

### 2.1 设计回顾

在 `Plugin` 接口中引入 `extensions?: ExtensionPoint[]`，每个 action 前后触发 pre/post hook：

```ts
export interface ExtensionPoint<TContext = any, TResult = any> {
    name: string;
    hook: 'pre' | 'post' | 'override';
    handler: (context: TContext) => TResult | void;
}
```

task-006 文档 §5.3 设想的实现方式是**每个插件在 hook 内部手动触发**：

```ts
const useLock = () => {
    return usePersistFn((id: string) => {
        plugin.extensions?.filter(e => e.hook === 'pre').forEach(e => e.handler(ctx));
        store.updateNode(id, { config: { isLock: true } });
        plugin.extensions?.filter(e => e.hook === 'post').forEach(e => e.handler(ctx));
    });
};
```

### 2.2 当前实现现状审计

对 `packages-next/designer-plugins/src/` 全量 grep `interceptor|intercept|middleware|onAction|beforeDispatch|afterDispatch`：**0 匹配**。

三个业务插件的 13 个写 hooks 全部直接调 store API，没有中间层：

| 插件 | 写 hooks | 调用方式 |
|---|---|---|
| view | 1（useSetView） | `store.setPartialState({ extra })` |
| layer-ops | 10（lock/unlock/show/hide + move×4 + copy + delete） | 4 个 `store.updateNode` + 6 个 `store.setTree` |
| group-management | 2（useGroup + useSplitGroup） | 2 个 `store.setTree` |

**没有任何拦截需求场景被落地**——没有 logging、validation、sync 等 action 级拦截。

### 2.3 Tango 对照

Tango **没有** pre/post hook 拦截机制。Tango 的 `Workspace.updateSelectedNodeAttributes` 直接执行 + `history.push`，没有前置拦截器可以阻断。

Tango 唯一可类比的机制是基于 DOM `EventTarget` 的事件总线：

```ts
// workspace.ts L1118
refresh(filenames: string[]) {
    this.dispatchEvent(new CustomEvent('refresh', { detail: { filenames, entry: this.entry } }));
}
```

但这是**事后通知**（fire-and-forget），不是同步拦截。监听者只能"事后反应"，不能阻断或改写。

### 2.4 业界方案对比

| 方案 | 拦截方式 | 特点 |
|---|---|---|
| Redux middleware | **框架层统一拦截** | 所有 action 必经 middleware 链，不可绕过 |
| Zustand middleware | **框架层统一拦截** | 同上，所有 setState 必经 |
| Webpack Tapable | **框架层统一拦截** | 所有 hook 调用由 Tapable 实例统一调度 |
| VS Code Extension | **混合** | 扩展点解析框架统一，命令回调插件自管，无全局拦截 |
| **我们的 extensions 设计** | **插件自行实现** | 每个插件在 hook 内部手动触发 pre/post |

**关键差异**：我们的 extensions 设计是"每个插件自行实现"，不是"框架层统一拦截"。这意味着：

1. **每个插件都要重复写 pre/post 触发逻辑**：12 个写 hook × 3 个插件 = 36 处重复代码
2. **不是不可绕过的**：如果应用层直接调 `store.updateNode`（绕过插件的 `useLock`），extensions 不会触发
3. **与 Redux/Zustand middleware 的"不可绕过"语义不同**：我们的 extensions 只在插件 hook 内触发，不是 store 级拦截

### 2.5 结论：**砍掉，当前不需要**

理由：
1. **当前没有拦截需求**——13 个写 hooks 都是直接调 store，没有 logging / validation / sync 场景
2. **设计方式有问题**——"插件自行实现 pre/post"不是框架层统一拦截，是手动埋点，36 处重复代码
3. **Tango 也没有**——Tango 用 EventTarget 做事后通知，不做同步拦截
4. **如果未来需要**，正确做法是在 designer-core 的 `setTree` / `updateNode` / `setPartialState` 内部加 middleware（框架层统一拦截），而不是在每个插件 hook 里手动触发

---

## 3. 子目标 3：lifecycle 钩子（onBeforeInit / onAfterInit / onBeforeDestroy / onAfterDestroy）

### 3.1 设计回顾

```ts
export interface PluginLifecycleHooks<...> {
    onBeforeInit?: (context: PluginContext<...>) => void;
    onAfterInit?: (context: PluginContext<...>) => void;
    onBeforeDestroy?: (context: PluginContext<...>) => void;
    onAfterDestroy?: (context: PluginContext<...>) => void;
}
```

### 3.2 与现有 `init` 的语义重叠

designer-core 当前已有：

```ts
export interface Plugin<...> {
    name: string;
    type: PluginType;
    init?: (context: PluginContext<...>) => void | (() => void);
}
```

`init` 在 store 创建时执行，返回的 cleanup 在 `destroy()` 时执行。这已经覆盖了：

| lifecycle 钩子 | 现有等价物 | 语义重叠 |
|---|---|---|
| `onAfterInit` | `init(context)` | 完全重叠 |
| `onBeforeDestroy` | `init` 返回的 cleanup 函数 | 完全重叠 |
| `onBeforeInit` | ？ | PluginContext 此时还没构造完成，插件能做什么？ |
| `onAfterDestroy` | ？ | store 已销毁，context 已失效，插件能做什么？ |

### 3.3 Tango 对照

Tango **没有对称生命周期**：

| 阶段 | Tango 实现 |
|---|---|
| 初始化后 | `Workspace.ready()` —— 仅打 `isReady` 标记 + push 一条历史，**不触发任何回调** |
| 销毁时 | `PreviewManager.cleanup()` —— 解绑 iframe 监听（沙箱层，Workspace 自身没有 destroy） |

`Workspace` 连 `destroy` / `cleanup` / `dispose` 方法都没有。`TangoViewModule` 也没有。

### 3.4 实际用途分析

task-006 文档 §3.3 举例 `lifecycle.onBeforeDestroy` 用于"store 销毁前清理所有订阅"，但 `init` 返回的 cleanup 函数已经做这件事了。

designer-core 自带的 `createCrossSliceSyncPlugin`（唯一有 `init` 的插件）的用法：

```ts
// createCrossSliceSyncPlugin.ts
init: (ctx) => {
    // 订阅框架 state → 同步到外部 store
    const unsub1 = ctx.subscribe(...);
    // 订阅外部 store → 同步回框架
    const unsub2 = externalStore.subscribe(...);
    // 返回 cleanup
    return () => { unsub1(); unsub2(); };
}
```

这个模式已经完美覆盖了"初始化时订阅 + 销毁时清理"的需求。

### 3.5 结论：**砍掉，与 init 语义重叠**

理由：
1. **`onAfterInit` + `onBeforeDestroy` 与 `init` + cleanup 完全重叠**——现有机制已足够
2. **`onBeforeInit` + `onAfterDestroy` 用途不明确**——前者 PluginContext 未构造，后者 store 已销毁
3. **Tango 也没有**——Tango 只有 `ready()` 半成品，`Workspace` 连 destroy 都没有
4. **如果未来需要更细的生命周期**，可以扩展 `init` 的调用时机（如加一个 `beforeInit` 阶段），而不是新增 4 个钩子

---

## 4. 子目标 4：PluginType 新增 `field-ops` / `capability-bundle`

### 4.1 设计回顾

```ts
export type PluginType =
  | 'runtime-data' | 'derived-compute' | 'structure-tools' | 'cross-slice-sync'
  | 'field-ops'          // 新增
  | 'capability-bundle';  // 新增
```

### 4.2 当前 PluginType 的调度语义

designer-core 的 `createTreeStore` 中，4 种 PluginType 有**实际调度逻辑**（排序 + ref 防重入）：

- `runtime-data`：数据类插件，在 derived-compute 之前执行
- `derived-compute`：派生计算，在 structure-tools 之前执行
- `structure-tools`：结构工具
- `cross-slice-sync`：跨 slice 同步

这些类型决定了 `init` 的调用顺序和 ref 防重入逻辑。

### 4.3 当前业务插件的 type 使用现状

三个业务插件**全部标 `cross-slice-sync`**，但**都没有 `init`**：

```ts
// view/plugin.ts
const plugin: Plugin<...> = { name: 'view-plugin', type: 'cross-slice-sync' };
// layer-ops/plugin.ts
const plugin: Plugin<...> = { name: 'layer-ops-plugin', type: 'cross-slice-sync' };
// group-management/plugin.ts
const plugin: Plugin<...> = { name: 'group-management-plugin', type: 'cross-slice-sync' };
```

这已经是"名不副实"——标了 `cross-slice-sync` 类型但没有 `init`，不参与调度。

### 4.4 新增类型的问题

如果新增 `field-ops` / `capability-bundle`：

1. **这两个新类型在 `createTreeStore` 中没有对应调度逻辑**——它们只是标签
2. **进一步稀释 `type` 字段的意义**——原本 4 种类型有调度语义，新增的没有
3. **混淆了"框架调度语义"和"业务能力语义"**——`field-ops` / `capability-bundle` 是业务能力描述，不是框架调度分类

### 4.5 Tango 对照

Tango **没有 PluginType 枚举**。Tango 按"存储位置"隐式分桶（widgets / setters / prototypes），不区分调度类型。`FileType` 枚举只针对文件模块，用于工厂模式分发，不是插件调度。

### 4.6 结论：**砍掉，现有类型足够**

理由：
1. **新类型无调度语义**——只是标签，不影响运行时行为
2. **当前业务插件已经标 `cross-slice-sync` 且不参与调度**——再分细没有意义
3. **如果需要区分"不参与调度的插件"**，引入一个 `'passive'` 类型即可，不需要按业务能力分

---

## 5. 子目标 5：capability-driven 目录重组 + 命名重命名

### 5.1 设计回顾

```
layer-ops/      → capability/config/
structure-ops/  → capability/structure/
group-management/ → capability/group/
```

### 5.2 当前目录实际状态

```
src/
├── view/                    (17 hooks)
├── layer-ops/               (10 hooks：lock/show + move/copy/delete)
├── group-management/        (2 hooks：group/splitGroup)
├── hooks/
├── create-designer.ts
└── types.ts
```

**注意**：`structure-ops/` 目录实际不存在——结构操作被拆到 layer-ops 的 move/copy/delete。

### 5.3 改名的影响

- task-003/004/005 刚做完，所有测试和 import 都用旧名
- `LayerOpsPlugin` → `ConfigPlugin` 涉及：types.ts / plugin.ts / index.ts / create-designer.ts / 所有测试文件
- 改名涉及大量文件路径 + import 更新，且没有功能变化

### 5.4 结论：**推迟，等所有插件稳定后一次性做**

理由：
1. **task-003/004/005 刚做完**——立即改名是"先做完再改"的二次工作量
2. **P3/P4 还没做**——data-fetcher / interaction 插件还没实现，目录结构还会变
3. **改名无功能变化**——纯重构，应该在所有插件都稳定后一次性做

---

## 6. 综合结论

| 子目标 | 结论 | 理由 |
|---|---|---|
| 1. 方案 B 聚合入口 + 可拔插 | **保留** | 核心 scope，Tango 也是对象 Map 注册 |
| 2. extensions 扩展点 | **砍掉** | 当前无需求，设计方式有问题（插件自行实现 ≠ 框架层统一拦截），Tango 也没有 |
| 3. lifecycle 钩子 | **砍掉** | 与现有 `init` + cleanup 完全重叠，Tango 也没有 |
| 4. PluginType 新增 | **砍掉** | 新类型无调度语义，只是标签 |
| 5. 目录重组 + 改名 | **推迟** | 等 P3/P4 做完后一次性改 |

**task-006 应回到原 scope**：只做方案 B 聚合入口 + 可拔插，不碰框架层、不加 extensions / lifecycle、不改名。

---

## 7. 如果未来需要扩展点，正确做法是什么

记录备忘，不在 task-006 中实现：

### 7.1 如果需要 action 级拦截（logging / validation / undo/redo）

**正确做法**：在 designer-core 的 `setTree` / `updateNode` / `setPartialState` 内部加 middleware（框架层统一拦截），类似 Redux middleware：

```ts
// 未来设计（备忘）
const store = createTreeStore({
    middleware: [
        loggingMiddleware,      // 每次 setTree/updateNode 前后打印日志
        validationMiddleware,   // updateNode 前校验 patch 合法性
        historyMiddleware,      // 每次 setTree 后 push 快照（undo/redo）
    ],
});
```

**不应做**：在每个插件 hook 内部手动触发 pre/post（36 处重复代码，且可绕过）。

### 7.2 如果需要更细的生命周期

**正确做法**：扩展 `init` 的调用时机，不新增 4 个钩子：

```ts
// 未来设计（备忘）
export interface Plugin<...> {
    init?: (context: PluginContext<...>) => void | (() => void);
    // 新增：在 init 之前调用（PluginContext 已构造但 store 未创建）
    beforeInit?: (context: Partial<PluginContext<...>>) => void;
}
```

### 7.3 如果需要区分"不参与调度的插件"

**正确做法**：引入一个 `'passive'` 类型：

```ts
export type PluginType =
  | 'runtime-data' | 'derived-compute' | 'structure-tools' | 'cross-slice-sync'
  | 'passive';  // 不参与调度排序，只提供 hooks
```

业务插件标 `'passive'` 而非 `cross-slice-sync`，语义更准确。

---

## 8. 相关文档

- [task-006 计划文档](../plans/task-2026-08-06-006-designer-plugins-plugin-registry.md)
- [Tango 交叉印证报告](./tango-cross-review报告.md)
- [designer-plugins 研究报告](./designer-plugins-研究报告.md)
- designer-core 插件契约：[`packages-next/designer-core/src/plugins/types.ts`](../../packages-next/designer-core/src/plugins/types.ts)
- designer-core 自带插件示例：[`packages-next/designer-core/src/plugins/createCrossSliceSyncPlugin.ts`](../../packages-next/designer-core/src/plugins/createCrossSliceSyncPlugin.ts)
- Tango 源码：`.local-pkg/tango-main/packages/`
