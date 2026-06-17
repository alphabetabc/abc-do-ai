---
title: 组件逻辑维护
description: oss-chart-map 组件代码（index.tsx + map.tsx + options/* + custom-layer/*）的维护要点
version: 1.0.0
last_updated: 2026-06-17
---

# 组件逻辑维护

本文档说明 `oss-chart-map` 组件代码（`index.tsx` + `map.tsx` + `options/*` + `custom-layer/*`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
oss-chart-map/
├── index.tsx                       # 顶层入口：加载 map-config + 权限筛选
├── map.tsx                         # 主渲染：注册 geo + 3 种 layer + MapContainer
├── schema.ts                       # 配置面板（→ schema.md）
├── dataModel.json                  # 数据契约（→ data-model.md）
├── oss-material.json               # 物料元信息（name: 'oss-chart-ec-map'）
├── types.ts                        # TS 接口
├── common/
│   ├── constants.ts                # 枚举
│   ├── index.ts                    # 桶导出
│   └── utils.ts                    # mapUtils + resetInteractionObject
├── custom-layer/
│   ├── index.ts                    # 桶导出 + 注册 LAYER_DOM_ENUMS
│   ├── layer-dom-container.tsx     # DOM 图层注册表
│   └── layer-dom/
│       ├── index.tsx               # 桶导出
│       ├── single-scatter/         # single_scatter01/02（LayerSingleDomScatter）
│       ├── group-scatter/          # group_scatter01/02/03（LayerGroupDomScatter）
│       │   └── group-scatter2/     # CommonScatter + MultiRowsScatter
│       └── label-line/             # 指标指引线 DOM 组件
├── options/
│   ├── useGeo.ts                   # 底图 geo option 构造
│   ├── useLayerOpt.ts              # 图层 opt builder 路由
│   ├── useOptionPicker.tsx         # 通用 useMemo picker
│   └── layer-opts/
│       ├── index.ts                # 注册 3 个 builder
│       ├── container.ts            # OptBuilderType 接口 + 注册表 Map
│       ├── layer-opt-path.ts       # 板块地图 builder
│       ├── layer-opt-lines.ts      # 飞线图 builder
│       └── layer-opt-scatter.ts    # 散点图 builder（最复杂）
├── schema-parts/
│   ├── map-lines.ts                # linesNormal schema 片段
│   ├── map-scatter.ts              # 6 种散点 schema 片段
│   └── label-line.ts               # LABEL_LINE schema 片段
├── doc/                            # 用户向文档
└── icons/                          # 5 个气泡预览图
```

## 2. 顶层入口 `index.tsx`

### 2.1 入口签名

```typescript
import { DataStatus, ConfigProvider } from 'oss-ui';
import { loadJSON } from '@Src/common/api';
import { useSetState } from '@Src/hooks/useSetState';
import { CACHE_KEY } from '@Src/common/constants';
import Map from './map';

function OssChartECMap(props) {
    const { designer } = props;
    const { constants } = designer;

    const [state, setState] = useSetState({
        initStatus: DataStatus.STATUS.LOADING,
        mapConfig: null,
    });

    useEffect(() => {
        const mapConfigLoader = props.designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL, () =>
            loadJSON(`${constants.STATIC_PATH}/map/map-config.json`),
        );
        mapConfigLoader.then((res) => {
            setState({ initStatus: DataStatus.STATUS.SUCCESS, mapConfig: res.data });
        });
    }, [constants.STATIC_PATH, props.designer.cache, setState]);

    // 计算 currentAdcode（最后一级）
    const currentOutline = _.get(props, 'config.geo.mapsettings.selectedOutline');
    const outlineType = _.get(props, 'config.geo.mapsettings.outlineType');
    let currentAdcode;
    if (_.isArray(currentOutline) && currentOutline.length > 0) {
        currentAdcode = currentOutline[currentOutline.length - 1];
    }

    // 过滤 mapConfig
    const currentMapConfig = React.useMemo(() => {
        if (_.isArray(state.mapConfig) && state.mapConfig?.length > 0 && outlineType !== 'china') {
            return state.mapConfig.filter((cfg) => {
                if (!_.isUndefined(currentAdcode)) {
                    return cfg.parent === currentAdcode || cfg.adcode === currentAdcode;
                }
                return true;
            });
        } else {
            return state.mapConfig;
        }
    }, [state.mapConfig, currentAdcode, outlineType]);

    return (
        <ConfigProvider>
            <DataStatus status={state.initStatus}>
                <Map {...props} mapConfig={currentMapConfig} />
            </DataStatus>
        </ConfigProvider>
    );
}
```

### 2.2 关键逻辑

#### 2.2.1 map-config.json 加载

```typescript
const mapConfigLoader = props.designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL, () => loadJSON(`${constants.STATIC_PATH}/map/map-config.json`));
```

-   通过 `designer.cache.cached` **全局缓存**（symbol key）避免多个 map 物料重复请求
-   资源路径：`{STATIC_PATH}/map/map-config.json`
-   包含 `MapconfigType[]`：每个区域的 `adcode / level / cp / parent / id / name / alias`

#### 2.2.2 权限筛选（mapConfig 过滤）

```typescript
const currentMapConfig = React.useMemo(() => {
    if (_.isArray(state.mapConfig) && state.mapConfig?.length > 0 && outlineType !== 'china') {
        return state.mapConfig.filter((cfg) => {
            if (!_.isUndefined(currentAdcode)) {
                return cfg.parent === currentAdcode || cfg.adcode === currentAdcode;
            }
            return true;
        });
    } else {
        return state.mapConfig;
    }
}, [state.mapConfig, currentAdcode, outlineType]);
```

-   **仅当 `outlineType !== 'china'` 时过滤**（中国全图不需要筛选）
-   `currentAdcode` 取 `selectedOutline` 数组最后一级
-   过滤规则：`parent === currentAdcode`（下级区域）或 `adcode === currentAdcode`（当前区域本身）

## 3. 主渲染 `map.tsx`

### 3.1 入口签名

```typescript
import { MapContainer, layerRenderer } from '@oss-chart/map';
import { useGeoOpt } from './options/useGeo';
import { useLayerOpt } from './options/useLayerOpt';
import { LayerDom, isLayerDom } from './custom-layer';

const OssChartECMap: React.FC<any> = React.memo((props) => {
    const { config, dataSource, designer } = props;
    const { constants, env } = designer;

    const enablePathSelect = _.get(config, 'geo.selectStyle.enable');
    const mapCtxCache = useRef<any>({ rootSelectedPath: null, preSelectedPath: null, enablePathSelect });
    // ...
});
```

### 3.2 关键逻辑

#### 3.2.1 mapCtxCache（ref 缓存）

```typescript
const mapCtxCache = useRef<any>({ rootSelectedPath: null, preSelectedPath: null, enablePathSelect });

Object.assign(mapCtxCache.current, {
    latestConfig: config,
    mapConfig: props.mapConfig,
    dispatch: props.interaction.dispatch,
    enablePathSelect,
});

if (_.isUndefined(mapCtxCache.current.clickInMap)) {
    Object.assign(mapCtxCache.current, { clickInMap: false });
}
```

-   用于跨 `useEffect` 闭包共享状态（`rootSelectedPath` / `preSelectedPath` / `clickInMap`）
-   选中状态机：第一次点击 → `rootSelectedPath = data`；第二次点击同一区域 → 取消选中（重置）；点击不同区域 → 切换

#### 3.2.2 geoJson 加载（缓存 promise）

```typescript
const geoJsonPromise = useMemo(
    () => {
        let path: string = '';
        if (config.geo.mapsettings.outlineType === 'custom') {
            return loadJSON(config.geo.mapsettings.customGeoJson);
        }

        const assignPathByItem = (item) => {
            /* 计算 path */
        };

        if (config.geo.permission) {
            if (permissionZoneId || permissionZoneName) {
                assignPathByItem({ name: permissionZoneName, id: permissionZoneId });
            } else {
                currentMapCache.current.mapName = '权限地图';
            }
        } else {
            if (!config.geo.mapsettings.geoJson) {
                path = DEFAULT_GEOJSON; // '/map/china.json'
            } else {
                path = config.geo.mapsettings.geoJson;
            }
            currentMapCache.current.mapName = config.geo.mapsettings.mapName;
        }

        if (path) {
            currentMapCache.current.geoJsonStatus = 'success';
            const geoJsonPath = `${constants.STATIC_PATH}${path}`;
            const loaderMapping = props.designer.cache.cached(CACHE_KEY.EC_MAP_GEOJSON, () => ({}));
            let loader = loaderMapping[geoJsonPath];
            if (!loader) {
                loader = loadJSON(geoJsonPath);
                loaderMapping[geoJsonPath] = loader;
            }
            return loader;
        } else {
            currentMapCache.current.geoJsonStatus = 'error';
        }
    },
    [
        /* deps */
    ],
);
```

-   三种加载路径：`custom` URL / `country` 默认 china / 指定 `geoJson` 路径
-   按路径做 **Map 缓存**（`loaderMapping[geoJsonPath]`）避免重复请求
-   错误态：`geoJsonStatus = 'error'` → `<DataStatus errorDescription="[mapName] : geoJson 未找到" />`

#### 3.2.3 背景图 mapBackgroundStyle

```typescript
const mapBackgroundStyle = useMemo(() => {
    const result: React.CSSProperties = { backgroundImage: 'none' };
    const backgroundImage = config.geo.backgroundImage;
    if (_.isEmpty(backgroundImage) || !config.geo.show) return result;

    let bg: any = backgroundImage[0];
    if (config.geo.permission) {
        bg = backgroundImage.find((d) => [permissionZoneId, `${permissionZoneId}`].includes(d.id));
    }
    if (!_.isEmpty(bg)) {
        Object.assign(result, {
            backgroundImage: `url(${getImageUrl(bg.image, { constants, env })})`,
            backgroundSize: `${_.get(bg, 'size.width', config.width)}px ${_.get(bg, 'size.height', config.height)}px`,
            backgroundPosition: `${_.get(bg, 'position.left', 0)}px ${_.get(bg, 'position.top', 0)}px`,
            backgroundRepeat: 'no-repeat',
        });
    }
    return result;
}, [config.geo.backgroundImage, config.geo.show, config.geo.permission, config.width, config.height, constants, env, permissionZoneId]);
```

-   匹配规则：非权限模式取 `backgroundImage[0]`；权限模式按 `id` 匹配 `permissionZoneId`
-   缺省尺寸/位置回退到 `config.width/height` 与 `0`

#### 3.2.4 点击事件 triggerMapClick

```typescript
const triggerMapClick = usePersistFn((e, isAutoTrigger = false) => {
    const drilldownLayer = _.get(props, 'interaction.defined.configurableEvent.drilldownEvent.layer');
    const enableDrilldown = _.get(props, 'interaction.defined.configurableEvent.drilldownEvent.show');
    const currentLayer = mapUtils.currentLayer(e);
    let data: any = {};

    // 选中态切换逻辑
    let mapSelectedFlag = !mapCtxCache.current.enablePathSelect;
    const changeMapSelectedFlag = () => {
        /* ... */
    };

    if (currentLayer === EC_MAP_LAYER_ENUMS.path) {
        const mapCfg = mapUtils.findMapCfg(mapCtxCache.current.mapConfig, e);
        if (!mapCfg) return;
        Object.assign(data, {
            regionName: mapCfg.name,
            regionId: `${mapCfg.id || ''}`,
            name: `${mapCfg.id || ''}`,
            id: `${mapCfg.id || ''}`,
            ..._.pick(mapCfg, ['regionType', 'lowerRegionType', 'upperRegionType']),
            zoneLevel: mapCfg.zoneLevel,
            lowerZoneLevel: mapCfg.lowerZoneLevel,
            upperZoneLevel: mapCfg.upperZoneLevel,
        });
        changeMapSelectedFlag();
    } else {
        Object.assign(data, e.data);
    }

    mapCtxCache.current.clickInMap = true;

    if (enableDrilldown && currentLayer === drilldownLayer) {
        if (isAutoTrigger || !mapSelectedFlag) return;
        drilldown(props, data);
    } else {
        dispatchInteraction(props, data, { interactionKeyValidator: (value) => !_.isBoolean(value) });
    }
});
```

-   **下钻与派发互斥**：`enableDrilldown` 开启时不派发参数
-   **选中态切换**：第一次点击 `rootSelectedPath = data`、第二次同区域 → `data` 重置为 `{}`（取消）、不同区域 → 切换
-   **`dispatchInteraction`** 的 `interactionKeyValidator` 过滤掉 `boolean` 值（避免派发空参数）

#### 3.2.5 自动触发 autoTrigger

```typescript
useEffect(() => {
    if (props.currentGroupSliderActive && props.interaction?.defined?.autoTrigger) {
        let currentItem = { name: config.geo.mapsettings.mapName };
        if (config.geo.permission) {
            currentItem = { name: permissionZoneName, id: permissionZoneId };
        }
        const mapCfg = mapUtils.findMapCfg(mapCtxCache.current.mapConfig, currentItem);
        if (!mapCfg) return;

        triggerMapClick(
            {
                /* ...data */
            },
            true,
        ); // isAutoTrigger = true
    }
}, [
    config.geo.mapsettings.mapName,
    config.geo.permission,
    permissionZoneId,
    permissionZoneName,
    props.currentGroupSliderActive,
    props.interaction?.defined?.autoTrigger,
    triggerMapClick,
]);
```

-   轮播组场景：`currentGroupSliderActive` 为 `true` 时**首次进入自动派发**
-   `isAutoTrigger = true` 跳过下钻与选中态切换，直接派发

#### 3.2.6 渲染 MapContainer

```typescript
<MapContainer
    width={config.width}
    height={config.height}
    mapName={currentMapCache.current.mapName}
    geoJson={geoJsonPromise}
    visualMap={{
        ...visualMap,
        inRange: { color: [config.layer.path.minColor, config.layer.path.maxColor] },
    }}
    geo={[geo]}
    events={events}
    style={mapBackgroundStyle}
    containerProps={containerEvents}
    rebuildOption={(opt) => {
        if (config?.layer?.path?.appendToBody) {
            opt.tooltip = { renderMode: 'html', appendToBody: true };
        }
        return opt;
    }}
