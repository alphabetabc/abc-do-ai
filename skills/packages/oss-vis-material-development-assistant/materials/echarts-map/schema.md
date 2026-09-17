---
title: Schema 结构
description: echarts-map schema 分组结构、字段定义、x-component 选择、x-reactions 显隐控制
version: 1.0.0
last_updated: 2026-09-17
---

# Schema 结构

源文件：`packages/echarts-map/schema.ts`（共 ~1700 行）

## 1. 顶层结构

```typescript
{
    materials: 'echarts-map',
    fields: [
        { name: '配置', key: 'config', schema: {...} },            // 9 个 FormCollapse
        { name: '数据', key: 'customDataSourceApiConfig', schema: {...} }, // CustomDataSource（自管）
        { name: '交互', key: 'interactions', schema: {...} },      // 参数订阅 + 单击 + 下钻
    ]
}
```

| 面板 | 通用工厂 | 说明 |
|------|----------|------|
| 配置 | `getCompTitle` + `BASE_LAYOUT` | 标题 + 基础布局 |
| 数据 | `CustomDataSource` (内联) | **物料自管**，平台不接管（`dataRefresh: true`） |
| 交互 | 内联 | 参数订阅 + 派发参数 + 下钻 |

> ⚠️ `oss-material.json.dataModel` 是空字符串 `""`，但 `schema.ts` 顶部 `import dataModel from './dataModel.json'`，webpack 仍会打包。详见 [gotchas.md § 1](../gotchas.md)。

## 2. 配置面板 FormCollapse 分组（config）

### 2.1 顶层结构

```
config
└── $collapse (FormCollapse)
    └── geo (FormCollapse.CollapsePanel "配置")
        ├── $generalSettingFormCollapse (FormCollapse)
        │   ├── $generalSettingFormCollapsePanel "基础配置"
        │   │   ├── permission (Switch)
        │   │   └── tooltipStyle (FormCollapse.CollapsePanel "地图tooltip")
        │   │       └── show (Switch)
        │   │   └── rotateAngle (NumberPicker)
        │   └── dataSourceSwitch (FormCollapse.CollapsePanel "数据源切换按钮")
        │       └── properties: dataSourceSwitchSchemaProperties (来自 @Components/data-source-switch/schema)
        ├── $collapseGoback (FormCollapse)
        │   └── $mapsettings (FormCollapse.CollapsePanel "返回按钮")
        │       ├── backMarginLeft (NumberPicker)
        │       └── backMarginTop (NumberPicker)
        ├── $collapseMargin (FormCollapse)
        │   └── marginSetting (FormCollapse.CollapsePanel "边距设置")
        │       ├── show (Switch 自适应) ⚡ x-reactions 控制 4 向隐藏
        │       └── top/bottom/left/right (Input, 像素/百分比/关键字)
        └── $collapse (FormCollapse)
            ├── $mapsettings (FormCollapse.CollapsePanel "图层设置")
            │   └── mapsettings (GeoJsonSelect) ⚡ permission=true 时隐藏
            ├── mapStyle (FormCollapse.CollapsePanel "地图样式")
            │   ├── borderColor / borderWidth / borderType
            │   ├── shadowOffsetX / shadowOffsetY / shadowBlur / shadowColor
            │   ├── enableAreaColorLevelControl (Switch, default: true) ⚡ 控制 areaColor 与 areaLevelColor 互斥
            │   ├── areaColor (ColorPicker) ⚡ levelControl=true 时 visible=false
            │   ├── areaLevelColor (ColorGroup, default: areaLevelColor)
            │   └── emphasisAreaColor (ColorPicker)
            ├── mapOutlineStyle (FormCollapse.CollapsePanel "地图外轮廓")
            │   ├── show (Switch)
            │   ├── borderColor / borderWidth / borderType
            │   └── shadowColor / shadowOffsetX / shadowOffsetY / shadowBlur
            ├── labelStyle (FormCollapse.CollapsePanel "文本标签")
            │   ├── show / position (top/bottom/left/right)
            │   └── fontFamily / fontSize / color / fontWeight
            ├── indiStyle (FormCollapse.CollapsePanel "指标")
            │   ├── enableLevelControl / enableVerticalLayout / showIndName / showSubValue
            │   ├── showValueScatterSymbol (default: true)
            │   ├── valueScatterGroupPosition (Input, default: 'inside')
            │   ├── enableValueFieldExchange
            │   ├── subValueDecoration (Select: 6 种装饰)
            │   ├── showValueNumber (NumberPicker, 1~4)
            │   ├── fontColor ⚡ levelControl=false 时显示
            │   ├── fontFamily / fontSize / fontWeight
            │   └── height
            ├── $backgroundImage (FormCollapse.CollapsePanel "背景图片")
            │   └── backgroundImage (ArrayCollapse)
            │       └── items: { id, image(Background), size{width,height}, position{left,top} }
            ├── $labelLine (FormCollapse.CollapsePanel "指引线配置")
            │   └── labelLine (ArrayCollapse)
            │       └── items: { id, name, lineStart{lon,lat}, lineEnd{lon,lat}, point{lon,lat} }
            ├── lineStyle (FormCollapse.CollapsePanel "连线样式")
            │   ├── effect (FormCollapse.CollapsePanel "连线箭头样式")
            │   │   ├── show (Switch) ⚡ false 时整个 effect 内子字段隐藏
            │   │   ├── period / trailLength / symbolSize (NumberPicker)
            │   └── normal (FormCollapse.CollapsePanel "连线样式")
            │       └── color / width / opacity / curveness
            └── lineStartPointStyle (FormCollapse.CollapsePanel "连线起始点气泡样式")
                ├── rippleEffect (FormCollapse.CollapsePanel "涟漪特效样式")
                │   └── period / brushType / scale
                └── color / symbolSize
```

