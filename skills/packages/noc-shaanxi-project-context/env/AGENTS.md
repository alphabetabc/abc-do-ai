# AGENTS.md

面向 AI 编码代理（Trae / Claude Code / Cursor 等）的项目指南。请在改动代码前阅读本文件。

## 项目概述

oss-noc-shaanxi 是陕西移动 NOC（网络运营中心）大屏项目，基于 midway（Node.js 服务端）+ React 18 + fedx 大屏框架（`@fedx-bff-web/ssr-*` / `fedx-ssr`）构建的 SSR 大屏应用。

- 语言：TypeScript（部分历史文件为 .jsx）
- UI：antd 5（resolutions 固定 5.22.5）、fedx-ui、styled-components、less
- 可视化：echarts / echarts-gl、fedx-gis、three、d3、fedx-3d-renderer
- 服务端：midwayjs 3.x（koa、typeorm、socketio、task、http-proxy）
- 包管理：pnpm（含 workspace，浏览器扩展子包 `remote-browser-control-ext`）

## 常用命令

```bash
pnpm start                 # 本地开发（端口 9902，前端 HMR）
pnpm run start:local-env   # 本地开发（启用本地环境变量）
pnpm run build             # 生产构建（fedx build + build-patch.js）
pnpm run prod              # 模拟生产（多进程 pm2）
pnpm run stop              # 停止 pm2 服务
pnpm run lint              # eslint 检查
pnpm run lint:fix          # eslint 自动修复
```

提交前请运行 `pnpm run lint` 确保无报错。

## 目录结构

```
src/                     # 服务端（midway）
├── config/              # config.default.ts / config.prod.ts
├── controller/          # 路由控制器（api.ts / index.ts）
├── modules/noc/         # NOC 业务模块（controller / dto / service / mappers）
├── service/             # 通用 service
├── socket/              # SocketIO
└── configuration.ts     # 应用入口配置

web/                     # 前端（React + fedx 大屏）
├── common/              # 常量、环境、全局对象
├── components/          # 跨页面通用组件（large-screen / layout / ui 等）
├── hooks/               # 通用 hooks
└── pages/               # 各大屏页面（每页一个目录，render.tsx 为入口）
    ├── management-overview-first/    # 管理总览第一屏（核心模块）
    ├── management-overview-second/   # 管理总览第二屏
    ├── emergency-support/            # 应急保障（陕西故障中心专用分支路径）
    ├── great-tang-all-day-mall/      # 大唐不夜城商圈
    └── ...

public/                  # 静态资源（图片、地图 geojson、字体、mock 数据）
backend-api-docs/        # 后端接口文档（陕西NOC场景接口文档.md）
```

页面约定：`web/pages/<page>/render.tsx` 为渲染入口，`modules/` 下按业务区块拆分子模块，`fields.ts` / `screen.ts` 为数据与屏配置。

## 重要背景

- 本仓库是**陕西移动故障中心专用分支**，仅包含 `/emergency-support` 路径能力。
- 日常开发在 `develop` 分支，完成后 **cherry-pick** 到 `develop-cmcc-fault-center` 分支，且只 cherry-pick emergency-support 相关能力。
- 前缀路由：部分部署使用 `/emergency-support` 前缀（见 `start:prefix` / `build:prefix` 脚本）。

## 文档

- 根目录 `docs/` 是**提交到公司 git 的文档目录**，面向团队共享。
- 本地私有工作文档（设计文档、项目上下文、任务计划等，不进 git）维护在 skill `noc-shaanxi-project-context` 中；如本地存在该 skill，涉及项目演进 / 重构工作时先读取其 `SKILL.md`，使用规则以 skill 内文档为准。
- **隔离规则**：根目录 `docs/` 下的文档**禁止引用** `noc-shaanxi-project-context` 的任何文档（不链接、不包含其内容、不以其为依据），两个目录相互独立维护。

### docs/ 修改审批机制

`docs/` 面向团队，内容改动影响他人，**必须走审批流程，禁止直接修改**：

1. **提案（通过 task 发起）**：AI 代理不直接改动 `docs/`。如认为需要新增 / 修改 / 删除文档，先在私有 skill `noc-shaanxi-project-context` 的 `plans/` 下建立任务文件（如 `task-yyyy-mm-dd-001-docs-xxx.md`），写明：改动动机、目标文件、具体内容草案，并在任务中附"审批记录"小节，状态置为**待审批**，然后交用户审阅。
2. **审批**：由用户（或用户指定的负责人）审阅草案，涉及他人维护的文档需先与文档 owner 确认；用户明确批准后，任务中审批状态更新为**已批准**。
3. **执行**：仅审批通过后才执行改动；改动通过 git 提交留下记录，便于追溯；完成后任务按流程归档到 `plans/done/`，审批记录随之留痕。
4. **例外**：纯笔误修正（错别字、格式）同样需先告知用户，但可简化确认流程。

一句话：**对 `docs/` 的任何写操作，都必须先建 task 提案、经用户审批、再执行，AI 不得自行落笔。**

## 防止幻觉

- **先读代码再改代码**：任何修改前必须阅读相关源码，禁止凭推测或记忆中的"常见写法"直接生成代码。
- **不编造 API / 配置 / 文件路径**：引用项目内的组件、hooks、接口、配置项时，必须确认其真实存在于代码库中；不确定时先用搜索工具验证。
- **不编造依赖能力**：不要假设某个 npm 包提供了某功能，以实际安装版本和源码为准。
- **不虚构后端接口**：接口路径、参数、返回结构以 `backend-api-docs/` 和 `src/` 中的 controller / service 实现为准。
- **不确定就问，不要猜**：需求或实现方式不明确时，先向用户确认，不要自行编造业务规则、数据格式或历史背景。
- **不虚构文档内容**：引用设计文档时必须先读取原文，禁止转述记忆中可能不存在的文档结论。
- **改完后自查**：修改涉及文件名、路径、导出符号时，检查引用处是否全部更新，避免留下死链接和失效引用。

## 代码风格

- 遵循仓库既有 eslint / prettier 配置（`.eslintrc.js` / `.prettierrc.js`），不要自行引入新规则。
- 组件目录约定 `index.tsx` + `index.less`，样式使用 less module 或全局 less。
- 新增依赖需谨慎：本项目存在国产数据库适配的版本固定策略（见 `noc-shaanxi-project-context/design/modules/chinese-database-adapter/`），改动 `package.json` 依赖前先查阅该文档。
