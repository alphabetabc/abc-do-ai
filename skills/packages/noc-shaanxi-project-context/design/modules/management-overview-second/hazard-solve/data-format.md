---
name: 'noc-shaanxi-second-hazard-solve-data-format'
version: '2.0'
updated: '2026-09-15'
description: 'risk-resolve（隐患解决情况）与 risk-detail（隐患下钻详情）服务端数据格式：响应结构、rows 字段与 bar3d-line 组件加工逻辑。'
---

# risk-resolve / risk-detail 服务端数据格式（隐患解决情况）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v2.0       |
| 最后更新 | 2026-09-15 |

数据来源：`rc-echarts/bar3d-line` 组件源码（index.tsx / utils.ts，已逐行确认）、backend-api-docs/陕西-NOC-202609需求接口文档.md 接口1。

---

## 一、risk-resolve 响应外层结构

走 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），参数 `{ viewItemId: 'risk-resolve', viewPageId: 'noc-module-oriented-left-page', viewPageArgs }`，viewPageArgs 携带 `{ zoneId, zoneLevel }`（区域过滤）：

```
{
  code: 200,
  data: {
    viewPageId: 'noc-module-oriented-left-page',
    viewItemId: 'risk-resolve',
    viewItemData: {
      title: '...',
      header: { counterFieldList: [...] },  // 字段元信息
      rows: [ ... ]                         // 数据行
    }
  }
}
```

组件取数固定为 `data.viewItemData.rows`，出错时返回 `[]`。

---

## 二、risk-resolve rows 字段（`TDataSource`，见 bar3d-line/index.tsx）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| indicatorGroup | String | 指标组 id，**与 hazard-solve presets.ts 中 seriesSettings.id 匹配**：'1' 未解决 / '2' 已解决 / '3' 解决及时率 / '4' 全省隐患解决及时率 |
| indicatorGroupName | String | 图例名（未解决 / 已解决 / 解决及时率 / 全省隐患解决及时率） |
| indicatorName | String | x 轴类目（地市名），同时作为该数据点 name |
| indicatorValue | String | 数值（Bar3D/Line 数据点 value）；MarkerLine 行作为 markLine 的 yAxis 值 |

---

## 三、组件内部加工逻辑（`createSeries`，`rc-echarts/bar3d-line/utils.ts`）

- Bar3D / Line 行：`data.push({ name: indicatorName, value: indicatorValue, __rawData: row })`，`indicatorName` 去重进 xAxisData。
- MarkerLine 行：`indicatorValue === ''` 时从图例删除该组；否则 `markLine.data = [{ name, yAxis: Number(indicatorValue) }]`。
- series 输出顺序固定：Line → Bar3D → MarkerLine。
- Bar3D 实为 echarts `custom` series（`Bar3D.Cube3` 经 `buildCubeOption` 转换，left/right/top/bottom 四面 polygon 渲染），堆叠通过 `api.value(0)/api.value(2)` 起止点计算实现。
- 点击事件：`onEvents: { click: handleBarClick }` 已绑定，回调内调用 `props.onHandleBarClick(params)`；hazard-solve 已传入回调（2026-09-15 下钻接入后不再有空值保护问题）。
- 下钻定位所需信息：`params.data.__rawData`（完整行，hazard-solve 下钻取数入口）、`params.seriesName`（图例名）、`params.name`（indicatorName，x 轴类目）。

---

## 四、risk-detail（隐患下钻详情，2026-09-15 接入）

**契约来源**：backend-api-docs/陕西-NOC-202609需求接口文档.md 接口1。

### 4.1 请求

- viewItemId `risk-detail` / viewItemIdGroup `riskDetail-Group` / viewPageId `noc-module-oriented-left-page`
- viewPageArgs：

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| zoneId / zoneLevel | 区域联动 | |
| riskStatus | 全部 / 已完成 / 未完成 | hazard-solve 点击柱块系列映射：未解决 '1' → 未完成、已解决 '2' → 已完成 |

### 4.2 响应 rows 字段（均 String，每字段附带 `xxx_format` 镜像）

| 字段 | fieldLabel |
| --- | --- |
| hiddenDangerSerialNo | 隐患流水号 |
| hiddenDangerType | 隐患类型 |
| hiddenDangerSubType | 隐患细分分类 |
| hiddenDangerName | 隐患名称 |
| major | 专业 |
| hiddenDangerLevel | 隐患级别 |
| handleDept | 隐患处理单位 |
| resourceName | 资源名称 |
| solveSchedule | 解决排期 |
| rectifyPlanClassify | 整改方案分类 |

### 4.3 mock

`public/static/mock/management-overview-second/risk-detail-solve.json`（独立文件，与被多接口共用的 risk-detail.json 隔离）——接口 1 真实结构，10 行数据；**不区分 riskStatus**（点击已解决/未解决显示同样数据，mock 局限）。

---

## 五、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：从 hazard-solve / hazard-rectify README 的数据格式章节抽出，独立成文 |
| v1.1 | 从 hazard-data-format.md §二 迁入本模块目录，独立成文 |
| v2.0 | 新增 §四 risk-detail 契约（请求参数 / 10 字段表 / 独立 mock）；点击空值保护问题已随下钻接入修复 |
