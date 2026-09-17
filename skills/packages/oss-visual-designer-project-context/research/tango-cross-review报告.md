# Tango 交叉印证报告：designer-core 设计合理性评估

> 创建日期：2026-08-05
> 研究对象：`.local-pkg/tango-main/packages`（Tango LowCode Designer，网易云开源）
> 印证目标：`.trae/skills/oss-visual-designer-project-context/design/packages-next/designer-core/`（00-05 设计文档）+ `packages-next/designer-core/src/`（已实现源码）
> 研究方法：逐包研读 Tango 源码 → 与我们的设计文档 + 源码三方对比 → 输出不合理点 + 盲点
> 状态：`调研产出，待决策`

---

## 0. 报告定位

本报告是**调研记录**，非权威设计文档。通过研究 Tango（一个已开源的低代码设计器）的实现，从第三方视角审视我们 `designer-core` 的设计合理性，发现不合理之处和没想到的盲点，为下一步决策提供依据。

**事实优先级**：Tango 源码（第三方参考） > 我们的仓库代码 > `.trae/skills/oss-visual-designer-project-context/design/` 文档 > 模型记忆。Tango 是参考而非权威，其做法不一定适用于我们，但能提供对照视角。

---

## 1. Tango 概览

### 1.1 基本信息

- **项目**：Tango LowCode Designer（网易云音乐开源）
- **定位**：基于源代码的低代码设计器（组件树本质是 Babel AST 的包装）
- **技术栈**：TypeScript + MobX 6.9 + Babel AST + React
- **Monorepo 结构**：7 个子包

| 子包 | 包名 | 用途 |
|---|---|---|
| `core/` | `@music163/tango-core` | 核心引擎：数据模型、AST 处理 |
| `designer/` | `@music163/tango-designer` | 设计器 UI：拖拽、模拟器、配置面板 |
| `context/` | `@music163/tango-context` | React Context 绑定层 |
| `helpers/` | `@music163/tango-helpers` | 公共类型与工具函数 |
| `sandbox/` | `@music163/tango-sandbox` | iframe 沙箱渲染 |
| `setting-form/` | `@music163/tango-setting-form` | 属性配置表单（Setter 规范） |
| `ui/` | `@music163/tango-ui` | 通用 UI 组件库 |

### 1.2 与我们的根本差异

| 维度 | Tango | 我们（designer-core） |
|---|---|---|
| 真相源 | Babel AST（JSX 语法树） | JSON 树（`components: TNode[]`） |
| 状态管理 | MobX observable class | Zustand vanilla store |
| 更新模式 | AST 可变操作 + 派生索引全量重建 | 不可变更新 + buildIndex 引用复用 |
| 订阅模型 | MobX observer + computed 自动追踪 | selector + shallowEqual 显式订阅 |
| 插件机制 | 无 | 四类插件 |
| undo/redo | 有（文件代码快照） | 无（已删除，不实现） |

---

## 2. 设计合理的部分（Tango 印证了我们的方向）

### 2.1 单源 + 派生索引全量重建

**Tango 做法**：`ViewModule._analysisAst()` 每次写操作后 `this._nodes.clear()` + 全量重建 `_nodes: Map<string, TangoNode>` 和 `_nodesTree`。`parentId` 在遍历时派生，不持久化。

**我们的对应**：`buildIndex` 每次 `setTree`/`updateNode` 后全量重建 `byId`/`parentMap`。

**印证结论**：`designer-core` 的单源契约（[01-data-model.md](../design/packages-next/designer-core/01-data-model.md) §2.2）方向正确。Tango 用 AST、我们用 JSON 树，但"单真相源 + 派生索引全量重建"是共通模式。

### 2.2 字段级订阅 + 引用复用

**Tango 做法**（`setting-form` 包）：
- `FormModel._fieldMap: Map<string, Field>` 缓存 Field 实例，不每次 render 重建
- `Field.value` 是 MobX `computed`，自动追踪到 `_values` 的具体路径
- `observer(FormItem)` 只在读取的路径变化时 re-render

**我们的对应**：
- `byId` 索引 + `useNode(id)` + `shallowEqual`
- `buildIndex` 引用复用：`oldEntry.data === node.data` 时复用旧 byId 条目

**印证结论**：两者都做到字段级 re-render，且都**必须保证字段实例引用稳定**。Tango 靠 Field 实例缓存，我们靠 byId 引用复用。[03-read-path.md](../design/packages-next/designer-core/03-read-path.md) §2 的 `useNode` 设计正确。

