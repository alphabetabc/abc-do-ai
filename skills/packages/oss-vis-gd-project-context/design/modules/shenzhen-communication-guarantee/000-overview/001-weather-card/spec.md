# weather-card · 天气卡（共享组件）

> 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/components/weather-card/`。固定深圳地市，挂载于 `sub-pages/index.tsx` 头部，两屏共用，不参与 widget 体系（非 registerWidget）。

## 组件构成

- `WeatherCard`（index.tsx）：antd `Space` 横排三段——地市名 / 天气（图标+名称+温度）/ 空气质量（图标+名称+数值）
- 样式 `index.less`；空气质量等级图标 `images/air-*.svg`（本地静态资源，非接口下发）

## 数据获取

- `useRequest(() => getWeatherDataApi())` 单次拉取，无轮询、无参数（接口定义见 [./data-model.md](./data-model.md)）

## 渲染映射（字典匹配）

- 天气图标/名称：`weatherId` → `web/common/weather.ts` 的 `weatherType` 字典（`Icon` 组件按 icon 名渲染，含晴/多云/雨等全量枚举）；`wearthName` 直接展示接口文本
- 空气质量图标/名称：`aqiId` → 组件内 `airType` 常量（'0'优 ~ '5'严重污染，六档配色 svg）；`aqiName` 优先展示接口文本
- 兜底：`region` 缺省显示「深圳」；`temperature` 为 nil 或空串时不渲染温度段；`aqiValue` / `aqiName` 缺省显示空字符串

## 交互

- 无交互、无联动字段（不订阅 fields.ts），纯展示组件

## 维护注意

- **参数策略（004-00 已确认 2026-10-10）**：由服务端控制按深圳出数，前端不传 area/areaName，viewPageArgs 保持空 `{}`；勿在此组件或接口层补区域参数
- 天气字典是全局共享（`web/common/weather.ts`，信管局同源），改字典会影响其它模块
