# Task · 2026-11-16-016-line-trend-chart

> task-010 派生任务 T5（line-trend-chart 物料新建）。承接 G5。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-016-line-trend-chart` |
| Status | 已完成 |
| 类型 | 编码（新建物料） |
| 影响范围 | `docs/materials/components/rc-echarts/line-trend-chart/`（新建）、`apps/playground/src/components/materials/registry.tsx` |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准）；开发 spec 已备：`apps/show-case/docs/specs/line-trend-chart-spec.md` |

---

## 目标（Goal）

新建纯折线趋势图物料（平滑折线 + 面积渐变），替换 ops-monitor 屏当前用 `bar3d-line` 降级占位的退服趋势分区。

## 不做清单

- 不做 3D / 混合形态（bar3d-line 已有）
- 完成后统一 `pnpm export:skill` 重导出

---

## 步骤（执行计划）

### 步骤 1：按 spec 新建物料四件套 + registry 注册

- **动作**：依 `apps/show-case/docs/specs/line-trend-chart-spec.md` 实现；分组 components/rc-echarts
- **等待用户**：否

### 步骤 2：show-case 退服趋势分区切换为该物料

- **动作**：替换 bar3d-line 占位，视觉对照 PM spec
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1 四件套齐全，manifest category 取词表值，runtime.type ↔ registry 一致（14 物料 / 14 键）
- [x] A2 平滑折线 + 面积渐变符合 spec
- [x] A3 show-case 退服趋势分区已切换且渲染正常（ops-monitor.schema.json retire-trend，双折线 + 面积渐变实测）
- [x] A4 根 `pnpm build` + `pnpm check:material-registry` + playground build 通过
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |
| 2026-11-16 | 步骤 1 完成：四件套 + registry 注册（14 物料 / 14 键）；根 build / check:material-registry / playground build 通过 | 实现步骤 1 | 否 |
| 2026-11-16 | 步骤 2 完成：show-case registry 注册 + ops-monitor.schema.json retire-trend 切换 line-trend-chart（series/items 契约，数据值不变）；show-case build + 浏览器渲染验证通过（双折线 + 面积渐变，无 3D 柱残留）；提交 f1c9b4f | 实现步骤 2 | 否 |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（批量建卡批准，执行「继续下一个task」） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T5 · G5）
> - 开发 spec：`apps/show-case/docs/specs/line-trend-chart-spec.md`
