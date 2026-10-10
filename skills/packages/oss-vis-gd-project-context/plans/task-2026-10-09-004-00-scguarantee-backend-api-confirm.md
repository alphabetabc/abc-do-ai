# Task · 2026-10-09-004-00-scguarantee-backend-api-confirm

## 任务元信息

- 编号：`task-2026-10-09-004-00-scguarantee-backend-api-confirm`
- Status：待审批
- 类型：其它（服务端沟通协调）
- 影响范围：无代码改动（结论回填 004-01 及后续卡）
- Roadmap：深圳保障屏 phase 2（004 迁移）
- 验收标准：下表全部条目拿到后端明确答复并回填「结论」列
- 前置依赖：无

---

## 目标（Goal）

004-01 迁移的接口中，凡**复用信管局原接口但原接口没有的参数 / viewItemId**，一律不擅自进代码，统一登记在本卡，由用户与服务端沟通确认后再执行。

## 待确认清单

### 一、viewPageArgs 新增参数（原信管局接口均无）

-   1. `getHomeAreaPointApi`（viewPageId `open-close-ceremonies-view` / viewItemId `competition-homepage-point`）
    - viewPageId：`open-close-ceremonies-view`
    - viewItemId：`competition-homepage-point`
    - 事项 1：数据过滤方式待定——前端传参由后端过滤，还是前端拉全量自行过滤（当前 viewPageArgs 为空 `{}`，即拉全量）
    - 事项 2：新增 `areaType` 字段（原数据无此字段，需服务端补齐，用于 TOOLTIP 图片展示 + switchToArea 区域跳转）
    - **补充疑问（2026-10-10，005 三联动相关）**：类型过滤的**最终归属仍未定**——当前 005 前端临时实现为「拉全量 + 前端按 `areaType` 过滤」（top-type-filter 广播 `areaTypeFilter`，地图图层与轮巡在前端过滤）；若服务端结论是传参后端过滤，则 `viewPageArgs` 需加 `areaType` 参数、前端过滤逻辑改为按需请求/重新拉取。**结论出来前前端方案不动，服务端答复后按结论调整**
    - 现状：mock 已加 `areaType` 占位字段，前端透传不丢弃；区域图片采用管局做法走前端静态资源目录拼接，不依赖服务端
-   2. `getWeatherDataApi`（viewPageId `open-close-ceremonies-view` / viewItemId `ceremonies-weather`）
    - 结论：**已确认（2026-10-10）**——由服务端控制按深圳出数，前端不传参，不新增 area/areaName 参数
    - 现状（定稿）：前端不传参（viewPageArgs 为空 `{}`），依赖服务端按深圳配数，接口层保持现状不做改动

### 二、新增接口需求（信管局无对应接口）

-   1. 首屏「国际漫入 TOP5」：需要国际漫入用户数 TOP5 国家（或地区）排行数据 --- 已经服务端确认，待开发
-   2. 首屏「重保区域业务」：需要重保区域业务汇总数据（2G/4G/5G 基站与小区、通感站、重保专线），单独接口 --- 已经服务端沟通，待开发
-   3. 区域屏「左右模块」：无线规模（基站/小区）与趋势指标（RRC/在线用户/接通率/利用率）全部**不复用信管局接口**，走新增接口（参数：区域、networkType 4G/5G；趋势近 12 小时、2h 粒度）--- 已经服务端沟通，待开发
-   4. 区域屏「应急保障前置资源」：待定——可能改用信管局 game-match `ceremonies-guarantee-resources`（两态模型，viewPageArgs 传 areaName，需 env viewItemDataTemplate 模板）；注意发电车在该接口无出数先例
-   5. 落码位置约定（新增接口形态由服务端定义后落码）
    - 首屏（home）接口：`web/services/shenzhen-communication-guarantee/home/`，按面板分文件组织
        - `center.ts`：顶部统计栏（getTopIndicatorsApi）+ 地图打点/区域轮巡（getHomeAreaPointApi）+ 应急资源（getEmergencyResourceApi）
        - `section-left.ts`：通信服务（个人/家庭/政企 getPersonalBusinessApi / getFamilyBusinessApi / getGEBusinessTop4Api）
        - `section-right.ts`：重保区域业务（二-2 新增接口落这里）
        - 国际漫入 TOP5（二-1）落 `section-left.ts`（面板在首屏左侧通信服务内）
    - 区域屏（area）接口：`web/services/shenzhen-communication-guarantee/area/api.ts`（单文件，不分左右）
        - 左右模块新增接口（二-3）落这里
        - 应急保障前置资源（二-4，若复用 `getEmergencyResourceApi` 或改用 game-match，待定后落这里）
    - 每个新增接口落码时同步：mock（`public/static/mock/shenzhen-communication-guarantee/`）+ env key（若需 viewItemDataTemplate）

### 三、数据字段确认

-   1. 顶部统计栏类型字典
    - viewPageId：`open-close-ceremonies-view`
    - viewItemId：`competition-homepage-statistics`
    - 事项：接口形态复用信管局，但类型字典需服务端按深圳屏配置出数：会场 / 参访区 / 酒店 / 交通枢纽 / 其它（信管局原字典为重保场馆那套，与此不同）
    - 现状：前端按上述 5 类型做兜底模板，服务端未配置时该面板显示 5 个 0

## 不做清单

- 不涉及任何代码改动（参数/标识的落码在 004-01 及后续卡执行）

## 步骤

1. 用户拿本卡清单与服务端沟通（**等待用户**）
2. 结论回填本卡 + 更新 004-01 的 `@pending`/`@notice` 标注 + design 000-overview §6 接口清单
3. 归档

## 关联

> - 相关 task：`./task-2026-10-09-004-01-scguarantee-services-migrate.md`
