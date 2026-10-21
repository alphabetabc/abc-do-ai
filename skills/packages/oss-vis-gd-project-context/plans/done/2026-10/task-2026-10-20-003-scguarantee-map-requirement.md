# Task · 2026-10-20-003-scguarantee-map-requirement

> 源需求：`docs/specs/shenzhen-communication-guarantee/pm-inputs/assets/20261020/反拉终端---2026年10月20日.md` 第 5 点（地图）
> 现状模块：[center-map](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/center-map/index.tsx)（含 [map.ts](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/center-map/map.ts)、[ActiveOverlayItem.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/center-map/ActiveOverlayItem.tsx)）
>
> **2026-10-21 拆分**：本卡缩小为**地图交互骨架**（重保白名单配置 + F5/F6 联动逻辑，改造点 1–8）；视觉类 F1（亮度）/F2（图片展示样式）/F3（区县划分）/F4（tip 尺寸）拆至 `task-2026-10-21-004-scguarantee-map-visual`（等 UI 设计稿后推进）。

## 任务元信息

| 项       | 值                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 编号     | `task-2026-10-20-003-scguarantee-map-requirement`                                                      |
| Status   | 已完成                                                                                                 |
| 类型     | 编码                                                                                                   |
| 影响范围 | center-map 模块（map.ts/index.tsx）、top-type-filter（联动+选中态受控）、components/area-carousel（启停）、sub-pages/index.tsx（切屏重置）、home/modules/area-carousel（轮播对象过滤） |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                                   |
| 验收标准 | 见下方 checklist（A5–A7 + lint）                                                                       |
| 前置依赖 | 无（intId 权威值可先以 mock 4 条占位，联调时替换）                                                     |

## 目标（Goal）

实现首屏中心地图的**交互骨架**：重保区域 ID 白名单（intId + environment 配置化）+ 地图两层结构（重保常显层 / 可过滤普通层）+ 与顶部类型过滤的完整联动（初始态/过滤态、轮播启停、下钻、返回重置）。视觉类调整（亮度/图片样式/区县/tip 尺寸）不在本卡范围。

## 需求原文（待澄清的结构化）

1. 亮度增加——整张屏
2. 图片同时呈现国交会场、前海会场、机场、会展中心——固定显示
3. 增加区县划分，区县名字和地图增加区分度
4. 现在的轮询也保留，但是图片太大，后面不要遮挡重保区域
5. 或者 4 个重保区域用图片轮询，其它的用个图标——待定
6. 4 个重保区域不参与与顶端的类型过滤

> 备注：待确认 4 个重保区域是哪四个（当前按国交会场/前海会场/机场/会展中心理解）

## 功能列表（本卡范围：F5/F6 + 白名单配置）

- F2' 重保白名单配置（仅 ID 配置与数据分层，**不含图片展示样式**——样式属视觉卡）：intId 数组走 environment，数量即 "x"，可扩展（如"大湾区"）
- F5 4 个重保区域打点不参与顶部类型过滤（基于 F2' 的 ID 白名单豁免）
- F6 地图与顶部类型指标的联动（2026-10-21 用户裁决，逻辑定稿）：
    - 地图默认且永远呈现 x 个重保区域（常显层，任何情况下不被过滤、不消失）；顶部过滤只作用于普通点位（区域总数 − x 个重保）
    - **未选中任何类型（初始态）**：地图仅显示 x 个重保区域，普通点位完全不显示；不轮播，仅响应用户手动点击
    - **选中某个类型（过滤态）**：地图显示 x 个重保区域 + 该类型过滤后的普通点位，开始轮播普通点位的 tip（tip 内容样式待 UI 设计）
    - 点击重保点位或轮播 tip → 下钻进入重保区域页面（复用现有下钻逻辑）
    - 从重保区域页面返回地图后：不保留过滤选中状态，回到初始态（仅 x 个、不轮播）

## 业务规则（联动逻辑，2026-10-21 用户裁决）

- 地图内容分两层：**重保区域常显层**（x 个，配置化 ID，不受顶部过滤影响）+ **可过滤打点层**（普通点位 = 区域总数 − x，受顶部类型过滤驱动；未过滤时不显示）
- 轮播启停由顶部类型选中状态驱动：未选中 → 不轮播；选中 → 普通点位轮播 tip
- 下钻 = 点击进入重保区域页面，复用现有逻辑（重保点位与 tip 均可触发）
- 返回地图不保留过滤选中状态，重置为初始态
- "x" 为重保区域点位数量（数量不重要，配置化），随 F2 的 ID 配置扩展（如"大湾区"）
- 本节为交互逻辑结论；具体视觉呈现（点位样式、tip 内容/尺寸/位置等）等 UI 设计稿定稿后再实现