### 2.3 三条写路径覆盖完整

**Tango 的写操作**：所有写都走 `file.update(code)` → `_analysisAst()` 重建。没有区分"结构性变更"vs"字段级更新"——都是全量重建。

**我们的对应**：三条写路径（`setTree`/`updateNode`/`setPartialState`）做了更细的区分，`updateNode` 沿路径浅拷贝 + 引用复用，性能优于 Tango 的全量重建。

**印证结论**：我们的写路径设计比 Tango 更精细，不是过度设计。

---

## 3. 不合理 / 需改进的地方

### 3.1 【中风险】`updateNode` 的 `config` 二次浅合并是业务耦合泄漏

**发现位置**：
- 设计文档：[02-write-path.md](../design/packages-next/designer-core/02-write-path.md) §3.2.5
- 源码：[`packages-next/designer-core/src/core/store/write-paths.ts`](../../../packages-next/designer-core/src/core/store/write-paths.ts) L68-74

**问题**：

```ts
const newData = {
    ...targetNode.data,
    ...patch,
    config: patch.config
        ? { ...targetNode.data.config, ...patch.config }
        : targetNode.data.config,
};
```

`config` 是当前项目的业务字段（`WidgetData.config`），不是框架概念。框架声称"不感知业务语义"（[00-overview.md](../design/packages-next/designer-core/00-overview.md) §2.2），但 `config` 二次浅合并违反了此原则。

**Tango 对照**：Tango 的 `updateNodeAttributes` 是通用属性合并，不硬编码特定字段名。

**影响**：其他业务如果 `data` 结构中没有 `config` 字段，或 `config` 不是对象类型，这段代码会出错或产生无意义的 `{ config: undefined }`。

**改进建议**：将 `config` 二次浅合并改为可配置的深层合并策略：

```ts
interface CreateTreeStoreOptions<...> {
    // ...
    /** 指定哪些 data 字段需要二次浅合并（默认不合并） */
    deepMergeKeys?: string[]; // 如 ['config']
}
```

`updateNode` 根据 `deepMergeKeys` 动态决定哪些字段做二次浅合并。

### 3.2 【中风险】`useTree` 的 shallowEqual 对数组语义不精确

**发现位置**：[`packages-next/designer-core/src/react/hooks.ts`](../../../packages-next/designer-core/src/react/hooks.ts) L66-73

**问题**：

```ts
shallow
    ? (a: TNode[], b: TNode[]) => shallowEqual(a as unknown as object, b as unknown as object)
    : (a: TNode[], b: TNode[]) => Object.is(a, b),
```

`components` 数组在 `updateNode` 后引用总是变化（沿路径浅拷贝生成新数组），即使只有 1 个节点变了。用 `shallowEqual` 比较数组元素引用，在 `updateNode` 场景下**每次都会判定为"已变化"**，导致整树 re-render。

[03-read-path.md](../design/packages-next/designer-core/03-read-path.md) §3.2 的初衷是"防止 byId 变化触发整树 reconcile"，但当前实现在 `updateNode` 场景下达不到这个效果。

**Tango 对照**：Tango 的 `nodesTree` 是 MobX `computed`，只有 `_nodesTree` 被重新赋值时才触发 observer re-render。MobX 自动追踪依赖，不需要手写 equalityFn。

**改进建议**：
- 方案 A：`useTree` 默认用 `Object.is`（引用比较），因为 `updateNode` 总是生成新数组引用，shallowEqual 无意义
- 方案 B：保持 shallowEqual 但文档说明"useTree 在 updateNode 场景下会触发整树 re-render，高频字段级更新应使用 useNode"

### 3.3 【低风险】`PluginContext` 缺少 `updateNode`

**发现位置**：[`packages-next/designer-core/src/plugins/types.ts`](../../../packages-next/designer-core/src/plugins/types.ts) L26-46

**问题**：`PluginContext` 只暴露了 `setTree` 和 `setPartialState`，没有 `updateNode`。`derived-compute` 插件如果需要做字段级更新，只能用 `setTree`（整树替换），性能不如 `updateNode`。

[04-plugin-system.md](../design/packages-next/designer-core/04-plugin-system.md) §4.4 说"写入走 setTree"，但这是针对 `recalcGroupBounds` 的特定决策，不应作为通用约束。

**改进建议**：在 `PluginContext` 中加入 `updateNode`，让插件有能力做字段级更新。

### 3.4 【低风险】`destroy()` 语义边界未文档化

