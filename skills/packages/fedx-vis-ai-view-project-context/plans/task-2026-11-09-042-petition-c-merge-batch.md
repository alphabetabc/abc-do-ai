# Task · 2026-11-09-042-petition-c-merge-batch

> Epic task-035 第 2 批 · 子卡批次 3/4「C 档合并 · petition 侧」。源项目：`oss-mtc-transition-ln/frontend/src/pages/visual/big-screen/petition/`。覆盖 db `module_survey` #46 / #47 / #50 三行 `queued`；#48 / #49 / #51 / #52 / #53 五行 2026-11-10 用户拍板 shelved（缩量做精品，见变更记录）。beijing-petition 侧 #54–#61 保持 shelved：#54 / #55 / #58 指向本批 3 个物料（C 档合并），#56 / #57 / #59 / #60 / #61 改指既有 echarts 物料。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-042-petition-c-merge-batch` |
| Status | 待审批 |
| 类型 | feature |
| 影响范围 | `docs/materials/business/petition-overview-indicator/`、`petition-channel-stat/`、`petition-map-overview/` 共 3 个物料；本 epic 卡索引 |
| 验收标准 | 3 个物料四件套齐全 + `pnpm build` 通过 + `pnpm dev:preview` 渲染 console 无 error + db #46 / #47 / #50 落 distilled |
| 前置依赖 | 040 批次（ui-info-card / ui-time-display）+ 041 批次（echarts-* 图表与 ec-map）先行 |

## 目标

蒸馏辽宁信访大屏 3 个实质物料：地图下钻总览区（下钻栈 / 选中联动全套交互）、指标卡（骨架屏 + 定制视觉规格）、渠道分组卡（双层分组布局），并作为 C 档合并载体承载 beijing 侧同构模块的差异（差异走 Props / examples）。identity-type / petition-demands / petition-region-bar / petition-trend / region-map 五件薄壳模块不立物料。

## 逐模块清单

| # | 模块 | db | 源路径 | 产物路径 | 关键处理 |
| --- | --- | --- | --- | --- | --- |
| 1 | overview-indicator | #46 | `petition/beijing-summary/overview-indicator` | `business/petition-overview-indicator` | 剥 `use-polling`；JTWX+JTLF+JTLX 派生求和转纯函数 + examples mock；`assets/gaiyao-bg.png` → 占位图走 `_assets/`；核心价值：骨架屏 + 195×59 定制指标卡 + 三栏 flex 布局；承载 beijing 侧 #54（相似度 0.98，差异走 Props） |
| 2 | channel-stat | #47 | `petition/channel-stat` | `business/petition-channel-stat` | 剥 `use-polling` + `@/services/visual-big-screen-petition` + `../store`；核心价值：「昨天/累计」× 3 渠道双层分组背景图卡片布局；2 张贴图 → 占位图；承载 beijing 侧 #55（1.0） |
| 3 | petition-map-overview | #50 | `petition/petition-map-overview` | `business/petition-map-overview` | 剥 `use-polling` + `../store` + `@/utils/appBase`；`@/utils/mapDistrictFilter` 内联进物料（区域字典随数据入参）；核心价值：下钻栈（DrillFrame）/ 单击选中 / 双击下钻 / 两段式返回 / selectedDistrict 覆盖式选中 / dispatchAction 高亮联动；ec-map 组合走 examples；承载 beijing 侧 #58（1.0） |

### shelved 明细（2026-11-10 用户拍板，db 已落库）

| 模块 | db | shelved 原因 |
| --- | --- | --- |
| identity-type | #48 | 薄壳：订阅 + buildChartData → VerBarChart 堆叠柱纯拼装（93 行），echarts-ver-bar + ui-widget-shell examples 组合可还原 |
| petition-demands | #49 | 薄壳：PieChart 一把梭（69 行），echarts-pie 物料已覆盖 |
| petition-region-bar | #51 | 联动消费端逻辑有限（district 过滤 + 排名，157 行），本质为 echarts-ver-bar + 过滤函数，下沉 examples 可还原 |
| petition-trend | #52 | 薄壳：echarts option + 渐变面积（166 行），echarts 物料 examples 可还原 |
| region-map | #53 | 源仅 9 行 re-export petition-region-bar；随 #51 一并 shelved（原「并入 region-bar」方案作废） |

