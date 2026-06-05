---
name: "ui-emap-gis"
description: "维护和拓展EMap GIS地图组件能力，包括地图初始化、图层管理、弹窗交互、WFS/WMS图层集成等。Invoke when working on map-related components, adding new map features, or modifying existing map functionality."
---

# UI EMap GIS 技能

## 1. 概述

该技能负责维护和拓展 `apps/main/app/components/ui/emap-gis` 目录下的EMap GIS地图组件能力。该模块是应急支撑系统的核心地图基础设施，提供地图初始化、图层管理、空间查询、交互事件等基础能力。

## 2. 模块结构

```
emap-gis/
├── index.tsx                  # 导出入口
├── emap.ts                    # 核心工具函数（EMapUtils）
├── emap-loader.ts             # EMap库动态加载器
├── emap-overlay.ts            # Overlay管理器
├── emap-scheduler.ts          # 任务调度器
├── hooks.ts                   # 自定义hooks
├── MapContext.tsx             # React上下文管理
├── MapView.tsx                # 地图视图组件（包装MapContext）
├── MapInstanceRef.tsx         # 地图实例引用组件
├── MapWidgetWFSLayer.tsx      # WFS矢量图层组件
├── MapEmergencyTransmission.tsx  # 应急传输WMS图层组件
├── map-dev-proxy.ts           # 开发环境代理
└── styled-root.tsx            # 样式根组件
```

## 3. 核心组件说明

### 3.1 EMapView

地图视图容器组件，负责初始化地图实例并提供上下文。

**使用方式：**

```tsx
<EMapView className="w-full h-screen">
    {/* 子组件可访问地图上下文 */}
    <MapWidgetWFSLayer layerCode="CITY" keyCode="广州市" />
</EMapView>
```

### 3.2 MapContext

React Context提供者，封装地图实例和Overlay管理器。内部自动初始化地图，管理地图生命周期。

**核心API：**

| 属性             | 类型                 | 说明         |
| ---------------- | -------------------- | ------------ |
| `map`            | `TMapInstance`       | EMap地图实例 |
| `EMap`           | `TEMapLib`           | EMap库引用   |
| `overlayManager` | `EMapOverlayManager` | 覆盖层管理器 |

**生命周期：**

- 挂载时：初始化地图实例，创建Overlay管理器
- 卸载时：销毁地图，清理资源

### 3.3 MapWidgetWFSLayer

WFS矢量图层组件，用于加载行政区划等矢量数据。支持AOI、地市、区县、乡镇、省份等多级行政区划。

**属性说明：**
| 属性 | 类型 | 说明 |
|------|------|------|
| layerCode | `AOI \| CITY \| DISTRICT \| TOWN \| PROVINCE` | 图层类型 |
| keyCode | `string` | 查询关键字（如城市名） |
| layerId | `string` | 图层标识（可选） |
| layerName | `string` | 图层名称（可选） |
| layerShowNextLevel | `boolean` | 是否显示下一层级（可选） |
| isCustomLayer | `boolean` | 是否自定义图层（避免乡镇重名） |
| currentZone | `object` | 当前区域信息（配合isCustomLayer使用） |
| onGetLayer | `function` | 图层加载完成回调 |
| onLayerRemove | `function` | 图层移除回调 |

**特殊处理：**

- 中山、东莞地区特殊处理：无区县层级，直接到乡镇（gsjd）
- 支持区域名称映射，避免乡镇重名问题

### 3.4 MapEmergencyTransmission

应急传输图层组件，加载WMS告警图层。支持主图层显隐控制和子图层扩展。详细说明请参考 [MapEmergencyTransmission.md](./MapEmergencyTransmission.md)。

**核心属性：**

| 属性             | 类型       | 默认值 | 说明           |
| ---------------- | ---------- | ------ | -------------- |
| serverCodeName   | `string`   | -      | 服务编码名称   |
| cqlFilter        | `string`   | -      | CQL过滤条件    |
| zIndex           | `number`   | 2      | 图层层级       |
| mainLayerVisible | `boolean`  | true   | 主图层可见性   |
| enableSubLayer   | `boolean`  | false  | 是否启用子图层 |
| subLayerList     | `object[]` | -      | 子图层配置列表 |

**支持的服务编码：**

- 乡镇界图层: HRwClcjk
- 乡镇三路由告警图层: HR5tnRyT
- 地市骨干层路由告警图层: HRMNncdi
- 区县汇聚层路由告警图层: HRCLGQuE
- 乡镇接入层路由告警图层: HRRm2GHe
- 乡镇路由站点告警图层表: HRrNVRh2
- 省级传输二干告警图层: HRaiGz51

## 4. 核心工具函数（EMapUtils）

### 4.1 地图初始化

```typescript
EMapUtils.initMap(containerId, {
    callback: (map, EMap) => {
        // 地图初始化完成回调
    },
});
```

### 4.2 图层操作

