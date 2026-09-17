# src 能力差距矩阵（task-2026-09-16-003 · 合并版）

> 状态：**初稿待拍板**（硬门槛②）。创建：2026-09-17。
>
> 定位：从 src 应用入口沿调用链系统遍历全部用户可感知能力的合并矩阵，是 [designer-app 演进方案套件](designer-app/00-overview.md) Phase 0 的事实账本与 Phase 1-3 任务拆分来源。
>
> 任务卡：`plans/task-2026-09-16-003-src-capability-inventory.md`。
>
> **来源与合并方法**：三个独立模型分别遍历产出报告（r1 系列 3 篇 / r2 1 篇 / r3 系列 4 篇，原稿位于仓库根 `.local-review/`），本文档为三报告求并集后的合并稿。编号体系以 r3（A/B/C 前缀，最详尽且经代码复核）为主干，r1/r2 独有条目以「+」前缀补入对应区块。三报告分歧处已逐条回 packages-next 代码验证，裁定记录见 §0.3。
>
> 遍历纪律：入口驱动（只登记被入口链路实际触达的能力）/ 触达即登记（粒度=用户可感知能力）/ 分叉逐分支跟（visualType / designerType / mode / FIELD_COMP_TYPES / materialType）/ 每行带代码证据 / 排除 `.bak` 与死别名 `@Configs/*`。

---

## 0. 处置图例与总体结论

### 0.1 处置列（四选一）

| 标记 | 含义 | 判定依据 |
| --- | --- | --- |
| **① 已覆盖** | core/plugins 已有等价能力，新壳直接组装 | 证据落在 `packages-next/designer-core` 或 `packages-next/designer-plugins` |
| **② 协议项** | MaterialCompatHost 物料兼容协议必须冻结/承接的面（Phase 0） | resolve map、importFields、物料 Props 注入、落树形态、mode×visualType 渲染矩阵、存量数据兼容附录 |
| **③ 重建** | core/plugins 无承载且不属于物料协议，须在 Phase 1-3 新写（Phase 2 = formily 表单域，在备注注明） | 全部设计器 UI、页面壳、预览壳、未迁移的业务工厂 |
| **④ 待拍板** | 死代码 / 未实现占位 / 去留需业务决策 | 见 §6 待拍板清单 |

### 0.2 总体结论

1. `designer-core` 只提供**树状态骨架 + 插件机制**（createTreeStore / useNode / useTree / setTree / updateNode / runtime-data / derived-compute / structure-tools / cross-slice-sync），无任何 UI。
2. `designer-plugins` 实际为 **6 插件**（view / layer-management / group-management / data-fetcher / realtime-data-flow / interaction），只提供状态逻辑与命令式 hooks，**无 UI、无 animation / DPU / ConfigFormatter 插件**（AGENTS.md「7 插件」与代码不符，以代码为准）。
3. `designer-next` 的 designer/preview 模块仍是 `<span>` 空壳且零引用 core/plugins。**src 的全部用户可感知 UI 能力在新架构侧覆盖率为 0**，差距主体是 ③ 重建。
4. ① 集中在**状态与命令层**（约占编号项两成）：树读写路径、图层/成组命令、交互 hooks+reducer、数据请求主干、实时数据流、组算法纯函数、view 状态。
5. ② 边界清晰，可直接进 Phase 0 冻结。
6. 三模型遍历互相印证的高置信事实：undo/redo 不存在（与 05-deleted-api.md 一致）；框选/磁吸/方向键微调/Ctrl+C/V 不存在；画布「分布/合并/拆分」按钮为注释占位；一键升级 UI 被永久过滤；spreadsheet 页未挂路由。

### 0.3 三报告分歧裁定（已回代码验证）

