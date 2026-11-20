# design/ · 意图层（develop-fujian 域）

每信息只落一个文件。节奏 / 优先级在 `plans/roadmap.md`，**不**放本目录。禁止另建 `codebase-map.md`（结构写在 `architecture.md`）。

| 文件 | 写什么 | 不写什么 |
| --- | --- | --- |
| `vision.md` | 定位 / 北极星 / 禁止清单 / 假设 | 技术栈细目、目录树 |
| `architecture.md` | 技术栈 / 包边界 / 仓库结构真源 / 路由真源 / 构建链 / 关键决策 | 北极星文案、用户旅程正文、单模块细节 |
| `user-story-map.md` | 角色与主旅程 | 架构禁令、计划索引 |

> 本域自包含（2026-11-20 由 develop 域复制并按 diff 修订，task-005），不再回指 `branches/develop/`。

## modules/ · 页面模块深度调研

按 src/pages 业务模块逐个记录，编号目录 NNN-<module>/overview.md。新增模块续编下一号。每份含六要素真源：路由与入口 / 组件树 / 状态管理 / 接口清单 / 可复用点 / 已知坑。每份头部带「fujian 状态」标注（与 develop 一致 / 漂移程度）。

- 001-home-page — 首页总览（fujian 中改）
- 002-home-executing — 安徽正在执行列表（与 develop 一致）
- 003-new-project — 核心建项页（fujian 大改：周期预约改版）
- 004-quick-project — 安徽快速预约（fujian 中改）
- 005-resource-search — 资源检索（fujian 小改）
- 006-system-options — 系统配置（与 develop 一致）
- 007-demo-debug-pages — 调试残留页（demo/search-demo/test 合并；test 有 diff）
- 008-common-export — xlsx 前端导出工具（与 develop 一致）
- 009-cutover-order — 割接工单模块设计骨架（未实施）
- 010-wireless-person-manager — 福建无线人员管理（fujian 独有）
- 011-professional-home-page — 福建跨专业工程预约清单（fujian 独有）
