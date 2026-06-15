---
title: 踩坑记录
description: digital-flop 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-15
---

# 踩坑记录

本文档记录 `digital-flop` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ `dataSource` 是单对象，不是数组

**症状**：开发者按"图表类物料"的习惯传数组，组件只显示第一个。

**原因**：

```typescript
// index.tsx:38
const dataSource = useMemo(() => {
    let result = _.isArray(propsData) ? propsData[0] : propsData;
    // ...
}, [propsData]);
```

> digital-flop 是**单指标物料**，dataModel 中 `dimensions: []`。
> 组件**自动兼容**两种情况：数组（取 `[0]`）或单对象。

**风险**：

- 业务方配的数据源是数组（`[{ value: 123, render: 1 }]`），只取第一项，多余数据被忽略
- 与 `echarts-bar` 等图表类物料的 `dataSource: array` **约定不同**

**修复**：

- 在 `doc/readme.md` 中明确说明"dataSource 是单对象"
- 接入新数据源时务必测试

## 2. ⚠️ 隐式字段 `id`（dataModel 未声明）

**症状**：用户配了点击事件 `onClickId` 但收不到派发值。

**原因**：

```typescript
// index.tsx:213
{ fieldName: interaction.defined?.onClickId, state: dataSource.id }
//                                                ^^^^^^^^^^^^^^^
// dataSource.id 来自用户配置的数据，但 dataModel.json 中没有声明 id 字段
```

**修复**：

- 方案 A：在 `dataModel.json` 的 `indicators` 中显式加 `id` 字段
- 方案 B：在 `doc/readme.md` 中提示用户需手动在 dataConfig 中加 `id`

