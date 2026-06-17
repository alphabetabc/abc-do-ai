---
title: 踩坑记录
description: oss-chart-map 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-17
---

# 踩坑记录

本文档记录 `oss-chart-map` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

---

## 1. 选中态状态机（单选逻辑与多选改造）

**症状**：地图板块点击之后支持 2 种行为——派发参数 + 选中态。再次点击同一区域会**取消选中**并把派发参数重置为空字符串，行为反直觉。

**原因**：

```typescript
// map.tsx triggerMapClick
const changeMapSelectedFlag = () => {
    if (mapCtxCache.current.enablePathSelect) {
        if (isAutoTrigger) {
            mapCtxCache.current.rootSelectedPath = data;
            mapSelectedFlag = false;
        } else {
            mapSelectedFlag = mapCtxCache.current.preSelectedPath?.regionName !== data.regionName;
            mapCtxCache.current.preSelectedPath = mapSelectedFlag ? data : null;
            if (!mapSelectedFlag) {
                // 取消选中：把 data 重置为 { regionName: '', ... }，并 dispatch
                data = mapCtxCache.current.rootSelectedPath ?? resetInteractionObject(data, '');
            }
        }
    }
};
```

- 第一次点击：`preSelectedPath` 为 `null` → `mapSelectedFlag = true` → 派发 data
- 第二次点击**同一区域**：`preSelectedPath.regionName === data.regionName` → `mapSelectedFlag = false` → 进入"取消"分支
- 取消分支把 `data` 重置为 `{ regionName: '', ... }`（**所有字段重置为 `''`**）后**再次 dispatch**

**修复**（如需修改）：

```typescript
// 简单禁用取消选中（保留选中态）
const changeMapSelectedFlag = () => {
    if (mapCtxCache.current.enablePathSelect && !isAutoTrigger) {
        mapCtxCache.current.preSelectedPath = data;
        mapSelectedFlag = false;  // 不进入取消分支
    }
};
```

> ⚠️ 修改需同步检查 `dispatchInteraction` 的 `interactionKeyValidator`——避免空值被过滤。

---

## 2. `oss-material.json.name` 与目录名 `oss-chart-map` 不一致

**症状**：`oss-material.json` 中 `name: "oss-chart-ec-map"`，但目录是 `oss-chart-map`，对外文档 `doc/README.md` 顶部也写 `oss-chart-map`。**设计器侧边栏**读取 `material.title`（"基础平面地图"），与 `name` 字段无关。

**原因**：

- `name` 字段是物料的**唯一标识**（webpack / designer / `@oss-chart/map` 内部依赖）
- 目录名是**部署相关**（zip 打包路径）
- 两者历史上命名不一致

**修复**：**不要修改** `oss-material.json.name`——任何依赖 `@oss-chart/map` 的代码（如 `MapContainer`）都通过 `material.name` 识别物料。

```typescript
// schema.ts
import material from './oss-material.json';
export const materialInfo = {
    name: material.title,  // '基础平面地图'
    icon: material.name,   // 'oss-chart-ec-map'
    type: material.name,   // 'oss-chart-ec-map'
};
```

> 修改 `oss-material.json.name` 会导致 `MapContainer` 等外部组件无法识别该物料。

---

## 3. `MapconfigType` 中 `country` 与 `district` 都映射到 `10004`

**症状**：`regionType` / `zoneLevel` 枚举中 `country` 和 `district` 都映射到 `'10004'` / `4`：

```typescript
// common/constants.ts
export enum REGION_TYPE_ENUMS {
    district = '10004',
    city = '10003',
    province = '10000',
}
export enum ZoneLevelEnum {
    district = 4,
    city = 3,
    province = 2,
}
```

注意：`country` 字段在 `MapconfigType` 中是合法值（`level: 'country'`），但 `REGION_TYPE_ENUMS` 没有 `country` 键——`mapUtils.findMapCfg` 会得到 `regionType = undefined`。

**原因**：当前实现只支持 `district / city / province` 三级，`country` 视为中国全图（默认）。

**修复**（如需支持国家级联动）：

