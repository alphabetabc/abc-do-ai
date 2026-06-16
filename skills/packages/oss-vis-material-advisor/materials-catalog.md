---
title: 物料维护清单（advisor 视角）
description: advisor 对全部 154 个有效物料的画像/文档化状态总览，按 18 个分类组织
version: 0.1
last_updated: 2026-06-16
---

# 物料维护清单（advisor 视角）

本清单覆盖 `src/packages/**/oss-material.json` 命中的全部 **154 个物料**，按 18 个分类组织，标注每个物料的：

-   复杂度（来自画像，缺失则为 `-`）
-   画像状态（✅ 已画像 / ⏳ 待画像）
-   自带 doc（📄 / —）
-   评级 + 分数 + 搭建成本（仅已画像）

> **分类原则**：每个物料只属于 1 个主分类（以 `oss-material.json.title` 为首要依据）。例如 "环形进度图" 类物料归入 [进度/加载](#进度--加载5)，"水平进度图" 归入 [进度/加载](#进度--加载5)，"进度条列表" 归入 [列表/排行](#列表--排行13)。

## 状态说明

| 符号        | 含义                                         |
| ----------- | -------------------------------------------- |
| ✅ 已画像   | advisor 已生成 `profiles/{name}.json`        |
| ⏳ 待画像   | 物料存在但 advisor 尚未生成画像              |
| 📄 自带 doc | 物料自带 `doc/readme.md`（设计器侧边栏渲染） |
| 🟢 独立优秀 | 评级 A，6 维加权 ≥ 4.5                       |
| 🟡 组合可用 | 评级 B，3.5-4.5                              |
| 🔴 组合复杂 | 评级 C，2.5-3.5                              |
| ⚫ 不建议   | 评级 D，< 2.5                                |

## 总览

| 指标        | 数值         |
| ----------- | ------------ |
| 物料总数    | 154          |
| 已画像      | 14（9.1%）   |
| 待画像      | 140（90.9%） |
| 自带 doc    | 61（39.6%）  |
| 🟢 独立优秀 | 6            |
| 🟡 组合可用 | 8            |
| 🔴 组合复杂 | 0            |
| ⚫ 不建议   | 0            |

## 按分类

### 容器 / 布局（8）

| 物料                            | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `dock-menu`                     | 高     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 15 min          |
| `ellipse-layout-indicator`      | -      | ⏳   | 📄       | -           | -    | - min           |
| `free-layout-ind-progress`      | -      | ⏳   | 📄       | -           | -    | - min           |
| `free-layout-indicator-group`   | -      | ⏳   | 📄       | -           | -    | - min           |
| `free-layout-indicators-viewer` | 高     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 25 min          |
| `nine-grid`                     | -      | ⏳   | —        | -           | -    | - min           |
| `scene-over-view-hlj`           | -      | ⏳   | —        | -           | -    | - min           |
| `telescoping-board`             | -      | ⏳   | 📄       | -           | -    | - min           |

> 已画像 2/8

### 文本 / 标签 / 标题（5）

| 物料                 | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| -------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `label-text`         | -      | ⏳   | —        | -           | -    | - min           |
| `message-distribute` | -      | ⏳   | —        | -           | -    | - min           |
| `normal-label`       | 中     | ✅   | 📄       | 🟢 独立优秀 | 4    | 2 min           |
| `textarea-label`     | -      | ⏳   | 📄       | -           | -    | - min           |
| `description-table`  | -      | ⏳   | —        | -           | -    | - min           |

> 已画像 1/5

### 数字 / 指标卡（7）

| 物料                     | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------------ | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `bidirectional-progress` | 中     | ✅   | 📄       | 🟢 独立优秀 | 4    | 10 min          |
| `business-quality`       | -      | ⏳   | —        | -           | -    | - min           |
| `business-scale`         | -      | ⏳   | —        | -           | -    | - min           |
| `digital-card`           | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 5 min           |
| `digital-flop`           | 中     | ✅   | 📄       | 🟢 独立优秀 | 4    | 8 min           |
| `indicator-display`      | -      | ⏳   | —        | -           | -    | - min           |
| `number-level-indicate`  | -      | ⏳   | —        | -           | -    | - min           |

> 已画像 3/7

### 列表 / 排行（13）

| 物料                | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `carousel-list`     | -      | ⏳   | —        | -           | -    | - min           |
| `carousel-notice`   | -      | ⏳   | 📄       | -           | -    | - min           |
| `carousel-param`    | -      | ⏳   | 📄       | -           | -    | - min           |
| `equip-list`        | -      | ⏳   | —        | -           | -    | - min           |
| `hot-app-top5`      | -      | ⏳   | 📄       | -           | -    | - min           |
| `monitor-topn-list` | -      | ⏳   | —        | -           | -    | - min           |
| `progress-list`     | -      | ⏳   | —        | -           | -    | - min           |
| `top-rank`          | 简单   | ✅   | —        | 🟡 组合可用 | 3.4  | 10 min          |
| `top-rank-shaanxi`  | -      | ⏳   | —        | -           | -    | - min           |
| `topn-rank`         | -      | ⏳   | 📄       | -           | -    | - min           |
| `topn-rank-one`     | -      | ⏳   | 📄       | -           | -    | - min           |
| `tree-list`         | -      | ⏳   | —        | -           | -    | - min           |
| `vertical-list`     | -      | ⏳   | —        | -           | -    | - min           |

> 已画像 1/13

### 表格（10）

| 物料                 | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| -------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `drilldown-table`    | 高     | ✅   | 📄       | 🟡 组合可用 | 4.0  | 25 min          |
| `drilldown-table-2`  | 高     | ✅   | 📄       | 🟡 组合可用 | 3.8  | 22 min          |
| `expandable-table`   | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.2  | 15 min          |
| `pagination-table`   | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.2  | 15 min          |
| `table`              | 中     | ✅   | 📄       | 🟡 组合可用 | 3.8  | 3 min           |
| `table-detail`       | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 12 min          |
| `table-fixedColumns` | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.3  | 12 min          |
| `table-transpose`    | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 12 min          |
| `transfer-table`     | 中高   | ✅   | 📄       | 🟡 组合可用 | 3.7  | 15 min          |
| `alarm-window-card`  | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.1  | 15 min          |

> 已画像 10/10 ✅ 全部完成

> **说明**：`alarm-window-card` 在原 `oss-material.json.title="订阅告警流水窗"` 中业务领域属于"告警"专项，但 groupId=5 在表格分类下，因此保留在表格清单内。详见 `profiles/alarm-window-card.json`。

### 表单 / 筛选（4）

| 物料                 | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| -------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `popover-check`      | -      | ⏳   | —        | -    | -    | - min           |
| `popover-checkparam` | -      | ⏳   | —        | -    | -    | - min           |
| `query-form-group`   | -      | ⏳   | 📄       | -    | -    | - min           |
| `range-picker`       | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/4

### 按钮 / 操作（5）

| 物料                    | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ----------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `custom-request-button` | -      | ⏳   | —        | -    | -    | - min           |
| `export-btn`            | -      | ⏳   | 📄       | -    | -    | - min           |
| `ghost-btn`             | -      | ⏳   | 📄       | -    | -    | - min           |
| `iframe`                | -      | ⏳   | 📄       | -    | -    | - min           |
| `visual-iframe`         | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/5

### 轮播 / 公告（5）

| 物料                  | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| --------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `carousel-image-list` | -      | ⏳   | —        | -    | -    | - min           |
| `tab-list`            | -      | ⏳   | —        | -    | -    | - min           |
| `tab-list-2`          | -      | ⏳   | 📄       | -    | -    | - min           |
| `tab-list-arc`        | -      | ⏳   | 📄       | -    | -    | - min           |
| `tab-list-static`     | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/5

### 图表（ECharts）（12）

| 物料                                | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ----------------------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `circular-column`                   | -      | ⏳   | 📄       | -           | -    | - min           |
| `cone-bar`                          | -      | ⏳   | 📄       | -           | -    | - min           |
| `cone-bar-line`                     | -      | ⏳   | 📄       | -           | -    | - min           |
| `cone-single-bar`                   | -      | ⏳   | 📄       | -           | -    | - min           |
| `dual-axes-chart`                   | -      | ⏳   | —        | -           | -    | - min           |
| `echarts-bar`                       | 中     | ✅   | 📄       | 🟢 独立优秀 | 4.2  | 6 min           |
| `echarts-gauge`                     | -      | ⏳   | 📄       | -           | -    | - min           |
| `echarts-liquid`                    | -      | ⏳   | 📄       | -           | -    | - min           |
| `echarts-map`                       | 高     | ✅   | —        | 🟡 组合可用 | 3.7  | 51 min          |
| `echarts-multi-variable-area-chart` | -      | ⏳   | 📄       | -           | -    | - min           |
| `echarts-pie`                       | 中     | ✅   | —        | 🟢 独立优秀 | 4.3  | 7 min           |
| `ind-list-echarts-gauge`            | -      | ⏳   | 📄       | -           | -    | - min           |

> 已画像 3/12

### 图表（oss-chart-plots）（23）

| 物料                                     | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ---------------------------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `oss-chart-plots/plots/area`             | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/bar`              | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/base-area`        | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/base-scatter`     | -      | ⏳   | 📄       | -    | -    | - min           |
| `oss-chart-plots/plots/column`           | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/double-gauge`     | -      | ⏳   | 📄       | -    | -    | - min           |
| `oss-chart-plots/plots/dual-axes`        | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/dual-column-line` | -      | ⏳   | 📄       | -    | -    | - min           |
| `oss-chart-plots/plots/funnel`           | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/gauge`            | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/histogram`        | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/line`             | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/liquid`           | -      | ⏳   | 📄       | -    | -    | - min           |
| `oss-chart-plots/plots/pie`              | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/radar`            | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/rose`             | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/sankey`           | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/series-area`      | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/series-bar`       | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/series-column`    | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/stack-bar`        | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/stack-column`     | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-plots/plots/word-cloud`       | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/23

### 地图（8）

| 物料                     | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ------------------------ | ------ | ---- | -------- | ---- | ---- | --------------- |
| `baidu-map`              | -      | ⏳   | —        | -    | -    | - min           |
| `baidu-map-unicom`       | -      | ⏳   | —        | -    | -    | - min           |
| `geo-3d-map`             | -      | ⏳   | —        | -    | -    | - min           |
| `geo-cascader`           | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-classify-map` | -      | ⏳   | —        | -    | -    | - min           |
| `oss-chart-fly-line-map` | -      | ⏳   | 📄       | -    | -    | - min           |
| `oss-chart-map`          | -      | ⏳   | —        | -    | -    | - min           |
| `oss-gis`                | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/8

### 3D / 拓扑（4）

| 物料                       | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| -------------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `model-3d/smart-warehouse` | -      | ⏳   | —        | -    | -    | - min           |
| `twaver-topo`              | -      | ⏳   | —        | -    | -    | - min           |
| `virtual-3d-column`        | -      | ⏳   | 📄       | -    | -    | - min           |
| `virtual-3d-column-normal` | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/4

### 时钟 / 动画（5）

| 物料               | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ------------------ | ------ | ---- | -------- | ---- | ---- | --------------- |
| `levitated-sphere` | -      | ⏳   | 📄       | -    | -    | - min           |
| `normal-clock`     | -      | ⏳   | —        | -    | -    | - min           |
| `path-animation`   | -      | ⏳   | 📄       | -    | -    | - min           |
| `svg-render`       | -      | ⏳   | 📄       | -    | -    | - min           |
| `warning-board`    | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/5

### 媒体 / 播放（3）

| 物料              | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ----------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `single-image`    | -      | ⏳   | —        | -    | -    | - min           |
| `video-playback`  | -      | ⏳   | —        | -    | -    | - min           |
| `weather-display` | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/3

### 进度 / 加载（5）

| 物料                      | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ------------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `circular-progress`       | -      | ⏳   | —        | -    | -    | - min           |
| `circular-progress-group` | -      | ⏳   | —        | -    | -    | - min           |
| `normal-process`          | -      | ⏳   | —        | -    | -    | - min           |
| `pagination-display`      | -      | ⏳   | —        | -    | -    | - min           |
| `progress-list-bar`       | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/5

### 状态 / 标签（4）

| 物料               | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ------------------ | ------ | ---- | -------- | ---- | ---- | --------------- |
| `stats-indi`       | -      | ⏳   | —        | -    | -    | - min           |
| `stats-indi-grid`  | -      | ⏳   | 📄       | -    | -    | - min           |
| `stats-indi-group` | -      | ⏳   | —        | -    | -    | - min           |
| `status-display`   | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/4

### 边框 / 装饰（27）

| 物料                          | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| ----------------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `decoration/border1`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border2`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border3`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border4`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border5`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border6`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border7`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border8`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border9`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border10`         | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border11`         | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/border12`         | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration1`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration2`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration3`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration4`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration5`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration6`      | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/decoration7`      | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/decoration8`      | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/decoration9`      | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/decoration10`     | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/decoration11`     | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/decoration12`     | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/hexagon`          | -      | ⏳   | —        | -    | -    | - min           |
| `decoration/flash-point`      | -      | ⏳   | 📄       | -    | -    | - min           |
| `decoration/common-container` | -      | ⏳   | 📄       | -    | -    | - min           |

> 已画像 0/27

### 其他（6）

| 物料                  | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |
| --------------------- | ------ | ---- | -------- | ---- | ---- | --------------- |
| `render-stage-loader` | -      | ⏳   | 📄       | -    | -    | - min           |
| `zone-setting`        | -      | ⏳   | —        | -    | -    | - min           |
| `area-business-vol`   | -      | ⏳   | —        | -    | -    | - min           |
| `echarts-line-dual-x` | -      | ⏳   | 📄       | -    | -    | - min           |
| `echarts-3d-pie`      | -      | ⏳   | —        | -    | -    | - min           |
| `top-n`               | -      | ⏳   | —        | -    | -    | - min           |

> 已画像 0/6

## 推进建议

当前覆盖率 9.1%，后续批次建议：

1. **第一批**（已做，11 个）：8 个有 5+1 文档物料 + 3 个高频（echarts-map/table/top-rank）
2. **第二批**（已完成，10 个）：表格全部完成（table + drilldown-table + drilldown-table-2 + expandable-table + pagination-table + table-detail + table-fixedColumns + table-transpose + transfer-table + alarm-window-card）
3. **第三批**（建议）：列表/排行（13 个全做）— 高频复用率高
4. **第四批**：图表 ECharts 剩余（4 个）+ oss-chart-plots 系列（23 个，建议抽取通用 schema 模板）
5. **第五批**：数字/指标卡、容器/布局、地图、其他
6. **最后**：边框/装饰（27 个，纯样式，无数据交互，画像意义低）

## 与 development-assistant 清单的关系

-   本清单的**物料分类与名称**与 `oss-vis-material-development-assistant/materials/README.md` 保持一致（单一真相）
-   本清单**新增画像状态、评级、分数、搭建成本** 4 列（advisor 独有）
-   两份清单互为补充，**没有重复维护负担**
