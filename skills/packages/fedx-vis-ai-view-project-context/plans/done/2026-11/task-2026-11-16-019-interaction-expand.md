# Task · 2026-11-16-019-interaction-expand

> task-010 派生任务 T9（分区间联动扩展）。承接 G19（首例已打通：ops-monitor 地图选区 → 退服占比）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-019-interaction-expand` |
| Status | 已完成 |
| 类型 | 编码 + docs |
| 影响范围 | `apps/show-case/`（ops-monitor schema / 宿主物料）、`docs/workflows/schema-mode.md`（联动契约沉淀）、物料 spec（联动 prop 契约） |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准） |

---

## 目标（Goal）

在首例链路（地图 onClick dispatch `selectedRegion` → 订阅分区注入 props）基础上：

1. 约定取消选中 / 默认态行为（初始选中、未选中时订阅分区展示全量还是空）
2. 扩展更多订阅分区（概要卡 / 区域分布等）
3. 评估 `echarts-pie-region` 回流（schema 联动契约沉淀进物料 spec）

## 不做清单

- 不改渲染器联动机制本身（已核验可用）
- 不做多级联动 / 跨屏联动
- 完成后统一 `pnpm export:skill` 重导出

---

## 步骤（执行计划）

### 步骤 1：边界行为约定（等待用户确认）

- **动作**：定义取消选中行为与默认态（建议：再点同区域取消 → 订阅分区回全量；初始无选中=全量），写入本卡
- **等待用户**：是（约定确认）

### 步骤 2：扩展订阅分区 + echarts-pie-region 回流评估 + schema-mode.md 契约沉淀

- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1 取消选中 / 默认态行为已约定并实测（渲染器 `events[].toggle: true`：再点同值派发 null；订阅方 null = 全量；初始 default null = 全量。实测：点地图区域 → 4 个订阅分区派生变化，再点同区域 → 全部回全量）
- [x] A2 新增 3 个订阅分区打通：概要卡（center-ind-cards-region）/ 区域分布（echarts-ver-bar-region）/ 退服趋势（line-trend-chart-region），均按 echarts-pie-region 包装模式实现
- [x] A3 schema-mode.md 含联动契约专节（interactions / events / subscribe 写法 + toggle 语义 + 订阅物料 props 契约约定）
- [x] A4 echarts-pie-region 回流评估结论：**暂缓回流**——region 包装属宿主编排逻辑（按 region 派生数据是业务行为，真实场景由宿主拉数），物料站物料不应内置派生规则；待出现通用「联动包装」物料形态需求（多项目复用验证）再回流，联动 prop 契约（`selectedRegion?: string | null`，null=全量）已沉淀进 schema-mode.md 联动契约节
- [x] A5 show-case `pnpm dev` 全联动链路实测正常（地图选区 → 概要卡/饼图/柱图/折线 4 分区联动 + toggle 取消回全量，console 无错）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（build:renderer / check:renderer-isolation / check:material-registry / check:skeleton-mirror / 根 build / playground build / export:skill）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |
| 2026-11-16 | 门槛①批准 + 边界约定确认（再点同区域取消→回全量；初始无选中=全量）；实现完成：渲染器 toggle 支持（types.ts / section-item.tsx / store.getFieldValue）+ 3 个 region 包装物料 + schema 切换 + schema-mode.md 联动契约节 + export:skill 重导出；全链路实测通过 | 用户审批 + 执行 | 否 |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户 |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T9 · G19）
> - 现场：`apps/show-case/`（首例已打通）
