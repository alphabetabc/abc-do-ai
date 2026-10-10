# weather-card · 数据模型

> 接口源码：`web/services/shenzhen-communication-guarantee/components/index.ts` 的 `getWeatherDataApi`。

## 接口定义

| 项 | 值 |
| --- | --- |
| 函数 | `getWeatherDataApi(): Promise<WeatherData \| {}>` |
| 通道 | `getViewItemDataApi`（baseUrlType `sceneViewService`） |
| viewPageId | `open-close-ceremonies-view`（复用信管局视图页） |
| viewItemId | `ceremonies-weather`（沿用信管局实测值） |
| viewPageArgs | 空 `{}`——**服务端控制按深圳配数，前端不传 area/areaName**（004-00 已确认 2026-10-10） |
| 兜底链 | 默认值 → fallback url（getStaticApi，key `shenzhen-communication-guarantee` / `open-close-ceremonies-view-ceremonies-weather`）→ localMockUrl `/static/mock/shenzhen-communication-guarantee/weather.json` |
| 出参形态 | 接口返回 `rows`，函数取 `rows[0]`；err 或空 rows 时返回 `{}` |

## 返回字段（rows[0]）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `region` | string | 地市名，缺省兜底「深圳」 |
| `wearthName` | string | 天气名称（**注意拼写为 wearth，非 weather**，沿用信管局原字段） |
| `weatherId` | string | 天气类型 id，匹配 `web/common/weather.ts` `weatherType` 字典取图标 |
| `temperature` | string | 温度数值，非空时渲染「N℃」 |
| `aqiId` | string | 空气质量等级 id（'0'~'5'），匹配组件内 `airType` 六档字典取图标 |
| `aqiName` | string | 空气质量名称 |
| `aqiValue` | string | 空气质量数值 |

## 类型定义

无独立 type 定义（复用信管局范式，返回值为裸对象）；消费端全部可选链访问 + 兜底，不依赖 interface。
