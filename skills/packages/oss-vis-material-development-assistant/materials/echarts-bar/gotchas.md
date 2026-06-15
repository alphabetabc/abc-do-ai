---
title: 踩坑记录
description: echarts-bar 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-15
---

# 踩坑记录

本文档记录 `echarts-bar` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ 孤儿文件 `index.jsx`

**症状**：仓库根目录搜 `echarts-bar` 会看到 `index.tsx` 和 `index.jsx` 两个文件，让人困惑该改哪个。

**原因**：

```json
// oss-material.json
{
    "main": "./index.tsx",  // ← 只有 index.tsx 被加载
    "schema": "./schema.ts",
    "dataModel": ""
}
```

`oss-material.json.main` 显式指向 `./index.tsx`，webpack 入口配置**只加载** `index.tsx`。`index.jsx` 已被废弃但**未被删除**。

**风险**：

- 误改 `index.jsx` 不会有任何效果（白改）
- `index.jsx` 内部实现的是**完全不同的"双轴图"逻辑**（`getSolidOption` / 立体多柱状图 / `axisOptionResolve` 等），与 `index.tsx` 的横向条形图**毫不相关**
- 维护时极易混淆

**修复**：

- **短期**：在 `index.jsx` 顶部加 `// @deprecated 已被 index.tsx 替代，请勿修改` 注释
- **长期**：删除 `index.jsx`（详见 [common-tasks.md § 5](./common-tasks.md#任务-5删除孤儿文件-indexjsx)）

## 2. ⚠️ 多系列分组判断只看 `data[0].compareType`

**症状**：用户希望单系列（无 `compareType`）和多系列混合时，可能误判。

**原因**：

```typescript
// options.ts:140
if (data[0].compareType) { /* 多系列 */ }
else { /* 单系列 */ }
```

只检查**第一行**。

**风险**：

- 如果数据是混合的（部分行有 `compareType`、部分行无），走错分支
- 实际业务中**不太可能出现这种数据**（数据源通常统一），但需注意

**修复**：保持现状，但在 `dataModel.md` 中明确"全表要么有 `compareType` 要么没有"。

## 3. ⚠️ `index.less` 是空文件

**症状**：搜不到 echarts-bar 的样式代码。

**原因**：当前所有样式都由 ECharts option 内联控制（颜色、圆角、字体等），不需要额外 CSS。

**风险**：

- 后续要加自定义包装样式时容易忽略
- `index.tsx` 中 `import './index.less';` **未启用**（已注释）

**修复**：保持现状，如需加样式可启用 import。

## 4. ⚠️ `data.id` 在点击事件中永远是 `undefined`

**症状**：配置 `onClickId` 字段后，外部组件收不到派发值。

**原因**：

```typescript
// index.tsx:25
{ fieldName: interaction.defined?.onClickId, state: data.id },
//                                                  ^^^^^^
// options.ts 的 data 是 { value, __rawData__: { dimensionName, compareType, indicatorId, indicatorValue, unit } }
// __rawData__ 上没有 id 字段，所以 data.id === undefined
```

**风险**：用户配置 `onClickId: 'indicatorId'` 期望派发 `indicatorId` 的值，实际收不到。

**修复**：

- **方案 A**（推荐）：在 `dataModel.json` 的 `indicators` 中显式加 `id` 字段，并在数据中填充
- **方案 B**：在 `onItemClick` 中改用 `data.__rawData__.indicatorId`：
  ```typescript
  { fieldName: interaction.defined?.onClickId, state: data.__rawData__.indicatorId }
  ```

> 详见 [data-model.md § 3.2](./data-model.md#32-点击事件可访问的字段)

## 5. ⚠️ `decal.rotation` 一定要转弧度

**症状**：设置 `barDecalSetting.rotation = 45`，图案没有按 45° 显示。

**原因**：ECharts `decal.rotation` 接收**弧度**，但 schema 中是**度数**。

**修复**：

```typescript
// options.ts:126
rotation: (rotationDegrees * Math.PI) / 180,  // ✅ 已处理
```

**建议**：写注释提醒，避免后人误改。

## 6. ⚠️ `customColors = false` 时用户颜色被忽略

**症状**：用户在 `chart.color` 配了渐变填充色，但图表显示的是默认色。

**原因**：

```typescript
// options.ts:6
const colors = chart.customColors && _.isArray(chart.color) && chart.color.length > 0
    ? chart.color
    : DEFAULT_COLORS;
```

**修复**：用户需在 schema 打开"自定义填充色"开关（`customColors: true`）。可在 doc 中加说明。

## 7. ⚠️ `interaction.defined.onClickId` 是**字段名**，不是**值**

**症状**：开发者误以为 `onClickId` 直接存值。

**原因**：schema 中 `onClickId` 是 Input，用户填的是"外部组件要接收的字段名"（如 `'indicatorId'`）。

**修复**：在 `doc/readme.md` 中说明清楚。

## 8. 调试小技巧

### 8.1 查看完整 option

```typescript
// options.ts 末尾
// console.log(option, 'echarts-bar-options---------------------');
// 已注释的调试代码，取消注释即可在控制台查看
```

### 8.2 临时禁用 shouldSetOption 强制刷新

```typescript
<ReactECharts option={option} /* 暂时移除 shouldSetOption 强制每次 setOption */ />
```

### 8.3 关闭 ECharts 动画排查配置问题

```typescript
// options.ts:177
let option = {
    color: colors,
    grid,
    // ...其他
    animation: false,  // 临时调试
};
```

## 9. ✅ 最佳实践

1. **不要修改 `index.jsx`**，所有改动只动 `index.tsx` + `options.ts`
2. **多系列 / 单系列判断**靠 `data[0].compareType`，保持数据源一致
3. **`customColors = true` + `chart.color` 有数据**才生效
4. **渐变色数组**至少 1 个，每个含 `colorStops` 数组
5. **`barMaxWidth` 默认 16**，超过会破坏布局美观
6. **`grid` 默认 `show: false`**，如需网格线手动开启

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
