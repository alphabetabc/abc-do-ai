---
title: 路线图与继续指南
description: advisor skill 已完成的工作 + 接下来可做的事情 + 切换智能体/任务时的恢复指南
version: 0.8
last_updated: 2026-06-22
audience: 任何接手的智能体 / 后续任务
---

# advisor skill 路线图

> 任何接手的智能体：先读本文，再决定做什么。所有状态以本文 + `materials-catalog.md` 为准。

## 已完成（截至 2026-06-22）

| # | 任务 | 交付物 |
| --- | --- | --- |
| 1 | 建立 skill 框架 | [SKILL.md](./SKILL.md)（主文档） |
| 2 | 写 4 份规则 | `references/{profile-generation,rating-rules,composition-rules,cost-estimation}.md` |
| 3 | 生成首批 11 个画像 | `profiles/{echarts-bar,echarts-pie,echarts-map,digital-flop,digital-card,bidirectional-progress,normal-label,free-layout-indicators-viewer,dock-menu,table,top-rank}.json` |
| 4 | 写画像索引 | `profiles/README.md`（131 个画像总览 + 跨画像发现） |
| 5 | 写物料维护清单 | `materials-catalog.md`（154 个物料，按 18 分类组织） |
| 6 | 写 catalog 自动生成脚本 | `scripts/gen-catalog.js`（含分类去重 + 覆盖校验） |
| 7 | 跑通组合方案示范 | `examples/sales-dashboard.md`（销售大盘场景，3 个方案卡片） |
| 8 | 写 PM 常见问题 | `FAQ.md`（选物料/组合/成本 16 个问题） |
| 9 | 修复 catalog 一致性 | 去重 5 个跨分类物料 + 补全 `decoration/decoration1` + 增加自动校验 |
| 10 | 生成第二批 9 个画像 | 表格类（drilldown-table / drilldown-table-2 / expandable-table / pagination-table / table-detail / table-fixedColumns / table-transpose / transfer-table / alarm-window-card） |
| 11 | 生成第三批 12 个画像 | 列表/排行类（carousel-list / carousel-notice / carousel-param / equip-list / hot-app-top5 / monitor-topn-list / progress-list / top-rank-shaanxi / topn-rank / topn-rank-one / tree-list / vertical-list；top-rank 在第一批） |
| 12 | 生成第四批 9 个画像 | 图表 ECharts 剩余（circular-column / cone-bar / cone-bar-line / cone-single-bar / dual-axes-chart / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge） |
| 13 | 生成第五批 23 个画像 | oss-chart-plots 系列（area / bar / base-area / base-scatter / column / double-gauge / dual-axes / dual-column-line / funnel / gauge / histogram / line / liquid / pie / radar / rose / sankey / series-area / series-bar / series-column / stack-bar / stack-column / word-cloud） |
| 14 | 生成第六批 18 个画像 | 数字/指标卡（4）+ 容器/布局（6）+ 地图（8）= 18 个（business-quality / business-scale / indicator-display / number-level-indicate / ellipse-layout-indicator / free-layout-ind-progress / free-layout-indicator-group / nine-grid / scene-over-view-hlj / telescoping-board / baidu-map / baidu-map-unicom / geo-3d-map / geo-cascader / oss-chart-classify-map / oss-chart-fly-line-map / oss-chart-map / oss-gis） |
| 15 | 生成第七批 20 个画像 | 3D/拓扑（6：echarts-3d-pie / virtual-3d-column / virtual-3d-column-normal / smart-warehouse / twaver-topo / levitated-sphere）+ 时钟/动画（4：normal-clock / path-animation / svg-render / warning-board）+ 媒体/播放（3：single-image / video-playback / weather-display）+ 进度/加载（5：circular-progress / circular-progress-group / normal-process / pagination-display / progress-list-bar）+ 其他（2：render-stage-loader / echarts-line-dual-x）= 20 个 |
| 16 | 生成第八批 17 个画像 | 状态/标签（4：status-display / stats-indi / stats-indi-group / stats-indi-grid）+ 表单/筛选（4：popover-check / popover-checkparam / query-form-group / range-picker）+ 按钮/操作（5：custom-request-button / export-btn / ghost-btn / iframe / visual-iframe）+ 文本/标签/标题（4：label-text / message-distribute / textarea-label / description-table）= 17 个 |
| 17 | 生成第九批 5 个画像 | 轮播/公告（5：carousel-image-list / tab-list / tab-list-2 / tab-list-arc / tab-list-static） |
| 18 | 生成第十批 7 个画像 | 其他（3：area-business-vol / zone-setting / top-n）+ 装饰汇总（4：decoration-family 合并 24 + hexagon + flash-point + common-container）= 7 个 |
| 19 | 修复 echarts-3d-pie JSON 解析错误 | 替换 `_note` 中的中文全角双引号 → 中文方头括号 |

