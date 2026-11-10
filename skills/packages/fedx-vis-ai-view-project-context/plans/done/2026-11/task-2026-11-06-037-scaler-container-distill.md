# Task · 2026-11-06-037-scaler-container-distill

> Epic task-035 第 1 批子卡（基建优先）。源：`oss-mtc-transition-ln/frontend/src/components/large-screen/scaler-container`（survey id #83，B 档 queued）。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-037-scaler-container-distill` |
| Status | 已完成（待验收） |
| 类型 | feature |
| 影响范围 | `docs/materials/components/scaler-container/`、本 epic 卡索引 |
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
| ① 需求审批 | 已批准 | 2026-11-09 | 用户（执行指令 + 产物路径拍板：平铺 `components/` 下） |
| ② 实现验收 | 待验收 |  |  |

## 实现记录（2026-11-09）

- 四件套产出 `docs/materials/components/scaler-container/`：
  - `code/`：index.tsx + context.ts + overlay-context.ts + utils.ts 四文件逻辑等价迁移（缩进 4→2 空格对齐仓库规范；源码无业务依赖，零剥离项、零新 npm 依赖）
  - `examples/basic-scale.tsx`（等比缩放 + useScaler 读数）、`scale-modes.tsx`（四模式溢出行为对照）、`fullscreen.tsx`（portal 全屏开关 + useOverlayRoot 浮层）
  - spec.md / data-model.md 按模板齐全；category 定稿 `layout`（词表内）
- 验证：`pnpm build`（tsc -b + vite）通过；dev:preview 浏览器验证 PASS（三 example 渲染、全屏 portal 铺满视口且退出闭环、overlay 浮层可见、console 无 error）。
- db 回填：`module_survey` #83 `queued → distilled`（matched_material=scaler-container，reason 落库）。
- 与 interaction-store 组合关系：走 example 演示原则，未跨物料 import（本卡 examples 未引入 store，组合场景留给后续业务模块子卡）。
- 归档：待硬门槛②用户验收后移 done/2026-11/。
