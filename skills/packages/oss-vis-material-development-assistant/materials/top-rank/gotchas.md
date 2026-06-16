---
title: 踩坑记录
description: top-rank 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `top-rank` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. doc/README.md 与实际代码多处不一致 ⚠️

**症状**：
`doc/README.md`（位于 `packages/top-rank/doc/README.md`）描述的功能与实际代码不符。

| doc/README.md 声称 | 实际代码 | 差异 |
| --- | --- | --- |
| 支持"点击排名项时向外派发数据" | `index.jsx` **无 click 事件** | ❌ 未实现 |
| 支持"TOP 数量"配置 | `schema.ts` **无 topCount 字段** | ❌ 未实现 |
| 支持"排名变化动画效果" | `index.jsx` **无动画** | ❌ 未实现 |
| 数据示例含 `rank` 字段 | dataModel **无 rank 字段** | ❌ 字段错误 |
| 数据示例 `value: 1000`（数字） | dataModel 声明 `dataType: "string"` | ⚠️ 类型不一致 |
| 数据示例有 `id` 字段 | 默认数据**无 id 字段** | ⚠️ 示例错误 |

**影响**：
- 用户依据 doc 文档配置后，**点击派发不生效**、**TOP 数量无法限制**、**无动画**
- 数据示例有误导性，复制后可能得不到预期效果

**修复**（已记录到 common-tasks § 7-8，未在本次 PR 范围）：
- 选项 A：实现 doc 描述的功能（新增交互面板、TOP 数量、动画）
- 选项 B：修改 doc/README.md 移除未实现功能的描述
- 推荐选项 A（更符合用户预期），但属于新功能需评估

## 2. 函数名 `getMarginTop` 名实不符

**症状**：
`index.jsx` 第 28 行的 `getMarginTop(index)` 实际还处理 `backgroundImage`，函数名只反映了部分职责。

```javascript
const getMarginTop = (index) => {
    const backgroundImage = ...;
    switch (index) {
        case 0: return { ...style, backgroundImage };
        default: return { ...style, backgroundImage, marginTop: itemStyle.marginTop };
    }
};
```

**修复**（未在本次 PR 范围）：
重命名为 `getItemStyle(index)`，更准确反映职责。

## 3. dataModel `id` 字段未在组件中使用

**症状**：
- dataModel 声明 `id: string`
- 默认数据**不包含** `id` 字段
- `index.jsx` **不读取** `item.id`，仅用 `index + 1` 作序号

**影响**：
- 用户通过 API 接入 `id` 字段也**无任何效果**
- 默认数据缺 `id` 字段，与 dataModel 声明不符

**修复**（已记录到 data-model.md § 6.3）：
- 选项 A：移除 `id` 字段
- 选项 B：在组件中使用 `id`（如 `React.key` 用 `item.id` 代替 `index`）

## 4. `indexStyle.borderWidth / borderStyle` 写死

**症状**：
`index.jsx` 第 18-19 行：
```javascript
borderWidth: '2px',     // 写死
borderStyle: 'solid',   // 写死
```

**未暴露 schema**，用户无法调整。

**修复**（未在本次 PR 范围）：
1. 在 `itemStyle` 加 `indexBorderWidth: number` 字段
2. 运行时 `borderWidth: ${itemStyle.indexBorderWidth || 2}px`

## 5. `itemsSet` 数组与 `dataSource` 隐式按 index 对齐

**症状**：
- `itemsSet` 数组配置**前三名**的样式
- 实际行为：`itemsSet[index]` 与 `dataSource[index]` 按 index 对齐
- 如果 `dataSource` 只有 5 项，但 `itemsSet` 配置了 3 项，则前 3 项生效
- 如果 `dataSource` 有 20 项，`itemsSet[0..2]` 仍只对前 3 项生效

**当前实现**：
```javascript
backgroundColor: itemsSet[index] ? itemsSet[index].itemSetting.indexBgColor : indexStyle.backgroundColor
```

> 三元判断 `itemsSet[index]` 是否存在来决定用分项样式还是通用样式。

**影响**：
- 用户期望"前三名独立样式"，但实际是"index 对齐"，超出 3 项后即 fallback
- `itemsSet` 数组只能配 3 项，**多配了也无效**

