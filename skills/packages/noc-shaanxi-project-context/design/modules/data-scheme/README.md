# data-scheme — 数据方案（数据模板）能力

> 对应源码：`web/components/data-scheme/`（index.tsx / DataSchemeLoader.tsx / dataSchemeHelper.ts / readme.md）。
> 环境配置：`public/environment.json` 的 `dataSchemeSettings` 节点。
> 本文基于实际源码整理（2026-09-15），行号以编写时为准，引用前请重新核对。

## 1. 能力定位

数据方案（dataScheme，亦称数据模板）是「接口方案管理平台」提供的前端请求重定向能力：**不改业务代码，把视图服务请求的 URL 替换为方案平台管理的 mock / 代理地址**（`schemeUrl` 模板 + `schemeApiId`）。典型用途：

- 演示 / 联调环境用方案平台准备好的静态数据替换真实后端
- 同一个屏按不同「方案」切换数据来源（每个 schemeId 一套接口映射）
- 真实环境把 `enable` 关掉（或整个 screenDataScheme 配空），全部回退到真实视图服务 URL

请求侧入口在 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`）：每次请求先经 `dataSchemeHelper.getDataSchemeUrl(requestId, 'view/getViewItemData')` 解析出最终 url，再交给 `request` 发出。

## 2. 文件结构

| 文件 | 职责 |
| --- | --- |
| `web/components/data-scheme/index.tsx` | 入口，导出 `DataSchemeLoader` 与 `dataSchemeHelper` |
| `web/components/data-scheme/DataSchemeLoader.tsx` | 组件包裹器：按屏拉取方案映射列表并初始化 helper |
| `web/components/data-scheme/dataSchemeHelper.ts` | 模块级单例：requestId → URL 解析、屏配置查找 |
| `web/components/data-scheme/readme.md` | 原始配置说明（url 为示例地址，以 environment.json 实际值为准） |
| `public/environment.json` `dataSchemeSettings` | 环境配置（平台地址 + 每屏方案配置） |

## 3. 环境配置（public/environment.json）

```jsonc
{
    "dataSchemeSettings": {
        "url": "http://10.10.5.83:9011/dataCenterServer/v1", // 接口方案管理平台地址
        "screenDataScheme": [                                  // 每个屏幕一条配置
            {
                "screen": "management-overview-first",         // 屏幕名（LargeScreenEnv 的 props.screen）
                "enable": false,                               // 总开关，false 时整屏走真实 URL
                "schemeId": 25,                                // 数据方案 Id（平台侧维护）
                "mapping": {},                                 // requestId 兜底映射 { requestId: { name, id } }，id 即 yapi 中接口的 id
                "strictMode": false,                           // 严格模式：找不到映射则拒绝请求
                "schemeUrl": "http://10.10.2.8:9091/mock/{{schemeApiId}}/view/getViewItemData" // URL 模板，必须含 {{schemeApiId}}
            }
        ]
    }
}
```

> **requestId 的取值来源（2026-09-15 确认）**：mapping 中的 `id` 就是 **yapi 里对应接口的 id**——现场启用数据方案时，在 yapi 平台找到各 viewItem 对应接口的 id 填入即可。代码侧 `request-api.ts` requestIdMapping 的数值同样来源于此（该文件脚本生成，即从 yapi 拉取接口清单生成）。

要点（本仓实测口径，见 public/environment.json L781-L799）：

- 当前仅 `management-overview-first` 屏有配置且 `enable: false`，即**数据方案整体未启用**，所有请求走真实视图服务 URL
- `screen: 'default'` 为兜底屏配置：精确匹配不到屏名时用它；连 default 也没有 → 不加载数据方案
- `schemeUrl` 模板中的 `{{schemeApiId}}` 由 `formatString` 替换为方案接口 Id；缺少该占位符则无法生成方案 URL

## 4. DataSchemeLoader（加载器组件）

挂载在大屏环境 `web/components/large-screen/LargeScreenEnv.tsx` 中，包在 ViewScaleManager 外层，每屏一个：

```tsx
<DataSchemeLoader screen={props.screen}> ...页面内容... </DataSchemeLoader>
```

工作流程：

1. 读取环境 `dataSchemeSettings.url` 与当前屏配置（`getScreenSetting(screen)`，内部做 default 屏兜底）
2. `enable: false` → 直接 `status: 'success'`，不加载方案
3. `schemeId` 为空 → antd message 报错「请指定数据方案Id」并 `status: 'error'`
4. `enable: true` → 用本仓 `request` 请求 `GET {url}/scheme/interface/info?schemeId=`，从返回中过滤 `schemeId` 匹配的条目，得到映射列表 `[{ oldInterfaceId, newInterfaceId }]`，调 `dataSchemeHelper.init(list, screen)`；请求期间 `status: 'loading'`
5. 组件卸载时 `reset()` 清空 helper 状态
6. 用 fedx-ui `DataStatus` 包住 children：loading / error 期间不渲染页面内容——**方案未就绪时页面白屏而非空数据**

## 5. dataSchemeHelper（解析单例）

模块级单例状态（`state.initialized / list / currentScreen`），被 `getViewItemData.ts` 消费：

### API

- `init(list, currentScreen)` / `reset()`：由 DataSchemeLoader 调用，登记当前屏与映射列表。
- `getViewItemDataRequestId(requestId, { viewPageId, viewItemId })`：requestId 为空时用 `viewPageId-viewItemId` 拼接兜底并告警（所以视图服务 API 不传 requestId 也能命中 mapping，键为 `viewPageId-viewItemId` 形式）。
- `getScreenSetting(screen)`：先按 `screen` 精确匹配，无则回退 `default` 屏配置；首次未命中 / 启用方案时打一次 debug/info 日志（`state.unknownScreenInfo` / `enableDataSchemeInfo` 防重）。
- `getDataSchemeUrl(requestId, defaultValue)` → `{ url, done }`，逐级判定：
  1. `screenDataScheme` 配置为空 / 无当前屏配置（也不落 default）→ `{ done: true, url: 默认路径 }`
  2. 配置存在但 `enable: false` → 用默认路径（当前本仓即此状态）
  3. `enable: true` 但 helper 未 init（DataSchemeLoader 还没拉到方案列表）→ `{ done: false }`（`getViewItemDataApi` 返回 EmptyPromise 静默挂起）
  4. 映射查找三级顺序：`state.list` 中按 `oldInterfaceId === requestId` 找 `newInterfaceId` → 找不到再查 `settings.mapping[requestId].id` → 仍找不到看 `strictMode`：严格模式 `{ done: false }`（请求静默挂起），非严格回退默认路径
  5. 命中则 `formatString(schemeUrl, { schemeApiId })` 生成方案 URL

## 6. 完整链路示例

以 hazard-rectify 请求 `risk-whole-plan` 为例（`enable: true` 假设场景）：

```
getViewItemDataApi({ requestId: 8870, params: { viewItemId: 'risk-whole-plan', viewPageId: 'xxx', viewPageArgs } })
  → getViewItemDataRequestId：requestId 存在，原样返回 8870
  → getDataSchemeUrl(8870, 'view/getViewItemData')：
      screenDataScheme 有本屏配置且 enable → 查 state.list 中 oldInterfaceId 8870 → newInterfaceId 8871
      → url = schemeUrl 模板替换 {{schemeApiId}} = .../mock/8871/view/getViewItemData，done: true
  → request({ url, method: 'post', baseUrlType: 'sceneViewService', ... })
      → asyncRequestTransform：getRequestUrl 按 sceneViewService 配置拼真实地址
      → 响应经 defaultConverter / 业务 converter 取 data.viewItemData.rows
