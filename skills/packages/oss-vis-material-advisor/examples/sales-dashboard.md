---
title: 销售大盘 - 组合方案示范
description: 用 advisor 的 composition-rules.md 跑通一个真实业务场景，输出 Top 1-3 方案卡片
version: 0.1
last_updated: 2026-06-16
scenario: 销售大盘（实时销售额 + 品类占比 + 销售排行 + 标题 + 装饰）
---

# 销售大盘 - 组合方案示范

本文档演示如何用 [composition-rules.md](../references/composition-rules.md) 给定业务场景"销售大盘"推荐组合方案。

## 1. 场景输入

**业务描述**：
> 做一个销售大盘，需要：
> - 顶部展示实时销售总额（核心 KPI，带翻牌动画）
> - 左侧展示销售排行 Top10（横向条形图）
> - 右侧展示品类占比（饼图/环图）
> - 整体需要标题
> - 边框装饰提升科技感

## 2. 步骤 1：场景关键词提取

| 关键词类型 | 提取结果 |
|---|---|
| 业务实体 | 销售、品类 |
| 行为动词 | 排行、占比、总额 |
| 修饰词 | 实时、Top10 |

## 3. 步骤 2：物料候选池匹配

加载所有已画像物料（`profiles/*.json`）共 20 个，对每个画像做关键词匹配打分：

| 物料 | category | match_score | 匹配的业务场景 | 评级 | 标签 |
|---|---|---|---|---|---|
| `digital-flop` | 数字/指标卡 | **0.9** | "大屏核心 KPI 指标卡（订单总数、用户总数、销售额），带翻牌动画" | A | 🟢 独立优秀 |
| `echarts-bar` | 图表/ECharts | **0.85** | "销售业绩 Top10 排行"、"部门业绩横向对比" | A | 🟢 独立优秀 |
| `echarts-pie` | 图表/ECharts | **0.8** | "销售业绩 Top10 排行"（同 echarts-bar 业务场景，可同场景分用） | A | 🟢 独立优秀 |
| `top-rank` | 列表/排行 | 0.7 | 排名展示 | B | 🟡 组合可用 |
| `table` | 表格 | 0.4 | （不直接匹配，但表格可做销售明细） | B | 🟡 组合可用 |
| `normal-label` | 文本/标签/标题 | 0.3 | 标题 | A | 🟢 独立优秀 |
| `digital-card` | 数字/指标卡 | 0.3 | "业务核心指标展示" | B | 🟡 组合可用 |
| `bidirectional-progress` | 进度/加载 | 0.2 | （不直接匹配） | A | 🟢 独立优秀 |
| `free-layout-indicators-viewer` | 容器/布局 | 0.2 | 容器 | B | 🟡 组合可用 |
| `dock-menu` | 容器/布局 | 0.1 | （不直接匹配） | B | 🟡 组合可用 |
| `echarts-map` | 地图 | 0.1 | （不直接匹配） | B | 🟡 组合可用 |

> `match_score >= 0.3` 入候选池 → **6 个候选**：digital-flop / echarts-bar / echarts-pie / top-rank / table / normal-label

## 4. 步骤 3：组合方案生成

### 必备物料判定

按"数据大盘"标准模板：**1-2 个数字卡 + 1-2 个图表 + 标题 + 边框**。

- 数字卡：`digital-flop`（KPI 翻牌）
- 图表：`echarts-bar`（排行）+ `echarts-pie`（占比）
- 标题：`normal-label`
- 装饰：`decoration/border1`（边框通用占位，实际可换 `decoration1~12` 任意一款）

### 候选组合

按"贪心 + 约束"算法，输出 3 个方案：

| 方案 | 物料数 | 物料清单 | 适用场景 |
|---|---|---|---|
| 方案 1（推荐） | 4 | digital-flop + echarts-bar + echarts-pie + normal-label | 顶部 KPI + 排行 + 占比 + 标题，**大屏最常见形态** |
| 方案 2（紧凑） | 3 | digital-flop + echarts-bar + normal-label | 去掉饼图，节省空间 |
| 方案 3（明细型） | 4 | digital-flop + echarts-bar + table + normal-label | 排行 + 明细表格，更适合运维/财务 |