## 不做清单（拆分至 `task-2026-10-21-004-scguarantee-map-visual`）

- F1 整屏亮度提升
- F2 视觉部分：重保区域图片展示样式/素材替换（本卡只做 ID 配置与数据分层）
- F3 区县划分 + 区县名标注（数据来源待定）
- F4 tip/轮巡大图尺寸与遮挡问题（等 UI 设计稿）
- 4 个 intId 权威值的最终确认与替换（联调阶段处理，本卡以 mock 4 条占位）

## 开放问题（本卡视角）

| #   | 问题                                                                                                                       | 负责人 | 状态   | 结论                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 4 个重保区域图片素材（国交会场/前海会场/机场/会展中心）——尺寸、来源、是否沿用现有 stadium-images 机制？                    | PM     | 开放   | **涉及图片替换，存在加入"大湾区"点位的可能，素材按可扩展设计**（2026-10-20 用户反馈）。**白名单键已定：intId**（2026-10-21 用户确认，与轮巡接口 areaId 同套 ID 体系可复用；mock 中 type=会场 4 条为 HC_QH_001/002/003+HC_FT_001，与"国交会场/前海会场/机场/会展中心"映射不符，**具体 4 个 intId 值仍待 PM/后端确认**） |                                                                                                                                                                      |
| 2   | 需求原文"或者 4 个重保区域用图片轮询，其它的用个图标"标注**待定**——最终采用固定显示（方案 A）还是图片轮询+图标（方案 B）？ | PM     | 开放   | **固定显示的 4 个点位 ID 必须做成配置**；固定展示的具体样式（方案 A/B 的视觉呈现）等 UI 设计（2026-10-20 用户反馈）                                                                                                                                         |
| 3   | 区县划分：是 ECharts map 下钻区县图层还是叠加 GeoJSON？区县名称标注样式（字号/颜色）？素材/边界数据从哪来？                | 待定   | 开放   |                                                                                                                                                                                                                                                             |
| 4   | "整屏亮度增加"具体幅度——CSS filter/底图换亮版？是否影响打点/浮层可读性？                                                   | 待定   | 开放   |                                                                                                                                                                                                                                                             |
| 5   | 4 个重保区域不参与类型过滤——通过什么标识区分（区域 ID 白名单 / 类型码新增）？轮巡广播（activeArea）对这 4 个区域的行为？   | 用户   | 已关闭 | **通过区域 ID 配置（白名单）区分**（与问题 2 的 ID 配置一致）；轮播行为：未选中类型不轮播且普通点位不显示、选中类型才轮播，地图始终显示 x 个重保区域 + 过滤结果；点击重保点位/tip 下钻（复用现有），返回不保留过滤态（2026-10-21 用户裁决，见 F6/业务规则） |
| 6   | 轮巡大图"不遮挡重保区域"——是缩小图片、偏移位置还是降低层级？                                                               | 待定   | 开放   | **当前地图上 tip 尺寸过大，按 UI 优化设计还原**（具体方案等 UI）；注意：区域轮播 activeArea 直接驱动地图 tip 浮层（ActiveOverlayItem 标题+缩略图），tip 调整需与轮播链路联动评估                                                                            |

## 技术调研（实现方案，2026-10-21 只读调研，待 review）

**结论：可行，无架构阻塞**。联动骨架全部现成（areaTypeFilter/activeArea 广播、seriesBuilder 过滤、AreaCarousel 定时器、switchViewByArea 下钻切屏），改造集中在组件层。

### 现状链路

- 打点数据 `getHomeAreaPointApi`（services `home/center.ts`）：每行有稳定 `intId`（映射 `id`）、`type`（汉字类型）；与区域轮巡接口 `getMapAreaLayerApi` 的 `areaId` 同套 ID 体系 → **ID 白名单可跨接口复用**
- 顶部过滤：top-type-filter `dispatch(areaTypeFilter, type)`（null=全部），**纯组件层过滤**；地图消费在 center-map/index.tsx `seriesBuilder`（79-81 行，按类型滤 series）与 `overlayInfo`（57-62 行，类型不匹配隐藏 tip）
- 轮播链路：`components/area-carousel/index.tsx` `useIntervalTimer`（110-119 行，hover 暂停）→ dispatch(activeArea) → center-map `overlayInfo` → tip（ActiveOverlayItem）
- 下钻：**唯一入口是 tip 点击** `onActiveOverlayItemClick`（138-140 行）→ `switchViewByArea`（sub-pages/index.tsx 44-47 行）切到区域屏；打点 series 目前 `silent: true`（125 行），无打点点击
- 屏间切换同路由、Home 不卸载（只切 opacity/zIndex）→ 切屏返回后 store 中 areaTypeFilter 与 ScaleItemCard 本地 activeType 原样保留

