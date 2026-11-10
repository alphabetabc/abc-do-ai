# broadband-television · 宽带/电视业务场景

> 上位文档：`001-overview/001-overview.md`

## 概述

两个同构的集客重保业务场景页，均含列表页 + `detail/:id` 详情页：

| 路由 | 模块 | 差异点 | viewItemId 示例 |
| --- | --- | --- | --- |
| `/broadband-service` | `src/pages/broadband-service/` | panel 面板图 + ring 环形图 | `keyassure-broadband-scene` / `olt-equipment-indicator-statistics` |
| `/television-service` | `src/pages/television-service/` | gauge 仪表盘 | `keyassure-tv-scene` / `region-indicator-statistics` |

## 结构

- 列表页：图表组合展示 + 指标列配置抽屉（ColumnsSortDrag）
- detail：场景详情，右上角 dictionary-config 配置（selectedList / selectedAdd）

## 服务层与接口（`src/common/services/broadbandService.js`，两模块共用）

| 方法 | 接口 | baseUrlType |
| --- | --- | --- |
| getViewItemData | `view/getViewItemData` | `broadbandUrl` |
| getConfigData | `manager/data-manager/v1/indicator-config/allList` | `configUrl` |
| getSelectConfigData | `manager/data-manager/v1/indicator-config/selectedList` | `configUrl` |
| addSelectConfigData | `manager/data-manager/v1/indicator-config/selectedAdd` | `configUrl` |
| getChartConfigData | dictionary-config 族（detail 页） | `situationConfigUrl` |

## 关联设计

- indicator-config / dictionary-config 的服务归属（cloud.view.manager）调整见 `../environment-config/overview.md` 已知配置事实；变更任务见 plans/done/2026-11/task-2026-11-05-001-api-url-routing.md
