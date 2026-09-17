---
title: 常见修改任务
description: echarts-map 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-09-17
---

# 常见修改任务

本文档列出针对 `echarts-map` 最常见的修改需求及对应的代码定位。

> 涉及的代码文件：
> - `index.jsx`：顶层入口（加载 map-config.json + geoHelper + DataStatus 错误态）
> - `map.jsx`：核心渲染组件（state 管理、地图钻取、事件派发）
> - `options.ts`：ECharts option 构造器
> - `schema.ts`：配置面板
> - `dataModel.json`：数据契约

## 任务 1：新增一个区域样式配置项（如区域阴影 / 渐变填充）

**场景描述**：给地图主图层加阴影或渐变填充。

涉及：

- 🟦 Schema：[schema.md § 2.2（图形样式 mapStyle）](./schema.md#22-图形样式-mapstyle)
- 🟨 组件逻辑：[component-logic.md § 4.2.5](./component-logic.md#425-主图层--描边图层)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `geo.mapStyle` 分组下添加：
   ```typescript
   shadowBlur: {
       title: '阴影模糊度',
       type: 'number',
       'x-decorator': 'FormItem',
       'x-component': 'InputNumber',
   },
   ```

2. 在 `options.ts` 的 `basicGeoConfig.itemStyle` 中读取：
   ```typescript
   itemStyle: {
       ..._.omit(mapStyle, omitItemStyleProperties),
       shadowBlur: mapStyle.shadowBlur ?? 0,
       shadowColor: mapStyle.shadowColor ?? '#195BB9',
   },
   ```

3. **注意 `omitItemStyleProperties`**：如果在级别色模式下使用，新字段会同时影响主图层和 colorMapOption，需要从 omit 列表中保留或排除。

## 任务 2：调整级别色规则（如按 `level1` 而非 `level1~4` 最小值）

**场景描述**：业务方希望"按 level1 字段直接取色"，不取 `level1~4` 最小值。

涉及：

- 🟨 组件逻辑：[component-logic.md § 4.2.2](./component-logic.md#422-convertcolormapoption)
- 🟩 数据：[data-model.md § 3.2.2](./data-model.md#322-级别色字段-4-个-level1--level4)

**步骤**：

1. 修改 `options.ts` 的 `convertColorMapOption`：
   ```typescript
   // 原：const highestLevel = getHighestLevel(d);
   // 改：
   const highestLevel = d.level1;
   ```

2. （可选）保留 `getHighestLevel` 但加开关：`if (config.useHighestLevel) highestLevel = getHighestLevel(d);`

## 任务 3：调整默认颜色 / 默认尺寸 / 默认地图层级

涉及文件：

- `schema/defaultValues.ts`：默认 `mapOutlineStyle` / `areaLevelColor`
- `schema.ts` 末尾 `defaultValue.config.geo.mapsettings.mapName` / `defaultValue.config.{width, height}`
- `schema.ts` 末尾 `defaultValue.config.geo.permission`

```typescript
// 示例：调整默认地图层级为中国
// schema.ts 末尾
defaultValue.config.geo.mapsettings.mapName = '中国';
defaultValue.config.width = 800;
defaultValue.config.height = 600;
```

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

## 任务 4：新增下钻事件类型（如 `Window` / `WindowSelf`）

**场景描述**：点击区县级地图需要"打开新浏览器窗口"或"当前窗口打开"，参考 `digital-flop` / `echarts-bar`。

涉及：

- 🟦 Schema：[schema.md § 4.3](./schema.md#43-下钻交互-configurableevent)
- 🟨 组件逻辑：[component-logic.md § 3.3.6](./component-logic.md#336-点击事件-onitemclick)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `effect` Select 选项中追加：
   ```typescript
   { label: '打开新浏览器窗口', value: 'Window' },
   { label: '当前窗口打开', value: 'WindowSelf' },
   ```

2. **注意**：地图的下钻逻辑在 `map.jsx` 的 `onItemClick` 中走的是 `drilldown(props, dataItem, 'clickEvent')`，与条形图不同。需要在 `drilldown` 调用之前或之后追加判断（参考 `echarts-bar` 的实现）。

## 任务 5：新增 / 修改气泡指标（5 组指标）

**场景描述**：超过 4 组指标（如 5 组）。

涉及：

- 🟩 数据：[data-model.md § 3.2.1](./data-model.md#321-指标值相关4-组--3-个--12-个字段)
- 🟦 Schema：[schema.md § 2.6（区域气泡 indiStyle）](./schema.md#26-区域气泡-indistyle)
- 🟨 组件逻辑：[component-logic.md § 4.2.6](./component-logic.md#426-气泡-series-的-formatter核心复杂逻辑)

**步骤**：

1. **dataModel.json**：在 `indicators` 数组添加 `name5/value5/subValue5/level5`
2. **options.ts formatter**：添加 `if (showValueNumber > 4) ...` 分支
3. **schema.ts**：放开 `showValueNumber` 最大值限制（默认最大 4）

## 任务 6：新增交互字段（如派发 `parent`）

**场景描述**：点击区域后需要派发 `parent` 字段以便外部联动。

涉及：

- 🟦 Schema：[schema.md § 4.2](./schema.md#42-单击事件派发参数)
- 🟨 组件逻辑：[component-logic.md § 3.3.5](./component-logic.md#335-派发参数-dispatchparams)

**步骤**：

1. 在 `schema.ts` 的"派发参数"分组加字段：
   ```typescript
   onClickParent: {
       title: '元素:parent',
       type: 'string',
       'x-decorator': 'FormItem',
       'x-component': 'Input',
   },
   ```

2. 在 `map.jsx` 的 `dispatchParams` 中加：
   ```typescript
   {
       fieldName: interaction.defined?.onClickParent,
       state: item.parent,
   },
   ```

## 任务 7：性能优化（大数据量）

**场景描述**：> 5000 个区域 / 大量气泡点时图表卡顿。

涉及：

- 🟨 组件逻辑：[component-logic.md § 7](./component-logic.md#7-性能要点)

**步骤**：

1. 在 `options.ts` 关闭 ECharts 动画：
   ```typescript
   option.animation = false;
   ```

2. 检查 `replaceMerge: ['series', 'geo']` 是否仍然有效（地图系列切换频繁，可能需要 `series` + `geo` 一起替换）

3. 考虑关闭 `enableLevelControl` 和 `showValueNumber > 2`（formatter 的 rich text 复杂度指数级增长）

## 任务 8：新增引线 / 连线类型（如曲线 / 虚线）

**场景描述**：地图需要支持多种引线样式（曲线、虚线、双向箭头）。

涉及：

- 🟦 Schema：[schema.md § 2.7（引线 labelLine）](./schema.md#27-引线-labelline)
- 🟨 组件逻辑：[component-logic.md § 4.2.3](./component-logic.md#423-引线模式-datasource-重写)

**步骤**：

1. 在 `schema.ts` 的 `labelLine` 分组添加字段：
   ```typescript
   lineType: {
       title: '引线类型',
       type: 'string',
       enum: [
           { label: '直线', value: 'solid' },
           { label: '曲线', value: 'curve' },
           { label: '虚线', value: 'dashed' },
       ],
       'x-decorator': 'FormItem',
       'x-component': 'Select',
   },
   ```

2. 在 `options.ts` 的 `lines` series 配置中应用：
   ```typescript
   lineStyle: { ...lineStyle?.normal, type: lineType || 'solid' },
   ```

## 任务 9：调整地图底图加载策略（如支持 CDN）

**场景描述**：地图底图不在 `${STATIC_PATH}/map/` 下，而走 CDN。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.3.3](./component-logic.md#333-地图底图加载-mappathusememo)
- 🟦 Schema：（如新增 CDN 配置）

**步骤**：

1. 修改 `map.jsx` 的 `mapPath` useMemo：
   ```typescript
   // 原：cache.cached(`MAP_CONFIG_SYMBOL_${mapCfg.adcode}`, () => loadJSON(`${constants.STATIC_PATH}/map/${mapCfg.level}/${mapCfg.adcode}.json`));
   // 改：
   cache.cached(`MAP_CONFIG_SYMBOL_${mapCfg.adcode}`, () => loadJSON(`${config.geo.mapCDN || constants.STATIC_PATH}/map/${mapCfg.level}/${mapCfg.adcode}.json`));
   ```

## 任务 11：清理已废弃文件

| 文件 | 状态 | 备注 |
|------|------|------|
| `src/packages/echarts-map/index.jsx` | ✅ 实际加载（顶层入口） | **不要删**，改的是 `map.jsx` |
| `src/packages/echarts-map/map.jsx` | ✅ 实际加载（核心组件） | 不要删 |
| `src/packages/echarts-map/readme.md` | ⚠️ 老版本 | 已被 `doc/README.md` 替代，可清理 |
| `src/packages/echarts-map/doc/CHANGELOG.md` | ⚠️ 仅 0.0.1 | 可补全后续版本 |

> 与 `echarts-bar` 不同，**echarts-map 没有孤儿文件**，但 `index.jsx` 和 `map.jsx` 两个文件容易混淆——详见 [README.md § 2](./README.md) 和 [gotchas.md § 2](./gotchas.md)。

## 任务 12：调整 rotateAngle（地图整体旋转）

**场景描述**：地图需要支持整体旋转（如南海诸岛单独摆放）。

涉及：

- 🟨 组件逻辑：[component-logic.md § 3.3.4](./component-logic.md#334-渲染指标-useeffectmappath-datasource-configgeo-)

**步骤**：

1. 在 `schema.ts` 的 `geo.mapsettings` 分组添加 `rotateAngle`（可能已存在）
2. 在 `map.jsx` 的渲染 effect 中已处理：
   ```typescript
   const geoJson = props.geoHelper.turf.transformRotate(res, config.geo?.rotateAngle ?? 0);
   ```
3. 验证：`geoHelper.turf.transformRotate` 需要 `geoHelper` 已加载（即 `initStatus === SUCCESS`）

## 跨文档快速跳转

| 修改类型 | 文档 |
|---------|------|
| Schema 结构 | [schema.md](./schema.md) |
| 组件代码 | [component-logic.md](./component-logic.md) |
| 数据字段 | [data-model.md](./data-model.md) |
| 踩坑 / 陷阱 | [gotchas.md](./gotchas.md) |
| 总体索引 | [README.md](./README.md) |