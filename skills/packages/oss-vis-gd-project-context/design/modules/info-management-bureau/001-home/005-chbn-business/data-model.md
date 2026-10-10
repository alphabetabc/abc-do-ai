# 005-chbn-business · chbn业务（data-model）

> 接口源码：web/services/info-management-bureau/home/section-left.ts
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/fallback/info-management-bureau/ 下 `open-close-ceremonies-view-chbn-business-*.json`；遗留接口另有 public/static/mock/info-management-bureau/ 下 public-network.json / game-private-network.json / cloud-video.json（均已注释）

本模块 4 个在用接口共用 `viewPageId: open-close-ceremonies-view`、`baseUrlType: sceneViewService`，响应外层均为视图服务通用包裹（`code: 200` / `message` / `data`），核心为 `data.viewItemData`。四个 viewItem 的 `viewItemData` 骨架一致：

```ts
interface ChbnViewItemData {
    title: string;          // string，视图项标题（如「首屏-chbn业务-个人业务」）
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者（如「hoping」）
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（type/typeName/num）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（指标id/指标名称/数量）
            fieldName: string;     // string，字段名（type/typeName/num）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: ChbnRow[];        // 数组，指标行
}

interface ChbnRow {
    type: string;           // string，指标 id（'1'~'5'）
    type_format: string;    // string，格式化副本
    typeName: string;       // string，指标名称
    typeName_format: string;
    num: string;            // string，数量
    num_format: string;
    unit?: string;          // string | undefined，单位（个人业务 fallback 无此字段；家庭/政企/新兴含，如 '万' 或空串）
    unit_format?: string;
}
```

## getPersonalBusinessApi（个人业务）

- 函数定义：`getPersonalBusinessApi`（web/services/info-management-bureau/home/section-left.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/32010

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `chbn-business-personal` |
| viewPageArgs | 环境配置 `viewPageArgs`（缺省 `{}`，注释中保留 `area` 示例） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.open-close-ceremonies-view-chbn-business-personal`，可覆盖 `viewPageArgs` 与 `viewItemDataTemplate` |
| 轮询 | 组件层 15 分钟轮询（沿用首页模块轮询节奏，见 [spec.md](./spec.md)） |

### 原始响应

同上 `ChbnViewItemData` 骨架；fallback rows 示例：type '1' 总用户数 / '2' 5G用户数 / '3' 4G用户数 / '4' 物联网 / '5' 其他，无 `unit` 字段。

### converter / 转换逻辑

以 `viewItemDataTemplate`（可环境配置覆盖）为骨架：第 1 行（index 0）回填 `top`，其余行按 `type` 匹配回填 `parts`。`value` 取 `row[valueField]`（默认 'num'），`unit`/`label` 取 `row[unitField|labelField] ?? 模板值`（默认 'unit'/'typeName'）。

```ts
interface PersonalBusinessData {
    top: {
        type: string;        // string，'1'
        label: string;       // string，默认 '总用户数'，可被行 typeName 覆盖
        labelField: string;  // string，取名字段名 'typeName'
        unit: string;        // string，默认 '万'
        unitField: string;   // string，取单位字段名 'unit'
        valueField: string;  // string，取值字段名 'num'
        value?: string;      // string | undefined，回填自第 1 行 num（如 '250'）
    };
    parts: Array<{
        type: string;        // string，'2'~'5'
        label: string;       // string，默认 5G用户 / 4G用户 / 物联网 / 其他
        labelField: string;  // string，'typeName'
        unit: string;        // string，默认 '万'
        unitField: string;   // string，'unit'
        valueField: string;  // string，'num'
        color: string;       // string，图表配色 rgba 字符串
        value?: string;      // string | undefined，回填自匹配行 num
    }>;
}
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-chbn-business-personal'))`
- 最终兜底：出错或 rows 为空时返回模板原样（top/parts 均无 value）

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-chbn-business-personal.json

⚠️ 差异：fallback rows 无 `unit` 字段，`top.unit`/`parts[].unit` 实际保留模板默认 '万'。

## getFamilyBusinessApi（家庭业务）

- 函数定义：`getFamilyBusinessApi`（web/services/info-management-bureau/home/section-left.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/32017

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `chbn-business-home` |
| viewPageArgs | 环境配置 `viewPageArgs`（缺省 `{}`） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.open-close-ceremonies-view-chbn-business-home`（viewPageArgs / viewItemDataTemplate） |

### 原始响应

同 `ChbnViewItemData` 骨架；fallback rows：type '1' 家宽用户数 / '2' IPTV / '3' 爱家TV / '4' 固话，含 `unit`（'万'）。

### converter / 转换逻辑

按 `type` 匹配模板项回填 `value`/`unit`/`label`；带 `labelSpiltNumber` 的项把 label 按位数切成两行（`join('\n')`）：

```ts
type FamilyBusinessData = Array<{
    type: string;              // string，'1'~'4'
    label: string;             // string，默认 家宽用户数 / IPTV / 爱家TV / 固话；带 labelSpiltNumber 的会被切分为两行
    labelField: string;        // string，'typeName'
    unit: string;              // string，默认空串，回填自行 unit
    unitField: string;         // string，'unit'
    valueField: string;        // string，'num'
    color: string;             // string，配色 rgba 字符串
    labelSpiltNumber?: number; // number，label 切行位数（家宽用户数默认 2）
    value?: string;            // string | undefined，回填自行 num
}>;
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-chbn-business-home'))`
- 最终兜底：返回模板原样（无 value）

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-chbn-business-home.json

