---
name: 'noc-shaanxi-management-overview-first'
version: '3.0'
updated: '2026-09-09'
description: '中屏管理总览第一屏（management-overview-first，面向业务场景）模块的唯一技能入口与整体设计文档：页面架构、widget 布局、数据通道、子模块速查、数字人交互与已知差异。'
---

# 管理总览第一屏（management-overview-first）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v3.0       |
| 最后更新 | 2026-09-09 |

本文档是 `web/pages/management-overview-first/` 的**唯一技能入口**，承担双重职责：

1. **整体设计文档**：页面架构、widget 布局、数据通道、子模块速查（本文 §一~§六）。
2. **索引入口**：详细规则与扩展流程拆分到独立文档：

-   设计原则、跨子模块工作流、已知差异 → `noc-shaanxi-project-context/design/modules/management-overview-first/principles.md`
-   如何新增 / 更新 / 删除子组件文档 → `noc-shaanxi-project-context/design/modules/management-overview-first/how-to-extend.md`

本技能随源码**持续进化**——任何源码改动都应在本文档或对应子组件文档里同步体现。

---

## 一、模块位置与页面架构

```
web/pages/management-overview-first/
├── index.less            # 全屏样式壳
├── metaHumanPresets.ts   # 数字人语音命中预设
├── render.tsx            # 渲染入口
└── modules/
    ├── screen.ts         # createLargeScreen 屏配置（management-overview-first）
    ├── fields.ts         # 交互字段（zoneSelect / center:tabChange）
    ├── index.ts          # widget 注册与布局（布局坐标的唯一事实源）
    ├── page-title/             # 页面标题
    ├── zone-select/            # 区域选择（左上角）
    ├── personal-business/      # 个人业务（左屏上）
    ├── family-business/        # 家庭业务（左屏下）
    ├── government-enterprise-business/ # 政企业务（右屏，入口用 overview-v2）
    ├── center/                 # 中心区域（三 tab：网络覆盖/场景监控/算网部署）
    │   └── components/
    │       ├── tab-button/          # tab 按钮组
    │       ├── tab-content-1/       # tab1：网络覆盖（指标 + GIS，含 center-gis）
    │       ├── tab-content-2/       # tab2：场景监控（分类按钮 + 卡片 + iframe 弹窗）
    │       └── tab-content-3/       # tab3：算网部署（飞线图 + 指标 + 数据中心列表）
    └── meta-human-helper-zone/ # 数字人辅助高亮层（非业务）
```

### 1.1 渲染链路

-   入口 `render.tsx`：
    -   `<LargeScreenEnv screen={screenName} designWidth={4800} designHeight={1200} enableScreenControl={false} enableMetaHuman={true} metaHumanPresets={...}>` —— 与第二屏相同的 4800×1200 超宽大屏，启用数字人。
    -   `<Background>` + 两个 `<Decoration1>`（左右装饰）+ `<WidgetsRender getWidgets={getWidgets}>` 渲染全部注册 widget。
    -   `<MetaHumanHelperZone />`（开发态辅助定位）+ `<MetaHumanCustomTrigger />`。

### 1.2 widget 布局（`modules/index.ts`）

布局坐标基于 4800×1200 设计稿，三列结构：

| 列   | widget（注册名） | 模块目录                       | layout(left, top, w×h) |
| ---- | ---------------- | ------------------------------ | ---------------------- |
| 顶部 | zone-selector    | zone-select                    | 80, 40, 200×48         |
| 顶部 | page-title       | page-title                     | 1950, 50, 895×50       |
| 左列 | 个人业务         | personal-business              | 152, 95, 1407×680      |
| 左列 | 家庭业务         | family-business                | 152, 775, 1407×371     |
| 中列 | 中心区域         | center                         | 1644, 133, 1528×1000   |
| 右列 | 政企业务         | government-enterprise-business | 3247, 95, 1407×1052    |

除 center 同时订阅 `currentTabType(center:tabChange) + zoneSelect` 外，其余业务模块均订阅 `zoneSelect`。

### 1.3 交互字段（`modules/fields.ts`）

-   `zoneSelect`：区域选择派发，驱动全屏模块按区域刷新（center-tab-1 等以 currentZone 为 refreshDeps）。
-   `center:tabChange`：中屏 tab 切换，值为 `tab1-网络覆盖` / `tab2-场景监控` / `tab3-算网部署`。

