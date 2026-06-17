---
title: 物料清单索引
description: src/packages 下所有带 oss-material.json 的有效物料清单（146 个），按分类组织，标注文档化状态
version: 1.3.0
last_updated: 2026-06-16
---

# 物料清单索引

本目录维护 `src/packages` 下所有**带 `oss-material.json` 的有效物料**的清单与文档化状态。

## 扫描方式

```bash
# 与 webpack 构建脚本保持一致（递归匹配）
glob.sync('src/packages/**/oss-material.json')
```

参考：`oss-scripts/config/webpack-components.config.js:57`

## 总览

| 分类                    | 数量    | 5+1 文档化 | 自带 doc（`packages/{name}/doc`） |
| ----------------------- | ------- | ---------- | --------------------------------- |
| 容器 / 布局             | 8       | 2          | 1                                 |
| 文本 / 标签 / 标题      | 5       | 3          | 2                                 |
| 数字 / 指标卡           | 7       | 2          | 1                                 |
| 列表 / 排行             | 11      | 2          | 5                                 |
| 表格                    | 10      | 1          | 4                                 |
| 表单 / 筛选             | 4       | 2          | 1                                 |
| 按钮 / 操作             | 5       | 0          | 3                                 |
| 轮播 / 公告             | 6       | 0          | 3                                 |
| 图表（ECharts）         | 8       | 2          | 4                                 |
| 图表（oss-chart-plots） | 23      | 0          | 0                                 |
| 地图                    | 8       | 0          | 5                                 |
| 3D / 拓扑               | 4       | 0          | 2                                 |
| 时钟 / 动画             | 5       | 1          | 1                                 |
| 媒体 / 播放             | 3       | 1          | 2                                 |
| 进度 / 加载             | 6       | 4          | 2                                 |
| 状态 / 标签             | 2       | 0          | 2                                 |
| 边框 / 装饰             | 25      | 0          | 0                                 |
| 其他                    | 6       | 0          | 0                                 |
| **合计**                | **146** | **20**     | **36**                            |

> 最后更新：2026-06-17（新增 oss-chart-map 物料文档）

## 状态说明

| 符号        | 含义                                                                  |
| ----------- | --------------------------------------------------------------------- |
| ✅ 完成     | 5 个文档（README / schema / data-model / common-tasks / gotchas）齐全 |
| 🚧 进行中   | 文档部分完成                                                          |
| ⏳ 待补充   | 尚未开始                                                              |
| ❌ 已废弃   | 物料已下线                                                            |
| 📄 自带 doc | 物料自带 `doc/readme.md`（设计器侧边栏渲染用）                        |

---

## ✅ 已完成 5+1 文档化的物料（20）