**发现位置**：[`packages-next/designer-core/src/core/store/createTreeStore.ts`](../../../packages-next/designer-core/src/core/store/createTreeStore.ts) L228-232

**问题**：`destroy()` 只调用插件 cleanup 函数。`useLatestState` 等 hook 通过 `store.subscribe` 注册的监听由 React `useEffect` 清理（组件卸载时 `unsub`），不归 `destroy` 管。Zustand store 本身没有显式销毁机制。

**影响**：不是 bug，但 `destroy` 的语义边界（"只清理插件，不清理 React 侧订阅"）未在文档中说明。

**改进建议**：在 [04-plugin-system.md](../design/packages-next/designer-core/04-plugin-system.md) §7.2 补充 `destroy` 的语义说明。

---

## 4. 我们没想到的盲点（Tango 启发）

### 4.1 【重要】选中/拖拽/放置目标应独立成模型

**Tango 做法**：

三个独立的 MobX observable 模型，挂在 `Workspace` 上，不混入组件树状态：

| 模型 | 职责 | 关键字段 |
|---|---|---|
| `SelectSource` | 选中项管理 | `_items: ISelectedItemData[]`（多选）、`_start`（框选起点） |
| `DragSource` | 拖拽源管理 | `data`、`isDragging`、内聚 `DropTarget` |
| `DropTarget` | 放置目标管理 | `method`（Replace/InsertBefore/InsertAfter/InsertChild/InsertFirstChild）、`data` |

三者都持有 `workspace` 引用，通过 `workspace.getNode(id)` 派生节点，**不冗余存储节点引用**。`DragSource` 拥有 `DropTarget` 的设计（拖拽源知道自己的放置目标）比散落在各 slice 的方式更内聚。

**我们的现状**：当前项目把选中态放在 `component` slice（`selected` 字段），拖拽态放在 `viewCanvas`/`viewUI` slice。`designer-core` [00-overview.md](../design/packages-next/designer-core/00-overview.md) §2.2 把这些列为"不抽象（留给业务）"，但没有记录**为什么**不抽象，以及**业务应该怎么做**。

**盲点**：我们完全没有讨论选中/拖拽/放置的抽象边界。Tango 的三件套抽象非常清晰，值得记录为参考。

**建议**：在 [00-overview.md](../design/packages-next/designer-core/00-overview.md) §2.2 "不抽象"表中显式记录此决策，并说明"选中/拖拽/放置目标是独立模型，业务可参考 Tango 的 SelectSource/DragSource/DropTarget 三件套模式，不塞入 TreeStoreState"。

### 4.2 【重要】undo/redo 的最简方案：树级快照

**Tango 做法**：

`TangoHistory` 用文件代码快照实现 undo/redo：

```ts
type HistoryRecordData = { [filename: string]: string }; // 存代码字符串
interface HistoryRecord { time: number; message: HistoryMessage; data: HistoryRecordData; }
```

- 每次写操作后 `history.push({ message, data: { [filename]: file.code } })`
- `back()`/`forward()` 用历史快照覆盖当前文件 → 重新解析 → 重建索引
- 最多 100 条
- `HistoryMessage` 枚举记录操作类型（AddFile/RemoveNode/ReplaceNode/CloneNode/InsertNode/DropNode/UpdateAttribute 等）

**我们的现状**：[00-overview.md](../design/packages-next/designer-core/00-overview.md) §1.3 明确"不实现 undo/redo"。当前项目的 `undo`/`redo` API 已删除（[05-deleted-api.md](../design/src/designer-state/05-deleted-api.md)）。

**盲点**：我们只说了"不做"，但没记录**如果未来要做，最简方案是什么**。Tango 证明了"全量快照"方案简单可行，不需要 command pattern / AST diff。

**建议**：在 [00-overview.md](../design/packages-next/designer-core/00-overview.md) §1.3 补充：

> 若未来需 undo/redo，推荐树级快照方案（存 `getState().components` 序列化字符串 + 操作 message），而非 command pattern。Tango 的 `TangoHistory` 已验证此方案可行（100 条上限，文件级代码快照）。框架可提供 `createHistoryPlugin`（cross-slice-sync 类型），在 subscribe 回调中 push 快照。

### 4.3 【重要】iframe 沙箱预览模式的状态同步协议

**Tango 做法**（`sandbox` 包）：

基于 CodeSandbox 的 sandpack 协议，用 postMessage 实现 iframe 预览：

