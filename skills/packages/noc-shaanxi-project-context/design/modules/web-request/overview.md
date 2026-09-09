# web-request — 前端请求管理模块

> 对应源码：`web/services/request/`（入口 `web/services/request/index.ts`）。
> 本文基于实际源码整理，行号以文档编写时（2026-09-09）为准，引用前请重新核对。

## 模块定位

`web/services/request/` 是前端统一的 HTTP 请求层，基于 `@fedx-web-common/utils` 的 `baseCreate` 封装，负责：

1. 统一创建 axios 实例（超时、Content-Type、withCredentials 等基础配置）
2. 请求发出前根据环境配置（`getEnvironment()`）动态解析真实请求 URL（直连 / 服务发现两种模式）
3. 本地开发 mock 数据重定向（`localMockUrl`）
4. 响应数据转换（converter 机制）
5. 提供视图服务类通用 API（`getViewItemDataApi` 等）

页面业务 services（如 `web/services/emergency-support/`、`web/services/flood-prevention-screen/` 等）普遍从这里导入 `request` / `loadJson` / `createConverter` / `getViewItemDataApi` 等发请求。

## 文件结构

| 文件                                      | 职责                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `web/services/request/index.ts`           | 入口，re-export `request.ts` 与 `getViewItemData.ts` 的全部导出                          |
| `web/services/request/instance.ts`        | axios 实例创建、URL 解析（`getRequestUrl`）、请求前拦截转换（`asyncRequestTransform`）   |
| `web/services/request/request.ts`         | 通用请求函数 `request`、`loadJson`、converter 工厂 `createConverter`、单例 `cacheLoader` |
| `web/services/request/getViewItemData.ts` | 视图服务 / 网络覆盖地图等业务通用 API                                                    |
| `web/services/types.ts`（模块外）         | `MethodType`、`ConverterFunction` 类型定义                                               |

## 核心机制

### 1. 实例创建与环境 URL 解析（instance.ts）

`baseCreate({...})` 创建实例（`instance.ts` L64-L71）：

-   `timeout: 60000`（60 秒）
-   `withCredentials: false`
-   `Content-Type: application/json`

通过 `api.addAsyncRequestTransform(asyncRequestTransform)` 注册请求前异步转换（L73）。

`asyncRequestTransform`（L30-L62）逻辑：

1. 从请求配置中取 `baseUrlType` 与 `url`
2. **本地 mock**：非生产环境且配置了 `localMockUrl` 且 `ENABLE_LOCAL_STATIC_DATA === true`（当前硬编码为 true，见 L28 的"临时变量"注释）→ 把 `url` 替换为 `localMockUrl`，并把 method 强制改为 `get`
3. 否则用 `getRequestUrl` 解析真实 URL

`getRequestUrl`（L5-L25）规则：

-   `url` 以 `http` 开头 → 原样返回（绝对地址直通）
-   环境中 `baseUrlType` 对应配置的 `mode === 'direct'` → `${directUrl}/${opts.url}`
-   `mode === 'discover'` → `${serviceDiscovery}/${discover}${opts.url}`
-   环境未加载或无 `baseUrlType` → 返回 `undefined`（即不做替换，请求原 url）

环境数据来自 `getEnvironment()`（`web/common/environment`），`serviceDiscovery` 为服务发现网关地址。

> 注意：转换函数里还预留了 headers 合并逻辑（zoneId），当前被注释，仅做 headers 透传合并。

### 2. 通用请求函数 request（request.ts）

```ts
const request = async (options: {
    url: string;
    method: MethodType;
    params?: any;      // api.any 透传，get 场景作 query
    converter?: ConverterFunction;
    data?: any;        // post body
    [extraProp: string]: any;  // localMockUrl / baseUrlType 等由 instance 消费
}) => { ... }
```

行为（`request.ts` L7-L26）：

-   调 `api.any({ ...restOptions })` 真正发请求
-   `response.ok` → 有 `converter` 则 `converter(response.data, restOptions)`，否则直接返回 `response.data`
-   失败 → `Promise.reject(response)`（错误 Toast 提示当前为注释占位，**未实现**）

其他导出：

-   `loadJson(url, params, axiosConfig)`：直接走 `api.get`，不做 converter
-   `createConverter(Converters)`：`(name, ...injectArgs) => (res) => Converters[name](res, ...injectArgs)`，用于按名取转换器并预注入参数
-   `cacheLoader`：`~/web/utils/CacheLoader` 的单例，供外部做数据缓存

### 3. 视图服务 API（getViewItemData.ts）

依赖 `dataSchemeHelper`（`web/components/data-scheme`）解析接口平台 requestId → 实际 URL。

-   `getViewItemDataApi(opts)`：视图服务接口，`baseUrlType` 默认 `'sceneViewService'`，POST。`dataSchemeHelper.getDataSchemeUrl(requestId, 'view/getViewItemData')` 解析 url；`done === false` 时返回 `EmptyPromise`（永不 resolve 的 Promise，静默挂起）。body 固定注入 `requestInfo`（clientRequestId / clientToken），合并 `opts.params`。内置 converter 做日志记录后再调用外部传入的 `opts.converter`
-   `getNocNetworkCoverageMapApi(opts)`：网络覆盖地图基站打点，`baseUrlType: 'sceneViewService'`，同样依赖 dataScheme 解析，`done === false` 返回 `EmptyPromise`
-   `defaultConverter`：`(res) => get(res, 'data.viewItemData.rows', [])`，取视图数据行的默认转换

> `done === false` 返回 `EmptyPromise` 是有意为之的"静默失败"策略：dataScheme 未就绪（如 requestId 未注册）时组件 await 永远不返回，不会报错也不会渲染脏数据。排查"数据永远不出现"问题时优先检查 requestId 是否在 dataScheme 中注册。

## 使用方式（业务侧惯例）

```ts
import { request, createConverter, getViewItemDataApi } from '../../services/request';

const api = async (params) => {
    return request({
        url: 'some/relative/path',
        method: 'post',
        baseUrlType: 'xxxService',
        data: params,
        localMockUrl: '/mock-data/xxx.json', // 本地开发可选
        converter: (res) => res?.data ?? [],
    });
};
```

## 已知技术债 / 注意点

1. `ENABLE_LOCAL_STATIC_DATA` 硬编码 `true`（`instance.ts` L28），且只在非生产环境生效（`!constants.isEnvProduction`），生产构建前需确认无 localMockUrl 泄漏风险
2. 请求错误提示（Toast）未实现，失败只 reject，错误处理完全依赖调用方
3. `getViewItemData.ts` 中 `requestInfo.clientRequestId` / `clientToken` 为硬编码占位值
4. `request` 的 `params` 与 `data` 均透传给 `api.any`，语义取决于底层封装（get 时 params 进 query），新增调用时参考既有 services 写法
