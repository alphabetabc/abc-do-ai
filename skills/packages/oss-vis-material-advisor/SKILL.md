---
name: 'oss-vis-material-advisor'
description: '物料能力画像与评级顾问。扫描 src/packages 下物料的 schema.ts/index.tsx/dataModel.json，生成能力画像 JSON，输出单物料评级（独立/组合）、组合方案推荐、搭建成本评估。供产品经理选型、研发评估时调用。'
---

# OSS Visual Material Advisor

物料能力画像与评级顾问。**不写代码，只读代码生成画像 + 评级**。

## 与 `oss-vis-material-development-assistant` 的边界

| 维度 | development-assistant         | **advisor（本 skill）**                            |
| ---- | ----------------------------- | -------------------------------------------------- |
| 角色 | 物料开发者                    | 物料评估者 / 选型顾问                              |
| 目标 | "怎么正确地开发/维护一个物料" | "哪些物料能用、怎么用、代价多大"                   |
| 输入 | 需求 / Bug / 新配置项         | 业务场景描述 / 物料名                              |
| 输出 | 代码修改 + 文档更新           | 能力画像 JSON + 评级 + 组合方案 + 成本估算         |
| 操作 | 写文件、改 schema             | 只读代码（schema.ts / index.tsx / dataModel.json） |

**核心原则**：advisor 是只读的，**永远不修改 `src/packages/**` 下任何文件\*\*。

## 能力概览

| 任务                  | 说明                                                           | 输出                                               |
| --------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| **A. 单物料能力画像** | 读单个物料的 schema + 代码 + dataModel，生成结构化能力清单     | `profiles/{name}.json`                             |
| **B. 单物料评级**     | 基于画像 + 评级规则，给出"独立/组合"评级 + 等级（A/B/C/D）     | 评级标签 + 评分明细                                |
| **C. 组合方案推荐**   | 给定业务场景，从画像库匹配可组合的物料 + 推荐组合              | 方案卡片（含组合代价）                             |
| **D. 搭建成本评估**   | 评估用某物料（或某组合）搭出原型需要改多少配置、写多少数据接入 | 成本表（配置项数 / 数据字段数 / 是否需要二次开发） |

## 评级标准（核心）

来源：用户决策 ——"单个如果 ok，就是优秀，需要组合就是一般（即使是组合也要能快速组合，而不是经过复杂配置才能组合）"

### 评级标签

| 标签            | 含义                                                       | 触发条件                                                   |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| **🟢 独立优秀** | 单一物料能独立描述一个完整的业务场景模块                   | 物料本身包含数据展示 + 必要的视觉装饰，开箱即用            |
| **🟡 组合可用** | 单物料只覆盖场景的一部分，但可与少量（≤3）其他物料快速组合 | 组合内各物料配置项默认值匹配、数据格式兼容、无需写胶水代码 |
| **🔴 组合复杂** | 需要 4+ 物料组合 + 复杂配置 + 二次开发                     | 数据格式不一致、配置项需深度定制、需写交互胶水             |
| **⚫ 不建议**   | 当前物料存在明显缺陷或场景不匹配                           | schema 缺失关键配置 / dataModel 不规范 / 文档缺失严重      |

### 评级打分维度（每项 0-5 分，总分 = 加权平均）

| 维度               | 权重 | 评分依据                                                       |
| ------------------ | ---- | -------------------------------------------------------------- |
| **业务描述力**     | 30%  | 物料名/schema 字段是否贴近业务术语；是否能独立讲清一个业务故事 |
| **场景覆盖度**     | 20%  | 该类物料能覆盖该业务的几种典型变体（多系列、多维度）           |
| **配置完备度**     | 15%  | schema 配置项数量 + 是否有合理默认值 + 是否支持常用联动        |
| **数据契约清晰度** | 15%  | dataModel.json 是否规范、字段是否贴合真实业务流                |
| **文档完整度**     | 10%  | 5+1 文档 / `doc/readme.md` 是否齐全                            |
| **可组合性**       | 10%  | 与同分类其他物料的组合代价（数据格式、尺寸、主题一致性）       |

最终等级：

-   **A**（4.5+）：独立优秀
-   **B**（3.5-4.5）：组合可用
-   **C**（2.5-3.5）：组合复杂
-   **D**（<2.5）：不建议

## 任务导航

| 我想...            | 看哪份文档                                                                             |
| ------------------ | -------------------------------------------------------------------------------------- |
| 给单个物料生成画像 | [references/profile-generation.md](./references/profile-generation.md)                 |
| 评级一个物料       | [references/rating-rules.md](./references/rating-rules.md)                             |
| 评一个组合方案     | [references/composition-rules.md](./references/composition-rules.md)                   |
| 算搭建成本         | [references/cost-estimation.md](./references/cost-estimation.md)                       |
| 看完整示范         | [examples/sales-dashboard.md](./examples/sales-dashboard.md)（销售大盘组合方案）        |
| 查 PM 常见问题     | [FAQ.md](./FAQ.md)（选物料/组合/成本 16 个问题）                                       |
| 查已完成画像       | `profiles/` 目录 + `profiles/README.md`（20 个画像索引，含 9 个表格 + 1 个告警）            |
| 查物料维护清单     | [`materials-catalog.md`](./materials-catalog.md)（全 154 个物料 + 画像/文档/评级状态） |
| 接手 / 续做        | [`ROADMAP.md`](./ROADMAP.md)（已完成项 + 下一步 + 智能体恢复指南）|

