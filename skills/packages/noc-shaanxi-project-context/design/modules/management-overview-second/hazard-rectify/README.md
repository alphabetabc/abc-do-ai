---
name: 'noc-shaanxi-second-hazard-rectify'
version: '1.0'
updated: '2026-09-09'
description: '隐患整改计划模块（hazard-rectify）：本月安排 / 近三个月安排两页 Carousel，双折线面积图展示计划与已完成趋势。'
---

# 隐患整改计划（hazard-rectify）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 最后更新 | 2026-09-09 |

## 一、基本信息

| 项 | 值 |
| --- | --- |
| 源码位置 | `web/pages/management-overview-second/modules/hazard-rectify/` |
| widget 注册名 | 隐患整改计划-（近期安排） |
| 布局（4800×1200 设计稿） | left: 840, top: 470, 690×350（左列第二排右侧） |
| 订阅字段 | `zoneSelect`（payload `{ zoneId, zoneLevel }`） |
| 数据接口 | `getRiskResolvePlanDataApi`（`web/services/management-overview-second/share/index.ts` L97） |
| 视图映射 | viewPageId `noc-module-oriented-left-page` / viewItemId `risk-resolve-plan`，requestId 8833 |
| 轮询周期 | 30 分钟（`TIME_RANGE.MINUTE * 30`） |
| 请求前置 | `zoneId` 与 `zoneLevel` 均已定义（`isDefined` 守卫） |

## 二、文件结构

```
hazard-rectify/
├── index.tsx    # 组件入口（Panel + Carousel 两页 + ReactECharts）
├── option.ts    # chartOption 图表配置模板（双折线面积图）
└── index.less   # 样式（.hazard-rectify-root / .month-select / .month-unselect）
```

## 三、数据流

1. `getRiskResolvePlanDataApi(props.zoneSelect)` POST 视图服务，`viewPageArgs` 直接透传 zoneSelect（含 zoneId/zoneLevel）。
2. converter 按 `moduleId` 拆分 rows：
   - `moduleId === '4'` → `data3`（近三个月安排）
   - 其余 → `data1`（本月安排）
   - 返回 `{ data1, data3 }`；服务层保留了注释掉的 `localMockUrl`（`/static/mock/management-overview-second/risk-resolve-plan.json`，未启用）。
3. 组件内 `option1` / `option3` 两个 `useMemo` 分别处理 data1 / data3：`indicatorGroup === '1'` 的行取 `indicatorName` 作 x 轴、`indicatorValue` 作「计划」系列数据；其余行 `indicatorValue` 作「已完成」系列数据（即「已完成」行的 indicatorGroup 为非 '1'，**具体值未在源码中显式体现，按 else 分支归入**）。
4. 用 `cloneDeep(chartOption)` + `set(option, 'xAxis[0].data' / 'series[0].data' / 'series[1].data', ...)` 填充模板。

> 服务端响应结构、rows 字段表与数据形态要点详见 [data-format.md](./data-format.md)。

## 四、图表配置（option.ts chartOption）

- tooltip：axis 触发；grid：left/right 1%、top 15%、bottom 5%、containLabel。
- legend：右上角「计划」「已完成」，白字 16px。
- xAxis：category，interval 0；yAxis：value，隐藏分割线与刻度。
- series 两条折线（均带 label 顶部数值 + 面积渐变 + 白描边圆点 symbolSize 7）：

| series | 折线色 | 面积渐变 |
| --- | --- | --- |
| 计划 | #24FF6C | rgba(10,106,42,0.9) → rgba(0,255,84,0.1) |
| 已完成 | #56E4FF | rgba(0,118,176,0.9) → rgba(0,118,176,0.1) |

- 渲染组件为 `ReactECharts`（`@/components/large-screen/lib`），非模块内 BarChart。

## 五、交互现状

- **Carousel 两页轮播**：antd Carousel，`dots={false}`、`autoplaySpeed={10000}`、`speed={1000}`、`effect="fade"`；每页顶部为「本月安排 / 近三个月安排」互斥高亮标题（`month-select` / `month-unselect`），点击未选中标题调用 `ref.current.next()` 翻页。
- **hover 暂停**：第一页 `onMouseEnter/onMouseLeave` 切换 autoplay（注意：**暂停逻辑只挂在第一页 content 上，第二页无此处理**）。
- **数字人**：`useMetaHumanEffect` 监听 `SWITCH_OPERATE`，按预设 `'隐患整改计划'` 的 labelGetter 命中「本月安排」→ `goTo(0)`，否则 `goTo(1)`；数字人接管期间 autoplay 关闭（`autoplay={!metaHumanEnable && autoplay}`）。
- **无图表点击 / 下钻交互**。

## 六、已知问题

- `index.tsx` 残留两处 `console.log('测试日志 隐患整改计划 ...')` 调试输出（L20、L91）。
- hover 暂停仅覆盖第一页（见上）。
- 翻页点击 `onClick` 固定 `ref.current.next()`，在第二页点「本月安排」依赖 Carousel 循环回退。

## 七、与进行中需求的差距（隐患下钻 docs/specs/003-noc-second-hazard）

需求 C.2：新增第三分类「整体计划安排」（半年快速呈现全量未解决隐患统计值），与「本月安排」「近三个月安排」并列；三分类均支持点击（含半年柱子）弹窗展示隐患详情。差距：

1. **新增第三分类**：当前 Carousel 仅两页（data1/data3，按 moduleId '4' 拆分）；「整体计划安排」需新数据来源（全量未解决隐患统计，视图映射未定）与第三页/第三分类切换形态（是否仍用 Carousel、还是改 tab 结构待定）。
2. **点击下钻**：三分类的每个数据点需弹窗（10 列详情表格，无分页滚动展示）；当前折线图无任何点击事件。ReactECharts 可通过 `onEvents` 绑定 echarts `click`（params.name/seriesName/value 可定位数据点）。
3. 半年柱子的展示样式待 UI 确认（需求文档附件 image_003 备选稿）。
4. 详情 10 列数据走视图服务，映射待产品确认（需求文档 §I 开放问题 2/3/4）。
5. 弹窗可参考右屏 `cutover-detail` 与中屏 `alarm-detail`（antd Table + react-resizable + 序号列）；全量数据量级大时的展示方案（虚拟滚动等）待评估。

## 八、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：基于源码梳理建立模块文档 |
| v1.1 | 新增 §三.1 服务端数据格式（基于 mock risk-resolve-plan.json 与 header 元信息确认） |
