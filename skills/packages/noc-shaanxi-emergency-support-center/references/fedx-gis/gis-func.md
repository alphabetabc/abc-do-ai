# gisFunc + 我们怎么用

`gisFunc` 是 fedx-gis 提供的工具集；中屏只用了一部分。

- 类型：[gisFunc.d.ts](node_modules/fedx-gis/dist/components/utils/gisFunc.d.ts)

## 完整签名

```ts
declare const gisFunc: {
    createLayerById(layerId: string): VectorLayer;
    getLayerById(map: any, layerId: string): null;            // 注意 type 标的是 null
    getLayerSourceById(map: any, layerId: string): any;
    clearAll(map: any): void;
    showLayer(map: any, layerStates: any): void;              // ← 我们最常用
    registerEvent(map: any, eventName: string, callback: any): void;
    setMapZoom(map: any, zoom: number): void;                 // ← 我们常用
    setMapCenter(map: any, centerLonLat: number[]): void;     // ← 我们常用
    extendToolbars(map: any, nameArr: string[]): void;
    setLocation(layer: any, coordinate: any, imagurl: string): void;
    createPopup(param: PopupParam): Overlay;
    removePopup(map: any, popup: Overlay): void;
    initAnimation(...): void;
    updateAlarmStatus(...): void;
    updateStatus(...): void;
    updatePointStyle(...): void;
    updateLineStyle(map, lineId, color): void;
};
```

下面只列**实际使用**的方法。

---

## setMapCenter / setMapZoom

```ts
const map = getMap();
gisFunc.setMapCenter(map, [longitude, latitude]);  // WGS84
gisFunc.setMapZoom(map, zoomLevel);
```

### 中屏场景

1. **`tab1.CenterPath.drillTownZone` 钻入乡镇**：聚焦 `setMapCenter / setMapZoom`
2. **`tab1.Gis` 抢修回流**：聚焦到告警网元：
   ```ts
   const lon = trans?.[0]?.longitude || machine?.[0]?.longitude || emergencySupportGisConfig.center[0];
   gisFunc.setMapCenter(map, [lon, lat]);
   gisFunc.setMapZoom(map, Number(emergencySupportGisConfig.repairZoom) || 14);
   ```
3. **`tab1.Gis` cityId 变化聚焦**：用 `getPathMapConfigJson().find(...)` 拿到 cp 后 `setMapCenter`
4. **`tab2.Gis` 区域选中聚焦**：用 `currentArea.longitude / latitude / gisLevel`

### 易踩坑

- 调用前**确保 map 已就绪**：`getMap()` 可能返回 undefined
- `setMapZoom` 接数字；如果要带动画，需要 OL `animate` 选项——gisFunc 没有暴露

---

## showLayer（按 neType 切显隐）

```ts
const layerParam = neTypeList.map((item) => ({
    neType: item,
    isShow: neTypeCheckList.indexOf(item) >= 0,
}));
gisFunc.showLayer(map, layerParam);
```

### 中屏场景

#### tab1 / tab2 主图例变化

```ts
useEffect(() => {
    if (neTypeCheckList) {
        const map = getMap();
        const layerParam = neTypeList.map((item) => ({
            neType: item,
            isShow: neTypeCheckList.indexOf(item) >= 0,
        }));
        gisFunc.showLayer(map, layerParam);
        setOpticalState({ showOpticalCableGis: neTypeCheckList.indexOf('5') >= 0 });
    }
}, [neTypeCheckList]);
```

> `neTypeList` 是 `emergencySupportGisConfig.neTypeList` 或 `suddenNeTypeList`。

#### 数据到达时强制重渲

```ts
useEffect(() => {
    if (dataStationPoints || dataTransmissionPoints || dataSuppliesPointsAll || dataMachineryRoomPointsAll) {
        const map = getMap();
        const layerParam = neTypeList.map((item) => ({
            neType: item,
            isShow: neTypeCheckList.indexOf(item) >= 0,
        }));
        gisFunc.showLayer(map, layerParam);
    }
}, [dataStationPoints, dataTransmissionPoints, dataSuppliesPointsAll, dataMachineryRoomPointsAll]);
```

### 易踩坑

- `isShow === false` 会让该 neType 的所有点都隐藏，但**图层依然存在**，所以 `source` 里的数据仍会被 OL 缓存
- `showLayer` 的 `layerStates` 入参 neType 必须全部在 `neTypeList` 内；多传会失效
- 每次 `showLayer` 是全量覆盖，不是差量更新；调用频率不高时无问题

---

## getLayerById / getLayerSourceById

我们**没有直接调用**——`gisFunc.getLayerById(map, layerId)` 在 .d.ts 中返回类型标的是 `null`，但实际是 `import("ol/layer/Vector").default`。

> 排查 bug 需要拿到具体图层 source 时可以用：
> ```ts
> const layer = gisFunc.getLayerById(map, 'layerStationPoints');
> const source = gisFunc.getLayerSourceById(map, 'layerStationPoints');
> ```

---

## 没用但存在的方法

| 方法 | 用途 | 是否需要 |
|---|---|---|
| `createLayerById` | 创建一个空 VectorLayer | 否 |
| `clearAll(map)` | 清空地图所有图层 | 否 |
| `registerEvent` | 监听 OL map 事件 | 否 |
| `extendToolbars` | 工具栏扩展 | 否 |
| `setLocation` | 单点定位 | 否 |
| `createPopup / removePopup` | 手动 popup | 否 |
| `initAnimation` | 光环动画 | 否 |
| `updateAlarmStatus / updateStatus / updatePointStyle` | 刷新告警样式 | 否 |
| `updateLineStyle` | 改线颜色 | 否 |

> 版本：v1.0 · 创建日期：2026-07-13
