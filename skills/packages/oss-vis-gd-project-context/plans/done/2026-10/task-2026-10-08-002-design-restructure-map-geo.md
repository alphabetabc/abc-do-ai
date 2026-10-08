# Task · 2026-10-08-002-design-restructure-map-geo

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-002-design-restructure-map-geo` |
| Status | 已完成 |
| 类型 | skill（docs 结构调整，无代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下：`design/components/`（新建）、`design/modules/`（重组）、`SKILL.md`、`design/README.md` |
| Roadmap | skill 结构治理延续（同 handoff-2026-10-08 系列） |
| 验收标准 | design/ 分层与代码实际层次（组件层/业务层）一致，索引无死链 |
| 前置依赖 | 无（调研结论已在对话中确认） |

---

## 目标（Goal）

design/ 下区分「组件层」与「业务层」文档：`web/components/` 可复用组件用法归 `design/components/`，`web/pages/` 业务模块实现归 `design/modules/<业务模块>/`。map-geo 三中心拷贝在 `five-major-center/map-geo/README.md` 一份文档内说清共同架构与三份差异。

---

## 步骤（执行计划）

### 步骤 1：建 components/ 层

- **动作**：新建 `design/components/001-emap-gis/README.md`（迁现 modules/003-map-widget）、`design/components/002-react-echarts/README.md`（迁现 modules/002-react-echarts）
- **输出**：两个组件用法文档（内容照迁，标题编号更新，003 溯源句删除）
- **等待用户**：否

### 步骤 2：重组 modules/ 为业务模块粒度

- **动作**：新建 `design/modules/five-major-center/README.md`（模块总览：三中心、share/box 复用、路由）+ `design/modules/five-major-center/map-geo/README.md`（MapGeo：共同架构 + 三中心差异表 + cmd 份未接线事实 + 维护准则，基于现 001-map-geo 内容重写）
- **输出**：two files under five-major-center/
- **等待用户**：否

### 步骤 3：清理与索引更新

- **动作**：删旧 `modules/001-map-geo`、`002-react-echarts`、`003-map-widget`；更新 SKILL.md 场景表 + Pointer Map；design/README.md 补 components/ 目录规则；grep 残留引用
- **输出**：索引一致、无死链
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不为 information-hub-center / cmd-dispatcher-center 各建独立 map-geo 文档（差异并入 five-major-center/map-geo.md 一份）
- ~~不新建 `components/003-rc-echarts-map`~~（2026-10-08 用户验收时要求补上，已建）
- 不动 `.trae/agents/` 下两个 agent 定义（子代理调度文件）
- 不改任何 `web/` 业务代码

---

## 背景与动机

调研确认（search agent 已验证）：map-geo 是 ECharts 系（`web/components/ui/rc-echarts/map` 的 `EChartsMap`），与 fedx-gis（emap-gis）无关；三个中心各有 map-geo 平行拷贝互不引用，cmd 份未接线。现 modules/ 混装「组件用法」（react-echarts、map-widget）与「业务实现」（map-geo），层次不清。

---

## 验收 checklist

- [x] A1：`design/components/` 只放 `web/components/` 组件用法文档，`design/modules/` 只放 `web/pages/` 业务模块文档
- [x] A2：five-major-center/map-geo/README.md 覆盖三中心差异（comprehensive / information-hub / cmd-dispatcher 接线状态）且注明 cmd 份未接线
- [x] A3：SKILL.md 场景表与 Pointer Map 更新，全 skill grep 无死链（旧编号 modules/001-map-geo、002、003 无残留引用）
- [x] A4：design/README.md 写明 components/ 与 modules/ 的目录规则（组件层 vs 业务层判据）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（本任务即 design/ 变更，N/A 二次回写）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-08 | user（「开始执行这个 task」） |
| ② 实现验收 | 已通过 | 2026-10-08 | user（「如果这个完成了，请归档」） |
