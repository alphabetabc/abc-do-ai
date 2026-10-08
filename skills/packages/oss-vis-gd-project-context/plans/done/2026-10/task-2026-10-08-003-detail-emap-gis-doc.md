# Task · 2026-10-08-003-detail-emap-gis-doc

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-003-detail-emap-gis-doc` |
| Status | 已完成 |
| 类型 | skill（组件文档细化，无业务代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/components/001-emap-gis/README.md` |
| Roadmap | skill 结构治理延续（task-002 后续） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-10-08-002（目录结构已就位） |

---

## 目标（Goal）

基于 `web/components/ui/emap-gis` 实际源码，把 001-emap-gis/README.md 从「照迁 agent 定义的三段示例」细化为完整组件用法文档：覆盖组件清单、Props 表、EMap 外部库动态加载机制、真实使用示例。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：Read `web/components/ui/emap-gis` 全部源码（组件导出清单、各组件 Props、EMap 库加载方式）；Grep 项目内真实使用处（页面级调用示例）
- **输出**：调研结论（对话中呈现，重大发现可存 `plans/research/`）
- **等待用户**：否

### 步骤 2：文档细化

- **动作**：重写 `design/components/001-emap-gis/README.md`：组件清单与导出、各组件 Props 表、EMap 外部库动态加载机制、真实业务调用示例（取自项目实际页面）、维护注意事项；保留与 MapGeo 的「两套实现」提示
- **输出**：更新后的 README.md
- **等待用户**：否

### 步骤 3：验收

- **动作**：核对文档所有路径 / 组件名 / Props 均与源码一致（反幻觉守则）；grep 交叉引用无死链
- **输出**：验收 checklist 勾选
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改 `web/components/ui/emap-gis` 源码
- 不覆盖 rc-echarts / map-geo 内容（各归其文档）
- 不做 API 全量穷举——只写有真实使用依据的部分，源码里未被使用的内部能力不展开

---

## 验收 checklist

- [x] A1：README 覆盖 emap-gis 目录下的全部对外导出组件，每个有 Props 说明（来源源码，非编造）
- [x] A2：含至少 1 个项目内真实调用示例（注明来源路径）
- [x] A3：说明 EMap 外部库动态加载机制（若源码确有此机制；以调研结果为准）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（无则 N/A）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

> 变更记录（2026-10-08）：旧 README 示例与源码不符（MapWidgetPoints 无 onPointClick、点位非 position 数组、MapWidgetRegionOutline 无 props），已按源码全量重写；「不做清单」中「不做 API 全量穷举」放宽为 EMapUtils 方法一览表（表格式，来源 emap.ts 全量阅读）。同日按用户要求从单 README 拆分为多文件（README 入口 + components / utils / loader / lifecycle / usage-cmd-dispatcher 五个子文档），此拆分形式作为后续 004/005/006 文档结构基线。同日按用户验收意见修正方向性原则：**组件层文档不列举业务使用处、不挂业务侧/ECharts 关联链接**（引用方向应为业务文档 → 组件文档，emap-gis 与 ECharts 无关，仅保留顶部「两套实现」防混淆一句）；已删 README 的「真实用法参照」行、「相关文档」节与 usage-cmd-dispatcher.md，该原则同步适用于 004/005/006。补充：连「与 ECharts 系是两套实现」的防混淆对比句也删除——组件文档不与其他组件做对比说明。

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-08 | user（「先执行003」） |
| ② 实现验收 | 已通过 | 2026-10-08 | user |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 同系列：`task-2026-10-08-004-detail-react-echarts-doc`、`task-2026-10-08-005-detail-rc-echarts-map-doc`
