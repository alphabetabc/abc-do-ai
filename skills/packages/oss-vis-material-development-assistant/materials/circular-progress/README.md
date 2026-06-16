---
title: circular-progress 物料文档
description: 环形进度图物料的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# circular-progress（环形进度图）

## 1. 概述

**名称**：环形进度图（circular-progress）

**用途**：用于展示单个指标的环形进度图组件。基于 D3.js 的 `arc` API 绘制圆环，中心嵌入翻牌器（DigitalFlop）显示数值，支持渐变、起点标识、趋势判断等特性。

**所属分类**：进度 / 加载

**复杂度**：简单

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.jsx` | 主组件入口 |
| `index.less` | 样式（根 class：`ring-percent-container`） |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |
| `components/label.jsx` | 标题子组件 |
| `components/progess-chart.jsx` | SVG 圆环渲染子组件 |

### 1.2 核心能力

- **环形圆环绘制**：基于 D3.js `arc` API，支持背景环 + 前景环双层渲染
- **渐变填充**：`isGradient=true` 时使用 SVG `linearGradient` 渐变，否则使用纯色
- **起点位置可调**：上 / 下 / 左 / 右四个起点方向
- **起点标识圆点**：`circular=true` 时在前景环末端绘制实心圆点
- **翻牌器集成**：中心区域直接复用 `digital-flop` 物料渲染数值，支持普通 / 经典两种翻牌器风格
- **趋势判断**：可配置临界值与图标，根据当前值与上一次值比较显示上升 / 下降
- **前缀 / 后缀**：支持自定义前缀与后缀文本及样式（后缀通常为单位）

### 1.3 适用场景

- 大屏展示单个 KPI 完成率（如 `vEPC附着成功率 98%`）
- 资源使用率（CPU、内存、磁盘）展示
- 任何需要"百分比 + 圆环"可视化的场景

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 图形、翻牌器、趋势、标题、prefix / suffix 五大面板字段 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 圆环计算、翻牌器 props 转换、SVG 渲染、标题渲染 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel 字段定义、数组/对象双形态数据流向 |

## 3. Schema 结构（摘要）

Schema 分为 5 个主要面板：
- **基础配置**：`title / width / height / left / top / background`（来自 `BASE_LAYOUT`）
- **图形（chartProps）**：渐变开关、起点标识、外半径、圆环宽度、起点位置、内边距、背景色、前景色、填充色透明度
- **翻牌器属性（digitalProps）**：嵌套子面板 数字 / 趋势 / 前缀 / 后缀
- **标题（titleProps）**：显示/隐藏 + 文本样式
- **数据（dataConfig）**：`DynamicData` 数据源配置

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `CircularProgressChart` 渲染流程：
1. **数据形态适配**：判断 `dataSource` 是数组还是对象，将其统一为 `data = { percent, unit, title }`
2. **圆环几何计算**：`circularResolve()` 计算半径、内/外半径、背景/前景 path、旋转角度
3. **翻牌器 props 转换**：`digitalFlopResolve()` 把 `data.unit` 注入 `digitalProps.suffix.text`
4. **三段式渲染**：
   - 顶层 div `.ring-percent-container`
   - 中间层 `.digital-flop-container`（绝对定位，承载 `DigitalFlop`）
   - 底层 `ProgessChart`（SVG 圆环）
5. **标题渲染**：`Label` 子组件（仅当 `titleProps.visible=true` 时显示）

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel 定义 4 个指标字段：`id / title / percent / unit`。

数据流向：
```
外部数据源 / json 默认值
    ↓
dataConfig.json
    ↓
dataSource (对象 / 数组)
    ↓
index.jsx (props.dataSource)
    ↓
circularResolve + digitalFlopResolve
    ↓
SVG 圆环 + 中心 DigitalFlop
```

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改圆环颜色 / 渐变
- 调整翻牌器样式
- 新增趋势判断规则
- 修改默认数据

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- ⚠️ **数组模式下 dataModel 字段名与代码读取不一致**（详见 gotchas § 1）
- 根 class 为 `ring-percent-container`，与物料名 `circular-progress` 不一致
- 圆环宽度/外半径为 0~1 比例值，受组件宽高限制
- 翻牌器复用 `digital-flop`，改翻牌器样式时需注意两边一致性
