---
title: digital-flop
description: 数字翻牌器 — TWEEN 动画 + 趋势图标 + 经典/普通双模式 + 4 种下钻效果（Modal/Drawer/Window/WindowSelf）
version: 1.0.0
last_updated: 2026-06-15
---

# digital-flop

## 1. 概述

**名称**：数字翻牌器

**用途**：核心场景为"指标数值的滚动翻牌动画 + 趋势图标 + 级别配色 + 4 种下钻效果"。支持文本渐变色、字体倾斜、千分位、动画时长、级别渲染、前后缀内容样式等。

**所属分类**：数字 / 指标卡

**复杂度**：中

### 1.1 文件入口

| 文件 | 作用 |
|------|------|
| `index.tsx` | 主组件入口（`oss-material.json.main` 指向） |
| `schema.ts` | 配置面板 / 数据面板 / 交互面板 |
| `dataModel.json` | 数据契约（无 dimensions，3 个 indicators） |
| `types.ts` | TS 类型定义（`NumberSetting` / `TrendSetting` / `PrefixSetting` / `SuffixSetting` / `DigitalFlopProps`） |
| `schema-parts/defaultValues.ts` | **默认值抽离**（与 `schema.ts` 末尾 `defaultValue` 配合） |
| `oss-material.json` | 物料元信息（`main: "./index.tsx"`） |
| `index.less` | 基础样式（根容器 + `.wrapper-number` / `.wrapper-real-number`） |
| `components/value-renderer.tsx` | **TWEEN 动画核心**：类 `ValueRenderer` + `useValueRenderer` hook |
| `components/RootStyled.tsx` | **styled-components 根容器**：渐变文字 + 字体倾斜 + 千分位 margin |
| `components/CompPrefixTpl.tsx` | 前缀模板 + `prefixOptionResolve` |
| `components/CompSuffixTpl.tsx` | 后缀模板 + `suffixOptionResolve` |
| `components/TrendIcon.tsx` | 趋势图标（↑ / +/- / custom） + `tendencyTypes` 常量 |
| `doc/readme.md` | 用户向文档（设计器侧边栏渲染） |

### 1.2 核心能力

- **TWEEN 翻牌动画**：数值变化时通过 TWEEN.js 插值，支持动画时长配置
- **数字格式化**：千分位、精度（`precision`）、绝对值（`numberAbs`）、末位 0 移除（`enableRemoveEndZero`）
- **双模式**：`flopType: 'normal'`（无背景）/ `'classics'`（有背景图 + 背景色 + 圆角）
- **文本渐变色**：通过 `-webkit-background-clip: text` 实现（独立于数字色）
- **字体倾斜**：`number.fontSkew`（**schema 中未声明**，详见 [gotchas.md § 3](./gotchas.md)）
- **趋势图标**：3 种类型（↑ / +/- / custom 自定义图片），可按级别（`isLevel`）切换
- **级别渲染**：根据 `data.render` 数值匹配 `itemsSet`，自动套用对应 color/icon
- **4 种下钻效果**：Modal / Drawer / Window（打开新窗口）/ WindowSelf（当前窗口）
- **派发参数**：`onClickId` 字段映射，外部接收 `dataSource.id`

### 1.3 适用场景

- 大屏可视化核心指标卡（带动画的"翻牌"效果）
- 需要按"级别"（高/中/低）切换颜色的指标
- 单一指标展示（**注意：dataSource 是单对象，不是数组**）

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
|------|------|----------|
| **Schema 维护** | [schema.md](./schema.md) | 样式增强（`textGradientColor`）/ 数字 / 趋势 / 前缀 / 后缀 / 数据 / 交互 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | `index.tsx` 主组件 + 4 个子组件 + TWEEN 动画 + 渐变文字 |
| **数据格式** | [data-model.md](./data-model.md) | 无 dimensions，3 个 indicators（`value` / `render` / `suffix`），隐式 `id` 字段 |

## 3. Schema 结构（摘要）

- **配置面板**（`config`）：`getCompTitle` + `BASE_LAYOUT` + `$textStyleEnhance`（文本渐变色）+ `$collapse`（数字）+ `trend` + `prefix` + `suffix`
- **数字格式化**：嵌套 `$numberFormatter`（`Card` 包装），含 `numberLength` / `precision` / `numberAbs` / `groupSeparator`
- **趋势配置**：4 级嵌套（`isLevel.itemsSet` 数组 → 单项 `level/color/iconWidth/iconImage`）
- **数据面板**（`dataConfig`）：`renderDataConfig({ ..., showDataStatusSwitch: true })`
- **交互面板**（`interactions`）：4 种 `effect`（Modal / Drawer / **Window / WindowSelf**）+ 派发参数（仅 `onClickId`）

## 4. 组件逻辑（摘要）

- **`index.tsx`**：取 `dataSource[0]`（**注意是单对象**），根据 `tendency`（`up`/`down`）决定趋势图标 + 颜色，调用 `useValueRenderer` 触发 TWEEN 动画
- **`useValueRenderer`**：类 `ValueRenderer` 单例化（`useRef` + `useMemo`），全局共享 RAF 循环（`rafRunningFlag` 防止重复启动）
- **渐变文字**：`RootStyled` 通过 styled-components，根据 `enable` 条件注入 `-webkit-background-clip: text` CSS
- **级别颜色优先级**：`iconColorSettings.syncToNumber` 开启时，数值色 = 趋势色（up/down）或级别色（`isLevel`）

## 5. 数据格式（摘要）

- **dimensions**：空（**单指标，无维度**）
- **indicators**：`value`（指标值，必填）/ `render`（级别，可选）/ `suffix`（后缀显示内容，可选）
- **隐式字段**：`id`（被点击事件使用，但**未在 dataModel 声明**）
- **`dataSource` 是单对象**（不是数组），组件内部 `_.isArray(propsData) ? propsData[0] : propsData`

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

- 任务 1：新增数字样式（如字体粗细、字间距）
- 任务 2：调整动画曲线 / 时长
- 任务 3：新增趋势图标类型
- 任务 4：扩展下钻效果（如跳转到 URL）

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

⚠️ **重要警告**：

1. **隐式字段**：`enableRemoveEndZero` 和 `number.fontSkew` 在组件中读取但 schema **未声明**
2. **`id` 字段**：点击事件派发依赖 `dataSource.id`，但 dataModel **未声明**
3. **单对象 vs 数组**：`dataSource` 是单对象，**不是数组**！与 `echarts-bar` 等图表类物料不同
