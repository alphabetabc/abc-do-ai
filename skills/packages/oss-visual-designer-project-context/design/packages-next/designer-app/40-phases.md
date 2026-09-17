# Phase 0-4 · 任务拆分与验收

> 状态：**初稿待拍板**。事实来源：[src能力差距矩阵.md](skills/oss-visual-designer-project-context/design/packages-next/src能力差距矩阵.md) §7.2 Phase 映射。
> 编号引用（A/B/C/D/Q）均指矩阵条目。

---

## Phase 0 · 物料运行时协议冻结（纯文档 + 薄代码）

**目标**：老物料隐式契约显式化为 v1 冻结面。

| # | 任务 | 输入（矩阵条目） |
| --- | --- | --- |
| 0-1 | 产出正式《物料运行时协议.md》（七层冻结清单） | [10-runtime-protocol.md](10-runtime-protocol.md) 底稿；② 全部条目（B35/C22/C39/C40/C30/C26/B37/B39 等） |
| 0-2 | fedx-report 依赖面审计（远程物料产物 grep `fedx-report`） | C39 角色 A；产物不可得则退化 Phase 1 灰度暴露 |
| 0-3 | 样式命名空间规范（antd4/antd5 并存） | C42、风险 #2 |
| 0-4 | 待拍板结论回写：Q1 多选态 / Q2 轮播 / Q5 下钻 / Q8 schema-designer | [50-open-questions.md](50-open-questions.md) |

**验收**：协议文档过用户 review；审计报告覆盖现存产物。
**不做**：任何 src 代码改动；任何 UI。

---

## Phase 1 · 新壳骨架 + 老物料跑通（最大里程碑）

**目标**：designer-app 组装 core+plugins，MaterialCompatHost 把真实老物料渲染上画布。

| # | 任务 | 输入 |
| --- | --- | --- |
| 1-1 | designer-app 脚手架（React 18 + Vite + antd 5；或重构 designer-next，二选一立项时定） | 00-overview §2 |
| 1-2 | core + 6 plugins 组装、壳层 extra（designerType / contextMenu / topToolbarHiddenList） | D5/J2、C48 |
| 1-3 | hox 五模型壳层替代（useComponentsInfo 为 B16/B19/C43 数据源） | C47 |
| 1-4 | MaterialCompatHost 加载链（resolve map / 远程加载 / fallback / 本地注册） | [20-material-compat-host.md](20-material-compat-host.md)；C38-C42 |
| 1-5 | 启动预取编排（InitDataQuery 等价） | C43 |
| 1-6 | 画布最小渲染（布局占位，不含完整渲染链） | — |
| 1-7 | **React 18 注入兼容实测 + three.js/iframe 重依赖实测** | 风险 #1/#2、C42 |
| 1-8 | 五类 data factory + 系统参数 + DPU 壳层实现并注入 fetcherFactory | D7、C28-C30 |
| 1-9 | （Q9 通过后）通用嵌入协议：隐藏区/禁移动/消息保存/物料白名单配置化 | A04、D10 |

**验收**（= 方案可行性证明）：
- [ ] 真实远程老物料（含 fedx-report 依赖）渲染成功
- [ ] 本地重依赖物料（three.js / iframe）加载成功
- [ ] React 18 + React 17 物料兼容模式无崩溃、样式无串扰
- [ ] 五种 designerType 模式分叉在壳层可配置生效

---

## Phase 2 · formily 自建解释器

**目标**：替代 fedx-report 角色 B/C。详见 [30-formily-interpreter.md](30-formily-interpreter.md)。

| # | 任务 | 输入 |
| --- | --- | --- |
| 2-1 | SchemaInterpreter（createSchemaField + effects，props 对齐 FedxReportRenderer） | B 角色契约 |
| 2-2 | 设计时三件套 shim（createResource/createBehavior/createFieldSchema/ISchema） | C 角色契约 |
| 2-3 | 40+ widget 四批迁移验证 | D9 口径、B41-B44 |
| 2-4 | 交互动作 schema 定义器（DefineAction）迁移 | C26/C27' |
| 2-5 | ConfigFormatter.dataConfig 兼容层 | C37、协议 P7 |

