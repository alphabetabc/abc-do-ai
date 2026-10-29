# fallback 静态兜底 · spec + data-model

> 作用：信管局大屏接口空数据/访问失败时，读取 `public/static/fallback/info-management-bureau/` 下的静态 json 兜底，保障大屏不空框。数据更新后无需重启服务。
>
> **本 spec 是信管局模块 fallback 能力的唯一真相源**；`public/static/fallback/info-management-bureau/readme*.md` 仅为派生出的运维交付件，两处内容不一致时以本 spec 为准并回改交付件。

## 1. 兜底链路

接口层（`web/services/info-management-bureau/`）统一走 `getViewItemDataApi`（viewPageId `open-close-ceremonies-view`，例外见 §3 今日赛程），空数据兜底链：

```text
接口返回空 / 访问失败 → fallback url（viewItemDataFallbackApi + getStaticApi）
                     → localMockUrl（public/static/mock/info-management-bureau/）
                     → 各接口默认值
```

`viewItemDataFallbackApi` 定义于 `web/services/info-management-bureau/loadFallbackData.ts`（深圳保障屏的同名实现即参考此处）。fallback 结果 **merge 进 response** 后仍走各接口的 `defaultConverter`（读 `data.viewItemData.rows`），故文件结构为 `{ code: 200, data: { viewItemData: { rows } } }`。

## 2. 文件名规则

- 无参接口：`open-close-ceremonies-view-<viewItemId>.json`
- 带参接口：`open-close-ceremonies-view-<viewItemId>_<参数值>.json`，多参数下划线相接，顺序与接口 `viewPageArgs` 一致
  - `area` 实际取值为场馆（区域）ID，多个场馆逗号相连（如 `-2028761466,-1999284500,…`）
  - 天气为双参数：`_<area>_<areaName>`（areaName 为场馆名称中文）
  - 今日赛程无 viewPageId 前缀，直接 `today-game-scheduler.json`

## 3. 接口接入清单

### 公共（components/index.ts）

- 今日赛程
    - viewItemId：`today-competition-schedule`
    - 文件名：`today-game-scheduler.json`（**不含 viewPageId 前缀**，历史命名）
- 天气
    - viewItemId：`ceremonies-weather`
    - 参数：area（场馆ID）、areaName（场馆名称）
    - 文件名：`open-close-ceremonies-view-ceremonies-weather_<area>_<areaName>.json`
    - 文件示例：`open-close-ceremonies-view-ceremonies-weather_-2028761466_广东省奥林匹克体育中心体育场.json`

### 首页（home）

- 顶部指标（section-left.ts）
    - viewItemId：`competition-homepage-statistics`
    - 文件名：`open-close-ceremonies-view-competition-homepage-statistics.json`
- 个人业务（section-left.ts）
    - viewItemId：`chbn-business-personal`
    - 文件名：`open-close-ceremonies-view-chbn-business-personal.json`
- 家庭业务（section-left.ts）
    - viewItemId：`chbn-business-home`
    - 文件名：`open-close-ceremonies-view-chbn-business-home.json`
- 政企业务（section-left.ts）
    - viewItemId：`chbn-business-government`
    - 文件名：`open-close-ceremonies-view-chbn-business-government.json`
- 新兴业务（section-left.ts）
    - viewItemId：`chbn-business-emerging`
    - 文件名：`open-close-ceremonies-view-chbn-business-emerging.json`
- 地图打点（center.ts）
    - viewItemId：`competition-homepage-point`
    - 文件名：`open-close-ceremonies-view-competition-homepage-point.json`
- 保障资源（section-right.ts）
    - viewItemId：`competition-homepage-resources`
    - 文件名：`open-close-ceremonies-view-competition-homepage-resources.json`
- 十五运业务资源（section-right.ts）
    - viewItemId：`fifteen-game-business`
    - 参数：area
    - 文件名：`open-close-ceremonies-view-fifteen-game-business_<area>.json`
    - 文件示例：`open-close-ceremonies-view-fifteen-game-business_1671775762.json`

