# components · 可复用组件文档目录

> 作用：`web/components/` 可复用组件（组件层）的用法文档目录。本 README 为目录级入口，只做分组索引。

## 目录索引

| 子目录 | 组件 | 内容 |
| --- | --- | --- |
| [001-emap-gis/](./001-emap-gis/README.md) | `web/components/ui/emap-gis/` | EMapView 地图组件：加载器、生命周期、子组件、工具 |
| [002-react-echarts/](./002-react-echarts/README.md) | `web/components/ui/react-echarts/` | ReactECharts 图表组件：props、更新行为、样式预设、示例 |
| [003-rc-echarts-map/](./003-rc-echarts-map/README.md) | `web/components/ui/rc-echarts-map/` | EChartsMap 地图底层组件：props、builders、overlay |
| [004-iframe-loader/](./004-iframe-loader/README.md) | `web/components/ui/iframe-loader/` | IframeLoader：URL 格式化（token 注入）与 iframe 加载 |

## 组织规则

- 子目录按 `NNN-<slug>/` 编号，README 为入口，主题细节拆子文档
- 判据：文档描述的对象在 `web/components/` 下、可跨业务模块复用 → 归本目录
- 新增组件文档时在本表与 `../SKILL.md` 场景表同步追加