## 当前画像覆盖率

| 维度        | 数据             |
| ----------- | ---------------- |
| 物料总数    | **154**          |
| 已画像      | 131（85.1%）     |
| 待画像      | 23（14.9%）      |
| 🟢 独立优秀 | 19               |
| 🟡 组合可用 | 112              |
| 🔴 组合复杂 | 0                |
| ⚫ 不建议   | 0                |

> **剩余 23 个**：border1-12 + decoration1-11 = 23 个纯样式边框/装饰，已通过 `decoration-family.json` 合并覆盖，无需单独画像。

## 第七批画像 · 完成情况（20/20 ✅）

### 6 个 3D/拓扑

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `echarts-3d-pie` | 中 | 🟡 组合可用 | 3.5 | 15 min |
| 2 | `virtual-3d-column` | 高 | 🟡 组合可用 | 3.5 | 20 min |
| 3 | `virtual-3d-column-normal` | 高 | 🟡 组合可用 | 3.3 | 20 min |
| 4 | `smart-warehouse` | 高 | 🟡 组合可用 | 3.4 | 60 min |
| 5 | `twaver-topo` | 中高 | 🟡 组合可用 | 3.7 | 30 min |
| 6 | `levitated-sphere` | 中 | 🟡 组合可用 | 3.6 | 25 min |

### 4 个时钟/动画

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `normal-clock` | 简单 | 🟢 独立优秀 | 4.0 | 5 min |
| 2 | `path-animation` | 中 | 🟡 组合可用 | 3.0 | 15 min |
| 3 | `svg-render` | 中 | 🟡 组合可用 | 3.0 | 20 min |
| 4 | `warning-board` | 中 | 🟡 组合可用 | 3.6 | 15 min |

### 3 个媒体/播放

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `single-image` | 简单 | 🟡 组合可用 | 3.5 | 2 min |
| 2 | `video-playback` | 中 | 🟡 组合可用 | 3.0 | 8 min |
| 3 | `weather-display` | 中 | 🟡 组合可用 | 3.3 | 10 min |

### 5 个进度/加载

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `circular-progress` | 中 | 🟡 组合可用 | 3.5 | 8 min |
| 2 | `circular-progress-group` | 中 | 🟡 组合可用 | 3.6 | 12 min |
| 3 | `normal-process` | 中 | 🟡 组合可用 | 3.3 | 10 min |
| 4 | `pagination-display` | 简单 | 🟡 组合可用 | 3.3 | 8 min |
| 5 | `progress-list-bar` | 中 | 🟡 组合可用 | 3.5 | 10 min |

### 2 个其他（第七批）

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `render-stage-loader` | 简单 | 🟡 组合可用 | 3.3 | 5 min |
| 2 | `echarts-line-dual-x` | 中 | 🟡 组合可用 | 3.5 | 10 min |

### 第七批核心发现

1. **3D/拓扑分 4 大引擎**：echarts-gl / fedx-3d / twaver / Three.js
2. **normal-clock 是第七批唯一 🟢 A 评级**：12 种时间格式 + 刻度数/角度独立配置
3. **video-playback 受限最大**：URL 必须 HTTPS（浏览器自动播放策略）
4. **circular-progress / circular-progress-group 配套使用**
5. **5+1 文档覆盖**（20 个）：normal-clock ✅，其余 19 个 ❌

## 第八批画像 · 完成情况（17/17 ✅）

### 4 个状态/标签

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `status-display` | 中 | 🟡 组合可用 | 3.4 | 8 min |
| 2 | `stats-indi` | 简单 | 🟡 组合可用 | 3.5 | 5 min |
| 3 | `stats-indi-group` | 中 | 🟡 组合可用 | 3.3 | 12 min |
| 4 | `stats-indi-grid` | 中 | 🟡 组合可用 | 3.3 | 10 min |