### 2.2 FormCollapse 分组详情

#### 2.2.1 基础配置 `$generalSettingFormCollapse`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `permission` | boolean | Switch | 使用权限；开启后自动选中 `permissions.zoneName` 的地图 |
| `tooltipStyle.show` | boolean | Switch | 显示 tooltip（实际仅控制 schema 显示，**当前组件未使用此值**，tooltip 始终显示） |
| `rotateAngle` | number | NumberPicker (step: 0.1) | 地图旋转角度，传入 `geoHelper.turf.transformRotate` |

#### 2.2.2 数据源切换按钮 `dataSourceSwitch`

**导入**：`@Components/data-source-switch/schema` 的 `dataSourceSwitchSchemaProperties`

详见 `packages/echarts-map/index.jsx` 中的 `useDataSourceSwitch` + `DataSourceSwitch` 组件使用方式。

#### 2.2.3 返回按钮 `$collapseGoback`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `backMarginLeft` | number | NumberPicker | 返回按钮距容器左侧 |
| `backMarginTop` | number | NumberPicker | 返回按钮距容器上方 |

#### 2.2.4 边距设置 `marginSetting`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 自适应（开启后地图与容器中心对齐，大小 `min(高,宽)*98%`） |
| `top/bottom/left/right` | string | Input | top/middle/bottom/数字/百分比/auto |

> ⚠️ `show=true` 时 `top/bottom/left/right` 全部 `x-hidden: true`（自适应模式下边距失效）。

#### 2.2.5 图层设置 `$mapsettings`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `mapsettings` | object | `GeoJsonSelect` | 地图选择器（**省级 / 地市级**） |

> ⚠️ `permission=true` 时整个面板隐藏（**地图自动按权限选区**）。

#### 2.2.6 地图样式 `mapStyle`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `borderColor` | string | ColorPicker | 边缘颜色 |
| `borderWidth` | number | NumberPicker | 边缘宽度 |
| `borderType` | string | Select | `solid` / `dashed` / `dotted` |
| `shadowOffsetX/Y` | number | NumberPicker | 阴影水平/垂直偏移 |
| `shadowBlur` | number | NumberPicker | 阴影模糊大小 |
| `shadowColor` | string | ColorPicker | 阴影颜色 |
| `enableAreaColorLevelControl` | boolean | Switch (default: `true`) | 级别控制颜色 |
| `areaColor` | string | ColorPicker | 统一填充色（**levelControl=true 时隐藏**） |
| `areaLevelColor` | array | `ColorGroup` (default: `areaLevelColor`) | 等级填充色数组（**levelControl=false 时隐藏**） |
| `emphasisAreaColor` | string | ColorPicker | 悬浮高亮色 |

> ⚠️ `enableAreaColorLevelControl` 同时控制 `areaColor` 和 `areaLevelColor` 的可见性（`state.visible: false`）。组件内对应 `convertColorMapOption` 的 `enable` 参数。

