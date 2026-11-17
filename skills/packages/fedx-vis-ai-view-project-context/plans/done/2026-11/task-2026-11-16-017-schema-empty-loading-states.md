# Task · 2026-11-16-017-schema-empty-loading-states

> task-010 派生任务 T6（空态/加载态 schema 级约定）。承接 G14。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-017-schema-empty-loading-states` |
| Status | 已完成 |
| 类型 | docs + 编码（渲染器约定） |
| 影响范围 | `docs/workflows/schema-mode.md`、必要时 `packages/screen-renderer/` |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准）；建议在 T3（task-014 data.url）之后执行，空态主要由远端拉数触发 |

---

## 目标（Goal）

约定 schema 级「空态/加载态」表现（PM spec §6 要求不白屏），替代目前各物料自行处理。产出：schema-mode.md 约定条款 + （若需）渲染器统一兜底。

## 不做清单

- 不做骨架屏等重形态（约定轻量兜底即可）
- 完成后统一 `pnpm export:skill` 重导出

---

## 步骤（执行计划）

### 步骤 1：约定设计（等待用户确认）

- **动作**：定义 section/widget 级 loading / empty / error 三态的 schema 字段与默认表现，写入本卡
- **等待用户**：是（约定确认）

### 步骤 2：落地文档 + 兜底实现（若需）+ 验证

- **等待用户**：是（硬门槛②）

---

## 技术设计（2026-11-16 定稿）

- **三态定义**：loading（url 请求在途，已有）→ empty（请求成功但 `pick` 未命中，结果 null/undefined）→ error（失败，已有）；三态均为渲染器默认兜底，无 schema 开关字段（保持 schema 精简，物料不重复处理请求态）
- **空态边界**：空数组/空对象**不算**空态，仍下发物料——空数据展示归物料（dataContract 各自设计）；inline / 纯 props section 不触发三态
- **实现**：use-section-data 增加 `empty` state → section-item 透传 → SectionFrame 新增 `empty` prop 渲染 `[id] 暂无数据` 占位（灰字，与 loading 同款、非 error 红字）

## 验收 checklist

- [x] A1 schema-mode.md 含三态约定（触发条件表格 + 默认表现 + 边界说明：空数组/inline/props 不触发）
- [x] A2 与 T3 的 data.url 失败态约定一致（合并在同一「三态约定」节，无冲突引用）
- [x] A3 若改渲染器：build:renderer + check:renderer-isolation 通过（playground build 亦通过）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过
- [x] 实测：playground 临时改 gauge pick 为不存在的路径，渲染 `[gauge] 暂无数据` 灰字占位（mock 200、console 无错），测后已还原 schema

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（批量建卡批准，执行「继续下一个task」） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T6 · G14）
