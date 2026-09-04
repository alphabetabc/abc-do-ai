# earth 组件 · 通用层文档（入口 / 状态 / hooks / stage 舞台）

> 组件路径：`web/components/earth`
> 证据日期：2026-09-04（本页所有行号均来自当日逐文件 Read 实读）
> 配套文档：`business-layer.md`（业务层：business / business-gold-building / editor）

---

## 1. 分层总览

earth 组件分为**通用层**（本文档）与**业务层**（见 `business-layer.md`）：

```
通用层（本文档）
├── 入口：EarthViewer（index.tsx）→ EarthRenderer → EarthApiLoader（远程库）
├── hooks：useGis3dLib / useCesium / useSubscribeKeyState / useClickAction / useDblClickAction
├── store：earthRendererStore（earthStore）+ editorStore + createRef（WeakMap）
├── helpers：HelperInitCameraFlyTo
└── stage：EarthStageRoot（Viewer + Provider 树）+ 各实体集合子组件
        ↑ 被 EarthStage（默认实体集合组装）/ business / business-gold-building 消费

业务层（business-layer.md）
├── business/：EarthInitializer + EarthStageLoader（通用交互协议）+ api.ts（数据工厂）
├── business-gold-building/：金牌楼宇查看器
└── editor/：编辑器 UI（EditorLayout / CityDataSelector / LayerManager）
```

核心设计纪律（开发必须遵守）：

1. **运行时禁止直接 `import Cesium`**：所有 Cesium 类/组件经 `useGis3dLib()` 获取（类型允许 `import type`，如 `web/components/earth/stage/model-collection/index.tsx#L2`、`web/components/earth/stage/post-processing/PostProcessing.tsx#L2`）。因为 Cesium 是远程 UMD（`gis3d-lib.umd.js`）动态加载的。
2. **ctx 注入链**：Viewer → `InitStoreContext`（写 store）→ 子组件 `useCesium()`。组件树中 `InitStoreContext` 之前的节点不可用 `useCesium()` 的 ctx（会是 undefined）。
3. **实体复用模式**：数据更新时 `entityCollection.getById(id)` 命中则只置 `entity.show = true`；effect 清理走隐藏（`show = false`）；组件卸载走真删除（`syncCache`）。写新的实体集合组件必须遵守此模式。
4. **Cesium ctx 存 WeakMap，不进 valtio 响应式**：`setCesiumContext` / `createRef.ts`。

---

## 2. 入口层

### 2.1 EarthViewer（`web/components/earth/index.tsx`）

业务级入口，`memo` 组件（L161）。导出（L163-172）：`EarthViewer`、`type TDataSource`、`type TProps as TEarthViewerProps`、`useClickAction`、`useDblClickAction`，并 `export * from './exports'`。

Props 类型 `TProps`（L12-81）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `imagerySettings?: any` | L13 | 底图瓦片配置（透传） |
| `initConfig: TIinitConfig` | L15 | 必填初始化配置 |
| `cityAssetList?: Array<string>` | L20 | 显示的资源 Id 数组（组 Id） |
| `flyToIds?: Array<string>` | L26 | 飞向对象的 ids 集合 |
| `cameraPosition?: Array<number>` | L33 | `[longitude, latitude, height]`；不传用 initConfig.cameraPosition |
| `dataSource?: TDataSource` | L38 | 数据源（model/line 混合） |
| `labelMarkers?: Array<{id, ...}>` | L43 | 标记点（顶牌）设置 |
| `relationLinks?: Array<TLineEntitySetting>` | L48 | 关联的线 |
| `contextRef?: TContextRef` | L53 | 命令式上下文 ref |
| `onRightClick / onDoubleClick / onClick / onMouseEnter / onMouseLeave` | L58-78 | 事件回调（均为 any） |

处理流程：

1. L89-93 `useEffect`：`initConfig` 非空且未初始化 → `earthStore.init({ cityDataAssets: props.initConfig.cityDataAssets })` + `setState({ isInitialized: true })`。
2. L95-101：初始化后 `earthStore.setOption({ cityAssetList, flyToIds })`。
3. L103-134 `useMemo`（依赖 `[props.dataSource, state.isInitialized]`）：按 `item.type` 拆分：
   - `'model'`（L111-121）：到 `initConfig.modelList.find(model => model.sourceType === item.modelType)` 找资产，找到则把 `sourceFile` 注入 `setting.url` 后 push 进 `modelDataSource`；找不到则**丢弃该项**。
   - `'line'`（L122-123）：直接 push 进 `lineDataSource`。
4. L136：未初始化返回 `null`。
5. L138-158：渲染 `EarthRenderer`，`onCityLoaded` 桥接 `earthStore.setCityLoaded`（L147-149）；children 内放 `<HelperInitCameraFlyTo position={props.cameraPosition ?? get(props, 'initConfig.cameraPosition')} />`（L156）。

