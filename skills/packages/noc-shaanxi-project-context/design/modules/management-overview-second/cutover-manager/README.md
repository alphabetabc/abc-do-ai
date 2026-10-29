---
name: 'noc-shaanxi-second-cutover-manager'
version: '1.2'
updated: '2026-10-23'
description: '割接管理模块（cutover-manager，右屏）：四个组成部分——①tab 双总数切换（Tabs）②左半区饼图（Pie2D）③右半区第一页割接执行柱线图 ④右半区第二页合规率折线图；数据走 net-work-cutovers / net-work-cutovers-detail 两视图。'
---

# 割接管理（cutover-manager）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.2       |
| 最后更新 | 2026-10-23 |

## 一、基本信息

| 项                       | 值                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| 源码位置                 | `web/pages/management-overview-second/modules/cutover-manager/`                                   |
| widget 注册名            | 割接管理                                                                                          |
| 布局（4800×1200 设计稿） | left: 3257, top: 95, 1397×400（右列第一排）                                                       |
| 订阅字段                 | `zoneSelect`（payload `{ zoneId, zoneLevel }`）                                                   |
| 总数接口                 | `getCutoverMangerSumIndicatorApi`（net-work-cutovers，requestId 8875，走真实接口）                |
| 详情接口                 | `getCutOverManagerApi`（net-work-cutovers-detail，requestId 8881，当前挂 localMockUrl 本地 mock） |
| 字典接口（辅助）         | risk-dict（requestId 8869，dictType `netWorkCutovers`，左屏字典视图复用）                         |
| 视图映射                 | 业务视图 viewPageId 均为 `noc-module-oriented-right-page`                                         |
| 轮询周期                 | **无轮询**（useRequest 仅 refreshDeps：currentZone / moduleType）                                 |
| 请求前置                 | `zoneId` 与 `zoneLevel` 均已定义（`isDefined` 守卫）                                              |

> 服务端响应结构、rows 字段表、数据形态详见 [data-format.md](./data-format.md)。

## 二、文件结构与组成

模块由 **4 个组成部分** 构成（左半区 2 个 + 右半区 2 个）：

```
cutover-manager/
├── index.tsx    # 组件入口（Panel + 两个 useRequest + LeftPart / RightPart 编排）
├── Left.tsx     # 左半区容器：承载 ①Tabs + ②Pie2D 饼图
├── Right.tsx    # 右半区容器：两页 Carousel，承载 ③④Bar3dLineChart
├── Tabs.tsx     # ①组成：双 tab（30s 自动轮换 + 数字人 label 命中）
├── presets.ts   # 图表配置（yAxis / legend / seriesSettingsPart1 / Part2）+ ModuleType 枚举
└── index.less   # 样式（左 700px / 右 650px，tab 背景图，Carousel 圆点）
```

| #   | 组成部分           | 源文件            | 图表/组件      | 数据源（视图）                  |
| --- | ------------------ | ----------------- | -------------- | ------------------------------- |
| ①   | tab 双总数切换     | Tabs.tsx          | 自绘 tab 按钮  | net-work-cutovers (8875)        |
| ②   | 左半区饼图         | Left.tsx          | Pie2D          | net-work-cutovers (8875)        |
| ③   | 右半区第一页柱线图 | Right.tsx 第 1 页 | Bar3dLineChart | net-work-cutovers-detail (8881) |
| ④   | 右半区第二页折线图 | Right.tsx 第 2 页 | Bar3dLineChart | net-work-cutovers-detail (8881) |

## 三、组成部分详述

### 3.1 ① tab 双总数切换（Tabs.tsx）

-   两个 tab：**割接总数**（dictKey `cutoverNum`，indicatorId 100001）/ **影响业务割接总数**（dictKey `effectCutoverNum`，indicatorId 100006），tab 数值（dictValue）即 indicatorValue。
-   数据来源：8875 rows 中按 indicatorId '100001' / '100006' 过滤（convertDataToTabs）。
-   交互：
    -   **30s 自动轮换**（`useIntervalTimer`，`TIME_RANGE.SECOND * 30`），鼠标 hover 左半区经 timerRef 暂停/恢复；
    -   点击切 tab 并上抛 `onModuleTypeTypeChange('1' | '2')`（ModuleType）→ index.tsx moduleType 变更 → 8881 详情接口重新请求（8875 不重发，refreshDeps 不含 moduleType）；
    -   tabsData 就绪后 useEffect 自动选中第一个 tab；
    -   数字人 SWITCH_OPERATE：module `management-overview-second-right-screen-switch-btn-割接管理`，`labelGetter: 'data.params.label'`，按 dictName 匹配命中；数字人 enable 期间轮换禁用。

### 3.2 ② 左半区饼图（Left.tsx + Pie2D）

-   数据来源：8875 rows 按**数组下标切片**——`slice(1, 5)`（100002~100005，割接总数 tab）/ `slice(6, 10)`（100007~100010，影响业务 tab），随 ①tab 切换。
-   入参转换（convertDataToPie）：`{ name: indicatorName, value: Number(displayValue || indicatorValue), unit, percent: percent || rate, itemStyle: { color（按 indicatorId 硬编码） }, display: indicatorValue }`。
-   颜色映射：100002/100007 → #0193DE、100003/100008 → #46D7DA、100004/100009 → #F8B551、100005/100010 → #13D17D、default → #0193DE。
-   组件为 `modules/components/pie-2d`（双 echarts 实例叠层环形饼图），无点击事件。

### 3.3 ③ 右半区第一页：割接执行柱线图（Right.tsx Carousel 第 1 页）

