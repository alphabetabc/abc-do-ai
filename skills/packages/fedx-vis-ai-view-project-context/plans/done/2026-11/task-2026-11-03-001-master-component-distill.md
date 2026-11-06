# Task · 2026-11-03-001-master-component-distill

> 总任务（epic）：从 `oss-visual-gd-emergency-support` 的 `web/components` 与 `web/pages` 沉淀组件物料到本仓 `docs/materials/`。
> **本卡范围（2026-11-03 用户确认）**：只做**组件台账**的建立与冻结；逐组件蒸馏不在本卡内，由用户与同事按台账认领、另建子任务卡执行。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-001-master-component-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `plans/inventory-gd-emergency-support.md`（新增台账）、本文件、`current-sprint.md`、`roadmap.md` |
| Roadmap | 阶段 2（盘点与冻结）为主；阶段 3/4 仅在台账中预留入口 |
| 验收标准 | 组件台账建立并经用户冻结批准，可供同事分工认领蒸馏 |
| 前置依赖 | 无（阶段 1 模板已就绪：`docs/materials/_templates/`） |

---

## 目标（Goal）

为源项目 `oss-visual-gd-emergency-support` 的 `web/components` 与 `web/pages` 建立**组件台账**（组件/路径/引用次数/多版本情况/建议优先级/认领人占位列），冻结后作为团队分工蒸馏的依据。蒸馏工作本身由同事按台账认领、另建子任务卡，不在本卡内。

---

## 沉淀范围分析（基于目录盘点）

### 源 A：`web/components/ui/`（通用层，优先级高）

