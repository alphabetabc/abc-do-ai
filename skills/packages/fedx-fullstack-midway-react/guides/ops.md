# 运维 / 部署指南

适用于 fedx 全栈项目的构建产物、多进程部署、前缀路由、日志与线上排障。

## 1. 构建产物

`fedx build` 产出两个部分：

| 目录 | 内容 | 服务方 |
| --- | --- | --- |
| `build/` | 前端 bundle（js/css/manifest、 `_build/` 路由与渲染产物） | koa-static-cache 静态托管 |
| `dist/` | 服务端编译产物（midway TS 编译后 js） | pm2 / bootstrap 启动 |

`configuration.ts` 的 `onReady` 中已挂载：

```ts
this.app.use(koaStatic(join(getCwd(), './build')));
this.app.use(koaStatic(join(getCwd(), './public')));
this.app.use(koaStatic(join(getCwd(), './build/client'))); // 部分项目还会挂 build/client
```

因此**部署时 `build/`、`public/`、`dist/`（或源码+运行时编译）、`package.json`、`node_modules` 必须齐全**，缺 `build/` 页面白屏，缺 `public/` 图片/geojson 404。

项目若有 `build-patch.js` 之类的构建后处理脚本（改 manifest、注入配置等），`build` 命令链里会自动执行，手工重新构建时不要漏。

## 2. 进程模型与 pm2

### 2.1 根目录三个启动相关文件

| 文件 | 作用 |
| --- | --- |
| `config.ts` | **SSR 用户配置（UserConfig）**：`mode`（'ssr' / 'csr'）、`fePort`（前端 HMR 端口）、`serverPort`（服务端口）、`define.client`（注入客户端的常量）等，见 `references/ssr-types.md`。构建与运行时都读它，改端口 / 渲染模式在这里改 |
| `bootstrap.js` | **常规启动入口**（pm2 script 指向这里）：`@midwayjs/bootstrap` 加 `ssr-utils` 的 `loadConfig()` 读出 `serverPort`，通过 `Bootstrap.configure({ globalConfig: { koa: { port } } })` 注入端口后 `run()` 启动 midway 容器。端口以此文件读取结果为准（pm2 的 `SERVER_PORT` 环境变量方式为项目自选，二选一） |
| `app.js` | **serverless 部署入口**：`Bootstrap.run()` 后从 IoC 容器取出 koa Framework 的 `getApplication()` 导出。仅平台化部署（函数计算等）用，常规 pm2 不经过它 |

### 2.2 怎么修改端口

按场景改（端口有两类：`fePort` 开发态前端 HMR 端口、`serverPort` / koa 服务端口）：

| 场景 | 改法 |
| --- | --- |
| 开发态（`fedx start`） | `config.ts` 改 `fePort`；或命令行 `fedx start --port <port>`（--port 优先） |
| 生产 koa 服务端口 | 首选 `config.ts` 设 `serverPort`（`bootstrap.js` 会读它注入 koa）；或 pm2 `env.SERVER_PORT` 环境变量（项目自选注入方式，二选一，避免两处配置不一致） |
| 微前端 / 挂载子应用 | 除 `serverPort` 外同步改 `publicPath` 等相关配置 |

注意：

- `bootstrap.js` 通过 `loadConfig()` 读 `config.ts` 的 `serverPort` 并 `Bootstrap.configure({ globalConfig: { koa: { port } } })` 注入，**未配置 serverPort 时走 midway 默认端口**（可被环境变量覆盖，以项目实际 bootstrap 写法为准）。
- `fePort` 只在开发态有意义（HMR 服务）；生产环境静态资源由 koa 托管，同一个服务端口对外。
- 改端口后：开发态重启 `fedx start`；生产重新构建 + `pm2 restart`。

### 2.3 典型 pm2 配置（`pm2.config.js`）——入口是 `bootstrap.js`：