### 2.2 EarthApiLoader（`web/components/earth/EarthApiLoader.tsx`）

远程库加载 Provider，包装 `RemoteModuleLoaderProvider`（L4-14）：

- js：`${constants.MICRO_APP_URL}/libs/cesium/gis3d-lib.umd.js`（L7）
- importFields：`['CesiumLib', 'ReactCesiumLib', 'CesiumMap', 'ReactEarthLib']`（L8）
- css：`${MICRO_APP_URL}/libs/cesium/Widgets/widgets.css`（L9）

仅接收 `props.children`，其余配置硬编码。

### 2.3 EarthRenderer（`web/components/earth/EarthRenderer.tsx`）

组合 `EarthApiLoader`（L8-12，重复传了相同 jsUrl/importFields/cssUrl，冗余但一致）+ `EarthStage`（L13-30），透传 `imagerySettings / markerLabelSettings / onCityLoaded / modelDataSource / lineDataSource / labelMarkers / relationLinks` + 5 个鼠标事件 + `contextRef / onContextCreate / children`。

### 2.4 exports.ts（`web/components/earth/exports.ts`）

二级导出桶（L5-9）：`usePostProcessing`（stage/post-processing）、`executable`（utils）、`EarthStageRoot`（stage/EarthStageRoot）。经 `index.tsx#L174` 的 `export *` 成为公共 API。

### 2.5 utils.ts（`web/components/earth/utils.ts`）

```ts
const executable = <T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>) => {
    if (isFunction(fn)) {
        return fn(...args) as ReturnType<T>;
    }
};
```
（L3-7）安全调用：fn 非函数时静默返回 undefined。全组件族的标准「可选回调调用器」。

---

## 3. 类型定义（`web/components/earth/types.ts`）

类型来源：`ReactCesiumLib = typeof import('@fedx-gis3d/react-cesium')`（L5）、`CesiumLib = typeof import('cesium')`（L6）。导出（L146-158）：`ReactCesiumLib、CesiumLib、Cesium、TIinitConfig、TDataSource、TContextRef、TUserData、TEntityBaseSettings、TLineEntitySetting、TPolygonEntitySetting`。

### TIinitConfig（L8-94）

| 字段 | 结构 |
| --- | --- |
| `cameraPosition?: Array<number>` | L12 |
| `cityDataAssets: Array<{ id: string; name?: string; assets: Array<{ name; id; type: 'building'\|'road'\|'water'; url: string; style?: { stroke?; strokeWidth?; fill?; color? } }> }>` | L17-74 |
| `modelList: Array<{ sourceFile: string; sourceType?: string }>` | L79-82 |
| `markerLabelSettings: Array<{ twinSourceType: string; image: string; format?; height?: number; showLabel?: boolean }>` | L87-93 |

### 实体设置类型

- `TEntityBaseSettings`（L96-100）：`{ twinSourceType: string; id: string; name?: string }`
- `TModelEntitySetting`（L102-107）：`& { type: 'model'; modelType: string; position: { longitude, latitude, height? }; setting?: Omit<Cesium.ModelGraphics.ConstructorOptions, 'uri'|'color'> & { url: string; color: string } }`
- `TLineEntitySetting`（L109-118）：`& { type: 'line'; positions: Array<{longitude, latitude}>; setting?: { color?; radius?; image?; repeat: Number[] } }` —— **注意 L116 `repeat: Number[]` 为包装类型，疑为笔误（应为 `number[]`），且为必填**
- `TPolygonEntitySetting`（L120-127）：`& { type: 'polygon'; positions; setting?: { color?; fill? } }`
- `TDataSource`（L129）：`Array<TModelEntitySetting | TLineEntitySetting>`
- `TContextRef`（L131-135）：`React.RefObject<{ flyTo: (...params: Parameters<Cesium.Viewer['flyTo']>) => void; color: (color: string) => Cesium.Color; postProcessStage: TPostProcessingContext }>`
- `TUserData`（L137-144）：`{ state?: { hasAlarm?: boolean; alarmLevel?: any; [k]: any }; [k]: any }`

---

## 4. hooks

### 4.1 useGis3dLib / useCesium（`web/components/earth/hooks/useGis3dLib.ts`）

```ts
export const useGis3dLib = () => {
    return useRemoteModulesSelector<ExportGis3dLib>((remoteModules) => ({
        Cesium: remoteModules.CesiumLib,
        mapService: remoteModules.CesiumMap,
        ...remoteModules.ReactCesiumLib,   // Viewer / Entity / GeoJsonDataSource 等组件与 useCesium
        ...remoteModules.ReactEarthLib,    // GeojsonBuilding 等
    }));
};  // L11-20
export const useCesium = () => useGis3dLib().useCesium();  // L22
```

`ExportGis3dLib` 类型（L4-9，未导出）：`{ Cesium: CesiumLib; mapService: any } & ReactCesiumLib & { GeojsonBuilding: any }`。

