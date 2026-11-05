# 金楼页面代码盘点（web/pages/gold-building）

> 证据日期：2026-11-05，行号均来自当日逐文件实读。
> 配套：`index.md`（本目录索引）、`design/frontend/earth/business-layer.md`（通用地球组件）。

## 1. 页面整体结构

### 入口三件套

- `web/pages/gold-building/fetch.ts`：SSR fetch 钩子，空实现，无数据预取。
- `web/pages/gold-building/api.ts`：`getDemoData()`（POST `/goldBuilding/test/list`），**无组件引用**，遗留演示代码。
- `web/pages/gold-building/render.tsx`：真正入口，SSR 框架（`@fedx-bff-web/ssr-types`）+ React。

### 布局（index.less）

- `.page-gold-building-root`：全屏容器。
- `.right-container`：右侧信息卡挂载区，绝对定位 `top:20px; right:12px; z-index:20`（须高于图例 `.earth-legend z-index:10`），`pointer-events:none`（子组件自行开启）。
- `.page-gold-building-viewer-modal`：楼宇 3D 弹窗皮肤，主色深蓝 `rgb(6,97,131)`（全页统一主色）。

### 组件树（render.tsx L224-284）

```
Index (render.tsx)
├─ MapSearchMap                 顶部搜索栏（left:300px）
├─ EarthViewer                  页面级地球（页面级 components/earth/index.tsx，含两个 EarthLegend）
│   └─ EarthViewerGoldBuildingLoader（通用层 web/components/earth/business-gold-building/）
├─ LeftTree                     左侧图层控制树
├─ [条件渲染，挂 .right-container]
│   ├─ showLightExchangeBox   → LightExchangeBox(CUID)      园区点击→光交箱面板
│   ├─ showLightSplitterDetail→ LightSplitterDetail(CUID)   楼宇点击→分光器统计
│   └─ showVipResumeCard      → VipResumeCard(customerId,onClose) 要客点击→履历卡
└─ Modal(showBuildingModal)   → GoldBuildingViewer(buildingName,CUID,FLOOR_NUM) 楼宇双击→3D 弹窗
```

页面级状态（render.tsx L18-33，`useSetState`）：

- 四个互斥面板开关：`showLightExchangeBox / showLightSplitterDetail / showVipResumeCard / showBuildingModal`。
- `selectBuildingData`：当前点中的地图要素。
- 要客链路：`yaokeDevices / deviceTypeVisible / transWireSegLines / selectedDevice`。
- `searchBuildingData`（useState）：搜索定位值；`selectTreeNode`（useState）：图层树勾选 keys。
- `yaokeRequestSeqRef`（useRef，L33）：要客两段异步（设备→连线）的请求序号，过期响应丢弃。
- `isDebug = false`（L17）：为 true 时强制打开楼宇弹窗（L22-23 有 mock 楼宇数据）。

## 2. 组件明细

### 2.1 MapSearchMap（components/map-search-bar/）

- 顶部模糊搜索 + 下拉，DebounceSelect（antd Select + `debounce(loadOptions, 1000)`）。
- 输入请求 `getSearchDataApi({key, bmclassids:'SWLY,WYM,YK'})`；label 拼接：`s1==='WYM'` 时 `${r}-${n}-${s3}`，否则 `${r}-${n}-${s4}`；`value = CUID`。
- Props：`getSelectSearchData(value)`；onClear 回传 `''`。
- 样式：绝对定位 `left:300px; top:20px; z-index:666`。

### 2.2 LeftTree（components/left-tree/）

- 静态树（无接口）：`场景类型(all)` → `商务楼宇(businessBuilding)` → 金/银/铜牌（key `earth-gold_building / earth-silver_building / earth-copper_building`）、`园区(zone)`、`要客(earth-yaoke)` → 四子类 `earth-yaoke-hq_direct / earth-yaoke-hq_collab / earth-yaoke-province / earth-yaoke-city`。
- antd Tree checkable，`defaultExpandedKeys=['all','businessBuilding','earth-yaoke']`；onCheck 把 keys 数组回传 `getSelectTreeNode`。

### 2.3 页面级 EarthViewer（components/earth/index.tsx，464 行）