| # | 分歧 | r1 说法 | r2/r3 说法 | **裁定** | 验证证据 |
| --- | --- | --- | --- | --- | --- |
| J1 | customFieldsListMapping 承载 | G-12 标 ①（已迁） | r2/C3 称新架构无对应 | **状态承载有**（extra.customFieldsListMapping 经 core createRuntimeDataPlugin `runtimeRecordKey` 初始化并写入），但 **src 的 `useCustomFieldsList {get,record,del}` 专用 hooks 无等价**，删除组件时的联动清理需重建时补 | [types.ts](packages-next/designer-plugins/src/types.ts#L248-L251)、[plugin-registry.ts](packages-next/designer-plugins/src/plugin-registry.ts#L42) |
| J2 | app slice（designerType / contextMenu / topToolbarHiddenList） | G-10 标 ① | r3/D5 称无承载 | **无承载**（packages-next 全目录 grep 零命中）→ 五种 designerType 分叉需 Phase 1 壳层自定义 extra 承载，r1 标 ① 有误，本文修正为 ③＋②（模式矩阵协议） | grep `designerType\|topToolbarHiddenList\|contextMenu` 于 packages-next |
| J3 | designer-plugins 插件数 | 称 7 插件（沿 AGENTS.md） | r3 称 6 插件 | **6 插件**（目录结构与 plugin-registry 实测；无 animation） | [designer-plugins/src](packages-next/designer-plugins/src) |
| J4 | viewUI.selected 形态 | 未提及 | r3/D1 称仅单选 | **`selected: string \| null` 单选**；src 的多选（逗号串）在新架构无状态位，Phase 3 需扩展 | [types.ts](packages-next/designer-plugins/src/types.ts#L77) |
| J5 | createRecalcGroupBounds | r2 称「plugins 未集成」 | r3/A32 称 core 已导出纯函数、未接线 | 两者兼容：**core 已导出**（group-bounds.ts），**插件未集成**，DesignerContent 式订阅接线属 ③ | [group-bounds.ts](packages-next/designer-core/src/core/utils/group-bounds.ts) |
| J6 | copy 子树 uniqueId 重置 | r1 未提及 | r2/C4、r3/D4 称默认不重置 | **layer-management copy 默认 `resetChildrenUniqueId=false`**，src 为 true → 重建画布复制时必须显式传 true | [plugin.ts](packages-next/designer-plugins/src/layer-management/plugin.ts#L256) |

---

## 1. 区块一 · 入口层（路由 × 页面 × App 壳 × visualType）

### 1.1 路由矩阵

路由事实源：[route-list.ts](src/routes/route-list.ts)（`router.setComponentLoader` 动态 `import('@Pages/${component}')`，L135）。

| # | 路由 | 页面组件 | 用户可感知能力 / 分叉 | 处置 |
| --- | --- | --- | --- | --- |
| A01 | `/`（仅 dev 或 ENABLE_LOCAL_DESIGNER） | [dev-page/index.tsx](src/pages/dev-page/index.tsx) | 研发入口页：designer-local / schema-designer / 物料预览 / 性能测试 / 数字人演示 / MaterialsDevEntry 链接 | ④ 待拍板（研发辅助页，不进生产面；ENABLE_LOCAL_DESIGNER 生产分叉去留需确认） |
| A02 | `/designer-local`（条件同上） | [large-screen-local/index.tsx](src/pages/designer-page/large-screen-local/index.tsx) | 本地大屏设计器；挂载即 dispatch `GlobalDataSet.enableEmptyDatasetList()`，不包性能 Provider | ④ 待拍板（dev only） |
| A03 | `/designer` | [large-screen/index.tsx](src/pages/designer-page/large-screen/index.tsx) | 场景大屏设计器：DESIGNER_TYPE_LARGE_SCREEN，包 ScreenPerformanceProvider | ③ 重建（页面壳；性能监控见 C46） |
| A04 | `/designer-scene-monitor` | [designer-scene-monitor/index.tsx](src/pages/designer-page/designer-scene-monitor/index.tsx) | 场景监控嵌入式设计器，分叉最重：`showTopBarZone=false`、`configurationPanel=false`、`enableWidgetMovable=false`；隐藏 SketchRuler/ClearRulerLines/LayerButtons；自定义 [AsidePanel](src/pages/designer-page/designer-scene-monitor/components/aside-panel/index.tsx)（仅业务组件库 group 28）；微应用消息 `changeSceneMonitorEmbedDesignerSave`（designerRef.triggerSave）、`changeSceneMonitorEmbedDesignerBusinessComponentsList`（白名单过滤，20s 超时）；onSave postMessage `onDesignerSave`；物料按 `materialType===business` 白名单过滤；qiankun 传参 sceneId | ③ **已拍板（Q9，2026-09-17）：做成业务插件（plugin-scene-monitor），优先级非常低**，非首批重建；嵌入协议抽象随插件立项再定 |
| A05 | `/designer/layout` | [layout/index.tsx](src/pages/designer-page/layout/index.tsx) | 布局模板设计器：DESIGNER_TYPE_LAYOUT；configValidator 限定 visualType===layout(2) | ③ 重建（designerType 加载闸门概念 core 已有） |
| A06 | `/designer/material/business` | [designer-material-business/index.tsx](src/pages/designer-page/designer-material-business/index.tsx) | 业务组件设计器：DESIGNER_TYPE_BUSINESS_COMP；假 sceneId=uuid()；隐藏 recycle/create-template/snapshot/error；取数/保存走 [useCompDetailData4Designer.ts](src/pages/hooks/useCompDetailData4Designer.ts) + [useSaveCompDetailData4Designer.ts](src/pages/hooks/useSaveCompDetailData4Designer.ts)（type='business'）；保存=画布打包成 group 经 compApi.compSave；伪场景 id=-9999、visualType=1 | ③ 重建＋②（伪场景构造与物料打包回存协议进 Phase 0 讨论） |
| A07 | `/designer/material/custom` | [designer-material-custom/index.tsx](src/pages/designer-page/designer-material-custom/index.tsx) | 自定义组件设计器：DESIGNER_TYPE_CUSTOM_COMP；同 A06 hooks，type='custom' | ③ 重建＋②（同 A06） |
| A08 | `/workspace/preview` | [large-screen-viewer/index.tsx](src/pages/preview/large-screen-viewer/index.tsx) | 大屏预览：包数字人 enableMetaHuman + MetaHumanViewTrigger（数字人指令弹窗下钻/iframe/开新 Tab） | ③ 重建（数字人见 Q3） |
| A09 | `/workspace/preview-scene-monitor` | [preview-scene-monitor/index.tsx](src/pages/preview/preview-scene-monitor/index.tsx) | 同 LargeScreenPreview，仅追加 className | ③ 重建 |
| A10 | `/workspace/share` | [large-screen-viewer/index.tsx](src/pages/preview/large-screen-viewer/index.tsx) | 分享页复用预览组件（URL 带 shareId 时走 Viewer 内 shareId 分支） | ③ 重建 |
| A11 | `/workspace/share/preview` | [large-screen-share-preview/index.tsx](src/pages/preview/large-screen-share-preview/index.tsx) | 免登分享预览：`visualManageApi.detail({shareId, isSharePreview:'1'})` | ③ 重建 |
| A12 | `/releasePage/:releaseId` | [release-page/index.jsx](src/pages/release-page/index.jsx) | class 跳板页：读 shareId/sceneId/ticket → postMessage(closeTabs) → window.open 分享/预览 URL（解公共端口无权限数据问题）；route-list 中另有 100 条 releasePage 预留路由注释块（L10-18，未启用） | ③ 重建（跳板逻辑薄）＋④（100 预留路由机制是否还需要，见 Q11） |
| A13 | `/workspace/preview/material` | [preview/material/index.tsx](src/pages/preview/material/index.tsx) | 单物料预览（**唯一不用 DesignerParser 的 preview 入口**，直接用编辑器 Designer）：隐藏 help/recycle/create-template/snapshot/pushVisual/error/preview 7 按钮；按 materialId 定位物料 + `useRemoteSchema({imports:['defaultValue']})` 组装伪场景（id=-9999、1920×1080、visualType=1） | ③ 重建＋②（物料 defaultValue 协议） |
| A14 | `/workspace/preview/material-business`、`/material-custom` | [material-business/index.tsx](src/pages/preview/material-business/index.tsx)、[material-custom/index.tsx](src/pages/preview/material-custom/index.tsx) | 组件预览：LargeScreenPreview + useCompDetailData4Designer（与编辑侧共享取数 hook） | ③ 重建＋② |
| A15 | `/schema-designer`（lazy） | [schema-designer/index.tsx](src/schema-designer/index.tsx) | 独立 Schema 设计器：fedx-report FedxReportDesigner 三 tab（config L22-349 / dataConfig L351-370 / interactions L372-917，effect 枚举 Dispatch/Modal/Drawer）；「复制 schema」导出 fields JSON；文件 @ts-nocheck，复用 src/formily/widgets | **已拍板（Q8，2026-09-17）：不迁移**，配置 schema 由 Phase 2 新解释器生态承接 |
| A16 | `/test/ui/material-selector`、`/dev/material`（dev） | [dev-page/ui/material-selector](src/pages/dev-page/ui/material-selector/index.tsx)、[preview/material](src/pages/preview/material/index.tsx) | 研发测试路由 | ④ 待拍板（dev only） |
| A17 | 未挂路由 | [spreadsheet/index.jsx](src/pages/spreadsheet/index.jsx) | 电子表格页：route-list 无任何引用 | ④ 待拍板（存档） |

### 1.2 App 壳与启动链

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| A18 | single-spa 微应用生命周期 bootstrap/mount/unmount/update（`__INJECT_BY_SINGLE_SPA__` 判定；activeChanged 广播） | [index.js](src/index.js) L44-135 | MemoryRouter（微应用）vs BrowserRouter + enableLocalAuth（独立运行） | ③ 重建（Phase 1 壳层微应用适配器） |
| A19 | enableLocalAuth 本地伪鉴权：读 `${STATIC_PATH}/local/local-auth.json` | [container/index.tsx](src/app/container/index.tsx) L137-160 | CONFIG_LOCAL 且无主框架 | ④ dev 工具链（新壳本地开发模式照搬，形态待定） |
| A20 | 容器装配：environmentLoaded 门控 + ConfigProvider(oss-ui prefixCls) + Redux Provider + PersistGate(whitelist=[]) + AliveScope(keep-alive) + ErrorBoundary + 全局空态 + GlobalFonts + 主题 postMessage（changeTheme） | [container/index.tsx](src/app/container/index.tsx) L46-127 | — | ③ 重建（新壳换 Zustand 后 Provider/PersistGate 形态重写；ErrorBoundary/GlobalFonts/主题行为保留） |
| A21 | 微应用 onGlobalStateChange 同步登录态（userName/userId/userInfo/isAdmin/systemInfo/activeRoute）与主题 | [container/index.tsx](src/app/container/index.tsx) L67-103 | 微应用模式 | ③ 重建（hox 五模型归属 Phase 1 壳层，见 §3.5） |
| A22 | resetContainerStore（库被宿主复用时重置 store） | [lib.entry.ts](src/lib.entry.ts) | 库模式 | ③ 重建 |
| A23 | 初始器：immer `setAutoFreeze(false)`、oss-ui Modal/Drawer getContainer 挂微应用节点、iconfont、animate.css 静态资源、全局字体 | [initializer/index.ts](src/app/initializer/index.ts)、[container/index.tsx](src/app/container/index.tsx) L54-62 | — | ③ 重建（setAutoFreeze 与 Redux/Immer 绑定，新壳不需要；animate.css 是物料运行时资产 → ② 随物料走） |
| A24 | 库入口导出（Container / LargeScreenViewer（innerOpen 包装预览）/ LocaleProvider / resetContainerStore / registerLocalMaterials） | [lib.entry.ts](src/lib.entry.ts)、[app/viewers/large-screen/index.tsx](src/app/viewers/large-screen/index.tsx) | 外部宿主内嵌形态 | ③ 重建（导出面需 Phase 1 重新对齐宿主） |
| A25 | 独立 Parser 包壳 DesignerParserEntry（微前端直接渲染 schema） | [DesignerParserEntry.js](src/DesignerParserEntry.js) | viewer 纯渲染形态对外出口 | ③ 重建（对应预览渲染链 C04） |
| A26 | visualType 三分叉：1=scene 场景 / 2=layout 布局模板 / 3=template 场景模板（权威源 `node_modules/@fedx-vis/share/src/enum/EnumObject.ts`，接入 [common/enum/index.js](src/common/enum/index.js)） | 消费点遍布 toolbar / 物料面板 / configValidator / AppScopeId / 数据集归属 | 与 designerType 正交 | ② 协议项（落树/渲染矩阵必须冻结的模式维度） |
| A27 | 大屏预览 Viewer：独立 `createPageStore()`；getData 三分支（props 注入 / id / shareId）；ConfigFormatter；MetaHumanProvider；InitDataQuery（innerOpen 分支静默刷数据集）；`environment.performance.enableFetchStorage` 取数缓存兜底；useMetaHumanSdk（SDK 独立加载钩子）；component/querys 传参；微应用嵌入清容器 padding | [Viewer.jsx](src/pages/preview/large-screen/Viewer.jsx) L64-168、[useSdk.ts](src/pages/hooks/useSdk.ts) | 独立页 vs 内嵌 innerOpen；sceneId vs shareId | ③ 重建（fetchStorage 属数据域协议 ②/③ 交界） |
| A28 | 数字人集成：SDK 动态加载、useMetaHumanEffect、SWITCH_OPERATE 切页（GroupField sliderIndex 联动）、global-control/api | [context-meta-human/index.tsx](src/designer/common/context/context-meta-human/index.tsx)、[MetalHumanViewTrigger.tsx](src/pages/preview/large-screen/MetalHumanViewTrigger.tsx) | 预览页 enableMetaHuman | ③ 重建（业务集成深、成本高，是否首批见 Q3） |

### 1.3 visualType 分叉轴（细分叉点）

| # | 分叉行为 | 代码证据 | 处置 |
| --- | --- | --- | --- |
| V-01 | configValidator 加载闸门（layout 页面只放行 visualType=2） | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L245、[designer/index.jsx](src/designer/index.jsx) L34 | ③（闸门概念 core 已有，装配重建） |
| V-02 | `generateAppScopeId(id, visualType)` 作用域 id（DPU/数据集隔离键），格式 `$$_APP_SCOPE_ID_$$_${id}_${visualType}_$$` | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L257-258、[AppScope.tsx](src/designer/common/env/AppScope.tsx) | ②（作用域格式属兼容协议） |
| V-03 | 标题分叉：scene→「场景编辑器」，其余→「模板编辑器」 | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L454 | ③ |
| V-04 | 发布前自动保存仅 scene | [toolbar/index.js](src/designer/toolbar/index.js) L193 | ③ |
| V-05 | 发布弹窗分叉：scene→ReleaseScene（含快照管理+AES ticket 免密鉴权 `getAuthTicket`）；layout/template→ReleaseTemp；`shareStatus===1` 显示「取消发布」 | [publish-modal/index.jsx](src/designer/toolbar/comp/publish-modal/index.jsx) L95-108、[share.ts](src/routes/share.ts) | ③ |
| V-06 | 生成模板/快照按钮在 layout/template 隐藏 | [toolbar/index.js](src/designer/toolbar/index.js) L116、L146-174 | ③ |
| V-07 | 生成模板写 `visualType=template`（列表/保存均带） | [saveAsTemp-modal/index.tsx](src/designer/toolbar/comp/saveAsTemp-modal/index.tsx) L23、L54、L77 | ③ |
| V-08 | layout-block viewer 分叉：`isViewer = !isDevelopment && visualType !== layout` 时去边框不渲染占位（**透明布局**） | [layout-block/index.tsx](src/designer/renderer/components/layout-block/index.tsx) L31 | ②＋③（渲染矩阵已列入 Phase 0 冻结） |
| V-09 | 数据集归属（updateDataSetList/relatedType/dataset-api 参数均带 visualType） | [InitDataQuery/index.tsx](src/designer/data-query/InitDataQuery/index.tsx) L185、[dataset-api.ts](src/common/services/dataset-api.ts) L137-200 | ②/③ |
| V-10 | 伪场景构造统一 visualType=1（物料/业务/自定义编辑与预览） | [useMaterialData.ts](src/pages/preview/material/useMaterialData.ts) L33、[useCompDetailData4Designer.ts](src/pages/hooks/useCompDetailData4Designer.ts) L48 | ② |
| V-11 | meta 未加载（!visualType）时右侧按钮组为空 | [toolbar/index.js](src/designer/toolbar/index.js) L231-238 | ③ |

### 1.4 微应用通信面（shareActions）

| # | 能力 | 代码证据 | 处置 |
| --- | --- | --- | --- |
| S-70 | 主题变更 postMessage（changeTheme，非 dark 首帧 + activeChanged 重同步） | [container/index.tsx](src/app/container/index.tsx) L39-44、L83-103 | ③ |
| S-71 | onDesignerSave 保存通知（microApp 通道） | [designer-scene-monitor/index.tsx](src/pages/designer-page/designer-scene-monitor/index.tsx) | ③（嵌入协议，见 Q9） |
| S-72 | changeSceneMonitorEmbedDesignerSave 外部触发保存；changeSceneMonitorEmbedDesignerBusinessComponentsList 业务组件白名单（20s 超时） | 同上 | ③（嵌入协议，见 Q9） |
| S-73 | sceneId / microAppProps 透传 | [index.js](src/index.js) L99-110 | ③ |

> 注（r2/C6 存疑）：场景监控保存回传链部分代码已注释（[DesignerContent.tsx](src/designer/DesignerContent.tsx) L181-185、L334-341），嵌入链是否仍在产需确认（Q10）。

### 1.5 DesignerContent 组装根横切能力

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| A29 | 大屏取数：默认 `visualManageApi.detail({id})` → ConfigFormatter.dataConfig → generateAppScopeId → setComponents 重建树；component/mode=DEVELOPMENT、component/querys=pathToParam | [DesignerContent.tsx](src/designer/DesignerContent.tsx)；业务/自定义组件页改用 useCompDetailData4Designer（A06/A07） | designerType 五路取数 | ③ 重建（取数适配层；树写入本体 ①） |
| A30 | 保存序列化 `{ page, components, realtimeDataFlow, customFieldsListMapping: {} }` → visualManageApi.save 或 props.onSave；含 config JSON + 缩略图 + 分辨率；Ctrl+S；autoSave 定时器（`environment.designerConfig.autoSave/timeout`）；designerRef 暴露 triggerSave/getState；权限 useAuthBtn(saveVisual) | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L344-408、[use-auth-btn.tsx](src/hooks/use-auth-btn.tsx) | 嵌入模式走 onSave postMessage（A04） | ③ 重建（持久化另立任务）＋②（保存 payload 协议） |
| A31 | Delete 键删除（焦点不在 INPUT 时）：layerManager.delete + customFieldsList.del + realtimeDataFlow.del，Modal.confirm 二次确认 | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L410-430 | — | ③ 重建（命令本体 ①：layer-management useDeleteNode + realtime-data-flow useRemoveRealtimeDataByUniqueId；键盘绑定与 customFieldsList 级联清理需接线，见 J1） |
| A32 | recalcGroupBounds：store.subscribe 监听子组件变动重算组尺寸（isRecalcRef 防重入） | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L284-328 | — | ① 算法已覆盖（core [group-bounds.ts](packages-next/designer-core/src/core/utils/group-bounds.ts) 导出）＋③ 接线（插件未集成，见 J5） |
| A33 | onValueChange 仅支持下钻 level 0（level>0 警告不支持） | [DesignerContent.tsx](src/designer/DesignerContent.tsx) | 下钻层级 | ③＋④（单层即终态还是补多层，见 Q5） |
| A34 | ScopeProvider 注入 `{ appScopeId, sceneId, visualType }`；InitDataQuery 预取；InjectContextMenuModal | [env/index.tsx](src/designer/common/env/index.tsx)、[DesignerContent.tsx](src/designer/DesignerContent.tsx) | — | ②（作用域三元组进协议）＋③（Provider/预取编排重建） |
| A35 | DesignerContent 可注入 props 契约：dataSource/getData/onSave/configValidator/componentsListFormatter/hideCanvasGraphWidgetList/enableWidgetMovable/showTopBarZone/asidePanel/configurationPanel/designerRef | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L37-100 | 场景监控/物料设计器依赖它 | ③ 重建（新壳需保留等价扩展点） |

### 1.6 登录 / 环境 / 权限链（App 壳层域）

| # | 能力 | 代码证据 | 说明 | 处置 |
| --- | --- | --- | --- | --- |
| P-40 | 菜单权限 oprations→activeRoute 匹配 | [container/index.tsx](src/app/container/index.tsx) L88 | 主菜单权限对象按当前路由匹配 | ③ |
| P-41 | 按钮鉴权 useAuthBtn（operationsButton[].key + `environment.buttonAuthorize` 开关；saveVisual/pushVisual/addTemplet/addSnapshot/snapshot） | [use-auth-btn.tsx](src/hooks/use-auth-btn.tsx)、[auth-button.js](src/common/enum/auth-button.js) | 保存/发布/模板/快照按钮无权限提示 | ③（core 需权限钩子位） |
| P-42 | 行权限 useOperationPermission（isAdmin 或 userId===createBy） | [use-operation-permission.tsx](src/hooks/use-operation-permission.tsx) | 快照/物料列表操作权 | ③ |
| P-43 | 服务层 userId/zoneId 注入 | [visualManage-api.ts](src/common/services/visualManage-api.ts) L54、L93、[dataset-api.ts](src/common/services/dataset-api.ts) L150、[dpu-api.ts](src/common/services/dpu-api.ts)、[compManage-api.ts](src/common/services/compManage-api.ts)、[material-api.ts](src/common/services/material-api.ts) | zoneId 派生自 useLoginInfo | ③ |
| P-44 | 环境配置源分叉（服务端 environment.json vs 本地 environment-local.json，带 token 头） | [useEnvironment.ts](src/hox/useEnvironment.ts) | 环境键消费面：designerConfig.{timeout,autoSave,settingCollapsed,enableAuthorization,enableMaterialConfig} / visualMaterialConfig.url / performance.{concurrentRenderCount,enableFetchStorage} / businessIndicatorDataConfig.show / materialConfig / sdk / metaHumanSDK / MetaHumanSceneSetting / buttonAuthorize | ②/③（环境键集合需 Phase 0 冻结） |

区块一统计：③ 重建约 30 项｜④ 待拍板 7 项｜② 协议项约 8 项（含交叉标记）。

---

## 2. 区块二 · 设计器六区域

组装链：[designer/index.jsx](src/designer/index.jsx) → [DesignerContent.tsx](src/designer/DesignerContent.tsx) 挂载 DesignerHeader(toolbar) / AsidePanel / CanvasGraph / ConfigurationPanel / InjectContextMenuModal / InitDataQuery / RecursionComponents。

### 2.1 区域① toolbar（顶部工具栏）

事实源：[toolbar/index.js](src/designer/toolbar/index.js)。显隐分叉维度：visualType（1/2/3）× designerType（5 种）× topToolbarHiddenList × 权限 authKey。

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B01 | 「场景编辑器」标题占位死按钮（点击 `_.noop`）；「交互编辑器」按钮已注释 | [toolbar/index.js](src/designer/toolbar/index.js) L246 | — | ④ 待拍板（死按钮去留） |
| B02 | 左侧面板 / 右侧面板（初始值取 `environment.designerConfig.settingCollapsed`）/ 画布工具栏折叠开关 | [toolbar/index.js](src/designer/toolbar/index.js) L249-278 | — | ① 状态已覆盖（view 插件 viewUI 三 Collapsed）＋③ 按钮 UI |
| B03 | 代码：Monaco 查看 {page,components} JSON / 复制配置 / 保存配置回写 setDesignerCanvasState + 自动保存 | [toolbar/index.js](src/designer/toolbar/index.js) L282、L321-358 | — | ③ 重建（JSON 直接回写整树与新架构 setTree 的关系需 Phase 3 明确） |
| B04 | 数据集抽屉：分组树/列表/搜索/「选择分组」保存用户订阅分组 `dataSetApi.saveSelectedGroups`/刷新走 GlobalDataSet.updateDataSetList | [dataset/index.tsx](src/designer/toolbar/comp/dataset/index.tsx) L66、[DataSetGroupTree.tsx](src/designer/toolbar/comp/dataset/DataSetGroupTree.tsx) L38 | 非 LAYOUT 才显示 | ③ UI 重建；数据集列表状态 ①（dataFetcher dataSetList/useUpdateDataSetList）；「选中分组」保存语义无承载 → 重建补 |
| B05 | DPU 抽屉：CRUD（temp_ 前缀临时 id/保存/复制/删除，MonacoEditor 编辑 JS 函数体，按 appScopeId 隔离） | [dpu/index.tsx](src/designer/toolbar/comp/dpu/index.tsx) L20、DpuItem.tsx | 非 LAYOUT | ③ 重建；dpuList 现在在 hox useComponentsInfo，新架构归属未定 |
| B06 | 全局参数弹窗（交互参数总表：源组件/参数/目标组件，按参数名检索+刷新；`useWorkerInteractionParams` 环境开关分叉 Worker 或旧 interaction graph） | [params/index.tsx](src/designer/toolbar/comp/params/index.tsx) L126 | 非 LAYOUT | ③ 重建；交互图 hooks ①（interaction useInteractionsGraph） |
| B07 | 帮助 / 页面信息；`enablePerformance` 时弹性能 Detail（useScreenPerformance.showDetailModal），否则 window.open 操作指南 | [toolbar/index.js](src/designer/toolbar/index.js) L126-138 | 性能开关 | ③ 重建 |
| B08 | 生成模板：ModalSaveAsTemp（visualType=3 另存；场景为空/无 sceneId 不允许） | [saveAsTemp-modal/index.tsx](src/designer/toolbar/comp/saveAsTemp-modal/index.tsx) | iconHidden：layout/template 隐藏；authKey addTemplet | ③ |
| B09 | 快照：点击先 handleSave(false) 再 snapshotApi.add + 快照管理抽屉 | [snapshot/index.tsx](src/designer/toolbar/comp/snapshot/index.tsx) L32-44 | 双权限 addSnapshot+snapshot；业务/自定义组件页隐藏 | ③ |
| B10 | 快照表格操作：复制分享链接、锁定/解锁、删除、覆盖 cover、发布/取消发布（切换激活快照 shareStatus=1、清除/覆盖 ticket）、预览、新建、备注行内编辑、批量删除 | [editable-table/index.jsx](src/designer/toolbar/comp/snapshot-drawer/editable-table/index.jsx)、[edit-release-status/index.tsx](src/designer/toolbar/comp/snapshot-drawer/edit-release-status/index.tsx) | — | ③ |
| B11 | 快照**无「恢复到快照」**（grep 核实：只有「删除将无法恢复」文案与 cover 覆盖） | [editable-table/index.jsx](src/designer/toolbar/comp/snapshot-drawer/editable-table/index.jsx) L125-129 | — | ④ 待拍板（快照=发布版本管理而非历史回滚，见 Q7） |
| B12 | 发布（场景）：自动保存 + ModalReleaseConfirm；已发布变「取消发布」 | [publish-modal/index.jsx](src/designer/toolbar/comp/publish-modal/index.jsx) | authKey pushVisual | ③ |
| B13 | 发布（业务/自定义组件）：ModalCompPublish，semver 三段版本号默认 patch 自增 + 发布说明 | [modal-comp-publish/index.tsx](src/designer/toolbar/comp/modal-comp-publish/index.tsx) | designerType=BUSINESS_COMP/CUSTOM_COMP | ③＋②（按 MATERIAL_TYPES 复用） |
| B14 | 常规发布 / 免密发布（AES ticket）/ 分享链接复制 / 快照入口（ReleaseScene）；模板发布 ReleaseTemp | [publish-modal/index.jsx](src/designer/toolbar/comp/publish-modal/index.jsx) | — | ③ |
| B15 | 预览：发布前先自动保存后 window.open 对应 RouteURL（三分叉：大屏 sceneId / materialBusinessPreviewUrl / materialCustomPreviewUrl） | [toolbar/index.js](src/designer/toolbar/index.js) L203-229 | designerType 分叉 | ③ |
| B16 | topToolbarHiddenList 按 iconType 过滤 + authKey 权限渲染（VerticalIconButtonWithAuth） | [toolbar/index.js](src/designer/toolbar/index.js) L231-238、L309-312 | 页面级注入隐藏列表（material/scene-monitor 页面用） | ③＋②（页面配置注入协议） |
| B17 | 回收站、错误图标 | [toolbar/index.js](src/designer/toolbar/index.js) L139-144、L197-202 | **代码已注释，不存在** | ④（确认放弃） |
| B18 | undo/redo | 全 src grep 无实现/按钮/reducer | **不存在** | ④（确认不重建，与 [05-deleted-api.md](design/src/designer-state/05-deleted-api.md) 禁区一致） |

### 2.2 区域② aside-panel（左侧：图层树 + 物料库）

事实源：[aside-panel/index.js](src/designer/aside-panel/index.js)（SplitPanel 上下 = LayersTree + Materials，各自可折叠可拖高）。

#### 物料库

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B19 | 订阅物料分组树：compApi.getSubscribeGroupList → buildGroup/assignComponents2TreeNode（按 groupId+sort）；三级结构（一级分类竖排 Tabs → 二级分组 Collapse → 三级物料卡片双列 LazyImage） | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx)、[field-enum.tsx](src/designer/aside-panel/materials/field-enum.tsx) L9-75 | — | ③ UI/编排；物料列表本体在 hox useComponentsInfo（壳层域） |
| B20 | LAYOUT 类型过滤：只保留布局块组(GROUP_ID=9)/自定义组(27)/id=1 及 27 子分组 | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx) L79-86 | designerType=LAYOUT | ②（分组可见性白名单进协议附录）＋③ |
| B21 | 物料来源三分组：自定义组件库组 id=27、业务组件库组 id=28（标题强改）；materialType 1=component/2=custom/3=business | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx) L188-194、[constants.ts](src/designer/constants.ts) L119 | 场景监控嵌入仅显示 28 | ②（MATERIAL_TYPES 协议，与节点类型正交） |
| B22 | 资产搜索（Select 按 name）、刷新物料列表 refreshComponentsList（经 componentsMethods） | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx) L105-108、L157-171、L214-250 | — | ③ |
| B23 | 物料卡片网格（DragItem HTML5 拖拽包裹，拖影=卡片中心） | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx)、[DragItem.tsx](src/designer/common/dnd/DragItem.tsx) L8-18 | — | ③；DragItem dataTransfer 载荷 ②（与 D 区 drop 同一份拖放协议） |
| B24 | 一键升级 Popover：UI 定义存在但被 `.filter(type!=='oneKeyUpgrade')` 永久过滤 | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx) L110-172 | — | ④ 待拍板（死 UI，不迁移；残留清理另立 task） |
| B25 | 面板折叠（materialsListCollapsed） | [materials/index.tsx](src/designer/aside-panel/materials/index.tsx) L251-260 | — | ①（view 插件字段桶） |

