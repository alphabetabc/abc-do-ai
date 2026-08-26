# 北京移动指挥调度大屏 Demo —— 实施 Roadmap (v2.0)

> 文档定位：北京移动指挥调度模块（`cmd-dispatcher`）持续演进计划，用于对齐分工与节奏。
> 关联文档：
>
> -   需求输入：[000-pm-input-spec.md](../design/000-pm-input-spec.md)、[000-pm-input-meeting.md](../design/000-pm-input-meeting.md)
> -   验收基线：[001-pm-output.md](../design/001-pm-output.md)
> -   技术规范：[002-backend.md](../design/002-backend.md)、[003-frontend.md](../design/003-frontend.md)
> -   当前状态：[../status/current.md](../status/current.md)
> -   自检清单：[../status/checklist.md](../status/checklist.md)
> -   实施记录：[./done/](./done/)（task001~005）+ [./](./)（task006）
>
> **版本变更**：
>
> -   v1.0（2026-08-24）：两日冲刺一次性实施计划（4 widget 划分 + 19 项 T 编号）。
> -   v2.0（2026-08-25）：两日冲刺完结，进入持续演进期。按当前 **11 模块 + 7 层级 + task001~006 体系**重构里程碑 / 任务分解 / Mock 清单 / 风险，4 个 widget 旧划分作废。
>
> 重要调整（沿用 v1.0）：本项目**暂无服务端**，所有演示数据以静态 JSON 形式存放于 `public/static/mock/bj-cmcc-cmd-dispatcher/`，前端通过 `fetch('/static/mock/bj-cmcc-cmd-dispatcher/xxx.json')` 直接拉取。后端路由、命令注册、双写 Mock 等条目作废。

---

## 一、目标 & 边界

-   **目标**：北京移动网络信息门户大屏 Demo 持续完善，覆盖 11 个模块（5 个 A 组 / 4 个 C 组 / 2 个 D 组 + 1 个跨层级退服恢复）+ 5 级地图下钻 + 鼠标绘制 + 框选详情 + 故障报告 + 历史回溯的完整演示闭环。
-   **层级模型**：city / company / district / street / community / station / logical 7 级（task002 重构已取消 cell 层）。
-   **演示策略**：静态图片演示为主（task001 决策），放弃地图拖动；地图交互聚焦：**5 级下钻切换 + 矩形/圆/多边形绘制 + 框选详情弹窗 + 历史点位回放**。
-   **数据策略**：本项目**暂无服务端**（v1.0 决策），所有演示数据以静态 JSON 形式存放于 `public/static/mock/bj-cmcc-cmd-dispatcher/`，前端直接 `fetch` 拉取。
-   **暂不涉及**：服务端 / Controller 路由 / Socket 实时推送 / 命令注册表。

---

## 二、现状盘点（基于 status/current.md，截至 2026-08-25）

✅ **已落地（M1 + M2 完成，对应 task001~004）**：

-   路由 `/bj-cmcc-cmd-dispatcher` + 页面外壳 `render.tsx` + `LargeScreenEnv`（2880×1080）+ 全屏背景 `background.png`
-   11 个模块全部图片接入（含网络影响按层级切换 5 张图，task003 §7.1 `Record<Level, { get src(): string }>` getter 映射）
-   7 层级地图全部就位（2026-08-25 T15 验证 7 层级 base/outline MD5 互不相同）；图例（legend-1/2/3.png）+ 打点 icon（0/1.png + sub-td.png + sub-nr.png + icon-radar.svg）
-   地图交互：5 级下钻切换（点击 outline/base 上下钻）+ crossfade 过渡动画 + 27 个点位 mock（map-markers.json）
-   鼠标绘制：矩形/圆/多边形 + 选中 + 删除（use-draw hook + shape-renderer + map-toolbar）
-   框选详情弹窗：图片弹窗 + 智能避让 + street 层级约束（map-detail-modal）
-   基站退服结构型改造：4 tab（日/周/月/自定义）+ 折线图（ReactECharts）+ 5 层 mock + `useRequest` 数据接入
-   模块显隐：直接 `MY_LEVELS: Level[]` 声明，订阅 `useCurrentLevel()` 做 includes 判断（task002 重构已删除 Group 抽象）
-   PM 命名二次确认决策（task003 §2）：4 个 ⚠️ 命名（退服小区恢复情况 / 小区清单 / 站址画像 / 站址性能）保持现状不再推进

