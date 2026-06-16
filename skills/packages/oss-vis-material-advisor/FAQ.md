---
title: 常见问题（PM 视角）
description: 产品经理 / 设计师 / 研发用 advisor skill 时的常见疑问
version: 0.1
last_updated: 2026-06-16
audience: 产品经理、设计师、研发
---

# 常见问题（PM 视角）

> 本文件回答"我想要 X 场景，用哪个物料"这类问题。
> 涉及具体物料的细节，去看 `profiles/{name}.json` 画像。

## 选物料

### Q1：我想做"实时销售总额"展示，用哪个？

**直接用 [`digital-flop`](../profiles/digital-flop.json)**（🟢 独立优秀，4.0 分）。

- 单数字翻牌动画是它的核心能力
- 数据契约最简：单对象 `{ value: 123, render: 1 }` 或单元素数组
- 8 分钟可搭出可演示原型

如需要"销售总额 + 同比环比 + 趋势"，依然用 `digital-flop` + 配置 `trend.isLevel` 即可。**不需要组合**。

### Q2：我想做"销售排行 Top10"，用 echarts-bar 还是 top-rank？

**优先 [`echarts-bar`](../profiles/echarts-bar.json)**（🟢 独立优秀，4.2 分）。

| 维度 | echarts-bar | top-rank |
|---|---|---|
| 视觉 | 横向条形（ECharts 渲染） | 列表式排名 |
| 数据复杂度 | 支持多系列（compareType） | 单系列 |
| 配置项数 | 50+ | 较少 |
| 交互 | 下钻 + Modal/Drawer | ⚠️ 无 |
| 文档完整度 | 5+1 全套 | ⚠️ 缺 |
| 适合场景 | 运营、销售、管理驾驶舱 | 简单的"前 N 名"展示 |

**结论**：能上 `echarts-bar` 就上 `echarts-bar`，top-rank 留作"备胎"（如果 echarts-bar 太重 / 屏幕空间太小时）。

### Q3：饼图/环图/玫瑰图，用哪个？

**统一用 [`echarts-pie`](../profiles/echarts-pie.json)**（🟢 独立优秀，4.3 分）。

- 通过 `chart.type` 字段切换 `pie` / `doughnut` / `rose` 三种模式
- 7 分钟可搭出可演示原型

不要混用 oss-chart-plots 系列的 `pie`（适配场景窄、配置少）。

### Q4：地图用 echarts-map 还是 baidu-map？

| 场景 | 推荐 |
|---|---|
| 平面地图 + 下钻（省-地市-区县） | [`echarts-map`](../profiles/echarts-map.json)（🟡 3.7） |
| 真实地图 + 道路/POI | `baidu-map`（未画像） |
| 飞线/迁徙/物流 | `oss-chart-fly-line-map`（未画像） |
| 3D 地图 / 倾斜摄影 | `geo-3d-map`（未画像） |

> ⚠️ echarts-map 51 分钟的搭建成本主要来自**省/地市 GeoJSON 数据**的准备，需要单独提供。

### Q5：表格用 table 还是 expandable-table？

| 场景 | 推荐 |
|---|---|
| 标准表格 + 简单点击 | [`table`](../profiles/table.json)（🟡 3.8，5 min） |
| 下钻 + 详情弹窗 | `drilldown-table` / `drilldown-table-2`（未画像） |
| 树形/分组 | `expandable-table`（未画像） |
| 分页 + 大数据量 | `pagination-table`（未画像） |
| 行列转置 | `table-transpose`（未画像） |

> ⚠️ `drilldown-table` / `drilldown-table-2` 是直接 import `table` 的，**改 table 会影响所有衍生物料**。

## 组合

### Q6：我想做大屏，标准组合是什么？

详见 [examples/sales-dashboard.md](../examples/sales-dashboard.md) 的方案 1：

```
digital-flop（核心 KPI）
  + echarts-bar（排行）
  + echarts-pie（占比）
  + normal-label（标题）
  + decoration/border1（装饰，可选）
```

总成本约 30 分钟，组合代价低。

### Q7：什么时候用 free-layout-indicators-viewer？

[`free-layout-indicators-viewer`](../profiles/free-layout-indicators-viewer.json)（🟡 3.5，25 min）是**自由布局的指标卡容器**，适合：

- 多个数字指标要在屏幕上"摆位置"（非默认横向/网格布局）
- 需要坐标点级别的精确定位（用 MonacoEditor 配置坐标）

如果只是几个数字卡 + 网格布局，**直接堆 `digital-flop` 即可**。

### Q8：dock-menu 是不是必须的？

[`dock-menu`](../profiles/dock-menu.json)（🟡 3.5，15 min）是侧边菜单，**只在需要"多页面/多 Tab 切换"时用**。

- 单页面大屏不需要
- 多页面综合仪表盘才需要

## 成本

### Q9：搭建一个最小可用 demo 要多久？

