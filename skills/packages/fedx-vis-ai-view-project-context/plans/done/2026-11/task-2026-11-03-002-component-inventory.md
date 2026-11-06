# Task · 2026-11-03-002-component-inventory

> 组件台账任务：扫描源项目两目录，产出列表格式台账，冻结后供团队分工蒸馏。母任务见 `./task-2026-11-03-001-master-component-distill.md`。

---

## 任务元信息

| 项       | 值                                                                              |
| -------- | ------------------------------------------------------------------------------- |
| 编号     | `task-2026-11-03-002-component-inventory`                                       |
| Status   | 已完成                                                                          |
| 类型     | docs                                                                            |
| 影响范围 | 本文件（台账内嵌）、`scripts/scan-component-inventory.mjs`、`current-sprint.md` |
| Roadmap  | 阶段 2（盘点与冻结）                                                            |
| 验收标准 | 台账覆盖两源目录、条目字段齐全、冻结清单经用户批准                              |
| 前置依赖 | `task-2026-11-03-001`（已批准，范围含本卡）                                     |

---

## 目标（Goal）

用 Node 脚本（`.mjs`）扫描 `oss-visual-gd-emergency-support` 的 `web/components/ui` 与 `web/pages`，产出列表格式组件台账内嵌于本卡，含优先级/备注人工标注列，冻结后作为同事分工蒸馏依据。

---

## 步骤（执行计划）

### 步骤 1：脚本扫描（自动，全量）

- **动作**：运行 `scripts/scan-component-inventory.mjs`（剔除 `.bak`/`images`/`.min.js`），生成结果回填本卡「组件台账」章节
- **输出**：本文件「组件台账」章节
- **等待用户**：否
- **状态**：✅ 已完成（2026-11-03，见下方台账）

### 步骤 2：人工标注与冻结草案

- **动作**：补齐建议优先级（按引用频次 + 复用价值）、备注（排除原因/多版本说明）；产出冻结清单草案
- **输出**：本文件「组件台账」章节（更新）
- **等待用户**：是（P1 冻结硬门槛）

### 步骤 3：冻结与收尾

- **动作**：按用户反馈修正；更新 roadmap 阶段 2；归档本卡
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做任何组件蒸馏（四件套产出），由同事认领后另建子任务
- 不改动 `src/` 站点代码与源项目任何文件

---

## 组件台账

> 机器生成部分：`scan-component-inventory.mjs`（2026-11-03）；「建议优先级 / 备注」为人工标注列。
> 状态：**已冻结（2026-11-03，用户批准）**。
> 说明：引用次数按目录名 import 匹配，部分组件经 `lib/` 聚合导出会显示 0 次，标注优先级时需校正。

### 一、通用组件（web/components/ui，按被引次数排序）

#### 第一部分（✅ 已收官，2026-11-04 用户确认：12 项同事蒸馏完成并通过 review——category 违规与 ui-video 文档缺漏已修复（task-2026-11-04-016）；echarts 查证为误报不蒸馏。到此为止）

