# Task · 2026-11-06-037-scaler-container-distill

> Epic task-035 第 1 批子卡（基建优先）。源：`oss-mtc-transition-ln/frontend/src/components/large-screen/scaler-container`（survey id #83，B 档 queued）。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-037-scaler-container-distill` |
| Status | 待审批 |
| 类型 | feature |
| 影响范围 | `docs/materials/components/ui/scaler-container/`、本 epic 卡索引 |
| 验收标准 | 四件套齐全 + pnpm build 通过 + dev:preview 渲染（等比缩放 + portal 全屏）console 无 error |

## 目标

把 scaler-container（设计稿等比缩放容器 + portal 全屏）蒸馏为物料站四件套，大屏基建底座之二。

- 源码：4 文件，纯 react（survey 画像见 db `module_profile` #83）
- 若依赖 `@/` 业务模块（如 store）：联动状态 Props 化，与 interaction-store 的组合关系走 example 演示（不跨物料 import）
- category：`layout`（AGENTS 词表）

## 不做清单

- 不改源项目代码（只读）
- 零新 npm 依赖

## 步骤

1. 蒸馏四件套（含全屏/缩放 example）→ 2. pnpm build + dev:preview 验证 → 3. db 终态回填（`queued → distilled`）+ 索引更新 + 归档

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |
| ② 实现验收 | 待验收 |  |  |
