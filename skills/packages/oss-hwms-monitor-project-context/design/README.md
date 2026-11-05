# design/ · 意图层

每信息只落一个文件。节奏 / 优先级在 `plans/roadmap.md`，**不**放本目录。禁止另建 `codebase-map.md`（结构写在 `architecture.md`）。

| 文件 / 目录 | 写什么 | 不写什么 |
| --- | --- | --- |
| `vision.md` | 定位 / 北极星 / 禁止清单 / 假设 | 技术栈细目、目录树 |
| `architecture.md` | 技术栈 / 包边界 / 仓库结构概要 / 关键决策 | 北极星文案、用户旅程正文 |
| `user-story-map.md` | 角色与主旅程 | 架构禁令、计划索引 |
| `001-overview/001-overview.md` | 项目总体设计：运行形态 / 网络层横切机制 / 页面模块地图 / 模块设计索引 | 单模块细节、计划 |
| `002-modules/<模块>/overview.md` | 单模块设计：职责 / 结构 / 服务层与接口(baseUrlType) / 依赖 / 已知问题；模块内细分文档与 overview.md 同级 | 跨模块机制（归 overview） |

模块设计目录：`situation` / `topo` / `emergency` / `fault-diagnosis` / `rules-management` / `broadband-television`（对应 `src/pages/` 页面模块）与 `environment-config`（配置工件 environment.json 的键清单与部署形态）。新模块设计按 `002-modules/<模块名>/overview.md` 落位，并在 `001-overview` §7 索引登记。横切机制归 `001-overview`；变更任务归 `plans/`。

占位正文统一为「待 init」；有内容才扩写。
