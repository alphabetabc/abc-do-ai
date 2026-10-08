# AGENTS.md（协作侧约束）

本文件是项目级权威约束（目录边界、开发命令、协作事实），对所有会话生效。
项目治理 skill 为 `oss-vis-gd-project-context`（目录名与 frontmatter name 一致）。
接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。

## 分工边界

- `.trae/rules/`：`01-link-format.md`（链接路径格式）、`02-no-hallucination.md`（反幻觉）、`03-task-workflow.md`（需求→实现两阶段工作流）、`04-script-first-rule.md`（批处理任务 Node.js 脚本优先，D-13）。本文件不复述。
- `docs/`：项目交付物树（specs / standards / workflows），对外交付用；不得依赖 project-context skill 内的内容（`env/`、`design/`、`plans/`、`references/`、`scripts/` 等；PM 输入素材在 `docs/specs/<module>/pm-inputs/`，属 docs 自有内容）。

## 目录边界

可观察：`web/`、`public/`、`docs/`、`docs-api-backend/`、`config.ts`、`package.json`、`app.js`、`bootstrap.js`、根配置文件。
不可观察：`node_modules/`、`build/`、`.local-docs/`（docs 模板来源）、`public/static/riky0123-vad-web/`（第三方产物）、密钥类文件。

## 开发命令

- 本地开发：`pnpm start`（fedx start，端口 9032）
- 本地环境切换：`pnpm start:local-env`（ENABLE_LOCAL_ENV）
- 构建：`pnpm build`（fedx build + build-patch.js）
- 检查：`pnpm lint` / `pnpm lint:fix`（eslint，js/ts/tsx）
- 生产：`pnpm prod`（fedx build + pm2）

## 关键协作事实

- 架构与技术栈权威源：skill `oss-vis-gd-project-context` 下的 `design/002-architecture.md`（SSR/BFF 三层、Midway 3、组件库、请求封装、模块边界、关键决策）。此处不复述，改动时只更新该文件。
- 新增业务模块：页面放 `web/pages/<module>/`，接口层放 `web/services/<module>/`，mock 放 `public/static/mock/<module>/`。
- 服务端相关能力开发（Midway/BFF/SSR）：通过 skill `fedx-fullstack-midway-react`。

## 维护节奏

按 phase（spec/plan 阶段）推进；每阶段开始时更新 skill `oss-vis-gd-project-context` 下的 `plans/current-sprint.md`，阶段沉淀进 `plans/roadmap.md`。
