# Task · 2026-10-09-004-03-scguarantee-home-widgets-migrate

## 任务元信息

| 项       | 值                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-09-004-03-scguarantee-home-widgets-migrate`                                      |
| Status   | 已完成（6 块组件迁移+样式全部定稿；2026-10-10 用户验收通过）                                   |
| 类型     | 编码                                                                                           |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/**`（占位壳替换为迁移组件） |
| Roadmap  | 2026 年深圳重要通信保障屏建设（PM 素材 2026-10）                                               |
| 验收标准 | 见下方验收 checklist（A1–A3）                                                                  |
| 前置依赖 | 004-01（接口层）、004-02（模块框样式）已完成                                                   |

---

## 目标（Goal）

把信管局已有对应能力的**首屏**组件物理复制到深圳屏并改造，替换骨架占位。含 communication-service（源 chbn-business）、center-map、area-business、emergency-resource、top-type-filter（仅静态展示）、home-background。

**工作模式（用户 2026-10-09 确认）**：每块组件按「AI 迁移代码（保源样式）→ 记录方案到本卡 → 用户验收视觉，样式调整由 AI 按反馈逐条改 → 确认 OK 后再启动下一块」的节奏推进；每块迁移**先写方案再动代码**，方案与实际源码核对，不凭印象。样式调整属于本卡工作内容：用户在浏览器指出偏差（尺寸/字号/间距/对齐），AI 用 SearchReplace 精准改。

## 步骤（执行计划）

1. **communication-service**：源 `info-management-bureau home/modules/chbn-business` → 目标 `home/modules/communication-service`；个人/家庭/政企三块接 004-01 已迁三接口；漫入TOP5（RoamingTop5）数据源属 004-00 二-1 新增接口（服务端待开发），本卡仅做静态占位（零自造 API）【已定稿（2026-10-10 用户确认样式 OK）】
2. **center-map**：迁 `home/center-map`；底图 adcode 锁深圳（440300）；TOOLTIP（区域图片+名称）；打点 onClick → `switchToArea` 切屏【静态迁移已定稿（2026-10-10 用户确认样式 OK）；TOOLTIP/切屏/轮巡联动属 005】
3. **area-business**：~~迁 open-and-close 的 wireless-scale / line-scale~~ 改为自写静态 UI（用户 2026-10-10 定案：不复刻信管局 UI），指标为 2G/4G/5G 基站小区、通感站、专线（汇总维度）；接口属 004-00 二-2 待开发【已定稿（2026-10-10 用户确认样式 OK）】
4. **emergency-resource**：~~迁 open-and-close/support-resource~~ 改迁 home/bottom-indicators（用户 2026-10-10 批准，接口原配 UI），资源顺序走 presets（首屏 [卫星车,通信车,发电车,人员]）【代码已迁，样式已定稿（2026-10-10 用户确认 OK）】
5. **top-type-filter**：卡片视觉迁 top-indicators；**联动逻辑属 005，本卡只做静态展示**【已定稿（2026-10-10 用户确认样式 OK；图标为临时映射，待 UI 原位替换）】
6. **home-background**：迁 home/home-bg，首屏专属装饰背景层（单图 + visible 控制，z-index -2；与全局 `components/background` 并存）【已完成】

> 天气卡不在本卡范围：`sub-pages/components/weather-card`（固定深圳地市，接 004-01 `getWeatherDataApi`）已在骨架阶段完成并挂载于 `sub-pages/index.tsx` 头部。

## 功能列表

- F1：首屏 6 个迁移 widget（通信服务、地图含 TOOLTIP/切屏、重保区域业务、应急资源、顶部类型统计卡静态展示、首屏背景层）

## 不做清单

- 顶部类型过滤联动逻辑（areaTypeFilter 广播与订阅，属 005）
- 国际漫入 TOP5 接口对接与取数（004-00 二-1 新增接口，服务端待开发；本卡仅静态占位）
- 区域屏组件（004-04）、LOG/轮巡（005）
- 后端真实接口对接
- pnpm lint（用户明确不跑）

## 业务规则

- 复用 = 物理复制，禁止跨模块 import
- 资源顺序：首屏 [卫星车,通信车,发电车,人员]
- 每块组件迁移前先在本卡写方案（对照实际源码），再动代码；改注释/小改用 SearchReplace 精准替换

## 验收 checklist

- [x] A1：各组件 mock 数据正常渲染（服务层兜底链工作；area-business/漫入TOP5 为约定静态占位）
- [x] A2：地图仅深圳（adcode 440300）静态渲染正常（原表述含 TOOLTIP/切屏，2026-10-10 修正——用户定案留 005）
- [x] A3：指标按需求稿呈现（政企映射、2G/通感站/专线）；漫入TOP5 为静态占位；资源顺序正确；文档回填（任务卡 + docs/specs 同步）

