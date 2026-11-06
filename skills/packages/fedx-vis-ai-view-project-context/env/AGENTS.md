# env/AGENTS.md · 项目协作侧约定

本仓项目治理 skill 为 `fedx-vis-ai-view-project-context`（与目录名 / frontmatter name 一致）；接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。

根 `AGENTS.md` 是仓库治理权威（目录结构、物料产物规范、禁止事项），本文件只补协作侧缺口，不复述其内容。

## 目录边界

- 可观察：`src/`、`docs/`、`scripts/`、`index.html`、根配置文件（package.json / tsconfig.json / vite.config.ts / .editorconfig）
- 不可观察：`node_modules/`、`dist/`、`.agents/`、`.screenshots/`、`.local-docs/`、`.trae-html-share-packages/`

## 质量门槛

- 类型检查 + 构建：`pnpm build`（内含 `tsc -b`）
- 本地运行验证：`pnpm dev:preview`

## 数据权威

- 模块清单：`docs/materials/<模块名>/manifest.json`（name / description / tags 必填）
- 仓库无 lint / test 脚本；新增门槛命令时更新本文件，勿写入 rules 正文