| 物料 | 分类 | 复杂度 | 核心特点 | 关键踩坑 |
| --- | --- | --- | --- | --- |
| [**free-layout-indicators-viewer**](./free-layout-indicators-viewer/README.md) | 容器 / 布局 | 高 | MonacoEditor 坐标点 + styled-components 渐变 + 个性化背景图 | 默认背景图静态资源依赖；`filterKey` 空格敏感 |
| [**echarts-bar**](./echarts-bar/README.md) | 图表（ECharts） | 中 | 多系列横向条形图 + 4 种下钻 + 性能优化 `shouldSetOption` | ⚠️ **孤儿文件 `index.jsx`**；`data.id` 派发无效（dataModel 无 id） |
| [**digital-flop**](./digital-flop/README.md) | 数字 / 指标卡 | 中 | TWEEN 动画 + 4 种下钻 + 级别渲染 + 文本渐变 | **隐式字段** `enableRemoveEndZero` / `fontSkew` / `id`（schema 未声明） |
| [**echarts-pie**](./echarts-pie/README.md) | 图表（ECharts） | 中 | 饼图/环图/玫瑰图 + 自定义填充色 + 标签引导线 + 下钻交互 | `data.sort` 修改原数组；`textStyle` 覆盖 `rich.name` |
| [**digital-card**](./digital-card/README.md) | 数字 / 指标卡 | 中 | 渐变背景 + 标题 + 数值 + 左边框装饰线 | `borderLeftColor` 未使用；`dataSource[0]` 无空值保护 |
| [**dock-menu**](./dock-menu/README.md) | 容器 / 布局 | 高 | hover 展开侧边菜单 + 热区交互 + 背景图/前缀图 + 选中态切换 | `activeKey` 类型兼容；`backgroundRepeat` 自定义值 `'full'` |
| [**normal-label**](./normal-label/README.md) | 文本 / 标签 / 标题 | 中 | 纯文本展示 + VisualTextStyle 配置 + 单字段数据 | `index.less` 为空；`disableTextAlign: true`；仅读 `dataSource[0]` |
| [**bidirectional-progress**](./bidirectional-progress/README.md) | 进度 / 加载 | 中 | 双向进度条 + 渐变色 + 斜线背景 + 激活动效 + Progress 子组件 | CSS transform 影响子元素；百分比溢出处理；斜线兼容性 |
| [**label-text**](./label-text/README.md) | 文本 / 标签 / 标题 | 高 | 文本渐变/阴影/描边/倒影 + 前缀图标 + 气泡提示 + 下钻交互（Modal/Drawer/Window） | `dataConfig` 默认数据是对象但组件兼容数组；`iconType` 字段未使用；渐变文本需 CSS 裁剪 |
| [**progress-list-bar**](./progress-list-bar/README.md) | 列表 / 排行 | 中 | 水平进度条列表 + 渐变色 + 进度点动画 + styled-components transient props | transient props `$` 前缀避免 DOM 透传；`keyframes` 动画性能优化 |
| [**textarea-label**](./textarea-label/README.md) | 文本 / 标签 / 标题 | 简单 | Input.TextArea + 文本样式 + 自适应高度 + 边框开关 | `disableTextAlign: true`；仅读 `dataSource[0]`；无 index.less |
| [**description-table**](./description-table/README.md) | 表格 | 中 | Descriptions 描述列表 + 动态列配置 + 单元格点击下钻 + 动态事件优先级 | 数据兼容对象/数组；`showColon` 仅 `bordered=false` 生效；派发 `${dataIndex}_id` |
| [**pagination-display**](./pagination-display/README.md) | 进度 / 加载 | 简单 | Pagination 分页 + total 双来源 + 页码/条数派发 | total 来源优先级 `extraResponse > dataSource`；`showSizeChanger/showQuickJumper` 固定 false |
| [**message-distribute**](./message-distribute/README.md) | 表单 / 筛选 | 中 | Transfer 号码选择 + Form 表单 + API 请求发送短信 + MonacoEditor 配置接口 | dataModel indicators 原为空已修复；dayjs 生成 callIndex |
| [**single-image**](./single-image/README.md) | 媒体 / 播放 | 中 | 位图/矢量图双模式 + 点击下钻 + 参数派发 + 可见范围控制 | `_.replace` 仅替换首次；`effect='page'` 已废弃；矢量图浏览器兼容性 |
| [**normal-clock**](./normal-clock/README.md) | 时钟 / 动画 | 简单 | dayjs 定时器 + 13 种时间格式 + 整点传参派发 | 无 dataModel.json（纯时间组件）；setInterval 每秒更新；兼容旧版本 switch case |
| [**circular-progress**](./circular-progress/README.md) | 进度 / 加载 | 简单 | D3.js 圆环 + 渐变 / 起点标识 / 4 起点方向 + 中心 DigitalFlop + 翻牌器复用 | ⚠️ **数组模式字段名不一致**（dataModel `percent/title` vs 代码 `value/name`）；`digitalFlopResolve` 直接修改 config；`Label.fontColor` 隐式未用 |
| [**popover-check**](./popover-check/README.md) | 表单 / 筛选 | 中 | 单/多选下拉 + TooltipBorder SVG 装饰边框 + 点击外部关闭 + 派发 select/selectLabel | ⚠️ **隐式字段 `defaultCheckedValue`**（代码读，schema 未声明）；`document.click` 全局监听；`containerStyle.borderWidth` 写死 2px |
| [**top-rank**](./top-rank/README.md) | 列表 / 排行 | 中 | TOP 排名 + 前 3 名独立配色（ArrayCollapse）+ 序号圆形 + 4 种字体样式面板 | ⚠️ **doc/README.md 与代码多处不一致**（声称点击派发 / TOP 数量 / 动画均未实现）；`value` 字段类型与实际值不一致；`id` 字段未使用 |

