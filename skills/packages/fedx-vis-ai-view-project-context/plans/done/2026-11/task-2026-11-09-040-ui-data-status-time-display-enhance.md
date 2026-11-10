# Task · 2026-11-09-040-ui-data-status-time-display-enhance

> Epic task-035 第 2 批 · 子卡批次 1/4「基建剩余」。源项目：`oss-mtc-transition-ln/frontend/src/components/large-screen/`（data-status / time-display）。覆盖 db `module_survey` #71 / #84 两行 `queued`；background（#68）/ fullscreen-button（#69）/ header（#70）经用户 2026-11-09 拍板 D 档搁置（reason 已落库）。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-040-ui-data-status-time-display-enhance` |
| Status | 已完成 |
| 类型 | feature |
| 影响范围 | `components/ui/ui-data-status/`、`ui-time-display/`（既有物料增强）；本 epic 卡索引 |
| 验收标准 | 2 个增强物料补齐目标能力且既有 API 未破坏 + `pnpm build` 通过 + `pnpm dev:preview` 渲染 console 无 error + db #71/#84 落 distilled |
| 前置依赖 | 036 interaction-store / 037 scaler-container 已归档 |

## 目标

增强既有物料 2 件（数据状态层、时间显示），完成大屏基建收尾。

## 逐模块清单

| # | 模块 | db | 源路径 | 产物路径 | 关键处理 |
| --- | --- | --- | --- | --- | --- |
| 1 | data-status | #71 | `frontend/src/components/large-screen/data-status` | `components/ui/ui-data-status`（既有物料，增强） | 按 2026-11-06 拍板补 error 态 + loading 保占位；`antd` 已有；`cropper.css`（310 行）与状态层相关性实现期评估后决定是否纳入 |
| 2 | time-display | #84 | `frontend/src/components/large-screen/time-display` | `components/ui/ui-time-display`（既有物料，增强） | 按 2026-11-06 拍板补 `mode`（date / time）+ 日期格式定制；`dayjs`（物料站未装）→ 优先 Intl 零依赖实现，需自定义 token 时回用户申请引入；icon.png → 占位图 |

> 搁置记录（2026-11-09 用户拍板，db reason 已落库）：background（#68）——主体为单张背景贴图（纯图片无逻辑），唯一可复用点为 55 行 CSS mask 流光动画，价值单薄；fullscreen-button（#69）——全屏能力已由 scaler-container portal 全屏覆盖；header（#70）——与源项目强耦合（固定导航项 / 大标题文案 / 菜单贴图 / 路由状态），通用部分由 ui-time-display 承载。

## 本批通用约定（2026-11-09 用户拍板）

- **分组与命名**：基础 UI → `components/ui/ui-*`；echarts 图表 → `components/rc-echarts/echarts-*`；大屏业务 → `business/*`
- **Props 化**：允许为可配置性新增 Props（配色 / 尺寸 / 位置 / 数据形态等），偏离 distill-workflow「不新增 Props」不变式，属用户批准的例外；新增项逐条记入 `spec.md`
- **图片**：源站贴图一律不搬运，占位图统一走 `docs/materials/_assets/` 共享目录
- **import**：跨物料引用一律别名 `@/materials/**`；同物料内相对路径

## 不做清单

- 不改源项目代码（只读勘察）
- 不搬运源站真实接口地址 / 密钥（数据一律 mock 化）
- 不跨物料 import
- 零新 npm 依赖（`dayjs` 走等价替换）
- 本批不做 request / polling 层
- background / fullscreen-button / header 不蒸馏（用户 2026-11-09 拍板搁置，db #68 / #69 / #70 已落终态）

## 步骤

1. 逐模块增强（spec / data-model / code / examples 同步更新既有物料）；time-display 的 examples 覆盖 date / time 两模式
2. `pnpm build` + `pnpm dev:preview` 逐页验证（三态状态层、两种时间模式），console 无 error
3. db 回填：#71 / #84 → `distilled`（matched_material 保持既有 ui-data-status / ui-time-display）
4. epic 排队表 + `current-sprint.md` 索引更新 → 归档 `done/2026-11/`

## 验收 checklist

- [x] A1：2 个增强物料 spec / data-model / code / examples 同步更新，既有 API 未破坏（DataStatus 既有 props 全保留；TimeDisplay legacy 分隔符路径完整保留，新格式化路径由新 props 触发）
- [x] A2：`pnpm build` 通过；`pnpm dev:preview` + 浏览器实测（DataStatus 四态切换、TimeDisplay basic/modes 两示例）渲染正确，console 无 error（仅 React DevTools info 提示）
- [x] A3：db #71 / #84 落 `distilled` + reason（decided_by task-2026-11-09-040；本项目剩余 queued 22 行属批次 041–043，epic 收口时终态断言）
- [x] A4：新增 Props 逐条记入对应 `spec.md`（DataStatus：error / errorDescription；TimeDisplay：mode / dateFormat / timeFormat / intervalMs / showIcon / icon）

## 实现记录（2026-11-09）

- **data-status**：状态推导改为 loading → error → empty → success（与源 index.tsx 判定顺序一致）；loading 态 children 半透明（0.35）+ 禁交互保占位 + 覆盖转圈（antd Spin 等价）；error 态红色「!」圆形描边 + 文案（antd Empty 等价）。`cropper.css` 评估结论：为裁剪示例样式，与状态层无相关性，不纳入。
- **time-display**：dayjs 格式串 → 零依赖 token 替换（仅 YYYY/MM/DD/HH/mm/ss 六 token）；新增格式化渲染路径（mode/dateFormat/timeFormat/showIcon/icon 任一传入触发），legacy 分隔符路径原样保留；icon.png → `docs/materials/_assets/placeholder-icon.svg`（共享占位图，本批首个使用）。
- **验证**：`pnpm build` 通过（41.97s）；dev:preview 浏览器实测两物料全部示例/状态 PASS、console 无 error。

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 通过 | 2026-11-09 | 用户（会话指令「执行这个task」） |
| ② 实现验收 | 通过 | 2026-11-09 | 用户（收官验收，checklist 全勾） |

## 关联

> - Epic：../../task-2026-11-06-035-big-screen-ln-distill.md
> - 下一批：[task-041 图表基建](../task-2026-11-09-041-chart-basics-batch.md)