🟢 **M3 交互深化 + 历史回溯 已完成（task005 + task006）**：

-   ✅ task005 故障上报弹窗（图片兜底 / 复用 map-detail-modal 模式 / 公司 / 区 / 街道 3 级）
-   ✅ task006 街道级历史回溯（时间轴滑轨 + 地图点位回放 / 前三层 city-company-district 接入 / mock + map-stage 已落地）

❌ **缺口 / 待办（M3 遗留 + M4）**：

-   task003 §4.2 遗留：基站退服按层级切换图片（A 组 vs B 组截图不同）
-   task003 §4.2 遗留：退服小区恢复情况按层级切换图片（B/C/D 组各层级截图可能不同）
-   task003 §4.3 遗留：基站退服列表 + 数量统计（趋势图已分流到 task004 完成）
-   录屏脚本走通 + 演示验证

---

## 三、里程碑（持续演进）

| 里程碑                         | 状态        | 核心交付                                                      | 关联 task                         |
| ------------------------------ | ----------- | ------------------------------------------------------------- | --------------------------------- |
| **M1 模块骨架 + 地图基础**     | ✅ 已完成   | 11 模块 scaffold + 地图底图 + 5 级下钻切换 + `MY_LEVELS` 重构 | task001 + task002-01              |
| **M2 地图交互 + 模块图片补齐** | ✅ 已完成   | 鼠标绘制 + 框选详情 + B/C/D 组图片 + 基站退服结构型改造       | task002-02/03 + task003 + task004 |
| **M3 交互深化 + 历史回溯**     | ✅ 完成     | 故障上报弹窗 + 街道级历史回溯 + 3 项 task003 遗留             | task005 + task006 + 后续 task     |
| **M4 资源替换 + 录屏**         | 🟡 部分完成 | 6 层级图片手动替换 + 录屏脚本（T16 数据真实接入 不实施）      | T15 ✅ + T17 ⏳                   |

---

## 四、任务分解

### M1 模块骨架 + 地图基础（✅ 已完成）

| #   | 任务                                                      | 关联 task  | 负责人    | 产出物                                                                                                                                 | 状态 |
| --- | --------------------------------------------------------- | ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| T1  | 11 模块 scaffold + stage 容器 + 大屏外壳（2880×1080）     | task001    | 前端      | `modules/*/index.tsx` × 11 + `render.tsx` + `service-recovery-panel` 共享组件                                                          | ✅   |
| T2  | 7 层级地图底图（全部真实，2026-08-25 T15 替换）+ 图例     | task002-01 | 前端 + UI | `public/static/images/bj-cmcc-cmd-dispatcher/map/{level}/` + `legend-{1,2,3}.png`                                                      | ✅   |
| T3  | 27 个点位 mock + 打点 icon + 闪烁动画                     | task002-01 | 前端      | `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json` + `icon-radar.svg`                                                        | ✅   |
| T4  | 5 级下钻切换 + crossfade 过渡 + `MY_LEVELS: Level[]` 重构 | task002-01 | 前端      | `store/index.ts` + `presets.ts`（MAP_LEVEL_ASSETS / NEXT_LEVEL / PREV_LEVEL / OUTLINE_POSITION / LEVEL_LEGEND getter / getMarkerIcon） | ✅   |

### M2 地图交互 + 模块图片补齐（✅ 已完成）

| #   | 任务                                                                     | 关联 task  | 负责人    | 产出物                                                                                             | 状态         |
| --- | ------------------------------------------------------------------------ | ---------- | --------- | -------------------------------------------------------------------------------------------------- | ------------ |
| T5  | 鼠标绘制（矩形/圆/多边形）+ 选中 + 删除 + 工具栏                         | task002-02 | 前端      | `modules/map/use-draw.ts` + `shape-renderer.tsx` + `map-toolbar.tsx`                               | ✅           |
| T6  | 框选区域详情弹窗（图片弹窗 + 智能避让 + street 层级约束）                | task002-03 | 前端      | `modules/map/map-detail-modal.tsx` + `地图弹窗-1.png`                                              | ✅           |
| T7  | B/C/D 组模块图片接入（8 张）+ 网络影响按层级切换 5 张                    | task003    | 前端 + UI | `public/static/images/bj-cmcc-cmd-dispatcher/{*}.png` × 13                                         | ✅           |
| T8  | PM 命名二次确认决策（4 个 ⚠️ 命名保持现状，不推进改名）                  | task003    | PM        | `design/001-pm-output.md` §10 PM 回复记录                                                          | ✅（已取消） |
| T9  | 基站退服结构型改造（4 tab + 折线图 + 5 层 mock + `useRequest` 数据接入） | task004    | 前端      | `modules/station-outage/index.tsx` + `station-outage-trend-{level}.json` × 5 + `基站退服-full.png` | ✅           |

