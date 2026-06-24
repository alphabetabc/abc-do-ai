---
title: 物料画像索引
description: oss-vis-material-advisor 已生成的 131 个物料画像索引（含第七-十批 3D/拓扑 + 时钟/动画 + 媒体/播放 + 进度/加载 + 表单/筛选 + 按钮/操作 + 状态/标签 + 其他 + 装饰汇总），按分类组织
version: 0.8
last_updated: 2026-06-22
---

# 物料画像索引

本目录维护已生成的物料能力画像 JSON。每个画像描述该物料的：

-   基础信息（入口、文件、复杂度）
-   能力（数据格式、交互、视觉配置、默认值）
-   业务场景、可组合性
-   **6 维评分 + 评级 + 标签**
-   搭建成本（3 档：minimal/typical/full）

## 总览（131 个画像 / 154 物料，覆盖率 85.1%）

> 完整画像清单见本目录 `*.json` 文件。下方表格展示首批至第六批关键画像；第七-十批新增物料详见对应章节。

| 物料 | 分类 | 评级 | 分数 | 标签 | 搭建（minimal） | 5+1 文档 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [echarts-bar](./echarts-bar.json) | 图表/ECharts | A | 4.2 | 🟢 独立优秀 | 6 min | ✅ | 首批样例，多系列+下钻 |
| [echarts-pie](./echarts-pie.json) | 图表/ECharts | A | 4.3 | 🟢 独立优秀 | 7 min | ✅ | 饼/环/玫瑰图 |
| [echarts-map](./echarts-map.json) | 地图 | B | 3.7 | 🟡 组合可用 | 15 min | ❌ | 省-地市下钻，4 套指标+4 套级别 |
| [digital-flop](./digital-flop.json) | 数字/指标卡 | A | 4.0 | 🟢 独立优秀 | 8 min | ✅ | TWEEN 动画 + 4 种下钻 |
| [digital-card](./digital-card.json) | 数字/指标卡 | B | 3.4 | 🟡 组合可用 | 5 min | ✅ | 渐变背景 + 左边框装饰 |
| [bidirectional-progress](./bidirectional-progress.json) | 进度/加载 | A | 4.0 | 🟢 独立优秀 | 10 min | ✅ | 双向进度 + 渐变色 + 斜线背景 |
| [normal-label](./normal-label.json) | 文本/标签/标题 | A | 4.0 | 🟢 独立优秀 | 2 min | ✅ | 纯文本展示 |
| [free-layout-indicators-viewer](./free-layout-indicators-viewer.json) | 容器/布局 | B | 3.5 | 🟡 组合可用 | 25 min | ✅ | MonacoEditor 坐标点 + 渐变背景 |
| [dock-menu](./dock-menu.json) | 容器/布局 | B | 3.5 | 🟡 组合可用 | 15 min | ✅ | hover 展开侧边菜单 + 热区 |
| [table](./table.json) | 表格 | B | 3.8 | 🟡 组合可用 | 5 min | ❌ | 5 种 contentShowType + 3 种点击 |
| [drilldown-table](./drilldown-table.json) | 表格 | B | 4.0 | 🟡 组合可用 | 25 min | ❌ | 表格 + Modal 下钻 + 轮播 + 更多 |
| [drilldown-table-2](./drilldown-table-2.json) | 表格 | B | 3.8 | 🟡 组合可用 | 22 min | ❌ | 同上 + 6 种 dynamicEvent 效果 |
| [expandable-table](./expandable-table.json) | 表格 | A | 4.2 | 🟢 独立优秀 | 15 min | ❌ | 父子层级 + 4 种 contentShowType |
| [pagination-table](./pagination-table.json) | 表格 | A | 4.2 | 🟢 独立优秀 | 15 min | ❌ | 服务端分页 + 排序 + 主题切换 |
| [table-detail](./table-detail.json) | 表格 | A | 4.0 | 🟢 独立优秀 | 12 min | ❌ | ProTable + useViewItemDataPagination |
| [table-fixedColumns](./table-fixedColumns.json) | 表格 | A | 4.3 | 🟢 独立优秀 | 12 min | ❌ | 固定列 + 显隐控制 + 复杂过滤 |
| [table-transpose](./table-transpose.json) | 表格 | B | 3.6 | 🟡 组合可用 | 12 min | ❌ | 转置表格 + 翻牌器 + 枚举值 |
| [transfer-table](./transfer-table.json) | 表格 | B | 3.7 | 🟡 组合可用 | 15 min | ❌ | 表格穿梭框 + 搜索 + 保存 |
| [alarm-window-card](./alarm-window-card.json) | 告警 | A | 4.1 | 🟢 独立优秀 | 15 min | ❌ | 订阅告警流水窗 + 8 个订阅参数 + 3 种皮肤 |
| [top-rank](./top-rank.json) | 列表/排行 | B | 3.4 | 🟡 组合可用 | 5 min | ❌ | 纯展示，⚠️ doc/code 不一致 |
| [top-rank-shaanxi](./top-rank-shaanxi.json) | 列表/排行 | B | 3.4 | 🟡 组合可用 | 10 min | ❌ | topN 排名陕西变体，前 3 斜体 |
| [topn-rank](./topn-rank.json) | 列表/排行 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 顶部 title + 渐变/纯色双模式 + 4 角装饰序号 |
| [topn-rank-one](./topn-rank-one.json) | 列表/排行 | B | 3.7 | 🟡 组合可用 | 10 min | ❌ | 渐变 3 色 + NO.x 序号 + topNumber 订阅 |
| [tree-list](./tree-list.json) | 列表/排行 | A | 4.0 | 🟢 独立优秀 | 15 min | ❌ | 多级树 + 复选 + 8 字段派发 + 图标切换 |
| [vertical-list](./vertical-list.json) | 列表/排行 | B | 3.4 | 🟡 组合可用 | 5 min | ❌ | 极简键值对详情面板 |
| [progress-list](./progress-list.json) | 列表/排行 | B | 3.7 | 🟡 组合可用 | 10 min | ❌ | 进度条 + level 多色 + 阶梯状 |
| [carousel-list](./carousel-list.json) | 列表/排行 | B | 3.7 | 🟡 组合可用 | 12 min | ❌ | 垂直轮播列表 + 索引高亮 |
| [carousel-notice](./carousel-notice.json) | 列表/排行 | B | 3.8 | 🟡 组合可用 | 8 min | ❌ | 滚动公告 + 静态背景图 |
| [carousel-param](./carousel-param.json) | 列表/排行 | B | 3.6 | 🟡 组合可用 | 10 min | ❌ | 轮播按钮派发参数 |
| [equip-list](./equip-list.json) | 列表/排行 | B | 3.5 | 🟡 组合可用 | 10 min | ❌ | 电表信息组件 + 多语言 |
| [hot-app-top5](./hot-app-top5.json) | 列表/排行 | B | 3.9 | 🟡 组合可用 | 10 min | ❌ | 热门 APP TOP5 + 圆角图标 + 点击派发 |
| [monitor-topn-list](./monitor-topn-list.json) | 列表/排行 | B | 3.7 | 🟡 组合可用 | 12 min | ❌ | 热门场景 Top + 4 字段派发 |
| [circular-column](./circular-column.json) | 图表/ECharts | A | 4.0 | 🟢 独立优秀 | 5 min | ✅ | 圆环柱状图，4 维度环 |
| [cone-bar](./cone-bar.json) | 图表/ECharts | B | 3.6 | 🟡 组合可用 | 6 min | ✅ | 锥形条形图，色阶对比 |
| [cone-bar-line](./cone-bar-line.json) | 图表/ECharts | A | 4.0 | 🟢 独立优秀 | 8 min | ✅ | 锥形+折线复合图 |
| [cone-single-bar](./cone-single-bar.json) | 图表/ECharts | B | 3.5 | 🟡 组合可用 | 5 min | ✅ | 单条锥形 KPI |
| [dual-axes-chart](./dual-axes-chart.json) | 图表/ECharts | B | 3.5 | 🟡 组合可用 | 20 min | ❌ | 双轴图，柱+线+面积三合一 |
| [echarts-gauge](./echarts-gauge.json) | 图表/ECharts | A | 4.0 | 🟢 独立优秀 | 30 min | ✅ | 仪表盘，3 渐变 + 8 段色 |
| [echarts-liquid](./echarts-liquid.json) | 图表/ECharts | B | 3.4 | 🟡 组合可用 | 5 min | ✅ | 水球图 |
| [echarts-multi-variable-area-chart](./echarts-multi-variable-area-chart.json) | 图表/ECharts | A | 4.0 | 🟢 独立优秀 | 15 min | ✅ | 多变量面积，schema 拆分 |
| [ind-list-echarts-gauge](./ind-list-echarts-gauge.json) | 图表/ECharts | A | 4.0 | 🟢 独立优秀 | 20 min | ✅ | 指标列表 + 仪表 |
| [oss-chart-plots-area](./oss-chart-plots-area.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 6 min | ❌ | 单/多系列面积，PLOTS_SCHEMA 共享 |
| [oss-chart-plots-bar](./oss-chart-plots-bar.json) | 图表/oss-chart-plots | B | 3.7 | 🟡 组合可用 | 5 min | ❌ | 基础条形图，180+ 行 schema 死代码 |
| [oss-chart-plots-base-area](./oss-chart-plots-base-area.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 7 min | ✅ | 基础面积 + lineStyle + smooth |
| [oss-chart-plots-base-scatter](./oss-chart-plots-base-scatter.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 8 min | ✅ | 基础散点，4 象限 + 4 趋势线 |
| [oss-chart-plots-column](./oss-chart-plots-column.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 5 min | ❌ | 基础柱状图，9 种 type |
| [oss-chart-plots-double-gauge](./oss-chart-plots-double-gauge.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 8 min | ✅ | 双仪表，2 渐变 + 8 段色 |
| [oss-chart-plots-dual-axes](./oss-chart-plots-dual-axes.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 10 min | ✅ | 双轴 9 组合 |
| [oss-chart-plots-dual-column-line](./oss-chart-plots-dual-column-line.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 15 min | ✅ | 柱+线双轴，9 type + 标注/线/区域 |
| [oss-chart-plots-funnel](./oss-chart-plots-funnel.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 6 min | ❌ | 漏斗图，对比 + dynamicHeight |
| [oss-chart-plots-gauge](./oss-chart-plots-gauge.json) | 图表/oss-chart-plots | B | 3.4 | 🟡 组合可用 | 5 min | ❌ | 单仪表，8 段色 + 3 渐变 |
| [oss-chart-plots-histogram](./oss-chart-plots-histogram.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 5 min | ❌ | 柱状分布图，stack |
| [oss-chart-plots-line](./oss-chart-plots-line.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 5 min | ❌ | 折线图，smooth + point |
| [oss-chart-plots-liquid](./oss-chart-plots-liquid.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 5 min | ✅ | 水球图，自定义 config |
| [oss-chart-plots-pie](./oss-chart-plots-pie.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 5 min | ❌ | 饼/环/玫瑰，innerRadius |
| [oss-chart-plots-radar](./oss-chart-plots-radar.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 7 min | ❌ | 雷达图，3 shape |
| [oss-chart-plots-rose](./oss-chart-plots-rose.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 5 min | ❌ | 玫瑰图，group + stack |
| [oss-chart-plots-sankey](./oss-chart-plots-sankey.json) | 图表/oss-chart-plots | B | 3.6 | 🟡 组合可用 | 7 min | ✅ | 桑基图，自定义样式 |
| [oss-chart-plots-series-area](./oss-chart-plots-series-area.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 18 min | ✅ | 多系列堆叠面积，indicatorPointer |
| [oss-chart-plots-series-bar](./oss-chart-plots-series-bar.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 7 min | ❌ | 多系列条形，group + stack |
| [oss-chart-plots-series-column](./oss-chart-plots-series-column.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 12 min | ❌ | 多系列柱状，group + stack |
| [oss-chart-plots-stack-bar](./oss-chart-plots-stack-bar.json) | 图表/oss-chart-plots | B | 3.5 | 🟡 组合可用 | 7 min | ❌ | 堆叠条形 |
| [oss-chart-plots-stack-column](./oss-chart-plots-stack-column.json) | 图表/oss-chart-plots | A | 4.0 | 🟢 独立优秀 | 10 min | ✅ | 堆叠柱状，group + percent |
| [oss-chart-plots-word-cloud](./oss-chart-plots-word-cloud.json) | 图表/oss-chart-plots | B | 3.4 | 🟡 组合可用 | 5 min | ❌ | 词云图，自定义图片 mask |
| [business-quality](./business-quality.json) | 数字/指标卡 | B | 3.4 | 🟡 组合可用 | 8 min | ❌ | 玉珏图数字卡 + 8 字段指标 |
| [business-scale](./business-scale.json) | 数字/指标卡 | B | 3.5 | 🟡 组合可用 | 6 min | ❌ | 业务规模卡 + 标签/数值双区 |
| [indicator-display](./indicator-display.json) | 数字/指标卡 | B | 3.5 | 🟡 组合可用 | 5 min | ❌ | 纯指标展示卡 |
| [number-level-indicate](./number-level-indicate.json) | 数字/指标卡 | B | 3.4 | 🟡 组合可用 | 6 min | ❌ | 数值级别指示器 + threshold |
| [ellipse-layout-indicator](./ellipse-layout-indicator.json) | 容器/布局 | B | 3.3 | 🟡 组合可用 | 15 min | ❌ | 椭圆布局指标组 |
| [free-layout-ind-progress](./free-layout-ind-progress.json) | 容器/布局 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 自由布局指标进度 |
| [free-layout-indicator-group](./free-layout-indicator-group.json) | 容器/布局 | B | 3.6 | 🟡 组合可用 | 15 min | ❌ | 自由排布指标组 + 轮播 |
| [nine-grid](./nine-grid.json) | 容器/布局 | B | 3.5 | 🟡 组合可用 | 8 min | ❌ | 文字标签九宫格 |
| [scene-over-view-hlj](./scene-over-view-hlj.json) | 容器/布局 | B | 3.2 | 🟡 组合可用 | 25 min | ❌ | 黑龙江场景概述（强定制） |
| [telescoping-board](./telescoping-board.json) | 容器/布局 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 伸缩组件 + 趋势 |
| [baidu-map](./baidu-map.json) | 地图 | B | 3.6 | 🟡 组合可用 | 30 min | ❌ | 百度地图 GIS 打点 |
| [baidu-map-unicom](./baidu-map-unicom.json) | 地图 | B | 3.2 | 🟡 组合可用 | 30 min | ❌ | 联通版 BMapGL 打点 |
| [geo-3d-map](./geo-3d-map.json) | 地图 | B | 3.5 | 🟡 组合可用 | 120 min | ❌ | 3D 立体地图（30+ 配置项） |
| [geo-cascader](./geo-cascader.json) | 地图 | B | 3.5 | 🟡 组合可用 | 15 min | ❌ | 省地市级联选择框 |
| [oss-chart-classify-map](./oss-chart-classify-map.json) | 地图 | B | 3.4 | 🟡 组合可用 | 90 min | ❌ | 分类点线地图（path+scatter+lines） |
| [oss-chart-fly-line-map](./oss-chart-fly-line-map.json) | 地图 | B | 3.5 | 🟡 组合可用 | 60 min | ❌ | ECharts 飞线图 + 阈值配色 |
| [oss-chart-map](./oss-chart-map.json) | 地图 | B | 3.6 | 🟡 组合可用 | 90 min | ❌ | 基础平面地图（多图层+多指标） |
| [oss-gis](./oss-gis.json) | 地图 | B | 3.7 | 🟡 组合可用 | 90 min | ❌ | fedx-gis GIS 地图（多瓦片类型） |
| [echarts-3d-pie](./echarts-3d-pie.json) | 图表/ECharts | B | 3.5 | 🟡 组合可用 | 15 min | ❌ | echarts-gl 伪 3D 饼环 |
| [virtual-3d-column](./virtual-3d-column.json) | 图表/ECharts | B | 3.5 | 🟡 组合可用 | 20 min | ❌ | 圆/方/三角伪 3D 柱 |
| [virtual-3d-column-normal](./virtual-3d-column-normal.json) | 图表/ECharts | B | 3.3 | 🟡 组合可用 | 15 min | ❌ | 菱形伪 3D 柱 |
| [echarts-line-dual-x](./echarts-line-dual-x.json) | 图表/ECharts | B | 3.5 | 🟡 组合可用 | 25 min | ❌ | echarts 双 X 轴折线 |
| [smart-warehouse](./smart-warehouse.json) | 3D/拓扑 | B | 3.4 | 🟡 组合可用 | 180 min | ❌ | fedx-3d 智慧园区 |
| [twaver-topo](./twaver-topo.json) | 3D/拓扑 | B | 3.7 | 🟡 组合可用 | 60 min | ❌ | twaver 拓扑（15 种连线） |
| [levitated-sphere](./levitated-sphere.json) | 3D/拓扑 | B | 3.6 | 🟡 组合可用 | 25 min | ❌ | 拖拽悬浮球菜单 |
| [svg-render](./svg-render.json) | 3D/拓扑 | B | 3.0 | 🟡 组合可用 | 20 min | ❌ | SVG 按 level 渲染 |
| [normal-clock](./normal-clock.json) | 时钟/动画 | A | 4.0 | 🟢 独立优秀 | 5 min | ❌ | 12 种时间格式 + 整点传参 |
| [path-animation](./path-animation.json) | 时钟/动画 | B | 3.0 | 🟡 组合可用 | 20 min | ❌ | SVG 路径动画光标 |
| [weather-display](./weather-display.json) | 时钟/动画 | B | 3.3 | 🟡 组合可用 | 15 min | ❌ | 地市天气信息 |
| [carousel-image-list](./carousel-image-list.json) | 轮播/公告 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 水平图片轮播 |
| [video-playback](./video-playback.json) | 媒体/播放 | B | 3.0 | 🟡 组合可用 | 5 min | ❌ | 视频播放（flash/rtmp/m3u8） |
| [single-image](./single-image.json) | 媒体/播放 | B | 3.5 | 🟡 组合可用 | 8 min | ❌ | 单图（位图/SVG） |
| [iframe](./iframe.json) | 媒体/播放 | B | 3.4 | 🟡 组合可用 | 15 min | ❌ | iframe + 模板变量 |
| [visual-iframe](./visual-iframe.json) | 媒体/播放 | B | 3.5 | 🟡 组合可用 | 20 min | ❌ | iframe + 报警联动 |
| [render-stage-loader](./render-stage-loader.json) | 进度/加载 | B | 3.3 | 🟡 组合可用 | 90 min | ❌ | 孪生平台加载器 |
| [circular-progress](./circular-progress.json) | 进度/加载 | B | 3.5 | 🟡 组合可用 | 10 min | ❌ | 环形进度（单组） |
| [circular-progress-group](./circular-progress-group.json) | 进度/加载 | B | 3.6 | 🟡 组合可用 | 15 min | ❌ | 环形进度组（多组） |
| [progress-list-bar](./progress-list-bar.json) | 进度/加载 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 水平进度列表 |
| [normal-process](./normal-process.json) | 进度/加载 | B | 3.3 | 🟡 组合可用 | 10 min | ❌ | 环形进度（杨兴相版） |
| [range-picker](./range-picker.json) | 表单/筛选 | B | 3.4 | 🟡 组合可用 | 8 min | ❌ | 日期范围选择器 |
| [query-form-group](./query-form-group.json) | 表单/筛选 | B | 3.5 | 🟡 组合可用 | 20 min | ❌ | 搜索表单组 |
| [popover-check](./popover-check.json) | 表单/筛选 | B | 3.5 | 🟡 组合可用 | 8 min | ❌ | 下拉选择框 |
| [popover-checkparam](./popover-checkparam.json) | 表单/筛选 | B | 3.6 | 🟡 组合可用 | 10 min | ❌ | 下拉框（带 param） |
| [pagination-display](./pagination-display.json) | 表单/筛选 | B | 3.3 | 🟡 组合可用 | 8 min | ❌ | 基础分页 |
| [tab-list](./tab-list.json) | 表单/筛选 | B | 3.5 | 🟡 组合可用 | 15 min | ❌ | TAB 列表（带 icon） |
| [tab-list-2](./tab-list-2.json) | 表单/筛选 | B | 3.5 | 🟡 组合可用 | 10 min | ❌ | TAB 列表 2（带轮播） |
| [tab-list-arc](./tab-list-arc.json) | 表单/筛选 | B | 3.4 | 🟡 组合可用 | 18 min | ❌ | 弧形 TAB 列表 |
| [tab-list-static](./tab-list-static.json) | 表单/筛选 | B | 3.5 | 🟡 组合可用 | 18 min | ❌ | TAB 统计列表（双指标） |
| [ghost-btn](./ghost-btn.json) | 按钮/操作 | B | 3.4 | 🟡 组合可用 | 8 min | ❌ | 幽灵按钮 |
| [export-btn](./export-btn.json) | 按钮/操作 | B | 3.2 | 🟡 组合可用 | 15 min | ❌ | 导出按钮 |
| [custom-request-button](./custom-request-button.json) | 按钮/操作 | A | 4.0 | 🟢 独立优秀 | 10 min | ❌ | API 请求按钮 + 订阅 |
| [message-distribute](./message-distribute.json) | 按钮/操作 | B | 3.4 | 🟡 组合可用 | 20 min | ❌ | 短信派发 |
| [status-display](./status-display.json) | 状态/标签 | B | 3.4 | 🟡 组合可用 | 15 min | ❌ | 条件映射状态显示 |
| [zone-setting](./zone-setting.json) | 状态/标签 | B | 3.3 | 🟡 组合可用 | 20 min | ❌ | 应急资源区域 |
| [warning-board](./warning-board.json) | 数字/指标卡 | B | 3.6 | 🟡 组合可用 | 20 min | ❌ | 告警牌（分指标配置） |
| [area-business-vol](./area-business-vol.json) | 数字/指标卡 | B | 3.2 | 🟡 组合可用 | 10 min | ❌ | 区域业务量 |
| [stats-indi](./stats-indi.json) | 数字/指标卡 | B | 3.5 | 🟡 组合可用 | 10 min | ❌ | 指标翻牌器 |
| [stats-indi-group](./stats-indi-group.json) | 数字/指标卡 | B | 3.3 | 🟡 组合可用 | 18 min | ❌ | 翻牌器组（强定制 6 列） |
| [stats-indi-grid](./stats-indi-grid.json) | 数字/指标卡 | B | 3.3 | 🟡 组合可用 | 10 min | ❌ | 翻牌器栅格布局 |
| [top-n](./top-n.json) | 列表/排行 | B | 3.5 | 🟡 组合可用 | 12 min | ❌ | 通用 TOPN（双指标） |
| [description-table](./description-table.json) | 表格 | B | 3.3 | 🟡 组合可用 | 15 min | ❌ | 描述列表（工单详情） |
| [textarea-label](./textarea-label.json) | 文本/标签/标题 | B | 3.3 | 🟡 组合可用 | 5 min | ❌ | 文本域 |
| [label-text](./label-text.json) | 文本/标签/标题 | B | 3.2 | 🟡 组合可用 | 5 min | ❌ | 标题（带 icon） |
| [common-container](./common-container.json) | 装饰/边框 | B | 3.4 | 🟡 组合可用 | 10 min | ❌ | 通用模块容器 |
| [hexagon](./hexagon.json) | 装饰/边框 | B | 3.0 | 🟡 组合可用 | 3 min | ❌ | 六边形装饰 |
| [flash-point](./flash-point.json) | 装饰/边框 | B | 3.0 | 🟡 组合可用 | 3 min | ❌ | 闪点装饰 |
| [decoration-family](./decoration-family.json) | 装饰/边框 | B | 3.0 | 🟡 组合可用 | 3 min | ❌ | decoration1-12 + border1-12（24 个汇总） |

> 评级分布：**🟢 独立优秀 19 个**（14.5%）、**🟡 组合可用 112 个**（85.5%）、**🔴 组合复杂 0 个**、**⚫ 不建议 0 个**

## 按分类组织

### 图表/ECharts（12）

-   🟢 [echarts-bar](./echarts-bar.json) — 多系列条形图
-   🟢 [echarts-pie](./echarts-pie.json) — 饼/环/玫瑰图
-   🟢 [circular-column](./circular-column.json) — 圆环柱状图
-   🟡 [cone-bar](./cone-bar.json) — 锥形条形图
-   🟢 [cone-bar-line](./cone-bar-line.json) — 锥形+折线复合图
-   🟡 [cone-single-bar](./cone-single-bar.json) — 单条锥形 KPI
-   🟡 [dual-axes-chart](./dual-axes-chart.json) — 双轴图
-   🟢 [echarts-gauge](./echarts-gauge.json) — 仪表盘
-   🟡 [echarts-liquid](./echarts-liquid.json) — 水球图
-   🟢 [echarts-multi-variable-area-chart](./echarts-multi-variable-area-chart.json) — 多变量面积
-   🟢 [ind-list-echarts-gauge](./ind-list-echarts-gauge.json) — 指标列表 + 仪表

### 地图（9）

-   🟡 [echarts-map](./echarts-map.json) — 平面地图（下钻）
-   🟡 [baidu-map](./baidu-map.json) — 百度地图 GIS 打点
-   🟡 [baidu-map-unicom](./baidu-map-unicom.json) — 联通版 BMapGL 打点
-   🟡 [geo-3d-map](./geo-3d-map.json) — 3D 立体地图
-   🟡 [geo-cascader](./geo-cascader.json) — 省地市级联选择框
-   🟡 [oss-chart-classify-map](./oss-chart-classify-map.json) — 分类点线地图
-   🟡 [oss-chart-fly-line-map](./oss-chart-fly-line-map.json) — 飞线图
-   🟡 [oss-chart-map](./oss-chart-map.json) — 基础平面地图
-   🟡 [oss-gis](./oss-gis.json) — fedx-gis GIS 地图

### 数字/指标卡（6）

-   🟢 [digital-flop](./digital-flop.json) — 数字翻牌器
-   🟡 [digital-card](./digital-card.json) — 数字卡
-   🟡 [business-quality](./business-quality.json) — 玉珏图数字卡
-   🟡 [business-scale](./business-scale.json) — 业务规模卡
-   🟡 [indicator-display](./indicator-display.json) — 指标展示卡
-   🟡 [number-level-indicate](./number-level-indicate.json) — 数值级别指示

### 进度/加载（1）

-   🟢 [bidirectional-progress](./bidirectional-progress.json) — 双向进度

### 文本/标签/标题（1）

-   🟢 [normal-label](./normal-label.json) — 普通文本

### 容器/布局（8）

-   🟡 [free-layout-indicators-viewer](./free-layout-indicators-viewer.json) — 自由布局指标卡容器
-   🟡 [dock-menu](./dock-menu.json) — 侧边菜单
-   🟡 [ellipse-layout-indicator](./ellipse-layout-indicator.json) — 椭圆布局指标组
-   🟡 [free-layout-ind-progress](./free-layout-ind-progress.json) — 自由布局指标进度
-   🟡 [free-layout-indicator-group](./free-layout-indicator-group.json) — 自由排布指标组
-   🟡 [nine-grid](./nine-grid.json) — 文字标签九宫格
-   🟡 [scene-over-view-hlj](./scene-over-view-hlj.json) — 黑龙江场景概述
-   🟡 [telescoping-board](./telescoping-board.json) — 伸缩组件

### 表格（9）

-   🟡 [table](./table.json) — 通用表格
-   🟡 [drilldown-table](./drilldown-table.json) — 表格 + Modal 下钻 + 轮播 + 更多
-   🟡 [drilldown-table-2](./drilldown-table-2.json) — drilldown-table 升级版（事件总线）
-   🟢 [expandable-table](./expandable-table.json) — 父子层级 + 4 种列内容
-   🟢 [pagination-table](./pagination-table.json) — 服务端分页 + 排序 + 主题
-   🟢 [table-detail](./table-detail.json) — ProTable 明细 + useViewItemDataPagination
-   🟢 [table-fixedColumns](./table-fixedColumns.json) — 固定列 + 显隐控制
-   🟡 [table-transpose](./table-transpose.json) — 转置表格 + 翻牌器 + 枚举值
-   🟡 [transfer-table](./transfer-table.json) — 表格穿梭框 + 搜索 + 保存

### 告警（1）

-   🟢 [alarm-window-card](./alarm-window-card.json) — 订阅告警流水窗（与告警系统深度耦合）

### 列表/排行（13）

-   🟡 [top-rank](./top-rank.json) — 排名
-   🟡 [top-rank-shaanxi](./top-rank-shaanxi.json) — topN 排名陕西变体
-   🟡 [topn-rank](./topn-rank.json) — topn 排名 + 顶部 title + 4 角装饰
-   🟡 [topn-rank-one](./topn-rank-one.json) — 渐变 3 色 + 外部订阅 topNumber
-   🟢 [tree-list](./tree-list.json) — 多级树 + 复选 + 8 字段派发
-   🟡 [vertical-list](./vertical-list.json) — 极简键值对详情面板
-   🟡 [progress-list](./progress-list.json) — 进度条 + level 多色
-   🟡 [carousel-list](./carousel-list.json) — 垂直轮播列表
-   🟡 [carousel-notice](./carousel-notice.json) — 滚动公告
-   🟡 [carousel-param](./carousel-param.json) — 轮播按钮派发参数
-   🟡 [equip-list](./equip-list.json) — 电表信息组件
-   🟡 [hot-app-top5](./hot-app-top5.json) — 热门 APP TOP5
-   🟡 [monitor-topn-list](./monitor-topn-list.json) — 热门场景 Top

### 图表/oss-chart-plots（23）

-   🟡 [oss-chart-plots-area](./oss-chart-plots-area.json) — 单/多系列面积
-   🟡 [oss-chart-plots-bar](./oss-chart-plots-bar.json) — 基础条形
-   🟡 [oss-chart-plots-base-area](./oss-chart-plots-base-area.json) — 基础面积
-   🟡 [oss-chart-plots-base-scatter](./oss-chart-plots-base-scatter.json) — 基础散点 + 4 象限 + 4 趋势线
-   🟢 [oss-chart-plots-column](./oss-chart-plots-column.json) — 基础柱状（9 type）
-   🟡 [oss-chart-plots-double-gauge](./oss-chart-plots-double-gauge.json) — 双仪表
-   🟡 [oss-chart-plots-dual-axes](./oss-chart-plots-dual-axes.json) — 双轴 9 组合
-   🟢 [oss-chart-plots-dual-column-line](./oss-chart-plots-dual-column-line.json) — 柱+线双轴
-   🟡 [oss-chart-plots-funnel](./oss-chart-plots-funnel.json) — 漏斗
-   🟡 [oss-chart-plots-gauge](./oss-chart-plots-gauge.json) — 单仪表
-   🟡 [oss-chart-plots-histogram](./oss-chart-plots-histogram.json) — 柱状分布
-   🟡 [oss-chart-plots-line](./oss-chart-plots-line.json) — 折线
-   🟡 [oss-chart-plots-liquid](./oss-chart-plots-liquid.json) — 水球
-   🟢 [oss-chart-plots-pie](./oss-chart-plots-pie.json) — 饼/环/玫瑰
-   🟡 [oss-chart-plots-radar](./oss-chart-plots-radar.json) — 雷达
-   🟡 [oss-chart-plots-rose](./oss-chart-plots-rose.json) — 玫瑰
-   🟡 [oss-chart-plots-sankey](./oss-chart-plots-sankey.json) — 桑基
-   🟢 [oss-chart-plots-series-area](./oss-chart-plots-series-area.json) — 多系列堆叠面积（indicatorPointer）
-   🟡 [oss-chart-plots-series-bar](./oss-chart-plots-series-bar.json) — 多系列条形
-   🟢 [oss-chart-plots-series-column](./oss-chart-plots-series-column.json) — 多系列柱状
-   🟡 [oss-chart-plots-stack-bar](./oss-chart-plots-stack-bar.json) — 堆叠条形
-   🟢 [oss-chart-plots-stack-column](./oss-chart-plots-stack-column.json) — 堆叠柱状
-   🟡 [oss-chart-plots-word-cloud](./oss-chart-plots-word-cloud.json) — 词云

## 跨画像发现

### 通用问题

1. **`oss-material.json.dataModel` 普遍是空字符串**

    - 受影响：52/64（除 12 个无 dataModel.json 的物料外）
    - 实际 `dataModel.json` 文件存在且被 `schema.ts` 顶部 `import` 加载
    - **影响**：行为无影响（webpack 仍能找到），但物料元信息与实际不一致
    - **建议**：批量把 `dataModel` 字段改为 `"./dataModel.json"`

2. **`dataType: "String"` 普遍用于 number 字段**

    - 受影响：echarts-bar (indicatorValue)、echarts-map (value1~4, level1~4, num)、bidirectional-progress、free-layout-indicators-viewer、progress-list、topn-rank、topn-rank-one、monitor-topn-list、hot-app-top5 等 + 23 个 oss-chart-plots 中 18 个（area/bar/column/line/dual-\* 等的 indicator_value/minRange/maxRange）
    - **影响**：dataModel 是描述约定，实际数据可为 number，但 PM 看 dataModel 会误以为需要传字符串
    - **建议**：dataType 改为 `"Number"` 或拆出 `rowProperties: ["format", "number"]`

3. **5+1 文档严重缺失**

    - 有 5+1：25/64（echarts-bar / echarts-pie / digital-flop / digital-card / bidirectional-progress / normal-label / free-layout-indicators-viewer / dock-menu / circular-column / cone-bar / cone-bar-line / cone-single-bar / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge / oss-chart-plots-base-area / oss-chart-plots-base-scatter / oss-chart-plots-double-gauge / oss-chart-plots-dual-axes / oss-chart-plots-dual-column-line / oss-chart-plots-liquid / oss-chart-plots-sankey / oss-chart-plots-series-area / oss-chart-plots-stack-column）
    - 缺 5+1：39 个
    - **建议**：优先补 14 个 oss-chart-plots + 9 个表格 + 1 个告警 + 1 个地图 + 10 个 echarts- + 6 个数字/指标卡的 5+1 文档

4. **隐式字段普遍存在**（schema 未声明但代码读取）

    - digital-flop: `id`、`enableRemoveEndZero`、`fontSkew`
    - dock-menu: `DockItem.icon`
    - free-layout-indicators-viewer: `indicatorType`（已声明但未使用）
    - digital-card: `borderLeftColor`
    - pagination-table: 后端响应结构（data.data / data.columns / data.pagination）
    - table-fixedColumns: `rowKey`（用于派发事件 + 显隐控制）
    - carousel-list: `id`、`backgroundImage` 隐式
    - carousel-notice: `noticeId`、`noticeTitle`、`noticeContent` 隐式派发字段
    - hot-app-top5: `appIcon`（隐式从 url 字段提取）
    - topn-rank/topn-rank-one: `id` 声明但未消费
    - **oss-chart-plots 系列**（23 个中 18 个有隐式字段）：
        - `compareType` / `s` 字段（area/line/column/bar/dual-\* 多系列场景，dataModel 未声明）
        - `indicator_unit`（23 个中 15 个声明但代码未消费）
        - `minRange` / `maxRange`（代码从 data[0] 读，但 dataModel 未声明）
        - `dimension_name` 字段名（部分物料代码用 `x`）
    - **影响**：PM 配置时找不到字段，研发改字段时不知会改到隐式字段
    - **建议**：要么在 schema 显式声明，要么从代码移除

5. **静态资源强依赖**

    - free-layout-indicators-viewer: `default-bg.png`
    - dock-menu: ShaanxiUnicom 系列图
    - carousel-notice: 静态背景图（background-34.png 等）
    - oss-chart-plots/word-cloud: 自定义图片 mask
    - **影响**：重命名物料时必须同步 3 处（schema 引用 + 资源文件 + 物料目录名）
    - **建议**：在 gotchas.md 中记录资源依赖

6. **排名类物料严重重复**（top-rank / top-rank-shaanxi / topn-rank / topn-rank-one）

    - 4 个物料 schema 80% 重复，defaultValue 数据格式同构
    - 区别仅在：序号风格（圆点/角标/4 角/NO.x）+ itemsSet 字段 + 交互订阅
    - **影响**：PM 选型困难（不知该用哪个），维护成本 ×4
    - **建议**：合并为 1 个 `top-rank` 物料 + 4 种皮肤配置
    - **注**：用户已确认 schema 保持独立原则（合并建议仅在 advisor 维度提出，不在物料代码中执行）

7. **oss-chart-plots 系列高同源**（23 个物料，schema 80% 重复）

    - 23 个物料共用 `PLOTS_SCHEMA`（TITLE/AXIS_DIM/AXIS_IND/VALUE_LABEL/LEGEND/TOOLTIP/STYLE_STROKE/DATA_CFG/SCROLLBAR）
    - 23 个物料共用 `withPlotRender` HOC
    - 23 个物料共用 `@fedx-vis/plots` 图表库
    - 区别仅在：plotType + 特定配置（indicatorPointer/annotations/label/isStack/isPercent）
    - **影响**：PM 选型困难（不知该用 base-area 还是 area 还是 series-area），维护成本 ×23
    - **建议**：已在 advisor 维度给出 3 个 sub-cluster 选型指南（基础 / 多系列 / 堆叠/特殊）
    - **注**：用户已确认 schema 保持独立原则

8. **oss-chart-plots 与 echarts-\* 物料的选择混乱**
    - `echarts-pie`（来自 echarts-）vs `oss-chart-plots-pie`（来自 oss-chart-plots-）：两者都是饼图，配置项 80% 重叠
    - `echarts-gauge` vs `oss-chart-plots-gauge` / `oss-chart-plots-double-gauge`：3 种仪表盘
    - `echarts-multi-variable-area-chart` vs `oss-chart-plots-area` / `oss-chart-plots-base-area` / `oss-chart-plots-series-area`：4 种面积
    - **建议**：建立选型决策树（见 [composition-rules.md](../references/composition-rules.md)）

### 物料特定问题

| 物料 | 问题 | 严重度 |
| --- | --- | --- |
| echarts-bar | `data.id` 派发永远 undefined（dataModel 无 id 字段） | 高 |
| echarts-bar | `index.jsx` 孤儿文件（实现的是双轴图） | 中 |
| echarts-bar | `indicatorUnit` 声明但未消费 | 低 |
| echarts-map | `subValue1~4` 声明但 doc 未演示 | 中 |
| echarts-map | 物料自己接管数据请求，跨物料数据流需适配 | 高 |
| table | 无 dataModel，字段名由 schema 隐式决定 | 中 |
| table | drilldown-table/drilldown-table-2 直接 import，table 改动会影响所有衍生物料 | 高 |
| top-rank | doc 提到点击派发但代码未实现 | 高 |
| top-rank | doc 提到动画但代码无 | 中 |
| top-rank | doc 数据示例含 `rank` 字段但 dataModel 未声明 | 中 |
| top-rank-shaanxi | 与 top-rank 几乎同构，重复维护 | 高 |
| topn-rank | 4 个排名类物料 schema 80% 重复 | 高 |
| topn-rank | id 字段声明但代码未消费 | 中 |
| topn-rank-one | id 字段声明但代码未消费 | 中 |
| topn-rank-one | sortType 交互订阅声明但代码未消费 | 中 |
| topn-rank-one | getPercentage 反向计算（100 - percent + 20）业务背景需 PM 理解 | 中 |
| tree-list | dataModel selected_icon/unselected_icon 与 defaultValue icon1/icon2 不一致 | 高 |
| tree-list | param1~param5 字段未在 schema 声明但代码读取 | 高 |
| tree-list | nodeSelectedStyle 中 borderWidth/borderColor/borderRadius 字段被注释 | 中 |
| tree-list | useEffect 依赖项缺 nodeSelectedStyle | 低 |
| vertical-list | dataModel.json header.dimensions/indicators 全为空数组 | 高 |
| vertical-list | dataModel.json 中 name/title/description/author 全为空字符串 | 中 |
| vertical-list | listItemValue 配置组无 fontWeight 字段 | 低 |
| digital-card | 空 dataSource 无保护会崩溃 | 中 |
| free-layout-indicators-viewer | dataSource 缺项时该坐标点 return null 无 console.warn | 中 |
| drilldown-table | README 描述"树形展开"与实际 Modal 下钻不符 | 中 |
| drilldown-table | detailViewPageArgs 服务端单引号需手动 replace | 中 |
| drilldown-table-2 | schema 缺 detailView\* 字段定义（与 drilldown-table 不一致） | 中 |
| expandable-table | 自渲染整个表格，与 table 不可同区域 | 中 |
| expandable-table | 标题"下挂表格"与"expandable"语义不太匹配 | 低 |
| pagination-table | dataModel 自承"不足以描述"（结构留给 README） | 中 |
| pagination-table | 实际表体是私有 components/visual-table，非 import ../table | 中 |
| table-detail | onCheckChange 函数体是空实现（"暂时没有实现 check 这个功能"） | 中 |
| table-fixedColumns | settingVisible 内置 + 外部订阅显隐互斥 | 中 |
| table-fixedColumns | Modal 派发 activeColumnField / activeRowKeyField 需逗号分隔多值 | 低 |
| table-transpose | schema.ts 中 groupSet 表头组配置整段被注释（line 52-125），多列分组功能不可用 | 中 |
| table-transpose | dataModel 的 field1/field2/field3 是占位符，需在 schema columns.dataIndex 绑定真实字段 | 中 |
| transfer-table | transformFn 是 MonacoEditor 编辑的 JS 字符串，运行时 new Function() 执行（XSS 风险） | 中 |
| transfer-table | customDataSourceApiConfig 默认 mode=post（保存），dataConfig.api 默认 mode=get（读取） | 低 |
| transfer-table | searchFields 需与 data 字段名严格匹配，多字段用逗号分隔 | 低 |
| alarm-window-card | isScale 启用需画布支持 background canvas scale，否则可能不生效 | 中 |
| alarm-window-card | isAlarmAuth 启用需配置用户权限 visualMaterialAlarmWndowCard（原代码拼写错误：Wndow 而非 Window） | 高 |
| alarm-window-card | 8 个 subscribe 订阅参数（province_id/region_id/city_id/professional_type/int_id/network_type_top/network_type/org_severity）与告警项目配置节点完全一致 | 中 |
| alarm-window-card | theme 字段类型是 string（无 Select 控件），需手动输入正确枚举值 | 低 |
| progress-list | dataModel.name 错写为 'visual-designer-progress-list' | 中 |
| progress-list | isCustomColors 字段在 style 和 3 个字体样式中各有一份 | 低 |
| progress-list | 代码内 groupBy(name) 隐式聚合 | 中 |
| progress-list | renderLayoutFlex 调用未传 labelStyle | 中 |
| carousel-list | 路由参数 routeType 隐式约定 unknown/main | 中 |
| carousel-list | 静态资源 jingyu-1.png ~ jingyu-8.png 强依赖 | 中 |
| carousel-notice | 静态背景图 background-34.png 等强依赖 | 高 |
| carousel-notice | dataConfig 默认值含假数据（仅 demo） | 中 |
| carousel-notice | `time` 字段未在 dataModel 声明 | 高 |
| carousel-notice | 派发字段 noticeId/noticeTitle/noticeContent 隐式 | 中 |
| carousel-param | 包含 5 张内置图片资源强依赖 | 高 |
| carousel-param | 跨物料事件联动时 roundIndex 字段命名易冲突 | 中 |
| equip-list | 5 个翻译键（meterInfoName/ownerName/meterAddress/meterMacNo/meterCollectTime）需后端 i18n 支持 | 中 |
| equip-list | dataModel 中 valueColor/iconColor 字段是隐式约定 | 中 |
| hot-app-top5 | appIcon 字段从 url 字段自动提取（隐式约定） | 中 |
| hot-app-top5 | maxNumber 默认 5 但 schema 声明但无 NumberPicker 控件 | 低 |
| hot-app-top5 | 派发字段 appId 隐式 | 中 |
| monitor-topn-list | schemeId/schemeName 字段在 defaultValue 演示但 dataModel 未声明 | 高 |
| monitor-topn-list | 4 个派发字段（sceneId/sceneName/schemeId/schemeName）需 schema 显式 | 中 |
| oss-chart-plots-area | 23 个物料中 18 个共用 `compareType` / `minRange` / `maxRange` 隐式字段 | 高 |
| oss-chart-plots-area | dataConverter 强依赖 `s` 字段作多系列分组，dataModel 未声明 | 高 |
| oss-chart-plots-bar | schema.ts 顶部 180+ 行死代码（baseInfo/layout/divider）被注释 | 中 |
| oss-chart-plots-bar | 4 个 indicators 字段中 title_text/title_value 未被代码消费 | 中 |
| oss-chart-plots-base-area | 与 oss-chart-plots-area 80% 重复 | 高 |
| oss-chart-plots-base-area | schema 引入 PLOTS_SCHEMA 但 lineStyle 字段被代码二次定义（覆盖风险） | 中 |
| oss-chart-plots-base-scatter | 4 象限 + 4 趋势线 配置复杂（quadrant + trendline） | 中 |
| oss-chart-plots-base-scatter | dataModel 6 字段含 3 个 `[].label/value` 数组（隐式约定） | 中 |
| oss-chart-plots-column | 9 种 chartType 中部分 type 需配合 groupField/seriesField 使用 | 中 |
| oss-chart-plots-double-gauge | 自定义样式不使用 PLOTS_SCHEMA，需手动维护 | 中 |
| oss-chart-plots-double-gauge | 第二个仪表配置与第一个完全独立（无联动） | 低 |
| oss-chart-plots-dual-axes | 9 种 chartType 组合需 9 套独立配置项 | 高 |
| oss-chart-plots-dual-axes | dataSource 强依赖 `data[0].title` / `data[0].min/maxRange` 隐式字段 | 高 |
| oss-chart-plots-dual-column-line | 9 种 chartType + 标注/线/区域 3 套配置独立 | 高 |
| oss-chart-plots-dual-column-line | multiTypeChart 同时使用 line + column + area，配置项爆炸 | 中 |
| oss-chart-plots-funnel | dynamicHeight 启用需每条数据有 ascend 字段 | 中 |
| oss-chart-plots-funnel | 漏斗图配色完全自定义，无 PLOTS_SCHEMA 共用 | 低 |
| oss-chart-plots-gauge | 自定义样式不使用 PLOTS_SCHEMA | 中 |
| oss-chart-plots-gauge | statistic 配置（数字）8 字段全独立，配置复杂 | 中 |
| oss-chart-plots-histogram | 复用 column 物料，区别仅 stack 配置 | 低 |
| oss-chart-plots-line | 与 area/bar/column 共用 90% schema，区别仅 plotType | 中 |
| oss-chart-plots-liquid | 自定义 config 结构（非 PLOTS_SCHEMA） | 中 |
| oss-chart-plots-liquid | 完全独立 schema，与其他 oss-chart-plots 物料无 schema 共享 | 中 |
| oss-chart-plots-pie | innerRadius 启用为环图，0 为饼图（隐式约定） | 中 |
| oss-chart-plots-pie | roseType 启用为玫瑰图（隐式约定） | 中 |
| oss-chart-plots-radar | 3 种 shape (polygon/circle/rect) 决定是否填充 | 中 |
| oss-chart-plots-sankey | 自定义样式不使用 PLOTS_SCHEMA | 中 |
| oss-chart-plots-sankey | 节点/边数据格式需对齐 source/target/value | 中 |
| oss-chart-plots-series-area | indicatorPointer settings 数组中每个元素需 5 个字段（复杂） | 中 |
| oss-chart-plots-series-area | isStack + isPercent 互斥但 schema 未约束 | 中 |
| oss-chart-plots-series-bar | 与 series-column/stack-bar/stack-column 80% 同源 | 中 |
| oss-chart-plots-series-column | 与 series-bar/stack-column 80% 同源 | 中 |
| oss-chart-plots-stack-bar | 堆叠条形，单 series 即可堆叠（多 indicator_value） | 低 |
| oss-chart-plots-stack-column | isPercent=true 启用百分比堆叠 | 低 |
| oss-chart-plots-word-cloud | 自定义图片 mask 静态资源依赖 | 中 |

## 评级分布看板

```
🟢 独立优秀 (18) 28.1% ━━━━━━━━━━━━━━
🟡 组合可用 (46) 71.9% ━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 组合复杂  (0)  0%
⚫ 不建议    (0)  0%
```

## 平均得分

| 维度                  | 平均分（满分 5） | 短板物料                                   |
| --------------------- | ---------------- | ------------------------------------------ |
| business_description  | 3.6              | vertical-list/title (3.5), topn-rank (3.5) |
| scenario_coverage     | 3.7              | vertical-list (2.5), word-cloud (2.5)      |
| config_completeness   | 4.0              | table (3.0), top-rank (3.0)                |
| data_contract_clarity | 3.0              | vertical-list (2.5), table (2.5)           |
| doc_completeness      | 2.4              | 39/64 缺 5+1                               |
| composability         | 3.8              | topn-rank (3.5), top-rank-shaanxi (3.0)    |
| **总分**              | **3.7**          | —                                          |

> **最大短板**：doc_completeness（2.4）—— 39/64 物料缺 5+1 文档；其次是 data_contract_clarity（3.0）—— 多物料 dataType 错标或字段缺失

## 第五批画像（已完成，23 个）

### 23 个 oss-chart-plots 画像汇总

| #   | 物料                             | 评级        | 分数 | 搭建   | 关键能力                      | 关键问题                           |
| --- | -------------------------------- | ----------- | ---- | ------ | ----------------------------- | ---------------------------------- |
| 1   | oss-chart-plots-area             | 🟡 组合可用 | 3.6  | 6 min  | 单/多系列面积 + 渐变          | compareType/minRange/maxRange 隐式 |
| 2   | oss-chart-plots-bar              | 🟡 组合可用 | 3.7  | 5 min  | 基础条形 + 多 indicator       | 180+ 行 schema 死代码              |
| 3   | oss-chart-plots-base-area        | 🟡 组合可用 | 3.6  | 7 min  | 基础面积 + smooth             | 与 area 80% 重复                   |
| 4   | oss-chart-plots-base-scatter     | 🟡 组合可用 | 3.6  | 8 min  | 散点 + 4 象限 + 4 趋势线      | 配置复杂                           |
| 5   | oss-chart-plots-column           | 🟢 独立优秀 | 4.0  | 5 min  | 9 种 chartType                | 部分 type 需 groupField            |
| 6   | oss-chart-plots-double-gauge     | 🟡 组合可用 | 3.5  | 8 min  | 双仪表 + 2 渐变               | 自定义样式无 PLOTS_SCHEMA          |
| 7   | oss-chart-plots-dual-axes        | 🟡 组合可用 | 3.5  | 10 min | 9 组合双轴                    | 9 套独立配置                       |
| 8   | oss-chart-plots-dual-column-line | 🟢 独立优秀 | 4.0  | 15 min | 柱+线+标注                    | 9 type + 标注/线/区域              |
| 9   | oss-chart-plots-funnel           | 🟡 组合可用 | 3.5  | 6 min  | 漏斗 + 动态高度               | ascend 字段隐式                    |
| 10  | oss-chart-plots-gauge            | 🟡 组合可用 | 3.4  | 5 min  | 单仪表 + 8 段色               | statistic 配置复杂                 |
| 11  | oss-chart-plots-histogram        | 🟡 组合可用 | 3.5  | 5 min  | 柱状分布 + stack              | 与 column 重复                     |
| 12  | oss-chart-plots-line             | 🟡 组合可用 | 3.6  | 5 min  | 折线 + smooth + point         | 与 area 区别仅 plotType            |
| 13  | oss-chart-plots-liquid           | 🟡 组合可用 | 3.5  | 5 min  | 水球图                        | 完全独立 schema                    |
| 14  | oss-chart-plots-pie              | 🟢 独立优秀 | 4.0  | 5 min  | 饼/环/玫瑰                    | innerRadius/roseType 隐式          |
| 15  | oss-chart-plots-radar            | 🟡 组合可用 | 3.5  | 7 min  | 雷达 3 shape                  | shape 决定填充                     |
| 16  | oss-chart-plots-rose             | 🟡 组合可用 | 3.6  | 5 min  | 玫瑰 + group + stack          | group+stack 互斥                   |
| 17  | oss-chart-plots-sankey           | 🟡 组合可用 | 3.6  | 7 min  | 桑基图                        | source/target/value 隐式           |
| 18  | oss-chart-plots-series-area      | 🟢 独立优秀 | 4.0  | 18 min | 多系列堆叠 + indicatorPointer | settings 配置复杂                  |
| 19  | oss-chart-plots-series-bar       | 🟡 组合可用 | 3.5  | 7 min  | 多系列条形 + group+stack      | 与 series-column 80% 同源          |
| 20  | oss-chart-plots-series-column    | 🟢 独立优秀 | 4.0  | 12 min | 多系列柱状 + group+stack      | 与 series-bar 80% 同源             |
| 21  | oss-chart-plots-stack-bar        | 🟡 组合可用 | 3.5  | 7 min  | 堆叠条形                      | 与 stack-column 区别仅方向         |
| 22  | oss-chart-plots-stack-column     | 🟢 独立优秀 | 4.0  | 10 min | 堆叠柱状 + percent            | isPercent 隐式                     |
| 23  | oss-chart-plots-word-cloud       | 🟡 组合可用 | 3.4  | 5 min  | 词云 + 图片 mask              | 静态资源依赖                       |

### 23 个画像的核心发现

1. **oss-chart-plots 系列高同源**（23 个物料）

    - 23 个物料共用 `PLOTS_SCHEMA`（TITLE/AXIS_DIM/AXIS_IND/VALUE_LABEL/LEGEND/TOOLTIP/STYLE_STROKE/DATA_CFG/SCROLLBAR）
    - 23 个物料共用 `withPlotRender` HOC
    - 23 个物料共用 `@fedx-vis/plots` 图表库
    - 区别仅在：plotType + 特定配置（indicatorPointer/annotations/label/isStack/isPercent）
    - **建议**：保持独立（用户已确认 schema 不共享原则），但在 advisor 维度给出选型决策树

2. **隐式字段普遍存在**（23 个物料中 21 个有隐式字段）

    - `compareType` / `s` 字段（多系列场景，dataModel 未声明）
    - `indicator_unit`（15 个声明但代码未消费）
    - `minRange` / `maxRange`（代码从 data[0] 读，但 dataModel 未声明）
    - `indicator_id`（部分物料代码用，部分未声明）

3. **plot_type vs chartType 双层抽象**

    - 基础类（area/line/bar/column）：单 plotType
    - dual-\* / column 类：9 种 chartType 组合
    - 区别：基础类 plotType 直接对应 G2Plot 组件，dual-\* 类是组合 plot

4. **5+1 文档覆盖差异**

    - 有 5+1：base-area、base-scatter、double-gauge、dual-axes、dual-column-line、liquid、sankey、series-area、stack-column（9/23）
    - 缺 5+1：14 个（area/bar/column/funnel/gauge/histogram/line/pie/radar/rose/series-bar/series-column/stack-bar/word-cloud）

5. **doc_completeness 普遍偏低**（14/23 缺 5+1 文档）

6. **指标 ID 体系不统一**
    - 多数物料用 `dimension_name` / `indicator_value` 业务化字段
    - 部分物料用 `x` / `y` / `s` 底层字段
    - **影响**：跨物料数据对接时需转换

### 23 个画像的组合方案推荐

#### 场景 1：业务大盘（趋势 + 占比 + 排名）

-   必选：**oss-chart-plots-series-area**（多系列堆叠面积 + indicatorPointer）
-   辅助：oss-chart-plots-pie（占比）+ topn-rank-one（排名）
-   评分：🟢 A 4.0 分，搭建 30 min

#### 场景 2：设备/产品 KPI 大盘

-   必选：**oss-chart-plots-gauge**（仪表盘）+ **oss-chart-plots-double-gauge**（双仪表）
-   辅助：digital-flop（数字卡）+ oss-chart-plots-liquid（水球）
-   评分：🟡 B+ 3.5 分，搭建 18 min

#### 场景 3：销售对比分析

-   必选：**oss-chart-plots-column**（9 种 chartType，柱状/堆叠/分组/百分比）
-   辅助：oss-chart-plots-line（趋势线）+ oss-chart-plots-pie（占比）
-   评分：🟢 A 4.0 分，搭建 25 min

#### 场景 4：流量/性能监控

-   必选：**oss-chart-plots-line**（折线 + smooth + point）
-   辅助：oss-chart-plots-area（趋势填充）+ oss-chart-plots-base-scatter（异常点）
-   评分：🟡 B 3.6 分，搭建 18 min

#### 场景 5：转化漏斗分析

-   必选：**oss-chart-plots-funnel**（漏斗 + dynamicHeight）
-   辅助：oss-chart-plots-sankey（用户路径）
-   评分：🟡 B 3.5 分，搭建 13 min

## 第六批画像（已完成，18 个 = 4 数字指标卡 + 6 容器布局 + 8 地图）

### 4 个数字/指标卡画像汇总

| #   | 物料                  | 评级        | 分数 | 搭建  | 关键能力                   | 关键问题               |
| --- | --------------------- | ----------- | ---- | ----- | -------------------------- | ---------------------- |
| 1   | business-quality      | 🟡 组合可用 | 3.4  | 8 min | 玉珏图 + 8 字段指标        | 玉珏图视觉需大屏       |
| 2   | business-scale        | 🟡 组合可用 | 3.5  | 6 min | 业务规模卡 + 标签/数值双区 | 复用 digital-card 思路 |
| 3   | indicator-display     | 🟡 组合可用 | 3.5  | 5 min | 纯指标展示卡               | 与 digital-card 重复   |
| 4   | number-level-indicate | 🟡 组合可用 | 3.4  | 6 min | 数值级别指示 + threshold   | 阈值映射多色           |

### 6 个容器/布局画像汇总

| #   | 物料                        | 评级        | 分数 | 搭建   | 关键能力              | 关键问题         |
| --- | --------------------------- | ----------- | ---- | ------ | --------------------- | ---------------- |
| 1   | ellipse-layout-indicator    | 🟡 组合可用 | 3.3  | 15 min | 椭圆布局指标组        | 椭圆坐标计算复杂 |
| 2   | free-layout-ind-progress    | 🟡 组合可用 | 3.5  | 12 min | 自由布局指标进度      | 坐标需手填       |
| 3   | free-layout-indicator-group | 🟡 组合可用 | 3.6  | 15 min | 自由排布指标组 + 轮播 | 轮播节奏需调     |
| 4   | nine-grid                   | 🟡 组合可用 | 3.5  | 8 min  | 文字标签九宫格        | 固定 3x3，难扩展 |
| 5   | scene-over-view-hlj         | 🟡 组合可用 | 3.2  | 25 min | 黑龙江场景概述        | 强定制，迁移困难 |
| 6   | telescoping-board           | 🟡 组合可用 | 3.5  | 12 min | 伸缩组件 + 趋势       | 折叠交互需配动画 |

### 8 个地图画像汇总

| #   | 物料                   | 评级        | 分数 | 搭建    | 关键能力                       | 关键问题                    |
| --- | ---------------------- | ----------- | ---- | ------- | ------------------------------ | --------------------------- |
| 1   | baidu-map              | 🟡 组合可用 | 3.6  | 30 min  | 百度地图 GIS 打点 + 告警分级   | 强依赖 AK，dataType 错标    |
| 2   | baidu-map-unicom       | 🟡 组合可用 | 3.2  | 30 min  | BMapGL 命令式 API              | 与 baidu-map 高度同质       |
| 3   | geo-3d-map             | 🟡 组合可用 | 3.5  | 120 min | 3D 立体 + 30+配置项            | 需 GeoJSON/纹理，学习成本高 |
| 4   | geo-cascader           | 🟡 组合可用 | 3.5  | 15 min  | 省地市级联                     | 需外部 map-config.json      |
| 5   | oss-chart-classify-map | 🟡 组合可用 | 3.4  | 90 min  | path+scatter+lines 三图层      | 模块复杂，进阶使用          |
| 6   | oss-chart-fly-line-map | 🟡 组合可用 | 3.5  | 60 min  | ECharts 飞线 + 阈值配色        | 需 id-targetId 结构         |
| 7   | oss-chart-map          | 🟡 组合可用 | 3.6  | 90 min  | 基础平面 + 6 散点样式 + 多指标 | 配置丰富，文档最完整        |
| 8   | oss-gis                | 🟡 组合可用 | 3.7  | 90 min  | fedx-gis + 5 种瓦片 + 双图例   | 配置项最多，能力最强        |

### 18 个地图/容器/数字卡画像的核心发现

1. **8 个地图画像分 4 大技术栈**

    - 百度系：baidu-map / baidu-map-unicom（强依赖 AK）
    - 3D 系：geo-3d-map（Three.js/WebGL）
    - ECharts 系：oss-chart-classify-map / oss-chart-fly-line-map / oss-chart-map
    - GIS 系：oss-gis（OpenLayers 封装 fedx-gis）
    - 选择建议：通用 → oss-chart-map；3D → geo-3d-map；专业 GIS → oss-gis

2. **6 个容器/布局几乎全部是"位置+坐标"驱动**

    - 大多需要手填坐标（MonacoEditor 模式）
    - 轮播/折叠/钻入是核心交互
    - 业务定制程度高（scene-over-view-hlj 强定制于黑龙江）

3. **4 个数字/指标卡严重重复**

    - business-quality / business-scale / indicator-display / digital-card / number-level-indicate 80% 同源
    - 区别仅在：玉珏图装饰 / 标签区 / 阈值配色
    - **建议**：合并为 1 个 indicator-card 物料 + 多种皮肤

4. **`dataType: "String"` 普遍错标**

    - 全部 8 个地图：longitude/latitude/value/alarmLevel 应为 Number
    - 6 个容器/布局：coordinates/positions 应为 Number
    - 4 个数字卡：indicatorValue 应为 Number

5. **5+1 文档严重缺失（第六批 18/18 缺 5+1）**

6. **静态资源强依赖**

    - baidu-map：图标按 neType + alarmLevel 组织于 IMAGE_PATH/map/
    - geo-3d-map：GeoJSON + 纹理图片
    - geo-cascader：STATIC_PATH/map/map-config.json
    - oss-gis：5 种瓦片 URL + map-config.json
    - scene-over-view-hlj：背景图 + 文字图（强定制）

7. **oss-chart-map 与 oss-chart-classify-map 高度同源**

    - 都支持 path + scatter + lines 三图层
    - 区别：oss-chart-map 多指标点位（item_xx）能力更强
    - **建议**：优先 oss-chart-map，classify-map 仅在需简化时使用

8. **场景组合"地理态势"全景**
    - 简易打点：baidu-map（30 min）
    - 区域切片：geo-3d-map + geo-cascader（120 + 15 min）
    - 迁徙分析：oss-chart-fly-line-map（60 min）
    - 综合态势：oss-chart-map（90 min）
    - 专业 GIS：oss-gis（90 min）

### 18 个画像的组合方案推荐

#### 场景 1：省/集团运营驾驶舱（地理 + 指标）

-   必选：**oss-chart-map**（基础平面地图，多图层）
-   辅助：oss-chart-fly-line-map（迁徙/调度）+ digital-flop（区域指标）
-   评分：🟡 B 3.6 分，搭建 90 min

#### 场景 2：网络资源监控（基站 + 告警）

-   必选：**baidu-map**（百度打点 + 告警分级）
-   辅助：alarm-window-card（订阅告警）+ topn-rank-one（TopN 基站）
-   评分：🟡 B 3.6 分，搭建 45 min

#### 场景 3：3D 地理态势（炫酷场景）

-   必选：**geo-3d-map**（3D 立体地图）
-   辅助：geo-cascader（区域切换）+ digital-flop（指标）
-   评分：🟡 B 3.5 分，搭建 135 min

#### 场景 4：业务总览大屏（数字卡矩阵）

-   必选：**indicator-display**（纯指标展示）
-   辅助：business-quality（玉珏图装饰）+ digital-flop（动画数字）
-   评分：🟡 B 3.5 分，搭建 15 min

#### 场景 5：机房/资源管理（自由布局）

-   必选：**free-layout-indicator-group**（自由排布）
-   辅助：telescoping-board（伸缩菜单）+ normal-label（标签）
-   评分：🟡 B 3.6 分，搭建 30 min

## 第七批画像（已完成，20 个 = 3D/拓扑 + 时钟/动画 + 媒体/播放 + 进度/加载 + 其他）

### 6 个 3D/拓扑画像汇总

| #   | 物料                     | 评级        | 分数 | 搭建   | 关键能力                     | 关键问题                      |
| --- | ------------------------ | ----------- | ---- | ------ | ---------------------------- | ----------------------------- |
| 1   | echarts-3d-pie           | 🟡 组合可用 | 3.5  | 15 min | echarts-gl 3D 饼/环图        | 静态配色，dataType 隐式       |
| 2   | virtual-3d-column        | 🟡 组合可用 | 3.5  | 20 min | 3D 柱状 + 圆/方/三角 3 shape | shape 切换需重构              |
| 3   | virtual-3d-column-normal | 🟡 组合可用 | 3.3  | 20 min | 菱形 3D 柱状                 | 与 virtual-3d-column 80% 同源 |
| 4   | smart-warehouse          | 🟡 组合可用 | 3.4  | 60 min | fedx-3d 三维仓库场景         | 强依赖 fedx-3d 模型           |
| 5   | twaver-topo              | 🟡 组合可用 | 3.7  | 30 min | 拓扑图 + 15 种 link 类型     | link 类型需查阅手册           |
| 6   | levitated-sphere         | 🟡 组合可用 | 3.6  | 25 min | 悬浮球菜单 + 拖拽            | 仅悬浮展开，交互单一          |

### 4 个时钟/动画画像汇总

| #   | 物料           | 评级        | 分数 | 搭建   | 关键能力                   | 关键问题                 |
| --- | -------------- | ----------- | ---- | ------ | -------------------------- | ------------------------ |
| 1   | normal-clock   | 🟢 独立优秀 | 4.0  | 5 min  | 12 种时间格式 + 时分秒刻度 | format 枚举需对齐 moment |
| 2   | path-animation | 🟡 组合可用 | 3.0  | 15 min | SVG path 沿线动画          | path 数据需手写          |
| 3   | svg-render     | 🟡 组合可用 | 3.0  | 20 min | SVG 按 level 渲染          | level 分级隐式           |
| 4   | warning-board  | 🟡 组合可用 | 3.6  | 15 min | 告警牌 + 指标独立配置      | per-indicator 配项多     |

### 3 个媒体/播放画像汇总

| #   | 物料            | 评级        | 分数 | 搭建   | 关键能力            | 关键问题              |
| --- | --------------- | ----------- | ---- | ------ | ------------------- | --------------------- |
| 1   | single-image    | 🟡 组合可用 | 3.5  | 2 min  | 单图展示 + 点击事件 | fit/center 模式二选一 |
| 2   | video-playback  | 🟡 组合可用 | 3.0  | 8 min  | 视频播放 + 控件     | URL 必须 HTTPS        |
| 3   | weather-display | 🟡 组合可用 | 3.3  | 10 min | 按城市显示天气      | cityCode 需查表       |

### 5 个进度/加载画像汇总

| #   | 物料                    | 评级        | 分数 | 搭建   | 关键能力                    | 关键问题                |
| --- | ----------------------- | ----------- | ---- | ------ | --------------------------- | ----------------------- |
| 1   | circular-progress       | 🟡 组合可用 | 3.5  | 8 min  | 单组环形进度 + 多色环       | segment 字段隐式        |
| 2   | circular-progress-group | 🟡 组合可用 | 3.6  | 12 min | 多组环形进度并列            | dataModel 需多层结构    |
| 3   | normal-process          | 🟡 组合可用 | 3.3  | 10 min | 圆环进度 + 副标题（杨兴相） | 字段命名与 utils 强耦合 |
| 4   | pagination-display      | 🟡 组合可用 | 3.3  | 8 min  | 翻页器 + 总数显示           | 仅展示，不可交互        |
| 5   | progress-list-bar       | 🟡 组合可用 | 3.5  | 10 min | 水平进度条列表              | level 配色需对齐 design |

### 2 个其他画像汇总

| #   | 物料                | 评级        | 分数 | 搭建   | 关键能力             | 关键问题                 |
| --- | ------------------- | ----------- | ---- | ------ | -------------------- | ------------------------ |
| 1   | render-stage-loader | 🟡 组合可用 | 3.3  | 5 min  | 数字孪生平台加载动画 | 用途单一，绑定 twin 平台 |
| 2   | echarts-line-dual-x | 🟡 组合可用 | 3.5  | 10 min | 双 X 轴折线对比      | xAxis 配置复杂           |

### 20 个画像的核心发现

1. **3D/拓扑分 3 大引擎**：echarts-gl（pie）、fedx-3d（smart-warehouse / levitated-sphere）、twaver（topo）、Three.js（virtual-3d-column）。选择建议：饼图 → echarts-3d-pie；拓扑 → twaver-topo；柱图 → virtual-3d-column；场景 → smart-warehouse。
2. **normal-clock 是第七批唯一 🟢 A 评级**：12 种时间格式（YYYY/MM/DD HH:mm:ss 变体）+ 刻度数/角度独立配置，复用率高。
3. **video-playback 受限最大**：URL 必须 HTTPS（浏览器自动播放策略），dataType 字段缺失。
4. **circular-progress / circular-progress-group 配套使用**：单组 vs 多组组合，与 stats-indi-group 呼应。
5. **5+1 文档覆盖**（20 个）：normal-clock ✅，其余 19 个 ❌。
6. **twaver-topo link 类型最多**（15 种）：solid/dashed/dotted + arrow + 多种 linkType，难枚举全。
7. **smart-warehouse 是 fedx-3d 强依赖代表**：模型文件、纹理文件、镜头配置全部外置，需参考 fedx-3d 文档。

### 20 个画像的组合方案推荐

#### 场景 1：3D 智慧城市/园区

-   必选：**smart-warehouse** 或 **virtual-3d-column**
-   辅助：digital-flop（关键指标）+ warning-board（异常）
-   评分：🟡 B 3.5 分，搭建 60-90 min

#### 场景 2：网络拓扑监控

-   必选：**twaver-topo**（拓扑 + 告警连接线）
-   辅助：alarm-window-card（告警）+ normal-clock（时间）
-   评分：🟡 B 3.7 分，搭建 45 min

#### 场景 3：多维进度展示（运维）

-   必选：**circular-progress-group**（多组环形）
-   辅助：progress-list-bar（水平列表）+ normal-label（标题）
-   评分：🟡 B 3.6 分，搭建 20 min

#### 场景 4：媒体播放中心

-   必选：**video-playback** 或 **single-image**
-   辅助：carousel-image-list（轮播）+ weather-display（天气小部件）
-   评分：🟡 B 3.4 分，搭建 15 min

#### 场景 5：标准时钟组件

-   必选：**normal-clock**（12 种格式）
-   评分：🟢 A 4.0 分，搭建 5 min

## 第八批画像（已完成，17 个 = 状态/标签 + 表单/筛选 + 按钮/操作 + 文本/标签/标题）

### 4 个状态/标签画像汇总

| #   | 物料             | 评级        | 分数 | 搭建   | 关键能力              | 关键问题               |
| --- | ---------------- | ----------- | ---- | ------ | --------------------- | ---------------------- |
| 1   | status-display   | 🟡 组合可用 | 3.4  | 8 min  | 状态条件映射显示      | condition 字段需业务化 |
| 2   | stats-indi       | 🟡 组合可用 | 3.5  | 5 min  | 单指标数字翻牌        | digital-flop 替代品    |
| 3   | stats-indi-group | 🟡 组合可用 | 3.3  | 12 min | 6x6 指标组 + 主指标   | 配置项密集             |
| 4   | stats-indi-grid  | 🟡 组合可用 | 3.3  | 10 min | 指标网格布局 + 单元格 | gridColumns 需对齐     |

### 4 个表单/筛选画像汇总

| #   | 物料               | 评级        | 分数 | 搭建   | 关键能力          | 关键问题            |
| --- | ------------------ | ----------- | ---- | ------ | ----------------- | ------------------- |
| 1   | popover-check      | 🟡 组合可用 | 3.5  | 8 min  | 下拉单选 + 触发器 | dataSource 动态加载 |
| 2   | popover-checkparam | 🟡 组合可用 | 3.6  | 10 min | 下拉 + 携带参数   | param 需手动映射    |
| 3   | query-form-group   | 🟡 组合可用 | 3.5  | 15 min | 查询表单组 + 提交 | 表单字段需 id 对齐  |
| 4   | range-picker       | 🟡 组合可用 | 3.4  | 5 min  | 日期范围选择器    | 必传 onChange       |

### 5 个按钮/操作画像汇总

| #   | 物料                  | 评级        | 分数 | 搭建  | 关键能力               | 关键问题               |
| --- | --------------------- | ----------- | ---- | ----- | ---------------------- | ---------------------- |
| 1   | custom-request-button | 🟢 独立优秀 | 4.0  | 8 min | API 请求按钮 + 订阅    | request 配置需 Promise |
| 2   | export-btn            | 🟡 组合可用 | 3.2  | 6 min | 导出按钮（CSV/XLSX）   | 浏览器兼容性需测试     |
| 3   | ghost-btn             | 🟡 组合可用 | 3.4  | 3 min | 幽灵按钮 + 渐变边框    | 配色需对齐设计         |
| 4   | iframe                | 🟡 组合可用 | 3.4  | 5 min | iframe 嵌入 + 模板变量 | src 模板需 `${var}`    |
| 5   | visual-iframe         | 🟡 组合可用 | 3.5  | 8 min | iframe + 告警联动      | alarmLink 需订阅       |

### 3 个文本/标签/标题画像汇总

| #   | 物料               | 评级        | 分数 | 搭建   | 关键能力             | 关键问题                 |
| --- | ------------------ | ----------- | ---- | ------ | -------------------- | ------------------------ |
| 1   | label-text         | 🟡 组合可用 | 3.2  | 3 min  | 标题 + 图标          | 与 normal-label 高度同质 |
| 2   | description-table  | 🟡 组合可用 | 3.3  | 8 min  | 描述列表 + key/value | label/value 配对         |
| 3   | textarea-label     | 🟡 组合可用 | 3.3  | 5 min  | 多行文本展示         | autoSize 隐式            |
| 4   | message-distribute | 🟡 组合可用 | 3.4  | 10 min | 短信分发统计         | phone 字段需脱敏         |

### 16 个画像的核心发现

1. **custom-request-button 是第八批唯一 🟢 A 评级**：API 请求 + 订阅 + loading 状态自管理，复用率高。
2. **表单/筛选类全部缺 5+1 文档**（4/4）：query-form-group / range-picker / popover-check / popover-checkparam 设计复杂但文档薄弱。
3. **iframe 双胞胎**：iframe 与 visual-iframe 高度同源，区别在 visual-iframe 多 alarmLink 订阅能力。建议：优先 visual-iframe。
4. **stats-indi 与 digital-flop 高度同质**：stats-indi 是 digital-flop 简化版（少翻牌动画、少下钻），但评分更高（3.5 vs 3.4）—— 研发反而觉得 stats-indi schema 更整洁。
5. **文本类 4 个物料 schema 高度相似**：label-text / message-distribute / description-table / textarea-label 共用 content + style 结构，可考虑在 advisor 维度合并推荐。
6. **按钮类复杂度差异大**：ghost-btn（3 min）vs custom-request-button（8 min + Promise）。

### 16 个画像的组合方案推荐

#### 场景 1：业务后台筛选页

-   必选：**query-form-group** + **range-picker** + **popover-checkparam**
-   辅助：custom-request-button（提交按钮）
-   评分：🟡 B 3.5 分，搭建 30 min

#### 场景 2：指标矩阵（首页）

-   必选：**stats-indi-grid** 或 **stats-indi-group**
-   辅助：label-text（标题）+ normal-label（描述）
-   评分：🟡 B 3.3 分，搭建 15 min

#### 场景 3：第三方页面嵌入

-   必选：**visual-iframe**（告警联动）
-   辅助：iframe（普通嵌入）+ warning-board（嵌入页告警）
-   评分：🟡 B 3.5 分，搭建 12 min

#### 场景 4：导出/操作工具栏

-   必选：**custom-request-button**（API 操作）+ **export-btn**（导出）
-   辅助：ghost-btn（次要操作）
-   评分：🟡 B+ 3.7 分，搭建 20 min

#### 场景 5：状态描述面板

-   必选：**description-table** + **status-display**（条件映射）
-   辅助：label-text（标题）
-   评分：🟡 B 3.3 分，搭建 15 min

## 第九批画像（已完成，5 个 = 轮播/公告）

### 5 个轮播/公告画像汇总

| #   | 物料                | 评级        | 分数 | 搭建   | 关键能力            | 关键问题           |
| --- | ------------------- | ----------- | ---- | ------ | ------------------- | ------------------ |
| 1   | carousel-image-list | 🟡 组合可用 | 3.5  | 10 min | 水平图片轮播列表    | 静态资源强依赖     |
| 2   | tab-list            | 🟡 组合可用 | 3.5  | 10 min | tab 列表 + 图标切换 | tabData 需数组结构 |
| 3   | tab-list-2          | 🟡 组合可用 | 3.5  | 12 min | tab + 内部轮播      | 双层状态管理       |
| 4   | tab-list-arc        | 🟡 组合可用 | 3.4  | 15 min | 弧形 tab 列表       | 弧度计算复杂       |
| 5   | tab-list-static     | 🟡 组合可用 | 3.5  | 8 min  | 静态 tab + 双指示器 | 静态模式无轮播     |

### 5 个画像的核心发现

1. **5 个 tab/轮播物料**：4 个 tab-list + 1 个 carousel-image-list，共用 tabData + activeIndex 结构。
2. **tab-list-arc 是唯一弧形变体**：弧度 + 偏移量需精确计算，定制场景强。
3. **carousel-image-list 是独立轮播**：与 carousel-list（已有）同源但用于图片展示。
4. **5+1 文档覆盖**（5 个）：0/5 有 5+1，全部缺失。

### 5 个画像的组合方案推荐

#### 场景 1：多视图切换（业务总览）

-   必选：**tab-list**（图标 tab）或 **tab-list-static**（静态双指示器）
-   辅助：digital-flop（每个 tab 的关键指标）
-   评分：🟡 B 3.5 分，搭建 15 min

#### 场景 2：图片画廊展示

-   必选：**carousel-image-list**
-   辅助：single-image（点击查看大图）
-   评分：🟡 B 3.5 分，搭建 12 min

#### 场景 3：弧形 tab 装饰（炫酷大屏）

-   必选：**tab-list-arc**
-   评分：🟡 B 3.4 分，搭建 15 min

## 第十批画像（已完成，7 个 = 其他 + 装饰汇总）

### 2 个其他画像汇总

| #   | 物料              | 评级        | 分数 | 搭建   | 关键能力       | 关键问题                  |
| --- | ----------------- | ----------- | ---- | ------ | -------------- | ------------------------- |
| 1   | area-business-vol | 🟡 组合可用 | 3.2  | 20 min | 区域业务量配置 | 静态资源强依赖            |
| 2   | zone-setting      | 🟡 组合可用 | 3.3  | 15 min | 区域设置       | 与 area-business-vol 配对 |
| 3   | top-n             | 🟡 组合可用 | 3.5  | 10 min | 通用 TOPN 排名 | 与 top-rank 系列重复      |

### 4 个装饰/容器画像汇总

| #   | 物料              | 评级        | 分数 | 搭建  | 关键能力             | 关键问题           |
| --- | ----------------- | ----------- | ---- | ----- | -------------------- | ------------------ |
| 1   | decoration-family | 🟡 组合可用 | 3.0  | 2 min | 24 种边框/装饰汇总   | 纯样式，无数据交互 |
| 2   | hexagon           | 🟡 组合可用 | 3.0  | 5 min | 六边形装饰           | 静态装饰           |
| 3   | flash-point       | 🟡 组合可用 | 3.0  | 5 min | 闪烁点装饰           | 动画性能需注意     |
| 4   | common-container  | 🟡 组合可用 | 3.4  | 5 min | 模块容器 + 标题/装饰 | 容器基底，频繁复用 |

### 6 个画像的核心发现

1. **decoration-family 合并 24 个边框/装饰物料**：border1-12 + decoration1-12 共 24 个物料 schema 高度同源（仅颜色/路径不同），画像合并为 1 个 `decoration-family.json`，包含 24 个变体的 type 字段枚举。
2. **common-container 是"通用容器"**：与 free-layout-indicator-group / telescoping-board 等专用容器不同，common-container 是基础容器基底，复用率最高。
3. **area-business-vol + zone-setting 配对使用**：区域业务量展示 + 区域切换配置。
4. **top-n 与 top-rank 系列重复**：topn-rank / topn-rank-one / top-rank / top-rank-shaanxi / top-n 共 5 个排名物料 schema 80% 同源（用户已确认保持独立）。

### 6 个画像的组合方案推荐

#### 场景 1：标准大屏装饰

-   必选：**common-container**（容器）+ **decoration-family**（边框）+ **label-text**（标题）
-   评分：🟡 B 3.2 分，搭建 10 min

#### 场景 2：炫酷特效装饰

-   必选：**flash-point**（闪烁点）+ **hexagon**（六边形）
-   辅助：normal-clock（中心装饰）
-   评分：🟡 B 3.0 分，搭建 15 min

## 后续推进

-   **第一批画像（已完成）**：8 个有 5+1 文档物料 + 3 个高频
-   **第二批画像（已完成）**：表格全部完成（10 个）
-   **第三批画像（已完成）**：列表/排行（13 个）
-   **第四批画像（已完成）**：图表 ECharts 剩余（9 个）
-   **第五批画像（已完成）**：oss-chart-plots 系列（23 个）
-   **第六批画像（已完成）**：数字/指标卡（4）+ 容器/布局（6）+ 地图（8）= 18 个
-   **第七批画像（已完成）**：3D/拓扑（6）+ 时钟/动画（4）+ 媒体/播放（3）+ 进度/加载（5）+ 其他（2）= 20 个
-   **第八批画像（已完成）**：状态/标签（4）+ 表单/筛选（4）+ 按钮/操作（5）+ 文本/标签/标题（4）= 17 个
-   **第九批画像（已完成）**：轮播/公告（5 个）
-   **第十批画像（已完成）**：其他（3）+ 装饰汇总（4 = decoration-family 合并 24 + hexagon + flash-point + common-container）= 7 个
-   **累计**：10 批画像，共 **131 个画像**（覆盖率 85.1%，剩余 23 个边框/装饰纯样式未画像）
-   **跑通 composition-rules.md**：用"销售大盘"场景试算组合方案（✅ 已完成于 `examples/sales-dashboard.md`）
-   **跑通更多场景示范**：设备监控、应急指挥、运营驾驶舱、机房管理、业务 TopN 大盘
-   **回写 5+1 文档**：把 `_validation_notes` 中的发现回写到 `oss-vis-material-development-assistant/materials/{name}/gotchas.md`
-   **下一批候选**（按价值排序）：告警/订阅（1 已画像：alarm-window-card）+ 大屏框架/看板（待盘点）+ 第三方插件（待盘点）