**验收**：配置面板脱离 fedx-report 可渲染全部 widget；存量配置数据可加载/编辑/保存。

---

## Phase 3 · 渲染域重建（工作量最大）

**目标**：画布渲染链 + 六区域 UI + 交互全集，在 core hooks 体系上重写。

| # | 任务 | 输入 |
| --- | --- | --- |
| 3-1 | 设计态渲染链：递归 → FieldGenerator 三分叉 → DesignerField（react-rnd） | C01/C02/C05-C09 |
| 3-2 | 渲染矩阵：三链（item/group/layout-block）× 三态（设计态/layout 路由/运行态）；layout-block 运行态透明布局 | C03/C04/C19/C22、协议 P4 |
| 3-2a | 已知坑：layout-block 配置面板 onValueChange 需读 components 整树算组尺寸（byId 不存 children，旧稿 §1.3 关联事实）；另 layout/template 路由下 toolbar 隐藏部分图标（路由类型影响工具栏能力面） | 旧稿沉淀 |
| 3-3 | 画布交互：拖动（throttle/dragFieldInLayoutBlock/dropToGroup/多选联动）、resize、对齐线、选中框 | C07-C09；约束矩阵 ② |
| 3-4 | 多选态扩展（viewUI.selected → 多选形态，Q1 拍板后）+ getClickSelectedIds 迁移（含 FILL_LAYOUT 变体） | D1/J4、C06 |
| 3-5 | 组级联缩放接线（createRecalcGroupBounds 订阅） | D3/J5、C10 |
| 3-6 | copy 显式传 resetChildrenUniqueId=true | D4/J6、C50 |
| 3-7 | 六区域 UI：toolbar / 物料库 / 图层树 / canvas-graph / 配置面板壳 / 右键菜单 / dnd / 快捷键 | B01-B61、G-01-G-04 |
| 3-8 | 页面壳全集：五种 designerType 页面 + 预览壳 + 微应用壳 | A03-A27 |
| 3-9 | ItemField 三件套运行时装配（interaction hooks + useFetchData + FieldWrapper/FieldDataStatus） | C12-C14 |
| 3-10 | 组运行时：react-slick 轮播（Q2 拍板后定运行时策略）、数字人切页（Q3 不进首批则缓） | C19-C21 |
| 3-11 | 动画 FieldAnimation、数据调试 DataDebug、下钻弹窗 | C15-C17 |
| 3-12 | 性能设施：taskManager / withRenderTask / fetchStorage / ScreenPerformance（Q3） | C18/C34/C45/C46 |
| 3-13 | 快照/发布/模板（矩阵 B 区对应条目） | B11 等 |
| 3-14 | **440 组件场景性能验收** | AGENTS.md 性能红线 |

**验收**：
- [ ] 渲染矩阵三链三形态全过
- [ ] 440 组件场景性能对齐主线（React.memo 纪律）
- [ ] 六区域 UI + 交互全集可用（对照矩阵 B 区逐条）
- [ ] 一块存量大屏在新壳完整打开、编辑、保存、预览

---

## Phase 4 · 双轨与退役

| # | 任务 |
| --- | --- |
| 4-1 | designer-app 与 src 主线并行，按页面/场景灰度切换 |
| 4-2 | 老物料逐步升级到新协议（去 fedx-report 依赖，可选动作） |
| 4-3 | 全部退役后删除 resolve map 兼容条目（fedx-report / oss-ui） |
| 4-4 | 旧路由清理：跳板页逻辑重建、Q10/Q11 存档项处置、dev 路由不迁移生产 |

---

## 依赖与并行关系

```text
Phase 0 ──► Phase 1 ──┬──► Phase 2（依赖壳 + factory 注入）
                       └──► Phase 3（依赖物料链；3-7 配置面板壳可与 Phase 2 并行）
Phase 2 + Phase 3 ──► Phase 4
```

每个 Phase 立项为独立 task，从矩阵对应编号取验收清单；Phase 间设用户 review 硬门槛。