**用法约定**：解构获取组件与类，如 `const { Viewer, Cesium, mapService } = useGis3dLib()`（`web/components/earth/stage/EarthStageRoot.tsx#L62`）；ctx 用 `const ctx = useCesium()`，ctx 含 `viewer / scene / camera / entityCollection / dataSourceCollection`（见 Editor.ts#L82-93 的实际使用）。

### 4.2 useSubscribeKeyState（`web/components/earth/hooks/useSubscribeKeyState.ts`）

```ts
useSubscribeKeyState<T extends object, K extends keyof T>(proxyObject: T, key: K, initialState?: T[K]): T[K]
```
（L6-10）实现：`useState(get(proxyObject, key, initialState))`（L11）初始化；`useEffect`（空依赖，L15-21）内 `subscribeKey(proxyObject, key, setState)`。**订阅 key 在挂载时固定**（useLatest 固化），运行期不可变。

**嵌套订阅写法**：订阅嵌套对象的 key 要传父 proxy，如 `useSubscribeKeyState(earthStore.loader, 'citiesLoaded')`（`web/components/earth/stage/city/FlyToCityDataSource.tsx#L11-L12`）。

### 4.3 useClickAction（`web/components/earth/hooks/useClickAction.ts`）

`useClickAction(option: TOption)`（L28），`TOption = { onClick?; onDblClick?; dblclickInterval?: number /* 默认 300 */ }`（L5-13）。返回 `{ onClick, onDblClick }`（L51-54）。

- `handleClick`（L32-43）：先清除已有 clickTimer，再 `setTimeout(interval)` 延迟触发 onClick。
- `handleDblClick`（L45-49）：清除 clickTimer（吞掉待触发的单击）后立即执行 onDblClick。
- 回调经 `useLatest` 取最新（L29），handler 经 `useMemoizedFn` 稳定引用。官方用例见 L17-26。

### 4.4 useDblClickAction（同文件 L71-98）

在**只有 onClick 事件**的组件上模拟双击。`handleDblClick`（L74-94）：`Date.now()` 时间戳判断，`now === preClick` 同帧重复直接 return（L81-83）；`now - preClick < interval` 时 `requestAnimationFrame` 触发 onDblClick（L86-90）。

---

## 5. store（`web/components/earth/store/`）

### 5.1 earthRendererStore（`web/components/earth/store/EarthRenderer.ts`）

`export const earthRenderer = proxy(new EarthRendererStore())`（L104）；`store/index.tsx` 以 `earthStore` 与 `earthRendererStore` 双别名导出（`web/components/earth/store/index.tsx#L1-L3`）。

公开状态字段：

| 字段 | 初值 | 写入方 | 读取方 |
| --- | --- | --- | --- |
| `cameraInitialized` | `false`（L14） | `HelperInitCameraFlyTo` complete 回调（InitCameraFlyTo.tsx#L22） | FlyToCityDataSource、ModelCollection |
| `cityAssets` | `[]`（L15） | `#fetchCityGeojson`（L79） | CityRenderer（订阅渲染） |
| `loader.citiesLoaded / citiesLoadedCounter` | `false / 0`（L18-21） | `setCityLoaded` | FlyToCityDataSource |
| `showCityAssetListValues` | `[]`（L89） | `setOption` | CityShow |
| `flyToIds` | `[]`（L90） | `setOption` | FlyToCityDataSource、ModelCollection |
| `markerLabelIds` | `[]`（L98） | `showMarkerLabel(ids)` | （通用层暂无消费方） |

方法：

- `setCityLoaded(loaded: boolean)`（L25-30）：写 `loader.citiesLoaded`；`loaded===true` 时 `citiesLoadedCounter++`（下游用计数器感知重新加载）。
- `init(initConfig)`（L32-34）：写私有 `#cityDataAssets`。
- `setCesiumContext(context)`（L36-38）：`setRef(this, { cesiumContext: context })` 存 WeakMap。
- `setConfig(config)`（L85-87）：入口，直接调 `#fetchCityGeojson(config)`。
- `setOption(option = {})`（L91-96）：写 `showCityAssetListValues`；`flyToIds` 归一为数组并过滤 `isNil`（L95）。

`#fetchCityGeojson(config)`（L40-82）完整流程：

1. `showCityAssetList` 为空 → 清空 `#state.showCityAssetList` 与 `cityAssets` 并 return（L41-45）。
2. 与上次列表 `isEqual` 相同则跳过（L47）。
3. 不同则 `cloneDeep` 记录新列表（L48），从 `#cityDataAssets.filter(d => showCityAssetList.includes(d.id))` 过滤选中城市（L49），`reduce` 展开各项 assets 并附 `groupId / groupName`（L50-61）。
4. 先置 `cityAssets = []`（L63），再 `Promise.allSettled(assets.map(item => d3.json(item.url)))`（L64）：
   - fulfilled → push `{ meta, id: meta.id, geoJson: pick(item.value, ['type', 'features']) }`（L69-73）
   - rejected → `console.log('%c[geojson 加载异常]', 'color:red;', ...)`（L75）
