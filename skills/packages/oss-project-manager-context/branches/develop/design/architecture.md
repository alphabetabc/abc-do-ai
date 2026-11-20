# architecture.md

> 本文件是仓库结构真源（目录树、路由、构建链、依赖、状态管理分布）。页面级细节在 design/modules/，横切清单在 references/。

## 技术栈

- React 16.13，类组件为主，JS 与 TS 混用。
- 状态管理三套并存：redux + redux-saga（含 redux-actions/thunk）、hox、unstated-next。沿用现状，按就近文件现有方案选用，不新增方案。
- **实际使用情况（2026-11-19 全仓 grep 核查）**：只有 hox 被实际使用（src/hox/index.js、src/hox/projectUserInfo.js、src/App.js）；redux 系与 unstated-next 仅是 package.json 依赖声明，代码中无 createStore/createSagaMiddleware/connect 调用。新代码默认用 hox 或组件内 state。
- 样式 less；UI 用内部 oss-ui（antd 定制，含 oss-ui-theme-webpack-plugin）；工具库 oss-web-toolkits、lodash、moment/dayjs、xlsx（导出）。
- 国际化 react-intl-universal + oss-web-common LocaleProvider。
- 图编辑 gg-editor；拖拽 react-dnd / react-beautiful-dnd。

## qiankun 集成

- 入口 src/index.js：检测 `window.__INJECT_BY_SINGLE_SPA__`。主应用内嵌时用 MemoryRouter 并经 src/share/actions.js 桥接全局状态（用户、地区、角色由主应用注入）；独立运行时用 BrowserRouter，BASENAME `/project`。
- 路由渲染封装在 src/routes/base.js（mapRoutes，Suspense + 懒加载），路由表入口 src/routes/index.js。

## 仓库结构概要

```text
src/
  pages/        业务页面（10 个目录）
  common/       api、services、enum、utils、timer、global-message、locales
  components/   error-boundary、exception、locale-provider、page-container、treasury-auth-flow-anhui、user-drag
  routes/       路由表与渲染封装
  share/        微前端全局状态桥
  hox/          hox 共享状态
  mock/         mock 数据
  styles/       全局样式
config/         CRA eject 后 webpack/jest 配置
scripts/        start.js / build.js / test.js
sql/            后端 MyBatis XML（只读参考，勿改）
public/         静态资源
```

## 页面模块边界

（模块内部结构详见 design/modules/001~008，此处只列边界。）

- home-page：工程预约总览（查询、统计、日历、时间轴、告警、导出）。
- home-executing：home-page 复用，固定过滤「正在执行」（安徽版本）。
- new-project：核心建项页，多条件查询 + 新建（通用与十余专题模板：达泛、FGSS、GCSS、精细、IP、链路、端口、SPC 等）+ 编辑 + 重预约 + 影响分析 + 审批 + 导入导出。
- quick-project：安徽快速预约，new-project 简化版。
- resource-search：工程资源多级条件检索与汇总勾选。
- system-options：系统配置表管理（含工程状态枚举等）。
- demo / search-demo / test：开发调试残留，无实际业务。
- pages/common/export.js：基于 xlsx 的表格导出工具。

## 路由真源

路由表：src/routes/index.js（component 为字符串，经 oss-web-common router.buildRoutes 映射到 src/pages 下同名目录），渲染封装：src/routes/base.js。共 15 条路由（独立运行时均挂 `/project` 前缀下）：

| path | 组件（src/pages 下路径） |
| --- | --- |
| / | test |
| /test | test |
| /home-page | home-page |
| /home-page/home-page-edit | home-page/home-page-edit |
| /home-page/home-page-period | home-page/home-page-period |
| /new-project | new-project |
| /new-project/show-new-project | new-project/control/show-new-project |
| /new-project/control/project-info-demo | new-project/control/project-info-demo |
| /quick-project | quick-project |
| /quick-project/show-new-project | quick-project/control/show-new-project |
| /home-executing | home-executing |
| /resource-search | resource-search |
| /system-options | system-options |
| /search-demo | search-demo |

## 构建链

- CRA 3.4.3 eject 后自管：webpack 配置在 config/webpack.config.js，dev server 在 webpackDevServer.config.js，启动脚本 scripts/*.js（start 需 `--max-old-space-size=3072`）。
- webpack 路径别名（config/webpack.config.js L310）：`@Src` → src/、`@Pages` → src/pages/、`@Common` → src/common/。
- 运行时配置：config/env.js 按 REACT_APP_ENV 串接 config/env/*.{js,json}；前端运行配置（接口地址等）由 environment.json 注入（src/hox/index.js useEnvironmentModel）。
- 依赖锁 yarn（yarn.lock）。依赖精确版本以 package.json 为准（关键项：React 16.13、qiankun、oss-ui、oss-web-toolkits、xlsx、hox；未逐项摘录，需要时直接读 package.json）。

## 关键决策

- 不做 eject 回退或迁移到新版 CRA/Vite：保持构建链稳定。
- demo/test/search-demo 页保留不动，仅不再扩展。
- 状态管理不收敛：改动成本高于收益，按文件就近沿用。
