# Weather 天气组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/index.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/useDetail.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/StyledModal.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/images/`

## 职责

Weather 负责在地图打点上展示天气图标与温度，并在点击后展示天气详情弹窗。

## 交互

1. **打点展示**：点位数据中 `temp` 不为空且不为 `""` 的行渲染为天气卡片，每张卡片 44x38px，展示天气图标和温度值。未被点位匹配的天气数据不渲染。
2. **点击详情**：点击天气卡片调用 `showDetail(info)`，通过 Hook 内部状态控制详情弹窗的打开/关闭、参数请求和内容渲染。支持同时存在多个天气卡片。
3. **详情弹窗**：弹窗内容分为上下两部分：
   - 上部分：当前天气概览（区域名称、数据时间、温度、一小时降水、相对湿度）。
   - 下部分：未来天气预报列表（通过 API 获取），每个预报项展示星期/日期、天气图标（两种天气类型）、温度范围。
4. **关闭弹窗**：点击弹窗关闭按钮重置详情状态，包括打开状态、详情数据、请求参数。

## Presets

Weather 模块本身没有独立的 presets 文件。图例控制由 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningLegendTypes`（来自 `weather-warning/presets.tsx`）统一处理。

## 请求说明

### 1. getMapWeatherWarningFeatureDetailApi

| 项目 | 说明 |
| --- | --- |
| 调用位置 | `weather/useDetail.tsx` |
| 触发时机 | `showDetail` 被调用后，`requestParams` 被设置后自动触发 |
| 请求参数 | `{ zoneId: string, zoneLevel: string }` |
| 请求方式 | `ahooks useRequest`，`ready` 条件为 `isDefined(state.requestParams)` |
| 依赖追踪 | `refreshDeps: [state.requestParams]`，`requestParams` 变化时重新请求 |

**参数说明**：

| 参数 | 来源 | 说明 |
| --- | --- | --- |
| `zoneId` | `info.zoneId` | 点击卡片点位数据中的区域 ID |
| `zoneLevel` | `info.zoneLevel` | 点击卡片点位数据中的区域级别 |

**后端接口**：

| 字段 | 值 |
| --- | --- |
| `viewPageId` | `guarantee-middle-page` |
| `viewItemId` | `weather-forecast` |
| `viewPageArgs` | `{ zoneId, zoneLevel }` |

**响应数据**（`data.viewItemData.rows` 每条记录字段及组件使用方式）：

| 字段 | 类型 | 组件使用 |
| --- | --- | --- |
| `weatherDate` | `string` | 传给 `getDayDisplay` 转为"今天/明天/后天/周X"，并格式化为 `MM/DD` |
| `weatherTypeF` | `string` | 用 `weatherType` 列表匹配 `weatherIdF` 的图标渲染 |
| `weatherTypeS` | `string` | 用 `weatherType` 列表匹配 `weatherIdS` 的图标渲染 |
| `tempMin` | `string` | 显示最低温度 `{tempMin}℃` |
| `tempMax` | `string` | 显示最高温度 `{tempMax}℃` |
| `windDirF` / `windDirS` / `windPowerF` / `windPowerS` | `string` | 预留，当前组件未使用 |
| `weatherIdF` | `string` | 用于查找天气图标（`weatherType` 列表中的 `id`） |
| `weatherIdS` | `string` | 用于查找天气图标（`weatherType` 列表中的 `id`） |

**错误处理**：无显式错误处理，API 返回空数组时详情弹窗不显示预报列表内容。

### 2. 点位天气数据的获取

天气点位数据由 `risk-prediction-points/index.tsx` 通过 `getMapWeatherWarningApi` 统一获取，详情参见 [weather-warning.md](./weather-warning.md) 中的请求说明。

## 响应说明

Weather 模块在组件内部无独立响应数据处理逻辑，核心数据流为：

- 天气点位数据由 `getMapWeatherWarningApi` 聚合后，按 `zoneId` 匹配到 `OverlayPoint` 点位。
- 每个点位点位上的天气数据（`cityWeather` 数组）通过 `overlayPointCtx` 传入 Weather 组件。
- 详情弹窗数据由 `getMapWeatherWarningFeatureDetailApi` 直接返回 `rows` 数组。

点位天气数据结构：

```typescript
{
    zoneId: string;
    zoneName: string;
    zoneLevel: string;
    weatherId: string;    // 用于匹配 weatherType 图标
    temp: string;         // 温度值
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