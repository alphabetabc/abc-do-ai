---
title: 踩坑记录
description: echarts-map 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-09-17
---

# 踩坑记录

本文档记录 `echarts-map` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ `oss-material.json.dataModel` 是空字符串 `""`

**症状**：配置面板的数据面板里看不到 `name1/value1/subValue1/level1/id/name/parent/num` 等字段说明；或者有人想通过 `oss-material.json` 找到 dataModel 路径找不到。

**原因**：

```json
// oss-material.json
{
    "main": "./index.jsx",
    "schema": "./schema.ts",
    "dataModel": "" // ← 空路径
}
```

**风险**：

-   `schema.ts` 顶部仍然 `import dataModel from './dataModel.json'`，所以 dataModel **仍被 webpack 加载**（用于 schema 类型推导），但物料元信息未声明
-   数据面板用 `CustomDataSource`（自定义数据源），不走 dataModel.json 的字段说明
-   维护时容易认为 dataModel 是空的（但其实是有的！）

**修复**：

-   **短期**：保持 `dataModel: ""`（因为本物料用自管数据源 `CustomDataSource`）
-   **长期**：如果要让数据面板显示字段说明，需要在 `schema.ts` 的 dataConfig 块里手动声明每个字段

## 2. ⚠️ `index.jsx` vs `map.jsx` 入口关系

**症状**：仓库里 `src/packages/echarts-map/` 下有两个看起来都"核心"的文件：

```
index.jsx     ← 顶层入口（49 行）
map.jsx       ← 实际渲染组件（417 行）
```

让人困惑该改哪个。

**原因**：

```json
// oss-material.json
{
    "main": "./index.jsx"
}
```

`oss-material.json.main` 显式指向 `./index.jsx`，webpack 入口**只加载 `index.jsx`**。`index.jsx` 是顶层入口（仅做 3 件事：加载 `map-config.json` + `geoHelper` UMD + 包 `<DataStatus>`），实际渲染逻辑在 `map.jsx` 中。

**风险**：

-   误改 `index.jsx` 不会有渲染效果（因为 `index.jsx` 只是入口 wrapper）
-   误以为 `map.jsx` 是"次要"文件而忽略它
-   维护时极易混淆

**修复**：

-   **短期**：在 `index.jsx` 顶部加 `// 仅做加载入口，请勿在此添加业务逻辑` 注释
-   **长期**：可考虑把 `index.jsx` 的加载逻辑合并到 `map.jsx`，删除 `index.jsx`，但需要先确认没有其他模块 import `index.jsx`（`grep -r "echarts-map" src/` 验证）

## 3. ⚠️ 自管数据源，不走 `props.dataSource`

**症状**：用通用物料的开发经验来理解 echarts-map，期望 `props.dataSource` 有数据，结果发现 props 没有 dataSource 字段。

**原因**：

```jsx
// map.jsx:50
const [dataSource, setDataSource] = useState([]);
// ...
api.customDataSourceApi(dataType, { config, cancel }).then((res) => {
    setDataSource(_.get(res, 'data.data') || _.get(res, 'data.viewItemData.rows'));
});
```

数据源由物料**自管**，通过 `customDataSourceApiConfig` 配置接口请求。

**风险**：

-   误以为 echarts-map 没有数据源配置项
-   在外部 store / context 中塞 dataSource 没用
-   dataModel.json 看起来字段很多（20 个），但其实物料自己请求数据，dataModel 只用于字段说明

**修复**：保持现状，开发时请直接修改 `customDataSourceApiConfig` 数据面板配置。

## 4. ⚠️ `getHighestLevel` 取 `level1~4` 中**最小**的非零数字

**症状**：用户配置 `level1=2, level2=3, level3=4, level4=0`，期望取 `level3=4`，但实际取 `level1=2`。

**原因**：

```typescript
// options.ts:12
const getHighestLevel = (item: Record<string, number>) => {
    const levels = [...Object.entries(item)]
        .map(([key, value]) => {
            const val = key.startsWith(levelKey) && key !== levelKey ? value : 0;
            return Number(val);
        })
        .filter((val) => !_.isNaN(val) && val !== 0);
    if (_.isEmpty(levels)) return null;
    // 最小值为等级最高
    return Math.min(...levels);
};
```

