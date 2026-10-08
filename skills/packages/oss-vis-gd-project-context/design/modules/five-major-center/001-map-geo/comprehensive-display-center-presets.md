# comprehensive-display-center · map-geo presets

> 源码：`web/pages/five-major-center/comprehensive-display-center/modules/center/map-view/map-geo/presets.ts`

## legendCategories

枚举 `LegendCategoriesEnums`：`comprehensive-map-personal` / `comprehensive-map-government` / `comprehensive-map-home` / `comprehensive-map-network`。

结构：`[{ label, value, icon, children: [{ label, value, viewItemId?, dataTypes: [{ label, value, color }] }] }]`

- 现存有效分类：**个人业务**（用户数 / 流量 / 话务量）、**家庭业务**（宽带 / IPTV / 爱家TV / 固话 / 千兆宽带 / FTTR用户 / 看家 / 全屋WiFi）、**网络规模**（无线网 / 传输网）
- **政企业务** 整块被注释停用（presets.ts 中注释代码）
- `viewItemId`（如 showCenter-02）供 InfoCard 趋势图请求使用（见 [comprehensive-display-center-data-model.md](./comprehensive-display-center-data-model.md)）；`dataTypes` 仅供 Legend 展示配色

## geoBuilder

四层 geo（描边层 / 底色层 / 粗边层 / 可交互层）：

- 可交互层 `selectedMode: true`，选中色 `rgba(21,135,196,1)`，label 字号 16
- 底色 `rgba(41,50,57,1)`

## seriesBuilder

- scatter 图标按 `context.legendGroup` 切换（个人/政企/家庭/网络四张 SVG）
- 每个点位转为 scatter 数据项：`{ name: zoneName, value: [longitude, latitude], __rawData__: 原始对象 }`；`offsetLines` 收集为 `lines` 系列

## mapDefaults

`legendActiveItem` 为个人业务 —— 组件挂载时 `useEffect` 以它触发一次默认选中。
