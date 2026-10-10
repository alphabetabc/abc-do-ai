# 004-business-resource · 右侧-十五运业务（data-model）

> 接口源码：web/services/info-management-bureau/home/section-right.ts（`getRightBusinessResourceApi`）
> 公共请求层：web/services/request/getViewItemData.ts（POST `view/getViewItemData`，converter `defaultConverter` 取 `data.viewItemData.rows`）
> mock 数据：public/static/mock/info-management-bureau/fifteen-game-business.json、public/static/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-business_1671775762.json（按 area 命名）

## getRightBusinessResourceApi

- 函数定义：`getRightBusinessResourceApi`（web/services/info-management-bureau/home/section-right.ts）

### 入参

| 参数 | 值 |
| --- | --- |
| viewPageId | `open-close-ceremonies-view` |
| viewItemId | `fifteen-game-business` |
| viewPageArgs | `{ area }`，`area` 取环境配置 `info-management-bureau.homeConfig.area`（mock 中为 `'1671775762'` 广州天河体育中心体育场） |
| baseUrlType | `sceneViewService` |
| 环境配置（getEnvironment） | key `info-management-bureau.homeConfig.area`（区域 id，同时决定 fallback 文件名后缀 `_<area>`） |
| localMockUrl | `/static/mock/info-management-bureau/fifteen-game-business.json`（源码中**生效中**，本地开发走该 mock） |
| 轮询 | 组件层 15 分钟轮询（见 [spec.md](./spec.md)） |

### 原始响应结构（与 mock 对齐）

外层为视图服务通用包裹（`code: 200`、`message`、`data`），核心为 `data.viewItemData`：

```ts
interface ViewItemData {
    title: string;          // string，视图项标题，如「首屏-十五运业务」
    titleIcon: string;      // string，标题图标，mock 中为空串
    description: string;    // string，描述，同 title
    author: string;         // string，作者，如「hoping」
    header: {
        dimFieldList: [];   // 数组，维度字段列表，恒为空
        counterFieldList: Array<{  // 数组，计数字段元信息（type/typeName/num/alarmNum）
            dataType: string;      // string，字段类型，均为 'String'
            fieldLabel: string;    // string，字段中文名（指标id/指标名称/数量/告警数）
            fieldName: string;     // string，字段名（type/typeName/num/alarmNum）
            fieldUnit: string;     // string，单位，均为空串
            list: string;          // string，是否列表展示，'true'
        }>;
    };
    rows: Row[];            // 数组，8 类业务指标行
}

interface Row {
    type: string;           // string，指标 id '1'~'8'
    type_format: string;    // string，格式化副本
    typeName: string;       // string，指标名称（4G基站/5G基站/竞赛专网/临时布线/5G备份网/视频会议系统/跨境专线/集群通信）
    typeName_format: string;
    num: string;            // string，数量（如 "279689"）
    num_format: string;
    alarmNum: string;       // string，告警/异常数（如 "20"）
    alarmNum_format: string;
}
```

### converter / 转换逻辑

`defaultConverter` 返回 `data.viewItemData.rows`。随后按 `type`（'1'~'8'）逐行映射为固定 name/alarmName 文案（未匹配的 type 丢弃）：

```ts
interface BusinessResourceItem {
    title: string;    // string，指标名称，取自 typeName
    num: string;      // string，数量
    alarmNum: string; // string，告警数
    name: string;     // string，主指标文案（按 type 映射，见下表）
    alarmName: string; // string，告警指标文案（按 type 映射，见下表）
}
```

| type | name | alarmName |
| --- | --- | --- |
| 1 / 2（4G/5G 基站） | 基站数 | 退服数 |
| 3 / 7（竞赛专网/跨境专线） | 专线数 | 中断数 |
| 4（临时布线） | 信息点数 | 故障数 |
| 5（5G备份网） | CPE终端数 | 故障数 |
| 6 / 8（视频会议系统/集群通信） | 终端数 | 告警数 |

### fallback / 空数据兜底

- fallback：`viewItemDataFallbackApi(data, getFallbackUrl('info-management-bureau', 'open-close-ceremonies-view-fifteen-game-business_<area>'))` —— rows 为空时请求 `/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-business_<area>.json`
- 最终兜底：出错或 rows 为空时返回固定 8 项（`num`/`alarmNum` 全 0，title/name/alarmName 同上表对应文案）

### mock 数据来源

- public/static/mock/info-management-bureau/fifteen-game-business.json（localMockUrl，生效中）
- public/static/fallback/info-management-bureau/open-close-ceremonies-view-fifteen-game-business_1671775762.json

⚠️ 差异：mock 与 fallback 结构一致，仅数值不同（mock 中 4G/5G 基站 alarmNum 为 "20"/"30"，fallback 全为 "0"）；无字段差异。