5. 结果赋 `this.cityAssets = cityAssets`（L79）。

### 5.2 EditorStore（`web/components/earth/store/Editor.ts`）

`export const editor = proxy(new EditorStore())`（L99）。

状态（L12-28）：

- `editor = { panelType: null }`
- `city = { cityDataList: Array<{label, id}>, cityDataAssets: any[], cityDataState: { selectedCityList: [], showSelectedCityList: false } }`
- `layer = { cityData: [] }`

方法：

- `init({ cityDataList, cityDataAssets })`（L33-36）
- `setCesiumContext(cesiumContext)`（L38-40）：WeakMap 存 ctx
- `saveSelectedCityData()`（L42-50）：`// FIXME: 这只是个想法` —— 仅计数器自增 + 竞态检查占位，**无实际保存逻辑**
- `updateLayerCityData(selectedCityList)`（L52-55）：按选中城市过滤 `city.cityDataAssets` 写 `layer.cityData`
- `commitCityDataState(state: Partial<{selectedCityList, showSelectedCityList}>)`（L57-79）：不可变更新（`{ ...this.city.cityDataState }` → 赋回 L78）；`selectedCityList` 用 `Object.is` 判变（L60-63），变化时**同步联动** `updateLayerCityData`（L65）+ `earthRenderer.setConfig({ cityList: state.selectedCityList })`（L66）—— 这是编辑器 → 渲染器的联动通道。**注意 L66 传的 key 是 `cityList`，而 `#fetchCityGeojson` 读的是 `config.showCityAssetList`，两者不匹配，该联动实际不会触发拉取**（源码事实）。
- `flyToDataSource({ name?, index? })`（L81-96）：`getRef(this, 'cesiumContext')` 取 ctx；`ctx.dataSourceCollection.getByName(item.name)`（L84），查不到且有 `index` 时回退 `get(item.index)`（L88-90），命中则 `ctx.viewer.flyTo(target)`（L92）。

### 5.3 createRef（`web/components/earth/store/createRef.ts`）

模块级 `const RefMapping = new WeakMap()`（L3）。

- `setRef(context, properties)`（L5-8）：以 store 实例为键合并存入。
- `getRef<T>(context, keyPath?)`（L10-14）：keyPath 为字符串时 `get(ref, keyPath)`，否则返回整个引用。

用途：Cesium ctx 等大对象不进 valtio 响应式系统（避免 proxy 包裹与订阅风暴）。

---

## 6. helpers：HelperInitCameraFlyTo（`web/components/earth/helpers/InitCameraFlyTo.tsx`）

渲染为 `null` 的纯副作用组件（L27）：

- `useRef` 记录上次 position（L10）；effect 依赖 `[ctx, props.position]`（L25）。
- L13：与上次 `isEqual` 或不是数组则跳过。
- L19-24：`ctx.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height), complete: () => { earthStore.cameraInitialized = true; } })`。

**开发要点**：`cameraInitialized` 是所有自动 flyTo（FlyToCityDataSource、ModelCollection）的前置闸门；若业务不传 cameraPosition，需自行保证该标记被置位，否则自动飞行永不触发。

---

## 7. stage 舞台层（`web/components/earth/stage/`）

### 7.1 组件树（EarthStageRoot.tsx#L167-197）

```
section.earth-stage-root（key=renderCounter，重建时强制重挂）
└ div.earth-stage-container
  └ Viewer（ViewerDefaultProps + 底图 ProviderViewModel 列表 + 5 个鼠标事件）
    └ InitStoreContext（ctx 写入 store；未初始化时返回 null 阻断子树）
      ├ StageScene（相机控制器重置 / 底色 / 初始视角）
      ├ ArcGisSceneServer（I3S）
      └ PostProcessingProvider（silhouette 轮廓后处理）
        └ ContextRef（forwardRef：flyTo / color / postProcessStage）
          └ children（各实体集合组件）
```

### 7.2 EarthStageRoot（`web/components/earth/stage/EarthStageRoot.tsx`）

Props（L45-60）：`className / imagerySettings / sceneServerSettings / initialCameraPosition / baseColor / onRightClick / onClick / onDoubleClick / onMouseEnter / onMouseLeave / contextRef / onContextCreate / children`（全为 any）。

关键机制：

