# fujian 分支域

对应 git 分支 `origin/develop-fujian`（自 develop 分叉后独立进化，领先约 126 提交、落后 develop 37 提交）。

**本域自包含（2026-11-20，task-005）**：`design/` 与 `references/` 已重建为 fujian 完整真源（以 develop 域为底本、按 diff 修订漂移项），查 fujian 真相直接读本目录，不必再对照 develop 域。

## 目录

- [design/](./design/) — 意图层（architecture / vision / user-story-map / modules 001~011）
- [references/](./references/) — 真源 5 份（api-catalog / enum / reusable-capabilities / scope-classification-rules / source-truth-map）

## 已知差异摘要

- 新增独立模块 `wireless-person-manager`（福建无线人员管理，函数组件 + ProTable + hox）、`professional-home-page`（福建跨专业工程预约清单）
- new-project 周期预约大改版（index.jsx 现 2735 行、extractFun.js ±398 行、upload 新增 gcss-continuous-time）
- quick-project / resource-search / home-page 中小改
- 路由 15 → 18 条（+3）
- `src/App.js`、`pages/common/export.js`、`new-project-gcss|fgss`、`project-audit/` 与主干完全一致

## 新代码风格参照

fujian 新增代码已采用函数组件 + oss-ui ProTable + hox，cutover-order 实施时可参照 `wireless-person-manager`，而非 new-project 巨型类组件。
