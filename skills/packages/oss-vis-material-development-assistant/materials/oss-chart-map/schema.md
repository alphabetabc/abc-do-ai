---
title: Schema 结构
description: oss-chart-map schema 三大面板（配置/数据/交互）+ 6 散点样式配置 + 下钻 + 派发
version: 1.0.0
last_updated: 2026-06-17
---

# Schema 结构

源文件：`packages/oss-chart-map/schema.ts`（约 2117 行）+ `schema-parts/{map-lines.ts, map-scatter.ts, label-line.ts}`

## 1. 顶层结构

```typescript
export const schema = {
    materials: 'oss-chart-ec-map',  // 注：与目录名 oss-chart-map 不同
    fields: [
        { name: '配置', key: 'config', schema: { type: 'object', properties: { config: { ... } } } },
        { name: '数据', key: 'dataConfig', schema: { type: 'object', properties: { dataConfig: { ... } } } },
        { name: '交互', key: 'interactions', schema: { type: 'object', properties: { interactions: { ... } } } },
    ],
};

export const defaultValue = {
    dataConfig: { dataType: 'json', json: [/* 4 条默认数据 */] },
    config: { /* 底图 + layer 完整默认值 */ },
    interactions: { configurableEvent: { drilldownEvent: { ... } } },
};
```

> ⚠️ `materials` 字段值为 `oss-chart-ec-map`（来自 `oss-material.json.name`），与目录名 `oss-chart-map` **不一致**。修改 schema 时**不要改** `materials` 字段。

## 2. FormCollapse 分组详情（config 面板）

`config.properties.config.properties` 包含：

```typescript
{
    ...getCompTitle(material, dataModel),  // 通用标题（title, visible, position）
    ...BASE_LAYOUT,                        // 通用布局（width, height, left, top, background）
    $collapse: { /* 二级 FormCollapse */
        geo: { /* 底图配置 */ },
        layer: { /* 图层配置 */ },
    }
}
```

### 2.1 `geo` 底图配置 `$geo`

| 子组 | 标题 | x-component | 关键字段 | 组件读取方式 |
|------|------|-------------|----------|--------------|
| `$baseConfig` | 基础配置 | `FormCollapse.CollapsePanel` | `show: boolean` / `permission: boolean` | `config.geo.show` / `config.geo.permission`（→ [component-logic.md § 2.2.1](./component-logic.md)） |
| `$mapsettings` | 图层设置 | `FormCollapse.CollapsePanel` + `x-reactions`（受 `permission` 控制） | `mapsettings: GeoJsonSelect`（自定义 x-component） | `config.geo.mapsettings.{mapName, geoJson, outlineType, selectedOutline, customGeoJson}` |
| `padding` | 边距 | `FormCollapse.CollapsePanel` | `top / bottom / left / right: string` | `config.geo.padding.*`（→ [component-logic.md § useGeo](./component-logic.md)） |
| `style` | 样式 | `FormCollapse.CollapsePanel` | `borderColor/borderWidth/borderType/areaColor/emphasisAreaColor` | `config.geo.style.*` |
| `selectStyle` | 选中样式 | `FormCollapse.CollapsePanel` | `enable: boolean`（默认 `true`）+ `itemStyle`（border/borderWidth/borderType/areaColor）+ `label` | `config.geo.selectStyle.*` |
| `label` | 文本标签 | `FormCollapse.CollapsePanel` | `show: boolean` / `fontFamily / fontSize / color / fontWeight` | `config.geo.label.*` |
| `$backgroundImage` | 背景图片 | `FormCollapse.CollapsePanel` + `ArrayCollapse` | `id / image / size / position`（按 id 匹配） | `config.geo.backgroundImage`（→ [component-logic.md § mapBackgroundStyle](./component-logic.md)） |

**关键 x-reactions**：

```typescript
// $mapsettings 受 permission 控制
'$mapsettings': {
    type: 'void',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': { header: '图层设置' },
    'x-reactions': {
        dependencies: ['..permission'],
        when: '{{ $deps[0] === true }}',
        fulfill: { schema: { 'x-hidden': true } },
        otherwise: { schema: { 'x-hidden': false } },
    },
    properties: { mapsettings: { type: 'object', 'x-component': 'GeoJsonSelect' } },
}
```

### 2.2 `layer` 图层配置 `$layer`

```typescript
layer: {
    type: 'object',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': { header: '图层配置' },
    properties: {
        type: { /* Radio.Group：'path' | 'lines' | 'scatter' */ },
        $collapse: { /* 条件子面板 */ },
    }
}
```

