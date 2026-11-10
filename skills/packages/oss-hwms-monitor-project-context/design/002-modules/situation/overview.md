# situation · 业务概览大屏

> 上位文档：`001-overview/001-overview.md`

## 职责

路由 `/situation`。业务概况大屏：左侧 Tab 切换三个子视图，按登录用户 zoneLevel 区分省/地市两级视角。

## 结构

- `scale/`：业务规模（含 `scale-topn/topn-header`，右上角指标配置，消费 `dictionary-config` 族 selectedList/selectedAdd）
- `fault/`：故障子视图
- `quality/`：质量子视图
- `setting/`：设置抽屉（util.js 内接口也走 `situationConfigUrl`）

## 服务层与接口

- `src/common/services/situationService.js`：
  - 视图数据 `view/getViewItemData`（baseUrlType `situationUrl`）
  - 导出 `manager/viewServerFile/exportViewResult`（`situationUrl`，blob）
  - 字典配置 `manager/data-manager/v1/dictionary-config/*`（`situationConfigUrl`）

## 依赖

situation-map / echarts-map（地图，图例位置由 environment.json `legendPosition` 控制）、column-chart / line-chart。

## 已知问题 / 关联设计

- 右上角 dictionary-config 在线上绕回 server-gcss，见 `../environment-config/overview.md` 已知配置事实；变更任务见 plans/done/2026-11/task-2026-11-05-001-api-url-routing.md
