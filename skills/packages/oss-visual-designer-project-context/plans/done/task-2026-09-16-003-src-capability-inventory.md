# Task · 2026-09-16-003 · src 能力入口遍历盘点与差距矩阵

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-09-16-003-src-capability-inventory` |
| Status | 已完成（Q1~Q11 全部拍板，硬门槛②通过） |
| 类型 | docs（调研盘点） |
| 影响范围 | 新建 `design/packages-next/src能力差距矩阵.md` 与 `design/packages-next/designer-app/` 方案套件；删除旧稿 `designer-app演进方案.md`（内容已沉淀入套件） |
| Roadmap | `plans/roadmap.md` 对应条目 task-2026-09-16-003 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-09-16-002（designer-app 演进方案已沉淀） |

---

## 目标（Goal）

从 src 应用入口出发沿调用链**系统遍历**全部用户可感知能力，产出「src 能力差距矩阵」——每个能力点标注证据链路与新架构处置（已覆盖 / 协议冻结项 / 需重建 / 建议放弃），作为 designer-app 演进方案 Phase 0 的事实账本与 Phase 1-3 任务拆分来源。

---

## 步骤（执行计划）

### 步骤 1：入口层遍历（路由 + App 壳）

- **动作**：从 `src/app/router`（或等价路由表）逐 route 追到页面组件；`src/app/container` 追登录/环境/Modal 挂载链路；枚举全部 visualType 场景（scene / layout / template / schema / …）
- **输出**：路由 × 页面 × visualType 场景清单（矩阵第一区块）
- **等待用户**：否

### 步骤 2：设计器区域遍历（DesignerContent 分解）

- **动作**：沿 DesignerContent 组装根逐区域深入：toolbar / aside-panel（三级物料面板 + layers-tree）/ canvas-graph / configuration-panel / context-menu / dnd；每个区域沿 props / hooks / selector 向下追能力触发面
- **输出**：区域级能力点清单（含条件性能力分叉：mode × visualType × FIELD_COMP_TYPES × materialType）
- **等待用户**：否

### 步骤 3：渲染链与插件域遍历

- **动作**：renderer（DesignerField / item-field / group-field / layout-block / generator / generator-widget）、plugins（interaction / data-fetcher / schema-designer 相关）、formily widgets、use-remote 物料加载链逐个触达登记
- **输出**：渲染/插件/物料能力点清单
- **等待用户**：否

### 步骤 4：差距矩阵成稿

- **动作**：三区块合并为 `design/packages-next/src能力差距矩阵.md`；每行标注处置列（core/plugins 已覆盖 / MaterialCompatHost 协议项 / Phase 3 重建 / 建议放弃待拍板）；与既有文档（能力域总览、designer-state 契约、交互系统文档等）交叉核对，冲突以代码为准
- **输出**：矩阵文档初版
- **等待用户**：否

### 步骤 5：用户核对与处置拍板

- **动作**：用户 review 矩阵，重点拍板「建议放弃」列与遗漏补录
- **输出**：矩阵定稿
- **等待用户**：是（硬门槛②）

### 步骤 6：回填与归档

- **动作**：矩阵定稿后回填演进方案（Phase 0 产出项、Phase 1-3 任务来源）；更新 roadmap / 归档任务卡
- **输出**：全部引用一致，归档 `done/`
- **等待用户**：否

---

## 遍历纪律（方法论约束）

1. **入口驱动**：只登记被入口链路实际触达的能力；链路外代码（workder-scripts、.bak、schemaDemo、死别名）标记「存档，不入矩阵」
2. **触达即登记**：登记粒度 = 用户可感知能力（如「组右键菜单含拆组」），不是文件
3. **分叉点逐分支跟**：visualType / mode / FIELD_COMP_TYPES / materialType 条件分支各跟一遍
4. **证据链**：每行带代码证据（路径 + 行为描述），遵循 02-no-hallucination（引用前必 Read）
5. **排除 `.bak`**：grep 时一律排除历史快照

---

## 不做清单

- 不写任何业务代码，不改 src/
- 不做 fedx-report 依赖面审计（远程物料产物审计，属演进方案 Phase 0 另行任务）
- 不在矩阵中设计新架构实现方案（只标注处置，设计留给后续 task）
- 不盘点 packages-next 现状（已有 design/packages-next/ 契约文档，交叉引用即可）

---

## 验收 checklist

- [x] A1：入口遍历覆盖全部路由 × visualType 场景，无凭印象条目
- [x] A2：设计器六区域（toolbar/aside-panel/canvas-graph/configuration-panel/context-menu/dnd）+ 渲染链 + 插件域 + 物料链全部触达登记
- [x] A3：每行能力点有代码证据（路径），处置列四选一无空
- [x] A4：与既有文档交叉核对，冲突点在矩阵中显式标注（以代码为准）
- [x] A5：矩阵已回填演进方案（Phase 0 产出项 + Phase 1-3 任务来源引用）
- [x] A6：链接为仓库相对路径，roadmap 已更新

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | Q1~Q11 处置拍板（步骤 5 硬门槛②） | 用户 | 已关闭 | 全部拍板（2026-09-17），结论见矩阵 §6 / designer-app/50-open-questions.md |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（对话中用户确认入口遍历方法并指示立项） | 2026-09-16 | 用户 |
| ② 实现验收 | 已通过（Q1~Q11 全部拍板，验收 checklist A1-A6 全过） | 2026-09-17 | 用户 |

---

## 进度日志

### 2026-09-16

- 任务立项；遍历纪律与六步计划确定

### 2026-09-17（合并 review 会话）

- 通读 `.local-review/` 三模型 8 份报告（r1 系列 3 / r2 1 / r3 系列 4），求并集；6 项分歧回 packages-next 代码验证裁定（矩阵 §0.3 J1~J6：customFieldsListMapping / app slice 承载 / 插件数 6 / selected 单选 / createRecalcGroupBounds 已导出未接线 / copy uniqueId 默认 false）
- 产出合并版矩阵 `design/packages-next/src能力差距矩阵.md`（137+ 编号项，C01~C51 + D1~D10 + Q1~Q11 + Phase 映射）
- 产出详细版演进方案套件 `design/packages-next/designer-app/`（00-overview / 10-runtime-protocol / 20-material-compat-host / 30-formily-interpreter / 40-phases / 50-open-questions）
- 旧稿 `designer-app演进方案.md` 内容全量核对沉淀入套件后**已删除**（引用同步清理：00-overview 头注、本任务卡）
- **步骤 5 硬门槛②：等待用户拍板 Q1~Q11**（见矩阵 §6 或 designer-app/50-open-questions.md）
- **Q1~Q11 全部拍板完成（2026-09-17）**：Q1 多选 `string[]`（plugins 层）｜Q2 轮播协议冻结样式+配置、运行时可换（禁照抄 cloneElement）｜Q3 数字人插件化探索/性能监控保留后期加｜Q4 放弃跨页注入 hook｜Q5 下钻保持单层｜Q6 src 死功能先不动｜Q7 恢复到快照=新增功能记 backlog｜Q8 放弃 schema-designer｜Q9 场景监控插件化（优先级非常低）｜Q10 spreadsheet 不要/dev 路由仅记录｜Q11 跳板业务能力保留（Phase 4 承接）/预留路由不迁移。拍板结论已回写矩阵 §6、50-open-questions、10-runtime-protocol 对应层；backlog 新增「恢复到快照」「undo/redo」两方向项。硬门槛②通过，任务归档

---

## 关联

- 相关 task：task-2026-09-16-002（designer-app 演进方案，本矩阵是其 Phase 0 事实账本）
- 相关文档：`design/src/能力域总览.md`（六能力域，交叉核对基准）