#### 2.2.1 `layer.type` 图层类型

| 字段 | 类型 | 标题 | x-component | enum | 说明 |
|------|------|------|-------------|------|------|
| `type` | `string` | 图层类型 | `Radio.Group` | `[{path: '板块地图'}, {lines: '飞线图'}, {scatter: '散点图'}]` | 决定下级 3 个子面板显隐 |

#### 2.2.2 `layer.path` 板块地图配置

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `tooltip` | `boolean` | `Switch` | 开启提示框 |
| `appendToBody` | `boolean` | `Switch` | 是否置顶 tooltip |
| `backgroundColor` | `string` | `ColorPicker` | tooltip 背景色（受 `tooltip` 控制） |
| `borderColor` / `borderWidth` | `string` / `number` | `ColorPicker` / `NumberPicker` | tooltip 边框 |
| `fontFamily` / `fontSize` / `color` / `fontWeight` | `string` | `Select` / `NumberPicker` / `ColorPicker` / `Select` | tooltip 文字 |
| `visualMap` | `boolean` | `Switch` | 开启视觉映射 |
| `maxColor` / `minColor` | `string` | `ColorPicker` | visualMap 颜色梯度 |

> 子面板整体受 `dependencies: ['..type'], when: "{{ $deps[0] === 'path' }}"` 控制。

#### 2.2.3 `layer.lines` 飞线图配置

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `normal.label.*` | object | `FormCollapse.CollapsePanel` | 文本标签（show/fontFamily/fontSize/color/fontWeight/offsetX/offsetY） |
| `normal.style.scatter.*` | object | - | 散点：symbol/symbolSize/showRipple/rippleType/rippleColor/rippleNumber/ripplePeriod/rippleScale/itemColor |
| `normal.style.lines.*` | object | - | 线条：lineType/lineWidth/lineColor/toCenterColor/lineCurveness/lineSymbol/lineSymbolColor/lineSymbolSize/lineTrailLength/linePeriod |

> 完整定义在 `schema-parts/map-lines.ts` 的 `linesNormal`。

#### 2.2.4 `layer.scatter` 散点图配置

最复杂子面板：

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `optionalType` | `string` | `Select` | 6 选 1：`normal` / `single_scatter01` / `single_scatter02` / `group_scatter01` / `group_scatter02` / `group_scatter03` |
| `$preview` | void | `Preview` | 气泡预览（5 个 icons，缺 `group_scatter03`） |
| `[optionalType].*` | object | `FormCollapse.CollapsePanel` | 当前选中类型的子配置（受 `optionalType` 显隐控制） |
| `colormap.show` | `boolean` | `Switch` | 填充图层显示 |
| `colormap.colors` | `array` | `LevelSettings` | 按 `level` 字段染色（仅 `path` 图层读取，schema 共享但只有 path 生效） |

**6 种散点子 schema**（每个都是独立对象，由 `optionalType` 选中其中一个）：

| 子类型 | schema 来源 | 主要子结构 | 关键 props |
|--------|-------------|------------|------------|
| `normal` | `map-scatter.ts` 的 `SCATTER_NORMAL` | `label` + `style` | `style.symbol/symbolSize/ripple*/itemColor` |
| `single_scatter01` | `map-scatter.ts` 的 `SINGLE_SCATTER01` | `label`（含 value/text/arrow 富文本） + `style` | `style.symbol/symbolSize/activeSymbol/activeSymbolSize/showRipple/itemColor` |
| `single_scatter02` | `map-scatter.ts` 的 `SINGLE_SCATTER02` | `scatter`（含 layout/label/value/normal/active） | `scatter.value.normal/active` 图片配置 |
| `group_scatter01` | `map-scatter.ts` 的 `GROUP_SCATTER01` | `scatter`（symbol/labelStyle/position） + `valueGroup`（background/size/position/padding/text/value） | `valueGroup.background = 'map-scatter02-top.png'` |
| `group_scatter02` | `map-scatter.ts` 的 `GROUP_SCATTER02` | 同上 + `valueFlexLayout` + `valueDivider` + `labelLine` | `labelLine` = `LABEL_LINE`（ArrayCollapse） |
| `group_scatter03` | `map-scatter.ts` 的 `GROUP_SCATTER03` | `valueGroup`（含 `colors` 数组按 key 染色） + `scatter` | 多列多行 + 列宽 `columnsWidth` |