### 4 个表单/筛选

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `popover-check` | 中 | 🟡 组合可用 | 3.5 | 8 min |
| 2 | `popover-checkparam` | 中 | 🟡 组合可用 | 3.6 | 10 min |
| 3 | `query-form-group` | 中 | 🟡 组合可用 | 3.5 | 15 min |
| 4 | `range-picker` | 简单 | 🟡 组合可用 | 3.4 | 5 min |

### 5 个按钮/操作

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `custom-request-button` | 中 | 🟢 独立优秀 | 4.0 | 8 min |
| 2 | `export-btn` | 简单 | 🟡 组合可用 | 3.2 | 6 min |
| 3 | `ghost-btn` | 简单 | 🟡 组合可用 | 3.4 | 3 min |
| 4 | `iframe` | 简单 | 🟡 组合可用 | 3.4 | 5 min |
| 5 | `visual-iframe` | 中 | 🟡 组合可用 | 3.5 | 8 min |

### 4 个文本/标签/标题

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `label-text` | 简单 | 🟡 组合可用 | 3.2 | 3 min |
| 2 | `description-table` | 中 | 🟡 组合可用 | 3.3 | 8 min |
| 3 | `textarea-label` | 简单 | 🟡 组合可用 | 3.3 | 5 min |
| 4 | `message-distribute` | 中 | 🟡 组合可用 | 3.4 | 10 min |

### 第八批核心发现

1. **custom-request-button 是第八批唯一 🟢 A 评级**：API 请求 + 订阅 + loading 状态自管理
2. **表单/筛选类全部缺 5+1 文档**（4/4）
3. **iframe 双胞胎**：iframe vs visual-iframe（visual-iframe 多 alarmLink）
4. **stats-indi 与 digital-flop 高度同质**：简化版数字卡

## 第九批画像 · 完成情况（5/5 ✅）

### 5 个轮播/公告

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `carousel-image-list` | 中 | 🟡 组合可用 | 3.5 | 10 min |
| 2 | `tab-list` | 中 | 🟡 组合可用 | 3.5 | 10 min |
| 3 | `tab-list-2` | 中 | 🟡 组合可用 | 3.5 | 12 min |
| 4 | `tab-list-arc` | 中高 | 🟡 组合可用 | 3.4 | 15 min |
| 5 | `tab-list-static` | 中 | 🟡 组合可用 | 3.5 | 8 min |

### 第九批核心发现

1. **4 个 tab-list + 1 个 carousel-image-list 共用 tabData + activeIndex 结构**
2. **tab-list-arc 唯一弧形变体**
3. **5+1 文档覆盖**（5 个）：0/5 有 5+1，全部缺失

## 第十批画像 · 完成情况（7 个画像覆盖 30 个物料 ✅）

### 3 个其他（第十批）

| # | 物料 | 复杂度 | 评级 | 分数 | 搭建 |
|---|------|--------|------|------|------|
| 1 | `area-business-vol` | 中高 | 🟡 组合可用 | 3.2 | 20 min |
| 2 | `zone-setting` | 中 | 🟡 组合可用 | 3.3 | 15 min |
| 3 | `top-n` | 中 | 🟡 组合可用 | 3.5 | 10 min |

### 4 个装饰/容器（合并 24 个边框/装饰）

| # | 画像 | 覆盖物料 | 评级 | 分数 | 搭建 |
|---|------|---------|------|------|------|
| 1 | `decoration-family` | border1-12 + decoration1-12 = 24 个 | 🟡 组合可用 | 3.0 | 2 min |
| 2 | `hexagon` | hexagon | 🟡 组合可用 | 3.0 | 5 min |
| 3 | `flash-point` | flash-point | 🟡 组合可用 | 3.0 | 5 min |
| 4 | `common-container` | common-container | 🟡 组合可用 | 3.4 | 5 min |

### 第十批核心发现

1. **decoration-family 合并 24 个边框/装饰物料**：border1-12 + decoration1-12 共 24 个物料 schema 高度同源（仅颜色/路径不同），合并为 1 个画像 + 24 个变体枚举
2. **common-container 是"通用容器"**：基础容器基底，复用率最高
3. **area-business-vol + zone-setting 配对使用**
4. **top-n 与 top-rank 系列重复**：topn-rank / topn-rank-one / top-rank / top-rank-shaanxi / top-n 共 5 个排名物料 schema 80% 同源（用户已确认保持独立）

