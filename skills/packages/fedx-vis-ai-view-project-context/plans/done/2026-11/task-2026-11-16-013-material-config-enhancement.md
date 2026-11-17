# Task · 2026-11-16-013-material-config-enhancement

> task-010 派生任务 T2（物料可配置性增强）。承接 G6 / G7 / G8 / G9 / G10 / G11。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-013-material-config-enhancement` |
| Status | 已完成 |
| 类型 | 编码（物料增强） |
| 影响范围 | `docs/materials/components/rc-echarts/`（echarts-pie / echarts-ver-bar 等）、`docs/materials/business/`（petition-comparison-channel / indicator-view 所在分组）、对应 spec.md / data-model.md |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准）；与 T1（task-012）回流物料无冲突（不同模块） |

---

## 目标（Goal）

增强既有物料可配置性，消除 show-case 实战中暴露的「宿主必须 hack 才能用」问题：

- G6 `indicator-view`：补 `cellBgUrl` / `style` 透传 props
- G7 `echarts-pie`：容器内建底与外轮廓可经 props 关干净（无需宿主 CSS 覆盖）
- G8 `petition-comparison-channel`：副指标行（进京/本地）加开关 props
- G9 物料容器支持「撑满父容器」模式（替代内联定宽高 + `!important` hack）
- G10 饼图等按 props 宽高算几何的物料，支持容器自适应（消除两套尺寸打架）
- G11 `echarts-ver-bar` Y 轴刻度整化

## 不做清单

- 不实现 G12 data.url（T3 另卡）
- 不动 WidgetShell 主题（G13 → T4 另卡）
- 完成后统一 `pnpm export:skill` 重导出（task-010 步骤 2 收尾统一执行）

---

## 步骤（执行计划）

### 步骤 1：逐物料增强 + spec/data-model 同步回填

- **动作**：按 G6–G11 逐项改 code/ + 更新对应 spec.md Props 表
- **输出**：6 项增强落地，文档同步
- **等待用户**：否

### 步骤 2：验证

- **动作**：根 `pnpm build` + playground `pnpm build` + playground 内 `pnpm check:materials`
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1 G6 indicator-view 有 cellBgUrl / style props 且示例可演示（examples/cell-bg.tsx）
- [x] A2 G7 echarts-pie 不写宿主 CSS 即可关掉容器底与外轮廓
- [x] A3 G8 副指标行可控开关（showBreakdown，examples/no-breakdown.tsx）；G11 Y 轴刻度整化（echarts-ver-bar 去掉强制 interval，spec §6.5 / data-model 已同步）
- [x] A4 G9/G10 至少一个物料支持撑满父容器模式（建议 echarts-pie），不再需要双类 `!important` hack
- [x] A5 各物料 spec.md Props 表已同步新 props
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（根 build / playground build；check:materials 5 文件为存量问题，非本卡引入）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |
| 2026-11-16 | G6–G11 全部落地（含 spec/data-model 同步 + 3 个新示例）；根 `pnpm build` / playground `pnpm build` 通过；`check:materials` 5 文件改写为存量问题（stash 基线复现，非本卡引入） | 实现完成 | 否 |
| 2026-11-16 | 验收 checklist 补勾（实现已实证：cellBgUrl/showBreakdown/刻度整化均落地）；审批记录①②回填 | 文档回填（current-sprint 已记录用户验收通过） | 否 |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（批量建卡批准，执行「继续下一个task」） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T2 · G6–G11）