- **center**：`web/components/ui/center` ｜ 1 文件 / 0.3KB / 被引 57 次 ｜ 建议优先级： ｜ 备注：第一部分整体交由同事蒸馏（2026-11-03）
- **svg**：`web/components/ui/svg` ｜ 2 文件 / 1.2KB / 被引 45 次 ｜ 建议优先级： ｜ 备注：
- **data-status**：`web/components/ui/data-status` ｜ 1 文件 / 1.4KB / 被引 22 次 ｜ 建议优先级： ｜ 备注：
- **panel**：`web/components/ui/panel` ｜ 3 文件 / 3.9KB / 被引 17 次 ｜ 建议优先级： ｜ 备注：
- **echarts**：`web/components/ui/echarts` ｜ 1 文件 / 1.8KB / 被引 15 次 ｜ 建议优先级： ｜ 备注：不蒸馏（被引 15 为目录名误报——业务代码直接 `import from 'echarts'` npm 包被计入；实际被引 0，组件为未完成实验品，EChartsComponent 内含 TODO 与写死 demo option，2026-11-04 review 查证）
- **table**：`web/components/ui/table` ｜ 2 文件 / 1.3KB / 被引 7 次 ｜ 建议优先级： ｜ 备注：
- **time-display**：`web/components/ui/time-display` ｜ 2 文件 / 3.7KB / 被引 4 次 ｜ 建议优先级： ｜ 备注：
- **digital-flop**：`web/components/ui/digital-flop` ｜ 3 文件 / 2.1KB / 被引 2 次 ｜ 建议优先级： ｜ 备注：第一部分整体交由同事蒸馏（2026-11-03）
- **border**：`web/components/ui/border` ｜ 3 文件 / 4.3KB / 被引 1 次 ｜ 建议优先级： ｜ 备注：
- **select**：`web/components/ui/select` ｜ 1 文件 / 1.6KB / 被引 1 次 ｜ 建议优先级： ｜ 备注：
- **video-flv**：`web/components/ui/video-flv` ｜ 1 文件 / 5.5KB / 被引 1 次 ｜ 建议优先级： ｜ 备注：
- **video**：`web/components/ui/video` ｜ 2 文件 / 0.7KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：
- **vertical-infinite-info**：`web/components/ui/vertical-infinite-info` ｜ 3 文件 / 7.0KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：

#### 第二部分

- **iframe-loader**：`web/components/ui/iframe-loader` ｜ 2 文件 / 5.3KB / 被引 3 次 ｜ 建议优先级： ｜ 备注：✅ 已蒸馏（task-2026-11-03-003，2026-11-03 归档）
- **emap-gis**：`web/components/ui/emap-gis` ｜ 14 文件 / 58.9KB / 被引 4 次 ｜ 建议优先级： ｜ 备注：⏸️ 搁置（2026-11-04 用户决策：暂不蒸馏）
- **swiper-react-core**：`web/components/ui/swiper-react-core` ｜ 14 文件 / 50.9KB / 被引 2 次 ｜ 建议优先级： ｜ 备注：✅ 已蒸馏（task-2026-11-03-004，2026-11-03 归档）
- **column-3d**：`web/components/ui/column-3d` ｜ 2 文件 / 7.0KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：✅ 已蒸馏（task-2026-11-03-011，产物 docs/materials/components/ui/ui-column-3d/，d3/classnames/DigitalFlop/LinearTextGradient 全部内联化，零外部依赖；新增 columnWidth prop 柱宽参数化）
- **decoration**：`web/components/ui/decoration` ｜ 4 文件 / 1.5KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：⏸️ 搁置（2026-11-04 用户决策：暂不蒸馏）
- **ind-top-n**：`web/components/ui/ind-top-n` ｜ 4 文件 / 7.2KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：已完成（task-2026-11-03-010，产物 docs/materials/components/ui/ui-ind-top-n/，styled-components/classnames/useSize/useUniqueId/Center 全部内联化，零外部依赖）
- **progress-bar**：`web/components/ui/progress-bar` ｜ 3 文件 / 4.6KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：✅ 已蒸馏（task-2026-11-03-012，产物 docs/materials/components/ui/ui-progress-bar/，category=chart；antd Progress 以 div+CSS 重实现，styled-components/DigitalFlop/LinearTextGradient 全部内联化，零外部依赖；偏离点：流光动画为 CSS 等价近似、数字格式沿用物料站先例、percent 越界 clamp 至 [0,100]）
- **rc-echarts**：`web/components/ui/rc-echarts` ｜ 14 文件 / 66.7KB / 被引 0 次 ｜ 建议优先级：高（能力型，无 ui 组件前置） ｜ 备注：
  - horizontal-interval-bar-chart（task-2026-11-03-008，已完成待验收，产物 docs/materials/components/rc-echarts/horizontal-interval-bar-chart/，ReactECharts 改用 echarts-for-react；源 UI 版为废弃实验已不收录，数据契约为标量）；
  - bar3d-line（task-2026-11-04-013，产物 docs/materials/components/rc-echarts/bar3d-line/：custom series 伪 3D 立方柱 + 折线 + markLine 双 Y 轴；useLatest/cloneDeep/merge 内联，echarts-for-react 唯一直接依赖）；
  - gauge（task-2026-11-04-014，产物 docs/materials/components/rc-echarts/gauge/：双 series 半圆仪表盘 value 0–1；useMemorizedObject→useMemo、Decimal.mul→原生乘法、ReactIntersectionObserver 内联，echarts-for-react 唯一直接依赖）；
  - map（task-2026-11-03-009，产物 docs/materials/components/rc-echarts/echarts-map/：三层 geo + OverlayItem 挂件体系；hooks/工具最小内联，geojson 加载经 loadGeoJson Props 化，map-config Props 化为 mapConfig，DataStatus 按模块隔离内联为状态壳）；
  - pie-3d（task-2026-11-04-015，产物 docs/materials/components/rc-echarts/pie-3d/：echarts-gl surface 参数方程伪 3D 饼图；d3.max/scaleLinear 内联、lodash-es 复用、useMemorizedObject 整段内联；echarts-gl 2.0.9 与 echarts 6.1.0 共存实测可行，尺寸塌陷问题已修复）
