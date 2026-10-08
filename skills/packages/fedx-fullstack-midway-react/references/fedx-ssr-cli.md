# fedx-ssr CLI 与 SSR 插件使用文档

`fedx-ssr`（CLI）、`@fedx-bff-web/plugin-ssr-midway`（服务端插件）、`@fedx-bff-web/plugin-ssr-react`（前端插件）三者配合工作，业务代码一般只接触 CLI 命令。

## fedx start（本地开发）

```bash
fedx start --port 9902
```

启动开发服务：前端 HMR + midway koa 服务。start 常用参数：

| 参数 | 说明 |
| --- | --- |
| `--port` | 覆盖 `config.ts` 里的 `fePort` / `serverPort`（命令行优先），改 `config.ts` 需重启生效 |
| `--optimize` / `-o` | 启用 optimize 特性 |
| `--web` / `--api` | 单独启动前端 / 服务端 |

网关子路径部署：前缀注入方式以目标项目 scripts 为准（多为环境变量）。

## fedx build（生产构建）

```bash
fedx build            # 产出 build/ 目录
fedx build --optimize
fedx build --analyze  # 打开 bundle 分析（build 参数，start 无此参数）
fedx build --html     # 以 html 模式构建（build 参数）
```

产出为 `build/` 目录（静态资源 + 服务端产物），需配合 `configuration.ts` 的 koaStatic 挂载。生产多进程部署：`pm2 start pm2.config.js`。

## plugin-ssr-midway（服务端插件）

被 CLI 按框架插件机制加载，提供 `start(argv)` / `build(argv)` 两个生命周期，负责：启动 midway 服务、执行服务端 webpack 构建、开发态代理等。**业务代码不需要 import**；排障时可在 `node_modules/@fedx-bff-web/plugin-ssr-midway/` 下查看其 build / start 实现。

## plugin-ssr-react（前端插件）

同上由 CLI 加载，负责 React 侧：

- `clientRender()`：客户端渲染入口（hydration / CSR）
- `server-entry`：服务端渲染入口（renderToPipeableStream / renderToString）
- `create-router`：按 `web/pages/**/render.tsx` 约定生成 `Routes` 路由表
- `config/`：base / client / server 三份 webpack chain 配置

排障方向：构建产物异常 → 查 `plugin-ssr-react/config`；hydration 报错 → 查 `client-entry`；路由不生效 → 检查页面文件命名是否符合约定（`render.tsx` / `render$id.tsx`）。

## 排错入口

1. CLI 行为：`node_modules/fedx-ssr/`（`cli` / `start` / `build` / `clean` / `watcher`）
2. 服务端：`node_modules/@fedx-bff-web/plugin-ssr-midway/`
3. 前端：`node_modules/@fedx-bff-web/plugin-ssr-react/`
4. 渲染类型与配置：`@fedx-bff-web/ssr-types`
