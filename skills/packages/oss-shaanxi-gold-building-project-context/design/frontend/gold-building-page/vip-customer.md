# 要客可视化（/gold-building 地球）· 需求与契约

> 提炼自 docs/specs/003-vip-customer（2026-11-05 全量提炼；该 spec 目录后续不再维护，本文为延续权威）。
> 代码现状见 `page-code.md`；mock 细节见 `page-code.md` §4。

## 1. 背景与范围

在 `/gold-building` 三维地球上新增政企要客可视化：图层打点、名称模糊搜索定位、关联资源（8 类设备打点 + 楼外光缆段连线）、右上角履历卡。

- 要客范围口径（严格 AND）：`industry_cust_type=2`（直管要客-分支）AND `cust_direct_type ∈ {5 总部直管139 / 6 总部协同139 / 7 省级直管 / 8 地市直管}`。
- 2D/3D 底图切换本期不做（仅预留）。
- 当前状态：前端原型已全部实现但基于 Mock（开关 `USE_YAOKE_MOCK`，默认 false 走真实接口、联调置 true）；真实接口接入待排期。

## 2. 功能清单

- **M1 图层控制**：LeftTree「要客」节点下 4 勾选项（默认全选）；勾选按经纬度打点；勾选任一子项隐藏 3D 白膜，全部取消恢复；与商务楼宇同点位时打在楼顶（YaoKeHeightOffset=65）；图例含「要客」项。
- **M2 搜索与三级定位**：搜索框扩展要客名称模糊搜索（下拉平铺、仅命中已勾选类别）。三级定位：① 客户标准地址 ↔ 商务楼宇标准地址标识匹配→按金牌楼宇定位；② 按要客经纬度 GIS 定位；③ 提示「无可用的资源，无法定位」；无经纬度提示「无可用GIS资源，无法定位」。
- **M3 点选与关联资源**：要客图标显示名称；点选后关联资源按类型打点（8 类）或画连线（楼外光缆段）。物业面围栏渲染**未实现**（待数据源）。
- **M4 关联资源图例**：右下角交互式图例（EarthLegend interactive）；8 类勾选显隐 + 全部开关 + 每类计数 + 点选设备显示完整返回字段；楼外光缆段并入「光缆段」；默认全勾。8 类顺序固定：光交接箱、光分纤箱、POS设备、光缆段、PTN设备、SPN设备、OTN设备、OLT设备。
- **M5 履历卡**：右上角，标题=要客名称+客户类型副标题，「要客详情」（9 字段，见 §3.2）+「关联资源」（数量徽标、banner「共 N 条涵盖 8 类」、8 类行展开 `*_NAME` 管道符串解析）两 Tab + 关闭按钮。
- **M7 楼外光缆段**：`TRANS_WIRE_SEG` 不打点；收集去重 CUID 一次性查 ArcGIS layer 23 取 `geometry.paths` 画折线（青色 `#00E5FF`、宽 3、抬高 100m）；悬停显示 `LABEL_CN` tip 且跟随鼠标；图例并入「光缆段」。

## 3. 数据模型与 API 契约

### 3.1 要客列表/搜索/详情

前端经 BFF：`GET /goldBuilding/gisDataApi/vip-resume?cuid=...`；BFF 经 `buildingGisAxios` 转发下游 `power/rest/AdhesiveMobileAction/queryForPage`，`bmClassId=T_CRM_CUSTOMER_DETAIL`，固定 `userId=admin`，透传 `pageNum/pageSize/params`；过滤走 `params`（数组内嵌 JSON 串，EQ，搜索预计 LIKE）。一个端点四种用法：列表（CUID/LONGITUDE/LATITUDE/CUST_DIRECT_TYPE）、名称搜索（CUSTOM_NAME LIKE）、详情（按 CUID EQ）。

响应信封：`{count, errorDesc, recordInfoList[], success}`；每字段 `{labelCn, relatedBmClassId, value}`，取值看 `labelCn`（null 为空）。

### 3.2 要客字段（Mock docx 命名 ↔ 真实 attrId 对照）

