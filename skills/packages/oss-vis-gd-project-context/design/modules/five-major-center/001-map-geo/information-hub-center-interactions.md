# information-hub-center · map-geo 交互

> 源码：`web/pages/five-major-center/information-hub-center/modules/center/map-view/map-geo/` 下 `index.tsx` / `Legend.tsx`。数据结构见 [information-hub-center-data-model.md](./information-hub-center-data-model.md)。

## 点击选择机制（与 comprehensive 同源模式）

`syncState` 状态机（`useRef`，避免闭包过期）：

1. `onMapClick(info)`（EChartsMap 原生事件回调）把真正的处理逻辑存入 `syncState.current.mapClick`，仅当 `info.syncState` 为 true（数据刷新后重放）时立即执行 `triggerMapClick()`。
2. 根节点 `onClick={triggerMapClick}`：先执行 `mapClick`（选中并打开弹窗），置 `needMapMissingTrigger = true`。
3. 再次点击根节点（即「点空白处关闭」）：执行 `missingTrigger` —— `geoUnSelect` + 清空 `infoCard` 关闭弹窗。

## 点位（scatter）点击

`info.componentSubType === 'scatter'`：先无条件 `geoSelect`（`info.name`），注册 missingTrigger；infoCard 取 `info.data.value` 坐标、`__rawData` 原始数据、`id = __rawData.regionId`。

## 区域（geo）点击

按 `info.name`（先 name 后 alias）反查 mapConfig，取 `item.cp` 为弹窗坐标，`dataItem = state.data.get(item.id)`。

## 数据刷新重放

`useEffect([state.data])`：轮询（15 分钟）或分类切换刷新数据后，若当前有选中弹窗，用 `{ syncState: true, name, infoCard }` 重放 `onMapClick`，以最新数据重建弹窗内容并保持选中态。

## InfoCard 弹窗（index.tsx 内联实现，无独立 InfoCard.tsx）

内容由 `mapDefaults.infoCardTemplate[当前分类]` 模板驱动：模板的 `list` 项在 `dataItem.items` 中按 `nameField` 匹配（traffType 或 kpiName），取 `valueField` / `unitField` 渲染名称-数值-单位行；未匹配项 value 取 0。

- 渲染于 `OverlayItem`（`mutableLngLat` + `onPositionChange`）：地图缩放/拖动时跟随点位。
- `onInfoCardPositionChange` 对事件/隐患/投诉三类分类**跳过位置翻转**（直接返回），其余分类按 `pos[1] + 576 - 80` 与容器高比较在 `top: -80px` 与 `bottom: 0` 间翻转。

## Legend 分类切换（Legend.tsx）

- Checkbox 单选（`selected.category` 恒为长度 1），`onChange({ category: [value] })`。
- index.tsx `onLegendChange`：`setState({ legend, infoCard: null })` —— 切分类即关闭当前弹窗。
- 数据请求 `refreshDeps: [state.legend.category]` + `pollingInterval: 15 分钟`，参数 `viewItemUnitId: category[0]`。
- Legend children（分级图标）仅展示，不可点击筛选。

## 空数据 / 异常表现

- `onMapClick`：`state.data.size === 0` 直接 return。
- `data.size === 0` 时在地图上叠加一个全屏透明 div（阻断交互的遮罩）。
- seriesBuilder 在 `dataSource.size === 0` 时点位透明（opacity 0）仅显示地名 label（position 切为 center）。

## 缓存机制

- 无数据缓存；`getCacheValue`（`web/utils/CacheLoader`）仅缓存 `legendCategories` 与 `infoCardTemplate` 两份**配置**（含环境配置覆盖逻辑），不缓存接口数据。
