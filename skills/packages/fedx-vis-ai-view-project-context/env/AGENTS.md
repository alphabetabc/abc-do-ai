# env/AGENTS.md · 项目协作侧约定

本仓项目治理 skill 为 `fedx-vis-ai-view-project-context`（与目录名 / frontmatter name 一致）；接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。

根 `AGENTS.md` 是仓库治理权威（目录结构、物料产物规范、禁止事项），本文件只补协作侧缺口，不复述其内容。

## 目录边界

- 可观察：`src/`、`docs/`、`scripts/`、`apps/`、`index.html`、根配置文件（package.json / tsconfig.json / vite.config.ts / .editorconfig）
- 不可观察：`node_modules/`、`dist/`、`.agents/`、`.screenshots/`、`.local-docs/`、`.trae-html-share-packages/`

## 质量门槛

- 类型检查 + 构建：`pnpm build`（内含 `tsc -b`）
- 本地运行验证：`pnpm dev:preview`
- 渲染器包构建（IIFE + d.ts）：`pnpm build:renderer`
- 渲染器包隔离检查（禁 import 骨架代码）：`pnpm check:renderer-isolation`
- 物料契约检查（manifest runtime.type ↔ playground registry）：`pnpm check:material-registry`
- 骨架镜像校验（docs/skeleton 与 apps/playground 共有工程壳逐字节一致，防止只改一边）：`pnpm check:skeleton-mirror`——骨架运行时正确性由 playground 验证 + 同构保证，skeleton 不单独装依赖验证（改两侧共有文件时须同步改，跑本校验兜底）
- playground（研发验证回路，apps/playground，骨架的镜像：核心工程壳与 docs/skeleton 同构，仅多演示物料 + schema + mock）：`pnpm install` 后 `pnpm build` / `pnpm dev`；`pnpm check:materials` / `pnpm check:discipline` 在 playground 目录内执行
- 渲染器产物同步：根 `pnpm build:renderer` 构建后自动同步 packages/screen-renderer/dist 到 skeleton + playground 两处 vendors；两 app 的 `pnpm dev` 启动时 vite 插件也会拉最新产物（改 renderer 后无需手动拷贝）
- 收料导入（宿主项目产料 zip → 物料站，逆向提炼管道）：`pnpm import:material <material-xxx.zip> --group components/ui|components/rc-echarts|business`；自动跑 build / check:material-registry / playground build 三门槛，失败默认回滚；schemaable 物料须先在 playground registry 注册演示组件；外部 AI 产物必须人工 review 合入（不合入不合版）

## 工作流文档路径基准（勿写入 docs/workflows/）

- `docs/workflows/` 下的大屏组装工作流（big-screen-assembly.md / screen-inventory-template.md）按**导出产物视角**书写路径：`specs/<模块>/`、`SKILL.md`、`module-index.md` 指 `node scripts/export-skill.mjs` 生成的 `dist-skill/large-screen-builder/` 内的产物结构
- 在本仓库内执行该工作流时按此换算：`specs/<模块>/` → `docs/materials/<分组>/<模块>/`（分组：components/ui、components/rc-echarts、business）；`SKILL.md` / `module-index.md` 仅存在于导出产物
- 「蒸馏工作流」指本 skill 的 `references/distill-workflow.md`，不在仓库 docs/ 内
- workflow 文档会被 export-skill.mjs 原样拷入导出产物，**禁止**在 docs/workflows/ 内写仓库内部路径映射或任何仓库私有说明

## 数据权威

- 模块清单：`docs/materials/<模块名>/manifest.json`（name / description / tags 必填）
- 仓库无 lint / test 脚本；新增门槛命令时更新本文件，勿写入 rules 正文