**修复**（未在本次 PR 范围）：
- 文档明确说明"数组前 3 项对应排名前 3 名"
- 或修改逻辑为"index < 3 才用 itemsSet"，对多配项目友好

## 6. `value` 字段类型声明为 `string` 但语义是 `number`

**症状**：
- dataModel 声明 `value: dataType: 'string'`
- 默认数据 `value: '543'`（带引号）
- 显示时原样展示（`{item.value}`），即显示 "543" 而非 543

**影响**：
- 数字 vs 字符串在视觉上**无差异**（都是 "543"）
- 但**无法做数学运算**（如排序 / 求和）
- 类型不一致易混淆

**修复**（已记录到 data-model.md § 6.3）：
改为 `dataType: 'number'`（或 `double`），默认数据同步改为数字。

## 7. 外层 `config.width / height` 与 `itemStyle.width / height` 概念重叠

**症状**：
- `config.width / height` = 外层容器尺寸（默认 300×300）
- `itemStyle.width / height` = 每行尺寸（默认 380×60）

两者都在 `defaultValue` 中设置，**值不一致**（300 vs 380）。

**影响**：
- 用户难以理解"两个 width 是什么关系"
- 实际渲染时 `itemStyle` 占主导，`config` 控制容器（影响 padding / border）

**修复**（未在本次 PR 范围）：
文档明确两者的关系，或考虑统一字段名。

## 8. 名称 / 单位不支持前三名覆盖

**症状**：
前三名的特殊样式**只覆盖**：
- 序号背景色
- 序号边框色
- 数值颜色

**不覆盖**：
- 名称颜色（统一用 `nameFontStyle`）
- 单位颜色（统一用 `unitFontStyle`）

**影响**：
- 金 / 银 / 铜风格不完整
- 如需前三名"高对比度"，需手动修改 `nameFontStyle / unitFontStyle`（会影响所有项）

**修复**（未在本次 PR 范围）：
在 `itemsSet[].itemSetting` 加 `nameColor / unitColor` 字段。

## 9. 默认 `nameFontStyle.fontFamily = ''`（空字符串）

**症状**：
`defaultValue.config.nameFontStyle.fontFamily = ''`，**未指定字体**。

**影响**：
- 名称使用浏览器默认字体（一般是 `serif`）
- 视觉上与 `valueFontStyle.fontFamily = 'DIN'`（指定字体）不一致

**修复**（未在本次 PR 范围）：
在 `defaultValue` 中指定 `nameFontStyle.fontFamily` 为常用字体（如 `'Microsoft YaHei'`）。

## 10. `dataSource` 顺序即排名，组件无排序逻辑

**症状**：
`index.jsx` 直接 `dataSource.map((item, index) => ...)`，序号 = `index + 1`。

**影响**：
- 如果数据源未排序，第一项不一定是第一名
- 用户需在数据源侧确保数据已排好序

**修复**（未在本次 PR 范围）：
- 在组件内加 `_.orderBy(dataSource, 'value', 'desc')` 自动排序
- 或文档明确"需外部排序"

## N. 调试小技巧

### N.1 临时显示所有项的 index 和 item 数据

```javascript
{dataSource?.map((item, index) => {
    console.log('top-rank item', index, item);
    // ...
})}
```

### N.2 临时禁用前三名配色

```javascript
// 注释掉 itemsSet 覆盖逻辑
// backgroundColor: itemsSet[index] ? itemsSet[index].itemSetting.indexBgColor : indexStyle.backgroundColor,
```

### N.3 临时显示前三名

```javascript
const displayData = dataSource?.slice(0, 3);
{displayData?.map((item, index) => { ... })}
```

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | doc/README.md 多处与代码不一致 | 文档化；建议补全功能或修正 doc |
| 2026-06-16 | 函数名 `getMarginTop` 名实不符 | 文档化；建议重命名 |
| 2026-06-16 | `id` 字段未在组件中使用 | 文档化；建议移除或使用 |
| 2026-06-16 | `value` 字段类型与实际值不一致 | 文档化；建议改为 number |
| 2026-06-16 | `borderWidth / borderStyle` 写死 | 文档化；建议暴露为 schema 字段 |
| 2026-06-16 | 默认 `nameFontStyle.fontFamily = ''` | 文档化；建议指定字体 |