### M3 交互深化 + 历史回溯（✅ 完成）

| #   | 任务                                                                     | 关联 task         | 负责人    | 产出物                                                                                                                                                 | 状态      |
| --- | ------------------------------------------------------------------------ | ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| T10 | 故障上报弹窗（图片兜底 + 公司/区/街道 3 级入口）                         | task005           | 前端      | `modules/network-impact/failure-report-modal.tsx` + `故障分析报告弹窗-{背景,城区三分公司,石景山,广宁}.png` × 4；状态组件内 useState；不新增 store 字段 | ✅ 完成   |
| T11 | 街道级历史回溯（时间轴 + 地图点位回放 + 4 档时间粒度 + 仅退服点）        | task006           | 前端      | `components/timeline-history/` + `history-timeline.json` mock + map-stage 接入历史点位                                                                 | ✅ 完成   |
| T12 | 基站退服按层级切换图片（A 组 vs B 组截图不同，复用 task003 getter 模式） | task003 §4.2 遗留 | 前端 + UI | `基站退服-2.png` + `Record<Level, { get src(): string }>` getter 映射                                                                                  | ⏳ 待启动 |
| T13 | 退服小区恢复情况按层级切换图片（B/C/D 组各层级截图可能不同）             | task003 §4.2 遗留 | 前端 + UI | `退服小区恢复情况-{2,3,...}.png` + getter 映射                                                                                                         | ⏳ 待启动 |
| T14 | 基站退服列表 + 数量统计（趋势图已完成）                                  | task003 §4.3 遗留 | 前端      | `modules/station-outage/` 列表 + 数量统计组件（退服基站列表 / 总数 / 今日新增 / 已恢复）                                                               | ⏳ 待启动 |

### M4 资源替换 + 录屏（🟡 部分完成）

| #   | 任务                                                                                        | 关联 task              | 负责人 | 产出物                                                     | 状态                                      |
| --- | ------------------------------------------------------------------------------------------- | ---------------------- | ------ | ---------------------------------------------------------- | ----------------------------------------- |
| T15 | 6 层级 base.png + outline.png 手动替换（company/district/street/community/station/logical） | status/current.md 待办 | UI     | `public/static/images/bj-cmcc-cmd-dispatcher/map/{level}/` | ✅（2026-08-25 验证 7 层级 MD5 互不相同） |
| T16 | ~~业务数据真实接入（后端接口 / socket 推送）~~ —— 不实施（沿用 v1.0 决策：本项目无服务端）  | —                      | —      | —                                                          | ❌ 不做（决策记录）                       |
| T17 | 录屏脚本走通 + 演示验证（覆盖 3 个场景：故障报告 / 趋势 / 历史回溯）                        | TBD                    | 双方   | 录屏视频                                                   | ⏳ 阻塞：M3 完成                          |

---

## 五、风险 & 卡点

| 风险                                      | 影响                                                                               | 兜底                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 街道级历史回溯点位性能                    | 时间轴拖动卡顿                                                                     | 限制时间点数 ≤ 24，按时间窗预切片（v1.0 §五 已固化，沿用）                                                     |
| PM 命名二次确认已取消（4 个 ⚠️ 保持现状） | "退服小区恢复情况 / 小区清单 / 站址画像 / 站址性能" 与"物理站 vs 逻辑站"语义有歧义 | 当前 Demo 阶段接受歧义，后续 PRD 二轮答复再调整                                                                |
| task003 §4.2 按层级切换图片实现成本       | 每个模块需 N 张图 + getter 映射                                                    | 复用 `Record<Level, { get src(): string }>` 模式（task003 §7.1 已沉淀）                                        |
| 故障上报弹窗（T10）+ 历史回溯（T11）并发  | 两个交互均涉及弹窗 + 地图交互，可能冲突                                            | 任务串行化：task005 ✅ 已完成 → task006 启动中；FailureReportModal 状态隔离（组件内 useState）天然规避弹窗冲突 |
| 项目其它模块已有 TS 错误                  | cmd-dispatcher scope 内 TS 0 错误，但全项目 build 受阻                             | 见 [status/checklist.md §三](../status/checklist.md) 已知问题；不在本模块 scope                                |