#### 2.2.7 地图外轮廓 `mapOutlineStyle`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 使用外边框 |
| `borderColor / Width / Type` | mixed | ColorPicker/NumberPicker/Select | 边缘样式 |
| `shadowColor / OffsetX/Y / Blur` | mixed | ColorPicker/NumberPicker | 阴影样式 |

> 💡 组件中通过 `defaultMapOutlineStyle` 兜底（详见 [component-logic.md § 2.2](./component-logic.md)）。

#### 2.2.8 文本标签 `labelStyle`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | boolean | Switch | 显示 / 隐藏 |
| `position` | string | Select | `top` / `bottom` / `left` / `right`（**注意 `bottom ` 末尾有空格**，是个 bug） |
| `fontFamily` | string | Select (`GLOBAL_FONTS`) | 字体 |
| `fontSize` | number | NumberPicker | 字号 |
| `color` | string | ColorPicker | 字体颜色 |
| `fontWeight` | string | Select (`FONT_WEIGHT`) | 字体粗细 |

#### 2.2.9 指标 `indiStyle`（最复杂）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `enableLevelControl` | boolean | Switch | 级别控制指标值颜色（基于 `level1~4`） |
| `enableVerticalLayout` | boolean | Switch | 指标垂直排列 |
| `showIndName` | boolean | Switch | 显示指标名称（`name1~4`） |
| `showSubValue` | boolean | Switch | 显示子指标值（`subValue1~4`） |
| `showValueScatterSymbol` | boolean | Switch (default: `true`) | 显示指标值背景 |
| `valueScatterGroupPosition` | string | Input (default: `'inside'`) | 指标组的位置：`top/left/bottom/right/inside` 或 `"x,y"` 或 `"x%,%y%"` |
| `enableValueFieldExchange` | boolean | Switch | 交换取值字段（默认 `valueX/subValueX`，开启后 `subValueX/valueX`） |
| `subValueDecoration` | string | Select (`SubValueDecoration`) | 子值装饰：无 / `()` / `[]` / `{}` / `<>` / `《》` |
| `showValueNumber` | number | NumberPicker (1~4) | 显示指标的数量（**默认 3**） |
| `fontColor` | string | ColorPicker (default: `#fff`) | 字体颜色（**levelControl=true 时隐藏**） |
| `fontFamily` | string | Select (`GLOBAL_FONTS`) | 字体 |
| `fontSize` | number | NumberPicker | 字号 |
| `fontWeight` | string | Select (`FONT_WEIGHT`) | 字体粗细 |
| `height` | number | NumberPicker | 指标高度（气泡背景高度） |

> 💡 `showValueNumber` 的运行时实际值由 `dataItem.num ?? showValueNumber` 决定，详见 `options.ts:276`。

#### 2.2.10 背景图片 `$backgroundImage`

| 字段 | 数组项结构 |
|------|----------|
| `id` | string（必填，匹配 `mapInfo.currentId`） |
| `image` | `Background` 组件（type: `image`） |
| `size` | `{ width, height }` (NumberPicker + `Space`) |
| `position` | `{ left, top }` (NumberPicker + `Space`) |

> 匹配规则：组件中 `backgroundImage.find(d => [mapInfo.currentId, \`${mapInfo.currentId}\`].includes(d.id))`，**未匹配则用第一项**。

#### 2.2.11 指引线配置 `$labelLine`

| 字段 | 数组项结构 |
|------|----------|
| `id` | string（**必填**，匹配 `dataItem.id`） |
| `name` | string（**选填**，便于配置） |
| `lineStart` | `{ lon, lat }` 连线起点位置 |
| `lineEnd` | `{ lon, lat }` 连线终点位置 |
| `point` | `{ lon, lat }` 连线指标位置（一般与 lineEnd 一致） |

> 运行时匹配规则（`options.ts:91`）：`_.find(labelLine, { id: item.id }) || _.find(labelLine, { id: String(item.id) })`，匹配上则用该指引线，否则直接用数据自带的位置。