## 5. 步骤 4：组合代价计算

### 兼容性矩阵（从画像 `composability.compatible_with` 读取）

| 物料 A | 物料 B | 代价 | 原因 |
|---|---|---|---|
| digital-flop | echarts-bar | 🟢 低 | 数字卡消费独立 dataSource，可与本图表并列展示同主题数据 |
| digital-flop | echarts-pie | 🟢 低 | 同上 |
| digital-flop | normal-label | 🟢 低 | 标签独立无依赖 |
| echarts-bar | echarts-pie | 🟢 低 | 同分类图表，数据格式可独立，按场景分用 |
| echarts-bar | normal-label | 🟢 低 | 标题标签独立无依赖 |
| echarts-pie | normal-label | 🟢 低 | 标题标签独立无依赖 |
| 任何物料 | decoration/border* | 🟢 低 | 边框装饰无依赖（advisor 经验判断，未单独画像） |

> **方案 1 的组合代价 = 🟢 低**：所有物料对代价都是"低"，无需写胶水代码。

### compatibility_score

```
方案 1:
  物料对数 = C(4,2) = 6
  平均代价 = 0
  compatibility_score = 5 - 0 = 5.0
```

## 6. 步骤 5：方案评级 + 输出卡片

### 方案 1（推荐）

```json
{
  "scheme": {
    "rank": 1,
    "scenario": "销售大盘",
    "label": "🟢 直接可搭",
    "grade": "A",
    "score": 4.7,
    "materials": [
      { "name": "digital-flop", "role": "核心 KPI（销售总额）", "cost_minutes": 8 },
      { "name": "echarts-bar", "role": "销售排行 Top10", "cost_minutes": 6 },
      { "name": "echarts-pie", "role": "品类占比", "cost_minutes": 7 },
      { "name": "normal-label", "role": "大屏标题", "cost_minutes": 2 }
    ],
    "total_minutes": 28,
    "composition_cost": "低",
    "needs_custom_dev": false,
    "warnings": [],
    "suggestions": [
      "可加 decoration/border1 包裹整体提升科技感（约 +2 分钟）",
      "echarts-bar 如需点击下钻，打开 drillable 开关（约 +5 分钟）",
      "echarts-pie 如需南丁格尔玫瑰图，切换 roseType 字段（约 +1 分钟）"
    ]
  }
}
```

#### 评分明细

| 维度 | 权重 | 评分 | 依据 |
|---|---|---|---|
| 业务贴合度 | 30% | 5 | 4 个物料完全对应 4 个业务子场景，无冗余 |
| 物料数量合理性 | 20% | 5 | 4 个物料（≤5 满分） |
| 组合代价 | 25% | 5 | 全部"低"代价 = 5 分 |
| 搭建总成本 | 15% | 4 | 28 分钟（30-60 区间）= 4 分 |
| 是否需要二开 | 10% | 5 | 否 |
| **总分** | | **4.7** | **🟢 直接可搭** |

### 方案 2（紧凑）

```json
{
  "scheme": {
    "rank": 2,
    "scenario": "销售大盘（紧凑版）",
    "label": "🟢 直接可搭",
    "grade": "A",
    "score": 4.4,
    "materials": [
      { "name": "digital-flop", "role": "核心 KPI", "cost_minutes": 8 },
      { "name": "echarts-bar", "role": "销售排行 Top10", "cost_minutes": 6 },
      { "name": "normal-label", "role": "大屏标题", "cost_minutes": 2 }
    ],
    "total_minutes": 19,
    "composition_cost": "低",
    "needs_custom_dev": false,
    "warnings": [
      "缺少品类占比维度，业务信息量少 1/3"
    ],
    "suggestions": [
      "适合屏幕空间紧张的场景（如手机端或 16:9 屏幕的左侧小区域）"
    ]
  }
}
```

### 方案 3（明细型）