---

## 六、文档同步要求（按 SKILL.md 自动维护协议）

本项目暂无服务端，**后端相关同步项作废**。仅保留以下同步项：

| 触发动作                                                                | 必须更新                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| 新增 / 修改 widget 目录（`web/pages/bj-cmcc-cmd-dispatcher/modules/*`） | `status/current.md` + `design/003-frontend.md` |
| 新增静态资源目录 `public/static/images/bj-cmcc-cmd-dispatcher/`         | `status/current.md`                            |
| 新增 Mock JSON（`public/static/mock/bj-cmcc-cmd-dispatcher/*.json`）    | `status/current.md`（记录清单）                |
| **新增 / 完成任务 → 更新本文档 §四 任务分解 + §八 看板**（v2.0 新增）   | 本文档                                         |
| `LargeScreenEnv` 的 `designWidth` / `designHeight` 变更                 | `status/current.md` + `design/003-frontend.md` |

每次变更完成后，按 `status/checklist.md` 中**仅前端项**自检，并在文档开头标注更新日期。

---

## 七、Mock JSON 清单（截至 2026-08-25）

### 7.1 已落地

| 文件                                  | 用途                                                                   | 关联 task  |
| ------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| `map-markers.json`                    | 地图打点数据（27 个点位 / 7 层级）                                     | task002-01 |
| `station-outage-trend-city.json`      | 基站退服趋势（city 层）                                                | task004    |
| `station-outage-trend-company.json`   | 基站退服趋势（company 层）                                             | task004    |
| `station-outage-trend-district.json`  | 基站退服趋势（district 层）                                            | task004    |
| `station-outage-trend-street.json`    | 基站退服趋势（street 层）                                              | task004    |
| `station-outage-trend-community.json` | 基站退服趋势（community 层）                                           | task004    |
| `history-timeline.json`               | 历史回溯点位（city/company/district × 24 时间点，status=1 + 数量渐增） | task006    |

### 7.2 待落地

| 文件                                                                                  | 用途                                                                  | 关联 task   |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------- |
| ~~`failure-report.json`（或按层级 `failure-report-{company,district,street}.json`）~~ | ~~故障上报 mock~~（task005 改用 PM 提供的静态图片兜底，无 mock JSON） | ~~task005~~ |

### 7.3 历史命名（v1.0 已作废，未落地）

> v1.0 预期清单 `drill-*.json` / `trend-{daily,weekly,monthly,custom}.json` / `resources.json` / `area-query.json` / `stations-base.json` / `stations-alarm.json` —— Demo 范围收敛后未落地，作废。实际命名约定改为 **`<模块>-<维度>-<层级>.json`**，层级为可选项（按 `currentLevel` 切换）。

---

## 八、看板（执行态，截至 2026-08-25）

-   [x] M1 模块骨架 + 地图基础（T1 ~ T4）→ task001 + task002-01 完成
-   [x] M2 地图交互 + 模块图片补齐（T5 ~ T9）→ task002-02/03 + task003 + task004 完成
-   [x] M3 交互深化 + 历史回溯（T10 ~ T11 完成 / T12~T14 待启动）→ task005 ✅ + task006 ✅，3 项 task003 遗留待启动
-   [x] M4 资源替换 + 录屏（T15 ✅ / T16 ❌ 不做 / T17 ⏳）→ 部分完成（T15 6 层级图片替换已验证，T16 不实施）

> 看板每次 task 状态变更时同步更新（与 `plans/` 目录 task 文件 `> 状态：` 字段联动）。
> 看板勾选状态 = task 完成状态之和（task 完成 → 对应 T 编号勾选 → 所属 M 里程碑勾选）。

---

## 文档元信息

> 版本：v2.1.0
> 日期：2026-08-25（v2.1.0：task006 归档完成——T11 ✅，M3 ✅；history-timeline.json 移入已落地 mock 清单；新增 scripts/ 管理约定）
