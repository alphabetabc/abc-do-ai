# rules-management · 规则管理三模块族

> 上位文档：`001-overview/001-overview.md`

## 概述

三个同构的规则管理模块，均为"列表 CRUD + 批量导入（UploadModal）+ rule-setting 新增/编辑子页"结构：

| 路由 | 模块目录 | viewName | 接口前缀 | baseUrlType |
| --- | --- | --- | --- | --- |
| `/fault-rules-management` | `src/pages/fault-rules-management/` | 故障诊断管理 | `cloud-diagnose/circuitinterrupttitle/diagnose/*` | `AnalysisRuleUrl` |
| `/analysis-rules-management` | `src/pages/analysis-rules-management/` | 故障分析管理 | `cloud-diagnose/circuitinterrupttitle/*` | `AnalysisRuleUrl` |
| `/falut-rules-management` | `src/pages/falutRules-management/`（目录名拼写如此） | 预处理任务管理 | `scripts/uploadScript` 等 | `preProcessingManagementUrl` |

## 结构（以 analysis-rules-management 为例，11 个接口）

moduleTypes / vendors / eqpObjectClass（字典）、save / info / update / delete（CRUD）、list（分页查询）、export（blob）/ import（multipart）。

## 共享

- 公共字典接口复用 `src/common/interface-config.js`（vendor / eqpobjectclass，`AnalysisRuleUrl`）
- 通用组件：upload-modal、row-delete、custom-modal-footer

## 已知问题 / 长期项

- 三个模块代码高度同构，存在合并抽象空间（三次相似再抽象，暂不动）
- `falutRules-management` 目录名拼写错误（falut），重命名需同步路由注册，风险大于收益，暂保留

## 关联设计

- `AnalysisRuleUrl` 服务归属（cloud-diagnose）调整见 `../environment-config/overview.md` 已知配置事实；变更任务见 plans/task-2026-11-05-001-api-url-routing.md