#### 2.2.12 连线样式 `lineStyle`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `effect.show` | boolean | Switch | 显示箭头 |
| `effect.period` | number | NumberPicker | 箭头指向速度 |
| `effect.trailLength` | number | NumberPicker (0~1) | 箭头特效尾迹长度 |
| `effect.symbolSize` | number | NumberPicker | 箭头图标大小 |
| `normal.color` | string | ColorPicker | 连线颜色 |
| `normal.width` | number | NumberPicker | 线条宽度 |
| `normal.opacity` | number | NumberPicker (step: 0.1) | 线条透明度 |
| `normal.curveness` | number | NumberPicker (step: 0.1) | 线条曲直度 |

> ⚠️ `effect.show=false` 时整个 `effect` 内的 `period/trailLength/symbolSize` 全部 `x-hidden: true`。

#### 2.2.13 连线起始点气泡样式 `lineStartPointStyle`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `rippleEffect.period` | number | NumberPicker | 波纹速度 |
| `rippleEffect.brushType` | string | Select (`stroke` / `fill`) | 波纹绘制方式 |
| `rippleEffect.scale` | number | NumberPicker | 波纹范围 |
| `color` | string | ColorPicker | 点颜色 |
| `symbolSize` | number | NumberPicker | 点大小 |

### 2.3 关联共享配置 `drilldownCommonSettings`

定义在 schema 文件 `[16-53]` 行，用于 Modal / Drawer 共享字段：

```typescript
{
    mask: { type: 'boolean', title: '显示遮罩', 'x-component': 'Switch' },
    closable: { type: 'boolean', title: '显示关闭', 'x-component': 'Switch' },
    enableDrilldownBottomZone: { type: 'boolean', title: '下钻到最底层', 'x-component': 'Switch' },
}
```

> ⚠️ `enableDrilldownBottomZone` 是**组件级配置**（不只影响 Modal），会改变 `mapDrilldownLevel` 数组。

## 3. 数据面板（customDataSourceApiConfig）

```typescript
{
    name: '数据',
    key: 'customDataSourceApiConfig',
    schema: {
        type: 'object',
        properties: {
            customDataSourceApiConfig: {
                type: 'object',
                title: '地图接口相关配置',
                description: '支持数据集接入',
                'x-component': 'CustomDataSource',
                'x-component-props': {
                    dataRefresh: true,
                },
            },
        },
    },
}
```

> ⚠️ **物料自管数据源**！平台不接管。`map.jsx` 通过 `api.customDataSourceApi(dataType, { config, cancel })` 自定义请求，并在数据上做参数替换。

## 4. 交互面板（interactions）

### 4.1 顶层结构

```
interactions
└── $collapse (FormCollapse)
    ├── $subscribe (FormCollapse.CollapsePanel "参数订阅")
    │   └── regionName (Input "地市名称")
    ├── $action (FormCollapse.CollapsePanel "交互事件")
    │   └── $actionCollapse (FormCollapse)
    │       ├── $onClickAction (FormCollapse.CollapsePanel "单击事件")
    │       │   └── $collapse (FormCollapse)
    │       │       └── '$collapsePanel-click' (FormCollapse.CollapsePanel "派发参数")
    │       │           ├── onClickId (Input)
    │       │           ├── onClickName (Input)
    │       │           └── onClickLevel (Input, tooltip: 省=2;地市=3;区县=4)
    │       └── configurableEvent (FormCollapse.CollapsePanel "统一下钻配置")
    │           └── clickEvent
    │               ├── show (Switch "下钻开关")
    │               ├── effect (Select: Modal / Drawer)
    │               ├── modalSet ⚡ effect==='Modal' 时 visible=true
    │               │   ├── params (Input "url参数")
    │               │   ├── drilldownItemFields (Input "其他参数")
    │               │   ├── position (Space: left, top)
    │               │   ├── size (Space: width, height)
    │               │   ├── closeIconPosition (Space)
    │               │   ├── closeIconFont (Space)
    │               │   └── mask, closable, enableDrilldownBottomZone
    │               └── drawerSet ⚡ effect==='Drawer' 时 visible=true
    │                   ├── params / drilldownItemFields
    │                   ├── title (Input "弹窗标题")
    │                   ├── placement (Select: top/bottom/left/right)
    │                   ├── width (NumberPicker) ⚡ placement=left/right 时可见
    │                   ├── height (NumberPicker) ⚡ placement=top/bottom 时可见
    │                   └── mask, closable, enableDrilldownBottomZone
```

### 4.2 派发参数

