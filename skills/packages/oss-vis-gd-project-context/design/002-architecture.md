# 002-architecture.md

## 架构形态

BFF + SSR + 前端三层同构，单仓单部署单元，服务端口 9032（`config.ts` 的 `fePort`）。

- 服务进程：Midway 3（`app.js` + `bootstrap.js` + pm2），koa-static-cache 托管 `./build`、`./build/client`、`./public`。
- SSR 渲染：`@fedx-bff-web/ssr-core` + `@fedx-bff-web/plugin-ssr-midway` / `plugin-ssr-react`，由 fedx-ssr 编译加载 `web/` 下视图代码。
- `config.ts` 默认 `mode: 'csr'`；`USE_PREFIX` 环境变量同时设置 prefix 与 publicPath（如 `/noc-shaanxi`）。
- 实时通道：`@midwayjs/socketio`（服务端）+ socket.io-client（浏览器），Socket 组件在 `web/components/socket/`。

## 技术栈

- React 18 + TypeScript + antd 5（`@ant-design/pro-components`）+ styled-components
- 状态：valtio（resolutions 锁 1.11.2）；`web/store/index.ts` 目前为空壳
- 图表/地图/3D：echarts 5 + echarts-gl、`@fedx-vis/react-echarts`、fedx-gis、fedx-3d-renderer、d3
- 大屏：`@fedx-vis/react-large-screen`，配置驱动（`public/screen-config.json`）
- 请求：`@fedx-web-common/utils` 的 baseCreate + axios（`@midwayjs/axios`），路由 react-router-dom 5
- 构建/工具链：fedx-ssr CLI（start/build）、eslint（`@FlyFeDX/lint-config`）、prettier、pm2、pnpm

## 仓库结构概要

```text
web/
  pages/        页面模块（8 个）
  components/   视图基础设施（large-screen / layout / socket / ui / initializer / data-scheme）
  services/     接口层（按模块分目录）+ request/（请求封装）
  hooks/ store/ utils/ common/ environment/ types/
public/
  static/mock/  按模块组织的 mock JSON
  map/          geojson（广东省市区）+ 镇级 townJson + map-config.json
  screen-config.json  大屏配置
docs-api-backend/  后端接口说明（摄像头、右屏网络情况）
config.ts  fedx-ssr 用户配置
app.js / bootstrap.js  Midway 服务入口
```

## 模块边界

页面模块（`web/pages/`）与接口层（`web/services/<module>/`）一一对应：

- `gd-emergency-support`：应急保障主屏（services 含 left / center / right / header）
- `five-major-center`：五大中心
- `info-management-bureau`：信息管理局（home / open-and-close / game-match 等）
- `comprehensive-display-center`、`information-hub-center`：仅 services 层存在
- `gis-entry` / `gis-entry-guangdong-sdk`：GIS 入口
- `large-screen-demo` / `index` / `test`：演示与测试页

接口层按屏幕区域拆分（section-left / section-center / section-right），公共请求封装在 `web/services/request/`（request / getViewItemData / getStaticApi）。

## 关键决策

- 请求 URL 由 `baseUrlType` 经 `web/common/environment` 的服务发现配置解析（direct / discover 两种模式）；非生产环境可用 `localMockUrl` 切换到本地静态 mock。
- **服务地址选择（公用能力）**：`baseUrlType` 是 `public/environment.json` 中的服务 key，链路为：业务 service 定义常量（如 `const baseUrlType = 'sceneViewService'`）→ `web/services/request/getViewItemData.ts` 的 `getViewItemDataApi`（未传时默认 `sceneViewService`）→ `web/services/request/instance.ts` 的 `getRequestUrl` 按 `mode` 取 `direct`（直连地址）或 `discover`（服务发现地址）拼 baseUrl。在用服务：`sceneViewService`（视图服务 `view/getViewItemData`，大屏数据主通道）、`cameraService`（摄像头）、`verifyService`（token 校验，结构不同）。新模块取数一律走 `getViewItemDataApi`，禁止绕过 `web/services/request/` 裸 fetch（见 001-vision 硬约束）。
- mock 数据放 `public/static/mock/<module>/`，接口失败时可走 `web/services/info-management-bureau/loadFallbackData.ts` 类降级。
- 地图底图与行政边界数据全部内置于 `public/map/`（省市区 geojson + 镇级 townJson），不依赖运行时外部地图服务拉取边界。
