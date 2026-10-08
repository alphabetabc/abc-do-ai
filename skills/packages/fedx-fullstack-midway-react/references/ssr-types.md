# @fedx-bff-web/ssr-types 使用文档

SSR 类型定义包，业务代码中主要为类型导入。常用项如下。

## 页面数据预取：ReactMidwayFetch

`web/pages/<page>/fetch.ts` 的函数签名类型：

```ts
import type { ReactMidwayFetch } from '@fedx-bff-web/ssr-types';

const fetch: ReactMidwayFetch = async ({ ctx, routerProps }) => {
    // ctx: 服务端请求上下文（仅 SSR 时存在）；routerProps: 路由 props（含动态路由参数）
    return { initData: {} };
};
export default fetch;
```

返回值会注入到页面组件 props（`props.fetchData`）。

## 请求上下文：ISSRContext / ISSRMidwayContext

`@midwayjs/koa` Context 的扩展类型，controller 中 `render(ctx, ...)` 的 ctx 参数类型。

## Layout 组件属性：LayoutProps

全局布局组件（约定路径 `web/components/layout/index.tsx` 与 `App.tsx`，目录名不可改，见 `guides/frontend.md` 2.5）的 props 类型：`{ ctx, config, children, staticList: { injectCss, injectScript }, injectState }`。`staticList` 为需要注入页面的样式 / 脚本节点，`injectState` 为初始状态。

## 路由类型：ReactRoutesType / ReactESMFeRouteItem

`ReactESMFeRouteItem`：约定式路由项（`path` / `childPath` / `fetch` / `component` / `webpackChunkName` / `children`）。
`ReactRoutesType`：路由总表（`Layout`、`layoutFetch`、`FeRoutes`、`state`、`reducer`）。

## 用户配置：UserConfig（IConfig）

根目录 `config.ts`（导出 UserConfig，CLI / `bootstrap.js` 都从这里读，见 `guides/ops.md` 2.1）与 `render()` options 中可用的配置。业务常用字段：

| 字段 | 说明 |
| --- | --- |
| `mode` | `'ssr' \| 'csr'`，渲染模式 |
| `stream` | 是否流式渲染 |
| `prefix` | 服务端路由前缀（多由项目定制的环境变量注入） |
| `clientPrefix` | 客户端路由前缀 |
| `hashRouter` | 是否 hash 路由 |
| `rootId` | 页面挂载节点 id |
| `isDev` | 是否开发环境（只读，框架注入） |
| `fePort` / `serverPort` | 前端 HMR 端口 / 服务端口 |
| `publicPath` | 静态资源前缀 |
| `whiteList` | 代理白名单（正则 / 字符串数组） |
| `onError` | 渲染错误回调 |
| `customHeadScript` / `customFooterScript` | 自定义注入 head / body 末尾的脚本 |
| `extraJsOrder` / `extraCssOrder` | 追加的 js / css 顺序 |
| `chainBaseConfig` / `chainServerConfig` / `chainClientConfig` | webpack chain 配置钩子 |

UserConfig 中另有 `config`（serverConfig）字段，可把配置写入 midway 配置（`config.default.ts` 里能读到）。

## 全局 window 扩展：IWindow

浏览器侧可用的全局字段：`__USE_SSR__`（当前是否 SSR 渲染）、`prefix`、`clientPrefix`、`hashRouter`、`ssrDevInfo`（开发态 manifest / rootId / fePort 等）。业务代码只建议使用 `__USE_SSR__` 判断运行环境，其余为框架内部字段，不要直接读写。