```typescript
// common/constants.ts
export enum REGION_TYPE_ENUMS {
    country = '10005',  // 新增
    district = '10004',
    city = '10003',
    province = '10000',
}

// utils.ts currentRegionTypeOffset
const currentRegionTypeOffset = {
    [REGION_TYPE_ENUMS.country]: [REGION_TYPE_ENUMS.province, undefined],
    // ...
};
```

> 修改需同步修改 `map-config.json` 的 `level` 字段值。

---

## 4. 飞线图**双向绘制**导致重复线

**症状**：配置 `北京 → 上海` 的飞线（`北京.targetId = '354339340'`），实际渲染出 2 条线（北京→上海 + 上海→北京）。

**原因**：

```typescript
// options/layer-opts/layer-opt-lines.ts
const linesDataBuilder = (dataSource, mapConfig, extraCfg) => {
    return dataSource.flatMap((d) => {
        const targetIds = d.targetId?.split(',') || [];
        const targets = dataSource.filter((item) => item.id !== d.id && targetIds.includes(item.id));
        // ...
    });
};
```

- 处理 `北京` 时：`targets = [上海]`，绘制 `北京 → 上海`
- 处理 `上海` 时：`上海.targetId = '北京'`，`targets = [北京]`，绘制 `上海 → 北京`

**修复**（如需单向）：

```typescript
// 只取 targetId 在自己之后的项（按数组顺序）
const targets = dataSource.filter((item) => item.id !== d.id && targetIds.includes(item.id) && d.id < item.id);
```

> 当前实现是有意为之（双向都有视觉），修改前需与设计确认。

---

## 5. `_format` 后缀字段会被 `group_scatter` 忽略

**症状**：`DynamicData` 组件自动为每个字段生成 `<field>_format`（如 `id_format`），用于显示格式化。分组气泡**不读取**这些字段，导致指标名称显示为字段名（如 `item_value_total` 而非 `46`）。

**原因**：

```typescript
// custom-layer/layer-dom/group-scatter/index.tsx
Object.keys(itemData).forEach((key) => {
    if (reg.test(key) && !key.endsWith('_format')) {  // ← 显式排除 _format
        // ...
    }
});
```

**设计意图**：`_format` 是给数据源映射用的展示副本（如 `46` → `46.00 元`），**不影响实际数据逻辑**。但**板块 tooltip 不会**忽略 `_format`：

```typescript
// options/layer-opts/layer-opt-path.ts style.tooltip.formatter
Object.keys(itemData).forEach((key) => {
    if (reg.test(key) && !key.endsWith('_format')) {  // ← 板块 tooltip 也排除
        // ...
    }
});
```

实际上板块 tooltip **也排除** `_format`——与 group_scatter 行为一致。

**修复**（如需读取 `_format`）：删除 `&& !key.endsWith('_format')` 条件。

---

## 6. `defaultValue` 散点 6 个 `optionalType` 全部有默认（400+ 行）

**症状**：新增散点样式后忘记在 `defaultValue` 添加默认，导致首次拖入物料时 `config.layer.scatter[新类型]` 为 `undefined`，组件 `useLayerOpt` 会因 `config[config.optionalType] = undefined` 而崩溃。

**原因**：`useCurrentLayerCfg` 期望 `config[type][config.optionalType]` 必存在：

```typescript
const config = layer[type] || {};
const selectedLayerCfg = config[config.optionalType] || config;
// 若 selectedLayerCfg 为 {}，builder 的 style / data 会拿到空对象
```

**修复**（必须同步）：

- 在 `defaultValue.config.layer.scatter` 添加 `[MAP_SCATTER_TYPE.新类型]: { ... }`
- 若新类型需要新增子 schema（`schema-parts/map-scatter.ts`），需同时添加 `defaultValue`

---

## 7. `MapContainer` 的 `visualMap.inRange.color` 仅 path 图层生效

**症状**：在 `layer.type = 'scatter'` 时配置 `path.minColor` / `maxColor`，期望散点也按 visualMap 染色，实际无效。

**原因**：

```typescript
// map.tsx
<MapContainer
    visualMap={{
        ...visualMap,  // { show: layers.length !== 0 && ... layer === 'path' && layer.visualMap !== false }
        inRange: {
            color: [config.layer.path.minColor, config.layer.path.maxColor],  // 始终读 path 字段
        },
    }}
>
```