## 物料能力画像 JSON Schema

`profiles/{material-name}.json` 的标准结构：

```json
{
    "name": "echarts-bar",
    "category": "图表/ECharts",
    "version": "develop",
    "scanned_at": "2026-06-16",

    "basic": {
        "main_file": "index.tsx",
        "schema_file": "schema.ts",
        "data_model_file": "dataModel.json",
        "has_doc_readme": true,
        "has_5plus1_docs": true,
        "complexity": "中"
    },

    "capabilities": {
        "data_formats": [
            {
                "format": "单系列一维数组",
                "example": "[{ name: 'A', value: 100 }]",
                "match_pattern": "data[0].field",
                "fields": ["name", "value"]
            }
        ],
        "interactions": [
            { "type": "drilldown", "trigger": "click", "config": "drilldownId" },
            { "type": "tooltip", "trigger": "hover", "config": "tooltipFormatter" }
        ],
        "visual_configs": {
            "color": "colorField / colorList",
            "size": "width / height (px)",
            "layout": "horizontal / vertical"
        },
        "default_values": {
            "drillable": false,
            "animation": true
        }
    },

    "business_scenarios": ["销售排行 Top10", "部门业绩对比", "地区分布横向条形"],

    "composability": {
        "compatible_with": [{ "material": "digital-flop", "cost": "低", "reason": "同主题、数据流独立" }],
        "incompatible_with": [{ "material": "echarts-pie", "cost": "中", "reason": "数据格式不统一，需预处理" }]
    },

    "rating": {
        "label": "🟢 独立优秀 | 🟡 组合可用 | 🔴 组合复杂 | ⚫ 不建议",
        "score": 4.2,
        "grade": "A | B | C | D",
        "breakdown": {
            "business_description": 4,
            "scenario_coverage": 4,
            "config_completeness": 4,
            "data_contract_clarity": 5,
            "doc_completeness": 4,
            "composability": 4
        },
        "reasoning": "..."
    },

    "build_cost": {
        "config_items_to_set": 5,
        "data_fields_to_provide": 2,
        "needs_custom_dev": false,
        "estimated_minutes": 15
    }
}
```

## 工作流程

### 单物料画像（任务 A）

1. **定位物料**：`src/packages/{name}/`，确认有 `oss-material.json`
2. **读三类文件**：
    - 🟦 `schema.ts`：解析所有配置项、x-component 类型、默认值
    - 🟨 `index.tsx` + `components/*`：解析 props、hooks、交互事件
    - 🟩 `dataModel.json`：解析数据契约、字段含义、匹配模式
3. **生成画像**：按上述 JSON Schema 写入 `profiles/{name}.json`
4. **交叉验证**：如果 `materials/{name}/` 已有 5+1 文档，对照人工文档修正画像

### 评级（任务 B）

1. 加载画像 `profiles/{name}.json`
2. 按 [rating-rules.md](./references/rating-rules.md) 的 6 个维度打分
3. 计算加权总分 → 等级 → 标签
4. 写回画像的 `rating` 字段

### 组合方案（任务 C）

1. 输入：业务场景描述（如"销售大盘"）
2. 关键词匹配 → 物料候选池
3. 加载每个候选的画像
4. 按 [composition-rules.md](./references/composition-rules.md) 计算组合代价
5. 输出 Top 1-3 方案卡片

### 成本评估（任务 D）

1. 加载画像的 `build_cost` 字段
2. 按 [cost-estimation.md](./references/cost-estimation.md) 校准
3. 输出：配置项数 / 数据字段数 / 是否需要二次开发 / 预估时长

## 分批推进策略

**已完成批次**：

- **第一批（11 个物料）**：8 个已完成 5+1 文档物料（交叉验证流程） + 3 个高频（echarts-map / table / top-rank）
- **第二批（9 个表格）**：drilldown-table / drilldown-table-2 / expandable-table / pagination-table / table-detail / table-fixedColumns / table-transpose / transfer-table / alarm-window-card

**当前进度**：20/154（13.0%）| 🟢 独立优秀 10 个 | 🟡 组合可用 10 个

**下一批次（建议）**：

- 列表/排行（13 个：carousel-list / carousel-notice / carousel-param / equip-list / hot-app-top5 / monitor-topn-list / progress-list / top-rank-shaanxi / topn-rank / topn-rank-one / tree-list / vertical-list）
- 图表 ECharts 剩余（9 个：circular-column / cone-bar / cone-bar-line / cone-single-bar / dual-axes-chart / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge）
- oss-chart-plots 系列（23 个，**建议抽取通用 schema 模板**到 `profiles/_templates/oss-chart-plot.json`）

**批次约束**：

- 按分类推进，每批 10-15 个物料
- 每批完成后再开下一批（确保文档同步更新）
- 优先覆盖高频大屏组件
- 边框/装饰（27 个）放最后（纯样式，画像意义低）

## 依赖与限制

-   **只读约束**：本 skill **永不修改** `src/packages/**` 下任何文件
-   **数据来源**：完全基于代码扫描 + 现有 `materials/` 文档
-   **不依赖运行时**：不需要启动 dev server，不需要实际渲染物料
-   **不评估视觉美观**：评级基于配置能力，不基于截图审美判断

## 相关 Skill

-   **后续可扩展**：`oss-vis-material-composer`（基于画像自动生成组合方案代码，**本 skill 暂不做**）