- `TileTypeEnum`（L17-23）：`'amap:img'=0, 'amap:elec'=1, 'arcGis'=2, 'webMapTile'=3, 'urlTemplate'=4`；L66-67 把 `imagerySettings.tileType` 映射为 `selectedImageryProviderViewModel` 的索引，缺省 0（高德影像）。
- `ViewerDefaultProps`（L29-43）：`full: true, timeline/homeButton/infoBox/selectionIndicator/navigationHelpButton/projectionPicker/sceneModePicker/geocoder/animation: false, baseLayerPicker: true, baseLayer: undefined, shouldAnimate: true`；`index.less` 再隐藏剩余工具栏。
- `imageryProviderViewModels` useMemo（L72-165，依赖 `[latest]`）：构造 5 个 ProviderViewModel：
  1. 高德影像（L75-80）：`mapService.createAMapImageryProvider({ type: 'img' })`
  2. 高德电子（L81-89）：`type: 'elec'`
  3. ArcGis（L90-100）：解构 `tileUrl` 后 `Cesium.ArcGisMapServerImageryProvider.fromUrl(tileUrl, restConfig)`
  4. webMapTile（L101-141）：解构 `tileUrl/rectangle/tilingSchemeType/tilingSchemeOptions`；tilingScheme 动态构造 `new Cesium[tilingSchemeType](tilingSchemeOptions)`（L127-129）；rectangle 经 `Cesium.Rectangle.fromDegrees(west, south, east, north)`（L135）；最终 `new Cesium.WebMapTileServiceImageryProvider(omit(fullConfig, ['tileType']))`（L139）
  5. urlTemplate（L142-163）：`new Cesium.UrlTemplateImageryProvider(fullConfig)`，同样支持 rectangle
  - **creationFunction 内必须用 `latest.current.imagerySettings`（L70 useLatest）而非闭包捕获**，防止过期配置。
- **重建即重挂**：L73 `renderCounter.current += 1`，L170 `key={key-${renderCounter.current}}` —— useMemo 每次重算都会销毁重建整个 Viewer。
- `initializer.ts`（L3）：`import './initializer'`（L5）副作用设置 `window.CESIUM_BASE_URL = ${constants.MICRO_APP_URL}/libs/cesium`，必须在 Viewer 创建前执行。

### 7.3 EarthStage（`web/components/earth/stage/index.tsx`）

默认实体集合门面（L12-35）：在 `EarthStageRoot` children 中挂 `CityRenderer`（onCityLoaded）、`BillboardCollection`（key="billboard-markers"，models/tubeLines/markerLabelSettings/markers）、`TubeEntitiesCollection`、`ModelCollection`、`RelationsLink`、`props.children`。

**注意**：EarthStage 只透传 5 个鼠标事件（L15-19），**不透传** imagerySettings / sceneServerSettings / initialCameraPosition / baseColor / contextRef / onContextCreate —— 需要这些能力时直接使用 `EarthStageRoot`（金牌楼宇即如此）。

### 7.4 InitStoreContext（`web/components/earth/stage/common/InitStoreContext.tsx`）

- L13-17 `useEffect`（空依赖）：`earthStore.setCesiumContext(latest.current.ctx)` + `setState({ initialized: true })`。
- L19：未初始化返回 `null`，阻断下游（保证子组件 `useCesium()` 时 ctx 已入 store）。

### 7.5 StageScene（`web/components/earth/stage/scene/index.tsx`）

- L16 渲染期直接调用 `resetScreenSpaceCameraController(Cesium, ctx)`；L17 `resetGlobeBaseColor(Cesium, ctx, props.baseColor ?? '#fff')` —— 两者内部 WeakMap 保证每个 ctx 只执行一次。
- effect（L19-74）处理 `initialCameraPosition`（`{ position: [x,y,z], direction: [x,y,z], up: [x,y,z] }`，均为 Cartesian3 数组）：
  - position 长度 3 → `settings.destination = Cesium.Cartesian3.fromElements(...)`（L29-32）
  - direction / up → `set(settings, 'orientation.direction/up', Cartesian3.fromElements(...))`（L36-49，用 `@fedx-web-common/utils` 的 set）
  - L51 `if (!invalidateConfig) ctx.camera.setView(settings)` —— **`invalidateConfig` 在每段开头被重置为 true（L27/L34/L45），最终只反映 up 段的结果**；仅配 position 不配 up 时 setView 不会执行（源码事实，写配置时三段都要配）。
  - L55-68 调试便利：window click 且按住 ctrl 时打印 `{ position, direction, up }` 字符串，可直接复制为配置。

`resetScreenSpaceCameraController.ts`（L3-31）改写交互手势（WeakMap 一次性）：

- `rotateEventTypes = RIGHT_DRAG`（L11，注释写「左键旋转」与代码相反，实际是**右键旋转**）
- `tiltEventTypes = [LEFT_DRAG, PINCH, LEFT_DRAG+CTRL, RIGHT_DRAG+CTRL]`（L13-18）
- `translateEventTypes = LEFT_DRAG`（L20，实际**左键平移**）
- `zoomEventTypes = [WHEEL, PINCH]`（L21-25，RIGHT_DRAG 被注释掉）
- L27：移除 `LEFT_DOUBLE_CLICK` 默认追踪行为。

