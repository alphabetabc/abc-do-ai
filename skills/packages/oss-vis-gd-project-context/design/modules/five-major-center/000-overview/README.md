# five-major-center · 五大中心业务模块总览

> 作用：`web/pages/five-major-center/` 的入口描述 —— 路由与页面入口、中心结构（本地三中心 + iframe 两中心）、共享资源、子文档索引。读者从本份即可获得模块全貌。

## 中心组成

产品口径「五大中心」= 3 个本地实现中心 + 2 个 iframe 嵌入中心（见上方路由表）。

## 路由与页面入口

服务端在 `src/controller/index.ts` 注册 `@Get('/five-major-center')` 与 `@Get('/five-major-center/:subpath')`，SSR 渲染（stream 模式，出错降级 CSR）。

前端路由在 `web/pages/five-major-center/router.tsx` 定义，共 5 条（前缀 `/five-major-center`）：

| 路由                            | 页面                         | 说明                                    |
| ------------------------------- | ---------------------------- | --------------------------------------- |
| `/cmd-dispatcher-center`        | `CmdDispatcherCenter`        | 指挥调度中心，`index: true`（默认中心） |
| `/information-hub-center`       | `InformationHubCenter`       | 信息枢纽中心                            |
| `/comprehensive-display-center` | `ComprehensiveDisplayCenter` | 综合展示中心                            |
| `/situation-awareness-center`   | `IframePage`                 | 态势感知中心（iframe 嵌入外部页面）     |
| `/real-time-discovery-center`   | `IframePage`                 | 实时发现中心（iframe 嵌入外部页面）     |

- 访问 `/five-major-center` 时，伪入口 `render.tsx`（`FiveMajorCenterRedirect`）重定向到 `getInitialActiveRoute()` 返回的 index 路由（即指挥调度中心），并保留原 query。
- 页面壳在 `render$subpath.tsx`：`LargeScreenEnv`（设计稿 5760×1080，启用数字人、鉴权）→ `RoutePageProvider`（下发 subpath）→ `InitMapConfig` → `Header` + `Content` + `Router` + `MetaHumanHelperZone`。
- `router.tsx` 另导出 `openEmergencyRoute.fromCmdDispatcherCenter(config)`：从指挥调度中心打开应急支持页 `/gd-emergency-support`（携带 type/taskName/taskId、来源与数字人开关，读自 `web/environment/five-major-center/cmd-dispatcher-center.ts`）。

子路由的声明、渲染、subpath 下发与中心切换全链路详见 [subroute-management.md](./subroute-management.md)。
## 本地三中心结构

| 中心         | 目录                                                        |
| ------------ | ----------------------------------------------------------- |
| 综合展示中心 | `web/pages/five-major-center/comprehensive-display-center/` |
| 信息枢纽中心 | `web/pages/five-major-center/information-hub-center/`       |
| 指挥调度中心 | `web/pages/five-major-center/cmd-dispatcher-center/`        |

三中心目录结构相似，以中心目录为单位组织：

- `modules/center/` — 中央区域：`map-view/`（地图视图）+ `carousel-view/`（轮播，仅综合展示/指挥调度）+ `iframe-view/`（仅这两中心）
- `modules/section-left/`、`modules/section-right/` — 左右两侧业务卡片（各中心不同：保障任务/物资储备/值班表、个人/家庭/政企/新兴业务、网络事件监控/隐患管控等）
- `modules/images/` — 中心内静态资源
- `modules/fields.ts` / `index.ts` / `screen.ts` — 字段定义、聚合导出、大屏配置

地图视图内的 map-geo 组件细节见 [001-map-geo/README.md](../001-map-geo/README.md)。

## iframe 两中心（IframePage）

态势感知中心与实时发现中心没有本地页面实现，统一走 `web/pages/five-major-center/iframe-page/`（`IframePage` 组件），按 subpath 读环境配置嵌入外部页面（当前仅态势感知中心有配置）。机制与新增方式详见 [iframe-page.md](./iframe-page.md)。

## 共享资源

- `web/pages/five-major-center/share/box/` — 三中心共享的盒子容器组件（`BoxProvider` / `Box` / `SizeBox` / `BoxVisibleSwitch` / `BackBtn` / `GisBtn`，valtio 管理全局显隐）
- `web/pages/five-major-center/share/header/`、`share/content/` — 页头与内容区容器（Content 提供 zIndex 控制 hook）
- `web/pages/five-major-center/context/` — `RoutePageProvider` / `usePageRouteContext`（下发当前 subpath）
- `web/pages/five-major-center/metalHumanPresets.ts` — 数字人配置
- 跨模块复用组件层在 `web/components/ui/`（emap-gis、rc-echarts 等），用法文档见 `design/components/`
- 环境配置读取层：`web/environment/five-major-center/*.ts`（数据源为 `public/environment.json`）；接口层：`web/services/<module>/`；mock：`public/static/mock/<module>/`

## 子文档索引

| 子文档                                            | 内容                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| [001-map-geo/README.md](../001-map-geo/README.md) | map-geo 地图组件：三中心各自的 presets / data-model / interactions 及对比 |
| [iframe-page.md](./iframe-page.md)                | IframePage：iframe 嵌入中心页（态势感知/实时发现）的机制、配置与新增方式  |
| [subroute-management.md](./subroute-management.md) | 子路由全链路：routes 声明、Router 渲染、subpath 下发与中心切换           |

> 后续新增主题子文档（如某中心细化、share/box 细化）时在此表追加，并保持本 README 薄层入口定位。
