---
name: warn-gis-risk-prediction-points
description: 应急支撑系统中地图预警信息展示的核心模块，负责在 GIS 地图上渲染各类风险预测打点
---

# warn-gis-risk-prediction-points 风险预测打点模块

## 概述

`risk-prediction-points` 是应急支撑系统中地图预警信息展示的核心模块，负责在 GIS 地图上渲染各类风险预测打点，包括天气、气象预警、水情预警和高风险乡镇信息。

## 目录结构

```
risk-prediction-points/
├── index.tsx          # 主组件，数据源管理与状态协调
├── index.css          # 全局样式（打点基础样式）
├── OverlayPoint.tsx   # 覆盖层打点组件，地图坐标映射与Portal管理
├── weather/           # 天气模块
│   ├── index.tsx      # 天气图标与温度展示组件
│   ├── useDetail.tsx  # 天气详情弹窗逻辑（Hook）
│   ├── StyledModal.tsx# 天气详情弹窗样式组件
│   └── images/        # 天气详情图标资源
├── weather-warning/   # 气象预警模块
│   ├── index.tsx      # 气象预警图标与详情卡片
│   └── presets.tsx    # 预警类型配置与图标工厂
├── water-warning/     # 水情预警模块
│   ├── index.tsx      # 水情预警入口组件
│   ├── Water.tsx      # 水情预警详情卡片
│   ├── Rainfall.tsx   # 降雨量详情表格
│   └── presets.tsx    # 水情与降雨量图例配置
└── high-risk-town/    # 高风险乡镇模块
    ├── index.tsx      # 高风险乡镇数量展示
    ├── InfoCard.tsx   # 省级统计信息卡片
    └── presets.tsx    # 表格配置与数据转换
```

## 功能特性

### 1. 数据获取与刷新

| 数据类型        | API 函数                      | 刷新频率 | 依赖参数                               |
| --------------- | ----------------------------- | -------- | -------------------------------------- |
| 天气+气象预警   | `getMapWeatherWarningApi`     | 15分钟   | zoneId, zoneLevel, taskId, labelPoints |
| 水情预警+降水量 | `getWaterWarningMapPointsApi` | 15分钟   | zoneId, zoneLevel, labelPoints         |
| 高风险乡镇      | `getHighRiskTownMapApi`       | 15分钟   | zoneId, zoneLevel, labelPoints         |

### 2. 图层渲染

- 基于 WFS 图层数据进行打点定位
- 支持图例控制显示/隐藏各类预警
- 自动计算 zIndex 确保弹窗层级正确

### 3. 交互功能

- 点击图标弹出详情卡片
- 支持多卡片堆叠展示
- 卡片支持关闭操作

## 核心组件详解

### 1. RiskPredictionPoints（主组件）

**文件位置**：[index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx)

**职责**：

- 管理三个核心数据源的获取和状态
- 协调各子组件的数据分发
- 处理图例选中状态的过滤逻辑

**props 参数**：

| 参数           | 类型 | 说明                                     | 必填 |
| -------------- | ---- | ---------------------------------------- | ---- |
| currentZone    | any  | 当前选中区域信息（含 zoneId, zoneLevel） | 是   |
| supportTask    | any  | 支撑任务信息（含 id）                    | 是   |
| legendSelected | any  | 图例选中状态对象                         | 是   |

**数据状态**：

| 状态字段           | 类型  | 说明                     |
| ------------------ | ----- | ------------------------ |
| weatherPoints      | any[] | 天气和气象预警数据数组   |
| waterWarningPoints | any[] | 水情预警和降雨量数据数组 |
| highRiskPoints     | any[] | 高风险乡镇数据数组       |

**关键实现**：

- 使用 `useRequest` 实现自动轮询（15分钟）
- 通过 `syncState.current` 记录数据变更状态
- 基于 `labelPoints.points` 进行数据匹配渲染

### 2. OverlayPoint（覆盖层打点组件）

**文件位置**：[OverlayPoint.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx)

**职责**：

- 监听地图渲染事件，动态计算像素坐标
- 创建 React Portal 用于弹窗挂载
- 自动管理 zIndex 确保弹窗可见性

**核心逻辑**：

```typescript
// 地图坐标转换
useEffect(() => {
  return overlayManager.onRender(() => {
    const pos = overlayManager.getPixelFromCoordinate([
      props.point.longitude,
      props.point.latitude,
    ]);
    // 更新定位...
  });
}, [props.point]);

// zIndex 自动管理（弹窗显示时提升层级）
useEffect(() => {
  const observer = new MutationObserver((mutations) => {
    // 根据子元素变化动态调整 zIndex
  });
}, []);
```