## 第六批画像 · 完成情况（18/18 ✅）

### 4 个数字/指标卡

| #   | 物料                  | 复杂度 | 评级        | 分数 | 搭建   |
| --- | --------------------- | ------ | ----------- | ---- | ------ |
| 1   | `business-quality`    | 中     | 🟡 组合可用 | 3.4  | 8 min  |
| 2   | `business-scale`      | 中     | 🟡 组合可用 | 3.5  | 6 min  |
| 3   | `indicator-display`   | 中     | 🟡 组合可用 | 3.5  | 5 min  |
| 4   | `number-level-indicate` | 中   | 🟡 组合可用 | 3.4  | 6 min  |

### 6 个容器/布局

| #   | 物料                          | 复杂度 | 评级        | 分数 | 搭建   |
| --- | ----------------------------- | ------ | ----------- | ---- | ------ |
| 1   | `ellipse-layout-indicator`    | 中     | 🟡 组合可用 | 3.3  | 15 min |
| 2   | `free-layout-ind-progress`    | 中     | 🟡 组合可用 | 3.5  | 12 min |
| 3   | `free-layout-indicator-group` | 中     | 🟡 组合可用 | 3.6  | 15 min |
| 4   | `nine-grid`                   | 中     | 🟡 组合可用 | 3.5  | 8 min  |
| 5   | `scene-over-view-hlj`         | 高     | 🟡 组合可用 | 3.2  | 25 min |
| 6   | `telescoping-board`           | 中     | 🟡 组合可用 | 3.5  | 12 min |

### 8 个地图

| #   | 物料                     | 复杂度 | 评级        | 分数 | 搭建    |
| --- | ------------------------ | ------ | ----------- | ---- | ------- |
| 1   | `baidu-map`              | 中     | 🟡 组合可用 | 3.6  | 30 min  |
| 2   | `baidu-map-unicom`       | 中     | 🟡 组合可用 | 3.2  | 30 min  |
| 3   | `geo-3d-map`             | 高     | 🟡 组合可用 | 3.5  | 120 min |
| 4   | `geo-cascader`           | 中     | 🟡 组合可用 | 3.5  | 15 min  |
| 5   | `oss-chart-classify-map` | 高     | 🟡 组合可用 | 3.4  | 90 min  |
| 6   | `oss-chart-fly-line-map` | 中高   | 🟡 组合可用 | 3.5  | 60 min  |
| 7   | `oss-chart-map`          | 高     | 🟡 组合可用 | 3.6  | 90 min  |
| 8   | `oss-gis`                | 高     | 🟡 组合可用 | 3.7  | 90 min  |

### 第六批核心发现

1. **8 个地图分 4 大技术栈**：百度系 / 3D系（Three.js）/ ECharts系 / GIS系（OpenLayers）
2. **oss-chart-map 与 oss-chart-classify-map 高度同源**（都支持 path+scatter+lines），但 oss-chart-map 多指标点位（item_xx）能力更强
3. **6 个容器/布局几乎全部"位置+坐标"驱动**（MonacoEditor 模式），业务定制程度高
4. **4 个数字/指标卡严重重复**（business-quality / business-scale / indicator-display / digital-card / number-level-indicate 80% 同源），建议合并
5. **`dataType: "String"` 普遍错标**：8 个地图 + 6 个容器/布局 + 4 个数字卡的 number 字段全部声明为 String
6. **5+1 文档严重缺失**（第六批 18/18 缺 5+1）
7. **静态资源强依赖**：baidu-map 图标按 neType+alarmLevel 组织 / geo-3d-map GeoJSON+纹理 / geo-cascader / oss-gis 需 map-config.json
8. **baidu-map 与 baidu-map-unicom 高度同质**：差异仅在 React 组件 vs 命令式 BMapGL
9. **geo-cascader + geo-3d-map 是黄金组合**：区域切换 + 3D 展示联动
10. **oss-gis 能力最强但复杂度也最高**：5 种瓦片 + 双层图例 + 5+ 配置子项

## 第五批画像 · 完成情况（23/23 ✅）

