---
name: warn-gis-risk-prediction-points
description: 应急支撑系统中地图预警信息展示的核心模块，负责在 GIS 地图上渲染各类风险预测打点
---

# warn-gis-risk-prediction-points 风险预测打点模块

## 概述

`risk-prediction-points` 是应急支撑系统中地图预警信息展示的核心模块，负责在 GIS 地图上渲染风险预测打点，包括天气、气象预警、水情预警和高风险乡镇信息。

## 适用场景

当任务涉及以下内容时应使用本 Skill：

- 修改 `apps/main/app/components/center/warn-gis/risk-prediction-points` 相关代码。
- 调整天气、气象预警、水情预警、高风险乡镇打点展示。
- 修改地图打点弹窗、详情卡片、图例控制或点位数据匹配逻辑。
- 新增风险预测打点类型或调整现有打点数据流。

## 目录结构

```text
risk-prediction-points/
├── index.tsx          # 主组件，数据源管理与状态协调
├── index.css          # 全局样式（打点基础样式）
├── OverlayPoint.tsx   # 覆盖层打点组件，地图坐标映射与 Portal 管理
├── weather/           # 天气模块
├── weather-warning/   # 气象预警模块
├── water-warning/     # 水情预警模块
└── high-risk-town/    # 高风险乡镇模块
```

## 核心组件

### RiskPredictionPoints

**文件位置**：`apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx`

**职责**：

- 管理天气/气象预警、水情预警/降雨量、高风险乡镇三类数据源。
- 处理区域、支撑任务、图例选中状态变化。
- 将数据匹配到 `labelPoints.points` 后交给 `OverlayPoint` 渲染。
- 渲染省级高风险乡镇统计卡片。

### OverlayPoint

**文件位置**：`apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx`

**职责**：

- 根据地图坐标计算打点像素位置。
- 为各类详情弹窗提供 Portal 挂载能力。
- 监听内容变化自动调整 zIndex，确保弹窗展示层级正确。

## 四个业务组件参考文档

四个业务组件已拆分到 `references/` 目录维护：

| 组件           | 参考文档                        | 说明                                               |
| -------------- | ------------------------------- | -------------------------------------------------- |
| Weather        | `references/weather.md`         | 天气图标、温度展示、天气详情弹窗                   |
| WeatherWarning | `references/weather-warning.md` | 气象预警图标、预警详情卡片、预警级别映射           |
| WaterWarning   | `references/water-warning.md`   | 水情预警详情、降雨量详情表格                       |
| HighRiskTown   | `references/high-risk-town.md`  | 高风险乡镇数量、详情表格、省级统计卡片、退服趋势图 |

## Presets 总体说明

每个业务模块都有一个 `presets.tsx`，职责是提供图例配置、类型映射、数据转换等纯逻辑函数，与组件 UI 分离。

| 模块           | presets 文件                  | 核心导出                                                                                | 职责                                               |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| WeatherWarning | `weather-warning/presets.tsx` | `getMapWeatherWarningLegendTypes`, `mapWeatherWarningLevelTypes`                        | 图例配置解析（带图标工厂），预警级别映射           |
| WaterWarning   | `water-warning/presets.tsx`   | `getWaterWarningLegendTypes`, `getRainfallLegendTypes`                                  | 水情预警图例、降雨量图例（两套独立配置）           |
| HighRiskTown   | `high-risk-town/presets.tsx`  | `HighRiskTownLegendType`, `showHighRiskTownLegendType`, `getInfo`, `getTableDataSource` | 图例常量与判断、摘要信息生成、表格列定义与数据转换 |

### presets 通用模式

1. **图例解析**：通过 `getEnvironment()` 读取环境配置，懒加载缓存到模块变量，避免重复解析。
2. **图标工厂**：根据环境配置中的图标路径，返回 React 组件（48x48px 图标）。
3. **数据转换**：将 API 原始 `rows` 转换为组件可用的数据结构，集中管理字段映射和格式化逻辑。

### 新增 presets 的步骤

1. 在对应模块目录下创建或扩展 `presets.tsx`。
2. 如需图例支持，添加环境配置路径并在 `getEnvironment()` 中读取。
3. 导出图例解析函数、类型常量、数据转换函数。
4. 在主组件 `index.tsx` 中导入并使用。

## 数据获取与刷新

| 数据类型          | API 函数                      | 刷新频率 | 主要依赖参数                                   |
| ----------------- | ----------------------------- | -------- | ---------------------------------------------- |
| 天气 + 气象预警   | `getMapWeatherWarningApi`     | 15 分钟  | `zoneId`, `zoneLevel`, `taskId`, `labelPoints` |
| 水情预警 + 降雨量 | `getWaterWarningMapPointsApi` | 15 分钟  | `zoneId`, `zoneLevel`, `labelPoints`           |
| 高风险乡镇        | `getHighRiskTownMapApi`       | 15 分钟  | `zoneId`, `zoneLevel`, `labelPoints`           |

## API 接口依赖

