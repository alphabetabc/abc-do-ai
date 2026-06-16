---
title: 踩坑记录
description: popover-check 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `popover-check` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 隐式字段 `defaultCheckedValue` ⚠️

**症状**：
`index.jsx` 第 21 行读取 `defaultCheckedValue`，但 `schema.ts` 中**未声明**该字段，用户无法在 schema 面板配置。

```javascript
// packages/popover-check/index.jsx
const { defaultCheckedValue, funcSettings, selectedStyle, popoverStyle, arrowStyle, height: compHeight } = config;
```

```javascript
// 后续使用
const [checkedItemId, setCheckedItemId] = useState(defaultCheckedValue || []);
```

**原因**：
历史遗留字段，未在 schema 中暴露，但代码路径仍会读取。

**影响**：
- 用户的 `config.defaultCheckedValue` 永远是 `undefined`
- 实际行为退化为"不预设已选"，依赖 `autoInit` 兜底（自动选第一项）
- 与 digital-flop 类似的"schema 不完整"问题

**修复**（已记录到 schema.md § 6 和 common-tasks § 9，未在本次 PR 范围）：
- 在 `schema.ts` 的 `funcSettings` 面板添加 `defaultCheckedValue` 字段（类型 `array`，支持多选 id 列表）
- 在 `defaultValue` 中补默认值

## 2. `document.click` 全局监听的事件冒泡问题

**症状**：
点击组件**内部**某些区域时，弹窗会意外关闭。

**原因**：
`index.jsx` 第 117-125 行注册了全局 `document.click` 监听，未做来源判断。

**当前缓解**：
组件根 `section.popover-check-root` 的 `onClick={(e) => e.stopPropagation()}` 阻止冒泡（line 153-155）。
但**点击空白区域**仍会触发 `document.click`，导致弹窗关闭。

**影响**：
- 在嵌套布局（如 Popover 内嵌 Popover）场景可能误关闭
- 点击组件周围其他装饰元素会触发关闭

**修复建议**：
将全局监听改为 `mousedown`，并通过 `event.target` / `event.composedPath()` 判断是否在组件 DOM 内：

```javascript
useEffect(() => {
    const handler = (e) => {
        if (!rootRef.current?.contains(e.target)) {
            setShowPopover(false);
        }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
}, []);
```

## 3. `mountedRef` 与 `isSingleMode` 切换的边界态

**症状**：
- 首次加载时，单 / 多选切换不会清空已选
- 卸载后再挂载，`mountedRef.current` 行为异常

**原因**：
`index.jsx` 第 127-138 行的双 `useEffect` 配合：

```javascript
useEffect(() => {
    if (mountedRef.current) {
        setCheckedItemId([]);  // 仅在"非首次"挂载时清空
    }
    mountedRef.current = true;
}, [isSingleMode]);

useEffect(() => {
    return () => {
        mountedRef.current = false;  // 卸载时重置
    };
}, []);
```

**逻辑**：
- 首次渲染：`mountedRef.current` 是 `false`，跳过清空
- `isSingleMode` 变化时：`mountedRef.current` 已是 `true`，触发清空
- 卸载 → 重挂载：`mountedRef.current` 被重置为 `false`，恢复首次行为

**注意**：
- 这是**有意**实现的"首次不清空"逻辑
- 不要在 `isSingleMode` 的 effect 里无条件清空，否则首次加载用户配置的默认选中会被清掉

## 4. dataModel.title 与 oss-material.json.title 不一致

**症状**：
- dataModel.json：`title: "下拉组件"`
- oss-material.json：`title: "下拉选择框"`
- doc/README.md：`title: "下拉选择框"`

**影响**：
- 某些数据源展示场景使用 `dataModel.title` 时显示"下拉组件"，与物料名不一致
- 排查时容易困惑

**修复**（已记录到 data-model.md § 6.3，未在本次 PR 范围）：
统一为 `"下拉选择框"`，与 `oss-material.json.title` 和 `doc/README.md` 一致。

## 5. 派发参数标题写"name"实际是"label"

**症状**：
schema 交互面板中：
```typescript
selectLabel: {
    type: 'string',
    title: '选中项name',  // ⚠️ 标题是"选中项name"实际是"选中项label"
    // ...
}
```

**原因**：
历史命名遗留，dataModel 字段是 `label`，但 schema 标题写"name"。

**影响**：
- 用户配置时困惑："我的 dataSource 只有 `label`，为什么要填 name？"
- 部分版本可能把字段名也误写为 `selectName`（无影响，但易混淆）

**修复**（未在本次 PR 范围）：
把 schema 标题改为"选中项label"，与 dataModel 字段名一致。

## 6. dataModel `id` 字段类型声明与实际值不一致

**症状**：
- `dataModel.json` 声明 `id: INTEGER`
- 默认数据实际是字符串：`"id-01"`

**影响**：
- 当用户通过 API 接入数字 id 时，可能被默认转为字符串
- 强类型校验场景下报错

**修复**（已记录到 data-model.md § 6.3）：
把 `id` 字段类型改为 `STRING`，与实际使用一致。

## 7. `tooltip-border.jsx` 圆角 / 箭头位置写死

**症状**：
SVG 装饰边框的 `borderRadius = 2` 和 `arrowToRightPos = 25` 是写死常量，**未暴露 schema 配置**。

**修复建议**：
1. 在 `popoverStyle` 加 `borderRadius` 和 `arrowPosition` 字段
2. 透传给 `TooltipBorder` 子组件

## 8. `containerStyle` 中 border 写死 2px

**症状**：
`index.jsx` 第 45 行：
```javascript
border: `2px solid ${selectedStyle.borderColor}`,
```

边框宽度**写死 2px**，schema 中没有 `borderWidth` 字段。

**修复**：
在 `selectedStyle` 加 `borderWidth: number` 字段，运行时使用：
```javascript
border: `${selectedStyle.borderWidth || 2}px solid ${selectedStyle.borderColor}`,
```

## N. 调试小技巧

### N.1 临时禁用点击外部关闭

```javascript
// useEffect(() => {
//     document.addEventListener('click', hiddenPopover);
//     // ...
// }, []);
```

### N.2 临时打印派发数据

```javascript
console.log('dispatch:', {
    fieldName: interaction.defined?.select,
    state: checkedListIds,
});
```

### N.3 临时强制单选

```javascript
const isSingleMode = true;  // 覆盖 selectedStyle.checkMode
```

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 隐式字段 `defaultCheckedValue` | 文档化；建议在 schema 暴露 |
| 2026-06-16 | 派发参数标题"name"实际"label" | 文档化；建议修正 |
| 2026-06-16 | dataModel `id` 类型不一致 | 文档化；建议改为 STRING |
| 2026-06-16 | dataModel title 不一致 | 文档化；建议统一 |
| 2026-06-16 | `borderWidth / borderRadius` 写死 | 文档化；建议暴露为 schema 字段 |