| #   | 物料                               | 复杂度 | 评级        | 分数 | 搭建   |
| --- | ---------------------------------- | ------ | ----------- | ---- | ------ |
| 1   | `oss-chart-plots-area`             | 中     | 🟡 组合可用 | 3.6  | 6 min  |
| 2   | `oss-chart-plots-bar`              | 中     | 🟡 组合可用 | 3.7  | 5 min  |
| 3   | `oss-chart-plots-base-area`        | 中     | 🟡 组合可用 | 3.6  | 7 min  |
| 4   | `oss-chart-plots-base-scatter`     | 中     | 🟡 组合可用 | 3.6  | 8 min  |
| 5   | `oss-chart-plots-column`           | 中     | 🟢 独立优秀 | 4.0  | 5 min  |
| 6   | `oss-chart-plots-double-gauge`     | 中     | 🟡 组合可用 | 3.5  | 8 min  |
| 7   | `oss-chart-plots-dual-axes`        | 中高   | 🟡 组合可用 | 3.5  | 10 min |
| 8   | `oss-chart-plots-dual-column-line` | 高     | 🟢 独立优秀 | 4.0  | 15 min |
| 9   | `oss-chart-plots-funnel`           | 中     | 🟡 组合可用 | 3.5  | 6 min  |
| 10  | `oss-chart-plots-gauge`            | 中     | 🟡 组合可用 | 3.4  | 5 min  |
| 11  | `oss-chart-plots-histogram`        | 中     | 🟡 组合可用 | 3.5  | 5 min  |
| 12  | `oss-chart-plots-line`             | 中     | 🟡 组合可用 | 3.6  | 5 min  |
| 13  | `oss-chart-plots-liquid`           | 中     | 🟡 组合可用 | 3.5  | 5 min  |
| 14  | `oss-chart-plots-pie`              | 中     | 🟢 独立优秀 | 4.0  | 5 min  |
| 15  | `oss-chart-plots-radar`            | 中     | 🟡 组合可用 | 3.5  | 7 min  |
| 16  | `oss-chart-plots-rose`             | 中     | 🟡 组合可用 | 3.6  | 5 min  |
| 17  | `oss-chart-plots-sankey`           | 中     | 🟡 组合可用 | 3.6  | 7 min  |
| 18  | `oss-chart-plots-series-area`      | 高     | 🟢 独立优秀 | 4.0  | 18 min |
| 19  | `oss-chart-plots-series-bar`       | 中     | 🟡 组合可用 | 3.5  | 7 min  |
| 20  | `oss-chart-plots-series-column`    | 中高   | 🟢 独立优秀 | 4.0  | 12 min |
| 21  | `oss-chart-plots-stack-bar`        | 中     | 🟡 组合可用 | 3.5  | 7 min  |
| 22  | `oss-chart-plots-stack-column`     | 中高   | 🟢 独立优秀 | 4.0  | 10 min |
| 23  | `oss-chart-plots-word-cloud`       | 中     | 🟡 组合可用 | 3.4  | 5 min  |

### 第五批核心发现

1. **oss-chart-plots 系列高同源**（23 个物料共用 `PLOTS_SCHEMA` + `withPlotRender` HOC + `@fedx-vis/plots`）：区别仅在 plotType + 特定配置（indicatorPointer/annotations/label/isStack/isPercent）
2. **schema 独立性已确认**（用户 2026-06-17 反馈）：即使 80% 同源也保持独立 schema 不共享 import，避免一处修改多处问题
3. **隐式字段普遍**（21/23 有隐式字段问题）：`compareType` / `s` / `indicator_unit` / `minRange` / `maxRange` / `indicator_id` 全部隐式
4. **plot_type vs chartType 双层抽象**：基础类（area/line/bar/column）单 plotType；dual-\* / column 类 9 种 chartType 组合
5. **5+1 文档覆盖差异**：9/23 有 5+1（base-area / base-scatter / double-gauge / dual-axes / dual-column-line / liquid / sankey / series-area / stack-column）；14/23 缺
6. **指标 ID 体系不统一**：`dimension_name` / `indicator_value` 业务化 vs `x` / `y` / `s` 底层字段混用
7. **复杂 schema 拆分**：`series-area` 拆为 `schema-parts/indicatorPointer.ts`，架构合理可参考
8. **6 个独立优秀物料**（4.0 分）：column / dual-column-line / pie / series-area / series-column / stack-column
9. **静态资源依赖**：`word-cloud` 自定义图片 mask

