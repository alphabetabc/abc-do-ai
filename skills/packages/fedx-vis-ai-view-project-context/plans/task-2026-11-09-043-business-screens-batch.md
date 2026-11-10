# Task · 2026-11-09-043-business-screens-batch

> Epic task-035 第 2 批 · 子卡批次 4/4「业务模块」。源项目：`oss-mtc-transition-ln/frontend/src/pages/visual/big-screen/personnel/`（data-overview）、`petition-comparison/`（map / channel 2 件）、`frontend/src/components/large-screen/retiree-total-card`。覆盖 db `module_survey` #41 / #63 / #65 / #82 四行 `queued`；#62 / #64 / #66 / #67 四行 2026-11-10 用户拍板 shelved（缩量做精品，见变更记录）。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-043-business-screens-batch` |
| Status | 待审批 |
| 类型 | feature |
| 影响范围 | `docs/materials/business/personnel-data-overview/`、`petition-comparison-map/`、`petition-comparison-channel/`、`retiree-total-card/`；本 epic 卡索引 |
| 验收标准 | 4 个物料四件套齐全 + `pnpm build` 通过 + `pnpm dev:preview` 渲染 console 无 error + db #41 / #63 / #65 / #82 落 distilled |
| 前置依赖 | 040 批次（ui-info-card、ui-time-display）+ 041 批次（echarts-* 图表与 ec-map）先行；066 retiree-total-card 完成后方可完成 059 personnel-data-overview |

## 目标

蒸馏大屏业务模块 4 件实质物料：人员概览区（地图下钻交互模型）、信访比对地图区（同套下钻模式）、信访比对渠道区（动态分组指标格）、复员军人总数卡（总览/下钻双视图），构成可组装的业务层物料。appeal / identity / rank / trend 四件薄壳模块（模板化轮询+图表拼装）不立物料。

## 逐模块清单

| # | 模块 | db | 源路径 | 产物路径 | 关键处理 |
| --- | --- | --- | --- | --- | --- |
| 1 | data-overview（人员） | #41 | `big-screen/personnel/data-overview` | `business/personnel-data-overview` | 剥 `use-polling` + `../store` + `@/utils/appBase`；`@/utils/mapDistrictFilter` 内联；info-card / ec-map / retiree-total-card 组合走 examples；单文件 419 行，实现期建议拆分「编排层 + 子视图」（同物料内相对 import）；核心价值：省→市下钻栈 / 双击返回 / 区县选中联动 / visualMap 密度着色交互模型 |
| 2 | map | #65 | `big-screen/petition-comparison/map` | `business/petition-comparison-map` | 剥 `use-polling` + `@/services/...` + `@/utils/empty` + `@/utils/appBase` + `../store`；info-card / ec-map 组合走 examples；`presets.ts` 的 `MAP_VISUAL_MAP` / `buildMapData` / `computeVisualMapMax` / `mapSeriesBuilder` 转为数据构造示例；5 文件结构（index / presets / components×2）保留在物料内；与 personnel-data-overview 同套下钻模式，但跨物料禁止 import，模式各自保留 |
| 3 | channel | #63 | `big-screen/petition-comparison/channel` | `business/petition-comparison-channel` | 剥 `use-polling` + `@/utils/empty` + `@/utils/appBase` + `../store`；`components/ChannelCard.tsx` 为物料内子组件（同物料内相对 import）；核心价值：`groupByPeriod` 动态分组 / 骨架屏 / 渐变文字指标格 |
| 4 | retiree-total-card | #82 | `frontend/src/components/large-screen/retiree-total-card` | `business/retiree-total-card` | 剥 `use-polling` + `@/services/visual-big-screen-personnel` + `@/utils/appBase`；总览 / 下钻双视图保留（overview-view / drill-view / sub-item-row / constants 同物料内相对 import）；`constants.ts` 的 `BACK_IMG` / `BG_TOTAL` / `BG_SUB` / `BG_SUB_FIRST` / `BG_MONTH` 贴图常量 → 占位图走 `_assets/` |