`visualMap.show` 控制显示，但 `inRange.color` 始终从 `path.minColor` / `path.maxColor` 读取。

**修复**（如需散点也支持 visualMap）：

```typescript
visualMap: {
    ...visualMap,
    inRange: {
        color: config.layer.type === 'path'
            ? [config.layer.path.minColor, config.layer.path.maxColor]
            : [/* 散点色阶 */],
    },
},
```

---

## 8. `geoJsonPromise` 缓存键缺失 `STATIC_PATH` 前缀

**症状**：不同 `constants.STATIC_PATH`（开发 / 生产 / 部署站）下，同一 `path` 仍会被缓存命中，导致**测试环境与生产环境串数据**。

**原因**：

```typescript
// map.tsx
const loaderMapping = props.designer.cache.cached(CACHE_KEY.EC_MAP_GEOJSON, () => ({}));
let loader = loaderMapping[geoJsonPath];
if (!loader) {
    loader = loadJSON(geoJsonPath);
    loaderMapping[geoJsonPath] = loader;
}
```

`geoJsonPath` 已包含 `constants.STATIC_PATH` 前缀（`${constants.STATIC_PATH}${path}`），按理应该区分环境。

**修复**（如发现串数据）：检查 `constants.STATIC_PATH` 是否在切换环境时被正确重置。

---

## 9. 散点 `single_scatter01` 缺省 `index.png` 资源

**症状**：`single_scatter01` 的 `arrow.image` 默认值是 `'comp-scatter-icon-arrow.png'`，需确保静态资源中**实际存在**该文件，否则箭头不显示。

**原因**：

```typescript
// schema.ts defaultValue
[MAP_SCATTER_TYPE.single_scatter01]: {
    label: {
        // ...
        arrow: {
            image: `comp-scatter-icon-arrow.png`,  // ← 默认引用
            lineHeight: 10,
        },
    },
}
```

> `getImageUrl` 通过 `localDir: 'component'` 查找，但若该文件未发布到 `component` 目录，会 fallback 到 `default`。

**修复**：检查 `static/component/comp-scatter-icon-arrow.png` 是否存在。

---

## 10. `group_scatter02` 的 `valueDivider` 在无指标时不渲染

**症状**：`valueGroup` 中只有 1 个指标时，分隔符 `/` 仍可能显示在末尾。

**原因**：

```typescript
// custom-layer/layer-dom/group-scatter/scatter-render.tsx (group_scatter02)
valueDivider: { show: true, dividerText: '/', width: 10 }
```

`show: true` 是硬编码，不会根据指标数量动态调整。

**修复**（如需动态）：

```typescript
valueDivider: {
    show: groupArr.length > 1,  // 仅多指标显示
    dividerText: '/',
    width: 10,
}
```

> 修改需在 builder（`layer-opt-scatter.ts`）中根据 `dataSource` 动态生成。

---

## 11. `mapCtxCache.current.clickInMap` 全局副作用

**症状**：地图容器 `onClick` 通过 `clickInMap` 标志判断是否需要抑制外层点击事件。**全局 mutation** 导致 React 18 并发模式下可能出现状态不一致。

**原因**：

```typescript
// map.tsx
const mapCtxCache = useRef<any>({ rootSelectedPath: null, preSelectedPath: null, enablePathSelect });
Object.assign(mapCtxCache.current, { /* 任意赋值 */ });

if (_.isUndefined(mapCtxCache.current.clickInMap)) {
    Object.assign(mapCtxCache.current, { clickInMap: false });  // ← 副作用
}
```

`Object.assign` 在 `useRef` 上**不会触发重渲染**，但会被 React 18 `StrictMode` 双调用影响（开发模式下 `useRef` 初始化会被调用两次）。

**修复**（如需严谨）：用 `useState` 替代部分状态（如 `preSelectedPath` / `rootSelectedPath`），保留 `clickInMap` 在 `useRef`（避免重渲染）。

---

## 12. `DataStatus` 在 `mapConfig` 加载前渲染 `<Map />`

