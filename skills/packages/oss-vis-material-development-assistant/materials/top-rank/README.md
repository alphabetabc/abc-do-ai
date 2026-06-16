---
title: top-rank 物料文档
description: 机房排名物料的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# top-rank（机房排名）

## 1. 概述

**名称**：机房排名（top-rank）

**用途**：TOP 排名列表展示组件，每行展示"序号 + 名称 + 数值 + 单位"，前三名支持独立配色（金 / 银 / 铜风格）。支持自定义序号背景、边框颜色、字体颜色，以及通用背景图。

**所属分类**：列表 / 排行

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.jsx` | 主组件入口 |
| `index.less` | 样式（根 class：`top-rank-container`） |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |

### 1.2 核心能力

- **TOP 排名展示**：每行展示排名序号（1, 2, 3...）、名称、数值、单位
- **前三名独立配色**：通过 `itemsSet` 数组配置前 3 名的序号背景 / 边框 / 文字颜色（金 / 银 / 铜风格）
- **通用样式**：通过 `itemStyle` 设置每项宽高、间距、通用背景图
- **字体样式可配**：序号 / 名称 / 数值 / 单位四种字体样式独立面板
- **背景图支持**：每项可独立设置背景图（`itemsSet[i].itemSetting.backgroundImage`），未设置时 fallback 到通用 `itemStyle.backgroundImage`
- **可配置序号样式**：序号背景色 / 边框色 / 尺寸（圆形）

### 1.3 适用场景

- 大屏中展示 TOP N 机房 / 设备 / 项目排名
- 需要"前三名"突出显示的场景
- 需要自定义视觉风格（如金 / 银 / 铜配色）的榜单

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 通用 / 分项设置 / 序号 / 名称 / 数值 / 单位 五大面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 列表渲染、序号样式合成、背景图 fallback |
| **数据格式** | [data-model.md](./data-model.md) | dataModel 字段定义、默认数据示例 |

## 3. Schema 结构（摘要）

Schema 分为 5 个主要面板：
- **通用（itemStyle）**：单项宽度、单项高度、间距、背景图片、序号尺寸 / 背景色 / 边框色
- **分项设置（itemsSet）**：ArrayCollapse 数组，前 3 名的 `itemSetting` 独立配置（背景图 / 序号背景色 / 边框色 / 字体颜色）
- **序号样式（indexFontStyle）**：字体 / 字号 / 字重 / 颜色
- **名称样式（nameFontStyle）**：字体 / 字号 / 字重 / 颜色
- **数值样式（valueFontStyle）**：字体 / 字号 / 字重 / 颜色
- **单位样式（unitFontStyle）**：字体 / 字号 / 字重 / 颜色

数据面板：DynamicData。

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `TopRank` 渲染流程：
1. **样式合成**：根据 `itemStyle` 合成 `indexStyle`（圆形 / 背景 / 边框）、`style`（宽高）
2. **数据渲染**：`dataSource.map((item, index) => ...)` 遍历每项
3. **前三名配色查找**：`itemsSet[index]` 存在则用其 `itemSetting`，否则 fallback 到 `itemStyle`
4. **背景图 fallback**：`itemsSet[index].itemSetting.backgroundImage` 为空时用 `itemStyle.backgroundImage`
5. **渲染结构**：
    - 根 `div.top-rank-container`
    - 每行 `div.top-rank-container-item`（含背景图）
        - 左：序号 `div.top-rank-container-item-index`
        - 中：名称 `div.top-rank-container-item-name`
        - 右：数值 + 单位 `div.top-rank-container-item-right`

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel 定义 4 个指标字段：`id / name / value / unit`。

数据流向：
```
外部数据源 / json 默认值
    ↓
dataConfig.json (dataSource: [{ id, name, value, unit }, ...])
    ↓
index.jsx (props.dataSource)
    ↓
dataSource.map((item, index) => render <div>)
    ↓
序号 = index + 1
```

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改前三名配色（金 / 银 / 铜）
- 修改字体样式
- 修改间距 / 尺寸
- 修改默认数据
- 新增排名字段

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- ⚠️ **doc/README.md 与实际代码多处不一致**（详见 gotchas § 1）
    - 文档声称支持"点击派发"但代码无 click 事件
    - 文档声称支持"TOP 数量"但 schema 未实现
    - 文档声称支持"排名变化动画"但代码无动画
- dataModel 示例字段名（`rank`）与 dataModel.json 实际字段名（`id/name/value/unit`）不一致
- 序号是 `index + 1`，**没有真正的"排名"语义**（依赖数据已排好序）
- 样式名 `valueFontStyle` 容易被误写为 `valueStyle`（注意拼写）