## 技术设计（阶段二回填）

### 迁移映射与改造点

| 新屏能力       | 信管局源                                                                      | 改造点                                                                                                                    | 状态                       |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 通信服务       | home/chbn-business → 目标 `home/modules/communication-service`                | 个人/家庭/政企接 004-01 三接口；漫入TOP5 复用 NewBusinessTop5 UI，组件内假数据（接口属 004-00 二-1 待开发）               | 已完成（样式定稿）         |
| 地图           | home/center-map                                                               | 见下方「center-map 迁移方案」                                                                                             | 已完成（纯静态，图标后补） |
| 重保区域业务卡 | 自写静态 UI（用户 2026-10-10 定案，不迁 wireless-scale / line-scale）         | 8 行两层结构（2G/4G/5G 基站+小区、通感站、重保专线），静态常量数据                                                        | 已完成（样式定稿）         |
| 应急资源       | home/bottom-indicators（原定 open-and-close/support-resource，2026-10-10 改） | 资源顺序走接口 viewItemDataTemplate presets（卫星车/通信车/发电车/人员）                                                  | 已完成（样式定稿）         |
| 顶部类型统计卡 | home/top-indicators                                                           | 类型字典换 5 类型；仅静态展示                                                                                             | 已完成（图标临时映射）     |
| 首屏背景层     | home/home-bg                                                                  | 图片换深圳屏首屏背景图（`web/pages/shenzhen-communication-guarantee/images/home-bg.png`）；保持 visible 控制与 z-index -2 | 已完成                     |

### 通信服务（communication-service）迁移方案【已实施 2026-10-09，样式已定稿 2026-10-10】

- 物理复制源 `home/modules/chbn-business` 下 IndBox / PersonalBusiness / FamilyBusiness / GEBusinessTop4 四个文件到目标目录（后者已改名 GEBusiness.tsx）
- 接口 import 改为 `~/web/services/shenzhen-communication-guarantee/home/section-left`（004-01 已迁 getPersonalBusinessApi / getFamilyBusinessApi / getGEBusinessApi），轮询 15 分钟保持
- 漫入TOP5：复用源 NewBusinessTop5 的 UI（三档行条带/进度条/千分位值），组件内 MOCK_DATA 假数据呈现，不写 mock、零自造 API；接口数据源属 004-00 二-1
- 政企业务：组件导出与标题改名 `GEBusiness` /「政企业务」（去掉 TOP4）；接口函数同步改名 `getGEBusinessApi`（viewItemId `chbn-business-government` 与 mock 文件名不动，属接口标识）
- 素材复制（已去 chbn 前缀改名）：`business-ind-icon.png`（原 chbn-ind-icon.png）、`roaming-top5-bg-1/2/3.svg`（原 chbn-top5-bg-1/2/3.svg）→ `web/pages/shenzhen-communication-guarantee/images/`；代码内已无 chbn 残留
- index.tsx：占位壳替换为四块内容纵向排布，PanelLeft 720×1564 保持
- index.less：源 `.home-chbn-business` panel-content 布局复制，改类名 `.home-communication-service`；panel-content padding 38px 40px / row-gap 40px
- 样式调整（用户浏览器验收 → AI 按反馈逐条改，均为设计稿值）：小标题竖线 rgba(37,200,246,1)/背景 0.1、标题 36px weight500 lh56；个人业务饼图 180px、label 28px、值 32px DIN、中心文字同步放大、色点 20×20；家庭/政企 item 50%×92.67、标题块 121.07×90.67、值 36px DIN ls1.62；漫入TOP5 行高 65、label/列头 28px、值 36px DIN、单位 20px（unit 暂注释）

### center-map 迁移方案【待用户确认后实施】

已读源实现（`home/modules/center-map`），实际技术栈为 **EChartsMap（`~/web/components/ui/rc-echarts/map`，echarts geo）+ adcode 注册地图**，与 emap-gis 无关（原步骤 2「emap-gis spike」表述有误，删除）：

- 主组件 index.tsx：NoStylePanel 1615×635 + map-bg.png 容器 + EChartsMap + 图例
- map.ts：`geoBuilder`（geo 数组、label 白字显示区域名）+ `mapLegendTypes`（打点类型字典：iconLegend 图例 + iconMap 打点图标/尺寸 + zIndex）
- ActiveOverlayItem：OverlayItem 挂经纬度，展示「场馆缩略图 + 标题」，点击回调切视图（源走 `switchViewByStadiumInfo`）
- 数据：源 `getHomeCenterMapDataApi` → 深圳屏对应 `getHomeAreaPointApi`（004-01 已迁，center.ts）