```json
{
  "scheme": {
    "rank": 3,
    "scenario": "销售大盘（明细型）",
    "label": "🟡 需少量配置",
    "grade": "B",
    "score": 4.0,
    "materials": [
      { "name": "digital-flop", "role": "核心 KPI", "cost_minutes": 8 },
      { "name": "echarts-bar", "role": "销售排行 Top10", "cost_minutes": 6 },
      { "name": "table", "role": "销售明细表", "cost_minutes": 5 },
      { "name": "normal-label", "role": "大屏标题", "cost_minutes": 2 }
    ],
    "total_minutes": 23,
    "composition_cost": "中",
    "needs_custom_dev": false,
    "warnings": [
      "table 的列配置需要根据实际数据结构调整（约 +10 分钟）"
    ],
    "suggestions": [
      "适合需要看具体销售订单明细的财务/销售管理场景"
    ]
  }
}
```

> **方案 3 的兼容性**：`table` 与 `echarts-bar` 的数据格式不通用（table 多列、bar 单指标），需要为 table 单独配置 dataSource。组合代价从中升为"中"。

## 7. 实施清单（从方案 1 出发）

### 配置项（必填）

| 物料 | 必填字段 | 必填数据字段 |
|---|---|---|
| `digital-flop` | `config.title`、`config.number.flopType`、`config.number.size` | `value`（销售总额） |
| `echarts-bar` | `config.title`、`config.chart.color` | `dimensionName`、`indicatorValue` |
| `echarts-pie` | `config.title`、`config.chart.color` | `name`、`value` |
| `normal-label` | `config.title`、`config.text.content` | — |

### 数据契约（统一约定）

```js
// 推荐：所有物料共用一套 dataSource
const dataSource = {
  // 1. 销售总额（给 digital-flop）
  total: [{ value: 12345678, suffix: '元' }],
  // 2. 销售排行（给 echarts-bar）
  ranking: [
    { dimensionName: 'A 产品', indicatorValue: 9800 },
    { dimensionName: 'B 产品', indicatorValue: 8500 },
    // ...Top 10
  ],
  // 3. 品类占比（给 echarts-pie）
  categoryShare: [
    { name: '电子产品', value: 4500 },
    { name: '服装', value: 3200 },
    { name: '食品', value: 2100 }
  ]
};
```

### 总成本估算

| 物料 | 搭建耗时（minimal） |
|---|---|
| digital-flop | 8 min |
| echarts-bar | 6 min |
| echarts-pie | 7 min |
| normal-label | 2 min |
| decoration/border1 | 2 min |
| 集成（统一主题/尺寸/数据流） | 5 min（4 物料） |
| **总计** | **30 min** |

## 8. 关键约束提醒

| 约束 | 说明 |
|---|---|
| **digital-flop 是单对象** | `dataSource` 是单对象不是数组，多元素会被截断（详见 [digital-flop.json § 1](../profiles/digital-flop.json)） |
| **digital-flop 隐式字段 id** | 点击事件派发依赖 `dataSource.id`，schema 中只声明 `onClickId` 字段映射名（详见 [digital-flop.json § 2](../profiles/digital-flop.json)） |
| **echarts-bar 多系列需 compareType** | 单系列不传 `compareType`；多系列必传，否则走单系列分支 |
| **echarts-bar drillable 下钻** | `dataModel` 无 `id` 字段 → `onClickId` 派发永远为 `undefined`（详见 [echarts-bar.json § 4](../profiles/echarts-bar.json)） |
| **echarts-pie 系列名不可省略** | 饼图每条数据必须有 `name` 和 `value` 字段 |

## 9. 后续优化方向

- 加入 `echarts-map`（地区维度）→ 4 物料组合，total 估算 +15 分钟
- 加入 `top-rank`（销售员排行）替换 `echarts-bar` → 物料数不变
- 加入 `bidirectional-progress`（同比环比对比）→ 5 物料组合
- 加入 `dock-menu`（多页面切换）→ 升级为综合仪表盘

## 10. 参考

- [composition-rules.md § 步骤 1-5](../references/composition-rules.md#步骤-1场景关键词提取)
- [profiles/digital-flop.json](../profiles/digital-flop.json)
- [profiles/echarts-bar.json](../profiles/echarts-bar.json)
- [profiles/echarts-pie.json](../profiles/echarts-pie.json)
- [profiles/normal-label.json](../profiles/normal-label.json)
