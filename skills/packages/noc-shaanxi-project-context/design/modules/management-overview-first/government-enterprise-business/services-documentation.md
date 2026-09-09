---
name: 'noc-shaanxi-first-government-enterprise-business'
module: 'government-enterprise-business'
skill: 'noc-shaanxi-project-context'
version: '1.0'
updated: '2026-09-09'
description: '政府企业业务模块服务层（web/services/management-overview-first/government-enterprise-business/）详细文档：接口清单、转换逻辑、调用关系。'
---

# 政府企业业务服务层详细文档（services）

> **所属父技能**：noc-shaanxi-management-overview-first
> **本文档位置**：`noc-shaanxi-project-context/design/modules/management-overview-first/government-enterprise-business/services-documentation.md`

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0       |
| 最后更新 | 2026-09-09 |

---

## 一、目录结构

```
web/services/management-overview-first/government-enterprise-business/
├── index.ts    # 纯 re-export：export * from './overview' / './part'
├── overview.ts # 概览数据接口（overview-v2 椭圆轨道顶部指标）
└── part.ts     # 详情数据接口（detail 页 LeftPart / RightPart）
```

三个文件均走第一屏主通道 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`baseUrlType: 'sceneViewService'`），requestId 由 `../request-api.ts` 的映射表（脚本生成）解析。viewPageId 全部为 `noc-business-oriented-right-page`。**无 localMockUrl、无轮询**。

---

## 二、接口清单

| 服务函数                      | 所在文件    | viewItemId                  | requestId | 入参（viewPageArgs）              | 出参形态                  |
| ----------------------------- | ----------- | --------------------------- | --------- | --------------------------------- | ------------------------- |
| getGovEnterBusinessTopDataApi | overview.ts | government-business-summary | 2452      | `{ zoneLevel, zoneId }`           | 按 busiType 分组的数组    |
| getLeftPartDataApi            | part.ts     | government-business-scale   | 2455      | `{ zoneLevel, zoneId, busiType }` | defaultConverter 或自定义 |
| getRightPartDataApi           | part.ts     | government-business-quality | 2458      | `{ zoneLevel, zoneId, busiType }` | defaultConverter 或自定义 |

错误兜底统一为 `runPromise` 包裹 + `if (err) return []`。

---

## 三、转换逻辑

### 3.1 getGovEnterBusinessTopDataApi（overview.ts）

converter 从 `data.viewItemData.rows` 取原始行后，按 `item.busiType` 用 `Map` 分组：

-   每组生成 `{ id: busiType, imageId: '[government-business-summary]:{busiType}', businessTypeName: busiTypeName, left, right }`。
-   组内每行转为 `{ id: '[create]:{index}-{busiType}', ...item, name: indicatorName, value: indicatorValue, unit: indicatorUnit }`，**前两条依次填入 left / right**，第三条起被丢弃。
-   即：每类政企业务最多展示 2 个汇总指标（left + right）。

返回类型 `TResult` 为 `Array<{ id, imageId, left: {id, name, value, unit}, right: {...} }>`。

### 3.2 getLeftPartDataApi / getRightPartDataApi（part.ts）

-   两个函数结构完全一致，仅 viewItemId（scale / quality）不同。
-   converter 可由调用方通过 `opt.convertor` 注入，未注入时走 `defaultConverter`（`web/services/request` 导出，行 → 数组的通用转换）。
-   入参比概览接口多一个 `busiType`（当前选中的业务类型，如物联网 / 专线 / 5G 专网 / 企业宽带 / IDC / ICT），驱动详情页按业务刷新。

---

## 四、调用关系（与页面模块的对应）

| 服务函数                      | 页面消费方（`web/pages/management-overview-first/modules/government-enterprise-business/`） |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| getGovEnterBusinessTopDataApi | `overview-v2/`（首页概览，椭圆轨道各业务节点的 left/right 指标）                            |
| getLeftPartDataApi            | `detail/multi-part/` LeftPart（业务规模），转换逻辑常经 `presets.ts` 注入 convertor         |
| getRightPartDataApi           | `detail/multi-part/` RightPart（业务质量），转换逻辑常经 `presets.ts` 注入 convertor        |

> 页面侧具体调用点（useRequest / refreshDeps 等）详见同目录 `overview-v2-documentation.md` 与 `detail-documentation.md`。

---

## 五、扩展指南

-   新增政企业务相关接口时：沿用同目录模式——`getViewItemDataApi` + `getViewItemDataRequestId({ viewPageId, viewItemId })` + `runPromise` 错误兜底。
-   requestId 映射表 `request-api.ts` 为脚本生成，新增 viewItemId 前需先确认数据方案侧已生成对应条目，否则 `getViewItemDataRequestId` 会因 key 不存在而抛错（未确认脚本更新流程）。
-   转换逻辑优先放在 `presets.ts`（配置驱动原则），通过 `convertor` 参数注入，不在服务层硬编码业务布局。

---

## 六、版本演进说明

| 版本 | 关键变更                                                             |
| ---- | -------------------------------------------------------------------- |
| v1.0 | 初始版本：基于源码梳理建立服务层文档（接口清单、转换逻辑、调用关系） |
