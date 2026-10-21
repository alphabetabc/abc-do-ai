# shenzhen-communication-guarantee · 模块总览（000-overview）

> 源码：`web/pages/shenzhen-communication-guarantee/`。深圳重要通信保障大屏：支撑 S 会议保障，含 首屏 / 重保区域屏 两个视图，通过左下角按钮手动切换，**无屏间自动轮巡**。

## 1. 路由与页面入口

- 页面源码 `web/pages/shenzhen-communication-guarantee/render.tsx`，访问路径 `/shenzhen-communication-guarantee`（约定式路由）
- 页面壳：`LargeScreenEnv`（designWidth 3840 / designHeight 2160，65 寸屏）+ `InitMapConfig`（地图配置初始化）+ `SubPageView`

## 2. 视图结构与切换机制

### 视图类型

`ViewDimensionsTypes`（`share/presets.ts`）：`home`（首屏）、`area`（重保区域屏）。仅两类。

### 切换机制

- SubPageView 常驻 DOM + opacity/zIndex 切换；左下角切换按钮，互斥菜单：首页屏展开仅显示「重保区域」，区域屏展开仅显示「首页」
- 无自动轮巡、无倒计时
- 切屏入口：① 左下角按钮；② 首屏地图打点点击（携带区域上下文 `switchToArea(area)`）
- 调试参数：search 带 `enableViewSync=1` 时启用视图状态同步——初始从 `view` 参数取值（`?view=area`），切换时 `history.replaceState` 回写 `view`，不产生历史记录；不带参数时行为不变（`sub-pages/index.tsx`，复用 `web/hooks/useSearchParams`）

## 3. 共享组件层（sub-pages/components/）

| 组件 | 职责 | 文档 |
| --- | --- | --- |
| `container/` | 面板容器（PanelLeft / PanelRight / Panel / NoStylePanel）+ ContainerContext | [./002-container/spec.md](./002-container/spec.md) |
| `background/` | 全局背景 | [./003-background/spec.md](./003-background/spec.md) |
| `weather-card/` | 天气卡，固定深圳地市（**2026-10-22 已移除挂载**，组件保留可回退；数据：`services/.../components/index.ts` `getWeatherDataApi`） | [./001-weather-card/spec.md](./001-weather-card/spec.md) |
| `screen-switch/` | 两屏手动切换按钮（互斥菜单） | [./004-screen-switch/spec.md](./004-screen-switch/spec.md) |
| `view-context/` | 跨屏上下文（activeArea / switchViewByArea / switchView） | [./005-view-context/spec.md](./005-view-context/spec.md) |
| `area-carousel/` | 区域轮巡（AreaCarousel + AreaThumbImage + useAreaCarouselData），两屏壳接线见 001-home/007 与 002-area/002 | [./006-area-carousel/spec.md](./006-area-carousel/spec.md) |
| `zero-excellent/` | 四零双优保障目标（APEC LOGO + 双轮播卡，2026-10-22 上线，接替天气卡头部中位槽位） | [./007-zero-excellent/spec.md](./007-zero-excellent/spec.md) |

## 4. 各视图的 widget 体系

每个视图独立 `createLargeScreen('<screen-name>')`，`modules/index.ts` 内 `registerWidget`（lazy + left/top/zIndex 布局），`WidgetsRender` 渲染；交互字段经 `modules/fields.ts` 的 `defineInteractionFields` 声明，widget 通过 `subscribe` 订阅。

| 视图 | screen-name | widget 目录 / registerWidget 项 | 文档 |
| --- | --- | --- | --- |
| home | `shenzhen-communication-guarantee-home` | 6 / 6 | [001-home/README.md](../001-home/README.md) |
| area | `shenzhen-communication-guarantee-area` | 4 / 6（network-business、trend-indicators 各一套组件两份 4G/5G 配置） | [002-area/README.md](../002-area/README.md) |

### 交互字段（fields.ts）

- `areaTypeFilter: AreaType | null`：首屏顶部类型选中态广播；center-map、area-carousel（首屏）订阅过滤；null 为全部
- `activeArea: GuaranteeArea | null`：地图打点点击选中区域，触发切区域屏并携带上下文

### 类型字典（share/presets.ts，顺序固定）

会场、参访区、酒店、交通枢纽、其它（其它含媒体中心类型区域）

### 资源顺序配置（presets，不硬编码）

- 首屏：保障卫星车、保障通信车、保障发电车、保障人员
- 区域屏：保障人员、保障通信车、保障发电车

## 5. 数据与配置组织