### shelved 明细（2026-11-10 用户拍板，db 已落库）

| 模块 | db | shelved 原因 |
| --- | --- | --- |
| appeal | #62 | 模板化薄壳（store 订阅→轮询→buildChartData→InfoCard+DataStatus+radar-chart 拼装，54+43 行），剥掉轮询/store 后仅剩 option 配置差异，独立物料价值低 |
| identity | #64 | 同上（58+35 行，与 appeal 模式 100% 同构） |
| rank | #66 | 同上（ver-bar-chart 拼装，仅 ECharts option 差异） |
| trend | #67 | 同上（echarts-for-react 拼装，仅 option 差异） |

> 4 件共用「联动轮询图表卡」模式，模式级价值已被 info-card（ui-widget-shell）+ 各 echarts 物料 + data-status 覆盖，examples 组合即可还原。

## 本批通用约定（2026-11-09 用户拍板）

- **分组与命名**：基础 UI → `components/ui/ui-*`；echarts 图表 → `components/rc-echarts/echarts-*`；大屏业务 → `business/*`
- **Props 化**：允许为可配置性新增 Props（配色 / 尺寸 / 位置 / 数据形态等），偏离 distill-workflow「不新增 Props」不变式，属用户批准的例外；新增项逐条记入 `spec.md`
- **图片**：源站贴图一律不搬运，占位图统一走 `docs/materials/_assets/` 共享目录
- **import**：跨物料引用一律别名 `@/materials/**`；同物料内相对路径

## 不做清单

- 不改源项目代码（只读勘察）
- 不搬运源站真实接口地址 / 密钥（数据一律 mock 化）
- 不跨物料 import（组合关系走 examples 演示）
- 零新 npm 依赖
- 不做 request / polling 层
- 不做 appeal / identity / rank / trend 四件薄壳模块（2026-11-10 用户拍板 shelved，原因见上表）
- 不做人员大屏 4 个占位编排件（db #42–#45 已 shelved，D 档）

## 变更记录

| 日期 | 变更 | 依据 |
| --- | --- | --- |
| 2026-11-10 | 批范围 8 件 → 4 件：保留 #41 / #63 / #65 / #82（实质物料），#62 / #64 / #66 / #67 shelved。勘察结论：4 件薄件模式 100% 同构（store 订阅→轮询→buildChartData→InfoCard+DataStatus+图表拼装），剥掉轮询/store 后仅剩 40–100 行 option 差异，独立物料价值低；4 件实件分别含地图下钻交互模型（×2）、动态分组指标格、下钻双视图等独立逻辑 | 用户 2026-11-10 拍板「缩量做精品」 |

## 步骤

1. 逐模块蒸馏四件套，先 retiree-total-card（personnel-data-overview 依赖其编排形态），再 personnel-data-overview，map / channel 独立推进
2. `pnpm build` + `pnpm dev:preview` 逐页验证，console 无 error
3. db 回填：#41 / #63 / #65 / #82 → `distilled` + matched_material + reason（matched_material 已于 2026-11-10 立项时预填物料目录名；`queued` 状态不受 sync-status 自动对账影响，需手工翻转）
4. epic 排队表 + `current-sprint.md` 索引更新 → 归档 `done/2026-11/`

## 验收 checklist

- [ ] A1：4 个业务物料四件套齐全，`manifest.json` 的 category 取自 AGENTS 词表
- [ ] A2：无 request / polling 层残留（grep 无 `use-polling` / `services/` 引用）
- [ ] A3：无跨物料 import（组合关系由 examples 呈现）
- [ ] A4：`pnpm build` 通过；`pnpm dev:preview` 渲染 console 无 error
- [ ] A5：db 四行落 `distilled` + reason；#62 / #64 / #66 / #67 保持 shelved + reason；新增 Props 逐条记入 `spec.md`

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |
| ② 实现验收 | 待验收 |  |  |

## 关联

> - Epic：./task-2026-11-06-035-big-screen-ln-distill.md
> - 上一批：[task-042 C 合并](./task-2026-11-09-042-petition-c-merge-batch.md)
