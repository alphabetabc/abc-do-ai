# FaultListTable 故障清单弹窗

`FaultListTable.tsx` 是 NetworkScale 组件中负责"故障清单"弹窗的子组件，由 [Detail 详情弹窗](./detail-component.md) 触发打开（点击柱状图某区域 / 顶部"故障清单"链接）。

**文件**：`apps/main/app/components/right/network-compact/network-scale/FaultListTable.tsx`

## 目录

- [§1 核心流程](#1-核心流程)
- [§2 组件 Props](#2-组件-props)
- [§3 触发来源（faultListTableInfo.type）](#3-触发来源faultlisttableinfotype)
- [§4 请求参数拼接规则（核心配置逻辑）](#4-请求参数拼接规则核心配置逻辑)
- [§5 后端路由：unitId → viewItemId](#5-后端路由unitid--viewitemid)
- [§6 列配置（environment.json）](#6-列配置environmentjson)
- [§7 数据契约（converter）](#7-数据契约converter)
- [§8 常见维护任务](#8-常见维护任务)
- [§9 关键依赖](#9-关键依赖)

> 📌 配套组件 [Detail 详情弹窗](./detail-component.md) — 折线图 + 柱状图 + 故障清单入口。
> 📌 调用方在 [main-render-flow.md §6.1 / §6.2](./main-render-flow.md#6-顶部与底部容器) 中描述。

---

## 1. 核心流程

```
Detail.tsx (点击柱状图 / 故障清单链接)
    ↓
props.onShowDetailList({ type: "all" | "part", dataItem? })
    ↓
index.tsx (setState: openFaultListModal + faultListTableInfo)
    ↓
FaultListTable (props.open === true 时渲染)
    ↓
useRequest → getModalFaultListTableDataApi(requestParams)
    ↓
useEnvironment 读取 rightNetworkCompactFaultListTable.columns 配置
    ↓
渲染 columns + dataSource 到 antd Table
```

---

## 2. 组件 Props

| 属性                 | 类型     | 必填 | 说明                                                                      |
| -------------------- | -------- | ---- | ------------------------------------------------------------------------- |
| `open`               | boolean  | ✅   | 弹窗是否打开（false 时组件直接返回 null）                                 |
| `getContainer`       | function | ✅   | 透传给 Modal，获取弹窗挂载容器（如 `props.getRootContainer()`）           |
| `onCancel`           | function | ✅   | 关闭弹窗回调，外部应同步重置 `openFaultListModal` 和 `faultListTableInfo` |
| `currentZone`        | object   | ✅   | 当前区域信息，用于拼接请求参数                                            |
| `faultListTableInfo` | object   | ✅   | 弹窗信息：`{ type: "all" \| "part", dataItem? }`                          |
| `currentIndItem`     | object   | ✅   | 当前选中的指标（含 `id`、`data.dataTime` 等）                             |

---

## 3. 触发来源（faultListTableInfo.type）

| type     | 触发位置 (Detail.tsx)            | dataItem            | 含义                                 |
| -------- | -------------------------------- | ------------------- | ------------------------------------ |
| `"all"`  | 顶部"故障清单"文字链接 onClick   | 无                  | 查询当前区域该指标的全量故障清单     |
| `"part"` | 柱状图柱子 onClick (params.data) | `params.data.__raw` | 查询当前区域下具体某个地市的故障清单 |

---

## 4. 请求参数拼接规则（核心配置逻辑）

`getModalFaultListTableDataApi` 的入参基于 `currentZone.zoneLevel` 动态组装，规则如下：

### 4.1 `type === "all"`（全量清单）

| 区域级别 (zoneLevel) | zoneName        | parentName             | regionName             |
| -------------------- | --------------- | ---------------------- | ---------------------- |
| 镇 (town)            | currentZoneName | currentZone.cityName   | currentZone.regionName |
| 省 (province)        | currentZoneName | `"-1"`                 | `"-1"`                 |
| 市 (city)            | currentZoneName | currentZone.regionName | `"-1"`                 |
| 区/县 (region)       | currentZoneName | `"-1"`                 | `"-1"`                 |

附加公共字段：

- `kpiType` ← `currentIndItem.id`
- `dataTime` ← `currentIndItem.data.dataTime`
- `zoneLevel` ← `currentZone.zoneLevel`

### 4.2 `type === "part"`（单区域清单，来自柱状图点击）

- `zoneName` ← `dataItem.regionName`
- `dataTime` ← `dataItem.dataTime`
- `kpiType` ← `currentIndItem.id`

`zoneLevel` / `parentName` / `regionName` 根据当前 zoneLevel 推断：

| 当前 zoneLevel | 推断 zoneLevel | parentName           | regionName             |
| -------------- | -------------- | -------------------- | ---------------------- |
| 省 (province)  | region         | `"-1"`               | `"-1"`                 |
| 市 (city)      | city           | currentZone.zoneName | `"-1"`                 |
| 区/县 (region) | town           | currentZone.cityName | currentZone.regionName |
| 镇 (town)      | town           | currentZone.cityName | currentZone.regionName |

> ⚠️ 所有参数都是根据 `ZoneLevelEnum` 动态计算的，修改时请严格参照 `apps/main/app/components/enum.ts` 中的级别定义。

---

## 5. 后端路由：unitId → viewItemId

`getModalFaultListTableDataApi`（位于 `apps/main/request/right.ts`）通过 `apiList` 数组将 `kpiType`（即 `unitId`）映射到不同的 `viewItemId` / `viewPageId`：

| unitId(s)        | viewItemId                                    | viewPageArgs                          | 含义                     |
| ---------------- | --------------------------------------------- | ------------------------------------- | ------------------------ |
| `1, 2`           | `emergency-support-phase-i-i-details1-and2`   | `dataTime, region, kpiType, cityName` | 停电和发电               |
| `3`              | `emergency-support-phase-i-i-details3`        | `dataTime, region, cityName`          | 物理退服                 |
| `4`              | `emergency-support-phase-i-i-details4`        | `dataTime, region, cityName`          | 逻辑退服                 |
| `5, 6, 7`        | `emergency-support-phase-i-i-details567`      | `dataTime, region, kpiType, cityName` | 2/4/5G 退服              |
| `8, 9`           | `emergency-support-phase-i-i-details8-and9`   | `dataTime, region, kpiType, cityName` | 超级基站 / 一镇四站      |
| `10, 11`         | `emergency-support-phase-i-i-details10-and11` | `dataTime, region, kpiType`           | 核心机楼 / 汇聚机房停电  |
| `71`             | `emergency-support-phase-power-cut-hx`        | -                                     | 核心机楼停电             |
| `72, 73, 74`     | `emergency-support-phase-power-cut-hj`        | -                                     | 汇聚机房停电             |
| `12, 13`         | `emergency-support-phase-i-i-details12-and13` | `dataTime, region, kpiType`           | 核心机楼 / 汇聚机房环境  |
| `81`             | `emergency-support-phase-environment-hx`      | -                                     | 核心机楼环境             |
| `82, 83, 84`     | `emergency-support-phase-environment-hj`      | `dataTime, region, kpiType`           | 汇聚机房环境             |
| `14, 15, 16`     | `emergency-support-phase-i-i-details141516`   | `dataTime, region, kpiType`           | 一干 / 二干 / 本地       |
| `36, 37, 38`     | `emergency-support-phase-i-i-details363738`   | `dataTime, region, kpiType`           | 乡镇三 / 双 / 单断       |
| `17, 18, 19, 20` | `emergency-support-phase-i-i-details17-to20`  | `dataTime, region, kpiType`           | 集客其他                 |
| `21`             | `emergency-support-phase-i-i-details21`       | `dataTime, region`                    | 重保专线                 |
| `22`             | `emergency-support-phase-i-i-details22`       | `dataTime, region`                    | 批量 PON                 |
| `23`             | `emergency-support-phase-i-i-details23`       | `dataTime, region`                    | BRAS 退服                |
| `24`             | `emergency-support-phase-i-i-details24`       | `dataTime, region`                    | OLT 退服                 |
| `60, 61, 62`     | `emergency-support-phase-i-i-details606162`   | -                                     | 核心层 / 重要层 / 支撑层 |
| `63, 64`         | `emergency-support-phase-i-i-details6364`     | -                                     | 移动停电 / 铁塔停电      |

> 添加新 unitId 时：① 在 `presets.ts` 的 `items` 中声明；② 在 `apiList` 中补充映射；③ 在 `environment.json` 的 `rightNetworkCompactFaultListTable.columns` 中补充列配置。

---

## 6. 列配置（environment.json）

### 6.0 配置定位：以环境配置为准（覆盖后端默认）

**列骨架来源**：后端 `res.headers`（即 `viewItemData.header.dimFieldList + counterFieldList`）决定**显示哪些列**、列的**默认顺序**、默认 `title`（来自 `fieldLabel`）和数据字段绑定（`dataIndex` / `key` = `fieldName`）。

**环境配置作用**：仅在前端"按字段名命中"后，对该列的 3 个字段做**部分覆盖**，未命中时全部沿用后端默认。

| 配置项       | 作用                            | 未配置时            |
| ------------ | ------------------------------- | ------------------- |
| `width`      | 覆盖列宽（同时开启 `ellipsis`） | 后端默认无宽度限制  |
| `label`      | 覆盖列标题（`title`）           | 用后端 `fieldLabel` |
| `renderType` | 覆盖单元格渲染器                | 用 antd Table 默认  |

**环境配置不能**：

- ❌ 新增后端没有的列
- ❌ 隐藏后端返回的列
- ❌ 调整列的顺序
- ❌ 修改 `dataIndex`（数据字段绑定）

> 💡 简言之：**"列的存在和顺序以后端为准，列的展示样式（宽 / 标题 / 渲染）以配置为准"**。
>
> 也可以理解为：**配置是对后端数据的"展示层增强"** — 后端决定"有什么数据 / 什么列"，配置决定"用什么样式展示这些数据"。配置不能改变后端契约，只能在已有数据上做美化 / 适配。

后端返回 `headers`（含 `fieldName` / `fieldLabel`）后，前端用以下配置覆盖列宽 / 标题 / 自定义渲染：

```json
{
    "gd-emergency-support.rightNetworkCompactFaultListTable.columns": [
        {
            "desc": "逻辑退服、2G退服、4G退服、5G退服",
            "unitId": ["4", "5", "6", "7"],
            "columns": [
                { "fieldName": "siteLabel", "width": 300, "label": "退服基站名称" },
                { "fieldName": "alarmTime", "width": 200, "label": "告警发生时间" },
                { "fieldName": "workOrder", "width": 100, "label": "派单", "renderType": "type1" },
                { "fieldName": "siteUnit", "width": "auto", "label": "产权" }
            ]
        }
    ]
}
```

匹配规则：在 `tableSettings` 中查找第一个 `unitId` 数组包含 `currentIndItem.id` 的项，再用其中 `columns` 的 `fieldName` 与后端 `headers` 的 `fieldName` 一一匹配。

| 配置字段     | 作用                                                          |
| ------------ | ------------------------------------------------------------- |
| `desc`       | 描述（前端未直接使用，便于维护时识别）                        |
| `unitId`     | 命中的 unitId 列表，第一个匹配项生效                          |
| `width`      | 列宽（数字或 `"auto"`），命中后开启 `ellipsis`                |
| `label`      | 覆盖后端返回的 `fieldLabel`                                   |
| `renderType` | 映射到 `cellRenderMap` 中的渲染函数（如 `type1` → 是/否转换） |

### 6.1 内置 cellRenderMap

```typescript
const cellRenderMap: Record<string, (text: any) => JSX.Element> = {
    type1: (text) => <span title={text}>{text ? "是" : "否"}</span>,
};
```

新增渲染类型：在 `FaultListTable.tsx` 的 `cellRenderMap` 中注册函数，然后在 `environment.json` 中通过 `renderType` 引用。

---

## 7. 数据契约（converter）

后端通过 `getViewItemDataApi` 统一返回，前端 converter 拆分为 `rows` + `columns`：

```typescript
converter: (res: any) => ({
    rows: res.data?.viewItemData?.rows ?? [],
    columns: [...(res.data?.viewItemData?.header?.dimFieldList ?? []), ...(res.data?.viewItemData?.header?.counterFieldList ?? [])],
});
```

最终 `result = { headers, rows }` 返回到 `useRequest.onSuccess`：

- `headers` → 经过 §6 配置覆盖后生成 `state.columns`
- `rows` → 直接作为 `state.dataSource`

---

## 8. 常见维护任务

1. **新增故障清单弹窗列**
    - 在 `environment.json` 的 `rightNetworkCompactFaultListTable.columns` 中追加 `fieldName` 配置。
    - 若需特殊渲染（如状态徽标），先在 `cellRenderMap` 注册，再通过 `renderType` 引用。
2. **新增 unitId（指标）弹窗**
    - 在 `presets.ts` 的 `items` 中声明指标。
    - 在 `apps/main/request/right.ts` 的 `apiList` 中追加 `{ unitId, viewItemId, viewPageId, viewPageArgs? }`。
    - 在 `environment.json` 中补列配置。
3. **调整不同区域的请求参数**
    - 修改 `FaultListTable.tsx` 中 `type === "all"` / `type === "part"` 的参数拼接逻辑。
    - 注意保持与 `ZoneLevelEnum` 枚举值一致。
4. **排查清单打不开**
    - 检查 `open` 是否为 true（外部 `setState` 是否触发）。
    - 检查 `currentIndItem` / `currentZone` 是否定义（受 `useRequest.ready` 控制）。
    - 检查 `apiList` 是否能命中 `kpiType`，未命中时直接返回空 `{ headers: [], rows: [] }`。
5. **Mock 数据替换**
    - `getModalFaultListTableDataApi` 默认 mock 路径：`/static/mock/emergency/guarantee-right-page-emergency-support-phase-i-i-table.json`。
    - 可在 `getViewItemDataApi` 调用处通过 `localMockUrl` 覆盖。

---

## 9. 关键依赖

| 依赖                            | 作用                                                |
| ------------------------------- | --------------------------------------------------- |
| `getModalFaultListTableDataApi` | 故障清单数据接口（位于 `@/request/right`）          |
| `getEnvironment`                | 读取 `environment.json` 列配置                      |
| `StyledDraggableModal`          | 可拖拽弹窗容器                                      |
| `ZoneLevelEnum`                 | 区域级别枚举，决定请求参数组装                      |
| `useRequest.refreshDeps`        | `[currentZone, faultListTableInfo, currentIndItem]` |