| API 函数                                  | 模块   | 说明                     | 调用位置                      |
| ----------------------------------------- | ------ | ------------------------ | ----------------------------- |
| `getMapWeatherWarningApi`                 | center | 获取天气和气象预警数据   | `index.tsx`                   |
| `getMapWeatherWarningFeatureDetailApi`    | center | 获取天气详情预报         | `weather/useDetail.tsx`       |
| `getWaterWarningMapPointsApi`             | center | 获取水情预警和降雨量数据 | `index.tsx`                   |
| `getWaterWarningDetailCardApi`            | center | 获取水情预警详情         | `water-warning/Water.tsx`     |
| `getWaterWarningRainfallDetailApi`        | center | 获取降雨量详情           | `water-warning/Rainfall.tsx`  |
| `getHighRiskTownMapApi`                   | center | 获取高风险乡镇数据       | `index.tsx`                   |
| `getHighRiskTownMapDetailApi`             | center | 获取高风险乡镇详情       | `high-risk-town/index.tsx`    |
| `getHighRiskTownInfoCardApi`              | center | 获取省级统计卡片数据     | `high-risk-town/InfoCard.tsx` |
| `getEmergencyRiskPredictionTrendChartApi` | left   | 获取退服预测趋势图数据   | `high-risk-town/InfoCard.tsx` |

## 配置依赖

| 配置路径                                                           | 说明             | 用途                          |
| ------------------------------------------------------------------ | ---------------- | ----------------------------- |
| `gd-emergency-support.risk-prediction-points.weatherWaring.legend` | 气象预警图例配置 | `weather-warning/presets.tsx` |
| `gd-emergency-support.risk-prediction-points.waterWarning.legend`  | 水情预警图例配置 | `water-warning/presets.tsx`   |
| `gd-emergency-support.risk-prediction-points.rainfall.legend`      | 降雨量图例配置   | `water-warning/presets.tsx`   |

## 数据流

```text
接口数据
  ├── getMapWeatherWarningApi
  ├── getWaterWarningMapPointsApi
  └── getHighRiskTownMapApi
        ↓
RiskPredictionPoints 状态管理
        ↓
labelPoints.points 点位匹配
        ↓
OverlayPoint 定位和 Portal 管理
        ↓
Weather / WeatherWarning / WaterWarning / HighRiskTown 渲染
```

## 常见维护任务

### 新增预警类型

1. 在对应模块的 `presets.tsx` 中增加图例解析或数据转换逻辑。
2. 更新环境变量图例配置。
3. 在 `OverlayPoint.tsx` 中增加渲染入口。
4. 如需详情弹窗，新增对应详情组件并使用 `OverlayPointContext.createPortal` 挂载。

### 修改刷新频率

刷新频率集中在 `risk-prediction-points/index.tsx` 的 `useRequest` 配置中维护，默认使用 `TIME_RANGE.MINUTE * 15`。

### 调整图例控制

- 天气/气象预警、水情预警、降雨量、高风险乡镇均有各自的图例判断逻辑。
- 修改图例 label/value 时，需要同步检查 `presets.tsx` 和左侧图例面板配置。

### 调整弹窗样式

| 弹窗类型           | 文件位置                      |
| ------------------ | ----------------------------- |
| 天气详情           | `weather/StyledModal.tsx`     |
| 气象预警详情       | `weather-warning/index.tsx`   |
| 水情预警详情       | `water-warning/Water.tsx`     |
| 降雨量详情         | `water-warning/Rainfall.tsx`  |
| 高风险乡镇详情     | `high-risk-town/index.tsx`    |
| 省级高风险乡镇卡片 | `high-risk-town/InfoCard.tsx` |

## 注意事项

- 所有地图弹窗应优先通过 `OverlayPointContext.createPortal` 挂载，省级固定卡片使用 `attachmentRootGetter`。
- 数据匹配失败时应保留必要日志，便于排查点位名称和接口数据不一致问题。
- 新增字段展示前，先确认接口返回字段和转换函数是否一致。
- 样式保持深色背景、白色文字、统一弹窗层级。

## 故障排查

### 打点不显示

- 检查 `currentZone` 是否正确。
- 检查 `labelPoints.points` 是否有数据。
- 检查图例是否选中。
- 检查接口数据中的区域名称是否能匹配点位名称。

### 弹窗不显示

- 检查 `OverlayPoint` 是否已正确渲染。
- 检查 Portal 挂载节点是否存在。
- 检查 zIndex 是否被其他浮层遮挡。

### 数据不更新

- 检查 `refreshDeps` 是否包含必要依赖。
- 检查 `pollingInterval` 是否配置正确。
- 检查接口返回是否为空或字段变更。

## 更新日志

| 版本  | 日期       | 变更说明                                                                                             |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 1.2.0 | 2026-06-09 | 主文档增加 Presets 总体说明；各子模块 reference 文档增加交互、请求、响应、presets 详细说明           |
| 1.1.0 | 2026-06-09 | 增加 `references/` 目录，将 Weather、WeatherWarning、WaterWarning、HighRiskTown 四个业务组件拆分描述 |
| 1.0.0 | 2026-05-19 | 初始版本，包含天气、气象预警、水情预警、高风险乡镇功能                                               |