`resetGlobeColor.ts`（L3-13）：`ctx.globe.baseColor = Cesium.Color.fromCssColorString(color)`，WeakMap `baseColorChanged` 标志一次性。

### 7.6 ArcGisSceneServer（`web/components/earth/stage/arcgis-scene-server/index.tsx`）

effect 依赖 `[ctx]`（L46）：`sceneServerUrl` 为 nil 或无 scene 时跳过（L17）；`Cesium.I3SDataProvider.fromUrl(config.sceneServerUrl, { ...config })`（L27-29）加载成功后 `setTimeout(3000)` 延迟 add 到 `ctx.scene.primitives`（L31-36）。清理（L41-45）：cancelFlag 防竞态 + clearTimeout + removeList。

### 7.7 PostProcessing（`web/components/earth/stage/post-processing/PostProcessing.tsx`）

`TContext`（L8-15）：`{ silhouette: { current: CesiumLib.PostProcessStageComposite; save(primitive): () => void; restore(): void; remove(): void } }`。

`PostProcessingProvider`（L28-110）：

- `useCreation`（依赖 `[ctx]`，L34-92）构造 silhouette stage：
  - L37-41：`Cesium.PostProcessStageLibrary.createSilhouetteStage()`，`enabled=false`、uniforms.color 红色、`uniforms.length = 1`。
  - `save(primitive)`（L49-66）：push 进 `cesiumStage.selected` 并 `enabled = true`；**返回取消函数**（从 selected 过滤，selected 空则 enabled=false）。`destroyed || !primitive` 时返回空函数。
  - `restore()`（L67-70）：清空 selected。注意 L68 `if (destroyed) cesiumStage.enabled = false;` —— 只在 destroyed 时置 false，与命名语义存疑（源码事实）。
  - `remove()`（L71-78）：禁用 + 清空 + 从 postProcessStages 移除 + `destroyed = true`。
  - L80 加入 postProcessStages；L82-89 兜底 5ms 定时器：stage 不在集合中则再次 add。
- `useUnmount`（L101-105）：`ctx.scene.postProcessStages.removeAll()`。
- L107：`!ctx || isEmpty(stages)` 返回 null —— **会阻断子树（含 ContextRef 与业务 children）**。
- `usePostProcessing()`（L112-114）：`useContext(PostProcessingContext)!`。
- 导出 `type TContext as TPostProcessingContext`（L116-119）。

### 7.8 ContextRef（`web/components/earth/stage/context-ref/index.tsx`）

`forwardRef`（L6）暴露命令式 API：

- `flyTo(target, ...args)`（L14-18）：转发 `viewer.flyTo`（viewer/target 存在时）。
- `color(color: string)`（L19）：`Cesium.Color.fromCssColorString(color)`。
- `postProcessStage`（getter，L21-23）：来自 `usePostProcessing()`。
- `useImperativeHandle(ref, () => latestContext.current, [ctx])`（L26-32）；`onContextCreate(context)` 就绪时回调一次（L34-38，空依赖 effect）。

### 7.9 CityRenderer（`web/components/earth/stage/city/index.tsx`）

- L18：`useSubscribeKeyState(earthRendererStore, 'cityAssets')` 订阅城市资产。
- L20-26 `useCreation`（依赖 `[cityAssets]`）：`loadedCached = { count: cityAssets?.length || null, loadedCount: 0 }`。
- L28-32 `onLoaded`：每层加载完调用一次，`props.onLoaded(count === loadedCount)`（全部完成才 true）。
- L34-63 `formattedCityAssets`：把 `meta.style` 的 `stroke/fill/color` CSS 串转 `Cesium.Color.fromCssColorString`。
- L65-69：cityAssets 为空时重置 loadedCount 并 `executable(props.onLoaded, true)`（注释掉的 `// return null;`，仍继续渲染）。
- L73-100：`meta.type === 'building'` → `GeojsonBuilding`（props: style 展开、`name={city.id}`、geoJson、onLoad）；否则 `GeoJsonDataSource`（data=geoJson）。
- L101-102：附带渲染 `<FlyToCityDataSource />` 与 `<CityShow />`。

**CityShow**（`web/components/earth/stage/city/CityShow.tsx#L6-L17`）：订阅 `earthStore.showCityAssetListValues`，isEqual 去重 + cloneDeep 后 `earthStore.setConfig({ showCityAssetList })` —— store 状态 → setConfig 的响应式桥。

**FlyToCityDataSource**（`web/components/earth/stage/city/FlyToCityDataSource.tsx#L7-L47`）：订阅 `citiesLoaded / citiesLoadedCounter / flyToIds / cameraInitialized`（L11-14）；L17 前两个闸门不满足直接返回；L21 ids 与缓存相同或为空跳过；L23-40 rAF 内新建 `Cesium.EntityCollection`，按 id `ctx.dataSourceCollection.getByName(id)` 取 dataSource 并把所有 entity 复制进 collection，length>0 时 `ctx.viewer.flyTo(collection)`；L41-43 清理 rAF。

