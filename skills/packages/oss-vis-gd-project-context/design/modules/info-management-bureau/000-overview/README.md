# info-management-bureau · 模块总览（000-overview）

> 源码：`web/pages/info-management-bureau/`。信管局视图大屏：围绕「全运会 / 残特奥会」通信保障，按日期在 首页 / 开闭幕式 / 比赛日 三类视图间自动轮换展示。

## 1. 路由与页面入口

- 页面源码 `web/pages/info-management-bureau/render.tsx`，访问路径 `/info-management-bureau`（约定式路由；首页 `web/pages/index/render.tsx` 提供跳转入口）
- 页面壳：`LargeScreenEnv`（designWidth 1920 / designHeight 1080，`enableScreenControl: false`，screen id `info-management-bureau----root`）+ `InitMapConfig`（地图配置初始化）+ `SubPageView`
- 常用查询参数（见 `web/pages/index/render.tsx` 跳转逻辑与 view-state 实现）：
    - `staticView`：锁定静态视图（不自动轮换）
    - `matchName`：指定赛事（配合 staticView）

## 2. 视图结构与切换机制（核心）

### 视图类型

`ViewDimensionsTypes`（`web/pages/info-management-bureau/share/presets.ts`）：`home`（首页）、`open`（开幕式）、`close`（闭幕式）、`gameMatch`（比赛日）。其中 open / close 共用一个视图组件（OpenAndClose）。

### 切换驱动：useViewDimensionState

源码：`web/pages/info-management-bureau/sub-pages/components/view-state/useViewDimensionState.tsx`

要点速览（详细机制见 [001-view-state/README.md](./001-view-state/README.md)）：

- **优先级链**：`?staticView=` 静态锁视图 → `viewManager.manual` 人工配置 → 自动轮换
- **viewStatus 判定**：按当天日期（YYYYMMDD）与 settings.time 的 interval 计算 `beforeStart / start / progress / end`
- **自动轮换**（默认 `info-management-bureau.viewSwitchInterval` 分钟，缺省 15）：开/闭幕式当天及前后 `home` ↔ 开/闭幕式视图交替；赛事期间 `home` ↔ `gameMatch` 交替；全部赛事结束渲染「暂无比赛」空态
- **人工干预**：`ViewStateSwitch` 暂停/恢复 + 菜单切视图；点击场馆（`switchViewByStadiumInfo`）仅在暂停状态下生效
- **倒计时**：`CutdownCard` 显示「XX倒计时 / XX进行中 + 天数」；`enableOpenDayIsFirstDay` 控制开幕式当天计 0 还是 1
- **页面跳转**：首页 `web/pages/index/render.tsx` 提供按钮直跳与静态视图调试表单；查询参数含 `staticView` / `hideSwitch` / `viewType` / `matchName` / `stadiumId` / `stadiumName`

### 渲染结构：SubPageView

源码：`web/pages/info-management-bureau/sub-pages/index.tsx`

- 三个视图容器常驻 DOM，通过 opacity/zIndex 切换可见性（过渡时长受 `viewManager.enableViewAnimation` 控制）
- 附层：`Background`、`GameMatchCenterBackground`（动态场馆背景图）、`HomeBackground`、`OpenAndCloseCenter`（静态背景，按配置）、header 标题 / 天气卡 / 时间 / 倒计时 / ViewStateSwitch

## 3. 共享组件层（sub-pages/components/）

| 组件                   | 职责                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `container/`           | 面板容器（PanelLeft / PanelRight / Panel / NoStylePanel）+ ContainerContext（visible 传递；staticView 且不可见时不渲染） |
| `view-state/`          | 视图状态核心：useViewDimensionState、ViewStateSwitch、ViewStateProvider/context、getStaticViewState（utils）             |
| `background/`          | 全局背景                                                                                                                 |
| `today-scheduler/`     | 今日赛程（home / game-match 复用）                                                                                       |
| `cutdown-card/`        | 倒计时卡片                                                                                                               |
| `weather-card/`        | 天气卡（WeatherCardProvider 按视图类型注入）                                                                             |
| `stadium-thumb-image/` | 场馆缩略图                                                                                                               |

## 4. 各视图的 widget 体系

每个视图独立调用 `createLargeScreen('<screen-name>')`（`web/components/large-screen`，见 `design/` 架构文档），在 `modules/index.ts` 内 `registerWidget`（lazy 加载 + left/top/zIndex 布局），由 `WidgetsRender` 渲染。交互字段经 `modules/fields.ts` 的 `defineInteractionFields` 声明，widget 通过 `subscribe` 订阅。

| 视图           | screen-name                             | widget 数 | 文档                                                                |
| -------------- | --------------------------------------- | --------- | ------------------------------------------------------------------- |
| home           | `info-management-bureau-home`           | 6         | [001-home/README.md](../001-home/README.md)                         |
| game-match     | `info-management-bureau-game-match`     | 8         | [002-game-match/README.md](../002-game-match/README.md)             |
| open-and-close | `info-management-bureau-open-and-close` | 7         | [003-open-and-close/README.md](../003-open-and-close/README.md)     |

## 5. 数据与配置组织

- **接口层**：`web/services/info-management-bureau/{home,game-match,open-and-close,components}/`，统一走 `getViewItemDataApi`（baseUrlType `sceneViewService`，按 viewPageId + viewItemId 取数），空数据时按「默认值 → fallback url（getStaticApi）→ localMockUrl」兜底
- **模块级配置**：`share/presets.ts`（视图类型枚举、defaultViewSettings、静态资源路径 staticAssets：stadiumImage / imageRoot / stadiumThumbnail）
- **环境配置**（`public/environment.json`，`info-management-bureau.*`）：`viewManager.settings` / `viewManager.manual` / `viewManager.manualView` / `viewManager.enableViewAnimation` / `viewManager.enableOpenDayIsFirstDay` / `viewSwitchInterval` / `openAndCloseConfig.area`
- **静态图片**：`web/pages/info-management-bureau/images/` 与 `staticAssets` 指向的场馆图目录（`<IMAGE_PATH>/info-management-bureau/stadium-images[-thumb]`）

## 6. 子文档索引

| 文档                                                    | 内容                                     |
| ------------------------------------------------------- | ---------------------------------------- |
| [001-view-state/README.md](./001-view-state/README.md)  | 视图轮换、倒计时、人工干预与页面跳转详解 |
| [001-home/README.md](../001-home/README.md)             | 首页视图（6 widget 子文档）              |
| [002-game-match/README.md](../002-game-match/README.md) | 比赛日视图（8 widget 子文档）            |
| [003-open-and-close/README.md](../003-open-and-close/README.md) | 开/闭幕式视图（7 widget 子文档） |

## 维护准则

- 视图轮换逻辑集中在 view-state/，勿在视图组件内再做日期判断
- 新增 widget：各视图 `modules/index.ts` registerWidget + 模块目录；交互字段先在 `fields.ts` 声明再 subscribe
- 赛程节点（日期/场馆）变更只改 `viewManager.settings` 环境配置，不改代码
