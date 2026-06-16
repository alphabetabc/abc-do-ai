---
title: 踩坑记录
description: circular-progress 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `circular-progress` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 数据：数组模式字段名不一致 ⚠️

**症状**：
当 `dataSource` 为数组形态时，标题和进度角度都不显示，仅后缀单位正常。

**原因**：
- `dataModel.json` 声明的字段名是 `percent / title / unit`
- `index.jsx` 第 107-111 行的数组映射却读取 `obj.value / obj.name / obj.unit`：

```javascript
// packages/circular-progress/index.jsx
data = {
    percent: obj.value,   // dataModel 字段是 percent
    unit: obj.unit,
    title: obj.name,      // dataModel 字段是 title
};
```

**影响**：
- 数组模式数据 → 圆环角度为 0、标题为空、单位后缀正常
- 对象模式（默认）正常，因为 `data = propsData` 直接使用

**修复**（已记录到 data-model.md § 6.3，未在本次 PR 范围）：
将字段映射修正为 `obj.percent / obj.title` 或反向修改 `dataModel.json` 的字段名。

**当前缓解**：
- 默认数据使用对象形态（`{ percent, unit, title }`），不踩坑
- 文档（`doc/README.md`）中的数组示例实际上不能正确工作，但表层看起来"正常"（因为单位仍然显示）

## 2. 副作用：`digitalFlopResolve` 直接修改 `digitalProps`

**症状**：
多次渲染后，`config.digitalProps.suffix.text` 会被 `data.unit` 持续覆盖，丢失用户配置。

**原因**：
`index.jsx` 第 78-93 行的实现：

```javascript
const digitalFlopResolve = (data, digitalProps) => {
    const itemDigitalProps = digitalProps;  // ⚠️ 引用赋值，不是深拷贝
    if (data?.unit) {
        itemDigitalProps['suffix']['text'] = data?.unit;  // 直接修改原对象
    }
    return {
        config: { ...itemDigitalProps },
        dataSource: { value: data?.percent ? data?.percent : 0 },
    };
};
```

**影响**：
- 第一次渲染：用户配置的 `suffix.text` 被覆盖为 `data.unit`
- 后续渲染：每次都用最新的 `data.unit` 覆盖
- 用户的 `suffix.text` 配置**实际无效**（这是有意为之的设计，后缀用数据驱动单位）

**修复**：
当前设计是**有意为之**（让用户从数据源动态控制单位），不是 bug。维护时需注意：
- 不要在用户配置 `suffix.text` 时做"持久化"逻辑
- 如需保留用户配置，可在 `data.unit` 为空时回退到 `digitalProps.suffix.text`

## 3. 历史遗留字段：`Label.fontColor`

**症状**：
`<Label fontColor="..." />` 传入后无任何效果。

**原因**：
`label.jsx` 第 3 行的解构：

```javascript
const Label = ({ visible, text = '', fontColor, ...style }) => {
    return visible ? <div style={{ ...(style.textStyle || {}), textAlign: 'center' }}>{text}</div> : <></>;
};
```

- `fontColor` 被解构出来但**未使用**
- 颜色完全由 `textStyle.color` 控制

**修复**：
- 删除 `fontColor` 解构（或加 `_` 前缀表示不使用）
- 同时清理所有传入 `fontColor` 的调用方

## 4. CSS class 与物料名不一致

**症状**：
根 class 为 `ring-percent-container`，与 `oss-material.json.name` (`circular-progress`) 不一致。

**原因**：
历史命名（最初叫"ring-percent"）遗留，未与物料名同步。

**影响**：
- 排查样式问题时不容易定位
- 命名规范约定根 class 应为 `${material-name}` （详见 component-patterns.md § 3）

**修复**：
- 把 `ring-percent-container` 改名为 `circular-progress`
- 同步检查 `index.less` 中所有子 class
- ⚠️ 这是破坏性变更，会影响用户自定义样式

## 5. 前景环 `endAngle` 硬编码为半圆

**症状**：
无论 `data.percent` 多大，d3 端始终生成半圆 path，旋转通过 `<g transform="rotate()">` 实现。

**原因**：
`circularResolve` 第 57-62 行：

```javascript
circule.froegroundRing = d3Arc()({
    innerRadius,
    outerRadius,
    startAngle: 0,
    endAngle: Math.PI,  // 硬编码
});
```

**影响**：
- 性能：避免 d3 重算 path，只旋转
- 缺点：无法实现"环缺口"等自定义弧度

**修复**：
如需自定义弧度，可改为 `endAngle: (Math.PI / 100) * data.percent`（注意 startAngle 和 endAngle 的差即为弧度）。

## 6. 标题强制 `textAlign: center`

**症状**：
`textStyle.textAlign` 配置不生效，标题始终居中。

**原因**：
`label.jsx` 第 4 行硬编码 `textAlign: 'center'`：

```javascript
return visible
    ? <div style={{ ...(style.textStyle || {}), textAlign: 'center' }}>{text}</div>
    : <></>;
```

**修复**：
- 移除硬编码的 `textAlign`，让 `textStyle.textAlign` 生效
- 或在 `schema.ts` 的 `titleProps.textStyle` 用 `disableTextAlign: true` 显式禁用对齐（当前已禁用）

## 7. 渐变 `id` 必须全局唯一

**症状**：
同页多实例时，渐变颜色错乱（所有圆环使用同一渐变）。

**原因**：
SVG `<linearGradient id>` 在同文档全局生效。

**修复**：
当前已通过 `_.uniqueId('process-chart-')` 保证唯一，正确做法。

## N. 调试小技巧

### N.1 临时禁用数组模式数据

```javascript
// 在 index.jsx 临时强制走对象模式
data = { percent: 50, unit: '%', title: '测试' };
```

### N.2 临时固定圆环百分比

```javascript
circule.rotateAngle = 360 * 0.5 + rotateDegrees;  // 固定 50%
```

### N.3 临时打印渐变 id

```javascript
console.log('uid', uid);
```

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 数组模式字段名不一致 | 文档化；修复方案记录在 data-model.md § 6.3 |
| 2026-06-16 | `digitalFlopResolve` 副作用 | 文档化；当前为有意设计 |
| 2026-06-16 | `Label.fontColor` 未使用 | 文档化；建议清理 |
| 2026-06-16 | 根 class 与物料名不一致 | 文档化；建议修改但属于破坏性变更 |
