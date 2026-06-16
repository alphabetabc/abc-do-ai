---
title: 常见修改任务
description: dock-menu 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `dock-menu` 最常见的修改需求及对应的代码定位。

## 任务 1：新增菜单项样式配置项（如 hover 样式）

**场景描述**：希望菜单项在 hover 时也有独立样式（当前只有默认和选中两种状态）。

涉及：

- 🟦 Schema：[schema.md § 2](./schema.md#2-formcollapse-分组详情config) — 新增 `hoverStyle` 面板
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-背景样式格式化-formateitembgstyle) — 新增 hover 状态判断

**步骤**：

1. 在 `schema.ts` 的 `$collapse.properties` 中新增 `hoverStyle` 面板：
   ```typescript
   hoverStyle: {
       type: 'object',
       'x-component': 'FormCollapse.CollapsePanel',
       'x-component-props': { header: '悬停设置' },
       properties: { ...commonStyle },
   },
   ```
2. 在 `index.tsx` 中新增 `hoveredKey` 状态：
   ```typescript
   const [hoveredKey, setHoveredKey] = useState(null);
   ```
3. 在菜单项渲染时判断 hover 状态，使用对应的样式：
   ```typescript
   const itemBgStyle = isActive ? formateItemBgStyle(activeStyle)
       : hoveredKey === item.key ? formateItemBgStyle(hoverStyle)
       : formateItemBgStyle(baseStyle);
   ```
4. 在 `defaultValue` 中添加 `hoverStyle` 默认值。

## 任务 2：调整热区交互行为（如改为点击展开）

**场景描述**：希望点击热区展开菜单，而非 hover 展开。

涉及：

- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-hover-展开隐藏)

**步骤**：

1. 在 `index.tsx` 中将 `onMouseEnter`/`onMouseLeave` 改为 `onClick`：
   ```typescript
   const [showInner, setShowInner] = useState(false);
   const toggleInner = () => {
       !!!(mode === 'development') && setShowInner(prev => !prev);
   };
   ```
2. 将热区和菜单面板的 `onMouseEnter`/`onMouseLeave` 替换为 `onClick={toggleInner}`。

## 任务 3：新增数据字段（如菜单图标 icon）

**场景描述**：希望每个菜单项支持自定义图标（当前只有前缀图片，是全局配置）。

涉及：

- 🟦 Schema：[schema.md § 2.2](./schema.md#22-默认设置-basestyle) — 无需改（数据驱动）
- 🟨 组件逻辑：[component-logic.md § 3](./component-logic.md#3-子组件-itemtitle内联) — ItemTitle 读取数据项图标
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标) — 新增 `icon` 字段

**步骤**：

1. **dataModel.json**：在 `indicators` 添加 `icon` 字段
2. **index.tsx**：在 `ItemTitle` 中优先使用 `item.icon`（数据驱动），降级使用 `prefix.prefixImg`
   ```typescript
   const ItemTitle = ({ style, titleName, icon }) => {
       const { prefix } = style;
       const iconUrl = icon || prefix.prefixImg;
       // ...
   };
   ```
3. **defaultValue**：在默认数据中添加 `icon` 字段

## 任务 4：调整菜单面板动画效果

**场景描述**：希望修改展开/隐藏的动画时长或动画曲线。

涉及：

- 🟨 组件逻辑：[component-logic.md § 4.2](./component-logic.md#42-关键样式)

**步骤**：

1. 在 `index.less` 中修改 `.dock-inner` 的 `transition` 属性：
   ```less
   .dock-inner {
       transition: transform 0.3s ease-in-out;  // 原为 0.45s
   }
   ```
2. 同步修改 `.icon-block` 的 `transition`（如需）。

## 任务 5：启用交互面板（点击事件回调）

**场景描述**：希望点击菜单项时触发交互事件而非直接跳转 URL。

涉及：

- 🟦 Schema：[schema.md § 5](./schema.md#5-数据面板与交互面板) — 新增交互面板
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-菜单项渲染与选中逻辑) — 改 `onItemClick`

**步骤**：

1. **schema.ts**：添加 `defineInteractionSchema`：
   ```typescript
   defineInteractionSchema({
       subscribe: {},
       action: { click: { type: 'void', title: '点击菜单项' } },
   }),
   ```
2. **index.tsx**：接收 `interaction` props，在 `onItemClick` 中调用：
   ```typescript
   const { interaction } = props;
   const onItemClick = (url, isActive, item) => {
       if (mode === 'development') return;
       if (!isActive) {
           interaction?.dispatch?.('click', { item });
           url && window.location.assign(url);
       }
   };
   ```

## 任务 6：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.xxx`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

常见调整：

- 修改默认展开宽度/隐藏宽度：`defaultValue.config.width` / `defaultValue.config.commonStyle.hideWidth`
- 修改热区默认位置：`defaultValue.config.commonStyle.hotZone.position`
- 修改默认菜单项数据：`defaultValue.dataConfig.json`
- 修改默认选中项：`defaultValue.config.commonStyle.activeKey`