#### 图层树

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B26 | 图层工具栏：置顶/上移一层/下移一层/置底、删除、成组/取消成组、锁定/解锁、隐藏/显示（多选时移动类禁用） | [layers-tree/index.jsx](src/designer/aside-panel/layers-tree/index.jsx) L75-80 起 | — | ① 命令全部已覆盖（layer-management + group-management）＋③ 工具栏 UI/禁用规则 |
| B27 | DirectoryTree：buildTreeData（byId 取 `config.title \|\| '未命名'`，虚拟根 ROOT_UNIQUE_ID）、group/layout-block 可展开、选中单/多选联动 `component/selected` + 自动切 config tab、展开/收起联动（选中节点父链自动展开、onExpand 同时选中） | [tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx) L12-110、L144 | — | ③ 树 UI；结构读取 ①（useFlatTree/getNodeById） |
| B28 | 树内拖拽排序/换父/跨层 useOnDrop（拖到节点内部→children（layout-block 时尺寸同步）；拖到间隙→同级前/后；目标父级限 group/layout-block/根否则回滚；拖后 recalcGroupInTree+选中触发 recalcGroupBounds） | [useOnDrop.ts](src/designer/aside-panel/layers-tree/tree/useOnDrop.ts) L37-172（含单测 useOnDrop.spec.ts） | — | ③ 重建（算法+测试可移植）；最终写树走 setTree ① |
| B29 | 树节点右键菜单（复用 DesignerContextMenu 同构） | [tree/index.tsx](src/designer/aside-panel/layers-tree/tree/index.tsx) L121、L138-143 | — | ③ |
| B30 | 树节点内联重命名 / 显隐锁定小图标 / 树内搜索框 | 全文件确认**不存在**（重命名入口=配置面板标题字段；显隐/锁定=右键菜单） | — | ④（当前无此能力；新架构是否补待拍板） |
| B31 | SearchLayer 画布内图层搜索（选中即 `component/selected`，空列表 disabled） | [search-layer.tsx](src/designer/canvas-graph/components/search-layer.tsx) L9 | 挂画布工具栏 | ③ |

