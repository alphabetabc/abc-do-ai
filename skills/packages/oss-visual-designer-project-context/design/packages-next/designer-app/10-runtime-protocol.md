# 物料运行时协议 v1 · 冻结清单

> 状态：**Phase 0 待立项产出正式协议文档，本文为清单底稿**。事实来源：[src能力差距矩阵.md](skills/oss-visual-designer-project-context/design/packages-next/src能力差距矩阵.md) 全部 ② 处置条目（§7.2 Phase 0 行）。目标：把散落在 src 代码里的「老物料运行时隐式契约」显式化为 v1 冻结面，new 壳（designer-app）与老物料之间唯一的接口层。

---

## 1. 协议分层

```text
P1 模块供给层   resolve map（远程 bundle 的 require 注入）
P2 资源契约层   importFields（schema / defaultValue / materialInfo）
P3 节点与树层   节点三分法 + 落树规则 + groupId 常量
P4 渲染矩阵层   节点形态 × mode × visualType
P5 数据协议层   数据源枚举 + 系统参数表 + 事件常量
P6 环境契约层   作用域三元组 + 物料 Props 契约 + 拖放载荷
P7 存量数据附录  动画 schema / 轮播配置 / 布局块预设等存量格式
```

---

## 2. P1 模块供给层（resolve map v1）

| 冻结项 | 事实基准 |
| --- | --- |
| resolve 注入依赖清单 | [remote-component.config.js](src/remote-component.config.js)：react / oss-ui（antd4 内核）/ fedx-report / 其他（以现文件为准逐项固化） |
| fedx-report 角色 A | 长期保留供给远程物料，随老物料退役（矩阵 C39） |
| 版本一致性 | 注入版本必须与老物料构建时对齐（React 17 构建产物 + React 18 宿主，兼容模式不开 StrictMode，Phase 1 实测） |

**P1 两条推论（协议成立的前提逻辑，承自旧稿 §1.1）**：

1. 远程物料是预构建 bundle，其内部 `require('react')` / `require('fedx-report')` 等由宿主运行时注入（remote-component-loader `createRequires(resolve)`，[use-remote.ts](src/hooks/use-remote.ts)）→ 新壳提供同名 resolve map，老物料**无需重构建**即可加载，这是物料继承的抓手。
2. 反之，resolve 清单里的依赖（含 fedx-report、oss-ui/antd4）是物料运行时协议的一部分，**不能一刀切移除**——老物料可能直接 import 它们。

## 3. P2 资源契约层（importFields）

| 冻结项                     | 事实基准                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| fetchRemoteModule 返回字段 | `schema` / `defaultValue` / `materialInfo`（[use-remote.ts](src/hooks/use-remote.ts)，矩阵 C40）        |
| schemaCache 行为           | Map 缓存、按 schemaPath 复用（需复刻）                                                                  |
| 本地物料对齐               | registerLocalMaterials 的 findLocalMaterial / findLocalSchema 同契约（C41）；本地包零改动加载是继承前提 |

## 4. P3 节点与树层

| 冻结项              | 事实基准                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 节点三分法          | FIELD_COMP_TYPES：`field`（叶子）/ `group`（容器 children）/ `layout-block`（内置 common field）（矩阵 C02/B35） |
| 组合组件落树规则    | 组合组件物料落树为 group 节点带 children，children 展开（B35）                                                   |
| layout-block 常量   | groupId=9、isLayoutBlock 前端字段、drop 仅可落 layout-block、子节点 enableMovable:false、拖入尺寸同步（C22）     |
| MATERIAL_TYPES 正交 | component / custom / business 管物料来源，与节点形态正交                                                         |

## 5. P4 渲染矩阵层（节点形态 × mode × visualType）

