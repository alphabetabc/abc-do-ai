---
name: 'noc-shaanxi-second-hazard-solve-data-format'
version: '1.1'
updated: '2026-09-09'
description: 'risk-resolve（隐患解决情况）服务端数据格式：响应结构、rows 字段与 bar3d-line 组件加工逻辑。'
---

# risk-resolve 服务端数据格式（隐患解决情况）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.1（从 hazard-data-format.md §二 迁入） |
| 最后更新 | 2026-09-09 |

数据来源：`rc-echarts/bar3d-line` 组件源码（index.tsx / utils.ts，已逐行确认）。

---

## 一、响应外层结构

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

## 二、rows 字段（`TDataSource`，见 bar3d-line/index.tsx）

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
- 点击事件：`onEvents: { click: handleBarClick }` 已绑定，回调内直接调用 `props.onHandleBarClick(params)`，**无空值保护**——业务方未传该 prop 时点击图表会抛 TypeError（hazard-solve 现状即如此）。
- 下钻定位所需信息已具备：`params.seriesName`（图例名，区分已解决/未解决）、`params.name`（indicatorName，x 轴类目）、数据点 `__rawData`（完整行）。

---

## 四、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：从 hazard-solve / hazard-rectify README 的数据格式章节抽出，独立成文 |
| v1.1 | 从 hazard-data-format.md §二 迁入本模块目录，独立成文 |