### 改造点清单（组件层，8 处）

| #   | 文件（web/pages/shenzhen-communication-guarantee/）          | 位置                                             | 改动                                                                                                        |
| --- | ------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | `sub-pages/home/modules/center-map/map.ts`                   | mapPointTypes / 新常量                           | 读取重保 ID 白名单（intId 数组，走 environment，见下方「白名单配置设计」）                                 |
| 2   | `sub-pages/home/modules/center-map/index.tsx`                | seriesBuilder 73-132                             | 拆两层 series：重保常显层（不受 areaTypeFilter 影响）+ 普通层（**null=隐藏**，反转现"null=全显"逻辑）       |
| 3   | 同上                                                         | overlayInfo 45-71                                | 初始态不显示普通点位 tip；重保 tip 豁免类型过滤                                                             |
| 4   | 同上                                                         | onActiveOverlayItemClick 138 / series silent 125 | 重保点位点击下钻：开启重保层点击 + 绑定 ECharts 事件（依赖待确认，见风险 2）                                |
| 5   | `sub-pages/components/area-carousel/index.tsx`               | 定时器 110-119                                   | 增加启停 prop（由 `areaTypeFilter != null` 驱动，未过滤不轮播）；**组件为两屏共用**，需保证区域屏行为不回归 |
| 6   | `sub-pages/home/modules/area-carousel/index.tsx`             | filteredData 29-35                               | 过滤态轮播对象调整为过滤后的普通点位（白名单豁免/叠加，与地图层逻辑一致）                                   |
| 7   | `sub-pages/index.tsx`                                        | switchViewByArea 44-47                           | 切屏时重置 areaTypeFilter + activeArea（返回初始态）                                                        |
| 8   | `sub-pages/home/modules/top-type-filter/scale-item-card.tsx` | activeType state 10                              | 选中态受控化（由 store 回读），支持外部重置，避免"数据重置但 UI 高亮残留"                                   |

### 风险 / 待确认

1. **数据无"重保"标识字段**（最重要）：白名单 ID 集合（intId 值或 userlabel 前缀）必须由 PM/后端确认，mock 无法验证（mock 中 `type: "会场"` 仅 4 条，HC_* 前缀疑似）
2. EChartsMap 封装（`web/components/ui/rc-echarts/map`）未读取：打点点击事件是否可透传不确定，影响改造点 4；即使不支持，可走 tip 点击或自绘 overlay 兜底
3. `createLargeScreen` store（`web/components/large-screen`）未读取：能否在 sub-pages 层直接 dispatch 重置待确认；不行则改在 home 模块内监听 visible 变化重置
4. ScaleItemCard 本地选中态与 store 双源，重置时 UI 高亮可能残留（改造点 8 处理）
5. AreaCarousel 两屏共用，改启停逻辑需回归验证区域屏

### 白名单配置设计（2026-10-21 用户裁决：intId + environment）

- **配置键**：`shenzhen-communication-guarantee.homeConfig.centerMap.importantAreaIds`（与既有 `homeConfig.areaCarousel.interval` 同模式）
- **配置值**：intId 字符串数组，如 `["1460194794", "100", ...]`（数量即 "x"，后续可加"大湾区"，纯配置扩展无需改码）
- **读取方式**：组件/模块层 `getEnvironment(key)`，**回退默认值**（源码内置默认 4 个 intId，参照 services/home/center.ts 的 staticData 回退先例）——env 未下发时屏可用
- **白名单键定 intId**（用户确认）：与区域轮巡接口 `getMapAreaLayerApi` 的 areaId 同套 ID 体系，地图打点层与轮播层可共用同一份白名单判断
- **待定**：默认值中 4 个 intId 具体取值——mock 的 `type: 会场` 4 条（HC_QH_001/002/003、HC_FT_001）与"国交会场/前海会场/机场/会展中心"映射不符，需 PM/后端给出权威 intId → 国交会场/前海会场/机场/会展中心 映射后再填默认值（实现时可先以 mock 4 条占位自测，联调时替换）

## 步骤（执行计划）

### 步骤 1：需求审批（硬门槛①，本卡已具备提交条件）

- **动作**：批准拆分后的任务卡（交互骨架范围，见功能列表/不做清单）
- **等待用户**：是
- 说明：原"需求澄清"步骤中与交互逻辑相关的开放问题（问题 5 等）已关闭；视觉类问题随拆分移至 004 卡

