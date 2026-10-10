# Task · 2026-10-09-004-01-scguarantee-services-migrate

## 任务元信息

- 编号：`task-2026-10-09-004-01-scguarantee-services-migrate`
- Status：已完成
- 类型：编码
- 影响范围：`web/services/shenzhen-communication-guarantee/`（新建）、`public/static/mock/shenzhen-communication-guarantee/`（新建）、天气卡取数（`sub-pages/components/weather-card/`）
- Roadmap：2026 年深圳重要通信保障屏建设（PM 素材 2026-10）
- 验收标准：见下方验收 checklist（A1–A3）
- 前置依赖：task-003 骨架屏已完成

---

## 目标（Goal）

把信管局取数层物理复制到深圳屏并改造：`getViewItemDataApi` 兜底链（默认值 → fallback url → localMockUrl），viewPageId 复用信管局 `open-close-ceremonies-view`（整体复用确认见 004-00 卡），按原 004 卡「§5 接口参数差距评估」逐接口落地参数/viewItemId/mock，天气卡接上真实取数。**只做接口层，不含业务组件。**

## 步骤（执行计划）

1. 复制 `web/services/info-management-bureau/` 取数范式到 `web/services/shenzhen-communication-guarantee/`
2. 按差距表（§5，全文迁移自原 004 卡）逐接口改 viewPageId/viewItemId/viewPageArgs
3. `public/static/mock/shenzhen-communication-guarantee/` 全量 json 就位
4. 天气卡（weather-card 占位）接入 `getWeatherDataApi`（固定深圳地市），替换写死 mock

## 功能列表

- F1：接口层（viewPageId/viewItemId/viewPageArgs/mock）按差距评估表落地
- F2：天气卡接数（本卡唯一接数组件，其余组件在 004-03/004-04 接）

## 不做清单

- 业务 widget 组件迁移（004-03/004-04）
- 后端真实接口对接（全 mock）

## 业务规则

- 复用 = 物理复制，禁止跨模块 import
- 接口层全部走 `getViewItemDataApi`（baseUrlType `sceneViewService`，兜底链 localMockUrl）
- 新增接口（信管局无对应）不造任何 viewItemId/函数/签名/返回形状，只留占位注释，需求统一挂 004-00 卡

## 验收 checklist

- [x] A1：各接口 mock 数据可经服务层取到（兜底链工作，浏览器网络面板确认 localMockUrl 生效）—— 用户 review 中已通过
- [x] A2：天气卡渲染接口返回的深圳天气数据
- [x] A3：任务卡 + design 文档回填（lint 用户明确不需要跑）

## 最终落地清单（实现结果）

**已定义接口（7 个函数，viewPageId 均 `open-close-ceremonies-view`）**：

- `home/center.ts`：`getTopIndicatorsApi`（`competition-homepage-statistics`）、`getHomeAreaPointApi`（`competition-homepage-point`）、`getEmergencyResourceApi`（`competition-homepage-resources`）
- `home/section-left.ts`：`getPersonalBusinessApi` / `getFamilyBusinessApi` / `getGEBusinessTop4Api`（`chbn-business-personal` / `chbn-business-home` / `chbn-business-government`）
- `components/index.ts`：`getWeatherDataApi`（`ceremonies-weather`）

**占位（零自造，待服务端定义后落码，见 004-00 卡）**：

- `home/section-left.ts`：国际漫入 TOP5（004-00 二-1）
- `home/section-right.ts`：重保区域业务（004-00 二-2）
- `area/api.ts`：区域屏接口层（004-00 二-3 / 二-4 / 二-5）

**mock（7 个 json）**：top-indicators / home-area-point / emergency-resource / chbn-business-personal / chbn-business-home / chbn-business-government / weather

## 变更记录

| 日期       | 变更                                                                                                                                                                                                                                    | 原因                                                                           | 是否重新过硬门槛① |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------- |
| 2026-10-09 | 从原 004 迁移卡拆出为 004-01                                                                                                                                                                                                            | 用户要求任务拆小                                                               | 是                |
| 2026-10-09 | viewPageId 由自造的 `shenzhen-communication-guarantee-view` 改回复用信管局 `open-close-ceremonies-view`；区域屏接口撤掉自造的 `networkType`/`timeRange`/`granularity` viewPageArgs 参数（`@pending` 标注）；viewPageId 常量内联到各接口 | 用户明确：复用接口则原样复用 viewPageId/viewPageArgs，原接口没有的必须标记挂起 | 否（范围内修正）  |
| 2026-10-09 | 新增占位接口 `getRoamingTop5Api` 的 viewPageId/viewItemId 改为 `____unknown-` 前缀，明确标识待后端分配                                                                                                                                  | 用户调整：新增接口标识未定，须显式标记未知                                     | 否（范围内修正）  |
| 2026-10-09 | 应急资源接口切换：`ceremonies-guarantee-resources`（两态）→ 信管局 home `competition-homepage-resources` 范式（单值 num，4 类含发电车），mock 同步新形状；4 类字典信管局均有出数先例，不登记 004-00                        | 与深圳屏面板展示形状对齐                                                       | 否（范围内修正）  |
| 2026-10-09 | 区域屏左右模块确认不复用信管局接口（服务端沟通），全部走新增接口（004-00 二-3）；原 §5 差距表第 6/7 条（基站/小区/趋势复用）作废                                                                      | 用户与服务端沟通确认                                                           | 否（范围内修正）  |
| 2026-10-09 | **零自造 API 纪律落地**：`getRoamingTop5Api` / `getSensingStationApi` / area 三函数 / 基站 / 小区 / 专线等函数及 `____unknown-` 占位全部删除，只留文件头占位注释；相应 mock 8 个删除；env 键清理（残留键均有引用）                | 用户明确："我们不造任何 api"                                                    | 否（范围内修正）  |
| 2026-10-09 | widget 目录 `chbn-business` → `communication-service`，设计文档目录同步（002-chbn-business → 002-communication-service）；viewItemId `chbn-business-*` 沿用（事实标识）                                                               | chbn 是信管局命名残留，深圳屏面板名为「通信服务」                              | 否（范围内修正）  |
| 2026-10-09 | 服务层 `@notice`/004-00 引用注释全部清除（代码注释只写"这是什么"，待办只进 task）                                                                                                                                        | 用户纪律                                                                       | 否（范围内修正）  |

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-09 | 用户   |
| ② 实现验收 | 已通过 | 2026-10-09 | 用户   |

---

## 关联

> - 原卡：task-2026-10-09-004-shenzhen-communication-guarantee-migrate（已拆分删除）
> - 新增接口需求统一挂：`../../plans/task-2026-10-09-004-00-scguarantee-backend-api-confirm.md`（归档后位于 plans/ 根）
> - 后续：004-02（模块框样式）、004-03（首屏组件）、004-04（区域屏组件）
> - 设计文档：`design/modules/shenzhen-communication-guarantee/`
