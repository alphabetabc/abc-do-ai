# earth 组件 · 业务层文档（business / business-gold-building / editor）

> 组件路径：`web/components/earth`
> 证据日期：2026-09-04（本页所有行号均来自当日逐文件 Read 实读）
> 配套文档：`common-layer.md`（通用层：入口 / 状态 / hooks / stage 舞台）

---

## 1. 业务层总览

业务层建立在通用层（`EarthStageRoot` / `EarthViewer` / store / hooks）之上，提供「开箱即用」的地球业务组件。共三个子目录：

```
business/                  # 通用业务：初始化 + 统一交互协议 + 数据源工厂
├── EarthInitializer.tsx   # 拉模型列表 + 合并环境配置，Context 下发
├── EarthStageLoader.tsx   # EarthInitializer + EarthViewer + 单/双击交互协议
├── api.ts                 # 模型列表接口 + createModelDataItem/createLineDataItem/数据源模板
├── enums.ts               # TwinTypeEnumEarth 业务孪生体类型枚举
└── index.ts               # 门面导出（含 utils.dataSource.*）

business-gold-building/    # 金牌楼宇查看器（chunk 分片渲染 + hover + 高亮 + 相机飞行）
├── index.tsx              # EarthViewerGoldBuildingLoader 入口（ApiLoader > Initializer > Imp）
├── EarthViewerGoldBuildingLoader.tsx  # Imp：EarthStageRoot + StateProvider + FlyToEntities + 实体
├── presets.ts             # DataSourceBuildingTypes / DefaultSettings / ModelAssetsList
├── components/
│   ├── StateContext.tsx   # highlightList 的局部 Context
│   ├── utils.ts           # __dataId__ / __data_userData_ / __data_renderType_ 字段桥
│   ├── EntityBuilding.tsx # 建筑 glb 模型 + label + hover/高亮轮廓
│   ├── EntityZone.tsx     # 园区多边形 + 轮廓线 + label + 闪烁高亮
│   └── FlyToEntities.tsx  # 首次全量飞行 + highlightList 驱动的定位飞行
├── index.less / readme.md # 样式 / 占位说明（readme 仅一行标题）

editor/                    # 编辑器 UI（antd 面板，通过 editorStore 驱动地球）
├── layout/index.tsx       # EditorLayout：右侧 Sider + Tabs
├── city-data-selector/    # 城市勾选面板
└── layer-manager/         # 图层树面板（含 title/ 子组件）
```

选型指引：

| 场景 | 用哪个 |
| --- | --- |
| 通用孪生体可视化（模型 + 管线 + 顶牌 + 关系线，需要统一单/双击协议） | `business/` 的 `EarthStageLoader` |
| 金牌楼宇场景（建筑 glb + 园区多边形 + 外部 highlightList 驱动高亮/飞行） | `business-gold-building/` 的 `EarthViewerGoldBuildingLoader` |
| 需要用户在 UI 上选择城市数据 / 管理图层 | `editor/` 的 `EditorLayout`（配合通用层 EarthViewer 使用） |

---

## 2. business/（通用业务）

### 2.1 EarthInitializer（`web/components/earth/business/EarthInitializer.tsx`）

职责：拉取模型资产列表 + 合并环境配置，经 Context 下发给下游。

Props（`TEarthInitializerProps`，L9-22，全部可选）：

| 字段 | 说明 |
| --- | --- |
| `projectId` | 项目 id；**为 null/undefined 时走 public 静态 json**（见 api.ts §2.4） |
| `customModelListApi` | 自定义模型列表 API（覆盖默认接口） |
| `imagerySettings` | 底图配置（会与 env 合并，见下） |
| `sceneServerSettings` / `initialCameraPosition` | 透传（实际从 env 读取，props 未消费） |

处理流程：

1. `useRequest`（L38-77，`refreshDeps: [props.projectId]`）：projectId 变化时清缓存重拉（L42-44）；命中缓存则不重复请求（L46-48）。请求经 `runPromise` 包裹（L51-55），失败返回空数组（L56）。返回的 list 映射为 `{ raw, sourceFile, sourceType: item.typeId }`（L58-64）——**注意 `sourceType` 取的是 `typeId` 字段**。
2. env 合并（L82-108）：`imagerySettings` = env `earthSetting.tileSetting` + `tileType` + `tileUrl`，再被 props.imagerySettings 覆盖（props 用 `latest` 保持引用最新但 useMemo 依赖仅 `[env, latest]`，见已知问题 §6）；`sceneServerSettings`、`initialCameraPosition`、`modelSettings`、`baseColor` 均只从 env `earthSetting.*` 读取。
3. loading 时渲染 `<DataStatus status="loading" />`（L110），**会阻断子树**。
4. Context value（L113-124）：`{ modelList, imagerySettings, sceneServerSettings, initialCameraPosition, modelSettings, baseColor }`。

