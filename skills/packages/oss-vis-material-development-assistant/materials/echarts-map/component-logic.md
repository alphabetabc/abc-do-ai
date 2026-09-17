---
title: 组件逻辑维护
description: echarts-map 组件代码（index.jsx + map.jsx + options.ts）的维护要点
version: 1.0.0
last_updated: 2026-09-17
---

# 组件逻辑维护

本文档说明 `echarts-map` 组件代码（`index.jsx` + `map.jsx` + `options.ts`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
echarts-map/
├── index.jsx              # 顶层入口（✅ 实际加载）：加载 map-config.json + geoHelper + DataStatus 错误态
├── map.jsx                # 核心渲染组件：state 管理、地图钻取、事件派发
├── options.ts             # ECharts option 构造器（含 getOption/convertColorMapOption/getBottomRegionGeoJson/ZoneLevelEnum）
├── schema.ts              # 配置面板（→ schema.md）
├── dataModel.json         # 数据契约（→ data-model.md；⚠️ oss-material.json 中 dataModel 字段为 ""）
├── oss-material.json      # 物料元信息（main: "./index.jsx"）
├── index.less             # 容器样式（.echarts-map-container / .back / .echarts-map-wrapper / .data-source-switch）
├── schema/
│   ├── share.ts           # SubValueDecoration 枚举（千分位 / 小数 / 百分比）
│   └── defaultValues.ts   # mapOutlineStyle / areaLevelColor 默认值
└── doc/
    ├── README.md          # 用户向文档
    └── CHANGELOG.md       # 仅 0.0.1（2023-07-17）
```

## 2. 顶层入口 `index.jsx`

### 2.1 职责

`index.jsx` 只做 3 件事：

1. 并行加载 `map-config.json`（区域字典）和 `geoHelper`（地理工具 UMD 包）；
2. 用 `DataStatus` 包住真正的渲染组件 `Map`；
3. 把加载结果作为 props 透传给 `Map`。

### 2.2 加载逻辑

```jsx
const mapConfigLoader = designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL, () => loadJSON(`${constants.STATIC_PATH}/map/map-config.json`));

const loadGeoHelper = designer.utils.remoteModuleFetcher({
    url: `${_.get(designer, 'env.visualMaterialConfig.url')}/static/vendors/geo-helper/index.umd.js`,
    importFields: ['geojsonOutline', 'geojsonRewind', 'turf'],
});

Promise.all([loadGeoHelper, mapConfigLoader]).then(([geoHelper, res]) => {
    setState({
        initStatus: DataStatus.STATUS.SUCCESS,
        mapConfig: res.data,
        geoHelper,
    });
});
```

| 资源              | 来源                                                                     | 缓存 key                         |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------- |
| `map-config.json` | `${constants.STATIC_PATH}/map/map-config.json`                           | `CACHE_KEY.EC_MAP_CONFIG_SYMBOL` |
| `geoHelper` UMD   | `${env.visualMaterialConfig.url}/static/vendors/geo-helper/index.umd.js` | 无（每次重新加载）               |

### 2.3 `Map` 组件挂载

```jsx
<DataStatus status={state.initStatus}>
    <Map {...props} mapConfig={state.mapConfig} geoHelper={state.geoHelper} />