-   数据来源：`getCutOverManagerApi` 返回的 `result.right[0]`（8881 rows 中 indicatorGroup '2' 取消 / '3' 失败 / '4' 成功 / '5' 成功率 + 前端合成 '5-1' 成功率均值）。
-   双 y 轴（条 / %），series 明细（presets.ts seriesSettingsPart1）：

| series id | 类型  | 名称       | 说明                                                    |
| --------- | ----- | ---------- | ------------------------------------------------------- |
| '2'       | Bar3D | 取消数     | 金色系渐变（#DAAE00→#BE6C00），z: 3                     |
| '3'       | Bar3D | 失败数     | 绿色系渐变（#00BE6C→#00DA14），z: 2，红色加粗数值 label |
| '4'       | Bar3D | 成功数     | 青色 #00C2D8，z: 1，未配 itemStyle（组件默认色）        |
| '5'       | Line  | 成功率     | 右轴（%），symbolSize 10                                |
| '5-1'     | Line  | 成功率均值 | 虚线 #00FCFF，隐 symbol（**前端由 average 合成**）      |

-   x 轴类目：地市名（咸阳/商洛/安康/宝鸡/延安/榆林/汉中/渭南/网管中心/西安/铜川，mock 11 个）。
-   optionBuilder：grid.top 90 / left 40、xAxis fontSize 16、隐藏 yAxis splitLine；DataStatus 包 loading。

### 3.4 ④ 右半区第二页：合规率折线图（Right.tsx Carousel 第 2 页）

-   数据来源：`result.right[1]`（8881 rows 中 indicatorGroup '6' 合规率 + 前端合成 '6-1' 合规率均值）。
-   单 y 轴形态：`yAxisLeft={{ show: false }}` + optionBuilder 中过滤 `show === false` 的轴、全部 series 强制 `yAxisIndex: 0`。

| series id | 类型 | 名称       | 说明                                        |
| --------- | ---- | ---------- | ------------------------------------------- |
| '6'       | Line | 合规率     | 绿色面积渐变折线（#00AE58→透明）            |
| '6-1'     | Line | 合规率均值 | 虚线 #00FCFF，隐 symbol（前端合成 average） |

## 四、数据流（接口编排）

1. **总数（①tab + ②饼图）**：`getCutoverMangerSumIndicatorApi(currentZone)` 请求 net-work-cutovers（8875），converter 返回 rows，Left.tsx 按 indicatorId / 下标切片消费。
2. **详情（③④柱线图）**：`getCutOverManagerApi({ zoneId, zoneLevel, module })` 串行两步：
    - 先取 risk-dict（8869，dictType `netWorkCutovers`），把 rows 的 dictKey 以逗号拼接作为 `indicatorGroup` 参数；
    - 再请求 net-work-cutovers-detail（8881，**当前 localMockUrl 指向本地 mock**），按 indicatorGroup 拆分：'1' → result.left（**未被组件消费**）；'5' → rightPart1 并合成均值行；'6' → rightPart2 并合成均值行；其余（'2'/'3'/'4'）→ rightPart1；
    - 返回 `result.right = [rightPart1, rightPart2]` 即 ③④ 两页数据源。
3. `module` 参数取自 ①tab 状态（ModuleType），tab 切换驱动 8881 重新请求。

### 4.1 yAxis 刻度配置（2026-10-23 优化）

-   yAxisLeft / yAxisRight 均补 `splitNumber: 5`、`alignTicks: false`（双轴刻度不对齐，避免强制对齐导致某轴刻度失真）。
-   yAxisRight 额外固定 `min: 0, max: 100`（右轴为百分比，0~100 满量程）。

## 五、交互与数字人

-   **右侧 Carousel**：antd Carousel 两页，`autoplay={!enableMetaHuman}`（默认速度，未显式配 autoplaySpeed），圆点 dots。
-   **数字人图表翻页**（SWITCH_OPERATE）：module `management-overview-second-right-screen-carousel-割接管理右侧图表`，`indexGetter: 'data.params.index'`，命中后 `ref.current.goTo(index)`。
-   数字人 enable 期间：①tab 轮换与 Carousel autoplay 均禁用。

## 六、已知问题 / 待办

-   net-work-cutovers-detail（8881）仍挂 `localMockUrl` 本地 mock，未切真实接口；mock 不随 tab（module='2'）变化。
-   net-work-cutovers（8875）无本地 mock，rows 行序契约（下标切片）未经服务端文档验证，服务端调行序会静默取错数据。
-   `getCutOverManagerApi` 返回的 `result.left`（indicatorGroup '1'）未被组件消费——左半区实际走 8875 总数接口，属冗余分支。
-   请求参数 `indicatorGroup`（risk-dict 拼接）与响应分组 `indicatorGroup`（'1'~'6'）非同一语义，命名易混淆。
-   Right.tsx 中 `opt.yAxis.spiltLine`（拼写错误）实际未生效，且与前面 `splitLine = { show: false }` 重复——已知无害残留。
-   presets.ts 中 seriesSettingsPart1 id '4' 成功数未配 itemStyle（用组件默认色）。

## 七、版本演进说明

| 版本 | 关键变更                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------ |
| v1.0 | 初始版本：基于源码梳理建立模块文档（结构、数据流、图表、交互）                                         |
| v1.1 | yAxis 刻度优化：yAxisLeft / yAxisRight 补 splitNumber: 5 + alignTicks: false，右轴固定 0~100           |
| v1.2 | 重构为四组成部分分节详述（①tab ②饼图 ③执行柱线图 ④合规率折线图）；新增 data-format.md 独立数据格式文档 |