```js
const pkg = require('./package.json');

module.exports = {
    apps: [
        {
            name: pkg.name,           // 进程名取包名
            script: 'bootstrap.js',   // midway bootstrap 入口（不是直接指向 dist 下某个文件）
            exec_mode: 'cluster',
            instances: 1,             // 有 WebSocket（socketio）时必须是 1，见下方说明
            max_memory_restart: '500M', // 内存超限自动重启
            env: {
                SERVER_PORT: 9902,    // 端口用环境变量传给 midway
                NODE_ENV: 'production',
            },
        },
    ],
};
```

常用命令：

```bash
pm2 start pm2.config.js   # 启动
pm2 restart <name>        # 重启（更新构建产物后必须 restart 才生效）
pm2 stop <name>           # 停止
pm2 logs <name>           # 看日志
pm2 monit                 # CPU/内存监控
```

注意：

- **项目用到 WebSocket（`@midwayjs/socketio`）时 `instances` 必须为 1**：cluster 多进程下连接分散在不同进程，`broadcast` 只能推到本进程内的连接，用户会随机收不到推送。确需多进程，须给 socketio 配 redis adapter 再扩。
- 每个进程是独立 midway 容器，模块 config.ts / mapper XML 在各自进程内加载，热加载仅开发态生效，**线上改 SQL 必须重新构建 + restart**。

## 3. 网关子路径部署

项目若需挂到网关子路径，通常通过环境变量注入前缀（具体变量名与用法以目标项目 scripts / 文档为准，各项目可能自行定制）。要点：

- **构建期与运行期的 prefix 必须一致**，否则前端资源 404 / 路由匹配失败。
- prefix 影响静态资源路径、React Router basename、服务端路由匹配。
- 页面内子路由用 `useRouteMatch()` 拼 path 可自动跟随 prefix（见 `guides/frontend.md`）。

## 4. 配置与环境

- `src/config/config.default.ts`：默认配置（数据库、组件、模块配置）。
- `src/config/config.prod.ts`：生产覆盖（midway 按 `NODE_ENV` 加载）。
- 敏感信息（数据库密码、第三方 key）不要提交到 git，用部署环境变量 / 运维平台注入。
- `@midwayjs/info` 若启用，生产环境注意加访问控制。

## 5. 日志

midway 日志（`@midwayjs/logger`）默认输出到 `logs/` 目录：

| 文件 | 内容 |
| --- | --- |
| `logs/<app>/midway-core.log` | 框架启动 / 生命周期 / 路由注册 |
| `logs/<app>/midway-web.log` | http 访问与错误 |
| `logs/<app>/common-error.log` | 未捕获异常堆栈 |

排障顺序：pm2 logs 看启动是否正常 → common-error.log 看异常堆栈 → midway-web.log 看具体请求。

## 6. 常见线上问题

| 现象 | 排查 |
| --- | --- |
| 页面白屏 | `build/` 是否完整；SSR 报错看 common-error.log；确认 onError CSR 降级是否生效 |
| 资源 404 | prefix 构建与运行不一致；`build-patch` 脚本是否执行 |
| 接口 404 | 模块 config.ts 缺失（InternalException）；controller 前缀拼错；pm2 未 restart |
| 数据库连不上 | config.prod.ts 数据源；国产数据库（oracledb 等）依赖版本是否与服务器匹配 |
| socket 只推给部分用户 | cluster 多进程未共享，需 redis adapter |
| 内存持续上涨 | 大屏/echarts 实例未销毁；查 pm2 monit 定位进程 |

## 7. 发布自查

- `pnpm run lint` 通过。
- `fedx build` 无报错，`build/` 与 `dist/` 均已更新。
- prefix 环境（如有）构建参数与部署环境一致。
- pm2 restart 后 curl 首页 + 抽查核心接口返回结构 `{ code: 200, ... }`。
- 回滚方案：保留上一版 `build/ + dist/` 目录可直接切回。
