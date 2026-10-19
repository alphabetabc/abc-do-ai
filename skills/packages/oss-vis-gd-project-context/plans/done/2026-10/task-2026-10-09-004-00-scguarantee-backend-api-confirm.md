# Task · 2026-10-09-004-00-scguarantee-backend-api-confirm

## 任务元信息

- 编号：`task-2026-10-09-004-00-scguarantee-backend-api-confirm`
- Status：已完成（2026-10-12 清单全条目闭环；落码由 006-00 / 007-00 / 008-00 承接并验收通过）
- 类型：其它（服务端沟通协调）
- 影响范围：无代码改动（结论回填 004-01 及后续卡）
- Roadmap：深圳保障屏 phase 2（004 迁移）
- 验收标准：下表全部条目拿到后端明确答复并回填「结论」列
- 前置依赖：无

---

## 目标（Goal）

004-01 迁移的接口中，凡**复用信管局原接口但原接口没有的参数 / viewItemId**，一律不擅自进代码，统一登记在本卡，由用户与服务端沟通确认后再执行。

## 待确认清单

> 状态标记：✅ 已完成（接口/字段确认+落码均闭环；仅「定稿」不算完成，不加标记）

### 一、viewPageArgs 新增参数（原信管局接口均无）

-   1. ✅ `getHomeAreaPointApi`（viewPageId `open-close-ceremonies-view` / viewItemId `competition-homepage-point`）
    - viewPageId：`open-close-ceremonies-view`
    - viewItemId：`competition-homepage-point`
    - 事项 1：✅ **数据过滤方式已定（2026-10-12）**——**前端拉全量 + 前端自行过滤**，`viewPageArgs` 保持为空 `{}`，前端不新增过滤参数
    - 事项 2：✅ **类型字段形态已定（2026-10-12）**——`type` 即联动参数，取值为**汉字**（会场/参访区/酒店/交通枢纽/其它），**无需服务端新增 `areaType` 字段**；前端已按此调整：mock `type` 改汉字并移除 `areaType` 占位、`mapPointTypes` value 改汉字、地图/轮巡过滤统一按 `d.type`（中文名）匹配
    - **005 三联动结论（2026-10-12）**：类型过滤归属**前端**——拉全量 + 前端按 `type`（汉字）过滤（top-type-filter 广播 `areaTypeFilter`，地图图层与轮巡在前端过滤），`viewPageArgs` 不加类型参数，现有前端实现即为最终方案，无需调整
    - 现状：前端透传 `type` 不丢弃；区域图片采用管局做法走前端静态资源目录拼接，不依赖服务端
-   2. ✅ `getWeatherDataApi`（viewPageId `open-close-ceremonies-view` / viewItemId `ceremonies-weather`）
    - 结论：**已完成（2026-10-12）**——前端不传参（viewPageArgs 为空 `{}`），由服务端控制按深圳出数，不新增 area/areaName 参数
    - 现状（定稿）：接口层保持不传参，无遗留改动

### 二、新增接口需求（信管局无对应接口）

#### 首屏（home）

-   1. ✅ 「国际漫入 TOP5」：需要国际漫入用户数 TOP5 国家（或地区）排行数据 --- **接口已定稿（2026-10-12，api-doc.md 六）**
    - viewItemId：`intl-roam-top5`；请求参数：无；响应 `rows[{ countryName, userNbr }]`
    - 落码：`web/services/shenzhen-communication-guarantee/home/section-left.ts`（面板在首屏左侧通信服务内）→ 已建卡 `task-2026-10-12-008-00` 执行
-   2. ✅ 「重保区域业务」：需要重保区域业务汇总数据（2G/4G/5G 基站与小区、通感站、重保专线），单独接口 --- **接口已定稿（2026-10-12）**
    - 接口文档：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「一、重保区域业务」
    - viewItemId：`key-guarantee-area-business`；请求参数：无
    - 响应：`rows[{ type, num, retireNum }]`，type 字典 2G基站/2G小区/4G基站/4G小区/5G基站/5G小区/通感站/重保专线
    - mock 已建：`public/static/mock/shenzhen-communication-guarantee/key-guarantee-area-business.json`
    - 落码：`home/section-right.ts`
    - **已落码（2026-10-12，`task-2026-10-12-006-00` 验收通过）**：接口 `getKeyGuaranteeAreaBusinessApi` + widget 接数完成；env key `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-guarantee-area-business`（viewItemDataTemplate 树形模板，详见 design 001-home/004-area-business/data-model.md）

