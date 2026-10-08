# info-management-bureau · 视图状态与跳转（001-view-state）

> 详述视图轮换、倒计时、人工干预与页面跳转机制。总览见 [../README.md](../README.md)。
> 核心源码：`web/pages/info-management-bureau/sub-pages/components/view-state/`（useViewDimensionState.tsx / utils.ts / ViewStateSwitch.tsx）

## 1. 优先级链（三选一，前者命中即返回）

`useViewDimensionState` 的 effect 按以下顺序判定：

1. `?staticView=` 查询参数存在 → 走 `getStaticViewState` 静态锁视图（`view-state/utils.ts`）
2. `viewManager.manual: true`（环境配置 `info-management-bureau.viewManager.manual`）→ 读取 `manualView` 直接设定视图、标题、倒计时与中心场馆
3. 否则进入自动轮换逻辑

## 2. viewStatus 判定与轮换时间线

- **配置源**：`info-management-bureau.viewManager.settings`（环境配置），缺省回退 `share/presets.ts` 的 `defaultViewSettings`（含全运会/残特奥会开闭幕式 4 个节点：type / time / title / match / matchAlias / centerStadiumImage / centerStadiumName / centerStadiumId）
- 每天首次计算时，对 settings 附加 `interval = time - 今天（天数）` 并按 interval 升序排序；同时为 open/close 节点建立 `sibling`（open 的下一个、close 的上一个），供「进行中第 N 天」计数使用
- `currentView` = 第一个 `interval >= 0` 的节点（即尚未过去的最近节点）；找不到则全部赛事已结束
- viewStatus 由 currentView 推导：

| viewStatus    | 条件                                   | 轮换行为（初始 `update(true)` 固定为 home，之后每 interval 切一次） |
| ------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `beforeStart` | open 节点、interval > 0                | `home` ↔ 开幕式视图 交替，标题取 match                              |
| `start`       | open 节点、interval = 0（开幕式当天）  | 同上                                                                |
| `end`         | close 节点、interval = 0（闭幕式当天） | `home` ↔ 闭幕式视图 交替                                            |
| `progress`    | close 节点、interval > 0（赛事期间）   | `home` ↔ `gameMatch` 交替                                           |
| 全部结束      | 无 interval >= 0 的节点                | `currentViewType = NonGameMatchSymbol` → 整屏渲染「暂无比赛」空态   |

- 轮换周期：`info-management-bureau.viewSwitchInterval` 分钟（环境配置，缺省 15），`setInterval` 驱动 `update()`
- 暂停轮换（`switchPlayStateIsPlaying: false`）会清空并重建 effect：重新执行时再次走优先级链

## 3. 倒计时（CutdownCard）

组件：`web/pages/info-management-bureau/sub-pages/components/cutdown-card/index.tsx`，展示「`{matchAlias}倒计时/进行中` + 数字逐位分格 + 天」。

### 自动轮换模式下（useViewDimensionState.update）

| 阶段                | cutdownBeforeText    | cutdownTime                                                          |
| ------------------- | -------------------- | -------------------------------------------------------------------- |
| beforeStart         | `{matchAlias}倒计时` | `开幕式日期 - 今天 + 1`（天）                                        |
| start（开幕式当天） | `{matchAlias}进行中` | `enableOpenDayIsFirstDay ? 1 : 0`（现场要求当天计 0）                |
| end / progress      | `{matchAlias}进行中` | `今天 - sibling(开幕式).time`（天）；`enableOpenDayIsFirstDay` 时 +1 |

### 静态视图模式下（getStaticViewState）

按 `matchName` 过滤出该赛事的 start/end 节点，`fromStart = 今天 - start.time`、`formEnd = end.time - 今天`：

- 未开幕（fromStart < 0）：「倒计时」+ `|fromStart|` 天
- 已开幕且未闭幕：「进行中」+ `fromStart`（enableOpenDayIsFirstDay 时 +1）天
- `showCutdown = fromStart < 0 || formEnd >= 0`（赛事完全结束后隐藏卡片）
- 每 10 分钟（TIME_RANGE.MINUTE * 10）定时重算

## 4. 人工干预

- `ViewStateSwitch` 组件：暂停/恢复轮换（isPlaying）+ 菜单手动切视图；菜单项随当前视图动态给出（当前是 home 时给「开/闭幕式（按当天 settings 命中类型）/ 比赛日」，是 open/close 时给「首页 / 比赛日」，是 gameMatch 时给「首页 / 开/闭幕式」）；暂停后菜单/场馆点击均走 `getStaticViewState` 锁定视图并保留 currentMatch
- 点击场馆（`switchViewByStadiumInfo`）：开闭幕式场馆（按 settings 的 centerStadiumId 命中且类型非 gameMatch）→ 开/闭幕式视图，其他场馆 → gameMatch（仅暂停状态下生效，且把场馆 id 写入 currentGameMatchStadiumId）

## 5. 页面跳转与查询参数

入口：`web/pages/index/render.tsx`（生产环境须带 `?showIndex` 才可见）提供两种跳转：

- 「信管局视图」按钮：`history.push('/info-management-bureau')` 进入自动轮换模式
- 静态视图调试表单：`window.open('/info-management-bureau?staticView=true&viewType=...&matchName=...&stadiumId=...&stadiumName=...')`

查询参数说明（信管局页内消费）：

| 参数                        | 作用                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `staticView`                | 存在即锁定静态视图，不自动轮换；同时 `ViewStateSwitch` 不渲染                                                         |
| `hideSwitch`                | 隐藏 `ViewStateSwitch` 组件（仍可自动轮换）                                                                           |
| `viewType`                  | 静态模式下的视图类型（home / open / close / gameMatch；其他值 → NonGameMatchSymbol 空态）                             |
| `matchName`                 | 赛事名称，须匹配 settings 的 `match` 字段（如「第十五届全运会通信保障」）；用于确定 headerTitle、倒计时区间与中心场馆 |
| `stadiumId` / `stadiumName` | 调试表单透传的场馆参数（配合 gameMatch 视图）                                                                         |
