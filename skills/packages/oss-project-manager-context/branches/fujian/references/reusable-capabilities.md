# reusable-capabilities.md · 可复用能力清单

> 真源：每条附真实路径与使用方式。develop 基线 2026-11-19 核对，fujian 状态 2026-11-20 diff 复核（task-004/005）。新需求优先复用，避免再造。

## 前端 Excel 导出

`exportExcel(columns, dataSource, fileName, filter = [])` — `src/pages/common/export.js`（xlsx 库）。filter 传 dataIndex 数组只导出勾选列；列头取 item.title、数据取 item[dataIndex]，不支持 render。纯前端拼文件，大数据量卡 UI；后端导出走 netWork/export* 接口（见 api-catalog.md）。

## 表格 / 虚拟表格

oss-ui 的 VirtualTable：new-project、quick-project、system-options、resource-search 列表均使用（如 `src/pages/new-project/index.jsx`、`src/pages/system-options/index.jsx`）。用法参照任一现有页面。

## 定时器（页面可见性感知）

`initTimer(callback, interval, needPreExecute)` — `src/common/timer/index.js`。统一 Timer 类：start/restart/pause/clear/getStatus，自动监听 visibilitychange（隐藏暂停、可见恢复，手动暂停不被覆盖）；导出 interval.second/minute/hour。home-page 300 秒刷新即用它。

## 请求通道

- `proxy` — `src/common/api/index.js`（createWebService，支持 mock 改写与 sqlm 驼峰转换）。
- `request` — `src/common/api/request.js`（createWebRequest）。
- `dataService` — `src/common/services/dataService.js`：`getData(sqlId, ...)` 走 sqlm，sqlId 定义在 `src/common/services/configs.js`（75 条，使用情况见 api-catalog.md）。

## hox 共享状态模型

- `useLoginInfoModel`（默认导出）— `src/hox/index.js`：userName/userId/userInfo/container/systemInfo。
- `useEnvironmentModel` — 同文件，经 oss-web-common `useEnvironment` 加载 environment.json（CONFIG_HOST 或本地 MICRO_APP_URL，由 CONFIG_LOCAL 开关决定，见 `src/hox/index.js` L59~L62）。
- `userInfoMap` — `src/hox/projectUserInfo.js`：userName/userId/zones/isAdmin（App.js token 登录后写入）。
- 消费方式：函数组件 `useXxxModel()`；类组件 `withModel([...], mapper)`（示例见 `src/App.js`）。

## 微前端全局状态桥

`src/share/actions.js`（单例）：`onGlobalStateChange / setGlobalState / postMessage`，主应用注入（见 `src/index.js` render）。主题切换示例 `changeTheme` 在 `src/App.js`。

## 通用组件（src/components/）

| 组件 | 路径 | 用途 |
| --- | --- | --- |
| PageContainer | src/components/page-container/index.tsx | 页头容器（oss-ui PageHeader 封装，GridContent 控制宽度） |
| ErrorBoundary / Exception | src/components/error-boundary/index.jsx、exception/index.js | 错误边界与兜底页 |
| LocaleProvider | src/components/locale-provider/index.js | i18n + antd locale，localePath=constants.LOCALES_PATH |
| UserDrag | src/components/user-drag/index.jsx | react-beautiful-dnd 拖拽排序列表（allOptionsList + onChange） |
| TreasuryAuthFlowAnhui | src/components/treasury-auth-flow-anhui/index.jsx | 安徽 4A 金库认证流（getAccount→getTreasuryStatus→remoteFirstAuth→remoteSecondAuth） |

## 工具

- `makeCRC32` — `src/common/utils/genId.js`（CRC32 哈希）。
- 正则集 — `src/common/formatReg.js`、`src/common/utils/formatReg.js`。
- i18n 实例 — `src/common/locales.js`（react-intl-universal 再导出）。
- 全局事件 — `src/common/global-message/index.ts`（GlobalMessage on/off/trigger，用于 qiankun 激活态广播）。

## 审批 / 网元选择 / 区域级联 / 导入导出（业务级可复用）

- 审批：`src/pages/new-project/control/project-audit/`（与 project-auditgb 两套）；接口 project/approval、project/approval/judge。
- 网元选择/搜索：`new-project-gcss/search-gcss/index.jsx`、`new-project-fgss/search-fgss/index.jsx`（sqlId 检索网元，含板卡/端口/ONU 层级）。
- 区域级联：`appointment/options` 的 parameterName='region'（resource-search 用法，取 children 为城市）。
- 网元导入导出：`src/pages/new-project/upload/index.jsx`（下载模板→上传→错误 Excel 下载→confirmImport→revoke 全流程），接口 netWork/*。
- 数据转换：`src/pages/new-project/model/extractFun.js`（neInfoConverter、neInfoLKConverter、listCycleDispose）。⚠️ fujian 大改：新增 calculateCycleStartDate/EndDate、calculateDiffHour、calculateCycleProjectStartTime/EndTime 等周期计算函数族，neInfoConverter 带 selectValue 参数——复用前须现场重读。校验 `model/checkFun.js`（fujian 亦有小改）。注意 quick-project 下有同名复制分叉版本。

## 本仓不存在的能力（勿假设）

- 文件上传通用组件（仅 new-project/quick-project 的 upload 业务页，基于 oss-ui Upload）。
- 按钮级权限控制组件（仅 App.js 的 isAdmin 布尔与主应用注入）。
- redux 实际 store：依赖在 package.json（redux ^4.0.5、redux-saga ^1.1.3、redux-actions、redux-thunk、react-redux），但全仓 grep 无 createStore/createSagaMiddleware/connect( 调用——**代码中未实际使用 redux**，AGENTS.md「三套并存」按现状应理解为 hox（实际使用）+ redux/unstated-next（仅依赖声明，unstated-next 亦无 import）。

## 配置开关（environment.json 注入）

经 `useEnvironmentModel` 读取，本仓实际消费的 key（源码确认）：`timeout`、`serviceDiscovery`、`exportUrl`、`tokenUrl`、`userUrl`、`default`（baseUrlType 组）、`homeQueryConfig`（首页查询时间窗）、checkDuplicateConfig、isSpecifyTimeConfig、isMakeAppPointEditConfig、isDisruptProjectConfig、longTimeMemoConfig、eomsIdConfig、productVersion（new-project，详见 modules/003）。新增开关沿用 environment.json + useEnvironmentModel 通道，勿另建配置文件。
