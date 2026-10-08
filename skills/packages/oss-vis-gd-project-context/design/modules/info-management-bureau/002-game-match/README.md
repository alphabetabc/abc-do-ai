# 002-game-match · 比赛日视图

> 源码：`web/pages/info-management-bureau/sub-pages/game-match/`。信管局比赛日视图（ViewDimensionsTypes.GameMatch）：赛事期间展示，以场馆为中心的无线/专线/网络质量与保障资源面板。

## 快速上手

- `index.tsx`：`ContainerProvider` + `WidgetsRender`（widget 体系见 [../000-overview/README.md](../000-overview/README.md)）
- `modules/screen.ts`：`createLargeScreen('info-management-bureau-game-match')`
- `modules/fields.ts`：交互字段 `currentArea`（当前场馆信息）
- 接口层：`web/services/info-management-bureau/game-match/`（section-left / section-center / section-right），viewPageId `open-close-ceremonies-view`，viewPageArgs 携带场馆参数（area=场馆id 或 areaName）

## widget 文档索引（按注册顺序）

| 子目录 | widget（注册名） | 布局 | subscribe |
| --- | --- | --- | --- |
| [001-center/](./001-center/spec.md) | 中心场馆 | 0, 0 | currentArea |
| [002-wireless-scale/](./002-wireless-scale/spec.md) | 无线规模 | 60, 105 | currentArea |
| [003-wireless-quality/](./003-wireless-quality/spec.md) | 网络质量-left | 60, 566 | currentArea |
| [004-line-scale/](./004-line-scale/spec.md) | 专线规模 | 1395, 105 | currentArea |
| [005-network-resource/](./005-network-resource/spec.md) | 网络资源 | 1395, 300 | currentArea |
| [006-line-quality/](./006-line-quality/spec.md) | 网络质量 | 1395, 566 | currentArea |
| [007-support-resource/](./007-support-resource/spec.md) | 保障资源 | 543, 830 | currentArea |
| [008-today-scheduler/](./008-today-scheduler/spec.md) | 今日赛程 | 543, 727 | - |

每个子目录含 `spec.md`（组件构成与交互）+ `data-model.md`（接口与字段结构）。

## 交互总览

- **currentArea 广播**：7 个 widget 订阅 `currentArea`，场馆切换时各面板联动刷新（接口 viewPageArgs 携带新场馆参数重新请求）
- 赛程/场馆点击切视图逻辑见 [../000-overview/README.md](../000-overview/README.md#2-视图结构与切换机制核心)

## 维护准则

- 左右面板卡片复用各模块内 `scale-*-card.tsx` / `quality-*-card.tsx`
- 场馆图片资源放 `staticAssets.stadiumImage` 目录，命名与场馆 name 一致
- 保障资源分组模板可经 `gameMatchConfig.*` 环境配置覆盖
