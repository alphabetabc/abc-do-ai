---
name: gd-es-next-dispatch-gis-maintenance
description: 用于维护和拓展 dispatch-gis 指挥调度 GIS 组件的可复用技能
tags:
    - GIS
    - 指挥调度
    - 维护
---

# dispatch-gis 组件维护技能 (Skill)

## 🚀 快速导航

| 使用场景                 | 快速入口                                     | 详细文档                                                             |
| ------------------------ | -------------------------------------------- | -------------------------------------------------------------------- |
| 添加新图例项             | [点击跳转](#1-添加新图例项)                  | [DispatchLegend.md](./DispatchLegend.md)                             |
| 新增打点类型             | [点击跳转](#2-新增打点类型)                  | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 修改弹窗字段             | [点击跳转](#3-修改弹窗字段)                  | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 添加地图图层             | [点击跳转](#4-添加地图图层)                  | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 调试数据不更新           | [点击跳转](#5-调试数据不更新问题)            | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 优化性能问题             | [点击跳转](#6-优化性能问题)                  | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 同经纬度处理             | [点击跳转](#7-同经纬度处理)                  | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 扩展跨地市飞线           | [点击跳转](#8-扩展跨地市飞线功能)            | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 传输路由状态控制         | [点击跳转](#9-传输路由状态控制)              | [MapEmergencyTransmissionView.md](./MapEmergencyTransmissionView.md) |
| 乡镇退服图例联动         | [点击跳转](#10-乡镇退服图例联动)             | [damageToTownsGisPin.md](./damageToTownsGisPin.md)                   |
| 添加新预警类型           | [点击跳转](#11-添加新预警类型)               | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 多级视图告警图层配置     | [点击跳转](#12-多级视图告警图层配置)         | [layerSettings 配置说明](#12-多级视图告警图层配置)                   |
| 添加发光/泛光类型        | [点击跳转](#13-添加发光泛光类型)             | [CENTER-GIS.md](./CENTER-GIS.md)                                     |
| 显式 `get()` vs 派生常量 | [点击跳转](#14-显式-get-vs-派生常量选型决策) | [CENTER-GIS.md](./CENTER-GIS.md)                                     |

---

## 📋 相关文档概览

| 文档                                | 定位             | 核心内容                     |
| ----------------------------------- | ---------------- | ---------------------------- |
| **CENTER-GIS.md**                   | 核心地图组件     | 架构设计、图层管理、数据流程 |
| **DispatchLegend.md**               | 图例控制组件     | 状态管理、联动机制、图例配置 |
| **MapEmergencyTransmissionView.md** | 传输路由告警组件 | 数据请求、图层渲染           |
| **damageToTownsGisPin.md**          | 全局状态变量     | 乡镇退服联动、数据结构       |

---

## 1. 添加新图例项

**场景**：需要添加新的图例选项（如"应急仓"）

**快速步骤**：

1. 在 `dispatch-legend/index.tsx` 的 `defaultValues` 中添加默认值
2. 在对应分组位置添加复选框 JSX
3. 如需数据请求，在 `center-gis/index.tsx` 中添加 `useRequest`
4. 添加图层渲染 `useEffect`

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`
- `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

**详细文档**：[DispatchLegend.md → 默认状态配置](./DispatchLegend.md#31-默认状态配置)

---

## 2. 新增打点类型

**场景**：需要添加新的地图打点类型（如"无人机基站"）

**快速步骤**：

1. 在 `field.ts` 中添加字段配置（key、label、field 数组）
2. 在 `center-gis/index.tsx` 中添加 `useRequest` 数据请求
3. 添加 `useEffect` 监听数据变化并调用 `MapInit.addPoints`
4. 在 `public/static/images/emergency/map/图例/` 下添加图标

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`
- `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

**详细文档**：[CENTER-GIS.md → 核心功能实现](./CENTER-GIS.md#3-核心功能实现)

---

## 3. 修改弹窗字段

**场景**：需要修改地图弹窗中显示的字段

**快速步骤**：

1. 在 `field.ts` 中找到对应资源类型的配置
2. 在 `field` 数组中添加/修改字段配置
3. 如需样式处理，在 `dispatch-popup/index.tsx` 中添加条件样式

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`
- `apps/main/app/components/center/dispatch-gis/dispatch-popup/index.tsx`

**详细文档**：[CENTER-GIS.md → 字段配置](./CENTER-GIS.md#62-字段配置)

---

## 4. 添加地图图层

**场景**：需要添加新的地图图层（如"实时位置"图层）

**快速步骤**：

1. 在 `mapInit.tsx` 中添加图层操作方法
2. 在 `center-gis/index.tsx` 中添加数据请求和 `useEffect` 渲染
3. 如需图例控制，在 `dispatch-legend/index.tsx` 中添加默认值和复选框

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`
- `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`

**详细文档**：[CENTER-GIS.md → 图层管理](./CENTER-GIS.md#35-图层管理)

---

## 5. 调试数据不更新问题

**场景**：地图数据长时间不更新

**快速检查清单**：
| 检查项 | 操作 |
|--------|------|
| 依赖项 | 检查 `refreshDeps` 是否包含所有必要依赖 |
| 轮询间隔 | 确认 `pollingInterval` 配置合理 |
| API 返回 | 添加 `onSuccess`/`onError` 回调调试 |
| Effect 执行 | 添加 console.log 确认 Effect 是否触发 |

**关键代码模式**：

```typescript
useRequest(() => api(), {
    ready: isDefined(param1) && isDefined(param2),
    refreshDeps: [param1, param2],
    pollingInterval: 300000,
    onSuccess: (data) => console.log("✅ 数据更新", data),
});
```

**详细文档**：[CENTER-GIS.md → 常见问题](./CENTER-GIS.md#7-常见问题解决方案)

---

## 6. 优化性能问题

**场景**：地图渲染性能较差

**快速优化策略**：
| 优化项 | 方法 |
|--------|------|
| 大数据存储 | 使用 `useRef` 替代 `useState` |
| 图层清理 | 使用 `MapInit.clearLayerById` 批量清理 |
| 计算缓存 | 使用 `useMemo` 缓存计算结果 |
| 函数缓存 | 使用 `useMemoizedFn` 缓存函数引用 |

**详细文档**：[CENTER-GIS.md → 性能优化](./CENTER-GIS.md#8-性能优化)

---

## 7. 同经纬度处理

**场景**：多个资源点同经纬度需要聚合，或路径起点/终点需要去重

**快速步骤**：

1. **应急资源聚合**：在 `center-gis/index.tsx` 中使用 Map 按经纬度分组
2. **路径去重**：使用 `isPointExists` 检查已存在的点

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`（聚合逻辑）
- `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`（去重逻辑）

**详细文档**：[CENTER-GIS.md → 应急资源聚合](./CENTER-GIS.md#32-应急资源聚合同经纬度处理)

---

## 8. 扩展跨地市飞线功能

**场景**：需要修改跨地市飞线的样式或添加交互

**快速步骤**：

1. 在 `mapInit.tsx` 的 `addCrossCityLines` 方法中修改样式
2. 在 `center-gis/index.tsx` 中添加点击事件处理

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`

**详细文档**：[CENTER-GIS.md → 跨地市飞线绘制](./CENTER-GIS.md#33-跨地市飞线绘制)

---

## 9. 传输路由状态控制

**场景**：需要控制传输路由告警数据的请求和显示

**快速步骤**：

1. 在图例中添加 `传输路由中断` 和 `传输路由正常` 默认值
2. 在图例中添加对应的复选框
3. 在 `MapEmergencyTransmissionView.tsx` 中添加状态判断逻辑

**关键逻辑**：

- `dataTime`：仅在 `传输路由中断` 选中时计算
- `circuitNames`：从告警全量数据中按 `filterType` 过滤后提取 `optical`
- `optical`：接口可能返回 `"线路A;线路B;线路A"` 这类分号拼接字符串，需要按 `;` 拆分、`trim`、过滤空值并用 `Set` 去重
- `alarmLayerParams`：仅在 `传输路由中断` 选中时构建有效参数

**详细文档**：[MapEmergencyTransmissionView.md](./MapEmergencyTransmissionView.md)

---

## 10. 乡镇退服图例联动

**场景**：右侧组件选中乡镇出局路由或乡镇退服时联动图例

**联动规则**：

| 场景         | 条件                      | 联动动作                                             |
| ------------ | ------------------------- | ---------------------------------------------------- |
| 乡镇出局路由 | `isTownExitRoute = true`  | 选中「乡镇三路由」，取消「物理站址退服」和「核心层」 |
| 乡镇退服     | `isTownExitRoute = false` | 选中核心层、重要层、支撑层、普通站、光缆、机房       |

**关键文件**：

- `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`

**详细文档**：[damageToTownsGisPin.md](./damageToTownsGisPin.md)

---

## 11. 添加新预警类型

**场景**：需要添加新的预警类型打点（如"台风预警"）

**快速步骤**：

1. 在 `field.ts` 中添加预警类型配置
2. 在 `center-gis/index.tsx` 中添加数据请求
3. 添加 `useEffect` 监听并渲染

**详细文档**：[CENTER-GIS.md → 核心功能实现](./CENTER-GIS.md#3-核心功能实现)

---

## 12. 多级视图告警图层配置

**场景**：需要配置省级/地市级/区县级三级视图的传输路由告警图层（color、alarmColor、legendIcon 等）

**配置位置**：

- 本地开发：`apps/main/public/config/environment-local.json` → `layerSettings` → `province` / `region` / `city`
- 线上环境：`apps/main/public/config/environment.json` → `layerSettings` → `province` / `region` / `city`

**配置结构**：

每个视图层级下包含以下告警图层（按 zIndex 降序排列）：

| 图层 key                 | 说明         | 省级视图 | 地市视图       | 区县视图       |
| ------------------------ | ------------ | -------- | -------------- | -------------- |
| `省级传输二干告警图层`   | 省级传输二干 | 有       | 有（保持默认） | 有（保持默认） |
| `地市骨干层路由告警图层` | 地市骨干     | 有       | 有             | 有（保持默认） |
| `区县汇聚层路由告警图层` | 汇聚路由     | 有       | 有             | 有             |
| `乡镇接入层路由告警图层` | 接入层       | 有       | 有             | 有             |

**每个图层的配置字段**：

| 字段             | 类型   | 说明                       |
| ---------------- | ------ | -------------------------- |
| `desc`           | string | 图层描述名称               |
| `zIndex`         | number | 正常状态图层层级           |
| `alarmZIndex`    | number | 告警状态图层层级           |
| `alarmGroupSize` | number | 告警聚合大小               |
| `color`          | string | 正常状态颜色标识           |
| `alarmColor`     | string | 告警状态颜色标识（红色系） |
| `legendIcon`     | string | 图例图标文件名             |

**颜色与线径命名规范**：

| 颜色          | 线径 | 命名格式              |
| ------------- | ---- | --------------------- |
| 绿色 (0DFF7A) | 3    | `csyj_green_line_3`   |
| 黄色 (F6BF28) | 1.5  | `csyj_yellow_line_15` |
| 蓝色 (96C1FF) | 0.5  | `csyj_blue_line_05`   |
| 红色 (FF0000) | 3    | `csyj_red_line_3`     |
| 红色 (FF0000) | 1.5  | `csyj_red_line_15`    |
| 红色 (FF0000) | 0.5  | `csyj_red_line_05`    |

**图例图标对应规则**：

| color 颜色 | legendIcon 值    |
| ---------- | ---------------- |
| 蓝色系     | `二干.png`       |
| 绿色系     | `骨干层路由.png` |
| 黄色系     | `汇聚路由.png`   |

**关键文件**：

- `apps/main/public/config/environment-local.json`（本地开发配置）
- `apps/main/public/config/environment.json`（线上环境配置）

---

## 13. 添加发光/泛光类型

**场景**：让业务 type 在地图上出现 ripple 扩散动画（核心机楼、核心层等高优先级点的视觉强调）。

**关键文件**：`apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`（`enableAnimateLayerTypes` Map + `isFlash` 判断 + 事件过滤列表）

**详细文档**：[CENTER-GIS.md §3.6](./CENTER-GIS.md#36-发光泛光动画) — 含添加步骤、复合 key、按类别分流、setLayerStatus 反查

> **提示**：事件过滤列表（pointermove / clickPopup）不会因为 Map 加 entry 就自动包含新 type——需要显式 `get("新类型")!.layerIdPrefix` 一行（有意为之的"摩擦"）。详见 [CENTER-GIS.md §3.6.3 步骤 4](./CENTER-GIS.md#363-添加新发光类型的最小步骤)。

---

## 14. 显式 `get()` vs 派生常量：选型决策

**场景**：`enableAnimateLayerTypes` 是发光能力单一来源，多处需要用到 `layerIdPrefix`——是派生常量还是显式引用？

**当前决策**：

| 使用位置                             | 形态                                       | 语义                         |
| ------------------------------------ | ------------------------------------------ | ---------------------------- |
| 事件过滤（pointermove / clickPopup） | 显式 `get("X")!.layerIdPrefix`             | 子集（每调用点可选）         |
| `setLayerStatus` 归并                | `[...enableAnimateLayerTypes.keys()]` 派生 | 全集（所有发光 type 都参与） |

**详细文档**：[CENTER-GIS.md §3.6.6](./CENTER-GIS.md#366-显式-get-vs-派生常量选型决策) — 含选型理由、注意点（`!` vs `?? ""`）

---

## 🎯 常见问题速查

| 问题                | 快速解决方案                           | 详细文档                                                                                                                                     |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 图层不显示          | 检查图例选中状态、数据返回、图层 ID    | [CENTER-GIS.md#72](./CENTER-GIS.md#72-图层不显示)                                                                                            |
| 数据不更新          | 检查 `refreshDeps`、轮询间隔、API 返回 | [CENTER-GIS.md#71](./CENTER-GIS.md#71-数据不更新)                                                                                            |
| 弹窗不显示          | 检查 `showPopup` 配置、字段数据        | [DispatchLegend.md#83](./DispatchLegend.md#83-图例状态不同步)                                                                                |
| 跨地市飞线不显示    | 检查区域层级、`showCrossLine` 配置     | [CENTER-GIS.md#73](./CENTER-GIS.md#73-跨地市飞线不显示)                                                                                      |
| 乡镇退服联动不生效  | 检查 `alarmType`、`selected` 状态      | [damageToTownsGisPin.md#101](./damageToTownsGisPin.md#101-联动不生效)                                                                        |
| 传输子图层缺失/重复 | 检查 `optical` 是否按 `;` 拆分并去重   | [MapEmergencyTransmissionView.md#33-circuitnames-计算与-optical-去重](./MapEmergencyTransmissionView.md#33-circuitnames-计算与-optical-去重) |

---

## 📁 文件路径速查

| 类型         | 文件路径                                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| 主组件       | `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`             |
| 地图工具类   | `apps/main/app/components/center/dispatch-gis/center-gis/utils/mapInit.tsx`     |
| 字段配置     | `apps/main/app/components/center/dispatch-gis/center-gis/utils/field.ts`        |
| 图例组件     | `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`        |
| 传输路由视图 | `apps/main/app/components/center/dispatch-gis/MapEmergencyTransmissionView.tsx` |
| 乡镇退服组件 | `apps/main/app/components/right/network-compact/damage-to-towns/index.tsx`      |
| API 请求     | `apps/main/app/request/center.ts`                                               |
| 全局状态     | `apps/main/app/store.ts`                                                        |

---

**文档版本**: 3.1
**最后更新**: 2026-06-26
**维护团队**: GD Emergency Support Team
**整理内容**: - 第13、14节精简：移除与 [CENTER-GIS.md](./CENTER-GIS.md) §3.6.3 / §3.6.6 的重复内容，改为"场景 + 关键文件 + 详细文档链接" - 快速定位优化：减少 token 消耗 - 维护说明：本 SKILL.md 为**入口**，详细设计文档在 [CENTER-GIS.md](./CENTER-GIS.md)