### 2.3 区域③ canvas-graph（画布区）

事实源：[canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx)。

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B32 | SketchRuler 标度尺 + 可拖拽参考线（h/v 数组）+ 右键菜单 + isShowReferLine 开关 + 清空参考线 | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L508-523、L256-262、L562-565 | hideWidgetList 可隐藏（场景监控） | ① 参考线状态（viewCanvas.lines/viewUI.isShowReferLine）＋③ 标尺组件与拖拽交互 |
| B33 | 缩放：缩小/放大（±0.1）/百分比 InputNumber/Slider/自适应 adjustViewPort（min(scaleX,scaleY)*0.98 + 回滚滚动），边界 0.01~2 | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L578-638 | — | ① scale 读写（view 插件）＋③ 控件与视口算法 |
| B34 | 滚动按钮 + 滚动同步标尺原点；Scrollbar + DropContainer + EnvProvider 画布容器 | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L200-206、L568-577 | — | ③ |
| B35 | 画布尺寸 12 档预设 / POLYFILL 别名 / custom+customPageSize 同步 viewCanvas | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L237-254、[constants.ts](src/designer/constants.ts) L5 | — | ① 尺寸状态＋③；DIMENSION 预设表 ②（协议附录） |
| B36 | 画布背景四模式：define(内置图 48 张，含 isMaterial+生产+enableMaterialConfig 分支)/custom(素材库图或纯色)/video(`<video>` 循环静音)/纯色；附加 blur+opacity | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L275-303、L531-551 | env.designerConfig.enableMaterialConfig | ③ 渲染分叉；page config 框架只存不解释；内置背景图清单 ②（协议附录） |
| B37 | 六向对齐（左/水平中/右/顶/垂直中/底）：读 byId 算包围盒，mergeFieldConfig 累积后单次 setComponents | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L312-361 | 仅多选 | ③（对齐算法未插件化；core 无对应命令） |
| B38 | 成组 / 取消成组 / 复制（画布工具条入口；拆组仅 group 单选） | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L431-479 | groupState/多选分叉 | ① 命令已覆盖＋③ 入口 UI |
| B39 | 横向/纵向分布、合并/拆分 | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L419-430、L457-468 | **注释占位，标注「暂未实现」** | ④ 待拍板（是否补做） |
| B40 | 发布状态角标（shareStatus 驱动） | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L500-503 | — | ③ |
| B41 | 背景层右键禁用（空白画布无菜单）；LayerButtons 整栏随 canvasToolbarCollapsed 收起 | [canvas-graph/index.tsx](src/designer/canvas-graph/index.tsx) L550、L365-480 | — | ③ |

### 2.4 区域④ configuration-panel（右侧配置面板）