- **状态同步**：文件级全量推送（`modules: { [path]: { code } }`），不是组件树增量
- **多实例路由**：`channelId` 区分多个 iframe
- **握手流程**：iframe 发 `initialized` → 主窗口 `register-frame` → 后续消息带 `$id`
- **反向同步**：iframe 回传 `state`（bundler 内部状态）、`status`、`success`/`done`、`action: 'show-error'`
- **路由同步**：走 `contentWindow.history.pushState` + 手动触发 `popstate`（不走 postMessage，需同域）
- **DOM 事件通道**：`TangoEventName.DesignerAction` CustomEvent 作为第三通道

**关键设计**：`managerState`（bundler 内部状态）故意不同步到 React state（代码中注释掉了 `this.setState({ managerState: m.state })`），避免频繁 setState 引发 re-render。

**我们的盲点**：`designer-core` 的读路径设计（[03-read-path.md](../design/packages-next/designer-core/03-read-path.md)）全部假设在同一窗口内（共享 store 引用），完全没有考虑"渲染器在 iframe 里"的场景。

**建议**：在 [03-read-path.md](../design/packages-next/designer-core/03-read-path.md) 补充"跨 iframe 边界读路径"章节，说明：
- iframe 场景需走 postMessage + 全量序列化
- `getState().components` 序列化后发送，不能共享 store 引用
- 可参考 Tango 的 sandbox 协议（channelId 路由 + initialized 握手 + state 回传）

### 4.4 【中重要】节点删除后的引用清理

**Tango 做法**：`TangoNode.destroy()` 只做 `this.file = null`，交 GC。`_analysisAst()` 每次 `clear()` 丢弃所有旧实例，重建新的。

**我们的盲点**：[01-data-model.md](../design/packages-next/designer-core/01-data-model.md) §1.2 只说了"禁止 reducer 外 mutation"，没有讨论**节点删除后旧 data 引用的生命周期**。

`buildIndex` 每次重建新的 `byId` 对象，旧 `byId` 中被删除节点的条目自然消失。但如果外部代码持有 `byId[id].data` 的引用（如 `const ref = store.getState().byId['comp_001'].data`），节点删除后这个引用仍然有效（JS GC 不会回收），但已脱离 store 管理，读取会得到过期值。

**影响**：这是"浅引用"的固有风险，对异步回调中持有 data 引用的场景有影响（如 `setTimeout` 回调读 `ref.config.left`，此时节点可能已被删除）。

**建议**：在 [01-data-model.md](../design/packages-next/designer-core/01-data-model.md) §1.2 契约中补充：

> `data` 是浅引用，禁止跨删除操作持有。节点删除后旧 data 引用虽未 GC 但已脱离 store 管理，读取会得到过期值。异步回调应通过 `getState()` 或 `useLatestState()` 实时读取，不缓存 data 引用。

### 4.5 【中重要】Setter 的受控契约（value + onChange + detail）

**Tango 做法**（`setting-form` 包）：

```ts
export interface FormItemComponentProps<T = any> {
    value?: T;
    onChange: (value: T, detail?: SetterOnChangeDetailType) => void;
    // ...
}
```

`onChange` 第二参数 `detail` 是 setter 附加元数据，通过 `field.detail` 保存。`FormItem` 把 `onChange` 绑到 `field.handleChange`：

```ts
handleChange = (nextValue, valueDetail) => {
    this.detail = valueDetail;
    this.value = nextValue;
    return this.validate('change');
};
```

**我们的现状**：`useUpdateNode` 返回 `(id, patch) => void`，没有 `detail` 元数据机制。当前项目的 `useUpdateFieldConfig` 也没有。

**盲点**：如果配置面板需要标记"此变更来自颜色选择器"、"此变更是拖拽结束"等元数据，当前设计无法支持。

**建议**：在 `UpdateNodePatch` 中预留可选的 `_detail` 字段（框架不解释，业务自行使用）。目前不急，记录为已知盲点。

### 4.6 【低重要】Context 分离设计

**Tango 做法**：`setting-form` 分离了 `FormModelContext`（模型实例）和 `FormVariableContext`（UI 配置开关），按变频率和语义分 Context。

**我们的现状**：`DesignerProvider` 只注入一个 `Designer` 实例（[`context.tsx`](../../../packages-next/designer-core/src/react/context.tsx)），所有 hooks（高频 `useNode` + 低频 `useExtra`）走同一个 Context。

**评估**：当前单 Context 足够——`Designer` 实例本身不变，hooks 内部各自订阅 store 不同 slice，Context 值的变化频率为 0。如果未来 `Designer` 实例的某些部分会高频变化，可参考 Tango 拆分。目前无需改动。