### 1.4 数字人（`metaHumanPresets.ts`）

按业务模块分组：

| 分组         | 能力                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| 个人业务     | 热点业务 TOP5 tab 切换（视频 / 游戏 / 即时通信 / 支付）                       |
| 政企业务     | 六大政企业务切换（物联网 / 专线 / 5G 专网 / 企业宽带 / IDC / ICT）            |
| 中屏切换     | 三 tab 语音切换                                                               |
| 中屏网络覆盖 | 图层呈现 / 取消呈现（全部、2G/4G/5G 基站、高精度、物联网、一干/二干光缆）     |
| 中屏场景监控 | 场景分类切换（SWITCH_OPERATE）+ 场景弹窗打开/关闭（OPEN/CLOSE_OPERATE_MODAL） |
| 中屏算网部署 | 数据中心列表跳转到指定数据中心                                                |

---

## 二、数据通道（全模块共用）

-   服务层：`web/services/management-overview-first/`（含 `request-api.ts` requestId 映射表、`share/`、`center/`、`personal-business/`、`family-business/`、`government-enterprise-business/`）。
-   主通道：`getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），参数 `{ viewItemId, viewPageId, viewPageArgs }`，取 `data.viewItemData.rows`。
-   例外：tab1 GIS 打点走 `getNocNetworkCoverageMapApi`（`noc/networkCoverageMap`，requestId 2428 硬编码调用）。
-   **`src/` 下无第一屏业务数据接口**：midway BFF 只负责 SSR 路由，业务数据全部直连外部 fedx 视图服务。

### 2.1 requestId 映射速查（`request-api.ts`）

| viewPageId / viewItemId                                                | requestId | 用途                                |
| ---------------------------------------------------------------------- | --------- | ----------------------------------- |
| noc-business-oriented-left-page / noc-region                           | 2392      | 区域选择                            |
| noc-business-oriented-left-page / personal-business-scale-dict         | 2395      | 个人业务-业务规模字典               |
| noc-business-oriented-left-page / personal-business-quality-dict       | 2398      | 个人业务-业务质量字典               |
| noc-business-oriented-left-page / personal-business-hotspot-info-dict  | 2401      | 个人业务-热点业务字典               |
| noc-business-oriented-left-page / personal-business-scale              | 2404      | 个人业务-业务规模（localMock 残留） |
| noc-business-oriented-left-page / personal-business-quality            | 2407      | 个人业务-业务质量                   |
| noc-business-oriented-left-page / personal-business-hotspot-info       | 2410      | 个人业务-热点业务 TOP5              |
| noc-business-oriented-left-page / home-business-dict                   | 2413      | 家庭业务字典（cacheLoader 缓存）    |
| noc-business-oriented-left-page / home-business-scale                  | 2419      | 家庭业务-规模                       |
| noc-business-oriented-left-page / home-business-quality                | 2422      | 家庭业务-质量                       |
| noc-business-oriented-middle-page / network-coverage-indicator         | 2425      | 中屏网络覆盖-指标                   |
| （条目被注释，RealGis 硬编码）                                         | 2428      | 中屏算网部署-地图打点（GIS）        |
| noc-business-oriented-middle-page / network-coverage-map-optical-cable | 2431      | 中屏网络覆盖-光缆连线（一干/二干）  |
| noc-business-oriented-middle-page / scene-monitor-type                 | 2434      | 中屏场景监控-分类                   |
| noc-business-oriented-middle-page / scene-monitor-scene                | 2437      | 中屏场景监控-场景列表               |
| noc-business-oriented-middle-page / computing-net-statistics           | 2440      | 中屏算网部署-统计（左侧指标）       |
| noc-business-oriented-middle-page / computing-net-map                  | 2443      | 中屏算网部署-地图（飞线）           |
| noc-business-oriented-middle-page / computing-net-indicator            | 2446      | 中屏算网部署-指标（右侧列表）       |
| noc-business-oriented-right-page / government-business-summary         | 2452      | 政企业务-六大类汇总指标             |
| noc-business-oriented-right-page / government-business-scale           | 2455      | 政企业务-业务规模                   |
| noc-business-oriented-right-page / government-business-quality         | 2458      | 政企业务-业务质量                   |

> `request-api.ts` 注释标明「脚本生成，不用维护」；新增条目方式需与数据方案脚本协调（未确认）。

---

## 三、子模块速查

| 子模块                         | 业务用途                                         | 图表/展示                                                        | 数据源                                                       | 轮询                                                  |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| zone-select                    | 区域选择，派发 zoneSelect                        | 下拉                                                             | noc-region (2392)                                            | -                                                     |
| page-title                     | 标题「陕西移动网络管理概览」                     | 纯展示                                                           | -                                                            | -                                                     |
| personal-business              | 业务规模 / 业务质量 / 热点业务 TOP5 三区         | 纯样式条形 + Highcharts 3D 饼 + 3D 柱                            | 2395/2404 + 2398/2407 + 2401/2410                            | 无接口轮询；TOP5 tab 10s 自动轮播（数智人启用时暂停） |
| family-business                | 家庭宽带 / 移动高清（规模+质量）                 | 指标卡 + StreamerPath 流光边框                                   | 2413 + 2419 + 2422（字典缓存）                               | -                                                     |
| government-enterprise-business | 政企六大业务概览（椭圆轨道）+ 详情页（配置驱动） | 详见独立文档（本技能 `modules/government-enterprise-business/`） | 2452/2455/2458（详见其 `services-documentation.md`）         | -                                                     |
| center-tab1                    | 网络覆盖：左中右指标 + GIS 地图                  | 指标卡 + fedx-gis 2D + StreamerPath                              | network-coverage-indicator (2425)；GIS 打点 2428 + 光缆 2431 | -                                                     |
| center-tab2                    | 场景监控：分类按钮 + 场景卡片，点击弹 iframe     | Button + antd Carousel + Modal iframe                            | scene-monitor-type (2434) + scene-monitor-scene (2437)       | -                                                     |
| center-tab3                    | 算网部署：IDC / 边缘云 90s 自动切换              | echarts 飞线 + 指标卡 + Carousel 列表                            | 2440 + 2443 + 2446                                           | 无接口轮询；resType 90s 自动切换（悬停暂停）          |
| meta-human-helper-zone         | 数字人指令区域高亮辅助（开发态）                 | Highlight 描边框                                                 | 静态 json（public/static/meta-human-sdk-helper/）            | -                                                     |

### 3.1 center 结构（`modules/center/index.tsx`）

-   三个 tab-content 常驻 DOM，visibility/opacity 切换；**tab3 仅激活时挂载**。
-   `tab-button`：三个 ImageButton，点击 dispatch `center:tabChange`，挂载默认派发 tab1，并响应数智人「中屏切换」。
-   **tab-content-1（网络覆盖）**：`IndicatorPlayer` 包裹左（指标 slice 1-5）+ GIS + 右（slice 5-10）。GIS 按 `networkGisConfig.renderType` 分流：
    -   `ImageGis`：图片式 GIS，图层打点/连线数据请求**整体被注释**（死代码），当前只做图层显隐、居中缩放、流光动效、数智人图层开关。
    -   `RealGis`：真实 GIS，实际调用打点（2428）与光缆（2431，一干/二干按 viewItemUnitId 区分）接口。
    -   图例 Checkbox 控制图层显隐；无弹窗。详细文档见本技能 `components/image-gis.md`。
-   **tab-content-2（场景监控）**：左侧分类按钮（前端汇总出「全部」项）+ 右侧卡片 Carousel（每页 8 卡）；点击卡片打开 antd Modal + iframe（openUrl 来自 subSceneUrl 或环境配置 sceneMonitorUrl），数智人可语音开/关弹窗（可自定义宽高）。
-   **tab-content-3（算网部署）**：左侧指标（点击切换 IDC/边缘云 resType）+ 中间 echarts 飞线（registerMap 省份 geojson；IDC 为闭环折线 + scatter 图标打点，边缘云为 scatter 图标）+ 右侧数据中心 Carousel（slidesToShow=3，autoplay 条件：环境配置 enableRightDataCenterAlwaysRun 或数智人未启用）。

---

## 四、子组件文档索引

判定与维护流程详见 `noc-shaanxi-project-context/design/modules/management-overview-first/how-to-extend.md`。

### 4.1 纯组件类（`components/`）

| 子组件                       | 文档                                      | 源码位置                                                                                             | 一句话能力                                 |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| image-gis（中心区 GIS 组件） | `components/image-gis.md`（本技能目录下） | `web/pages/management-overview-first/modules/center/components/tab-content-1/components/center-gis/` | 网络覆盖图层、流光动画、图例控制、地图交互 |

### 4.2 业务模块类（`modules/`）

| 子模块                                             | 文档                                                                 | 源码位置                                                                      | 一句话能力                                             |
| -------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| government-enterprise-business（政府企业业务模块） | `modules/government-enterprise-business/overview.md`（本技能目录下） | `web/pages/management-overview-first/modules/government-enterprise-business/` | 6 种政企业务的概览（椭圆轨道）和详情页（配置驱动渲染） |

> 暂未登记的子模块（个人业务 / 家庭业务 / 中心区其它 tab 等）按需新增，详见 `how-to-extend.md`。

---

## 五、调用时机速查

**优先调用本技能当：**

-   用户提出**跨子模块**的修改（涉及多个子模块需要协调）
-   用户**首次描述**该屏相关需求，希望了解有哪些子模块可独立维护
-   需要调整 `render.tsx` 装配顺序、`screen.ts` 区域配置、`modules/index.ts` 布局、`index.less` 全屏样式
-   需要新增 / 更新 / 删除子组件文档（按 `how-to-extend.md` 流程）

**直接查阅子组件文档当：**

-   修改目标明确落在某个子模块（如「修改 ImageGis 的图例顺序」）

---

## 六、已知差异与技术债

-   **政企业务双版本**：入口 `index.tsx` 引用的是 `overview-v2/`；旧版 `overview/` 目录保留未删（内含 10s 轮询，v2 中已注释禁用）。
-   **ImageGis 死代码**：图层打点/连线数据请求整段被注释（约 178-290 行），状态保留但恒为空数组；数据实际只在 RealGis 调用。
-   **requestId 2428 无映射**：`request-api.ts` 中对应条目被注释，RealGis 硬编码 requestId 调用。
-   **localMock 残留**：`personal-business-scale`（2404）的 localMockUrl 未注释，是唯一生效中的 mock。
-   **备份文件**：`tab-content-3/components/echarts-fly-line/index-bak.tsx` 未删除。
-   **console.log 调试残留**：约 55 处命中，重点在 `ImageGis.tsx` / `RealGis.tsx` / `tab-content-2/left-part` / `VectorLayerItem.tsx`。
-   **目录结构不一致**：`tab-content-2` 下 left-part / right-part 直接位于目录下，无 `components/` 前缀（tab1/3 有）。
-   **DPR 适配**：StreamerPath 等 Canvas 组件未做高分屏 DPR 缩放（详见 `design/modules/ui-streamer-path/`）。

---

## 七、关联技能（引用方式：skill id）

引用其他技能时仅写 **skill id**，不带文件路径：

-   `@noc-shaanxi-management-overview-first`（本技能）
-   `@noc-shaanxi-ui-streamer-path`（流光路径组件技能，本屏多处使用）
-   `@noc-shaanxi-chinese-database-adapter`（国产数据库适配技能，按需查阅）

---

## 八、详细文档入口

| 文档                               | 内容                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `principles.md`（本技能目录下）    | 设计原则、跨子模块工作流、核心职责速查、已知差异                                   |
| `how-to-extend.md`（本技能目录下） | `components/` vs `modules/` 判定流程、新增 / 更新 / 删除流程、文档模板、版本号约定 |

---

## 九、版本演进说明

| 版本 | 关键变更                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.0 | 初始版本：建立 `management-overview-first` 总技能目录                                                                                                                                            |
| v1.1 | `image-gis` 详细文档从内联改为外置，迁移至 `components/image-gis.md`                                                                                                                             |
| v1.2 | 新增 `modules/` 子目录；政府企业业务模块三份文档迁入 `modules/government-enterprise-business/`                                                                                                   |
| v1.3 | 删除独立子技能 `image-gis/` 与 `noc-shaanxi-first-government-enterprise-business/`，所有子组件文档统一收纳在本技能内                                                                             |
| v2.0 | **大版本重构**：SKILL.md 转为纯索引入口；新增 `principles.md` 与 `how-to-extend.md`；跨技能引用改为 skill id 形式                                                                                |
| v3.0 | **对齐第二屏文档结构**：本文档从纯索引升级为整体设计文档，补充渲染链路、widget 布局表、数据通道与 requestId 速查、子模块速查、center 三 tab 结构、技术债清单；文件路径引用改为仓库相对路径纯文本 |