导出 hooks：

- `useEarthInitializer()`（L128）：直接取 Context。
- `useInitConfig(presetInitConfig)`（L130-170）：返回
  - `initConfig`：preset 展开 + `modelList: [...env 模型列表, ...(preset.modelList ?? [])]`（L147，env 优先）。
  - `imagerySettings / sceneServerSettings / initialCameraPosition / baseColor / modelSettings`：**惰性 getter**（L149-167），每次访问从 `latest.current` 取最新值——避免 useMemo 依赖 env 导致的重算。下游（EarthStageLoaderImp / GoldBuilding Imp）解构一次性取值时拿的是当时快照。

### 2.2 EarthStageLoader（`web/components/earth/business/EarthStageLoader.tsx`）

组合 `EarthInitializer > EarthStageLoaderImp > EarthViewer`（L198-210，memo 组件）。拆出 `projectId / customModelListApi / imagerySettings` 传给 Initializer，其余 props 透传给 Imp。

Imp Props（`TEarthStageLoaderImpProps`，L10-33）：

| 字段 | 说明 |
| --- | --- |
| `data` | 数据源对象（`typeof EmptyDataSourceResult`），缺省 `EmptyDataSourceResult`（L46） |
| `initConfig` | 预设初始化配置（传给 useInitConfig） |
| `cityAssetList / flyToIds` | 透传 EarthViewer |
| `labelMarkers / relationLinks` | 透传 EarthViewer |
| `earthRef` | 命令式 ref 转发（`useImperativeHandle` L60-62 返回内部 earthRef.current） |
| `onModelClick(dataItem, {node})` | 模型单击（dataItem = node.userData） |
| `onLineClick(dataItem, {node, flyTo})` | 线单击；`flyTo` 为**一次性闭包**（调用后置 null，L112-116） |
| `onModelDblClick` / `onLineDblClick` | 同上双击版本 |
| `onRightDblClick` | 右键双击（useDblClickAction 模拟，L64-68） |
| `onClickAway` | 点击空白 / 未匹配数据项 |
| `onReset` | 组件卸载时触发（useUnmount L175-177） |

**统一交互协议**（`useClickAction`，L70-164，单击 300ms 延迟防双击冲突）：

1. 单击前置清理（L72-80）：先执行上一次模型/线高亮的还原闭包。
2. 数据还原：`getNodeItem(target)`（L48-55）→ `data.getDataItem(target.id.id)`，未命中回退 `relationLinks.find(d => d.id === target.id.id)`；`target.id.id` 是 Cesium Entity 的 id 字符串。
3. 模型（`nodeItem?.type === 'model'`，L85-96）：
   - `earthRef.current.postProcessStage.silhouette.save(target.primitive)` 轮廓高亮，还原函数存 `preSelectModelTarget`（L88-91）。
   - 回调 `onModelClick(nodeItem.userData, { node: nodeItem })`（L94-96）。
4. 线（`type === 'line'`，L97-117）：
   - **告警线（`userData.state.hasAlarm`）与关系连线（`businessTwinType === TwinTypeEnumEarth.NetRelationLink`）不高亮**（L100）。
   - 高亮实现：暂存原色 → `target.id.polylineVolume.material.color = earthRef.current.color('blue')`（L101-106），还原闭包存 `preSelectLineTarget`。注意操作的是 `polylineVolume.material.color`（管线实体），若数据源是普通 polyline 会出错（见已知问题）。
   - 回调附带一次性 `flyTo` 闭包（L109-117）。
5. 双击（L125-163）：模型双击 = `earthRef.current.flyTo(target.id)` + 回调（L128-134）；线双击逻辑与单击相同但**不直接飞行**（`earthRef.current.flyTo` 被注释，L148），同样交给回调闭包。
6. `onMouseEnter / onMouseLeave` 为空实现（L166-171）。

渲染（L179-194）：`EarthViewer` + `dataSource={data.dataSource}` + 事件绑定（`onRightClick={rightClickAction.onDblClick}`）。

### 2.3 api.ts（`web/components/earth/business/api.ts`）

