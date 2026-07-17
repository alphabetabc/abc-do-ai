# 中屏保障中心 API 总览

> 中屏保障中心模块（`web/pages/emergency-support/modules/center`）涉及的全部 HTTP/JSON API。  
> 源文件：[api.ts](web/services/emergency-support/center/api.ts)

## 文件统一返回结构

所有通过 `getViewItemDataApi` 调用的接口都是「视图项」接口，标准响应结构：

```ts
// 响应
{
    code: 200,
    data: {
        viewItemData: {
            rows: any[],         // 主数据行
            cableSectionList?,   // 仅 getMiddleMapAlarmTransmissionApi
            intIdList?,          // 仅 getMiddleMapAlarmTransmissionApi
            // ... 其他扩展字段
        }
    }
}
```

`request({ url, method: 'post', baseUrlType })` 调用的接口响应结构：

```ts
// 响应（多项）
{ code, data: any[], message }
// 响应（详情）
{ code, data: { rows: { data: any[] } }, message }
```

> `baseUrlType` 都是 `'emergencySupportService'`，封装在 `api.ts` 顶部常量。

## Mock 数据

每个接口都对应 `localMockUrl`（开发期 mock）。位置：

```
web/static/mock/emergency-support/*.json
```

> 想本地调试时打开对应文件，或在 `api.ts` 临时替换 `localMockUrl` 注释。

## 接口索引

按使用方分类：

### CenterPath 专用（日常保障 Path 地图）

- [center-path.md](center-path.md)
  - `getPathMapJson(pathLevel, adcode)` — 加载省级 / 地市 GeoJSON
  - `getPathMapConfigJson()` — 加载气泡 cp 配置
  - `getMiddleMapAlarmDataApiNew(viewPageArgs)` — **新**：按图例切换的告警气泡数据
  - `getMiddleMapMachineryRoomDataApi(zoneSelect, viewPageArgs)` — 机房图例气泡
  - `getMiddleMapTransDataApi(zoneSelect, viewPageArgs)` — 传输断点气泡

### TabContent1 GIS 专用（日常保障区县 GIS）

- [tab-content-1-gis.md](tab-content-1-gis.md)
  - `getEmergencySupportGisLinesApi(zoneSelect, zoneId)` — 区县乡镇边界连线
  - `getEmergencyGisTownPointApi(zoneSelect, zoneId)` — 乡镇名称点
  - `getEmergencyNormalGisStationPointsApi(zoneSelect, viewPageArgs, isAlarm, areaId?)` — 245G/OLT/BRAS 打点
  - `getEmergencyNormalGisTransmissionPointsApi(zoneSelect, viewPageArgs, isAlarm, repairIntId, repairLevel, areaId?)` — 传输打点
  - `getEmergencyNormalGisMachineryRoomPointsApi(zoneSelect, viewPageArgs, repairIntId, repairLevel, areaId?)` — 机房打点
  - `getEmergencyNormalGisSuppliesPointsApi(zoneSelect, viewPageArgs, areaId?)` — 应急打点
  - `getMiddleMapAlarmTransmissionApi(viewPageArgs, repairIntId, areaId?)` — 断点光缆（`{lineIds, azIntIds}`）
  - `getMiddleMapTownSiteAlarmDataApi(viewPageArgs)` — LeftGisDetail 乡镇告警表
  - `getEmergencySupportTownLonLatDataApi(viewPageArgs)` — 乡镇经纬度
  - `getEmergencyGisPointDetailApi(objectClass, intId)` — 网元详情
  - `getEmergencyGisPointCableDetailApi(viewPageArgs)` — 断点光缆详情
  - `getEmergencyGisPointMachineryRoomDetailApi(objectClass, intId)` — 机房详情
  - `getEmergencyGisPointTransmissionDetailApi(type, intId)` — 传输详情

### TabContent2 GIS 专用（突发保障区域 GIS）

- [tab-content-2-gis.md](tab-content-2-gis.md)
  - `getEmergencySuddenGisAreaApi()` — 突发保障区域列表
  - `insertEmergencySuddenGisAreaApi(areaId)` — 保存区域（写接口）
  - `getEmergencySuddenGisLinesApi(areaId)` — 突发保障区域边界连线
  - 其他 GIS 打点类接口同 Tab1（`getEmergencyNormalGis*`），但 **`zoneSelect` 传 `{}`**，参数额外加 `areaId`

### 通用工具（非中心模块自有）

- `getZoneDataApi(viewPageArgs)` — 中屏获取省地市区县数据；**目前中心模块未直接调用**，保留供后续使用
- `getMiddleMapAlarmDataApi` — **旧版告警接口**（保留），新版为 `getMiddleMapAlarmDataApiNew`
- `getEmergencyNormalGisPointsApi` / `getTownTransmissionDotsApi` / `getEmergencySuddenGisAreaNeApi` — 同样目前未被中心模块直接调用，保留

## 字段配置项

所有 API 调用都依赖 `useEnvironment()` / `getEnvironment()` 返回的两个配置：

- `emergencySupportAlarmConfig` — 告警 indexId / dimId 映射（旧版 `getMiddleMapAlarmDataApi`、详情类用）
- `emergencySupportGisConfig` — GIS 配置（`neTypeList` 等）
- `emergencySupportAIConfig` — AI 智能问答 URL（不在本目录）

具体字段不展开在 API 文档里，需要时直接读环境变量定义。

## 调用模式速查

`api.ts` 中两类调用工具：

```ts
// 1) 视图项接口（绝大多数）
await runPromise(
    getViewItemDataApi({
        baseUrlType,
        localMockUrl?: string,
        params: {
            viewItemId: string,
            viewPageId: 'emergency-support-middle-page',
            viewPageArgs: object,
        },
    }),
);

// 2) 裸 request（详情类、新版打点类）
await runPromise(
    request({
        method: 'post',
        baseUrlType,
        url: 'EmergencySupport/...',
        data: object,
    }),
);
```

## 易踩坑

- **`baseUrlType` 都是 `'emergencySupportService'`**，统一在文件顶部常量；不要在调用处再写一遍
- **mock 文件位置**：`/static/mock/emergency-support/*.json`，文件名对应 mock 字段含义（详见每个接口的 `localMockUrl`）
- 响应里 `data.viewItemData.rows` 是**数组**，但是只有视图项接口；裸 `request` 是 `data: any`
- 错误返回时 `runPromise` 会返回 `[err, res]`，多数 `api.ts` 函数都检查 `err || isEmpty(rows) → []`
- 详情类接口（`*DetailApi`）返回数据路径是 `data.viewItemData.rows.data[0].alarmDetail`，**多一层 `.data` 包裹**，与列表接口不同

> 版本：v1.0 · 创建日期：2026-07-13
