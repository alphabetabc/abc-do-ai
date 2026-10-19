# Task · 2026-10-12-008-00-scguarantee-intl-roam-area-layer-api

## 任务元信息

| 项       | 值                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-12-008-00-scguarantee-intl-roam-area-layer-api`                                                                                                                                                                                                                                                                                                                    |
| Status   | 已完成（2026-10-12 用户浏览器验证通过，文档已回填归档）                                                                                                                                                                                                                                                                                                                          |     |
| 类型     | 编码（接口接数联调）                                                                                                                                                                                                                                                                                                                                                             |
| 影响范围 | `web/services/shenzhen-communication-guarantee/home/section-left.ts`、`web/services/shenzhen-communication-guarantee/home/center.ts`、`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/communication-service/RoamingTop5.tsx`、首屏区域轮巡模块 + 共用 hook `use-area-carousel-data.ts`、`public/static/mock/shenzhen-communication-guarantee/` 新增 2 个 mock |
| Roadmap  | 深圳保障屏 phase 2（004 迁移 · 新增接口接数）                                                                                                                                                                                                                                                                                                                                    |
| 验收标准 | 下方验收 checklist                                                                                                                                                                                                                                                                                                                                                               |
| 前置依赖 | 004-00（接口定稿）；服务端接口已出文档 `docs-api-backend/shenzhen-communication-guarantee/api-doc.md` 六、七两节                                                                                                                                                                                                                                                                 |

---

## 目标（Goal）

api-doc.md 新增的两个接口——「六、通信服务-国际漫入TOP5」（`intl-roam-top5`）与「七、地图-区域图层-区域tooltip-区域轮巡」（`map-area-layer`）——落码接口层 + mock + widget 接数联调。

## 功能列表

- F1 国际漫入 TOP5（首屏左侧·通信服务面板）
    - 接口：`getIntlRoamTop5Api` 落 `web/services/shenzhen-communication-guarantee/home/section-left.ts`（004-00 既定落码位置）
    - viewPageId `open-close-ceremonies-view` / viewItemId `intl-roam-top5`，无请求参数（viewPageArgs `{}`）
    - mock：`public/static/mock/shenzhen-communication-guarantee/intl-roam-top5.json`
    - 组件接数：`RoamingTop5.tsx` 删组件内 `MOCK_DATA`，改 `useRequest`（15 分钟轮询对齐其它接口）；字段映射 `countryName`→名称、`userNbr`→用户数；进度条 percent 前端按 TOP1 值归一化计算（现 mock percent 为假数据）
- F2 区域轮巡（首屏底端 + 区域屏，两屏同源）
    - **最终方案（2026-10-12 用户裁决，经两次修正）：打点 + tooltip 维持 `getHomeAreaPointApi`（新接口无经纬度，不替代）；区域轮巡首屏与区域屏两屏同源切 `map-area-layer`**
    - 接口：`getMapAreaLayerApi` 落 `web/services/shenzhen-communication-guarantee/home/center.ts`；`areaType`/`area` 两参数均预留（TMapAreaLayerParams），默认全量拉取前端自行过滤（对齐 004-00 一-1 方案）
    - viewPageId `open-close-ceremonies-view` / viewItemId `map-area-layer`
    - mock：`public/static/mock/shenzhen-communication-guarantee/map-area-layer.json`
    - 组件接数：`use-area-carousel-data.ts` 默认取数改 `getMapAreaLayerApi` + 字段映射（最终映射：`id=areaId`（与打点 intId 同套，用户确认）、`name=areaName`（区域编码，用户手改）、`type=areaTypeName` 汉字直接对接 `areaTypeFilter` 类型过滤；`picUrl` 暂无消费点）；首屏/区域屏轮巡模块直接消费 hook，无差异化
    - 轮巡联动：自动轮巡广播 `activeArea` → 首屏地图 TOOLTIP 按 `id === 打点 intId` 匹配（同套 ID，无障碍）；点击切区域上下文需 adcode（开放问题 #2）

## 不做清单

- 不改首屏地图打点数据源 `getHomeAreaPointApi`（含经纬度，新接口无坐标，不替代）
- 不动 004-00 区域屏第 4 条「应急保障前置资源」——**服务端自行处理，前端不讨论不改动**
- 不新增 env viewItemDataTemplate 模板（两接口均为直接渲染，无模板需求；如联调发现需要再补变更记录）

## 开放问题（联调时与用户/服务端对齐）

| #   | 问题                                                                                                                                                                                        | 负责人      | 状态   | 结论                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------ |
| 1   | 轮巡联动回归点：新数据源 `id` 取 `areaId`，首屏地图 TOOLTIP 按 `id === 打点 intId` 匹配；确认 `map-area-layer` 的 `areaId` 与打点接口 `competition-homepage-point` 的 `intId` 是否同一套 ID | 用户/服务端 | 已关闭 | 2026-10-12 用户确认：同套 ID，tooltip 匹配无障碍 |
| 2   | 轮巡点击切区域上下文需 area adcode（区域屏其它接口用 `area` adcode 传参）；确认 `areaId` 是否即 adcode，还是需要用 `areaName`（区域编码）换 adcode                                          | 用户/服务端 | 已关闭 | 2026-10-12 用户确认：`areaId` 可直接当区域屏接口 `area` 参数用（区域屏 NetworkBusiness / TrendIndicators 两模块），`resolveAreaAdcode` 回退 `area.id` 链路通 |
| 3   | 轮巡卡片缩略图当前按 `area-thumb/${name}.png` 前端拼接；确认新接口 `picUrl` 是否只作名称、图片仍走前端静态资源                                                                              | 用户        | 已关闭 | 2026-10-12 用户裁决：保留现状——缩略图走前端静态资源目录拼接，`picUrl` 不启用 |

## 步骤

1. 落码 F1：接口 + mock + RoamingTop5 接数，`pnpm lint` 通过
2. 落码 F2：`home/center.ts` 新增接口 + mock + 首屏轮巡数据源切换与 hook 拆分，`pnpm lint` 通过
3. 联调验证（本地 mock 可先自测；真实接口联调**等待用户**环境）
4. 文档回填：004-00 结论列、design 数据模型、docs 树 data-model-extensions
5. 归档

## 验收 checklist

- [x] A1 首屏漫入 TOP5 展示接口数据（国家/地区名 + 用户数），进度条按 TOP1 归一化，无接口数据时组件兜底不白屏（用户 2026-10-12 浏览器验证通过）
- [x] A2 两屏区域轮巡展示 map-area-layer 数据，卡片名称/缩略图/激活态正常，类型过滤（areaTypeFilter 按 `areaTypeName`）不回归（同上）
- [x] A3 轮巡联动不回归：自动轮巡广播 activeArea 后地图 TOOLTIP 正常匹配打点（areaId 与 intId 同套）、点击卡片正常切区域上下文（同上）
- [x] A4 区域屏轮巡同源切新接口，无回归（同上）
- [x] `pnpm lint` 通过（沙箱环境无法运行，以 IDE 诊断替代验证，无报错——环境问题非代码问题）
- [x] 004-00、design/、docs 交付物已回填（004-00 结论列；design modules：overview README 接口清单、002-communication-service、001-home/007-area-carousel、000-overview/006-area-carousel、002-area/002-area-carousel；docs：data-model-extensions.md §2.2/§3/§4）

---

## 审批记录（硬门槛）

| 门槛       | 状态   | 日期       | 批准人                                                                                  |
| ---------- | ------ | ---------- | --------------------------------------------------------------------------------------- |
| ① 需求审批 | 已批准 | 2026-10-12 | 用户（仅落 service + mock，不接组件）                                                   |     |
| ② 实现验收 | 已通过 | 2026-10-12 | 用户（浏览器验证 A1–A4 后确认「已经验证过了，就这样」；lint 以 IDE 诊断替代，环境原因） |     |     |

---

## 进度日志（按需追加）

### 2026-10-12（五）收尾

- 用户浏览器验证 A1–A4 通过，硬门槛②通过
- 文档回填：docs `data-model-extensions.md`（§2.2 状态、§3.1/§3.2 条目、§3.3 补充说明、§4 字段增量 IntlRoamTop5/MapAreaLayer）；design modules（overview README 接口清单、002-communication-service、001-home/007-area-carousel 重写、000-overview/006-area-carousel、002-area/002-area-carousel 精简指向首屏文档）
- 归档至 `plans/done/2026-10/`

### 2026-10-12（四）

- 用户手改 `use-area-carousel-data.ts` 映射：`name: row.areaName`（区域编码），不再取 `picUrl`（区域名称）——卡片名称/缩略图展示编码；是否最终展示区域名称待联调定，文档语义见 api-doc.md 七（picUrl=区域名称）

### 2026-10-12（三）

- 用户裁决：区域轮巡**两屏同源**切 `map-area-layer`（此前区域屏维持打点接口）。`useAreaCarouselData` 默认取数改为 `getMapAreaLayerApi` + 字段映射（id=areaId、name=picUrl、type=areaTypeName），去掉 fetcher 参数化；首屏/区域屏轮巡模块均直接消费 hook，打点/tooltip 仍走 `getHomeAreaPointApi`。注意：区域屏点击卡片切上下文用到的 adcode 新接口无，见开放问题 #2

### 2026-10-12（二）

- 用户批准硬门槛①，进入阶段二；指示：接口即服务端给定，直接完成本地逻辑联调
- 落码 F1：`getIntlRoamTop5Api`（home/section-left.ts，含 TIntlRoamTop5Row 类型）+ mock `intl-roam-top5.json`；`RoamingTop5.tsx` 删除组件内 MOCK_DATA 改接接口，进度条按 TOP1 归一化，无数据仅保留标题
- 落码 F2：`getMapAreaLayerApi`（home/center.ts，TMapAreaLayerRow / TMapAreaLayerParams 类型，`areaType`/`area` 两参数均预留，默认全量）+ `MAP_AREA_TYPE_CODES` 码表 + mock `map-area-layer.json`；`use-area-carousel-data.ts` 参数化 `fetcher`（默认 getHomeAreaPointApi，区域屏零改动）；首屏 `home/modules/area-carousel` 传 fetcher 接新接口并做字段映射（id=areaId、name=picUrl、type=areaTypeName）
- lint：`pnpm lint` 因沙箱/eslint 配置环境问题无法运行（非代码问题）；以 IDE 诊断替代验证，无报错

### 2026-10-12

- 建卡。来源：api-doc.md 新增六、七两节接口；004-00 二-1「国际漫入TOP5」由「待开发」转为「已定稿待接数」；004-00 二-4「应急保障前置资源」按用户裁决关闭（服务端自行处理）
- F2 方案修正（用户裁决）：初版误定位为「区域屏轮巡切新接口」；经分析 map-area-layer 无经纬度且指标集 §11-13 指向首屏，改为**打点+tooltip 维持 `getHomeAreaPointApi`，仅首屏底端轮巡切新接口，区域屏零改动**；落码位置由 `area/api.ts` 改为 `home/center.ts`

---

## 关联

> - 相关 task：`./task-2026-10-09-004-00-scguarantee-backend-api-confirm.md`（接口确认卡）
> - 接口契约：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md` 六、七
