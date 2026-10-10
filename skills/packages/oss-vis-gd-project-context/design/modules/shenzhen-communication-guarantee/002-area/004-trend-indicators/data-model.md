# 004-trend-indicators · 4G/5G 指标趋势（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/area/api.ts`（当前仅一行文件级注释「区域屏接口层」，**本模块接口尚未定义**）。
> 公共请求层：`web/services/request/getViewItemData.ts`（`getViewItemDataApi`）。
> mock 目录：`public/static/mock/shenzhen-communication-guarantee/`（当前**无**本模块对应 mock JSON）。

## 接口状态

**未定义**（挂 004-00 二-3，不进代码）。信管局无对应可复用接口，走新增接口，已服务端沟通、待开发；参数预计含区域、networkType（4G/5G）。接口形态（viewItemId / 参数 / 返回形状）待服务端定义后再落码；代码中只在 `web/services/shenzhen-communication-guarantee/area/api.ts` 留注释占位。

## 未来接口契约模板（基于公共请求层 getViewItemDataApi 的既有形态）

新接口落码时将遵循以下形态（与 `web/services/shenzhen-communication-guarantee/home/center.ts` 中已定义接口一致，此处为**契约模板而非已存在代码**，最终以服务端定义为准）：

### 入参（getViewItemDataApi params）

| 参数 | 类型 | 值 |
| --- | --- | --- |
| viewItemId | string | 待服务端定义（新增，非信管局复用） |
| viewPageId | string | 待服务端定义（待确认是否复用信管局 `open-close-ceremonies-view`） |
| viewPageArgs | object | 预计含 `networkType: '4G' \| '5G'`、区域维度参数（如 `activeArea` / areaName）、时间范围/粒度（近 12 小时、2h 粒度，或由服务端固定），**待确认** |
| baseUrlType | string | `'sceneViewService'`（模块内常量） |
| localMockUrl | string | 待建，建议 `/static/mock/shenzhen-communication-guarantee/<viewItemId>.json` |
| 是否轮询 | - | 待确认（趋势类指标可能周期刷新；当前组件为占位，未定） |
| getEnvironment env key | - | 无（当前设想不依赖 env 配置；新增后如有再补） |

### 原始响应结构（设想，待服务端定义）

视图服务统一响应壳（见 `defaultConverter`，`web/services/request/getViewItemData.ts`）：

```ts
/** 视图服务统一响应壳（getViewItemData） */
type TViewItemDataResponse = {
    code: number; // 响应码，200 成功
    message: string | null; // 提示信息
    data: {
        viewPageId: string; // 视图页 id
        viewItemId: string; // 视图项 id
        viewItemData: {
            title: string; // 视图项标题
            header: {
                dimFieldList: unknown[]; // 维度字段定义（本场景为空数组）
                counterFieldList: unknown[]; // 计数器字段定义（本场景为空数组）
            };
            rows: TTrendRow[]; // 趋势数据行（converter 取此字段）
        };
    };
};
```

`rows` 行结构为**需求设想**（最终以新接口服务端定义为准，来源：本文件上一版与 spec）：

```ts
/** ⚠️ 需求设想，服务端未定义 */
type TTrendRow = {
    time: string; // 时间点（近 12 小时、2h 粒度，共 7 个点，含当前）
    rrcAvg?: number; // RRC 连接数均值（数据点缺失时折线断点展示）
    rrcMax?: number; // RRC 连接数最大值
    onlineUser?: number; // 在线用户（设想）
    answerRate?: number; // 接通率
    wirelessUtilization?: number; // 无线平均利用率
};
```

### converter / 转换逻辑

待落码时定义。按既有范式预计使用 `defaultConverter`（取 `data.viewItemData.rows`），组件层（从信管局 game-match wireless-quality 迁移改造，`web/pages/shenzhen-communication-guarantee/sub-pages/area/modules/trend-indicators/`）再映射为图表数据（xAxis 时间轴 + 各指标 series）。

### fallback / 空数据兜底

待落码时定义。按既有范式（`web/services/shenzhen-communication-guarantee/loadFallbackData.ts`）：

1. 请求成功但 `data.viewItemData.rows` 为空 → `viewItemDataFallbackApi` 走 fallback url：`getFallbackUrl('shenzhen-communication-guarantee', '<viewPageId>-<viewItemId>')`（`/common/static-file/fallback/shenzhen-communication-guarantee/<viewPageId>-<viewItemId>`，见 `web/services/request/getStaticApi.ts`）
2. 兜底默认值结构（设想）：7 个时间点全空的趋势（图表空态 / 断点展示）
