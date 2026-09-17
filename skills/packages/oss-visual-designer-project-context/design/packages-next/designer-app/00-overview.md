# designer-app 演进方案 · 总览

> 状态：**初稿待拍板**。创建：2026-09-17。
> 取代已删除的粗糙版初稿 `designer-app演进方案.md`（2026-09-16，task-2026-09-16-002 产出；内容已全量沉淀进本套件后删除）。
> 立项 task：`plans/task-2026-09-16-002-designer-app-evolution.md`；事实账本 task：`plans/task-2026-09-16-003-src-capability-inventory.md`。
> 事实基准：[src能力差距矩阵.md](skills/oss-visual-designer-project-context/design/packages-next/src能力差距矩阵.md)（三模型独立遍历合并稿，137+ 编号项，分歧已回代码裁定 J1~J6）。

---

## 1. 背景与动机

### 1.1 两条演进线的困境

- **designer-next 壳**（packages-next/designer-next）：早期脚手架，readme 选型（redux）与 designer-core 实际选型（Zustand）矛盾，内部带 hox 副本，designer/preview 模块仍是 `<span>` 空壳，**零引用 core/plugins**。沿它修补要硬啃 fedx-report 黑盒、antd 4 升级、Webpack 4 / React 17 包袱。
- **「core + plugins 换 src 内核」**：只是把旧壳发动机换掉，旧壳本身（渲染链、表单引擎、物料加载）的债务一个没少。

### 1.2 真实意图：另起炉灶

用新架构思想把 src 能力**重构**为全新设计器应用 **designer-app**，同时守住两条底线：

1. **老物料资产零改动继承**：`src/packages/*` 本地物料 + 远程物料（remote-component 协议产物）不经重构建即可加载。
2. **fedx-report 退场**：用 formily 自建解释器替代其表单引擎角色（先 B 后 C、A 最后退的三步走）。

### 1.3 差距矩阵给出的定量结论

- 新架构（core + 6 plugins）覆盖的是 src 六能力域中的**状态与命令层**，约占编号项两成，**且零 UI**。
- 物料继承面（协议项 ②）边界清晰，可直接进 Phase 0 冻结。
- **差距主体是整个渲染/交互/壳层 UI 的 Phase 1-3 重建**。
- 11 个去留/形态问题待用户拍板（[50-open-questions.md](50-open-questions.md)），其中多选态、轮播运行时、schema-designer 退场三项影响协议冻结。

---

## 2. 总体架构

**核心思路：把「物料运行时协议」从 src 显式抽出冻结为 v1 契约；新壳在协议之上自由使用新技术，协议之下持续供养老物料。**

```text
┌───────────────────────────────────────────────┐
│ designer-app（新炉灶，React 18 + Vite + antd 5）│
│  页面壳 / 预览壳 / 微应用嵌入壳（Q9 嵌入协议）     │
│  六区域 UI：toolbar/物料库/图层/画布/配置/右键     │
│  formily 自建解释器（新表单引擎，40+ widget）      │
│  渲染链：item-field / group / layout-block 矩阵   │
├───────────────────────────────────────────────┤
│ @fedx-vis/designer-core + designer-plugins     │
│  树状态骨架 / 插件机制 / 6 插件状态逻辑（直接组装） │
├───────────────────────────────────────────────┤
│ MaterialCompatHost（物料兼容宿主）★ 方案核心      │
│  · resolve map v1（react/oss-ui/fedx-report…）  │
│  · use-remote 加载链新实现（缓存/fallback）       │
│  · 隔离子树 + 样式命名空间                       │
├───────────────────────────────────────────────┤
│ 老物料资产（packages/* + 远程物料，零改动）        │
└───────────────────────────────────────────────┘
```

三个器官：

| 器官 | 内容 | 状态 |
| --- | --- | --- |
| 状态器官 | designer-core + designer-plugins（树读写 / 图层与成组命令 / 交互 hooks / 数据请求主干 / 实时数据流） | 已完成，直接组装 |
| 兼容消化系统 | MaterialCompatHost（新增概念，本方案核心） | [20-material-compat-host.md](20-material-compat-host.md) |
| 新表单器官 | formily 自建解释器（替代 fedx-report 角色 B/C） | [30-formily-interpreter.md](30-formily-interpreter.md) |

关键架构决定（源自矩阵裁定）：

- **模式矩阵承载**：五种 designerType × visualType 分叉在 core 无 extra 字段（裁定 J2/D5），由 designer-app 壳层自定义 extra slice 承载，模式矩阵本身进协议冻结面。
- **多选态扩展**：plugins `viewUI.selected: string \| null` 单选（裁定 J4/D1），Phase 3 前扩展为多选（形态待 Q1 拍板）。
- **copy uniqueId**：layer-management 默认 `resetChildrenUniqueId=false`，src 为 true（裁定 J6/D4），画布复制显式传 true。
- **组重算接线**：core 已导出 createRecalcGroupBounds 纯函数（裁定 J5/D3），Phase 3 在画布层订阅接线。

