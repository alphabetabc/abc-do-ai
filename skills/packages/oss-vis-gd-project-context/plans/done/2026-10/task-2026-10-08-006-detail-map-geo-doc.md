# Task · 2026-10-08-006-detail-map-geo-doc

---

## 任务元信息

| 项       | 值                                                                                         |
| -------- | ------------------------------------------------------------------------------------------ |
| 编号     | `task-2026-10-08-006-detail-map-geo-doc`                                                   |
| Status   | 已完成（已归档）                                                                           |
| 类型     | skill（业务模块文档细化，无业务代码改动）                                                  |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/modules/five-major-center/map-geo/README.md` |
| Roadmap  | skill 结构治理延续（task-002 后续）                                                        |
| 验收标准 | 见下方验收 checklist                                                                       |
| 前置依赖 | task-2026-10-08-002（目录结构已就位）                                                      |

---

## 目标（Goal）

基于三中心 map-geo 实际源码，把 five-major-center/map-geo/README.md 细化为完整业务模块文档：数据模型（dataSource / legendCategories / API 返回结构）、交互清单（点击 / 切换 / 弹窗流程）、状态与缓存机制、三中心具体差异明细（而非只一张接线状态表）。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：Read 三份 map-geo 的 `index.tsx` / `presets.ts` / `InfoCard.tsx` / `Legend.tsx`，diff 三份差异；追其数据请求（services 层 + mock），梳理 dataSource 字段结构；梳理交互链路（onMapClick → InfoCard、Legend 切换 → 数据重新拉取 / 缓存）
- **输出**：调研结论（对话中呈现，三份差异清单）
- **等待用户**：否

### 步骤 2：文档细化

- **动作**：更新 `design/modules/five-major-center/map-geo/README.md`：
    - **数据模型**：dataSource 字段表（名称 / 类型 / 含义，来源源码）、legendCategories 分类结构、接口 / mock 路径
    - **交互清单**：地图点位点击流程、区域（geo）点击流程、Legend 分类切换流程、InfoCard 弹窗展示与内嵌 LineChart、异常 / 空数据表现
    - **状态与缓存**：useRefCache 缓存 key 规则、数据加载态
    - **三中心差异明细**：在接线状态表基础上补数据源 / 分类 / 交互的具体差异
- **输出**：更新后的 README.md
- **等待用户**：否

### 步骤 3：验收

- **动作**：核对所有字段 / 交互描述与源码一致（反幻觉守则）；与 `design/components/003-rc-echarts-map/README.md` 职责边界清晰（业务 vs 底层）；交叉引用无死链
- **输出**：验收 checklist 勾选
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改任何 `web/` 业务代码
- 不重复底层组件（EChartsMap / Overlay）用法（那是 components/003 的职责）
- 不为三中心各写一份文档（差异并入本 README）
- 不动 `map-geo-bak` 备份目录相关内容（只说明其存在）
- **文档纪律（源自 task-003 验收教训，必须遵守）**：业务文档引用组件文档（方向：业务 → 组件），不反向列举；design/ 文档不写任务溯源 / 变更记录 / 过程性信息（只进任务卡）；README 入口薄层 + 内容拆主题子文档（可建 map-geo/ 子目录，如 data-model.md / interactions.md / diff-three-centers.md）

---

## 验收 checklist

- [x] A1：数据模型有字段表（dataSource / legendCategories 等），来源源码可核对 → 各中心 data-model 文档
- [x] A2：交互清单覆盖点位点击 / 区域点击 / 分类切换 / 弹窗展示，每条有流程描述 → 各中心 interactions 文档
- [x] A3：三中心差异从「接线状态」细化为具体数据 / 交互差异明细 → diff-three-centers.md
- [x] A4：缓存机制（key 规则）与空数据 / 异常表现有说明 → interactions（修正原 README 失真：comprehensive useRefCache 已注释停用；info-hub getCacheValue 仅缓存配置）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（本任务即 design/ 变更，N/A 二次回写）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

## 变更记录（执行中偏离任务卡的部分）

- 用户验收中途反馈：混合式 data-model.md / interactions.md 改为按中心 × 主题组织。最终交付：README 薄层 + 三中心 × (presets / data-model / interactions) 共 9 份子文档 + diff-three-centers.md；原两份混合文档已删除。原「不做清单」中「不为三中心各写一份文档（差异并入本 README）」条目随用户决策作废。

---

## 审批记录

| 门槛       | 状态                   | 日期       | 批准人 |
| ---------- | ---------------------- | ---------- | ------ |
| ① 需求审批 | 已批准（用户指令执行） | 2026-10-08 | 用户   |
| ② 实现验收 | 通过（用户确认归档）   | 2026-10-08 | 用户   |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 同系列：`task-2026-10-08-003-detail-emap-gis-doc`、`task-2026-10-08-004-detail-react-echarts-doc`、`task-2026-10-08-005-detail-rc-echarts-map-doc`（005 的 builder 示例调研与本任务有交集，建议先做 005 或并行注意不重复）
