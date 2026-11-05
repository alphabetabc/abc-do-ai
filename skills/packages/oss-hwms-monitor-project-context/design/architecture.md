# architecture

## 技术栈

- 框架：React 17 + JavaScript 为主（辅以 TypeScript 类型文件），react-router-dom v5
- 构建：webpack 4，react-app 脚手架魔改（`config/`、`scripts/` 独立保留，Node 内存 5G）
- 状态：hox（`src/hox/` 全局模型）+ ahooks
- UI / 基础库：`oss-ui`、`oss-web-common`（路由构建、ErrorBoundary、LocaleProvider）、`oss-alarm-window`、`oss-topo`、`oss-chart`
- 图表：bizcharts + echarts 5
- 样式：less，`config/antd-theme.js` 定制主题
- 国际化：react-intl-universal
- 测试：jest + testing-library，用例在 `src/__test__/`
- 通信：xlsx 导出、react-fast-marquee、react-activation（路由缓存 AliveScope）

## 仓库结构概要

- `src/index.js`：入口，BrowserRouter / MemoryRouter 双模式
- `src/App.js`：应用壳，接收宿主全局状态（登录信息、主题切换、路由跳转）
- `src/routes/index.js`：路由表（集中注册，页面按 component 字符串映射）
- `src/pages/`：页面模块（situation 态势、topo / alarm-topo 拓扑、emergency 应急、fault-diagnosis 诊断、fault / analysis / falut-rules-management 规则管理、broadband-service 家宽、television-service 电视、home、test）
- `src/components/`：通用组件（图表、告警窗口、搜索条件、地图、上传等）
- `src/common/`：api（接口入口）、services（数据服务）、constants / enum / utils / timer / global-message / export
- `src/hox/`：全局状态模型（登录信息、环境配置、页面信息）
- `src/share/actions.js`：与宿主应用的 postMessage 通信
- `config/`、`scripts/`：webpack 与启停脚本，勿改
- `public/environment.json`：运行时环境配置（后端地址、省份、地图配置）

## 关键决策

- 微前端子应用：不经独立 qiankun 包，直接在 `App.js` 消费宿主注入的 props（`onGlobalStateChange`、curRoute 等）；跨应用事件走 `src/share/actions` 的 postMessage
- 运行时配置：后端地址、服务发现地址集中在 `public/environment.json`，不进入构建产物硬编码；本地调试用 `src/setupProxy.js` 代理 `/serviceDiscovery`
- 路由集中注册：新页面必须在 `src/routes/index.js` 登记，由 `oss-web-common` 的 `router.buildRoutes` 构建
- 路径别名：`@Src` 指向 `src/`
- 依赖以内部源为主，版本升级需评估 `oss-*` 系列联动