>
    {layers.map((layer, index) => {
        const { type, ...restOpt } = layer;
        const option: any = { key: index, ...restOpt };

        if (isLayerDom(type)) {
            return <LayerDom key={`${type}_${index}`} type={type} {...option} /* ... */ />;
        }
        if (type === 'path') {
            option.map = currentMapCache.current.mapName;
        }
        return layerRenderer(type, option);
    })}
</MapContainer>
```

-   **ECharts series**：`geo={[geo]}` + `layerRenderer(type, option)`
-   **DOM 自定义图层**：`isLayerDom(type)` 判定后走 `<LayerDom>`（不进入 ECharts）
-   **`visualMap.inRange.color`**：仅 path 图层生效

## 4. 子组件

### 4.1 `LayerSingleDomScatter`（single_scatter01/02）

`packages/oss-chart-map/custom-layer/layer-dom/single-scatter/index.tsx`

```typescript
const LayerSingleDomScatter = React.memo<React.ComponentType>((props: any) => {
    const {
        data,
        scatter = EMPTY_OBJECT,
        mapConfig,
        designer: { env, constants },
        activeItem,
    } = props;
    // ...
    return (
        <ConfigProvider>
            <LayerDom
                className="layer-dom-scatter-root layer-dom-single-scatter-root"
                emptyStatus={<DataStatus status={DataStatus.STATUS.LOADING} />}
                renderChildren={renderChildren}
            />
        </ConfigProvider>
    );
});
```

| prop         | 类型   | 来源                              | 说明                                    |
| ------------ | ------ | --------------------------------- | --------------------------------------- |
| `data`       | array  | `useLayerOpt` 生成的 `dataSource` | 转换后的散点数据                        |
| `scatter`    | object | config                            | `value` / `label` / `layout` / `symbol` |
| `mapConfig`  | array  | `index.tsx`                       | 区域字典（用于 `convertToPixel`）       |
| `designer`   | object | 框架                              | 含 `env` / `constants`                  |
| `activeItem` | object | `useLayerOpt` 上下文              | 选中的散点                              |

**关键逻辑**：`domScatterRenderMapper[scatterType]` 路由到具体渲染函数（single_scatter01/02 各自的 `GroupScatter2.CommonScatter`）

### 4.2 `LayerGroupDomScatter`（group_scatter01/02/03）

`packages/oss-chart-map/custom-layer/layer-dom/group-scatter/index.tsx`

```typescript
const reg = /^(item_((label)|(value)|(id)|(level)){1}_)/;

