# WeatherWarning 气象预警组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather-warning/index.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather-warning/presets.tsx`

## 职责

WeatherWarning 负责在地图打点上展示气象预警图标，并在点击后展示预警详情卡片。

## Presets

**文件位置**：`weather-warning/presets.tsx`

**核心导出**：

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `getMapWeatherWarningLegendTypes` | `() => Array<{ label: string, value: string, Icon: Component }>` | 读取环境配置 `gd-emergency-support.risk-prediction-points.weatherWaring.legend`，解析为图例项列表。返回的 `Icon` 是一个 React 组件，根据传入的 `type` 参数选择对应路径的图片。使用模块级变量懒加载缓存。 |
| `mapWeatherWarningLevelTypes` | `Array<{ name: string, value: string, type: string }>` | 预警级别硬编码映射表，固定五级：白色(1)、蓝色(2)、黄色(3)、橙色(4)、红色(5)。`value` 为字符串类型（"1"~"5"），与接口 `warningLevel` 字段匹配；`type` 用于图标工厂的动态选择。 |

**图例配置格式**（环境变量 `weatherWaring.legend`）：

```json
{
    "label": "图例显示名称",
    "value": "预警类型值",
    "icon": {
        "blue": "图标路径",
        "orange": "图标路径",
        "yellow": "图标路径",
        "red": "图标路径"
    }
}
```

**图标工厂说明**：每个图例项包含一个 `Icon` 组件，根据传递的 `type`（来自预警级别 `type` 字段，可选 `blue` / `orange` / `yellow` / `red` / `white`）选择对应颜色的图标路径。图标大小为 48x48px。

**图标工厂兜底行为**：
- `type` 未传时，默认为 `"blue"`。
- 若 `item.icon[type]` 在环境配置中找不到对应路径，工厂返回 `null`（不渲染图标，避免运行时错误）。

## 交互

1. **图例过滤**：组件根据父组件传入的 `legendSelected` 列表，调用 `getMapWeatherWarningLegendTypes()` 获取完整图例配置，筛选出当前选中的图例项。只有被选中的图例项对应类型的预警才会渲染图标。
2. **点击预警图标**：点击图例项对应图标时，按图例索引创建/更新详情卡片数据对象。如果同索引已有卡片数据则不重复创建（使用 `isEqual` 判断）。同时通过 `OverlayPointContext.createPortal` 渲染详情卡片列表。
3. **详情卡片**：每张卡片展示预警标题（`senderCnname`）和预警内容（`content`），卡片宽度 440px，标题栏 44px 高度。
4. **关闭卡片**：每张卡片右上角有关闭按钮，点击后移除对应的卡片条目。
5. **多卡片堆叠**：支持不同类型预警同时展示多张详情卡片，按照点击顺序排列。

## 请求说明

WeatherWarning 模块自身不发起 API 请求。

点位预警数据由 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningApi` 统一获取，聚合后的数据中 `weatherWarning` 字段包含了当前点位的预警信息。

**getMapWeatherWarningApi 请求参数**：

| 参数 | 来源 | 说明 |
| --- | --- | --- |
| `zoneId` | `props.currentZone.zoneId` | 当前选中区域 ID |
| `zoneLevel` | `props.currentZone.zoneLevel` | 当前选中区域级别 |
| `taskId` | `props.supportTask.id` | 支撑任务 ID |
| `labelPoints` | 地图 label 点位 | 用于经纬度匹配 |

**后端接口（气象预警部分）**：

| 字段 | 值 |
| --- | --- |
| `viewPageId` | `guarantee-middle-page` |
| `viewItemId` | `meteorological-warning` |
| `viewPageArgs` | `{ zoneId, zoneLevel, emerEventId: taskId }` |

**响应数据**（经 `defaultConverter` 后的 `rows`，每条记录字段及组件使用方式）：

| 字段 | 类型 | 组件使用 |
| --- | --- | --- |
| `config.name` | `string` | （在 `RiskPredictionPoints` 中）用于和 `labelPoints.points[].name` 匹配，匹配成功才进入当前点位的 `weatherWarning` 数组 |
| `zoneId` | `string` | 用于点位聚合匹配（fallback 到 OverlayPoint 的 `data-overlay-point-root-id`） |
| `zoneName` | `string` | 用于点位名称匹配和经纬度补全 |
| `longitude` / `latitude` | `string \| number` | 经纬度，缺失时会从 `labelPoints` 中按名称匹配 |
| `weatherWarning` | `Array<{ warningType, warningLevel, senderCnname, content, ... }>` | 预警数组，传入 `WeatherWarning` 组件 |
| `cityWeather` | `Array<{ weatherId, temp, rain1h, humidity, dataTime, ... }>` | 天气数组，传入 `Weather` 组件 |
| `warningType` | `string` | 匹配图例配置的 `value` 来判断是否属于当前图例类型 |
| `warningLevel` | `string` | 值如 "1"~"5"，匹配 `mapWeatherWarningLevelTypes` 得到 `type`（blue/red 等），用于图标工厂选择对应颜色的图标 |
| `senderCnname` | `string` | 详情卡片的标题 |
| `content` | `string` | 详情卡片的内容 |

**点位匹配逻辑**（位于 `RiskPredictionPoints` 渲染阶段）：

```typescript
state.weatherPoints.find((d) => {
    if (props.legendSelected["riskPrediction"] !== true) return false;
    return d.config.name === point.name;  // labelPoint.name
})
```

匹配失败时会在控制台输出 `[中屏打点-天气-未命中]` 错误日志，便于排查点位名称不一致问题。

## 响应说明

组件的核心数据流为：

1. 父组件 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningApi` 获取聚合数据。
2. 每个 `OverlayPoint` 点位从 `weatherWarning` 字段拿到预警数组。
3. `WeatherWarning` 组件从 `props.data` 接收预警数组，从 `props.legendSelected` 接收图例选中状态。
4. 组件内部使用 `getMapWeatherWarningLegendTypes()` 预解析图例配置，通过 `legendSelected` 过滤出应展示的图例项。
5. 遍历过滤后的图例项，在 `props.data` 中查找匹配 `warningType === legendItem.value` 的预警数据，渲染为可点击图标。
6. 图标点击后创建卡片数据，通过 Portal 渲染详情卡片列表。

## 维护要点

- 新增预警类型时同步更新环境图例配置和 `presets.tsx` 中的 `mapWeatherWarningLevelTypes`。
- 图标路径和级别映射应保持一致。
- 图例过滤逻辑需要与左侧图例面板的 label/value 保持一致。

## 更新日志

| 版本  | 日期       | 变更说明                                                                                                       |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| 1.5.0 | 2026-06-17 | 补充 `value` 字符串类型说明、图标工厂默认 type 与 null 兜底；响应数据表增加 `config.name` / `cityWeather` / 完整 `getMapWeatherWarningApi` 响应字段；新增点位匹配逻辑说明 |