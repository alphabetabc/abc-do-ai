# 003-preposition-resource · 保障资源（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/center.ts`（本模块**无独立接口**，复用 `getEmergencyResourceApi`，与首屏 emergency-resource 共用；复制自信管局 `getHomeBottomIndicatorsApi` 范式）。
> mock 路径：`public/static/mock/shenzhen-communication-guarantee/emergency-resource.json`。

## API：getEmergencyResourceApi

- 函数名：`getEmergencyResourceApi`
- 源码：`web/services/shenzhen-communication-guarantee/home/center.ts`

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| viewItemId | string | `'competition-homepage-resources'` |
| viewPageId | string | `'open-close-ceremonies-view'`（复用信管局视图页） |
| viewPageArgs | object | 取 env 配置 `viewPageArgs` 展开（默认 `{}`） |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | `/static/mock/shenzhen-communication-guarantee/emergency-resource.json` |
| 是否轮询 | - | 否（静态展示，无联动） |
| getEnvironment env key | string | `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-competition-homepage-resources`，可覆盖 `viewPageArgs`（对象）与 `viewItemDataTemplate`（资源模板数组，含默认兜底值） |

### 原始响应结构（与 mock JSON 对齐）

```ts
/** 视图服务统一响应壳（getViewItemData） */
type TViewItemDataResponse = {
    code: number; // 响应码，200 成功（mock 为 200）
    message: string | null; // 提示信息（mock 为 null）
    data: {
        viewPageId: string; // 视图页 id，mock 值 'open-close-ceremonies-view'
        viewItemId: string; // 视图项 id，mock 值 'competition-homepage-resources'
        viewItemData: {
            title: string; // 视图项标题，mock 值 '应急资源'
            header: {
                dimFieldList: unknown[]; // 维度字段定义，mock 为空数组
                counterFieldList: unknown[]; // 计数器字段定义，mock 为空数组
            };
            rows: TResourceRow[]; // 资源数据行（单值模型）
        };
    };
};

/** mock rows 行结构（单值模型） */
type TResourceRow = {
    type: string; // 资源类型编号：'1'-保障通信车 / '2'-保障人员 / '3'-保障卫星车 / '4'-保障发电车
    typeName: string; // 资源类型中文名（mock：保障通信车/保障人员/保障卫星车/保障发电车）
    num: number; // 数量（mock：30/480/8/15）
};
```

### converter / 转换逻辑

使用公共 `defaultConverter`（`web/services/request/getViewItemData.ts`，取 `data.viewItemData.rows`），随后在 `getEmergencyResourceApi` 内按 `viewItemDataTemplate` 模板组装：

```ts
/** viewItemDataTemplate 模板项（env 可覆盖；源码默认 4 类，顺序：卫星车/通信车/发电车/人员） */
type TResourceTemplateItem = {
    type: string; // 资源类型编号（'1'|'2'|'3'|'4'）
    name: string; // 展示名（如 '保障卫星车'）
    unit: string; // 单位（默认 '个'）
    icon: string; // 图标文件名（如 'icon-保障卫星车.svg'）
    nameField: string; // 名称取值字段（默认 'typeName'）
    valueField: string; // 数量取值字段（默认 'num'）
    value: number; // 兜底数量（默认 0）
};

/** getEmergencyResourceApi 返回值 */
type TResourceItem = TResourceTemplateItem & {
    typeName?: string; // 命中行时的原始中文名（...hit 展开，可能覆盖/并入）
    num?: number; // 命中行时的原始数量（...hit 展开）
    iconPath: string; // 完整图标地址：`${constants.IMAGE_PATH}/shenzhen-communication-guarantee/${icon}`
    value: number; // 展示数量：命中行取 hit[valueField]，未命中取 0
    name: string; // 展示名：命中行取 hit[nameField]，未命中取模板 name
};
```

组装规则：对每个模板项在 rows 中按 `type` 匹配（`rows.find((row) => row.type === item.type)`）；命中则 `value = hit[valueField]`、`name = hit[nameField]`，未命中 `value = 0`、`name = 模板 name`。返回顺序 = 模板顺序（与接口下发顺序解耦）。

### fallback / 空数据兜底

- 请求成功但 `data.viewItemData.rows` 为空 → `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）走 fallback url：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-competition-homepage-resources')` → `/common/static-file/fallback/shenzhen-communication-guarantee/open-close-ceremonies-view-competition-homepage-resources`
- 请求出错或 rows 仍为空 → 返回 `viewItemDataTemplate.map(assignIcon)`，即模板默认值（全部 `value: 0`）+ 拼接 iconPath

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/emergency-resource.json`（4 类资源：保障通信车 30 / 保障人员 480 / 保障卫星车 8 / 保障发电车 15）

## 区域屏消费差异（vs 首屏）

- 区域屏仅消费 3 类：保障人员（type '2'）、保障通信车（type '1'）、保障发电车（type '4'），不消费保障卫星车（type '3'）
- 展示顺序按前端 `share/presets.ts` 的 `areaPrepositionResourceList`（保障人员 → 保障通信车 → 保障发电车），与接口/模板下发顺序解耦
- 数量 0 时正常展示 0

## 待定（004-00 二-4）

是否改用信管局 game-match `ceremonies-guarantee-resources`（两态模型，viewPageArgs 传 areaName，需 env viewItemDataTemplate 模板）；注意**发电车在该接口无出数先例**。若切换，本文档契约需整体重写。