```

## 7. 与 localMockUrl 的区别

| 维度 | dataScheme | localMockUrl |
| --- | --- | --- |
| 生效层级 | `getViewItemDataApi` 内先解析出方案 URL，再走 request | `asyncRequestTransform` 在请求发出前重定向 |
| 数据来源 | 接口方案管理平台（远程 scheme 列表 + schemeUrl 模板） | 本仓 `public/` 下静态 JSON |
| 开关 | environment.json `enable`（分屏） | 硬编码 `ENABLE_LOCAL_STATIC_DATA`（非生产环境） |
| 粒度 | requestId / viewPageId-viewItemId 级映射 | 单个 API 调用级 |
| 典型场景 | 演示环境整屏切方案数据 | 本地开发单个接口 mock 先行 |

两者可叠加：dataScheme 未启用（当前状态）时，localMockUrl 正常生效；dataScheme 启用且命中映射时，解析出的方案 URL 也可能被 localMockUrl 覆盖（transform 在 request 层统一拦截）。

## 8. 排查指引

| 现象 | 优先检查 |
| --- | --- |
| 数据永远不出现（无报错） | requestId 是否注册（scheme 列表 / mapping）/ DataSchemeLoader 是否 enable+init 完成 / strictMode 未命中（EmptyPromise 静默挂起） |
| 页面整体白屏不渲染 | DataSchemeLoader 处于 loading（方案列表请求未返回）或 error（schemeId 缺失） |
| 请求 URL 变成了 mock 地址 | `getDataSchemeUrl` 命中 screenDataScheme 映射（`oldInterfaceId → newInterfaceId`） |
| 想关掉数据方案 | 当前屏配置 `enable: false`，或删除对应 screenDataScheme 条目 |