- `getObjectResourceListApi({ projectId })`（L8-20）：projectId 为 nil → GET `${constants.STATIC_PATH}/gis-3d/objectResourceList.json`；否则 POST `/goldBuilding/twinInstance/objectResourceList`。
- `genId(prefix)`（L23-25）：`prefix + performance.now() + 自增序号`，数据项缺 id 时兜底。
- `createModelDataItem(config)`（L47-69）：**缺经/纬度返回 undefined**（L50-52）；产出 `{ twinSourceType, type:'model', id, modelType, position, setting:{ scale: scale || 1000 }, userData }`；有 name 则附加。
- `createLineDataItem(config)`（L71-100）：**有效点 < 2 返回 undefined**（L74-77）；产出 `{ twinSourceType, type:'line', id, positions, setting:{ color: color||'#00ff00', radius: radius||1, image, repeat, materialType }, userData }`。
- `createDataSourceApiResultTemplate()`（L102-184）：数据源工厂模板。内部 model/line 双 Map（L105-138），返回对象含：
  - `dataSource`（getter，L147-149）：数组，**只有调用 `finished()` 后才填充**（L159-165，line 在前 model 在后）。
  - `size`、`getDataItem(id)`（L155-157，先 model 后 line）、`createModelDataItem/createLineDataItem`（注册进 Map，L167-180）。
- `EmptyDataSourceResult`（L186）：空模板实例，EarthStageLoader 缺省 data。
- `hasAlarm(alarmLevel)`（L193）：alarmLevel 为 `'0'` 或 `0` 视为正常，其余均告警。

**开发约定**：业务侧组装数据的标准姿势：

```ts
const data = utils.dataSource.createDataSourceApiResultTemplate();
data.createModelDataItem({ modelType, longitude, latitude, userData });
data.createLineDataItem({ points, color, radius, userData });
data.finished();          // 必须调用，否则 dataSource 为空
<EarthStageLoader data={data} ... />
```

### 2.4 enums.ts / index.ts

- `TwinTypeEnumEarth`（`web/components/earth/business/enums.ts#L4-L39`）：CoreMachineBuilding / BaseStationRoom / BBUBuildingRoom / BaseStation / NetFiber / NetCircuit / NetRelationLink，值形如 `business-earth-*`。`NetRelationLink` 用于 EarthStageLoader 排除关系连线高亮。
- `index.ts`（`web/components/earth/business/index.ts#L15-L24`）：门面，组装 `utils.dataSource.{createDataSourceApiResultTemplate, createLineDataItem, createModelDataItem, EmptyDataSourceResult, hasAlarm}` + `utils.executable`，并导出 `EarthInitializer / useEarthInitializer / useInitConfig / EarthStageLoader / TwinTypeEnumEarth / TEarthViewerProps`。

---

## 3. business-gold-building/（金牌楼宇）

### 3.1 入口与结构

入口 `EarthViewerGoldBuildingLoader`（`web/components/earth/business-gold-building/index.tsx#L65-L77`）：

```
EarthApiLoader（远程库）
└ EarthInitializer（不传 projectId → 模型列表走 public 静态 json）
  └ EarthViewerGoldBuildingLoaderImp
```

同文件导出 `useClickAction`（L79，从通用层 re-export，供外部业务处理单双击冲突）。

Props（`TProps`，L9-64）：

| 字段 | 说明 |
| --- | --- |
| `onClick / onDoubleClick({ id, dataItem, target, evPosition })` | 点击回调（Imp 实际传的是 `dataItem`，类型注释写 `info`，见 §3.2） |
| `highlightList: Array<{id, ...}>` | 外部驱动的高亮 id 列表 |
| `buildingDataSource / zoneDataSource` | 建筑/区域数据项（**类型已定义但 Imp 未消费**，见已知问题） |
| `buildingChunkDataSource / zoneChunkDataSource` | `Array<{chunkId, chunk}>`，**实际被渲染消费的数据入口** |

### 3.2 Imp（`web/components/earth/business-gold-building/EarthViewerGoldBuildingLoader.tsx`）

L12-50：

1. `useInitConfig(props.initConfig)` 取 imagerySettings / sceneServerSettings / initialCameraPosition / baseColor / modelSettings。
2. 根 div（类名 `earth-viewer-gold-building-loader-root`）内渲染 `EarthStageRoot`（直接用舞台根组件，不走 EarthViewer，因此不消费通用层 dataSource 拆分逻辑）。
3. 点击/双击（L29-40）：`utils.getCustomData(target)` 从 pick 结果解出 `{ id, userData }`，回调 `{ id, dataItem: customData.userData, target, evPosition }`。**注意回调字段名是 `dataItem`，与 index.tsx 类型注释（`info`/`id`）不一致**。
4. 子树（L42-47）：`StateProvider(highlightList) > FlyToEntities > EntityBuilding(buildingChunkDataSource) + EntityZone(zoneChunkDataSource)`。

### 3.3 预设（`web/components/earth/business-gold-building/presets.ts`）

