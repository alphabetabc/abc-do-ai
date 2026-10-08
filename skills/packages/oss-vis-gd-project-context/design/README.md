# design/ · 意图层

文件索引只在 `../SKILL.md` 场景表维护，本 README 只写本目录规则，不重复清单。

## 顶层文件规则

- 每信息只落一个文件；命名 `NNN-<slug>.md`。
- 节奏 / 优先级在 `plans/roadmap.md`，**不**放本目录。
- 禁止另建 `codebase-map.md`（结构写在 `002-architecture.md`）。

## components/ 规则

- `components/<NNN-slug>/README.md` — `web/components/` 可复用组件的用法文档（组件层）。
- 判据：文档描述的对象在 `web/components/` 下、可跨业务模块复用 → 归本目录。

## modules/ 规则

- `modules/<业务模块>/` — `web/pages/` 下业务模块的实现文档（业务层）；模块内子主题按 `NNN-<slug>/` 建子目录（如 `modules/five-major-center/001-map-geo/`）。模块入口为 `<模块>/000-overview/README.md`（如 `modules/five-major-center/000-overview/`）。
- 判据：文档描述的对象在 `web/pages/` 下、属于具体业务模块 → 归本目录。
- 按 03-task-workflow §4.1：模块演进时写入；一次性小改动只写任务卡，不建目录。
