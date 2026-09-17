# AGENTS.md · oss-visual-designer 项目协作硬约束

## 1. 项目是什么

基于 React + TypeScript 的可视化大屏设计器，pnpm workspace 单仓。两条演进线：

- 主线 `src/`：React-Redux 单源架构，生产稳定。
- 新一代 `packages-next/`：designer-core（Zustand + 插件内核，完成）+ designer-plugins（7 业务插件，完成）+ designer-next（早期脚手架，演进中）。

主线**未迁移**到新架构；迁移由独立 task 承接，动 src/ 前先与用户对齐。

## 2. 命令与质量门槛

- 包管理器只用 pnpm，禁止 npm/yarn。
- 提交前必跑：`pnpm exec tsc --noEmit`、`pnpm build`、`pnpm test`（vitest）。
- packages-next 子包测试用 `pnpm --filter <pkg> test`。

## 3. 按改动对象加载契约（改代码前必读对应文档）

文档根：skill `oss-visual-designer-project-context` 的 `design/`。文档与代码冲突时以代码为准，在 task 文档中记录差异、完成后同步文档。

- **主线 `src/` 设计器状态**（designerCanvas / byId / useFieldConf 等）→ `design/src/designer-state/`：数据模型 / 读写路径 / 原则 / **已删除 API 对照表 05-deleted-api.md**
- **主线渲染链路 / 画布交互**（DesignerField / 拖拽 / 缩放）→ `design/src/designer-state/` + `design/src/designer-canvas/`（历史重构背景）+ `design/src/topics/DesignerField性能优化文档.md`
- **主线物料 / Schema / 交互系统** → `design/src/topics/`：物料开发上下文 / 物料 Props / 交互系统 / 下钻与派发 / Schema 定义工具 / Hox 模块
- **`packages-next/` 内核**（Zustand store / 插件系统）→ `design/packages-next/designer-core/`：数据模型 / 读写路径 / 插件系统 / 原则
- **架构 / 边界 / 演进方向** → `design/architecture.md`、`design/vision.md`

主线硬约束（详见上述文档，此处仅提示高频踩雷项）：

- byId / parentMap 是纯派生索引，只由 `buildIndex` 重建，禁止直接赋值；禁止绕过主 store 另起 Context / 私有 store 管画布树。
- 禁止重新引入已删除 API（`mergeByIdIntoTree` / `patchFieldConf` / `undo` / `redo` 等），完整清单见 `oss-visual-designer-project-context/design/src/designer-state/05-deleted-api.md`。
- 影响画布渲染的改动需测 440 组件场景；画布组件必须 `React.memo`。
- 路径别名 `@Configs/*` 是死别名禁用；`.bak` 文件是历史快照永久保留，grep 时排除。

## 4. 实施纪律

- 实施前三验证：存在性 / 签名 / 契约，全部用本地 Read / Grep / tsc 当场验证，不靠记忆。
- 未立项想法记 `plans/backlog.md`（skill 内），不混入 roadmap。
- 文档内链接用相对路径，禁 `file:///`。