- `DataSourceBuildingTypes`（L1-25）：`Zone='zone'`、`GoldBuilding='earth-gold_building'`、`SilverBuilding='earth-silver_building'`、`CopperBuilding='earth-copper_building'`、`OtherBuilding='earth-other_building'`。
- `DefaultSettings`（L27-49）：各档楼宇的 `modelColor` 均被注释（当前不生效）；Zone 有 `fillColor:'green' / borderColor:'red' / labelHeight:4e2`。
- `HighlightSettings`（L52-54）：`{ outlineColor: 'red' }`，**当前无消费方**。
- `ModelAssetsList`（L62-93）：三档 glb（`/FeDXMaterialServer/金牌楼宇-{金,银,铜}牌楼.glb`），每项含 `sourceType`（与数据项 `twinSourceType` 映射）、`sourceFile`、`scale:1`、`rotate:0`、`info.size`（包围盒）、`info.labelHeight:150`。

### 3.4 状态与字段桥

- `StateContext.tsx`（L5-13）：`StateProvider` 以 `useMemo([props.highlightList])` 下发 `{ highlightList }`；`useStateContext()` 供 EntityBuilding / EntityZone / FlyToEntities 消费。**这是局部 React Context，不走 valtio**。
- `components/utils.ts`（L1-39）：pick → 业务数据还原的底层机制：
  - `setCustomData2CesiumElement(data, ref?)`（L2-15）：返回 ref 回调，把 `__dataId__` / `__data_userData_` / `__data_renderType_` 写到 resium 组件实例的 `cesiumElement` 上；传入 `ref` 时同时收集组件实例（EntityZone 的 outlineRef 用）。
  - `getCustomData(target)`（L17-31）：从 `target.id.__dataId__/__data_userData_` 解出 `{ id, userData }`；target 无 id 时原样返回。
  - `getCustomIdFromEntity(entity)` / `getRenderTypeFromEntity(entity)`（L33-39）：从 entity 直接读自定义字段。
  - **关键点**：label / outline Entity 的 id 虽带 `building-label-*` / `zone-outline-*` 前缀，但 `__dataId__` 统一存原始业务 id，因此 pick 到任何关联 Entity 都能还原。

### 3.5 EntityBuilding（`web/components/earth/business-gold-building/components/EntityBuilding.tsx`）

三层结构：

1. `EntityBuildingChunkRenderer`（L221-235）：把 `props.dataSource`（chunk 数组）逐项交给 `EntityBuilding`（key = `chunk-${chunkId}`），透传 modelSettings。
2. `EntityBuilding`（L154-219）：数据组装 useMemo（L158-208）：
   - 按 `item.twinSourceType` 匹配 `ModelAssetsList`（L163）；匹配不到返回 null（L175）。
   - env `modelSettings` 中取第一个满足 `DataSourceBuildingTypes[d.type]` 的项覆盖 customSetting（L164-173，**只按 DataSourceBuildingTypes 判断，未与当前 item 的类型比对**，见已知问题）。
   - `defaultSetting = DefaultSettings[item.type] ?? DefaultSettings[OtherBuilding]`（L178-179）。
   - 产出（L181-199）：`url = customSetting.sourceFile ?? assetItem.sourceFile`；`scale = item.scale ?? customSetting.scale ?? defaultSetting.scale ?? assetItem.scale`；label 三件套（白字 + 黑底 alpha 0.8、labelHeight、backgroundPadding Cartesian2(20,10)）；`rotate = customSetting.rotate ?? assetItem.rotate ?? 0`；`defaultSetting.modelColor` 存在时设置 color（当前预设被注释，实际不生效）。
   - 空数组返回 null（L210）。
3. `EntityBuildingItem`（L14-152）：单个建筑。
   - 位置 useMemo（L27-44）：`modelPosition`（高度 0）+ `labelPosition`（抬到 labelHeight）+ `modelOrientation`（`HeadingPitchRoll(rotate, 0, 0)` 四元数，包 ConstantProperty）。
   - hover（L46-65）：`onMouseEnter` 先检查 highlightList 命中（命中则跳过，交给高亮逻辑）→ showLabel=true + `postProcessStages.silhouette.save(target.primitive)` + scale×1.3；`onMouseLeave` 还原（removeHighlight + scale 复位 + showLabel=false）。
   - highlightList 响应（L67-100）：`scene.pick(scene.cartesianToCanvasCoordinates(modelPosition))` 用**模型坐标反查 primitive**（不依赖鼠标）→ 命中：save 轮廓 + scale×1.2 + showLabel；未命中：执行 removeHighlight + showLabel=false + scale 复位。try/catch 兜底仅打 console（L96-99）。
   - 渲染（L102-151）：模型 Entity（`ModelGraphics`，`heightReference: CLAMP_TO_GROUND`，color/lightColor 透传，ref 挂字段桥 renderType `'building'`）+ 可选 label Entity（`id = building-label-${id}`，`disableDepthTestDistance: 0`，scale 0.5，show 受 hover/高亮控制）。

