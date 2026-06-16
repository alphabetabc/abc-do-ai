---
title: 踩坑记录
description: dock-menu 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

本文档记录 `dock-menu` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ 设计态 hover 交互被禁用

**症状**：在设计器中拖入 dock-menu 后，鼠标移入热区菜单不展开。

**原因**：

```typescript
// index.tsx:26
function onMouseEnter() {
    !!!(mode === 'development') && setShowInner(true);
}
```

> `mode === 'development'` 时 hover 交互被禁用，这是**预期行为**——设计态下不应触发展开动画，避免干扰编辑。

**修复**：预览模式下 hover 正常。如需在设计态调试展开效果，可临时注释条件判断。

## 2. ⚠️ `activeKey` 类型兼容问题

**症状**：选中状态不生效，所有菜单项都使用 `baseStyle`。

**原因**：

```typescript
// index.tsx:110
const isActive = commonStyle.activeKey.toString() === item.key;
```

> `activeKey` 可能来自 schema 默认值（number `1`）或用户输入（string `'1'`），`item.key` 来自 dataSource（string `'1'`）。代码使用 `.toString()` 做兼容。

**修复**：确保 `activeKey` 和 `item.key` 都能被 `.toString()` 正确转换。如果 dataSource 中 `key` 是数字类型，也会正常工作。

## 3. ⚠️ 选中项不阻止跳转

**症状**：点击已选中的菜单项仍然跳转。

**原因**：

```typescript
// index.tsx:33
const onItemClick = (url, isActive) => {
    !!!(mode === 'development') && !!!isActive && url && window.location.assign(url);
};
```

> `!!!isActive` 确保**已选中项不跳转**。但如果 `isActive` 判断逻辑有误（见坑 3），可能导致选中项也跳转。

**修复**：先排查 `activeKey` 匹配逻辑。

## 4. ⚠️ `backgroundRepeat` 的 `'full'` 值是自定义值

**症状**：背景图拉伸方式不符合预期。

**原因**：

```typescript
// index.tsx:48
if (backgroundRepeat && backgroundRepeat === 'full') {
    innerStyle.backgroundSize = '100% 100%';
    innerStyle.backgroundRepeat = 'no-repeat';
}
```

> `'full'` 不是 CSS 标准值，是物料自定义值，等价于 `background-size: 100% 100%; background-repeat: no-repeat`。其他值（`no-repeat` / `repeat-x` / `repeat-y` / `repeat`）直接映射到 CSS `background-repeat`。

**修复**：在 schema 的 enum 中已明确标注 `'full'` 为"不重复，铺满"。

## 5. ⚠️ 默认背景图资源依赖

**症状**：菜单项背景图或前缀图不显示。

**原因**：默认值中引用了静态图片资源：

```typescript
// schema.ts 默认值
baseStyle: {
    backgroundImg: { url: 'ShaanxiUnicom_dmjtf.png', isMaterial: false },
    prefix: { prefixImg: { url: 'ShaanxiUnicom_youpingzhuangshi.png', isMaterial: false } },
},
activeStyle: {
    backgroundImg: { url: 'ShaanxiUnicom_youpingbiankuang.png', isMaterial: false },
    prefix: { prefixImg: { url: '水波纹.png', isMaterial: false } },
},
```

> 这些图片资源通过 `getImageUrl` 加载，依赖 `env` 和 `constants` 上下文。如果资源路径不对或资源缺失，图片不显示且无报错。

**修复**：检查 `assets.js` 中是否包含这些资源，以及 `getImageUrl` 能否正确解析。

## 6. ⚠️ `type.d.ts` 类型定义与实际使用不完全一致

**症状**：类型检查时 `DockItem` 的 `icon` 字段与 schema 配置不匹配。

**原因**：

```typescript
// type.d.ts
export type DockItem = {
    icon: string | Record<string, string>;
    title: string;
    url: string | null;
};
```

> 实际组件中 `icon` 字段**未使用**，前缀图标来自 schema 的 `prefix.prefixImg` 配置（全局统一），而非数据驱动。`type.d.ts` 中的 `DockItem.icon` 是预留字段。

**修复**：当前类型定义与实际使用有偏差，如需数据驱动图标，参考 [common-tasks.md § 3](./common-tasks.md#任务-3新增数据字段如菜单图标-icon)。

## 7. 调试小技巧

### 7.1 查看当前选中状态

```typescript
// index.tsx
console.log('activeKey:', commonStyle.activeKey);
data.forEach(item => console.log(`item.key=${item.key}, isActive=${commonStyle.activeKey.toString() === item.key}`));
```

### 7.2 设计态强制显示菜单面板

```less
// index.less
.dock-inner {
    &.preview-mode {
        transform: translateX(0) !important;  // 强制显示
    }
}
```

### 7.3 查看格式化后的背景样式

```typescript
// index.tsx
console.log('formatted bg style:', formateItemBgStyle(activeStyle));
```

## 8. ✅ 最佳实践

1. **修改 `activeKey` 匹配逻辑**时同步更新 `.toString()` 调用
2. **新增样式面板**时复制 `commonStyle` 对象，保持与默认/选中面板一致
3. **修改热区交互**时注意同时更新热区和菜单面板的事件绑定
4. **添加静态资源**时确保资源路径在 `getImageUrl` 的可解析范围内

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 文档化（基于 develop 分支代码） | 首次梳理 |