见 §4/§5。与通用层关系：页面级是「数据编排 + 业务状态」薄壳；渲染引擎（EarthStageRoot / 四类 Chunk 渲染器 / FlyToEntities / EarthLegend）在 `web/components/earth/business-gold-building/`，页面不直接碰 Cesium。

页面级补充给通用层的 props：`buildingChunkDataSource / zoneChunkDataSource`（图层树过滤后的 chunk）、`deviceChunkDataSource`（要客设备打点 chunk，L23-50 构建）、`transWireSegChunkDataSource`（连线 chunk，L54-74，显隐跟随「光缆段」INTER_WIRE_SEG）、`hideSceneServer={hasYaokeChecked}`（勾选要客时隐藏白膜场景服务，L444）。

通用层 presets.ts 关键常量：`DataSourceBuildingTypes`（zone/金银铜牌/other_building/earth-yaoke 四子类/earth-yaoke-device）、`YaoKeSubTypeIconMap`、`YaoKeHeightOffset=65`、`YaoKeSubTypeKeys`、`YaoKeDeviceTypeList`（9 类）、`YaoKeDeviceIconMap`（public/static/images 下 png）、`YaoKeDeviceHeightOffset=40`、`ModelAssetsList`（金银铜三档 glb）。

**注意两套资源枚举不能混用**：VipResumeCard 的 8 类 key（LIGHT_EXCHANGE_BOX/LIGHT_SPLITTER_BOX/POS/CABLE_SECTION/PTN/SPN/OTN/OLT）对应履历卡接口字段；`YaoKeDeviceTypeList` 的 9 类 key（TRANS_FIBER_CAB/TRANS_FIBER_DP/AN_POS/INTER_WIRE_SEG/TRANS_WIRE_SEG/PTN/SPN/OTN/T_LOGIC_DEVICE_OLT）对应 GIS 打点接口的 RESOURCE_TYPE。

### 2.4 LightExchangeBox（components/light-exchange-box/，园区光交箱面板）

- Props：`CUID`（园区 CUID），变化即重拉。
- 请求 `queryForPageData2({bmClassId:'T_GEO_PROPERTY_GWM', value:CUID})` → GET `/goldBuilding/gisDataApi/query-for-page-data2`。
- 响应 queryForPage 信封（字段形如 `{字段名:{labelCn, relatedBmClassId, value}}`），映射为上详情下列表两个 `CommonInfoListPanel`（来自 `web/components/info-list-panel-white/`）。
- 文件约 1010 行，其中 ~850 行是 isDebug 内联 mock；index.less 为空文件。

### 2.5 LightSplitterDetail（components/light-splitter-detail/，楼宇分光器统计）

- Props：`CUID`（楼宇 CUID）；请求 `{bmClassId:'T_COVERAGE_SCENE_AN_POS_STATIS', value:CUID}` → GET `/goldBuilding/gisDataApi/query-for-page-data3`。
- 首条记录映射固定 9+1 行：一级分光器数量 `ONE_POS_NUM`/端口 `ONE_POS_PORT_TOTAL`/占用 `ONE_POS_PORT_OCCUPY_TOTAL`/占用率 `ONE_OCCUPY_RATE`；二级同理（`TWO_*`）；标题 `LABEL_CN`。
- 命名遗留：文件内组件名/导出名仍叫 `LightExchangeBox`。

### 2.6 LightSplitter（components/light-splitter/，分光器详情）

纯展示 `CommonInfoLstPanel` 包装，Props `{data, title}`；api.ts / index.less 均为空文件。仅被 GoldBuildingViewer 使用。

### 2.7 OpenLevel（components/open-level/，开通级别面板）

纯展示 `CommonInfoLstPanel`，Props `{data, title}`。其 api.ts 定义了 cmnet 机房动环接口——与本组件无关、无人引用（复制残留）。

### 2.8 VipResumeCard（components/vip-resume-card/，要客履历卡）

