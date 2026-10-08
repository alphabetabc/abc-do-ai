# information-hub-center · map-geo 数据模型

> 源码：`web/pages/five-major-center/information-hub-center/modules/center/map-view/map-geo/index.tsx`；接口层 `web/services/information-hub-center/center.ts`。分类与模板配置见 [information-hub-center-presets.md](./information-hub-center-presets.md)。

## 地图数据

来源：`getCenterMapDataApi({ viewItemUnitId })`，`viewItemId: 'region-map'`，`viewPageId: 'information-hub-center-middle-page'`。mock 请求已注释停用（走真实接口），历史 mock 文件为 `public/static/mock/information-hub-center/information-hub-center-middle-page-region-map-{viewItemUnitId}.json`（现存 5 个 viewItemUnitId 对应文件）。

返回 **Map**（key 为 `regionId`）：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| key: `regionId` | string | 地市 id（对应 mapConfig.id） |
| `regionId` | string | 同 key |
| `viewItemUnitId` | string | 当前分类（请求参数回填） |
| `items` | array | 明细项，含 `traffType` / `kpiName` / `kpiValue` / `kpiUnit` 等 |

services 层错误 / 空返回空 Map。
