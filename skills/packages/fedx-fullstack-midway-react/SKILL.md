---
name: "fedx-fullstack-midway-react"
description: "fedx 全栈框架（ssr-fc/ssr + midway + cool-admin 风格 BFF + React SSR）的开发知识库。当在 fedx-ssr / @fedx-bff-* / @fedx-bff-web/* 项目中新增页面、接口、Service、SQL mapper 或排查构建问题时调用。"
---

# fedx-fullstack-midway-react 开发指南（通用）

本 skill 描述 fedx 全栈技术栈的通用开发范式（React SSR 前端 + midway 服务端 BFF）。

> fedx 系列框架（`fedx-ssr` / `@fedx-bff-*` / `@fedx-bff-web/*`）是内部魔改版本，与公开版本存在差异，**API 以 `node_modules/@fedx-bff*/**/*.d.ts` 和项目内实际源码为唯一依据**，不要按公开文档推断。
>
> 使用前先确认目标项目的依赖版本，不同项目版本可能有差异。以下为本 skill 撰写时参考项目**实际安装（lock 解析）**的版本基线（2026-09）：
>
> | 依赖 | 版本 | 说明 |
> | --- | --- | --- |
> | `@fedx-bff/core` | 0.2.3 | BFF 增强层（BaseController / BaseService / myBatis） |
> | `@fedx-bff-web/ssr-core` | 0.5.5 | render() SSR 渲染 |
> | `@fedx-bff-web/ssr-utils` | 0.5.5 | initialSSRDevProxy / getCwd / store context |
> | `@fedx-bff-web/ssr-types` | 0.5.3 | ReactMidwayFetch / UserConfig 类型（devDependencies） |
> | `@fedx-bff-web/plugin-ssr-midway` | 0.5.5 | midway 服务端插件（devDependencies） |
> | `@fedx-bff-web/plugin-ssr-react` | 0.5.11 | React 客户端插件（devDependencies） |
> | `fedx-ssr` | 0.5.0 | CLI（fedx start / build，devDependencies） |
> | `@midwayjs/koa` / `@midwayjs/typeorm` / `@midwayjs/validate` | 3.13.4 | midway 3.x 组件 |
> | `@midwayjs/decorator` | 3.13.0 | IoC 装饰器 |
> | `@midwayjs/socketio` | 3.13.4 | socketio 组件 |
> | `@midwayjs/logger` | 3.1.2 | 日志 |
> | `typeorm` | 0.3.17 | ORM |
> | `react` / `react-dom` | 18.3.1 | React |
> | `react-router-dom` | 5.2.0 | **v5**（`useRouteMatch` / `Switch` 等 v5 API） |
> | `@fedx-web-common/react-hooks` | 0.0.4 | **ahooks 3.x 全量再导出**（`export * from 'ahooks'`，含 useRequest / useLatest / useSetState 等） |
> | `@fedx-web-common/utils` | 0.0.5 | 通用工具 |
>
> 注意 `plugin-ssr-react` 实际安装 0.5.11，与同族 ssr 包（0.5.5）不同步。常见精确锁定项（改动需谨慎）：`antd 5.22.5`（resolutions）、`oracledb 5.5.0`、`socket.io-client 4.7.2`、`valtio 1.11.2`。项目可能因国产数据库适配等存在版本固定策略，改 `package.json` 前先确认。

---

## 1. 架构分层

```
midway 3.x 标准能力（底座，全量可用）
  ├── IoC / 装饰器（@Configuration / @Provide / @Inject）
  ├── 组件：koa / typeorm / validate / socketio / task / axios / upload / http-proxy
  └── 原生写法：repository、HttpService、@Task 等照常使用
        +
@fedx-bff/core（BFF 增强层）
  ├── BaseController / BaseService（curd、分页、this.success 统一返回）
  ├── MyBatis XML mapper（myBatisQuery + mappers/*.xml 自动扫描）
  ├── nativeQuery / entityQuery
  ├── 模块化：modules/<name>/config.ts + 自动扫描注册
  └── 事务 @FedxBffTransaction / 缓存 @Cache / 事件 @Event
        +
@fedx-bff-web/*（SSR 框架层）
  └── 约定式路由 render.tsx / fetch.ts、render() 流式渲染、CSR 降级
```