### 3.6 EntityZone（`web/components/earth/business-gold-building/components/EntityZone.tsx`）

三层结构与 EntityBuilding 对称：

1. `EntityZoneChunkRenderer`（L180-188）：chunk 分发。
2. `EntityZone`（L138-178）：数据组装 useMemo（L141-169）：
   - 每项 `positions = Cesium.Cartesian3.fromDegreesArray(points.map([lng,lat]).flat(Infinity))`（L151-153）。
   - 样式取 `DefaultSettings[Zone]`：填充 `green alpha 0.4`、轮廓 `red`、labelHeight 400（L146-161）。
3. `EntityZoneItem`（L12-136）：单个园区，渲染三个 Entity：
   - polygon 面（L43-59，useMemo 包裹，`hierarchy: positions, material, height: 0`，onMouseMove/onLeave 切换 hover 态）。
   - 轮廓线（L105-114，`id = zone-outline-${id}`，`PolylineGraphics width=2`，`show` 受 hover/高亮控制，ref 经字段桥第二参数收集到 outlineRef）。
   - label（L115-133，`id = zone-label-${id}`，位置 = `Rectangle.center(Rectangle.fromCartesianArray(positions))` 抬到 labelHeight，L24-31）。
   - 高亮闪烁（L61-100）：highlightList 命中时启动 `setTimeout` 链（首帧延迟 2s，之后每 1s 切换 outlineColor 的 alpha 0/1，L69-85）；材质赋值异常时置 stopFlag 停止（L79-81）；未命中/清理时 clearTimeout（L87-99）。

### 3.7 FlyToEntities（`web/components/earth/business-gold-building/components/FlyToEntities.tsx`）

- 首次挂载（L33-54）：`debounce(() => flyTo())` 飞向 `flyToEntities.current ?? entityCollection`（默认全部实体）；`collectionChanged` 里的数据更新自动飞行**被注释**（L45-47）；`removeListener` 未调用（L51-53，仅作为值存在，见已知问题）。
- `flyTo(options)`（L19-29）：`camera.cancelFlight()` → `viewer.flyTo(entities, options)` → 清空 `flyToEntities.current`。
- highlightList 响应（L56-109）：
  1. 遍历 `entityCollection.values`，用 `utils.getCustomIdFromEntity` 匹配 highlightList id，命中收进临时 `new Cesium.EntityCollection()`（L60-91）。
  2. 含 zone（`getRenderTypeFromEntity === 'zone'`）时收集 polygon 顶点 + label 位置的 BoundingSphere（L71-89，try/catch 吞错）。
  3. 有命中实体则飞行（L93-103）：`offset = HeadingPitchRange(0, -40°, hasZone ? boundingSphere.radius * 5 : 1000)`。
  4. highlightList 清空仅重置 `flyToEntities.current = null`，**不回飞**（L105-108）。
- 渲染：直接返回 `props.children`（L111），纯逻辑包装组件。

---

## 4. editor/（编辑器 UI）

通过 valtio `editorStore`（见 `common-layer.md` §store）与地球交互的 UI 面板，均为受控展示组件（自身不发起渲染，只写 store）。

### 4.1 EditorLayout（`web/components/earth/editor/layout/index.tsx`）

L21-45：antd `Layout` + 右侧 `Layout.Sider`（width 300、collapsible、collapsedWidth 0）；Sider 展开时渲染 `Tabs`（defaultActiveKey '1'），两个面板：「城市数据」CityDataSelector（L10-13）、「图层管理」LayerManager（L14-18）。`props.children`（地球主视图）渲染在左侧。

### 4.2 CityDataSelector（`web/components/earth/editor/city-data-selector/index.tsx`）

- L11：`useSnapshot(editorStore.city.cityDataList)` 取城市列表。
- L13-17：`useSubscribeKeyState(editorStore.city, 'cityDataState', ...)` 订阅选中态。
- dataSource 过滤（L19-23）：`showSelectedCityList` 开启时只显示已勾选城市。
- 勾选（L29-37）：去重/过滤后 `editorStore.commitCityDataState({ selectedCityList })` —— 这是**编辑器 → 渲染器联动通道**（EditorStore 内部会触发 `earthRenderer.setConfig` 重拉城市 GeoJSON）。
- 「仅显示已选中区域」Switch（L25-27、L44-47）。
- 每项右侧 Aim 图标的 `flyToLayer` 调用**被注释**（L68-72），且未勾选时 cursor 为 not-allowed。

