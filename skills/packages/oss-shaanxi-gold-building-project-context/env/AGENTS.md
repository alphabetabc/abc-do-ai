# AGENTS.md · 项目级 AI 工作守则（灵魂宪法）

---

## §0 · 声明（Standing Orders）

- 本文件是仓库根 `AGENTS.md` 的 sub agent，只约束 AI 协作侧行为，不承载仓库级规则。
- 本文件与 `oss-shaanxi-gold-building-project-context` 紧密结合，维护其内部流程。

---

## §1 · 路径与文件引用约定

- 引用格式见 `oss-shaanxi-gold-building-project-context` 的 `env/rules/01-link-format.md`。
- 引用 `docs/` 与仓库根 `AGENTS.md` 时**只读不写**；如需改它们的内容，回到对应权威顺序。

--- 

## §2 · 模块索引

仓库顶层结构（各目录与所属 详细结构见  `oss-shaanxi-gold-building-project-context` 的 `design/codebase-map.md`，按需读）：

```
<project-root>
|-- AGENTS.md   ← 业务文档治理宪法（根 agent，本文件的上级权威）
|-- docs/       ← 业务权威文档树（as-is / design / specs / skills / standards / workflows）
|-- src/        ← Node 中台源码（BFF + modules/goldBuilding 金楼业务）
|-- web/        ← 前端源码（React 大屏：earth 三维地球 / large-screen 框架 / gold-building 页面）
|-- public/     ← 静态资源（Cesium / DRACO / HDRI / 字体 / geojson）
```

---

## §3 · 项目禁止清单（Do-Not）

> 只列 `oss-shaanxi-gold-building-project-context` / AI 协作侧的禁项；仓库级硬门禁见根目录 `AGENTS.md`，不在此重复。

- 禁止读取 / 展示任何 `.env`、API key、token、password、secret、private key。
- 禁止用 `~` 写死 HOME 路径。
- 禁止在 `docs/specs/index.md` 状态单元格写进度日记（仅允许状态枚举：`盘点中 / 草稿 / 评审中 / 实现中 / 已落地`）。
- 禁止在会话内臆造需求或直接编码：动手前必须先在 `docs/specs/index.md` 确认编号 + 目录已登记。
- 禁止把 `oss-shaanxi-gold-building-project-context` 内的文档写入或链接进 `docs/` 及项目其他任何地方（单向引用：只允许 skill 引用项目，不允许反向）。
- 禁止编造依赖版本、API 路径、表名、角色权限；不可知处写「待定」并询问用户。
- 禁止未经会签直接修改 `docs/` 下任何文档：凡要改动根目录 `docs/` 内文件，必须先在 `oss-shaanxi-gold-building-project-context` 的 `plans/` 下发起会签（记录改动点 + 理由 + 影响面），经项目方通过后方可动手；会签未通过时只读不写。