注释说"最小值为等级最高"——业务约定 `levelN` 值越小等级越高（如 1=高、2=中、3=低）。

**风险**：

-   业务方约定 `levelN` 值越大等级越高时，颜色映射反向
-   `levelN=0` 被当成"未设置"过滤掉，匹配 `areaLevelColor` 时会走 default 颜色

**修复**：

-   在 `schema.ts` 的级别色字段加说明：`levelN` 值越小等级越高
-   或修改 `getHighestLevel` 加配置开关

## 5. ⚠️ `id` 字段同时支持 number 和 string，但 `parent` 必须匹配

**症状**：数据中 `parent` 是 number（如 `parent: 110000`），地图显示空白；或 `id` 是字符串但 `parent` 是 number，反之亦然。

**原因**：

```jsx
// map.jsx convertData
const filter = _.filter(data, (item) => [currentId, `${currentId}`, Number(currentId)].includes(item.parent));
```

`currentId` 可能是字符串（如 `'110000'`），`item.parent` 可能是数字（110000）——三种类型都做了兼容。

但 `map-config.json` 的 `id` 是字符串（`"id": "110000"`），`data.id` 也要保持字符串才能 `find({id: String(item.id)})` 查得到。

**风险**：

-   数据源返回 `parent: 110000`（number），`currentId: '110000'`（string）——能匹配（因为 `Number('110000') === 110000`）
-   但反过来 `parent: '110000'`（string），`currentId: 110000`（number）——也能匹配
-   但 `id` 用 `String(item.id)` 转字符串后才能在 mapConfig 中找到

**修复**：

-   数据源返回时**统一使用字符串**类型（与 `map-config.json` 的 `id` 一致）
-   或在 `convertData` 里增加类型转换兜底

## 6. ⚠️ `labelLine` 的 `id` 同时支持 number 和 string

**症状**：

```jsx
const line = _.find(labelLine, { id: item.id }) || _.find(labelLine, { id: String(item.id) });
```

**原因**：同上（id 类型兼容性）。

**修复**：保持现状。

## 7. ⚠️ 区县下钻需要 `enableDrilldownBottomZone = true`

**症状**：期望点击市级地图下钻到区县级，但只看到"无下钻"或直接弹出 Modal。

**原因**：

```jsx
// map.jsx onItemClick
const mapDrilldownLevel = ['province'];
if (latestConfig.current.enableDrilldownBottomZone) mapDrilldownLevel.push('city');
// 默认仅支持省级下钻到市级
```

`enableDrilldownBottomZone` 默认 `false`，必须**显式开启**才能下钻到区县。

**修复**：

-   在 `interactions.configurableEvent.clickEvent.enableDrilldownBottomZone` 中开启
-   注意：`map-config.json` 必须有该区县的 `adcode` 和 `parent` 字段

## 8. ⚠️ 区县下钻底图**不开新文件**

**症状**：区县地图底图不需要在 `${STATIC_PATH}/map/district/` 下找文件，因为根本没有。

**原因**：

```typescript
// options.ts getBottomRegionGeoJson
const { geoJSON } = ec.getMap(parentMapName);  // 父级（地市）的 geoJson
return Promise.resolve({
    ...geoJSON,
    features: _.filter(geoJSON.features, (o) => { ... }),  // 切出对应区县
});
```

区县地图**复用父级（市级）的 features**，按 `adcode` / `name` / `alias` 过滤。

**风险**：

-   误以为缺区县底图，会去补 `${STATIC_PATH}/map/district/${adcode}.json`，结果根本用不上
-   父级 geoJson 必须先 `ec.registerMap`（否则 `ec.getMap` 返回 undefined）

**修复**：保持现状。

## 9. ⚠️ `turf.transformRotate` 依赖 `geoHelper` 加载完成

**症状**：页面初次加载时，地图不显示，控制台报 `Cannot read property 'turf' of undefined`。

**原因**：

```jsx
// index.jsx 顶层入口
const [state, setState] = useSetState({
    initStatus: DataStatus.STATUS.LOADING,
    mapConfig: null,
    geoHelper: {},  // ← 初始值是空对象
});

// 加载完成才更新
Promise.all([loadGeoHelper, mapConfigLoader]).then(([geoHelper, res]) => {
    setState({ geoHelper, ... });
});

// 但 map.jsx 渲染时不等待
const geoJson = props.geoHelper.turf.transformRotate(res, config.geo?.rotateAngle ?? 0);
//                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                    如果 geoHelper 没加载完会报错
```

