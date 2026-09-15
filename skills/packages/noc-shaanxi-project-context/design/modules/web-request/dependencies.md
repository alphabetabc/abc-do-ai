# web-request 依赖与上游能力 — 请求层的依赖链

> 本文是 `design/modules/web-request/overview.md` 的补充，梳理 `web/services/request/` 的上游依赖及其工作方式。
> 基于实际源码整理（2026-09-15），行号以编写时为准，引用前请重新核对。

## 依赖链总览

```
useRequest（页面消费侧，@fedx-web-common/react-hooks）
  └─ request（web/services/request/request.ts）
       └─ api（web/services/request/instance.ts，baseCreate 创建）
            ├─ @fedx-web-common/utils · baseCreate     ← axios 实例底层（npm 包，不在本仓）
            ├─ getEnvironment（web/common/environment.ts）← 环境 URL / dataScheme 配置来源
            └─ constants（web/common/constants）        ← isEnvProduction 判定
getViewItemDataApi（web/services/request/getViewItemData.ts）
  └─ dataSchemeHelper（web/components/data-scheme）     ← requestId → URL 解析
       └─ DataSchemeLoader（web/components/data-scheme/DataSchemeLoader.tsx）← 方案列表加载
```

## 1. baseCreate（@fedx-web-common/utils，npm 包）

`instance.ts` 用 `baseCreate({...})` 创建 `api` 实例（超时 60s、JSON、无 credentials），返回对象带 `any` / `get` / `addAsyncRequestTransform` 等方法。`api.any(options)` 是统一请求入口（method 自适应），`addAsyncRequestTransform(fn)` 注册请求发出前的异步拦截（本仓用它做 mock 重定向与 URL 解析）。该包为本仓之外的公共库，用法以实际安装版本源码为准。

## 2. getEnvironment / initEnv（web/common/environment.ts）

-   `initEnv(config)`：应用启动时把 environment 配置（`environmentLoaded: true` + 各服务地址、dataSchemeSettings 等）写入全局对象。
-   `getEnvironment(keyPath?)`：按路径读取该全局配置，支持 `getEnvironment('dataSchemeSettings.screenDataScheme')` 形式取子键。
-   底层是 `web/common/globalObject`（setValue2GlobalObject / getGlobalObject）。
-   消费点：
    -   `instance.ts` 的 `getRequestUrl` / `asyncRequestTransform`：按 `baseUrlType` 取 `{ mode, direct, discover }` 配置解析真实 URL（direct 直连 / discover 服务发现网关 `${serviceDiscovery}/${discover}`）。
    -   `dataSchemeHelper` 的 `getDataSchemeUrl`：读取 `dataSchemeSettings.screenDataScheme` 配置。
-   React 组件侧配套 hook：`web/hooks/useEnvironment`。

## 3. dataScheme 数据方案（web/components/data-scheme）

数据方案（dataScheme）是「接口方案管理平台」提供的请求重定向能力：不改业务代码，把视图服务请求的 requestId 解析为方案平台管理的 URL（`schemeUrl` 模板 + `schemeApiId`）。`getViewItemDataApi` 每次请求先经 `dataSchemeHelper.getDataSchemeUrl(requestId, 'view/getViewItemData')` 解析出最终 url。

-   加载器 `DataSchemeLoader` 挂在 `LargeScreenEnv` 中每屏一个，`enable` 时拉取方案映射列表 `init` 到 helper，loading/error 期间页面白屏
-   配置在 `public/environment.json` 的 `dataSchemeSettings`（当前本仓整体未启用，`enable: false`）
-   `done: false` 任一分支（未 init / strictMode 未命中 / schemeUrl 未配置）→ EmptyPromise 静默挂起（无报错、无数据）

详细文档（配置结构、加载流程、解析判定链、完整链路示例、与 localMockUrl 对比、排查指引）见 `design/modules/data-scheme/README.md`。

## 4. CacheLoader（web/utils/CacheLoader.ts）

-   `request.ts` 导出其单例 `cacheLoader`，供 services 层做 Promise 级缓存。
-   `get(key, generator?, expire?)`：无缓存时执行 generator 并缓存其 promise；过期后（`returnExpired: true` 默认先返回旧值）再次调用才触发重生成，重生成期间的新旧 promise 通过 `nextPromise` 衔接。
-   `store(key, expire, value)`：直接写入已 resolve 的值。
-   默认 `defaultExpireTime: -1`（永不过期）。

## 5. useRequest（@fedx-web-common/react-hooks，npm 包）

页面消费侧惯例：`const { data, loading } = useRequest(api, { refreshDeps, ready, pollingInterval ... })`，包住本层的 `request` 返回的 Promise。大屏的「30 分钟轮询 + zoneId 联动刷新（refreshDeps）+ 条件请求（ready）」均由此实现，请求本身无感知。

## 排查指引（结合上游）

| 现象                     | 优先检查                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 数据永远不出现（无报错） | dataScheme：requestId 是否注册 / DataSchemeLoader 是否 enable+init 完成 / strictMode 命中失败（EmptyPromise 静默挂起） |
| 请求 404 或打到相对路径  | `getRequestUrl`：environment 是否加载（environmentLoaded）、baseUrlType 是否配置、mode 是否 direct/discover            |
| 本地一直拿到 mock 数据   | `localMockUrl` + `ENABLE_LOCAL_STATIC_DATA`（非生产环境强制重定向为 GET）                                              |
| URL 被改成方案地址       | `getDataSchemeUrl` 命中了 screenDataScheme 映射（`oldInterfaceId → newInterfaceId`）                                   |