> 十九个物料都基于 **`develop` 分支当前代码**（2026-06-16 commit）生成，与 `release` 分支的兼容代码已剥离。
>
> ⚠️ 本批新增的 3 个物料（circular-progress、popover-check、top-rank）在文档化过程中**未修复源码问题**，仅在 gotchas.md 中记录，后续 PR 处理。

---

## 1. 容器 / 布局（8）

| 物料                                | 复杂度 | 文档                                                   | 状态           |
| ----------------------------------- | ------ | ------------------------------------------------------ | -------------- |
| `dock-menu`                         | 高     | [📄](./dock-menu/README.md) 🟦🟨🟩                     | ✅ 完成（5+1） |
| `ellipse-layout-indicator`          | 中     | ⏳ 待补充                                              | —              |
| `free-layout-ind-progress`          | 中     | ⏳ 待补充                                              | —              |
| `free-layout-indicator-group`       | 中     | ⏳ 待补充                                              | —              |
| **`free-layout-indicators-viewer`** | **高** | [📄](./free-layout-indicators-viewer/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `nine-grid`                         | 中     | ⏳ 待补充                                              | —              |
| `scene-over-view-hlj`               | 中     | ⏳ 待补充                                              | —              |
| `telescoping-board`                 | 中     | ⏳ 待补充                                              | —              |

> 维度图例：🟦 Schema 🟨 组件逻辑 🟩 数据格式

## 2. 文本 / 标签 / 标题（5）

| 物料                 | 复杂度 | 文档                                  | 状态           |
| -------------------- | ------ | ------------------------------------- | -------------- |
| `label-text`         | 高     | [📄](./label-text/README.md) 🟦🟨🟩   | ✅ 完成（5+1） |
| `message-distribute` | 简单   | ⏳ 待补充                             | —              |
| `normal-label`       | 中     | [📄](./normal-label/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `textarea-label`     | 简单   | ⏳ 待补充                             | —              |
| `description-table`  | 简单   | ⏳ 待补充                             | —              |

## 3. 数字 / 指标卡（7）

| 物料 | 复杂度 | 文档 | 状态 | 自带 doc |
| --- | --- | --- | --- | --- |
| `bidirectional-progress` | 简单 | [📄](./bidirectional-progress/README.md) 🟦🟨🟩 | ✅ 完成（5+1） | ❌ |
| `business-quality` | 中 | ⏳ 待补充 | — | ❌ |
| `business-scale` | 中 | ⏳ 待补充 | — | ❌ |
| `digital-card` | 中 | [📄](./digital-card/README.md) 🟦🟨🟩 | ✅ 完成（5+1） | ❌ |
| **`digital-flop`** | **中** | [📄](./digital-flop/README.md) 🟦🟨🟩 | ✅ 完成（5+1） | 📄 [doc/readme.md](../../../src/packages/digital-flop/doc/readme.md) |
| `indicator-display` | 简单 | ⏳ 待补充 | — | ❌ |
| `number-level-indicate` | 简单 | ⏳ 待补充 | — | ❌ |

## 4. 列表 / 排行（11）

| 物料                | 复杂度 | 文档                                       | 状态           |
| ------------------- | ------ | ------------------------------------------ | -------------- |
| `carousel-list`     | 中     | ⏳ 待补充                                  | —              |
| `carousel-notice`   | 中     | ⏳ 待补充                                  | —              |
| `carousel-param`    | 中     | ⏳ 待补充                                  | —              |
| `equip-list`        | 中     | ⏳ 待补充                                  | —              |
| `hot-app-top5`      | 中     | ⏳ 待补充                                  | —              |
| `monitor-topn-list` | 中     | ⏳ 待补充                                  | —              |
| `progress-list`     | 中     | ⏳ 待补充                                  | —              |
| `progress-list-bar` | 简单   | [📄](./progress-list-bar/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `top-rank`          | 中     | [📄](./top-rank/README.md) 🟦🟨🟩          | ✅ 完成（5+1） |
| `top-rank-shaanxi`  | 中     | ⏳ 待补充                                  | —              |
| `topn-rank`         | 中     | ⏳ 待补充                                  | —              |
| `topn-rank-one`     | 中     | ⏳ 待补充                                  | —              |
| `tree-list`         | 中     | ⏳ 待补充                                  | —              |
| `vertical-list`     | 中     | ⏳ 待补充                                  | —              |

## 5. 表格（10）

| 物料                 | 复杂度 | 文档      | 状态 |
| -------------------- | ------ | --------- | ---- |
| `drilldown-table`    | 中     | ⏳ 待补充 | —    |
| `drilldown-table-2`  | 中     | ⏳ 待补充 | —    |
| `expandable-table`   | 中     | ⏳ 待补充 | —    |
| `pagination-table`   | 中     | ⏳ 待补充 | —    |
| `table`              | 中     | ⏳ 待补充 | —    |
| `table-detail`       | 中     | ⏳ 待补充 | —    |
| `table-fixedColumns` | 中     | ⏳ 待补充 | —    |
| `table-transpose`    | 中     | ⏳ 待补充 | —    |
| `transfer-table`     | 中     | ⏳ 待补充 | —    |
| `alarm-window-card`  | 中     | ⏳ 待补充 | —    |

## 6. 表单 / 筛选（4）

| 物料                 | 复杂度 | 文档                                   | 状态           |
| -------------------- | ------ | -------------------------------------- | -------------- |
| `popover-check`      | 中     | [📄](./popover-check/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `popover-checkparam` | 简单   | ⏳ 待补充                              | —              |
| `query-form-group`   | 中     | ⏳ 待补充                              | —              |
| `range-picker`       | 中     | ⏳ 待补充                              | —              |

## 7. 按钮 / 操作（5）

| 物料                    | 复杂度 | 文档      | 状态 |
| ----------------------- | ------ | --------- | ---- |
| `custom-request-button` | 简单   | ⏳ 待补充 | —    |
| `export-btn`            | 简单   | ⏳ 待补充 | —    |
| `ghost-btn`             | 简单   | ⏳ 待补充 | —    |
| `iframe`                | 简单   | ⏳ 待补充 | —    |
| `visual-iframe`         | 简单   | ⏳ 待补充 | —    |

## 8. 轮播 / 公告（6）

| 物料                  | 复杂度 | 文档      | 状态 |
| --------------------- | ------ | --------- | ---- |
| `carousel-image-list` | 简单   | ⏳ 待补充 | —    |
| `carousel-list`       | 中     | ⏳ 待补充 | —    |
| `carousel-notice`     | 中     | ⏳ 待补充 | —    |
| `carousel-param`      | 中     | ⏳ 待补充 | —    |
| `tab-list`            | 中     | ⏳ 待补充 | —    |
| `tab-list-2`          | 中     | ⏳ 待补充 | —    |
| `tab-list-arc`        | 中     | ⏳ 待补充 | —    |
| `tab-list-static`     | 中     | ⏳ 待补充 | —    |

## 9. 图表 - ECharts（8）

| 物料 | 复杂度 | 文档 | 状态 | 自带 doc |
| --- | --- | --- | --- | --- |
| `circular-progress` | 简单 | ⏳ 待补充 | — | ❌ |
| `circular-progress-group` | 简单 | ⏳ 待补充 | — | ❌ |
| `circular-column` | 中 | ⏳ 待补充 | — | ❌ |
| `cone-bar` | 中 | ⏳ 待补充 | — | 📄 |
| `cone-bar-line` | 中 | ⏳ 待补充 | — | 📄 |
| `cone-single-bar` | 中 | ⏳ 待补充 | — | 📄 |
| `dual-axes-chart` | 中 | ⏳ 待补充 | — | ❌ |
| **`echarts-bar`** | **中** | [📄](./echarts-bar/README.md) 🟦🟨🟩 | ✅ 完成（5+1） | 📄 [doc/readme.md](../../../src/packages/echarts-bar/doc/readme.md) |
| `echarts-gauge` | 中 | ⏳ 待补充 | — | 📄 |
| `echarts-liquid` | 中 | ⏳ 待补充 | — | 📄 |
| `echarts-map` | 高 | ⏳ 待补充 | — | 📄 |
| `echarts-multi-variable-area-chart` | 中 | ⏳ 待补充 | — | ❌ |
| **`echarts-pie`** | **中** | [📄](./echarts-pie/README.md) 🟦🟨🟩 | ✅ 完成（5+1） | 📄 [doc/readme.md](../../../src/packages/echarts-pie/doc/readme.md) |
| `ind-list-echarts-gauge` | 简单 | ⏳ 待补充 | — | ❌ |
| `normal-process` | 中 | ⏳ 待补充 | — | ❌ |

## 10. 图表 - oss-chart-plots（23）

> 位于 `src/packages/oss-chart-plots/plots/`，共享同一基础 schema（来自 G2Plot/AntV Plots）

| 物料                     | 路径                                     | 复杂度 | 文档      | 状态 |
| ------------------------ | ---------------------------------------- | ------ | --------- | ---- |
| `plots/area`             | `oss-chart-plots/plots/area`             | 中     | ⏳ 待补充 | —    |
| `plots/bar`              | `oss-chart-plots/plots/bar`              | 中     | ⏳ 待补充 | —    |
| `plots/base-area`        | `oss-chart-plots/plots/base-area`        | 中     | ⏳ 待补充 | —    |
| `plots/base-scatter`     | `oss-chart-plots/plots/base-scatter`     | 中     | ⏳ 待补充 | —    |
| `plots/column`           | `oss-chart-plots/plots/column`           | 中     | ⏳ 待补充 | —    |
| `plots/double-gauge`     | `oss-chart-plots/plots/double-gauge`     | 中     | ⏳ 待补充 | —    |
| `plots/dual-axes`        | `oss-chart-plots/plots/dual-axes`        | 中     | ⏳ 待补充 | —    |
| `plots/dual-column-line` | `oss-chart-plots/plots/dual-column-line` | 中     | ⏳ 待补充 | —    |
| `plots/funnel`           | `oss-chart-plots/plots/funnel`           | 中     | ⏳ 待补充 | —    |
| `plots/gauge`            | `oss-chart-plots/plots/gauge`            | 中     | ⏳ 待补充 | —    |
| `plots/histogram`        | `oss-chart-plots/plots/histogram`        | 中     | ⏳ 待补充 | —    |
| `plots/line`             | `oss-chart-plots/plots/line`             | 中     | ⏳ 待补充 | —    |
| `plots/liquid`           | `oss-chart-plots/plots/liquid`           | 中     | ⏳ 待补充 | —    |
| `plots/pie`              | `oss-chart-plots/plots/pie`              | 中     | ⏳ 待补充 | —    |
| `plots/radar`            | `oss-chart-plots/plots/radar`            | 中     | ⏳ 待补充 | —    |
| `plots/rose`             | `oss-chart-plots/plots/rose`             | 中     | ⏳ 待补充 | —    |
| `plots/sankey`           | `oss-chart-plots/plots/sankey`           | 中     | ⏳ 待补充 | —    |
| `plots/series-area`      | `oss-chart-plots/plots/series-area`      | 中     | ⏳ 待补充 | —    |
| `plots/series-bar`       | `oss-chart-plots/plots/series-bar`       | 中     | ⏳ 待补充 | —    |
| `plots/series-column`    | `oss-chart-plots/plots/series-column`    | 中     | ⏳ 待补充 | —    |
| `plots/stack-bar`        | `oss-chart-plots/plots/stack-bar`        | 中     | ⏳ 待补充 | —    |
| `plots/stack-column`     | `oss-chart-plots/plots/stack-column`     | 中     | ⏳ 待补充 | —    |
| `plots/word-cloud`       | `oss-chart-plots/plots/word-cloud`       | 中     | ⏳ 待补充 | —    |

> 💡 这 23 个图表 schema 高度相似，文档化时可考虑抽取**通用 schema 模式**到 `materials/oss-chart-plots/_common.md`，每个 plot 只需写差异点。

## 11. 地图（8）

| 物料                     | 复杂度 | 文档      | 状态 |
| ------------------------ | ------ | --------- | ---- |
| `baidu-map`              | 中     | ⏳ 待补充 | —    |
| `baidu-map-unicom`       | 中     | ⏳ 待补充 | —    |
| `geo-3d-map`             | 高     | ⏳ 待补充 | —    |
| `geo-cascader`           | 中     | ⏳ 待补充 | —    |
| `oss-chart-classify-map` | 高     | ⏳ 待补充 | —    |
| `oss-chart-fly-line-map` | 高     | ⏳ 待补充 | —    |
| `oss-chart-map`          | 高     | [📄](./oss-chart-map/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `oss-gis`                | 高     | ⏳ 待补充 | —    |

## 12. 3D / 拓扑（4）

| 物料                       | 复杂度 | 文档      | 状态 |
| -------------------------- | ------ | --------- | ---- |
| `model-3d/smart-warehouse` | 高     | ⏳ 待补充 | —    |
| `twaver-topo`              | 高     | ⏳ 待补充 | —    |
| `virtual-3d-column`        | 中     | ⏳ 待补充 | —    |
| `virtual-3d-column-normal` | 中     | ⏳ 待补充 | —    |

## 13. 时钟 / 动画（5）

| 物料               | 复杂度 | 文档      | 状态 |
| ------------------ | ------ | --------- | ---- |
| `levitated-sphere` | 中     | ⏳ 待补充 | —    |
| `normal-clock`     | 简单   | ⏳ 待补充 | —    |
| `path-animation`   | 中     | ⏳ 待补充 | —    |
| `svg-render`       | 高     | ⏳ 待补充 | —    |
| `warning-board`    | 中     | ⏳ 待补充 | —    |

## 14. 媒体 / 播放（3）

| 物料              | 复杂度 | 文档      | 状态 |
| ----------------- | ------ | --------- | ---- |
| `single-image`    | 简单   | ⏳ 待补充 | —    |
| `video-playback`  | 简单   | ⏳ 待补充 | —    |
| `weather-display` | 简单   | ⏳ 待补充 | —    |

## 15. 进度 / 加载（6）

| 物料                      | 复杂度 | 文档                                            | 状态           |
| ------------------------- | ------ | ----------------------------------------------- | -------------- |
| `bidirectional-progress`  | 简单   | [📄](./bidirectional-progress/README.md) 🟦🟨🟩 | ✅ 完成（5+1） |
| `circular-progress`       | 简单   | [📄](./circular-progress/README.md) 🟦🟨🟩      | ✅ 完成（5+1） |
| `circular-progress-group` | 简单   | ⏳ 待补充                                       | —              |
| `normal-process`          | 中     | ⏳ 待补充                                       | —              |
| `pagination-display`      | 简单   | [📄](./pagination-display/README.md) 🟦🟨🟩     | ✅ 完成（5+1） |
| `progress-list`           | 中     | ⏳ 待补充                                       | —              |
| `progress-list-bar`       | 简单   | [📄](./progress-list-bar/README.md) 🟦🟨🟩      | ✅ 完成（5+1） |

## 16. 状态 / 标签（2）

| 物料               | 复杂度 | 文档      | 状态 |
| ------------------ | ------ | --------- | ---- |
| `stats-indi`       | 中     | ⏳ 待补充 | —    |
| `stats-indi-grid`  | 中     | ⏳ 待补充 | —    |
| `stats-indi-group` | 中     | ⏳ 待补充 | —    |
| `status-display`   | 中     | ⏳ 待补充 | —    |

## 17. 边框 / 装饰（25）

> 位于 `src/packages/decoration/`，纯装饰类，无数据交互

### 边框系列（12）

| 物料                  | 文档      | 状态 |
| --------------------- | --------- | ---- |
| `decoration/border1`  | ⏳ 待补充 | —    |
| `decoration/border2`  | ⏳ 待补充 | —    |
| `decoration/border3`  | ⏳ 待补充 | —    |
| `decoration/border4`  | ⏳ 待补充 | —    |
| `decoration/border5`  | ⏳ 待补充 | —    |
| `decoration/border6`  | ⏳ 待补充 | —    |
| `decoration/border7`  | ⏳ 待补充 | —    |
| `decoration/border8`  | ⏳ 待补充 | —    |
| `decoration/border9`  | ⏳ 待补充 | —    |
| `decoration/border10` | ⏳ 待补充 | —    |
| `decoration/border11` | ⏳ 待补充 | —    |
| `decoration/border12` | ⏳ 待补充 | —    |

### 装饰图形（11）

| 物料                      | 文档      | 状态 |
| ------------------------- | --------- | ---- |
| `decoration/decoration2`  | ⏳ 待补充 | —    |
| `decoration/decoration3`  | ⏳ 待补充 | —    |
| `decoration/decoration4`  | ⏳ 待补充 | —    |
| `decoration/decoration5`  | ⏳ 待补充 | —    |
| `decoration/decoration6`  | ⏳ 待补充 | —    |
| `decoration/decoration7`  | ⏳ 待补充 | —    |
| `decoration/decoration8`  | ⏳ 待补充 | —    |
| `decoration/decoration9`  | ⏳ 待补充 | —    |
| `decoration/decoration10` | ⏳ 待补充 | —    |
| `decoration/decoration11` | ⏳ 待补充 | —    |
| `decoration/decoration12` | ⏳ 待补充 | —    |

> 注：`decoration/decoration1` 暂无 `oss-material.json`，未列入

### 特殊装饰（2）

| 物料                     | 文档      | 状态 |
| ------------------------ | --------- | ---- |
| `decoration/hexagon`     | ⏳ 待补充 | —    |
| `decoration/flash-point` | ⏳ 待补充 | —    |

## 18. 其他（6）

| 物料                     | 复杂度 | 文档      | 状态 |
| ------------------------ | ------ | --------- | ---- |
| `carousel-image-list`    | 简单   | ⏳ 待补充 | —    |
| `ind-list-echarts-gauge` | 简单   | ⏳ 待补充 | —    |
| `pagination-display`     | 简单   | ⏳ 待补充 | —    |
| `popover-checkparam`     | 简单   | ⏳ 待补充 | —    |
| `stats-indi-group`       | 中     | ⏳ 待补充 | —    |
| `tab-list-static`        | 中     | ⏳ 待补充 | —    |

---

## 贡献指南

### 物料维护的三个维度（5+1 段式）

每个物料的文档需明确区分三类维护内容，**不要混写**：

| 维度             | 图例 | 文档                 | 关注点                           |
| ---------------- | ---- | -------------------- | -------------------------------- |
| **Schema 维护**  | 🟦   | `schema.md`          | 配置面板、分组、x-component      |
| **组件逻辑维护** | 🟨   | `component-logic.md` | TSX、props、hooks、子组件、样式  |
| **数据格式**     | 🟩   | `data-model.md`      | dataModel.json、数据流、匹配规则 |

### 新增物料文档流程

1. **判定有效性**：在 `src/packages/{name}/` 确认有 `oss-material.json`
2. **阅读三类源码**：
    - 🟦 `schema.ts`（配置面板）
    - 🟨 `index.tsx` + `components/*` + `index.less`（组件代码）
    - 🟩 `dataModel.json`（数据契约）
3. **按 5+1 段式创建文档**（[模板](./_template.md)）：
    ```
    materials/{name}/
    ├── README.md         # 概述 + 三类索引
    ├── schema.md         # 🟦
    ├── component-logic.md # 🟨
    ├── data-model.md     # 🟩
    ├── common-tasks.md   # 跨三类，标注涉及维度
    └── gotchas.md        # 选填
    ```
4. **同步本清单**：将状态改为 `🚧 进行中` 或 `✅ 完成（5+1）`
5. **跨文档引用**：在 schema/component-logic/data-model 互相标注（见模板末尾"跨文档引用规范"）

### 系列物料共享文档

对于 `oss-chart-plots/plots/*`（23 个）、`decoration/*`（25 个）这类高度相似的系列：

-   抽取通用模式到 `materials/{series}/_common.md`（覆盖三类）
-   每个变体只写差异点（如特殊 x-component、特殊配置项）
-   引用 \_common 时注明"通用" / "本物料特有"
