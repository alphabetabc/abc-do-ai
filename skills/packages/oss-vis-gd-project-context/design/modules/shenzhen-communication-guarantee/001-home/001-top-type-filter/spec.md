# 001-top-type-filter · 顶部 5 类型统计（spec）

> 2026-10-10 迁移完成（004-03），静态展示定稿；选中/取消三联动已实施（005）。
> 2026-10-20 反拉终端：类型改名 + 前端静态直出（task-2026-10-20-001）。

## 职责

首屏顶端的 5 个类型统计卡：重要场地、指挥部、保障酒店、参访区、交通枢纽，顺序固定（照抄 PM 2026-10-20 需求原文）。展示各类型区域数量。

## 数据（2026-10-20 起静态直出）

- service `getTopIndicatorsApi`（center.ts）读取环境配置 key `shenzhen-communication-guarantee-view-competition-homepage-statistics`，`enableStaticData=true` 时跳过接口直接返回 `staticData`；未下发时回退源码默认模板（8/1/85/25/10）。详见 `000-overview/environment-config.md`
- **展示名与过滤名解耦**：数据项 `title` 为展示名（重要场地/指挥部/…），`type` 保留原过滤字典（会场/其它/酒店/参访区/交通枢纽）继续参与 `areaTypeFilter` 广播 → 地图图层 + 底部轮巡过滤；组件渲染 `item.title ?? item.type`，点击过滤与图标取图仍走 `item.type`
- 服务端 `areaTypeName` 字典与 `icon-<type>.svg` 均不变（开放问题 5 结论）

## 组件构成

- 物理复制自信管局 `home/modules/top-indicators`（index.tsx + scale-item-card.tsx + index.less），接口接深圳屏 `getTopIndicatorsApi`（见同目录 data-model.md）
- 类型字典与顺序来自 `share/presets.ts` 的 `AreaType`（不硬编码在组件内）
- NoStylePanel 2716×120；widgets 注册 left 1220 / top 170
- 图标：`icon-<类型>.svg` 走 `${constants.IMAGE_PATH}/shenzhen-communication-guarantee/`，UI 出图已按原文件名就位

## 交互（005 已实施；2026-10-13 现场样式优化调整选中态）

- **选中**：点击类型卡 → 选中卡加 `item-card-row-selected` 类（背景换 `images/top_bg_active.svg`，数值渐变换 `rgba(0,218,204,1) → rgba(0,255,42,1)`）→ `onFilterChange` 回调至 index.tsx，经 `widgetFields.getField('areaTypeFilter')` `dispatch` 广播类型名；center-map 图层、007-area-carousel 轮巡订阅后过滤为该类型区域
- **取消选中**：对已选中类型再次点击 → 取消选中态 → 广播 `areaTypeFilter: null`，地图与轮巡恢复全部区域
- 单选语义：任一时刻最多一个类型处于选中态
- 2026-10-13 调整：取消「其余卡 opacity 0.7」压暗效果，所有卡 opacity 恒为 1，选中差异仅靠 selected 背景与数值渐变色区分
- **返回重置（003 卡 F6，2026-10-21）**：模块内 `useEffect` 监听容器 `visible=false`（下钻离开首屏）时 `dispatch(areaTypeFilter, null)`；ScaleItemCard 新增 `value` prop 受控化（顶部 widget 注册 `subscribe: areaTypeFilter` 回读），保证返回后无「数据重置但 UI 高亮残留」

## 边界

- 某类型区域数为 0：卡片仍展示（数量 0），点击后地图与轮巡显示空态（空态样式待确认）