### 2.3 `padding` 默认值（geo.padding）

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `top` | `'middle'` | 兼容 `useGeo` 中的 `_.mergeWith({ left: 'center', top: 'middle' }, paddingOpt, (v, o) => o === undefined ? v : undefined)` |
| `bottom` | `'auto'` | |
| `left` | `'center'` | |
| `right` | `'auto'` | |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `FormCollapse` / `FormCollapse.CollapsePanel` | 多级折叠面板 | schema 中出现 10+ 次，2 级嵌套 |
| `GeoJsonSelect` | 自定义底图选择器 | 唯一出现在 `geo.mapsettings` |
| `DynamicData` | 数据源配置 | 渲染 `dataConfig.json` 字段映射面板 |
| `Switch` | 布尔开关 | 大量使用 |
| `ColorPicker` | 颜色选择 | 所有颜色字段 |
| `NumberPicker` | 数字输入 | `step: 1` 用于边框宽度等 |
| `Select` / `Radio.Group` | 单选 | `Radio.Group` 仅 `layer.type` 使用 |
| `ArrayCollapse` / `ArrayCollapse.CollapsePanel` / `ArrayCollapse.Index/Addition/Remove` | 数组项折叠面板 | `geo.backgroundImage` + `group_scatter02.labelLine` |
| `Background` | 背景图片选择 | `geo.backgroundImage.items.properties.image` |
| `Space` | 横向排列 | `formLayout` 内间距 |
| `FormLayout` | 子布局容器 | 用于 `size/position` 字段 |
| `Preview` | 图片预览 | `scatter.$preview`（缺 `group_scatter03`） |
| `LevelSettings` | 多级颜色配置 | `scatter.colormap.colors` |
| `CustomCollapse` | 自定义折叠 | `SCATTER_NORMAL.label` 用了，但实际渲染与 `FormCollapse` 相同 |

## 4. 默认值参考（`schema.ts` 末尾 `defaultValue`）

### 4.1 整体布局

```typescript
config: {
    title: '基础平面地图',  // 来自 material.title
    width: 800,
    height: 600,
    left: 15,
    top: 15,
    background: '',
    isLock: false,
    isHidden: false,
    tooltip: { show: false },
}
```

### 4.2 底图 geo 默认

```typescript
geo: {
    show: true,
    permission: false,
    mapsettings: {
        mapName: 'china',
        geoJson: undefined,
        outlineType: 'china',
        selectedOutline: [],
        customGeoJson: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    },
    padding: { top: 'middle', bottom: 'auto', left: 'center', right: 'auto' },
    style: {
        borderColor: 'rgb(0,98,249)', borderWidth: 1, borderType: 'solid',
        areaColor: 'rgb(0,35,91)', emphasisAreaColor: 'rgb(59,143,197)',
    },
    selectStyle: {
        enable: true,
        itemStyle: {
            borderColor: 'rgb(0,98,249)', borderWidth: 1, borderType: 'solid',
            areaColor: 'rgb(59,143,197)',
        },
        label: { show: true, color: 'rgb(255,255,255)', fontStyle: 'normal', fontWeight: 'normal', fontFamily: 'Microsoft YaHei', fontSize: 18 },
    },
    label: { show: false, color: 'rgb(255,255,255)', fontStyle: 'normal', fontWeight: 'normal', fontFamily: 'Microsoft YaHei', fontSize: 18 },
}
```

### 4.3 图层 layer 默认

```typescript
layer: {
    type: 'path',
    path: { maxColor: 'rgb(32,151,227)', minColor: 'rgb(0,66,162)' },
    // lines 6 个 type 全部有默认值（normal + 5 个 scatter type）
    // 详见 schema.ts 1800-2097 行
    scatter: {
        optionalType: 'normal',
        colormap: { show: false, colors: [] },
        // normal / single_scatter01/02 / group_scatter01/02/03 全部有完整默认
    },
}
```

> ⚠️ **默认值体量超大**（约 400 行）：因 6 种散点样式互斥但全部需要默认配置，新增散点样式时**必须同步添加默认**，否则首次拖入会缺失配置。

### 4.4 数据 dataConfig 默认

