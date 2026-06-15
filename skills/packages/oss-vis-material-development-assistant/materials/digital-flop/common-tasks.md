---
title: 常见修改任务
description: digital-flop 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-15
---

# 常见修改任务

本文档列出针对 `digital-flop` 最常见的修改需求及对应的代码定位。

## 任务 1：新增数字样式（如字体粗细、字间距）

**场景描述**：用户希望调整数字的字间距或行高。

涉及：

- 🟦 Schema：[schema.md § 2.2.2](./schema.md#222-尺寸--文本--间距)
- 🟨 组件逻辑：[component-logic.md § 4.2.3](./component-logic.md#423-字符级样式)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `number.textStyle` (VisualTextStyle) 已有大部分配置，**如需新增需扩展 VisualTextStyle 通用组件**
2. 字间距：使用 `number.textGap`（已有，NumberPicker）
3. 字符 margin：改 `value-renderer.tsx` 的 `el.style.margin` 计算逻辑

## 任务 2：调整动画曲线 / 时长

**场景描述**：默认动画太慢 / 太快，或希望用其他缓动函数。

涉及：

- 🟦 Schema：[schema.md § 2.2.5](./schema.md#225-动画-animation)
- 🟨 组件逻辑：[component-logic.md § 4.2.1](./component-logic.md#421-tween-触发逻辑)
- ⬜ 数据：（无）

**步骤**：

1. 调整 `schema-parts/defaultValues.ts` 的 `animation.duration` 默认值
2. 调整 `value-renderer.tsx` 的 `innerAnimationOption`：
   ```typescript
   private innerAnimationOption = {
       duration: 1000,                       // 改时长
       easing: TWEEN.Easing.Quadratic.Out,    // 改缓动（如 TWEEN.Easing.Cubic.InOut）
   };
   ```

## 任务 3：新增趋势图标类型

**场景描述**：业务需要"圆形 / 三角"等自定义图标。

涉及：

- 🟦 Schema：[schema.md § 2.3](./schema.md#23-趋势设置-trend独立-customcollapse) — 改 `iconSelect` enum
- 🟨 组件逻辑：[component-logic.md § 7.1](./component-logic.md#71-三种-icontype) — 改 switch
- ⬜ 数据：（无）

**步骤**：

1. 在 `TrendIcon.tsx` 的 `trendIcons` 数组加类型：
   ```typescript
   export const trendIcons = ['↑', '+/-', 'custom', 'circle'];
   ```
2. 在 `iconSelect` schema 的 enum 加 `{ value: 'circle', label: '圆形' }`
3. 在 switch 加分支：
   ```typescript
   case 'circle':
       return <span style={{...style, borderRadius: '50%', background: style.color, width: 12, height: 12}} />;
   ```
4. `ICON_SELECT` 常量（来自 `@Common/constants`）可能需要扩展

## 任务 4：扩展下钻效果（如跳转到 URL）

**场景描述**：当前已支持 Modal/Drawer/Window/WindowSelf 4 种，**如需新增**（如 "Iframe 内嵌"）。

涉及：

- 🟦 Schema：[schema.md § 4.1](./schema.md#41-单击事件-onclickaction)
- 🟨 组件逻辑：[component-logic.md § 3.3.4](./component-logic.md#334-点击事件-onlabelclick)
- ⬜ 数据：（无）

**步骤**：

1. 在 `effect` Select 选项追加：
   ```typescript
   {
       label: '内嵌Iframe',
       value: 'Iframe',
   },
   ```
2. 在 `index.tsx` 的 `onLabelClick` 加分支：
   ```typescript
   } else if (clickEvent.effect === 'Iframe') {
       // 自定义行为
   }
   ```
3. 在 schema 加 `iframeSet` 块（参考 `modalSet`）

## 任务 5：调整默认颜色 / 默认动画

**涉及文件**：

- `schema-parts/defaultValues.ts` — 集中维护 number/trend/prefix/suffix 的默认值

```typescript
// 示例：调整趋势默认色
const trend = {
    show: true,
    threshold: 0,
    iconSelect: '↑',
    iconColorSettings: {
        up: '#52C41A',     // 改为你想要的颜色
        down: '#FF4D4F',
        syncToNumber: false,
    },
};
```

> 💡 推荐改 `defaultValues.ts` 而非 `defaultValue` 内联值（更清晰）。

## 任务 6：声明 `id` 字段（修复隐式字段）

**场景描述**：`id` 字段被点击事件依赖但 dataModel 未声明，导致用户不知道要填。

涉及：

- 🟦 Schema：（无需改）
- 🟨 组件逻辑：（无需改）
- 🟩 数据：[data-model.md § 4](./data-model.md#4-隐式字段清单)

**步骤**：

1. 在 `dataModel.json` 的 `indicators` 数组显式加 `id` 字段（详见 [data-model.md § 5.1](./data-model.md#51-显式声明-id-字段)）
2. 在 `defaultValue.dataConfig.json` 保留 `id: 1`
3. 同步更新 `doc/readme.md` 告诉用户"id 字段用于点击事件派发"

## 任务 7：性能优化（多个 digital-flop 同屏）

**场景描述**：单页有 50+ 个 digital-flop 实例，担心性能。

涉及：

- 🟨 组件逻辑：[component-logic.md § 10](./component-logic.md#10-性能要点)

**步骤**：

1. **TWEEN RAF 循环是模块级单例**，已经最优
2. `useMemo([])` 只创建一次 ValueRenderer，正确
3. 字符级 DOM 操作不走 React diff，正确
4. 如仍卡顿，考虑：
   - 关闭动画：`number.animation.show = false`
   - 简化文本样式：减少 VisualTextStyle 字段

## 任务 8：新增"前/后缀图标"能力

**场景描述**：希望 prefix 也能像 trend 一样显示图标。

涉及：

- 🟦 Schema：[schema.md § 2.4](./schema.md#24-前缀-prefix独立-formcollapse)
- 🟨 组件逻辑：[component-logic.md § 6.1](./component-logic.md#61-compprefixtpltsx)

**步骤**：

1. 在 schema 的 `prefix` 分组加 `prefixIcon` 字段（参考 trend.iconSelect）
2. 在 `prefixOptionResolve` 加 `prefixIcon: ...`
3. 在 `PrefixTpl` 组件中渲染 `prefixIcon`
