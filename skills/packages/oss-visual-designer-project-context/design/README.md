# design/ · 意图层

每信息只落一个文件。节奏 / 优先级在 `plans/roadmap.md`，不放本目录。禁止另建 `codebase-map.md`（结构写在 `architecture.md`）。

**按管理对象分组**：`src/` 管主线源码（src/），`packages-next/` 管新架构（packages-next/），互不混放。

| 文件 / 目录 | 写什么 |
| --- | --- |
| `vision.md` | 定位 / 北极星 / 禁止清单 / 假设 |
| `architecture.md` | 技术栈 / 包边界 / 仓库结构概要 / 关键决策 |
| `user-story-map.md` | 角色与主旅程 |
| `src/designer-state/`（8 份） | **主线 src/ 画布状态契约（权威）**：数据模型 / 读写路径 / 原则 / 已删除 API |
| `src/designer-canvas/` | 主线历史重构过程文档（designer-state 前身，保留作回溯） |
| `src/topics/` | 主线专题文档（架构性能 / 物料开发 / 交互系统，含项目架构说明书），索引见 `oss-visual-designer-project-context/design/src/topics/README.md` |
| `packages-next/designer-core/`（6 份） | **packages-next/designer-core 内核契约**：数据模型 / 读写路径 / 插件系统 |

修改主线状态前必读 `src/designer-state/`；修改内核 / 写新插件前必读 `packages-next/designer-core/`。