三种 service 写法（fedx 封装 / midway 原生）可在同一项目共存；controller 层建议保持 `this.success()` 统一返回结构。

## 2. 工程结构与命令

```
├── config.ts                   # SSR 用户配置（mode / fePort / serverPort / define）
├── bootstrap.js                # 常规启动入口（pm2 script 指向）
├── app.js                      # serverless 部署入口（导出 koa app）
├── src/                        # 服务端（midway）
│   ├── config/                 # config.default.ts / config.prod.ts
│   ├── configuration.ts        # @Configuration 入口
│   ├── controller/             # 页面路由（SSR render）+ api 路由
│   ├── modules/<biz>/          # 业务模块：config.ts / controller / dto / service / mappers
│   ├── service/                # 通用 service
│   └── socket/                 # @WSController SocketIO
├── web/                        # 前端（React + SSR）
│   ├── common/ components/ hooks/ services/
│   │   （components/layout/ 为框架约定布局目录，不可改名，见 guides/frontend.md 2.5）
│   └── pages/<page>/           # render.tsx / fetch.ts / components/
├── public/                     # 静态资源
└── package.json                # fedx CLI 脚本
```

```bash
fedx start --port 9902            # 本地开发（前端 HMR + midway 服务）
fedx build                        # 生产构建
pnpm run lint / lint:fix          # eslint
pm2 start pm2.config.js           # 生产部署（有 WebSocket 时 instances 必须 1）
```

网关子路径部署：各项目通常自行定制前缀注入方式（环境变量），以目标项目 scripts 为准。

---

## 3. 文档索引

各包 API 用法（`references/`）：

- `references/fedx-bff-core.md` —— BaseController / BaseService / curd 自动接口 / MyBatis mapper / 装饰器
- `references/ssr-core.md` —— render() 页面渲染
- `references/ssr-utils.md` —— initialSSRDevProxy / getCwd 等服务端工具
- `references/ssr-types.md` —— fetch.ts 签名 / UserConfig 配置项
- `references/fedx-ssr-cli.md` —— fedx start / build 与 SSR 插件

维护指南（`guides/`，怎么改代码）：

- `guides/backend.md` —— 服务端维护：模块机制、接口链路、SQL 规范、配置、事务、排错
- `guides/frontend.md` —— 前端维护：两层路由机制、SSR 预取、取数、公共资产、排错
- `guides/ops.md` —— 运维部署：构建产物、pm2 多进程、网关子路径、日志、线上排障、发布自查
- `guides/chinese-db.md` —— 国产化服务端：达梦 / OceanBase / GaussDB / KingBase / GBase 适配与依赖固定策略

可复用示例（`examples/`）：

- `examples/add-api.md` —— 新增接口全链路（module → dto → mapper → service → controller → 前端调用）
- `examples/add-page.md` —— 新增普通前端页面（约定式路由 / fetch.ts SSR 预取 / 子组件）
- `examples/websocket.md` —— socketio 实时推送
- `examples/store-state.md` —— SSR 数据注入与跨组件 store（state / dispatch）

---

## 4. 快速路径

- 新增页面 → `guides/frontend.md` + `examples/add-page.md`
- 新增接口 → `guides/backend.md` + `examples/add-api.md`
- 查某个 API 签名 → `references/` 对应包文档（以 node_modules 实际版本为最终依据）
- 构建 / 部署 / 线上问题 → `guides/ops.md`

## 5. 反幻觉纪律

- 引用 `@fedx-bff/*` API 前必须读对应版本 `node_modules` 内的 `.d.ts`，不要凭公开文档推断 fedx 封装的签名。
- `myBatisQuery` 的 namespace/key 必须与 mapper XML 实际一致，改动时两边同步。
- 不确定某组件 / hook 是否存在时先在 `web/components`、`web/hooks` 下搜索。