```typescript
dataConfig: {
    dataType: 'json',
    sql: {},
    dataSetList: [],
    api: { mode: 'get', url: '', headers: {}, params: {} },
    json: [
        { id: '-1139861561', name: '北京', value: '100', lon: '116.405285', lat: '39.904989', targetId: '354339340', isCenter: '1', level: '1' },
        { id: '354339340', name: '上海', value: 100, lon: '121.472644', lat: '31.231706', targetId: '-1139861561', level: '3' },
        { id: '-1308712042', name: '浙江', value: 100, lon: '120.153576', lat: '29', targetId: '-1139861561', level: '2' },
        { id: '1059902420', name: '四川', value: 10, lon: '103', lat: '30.659462', targetId: '-1139861561', level: '4' },
    ],
    isRefresh: false,
    refreshTime: 5 * 60,
}
```

### 4.5 交互 interactions 默认

```typescript
interactions: {
    configurableEvent: {
        drilldownEvent: {
            show: false,
            layer: 'path',
            effect: 'Modal',
            width: 600, height: 600, left: 200, top: 100,
            mask: true, closable: true,
            closeIconLeft: 25, closeIconTop: 25,
        },
    },
}
```

## 5. 数据面板与交互面板

### 5.1 数据面板（`dataConfig`）

```typescript
{
    name: '数据',
    key: 'dataConfig',
    schema: {
        properties: {
            dataConfig: {
                type: 'object',
                'x-component': 'DynamicData',
                'x-component-props': {
                    options: {
                        height: 300,
                        tooltip: '自动刷新间隔(秒),...',
                        fields: [/* 9 个，与 dataModel.json.indicators 前 9 个一致 */],
                        showDataStatusSwitch: true,
                    },
                },
            },
        },
    },
}
```

> 注：`dataConfig.fields` 与 `dataModel.json.indicators` 不完全相同（前者 9 个，后者 14 个）。修改时**两边都要同步**。

### 5.2 交互面板（`interactions`）

```typescript
{
    name: '交互',
    key: 'interactions',
    schema: {
        properties: {
            interactions: {
                type: 'object',
                properties: {
                    $collapse: {
                        properties: {
                            $action: {
                                properties: {
                                    $actionCollapse: {
                                        properties: {
                                            $onClickAction: {
                                                properties: {
                                                    $collapse: {
                                                        properties: {
                                                            configurableEvent: {
                                                                // 下钻配置
                                                                properties: {
                                                                    drilldownEvent: {
                                                                        properties: {
                                                                            layout: { /* show / layer / effect / modalSet / drawerSet */ },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                            '$collapsePanel-click': {
                                                                // 派发参数
                                                                properties: {
                                                                    autoTrigger: { /* 自动触发 */ },
                                                                    $collapse: {
                                                                        properties: {
                                                                            region: { /* 单击区域/散点：regionName/regionId/regionType/zoneLevel/id/name */ },
                                                                            'data-path': { /* 单击区域：lowerRegionType/upperRegionType/lowerZoneLevel/upperZoneLevel */ },
                                                                            'data-params': { /* 单击散点：type/groupItemId */ },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}
```

**5.2.1 下钻 drilldownEvent**

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | `boolean` | `Switch` | 下钻开关（开启后点击元素不再派发参数，下钻与派发互斥） |
| `layer` | `string` | `Select` | 点击元素：`EC_MAP_LAYER_ENUMS.path`（区域） / `EC_MAP_LAYER_ENUMS.scatter`（打点） |
| `effect` | `string` | `Select` | 事件效果：`Modal` / `Drawer` |
| `modalSet` | object | - | Modal 配置：`params` / `drilldownItemFields` / `position` / `size` / `closeIconPosition` / `closeIconFont` / `mask` / `closable` |
| `drawerSet` | object | - | Drawer 配置：`params` / `drilldownItemFields` / `title` / `placement` / `width` / `height` / `mask` / `closable` |

**5.2.2 派发参数**

| 分组 | 字段 | 默认映射 | 说明 |
|------|------|----------|------|
| `region` 单击区域/散点 | `regionName` / `regionId` / `regionType` / `zoneLevel` / `id` / `name` | 区域为 ID，名称/散点为 name 字段 | 用户可在面板中改名 |
| `data-path` 单击区域 | `lowerRegionType` / `upperRegionType` / `lowerZoneLevel` / `upperZoneLevel` | - | 仅区域有效 |
| `data-params` 单击散点 | `type` / `groupItemId` | `type` 映射数据 `type`，`groupItemId` 映射 `item_id_*` | 仅散点有效 |

> 派发参数实际是**字段名映射**：schema 中的 `regionName: string` 字段值是**实际派发出去时的 key 名**，组件读取 `interaction.defined.configurableEvent[字段名]` 获取用户配置的目标字段。