- Props：`customerId`、`onClose`。数据 `getVipResumeDataApi(customerId)` 取 `recordInfoList[0]`，字段取值统一 `record[key].labelCn`。
- 详情字段 `DETAIL_FIELDS`：CUSTOM_NAME、INDUSTRY_CUST_TYPE、CUSTOM_ADD、STRATEGIC_CUST_TYPE_FL/SL（标签样式）、CLUSTERING_SCENARIO、CLUST_SCEN_TYPE_TWO、CUST_GROUP_FEATURE、CUST_DIRECT_TYPE。
- 8 类关联资源 `RESOURCE_TYPE_MAP` 与 `RESOURCE_NAME_FIELD_MAP`（LIGHT_EXCHANGE_BOX→FIBER_CAB_NAME、LIGHT_SPLITTER_BOX→FIBER_DP_NAME、POS→AN_POS_NAME、CABLE_SECTION→WIRE_SEG_NAME、PTN/SPN/OTN/OLT→同后缀_NAME）；labelCn 为管道/逗号分隔串，拆条展示。
- 内部状态：activeTab（detail/resources）、detail、resources、expandedTypes；请求用 cancelled 标志防过期。
- TODO：资源图标为 emoji 占位（L253 注释「后续可替换为 SVG/PNG」）。

### 2.9 GoldBuildingViewer（components/gold-building-viewer/index.jsx，楼宇 3D 弹窗，JSX）

- Props：`buildingName, buildingId(CUID), FLOOR_NUM`；挂 render.tsx 的 antd Modal（宽 1250、destroyOnClose）。
- 核心依赖 `BuildingViewer`（`web/components/building-viewer/`），ref 暴露 `updateFloorColor(colors)`。
- 数据流：
  1. `getData()`：`queryForPageData4({bmClassId:'T_COVERAGE_SCENE_AN_POS', value:buildingId})` 取分光器列表 + `queryForPageJudgeThreeStar({value:buildingId})` 取 `{data:{IS_FIBER:boolean}}`。分光器（过滤 RELATED_FLOOR 为空）映射为 `{sourceFile:'/FeDXMaterialServer/中天科技_分光器.glb', floorNo:RELATED_FLOOR, twinId:G_CUID, color:一级'#014500'/二级'#943f00', LABEL_CN, details:[...]}`。
  2. `getTwinCoverData()`：点选分光器后 `queryForPageData5({bmClassId:'AN_POST_COVERAGE_SCENE', value:twinId})` 取覆盖楼层（FLOOR_NUM），染蓝 `#1682D9` 调 `ref.current.updateFloorColor`。
- 开通级别四档判定 `getOpenLevelInfo(floorNo)`（L31-48）：该层有分光器→5星「资源到层」；楼内有→4星「资源到楼」；否则 `isFiber`→3星「资源到园区」，否则 2星「资源到微网格」。详见 `open-level-capability.md`。
- 楼层点击→OpenLevel 面板；分光器点击→清楼层着色 + LightSplitter 面板。
- `postMessageData`：点「确认」把分光器详情+开通级别 postMessage(JSON, '*') 给 `window.opener` 并 `window.close()`——该弹窗可被外部系统以 opener 方式打开。**origin 为 '*'，安全隐患**。
- 楼体配置 `buildingConfig`：`/FeDXMaterialServer/辅助楼_01.glb`，floorCount=FLOOR_NUM||10，floorHeight=3；颜色/透明度/材质从 `env.buildingConfig` 读（默认 `#0BB858`/1/transmission）。

## 3. 接口清单（均经 BFF 前缀 /goldBuilding）

