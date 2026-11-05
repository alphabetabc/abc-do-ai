# vision

## 定位

OSS 集中故障·家客监控前端。以微前端子应用形态嵌入宿主平台，面向家客（宽带、电视）网络的故障集中监控场景，覆盖态势总览、告警拓扑、故障诊断、规则管理与业务跟踪。

## 北极星

让家客故障从发现到定位诊断的闭环耗时持续下降。运维人员在本应用内一屏完成监控、定位、诊断闭环，不依赖外部工具跳转。

## 禁止清单

- 不改 `config/`、`scripts/` 脚手架
- 不升级 webpack / react 大版本
- 不引入新 UI 库，组件统一用 `oss-ui` 系内部库
- 环境地址不写死在代码中，统一走 `public/environment.json`

## 假设

- 运行于微前端宿主平台，登录态与全局状态由宿主下发（`src/App.js` 的 `onGlobalStateChange`、`src/share/actions` 通信）
- 内部 npm 源与 `oss-ui` / `oss-web-common` 等内部组件库可用
- 后端地址按环境经服务发现或 `public/environment.json` 运行时注入
