# 002-communication-service · 通信服务（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/section-left.ts`
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/chbn-business-personal.json` / `chbn-business-home.json` / `chbn-business-government.json`
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

三个接口范式一致：从 `getEnvironment` 读取模板配置（viewPageArgs + viewItemDataTemplate），rows 按 `type` 与模板匹配后回填。本文档以 TS 类型与 mock 对齐描述完整契约。

## API 1：getPersonalBusinessApi（个人业务）

- **函数**：`getPersonalBusinessApi`（`web/services/shenzhen-communication-guarantee/home/section-left.ts`）
- 复制自信管局同名接口

### 入参

| 参数 | 值 | 说明 |
| --- | --- | --- |
| viewPageId | `open-close-ceremonies-view` | 复用信管局视图页 |
| viewItemId | `chbn-business-personal` | 个人业务视图项 |
| viewPageArgs | 取 env 配置，默认 `{}` | 深圳维度，不传区域参数 |
| baseUrlType | `sceneViewService` | |
| 环境配置（getEnvironment） | `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-chbn-business-personal` | 读取 `viewPageArgs`（默认 `{}`）与 `viewItemDataTemplate`（默认值见下方转换逻辑） |
| 是否轮询 | 否 | 一次性请求 |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/chbn-business-personal.json` | |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface ChbnBusinessPersonalResponse {
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
            /** string：视图项标题（"个人业务"） */
            title: string;
            /** object：头部字段定义，当前 dimFieldList / counterFieldList 均为空数组 */
            header: { dimFieldList: unknown[]; counterFieldList: unknown[] };
            /** PersonalBusinessRow[]：业务行 */
            rows: PersonalBusinessRow[];
        };
    };
}

interface PersonalBusinessRow {
    /** string：业务类型编号（1-总用户数、2-5G用户、3-4G用户、4-物联网、5-其他） */
    type: string;
    /** string：业务名称（与模板 label 按 type 匹配，如 "总用户数"） */
    typeName: string;
    /** number：业务数值 */
    num: number;
    /** string：数值单位（mock 中为 "万"） */
    unit: string;
}
```

### converter / 转换逻辑

`defaultConverter` 取 rows 后，在函数体内与模板匹配回填：

```ts
interface PersonalBusinessResult {
    /** object：首行（type '1'）回填，总用户数卡片 */
    top: {
        /** string：类型编号，默认 '1'（env 模板可覆盖） */
        type: string;
        /** string：展示名称；服务端 typeName 优先，否则模板默认 "总用户数" */
        label: string;
        /** string：名称取值字段名，固定 'typeName' */
        labelField: string;
        /** string：单位；服务端 unit 优先，否则默认 '万' */
        unit: string;
        /** string：单位取值字段名，固定 'unit' */
        unitField: string;
        /** string：数值取值字段名，固定 'num' */
        valueField: string;
        /** number | string：数值；rows[0]（type '1'）的 num */
        value?: number | string;
    };
    /** object[]：分项卡片（5G用户 / 4G用户 / 物联网 / 其他） */
    parts: Array<{
        /** string：类型编号 '2'-'5' */
        type: string;
        /** string：展示名称；服务端 typeName 优先 */
        label: string;
        labelField: string;   // 固定 'typeName'
        /** string：单位；服务端 unit 优先 */
        unit: string;
        unitField: string;    // 固定 'unit'
        valueField: string;   // 固定 'num'
        /** string：卡片配色 rgba 值（各分项默认色不同） */
        color: string;
        /** number | string：数值；按 type 匹配 row 的 num */
        value?: number | string;
    }>;
}
```

- 回填规则：`rows[0]`（index 0）回填 top；其余行按 `type` 匹配 parts 项
- top 未匹配到服务端数据时 `value` 保持 undefined（仅模板默认值）

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 返回模板默认结构（labels：总用户数/5G用户/4G用户/物联网/其他，无 value）
- 线上 `rows` 为空时经 `viewItemDataFallbackApi`（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-chbn-business-personal')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/chbn-business-personal.json`

## API 2：getFamilyBusinessApi（家庭业务）

- **函数**：`getFamilyBusinessApi`（`web/services/shenzhen-communication-guarantee/home/section-left.ts`）
- 复制自信管局同名接口

### 入参

| 参数 | 值 | 说明 |
| --- | --- | --- |
| viewPageId | `open-close-ceremonies-view` | 复用信管局视图页 |
| viewItemId | `chbn-business-home` | 家庭业务视图项 |
| viewPageArgs | 取 env 配置，默认 `{}` | |
| baseUrlType | `sceneViewService` | |
| 环境配置（getEnvironment） | `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-chbn-business-home` | 读取 `viewPageArgs` 与 `viewItemDataTemplate`（默认 4 项模板） |
| 是否轮询 | 否 | 一次性请求 |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/chbn-business-home.json` | |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface ChbnBusinessHomeResponse {
    /** number：状态码，200 为成功 */
    code: number;
    /** string | null：提示信息 */
    message: string | null;
    data: {
        /** string：视图页 id（回显请求参数） */
        viewPageId: string;
        /** string：视图项 id（回显请求参数） */
        viewItemId: string;
        viewItemData: {
            /** string：视图项标题（"家庭业务"） */
            title: string;
            /** object：头部字段定义，当前均为空数组 */
            header: { dimFieldList: unknown[]; counterFieldList: unknown[] };
            /** FamilyBusinessRow[]：业务行 */
            rows: FamilyBusinessRow[];
        };
    };
}

interface FamilyBusinessRow {
    /** string：业务类型编号（1-家宽用户数、2-IPTV、3-爱家TV、4-固话） */
    type: string;
    /** string：业务名称（如 "家宽用户数"） */
    typeName: string;
    /** number：业务数值 */
    num: number;
    /** string：数值单位 */
    unit: string;
}
```