### 4.3 LayerManager（`web/components/earth/editor/layer-manager/index.tsx`）

- L12：`useSubscribeKeyState(editorStore.layer, 'cityData')` 订阅图层城市数据。
- 树结构（L14-61，useMemo）：
  - 「城市数据」根（不可选）→ 城市（不可选）→ 资产（**可选**，标题带 flyTo 动作：`editorStore.flyToDataSource({ name: item.id })`，L32-34）。
  - 「地球数据」根 → 「国家线」/「全球线」静态节点（key `0-0-0-0` / `0-0-0-1`，无动作）。
- 渲染 `DirectoryTree`（defaultExpandAll、showIcon=false，L63）。

### 4.4 Title（`web/components/earth/editor/layer-manager/title/index.tsx`）

L10-32：树节点标题。`enableAction` 时在右侧渲染 Aim 图标，点击 `e.stopPropagation()`（避免触发节点选中）后执行 `actions.flyTo()`。

### 4.5 使用方式

```tsx
// editorStore 数据来源（EditorStore 内部逻辑，详见 common-layer.md §store）
<EditorLayout>
    <EarthViewer initConfig={...} ... />   {/* 左侧地球 */}
</EditorLayout>
```

---

## 5. 地球数据与配置维护指南

地球要跑起来，依赖**四类外部数据/配置**。本节回答「地球本身需要怎样的数据、在哪里维护、怎么改」。

### 5.1 总览：四类数据资产

| 数据 | 维护位置 | 消费方 | 何时生效 |
| --- | --- | --- | --- |
| 环境配置 `earthSetting` | `src/config/config.default.ts`（运行时由 environment.json / 主应用 environment 覆盖） | `EarthInitializer`（`web/components/earth/business/EarthInitializer.tsx#L82-L120`） | env 变化后重渲染 |
| 模型资产列表 | `public/static/gis-3d/objectResourceList.json`（无 projectId 时）或接口 `POST /goldBuilding/twinInstance/objectResourceList`（有 projectId 时） | `EarthInitializer` useRequest（L38-77） | projectId 变化或缓存清空 |
| GLB/PNG 模型文件 | `/FeDXMaterialServer/` 资产服务（不在本仓库） | 数据项 `sourceFile` / presets `ModelAssetsList` | 页面加载 |
| 城市底图 GeoJSON | `initConfig.cityDataAssets` 内 url 指向的远程 json（d3 拉取） | `earthRendererStore.#fetchCityGeojson` | 选中城市变化 |

### 5.2 环境配置 earthSetting（字段级维护说明）

配置模板在 `src/config/config.default.ts#L107-L159`，运行时经 `web/components/environment/index.tsx`（useEnvironment / getEnvironment，来自主应用 store 的 `state.environment`）注入。字段：

| 字段 | 类型/示例 | 维护说明 |
| --- | --- | --- |
| `tileType` | `'amap:img'` / `'amap:elec'` / `'arcGis'` / `'webMapTile'` / `'urlTemplate'` | 底图瓦片类型。前两种高德内置；`webMapTile` 支持 wmts；`urlTemplate` 为 xyz 模板。与 `TileTypeEnum`（EarthStageRoot，见 common-layer.md）对应 |
| `tileUrl` | xyz/wmts 模板串 | `urlTemplate` / `webMapTile` 类型时必填；含 `{z}/{x}/{y}` 占位符 |
| `tileSetting` | `{ minimumLevel, maximumLevel, rectangle }` | 瓦片层级与地理范围（rectangle = `[西, 南, 东, 北]` 经纬度），限制加载范围 |
| `sceneServerUrl` | url 或 `null` | ArcGIS I3S 白膜/倾斜摄影服务地址；**null 时不加载**（`web/components/earth/stage/arcgis-scene-server/index.tsx#L17`） |
| `sceneServerSetting` | `{}` | I3S 附加配置（透传 `I3SDataProvider.fromUrl`） |
| `baseColor` | `'#fff'` | 地球底色（无瓦片覆盖区域） |
| `initialCameraPosition` | `{ position, direction, up }` 三组 xyz 数组 | 初始相机位姿（Cesium 世界坐标，非经纬度）。全部三段配齐才会 setView，只配 position 不生效（StageScene invalidateConfig 逻辑，见 common-layer.md 已知问题）。调试方法：地球加载后 ctrl+click 会在 console 打印当前相机三段值，可直接拷回配置 |
| `modelSettings` | `[{ type, sourceFile, labelHeight }]` | 按楼宇类型覆盖模型资产：type 取 `DataSourceBuildingTypes` 的**枚举键名**（`'GoldBuilding'` 等，非枚举值）；命中项覆盖 presets `ModelAssetsList` 的 sourceFile/scale/labelHeight/rotate（见 `EntityBuilding.tsx#L164-L199` 优先级：数据项 scale > customSetting > DefaultSettings > assetItem） |
| `projects` | `[]` | 项目列表（本组件未消费） |

