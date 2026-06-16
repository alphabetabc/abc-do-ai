---
title: popover-check 物料文档
description: 下拉选择框物料的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# popover-check（下拉选择框）

## 1. 概述

**名称**：下拉选择框（popover-check）

**用途**：可配置样式的下拉多选 / 单选组件，中心展示选中项列表，下方弹出选项列表。支持自定义选择框样式、弹窗样式、箭头样式、点击外部关闭、派发选中项 id 和 label。

**所属分类**：表单 / 筛选

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.jsx` | 主组件入口 |
| `index.less` | 样式（根 class：`popover-check-root`） |
| `schema.ts` | 配置面板定义 |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |
| `tooltip-border.jsx` | 弹窗边框 SVG 子组件 |

### 1.2 核心能力

- **单选 / 多选**：`checkMode: 'single' | 'multi'`，单选模式下点击后自动关闭弹窗
- **自动初始化**：`autoInit=true` 时，首次加载自动选中第一项
- **点击外部关闭**：通过 `document.addEventListener('click')` 监听全局点击关闭弹窗
- **Tooltip 提示**：选中项过长时 `Tooltip` 悬停展示完整内容
- **派发选中事件**：派发 `select`（选中项 id 数组）和 `selectLabel`（选中项 label 数组）两个参数
- **样式全可配**：选择框 / 弹窗 / 箭头三类样式均独立面板
- **弹窗边框装饰**：通过 SVG `path` 绘制带箭头的装饰边框（`tooltip-border.jsx`）

### 1.3 适用场景

- 大屏中需要做筛选下拉（如选择省份、状态）
- 需要派发选中项给其他组件的过滤 / 查询场景
- 需要自定义视觉风格的下拉（适配大屏科技风）

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 功能设置 / 选择框 / 弹窗 / 箭头四大面板 + 交互面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 选中 / 取消逻辑、自动初始化、点击外部关闭、Tooltip 渲染 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel 字段定义、默认数据示例 |

## 3. Schema 结构（摘要）

Schema 分为 4 个配置面板 + 1 个数据面板 + 1 个交互面板：
- **功能设置（funcSettings）**：自动初始化、占位符
- **选择框样式（selectedStyle）**：前缀、选中模式（单 / 多选）、宽 / 高、边框颜色、文本样式
- **弹窗样式（popoverStyle）**：线宽、线条颜色、背景颜色、最大高度、距离顶部、旋转角度
- **箭头样式（arrowStyle）**：大小、旋转角度、颜色、四个 margin
- **数据（renderDataConfig）**：DynamicData 数据源
- **交互**：下拉框选中事件 → 派发 `select`（id）/ `selectLabel`（label）

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `PopoverCheck` 渲染流程：
1. **状态管理**：`checkedItemId`（已选 id 列表）、`showPopover`（弹窗显隐）、`isSingleMode`（单 / 多选模式）
2. **自动初始化**：`useEffect` 监听 `data` 变化，若 `autoInit=true` 且当前无选中，自动选第一项
3. **点击切换选中**：`onCheckedItemChange` 处理单 / 多选逻辑，单选模式下点击后关闭弹窗
4. **点击外部关闭**：`useEffect` 注册 `document.click` 监听，点击组件外时关闭弹窗
5. **派发选中事件**：`onChange` 通过 `interaction.dispatch` 派发 `select` / `selectLabel`
6. **渲染结构**：
    - 根 `section.popover-check-root`
    - 头部 `div.checked-list-container`（带 Tooltip 截断提示 + 箭头）
    - 弹窗 `section.check-list-popover-root`（带 `TooltipBorder` SVG 边框 + 列表）

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel 定义 2 个指标字段：`label`（显示名） / `id`（数据 key）。

数据流向：
```
外部数据源 / json 默认值
    ↓
dataConfig.json (dataSource)
    ↓
index.jsx (props.dataSource)
    ↓
data.map((item) => <Checkbox id={item.id} checked={...}> {item.label} </Checkbox>)
```

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 修改选择框样式（边框 / 文本）
- 修改弹窗样式（边框 / 背景 / 旋转）
- 修改箭头样式
- 调整单 / 多选模式
- 新增派发参数
- 修改默认数据

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- ⚠️ **隐式字段 `defaultCheckedValue`**（index.jsx 第 21 行引用，schema.ts 中未声明）
- dataModel.title 与 oss-material.json.title 不一致（"下拉组件" vs "下拉选择框"）
- 单选 / 多选切换时已选状态保留 / 清空逻辑依赖 `mountedRef`（详见 gotchas § 3）
- 弹窗通过 `document.click` 监听关闭，多层组件场景下需注意事件冒泡
