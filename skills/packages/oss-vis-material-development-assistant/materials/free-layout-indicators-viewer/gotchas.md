---
title: 踩坑记录
description: free-layout-indicators-viewer 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-15
---

# 踩坑记录

本文档记录 `free-layout-indicators-viewer` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ 静态资源 `default-bg.png` 路径强依赖

**症状**：物料构建后找不到默认背景图，显示空白。

**原因**：

```typescript
// index.tsx:11
const getBackgroundImage = (name, ownerProps) => {
    return getMaterialImageUrl(name, ownerProps, 'static/images/free-layout-indicators-viewer');
};
```

> 第三个参数 `'static/images/free-layout-indicators-viewer'` **必须与物料 name 一致**。

**风险**：

- 重命名物料时（如 `free-layout-indicators-viewer` → `free-layout-kpi`）忘记同步资源目录，构建会失败
- 删除 `public/static/images/free-layout-indicators-viewer/` 后无报错但图不显示

**修复**：

- 改物料名时**同步改**：
  1. `oss-material.json.name`
  2. `public/static/images/{name}/` 目录名
  3. `index.tsx` 的 `getMaterialImageUrl` 第三个参数
- 在 `doc/readme.md` 中标注资源依赖

## 2. ⚠️ `dataSource` 不全时部分点不渲染

**症状**：用户配了 10 个点，但只显示 5 个（数据源只有 5 项）。

**原因**：

```typescript
// index.tsx:25
const dataItem = dataSource.find((item) => item.indicatorId === point.id);
if (!dataItem) return null;  // ⚠️ 静默不渲染，不抛错
```

**修复**：

- 在 `doc/readme.md` 中明确"dataSource 必须包含所有 `points[].id`"
- 可考虑加 console.warn 提示：
  ```typescript
  if (!dataItem) {
      console.warn(`[free-layout-indicators-viewer] No data for point: ${point.id}`);
      return null;
  }
  ```

## 3. ⚠️ `filterKey` 解析对空格敏感

**症状**：用户配 `"id-1, id-2,id-3"`（混合空格），部分匹配失败。

**原因**：

```typescript
(item.filterKey || '').split(',').includes(dataItem.indicatorId);
```

> `split(',')` 不会自动 `trim` 空格，`' id-1'` 包含前导空格，与 `'id-1'` 不相等。

**修复**：

- 改匹配函数：
  ```typescript
  (item.filterKey || '').split(',').map((s) => s.trim()).filter(Boolean).includes(dataItem.indicatorId);
  ```
- 在 `doc/readme.md` 中提示"多个 id 用英文逗号分隔，无空格"

## 4. ⚠️ `indicatorType` 字段未使用

**症状**：用户以为 `indicatorType` 字段有意义，但组件不读。

**原因**：dataModel 声明了 `indicatorType`，但**组件代码中没有任何 `_.get(props, 'dataItem.indicatorType')` 的读取**。

**修复**：

- **方案 A**（清理）：从 `dataModel.json` 的 `indicators` 移除 `indicatorType`
- **方案 B**（启用）：在 `IndItem.tsx` 中读取并使用（如按 type 切换样式）

> 当前默认数据 `indicatorType: ''` 全是空串，说明设计上**不打算使用**，推荐方案 A。

## 5. ⚠️ 容器 `width: 0.01; height: 0.01` 但内容撑开

**症状**：DOM 检查时 `.ind-item` 尺寸接近 0，但内容显示正常。

**原因**：

```typescript
// IndItem.tsx
style={{
    position: 'absolute',
    left: props.left,
    top: props.top,
    width: 0.01,                // 容器几乎无尺寸
    height: 0.01,
    transform: 'translate3d(-50%, -50%, 0)',  // 居中
}}
```

> 容器是"锚点"，**子元素（数字、名称）绝对定位** + 容器小尺寸 + `translate3d` 实现"以坐标点为圆心"。

**风险**：

- 调试时检查元素尺寸会困惑
- 复制样式到其他组件可能失效

**修复**：

- 加注释说明
- 不要轻易改尺寸（破坏定位）

## 6. ⚠️ `eventUISetting` 钩子未实现

**症状**：schema 中配了 `layout.pointSize`，但点击事件没触发。

**原因**：

```typescript
// IndItem.tsx
{props.eventUISetting && (
    <div
        className="ind-item-event-ui"
        style={{ width: ..., height: ... }}
    />
    // ⚠️ 没有 onClick 绑定
)}
```

> 容器渲染了，但**没绑事件**。交互面板也被注释掉（schema.ts 末尾）。

**修复**：

- 详见 [common-tasks.md § 4](./common-tasks.md#任务-4启用交互面板下钻)
- 当前**预期行为**：`eventUISetting` 只控制事件层尺寸，不触发事件

## 7. ⚠️ `data-name="position-point"` 是 CSS 钩子

**症状**：业务方想用 CSS 选中所有位置点。

**原因**：

```typescript
// IndItem.tsx
<div ... data-name="position-point" ... />
```

**修复**：

- 通过 CSS 属性选择器：`[data-name="position-point"]`
- 或在 styled-components 中引用

## 8. ⚠️ `useLatest` 包装的 `latestProps` 实际只用了 `designer`

**症状**：`latestProps` 占用 ref，但实际只为了拿到 `designer`。

**原因**：

```typescript
// index.tsx:11
const getBackgroundImage = (name, ownerProps) => {
    return getMaterialImageUrl(name, ownerProps, '...');
};
// ...
const rootBackgroundImage = useMemo(() => {
    // ...
    return getBackgroundImage(image, latestProps.current);
}, [config.layout.background, config.layout.disableBackground, latestProps]);
```

**修复**：

- 当前实现是合理的（避免 designer 变化时 stale）
- 如需简化，可直接传 `props.designer`：
  ```typescript
  useMemo(() => {
      // ...
      return getBackgroundImage(image, props.designer);
  }, [config.layout.background, config.layout.disableBackground, props.designer]);
  ```

## 9. ⚠️ styled-components `$font` 必须有完整字段

**症状**：字体不生效。

**原因**：

```typescript
${utils.createCssStringFromStyles(props.$font)};
```

> `createCssStringFromStyles` 期望 `fontStyle` 对象含 `fontSize/color/fontFamily/...`，**缺字段可能报错**。

**修复**：

- 用 `compositionFontStyle()` 工厂生成默认值
- 不要手写残缺对象

## 10. 调试小技巧

### 10.1 查看实际匹配的 points

```typescript
// index.tsx
console.log('matched points:', points);
```

### 10.2 临时禁用背景

```typescript
// index.tsx
if (true) return ''; // 强制禁用
```

### 10.3 查看 indicatorItemSetting 匹配

```typescript
// IndItem.tsx
console.log('bgSetting:', props.bgSetting);
```

### 10.4 检查 styled-components 注入

```typescript
// StyledGradient.tsx
console.log('gradientStr:', gradientStr({ $enableGradient: true, $font: {...}, $colors: [...] }));
```

## 11. ✅ 最佳实践

1. **dataSource 必须全**：确保包含所有 `points[].id`
2. **filterKey 无空格**：避免 `'id-1, id-2'` 这种格式
3. **静态资源不重命名**：`public/static/images/{name}/` 与 `oss-material.json.name` 绑定
4. **`compositionFontStyle()` 工厂**：不要手写 `fontSetting` 对象
5. **`StyledGradient` 三选一**：值/单位/名称分别用对应组件
6. **事件层 z-index 999**：保留当前值，不要被全局样式覆盖

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-15 | 文档化（基于 develop 分支代码） | 首次梳理 |
