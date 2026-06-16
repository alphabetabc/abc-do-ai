---
title: 物料画像索引
description: oss-vis-material-advisor 已生成的 20 个物料画像索引（含第二批 9 个表格），按分类组织
version: 0.1
last_updated: 2026-06-16
---

# 物料画像索引

本目录维护已生成的物料能力画像 JSON。每个画像描述该物料的：
- 基础信息（入口、文件、复杂度）
- 能力（数据格式、交互、视觉配置、默认值）
- 业务场景、可组合性
- **6 维评分 + 评级 + 标签**
- 搭建成本（3 档：minimal/typical/full）

## 总览（20 个画像）

| 物料 | 分类 | 评级 | 分数 | 标签 | 搭建（minimal） | 5+1 文档 | 备注 |
|------|------|------|------|------|------|---------|------|
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

> 评级分布：**🟢 独立优秀 10 个**（50%）、**🟡 组合可用 10 个**（50%）、**🔴 组合复杂 0 个**、**⚫ 不建议 0 个**

## 按分类组织

### 图表/ECharts（2）
- 🟢 [echarts-bar](./echarts-bar.json) — 多系列条形图
- 🟢 [echarts-pie](./echarts-pie.json) — 饼/环/玫瑰图

### 地图（1）
- 🟡 [echarts-map](./echarts-map.json) — 平面地图（下钻）

### 数字/指标卡（2）
- 🟢 [digital-flop](./digital-flop.json) — 数字翻牌器
- 🟡 [digital-card](./digital-card.json) — 数字卡

### 进度/加载（1）
- 🟢 [bidirectional-progress](./bidirectional-progress.json) — 双向进度

### 文本/标签/标题（1）
- 🟢 [normal-label](./normal-label.json) — 普通文本

### 容器/布局（2）
- 🟡 [free-layout-indicators-viewer](./free-layout-indicators-viewer.json) — 自由布局指标卡容器
- 🟡 [dock-menu](./dock-menu.json) — 侧边菜单

### 表格（9）
- 🟡 [table](./table.json) — 通用表格
- 🟡 [drilldown-table](./drilldown-table.json) — 表格 + Modal 下钻 + 轮播 + 更多
- 🟡 [drilldown-table-2](./drilldown-table-2.json) — drilldown-table 升级版（事件总线）
- 🟢 [expandable-table](./expandable-table.json) — 父子层级 + 4 种列内容
- 🟢 [pagination-table](./pagination-table.json) — 服务端分页 + 排序 + 主题
- 🟢 [table-detail](./table-detail.json) — ProTable 明细 + useViewItemDataPagination
- 🟢 [table-fixedColumns](./table-fixedColumns.json) — 固定列 + 显隐控制
- 🟡 [table-transpose](./table-transpose.json) — 转置表格 + 翻牌器 + 枚举值
- 🟡 [transfer-table](./transfer-table.json) — 表格穿梭框 + 搜索 + 保存

### 告警（1）
- 🟢 [alarm-window-card](./alarm-window-card.json) — 订阅告警流水窗（与告警系统深度耦合）

### 列表/排行（1）
- 🟡 [top-rank](./top-rank.json) — 排名

## 跨画像发现

### 通用问题

1. **`oss-material.json.dataModel` 普遍是空字符串**
   - 受影响：15/17（仅 echarts-pie、bidirectional-progress 没有 dataModel.json 但 oss-material.json 引用了其他）
   - 实际 `dataModel.json` 文件存在且被 `schema.ts` 顶部 `import` 加载
   - **影响**：行为无影响（webpack 仍能找到），但物料元信息与实际不一致
   - **建议**：批量把 `dataModel` 字段改为 `"./dataModel.json"`

2. **`dataType: "String"` 普遍用于 number 字段**
   - 受影响：echarts-bar (indicatorValue)、echarts-map (value1~4, level1~4, num)、bidirectional-progress、free-layout-indicators-viewer
   - **影响**：dataModel 是描述约定，实际数据可为 number，但 PM 看 dataModel 会误以为需要传字符串
   - **建议**：dataType 改为 `"Number"` 或拆出 `rowProperties: ["format", "number"]`