#### 区域屏（area）

-   3. ✅ 「左右模块」：无线规模（基站/小区）与趋势指标（RRC/在线用户/接通率/利用率）全部**不复用信管局接口**，走新增接口（参数：区域、networkType 4G/5G；趋势近 12 小时、2h 粒度）--- **接口已定稿（2026-10-12，同上 api-doc.md）**
    - 注：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md` 即服务端研发提供的接口文档，以其为权威来源
    - 4G/5G 业务：viewItemId `key-guarantee-area-4g-business` / `key-guarantee-area-5g-business`，参数 `area`（adcode），响应 `rows[{ type, num, retireNum, retireRate }]`
    - 4G/5G 趋势：viewItemId `key-guarantee-area-4g-trend` / `key-guarantee-area-5g-trend`，参数 `area` + `time`（截止时间，起始当天 0 点），响应 `rows[{ name, x, y1 }]`
    - **已落码**：`getAreaNetworkBusinessApi`（area/section-left.ts）+ 趋势接口（area/trend.ts）；页面组件 network-business / trend-indicators（with-4g / with-5g）已接数
-   4. ✅ 「应急保障前置资源」：**已关闭（2026-10-12 用户裁决）**——服务端自行处理，前端不再讨论、不改动；现有区域屏前置资源实现维持现状
-   5. ✅ 「地图-区域图层-区域tooltip-区域轮巡」：**接口已定稿（2026-10-12，api-doc.md 七）**
    - viewItemId：`map-area-layer`；参数 `areaType`（201-205 逗号分隔）+ 可选 `area`；响应 `rows[{ areaName(区域编码), areaId, areaTypeName, picUrl(区域名称) }]`，无经纬度
    - 落码（最终裁决 2026-10-12）：打点 + tooltip 维持 `competition-homepage-point`，**区域轮巡两屏同源**切该接口 → 已建卡 `task-2026-10-12-008-00` 执行并验收通过（三个开放问题均已关闭：areaId 与 intId 同套 / areaId 可当区域屏 area 参数 / 缩略图保留前端静态资源现状）
- 落码（区域屏接口单文件）：`web/services/shenzhen-communication-guarantee/area/api.ts`（不分左右）
    - 左右模块新增接口（区域屏第 3 条）落这里
    - 应急保障前置资源（区域屏第 4 条，若复用 `getEmergencyResourceApi` 或改用 game-match，待定后落这里）

#### 落码通用约定

- 首屏（home）接口：`web/services/shenzhen-communication-guarantee/home/`，按面板分文件组织
    - `center.ts`：顶部统计栏（getTopIndicatorsApi）+ 地图打点/区域轮巡（getHomeAreaPointApi）+ 应急资源（getEmergencyResourceApi）
    - `section-left.ts`：通信服务（个人/家庭/政企 getPersonalBusinessApi / getFamilyBusinessApi / getGEBusinessTop4Api）
    - `section-right.ts`：重保区域业务（首屏第 2 条）
- 每个新增接口落码时同步：mock（`public/static/mock/shenzhen-communication-guarantee/`）+ env key（若需 viewItemDataTemplate）

### 三、数据字段确认

-   1. ✅ 顶部统计栏类型字典
    - viewPageId：`open-close-ceremonies-view`
    - viewItemId：`competition-homepage-statistics`
    - 事项：接口形态复用信管局，但类型字典需服务端按深圳屏配置出数：会场 / 参访区 / 酒店 / 交通枢纽 / 其它（信管局原字典为重保场馆那套，与此不同）
    - 结论：**已对齐（2026-10-12）**——服务端按深圳屏 5 类型字典出数，`type` 取值与 `getHomeAreaPointApi` 同一套汉字字典，前端无代码改动
    - 现状：前端按上述 5 类型做兜底模板，服务端未配置时该面板显示 5 个 0

## 不做清单

- 不涉及任何代码改动（参数/标识的落码在 004-01 及后续卡执行）

## 步骤

1. 用户拿本卡清单与服务端沟通（**等待用户**）
2. 结论回填本卡 + 更新 004-01 的 `@pending`/`@notice` 标注 + design 000-overview §6 接口清单
3. 归档

## 关联

> - 相关 task：`./task-2026-10-09-004-01-scguarantee-services-migrate.md`
