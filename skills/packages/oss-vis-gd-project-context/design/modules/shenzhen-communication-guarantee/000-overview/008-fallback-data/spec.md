# fallback 静态兜底 · spec + data-model

> 落地：2026-10-29（task-2026-10-29-001）。作用：接口空数据时读取 `public/static/fallback/shenzhen-communication-guarantee/` 下的静态 json 兜底，保障大屏不空框。
>
> **本 spec 是 fallback 能力的唯一真相源**；`public/static/fallback/shenzhen-communication-guarantee/api-item-map.md` 仅为派生出的运维交付件，两处内容不一致时以本 spec 为准并回改交付件。

## 1. 兜底链路

接口层（`web/services/shenzhen-communication-guarantee/`）统一走 `getViewItemDataApi`，空数据兜底链：

```text
接口返回空 → fallback url（viewItemDataFallbackApi + getStaticApi）
           → localMockUrl（public/static/mock/shenzhen-communication-guarantee/）
           → 各接口默认值（全 0 / 空数组）
```

fallback 结果 **merge 进 response** 后仍走各接口的 `defaultConverter`，因此数据结构为：

- 一般接口：`{ code: 200, data: { viewItemData: { rows } } }`（converter 读 `data.viewItemData.rows`）
- intl-roam-top5：`{ code: 200, data: { viewItemData: { data: { userCnt, topN, flowChart, … } } } }`（converter 读 `data.viewItemData.data`）

## 2. 文件名规则

- 无参接口：`open-close-ceremonies-view-<viewItemId>.json`
- 带参接口：`open-close-ceremonies-view-<viewItemId>_<参数值>.json`，多参数逗号相连，顺序与接口 `viewPageArgs` 一致
  - 区域页 4G/5G 业务、4G/5G 趋势：按 `area` 拼接。**area 实际取值为区域ID**（map-area-layer 返回的 `areaId`，如 `…-key-guarantee-area-4g-business_871949540.json`），非行政区 adcode；`time` 参数不参与文件名
  - `map-area-layer`：**不拼参数**（调用方均不传参，2026-10-29 用户确认；一接口一文件，便于运维落盘）
  - area 缺省时文件名不带 `_` 后缀（用无参文件）

## 3. 运维对照表（15 个接口）

### 首页（home）

- 重保区域业务（section-right.ts）
    - viewItemId：`key-guarantee-area-business`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-key-guarantee-area-business.json`
- 国际漫入TOP5（section-left.ts）
    - viewItemId：`intl-roam-top5`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-intl-roam-top5.json`
- 个人业务（section-left.ts）
    - viewItemId：`chbn-business-personal`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-chbn-business-personal.json`
- 家庭业务（section-left.ts）
    - viewItemId：`chbn-business-home`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-chbn-business-home.json`
- 政企业务（section-left.ts）
    - viewItemId：`chbn-business-government`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-chbn-business-government.json`
- 顶部指标（center.ts）
    - viewItemId：`competition-homepage-statistics`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-competition-homepage-statistics.json`
- 地图打点/区域轮巡（center.ts）
    - viewItemId：`competition-homepage-point`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-competition-homepage-point.json`
- 地图-区域图层（center.ts）
    - viewItemId：`map-area-layer`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-map-area-layer.json`
- 应急资源（center.ts）
    - viewItemId：`competition-homepage-resources`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-competition-homepage-resources.json`

### 区域页（area）

- 4G业务（section-left.ts）
    - viewItemId：`key-guarantee-area-4g-business`
    - viewPageId：`open-close-ceremonies-view`
    - 参数：area（区域标识；实际取值为区域ID，如 map-area-layer 返回的 areaId，非行政区划 adcode）
    - 文件名：`open-close-ceremonies-view-key-guarantee-area-4g-business_<区域ID>.json`（area 缺省时不带 `_` 后缀）
    - 文件示例：`open-close-ceremonies-view-key-guarantee-area-4g-business_871949540.json`
- 5G业务（section-left.ts）
    - viewItemId：`key-guarantee-area-5g-business`
    - viewPageId：`open-close-ceremonies-view`
    - 参数：area（区域标识；实际取值为区域ID，如 map-area-layer 返回的 areaId，非行政区划 adcode）
    - 文件名：`open-close-ceremonies-view-key-guarantee-area-5g-business_<区域ID>.json`（area 缺省时不带 `_` 后缀）
    - 文件示例：`open-close-ceremonies-view-key-guarantee-area-5g-business_871949540.json`
- 4G趋势指标（trend.ts）
    - viewItemId：`key-guarantee-area-4g-trend`
    - viewPageId：`open-close-ceremonies-view`
    - 参数：area（区域标识；实际取值为区域ID，如 map-area-layer 返回的 areaId，非行政区划 adcode）、time（截止时间，不参与文件名）
    - 文件名：`open-close-ceremonies-view-key-guarantee-area-4g-trend_<区域ID>.json`（area 缺省时不带 `_` 后缀）
    - 文件示例：`open-close-ceremonies-view-key-guarantee-area-4g-trend_871949540.json`
- 5G趋势指标（trend.ts）
    - viewItemId：`key-guarantee-area-5g-trend`
    - viewPageId：`open-close-ceremonies-view`
    - 参数：area（区域标识；实际取值为区域ID，如 map-area-layer 返回的 areaId，非行政区划 adcode）、time（截止时间，不参与文件名）
    - 文件名：`open-close-ceremonies-view-key-guarantee-area-5g-trend_<区域ID>.json`（area 缺省时不带 `_` 后缀）
    - 文件示例：`open-close-ceremonies-view-key-guarantee-area-5g-trend_871949540.json`
- 保障资源（section-center.ts）
    - viewItemId：`ceremonies-guarantee-resources`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-ceremonies-guarantee-resources.json`

### 公共（components）

- 天气（index.ts）
    - viewItemId：`ceremonies-weather`
    - viewPageId：`open-close-ceremonies-view`
    - 文件名：`open-close-ceremonies-view-ceremonies-weather.json`

## 4. 占位文件约定

- 目录内 `_` 前缀 json（如 `_open-close-ceremonies-view-…json`）为**占位数据**（按代码消费字段构造的示例值）
- `_` 前缀使文件不会被 fallback 接口命中（URL 不带 `_`），是刻意的「未就绪」标记
- 运维拿到真实数据后：落盘为无 `_` 前缀的同名文件即生效

## 5. 接口接入状态

15 个接口全部接入 `viewItemDataFallbackApi`（services 各文件的 `fallback(data)` 回调）：

| 分组 | 接口（services 文件） |
| --- | --- |
| home（9） | 重保区域业务（section-right）、国际漫入TOP5 / 个人 / 家庭 / 政企（section-left）、顶部指标 / 地图打点 / 区域图层 / 应急资源（center） |
| area（5） | 4G / 5G 业务（section-left）、4G / 5G 趋势（trend）、保障资源（section-center） |
| components（1） | 天气（index.ts） |

## 维护准则

- 新增接口时：services 加 `fallback` 回调 + 本 spec §3 清单加条目 + 派生运维件 api-item-map.md 同步 + 落占位 json，四者同步；**以本 spec 为准**
- converter 读取路径变化（rows / data）时，同步修正本文档 §1 的结构约定