- **screen-title**：`web/components/ui/screen-title` ｜ 1 文件 / 1.8KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：⏸️ 搁置（2026-11-04 用户决策：暂不蒸馏）
- **side-panel**：`web/components/ui/side-panel` ｜ 3 文件 / 2.9KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：✅ 已完成（task-2026-11-03-007，重构为 widget-shell 框架并归档，产物 docs/materials/components/ui/ui-widget-shell/）
- **titles**：`web/components/ui/titles` ｜ 1 文件 / 1.4KB / 被引 0 次 ｜ 建议优先级： ｜ 备注：⏸️ 搁置（2026-11-04 用户决策：暂不蒸馏）

### 二、业务模块组件（web/pages，按 section 分组）

#### section-left

- **ensure-progress**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-left/ensure-progress` ｜ 3 文件 / 8.4KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：
- **ensure-task-info**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-left/ensure-task-info` ｜ 3 文件 / 15.0KB ｜ 建议优先级： ｜ 备注：
- **overview-security-task**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-left/overview-security-task` ｜ 3 文件 / 10.0KB ｜ 建议优先级： ｜ 备注：
- **emerging-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-left/emerging-business` ｜ 3 文件 / 7.6KB ｜ 建议优先级： ｜ 备注：
- **family-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-left/family-business` ｜ 3 文件 / 13.6KB ｜ 建议优先级： ｜ 备注：
- **government-enterprise-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-left/government-enterprise-business` ｜ 2 文件 / 25.2KB ｜ 建议优先级： ｜ 备注：
- **hot-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-left/hot-business` ｜ 3 文件 / 6.6KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 → docs/materials/business/hot-business，task-021）
- **personal-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-left/personal-business` ｜ 3 文件 / 19.4KB ｜ 建议优先级： ｜ 备注：
- **complaint-response-process**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-left/complaint-response-process` ｜ 4 文件 / 21.0KB ｜ 建议优先级： ｜ 备注：
- **components**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-left/components` ｜ 14 文件 / 49.8KB ｜ 建议优先级： ｜ 备注：A 档已覆盖（2026-11-06 task-025 关闭：5 子组件已被 indicator-view / dispatch-progress / detail-table / chart-bar-pie（含 chart-pie 变体）覆盖，db #23 covered）
- **network-incident-monitor**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-left/network-incident-monitor` ｜ 3 文件 / 15.2KB ｜ 建议优先级： ｜ 备注：
- **risk-awareness-control**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-left/risk-awareness-control` ｜ 5 文件 / 25.3KB ｜ 建议优先级： ｜ 备注：
- **two-assurance**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-left/two-assurance` ｜ 3 文件 / 5.6KB ｜ 建议优先级： ｜ 备注：
- **duty-table**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-left/duty-table` ｜ 3 文件 / 3.6KB ｜ 建议优先级： ｜ 备注：
- **early-warning-perception**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-left/early-warning-perception` ｜ 4 文件 / 7.9KB ｜ 建议优先级： ｜ 备注：不蒸馏（2026-11-06 task-031 精读关闭：容器+请求层为主，剥离后仅剩单 series echarts 折线 option，复用价值 example 级，db #35 shelved）
- **emergency-resources**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-left/emergency-resources` ｜ 2 文件 / 4.3KB ｜ 建议优先级： ｜ 备注：
- **ensure-progress**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-left/ensure-progress` ｜ 5 文件 / 10.4KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：
- **security-mission**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-left/security-mission` ｜ 3 文件 / 13.2KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06，B 档 → docs/materials/business/security-mission，task-029）