const LayerGroupDomScatter = React.memo<any>((props) => {
    const { data, scatter, valueGroup, labelLine, mapConfig, designer, width, height, map } = props;
    // ...
    const dataSource = useMemo(() => {
        return data.map((item) => {
            const itemData = mapUtils.getOriginData(item);
            const group = new Map<string, any>();
            Object.keys(itemData).forEach((key) => {
                if (reg.test(key) && !key.endsWith('_format')) {
                    const value = itemData[key];
                    const groupName = key.replace(reg, ''); // 截掉前缀，保留 '5G'/'total' 等
                    let groupItem = group.get(groupName);
                    if (!groupItem) {
                        groupItem = {};
                        group.set(groupName, groupItem);
                    }
                    // 按前缀分别设置 name / value / groupItemId / level
                }
            });
            return { item: [...group.values()], originData: itemData, source: item };
        });
    }, [data]);
    // ...
});
```

**关键逻辑**：

-   正则 `reg = /^(item_((label)|(value)|(id)|(level)){1}_)/` 匹配 `item_label_5G` / `item_value_total` / `item_id_5G` / `item_level_5G` 等
-   通过 `groupName = key.replace(reg, '')` 把 `5G` 提取出来作为分组 key
-   一组指标的 4 个字段（name/value/groupItemId/level）合并到 `groupItem`
-   `_format` 后缀字段被排除

### 4.3 `GroupScatter2`（group_scatter02/03 复用）

`packages/oss-chart-map/custom-layer/layer-dom/group-scatter/group-scatter2/index.tsx`

```typescript
export const GroupScatter2 = {
    CommonScatter, // 通用渲染
    MultiRowsScatter, // 多列多行渲染
};
```

| 变体               | 用于                 | 关键 props                                                         |
| ------------------ | -------------------- | ------------------------------------------------------------------ |
| `CommonScatter`    | `group_scatter01/02` | `valueGroup`（含分隔符 / 指标行布局）                              |
| `MultiRowsScatter` | `group_scatter02/03` | `valueGroup.columnsWidth` + `valueGroup.rows`（列宽 + 行字段映射） |

### 4.4 `LabelLine`（指标指引线）

`packages/oss-chart-map/custom-layer/layer-dom/label-line/index.tsx`

-   `group_scatter02` 专用：值面板到中心点之间的虚线
-   工具函数：`getLabelLineConfig` / `createSourcePropsById` / `createTargetPropsById`

## 5. 通用工具

### 5.1 `useOptionPicker`

`packages/oss-chart-map/options/useOptionPicker.tsx`

```typescript
export default function useOptionPicker(opt: any, picker?: any) {
    const memorizedOpt = useMemorizedObject(opt, compareFn);
    const pickerRef = useRef<any>();
    pickerRef.current = picker;
    return useMemo(() => {
        if (pickerRef.current) {
            return pickerRef.current(memorizedOpt);
        }
        return memorizedOpt;
    }, [memorizedOpt]);
}
```

-   通过 `picker` 函数**只挑出关心字段**（如 `_.pick(labelOpt, ['show', 'color', ...])`）
-   `compareFn` 对 `Function` 类型不做深比较（保持引用）

### 5.2 `useGeoOpt`（底图）

`packages/oss-chart-map/options/useGeo.ts`

```typescript
export const useGeoOpt = (config: GeoType, extraCfg?) => {
    const { mapConfig, dataSource } = extraCfg || {};
    const labelOpt = useOptionPicker(config.geo.label, (opt) => _.pick(opt, ['show', 'color', 'fontStyle', 'fontWeight', 'fontFamily', 'fontSize']));
    // ...
    return useMemo(
        () => ({
            show: config.geo.show,
            selectedMode: selectStyleOpt.enable ? 'single' : false,
            select: selectStyleOpt.enable ? { itemStyle: selectStyleOpt.itemStyle, label: selectStyleOpt.label } : false,
            ...geoPadding,
            name: LAYER_NAME_CN.GEO_NAME,
            id: LAYER_NAME_CN.GEO_NAME_ID,
            itemStyle: {
                /* borderColor, borderWidth, areaColor, borderType */
            },
            label: {
                /* ... + formatter: 优先用 dataSource 中的 name 覆盖 mapConfig */
            },
            emphasis: { itemStyle: { areaColor: emphasisAreaColor }, label },
            tooltip: { show: !!config.tooltip.show },
        }),
        [
            /* deps */
        ],
    );
};
```

**关键**：

-   `selectedMode = 'single'`：单选模式（依赖 `config.geo.selectStyle.enable`）
-   `label.formatter`：从 `mapConfig` + `dataSource` 联合匹配，覆盖默认 `params.name`（优先用 `dataItem.name`）

### 5.3 `useLayerOpt`（图层路由）

`packages/oss-chart-map/options/useLayerOpt.ts`

```typescript
const useCurrentLayerCfg = (config) => {
    const layer = useOptionPicker(config.layer);
    return useMemo(() => {
        const { type } = layer;
        const config = layer[type] || {};
        const selectedLayerCfg = config[config.optionalType] || config;
        return { type, layerCfg: selectedLayerCfg, optionalType: config?.optionalType, colormap: config?.colormap };
    }, [layer]);
};