**风险**：

-   `DataStatus` 包了 `Map`，**理论上应该等 `SUCCESS` 才渲染**——但实测发现某些场景下 `geoHelper` 还没赋值成功就触发了渲染

**修复**：

-   **短期**：保持 `<DataStatus status={state.initStatus}>`，等 `SUCCESS` 再渲染
-   **长期**：可以在 `map.jsx` 顶部加 `if (!props.geoHelper || !props.geoHelper.turf) return null;` 兜底

## 10. ⚠️ `dispatchParams` 每次切图都派发（不是点击才派发）

**症状**：用户在外部订阅 `onClickId` / `onClickName`，期望只有点击地图才收到派发，结果**切换地图层级时也收到了派发**。

**原因**：

```jsx
// map.jsx mapPath useMemo
dispatchParams(mapCfg);
```

`mapPath` 在 `currentName` 变化时重算，每次都 `dispatchParams`——包括：

-   点地图下钻（主动切）
-   返回上一层（主动切）
-   **参数订阅切换（外部被动切）**

**风险**：

-   外部组件可能误以为收到了"点击事件"，实际只是"地图层级变化"

**修复**：

-   **方案 A**：外部订阅时用 `interaction.dispatch` 的 `data[0].fieldName` 区分（不过都是 `onClick*` 字段名）
-   **方案 B**：在 `dispatchParams` 加 `if (interaction.defined?.onClickId && interaction.defined?.onClickName) ...`，让用户自己选择是否订阅
-   **方案 C**：改成"只有点击事件才派发"，但失去了"下钻参数自动同步"的能力

## 11. ⚠️ `subValueFormatter` 用 `subValueDecorationFormatter` 装饰

**症状**：副值（`subValue1~4`）默认显示原始值，不带千分位 / 小数 / 百分比装饰。

**原因**：

```jsx
const subValueFormatter = (value) =>
    indicatorStyle?.showSubValue && !isNil(value) ? `${subValueDecorationFormatter(value, indicatorStyle.subValueDecoration)}` : '';
```

只有 `indicatorStyle.showSubValue = true` 时才显示，`subValueDecoration` 决定装饰方式（千分位 / 小数 / 百分比）。

**修复**：在 `schema.ts` 的 indiStyle 分组配置 `showSubValue` 和 `subValueDecoration`。

## 12. ⚠️ `formatter` 写死最多 4 组指标

**症状**：期望显示 5 组指标，发现 `indicatorStyle.showValueNumber` 最大只能填 4。

**原因**：

```jsx
let res = `{img${...}|${name}${value}${subValue}}${wrap}`;
if (showValueNumber > 1) res += `${separator}{img${...}|...}${wrap}`;
if (showValueNumber > 2) res += `${separator}{img${...}|...}${wrap}`;
if (showValueNumber > 3) res += `${separator}{img${...}|...}`;
// 第 5 组需要再加一个 if 分支
```

`options.ts` 的 `formatter` 写死 4 个分支。

**修复**：