**Context 提供**：

- `OverlayPointContext` - 提供 `createPortal` 方法供子组件挂载弹窗

### 3. Weather（天气模块）

#### 3.1 Weather/index.tsx

**文件位置**：[weather/index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/weather/index.tsx)

**职责**：显示天气图标和温度，点击弹出详情

**数据结构**：

```typescript
{
    temp: string,      // 温度
    weatherIcon: string, // 天气图标类型
    zoneId: string,    // 区域ID
    zoneName: string,  // 区域名称
    zoneLevel: string, // 区域级别
    rain1h: string,    // 一小时降水
    humidity: string,  // 相对湿度
    dataTime: string,  // 数据时间
}
```

**样式特点**：44x38px 灰色背景卡片，展示图标和温度

#### 3.2 weather/useDetail.tsx

**文件位置**：[weather/useDetail.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/weather/useDetail.tsx)

**职责**：天气详情弹窗逻辑（自定义 Hook）

**核心功能**：

- 管理弹窗打开/关闭状态
- 获取天气详情数据（`getMapWeatherWarningFeatureDetailApi`）
- 提供 `showDetail` 方法供外部调用
- 格式化日期显示（今天/明天/后天/周几）

**数据获取**：

```typescript
const { data: featureDetail } = useRequest(
  () => getMapWeatherWarningFeatureDetailApi(state.requestParams),
  {
    ready: isDefined(state.requestParams),
    refreshDeps: [state.requestParams],
  }
);
```

#### 3.3 weather/StyledModal.tsx

**文件位置**：[weather/StyledModal.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/weather/StyledModal.tsx)

**职责**：天气详情弹窗样式组件

**布局结构**：

- 左侧：当前天气详情（图标、温度、降水、湿度）
- 右侧：未来多日天气预报列表（支持多日展示）

**样式特点**：渐变背景（深灰到浅灰），284px 高度

### 4. WeatherWarning（气象预警模块）

#### 4.1 weather-warning/index.tsx

**文件位置**：[weather-warning/index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/weather-warning/index.tsx)

**职责**：显示气象预警图标，点击弹出预警详情卡片

**预警级别映射**：

```typescript
const mapWeatherWarningLevelTypes = [
  { name: '白色', value: '1', type: 'white' },
  { name: '蓝色', value: '2', type: 'blue' },
  { name: '黄色', value: '3', type: 'yellow' },
  { name: '橙色', value: '4', type: 'orange' },
  { name: '红色', value: '5', type: 'red' },
];
```

**卡片数据结构**：

```typescript
{
    title: string,    // 预警标题（senderCnname）
    content: string,  // 预警内容
    index: number,    // 索引位置
}
```

#### 4.2 weather-warning/presets.tsx

**文件位置**：[weather-warning/presets.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/weather-warning/presets.tsx)

**职责**：气象预警图例配置与图标工厂

**配置来源**：环境变量 `gd-emergency-support.risk-prediction-points.weatherWaring.legend`

**图标生成**：根据预警级别动态选择图标路径

### 5. WaterWarning（水情预警模块）

#### 5.1 water-warning/index.tsx

**文件位置**：[water-warning/index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/index.tsx)

**职责**：水情预警入口组件，协调 Water 和 Rainfall 组件

**条件渲染**：

- 水情预警：`!isEmpty(props.waterWarning)`
- 降雨量：`!isEmpty(props.rainfall)`

#### 5.2 water-warning/Water.tsx

**文件位置**：[water-warning/Water.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/Water.tsx)

**职责**：水情预警详情卡片展示

**API 调用**：`getWaterWarningDetailCardApi`

**详情卡片数据**：

```typescript
{
    title: string,   // 预警标题
    content: string, // 预警内容
}
```

**布局特点**：480px 宽度，255px 内容高度

#### 5.3 water-warning/Rainfall.tsx

**文件位置**：[water-warning/Rainfall.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/Rainfall.tsx)

**职责**：降雨量详情表格展示

**表格列定义**：

| 列名       | 数据字段   | 宽度  | 说明                 |
| ---------- | ---------- | ----- | -------------------- |
| -          | type       | 20px  | 类型标识（颜色圆点） |
| 地市       | regionName | 85px  | 地市名称             |
| 区县       | cityName   | 185px | 区县名称             |
| 降雨量(mm) | rainfall   | -     | 降雨量数值           |

**API 调用**：`getWaterWarningRainfallDetailApi`

#### 5.4 water-warning/presets.tsx

**文件位置**：[water-warning/presets.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/presets.tsx)

**职责**：水情预警和降雨量图例配置

**配置来源**：