### converter / 转换逻辑

```ts
type FamilyBusinessResult = Array<{
    /** string：类型编号 '1'-'4' */
    type: string;
    /** string：展示名称；服务端 typeName 优先，否则模板默认（家宽用户数 / IPTV / 爱家TV / 固话）；若模板项带 labelSpiltNumber，则按该位数在名称中插入 \n 换行 */
    label: string;
    /** string：名称取值字段名，固定 'typeName' */
    labelField: string;
    /** string：单位；服务端 unit 优先 */
    unit: string;
    /** string：单位取值字段名，固定 'unit' */
    unitField: string;
    /** string：数值取值字段名，固定 'num' */
    valueField: string;
    /** string：卡片配色 rgba 值 */
    color: string;
    /** number（可选）：名称换行拆分位数；家宽用户数默认 2（"家宽\n用户数"），其余项无此字段 */
    labelSpiltNumber?: number;
    /** number | string：数值；按 type 匹配 row 的 num */
    value?: number | string;
}>;
```

- 返回数组，顺序固定 4 项（家宽用户数 → IPTV → 爱家TV → 固话）
- 回填规则：按 `type` 匹配；带 `labelSpiltNumber` 的项名称会从该位拆为两行（`\n` 连接）

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 返回模板默认结构（无 value）
- 线上 `rows` 为空时经 `viewItemDataFallbackApi` 请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-chbn-business-home')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/chbn-business-home.json`

## API 3：getGEBusinessApi（政企业务）

- **函数**：`getGEBusinessApi`（`web/services/shenzhen-communication-guarantee/home/section-left.ts`；原 `getGEBusinessTop4Api`，2026-10-09 去 TOP4 改名）
- 复制自信管局 getGEBusinessTop4Api

### 入参

| 参数 | 值 | 说明 |
| --- | --- | --- |
| viewPageId | `open-close-ceremonies-view` | 复用信管局视图页 |
| viewItemId | `chbn-business-government` | 政企业务视图项 |
| viewPageArgs | 取 env 配置，默认 `{}` | |
| baseUrlType | `sceneViewService` | |
| 环境配置（getEnvironment） | `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-chbn-business-government` | 读取 `viewPageArgs` 与 `viewItemDataTemplate`（默认 4 项模板） |
| 是否轮询 | 否 | 一次性请求 |
| localMockUrl | `/static/mock/shenzhen-communication-guarantee/chbn-business-government.json` | |

### 原始响应结构（converter 前，按 mock 对齐）

```ts
interface ChbnBusinessGovernmentResponse {
    /** number：状态码，200 为成功 */
    code: number;
    /** string | null：提示信息 */
    message: string | null;
    data: {
        /** string：视图页 id（回显请求参数） */
        viewPageId: string;
        /** string：视图项 id（回显请求参数） */
        viewItemId: string;
        viewItemData: {
            /** string：视图项标题（"政企业务TOP4"） */
            title: string;
            /** object：头部字段定义，当前均为空数组 */
            header: { dimFieldList: unknown[]; counterFieldList: unknown[] };
            /** GEBusinessRow[]：业务行 */
            rows: GEBusinessRow[];
        };
    };
}

interface GEBusinessRow {
    /** string：业务类型编号（1-专线客户数、2-5G专网专网卡数、3-物联网客户数、4-车联网发卡量） */
    type: string;
    /** string：业务名称 */
    typeName: string;
    /** number：业务数值 */
    num: number;
    /** string：数值单位（mock 中为空字符串） */
    unit: string;
}
```

### converter / 转换逻辑

```ts
type GEBusinessTop4Result = Array<{
    /** string：类型编号 '1'-'4' */
    type: string;
    /** string：展示名称；服务端 typeName 优先，否则模板默认；按 labelSpiltNumber 在名称中插入 \n 换行 */
    label: string;
    /** string：名称取值字段名，固定 'typeName' */
    labelField: string;
    /** string：单位；服务端 unit 优先 */
    unit: string;
    /** string：单位取值字段名，固定 'unit' */
    unitField: string;
    /** string：数值取值字段名，固定 'num' */
    valueField: string;
    /** string：卡片配色 rgba 值 */
    color: string;
    /** number：名称换行拆分位数（默认 2 / 4 / 3 / 3） */
    labelSpiltNumber: number;
    /** number | string：数值；按 type 匹配 row 的 num */
    value?: number | string;
}>;
```

- 返回数组，顺序固定 4 项；回填规则与家庭业务一致（type 匹配 + labelSpiltNumber 换行）

### fallback / 空数据兜底

- 接口报错或 `rows` 为空 → 返回模板默认结构（无 value）
- 线上 `rows` 为空时经 `viewItemDataFallbackApi` 请求静态兜底 JSON：`getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-chbn-business-government')`

### mock 数据来源

`public/static/mock/shenzhen-communication-guarantee/chbn-business-government.json`

## 未定义接口：国际漫入 TOP5

- 信管局无此接口，属 004-00 二-1 新增接口需求（已服务端确认，待开发）；接口形态（viewItemId / 参数 / 返回形状）待服务端定义后再落码，`web/services/shenzhen-communication-guarantee/home/section-left.ts` 当前只覆盖上述 3 个接口
- 历史设想形状 `[{ name, num }]`（前端算 percent）仅供参考，最终以服务端定义为准