## 第四批画像 · 完成情况（9/9 ✅）

| #   | 物料                                | 复杂度 | 评级        | 分数 | 搭建   |
| --- | ----------------------------------- | ------ | ----------- | ---- | ------ |
| 1   | `circular-column`                   | 中高   | 🟢 独立优秀 | 4.0  | 5 min  |
| 2   | `cone-bar`                          | 中     | 🟡 组合可用 | 3.6  | 6 min  |
| 3   | `cone-bar-line`                     | 高     | 🟢 独立优秀 | 4.0  | 8 min  |
| 4   | `cone-single-bar`                   | 中     | 🟡 组合可用 | 3.5  | 5 min  |
| 5   | `dual-axes-chart`                   | 高     | 🟡 组合可用 | 3.5  | 20 min |
| 6   | `echarts-gauge`                     | 极高   | 🟢 独立优秀 | 4.0  | 30 min |
| 7   | `echarts-liquid`                    | 中     | 🟡 组合可用 | 3.4  | 5 min  |
| 8   | `echarts-multi-variable-area-chart` | 极高   | 🟢 独立优秀 | 4.0  | 15 min |
| 9   | `ind-list-echarts-gauge`            | 极高   | 🟢 独立优秀 | 4.0  | 20 min |

### 第四批核心发现

1. **schema 不共享原则已确认**（用户 2026-06-17 反馈）：即使物料 schema 80% 重复（如 4 个排名类、4 个锥形柱类），每个物料保持独立 schema。原因：import 共享会导致一处修改多处问题。
2. **dataModel 字段与代码读取不一致**普遍（9/9 中 5 个）：`circular-column` / `cone-bar` / `cone-bar-line` / `cone-single-bar` 字段名 s/x/y 在 JSON 中是 String 但实际是 Number
3. **schema 拆分**（2 个）：`echarts-multi-variable-area-chart` 拆为 `schema-part/*` 多文件；`cone-bar-line` 引入 `schema-parts/defaultValue`
4. **复杂 schema**：`dual-axes-chart` 200KB+ / `echarts-gauge` / `ind-list-echarts-gauge` 是配置体验差的代表
5. **外部依赖**：`echarts-gauge` / `echarts-multi-variable-area-chart` / `ind-list-echarts-gauge` 依赖 `@fedx-vis/designer-types` 和 `@fedx-vis/react-echarts`（外部包）
6. **静态资源依赖**：`ind-list-echarts-gauge` 依赖 `static/images/ind-list-echarts-gauge/item-bg.png` 和 `default-bg.png`
7. **隐式字段**：`cone-single-bar` schema 声明 s 字段但代码读 unit；`echarts-gauge` data 直接覆盖到 config 是隐式约定

## 第三批画像 · 完成情况（13/13 ✅）

| #   | 物料                | 复杂度 | 评级        | 分数 | 搭建   |
| --- | ------------------- | ------ | ----------- | ---- | ------ |
| 1   | `carousel-list`     | 中     | 🟡 组合可用 | 3.7  | 12 min |
| 2   | `carousel-notice`   | 中     | 🟡 组合可用 | 3.8  | 8 min  |
| 3   | `carousel-param`    | 中     | 🟡 组合可用 | 3.6  | 10 min |
| 4   | `equip-list`        | 中     | 🟡 组合可用 | 3.5  | 10 min |
| 5   | `hot-app-top5`      | 中     | 🟡 组合可用 | 3.9  | 10 min |
| 6   | `monitor-topn-list` | 中     | 🟡 组合可用 | 3.7  | 12 min |
| 7   | `progress-list`     | 中高   | 🟡 组合可用 | 3.7  | 10 min |
| 8   | `top-rank-shaanxi`  | 中     | 🟡 组合可用 | 3.4  | 10 min |
| 9   | `topn-rank`         | 中     | 🟡 组合可用 | 3.5  | 12 min |
| 10  | `topn-rank-one`     | 中     | 🟡 组合可用 | 3.7  | 10 min |
| 11  | `tree-list`         | 中高   | 🟢 独立优秀 | 4.0  | 15 min |
| 12  | `vertical-list`     | 简单   | 🟡 组合可用 | 3.4  | 5 min  |
| 13  | `top-rank`（已有）  | 简单   | 🟡 组合可用 | 3.4  | 5 min  |