**改配置的路径**：本地开发改 `src/config/config.default.ts`；部署环境由 environment.json / 主应用下发覆盖，前端代码不动。

### 5.3 模型资产列表（objectResourceList）

- **静态版**：`public/static/gis-3d/objectResourceList.json`。结构为接口响应快照：`data.list[]`，每项含 `typeId`（→ 前端 `sourceType`，**与数据项的 `twinSourceType` 匹配的键**）、`sourceFile`（glb 路径）、`sourceIcon`、`name`。文件内自带说明（L5）：「这个数据按需要维护就好，理论上不用同步到开发环境」。
- **接口版**：传 `projectId` 时走 `POST /goldBuilding/twinInstance/objectResourceList`（`web/components/earth/business/api.ts#L13-L19`），数据来自孪生平台「资源模型管理」（objectResource/list）。
- **缓存规则**（`EarthInitializer.tsx#L36-L77`）：同 projectId 只请求一次（cacheRef）；projectId 变化清缓存重拉。
- **新增一栋可点击模型的最小步骤**：
  1. glb 上传到 `/FeDXMaterialServer/`；
  2. 在孪生平台（或本地直接编辑静态 json）登记 `{ typeId, sourceFile, name }`，typeId 是新业务类型则同时要求数据项 `twinSourceType` 与之一致；
  3. 业务数据里产出 `createModelDataItem({ modelType: typeId, longitude, latitude, userData })`——`modelType` 会与模型列表的 `sourceType` 匹配注入 url（`web/components/earth/index.tsx#L111-L121`），**匹配不到该项被静默丢弃**。

### 5.4 金牌楼宇预设资产（presets，代码内维护）

`web/components/earth/business-gold-building/presets.ts` 的 `ModelAssetsList`（L62-93）是金牌楼宇场景的硬编码模型映射（三档 glb），不走 objectResourceList。新增一档楼宇：

1. `DataSourceBuildingTypes` 加枚举值（`earth-xxx_building` 命名）；
2. `ModelAssetsList` 加 `{ sourceType, sourceFile, scale, rotate, info: { size, labelHeight } }`；
3. 可选：`DefaultSettings` 加 `modelColor`（当前该项被注释未启用）。

金牌楼宇入口（`business-gold-building/index.tsx#L72`）不传 projectId，模型列表走静态 json，但静态 json 与 ModelAssetsList 是**两套独立映射**：前者服务通用 `EarthViewer` 路线（modelType 匹配），后者服务 GoldBuilding 路线（twinSourceType 匹配）。env `modelSettings` 可对后者做按环境覆盖。

### 5.5 城市 GeoJSON（cityDataAssets）

- 来源：`initConfig.cityDataAssets`（`TIinitConfig`，`web/components/earth/types.ts#L8-L94`），含 building/road/water 各资产 url 与 style。
- 加载：`earthRenderer.setConfig` → `#fetchCityGeojson`（`web/components/earth/store/EarthRenderer.ts#L40-L82`）按选中城市过滤后 `d3.json` 拉取，`Promise.allSettled` 容错。
- 维护动作：换城市/换数据源 → 改 `cityDataAssets` 的 url 与资产分组；显示哪些 → `cityAssetList` props（组 Id 数组）；编辑器勾选联动见 §4.2。

### 5.6 运行时数据的维护边界（谁该放哪）

| 数据性质 | 放哪 | 例 |
| --- | --- | --- |
| 资产/场景数据（低频、随配置变化） | env earthSetting / objectResourceList / presets | 瓦片、模型映射、相机 |
| 业务实体数据（随接口/用户操作变化） | props（dataSource / chunkDataSource / highlightList） | 楼宇列表、高亮列表 |
| 跨组件会话态 | valtio store（earthRendererStore / editorStore） | cityAssets、flyToIds、选中城市 |
| Cesium 大对象（不可序列化） | `createRef` WeakMap（`setCesiumContext`），**禁止进响应式** | viewer、scene、ctx |
| pick 还原用的业务标记 | Entity 实例字段（`__dataId__` 等字段桥，§3.4） | id、userData、renderType |

---

## 6. 开发指南（在业务层上做二次开发）

### 6.1 新增一个「数据驱动的地球页面」（推荐路径）