3. **5+1 文档严重缺失**
   - 有 5+1：echarts-bar、echarts-pie、digital-flop、digital-card、bidirectional-progress、normal-label、free-layout-indicators-viewer、dock-menu（8/20）
   - 缺 5+1：12 个（echarts-map + 全部 9 个表格类 + alarm-window-card + top-rank）
   - **建议**：补 12 个高频表格 + 告警 + 地图物料的 5+1 文档

4. **隐式字段普遍存在**（schema 未声明但代码读取）
   - digital-flop: `id`、`enableRemoveEndZero`、`fontSkew`
   - dock-menu: `DockItem.icon`
   - free-layout-indicators-viewer: `indicatorType`（已声明但未使用）
   - digital-card: `borderLeftColor`
   - pagination-table: 后端响应结构（data.data / data.columns / data.pagination）
   - table-fixedColumns: `rowKey`（用于派发事件 + 显隐控制）
   - **影响**：PM 配置时找不到字段，研发改字段时不知会改到隐式字段
   - **建议**：要么在 schema 显式声明，要么从代码移除

5. **静态资源强依赖**
   - free-layout-indicators-viewer: `default-bg.png`
   - dock-menu: ShaanxiUnicom 系列图
   - **影响**：重命名物料时必须同步 3 处（schema 引用 + 资源文件 + 物料目录名）
   - **建议**：在 gotchas.md 中记录资源依赖

### 物料特定问题

| 物料 | 问题 | 严重度 |
|------|------|--------|
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
| digital-card | 空 dataSource 无保护会崩溃 | 中 |
| free-layout-indicators-viewer | dataSource 缺项时该坐标点 return null 无 console.warn | 中 |
| drilldown-table | README 描述"树形展开"与实际 Modal 下钻不符 | 中 |
| drilldown-table | detailViewPageArgs 服务端单引号需手动 replace | 中 |
| drilldown-table-2 | schema 缺 detailView* 字段定义（与 drilldown-table 不一致） | 中 |
| expandable-table | 自渲染整个表格，与 table 不可同区域 | 中 |
| expandable-table | 标题"下挂表格"与"expandable"语义不太匹配 | 低 |
| pagination-table | dataModel 自承"不足以描述"（结构留给 README） | 中 |
| pagination-table | 实际表体是私有 components/visual-table，非 import ../table | 中 |
| table-detail | onCheckChange 函数体是空实现（"暂时没有实现check这个功能"） | 中 |
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

## 评级分布看板

```
🟢 独立优秀 (10) 50%  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 组合可用 (10) 50%  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 组合复杂 (0)   0%  
⚫ 不建议   (0)   0%  
```

## 平均得分

| 维度 | 平均分（满分5） | 短板物料 |
|------|---------------|----------|
| business_description | 3.7 | table (3.0) |
| scenario_coverage | 4.2 | top-rank (3.0) |
| config_completeness | 4.2 | top-rank (3.0) |
| data_contract_clarity | 3.2 | table (2.5) |
| doc_completeness | 3.0 | 12/20 缺 5+1 |
| composability | 3.8 | echarts-map (3.0) |
| **总分** | **3.8** | — |

> **最大短板**：doc_completeness（3.0）—— 表格/告警/地图类 5+1 文档缺失严重

## 后续推进

- **第二批画像（已完成）**：表格（10 个：table + drilldown-table + drilldown-table-2 + expandable-table + pagination-table + table-detail + table-fixedColumns + table-transpose + transfer-table + alarm-window-card）
- **第三批画像**：列表/排行（12 个：carousel-list / carousel-notice / carousel-param / equip-list / hot-app-top5 / monitor-topn-list / progress-list / top-rank-shaanxi / topn-rank / topn-rank-one / tree-list / vertical-list）
- **第四批画像**：图表 ECharts 剩余（9 个：circular-column / cone-bar / cone-bar-line / cone-single-bar / dual-axes-chart / echarts-gauge / echarts-liquid / echarts-multi-variable-area-chart / ind-list-echarts-gauge）
- **跑通 composition-rules.md**：用"销售大盘"场景试算组合方案（✅ 已完成于 `examples/sales-dashboard.md`）
- **回写 5+1 文档**：把 `_validation_notes` 中的发现回写到 `oss-vis-material-development-assistant/materials/{name}/gotchas.md`
