---
name: 'noc-shaanxi-second-hazard-rectify-data-format'
version: '1.1'
updated: '2026-09-09'
description: 'risk-resolve-plan（隐患整改计划）服务端数据格式：响应结构、rows 字段与数据形态要点。'
---

# risk-resolve-plan 服务端数据格式（隐患整改计划）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.1（从 hazard-data-format.md §三 迁入） |
| 最后更新 | 2026-09-09 |

数据来源：header 元信息与 mock `public/static/mock/management-overview-second/risk-resolve-plan.json`。

---

## 一、响应外层结构

走 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），参数 `{ viewItemId: 'risk-resolve-plan', viewPageId: 'noc-module-oriented-left-page', viewPageArgs }`，viewPageArgs 直接透传 zoneSelect（含 zoneId/zoneLevel）：

```
{
  code: 200,
  data: {
    viewPageId: 'noc-module-oriented-left-page',
    viewItemId: 'risk-resolve-plan',
    viewItemGroupId: 'risk-resolve-planGroup',
    viewItemData: {
      title: '隐患整改计划',
      header: { counterFieldList: [...] },  // 字段元信息（8 个 counter 字段）
      rows: [ ... ]
    }
  }
}
```

组件取数固定为 `data.viewItemData.rows`；服务层保留了注释掉的 `localMockUrl`（`/static/mock/management-overview-second/risk-resolve-plan.json`，未启用）。

---

## 二、rows 字段（均为 String 类型，每字段附带 `xxx_format` 镜像字段）

| 字段 | 说明 | 取值 |
| --- | --- | --- |
| indicatorId | 指标 id | 如 '100064'~'100103' |
| indicatorName | x 轴类目（专业名） | 传输网 / 动环 / 核心网 / 网络云 / IP承载网 / 无线接入网 / CMNET / 安全 / 内容网 / 网管系统（10 个专业） |
| moduleId | 模块 id，converter 拆分依据 | '4' 近三个月整改计划 / '5' 本月整改计划 |
| moduleName | 模块名 | 近三个月整改计划 / 本月整改计划 |
| indicatorGroup | 指标组 | '1' 计划 / '2' 已完成 |
| indicatorGroupName | 指标组名 | 计划 / 已完成 |
| indicatorValue | 数值（组件内 `Number()` 转换） | 计数 |
| indicatorUnit | 单位 | '个' |

---

## 三、数据形态要点（mock 确认）

- 每模块（moduleId）为 10 专业 × 2 指标组 = 20 行，两个模块共约 40 行；「计划」与「已完成」按 indicatorGroup 区分，**同专业的两行靠 indicatorName 对齐**（无显式关联键）。
- **数据语义与 UI 的对应关系**：moduleId '4' 是「近三个月整改计划」（converter 拆为 data3），moduleId '5' 是「本月整改计划」（data1）。
- 组件端 `indicatorGroup === '1'` 取 x 轴 + 「计划」系列，else（即 '2'）归入「已完成」系列——两系列的行序由服务端保证一致（mock 中「已完成」行为倒序排列，依赖专业名对齐而非顺序对齐）。
- 新增「整体计划安排」分类时，可复用此结构（新增一个 moduleId + 对应 rows），或按需求另定半年粒度数据形态。

---

## 四、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：从 hazard-solve / hazard-rectify README 的数据格式章节抽出，独立成文 |
| v1.1 | 从 hazard-data-format.md §三 迁入本模块目录，独立成文 |