| Mock 键 | 真实 attrId | 中文 |
| --- | --- | --- |
| CUID | CUID | 主键 |
| VIP_NAME | CUSTOM_NAME | 客户名称 |
| CUSTOMER_TYPE | INDUSTRY_CUST_TYPE | 政企客户类型 |
| STANDARD_ADDRESS | CUSTOM_ADD | 客户标准地址 |
| VIP_LEVEL_1 | STRATEGIC_CUST_TYPE_FL | 要客类型一级标签 |
| VIP_LEVEL_2 | STRATEGIC_CUST_TYPE_SL | 要客类型二级标签 |
| PLACE_TYPE | CLUSTERING_SCENARIO | 场所类别 |
| CLUST_SCEN_TYPE_TWO | CLUST_SCEN_TYPE_TWO | 细分客群类别 |
| CUST_GROUP_FEATURE | CUST_GROUP_FEATURE | 客群特征 |
| CUST_DIRECT_TYPE | CUST_DIRECT_TYPE | 集团客户直属类别 |
| geometry.x/y | LONGITUDE / LATITUDE | 经纬度 |

枚举：`industry_cust_type`：0 商客 / 1 直管要客-根节点 / **2 直管要客-分支（唯一纳入）** / 3 非总部直管要客。`cust_direct_type`（多选逗号分隔）：0 其他 / 1-4 集团级139各类型 / 5 总部直管139 / 6 总部协同139 / 7 省级直管 / 8 地市直管 / 9 区县直管。`clust_scen_type_two` 01-12（零售…宠物服务）；`cust_group_feature` 01-05（多选）。

### 3.3 关联资源打点

前端经 BFF：`GET /goldBuilding/gisDataApi/vip-resource?cuid=...`；BFF 转发下游 `queryForPage`，`bmClassId=T_CRM_CUSTOMER_RESOURCE`、`attrId=CUSTOMER_CUID`、`pageSize=100`。

字段：`CUSTOMER_CUID / RESOURCE_CUID / RESOURCE_NAME / RESOURCE_TYPE / LONGITUDE / LATITUDE / LIFE_CYCLE_STATE / REGION / ADDRESS`。前端归一化 `normalizeVipDevices` → `[{id, name, deviceType, longitude, latitude, raw}]`。

资源类型 9 类（YaoKeDeviceTypeList）：光交接箱 `TRANS_FIBER_CAB`、光分纤箱 `TRANS_FIBER_DP`、POS `AN_POS`、光缆段 `INTER_WIRE_SEG`、楼外光缆段 `TRANS_WIRE_SEG`（无图标不打点）、`PTN`、`SPN`、`OTN`、`T_LOGIC_DEVICE_OLT`。图标 `M2_FIBER_CAB.png / M2_FIBER_DP.png / POS_TAG.png / SEG.png / PTN.png / SPN.png / OTN.png / OLT.png`，部署 `public/static/images/`，登记于通用层 presets.ts 的 `YaoKeDeviceIconMap`。

### 3.4 履历卡关联资源（真实目标形态）

同一详情响应内联 8 类，每类一对字段：`FIBER_CAB_COUNT/FIBER_CAB_NAME`、`FIBER_DP_*`、`AN_POS_*`、`WIRE_SEG_*`、`PTN_*`、`SPN_*`、`OTN_*`、`OLT_*`。`*_COUNT` 为字符串数字；`*_NAME` 为管道符 `|` 分隔串。

展开明细列（docx 口径）：光交接箱/光分纤箱=名称|归属区域|生命周期状态；POS=名称|归属区域|端口总数|可用端口总数；光缆段=上级对象名称|光缆段名称|所属区域|纤芯数|可用纤芯数；PTN/OTN/SPN=名称|归属区域|端口总数；OLT=名称|归属区域|下联端口总数。

### 3.5 楼外光缆段 ArcGIS 查询

前端经 BFF：`GET /goldBuilding/gisDataApi/trans-wire-seg?cuids=...&keyCode=...`；BFF 构造 `where=CUID IN('...')` 转发 ArcGIS：`{host}/gisserver/arcgis/rest/services/zongzi/guanxian_827_tckz/MapServer/23/query?outFields=*&inSr=4326&outSr=4326&where=...&returnGeometry=true&f=json&keyCode={keyCode}`（layer 23，Polyline，wkid 4326）。