export const useLayerOpt = (config, dataSource, extraCfg) => {
    const { mapConfig, geo, tooltip, activeItem, designer } = extraCfg;
    const currentLayerCfg = useCurrentLayerCfg(config);
    const invalidateFlag = !currentLayerCfg.type || _.isEmpty(dataSource) || !mapConfig;

    return useMemo(() => {
        if (invalidateFlag) return [];
        const { type, optionalType, layerCfg, colormap } = currentLayerCfg;
        const builder = layerOptsContainer.get(type);
        if (!builder) return [];

        const label = builder.label({ optionalType, config: layerCfg.label }, { designer });
        return builder.build({
            style: builder.style({ geo, tooltip, label }, { colormap, layerCfg, optionalType, designer }),
            data: builder.data(dataSource, mapConfig, { colormap, optionalType, label, style: layerCfg.style, activeItem, designer }),
        });
    }, [activeItem, currentLayerCfg, dataSource, geo, invalidateFlag, mapConfig]);
};
```

-   **路由**：`layerOptsContainer.get(type)` → 3 个 builder 之一
-   **失效条件**：`type` 为空 / `dataSource` 为空 / `mapConfig` 未加载

## 6. 三个 Opt Builder

### 6.1 接口 `OptBuilderType`

`packages/oss-chart-map/options/layer-opts/container.ts`

```typescript
export type OptBuilderType = {
    type: MAP_LAYER_ENUMS;
    label: (opt: { optionalType?: string; config?: any }, ownerOption: any) => any;
    style: (
        cfg: { geo?: any; tooltip?: any; label: any },
        ownerOption: { colormap: any; layerCfg: any; optionalType: any; [other: string]: any },
    ) => any;
    data: (dataSource: any[], mapConfig: any, extraCfg: { [p: string]: any; colormap: any; label: any; optionalType: any }) => any;
    build: ({ style, data }: any) => any;
};