深圳屏改造点：

| 项           | 改法                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 底图         | adcode `440000`（广东）→ `440300`（深圳），需确认深圳 geojson 可用性（EChartsMap 按 adcode 加载）                                    |
| 打点类型字典 | mapLegendTypes 换深圳屏区域类型（mock homeAreaPoint 的 type 字段对齐；具体类型清单待对照设计稿/mock 确认）                           |
| TOOLTIP/浮层 | 复用 ActiveOverlayItem 结构，缩略图源改深圳屏区域图片目录（staticAssets 深圳屏 presets）                                             |
| 切屏         | onClick 改调深圳屏 `switchToArea`（sub-pages 已有切屏机制），携带区域上下文                                                          |
| 轮巡激活     | 源 props.todayGameSchedulerActiveItem 来自区域轮巡（005），本卡不做轮巡，浮层先由打点 hover/静态数据驱动（具体驱动方式待与用户对齐） |

**未决问题**：已于 2026-10-10 与用户对齐——**纯静态先迁移**（hover/点击/切屏/TOOLTIP/图例全留 005）；区域缩略图与区域轮播共用同一图片源；打点图标后补。

### center-map 迁移方案【已实施 2026-10-10，样式已定稿】

- **范围**：底图 + 打点静态展示。无图例（用户确认）、无 TOOLTIP 浮层、无点击切屏（均属 005）
- **文件**：index.tsx / map.ts / index.less 三文件，替换原占位壳；map-bg.png 用户已放置
- **底图**：EChartsMap adcode `440300`（geojson 已核实存在于 `public/static/map/geojson/`）；geoBuilder 复制源实现（区县名白字 label）
- **打点**：`mapPointTypes` 字典对齐 mock type 1-5（会场/参访区/酒店/交通枢纽/其它），每类型一个 scatter series；图标后补，暂用 `circle` symbol + 类型色 + 白边 + 名称 label，silent: true（同源）
- **数据**：`getHomeAreaPointApi`（004-01 已迁，15 分钟轮询）；数据为空时不渲染 EChartsMap
- **面板**：NoStylePanel 1615×1200（占位壳原尺寸），map-bg 容器同尺寸；widgets 注册 left 1200 / top 400 不动
- **图标后补方式**：~~mapPointTypes 每项加 iconMap 后 seriesBuilder 换回 image://~~ 已实施（2026-10-10）：用户放置 `public/static/images/shenzhen-communication-guarantee/icon-map-<类型>.svg`（90×90），map.ts 每项加 `iconUrl` getter（走 staticAssets.imageRoot），seriesBuilder 改 `image://` symbol 64px / offset [0,-32]，label 放大到 20px
- **用户手动调整（2026-10-10）**：geo left 135 / right 24 / top 350 / bottom 350，区县名 label 30px + stroke；index.less map-bg 居中、background-size 2960×1226；打点 symbolSize 64→90、名称 label show: false
- **TOOLTIP 备忘（2026-10-10 用户定案）**：浮层由下方**区域轮播触发**，实现方式同信管局——轮播 activeItem 经交互字段（`activeArea`，005 步骤 1）注入 center-map props，组件内按 id 匹配打点生成 overlayInfo，渲染 ActiveOverlayItem（图片+名称，点击切区域屏）；打点 series 同步激活态放大（源实现 ×2）。缩略图与区域轮播共用图片源（用户确认）——005 实施时做

### top-type-filter 迁移方案【已实施 2026-10-10，样式已定稿】

已读源实现（`home/modules/top-indicators`：index.tsx + scale-item-card.tsx + index.less）与目标侧现状：

- 源结构：NoStylePanel 1458×75 + `ScaleItemCard`（行卡 290×75，top_bg.svg 背景，icon 38×38、标题 20px、值 36px YouSheBiaoTiHei 渐变）；数据 `getTopIndicatorsApi` 15 分钟轮询，行结构 `{ type, num }`
- 数据源：深圳屏 `getTopIndicatorsApi` 已在 004-01 迁好（`web/services/shenzhen-communication-guarantee/home/center.ts`），固定返回 5 类型 [会场, 参访区, 酒店, 交通枢纽, 其它]，mock `top-indicators.json` 已就位 → 组件接真接口，无自造 API；「静态」指**不做选中/取消联动**（属 005），卡片不绑 onClick
- 改造点：
    - 物理复制 3 文件到 `home/modules/top-type-filter/`；接口 import 改深圳屏 center.ts；删除「办公场所→重点办公场所」标题改写逻辑（深圳 5 类型直接显示）
    - 图标路径改 `${constants.IMAGE_PATH}/shenzhen-communication-guarantee/icon-${type}.svg`（同应急资源 iconPath 规约）
    - index.less：top_bg.svg 复制到 `web/pages/shenzhen-communication-guarantee/images/top_bg.svg`，less 内相对路径同步改；类名保持 `home-top-indicators-container`（组件内私有，无冲突）
    - NoStylePanel 尺寸沿用源 1458×75；widgets 注册 layout left 1220 / top 170 不动
