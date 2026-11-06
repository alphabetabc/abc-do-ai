# Task · 2026-11-06-036-interaction-store-distill

> Epic task-035 第 1 批子卡（基建优先）。源：`oss-mtc-transition-ln/frontend/src/components/large-screen/interaction-store`（survey id #77，B 档 queued）。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-036-interaction-store-distill` |
| Status | 待审批 |
| 类型 | feature |
| 影响范围 | `docs/materials/components/ui/interaction-store/`（或定稿分组位）、本 epic 卡索引 |
| 验收标准 | 四件套齐全 + pnpm build 通过 + dev:preview 渲染/console 无 error |

## 目标

把 interaction-store（zustand 联动 runtime）蒸馏为物料站四件套，作为大屏基建底座之一。

- 源码：1 文件（zustand create store + 联动事件），survey 画像见 db `module_profile` #77
- **zustand 放行**（Q2 拍板）：物料站直接引入 zustand 为直接依赖，届时由**用户安装**（`pnpm add zustand`），不做内联改写
- 源依赖剥离：无请求层；`@/services` 类 import 若存在则剥离
- category 建议：`form` 不合适 → 预计 `layout`（联动容器基建），立卡后按 AGENTS 分类词表定稿

## 不做清单

- 不改源项目代码（只读）
- 不引入 zustand 以外的任何新依赖

## 步骤

1. 用户安装 zustand → 2. 蒸馏四件套（含跨模块联动 example）→ 3. pnpm build + dev:preview 验证 → 4. db 终态回填（`queued → distilled`）+ 索引更新 + 归档

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |
| ② 实现验收 | 待验收 |  |  |