| 分层 | 组件 | 拟定模块名 | 优先级 |
| --- | --- | --- | --- |
| UI 原子件 | panel、table、digital-flop、ind-top-n、progress-bar、time-display、side-panel、select、data-status、screen-title、titles/title-1、border/*、decoration/*、column-3d | 与组件同名（kebab-case） | 高 |
| 图表件 | rc-echarts/gauge、rc-echarts/pie-3d、rc-echarts/bar3d-line、rc-echarts/horizontal-interval-bar-chart、rc-echarts/map | `chart-gauge` 等，前缀 `chart-` | 高 |
| GIS 层 | emap-gis 全套（MapView / MapWidget* / hooks） | `emap-gis`（含 map-view + Points/Legend 模式） | 高（核心资产，SDK 契约写入 data-model） |
| 复合件 | vertical-infinite-info、video-flv、video、iframe-loader、swiper-react-core | 同名 | 中 |

### 源 B：`web/pages/`（业务层，沉淀「布局模式」）

| 模式 | 来源 | 说明 |
| --- | --- | --- |
| 三段式大屏布局 | five-major-center 各中心的 section-left / center / section-right | 沉淀为布局模板物料 |
| center/map-view | 各中心 modules/center/map-view（含 map-geo、map-gis、region-select、map-tooltip） | 与 emap-gis 物料联动 |
| section ItemCard 模式 | section-left/right 下各业务块的 ItemCard + 列表 | 沉淀为 `section-item-card` |

### 不做清单（明确排除）

- `components/layout/`、`initializer/`、`socket/`、`large-screen/` 运行时基础设施
- `large-screen/lib/*.min.js` 闭源压缩产物
- 源项目所有 `*.bak.*` 文件、`images/` 静态资源
- 与单一中心强耦合、无复用证据的业务 section（阶段 2 盘点后按频次裁决）
- 本任务不引入新站点功能（`src/` 不动）

---

## 步骤（执行计划）

### 步骤 1：脚本盘点（自动，全量）

- **动作**：按 04-script-first 规则写 Node 脚本（存 `.trae/fedx-vis-ai-view-project-context/scripts/`）扫描两个源目录：组件名/路径/类型（原子/图表/GIS/模式）/引用次数/多版本情况/文件规模，自动剔除 `.bak` 与 `images/`
- **输出**：脚本 + 原始扫描数据
- **等待用户**：否

### 步骤 2：台账整理与优先级建议

- **动作**：在扫描数据基础上补齐：建议优先级（按复用价值）、备注（排除原因等）、**认领人占位列**（供同事分工）；多版本情况标注（如「5 个 center 各有 map-view 版本」）
- **输出**：`plans/inventory-gd-emergency-support.md`（组件台账，列表格式，含冻结清单草案）
- **等待用户**：是（P1 冻结硬门槛：用户批准冻结清单与优先级）

### 步骤 3：冻结与移交

- **动作**：按用户反馈修正台账至冻结；更新 roadmap 阶段 2 状态；台账中每组件预留子任务卡链接占位，供同事认领后建立
- **输出**：冻结版台账；`roadmap.md` 更新；本卡归档
- **等待用户**：是（硬门槛②验收）

---

## 验收 checklist

- [x] A1：台账覆盖 `web/components` 与 `web/pages` 两源目录，自动剔除 `.bak`/`images`/`.min.js`（002 卡完成）
- [x] A2：每条目含：路径、类型、引用次数、多版本标注、建议优先级、备注、认领人占位
- [x] A3：冻结清单经用户批准（P1，2026-11-03），优先级排序可支持同事分工
- [x] A4：台账每组件预留子任务卡链接占位，认领流程说明清晰（后续演进：业务模块 12 张 B/C 卡见 current-sprint）
- [x] A5：`roadmap.md` 阶段 2/3/4 状态更新；本卡归档（2026-11-06 收口，db 状态事实源同步归零 not-started）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | 用户（含范围调整：仅做台账，蒸馏由同事认领） |
| ② 实现验收 | 已验收 | 2026-11-06 | 用户（「先收尾」指令收口 epic） |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡：基于目录盘点完成沉淀范围分析与不做清单，待用户审批。
- 用户批准并调整范围：仅做台账（不做逐个蒸馏），蒸馏由同事按台账认领；已收缩步骤与验收清单，Status → 进行中。
- 子任务 002 台账 P1 冻结经用户批准（2026-11-03）；台账完成情况以 002 卡台账「备注」列为锚点，002 卡保持进行中直至蒸馏子任务全部完成。蒸馏进展：iframe-loader / swiper-react-core 已完成归档，side-panel 重构为 widget-shell（007 已归档）。

### 2026-11-06（漂移修正 · 现状盘点）

本卡原始叙事（「建台账」）已远落后于实际演进，在此收口，**本卡职责收窄为 epic 进度锚点**：

- 台账使命（A1–A4）已全部完成；业务模块部分经 016 卡勘察定稿为四档处置（A examples 化 / B 独立 / C 合并 / D 搁置），取代了台账原始「优先级+认领人」分工形态。
- 通用组件蒸馏（台账第一部分）已完成收官：bar3d-line / gauge / pie-3d 等完成归档；emap-gis、decoration、screen-title、titles 经用户决策搁置。
- 业务模块蒸馏（台账第二部分）12 张 B/C 卡已立卡排队（status=db `queued`），待认领执行。
- 数据权威迁移：规划/定档事实源已从台账文档迁移至 `research/materials.db`（033/034 归档），`distill_status` 表是唯一状态事实源；本卡与子卡的流转以 db 为准。

### 2026-11-06（epic 收口）

- 12 张业务模块 B/C 卡（016~034）全部关闭归档；**完成范围＝oss-visual-gd-emergency-support 单一源项目的蒸馏**，物料站工作整体未结束（roadmap 阶段 5 闭环验证未启动，后续源项目待规划）。
- db 状态事实源终态回填（此前仅部分回填）：queued 6 条 → distilled（017/020/021/022/029 遗漏）；#23/#27（ihc components 左右版）→ shelved（补 025/026 关闭结论）；A 档 14 条 → shelved（已覆盖不蒸馏，iframe-view→ui-iframe-loader、network-quality/scale→ui-indicator-carousel 写 matched_material）；D 档 11 条 → shelved（reason 引用 survey tier_reason）。终态：40 项 = distilled 9 + shelved 31，not-started 0。
- epic 收口：A5 勾选；roadmap 阶段 2/3/4 状态更新；current-sprint 移除本卡索引；归档 done/2026-11/。

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [x] `roadmap.md` —— 阶段 2/4 状态更新
- [x] 子任务卡全部归档或移交（32 张，见 done/2026-11/）

---

## 关联

> - 模板：`docs/materials/_templates/`、`../../templates/task-template.md`
> - Roadmap：`../../roadmap.md` 阶段 2~4
> - 源项目：`oss-visual-gd-emergency-support`（web/components、web/pages）