---

## 3. 文档导航

| 文档 | 内容 |
| --- | --- |
| [10-runtime-protocol.md](10-runtime-protocol.md) | 物料运行时协议 v1 冻结清单（resolve map / importFields / 落树形态 / 渲染矩阵 / 系统参数 / 事件常量 / 存量数据附录） |
| [20-material-compat-host.md](20-material-compat-host.md) | MaterialCompatHost 设计：加载链、隔离子树、样式隔离、fallback、启动编排 |
| [30-formily-interpreter.md](30-formily-interpreter.md) | formily 自建解释器：SchemaInterpreter、设计时三件套 shim、40+ widget 迁移分批 |
| [40-phases.md](40-phases.md) | Phase 0-4 详细任务拆分、依赖顺序、验收判据、工作量来源（映射矩阵编号） |
| [50-open-questions.md](50-open-questions.md) | 待拍板问题 Q1-Q11（含矩阵 D1-D10 差距点） |

---

## 4. 阶段路线一览

| Phase | 目标 | 成败判据 | 详见 |
| --- | --- | --- | --- |
| 0 协议冻结 | 物料运行时协议 v1 文档 + fedx-report 依赖面审计 | 协议文档过 review；审计报告覆盖现存远程物料产物 | [40-phases.md §1](40-phases.md) |
| 1 壳骨架 + 老物料跑通 | designer-app 组装 core+plugins；MaterialCompatHost 把真实老物料渲染上画布 | React 18 注入 React 17 物料实测通过（整个方案可行性证明点） | [40-phases.md §2](40-phases.md) |
| 2 formily 解释器 | SchemaInterpreter + 三件套 shim + 40+ widget 分批迁移 | 配置面板可用 fedx-report 以外的引擎渲染全部 widget | [40-phases.md §3](40-phases.md) |
| 3 渲染域重建 | 画布渲染链 + 六区域 UI + 交互全集 | 440 组件场景性能对齐主线；渲染矩阵三链三形态全过 | [40-phases.md §4](40-phases.md) |
| 4 双轨与退役 | designer-app 与 src 并行灰度，fedx-report 角色退场 | 按页面/场景灰度切换；老物料去 fedx-report 依赖 | [40-phases.md §5](40-phases.md) |

依赖关系：Phase 0 → 1 → 2/3 可部分并行（2 依赖 1 的壳，3 依赖 1 的物料链）→ 4。

---

## 5. 风险清单

| # | 风险 | 应对 |
| --- | --- | --- |
| 1 | React 18 注入 React 17 构建物料不兼容 | Phase 1 最先实测；失败退到「物料子树独立 React 17 运行时」（复杂度上升，需重新评估） |
| 2 | antd4（oss-ui）/ antd5 样式串扰 | 提前定命名空间规范；物料子树样式隔离（C42 three.js / iframe 重依赖同批实测） |
| 3 | fedx-report 隐藏用法（审计未覆盖） | resolve map 永久保留一份 fedx-report 供给老物料兜底（角色 A） |
| 4 | formily 解释器长尾（FedxReportRenderer 特殊行为覆盖不全） | 逐 case 补齐；Phase 2 分批验证机制兜底 |
| 5 | 远程物料产物不可得 / 审计受限 | Phase 0 拿不到产物则退化为 Phase 1 灰度期逐个暴露 |
| 6 | 存量大屏数据兼容（动画 schema / ConfigFormatter / 轮播长尾样式） | 协议附录冻结存量配置格式；Q2/Q5 拍板后写入 |

---

## 6. 不做清单

- 不改 `src/` 主线任何代码（主线持续服务生产直到 Phase 4 灰度切换；例外：Q6 中 console.log 一类顺手清理项，经用户批准单独小 task）。
- 不在 Phase 0-2 处理 undo/redo、持久化版本回滚（core 已有备忘，另立任务，见 Q7）。
- 不重构建老物料（零改动是前提；升级去 fedx-report 是 Phase 4 可选动作）。
- 不在 packages-next 内做微前端适配器 / hox 替换设计（hox 五模型属 Phase 1 壳层，见矩阵 C47）。
- 不迁移死功能：一键升级 UI、横纵分布/合并拆分占位按钮、spreadsheet 页（待 Q6/Q10 拍板确认）。
- 不迁移 dev 辅助路由到生产面（A01/A02/A16）。

---

## 7. 下一步

1. 用户拍板 [50-open-questions.md](50-open-questions.md) Q1-Q11（硬门槛②）。
2. 本套件过 review。
3. Phase 0 立项：物料运行时协议冻结 + fedx-report 依赖面审计。
