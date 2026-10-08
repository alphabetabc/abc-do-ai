# Task · 2026-10-08-004-detail-react-echarts-doc

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-004-detail-react-echarts-doc` |
| Status | 已完成（待验收） |
| 类型 | skill（组件文档细化，无业务代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/components/002-react-echarts/README.md` |
| Roadmap | skill 结构治理延续（task-002 后续） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-10-08-002（目录结构已就位） |

---

## 目标（Goal）

基于 `web/components/large-screen/lib` 导出的 `ReactECharts` 实际源码，把 002-react-echarts/README.md 细化：补 ReactECharts 组件 Props 表、option 更新 / replaceMerge 机制说明、大屏常用图表类型（line / bar / pie 等）的项目内真实示例与配色预设体系。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：Read `web/components/large-screen/lib` 中 ReactECharts 相关源码（Props 定义、事件、实例句柄）；Grep 项目内真实使用示例（抽样 2~3 个典型图表用法）
- **输出**：调研结论（对话中呈现）
- **等待用户**：否

### 步骤 2：文档细化

- **动作**：更新 `design/components/002-react-echarts/README.md`：ReactECharts Props 表、option 合并 / replaceMerge 行为说明、真实示例（替换/补充现有骨架）、大屏字体与配色预设说明（保留现有内容中仍准确的部分）
- **输出**：更新后的 README.md
- **等待用户**：否

### 步骤 3：验收

- **动作**：核对 Props / 示例与源码一致；grep 交叉引用无死链
- **输出**：验收 checklist 勾选
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改 `web/components/` 源码
- 不写 ECharts 官方 API 教程（只写项目封装层的约定与差异）
- 不穷举项目内所有图表用法——按图表类型抽代表性示例
- **组件层文档纪律（源自 task-003 验收教训，必须遵守）**：
  - 不列举「哪些业务页面在用本组件」——引用方向只允许业务文档 → 组件文档，不允许反向
  - 不挂与组件无关的关联链接；「真实业务示例」仅可作为 Props 用法的最小说明出现在子文档，不在 README 出现
  - design/ 文档是长期真实源，**不写任务溯源 / 变更记录 / 过程性信息**（这些只进任务卡）
  - README 保持入口薄层：定位 + 快速上手 + 文档索引；内容拆分到主题子文档，不堆在单 README 里

---

## 验收 checklist

- [x] A1：ReactECharts 的 Props（含事件 / 实例句柄）有表格说明，与源码一致 → `props.md`
- [x] A2：`replaceMerge` 行为有明确说明（何时需要 / 影响什么）→ `update-behavior.md`（含 notMerge 对比与触发时机）
- [x] A3：至少 2 个项目内真实图表示例（注明来源路径）→ `examples.md`（ind-trend line/bar、scale-pie-card 多环 pie）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（无则 N/A）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-08 | user（「开始执行下一个task」） |
| ② 实现验收 | 待验收 |  |  |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 同系列：`task-2026-10-08-003-detail-emap-gis-doc`、`task-2026-10-08-005-detail-rc-echarts-map-doc`