-   修改 `options.ts` 加 `if (showValueNumber > 4) ...`
-   同步修改 `dataModel.json` 添加 `name5/value5/subValue5/level5`
-   详见 [common-tasks.md § 5](./common-tasks.md#任务-5新增--修改气泡指标5-组指标)

## 13. ⚠️ `dataSource.find(d => d.name === item.name)` 的回查可能失败

**症状**：区县级地图点不到，或者 `drilldown` 收到的 `dataItem` 不完整。

**原因**：

```jsx
let dataItem = item.data?.[ORIGINAL_DATA_KEY] ?? item.data;
if (!dataItem && _.isArray(dataSource)) {
    dataItem = dataSource.find((d) => d.name === item.name);
}
```

如果 `item.data` 没有 `ORIGINAL_DATA_KEY` 也没有 `name` 匹配，会拿到 `undefined`。

**风险**：

-   `name` 在两个 series（colorMapOption / 气泡）下分别使用 `currentMapItem.properties.name` 和 `item.name`，可能不一致
-   多区域重名时 `find` 只返回第一个

**修复**：

-   保证 `name` 在 `map-config.json` 和 dataSource 中一致
-   或改用 `id` 匹配（更稳定）

## 14. ⚠️ `preApiCancelTokenRef` 用于取消未完成的请求

**症状**：定时刷新场景下，旧请求未完成时新请求已经发出，导致数据错位。

**原因**：

```jsx
api.customDataSourceApi(dataType, {
    config,
    cancel: (c) => { preApiCancelTokenRef.current = c; },
}).then(...);
```

每次请求前把 cancel token 存到 ref，卸载 / 重启时主动调用取消旧请求。

**修复**：保持现状，不要轻易删除 cancel 逻辑。

## 15. ⚠️ `map-config.json` 和底图文件缺失会引发静默失败

**症状**：用户配置了 `mapName: '北京市'`，但地图不显示，控制台报 `mapConfig 数据缺失`。

**原因**：

```jsx
const geoCoord = _.find(mapConfig, { id: String(item.id) });
if (!geoCoord) {
    console.log('下钻地图 mapConfig 数据缺失', String(item.id));
}
return { ...item, value: geoCoord?.cp || [0, 0] };
```

`map-config.json` 缺失 `id` 时 fallback 到 `[0, 0]`（非洲西海岸），气泡点跑到地图外。

**修复**：

-   检查 `map-config.json` 是否有对应 `id` 的区域字典
-   检查底图文件 `${STATIC_PATH}/map/${level}/${adcode}.json` 是否存在
-   在 console 中查看 `下钻地图 mapConfig 数据缺失` 输出

## 16. ⚠️ 派发的 `onClickLevel` 可能是 `null`（动态枚举索引不受 TS 保护）

**症状**：下游订阅 `onClickLevel`，收到的值是 `null`（而不是 2/3/4）。

**原因**：

```jsx
// map.jsx dispatchParams
state: ZoneLevelEnum[item.level] ?? null,
```

`item.level` 来自 map-config.json（JSON，类型 any），`ZoneLevelEnum[anyKey]` 这种**动态下标取枚举在 TS 编译期完全不设防**（除非项目开启 `noUncheckedIndexedAccess`）。当字典条目的 `level` 缺失、拼写不同（`'City'`）、或新增层级（`'street'`）时，`ZoneLevelEnum[item.level]` 静默返回 `undefined`，再被 `?? null` 转成 `null` 派出去。

**注意**：派出去的 `null` 若被下游组件的"过滤空值参数"逻辑处理，请求里的表现是 **zoneLevel 键整个消失**——与"字段名没配置"的症状完全相同，不能只看键是否存在来区分。

**修复**：

-   下游对 `onClickLevel` 做空值容错，或修 map-config.json 该区域的 `level` 值
-   长期可把映射收敛为白名单函数（穷举 province/city/district），新增层级时有明确修改点

## 17. ⚠️ 派发条目的 `fieldName` 可能是 `undefined` / 空串

**原因**：

```jsx
const actionsParams = Object.keys(interaction?.defined || {}).filter(Boolean);
if (actionsParams.length > 0 && interaction?.dispatch) {
```

`filter(Boolean)` 过滤的是 **key** 不是 value。用户只要配置了任意一个派发字段（如只填 `onClickId`），整组 3 条都会派发——包括未配置字段的 `{ fieldName: undefined, state: ... }`。该条目派出后因 fieldName 匹配不上被框架/下游丢弃，通常无副作用，但接收方若遍历处理 fieldName 可能踩坑。

**修复**：派发前对每条 `fieldName` 判空跳过，或接受现状（框架已宽容处理）。

## 18. ⚠️ 首屏竞态：首次派发可能晚于下游首请求

**症状**：页面刚打开时，下游组件的第一波请求里没有 `regionId/regionName/zoneLevel`，之后切图再请求就正常了。

**原因**：首次派发发生在 `Map` 挂载的 render 期（`mapPath` useMemo 首次执行时）。如果下游组件挂载后立即发起首请求，而派发的参数消费链路晚一拍，**第一次请求自然缺参数**——这是页面级时序问题，不是数据问题。

**判别**：丢失只出现在首屏第一次请求、切图后正常 → 竞态；一直丢 → 查下游对该参数的消费逻辑（null 过滤等）。

**修复**：下游首请求等待参数就绪，或页面层保证物料挂载顺序。

## 19. ⚠️ `currentName` 一次性初始化、无补偿机制

**症状**：权限地图模式下，权限接口晚到或权限区域名与 map-config.json 不一致时，地图空白且**整组派发静默不发生**（regionId/regionName/zoneLevel 全部缺失），之后也不会自愈。

**原因**：

```jsx
// map.jsx useState 初始化，仅求值一次
currentName: config.geo.permission ? permissionZoneName : config.geo.mapsettings.mapName,
```

-   `permissionZoneName`（`designer.permissions.zoneName`）不受 `index.jsx` 的 `Promise.all` 门控管——若权限接口比 Map 挂载慢，初始值为 `undefined`
-   权限名（如"广州市分公司"）与字典名（"广州市"）不一致时，`_.find` 按 name/alias 双查也撞不上
-   `mapPath` useMemo 依赖只有 `[mapInfo.currentName]`，初始失败后没有任何 useEffect 会重置 `currentName`，**死锁**

**注意**：mapConfig 本身不会晚到——`DataStatus` 是**互斥渲染**（LOADING 时 children 不在 React 树中），Map 挂载时 mapConfig 必已就绪。晚到的只有 permissions。

**修复**：加 `useEffect` 监听 `permissionZoneName` 变化，为空/查不到时重置 `currentName`：

```jsx
useEffect(() => {
    if (!mapInfo.currentName && permissionZoneName) {
        setMapInfo({ currentName: permissionZoneName, currentId: zoneId });
    }
}, [permissionZoneName, zoneId]);
```

## 20. 调试小技巧

### 20.1 查看当前地图加载路径

```jsx
// map.jsx mapPath useMemo 内部
console.log('下钻地图 加载底图 mapName', mapCfg, mapInfo.currentName);
```

### 20.2 排查 mapConfig 缺失

```jsx
// map.jsx convertData 内部
if (!geoCoord) {
    console.log('下钻地图 mapConfig 数据缺失', String(item.id));
}
```

### 20.3 排查参数订阅

```jsx
// map.jsx 订阅 effect 内部
// console.log('参数订阅----------------', regionName);
```

### 20.4 排查区县下钻

```jsx
// map.jsx mapPath useMemo 内部
// console.log('log-------------------------loader', mapInfo, mapCfg);
```

### 20.5 临时禁用 `replaceMerge`

```jsx
<ReactECharts option={option} /* 暂时移除 replaceMerge 强制全量 setOption */ />
```

用于排查 series 错位问题（**注意会重置交互状态**）。

### 20.6 查看完整 ECharts option

```typescript
// options.ts getOption 末尾
// console.log('echarts-map-option', JSON.stringify(option));
```

## 21. ✅ 最佳实践

1. **不要修改 `index.jsx`**，所有业务逻辑改动只动 `map.jsx` + `options.ts`
2. **数据走 `customDataSourceApi`**，不要尝试从外部 props 注入
3. **`id` / `parent` 用字符串类型**，与 `map-config.json` 保持一致
4. **`levelN` 值越小等级越高**，配置级别色字段时注意
5. **`id` 配 1 个色**，`areaLevelColor` 数组至少要有一个 `colorField: 'default'` 或 `'0'` 的兜底项
6. **气泡最多 4 组指标**，新增需要改 formatter + dataModel + schema
7. **`enableDrilldownBottomZone = true`** 才能下钻到区县（区县级只触发 Modal 下钻）
8. **map-config.json 和底图文件必须存在**，否则静默失败
9. **`preApiCancelTokenRef` 不要删**，用于取消旧请求
10. **保持 `<DataStatus status={initStatus}>`**，避免 `geoHelper` 未加载时报错
11. **下游组件对 `onClickLevel` 做空值容错**（可能收到 null），且首请求考虑等参数就绪（首屏竞态）
12. **权限地图模式下保证权限区域名与 map-config.json 的 name/alias 一致**，否则整组派发静默断链且不自愈

## 维护历史

| 日期       | 问题                            | 修复                                                               |
| ---------- | ------------------------------- | ------------------------------------------------------------------ |
| 2026-09-17 | 文档化（基于 develop 分支代码） | 首次梳理                                                           |
| 2026-09-17 | 补充派发链路风险点（§16~§19）   | 梳理派发值生成、fieldName 空值、首屏竞态、currentName 初始化无补偿 |