| 方法                            | 说明                |
| ------------------------------- | ------------------- |
| `addPoints`                     | 添加多个点标记      |
| `addPoint`                      | 添加单个点标记      |
| `addLayer`                      | 创建矢量图层        |
| `addPointLayer`                 | 创建点图层          |
| `addWFSLayer`                   | 添加WFS图层         |
| `addEmergencyTransmissionLayer` | 添加应急传输WMS图层 |
| `addWKTFeature`                 | 添加WKT格式几何要素 |
| `getLayerById`                  | 根据ID获取图层      |
| `clearLayer`                    | 清空图层要素        |
| `clearAllLayer`                 | 清空所有图层        |
| `setLayerStatus`                | 设置图层可见性      |
| `setTileFilterColor`            | 设置瓦片滤镜颜色    |
| `refreshTileFilterLayer`        | 刷新瓦片滤镜图层    |

### 4.3 交互功能

| 方法               | 说明                                                  |
| ------------------ | ----------------------------------------------------- |
| `createPopup`      | 创建弹窗及事件监听（支持move、click、dblclick等事件） |
| `createToolbar`    | 创建工具栏（AOI查询、区域搜索）                       |
| `createDrawSelect` | 创建框选交互（Polygon绘制）                           |

### 4.4 视图控制

| 方法                  | 说明           |
| --------------------- | -------------- |
| `setCenter`           | 设置地图中心点 |
| `focusPositionPoint`  | 聚焦到指定点   |
| `focusPositionExtent` | 聚焦到指定范围 |
| `zoomToExtent`        | 缩放到指定范围 |
| `updateSize`          | 更新地图尺寸   |

### 4.5 要素查询

| 方法                   | 说明               |
| ---------------------- | ------------------ |
| `findFeatureByPoint`   | 根据坐标查找要素   |
| `pickFeatureByPoint`   | 根据坐标拾取点要素 |
| `pickFeatureByPointId` | 根据ID拾取要素     |

### 4.6 其他工具

| 方法           | 说明             |
| -------------- | ---------------- |
| `getScheduler` | 获取任务调度器   |
| `addDestroy`   | 添加销毁回调函数 |
| `destroyMap`   | 销毁地图实例     |

## 5. 自定义Hooks

### 5.1 useEMapUtil

封装EMapUtils方法的自定义Hook，自动注入地图上下文。

**使用方式：**

```typescript
const addPoints = useEMapUtil("addPoints");

// 调用时无需传入map和EMap参数
addPoints({
  layerId: "my-layer",
  points: [...],
  getIcon: (point) => point.icon
});
```

## 6. 坐标转换工具（EMapFormatter）

| 方法                        | 说明                         |
| --------------------------- | ---------------------------- |
| `wktToGeoJson`              | WKT转GeoJSON                 |
| `getPolygonCenterAndExtent` | 获取多边形中心点和范围       |
| `format.batchChangeNested`  | 批量转换坐标（BD09/WGS84等） |

## 7. 全局请求工具（EMapGlobalRequest）

### 7.1 getEMapDistrictJson

获取行政区划GeoJSON数据。

```typescript
const districts = await EMapGlobalRequest.getEMapDistrictJson({
    keyword: "广州市",
    sub_admin: 2, // 包含子集层级
    extensions_code: 1, // 是否召回国标行政区划代码
});
```

## 8. 配置与环境

地图配置通过 `getEnvironment("EMapConfig")` 获取，包含：

| 配置项                  | 说明             |
| ----------------------- | ---------------- |
| `baseUrl`               | 地图服务基础URL  |
| `center`                | 默认中心点坐标   |
| `zoom`                  | 默认缩放级别     |
| `minZoom`               | 最小缩放级别     |
| `maxZoom`               | 最大缩放级别     |
| `ak/sk`                 | 服务认证密钥     |
| `WFS`                   | WFS服务配置      |
| `emergencyTransmission` | 应急传输图层配置 |
| `lib`                   | JS/CSS资源路径   |
| `enableELayer`          | 是否启用ELayer   |
| `tileImageFilter`       | 瓦片滤镜配置     |
| `request`               | 请求配置         |
| `zoneNameMapping`       | 区域名称映射     |

## 9. 扩展指南

### 9.1 添加新图层类型

1. 在 `emap.ts` 的 `EMapUtils` 中添加新方法
2. 如需React组件封装，创建新的组件文件
3. 在 `index.tsx` 中导出新功能

### 9.2 添加新交互工具

1. 在 `EMapUtils` 中添加交互创建方法
2. 考虑使用 `useEMapUtil` Hook封装

### 9.3 添加Overlay组件

使用 `overlayManager.createPortal` 将React组件挂载到地图覆盖层。

## 10. 版本信息

- **版本**: 1.2
- **最后更新**: 2026-06-04
- **更新内容**: 
  - `MapEmergencyTransmission` 组件新增 `mainLayerVisible` 属性，支持主图层显隐控制
  - 使用 `useLatest` Hook 避免闭包过时问题
  - 调整 `getEmergencyTransmissionAlarmLayerDataApi` 返回值结构，提取 `response.data` 作为实际数据源
- **依赖**: EMap SDK、ahooks、clsx、blueimp-md5、lodash-es