## getGEBusinessTop4Api（政企业务 Top4）

- 函数定义：`getGEBusinessTop4Api`（web/services/info-management-bureau/home/section-left.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/32024

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `chbn-business-government` |
| viewPageArgs | 环境配置 `viewPageArgs`（缺省 `{}`） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.open-close-ceremonies-view-chbn-business-government`（viewPageArgs / viewItemDataTemplate） |

### 原始响应

同 `ChbnViewItemData` 骨架；fallback rows：type '1' 专线客户数 / '2' 5G专网卡数 / '3' 物联网发卡量 / '4' 车联网客户数，含 `unit`（空串）。

### converter / 转换逻辑

与 getFamilyBusinessApi 同构（type 匹配 + labelSpiltNumber 切行）：

```ts
type GEBusinessTop4Data = Array<{
    type: string;              // string，'1'~'4'
    label: string;             // string，默认 专线客户数 / 5G专网专网卡数 / 物联网客户数 / 车联网发卡量
    labelField: string;        // string，'typeName'
    unit: string;              // string，默认空串
    unitField: string;         // string，'unit'
    valueField: string;        // string，'num'
    color: string;             // string，配色 rgba 字符串
    labelSpiltNumber: number;  // number，切行位数（2/4/3/3）
    value?: string;            // string | undefined，回填自行 num
}>;
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-chbn-business-government'))`
- 最终兜底：返回模板原样（无 value）

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-chbn-business-government.json

⚠️ 差异：fallback rows 的 typeName（如 '5G专网卡数'/'物联网发卡量'/'车联网客户数'）与模板 label（'5G专网专网卡数'/'物联网客户数'/'车联网发卡量'）措辞不一致，因回填 `row[labelField] ?? 模板值`，实际展示以接口/fallback 返回的 typeName 为准。

## getNewBusinessTop5Api（新兴业务 Top5）

- 函数定义：`getNewBusinessTop5Api`（web/services/info-management-bureau/home/section-left.ts）
- 接口平台文档：http://10.10.2.8:9091/project/1251/interface/api/32024（源码注释与政企共用同一文档地址）

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `chbn-business-emerging` |
| viewPageArgs | 环境配置 `viewPageArgs`（缺省 `{}`） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.open-close-ceremonies-view-chbn-business-emerging`（仅 viewPageArgs，无模板覆盖） |

### 原始响应

同 `ChbnViewItemData` 骨架；fallback rows：type '1'~'5'，typeName 咪咕快游 / 咪咕视频 / 139邮箱 / 中国移动云盘 / 和家亲，含 `unit`（'万'）。

### converter / 转换逻辑

不使用模板，直接 map 并补算百分比与千分位格式化：

```ts
type NewBusinessTop5Data = Array<{
    type: string;             // string，指标 id，透传原始行
    typeName: string;         // string，指标名，透传
    num: string;              // string，数量，透传
    unit?: string;            // string | undefined，单位，透传
    // ...原始行其余字段（含 *_format）均经展开保留
    percent: string;          // string，占比；优先取原始行 percent，缺省为 (Number(num) / rows 总和).toFixed(2)
    value: string;            // string，千分位格式化的数量（Number(num).toLocaleString('en-US')）
}>;
```

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-chbn-business-emerging'))`
- 最终兜底：出错或 rows 为空时返回 `[]`

### mock 数据来源

- public/static/fallback/info-management-bureau/open-close-ceremonies-view-chbn-business-emerging.json

## 遗留接口（无组件引用）

以下 3 个接口同在 section-left.ts，viewPageId 均为 `open-close-ceremonies-view`，无 fallback、无环境配置，localMockUrl 已注释，模块目录（cloud-video / game-private-network / public-network）当前无引用，属遗留代码：

### getLeftPublicNetworkStationApi（公网）

- viewItemId `competition-homepage-public-internet`；mock：public/static/mock/info-management-bureau/public-network.json
- rows：`{ type: '4g' | '5g', num: number, alarmNum: number }`
- 转换后：`{ name: '4G基站' | '5G基站'（按 type 映射）, num, alarmNum }[]`；空数据兜底 2 项（4G/5G 基站，全 0）

### getLeftGamePrivateNetworkApi（竞赛专网）

- viewItemId `competition-homepage-key`；mock：public/static/mock/info-management-bureau/game-private-network.json
- rows：`{ num: number, alarmNum: number }`
- 转换后：rows 原样返回；空数据兜底 `[{ num: 0, alarmNum: 0 }]`

### getLeftCloudNetworkApi（云视讯）

- viewItemId `competition-homepage-cloud-video`；mock：public/static/mock/info-management-bureau/cloud-video.json
- rows：`{ num: number, alarmNum: number }`
- 转换后：rows 原样返回；空数据兜底 `[{ num: 0, alarmNum: 0 }]`
