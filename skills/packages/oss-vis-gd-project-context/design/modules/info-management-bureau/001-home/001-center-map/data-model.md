# 001-center-map · 中心地图（data-model）

> 接口源码：web/services/info-management-bureau/home/center.ts
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/mock/info-management-bureau/home-center-map.json（源码中已注释）、public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-point.json

## getHomeCenterMapDataApi

- 函数定义：`getHomeCenterMapDataApi`（web/services/info-management-bureau/home/center.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/31296

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `competition-homepage-point` |
| viewPageArgs | `{}`（无参数） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | 无 |
| 轮询 | 组件层 15 分钟轮询（见 [spec.md](./spec.md)） |

### 原始响应结构（与 mock 对齐）

外层为视图服务通用包裹（`code: 200`、`message`、`data`），核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题，如「首屏-打点」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者，如「陈厚萍」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（id/名称/经度/纬度/打点类型）
            fieldName: string;     // string，字段名（intId/userlabel/longitude/latitude/type）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，打点数据行
}

interface Row {
    intId: string;          // string，点位唯一 id（与今日赛程选中项联动）
    intId_format: string;   // string，格式化副本，与 intId 相同
    userlabel: string;      // string，场馆/点位名称
    userlabel_format: string;
    longitude: string;      // string，经度
    longitude_format: string;
    latitude: string;       // string，纬度
    latitude_format: string;
    type: string;           // string，打点类型：'1' 开闭幕式、'2' 竞赛、'3' 非竞赛（对应 mapLegendTypes 系列）
    type_format: string;
}
```

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`（非生产环境会在 rows 上附加 `__development__raw` 调试属性，生产无此属性）。随后 `getHomeCenterMapDataApi` 对每行 map：

```ts
interface CenterMapPoint {
    id: string;        // string，取自 intId，点位唯一标识
    name: string;      // string，取自 userlabel，点位名称
    intId: string;     // string，原始字段保留
    userlabel: string; // string，原始字段保留
    longitude: string; // string，原始字段保留
    latitude: string;  // string，原始字段保留
    type: string;      // string，原始字段保留，用于匹配 mapLegendTypes 系列
    type_format: string; // string，原始字段保留
    // ...rows 中其余字段（含 *_format）均经展开保留
}
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-competition-homepage-point'))` —— 当 `data.viewItemData.rows` 为空时请求 `/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-point.json`
- 最终兜底：请求出错或 rows 仍为空时返回 `[]`（空数组，地图不打点）

### mock 数据来源

- public/static/mock/info-management-bureau/home-center-map.json（localMockUrl，源码中已注释）
- public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-point.json

⚠️ 差异：mock 与 fallback JSON 结构一致（同一份打点数据），无字段差异。