详见 [common-tasks.md § 6](./common-tasks.md#任务-6声明-id-字段修复隐式字段)。

## 3. ⚠️ 隐式字段 `enableRemoveEndZero` 和 `fontSkew`

**症状**：

- `enableRemoveEndZero` 字段被组件读取但 schema **完全没声明**！
- `config.number.fontSkew` 同样未声明。

**原因**：

```typescript
// index.tsx:168
enableRemoveEndZero: numberSetting?.enableRemoveEndZero ?? false,

// index.tsx:249
numberSkew={_.get(config, 'number.fontSkew', 0)},
```

组件通过 `NumberSetting` 类型的 `[key: string]: any` 透传，**但 schema 中没有这个字段**。

**风险**：

- 用户**无法在面板配置**这两个字段
- 只有通过 JSON 编辑器 / 导入预制配置 / API 注入才能生效
- 后续维护者会困惑"这字段从哪来"

**修复**：

- 方案 A（推荐）：在 `schema.ts` 显式声明这两个字段
- 方案 B：在 `doc/readme.md` 中标注"这两个字段为高级配置，需通过 JSON 编辑器配置"
- 方案 C：如果不再需要，删除组件读取

```typescript
// 推荐：在 schema.ts 数字格式化分组添加
enableRemoveEndZero: {
    title: '移除末位 0',
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
    'x-component-props': {},
    'x-decorator-props': {},
},
```

## 4. ⚠️ 根 class 与物料名不一致

**症状**：搜不到 `.digital-flop` 根样式。

**原因**：

```typescript
// index.tsx:245
className={classNames('gc-flex visual-base-digital-flop', className)}
//                       ^^^^^^^^^^^^^^^^^^^^^^^^^^
// oss-material.json 的 name 是 'digital-flop'
```

**实际根 class 是 `visual-base-digital-flop`**，与物料名不一致。

**风险**：

- 全局样式覆盖可能失效
- 维护者会困惑
- 与其他物料（如 `echarts-bar` 用 `echarts-bar-wrapper`）风格不一致

**修复**：

- ⚠️ **不建议改根 class**（兼容性风险，老配置可能依赖此 class）
- 在 `index.less` 已正确使用 `.visual-base-digital-flop`
- 在 `index.tsx` 顶部加注释说明

## 5. ⚠️ TWEEN RAF 循环是模块级单例

**症状**：第一个 digital-flop 卸载后，其他实例的动画停止。

**原因**：

```typescript
// value-renderer.tsx:7
let rafRunningFlag = false;
let stopFlag = false;
let rafId: any = null;

const update = () => {
    if (stopFlag) {
        cancelAnimationFrame(rafId);
        rafId = null;
        return;
    }
    TWEEN.update();
    rafId = requestAnimationFrame(update);
};
```

> ⚠️ 这是**模块级单例**，所有 `ValueRenderer` 实例共享。
> **没有实例引用计数**，第一个 `dispose()` 可能误关全局循环。

**风险**：

- 多实例场景下生命周期管理复杂
- 卸载时序问题可能导致动画意外停止

**修复**：

- 当前实现是"启动后不会主动停止"，只在 `stopFlag = true` 时停止
- `stop()` 函数（line 20）实际是**空函数**（`stopFlag = false`），**没有停止逻辑**
- 这是一个**已知设计**：动画始终运行，靠 React 重渲染驱动

## 6. ⚠️ `useValueRenderer` 不会重置

**症状**：动态切换 `flopType` / 样式时不生效。

**原因**：

```typescript
// value-renderer.tsx:246
const valueRenderer = useMemo(() => {
    if (preValueRenderRef.current) preValueRenderRef.current.stop();
    preValueRenderRef.current = new ValueRenderer({ valueStyles: [...] });
    return preValueRenderRef.current;
}, []);  // ← 依赖为空，永远只创建一次
```

**修复**：

- 样式/精度/千分位变化由 `useEffect` 监听并 `updateStyle` 处理
- **核心结构不会重置**，是设计如此

## 7. ⚠️ `prefix.text` 为空且无趋势时 prefix 不渲染

**症状**：配了 prefix 但看不到。

**原因**：

```typescript
// index.tsx:250
prefixVisible={(!_.isNil(prefixOption.text) && prefixOption.text !== '') || prefixOption.trend.trendVisible}
```

> 只有当 `text` 非空 **或** 趋势可见时，prefix 才显示。

**修复**：

- 业务方需配 `prefix.text` 或开启趋势
- 文档中说明

## 8. ⚠️ 趋势阈值相等时无图标

**症状**：`data === threshold` 时趋势图标消失。

**原因**：

```typescript
// index.tsx:99
if (data > threshold) result = tendencyTypes[0]; // 'up'
if (data < threshold) result = tendencyTypes[1]; // 'down'
// 等于时 result 保持 null
```

**修复**：

- 设计如此（表示"中性"）
- 文档中说明

## 9. ⚠️ `dataModel.json` 中 `dimensions: []` 容易让人误解

**症状**：以为支持维度而传入多行数据。

**原因**：

```json
{
    "dataModelDefinition": {
        "header": {
            "dimensions": [],
            "indicators": [...]
        }
    }
}
```

**修复**：

- schema.md / data-model.md 中明确说明
- 接入时强制单对象

## 10. 调试小技巧

### 10.1 查看 TWEEN 当前值

```typescript
// value-renderer.tsx update() 内
console.log('TWEEN update:', o.value, this.currentValue);
```

### 10.2 关闭动画快速调试

```typescript
// index.tsx:148
const valueRenderer = useValueRenderer(
    { value: ... },
    { animation: { show: false, duration: 0 }, ... }
);
```

### 10.3 临时禁用渐变

```typescript
<RootStyled enable={false} ...>
```

### 10.4 查看实际 dataSource

```typescript
// index.tsx 顶部
console.log('dataSource:', propsData);
```

## 11. ✅ 最佳实践

1. **单对象数据**：`dataSource` 是单对象（或单元素数组），多元素会被截断
2. **id 字段手动加**：接入数据时**手动**在 dataConfig 加 `id` 字段
3. **隐式字段**：避免在组件中读取 schema 未声明的字段（除非必要）
4. **样式优先级**：级别 > 趋势 > 默认
5. **趋势位置**：trend.position 决定在 prefix 还是 suffix 显示
6. **千分位 margin**：通过 `groupSeparator.margin.left/right` 配置（`RootStyled` 注入）

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
