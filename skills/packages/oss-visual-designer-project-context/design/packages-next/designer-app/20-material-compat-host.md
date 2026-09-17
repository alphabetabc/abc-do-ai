# MaterialCompatHost · 物料兼容宿主设计

> 状态：**设计底稿，Phase 1 实现前需用户 review**。
> 事实来源：[src能力差距矩阵.md](skills/oss-visual-designer-project-context/design/packages-next/src能力差距矩阵.md) C38-C43（物料加载链）、C44（环境）、C47（hox）、D5（模式承载）。
> 定位：新壳与老物料之间唯一的接触面；「协议之上自由新技术，协议之下供养老物料」的执行器官。

---

## 1. 职责边界

| 做 | 不做 |
| --- | --- |
| resolve map v1 供给（协议 P1） | 物料业务逻辑 |
| 远程物料加载（jsPath+cssPath、缓存、fallback） | 表单渲染（→ formily 解释器） |
| 本地物料注册（零改动加载） | 画布交互（→ Phase 3 渲染域） |
| 隔离子树 + 样式命名空间 | 数据请求语义（→ dataFetcher 插件 + factory 注入） |
| 启动预取编排（InitDataQuery 等价物） | 树状态（→ designer-core） |

## 2. 加载链设计（对标 src 现行为）

| 能力 | src 基准 | 新实现要点 |
| --- | --- | --- |
| 远程组件 | createRemoteComponent（remote-component-loader），WeakMap 按 container 缓存（C38） | 复用 remote-component-loader 或等价实现；缓存语义保持 |
| 失败 fallback | 弱网/失败回退本地 findLocalMaterial（C38） | 保留同名回退路径 |
| 远程 schema | fetchRemoteSchema + schemaCache Map（C40） | importFields 三字段契约冻结（协议 P2） |
| 本地注册 | registerLocalMaterials，lazy+Suspense（C41） | 同 API 形态；注册器实现属 Phase 1 ③ |
| 渲染前钩子 | taskManager.onBeforeRender（C38/C45） | 任务调度属 Phase 3 性能设施，Phase 1 先留空挂点 |

## 3. 隔离与样式

- 远程物料渲染在**隔离子树**：antd4（oss-ui）与宿主 antd5 并存不冲突。
- 样式隔离：CSS 前缀 / 命名空间规范（Phase 0 与协议一起定）。
- 重依赖首批实测项：three.js（model-3d 物料）、iframe（base/iframe）——矩阵 C42，Phase 1 成败判据之一。
- React 18 注入 React 17 构建产物：兼容模式（不开 StrictMode），Phase 1 最先实测（风险 #1）。

## 4. 启动编排（InitDataQuery 等价物）

src 基准（C43）：

```text
dpuApi.getList（按 appScopeId）
compApi.getCompList 三路合并：普通 + 自定义 + 业务 + LAYOUT_BLOCK.PRESET_BLOCK_LIST
compApi.getCompGroupList（业务/自定义分组树，mode!=='preview' 跳过）
→ GlobalDataSet.updateDataSetList
→ 写入壳层模型（src 为 hox useComponentsInfo：物料列表/dpuList/分组/componentsMethods）
```

新实现要点：

- 编排落在 designer-app 壳层（③ 重建），数据落 hox 五模型的壳层替代（C47，Phase 1 定形态，不在 packages-next 内设计）。
- `componentsMethods`（refreshDpuList / refreshComponentsList / refreshCustomCompGroupList）保留同名刷新入口，供物料库 UI 调用（B16/B19 数据源）。

## 5. 模式承载（壳层 extra）

五种 designerType × visualType 分叉（矩阵 D5/J2）由壳层自定义 extra slice 承载：

- `designerType`：LARGE_SCREEN / LAYOUT / BUSINESS_COMP / CUSTOM_COMP / FILL_LAYOUT
- `contextMenu`、`topToolbarHiddenList`（src app slice 三字段）
- 分叉消费点：路由页面壳（A03-A07）、toolbar 图标隐藏（B 区 iconHidden）、右键菜单白名单（B45）
- 场景监控嵌入模式（A04）→ Q9 拍板后决定是否抽象为通用「嵌入协议」（隐藏区/禁移动/微应用消息保存/物料白名单作为壳层配置）

## 6. 数据 factory 注入

- dataFetcher 插件只提供 fetcherFactory 注入位（矩阵 D7），五类具体 factory（json/api/businessIndicator/dataSet/iframeSource）由壳层实现并注入。
- DPU 链路（C29）、系统参数实现（C30）随 factory 一并在壳层重建。
- RealtimeDataFlow 已双承载（插件 + core runtime），直接组装（C33）。

## 7. 验收判据（Phase 1）

1. 一个真实远程老物料（含 fedx-report 依赖）在新壳画布上渲染成功。
2. 一个本地物料（含 three.js / iframe 重依赖）加载成功。
3. React 18 宿主 + React 17 物料兼容模式无崩溃。
4. 样式无串扰（antd4/antd5 并存检查）。
