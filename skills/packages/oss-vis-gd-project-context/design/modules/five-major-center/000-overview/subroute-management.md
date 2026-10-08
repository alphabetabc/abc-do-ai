# subroute-management · 五大中心子路由管理

> 作用：`web/pages/five-major-center/` 子路由的声明、渲染与 subpath 下发全链路。模块路由总览见 [README.md](./README.md)。

## 全链路

1. **声明（router.tsx）**：`routes` 为模块内 `as const` 数组（源码 `web/pages/five-major-center/router.tsx`），每项含 `path` / `component` / `name`，默认中心额外标 `index: true`。新增中心 = 在此数组加一项（iframe 中心则 `component: IframePage`，另见 [iframe-page.md](./iframe-page.md)）。`getInitialActiveRoute()` 即 `routes.find(item => item.index)`，是伪入口重定向的唯一依据。

2. **渲染（Router 组件）**：`router.tsx` 导出的 `Router` 用 `useRouteMatch()` 取当前匹配 URL，反查 `routes` 设置 `useTitle`（页签标题为中心名，无匹配时兜底「五大中心」）；首次挂载用 requestAnimationFrame 延迟一帧再置 `visible` 渲染 `Switch`（避免首帧闪烁）。`Route` 由 `routes.filter(route => route.path && route.component)` 展开生成，声明不全的项会被静默跳过。

3. **subpath 下发（服务端 → context）**：服务端 `@Get('/five-major-center/:subpath')`（`src/controller/index.ts`）把 URL 段作为路由参数传入 `render$subpath.tsx`，`RoutePageProvider`（`web/pages/five-major-center/context/index.tsx`）将其写入 React Context，子组件通过 `usePageRouteContext()` 读取当前 `subpath`（`IframePage` 等按它读环境配置）。

4. **中心切换（Header）**：页面顶部 Header 的中心切换即切换子路由（react-router 路由跳转），路由变化 → `Router` 重渲染对应中心组件，`subpath` 经 Context 同步更新。

## 维护准则

- 新增中心只改 `routes` 数组（iframe 中心另配 `environment.json`），不改 `Router` / `render$subpath.tsx`
- `index: true` 决定默认中心与 `/five-major-center` 的重定向目标，改动时同步核对伪入口 `render.tsx` 行为
- 页签标题来自 `name` 字段，新增路由记得填写