事实源：[configuration-panel/index.js](src/designer/configuration-panel/index.js) L48-62。按 selected 分叉四类（ROOT→PageLayout / group→GroupLayout / layout-block→LAYOUT_BLOCK.ConfigurationPanel / 普通组件→ComponentSetting），切换有 100ms loading。

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B42 | 页面配置 schema：屏幕大小预设（自定义/PC4档/iPhone3/Android2/iPad2，custom 时才显示宽高）、栅格间距、缩放 TileSelect（scaleY/scaleX/cover/none）、背景四模式条件显隐（x-reactions）、背景色/背景图 UploadToMaterial/内置背景 33 张/视频(仅 MP4)/模糊度透明度、封面图（enableSnapshot 截图） | [page/schema.ts](src/designer/configuration-panel/page/schema.ts) L145、L301、L478-503、[constants.ts](src/designer/constants.ts) L71 | — | ③ schema+面板；写路径 setDesignerCanvasState({page})；POLYFILL_DIMENSION 归一化 ② |
| B43 | 组配置（141KB schema，双 tab）：名称/位置/尺寸(lockedScale 锁定宽高比)/isLock/isHidden/permission/组内轮播全套（自动轮播/速度/滑动渐显/时长/缓动/轮播控制器及位置/箭头自定义图/dots 自定义 sliderEmuns/抛事件时机 triggerChangeMethod）；Tab 交互=事件订阅 receivedCurrentField + 派发 currentFieldName/Id | [group/index.js](src/designer/configuration-panel/group/index.js) L26-41、[group/schema.ts](src/designer/configuration-panel/group/schema.ts) L1600-1676 | onValueChange 依 children 重算组宽高（byId 不存 children 的已知坑） | ③；轮播 config 字段集 ②（存量数据兼容附录） |
| B44 | 布局块配置（结构与组类似，无 slider，提示「多子自动成组并轮播」） | [layout-block/config/](src/designer/common/field/layout-block/config/ConfigurationPanel.tsx) L27-42 | — | ③；「多子自动成组」规则 ②（结构协议） |
| B45 | 组件配置 ComponentSetting：formily SchemaRender 渲染；schema 两级来源=远端 `useRemoteSchema({imports:['schema']})` 优先、本地 `findLocalSchema` 兜底；Tab 结构=物料 schema.fields；activeKey 与图层树/画布联动（tabsKey 记忆） | [component/index.jsx](src/designer/configuration-panel/component/index.jsx) L14-70 | CUSTOM_COMP 只保留 key==='config' | ②（importFields 协议核心）＋③ Phase 2（解释器）；写回 updateFieldConfig ① |
| B46 | 动画 tab 自动追加（fields>1 且无 animation 时 push AnimationPlugin.schema） | [component/index.jsx](src/designer/configuration-panel/component/index.jsx) L65-68、[animation/schema.ts](src/plugins/animation/schema.ts) | — | ③（新 plugins 无动画插件，见 D6） |
| B47 | formily widget 库（注册表实测 40+ 项）：ColorPicker/ColorGroup/Size/MonacoEditor/Lock/SliderWithNumber/TileSelect/Divider/DropdownBorder/CustomCollapse/Background/VisualTextStyle/ComponentBaseInfo/Border/DynamicData（五类数据源切换主控件）/GeoJsonSelect/ObjectArray/ObjectDescriptionsArray/BackgroundColor/EC 色组/G2 色组/CssGradientColor/EditableInput/LevelSettings/Preview/AutoComplete/CustomDataSource·ExportApi/UploadToMaterial(含裁剪)/CopyToClipboard/DirSpaceSize/VisualIframeSelector/DefineActionItem·Array/Fedx3dRenderStageLoaderList | [widgets/index.js](src/formily/widgets/index.js) | 另有 upload(VUploadCrop)/query-form(QueryForm) 被注释未注册 | ③ Phase 2 逐 widget 验证；widget 协议面 ② |
| B48 | 表单引擎 FedxReportRenderer（schema + customComponentMaps + initialValues + values + effects + onFormInputChange/FormCollapse） | [FedxReport.tsx](src/formily/FedxReport.tsx) | — | ③ Phase 2（自建解释器对齐 props 契约）；fedx-report resolve 注入角色 A 长期保留 ② |
| B49 | 表单上下文注入：VisualFedxReportProvider 共享 envModel/compInfoModel/appScopeId/useDevelopment/recordRealtimeDataFlow/customFieldsList/DataFetcherPlugin/currentDpuList/currentSceneId/currentWidgetInfo | [FedxReportContext.tsx](src/formily/FedxReportContext.tsx) | — | ②（物料配置期 Props 注入面，MaterialCompatHost 表单上下文契约） |
| B50 | 每 widget 带 schemaDesignerConfig（20+ 套 Resource/Behavior/locale，schema-designer 体系消费） | [src/formily/widgets/*/schemaDesignerConfig/](src/formily/widgets) | — | ②/③（三件套 shim，Phase 2；Q8 已拍板放弃 schema-designer，schemaDesignerConfig 消费方消失，Phase 2 迁移时评估是否随工具一并退役） |

### 2.5 区域⑤ context-menu（右键菜单）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B51 | 生效范围=每个画布组件+图层树；启用条件 designerType∈[null,BUSINESS,CUSTOM,LARGE_SCREEN,LAYOUT] 且 mode=DEVELOPMENT；FILL_LAYOUT 整体禁用 | [DesignerContextMenu.tsx](src/designer/context-menu/DesignerContextMenu.tsx) L69、L124-131、L300-302 | — | ③；模式白名单 ②（mode×类型矩阵） |
| B52 | 菜单项全集 14 项：复制/加入业务库/加入自定义组件库/置顶/置底/上移一层/下移一层/成组/取消成组/锁定/取消锁定/显示图层/隐藏图层/删除；分组=普通项→图层 SubMenu→分组 SubMenu→其他 SubMenu→删除 | [DesignerContextMenu.tsx](src/designer/context-menu/DesignerContextMenu.tsx) L43-58、L71-106、L186-210 | LAYOUT 类型不渲染「加入业务库」；contextMenuState.disabled 不渲染 | ③ 菜单 UI；全部操作命令 ① |
| B53 | 动作映射：复制=layerManager.copy+setComponents/selected；层级=moveToTop/Bottom/Up/Down（到顶底 message 提示）；组=group/splitGroup；锁=isLock；显隐=isHidden；删除=delete（Modal.confirm 二次确认 + customFieldsList.del + realtimeDataFlow.del，删组后 clearEmptyCollection 清空组） | [DesignerContextMenu.tsx](src/designer/context-menu/DesignerContextMenu.tsx) L232-261、[layer-manager/delete/index.tsx](src/designer/layer-manager/delete/index.tsx) | — | ① 命令；③ 菜单装配与级联清理接线（customFieldsList 见 J1） |
| B54 | useConvertMenuState：右键节点为根或业务/自定义组件设计器时 disabled；generatorGroup 预构造完整配置供入库 | [useConvertMenuState.tsx](src/designer/context-menu/hooks/useConvertMenuState.tsx) L46-51 | — | ③ |
| B55 | 入库弹窗 ModalCompAdd：名称（必填 30 字）+ 分组 TreeSelect（带刷新）；提交 compApi.compSave；三按钮=取消/确定/确定&打开编辑器（window.open materialBusinessUrl/materialCustomUrl） | [ModalCompAdd.tsx](src/designer/context-menu/modal/ModalCompAdd.tsx) L93-134 | — | ③＋②（物料沉淀协议） |
| B56 | redux：`app/contextMenu`（payload 含 node+两个弹窗 visible） | [context-menu/redux.ts](src/designer/context-menu/redux.ts) | — | ③（app slice 无承载，见 J2） |

### 2.6 区域⑥ dnd（拖放系统，跨区域）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| B57 | 物料卡 DragItem：HTML5 draggable，dataTransfer text=type，全局单例 dragRuntime | [DragItem.tsx](src/designer/common/dnd/DragItem.tsx) L8-18、[helper.ts](src/designer/common/dnd/helper.ts) L9-23 | — | ②（拖放载荷语义；HTML5 可换实现但载荷需冻结）＋③ |
| B58 | 画布落点 DropContainer（data-dnd-name）：onDragOver 高亮鼠标下布局块（布局块物料自身拖拽时不高亮）；drop 进布局块挂子节点 setChildren2LayoutBlock | [DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx) L25-34、L64-68、[drag2layoutBlock.ts](src/designer/common/draggable/drag2layoutBlock.ts) | — | ③ 视觉反馈；布局块判定 ② |
| B59 | drop 校验三分叉（buildDropFieldConfig）：布局块物料→generateConfigByString 直生成；business/custom→config 直生成 group 节点整组带入；普通物料→远端 fetchRemoteSchema(defaultValue/materialInfo)（本地兜底）→generatorField 追加；位置=组件中心对齐鼠标 | [helper.ts](src/designer/common/dnd/helper.ts) L25-72 | materialType 分叉 | ②（落树形态三分法+组合物料展开规则，Phase 0 冻结）＋③ |
| B60 | FILL_LAYOUT 拖入分叉：仅布局块物料可落画布，否则静默丢弃 | [DropContainer.tsx](src/designer/common/dnd/DropContainer.tsx) L70-75 | designerType 分叉 | ③；落点限制规则 ② |
| B61 | 树内拖放语义（见 B28） | [useOnDrop.ts](src/designer/aside-panel/layers-tree/tree/useOnDrop.ts) | — | ③ |

### 2.7 全局键盘快捷键（全量 grep `ctrlKey|metaKey|keyCode`）

| # | 能力 | 代码证据 | 处置 |
| --- | --- | --- | --- |
| G-01 | Ctrl+S 保存（走 handleSave 含权限） | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L386-399 | ③ |
| G-02 | Delete 删除选中（确认弹窗 + 级联清理） | [DesignerContent.tsx](src/designer/DesignerContent.tsx) L410-430 | ③ |
| G-03 | Ctrl/Cmd+点击多选 | [designer-field/utils.ts](src/designer/renderer/designer-field/utils.ts) L134 | ③（多选态扩展见 D1） |
| G-04 | undo/redo、方向键微调、Ctrl+C/V、框选快捷键 | 全仓确认**不存在** | ④（见 Q6） |

区块二统计：③ 为绝对主体；① 集中在操作命令与 view 状态；② 集中在物料落树/分组可见性/表单上下文/拖放载荷；④ 待拍板 8 项。

---

## 3. 区块三 · 渲染链 / 插件域 / 物料链 / 横切

### 3.1 渲染链（设计态 + 预览态）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| C01 | 渲染链 barrel：导出 DesignerField（设计态）+ Parser=GeneratorWidget（查看态） | [renderer/index.js](src/designer/renderer/index.js) | — | ③ Phase 3 |
| C02 | 设计态递归 RecursionComponents（React.memo；仅 GROUP/LAYOUT_BLOCK 传 children） | [recursion-components/index.tsx](src/designer/recursion-components/index.tsx) L33-35 | FIELD_COMP_TYPES 轴 | ③；树读取 ① |
| C03 | 查看态递归 GeneratorWidget（memo，loopWidgets、depth、depth===1 强制 currentGroupSliderActive、isDevelop:false、absolute 定位） | [GeneratorWidget.tsx](src/designer/renderer/GeneratorWidget.tsx) L51-124 | 预览态 | ③ |
| C04 | 预览壳 DesignerParser：dispatch mode='preview'、背景三分叉（custom→物料 URL 图 / define→内置图，isMaterial+生产+未开 enableMaterialConfig 时走 STATIC_PATH/localDir / video）、尺寸还原、AutoContainer zoom、EnvProvider | [designer-parser/index.jsx](src/designer/renderer/designer-parser/index.jsx) | mode=preview | ③ |
| C05 | DesignerField：useFieldConf 字段级订阅（删除时 propsDataSource 兜底）；useSelector+shallowEqual 派生选中/组内/modal；React.memo 自定义比较六 props | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) L58-59、L97 | 性能红线（memo + 440 组件验收） | ①（useNode 内建 shallowEqual）＋③（组件壳，memo 纪律需 Phase 3 保持） |
| C06 | 点击选中 + 切 config tab（拖拽中/调试弹窗打开时忽略）；Ctrl/Cmd 多选 getClickSelectedIds；FILL_LAYOUT 分叉选中布局块内首个子组件 | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) L127-161、[utils.ts](src/designer/renderer/designer-field/utils.ts) L118-150 | designerType 分叉 | ③；**契约差距 D1**：src selected 为逗号串多选，plugins viewUI.selected 仅单选 |
| C07 | Rnd 拖拽移动（throttle 100ms）+ 多选其余组件同步位移；拖拽门控（未选中/isLock/isHidden/调试弹窗/右键弹窗→disable）；拖入布局块高亮+dropToGroup 入组+syncLayoutBlockSize2Children；布局块套布局块被拦截提示 | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) L220-237、L287-303、[utils.ts](src/designer/renderer/designer-field/utils.ts) L193-204 | slider 组件 disableMovable；FILL_LAYOUT 布局块子节点 enableMovable:false | ③ Phase 3（最大头交互）；约束矩阵 ② |
| C08 | 8 向 resize（AlignLine 控制点）+ 组尺寸级联子组件 syncGroupSize2Children；多选禁 resize | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) L247-249、[utils.ts](src/designer/renderer/designer-field/utils.ts) L152-178 | — | ③；组算法 ①（core group-bounds.ts 导出） |
| C09 | 坐标标签（left,top 实时数值 + 参考线）；选中态视觉三态（选中蓝实线/组内子选中父虚线/普通）；隐藏/锁定表现（is-hidden class） | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) L287-340、[utils.ts](src/designer/renderer/designer-field/utils.ts) L61-84 | — | ③；lines 状态 ① |
| C10 | fieldGenerator/FieldGenerator 类型分发：GROUP→GroupField / LAYOUT_BLOCK→LayoutBlock / 物料→ItemField / 未配置→Empty 占位（gc-design__empty）；物料可重定义分叉（RedefineField 覆盖 SourceField，getMaterialsField 按 container WeakMap 缓存） | [generator.tsx](src/designer/renderer/generator.tsx) L40 | 物料 Field 覆盖协议 | ②（物料 Field 重定义协议）＋③ |
| C11 | ItemField 插件注入聚合点：useInteractionsPreprocessor → useCreateInteractionApi → DataFetcherPlugin.useFetchData → useSubscribeObject；出口三层包 AnimationPlugin.FieldAnimation > FieldDataStatus > FieldWrapper；withModel 注入 dpuList（按 appScopeId 过滤）；widthRenderTask 并发门控 | [item-field/index.tsx](src/designer/renderer/components/item-field/index.tsx) L51-134 | — | ①（插件运行时已有）＋②（注入顺序协议）＋③（装配点重建） |
| C12 | ItemField props 合并：`{...fullProps,...value,...fetchResult}` 再 omit 关键键；注入 designer/interaction/interactionProps/receivedPropsParams/onBeforeRender（联动入场动画）；config.transform rotate/scale | [item-field/index.tsx](src/designer/renderer/components/item-field/index.tsx) L90-134 | 物料 Props 契约（[物料Props详细配置.md](design/src/topics/物料Props详细配置.md)） | ②（物料 Props 协议核心） |
| C13 | ItemField L118 存在 `console.log('log----render')` 调试残留 | [item-field/index.tsx](src/designer/renderer/components/item-field/index.tsx#L118) | — | ④（建议 src 顺手清理；新壳天然不带） |
| C14 | GroupField：react-slick 轮播全套（autoplay/infinite 分叉/fade/speed/pauseOnHover/vertical/easing/dotsType custom→sliderEmuns 名称/arrowsType custom→自定义图）；triggerChange 派发 currentFieldName/Id（afterChange/beforeChange 分叉）；受控切页（receivedCurrentField 订阅 + sliderEnums 匹配 → slickGoTo）；初始页三分叉（权限 zoneId 匹配 / receivedPropsParams / 0）；autoplay 播放暂停控制器；useMetaHumanEffect(SWITCH_OPERATE) 数字人切页 | [group-field/index.jsx](src/designer/renderer/components/group-field/index.jsx) | slider 开关 | ③ Phase 3（运行时是否继续 react-slick 见 Q2；样式长尾属存量大屏兼容硬需求 ②） |
| C15 | LayoutBlock：children>1→复用 GroupField 强制 slider；单子→ReactFragment；viewer 分叉（非 DEVELOPMENT 且 visualType≠layout 时 no-border 透明布局）；空占位 LayoutBlockProxy（`{width} * {height}` 文案 + isLayoutBlockProxy 拖拽标记）；children 注入 enableMovable:false；预设块 600×300/800×800/1920×70（presets.ts，InitDataQuery 并入物料列表）；groupId=9 | [layout-block/index.tsx](src/designer/renderer/components/layout-block/index.tsx) L18-68、[presets.ts](src/designer/common/field/layout-block/presets.ts) | mode×visualType 矩阵 | ②（渲染矩阵 + 预设尺寸 + groupId=9 冻结）＋③ Phase 3 |
| C16 | DataDebug 数据调试浮层（debug-dataset/debug-api，选中组件时渲染，打开时阻塞画布拖拽/选中；businessIndicator） | [item-field/index.tsx](src/designer/renderer/components/item-field/index.tsx) L167、[data-debug/](src/designer/renderer/components/data-debug) | mode=DEVELOPMENT+selected | ③；快照状态 hox useDevelopment（壳层域） |
| C17 | DrillDownItem 下钻弹窗：MODAL→MovableModal（嵌 PanelPreview=preview 大屏页，params 按 drilldownItemFields 白名单过滤；关闭派发 closeSideEffectsEvent 随机 uuid 后继触发 + fetchStorage.restore(appScopeId)）；DRAWER→oss-ui Drawer | [DrillDownItem.tsx](src/designer/renderer/components/item-field/DrillDownItem.tsx) | effectType 分叉 | ③；下钻数据 hook ①（useCurrentFieldDrilldownData）；模式参照 [下钻与派发逻辑总结.md](design/src/topics/下钻与派发逻辑总结.md) |
| C18 | 渲染任务调度 taskManager（rAF 队列、setConfig 并发数、cancel、beforeunload 清空）+ widthRenderTask（任务槽就绪才渲染；EnvProvider 从 `environment.performance.concurrentRenderCount` 注入） | [taskManager.ts](src/designer/common/task/taskManager.ts)、[withRenderTask.tsx](src/designer/common/task/withRenderTask.tsx)、[env/index.tsx](src/designer/common/env/index.tsx) | — | ③ Phase 3（性能设施，440 场景验收相关） |
| C19 | FieldWrapper 运行时 DOM 标记（data-field-type-*/data-field-id-* 带时间戳；selectElementByUniqueId/isElementInGroup 反查） | [wrapper/index.tsx](src/designer/common/field/wrapper/index.tsx) | 供拖拽/dnd 判定 | ③ |
| C20 | 渲染工具集：resetUniqueId/generateConfigByString/generatorField（title/key 去重、grid left 排布）/setChildren/getFieldNodeById/setLevelPath（drillDownLevel）/mergeFieldConfig/orderBy/deleteFieldByUniqueId（返回相邻兄弟为新选中）/generatorGroup·splitGroup/clearEmptyCollection/getGroupSizePosition·resetChildrenPosition/syncGroupSize2Children/flatDesignerList/eachTreeNode·fieldVisitor/getSelectedKeys | [renderer/utils.ts](src/designer/renderer/utils.ts) | — | ①（树操作契约已沉淀 designer-state；core structure-tools） |
| C21 | byId 索引 buildIndex：只遍历 children（不遍历 drillDown）；未变节点引用复用保 useFieldConf shallowEqual 粒度 | [renderer/utils.ts](src/designer/renderer/utils.ts) | 禁直接赋值（AGENTS 硬约束） | ①（core 已有 buildIndex） |

### 3.2 插件域（src/plugins，出口导出 Interaction/DataFetcher/Animation/ConfigFormatter 四插件）

#### interaction 交互插件

| # | 能力 | 代码证据 | 处置 |
| --- | --- | --- | --- |
| C22 | 事件常量：ACTION_INTERACTION / configurableEvent / dynamicEvents（DynamicEvent-{clickKey}）/ compositionAction / drilldownEvent（废弃名 clickEvent）/ ENUM_DRILL_DOWN{MODAL,DRAWER} | [constants.ts](packages/share/src/interactions/constants.ts)（经 @fedx-vis/share）、[interface.ts](src/plugins/interaction/component/interface.ts) | ②（事件常量来自 share 包，MaterialCompatHost 需保证供给/版本一致） |
| C23 | useInteractionsPreprocessor（读 dataConfig/customDataSourceApiConfig/exportAPIConfig，订阅 component.interactions，`:fieldName` 参数映射）+ useCreateInteractionApi（冻结 interactionApi={dispatch,subscribe,action,defined,dispatchRealtimeDataFlow}；dispatchAction 过滤非法 fieldName）+ useSubscribeObject（物料订阅字段映射 state 值） | [hooks.ts](src/plugins/interaction/component/hooks.ts) | ①（interaction 插件同名 API 一一对应） |
| C24 | 事件 reducer：同 uniqueId+fieldName 覆盖；其他组件同 fieldName 旧记录移除（drilldownEvent/clickEvent 除外常驻）；DRILL_DOWN_FIELD_NAMES | [reducer.ts](src/plugins/interaction/component/reducer.ts) | ①（算法原样迁移） |
| C25 | useInteractionsGraph：useFlatComponents+SUBSCRIBE_KEY_REG 扫 `:xxx` 产出交互图谱（非渲染热路径） | [hooks.ts](src/plugins/interaction/component/hooks.ts) | ①；可视化 ③ |
| C26 | 交互动作 schema 定义器 DefineAction(Item/Array) | [define-interaction-action/index.tsx](src/formily/widgets/define-interaction-action/index.tsx) | ③ Phase 2（widget 迁移）；动作 schema 形态 ② |

#### data-fetcher 数据插件

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| C27 | 数据源类型枚举 DataSourceEnum：json/api/businessIndicator/dataSet/iframeSource；系统参数 $sysdate/$accesstoken/$sceneIdStr/$权限key；CustomDataSourceUseType{REQUEST,EXPORT}；DESIGNER_ORIGIN_DATA 哨兵 | [constants.ts](src/plugins/data-fetcher/constants.ts) | — | ②（数据源协议+系统参数表冻结核心） |
| C28 | fetcherFactory 按 DataSourceEnum 五源分流：json/api/businessIndicator/dataSet/iframeSource | [DataFetcher.ts](src/plugins/data-fetcher/DataFetcher.ts)、[factory.ts](src/plugins/data-fetcher/utils/factory.ts) | 五种源 | ① 主干已覆盖（fetcherFactory 依赖注入位）；**具体五类 factory（含 businessIndicator/iframeSource）新架构无默认实现** → ③ 重建时注入；源枚举 ② |
| C29 | DPU 数据处理器链路：dpu 工具、dpuList 按 appScopeId 过滤 | [dpu.ts](src/plugins/data-fetcher/utils/dpu.ts) | — | ③ 重建（plugins 无 DPU 概念；与 B05 编辑器同源） |
| C30 | 系统参数：$sysdate / $accesstoken / $sceneIdStr / currentLoginInfo / 权限 key；TEMP_DATA_SET_PREFIX | [params.ts](src/plugins/data-fetcher/utils/params.ts) | — | ② 协议项（系统参数表是数据请求协议，物料数据配置直接依赖，必须冻结）；实现 ③ |
| C31 | GlobalDataSet：updateDataSetList、enableEmptyDatasetList、分组/选中 | [GlobalDataSet.ts](src/plugins/data-fetcher/GlobalDataSet.ts) | — | ① 列表状态/更新已覆盖（useUpdateDataSetList）；分组选中语义 ③ |
| C32 | GlobalFetcher：根组件全局轮询、useGlobalFetcher / useInjectGlobalFetcherResponse2nextPage 跨页注入 | [GlobalDataFetcher.ts](src/plugins/data-fetcher/GlobalDataFetcher.ts) | 轮询间隔 | ① useGlobalFetcher 已覆盖；**跨页注入 nextPage 无对应 hook** → ③ 重建时核对补入（Q4 核实项） |
| C33 | RealtimeDataFlow 组件间流转（enable/restore、订阅索引 + 数据内容） | [RealtimeDataFlow.ts](src/plugins/data-fetcher/RealtimeDataFlow.ts) | — | ① 已覆盖（realtime-data-flow 插件 + core runtime 插件双承载） |
| C34 | fetchStorage 性能开关（预览态缓存） | [fetchStorage.ts](src/plugins/data-fetcher/utils/fetchStorage.ts) | Viewer 性能模式 | ③ 重建（与性能模式联动） |
| C35 | 条件/数据工具：condition / data / enum | utils/condition.ts、data.ts、[enum.ts](src/plugins/common/enum.ts) | — | ③ 重建（部分被 interaction options 注入替代） |

#### animation / config-formatter（r3-03 §9.3）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| C36 | AnimationPlugin：FieldAnimation 运行时组件 + share.form.createAnimationSchema 入场动画 schema | [animation/index.ts](src/plugins/animation/index.ts)、[schema.ts](src/plugins/animation/schema.ts) | — | ③ 重建（plugins 无动画插件；schema 依赖 share.form → ② 供给面） |
| C37 | ConfigFormatter.dataConfig（保存/加载时数据配置格式转换） | [config-formatter/index.ts](src/plugins/config-formatter/index.ts) | — | ③ 重建（数据格式兼容层，存量大屏反序列化硬依赖；字段演进需 ② 数据兼容约定） |

### 3.3 物料加载链（r3-03 §10）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| C38 | 远程物料运行时加载：createRemoteComponent（remote-component-loader），jsPath+cssPath 注入、WeakMap 按 container 缓存、弱网/失败 fallback 本地 findLocalMaterial、taskManager.onBeforeRender | [materials/index.js](src/designer/materials/index.js) | 加载失败分叉 | ② 协议项（MaterialCompatHost 核心：fetchRemoteModule + resolve map + 缓存 + fallback） |
| C39 | resolve map：运行时向老物料 bundle 注入 react / oss-ui / fedx-report 等 | [remote-component.config.js](src/remote-component.config.js) | — | ② 协议项（v1 冻结；fedx-report 角色 A 长期保留） |
| C40 | 远程 schema：fetchRemoteSchema（schemaPath）、schemaCache Map、requires | [use-remote.ts](src/hooks/use-remote.ts) | — | ② 协议项（importFields: schema/defaultValue/materialInfo；schemaCache 行为需复刻） |
| C41 | 本地物料注册：registerLocalMaterials，lazy+Suspense，findLocalMaterial / findLocalSchema | [packages/index.tsx](src/packages/index.tsx)、[local-material-init.tsx](src/packages/local-material-init.tsx) | — | ②（本地包零改动加载是继承前提）；注册器实现 ③ Phase 1 |
| C42 | 本地物料资产：base/iframe（custom + oss-material.json）、base/countdown、container/rank-panel、container/scroll-panel、model-3d（scene-3d-fbx、stadiums-3d + three.js loaders） | src/packages 各物料目录 | — | ②（资产零改动）；three.js / iframe 等重依赖经 resolve 与样式隔离承接，Phase 1 实测 |
| C43 | InitDataQuery 启动预取：dpuApi.getList（按 appScopeId）、compApi.getCompList 三路合并（普通+自定义+业务 + LAYOUT_BLOCK.PRESET_BLOCK_LIST）、compApi.getCompGroupList（mode!=='preview'）、GlobalDataSet.updateDataSetList | [InitDataQuery/index.tsx](src/designer/data-query/InitDataQuery/index.tsx) | mode 分叉（预览不查分组树） | ③ 重建（启动编排）；PRESET_BLOCK_LIST 合并属布局块协议 ②；写入 hox componentsMethods |

### 3.4 横切：环境 / 上下文 / hox / store / 性能（r3-03 §11）

| # | 能力 | 代码证据 | 条件分叉 | 处置 |
| --- | --- | --- | --- | --- |
| C44 | ScopeProvider（appScopeId=`id_visualType` / sceneId / visualType）、FieldShareEnv、ModalEnv | [env/index.tsx](src/designer/common/env/index.tsx) | — | ② 作用域三元组进协议；③ 重建 Provider |
| C45 | 任务调度 taskManager / withRenderTask / widthRenderTask | [common/task/index.tsx](src/designer/common/task/index.tsx) | — | ③ Phase 3 重建（性能设施） |
| C46 | 性能监控：ScreenPerformanceProvider / useScreenPerformance、Detail + Bar/Pie（useEChart）、useScreenPerformanceResult 供工具栏分叉 | [context-designer/index.tsx](src/designer/common/context/context-designer/index.tsx)、[screen-performance](src/designer/common/context/context-designer/screen-performance/index.tsx) | — | ③ 重建（是否进首批见 Q3） |
| C47 | hox 五模型：useLoginInfo / useEnvironment / useAppInfo / useComponentsInfo（物料列表/dpuList/分组/componentsMethods）/ useDevelopment（dataDebug/fetchSnapshot） | src/hox/ 五文件 | — | ③ 重建（不在 packages-next 做 hox 替换设计，Phase 1 壳层定；useComponentsInfo 是 B16/B19/C43 的数据源） |
| C48 | Redux 五 slice：app（designerType/contextMenu/topToolbarHiddenList）、component（selected/globalResponse/interactions…）、designerCanvas、viewCanvas、viewUI | [store/modules/](src/store/modules/) | — | ① 画布树/view/数据交互状态已被 core+plugins 对应承接（selected 形态差异见 D1）；**app slice 三字段无对应 extra** → ③＋②（模式矩阵载体，见 J2/D5） |
| C49 | store hooks：useFieldConf / useUpdateFieldConfig / useFlatComponents、view 系列、useRealtimeDataFlow{record,del}、useCustomFieldsList{get,record,del} | [hooks.ts](src/store/designer/hooks.ts) | — | ① 基本一一映射（useNode/useUpdateNode/useFlatTree/runtime 插件）；useCustomFieldsList 专用 hooks 无等价（J1） |
| C50 | layer-manager 命令全集：copy/moveToTop/moveToBottom/moveIndexToUp/moveIndexToDown/group/splitGroup/lock/unlock/show/hide/delete | [layer-manager/index.tsx](src/designer/layer-manager/index.tsx) | — | ① 已覆盖（layer-management 10 命令 + group-management 2 命令）；copy 默认不重置子树 uniqueId（src 为 true）→ 显式传 options（J6/D4） |
| C51 | 数据调试快照 fetchSnapshot / dataDebug 全局态 | useDevelopment + DataDebug（C16） | — | ③ 重建 |

区块三统计：① 集中在交互/数据流/图层命令/组算法/树 hooks；② 集中在 resolve map、importFields、系统参数、事件常量、布局块矩阵、作用域三元组；③ 覆盖全部渲染运行时与 UI、DPU、动画、格式化、启动编排、hox 壳层。

---

## 4. 契约冲突与差距点（代码为准）

| # | 冲突或差距 | src 代码事实 | 新架构侧 | 影响 |
| --- | --- | --- | --- | --- |
| D1 | **选中态：多选无承载** | `component.selected: string`，ROOT 或多 id 逗号串；消费端 `selected.split(',')` | plugins viewUI.selected 为 `string \| null` 单选 | 多选移动/对齐、树 multiple 无状态位；Phase 3 需扩展（Q1） |
| D2 | **src viewUI 没有 selected 字段** | [view-ui.ts](src/store/modules/view-ui.ts) 仅 8 字段，选中在 component slice | 文档称 selected 落 viewUI（task-2026-08-07-004 在 plugins 侧做的） | 非冲突（两线独立），迁移时勿误以为 src 已有 viewUI.selected 可对照 |
| D3 | **组尺寸自动重算未在 plugins 集成** | DesignerContent subscribe 接线 | core 已导出 createRecalcGroupBounds，插件未集成 | Phase 3 必须接线，否则「拖子组件重算组」缺失（J5） |
| D4 | **copy 的 uniqueId 策略差异** | copy 传 resetChildrenUniqueId=true | layer-management 默认 false | 重建画布复制时必须显式传 true（J6） |
| D5 | **模式承载字段缺失** | app slice：designerType / contextMenu / topToolbarHiddenList | DesignerExtra 无对应字段（grep 零命中） | 五种 designerType × visualType 全部分叉需壳层自定义 extra 承载，Phase 1 壳协议（J2） |
| D6 | **DPU / 动画 / ConfigFormatter 无插件对应** | src 有完整实现（C29/C36/C37） | designer-plugins 仅 6 插件，无此三类 | 重建项；动画 schema 与 ConfigFormatter 背负存量数据兼容，需进协议附录 |
| D7 | **数据 factory 五类只框架化了一类** | json/api/businessIndicator/dataSet/iframeSource 五分流 | dataFetcher 只给 fetcherFactory 注入位，无默认 factory | 五个具体 factory 是重建工作量；businessIndicator/iframeSource 与后端/物料耦合最深 |
| D8 | **下钻多层级** | onValueChange 仅支持 level 0，level>0 警告 | interaction 有 useCurrentFieldDrilldownData，无层级限制语义 | 「单层即终态」还是补多层，需业务确认（Q5） |
| D9 | **formily widget 数量口径** | r1-3 实测 src/formily/widgets 40+ 个（vs 能力域总览文档「30+」） | Phase 2 widget 迁移工作量按实测 40+ 计 | 演进方案 Phase 2 排期需按 40+ 修正 |
| D10 | **场景监控嵌入链部分代码已注释**（r2 独有发现） | designer-scene-monitor 部分子链路处于注释态 | — | 是否仍在产需确认（影响 A04 重建范围），并入 Q9 一并拍板 |

---

## 5. 链路外代码：存档，不入矩阵

| 项 | 证据 | 存档理由 |
| --- | --- | --- |
| [spreadsheet/index.jsx](src/pages/spreadsheet/index.jsx) | route-list.ts 无引用 | 独立电子表格页，未接入 |
| src/formily/ 下 schemaDemo.js（各 widget 目录 demo） | 无入口 import | 开发演示素材 |
| src 内 worker-scripts | 非应用入口链路 | 工具/实验脚本 |
| `.bak` 历史快照（canvas-graph / DesignerField / GeneratorWidget / utils / store/backup） | AGENTS.md：永久保留、grep 排除 | 历史快照 |
| 死别名 `@Configs/*` | AGENTS.md 声明禁用 | 历史路径别名 |
| designer-next 自带 hox 副本（5 model） | packages-next/designer-next/src/hox/ | 空壳脚手架内副本，零引用 core/plugins |
| releasePage 100 条预留路由（route-list L10-18 注释块） | [route-list.ts](src/routes/route-list.ts#L10-L18) | 注释未启用；机制去留见 Q11 |

---

## 6. 待拍板问题（硬门槛② · 用户决策）

| Q | 问题 | 关联条目 | 选项与建议 |
| --- | --- | --- | --- |
| Q1 | 多选选中态在新架构的形态：扩 `string[]` 还是保留逗号串？ | D1/C06 | **已拍板（2026-09-17）：扩 `string[]`**，落在 plugins view 插件 viewUI.selected；存量 JSON 入口一次 `split(',')` 转换 |
| Q2 | 组轮播运行时是否继续基于 react-slick？ | B39/C19 | **已拍板（2026-09-17）**：(a) 协议冻结样式+配置、运行时可换；实施前先分析子组件状态注入数据流，禁止照抄 src cloneElement 路径 |
| Q3 | 数字人（A28/C21）、性能监控（C46/B07）是否进首批？ | A28/C46 | **已拍板（2026-09-17）**：均不进首批；数字人探索插件接入（能力增强），性能监控保留、后期加（Phase 3 验收前就位） |
| Q4 | GlobalFetcher 跨页注入 useInjectGlobalFetcherResponse2nextPage 是否仍有业务场景？ | C32 | **已拍板（2026-09-17）**：放弃该 hook，无跨页注入场景（交互为弹窗）；GlobalFetcher 主链路照常 Phase 3 重建 |
| Q5 | 下钻是否长期保持单层（level 0）？ | D8 | **已拍板（2026-09-17）**：(a) 保持单层并写入协议；多层需求将来另立演进项 |
| Q6 | 死功能处置：一键升级 UI（B21）、分布/合并拆分占位（B29）、场景编辑器死标题（B01）、ItemField console.log（C11） | B01/B21/B29/C11 | **已拍板（2026-09-17）**：src 内死功能先不动，不迁移、不另开清理 task，不影响演进规划 |
| Q7 | 快照是否需要「恢复到快照」？ | B11 | **已拍板（2026-09-17）**：定位为新增纯前端功能（src 从未有），记录将来做，不属迁移范围；已记 backlog |
| Q8 | /schema-designer 独立工具（fedx-report 深度绑定）是否随 fedx-report 退场？ | A15 | **已拍板（2026-09-17）**：(a) 放弃，不迁移；配置 schema 由 Phase 2 新解释器生态承接 |
| Q9 | 场景监控嵌入模式（A04）的微应用消息 + 业务组件白名单是否作为新壳通用「嵌入协议」？ | A04/B18/D10 | **已拍板（2026-09-17）**：场景监控做成业务插件（plugin-scene-monitor），优先级非常低；嵌入协议抽象随插件立项再定 |
| Q10 | 未挂路由的 spreadsheet 页与 dev 辅助路由去向 | A01/A16/§5 | **已拍板（2026-09-17）**：spreadsheet 不要（不迁移，src 侧按需另行删除）；dev 路由仅记录用途，不特意实现 |
| Q11 | releasePage 跳板页与 100 预留路由机制是否保留 | A12 | **已拍板（2026-09-17）**：跳板是需要的业务能力、代码要支持，但非 app 核心能力（Phase 4 承接，薄逻辑重建）；预留路由注释不迁移 |

---

## 7. 处置统计与 Phase 映射

### 7.1 数量盘点

合并后编号项约 **137+（r3 主干 137 + r1/r2 独有条目以 + 前缀补入）**，分布：

| 处置 | 典型分布 | 说明 |
| --- | --- | --- |
| ① 已覆盖 | 树状态/字段订阅/写路径、图层与成组命令、交互 hooks+reducer、数据请求主干与实时流转、组算法、view 状态 | 全部是**状态与逻辑**，零 UI；约占两成 |
| ② 协议项 | resolve map、importFields/远程 schema、本地物料零改动、节点三分法+落树规则+渲染矩阵、模式矩阵、系统参数与事件常量、作用域三元组与表单上下文、拖放载荷、存量配置附录 | Phase 0 冻结清单的事实来源 |
| ③ 重建 | 六区域全部 UI、设计态/预览态两条渲染链、页面/预览/微应用壳、DPU/动画/ConfigFormatter/五类 dataFactory/启动编排/hox 五模型/快照发布模板/数据调试 | Phase 1 壳+物料跑通；Phase 2 表单解释器+40+ widget；Phase 3 渲染域 |
| ④ 待拍板 | §6 十一问 + §5 存档项 | 用户决策 |

### 7.2 Phase 映射

| Phase | 本矩阵事实输入 |
| --- | --- |
| Phase 0（协议冻结） | ② 全部条目；尤其 B35/C22 落树与布局块矩阵、C39/C40 resolve+importFields、C30 系统参数、事件常量、B37/B39 存量配置附录、D5 模式承载 |
| Phase 1（壳骨架+老物料跑通） | 微应用壳、C38-C43 加载链与预取、D5 模式 extra、Q9 嵌入协议；C42 three.js/iframe 重依赖实测 |
| Phase 2（formily 解释器） | 组件面板与 40+ widget（D9 口径修正）、交互动作 schema、Q8 独立 schema 工具去留 |
| Phase 3（渲染域重建） | C01-C23 全部渲染/交互、区域 UI、D1 多选、D3 组重算接线、D4 copy 参数、Q2 轮播运行时、440 组件性能验收 |
| Phase 4（双轨/退役） | A12 跳板、Q10/Q11 存档与旧路由清理、fedx-report 角色 A 随老物料退役 |

### 7.3 结论一句话

新架构覆盖的是 src 六能力域中的**状态与命令层**（约占两成，零 UI）；物料继承面（②）边界清晰可直接进 Phase 0；**差距主体是整个渲染/交互/壳层 UI 的 Phase 1-3 重建**；另有 11 个去留/形态问题待拍板，其中 **D1 多选态、Q2 轮播运行时、Q8 schema-designer 退场**三项影响协议冻结，建议优先决策。

---

## 8. 验收对照（任务卡 checklist）

| 任务卡条目 | 对照 |
| --- | --- |
| A1 入口遍历完整 | §1 路由矩阵 A01-A17 全量触达，含条件路由与 dev 分叉 |
| A2 分叉逐分支登记 | visualType V-01~V-11、designerType A03-A07、mode×visualType 渲染矩阵 C02/C22、FIELD_COMP_TYPES / materialType 各行条件列 |
| A3 三报告并集 | 编号以 r3 为主干，r1/r2 独有条目以 + 前缀补入；分歧经 6 项裁定（§0.3）回代码验证 |
| A4 每行带代码证据 | 全表代码证据列 |
| A5 处置四选一 | §0.1 图例 + §7 统计 |
| A6 待拍板清单 | §6 Q1-Q11 |

> **下一步（硬门槛②）**：等待用户拍板 §6 Q1-Q11（建议放弃项与遗漏补录）后，方可进入 designer-app/ 演进方案套件终稿与归档流程。