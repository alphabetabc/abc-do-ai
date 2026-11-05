# environment-config · URL 组合机制（请求如何拼出最终地址）

> 上位文档：`./overview.md`（键清单与条目结构）；`001-overview/001-overview.md` §3（网络层横切图）
> 源码实证：`src/common/api/index.js`（requestTransforms）、`src/setupProxy.js`、`public/environment.json`（2026-11-05 快照）

## 定位

回答一个问题：**一次接口调用，最终请求的 URL 是怎么拼出来的**。键是什么、有哪些键，见 `./overview.md`；本文只讲组合算法与特例。

## 转换管道（源码：src/common/api/index.js L61-L93）

所有请求经 `createWebService` 单例发出，requestTransforms 中唯一的转换器按以下顺序处理：

```text
调用方：proxy['<相对路径>']({ baseUrlType: '<environment.json 键>', ... })
   │
   ▼ ① 取请求自带的 url 与 baseUrlType
   │
   ▼ ② 前置归一：url 不含 "http://" → 先拼 `${serviceDiscovery}${url}`
   │     （仅为下一步能 new URL() 解析出 pathname / search）
   │
   ▼ ③ 按 env[baseUrlType].mode 分流：
   │     mode === "direct"   → res.url = `${direct}${pathname}${search}`
   │                           （direct 为空字符串 → url 不处理，视作调用方直传 fullUrl）
   │     其他（含 "discover"）→ res.url = `${serviceDiscovery}/${discover}${pathname}${search}`
   │
   ▼ ④ 请求未带 baseUrlType，或环境未加载完成（envLoaded 为 false）
         → 转换器直接放行；实际落到 createWebService 的 baseUrl
           = serviceDiscovery（模块加载时快照，src/common/api/index.js L63-L64）
```

要点：

- `discover` 值参与拼接时**总是带一条 `/` 分隔**（`${serviceDiscovery}/${discover}`），因此 discover 只写服务名（如 `cloud.alarm.model.define`），不带前导斜杠
- `direct` 参与拼接的是 `direct + pathname`，**pathname 来自原始相对路径**——direct 自带路径后缀（如 `/sqlm/v2.0`、`/ap/v2.2`）时，后缀与 pathname 首个 `/` 天然衔接，无需额外处理
- 环境加载完成前发出的请求（`envLoaded === false`）一律走 serviceDiscovery 前缀

## 两种 mode 的完整示例（开发默认配置实测值）

### direct 模式

`src/pages/falutRules-management/api.js` 的 `getVendors()`：

```js
proxy['vendors']({ type: 'get', baseUrlType: 'preProcessingManagementUrl' });
```

environment.json 中 `preProcessingManagementUrl.direct = "http://10.10.1.150:20001/ap/v2.2"`，拼出：

```text
http://10.10.1.150:20001/ap/v2.2/vendors
└─────── direct ─────────────┘└ pathname ┘
```

带查询串时（`url = 'vendors?x=1'`）`search` 原样保留在末尾。

### discover 模式

以 `filterUrl`（`mode: "discover"`，`discover: "cloud.alarm.model.define"`，`serviceDiscovery: "http://10.10.2.41:8888"`）为例，调用 `proxy['query']({ baseUrlType: 'filterUrl' })` 拼出：

```text
http://10.10.2.41:8888/cloud.alarm.model.define/query
└── serviceDiscovery ──┘└────── discover ─────────────┘└ path ┘
```

切换环境 / 网关时只改 `serviceDiscovery` 或 mode，不改调用点。

## 三类不走该管道的消费方式

| 消费方 | 方式 | 源码位置 |
| --- | --- | --- |
| `iceUrl` 嵌套项 | 组件直接读 `environment.iceUrl.<子键>.direct` 字段（布尔 / 数值 / ICE 地址），不发起 HTTP 拼接 | `src/components/alarm-window-view/index.jsx` L57-L65 |
| `alarmSoundUrl` | 组件直接取 `.direct` 后自行拼资源路径（`${direct}/`） | 同上 L77 |
| `topoXmlProxyUrl` | 模块加载时 `TopoXmlRequestConfig.setProxyUrl(<值>)` 注入 oss-topo 内部请求器，绕过本仓网络层 | `src/pages/topo/topo-view/index.jsx` L12、`src/pages/alarm-topo/index.jsx` L9 |

## 本地调试链路（src/setupProxy.js）——当前默认配置下不生效

该文件会被 `yarn start` 加载（`config/webpackDevServer.config.js` L116-L119 在 devServer before 钩子注册，仅开发期、不进构建产物），规则是：

```text
浏览器 → /serviceDiscovery/<后续路径>
            → pathRewrite 去掉 ^/serviceDiscovery → /
            → 转发 target http://10.10.2.61:8888
```

**但按仓库默认配置它永远不会命中**：代理只拦截发往 dev server 自身（localhost）且以 `/serviceDiscovery` 开头的请求；而 `public/environment.json` 的 `serviceDiscovery` 是绝对地址 `http://10.10.2.41:8888`，请求直接打到该地址，不经过 dev server。且代理目标 `10.10.2.61` 与默认 `serviceDiscovery` 的 `10.10.2.41` 也非同一网关。

结论：视作脚手架示例残留；仅当开发者手动把 `serviceDiscovery` 改成相对值 `/serviceDiscovery` 时才生效。若真走代理调试，需同时确认代理 target 指向期望网关。

## 新增调用点检查单

- [ ] 请求带 `baseUrlType`，且值是 `./overview.md` 键清单中的既有键
- [ ] 相对路径以 `/` 开头（无前导 `/` 时 ① 的 new URL() 解析行为依赖 serviceDiscovery 拼接，保持惯例写法）
- [ ] 直传完整 URL（fullUrl）时确认对应键 `direct` 留空，否则会被 ③ 改写
- [ ] 新增键时 direct / discover 双写并同步 k8s 线上配置（见 `./overview.md` 维护规则）

## 变更记录

- 2026-11-05：初版，基于 `src/common/api/index.js` requestTransforms 源码逐行实证
- 2026-11-05：setupProxy 结论由「待确认」改为确定性：devServer 会加载，但默认配置下（serviceDiscovery 为绝对地址）永不命中，视作脚手架示例残留
