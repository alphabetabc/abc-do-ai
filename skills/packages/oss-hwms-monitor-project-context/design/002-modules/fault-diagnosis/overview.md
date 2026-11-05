# fault-diagnosis · 故障诊断

> 上位文档：`001-overview/001-overview.md`

## 职责

路由 `/fault-diagnosis`（诊断）、`/diagnosis-result`、`/diagnosis-result/diagnosis-result-table`（结果查询）。

## 结构

- 三个 Tab：OLT / ONU / 用户端到端诊断
- 各 Tab 由模块内 `common/interface-config.js`（路径前缀 `cloud-diagnose/diagnose/...`，baseUrlType `AnalysisRuleUrl`）+ fields/columns/image 配置驱动，子组件 fault-diagnosis-view
- diagnosis-result：诊断结果查询与表格页

## 服务层与接口

- 走 `@Common/api` proxy 直连，接口族 `cloud-diagnose/diagnose/*`，baseUrlType `AnalysisRuleUrl`
- 公共字典接口在 `src/common/interface-config.js`（vendor / eqpobjectclass）

## 关联设计

- `AnalysisRuleUrl` 的服务归属调整见 `../environment-config/overview.md` 已知配置事实；变更任务见 plans/task-2026-11-05-001-api-url-routing.md
