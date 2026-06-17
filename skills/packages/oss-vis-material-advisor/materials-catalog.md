---
title: 物料维护清单（advisor 视角）
description: advisor 对全部 154 个有效物料的画像/文档化状态总览，按 18 个分类组织
version: 0.3
last_updated: 2026-06-17
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
| 已画像      | 82（53.2%）  |
| 待画像      | 72（46.8%）  |
| 自带 doc    | 75（48.7%）  |
| 🟢 独立优秀 | 18           |
| 🟡 组合可用 | 64           |
| 🔴 组合复杂 | 0            |
| ⚫ 不建议   | 0            |

## 按分类

### 容器 / 布局（8）

| 物料                            | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `dock-menu`                     | 高     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 15 min          |
| `ellipse-layout-indicator`      | 中     | ✅   | 📄       | 🟡 组合可用 | 3.3  | 15 min          |
| `free-layout-ind-progress`      | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 12 min          |
| `free-layout-indicator-group`   | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 15 min          |
| `free-layout-indicators-viewer` | 高     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 25 min          |
| `nine-grid`                     | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 8 min           |
| `scene-over-view-hlj`           | 高     | ✅   | —        | 🟡 组合可用 | 3.2  | 25 min          |
| `telescoping-board`             | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 12 min          |

> 已画像 8/8 ✅ 全部完成

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
| `business-quality`       | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 8 min           |
| `business-scale`         | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 6 min           |
| `digital-card`           | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 5 min           |
| `digital-flop`           | 中     | ✅   | 📄       | 🟢 独立优秀 | 4    | 8 min           |
| `indicator-display`      | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 5 min           |
| `number-level-indicate`  | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 6 min           |

> 已画像 7/7 ✅ 全部完成

### 列表 / 排行（13）

| 物料                | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `carousel-list`     | 中     | ✅   | —        | 🟡 组合可用 | 3.7  | 12 min          |
| `carousel-notice`   | 中     | ✅   | 📄       | 🟡 组合可用 | 3.8  | 8 min           |
| `carousel-param`    | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 10 min          |
| `equip-list`        | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 10 min          |
| `hot-app-top5`      | 中     | ✅   | 📄       | 🟡 组合可用 | 3.9  | 10 min          |
| `monitor-topn-list` | 中     | ✅   | —        | 🟡 组合可用 | 3.7  | 12 min          |
| `progress-list`     | 中高   | ✅   | —        | 🟡 组合可用 | 3.7  | 10 min          |
| `top-rank`          | 简单   | ✅   | —        | 🟡 组合可用 | 3.4  | 10 min          |
| `top-rank-shaanxi`  | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 10 min          |
| `topn-rank`         | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 12 min          |
| `topn-rank-one`     | 中     | ✅   | 📄       | 🟡 组合可用 | 3.7  | 10 min          |
| `tree-list`         | 中高   | ✅   | —        | 🟢 独立优秀 | 4.0  | 15 min          |
| `vertical-list`     | 简单   | ✅   | —        | 🟡 组合可用 | 3.4  | 5 min           |

> 已画像 13/13 ✅ 全部完成

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
| `circular-column`                   | 中高   | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 5 min           |
| `cone-bar`                          | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 6 min           |
| `cone-bar-line`                     | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 8 min           |
| `cone-single-bar`                   | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 5 min           |
| `dual-axes-chart`                   | 高     | ✅   | —        | 🟡 组合可用 | 3.5  | 20 min          |
| `echarts-bar`                       | 中     | ✅   | 📄       | 🟢 独立优秀 | 4.2  | 6 min           |
| `echarts-gauge`                     | 极高   | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 30 min          |
| `echarts-liquid`                    | 中     | ✅   | 📄       | 🟡 组合可用 | 3.4  | 5 min           |
| `echarts-map`                       | 高     | ✅   | —        | 🟡 组合可用 | 3.7  | 51 min          |
| `echarts-multi-variable-area-chart` | 极高   | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 15 min          |
| `echarts-pie`                       | 中     | ✅   | —        | 🟢 独立优秀 | 4.3  | 7 min           |
| `ind-list-echarts-gauge`            | 极高   | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 20 min          |

> 已画像 12/12 ✅ 全部完成

### 图表（oss-chart-plots）（23）