```typescript
// map.jsx:179
const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
if (actionsParams.length > 0 && interaction?.dispatch) {
    interaction.dispatch({
        data: [
            { fieldName: interaction.defined?.onClickId,    state: item.id },
            { fieldName: interaction.defined?.onClickName,  state: item.name },
            { fieldName: interaction.defined?.onClickLevel, state: ZoneLevelEnum[item.level] ?? null },
        ],
    });
}
```

> ⚠️ 派发参数面板在下钻开关打开时**自动 disabled**（`'x-disabled': true`）。

### 4.3 下钻开关与 enableDrilldownBottomZone

`enableDrilldownBottomZone` 字段虽然位于 `modalSet/drawerSet` 内，但组件读取的是 `interaction.defined.configurableEvent.clickEvent.enableDrilldownBottomZone`（**所有 Modal / Drawer 共享这一个开关**）。

详见 [component-logic.md § 2.3](./component-logic.md)。

## 5. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `FormCollapse` / `FormCollapse.CollapsePanel` | 分组手风琴 | 全局标配 |
| `FormLayout` | 表单分组布局（点位 + 尺寸 + 位置） | 指引线 / 背景图 / Modal 关闭图标 |
| `Space` | 行内排版 | 圆角 4 向、Modal 位置、Modal 尺寸、字号、位置 |
| `Switch` | 布尔开关 | 通用 |
| `NumberPicker` | 数字输入 | 通用 |
| `Input` | 文本输入 | 通用 |
| `ColorPicker` | 颜色选择器 | 通用 |
| `Select` | 下拉选择 | borderType / position / fontWeight 等 |
| `ColorGroup` | 颜色数组（带 modal 配置） | 仅 `mapStyle.areaLevelColor` |
| `Background` | 背景图片选择器 | `backgroundImage.items.image` |
| `ArrayCollapse` / `ArrayCollapse.CollapsePanel` | 数组卡片 | 指引线配置 / 背景图片 |
| `GeoJsonSelect` | 地图选择器 | 仅 `mapsettings` |
| `CustomDataSource` | 自定义数据源 | 数据面板专用 |
| `FormItem` | 字段装饰器 | 全局标配 |

## 6. 默认值参考

`schema.ts` 末尾 `defaultValue`（1746 行起）：

### 6.1 config

```typescript
{
    title: 'echarts平面地图',
    width: 628, height: 676, left: 476, top: 354.5,
    background: '',
    isLock: false,
    isHidden: false,
    geo: {
        permission: true,
        tooltipStyle: { show: true },
        marginSetting: {
            left: 'center', top: 'middle',
            right: 'auto', bottom: 'auto',
            show: true,  // ⚡ 自适应开启
        },
        backMarginLeft: 0,
        backMarginTop: 0,
        mapsettings: { mapName: '黑龙江' },  // 默认黑龙江省
        mapStyle: {
            borderColor: '#195BB9',
            borderWidth: 0,
            borderType: 'solid',
            shadowBlur: 0,
            shadowOffsetY: 0,
            shadowOffsetX: 0,
            shadowColor: 'rgba(11,11,60,0)',
            areaColor: 'rgba(11,11,60,0)',
            emphasisAreaColor: '#0B0B3B',
        },
        mapOutlineStyle,  // 默认 { show: true, borderColor: '#fff', borderWidth: 2, ... }
        labelStyle: {
            show: true,
            color: 'rgb(255,255,255)',
            fontStyle: 'normal',
            fontWeight: 'normal',
            fontFamily: 'Microsoft YaHei',
            fontSize: 12,
        },
    },
}
```

### 6.2 interactions

```typescript
{
    configurableEvent: {
        clickEvent: {
            show: false,        // 默认关闭下钻
            effect: 'Modal',
            params: '',
            width: 600, height: 600,
            left: 200, top: 100,
            mask: true, closable: true,
            drilldownItemFields: 'id',
            closeIconLeft: 550,
            closeIconTop: 25,
        },
    },
}
```

### 6.3 customDataSourceApiConfig

**无默认值**！需用户通过 `CustomDataSource` 组件配置。

## 7. 跨文档引用

- `areaLevelColor` 默认值 → [data-model.md § 5](./data-model.md)
- 指标 formatter 富文本拼接逻辑 → [component-logic.md § 3.2.4](./component-logic.md)
- 点击下钻 / 派发参数 → [component-logic.md § 2.3](./component-logic.md)
- `map-config.json` 数据源 → [data-model.md § 4](./data-model.md)