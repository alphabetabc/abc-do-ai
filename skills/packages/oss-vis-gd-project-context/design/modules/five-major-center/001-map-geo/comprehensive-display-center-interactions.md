# comprehensive-display-center · map-geo 交互

> 源码：`web/pages/five-major-center/comprehensive-display-center/modules/center/map-view/map-geo/` 下 `index.tsx` / `InfoCard.tsx` / `Legend.tsx`。数据结构见 [comprehensive-display-center-data-model.md](./comprehensive-display-center-data-model.md)。

## 点击选择机制（与 information-hub 同源模式）

`syncState` 状态机（`useRef`，避免闭包过期）：

1. `onMapClick(info)`（EChartsMap 原生事件回调）把真正的处理逻辑存入 `syncState.current.mapClick`，仅当 `info.syncState` 为 true（数据刷新后重放）时立即执行 `triggerMapClick()`。
2. 根节点 `onClick={triggerMapClick}`：先执行 `mapClick`（选中并打开弹窗），置 `needMapMissingTrigger = true`。
3. 再次点击根节点（即「点空白处关闭」）：执行 `missingTrigger` —— `geoUnSelect` + 清空 `infoCard` 关闭弹窗。

这套「点击 → 打开；再点击 → 关闭」的节流由根节点 DOM onClick 驱动，而非 ECharts 事件直接驱动。

## 点位（scatter）点击

`onMapClick` 判定 `info.componentSubType === 'scatter'`：

1. 用 `info.data.__rawData__.zoneId` 反查 `getMapConfig()` 得 `zoneName` / `alias`。
2. `instance.dispatchAction({ type: 'geoSelect', name: zoneName })` 高亮对应 geo 区域，并注册 `missingTrigger`（geoUnSelect + 清弹窗）。
3. 组装 `infoCard = { title, titleAlias, longitude, latitude, zoneId }`，再从 `state.data` 中按 `zoneName` 补 `dataItem`，`setState({ infoCard })` 渲染弹窗。

## 区域（geo）点击

`info.componentType === 'geo'`：按 `info.name`（先 name 后 alias）反查 mapConfig 得 `hit`，再从 `state.data` 按 `zoneId` 找 `dataItem`；找到才组 infoCard（`longitude` / `latitude` 取自 dataItem，即偏移后点位）。同样执行 geoSelect + missingTrigger 注册。

## InfoCard 弹窗

- 渲染于 `OverlayItem`（`mutableLngLat` + `onPositionChange`）：地图缩放/拖动时跟随点位；`onInfoCardPositionChange` 根据纵坐标（`pos[1] + 576 - 80` 与容器高比较）在 `top: -80px` 与 `bottom: 0` 间翻转，防止超出屏幕。
- `InfoCard.tsx` 内部按 `props.legendGroup` 分三种内容：
  - **个人业务**：左侧指标分类 tab（categories 来自 legendCategories children），右上指标卡，下方 `PersonalLineChart`（月/日切换，`getPersonalBusinessLineChartDataApi`）。
  - **家庭业务**：`FamilyBusinessLineChart`（`getFamilyBusinessLineChartDataApi`）。
  - **网络规模**：`NetworkIndCards` 指标卡矩阵（不渲染顶部指标条）。
- 指标请求：`getCenterMapDataApi({ viewItemId: legendGroup, indicatorGroup: activeCategory.value })`，`refreshDeps: [legendGroup, activeCategory]`，`pollingInterval: 5 分钟`。
- 指标行匹配顺序：`zoneName === title` → `zoneName === titleAlias` → `zoneId` 匹配。

## Legend 分类切换（CategoriesSwitch）

- 单选 Checkbox（`checkedKeys` 恒为长度 1 的数组），点击项回调 `{ key, group, dataTypes }`。
- 回调里 `setState({ legendGroup, indicatorGroup, currentDataTypes })`；`EChartsMap key={state.legendGroup}` 导致**整个地图组件按分类重挂载**。
- 挂载时 `useEffect` 会以 `mapDefaults.legendActiveItem`（个人业务）触发一次默认选中。
- seriesBuilder 按 `context.legendGroup` 切换 scatter 图标（个人/政企/家庭/网络四张 SVG）。
- 主数据 `getGuangdongProvincePointsApi()` 不依赖分类（无 refreshDeps，仅首拉一次）。

## 空数据 / 异常表现

- `onMapClick`：`state.data` 为空时直接 return（点击无响应）。
- `indicatorData` 找不到匹配项时取 `[]`，对应区域不渲染指标条 / 趋势图。
- `LineChart`：`data` 或 `data.yData` 为空时 option 为空对象，组件 return null。
- services 层 `err || isEmpty(rows)` 一律返回 `[]`。

## 缓存机制

- `useRefCache` 数据缓存与 `getCacheKey`（`${legendGroup}-${indicatorGroup}`）相关代码**已被注释停用**，当前每次切换都重新请求。
- InfoCard 趋势图与指标均依赖 useRequest 的 `pollingInterval`（5 分钟）轮询刷新。