1. 组装数据：`utils.dataSource.createDataSourceApiResultTemplate()` + `createModelDataItem / createLineDataItem` + `finished()`。
2. 渲染：`<EarthStageLoader projectId={...} data={data} onModelClick={...} onLineClick={...} />`。模型列表与底图来自 env `earthSetting`；projectId 传了走接口，不传走 public 静态 json。
3. 需要命令式控制时传 `earthRef`，拿到 `{ flyTo, color, postProcessStage }`（内部 `useImperativeHandle` 转发 EarthViewer contextRef）。

### 6.2 新增高亮驱动的实体组件（仿 EntityBuilding/EntityZone）

固定套路：

1. 数据组装层（外层组件）：useMemo 把业务数据 + presets 默认值合并成渲染项数组。
2. Item 层：
   - `useStateContext()` 取 highlightList；`useLatest` 缓存高亮列表与 scale 等闭包外值。
   - hover 态：`useSetState({ showLabel, showOutline })`，enter/leave 先判断 highlightList 命中（命中让位给高亮逻辑）。
   - highlightList 响应：`useEffect([globalState.highlightList])` 内做轮廓/闪烁 + label 显隐，清理函数还原。
   - Entity 的 `ref` 必须挂 `utils.setCustomData2CesiumElement({ id, userData, renderType })`，保证 pick 可还原业务数据；派生 Entity（label/outline）id 加前缀但 `__dataId__` 存原始 id。
3. chunk 包装层：`xxxChunkRenderer` 逐 chunk 分发，key 用 `chunk-${chunkId}`。

### 6.3 交互回调的数据还原

- EarthStageLoader 路线：回调收到 `nodeItem`（数据项本体）+ `nodeItem.userData`，id 匹配走 `data.getDataItem` / `relationLinks.find`。
- GoldBuilding 路线：回调收到 `{ id, dataItem: customData.userData, target, evPosition }`，id 从 `__dataId__` 还原。
- 新组件**必须二选一**实现 pick → 业务数据的还原，禁止依赖 Cesium Entity id 命名约定反推业务 id。

---

## 7. 已知问题 / 未完成点（源码可证）

| 位置 | 问题 |
| --- | --- |
| `web/components/earth/business/EarthInitializer.tsx#L80-L89` | props.imagerySettings 经 `latest` 参与合并，但 useMemo 依赖仅 `[env, latest]`（latest 引用恒定），props 变更后需 env 变化才会重算 |
| `web/components/earth/business/EarthStageLoader.tsx#L36` | TODO：飞向线的问题处理 |
| `web/components/earth/business/EarthStageLoader.tsx#L101-L106、L140-L144` | 线高亮直接改 `polylineVolume.material.color`（TODO 注释 L105），仅适配管线实体；且按 Cesium 材质类型该写法对 `Color` 材质才有效 |
| `web/components/earth/business-gold-building/index.tsx#L35-L63` | `buildingDataSource` / `zoneDataSource` 类型已定义但 Imp（EarthViewerGoldBuildingLoader.tsx L44-45）未消费，仅 chunk 版生效 |
| `web/components/earth/business-gold-building/index.tsx#L16-L26` 与 `EarthViewerGoldBuildingLoader.tsx#L32、L38` | 类型注释回调参数为 `info`，实际传字段名 `dataItem`，不一致 |
| `web/components/earth/business-gold-building/presets.ts#L28-L43` | 各档楼宇 `modelColor` 全部被注释，EntityBuilding 的 color 分支实际不生效 |
| `web/components/earth/business-gold-building/presets.ts#L52-L54` | `HighlightSettings` 无消费方 |
| `web/components/earth/business-gold-building/components/EntityBuilding.tsx#L164-L173` | modelSettings 匹配只判断 `DataSourceBuildingTypes[d.type]` 存在性，未与当前 item 类型比对（多类型预设时取第一个匹配项） |
| `web/components/earth/business-gold-building/components/EntityBuilding.tsx#L177` | `@ts-ignore` |
| `web/components/earth/business-gold-building/components/EntityBuilding.tsx#L79-L85` | 高亮用 `scene.pick(cartesianToCanvasCoordinates)` 反查，相机未对准模型/被遮挡时 pick 不到，高亮静默失败（catch 仅打日志） |
| `web/components/earth/business-gold-building/components/FlyToEntities.tsx#L44-L48` | `collectionChanged` 自动飞行被注释 |
| `web/components/earth/business-gold-building/components/FlyToEntities.tsx#L51-L53` | `removeListener` 未调用（仅作为表达式存在），effect 清理缺失 |
| `web/components/earth/business-gold-building/readme.md` | 仅一行标题，无内容 |
| `web/components/earth/editor/city-data-selector/index.tsx#L68-L72` | `flyToLayer` 调用被注释 |