### 步骤 2：实现

- **动作**：按改造点 1–8 编码（白名单 environment 读取 + 回退默认值 → seriesBuilder 两层 → overlayInfo → 下钻点击 → 轮播启停 → 切屏重置 → ScaleItemCard 受控化）
- **等待用户**：否

### 步骤 3：验证 + 回填

- **动作**：本地验证（初始态/过滤态/轮播启停/下钻/返回重置，A5–A7）+ 文档回填 + 联调时替换 intId 权威值
- **等待用户**：是（硬门槛②）

## 验收 checklist

- [x] A5：顶部类型过滤任意选中时，x 个重保区域打点仍显示（地图显示 x + 过滤结果）
- [x] A6：顶部未选中任何类型时，地图仅显示 x 个重保区域且不轮播（普通点位不显示）；选中类型后显示过滤结果并轮播 tip
- [x] A7：点击重保点位或轮播 tip 可下钻进入重保区域页面；返回地图后过滤状态重置为初始态（含 ScaleItemCard 高亮重置）
- [x] A8：白名单可经 environment 下发覆盖（2026-10-21 用户调整为**纯 env 无源码默认值**，未配置时全量显示）；调整 intId 数组即增减重保点位（配置化验证）
- [x] A9：区域屏（area sub-page）的 AreaCarousel 行为不回归（`autoplay` prop 默认 true）
- [x] `pnpm lint` 跳过（用户裁决 2026-10-21：不需要 lint，改为子代理逻辑 review，已通过）

## 审批记录

| 门槛       | 状态 | 日期       | 批准人 |
| ---------- | ---- | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-21 | 用户 |
| ② 实现验收 | 已验收 | 2026-10-21 | 用户（确认 F1/F3 等视觉项亦已落地，见 004 卡） |

## 实现记录（2026-10-21）

按改造点 1–8 完成，子代理逻辑 review 通过后修正 1 项（初始态 auto 广播拦截）。关键实现：

- **白名单**（改造点 1，2026-10-21 用户调整）：**纯 environment 配置、无源码默认值**——`map.ts` 仅导出 `isKeyArea(item, ids?)`（按 `String(item.id)` 匹配，打点/轮巡两接口共用；**ids 为空/未配置时返回 true，即全量显示、不做重保划分**）；配置键 `shenzhen-communication-guarantee.homeConfig.centerMap.importantAreaIds`（environment-local.json 已配 4 个 intId，用户确认 2026-10-21：HC_FT_001 国交会场 100 / HC_QH_001 前海会场 1460194794 / JT_BA_001 深圳机场 1134568079 / CC1 市民中心 -798315596）
- **两层 series**（改造点 2）：seriesBuilder 拆重保常显层（不受过滤）+ 普通层（`filter === item.name` 才出，null 语义反转为隐藏）
- **overlayInfo**（改造点 3）：重保命中豁免过滤直接返回；普通点位初始态返回 null，过滤态按类型匹配
- **下钻点击**（改造点 4）：series `silent: false` + EChartsMap `useRawEvent` 透传原生点击，`onMapPointClick` 中仅重保点位（`params.data.__rawData`）触发 `switchViewByArea`（风险 2 已消除：useRawEvent 支持 series 点击透传）
- **轮播启停**（改造点 5）：共用 AreaCarousel 新增 `autoplay` prop（默认 true，区域屏不回归）；false 时不启动定时器、hover 恢复也不启动
- **轮播对象**（改造点 6，2026-10-21 用户调整）：**轮播列表不参与重保白名单**，filteredData 恢复 005 原有类型过滤；仅保留 `autoplay={!!areaTypeFilter}` 启停控制与初始态 auto 广播拦截
- **切屏重置**（改造点 7）：收在 top-type-filter 模块内（风险 3 方案 B）：`useEffect` 监听容器 `visible=false` 时 `dispatch(areaTypeFilter, null)`（风险 3 已消除：sub-pages 层无 store 句柄，模块内监听 visible 可行）
- **受控高亮**（改造点 8）：ScaleItemCard 新增 `value` prop 受控化；顶部类型统计 widget 注册 `subscribe: areaTypeFilter` 回读
- **review 修正**：初始态 AreaCarousel 数据初始化的 auto 广播会致未点击即显示重保 tip，已在首屏 onChange 拦截（`!areaTypeFilter && info.type !== 'click'` 不透传）

### review 遗留（非阻断，待产品/UI 确认）

