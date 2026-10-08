# Plan-006：initializer + data-scheme → app-bootstrap.md & data-scheme.md

> **日期**：2026-08-03
> **性质**：执行子计划（[Plan-005](./2026-08-03-005-plan-web-components-docs.md) 第 1 子项）
> **目标目录**：`web/components/initializer/` + `web/components/data-scheme/`
> **输出文件**：`docs/design/app-bootstrap.md` + `docs/design/data-scheme.md`

---

## 0. 背景

两个目录都属于「应用启动期 / 首次请求」机制，职责独立但生命周期一致，故合写一个子计划：

- **initializer** — 进入大屏前：环境配置加载、token 校验、地图配置加载、iframe postMessage 握手
- **data-scheme** — 首次请求前：通过方案平台动态改写接口 URL

## 1. 目标

| 输出文件 | 主题 |
|---|---|
| `docs/design/app-bootstrap.md` | 启动时序 + 4 个子机制（environment / Authorize / InitMapConfig / iframe-message） |
| `docs/design/data-scheme.md` | scheme 平台改写机制 + 决策表 |

## 2. 源文件（已读 / 待读）

### 2.1 已读（写文档时直接引用）

- `web/components/initializer/index.tsx` （Initializer 组件 + useInitContext）
- `web/components/initializer/initApp.ts` （environment.json 加载，路径模板）
- `web/components/initializer/Authorize.tsx` （access_token 校验 + boco 跳过 + sso_token 写入）
- `web/components/initializer/initMapConfig.tsx` （map-config 加载）
- `web/components/initializer/iframe-app/index.ts` （window message 监听 + createMessageManager）
- `web/components/initializer/iframe-app/message.ts` （createMessageManager 实现）

- `web/components/data-scheme/index.tsx` （导出）
- `web/components/data-scheme/DataSchemeLoader.tsx` （scheme/interface/info 拉取 + 状态机）
- `web/components/data-scheme/dataSchemeHelper.ts` （state / init / reset / getDataSchemeUrl / getViewItemDataRequestId）
- `web/components/data-scheme/readme.md` （配置示例）

### 2.2 待补充读（依赖）

- `web/services/request.ts` （`request()` API；`loadJson()` 静态 JSON；`cacheLoader.get()` 内存缓存 key）
- `web/common/environment.ts` （`getEnvironment()` + `initEnv()`）
- `web/common/constants.ts` （`isEnvProduction`、`PUBLIC_URL`、`MICRO_APP_URL`、`STATIC_PATH`）
- `web/utils/formatString.ts` （`{{schemeApiId}}` 模板替换）
- `web/hooks/useSearchParams.ts` （URL 参数读取）

## 3. `docs/design/app-bootstrap.md` 大纲

```
§0 TL;DR（启动 4 步表）
§1 启动时序图（mermaid 或 ascii）
   1.1 <Initializer/> mount → 渲染 null
   1.2 useEffect → initApp() 拉 environment.json
   1.3 useIframeAppInitMessage 监听 'loginInfo'
   1.4 InitMapConfig 子树：拉 map-config.json + initMapConfig()
   1.5 Authorize：生产环境校验 token；noAuth 跳过
   1.6 setInitState({ initialized: true }) → 渲染 children

§2 4 套环境 URL 区分
   - 生产：'${PUBLIC_URL}configmanage/environment.json?isApply=true&projectName=oss-visual-gd-emergency-support'
   - 本地：'${MICRO_APP_URL}environment.json' 或 'environment-local.json'（ENABLE_LOCAL_ENV==='true'）
   - 内置 Bearer 头（无 token，依然调用）
   - cacheLoader.get('environmentJson') 单次内存缓存

§3 Authorize 鉴权
   - noAuth 判定：
     * 生产 && (enableAuth=false 或 'boco' in searchParams)
     * 非生产 → 直接 noAuth
   - URL ?access_token/?sso_token → 写入 localStorage → history.replace 删参
   - verifyToken() 调用（disableVerify=true → 直接通过）
   - 失败：localStorage.removeItem('access_token') + authorized=false

§4 InitMapConfig（地图配置）
   - 路径：environment.json.ecMapConfig.mapConfigFile || 'map/map-config.json'
   - URL 拼接：startsWith('http') 原样；否则 STATIC_PATH + path
   - cacheLoader.get('mapConfig') 单次加载
   - 加载完成：initMapConfig(res.data.data) 注入全局 map 状态

§5 iframe postMessage 握手
   - window.message 监听 → filter data.origin==='framework' && data.type==='loginInfo'
   - createMessageManager：emit/on/off + messageCache
   - useIframeAppInitMessage({ onLoginInfoChange })
   - 走到 useEffect cleanup 移除监听

§6 InitContext（含 loginInfo 结构）
   - useInitContext() 暴露
   - permissions: { zoneName, zoneLevel, zoneId, parentZoneId, userId }

§7 失败与降级
   - environment.json 加载失败：catch → console.error + setInitState({ initialized: false }) → 不渲染 children
   - Authorize 失败：return null 临时占位
   - map-config 加载期间：return null 等渲染
   - iframe 消息迟到：messageCache 补发（late-join）

§8 关键文件位置表（仓库根相对路径）
§9 关联文档
```

