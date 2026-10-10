# 005-emergency-resource · 应急资源统计（首屏，data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/emergency-resource.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## API：getEmergencyResourceApi

- **函数**：`getEmergencyResourceApi`（`web/services/shenzhen-communication-guarantee/home/center.ts`）
- 应急资源 / 前置资源（首屏与区域屏共用，展示顺序走前端 presets 配置）；复制自信管局 `getHomeBottomIndicatorsApi`
- 资源类型字典：1-保障通信车 / 2-保障人员 / 3-保障卫星车 / 4-保障发电车（4 类）

### 入参

| 参数 | 值 | 说明 |
| --- | --- | --- |
| viewPageId | `open-close-ceremonies-view` | 复用信管局视图页 |
| viewItemId | `competition-homepage-resources` | 应急资源视图项 |
| viewPageArgs | 取 env 配置 `viewPageArgs` 展开，默认 `{}` | |
| baseUrlType | `sceneViewService` | |
| 环境配置（getEnvironment） | `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-competition-homepage-resources` | 读取 `viewPageArgs`（默认 `{}`）与 `viewItemDataTemplate`（默认 4 项模板，顺序：卫星车 → 通信车 → 发电车 → 人员） |
| 是否轮询 | 否 | 一次性请求 |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/emergency-resource.json` | |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface EmergencyResourceResponse {
    /** number：状态码，200 为成功 */
    code: number;
    /** string | null：提示信息，成功时为 null */
    message: string | null;
    data: {
        /** string：视图页 id（回显请求参数） */
        viewPageId: string;
        /** string：视图项 id（回显请求参数） */
        viewItemId: string;
        viewItemData: {
            /** string：视图项标题（"应急资源"） */
            title: string;
            /** object：头部字段定义，当前均为空数组 */
            header: { dimFieldList: unknown[]; counterFieldList: unknown[] };
            /** EmergencyResourceRow[]：资源统计行 */
            rows: EmergencyResourceRow[];
        };
    };
}

interface EmergencyResourceRow {
    /** string：资源类型编号（1-保障通信车、2-保障人员、3-保障卫星车、4-保障发电车） */
    type: string;
    /** string：资源类型名称（如 "保障通信车"） */
    typeName: string;
    /** number：资源数量 */
    num: number;
}
```

### converter / 转换逻辑

`defaultConverter` 取 rows 后，函数体内按模板（viewItemDataTemplate）匹配并拼接图标路径：

```ts
type EmergencyResourceResult = Array<{
    /** string：资源类型编号（'3' / '1' / '4' / '2'，顺序由模板决定：卫星车 → 通信车 → 发电车 → 人员） */
    type: string;
    /** string：展示名称；服务端 typeName（nameField）优先，否则模板默认名 */
    name: string;
    /** string：名称取值字段名，固定 'typeName' */
    nameField: string;
    /** string：数量取值字段名，固定 'num' */
    valueField: string;
    /** string：单位，模板默认 '个' */
    unit: string;
    /** string：图标文件名（模板默认，如 'icon-保障卫星车.svg'） */
    icon: string;
    /** string：图标完整路径 = `${constants.IMAGE_PATH}/shenzhen-communication-guarantee/${icon}` */
    iconPath: string;
    /** number | string：资源数量；按 type 匹配 row 的 num，未匹配为 0 */
    value: number | string;
}>;
```

- 返回数组顺序 = 模板顺序（非服务端 rows 顺序）
- 每项均经过 `assignIcon` 补全 `iconPath`
- 服务端 rows 中多余字段通过展开合并进返回项（`...(hit ?? {})`）

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 返回模板默认结构（4 项，value 全 0，仍补全 iconPath）
- 线上 `rows` 为空时经 `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-competition-homepage-resources')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/emergency-resource.json`