- 接口层：`web/services/shenzhen-communication-guarantee/`，统一走 `getViewItemDataApi`（baseUrlType `sceneViewService`，viewPageId 复用信管局 `open-close-ceremonies-view`），空数据兜底链：默认值 → fallback url（getStaticApi）→ localMockUrl（`public/static/mock/shenzhen-communication-guarantee/`）。新增参数/新增 viewItemId 待服务端确认，见 `plans/task-2026-10-09-004-00-scguarantee-backend-api-confirm.md`
- 模块级配置：`share/presets.ts`（视图枚举、AreaType 字典、资源顺序、staticAssets）
- 静态图片：`web/pages/shenzhen-communication-guarantee/images/`

## 6. 接口清单

### 已定义（代码中有函数，viewPageId 均复用信管局 `open-close-ceremonies-view`）

| 接口（web/services/shenzhen-communication-guarantee/） | 复用关系 | 说明 |
| --- | --- | --- |
| `getWeatherDataApi`（components/index.ts） | 信管局 `ceremonies-weather` | 天气卡 |
| `getTopIndicatorsApi`（home/center.ts） | 信管局 `competition-homepage-statistics` | 顶部 5 类型统计 |
| `getHomeAreaPointApi`（home/center.ts） | 信管局 `competition-homepage-point` | 地图打点 / tooltip（008-00：轮巡已切走） |
| `getEmergencyResourceApi`（home/center.ts） | 信管局 home `getHomeBottomIndicatorsApi` 范式（`competition-homepage-resources`） | 应急资源 / 前置资源（两屏共用，方案待定见下） |
| `getPersonalBusinessApi` / `getFamilyBusinessApi` / `getGEBusinessTop4Api`（home/section-left.ts） | 信管局 `chbn-business-*` | 通信服务 |
| `getIntlRoamTop5Api`（home/section-left.ts） | 新增接口 `intl-roam-top5`（api-doc.md 六） | 国际漫入 TOP5（008-00 落码 2026-10-12） |
| `getMapAreaLayerApi`（home/center.ts） | 新增接口 `map-area-layer`（api-doc.md 七） | 区域轮巡数据源（两屏同源，008-00 落码 2026-10-12）；`areaType`/`area` 参数预留，默认全量 |

### 未定义（挂 004-00，代码中只留注释）

| 需求 | 004-00 条目 | 状态 |
| --- | --- | --- |
| ~~国际漫入 TOP5~~ | 二-1 | **已落码**（008-00，`intl-roam-top5`），移入上方已定义表 |
| 首屏重保区域业务汇总（基站/小区/通感站/专线） | 二-2 | 已服务端沟通，待开发 |
| 区域屏左右模块（无线规模 + 趋势指标） | 二-3 | 已服务端沟通，待开发 |
| 区域屏保障资源是否改用 game-match `ceremonies-guarantee-resources` | 二-4 | 待定 |

> 接口复用前提的疑虑（服务端未明确业务能力一致前标识被复用）见 [../memo.md](../memo.md)。

## 7. 子文档索引

| 文档 | 内容 |
| --- | --- |
| [001-home/README.md](../001-home/README.md) | 首屏视图（6 widget 子文档） |
| [002-area/README.md](../002-area/README.md) | 重保区域屏视图（4 widget 子文档） |
| [001-weather-card/](./001-weather-card/spec.md) | 共享组件文档：天气卡（spec + data-model） |
| [002-container/](./002-container/spec.md) | 共享组件文档：面板容器 |
| [003-background/](./003-background/spec.md) | 共享组件文档：全局背景 |
| [004-screen-switch/](./004-screen-switch/spec.md) | 共享组件文档：两屏切换器 |
| [005-view-context/](./005-view-context/spec.md) | 共享组件文档：跨屏视图上下文 |
| [006-area-carousel/](./006-area-carousel/spec.md) | 共享组件文档：区域轮巡（spec + data-model） |
| [007-zero-excellent/](./007-zero-excellent/spec.md) | 共享组件文档：四零双优保障目标 |
| [environment-config.md](./environment-config.md) | 环境配置清单（8 个 key：homeConfig 6 + areaConfig 1 + viewManager 1） |

## 维护准则

- 两屏切换逻辑集中在 screen-switch/，勿在视图组件内散落 setState 切屏
- 新增 widget：各视图 `modules/index.ts` registerWidget + 模块目录；交互字段先在 `fields.ts` 声明再 subscribe
- 资源顺序、类型字典只改 `share/presets.ts` 配置，不改代码
