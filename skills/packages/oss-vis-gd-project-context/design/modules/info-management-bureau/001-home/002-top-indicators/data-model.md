# 002-top-indicators · TOP-SECTION-指标（data-model）

> 接口源码：web/services/info-management-bureau/home/section-left.ts（`getTopIndicatorsApi`）
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/mock/info-management-bureau/top-indicators.json（源码中已注释）、public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-statistics.json

## getTopIndicatorsApi

- 函数定义：`getTopIndicatorsApi`（web/services/info-management-bureau/home/section-left.ts）

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `competition-homepage-statistics` |
| viewPageArgs | `{}`（无参数） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | 无 |
| 轮询 | 组件层 15 分钟轮询（沿用首页模块轮询节奏，见 [spec.md](./spec.md)） |

### 原始响应结构（与 mock 对齐）

外层为视图服务通用包裹（`code: 200`、`message`、`data`），核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题，如「首屏-上方-统计数」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者，如「陈厚萍」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（type/num）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（类型/数量）
            fieldName: string;     // string，字段名（type/num）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，指标数据行
}

interface Row {
    type: string;           // string，指标类型：'竞赛场馆' | '非竞赛场馆' | '办公场所' | '酒店' | '医院'
    num: string | number;   // string | number，数量
    // fallback 版本还带 type_format / num_format 副本字段
}
```

⚠️ 差异：mock（top-indicators.json）中 `num` 为 number（如 `12`）、行内无 `*_format` 字段；fallback JSON 中 `num` 为 string（如 `"167"`）、行内含 `type_format`/`num_format` 副本。源码中 `row.num || 0` 对两种类型均兼容。

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`。随后 `getTopIndicatorsApi` 以固定 5 项默认模板为基准，按 `type` 匹配行数据回填 `num`（无 `type` 字段匹配或 `num` 缺省时保留 0）：

```ts
interface TopIndicator {
    type: '竞赛场馆' | '非竞赛场馆' | '办公场所' | '酒店' | '医院'; // string，固定 5 类，顺序固定
    num: number;    // number | string，回填自匹配行的 num；缺省 0
}
```

返回值恒为 5 个元素的数组（模板顺序），不透传原始行的其他字段。

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-competition-homepage-statistics'))` —— rows 为空时请求 `/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-statistics.json`
- 最终兜底：出错或 rows 为空时返回默认 5 项（`num` 全 0）：竞赛场馆 / 非竞赛场馆 / 办公场所 / 酒店 / 医院

### mock 数据来源

- public/static/mock/info-management-bureau/top-indicators.json（localMockUrl，源码中已注释）
- public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-statistics.json