</DataStatus>
```

> ⚠️ **`geoHelper` 必须等 `SUCCESS` 才有值**，否则 `Map` 内 `geoHelper.turf.transformRotate()` 会报错。
>
> ⚠️ **`DataStatus` 是互斥渲染（不是遮罩）**：LOADING 期间 `<Map>` 根本不在 React 树中，只有 SUCCESS 才渲染 children。因此 `Map` 挂载时 `mapConfig` / `geoHelper` 必已就绪——不会出现"带着空 mapConfig 进入 `mapPath` useMemo"的场景。但 `designer.permissions` **不在这道门控内**，权限接口晚到时 `permissionZoneName` 可能为 undefined（详见 [gotchas.md § 19](./gotchas.md)）。另注意 `Promise.all` 无 `.catch`，加载失败会永远停留在 LOADING。

## 3. 核心组件 `map.jsx`

### 3.1 props 与签名

```jsx
const Map = (props) => {
    const { config, interaction, designer, mapConfig, customDataSourceApiConfig, receivedPropsParams, interactionProps } = props;
    const { constants, env, permissions, cache, api, utils } = designer;
    // ...
};
```

| props                       | 来源             | 用途                                                      |
| --------------------------- | ---------------- | --------------------------------------------------------- |
| `config`                    | schema           | 用户配置（含 `geo.*`、`width/height`）                    |
| `interaction`               | 框架             | `{ defined, dispatch }`                                   |
| `designer`                  | 框架             | 设计器上下文（constants/env/permissions/cache/api/utils） |
| `mapConfig`                 | `index.jsx` 注入 | 区域字典数组（含 adcode/level/parent/name/alias/cp）      |
| `geoHelper`                 | `index.jsx` 注入 | UMD 工具（turf/geojsonOutline/geojsonRewind）             |
| `customDataSourceApiConfig` | 框架             | 自管数据源配置（含 `dataType`、`${dataType}.params`）     |
| `receivedPropsParams`       | 框架             | 订阅的外部入参对象                                        |
| `interactionProps`          | 框架             | 当前页面的派发参数对象                                    |

### 3.2 关键 state

| state                     | 类型   | 用途                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------- |
| `option`                  | object | ECharts option                                                    |
| `dataSource`              | array  | 当前区域指标数据（自管数据源返回）                                |
| `mapInfo`                 | object | `{ currentName, currentId, currentLevel, parentName, drilldown }` |
| `innerApiParams`          | object | `{ regionId, regionName }`（注入到数据源 params）                 |
| `showBack`                | bool   | 是否显示返回上一层按钮                                            |
| `dataSourceSwitch.status` | 0/1    | 数据源切换状态（来自 `@Components/data-source-switch`）           |
| `preRequestParamsRef`     | ref    | 上次请求参数快照（用于 `isRequestParamsChanged` 短路）            |
| `preApiCancelTokenRef`    | ref    | 上次请求的 cancel token                                           |

### 3.3 关键 Hook

#### 3.3.1 自管数据 `getDataSource`（⚠️ 与一般物料不同）

```jsx
const getDataSource = (isRequestParamsChanged = () => true) => {
    const apiConfig = _.cloneDeep(latestConfig.current.customDataSourceApiConfig);
    const { dataType } = apiConfig;
    const { customDataSourceApiParams } = latestConfig.current.interactionProps;
    const config = _.cloneDeep(apiConfig[`${dataType}`]);

    if (config && config.params) {
        const { hasInvalidateParams } = api.buildCustomApiParams(
            config.params,
            { receivedPropsParams, customDataSourceApiParams, formatSubscribeValue: ... },
            (_key, value, keyPath) => {
                if (value === SYMBOL_DATA_SOURCE_SWITCH) {
                    _.set(config.params, keyPath, _.toString(Number(dataSourceSwitch.status)));
                }
            },
        );

        // 注入 regionId / regionName
        _.forEach(innerApiParams, (value, key) => {
            if (_.has(config.params, key)) _.set(config.params, key, value);
        });

        if (hasInvalidateParams) { setDataSource([]); return; }
        if (!isRequestParamsChanged(preRequestParamsRef.current, config.params)) return;

        preRequestParamsRef.current = _.cloneDeep(config.params);
        api.customDataSourceApi(dataType, { config, cancel: (c) => (preApiCancelTokenRef.current = c) })
            .then((res) => setDataSource(_.get(res, 'data.data') || _.get(res, 'data.viewItemData.rows')),
                  (err) => logger.default.debug(err));
    }
};
```

**关键点**：

-   数据源由物料**自管**，不经过 `props.dataSource`（详见 schema.md § 3）。
-   `SYMBOL_DATA_SOURCE_SWITCH` 是数据源切换占位符，会被替换为 `dataSourceSwitch.status`（'0' 或 '1'）。
-   `preApiCancelTokenRef` 用于组件卸载时取消未完成的请求。
-   触发条件：`useEffect([innerApiParams, interactionProps, dataSourceSwitch.status])`。

#### 3.3.2 定时刷新

```jsx
const { isRefresh = false, refreshTime = 100 } = customDataSourceApiConfig || {};
useEffect(() => {
    if (!customDataSourceApiConfig) return;
    let timer = null;
    if (isRefresh) {
        timer = setInterval(() => getDataSource(), refreshTime * 1000);
    }
    return () => {
        clearInterval(timer);
        preApiCancelTokenRef.current();
    };
}, [isRefresh, refreshTime]);
```

> ⚠️ **当前 `refreshTime` 默认 100 秒**，注意防止旧请求未结束又被覆盖（已有 cancel 机制）。

#### 3.3.3 地图底图加载 `mapPath`（useMemo）

```jsx
const mapPath = useMemo(() => {
    const mapCfg = _.find(mapConfig, { name: mapInfo.currentName }) || _.find(mapConfig, { alias: mapInfo.currentName });

    // 显示返回按钮的逻辑：非按权限加载，或省级以下用户
    if (!config.geo.permission || (config.geo.permission && Number(zoneLevel) < 3)) {
        setShowBack(mapCfg?.level !== 'province');
    }

    if (mapCfg) {
        let loaderGetter = () =>
            cache.cached(`MAP_CONFIG_SYMBOL_${mapCfg.adcode}`, () => loadJSON(`${constants.STATIC_PATH}/map/${mapCfg.level}/${mapCfg.adcode}.json`));

        // 区县下钻：从上一级（市）的 geoJson 中切出当前区县 features
        if (latestConfig.current.enableDrilldownBottomZone && mapInfo.currentLevel === 'city' && mapInfo.drilldown === true) {
            loaderGetter = () => getBottomRegionGeoJson(latestConfig.current.preMapName, mapCfg);
        }

        // 计算父级地图名（用于返回）
        let parentMapName = '';
        if (mapCfg.level !== 'province') {
            const parentMapCfg = _.find(mapConfig, { adcode: mapCfg.parent });
            parentMapName = parentMapCfg?.name;
        } else {
            parentMapName = mapCfg.name;
        }

        setMapInfo({ parentName: parentMapName, currentId: mapCfg.id, currentLevel: mapCfg.level });
        dispatchParams(mapCfg);
        setInnerApiParams({ regionId: mapCfg.id, regionName: mapCfg.name });
        return loaderGetter();
    }
    return null;
}, [mapInfo.currentName]);
```

**关键点**：

-   `mapInfo.currentName` 变化即重算（点地图、参数订阅、返回上一层 都会触发）。
-   区县下钻（`enableDrilldownBottomZone = true`）的底图**不是新文件**，而是从父级 geoJson 中 `filter` 出对应 adcode 的 features。
-   `dispatchParams` 每次切换地图都会派发（详见 § 3.3.5）。
-   `setInnerApiParams` 触发 `getDataSource` 自动按新 regionId/regionName 重新拉数据。

#### 3.3.4 渲染指标 `useEffect([mapPath, dataSource, config.geo, ...])`

```jsx
useEffect(() => {
    let abortFlag = false;
    if (mapPath) {
        mapPath.then((res) => {
            if (abortFlag) return;
            latestConfig.current.preMapName = mapInfo.currentName;

            // 1. 旋转 geoJson
            const geoJson = props.geoHelper.turf.transformRotate(res, config.geo?.rotateAngle ?? 0);

            // 2. 注册地图到 echarts
            echarts.registerMap(mapInfo.currentName, geoJson);
            registerMapOutline(mapInfo.currentName, geoJson, props.geoHelper);

            // 3. 转换为 ECharts 数据（带经纬度）
            const data = dataSource?.length > 0 ? convertData(dataSource, mapInfo.currentId) : [];

            // 4. 构造 option
            const options = getOption(config.geo, data, mapInfo.currentName, { mapConfig });
            setOption(options);
        });
    }
    return () => {
        abortFlag = true;
    };
}, [mapPath, dataSource, config.geo, mapInfo.currentName, mapInfo.currentId]);
```

**关键点**：

-   `turf.transformRotate(res, rotateAngle)` 用于支持整体地图旋转（如南海诸岛单独摆放）。
-   `registerMapOutline` 注册 `${mapName}-outline` 的描边图层。
-   `convertData` 把 `dataSource` 投影到当前区域的子集（`item.parent === currentId`）并补经纬度。

#### 3.3.5 派发参数 `dispatchParams`

```jsx
const dispatchParams = function (item) {
    if (item) {
        const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
        if (actionsParams.length > 0 && interaction?.dispatch) {
            interaction.dispatch({
                data: [
                    { fieldName: interaction.defined?.onClickId, state: item.id },
                    { fieldName: interaction.defined?.onClickName, state: item.name },
                    { fieldName: interaction.defined?.onClickLevel, state: ZoneLevelEnum[item.level] ?? null },
                ],
            });
        }
    }
};
```

> **派发时机**：每次 `mapPath` 重算时（即 `currentName` 变化时），都会把当前区域的 `id/name/level` 派发出去，不依赖点击。首次派发发生在 `Map` 挂载的 render 期，若下游组件首请求早于消费派发参数，会出现首屏请求缺参（详见 [gotchas.md § 18](./gotchas.md)）。

-   `ZoneLevelEnum` 把字符串 `level`（`'province'/'city'/'district'`）映射为数字（2/3/4）。`item.level` 来自 map-config.json，值异常时映射结果为 undefined、经 `?? null` 派出 `null`（详见 [gotchas.md § 16](./gotchas.md)）。
-   三个字段是一条 `dispatch` 一起发出的：**`onClickId` 能到达请求，证明整组派发已执行**（zoneLevel 不会单独漏发）。
-   `filter(Boolean)` 过滤的是 key 不是 value——只配任意一个字段，整组 3 条（含未配置字段的 `fieldName: undefined`）都会派发（详见 [gotchas.md § 17](./gotchas.md)）。

#### 3.3.6 点击事件 `onItemClick`

```jsx
const onItemClick = usePersistFn((item) => {
    const mapDrilldownLevel = ['province'];
    if (latestConfig.current.enableDrilldownBottomZone) mapDrilldownLevel.push('city');

    // 省级（和地市级，如果开启下钻）→ 进入下钻
    if (mapDrilldownLevel.includes(mapInfo.currentLevel)) {
        setMapInfo({ currentName: item.name, drilldown: true });
        return;
    }

    // 区县级 → 触发下钻弹窗
    let dataItem = item.data?.[ORIGINAL_DATA_KEY] ?? item.data;
    if (!dataItem && _.isArray(dataSource)) {
        dataItem = dataSource.find((d) => d.name === item.name);
    }
    drilldown(props, dataItem || {}, 'clickEvent');
});
```

**关键点**：

-   `usePersistFn` 保证事件回调引用稳定（ECharts `onEvents` 需要稳定引用）。
-   省级 → 下钻到市级；地市级（仅在 `enableDrilldownBottomZone=true` 时）→ 下钻到区县。
-   区县级（以及不在地图范围内的 element）→ 触发 Modal/Drawer 下钻弹窗（由 `interaction.defined.configurableEvent.clickEvent` 配置）。
-   `ORIGINAL_DATA_KEY` 是 `options.ts` 注入到 `colorMapOption` 的原始数据 key，用于在点击时拿原始对象。

#### 3.3.7 返回上一层 `onGoBackClick`

```jsx
const onGoBackClick = () => {
    setMapInfo({ currentName: mapInfo.parentName, drilldown: false });
};
```

把 `currentName` 改回 `parentName`，会触发 `mapPath` useMemo 重算，重新加载父级 geoJson。

#### 3.3.8 参数订阅 `useEffect([regionNameInteraction, regionNameInDrillDown, receivedPropsParams])`

```jsx
useEffect(() => {
    let regionName;
    // 优先级 1：当前页面派发（interactionProps.regionName）
    if (interactionProps && interactionProps?.regionName) {
        regionName = _.get(props, 'interactionProps.regionName');
    } else if (receivedPropsParams && interaction?.defined?.regionName) {
        // 优先级 2：下钻参数（receivedPropsParams + interaction.defined.regionName）
        const subscribeRegionName = interaction.defined.regionName;
        const { isSubscribeKey, subscribeKey } = utils.parseSubscribeParams(subscribeRegionName);
        regionName = receivedPropsParams[isSubscribeKey ? subscribeKey : subscribeRegionName];
    }

    if (regionName) {
        const name = _.isArray(regionName) ? regionName[0] : regionName;
        setMapInfo({ currentName: name });
    }
}, [regionNameInteraction, regionNameInDrillDown, receivedPropsParams]);
```

**关键点**：

-   支持外部组件（如筛选下拉框）通过 `regionName` 切换地图层级。
-   支持下钻参数（如点击省后，下钻到该省地图）。
-   数组值取第一个（适配下拉框组件）。
-   优先级：**当前页面派发 > 下钻参数**。

#### 3.3.9 地图背景 `mapBackgroundStyle`

```jsx
const mapBackgroundStyle = useMemo(() => {
    const result = { width: config.width || 500, height: config.height || 500 };
    if (config.geo?.backgroundImage) {
        const backgroundImage = config.geo?.backgroundImage;
        let bg = backgroundImage.find((d) => [mapInfo.currentId, `${mapInfo.currentId}`].includes(d.id)) || backgroundImage[0];
        if (!_.isEmpty(bg)) {
            Object.assign(result, {
                backgroundImage: `url(${getImageUrl(bg.image, { constants, env })})`,
                backgroundSize: `${_.get(bg, 'size.width', config.width)}px ${_.get(bg, 'size.height', config.height)}px`,
                backgroundPosition: `${_.get(bg, 'position.left', 0)}px ${_.get(bg, 'position.top', 0)}px`,
                backgroundRepeat: 'no-repeat',
            });
        }
    }
    return result;
}, [config.geo?.backgroundImage, constants, config.width, config.height, env, mapInfo.currentId]);
```

**关键点**：

-   地图背景图按 `currentId` 匹配，支持每个区域单独背景。
-   没匹配到时 fallback 到 `backgroundImage[0]`。
-   容器宽高由 `config.width/height` 决定（默认 500x500）。

### 3.4 渲染输出

```jsx
return (
    <div className="echarts-map-container">
        <Icon type="visual-manager-fanhui" className="back" antdIcon
              style={{ display: showBack ? 'block' : 'none', left: ..., top: ... }}
              onClick={onGoBackClick} />
        <ReactECharts ref={curRef} option={option} onEvents={{ click: onItemClick }}
                      style={mapBackgroundStyle} className="echarts-map-wrapper"
                      replaceMerge={['series', 'geo']} />
        {_.get(config, 'geo.dataSourceSwitch.enable', defaultDataSourceSwitch.enable) && (
            <DataSourceSwitch options={...} designer={designer}
                              status={dataSourceSwitch.status}
                              onChange={() => dataSourceSwitch.changeStatus()} />
        )}
    </div>
);
```

| 元素                      | 作用                                                   |
| ------------------------- | ------------------------------------------------------ |
| `<Icon className="back">` | 返回上一层（仅省级以下显示）                           |
| `<ReactECharts>`          | 主图。`replaceMerge: ['series', 'geo']` 防止全量重渲染 |
| `<DataSourceSwitch>`      | 数据源切换按钮（hover 时显示，详见 index.less）        |

### 3.5 维护检查清单

-   [ ] 不要修改 `Map` 与 `index.jsx` 的 props 注入约定，否则 `geoHelper/mapConfig` 会失效
-   [ ] 修改 `mapPath` 触发条件时要同步 `mapInfo.currentName` 的更新路径
-   [ ] 新增派发参数需同时修改 `dispatchParams` 和 `schema.interactions`
-   [ ] 调整区县下钻逻辑时同时修改 `mapPath` 的 `loaderGetter` 与 `options.getBottomRegionGeoJson`
-   [ ] 外部参数订阅变更需同时改 `regionName` 的优先级判断

## 4. `options.ts`：ECharts option 构造器

### 4.1 入口签名

```typescript
export const getOption = (geo: any, dataSource: any, mapName: any, extra: any) => { ... }
```

| 参数              | 来源                                 | 说明                                   |
| ----------------- | ------------------------------------ | -------------------------------------- |
| `geo`             | `config.geo`                         | 配置面板的 `geo.*` 所有字段            |
| `dataSource`      | `convertData(dataSource, currentId)` | 已带 `[lon, lat]` 的气泡数据           |
| `mapName`         | `mapInfo.currentName`                | 当前地图名（echarts.registerMap 用）   |
| `extra.mapConfig` | 顶层 `mapConfig`                     | 区域字典（`convertColorMapOption` 用） |

### 4.2 关键函数

#### 4.2.1 `registerMapOutline` / `getMapOutlineName`

```typescript
export const registerMapOutline = (mapName: string, geojson: any, geoHelper: any) => {
    ec.registerMap(`${mapName}-outline`, geoHelper.geojsonOutline(geojson));
};
const getMapOutlineName = (mapName: string) => `${mapName}-outline`;
```

用 `geojsonOutline` 把 geoJson 转成只包含边界线的图层，作为主图层的描边。

#### 4.2.2 `convertColorMapOption`（级别色地图 series）

```typescript
const convertColorMapOption = (dataSource: any, levelColors: any = [], config: any) => {
    if (!config.enable || _.isEmpty(dataSource) || !_.isArray(dataSource)) return null;
    const { geoJSON: currentMapGeojson } = ec.getMap(config.mapName);
    const { color: defaultColor } = levelColors.find((c) => ['default', '0'].includes(_.toString(c.colorField))) || { color: '#23b7e5' };
    return {
        ...(config.geo || {}),
        type: 'map',
        map: config.mapName,
        selectedMode: false,
        data: dataSource
            .map((d) => {
                const highestLevel = getHighestLevel(d); // 1-4 中最小的非 0 值
                const colorCfg = levelColors.find((c) => _.toString(c.colorField) === _.toString(highestLevel));
                const { color = defaultColor } = colorCfg || {};
                const item = _.find(config.mapConfig, { id: d.id });
                if (!item) return null;
                const currentMapItem = _.find(currentMapGeojson.features, { properties: { adcode: item.adcode } }) ?? {};
                return {
                    name: _.get(currentMapItem, 'properties.name', d.name),
                    label: { show: false },
                    itemStyle: { ..._.omit(_.get(config, 'geo.itemStyle', {}), omitItemStyleProperties), areaColor: color, color },
                    [ORIGINAL_DATA_KEY]: d, // 注入原始数据供点击事件取用
                };
            })
            .filter(Boolean),
    };
};
```

**关键点**：

-   当 `mapStyle.enableAreaColorLevelControl = true` 时启用，按 `level1/2/3/4` 字段取值。
-   `getHighestLevel` 取 `level1~4` 中**最小**的非零数字（值越小等级越高）。
-   缺失的 `colorField` 项 fallback 到 `default`/`0`/`'#23b7e5'`。
-   `ORIGINAL_DATA_KEY` 是 `options.ts` 注入到 series.data 的特殊字段，**点击时通过 `item.data[ORIGINAL_DATA_KEY]` 还原原始数据**。

#### 4.2.3 引线模式 `dataSource` 重写

```typescript
let data = [] as any;
let points = [] as any;
let lines = [] as any;

