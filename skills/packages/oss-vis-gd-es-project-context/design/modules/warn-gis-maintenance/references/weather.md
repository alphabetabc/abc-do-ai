# Weather 天气组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/index.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/useDetail.tsx`（详情 Hook，独立文档）
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/StyledModal.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/images/`

## 职责

Weather 负责在地图打点上展示天气图标与温度，并在点击后展示天气详情弹窗。

## 交互

1. **打点展示**：点位数据中 `temp` 不为空且不为 `""` 的行渲染为天气卡片，每张卡片 44x38px，展示天气图标和温度值。未被点位匹配的天气数据不渲染。
2. **点击详情**：点击天气卡片调用 `useWeatherDetail().showDetail(info)`，由 Hook 内部状态控制详情弹窗的打开/关闭、参数请求和内容渲染。支持同时存在多个天气卡片。
3. **详情弹窗**：弹窗内容分为上下两部分（详见 [weather-detail.md](./weather-detail.md)）：
   - 上部分：当前天气概览（区域名称、数据时间、温度、一小时降水、相对湿度）。
   - 下部分：未来天气预报列表（通过 API 获取），每个预报项展示星期/日期、天气图标（两种天气类型）、温度范围。
4. **关闭弹窗**：点击弹窗关闭按钮重置详情状态，包括打开状态、详情数据、请求参数。

## Presets

Weather 模块本身没有独立的 presets 文件。图例控制由 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningLegendTypes`（来自 `weather-warning/presets.tsx`）统一处理。

## 请求说明

### 点位天气数据的获取

天气点位数据由 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningApi` 统一获取，详情参见 [weather-warning.md](./weather-warning.md) 中的请求说明。

### 天气详情预报

`getMapWeatherWarningFeatureDetailApi` 的详细字段、参数和响应说明见 [weather-detail.md](./weather-detail.md)。

## 响应说明

Weather 模块在组件内部无独立响应数据处理逻辑，核心数据流为：

- 天气点位数据由 `getMapWeatherWarningApi` 聚合后，按 `zoneId` 匹配到 `OverlayPoint` 点位。
- 每个点位点位上的天气数据（`cityWeather` 数组）通过 `overlayPointCtx` 传入 Weather 组件。
- 详情弹窗数据由 `getMapWeatherWarningFeatureDetailApi` 直接返回 `rows` 数组（详见 weather-detail.md）。

点位天气数据结构（来自 `cityWeather[]` 数组中的一项）：

```typescript
{
    zoneId: string;
    zoneName: string;
    zoneLevel: string;
    weatherId: string;    // 用于匹配 weatherType 图标
    temp: string;         // 温度值（为空时该条不渲染）
    rain1h: string;       // 一小时降水
    humidity: string;     // 相对湿度
    dataTime: string;     // 数据采集时间
    weatherIcon?: string; // 组件内部通过 weatherId 补充的图标类型
}
```

## 维护要点

- 天气图标映射变更时优先检查 `weather/images/` 与图标选择逻辑。
- 详情弹窗样式集中在 `StyledModal.tsx`。
- 详情请求参数需要保持与点位数据中的区域字段一致。
- **天气详情 Hook 的完整说明已拆分到 [weather-detail.md](./weather-detail.md)**。

## 依赖

| 依赖项 | 用途 |
| --- | --- |
| `IconFontWeather` | 天气图标字体组件（`@/app/components/ui/IconFont`） |
| `useWeatherDetail` | 详情 Hook（`./useDetail.tsx`，独立文档） |

## 更新日志

| 版本  | 日期       | 变更说明                                                       |
| ----- | ---------- | -------------------------------------------------------------- |
| 1.5.0 | 2026-06-17 | 拆分天气详情 Hook 到独立文档（`weather-detail.md`），本文档简化 |