---

## 5. 优先级汇总与下一步建议

### 5.1 问题优先级

| # | 问题 | 风险 | 类别 | 建议动作 |
|---|---|---|---|---|
| 3.1 | `config` 二次浅合并业务耦合 | 中 | 不合理 | 改为 `deepMergeKeys` 可配置 |
| 3.2 | `useTree` shallowEqual 数组语义 | 中 | 不合理 | 实测验证 → 改为 `Object.is` 或文档说明 |
| 3.3 | `PluginContext` 缺 `updateNode` | 低 | 不合理 | 补充 `updateNode` 到 PluginContext |
| 3.4 | `destroy` 语义边界未文档化 | 低 | 不合理 | 补充文档说明 |
| 4.1 | 选中/拖拽独立模型 | 重要 | 盲点 | 文档记录"不抽象"决策 + Tango 参考 |
| 4.2 | undo/redo 快照方案 | 重要 | 盲点 | 文档记录"未来方案"备忘 |
| 4.3 | iframe 沙箱协议 | 重要 | 盲点 | 文档记录"跨 iframe 边界"章节 |
| 4.4 | 节点删除引用清理 | 中 | 盲点 | 文档补充 data 引用生命周期约束 |
| 4.5 | Setter detail 元数据 | 中 | 盲点 | 记录为已知盲点，暂不实现 |
| 4.6 | Context 分离 | 低 | 盲点 | 当前无需改动，记录备忘 |

### 5.2 建议的下一步

**方案 A：先修代码问题（3.1 + 3.2 + 3.3）**

聚焦 3 个代码层面的问题，改动范围小、风险可控：
1. `config` → `deepMergeKeys` 可配置（影响 `write-paths.ts` + `createTreeStore.ts` + 类型定义）
2. `useTree` equalityFn 改为 `Object.is` 或实测后决定（影响 `hooks.ts`）
3. `PluginContext` 补充 `updateNode`（影响 `plugins/types.ts` + `createTreeStore.ts`）

**方案 B：先补文档盲点（4.1 + 4.2 + 4.3 + 4.4）**

聚焦 4 个文档层面的盲点，不改代码，只补充设计文档：
1. [00-overview.md](../design/packages-next/designer-core/00-overview.md) §2.2 补充"选中/拖拽不抽象"决策 + Tango 参考
2. [00-overview.md](../design/packages-next/designer-core/00-overview.md) §1.3 补充"undo/redo 未来方案"备忘
3. [03-read-path.md](../design/packages-next/designer-core/03-read-path.md) 补充"跨 iframe 边界"章节
4. [01-data-model.md](../design/packages-next/designer-core/01-data-model.md) §1.2 补充 data 引用生命周期约束

**方案 C：并行（A + B 同时做）**

代码修复和文档补充互不阻塞，可并行。

### 5.3 不建议做的事

- **不建议照搬 Tango 的 MobX 路线**：MobX 的自动依赖追踪更优雅，但引入 MobX 会改变整个技术栈，与当前 Zustand + 不可变更新 + buildIndex 引用复用的体系冲突。
- **不建议引入 Tango 的 AST 路线**：AST 适合"基于源代码"的低代码设计器，我们是"基于 JSON schema"的可视化大屏设计器，数据形态根本不同。
- **不建议现在实现 undo/redo**：Tango 的快照方案虽简单，但当前项目无此需求，过早实现是过度设计。记录方案备忘即可。

---

## 6. 相关文档

- [design/packages-next/designer-core/00-overview.md](../design/packages-next/designer-core/00-overview.md) — 框架总纲
- [design/packages-next/designer-core/01-data-model.md](../design/packages-next/designer-core/01-data-model.md) — 数据模型
- [design/packages-next/designer-core/02-write-path.md](../design/packages-next/designer-core/02-write-path.md) — 写路径
- [design/packages-next/designer-core/03-read-path.md](../design/packages-next/designer-core/03-read-path.md) — 读路径
- [design/packages-next/designer-core/04-plugin-system.md](../design/packages-next/designer-core/04-plugin-system.md) — 插件机制
- [design/packages-next/designer-core/05-principles.md](../design/packages-next/designer-core/05-principles.md) — 架构原则
- [research/designer-core-fact-extraction.md](./designer-core-fact-extraction.md) — 事实基准
- Tango 源码：`.local-pkg/tango-main/packages/`
