---
title: 常见修改任务
description: oss-chart-map 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-17
---

# 常见修改任务

本文档列出针对 `oss-chart-map` 最常见的修改需求及对应的代码定位。

> **修改原则**：
> 1. **优先定位任务类型**（Schema / 组件逻辑 / 数据）
> 2. **散点 6 选 1 走 `opt builder` 模式**：新增/修改散点样式时同时改 `schema-parts/map-scatter.ts` + `options/layer-opts/layer-opt-scatter.ts` + `defaultValue`
> 3. **`item_*` 字段是开放字段**：无需修改 dataModel，正则匹配即可

---

## 任务 1：新增一个散点样式（如气泡 04）

**场景描述**：新增一种散点样式（如 `single_scatter03`），用户可在 `optionalType` 下拉中选择。

涉及：

- 🟦 Schema：[schema.md § 2.2.4](./schema.md#224-layerscatter-散点图配置) — 新增 `optionalType` 选项 + 对应 schema
- 🟨 组件逻辑：[component-logic.md § 6.4](./component-logic.md#64-layer-opt-scatterts散点图最复杂) — `layer-opt-scatter.ts` 新增 case
- 🟦 Schema：[schema.md § 4.3](./schema.md#43-图层-layer-默认) — `defaultValue.config.layer.scatter` 添加默认

**步骤**：

1. **注册枚举**（`common/constants.ts`）：

```typescript
export enum MAP_SCATTER_TYPE {
    // ... 现有
    single_scatter03 = 'single_scatter03',  // 新增
}
```

2. **新增 schema 片段**（`schema-parts/map-scatter.ts`）：

```typescript
export const SINGLE_SCATTER03 = {
    label: { /* 同 SINGLE_SCATTER01 */ },
    style: { /* 自定义 */ },
};
```

3. **在 `schema.ts` 注册到 `optionalType` + 子面板**：

```typescript
// enum 列表
enum: [
    // ... 现有 6 个
    { label: '气泡03', value: MAP_SCATTER_TYPE.single_scatter03 },
],

// 子面板（复制 SINGLE_SCATTER02 段改 key）
[MAP_SCATTER_TYPE.single_scatter03]: {
    type: 'object',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': { header: '配置' },
    'x-reactions': { /* 同 SINGLE_SCATTER02 */ },
    properties: SINGLE_SCATTER03,
},
```

4. **`defaultValue.config.layer.scatter` 添加默认**：

```typescript
scatter: {
    optionalType: 'normal',  // 保持默认
    // ...
    [MAP_SCATTER_TYPE.single_scatter03]: { /* 默认配置 */ },
}
```

5. **`options/layer-opts/layer-opt-scatter.ts` 处理新 case**（如需走 ECharts 走 `style` / `data`；如需走 DOM 走 `LayerDom` 注册）：

```typescript
// 若走 ECharts（normal / single_scatter01 模式）
case MAP_SCATTER_TYPE.single_scatter03:
    return { /* 散点 option */ };
```

6. **若走 DOM 路径**：在 `custom-layer/index.ts` 注册 `LAYER_DOM_ENUMS` 并实现组件。

---

## 任务 2：调整板块地图 tooltip 的 4 种展示形式

**场景描述**：板块地图 tooltip 当前有 4 种形式（由 `item_*` 字段数量自动切换），其中"多指标形式"以最长 `name` 为宽度基准。

涉及：

- 🟨 组件逻辑：[component-logic.md § 6.2](./component-logic.md#62-layer-opt-pathts板块地图) — `layer-opt-path.ts` 的 `style.tooltip.formatter`
- 🟦 Schema：[schema.md § 2.2.2](./schema.md#222-layerpath-板块地图配置) — `layer.path` 字体相关字段
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标-14-个) — `item_label_xx` / `item_value_xx` 字段

**示例：多指标形式加图标**

```typescript
// layer-opt-path.ts style.tooltip.formatter
indicators.forEach((d, i) => {
    const iconStr = `<i class="indicator-icon" style="background:${d.color || '#fff'};"></i>`;  // 新增图标
    const labelText = `<section style="width:${labelWidth}px; text-align: right;">${d.name}</section>`;
    const valueText = ` <section>${d.value}</section>`;
    const colon = `<section style="margin:0px 2px;"><span>:</span></section>`;
    const domStr = `<section style="display:flex;${i === 0 ? 'justify-content:center;' : ''}">
                        ${i === 0 ? '' : labelText + colon}
                        ${valueText}
                        ${iconStr}
                     </section>`;
    tooltipContent += domStr;
});
```

---

## 任务 3：新增一个派发参数

**场景描述**：点击散点时除派发 `type` / `groupItemId` 外，再派发一个 `name`（数据中的 `name` 字段）。

涉及：

- 🟦 Schema：[schema.md § 5.2.2](./schema.md#52-交互面板interactions) — 在 `data-params` FormCollapse 加 `name` 字段
- 🟨 组件逻辑：[component-logic.md § 3.2.4](./component-logic.md#324-点击事件-triggerMapClick) — 派发时携带 `name`
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标-14-个) — `name` 字段已存在

**步骤**：

1. **schema.ts 在 `data-params` 段加字段**：

```typescript
'data-params': {
    type: 'object',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': { header: '单击散点' },
    properties: {
        type: { /* 现有 */ },
        groupItemId: { /* 现有 */ },
        name: {  // 新增
            type: 'string',
            title: 'name',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
                tooltip: '与数据中的name字段映射',
                labelCol: 12, wrapperCol: 12,
            },
            'x-component': 'Input',
        },
    },
},
```

2. **map.tsx `triggerMapClick` 的 `else` 分支**（散点路径）已通过 `Object.assign(data, e.data)` 自动带上了 `name`（来自 `scatterDataBuilder`），无需改动

3. **`dispatchInteraction` 自动从 `data` 中读 `name`**，根据用户在 schema 中配置的字段名（如 `userName`）作为派发 key

> ⚠️ **派发参数是字段名映射**——schema 字段值是**派发出去时的 key 名**，组件读取 `interaction.defined.configurableEvent[字段名]` 获取用户配置的目标字段。

---

## 任务 4：调整默认值（颜色 / 尺寸 / 边距）

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.*`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

**常见调整**：

- 整体尺寸：`defaultValue.config.width` / `height` / `left` / `top`
- 底图填充色：`defaultValue.config.geo.style.areaColor`
- 选中样式：`defaultValue.config.geo.selectStyle.itemStyle.*`
- 板块地图 visualMap 颜色梯度：`defaultValue.config.layer.path.minColor` / `maxColor`
- 飞线默认样式：`defaultValue.config.layer.lines.normal.style.{scatter,lines}.*`
- 散点默认样式：`defaultValue.config.layer.scatter[optionalType].*`
- 数据源默认值：`defaultValue.dataConfig.json`

**特别注意**：

- ⚠️ **散点 6 个 `optionalType` 默认值都存在**（约 400 行）。新增样式时**必须同步添加默认**，否则首次拖入会缺失配置。
- ⚠️ **`defaultValue.interactions.configurableEvent.drilldownEvent`** 控制下钻默认行为，`show: false` 即默认关闭下钻。

---

## 任务 5：调整底图背景图匹配逻辑（如按 level 匹配）

**场景描述**：当前 `mapBackgroundStyle` 在 `permission = true` 时按 `id` 匹配 `backgroundImage[i].id`，希望增加按 `level` 匹配。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.2.3](./component-logic.md#323-背景图-mapBackgroundStyle) — `map.tsx` 的 `mapBackgroundStyle` useMemo
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-geo-底图配置-geo) — `backgroundImage.items.properties` 加 `level` 字段（如需）

**步骤**：

```typescript
// map.tsx mapBackgroundStyle
let bg: any = backgroundImage[0];

// 原逻辑：权限按 id
if (config.geo.permission) {
    bg = backgroundImage.find((d) => [permissionZoneId, `${permissionZoneId}`].includes(d.id));
}

// 新增：按 level 匹配（permissionZoneLevel 需在 permissions 中提供）
if (config.geo.permission && config.geo.backgroundImageMatchByLevel) {
    const permissionLevel = designer.permissions?.zoneLevel;
    if (permissionLevel) {
        bg = backgroundImage.find((d) => d.level === permissionLevel);
    }
}
```

> 需在 `designer.permissions` 中增加 `zoneLevel` 字段并由后端下发。

---

## 任务 6：调整地图下钻的弹窗 URL 参数

**场景描述**：当前下钻弹窗通过 `modalSet.params` 配置 URL 参数（如 `sceneId=10001`），希望支持从 `dataSource` 中动态取字段。

涉及：

- 🟦 Schema：[schema.md § 5.2.1](./schema.md#521-下钻-drilldownEvent) — `drilldownItemFields` 字段（已存在）
- 🟨 组件逻辑：[component-logic.md § 3.2.4](./component-logic.md#324-点击事件-triggerMapClick) — `drilldown(props, data)` 调用
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标-14-个) — 数据项字段

**当前实现**：`drilldown` 函数由 `@Src/hooks/useInteractionHandle` 提供，**已支持** `drilldownItemFields` 字段映射（`drilldownItemFields: 'a,b'` → 取 `data.a` 和 `data.b` 作为 query 参数）。

> 字段如需新增（如 `id_format`），直接加在 `dataConfig.fields` 与 `dataModel.json.indicators` 即可，**组件无侵入**。

---

## 任务 7：调整选中态行为（如改为多选）

**场景描述**：当前选中态是单选（`selectedMode: 'single'`），希望改为多选。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.2.4](./component-logic.md#324-点击事件-triggerMapClick) — `triggerMapClick` 的 `mapSelectedFlag` 逻辑
- 🟨 组件逻辑：[component-logic.md § 5.2](./component-logic.md#52-useGeoOpt底图) — `useGeoOpt` 的 `selectedMode`
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-geo-底图配置-geo) — `selectStyle` 字段

**步骤**：

1. **`useGeoOpt` 改为多选**：

```typescript
selectedMode: selectStyleOpt.enable ? 'multiple' : false,
```

2. **`triggerMapClick` 取消选中态切换逻辑**（多选不需要"再次点击取消"）：

```typescript
// 简化 changeMapSelectedFlag 为空函数
const changeMapSelectedFlag = () => {
    mapSelectedFlag = mapCtxCache.current.enablePathSelect ? false : false;
};
// 或：直接移除 changeMapSelectedFlag 调用
```

3. **同步更新 `doc/README.md` § 地图板块选中效果** 章节。

> ⚠️ 实际多选场景还需考虑 `mapCtxCache.current.preSelectedPath` / `rootSelectedPath` 状态机的重置策略（详见 [gotchas.md § 1](./gotchas.md#1-选中态状态机-单选逻辑与多选改造)）。

---

## 任务 8：新增一种 colormap 颜色模式（按 type 字段）

**场景描述**：当前 `layer.path.colormap` 按 `level` 字段染色，希望新增按 `type` 字段染色。

涉及：

- 🟦 Schema：[schema.md § 2.2.2](./schema.md#222-layerpath-板块地图配置) — `layer.path.colormap.colors` 字段加 `type` 字段
- 🟨 组件逻辑：[component-logic.md § 6.2](./component-logic.md#62-layer-opt-pathts板块地图) — `layer-opt-path.ts` 的 `data` 改为按 type 匹配
- 🟦 Schema：[schema.md § 4.3](./schema.md#43-图层-layer-默认) — `colormap.colors` 结构调整

**步骤**：

1. **schema.ts**：`LevelSettings` 已在用，**已支持**任意字段（`LevelSettings` 是通用组件）。但需检查 `colors` 数组元素的 `key` 字段是否就是 `level`：

```typescript
colors: [
    { color: 'rgba(250, 14, 14, 1)', key: '1', text: '' },
    // key 改为 type 字段值，如 'fault' / 'normal'
]
```

2. **`layer-opt-path.ts` 的 `data` 函数**：

```typescript
// 原：const colorCfg = extraCfg.colors.find((c) => c.key === d.level);
// 新：const colorCfg = extraCfg.colors.find((c) => c.key === d.type);
```

> ⚠️ 实际上 `LevelSettings` 的 `key` 是开放字段，可以是 `level` / `type` / 任意字段，**只取决于数据中有什么字段**。若想新增 `colormapBy` 字段让用户选择按哪个字段，需在 schema 中加 Radio。

---

## 任务 9：迁移到 ECharts 新版本

**场景描述**：`@oss-chart/map` 升级到新版本，`MapContainer` / `layerRenderer` API 变化。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.2.6](./component-logic.md#326-渲染-mapcontainer) — `map.tsx` 的 `<MapContainer>`
- 🟨 组件逻辑：[component-logic.md § 6](./component-logic.md#6-三个-opt-builder) — 3 个 opt builder 输出的 option 结构
- 🟨 组件逻辑：[component-logic.md § 4](./component-logic.md#4-子组件) — 4 个 DOM 子组件

**步骤**：

1. **对比新旧 `@oss-chart/map` API**（查阅 `node_modules/@oss-chart/map/CHANGELOG.md`）
2. **修改 `map.tsx` 的 `<MapContainer>` props**（如 `visualMap.inRange.color` 改为新位置）
3. **修改 3 个 builder 输出的 series 结构**（如 `lines` / `scatter` type 名变化）
4. **修改 DOM 子组件中调用 `convertToPixel` 等 API 的代码**

> ⚠️ 这是大版本升级，建议独立 PR，避免影响其他地图物料（`oss-chart-classify-map` / `oss-chart-fly-line-map` 等共用 `@oss-chart/map`）。

---

## 任务 10：地图底图路径调整

**场景描述**：当前 `DEFAULT_GEOJSON = '/map/china.json'`，希望支持私有部署的地图资源。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.2.2](./component-logic.md#322-geojson-加载缓存-promise) — `map.tsx` 的 `geoJsonPromise`

**步骤**：

```typescript
// map.tsx
const DEFAULT_GEOJSON = props.config.geo.mapsettings.defaultGeoJson || '/map/china.json';
// 同时在 schema.ts mapsettings 段加 defaultGeoJson 字段
```

> 注意 `loadJSON` 会自动拼接 `constants.STATIC_PATH`，无需手动加。

---

## 任务 11：新增 item_* 字段类型（如 item_color_xx）

**场景描述**：希望在分组气泡中支持 `item_color_xx`（自定义颜色）。

涉及：

- 🟨 组件逻辑：[component-logic.md § 4.2](./component-logic.md#42-LayerGroupDomScattergroup_scatter010203) — `reg` 正则添加 `(color)` 分支
- 🟨 组件逻辑：[component-logic.md § 6.2](./component-logic.md#62-layer-opt-pathts板块地图) — `style.tooltip.formatter` 同步

**步骤**：

```typescript
// custom-layer/layer-dom/group-scatter/index.tsx
const reg = /^(item_((label)|(value)|(id)|(level)|(color)){1}_)/;

// 在 group.set(groupName, groupItem) 之后添加
if (key.startsWith('item_color_') && !['', '--'].includes(value)) {
    groupItem.color = value;
    groupItem.colorField = key;
}
```

> 数据契约（`dataModel.json`）**无需修改**——`item_*` 是开放字段。

---

## 任务 12：调整派发参数优先级（覆盖默认字段名）

**场景描述**：用户希望派发时 `id` 字段使用 `regionId`（地图区域 ID）作为派发 key，而非数据中的 `id`。

**当前实现**：

- `triggerMapClick` 在 path 分支中设置 `data.id = mapCfg.id`（地图区域 ID）
- 在散点分支中 `Object.assign(data, e.data)`（数据中的 `id`）
- `dispatchInteraction` 读取 `interaction.defined.configurableEvent['id']` 作为派发 key

> 用户在 schema 中可配置派发 key（如 `id` 字段填 `regionId`），组件会**透传**该 key 派发出去。无需改代码。

---

## 任务 13：调试 / 排查

### 13.1 地图不显示

排查顺序：

1. **检查 `map-config.json` 是否加载成功**（在 `index.tsx` 的 `useEffect` 之后 `console.log(state.mapConfig)`）
2. **检查 `currentMapConfig` 是否被过滤掉**（`outlineType === 'china'` 时不过滤）
3. **检查 `geoJson` 路径**（`MapContainer` 接收的 `geoJson` prop 是否为有效 promise）
4. **检查 `mapName`**（`currentMapCache.current.mapName` 是否在 `map-config.json` 中存在）

### 13.2 点击不派发

排查顺序：

1. **检查 `dataConfig.json` 是否在 schema 中配置了字段映射**（id/name/value 是否都映射了）
2. **检查 `interaction.defined.configurableEvent[字段名]` 是否在 schema 的派发参数面板配置了目标 key**
3. **检查 `triggerMapClick` 是否被调用**（添加 `console.log`）
4. **检查 `dispatchInteraction` 的 `interactionKeyValidator`**（过滤掉了 boolean 值）

### 13.3 飞线不显示

排查顺序：

1. **检查 `dataSource` 中 `targetId` 字段是否存在**（数据源需要 `id` / `targetId` / `lon` / `lat`）
2. **检查 `map-config.json` 中 `cp` 字段**（缺 `cp` 时飞线无法绘制）
3. **检查 `style.lines` / `style.scatter` 默认值**（可能因 `normal` 与新 `optionalType` 不匹配）

### 13.4 分组气泡渲染异常

排查顺序：

1. **检查 `item_*` 字段格式**（必须以 `item_label_xx` / `item_value_xx` / `item_id_xx` / `item_level_xx` 开头）
2. **检查 `_format` 后缀**（会被忽略，需保证数据原始字段不带 `_format`）
3. **检查 `group_scatter02` 的 `valueFlexLayout`**（可能影响布局）
4. **检查 `convertToPixel` 是否有 `[left, top]` 返回**（mapConfig 中缺 `cp` 时无法定位）
