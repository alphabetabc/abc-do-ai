# architecture.md

## 技术栈

- 语言：JavaScript 为主（Babel/react-app preset），少量 TypeScript 配置残留。
- 框架：React 17 + react-router-dom v5。
- UI：oss-ui（antd 系，含主题插件 oss-ui-theme-webpack-plugin）。
- 状态：hox（src/hox 全局 model）。
- 图表：bizcharts；拖拽：react-dnd-cjs；页面保活：react-activation。
- 样式：less；国际化：react-intl-universal（public/static/locales）。
- 时间：dayjs。
- 构建：CRA 式自托管 webpack 4 配置（config/webpack.config.js，scripts/start.js|build.js|test.js 入口）。
- 测试：jest + @testing-library（当前 src 下无 __tests__ 用例）。

## 仓库结构概要

- src/index.js：应用入口。判断 `window.__INJECT_BY_SINGLE_SPA__` 决定独立渲染或微前端接入。
- src/App.js：Layout 壳、全局状态初始化（onGlobalStateChange 接收主应用注入的用户/系统信息）、主题切换。
- src/routes/index.js：路由表。component 为字符串，经 oss-web-common 的 router.buildRoutes 映射到 src/pages/ 下同名目录。
- src/pages/：业务页面，按域划分：performance-indicator-*（指标管理/分组）、performance-query*（单机/区域/批量/类型查询）、performance-rules、threshold-setting、data-verifying、performance-report-*（报表模板/样例）、performance-over-monitor、performance-trend、performance-data。
- src/components/：跨页面复用组件（条件筛选 condition 系列、query-chart/query-table、threshold-chart-line 等）。
- src/common/：api（请求封装 + service）、services（kpiMonitorService、dataCenterApi）、configs、constants、enum、utils、global-message。
- src/hox/：全局状态 model（登录信息、环境信息、页面信息）。
- src/share/actions.js：微前端主子应用间 postMessage 通信。
- src/styles/：全局样式（App.less）。
- config/：webpack / jest / env / paths 等构建配置。
- public/static/：iconfont、images、locales 静态资源。
- 路径别名 @Src → src（webpack 配置）。

## 关键决策

- CRA 自托管构建：不使用 react-scripts，构建链集中在 config/，禁止随手改动。
- 路由字符串映射：routes/index.js 中 component 字符串对应 pages 目录路径，新增页面必须两处同步（建目录 + 注册路由）。
- 双运行模式：独立渲染与 single-spa 微前端接入共用入口，微前端下走 MICRO_APP_URL 公共路径。
- 状态管理用 hox 而非 redux：轻量 model，新增全局状态放 src/hox。
- 跨应用通信统一走 src/share/actions.js 的 postMessage 封装。
- 历史包袱：package.json jest.testRunner 指向原开发者本机绝对路径（/Users/lizixin/...），当前环境跑 test 会失败；如需修复属独立任务。
