# AGENTS.md

## 定位与技术栈

oss-pmmp 是 OSS 网元性能管理（Performance Management）前端子应用。React 17 + JS 为主，oss-ui（antd 系）组件库，hox 状态管理，react-router-dom v5，less 样式，bizcharts 图表，react-intl-universal 国际化。支持独立运行与 single-spa 微前端接入两种模式。

构建为 CRA 式自托管：`config/webpack.config.js` + `scripts/start.js|build.js|test.js`。

## 常用命令

- `yarn start`：本地开发，http://localhost:3000
- `yarn build`：生产构建，产物在 build/
- `yarn test`：jest（当前 src 下无 __tests__ 用例）

## 可观察边界

可读引用：src/、config/、scripts/、public/、根配置文件（package.json、tsconfig.json、.prettierrc）。

不可观察：.env.development、.env.production（安全约束禁读）；build/ 等构建产物。

## 目录速览

- src/routes/index.js：全部路由注册（字符串映射到 src/pages/ 下同名目录）
- src/pages/：业务页面，按性能管理域划分（指标、查询、规则、阈值、校验、报表、监控、趋势）
- src/components/：跨页面复用组件（条件筛选、图表、表格等）
- src/common/：api、services、utils、configs、constants、enum
- src/hox/：全局状态 model
- src/share/actions.js：微前端主子应用通信
- src/styles/：全局样式

## 协作硬约束

- 改动最小化：只改任务要求的部分，不顺手重构。
- 不引入新框架、新状态管理、新 UI 库；沿用 oss-ui + hox。
- 不动 config/webpack.config.js 等构建链，除非任务明确要求。
- 不主动升级大版本依赖。
- 新增页面：在 src/pages/ 建目录，并在 src/routes/index.js 注册路由。

## 维护责任

原负责人已离职，项目由当前维护者接手。历史决策查 git log，勿臆测。

## 自报指针

本仓项目治理 skill 为 oss-pmmp-project-context。接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。
