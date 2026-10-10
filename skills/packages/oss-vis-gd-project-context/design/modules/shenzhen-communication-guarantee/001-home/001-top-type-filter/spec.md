# 001-top-type-filter · 顶部 5 类型统计（spec）

> 2026-10-10 迁移完成（004-03），静态展示定稿；选中/取消三联动已实施（005）。

## 职责

首屏顶端的 5 个类型统计卡：会场、参访区、酒店、交通枢纽、其它（含媒体中心类型区域），顺序固定。展示各类型区域数量。

## 组件构成

- 物理复制自信管局 `home/modules/top-indicators`（index.tsx + scale-item-card.tsx + index.less），接口接深圳屏 `getTopIndicatorsApi`（见同目录 data-model.md）
- 类型字典与顺序来自 `share/presets.ts` 的 `AreaType`（不硬编码在组件内）
- NoStylePanel 2716×120；widgets 注册 left 1220 / top 170
- 图标：`icon-<类型>.svg` 走 `${constants.IMAGE_PATH}/shenzhen-communication-guarantee/`，UI 出图已按原文件名就位

## 交互（005 已实施）

- **选中**：点击类型卡 → 选中态高亮（`useState(activeType)` 管理），其余卡 `opacity: 0.7` → `onFilterChange` 回调至 index.tsx，经 `widgetFields.getField('areaTypeFilter')` `dispatch` 广播类型名；center-map 图层、007-area-carousel 轮巡订阅后过滤为该类型区域
- **取消选中**：对已选中类型再次点击 → 取消高亮 → 广播 `areaTypeFilter: null`，地图与轮巡恢复全部区域（全不选 = 全高亮）
- 单选语义：任一时刻最多一个类型处于选中态

## 边界

- 某类型区域数为 0：卡片仍展示（数量 0），点击后地图与轮巡显示空态（空态样式待确认）