- 水情预警：`gd-emergency-support.risk-prediction-points.waterWarning.legend`
- 降雨量：`gd-emergency-support.risk-prediction-points.rainfall.legend`

### 6. HighRiskTown（高风险乡镇模块）

#### 6.1 high-risk-town/index.tsx

**文件位置**：[high-risk-town/index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/index.tsx)

**职责**：显示高风险乡镇数量，点击弹出详情表格

**样式特点**：橙色背景（rgb(243, 102, 8)），44x38px 卡片

**详情表格调用**：`getHighRiskTownMapDetailApi`

#### 6.2 high-risk-town/InfoCard.tsx

**文件位置**：[high-risk-town/InfoCard.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/InfoCard.tsx)

**职责**：省级高风险乡镇统计信息卡片（固定定位在右上角）

**位置**：right: 60px, top: 30px

**功能**：

- 显示全省高风险乡镇总数
- 可展开/收起详细表格
- 展示地市/区县/乡镇三级数据

**数据获取**：`getHighRiskTownInfoCardApi`

#### 6.3 high-risk-town/presets.tsx

**文件位置**：[high-risk-town/presets.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/warn-gis/risk-prediction-points/high-risk-town/presets.tsx)

**职责**：表格配置与数据转换

**表格列定义**：

| 列名         | 数据字段   | 宽度  | 说明             |
| ------------ | ---------- | ----- | ---------------- |
| 地市         | regionName | 100px | 支持 rowspan合并 |
| 区县         | areaName   | 100px | 支持 rowspan合并 |
| 乡镇         | townName   | 100px | -                |
| 风险描述     | riskDesc   | 190px | 退服比例和数量   |
| 物资预置建议 | suggestion | 250px | 物资配置建议     |

**数据转换逻辑**：

```typescript
riskDesc: `预计245G基站退服比例达到${row.btsOutRate}%，退服数为${row.btsOutNbr}，请及时关注。`;

suggestion: `该区县物资储备有${row.bagNum}台卫星电话，${row.oilEngineNum}台油机，建议高风险乡镇至少配置1套卫星便携包，2-3台卫星电话，1台油机。`;
```

## API 接口依赖

| API 函数                               | 模块   | 说明                     | 调用位置                    |
| -------------------------------------- | ------ | ------------------------ | --------------------------- |
| `getMapWeatherWarningApi`              | center | 获取天气和气象预警数据   | index.tsx                   |
| `getMapWeatherWarningFeatureDetailApi` | center | 获取天气详情预报         | weather/useDetail.tsx       |
| `getWaterWarningMapPointsApi`          | center | 获取水情预警和降雨量数据 | index.tsx                   |
| `getWaterWarningDetailCardApi`         | center | 获取水情预警详情         | water-warning/Water.tsx     |
| `getWaterWarningRainfallDetailApi`     | center | 获取降雨量详情           | water-warning/Rainfall.tsx  |
| `getHighRiskTownMapApi`                | center | 获取高风险乡镇数据       | index.tsx                   |
| `getHighRiskTownMapDetailApi`          | center | 获取高风险乡镇详情       | high-risk-town/index.tsx    |
| `getHighRiskTownInfoCardApi`           | center | 获取省级统计卡片数据     | high-risk-town/InfoCard.tsx |

## 配置依赖

### 环境变量配置

| 配置路径                                                           | 说明             | 用途                        |
| ------------------------------------------------------------------ | ---------------- | --------------------------- |
| `gd-emergency-support.risk-prediction-points.waterWarning.legend`  | 水情预警图例配置 | water-warning/presets.tsx   |
| `gd-emergency-support.risk-prediction-points.rainfall.legend`      | 降雨量图例配置   | water-warning/presets.tsx   |
| `gd-emergency-support.risk-prediction-points.weatherWaring.legend` | 气象预警图例配置 | weather-warning/presets.tsx |

### 图例配置格式

```json
{
  "label": "图例显示名称",
  "value": "数据匹配值",
  "color": "#FF0000",
  "warningTitle": "预警标题（仅水情）",
  "icon": "图标路径（或按级别配置）"
}
```

## 组件依赖关系图

```
RiskPredictionPoints (主组件)
    ├── OverlayPoint (打点容器)
    │       ├── Weather (天气)
    │       │       └── StyledModal (详情弹窗)
    │       ├── WeatherWarning (气象预警)
    │       ├── WaterWarning (水情预警)
    │       │       ├── Water (水情详情)
    │       │       └── Rainfall (降雨量)
    │       └── HighRiskTown (高风险乡镇)
    └── HighRiskTownProvinceInfoCard (省级统计卡片)
```

## 常见维护任务

### 1. 添加新的预警类型

