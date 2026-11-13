# Task · 2026-11-13-011-show-case-cleanup

> show-case 首屏（ops-monitor 运营监控大屏，Schema 模式）实战验证后暴露的四个工程卫生问题，集中修复。
> 问题来源：task-2026-11-13-010 审阅过程中发现，用户拍板「四个问题修复单独建卡」。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-011-show-case-cleanup` |
| Status | 待审批 |
| 类型 | 编码（show-case 工程卫生清理） |
| 影响范围 | `apps/show-case/public/mock/ops-monitor/`（7 份 JSON）、`apps/show-case/src/screens/home/`、`apps/show-case/src/components/materials/_assets/_assets/`、task-010 卡验收标准 |
| Roadmap | 阶段 5 · 闭环验证与迭代优化（验证反馈回填） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（问题来源卡） |

---

## 目标（Goal）

清理 show-case 中四处死资产 / 死代码 / 事故目录，并把 task-010 的验收标准改写为可独立判定的 checklist，使仓库不留「看起来有用实际未接线」的内容。

---

## 不做清单

- 不做 mock 数据接线（data.url 是否由渲染器实现是 task-010 登记的派生任务，属 schema-mode 能力缺口，不在本卡处理）
- 不处理物料回流 / 可配置性增强（task-010 派生任务）
- 不改 `dist-skill/large-screen-builder/` 内任何文件（skill 只读）

---

## 问题清单（四个）

| # | 问题 | 现状位置 | 事实依据 | 拟处置 |
| --- | --- | --- | --- | --- |
| 1 | mock 死资产 | `apps/show-case/public/mock/ops-monitor/` 7 份 JSON（trend/ratio/summary/map-points/region-bar/resource-stack/fault-compare） | 渲染器不支持 data.url（IIFE bundle 内无 url 拉取逻辑），schema 数据全部内嵌 props，7 份 mock 从未被请求 | **删除**（数据已内嵌 schema，mock 无消费方）；若 data.url 后续实现再按需重建 |
| 2 | home 屏死代码 | `apps/show-case/src/screens/home/index.tsx` | 引用不存在的 `/schemas/home.schema.json`，未挂路由（骨架遗留演示屏） | **删除**目录（骨架自带的演示占位；真实屏 ops-monitor 已就位） |
| 3 | `_assets/_assets/` 嵌套目录 | `apps/show-case/src/components/materials/_assets/_assets/` | 嵌套拷贝事故：16 个 SVG 与上层 `_assets/` 重复 | **删除**嵌套层，保留上层正本；确认无代码引用嵌套路径后执行 |
| 4 | task-010 验收标准偏软 + backlog 悬空 | task-010 卡「验收标准 = 三份清单可直接作为 checklist 使用」；「关联」引用 echarts-ver-bar Y 轴刻度整化未入正文清单 | 「可直接作为 checklist」不可独立判定；关联区有悬空引用 | 改写为可勾选 checklist；将 backlog 项正式登记进 task-010 派生任务清单或 plans/backlog.md |

---

## 步骤（执行计划）

### 步骤 1：问题 1——删除 mock 死资产

- **动作**：确认 7 份 JSON 无代码/配置引用（grep mock/ops-monitor）→ 删除目录
- **输出**：`public/mock/` 下无 ops-monitor 目录
- **等待用户**：否（硬门槛①通过后）

### 步骤 2：问题 2——删除 home 死代码

- **动作**：确认 `screens/home/` 无 import 引用 → 删除目录
- **输出**：`src/screens/` 下仅剩 ops-monitor
- **等待用户**：否

### 步骤 3：问题 3——清理 `_assets/_assets/` 嵌套目录

- **动作**：grep 确认无 `_assets/_assets` 引用 → 删除嵌套层；抽查上层 `_assets/` 与嵌套层文件一致（均为同名 SVG）
- **输出**：单层 `_assets/`
- **等待用户**：否

### 步骤 4：问题 4——修正 task-010 验收标准与 backlog 登记

- **动作**：task-010「验收标准」改写为可勾选 checklist；echarts-ver-bar Y 轴刻度整化从「关联」区移入派生任务清单（或 backlog.md 正式登记）
- **输出**：task-010 卡更新，变更记录补条目
- **等待用户**：否

### 步骤 5：验证与归档

- **动作**：`pnpm dev`（apps/show-case）确认 ops-monitor 屏正常渲染、无 404；grep 确认无残留引用
- **输出**：验收 checklist 全勾 → 归档
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [ ] A1 `apps/show-case/public/mock/` 下不存在 ops-monitor 目录，且 grep `mock/ops-monitor` 在 apps/show-case 内零命中
- [ ] A2 `apps/show-case/src/screens/` 下不存在 home 目录，且 grep `screens/home` 在 apps/show-case 内零命中
- [ ] A3 `apps/show-case/src/components/materials/_assets/` 下不存在二级 `_assets`，且 grep `_assets/_assets` 零命中
- [ ] A4 task-010「验收标准」为可勾选 checklist；echarts-ver-bar Y 轴刻度整化已入 task-010 派生任务清单或 backlog.md
- [ ] A5 `apps/show-case` `pnpm dev` 打开 `/#/ops-monitor` 大屏正常渲染（8 分区齐全），DevTools Network 无 404
- [ ] `env/AGENTS.md` 声明的质量门槛命令已通过（无则 N/A）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-13 | 初稿 | task-010 审阅发现四问题，用户指示单独建卡 | — |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |
| ② 实现验收 | 待验收 |  |  |

---

## 关联

> - 问题来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`
> - 现场：`apps/show-case/`
