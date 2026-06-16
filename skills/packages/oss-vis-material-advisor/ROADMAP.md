---
title: 路线图与继续指南
description: advisor skill 已完成的工作 + 接下来可做的事情 + 切换智能体/任务时的恢复指南
version: 0.1
last_updated: 2026-06-16
audience: 任何接手的智能体 / 后续任务
---

# advisor skill 路线图

> 任何接手的智能体：先读本文，再决定做什么。所有状态以本文 + `materials-catalog.md` 为准。

## 已完成（截至 2026-06-16）

| # | 任务 | 交付物 |
| --- | --- | --- |
| 1 | 建立 skill 框架 | [SKILL.md](./SKILL.md)（主文档） |
| 2 | 写 4 份规则 | `references/{profile-generation,rating-rules,composition-rules,cost-estimation}.md` |
| 3 | 生成首批 11 个画像 | `profiles/{echarts-bar,echarts-pie,echarts-map,digital-flop,digital-card,bidirectional-progress,normal-label,free-layout-indicators-viewer,dock-menu,table,top-rank}.json` |
| 4 | 写画像索引 | `profiles/README.md` |
| 5 | 写物料维护清单 | `materials-catalog.md`（154 个物料，按 18 分类组织） |
| 6 | 写 catalog 自动生成脚本 | `scripts/gen-catalog.js`（含分类去重 + 覆盖校验） |
| 7 | 跑通组合方案示范 | `examples/sales-dashboard.md`（销售大盘场景，3 个方案卡片） |
| 8 | 写 PM 常见问题 | `FAQ.md`（选物料/组合/成本 16 个问题） |
| 9 | 修复 catalog 一致性 | 去重 5 个跨分类物料 + 补全 `decoration/decoration1` + 增加自动校验 |

## 当前画像覆盖率

| 维度        | 数据        |
| ----------- | ----------- |
| 物料总数    | **154**     |
| 已画像      | 20（13.0%） |
| 🟢 独立优秀 | 10          |
| 🟡 组合可用 | 10          |
| 🔴 组合复杂 | 0           |
| ⚫ 不建议   | 0           |

## 进行中（第二批 · 表格）

| #   | 物料                 | 复杂度 | 评级        | 分数 | 搭建   |
| --- | -------------------- | ------ | ----------- | ---- | ------ |
| 1   | `drilldown-table`    | 高     | 🟡 组合可用 | 4.0  | 25 min |
| 2   | `drilldown-table-2`  | 高     | 🟡 组合可用 | 3.8  | 22 min |
| 3   | `expandable-table`   | 高     | 🟢 独立优秀 | 4.2  | 15 min |
| 4   | `pagination-table`   | 高     | 🟢 独立优秀 | 4.2  | 15 min |
| 5   | `table-detail`       | 高     | 🟢 独立优秀 | 4.0  | 12 min |
| 6   | `table-fixedColumns` | 高     | 🟢 独立优秀 | 4.3  | 12 min |
| 7   | `table-transpose`    | -      | ⏳ 待画像   | -    | -      |
| 8   | `transfer-table`     | -      | ⏳ 待画像   | -    | -      |
| 9   | `alarm-window-card`  | -      | ⏳ 待画像   | -    | -      |

## 下一步可选（按价值排序）

### 选项 A：跑通更多组合方案示范

**目标**：再选 2-3 个真实场景，输出方案卡片，验证 `composition-rules.md` 的复用性

**步骤**：

1. 选业务场景（候选：设备监控、运营驾驶舱、应急指挥、智慧城市、销售管理）
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

### 选项 B：第三批画像（继续扩大覆盖）

**目标**：把覆盖率从 13.0% 提升到 30%+

**已完成**：

-   ✅ 表格全做（10 个）

**建议批次**（按复用率从高到低）：

1. ✅ 表格全做（10 个）
2. 列表/排行全做（13 个：carousel-list / carousel-notice / carousel-param / equip-list / hot-app-top5 / monitor-topn-list / progress-list / top-rank-shaanxi / topn-rank / topn-rank-one / tree-list / vertical-list + 已有 top-rank）
3. 图表 ECharts 剩余（4 个：circular-column / cone-bar / cone-bar-line / cone-single-bar / dual-axes-chart / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge）
4. oss-chart-plots 系列（23 个，**建议抽取通用 schema 模板**到 `profiles/_templates/oss-chart-plot.json`）
5. 数字/指标卡、容器/布局、地图、其他
6. 最后：边框/装饰（27 个，纯样式，画像意义低）

**预计产出**：~50 个新画像 JSON

### 选项 C：把 advisor 接入实际使用

**目标**：让 PM/研发能查询物料能力

**已完成**：

-   ✅ `examples/sales-dashboard.md` 销售大盘示范
-   ✅ `FAQ.md` 16 个 PM 常见问题

**待办**：

-   写更多场景示范（设备监控、应急指挥、运营驾驶舱）
-   把 advisor 的"查询"流程封装成 1 个可复用 prompt
-   接入到 `phoenix` 设计器侧边栏

### 选项 D：扩展 advisor 能力

-   **D1**：成本估算器增强 — 接入真实项目数据校准
-   **D2**：反向回写物料改进建议 — `profiles/*/_validation_notes` → 评审报告
-   **D3**：建立物料质量看板 — 评级分布、短板物料 Top 10
-   **D4**：自动校验 schema.ts 修改 — diff 出来看画像哪些字段变了

## 智能体切换 / 任务恢复指南

> 当你接手 advisor 相关任务时，按以下顺序读取：

1. **本文件** `ROADMAP.md` — 了解"做到哪了"和"接下来做什么"
2. **`SKILL.md`** — 了解 advisor 是什么、4 个任务（A/B/C/D）做什么
3. **`materials-catalog.md`** — 了解 154 个物料的当前状态（画像覆盖 + 评级）
4. **`profiles/README.md`** — 了解 20 个已画像的详情（第一批 11 + 第二批 9）
5. **`FAQ.md`** — 看 PM 视角的常见问题
6. **`examples/sales-dashboard.md`** — 看完整的组合方案示范
7. **按需读 references/** — 做具体任务时再读对应规则文档

## 关键约束（不能违反）

| 约束                                | 原因                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| **只读 `src/packages/**`\*\*        | advisor 是评估者，永远不改物料代码                                                            |
| **JSON 严格合法**                   | 画像是结构化数据，每次产出后用 `node -e "JSON.parse(require('fs').readFileSync('...'))"` 验证 |
| **画像字段必须齐全**                | 参考 `profiles/echarts-bar.json` 的字段，缺一不可                                             |
| **评级 6 维权重 30/20/15/15/10/10** | 在 `references/rating-rules.md` 定义，不可临时改                                              |
| **场景数量 ≥ 3**                    | 业务场景列表至少 3 个，PM 看了能懂                                                            |
| **`_validation_notes` 必填**        | 关键坑点，不能空                                                                              |

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