export const container = new Map<MAP_LAYER_ENUMS, OptBuilderType>();
export const registerLayerOptsBuilder = (builder) => {
    const { type, ...realBuilder } = builder;
    const optBuilder = { ...defaultOptBuilder, ...realBuilder };
    if (!type) return defaultOptBuilder;
    container.set(MAP_LAYER_ENUMS[type], optBuilder);
    return optBuilder;
};
```

### 6.2 `layer-opt-path.ts`（板块地图）

```typescript
const builder: Partial<OptBuilderType> = {
    type: MAP_LAYER_ENUMS.path,
    style: (cfg, ownerOption) => {
        const { geo } = cfg;
        const geoConfig: any = {};
        if (geo.show) {
            geoConfig.geoIndex = 0;
        } else {
            Object.assign(geoConfig, geo, { show: true });
        }
        return {
            type: 'path',
            ...geoConfig,
            name: LAYER_NAME_CN.PATH,
            tooltip: {
                show: ownerOption.layerCfg?.tooltip || false,
                // ... 完整 tooltip 配置
                formatter: (params) => {
                    // 4 种形式：多指标 / 单指标 / data.value / params.name
                },
            },
            visualMap: ownerOption.layerCfg?.visualMap || false,
        };
    },
    data: (dataSource, mapConfig, extraCfg) => {
        return dataSource.map((d) => {
            const item = { name: d.name, value: d.value };
            const cfg = mapUtils.findMapCfg(mapConfig, { ...item, id: d.id });
            if (cfg) {
                Object.assign(item, {
                    regionName: cfg.name,
                    regionId: cfg.id,
                    regionType: cfg.regionType,
                    name: cfg.name,
                });
            }
            // 按 extraCfg.colors（colormap 配置）给 item.itemStyle.color 染色
            return mapUtils.assignOriginData(item, d);
        });
    },
    build: ({ style, data }) => [{ ...(style || {}), data }],
};
```

**Tooltip 4 种形式**（由 `item_*` 字段数量自动切换）：

1. **多指标形式**（`item_*` 字段 ≥ 2 个）：以最长 `name` 为宽度基准，所有指标左右对齐 `name : value`
2. **单指标形式**（`item_*` 字段 = 1 个）：`name : value` 横排
3. **data.value 形式**（无 `item_*` 但有 `value`）：直接显示 `value`
4. **params.name 形式**（兜底）：显示地区名

### 6.3 `layer-opt-lines.ts`（飞线图）

```typescript
const linesDataBuilder = (dataSource, mapConfig, extraCfg) => {
    const { style } = extraCfg;
    return dataSource.flatMap((d) => {
        const targetIds = d.targetId?.split(',') || [];
        const targets = dataSource.filter((item) => item.id !== d.id && targetIds.includes(item.id));
        return targets.map((target) => {
            // 优先用 lon/lat，回退用 cfg.cp
            const sourceCp = [d.lon, d.lat].filter(Boolean).length > 0 ? [d.lon, d.lat] : mapUtils.findMapCfg(mapConfig, d)?.cp;
            const targetCp =
                [target.lon, target.lat].filter(Boolean).length > 0 ? [target.lon, target.lat] : mapUtils.findMapCfg(mapConfig, target)?.cp;
            const item = { source: d.name, target: target.name, coords: [sourceCp, targetCp], toCenter: mapUtils.isTrue(target.isCenter) };
            if (item.toCenter) {
                item.lineStyle = { color: style.toCenterColor };
                item.effect = { color: style.toCenterColor };
            }
            return mapUtils.assignOriginData(item, { source: d, target });
        });
    });
};
```

**关键逻辑**：

-   `targetId` 支持逗号分隔多端（`'a,b,c'` → 3 条连边）
-   **双向绘制**：`source → target` 和 `target → source` 都会建立连边（因互相 `filter` 命中）
-   **`isCenter = '1'`** 时单独使用 `toCenterColor`（中心点强调色）

**Style 拆分**（双层 ECharts）：

```typescript
[SYMBOL_LINES]: { type: 'lines', /* ... */ },
[SYMBOL_LINES_SCATTER]: { type: 'effectScatter', /* ripple ... */ },
```

`build` 拆分为两个 series：线条 + 散点（zlevel 2 vs 1）。

### 6.4 `layer-opt-scatter.ts`（散点图，最复杂）

```typescript
const scatterDataBuilder = (dataSource, mapConfig, extraCfg = {}) => {
    const { optionalType, activeItem: activeItemObj, style, label } = extraCfg;
    const { scatter: activeItem } = activeItemObj || {};
    return dataSource.map((d) => {
        const item = { name: d.name, id: d.id };
        const cfgItem = mapUtils.findMapCfg(mapConfig, d);
        if (d.lon && d.lat) {
            item.value = [d.lon, d.lat, d.value];
        } else {
            if (cfgItem) {
                item.value = [...cfgItem.cp, d.value];
            } else {
                return false; // 既无 lon/lat 又找不到 cfgItem → 丢弃
            }
        }
        if (cfgItem) {
            item.regionName = cfgItem.name;
            item.regionId = cfgItem.id;
            item.regionType = cfgItem.regionType;
        }
        // scatter01: active 切换 symbol/symbolSize
        if (optionalType === MAP_SCATTER_TYPE.single_scatter01) {
            const activeItemData = mapUtils.getOriginData(_.get(activeItem, 'data', {}));
            if (activeItemData && activeItemData.id === d.id) {
                item.symbol = style.activeSymbol;
                item.symbolSize = symbolSizeBuilder(style.activeSymbolSize);
            } else {
                item.symbol = style.symbol;
                item.symbolSize = symbolSizeBuilder(style.symbolSize);
            }
            item.label = label;
        }
        // ... 其他 optionalType 处理
        return mapUtils.assignOriginData(item, d);
    });
};
```

**Builder 类型**（按 `optionalType` 分支）：

| `optionalType`          | builder.data 输出                   | builder.style 关键                    | DOM 走法 |
| ----------------------- | ----------------------------------- | ------------------------------------- | -------- |
| `normal`                | ECharts scatter data                | ECharts `effectScatter` + ripple      | ECharts  |
| `single_scatter01`      | ECharts scatter data + 富文本 label | 径向渐变 + 富文本（value/arrow/text） | ECharts  |
| `single_scatter02`      | DOM 数据                            | `LayerDom`（`LayerSingleDomScatter`） | **DOM**  |
| `group_scatter01/02/03` | DOM 数据（聚合后）                  | `LayerDom`（`LayerGroupDomScatter`）  | **DOM**  |

**`isLayerDom` 分流**：

```typescript
// map.tsx 渲染
{
    layers.map((layer, index) => {
        if (isLayerDom(type)) {
            return <LayerDom type={type} {...option} /* ... */ />;
        }
        return layerRenderer(type, option); // ECharts
    });
}
```

`isLayerDom` 判定：`[LAYER_DOM_ENUMS.GROUP_SCATTER, LAYER_DOM_ENUMS.SINGLE_SCATTER].includes(type)`

**`single_scatter02` 的 type 标识**：

`group_scatter01/02/03` 在 builder 的 `data` 中通过返回特殊 `type` 标识（参考 `LayerDom` 注册表），但**`optionalType` 本身不等于 `LAYER_DOM_ENUMS`**——通过 builder 内部判断走 ECharts 还是 DOM 路径。

## 7. 样式

> ⚠️ **`oss-chart-map` 没有 `index.less`**——所有样式通过 ECharts option / 内联 `style` / DOM 子组件的局部 less 实现（如 `custom-layer/layer-dom/single-scatter/index.less`）。

### 7.1 命名规范

-   根 class：`layer-dom-scatter-root`（DOM 自定义图层）
-   DOM 子组件：`layer-dom-single-scatter-root` / `layer-dom-scatter-item`

### 7.2 关键样式

```less
// custom-layer/layer-dom/single-scatter/index.less
.layer-dom-scatter-root {
    /* ... */
}
.layer-dom-single-scatter-root {
    /* ... */
}

