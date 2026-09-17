# designer-plugins 原则与跨插件契约（02-principles）

> 状态：`已完成实现的事实回填（代码为准）`
> 创建日期：2026-09-16

本包继承 designer-core 全部原则（见 [designer-core/05-principles.md](skills/oss-visual-designer-project-context/design/packages-next/designer-core/05-principles.md)），以下是业务插件层新增的契约。

---

## 1. extra 字段唯一拥有者契约

每个 extra 字段有且只有一个拥有者插件，写入必须走该插件的 API：

| extra 字段 | 拥有者 | 写入入口 |
| --- | --- | --- |
| viewCanvas / viewUI | view | useSetView / useSetSelected |
| globalResponse / dataSetList | dataFetcher | useGlobalFetcher / useUpdateDataSetList |
| realtimeDataFlowData | realtimeDataFlow | dispatch / remove / clear |
| interactions | interaction | dispatchAction / interactionApi.dispatch |
| realtimeDataFlow / customFieldsListMapping | designer-core createRuntimeDataPlugin | runtimeArrayKey / runtimeRecordKey |
| components / byId / parentMap | designer-core | setTree / updateNode / setPartialState |

禁止：任何插件直接 `setPartialState({ extra: { 别人的字段 } })`。跨插件写入必须通过注入的拥有者实例转发（如 interaction 的 dispatchRealtimeDataFlow → realtimeDataFlowPlugin.dispatch，未注入降级 noop + warn）。

## 2. setView 完整 extra 约束

designer-core 的 setPartialState 是顶层浅合并；view 插件的 useSetView 发送完整 extra，其他插件字段**保留原引用**。新增 extra 字段时必须同步补 view/plugin.ts useSetView 内的引用保留列表，否则会清空其他插件状态（历史教训 task-001 done §8.2.5）。

## 3. store 注入方案 B（useDesigner Context）

所有插件 hooks 内部通过 `useDesigner()` 获取 store，不依赖闭包——插件实例可在多次 createDesigner 中复用。`useTypedStore()` 的类型 cast 只发生在类型层（运行时 createDesigner 已绑定 WidgetData / DesignerExtra）。

## 4. useTypedStore 副本问题（已知技术债）

`useTypedStore()` 私有 helper 在 6 个 plugin.ts 各有一份副本（view / layer-management / group-management / data-fetcher / realtime-data-flow / interaction）。历史决策：避免提前抽象导致设计冲突，等统一任务抽到 `hooks/use-typed-store.ts`。**新增插件前应先评估是否已抽取**。

## 5. 依赖纪律

- 唯一依赖 @fedx-vis/designer-core；禁止引入 lodash / @fedx-vis/utils 等（deepEqual 用 JSON.stringify 实现、id 生成用 Date.now+random）
- deepClone 等可变能力通过 Options 注入（interaction），默认实现零依赖
- id 生成函数通过 `options.generateId` 注入（layer-management / group-management），便于对接全局 guid 服务

## 6. 可序列化纪律

写入 extra 的 Error 实例一律序列化为 `SerializableError`（{ message, stack, 自定义属性 }）——data-fetcher 的 globalResponse 与 realtime-data-flow 的 list 均遵守（task-2026-07-29-005 模式，为将来迁 Redux 留兼容）。

## 7. 插件注册流程

新增插件步骤：
1. `src/<plugin-name>/{index,plugin,types}.ts` 新建插件目录
2. `plugin-registry.ts` 的 PluginRegistry 追加一行（key = 插件名）
3. `types.ts` 补 extra 字段类型 + default 初始值
4. `create-designer.ts` 补 initialExtra 默认值合并
5. `view/plugin.ts` useSetView 补引用保留（若新增 extra 字段）
6. `index.ts` barrel 导出
7. `__tests__/` 补测试

PluginOptions 是 Partial 的（不传 = 不启用），因此 PluginRegistry 扩展是向后兼容的。

## 8. 测试

`__tests__/` 9 份测试，运行 `pnpm --filter @fedx-vis/designer-plugins test`。提交前与 designer-core 相同门槛：tsc --noEmit / pnpm build / pnpm test。