> beijing 侧对应行同步调整：#56 / #57 / #59 / #60 / #61 的 reason 改指既有 echarts 物料（不再指向已 shelved 的 petition 侧同名模块）；#54 / #55 / #58 仍指向本批 3 个物料（C 档合并不变）。

## 本批通用约定（2026-11-09 用户拍板）

- **分组与命名**：基础 UI → `components/ui/ui-*`；echarts 图表 → `components/rc-echarts/echarts-*`；大屏业务 → `business/*`
- **Props 化**：允许为可配置性新增 Props（配色 / 尺寸 / 位置 / 数据形态等），偏离 distill-workflow「不新增 Props」不变式，属用户批准的例外；新增项逐条记入 `spec.md`
- **图片**：源站贴图一律不搬运，占位图统一走 `docs/materials/_assets/` 共享目录
- **import**：跨物料引用一律别名 `@/materials/**`；同物料内相对路径

## 不做清单

- 不改源项目代码（只读勘察）
- 不搬运源站真实接口地址 / 密钥（数据一律 mock 化）
- 不跨物料 import（info-card / data-status / 图表件组合一律走 examples 演示）
- 零新 npm 依赖
- 不做 request / polling 层
- 不做 identity-type / petition-demands / petition-region-bar / petition-trend / region-map 五件薄壳模块（2026-11-10 用户拍板 shelved，原因见上表）
- 不新建 beijing 侧同名物料（C 档合并，差异走 Props / examples）

## 变更记录

| 日期 | 变更 | 依据 |
| --- | --- | --- |
| 2026-11-10 | 批范围 8 件 → 3 件：保留 #46 / #47 / #50（实质物料），#48 / #49 / #51 / #52 / #53 shelved（原 region-map 并入 region-bar 方案随 #51 一并作废）。勘察结论：5 件薄件剥掉轮询/store 后仅剩 ECharts option 配置与简单拼装，echarts-ver-bar / echarts-pie / echarts-map 物料 + examples 组合即可还原；3 件实件分别含地图下钻全套交互、骨架屏指标卡、双层分组卡片布局。与 task-043 缩量决策同一口径 | 用户 2026-11-10 拍板「缩量做精品」 |

## 步骤

1. 逐模块蒸馏四件套（manifest / spec / data-model / code / examples），每个 examples 提供 mock 数据与状态占位
2. `pnpm build` + `pnpm dev:preview` 逐页验证，console 无 error
3. db 回填：#46 / #47 / #50 → `distilled` + matched_material + reason（matched_material 已于 2026-11-10 立项时预填物料目录名；`queued` 状态不受 sync-status 自动对账影响，需手工翻转）
4. epic 排队表 + `current-sprint.md` 索引更新 → 归档 `done/2026-11/`

## 验收 checklist

- [ ] A1：3 个业务物料四件套齐全，`manifest.json` 的 category 取自 AGENTS 词表
- [ ] A2：无 request / polling 层残留（grep 无 `use-polling` / `services/` 引用）
- [ ] A3：无跨物料 import（组合关系由 examples 呈现）
- [ ] A4：`pnpm build` 通过；`pnpm dev:preview` 渲染 console 无 error
- [ ] A5：db 三行落 `distilled` + reason；#48 / #49 / #51 / #52 / #53 及 beijing 侧 #54–#61 保持 shelved + reason；新增 Props 逐条记入 `spec.md`

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |
| ② 实现验收 | 待验收 |  |  |

## 关联

> - Epic：./task-2026-11-06-035-big-screen-ln-distill.md
> - 上一批：[task-041 图表基建](./task-2026-11-09-041-chart-basics-batch.md)
> - 下一批：[task-043 业务模块](./task-2026-11-09-043-business-screens-batch.md)