> home/section-left.ts 另有 `competition-homepage-public-internet` / `competition-homepage-key` / `competition-homepage-cloud-video` 三个 viewItemId，**未接 fallback**（无 fallback 回调与数据文件）。

### 开闭幕式（open-and-close）

- 无线规模-基站（section-left.ts）
    - viewItemId：`wireless-scale-station`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-wireless-scale-station_<area>.json`
    - 文件示例：`open-close-ceremonies-view-wireless-scale-station_-2028761466,-1999284500,2119480143,243466997,-1667507826,-360734630.json`
- 无线规模-小区（section-left.ts）
    - viewItemId：`wireless-scale-community`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-wireless-scale-community_<area>.json`
- 无线质量-RRC连接数（section-left.ts）
    - viewItemId：`wireless-quality-online-user`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-wireless-quality-online-user_<area>.json`
- 无线质量-接通率（section-left.ts）
    - viewItemId：`wireless-quality-rrc`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-wireless-quality-rrc_<area>.json`
- 保障资源（section-center.ts）
    - viewItemId：`ceremonies-guarantee-resources`
    - 文件名：`open-close-ceremonies-view-ceremonies-guarantee-resources.json`
- 网络资源（section-right.ts）
    - viewItemId：`fifteen-game-web-resources`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-fifteen-game-web-resources_<area>.json`
- 集群通信（section-right.ts）
    - viewItemId：`fifteen-game-trunk-communication`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-fifteen-game-trunk-communication_<area>.json`
- 专线规模（section-right.ts）
    - viewItemId：`fifteen-game-line-scale`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-fifteen-game-line-scale_<area>.json`
- 专线质量-专线流量（section-right.ts）
    - viewItemId：`ceremonies-line-quality-up`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-ceremonies-line-quality-up_<area>.json`
- 专线质量-无线平均速率（section-right.ts）
    - viewItemId：`ceremonies-line-quality-down`
    - 参数：area（多场馆逗号相连）
    - 文件名：`open-close-ceremonies-view-ceremonies-line-quality-down_<area>.json`
- 重保区域用户数-全网（section-right.ts）
    - viewItemId：`new-guaranteed-area-users-chart2-all`
    - 参数：area
    - 文件名：`open-close-ceremonies-view-new-guaranteed-area-users-chart2-all_<area>.json`（**目录内暂无数据文件**）
- 重保区域用户数-5G（section-right.ts）
    - viewItemId：`new-guaranteed-area-users-chart2-5g`
    - 参数：area
    - 文件名：`open-close-ceremonies-view-new-guaranteed-area-users-chart2-5g_<area>.json`（**目录内暂无数据文件**）
- 重保区域用户数-4G（section-right.ts）
    - viewItemId：`new-guaranteed-area-users-chart2-4g`
    - 参数：area
    - 文件名：`open-close-ceremonies-view-new-guaranteed-area-users-chart2-4g_<area>.json`（**目录内暂无数据文件**）

### 比赛日（game-match）

**未接 fallback**（services 定义了 viewItemId 但无 `viewItemDataFallbackApi` 回调）：`wireless-scale-station` / `wireless-scale-community` / `wireless-quality-rrc` / `wireless-quality-online-user`（section-left）、`fifteen-game-web-resources` / `fifteen-game-line-scale` / `ceremonies-line-quality-up` / `ceremonies-line-quality-down`（section-right）、`ceremonies-guarantee-resources`（section-center）。与开闭幕式同 viewItemId 的数据文件仅对开闭幕式视图生效。

## 4. 运维交付件

`public/static/fallback/info-management-bureau/` 下：

- `readme.md` / `readme-首页.md` / `readme-开闭幕式.md` / `readme-通用.md`：按视图分组的文件名对照（派生自本 spec §3，不一致时以本 spec 为准）
- json 数据文件：与 §3 文件名一一对应

## 维护准则

- 新增接口时：services 加 `fallback` 回调 + 本 spec §3 清单加条目 + 派生运维件 readme 同步 + 落数据 json，四者同步；**以本 spec 为准**
- converter 读取路径变化时，同步修正本文档 §1 的结构约定
