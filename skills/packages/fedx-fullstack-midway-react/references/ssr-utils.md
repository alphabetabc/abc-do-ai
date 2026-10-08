# @fedx-bff-web/ssr-utils 使用文档

SSR 工具库，分三组入口：`@fedx-bff-web/ssr-utils`（服务端）、`@fedx-bff-web/ssr-utils/common`、`@fedx-bff-web/ssr-utils/client`。业务代码主要用服务端入口。

## 服务端（主入口）

### initialSSRDevProxy(app)

在 `configuration.ts` 的 `onReady` 中调用，注册开发态 SSR 前端 HMR 代理中间件。开发环境必须调用。

```ts
async onReady() {
    this.app.use(koaStatic(join(getCwd(), './build')));
    await initialSSRDevProxy(this.app);
}
```

### getCwd() / getFeDir() / getPagesDir()

获取项目根目录 / 前端目录（`web/`）/ 页面目录。用于拼静态资源路径。

### getUserConfig()

获取用户 SSR 配置（即框架合并后的 UserConfig，含 `isDev`、`publicPath`、`prefix`、`mode`、`stream` 等）。

### accessFile(file) / accessFileSync(file)

异步 / 同步判断文件是否存在。配置类代码按需加载时常用。

### getPkgJson()

读取项目 package.json 为对象（name / version / dependencies 等）。

### processError(err)

统一错误输出（打印错误堆栈并退出），自定义脚本 / build hook 中使用。

### execPromisify

`child_process.exec` 的 promisify 版本，构建脚本中执行子命令用。

### 其余导出（构建/框架内部，业务一般不用）

- `getDevProxyMiddlewaresArr()`：开发态代理中间件数组
- `setHeader(ctx, serverFrameWork)`、`getDefineEnv()`、`getAsyncCssChunk/getAsyncJsChunk(ctx, chunkName, config)`：运行时资源处理
- `writeRoutes(routes, name?)`、`transformConfig()`、`transformManualRoutes()`：路由生成
- `loadModuleFromFramework(path)`、`loadConfig`、`manifest`、`string-stream`、`static`、`parse`、`build-utils`、`babelOptions`、`build-config`、webpack 相关（`common-chain` / `externals` / `setStyle` 等）

### parse（路由产物生成，⚠️ 其内部约定不可绕过）

`parse.js` 在启动 / 构建期扫描 `web/pages/` 生成路由产物（`FeRoutes`），其中**硬编码**了以下约定路径，改名会导致构建产物缺导出而报错：

| 约定路径 | 产物导出 | 说明 |
| --- | --- | --- |
| `web/components/layout/index` | `Layout` | 全局布局（HTML 外壳，仅服务端渲染） |
| `web/components/layout/App` | `App` | 服务端 + 客户端共用的全局包裹组件 |
| `web/components/layout/fetch.ts`（存在才注入） | `layoutFetch` | 全局 SSR 预取（可选） |
| `web/store/index.ts`（存在才注入） | `export * from '@/store/index'` | 全局 store 定制（state / reducer） |

维护含义见 `guides/frontend.md` 2.5 与 5.4。

## common（`@fedx-bff-web/ssr-utils/common`）

### findRoute(Routes, path)

在约定式路由表中按 path 查找路由项。`Routes` 为 `{ path, childPath?, children? }` 数组。

### setStoreContext(context) / useStoreContext()

设置 / 获取全局 store 的 React Context，用于前后端共享状态。

## client（`@fedx-bff-web/ssr-utils/client`）

### preloadComponent(Routes, base?)

预加载路由组件（含 `fetch` 预取函数），返回带 component / fetch / webpackChunkName 的路由数组。SSR 服务端渲染前预取各路由数据时使用。