#### center

- **carousel-view**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/carousel-view` ｜ 4 文件 / 20.0KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06，两中心 C 档合并 → docs/materials/components/business/carousel-view，task-017）
- **iframe-view**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/iframe-view` ｜ 2 文件 / 0.9KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：
- **map-view**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/map-view` ｜ 23 文件 / 92.1KB ｜ 多版本：3 个中心 ｜ 建议优先级： ｜ 备注：
- **carousel-view**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/center/carousel-view` ｜ 4 文件 / 20.1KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06，与 cmd-dispatcher 版合并 → docs/materials/components/business/carousel-view，task-017）
- **iframe-view**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/center/iframe-view` ｜ 2 文件 / 1.0KB ｜ 多版本：2 个中心 ｜ 建议优先级： ｜ 备注：
- **map-view**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/center/map-view` ｜ 15 文件 / 92.0KB ｜ 多版本：3 个中心 ｜ 建议优先级： ｜ 备注：
- **map-view**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/center/map-view` ｜ 6 文件 / 50.5KB ｜ 多版本：3 个中心 ｜ 建议优先级： ｜ 备注：降级处置（2026-11-06，核心即 EChartsMap+OverlayItem，独有内容为业务配置 → 不做独立物料，info-card 用法下沉为 echarts-map 的 examples/info-card-overlay.tsx，task-019）
- **map**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/center/map` ｜ 16 文件 / 108.3KB ｜ 建议优先级： ｜ 备注：
- **map-gis**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/center/map-gis` ｜ 15 文件 / 109.1KB ｜ 建议优先级： ｜ 备注：
- **switch-btn**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/center/switch-btn` ｜ 2 文件 / 2.0KB ｜ 建议优先级： ｜ 备注：

#### section-right

