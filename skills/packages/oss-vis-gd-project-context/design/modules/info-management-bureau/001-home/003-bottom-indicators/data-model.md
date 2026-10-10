# 003-bottom-indicators · bottom-指标（data-model）

> 接口源码：web/services/info-management-bureau/home/section-right.ts（`getHomeBottomIndicatorsApi`）
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-resources.json（无独立 localMockUrl mock）

## getHomeBottomIndicatorsApi

- 函数定义：`getHomeBottomIndicatorsApi`（web/services/info-management-bureau/home/section-right.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/31338

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `competition-homepage-resources` |
| viewPageArgs | 展开环境配置中的 `viewPageArgs`（缺省为空对象） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.open-close-ceremonies-view-competition-homepage-resources`，可覆盖 `viewPageArgs` 与 `viewItemDataTemplate` |
| 轮询 | 组件层 15 分钟轮询（沿用首页模块轮询节奏，见 [spec.md](./spec.md)） |

### 原始响应结构（与 fallback mock 对齐）

外层为视图服务通用包裹（`code: 200`、`message`、`data`），核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题，如「首屏-右侧-资源统计」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者，如「陈厚萍」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（num/type）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（'num,' / 'type'）
            fieldName: string;     // string，字段名（num/type）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，资源指标数据行
}

interface Row {
    num: string;            // string，数量（fallback mock 中为字符串，如 "47"）
    num_format: string;     // string，格式化副本
    type: string;           // string，指标类型 id：'1' 保障通信车、'2' 保障人员、'3' 保障卫星车、'4' 保障发电车
    type_format: string;    // string，格式化副本
}
```

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`。随后以环境配置模板（缺省 4 项，顺序：保障卫星车 / 保障通信车 / 保障发电车 / 保障人员）为骨架，按 `type` 匹配行数据回填，并附加图标路径：

```ts
interface BottomIndicator {
    type: string;        // string，指标类型 id（'1'~'4'），来自模板
    name: string;        // string，指标名；回填自命中行 row[nameField]（nameField 默认 'typeName'），缺省用模板名
    unit: string;        // string，单位，模板静态值（缺省 '个'）
    icon: string;        // string，图标文件名，模板静态值（如 'icon-保障卫星车.svg'）
    nameField: string;   // string，名称取值字段名，模板静态值（'typeName'）
    valueField: string;  // string，数值取值字段名，模板静态值（'num'）
    value: string | number; // string | number，回填自命中行 row[valueField]；未命中为 0
    iconPath: string;    // string，`${constants.IMAGE_PATH}/info-management-bureau/${icon}`，图标完整路径
    // 命中行的原始字段（num/type 等）也经展开合并进结果
}
```

注意：fallback mock 的 rows 只有 `num`/`type`，没有 `typeName` 字段，因此 `name` 实际走模板缺省名（`hit[item.nameField] ?? item.name`）。

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-competition-homepage-resources'))` —— rows 为空时请求 `/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-resources.json`
- 最终兜底：出错或 rows 为空时返回模板 4 项（value 全 0），并同样附加 `iconPath`

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-competition-homepage-resources.json

⚠️ 差异：无独立 localMockUrl mock 文件；header 中 `fieldLabel` 的 `'num,'` 带尾逗号（fallback mock 原样），属数据源瑕疵，不影响取数。