- **素材缺口（待用户确认）**：5 类型图标需放 `public/static/images/shenzhen-communication-guarantee/`。信管局现有 icon 仅 竞赛场馆/非竞赛场馆/酒店/医院/办公场所 5 个，拟临时映射：会场→竞赛场馆、参访区→非竞赛场馆、酒店→酒店、交通枢纽→医院、其它→办公场所，待设计稿图标到位后原位替换（文件名不变，零代码改动）

样式调整记录（含用户手动调整，2026-10-10）：

- NoStylePanel 尺寸 1458×75 → 2716×120（index.tsx，widgets layout left 1220 / top 170 不动）
- 行卡 580×150，top_bg background-size 100% 100%，卡片间距 margin-right -50px（叠压），padding-left 20px
- 图标放大 76×76（background-size 100% 100%），容器 padding-bottom 20px
- 标题 40px/700（宽度 200px）；数值 72px YouSheBiaoTiHei，渐变 32.766%→79.516%
- scale-item-card-root 改 justify-content: center + column-gap 0

### 应急资源（emergency-resource）迁移方案【已实施 2026-10-10，样式已定稿 2026-10-10】

源组件勘误：原计划迁 open-and-close/support-resource，但读源后发现其为分组结构（group.children 两行子指标，接 getSupportResourceApi），与 004-01 已迁 getEmergencyResourceApi 的扁平返回结构不匹配；真实原配 UI 为信管局 home/bottom-indicators（扁平 icon+name+value+unit，正是 getHomeBottomIndicatorsApi 的消费者）。经用户 2026-10-10 批准改迁 bottom-indicators。

- 物理复制 2 文件（index.tsx / index.less）到 `home/modules/emergency-resource/`，替换占位壳
- 接口 import 改 `~/web/services/shenzhen-communication-guarantee/home/center.ts` 的 `getEmergencyResourceApi`；源 bottom-indicators 的 useRequest 无轮询，保持一致（未加 pollingInterval）
- 素材：`icon-保障卫星车/通信车/发电车/人员.svg` 4 个从信管局 static/images 原名复制到深圳屏目录（本义图标，非临时映射）；`ind-bg.png` 复制到模块 `images/`（less 相对路径 `./images/ind-bg.png` 同源）
- 展示顺序由接口 viewItemDataTemplate 按 presets 排好（卫星车/通信车/发电车/人员），组件无需再排；区域屏 004-04 复用本组件时换 areaPrepositionResourceList
- NoStylePanel 1998×158（占位壳原尺寸），title「应急资源」；类名语义化改写：`bottom-indicators---root`→`emergency-resource--root`、`ind-*`→`resource-item--*`（用户 2026-10-10 要求优化，纯改名零样式改动）；widgets 注册 left 920 / top 1558 不动
- 由子代理执行迁移，主会话已核对产物

样式调整记录（用户手动调整，2026-10-10）：

- 卡片 234×78 → 438×156；icon 区宽 87→175px（加 flex-shrink: 0），img 50×50 → 104×104
- 标题字号 20px → 40px；数值 30px → 60px；单位 16px → 32px
- 标题/数值 text-align 由 right 改 center

### 重保区域业务（area-business）迁移方案【已实施 2026-10-10，样式已定稿】

用户 2026-10-10 定案：**不复刻信管局 wireless-scale / line-scale UI，自写静态 UI**；接口属 004-00 二-2（单独接口，服务端待开发），本卡零自造 API、不写 mock、不动 section-right.ts。

- UI 结构：8 行两层——2G/4G/5G 各为「基站行（基站数/退服数）+ 小区子行（总数/退服数）」，通感站（基站数/退服数，无子行），重保专线（专线数/中断数，无子行）；子行缩进 + CSS 连接线（|----）
- 数据结构：组件内静态常量，树形 `{ key, name, metrics: [{value, label}], children }`；每行渲染名称 + metrics 右对齐（值 DIN 字体）
- 接口预留：将来服务端返回平铺数组（形态待定），前端补一层转换函数映射到上述 UI 结构（字段名不自造，接口形态定后再写）
- PanelRight 744×1564（占位壳原尺寸）保持，widgets left 2970 / top 362 不动；类名 `area-business--root` 语义化