if (labelLine) {
    _.forEach(dataSource, (item) => {
        const line = _.find(labelLine, { id: item.id }) || _.find(labelLine, { id: String(item.id) });
        if (line) {
            lines.push({
                coords: [
                    [line.lineStart.lon, line.lineStart.lat],
                    [line.lineEnd.lon, line.lineEnd.lat],
                ],
            });
            points.push({ name: item.name, value: [line.lineStart.lon, line.lineStart.lat] });
            data.push({ ...item, value: [line.point.lon, line.point.lat] });
        } else {
            data.push(item);
        }
    });
} else {
    data = dataSource;
}
```

**关键点**：

-   当 `config.geo.labelLine` 配置了引线时，会把气泡点（`data`）、起始点（`points`）和连线（`lines`）拆成 3 组数据，分别给 scatter / effectScatter / lines 三个 series 用。
-   没匹配到 `labelLine` 的项会**继续走原气泡数据**。
-   `id` 同时支持 number 和 string（`find({id: item.id}) || find({id: String(item.id)})`）。

#### 4.2.4 边距 `marginSetting`

```typescript
let marginConfig = {};
if (marginSetting?.show) {
    marginConfig = { layoutCenter: ['50%', '50%'], layoutSize: '98%' };
} else {
    marginConfig = {
        top: marginSetting?.top || 'middle',
        left: marginSetting?.left || 'center',
        right: marginSetting?.right || 'auto',
        bottom: marginSetting?.bottom || 'auto',
    };
}
```

-   `show = true` 时整体居中缩放（98%）。
-   否则按四方向自定义。

#### 4.2.5 主图层 / 描边图层

```typescript
const basicGeoConfig = {
    show: true,
    map: mapName,
    ...marginConfig,
    label: { show: false },
    emphasis: { show: true, label: { show: false }, itemStyle: { areaColor: mapStyle.emphasisAreaColor } },
    itemStyle: { ..._.omit(mapStyle, omitItemStyleProperties) },
    roam: false,
};