- 重保 tip 标题显示区域编码（如 HC_QH_001）而非中文名——沿用既有字段映射（name=userlabel），重保常显后持续可见，建议与 PM 确认展示名
- hover 期间切换类型（autoplay false→true）会立即开始轮播，绕过 hover 暂停（轻微体验问题）
- 15 分钟轮询刷新 data 会重置轮播 index 并重新广播（既有行为）

### 后续迭代记录（2026-10-21 验收阶段随改随记，均属本卡交互骨架 + 004 视觉范围）

- **重保/普通图标分层**：`mapPointTypes` 每类新增 `iconKeyAreaUrl`（重保 `icon-map-key-area.png`，用户 2026-10-21 后又改回 .svg 再定稿 .png，以工作区为准）与 `iconUrl`（普通 `icon-map-normal-green.svg`）；seriesBuilder 抽出 `buildScatterSeries` 公共构造，重保层 seriesId `${type}-key`、普通层 `${type}-normal`
- **图标尺寸**：重保 64×52、普通 46×68（`symbolSize` 宽高数组 + `symbolOffset [0,0]` 中心锚定）；激活态不放大（用户裁决），激活仅 zlevel +10 置顶
- **层级**：重保层 `zBase: 1000`，保证永远在普通点位之上；引导线 zlevel 999
- **重保 tip 常显**：新增 `keyAreaOverlayList` 全量渲染重保 tip（`keyArea` prop → 黄色样式），不参与轮播；轮播 `overlayInfo` 命中重保时返回 null（避免同点位双 tip）
- **tip 外移 + 引导线**：重保 tip 可配置外移到指定经纬度，echarts 追加 `lines` series（`polyline: true` 横平竖直折线）从点位引到 tip 位置，颜色 `rgba(255, 242, 204, 1)`；4 个重保区均已配置
- **配置合并到 env（用户裁决 2026-10-21）**：源码 `keyAreaTipPositionOverrides` 删除，env `centerMap` 节点扩展为 `{ importantAreaIds, importantAreaIndicatorLines }`，后者 key 为 intId，值含 `name / longitude / latitude / waypoints[]`；index.tsx 整取 `homeConfig.centerMap` 解构消费，`?? {}` 兜底
- **引导线宽度**：当前工作区为 `width: 3`（index.tsx，用户后续微调，非 2）
- 普通轮播 tip `tipBottom` 30（原 70，随视觉微调）

## 变更记录

| 日期       | 变更                                                                 |
| ---------- | -------------------------------------------------------------------- |
| 2026-10-21 | 用户批准（硬门槛①通过）；实现改造点 1–8 + 子代理逻辑 review 通过 + 1 项修正（见实现记录）；白名单默认值为 mock 占位 intId，联调时待 PM/后端确认权威映射 |
| 2026-10-21 | 拆分：视觉类 F1–F4 移至 task-2026-10-21-004-scguarantee-map-visual；本卡聚焦交互骨架（白名单 + F5/F6），Status 转「待审批」 |
| 2026-10-21 | 基线更新：用户先行调整地图视觉（geo 布局/label 关闭/去 map-bg 背景/素材替换，见 004 卡「现状变更」）；本卡改造点行号引用以当前工作区为准（seriesBuilder 73-132、overlayInfo 45-71、silent 125、tip 点击 138-140 未受影响） |
| 2026-10-21 | tip 视觉同步（属 004 卡范围，随改随记）：① 修复 tip 图片溢出——原 `.scg-map-info--overlay-image` 200×127 边框外扩压到标题栏，用户重做样式（尺寸 207×179 固定、padding-top 8px、图片窗口 200×127、背景换 icon-map-normal-tip-green.svg）；② 新增重保黄色 tip 素材 icon-map-key-area-tip-yellow.svg（与绿色同尺寸 206×179.79），ActiveOverlayItem 新增 `keyArea` prop → `scg-map-info--overlay--key-area` 修饰类切换背景（调用处 index.tsx 尚未传入，默认绿色，待接白名单判定 `isKeyArea(overlayInfo.__rawItem, keyAreaIds)`） |
| 2026-10-21 | 验收阶段迭代（详见「后续迭代记录」）：重保/普通图标与尺寸分层（64×52 / 46×68）、激活不放大、重保 zlevel 1000 置顶、重保 tip 常显不参与轮播、tip 外移 + 横平竖直引导线、全部配置合并至 env `centerMap`（importantAreaIds + importantAreaIndicatorLines）；用户宣告「地图相关能力已完成」，文档同步任务卡 + design/modules |
| 2026-10-21 | 验收关闭：checklist A5–A9 全勾、硬门槛②已验收（用户确认）；视觉类 F1–F4 结论见 004 卡；Status → 已完成 |
