---
name: 'noc-shaanxi-management-overview-second'
version: '1.0'
updated: '2026-09-09'
description: '管理总览第二屏（management-overview-second，面向模块场景）模块的整体设计文档：页面架构、widget 布局、数据通道、子模块速查与已知差异。'
---

# 管理总览第二屏（management-overview-second）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 最后更新 | 2026-09-09 |

本文档是 `web/pages/management-overview-second/` 的整体设计文档，随源码持续进化——任何源码改动都应同步更新本文档对应章节。

---

## 一、模块位置与页面架构

```
web/pages/management-overview-second/
├── index.less            # 全屏样式壳
├── metaHumanPresets.ts   # 数字人语音命中预设
├── render.tsx            # 渲染入口
└── modules/
    ├── screen.ts         # createLargeScreen 屏配置
    ├── fields.ts         # 交互字段（zoneSelect / center:tabChange）
    ├── index.ts          # widget 注册与布局（zone 划分的唯一事实源）
    ├── zone-select/            # 区域选择（左上角）
    ├── page-title/             # 页面标题
    ├── overview-statistics/    # 概况统计（指标卡 + 旋转动画）
    ├── hazard-statistics/      # 隐患分类统计（四 tab 饼/条图）
    ├── hazard-solve/           # 隐患解决情况（堆叠柱 + 折线）
    ├── hazard-rectify/         # 隐患整改计划-近期安排（双折线面积图）
    ├── network-manager/        # 网元全纳管（指标卡）
    ├── business-monitor/       # 业务全监控（指标卡）
    ├── notice/                 # 隐患公告（已实现，未注册）
    ├── cutover-manager/        # 割接管理（tab + 饼图 + 柱线图）
    ├── cutover-process-manager/ # 割接过程管理（时间轴 + 详情弹窗）
    ├── cutover-type/           # 割接类型分布（条形图）
    ├── center/                 # 中心区域（事件监控/事件详情/事件质量 三 tab）
    ├── meta-human-helper-zone/ # 数字人辅助高亮层（非业务）
    └── components/             # 模块内通用图表（bar-chart / pie-2d / pie-3d）
```

### 1.1 渲染链路

- 路由：`src/controller/index.ts` 中 `@Get('/management-overview-second')` → `render(ctx, { stream: true })`（`@fedx-bff-web/ssr-core` SSR，失败降级 CSR）。
- 入口 `render.tsx`：
  - `<LargeScreenEnv screen={screenName} designWidth={4800} designHeight={1200} enableScreenControl={false} enableMetaHuman={true} metaHumanPresets={...}>` —— 4800×1200 超宽大屏，启用数字人。
  - `<Background>` + `<WidgetsRender getWidgets={getWidgets}>` 渲染全部注册 widget。
  - `<MetaHumanHelperZone />`（开发态辅助定位）+ `<MetaHumanCustomTrigger />`。

### 1.2 widget 布局（`modules/index.ts`）

布局坐标基于 4800×1200 设计稿，三列结构：

| 列 | widget（注册名） | 模块目录 | layout(left, top, w, h) |
| --- | --- | --- | --- |
| 顶部 | zone-selector | zone-select | 80, 40, 200×48 |
| 顶部 | page-title | page-title | 1950, 50, 895×50 |
| 左列 | 概况统计 | overview-statistics | 90, 95, 690×350 |
| 左列 | 隐患分类统计 | hazard-statistics | 840, 95, 690×350 |
| 左列 | 隐患解决情况 | hazard-solve | 90, 470, 690×379 |
| 左列 | 隐患整改计划-（近期安排） | hazard-rectify | 840, 470, 690×350 |
| 左列 | 网元全纳管 | network-manager | 90, 845, 1420×280 |
| 中列 | 中心区域 | center | 1644, 133, 1528×1000 |
| 右列 | 割接管理 | cutover-manager | 3257, 95, 1397×400 |
| 右列 | 割接过程管理 | cutover-process-manager | 3267, 495, 875×350 |
| 右列 | 割接类型分布 | cutover-type | 4175, 495, 490×350 |
| 右列 | 业务全监控 | business-monitor | 3267, 845, 1397×280 |

除 center 同时订阅 `center:tabChange + zoneSelect` 外，其余业务模块均订阅 `zoneSelect`。

### 1.3 交互字段（`modules/fields.ts`）

- `zoneSelect`：区域选择派发，payload `{ zoneId, zoneLevel }`，驱动全屏模块按区域刷新。
- `center:tabChange`：中屏 tab 切换，值为 `TabChangeEnum`（`tab1-事件监控` / `tab2-事件详情` / `tab3-事件质量`）。

### 1.4 数字人（`metaHumanPresets.ts`）

四组语音命中规则：隐患分类统计（tab 切换）、隐患整改计划（本月/近3个月）、中屏 tab 切换、割接管理（tab 切换 + 图表轮播 index）。

---

## 二、数据通道（全模块共用）