| 物料                                     | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ---------------------------------------- | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `oss-chart-plots/plots/area`             | 中     | ✅   | —        | 🟡 组合可用 | 3.6  | 6 min           |
| `oss-chart-plots/plots/bar`              | 中     | ✅   | —        | 🟡 组合可用 | 3.7  | 5 min           |
| `oss-chart-plots/plots/base-area`        | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 7 min           |
| `oss-chart-plots/plots/base-scatter`     | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 8 min           |
| `oss-chart-plots/plots/column`           | 中     | ✅   | —        | 🟢 独立优秀 | 4.0  | 5 min           |
| `oss-chart-plots/plots/double-gauge`     | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 8 min           |
| `oss-chart-plots/plots/dual-axes`        | 中高   | ✅   | 📄       | 🟡 组合可用 | 3.5  | 10 min          |
| `oss-chart-plots/plots/dual-column-line` | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 15 min          |
| `oss-chart-plots/plots/funnel`           | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 6 min           |
| `oss-chart-plots/plots/gauge`            | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 5 min           |
| `oss-chart-plots/plots/histogram`        | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 5 min           |
| `oss-chart-plots/plots/line`             | 中     | ✅   | —        | 🟡 组合可用 | 3.6  | 5 min           |
| `oss-chart-plots/plots/liquid`           | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 5 min           |
| `oss-chart-plots/plots/pie`              | 中     | ✅   | —        | 🟢 独立优秀 | 4.0  | 5 min           |
| `oss-chart-plots/plots/radar`            | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 7 min           |
| `oss-chart-plots/plots/rose`             | 中     | ✅   | —        | 🟡 组合可用 | 3.6  | 5 min           |
| `oss-chart-plots/plots/sankey`           | 中     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 7 min           |
| `oss-chart-plots/plots/series-area`      | 高     | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 18 min          |
| `oss-chart-plots/plots/series-bar`       | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 7 min           |
| `oss-chart-plots/plots/series-column`    | 中高   | ✅   | —        | 🟢 独立优秀 | 4.0  | 12 min          |
| `oss-chart-plots/plots/stack-bar`        | 中     | ✅   | —        | 🟡 组合可用 | 3.5  | 7 min           |
| `oss-chart-plots/plots/stack-column`     | 中高   | ✅   | 📄       | 🟢 独立优秀 | 4.0  | 10 min          |
| `oss-chart-plots/plots/word-cloud`       | 中     | ✅   | —        | 🟡 组合可用 | 3.4  | 5 min           |

> 已画像 23/23 ✅ 全部完成

### 地图（8）

| 物料                     | 复杂度 | 画像 | 自带 doc | 评级        | 分数 | 搭建（minimal） |
| ------------------------ | ------ | ---- | -------- | ----------- | ---- | --------------- |
| `baidu-map`              | 中     | ✅   | —        | 🟡 组合可用 | 3.6  | 30 min          |
| `baidu-map-unicom`       | 中     | ✅   | —        | 🟡 组合可用 | 3.2  | 30 min          |
| `geo-3d-map`             | 高     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 120 min         |
| `geo-cascader`           | 中     | ✅   | 📄       | 🟡 组合可用 | 3.5  | 15 min          |
| `oss-chart-classify-map` | 高     | ✅   | 📄       | 🟡 组合可用 | 3.4  | 90 min          |
| `oss-chart-fly-line-map` | 中高   | ✅   | 📄       | 🟡 组合可用 | 3.5  | 60 min          |
| `oss-chart-map`          | 高     | ✅   | 📄       | 🟡 组合可用 | 3.6  | 90 min          |
| `oss-gis`                | 高     | ✅   | 📄       | 🟡 组合可用 | 3.7  | 90 min          |

> 已画像 8/8 ✅ 全部完成

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

当前覆盖率 53.2%，后续批次建议：

1. **第一批**（已做，11 个）：8 个有 5+1 文档物料 + 3 个高频（echarts-map/table/top-rank）
2. **第二批**（已完成，10 个）：表格全部完成（table + drilldown-table + drilldown-table-2 + expandable-table + pagination-table + table-detail + table-fixedColumns + table-transpose + transfer-table + alarm-window-card）
3. **第三批**（已完成，13 个）：列表/排行全做（carousel-list / carousel-notice / carousel-param / equip-list / hot-app-top5 / monitor-topn-list / progress-list / top-rank-shaanxi / topn-rank / topn-rank-one / tree-list / vertical-list + 已有 top-rank）
4. **第四批**（已完成，9 个）：图表 ECharts 剩余全做（circular-column / cone-bar / cone-bar-line / cone-single-bar / dual-axes-chart / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge）
5. **第五批**（已完成，23 个）：oss-chart-plots 系列全做（area / bar / base-area / base-scatter / column / double-gauge / dual-axes / dual-column-line / funnel / gauge / histogram / line / liquid / pie / radar / rose / sankey / series-area / series-bar / series-column / stack-bar / stack-column / word-cloud）
6. **第六批**（已完成，18 个）：数字/指标卡（4 个）+ 容器/布局（6 个）+ 地图（8 个）全部完成
7. **下一批候选**（按价值排序）：3D/拓扑（4 个）+ 时钟/动画（5 个）+ 媒体/播放（3 个）+ 进度/加载（5 个）+ 状态/标签（4 个）+ 边框/装饰（27 个）+ 表单/筛选（4 个）+ 按钮/操作（5 个）+ 轮播/公告（5 个）+ 文本/标签/标题（4 个待画像）+ 其他（6 个）= 72 个待画像
8. **最后**：边框/装饰（27 个，纯样式，无数据交互，画像意义低）

## 与 development-assistant 清单的关系

-   本清单的**物料分类与名称**与 `oss-vis-material-development-assistant/materials/README.md` 保持一致（单一真相）
-   本清单**新增画像状态、评级、分数、搭建成本** 4 列（advisor 独有）
-   两份清单互为补充，**没有重复维护负担**