## 4. `docs/design/data-scheme.md` 大纲

```
§0 TL;DR（何时启用 / 默认禁用）
§1 概念与启用场景
   - 平台方维护 scheme/interface/info 端点（http://10.10.5.83:7008/v1）
   - URL 模板含 {{schemeApiId}}，运行时替换
§2 配置文件结构（environment.json.dataSchemeSettings）
   - url: 方案平台地址
   - screenDataScheme[]:
     * screen: 屏名（default 兜底）
     * enable: 必须为 true 才加载
     * schemeId: 方案 ID
     * mapping: {'leftInd-indCard': {name, id}} 接口 id → schemeApiId 兜底映射
     * strictMode: 找不到 → true 报错 / false 用原 defaultValue
     * schemeUrl: 模板，含 {{schemeApiId}}
§3 加载流程（DataSchemeLoader）
   - 三态机：loading / success / error
   - URL = `${url}/scheme/interface/info?schemeId=${schemeId}`
   - 命中 list 过滤 → init(list, screen)
   - useUnmount → reset()
§4 改写决策表（getDataSchemeUrl）
   ┌────────────────┬─────────────────────────────┐
   │ 决策点          │ 行为                         │
   ├────────────────┼─────────────────────────────┤
   │ enable=false   │ 返回 defaultValue（done:true） │
   │ !state.initialized │ 返回 'unknown-scheme-url'  │
   │ schemeUrl 为空 │ logger.error + 'unknown-...' │
   │ schemeItem 找到 │ schemeApiId ← list[item].newInterfaceId │
   │ mapping 兜底   │ schemeApiId ← mapping[requestId].id    │
   │ strictMode=true 找不到 │ 'unknown-...'                │
   │ strictMode=false 找不到 │ defaultValue                 │
   └────────────────┴─────────────────────────────┘
§5 requestId 兜底（getViewItemDataRequestId）
   - 视图服务未传 requestId → 自动用 `${viewPageId}-${viewItemId}`
§6 典型配置（直接引用 readme.md 内容）
§7 与 docs 其它位置的关系
   - docs/design/api-contracts.md：不包含 scheme 改写
   - 本文件是 scheme 改写的**唯一事实来源**
   - schemeUrl 中的 {{schemeApiId}} 由 formatString 替换（来源 web/utils/formatString.ts）
§8 关键文件位置表
§9 关联文档
```

## 5. 执行步骤

| 步 | 动作 |
|---|---|
| 1 | 读 2.2 待补充读文件（一次性：request / environment / constants / formatString / useSearchParams） |
| 2 | 写 `docs/design/app-bootstrap.md`（按 §3 大纲） |
| 3 | 写 `docs/design/data-scheme.md`（按 §4 大纲） |
| 4 | 在两个文档内交叉引用对侧（bootstrap 提到数据加载完成后，scheme loader 开始改写；data-scheme 提到 LARI 屏首次渲染时挂载） |
| 5 | Rule 2/4 grep 验证 |
| 6 | 在 `docs/design/README.md` 索引表追加 2 行 |

## 6. 不做（OUT）

- ❌ 不修改 loadJson / cacheLoader / request 实现
- ❌ 不解释 BFF `/api/index`（已有 docs/design/api-contracts.md）
- ❌ 不重写 environment.json 所有字段解释（仅讲与启动/scheme 有关部分）
- ❌ 不写 PM 视角的业务规则（保留代码事实）

## 7. 关键引用形态（Rule D-14）

```text
web/components/initializer/index.tsx#L40-L111
web/components/data-scheme/dataSchemeHelper.ts#L71-L138
web/services/request.ts#Lxx  （实际读文件后填行号）
```

每段末尾的"关键文件位置表"使用仓库根相对路径 + 反引号包裹。

## 8. 完成定义

- [ ] `docs/design/app-bootstrap.md` 写入（≥9 节）
- [ ] `docs/design/data-scheme.md` 写入（≥9 节）
- [ ] `docs/design/README.md` 索引已加 2 行
- [ ] Rule 2 验证通过
- [ ] Rule 4 验证通过

## 9. 关联文档

- [Plan-005](./2026-08-03-005-plan-web-components-docs.md) 上游
- `docs/design/tech-stack.md` 技术栈
- `docs/design/api-contracts.md` HTTP 契约
- `.trae/rules/docs-authoring-rules.md`

## 10. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版 | Plan-005 拆分 |