参考 `profiles/{name}.json` 的 `build_cost.estimated_minutes`：

| 物料 | 最小成本 |
|---|---|
| normal-label | 2 min |
| digital-card | 5 min |
| table | 5 min |
| echarts-bar | 6 min |
| echarts-pie | 7 min |
| digital-flop | 8 min |
| bidirectional-progress | 10 min |
| top-rank | 10 min |
| dock-menu | 15 min |
| echarts-map | 51 min |
| free-layout-indicators-viewer | 25 min |

### Q10：什么情况下需要二开（`needs_custom_dev: true`）？

当前 20 个画像中**没有二开需求**（全部 `false`）。但根据 [cost-estimation.md § 二次开发判定](../references/cost-estimation.md#二次开发判定-needs_custom_dev) 文档，**未来可能触发的场景**：

| 场景 | 触发原因 |
|---|---|
| 数据格式转换 | schema 配置的下钻目标物料 dataModel 不一致 |
| 样式深度定制 | 默认值无法满足视觉规范（品牌色、字体） |
| 多数据源融合 | 同一物料消费多份 dataSource，需合并逻辑 |
| 特殊交互 | 拖拽、热区、自定义弹窗 |

## 评级

### Q11：为什么有些物料是 🟡 组合可用，而不是 🟢 独立优秀？

"独立优秀"要求物料能**独立讲清一个完整的业务故事**。`🟡 组合可用` 物料的共同特征：

| 物料 | 评级 | 不能独立的原因 |
|---|---|---|
| digital-card | 🟡 3.4 | 仅 1 个简单场景（单条 {label, value} + 渐变 + 左边框），需配合标题/数字/边框 |
| top-rank | 🟡 3.4 | 纯展示无交互，需配合标题/排名数据源 |
| table | 🟡 3.8 | 表格本身是结构，需配合列定义/数据 |
| echarts-map | 🟡 3.7 | 地图需要 GeoJSON 数据 + 指标数据 |
| dock-menu | 🟡 3.5 | 菜单需要配合主面板的"页面切换"事件 |
| free-layout-indicators-viewer | 🟡 3.5 | 容器需要配合子物料 |

### Q12：🔴 组合复杂、⚫ 不建议的物料有哪些？

**当前 20 个画像中 0 个**。所有已画像物料的评级都在 A/B 之间。

如果未来发现某物料评分为 C 或 D，advisor 会通过 `composability.incompatible_with` 字段给出警示。

## 流程

### Q13：怎么向 PM 展示 advisor 的结论？

1. **单物料选型**：直接给 `profiles/{name}.json` 的 6 维评分 + 评级
2. **组合方案**：给 [examples/sales-dashboard.md](../examples/sales-dashboard.md) 这样的方案卡片
3. **搭建成本**：给 `build_cost.estimated_minutes` + `build_cost.breakdown`

PM 关心的是：**"这个物料能不能用？用多久？需不需要找研发二开？"** —— 这 3 个问题都能从画像里直接答。

### Q14：物料改了之后，画像会自动更新吗？

**不会**。advisor 是**只读 skill**，**永不修改 `src/packages/**` 下任何文件**（也不读 diff 监听改动）。

如需更新画像：
- 研发改完物料代码后，告诉 advisor "请为 `{material-name}` 重新生成画像"
- advisor 重新跑一遍 `references/profile-generation.md` 的流程，写回 `profiles/{name}.json`
- 如有评级变化，标 `version` 字段递增

## 进阶

### Q15：能不能跨物料共享数据源？

可以，但要看 `composability.compatible_with` 字段。

| 物料 A | 物料 B | 能共享 dataSource 吗 |
|---|---|---|
| digital-flop | echarts-bar | ❌ 单对象 vs 数组 |
| echarts-bar | echarts-pie | ❌ 多维度 vs name/value |
| digital-flop | digital-card | ❌ 单对象 vs 单条 {label,value} |
| echarts-bar | top-rank | ❌ bar 用 dimensionName/value，top-rank 用 rank/name/value |
| normal-label | 任何 | ✅ 文本物料无需数据 |

**建议**：每个物料用独立 dataSource，**用变量名区分**（如 `dataSource.kpi`、`dataSource.ranking`）。

### Q16：物料缺配置项 / 缺 dataModel 怎么办？

当前 20 个画像中**最常见的瑕疵**：

| 问题 | 出现频次 | 解决 |
|---|---|---|
| `oss-material.json.dataModel` 是空字符串 | 18/20 | 改为 `"./dataModel.json"` |
| `dataType: "String"` 用于 number 字段 | 5/20 | 改为 `"Number"` |
| 5+1 文档缺失 | 12/20 | 补表格 + 告警 + 地图物料的 5+1 文档 |
| 隐式字段（schema 未声明但代码读取） | 7/20 | 要么在 schema 显式声明，要么从代码移除 |

详见 [profiles/README.md § 跨画像发现](../profiles/README.md#跨画像发现)。