const outlineGeoConfig = {
    show: _.get(mapOutlineStyle, 'show', true),
    ...marginConfig,
    map: getMapOutlineName(mapName),
    silent: true,
    itemStyle: { ...defaultMapOutlineStyle, ..._.omit(mapOutlineStyle || {}, ['show']), color: 'transparent', opacity: 1, borderJoin: 'round' },
    roam: false,
};

const option = {
    tooltip: { trigger: 'item', backgroundColor: '#0B0B3C', borderColor: '#195BB9', textStyle: { color: '#FFFFFF' } },
    geo: [basicGeoConfig, outlineGeoConfig],
    series: [colorMapOption, linesSeries, effectScatterSeries, scatterSeries, scatterNameSeries].filter(Boolean),
};
```

**关键点**：

-   `geo` 数组：第 1 个是主图层（带区域填色），第 2 个是描边图层（`silent: true` 不响应交互）。
-   `tooltip.formatter` 固定返回 `params.name`，**不带指标数值**（指标在气泡里显示）。
-   `omitItemStyleProperties = ['areaLevelColor', 'enableAreaColorLevelControl', 'emphasisAreaColor']` 这三个字段从 `mapStyle.itemStyle` 里剔除，避免污染主图层。

#### 4.2.6 气泡 series 的 `formatter`（核心复杂逻辑）

气泡 series 的 `label.formatter` 是这个物料最复杂的部分，**最多支持 4 个指标值 + 副值**：

```typescript
formatter: function (params) {
    const wrap = indicatorStyle?.enableVerticalLayout ? '\n' : '';
    const separator = indicatorStyle?.enableVerticalLayout ? '' : '{img0|/}';
    const showIndName = indicatorStyle?.showIndName;

    const valueExchange = (value1, value2) => (indicatorStyle?.enableValueFieldExchange ? value2 : value1);
    const indNameFormatter = (name) => (showIndName && name ? `${name}` : '');
    const subValueFormatter = (value) =>
        indicatorStyle?.showSubValue && !isNil(value)
            ? `${subValueDecorationFormatter(value, indicatorStyle.subValueDecoration)}`
            : '';

    let res = `{img${enableIndValueLevelControl ? params?.data?.level1 : 0}|${indNameFormatter(params?.data?.name1)}${valueExchange(...)}}${wrap}`;

    const showValueNumber = params?.data?.num || (indicatorStyle?.showValueNumber ?? 3);
    if (showValueNumber > 1) res += `${separator}{img${...}|...}${wrap}`;
    if (showValueNumber > 2) res += `${separator}{img${...}|...}${wrap}`;
    if (showValueNumber > 3) res += `${separator}{img${...}|...}`;
    return res;
},
```

**关键点**：

-   **默认 3 个指标**（`showValueNumber ?? 3`），最多 4 个。
-   `enableVerticalLayout = true` 时用 `\n` 换行；否则用 `{img0|/}` ECharts rich text 分割符。
-   `enableValueFieldExchange` 把 `value` 和 `subValue` 互换。
-   `enableIndValueLevelControl` 时 rich text 用 `level1/2/3/4` 决定样式（img0~img4）；否则统一用 `img0`。
-   每个指标的显示数量由 `params.data.num` 决定（**优先级高于配置**），缺省时用 `indicatorStyle.showValueNumber`。
-   `subValueFormatter` 用 `subValueDecorationFormatter` 套上 `SubValueDecoration` 装饰（千分位 / 小数 / 百分比）。

#### 4.2.7 `getBottomRegionGeoJson`（区县下钻底图）

```typescript
export const getBottomRegionGeoJson = (parentMapName: string, mapCfgItem: any) => {
    const { geoJSON } = ec.getMap(parentMapName);
    return Promise.resolve({
        ...geoJSON,
        features: _.filter(geoJSON.features, (o) => {
            return (
                _.toString(o.properties.adcode) === _.toString(mapCfgItem.adcode) ||
                [_.toString(mapCfgItem.name), _.toString(mapCfgItem.alias)].includes(_.toString(o.properties.name))
            );
        }),
    });
};
```

**关键点**：

-   **不开新文件**：从父级 geoJson 中 `filter` 出对应 adcode/name/alias 的 features。
-   adcode 比较时统一 `_.toString`（兼容 number / string）。
-   返回的是 `Promise.resolve(...)`，确保调用方 `await` 安全。

#### 4.2.8 `ZoneLevelEnum`

```typescript
// 2：省、3：地市、4：区县
export enum ZoneLevelEnum {
    district = 4,
    city = 3,
    province = 2,
}
```

派发参数时把 `level` 字符串映射成数字。`undefined` 派发 `null`。

### 4.3 维护检查清单

-   [ ] 修改 `convertColorMapOption` 时同步 `omitItemStyleProperties`（避免级别色配置污染主图层）
-   [ ] 新增 `levelN` 字段时同步 `getHighestLevel` 和 `formatter` 的 rich text 分支
-   [ ] 修改 `formatter` 时**小心 number 4 是上限**，新增指标值需扩展 5 个分支
-   [ ] 修改 `labelLine` 时保证 `data / points / lines` 三组数组同步（否则 `scatter`/`effectScatter`/`lines` series 错位）
-   [ ] `getBottomRegionGeoJson` 改动时要确认父级地图已 `registerMap`（否则 `ec.getMap(parentMapName)` 返回 undefined）

## 5. 样式 `index.less`

```less
.echarts-map-container {
    position: relative;
    width: 100%;
    height: 100%;
    .back {
        position: absolute;
        font-size: 20px;
        z-index: 1;
    }
    .echarts-map-wrapper {
        width: 100%;
        height: 100%;
    }
    .data-source-switch {
        display: none;
        position: absolute;
        z-index: 2;
        background-position: center center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        align-items: center;
    }
    &:hover {
        .data-source-switch {
            display: flex;
        }
    }
}
```

| class                    | 作用                                                |
| ------------------------ | --------------------------------------------------- |
| `.echarts-map-container` | 根容器，`position: relative` 为内部绝对定位元素铺路 |
| `.back`                  | 返回按钮（由 `map.jsx` 的 `<Icon>` 加此 class）     |
| `.echarts-map-wrapper`   | ECharts canvas 容器                                 |
| `.data-source-switch`    | 数据源切换按钮（hover 时显示）                      |

> ⚠️ `.data-source-switch` 的 hover 显示规则由 CSS 实现，**`Map` 组件无需额外控制**。

## 6. 常用工具与常量

| 来源 | 用途 |
| --- | --- |
| `@fedx-vis/react-echarts` | ReactECharts 组件 |
| `echarts` | `registerMap` |
| `oss-web-toolkits._` | lodash 工具 |
| `oss-ui.DataStatus` / `Icon` / `ConfigProvider` | UI 组件 |
| `@Components/data-source-switch` | DataSourceSwitch + useDataSourceSwitch + SYMBOL_DATA_SOURCE_SWITCH |
| `@Src/common/api` → `loadJSON` | 加载静态 JSON |
| `@Src/hooks/useSetState` | setState（merge 语义） |
| `@Src/hooks/useInteractionHandle.drilldown` | 下钻弹窗触发 |
| `@Src/hooks/usePersistFn` | 持久化函数引用 |
| `@Src/hooks/useDevelopment.useDevelopmentEffect` | 开发模式 effect |
| `@Utils.getImageUrl` | 图片 URL 拼接 |
| `CACHE_KEY.EC_MAP_CONFIG_SYMBOL` | map-config.json 缓存 key |
| `./options.getOption` / `registerMapOutline` / `getBottomRegionGeoJson` / `ZoneLevelEnum` / `ORIGINAL_DATA_KEY` | 核心导出 |
| `./schema/defaultValues` → `mapOutlineStyle` / `areaLevelColor` | 默认样式 |
| `./schema/share` → `subValueDecorationFormatter` | 副值格式化 |

## 7. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 切换地图（点地图 / 返回 / 参数订阅） | `mapPath` useMemo 仅依赖 `currentName`，`getDataSource` 通过 `preRequestParamsRef` 短路相同参数 |
| 频繁更新 config | `ReactECharts` 的 `replaceMerge: ['series', 'geo']` 避免全量重渲染，保留交互/选中态 |
| 大量指标点（>1000） | `formatter` 是函数，每次 setOption 都会重生成；**避免在大数据下关闭 `enableLevelControl` / `showValueNumber`**（rich text 复杂度指数级增长） |
| 定时刷新 | `preApiCancelTokenRef.current()` 在卸载/重启时主动 cancel 旧请求，防止竞态 |
| 区县下钻 | `getBottomRegionGeoJson` 复用父级 geoJson，不开新文件，内存占用几乎为 0 |

## 8. 调试小技巧

### 8.1 查看当前地图加载路径

```jsx
// map.jsx mapPath useMemo 内部
console.log('下钻地图 加载底图 mapName', mapCfg, mapInfo.currentName);
```

已注释启用后会在控制台输出当前 `mapCfg` 和 `currentName`，便于排查 `mapConfig` 中找不到区域的情况。

### 8.2 排查 mapConfig 缺失

```jsx
// map.jsx convertData 内部
if (!geoCoord) {
    console.log('下钻地图 mapConfig 数据缺失', String(item.id));
}
```

输出缺失经纬度的 `item.id`，需要到 `map-config.json` 中补 `cp`（经纬度中心点）。

### 8.3 排查参数订阅

```jsx
// map.jsx 订阅 effect 内部
// console.log('参数订阅----------------', regionName);
```

取消注释后查看 `regionName` 的实际值。

### 8.4 排查区县下钻

```jsx
// map.jsx mapPath useMemo 内部
// console.log('log-------------------------loader', mapInfo, mapCfg);
```

确认 `mapInfo.currentLevel === 'city'` 和 `mapInfo.drilldown === true` 时的 loaderGetter 切换。

### 8.5 临时禁用 `replaceMerge`

```jsx
<ReactECharts option={option} /* 暂时移除 replaceMerge 强制全量 setOption */ />
```

用于排查 series 错位问题（**注意会重置交互状态**）。

## 9. 维护历史

| 日期       | 变更                            | 原因     |
| ---------- | ------------------------------- | -------- |
| 2026-09-17 | 文档化（基于 develop 分支代码） | 首次梳理 |