| 场景                 | layout-block 表现                                                      |
| -------------------- | ---------------------------------------------------------------------- |
| layout 路由 + 设计态 | 可编辑容器：边框、选中、右键菜单、空态占位（宽\*高）、子组件禁独立拖动 |
| 其他路由 + 运行态    | isViewer：去边框、无占位，**结构与 children 照常渲染（透明布局）**     |

- 三条渲染链（item-field / group-field / layout-block）× 三种形态组合，Phase 3 实现依据（C01-C23）。
- 模式矩阵：五种 designerType（LARGE_SCREEN / LAYOUT / BUSINESS_COMP / CUSTOM_COMP / FILL_LAYOUT）× visualType（1 scene / 2 layout / 3 template）分叉面（矩阵 D5/J2）。
- 预设尺寸：LAYOUT_BLOCK.PRESET_BLOCK_LIST 合并进物料列表（C43）。

## 6. P5 数据协议层

| 冻结项 | 事实基准 |
| --- | --- |
| DataSourceEnum | json / api / businessIndicator / dataSet / iframeSource（C27/C28） |
| 系统参数表 | $sysdate / $accesstoken / $sceneIdStr / currentLoginInfo / 权限 key；TEMP_DATA_SET_PREFIX（C30） |
| 事件常量 | ACTION_INTERACTION / configurableEvent / dynamicEvents / compositionAction / drilldownEvent / ENUM_DRILL_DOWN，来自 @fedx-vis/share（C22/C26）——**协议要求 share 常量供给与版本一致** |
| CustomDataSourceUseType | REQUEST / EXPORT；DESIGNER_ORIGIN_DATA 哨兵（C27） |
| 交互动作 schema 形态 | DefineAction(Item/Array) 产出的 schema 形态（C27'） |
| 下钻层级语义 | **已拍板（Q5，2026-09-17）**：单层（level 0）跳转，与现状一致；多层不做（D8） |
| 多选选中态 | **已拍板（Q1，2026-09-17）**：`string[]`，落在 plugins view 插件；存量 JSON 入口 `split(',')` 一次性转换，逗号串不进新架构内部契约 |

## 7. P6 环境契约层

| 冻结项          | 事实基准                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| 作用域三元组    | appScopeId=`id_visualType` / sceneId / visualType（ScopeProvider，C44）                                   |
| 物料 Props 契约 | 对齐既有 `design/src/topics/物料开发上下文声明.md`；receivedPropsParams（父页面→物料传参）是契约面（C20） |
| 表单上下文      | FormProvider 环境（B44）                                                                                  |
| 拖放载荷        | 物料库/画布拖拽 payload 结构（B49/B50）                                                                   |

## 8. P7 存量数据附录（存量大屏反序列化硬依赖）

| 冻结项                     | 事实基准                                                        |
| -------------------------- | --------------------------------------------------------------- |
| ConfigFormatter.dataConfig | 保存/加载时数据配置格式转换（C37）——字段演进需向后兼容约定      |
| 动画 schema                | share.form.createAnimationSchema 入场动画配置（C36）            |
| 轮播配置                   | **已拍板（Q2，2026-09-17）**：协议冻结组轮播配置项 + react-slick 长尾样式（B39/C19），运行时可换；子组件状态注入禁照抄 cloneElement，实现前先做数据流分析 |
| DIMENSION 等存量配置       | 矩阵 B37/B39 存量配置附录条目                                   |

---

## 9. Phase 0 工作项（协议冻结执行清单）

1. 以本文为底稿产出正式 `design/物料运行时协议.md`（含每项的代码证据链接与版本号快照）。
2. **fedx-report 依赖面审计**：对现存远程物料产物 grep `fedx-report` import，摸清角色 A 真实耦合面——所有后续决策的事实基础（产物不可得则退化为 Phase 1 灰度期逐个暴露）。
3. Q1 / Q2 / Q5 / Q8 拍板结论回写进对应协议层（多选态形态、轮播运行时、下钻层级、schema-designer 去留）。
4. 产出物：协议文档 v1 + 依赖面审计报告。
