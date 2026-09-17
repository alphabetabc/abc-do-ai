# designer-plugins 总纲（00-overview）

> 状态：`已完成实现的事实回填（代码为准）`
> 创建日期：2026-09-16
> 事实基准：`packages-next/designer-plugins/src/`（实现）+ research/designer-plugins-研究报告.md（2026-08-05 调研，历史底稿）
> 定位：designer-core 之上的**业务插件层**——把主线 src/ 的业务状态能力（view / 图层 / 成组 / 数据请求 / 实时数据流 / 组件交互）以可拔插插件形式接入 designer-core。

---

## 1. 包是什么

@fedx-vis/designer-plugins 是 designer-core 的业务插件集合 + 预设聚合入口。

- **唯一依赖**：@fedx-vis/designer-core（不引入其他依赖，加新依赖需评审）
- **职责**：业务字段类型定义（WidgetData / DesignerExtra）+ 6 个业务插件工厂 + PluginRegistry + 预设 createDesigner
- **非职责**：不改内核契约；不实现 undo/redo / 持久化（跟随 designer-core 非目标）

### 目录结构

```
packages-next/designer-plugins/src/
├── index.ts                 # barrel 导出（应用层唯一入口）
├── create-designer.ts       # 预设聚合入口（方案 B：对象模式 plugins + 泛型绑定）
├── plugin-registry.ts       # PluginRegistry / PluginOptions / EnabledPlugins
├── types.ts                 # 业务类型 + 默认初始值（WidgetData / DesignerExtra / 8 个 default*）
├── hooks/use-persist-fn.ts  # usePersistFn（引用稳定回调）
├── view/                    # createViewPlugin（task-2026-08-06-002）
├── layer-management/        # createLayerManagementPlugin（task-003 + 004）
├── group-management/        # createGroupManagementPlugin（task-005）
├── data-fetcher/            # createDataFetcherPlugin（task-2026-08-07-001）
├── realtime-data-flow/      # createRealtimeDataFlowPlugin（task-002 系列）
├── interaction/             # createInteractionPlugin（task-2026-08-07-003）
└── __tests__/               # 9 份测试
```

> 注：plugin-registry 是**类型注册表**（无运行时逻辑），不是一个独立插件。

## 2. 插件清单（6 个）

| key（PluginRegistry） | 工厂 | 拥有的 extra 字段 | 来源（src/ 迁移） |
| --- | --- | --- | --- |
| view | createViewPlugin | viewCanvas / viewUI | src/store/designer/hooks.ts 的 view 相关 hooks |
| layerManagement | createLayerManagementPlugin | —（只写树） | src/layer-manager 的 lock/show/move/copy/delete |
| groupManagement | createGroupManagementPlugin | —（只写树） | src/layer-manager 的 group/splitGroup |
| dataFetcher | createDataFetcherPlugin | globalResponse / dataSetList | src/plugins/data-fetcher 的 useFetchData / GlobalDataFetcher / GlobalDataSet |
| realtimeDataFlow | createRealtimeDataFlowPlugin | realtimeDataFlowData | src/plugins/data-fetcher/RealtimeDataFlow.ts |
| interaction | createInteractionPlugin | interactions | src/plugins/interaction/component 的 hooks + reducer |

不落在本包、由 designer-core 承载的字段：
- `extra.realtimeDataFlow`（订阅索引）— createRuntimeDataPlugin `runtimeArrayKey`
- `extra.customFieldsListMapping` — createRuntimeDataPlugin `runtimeRecordKey`

## 3. 聚合入口 createDesigner（方案 B）

见 [create-designer.ts](packages-next/designer-plugins/src/create-designer.ts)。

- 泛型绑定：`Designer<WidgetData, TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>`（应用层不用传）
- 预设 `deepMergeKeys: ['config']`（updateNode 时 config 二次浅合并）
- plugins 为**对象模式**：key = 插件名，value = 插件实例；不传 = 不启用（对应字段为 undefined）；传自定义实例 = 替换默认实现
- 返回值 = core 全部能力 + 已启用插件实例（`designer.view` / `designer.dataFetcher`…）
- initialExtra 与 8 个默认值浅合并（见 types.ts 的 default*）

用法：

```tsx
const designer = createDesigner({
    initialComponents: [...],
    plugins: {
        view: createViewPlugin(),
        layerManagement: createLayerManagementPlugin(),
        // 不传 groupManagement → 不启用
    },
});
// 组件内
const scale = designer.view!.useViewScale();
```

## 4. 与 research 报告的差异（历史对照）

research/designer-plugins-研究报告.md（2026-08-05）撰写时本包尚未创建，为设计底稿。实现与报告的主要差异：

- 报告设计的 `layer-ops` 落地为 `layer-management`；报告设计的 data-fetcher 含 RealtimeDataFlow，落地时拆分为独立 `realtime-data-flow` 插件
- 实际为 6 个业务插件 + plugin-registry 类型注册表（报告按 7 插件规划）
- 报告优先级 P0 view → P1 layer → P2 group → P3 data-fetcher → P4 interaction，实际落地顺序一致，另增 realtime-data-flow（介于 data-fetcher 与 interaction 之间）
- selected 状态落在 viewUI.selected（task-2026-08-07-004），报告期尚未规划

## 5. 相关文档

- [01-plugins.md](skills/oss-visual-designer-project-context/design/packages-next/designer-plugins/01-plugins.md)（各插件契约）
- [02-principles.md](skills/oss-visual-designer-project-context/design/packages-next/designer-plugins/02-principles.md)（跨插件契约与原则）
- [designer-core/00-overview.md](skills/oss-visual-designer-project-context/design/packages-next/designer-core/00-overview.md)（内核契约，本包的地基）
- [research/designer-plugins-研究报告.md](skills/oss-visual-designer-project-context/research/designer-plugins-研究报告.md)（历史调研底稿）
