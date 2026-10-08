# cmd-dispatcher-center · map-geo presets

> 源码：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/map-view/map-geo/presets.ts`
> **此份未接线**：该中心 map-view 实际使用 `map-gis/`，不引用 map-geo。以下仅描述代码现状。

## legendGroupTypes / legendCategories

- `legendGroupTypes` 定义三个分组：**保障任务** / **网络设备** / **应急物资**。
- `legendCategories` 结构：`Record<TLegendGroupType, Array<{ label, value, color }>>` —— 是「图例颜色映射表」，不驱动数据请求。

## geoBuilder

四层 geo（描边层 / 底色层 / 粗边层 / 可交互层）：

- 无 `selectedMode` / select 态
- 底色 `rgba(68,75,84,1)`（另两中心为 `rgba(41,50,57,1)`）
- 支持 `config.geoSilent` 外部静音
