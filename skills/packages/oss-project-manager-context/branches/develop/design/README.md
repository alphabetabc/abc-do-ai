# design/ · 意图层

每信息只落一个文件。节奏 / 优先级在 `plans/roadmap.md`，**不**放本目录。禁止另建 `codebase-map.md`（结构写在 `architecture.md`）。

| 文件 | 写什么 | 不写什么 |
| --- | --- | --- |
| `vision.md` | 定位 / 北极星 / 禁止清单 / 假设 | 技术栈细目、目录树 |
| `architecture.md` | 技术栈 / 包边界 / 仓库结构真源 / 路由真源 / 构建链 / 关键决策 | 北极星文案、用户旅程正文、单模块细节 |
| `user-story-map.md` | 角色与主旅程 | 架构禁令、计划索引 |

占位正文统一为「待 init」；有内容才扩写。

## modules/ · 页面模块深度调研

按 src/pages 业务模块逐个记录，编号目录 NNN-<module>/overview.md。新增模块续编下一号。每份含六要素真源：路由与入口 / 组件树 / 状态管理 / 接口清单 / 可复用点 / 已知坑。

- oss-project-manager-context/design/modules/001-home-page/overview.md — 首页总览
- oss-project-manager-context/design/modules/002-home-executing/overview.md — 安徽正在执行列表
- oss-project-manager-context/design/modules/003-new-project/overview.md — 核心建项页
- oss-project-manager-context/design/modules/004-quick-project/overview.md — 安徽快速预约
- oss-project-manager-context/design/modules/005-resource-search/overview.md — 资源检索
- oss-project-manager-context/design/modules/006-system-options/overview.md — 系统配置
- oss-project-manager-context/design/modules/007-demo-debug-pages/overview.md — 调试残留页（demo/search-demo/test 合并）
- oss-project-manager-context/design/modules/008-common-export/overview.md — xlsx 前端导出工具