- **material-reserve**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-right/material-reserve` ｜ 6 文件 / 10.2KB ｜ 建议优先级： ｜ 备注：
- **network-impact-situation**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-right/network-impact-situation` ｜ 6 文件 / 46.6KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 → docs/materials/business/network-impact-situation，task-020；ItemCard.tsx 另形态未纳入）
- **rota**（cmd-dispatcher-center）：`web/pages/five-major-center/cmd-dispatcher-center/modules/section-right/rota` ｜ 2 文件 / 2.2KB ｜ 建议优先级： ｜ 备注：
- **guarantee-business**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-right/guarantee-business` ｜ 7 文件 / 22.3KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 → docs/materials/business/guarantee-business，task-022）
- **network-quality**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-right/network-quality` ｜ 2 文件 / 10.7KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 与 network-scale 合并为 docs/materials/components/ui/ui-indicator-carousel，task-023/024 联合归档；差异走 Props showMainIndicator/mainIndicatorInCarousel/slidesToShow）
- **network-scale**（comprehensive-display-center）：`web/pages/five-major-center/comprehensive-display-center/modules/section-right/network-scale` ｜ 2 文件 / 11.5KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 与 network-quality 合并为 docs/materials/components/ui/ui-indicator-carousel，task-023/024 联合归档）
- **components**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-right/components` ｜ 9 文件 / 26.4KB ｜ 建议优先级： ｜ 备注：A 档已覆盖（2026-11-06 task-026 关闭：3 子组件已被 indicator-view / chart-bar-pie / detail-table 覆盖，db #27 covered）
- **equipment-operation-control**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-right/equipment-operation-control` ｜ 9 文件 / 49.3KB ｜ 建议优先级： ｜ 备注：
- **network-room-physical-security**（information-hub-center）：`web/pages/five-major-center/information-hub-center/modules/section-right/network-room-physical-security` ｜ 11 文件 / 74.6KB ｜ 建议优先级： ｜ 备注：
- **damage-to-towns**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-right/damage-to-towns` ｜ 7 文件 / 33.5KB ｜ 建议优先级： ｜ 备注：
- **network-conditions**（gd-emergency-support）：`web/pages/gd-emergency-support/modules/section-right/network-conditions` ｜ 8 文件 / 17.9KB ｜ 建议优先级： ｜ 备注：已蒸馏（2026-11-06 → docs/materials/business/network-conditions，task-030；B 档，请求/弹窗层剥离 Props 化）

### 三、明确排除项

- `web/components/layout` / `initializer` / `socket` / `large-screen`（运行时基础设施，非可复用组件）
- `web/components/large-screen/lib/*.min.js`（闭源压缩产物）
- 所有 `*.bak.*` 文件与 `images/` 静态资源（脚本已自动剔除）

---

## 验收 checklist

- [x] A1：台账覆盖 `web/components/ui` 全部子目录 + 四个页面模块的 section 组件
- [x] A2：每条目含路径 / 文件数 / 体积 / 引用次数（通用组件）/ 多版本标注（业务组件）
- [x] A3：含「建议优先级 / 备注」人工标注列
- [x] A4：冻结清单经用户批准
- [x] A5：台账支撑的蒸馏子任务全部完成；roadmap 阶段 2 收口；本卡归档（「一」12+9 项完成、4+1 项有意搁置；业务模块部分由 task-2026-11-04-016 + research/ 产物接管，不再回写本台账——2026-11-04 用户决策）

---

## 审批记录（硬门槛）

| 门槛       | 状态                           | 日期       | 批准人                                                     |
| ---------- | ------------------------------ | ---------- | ---------------------------------------------------------- |
| ① 需求审批 | 已批准                         | 2026-11-03 | 用户（母任务 001 内批准，含台账输出到 plans/、脚本用 mjs） |
| ② 实现验收 | 已通过（用户确认台账使命完成，后续由 research 产物接管） | 2026-11-04 | 用户 |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡（从母任务 001 拆出）；脚本 `scan-component-inventory.mjs` 已就绪。
- 台账产出 + 人工标注，P1 冻结经用户批准（2026-11-03）。
- 处置记录：曾误标「已完成」并归档，用户纠正后回滚（2026-11-03）——台账冻结 ≠ 任务完成，本卡须待台账支撑的蒸馏子任务全部完成后方可归档；后续子任务认领/完成情况以本卡台账「备注」列为锚点。

### 2026-11-04

- 用户决策：本卡使命结束。通用组件（「一」）已收官；业务模块（「二」）规划权移交 task-2026-11-04-016（形态归类四档制）+ research/ 归类表，不再以本台账「备注」列为锚点。归档。

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [ ] `roadmap.md` —— 阶段 2 进度更新
- [ ] 母任务 001 中对应状态同步

---

## 关联

> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 脚本：`../../scripts/scan-component-inventory.mjs`
> - 接班任务：`../../task-2026-11-04-016-business-inventory-refine.md`（业务模块规划）