| 接口 | 方法/路径 | 关键参数 | 响应要点 | 调用方 |
| --- | --- | --- | --- | --- |
| 园区 GIS | GET `/goldBuilding/gisDataApi/gis-zone-data` | `outFields:'*', returnGeometry:true, f:'json', keyCode:'845d3084638f439b91b7481a82139eb7', where:'1=1'` | ArcGIS `{features:[{attributes, geometry:{rings}}]}` | earth/index.tsx L297-342 |
| 楼宇 GIS | GET `/goldBuilding/gisDataApi/gis-building-data` | 同上 | ArcGIS 形状；`attributes.SCENE_LEVEL` ∈ {铜牌/金牌/银牌} | earth/index.tsx L142-194 |
| 要客 GIS | GET `/goldBuilding/gisDataApi/yaoke-map-query` | `layerId`(5/6/7/8)+outFields/where/f/keyCode | ArcGIS 点要素，BFF 信封已解包 | earth/index.tsx L239-295 |
| 要客履历 | GET `/goldBuilding/gisDataApi/vip-resume` | `cuid` | queryForPage 信封 | earth/api → VipResumeCard |
| 要客关联设备 | GET `/goldBuilding/gisDataApi/vip-resource` | `cuid` | queryForPage 信封；字段见 `vip-customer.md` | earth/api → render.tsx |
| 楼外光缆段 | GET `/goldBuilding/gisDataApi/trans-wire-seg` | `cuids`（逗号分隔）、`keyCode:'89536f0fff8a4f85a3546d07'`（测试环境值，切环境以现场为准） | ArcGIS polyline（layer 23）；可能为 JSONP 字符串 | earth/api → render.tsx |
| 光交箱列表 | GET `/goldBuilding/gisDataApi/query-for-page-data2` | `bmClassId:'T_GEO_PROPERTY_GWM', value:园区CUID` | queryForPage 信封 | LightExchangeBox |
| 分光器统计 | GET `/goldBuilding/gisDataApi/query-for-page-data3` | `bmClassId:'T_COVERAGE_SCENE_AN_POS_STATIS', value:楼宇CUID` | queryForPage 信封 | LightSplitterDetail |
| 分光器列表 | GET `/goldBuilding/gisDataApi/query-for-page-data4` | `bmClassId:'T_COVERAGE_SCENE_AN_POS', value:楼宇CUID` | queryForPage 信封 | GoldBuildingViewer |
| 覆盖楼层 | GET `/goldBuilding/gisDataApi/query-for-page-data5` | `bmClassId:'AN_POST_COVERAGE_SCENE', value:分光器G_CUID` | FLOOR_NUM | GoldBuildingViewer |
| 三星判断 | GET `/goldBuilding/gisDataApi/query-for-page-judge-three-star` | `value:楼宇CUID` | `{data:{IS_FIBER:boolean}}` | GoldBuildingViewer |
| 搜索 | GET `/goldBuilding/gisDataApi/search-data` | `key, bmclassids:'SWLY,WYM,YK'` | `{data:[{CUID,r,n,s1,s3,s4}]}` | MapSearchBar |
| 遗留 | POST `/goldBuilding/test/list` | — | 无人引用 | api.ts |

归一化函数（earth/api/index.ts）：

- `normalizeVipDevices`（L121-145）：→ `[{id, name, deviceType(RESOURCE_TYPE), longitude, latitude, raw}]`。
- `normalizeTransWireSegLines`（L276-317）：兼容 JSONP 字符串（正则剥 `L.esri._callback.xxx({...})` 包裹）；每 feature 每 path（≥2 有效点）→ `{id:cuid-path-N, cuid, labelCn, positions}`。
- `normalizeYaokeFeature`（earth/index.tsx L206-232）：坐标优先 `geometry.x/y`，兜底属性 LONGITUDE/LATITUDE；id=CUID、name=LABEL_CN。

**API 接入模式**：`request({url, method, baseUrlType, data/params})`，`baseUrlType` 必须在 environment 有顶层配置项（如 `buildingGisAxios`）；post 配 data、get 配 params；新接口统一在 `web/pages/gold-building/components/earth/api/index.ts` 管理；不用 Initializer 组件，环境配置由 `useEnvironment()` → `getEnvironment()` 自动传递。

## 4. Mock 体系

- 总开关 `isYaokeMockEnabled()`（earth/api L12-15）读 `getEnvironment()?.USE_YAOKE_MOCK`（本地在 `src/config/config.default.ts` 的 environment 块配置，默认 false 走真实接口）。覆盖：要客点位、关联设备、楼外连线、履历卡。mock JSON 动态 import 独立分包。
- `yaoke-layer-5/6/7/8.json`：MapServer 四图层（总部直管1390=5、总部协同1390=6、省级直管=7、地市直管=8）的真实接口返回快照（ArcGIS 点要素）；来源 `mock/要客图层返回值_格式化.txt`。
- `vip-resume-sample.json`：/vip-resume 真实返回样例，mock 不区分 CUID 统一返回。
- `trans-wire-seg-sample.json`：ArcGIS polyline 真实样例（5 features / 6 paths）；mock 时按 CUID 过滤并**整体平移到要客坐标附近**（否则线离要客数百公里不可见）。
- `yaokeResourceMock.ts`：`getYaokeResourceMock(cuid, position)`，CUID 字符和为种子的确定性伪随机（每类 2-3 条、±0.025° 散布）；TRANS_WIRE_SEG 仅返回 5 个固定 CUID 与 sample.json 对应。
- `.local-building.json` / `.local-zone.json`：楼宇/园区本地 mock，import 被注释（api L19-20、L33-34），需要时取消注释。
- `yaokeMockData.ts`：12 条手造要客单点数据，**已被 yaoke-layer-*.json 取代，无代码引用**（遗留）。

