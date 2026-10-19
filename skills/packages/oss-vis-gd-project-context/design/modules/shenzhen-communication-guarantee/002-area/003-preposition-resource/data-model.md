# 003-preposition-resource · 保障资源（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/area/section-center.ts`（`getAreaPrepositionResourceApi`，独立接口，不复用首屏 `getEmergencyResourceApi`）。
> 2026-10-12 按实际代码回填（原「复用首屏 emergency-resource 接口」描述已失效，004-00 待定项已按 game-match `ceremonies-guarantee-resources` 两态模型落地）。
> mock 路径：`public/static/mock/shenzhen-communication-guarantee/area-preposition-resource.json`。

## API：getAreaPrepositionResourceApi

- 函数名：`getAreaPrepositionResourceApi(areaName?: string)`
- 源码：`web/services/shenzhen-communication-guarantee/area/section-center.ts`（复制自信管局 game-match support-resource 的分组转换范式）

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| 函数入参 | string | `areaName`（区域名称，组件层取 `area?.name ?? area?.userlabel`，**非 adcode**） |
| viewItemId | string | `'ceremonies-guarantee-resources'` |
| viewPageId | string | `'open-close-ceremonies-view'`（复用信管局视图页） |
| viewPageArgs | object | `{ areaName }` |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | `/static/mock/shenzhen-communication-guarantee/area-preposition-resource.json` |
| 是否轮询 | - | 否（`refreshDeps: [areaName]`，切区域时拉取） |
| getEnvironment env key | string | `shenzhen-communication-guarantee.areaConfig.shenzhen-area-view-area-preposition-resource`，可覆盖 `viewItemDataTemplate`（分组模板数组） |

### 原始响应结构（rows 行模型）

```ts
/** viewItemData.rows 行结构（两态模型） */
type TAreaResourceRow = {
    type: string; // 资源类型编号：'1' 保障通信车 / '2' 保障人员 / '4' 保障发电车
    state: string; // 状态：'1' 任务中 / '0' 总数
    num: number; // 数量
};
```

（外层为视图服务统一响应壳 `TViewItemDataResponse`，见 `web/services/request/getViewItemData.ts` `defaultConverter`，converter 取 `data.viewItemData.rows`。）

### 分组模板（defaultViewItemDataTemplate）

```ts
/** 模板项（env 可覆盖）；代码默认顺序：人员 → 通信车 → 发电车（2026-10-12 按任务卡要求调整） */
type TResourceTemplateItem = {
    typeFieldValue: string; // 资源类型编号（'1'|'2'|'4'）
    stateFieldValue: string; // 状态编号（'1' 任务中 / '0' 总数）
    typeFieldLabel: string; // 分组展示名（'保障通信车' 等）
    stateFieldLabel: string; // 指标展示名（'任务中' / '总数'）
    stateUnit: string; // 单位（'个'）
};
```

分组顺序 = 模板出现顺序，默认为 `[人员, 通信车, 发电车]`。

### converter / 转换逻辑

`defaultConverter` 取 rows 后，在 `getAreaPrepositionResourceApi` 内按模板 reduce 分组：

```ts
/** getAreaPrepositionResourceApi 返回值（分组双指标模型） */
type TAreaResourceGroup = {
    label: string; // 分组名（typeFieldLabel）
    type: string; // 分组类型编号
    children: (TResourceTemplateItem & { num?: number })[]; // 命中行时并入 num；未命中/空数据时 num 缺省，组件层展示兜底 '0'
};
```

匹配规则：每个模板项在 rows 中按 `row.type === typeFieldValue && row.state === stateFieldValue` 匹配；返回顺序 = 模板出现顺序（分组按首次出现的 typeFieldValue 建立）。

### fallback / 空数据兜底

- 接口出错或 rows 为空：命中项为空对象，组件层 `item.num ?? '0'` 展示 0
- 未接 `viewItemDataFallbackApi` fallback url 链路（区别于本项目其他接口范式）

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/area-preposition-resource.json`

## 区域屏消费差异（vs 首屏 emergency-resource）

- 独立接口与独立组件，不与首屏共用（首屏 4 类单值卡 `competition-homepage-resources`，本模块 3 组双指标卡 `ceremonies-guarantee-resources`）
- 取数维度：首屏全量，区域屏按 `areaName`（区域名称）
- 不消费保障卫星车（type '3'）
