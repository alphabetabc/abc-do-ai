# map-geo · MapGeo 地图组件维护

> 作用：维护与扩展 `MapGeo` 地图可视化组件：业务分类、地图样式、弹窗信息、交互逻辑。
> 技术底座：ECharts 系（`web/components/ui/rc-echarts/map` 的 `EChartsMap`），底层组件用法（Props / builder 契约 / Overlay 体系）见 `design/components/003-rc-echarts-map/README.md`。

## 快速上手

map-geo 在三中心各有一份平行拷贝，互不引用：

| 中心         | 路径                                                                                        | 接线状态                                                          |
| ------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 综合展示中心 | `web/pages/five-major-center/comprehensive-display-center/modules/center/map-view/map-geo/` | 已接线（map-view 引用）                                           |
| 信息枢纽中心 | `web/pages/five-major-center/information-hub-center/modules/center/map-view/map-geo/`       | 已接线                                                            |
| 指挥调度中心 | `web/pages/five-major-center/cmd-dispatcher-center/modules/center/map-view/map-geo/`        | **未接线**（该中心 map-view 实际使用 `map-gis/`，不引用 map-geo） |

另：comprehensive-display-center 下存在 `map-geo-bak/` 备份目录（历史版本，不参与构建引用）。

各份内部结构（以 comprehensive 为例）：

- `index.tsx` — 主控制器（状态、点击交互、数据请求）
- `presets.ts` — 配置中心（geoBuilder / seriesBuilder / legendCategories / mapDefaults）
- `InfoCard.tsx` — 详情卡片（含内嵌 LineChart，仅 comprehensive 有）
- `Legend.tsx` — 业务分类切换组件
- `Points.tsx` / `Points*.tsx` — Overlay 点位渲染（当前实现中 comprehensive 的 Points.tsx 未被 index.tsx 引用；cmd-dispatcher 用 Points* 三个变体）

## 文档索引

按中心 × 主题组织（阅读某一中心从上到下三个文档读完；跨中心对比看 diff）：

**综合展示中心（comprehensive-display-center）**

- [comprehensive-display-center-presets.md](./comprehensive-display-center-presets.md) — legendCategories / geoBuilder / seriesBuilder / mapDefaults
- [comprehensive-display-center-data-model.md](./comprehensive-display-center-data-model.md) — dataSource 字段表、接口与 mock 路径
- [comprehensive-display-center-interactions.md](./comprehensive-display-center-interactions.md) — 点击 / 分类切换 / InfoCard 弹窗、空数据与缓存

**信息枢纽中心（information-hub-center）**

- [information-hub-center-presets.md](./information-hub-center-presets.md) — legendCategories / infoCardTemplate / geoBuilder / seriesBuilder
- [information-hub-center-data-model.md](./information-hub-center-data-model.md) — 地图数据 Map 结构、接口路径
- [information-hub-center-interactions.md](./information-hub-center-interactions.md) — 点击 / 分类切换 / 模板弹窗、空数据与缓存

**指挥调度中心（cmd-dispatcher-center，未接线）**

- [cmd-dispatcher-center-presets.md](./cmd-dispatcher-center-presets.md) — legendGroupTypes / legendCategories / geoBuilder
- [cmd-dispatcher-center-data-model.md](./cmd-dispatcher-center-data-model.md) — 三个统计接口与返回结构
- [cmd-dispatcher-center-interactions.md](./cmd-dispatcher-center-interactions.md) — 区域点击上抛 / 分组切换

**跨中心**

- [diff-three-centers.md](./diff-three-centers.md) — 三中心差异明细（对比视角）

## 维护准则

- **改哪份**：只在接线的中心（comprehensive / information-hub）修改；cmd-dispatcher 份未接线，勿当作用中实现。
- **三份漂移**：拷贝互不同步，改动一份前先 diff 另两份，确认是否需要同步。
- **新增分类**：在对应中心 `presets.ts` 的 `legendCategories` 添加新项；自定义图标注意路径正确。
- **修改配色**：调整 `geoBuilder` 的 `itemStyle`（`borderColor` / `color` / `shadowColor`）。
- **点位交互**：点击行为看对应中心 `index.tsx` 的 `onMapClick`（详见各中心 interactions 文档）。
