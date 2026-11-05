# AGENTS.md

本仓为 OSS 集中故障·家客监控前端（微前端子应用）。本仓项目治理 skill 为 `oss-hwms-monitor-project-context`；接手会话时先读 `oss-hwms-monitor-project-context/SKILL.md`，再按其 Pointer Map 加载 design / plans 等上下文（本文件即入口，不再循环加载）。

## 命令

- 本地开发：`yarn start`
- 构建：`yarn build`
- 测试：`yarn test`

均经 `scripts/` 脚手架执行（Node 内存 5G）。

## 目录边界

- 可观察：`src/`、`config/`、`scripts/`、`public/`、`.trae/skills/`
- 不可观察：`node_modules`、`.git`、`.vscode`、`yarn.lock`、`.env*`

仓库结构概要见 `oss-hwms-monitor-project-context/design/architecture.md`，此处不重复目录树。

## 硬约束

- 不改 `config/`、`scripts/` 脚手架
- 不升级 webpack / react 大版本
- 不引入新 UI 库，组件统一用 `oss-ui` 系内部库
- 环境地址不写死在代码中，统一走 `public/environment.json`

## 代码约定

- 新页面放 `src/pages/`，并在 `src/routes/index.js` 注册路由
- 通用组件放 `src/components/`
- 接口层走 `src/common/api` 与 `src/common/services`
- 全局状态用 `src/hox/` 模型
- 路径别名 `@Src` 指向 `src/`

## 维护

- 仓主维护；文档变更走 SKILL 版本号
- 节奏：sprint（见 `oss-hwms-monitor-project-context/plans/current-sprint.md` 与 `plans/roadmap.md`）