### 第三批核心发现

1. **排名类物料严重重复**（top-rank / top-rank-shaanxi / topn-rank / topn-rank-one）— 4 个 schema 80% 重复，建议合并
2. **隐式字段普遍**（13 个物料中 8 个有隐式字段问题）— carousel-notice `time` / tree-list `param1~5` / vertical-list `dataModel` header 全空
3. **静态资源强依赖**（3 个物料）— carousel-list jingyu-_.png / carousel-notice background-_.png / carousel-param 5 张内置图
4. **doc_completeness 普遍偏低**（13/13 缺 5+1 文档）

## 下一步可选（按价值排序）

### 选项 A：跑通更多组合方案示范

**目标**：再选 2-3 个真实场景，输出方案卡片，验证 `composition-rules.md` 的复用性

**步骤**：

1. 选业务场景（候选：设备监控、运营驾驶舱、应急指挥、智慧城市、机房管理）
2. 关键词提取 → 候选池匹配
3. 加载候选物料的画像
4. 计算组合代价
5. 输出方案卡片

**前置条件**：✅ 已用 `sales-dashboard` 试通

**已完成示范**：`examples/sales-dashboard.md`

**待示范**：

-   设备监控（候选：table + echarts-gauge + digital-flop + 状态指示）
-   应急指挥（候选：echarts-map + digital-card + carousel-notice）
-   运营驾驶舱（候选：多个数字卡 + 多图表 + 自由布局容器）
-   机房管理（候选：tree-list + echarts-map + vertical-list）—— 可基于第三批新画像
-   业务 TopN 大盘（候选：topn-rank-one + digital-flop + pagination-display）—— 可基于第三批新画像
-   oss-chart-plots 大盘（候选：oss-chart-plots-series-area + oss-chart-plots-pie + topn-rank-one）—— 可基于第五批新画像

### 选项 B：第七-十批画像（继续扩大覆盖）✅ 已完成

**目标**：把覆盖率从 53.2% 提升到 85.1%

**已完成**：

-   ✅ 表格全做（10 个）
-   ✅ 列表/排行全做（13 个）
-   ✅ 图表 ECharts 全做（12 个）
-   ✅ oss-chart-plots 全做（23 个）
-   ✅ 数字/指标卡全做（7 个）
-   ✅ 容器/布局全做（8 个）
-   ✅ 地图全做（8 个）
-   ✅ 第七批 20 个（3D/拓扑 + 时钟/动画 + 媒体/播放 + 进度/加载 + 其他）
-   ✅ 第八批 17 个（状态/标签 + 表单/筛选 + 按钮/操作 + 文本/标签/标题）
-   ✅ 第九批 5 个（轮播/公告）
-   ✅ 第十批 7 个（其他 + 装饰汇总，24 个边框/装饰合并为 decoration-family）

**实际产出**：49 个新画像 JSON（131 总画像 / 154 物料 = 85.1%）

**剩余 23 个**：border1-12 + decoration1-11 = 23 个纯样式边框/装饰，已通过 decoration-family.json 合并覆盖，无需单独画像。

### 选项 C：把 advisor 接入实际使用

**目标**：让 PM/研发能查询物料能力

**已完成**：

-   ✅ `examples/sales-dashboard.md` 销售大盘示范
-   ✅ `FAQ.md` 16 个 PM 常见问题

**待办**：

-   写更多场景示范（设备监控、应急指挥、运营驾驶舱、机房管理、业务 TopN 大盘、oss-chart-plots 大盘）
-   把 advisor 的"查询"流程封装成 1 个可复用 prompt
-   接入到 `phoenix` 设计器侧边栏

### 选项 D：扩展 advisor 能力