// custom-layer/layer-dom/group-scatter/group-scatter2/index.less
.layer-dom-scatter-item {
    position: absolute; // 通过 convertToPixel 算 left/top
}
```

## 8. 性能要点

| 场景                      | 注意事项                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useMemo` 依赖项          | `useGeoOpt` 显式列出 `config.geo.style.*` 与 `config.tooltip.show`，避免 `config` 整体引用变化导致重算 |
| `geoJsonPromise` 缓存     | 同一路径的 `loadJSON` promise 缓存在 `designer.cache.cached` 的 `Map` 中                               |
| `mapConfig` 缓存          | `designer.cache.cached(CACHE_KEY.EC_MAP_CONFIG_SYMBOL)` 跨实例共享                                     |
| `React.memo`              | `map.tsx` 与 `LayerSingleDomScatter` / `LayerGroupDomScatter` 都包了 `React.memo`                      |
| `usePersistFn`            | `triggerMapClick` 使用 `usePersistFn` 保持引用稳定（避免 `autoTrigger` effect 重复触发）               |
| `tooltipRef.current = {}` | 每帧重置（飞线 / 散点 tooltip 默认 false）                                                             |

## 9. 调试小技巧

### 9.1 临时查看 opt builder 输出

```typescript
// options/useLayerOpt.ts return useMemo 之前
console.log('builder output', builder.build({ style: ..., data: ... }));
```

### 9.2 临时查看 mapConfig

```typescript
// index.tsx 的 useEffect 之后
console.log('[map-config]', state.mapConfig);
```

### 9.3 临时查看 click 派发

```typescript
// map.tsx 的 triggerMapClick
console.log('[triggerMapClick]', { e, isAutoTrigger, data, enableDrilldown, drilldownLayer, currentLayer });
```

## 10. 维护历史

| 日期       | 变更                                | 原因         |
| ---------- | ----------------------------------- | ------------ |
| 2022-11-14 | 0.0.1 创建物料 `oss-chart-ec-map`   | 初始化       |
| 2026-06-17 | 文档化（基于 develop 分支当前代码） | 5+1 文档补全 |