### 风险

- ~~emap-gis 深圳地市底图能力~~（已核实：center-map 用 EChartsMap/echarts geo，与 emap-gis 无关，风险项删除）
- EChartsMap 深圳市粒度 geojson 可用性（adcode 440300）

## 变更记录

| 日期       | 变更                                                                                                                                                                         | 原因                                               | 是否重新过硬门槛①                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| 2026-10-09 | 从原 004 迁移卡拆出为 004-03                                                                                                                                                 | 用户要求任务拆小                                   | 是                                                                |
| 2026-10-09 | 漂移修正：漫入TOP5 从"指标改映射"改为静态占位（信管局无此接口，属 004-00 二-1）；验收去掉 pnpm lint（用户不跑）；明确目标目录 communication-service                          | 对照 004-01 代码现状与设计文档 data-model 核实     | 否（卡仍待审批，修正后一并审）                                    |
| 2026-10-09 | 新增步骤 6：home-background（迁 home/home-bg 首屏背景层）                                                                                                                    | 用户要求                                           | 否（卡仍待审批）                                                  |
| 2026-10-09 | 确立工作模式：每块组件「迁移→记录方案→用户调样式→OK 后下一块」；每块先写方案再动代码                                                                                         | 用户要求                                           | 否（节奏约定，不改功能范围）                                      |
| 2026-10-09 | center-map 方案修正：删除 emap-gis spike 表述（源实现实为 EChartsMap/echarts geo + adcode）；方案初稿写入待确认                                                              | 用户指出「地图和 gis 没有半毛钱关系」，读源码核实  | 否                                                                |
| 2026-10-10 | top-type-filter 迁移完成：3 文件物理复制 + 深圳屏 getTopIndicatorsApi 接入；图标按用户确认走临时映射（脚本 `2026-10-10-copy-top-type-filter-assets.js`），待 UI 图标原位替换 | 用户确认「先完成逻辑，图标后补」                   | 否（不改功能范围）                                                |
| 2026-10-10 | center-map 纯静态迁移完成（adcode 440300 + 类型色 circle 打点，无图例/TOOLTIP/点击，图标后补）；TOOLTIP/切屏/轮巡联动全部留 005                                              | 用户确认「纯静态先迁移、图标后补、无图例」         | 否（不改功能范围）                                                |
| 2026-10-10 | top-type-filter、center-map 样式定稿（用户确认 OK）；两方案标题同步「样式已定稿」                                                                                            | 用户验收                                           | 否（不改功能范围）                                                |
| 2026-10-10 | communication-service 样式定稿（用户确认 OK）；任务卡状态同步                                                                                                                | 用户验收                                           | 否（不改功能范围）                                                |
| 2026-10-10 | emergency-resource 迁移源改定：open-and-close/support-resource → home/bottom-indicators（接口原配 UI，数据结构零适配），用户批准后子代理完成迁移                             | 读源发现 support-resource 分组结构与已迁接口不匹配 | 是（迁移源变更，已重新过硬门槛①：用户批准改迁 bottom-indicators） |
| 2026-10-10 | emergency-resource 类名语义化（bottom-indicators---root/ind-* → emergency-resource--root/resource-item--*）+ 用户手动调整样式后定稿（用户确认 OK）                           | 用户要求优化类名 + 用户验收                        | 否（不改功能范围）                                                |
| 2026-10-10 | area-business 方案改定：不迁 wireless-scale / line-scale，自写静态 UI（8 行两层结构 + 树形常量数据，接口属 004-00 二-2 待开发，零自造 API）                                  | 用户定案「UI 也不复刻，只做静态 UI，等接口」       | 是（迁移源变更，已重新过硬门槛①：用户批准自写静态 UI）            |
| 2026-10-10 | area-business 实施与样式迭代（值/label 上下结构、去斜线、ind-bg-group/single 背景、用户手动调整样式）后定稿（用户确认 OK）                                                   | 用户验收                                           | 否（不改功能范围）                                                |

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-09 | 用户   |
| ② 实现验收 | 已验收 | 2026-10-10 | 用户   |

---

## 关联

> - 原卡：task-2026-10-09-004-shenzhen-communication-guarantee-migrate（已拆分删除）
> - 前置：004-01（接口层）、004-02（模块框样式）；后续：004-04（区域屏组件）
> - 设计文档：`design/modules/shenzhen-communication-guarantee/`