**症状**：`mapConfig = null` 时 `<Map mapConfig={null} />` 会被渲染，内部 `useLayerOpt` 因 `mapConfig` 为 `null` 走 `invalidateFlag = true` 分支返回 `[]`，但 `useGeoOpt` 仍可能因 `mapConfig` 缺失导致 `formatter` 中 `findMapCfg` 报错。

**原因**：

```typescript
// index.tsx
return (
    <ConfigProvider>
        <DataStatus status={state.initStatus}>
            <Map {...props} mapConfig={currentMapConfig} />
        </DataStatus>
    </ConfigProvider>
);
```

`DataStatus` 仅控制外层 LOADING 态，**不会阻止子组件渲染**。

**修复**（如需避免）：

```typescript
if (state.initStatus === DataStatus.STATUS.LOADING) {
    return <DataStatus status={state.initStatus} />;
}
return (
    <DataStatus status={state.initStatus}>
        <Map {...props} mapConfig={currentMapConfig} />
    </DataStatus>
);
```

> 当前实现依赖 `useLayerOpt` 的 `invalidateFlag` 容错，**实际不会崩溃**，但会触发 `findMapCfg` 内的 `console.log('请在mapconfig文件中配置...')` 警告。

---

## 13. `dispatchInteraction` 的 `interactionKeyValidator` 过滤 `boolean`

**症状**：派发参数中 `enable` / `show` 等 boolean 字段会被过滤。

**原因**：

```typescript
// map.tsx
dispatchInteraction(props, data, {
    interactionKeyValidator: (value) => !_.isBoolean(value),
});
```

`interactionKeyValidator` 来自 `useInteractionHandle`，**默认值是过滤 boolean**（避免派发"开关"等业务字段）。

**修复**（如需保留 boolean）：在 `data` 中删除 `enable` / `show` 字段，或在调用 `dispatchInteraction` 时移除 `interactionKeyValidator`。

---

## 14. `item_label_xx` 的 `xx` 后缀不能为 `format` 开头

**症状**：数据中字段名为 `item_label_format5G`，`reg` 正则**不匹配**（被 `_format` 过滤或前缀识别错误）。

**原因**：

```typescript
const reg = /^(item_((label)|(value)|(id)|(level)){1}_)/;
// 匹配：item_label_5G, item_value_total
// 不匹配：item_label__format（多个 _），item_labelFormat_5G（驼峰）
```

**修复**（如需支持）：扩展正则：

```typescript
const reg = /^(item_((label)|(value)|(id)|(level)){1}_[a-zA-Z0-9_]+)/;
```

---

## 15. `mapBackgroundStyle` 在 `permission` 模式下匹配 `id` 用 `String()`

**症状**：`permissionZoneId` 是 `number` 类型时，`[permissionZoneId, `${permissionZoneId}`].includes(d.id)` 中 `d.id` 是 `string` 也会命中（因 `Number === String` 在 `includes` 中宽松比较）。

**原因**：

```typescript
// map.tsx
bg = backgroundImage.find((d) => [permissionZoneId, `${permissionZoneId}`].includes(d.id));
```

**修复**（如需严格）：先统一类型再比较：

```typescript
bg = backgroundImage.find((d) => [String(permissionZoneId), `${permissionZoneId}`].includes(String(d.id)));
```

---

## 16. `permissions` 字段无类型约束

**症状**：`designer.permissions.zoneId` / `zoneName` 在 TypeScript 中无类型约束，可能拿到 `undefined` 而不知。

**原因**：`designer` 是 `any` 类型（`map.tsx` 中 `React.FC<any>`），未声明 `permissions` 结构。

**修复**（如需类型化）：

```typescript
interface DesignerWithPermissions {
    permissions?: { zoneId?: string | number; zoneName?: string };
    // ...
}
const OssChartECMap: React.FC<any> = React.memo((props: { config: any; dataSource: any; designer: DesignerWithPermissions }) => { ... });
```

> 但物料代码通常不强行加类型（保持灵活），文档中说明即可。

---

## 17. `mapConfig` 缺少 `cp` 字段时散点定位失败

**症状**：散点 `dataSource[i]` 缺 `lon` / `lat`，且 `map-config.json` 中对应区域**缺 `cp` 字段**，散点**完全不显示**（`convertToPixel` 返回 `[0, 0]`，被 `if (!left || !top) return null` 过滤）。