**步骤**：

1. 在对应模块的 `presets.tsx` 中添加配置解析逻辑
2. 更新环境变量配置（图例列表）
3. 在 `OverlayPoint.tsx` 中添加子组件渲染
4. 如需详情弹窗，创建对应的详情组件

### 2. 修改刷新频率

**位置**：`index.tsx`

```typescript
useRequest(
  () => {
    /* ... */
  },
  {
    pollingInterval: TIME_RANGE.MINUTE * 15, // 修改此值（毫秒）
    // ...
  }
);
```

### 3. 调整弹窗样式

| 弹窗类型       | 文件位置                   | 调整内容                 |
| -------------- | -------------------------- | ------------------------ |
| 天气详情       | weather/StyledModal.tsx    | 宽度、高度、背景色、字体 |
| 气象预警详情   | weather-warning/index.tsx  | 卡片样式（440px宽度）    |
| 水情预警详情   | water-warning/Water.tsx    | 卡片样式（480px宽度）    |
| 降雨量详情     | water-warning/Rainfall.tsx | 表格样式（435px宽度）    |
| 高风险乡镇详情 | high-risk-town/index.tsx   | 表格样式（800px宽度）    |

### 4. 新增数据字段

**流程**：

1. 确认 API 返回新字段
2. 在对应组件中添加字段展示逻辑
3. 如需样式调整，更新 styled-components

### 5. 调整图例控制逻辑

**位置**：各子组件的 `legendSelected` 判断逻辑

```typescript
// 示例：weather-warning/index.tsx
const legendSelected = useMemo(() => {
  return getMapWeatherWarningLegendTypes()
    .map((d) => {
      const selected = props.legendSelected.some(
        (s: any) => s[0] === d.label && s[1] === true
      );
      return selected ? d : null;
    })
    .filter(Boolean);
}, [props.legendSelected]);
```

## 数据流转图

```
┌─────────────────────────────────────────────────────────────────┐
│                      数据获取层                                 │
├─────────────────────────────────────────────────────────────────┤
│  getMapWeatherWarningApi        →  weatherPoints                │
│  getWaterWarningMapPointsApi    →  waterWarningPoints          │
│  getHighRiskTownMapApi          →  highRiskPoints              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据匹配层                                 │
├─────────────────────────────────────────────────────────────────┤
│  labelPoints.points.forEach(point => {                          │
│      weather = weatherPoints.find(d => d.config.name === ...)  │
│      waterSituation = waterWarningPoints.find(...)             │
│      highRiskTown = highRiskPoints.find(...)                   │
│  })                                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      渲染层                                     │
├─────────────────────────────────────────────────────────────────┤
│  <OverlayPoint>                                                │
│      <Weather />                                               │
│      <WeatherWarning />                                        │
│      <WaterWarning />                                          │
│      <HighRiskTown />                                          │
│  </OverlayPoint>                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 注意事项

### 性能优化

1. **大量打点时**：注意地图渲染性能，可考虑虚拟化或按需加载
2. **缓存策略**：使用 `syncState` 进行数据缓存，避免重复渲染

### 图例同步

- 确保图例选中状态与各组件渲染逻辑一致
- 新增预警类型时需同步更新图例配置

### 错误处理

- 各 API 调用需做好异常处理和空数据判断
- 数据匹配失败时输出错误日志便于排查

### 样式一致性

- 弹窗使用统一的设计风格（深色背景、白色文字）
- 图标尺寸统一为 48x48px

### Portal 挂载

- 所有弹窗通过 `OverlayPointContext.createPortal` 挂载到 `bottomTipRef`
- 确保 `attachmentRoot` 存在后再渲染

## 故障排查指南

### 1. 打点不显示

**检查项**：

- `currentZone` 是否正确传入
- `labelPoints.points` 是否有数据
- 图例 `riskPrediction` 是否选中
- 数据匹配逻辑是否正确（`d.config.name === point.name`）

### 2. 弹窗不显示

**检查项**：

- `overlayManager` 是否正常初始化
- `bottomTipRef` 是否存在
- zIndex 是否被正确设置

### 3. 数据不更新

**检查项**：

- `pollingInterval` 是否正确配置
- `refreshDeps` 是否包含必要的依赖项
- API 返回数据是否有变化

### 4. 样式异常

**检查项**：

- CSS 类名是否正确
- styled-components 是否正确导入
- 父组件样式是否有冲突

## 更新日志

| 版本  | 日期       | 变更说明                                               |
| ----- | ---------- | ------------------------------------------------------ |
| 1.0.0 | 2026-05-19 | 初始版本，包含天气、气象预警、水情预警、高风险乡镇功能 |