- 服务层：`web/services/management-overview-second/`（含 `request-api.ts` requestId 映射表、`convert.ts`、`enum.ts`、`left/`、`center/`、`right/`）。
- 主通道：`getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），参数 `{ viewItemId, viewPageId, viewPageArgs }`，取 `data.viewItemData.rows`。
- 例外：中屏告警类（tab-content-2/3）走 `baseUrlType: 'managementOverviewSecondAlarmService'` 的 `statistic-result-rest` / `statistic-flow-rest`，indexId 由环境配置 `managementOverviewSecondAlarmConfig` / `shaanxiCustomSettings.screen2.中屏-事件详情.complaintStaticsSettings` 提供。
- **`src/` 下无第二屏业务数据接口**：midway BFF 只负责 SSR 路由，业务数据全部直连外部 fedx 视图服务 / 告警统计服务。

### 2.1 requestId 映射速查（`request-api.ts`）

| viewPageId / viewItemId | requestId | 用途 |
| --- | --- | --- |
| noc-module-oriented-left-page / risk-dict | 8869 | 隐患字典（割接管理复用） |
| noc-business-oriented-left-page / noc-region | 5398 | 区域选择 |
| noc-module-oriented-left-page / risk-announcements | 8845 | 隐患公告 |
| noc-module-oriented-left-page / risk-overview | 5401 | 概况统计 |
| noc-module-oriented-left-page / risk-type | 5404 | 隐患分类统计（indicatorGroup 1~4） |
| noc-module-oriented-left-page / risk-resolve | 8830 | 隐患解决情况 |
| noc-module-oriented-left-page / risk-resolve-plan | 8833 | 隐患整改计划 |
| noc-module-oriented-middle-page / newt-work-elem-and-busi | 9385 | 网元全纳管(group1) / 业务全监控(group2) |
| noc-module-oriented-middle-page / event-over-view | 9397 | 中屏事件监控漏斗 |
| noc-module-oriented-middle-page / event-over-view-detail | 9403 | 中屏事件效能弹窗 |
| noc-module-oriented-right-page / net-work-cutovers | 8875 | 割接管理总数 |
| noc-module-oriented-right-page / net-work-cutovers-detail | 8881 | 割接管理右侧图表 |
| noc-module-oriented-right-page / net-work-cutover-flow | 8887 | 割接质量管控 |
| noc-module-oriented-right-page / net-work-cutover-type | 8893 | 割接类型分布 |
| noc-module-oriented-right-page / net-work-cutover-flow-count | 99991 | 割接过程管控统计 |
| noc-module-oriented-right-page / net-work-cutover-flow-details | 99992 | 割接过程管控详情（弹窗） |

> `request-api.ts` 注释标明为「脚本生成」，新增条目方式需与数据方案脚本协调（未确认）。

---

## 三、子模块速查

| 子模块 | 业务用途 | 图表/展示 | 数据源 | 轮询 |
| --- | --- | --- | --- | --- |
| zone-select | 区域选择，派发 zoneSelect | 下拉 | noc-region (5398) | - |
| page-title | 标题「陕西移动网络管理概览」 | 纯展示 | - | - |
| overview-statistics | 隐患概况 10 指标，值/关键值 180° 旋转切换 | 指标卡（useRotate） | risk-overview (5401，当前 localMock) | 30min |
| hazard-statistics | 隐患四分类（来源/专业/原因/类型），8s 自动轮播 tab，hover 暂停 | Pie2D / BarChart | risk-type (5404) ×4 并发 | 30min |
| hazard-solve | 已解决/未解决堆叠柱 + 解决及时率折线 + 全省及时率 markLine | Bar3dLineChart（公共组件 rc-echarts/bar3d-line） | risk-resolve (8830) | 30min |
| hazard-rectify | 本月安排 / 近三个月安排 两页 Carousel，10s 轮播 | ReactECharts 双折线面积图（计划/已完成） | risk-resolve-plan (8833)，moduleId '4' 拆近三月 | 30min |
| network-manager | 网元全纳管 7 指标卡 | 指标卡 | newt-work-elem-and-busi group1 (9385) | 30min |
| business-monitor | 业务全监控 4 指标卡 | 指标卡 | newt-work-elem-and-busi group2 (9385) | 30min |
| notice | 隐患公告轮播 | Carousel | risk-announcements (8845) | 15min |
| cutover-manager | 割接总数/影响业务割接总数 tab + 左饼图 + 右两页柱线图（含均值行） | Pie2D + Bar3dLineChart | net-work-cutovers (8875) / detail (8881，localMock) | 30min |
| cutover-process-manager | 割接过程管控（6 阶段时间轴，行点击弹 cutover-detail 表格）/ 割接质量管控（3 阶段） | 时间轴 + RippleDom + Modal Table | flow-count (99991) / flow-details (99992) / flow (8887) | 60min |
| cutover-type | 割接类型分布 | BarChart（横条） | net-work-cutover-type (8893) | 无轮询 |
| center | 三 tab：事件监控（APNG 漏斗 + 指标，点击弹事件效能 Modal）/ 事件详情（事件与投诉统计卡，点击数值弹告警详情）/ 事件质量（专业/地市堆叠柱，柱点击弹告警详情） | APNG + 卡片 + Bar3dLineChart + Modal Table | event-over-view (9397) / detail (9403) / 告警服务 statistic-* | 5min |

### 3.1 center 结构

- `ZoneContainer.tsx`：按 `$currentType` 用 visibility/opacity 切换三个 tab 层。
- `tab-button`：三个 ImageButton，点击 `dispatch('center:tabChange', type)`，挂载默认派发 tab1。
- `tab-content-1`（事件监控）：APNG 动画漏斗底图（`apng-js` 解析 `funnel-bg.png` 到 canvas）；indicatorGroup '1' 为 topPresets，其余为 bottomPresets 绝对定位；点击漏斗打开 `event-energy` Modal（五区块：告警接入/事件识别/事件预处理/事件处置/事件闭环）。
- `tab-content-2`（事件详情）：`event-statics`（当班/遗留事件卡）+ `complaint-statics`（投诉九宫格，支持环境配置动态加列）+ `alarm-detail` Modal（antd Table + react-resizable 列宽）。
- `tab-content-3`（事件质量）：`chart-statics` 两幅堆叠柱（专业/地市），`onHandleBarClick` 从 `data.__rawData` 取 sessionId/statisticItemId/cellId/mainIndexId 打开告警详情。

### 3.2 子模块详细文档（子目录）

| 子模块 | 文档 | 一句话能力 |
| --- | --- | --- |
| hazard-solve（隐患解决情况） | [hazard-solve/README.md](./hazard-solve/README.md) | 已解决/未解决堆叠柱 + 解决及时率折线 + 全省及时率 markLine |
| hazard-rectify（隐患整改计划） | [hazard-rectify/README.md](./hazard-rectify/README.md) | 本月/近三个月两页 Carousel，计划与已完成双折线面积图 |

> 其余子模块按需新增 `design/modules/management-overview-second/<module>/README.md`，并登记到本表。

### 3.3 模块内通用图表（`modules/components/`）

- `bar-chart`：原生 echarts 横向条形图（背景柱 + 斜纹贴图 + 渐变），props `{ nameList, valueList, unit }`，无点击事件。
- `pie-2d`：双 echarts 实例叠层环形饼图，props 为 `{name, value, unit, percent, itemStyle, display}` 数组，无点击事件。
- `pie-3d`：echarts-gl 3D 饼图，**已被 Pie2D 替代**（hazard-statistics 中引用被注释）。

---

## 四、仓库内现成的「下钻」范式

第二屏已有两处「点击 → Modal → Table」实现，可作为新增下钻需求的参考：

1. 右屏 `cutover-process-manager/cutover-detail`：时间轴行点击 → Modal → antd Table（割接标号/工单主题/地市/计划起止时间/角色/联系电话），数据 flow-details (99992)。
2. 中屏 `alarm-detail`（tab-content-2/3 共用）：卡片/柱子点击 → Modal → antd Table + react-resizable 列宽 + 序号列，数据 statistic-flow-rest。

公共组件 `rc-echarts/bar3d-line` 支持 `onHandleBarClick` 回调（tab-content-3 已启用）；Bar3D 堆叠块级点击粒度是否支持**未确认**，使用前需读该组件源码。

---

## 五、进行中需求：隐患模块下钻（docs/specs/003-noc-second-hazard）

需求输入见 `docs/specs/003-noc-second-hazard/pm-inputs/pm-requirements-input.md`（网管中心张新，2026-08-03）。与现状差距：

1. **隐患解决情况（C.1）**：需点击堆叠柱某块（已解决/未解决 × x 轴）弹隐患详情表。现状 `hazard-solve` 未启用点击回调、无详情弹窗、无 10 列详情接口。
2. **隐患整改计划（C.2）**：需新增第三分类「整体计划安排」（半年全量未解决隐患统计），三分类均支持点击弹窗。现状仅两页 Carousel，无第三分类、无点击。
3. **详情字段（C.3）**：10 列（隐患流水号/隐患类型/隐患细分分类/隐患名称/专业/隐患级别/隐患处理单位/资源名称/解决排期/整改方案分类）接口与表格均不存在；数据走视图服务（与 getViewItemDataApi 通道一致），具体映射生成五件套时确认。
4. 弹窗样式可参考 §四 的 cutover-detail / alarm-detail；半年柱子样式与后台可配置项待 UI / 产品确认（见需求文档 §I 开放问题）。

---

## 六、已知差异与技术债

- `notice`（隐患公告）已实现但 widget 注册被注释，**当前未挂载**。
- `pie-3d` 被 `pie-2d` 替代（引用注释）；`center/tab-button/index copy.tsx`、`complaint-statics/index.bak.tsx` 等备份文件残留。
- `overview-statistics`（risk-overview）与 `cutover-manager` 明细（net-work-cutovers-detail）仍挂 `localMockUrl` 本地 mock。
- 多处模块残留 `console.log('测试日志 ...')` 调试输出。
- `hazard-solve` 的 markLine「全省隐患解决及时率」data 为空，由 `rc-echarts/bar3d-line` 公共组件填充（逻辑未读，未确认）。

---

## 七、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：基于源码梳理建立第二屏整体文档（架构、布局、数据通道、子模块速查、下钻范式、隐患下钻差距、技术债） |