**原因**：

```typescript
// custom-layer/layer-dom/group-scatter/scatter-render.tsx
const { cp: cfgCp = [] } = mapUtils.findMapCfg(mapConfig, originData) || {};
const [left, top] = api.convertToPixel('geo', [originData.lon || cfgCp[0], originData.lat || cfgCp[1]]);

if (!left || !top) {
    console.log('[地区异常]', source, cfgCp, mapConfig);
    return null;
}
```

**修复**：检查 `map-config.json` 中每个区域是否都有 `cp: [lon, lat]`。

---

## 18. `permission` 模式下 `mapName` 显示为"权限地图"

**症状**：开启 `permission: true` 但 `permissions.zoneId/zoneName` 都未配置时，`mapName` 显示为"权限地图"（占位）。

**原因**：

```typescript
// map.tsx
if (config.geo.permission) {
    if (permissionZoneId || permissionZoneName) {
        assignPathByItem({ name: permissionZoneName, id: permissionZoneId });
    } else {
        currentMapCache.current.mapName = '权限地图';  // ← 占位
    }
}
```

**修复**：提示用户配置 `permissions.zoneId/zoneName`，或在编辑器中加 hint。

---

## 19. `MapContainer` 的 `rebuildOption` 回调仅修改 tooltip

**症状**：`rebuildOption` 仅在 `appendToBody: true` 时修改 tooltip，其他 options 不可通过 `rebuildOption` 覆盖。

**原因**：

```typescript
rebuildOption={(opt) => {
    if (config?.layer?.path?.appendToBody) {
        opt.tooltip = { renderMode: 'html', appendToBody: true };
    }
    return opt;
}}
```

**修复**（如需支持更多覆盖）：在 `rebuildOption` 中按条件修改其他 options。

---

## 20. 调试小技巧

### 20.1 临时查看 opt builder 输出

```typescript
// options/useLayerOpt.ts 的 return useMemo 之前
console.log('builder output', builder.build({ style: ..., data: ... }));
```

### 20.2 临时查看 `mapConfig`

```typescript
// index.tsx 的 useEffect 之后
console.log('[map-config]', state.mapConfig);
```

### 20.3 临时查看 click 派发

```typescript
// map.tsx 的 triggerMapClick 内部
console.log('[triggerMapClick]', { e, isAutoTrigger, data, enableDrilldown, drilldownLayer, currentLayer });
```

### 20.4 临时查看 layer option

```typescript
// map.tsx 的 layers.map 之前
console.log('[layers]', layers);
```

### 20.5 临时查看 geoJsonPromise

```typescript
// map.tsx 的 geoJsonPromise useMemo 之后
console.log('[geoJsonPromise]', geoJsonPromise);
```

---

## 21. 性能陷阱

| 场景 | 注意事项 |
|------|----------|
| `useMemo` 依赖项 | `useGeoOpt` 显式列出 `config.geo.style.*` 与 `config.tooltip.show`，**不要**改为 `config` 整体引用（会导致重算） |
| `geoJsonPromise` 缓存 | 同一路径的 `loadJSON` promise 缓存在 `designer.cache.cached` 的 `Map` 中，**Map 操作是 O(1)**，无性能问题 |
| `mapConfig` 过滤 | `index.tsx` 的 `useMemo` 依赖 `[state.mapConfig, currentAdcode, outlineType]`，避免引用变化 |
| `React.memo` | `map.tsx` 与 `LayerSingleDomScatter` / `LayerGroupDomScatter` 都包了 `React.memo`，**注意 props 必须稳定**（如 `mapConfig` 是数组引用可能变化） |
| `usePersistFn` | `triggerMapClick` 使用 `usePersistFn` 保持引用稳定（避免 `autoTrigger` effect 重复触发） |
| `tooltipRef.current = {}` | 每帧重置（飞线 / 散点 tooltip 默认 false），**不要**改为 `useState`（会触发重渲染） |

---

## 维护历史

| 日期 | 问题 | 修复 |
|------|------|------|
| 2026-06-17 | 文档化（基于 develop 分支当前代码） | 5+1 文档补全，整理 20 个踩坑点 |