## 5. 交互协议（全流程串联）

1. **图层树**：LeftTree onCheck → `selectTreeNode` → 两路：
   - render.tsx L48-65：取消任一要客子类或当前选中要客所属子类被取消 → `yaokeRequestSeqRef+1` 失效在途请求，清空设备/连线/图例/履历卡。
   - earth/index.tsx L374-409：懒加载——首次勾选楼宇类型才拉楼宇、勾选要客子类才拉要客（4 图层并行）、勾选 zone 才拉园区；全部取消清空并重置 hasRequested。L347-372：按勾选 key 过滤为 chunk（`building_source_${key}`）。
2. **搜索定位**：MapSearchMap onSelect → `searchBuildingData` → earth/index.tsx L416-433 设 `highlightList:[{id:CUID}]` → 通用层 FlyToEntities 高亮并飞行。
3. **单击** `onEarthViewerClick(info.dataItem)`（render.tsx L68-194），按 type 分派：
   - `renderType==='yaoke-device'`：记 `selectedDevice`，return。
   - `renderType==='yaoke-trans-wire-seg'`：仅观察，return。
   - `type===zone`：打开 LightExchangeBox，清要客链路。
   - `type ∈ YaoKeSubTypeKeys`（要客）：打开 VipResumeCard；`seq=++ref`，清旧 → `getVipDevicesApi(cuid, position)` → 校验 seq → `normalizeVipDevices` → 写 `yaokeDevices`+`deviceTypeVisible`(全 true) → 收集去重 TRANS_WIRE_SEG CUID → `getTransWireSegLinesApi(cuids, position)` → 校验 seq → 写 `transWireSegLines`。两段均过期丢弃 + 异常清空。
   - 其他（商务楼宇）：打开 LightSplitterDetail，清要客链路。
   - 点空白：全部面板关闭、链路清空、seq+1。
4. **双击**（L195-209）：要客不处理；楼宇双击 → 打开 GoldBuildingViewer Modal。
5. **设备图例**：earth/index.tsx 右下角第二个 `EarthLegend`（仅有 yaokeDevices 时渲染）：`onToggleDevice/onToggleAllDevices` 切换 `deviceTypeVisible` → 重建 deviceChunk 与 transWireSegChunk（连线显隐跟随 INTER_WIRE_SEG）；图例含各类计数（TRANS_WIRE_SEG 计入光缆段）与选中设备全字段详情。
6. **GoldBuildingViewer 内部**：楼层点击→OpenLevel；分光器点击→LightSplitter + 楼层染色；「确认」→postMessage 回传 opener。

实现细节备忘：

- transWireSeg 显隐不整段移除 Entity 而传 `visible` 用 `show` 兜底（react-cesium 卸载 Entity 未必真移除，避免残留，earth/index.tsx L52-53 注释）。
- keyCode 硬编码于源码（要客 GIS 与光缆段各一个），注释已标明「测试环境值，切环境以现场为准」。

## 6. 已知问题 / 遗留

- 大量 `console.log('测试日志 …')` 调试日志未清理（render.tsx、earth/index.tsx、earth/api、三个 queryForPage 组件）。
- isDebug 内联 mock 数据体量大（render.tsx L17、LightExchangeBox ~850 行、GoldBuildingViewer、LightSplitterDetail）。
- 空文件：light-exchange-box/index.less、light-splitter/api.ts、light-splitter/index.less、open-level/index.less。
- 命名错乱：light-splitter-detail 内组件名仍是 LightExchangeBox。
- 无引用代码：页面级 api.ts、open-level/api.ts、yaokeMockData.ts、fetch.ts 空壳。
- postMessage 目标 origin 为 '*'（安全隐患）。
- LightExchangeBox 详情经/纬度字段重复出现两次。