返回 `{features:[{attributes:{CUID, LABEL_CN, LENGTH, ORIG_POINT_CUID, DEST_POINT_CUID, STATE, ...}, geometry:{paths:[[[lon,lat],...],...]}}]}`；每个 path 一条线。归一化 `normalizeTransWireSegLines` → `{id(=cuid-path-N), cuid, labelCn, positions}`；兼容 JSONP 字符串。

### 3.6 代码链路（spec 定稿映射）

| 环节 | 文件 | 职责 |
| --- | --- | --- |
| 点击与状态 | `web/pages/gold-building/render.tsx` | 点要客→调接口→存状态；`yaokeRequestSeqRef` 过期丢弃 |
| 接口与归一化 | `web/pages/gold-building/components/earth/api/index.ts` | getVipDevicesApi / normalizeVipDevices / getTransWireSegLinesApi / normalizeTransWireSegLines |
| 组装与图例 | `components/earth/index.tsx` | 设备/连线 chunk、图例计数与显隐（内联 deviceDetailFields） |
| 渲染挂载 | `web/components/earth/business-gold-building/EarthViewerGoldBuildingLoader.tsx` | deviceChunkDataSource / transWireSegChunkDataSource 通道 |
| 设备打点 | `web/components/earth/business-gold-building/components/EntityYaokeDevice.tsx` | Billboard 图标点位（无图标类型自动过滤） |
| 楼外连线 | `web/components/earth/business-gold-building/components/EntityTransWireSeg.tsx` | Polyline + 悬停 tip（白字 #fff、黑底 0.8、backgroundPadding(10,5)、scale 0.5、pixelOffset (0,-28)） |

## 4. 验收要点（摘要）

- M1：4 类勾选显隐、默认全选、勾选隐藏白膜且全取消恢复、同点打楼顶、范围外不显示。
- M2：模糊搜索、仅命中已勾选类别、三级定位逐级（含两条精确提示文案）。
- M3/M3.5：图标显示名称、8 类点位、点选要客→查设备→打点；图例含全部开关。
- M4：右下角、8 类顺序固定、计数、勾选显隐、取消「光缆段」连线一并隐藏、点选显示完整字段。
- M7：不打点只画线（青色宽3抬高100m）、多 CUID 多线、悬停 tip、切换要客不串数据。
- M5：右上角弹出、9 字段、关联资源 Tab、关闭按钮。
- 冻结项：楼宇/园区搜索定位不变、三维渲染、公开访问。
- 6 条统计规则与退网过滤由下游 RMS 完成，前端只做消费侧断言。

## 5. 遗留 / 开放问题（接真实接口时逐项核对）

- 要客列表/搜索切真实接口（范围过滤 + CUSTOM_NAME LIKE 的 params 表达待后端定稿）。
- 关联资源切真实接口（确认 buildingGisAxios 代理连通）。
- 字段名对齐：Mock docx 命名 → 真实 attrId，同步改 earth/index.tsx 内联 deviceDetailFields。
- 楼外光缆段切真实接口（layer 23 keyCode 与代理连通性；keyCode 硬编码为测试环境值）。
- 物业面围栏渲染（RELATED_PROPERTY_CUID → 物业面图层 + PolygonGraphics；rings 坐标串格式待后端）。
- 要客本体图标（红色图钉切图待 UI，现用默认图钉）。
- 楼内光缆段 INTER_WIRE_SEG 真实返回形态待确认（单点 vs 线坐标）。
- 履历卡 M5 前端任务（弹出/两 Tab/展开解析/关闭）在 spec tasks 未勾，但代码已实现（以 page-code.md §2.8 为准）。
- 坐标系（WGS84/CGCS2000）待确认；分页参数形式（数组 `["1"]` vs 裸值）待确认；SPN title 颠倒待后端追认；下游前缀 `/rms` vs `/power` 差异已由 BFF 封装缓解；3D 白膜 sceneServerUrl 是否启用待定；连线 tip 是否补 LENGTH/起止点 CUID 待定。
- 测试全未做（单元/合同/E2E/冻结回归）。