### 7.10 ModelCollection（`web/components/earth/stage/model-collection/index.tsx`）

Props（L9-20）：`dataSource: Array<{ id: string; type: string; position: {longitude, latitude, height?}; setting: Omit<ModelGraphics.ConstructorOptions,'uri'|'color'> & { url: string; color: string } }>`。

主 effect（L36-92，依赖 `[dataSource, entityCollection, viewer]`）：

- L37 守卫：dataSource 空 / entityCollection 缺失 / `viewer.isDestroyed()` 跳过。
- 每项：L45 `entityCollection.getById(item.id)`；命中 → `entity.show = true`（L57-58）；未命中 → 组装 modelSetting（`uri: item.setting.url`、`scale: item.setting?.scale ?? 1`（L47-51）；`'color' in modelSetting` 时转 `Cesium.Color.fromCssColorString`（L53-55））→ new Entity + add（L60-72）→ **真 remove 闭包压入 `syncCache.current.cache`**（L73-75）。
- L80-82：**隐藏闭包**（`show = false`）压入 removeList，effect 清理时执行。
- L85：`setState({ currentEntities })`。

自动飞行 effect（L95-111）：`flyToIds` 非空时筛选命中实体（`entity.id || entity._id`，L104），`viewer.flyTo(collection.values.length > 0 ? collection : state.currentEntities)`（L110）—— 未指定 ids 则飞向全部。

卸载清理 effect（L113-124）：执行 `syncCache.current.cache` 的真 remove 并清空。

### 7.11 TubeEntitiesCollection（`web/components/earth/stage/tube-collection/index.tsx`）

- `computeCircle(Cesium, radius = 10)`（L11-18）：360 点 `Cartesian2` 圆，作 polylineVolume 横截面。
- Props（any）：`dataSource: Array<{ id, positions: [{longitude, latitude}], setting: { radius, color, materialType, image, repeat, evenColor, oddColor } }>`。
- 主 effect（L27-99，依赖 `[props.dataSource, entityCollection]`）：与 ModelCollection 相同的复用/双层清理模式。未命中时：
  - L40-46 构造 `polylineVolume`：positions fromDegrees、`shape: computeCircle(Cesium, setting.radius)`、`granularity: RADIANS_PER_DEGREE * 0.1`。
  - L48：主色 `Cesium.Color.fromCssColorString(setting.color ?? 'yellow')`。
  - L50-53 材质类型：`setting.materialType ?? 'color'`；**`setting.image` 非 nil 时强制 image**。
  - 三态（L55-74）：image → `ImageMaterialProperty`（repeat 默认 `[100, 0]`）；strip → `createSingleColorStripeMaterialProperty`（VERTICAL）；color → `ColorMaterialProperty`。
- 导出（L113-118）：`TubeEntitiesCollection / computeCircle / createSingleColorStripeMaterialProperty`。

**StripeMaterialProperty**（`web/components/earth/stage/tube-collection/StripeMaterialProperty.ts#L4-L68`）：`createSingleColorStripeMaterialProperty<TOptions>(Cesium, options & { color })` 内部动态定义 `class StripeMaterialProperty extends Cesium.StripeMaterialProperty`：

- constructor（L9-25）：super(options)，维护 `this.state = { color, oddColor, evenColor, offset: 0, offsetAnimateFlag: false }`。
- `setStateColor`（L27-38）：evenColor/oddColor 任一为空且 color 存在时，`d3.color(color.toCssHexString ? color.toCssHexString() : color)` 取 `darker(2)` / `brighter(1)` 生成新色。
- `setStateOffset`（L49-56）：`this.offset = new Cesium.CallbackProperty(() => { if (offsetAnimateFlag) state.offset += 0.01; return state.offset; }, true)` —— 每帧滚动实现流动。
- `startOffsetAnimate / stopOffsetAnimate`（L58-65）：开关动画，stop 时 offset 归零。

### 7.12 RelationsLink（`web/components/earth/stage/relations-link/index.tsx`）

effect（L15-71，依赖 `[entityCollection, props.dataSource]`）：已有实体 `show=true` 复用；否则构造 `polyline`（L28-35：positions fromDegrees、**`width: setting.radius`（polyline 宽度，非 3D 管体）**）+ `createSingleColorStripeMaterialProperty` 材质并 `material.startOffsetAnimate()`（L47）开启流动。清理走**真 remove**（L60-62，非隐藏）。

### 7.13 BillboardCollection（`web/components/earth/stage/billboard-collection/index.tsx`）

Props：`models`（模型数据）、`tubeLines`（管线数据，L23 与 models 合并为节点池）、`markers`（要显示顶牌的节点 `{id}` 数组）、`markerLabelSettings`。

effect（L22-113，依赖 `[props.markerLabelSettings, props.markers]`）：