-   **D1**：成本估算器增强 — 接入真实项目数据校准
-   **D2**：反向回写物料改进建议 — `profiles/*/_validation_notes` → 评审报告
-   **D3**：建立物料质量看板 — 评级分布、短板物料 Top 10
-   **D4**：自动校验 schema.ts 修改 — diff 出来看画像哪些字段变了
-   **D5**（基于第三批发现）：推动 4 个排名类物料合并为 1 个 + 4 种皮肤 — **已废弃**（用户 2026-06-17 反馈：物料 schema 应保持独立）
-   **D6**（基于第五批发现）：基于 oss-chart-plots 23 个画像输出 `oss-chart-plots-选型决策树.md`，辅助 PM 快速决策
-   **D7**（基于第六批发现）：基于 8 个地图画像输出 `地图选型决策树.md`（4 大技术栈：百度系/3D系/ECharts系/GIS系）
-   **D8**（基于第六批发现）：推动 4 个数字/指标卡（business-quality/business-scale/indicator-display/number-level-indicate）合并为 1 个 indicator-card + 4 种皮肤（**注**：与 D5 一样，schema 保持独立，合并建议仅在 advisor 维度提出）
-   **D9**（基于第七批发现）：基于 6 个 3D/拓扑画像输出 `3D-拓扑选型决策树.md`（4 大引擎：echarts-gl/fedx-3d/twaver/Three.js）
-   **D10**（基于第十批发现）：完成 24 个边框/装饰物料的合并画像 `decoration-family.json`（24 变体枚举），由 advisor 维度统一推荐，物料 schema 保持独立

## 智能体切换 / 任务恢复指南

> 当你接手 advisor 相关任务时，按以下顺序读取：

1. **本文件** `ROADMAP.md` — 了解"做到哪了"和"接下来做什么"
2. **`SKILL.md`** — 了解 advisor 是什么、4 个任务（A/B/C/D）做什么
3. **`materials-catalog.md`** — 了解 154 个物料的当前状态（画像覆盖 + 评级）
4. **`profiles/README.md`** — 了解 131 个已画像的详情（第一批 11 + 第二批 9 + 第三批 12 + 第四批 9 + 第五批 23 + 第六批 18 + 第七批 20 + 第八批 17 + 第九批 5 + 第十批 7）
5. **`FAQ.md`** — 看 PM 视角的常见问题
6. **`examples/sales-dashboard.md`** — 看完整的组合方案示范
7. **按需读 references/** — 做具体任务时再读对应规则文档

## 关键约束（不能违反）

| 约束                                  | 原因                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **只读 `src/packages/**`\*\*          | advisor 是评估者，永远不改物料代码                                                            |
| **JSON 严格合法**                     | 画像是结构化数据，每次产出后用 `node -e "JSON.parse(require('fs').readFileSync('...'))"` 验证 |
| **画像字段必须齐全**                  | 参考 `profiles/echarts-bar.json` 的字段，缺一不可                                             |
| **评级 6 维权重 30/20/15/15/10/10**   | 在 `references/rating-rules.md` 定义，不可临时改                                              |
| **场景数量 ≥ 3**                      | 业务场景列表至少 3 个，PM 看了能懂                                                            |
| **`_validation_notes` 必填**          | 关键坑点，不能空                                                                              |
| **JSON 中禁用中文全角双引号 `"..."`** | 5.0 出现 bar.json 全角引号导致 JSON.parse 失败，改用「」或中文单引号`''`或转义                |
| **schema 保持独立**                   | 即使 80% 同源也不共享 import（用户 2026-06-17 反馈）                                          |

## 命名规范

| 类型     | 规则                           | 示例                          |
| -------- | ------------------------------ | ----------------------------- |
| 画像文件 | `{kebab-case-name}.json`       | `echarts-bar.json`            |
| 文档     | 中文文件名                     | `materials-catalog.md`        |
| 规则文档 | `references/{kebab-case}.md`   | `references/rating-rules.md`  |
| 脚本     | `gen-xxx.js` / `verify-xxx.js` | `gen-catalog.js`              |
| 示例     | `examples/{场景名}.md`         | `examples/sales-dashboard.md` |
| FAQ      | `FAQ.md`                       | `FAQ.md`                      |

## 进度更新规则

每完成一项工作，必须更新：

1. 本文件（ROADMAP.md）的"已完成"和"画像覆盖率"
2. `materials-catalog.md` 的总览统计（如有新增画像）
3. 同步在会话内的 TodoWrite

## 联系与上下文

-   用户关注点：单物料 = 优秀，组合 ≤3 = 一般（仍要好用）
-   目标用户：产品经理（选型）+ 研发（评估）
-   当前没有预设业务场景模板（用户尚未提供）
-   schema 独立性原则（2026-06-17 确认）：物料 schema 永远独立，即使 80% 同源也不共享 import
