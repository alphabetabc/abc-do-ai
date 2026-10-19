# 002-area · 重保区域屏视图

> 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/area/`。screen-name：`shenzhen-communication-guarantee-area`。布局（设计稿 3840×2160）：左 4G 业务（926×600，l120/t216）/ 右 5G 业务（926×600，l2800/t216）；其下对称 4G/5G 指标趋势（926×1126，l120·l2800/t840）；中部地图区；底部 区域轮巡（1682×160，NoStylePanel 无标题，l1079/t1496）+ 保障资源（1668×280，Panel 含标题，l1086/t1680）。2026-10-12 按实际代码回填。

## 目录结构（代码现状）

```
sub-pages/area/
├── index.tsx            # AreaRootBackground（场馆底图 `getImageUrl('shenzhen-communication-guarantee/stadium-images/{name}.png')`，兜底 default-stadium.png；2026-10-14 改用 getImageUrl 适配环境）+ Area 入口
├── context.tsx          # AreaContext / useCurrentArea / resolveAreaAdcode / useCurrentArea
└── modules/
    ├── index.ts         # registerWidget 注册 6 个 widget（业务/趋势×2、轮巡、保障资源）+ 布局坐标
    ├── screen.ts        # createLargeScreen('shenzhen-communication-guarantee-area')
    ├── fields.ts        # ⚠️ 空壳（@todo 005），区域联动不走 WidgetInteraction
    ├── network-business/  trend-indicators/  preposition-resource/  area-carousel/  area-background/
```

`area-background/index.tsx` 为桥接 widget：把 WidgetInteraction 注入的 `props.currentArea` 写入 AreaContext。

## widget 索引

| 子目录 | 内容 |
| --- | --- |
| [001-network-business/](./001-network-business/spec.md) | 4G/5G 业务（一套组件两份配置 `networkType: '4G'\|'5G'`）：基站/小区 总数、退服数、退服率；15 分钟轮询 |
| [002-area-carousel/](./002-area-carousel/spec.md) | 区域轮巡（全量区域，图片+名称；点击卡片切换当前区域） |
| [003-preposition-resource/](./003-preposition-resource/spec.md) | 保障资源：分组双指标（任务中/总数），通信车/发电车/人员 |
| [004-trend-indicators/](./004-trend-indicators/spec.md) | 4G/5G 指标趋势（一套组件两份配置）：RRC 均值/最大值、接通率、无线平均利用率；15 分钟轮询 |

## 进入方式与区域上下文链路

- 左下角切换按钮（首页 → 重保区域）；首屏地图打点/浮层点击 `switchViewByArea(activeArea)` 切屏
- 区域状态由 `sub-pages/index.tsx` 的 `useState` 持有，经 `ViewContext.Provider` 下发；query 参数 `enableViewSync=1&view=area` 仅用于调试切屏，不参与取数
- 区域屏内 `useCurrentArea()` = `activeArea ?? currentArea`；`resolveAreaAdcode()` 按 `adcode ?? areaAdcode ?? areaCode ?? area ?? id ?? name` 链取 adcode（network-business / trend 用 adcode 作 `area` 参数），保障资源用 `area?.name ?? area?.userlabel` 作 `areaName`
- 无 activeArea 时 AreaProvider 兜底 `{ name: '深圳' }`
- 区域屏自身 `fields.ts` 为空壳，区域联动完全走 ViewContext + AreaContext（无跨屏 WidgetInteraction 字段）

## 复用边界（禁止跨模块 import 的落实情况）

- 页面代码层面**无任何跨屏代码 import**（不 import 信管局 game-match / open-and-close）
- 间接借用信管局资产（非代码 import）：保障资源分组范式与 less 类名、`${constants.IMAGE_PATH}/info-management-bureau/icon-*.svg` 图标、QualityLineCard 配色对齐 wireless-quality、viewPageId 复用 `open-close-ceremonies-view`
- `section-center.ts` 内 `getAreaListApi`（复用信管局 today-game-scheduler 接口与 mock）为预留代码，当前无组件消费

## 数据源

`web/services/shenzhen-communication-guarantee/area/`（section-left.ts / trend.ts / section-center.ts；区域轮巡走共享 hook `sub-pages/components/area-carousel/use-area-carousel-data.ts` → `home/center.ts`；见各 widget data-model.md；接口清单见 [../000-overview/README.md](../000-overview/README.md) §6）