- L25：markers 或 nodes 为空直接返回。
- L29-38：过滤 markers 命中节点，改 id 为 `label-marker-${node.id}`（**注意 L70 实际 add 时用的是 `node.id` 原始 id**）。
- L49-52：按 `twinSourceType` 匹配 markerLabelSettings，找不到回退 `twinSourceType === 'default'` 项。
- L56-59：文案 `markerSetting.format ? formatString(markerSetting.format, node) : node.name`。
- L61-62：`billboardHelper.measureTextWidth(labelText, '60px Microsoft YaHei bold')` 量文本宽。
- L64：`DistanceDisplayCondition(10, 1.5e7 * 0.1)`。
- L66-105：`billboardHelper.imageLoader(markerSetting.image)` 异步加载背景图，成功后 `entityCollection.add`：
  - position：`fromDegrees(longitude, latitude, markerSetting.height ?? 0)`
  - billboard（L76-86）：`width: textWidth * 1.1`、`scaleByDistance: NearFarScalar(1.5e2, 1.0, 1.5e7, 0.4)`、`scale: 0.4`、`eyeOffset: (0,0,-1)`、`disableDepthTestDistance: 1`
  - label（L87-99）：`show: markerSetting.showLabel ?? true`、font、`pixelOffset (0,-5)`、`pixelOffsetScaleByDistance / scaleByDistance`、`eyeOffset (0,0,1)`
- L109-112：清理 `abort = true` 防竞态 + removeEntity 队列。

**billboardHelper**（`web/components/earth/stage/billboard-collection/billboardHelper.tsx#L34-L39`）：`measureTextWidth(text, font)`（L4-9，模块级离屏 canvas）、`imageLoader(url)`（L14-32，url → Promise 双缓存；返回类型标注 `Promise<HTMLCanvasElement>` 但实际 resolve `HTMLImageElement`，L31）。`ImageLoader.ts` 为其逐行同构的未引用副本。

---

## 8. 通用层横切数据流（开发时按此追问题）

```
初始化：initConfig → earthStore.init(cityDataAssets)
配置：  cityAssetList/flyToIds → earthStore.setOption
         showCityAssetListValues ──(CityShow 响应桥)──> earthStore.setConfig({ showCityAssetList })
         → #fetchCityGeojson（d3.json + allSettled）→ cityAssets
渲染：  cityAssets → CityRenderer（GeojsonBuilding / GeoJsonDataSource）
         → onLoaded（每层一次）→ EarthViewer.onCityLoaded → earthStore.setCityLoaded
飞行：  HelperInitCameraFlyTo complete → cameraInitialized = true
         （citiesLoaded && cameraInitialized && flyToIds）→ FlyToCityDataSource / ModelCollection flyTo
ctx：   Viewer → InitStoreContext → earthStore.setCesiumContext（WeakMap）→ useCesium()
命令式： contextRef / onContextCreate → { flyTo, color, postProcessStage.silhouette }
```

## 9. 通用层已知问题（源码可证）

| 位置 | 问题 |
| --- | --- |
| `web/components/earth/types.ts#L116` | `repeat: Number[]` 包装类型疑为笔误（应为 `number[]`），且为必填 |
| `web/components/earth/EarthRenderer.tsx#L9-L11` | 与 `EarthApiLoader.tsx#L7-L9` 重复硬编码远程库配置 |
| `web/components/earth/store/Editor.ts#L66` | `setConfig({ cityList })` 与 `#fetchCityGeojson` 读的 `showCityAssetList` 键不匹配，编辑器选中城市实际不会触发 GeoJSON 拉取 |
| `web/components/earth/store/Editor.ts#L42-L50` | `saveSelectedCityData` 为 FIXME 占位 |
| `web/components/earth/stage/post-processing/PostProcessing.tsx#L68` | `restore` 中 `if (destroyed) enabled = false` 条件方向与命名语义存疑 |
| `web/components/earth/stage/scene/index.tsx#L27/L34/L45/L51` | `invalidateConfig` 被 up 段覆盖，仅配 position 不配 up 时 `setView` 不执行 |
| `web/components/earth/stage/scene/resetScreenSpaceCameraController.ts#L11、L20` | 注释（左键旋转/右键平移）与代码（右键旋转/左键平移）相反 |
| `web/components/earth/stage/billboard-collection/index.tsx#L35` | `label-marker-${id}` 改写未用于 L70 实际 add（用原始 id） |
| `web/components/earth/stage/billboard-collection/billboardHelper.tsx#L31` | 返回类型标注 `Promise<HTMLCanvasElement>`，实际 resolve `HTMLImageElement` |
| `web/components/earth/stage/billboard-collection/ImageLoader.ts` | 未被引用的重复实现 |
| `web/components/earth/stage/city/index.tsx#L67` | cityAssets 为空时每次渲染都调 `onLoaded(true)`（无去重） |
