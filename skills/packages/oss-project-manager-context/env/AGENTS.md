# AGENTS.md

## 项目定位

电信 OSS 工程预约管理前端子应用。qiankun 微前端子应用，独立运行路由前缀 `/project`。提供工程预约创建、审批、执行监控、资源检索与系统配置能力。

## 硬约束

- 不新增状态管理库。现有 redux/saga、hox、unstated-next 并存，按就近文件现有方案选用。
- 不升级 React 16、react-scripts 等大版本依赖。
- 不修改 sql/ 下 XML（由后端维护，前端只读参考）。
- 不读取、不要求提交 .env\* 文件。
- webpack 配置为 CRA eject 后自管，位于 config/ 与 scripts/，改动需谨慎验证构建。

## 常用命令

- 开发：`yarn start`（经 scripts/start.js，端口 3000）
- 构建：`yarn build`（经 scripts/build.js）
- 测试：`yarn test`（jest，testMatch 见 package.json）

## 目录边界

- 可观察：src/、config/、scripts/、sql/（只读）、public/
- 不可观察：.env、.env.development、.env.production

## 代码约定

- React 16，类组件为主，JS 与 TS 混用；样式用 less。
- UI 组件用内部 oss-ui（antd 定制版），工具库 oss-web-toolkits、lodash。
- 业务页面在 src/pages/，公共逻辑在 src/common/（api/services/enum/utils），路由在 src/routes/。

## 治理入口

本仓项目治理 skill 为 oss-project-manager-context（多分支治理：按分支加载对应的 design/ 与 plans/ 上下文）。接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。
